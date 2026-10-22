import { describe, expect, it } from 'vitest';
import { loadCrowns, recordCrown } from '../src/game/campaign/crowns.ts';

const memory = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }; };

describe('campaign crowns', () => {
  it('records each level once and ignores junk', () => {
    const store = memory();
    recordCrown(3, store); recordCrown(1, store); recordCrown(3, store);
    expect([...loadCrowns(store)]).toEqual([1, 3]);
    store.setItem('aetherhold-campaign-crowns-v1', '[0,5,101,"x",2.5,7]');
    expect([...loadCrowns(store)]).toEqual([5, 7]);
  });
  it('survives missing or blocked storage', () => {
    expect(loadCrowns(undefined).size).toBe(0);
    expect(() => recordCrown(2, { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } })).not.toThrow();
  });
});
