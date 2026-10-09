import { describe, it, expect, vi } from 'vitest';
import { DIFFICULTIES, getDifficulty } from '../src/game/config/difficulties.ts';
import { TOWERS, towerTotalInvested, towerSellValue } from '../src/game/config/towers.ts';
import { buildWave, hpMultiplierForWave, scheduleWave, speedMultiplierForWave, totalEnemiesInWave } from '../src/game/systems/WaveSystem.ts';
import { calculateScore, rankScores } from '../src/game/systems/ScoreSystem.ts';
import { killReward, waveClearBonus, canAfford, sellRefund } from '../src/game/systems/EconomySystem.ts';
import { rollRarity, rollPowerUp } from '../src/game/systems/PowerUpSystem.ts';
import { POWERUP_INVENTORY_LIMIT } from '../src/game/config/powerUps.ts';
import { applyArmor, pickTarget } from '../src/game/systems/CombatSystem.ts';
import { validateScorePayload } from '../src/shared/validation.ts';
import { GAME_VERSION, SCORE_VERSION } from '../src/shared/version.ts';
import { fetchLeaderboard } from '../src/api/leaderboardClient.ts';

describe('difficulties', () => {
  it('has three centralized modes with score multipliers', () => {
    expect(DIFFICULTIES.easy.scoreMultiplier).toBe(1.0);
    expect(DIFFICULTIES.medium.scoreMultiplier).toBe(1.5);
    expect(DIFFICULTIES.hard.scoreMultiplier).toBe(2.0);
    expect(DIFFICULTIES.easy.startingGold).toBe(700);
    expect(DIFFICULTIES.medium.startingGold).toBe(600);
    expect(DIFFICULTIES.hard.startingGold).toBe(500);
  });
  it('falls back to medium on unknown id', () => {
    expect(getDifficulty('nightmare').id).toBe('medium');
  });
  it('carries the SPEC §8 count multipliers', () => {
    expect(DIFFICULTIES.easy.enemyCountMultiplier).toBe(0.9);
    expect(DIFFICULTIES.medium.enemyCountMultiplier).toBe(1.0);
    expect(DIFFICULTIES.hard.enemyCountMultiplier).toBe(1.1);
  });
});

describe('scoring', () => {
  it('rewards harder difficulties', () => {
    const input = { enemiesKilled: 100, elitesKilled: 10, wavesCompleted: 10, bossesKilled: 1, remainingLives: 10 };
    const easy = calculateScore(input, DIFFICULTIES.easy);
    const hard = calculateScore(input, DIFFICULTIES.hard);
    expect(hard.finalScore).toBe(easy.finalScore * 2);
    expect(easy.baseScore).toBe(hard.baseScore);
  });
  it('scales with waves and kills', () => {
    const a = calculateScore({ enemiesKilled: 10, elitesKilled: 0, wavesCompleted: 1, bossesKilled: 0, remainingLives: 10 }, DIFFICULTIES.medium);
    const b = calculateScore({ enemiesKilled: 100, elitesKilled: 5, wavesCompleted: 10, bossesKilled: 1, remainingLives: 10 }, DIFFICULTIES.medium);
    expect(b.finalScore).toBeGreaterThan(a.finalScore);
  });
  it('ranks by wave, then score, then earlier date', () => {
    const rows = [
      { highestWave: 5, finalScore: 9999, createdAt: '2026-01-02' },
      { highestWave: 8, finalScore: 100, createdAt: '2026-01-03' },
      { highestWave: 8, finalScore: 500, createdAt: '2026-01-04' },
      { highestWave: 8, finalScore: 500, createdAt: '2026-01-01' }
    ];
    const ranked = rankScores(rows);
    expect(ranked[0].createdAt).toBe('2026-01-01');
    expect(ranked[1].createdAt).toBe('2026-01-04');
    expect(ranked[2].finalScore).toBe(100);
    expect(ranked[3].highestWave).toBe(5);
  });
});

