import { expect, it } from 'vitest';
import type { CampaignLevelProgress } from '../src/game/campaign/types.ts';
import { CAMPAIGN_LEVELS, getCampaignLevel } from '../src/game/campaign/config.ts';
import { applyCampaignClear } from '../src/shared/campaignProgress.ts';
import { campaignScoreMetadata } from '../src/shared/campaignScoring.ts';
import { emptyCloudProgress, validateCloudProgress } from '../src/shared/cloudProgress.ts';
import { compareCampaignRows, validateCampaignLeaderboard } from '../src/shared/campaignLeaderboard.ts';
import type { CampaignLeaderboardResponse, CampaignLeaderboardRow } from '../src/shared/campaignLeaderboard.ts';
import { handleCampaignLeaderboard } from '../worker/campaignLeaderboard.ts';
import { hash } from '../worker/auth.ts';
import worker from '../worker/index.ts';
import { accountDb } from './helpers/accountDb.ts';
import legacyCloudCompleted30 from './fixtures/campaign-v5/legacy_cloud_completed_30.json';

type CloudProgress = ReturnType<typeof emptyCloudProgress>;

function levelProgress(
  level: number,
  options: { score?: number; livesStar?: boolean; scoreStar?: boolean } = {}
): CampaignLevelProgress {
  const definition = getCampaignLevel(level)!;
  const score = options.score ?? 0;
  return {
    completed: true,
    completionStar: true,
    livesStar: options.livesStar ?? false,
    scoreStar: options.scoreStar ?? false,
    bestScore: 0,
    bestRemainingLives: options.livesStar ? definition.mastery.minimumLivesForStar : 0,
    ...(score ? { campaignScore: { version: 1, bestScore: score } } : {})
  };
}

function progressWith(levels: Record<number, CampaignLevelProgress>): CloudProgress {
  const progress = emptyCloudProgress();
  for (const [level, value] of Object.entries(levels)) progress.levels[Number(level)] = value;
  return progress;
}

function clear(level: number, score = campaignScoreMetadata(level).perfectScore): CampaignLevelProgress {
  return applyCampaignClear(undefined, level, score, 20)!;
}

async function sync(f: Awaited<ReturnType<typeof accountDb>>, id: string, progress: CloudProgress): Promise<Response> {
  return worker.fetch(f.request('/api/account/sync', id, { progress }), f.env);
}

async function board(f: Awaited<ReturnType<typeof accountDb>>, limit?: string): Promise<Response> {
  const query = limit === undefined ? '' : `?limit=${encodeURIComponent(limit)}`;
  return (await handleCampaignLeaderboard(new Request(`https://game.example/api/campaign-leaderboard${query}`), f.env))!;
}

async function scores(response: Response): Promise<CampaignLeaderboardResponse> {
  return await response.json() as CampaignLeaderboardResponse;
}

const row = (overrides: Partial<CampaignLeaderboardRow> = {}): CampaignLeaderboardRow => ({
  playerId: 'player', nickname: 'Warden', missionsCompleted: 1, totalStars: 1, totalScore: 0, ...overrides
});

it('publishes acknowledged progress and preserves its score after a stale sync', async () => {
  const f = await accountDb();
  try {
    const progress = progressWith({ 1: clear(1) });
    expect((await sync(f, 'a', progress)).status).toBe(200);
    const stored = await f.db.prepare('SELECT progress_json FROM players WHERE id=?').bind('a').first<{ progress_json: string }>();
    expect((await sync(f, 'a', emptyCloudProgress())).status).toBe(200);

    const response = await worker.fetch(new Request('https://game.example/api/campaign-leaderboard?limit=20'), f.env);
    expect(response.status).toBe(200);
    const body = await scores(response);
    expect(body).toEqual({
      campaignScoreVersion: 1, missionCount: 100, starCount: 300,
      scores: [{ playerId: 'a', nickname: 'Name a', missionsCompleted: 1, totalStars: 3, totalScore: campaignScoreMetadata(1).perfectScore }]
    });
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=15');
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    expect(JSON.stringify(body)).not.toMatch(/generation|subject|csrf|progress_json|email/);
    expect(await f.db.prepare('SELECT progress_json FROM players WHERE id=?').bind('a').first()).toEqual(stored);
  } finally { await f.dispose(); }
});

