import type Phaser from 'phaser';
import type { RunOutcome } from '../../shared/progression.ts';
import { CAMPAIGN_LEVELS } from './config.ts';

/** Measured delivery bundle for the final campaign completion illustration. */
export interface FinaleCampaignArt {
  readonly textureKey: string;
  readonly path: string;
  readonly sourceWidth: number;
  readonly sourceHeight: number;
}

export const FINALE_CAMPAIGN_ART: FinaleCampaignArt = {
  textureKey: 'campaign_finale',
  path: '/assets/campaign/finale/campaign-finale-v1.webp',
  sourceWidth: 1672,
  sourceHeight: 941
};

/**
 * Final campaign completion boundary: victory on the last campaign level.
 * The illustration renders only here; every other result keeps the existing
 * text-only presentation.
 */
export function isFinalCampaignCompletion(level: number, outcome: RunOutcome): boolean {
  return outcome === 'victory' && level === CAMPAIGN_LEVELS.length;
}

/**
 * Letterboxed display size: fit the landscape master inside the slot width
 * without cropping, so no control is ever covered. The image occupies its own
 * scroll rows; callers advance past the returned bottom before adding text or
 * actions.
 */
export function finaleDisplaySize(slotWidth: number): { width: number; height: number } {
  const width = Math.max(1, Math.floor(slotWidth));
  const height = Math.max(1, Math.round((width * FINALE_CAMPAIGN_ART.sourceHeight) / FINALE_CAMPAIGN_ART.sourceWidth));
  return { width, height };
}

/**
 * Finale illustration above the unchanged score settlement and replay
 * controls. Returns null when the texture is absent so callers keep the
 * text-only presentation.
 */
export function addFinaleIllustration(
  scene: Phaser.Scene,
  parent: Phaser.GameObjects.Container,
  centerX: number,
  top: number,
  slotWidth: number
): { image: Phaser.GameObjects.Image; bottom: number } | null {
  if (!scene.textures.exists(FINALE_CAMPAIGN_ART.textureKey)) return null;
  const { width, height } = finaleDisplaySize(slotWidth);
  const image = scene.add.image(centerX, top + height / 2, FINALE_CAMPAIGN_ART.textureKey)
    .setDisplaySize(width, height);
  parent.add(image);
  return { image, bottom: top + height };
}