describe('waves', () => {
  it('scales HP and speed with wave number', () => {
    const d = DIFFICULTIES.medium;
    expect(hpMultiplierForWave(20, d)).toBeGreaterThan(hpMultiplierForWave(1, d));
    expect(speedMultiplierForWave(30, d)).toBeLessThanOrEqual(1.6 * d.enemySpeedMultiplier + 1e-9);
  });
  it('has boss every 10 waves', () => {
    expect(buildWave(10).isBossWave).toBe(true);
    expect(buildWave(20).isBossWave).toBe(true);
    expect(buildWave(10).groups.some((g) => g.enemyId === 'warlord')).toBe(true);
    expect(buildWave(7).isBossWave).toBe(false);
  });
  it('introduces armor/regen variety over time', () => {
    const w12 = buildWave(12);
    expect(w12.groups.some((g) => g.enemyId === 'ironbark')).toBe(true);
    const w18 = buildWave(18);
    const ids = w18.groups.map((g) => g.enemyId);
    expect(ids).toContain('runescale');
    expect(ids).toContain('mossmaw');
  });
  it('grows total enemy count', () => {
    expect(totalEnemiesInWave(buildWave(25))).toBeGreaterThan(totalEnemiesInWave(buildWave(2)));
  });
  it('scales non-boss counts by difficulty multiplier, never bosses', () => {
    const easy = buildWave(12, DIFFICULTIES.easy.enemyCountMultiplier);
    const base = buildWave(12, 1);
    expect(totalEnemiesInWave(easy)).toBeLessThanOrEqual(totalEnemiesInWave(base));
    const hard = buildWave(12, DIFFICULTIES.hard.enemyCountMultiplier);
    expect(totalEnemiesInWave(hard)).toBeGreaterThanOrEqual(totalEnemiesInWave(base));
    const bossBase = buildWave(10, 1).groups.find((g) => g.enemyId === 'warlord')!.count;
    const bossHard = buildWave(10, DIFFICULTIES.hard.enemyCountMultiplier).groups.find((g) => g.enemyId === 'warlord')!.count;
    expect(bossHard).toBe(bossBase);
  });
  it('schedules group delays from the same wave-relative start and sorts overlaps', () => {
    const events = scheduleWave([
      { enemyId: 'thornling', count: 2, spawnInterval: 1, delayBefore: 4 },
      { enemyId: 'swiftwisp', count: 2, spawnInterval: 0.5, delayBefore: 1, hpScaleBonus: 1.4 }
    ], 1000);
    expect(events.map((event) => event.atMs)).toEqual([2000, 2500, 5000, 6000]);
    expect(events[0]).toMatchObject({ enemyId: 'swiftwisp', hpBonus: 1.4 });
  });
});

describe('towers & economy', () => {
  it('each tower has 4 levels with meaningful growth', () => {
    for (const t of Object.values(TOWERS)) {
      expect(t.levels.length).toBe(4);
      expect(t.levels[3].damage).toBeGreaterThan(t.levels[0].damage * 3);
    }
  });
  it('upgrade chain sums correctly and sells at 70%', () => {
    const invested = towerTotalInvested('longbow', 3);
    expect(invested).toBe(100 + 90 + 180);
    expect(towerSellValue('longbow', 3)).toBe(Math.floor(invested * 0.7));
    expect(sellRefund('longbow', 3)).toBe(towerSellValue('longbow', 3));
  });
  it('kill reward respects difficulty and double bounty', () => {
    const base = killReward(10, DIFFICULTIES.easy, false);
    const hard = killReward(10, DIFFICULTIES.hard, false);
    expect(base).toBeGreaterThan(hard);
    expect(killReward(10, DIFFICULTIES.medium, true)).toBe(killReward(10, DIFFICULTIES.medium, false) * 2);
  });
  it('wave bonus grows', () => {
    expect(waveClearBonus(10)).toBeGreaterThan(waveClearBonus(1));
  });
  it('canAfford works', () => {
    expect(canAfford(100, 100)).toBe(true);
    expect(canAfford(99, 100)).toBe(false);
  });
  it('speed scaling caps and currency stays integer', () => {
    const d = DIFFICULTIES.hard;
    expect(speedMultiplierForWave(500, d)).toBeLessThanOrEqual(1.6 * d.enemySpeedMultiplier + 1e-9);
    for (const dd of [DIFFICULTIES.easy, DIFFICULTIES.medium, DIFFICULTIES.hard]) {
      expect(Number.isInteger(killReward(7, dd, false))).toBe(true);
      expect(Number.isInteger(sellRefund('ember', 4))).toBe(true);
    }
    expect(Number.isInteger(waveClearBonus(17))).toBe(true);
  });
  it('tower roles are distinct compact badges', () => {
    const roles = Object.values(TOWERS).map((t) => t.role);
    expect(new Set(roles).size).toBe(roles.length);
    for (const r of roles) expect(r.length).toBeLessThanOrEqual(6);
  });
});

