// Shared game types — rendering-independent so logic is unit-testable.
import type { ResultProgress } from './progression.ts';

export type DifficultyId = 'easy' | 'medium' | 'hard';

export interface DifficultyConfig {
  id: DifficultyId;
  label: string;
  description: string;
  startingGold: number;
  startingLives: number;
  maxLives: number;
  enemyHpMultiplier: number;
  enemySpeedMultiplier: number;
  enemyCountMultiplier: number;
  goldRewardMultiplier: number;
  scoreMultiplier: number;
}

export type DamageType = 'physical' | 'arcane' | 'elemental';

export type TargetingMode = 'first' | 'last' | 'strongest' | 'weakest' | 'closest';

export interface TowerLevelStats {
  damage: number;
  range: number;
  attackInterval: number; // seconds between attacks (lower = faster)
  damageType: DamageType;
  splashRadius?: number; // for AoE towers
  slowFactor?: number; // 0..1 (e.g. 0.4 = 40% slow)
  slowDuration?: number;
  chainCount?: number;
  cost: number; // cost to buy (lvl1) or upgrade to this level
}

export interface TowerConfig {
  id: string;
  name: string;
  description: string;
  role: string; // short badge: DPS / AOE / SLOW / ARCANE / CHAIN
  color: number;
  damageType: DamageType;
  assetKey: string;
  audioKey: string;
  projectileSpeed: number; // pixels per second
  levels: TowerLevelStats[]; // index 0 = level 1 ... index 3 = ultimate
  sellRefundRate: number;
}

export type LeaderboardResult<T> =
  | { ok: true; scores: T[] }
  | { ok: false; message: string };

export type EnemyArchetype =
  | 'thornling'
  | 'swiftwisp'
  | 'cragback'
  | 'ironbark'
  | 'runescale'
  | 'mossmaw'
  | 'gloomite'
  | 'warlord'
  | 'pilferer';

export interface EnemyConfig {
  id: EnemyArchetype;
  name: string;
  description: string;
  baseHp: number;
  baseSpeed: number; // pixels per second
  baseReward: number;
  livesLost: number;
  physicalArmor: number; // 0..0.9 fraction reduced
  wardArmor: number; // vs arcane + (half vs) elemental
  regenPerSecond: number;
  color: number;
  radius: number;
  isBoss: boolean;
  isElite: boolean;
}

export interface WaveEnemyGroup {
  enemyId: EnemyArchetype;
  count: number;
  spawnInterval: number; // seconds between spawns in this group
  delayBefore: number; // seconds before group starts
  hpScaleBonus?: number; // extra multiplier on top of global scaling
}

export interface WaveConfig {
  wave: number;
  groups: WaveEnemyGroup[];
  isBossWave: boolean;
  rewardBonus: number;
}

export type PowerUpRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export type PowerUpId =
  | 'gold_rush'
  | 'meteor_strike'
  | 'time_freeze'
  | 'battle_cry'
  | 'arcane_surge'
  | 'emergency_repair'
  | 'treasure_goblin'
  | 'double_bounty'
  | 'tower_overcharge'
  | 'ancient_blessing';

export interface PowerUpConfig {
  id: PowerUpId;
  name: string;
  description: string;
  rarity: PowerUpRarity;
  color: number;
  // targeting required? (meteor needs map click)
  requiresTarget: boolean;
}

export interface ScoreBreakdown {
  killScore: number;
  waveBonus: number;
  bossBonus: number;
  livesBonus: number;
  baseScore: number;
  difficultyMultiplier: number;
  finalScore: number;
}

export interface GameResultPayload extends ResultProgress {
  playerName: string;
  difficulty: DifficultyId;
  highestWave: number;
  finalScore: number;
  enemiesKilled: number;
  bossesKilled: number;
  remainingLives: number;
  gameDurationSeconds: number;
  runId: string;
  gameVersion: string;
  scoreVersion: number;
}

export interface ScoreRecord extends GameResultPayload {
  id: number;
  createdAt: string;
}
