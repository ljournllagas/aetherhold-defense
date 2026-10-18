import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => ({ default: { Scene: class { constructor(_key?: string) {} } } }));
vi.mock('../src/game/ui/components.ts', () => ({
  button: vi.fn(),
  panel: vi.fn(() => ({ setFillStyle: () => ({}) }))
}));
vi.mock('../src/game/art/campaignArt.ts', () => ({ drawCampaignEnemyBadge: vi.fn(), paintCampaignWorldMap: vi.fn() }));
vi.mock('../src/game/ui/ViewportMask.ts', () => ({
  ViewportMaskController: class { constructor() {} destroy() {} },
  handleViewportPointerUp: vi.fn()
}));

import { CampaignScene } from '../src/game/scenes/CampaignScene.ts';
import { CampaignRepository } from '../src/game/campaign/progress.ts';
import { CAMPAIGN_SIGILS } from '../src/game/campaign/config.ts';
import type { CampaignFeatureId } from '../src/game/campaign/types.ts';
import {
  LANDMARK_CAPTION_COMPACT_PX, LANDMARK_CAPTION_PX, LANDMARK_COSMETIC_FEATURE,
  landmarkCaptionReserve, landmarkCosmeticUnlocked, WORLD_LANDMARK_ART
} from '../src/game/campaign/landmarkArt.ts';

const images = vi.hoisted(() => [] as Array<{ x: number; y: number; key: string }>);

function graphicsStub(): any {
  const g: any = {};
  for (const method of ['lineStyle', 'lineBetween', 'strokeRect', 'strokeCircle', 'fillStyle', 'fillRect',
    'beginPath', 'moveTo', 'lineTo', 'strokePath', 'fillCircle', 'fillTriangle']) g[method] = () => g;
  return g;
}

function sceneAdd(): any {
  return {
    text: vi.fn((x: number, y: number, value: string) => {
      const t: any = {
        x, y, text: value, height: 14, width: Math.max(40, value.length * 6),
        setWordWrapWidth() { return t; }, setOrigin() { return t; }, setY() { return t; },
        setVisible() { return t; }, setFontSize() { return t; }
      };
      return t;
    }),
    image: vi.fn((x: number, y: number, key: string) => {
      images.push({ x, y, key });
      const i: any = { setOrigin() { return i; }, setDisplaySize() { return i; }, setAlpha() { return i; } };
      return i;
    }),
    graphics: vi.fn(graphicsStub),
    container: vi.fn(() => {
      const c: any = { add: vi.fn(), setPosition() { return c; }, setScale() { return c; } };
      return c;
    }),
    rectangle: vi.fn(() => {
      const r: any = { setOrigin() { return r; }, setInteractive() { return r; }, on() { return r; }, setStrokeStyle() { return r; } };
      return r;
    })
  };
}

function mapScene(unlockedFeatures: string[]): any {
  const view = new CampaignRepository(null).view();
  view.profile.unlockedFeatures = unlockedFeatures as CampaignFeatureId[];
  const scene: any = new CampaignScene();
  scene.campaignView = view;
  scene.selectedLevel = 1;
  scene.mapScroll = null;
  scene.add = sceneAdd();
  scene.textures = { exists: (key: string) => key.startsWith('campaign_landmark_') };
  return scene;
}

beforeEach(() => { images.length = 0; });

describe('biome-cosmetic landmark gate', () => {
  it('earns the Emberfall and Frostveil landmarks with their Sigils', () => {
    expect(landmarkCosmeticUnlocked('emberfall', [])).toBe(false);
    expect(landmarkCosmeticUnlocked('emberfall', ['emberfall_cosmetics'])).toBe(true);
    expect(landmarkCosmeticUnlocked('frostveil', ['emberfall_cosmetics'])).toBe(false);
    expect(landmarkCosmeticUnlocked('frostveil', ['frostveil_cosmetics'])).toBe(true);
  });

  it('keeps landmark decoration free for worlds with no advertised cosmetic', () => {
    expect(landmarkCosmeticUnlocked('borderkeep', [])).toBe(true);
    expect(landmarkCosmeticUnlocked('aether_crown', [])).toBe(true);
    expect(landmarkCosmeticUnlocked('unknown', [])).toBe(true);
  });

  it('binds each gate key to a real Sigil reward', () => {
    for (const [worldId, feature] of Object.entries(LANDMARK_COSMETIC_FEATURE)) {
      expect(WORLD_LANDMARK_ART[worldId], worldId).toBeDefined();
      expect(CAMPAIGN_SIGILS.some(sigil => sigil.unlocks.includes(feature as CampaignFeatureId)), feature).toBe(true);
    }
  });

  it('reserves caption space only when the label stays legible', () => {
    expect(landmarkCaptionReserve(false, 584, 0, false)).toBe(0);
    expect(landmarkCaptionReserve(false, 584, 0, true)).toBe(LANDMARK_CAPTION_PX + 12);
    expect(landmarkCaptionReserve(true, 342, 48, true)).toBe(LANDMARK_CAPTION_COMPACT_PX + 12);
    // Too narrow for the label plus the landmark: keep the label alone.
    expect(landmarkCaptionReserve(false, 140, 0, true)).toBe(0);
    expect(landmarkCaptionReserve(false, 240, 120, true)).toBe(0);
  });
});

describe('campaign map biome-cosmetic landmarks', () => {
  it('keeps free-world decoration and withholds earned landmarks before the Sigil', () => {
    const scene = mapScene([]);
    scene.drawMap({ add: vi.fn() }, 1800, 0, 328, 'borderkeep');
    const keys = images.map(image => image.key);
    expect(keys).toContain('campaign_landmark_borderkeep');

    images.length = 0;
    scene.drawMap({ add: vi.fn() }, 1800, 0, 328, 'emberfall');
    expect(images.map(image => image.key)).not.toContain('campaign_landmark_emberfall');
  });

  it('reveals each foundation landmark once its Sigil cosmetic is unlocked', () => {
    const emberOnly = mapScene(['emberfall_cosmetics']);
    emberOnly.drawMap({ add: vi.fn() }, 1800, 0, 328, 'emberfall');
    expect(images.map(image => image.key)).toContain('campaign_landmark_emberfall');

    images.length = 0;
    emberOnly.drawMap({ add: vi.fn() }, 1800, 0, 328, 'frostveil');
    expect(images.map(image => image.key)).not.toContain('campaign_landmark_frostveil');

    images.length = 0;
    const both = mapScene(['emberfall_cosmetics', 'frostveil_cosmetics']);
    both.drawMap({ add: vi.fn() }, 1800, 0, 328, 'frostveil');
    const keys = images.map(image => image.key);
    expect(keys).toContain('campaign_landmark_frostveil');
    expect(keys.filter(key => key === 'campaign_landmark_frostveil')).toHaveLength(1);
  });
});
