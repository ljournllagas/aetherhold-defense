import { describe, expect, it } from 'vitest';
import { requiredAssets } from '../src/game/art/assetManifest.ts';
import {
  CAMPAIGN_ART_MANIFEST, CAMPAIGN_UI_ART_POLICY, campaignAnimationDefinitions,
  campaignArtAssetsForLoader, missingCampaignProductionAssets, resolveCampaignArtAssets
} from '../src/game/campaign/artManifest.ts';

describe('campaign art replacement contract', () => {
  it('does not request any absent final-required production files', () => {
    const missing = missingCampaignProductionAssets();
    const required = [...requiredAssets('menu'), ...requiredAssets('gameplay')];

    expect(missing.length).toBeGreaterThan(0);
    expect(missing.every(asset => asset.path.startsWith('/assets/campaign/'))).toBe(true);
    expect(missing.every(asset => asset.qualityFlags.includes('final_art_unverified'))).toBe(true);
    expect(campaignArtAssetsForLoader('menu', missing.map(asset => asset.path))).toEqual([]);
    expect(campaignArtAssetsForLoader('gameplay', missing.map(asset => asset.path))).toEqual([]);
    expect(required.some(asset => asset.key.startsWith('campaign_'))).toBe(false);
    expect(CAMPAIGN_ART_MANIFEST.every(asset => asset.state === 'final_required')).toBe(true);
  });

  it('queues only promoted assets whose exact production paths are approved', () => {
    const sheet = missingCampaignProductionAssets().find(asset => asset.kind === 'sheet')!;
    const finalSheet = { ...sheet, state: 'final' as const };
    const image = { ...missingCampaignProductionAssets().find(asset => asset.kind === 'image' && asset.stage === 'menu')!, state: 'final' as const };

    expect(resolveCampaignArtAssets([finalSheet], 'gameplay', [finalSheet.path])).toEqual([{
      kind: 'sheet', key: finalSheet.key, path: finalSheet.path,
      frameWidth: finalSheet.frameWidth, frameHeight: finalSheet.frameHeight
    }]);
    expect(resolveCampaignArtAssets([finalSheet], 'gameplay', [`${finalSheet.path}.wrong`])).toEqual([]);
    expect(resolveCampaignArtAssets([image], 'gameplay', [image.path])).toEqual([]);
    expect(resolveCampaignArtAssets([image], 'menu', [image.path])).toEqual([{
      kind: 'image', key: image.key, path: image.path
    }]);
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
