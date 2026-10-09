import { ENEMIES } from '../config/enemies.ts';
import { SIEGE_FINALE, WAVES } from '../config/waves.ts';
import type { DifficultyConfig, WaveConfig, WaveEnemyGroup } from '../../shared/types.ts';

export interface SpawnEvent {
  enemyId: WaveEnemyGroup['enemyId'];
  atMs: number;
  hpBonus: number;
}

/** Schedule each group from the same wave start; delayBefore is wave-relative. */
export function scheduleWave(groups: WaveEnemyGroup[], startMs: number): SpawnEvent[] {
  const events: SpawnEvent[] = [];
  for (const group of groups) {
    const groupStart = startMs + group.delayBefore * 1000;
    for (let i = 0; i < group.count; i++) {
      events.push({
        enemyId: group.enemyId,
        atMs: groupStart + i * group.spawnInterval * 1000,
        hpBonus: group.hpScaleBonus ?? 1
      });
    }
  }
  return events.sort((a, b) => a.atMs - b.atMs);
}

export function hpMultiplierForWave(wave: number, difficulty: DifficultyConfig): number {
  const growth = 1 + WAVES.hpGrowthPerWave * (wave - 1);
  return difficulty.enemyHpMultiplier * growth;
}

export function speedMultiplierForWave(wave: number, difficulty: DifficultyConfig): number {
  const m = 1 + WAVES.speedGrowthPerWave * (wave - 1);
  return difficulty.enemySpeedMultiplier * Math.min(m, WAVES.maxSpeedMultiplier);
}

export function countForWave(base: number, wave: number): number {
  return Math.round(base * (1 + WAVES.countGrowthPerWave * Math.floor((wave - 1) / 2)));
}

/** Deterministic wave composition. Pure function — unit tested.
 *  countMultiplier comes from the difficulty config (SPEC §8). Bosses are never scaled. */