describe('powerups', () => {
  it('rarity distribution roughly matches config', () => {
    let legendary = 0;
    const N = 20000;
    // deterministic LCG
    let s = 42;
    const rand = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
    for (let i = 0; i < N; i++) {
      if (rollRarity(rand) === 'legendary') legendary++;
    }
    const pct = (legendary / N) * 100;
    expect(pct).toBeGreaterThan(1);
    expect(pct).toBeLessThan(8);
  });
  it('rolls valid powerup ids', () => {
    for (let i = 0; i < 50; i++) {
      expect(typeof rollPowerUp()).toBe('string');
    }
  });
  it('caps the relic inventory at 3 (SPEC §24)', () => {
    expect(POWERUP_INVENTORY_LIMIT).toBe(3);
  });
});

describe('combat', () => {
  it('physical armor reduces physical, ward reduces arcane, elemental pierces halfway', () => {
    expect(applyArmor(100, 'physical', 0.5, 0)).toBe(50);
    expect(applyArmor(100, 'arcane', 0, 0.5)).toBe(50);
    expect(applyArmor(100, 'elemental', 0, 0.5)).toBe(75);
    expect(applyArmor(100, 'physical', 0, 0.5)).toBe(100);
    expect(applyArmor(100, 'arcane', 0.5, 0)).toBe(100);
  });
  it('targeting modes pick correctly', () => {
    const cands = [
      { id: 1, x: 0, y: 0, hp: 10, maxHp: 100, distanceTraveled: 5 },
      { id: 2, x: 5, y: 0, hp: 90, maxHp: 100, distanceTraveled: 50 },
      { id: 3, x: 1000, y: 0, hp: 50, maxHp: 100, distanceTraveled: 30 }
    ];
    expect(pickTarget(cands, 0, 0, 100, 'first')?.id).toBe(2);
    expect(pickTarget(cands, 0, 0, 100, 'last')?.id).toBe(1);
    expect(pickTarget(cands, 0, 0, 100, 'strongest')?.id).toBe(2);
    expect(pickTarget(cands, 0, 0, 100, 'weakest')?.id).toBe(1);
    expect(pickTarget(cands, 0, 0, 100, 'closest')?.id).toBe(1);
    expect(pickTarget(cands, 5000, 5000, 10, 'first')).toBeNull();
  });
});

