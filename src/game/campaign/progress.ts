import { isTowerId, TOWER_IDS } from '../config/towers.ts';
import type { PowerUpId, TargetingMode } from '../../shared/types.ts';
import type { TowerId } from '../../shared/progression.ts';
import { CAMPAIGN_LEVELS, CAMPAIGN_MILESTONES, CAMPAIGN_SIGILS, featuresForSigils, getCampaignLevel } from './config.ts';
import { CAMPAIGN_SPECIALIZATION_UNLOCK_STARS, CAMPAIGN_SPECIALIZATIONS, getCampaignSpecialization } from './specializations.ts';
import type {
  CampaignClearResult,
  CampaignFeatureId,
  CampaignLevelProgress,
  CampaignPowerUpId,
  CampaignPreparationPreset,
  CampaignProfile,
  CampaignSavePreparation,
  CampaignSigilId,
  CampaignSpecializationId,
  CampaignStarKind,
  CampaignView,
  CampaignWorldId
} from './types.ts';

export const CAMPAIGN_VERSION = 1;
export const PROGRESSION_VERSION = 1;
export const CAMPAIGN_STORAGE_KEY = 'aetherhold-campaign-v1';
export const PREPARATION_PRESET_UNLOCK_STARS = 20;
export const MAX_PREPARATION_PRESETS = 3;

export const CAMPAIGN_SAVE_FAILED_WARNING = 'Campaign progress changed, but could not be saved';
export const CAMPAIGN_UNREADABLE_WARNING = 'Saved campaign progress could not be read. Progress earned now is kept for this session only.';
export const CAMPAIGN_NEWER_WARNING = 'Saved campaign progress comes from a newer version. Progress earned now is kept for this session only.';
export const CAMPAIGN_UNAVAILABLE_WARNING = 'Campaign storage is unavailable. Progress earned now is kept for this session only.';

export type CampaignStorage = Pick<Storage, 'getItem' | 'setItem'>;

const TARGETING_MODES: readonly TargetingMode[] = ['first', 'last', 'strongest', 'weakest', 'closest'];
const SIGIL_IDS = new Set<string>(CAMPAIGN_SIGILS.map((sigil) => sigil.id));
const FEATURE_IDS = new Set<string>([
  ...CAMPAIGN_MILESTONES.flatMap((milestone) => milestone.unlocks),
  ...CAMPAIGN_SIGILS.flatMap((sigil) => sigil.unlocks)
]);
const SPECIALIZATION_IDS = new Set<string>(CAMPAIGN_SPECIALIZATIONS.map((specialization) => specialization.id));

export const CAMPAIGN_FEATURE_IDS: readonly CampaignFeatureId[] = [...FEATURE_IDS].sort() as CampaignFeatureId[];

export function createEmptyCampaignProfile(): CampaignProfile {
  return {
    campaignVersion: CAMPAIGN_VERSION,
    progressionVersion: PROGRESSION_VERSION,
    highestUnlockedLevel: 1,
    levels: {},
    worldSigils: [],
    unlockedFeatures: [],
    choices: Object.fromEntries(TOWER_IDS.map((towerId) => [towerId, null])) as Record<TowerId, null>,
    targeting: Object.fromEntries(TOWER_IDS.map((towerId) => [towerId, 'first'])) as Record<TowerId, TargetingMode>,
    preparationPresets: []
  };
}

function emptyLevelProgress(): CampaignLevelProgress {
  return { completed: false, completionStar: false, livesStar: false, scoreStar: false, bestScore: 0, bestRemainingLives: 0 };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  const keys = new Set(allowed);
  return Object.keys(value).every((key) => keys.has(key));
}

function isIntegerAtLeast(value: unknown, minimum = 0): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= minimum;
}

function cloneLevelProgress(progress: CampaignLevelProgress): CampaignLevelProgress {
  return { ...progress };
}

function clonePreset(preset: CampaignPreparationPreset): CampaignPreparationPreset {
  return {
    id: preset.id,
    name: preset.name,
    choices: { ...preset.choices },
    targeting: { ...preset.targeting }
  };
}

