import * as THREE from 'three';

export type PlatformType = 'static' | 'moving' | 'crumbling';

export interface PlatformData {
  id: number;
  position: THREE.Vector3;
  width: number;
  depth: number;
  type: PlatformType;
  // Moving platform params
  moveAxis?: 'x' | 'y';
  moveAmplitude?: number;
  moveSpeed?: number;
  moveOffset?: number;
  // Color
  color: string;
}

export interface TowerData {
  id: number;
  position: THREE.Vector3;
  platformId: number;
  fireRate: number;
  projectileSpeed: number;
}
