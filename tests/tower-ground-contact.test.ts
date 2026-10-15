import { expect, it, vi } from 'vitest';
vi.mock('phaser', () => ({ default: {} }));
import { towerArtGeometry } from '../src/game/art/towerArt.ts';

it.each(['longbow', 'ember', 'glacier', 'starfire', 'tempest', 'sentinel', 'cinder'])('%s centers the base instead of its frontmost edge on the plot', id => {
  for (const tier of [1,2,3] as const) for (let stage = 1; stage <= 4; stage++) {
    const art = towerArtGeometry(id, stage, tier);
    // A ground-centered isometric base must extend in front of the anchor.
    expect(art.top + art.height).toBeGreaterThanOrEqual(10);
    expect(art.top + art.height).toBeLessThanOrEqual(26);
    expect(art.muzzleY).toBeLessThan(-20);
  }
});

it('places execution bolts at the Sentinel rail tip and Cinder shots inside the open basin', () => {
  for (const tier of [1, 2, 3] as const) for (const level of [1, 2, 3, 4]) {
    const sentinel = towerArtGeometry('sentinel', level, tier);
    expect(Math.abs(sentinel.muzzleX - (sentinel.left + sentinel.width))).toBeLessThan(3);
    expect(Math.abs(sentinel.muzzleY - sentinel.top)).toBeLessThan(3);
    const cinder = towerArtGeometry('cinder', level, tier);
    expect(cinder.muzzleX).toBeGreaterThan(cinder.left);
    expect(cinder.muzzleX).toBeLessThan(cinder.left + cinder.width);
    expect(cinder.muzzleY).toBeGreaterThan(cinder.top);
    expect(cinder.muzzleY).toBeLessThan(cinder.top + cinder.height * 0.5);
  }
});
