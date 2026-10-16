import type Phaser from 'phaser';
import type { PowerUpId } from '../../shared/types.ts';
import { relicHeroTexture } from './iconArt.ts';

/**
 * Measured delivery bundle for one relic showcase illustration.
 *
 * A showcase supplements the existing combat icon atlas with a larger,
 * richer presentation for reward reveals. Effects, rarity, inventory and
 * targeting are owned by src/game/config/powerUps.ts and are untouched here.
 */
export interface RelicShowcaseArt {
  readonly powerUpId: PowerUpId;
  readonly textureKey: string;
  readonly path: string;
  readonly sourceWidth: number;
  readonly sourceHeight: number;
  /**
   * Inclusive alpha bounds in source pixels. The gold_rush satchel touches
   * the left canvas edge (raw alpha, faint residue below the visible
   * threshold), so derivatives keep full-bleed padding instead of trimming,
   * and panels render the hero over the etched portrait plate that reads on
   * both dark and light surfaces.
   */
  readonly alphaBounds: readonly [number, number, number, number];
  /** Inclusive bounds of clearly-visible pixels (alpha >= 16). */
  readonly alphaBoundsAt16: readonly [number, number, number, number];
}

/**
 * Reusable registry: one entry per integrated relic showcase. Relics without
 * an entry keep the current atlas hero presentation, so later showcases only
 * add a delivery file and one row here. Combat atlases, effects, rarity,
 * inventory and targeting are untouched by this registry.
 *
 * Measured with sharp against
 * artifacts/image-reserve-20261016/masters/relic-gold_rush.png: 1254x1254
 * RGBA, alpha bounds [0, 17, 1233, 1237], visible (alpha >= 16) bounds
 * [84, 97, 1221, 1127], faint raw-alpha residue on the canvas edges, and
 * artifacts/image-reserve-20261016/masters/relic-meteor_strike.png:
 * 1254x1254 RGBA, alpha bounds [0, 4, 1239, 1253], visible
 * (alpha >= 16) bounds [95, 71, 1219, 1169], raw alpha touching the left
 * and bottom canvas edges, and
 * artifacts/image-reserve-20261016/masters/relic-time_freeze.png:
 * 1254x1254 RGBA, alpha bounds [0, 23, 1233, 1253], visible
 * (alpha >= 16) bounds [230, 87, 1011, 1156], raw alpha touching the left
 * and bottom canvas edges, and
 * artifacts/image-reserve-20261016/masters/relic-battle_cry.png:
 * 1254x1254 RGBA, alpha bounds [0, 9, 1237, 1253], visible
 * (alpha >= 16) bounds [48, 186, 1225, 1178], raw alpha touching the left
 * and bottom canvas edges, and
 * artifacts/image-reserve-20261016/masters/relic-arcane_surge.png:
 * 1254x1254 RGBA, alpha bounds [0, 13, 1249, 1253], visible
 * (alpha >= 16) bounds [169, 43, 1138, 1179], raw alpha touching the left
 * and bottom canvas edges, and
 * artifacts/image-reserve-20261016/masters/relic-emergency_repair.png:
 * 1254x1254 RGBA, alpha bounds [0, 15, 1213, 1253], visible
 * (alpha >= 16) bounds [71, 67, 1182, 1168], raw alpha touching the left
 * and bottom canvas edges, and
 * artifacts/image-reserve-20261016/masters/relic-treasure_goblin.png:
 * 1254x1254 RGBA, alpha bounds [0, 46, 1239, 1253], visible
 * (alpha >= 16) bounds [37, 91, 1218, 1180], raw alpha touching the left
 * and bottom canvas edges, and
 * artifacts/image-reserve-20261016/masters/relic-double_bounty.png:
 * 1254x1254 RGBA, alpha bounds [0, 25, 1239, 1229], visible
 * (alpha >= 16) bounds [153, 213, 1121, 1022], raw alpha touching the left
 * canvas edge, and
 * artifacts/image-reserve-20261016/masters/relic-tower_overcharge.png:
 * 1254x1254 RGBA, alpha bounds [0, 0, 1243, 1253], visible
 * (alpha >= 16) bounds [224, 54, 1028, 1217], raw alpha touching the left,
 * top and bottom canvas edges, and
 * artifacts/image-reserve-20261016/masters/relic-ancient_blessing.png:
 * 1254x1254 RGBA, alpha bounds [0, 23, 1227, 1253], visible
 * (alpha >= 16) bounds [75, 149, 1179, 1107], raw alpha touching the left
 * and bottom canvas edges. The reserve file-validation.json reports the
 * same bounds with an exclusive end (each maximum plus one).
 */