it('orders SQL aggregates by missions, stars, score, then bytewise player ID', async () => {
  const f = await accountDb();
  try {
    const a = progressWith({ 1: levelProgress(1, { score: 100 }), 2: levelProgress(2, { score: 100 }) });
    const b = progressWith({ 1: clear(1) });
    expect((await sync(f, 'a', a)).status).toBe(200);
    expect((await sync(f, 'b', b)).status).toBe(200);
    expect((await scores(await board(f, '1'))).scores.map((x) => x.playerId)).toEqual(['a']);

    b.levels[2] = levelProgress(2);
    expect((await sync(f, 'b', b)).status).toBe(200);
    expect((await scores(await board(f, '1'))).scores.map((x) => x.playerId)).toEqual(['b']);

    a.levels[1] = levelProgress(1, { score: 100, livesStar: true });
    a.levels[2] = levelProgress(2, { score: 100, livesStar: true });
    expect((await sync(f, 'a', a)).status).toBe(200);
    expect((await scores(await board(f, '1'))).scores.map((x) => x.playerId)).toEqual(['b']);

    a.levels[1] = levelProgress(1, { score: campaignScoreMetadata(1).perfectScore, livesStar: true });
    b.levels[2] = levelProgress(2, { score: 100 });
    expect((await sync(f, 'a', a)).status).toBe(200);
    expect((await sync(f, 'b', b)).status).toBe(200);
    const tied = (await scores(await board(f, '2'))).scores;
    expect(tied.map((x) => [x.playerId, x.missionsCompleted, x.totalStars, x.totalScore])).toEqual([
      ['a', 2, 4, campaignScoreMetadata(1).perfectScore + 100],
      ['b', 2, 4, campaignScoreMetadata(1).perfectScore + 100]
    ]);
  } finally { await f.dispose(); }
});

it('includes current and legacy-only progress, omits empty accounts, and counts guest import once', async () => {
  const f = await accountDb();
  try {
    expect((await scores(await board(f))).scores).toEqual([]);
    const current = progressWith({ 1: clear(1) });
    expect((await sync(f, 'a', current)).status).toBe(200);
    expect((await sync(f, 'b', validateCloudProgress(legacyCloudCompleted30)!)).status).toBe(200);
    const rows = (await scores(await board(f))).scores;
    expect(rows.find((x) => x.playerId === 'a')).toMatchObject({ missionsCompleted: 1, totalStars: 3, totalScore: campaignScoreMetadata(1).perfectScore });
    expect(rows.find((x) => x.playerId === 'b')).toMatchObject({ missionsCompleted: 30, totalScore: 0 });

    const guest = progressWith({ 31: clear(31), 32: clear(32, campaignScoreMetadata(32).scoreTarget) });
    const snapshot = { progress: guest, nickname: 'Imported Warden', result: null, warnings: [] };
    const importId = crypto.randomUUID();
    expect((await worker.fetch(f.request('/api/account/import', 'a', { importId, generation: 'g-a', snapshot }), f.env)).status).toBe(200);
    expect((await worker.fetch(f.request('/api/account/import', 'a', { importId, generation: 'g-a', snapshot }), f.env)).status).toBe(200);
    const imported = (await scores(await board(f))).scores.find((x) => x.playerId === 'a');
    expect(imported).toMatchObject({ missionsCompleted: 3, totalScore: campaignScoreMetadata(1).perfectScore + campaignScoreMetadata(31).perfectScore + campaignScoreMetadata(32).scoreTarget });
    expect((await f.db.prepare('SELECT progress_json FROM players WHERE id=?').bind('b').first<{ progress_json: string }>())?.progress_json).toContain('"levels"');
  } finally { await f.dispose(); }
});

