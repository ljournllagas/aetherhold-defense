import { describe, expect, it } from 'vitest';
import { STAGE_ASSETS } from '../src/game/art/assetManifest.ts';
import {
  AVAILABLE_CAMPAIGN_ART_PATHS, CAMPAIGN_ART_MANIFEST, CAMPAIGN_UI_ART_POLICY,
  campaignArtAssetsForLoader
} from '../src/game/campaign/artManifest.ts';
import { CAMPAIGN_SIGILS } from '../src/game/campaign/config.ts';
import {
  addSigilTrophy, applySigilTrophyState, SIGIL_TROPHY_ART, SIGIL_TROPHY_CAPTION_COMPACT_PX,
  SIGIL_TROPHY_CAPTION_PX, SIGIL_TROPHY_LOCKED_ALPHA, SIGIL_TROPHY_LOCKED_TINT,
  SIGIL_TROPHY_MASTERY_PX, sigilTrophyFor
} from '../src/game/campaign/sigilArt.ts';

const TROPHY = SIGIL_TROPHY_ART.ember_sigil;
const DELIVERY_URL = new URL('../public/assets/campaign/sigils/emberfall-sigil-v1.webp', import.meta.url);

function fakeRender(present: readonly string[]) {
  const added: unknown[] = [];
  const records: Array<Record<string, unknown>> = [];
  const scene = {
    textures: { exists: (key: string) => present.includes(key) },
    add: {
      image: (x: number, y: number, key: string) => {
        const record: Record<string, unknown> = { x, y, key, display: null, tint: 'unset', alpha: 'unset' };
        records.push(record);
        const view = {
          setDisplaySize: (w: number, h: number) => { record.display = [w, h]; return view; },
          setTint: (tint: number) => { record.tint = tint; return view; },
          clearTint: () => { record.tint = 'cleared'; return view; },
          setAlpha: (alpha: number) => { record.alpha = alpha; return view; }
        };
        return view;
      }
    }
  };
  const parent = { add: (view: unknown) => { added.push(view); } };
  return { records, added, scene: scene as unknown as Phaser.Scene, parent: parent as unknown as Phaser.GameObjects.Container };
}