function cloneProfile(profile: CampaignProfile): CampaignProfile {
  const levels: CampaignProfile['levels'] = {};
  for (const [level, progress] of Object.entries(profile.levels)) if (progress) levels[Number(level)] = cloneLevelProgress(progress);
  const choices = Object.fromEntries(TOWER_IDS.map((towerId) => [towerId, profile.choices[towerId]])) as CampaignProfile['choices'];
  const targeting = Object.fromEntries(TOWER_IDS.map((towerId) => [towerId, profile.targeting[towerId]])) as CampaignProfile['targeting'];
  return {
    campaignVersion: CAMPAIGN_VERSION,
    progressionVersion: PROGRESSION_VERSION,
    highestUnlockedLevel: profile.highestUnlockedLevel,
    levels,
    worldSigils: [...profile.worldSigils],
    unlockedFeatures: [...profile.unlockedFeatures],
    choices,
    targeting,
    preparationPresets: profile.preparationPresets.map(clonePreset)
  };
}

function totalStarsInLevels(levels: CampaignProfile['levels']): number {
  let stars = 0;
  for (const progress of Object.values(levels)) {
    if (!progress) continue;
    if (progress.completionStar) stars++;
    if (progress.livesStar) stars++;
    if (progress.scoreStar) stars++;
  }
  return stars;
}

export function totalMasteryStars(profile: CampaignProfile): number {
  return totalStarsInLevels(profile.levels);
}

function highestContiguousUnlockedLevel(levels: CampaignProfile['levels']): number {
  let highest = 1;
  while (highest < CAMPAIGN_LEVELS.length && levels[highest]?.completed) highest++;
  return highest;
}

function deriveSigils(profile: CampaignProfile): CampaignSigilId[] {
  const sigils = new Set(profile.worldSigils);
  for (const sigil of CAMPAIGN_SIGILS) {
    if (profile.levels[sigil.level]?.completed) sigils.add(sigil.id);
  }
  return [...sigils].sort();
}

function deriveFeatures(profile: CampaignProfile): CampaignFeatureId[] {
  const features = new Set<CampaignFeatureId>(featuresForSigils(profile.worldSigils));
  const stars = totalMasteryStars(profile);
  for (const milestone of CAMPAIGN_MILESTONES) {
    if (stars >= milestone.stars) for (const feature of milestone.unlocks) features.add(feature);
  }
  return [...features].sort();
}

function deriveProfile(profile: CampaignProfile): CampaignProfile {
  const derived: CampaignProfile = {
    ...profile,
    worldSigils: deriveSigils(profile),
    unlockedFeatures: []
  };
  derived.highestUnlockedLevel = highestContiguousUnlockedLevel(derived.levels);
  derived.unlockedFeatures = deriveFeatures(derived);
  return derived;
}

function normalizeProgress(value: unknown, level: number): CampaignLevelProgress | null {
  if (!isPlainObject(value)) return null;
  if (!hasOnlyKeys(value, ['completed', 'completionStar', 'livesStar', 'scoreStar', 'bestScore', 'bestRemainingLives'])) return null;
  const { completed, completionStar, livesStar, scoreStar, bestScore, bestRemainingLives } = value;
  if (typeof completed !== 'boolean' || typeof completionStar !== 'boolean' || typeof livesStar !== 'boolean' || typeof scoreStar !== 'boolean') return null;
  if (!isIntegerAtLeast(bestScore) || !isIntegerAtLeast(bestRemainingLives)) return null;
  if (completed !== completionStar || ((livesStar || scoreStar) && !completed)) return null;
  const definition = getCampaignLevel(level);
  if (!definition) return null;
  if (livesStar && bestRemainingLives < definition.mastery.minimumLivesForStar) return null;
  if (scoreStar && bestScore < definition.mastery.scoreTarget) return null;
  return { completed, completionStar, livesStar, scoreStar, bestScore, bestRemainingLives };
}

function normalizeChoices(value: unknown): CampaignProfile['choices'] | null {
  if (!isPlainObject(value)) return null;
  if (!hasOnlyKeys(value, TOWER_IDS)) return null;
  const choices = {} as CampaignProfile['choices'];
  for (const towerId of TOWER_IDS) {
    const id = value[towerId];
    if (id === null) {
      choices[towerId] = null;
      continue;
    }
    if (typeof id !== 'string' || !SPECIALIZATION_IDS.has(id)) return null;
    const definition = getCampaignSpecialization(id as CampaignSpecializationId);
    if (!definition || definition.towerId !== towerId) return null;
    choices[towerId] = id as CampaignSpecializationId;
  }
  return choices;
}

