import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider, type RapierRigidBody } from '@react-three/rapier';
import type { PlatformData } from '../types';
import { PLATFORM_HEIGHT, CRUMBLE_DELAY } from '../constants';
import { useGameStore } from '../store';

interface PlatformProps {
  data: PlatformData;
}

export default function Platform({ data }: PlatformProps) {
  const { id, position, width, depth, type, color, moveAxis, moveAmplitude, moveSpeed, moveOffset } = data;
  const rigidBody = useRef<RapierRigidBody>(null);
  const [crumbling, setCrumbling] = useState(false);
  const [fallen, setFallen] = useState(false);
  const crumbleTimer = useRef<number | null>(null);
  const shakeOffset = useRef(0);

  const incrementScore = useGameStore((s) => s.incrementScore);
  const lastLandedPlatformId = useGameStore((s) => s.lastLandedPlatformId);
  const setLastLandedPlatformId = useGameStore((s) => s.setLastLandedPlatformId);

  useFrame((state) => {
    if (!rigidBody.current) return;

    if (type === 'moving' && !fallen) {
      const time = state.clock.getElapsedTime();
      const amp = moveAmplitude || 1.5;
      const spd = moveSpeed || 2;
      const off = moveOffset || 0;
      const offset = Math.sin(time * spd + off) * amp;

      const newPos = {
        x: position.x + (moveAxis === 'x' ? offset : 0),
        y: position.y + (moveAxis === 'y' ? offset : 0),
        z: position.z,
      };
      rigidBody.current.setNextKinematicTranslation(newPos);
    }

    if (crumbling && !fallen) {
      // Shake effect
      shakeOffset.current = (Math.random() - 0.5) * 0.1;
      const pos = rigidBody.current.translation();
      rigidBody.current.setNextKinematicTranslation({
        x: pos.x + shakeOffset.current,
        y: pos.y,
        z: pos.z,
      });
    }
  });

  const handleCollision = () => {
    // Score: only increment on first landing
    if (id > lastLandedPlatformId) {
      setLastLandedPlatformId(id);
      if (id > 0) {
        incrementScore();
      }
    }

    // Crumbling platform logic
    if (type === 'crumbling' && crumbleTimer.current === null) {
      setCrumbling(true);
      crumbleTimer.current = window.setTimeout(() => {
        setFallen(true);
      }, CRUMBLE_DELAY * 1000);
    }
  };

  if (fallen) return null;

  const bodyType = type === 'static' ? 'fixed' : 'kinematicPosition';

  return (
    <RigidBody
      ref={rigidBody}
      type={bodyType}
      position={[position.x, position.y, position.z]}
      colliders={false}
    >
      <CuboidCollider
        args={[width / 2, PLATFORM_HEIGHT / 2, depth / 2]}
        restitution={0.3}
        friction={0.5}
        onCollisionEnter={handleCollision}
      />
      <mesh receiveShadow castShadow>
        <boxGeometry args={[width, PLATFORM_HEIGHT, depth]} />
        <meshStandardMaterial
          color={crumbling ? '#ff4444' : color}
          emissive={crumbling ? '#ff0000' : color}
          emissiveIntensity={crumbling ? 0.4 : 0.1}
        />
      </mesh>
    </RigidBody>
  );
}
