import type Phaser from 'phaser';

/** Measured delivery bundle for one cosmetic world landmark cutout. */
export interface WorldLandmarkArt {
  readonly landmarkId: string;
  readonly worldId: string;
  readonly textureKey: string;
  readonly path: string;
  readonly sourceWidth: number;
  readonly sourceHeight: number;
  /** Solid-content bounds at alpha >= 16 in source pixels; outside is transparent padding only. */
  readonly bounds: {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
    readonly bottom: number;
  };
}

/**
 * Reusable registry: one entry per integrated world landmark. Worlds without
 * an entry keep the existing presentation, so later landmarks only add a
 * manifest line, a delivery file and one row here. Landmarks are pure
 * decoration: they never change route or collision geometry, and runtime
 * roads, tower plots and tap targets stay exactly as configured.
 */
export const WORLD_LANDMARK_ART: Readonly<Record<string, WorldLandmarkArt>> = {
  borderkeep: {
    landmarkId: 'landmark:borderkeep',
    worldId: 'borderkeep',
    textureKey: 'campaign_landmark_borderkeep',
    path: '/assets/world/landmarks/landmark-borderkeep-v1.webp',
    sourceWidth: 1254,
    sourceHeight: 1254,
    bounds: { left: 293, top: 7, width: 767, height: 1208, bottom: 1214 }
  },
  emberfall: {
    landmarkId: 'landmark:emberfall',
    worldId: 'emberfall',
    textureKey: 'campaign_landmark_emberfall',
    path: '/assets/world/landmarks/landmark-emberfall-v1.webp',
    sourceWidth: 1254,
    sourceHeight: 1254,
    bounds: { left: 102, top: 61, width: 1121, height: 1112, bottom: 1172 }
  },
  frostveil: {
    landmarkId: 'landmark:frostveil',
    worldId: 'frostveil',
    textureKey: 'campaign_landmark_frostveil',
    path: '/assets/world/landmarks/landmark-frostveil-v1.webp',
    sourceWidth: 1254,
    sourceHeight: 1254,
    bounds: { left: 151, top: 85, width: 968, height: 1031, bottom: 1115 }
  },
  whisperfen: {
    landmarkId: 'landmark:whisperfen',
    worldId: 'whisperfen',
    textureKey: 'campaign_landmark_whisperfen',
    path: '/assets/world/landmarks/landmark-whisperfen-v1.webp',
    sourceWidth: 1254,
    sourceHeight: 1254,
    bounds: { left: 91, top: 20, width: 1070, height: 1181, bottom: 1200 }
  },
  sunken_aether: {
    landmarkId: 'landmark:sunken_aether',
    worldId: 'sunken_aether',
    textureKey: 'campaign_landmark_sunken_aether',
    path: '/assets/world/landmarks/landmark-sunken_aether-v1.webp',
    sourceWidth: 1254,
    sourceHeight: 1254,
    bounds: { left: 134, top: 44, width: 994, height: 1102, bottom: 1145 }
  },
  ironroot: {
    landmarkId: 'landmark:ironroot',
    worldId: 'ironroot',
    textureKey: 'campaign_landmark_ironroot',
    path: '/assets/world/landmarks/landmark-ironroot-v1.webp',
    sourceWidth: 1254,
    sourceHeight: 1254,
    bounds: { left: 143, top: 68, width: 1005, height: 1105, bottom: 1172 }
  },
  sky_isles: {
    landmarkId: 'landmark:sky_isles',
    worldId: 'sky_isles',
    textureKey: 'campaign_landmark_sky_isles',
    path: '/assets/world/landmarks/landmark-sky_isles-v1.webp',
    sourceWidth: 1254,
    sourceHeight: 1254,
    bounds: { left: 265, top: 30, width: 848, height: 1180, bottom: 1209 }
  },
  dreadmoon: {
    landmarkId: 'landmark:dreadmoon',
    worldId: 'dreadmoon',
    textureKey: 'campaign_landmark_dreadmoon',
    path: '/assets/world/landmarks/landmark-dreadmoon-v1.webp',
    sourceWidth: 1254,
    sourceHeight: 1254,
    bounds: { left: 166, top: 67, width: 944, height: 1119, bottom: 1185 }
  }
};

export function landmarkFor(worldId: string): WorldLandmarkArt | null {
  return WORLD_LANDMARK_ART[worldId] ?? null;
}

/** Decoration sizes keep the world caption legible on desktop and phones. */
export const LANDMARK_DISPLAY_PX = 96;
export const LANDMARK_DISPLAY_COMPACT_PX = 64;

/**
 * Square display size: fit the square master inside the slot without
 * cropping, so no label or control is ever covered.
 */
export function landmarkDisplaySize(slotWidth: number): { width: number; height: number } {
  const width = Math.max(1, Math.floor(slotWidth));
  return { width, height: width };
}

/**
 * Landmark decoration beside the unchanged runtime text label. The image is
 * display-only: it is never interactive and never alters routes, collision,
 * tower plots or tap targets. Returns null when the texture is absent so
 * callers keep the existing presentation.
 */
export function addLandmarkDecoration(
  scene: Phaser.Scene,
  parent: Phaser.GameObjects.Container,
  worldId: string,
  x: number,
  y: number,
  size: number
): Phaser.GameObjects.Image | null {
  const landmark = landmarkFor(worldId);
  if (!landmark || !scene.textures.exists(landmark.textureKey)) return null;
  const image = scene.add.image(x, y, landmark.textureKey).setDisplaySize(size, size);
  parent.add(image);
  return image;
}
