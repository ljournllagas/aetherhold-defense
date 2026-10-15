import type Phaser from 'phaser';

/** Measured delivery bundle for one earned world trophy. */
export interface SigilTrophyArt {
  readonly sigilId: string;
  readonly worldId: string;
  readonly textureKey: string;
  readonly path: string;
  readonly sourceWidth: number;
  readonly sourceHeight: number;
  /** Solid-content bounds at alpha >= 16 in source pixels; outside is faint residue only. */
  readonly bounds: {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
    readonly bottom: number;
  };
}

/**
 * Reusable registry: one entry per integrated world trophy. Worlds without an
 * entry keep the text-only presentation, so later sigils only add a manifest
 * line, a delivery file and one row here.
 */
export const SIGIL_TROPHY_ART: Readonly<Record<string, SigilTrophyArt>> = {
  border_sigil: {
    sigilId: 'border_sigil',
    worldId: 'borderkeep',
    textureKey: 'campaign_sigil_borderkeep',
    path: '/assets/campaign/sigils/borderkeep-sigil-v1.webp',
    sourceWidth: 1254,
    sourceHeight: 1254,
    bounds: { left: 42, top: 13, width: 1170, height: 1210, bottom: 1223 }
  },
  ember_sigil: {
    sigilId: 'ember_sigil',
    worldId: 'emberfall',
    textureKey: 'campaign_sigil_emberfall',
    path: '/assets/campaign/sigils/emberfall-sigil-v1.webp',
    sourceWidth: 1254,
    sourceHeight: 1254,
    bounds: { left: 132, top: 12, width: 991, height: 1228, bottom: 1240 }
  },
  frost_sigil: {
    sigilId: 'frost_sigil',
    worldId: 'frostveil',
    textureKey: 'campaign_sigil_frostveil',
    path: '/assets/campaign/sigils/frostveil-sigil-v1.webp',
    sourceWidth: 1254,
    sourceHeight: 1254,
    bounds: { left: 42, top: 15, width: 1171, height: 1223, bottom: 1238 }
  },
  mire_sigil: {
    sigilId: 'mire_sigil',
    worldId: 'whisperfen',
    textureKey: 'campaign_sigil_whisperfen',
    path: '/assets/campaign/sigils/whisperfen-sigil-v1.webp',
    sourceWidth: 1254,
    sourceHeight: 1254,
    bounds: { left: 32, top: 15, width: 1192, height: 1216, bottom: 1230 }
  },
  tide_sigil: {
    sigilId: 'tide_sigil',
    worldId: 'sunken_aether',
    textureKey: 'campaign_sigil_sunken_aether',
    path: '/assets/campaign/sigils/sunken_aether-sigil-v1.webp',
    sourceWidth: 1254,
    sourceHeight: 1254,
    bounds: { left: 24, top: 17, width: 1205, height: 1221, bottom: 1237 }
  },
  iron_sigil: {
    sigilId: 'iron_sigil',
    worldId: 'ironroot',
    textureKey: 'campaign_sigil_ironroot',
    path: '/assets/campaign/sigils/ironroot-sigil-v1.webp',
    sourceWidth: 1254,
    sourceHeight: 1254,
    bounds: { left: 31, top: 32, width: 1192, height: 1150, bottom: 1182 }
  },
  sky_sigil: {
    sigilId: 'sky_sigil',
    worldId: 'sky_isles',
    textureKey: 'campaign_sigil_sky_isles',
    path: '/assets/campaign/sigils/sky_isles-sigil-v1.webp',
    sourceWidth: 1254,
    sourceHeight: 1254,
    bounds: { left: 222, top: 55, width: 908, height: 1147, bottom: 1202 }
  },
  moon_sigil: {
    sigilId: 'moon_sigil',
    worldId: 'dreadmoon',
    textureKey: 'campaign_sigil_dreadmoon',
    path: '/assets/campaign/sigils/dreadmoon-sigil-v1.webp',
    sourceWidth: 1254,
    sourceHeight: 1254,
    bounds: { left: 21, top: 3, width: 1212, height: 1249, bottom: 1252 }
  }
};

export function sigilTrophyFor(sigilId: string): SigilTrophyArt | null {
  return SIGIL_TROPHY_ART[sigilId] ?? null;
}

/** The locked look is computed at render time; no second locked raster is shipped. */
export const SIGIL_TROPHY_LOCKED_TINT = 0x8f959c;
export const SIGIL_TROPHY_LOCKED_ALPHA = 0.55;

/** Trophy sizes keep the world caption and mastery rows legible on phones. */
export const SIGIL_TROPHY_CAPTION_PX = 48;
export const SIGIL_TROPHY_CAPTION_COMPACT_PX = 36;
export const SIGIL_TROPHY_MASTERY_PX = 64;

export function applySigilTrophyState(image: Phaser.GameObjects.Image, earned: boolean): void {
  if (earned) {
    image.clearTint();
    image.setAlpha(1);
  } else {
    image.setTint(SIGIL_TROPHY_LOCKED_TINT);
    image.setAlpha(SIGIL_TROPHY_LOCKED_ALPHA);
  }
}

/**
 * Trophy image beside the unchanged runtime text label. Returns null when the
 * texture is absent so callers keep the text-only presentation.
 */
export function addSigilTrophy(
  scene: Phaser.Scene,
  parent: Phaser.GameObjects.Container,
  sigilId: string,
  x: number,
  y: number,
  size: number,
  earned: boolean
): Phaser.GameObjects.Image | null {
  const trophy = sigilTrophyFor(sigilId);
  if (!trophy || !scene.textures.exists(trophy.textureKey)) return null;
  const image = scene.add.image(x, y, trophy.textureKey).setDisplaySize(size, size);
  applySigilTrophyState(image, earned);
  parent.add(image);
  return image;
}
