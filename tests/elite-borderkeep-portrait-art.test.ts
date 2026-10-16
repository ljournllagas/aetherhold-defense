import { describe, expect, it } from 'vitest';
import { STAGE_ASSETS } from '../src/game/art/assetManifest.ts';
import {
  AVAILABLE_CAMPAIGN_ART_PATHS, CAMPAIGN_ART_MANIFEST,
  campaignArtAssetsForLoader, campaignGameplayAssetsForLevel
} from '../src/game/campaign/artManifest.ts';
import { getCampaignLevel, getCampaignWorld } from '../src/game/campaign/config.ts';
import { CAMPAIGN_ENEMIES, getCampaignEnemy } from '../src/game/campaign/enemies.ts';
import {
  addElitePortrait, ELITE_PORTRAIT_CODEX_COMPACT_PX, ELITE_PORTRAIT_CODEX_PX,
  elitePortraitCoverFrame, elitePortraitFor, WORLD_ELITE_PORTRAIT_ART
} from '../src/game/campaign/elitePortraitArt.ts';
import { EVOLUTIONS } from '../src/game/config/evolutions.ts';

const PORTRAIT = WORLD_ELITE_PORTRAIT_ART.borderkeep;
const DELIVERY_URL = new URL('../public/assets/campaign/portraits/elite-borderkeep-v1.webp', import.meta.url);

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

