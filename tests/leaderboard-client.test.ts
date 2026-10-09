import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchLeaderboard } from '../src/api/leaderboardClient.ts';
import { GAME_VERSION, SCORE_VERSION } from '../src/shared/version.ts';

const row = { id: 1, playerName: 'Aria', difficulty: 'medium', highestWave: 30, finalScore: 90000, enemiesKilled: 2000, bossesKilled: 3, remainingLives: 10, gameDurationSeconds: 1500, runId: 'progress-row-0001', gameVersion: GAME_VERSION, scoreVersion: SCORE_VERSION, createdAt: '2026-10-08T00:00:00.000Z', wavesCompleted: 30, outcome: 'victory', siegeBossesDefeated: 7 };
const respond = (scores: unknown[]) => vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ scores, scoreVersion: SCORE_VERSION }), { status: 200 })));
afterEach(() => vi.unstubAllGlobals());

describe('leaderboard row contract', () => {
  it('accepts rows carrying the progress fields', async () => { respond([row]); await expect(fetchLeaderboard()).resolves.toEqual({ ok: true, scores: [row] }); });
  it.each([['missing outcome', { ...row, outcome: undefined }], ['unknown outcome', { ...row, outcome: 'won' }], ['completion above highest wave', { ...row, wavesCompleted: 31 }], ['mask out of range', { ...row, siegeBossesDefeated: 8 }], ['fractional completion', { ...row, wavesCompleted: 29.5 }]] as const)('rejects %s', async (_name, bad) => {
    respond([bad]); await expect(fetchLeaderboard()).resolves.toEqual({ ok: false, message: 'Leaderboard returned malformed score data.' });
  });
});
