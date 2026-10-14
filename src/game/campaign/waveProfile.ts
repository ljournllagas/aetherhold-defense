import { getCampaignLevel } from './config.ts';
import { getCampaignEnemy } from './enemies.ts';

export interface CampaignSpawn { enemyId: string; atMs: number; hpBonus: number; }
export interface CampaignWave { isBossWave: boolean; spawns: CampaignSpawn[]; }

export const CAMPAIGN_WAVE_TUNING = {
  hpGrowthPerWave: 0.055, levelHpGrowth: 0.018, speedGrowthPerWave: 0.012,
  openingThreatHp: 60, lateThreatHp: 120, openingWaves: 4, threatGrowthPerWave: 4,
  heavyOpeningIntervalMs: 2100, heavyIntervalDecayMs: 50, heavyMinimumIntervalMs: 1100,
  whisperfenCountMultiplier: 0.65
} as const;

const ORIGINAL_WAVE_COUNTS = [5,6,6,7,8,8,9,10,10,10,10,11,12,13,13,14,14,15,15,15,16,16,19,20,18,22,20,20,21,21] as const;
const ESTABLISHED_WORLD_PROFILE = [16,16,19,20,18,22,20,20,21,21] as const;
const EXPANSION_WAVE_COUNTS = Array.from({ length: 60 }, (_, index) => 32 + Math.round(index * 20 / 59));
const WAVE_COUNTS = [
  ...ORIGINAL_WAVE_COUNTS,
  ...Array.from({ length: 10 }, (_, index) => ESTABLISHED_WORLD_PROFILE[index % ESTABLISHED_WORLD_PROFILE.length]),
  ...EXPANSION_WAVE_COUNTS
];

export function getCampaignWaveCount(level: number): number {
  if (!getCampaignLevel(level)) throw new Error('Campaign level is locked or invalid');
  return WAVE_COUNTS[level - 1]!;
}

export function getCampaignWave(level: number, wave: number, countMultiplier = 1): CampaignWave {
  const def = getCampaignLevel(level);
  if (!def) throw new Error('Campaign level is locked or invalid');
  const waveCount = getCampaignWaveCount(level);
  if (!Number.isInteger(wave) || wave < 1 || wave > waveCount) throw new Error('Campaign wave is out of range');
  const isBossWave = wave === waveCount && def.bossEnemyId !== null;
  const members = wave < def.enemyIds.length ? [def.enemyIds[wave - 1]!] : def.enemyIds;
  const spawns: CampaignSpawn[] = [];
  members.forEach((id, group) => {
    const cfg = getCampaignEnemy(id);
    const heavy = cfg.isElite || cfg.physicalArmor > 0.4;
    const threatHp = Math.min(CAMPAIGN_WAVE_TUNING.lateThreatHp, CAMPAIGN_WAVE_TUNING.openingThreatHp + Math.max(0, wave - CAMPAIGN_WAVE_TUNING.openingWaves) * CAMPAIGN_WAVE_TUNING.threatGrowthPerWave);
    const threatWeight = Math.max(1, cfg.baseHp / threatHp);
    const baseCount = isBossWave ? (group === 0 ? 6 : 2) : Math.max(2, Math.round((12 + wave * 2) / members.length / threatWeight));
    const worldCountMultiplier = def.worldId === 'whisperfen' ? CAMPAIGN_WAVE_TUNING.whisperfenCountMultiplier : 1;
    const count = Math.max(1, Math.round(baseCount * countMultiplier * worldCountMultiplier));
    const interval = heavy ? Math.max(CAMPAIGN_WAVE_TUNING.heavyMinimumIntervalMs, CAMPAIGN_WAVE_TUNING.heavyOpeningIntervalMs - wave * CAMPAIGN_WAVE_TUNING.heavyIntervalDecayMs) : Math.max(280, 730 - wave * 12 - (def.level % 3) * 35);
    for (let i = 0; i < count; i++) spawns.push({ enemyId: id, atMs: 800 + group * 2100 + i * interval, hpBonus: def.warnings.includes('elite_mix') && group > 0 ? 1.2 : 1 });
  });
  if (isBossWave) spawns.push({ enemyId: def.bossEnemyId!, atMs: 4500, hpBonus: 1 });
  return { isBossWave, spawns: spawns.sort((a, b) => a.atMs - b.atMs) };
}
