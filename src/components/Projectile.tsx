import { useEffect, useRef } from 'react';
import { RigidBody, BallCollider, type RapierRigidBody } from '@react-three/rapier';
import { PROJECTILE_RADIUS } from '../constants';

interface ProjectileProps {
  position: [number, number, number];
  velocity: [number, number, number];
  onHitPlayer: () => void;
  playerRef: React.RefObject<RapierRigidBody | null>;
}

export default function Projectile({ position, velocity, onHitPlayer, playerRef }: ProjectileProps) {
  const rb = useRef<RapierRigidBody>(null);

  useEffect(() => {
    if (rb.current) {
      rb.current.setLinvel({ x: velocity[0], y: velocity[1], z: velocity[2] }, true);
    }
  }, [velocity]);

  return (
    <RigidBody
      ref={rb}
      type="dynamic"
      position={position}
      gravityScale={0}
      colliders={false}
      ccd
    >
      <BallCollider
        args={[PROJECTILE_RADIUS]}
        sensor
        onIntersectionEnter={(payload) => {
          const otherBody = payload.other.rigidBody;
          if (otherBody && playerRef.current && otherBody === playerRef.current) {
            onHitPlayer();
          }
        }}
      />
      <mesh>
        <sphereGeometry args={[PROJECTILE_RADIUS, 8, 8]} />
        <meshStandardMaterial
          color="#ff4400"
          emissive="#ff4400"
          emissiveIntensity={0.8}
        />
      </mesh>
    </RigidBody>
  );
}
