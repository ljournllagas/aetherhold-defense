import { describe, expect, it } from 'vitest';
import { STAGE_ASSETS, requiredAssets } from '../src/game/art/assetManifest.ts';
import {
  AVAILABLE_CAMPAIGN_ART_PATHS, CAMPAIGN_ART_MANIFEST, CAMPAIGN_UI_ART_POLICY, campaignAnimationDefinitions,
  campaignArtAssetsForLoader, missingCampaignProductionAssets, resolveCampaignArtAssets
} from '../src/game/campaign/artManifest.ts';

describe('campaign art replacement contract', () => {
  it('does not request any absent final-required production files', () => {
    const missing = missingCampaignProductionAssets();
    const required = [...requiredAssets('menu'), ...requiredAssets('campaign'), ...requiredAssets('gameplay')];

    expect(missing).toHaveLength(40);
    expect(missing.every(asset => asset.path.startsWith('/assets/campaign/'))).toBe(true);
    expect(missing.every(asset => asset.qualityFlags.includes('final_art_unverified'))).toBe(true);
    expect(campaignArtAssetsForLoader('menu', missing.map(asset => asset.path))).toEqual([]);
    expect(campaignArtAssetsForLoader('campaign', missing.map(asset => asset.path))).toEqual([]);
    expect(campaignArtAssetsForLoader('gameplay', missing.map(asset => asset.path))).toEqual([]);
    expect(required.filter(asset => asset.path.startsWith('/assets/campaign/'))).toEqual(campaignArtAssetsForLoader('campaign'));
    expect(CAMPAIGN_ART_MANIFEST.filter(asset => asset.state === 'final')).toHaveLength(3);
    expect(CAMPAIGN_ART_MANIFEST).toHaveLength(43);
  });

  it('queues only promoted assets whose exact production paths are approved', () => {
    const sheet = missingCampaignProductionAssets().find(asset => asset.kind === 'sheet')!;
    const finalSheet = { ...sheet, state: 'final' as const };
    const image = CAMPAIGN_ART_MANIFEST.find(asset => asset.id === 'world-panel:borderkeep')!;

    expect(resolveCampaignArtAssets([finalSheet], 'gameplay', [finalSheet.path])).toEqual([{
      kind: 'sheet', key: finalSheet.key, path: finalSheet.path,
      frameWidth: finalSheet.frameWidth, frameHeight: finalSheet.frameHeight
    }]);
    expect(resolveCampaignArtAssets([finalSheet], 'gameplay', [`${finalSheet.path}.wrong`])).toEqual([]);
    expect(resolveCampaignArtAssets([image], 'gameplay', [image.path])).toEqual([]);
    expect(resolveCampaignArtAssets([image], 'menu', [image.path])).toEqual([]);
    expect(resolveCampaignArtAssets([image], 'campaign', [`${image.path}.wrong`])).toEqual([]);
    expect(resolveCampaignArtAssets([image], 'campaign', [image.path])).toEqual([{
      kind: 'image', key: image.key, path: image.path
    }]);
  });

  it('requests exactly the three approved world panels on campaign entry', () => {
    const panels = CAMPAIGN_ART_MANIFEST.filter(asset => asset.id.startsWith('world-panel:'));
    const campaign = campaignArtAssetsForLoader('campaign');
    const requested = requiredAssets('campaign');

    expect(campaign.map(asset => asset.key)).toEqual([
      'campaign_worldmap_borderkeep', 'campaign_worldmap_emberfall', 'campaign_worldmap_frostveil'
    ]);
    expect(AVAILABLE_CAMPAIGN_ART_PATHS).toEqual(panels.map(asset => asset.path));
    expect(panels.every(asset => asset.state === 'final' && asset.temporary === null
      && !asset.qualityFlags.includes('final_art_unverified'))).toBe(true);
    expect(requested).toEqual([...requiredAssets('menu'), ...campaign]);
    expect(requested.some(asset => STAGE_ASSETS.gameplay.some(gameplay => gameplay.key === asset.key))).toBe(false);
  });

  it('describes support buff atlases and exposes every boss/support animation key', () => {
    const ashcaller = CAMPAIGN_ART_MANIFEST.find(asset => asset.id === 'enemy:ashcaller')!;
    const frostShaman = CAMPAIGN_ART_MANIFEST.find(asset => asset.id === 'enemy:frost_shaman')!;
    expect([ashcaller.height, frostShaman.height]).toEqual([640, 640]);
    expect(ashcaller.states.buff).toEqual({ row: 4, frames: 6 });
    expect(frostShaman.states.buff).toEqual({ row: 4, frames: 6 });
    expect(ashcaller.qualityFlags).toContain('support_buff_playback_unverified');
    expect(frostShaman.qualityFlags).toContain('support_buff_playback_unverified');

    const animationKeys = (id: string) => campaignAnimationDefinitions(`campaign_enemy_${id}`).map(animation => animation.key);
    expect(animationKeys('ashcaller')).toContain('campaign_enemy_ashcaller_buff');
    expect(animationKeys('frost_shaman')).toContain('campaign_enemy_frost_shaman_buff');
    expect(animationKeys('cinder_colossus')).toEqual(expect.arrayContaining([
      'campaign_enemy_cinder_colossus_armor_break', 'campaign_enemy_cinder_colossus_exposed_core'
    ]));
    expect(animationKeys('frostbound_matriarch')).toEqual(expect.arrayContaining([
      'campaign_enemy_frostbound_matriarch_freeze_cast', 'campaign_enemy_frostbound_matriarch_phase_two'
    ]));
    expect(CAMPAIGN_UI_ART_POLICY).toMatchObject({
      routeNodes: expect.stringContaining('vector'),
      masteryStars: expect.stringContaining('text glyphs'),
      worldSigils: expect.stringContaining('text labels')
    });
  });
});
