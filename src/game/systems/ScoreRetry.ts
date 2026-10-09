import { submitScore, type SubmitScoreResult } from '../../api/leaderboardClient.ts';
import { validateScorePayload } from '../../shared/validation.ts';
import { validatePlayerName } from '../../shared/playerName.ts';
import { resultProgressErrors } from '../../shared/resultProgress.ts';
import { SCORE_VERSION } from '../../shared/version.ts';
import type { ResultProgress } from '../../shared/progression.ts';
import type { GameResultPayload } from '../../shared/types.ts';

export const SCORE_RETRY_KEY = 'aetherhold-score-retry-v1';

/** One stored record must stay small; the same bound protects parsing and the POST body. */
const MAX_RECORD_CODE_UNITS = 4096;
const MAX_RECORD_BYTES = 4096;

const API_FIELDS: readonly (keyof GameResultPayload)[] = [
  'playerName', 'difficulty', 'highestWave', 'wavesCompleted', 'outcome',
  'siegeBossesDefeated', 'finalScore', 'enemiesKilled', 'bossesKilled',
  'remainingLives', 'gameDurationSeconds', 'runId', 'gameVersion', 'scoreVersion'
];

export const RETRY_WARNINGS = {
  protected: 'Stored score retry data could not be read and has been left untouched.',
  session: 'This score retry is available in this session only.',
  unavailable: 'Score retry storage is unavailable; this attempt is available in this session only.',
  removed: 'The saved score retry could not be cleared from this browser.'
} as const;

export interface SavedSubmission { version: 1; attemptedAt: string; payload: GameResultPayload; }

export interface RetryView {
  status: 'empty' | 'ready' | 'incompatible' | 'unreadable';
  record: SavedSubmission | null;
  persisted: boolean;
  warning: string | null;
}

export interface RetainedScoreResult {
  result: SubmitScoreResult;
  retry: RetryView;
  attempted: SavedSubmission | null;
}

export type RetryStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export type RetryLock = <T>(work: () => T | Promise<T>) => Promise<T>;

interface Classification {
  status: RetryView['status'];
  record: SavedSubmission | null;
  /** Protected bytes are never written or removed, whatever their status. */
  protectedBytes: boolean;
}

function utf8Length(value: string): number {
  try { return new TextEncoder().encode(value).byteLength; } catch { return value.length; }
}

/**
 * Structural guard for a stored payload. Retired eras are validated structurally
 * (fields, bounds and result consistency) without any current-era score envelope,
 * so an old record is visible but never rewritten as era 3.
 */
function storedPayload(value: unknown): GameResultPayload | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const b = value as Record<string, unknown>;
  if (!validatePlayerName(b.playerName).ok || (b.difficulty !== 'easy' && b.difficulty !== 'medium' && b.difficulty !== 'hard')) return null;
  if (typeof b.runId !== 'string' || !/^[A-Za-z0-9_-]{8,64}$/.test(b.runId)) return null;
  if (typeof b.gameVersion !== 'string' || !b.gameVersion.length || b.gameVersion.length > 16) return null;
  const bounds: Record<string, readonly [number, number]> = {
    highestWave: [1, 500], wavesCompleted: [0, 500], finalScore: [0, 10000000],
    enemiesKilled: [0, 100000], bossesKilled: [0, 500], remainingLives: [0, 25],
    gameDurationSeconds: [0, 86400], siegeBossesDefeated: [0, 7], scoreVersion: [1, Number.MAX_SAFE_INTEGER]
  };
  for (const [key, [min, max]] of Object.entries(bounds)) {
    const n = b[key];
    if (typeof n !== 'number' || !Number.isSafeInteger(n) || n < min || n > max) return null;
  }
  if ((b.bossesKilled as number) > (b.enemiesKilled as number)) return null;
  if (resultProgressErrors(b as unknown as ResultProgress, b.remainingLives as number, b.bossesKilled as number).length) return null;
  return Object.freeze(Object.fromEntries(API_FIELDS.map((key) => [key, b[key]]))) as unknown as GameResultPayload;
}

/** Copies a validated payload into a frozen primitive projection: the caller's object is never retained. */
function projection(payload: GameResultPayload): GameResultPayload {
  return Object.freeze(Object.fromEntries(API_FIELDS.map((key) => [key, payload[key]]))) as unknown as GameResultPayload;
}

function savedSubmission(payload: GameResultPayload, attemptedAt: string): SavedSubmission {
  return Object.freeze({ version: 1 as const, attemptedAt, payload });
}

/**
 * Classifies the raw stored string. Malformed, unknown-version and oversized records
 * are protected and unreadable; a payload from a newer era is protected and
 * incompatible; a retained era 1/2 payload is readable but incompatible; a current
 * era payload must also pass the full shared validation.
 */
