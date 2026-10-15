import type { AdditionalBranchId } from '../config/additionalEvolutions.ts';
import type { AdditionalTowerId } from '../config/additionalTowers.ts';

// Recolor + vector-crest scope agreed in grill Q13.
// No new raster atlases: extension towers reuse classic frames
// (sentinel -> tower_longbow, cinder -> tower_ember) with a new color and a
// new EVOLUTION_ACCENTS-style silhouette. Painted 627px atlases + 192px
// campaign PNGs remain a deferred artist drop-in with these exact keys.
export const ADDITIONAL_TOWER_ART: Record<
  AdditionalTowerId,
  { reuseAssetKey: string; color: number; portraitBackground: string; targetHeight: number; groundInsets: readonly number[] }
> = {
  sentinel: {
    reuseAssetKey: 'tower_longbow',
    color: 0xd7aa4e,
    portraitBackground: '#3d3a2a',
    targetHeight: 112,
    groundInsets: [58, 76, 92, 103]
  },
  cinder: {
    reuseAssetKey: 'tower_ember',
    color: 0xde8742,
    portraitBackground: '#402a20',
    targetHeight: 84,
    groundInsets: [135, 194, 190, 100]
  }
};

export interface AdditionalEvolutionAccent {
  silhouette: 'crosshair-dagger' | 'pit-cauldron';
  color: number;
  label: string;
}

export const ADDITIONAL_EVOLUTION_ACCENTS: Readonly<Record<AdditionalBranchId, AdditionalEvolutionAccent>> = {
  deadeye: { silhouette: 'crosshair-dagger', color: 0xd7aa4e, label: 'Deadeye' },
  headhunter: { silhouette: 'crosshair-dagger', color: 0x8ee6a0, label: 'Headhunter' },
  pyre: { silhouette: 'pit-cauldron', color: 0xde8742, label: 'Pyre' },
  contagion: { silhouette: 'pit-cauldron', color: 0x9fd4e8, label: 'Contagion' }
};

// Deferred painted assets (artist drop-in, same contracts as artManifest.ts:122-125):
// /assets/towers/tower_sentinel_stages-v1.webp (627px cells, 4 frames)
// /assets/towers/tower_cinder_stages-v1.webp (627px cells, 4 frames)
// /assets/campaign/towers/sentinel-tier2-v1.png, sentinel-tier3-v1.png (192px)
// /assets/campaign/towers/cinder-tier2-v1.png, cinder-tier3-v1.png (192px)
// Until present, buildTowerVisual() falls back to reuseAssetKey + accent crest.