describe('emberfall world trophy', () => {
  it('registers the emberfall trophy and leaves the other worlds text-only', () => {
    expect(sigilTrophyFor('ember_sigil')).toBe(TROPHY);
    expect(TROPHY.worldId).toBe('emberfall');
    expect(TROPHY.textureKey).toBe('campaign_sigil_emberfall');
    expect(TROPHY.path).toBe('/assets/campaign/sigils/emberfall-sigil-v1.webp');
    expect(sigilTrophyFor('border_sigil')).not.toBeNull();
    for (const sigil of CAMPAIGN_SIGILS) {
      if (sigil.id === 'ember_sigil' || sigil.id === 'border_sigil' || sigil.id === 'frost_sigil' || sigil.id === 'mire_sigil' || sigil.id === 'tide_sigil' || sigil.id === 'iron_sigil' || sigil.id === 'sky_sigil' || sigil.id === 'moon_sigil' || sigil.id === 'rift_sigil') continue;
      expect(sigilTrophyFor(sigil.id)).toBeNull();
    }
  });

  it('loads the trophy lazily with the campaign map UI stage only', () => {
    const campaign = campaignArtAssetsForLoader('campaign');
    expect(campaign).toContainEqual({ kind: 'image', key: TROPHY.textureKey, path: TROPHY.path });
    expect(AVAILABLE_CAMPAIGN_ART_PATHS).toContain(TROPHY.path);
    expect(STAGE_ASSETS.campaign).toContainEqual({ kind: 'image', key: TROPHY.textureKey, path: TROPHY.path });
    expect(campaignArtAssetsForLoader('menu').some(asset => asset.key === TROPHY.textureKey)).toBe(false);
    expect(campaignArtAssetsForLoader('gameplay').some(asset => asset.key === TROPHY.textureKey)).toBe(false);
    expect(CAMPAIGN_ART_MANIFEST.find(asset => asset.id === 'sigil:emberfall')).toMatchObject({
      key: TROPHY.textureKey, path: TROPHY.path, stage: 'campaign', state: 'final', kind: 'image'
    });
  });

  it('ships a valid transparent delivery file at the measured source size', async () => {
    const moduleName = 'node:fs';
    const { readFileSync } = await import(moduleName);
    const image = readFileSync(DELIVERY_URL);
    expect(image.toString('ascii', 0, 4)).toBe('RIFF');
    expect(image.toString('ascii', 8, 12)).toBe('WEBP');
    expect(image.toString('ascii', 12, 16)).toBe('VP8X');
    expect(image[20] & 0x10).toBe(0x10);
    expect(image.readUIntLE(24, 3) + 1).toBe(1254);
    expect(image.readUIntLE(27, 3) + 1).toBe(1254);
    expect(TROPHY.sourceWidth).toBe(1254);
    expect(TROPHY.sourceHeight).toBe(1254);
  });

  it('renders the earned trophy full color and dims the locked one in code', () => {
    const rendered = fakeRender([TROPHY.textureKey]);
    const earned = addSigilTrophy(rendered.scene, rendered.parent, 'ember_sigil', 100, 50, 64, true);
    expect(earned).not.toBeNull();
    expect(rendered.added).toHaveLength(1);
    expect(rendered.records[0]).toMatchObject({ x: 100, y: 50, display: [64, 64], tint: 'cleared', alpha: 1 });

    const locked = fakeRender([TROPHY.textureKey]);
    addSigilTrophy(locked.scene, locked.parent, 'ember_sigil', 100, 50, 64, false);
    expect(locked.records[0]).toMatchObject({ display: [64, 64], tint: SIGIL_TROPHY_LOCKED_TINT, alpha: SIGIL_TROPHY_LOCKED_ALPHA });
    expect(SIGIL_TROPHY_LOCKED_ALPHA).toBeLessThan(1);

    const bare = fakeRender([]);
    const bareEarned = bare.scene.add.image(0, 0, TROPHY.textureKey);
    applySigilTrophyState(bareEarned as unknown as Phaser.GameObjects.Image, true);
    const bareLocked = bare.scene.add.image(0, 0, TROPHY.textureKey);
    applySigilTrophyState(bareLocked as unknown as Phaser.GameObjects.Image, false);
    expect(bare.records.map(record => [record.tint, record.alpha])).toEqual([
      ['cleared', 1],
      [SIGIL_TROPHY_LOCKED_TINT, SIGIL_TROPHY_LOCKED_ALPHA]
    ]);
  });

  it('falls back to the text-only presentation when the texture is absent', () => {
    const cold = fakeRender([]);
    expect(addSigilTrophy(cold.scene, cold.parent, 'ember_sigil', 100, 50, 64, true)).toBeNull();
    expect(cold.added).toHaveLength(0);
    const unknown = fakeRender([TROPHY.textureKey]);
    expect(addSigilTrophy(unknown.scene, unknown.parent, 'frost_sigil', 100, 50, 64, false)).toBeNull();
    expect(unknown.added).toHaveLength(0);
  });

  it('keeps labels as runtime text and leaves the unlock rules untouched', () => {
    expect(CAMPAIGN_SIGILS.find(sigil => sigil.id === 'ember_sigil')).toEqual({
      id: 'ember_sigil',
      level: 20,
      unlocks: ['world_3', 'emberfall_cosmetics', 'cinder_colossus_codex_entry', 'battle_tempo_powerup']
    });
    expect(CAMPAIGN_UI_ART_POLICY.worldSigils).toContain('text labels');
    expect(TROPHY.path.endsWith('.webp')).toBe(true);
  });

  it('stays readable at phone trophy sizes', () => {
    // Solid content fills the full height with side margins, so the medallion
    // keeps its silhouette when downscaled to caption and mastery sizes.
    expect(TROPHY.bounds.width / TROPHY.sourceWidth).toBeGreaterThan(0.75);
    expect(TROPHY.bounds.height / TROPHY.sourceHeight).toBeGreaterThan(0.9);
    expect(SIGIL_TROPHY_MASTERY_PX).toBeGreaterThanOrEqual(64);
    expect(SIGIL_TROPHY_CAPTION_PX).toBeGreaterThanOrEqual(44);
    expect(SIGIL_TROPHY_CAPTION_COMPACT_PX).toBeGreaterThanOrEqual(32);
    // A 390px phone leaves room for the compact trophy beside the caption text.
    const phoneTextWidth = 390 - 32 - 16;
    expect(phoneTextWidth - (SIGIL_TROPHY_CAPTION_COMPACT_PX + 12)).toBeGreaterThanOrEqual(96);
  });
});
