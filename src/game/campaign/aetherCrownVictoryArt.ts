import type Phaser from 'phaser';
import type { RunOutcome } from '../../shared/progression.ts';
import { getCampaignWorld } from './config.ts';

/** Measured delivery bundle for the Aether Crown world-completion illustration. */
export interface AetherCrownVictoryArt {
  readonly textureKey: string;
  readonly path: string;
  readonly sourceWidth: number;
  readonly sourceHeight: number;
}

export const AETHER_CROWN_VICTORY_ART: AetherCrownVictoryArt = {
  textureKey: 'campaign_victory_aether_crown',
  path: '/assets/campaign/victory/aether_crown-victory-v1.webp',
  sourceWidth: 1672,
  sourceHeight: 941
};

/**
 * Aether Crown world-completion boundary: victory on the Aether Crown boss
 * level. The Aether Crown boss level is also the final campaign level, so
 * this boundary coincides with the finale completion boundary. The finale
 * keeps primacy and renders first; this illustration stacks below it in the
 * same result presentation rather than replacing it. Every other result keeps
 * the existing text-only presentation. It never replaces runtime terrain.
 */
export function isAetherCrownVictoryCompletion(level: number, outcome: RunOutcome): boolean {
  return outcome === 'victory' && level === getCampaignWorld('aether_crown').bossLevel;
}

/**
 * Letterboxed display size: fit the landscape master inside the slot width
 * without cropping, so no control is ever covered. The image occupies its own
 * scroll rows; callers advance past the returned bottom before adding text or
 * actions.
 */
export function aetherCrownVictoryDisplaySize(slotWidth: number): { width: number; height: number } {
  const width = Math.max(1, Math.floor(slotWidth));
  const height = Math.max(1, Math.round((width * AETHER_CROWN_VICTORY_ART.sourceHeight) / AETHER_CROWN_VICTORY_ART.sourceWidth));
  return { width, height };
}

/**
 * Aether Crown illustration below the finale illustration and above the
 * unchanged score settlement and replay controls. Returns null when the
 * texture is absent so callers keep the remaining presentation.
 */
export function addAetherCrownVictoryIllustration(
  scene: Phaser.Scene,
  parent: Phaser.GameObjects.Container,
  centerX: number,
  top: number,
  slotWidth: number
): { image: Phaser.GameObjects.Image; bottom: number } | null {
  if (!scene.textures?.exists(AETHER_CROWN_VICTORY_ART.textureKey)) return null;
  const { width, height } = aetherCrownVictoryDisplaySize(slotWidth);
  const image = scene.add.image(centerX, top + height / 2, AETHER_CROWN_VICTORY_ART.textureKey)
    .setDisplaySize(width, height);
  parent.add(image);
  return { image, bottom: top + height };
}
