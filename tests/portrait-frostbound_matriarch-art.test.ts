import { describe, expect, it } from 'vitest';
import { STAGE_ASSETS } from '../src/game/art/assetManifest.ts';
import {
  AVAILABLE_CAMPAIGN_ART_PATHS, CAMPAIGN_ART_MANIFEST,
  campaignArtAssetsForLoader
} from '../src/game/campaign/artManifest.ts';
import { CAMPAIGN_SIGILS, CAMPAIGN_WORLDS } from '../src/game/campaign/config.ts';
import { getCampaignEnemy } from '../src/game/campaign/enemies.ts';
import {
  addBossPortrait, BOSS_PORTRAIT_CODEX_COMPACT_PX, BOSS_PORTRAIT_CODEX_PX,
  bossPortraitCoverFrame, bossPortraitFor, BOSS_PORTRAIT_ART
} from '../src/game/campaign/bossPortraitArt.ts';

const PORTRAIT = BOSS_PORTRAIT_ART.frostbound_matriarch;
const DELIVERY_URL = new URL('../public/assets/campaign/portraits/frostbound_matriarch-portrait-v1.webp', import.meta.url);

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

describe('frostbound matriarch boss portrait', () => {
  it('registers the frostbound matriarch portrait and leaves the other bosses text-only', () => {
    expect(bossPortraitFor('frostbound_matriarch')).toBe(PORTRAIT);
    expect(PORTRAIT.textureKey).toBe('campaign_portrait_frostbound_matriarch');
    expect(PORTRAIT.path).toBe('/assets/campaign/portraits/frostbound_matriarch-portrait-v1.webp');
    for (const world of CAMPAIGN_WORLDS) {
      if (world.bossEnemyId === 'frostbound_matriarch' || world.bossEnemyId === 'hollow_warden' || world.bossEnemyId === 'cinder_colossus' || world.bossEnemyId === 'mireheart_hydra') continue;
      expect(bossPortraitFor(world.bossEnemyId)).toBeNull();
    }
  });

  it('loads the portrait lazily with the campaign codex stage only', () => {
    const campaign = campaignArtAssetsForLoader('campaign');
    expect(campaign).toContainEqual({ kind: 'image', key: PORTRAIT.textureKey, path: PORTRAIT.path });
    expect(AVAILABLE_CAMPAIGN_ART_PATHS).toContain(PORTRAIT.path);
    expect(STAGE_ASSETS.campaign).toContainEqual({ kind: 'image', key: PORTRAIT.textureKey, path: PORTRAIT.path });
    expect(campaignArtAssetsForLoader('menu').some(asset => asset.key === PORTRAIT.textureKey)).toBe(false);
    expect(campaignArtAssetsForLoader('gameplay').some(asset => asset.key === PORTRAIT.textureKey)).toBe(false);
    expect(CAMPAIGN_ART_MANIFEST.find(asset => asset.id === 'portrait:frostbound_matriarch')).toMatchObject({
      key: PORTRAIT.textureKey, path: PORTRAIT.path, stage: 'campaign', state: 'final', kind: 'image'
    });
  });

  it('ships a valid opaque delivery file at the measured source size', async () => {
    const moduleName = 'node:fs';
    const { readFileSync } = await import(moduleName);
    const image = readFileSync(DELIVERY_URL);
    expect(image.toString('ascii', 0, 4)).toBe('RIFF');
    expect(image.toString('ascii', 8, 12)).toBe('WEBP');
    expect(image.toString('ascii', 12, 16)).toBe('VP8 ');
    expect(image.toString('hex', 23, 26)).toBe('9d012a');
    expect(image.readUInt16LE(26) & 0x3fff).toBe(1254);
    expect(image.readUInt16LE(28) & 0x3fff).toBe(1254);
    expect(PORTRAIT.sourceWidth).toBe(1254);
    expect(PORTRAIT.sourceHeight).toBe(1254);
  });

  it('cover-crops around the face instead of the geometric center', () => {
    expect(bossPortraitCoverFrame(1254, 1254, 96, 96, PORTRAIT.focal))
      .toEqual({ sx: 0, sy: 0, sw: 1254, sh: 1254 });
    const wide = bossPortraitCoverFrame(1254, 1254, 160, 90, PORTRAIT.focal);
    expect(wide.sw).toBe(1254);
    expect(wide.sh).toBeLessThan(1254);
    const focalCenterY = PORTRAIT.focal.top + PORTRAIT.focal.height / 2;
    expect(Math.abs(wide.sy + wide.sh / 2 - focalCenterY)).toBeLessThanOrEqual(Math.abs(1254 / 2 - focalCenterY));
    expect(wide.sy).toBeGreaterThanOrEqual(0);
    expect(wide.sy + wide.sh).toBeLessThanOrEqual(1254);
    const narrow = bossPortraitCoverFrame(1254, 1254, 90, 160, PORTRAIT.focal);
    expect(narrow.sh).toBe(1254);
    expect(narrow.sw).toBeLessThan(1254);
    const focalCenterX = PORTRAIT.focal.left + PORTRAIT.focal.width / 2;
    expect(Math.abs(narrow.sx + narrow.sw / 2 - focalCenterX)).toBeLessThanOrEqual(Math.abs(1254 / 2 - focalCenterX));
    expect(narrow.sx).toBeGreaterThanOrEqual(0);
    expect(narrow.sx + narrow.sw).toBeLessThanOrEqual(1254);
  });

  it('renders the square codex portrait uncropped beside the runtime text', () => {
    const rendered = fakeRender([PORTRAIT.textureKey]);
    const image = addBossPortrait(rendered.scene, rendered.parent, 'frostbound_matriarch', 60, 60, 96);
    expect(image).not.toBeNull();
    expect(rendered.added).toHaveLength(1);
    expect(rendered.records[0]).toMatchObject({ x: 60, y: 60, display: [96, 96], crop: null });
  });

  it('falls back to the text-only presentation when the texture is absent', () => {
    const cold = fakeRender([]);
    expect(addBossPortrait(cold.scene, cold.parent, 'frostbound_matriarch', 60, 60, 96)).toBeNull();
    expect(cold.added).toHaveLength(0);
    const unknown = fakeRender([PORTRAIT.textureKey]);
    expect(addBossPortrait(unknown.scene, unknown.parent, 'drowned_oracle', 60, 60, 96)).toBeNull();
    expect(unknown.added).toHaveLength(0);
  });

  it('keeps the boss name as runtime text and leaves combat art untouched', () => {
    expect(getCampaignEnemy('frostbound_matriarch').name).toBe('Frostbound Matriarch');
    expect(CAMPAIGN_SIGILS.find(sigil => sigil.id === 'frost_sigil')!.unlocks).toContain('frostbound_matriarch_codex_entry');
    expect(CAMPAIGN_ART_MANIFEST.find(asset => asset.id === 'boss:frostbound_matriarch')).toMatchObject({
      key: 'campaign_enemy_frostbound_matriarch', kind: 'sheet', frameWidth: 256, frameHeight: 256,
      path: '/assets/campaign/bosses/frostbound_matriarch-atlas-v1.webp'
    });
    expect(PORTRAIT.path.endsWith('.webp')).toBe(true);
    expect(PORTRAIT.path).not.toContain('atlas');
  });

  it('stays readable at phone codex sizes', () => {
    expect(BOSS_PORTRAIT_CODEX_PX).toBeGreaterThanOrEqual(96);
    expect(BOSS_PORTRAIT_CODEX_COMPACT_PX).toBeGreaterThanOrEqual(64);
    // A 390px phone sheet leaves the full text wrap width beside the stacked portrait.
    const sheetWidth = 390 - 24;
    expect(sheetWidth - (BOSS_PORTRAIT_CODEX_PX + 24)).toBeGreaterThanOrEqual(96);
  });
});