export function buildWave(wave: number, countMultiplier = 1): WaveConfig {
  const groups: WaveEnemyGroup[] = [];
  const isBossWave = wave % WAVES.bossEvery === 0;
  const push = (g: WaveEnemyGroup) => groups.push(g);

  if (wave === SIEGE_FINALE.wave) {
    // Siege finale: copies, because difficulty scaling below mutates group counts.
    for (const g of SIEGE_FINALE.groups) push({ ...g });
    push({
      enemyId: 'warlord',
      count: 1,
      spawnInterval: SIEGE_FINALE.bossSpawnInterval,
      delayBefore: SIEGE_FINALE.bossDelayBefore,
      hpScaleBonus: SIEGE_FINALE.bossHpScaleBonus
    });
  } else if (wave <= 5) {
    push({ enemyId: 'thornling', count: 6 + wave * 2, spawnInterval: 0.8, delayBefore: 0.5 });
    if (wave >= 3) push({ enemyId: 'swiftwisp', count: 3 + wave, spawnInterval: 0.5, delayBefore: 4 });
    if (wave === 5) push({ enemyId: 'cragback', count: 2, spawnInterval: 2.0, delayBefore: 8 });
  } else if (wave <= 10) {
    push({ enemyId: 'thornling', count: countForWave(10, wave), spawnInterval: 0.6, delayBefore: 0.5 });
    push({ enemyId: 'swiftwisp', count: countForWave(8, wave), spawnInterval: 0.4, delayBefore: 3 });
    if (wave >= 8) push({ enemyId: 'cragback', count: 2 + Math.floor(wave / 4), spawnInterval: 1.6, delayBefore: 7 });
    if (wave === 10) push({ enemyId: 'warlord', count: 1, spawnInterval: 1, delayBefore: 12 });
  } else if (wave <= 15) {
    push({ enemyId: 'thornling', count: countForWave(10, wave), spawnInterval: 0.5, delayBefore: 0.5 });
    push({ enemyId: 'ironbark', count: countForWave(6, wave), spawnInterval: 0.7, delayBefore: 3 });
    push({ enemyId: 'swiftwisp', count: countForWave(8, wave), spawnInterval: 0.35, delayBefore: 6 });
    push({ enemyId: 'cragback', count: 3 + Math.floor(wave / 5), spawnInterval: 1.5, delayBefore: 9 });
  } else if (wave <= 20) {
    push({ enemyId: 'runescale', count: countForWave(7, wave), spawnInterval: 0.6, delayBefore: 0.5 });
    push({ enemyId: 'ironbark', count: countForWave(7, wave), spawnInterval: 0.6, delayBefore: 3 });
    push({ enemyId: 'mossmaw', count: countForWave(6, wave), spawnInterval: 0.7, delayBefore: 6 });
    push({ enemyId: 'gloomite', count: 14 + wave, spawnInterval: 0.25, delayBefore: 8 });
    if (wave === 20) push({ enemyId: 'warlord', count: 1, spawnInterval: 1, delayBefore: 12, hpScaleBonus: 1.8 });
  } else {
    // Endless scaling: mix everything, bosses scale
    const tier = Math.floor(wave / 10);
    push({ enemyId: 'thornling', count: countForWave(10, wave), spawnInterval: 0.4, delayBefore: 0.3 });
    push({ enemyId: 'swiftwisp', count: countForWave(10, wave), spawnInterval: 0.3, delayBefore: 2 });
    push({ enemyId: 'ironbark', count: countForWave(8, wave), spawnInterval: 0.5, delayBefore: 4 });
    push({ enemyId: 'runescale', count: countForWave(8, wave), spawnInterval: 0.5, delayBefore: 6 });
    push({ enemyId: 'mossmaw', count: countForWave(6, wave), spawnInterval: 0.55, delayBefore: 8 });
    push({ enemyId: 'gloomite', count: 16 + wave, spawnInterval: 0.2, delayBefore: 10 });
    push({ enemyId: 'cragback', count: 3 + tier * 2, spawnInterval: 1.2, delayBefore: 12 });
    if (isBossWave) {
      push({ enemyId: 'warlord', count: 1 + Math.floor((wave - 20) / 20), spawnInterval: 3, delayBefore: 15, hpScaleBonus: 1 + tier * 0.8 });
    } else if (wave % WAVES.eliteEvery === 0) {
      push({ enemyId: 'cragback', count: 2 + tier, spawnInterval: 1.0, delayBefore: 14, hpScaleBonus: 1.3 });
    }
  }

  // Safety: every 10th wave must have a boss even if logic above missed
  if (isBossWave && !groups.some((g) => g.enemyId === 'warlord')) {
    push({ enemyId: 'warlord', count: 1, spawnInterval: 1, delayBefore: 12 });
  }

  // Difficulty count scaling (SPEC §8). Boss groups are exempt so boss
  // waves stay exactly as designed; non-boss counts scale and clamp to >= 1.
  if (countMultiplier !== 1) {
    for (const g of groups) {
      if (g.enemyId === 'warlord') continue;
      g.count = Math.max(1, Math.round(g.count * countMultiplier));
    }
  }

  return { wave, groups, isBossWave, rewardBonus: Math.floor(wave * 2) };
}

export function enemyHpForWave(enemyId: keyof typeof ENEMIES, wave: number, difficulty: DifficultyConfig, hpScaleBonus = 1): number {
  const base = ENEMIES[enemyId].baseHp;
  return Math.round(base * hpMultiplierForWave(wave, difficulty) * hpScaleBonus);
}

export function enemySpeedForWave(enemyId: keyof typeof ENEMIES, wave: number, difficulty: DifficultyConfig): number {
  const base = ENEMIES[enemyId].baseSpeed;
  return base * speedMultiplierForWave(wave, difficulty);
}

export function totalEnemiesInWave(wave: WaveConfig): number {
  return wave.groups.reduce((s, g) => s + g.count, 0);
}
