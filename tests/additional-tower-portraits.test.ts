import { expect, it, vi } from 'vitest';
vi.mock('phaser', () => ({ default: {} }));
import { ensureTowerPortraits } from '../src/game/art/towerArt.ts';

it('builds Sentinel and Cinder tray portraits from their own final foundation frame', () => {
  const draws = new Map<string, unknown[]>();
  const sources = new Map(['sentinel', 'cinder'].map(id => [`tower_${id}`, { id }]));
  const scene: any = { textures: {
    exists: (key: string) => sources.has(key),
    get: (key: string) => ({ getSourceImage: () => sources.get(key) }),
    createCanvas: (key: string) => ({
      getContext: () => ({ clearRect() {}, fillRect() {}, drawImage: (...args: unknown[]) => draws.set(key, args) }),
      refresh() {}
    })
  } };
  ensureTowerPortraits(scene);
  expect([...draws.keys()]).toEqual(['portrait_sentinel', 'portrait_cinder']);
  for (const id of ['sentinel', 'cinder']) {
    const [source, x, y, width, height, dx, dy, dw, dh] = draws.get(`portrait_${id}`)! as [unknown, ...number[]];
    expect(source).toBe(sources.get(`tower_${id}`));
    expect(x).toBeGreaterThanOrEqual(627); expect(y).toBeGreaterThanOrEqual(627);
    expect(x + width).toBeLessThanOrEqual(1254); expect(y + height).toBeLessThanOrEqual(1254);
    expect(dx).toBeGreaterThanOrEqual(0); expect(dy).toBeGreaterThanOrEqual(0);
    expect(dx + dw).toBeLessThanOrEqual(64); expect(dy + dh).toBeLessThanOrEqual(64);
  }
});
