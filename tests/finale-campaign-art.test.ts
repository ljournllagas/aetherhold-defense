import { describe, expect, it } from 'vitest';
import { STAGE_ASSETS } from '../src/game/art/assetManifest.ts';
import {
  AVAILABLE_CAMPAIGN_ART_PATHS, CAMPAIGN_ART_MANIFEST,
  campaignArtAssetsForLoader, campaignGameplayAssetsForLevel
} from '../src/game/campaign/artManifest.ts';
import { CAMPAIGN_LEVELS, getCampaignLevel } from '../src/game/campaign/config.ts';
import { getCampaignEnemy } from '../src/game/campaign/enemies.ts';
import { campaignResultActions } from '../src/game/ui/campaignResultActions.ts';
import {
  addFinaleIllustration, FINALE_CAMPAIGN_ART, finaleDisplaySize, isFinalCampaignCompletion
} from '../src/game/campaign/finaleArt.ts';

const DELIVERY_URL = new URL('../public/assets/campaign/finale/campaign-finale-v1.webp', import.meta.url);

function fakeRender(present: readonly string[]) {
  const added: unknown[] = [];
  const records: Array<Record<string, unknown>> = [];
  const scene = {
    textures: { exists: (key: string) => present.includes(key) },
    add: {
      image: (x: number, y: number, key: string) => {
        const record: Record<string, unknown> = { x, y, key, display: null, crop: null };
        records.push(record);
        const view = {
          setDisplaySize: (w: number, h: number) => { record.display = [w, h]; return view; },
          setCrop: (sx: number, sy: number, sw: number, sh: number) => { record.crop = [sx, sy, sw, sh]; return view; }
        };
        return view;
      }
    }
  };
  const parent = { add: (view: unknown) => { added.push(view); } };
  return { records, added, scene: scene as unknown as Phaser.Scene, parent: parent as unknown as Phaser.GameObjects.Container };
}

