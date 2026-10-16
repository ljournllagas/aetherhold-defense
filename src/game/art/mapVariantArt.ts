import { MAP1 } from '../maps/map1.ts';

/** Selectable painted backdrop for the Classic battlefield. Classic stays default. */
export type MapBackdropVariant = 'classic' | 'last-lantern-night';

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
 * On-demand loader spec for the night backdrop. It is intentionally absent
 * from every STAGE_ASSETS bundle so Classic gameplay never pays for it until
 * a caller explicitly requests this variant.
 */
export function mapBackdropVariantAsset(variant: MapBackdropVariant): { kind: 'image'; key: string; path: string } | null {
  if (variant !== LAST_LANTERN_NIGHT_ART.variant) return null;
  return { kind: 'image', key: LAST_LANTERN_NIGHT_ART.textureKey, path: LAST_LANTERN_NIGHT_ART.path };
}

/**
 * Backdrop texture for a Classic battlefield. The night plate passed the
 * geometry gate against the accepted Classic plate and the authored
 * map1.ts route, so it reuses the exact route, plot, gate, stronghold and
 * beacon anchors. Falls back to the Classic texture whenever the variant is
 * not requested or its texture is absent.
 */
export function resolveMapBackdropKey(variant: MapBackdropVariant, exists: (key: string) => boolean): string {
  if (variant === LAST_LANTERN_NIGHT_ART.variant && exists(LAST_LANTERN_NIGHT_ART.textureKey)) {
    return LAST_LANTERN_NIGHT_ART.textureKey;
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
