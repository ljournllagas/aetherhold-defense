import type Phaser from 'phaser';
import { ENEMIES } from '../config/enemies.ts';
import type { EnemyArchetype, EnemyConfig } from '../../shared/types.ts';
import type { StatusView } from '../systems/EvolutionCombat.ts';
import { CAMPAIGN_STATUS_TUNING } from '../campaign/enemies.ts';

let NEXT_ID = 1;

export class Enemy {
  id = NEXT_ID++;
  archetype: EnemyArchetype;
  x = 0;
  y = 0;
  heading = 0; // travel direction (radians), drives view rotation
  hp: number;
  maxHp: number;
  speed: number;
  baseSpeed: number;
  reward: number;
  livesLost: number;
  physicalArmor: number;
  wardArmor: number;
  regen: number;
  radius: number;
  isBoss: boolean;
  isElite: boolean;
  distanceTraveled = 0;
  waypointIndex = 1;
  slowUntil = 0; // game-time ms
  slowFactor = 0;
  frozenUntil = 0;
  flashUntil = 0; // hit-pop window (game-time ms)
  phase = Math.random() * Math.PI * 2; // walk-cycle offset
  alive = true;
  reachedEnd = false;
  view: Phaser.GameObjects.Container | null = null;
  body: Phaser.GameObjects.Container | null = null;
  shadow: Phaser.GameObjects.Ellipse | null = null;
  slowRing: Phaser.GameObjects.Ellipse | null = null;
  hpBar: Phaser.GameObjects.Graphics | null = null;
  name: string;
  campaignId: string | null = null;
  slowResistance = 0;
  speedBuffUntil = 0;
  slowResistanceUntil = 0;
  damageTakenMultiplier = 1;
  bossSpeedMultiplier = 1;

  constructor(archetype: EnemyArchetype, hp: number, speed: number, reward: number, cfg: Omit<EnemyConfig, 'id'> = ENEMIES[archetype]) {
    this.archetype = archetype;
    this.name = cfg.name;
    this.maxHp = hp;
    this.hp = hp;
    this.baseSpeed = speed;
    this.speed = speed;
    this.reward = reward;
    this.livesLost = cfg.livesLost;
    this.physicalArmor = cfg.physicalArmor;
    this.wardArmor = cfg.wardArmor;
    this.regen = cfg.regenPerSecond;
    this.radius = cfg.radius;
    this.isBoss = cfg.isBoss;
    this.isElite = cfg.isElite;
  }

  effectiveSpeed(nowMs: number, globalFreeze: number, status?: StatusView): number {
    if (status?.frozen || status?.stunned || nowMs < globalFreeze || nowMs < this.frozenUntil) return 0;
    const slow = status ? status.slowFactor : nowMs < this.slowUntil ? this.slowFactor : 0;
    const resistance = Math.max(this.slowResistance, nowMs < this.slowResistanceUntil ? CAMPAIGN_STATUS_TUNING.supportSlowResistance : 0);
    return this.baseSpeed * (1 - slow * (1 - resistance)) * this.bossSpeedMultiplier * (nowMs < this.speedBuffUntil ? CAMPAIGN_STATUS_TUNING.supportSpeedMultiplier : 1);
  }
}
