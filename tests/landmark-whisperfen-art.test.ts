import { describe, expect, it } from 'vitest';
import { STAGE_ASSETS } from '../src/game/art/assetManifest.ts';
import {
  AVAILABLE_CAMPAIGN_ART_PATHS, CAMPAIGN_ART_MANIFEST,
  campaignArtAssetsForLoader, campaignGameplayAssetsForLevel
} from '../src/game/campaign/artManifest.ts';
import { getCampaignLevel, getCampaignWorld } from '../src/game/campaign/config.ts';
import {
  addLandmarkDecoration, LANDMARK_DISPLAY_COMPACT_PX, LANDMARK_DISPLAY_PX,
  landmarkDisplaySize, landmarkFor, WORLD_LANDMARK_ART
} from '../src/game/campaign/landmarkArt.ts';

const LANDMARK = WORLD_LANDMARK_ART.whisperfen;
const DELIVERY_URL = new URL('../public/assets/world/landmarks/landmark-whisperfen-v1.webp', import.meta.url);

function fakeRender(present: readonly string[]) {
  const added: unknown[] = [];
  const records: Array<Record<string, unknown>> = [];
  const scene = {
    textures: { exists: (key: string) => present.includes(key) },
    add: {
      image: (x: number, y: number, key: string) => {
        const record: Record<string, unknown> = { x, y, key, display: null, interactive: false };
        records.push(record);
        const view = {
          setDisplaySize: (w: number, h: number) => { record.display = [w, h]; return view; },
          setInteractive: () => { record.interactive = true; return view; }
        };
        return view;
      }
    }
  };
  const parent = { add: (view: unknown) => { added.push(view); } };
  return { records, added, scene: scene as unknown as Phaser.Scene, parent: parent as unknown as Phaser.GameObjects.Container };
}

