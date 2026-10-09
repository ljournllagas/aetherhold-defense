import type { PowerUpId, TargetingMode } from '../../shared/types.ts';
import type { TowerId } from '../../shared/progression.ts';

export type CampaignWorldId = 'borderkeep' | 'emberfall' | 'frostveil';
export type CampaignSpecializationId =
  | 'longbow_bastion' | 'repeater_tower'
  | 'siege_mortar' | 'ember_cannon'
  | 'glacial_spire' | 'shatter_spire'
  | 'aether_obelisk' | 'prism_tower'
  | 'storm_conduit' | 'thunder_crown';
export type CampaignSigilId = 'border_sigil' | 'ember_sigil' | 'frost_sigil';
export type CampaignFeatureId =
  | 'world_2' | 'world_3' | 'worlds_1_3_milestone_complete'
  | 'tower_visual_tier_ii' | 'tower_visual_tier_iii'
  | 'aether_codex_tactics' | 'hollow_warden_codex_entry' | 'cinder_colossus_codex_entry' | 'frostbound_matriarch_codex_entry'
  | 'battle_preparation_presets' | 'tower_specialization_i' | 'one_powerup_reroll_per_level'
  | 'emberfall_cosmetics' | 'frostveil_cosmetics'
  | 'meteor_strike_powerup' | 'battle_tempo_powerup' | 'time_lock_powerup'
  | 'veteran_banner' | 'advanced_codex_stats' | 'frostveil_conqueror_crest';
export type CampaignStarKind = 'completion' | 'lives' | 'score';

export interface CampaignWorldDefinition {
  id: CampaignWorldId;
  worldNumber: 1 | 2 | 3;
  name: string;
  levelStart: number;
  levelEnd: number;
  bossLevel: number;
  bossEnemyId: string;
  sigilId: CampaignSigilId;
  visualThemeId: string;
}

export interface CampaignLevelDefinition {
  level: number;
  worldId: CampaignWorldId;
  mapLayoutId: string;
  /** A display-only 1–5 rating derived from the level's position in its world. */
  difficultyRating: 1 | 2 | 3 | 4 | 5;
  /** Stable reference for the separately-authored battle profile. */
  waveProfileId: string;
  enemyIds: readonly string[];
  bossEnemyId: string | null;
  mastery: {
    minimumLivesForStar: number;
    scoreTarget: number;
  };
  warnings: readonly string[];
}

export interface CampaignSigilDefinition {
  id: CampaignSigilId;
  level: 10 | 20 | 30;
  unlocks: readonly CampaignFeatureId[];
}

export interface CampaignSpecializationEffects {
  damageMultiplier?: number;
  attackIntervalMultiplier?: number;
  rangeMultiplier?: number;
  splashRadiusMultiplier?: number;
  slowFactorMultiplier?: number;
  slowedTargetDamageMultiplier?: number;
  chainTargetDelta?: number;
  chainDamageMultiplier?: number;
  primaryDamageMultiplier?: number;
  splitTargets?: number;
  splitDamageMultiplier?: number;
  burnDurationMs?: number;
  burnDamageMultiplier?: number;
}

export interface CampaignSpecializationDefinition {
  id: CampaignSpecializationId;
  towerId: TowerId;
  name: string;
  description: string;
  effects: CampaignSpecializationEffects;
}

export interface CampaignMilestoneDefinition {
  stars: 10 | 20 | 30 | 45 | 60 | 75 | 90;
  unlocks: readonly CampaignFeatureId[];
}

export interface CampaignLevelProgress {
  completed: boolean;
  completionStar: boolean;
  livesStar: boolean;
  scoreStar: boolean;
  bestScore: number;
  bestRemainingLives: number;
}

export interface CampaignPreparationPreset {
  id: string;
  name: string;
  choices: Record<TowerId, CampaignSpecializationId | null>;
  targeting: Record<TowerId, TargetingMode>;
}

export interface CampaignProfile {
  campaignVersion: number;
  progressionVersion: number;
  highestUnlockedLevel: number;
  levels: Partial<Record<number, CampaignLevelProgress>>;
  worldSigils: CampaignSigilId[];
  unlockedFeatures: CampaignFeatureId[];
  choices: Record<TowerId, CampaignSpecializationId | null>;
  targeting: Record<TowerId, TargetingMode>;
  preparationPresets: CampaignPreparationPreset[];
}

export interface CampaignView {
  profile: CampaignProfile;
  totalMasteryStars: number;
  highestUnlockedLevel: number;
  unlockedFeatures: CampaignFeatureId[];
  unsaved: boolean;
  unsavedLevels: ReadonlySet<number>;
  warning: string | null;
}

export interface CampaignClearResult {
  level: number;
  progress: CampaignLevelProgress;
  newlyEarnedStars: CampaignStarKind[];
  newlyEarnedSigils: CampaignSigilId[];
  newlyUnlockedFeatures: CampaignFeatureId[];
  totalMasteryStars: number;
  saved: boolean;
  warning: string | null;
}

export interface CampaignSavePreparation {
  profile: CampaignProfile;
  saved: boolean;
  unsavedLevels: ReadonlySet<number>;
  warning: string | null;
}

export type CampaignPowerUpId = PowerUpId;
export type { TowerId, TargetingMode };
