import { describe, expect, it } from 'vitest';
import { DIFFICULTIES } from '../src/game/config/difficulties.ts';
import { SIEGE_FINALE } from '../src/game/config/waves.ts';
import { buildWave, countForWave } from '../src/game/systems/WaveSystem.ts';

describe('siege finale', () => {
  it('seeds the finale with today’s wave-30 endless-mix groups and boss bonus', () => {
    const tier = 3;
    expect(SIEGE_FINALE.wave).toBe(30);
    expect(SIEGE_FINALE.groups).toEqual([
      { enemyId: 'thornling', count: countForWave(10, 30), spawnInterval: 0.4, delayBefore: 0.3 },
      { enemyId: 'swiftwisp', count: countForWave(10, 30), spawnInterval: 0.3, delayBefore: 2 },
      { enemyId: 'ironbark', count: countForWave(8, 30), spawnInterval: 0.5, delayBefore: 4 },
      { enemyId: 'runescale', count: countForWave(8, 30), spawnInterval: 0.5, delayBefore: 6 },
      { enemyId: 'mossmaw', count: countForWave(6, 30), spawnInterval: 0.55, delayBefore: 8 },
      { enemyId: 'gloomite', count: 16 + 30, spawnInterval: 0.2, delayBefore: 10 },
      { enemyId: 'cragback', count: 3 + tier * 2, spawnInterval: 1.2, delayBefore: 12 }
    ]);
    expect(SIEGE_FINALE.bossHpScaleBonus).toBeCloseTo(1 + tier * 0.8);
  });
  it('builds wave 30 with exactly one Warlord finale', () => {
    const wave = buildWave(30);
    expect(wave.isBossWave).toBe(true);
    expect(wave.groups.filter((g) => g.enemyId === 'warlord')).toEqual([{ enemyId: 'warlord', count: 1, spawnInterval: 3, delayBefore: 15, hpScaleBonus: SIEGE_FINALE.bossHpScaleBonus }]);
    expect(wave.groups.filter((g) => g.enemyId !== 'warlord')).toEqual(SIEGE_FINALE.groups);
  });
  it('reads configuration without mutating it', () => {
    const original = SIEGE_FINALE.bossHpScaleBonus;
    try { SIEGE_FINALE.bossHpScaleBonus = 4; expect(buildWave(30).groups.find((g) => g.enemyId === 'warlord')?.hpScaleBonus).toBe(4); }
    finally { SIEGE_FINALE.bossHpScaleBonus = original; }
    const hard = buildWave(30, DIFFICULTIES.hard.enemyCountMultiplier);
    expect(hard.groups.find((g) => g.enemyId === 'warlord')?.count).toBe(1);
    expect(hard.groups[0].count).toBe(Math.max(1, Math.round(countForWave(10, 30) * DIFFICULTIES.hard.enemyCountMultiplier)));
    expect(SIEGE_FINALE.groups[0].count).toBe(countForWave(10, 30));
  });
  it('keeps bosses at 10 and 20 and endless escalation after 30', () => {
    expect(buildWave(10).groups.filter((g) => g.enemyId === 'warlord').map((g) => g.count)).toEqual([1]);
    expect(buildWave(20).groups.find((g) => g.enemyId === 'warlord')?.hpScaleBonus).toBe(1.8);
    expect(buildWave(40).groups.find((g) => g.enemyId === 'warlord')?.count).toBe(2);
    const total = (w: number) => buildWave(w).groups.reduce((n, g) => n + g.count, 0);
    expect(total(35)).toBeGreaterThan(total(31));
  });
});
