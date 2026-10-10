import { expect, it, vi } from 'vitest';
vi.mock('phaser', () => ({ default: { Math: { Vector2: class { constructor(public x: number, public y: number) {} } } } }));
import { ensureArtTextures, ensureMenuTextures } from '../src/game/art/artkit.ts';
import { STAGE_ASSETS, missingAssets, requiredAssets, requiredAssetsForRequest } from '../src/game/art/assetManifest.ts';
import { campaignArtAssetsForLoader } from '../src/game/campaign/artManifest.ts';
it('assigns all source assets once and keeps cold menu small', () => {
  expect(STAGE_ASSETS.menu).toHaveLength(6);
  expect(STAGE_ASSETS.campaign.map(asset => asset.path)).toEqual(campaignArtAssetsForLoader('campaign').map(asset => asset.path));
  expect(STAGE_ASSETS.gameplay).toHaveLength(15);
  expect(STAGE_ASSETS.gameplay.every(asset => !asset.path.startsWith('/assets/campaign/'))).toBe(true);
  expect(STAGE_ASSETS.defeat).toHaveLength(1);
  const all = Object.values(STAGE_ASSETS).flat();
  expect(new Set(all.map(a => a.key)).size).toBe(25);
  expect(STAGE_ASSETS.menu.some(a => a.path.includes('/enemies/'))).toBe(false);
  expect(requiredAssets('campaign')).toEqual([...STAGE_ASSETS.menu, ...STAGE_ASSETS.campaign]);
  expect(requiredAssets('menu')).toHaveLength(6);
  expect(missingAssets('gameplay', () => true)).toEqual([]);
  expect(requiredAssetsForRequest('gameplay', { mode: 'classic', campaignLevel: 1, campaignVisualTier: 3 })).toEqual(requiredAssets('gameplay'));
  expect(requiredAssetsForRequest('defeat', { mode: 'campaign', campaignLevel: 1, campaignVisualTier: 3 })).toEqual(requiredAssets('defeat'));
});
it('generates only menu icons, then promotes them to painted atlas icons once', () => {
  const textures = new Map<string, any>();
  function graphics(): any {
    const g: any = new Proxy({}, { get: (_obj, method) => method === 'generateTexture'
      ? (key: string) => { textures.set(key, { fallback: true }); }
      : () => g }); return g;
  }
  const scene: any = { make: { graphics }, textures: {
    exists: (key: string) => textures.has(key), get: (key: string) => textures.get(key), remove: (key: string) => textures.delete(key),
    createCanvas: (key: string) => { const value = { painted: true, getContext: () => ({ clearRect() {}, drawImage() {} }), refresh() {} }; textures.set(key, value); return value; }
  } };
  ensureMenuTextures(scene); expect([...textures.keys()].sort()).toEqual(['hud_score', 'hud_wave']);
  const fallback = textures.get('hud_wave'); textures.set('hud_icons_atlas', { getSourceImage: () => ({}) });
  ensureArtTextures(scene); const painted = textures.get('hud_wave');
  expect(painted).not.toBe(fallback); expect(painted.painted).toBe(true);
  ensureMenuTextures(scene); ensureArtTextures(scene); expect(textures.get('hud_wave')).toBe(painted);
});
