import { describe, expect, it } from 'vitest';
import { STAGE_ASSETS, requiredAssets } from '../src/game/art/assetManifest.ts';
import { CAMPAIGN_WORLDS } from '../src/game/campaign/config.ts';
import {
  AVAILABLE_CAMPAIGN_ART_PATHS, CAMPAIGN_ART_MANIFEST, CAMPAIGN_PROVISIONAL_STARTER_PATHS, campaignArtAssetsForLoader,
  resolveCampaignArtAssets
} from '../src/game/campaign/artManifest.ts';

const worlds = CAMPAIGN_WORLDS.map(world => world.id);
const campaignLoadOrder = [...worlds.slice(0, 8), worlds[9]!, worlds[8]!];
const worldPanels = worlds.map(worldId => CAMPAIGN_ART_MANIFEST.find(asset => asset.id === `world-panel:${worldId}`)!);

describe('independent campaign world-map art acceptance', () => {
  it('preserves legacy panels, promotes accepted World 4–8 and World 10 panels, and withholds World 9 provisionally', () => {
    expect(worldPanels).toHaveLength(10);
    expect(worldPanels.map(({ path, width, height, stage, state }) => ({ path, width, height, stage, state }))).toEqual(
      worlds.map((worldId, index) => ({
        path: `/assets/campaign/world-map/${worldId}-${index >= 3 && index < 8 || index === 9 ? 'v2' : 'v1'}.png`, width: 768, height: 432,
        stage: 'campaign', state: index < 8 || index === 9 ? 'final' : 'final_required'
      }))
    );
    const acceptedPanels = [...worldPanels.slice(0, 8), worldPanels[9]!];
    expect(acceptedPanels.every(asset => !asset.qualityFlags.includes('final_art_unverified') && asset.temporary === null)).toBe(true);
    expect(worldPanels.filter(asset => asset.state === 'final_required')).toEqual([worldPanels[8]]);
    expect(worldPanels[8]!.qualityFlags).toContain('provisional_starter_art');
    expect(worldPanels[8]!.temporary).toBe('procedural');
    expect(AVAILABLE_CAMPAIGN_ART_PATHS).toEqual(CAMPAIGN_ART_MANIFEST.filter(asset => asset.state === 'final').map(asset => asset.path));
    expect(campaignArtAssetsForLoader('campaign')).toEqual([
      ...campaignLoadOrder.map(worldId => ({ kind: 'image' as const, key: `campaign_worldmap_${worldId}`, path: `/assets/campaign/world-map/${worldId}-${worldId === 'aether_crown' || worlds.indexOf(worldId) >= 3 && worlds.indexOf(worldId) < 8 ? 'v2' : 'v1'}.png` })),
    ]);
    expect(CAMPAIGN_ART_MANIFEST.find(asset => asset.id === 'world-panel:astral_rift')).toMatchObject({ state: 'final_required', temporary: 'procedural' });
    expect(CAMPAIGN_ART_MANIFEST.find(asset => asset.id === 'world-panel:aether_crown')).toMatchObject({
      path: '/assets/campaign/world-map/aether_crown-v2.png', state: 'final', temporary: null
    });
    expect(CAMPAIGN_ART_MANIFEST.find(asset => asset.id === 'world-panel:whisperfen')).toMatchObject({
      path: '/assets/campaign/world-map/whisperfen-v2.png', state: 'final', temporary: null
    });
    for (const worldId of ['sunken_aether', 'ironroot', 'sky_isles', 'dreadmoon']) {
      expect(CAMPAIGN_ART_MANIFEST.find(asset => asset.id === `world-panel:${worldId}`)).toMatchObject({
        path: `/assets/campaign/world-map/${worldId}-v2.png`, state: 'final', temporary: null
      });
    }
    expect(CAMPAIGN_PROVISIONAL_STARTER_PATHS).not.toContain('/assets/campaign/world-map/whisperfen-v1.png');
    expect(AVAILABLE_CAMPAIGN_ART_PATHS).toContain('/assets/campaign/world-map/whisperfen-v2.png');
    expect(CAMPAIGN_PROVISIONAL_STARTER_PATHS).not.toContain('/assets/campaign/world-map/sunken_aether-v1.png');
    expect(CAMPAIGN_PROVISIONAL_STARTER_PATHS).not.toContain('/assets/campaign/world-map/sky_isles-v1.png');
    expect(CAMPAIGN_PROVISIONAL_STARTER_PATHS).not.toContain('/assets/campaign/world-map/dreadmoon-v1.png');
    expect(CAMPAIGN_PROVISIONAL_STARTER_PATHS).not.toContain('/assets/campaign/world-map/aether_crown-v1.png');
    expect(CAMPAIGN_PROVISIONAL_STARTER_PATHS).toContain('/assets/campaign/world-map/astral_rift-v1.png');
  });

  it('loads exactly the approved campaign panels from their exact production paths', () => {
    const assets = resolveCampaignArtAssets(worldPanels, 'campaign', AVAILABLE_CAMPAIGN_ART_PATHS);

    expect(assets).toEqual([...worlds.slice(0, 8), 'aether_crown'].map((worldId, index) => ({
      kind: 'image', key: `campaign_worldmap_${worldId}`, path: `/assets/campaign/world-map/${worldId}-${index >= 3 ? 'v2' : 'v1'}.png`
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
