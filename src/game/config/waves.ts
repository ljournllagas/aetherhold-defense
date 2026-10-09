// Wave scaling tuning, centralized (SPEC §18, §38).
import type { WaveEnemyGroup } from '../../shared/types.ts';

export const WAVES = {
  // hp grows ~ exponentially; speed grows slowly and caps
  hpGrowthPerWave: 0.13,
  hpGrowthExponent: 1.0,
  speedGrowthPerWave: 0.008,
  maxSpeedMultiplier: 1.6,
  countGrowthPerWave: 0.35,
  bossEvery: 10,
  eliteEvery: 5
};

/** Explicit, tunable wave-30 siege finale: exactly one Warlord plus these groups. */
export interface SiegeFinaleConfig {
  wave: number;
  bossHpScaleBonus: number;
  bossSpawnInterval: number;
  bossDelayBefore: number;
  groups: WaveEnemyGroup[];
}

export const SIEGE_FINALE: SiegeFinaleConfig = {
  wave: 30,
  bossHpScaleBonus: 3.4,
  bossSpawnInterval: 3,
  bossDelayBefore: 15,
  groups: [
    { enemyId: 'thornling', count: 59, spawnInterval: 0.4, delayBefore: 0.3 },
    { enemyId: 'swiftwisp', count: 59, spawnInterval: 0.3, delayBefore: 2 },
    { enemyId: 'ironbark', count: 47, spawnInterval: 0.5, delayBefore: 4 },
    { enemyId: 'runescale', count: 47, spawnInterval: 0.5, delayBefore: 6 },
    { enemyId: 'mossmaw', count: 35, spawnInterval: 0.55, delayBefore: 8 },
    { enemyId: 'gloomite', count: 46, spawnInterval: 0.2, delayBefore: 10 },
    { enemyId: 'cragback', count: 9, spawnInterval: 1.2, delayBefore: 12 }
  ]
};