function classify(raw: string | null): Classification {
  const unreadable: Classification = { status: 'unreadable', record: null, protectedBytes: true };
  if (raw === null) return { status: 'empty', record: null, protectedBytes: false };
  if (raw.length > MAX_RECORD_CODE_UNITS || utf8Length(raw) > MAX_RECORD_BYTES) return unreadable;
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { return unreadable; }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return unreadable;
  const outer = parsed as Record<string, unknown>;
  if (outer.version !== 1) return unreadable;
  const attemptedAt = outer.attemptedAt;
  if (typeof attemptedAt !== 'string') return unreadable;
  const parsedDate = new Date(attemptedAt);
  if (!Number.isFinite(parsedDate.getTime()) || parsedDate.toISOString() !== attemptedAt) return unreadable;
  const payload = storedPayload(outer.payload);
  if (!payload) return unreadable;
  const record = savedSubmission(payload, attemptedAt);
  if (payload.scoreVersion > SCORE_VERSION) return { status: 'incompatible', record, protectedBytes: true };
  if (payload.scoreVersion < SCORE_VERSION) return { status: 'incompatible', record, protectedBytes: false };
  if (!validateScorePayload(payload).ok) return unreadable;
  return { status: 'ready', record, protectedBytes: false };
}

function sameRecord(left: SavedSubmission, right: SavedSubmission): boolean {
  if (left.attemptedAt !== right.attemptedAt) return false;
  const a = left.payload as unknown as Record<string, unknown>, b = right.payload as unknown as Record<string, unknown>;
  if (a.runId !== b.runId) return false;
  return API_FIELDS.every((key) => a[key] === b[key]);
}

/**
 * Retains at most one saved submission with safe cross-tab settlement. Every
 * persisted read, write and removal happens under the caller-supplied lock; when
 * the lock or storage is unavailable the repository keeps a session-only snapshot
 * and never touches persisted bytes.
 */
export class ScoreRetryRepository {
  private session: SavedSubmission | null = null;

  constructor(
    private readonly storage: RetryStore | null,
    private readonly lock: RetryLock | null,
    private readonly now: () => string = () => new Date().toISOString()
  ) {}

  private async underLock<T>(work: () => T | Promise<T>): Promise<{ ok: true; value: T } | { ok: false }> {
    if (!this.lock) return { ok: false };
    try { return { ok: true, value: await this.lock(work) }; } catch { return { ok: false }; }
  }

  private sessionView(warning: string | null): RetryView {
    return this.session
      ? { status: 'ready', record: this.session, persisted: false, warning: warning ?? RETRY_WARNINGS.session }
      : { status: 'empty', record: null, persisted: false, warning };
  }

  /** Fresh persisted read; never resurrects a session snapshot over real stored bytes. */
  private viewLocked(): RetryView {
    if (!this.storage) return this.sessionView(RETRY_WARNINGS.unavailable);
    let raw: string | null;
    try { raw = this.storage.getItem(SCORE_RETRY_KEY); } catch { return this.sessionView(RETRY_WARNINGS.session); }
    return this.viewFrom(raw);
  }

  private viewFrom(raw: string | null): RetryView {
    const c = classify(raw);
    if (c.status === 'empty') return this.sessionView(null);
    // Protected bytes are never rewritten, so an attempt that is only held in memory is the
    // most truthful description of what a retry would use. This keeps failure messaging
    // session-only instead of claiming the stored data was replaced.
    if (c.protectedBytes && this.session) return this.sessionView(RETRY_WARNINGS.protected);
    if (c.status === 'unreadable') return { status: 'unreadable', record: null, persisted: true, warning: RETRY_WARNINGS.protected };
    const incompatible = c.status === 'incompatible';
    return {
      status: c.status,
      record: c.record,
      persisted: true,
      warning: incompatible && c.protectedBytes ? RETRY_WARNINGS.protected : null
    };
  }

  async view(): Promise<RetryView> {
    const locked = await this.underLock(() => this.viewLocked());
    return locked.ok ? locked.value : this.sessionView(RETRY_WARNINGS.session);
  }

  /** Validates, then replaces any absent or readable record with the new explicit attempt. */
  private stageLocked(record: SavedSubmission): RetryView {
    if (!this.storage) { this.session = record; return this.sessionView(RETRY_WARNINGS.unavailable); }
    let raw: string | null;
    try { raw = this.storage.getItem(SCORE_RETRY_KEY); } catch { this.session = record; return this.sessionView(RETRY_WARNINGS.session); }
    if (classify(raw).protectedBytes) {
      this.session = record;
      return { status: 'ready', record, persisted: false, warning: RETRY_WARNINGS.protected };
    }
    try { this.storage.setItem(SCORE_RETRY_KEY, JSON.stringify(record)); }
    catch { this.session = record; return this.sessionView(RETRY_WARNINGS.unavailable); }
    this.session = null;
    return { status: 'ready', record, persisted: true, warning: null };
  }

