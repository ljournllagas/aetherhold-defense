import type { AssetSpec } from '../art/assetManifest.ts';
import type { CampaignWorldId } from './types.ts';

export type CampaignArtState = 'final_required' | 'final';
export interface CampaignArtSource {
  id: string;
  key: string;
  path: string;
  state: CampaignArtState;
  stage: 'menu' | 'campaign' | 'gameplay';
  kind: 'image' | 'sheet';
  width: number;
  height: number;
  frameWidth?: number;
  frameHeight?: number;
  states: Readonly<Record<string, { row: number; frames: number }>>;
  qualityFlags: readonly string[];
  temporary: 'procedural' | null;
}

const WORLDS: readonly CampaignWorldId[] = ['borderkeep', 'emberfall', 'frostveil'];
const FAMILIES = ['a', 'b', 'c', 'd'] as const;
const NORMAL_ENEMIES: Readonly<Record<CampaignWorldId, readonly string[]>> = {
  borderkeep: ['marchling', 'skitter', 'stoneback', 'ironhide', 'veilborn'],
  emberfall: ['cinderling', 'ashrunner', 'magmahide', 'ember_brute', 'ashcaller'],
  frostveil: ['snowstalker', 'icebound', 'frostback', 'glacier_knight', 'frost_shaman']
};
const BOSSES: Readonly<Record<CampaignWorldId, string>> = {
  borderkeep: 'hollow_warden', emberfall: 'cinder_colossus', frostveil: 'frostbound_matriarch'
};
const TOWERS = ['longbow', 'ember', 'glacier', 'starfire', 'tempest'] as const;
const NORMAL_STATES = { idle: { row: 0, frames: 4 }, walk: { row: 1, frames: 6 }, attack: { row: 2, frames: 6 }, death: { row: 3, frames: 6 } } as const;
const SUPPORT_STATES = { ...NORMAL_STATES, buff: { row: 4, frames: 6 } } as const;
const BOSS_STATES: Readonly<Record<string, { row: number; frames: number }>> = {
  idle: { row: 0, frames: 6 }, walk: { row: 1, frames: 8 }, attack: { row: 2, frames: 8 },
  armor_break: { row: 3, frames: 8 }, exposed_core: { row: 4, frames: 8 }, death: { row: 5, frames: 8 }
};

export interface CampaignAnimationDefinition {
  key: string;
  state: string;
  frameRate: number;
  repeat: number;
  frames: readonly string[];
}

/** Shared UI pictograms remain procedural; no standalone raster sources are required for them. */
export const CAMPAIGN_UI_ART_POLICY = {
  routeNodes: 'Phaser vector circles, road crossings and boss crests',
  masteryStars: 'text glyphs positioned at route nodes and in mastery panels',
  worldSigils: 'text labels and earned-state colors in world headers and mastery panels'
} as const;

/** Expose every registered atlas state so future production animation cues use exact manifest frames. */
export function campaignAnimationDefinitions(assetKey: string): CampaignAnimationDefinition[] {
  const asset = CAMPAIGN_ART_MANIFEST.find(item => item.key === assetKey && item.kind === 'sheet');
  if (!asset) return [];
  return Object.entries(asset.states).map(([state, definition]) => ({
    key: `${assetKey}_${state}`,
    state,
    frameRate: state === 'idle' ? 4 : state === 'walk' ? 7 : 8,
    repeat: state === 'idle' || state === 'walk' ? -1 : 0,
    frames: Array.from({ length: definition.frames }, (_, index) => `${state}_${index}`)
  }));
}

function imageSource(
  id: string, key: string, path: string, width: number, height: number, stage: 'menu' | 'campaign' | 'gameplay' = 'gameplay',
  qualityFlags: readonly string[] = ['final_art_unverified'], state: CampaignArtState = 'final_required', temporary: 'procedural' | null = 'procedural'
): CampaignArtSource {
  return { id, key, path, state, stage, kind: 'image', width, height, states: {}, qualityFlags, temporary };
}

