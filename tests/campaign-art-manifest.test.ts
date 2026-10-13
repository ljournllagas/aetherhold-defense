import { describe, expect, it } from 'vitest';
import { STAGE_ASSETS, requiredAssets, requiredAssetsForRequest } from '../src/game/art/assetManifest.ts';
import { CAMPAIGN_WORLDS, getCampaignLevel } from '../src/game/campaign/config.ts';
import {
  AVAILABLE_CAMPAIGN_ART_PATHS, CAMPAIGN_ART_MANIFEST, CAMPAIGN_UI_ART_POLICY, campaignAnimationDefinitions,
  CAMPAIGN_PROVISIONAL_STARTER_PATHS, campaignArtAssetsForLoader, campaignGameplayAssetsForLevel,
  missingCampaignProductionAssets, resolveCampaignArtAssets, resolveCampaignProvisionalStarterAssets
} from '../src/game/campaign/artManifest.ts';

describe('campaign art replacement contract', () => {
  it('keeps final-required expansion entries out of ordinary runtime loaders', () => {
    const missing = missingCampaignProductionAssets();
    const required = [...requiredAssets('menu'), ...requiredAssets('campaign'), ...requiredAssets('gameplay')];

    expect(missing).toHaveLength(11);
    expect(missing.every(asset => asset.path.startsWith('/assets/campaign/'))).toBe(true);
    expect(missing.every(asset => asset.qualityFlags.includes('final_art_unverified'))).toBe(true);
    expect(missing.every(asset => asset.state === 'final_required' && asset.temporary === 'procedural')).toBe(true);
    const withheldPaths = new Set(missing.map(asset => asset.path));
    expect(required.filter(asset => withheldPaths.has(asset.path)).map(asset => asset.path)).toEqual(
      ['/assets/campaign/world-map/astral_rift-v1.png']
    );
    expect(campaignArtAssetsForLoader('menu', missing.map(asset => asset.path))).toEqual([]);
    expect(campaignArtAssetsForLoader('campaign', missing.map(asset => asset.path), [])).toEqual([]);
    expect(campaignArtAssetsForLoader('gameplay', missing.map(asset => asset.path))).toEqual([]);
    expect(required.filter(asset => asset.path.startsWith('/assets/campaign/'))).toEqual(campaignArtAssetsForLoader('campaign'));
    expect(CAMPAIGN_ART_MANIFEST.filter(asset => asset.state === 'final')).toHaveLength(109);
    expect(CAMPAIGN_ART_MANIFEST).toHaveLength(120);
  });

  it('registers the original and accepted World 4–8 and World 10 terrain plates with the approved tower tiers', () => {
    const maps = CAMPAIGN_ART_MANIFEST.filter(asset => asset.id.startsWith('map:') && asset.state === 'final');
    const expansion = CAMPAIGN_ART_MANIFEST.filter(asset => asset.state === 'final_required');
    const towers = CAMPAIGN_ART_MANIFEST.filter(asset => asset.id.startsWith('tower:'));
    expect(maps).toHaveLength(36);
    expect(maps.map(asset => asset.path)).toEqual([
      '/assets/campaign/maps/borderkeep_a-v1.png', '/assets/campaign/maps/borderkeep_b-v1.png',
      '/assets/campaign/maps/borderkeep_c-v1.png', '/assets/campaign/maps/borderkeep_d-v1.png',
      '/assets/campaign/maps/emberfall_a-v1.png', '/assets/campaign/maps/emberfall_b-v1.png',
      '/assets/campaign/maps/emberfall_c-v1.png', '/assets/campaign/maps/emberfall_d-v1.png',
      '/assets/campaign/maps/frostveil_a-v1.png', '/assets/campaign/maps/frostveil_b-v1.png',
      '/assets/campaign/maps/frostveil_c-v1.png', '/assets/campaign/maps/frostveil_d-v1.png',
      '/assets/campaign/maps/whisperfen_a-v2.png', '/assets/campaign/maps/whisperfen_b-v2.png',
      '/assets/campaign/maps/whisperfen_c-v2.png', '/assets/campaign/maps/whisperfen_d-v2.png',
      '/assets/campaign/maps/sunken_aether_a-v2.png', '/assets/campaign/maps/sunken_aether_b-v2.png',
      '/assets/campaign/maps/sunken_aether_c-v2.png', '/assets/campaign/maps/sunken_aether_d-v2.png',
      '/assets/campaign/maps/ironroot_a-v2.png', '/assets/campaign/maps/ironroot_b-v2.png',
      '/assets/campaign/maps/ironroot_c-v2.png', '/assets/campaign/maps/ironroot_d-v2.png',
      '/assets/campaign/maps/sky_isles_a-v2.png', '/assets/campaign/maps/sky_isles_b-v2.png',
      '/assets/campaign/maps/sky_isles_c-v2.png', '/assets/campaign/maps/sky_isles_d-v2.png',
      '/assets/campaign/maps/dreadmoon_a-v2.png', '/assets/campaign/maps/dreadmoon_b-v2.png',
      '/assets/campaign/maps/dreadmoon_c-v2.png', '/assets/campaign/maps/dreadmoon_d-v2.png',
      '/assets/campaign/maps/aether_crown_a-v2.png', '/assets/campaign/maps/aether_crown_b-v2.png',
      '/assets/campaign/maps/aether_crown_c-v2.png', '/assets/campaign/maps/aether_crown_d-v2.png'
    ]);
    expect(maps.every(asset => asset.state === 'final' && asset.temporary === null
      && asset.qualityFlags.join(',') === 'terrain_plate,runtime_geometry_overlay')).toBe(true);
    expect(towers).toHaveLength(10);
    expect(towers.every(asset => asset.state === 'final' && asset.temporary === null && !asset.qualityFlags.includes('final_art_unverified'))).toBe(true);
    expect(AVAILABLE_CAMPAIGN_ART_PATHS).toEqual([
      ...CAMPAIGN_ART_MANIFEST.filter(asset => asset.state === 'final').map(asset => asset.path)
    ]);
    expect(expansion).toHaveLength(11);
    expect(expansion.filter(asset => asset.id.startsWith('map:'))).toHaveLength(4);
    expect(expansion.filter(asset => asset.id.startsWith('world-panel:'))).toHaveLength(1);
    expect(expansion.filter(asset => asset.id.startsWith('enemy:'))).toHaveLength(5);
    expect(expansion.filter(asset => asset.id.startsWith('boss:'))).toHaveLength(1);
    expect(expansion.some(asset => AVAILABLE_CAMPAIGN_ART_PATHS.includes(asset.path))).toBe(false);
    expect(CAMPAIGN_PROVISIONAL_STARTER_PATHS).toHaveLength(11);
    expect(new Set(CAMPAIGN_PROVISIONAL_STARTER_PATHS).size).toBe(11);
    expect(CAMPAIGN_ART_MANIFEST.filter(asset => asset.state === 'final_required').map(asset => asset.path).sort())
      .toEqual([...CAMPAIGN_PROVISIONAL_STARTER_PATHS].sort());
  });

  it('queues only promoted assets whose exact production paths are approved', () => {
    const sheet = CAMPAIGN_ART_MANIFEST.find(asset => asset.kind === 'sheet')!;
    const finalSheet = { ...sheet, state: 'final' as const };
    const image = CAMPAIGN_ART_MANIFEST.find(asset => asset.id === 'world-panel:borderkeep')!;

    expect(resolveCampaignArtAssets([finalSheet], 'gameplay', [finalSheet.path])).toEqual([{
      kind: 'sheet', key: finalSheet.key, path: finalSheet.path,
      frameWidth: finalSheet.frameWidth, frameHeight: finalSheet.frameHeight
    }]);
    expect(resolveCampaignArtAssets([finalSheet], 'gameplay', [`${finalSheet.path}.wrong`])).toEqual([]);
    expect(resolveCampaignArtAssets([{ ...sheet, state: 'final_required' }], 'gameplay', [sheet.path])).toEqual([]);
    expect(resolveCampaignArtAssets([image], 'gameplay', [image.path])).toEqual([]);
    expect(resolveCampaignArtAssets([image], 'menu', [image.path])).toEqual([]);
    expect(resolveCampaignArtAssets([image], 'campaign', [`${image.path}.wrong`])).toEqual([]);
    expect(resolveCampaignArtAssets([image], 'campaign', [image.path])).toEqual([{
      kind: 'image', key: image.key, path: image.path
    }]);
  });

  it('requests approved panels and only the remaining gated starter panels on entry', () => {
    const panels = CAMPAIGN_ART_MANIFEST.filter(asset => asset.id.startsWith('world-panel:'));
    const campaign = campaignArtAssetsForLoader('campaign');
    const requested = requiredAssets('campaign');

    expect(campaign.map(asset => asset.key)).toEqual([
      ...CAMPAIGN_WORLDS.slice(0, 8).map(world => `campaign_worldmap_${world.id}`),
      'campaign_worldmap_aether_crown', 'campaign_worldmap_astral_rift'
    ]);
    expect(AVAILABLE_CAMPAIGN_ART_PATHS).toEqual(CAMPAIGN_ART_MANIFEST.filter(asset => asset.state === 'final').map(asset => asset.path));
    expect(panels.filter(asset => asset.state === 'final')).toHaveLength(9);
    expect(panels.filter(asset => asset.state === 'final_required')).toHaveLength(1);
    expect(panels.filter(asset => asset.state === 'final').every(asset => asset.temporary === null
      && !asset.qualityFlags.includes('final_art_unverified'))).toBe(true);
    expect(resolveCampaignProvisionalStarterAssets(panels, 'campaign', CAMPAIGN_PROVISIONAL_STARTER_PATHS).map(asset => asset.key)).toEqual(
      ['campaign_worldmap_astral_rift']
    );
    expect(resolveCampaignProvisionalStarterAssets(panels, 'campaign', []).map(asset => asset.key)).toEqual([]);
    expect(requested).toEqual([...requiredAssets('menu'), ...campaign]);
    expect(requested.some(asset => STAGE_ASSETS.gameplay.some(gameplay => gameplay.key === asset.key))).toBe(false);
    expect(STAGE_ASSETS.gameplay).toHaveLength(15);
    expect(STAGE_ASSETS.gameplay.every(asset => !asset.path.startsWith('/assets/campaign/'))).toBe(true);
  });

  it('selects one approved family and only the current cosmetic tower tier', () => {
    const level = getCampaignLevel(1)!;
    const tierTwo = campaignGameplayAssetsForLevel(level, 2);
    expect(tierTwo.map(asset => asset.path)).toEqual([
      '/assets/campaign/maps/borderkeep_a-v1.png',
      ...CAMPAIGN_ART_MANIFEST.filter(asset => level.enemyIds.some(id => asset.id === `enemy:${id}`)).map(asset => asset.path),
      ...['longbow', 'ember', 'glacier', 'starfire', 'tempest'].map(id => `/assets/campaign/towers/${id}-tier2-v1.png`)
    ]);
    expect(campaignGameplayAssetsForLevel(level, 1).map(asset => asset.path)).toEqual(tierTwo.filter(asset => !asset.path.includes('/towers/')).map(asset => asset.path));
    expect(campaignGameplayAssetsForLevel(level, 3).filter(asset => asset.path.includes('/towers/')).every(asset => asset.path.includes('-tier3-'))).toBe(true);
    const otherFamily = campaignGameplayAssetsForLevel(getCampaignLevel(11)!, 2);
    expect(otherFamily.some(asset => asset.path === '/assets/campaign/maps/emberfall_a-v1.png')).toBe(true);
    expect(otherFamily.some(asset => asset.key === 'campaign_borderkeep_a')).toBe(false);
    expect(requiredAssetsForRequest('gameplay', { mode: 'campaign', campaignLevel: 1, campaignVisualTier: 2 }).filter(asset => asset.path.startsWith('/assets/campaign/'))).toEqual(tierTwo);
    const whisperfen = campaignGameplayAssetsForLevel(getCampaignLevel(31)!, 1);
    expect(whisperfen.map(asset => asset.path)).toEqual([
      '/assets/campaign/maps/whisperfen_a-v2.png',
      '/assets/campaign/enemies/whisperfen/bogling-atlas-v2.png'
    ]);
    const hydraAssets = campaignGameplayAssetsForLevel(getCampaignLevel(40)!, 1).map(asset => asset.path);
    expect(hydraAssets).toEqual(expect.arrayContaining([
      '/assets/campaign/maps/whisperfen_d-v2.png',
      '/assets/campaign/enemies/whisperfen/bogling-atlas-v2.png',
      '/assets/campaign/enemies/whisperfen/rootwretch-atlas-v2.png',
      '/assets/campaign/bosses/mireheart_hydra-atlas-v2.png'
    ]));
    const sunkenAether = campaignGameplayAssetsForLevel(getCampaignLevel(41)!, 1);
    expect(sunkenAether.map(asset => asset.path)).toEqual([
      '/assets/campaign/maps/sunken_aether_a-v2.png',
      '/assets/campaign/enemies/sunken_aether/tideborn-atlas-v2.png'
    ]);
    expect(campaignGameplayAssetsForLevel(getCampaignLevel(50)!, 1).map(asset => asset.path)).toEqual(expect.arrayContaining([
      '/assets/campaign/maps/sunken_aether_d-v2.png',
      '/assets/campaign/bosses/drowned_oracle-atlas-v2.png'
    ]));
    expect(campaignGameplayAssetsForLevel(getCampaignLevel(51)!, 1).map(asset => asset.path)).toEqual(expect.arrayContaining([
      '/assets/campaign/maps/ironroot_a-v2.png',
      '/assets/campaign/enemies/ironroot/scrapling-atlas-v2.png'
    ]));
    expect(campaignGameplayAssetsForLevel(getCampaignLevel(60)!, 1).map(asset => asset.path)).toEqual(expect.arrayContaining([
      '/assets/campaign/maps/ironroot_d-v2.png',
      '/assets/campaign/bosses/iron_tyrant-atlas-v2.png'
    ]));
    expect(campaignGameplayAssetsForLevel(getCampaignLevel(61)!, 1).map(asset => asset.path)).toEqual(expect.arrayContaining([
      '/assets/campaign/maps/sky_isles_a-v2.png',
      '/assets/campaign/enemies/sky_isles/cloud_skitter-atlas-v2.png'
    ]));
    expect(campaignGameplayAssetsForLevel(getCampaignLevel(70)!, 1).map(asset => asset.path)).toEqual(expect.arrayContaining([
      '/assets/campaign/maps/sky_isles_d-v2.png',
      '/assets/campaign/bosses/stormmaw_prime-atlas-v2.png'
    ]));
    expect(campaignGameplayAssetsForLevel(getCampaignLevel(71)!, 1).map(asset => asset.path)).toEqual(expect.arrayContaining([
      '/assets/campaign/maps/dreadmoon_a-v2.png',
      '/assets/campaign/enemies/dreadmoon/shadeborn-atlas-v2.png'
    ]));
    expect(campaignGameplayAssetsForLevel(getCampaignLevel(80)!, 1).map(asset => asset.path)).toEqual(expect.arrayContaining([
      '/assets/campaign/maps/dreadmoon_d-v2.png',
      '/assets/campaign/enemies/dreadmoon/echo_shade-atlas-v2.png',
      '/assets/campaign/bosses/umbral_regent-atlas-v2.png'
    ]));
    expect(campaignGameplayAssetsForLevel(getCampaignLevel(100)!, 1).map(asset => asset.path)).toEqual(expect.arrayContaining([
      '/assets/campaign/maps/aether_crown_d-v2.png',
      '/assets/campaign/bosses/aether_devourer-atlas-v2.png'
    ]));
    expect(requiredAssetsForRequest('gameplay', { mode: 'campaign', campaignLevel: 31, campaignVisualTier: 1 }).filter(asset => asset.path.startsWith('/assets/campaign/'))).toEqual(whisperfen);
    expect(requiredAssetsForRequest('gameplay', { mode: 'campaign', campaignLevel: 41, campaignVisualTier: 3 })).toEqual([
      ...requiredAssets('gameplay'), ...campaignGameplayAssetsForLevel(getCampaignLevel(41)!, 3)
    ]);
  });

  it('includes a known boss summon atlas even when the level roster omits it', () => {
    const level = { ...getCampaignLevel(10)!, enemyIds: ['skitter'] };
    const ids = new Set(['map:borderkeep:d', 'enemy:skitter', 'enemy:marchling', 'boss:hollow_warden']);
    const manifest = CAMPAIGN_ART_MANIFEST.filter(asset => ids.has(asset.id)).map(asset => ({ ...asset, state: 'final' as const, temporary: null }));
    const selected = campaignGameplayAssetsForLevel(level, 1, manifest, manifest.map(asset => asset.path));
    expect(selected.map(asset => asset.key)).toEqual(expect.arrayContaining(['campaign_enemy_marchling', 'campaign_enemy_hollow_warden']));
  });

  it('describes support buff atlases and exposes every boss/support animation key', () => {
    const ashcaller = CAMPAIGN_ART_MANIFEST.find(asset => asset.id === 'enemy:ashcaller')!;
    const frostShaman = CAMPAIGN_ART_MANIFEST.find(asset => asset.id === 'enemy:frost_shaman')!;
    const rootwretch = CAMPAIGN_ART_MANIFEST.find(asset => asset.id === 'enemy:rootwretch')!;
    expect([ashcaller.height, frostShaman.height]).toEqual([640, 640]);
    expect(ashcaller.states.buff).toEqual({ row: 4, frames: 6 });
    expect(frostShaman.states.buff).toEqual({ row: 4, frames: 6 });
    expect(ashcaller.qualityFlags).toContain('support_buff_playback_verified');
    expect(frostShaman.qualityFlags).toContain('support_buff_playback_verified');
    expect(rootwretch.states.buff).toEqual({ row: 4, frames: 6 });

    const animationKeys = (id: string) => campaignAnimationDefinitions(`campaign_enemy_${id}`).map(animation => animation.key);
    expect(animationKeys('ashcaller')).toContain('campaign_enemy_ashcaller_buff');
    expect(animationKeys('frost_shaman')).toContain('campaign_enemy_frost_shaman_buff');
    expect(animationKeys('cinder_colossus')).toEqual(expect.arrayContaining([
      'campaign_enemy_cinder_colossus_armor_break', 'campaign_enemy_cinder_colossus_exposed_core'
    ]));
    expect(animationKeys('frostbound_matriarch')).toEqual(expect.arrayContaining([
      'campaign_enemy_frostbound_matriarch_freeze_cast', 'campaign_enemy_frostbound_matriarch_phase_two'
    ]));
    expect(animationKeys('mireheart_hydra')).toEqual(expect.arrayContaining([
      'campaign_enemy_mireheart_hydra_special', 'campaign_enemy_mireheart_hydra_phase_two'
    ]));
    expect(CAMPAIGN_UI_ART_POLICY).toMatchObject({
      routeNodes: expect.stringContaining('vector'),
      masteryStars: expect.stringContaining('text glyphs'),
      worldSigils: expect.stringContaining('text labels')
    });
  });
});
