import type {
  CampaignFeatureId,
  CampaignLevelDefinition,
  CampaignMilestoneDefinition,
  CampaignSigilDefinition,
  CampaignWorldDefinition,
  CampaignWorldId
} from './types.ts';

export const CAMPAIGN_WORLDS: readonly CampaignWorldDefinition[] = [
  {
    id: 'borderkeep', worldNumber: 1, name: 'The Borderkeep', levelStart: 1, levelEnd: 10,
    bossLevel: 10, bossEnemyId: 'hollow_warden', sigilId: 'border_sigil', visualThemeId: 'borderkeep_forest'
  },
  {
    id: 'emberfall', worldNumber: 2, name: 'Emberfall Highlands', levelStart: 11, levelEnd: 20,
    bossLevel: 20, bossEnemyId: 'cinder_colossus', sigilId: 'ember_sigil', visualThemeId: 'emberfall_volcanic'
  },
  {
    id: 'frostveil', worldNumber: 3, name: 'Frostveil Pass', levelStart: 21, levelEnd: 30,
    bossLevel: 30, bossEnemyId: 'frostbound_matriarch', sigilId: 'frost_sigil', visualThemeId: 'frostveil_mountain'
  }
];

export const CAMPAIGN_MILESTONES: readonly CampaignMilestoneDefinition[] = [
  { stars: 10, unlocks: ['aether_codex_tactics'] },
  { stars: 20, unlocks: ['battle_preparation_presets'] },
  { stars: 30, unlocks: ['tower_specialization_i'] },
  { stars: 45, unlocks: ['one_powerup_reroll_per_level'] },
  { stars: 60, unlocks: ['tower_visual_tier_iii'] },
  { stars: 75, unlocks: ['veteran_banner', 'advanced_codex_stats'] },
  { stars: 90, unlocks: ['frostveil_conqueror_crest'] }
];

export const CAMPAIGN_SIGILS: readonly CampaignSigilDefinition[] = [
  {
    id: 'border_sigil', level: 10,
    unlocks: ['world_2', 'tower_visual_tier_ii', 'hollow_warden_codex_entry', 'meteor_strike_powerup']
  },
  {
    id: 'ember_sigil', level: 20,
    unlocks: ['world_3', 'emberfall_cosmetics', 'cinder_colossus_codex_entry', 'battle_tempo_powerup']
  },
  {
    id: 'frost_sigil', level: 30,
    unlocks: ['worlds_1_3_milestone_complete', 'frostveil_cosmetics', 'frostbound_matriarch_codex_entry', 'time_lock_powerup']
  }
];

type LevelSeed = Omit<CampaignLevelDefinition, 'level' | 'difficultyRating' | 'waveProfileId'>;

