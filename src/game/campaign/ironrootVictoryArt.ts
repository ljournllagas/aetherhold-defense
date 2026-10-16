import type Phaser from 'phaser';
import type { RunOutcome } from '../../shared/progression.ts';
import { getCampaignWorld } from './config.ts';

/** Measured delivery bundle for the Ironroot world-completion illustration. */
export interface IronrootVictoryArt {
  readonly textureKey: string;
  readonly path: string;
  readonly sourceWidth: number;
  readonly sourceHeight: number;
}

export const IRONROOT_VICTORY_ART: IronrootVictoryArt = {
  textureKey: 'campaign_victory_ironroot',
  path: '/assets/campaign/victory/ironroot-victory-v1.webp',
  sourceWidth: 1672,
  sourceHeight: 941
};

/**
 * Ironroot world-completion boundary: victory on the Ironroot boss level.
 * The illustration renders only here; every other result keeps the existing
 * text-only presentation. It never replaces runtime terrain.
 */
export function isIronrootVictoryCompletion(level: number, outcome: RunOutcome): boolean {
  return outcome === 'victory' && level === getCampaignWorld('ironroot').bossLevel;
}

/**
 * Letterboxed display size: fit the landscape master inside the slot width
 * without cropping, so no control is ever covered. The image occupies its own
 * scroll rows; callers advance past the returned bottom before adding text or
 * actions.
 */
export function ironrootVictoryDisplaySize(slotWidth: number): { width: number; height: number } {
  const width = Math.max(1, Math.floor(slotWidth));
  const height = Math.max(1, Math.round((width * IRONROOT_VICTORY_ART.sourceHeight) / IRONROOT_VICTORY_ART.sourceWidth));
  return { width, height };
}

/**
 * Ironroot illustration above the unchanged score settlement and replay
 * controls. Returns null when the texture is absent so callers keep the
 * text-only presentation.
 */
export function addIronrootVictoryIllustration(
  scene: Phaser.Scene,
  parent: Phaser.GameObjects.Container,
  centerX: number,
  top: number,
  slotWidth: number
): { image: Phaser.GameObjects.Image; bottom: number } | null {
  if (!scene.textures?.exists(IRONROOT_VICTORY_ART.textureKey)) return null;
  const { width, height } = ironrootVictoryDisplaySize(slotWidth);
  const image = scene.add.image(centerX, top + height / 2, IRONROOT_VICTORY_ART.textureKey)
    .setDisplaySize(width, height);
  parent.add(image);
  return { image, bottom: top + height };
}
