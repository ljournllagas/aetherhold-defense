import { getCampaignLevel } from './config.ts';
import { getCampaignEnemy, CAMPAIGN_STATUS_TUNING } from './enemies.ts';
import { resolveCampaignMap } from './maps.ts';
import { campaignPowerUpPool, isLevelUnlocked } from './progress.ts';
import { getCampaignSpecialization } from './specializations.ts';
import { POWERUPS } from '../config/powerUps.ts';
import { rollRarity } from '../systems/PowerUpSystem.ts';
import type { EffectiveTowerStats, ShotSnapshot, TowerId } from '../../shared/progression.ts';
import type { PowerUpId } from '../../shared/types.ts';
import type { CampaignLevelDefinition, CampaignSpecializationEffects, CampaignSpecializationId, CampaignView } from './types.ts';

export interface CampaignSpawn { enemyId: string; atMs: number; hpBonus: number; }
export interface CampaignShot extends ShotSnapshot { specialization?: Readonly<CampaignSpecializationEffects>; }

// Unspecified battle tuning is isolated here. Starter mastery targets are untouched.
const WAVE_COUNTS = [5,6,6,7,8,8,9,10,10,10,10,11,12,13,13,14,14,15,15,15,16,16,19,20,18,22,20,20,21,21];
export const CAMPAIGN_BATTLE_TUNING = {
  hpGrowthPerWave: 0.055, levelHpGrowth: 0.018, speedGrowthPerWave: 0.012,
  openingThreatHp: 60, lateThreatHp: 120, openingWaves: 4, threatGrowthPerWave: 4,
  heavyOpeningIntervalMs: 2100, heavyIntervalDecayMs: 50, heavyMinimumIntervalMs: 1100,
  supportRadius: 145, supportIntervalMs: 5500, supportDurationMs: 2200,
  ...CAMPAIGN_STATUS_TUNING
} as const;

export class CampaignBattle {
  readonly definition: CampaignLevelDefinition;
  readonly map;
  readonly waveCount: number;
  readonly choices;
  readonly targeting;
  readonly visualTier: 1 | 2 | 3;
  readonly powerUpPool: readonly PowerUpId[];
  readonly rerollAvailable: boolean;
  private rerolled = false;
  bossKilled = false;
  settled = false;

  constructor(level: number, view: CampaignView) {
    const definition = getCampaignLevel(level);
    if (!definition || !isLevelUnlocked(level, view)) throw new Error('Campaign level is locked or invalid');
    this.definition = definition;
    this.map = resolveCampaignMap(definition);
    this.waveCount = WAVE_COUNTS[level - 1];
    this.choices = { ...view.profile.choices };
    if (!view.unlockedFeatures.includes('tower_specialization_i')) for (const id of Object.keys(this.choices) as TowerId[]) this.choices[id] = null;
    this.targeting = { ...view.profile.targeting };
    this.visualTier = view.unlockedFeatures.includes('tower_visual_tier_iii') ? 3 : view.unlockedFeatures.includes('tower_visual_tier_ii') ? 2 : 1;
    this.powerUpPool = [...campaignPowerUpPool(view.profile)];
    this.rerollAvailable = view.unlockedFeatures.includes('one_powerup_reroll_per_level');
  }

  wave(wave: number, countMultiplier = 1): { isBossWave: boolean; spawns: CampaignSpawn[] } {
    if (!Number.isInteger(wave) || wave < 1 || wave > this.waveCount) throw new Error('Campaign wave is out of range');
    const def = this.definition;
    const isBossWave = wave === this.waveCount && def.bossEnemyId !== null;
    const roster = def.enemyIds;
    // Introduce roster members in separate waves, then combine alternating pressure groups.
    const members = wave < roster.length ? [roster[wave - 1]] : roster;
    const spawns: CampaignSpawn[] = [];
    members.forEach((id, group) => {
      const cfg = getCampaignEnemy(id);
      const heavy = cfg.isElite || cfg.physicalArmor > 0.4;
      const threatHp = Math.min(CAMPAIGN_BATTLE_TUNING.lateThreatHp, CAMPAIGN_BATTLE_TUNING.openingThreatHp + Math.max(0, wave - CAMPAIGN_BATTLE_TUNING.openingWaves) * CAMPAIGN_BATTLE_TUNING.threatGrowthPerWave);
      const threatWeight = Math.max(1, cfg.baseHp / threatHp);
      const baseCount = isBossWave ? (group === 0 ? 6 : 2) : Math.max(2, Math.round((12 + wave * 2) / members.length / threatWeight));
      const count = Math.max(1, Math.round(baseCount * countMultiplier));
      const interval = heavy ? Math.max(CAMPAIGN_BATTLE_TUNING.heavyMinimumIntervalMs, CAMPAIGN_BATTLE_TUNING.heavyOpeningIntervalMs - wave * CAMPAIGN_BATTLE_TUNING.heavyIntervalDecayMs) : Math.max(280, 730 - wave * 12 - (def.level % 3) * 35);
      for (let i = 0; i < count; i++) spawns.push({ enemyId: id, atMs: 800 + group * 2100 + i * interval, hpBonus: def.warnings.includes('elite_mix') && group > 0 ? 1.2 : 1 });
    });
    if (isBossWave) spawns.push({ enemyId: def.bossEnemyId!, atMs: 4500, hpBonus: 1 });
    return { isBossWave, spawns: spawns.sort((a, b) => a.atMs - b.atMs) };
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
