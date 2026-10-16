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
  addIronrootVictoryIllustration, IRONROOT_VICTORY_ART, ironrootVictoryDisplaySize, isIronrootVictoryCompletion
} from '../src/game/campaign/ironrootVictoryArt.ts';
import { BORDERKEEP_VICTORY_ART } from '../src/game/campaign/borderkeepVictoryArt.ts';
import { EMBERFALL_VICTORY_ART } from '../src/game/campaign/emberfallVictoryArt.ts';
import { FROSTVEIL_VICTORY_ART } from '../src/game/campaign/frostveilVictoryArt.ts';
import { WHISPERFEN_VICTORY_ART } from '../src/game/campaign/whisperfenVictoryArt.ts';
import { SUNKEN_AETHER_VICTORY_ART } from '../src/game/campaign/sunkenAetherVictoryArt.ts';

const DELIVERY_URL = new URL('../public/assets/campaign/victory/ironroot-victory-v1.webp', import.meta.url);
const BOSS_LEVEL = getCampaignWorld('ironroot').bossLevel;

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

describe('ironroot world victory illustration', () => {
  it('registers the ironroot master as a final gameplay image at its measured size', () => {
    expect(BOSS_LEVEL).toBe(60);
    expect(IRONROOT_VICTORY_ART.textureKey).toBe('campaign_victory_ironroot');
    expect(IRONROOT_VICTORY_ART.path).toBe('/assets/campaign/victory/ironroot-victory-v1.webp');
    expect(IRONROOT_VICTORY_ART.sourceWidth).toBe(1672);
    expect(IRONROOT_VICTORY_ART.sourceHeight).toBe(941);
    expect(CAMPAIGN_ART_MANIFEST.find(asset => asset.id === 'victory:ironroot')).toMatchObject({
      key: IRONROOT_VICTORY_ART.textureKey, path: IRONROOT_VICTORY_ART.path,
      stage: 'gameplay', state: 'final', kind: 'image', width: 1672, height: 941
    });
    expect(AVAILABLE_CAMPAIGN_ART_PATHS).toContain(IRONROOT_VICTORY_ART.path);
    expect(AVAILABLE_CAMPAIGN_ART_PATHS).toContain(BORDERKEEP_VICTORY_ART.path);
    expect(AVAILABLE_CAMPAIGN_ART_PATHS).toContain(EMBERFALL_VICTORY_ART.path);
    expect(AVAILABLE_CAMPAIGN_ART_PATHS).toContain(FROSTVEIL_VICTORY_ART.path);
    expect(AVAILABLE_CAMPAIGN_ART_PATHS).toContain(WHISPERFEN_VICTORY_ART.path);
    expect(AVAILABLE_CAMPAIGN_ART_PATHS).toContain(SUNKEN_AETHER_VICTORY_ART.path);
  });

  it('loads the illustration only with the ironroot boss level gameplay bundle', () => {
    const bossBundle = campaignGameplayAssetsForLevel(getCampaignLevel(BOSS_LEVEL)!, 1);
    expect(bossBundle).toContainEqual({ kind: 'image', key: IRONROOT_VICTORY_ART.textureKey, path: IRONROOT_VICTORY_ART.path });
    expect(bossBundle.some(asset => asset.key === BORDERKEEP_VICTORY_ART.textureKey)).toBe(false);
    expect(bossBundle.some(asset => asset.key === EMBERFALL_VICTORY_ART.textureKey)).toBe(false);
    expect(bossBundle.some(asset => asset.key === FROSTVEIL_VICTORY_ART.textureKey)).toBe(false);
    expect(bossBundle.some(asset => asset.key === WHISPERFEN_VICTORY_ART.textureKey)).toBe(false);
    expect(bossBundle.some(asset => asset.key === SUNKEN_AETHER_VICTORY_ART.textureKey)).toBe(false);
    expect(STAGE_ASSETS.campaign.some(asset => asset.key === IRONROOT_VICTORY_ART.textureKey)).toBe(false);
    for (const level of [1, 10, 20, 30, 40, 50, 59, 61, 100]) {
      expect(campaignGameplayAssetsForLevel(getCampaignLevel(level)!, 1).some(asset => asset.key === IRONROOT_VICTORY_ART.textureKey)).toBe(false);
    }
    expect(campaignArtAssetsForLoader('menu').some(asset => asset.key === IRONROOT_VICTORY_ART.textureKey)).toBe(false);
    expect(campaignArtAssetsForLoader('campaign').some(asset => asset.key === IRONROOT_VICTORY_ART.textureKey)).toBe(false);
    expect(STAGE_ASSETS.gameplay.some(asset => asset.key === IRONROOT_VICTORY_ART.textureKey)).toBe(false);
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

  it('shows the illustration only at the ironroot boss victory presentation', () => {
    expect(isIronrootVictoryCompletion(BOSS_LEVEL, 'victory')).toBe(true);
    expect(isIronrootVictoryCompletion(BOSS_LEVEL - 1, 'victory')).toBe(false);
    expect(isIronrootVictoryCompletion(BOSS_LEVEL + 1, 'victory')).toBe(false);
    expect(isIronrootVictoryCompletion(1, 'victory')).toBe(false);
    expect(isIronrootVictoryCompletion(10, 'victory')).toBe(false);
    expect(isIronrootVictoryCompletion(20, 'victory')).toBe(false);
    expect(isIronrootVictoryCompletion(30, 'victory')).toBe(false);
    expect(isIronrootVictoryCompletion(40, 'victory')).toBe(false);
    expect(isIronrootVictoryCompletion(50, 'victory')).toBe(false);
    expect(isIronrootVictoryCompletion(CAMPAIGN_LEVELS.length, 'victory')).toBe(false);
    expect(isIronrootVictoryCompletion(BOSS_LEVEL, 'defeat')).toBe(false);
    expect(isIronrootVictoryCompletion(BOSS_LEVEL, 'siege-failed')).toBe(false);
  });

  it('letterboxes the landscape master inside the completion panel without cropping', () => {
    const panelWidth = 480;
    const slot = ironrootVictoryDisplaySize(panelWidth - 24);
    expect(slot.width).toBe(456);
    expect(slot.height).toBe(Math.round((456 * 941) / 1672));
    expect(slot.height).toBeLessThan(panelWidth);
    // Narrow portrait phone: the full width fits and the height stays compact.
    const phone = ironrootVictoryDisplaySize(390 - 24 - 24);
    expect(phone.width).toBe(342);
    expect(phone.height).toBe(Math.round((342 * 941) / 1672));
    expect(phone.height).toBeLessThanOrEqual(220);
  });

  it('renders above the settlement rows and advances past its own rows', () => {
    const rendered = fakeRender([IRONROOT_VICTORY_ART.textureKey]);
    const slotWidth = 456;
    const expected = ironrootVictoryDisplaySize(slotWidth);
    const placed = addIronrootVictoryIllustration(rendered.scene, rendered.parent, 240, 0, slotWidth);
    expect(placed).not.toBeNull();
    expect(rendered.added).toHaveLength(1);
    expect(rendered.records[0]).toMatchObject({ x: 240, y: expected.height / 2, display: [expected.width, expected.height], crop: null });
    expect(placed!.bottom).toBe(expected.height);
  });

  it('falls back to the text-only presentation when the texture is absent', () => {
    const cold = fakeRender([]);
    expect(addIronrootVictoryIllustration(cold.scene, cold.parent, 240, 0, 456)).toBeNull();
    expect(cold.added).toHaveLength(0);
  });

  it('keeps score settlement, boss identity and replay controls intact', () => {
    expect(getCampaignEnemy('iron_tyrant').name).toBe('Iron Tyrant');
    expect(getCampaignLevel(BOSS_LEVEL)).toMatchObject({ worldId: 'ironroot', bossEnemyId: 'iron_tyrant' });
    expect(CAMPAIGN_SIGILS.find(sigil => sigil.id === 'iron_sigil')).toMatchObject({ id: 'iron_sigil', level: BOSS_LEVEL });
    expect(campaignResultActions('victory', BOSS_LEVEL, BOSS_LEVEL + 1, CAMPAIGN_LEVELS.length))
      .toEqual(['next', 'restart', 'map']);
    expect(campaignResultActions('victory', BOSS_LEVEL, BOSS_LEVEL, CAMPAIGN_LEVELS.length))
      .toEqual(['restart', 'map']);
    expect(IRONROOT_VICTORY_ART.path.endsWith('.webp')).toBe(true);
    expect(IRONROOT_VICTORY_ART.path).not.toContain('atlas');
  });
});