function normalizeTargeting(value: unknown): CampaignProfile['targeting'] | null {
  if (!isPlainObject(value)) return null;
  if (!hasOnlyKeys(value, TOWER_IDS)) return null;
  const targeting = {} as CampaignProfile['targeting'];
  for (const towerId of TOWER_IDS) {
    const mode = value[towerId];
    if (typeof mode !== 'string' || !(TARGETING_MODES as readonly string[]).includes(mode)) return null;
    targeting[towerId] = mode as TargetingMode;
  }
  return targeting;
}

function validPresetName(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 32 && !/[\u0000-\u001f]/.test(value);
}

function validPresetId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z0-9][a-z0-9_-]{0,39}$/i.test(value);
}

function normalizePreset(value: unknown): CampaignPreparationPreset | null {
  if (!isPlainObject(value) || !validPresetId(value.id) || !validPresetName(value.name)) return null;
  if (!hasOnlyKeys(value, ['id', 'name', 'choices', 'targeting'])) return null;
  const choices = normalizeChoices(value.choices);
  const targeting = normalizeTargeting(value.targeting);
  if (!choices || !targeting) return null;
  return { id: value.id, name: value.name.trim(), choices, targeting };
}

function normalizeStoredProfile(value: Record<string, unknown>): CampaignProfile | null {
  if (!hasOnlyKeys(value, ['campaignVersion', 'progressionVersion', 'highestUnlockedLevel', 'levels', 'worldSigils', 'unlockedFeatures', 'choices', 'targeting', 'preparationPresets'])) return null;
  if (value.campaignVersion !== CAMPAIGN_VERSION || value.progressionVersion !== PROGRESSION_VERSION) return null;
  if (!isIntegerAtLeast(value.highestUnlockedLevel, 1) || value.highestUnlockedLevel > CAMPAIGN_LEVELS.length) return null;
  if (!isPlainObject(value.levels) || !Array.isArray(value.worldSigils) || !Array.isArray(value.unlockedFeatures) || !Array.isArray(value.preparationPresets)) return null;
  const levels: CampaignProfile['levels'] = {};
  for (const [key, rawProgress] of Object.entries(value.levels)) {
    if (!/^(?:[1-9]|[12]\d|30)$/.test(key)) return null;
    const level = Number(key);
    const progress = normalizeProgress(rawProgress, level);
    if (!progress) return null;
    levels[level] = progress;
  }
  const worldSigils: CampaignSigilId[] = [];
  for (const id of value.worldSigils) {
    if (typeof id !== 'string' || !SIGIL_IDS.has(id)) return null;
    if (!worldSigils.includes(id as CampaignSigilId)) worldSigils.push(id as CampaignSigilId);
  }
  for (const feature of value.unlockedFeatures) {
    if (typeof feature !== 'string' || !FEATURE_IDS.has(feature)) return null;
  }
  if (value.preparationPresets.length > MAX_PREPARATION_PRESETS) return null;
  const preparationPresets: CampaignPreparationPreset[] = [];
  const presetIds = new Set<string>();
  for (const rawPreset of value.preparationPresets) {
    const preset = normalizePreset(rawPreset);
    if (!preset || presetIds.has(preset.id)) return null;
    presetIds.add(preset.id);
    preparationPresets.push(preset);
  }
  const choices = normalizeChoices(value.choices);
  const targeting = normalizeTargeting(value.targeting);
  if (!choices || !targeting) return null;
  const earnedSigils = new Set(CAMPAIGN_SIGILS.filter((sigil) => levels[sigil.level]?.completed).map((sigil) => sigil.id));
  if (worldSigils.some((sigil) => !earnedSigils.has(sigil))) return null;
  const stars = totalStarsInLevels(levels);
  if (stars < CAMPAIGN_SPECIALIZATION_UNLOCK_STARS && Object.values(choices).some((choice) => choice !== null)) return null;
  if (stars < PREPARATION_PRESET_UNLOCK_STARS && (preparationPresets.length > 0 || Object.values(targeting).some((mode) => mode !== 'first'))) return null;
  return deriveProfile({
    campaignVersion: CAMPAIGN_VERSION,
    progressionVersion: PROGRESSION_VERSION,
    highestUnlockedLevel: value.highestUnlockedLevel,
    levels,
    worldSigils,
    unlockedFeatures: [],
    choices,
    targeting,
    preparationPresets
  });
}