it('returns exact maximum campaign aggregates and shared validation rejects out-of-bounds rows', async () => {
  const f = await accountDb();
  try {
    const levels: Record<number, CampaignLevelProgress> = {};
    for (const definition of CAMPAIGN_LEVELS) levels[definition.level] = clear(definition.level);
    expect((await sync(f, 'a', progressWith(levels))).status).toBe(200);
    const result = await scores(await board(f, '100'));
    const maxScore = CAMPAIGN_LEVELS.reduce((sum, level) => sum + campaignScoreMetadata(level.level).perfectScore, 0);
    expect(result.scores).toEqual([{ playerId: 'a', nickname: 'Name a', missionsCompleted: 100, totalStars: 300, totalScore: maxScore }]);
    expect(validateCampaignLeaderboard(result, 100)).toEqual(result);
    expect(validateCampaignLeaderboard({ ...result, scores: [row({ missionsCompleted: 101, totalStars: 303 })] })).toBeNull();
    expect(validateCampaignLeaderboard({ ...result, scores: [row({ totalScore: maxScore + 1 })] })).toBeNull();
    expect(validateCampaignLeaderboard({ ...result, scores: [row(), { ...row(), playerId: 'player' }] })).toBeNull();
    expect(validateCampaignLeaderboard({ ...result, privateProgress: '{}' })).toBeNull();
  } finally { await f.dispose(); }
});

it('rejects malformed limits and returns null outside the exact public GET route', async () => {
  const f = await accountDb();
  try {
    for (const limit of ['0', '101', '1.0', '01', '-1', '1e2', '', '999999999999999999999']) {
      const response = await handleCampaignLeaderboard(new Request(`https://game.example/api/campaign-leaderboard?limit=${encodeURIComponent(limit)}`), f.env);
      expect(response?.status, limit).toBe(400);
      expect(await response?.json()).toEqual({ ok: false, error: { code: 'INVALID_LIMIT', message: 'Limit must be an integer from 1 to 100.' } });
      expect(response?.headers.get('Cache-Control')).toBe('no-store');
    }
    expect((await handleCampaignLeaderboard(new Request('https://game.example/api/campaign-leaderboard?limit=1&limit=2'), f.env))?.status).toBe(400);
    expect(await handleCampaignLeaderboard(new Request('https://game.example/api/leaderboard'), f.env)).toBeNull();
    expect(await handleCampaignLeaderboard(new Request('https://game.example/api/campaign-leaderboard', { method: 'POST' }), f.env)).toBeNull();
  } finally { await f.dispose(); }
});

it('guards malformed, future, array/string, boolean, fractional, and integral-real JSON in real D1', async () => {
  const f = await accountDb();
  try {
    expect((await sync(f, 'a', progressWith({ 1: clear(1) }))).status).toBe(200);
    const oneClear = progressWith({ 1: clear(1) });
    const oneClearJson = JSON.stringify(oneClear);
    const current = oneClear.levels[1]!.campaignScore!;
    const integralReal = oneClearJson.replace(
      `"campaignScore":{"version":1,"bestScore":${current.bestScore}}`,
      `"campaignScore":{"version":1.0,"bestScore":${current.bestScore}.0}`
    );
    expect(integralReal).not.toBe(oneClearJson);
    const cases = [
      '{"version":',
      JSON.stringify({ ...emptyCloudProgress(), version: 2, levels: { 1: clear(1) } }),
      JSON.stringify({ ...emptyCloudProgress(), levels: [clear(1)] }),
      JSON.stringify({ ...emptyCloudProgress(), levels: 'not-an-object' }),
      JSON.stringify({ ...oneClear, levels: { 1: { ...oneClear.levels[1], campaignScore: { version: 2, bestScore: current.bestScore } } } }),
      oneClearJson.replace(`"bestScore":${current.bestScore}`, '"bestScore":true'),
      oneClearJson.replace(`"bestScore":${current.bestScore}`, `"bestScore":${current.bestScore}.5`)
    ];
    for (const raw of cases) {
      await f.db.prepare('UPDATE players SET progress_json=? WHERE id=?').bind(raw, 'b').run();
      const response = await board(f);
      expect((await scores(response)).scores.map((x) => x.playerId)).toEqual(['a']);
      expect((await f.db.prepare('SELECT progress_json FROM players WHERE id=?').bind('b').first<{ progress_json: string }>())?.progress_json).toBe(raw);
    }

    await f.db.prepare('UPDATE players SET progress_json=? WHERE id=?').bind(integralReal, 'b').run();
    const realResponse = await board(f);
    expect((await scores(realResponse)).scores.map((x) => x.playerId)).toEqual(['a', 'b']);
    expect((await f.db.prepare('SELECT progress_json FROM players WHERE id=?').bind('b').first<{ progress_json: string }>())?.progress_json).toBe(integralReal);

    const corruptedClassic = { ...oneClear, levels: { 1: clear(1), 2: clear(2) }, bests: [{ score: 1, wave: 1, difficulty: 'medium', date: 'not-a-date', scoreVersion: 3 }] };
    const corruptRaw = JSON.stringify(corruptedClassic);
    await f.db.prepare('UPDATE players SET progress_json=? WHERE id=?').bind(corruptRaw, 'b').run();
    expect((await scores(await board(f))).scores.map((x) => x.playerId)).toEqual(['a']);
    expect((await f.db.prepare('SELECT progress_json FROM players WHERE id=?').bind('b').first<{ progress_json: string }>())?.progress_json).toBe(corruptRaw);
  } finally { await f.dispose(); }
});

