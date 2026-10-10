import { TOWERS } from '../config/towers.ts';
import { campaignArtAssetsForLoader } from '../campaign/artManifest.ts';
export type AssetStage = 'menu' | 'campaign' | 'gameplay' | 'defeat';
export type AssetSpec = { key: string; path: string } &
  ({ kind: 'image' } | { kind: 'sheet'; frameWidth: number; frameHeight: number });
export const STAGE_ASSETS: Record<AssetStage, readonly AssetSpec[]> = {
  menu: [
    { kind: 'image', key: 'emblem', path: '/assets/branding/aegis-emblem-v1.webp' },
    { kind: 'image', key: 'menu_vista', path: '/assets/world/vistas/ancient-border-keep-vista-v1.webp' },
    { kind: 'image', key: 'menu_vista_sunset', path: '/assets/world/vistas/ancient-border-keep-vista-menu-v2.webp' },
    ...(['easy', 'medium', 'hard'] as const).map(id => ({ kind: 'image' as const, key: `difficulty_helm_${id}`, path: `/assets/ui/difficulty-helm-${id}-v1.webp` })),
    ...campaignArtAssetsForLoader('menu')
  ],
  campaign: [...campaignArtAssetsForLoader('campaign')],
  gameplay: [
    { kind: 'image', key: 'map_ancient_border_keep', path: '/assets/world/maps/ancient-border-keep-map-v2.webp' },
    ...Object.entries({ longbow: 'ranger_stages-v2', ember: 'bombard_stages-v1', glacier: 'frost_stages-v1', starfire: 'arcane_stages-v1', tempest: 'tempest_stages-v1' }).map(([id, name]) => ({ kind: 'sheet' as const, key: TOWERS[id].assetKey, path: `/assets/towers/tower_${name}.webp`, frameWidth: 627, frameHeight: 627 })),
    ...([1, 2, 3] as const).map(rank => ({ kind: 'image' as const, key: `tower_ember_stage_${rank}_v2`, path: `/assets/towers/tower_bombard_stage${rank}-v2.webp` })),
    ...(['nature-v2', 'warden-v1', 'elite-v1'] as const).map(name => ({ kind: 'image' as const, key: `enemy_walk_atlas_${name}`, path: `/assets/enemies/enemy_walk_atlas_${name}.webp` })),
    { kind: 'image', key: 'relic_icons_atlas', path: '/assets/powerups/relic-icons-atlas-v1.webp' },
    { kind: 'image', key: 'hud_icons_atlas', path: '/assets/ui/hud-icons-atlas-v1.webp' },
    { kind: 'image', key: 'stronghold_beacon_atlas', path: '/assets/world/overlays/borderkeep-beacon-states-v1.webp' },
    ...campaignArtAssetsForLoader('gameplay')
  ],
  defeat: [{ kind: 'image', key: 'map_ancient_border_keep_defeated', path: '/assets/world/maps/ancient-border-keep-defeated-v1.webp' }]
};
export function requiredAssets(stage: AssetStage, campaignAssets: readonly AssetSpec[] = STAGE_ASSETS.campaign): readonly AssetSpec[] {
  if (stage === 'menu') return STAGE_ASSETS.menu;
  if (stage === 'campaign') return [...STAGE_ASSETS.menu, ...campaignAssets];
  if (stage === 'gameplay') return [...STAGE_ASSETS.menu, ...STAGE_ASSETS.gameplay];
  return [...STAGE_ASSETS.menu, ...STAGE_ASSETS.gameplay, ...STAGE_ASSETS.defeat];
}
export function missingAssets(stage: AssetStage, exists: (key: string) => boolean): AssetSpec[] {
  return requiredAssets(stage).filter(a => !exists(a.key));
}
