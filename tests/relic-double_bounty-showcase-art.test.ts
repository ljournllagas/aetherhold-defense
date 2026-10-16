import { describe, expect, it } from 'vitest';
import { POWERUP_EFFECTS, POWERUPS } from '../src/game/config/powerUps.ts';
import {
  ensureRelicShowcaseTexture, RELIC_SHOWCASE_ART, relicShowcaseDisplaySize,
  relicShowcaseFor, relicShowcaseHeroTexture
} from '../src/game/art/relicShowcaseArt.ts';
import type { PowerUpId } from '../src/shared/types.ts';

const DELIVERY_URL = new URL('../public/assets/powerups/showcases/double_bounty-showcase-v1.webp', import.meta.url);
const VALIDATION_URL = new URL('../artifacts/image-reserve-20261016/file-validation.json', import.meta.url);
const SHOWCASE = RELIC_SHOWCASE_ART.double_bounty;

type FakeSceneOptions = {
  present: readonly string[];
  atlas?: boolean;
};

function fakeScene({ present, atlas = true }: FakeSceneOptions) {
  const queued: Array<{ key: string; path: string }> = [];
  const handlers = new Map<string, Array<() => void>>();
  const scene = {
    textures: {
      exists: (key: string) => present.includes(key),
      get: () => ({ getSourceImage: () => ({}) }),
      createCanvas: () => ({
        getContext: () => ({ clearRect: () => {}, drawImage: () => {} }),
        refresh: () => {}
      })
    },
    load: {
      image: (key: string, path: string) => { queued.push({ key, path }); },
      once: (event: string, handler: () => void) => {
        const list = handlers.get(event) ?? [];
        list.push(handler);
        handlers.set(event, list);
      },
      start: () => {}
    }
  };
  if (!atlas) {
    (scene.textures as { exists: (key: string) => boolean }).exists = () => false;
  } else {
    const presentSet = new Set(present);
    (scene.textures as { exists: (key: string) => boolean }).exists =
      (key: string) => key === 'relic_icons_atlas' || presentSet.has(key);
  }
  return {
    queued, handlers,
    scene: scene as unknown as Phaser.Scene,
    fire: (event: string) => { for (const handler of handlers.get(event) ?? []) handler(); }
  };
}