it('continues past 125 corrupt top candidates until a valid player fills the requested limit', async () => {
  const f = await accountDb();
  try {
    expect((await sync(f, 'a', progressWith({ 1: clear(1) }))).status).toBe(200);
    const corrupt = { ...progressWith({ 1: clear(1), 2: clear(2) }), bests: [{ score: 1, wave: 1, difficulty: 'medium', date: 'broken', scoreVersion: 3 }] };
    const raw = JSON.stringify(corrupt);
    for (let index = 0; index < 125; index++) {
      const suffix = String(index).padStart(3, '0');
      await f.db.prepare('INSERT INTO players(id,generation,issuer,subject,nickname,progress_json) VALUES(?,?,?,?,?,?)')
        .bind(`bad-${suffix}`, `g-bad-${suffix}`, 'https://accounts.google.com', `sub-bad-${suffix}`, `Bad ${suffix}`, raw).run();
    }
    const response = await board(f, '1');
    expect(response.status).toBe(200);
    expect((await scores(response)).scores.map((x) => x.playerId)).toEqual(['a']);
    expect((await f.db.prepare('SELECT COUNT(*) n FROM players WHERE id LIKE ?').bind('bad-%').first<{ n: number }>())?.n).toBe(125);
  } finally { await f.dispose(); }
}, 30000);

it('publishes nickname changes immediately, removes deleted accounts, and treats recreation as a new ID', async () => {
  const f = await accountDb();
  try {
    expect((await sync(f, 'a', progressWith({ 1: clear(1) }))).status).toBe(200);
    expect((await worker.fetch(f.request('/api/account/nickname', 'a', { nickname: 'New Name' }, 'PATCH'), f.env)).status).toBe(200);
    expect((await scores(await board(f))).scores[0]).toMatchObject({ playerId: 'a', nickname: 'New Name' });

    expect((await worker.fetch(f.request('/api/account/delete', 'a', { confirm: true }), f.env)).status).toBe(200);
    expect((await scores(await board(f))).scores).toEqual([]);
    const token = 'token-recreated';
    const id = 'a-recreated';
    await f.db.prepare('INSERT INTO players(id,generation,issuer,subject,nickname,progress_json) VALUES(?,?,?,?,?,?)')
      .bind(id, 'g-a-recreated', 'https://accounts.google.com', 'sub-a', 'Name a', JSON.stringify(emptyCloudProgress())).run();
    await f.db.prepare('INSERT INTO sessions(token_hash,player_id,generation,expires_at,csrf,reauthenticated_at) VALUES(?,?,?,?,?,?)')
      .bind(await hash(token), id, 'g-a-recreated', Date.now() + 1_000_000, 'csrf-recreated', Date.now()).run();
    const newSync = new Request('https://game.example/api/account/sync', {
      method: 'POST', headers: { Cookie: `__Host-aether-session=${token}`, Origin: 'https://game.example', 'X-CSRF-Token': 'csrf-recreated', 'Content-Type': 'application/json' },
      body: JSON.stringify({ progress: progressWith({ 1: clear(1) }) })
    });
    expect((await worker.fetch(newSync, f.env)).status).toBe(200);
    expect((await scores(await board(f))).scores).toEqual([
      { playerId: id, nickname: 'Name a', missionsCompleted: 1, totalStars: 3, totalScore: campaignScoreMetadata(1).perfectScore }
    ]);
  } finally { await f.dispose(); }
});

