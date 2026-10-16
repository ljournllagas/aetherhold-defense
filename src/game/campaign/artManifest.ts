import type { AssetSpec } from '../art/assetManifest.ts';
import { CAMPAIGN_LEVELS, CAMPAIGN_WORLDS } from './config.ts';
import type { CampaignLevelDefinition, CampaignVisualTier, CampaignWorldId } from './types.ts';

export type CampaignArtState = 'final_required' | 'final';
/** Production sheet packaging: largest painted pose occupies 78% of a cell. */
export const CAMPAIGN_ATLAS_CONTENT_FRACTION = 0.78;
export const CAMPAIGN_ATLAS_GROUND_ORIGIN = 0.9;
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

const LEGACY_WORLD_IDS: readonly CampaignWorldId[] = CAMPAIGN_WORLDS.slice(0, 3).map(world => world.id);
const EXPANSION_WORLD_IDS: readonly CampaignWorldId[] = CAMPAIGN_WORLDS.slice(3).map(world => world.id);
const RELEASED_EXPANSION_WORLD_IDS = new Set<CampaignWorldId>(['whisperfen', 'sunken_aether', 'ironroot', 'sky_isles', 'dreadmoon', 'astral_rift', 'aether_crown']);
const FAMILIES = ['a', 'b', 'c', 'd'] as const;
const LEGACY_NORMAL_ENEMIES: Readonly<Record<string, readonly string[]>> = {
  borderkeep: ['marchling', 'skitter', 'stoneback', 'ironhide', 'veilborn'],
  emberfall: ['cinderling', 'ashrunner', 'magmahide', 'ember_brute', 'ashcaller'],
  frostveil: ['snowstalker', 'icebound', 'frostback', 'glacier_knight', 'frost_shaman']
};
const NORMAL_ENEMIES = Object.fromEntries(CAMPAIGN_WORLDS.map(world => [world.id,
  LEGACY_NORMAL_ENEMIES[world.id] ?? [...new Set(CAMPAIGN_LEVELS.filter(level => level.worldId === world.id).flatMap(level => level.enemyIds))]
])) as Readonly<Record<CampaignWorldId, readonly string[]>>;
const BOSSES = Object.fromEntries(CAMPAIGN_WORLDS.map(world => [world.id, world.bossEnemyId])) as Readonly<Record<CampaignWorldId, string>>;
const TOWERS = ['longbow', 'ember', 'glacier', 'starfire', 'tempest', 'sentinel', 'cinder'] as const;
const NORMAL_STATES = { idle: { row: 0, frames: 4 }, walk: { row: 1, frames: 6 }, attack: { row: 2, frames: 6 }, death: { row: 3, frames: 6 } } as const;
const SUPPORT_STATES = { ...NORMAL_STATES, buff: { row: 4, frames: 6 } } as const;
const EXPANSION_SUPPORT_ENEMIES = new Set(['rootwretch', 'aetherbound', 'foundry_core', 'tempest_herald', 'echo_shade', 'rift_weaver', 'crown_archon']);
const EXPANSION_BOSS_STATES = {
  idle: { row: 0, frames: 6 }, walk: { row: 1, frames: 8 }, attack: { row: 2, frames: 8 },
  special: { row: 3, frames: 8 }, phase_two: { row: 4, frames: 8 }, death: { row: 5, frames: 8 }
} as const;
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
  worldSigils: 'earned raster world trophies with code-driven locked treatment, plus text labels and earned-state colors in world headers and mastery panels'
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
  ...LEGACY_WORLD_IDS.flatMap(worldId => FAMILIES.map(family => {
    return imageSource(
      `map:${worldId}:${family}`, `campaign_${worldId}_${family}`,
      `/assets/campaign/maps/${worldId}_${family}-v1.webp`, 1672, 940, 'gameplay',
      ['terrain_plate', 'runtime_geometry_overlay'], 'final', null
    );
  })),
  ...LEGACY_WORLD_IDS.flatMap(worldId => [
    imageSource(`world-panel:${worldId}`, `campaign_worldmap_${worldId}`,
      `/assets/campaign/world-map/${worldId}-v1.webp`, 768, 432, 'campaign', ['biome_illustration'], 'final', null),
    ...NORMAL_ENEMIES[worldId].map(id => {
      const states = id === 'ashcaller' || id === 'frost_shaman' ? SUPPORT_STATES : NORMAL_STATES;
      const rows = Math.max(...Object.values(states).map(state => state.row)) + 1;
      return {
        id: `enemy:${id}`, key: `campaign_enemy_${id}`, path: `/assets/campaign/enemies/${worldId}/${id}-atlas-v1.webp`,
        state: 'final' as const, stage: 'gameplay' as const, kind: 'sheet' as const, width: 768, height: rows * 128,
        frameWidth: 128, frameHeight: 128, states,
        qualityFlags: ['authored_animation_reviewed', 'transparent_png_required', 'consistent_feet_anchor', 'no_baked_ui_or_large_shadow', ...(id === 'ashcaller' || id === 'frost_shaman' ? ['support_buff_playback_verified'] : [])], temporary: null
      };
    }),
    (() => {
      const id = BOSSES[worldId];
      const states = id === 'cinder_colossus' ? BOSS_STATES : id === 'frostbound_matriarch'
        ? { idle: { row: 0, frames: 6 }, walk: { row: 1, frames: 8 }, attack: { row: 2, frames: 8 }, freeze_cast: { row: 3, frames: 8 }, phase_two: { row: 4, frames: 8 }, death: { row: 5, frames: 8 } }
        : { idle: { row: 0, frames: 6 }, walk: { row: 1, frames: 8 }, attack: { row: 2, frames: 8 }, special: { row: 3, frames: 8 }, death: { row: 4, frames: 8 } };
      const rows = Math.max(...Object.values(states).map(state => state.row)) + 1;
      return {
        id: `boss:${id}`, key: `campaign_enemy_${id}`, path: `/assets/campaign/bosses/${id}-atlas-v1.webp`,
        state: 'final' as const, stage: 'gameplay' as const, kind: 'sheet' as const, width: 2048, height: rows * 256,
        frameWidth: 256, frameHeight: 256, states,
        qualityFlags: ['authored_animation_reviewed', 'transparent_png_required', 'consistent_feet_anchor', 'phase_state_readability_verified'], temporary: null
      };
    })()
  ]),
  ...TOWERS.flatMap(id => ([2, 3] as const).map(tier => imageSource(
    `tower:${id}:tier${tier}`, `campaign_tower_${id}_tier${tier}`,
    `/assets/campaign/towers/${id}-tier${tier}-v1.webp`, 192, 192, 'gameplay', ['transparent_png_required', 'cosmetic_only', 'classic_art_unchanged'], 'final', null
  ))),
  ...EXPANSION_WORLD_IDS.flatMap(worldId => {
    const isReleasedWorld = RELEASED_EXPANSION_WORLD_IDS.has(worldId);
    const pathVersion = isReleasedWorld ? 'v2' : 'v1';
    const state: CampaignArtState = isReleasedWorld ? 'final' : 'final_required';
    const temporary: 'procedural' | null = isReleasedWorld ? null : 'procedural';
    const qualityFlags = (retained: readonly string[]) => isReleasedWorld
      ? retained
      : ['final_art_unverified', 'provisional_starter_art', ...retained];

    return [
      ...FAMILIES.map(family => imageSource(
        `map:${worldId}:${family}`, `campaign_${worldId}_${family}`,
        `/assets/campaign/maps/${worldId}_${family}-${pathVersion}.webp`, 1672, 940, 'gameplay',
        qualityFlags(['terrain_plate', 'runtime_geometry_overlay']), state, temporary
      )),
      imageSource(`world-panel:${worldId}`, `campaign_worldmap_${worldId}`,
        `/assets/campaign/world-map/${worldId}-${pathVersion}.webp`, 768, 432, 'campaign',
        qualityFlags(['biome_illustration']), state, temporary),
      ...NORMAL_ENEMIES[worldId].map(id => {
        const support = EXPANSION_SUPPORT_ENEMIES.has(id);
        const states = support ? SUPPORT_STATES : NORMAL_STATES;
        const rows = Math.max(...Object.values(states).map(state => state.row)) + 1;
        return {
          id: `enemy:${id}`, key: `campaign_enemy_${id}`,
          path: `/assets/campaign/enemies/${worldId}/${id}-atlas-${pathVersion}.webp`,
          state, stage: 'gameplay' as const, kind: 'sheet' as const, width: 768, height: rows * 128,
          frameWidth: 128, frameHeight: 128, states,
          qualityFlags: qualityFlags(['transparent_png_required', 'consistent_feet_anchor', 'no_baked_ui_or_large_shadow', ...(support ? ['support_buff_playback_verified'] : [])]),
          temporary
        };
      }),
      {
        id: `boss:${BOSSES[worldId]}`, key: `campaign_enemy_${BOSSES[worldId]}`,
        path: `/assets/campaign/bosses/${BOSSES[worldId]}-atlas-${pathVersion}.webp`,
        state, stage: 'gameplay' as const, kind: 'sheet' as const,
        width: 2048, height: 1536, frameWidth: 256, frameHeight: 256, states: EXPANSION_BOSS_STATES,
        qualityFlags: qualityFlags(['transparent_png_required', 'consistent_feet_anchor', 'phase_state_readability_verified']),
        temporary
      }
    ];
  }),
  imageSource(`sigil:borderkeep`, `campaign_sigil_borderkeep`,
    `/assets/campaign/sigils/borderkeep-sigil-v1.webp`, 1254, 1254, 'campaign',
    ['sigil_trophy', 'transparent_png_required'], 'final', null),
  imageSource(`sigil:emberfall`, `campaign_sigil_emberfall`,
    `/assets/campaign/sigils/emberfall-sigil-v1.webp`, 1254, 1254, 'campaign',
    ['sigil_trophy', 'transparent_png_required'], 'final', null),
  imageSource(`sigil:frostveil`, `campaign_sigil_frostveil`,
    `/assets/campaign/sigils/frostveil-sigil-v1.webp`, 1254, 1254, 'campaign',
    ['sigil_trophy', 'transparent_png_required'], 'final', null),
  imageSource(`sigil:whisperfen`, `campaign_sigil_whisperfen`,
    `/assets/campaign/sigils/whisperfen-sigil-v1.webp`, 1254, 1254, 'campaign',
    ['sigil_trophy', 'transparent_png_required'], 'final', null),
  imageSource(`sigil:sunken_aether`, `campaign_sigil_sunken_aether`,
    `/assets/campaign/sigils/sunken_aether-sigil-v1.webp`, 1254, 1254, 'campaign',
    ['sigil_trophy', 'transparent_png_required'], 'final', null),
  imageSource(`sigil:ironroot`, `campaign_sigil_ironroot`,
    `/assets/campaign/sigils/ironroot-sigil-v1.webp`, 1254, 1254, 'campaign',
    ['sigil_trophy', 'transparent_png_required'], 'final', null),
  imageSource(`sigil:sky_isles`, `campaign_sigil_sky_isles`,
    `/assets/campaign/sigils/sky_isles-sigil-v1.webp`, 1254, 1254, 'campaign',
    ['sigil_trophy', 'transparent_png_required'], 'final', null),
  imageSource(`sigil:dreadmoon`, `campaign_sigil_dreadmoon`,
    `/assets/campaign/sigils/dreadmoon-sigil-v1.webp`, 1254, 1254, 'campaign',
    ['sigil_trophy', 'transparent_png_required'], 'final', null),
  imageSource(`sigil:astral_rift`, `campaign_sigil_astral_rift`,
    `/assets/campaign/sigils/astral_rift-sigil-v1.webp`, 1254, 1254, 'campaign',
    ['sigil_trophy', 'transparent_png_required'], 'final', null),
  imageSource(`sigil:aether_crown`, `campaign_sigil_aether_crown`,
    `/assets/campaign/sigils/aether_crown-sigil-v1.webp`, 1254, 1254, 'campaign',
    ['sigil_trophy', 'transparent_png_required'], 'final', null),
  imageSource(`portrait:hollow_warden`, `campaign_portrait_hollow_warden`,
    `/assets/campaign/portraits/hollow_warden-portrait-v1.webp`, 1254, 1254, 'campaign',
    ['boss_portrait', 'full_bleed_square', 'codex_presentation'], 'final', null),
  imageSource(`portrait:cinder_colossus`, `campaign_portrait_cinder_colossus`,
    `/assets/campaign/portraits/cinder_colossus-portrait-v1.webp`, 1254, 1254, 'campaign',
    ['boss_portrait', 'full_bleed_square', 'codex_presentation'], 'final', null),
  imageSource(`portrait:frostbound_matriarch`, `campaign_portrait_frostbound_matriarch`,
    `/assets/campaign/portraits/frostbound_matriarch-portrait-v1.webp`, 1254, 1254, 'campaign',
    ['boss_portrait', 'full_bleed_square', 'codex_presentation'], 'final', null),
  imageSource(`portrait:mireheart_hydra`, `campaign_portrait_mireheart_hydra`,
    `/assets/campaign/portraits/mireheart_hydra-portrait-v1.webp`, 1254, 1254, 'campaign',
    ['boss_portrait', 'full_bleed_square', 'codex_presentation'], 'final', null),
  imageSource(`portrait:drowned_oracle`, `campaign_portrait_drowned_oracle`,
    `/assets/campaign/portraits/drowned_oracle-portrait-v1.webp`, 1254, 1254, 'campaign',
    ['boss_portrait', 'full_bleed_square', 'codex_presentation'], 'final', null),
  imageSource(`portrait:iron_tyrant`, `campaign_portrait_iron_tyrant`,
    `/assets/campaign/portraits/iron_tyrant-portrait-v1.webp`, 1254, 1254, 'campaign',
    ['boss_portrait', 'full_bleed_square', 'codex_presentation'], 'final', null),
  imageSource(`portrait:stormmaw_prime`, `campaign_portrait_stormmaw_prime`,
    `/assets/campaign/portraits/stormmaw_prime-portrait-v1.webp`, 1254, 1254, 'campaign',
    ['boss_portrait', 'full_bleed_square', 'codex_presentation'], 'final', null),
  imageSource(`portrait:umbral_regent`, `campaign_portrait_umbral_regent`,
    `/assets/campaign/portraits/umbral_regent-portrait-v1.webp`, 1254, 1254, 'campaign',
    ['boss_portrait', 'full_bleed_square', 'codex_presentation'], 'final', null),
  imageSource(`portrait:rift_sovereign`, `campaign_portrait_rift_sovereign`,
    `/assets/campaign/portraits/rift_sovereign-portrait-v1.webp`, 1254, 1254, 'campaign',
    ['boss_portrait', 'full_bleed_square', 'codex_presentation'], 'final', null),
  imageSource(`portrait:aether_devourer`, `campaign_portrait_aether_devourer`,
    `/assets/campaign/portraits/aether_devourer-portrait-v1.webp`, 1254, 1254, 'campaign',
    ['boss_portrait', 'full_bleed_square', 'codex_presentation'], 'final', null),
  imageSource(`elite:borderkeep`, `campaign_elite_portrait_borderkeep`,
    `/assets/campaign/portraits/elite-borderkeep-v1.webp`, 1254, 1254, 'campaign',
    ['elite_portrait', 'showcase_only', 'provisional', 'full_bleed_square', 'codex_presentation'], 'final', null),
  imageSource(`elite:emberfall`, `campaign_elite_portrait_emberfall`,
    `/assets/campaign/portraits/elite-emberfall-v1.webp`, 1254, 1254, 'campaign',
    ['elite_portrait', 'showcase_only', 'provisional', 'full_bleed_square', 'codex_presentation'], 'final', null),
  imageSource(`elite:frostveil`, `campaign_elite_portrait_frostveil`,
    `/assets/campaign/portraits/elite-frostveil-v1.webp`, 1254, 1254, 'campaign',
    ['elite_portrait', 'showcase_only', 'provisional', 'full_bleed_square', 'codex_presentation'], 'final', null),
  imageSource(`finale:campaign`, `campaign_finale`,
    `/assets/campaign/finale/campaign-finale-v1.webp`, 1672, 941, 'gameplay',
    ['finale_illustration', 'landscape_full_bleed', 'final_completion_only'], 'final', null),
  imageSource(`victory:borderkeep`, `campaign_victory_borderkeep`,
    `/assets/campaign/victory/borderkeep-victory-v1.webp`, 1672, 941, 'gameplay',
    ['victory_illustration', 'landscape_full_bleed', 'world_completion_only'], 'final', null),
  imageSource(`victory:emberfall`, `campaign_victory_emberfall`,
    `/assets/campaign/victory/emberfall-victory-v1.webp`, 1672, 941, 'gameplay',
    ['victory_illustration', 'landscape_full_bleed', 'world_completion_only'], 'final', null),
  imageSource(`victory:frostveil`, `campaign_victory_frostveil`,
    `/assets/campaign/victory/frostveil-victory-v1.webp`, 1672, 941, 'gameplay',
    ['victory_illustration', 'landscape_full_bleed', 'world_completion_only'], 'final', null),
  imageSource(`victory:whisperfen`, `campaign_victory_whisperfen`,
    `/assets/campaign/victory/whisperfen-victory-v1.webp`, 1672, 941, 'gameplay',
    ['victory_illustration', 'landscape_full_bleed', 'world_completion_only'], 'final', null),
  imageSource(`victory:sunken_aether`, `campaign_victory_sunken_aether`,
    `/assets/campaign/victory/sunken_aether-victory-v1.webp`, 1672, 941, 'gameplay',
    ['victory_illustration', 'landscape_full_bleed', 'world_completion_only'], 'final', null),
  imageSource(`victory:ironroot`, `campaign_victory_ironroot`,
    `/assets/campaign/victory/ironroot-victory-v1.webp`, 1672, 941, 'gameplay',
    ['victory_illustration', 'landscape_full_bleed', 'world_completion_only'], 'final', null),
  imageSource(`victory:sky_isles`, `campaign_victory_sky_isles`,
    `/assets/campaign/victory/sky_isles-victory-v1.webp`, 1672, 941, 'gameplay',
    ['victory_illustration', 'landscape_full_bleed', 'world_completion_only'], 'final', null),
  imageSource(`victory:dreadmoon`, `campaign_victory_dreadmoon`,
    `/assets/campaign/victory/dreadmoon-victory-v1.webp`, 1672, 941, 'gameplay',
    ['victory_illustration', 'landscape_full_bleed', 'world_completion_only'], 'final', null),
  imageSource(`victory:astral_rift`, `campaign_victory_astral_rift`,
    `/assets/campaign/victory/astral_rift-victory-v1.webp`, 1672, 941, 'gameplay',
    ['victory_illustration', 'landscape_full_bleed', 'world_completion_only'], 'final', null),
  imageSource(`victory:aether_crown`, `campaign_victory_aether_crown`,
    `/assets/campaign/victory/aether_crown-victory-v1.webp`, 1672, 941, 'gameplay',
    ['victory_illustration', 'landscape_full_bleed', 'world_completion_only'], 'final', null),
  imageSource(`landmark:borderkeep`, `campaign_landmark_borderkeep`,
    `/assets/world/landmarks/landmark-borderkeep-v1.webp`, 1254, 1254, 'campaign',
    ['landmark_decoration', 'transparent_png_required', 'cosmetic_only', 'non_obstructive'], 'final', null),
  imageSource(`landmark:emberfall`, `campaign_landmark_emberfall`,
    `/assets/world/landmarks/landmark-emberfall-v1.webp`, 1254, 1254, 'campaign',
    ['landmark_decoration', 'transparent_png_required', 'cosmetic_only', 'non_obstructive'], 'final', null),
  imageSource(`landmark:frostveil`, `campaign_landmark_frostveil`,
    `/assets/world/landmarks/landmark-frostveil-v1.webp`, 1254, 1254, 'campaign',
    ['landmark_decoration', 'transparent_png_required', 'cosmetic_only', 'non_obstructive'], 'final', null),
  imageSource(`landmark:whisperfen`, `campaign_landmark_whisperfen`,
    `/assets/world/landmarks/landmark-whisperfen-v1.webp`, 1254, 1254, 'campaign',
    ['landmark_decoration', 'transparent_png_required', 'cosmetic_only', 'non_obstructive'], 'final', null),
  imageSource(`landmark:sunken_aether`, `campaign_landmark_sunken_aether`,
    `/assets/world/landmarks/landmark-sunken_aether-v1.webp`, 1254, 1254, 'campaign',
    ['landmark_decoration', 'transparent_png_required', 'cosmetic_only', 'non_obstructive'], 'final', null),
  imageSource(`landmark:ironroot`, `campaign_landmark_ironroot`,
    `/assets/world/landmarks/landmark-ironroot-v1.webp`, 1254, 1254, 'campaign',
    ['landmark_decoration', 'transparent_png_required', 'cosmetic_only', 'non_obstructive'], 'final', null),
  imageSource(`landmark:sky_isles`, `campaign_landmark_sky_isles`,
    `/assets/world/landmarks/landmark-sky_isles-v1.webp`, 1254, 1254, 'campaign',
    ['landmark_decoration', 'transparent_png_required', 'cosmetic_only', 'non_obstructive'], 'final', null),
  imageSource(`landmark:dreadmoon`, `campaign_landmark_dreadmoon`,
    `/assets/world/landmarks/landmark-dreadmoon-v1.webp`, 1254, 1254, 'campaign',
    ['landmark_decoration', 'transparent_png_required', 'cosmetic_only', 'non_obstructive'], 'final', null),
  imageSource(`landmark:astral_rift`, `campaign_landmark_astral_rift`,
    `/assets/world/landmarks/landmark-astral_rift-v1.webp`, 1254, 1254, 'campaign',
    ['landmark_decoration', 'transparent_png_required', 'cosmetic_only', 'non_obstructive'], 'final', null),
  imageSource(`landmark:aether_crown`, `campaign_landmark_aether_crown`,
    `/assets/world/landmarks/landmark-aether_crown-v1.webp`, 1254, 1254, 'campaign',
    ['landmark_decoration', 'transparent_png_required', 'cosmetic_only', 'non_obstructive'], 'final', null)
];

