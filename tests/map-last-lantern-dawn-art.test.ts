import { describe, expect, it } from 'vitest';
import { STAGE_ASSETS, requiredAssetsForRequest } from '../src/game/art/assetManifest.ts';
import {
  LAST_LANTERN_DAWN_ART, LAST_LANTERN_NIGHT_ART, mapBackdropDisplaySize, mapBackdropVariantAsset, resolveMapBackdropKey
} from '../src/game/art/mapVariantArt.ts';
import { MAP1, mapNativeToWorld } from '../src/game/maps/map1.ts';

const DELIVERY_URL = new URL('../public/assets/world/maps/ancient-border-keep-map-last-lantern-dawn-v1.webp', import.meta.url);

function stageKeys(): string[] {
  const specs = [...Object.values(STAGE_ASSETS).flat()];
  for (const data of [{ mode: 'classic' }, { mode: 'campaign', campaignLevel: 1, campaignVisualTier: 3 }] as const) {
    specs.push(...requiredAssetsForRequest('gameplay', { ...data }));
  }
  return specs.map(spec => spec.key);
}

describe('last lantern dawn backdrop', () => {
  it('registers the dawn plate as a measured optional variant of the Classic map', () => {
    expect(LAST_LANTERN_DAWN_ART.variant).toBe('last-lantern-dawn');
    expect(LAST_LANTERN_DAWN_ART.textureKey).toBe('map_ancient_border_keep_last_lantern_dawn');
    expect(LAST_LANTERN_DAWN_ART.path).toBe('/assets/world/maps/ancient-border-keep-map-last-lantern-dawn-v1.webp');
    expect(LAST_LANTERN_DAWN_ART.sourceWidth).toBe(1672);
    expect(LAST_LANTERN_DAWN_ART.sourceHeight).toBe(940);
    expect(mapBackdropVariantAsset('last-lantern-dawn')).toEqual({
      kind: 'image', key: LAST_LANTERN_DAWN_ART.textureKey, path: LAST_LANTERN_DAWN_ART.path
    });
    expect(mapBackdropVariantAsset('classic')).toBeNull();
  });

  it('ships a valid opaque dawn delivery file at the accepted Classic size', async () => {
    const moduleName = 'node:fs';
    const { readFileSync } = await import(moduleName);
    const image = readFileSync(DELIVERY_URL);
    expect(image.toString('ascii', 0, 4)).toBe('RIFF');
    expect(image.toString('ascii', 8, 12)).toBe('WEBP');
    expect(image.toString('ascii', 12, 16)).toBe('VP8 ');
    expect(image.toString('hex', 23, 26)).toBe('9d012a');
    expect(image.readUInt16LE(26) & 0x3fff).toBe(1672);
    expect(image.readUInt16LE(28) & 0x3fff).toBe(940);
  });

  it('lazy-loads: no base bundle preloads the dawn plate', () => {
    const keys = stageKeys();
    expect(keys).not.toContain(LAST_LANTERN_DAWN_ART.textureKey);
    expect(keys.filter(key => key === MAP1.backgroundKey).length).toBeGreaterThan(0);
    expect(STAGE_ASSETS.gameplay.some(asset => asset.path.includes('last-lantern-dawn'))).toBe(false);
  });

  it('keeps Classic as the default and falls back when the variant texture is absent', () => {
    expect(resolveMapBackdropKey('classic', () => true)).toBe(MAP1.backgroundKey);
    expect(resolveMapBackdropKey('classic', () => false)).toBe(MAP1.backgroundKey);
    expect(resolveMapBackdropKey('last-lantern-dawn', () => false)).toBe(MAP1.backgroundKey);
    expect(resolveMapBackdropKey('last-lantern-dawn', key => key === LAST_LANTERN_DAWN_ART.textureKey))
      .toBe(LAST_LANTERN_DAWN_ART.textureKey);
  });

  it('leaves the night variant resolved exactly as before', () => {
    expect(mapBackdropVariantAsset('last-lantern-night')).toEqual({
      kind: 'image', key: LAST_LANTERN_NIGHT_ART.textureKey, path: LAST_LANTERN_NIGHT_ART.path
    });
    expect(resolveMapBackdropKey('last-lantern-night', key => key === LAST_LANTERN_NIGHT_ART.textureKey))
      .toBe(LAST_LANTERN_NIGHT_ART.textureKey);
    expect(resolveMapBackdropKey('last-lantern-night', () => false)).toBe(MAP1.backgroundKey);
  });

  it('preserves every authored route, plot, gate and overlay anchor', () => {
    expect(MAP1.backgroundKey).toBe('map_ancient_border_keep');
    expect(MAP1.waypoints).toHaveLength(38);
    expect(MAP1.buildable.length).toBeGreaterThan(0);
    expect(MAP1.gate).toEqual(mapNativeToWorld([1475, 420]));
    expect(MAP1.stronghold).toEqual(mapNativeToWorld([1550, 330]));
    expect(MAP1.beacon).toEqual(mapNativeToWorld([1620, 120]));
    expect(MAP1.spawn).toEqual(mapNativeToWorld([42, 0]));
  });

  it('maps the variant onto the field exactly like the Classic plate', () => {
    const classicAspect = 1672 / 940;
    const variantAspect = LAST_LANTERN_DAWN_ART.sourceWidth / LAST_LANTERN_DAWN_ART.sourceHeight;
    expect(Math.abs(variantAspect - classicAspect)).toBeLessThan(0.001);
    expect(mapBackdropDisplaySize(MAP1.field.width, MAP1.field.height))
      .toEqual({ width: MAP1.field.width, height: MAP1.field.height });
    // Narrow portrait phone viewport: the field mapping is unchanged, so the
    // existing responsive scaling applies to both plates identically.
    const phone = mapBackdropDisplaySize(390, Math.round((390 * MAP1.field.height) / MAP1.field.width));
    expect(phone.width).toBe(390);
    expect(phone.height).toBe(Math.round((390 * MAP1.field.height) / MAP1.field.width));
  });
});
