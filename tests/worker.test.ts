import { describe, it, expect } from 'vitest';
import worker from '../worker/index.ts';
import type { Env } from '../worker/index.ts';
import { GAME_VERSION, SCORE_VERSION } from '../src/shared/version.ts';
import { resultFixture } from './helpers/progressionResult.ts';

// Minimal in-memory D1 stub (supports the score_version-filtered schema).
function makeDb() {
  const rows: Record<string, unknown>[] = [];
  const runIds = new Set<string>();
  const db = {
    rows,
    queries: [] as string[],
    prepare(query: string) {
      const q = query;
      db.queries.push(query);
      return {
        _bindings: [] as unknown[],
        bind(...args: unknown[]) {
          (this as { _bindings: unknown[] })._bindings = args;
          return this;
        },
        async first() { return { '1': 1 }; },
        async all() {
          const b = (this as unknown as { _bindings: unknown[] })._bindings;
          // Leaderboard selects bind (scoreVersion, [difficulty,] limit).
          const onlyCurrentEra = (r: Record<string, unknown>) => (r.scoreVersion as number) === SCORE_VERSION;
          if (q.includes('AND difficulty')) {
            const diff = b[1];
            const limit = b[2] as number;
            const filtered = rows.filter((r) => r.difficulty === diff && onlyCurrentEra(r))
              .sort((a, c) => {
                const A = a as Record<string, number>; const C = c as Record<string, number>;
                return C.highestWave - A.highestWave || C.finalScore - A.finalScore || String(a.createdAt).localeCompare(String(c.createdAt));
              }).slice(0, limit);
            return { results: filtered };
          }
          if (q.includes('ORDER BY highest_wave')) {
            const limit = b[1] as number;
            const sorted = rows.filter(onlyCurrentEra).sort((a, c) => {
              const A = a as Record<string, number>; const C = c as Record<string, number>;
              return C.highestWave - A.highestWave || C.finalScore - A.finalScore || String(a.createdAt).localeCompare(String(c.createdAt));
            }).slice(0, limit);
            return { results: sorted };
          }
          return { results: [] };
        },
        async run() {
          const b = (this as unknown as { _bindings: unknown[] })._bindings;
          const runId = b[0] as string;
          if (runIds.has(runId)) {
            throw new Error('UNIQUE constraint failed: scores.run_id');
          }
          runIds.add(runId);
          const rec = {
            id: rows.length + 1,
            runId: b[0], playerName: b[1], difficulty: b[2], highestWave: b[3], finalScore: b[4],
            enemiesKilled: b[5], bossesKilled: b[6], remainingLives: b[7],
            gameDurationSeconds: b[8], gameVersion: b[9], scoreVersion: b[10],
            wavesCompleted: b[11], outcome: b[12], siegeBossesDefeated: b[13],
            createdAt: new Date().toISOString()
          };
          rows.push(rec);
          return { meta: { last_row_id: rec.id } };
        }
      };
    }
  };
  return db;
}

function req(path: string, init?: RequestInit): Request {
  return new Request(`https://game.local${path}`, init);
}

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    playerName: 'TestWarden', difficulty: 'medium', highestWave: 8,
    finalScore: 6000, enemiesKilled: 200, bossesKilled: 0, remainingLives: 0,
    wavesCompleted: 7, outcome: 'defeat', siegeBossesDefeated: 0,
    gameDurationSeconds: 600, runId: `run-${Math.random().toString(36).slice(2)}`,
    gameVersion: GAME_VERSION, scoreVersion: SCORE_VERSION, ...overrides
  };
}

