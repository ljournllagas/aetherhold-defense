import type Phaser from 'phaser';
import type { RunOutcome } from '../../shared/progression.ts';
import { getCampaignWorld } from './config.ts';

/** Measured delivery bundle for the Borderkeep world-completion illustration. */
export interface BorderkeepVictoryArt {
  readonly textureKey: string;
  readonly path: string;
  readonly sourceWidth: number;
  readonly sourceHeight: number;
}

export const BORDERKEEP_VICTORY_ART: BorderkeepVictoryArt = {
  textureKey: 'campaign_victory_borderkeep',
  path: '/assets/campaign/victory/borderkeep-victory-v1.webp',
  sourceWidth: 1672,
  sourceHeight: 941
};

/**
 * Borderkeep world-completion boundary: victory on the Borderkeep boss level.
 * The illustration renders only here; every other result keeps the existing
 * text-only presentation. It never replaces runtime terrain.
 */
export function isBorderkeepVictoryCompletion(level: number, outcome: RunOutcome): boolean {
  return outcome === 'victory' && level === getCampaignWorld('borderkeep').bossLevel;
}

/**
 * Letterboxed display size: fit the landscape master inside the slot width
 * without cropping, so no control is ever covered. The image occupies its own
 * scroll rows; callers advance past the returned bottom before adding text or
 * actions.
 */
export function borderkeepVictoryDisplaySize(slotWidth: number): { width: number; height: number } {
  const width = Math.max(1, Math.floor(slotWidth));
  const height = Math.max(1, Math.round((width * BORDERKEEP_VICTORY_ART.sourceHeight) / BORDERKEEP_VICTORY_ART.sourceWidth));
  return { width, height };
}

/**
 * Borderkeep illustration above the unchanged score settlement and replay
 * controls. Returns null when the texture is absent so callers keep the
 * text-only presentation.
 */
export function addBorderkeepVictoryIllustration(
  scene: Phaser.Scene,
  parent: Phaser.GameObjects.Container,
  centerX: number,
  top: number,
  slotWidth: number
): { image: Phaser.GameObjects.Image; bottom: number } | null {
  if (!scene.textures?.exists(BORDERKEEP_VICTORY_ART.textureKey)) return null;
  const { width, height } = borderkeepVictoryDisplaySize(slotWidth);
  const image = scene.add.image(centerX, top + height / 2, BORDERKEEP_VICTORY_ART.textureKey)
    .setDisplaySize(width, height);
  parent.add(image);
  return { image, bottom: top + height };
}