// Campaign starter data copied from the expansion pack. The source omits a
// display rating and battle-profile ID; rating is derived from each world's
// ten-level arc, while the stable profile ID is `campaign_level_<level>`.
const LEVEL_SEEDS: readonly LevelSeed[] = [
  { worldId: 'borderkeep', mapLayoutId: 'borderkeep_a', enemyIds: ['marchling'], bossEnemyId: null, mastery: { minimumLivesForStar: 12, scoreTarget: 1950 }, warnings: [] },
  { worldId: 'borderkeep', mapLayoutId: 'borderkeep_a2', enemyIds: ['marchling', 'skitter'], bossEnemyId: null, mastery: { minimumLivesForStar: 12, scoreTarget: 2400 }, warnings: ['fast'] },
  { worldId: 'borderkeep', mapLayoutId: 'borderkeep_a3', enemyIds: ['skitter', 'marchling'], bossEnemyId: null, mastery: { minimumLivesForStar: 12, scoreTarget: 2850 }, warnings: ['fast'] },
  { worldId: 'borderkeep', mapLayoutId: 'borderkeep_b', enemyIds: ['marchling', 'stoneback'], bossEnemyId: null, mastery: { minimumLivesForStar: 12, scoreTarget: 3300 }, warnings: ['high_hp'] },
  { worldId: 'borderkeep', mapLayoutId: 'borderkeep_b2', enemyIds: ['ironhide', 'marchling'], bossEnemyId: null, mastery: { minimumLivesForStar: 12, scoreTarget: 3750 }, warnings: ['physical_resistance'] },
  { worldId: 'borderkeep', mapLayoutId: 'borderkeep_b3', enemyIds: ['skitter', 'stoneback', 'ironhide'], bossEnemyId: null, mastery: { minimumLivesForStar: 12, scoreTarget: 4200 }, warnings: ['fast', 'physical_resistance'] },
  { worldId: 'borderkeep', mapLayoutId: 'borderkeep_c', enemyIds: ['veilborn', 'marchling'], bossEnemyId: null, mastery: { minimumLivesForStar: 12, scoreTarget: 4650 }, warnings: ['arcane_resistance'] },
  { worldId: 'borderkeep', mapLayoutId: 'borderkeep_c2', enemyIds: ['ironhide', 'veilborn', 'stoneback'], bossEnemyId: null, mastery: { minimumLivesForStar: 12, scoreTarget: 5100 }, warnings: ['mixed_resistance'] },
  { worldId: 'borderkeep', mapLayoutId: 'borderkeep_c3', enemyIds: ['marchling', 'skitter', 'stoneback', 'ironhide', 'veilborn'], bossEnemyId: null, mastery: { minimumLivesForStar: 12, scoreTarget: 5550 }, warnings: ['world_mix'] },
  { worldId: 'borderkeep', mapLayoutId: 'borderkeep_d_boss', enemyIds: ['marchling', 'skitter'], bossEnemyId: 'hollow_warden', mastery: { minimumLivesForStar: 10, scoreTarget: 6000 }, warnings: ['boss'] },
  { worldId: 'emberfall', mapLayoutId: 'emberfall_a', enemyIds: ['cinderling'], bossEnemyId: null, mastery: { minimumLivesForStar: 11, scoreTarget: 5700 }, warnings: [] },
  { worldId: 'emberfall', mapLayoutId: 'emberfall_a2', enemyIds: ['cinderling', 'ashrunner'], bossEnemyId: null, mastery: { minimumLivesForStar: 11, scoreTarget: 6400 }, warnings: ['fast'] },
  { worldId: 'emberfall', mapLayoutId: 'emberfall_a3', enemyIds: ['ashrunner', 'cinderling', 'ember_brute'], bossEnemyId: null, mastery: { minimumLivesForStar: 11, scoreTarget: 7100 }, warnings: ['fast', 'high_hp'] },
  { worldId: 'emberfall', mapLayoutId: 'emberfall_b', enemyIds: ['magmahide', 'cinderling'], bossEnemyId: null, mastery: { minimumLivesForStar: 11, scoreTarget: 7800 }, warnings: ['physical_resistance'] },
  { worldId: 'emberfall', mapLayoutId: 'emberfall_b2', enemyIds: ['ember_brute', 'ashrunner'], bossEnemyId: null, mastery: { minimumLivesForStar: 11, scoreTarget: 8500 }, warnings: ['high_hp', 'fast'] },
  { worldId: 'emberfall', mapLayoutId: 'emberfall_b3', enemyIds: ['ashcaller', 'cinderling', 'ashrunner'], bossEnemyId: null, mastery: { minimumLivesForStar: 11, scoreTarget: 9200 }, warnings: ['support'] },
  { worldId: 'emberfall', mapLayoutId: 'emberfall_c', enemyIds: ['magmahide', 'ashcaller', 'ember_brute'], bossEnemyId: null, mastery: { minimumLivesForStar: 11, scoreTarget: 9900 }, warnings: ['armor', 'support'] },
  { worldId: 'emberfall', mapLayoutId: 'emberfall_c2', enemyIds: ['cinderling', 'ashrunner', 'magmahide', 'ember_brute', 'ashcaller'], bossEnemyId: null, mastery: { minimumLivesForStar: 11, scoreTarget: 10600 }, warnings: ['world_mix'] },
  { worldId: 'emberfall', mapLayoutId: 'emberfall_c3', enemyIds: ['ashrunner', 'magmahide', 'ember_brute', 'ashcaller'], bossEnemyId: null, mastery: { minimumLivesForStar: 11, scoreTarget: 11300 }, warnings: ['elite_mix'] },
  { worldId: 'emberfall', mapLayoutId: 'emberfall_d_boss', enemyIds: ['cinderling', 'ashrunner', 'ashcaller'], bossEnemyId: 'cinder_colossus', mastery: { minimumLivesForStar: 9, scoreTarget: 12000 }, warnings: ['boss'] },
  { worldId: 'frostveil', mapLayoutId: 'frostveil_a', enemyIds: ['icebound', 'snowstalker'], bossEnemyId: null, mastery: { minimumLivesForStar: 10, scoreTarget: 12950 }, warnings: ['fast'] },
  { worldId: 'frostveil', mapLayoutId: 'frostveil_a2', enemyIds: ['snowstalker', 'icebound'], bossEnemyId: null, mastery: { minimumLivesForStar: 10, scoreTarget: 13900 }, warnings: ['fast'] },
  { worldId: 'frostveil', mapLayoutId: 'frostveil_a3', enemyIds: ['frostback', 'icebound'], bossEnemyId: null, mastery: { minimumLivesForStar: 10, scoreTarget: 14850 }, warnings: ['high_hp'] },
  { worldId: 'frostveil', mapLayoutId: 'frostveil_b', enemyIds: ['glacier_knight', 'snowstalker'], bossEnemyId: null, mastery: { minimumLivesForStar: 10, scoreTarget: 15800 }, warnings: ['slow_resistance'] },
  { worldId: 'frostveil', mapLayoutId: 'frostveil_b2', enemyIds: ['frost_shaman', 'icebound'], bossEnemyId: null, mastery: { minimumLivesForStar: 10, scoreTarget: 16750 }, warnings: ['support'] },
  { worldId: 'frostveil', mapLayoutId: 'frostveil_b3', enemyIds: ['frostback', 'glacier_knight'], bossEnemyId: null, mastery: { minimumLivesForStar: 10, scoreTarget: 17700 }, warnings: ['high_hp', 'slow_resistance'] },
  { worldId: 'frostveil', mapLayoutId: 'frostveil_c', enemyIds: ['frost_shaman', 'snowstalker', 'glacier_knight'], bossEnemyId: null, mastery: { minimumLivesForStar: 10, scoreTarget: 18650 }, warnings: ['support', 'slow_resistance'] },
  { worldId: 'frostveil', mapLayoutId: 'frostveil_c2', enemyIds: ['snowstalker', 'icebound', 'frostback', 'glacier_knight', 'frost_shaman'], bossEnemyId: null, mastery: { minimumLivesForStar: 10, scoreTarget: 19600 }, warnings: ['world_mix'] },
  { worldId: 'frostveil', mapLayoutId: 'frostveil_c3', enemyIds: ['snowstalker', 'frostback', 'glacier_knight', 'frost_shaman'], bossEnemyId: null, mastery: { minimumLivesForStar: 10, scoreTarget: 20550 }, warnings: ['elite_mix'] },
  { worldId: 'frostveil', mapLayoutId: 'frostveil_d_boss', enemyIds: ['icebound', 'snowstalker', 'frost_shaman'], bossEnemyId: 'frostbound_matriarch', mastery: { minimumLivesForStar: 8, scoreTarget: 21500 }, warnings: ['boss'] }
];