describe('double_bounty relic showcase art', () => {
  it('registers the double_bounty master as a showcase at its measured size', () => {
    expect(relicShowcaseFor('double_bounty')).toBe(SHOWCASE);
    expect(SHOWCASE.textureKey).toBe('relic_showcase_double_bounty');
    expect(SHOWCASE.path).toBe('/assets/powerups/showcases/double_bounty-showcase-v1.webp');
    expect(SHOWCASE.sourceWidth).toBe(1254);
    expect(SHOWCASE.sourceHeight).toBe(1254);
    expect(SHOWCASE.alphaBounds).toEqual([0, 25, 1239, 1229]);
    expect(SHOWCASE.alphaBoundsAt16).toEqual([153, 213, 1121, 1022]);
  });

  it('leaves no relic on the atlas-only presentation now that the registry is complete', () => {
    expect(Object.keys(RELIC_SHOWCASE_ART)).toHaveLength(10);
    for (const entry of Object.values(RELIC_SHOWCASE_ART)) {
      expect(relicShowcaseFor(entry.powerUpId)).toBe(entry);
    }
  });

  it('matches the reserve validation bounds within one pixel and flags the edge residue', async () => {
    const moduleName = 'node:fs';
    const { readFileSync } = await import(moduleName);
    const validation = JSON.parse(readFileSync(VALIDATION_URL, 'utf8')) as {
      assets: Array<{
        id: string; size: [number, number]; mode: string;
        alphaBounds: [number, number, number, number];
        alphaBoundsAt16: [number, number, number, number];
        issues: string[];
      }>;
    };
    const validated = validation.assets.find(entry => entry.id === 'relic:double_bounty')!;
    expect(validated.size).toEqual([1254, 1254]);
    expect(validated.mode).toBe('RGBA');
    for (let axis = 0; axis < 4; axis++) {
      expect(Math.abs(SHOWCASE.alphaBounds[axis] - validated.alphaBounds[axis])).toBeLessThanOrEqual(1);
      expect(Math.abs(SHOWCASE.alphaBoundsAt16[axis] - validated.alphaBoundsAt16[axis])).toBeLessThanOrEqual(1);
    }
    expect(validated.issues.join(' ')).toMatch(/edge/i);
    // Faint raw alpha touches the left canvas edge, so derivatives keep
    // full-bleed padding and panels render over the etched portrait plate
    // that reads on both dark and light surfaces.
    expect(SHOWCASE.alphaBounds[0]).toBe(0);
    expect(SHOWCASE.alphaBoundsAt16[0]).toBeGreaterThanOrEqual(150);
  });

  it('ships a valid transparent delivery file at the measured source size', async () => {
    const moduleName = 'node:fs';
    const { readFileSync } = await import(moduleName);
    const image = readFileSync(DELIVERY_URL);
    expect(image.toString('ascii', 0, 4)).toBe('RIFF');
    expect(image.toString('ascii', 8, 12)).toBe('WEBP');
    expect(image.toString('ascii', 12, 16)).toBe('VP8X');
    expect(image.readUIntLE(24, 3) + 1).toBe(1254);
    expect(image.readUIntLE(27, 3) + 1).toBe(1254);
    expect(image.length).toBeGreaterThan(50_000);
    expect(image.length).toBeLessThan(600_000);
  });

  it('uses the atlas hero until the showcase bundle arrives, then swaps without a second load', () => {
    const cold = fakeScene({ present: [] });
    expect(relicShowcaseHeroTexture(cold.scene, 'double_bounty')).toBe('relic_hero_double_bounty');
    let repainted = 0;
    expect(ensureRelicShowcaseTexture(cold.scene, 'double_bounty', () => { repainted++; })).toBe(false);
    expect(cold.queued).toEqual([{ key: SHOWCASE.textureKey, path: SHOWCASE.path }]);
    // A second reveal while the bundle is in flight queues nothing further.
    expect(ensureRelicShowcaseTexture(cold.scene, 'double_bounty', () => { repainted++; })).toBe(false);
    expect(cold.queued).toHaveLength(1);
    cold.fire(`filecomplete-${SHOWCASE.textureKey}`);
    expect(repainted).toBe(1);

    const warm = fakeScene({ present: [SHOWCASE.textureKey] });
    expect(relicShowcaseHeroTexture(warm.scene, 'double_bounty')).toBe(SHOWCASE.textureKey);
    expect(ensureRelicShowcaseTexture(warm.scene, 'double_bounty', () => { repainted++; })).toBe(true);
    expect(warm.queued).toHaveLength(0);
    expect(repainted).toBe(1);
  });

  it('queues nothing for ids outside the showcase registry', () => {
    const cold = fakeScene({ present: [] });
    const unknown = 'unreleased_relic' as unknown as PowerUpId;
    expect(relicShowcaseFor(unknown)).toBeNull();
    expect(ensureRelicShowcaseTexture(cold.scene, unknown, () => {})).toBe(false);
    expect(cold.queued).toHaveLength(0);
  });

  it('contain-fits the square master in desktop and phone hero slots without cropping', () => {
    const desktop = relicShowcaseDisplaySize(154, 154);
    expect(desktop).toEqual({ width: 154, height: 154 });
    const phone = relicShowcaseDisplaySize(88, 88);
    expect(phone).toEqual({ width: 88, height: 88 });
    // Narrow slots shrink to the binding dimension and never overflow.
    const narrow = relicShowcaseDisplaySize(100, 60);
    expect(narrow.width).toBeLessThanOrEqual(100);
    expect(narrow.height).toBeLessThanOrEqual(60);
    expect(narrow.width).toBe(narrow.height);
  });

  it('leaves double_bounty effects, rarity, inventory and targeting exactly as configured', () => {
    expect(POWERUPS.double_bounty).toMatchObject({
      id: 'double_bounty', name: 'Double Bounty', rarity: 'uncommon', requiresTarget: false
    });
    expect(POWERUPS.double_bounty.description).toContain('Double gold');
    expect(POWERUP_EFFECTS.doubleBountyMs).toBe(20000);
    expect(SHOWCASE.path).not.toContain('atlas');
  });
});