export const RELIC_SHOWCASE_ART: Readonly<Record<string, RelicShowcaseArt>> = {
  gold_rush: {
    powerUpId: 'gold_rush',
    textureKey: 'relic_showcase_gold_rush',
    path: '/assets/powerups/showcases/gold_rush-showcase-v1.webp',
    sourceWidth: 1254,
    sourceHeight: 1254,
    alphaBounds: [0, 17, 1233, 1237],
    alphaBoundsAt16: [84, 97, 1221, 1127]
  },
  meteor_strike: {
    powerUpId: 'meteor_strike',
    textureKey: 'relic_showcase_meteor_strike',
    path: '/assets/powerups/showcases/meteor_strike-showcase-v1.webp',
    sourceWidth: 1254,
    sourceHeight: 1254,
    alphaBounds: [0, 4, 1239, 1253],
    alphaBoundsAt16: [95, 71, 1219, 1169]
  },
  time_freeze: {
    powerUpId: 'time_freeze',
    textureKey: 'relic_showcase_time_freeze',
    path: '/assets/powerups/showcases/time_freeze-showcase-v1.webp',
    sourceWidth: 1254,
    sourceHeight: 1254,
    alphaBounds: [0, 23, 1233, 1253],
    alphaBoundsAt16: [230, 87, 1011, 1156]
  },
  battle_cry: {
    powerUpId: 'battle_cry',
    textureKey: 'relic_showcase_battle_cry',
    path: '/assets/powerups/showcases/battle_cry-showcase-v1.webp',
    sourceWidth: 1254,
    sourceHeight: 1254,
    alphaBounds: [0, 9, 1237, 1253],
    alphaBoundsAt16: [48, 186, 1225, 1178]
  },
  arcane_surge: {
    powerUpId: 'arcane_surge',
    textureKey: 'relic_showcase_arcane_surge',
    path: '/assets/powerups/showcases/arcane_surge-showcase-v1.webp',
    sourceWidth: 1254,
    sourceHeight: 1254,
    alphaBounds: [0, 13, 1249, 1253],
    alphaBoundsAt16: [169, 43, 1138, 1179]
  },
  emergency_repair: {
    powerUpId: 'emergency_repair',
    textureKey: 'relic_showcase_emergency_repair',
    path: '/assets/powerups/showcases/emergency_repair-showcase-v1.webp',
    sourceWidth: 1254,
    sourceHeight: 1254,
    alphaBounds: [0, 15, 1213, 1253],
    alphaBoundsAt16: [71, 67, 1182, 1168]
  },
  treasure_goblin: {
    powerUpId: 'treasure_goblin',
    textureKey: 'relic_showcase_treasure_goblin',
    path: '/assets/powerups/showcases/treasure_goblin-showcase-v1.webp',
    sourceWidth: 1254,
    sourceHeight: 1254,
    alphaBounds: [0, 46, 1239, 1253],
    alphaBoundsAt16: [37, 91, 1218, 1180]
  },
  double_bounty: {
    powerUpId: 'double_bounty',
    textureKey: 'relic_showcase_double_bounty',
    path: '/assets/powerups/showcases/double_bounty-showcase-v1.webp',
    sourceWidth: 1254,
    sourceHeight: 1254,
    alphaBounds: [0, 25, 1239, 1229],
    alphaBoundsAt16: [153, 213, 1121, 1022]
  },
  tower_overcharge: {
    powerUpId: 'tower_overcharge',
    textureKey: 'relic_showcase_tower_overcharge',
    path: '/assets/powerups/showcases/tower_overcharge-showcase-v1.webp',
    sourceWidth: 1254,
    sourceHeight: 1254,
    alphaBounds: [0, 0, 1243, 1253],
    alphaBoundsAt16: [224, 54, 1028, 1217]
  },
  ancient_blessing: {
    powerUpId: 'ancient_blessing',
    textureKey: 'relic_showcase_ancient_blessing',
    path: '/assets/powerups/showcases/ancient_blessing-showcase-v1.webp',
    sourceWidth: 1254,
    sourceHeight: 1254,
    alphaBounds: [0, 23, 1227, 1253],
    alphaBoundsAt16: [75, 149, 1179, 1107]
  }
};

