import { describe, expect, it } from 'vitest';
import { STAGE_ASSETS } from '../src/game/art/assetManifest.ts';
import {
  AVAILABLE_CAMPAIGN_ART_PATHS, CAMPAIGN_ART_MANIFEST,
  campaignArtAssetsForLoader, campaignGameplayAssetsForLevel
} from '../src/game/campaign/artManifest.ts';
import { CAMPAIGN_LEVELS, CAMPAIGN_SIGILS, getCampaignLevel, getCampaignWorld } from '../src/game/campaign/config.ts';
import { getCampaignEnemy } from '../src/game/campaign/enemies.ts';
import { campaignResultActions } from '../src/game/ui/campaignResultActions.ts';
import {
  addBorderkeepVictoryIllustration, BORDERKEEP_VICTORY_ART, borderkeepVictoryDisplaySize, isBorderkeepVictoryCompletion
} from '../src/game/campaign/borderkeepVictoryArt.ts';

const DELIVERY_URL = new URL('../public/assets/campaign/victory/borderkeep-victory-v1.webp', import.meta.url);
const BOSS_LEVEL = getCampaignWorld('borderkeep').bossLevel;

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

describe('borderkeep world victory illustration', () => {
  it('registers the borderkeep master as a final gameplay image at its measured size', () => {
    expect(BOSS_LEVEL).toBe(10);
    expect(BORDERKEEP_VICTORY_ART.textureKey).toBe('campaign_victory_borderkeep');
    expect(BORDERKEEP_VICTORY_ART.path).toBe('/assets/campaign/victory/borderkeep-victory-v1.webp');
    expect(BORDERKEEP_VICTORY_ART.sourceWidth).toBe(1672);
    expect(BORDERKEEP_VICTORY_ART.sourceHeight).toBe(941);
    expect(CAMPAIGN_ART_MANIFEST.find(asset => asset.id === 'victory:borderkeep')).toMatchObject({
      key: BORDERKEEP_VICTORY_ART.textureKey, path: BORDERKEEP_VICTORY_ART.path,
      stage: 'gameplay', state: 'final', kind: 'image', width: 1672, height: 941
    });
    expect(AVAILABLE_CAMPAIGN_ART_PATHS).toContain(BORDERKEEP_VICTORY_ART.path);
  });

  it('loads the illustration only with the borderkeep boss level gameplay bundle', () => {
    const bossBundle = campaignGameplayAssetsForLevel(getCampaignLevel(BOSS_LEVEL)!, 1);
    expect(bossBundle).toContainEqual({ kind: 'image', key: BORDERKEEP_VICTORY_ART.textureKey, path: BORDERKEEP_VICTORY_ART.path });
    expect(STAGE_ASSETS.campaign.some(asset => asset.key === BORDERKEEP_VICTORY_ART.textureKey)).toBe(false);
    for (const level of [1, 9, 11, 20, 50, 100]) {
      expect(campaignGameplayAssetsForLevel(getCampaignLevel(level)!, 1).some(asset => asset.key === BORDERKEEP_VICTORY_ART.textureKey)).toBe(false);
    }
    expect(campaignArtAssetsForLoader('menu').some(asset => asset.key === BORDERKEEP_VICTORY_ART.textureKey)).toBe(false);
    expect(campaignArtAssetsForLoader('campaign').some(asset => asset.key === BORDERKEEP_VICTORY_ART.textureKey)).toBe(false);
    expect(STAGE_ASSETS.gameplay.some(asset => asset.key === BORDERKEEP_VICTORY_ART.textureKey)).toBe(false);
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

  it('shows the illustration only at the borderkeep boss victory presentation', () => {
    expect(isBorderkeepVictoryCompletion(BOSS_LEVEL, 'victory')).toBe(true);
    expect(isBorderkeepVictoryCompletion(BOSS_LEVEL - 1, 'victory')).toBe(false);
    expect(isBorderkeepVictoryCompletion(BOSS_LEVEL + 1, 'victory')).toBe(false);
    expect(isBorderkeepVictoryCompletion(1, 'victory')).toBe(false);
    expect(isBorderkeepVictoryCompletion(CAMPAIGN_LEVELS.length, 'victory')).toBe(false);
    expect(isBorderkeepVictoryCompletion(BOSS_LEVEL, 'defeat')).toBe(false);
    expect(isBorderkeepVictoryCompletion(BOSS_LEVEL, 'siege-failed')).toBe(false);
  });

  it('letterboxes the landscape master inside the completion panel without cropping', () => {
    const panelWidth = 480;
    const slot = borderkeepVictoryDisplaySize(panelWidth - 24);
    expect(slot.width).toBe(456);
    expect(slot.height).toBe(Math.round((456 * 941) / 1672));
    expect(slot.height).toBeLessThan(panelWidth);
    // Narrow portrait phone: the full width fits and the height stays compact.
    const phone = borderkeepVictoryDisplaySize(390 - 24 - 24);
    expect(phone.width).toBe(342);
    expect(phone.height).toBe(Math.round((342 * 941) / 1672));
    expect(phone.height).toBeLessThanOrEqual(220);
  });

  it('renders above the settlement rows and advances past its own rows', () => {
    const rendered = fakeRender([BORDERKEEP_VICTORY_ART.textureKey]);
    const slotWidth = 456;
    const expected = borderkeepVictoryDisplaySize(slotWidth);
    const placed = addBorderkeepVictoryIllustration(rendered.scene, rendered.parent, 240, 0, slotWidth);
    expect(placed).not.toBeNull();
    expect(rendered.added).toHaveLength(1);
    expect(rendered.records[0]).toMatchObject({ x: 240, y: expected.height / 2, display: [expected.width, expected.height], crop: null });
    expect(placed!.bottom).toBe(expected.height);
  });

  it('falls back to the text-only presentation when the texture is absent', () => {
    const cold = fakeRender([]);
    expect(addBorderkeepVictoryIllustration(cold.scene, cold.parent, 240, 0, 456)).toBeNull();
    expect(cold.added).toHaveLength(0);
  });

  it('keeps score settlement, boss identity and replay controls intact', () => {
    expect(getCampaignEnemy('hollow_warden').name).toBe('The Hollow Warden');
    expect(getCampaignLevel(BOSS_LEVEL)).toMatchObject({ worldId: 'borderkeep', bossEnemyId: 'hollow_warden' });
    expect(CAMPAIGN_SIGILS.find(sigil => sigil.id === 'border_sigil')).toMatchObject({ id: 'border_sigil', level: BOSS_LEVEL });
    expect(campaignResultActions('victory', BOSS_LEVEL, BOSS_LEVEL + 1, CAMPAIGN_LEVELS.length))
      .toEqual(['next', 'restart', 'map']);
    expect(campaignResultActions('victory', BOSS_LEVEL, BOSS_LEVEL, CAMPAIGN_LEVELS.length))
      .toEqual(['restart', 'map']);
    expect(BORDERKEEP_VICTORY_ART.path.endsWith('.webp')).toBe(true);
    expect(BORDERKEEP_VICTORY_ART.path).not.toContain('atlas');
  });
});
