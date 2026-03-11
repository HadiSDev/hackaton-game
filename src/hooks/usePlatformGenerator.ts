import * as THREE from 'three';
import type { PlatformData, PlatformType, TowerData } from '../types';
import {
  PLATFORM_WIDTH_MIN,
  PLATFORM_WIDTH_MAX,
  PLATFORM_DEPTH_MIN,
  PLATFORM_DEPTH_MAX,
  PLATFORM_HEIGHT,
  GAP_DISTANCE_MIN,
  GAP_DISTANCE_MAX,
  HEIGHT_DELTA_MIN,
  HEIGHT_DELTA_MAX,
  LATERAL_OFFSET_MAX,
  MOVING_PLATFORM_THRESHOLD,
  CRUMBLING_PLATFORM_THRESHOLD,
  MOVING_AMPLITUDE,
  MOVING_SPEED,
  PLAYER_RADIUS,
  JUMP_FORCE,
  GRAVITY_SCALE,
  PLAYER_FORWARD_SPEED,
  TOWER_DIFFICULTY_THRESHOLD,
  TOWER_SPAWN_CHANCE,
  TOWER_HEIGHT,
  TOWER_LATERAL_OFFSET,
  TOWER_FIRE_RATE_MIN,
  TOWER_FIRE_RATE_MAX,
  PROJECTILE_SPEED,
} from '../constants';

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function randomRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

const PLATFORM_COLORS = [
  '#4ecdc4', '#45b7d1', '#96ceb4', '#88d8b0',
  '#a8e6cf', '#7fcdcd', '#6cb4ee', '#b8a9c9',
  '#c3aed6', '#dda0dd',
];

function getColorByAltitude(y: number): string {
  // Shift through colors as you go higher
  const idx = Math.floor(Math.abs(y) / 3) % PLATFORM_COLORS.length;
  return PLATFORM_COLORS[idx];
}

function choosePlatformType(difficulty: number): PlatformType {
  const roll = Math.random();

  if (difficulty > CRUMBLING_PLATFORM_THRESHOLD && roll < 0.2) {
    return 'crumbling';
  }
  if (difficulty > MOVING_PLATFORM_THRESHOLD && roll < 0.35) {
    return 'moving';
  }
  return 'static';
}

let nextId = 0;
let nextTowerId = 0;

export function resetPlatformGenerator() {
  nextId = 0;
  nextTowerId = 0;
}

export function generateStartPlatform(): PlatformData[] {
  nextId = 1;
  const mainPlatform: PlatformData = {
    id: 0,
    position: new THREE.Vector3(0, 2, 0),
    width: 6,
    depth: 12,
    type: 'static',
    color: '#4ecdc4',
  };

  // Catwalk: a narrow runway leading from the spawn platform toward the first real platform
  const catwalk: PlatformData = {
    id: -1,
    position: new THREE.Vector3(0, 1.8, 5),
    width: 2.5,
    depth: 5,
    type: 'static',
    color: '#45b7d1',
  };

  return [mainPlatform, catwalk];
}

// Calculate max jump height and forward distance for reachability checks
const GRAVITY = 9.81 * GRAVITY_SCALE;
const MAX_JUMP_HEIGHT = (JUMP_FORCE * JUMP_FORCE) / (2 * GRAVITY); // ~2.17
const JUMP_HANG_TIME = (2 * JUMP_FORCE) / GRAVITY; // total airtime ~1.09s
const MAX_JUMP_FORWARD = PLAYER_FORWARD_SPEED * JUMP_HANG_TIME; // ~6.5
// Minimum edge-to-edge gap: must be wide enough that the ball falls through without jumping
// At speed 6, ball needs ~0.25s to fall past platform edge (PLAYER_RADIUS).
// Distance in 0.25s = 1.5 units. Add generous margin so it's clearly a jump.
const MIN_EDGE_GAP = 3.5;

