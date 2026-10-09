import type Phaser from 'phaser';
import type { PowerUpId } from '../../shared/types.ts';

const RELIC_FRAMES: Record<PowerUpId, readonly [number, number, number, number]> = {
  gold_rush: [24, 28, 365, 357],
  meteor_strike: [414, 28, 366, 357],
  time_freeze: [810, 28, 363, 357],
  battle_cry: [1197, 28, 366, 357],
  arcane_surge: [1595, 28, 364, 357],
  emergency_repair: [24, 403, 364, 357],
  treasure_goblin: [414, 403, 366, 359],
  double_bounty: [810, 403, 365, 359],
  tower_overcharge: [1197, 403, 365, 359],
  ancient_blessing: [1594, 403, 365, 359]
};

/** Expose one reviewed atlas frame at its authored resolution for reward reveals. */
export function relicHeroTexture(scene: Phaser.Scene, id: PowerUpId): string {
  const key = `relic_hero_${id}`;
  if (scene.textures.exists(key)) return key;
  if (!scene.textures.exists('relic_icons_atlas')) return `relic_${id}`;

  const [x, y, width, height] = RELIC_FRAMES[id];
  const source = scene.textures.get('relic_icons_atlas').getSourceImage() as HTMLImageElement | HTMLCanvasElement;
  const texture = scene.textures.createCanvas(key, width, height);
  if (!texture) return `relic_${id}`;
  const context = texture.getContext();
  context.clearRect(0, 0, width, height);
  context.drawImage(source, x, y, width, height, 0, 0, width, height);
  texture.refresh();
  return key;
}