function difficultyFor(level: number): 1 | 2 | 3 | 4 | 5 {
  const positionInWorld = ((level - 1) % 10) + 1;
  return Math.ceil(positionInWorld / 2) as 1 | 2 | 3 | 4 | 5;
}

export const CAMPAIGN_LEVELS: readonly CampaignLevelDefinition[] = LEVEL_SEEDS.map((seed, index) => {
  const level = index + 1;
  return {
    ...seed,
    level,
    difficultyRating: difficultyFor(level),
    waveProfileId: `campaign_level_${level}`
  };
});

export function getCampaignLevel(level: number): CampaignLevelDefinition | null {
  if (!Number.isInteger(level) || level < 1 || level > CAMPAIGN_LEVELS.length) return null;
  return CAMPAIGN_LEVELS[level - 1] ?? null;
}

export function getCampaignWorld(id: CampaignWorldId): CampaignWorldDefinition {
  return CAMPAIGN_WORLDS.find((world) => world.id === id)!;
}

export function featuresForSigils(sigils: readonly string[]): CampaignFeatureId[] {
  const features = new Set<CampaignFeatureId>();
  for (const sigil of CAMPAIGN_SIGILS) {
    if (sigils.includes(sigil.id)) for (const feature of sigil.unlocks) features.add(feature);
  }
  return [...features].sort();
}
