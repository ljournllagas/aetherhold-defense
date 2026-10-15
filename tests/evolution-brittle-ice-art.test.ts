import { describe, expect, it, vi } from 'vitest';
vi.mock('phaser', () => ({ default: {} }));
import { buildTowerVisual, towerArtGeometry } from '../src/game/art/towerArt.ts';
import { STAGE_ASSETS } from '../src/game/art/assetManifest.ts';
import { EVOLUTIONS } from '../src/game/config/evolutions.ts';
import { TOWERS } from '../src/game/config/towers.ts';

const STATIC_KEY = 'tower_glacier_brittle-ice';

function fakeScene(present: readonly string[]) {
  const images: unknown[][] = [];
  const image = (...args: unknown[]) => {
    images.push(args);
    return { setOrigin() { return this; }, setScale() { return this; } };
  };
  const container = () => ({ add() { return this; } });
  return {
    images,
    scene: {
      textures: { exists: (key: string) => present.includes(key) },
      add: { container, image, ellipse: () => ({ setAlpha() { return this; } }), graphics: () => ({}) },
    } as unknown as Phaser.Scene,
  };
}

describe('brittle ice static appearance', () => {
  it('maps the brittle-ice branch to the glacier tower', () => {
    expect(EVOLUTIONS['brittle-ice'].towerId).toBe('glacier');
  });

  it('ships the delivery image through the gameplay loader', async () => {
    expect(STAGE_ASSETS.gameplay.find((asset) => asset.key === STATIC_KEY))
      .toEqual({ kind: 'image', key: STATIC_KEY, path: '/assets/towers/tower_glacier_brittle-ice-v1.webp' });
    const moduleName = 'node:fs';
    const { readFileSync } = await import(moduleName);
    const image = readFileSync(new URL('../public/assets/towers/tower_glacier_brittle-ice-v1.webp', import.meta.url));
    expect(image.toString('ascii', 0, 4)).toBe('RIFF');
    expect(image.toString('ascii', 8, 12)).toBe('WEBP');
    expect(image.toString('ascii', 12, 16)).toBe('VP8X');
    expect(image[20] & 0x10).toBe(0x10);
    expect(image.readUIntLE(24, 3) + 1).toBe(1254);
    expect(image.readUIntLE(27, 3) + 1).toBe(1254);
  });

  it('grounds the static art and keeps the family muzzle at every foundation level', () => {
    for (let level = 1; level <= 4; level++) {
      const art = towerArtGeometry('glacier', level, 1, 'brittle-ice');
      expect(art.height).toBeCloseTo(96, 5);
      expect(art.width).toBeCloseTo(54.1, 0);
      expect(art.top + art.height).toBeGreaterThanOrEqual(10);
      expect(art.top + art.height).toBeLessThanOrEqual(26);
      expect(art.muzzleY).toBeLessThan(-20);
      expect(art.footprintPx).toBe(64);
    }
    const evolved = towerArtGeometry('glacier', 4, 1, 'brittle-ice');
    const foundation = towerArtGeometry('glacier', 4, 1);
    expect(evolved.muzzleX).toBe(foundation.muzzleX);
    expect(evolved.muzzleY).toBe(foundation.muzzleY);
    expect(foundation.width).not.toBeCloseTo(evolved.width, 5);
  });

  it('leaves other branches, towers and campaign tiers on their existing art', () => {
    for (let level = 1; level <= 4; level++) {
      expect(towerArtGeometry('glacier', level, 1, 'winterguard')).not.toEqual(towerArtGeometry('glacier', level, 1));
      expect(towerArtGeometry('glacier', level, 1, 'winterguard')).not.toEqual(towerArtGeometry('glacier', level, 1, 'brittle-ice'));
      expect(towerArtGeometry('ember', level, 1, 'brittle-ice')).toEqual(towerArtGeometry('ember', level, 1));
      for (const tier of [2, 3] as const) {
        expect(towerArtGeometry('glacier', level, tier, 'brittle-ice'))
          .toEqual(towerArtGeometry('glacier', level, tier));
      }
    }
  });

  it('draws the static image when loaded and falls back to foundation art otherwise', () => {
    const foundationKey = TOWERS.glacier.assetKey;
    const loaded = fakeScene([foundationKey, STATIC_KEY]);
    buildTowerVisual(loaded.scene, 'glacier', 4, 1, 'brittle-ice');
    expect(loaded.images[0][2]).toBe(STATIC_KEY);
    expect(loaded.images[0]).toHaveLength(3);

    const cold = fakeScene([foundationKey]);
    buildTowerVisual(cold.scene, 'glacier', 4, 1, 'brittle-ice');
    expect(cold.images[0][2]).toBe(foundationKey);
    expect(cold.images[0][3]).toBe(3);

    const plain = fakeScene([foundationKey, STATIC_KEY]);
    buildTowerVisual(plain.scene, 'glacier', 4, 1);
    expect(plain.images[0][2]).toBe(foundationKey);
  });
});