type ReadResult =
  | { kind: 'unavailable' | 'unreadable' | 'newer' }
  | { kind: 'absent' }
  | { kind: 'readable'; profile: CampaignProfile };

function classify(storage: CampaignStorage | null): ReadResult {
  if (!storage) return { kind: 'unavailable' };
  let raw: string | null;
  try {
    raw = storage.getItem(CAMPAIGN_STORAGE_KEY);
  } catch {
    return { kind: 'unavailable' };
  }
  if (raw === null) return { kind: 'absent' };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { kind: 'unreadable' };
  }
  if (!isPlainObject(parsed)) return { kind: 'unreadable' };
  const campaignVersion = parsed.campaignVersion;
  const progressionVersion = parsed.progressionVersion;
  if ((isIntegerAtLeast(campaignVersion, CAMPAIGN_VERSION + 1)) || (isIntegerAtLeast(progressionVersion, PROGRESSION_VERSION + 1))) return { kind: 'newer' };
  if (campaignVersion !== CAMPAIGN_VERSION || progressionVersion !== PROGRESSION_VERSION) return { kind: 'unreadable' };
  const profile = normalizeStoredProfile(parsed);
  return profile ? { kind: 'readable', profile } : { kind: 'unreadable' };
}

function mergeLevelProgress(a: CampaignLevelProgress | undefined, b: CampaignLevelProgress | undefined): CampaignLevelProgress | undefined {
  if (!a) return b ? cloneLevelProgress(b) : undefined;
  if (!b) return cloneLevelProgress(a);
  return {
    completed: a.completed || b.completed,
    completionStar: a.completionStar || b.completionStar,
    livesStar: a.livesStar || b.livesStar,
    scoreStar: a.scoreStar || b.scoreStar,
    bestScore: Math.max(a.bestScore, b.bestScore),
    bestRemainingLives: Math.max(a.bestRemainingLives, b.bestRemainingLives)
  };
}

function mergeProgress(remote: CampaignProfile, local: CampaignProfile): CampaignProfile {
  const levels: CampaignProfile['levels'] = {};
  for (let level = 1; level <= CAMPAIGN_LEVELS.length; level++) {
    const merged = mergeLevelProgress(remote.levels[level], local.levels[level]);
    if (merged) levels[level] = merged;
  }
  const worldSigils = [...new Set([...remote.worldSigils, ...local.worldSigils])].sort();
  const choices = Object.fromEntries(TOWER_IDS.map((towerId) => [towerId, remote.choices[towerId]])) as CampaignProfile['choices'];
  const targeting = Object.fromEntries(TOWER_IDS.map((towerId) => [towerId, remote.targeting[towerId]])) as CampaignProfile['targeting'];
  return deriveProfile({
    ...remote,
    levels,
    worldSigils,
    unlockedFeatures: [],
    choices,
    targeting,
    preparationPresets: remote.preparationPresets.map(clonePreset)
  });
}

function sameProgress(a: CampaignLevelProgress | undefined, b: CampaignLevelProgress | undefined): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

function samePreset(a: CampaignPreparationPreset | null | undefined, b: CampaignPreparationPreset | null | undefined): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

function sortProfile(profile: CampaignProfile): CampaignProfile {
  const sorted = deriveProfile(profile);
  const levels: CampaignProfile['levels'] = {};
  for (let level = 1; level <= CAMPAIGN_LEVELS.length; level++) {
    const progress = sorted.levels[level];
    if (progress) levels[level] = cloneLevelProgress(progress);
  }
  return {
    ...sorted,
    levels,
    worldSigils: [...sorted.worldSigils].sort(),
    unlockedFeatures: [...sorted.unlockedFeatures].sort(),
    choices: Object.fromEntries(TOWER_IDS.map((towerId) => [towerId, sorted.choices[towerId]])) as CampaignProfile['choices'],
    targeting: Object.fromEntries(TOWER_IDS.map((towerId) => [towerId, sorted.targeting[towerId]])) as CampaignProfile['targeting'],
    preparationPresets: [...sorted.preparationPresets].sort((a, b) => a.id.localeCompare(b.id)).map(clonePreset)
  };
}

function sameProfile(a: CampaignProfile, b: CampaignProfile): boolean {
  return JSON.stringify(sortProfile(a)) === JSON.stringify(sortProfile(b));
}

function sourceProfile(source: CampaignProfile | CampaignView): CampaignProfile {
  return 'profile' in source ? source.profile : source;
}