describe('score validation', () => {
  const good = {
    playerName: 'Aria',
    difficulty: 'hard',
    highestWave: 12,
    finalScore: 20000,
    enemiesKilled: 400,
    bossesKilled: 1,
    remainingLives: 0,
    wavesCompleted: 11,
    outcome: 'defeat',
    siegeBossesDefeated: 1,
    gameDurationSeconds: 900,
    runId: 'test-run-0001',
    gameVersion: GAME_VERSION,
    scoreVersion: SCORE_VERSION
  };
  it('accepts valid payload', () => {
    const result = validateScorePayload(good);
    expect(result.ok).toBe(true);
  });
  it('normalizes Unicode player names and retains forbidden/oversized rejection', () => {
    const named = { ...good, playerName: 'Jose\u0301 A.' };
    expect(validateScorePayload(named)).toMatchObject({ ok: true, sanitizedName: 'Jos\u00e9 A.' });
    for (const playerName of ['a'.repeat(21), '<script>', '\u{1F600}']) expect(validateScorePayload({ ...named, playerName }).ok).toBe(false);
  });
  it('rejects a forged late wave with no progress', () => {
    expect(validateScorePayload({ ...good, highestWave: 500, finalScore: 0, enemiesKilled: 0, bossesKilled: 0, gameDurationSeconds: 0 }).ok).toBe(false);
  });
  it('allows a plausible Hard wave-two loss with no kills', () => {
    expect(validateScorePayload({ ...good, difficulty: 'hard', highestWave: 2, finalScore: 181, enemiesKilled: 0, bossesKilled: 0, remainingLives: 0, wavesCompleted: 1, siegeBossesDefeated: 0, gameDurationSeconds: 30 }).ok).toBe(true);
  });
  it('rejects hard wave-six survival that credits every kill with a repair', () => {
    const forged = {
      ...good,
      difficulty: 'hard',
      highestWave: 6,
      enemiesKilled: 15,
      bossesKilled: 0,
      remainingLives: 0,
      wavesCompleted: 5,
      siegeBossesDefeated: 0,
      finalScore: 1550,
      gameDurationSeconds: 3600
    };
    const result = validateScorePayload(forged);
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('enemiesKilled is too low for completed-wave survival');
  });
  it('rejects 62-kill Hard wave-six survival below the configured repair tail', () => {
    const forged = {
      ...good,
      difficulty: 'hard',
      highestWave: 6,
      enemiesKilled: 62,
      bossesKilled: 0,
      remainingLives: 0,
      wavesCompleted: 5,
      siegeBossesDefeated: 0,
      finalScore: 2490,
      gameDurationSeconds: 3600
    };
    const result = validateScorePayload(forged);
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('enemiesKilled is too low for completed-wave survival');
  });
  it('allows plausible lucky repair outcomes from a milestone and configured rare drops', () => {
    const lucky = {
      ...good,
      difficulty: 'hard',
      highestWave: 6,
      enemiesKilled: 70,
      bossesKilled: 0,
      remainingLives: 0,
      wavesCompleted: 5,
      siegeBossesDefeated: 0,
      finalScore: 2650,
      gameDurationSeconds: 3600
    };
    expect(validateScorePayload(lucky).ok).toBe(true);
  });
  it('credits boss leak avoidance only for claimed bosses in completed waves', () => {
    const atWaveEleven = (bossesKilled: number, finalScore: number) => validateScorePayload({
      ...good,
      highestWave: 11,
      wavesCompleted: 10,
      siegeBossesDefeated: 1,
      enemiesKilled: 289,
      bossesKilled,
      remainingLives: 0,
      finalScore,
      gameDurationSeconds: 3600
    });
    expect(atWaveEleven(0, 9530).errors).toContain('enemiesKilled is too low for completed-wave survival');
    expect(atWaveEleven(1, 10530).ok).toBe(true);

    const atWaveTwenty = (bossesKilled: number, finalScore: number) => validateScorePayload({
      ...good,
      highestWave: 20,
      wavesCompleted: 19,
      siegeBossesDefeated: 1,
      enemiesKilled: 1194,
      bossesKilled,
      remainingLives: 0,
      finalScore,
      gameDurationSeconds: 3600
    });
    expect(atWaveTwenty(1, 36280).ok).toBe(true);
    // The second scheduled boss belongs to the current (wave 20), not a
    // completed wave, so its five-life leak cannot fund earlier survival.
    expect(atWaveTwenty(2, 37280).errors).toContain('enemiesKilled is too low for completed-wave survival');
  });
  it('allows a late run inside the configured score envelope', () => {
    expect(validateScorePayload({ ...good, highestWave: 40, wavesCompleted: 39, siegeBossesDefeated: 7, finalScore: 250000, enemiesKilled: 8000, bossesKilled: 3, gameDurationSeconds: 10000 }).ok).toBe(true);
  });
  it('rejects bad difficulty, names, negatives, absurd scores', () => {
    expect(validateScorePayload({ ...good, difficulty: 'nightmare' }).ok).toBe(false);
    expect(validateScorePayload({ ...good, playerName: '' }).ok).toBe(false);
    expect(validateScorePayload({ ...good, playerName: 'x'.repeat(30) }).ok).toBe(false);
    expect(validateScorePayload({ ...good, finalScore: -5 }).ok).toBe(false);
    expect(validateScorePayload({ ...good, finalScore: 99999999 }).ok).toBe(false);
    expect(validateScorePayload({ ...good, highestWave: 600 }).ok).toBe(false);
    expect(validateScorePayload({ ...good, bossesKilled: 99 }).ok).toBe(false);
    expect(validateScorePayload({ ...good, playerName: '<script>' }).ok).toBe(false);
  });
  it('requires run identity and the active score version', () => {
    const { runId: _drop, ...noRun } = good;
    void _drop;
    expect(validateScorePayload(noRun).ok).toBe(false);
    expect(validateScorePayload({ ...good, runId: 'x' }).ok).toBe(false);
    expect(validateScorePayload({ ...good, scoreVersion: SCORE_VERSION + 1 }).ok).toBe(false);
    expect(validateScorePayload({ ...good, gameVersion: '' }).ok).toBe(false);
  });
});