export function generateNextPlatform(
  lastPosition: THREE.Vector3,
  difficulty: number,
  lastDepth: number = PLATFORM_DEPTH_MAX,
): PlatformData {
  const id = nextId++;

  // Intro ramp: first 8 platforms are a gentle tutorial with big platforms and small gaps
  const isIntro = id <= 8;
  // Smooth blend from intro → normal over platforms 8-15
  const introFade = id <= 8 ? 0 : Math.min((id - 8) / 7, 1);

  // Size — big early, shrinks with difficulty
  const baseWidth = lerp(PLATFORM_WIDTH_MAX, PLATFORM_WIDTH_MIN, difficulty);
  const baseDepth = lerp(PLATFORM_DEPTH_MAX, PLATFORM_DEPTH_MIN, difficulty);
  const width = isIntro ? PLATFORM_WIDTH_MAX * 1.2 : lerp(PLATFORM_WIDTH_MAX, baseWidth, introFade);
  const depth = isIntro ? PLATFORM_DEPTH_MAX * 1.2 : lerp(PLATFORM_DEPTH_MAX, baseDepth, introFade);

  // Gap — tiny early, grows with difficulty
  let gapDistance: number;
  if (isIntro) {
    // Clear gaps that require jumping — easy hops but you must press space
    gapDistance = randomRange(5, 6);
  } else {
    gapDistance = lerp(GAP_DISTANCE_MIN, GAP_DISTANCE_MAX, difficulty) + randomRange(-0.3, 0.3);
    // Blend from easy gaps in the transition zone
    gapDistance = lerp(5.5, gapDistance, introFade);
  }
  // gapDistance is center-to-center; enforce minimum EDGE-to-EDGE gap
  // edge gap = gapDistance - lastDepth/2 - depth/2
  const minCenterToCenter = lastDepth / 2 + depth / 2 + MIN_EDGE_GAP;
  gapDistance = Math.max(gapDistance, minCenterToCenter);
  gapDistance = Math.min(gapDistance, MAX_JUMP_FORWARD * 0.8);

  // Height — flat early, varied later
  let heightDelta: number;
  if (isIntro) {
    // Gentle downward slope — feels like descending stairs, exciting but safe
    heightDelta = randomRange(-0.3, 0.1);
  } else {
    heightDelta = lerp(HEIGHT_DELTA_MIN, HEIGHT_DELTA_MAX * 0.5, difficulty) + randomRange(-0.2, 0.2);
    heightDelta = lerp(0, heightDelta, introFade);
  }
  heightDelta = Math.min(heightDelta, MAX_JUMP_HEIGHT * 0.65);
  heightDelta = Math.max(heightDelta, -1.5);

  // Lateral offset — straight early, zigzags later
  let lateralOffset: number;
  if (isIntro) {
    // Tiny zigzag to teach lateral movement
    lateralOffset = randomRange(-0.5, 0.5);
  } else {
    lateralOffset = lerp(0, LATERAL_OFFSET_MAX, difficulty) * (Math.random() > 0.5 ? 1 : -1) * Math.random();
    lateralOffset = lerp(0, lateralOffset, introFade);
  }

  const position = new THREE.Vector3(
    lastPosition.x + lateralOffset,
    Math.max(lastPosition.y + heightDelta, 0.3),
    lastPosition.z + gapDistance,
  );

  // Clamp lateral so platforms stay in playable area
  position.x = Math.max(-4, Math.min(4, position.x));

  // Reachability check: if the jump is both high AND far, ease one of them
  const horizontalDist = gapDistance;
  const verticalDist = Math.max(0, position.y - lastPosition.y);
  const horizontalRatio = horizontalDist / MAX_JUMP_FORWARD;
  const verticalRatio = verticalDist / MAX_JUMP_HEIGHT;
  if (horizontalRatio + verticalRatio > 0.8) {
    const maxAllowedHeight = (0.8 - horizontalRatio) * MAX_JUMP_HEIGHT;
    position.y = Math.min(position.y, lastPosition.y + Math.max(0, maxAllowedHeight));
  }

  const type = isIntro ? 'static' : choosePlatformType(difficulty);
  const color = getColorByAltitude(position.y);

  const platform: PlatformData = {
    id,
    position,
    width,
    depth,
    type,
    color,
  };

  if (type === 'moving') {
    platform.moveAxis = Math.random() > 0.5 ? 'x' : 'y';
    platform.moveAmplitude = MOVING_AMPLITUDE * (0.5 + difficulty * 0.5);
    platform.moveSpeed = MOVING_SPEED * (0.8 + difficulty * 0.4);
    platform.moveOffset = Math.random() * Math.PI * 2;
  }

  return platform;
}

export function generateTower(
  platform: PlatformData,
  difficulty: number,
): TowerData | null {
  if (difficulty < TOWER_DIFFICULTY_THRESHOLD) return null;
  if (Math.random() > TOWER_SPAWN_CHANCE) return null;
  // Don't place towers on crumbling platforms
  if (platform.type === 'crumbling') return null;

  const side = Math.random() > 0.5 ? 1 : -1;
  const position = new THREE.Vector3(
    platform.position.x + side * TOWER_LATERAL_OFFSET,
    platform.position.y + PLATFORM_HEIGHT / 2 + TOWER_HEIGHT / 2,
    platform.position.z,
  );

  return {
    id: nextTowerId++,
    position,
    platformId: platform.id,
    fireRate: lerp(TOWER_FIRE_RATE_MIN, TOWER_FIRE_RATE_MAX, difficulty),
    projectileSpeed: lerp(PROJECTILE_SPEED * 0.7, PROJECTILE_SPEED, difficulty),
  };
}
