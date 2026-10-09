import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/api/leaderboardClient.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/api/leaderboardClient.ts')>()),
  submitScore: vi.fn()
}));

import { submitScore, type SubmitScoreResult } from '../src/api/leaderboardClient.ts';
import { SCORE_RETRY_KEY, ScoreRetryRepository, submitRetainedScore, type RetryLock, type RetryStore } from '../src/game/systems/ScoreRetry.ts';
import { resultFixture } from './helpers/progressionResult.ts';

function serialLock(): RetryLock {
  let tail: Promise<unknown> = Promise.resolve();
  return work => {
    const result = tail.then(work);
    tail = result.catch(() => {});
    return result;
  };
}

const progress = { highestWave: 30, wavesCompleted: 30, outcome: 'victory' as const, siegeBossesDefeated: 7 };
const payload = (id: string) => resultFixture(progress, 10, { runId: id });

function memoryStore() {
  const bytes = new Map<string, string>();
  const store: RetryStore = {
    getItem: (key: string) => bytes.get(key) ?? null,
    setItem: (key: string, value: string) => { bytes.set(key, value); },
    removeItem: (key: string) => { bytes.delete(key); }
  };
  return { bytes, store };
}

const settleTicks = async (): Promise<void> => { for (let i = 0; i < 20; i++) await Promise.resolve(); };

describe('retained score submission', () => {
  beforeEach(() => { vi.mocked(submitScore).mockReset(); });

  it('persists the attempt before the network call and settles it on success', async () => {
    const { bytes, store } = memoryStore(), repo = new ScoreRetryRepository(store, serialLock());
    vi.mocked(submitScore).mockImplementation(async (sent) => {
      expect(bytes.get(SCORE_RETRY_KEY)).toBeTruthy();
      expect(sent.runId).toBe('retry-send-ok-0001');
      return { ok: true, id: 7 };
    });
    const completed = await submitRetainedScore(payload('retry-send-ok-0001'), repo);
    expect(completed.result).toEqual({ ok: true, id: 7 });
    expect(completed.retry.status).toBe('empty');
    expect(completed.retry.persisted).toBe(false);
    expect(bytes.has(SCORE_RETRY_KEY)).toBe(false);
    expect(completed.attempted?.payload.runId).toBe('retry-send-ok-0001');
  });

  it('clears the attempt when the server reports the run as already recorded', async () => {
    const { bytes, store } = memoryStore(), repo = new ScoreRetryRepository(store, serialLock());
    vi.mocked(submitScore).mockResolvedValue({ ok: false, duplicate: true, error: 'already submitted' });
    const completed = await submitRetainedScore(payload('retry-duplicate-01'), repo);
    expect(completed.result.duplicate).toBe(true);
    expect(completed.retry.record).toBeNull();
    expect(bytes.has(SCORE_RETRY_KEY)).toBe(false);
  });

  it.each(['429', '503', 'offline', 'timeout'])('retains an identical retry after %s', async (error) => {
    const { store, bytes } = memoryStore(), repo = new ScoreRetryRepository(store, serialLock());
    const first = (await repo.stage(payload('retry-network-0001'))).record!, raw = bytes.get(SCORE_RETRY_KEY);
    vi.mocked(submitScore).mockImplementation(async (sent) => {
      expect(bytes.get(SCORE_RETRY_KEY)).toBe(raw); expect(sent).toEqual(first.payload); return { ok: false, error };
    });
    const completed = await submitRetainedScore(first.payload, repo, first);
    expect(completed.result).toEqual({ ok: false, error });
    expect(completed.retry.persisted).toBe(true);
    expect(bytes.get(SCORE_RETRY_KEY)).toBe(raw);
    expect(completed.attempted).toEqual(first);
  });

  it('does not POST an obsolete retry', async () => {
    const { store } = memoryStore(), repo = new ScoreRetryRepository(store, serialLock());
    const first = (await repo.stage(payload('retry-send-A-0001'))).record!;
    await repo.stage(payload('retry-send-B-0001')); vi.mocked(submitScore).mockClear();
    const completed = await submitRetainedScore(first.payload, repo, first);
    expect(completed.result.ok).toBe(false); expect(completed.result.error).toContain('changed');
    expect(completed.retry.record?.payload.runId).toBe('retry-send-B-0001'); expect(submitScore).not.toHaveBeenCalled();
  });

  it('never erases a newer tab attempt when a delayed success settles', async () => {
    const { bytes, store } = memoryStore(), repo = new ScoreRetryRepository(store, serialLock());
    const first = (await repo.stage(payload('retry-late-A-0001'))).record!;
    let resolve!: (result: SubmitScoreResult) => void;
    vi.mocked(submitScore).mockImplementation(() => new Promise((done) => { resolve = done; }));
    const pending = submitRetainedScore(first.payload, repo, first);
    await settleTicks();
    expect(submitScore).toHaveBeenCalledTimes(1);
    await repo.stage(payload('retry-late-B-0001'));
    const rawB = bytes.get(SCORE_RETRY_KEY);
    resolve({ ok: true, id: 3 });
    const completed = await pending;
    expect(completed.result).toEqual({ ok: true, id: 3 });
    expect(completed.retry.record?.payload.runId).toBe('retry-late-B-0001');
    expect(bytes.get(SCORE_RETRY_KEY)).toBe(rawB);
  });

  it('posts a valid explicit attempt despite protected storage and reports it as session-only', async () => {
    const { bytes, store } = memoryStore(), repo = new ScoreRetryRepository(store, serialLock());
    const protectedRaw = JSON.stringify({ version: 2, preserve: 'future bytes' });
    bytes.set(SCORE_RETRY_KEY, protectedRaw);
    vi.mocked(submitScore).mockResolvedValue({ ok: true, id: 11 });
    const completed = await submitRetainedScore(payload('retry-protected-post-01'), repo);
    expect(completed.result).toEqual({ ok: true, id: 11 });
    expect(completed.retry.persisted).toBe(false);
    expect(completed.retry.warning).toBeTruthy();
    expect(completed.attempted?.payload.runId).toBe('retry-protected-post-01');
    expect(bytes.get(SCORE_RETRY_KEY)).toBe(protectedRaw);
  });

  it('rejects an invalid submission before invoking the network', async () => {
    const { store } = memoryStore(), repo = new ScoreRetryRepository(store, serialLock());
    await expect(submitRetainedScore({ ...payload('retry-invalid-0001'), finalScore: 0 }, repo)).rejects.toThrow();
    expect(submitScore).not.toHaveBeenCalled();
  });

  it('performs no network access on construction, view, stage or reload', async () => {
    const { store } = memoryStore();
    const repo = new ScoreRetryRepository(store, serialLock());
    await repo.view();
    await repo.stage(payload('retry-offline-0001'));
    await new ScoreRetryRepository(store, serialLock()).view();
    expect(submitScore).not.toHaveBeenCalled();
  });
});
