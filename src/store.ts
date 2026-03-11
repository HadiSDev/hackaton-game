import { create } from 'zustand';
import * as THREE from 'three';
import { MAX_LIVES } from './constants';

export type DifficultyPreset = 'easy' | 'normal' | 'hard' | 'insane';

export interface DifficultyConfig {
  label: string;
  description: string;
  scoreScale: number;      // Divides the score-to-difficulty denominator (higher = slower ramp)
  livesMultiplier: number;  // Multiplied by MAX_LIVES
  speedMultiplier: number;  // Affects platform gap scaling
}

export const DIFFICULTY_PRESETS: Record<DifficultyPreset, DifficultyConfig> = {
  easy: {
    label: 'Easy',
    description: 'Relaxed pace, extra lives, slow ramp',
    scoreScale: 200,
    livesMultiplier: 2,
    speedMultiplier: 0.7,
  },
  normal: {
    label: 'Normal',
    description: 'Balanced challenge',
    scoreScale: 100,
    livesMultiplier: 1,
    speedMultiplier: 1,
  },
  hard: {
    label: 'Hard',
    description: 'Fast ramp, fewer lives',
    scoreScale: 60,
    livesMultiplier: 0.67,
    speedMultiplier: 1.2,
  },
  insane: {
    label: 'Insane',
    description: 'One life, rapid escalation',
    scoreScale: 35,
    livesMultiplier: 0.34,
    speedMultiplier: 1.4,
  },
};

interface GameStore {
  // Game phase
  phase: 'menu' | 'playing' | 'gameover';
  start: () => void;
  restart: () => void;
  end: () => void;

  // Difficulty preset
  difficultyPreset: DifficultyPreset;
  setDifficultyPreset: (preset: DifficultyPreset) => void;

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

const savedPreset = (localStorage.getItem('skyHopperDifficulty') || 'normal') as DifficultyPreset;

export const useGameStore = create<GameStore>((set, get) => ({
  phase: 'menu',
  difficultyPreset: savedPreset,
  setDifficultyPreset: (preset) => {
    localStorage.setItem('skyHopperDifficulty', preset);
    set({ difficultyPreset: preset });
  },
  start: () => {
    const config = DIFFICULTY_PRESETS[get().difficultyPreset];
    const lives = Math.max(1, Math.round(MAX_LIVES * config.livesMultiplier));
    set({
      phase: 'playing',
      score: 0,
      lives,
      maxLives: lives,
      lastPlatformId: 0,
      lastLandedPlatformId: -1,
      lastPlatformPosition: new THREE.Vector3(0, 0, 0),
    });
  },
  restart: () => {
    const config = DIFFICULTY_PRESETS[get().difficultyPreset];
    const lives = Math.max(1, Math.round(MAX_LIVES * config.livesMultiplier));
    set({
      phase: 'playing',
      score: 0,
      lives,
      maxLives: lives,
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
  lives: Math.max(1, Math.round(MAX_LIVES * DIFFICULTY_PRESETS[savedPreset].livesMultiplier)),
  maxLives: Math.max(1, Math.round(MAX_LIVES * DIFFICULTY_PRESETS[savedPreset].livesMultiplier)),
  loseLife: () => {
    const { lives } = get();
    const newLives = lives - 1;
    if (newLives <= 0) {
      get().end();
    } else {
      set({ lives: newLives });
    }
  },

  // Difficulty curve scaled by preset
  getDifficulty: () => {
    const s = get().score;
    if (s < 8) return 0;
    const config = DIFFICULTY_PRESETS[get().difficultyPreset];
    return Math.min((s - 8) / config.scoreScale, 1.0);
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