function featuresForProfile(profile: CampaignProfile): CampaignFeatureId[] {
  return deriveProfile(profile).unlockedFeatures;
}

export function isLevelUnlocked(level: number, source: CampaignProfile | CampaignView): boolean {
  if (!Number.isInteger(level) || level < 1 || level > CAMPAIGN_LEVELS.length) return false;
  return level <= highestContiguousUnlockedLevel(sourceProfile(source).levels);
}

export function isWorldUnlocked(worldId: CampaignWorldId, source: CampaignProfile | CampaignView): boolean {
  if (worldId === 'borderkeep') return true;
  const features = new Set(featuresForProfile(sourceProfile(source)));
  return worldId === 'emberfall' ? features.has('world_2') : features.has('world_3');
}

const BASE_CAMPAIGN_POWER_UPS: readonly CampaignPowerUpId[] = [
  'gold_rush', 'arcane_surge', 'emergency_repair', 'treasure_goblin', 'double_bounty', 'tower_overcharge', 'ancient_blessing'
];

export function campaignPowerUpPool(source: CampaignProfile | CampaignView): PowerUpId[] {
  const features = new Set(featuresForProfile(sourceProfile(source)));
  const pool = [...BASE_CAMPAIGN_POWER_UPS];
  if (features.has('meteor_strike_powerup')) pool.push('meteor_strike');
  if (features.has('battle_tempo_powerup')) pool.push('battle_cry');
  if (features.has('time_lock_powerup')) pool.push('time_freeze');
  return pool;
}

export class CampaignRepository {
  private readonly storage: CampaignStorage | null;
  private persisted: CampaignProfile = createEmptyCampaignProfile();
  private profile: CampaignProfile = createEmptyCampaignProfile();
  private readonly pendingLevels = new Set<number>();
  private readonly pendingChoices: Partial<Record<TowerId, CampaignSpecializationId | null>> = {};
  private readonly pendingTargeting: Partial<Record<TowerId, TargetingMode>> = {};
  private readonly pendingPresets = new Map<string, CampaignPreparationPreset | null>();
  private warning: string | null = null;

  constructor(storage: CampaignStorage | null = browserStorage()) {
    this.storage = storage;
    this.sync();
  }

  view(): CampaignView {
    this.sync();
    return {
      profile: cloneProfile(this.profile),
      totalMasteryStars: totalMasteryStars(this.profile),
      highestUnlockedLevel: this.profile.highestUnlockedLevel,
      unlockedFeatures: [...this.profile.unlockedFeatures],
      unsaved: this.hasUnsavedChanges(),
      unsavedLevels: this.unsavedLevels(),
      warning: this.warning
    };
  }

  recordClear(level: number, score: number, lives: number): CampaignClearResult | null {
    this.sync();
    const definition = getCampaignLevel(level);
    if (!definition || !isLevelUnlocked(level, this.profile) || !isIntegerAtLeast(score) || !isIntegerAtLeast(lives, 1)) return null;

    const before = this.profile;
    const oldProgress = before.levels[level] ?? emptyLevelProgress();
    const progress: CampaignLevelProgress = {
      completed: true,
      completionStar: true,
      livesStar: oldProgress.livesStar || lives >= definition.mastery.minimumLivesForStar,
      scoreStar: oldProgress.scoreStar || score >= definition.mastery.scoreTarget,
      bestScore: Math.max(oldProgress.bestScore, score),
      bestRemainingLives: Math.max(oldProgress.bestRemainingLives, lives)
    };
    const changed = !sameProgress(oldProgress, progress);
    const next = cloneProfile(before);
    next.levels[level] = progress;
    if (changed) this.pendingLevels.add(level);
    this.profile = deriveProfile(next);

    const newlyEarnedStars: CampaignStarKind[] = [];
    if (!oldProgress.completionStar && progress.completionStar) newlyEarnedStars.push('completion');
    if (!oldProgress.livesStar && progress.livesStar) newlyEarnedStars.push('lives');
    if (!oldProgress.scoreStar && progress.scoreStar) newlyEarnedStars.push('score');
    const oldSigils = new Set(before.worldSigils);
    const oldFeatures = new Set(before.unlockedFeatures);
    const newlyEarnedSigils = this.profile.worldSigils.filter((sigil) => !oldSigils.has(sigil));
    const newlyUnlockedFeatures = this.profile.unlockedFeatures.filter((feature) => !oldFeatures.has(feature));

    this.sync();
    const currentProgress = this.profile.levels[level] ?? progress;
    const unsavedLevels = this.unsavedLevels();
    return {
      level,
      progress: cloneLevelProgress(currentProgress),
      newlyEarnedStars,
      newlyEarnedSigils,
      newlyUnlockedFeatures,
      totalMasteryStars: totalMasteryStars(this.profile),
      saved: !unsavedLevels.has(level),
      warning: this.warning
    };
  }