it('reports query failure as unavailable instead of an empty ranking', async () => {
  const f = await accountDb();
  try {
    const env = { ...f.env, DB: { prepare: () => { throw new Error('database unavailable'); } } as unknown as D1Database };
    const response = await handleCampaignLeaderboard(new Request('https://game.example/api/campaign-leaderboard'), env);
    expect(response?.status).toBe(503);
    expect(await response?.json()).toEqual({ ok: false, error: { code: 'API_UNAVAILABLE', message: 'Campaign leaderboard is temporarily unavailable.' } });
    expect(response?.headers.get('Cache-Control')).toBe('no-store');
  } finally { await f.dispose(); }
});

it('reports SQL and shared-validation aggregate mismatches as server errors', async () => {
  const f = await accountDb();
  try {
    expect((await sync(f, 'a', progressWith({ 1: clear(1) }))).status).toBe(200);
    const progress = (await f.db.prepare('SELECT progress_json FROM players WHERE id=?').bind('a').first<{ progress_json: string }>())!.progress_json;
    const env = {
      ...f.env,
      DB: {
        prepare: () => ({
          bind: () => ({
            all: async () => ({ results: [{
              playerId: 'a', nickname: 'Name a', missionsCompleted: 1, totalStars: 2,
              totalScore: campaignScoreMetadata(1).perfectScore, privateProgress: progress
            }] })
          })
        })
      } as unknown as D1Database
    };
    const response = await handleCampaignLeaderboard(new Request('https://game.example/api/campaign-leaderboard'), env);
    expect(response?.status).toBe(503);
    expect(await response?.json()).toMatchObject({ error: { code: 'API_UNAVAILABLE' } });
  } finally { await f.dispose(); }
});

it('validates public response shape, aggregate bounds, unique IDs, and deterministic ordering', () => {
  const response: CampaignLeaderboardResponse = { campaignScoreVersion: 1, missionCount: 100, starCount: 300, scores: [row({ playerId: 'a' }), row({ playerId: 'b' })] };
  expect(validateCampaignLeaderboard(response)).toEqual(response);
  expect(validateCampaignLeaderboard({ ...response, scores: [response.scores[1]!, response.scores[0]!] })).toBeNull();
  expect(validateCampaignLeaderboard(response, 1)).toBeNull();
  expect(validateCampaignLeaderboard({ ...response, scores: [row({ totalStars: 4 })] })).toBeNull();
  expect(validateCampaignLeaderboard({ ...response, scores: [row({ playerId: '' })] })).toBeNull();
  expect(compareCampaignRows(row({ missionsCompleted: 2 }), row({ missionsCompleted: 1 }))).toBeLessThan(0);
  expect(compareCampaignRows(row({ totalStars: 2 }), row({ totalStars: 1 }))).toBeLessThan(0);
  expect(compareCampaignRows(row({ totalScore: 2 }), row({ totalScore: 1 }))).toBeLessThan(0);
  expect(compareCampaignRows(row({ playerId: 'A' }), row({ playerId: 'a' }))).toBeLessThan(0);
  expect(validateCampaignLeaderboard({ ...response, scores: [row({ totalStars: 1.5 })] })).toBeNull();
  expect(validateCampaignLeaderboard({ ...response, scores: [{ ...row(), debug: true }] })).toBeNull();
});

it('keeps a legacy score star that reached the clamped bar on the board', async () => {
  const f = await accountDb();
  try {
    const level = 30;
    const live = campaignScoreMetadata(level).scoreTarget;
    const legacy: CampaignLevelProgress = {
      completed: true, completionStar: true, livesStar: false, scoreStar: true,
      bestScore: live, bestRemainingLives: 0
    };

    expect((await sync(f, 'a', progressWith({ [level]: legacy }))).status).toBe(200);
    expect((await scores(await board(f))).scores).toEqual([
      { playerId: 'a', nickname: 'Name a', missionsCompleted: 1, totalStars: 2, totalScore: 0 }
    ]);
  } finally { await f.dispose(); }
});
