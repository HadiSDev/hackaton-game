import { useRef, useCallback, useEffect, forwardRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, BallCollider, CuboidCollider, type RapierRigidBody } from '@react-three/rapier';
import { Trail } from '@react-three/drei';
import type { Mesh } from 'three';
import { useGameStore } from '../store';
import {
  JUMP_FORCE,
  PLAYER_FORWARD_SPEED,
  PLAYER_LATERAL_SPEED,
  PLAYER_RADIUS,
  COYOTE_TIME,
  JUMP_BUFFER_TIME,
  DEATH_Y_THRESHOLD,
  RESPAWN_INVINCIBILITY,
} from '../constants';

// Bounce physics constants
const BOUNCE_SPRING = 25;       // Spring stiffness — how fast it oscillates
const BOUNCE_DAMPING = 6;       // How quickly oscillation dies out
const BOUNCE_LAND_IMPULSE = 0.8; // Base squash impulse on landing (scaled by impact speed)
const BOUNCE_JUMP_IMPULSE = -0.6; // Stretch impulse on jump (negative = elongate)
const AIRBORNE_STRETCH = 0.12;  // How much Y velocity affects shape in air
const MAX_SQUASH = 0.5;         // Don't squash below this Y scale
const MAX_STRETCH = 1.6;        // Don't stretch above this Y scale

