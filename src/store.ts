import { create } from 'zustand';
import * as THREE from 'three';
import { MAX_LIVES } from './constants';

interface GameStore {
  // Game phase
  phase: 'menu' | 'playing' | 'gameover';
  start: () => void;
  restart: () => void;
  end: () => void;

  // Score
  score: number;
  highScore: number;
  incrementScore: () => void;

  // Lives
  lives: number;
  maxLives: number;
  loseLife: () => void;

  // Difficulty (0-1 scale derived from score)
  getDifficulty: () => number;
  getStage: () => string;

  // Platform tracking
  lastPlatformId: number;
  lastLandedPlatformId: number;
  setLastLandedPlatformId: (id: number) => void;
  lastPlatformPosition: THREE.Vector3;
  setLastPlatformPosition: (pos: THREE.Vector3) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  phase: 'menu',
  start: () => set({
    phase: 'playing',
    score: 0,
    lives: MAX_LIVES,
    lastPlatformId: 0,
    lastLandedPlatformId: -1,
    lastPlatformPosition: new THREE.Vector3(0, 0, 0),
  }),
  restart: () => {
    set({
      phase: 'playing',
      score: 0,
      lives: MAX_LIVES,
      lastPlatformId: 0,
      lastLandedPlatformId: -1,
      lastPlatformPosition: new THREE.Vector3(0, 0, 0),
    });
  },
  end: () => {
    const { score, highScore } = get();
    const newHighScore = Math.max(score, highScore);
    if (newHighScore > highScore) {
      localStorage.setItem('skyHopperHighScore', String(newHighScore));
    }
    set({ phase: 'gameover', highScore: newHighScore });
  },

  score: 0,
  highScore: Number(localStorage.getItem('skyHopperHighScore') || 0),
  incrementScore: () => set((state) => ({ score: state.score + 1 })),

  // Lives
  lives: MAX_LIVES,
  maxLives: MAX_LIVES,
  loseLife: () => {
    const { lives } = get();
    const newLives = lives - 1;
    if (newLives <= 0) {
      get().end();
    } else {
      set({ lives: newLives });
    }
  },

  // Slow curve: stays easy for first ~15, ramps through mid-game, caps at 100
  getDifficulty: () => {
    const s = get().score;
    if (s < 8) return 0; // first 8 platforms are pure easy mode
    return Math.min((s - 8) / 100, 1.0);
  },
  getStage: () => {
    const d = get().getDifficulty();
    if (d < 0.15) return 'Chill';
    if (d < 0.35) return 'Warming Up';
    if (d < 0.6) return 'Tricky';
    if (d < 0.85) return 'Intense';
    return 'Insane';
  },

  lastPlatformId: 0,
  lastLandedPlatformId: -1,
  setLastLandedPlatformId: (id) => set({ lastLandedPlatformId: id }),
  lastPlatformPosition: new THREE.Vector3(0, 0, 0),
  setLastPlatformPosition: (pos) => set({ lastPlatformPosition: pos.clone() }),
}));
