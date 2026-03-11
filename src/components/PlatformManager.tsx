import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { type RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import Platform from './Platform';
import type { PlatformData } from '../types';
import { useGameStore } from '../store';
import {
  generateStartPlatform,
  generateNextPlatform,
  resetPlatformGenerator,
} from '../hooks/usePlatformGenerator';
import {
  SPAWN_DISTANCE,
  DESPAWN_DISTANCE,
  INITIAL_PLATFORM_COUNT,
} from '../constants';

interface PlatformManagerProps {
  playerRef: React.RefObject<RapierRigidBody | null>;
}

export default function PlatformManager({ playerRef }: PlatformManagerProps) {
  const [platforms, setPlatforms] = useState<PlatformData[]>([]);
  const lastPlatformPos = useRef(new THREE.Vector3(0, 0, 0));
  const lastPlatformDepth = useRef(5);
  const getDifficulty = useGameStore((s) => s.getDifficulty);
  const phase = useGameStore((s) => s.phase);
  const initialized = useRef(false);

  // Initialize platforms
  useEffect(() => {
    if (phase === 'playing') {
      resetPlatformGenerator();
      const initial: PlatformData[] = [];
      const startPlatforms = generateStartPlatform();
      initial.push(...startPlatforms);
      // Use the last spawn piece (catwalk end) as the anchor for generation
      lastPlatformPos.current.copy(startPlatforms[startPlatforms.length - 1].position);

      lastPlatformDepth.current = startPlatforms[startPlatforms.length - 1].depth;

      for (let i = 0; i < INITIAL_PLATFORM_COUNT; i++) {
        const platform = generateNextPlatform(lastPlatformPos.current, 0, lastPlatformDepth.current);
        initial.push(platform);
        lastPlatformPos.current.copy(platform.position);
        lastPlatformDepth.current = platform.depth;
      }

      setPlatforms(initial);
      initialized.current = true;
    }

    return () => {
      initialized.current = false;
    };
  }, [phase]);

  useFrame(() => {
    if (!playerRef.current || !initialized.current || phase !== 'playing') return;

    const playerZ = playerRef.current.translation().z;
    const difficulty = getDifficulty();
    let changed = false;
    let newPlatforms = [...platforms];

    // Spawn ahead
    while (lastPlatformPos.current.z < playerZ + SPAWN_DISTANCE) {
      const platform = generateNextPlatform(lastPlatformPos.current, difficulty, lastPlatformDepth.current);
      newPlatforms.push(platform);
      lastPlatformPos.current.copy(platform.position);
      lastPlatformDepth.current = platform.depth;
      changed = true;
    }

    // Despawn behind
    const beforeCount = newPlatforms.length;
    newPlatforms = newPlatforms.filter(
      (p) => p.position.z > playerZ - DESPAWN_DISTANCE,
    );
    if (newPlatforms.length !== beforeCount) changed = true;

    if (changed) {
      setPlatforms(newPlatforms);
    }
  });

  return (
    <>
      {platforms.map((p) => (
        <Platform key={p.id} data={p} />
      ))}
    </>
  );
}
