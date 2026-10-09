import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadBest, loadLegacyBest, saveBest } from '../src/game/systems/Settings.ts';
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
    expect(JSON.parse(storage.get('aetherhold-best-score-v2')!)).toMatchObject({ score: 150, scoreVersion: SCORE_VERSION });
    expect(storage.has('aetherhold-settings-v1')).toBe(false);
  });
  it('treats malformed or other-era current records as absent', () => {
    storage.set('aetherhold-best-score-v2', '{broken'); expect(loadBest()).toBeNull();
    storage.set('aetherhold-best-score-v2', JSON.stringify({ ...best(5), scoreVersion: SCORE_VERSION + 1 })); expect(loadBest()).toBeNull();
    expect(loadLegacyBest()).toBeNull();
  });
});
