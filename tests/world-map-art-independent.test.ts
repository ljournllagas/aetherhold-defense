import { describe, expect, it } from 'vitest';
import { STAGE_ASSETS, requiredAssets } from '../src/game/art/assetManifest.ts';
import { CAMPAIGN_WORLDS } from '../src/game/campaign/config.ts';
import {
  AVAILABLE_CAMPAIGN_ART_PATHS, CAMPAIGN_ART_MANIFEST, CAMPAIGN_PROVISIONAL_STARTER_PATHS, campaignArtAssetsForLoader,
  resolveCampaignArtAssets
} from '../src/game/campaign/artManifest.ts';

const worlds = CAMPAIGN_WORLDS.map(world => world.id);
const worldPanels = worlds.map(worldId => CAMPAIGN_ART_MANIFEST.find(asset => asset.id === `world-panel:${worldId}`)!);

describe('independent campaign world-map art acceptance', () => {
  it('preserves legacy panels, promotes the accepted World 4 panel, and withholds the other six provisionally', () => {
    expect(worldPanels).toHaveLength(10);
    expect(worldPanels.map(({ path, width, height, stage, state }) => ({ path, width, height, stage, state }))).toEqual(
      worlds.map((worldId, index) => ({
        path: `/assets/campaign/world-map/${worldId}-${worldId === 'whisperfen' ? 'v2' : 'v1'}.png`, width: 768, height: 432,
        stage: 'campaign', state: index < 4 ? 'final' : 'final_required'
      }))
    );
    expect(worldPanels.slice(0, 4).every(asset => !asset.qualityFlags.includes('final_art_unverified') && asset.temporary === null)).toBe(true);
    expect(worldPanels.slice(4).every(asset => asset.qualityFlags.includes('provisional_starter_art') && asset.temporary === 'procedural')).toBe(true);
    expect(AVAILABLE_CAMPAIGN_ART_PATHS).toEqual(CAMPAIGN_ART_MANIFEST.filter(asset => asset.state === 'final').map(asset => asset.path));
    expect(campaignArtAssetsForLoader('campaign')).toEqual([
      ...worlds.map(worldId => ({ kind: 'image' as const, key: `campaign_worldmap_${worldId}`, path: `/assets/campaign/world-map/${worldId}-${worldId === 'whisperfen' ? 'v2' : 'v1'}.png` })),
    ]);
    for (const worldId of worlds.slice(4)) {
      expect(CAMPAIGN_ART_MANIFEST.find(asset => asset.id === `world-panel:${worldId}`)).toMatchObject({ state: 'final_required', temporary: 'procedural' });
    }
    expect(CAMPAIGN_ART_MANIFEST.find(asset => asset.id === 'world-panel:whisperfen')).toMatchObject({
      path: '/assets/campaign/world-map/whisperfen-v2.png', state: 'final', temporary: null
    });
    expect(CAMPAIGN_PROVISIONAL_STARTER_PATHS).not.toContain('/assets/campaign/world-map/whisperfen-v1.png');
    expect(AVAILABLE_CAMPAIGN_ART_PATHS).toContain('/assets/campaign/world-map/whisperfen-v2.png');
    expect(CAMPAIGN_PROVISIONAL_STARTER_PATHS).toContain('/assets/campaign/world-map/sunken_aether-v1.png');
  });

  it('loads exactly the approved campaign panels from their exact production paths', () => {
    const assets = resolveCampaignArtAssets(worldPanels, 'campaign', AVAILABLE_CAMPAIGN_ART_PATHS);

    expect(assets).toEqual(worlds.slice(0, 4).map(worldId => ({
      kind: 'image', key: `campaign_worldmap_${worldId}`, path: `/assets/campaign/world-map/${worldId}-${worldId === 'whisperfen' ? 'v2' : 'v1'}.png`
    })));
    expect(resolveCampaignArtAssets(worldPanels, 'menu', AVAILABLE_CAMPAIGN_ART_PATHS)).toEqual([]);
    expect(resolveCampaignArtAssets(worldPanels, 'gameplay', AVAILABLE_CAMPAIGN_ART_PATHS)).toEqual([]);
    expect(resolveCampaignArtAssets(worldPanels, 'campaign', AVAILABLE_CAMPAIGN_ART_PATHS.map(path => `${path}.other`))).toEqual([]);
    expect(requiredAssets('campaign', assets)).toEqual([...STAGE_ASSETS.menu, ...assets]);
    expect(requiredAssets('campaign', assets).filter(asset => asset.path.startsWith('/assets/campaign/'))).toEqual(assets);
  });

  it('retains the six existing menu image sources without adding campaign art to menu loading', () => {
    expect(STAGE_ASSETS.menu.map(({ key, path }) => ({ key, path }))).toEqual([
      { key: 'emblem', path: '/assets/branding/aegis-emblem-v1.webp' },
      { key: 'menu_vista', path: '/assets/world/vistas/ancient-border-keep-vista-v1.webp' },
      { key: 'menu_vista_sunset', path: '/assets/world/vistas/ancient-border-keep-vista-menu-v2.webp' },
      { key: 'difficulty_helm_easy', path: '/assets/ui/difficulty-helm-easy-v1.webp' },
      { key: 'difficulty_helm_medium', path: '/assets/ui/difficulty-helm-medium-v1.webp' },
      { key: 'difficulty_helm_hard', path: '/assets/ui/difficulty-helm-hard-v1.webp' }
    ]);
    expect(campaignArtAssetsForLoader('menu')).toEqual([]);
    expect(campaignArtAssetsForLoader('gameplay').some(asset => asset.path.includes('/world-map/'))).toBe(false);
    expect(STAGE_ASSETS.gameplay.every(asset => !asset.path.startsWith('/assets/campaign/'))).toBe(true);
    expect(AVAILABLE_CAMPAIGN_ART_PATHS).toEqual(CAMPAIGN_ART_MANIFEST.filter(asset => asset.state === 'final').map(asset => asset.path));
    expect(STAGE_ASSETS.campaign).toEqual(campaignArtAssetsForLoader('campaign'));
  });
});