/** Final art targets. Their explicit state keeps the preload contract from requesting absent files. */
export const CAMPAIGN_ART_MANIFEST: readonly CampaignArtSource[] = [
  ...WORLDS.flatMap(worldId => FAMILIES.map(family => imageSource(
    `map:${worldId}:${family}`, `campaign_${worldId}_${family}`,
    `/assets/campaign/maps/${worldId}_${family}-v1.png`, 1672, 940, 'gameplay', ['final_art_unverified', 'procedural_biome_fallback']
  ))),
  ...WORLDS.flatMap(worldId => [
    imageSource(`world-panel:${worldId}`, `campaign_worldmap_${worldId}`,
      `/assets/campaign/world-map/${worldId}-v1.png`, 768, 432, 'campaign', ['biome_illustration'], 'final', null),
    ...NORMAL_ENEMIES[worldId].map(id => {
      const states = id === 'ashcaller' || id === 'frost_shaman' ? SUPPORT_STATES : NORMAL_STATES;
      const rows = Math.max(...Object.values(states).map(state => state.row)) + 1;
      return {
        id: `enemy:${id}`, key: `campaign_enemy_${id}`, path: `/assets/campaign/enemies/${worldId}/${id}-atlas-v1.png`,
        state: 'final_required' as const, stage: 'gameplay' as const, kind: 'sheet' as const, width: 768, height: rows * 128,
        frameWidth: 128, frameHeight: 128, states,
        qualityFlags: ['final_art_unverified', 'transparent_png_required', 'consistent_feet_anchor', 'no_baked_ui_or_large_shadow', ...(id === 'ashcaller' || id === 'frost_shaman' ? ['support_buff_playback_unverified'] : [])], temporary: 'procedural' as const
      };
    }),
    (() => {
      const id = BOSSES[worldId];
      const states = id === 'cinder_colossus' ? BOSS_STATES : id === 'frostbound_matriarch'
        ? { idle: { row: 0, frames: 6 }, walk: { row: 1, frames: 8 }, attack: { row: 2, frames: 8 }, freeze_cast: { row: 3, frames: 8 }, phase_two: { row: 4, frames: 8 }, death: { row: 5, frames: 8 } }
        : { idle: { row: 0, frames: 6 }, walk: { row: 1, frames: 8 }, attack: { row: 2, frames: 8 }, special: { row: 3, frames: 8 }, death: { row: 4, frames: 8 } };
      const rows = Math.max(...Object.values(states).map(state => state.row)) + 1;
      return {
        id: `boss:${id}`, key: `campaign_enemy_${id}`, path: `/assets/campaign/bosses/${id}-atlas-v1.png`,
        state: 'final_required' as const, stage: 'gameplay' as const, kind: 'sheet' as const, width: 2048, height: rows * 256,
        frameWidth: 256, frameHeight: 256, states,
        qualityFlags: ['final_art_unverified', 'transparent_png_required', 'consistent_feet_anchor', 'phase_state_readability_required'], temporary: 'procedural' as const
      };
    })()
  ]),
  ...TOWERS.flatMap(id => ([2, 3] as const).map(tier => imageSource(
    `tower:${id}:tier${tier}`, `campaign_tower_${id}_tier${tier}`,
    `/assets/campaign/towers/${id}-tier${tier}-v1.png`, 192, 192, 'gameplay', ['final_art_unverified', 'transparent_png_required', 'cosmetic_only', 'classic_art_unchanged']
  )))
];

/** A production file is queued only after its manifest entry is promoted and its exact path is listed here. */
export const AVAILABLE_CAMPAIGN_ART_PATHS: readonly string[] = [
  '/assets/campaign/world-map/borderkeep-v1.png',
  '/assets/campaign/world-map/emberfall-v1.png',
  '/assets/campaign/world-map/frostveil-v1.png'
];

/** Resolve a promotable manifest snapshot against its exact approved source paths. */
export function resolveCampaignArtAssets(
  manifest: readonly CampaignArtSource[], stage: 'menu' | 'campaign' | 'gameplay', availablePaths: readonly string[]
): AssetSpec[] {
  const available = new Set(availablePaths);
  return manifest.filter(asset => asset.stage === stage && asset.state === 'final' && available.has(asset.path)).map(asset => asset.kind === 'sheet'
    ? { kind: 'sheet' as const, key: asset.key, path: asset.path, frameWidth: asset.frameWidth!, frameHeight: asset.frameHeight! }
    : { kind: 'image' as const, key: asset.key, path: asset.path });
}

export function campaignArtAssetsForLoader(stage: 'menu' | 'campaign' | 'gameplay', availablePaths: readonly string[] = AVAILABLE_CAMPAIGN_ART_PATHS): AssetSpec[] {
  return resolveCampaignArtAssets(CAMPAIGN_ART_MANIFEST, stage, availablePaths);
}

export function missingCampaignProductionAssets(): CampaignArtSource[] {
  return CAMPAIGN_ART_MANIFEST.filter(asset => asset.state === 'final_required');
}