describe('leaderboard result', () => {
  const validScore = {
    id: 1,
    playerName: 'Aria',
    difficulty: 'hard',
    highestWave: 2,
    wavesCompleted: 1,
    outcome: 'defeat',
    siegeBossesDefeated: 0,
    finalScore: 181,
    enemiesKilled: 0,
    bossesKilled: 0,
    remainingLives: 0,
    gameDurationSeconds: 30,
    runId: 'test-run-0001',
    gameVersion: GAME_VERSION,
    scoreVersion: SCORE_VERSION,
    createdAt: '2026-10-07T00:00:00.000Z'
  };

  it('distinguishes a successful empty board from an unavailable API', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ scores: [] }), { status: 200 })));
    await expect(fetchLeaderboard()).resolves.toEqual({ ok: true, scores: [] });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { message: 'Database unavailable' } }), { status: 503 })));
    await expect(fetchLeaderboard()).resolves.toEqual({ ok: false, message: 'Database unavailable' });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{invalid', { status: 200 })));
    await expect(fetchLeaderboard()).resolves.toMatchObject({ ok: false, message: 'Leaderboard returned an invalid response.' });

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    await expect(fetchLeaderboard()).resolves.toMatchObject({ ok: false, message: 'offline' });
    vi.unstubAllGlobals();
  });

  it('rejects malformed score rows and rows from another scoring era', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ scores: [{}] }), { status: 200 })));
    await expect(fetchLeaderboard()).resolves.toEqual({ ok: false, message: 'Leaderboard returned malformed score data.' });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      scores: [{ ...validScore, scoreVersion: SCORE_VERSION - 1 }]
    }), { status: 200 })));
    await expect(fetchLeaderboard()).resolves.toEqual({ ok: false, message: 'Leaderboard returned malformed score data.' });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ scores: [validScore] }), { status: 200 })));
    await expect(fetchLeaderboard()).resolves.toEqual({ ok: true, scores: [validScore] });
    vi.unstubAllGlobals();
  });
});

describe('legacy sale value', () => {
  it('rounds seventy percent of a full Ranger build down exactly', () => {
    expect(towerTotalInvested('longbow', 4)).toBe(710);
    expect(sellRefund('longbow', 4)).toBe(497);
    expect(towerSellValue('longbow', 4)).toBe(497);
  });
});
