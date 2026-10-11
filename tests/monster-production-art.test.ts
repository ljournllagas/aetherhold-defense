import { describe, expect, it } from 'vitest';
import { CAMPAIGN_ART_MANIFEST, AVAILABLE_CAMPAIGN_ART_PATHS, campaignGameplayAssetsForLevel, missingCampaignProductionAssets } from '../src/game/campaign/artManifest.ts';
import { CAMPAIGN_LEVELS } from '../src/game/campaign/config.ts';

describe('complete production monster artwork', () => {
  const sheets = CAMPAIGN_ART_MANIFEST.filter(asset => asset.kind === 'sheet');
  it('has final artwork for all fifteen Campaign enemies and three bosses', () => {
    expect(sheets).toHaveLength(18);
    expect(missingCampaignProductionAssets()).toEqual([]);
    for (const asset of sheets) {
      expect(asset.state, asset.id).toBe('final');
      expect(asset.temporary, asset.id).toBeNull();
      expect(asset.qualityFlags).not.toContain('final_art_unverified');
      expect(AVAILABLE_CAMPAIGN_ART_PATHS).toContain(asset.path);
    }
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

  it('loads final roster, boss and summon textures for every Campaign level', () => {
    for (const level of CAMPAIGN_LEVELS) {
      const requested = campaignGameplayAssetsForLevel(level, 1).map(asset => asset.key);
      for (const id of level.enemyIds) expect(requested, `level ${level.level}`).toContain(`campaign_enemy_${id}`);
      if (level.bossEnemyId) expect(requested).toContain(`campaign_enemy_${level.bossEnemyId}`);
      if (level.bossEnemyId === 'hollow_warden') expect(requested).toContain('campaign_enemy_marchling');
    }
  });
});
