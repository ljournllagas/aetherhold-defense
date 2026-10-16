import type Phaser from 'phaser';

import { bossPortraitCoverFrame } from './bossPortraitArt.ts';

/** Measured delivery bundle for one provisional elite showcase portrait. */
export interface ElitePortraitArt {
  readonly eliteId: string;
  readonly worldId: string;
  /** Provisional lieutenant concept name; not an enemy, boss, or evolution ID. */
  readonly provisionalName: string;
  readonly textureKey: string;
  readonly path: string;
  readonly sourceWidth: number;
  readonly sourceHeight: number;
  /**
   * Face/upper-torso focal box in source pixels. Square masters display
   * uncropped; non-square slots cover-crop around this box instead of the
   * geometric center so the head stays in frame on narrow layouts.
   */
  readonly focal: {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
  };
  /** Always true: elite names are provisional concepts, never combat IDs. */
  readonly provisional: true;
  /** Accessible runtime label rendered as text outside the raster. */
  readonly label: string;
}

/**
 * Reusable registry: one entry per integrated elite portrait. Worlds without
 * an entry keep the current presentation, so later elites only add a manifest
 * line, a delivery file and one row here. Entries are display-only: they
 * create no enemy, boss, evolution, or animation definitions.
 */
export const WORLD_ELITE_PORTRAIT_ART: Readonly<Record<string, ElitePortraitArt>> = {
  borderkeep: {
    eliteId: 'elite:borderkeep',
    worldId: 'borderkeep',
    provisionalName: 'Briar Captain',
    textureKey: 'campaign_elite_portrait_borderkeep',
    path: '/assets/campaign/portraits/elite-borderkeep-v1.webp',
    sourceWidth: 1254,
    sourceHeight: 1254,
    focal: { left: 430, top: 220, width: 420, height: 420 },
    provisional: true,
    label: 'Briar Captain (provisional elite concept)'
  },
  emberfall: {
    eliteId: 'elite:emberfall',
    worldId: 'emberfall',
    provisionalName: 'Ashen Headsman',
    textureKey: 'campaign_elite_portrait_emberfall',
    path: '/assets/campaign/portraits/elite-emberfall-v1.webp',
    sourceWidth: 1254,
    sourceHeight: 1254,
    focal: { left: 440, top: 140, width: 420, height: 420 },
    provisional: true,
    label: 'Ashen Headsman (provisional elite concept)'
  },
  frostveil: {
    eliteId: 'elite:frostveil',
    worldId: 'frostveil',
    provisionalName: 'Rime Standard-Bearer',
    textureKey: 'campaign_elite_portrait_frostveil',
    path: '/assets/campaign/portraits/elite-frostveil-v1.webp',
    sourceWidth: 1254,
    sourceHeight: 1254,
    focal: { left: 420, top: 180, width: 420, height: 420 },
    provisional: true,
    label: 'Rime Standard-Bearer (provisional elite concept)'
  },
  whisperfen: {
    eliteId: 'elite:whisperfen',
    worldId: 'whisperfen',
    provisionalName: 'Mire Bellkeeper',
    textureKey: 'campaign_elite_portrait_whisperfen',
    path: '/assets/campaign/portraits/elite-whisperfen-v1.webp',
    sourceWidth: 1254,
    sourceHeight: 1254,
    focal: { left: 430, top: 160, width: 420, height: 420 },
    provisional: true,
    label: 'Mire Bellkeeper (provisional elite concept)'
  },
  sunken_aether: {
    eliteId: 'elite:sunken_aether',
    worldId: 'sunken_aether',
    provisionalName: 'Pearlbound Custodian',
    textureKey: 'campaign_elite_portrait_sunken_aether',
    path: '/assets/campaign/portraits/elite-sunken_aether-v1.webp',
    sourceWidth: 1254,
    sourceHeight: 1254,
    focal: { left: 420, top: 140, width: 420, height: 420 },
    provisional: true,
    label: 'Pearlbound Custodian (provisional elite concept)'
  },
  ironroot: {
    eliteId: 'elite:ironroot',
    worldId: 'ironroot',
    provisionalName: 'Chain Marshal',
    textureKey: 'campaign_elite_portrait_ironroot',
    path: '/assets/campaign/portraits/elite-ironroot-v1.webp',
    sourceWidth: 1254,
    sourceHeight: 1254,
    focal: { left: 420, top: 120, width: 420, height: 420 },
    provisional: true,
    label: 'Chain Marshal (provisional elite concept)'
  },
  sky_isles: {
    eliteId: 'elite:sky_isles',
    worldId: 'sky_isles',
    provisionalName: 'Gale Castellan',
    textureKey: 'campaign_elite_portrait_sky_isles',
    path: '/assets/campaign/portraits/elite-sky_isles-v1.webp',
    sourceWidth: 1254,
    sourceHeight: 1254,
    focal: { left: 420, top: 130, width: 420, height: 420 },
    provisional: true,
    label: 'Gale Castellan (provisional elite concept)'
  },
  dreadmoon: {
    eliteId: 'elite:dreadmoon',
    worldId: 'dreadmoon',
    provisionalName: 'Eclipse Mourner',
    textureKey: 'campaign_elite_portrait_dreadmoon',
    path: '/assets/campaign/portraits/elite-dreadmoon-v1.webp',
    sourceWidth: 1254,
    sourceHeight: 1254,
    focal: { left: 440, top: 130, width: 420, height: 420 },
    provisional: true,
    label: 'Eclipse Mourner (provisional elite concept)'
  },
  astral_rift: {
    eliteId: 'elite:astral_rift',
    worldId: 'astral_rift',
    provisionalName: 'Ringbound Harbinger',
    textureKey: 'campaign_elite_portrait_astral_rift',
    path: '/assets/campaign/portraits/elite-astral_rift-v1.webp',
    sourceWidth: 1254,
    sourceHeight: 1254,
    focal: { left: 440, top: 150, width: 420, height: 420 },
    provisional: true,
    label: 'Ringbound Harbinger (provisional elite concept)'
  },
  aether_crown: {
    eliteId: 'elite:aether_crown',
    worldId: 'aether_crown',
    provisionalName: 'Crownless Justiciar',
    textureKey: 'campaign_elite_portrait_aether_crown',
    path: '/assets/campaign/portraits/elite-aether_crown-v1.webp',
    sourceWidth: 1254,
    sourceHeight: 1254,
    focal: { left: 430, top: 145, width: 420, height: 420 },
    provisional: true,
    label: 'Crownless Justiciar (provisional elite concept)'
  }
};