  setSpecialization(towerId: TowerId, specializationId: CampaignSpecializationId | null): boolean {
    this.sync();
    if (!isTowerId(towerId) || totalMasteryStars(this.profile) < CAMPAIGN_SPECIALIZATION_UNLOCK_STARS) return false;
    if (specializationId !== null) {
      const specialization = getCampaignSpecialization(specializationId);
      if (!specialization || specialization.towerId !== towerId) return false;
    }
    if (this.profile.choices[towerId] === specializationId) return true;
    this.profile.choices[towerId] = specializationId;
    this.pendingChoices[towerId] = specializationId;
    this.sync();
    return true;
  }

  setPreparationTargeting(towerId: TowerId, mode: TargetingMode): boolean {
    this.sync();
    if (!isTowerId(towerId) || !TARGETING_MODES.includes(mode) || totalMasteryStars(this.profile) < PREPARATION_PRESET_UNLOCK_STARS) return false;
    if (this.profile.targeting[towerId] === mode) return true;
    this.profile.targeting[towerId] = mode;
    this.pendingTargeting[towerId] = mode;
    this.sync();
    return true;
  }

  savePreparationPreset(id: string, name: string): boolean {
    this.sync();
    if (!this.hasFeature('battle_preparation_presets') || !validPresetId(id) || !validPresetName(name)) return false;
    const existing = this.profile.preparationPresets.find((preset) => preset.id === id);
    if (!existing && this.profile.preparationPresets.length >= MAX_PREPARATION_PRESETS) return false;
    const preset: CampaignPreparationPreset = {
      id,
      name: name.trim(),
      choices: { ...this.profile.choices },
      targeting: { ...this.profile.targeting }
    };
    if (samePreset(existing, preset)) return true;
    this.profile.preparationPresets = [
      ...this.profile.preparationPresets.filter((item) => item.id !== id),
      preset
    ].sort((a, b) => a.id.localeCompare(b.id));
    this.pendingPresets.set(id, preset);
    this.sync();
    return true;
  }

  loadPreparationPreset(id: string): boolean {
    this.sync();
    if (!this.hasFeature('battle_preparation_presets')) return false;
    const preset = this.profile.preparationPresets.find((item) => item.id === id);
    if (!preset) return false;
    for (const towerId of TOWER_IDS) {
      this.profile.choices[towerId] = preset.choices[towerId];
      this.profile.targeting[towerId] = preset.targeting[towerId];
      this.pendingChoices[towerId] = preset.choices[towerId];
      this.pendingTargeting[towerId] = preset.targeting[towerId];
    }
    this.sync();
    return true;
  }

  deletePreparationPreset(id: string): boolean {
    this.sync();
    if (!this.hasFeature('battle_preparation_presets')) return false;
    if (!this.profile.preparationPresets.some((preset) => preset.id === id)) return false;
    this.profile.preparationPresets = this.profile.preparationPresets.filter((preset) => preset.id !== id);
    this.pendingPresets.set(id, null);
    this.sync();
    return true;
  }

  prepareSave(): CampaignSavePreparation {
    this.sync();
    return {
      profile: cloneProfile(this.profile),
      saved: !this.hasUnsavedChanges(),
      unsavedLevels: this.unsavedLevels(),
      warning: this.warning
    };
  }

  reconcile(): void {
    this.sync();
  }

  private hasFeature(feature: CampaignFeatureId): boolean {
    return this.profile.unlockedFeatures.includes(feature);
  }

  private hasPendingChanges(): boolean {
    return this.pendingLevels.size > 0 || Object.keys(this.pendingChoices).length > 0 || Object.keys(this.pendingTargeting).length > 0 || this.pendingPresets.size > 0;
  }

  private hasUnsavedChanges(): boolean {
    return this.hasPendingChanges() || this.unsavedLevels().size > 0;
  }

