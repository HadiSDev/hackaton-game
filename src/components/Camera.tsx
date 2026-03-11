import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { type RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';

const CAMERA_OFFSET = new THREE.Vector3(0, 5, -10);
const LOOK_AHEAD = new THREE.Vector3(0, 1, 8);
const LERP_SPEED = 4;

interface CameraProps {
  playerRef: React.RefObject<RapierRigidBody | null>;
}

export default function Camera({ playerRef }: CameraProps) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3());
  const lookAtPos = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    if (!playerRef.current) return;

    const playerPos = playerRef.current.translation();
    const pv = new THREE.Vector3(playerPos.x, playerPos.y, playerPos.z);

    targetPos.current.copy(pv).add(CAMERA_OFFSET);
    lookAtPos.current.copy(pv).add(LOOK_AHEAD);

    camera.position.lerp(targetPos.current, LERP_SPEED * delta);
    camera.lookAt(lookAtPos.current);
  });

  return null;
}
