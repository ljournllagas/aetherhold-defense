import type { DifficultyId, GameResultPayload, LeaderboardResult, ScoreRecord } from '../shared/types.ts';
import { SCORE_VERSION } from '../shared/version.ts';

const API_BASE = '';

interface Envelope<T> {
  status: number;
  ok: boolean;
  json: T | null;
  text?: string;
}

async function fetchJson<T>(url: string, init?: RequestInit, timeoutMs = 8000): Promise<Envelope<T>> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    const text = await res.text();
    try {
      return { status: res.status, ok: res.ok, json: (text ? JSON.parse(text) : null) as T };
    } catch {
      return { status: res.status, ok: res.ok, json: null, text };
    }
  } finally {
    clearTimeout(t);
  }
}

export interface LeaderboardResponse {
  scores: unknown;
  scoreVersion?: number;
  error?: { message?: unknown };
}

const RUN_ID_RE = /^[A-Za-z0-9_-]{8,64}$/;

function isIntegerInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}

function isScoreRecord(value: unknown): value is ScoreRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const score = value as Record<string, unknown>;
  const difficulty = score.difficulty;
  const createdAt = score.createdAt;
  return isIntegerInRange(score.id, 1, Number.MAX_SAFE_INTEGER)
    && typeof score.playerName === 'string' && score.playerName.trim().length > 0 && score.playerName.length <= 20
    && (difficulty === 'easy' || difficulty === 'medium' || difficulty === 'hard')
    && isIntegerInRange(score.highestWave, 1, 500)
    && isIntegerInRange(score.finalScore, 0, 10_000_000)
    && isIntegerInRange(score.enemiesKilled, 0, 100_000)
    && isIntegerInRange(score.bossesKilled, 0, 500)
    && score.bossesKilled <= score.enemiesKilled
    && isIntegerInRange(score.remainingLives, 0, 25)
    && isIntegerInRange(score.gameDurationSeconds, 0, 24 * 60 * 60)
    && typeof score.runId === 'string' && RUN_ID_RE.test(score.runId)
    && typeof score.gameVersion === 'string' && score.gameVersion.length > 0 && score.gameVersion.length <= 16
    && score.scoreVersion === SCORE_VERSION
    && isIntegerInRange(score.wavesCompleted, 0, score.highestWave)
    && (score.outcome === 'victory' || score.outcome === 'defeat' || score.outcome === 'siege-failed')
    && isIntegerInRange(score.siegeBossesDefeated, 0, 7)
    && typeof createdAt === 'string' && createdAt.length > 0 && Number.isFinite(Date.parse(createdAt));
}

function errorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object') {
    const e = err as { code?: unknown; message?: unknown };
    if (typeof e.message === 'string' && e.message) return e.message;
  }
  if (typeof err === 'string' && err) return err;
  return fallback;
}

export async function fetchLeaderboard(difficulty?: DifficultyId, limit = 20): Promise<LeaderboardResult<ScoreRecord>> {
  const q = difficulty ? `?difficulty=${difficulty}&limit=${limit}` : `?limit=${limit}`;
  try {
    const r = await fetchJson<LeaderboardResponse>(`${API_BASE}/api/leaderboard${q}`);
    if (!r.ok) {
      return { ok: false, message: errorMessage(r.json?.error, `Leaderboard unavailable (HTTP ${r.status}).`) };
    }
    if (!r.json || typeof r.json !== 'object' || Array.isArray(r.json) || !Array.isArray(r.json.scores)) {
      return { ok: false, message: 'Leaderboard returned an invalid response.' };
    }
    if (!r.json.scores.every(isScoreRecord)) {
      return { ok: false, message: 'Leaderboard returned malformed score data.' };
    }
    return { ok: true, scores: r.json.scores };
  } catch (err) {
    return { ok: false, message: errorMessage(err, 'Leaderboard unavailable.') };
  }
}

export function newRunId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  } catch { /* fall through */ }
  return `run-${Date.now().toString(36)}-${Math.floor(Math.random() * 0xffffff).toString(36)}`;
}

export type SubmitScoreResult = { ok: boolean; id?: number; error?: string; duplicate?: boolean };

export async function submitScore(payload: GameResultPayload): Promise<SubmitScoreResult> {
  try {
    const r = await fetchJson<{ ok: boolean; id?: number; error?: unknown }>(`${API_BASE}/api/scores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (r.status === 409) return { ok: false, duplicate: true, error: errorMessage(r.json?.error, 'This run was already submitted.') };
    if (!r.ok) return { ok: false, error: errorMessage(r.json?.error, 'HTTP error') };
    return { ok: r.json?.ok === true, id: r.json?.id, error: errorMessage(r.json?.error, '') || undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'network error' };
  }
}

export async function checkHealth(): Promise<boolean> {
  try {
    const r = await fetchJson<{ ok: boolean }>(`${API_BASE}/api/health`, undefined, 4000);
    return r.ok;
  } catch {
    return false;
  }
}
