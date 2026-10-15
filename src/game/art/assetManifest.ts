import { TOWERS } from '../config/towers.ts';
import { campaignArtAssetsForLoader, campaignGameplayAssetsForLevel } from '../campaign/artManifest.ts';
import { getCampaignLevel } from '../campaign/config.ts';
import type { CampaignVisualTier } from '../campaign/types.ts';
export type AssetStage = 'menu' | 'campaign' | 'gameplay' | 'defeat';
export type AssetSpec = { key: string; path: string } &
  ({ kind: 'image' } | { kind: 'sheet'; frameWidth: number; frameHeight: number });
export const STAGE_ASSETS: Record<AssetStage, readonly AssetSpec[]> = {
  menu: [
    { kind: 'image', key: 'emblem', path: '/assets/branding/aegis-emblem-v2.webp' },
    { kind: 'image', key: 'menu_vista', path: '/assets/world/vistas/ancient-border-keep-vista-v2.webp' },
    { kind: 'image', key: 'menu_vista_sunset', path: '/assets/world/vistas/ancient-border-keep-vista-menu-v3.webp' },
    ...(['easy', 'medium', 'hard'] as const).map(id => ({ kind: 'image' as const, key: `difficulty_helm_${id}`, path: `/assets/ui/difficulty-helm-${id}-v2.webp` })),
    ...campaignArtAssetsForLoader('menu')
  ],
  campaign: [...campaignArtAssetsForLoader('campaign')],
  gameplay: [
    { kind: 'image', key: 'map_ancient_border_keep', path: '/assets/world/maps/ancient-border-keep-map-v3.webp' },
    ...Object.entries({ longbow: 'ranger_stages-v3', ember: 'bombard_stages-v2', glacier: 'frost_stages-v2', starfire: 'arcane_stages-v2', tempest: 'tempest_stages-v2', sentinel: 'sentinel_stages-v1', cinder: 'cinder_stages-v1' }).map(([id, name]) => ({ kind: 'sheet' as const, key: TOWERS[id].assetKey, path: `/assets/towers/tower_${name}.webp`, frameWidth: 627, frameHeight: 627 })),
    ...([1, 2, 3] as const).map(rank => ({ kind: 'image' as const, key: `tower_ember_stage_${rank}_v2`, path: `/assets/towers/tower_bombard_stage${rank}-v3.webp` })),
    { kind: 'image', key: 'tower_longbow_marksman', path: '/assets/towers/tower_longbow_marksman-v1.webp' },
    { kind: 'image', key: 'tower_longbow_volley', path: '/assets/towers/tower_longbow_volley-v1.webp' },
    { kind: 'image', key: 'tower_ember_siegebreaker', path: '/assets/towers/tower_ember_siegebreaker-v1.webp' },
    { kind: 'image', key: 'tower_ember_flame-mortar', path: '/assets/towers/tower_ember_flame-mortar-v1.webp' },
    { kind: 'image', key: 'tower_glacier_winterguard', path: '/assets/towers/tower_glacier_winterguard-v1.webp' },
    { kind: 'image', key: 'tower_glacier_brittle-ice', path: '/assets/towers/tower_glacier_brittle-ice-v1.webp' },
    { kind: 'image', key: 'tower_starfire_spellbreaker', path: '/assets/towers/tower_starfire_spellbreaker-v1.webp' },
    { kind: 'image', key: 'tower_starfire_arcane-beacon', path: '/assets/towers/tower_starfire_arcane-beacon-v1.webp' },
    { kind: 'image', key: 'tower_tempest_stormcaller', path: '/assets/towers/tower_tempest_stormcaller-v1.webp' },
    { kind: 'image', key: 'tower_tempest_thunderlord', path: '/assets/towers/tower_tempest_thunderlord-v1.webp' },
    { kind: 'image', key: 'tower_sentinel_deadeye', path: '/assets/towers/tower_sentinel_deadeye-v1.webp' },
    { kind: 'image', key: 'tower_sentinel_headhunter', path: '/assets/towers/tower_sentinel_headhunter-v1.webp' },
    ...([['nature-v2', 'nature-v3'], ['warden-v1', 'warden-v2'], ['elite-v1', 'elite-v2']] as const).map(([name, file]) => ({ kind: 'image' as const, key: `enemy_walk_atlas_${name}`, path: `/assets/enemies/enemy_walk_atlas_${file}.webp` })),
    { kind: 'image', key: 'relic_icons_atlas', path: '/assets/powerups/relic-icons-atlas-v2.webp' },
    { kind: 'image', key: 'hud_icons_atlas', path: '/assets/ui/hud-icons-atlas-v2.webp' },
    { kind: 'image', key: 'stronghold_beacon_atlas', path: '/assets/world/overlays/borderkeep-beacon-states-v2.webp' },
  ],
  defeat: [{ kind: 'image', key: 'map_ancient_border_keep_defeated', path: '/assets/world/maps/ancient-border-keep-defeated-v2.webp' }]
};
export function requiredAssets(stage: AssetStage, campaignAssets: readonly AssetSpec[] = STAGE_ASSETS.campaign): readonly AssetSpec[] {
  if (stage === 'menu') return STAGE_ASSETS.menu;
  if (stage === 'campaign') return [...STAGE_ASSETS.menu, ...campaignAssets];
  if (stage === 'gameplay') return [...STAGE_ASSETS.menu, ...STAGE_ASSETS.gameplay];
  return [...STAGE_ASSETS.menu, ...STAGE_ASSETS.gameplay, ...STAGE_ASSETS.defeat];
}
export interface CampaignGameplayRequest { mode?: 'classic' | 'campaign'; campaignLevel?: number; campaignVisualTier?: CampaignVisualTier; }
export function requiredAssetsForRequest(stage: AssetStage, data?: CampaignGameplayRequest): readonly AssetSpec[] {
  const base = requiredAssets(stage);
  if (stage !== 'gameplay' || data?.mode !== 'campaign') return base;
  const level = getCampaignLevel(data.campaignLevel ?? NaN);
  return level ? [...base, ...campaignGameplayAssetsForLevel(level, data.campaignVisualTier ?? 1)] : base;
}
export function missingAssets(stage: AssetStage, exists: (key: string) => boolean): AssetSpec[] {
  return requiredAssets(stage).filter(a => !exists(a.key));
}
