import type Phaser from 'phaser';
import type { RunOutcome } from '../../shared/progression.ts';
import { getCampaignWorld } from './config.ts';

/** Measured delivery bundle for the Whisperfen world-completion illustration. */
export interface WhisperfenVictoryArt {
  readonly textureKey: string;
  readonly path: string;
  readonly sourceWidth: number;
  readonly sourceHeight: number;
}

export const WHISPERFEN_VICTORY_ART: WhisperfenVictoryArt = {
  textureKey: 'campaign_victory_whisperfen',
  path: '/assets/campaign/victory/whisperfen-victory-v1.webp',
  sourceWidth: 1672,
  sourceHeight: 941
};

/**
 * Whisperfen world-completion boundary: victory on the Whisperfen boss level.
 * The illustration renders only here; every other result keeps the existing
 * text-only presentation. It never replaces runtime terrain.
 */
export function isWhisperfenVictoryCompletion(level: number, outcome: RunOutcome): boolean {
  return outcome === 'victory' && level === getCampaignWorld('whisperfen').bossLevel;
}

/**
 * Letterboxed display size: fit the landscape master inside the slot width
 * without cropping, so no control is ever covered. The image occupies its own
 * scroll rows; callers advance past the returned bottom before adding text or
 * actions.
 */
export function whisperfenVictoryDisplaySize(slotWidth: number): { width: number; height: number } {
  const width = Math.max(1, Math.floor(slotWidth));
  const height = Math.max(1, Math.round((width * WHISPERFEN_VICTORY_ART.sourceHeight) / WHISPERFEN_VICTORY_ART.sourceWidth));
  return { width, height };
}

/**
 * Whisperfen illustration above the unchanged score settlement and replay
 * controls. Returns null when the texture is absent so callers keep the
 * text-only presentation.
 */
export function addWhisperfenVictoryIllustration(
  scene: Phaser.Scene,
  parent: Phaser.GameObjects.Container,
  centerX: number,
  top: number,
  slotWidth: number
): { image: Phaser.GameObjects.Image; bottom: number } | null {
  if (!scene.textures?.exists(WHISPERFEN_VICTORY_ART.textureKey)) return null;
  const { width, height } = whisperfenVictoryDisplaySize(slotWidth);
  const image = scene.add.image(centerX, top + height / 2, WHISPERFEN_VICTORY_ART.textureKey)
    .setDisplaySize(width, height);
  parent.add(image);
  return { image, bottom: top + height };
}