const Player = forwardRef<RapierRigidBody>((_, ref) => {
  const rigidBody = useRef<RapierRigidBody>(null);
  const meshRef = useRef<Mesh>(null!);
  const grounded = useRef(false);
  const coyoteTimer = useRef(0);
  const jumpBufferTimer = useRef(0);
  const keys = useRef({ left: false, right: false, forward: false, backward: false });
  const hasJumped = useRef(false);
  const jumpVelocity = useRef<number | null>(null);
  const loseLife = useGameStore((s) => s.loseLife);
  const phase = useGameStore((s) => s.phase);
  const invincibilityTimer = useRef(0);
  const blinkTimer = useRef(0);

  // Spring-based bounce state
  const bounceDisplacement = useRef(0); // current spring displacement (+ = squashed, - = stretched)
  const bounceVelocity = useRef(0);     // spring velocity
  const lastYVel = useRef(0);           // track previous Y velocity for impact detection
  const lastSetVel = useRef<{ x: number; y: number; z: number } | null>(null); // track what we set vs what physics returns

  // Sync forwarded ref
  useEffect(() => {
    if (typeof ref === 'function') {
      ref(rigidBody.current);
    } else if (ref) {
      ref.current = rigidBody.current;
    }
  });

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.current.left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.current.right = true;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') keys.current.forward = true;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') keys.current.backward = true;
    if (e.code === 'Space') {
      jumpBufferTimer.current = JUMP_BUFFER_TIME;
    }
  }, []);

  const handleTouch = useCallback(() => {
    jumpBufferTimer.current = JUMP_BUFFER_TIME;
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.current.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.current.right = false;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') keys.current.forward = false;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') keys.current.backward = false;
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('touchstart', handleTouch);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('touchstart', handleTouch);
    };
  }, [handleKeyDown, handleKeyUp, handleTouch]);

  useFrame((_, delta) => {
    if (!rigidBody.current || phase !== 'playing') return;

    const rb = rigidBody.current;
    const pos = rb.translation();
    const vel = rb.linvel();

    // Invincibility countdown + blink effect
    if (invincibilityTimer.current > 0) {
      invincibilityTimer.current -= delta;
      blinkTimer.current += delta;
      if (meshRef.current) {
        meshRef.current.visible = Math.floor(blinkTimer.current * 10) % 2 === 0;
      }
      if (invincibilityTimer.current <= 0) {
        if (meshRef.current) meshRef.current.visible = true;
      }
    }

    // Death check
    if (pos.y < DEATH_Y_THRESHOLD && invincibilityTimer.current <= 0) {
      const lastPos = useGameStore.getState().lastPlatformPosition;
      loseLife();
      // If still playing (lives > 0), respawn
      if (useGameStore.getState().phase === 'playing') {
        rb.setTranslation({ x: lastPos.x, y: lastPos.y + 3, z: lastPos.z }, true);
        rb.setLinvel({ x: 0, y: 0, z: PLAYER_FORWARD_SPEED }, true);
        lastSetVel.current = { x: 0, y: 0, z: PLAYER_FORWARD_SPEED };
        invincibilityTimer.current = RESPAWN_INVINCIBILITY;
        blinkTimer.current = 0;
        grounded.current = false;
        hasJumped.current = false;
      }
      return;
    }

    // Coyote time
    if (grounded.current) {
      coyoteTimer.current = COYOTE_TIME;
    } else {
      coyoteTimer.current -= delta;
    }

    // Jump buffer
    jumpBufferTimer.current -= delta;

    // Jump
    const canJump = grounded.current || coyoteTimer.current > 0;
    const wantsJump = jumpBufferTimer.current > 0;

    if (canJump && wantsJump && !hasJumped.current) {
      jumpVelocity.current = JUMP_FORCE;
      hasJumped.current = true;
      grounded.current = false;
      coyoteTimer.current = 0;
      jumpBufferTimer.current = 0;
      // Kick the spring into stretch on jump
      bounceVelocity.current += BOUNCE_JUMP_IMPULSE * BOUNCE_SPRING;
    }

    // Apply jump velocity if pending
    let yVel = jumpVelocity.current !== null ? jumpVelocity.current : vel.y;
    jumpVelocity.current = null;

    // Detect collision bounce — if physics pushed us in X or Z unexpectedly, preserve it
    // We track what we *set* last frame vs what physics gave us back
    const physicsBounceX = vel.x - (lastSetVel.current?.x ?? vel.x);
    const physicsBounceZ = vel.z - (lastSetVel.current?.z ?? vel.z);
    const hasBounce = Math.abs(physicsBounceX) > 0.5 || Math.abs(physicsBounceZ) > 0.5;

    // Lateral control — blend toward target for smooth air control
    const lateralInput =
      (keys.current.left ? 1 : 0) + (keys.current.right ? -1 : 0);
    const targetX = lateralInput * PLAYER_LATERAL_SPEED;
    const lerpFactor = grounded.current ? 15 : 8;

    // Forward/backward control
    const forwardInput =
      (keys.current.forward ? 1 : 0) + (keys.current.backward ? -1 : 0);
    const targetZ = PLAYER_FORWARD_SPEED + forwardInput * PLAYER_FORWARD_SPEED * 0.5;

    let newX: number;
    let newZ: number;

    if (hasBounce) {
      // Let physics bounce play out — blend back to input control gradually
      const bounceDecay = Math.min(3 * delta, 1);
      newX = vel.x + (targetX - vel.x) * bounceDecay;
      newZ = vel.z + (targetZ - vel.z) * bounceDecay;
      // Collision can also affect Y — add a small upward kick on side hits
      if (Math.abs(physicsBounceX) > 1) {
        yVel = Math.max(yVel, JUMP_FORCE * 0.3);
      }
    } else {
      newX = vel.x + (targetX - vel.x) * Math.min(lerpFactor * delta, 1);
      newZ = vel.z + (targetZ - vel.z) * Math.min(lerpFactor * delta, 1);
    }

    rb.setLinvel({ x: newX, y: yVel, z: newZ }, true);
    lastSetVel.current = { x: newX, y: yVel, z: newZ };

    // --- Spring-based bounce physics ---
    // Simulate a damped spring: F = -kx - bv
    const springForce = -BOUNCE_SPRING * bounceDisplacement.current - BOUNCE_DAMPING * bounceVelocity.current;
    bounceVelocity.current += springForce * delta;
    bounceDisplacement.current += bounceVelocity.current * delta;

    // Airborne: add subtle velocity-driven stretch
    let airStretch = 0;
    if (!grounded.current) {
      airStretch = -vel.y * AIRBORNE_STRETCH * 0.05; // falling = squash, rising = stretch
    }

    // Compute scale: displacement > 0 = squash (wide + short), < 0 = stretch (narrow + tall)
    const d = bounceDisplacement.current + airStretch;
    const scaleY = Math.max(MAX_SQUASH, Math.min(MAX_STRETCH, 1 - d));
    // Preserve volume: scaleX * scaleY * scaleZ ≈ 1 → scaleXZ = 1/sqrt(scaleY)
    const scaleXZ = Math.min(1.5, 1 / Math.sqrt(scaleY));

    if (meshRef.current) {
      meshRef.current.scale.set(scaleXZ, scaleY, scaleXZ);
    }

    lastYVel.current = vel.y;
  });

  const wasAirborne = useRef(false);

  const onGroundEnter = () => {
    if (!grounded.current && wasAirborne.current) {
      // Impact-based squash: harder landing = bigger squash — only once per landing
      const impactSpeed = Math.abs(lastYVel.current);
      const normalizedImpact = Math.min(impactSpeed / 15, 1);
      const impulse = BOUNCE_LAND_IMPULSE * (0.3 + normalizedImpact * 0.7);
      bounceVelocity.current = impulse * BOUNCE_SPRING; // set, not add — prevents stacking
      wasAirborne.current = false;
    }
    grounded.current = true;
    hasJumped.current = false;
  };

  const onGroundExit = () => {
    grounded.current = false;
    wasAirborne.current = true;
  };

  return (
    <RigidBody
      ref={rigidBody}
      position={[0, 4, 0]}
      colliders={false}
      mass={1}
      linearDamping={0}
      angularDamping={1}
      enabledRotations={[false, false, false]}
      ccd
    >
      <Trail
        width={1.5}
        length={6}
        color="#ff6b35"
        attenuation={(t) => t * t}
      >
        <mesh ref={meshRef} castShadow>
          <sphereGeometry args={[PLAYER_RADIUS, 16, 16]} />
          <meshStandardMaterial
            color="#ff6b35"
            emissive="#ff6b35"
            emissiveIntensity={0.3}
          />
        </mesh>
      </Trail>

      {/* Main collider — ball shape so it bounces off edges naturally */}
      <BallCollider args={[PLAYER_RADIUS]} restitution={0.4} friction={0.3} />

      {/* Ground sensor */}
      <CuboidCollider
        args={[PLAYER_RADIUS * 0.6, 0.05, PLAYER_RADIUS * 0.6]}
        position={[0, -PLAYER_RADIUS - 0.05, 0]}
        sensor
        onIntersectionEnter={onGroundEnter}
        onIntersectionExit={onGroundExit}
      />
    </RigidBody>
  );
});

Player.displayName = 'Player';
export default Player;
