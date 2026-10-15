import type { AdditionalBranchId } from '../config/additionalEvolutions.ts';
import type { AdditionalTowerId } from '../config/additionalTowers.ts';
import { ADDITIONAL_TOWER_GEOMETRY } from './additionalTowerGeometry.ts';

// Dedicated painted foundations and campaign cosmetics; branch crests remain vector accents.
export const ADDITIONAL_TOWER_ART: Record<
  AdditionalTowerId,
  { assetKey: string; color: number; portraitBackground: string; targetHeight: number; groundInsets: readonly number[] }
> = {
  sentinel: {
    assetKey: 'tower_sentinel',
    color: 0xd7aa4e,
    portraitBackground: '#3d3a2a',
    targetHeight: 112,
    groundInsets: ADDITIONAL_TOWER_GEOMETRY.sentinel.groundInsets
  },
  cinder: {
    assetKey: 'tower_cinder',
    color: 0xde8742,
    portraitBackground: '#402a20',
    targetHeight: 84,
    groundInsets: ADDITIONAL_TOWER_GEOMETRY.cinder.groundInsets
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

// Painted asset contracts:
// /assets/towers/tower_sentinel_stages-v1.webp (627px cells, 4 frames)
// /assets/towers/tower_cinder_stages-v1.webp (627px cells, 4 frames)
// /assets/campaign/towers/sentinel-tier2-v1.png, sentinel-tier3-v1.png (192px)
// /assets/campaign/towers/cinder-tier2-v1.png, cinder-tier3-v1.png (192px)
