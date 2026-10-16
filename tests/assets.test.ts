import { expect, it, vi } from 'vitest';
vi.mock('phaser', () => ({ default: { Math: { Vector2: class { constructor(public x: number, public y: number) {} } } } }));
import { ensureArtTextures, ensureMenuTextures } from '../src/game/art/artkit.ts';
import { STAGE_ASSETS, missingAssets, requiredAssets, requiredAssetsForRequest } from '../src/game/art/assetManifest.ts';
import { campaignArtAssetsForLoader } from '../src/game/campaign/artManifest.ts';
import { CAMPAIGN_LEVELS } from '../src/game/campaign/config.ts';
it.each(['sentinel', 'cinder'])('%s loads its own four foundation frames and both campaign tiers', id => {
  const foundation = STAGE_ASSETS.gameplay.find(asset => asset.key === `tower_${id}`);
  expect(foundation).toEqual({ kind: 'sheet', key: `tower_${id}`, path: `/assets/towers/tower_${id}_stages-v1.webp`, frameWidth: 627, frameHeight: 627 });
  for (const tier of [2, 3] as const) {
    const asset = requiredAssetsForRequest('gameplay', { mode: 'campaign', campaignLevel: 1, campaignVisualTier: tier })
      .find(asset => asset.key === `campaign_tower_${id}_tier${tier}`);
    expect(asset).toEqual({ kind: 'image', key: `campaign_tower_${id}_tier${tier}`, path: `/assets/campaign/towers/${id}-tier${tier}-v1.webp` });
  }
});
it('ships every file requested by menu, Classic and all Campaign visual tiers', async () => {
  const moduleName = 'node:fs';
  const { statSync } = await import(moduleName);
  const assets = [...Object.values(STAGE_ASSETS).flat()];
  for (let level = 1; level <= CAMPAIGN_LEVELS.length; level++) for (const tier of [1, 2, 3] as const) {
    assets.push(...requiredAssetsForRequest('gameplay', { mode: 'campaign', campaignLevel: level, campaignVisualTier: tier }));
  }
  for (const path of new Set(assets.map(asset => asset.path))) {
    const file = statSync(new URL(`../public${path}`, import.meta.url));
    expect(file.isFile(), path).toBe(true); expect(file.size, path).toBeGreaterThan(0);
  }
});
it('assigns all source assets once and keeps cold menu small', () => {
  expect(STAGE_ASSETS.menu).toHaveLength(6);
  expect(STAGE_ASSETS.campaign.map(asset => asset.path)).toEqual(campaignArtAssetsForLoader('campaign').map(asset => asset.path));
  expect(STAGE_ASSETS.gameplay).toHaveLength(31);
  expect(STAGE_ASSETS.gameplay.every(asset => !asset.path.startsWith('/assets/campaign/'))).toBe(true);
  expect(STAGE_ASSETS.defeat).toHaveLength(1);
  const all = Object.values(STAGE_ASSETS).flat();
  expect(new Set(all.map(a => a.key)).size).toBe(67);
  expect(STAGE_ASSETS.menu.some(a => a.path.includes('/enemies/'))).toBe(false);
  expect(requiredAssets('campaign')).toEqual([...STAGE_ASSETS.menu, ...STAGE_ASSETS.campaign]);
  expect(requiredAssets('menu')).toHaveLength(6);
  expect(missingAssets('gameplay', () => true)).toEqual([]);
  expect(requiredAssetsForRequest('gameplay', { mode: 'classic', campaignLevel: 1, campaignVisualTier: 3 })).toEqual(requiredAssets('gameplay'));
  expect(requiredAssetsForRequest('defeat', { mode: 'campaign', campaignLevel: 1, campaignVisualTier: 3 })).toEqual(requiredAssets('defeat'));
});
it('provides every cold menu/setup icon, then promotes them to painted atlas icons once', () => {
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
  const keys = ['hud_gold', 'hud_lives', 'hud_score', 'hud_wave'];
  ensureMenuTextures(scene); expect([...textures.keys()].sort()).toEqual(keys);
  const fallbacks = keys.map(key => textures.get(key)); textures.set('hud_icons_atlas', { getSourceImage: () => ({}) });
  ensureArtTextures(scene); const painted = keys.map(key => textures.get(key));
  keys.forEach((_key, index) => { expect(painted[index]).not.toBe(fallbacks[index]); expect(painted[index].painted).toBe(true); });
  ensureMenuTextures(scene); ensureArtTextures(scene);
  keys.forEach((key, index) => expect(textures.get(key)).toBe(painted[index]));
});
