import { MAP1 } from '../maps/map1.ts';

/** Selectable painted backdrop for the Classic battlefield. Classic stays default. */
export type MapBackdropVariant = 'classic' | 'last-lantern-night' | 'last-lantern-dawn';

/** Measured delivery bundle for the Last Lantern night backdrop. */
export interface MapBackdropArt {
  readonly variant: Exclude<MapBackdropVariant, 'classic'>;
  readonly textureKey: string;
  readonly path: string;
  readonly sourceWidth: number;
  readonly sourceHeight: number;
}

export const LAST_LANTERN_NIGHT_ART: MapBackdropArt = {
  variant: 'last-lantern-night',
  textureKey: 'map_ancient_border_keep_last_lantern_night',
  path: '/assets/world/maps/ancient-border-keep-map-last-lantern-night-v1.webp',
  sourceWidth: 1672,
  sourceHeight: 940
};

/**
 * Measured delivery bundle for the Last Lantern dawn backdrop. The
 * 1673x940 master is a uniform ~0.06% stretch of the canonical frame
 * (edge registration favored resampling over either 1px crop), so the
 * delivery file is normalized to 1672x940 with a 1px-max displacement
 * at the extreme right edge — far inside road and plot tolerances.
 */
export const LAST_LANTERN_DAWN_ART: MapBackdropArt = {
  variant: 'last-lantern-dawn',
  textureKey: 'map_ancient_border_keep_last_lantern_dawn',
  path: '/assets/world/maps/ancient-border-keep-map-last-lantern-dawn-v1.webp',
  sourceWidth: 1672,
  sourceHeight: 940
};

const VARIANT_ART: Record<Exclude<MapBackdropVariant, 'classic'>, MapBackdropArt> = {
  'last-lantern-night': LAST_LANTERN_NIGHT_ART,
  'last-lantern-dawn': LAST_LANTERN_DAWN_ART
};

/**
 * On-demand loader spec for a variant backdrop. It is intentionally absent
 * from every STAGE_ASSETS bundle so Classic gameplay never pays for it until
 * a caller explicitly requests this variant.
 */
export function mapBackdropVariantAsset(variant: MapBackdropVariant): { kind: 'image'; key: string; path: string } | null {
  const art = variant === 'classic' ? undefined : VARIANT_ART[variant];
  if (!art) return null;
  return { kind: 'image', key: art.textureKey, path: art.path };
}

/**
 * Backdrop texture for a Classic battlefield. Each variant plate passed the
 * geometry gate against the accepted Classic plate and the authored
 * map1.ts route, so every variant reuses the exact route, plot, gate,
 * stronghold and beacon anchors. Falls back to the Classic texture whenever
 * the variant is not requested or its texture is absent.
 */
export function resolveMapBackdropKey(variant: MapBackdropVariant, exists: (key: string) => boolean): string {
  const art = variant === 'classic' ? undefined : VARIANT_ART[variant];
  if (art && exists(art.textureKey)) {
    return art.textureKey;
  }
  return MAP1.backgroundKey;
}

/**
 * Backdrop display size: identical field mapping to the Classic plate, so
 * the runtime route, plot and beacon overlays register without adjustment
 * on desktop and phone viewports alike.
 */
export function mapBackdropDisplaySize(fieldWidth: number, fieldHeight: number): { width: number; height: number } {
  return { width: Math.max(1, Math.floor(fieldWidth)), height: Math.max(1, Math.floor(fieldHeight)) };
}
