import type Phaser from 'phaser';
import type { RunOutcome } from '../../shared/progression.ts';
import { getCampaignWorld } from './config.ts';

/** Measured delivery bundle for the Sky Isles world-completion illustration. */
export interface SkyIslesVictoryArt {
  readonly textureKey: string;
  readonly path: string;
  readonly sourceWidth: number;
  readonly sourceHeight: number;
}

export const SKY_ISLES_VICTORY_ART: SkyIslesVictoryArt = {
  textureKey: 'campaign_victory_sky_isles',
  path: '/assets/campaign/victory/sky_isles-victory-v1.webp',
  sourceWidth: 1672,
  sourceHeight: 941
};

/**
 * Sky Isles world-completion boundary: victory on the Sky Isles boss level.
 * The illustration renders only here; every other result keeps the existing
 * text-only presentation. It never replaces runtime terrain.
 */
export function isSkyIslesVictoryCompletion(level: number, outcome: RunOutcome): boolean {
  return outcome === 'victory' && level === getCampaignWorld('sky_isles').bossLevel;
}

/**
 * Letterboxed display size: fit the landscape master inside the slot width
 * without cropping, so no control is ever covered. The image occupies its own
 * scroll rows; callers advance past the returned bottom before adding text or
 * actions.
 */
export function skyIslesVictoryDisplaySize(slotWidth: number): { width: number; height: number } {
  const width = Math.max(1, Math.floor(slotWidth));
  const height = Math.max(1, Math.round((width * SKY_ISLES_VICTORY_ART.sourceHeight) / SKY_ISLES_VICTORY_ART.sourceWidth));
  return { width, height };
}

/**
 * Sky Isles illustration above the unchanged score settlement and replay
 * controls. Returns null when the texture is absent so callers keep the
 * text-only presentation.
 */
export function addSkyIslesVictoryIllustration(
  scene: Phaser.Scene,
  parent: Phaser.GameObjects.Container,
  centerX: number,
  top: number,
  slotWidth: number
): { image: Phaser.GameObjects.Image; bottom: number } | null {
  if (!scene.textures?.exists(SKY_ISLES_VICTORY_ART.textureKey)) return null;
  const { width, height } = skyIslesVictoryDisplaySize(slotWidth);
  const image = scene.add.image(centerX, top + height / 2, SKY_ISLES_VICTORY_ART.textureKey)
    .setDisplaySize(width, height);
  parent.add(image);
  return { image, bottom: top + height };
}