/** A production file is queued only after its manifest entry is promoted and its exact path is listed here. */
export const AVAILABLE_CAMPAIGN_ART_PATHS: readonly string[] = [
  ...LEGACY_WORLD_IDS.flatMap(worldId => FAMILIES.map(family => `/assets/campaign/maps/${worldId}_${family}-v1.webp`)),
  ...LEGACY_WORLD_IDS.flatMap(worldId => [
    `/assets/campaign/world-map/${worldId}-v1.webp`,
    ...NORMAL_ENEMIES[worldId].map(id => `/assets/campaign/enemies/${worldId}/${id}-atlas-v1.webp`),
    `/assets/campaign/bosses/${BOSSES[worldId]}-atlas-v1.webp`
  ]),
  ...TOWERS.flatMap(id => ([2, 3] as const).map(tier => `/assets/campaign/towers/${id}-tier${tier}-v1.webp`)),
  ...EXPANSION_WORLD_IDS.filter(worldId => RELEASED_EXPANSION_WORLD_IDS.has(worldId)).flatMap(worldId => [
    ...FAMILIES.map(family => `/assets/campaign/maps/${worldId}_${family}-v2.webp`),
    `/assets/campaign/world-map/${worldId}-v2.webp`,
    ...NORMAL_ENEMIES[worldId].map(id => `/assets/campaign/enemies/${worldId}/${id}-atlas-v2.webp`),
    `/assets/campaign/bosses/${BOSSES[worldId]}-atlas-v2.webp`
  ]),
  '/assets/campaign/sigils/borderkeep-sigil-v1.webp',
  '/assets/campaign/sigils/emberfall-sigil-v1.webp',
  '/assets/campaign/sigils/frostveil-sigil-v1.webp',
  '/assets/campaign/sigils/whisperfen-sigil-v1.webp',
  '/assets/campaign/sigils/sunken_aether-sigil-v1.webp',
  '/assets/campaign/sigils/ironroot-sigil-v1.webp',
  '/assets/campaign/sigils/sky_isles-sigil-v1.webp',
  '/assets/campaign/sigils/dreadmoon-sigil-v1.webp',
  '/assets/campaign/sigils/astral_rift-sigil-v1.webp',
  '/assets/campaign/sigils/aether_crown-sigil-v1.webp',
  '/assets/campaign/portraits/hollow_warden-portrait-v1.webp',
  '/assets/campaign/portraits/cinder_colossus-portrait-v1.webp',
  '/assets/campaign/portraits/frostbound_matriarch-portrait-v1.webp',
  '/assets/campaign/portraits/mireheart_hydra-portrait-v1.webp',
  '/assets/campaign/portraits/drowned_oracle-portrait-v1.webp',
  '/assets/campaign/portraits/iron_tyrant-portrait-v1.webp',
  '/assets/campaign/portraits/stormmaw_prime-portrait-v1.webp',
  '/assets/campaign/portraits/umbral_regent-portrait-v1.webp',
  '/assets/campaign/portraits/rift_sovereign-portrait-v1.webp',
  '/assets/campaign/portraits/aether_devourer-portrait-v1.webp',
  '/assets/campaign/portraits/elite-borderkeep-v1.webp',
  '/assets/campaign/portraits/elite-emberfall-v1.webp',
  '/assets/campaign/portraits/elite-frostveil-v1.webp',
  '/assets/campaign/finale/campaign-finale-v1.webp',
  '/assets/campaign/victory/borderkeep-victory-v1.webp',
  '/assets/campaign/victory/emberfall-victory-v1.webp',
  '/assets/campaign/victory/frostveil-victory-v1.webp',
  '/assets/campaign/victory/whisperfen-victory-v1.webp',
  '/assets/campaign/victory/sunken_aether-victory-v1.webp',
  '/assets/campaign/victory/ironroot-victory-v1.webp',
  '/assets/campaign/victory/sky_isles-victory-v1.webp',
  '/assets/campaign/victory/dreadmoon-victory-v1.webp',
  '/assets/campaign/victory/astral_rift-victory-v1.webp',
  '/assets/campaign/victory/aether_crown-victory-v1.webp',
  '/assets/world/landmarks/landmark-borderkeep-v1.webp',
  '/assets/world/landmarks/landmark-emberfall-v1.webp',
  '/assets/world/landmarks/landmark-frostveil-v1.webp',
  '/assets/world/landmarks/landmark-whisperfen-v1.webp',
  '/assets/world/landmarks/landmark-sunken_aether-v1.webp',
  '/assets/world/landmarks/landmark-ironroot-v1.webp',
  '/assets/world/landmarks/landmark-sky_isles-v1.webp',
  '/assets/world/landmarks/landmark-dreadmoon-v1.webp',
  '/assets/world/landmarks/landmark-astral_rift-v1.webp',
  '/assets/world/landmarks/landmark-aether_crown-v1.webp'
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

export function campaignArtAssetsForLoader(
  stage: 'menu' | 'campaign' | 'gameplay',
  availablePaths: readonly string[] = AVAILABLE_CAMPAIGN_ART_PATHS,
  provisionalStarterPaths: readonly string[] = CAMPAIGN_PROVISIONAL_STARTER_PATHS
): AssetSpec[] {
  const finalAssets = resolveCampaignArtAssets(CAMPAIGN_ART_MANIFEST, stage, availablePaths);
  if (stage !== 'campaign') return finalAssets;
  return [...finalAssets, ...resolveCampaignProvisionalStarterAssets(
    CAMPAIGN_ART_MANIFEST, stage, provisionalStarterPaths
  )];
}

/** Exact provisional art bundle for expansion worlds, ordered from World 4 through World 10. */
export const CAMPAIGN_PROVISIONAL_STARTER_PATHS: readonly string[] = EXPANSION_WORLD_IDS.filter(worldId => !RELEASED_EXPANSION_WORLD_IDS.has(worldId)).flatMap(worldId => [
  ...FAMILIES.map(family => `/assets/campaign/maps/${worldId}_${family}-v1.webp`),
  `/assets/campaign/world-map/${worldId}-v1.webp`,
  ...NORMAL_ENEMIES[worldId].map(id => `/assets/campaign/enemies/${worldId}/${id}-atlas-v1.webp`),
  `/assets/campaign/bosses/${BOSSES[worldId]}-atlas-v1.webp`
]);

/** Starter files need both final_required registration and an exact explicit provisional path approval. */
export function resolveCampaignProvisionalStarterAssets(
  manifest: readonly CampaignArtSource[], stage: 'campaign' | 'gameplay', approvedStarterPaths: readonly string[]
): AssetSpec[] {
  const approved = new Set(approvedStarterPaths);
  return manifest.filter(asset => asset.stage === stage && asset.state === 'final_required'
    && asset.temporary === 'procedural' && asset.qualityFlags.includes('provisional_starter_art') && approved.has(asset.path))
    .map(asset => asset.kind === 'sheet'
      ? { kind: 'sheet' as const, key: asset.key, path: asset.path, frameWidth: asset.frameWidth!, frameHeight: asset.frameHeight! }
      : { kind: 'image' as const, key: asset.key, path: asset.path });
}

const BOSS_SUMMONS: Readonly<Record<string, readonly string[]>> = {
  hollow_warden: ['marchling'], mireheart_hydra: ['bogling']
};

/** Select only the current level's family, visual tier, and registered roster/boss/summon art. */
export function campaignGameplayAssetsForLevel(
  level: CampaignLevelDefinition, visualTier: CampaignVisualTier,
  manifest: readonly CampaignArtSource[] = CAMPAIGN_ART_MANIFEST,
  availablePaths: readonly string[] = AVAILABLE_CAMPAIGN_ART_PATHS
): AssetSpec[] {
  const familyPrefix = `${level.worldId}_`;
  if (!level.mapLayoutId.startsWith(familyPrefix)) return [];
  const family = level.mapLayoutId.slice(familyPrefix.length, familyPrefix.length + 1);
  if (!FAMILIES.includes(family as typeof FAMILIES[number])) return [];
  const ids = new Set([
    `map:${level.worldId}:${family}`,
    ...level.enemyIds.map(id => `enemy:${id}`),
    ...(level.bossEnemyId ? [`boss:${level.bossEnemyId}`, ...(BOSS_SUMMONS[level.bossEnemyId] ?? []).map(id => `enemy:${id}`)] : []),
    ...(visualTier === 1 ? [] : TOWERS.map(id => `tower:${id}:tier${visualTier}`)),
    // Finale illustration preloads only with the final-level bundle, so the
    // completion presentation never costs earlier levels a download. Each
    // world victory illustration likewise preloads only with its own world
    // boss level bundle.
    ...(level.level === CAMPAIGN_LEVELS.length ? ['finale:campaign'] : []),
    ...(level.level === CAMPAIGN_WORLDS.find(world => world.id === 'borderkeep')!.bossLevel ? ['victory:borderkeep'] : []),
    ...(level.level === CAMPAIGN_WORLDS.find(world => world.id === 'emberfall')!.bossLevel ? ['victory:emberfall'] : []),
    ...(level.level === CAMPAIGN_WORLDS.find(world => world.id === 'frostveil')!.bossLevel ? ['victory:frostveil'] : []),
    ...(level.level === CAMPAIGN_WORLDS.find(world => world.id === 'whisperfen')!.bossLevel ? ['victory:whisperfen'] : []),
    ...(level.level === CAMPAIGN_WORLDS.find(world => world.id === 'sunken_aether')!.bossLevel ? ['victory:sunken_aether'] : []),
    ...(level.level === CAMPAIGN_WORLDS.find(world => world.id === 'ironroot')!.bossLevel ? ['victory:ironroot'] : []),
    ...(level.level === CAMPAIGN_WORLDS.find(world => world.id === 'sky_isles')!.bossLevel ? ['victory:sky_isles'] : []),
    ...(level.level === CAMPAIGN_WORLDS.find(world => world.id === 'dreadmoon')!.bossLevel ? ['victory:dreadmoon'] : []),
    ...(level.level === CAMPAIGN_WORLDS.find(world => world.id === 'astral_rift')!.bossLevel ? ['victory:astral_rift'] : []),
    // The Aether Crown boss level is also the final campaign level, so the
    // level-100 bundle preloads both the finale and the world victory art.
    ...(level.level === CAMPAIGN_WORLDS.find(world => world.id === 'aether_crown')!.bossLevel ? ['victory:aether_crown'] : [])
  ]);
  const selected = manifest.filter(asset => ids.has(asset.id));
  return [
    ...resolveCampaignArtAssets(selected, 'gameplay', availablePaths),
    ...resolveCampaignProvisionalStarterAssets(selected, 'gameplay', CAMPAIGN_PROVISIONAL_STARTER_PATHS)
  ];
}

export function missingCampaignProductionAssets(): CampaignArtSource[] {
  return CAMPAIGN_ART_MANIFEST.filter(asset => asset.state === 'final_required');
}
