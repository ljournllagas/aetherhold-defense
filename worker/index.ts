import { SCORE_VERSION, validateScorePayload } from '../src/shared/validation.ts';

export interface Env {
  DB: D1Database;
  /** Native per-location score limiter binding (`[[ratelimits]]` in wrangler.toml). */
  SCORE_RATE_LIMITER: RateLimit;
}

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'"
};

const MAX_BODY_BYTES = 4096;

type BoundedBody = { ok: true; text: string } | { ok: false; tooLarge: boolean };

async function readBoundedBody(request: Request): Promise<BoundedBody> {
  const reader = request.body?.getReader();
  if (!reader) return { ok: true, text: '' };
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let bytes = 0;
  let text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BODY_BYTES) {
        try { await reader.cancel(); } catch { /* response is already bounded */ }
        return { ok: false, tooLarge: true };
      }
      text += decoder.decode(value, { stream: true });
    }
    return { ok: true, text: text + decoder.decode() };
  } catch {
    return { ok: false, tooLarge: false };
  }
}

// Scores are throttled by the native rate-limit binding, whose counters are
// per-location and eventually consistent; the trusted client address is the
// platform-provided CF-Connecting-IP header (client-supplied X-Forwarded-For is
// never trusted for the key).

function json(data: unknown, status = 200): Response {
  const res = new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.headers.set(k, v);
  return res;
}

function apiError(code: string, message: string, status: number): Response {
  return json({ ok: false, error: { code, message } }, status);
}

function isValidDifficulty(d: string | null): d is 'easy' | 'medium' | 'hard' {
  return d === 'easy' || d === 'medium' || d === 'hard';
}

const LEADERBOARD_SELECT = `SELECT id, run_id AS runId, player_name AS playerName, difficulty,
  highest_wave AS highestWave, final_score AS finalScore, enemies_killed AS enemiesKilled,
  bosses_killed AS bossesKilled, remaining_lives AS remainingLives,
  game_duration_seconds AS gameDurationSeconds, game_version AS gameVersion,
  score_version AS scoreVersion, created_at AS createdAt,
  waves_completed AS wavesCompleted, outcome, siege_bosses_defeated AS siegeBossesDefeated FROM scores
  WHERE score_version = ?1`;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight for API
    if (request.method === 'OPTIONS' && path.startsWith('/api/')) {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    try {
      if (path === '/api/health' && request.method === 'GET') {
        // Touch DB to prove wiring
        await env.DB.prepare('SELECT 1').first();
        return json({ ok: true, time: new Date().toISOString(), scoreVersion: SCORE_VERSION });
      }

      if (path === '/api/leaderboard' && request.method === 'GET') {
        const diff = url.searchParams.get('difficulty');
        const limitRaw = url.searchParams.get('limit');
        let limit = parseInt(limitRaw ?? '20', 10);
        if (!Number.isFinite(limit) || limit <= 0) limit = 20;
        limit = Math.min(Math.max(limit, 1), 100);
        let rows;
        if (diff && isValidDifficulty(diff)) {
          rows = await env.DB.prepare(
            `${LEADERBOARD_SELECT} AND difficulty = ?2
             ORDER BY highest_wave DESC, final_score DESC, created_at ASC LIMIT ?3`
          ).bind(SCORE_VERSION, diff, limit).all();
        } else {
          rows = await env.DB.prepare(
            `${LEADERBOARD_SELECT}
             ORDER BY highest_wave DESC, final_score DESC, created_at ASC LIMIT ?2`
          ).bind(SCORE_VERSION, limit).all();
        }
        const res = json({ scores: rows.results ?? [], scoreVersion: SCORE_VERSION });
        res.headers.set('Access-Control-Allow-Origin', '*');
        res.headers.set('Cache-Control', 'public, max-age=15');
        return res;
      }

      if (path === '/api/scores' && request.method === 'POST') {
        let quota: RateLimitOutcome | undefined;
        try {
          quota = await env.SCORE_RATE_LIMITER?.limit({ key: `scores:${request.headers.get('CF-Connecting-IP') ?? 'anon'}` });
        } catch {
          return apiError('SCORE_API_UNAVAILABLE', 'Score submission is temporarily unavailable. Please retry.', 503);
        }
        if (!quota) return apiError('SCORE_API_UNAVAILABLE', 'Score submission is temporarily unavailable. Please retry.', 503);
        if (!quota.success) {
          const response = apiError('RATE_LIMITED', 'Rate limit exceeded. Slow down, warden.', 429);
          response.headers.set('Retry-After', '60');
          return response;
        }
        const contentType = request.headers.get('Content-Type') ?? '';
        if (!contentType.includes('application/json')) {
          return apiError('BAD_CONTENT_TYPE', 'Expected application/json.', 400);
        }
        const length = request.headers.get('Content-Length');
        if (length && /^\d+$/.test(length) && Number(length) > MAX_BODY_BYTES) {
          return apiError('PAYLOAD_TOO_LARGE', 'Score submission is too large.', 413);
        }
        const bounded = await readBoundedBody(request);
        if (!bounded.ok && bounded.tooLarge) {
          return apiError('PAYLOAD_TOO_LARGE', 'Score submission is too large.', 413);
        }
        if (!bounded.ok) {
          return apiError('INVALID_JSON', 'Request body is not valid JSON.', 400);
        }
        let body: unknown;
        try { body = JSON.parse(bounded.text); }
        catch { return apiError('INVALID_JSON', 'Request body is not valid JSON.', 400); }
        const v = validateScorePayload(body);
        if (!v.ok || !v.value) {
          return apiError('INVALID_SCORE', v.errors.join('; ') || 'The submitted score is invalid.', 400);
        }
        const s = v.value;
        try {
          const result = await env.DB.prepare(
            `INSERT INTO scores (run_id, player_name, difficulty, highest_wave, final_score, enemies_killed, bosses_killed, remaining_lives, game_duration_seconds, game_version, score_version, waves_completed, outcome, siege_bosses_defeated)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)`
          ).bind(
            s.runId, s.playerName, s.difficulty, s.highestWave, s.finalScore,
            s.enemiesKilled, s.bossesKilled, s.remainingLives, s.gameDurationSeconds,
            s.gameVersion, s.scoreVersion, s.wavesCompleted, s.outcome, s.siegeBossesDefeated
          ).run();
          const res = json({ ok: true, id: result.meta.last_row_id }, 201);
          res.headers.set('Access-Control-Allow-Origin', '*');
          return res;
        } catch (e) {
          const msg = e instanceof Error ? e.message : '';
          if (/UNIQUE constraint failed.*run_id|already exists/i.test(msg)) {
            return apiError('DUPLICATE_RUN', 'This run was already submitted.', 409);
          }
          throw e;
        }
      }

      if (path.startsWith('/api/')) {
        return apiError('NOT_FOUND', 'Unknown API endpoint.', 404);
      }

      // Non-API paths: let Static Assets serve index.html / bundles.
      return new Response('Not found', { status: 404 });
    } catch (err) {
      console.error('worker error', err);
      return apiError('INTERNAL', 'Internal error. The Vale endures; try again.', 500);
    }
  }
};