describe('whisperfen world landmark decoration', () => {
  it('maps landmark:whisperfen to the whisperfen world only', () => {
    expect(landmarkFor('whisperfen')).toBe(LANDMARK);
    expect(LANDMARK.landmarkId).toBe('landmark:whisperfen');
    expect(LANDMARK.worldId).toBe('whisperfen');
    expect(LANDMARK.textureKey).toBe('campaign_landmark_whisperfen');
    expect(LANDMARK.path).toBe('/assets/world/landmarks/landmark-whisperfen-v1.webp');
    expect(LANDMARK.sourceWidth).toBe(1254);
    expect(LANDMARK.sourceHeight).toBe(1254);
    expect(landmarkFor('ironroot')).toBeNull();
    expect(landmarkFor('unknown')).toBeNull();
    expect(CAMPAIGN_ART_MANIFEST.find(asset => asset.id === 'landmark:whisperfen')).toMatchObject({
      key: LANDMARK.textureKey, path: LANDMARK.path,
      stage: 'campaign', state: 'final', kind: 'image', width: 1254, height: 1254
    });
    expect(AVAILABLE_CAMPAIGN_ART_PATHS).toContain(LANDMARK.path);
  });

  it('ships a valid transparent delivery file at the measured source size', async () => {
    const moduleName = 'node:fs';
    const { readFileSync, statSync } = await import(moduleName);
    expect(statSync(DELIVERY_URL).size).toBeGreaterThan(0);
    const image = readFileSync(DELIVERY_URL);
    expect(image.toString('ascii', 0, 4)).toBe('RIFF');
    expect(image.toString('ascii', 8, 12)).toBe('WEBP');
    expect(image.toString('ascii', 12, 16)).toBe('VP8X');
    expect(image[20] & 0x10).toBe(0x10);
    expect(image.readUIntLE(24, 3) + 1).toBe(1254);
    expect(image.readUIntLE(27, 3) + 1).toBe(1254);
  });

  it('keeps the measured alpha bounds with transparent padding on every side', () => {
    // Measured from the lossless master at alpha >= 16 with a sharp raw parse.
    expect(LANDMARK.bounds).toEqual({ left: 91, top: 20, width: 1070, height: 1181, bottom: 1200 });
    const { left, top, width, height, bottom } = LANDMARK.bounds;
    expect(left).toBeGreaterThanOrEqual(0);
    expect(top).toBeGreaterThanOrEqual(0);
    expect(left + width).toBeLessThanOrEqual(LANDMARK.sourceWidth);
    expect(top + height).toBeLessThanOrEqual(LANDMARK.sourceHeight);
    expect(bottom).toBe(top + height - 1);
    // Transparent padding preserved on all four sides.
    expect(left).toBeGreaterThan(0);
    expect(top).toBeGreaterThan(0);
    expect(LANDMARK.sourceWidth - (left + width)).toBeGreaterThan(0);
    expect(LANDMARK.sourceHeight - (top + height)).toBeGreaterThan(0);
    // Drowned-shrine content: wide lily water base, tall stilted chapel, contained.
    expect(width / LANDMARK.sourceWidth).toBeGreaterThan(0.8);
    expect(height / LANDMARK.sourceHeight).toBeGreaterThan(0.9);
  });

  it('lazy-loads with the campaign stage only and never with gameplay', () => {
    const campaign = campaignArtAssetsForLoader('campaign');
    expect(campaign).toContainEqual({ kind: 'image', key: LANDMARK.textureKey, path: LANDMARK.path });
    expect(STAGE_ASSETS.campaign).toContainEqual({ kind: 'image', key: LANDMARK.textureKey, path: LANDMARK.path });
    expect(campaignArtAssetsForLoader('menu').some(asset => asset.key === LANDMARK.textureKey)).toBe(false);
    expect(campaignArtAssetsForLoader('gameplay').some(asset => asset.key === LANDMARK.textureKey)).toBe(false);
    expect(STAGE_ASSETS.menu.some(asset => asset.key === LANDMARK.textureKey)).toBe(false);
    expect(STAGE_ASSETS.gameplay.some(asset => asset.key === LANDMARK.textureKey)).toBe(false);
  });

  it('leaves every runtime gameplay bundle and route untouched', () => {
    for (let level = 1; level <= 10; level++) {
      for (const tier of [1, 2, 3] as const) {
        const bundle = campaignGameplayAssetsForLevel(getCampaignLevel(level)!, tier);
        expect(bundle.some(asset => asset.key === LANDMARK.textureKey)).toBe(false);
      }
    }
    expect(CAMPAIGN_ART_MANIFEST.find(asset => asset.id === 'landmark:whisperfen')!.qualityFlags)
      .toEqual(expect.arrayContaining(['cosmetic_only', 'non_obstructive']));
    // Render is display-only: a plain image with no input wiring.
    const rendered = fakeRender([LANDMARK.textureKey]);
    const placed = addLandmarkDecoration(rendered.scene, rendered.parent, 'whisperfen', 100, 50, 96);
    expect(placed).not.toBeNull();
    expect(rendered.added).toHaveLength(1);
    expect(rendered.records[0]).toMatchObject({ x: 100, y: 50, display: [96, 96], interactive: false });
  });

  it('falls back to the existing presentation when the texture is absent', () => {
    const cold = fakeRender([]);
    expect(addLandmarkDecoration(cold.scene, cold.parent, 'whisperfen', 100, 50, 96)).toBeNull();
    expect(cold.added).toHaveLength(0);
    const unknown = fakeRender([LANDMARK.textureKey]);
    expect(addLandmarkDecoration(unknown.scene, unknown.parent, 'sunken_aether', 100, 50, 96)).toBeNull();
    expect(unknown.added).toHaveLength(0);
  });

  it('keeps the accessible world label as runtime text outside the raster', () => {
    expect(getCampaignWorld('whisperfen').name).toBe('Whisperfen');
    expect(typeof getCampaignWorld('whisperfen').name).toBe('string');
    expect(LANDMARK.path.endsWith('.webp')).toBe(true);
  });

  it('stays legible beside labels on desktop and phone widths', () => {
    expect(LANDMARK_DISPLAY_PX).toBeGreaterThanOrEqual(96);
    expect(LANDMARK_DISPLAY_COMPACT_PX).toBeGreaterThanOrEqual(48);
    const desktop = landmarkDisplaySize(480 - 24);
    expect(desktop).toEqual({ width: 456, height: 456 });
    const phone = landmarkDisplaySize(LANDMARK_DISPLAY_COMPACT_PX);
    expect(phone).toEqual({ width: 64, height: 64 });
    // A 390px phone leaves room for the compact decoration beside the world label.
    expect(390 - 32 - (LANDMARK_DISPLAY_COMPACT_PX + 12)).toBeGreaterThanOrEqual(96);
  });
});