  async stage(payload: GameResultPayload): Promise<RetryView> {
    const validated = validateScorePayload(payload);
    if (!validated.ok || !validated.value) throw new Error(validated.errors.join('; ') || 'This score is not available for submission.');
    const record = savedSubmission(projection(validated.value), this.now());
    const locked = await this.underLock(() => this.stageLocked(record));
    if (locked.ok) return locked.value;
    this.session = record;
    return this.sessionView(RETRY_WARNINGS.session);
  }

  private claimFromSession(expected: SavedSubmission, warning: string | null): { matched: boolean; view: RetryView } {
    const view = this.sessionView(warning);
    const matched = this.session !== null && sameRecord(this.session, expected);
    return { matched, view };
  }

  private claimLocked(expected: SavedSubmission): { matched: boolean; view: RetryView } {
    if (!this.storage) return this.claimFromSession(expected, RETRY_WARNINGS.unavailable);
    let raw: string | null;
    try { raw = this.storage.getItem(SCORE_RETRY_KEY); } catch { return this.claimFromSession(expected, RETRY_WARNINGS.session); }
    const view = this.viewFrom(raw);
    if (view.status === 'ready' && view.record && sameRecord(view.record, expected)) return { matched: true, view };
    return { matched: false, view };
  }

  /** Compares the displayed attempt with the current record without ever writing. */
  async claimRetry(expected: SavedSubmission): Promise<{ matched: boolean; view: RetryView }> {
    const locked = await this.underLock(() => this.claimLocked(expected));
    return locked.ok ? locked.value : this.claimFromSession(expected, RETRY_WARNINGS.session);
  }

  /** Removes only a readable record whose run id still matches; protected bytes are never removed. */
  private settleLocked(runId: string): RetryView {
    const sessionOnlyAttempt = this.session?.payload.runId === runId;
    if (sessionOnlyAttempt) this.session = null;
    if (!this.storage) return this.sessionView(RETRY_WARNINGS.unavailable);
    let raw: string | null;
    try { raw = this.storage.getItem(SCORE_RETRY_KEY); } catch { return this.sessionView(RETRY_WARNINGS.session); }
    const c = classify(raw);
    // Protected bytes can never be cleared: an attempt that was never persisted stays session-only.
    if (c.protectedBytes) {
      return sessionOnlyAttempt ? { status: 'empty', record: null, persisted: false, warning: RETRY_WARNINGS.protected } : this.viewFrom(raw);
    }
    if (!c.record || c.record.payload.runId !== runId) return this.viewFrom(raw);
    try { this.storage.removeItem(SCORE_RETRY_KEY); }
    catch { return { status: 'ready', record: c.record, persisted: true, warning: RETRY_WARNINGS.removed }; }
    return this.viewFrom(null);
  }

  async settle(runId: string): Promise<RetryView> {
    const locked = await this.underLock(() => this.settleLocked(runId));
    if (locked.ok) return locked.value;
    if (this.session?.payload.runId === runId) this.session = null;
    return this.sessionView(RETRY_WARNINGS.session);
  }
}

function browserStore(): RetryStore | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
}

function browserLock(): RetryLock | null {
  try {
    return typeof navigator !== 'undefined' && navigator.locks
      ? (work) => navigator.locks.request(SCORE_RETRY_KEY, () => work()) as Promise<never>
      : null;
  } catch { return null; }
}

/** Browser singleton. Construction performs no storage or lock access before a method call. */
export const scoreRetryRepository = new ScoreRetryRepository(browserStore(), browserLock());

/**
 * Shared submission path: a fresh Submit stages the payload, every Retry claims the
 * displayed attempt first. Settlement clears only the run that was actually sent;
 * the network call itself never holds the repository lock.
 */
export async function submitRetainedScore(
  payload: GameResultPayload,
  repository: ScoreRetryRepository = scoreRetryRepository,
  expected?: SavedSubmission
): Promise<RetainedScoreResult> {
  const claim = expected ? await repository.claimRetry(expected) : null;
  if (claim && !claim.matched) return {
    result: { ok: false, error: 'The saved score changed. Open the latest saved score before retrying.' },
    retry: claim.view,
    attempted: null
  };
  const staged = claim ? claim.view : await repository.stage(payload);
  const snapshot = staged.record?.payload;
  if (!snapshot || staged.status !== 'ready') throw new Error('This score is not available for submission.');
  const result = await submitScore(snapshot);
  const retry = result.ok || result.duplicate
    ? await repository.settle(snapshot.runId)
    : await repository.view();
  return { result, retry, attempted: staged.record };
}
