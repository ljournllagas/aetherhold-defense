import { describe, expect, it } from 'vitest';
import { STAGE_ASSETS, requiredAssets } from '../src/game/art/assetManifest.ts';
import {
  AVAILABLE_CAMPAIGN_ART_PATHS, CAMPAIGN_ART_MANIFEST, campaignArtAssetsForLoader,
  resolveCampaignArtAssets
} from '../src/game/campaign/artManifest.ts';

const worlds = ['borderkeep', 'emberfall', 'frostveil'] as const;
const worldPanels = worlds.map(worldId => CAMPAIGN_ART_MANIFEST.find(asset => asset.id === `world-panel:${worldId}`)!);

describe('independent campaign world-map art acceptance', () => {
  it('keeps the three approved panels final with no temporary-art warning', () => {
    expect(worldPanels).toHaveLength(3);
    expect(worldPanels.map(({ path, width, height, stage, state }) => ({ path, width, height, stage, state }))).toEqual(
      worlds.map(worldId => ({
        path: `/assets/campaign/world-map/${worldId}-v1.png`, width: 768, height: 432,
        stage: 'campaign', state: 'final'
      }))
    );
    expect(worldPanels.every(asset => !asset.qualityFlags.includes('final_art_unverified') && asset.temporary === null)).toBe(true);
    expect(AVAILABLE_CAMPAIGN_ART_PATHS).toEqual(CAMPAIGN_ART_MANIFEST.filter(asset => asset.state === 'final').map(asset => asset.path));
    expect(campaignArtAssetsForLoader('campaign')).toEqual(worlds.map(worldId => ({
      kind: 'image', key: `campaign_worldmap_${worldId}`, path: `/assets/campaign/world-map/${worldId}-v1.png`
    })));
  });

  it('loads exactly the approved campaign panels from their exact production paths', () => {
    const assets = resolveCampaignArtAssets(worldPanels, 'campaign', AVAILABLE_CAMPAIGN_ART_PATHS);

    expect(assets).toEqual(worlds.map(worldId => ({
      kind: 'image', key: `campaign_worldmap_${worldId}`, path: `/assets/campaign/world-map/${worldId}-v1.png`
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