export function relicShowcaseFor(id: PowerUpId): RelicShowcaseArt | null {
  return RELIC_SHOWCASE_ART[id] ?? null;
}

/**
 * Contain-fit size: fit the square master inside the hero slot without
 * cropping, so the satchel silhouette is never clipped on desktop or phone
 * panels. Small slots simply downscale; aspect is always preserved.
 */
export function relicShowcaseDisplaySize(slotWidth: number, slotHeight: number): { width: number; height: number } {
  const art = RELIC_SHOWCASE_ART.gold_rush;
  const scale = Math.min(slotWidth / art.sourceWidth, slotHeight / art.sourceHeight);
  const clamped = Math.max(0, scale);
  return {
    width: Math.max(1, Math.floor(art.sourceWidth * clamped)),
    height: Math.max(1, Math.floor(art.sourceHeight * clamped))
  };
}

const pendingShowcaseLoads = new Set<string>();

/**
 * Hero texture for reward reveals: the showcase illustration when its lazy
 * bundle has arrived, otherwise the existing atlas hero. Never throws and
 * never changes combat icon rendering.
 */
export function relicShowcaseHeroTexture(scene: Phaser.Scene, id: PowerUpId): string {
  const showcase = relicShowcaseFor(id);
  if (showcase && (scene.textures?.exists(showcase.textureKey) ?? false)) return showcase.textureKey;
  return relicHeroTexture(scene, id);
}

type ShowcaseLoader = {
  image(key: string, path: string): unknown;
  once(event: string, handler: () => void): unknown;
  start(): unknown;
};

/**
 * Lazily queue the showcase bundle the first time its relic is revealed.
 * Returns true when the showcase texture is already available. When the
 * load completes, onReady runs once so the open panel can repaint with the
 * richer art; on failure nothing runs and the caller keeps the atlas hero.
 * Relics without a registry entry return false and queue nothing.
 */
export function ensureRelicShowcaseTexture(
  scene: Phaser.Scene,
  id: PowerUpId,
  onReady: () => void
): boolean {
  const showcase = relicShowcaseFor(id);
  if (!showcase) return false;
  if (scene.textures?.exists(showcase.textureKey) ?? false) return true;
  const loader = (scene as unknown as { load?: ShowcaseLoader }).load;
  if (!loader || pendingShowcaseLoads.has(showcase.textureKey)) return false;
  pendingShowcaseLoads.add(showcase.textureKey);
  try {
    loader.image(showcase.textureKey, showcase.path);
    loader.once(`filecomplete-${showcase.textureKey}`, () => {
      pendingShowcaseLoads.delete(showcase.textureKey);
      onReady();
    });
    loader.once(`loaderror-${showcase.textureKey}`, () => {
      pendingShowcaseLoads.delete(showcase.textureKey);
    });
    loader.start();
  } catch {
    pendingShowcaseLoads.delete(showcase.textureKey);
  }
  return false;
}