  private unsavedLevels(): ReadonlySet<number> {
    const unsaved = new Set<number>();
    for (const [key, progress] of Object.entries(this.profile.levels)) {
      const level = Number(key);
      if (!sameProgress(this.persisted.levels[level], progress)) unsaved.add(level);
    }
    return unsaved;
  }

  private applyPending(remote: CampaignProfile, local: CampaignProfile): CampaignProfile {
    const merged = mergeProgress(remote, local);
    for (const towerId of TOWER_IDS) {
      if (Object.prototype.hasOwnProperty.call(this.pendingChoices, towerId)) merged.choices[towerId] = this.pendingChoices[towerId] ?? null;
      if (Object.prototype.hasOwnProperty.call(this.pendingTargeting, towerId)) merged.targeting[towerId] = this.pendingTargeting[towerId]!;
    }
    const presets = new Map(remote.preparationPresets.map((preset) => [preset.id, clonePreset(preset)]));
    for (const [id, preset] of this.pendingPresets) {
      if (preset === null) presets.delete(id);
      else if (presets.has(id) || presets.size < MAX_PREPARATION_PRESETS) presets.set(id, clonePreset(preset));
    }
    merged.preparationPresets = [...presets.values()].sort((a, b) => a.id.localeCompare(b.id));
    return deriveProfile(merged);
  }

  private clearPersistedPending(persisted: CampaignProfile): void {
    for (const level of this.pendingLevels) {
      if (sameProgress(persisted.levels[level], this.profile.levels[level])) this.pendingLevels.delete(level);
    }
    for (const towerId of TOWER_IDS) {
      if (Object.prototype.hasOwnProperty.call(this.pendingChoices, towerId) && persisted.choices[towerId] === this.pendingChoices[towerId]) delete this.pendingChoices[towerId];
      if (Object.prototype.hasOwnProperty.call(this.pendingTargeting, towerId) && persisted.targeting[towerId] === this.pendingTargeting[towerId]) delete this.pendingTargeting[towerId];
    }
    for (const [id, preset] of this.pendingPresets) {
      const saved = persisted.preparationPresets.find((item) => item.id === id);
      if (samePreset(saved, preset)) this.pendingPresets.delete(id);
    }
  }

  private sync(): void {
    const read = classify(this.storage);
    if (read.kind === 'unavailable' || read.kind === 'unreadable' || read.kind === 'newer') {
      this.warning = read.kind === 'unavailable' ? CAMPAIGN_UNAVAILABLE_WARNING : read.kind === 'newer' ? CAMPAIGN_NEWER_WARNING : CAMPAIGN_UNREADABLE_WARNING;
      this.profile = this.applyPending(this.persisted, this.profile);
      return;
    }

    const remote = read.kind === 'readable' ? read.profile : createEmptyCampaignProfile();
    this.persisted = cloneProfile(remote);
    const desired = this.applyPending(remote, this.profile);
    this.profile = desired;
    for (let level = 1; level <= CAMPAIGN_LEVELS.length; level++) {
      if (!sameProgress(remote.levels[level], desired.levels[level])) this.pendingLevels.add(level);
    }
    if (sameProfile(remote, desired)) {
      this.clearPersistedPending(remote);
      this.warning = this.hasPendingChanges() ? CAMPAIGN_SAVE_FAILED_WARNING : null;
      return;
    }

    try {
      this.storage!.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(sortProfile(desired)));
    } catch {
      this.warning = CAMPAIGN_SAVE_FAILED_WARNING;
      return;
    }

    const afterWrite = classify(this.storage);
    if (afterWrite.kind !== 'readable') {
      this.warning = afterWrite.kind === 'newer' ? CAMPAIGN_NEWER_WARNING : afterWrite.kind === 'unavailable' ? CAMPAIGN_UNAVAILABLE_WARNING : CAMPAIGN_UNREADABLE_WARNING;
      return;
    }
    this.persisted = cloneProfile(afterWrite.profile);
    this.profile = this.applyPending(afterWrite.profile, desired);
    this.clearPersistedPending(afterWrite.profile);
    this.warning = this.hasPendingChanges() ? CAMPAIGN_SAVE_FAILED_WARNING : null;
  }
}

function browserStorage(): CampaignStorage | null {
  try {
    const storage = (globalThis as { localStorage?: Storage }).localStorage;
    return storage ?? null;
  } catch {
    return null;
  }
}

export const campaignRepository = new CampaignRepository(browserStorage());