describe('elite borderkeep portrait showcase', () => {
  it('registers elite:borderkeep as a display-only portrait for borderkeep', () => {
    expect(elitePortraitFor('borderkeep')).toBe(PORTRAIT);
    expect(PORTRAIT.eliteId).toBe('elite:borderkeep');
    expect(PORTRAIT.worldId).toBe('borderkeep');
    expect(PORTRAIT.provisionalName).toBe('Briar Captain');
    expect(PORTRAIT.provisional).toBe(true);
    expect(PORTRAIT.textureKey).toBe('campaign_elite_portrait_borderkeep');
    expect(PORTRAIT.path).toBe('/assets/campaign/portraits/elite-borderkeep-v1.webp');
    expect(PORTRAIT.sourceWidth).toBe(1254);
    expect(PORTRAIT.sourceHeight).toBe(1254);
    expect(elitePortraitFor('frostveil')).toBeNull();
    expect(elitePortraitFor('unknown')).toBeNull();
    expect(CAMPAIGN_ART_MANIFEST.find(asset => asset.id === 'elite:borderkeep')).toMatchObject({
      key: PORTRAIT.textureKey, path: PORTRAIT.path, stage: 'campaign',
      state: 'final', kind: 'image', width: 1254, height: 1254
    });
    expect(AVAILABLE_CAMPAIGN_ART_PATHS).toContain(PORTRAIT.path);
  });

  it('loads the portrait lazily with the campaign stage only', () => {
    const campaign = campaignArtAssetsForLoader('campaign');
    expect(campaign).toContainEqual({ kind: 'image', key: PORTRAIT.textureKey, path: PORTRAIT.path });
    expect(AVAILABLE_CAMPAIGN_ART_PATHS).toContain(PORTRAIT.path);
    expect(STAGE_ASSETS.campaign).toContainEqual({ kind: 'image', key: PORTRAIT.textureKey, path: PORTRAIT.path });
    expect(campaignArtAssetsForLoader('menu').some(asset => asset.key === PORTRAIT.textureKey)).toBe(false);
    expect(campaignArtAssetsForLoader('gameplay').some(asset => asset.key === PORTRAIT.textureKey)).toBe(false);
    expect(STAGE_ASSETS.menu.some(asset => asset.key === PORTRAIT.textureKey)).toBe(false);
    expect(STAGE_ASSETS.gameplay.some(asset => asset.key === PORTRAIT.textureKey)).toBe(false);
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
    expect(elitePortraitCoverFrame(1254, 1254, 96, 96, PORTRAIT.focal))
      .toEqual({ sx: 0, sy: 0, sw: 1254, sh: 1254 });
    const wide = elitePortraitCoverFrame(1254, 1254, 160, 90, PORTRAIT.focal);
    expect(wide.sw).toBe(1254);
    expect(wide.sh).toBeLessThan(1254);
    const focalCenterY = PORTRAIT.focal.top + PORTRAIT.focal.height / 2;
    expect(Math.abs(wide.sy + wide.sh / 2 - focalCenterY)).toBeLessThanOrEqual(Math.abs(1254 / 2 - focalCenterY));
    expect(wide.sy).toBeGreaterThanOrEqual(0);
    expect(wide.sy + wide.sh).toBeLessThanOrEqual(1254);
    const narrow = elitePortraitCoverFrame(1254, 1254, 90, 160, PORTRAIT.focal);
    expect(narrow.sh).toBe(1254);
    expect(narrow.sw).toBeLessThan(1254);
    const focalCenterX = PORTRAIT.focal.left + PORTRAIT.focal.width / 2;
    expect(Math.abs(narrow.sx + narrow.sw / 2 - focalCenterX)).toBeLessThanOrEqual(Math.abs(1254 / 2 - focalCenterX));
    expect(narrow.sx).toBeGreaterThanOrEqual(0);
    expect(narrow.sx + narrow.sw).toBeLessThanOrEqual(1254);
  });

  it('renders the square showcase portrait uncropped beside the runtime text', () => {
    const rendered = fakeRender([PORTRAIT.textureKey]);
    const image = addElitePortrait(rendered.scene, rendered.parent, 'borderkeep', 60, 60, 96);
    expect(image).not.toBeNull();
    expect(rendered.added).toHaveLength(1);
    expect(rendered.records[0]).toMatchObject({ x: 60, y: 60, display: [96, 96], crop: null });
  });

  it('falls back to the existing presentation when the texture is absent', () => {
    const cold = fakeRender([]);
    expect(addElitePortrait(cold.scene, cold.parent, 'borderkeep', 60, 60, 96)).toBeNull();
    expect(cold.added).toHaveLength(0);
    const unknown = fakeRender([PORTRAIT.textureKey]);
    expect(addElitePortrait(unknown.scene, unknown.parent, 'frostveil', 60, 60, 96)).toBeNull();
    expect(unknown.added).toHaveLength(0);
  });

  it('creates no enemy, boss, evolution, or animation mechanics', () => {
    for (const id of ['briar_captain', 'elite_borderkeep', 'elite:borderkeep']) {
      expect(CAMPAIGN_ENEMIES[id]).toBeUndefined();
      expect(() => getCampaignEnemy(id)).toThrow();
    }
    expect(Object.keys(EVOLUTIONS).some(branch => branch.includes('briar') || branch.includes('elite'))).toBe(false);
    const manifest = CAMPAIGN_ART_MANIFEST.find(asset => asset.id === 'elite:borderkeep')!;
    expect(manifest.kind).toBe('image');
    expect(manifest.path).not.toContain('atlas');
    expect(manifest.qualityFlags).toEqual(expect.arrayContaining(['showcase_only', 'provisional']));
    for (let level = 1; level <= 10; level++) {
      for (const tier of [1, 2, 3] as const) {
        const bundle = campaignGameplayAssetsForLevel(getCampaignLevel(level)!, tier);
        expect(bundle.some(asset => asset.key === PORTRAIT.textureKey)).toBe(false);
      }
    }
  });

  it('keeps the accessible elite label as runtime text outside the raster', () => {
    expect(typeof PORTRAIT.label).toBe('string');
    expect(PORTRAIT.label).toContain('Briar Captain');
    expect(PORTRAIT.label).toContain('provisional');
    expect(getCampaignWorld('borderkeep').name).toBe('The Borderkeep');
    expect(PORTRAIT.path.endsWith('.webp')).toBe(true);
  });

  it('stays readable at phone showcase sizes', () => {
    expect(ELITE_PORTRAIT_CODEX_PX).toBeGreaterThanOrEqual(96);
    expect(ELITE_PORTRAIT_CODEX_COMPACT_PX).toBeGreaterThanOrEqual(64);
    // A 390px phone sheet leaves the full text wrap width beside the stacked portrait.
    const sheetWidth = 390 - 24;
    expect(sheetWidth - (ELITE_PORTRAIT_CODEX_PX + 24)).toBeGreaterThanOrEqual(96);
  });
});