describe('campaign finale illustration', () => {
  it('registers the finale master as a final gameplay image at its measured size', () => {
    expect(FINALE_CAMPAIGN_ART.textureKey).toBe('campaign_finale');
    expect(FINALE_CAMPAIGN_ART.path).toBe('/assets/campaign/finale/campaign-finale-v1.webp');
    expect(FINALE_CAMPAIGN_ART.sourceWidth).toBe(1672);
    expect(FINALE_CAMPAIGN_ART.sourceHeight).toBe(941);
    expect(CAMPAIGN_ART_MANIFEST.find(asset => asset.id === 'finale:campaign')).toMatchObject({
      key: FINALE_CAMPAIGN_ART.textureKey, path: FINALE_CAMPAIGN_ART.path,
      stage: 'gameplay', state: 'final', kind: 'image', width: 1672, height: 941
    });
    expect(AVAILABLE_CAMPAIGN_ART_PATHS).toContain(FINALE_CAMPAIGN_ART.path);
  });

  it('loads the finale only with the final-level gameplay bundle', () => {
    const finalLevel = getCampaignLevel(CAMPAIGN_LEVELS.length)!;
    expect(finalLevel.level).toBe(100);
    const finalBundle = campaignGameplayAssetsForLevel(finalLevel, 1);
    expect(finalBundle).toContainEqual({ kind: 'image', key: FINALE_CAMPAIGN_ART.textureKey, path: FINALE_CAMPAIGN_ART.path });
    expect(STAGE_ASSETS.campaign.some(asset => asset.key === FINALE_CAMPAIGN_ART.textureKey)).toBe(false);
    for (const level of [1, 10, 50, 99]) {
      expect(campaignGameplayAssetsForLevel(getCampaignLevel(level)!, 1).some(asset => asset.key === FINALE_CAMPAIGN_ART.textureKey)).toBe(false);
    }
    expect(campaignArtAssetsForLoader('menu').some(asset => asset.key === FINALE_CAMPAIGN_ART.textureKey)).toBe(false);
    expect(campaignArtAssetsForLoader('campaign').some(asset => asset.key === FINALE_CAMPAIGN_ART.textureKey)).toBe(false);
    expect(STAGE_ASSETS.gameplay.some(asset => asset.key === FINALE_CAMPAIGN_ART.textureKey)).toBe(false);
  });

  it('ships a valid opaque landscape delivery file at the measured source size', async () => {
    const moduleName = 'node:fs';
    const { readFileSync } = await import(moduleName);
    const image = readFileSync(DELIVERY_URL);
    expect(image.toString('ascii', 0, 4)).toBe('RIFF');
    expect(image.toString('ascii', 8, 12)).toBe('WEBP');
    expect(image.toString('ascii', 12, 16)).toBe('VP8 ');
    expect(image.toString('hex', 23, 26)).toBe('9d012a');
    expect(image.readUInt16LE(26) & 0x3fff).toBe(1672);
    expect(image.readUInt16LE(28) & 0x3fff).toBe(941);
  });

  it('shows the illustration only at the final victory presentation', () => {
    expect(isFinalCampaignCompletion(CAMPAIGN_LEVELS.length, 'victory')).toBe(true);
    expect(isFinalCampaignCompletion(CAMPAIGN_LEVELS.length - 1, 'victory')).toBe(false);
    expect(isFinalCampaignCompletion(1, 'victory')).toBe(false);
    expect(isFinalCampaignCompletion(CAMPAIGN_LEVELS.length, 'defeat')).toBe(false);
    expect(isFinalCampaignCompletion(CAMPAIGN_LEVELS.length, 'siege-failed')).toBe(false);
  });

  it('letterboxes the landscape master inside the completion panel without cropping', () => {
    const panelWidth = 480;
    const slot = finaleDisplaySize(panelWidth - 24);
    expect(slot.width).toBe(456);
    expect(slot.height).toBe(Math.round((456 * 941) / 1672));
    expect(slot.height).toBeLessThan(panelWidth);
    // Narrow portrait phone: the full width fits and the height stays compact.
    const phone = finaleDisplaySize(390 - 24 - 24);
    expect(phone.width).toBe(342);
    expect(phone.height).toBe(Math.round((342 * 941) / 1672));
    expect(phone.height).toBeLessThanOrEqual(220);
  });

  it('renders above the settlement rows and advances past its own rows', () => {
    const rendered = fakeRender([FINALE_CAMPAIGN_ART.textureKey]);
    const slotWidth = 456;
    const expected = finaleDisplaySize(slotWidth);
    const placed = addFinaleIllustration(rendered.scene, rendered.parent, 240, 0, slotWidth);
    expect(placed).not.toBeNull();
    expect(rendered.added).toHaveLength(1);
    expect(rendered.records[0]).toMatchObject({ x: 240, y: expected.height / 2, display: [expected.width, expected.height], crop: null });
    expect(placed!.bottom).toBe(expected.height);
  });

  it('falls back to the text-only presentation when the texture is absent', () => {
    const cold = fakeRender([]);
    expect(addFinaleIllustration(cold.scene, cold.parent, 240, 0, 456)).toBeNull();
    expect(cold.added).toHaveLength(0);
  });

  it('keeps score settlement, boss identity and replay controls intact', () => {
    expect(getCampaignEnemy('aether_devourer').name).toBe('Aether Devourer');
    expect(CAMPAIGN_ART_MANIFEST.find(asset => asset.id === 'boss:aether_devourer')).toMatchObject({
      key: 'campaign_enemy_aether_devourer', kind: 'sheet', frameWidth: 256, frameHeight: 256,
      path: '/assets/campaign/bosses/aether_devourer-atlas-v2.webp'
    });
    expect(campaignResultActions('victory', CAMPAIGN_LEVELS.length, CAMPAIGN_LEVELS.length, CAMPAIGN_LEVELS.length))
      .toEqual(['restart', 'map']);
    expect(FINALE_CAMPAIGN_ART.path.endsWith('.webp')).toBe(true);
    expect(FINALE_CAMPAIGN_ART.path).not.toContain('atlas');
  });
});
