import { describe, expect, it } from 'vitest';
import { ALTERNATIVE_BRANCH, STARTER_BRANCH } from '../src/game/config/evolutions.ts';
import { SAVE_FAILED_WARNING, UNLOCK_STORAGE_KEY, UnlockRepository, earnedBranches } from '../src/game/systems/UnlockSystem.ts';
import { tower } from './helpers/evolutionFixtures.ts';

class MemoryStore {
  value: string | null; writes = 0; fail = false; keys: string[] = [];
  constructor(initial: string | null = null) { this.value = initial; }
  getItem = (key: string): string | null => { this.keys.push(key); return this.value; };
  setItem = (key: string, next: string): void => { this.keys.push(key); if (this.fail) throw new Error('quota'); this.value = next; this.writes++; };
}
const T0 = '2026-10-08T00:00:00Z', T1 = '2026-10-08T01:00:00Z';

describe('achievement rule', () => {
  it.each(Object.values(STARTER_BRANCH))('qualifies a retained rank-2 starter: %s', (branch) => {
    const good = tower(branch, 2), alt = ALTERNATIVE_BRANCH[good.towerId];
    expect(earnedBranches(20, 1, [good], false)).toEqual([alt]);
    expect(earnedBranches(20, 1, [tower(branch, 1)], false)).toEqual([]);
    expect(earnedBranches(20, 0, [good], false)).toEqual([]);
    expect(earnedBranches(21, 1, [good], false)).toEqual([]);
    expect(earnedBranches(20, 1, [], false)).toEqual([]);
    expect(earnedBranches(20, 1, [tower(alt, 2)], false)).toEqual([]);
    expect(earnedBranches(20, 1, [good], true)).toEqual([]);
  });
  it('earns several archetypes once each in the same event', () => {
    expect(earnedBranches(20, 3, [tower('stormcaller', 3, 2), tower('marksman', 2, 1), tower('marksman', 2, 3)], false)).toEqual(['volley', 'thunderlord']);
  });
});

describe('unlock repository', () => {
  it('keeps a failed save in memory and retries it', () => {
    const store = new MemoryStore(); store.fail = true;
    const repo = new UnlockRepository(store, () => T0);
    repo.earn(['volley']);
    expect(repo.view().unsaved.has('volley')).toBe(true);
    expect(repo.view().warning).toBe(SAVE_FAILED_WARNING);
    expect(repo.snapshotForRun().has('volley')).toBe(true);
    store.fail = false; repo.reconcile();
    expect(repo.view().unsaved.size).toBe(0); expect(repo.view().warning).toBe(null);
    expect(new UnlockRepository(store).snapshotForRun().has('volley')).toBe(true);
    expect(store.keys.every((k) => k === UNLOCK_STORAGE_KEY)).toBe(true);
  });
  it('treats an absent entry as a starter profile without warning or write', () => {
    const store = new MemoryStore(), repo = new UnlockRepository(store, () => T0);
    expect(repo.snapshotForRun().size).toBe(0); expect(repo.view().warning).toBe(null); expect(store.writes).toBe(0);
  });
  it.each(['{broken', '{"version":2,"earned":{"volley":"2026-10-08T00:00:00Z"}}', '{"version":1,"earned":[]}', '{"version":1,"earned":{"volley":"not-a-date"}}'])('never overwrites unreadable or newer bytes: %s', (raw) => {
    const store = new MemoryStore(raw), repo = new UnlockRepository(store, () => T0);
    repo.earn(['thunderlord']); repo.reconcile();
    expect(store.value).toBe(raw); expect(store.writes).toBe(0);
    expect(repo.snapshotForRun().has('thunderlord')).toBe(true);
    expect(repo.view().unsaved.has('thunderlord')).toBe(true);
    expect(repo.view().warning).not.toBe(null);
  });
  it('writes pending unlocks once the entry becomes absent', () => {
    const store = new MemoryStore('{broken'), repo = new UnlockRepository(store, () => T0);
    repo.earn(['thunderlord']); store.value = null; repo.reconcile();
    expect(JSON.parse(store.value!)).toEqual({ version: 1, earned: { thunderlord: T0 } });
    expect(repo.view().unsaved.size).toBe(0);
  });
  it('ignores unknown and starter ids without rewriting', () => {
    const raw = JSON.stringify({ version: 1, earned: { volley: T0, laser: T0, marksman: T0 } });
    const store = new MemoryStore(raw), repo = new UnlockRepository(store);
    expect([...repo.snapshotForRun()]).toEqual(['volley']); expect(store.value).toBe(raw);
  });
  it('converges two tabs while earlier run snapshots stay fixed', () => {
    const store = new MemoryStore(), a = new UnlockRepository(store, () => T0), b = new UnlockRepository(store, () => T1);
    const old = a.snapshotForRun();
    a.earn(['volley']); b.earn(['thunderlord']); a.reconcile(); b.reconcile();
    expect([...a.snapshotForRun()].sort()).toEqual(['thunderlord', 'volley']);
    expect([...b.snapshotForRun()].sort()).toEqual(['thunderlord', 'volley']);
    expect(old.size).toBe(0); expect(a.view().profile.earned.volley).toBe(T0);
    const writes = store.writes; a.reconcile(); b.reconcile(); expect(store.writes).toBe(writes);
    expect(a.snapshotForRun()).not.toBe(a.snapshotForRun());
  });
  it('merges a racing write keeping the earliest timestamp', () => {
    const store = new MemoryStore(), a = new UnlockRepository(store, () => T0);
    a.earn(['volley']);
    store.value = JSON.stringify({ version: 1, earned: { thunderlord: '2026-10-08T02:00:00Z', volley: '2026-10-09T00:00:00Z' } });
    a.reconcile();
    expect(JSON.parse(store.value!).earned).toEqual({ thunderlord: '2026-10-08T02:00:00Z', volley: T0 });
    const writes = store.writes; new UnlockRepository(store).reconcile(); expect(store.writes).toBe(writes);
  });
  it('is idempotent and keeps working without storage', () => {
    const store = new MemoryStore(), repo = new UnlockRepository(store, () => T0);
    repo.earn(['volley']); repo.earn(['volley']); expect(store.writes).toBe(1);
    const offline = new UnlockRepository(null, () => T0); offline.earn(['volley']);
    expect(offline.snapshotForRun().has('volley')).toBe(true); expect(offline.view().unsaved.has('volley')).toBe(true); expect(offline.view().warning).not.toBe(null);
  });
});
