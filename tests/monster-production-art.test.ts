import { describe, expect, it } from 'vitest';
import { CAMPAIGN_ART_MANIFEST, AVAILABLE_CAMPAIGN_ART_PATHS, campaignGameplayAssetsForLevel, missingCampaignProductionAssets } from '../src/game/campaign/artManifest.ts';
import { CAMPAIGN_LEVELS } from '../src/game/campaign/config.ts';

describe('complete production monster artwork', () => {
  const sheets = CAMPAIGN_ART_MANIFEST.filter(asset => asset.kind === 'sheet');
  it('preserves original atlases and accepts all released World 4–10 atlases', () => {
    const finalSheets = sheets.filter(asset => asset.state === 'final');
    const expansionSheets = sheets.filter(asset => asset.state === 'final_required');
    expect(sheets).toHaveLength(60);
    expect(finalSheets).toHaveLength(60);
    expect(expansionSheets).toHaveLength(0);
    expect(missingCampaignProductionAssets()).toHaveLength(0);
    for (const asset of finalSheets) {
      expect(asset.state, asset.id).toBe('final');
      expect(asset.temporary, asset.id).toBeNull();
      expect(asset.qualityFlags).not.toContain('final_art_unverified');
      expect(AVAILABLE_CAMPAIGN_ART_PATHS).toContain(asset.path);
    }
    for (const asset of expansionSheets) {
      expect(asset.state, asset.id).toBe('final_required');
      expect(asset.temporary, asset.id).toBe('procedural');
      expect(asset.qualityFlags).toContain('final_art_unverified');
      expect(AVAILABLE_CAMPAIGN_ART_PATHS).not.toContain(asset.path);
    }

    const releasedExpansionIds = [
      'enemy:bogling', 'enemy:fen_skitter', 'enemy:mossguard', 'enemy:rotback', 'enemy:rootwretch', 'boss:mireheart_hydra'
      ,'enemy:tideborn', 'enemy:crystal_wisp', 'enemy:deepcrawler', 'enemy:relic_guardian', 'enemy:aetherbound', 'boss:drowned_oracle'
      ,'enemy:scrapling', 'enemy:furnace_hound', 'enemy:ironbound', 'enemy:foundry_core', 'enemy:siege_golem', 'boss:iron_tyrant'
      ,'enemy:aether_drake', 'enemy:cloud_skitter', 'enemy:galeclaw', 'enemy:stormguard', 'enemy:tempest_herald', 'boss:stormmaw_prime'
      ,'enemy:shadeborn', 'enemy:dusk_runner', 'enemy:moonstalker', 'enemy:grave_hulk', 'enemy:echo_shade', 'boss:umbral_regent'
      ,'enemy:aetherborn', 'enemy:crown_runner', 'enemy:aether_seer', 'enemy:sentry_colossus', 'enemy:crown_archon', 'boss:aether_devourer'
      ,'enemy:riftling', 'enemy:phase_hound', 'enemy:astral_horror', 'enemy:voidplate', 'enemy:rift_weaver', 'boss:rift_sovereign'
    ];
    const releasedExpansion = releasedExpansionIds.map(id => sheets.find(asset => asset.id === id)!);
    expect(releasedExpansion).toHaveLength(42);
    expect(releasedExpansion.every(asset => asset.state === 'final' && asset.temporary === null
      && !asset.qualityFlags.includes('final_art_unverified')
      && !asset.qualityFlags.includes('provisional_starter_art')
      && AVAILABLE_CAMPAIGN_ART_PATHS.includes(asset.path))).toBe(true);
    expect(releasedExpansion.find(asset => asset.id === 'enemy:rootwretch')?.qualityFlags).toContain('support_buff_playback_verified');
    expect(releasedExpansion.find(asset => asset.id === 'enemy:aetherbound')?.qualityFlags).toContain('support_buff_playback_verified');
    expect(releasedExpansion.find(asset => asset.id === 'enemy:foundry_core')?.qualityFlags).toContain('support_buff_playback_verified');
    expect(releasedExpansion.find(asset => asset.id === 'enemy:tempest_herald')?.qualityFlags).toContain('support_buff_playback_verified');
    expect(releasedExpansion.find(asset => asset.id === 'enemy:echo_shade')?.qualityFlags).toContain('support_buff_playback_verified');
    expect(releasedExpansion.find(asset => asset.id === 'enemy:crown_archon')?.qualityFlags).toContain('support_buff_playback_verified');
    expect(releasedExpansion.find(asset => asset.id === 'enemy:rift_weaver')?.qualityFlags).toContain('support_buff_playback_verified');
    expect(releasedExpansion.find(asset => asset.id === 'boss:mireheart_hydra')?.qualityFlags).toContain('phase_state_readability_verified');
    expect(releasedExpansion.find(asset => asset.id === 'boss:rift_sovereign')?.qualityFlags).toContain('phase_state_readability_verified');
    expect(releasedExpansion.find(asset => asset.id === 'boss:drowned_oracle')?.qualityFlags).toContain('phase_state_readability_verified');
    expect(releasedExpansion.find(asset => asset.id === 'boss:iron_tyrant')?.qualityFlags).toContain('phase_state_readability_verified');
    expect(releasedExpansion.find(asset => asset.id === 'boss:stormmaw_prime')?.qualityFlags).toContain('phase_state_readability_verified');
    expect(releasedExpansion.find(asset => asset.id === 'boss:umbral_regent')?.qualityFlags).toContain('phase_state_readability_verified');
    expect(releasedExpansion.find(asset => asset.id === 'boss:aether_devourer')?.qualityFlags).toContain('phase_state_readability_verified');
  });

  it('packages every required row in an RGBA PNG with the declared cell dimensions', async () => {
    const moduleName = 'node:fs';
    const { readFileSync } = await import(moduleName);
    for (const asset of sheets) {
      const image = readFileSync(new URL(`../public${asset.path}`, import.meta.url));
      expect([...image.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
      expect(image.readUInt32BE(16), asset.id).toBe(asset.width);
      expect(image.readUInt32BE(20), asset.id).toBe(asset.height);
      expect(image[25], `${asset.id} PNG color type`).toBe(6);
      for (const state of Object.values(asset.states)) {
        expect(state.frames * asset.frameWidth!).toBeLessThanOrEqual(asset.width);
        expect((state.row + 1) * asset.frameHeight!).toBeLessThanOrEqual(asset.height);
      }
    }
  });

  it('loads only each current level’s registered atlas roster across the ten-world campaign', () => {
    for (const level of CAMPAIGN_LEVELS) {
      const requested = campaignGameplayAssetsForLevel(level, 1).map(asset => asset.key);
      for (const id of level.enemyIds) expect(requested, `level ${level.level}`).toContain(`campaign_enemy_${id}`);
      if (level.bossEnemyId) expect(requested).toContain(`campaign_enemy_${level.bossEnemyId}`);
      if (level.bossEnemyId === 'hollow_warden') expect(requested).toContain('campaign_enemy_marchling');
      if (level.bossEnemyId === 'mireheart_hydra') expect(requested).toContain('campaign_enemy_bogling');
      const family = level.mapLayoutId.slice(level.worldId.length + 1, level.worldId.length + 2);
      expect(requested).toContain(`campaign_${level.worldId}_${family}`);
      expect(requested.filter(key => key.startsWith('campaign_enemy_')).every(key =>
        level.enemyIds.some(id => key === `campaign_enemy_${id}`)
        || key === `campaign_enemy_${level.bossEnemyId}`
        || (level.bossEnemyId === 'hollow_warden' && key === 'campaign_enemy_marchling')
        || (level.bossEnemyId === 'mireheart_hydra' && key === 'campaign_enemy_bogling')
      )).toBe(true);
    }
  });
});
