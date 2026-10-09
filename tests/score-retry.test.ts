import { describe, expect, it } from 'vitest';
import { SCORE_RETRY_KEY, ScoreRetryRepository, type RetryLock, type RetryStore } from '../src/game/systems/ScoreRetry.ts';
import { resultFixture } from './helpers/progressionResult.ts';
import { SCORE_VERSION } from '../src/shared/version.ts';

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

const storedRecord = (raw: string): string => JSON.stringify(JSON.parse(raw) as unknown);

describe('saved score retry repository', () => {
  it("keeps another tab's newer run when the older request settles", async () => {
    const { bytes, store } = memoryStore();
    const lock = serialLock();
    const a = new ScoreRetryRepository(store, lock), b = new ScoreRetryRepository(store, lock);
    const first = payload('retained-first-0001');
    const second = payload('retained-second-0001');
    await a.stage(first); await b.stage(second); await a.settle(first.runId);
    expect((await b.view()).record?.payload.runId).toBe(second.runId);
    expect((await new ScoreRetryRepository(store, lock).view()).persisted).toBe(true);
    expect(JSON.parse(bytes.get(SCORE_RETRY_KEY)!).payload.runId).toBe(second.runId);
  });

  it('replaces the previous attempt only on an explicit new stage', async () => {
    const { bytes, store } = memoryStore();
    const repo = new ScoreRetryRepository(store, serialLock());
    await repo.stage(payload('retry-replace-0001'));
    const replacement = await repo.stage(payload('retry-replace-0002'));
    expect(replacement).toMatchObject({ status: 'ready', persisted: true });
    expect(replacement.record?.payload.runId).toBe('retry-replace-0002');
    expect(JSON.parse(bytes.get(SCORE_RETRY_KEY)!).payload.runId).toBe('retry-replace-0002');
  });

  it.each(['{broken', 'null', '[]', JSON.stringify({ version: 2 }), 'x'.repeat(4097), JSON.stringify({ version: 1, attemptedAt: '2026-10-09T00:00:00.000Z', payload: { pad: 'é'.repeat(2200) } })])('preserves protected bytes %s', async (raw) => {
    const { bytes, store } = memoryStore(); bytes.set(SCORE_RETRY_KEY, raw);
    const repo = new ScoreRetryRepository(store, serialLock());
    expect((await repo.view()).status).toBe('unreadable');
    const next = await repo.stage(payload('retry-protected-0001'));
    expect(next.persisted).toBe(false); expect(next.warning).toBeTruthy();
    await repo.settle('retry-protected-0001'); expect(bytes.get(SCORE_RETRY_KEY)).toBe(raw);
  });

  it('treats a structurally invalid current-era payload as unreadable and never posts it', async () => {
    const { bytes, store } = memoryStore();
    const raw = JSON.stringify({ version: 1, attemptedAt: '2026-10-09T00:00:00.000Z', payload: { ...payload('retry-current-bad-01'), finalScore: 0 } });
    bytes.set(SCORE_RETRY_KEY, raw);
    const repo = new ScoreRetryRepository(store, serialLock());
    const view = await repo.view();
    expect(view).toMatchObject({ status: 'unreadable', record: null, persisted: true });
    expect(view.warning).toBeTruthy();
    expect(bytes.get(SCORE_RETRY_KEY)).toBe(raw);
  });

  it('shows a retained earlier-era payload as incompatible and protects a newer-era payload', async () => {
    const { bytes, store } = memoryStore();
    const retired = { ...payload('retry-era-two-0001'), scoreVersion: 2, gameVersion: '0.2.0' };
    const retiredRaw = JSON.stringify({ version: 1, attemptedAt: '2026-10-09T00:00:00.000Z', payload: retired });
    bytes.set(SCORE_RETRY_KEY, retiredRaw);
    const repo = new ScoreRetryRepository(store, serialLock());
    const view = await repo.view();
    expect(view).toMatchObject({ status: 'incompatible', persisted: true, warning: null });
    expect(view.record?.payload.scoreVersion).toBe(2);
    expect((await repo.claimRetry(view.record!)).matched).toBe(false);
    const replaced = await repo.stage(payload('retry-era-three-0001'));
    expect(replaced).toMatchObject({ status: 'ready', persisted: true });
    expect(JSON.parse(bytes.get(SCORE_RETRY_KEY)!).payload.scoreVersion).toBe(SCORE_VERSION);

    const futureRaw = JSON.stringify({ version: 1, attemptedAt: '2026-10-09T00:00:00.000Z', payload: { ...payload('retry-future-0001'), scoreVersion: SCORE_VERSION + 1 } });
    bytes.set(SCORE_RETRY_KEY, futureRaw);
    const future = new ScoreRetryRepository(store, serialLock());
    expect((await future.view()).status).toBe('incompatible');
    const staged = await future.stage(payload('retry-future-new-01'));
    expect(staged.persisted).toBe(false);
    expect(staged.record?.payload.runId).toBe('retry-future-new-01');
    expect(staged.warning).toBeTruthy();
    await future.settle('retry-future-0001');
    expect(bytes.get(SCORE_RETRY_KEY)).toBe(futureRaw);
  });

  it('never clears a retained earlier-era record when settling', async () => {
    const { bytes, store } = memoryStore();
    const retired = JSON.stringify({
      version: 1,
      attemptedAt: '2026-10-09T00:00:00.000Z',
      payload: { ...payload('retry-era-two-keep-01'), scoreVersion: 2, gameVersion: '0.2.0' }
    });
    bytes.set(SCORE_RETRY_KEY, retired);
    const view = await new ScoreRetryRepository(store, serialLock()).settle('retry-era-two-keep-01');
    expect(view.status).toBe('incompatible');
    expect(view.persisted).toBe(true);
    expect(bytes.get(SCORE_RETRY_KEY)).toBe(retired);
  });

  it.each(['read', 'write', 'lock', 'no-lock', 'no-store'] as const)('falls back safely on %s failure', async (failure) => {
    const { store, bytes } = memoryStore(), before = JSON.stringify({ version: 2 });
    bytes.set(SCORE_RETRY_KEY, before);
    if (failure === 'read') store.getItem = () => { throw new Error('denied read'); };
    if (failure === 'write') { bytes.clear(); store.setItem = () => { throw new Error('quota'); }; }
    const lock: RetryLock | null = failure === 'no-lock' ? null : failure === 'lock'
      ? async () => { throw new Error('denied lock'); } : serialLock();
    const repo = new ScoreRetryRepository(failure === 'no-store' ? null : store, lock);
    const staged = await repo.stage(payload('retry-failure-0001'));
    expect(staged).toMatchObject({ status: 'ready', persisted: false }); expect(staged.warning).toBeTruthy();
    expect(staged.record?.payload.runId).toBe('retry-failure-0001');
    if (failure !== 'write') expect(bytes.get(SCORE_RETRY_KEY)).toBe(before);
  });

  it('retains a matching saved record when removal fails', async () => {
    const { store } = memoryStore(), repo = new ScoreRetryRepository(store, serialLock());
    await repo.stage(payload('retry-remove-0001')); store.removeItem = () => { throw new Error('denied remove'); };
    const view = await repo.settle('retry-remove-0001');
    expect(view.record?.payload.runId).toBe('retry-remove-0001'); expect(view.persisted).toBe(true); expect(view.warning).toBeTruthy();
  });

  it('claims a current snapshot atomically and rejects a stale displayed retry without overwriting', async () => {
    const { store, bytes } = memoryStore(), lock = serialLock();
    const a = new ScoreRetryRepository(store, lock), b = new ScoreRetryRepository(store, lock);
    const first = (await a.stage(payload('retry-stale-A-0001'))).record!;
    await b.stage(payload('retry-newer-B-0001')); const raw = bytes.get(SCORE_RETRY_KEY);
    const claim = await a.claimRetry(first);
    expect(claim.matched).toBe(false); expect(claim.view.record?.payload.runId).toBe('retry-newer-B-0001');
    expect(bytes.get(SCORE_RETRY_KEY)).toBe(raw);
  });

  it('copies the caller, reloads unknown outcomes and preserves retry timestamp/bytes', async () => {
    const { store, bytes } = memoryStore(), lock = serialLock();
    const repo = new ScoreRetryRepository(store, lock), input = payload('retry-immutable-0001');
    const staged = await repo.stage(input); input.playerName = 'Changed';
    const raw = bytes.get(SCORE_RETRY_KEY), reloaded = new ScoreRetryRepository(store, lock);
    expect((await reloaded.view()).record?.payload.playerName).toBe('TestWarden');
    expect((await reloaded.claimRetry(staged.record!)).matched).toBe(true);
    expect(bytes.get(SCORE_RETRY_KEY)).toBe(raw); expect(Object.isFrozen(staged.record?.payload)).toBe(true);
    expect(storedRecord(raw!)).toBe(raw);
  });

  it('reloads a staged defeat whose run never reached a conclusion', async () => {
    const { store } = memoryStore(), lock = serialLock();
    const defeated = resultFixture({ highestWave: 12, wavesCompleted: 11, outcome: 'defeat', siegeBossesDefeated: 1 }, 0, { runId: 'retry-defeat-0001' });
    await new ScoreRetryRepository(store, lock).stage(defeated);
    const reloaded = await new ScoreRetryRepository(store, lock).view();
    expect(reloaded).toMatchObject({ status: 'ready', persisted: true });
    expect(reloaded.record?.payload).toMatchObject({ runId: 'retry-defeat-0001', outcome: 'defeat' });
  });

  it('rejects an invalid fresh submission with a readable error and stores nothing', async () => {
    const { store, bytes } = memoryStore(), repo = new ScoreRetryRepository(store, serialLock());
    await expect(repo.stage({ ...payload('retry-invalid-0001'), playerName: '<script>' })).rejects.toThrow(/playerName|invalid/i);
    expect(bytes.has(SCORE_RETRY_KEY)).toBe(false);
    expect((await repo.view()).status).toBe('empty');
  });

  it('orders concurrent stage and settle calls through the lock', async () => {
    const { store } = memoryStore(), lock = serialLock();
    const a = new ScoreRetryRepository(store, lock), b = new ScoreRetryRepository(store, lock);
    await Promise.all([a.stage(payload('retry-order-A-0001')), b.stage(payload('retry-order-B-0001'))]);
    const persisted = (await b.view()).record?.payload.runId;
    await Promise.all([a.settle(persisted!), b.settle('retry-order-B-0001')]);
    expect((await new ScoreRetryRepository(store, lock).view()).status).toBe('empty');
  });
});
