import type Phaser from 'phaser';

/** Measured delivery bundle for one standalone boss portrait. */
export interface BossPortraitArt {
  readonly bossId: string;
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
}

/**
 * Reusable registry: one entry per integrated boss portrait. Bosses without
 * an entry keep the current text-only Codex presentation, so later portraits
 * only add a manifest line, a delivery file and one row here. Combat atlases,
 * phases and animation are untouched by this registry.
 */
export const BOSS_PORTRAIT_ART: Readonly<Record<string, BossPortraitArt>> = {
  hollow_warden: {
    bossId: 'hollow_warden',
    textureKey: 'campaign_portrait_hollow_warden',
    path: '/assets/campaign/portraits/hollow_warden-portrait-v1.webp',
    sourceWidth: 1254,
    sourceHeight: 1254,
    focal: { left: 480, top: 380, width: 420, height: 420 }
  },
  cinder_colossus: {
    bossId: 'cinder_colossus',
    textureKey: 'campaign_portrait_cinder_colossus',
    path: '/assets/campaign/portraits/cinder_colossus-portrait-v1.webp',
    sourceWidth: 1254,
    sourceHeight: 1254,
    focal: { left: 590, top: 360, width: 430, height: 430 }
  },
  frostbound_matriarch: {
    bossId: 'frostbound_matriarch',
    textureKey: 'campaign_portrait_frostbound_matriarch',
    path: '/assets/campaign/portraits/frostbound_matriarch-portrait-v1.webp',
    sourceWidth: 1254,
    sourceHeight: 1254,
    focal: { left: 385, top: 275, width: 430, height: 430 }
  },
  mireheart_hydra: {
    bossId: 'mireheart_hydra',
    textureKey: 'campaign_portrait_mireheart_hydra',
    path: '/assets/campaign/portraits/mireheart_hydra-portrait-v1.webp',
    sourceWidth: 1254,
    sourceHeight: 1254,
    focal: { left: 585, top: 165, width: 430, height: 430 }
  },
  drowned_oracle: {
    bossId: 'drowned_oracle',
    textureKey: 'campaign_portrait_drowned_oracle',
    path: '/assets/campaign/portraits/drowned_oracle-portrait-v1.webp',
    sourceWidth: 1254,
    sourceHeight: 1254,
    focal: { left: 390, top: 80, width: 430, height: 430 }
  },
  iron_tyrant: {
    bossId: 'iron_tyrant',
    textureKey: 'campaign_portrait_iron_tyrant',
    path: '/assets/campaign/portraits/iron_tyrant-portrait-v1.webp',
    sourceWidth: 1254,
    sourceHeight: 1254,
    focal: { left: 430, top: 135, width: 430, height: 430 }
  },
  stormmaw_prime: {
    bossId: 'stormmaw_prime',
    textureKey: 'campaign_portrait_stormmaw_prime',
    path: '/assets/campaign/portraits/stormmaw_prime-portrait-v1.webp',
    sourceWidth: 1254,
    sourceHeight: 1254,
    focal: { left: 400, top: 150, width: 430, height: 430 }
  },
  umbral_regent: {
    bossId: 'umbral_regent',
    textureKey: 'campaign_portrait_umbral_regent',
    path: '/assets/campaign/portraits/umbral_regent-portrait-v1.webp',
    sourceWidth: 1254,
    sourceHeight: 1254,
    focal: { left: 440, top: 140, width: 430, height: 430 }
  },
  rift_sovereign: {
    bossId: 'rift_sovereign',
    textureKey: 'campaign_portrait_rift_sovereign',
    path: '/assets/campaign/portraits/rift_sovereign-portrait-v1.webp',
    sourceWidth: 1254,
    sourceHeight: 1254,
    focal: { left: 480, top: 300, width: 430, height: 430 }
  },
  aether_devourer: {
    bossId: 'aether_devourer',
    textureKey: 'campaign_portrait_aether_devourer',
    path: '/assets/campaign/portraits/aether_devourer-portrait-v1.webp',
    sourceWidth: 1254,
    sourceHeight: 1254,
    focal: { left: 520, top: 150, width: 430, height: 430 }
  }
};

export function bossPortraitFor(bossId: string): BossPortraitArt | null {
  return BOSS_PORTRAIT_ART[bossId] ?? null;
}

export interface PortraitCoverFrame {
  readonly sx: number;
  readonly sy: number;
  readonly sw: number;
  readonly sh: number;
}

/**
 * Cover-crop a source image into a target aspect, biased toward the focal
 * box. Returns texture-pixel bounds for Phaser's setCrop; a square source in
 * a square slot returns the full frame.
 */
export function bossPortraitCoverFrame(
  sourceWidth: number, sourceHeight: number,
  targetWidth: number, targetHeight: number,
  focal: BossPortraitArt['focal']
): PortraitCoverFrame {
  const targetAspect = targetWidth / targetHeight;
  const sourceAspect = sourceWidth / sourceHeight;
  if (Math.abs(targetAspect - sourceAspect) < 1e-6) {
    return { sx: 0, sy: 0, sw: sourceWidth, sh: sourceHeight };
  }
  if (targetAspect > sourceAspect) {
    const sh = Math.max(1, Math.round(sourceWidth / targetAspect));
    const focalCenterY = focal.top + focal.height / 2;
    const sy = Math.max(0, Math.min(sourceHeight - sh, Math.round(focalCenterY - sh / 2)));
    return { sx: 0, sy, sw: sourceWidth, sh };
  }
  const sw = Math.max(1, Math.round(sourceHeight * targetAspect));
  const focalCenterX = focal.left + focal.width / 2;
  const sx = Math.max(0, Math.min(sourceWidth - sw, Math.round(focalCenterX - sw / 2)));
  return { sx, sy: 0, sw, sh: sourceHeight };
}

/** Square Codex portrait size keeps the boss name and guidance legible on phones. */
export const BOSS_PORTRAIT_CODEX_PX = 96;
export const BOSS_PORTRAIT_CODEX_COMPACT_PX = 72;

/**
 * Portrait image beside the unchanged runtime boss name and guidance text.
 * Returns null when the portrait is unregistered or its texture is absent so
 * callers keep the text-only presentation.
 */
export function addBossPortrait(
  scene: Phaser.Scene,
  parent: Phaser.GameObjects.Container,
  bossId: string,
  x: number,
  y: number,
  size: number,
  aspectWidth = 1,
  aspectHeight = 1
): Phaser.GameObjects.Image | null {
  const portrait = bossPortraitFor(bossId);
  if (!portrait || !scene.textures.exists(portrait.textureKey)) return null;
  const frame = bossPortraitCoverFrame(
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