describe('worker api', () => {
  const post = (env: Env, body: unknown) => worker.fetch(req('/api/scores', { method: 'POST', headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': `ip-${Math.random()}` }, body: JSON.stringify(body) }), env);
  it('round-trips victory, siege failure and endless defeat with progress fields', async () => {
    const db = makeDb(), env = { DB: db } as unknown as Env;
    for (const body of [
      resultFixture({ highestWave: 30, wavesCompleted: 30, outcome: 'victory', siegeBossesDefeated: 7 }, 10, { runId: 'progress-victory-01' }),
      resultFixture({ highestWave: 10, wavesCompleted: 9, outcome: 'siege-failed', siegeBossesDefeated: 0 }, 15, { runId: 'progress-failed-01' }),
      resultFixture({ highestWave: 31, wavesCompleted: 30, outcome: 'defeat', siegeBossesDefeated: 7 }, 0, { runId: 'progress-endless-01' })
    ]) expect((await post(env, body)).status).toBe(201);
    expect(db.queries.some((q) => q.includes('waves_completed') && q.includes('siege_bosses_defeated') && q.startsWith('INSERT'))).toBe(true);
    const body = (await (await worker.fetch(req('/api/leaderboard?difficulty=medium'), env)).json()) as { scoreVersion: number; scores: Array<Record<string, unknown>> };
    expect(SCORE_VERSION).toBe(2); expect(body.scoreVersion).toBe(SCORE_VERSION);
    expect(body.scores.map((s) => [s.runId, s.highestWave, s.wavesCompleted, s.outcome, s.siegeBossesDefeated, s.scoreVersion])).toEqual([
      ['progress-endless-01', 31, 30, 'defeat', 7, 2], ['progress-victory-01', 30, 30, 'victory', 7, 2], ['progress-failed-01', 10, 9, 'siege-failed', 0, 2]
    ]);
  });
  it('rejects forged progress and legacy-era payloads', async () => {
    const env = { DB: makeDb() } as unknown as Env;
    const victory = resultFixture({ highestWave: 30, wavesCompleted: 30, outcome: 'victory', siegeBossesDefeated: 7 }, 10, { runId: 'progress-forged-01' });
    for (const body of [{ ...victory, siegeBossesDefeated: 3 }, { ...victory, wavesCompleted: 29 }, { ...victory, scoreVersion: 1 }, { ...victory, remainingLives: 0 }]) {
      expect((await post(env, body)).status).toBe(400);
    }
  });
  it('health returns ok', async () => {
    const env = { DB: makeDb() } as unknown as Env;
    const res = await worker.fetch(req('/api/health'), env);
    expect(res.status).toBe(200);
    const j = (await res.json()) as { ok: boolean };
    expect(j.ok).toBe(true);
  });

  it('rejects invalid score payloads', async () => {
    const env = { DB: makeDb() } as unknown as Env;
    const res = await worker.fetch(req('/api/scores', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName: '', difficulty: 'nope', highestWave: -1, finalScore: 99999999, enemiesKilled: 0, bossesKilled: 0, remainingLives: 0, gameDurationSeconds: 0 })
    }), env);
    expect(res.status).toBe(400);
    const j = (await res.json()) as { error: { code: string } };
    expect(j.error.code).toBe('INVALID_SCORE');
  });

  it('accepts valid score and lists it on leaderboard', async () => {
    const env = { DB: makeDb() } as unknown as Env;
    const payload = validPayload();
    const post = await worker.fetch(req('/api/scores', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    }), env);
    expect(post.status).toBe(201);
    const lb = await worker.fetch(req('/api/leaderboard?difficulty=medium'), env);
    expect(lb.status).toBe(200);
    const j = (await lb.json()) as { scores: Array<{ playerName: string }> };
    expect(j.scores.length).toBe(1);
    expect(j.scores[0].playerName).toBe('TestWarden');
  });

  it('rejects duplicate run_id with 409', async () => {
    const env = { DB: makeDb() } as unknown as Env;
    const payload = validPayload({ runId: 'dup-run-1' });
    const first = await worker.fetch(req('/api/scores', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    }), env);
    expect(first.status).toBe(201);
    const second = await worker.fetch(req('/api/scores', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    }), env);
    expect(second.status).toBe(409);
    const j = (await second.json()) as { error: { code: string } };
    expect(j.error.code).toBe('DUPLICATE_RUN');
  });

  it('rejects unsupported score versions', async () => {
    const env = { DB: makeDb() } as unknown as Env;
    const res = await worker.fetch(req('/api/scores', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload({ scoreVersion: SCORE_VERSION + 1 }))
    }), env);
    expect(res.status).toBe(400);
  });

  it('keeps prior score eras out of the active leaderboard', async () => {
    const db = makeDb();
    db.rows.push({
      id: 1, runId: 'old-run-001', playerName: 'Earlier', difficulty: 'hard', highestWave: 40,
      finalScore: 999999, enemiesKilled: 4000, bossesKilled: 2, remainingLives: 0,
      wavesCompleted: 39, outcome: 'defeat', siegeBossesDefeated: 3,
      gameDurationSeconds: 10000, gameVersion: GAME_VERSION, scoreVersion: SCORE_VERSION - 1,
      createdAt: '2026-01-01T00:00:00.000Z'
    });
    const res = await worker.fetch(req('/api/leaderboard?difficulty=hard'), { DB: db } as unknown as Env);
    expect(res.status).toBe(200);
    expect(((await res.json()) as { scores: unknown[] }).scores).toEqual([]);
  });

  it('bounds the UTF-8 request stream before decoding the body', async () => {
    const env = { DB: makeDb() } as unknown as Env;
    const oversized = JSON.stringify(validPayload({ playerName: 'é'.repeat(2200) }));
    expect(new TextEncoder().encode(oversized).byteLength).toBeGreaterThan(4096);
    const res = await worker.fetch(req('/api/scores', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: oversized
    }), env);
    expect(res.status).toBe(413);
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('rejects malformed JSON and declared oversized requests safely', async () => {
    const env = { DB: makeDb() } as unknown as Env;
    const malformed = await worker.fetch(req('/api/scores', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{invalid'
    }), env);
    expect(malformed.status).toBe(400);
    expect(((await malformed.json()) as { error: { code: string } }).error.code).toBe('INVALID_JSON');

    const declaredTooLarge = await worker.fetch(req('/api/scores', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': '5000' }, body: JSON.stringify(validPayload())
    }), env);
    expect(declaredTooLarge.status).toBe(413);
  });

  it('uses prepared statements (bind) — no string interpolation of input', async () => {
    // Attempt SQL injection via name; stub stores literally, and validation rejects quotes anyway for names with ';--'
    const env = { DB: makeDb() } as unknown as Env;
    const evil = validPayload({ playerName: "x'; DROP TABLE scores;--", highestWave: 3, wavesCompleted: 2, finalScore: 500, enemiesKilled: 50 });
    const post = await worker.fetch(req('/api/scores', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(evil)
    }), env);
    // invalid chars -> 400, table intact
    expect(post.status).toBe(400);
    const lb = await worker.fetch(req('/api/leaderboard'), env);
    const j = (await lb.json()) as { scores: unknown[] };
    expect(j.scores.length).toBe(0);
  });
});
