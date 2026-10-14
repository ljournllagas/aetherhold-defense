import { getCampaignLevel } from './config.ts';
import { CAMPAIGN_STATUS_TUNING } from './enemies.ts';
import { CAMPAIGN_WAVE_TUNING, getCampaignWave, getCampaignWaveCount, type CampaignWave } from './waveProfile.ts';
import { resolveCampaignMap } from './maps.ts';
import { campaignPowerUpPool, isLevelUnlocked } from './progress.ts';
import { getCampaignSpecialization } from './specializations.ts';
import { POWERUPS } from '../config/powerUps.ts';
import { rollRarity } from '../systems/PowerUpSystem.ts';
import type { EffectiveTowerStats, ShotSnapshot, TowerId } from '../../shared/progression.ts';
import type { PowerUpId } from '../../shared/types.ts';
import type { CampaignLevelDefinition, CampaignSpecializationEffects, CampaignSpecializationId, CampaignView, CampaignVisualTier } from './types.ts';

export type { CampaignSpawn, CampaignWave } from './waveProfile.ts';
export interface CampaignShot extends ShotSnapshot { specialization?: Readonly<CampaignSpecializationEffects>; }

export function campaignVisualTier(view: Pick<CampaignView, 'unlockedFeatures'>): CampaignVisualTier {
  return view.unlockedFeatures.includes('tower_visual_tier_iii') ? 3 : view.unlockedFeatures.includes('tower_visual_tier_ii') ? 2 : 1;
}

export const CAMPAIGN_BATTLE_TUNING = {
  ...CAMPAIGN_WAVE_TUNING,
  supportRadius: 145, supportIntervalMs: 5500, supportDurationMs: 2200,
  ...CAMPAIGN_STATUS_TUNING
} as const;

export class CampaignBattle {
  readonly definition: CampaignLevelDefinition;
  readonly map;
  readonly waveCount: number;
  readonly choices;
  readonly targeting;
  readonly visualTier: CampaignVisualTier;
  readonly powerUpPool: readonly PowerUpId[];
  readonly rerollAvailable: boolean;
  private rerolled = false;
  bossKilled = false;
  settled = false;

  constructor(level: number, view: CampaignView, visualTier?: CampaignVisualTier) {
    const definition = getCampaignLevel(level);
    if (!definition || !isLevelUnlocked(level, view)) throw new Error('Campaign level is locked or invalid');
    this.definition = definition;
    this.map = resolveCampaignMap(definition);
    this.waveCount = getCampaignWaveCount(level);
    this.choices = { ...view.profile.choices };
    if (!view.unlockedFeatures.includes('tower_specialization_i')) for (const id of Object.keys(this.choices) as TowerId[]) this.choices[id] = null;
    this.targeting = { ...view.profile.targeting };
    this.visualTier = visualTier ?? campaignVisualTier(view);
    this.powerUpPool = [...campaignPowerUpPool(view.profile)];
    this.rerollAvailable = view.unlockedFeatures.includes('one_powerup_reroll_per_level');
  }

  wave(wave: number, countMultiplier = 1): CampaignWave {
    return getCampaignWave(this.definition.level, wave, countMultiplier);
  }

  readyToClear(wave: number, lives: number, unresolved: number): boolean {
    return !this.settled && wave === this.waveCount && lives > 0 && unresolved === 0 && (!this.definition.bossEnemyId || this.bossKilled);
  }

  canReroll(reveal: boolean): boolean { return !this.settled && this.rerollAvailable && !this.rerolled && reveal; }

  reroll(previous: PowerUpId, reveal: boolean, rand: () => number = Math.random): PowerUpId | null {
    if (!this.canReroll(reveal)) return null;
    const candidates = this.powerUpPool.filter(id => id !== previous);
    if (!candidates.length) return null;
    this.rerolled = true;
    return this.rollReward(rand, candidates);
  }

  rollReward(rand: () => number = Math.random, pool = this.powerUpPool): PowerUpId {
    const rarity = rollRarity(rand);
    const matching = pool.filter(id => POWERUPS[id].rarity === rarity);
    const list = matching.length ? matching : pool;
    return list[Math.min(list.length - 1, Math.max(0, Math.floor(rand() * list.length)))];
  }
}

export function campaignTowerStats(base: EffectiveTowerStats, choice: CampaignSpecializationId | null): EffectiveTowerStats {
  const effect = choice ? getCampaignSpecialization(choice)?.effects : undefined;
  if (!effect) return base;
  return {
    ...base,
    damage: base.damage * (effect.damageMultiplier ?? 1),
    range: base.range * (effect.rangeMultiplier ?? 1),
    attackInterval: base.attackInterval * (effect.attackIntervalMultiplier ?? 1),
    splashRadius: base.splashRadius === undefined ? undefined : base.splashRadius * (effect.splashRadiusMultiplier ?? 1),
    slowFactor: base.slowFactor === undefined ? undefined : Math.min(0.9, base.slowFactor * (effect.slowFactorMultiplier ?? 1)),
    chainCount: base.chainCount === undefined ? undefined : Math.max(1, base.chainCount + (effect.chainTargetDelta ?? 0)),
    volleyTargets: effect.splitTargets ?? base.volleyTargets,
    burningField: base.burningField || !!effect.burnDurationMs
  };
}

export function specializeShot(shot: ShotSnapshot, choice: CampaignSpecializationId | null): CampaignShot {
  const specialization = choice ? getCampaignSpecialization(choice)?.effects : undefined;
  return specialization ? { ...shot, specialization: { ...specialization }, rawDamage: shot.rawDamage * (specialization.primaryDamageMultiplier ?? 1) } : shot;
}
