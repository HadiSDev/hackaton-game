import { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { type RapierRigidBody } from '@react-three/rapier';
import Player from './Player';
import PlatformManager from './PlatformManager';
import Camera from './Camera';
import Environment from './Environment';
import HUD from './HUD';
import { GRAVITY_SCALE } from '../constants';

export default function Game() {
  const playerRef = useRef<RapierRigidBody>(null);

  return (
    <>
      <Canvas
        shadows
        camera={{ position: [0, 7, -10], fov: 60 }}
        style={{ width: '100vw', height: '100vh' }}
      >
        <color attach="background" args={['#0f0f23']} />
        <Physics gravity={[0, -9.81 * GRAVITY_SCALE, 0]}>
          <Player ref={playerRef} />
          <PlatformManager playerRef={playerRef} />
        </Physics>
        <Camera playerRef={playerRef} />
        <Environment />
      </Canvas>
      <HUD />
    </>
  );
}
