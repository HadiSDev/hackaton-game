import { useRef, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { type RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import Projectile from './Projectile';
import { useGameStore } from '../store';
import type { TowerData } from '../types';
import {
  TOWER_HEIGHT,
  TOWER_RADIUS,
  PROJECTILE_SPEED,
  PROJECTILE_LIFETIME,
  PROJECTILE_MAX_ACTIVE,
  RESPAWN_INVINCIBILITY,
} from '../constants';

interface ProjectileState {
  id: number;
  position: [number, number, number];
  velocity: [number, number, number];
  spawnTime: number;
}

interface TowerProps {
  data: TowerData;
  playerRef: React.RefObject<RapierRigidBody | null>;
}

let nextProjectileId = 0;

export default function Tower({ data, playerRef }: TowerProps) {
  const [projectiles, setProjectiles] = useState<ProjectileState[]>([]);
  const fireTimer = useRef(data.fireRate);
  const cannonRef = useRef<THREE.Mesh>(null);
  const lastHitTime = useRef(0);
  const loseLife = useGameStore((s) => s.loseLife);
  const phase = useGameStore((s) => s.phase);

  const cannonY = data.position.y + TOWER_HEIGHT / 2;

  const onHitPlayer = useCallback(() => {
    const now = performance.now() / 1000;
    if (now - lastHitTime.current < RESPAWN_INVINCIBILITY) return;
    lastHitTime.current = now;
    loseLife();
  }, [loseLife]);

  useFrame((state, delta) => {
    if (phase !== 'playing' || !playerRef.current) return;

    const now = state.clock.elapsedTime;

    // Charge glow effect on cannon
    if (cannonRef.current) {
      const timeToFire = fireTimer.current;
      const mat = cannonRef.current.material as THREE.MeshStandardMaterial;
      if (timeToFire < 0.3) {
        mat.emissiveIntensity = 0.4 + (1 - timeToFire / 0.3) * 1.5;
      } else {
        mat.emissiveIntensity = 0.4;
      }
    }

    fireTimer.current -= delta;

    if (fireTimer.current <= 0 && projectiles.length < PROJECTILE_MAX_ACTIVE) {
      // Aim at player
      const playerPos = playerRef.current.translation();
      const spawnPos: [number, number, number] = [
        data.position.x,
        cannonY,
        data.position.z,
      ];

      const dir = new THREE.Vector3(
        playerPos.x - spawnPos[0],
        playerPos.y - spawnPos[1],
        playerPos.z - spawnPos[2],
      ).normalize();

      const speed = data.projectileSpeed || PROJECTILE_SPEED;
      const velocity: [number, number, number] = [
        dir.x * speed,
        dir.y * speed,
        dir.z * speed,
      ];

      setProjectiles((prev) => [
        ...prev,
        {
          id: nextProjectileId++,
          position: spawnPos,
          velocity,
          spawnTime: now,
        },
      ]);

      fireTimer.current = data.fireRate;
    }

    // Clean up expired projectiles
    setProjectiles((prev) =>
      prev.filter((p) => now - p.spawnTime < PROJECTILE_LIFETIME),
    );
  });

  return (
    <group>
      {/* Tower body */}
      <mesh
        position={[data.position.x, data.position.y, data.position.z]}
        castShadow
      >
        <cylinderGeometry args={[TOWER_RADIUS, TOWER_RADIUS * 1.3, TOWER_HEIGHT, 8]} />
        <meshStandardMaterial color="#cc2222" emissive="#cc2222" emissiveIntensity={0.2} />
      </mesh>

      {/* Cannon sphere */}
      <mesh
        ref={cannonRef}
        position={[data.position.x, cannonY, data.position.z]}
        castShadow
      >
        <sphereGeometry args={[TOWER_RADIUS * 1.5, 8, 8]} />
        <meshStandardMaterial color="#ff4444" emissive="#ff4444" emissiveIntensity={0.4} />
      </mesh>

      {/* Projectiles */}
      {projectiles.map((p) => (
        <Projectile
          key={p.id}
          position={p.position}
          velocity={p.velocity}
          onHitPlayer={onHitPlayer}
          playerRef={playerRef}
        />
      ))}
    </group>
  );
}
