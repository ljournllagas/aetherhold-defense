import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadBest, loadLegacyBest, loadLegacyBests, saveBest } from '../src/game/systems/Settings.ts';
import { SCORE_VERSION } from '../src/shared/version.ts';

let storage: Map<string, string>;
beforeEach(() => { storage = new Map(); vi.stubGlobal('localStorage', { getItem: (k: string) => storage.get(k) ?? null, setItem: (k: string, v: string) => { storage.set(k, v); } }); });
afterEach(() => vi.unstubAllGlobals());
const best = (score: number) => ({ score, wave: 3, difficulty: 'medium', date: '2026-10-08T00:00:00.000Z' });

describe('score-era personal best', () => {
  it('keeps the legacy best byte-for-byte and compares only current-era scores', () => {
    const legacy = JSON.stringify({ score: 100000, wave: 40, difficulty: 'hard', date: '2026-01-01T00:00:00.000Z' });
    storage.set('aetherhold-best-v1', legacy);
    expect(loadBest()).toBeNull();
    expect(loadLegacyBest()).toMatchObject({ score: 100000, scoreVersion: 1 });
    saveBest(best(100)); expect(loadBest()).toMatchObject({ score: 100, scoreVersion: SCORE_VERSION });
    saveBest(best(50)); expect(loadBest()?.score).toBe(100);
    saveBest(best(150)); expect(loadBest()?.score).toBe(150);
    expect(storage.get('aetherhold-best-v1')).toBe(legacy);
    expect(JSON.parse(storage.get('aetherhold-best-score-v3')!)).toMatchObject({ score: 150, scoreVersion: SCORE_VERSION });
    expect(storage.has('aetherhold-settings-v1')).toBe(false);
  });
  it('treats malformed or other-era current records as absent', () => {
    storage.set('aetherhold-best-score-v3', '{broken'); expect(loadBest()).toBeNull();
    storage.set('aetherhold-best-score-v3', JSON.stringify({ ...best(5), scoreVersion: SCORE_VERSION + 1 })); expect(loadBest()).toBeNull();
    expect(loadLegacyBest()).toBeNull();
  });
  it('keeps both prior eras untouched and prefers the newest legacy era', () => {
    const one = JSON.stringify({ ...best(100000), scoreVersion: 1 });
    const two = JSON.stringify({ ...best(5), scoreVersion: 2 });
    storage.set('aetherhold-best-v1', one);
    storage.set('aetherhold-best-score-v2', two);
    expect(loadLegacyBests().map(v => v.scoreVersion)).toEqual([2, 1]);
    expect(loadLegacyBest()?.score).toBe(5);
    saveBest(best(10));
    expect(loadBest()?.score).toBe(10);
    expect(storage.get('aetherhold-best-v1')).toBe(one);
    expect(storage.get('aetherhold-best-score-v2')).toBe(two);
    expect(JSON.parse(storage.get('aetherhold-best-score-v3')!).scoreVersion).toBe(3);
  });
  it('falls back to a valid era-1 record when era 2 is unreadable or mismatched', () => {
    const one = JSON.stringify({ ...best(100000), scoreVersion: 1 });
    storage.set('aetherhold-best-v1', one);
    storage.set('aetherhold-best-score-v2', '{broken');
    expect(loadLegacyBests().map(v => v.scoreVersion)).toEqual([1]);
    expect(loadLegacyBest()?.score).toBe(100000);
    storage.set('aetherhold-best-score-v2', JSON.stringify({ ...best(5), scoreVersion: 3 }));
    expect(loadLegacyBests().map(v => v.scoreVersion)).toEqual([1]);
    expect(storage.get('aetherhold-best-v1')).toBe(one);
  });
  it('treats absent or malformed legacy keys as absent and never rewrites them', () => {
    expect(loadLegacyBests()).toEqual([]);
    expect(loadLegacyBest()).toBeNull();
    for (const raw of ['null', '[]', '{broken', JSON.stringify({ score: -1 }), JSON.stringify({ ...best(5), scoreVersion: 9 })]) {
      storage.set('aetherhold-best-v1', raw);
      expect(loadLegacyBests()).toEqual([]);
      expect(storage.get('aetherhold-best-v1')).toBe(raw);
    }
  });
  it('compares current-era scores independently of retained legacy scores', () => {
    const one = JSON.stringify({ ...best(999999), scoreVersion: 1 });
    storage.set('aetherhold-best-v1', one);
    storage.set('aetherhold-best-score-v2', JSON.stringify({ ...best(888888), scoreVersion: 2 }));
    saveBest(best(10));
    expect(loadBest()?.score).toBe(10);
    expect(loadLegacyBests().map(v => v.score)).toEqual([888888, 999999]);
    expect(storage.get('aetherhold-best-v1')).toBe(one);
  });
  it('requires an explicit era 3 for the current best and rejects a mismatched stored era', () => {
    storage.set('aetherhold-best-score-v3', JSON.stringify(best(9)));
    expect(loadBest()).toBeNull();
    storage.set('aetherhold-best-score-v3', JSON.stringify({ ...best(9), scoreVersion: 3 }));
    expect(loadBest()?.score).toBe(9);
    storage.set('aetherhold-best-v1', JSON.stringify({ ...best(7), scoreVersion: 2 }));
    storage.set('aetherhold-best-score-v2', JSON.stringify({ ...best(7), scoreVersion: 1 }));
    expect(loadLegacyBests()).toEqual([]);
  });
});
