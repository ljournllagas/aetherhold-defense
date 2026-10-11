import { expect, it, vi } from 'vitest';
vi.mock('phaser', () => ({ default: {} }));
import { towerArtGeometry } from '../src/game/art/towerArt.ts';

it.each(['longbow', 'ember', 'glacier', 'starfire', 'tempest'])('%s centers the base instead of its frontmost edge on the plot', id => {
  for (const tier of [1,2,3] as const) for (let stage = 1; stage <= 4; stage++) {
    const art = towerArtGeometry(id, stage, tier);
    // A ground-centered isometric base must extend in front of the anchor.
    expect(art.top + art.height).toBeGreaterThanOrEqual(10);
    expect(art.top + art.height).toBeLessThanOrEqual(26);
    expect(art.muzzleY).toBeLessThan(-20);
  }
});