export function elitePortraitFor(worldId: string): ElitePortraitArt | null {
  return WORLD_ELITE_PORTRAIT_ART[worldId] ?? null;
}

/** Cover-crop helper shared with boss portraits so focal behavior matches. */
export const elitePortraitCoverFrame = bossPortraitCoverFrame;

/** Square showcase size keeps the elite name and guidance legible on phones. */
export const ELITE_PORTRAIT_CODEX_PX = 96;
export const ELITE_PORTRAIT_CODEX_COMPACT_PX = 72;

/**
 * Portrait image beside the unchanged runtime world name and guidance text.
 * Returns null when the portrait is unregistered or its texture is absent so
 * callers keep the existing presentation.
 */
export function addElitePortrait(
  scene: Phaser.Scene,
  parent: Phaser.GameObjects.Container,
  worldId: string,
  x: number,
  y: number,
  size: number,
  aspectWidth = 1,
  aspectHeight = 1
): Phaser.GameObjects.Image | null {
  const portrait = elitePortraitFor(worldId);
  if (!portrait || !(scene.textures?.exists(portrait.textureKey) ?? false)) return null;
  const frame = elitePortraitCoverFrame(
    portrait.sourceWidth, portrait.sourceHeight, aspectWidth, aspectHeight, portrait.focal
  );
  const image = scene.add.image(x, y, portrait.textureKey);
  if (frame.sw !== portrait.sourceWidth || frame.sh !== portrait.sourceHeight) {
    image.setCrop(frame.sx, frame.sy, frame.sw, frame.sh);
  }
  image.setDisplaySize(size * (aspectWidth / aspectHeight), size);
  parent.add(image);
  return image;
}
