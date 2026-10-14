import { ENEMIES } from '../config/enemies.ts';
import type { EnemyArchetype, EnemyConfig } from '../../shared/types.ts';

export const CAMPAIGN_STATUS_TUNING = { supportSlowResistance: 0.4, supportSpeedMultiplier: 1.22 } as const;

export interface CampaignEnemyConfig extends Omit<EnemyConfig, 'id'> {
  id: string;
  visualArchetype: EnemyArchetype;
  slowResistance: number;
}

function enemy(id: string, name: string, visualArchetype: EnemyArchetype, changes: Partial<CampaignEnemyConfig> = {}): CampaignEnemyConfig {
  return { ...ENEMIES[visualArchetype], id, name, regenPerSecond: 0, visualArchetype, slowResistance: 0, ...changes };
}

// Run-local campaign definitions never overwrite classic archetypes or scaling.
export const CAMPAIGN_ENEMIES: Readonly<Record<string, CampaignEnemyConfig>> = {
  marchling: enemy('marchling', 'Marchling', 'thornling'),
  skitter: enemy('skitter', 'Skitter', 'swiftwisp'),
  stoneback: enemy('stoneback', 'Stoneback', 'cragback'),
  ironhide: enemy('ironhide', 'Ironhide', 'ironbark'),
  veilborn: enemy('veilborn', 'Veilborn', 'runescale'),
  cinderling: enemy('cinderling', 'Cinderling', 'thornling', { baseHp: 75, baseReward: 9 }),
  ashrunner: enemy('ashrunner', 'Ashrunner', 'swiftwisp', { baseHp: 42, baseSpeed: 132, baseReward: 8 }),
  magmahide: enemy('magmahide', 'Magmahide', 'ironbark', { baseHp: 180, baseReward: 14 }),
  ember_brute: enemy('ember_brute', 'Ember Brute', 'cragback', { baseHp: 310, baseReward: 20 }),
  ashcaller: enemy('ashcaller', 'Ashcaller', 'mossmaw', { baseHp: 120, baseSpeed: 58, baseReward: 18, isElite: true }),
  snowstalker: enemy('snowstalker', 'Snowstalker', 'swiftwisp', { baseHp: 48, baseSpeed: 135, baseReward: 9 }),
  icebound: enemy('icebound', 'Icebound', 'thornling', { baseHp: 85, baseReward: 10 }),
  frostback: enemy('frostback', 'Frostback', 'cragback', { baseHp: 340, baseReward: 22 }),
  glacier_knight: enemy('glacier_knight', 'Glacier Knight', 'ironbark', { baseHp: 195, baseSpeed: 57, baseReward: 16, slowResistance: 0.5 }),
  frost_shaman: enemy('frost_shaman', 'Frost Shaman', 'mossmaw', { baseHp: 140, baseSpeed: 57, baseReward: 20, isElite: true }),
  hollow_warden: enemy('hollow_warden', 'The Hollow Warden', 'warlord', { baseHp: 2600, baseSpeed: 40, baseReward: 180 }),
  cinder_colossus: enemy('cinder_colossus', 'Cinder Colossus', 'warlord', { baseHp: 4200, baseSpeed: 32, baseReward: 240, physicalArmor: 0.65, wardArmor: 0.35 }),
  frostbound_matriarch: enemy('frostbound_matriarch', 'Frostbound Matriarch', 'warlord', { baseHp: 5200, baseSpeed: 38, baseReward: 300, slowResistance: 0.6 }),
  // World 4 uses five distinct combat roles: basic, runner, brute, armor and support.
  bogling: enemy('bogling', 'Bogling', 'thornling', { baseHp: 84, baseSpeed: 72, baseReward: 11 }),
  fen_skitter: enemy('fen_skitter', 'Fen Skitter', 'swiftwisp', { baseHp: 50, baseSpeed: 152, baseReward: 12 }),
  mossguard: enemy('mossguard', 'Mossguard', 'cragback', { baseHp: 260, baseSpeed: 46, baseReward: 24, physicalArmor: 0.12, isElite: true }),
  rotback: enemy('rotback', 'Rotback', 'ironbark', { baseHp: 190, baseSpeed: 54, baseReward: 20, physicalArmor: 0.42 }),
  rootwretch: enemy('rootwretch', 'Rootwretch', 'mossmaw', { baseHp: 190, baseSpeed: 58, baseReward: 23, isElite: true, wardArmor: 0.15 }),
  mireheart_hydra: enemy('mireheart_hydra', 'Mireheart Hydra', 'warlord', { baseHp: 6200, baseSpeed: 36, baseReward: 360, isBoss: true, isElite: true, livesLost: 5, physicalArmor: 0.2, wardArmor: 0.15, radius: 22 }),

  // Later-world profiles are catalog registrations only; their boss mechanics remain gated.
  tideborn: enemy('tideborn', 'Tideborn', 'thornling', { baseHp: 65, baseSpeed: 62, baseReward: 13 }),
  crystal_wisp: enemy('crystal_wisp', 'Crystal Wisp', 'swiftwisp', { baseHp: 66, baseSpeed: 100, baseReward: 14 }),
  deepcrawler: enemy('deepcrawler', 'Deepcrawler', 'cragback', { baseHp: 300, baseSpeed: 45, baseReward: 28, physicalArmor: 0.12, isElite: true }),
  relic_guardian: enemy('relic_guardian', 'Relic Guardian', 'ironbark', { baseHp: 180, baseSpeed: 45, baseReward: 24, physicalArmor: 0.5 }),
  aetherbound: enemy('aetherbound', 'Aetherbound', 'mossmaw', { baseHp: 190, baseSpeed: 57, baseReward: 28, isElite: true, wardArmor: 0.2 }),
  drowned_oracle: enemy('drowned_oracle', 'Drowned Oracle', 'warlord', { baseHp: 7600, baseSpeed: 34, baseReward: 430, isBoss: true, isElite: true, livesLost: 5, physicalArmor: 0.22, wardArmor: 0.2, radius: 22 }),

  scrapling: enemy('scrapling', 'Scrapling', 'thornling', { baseHp: 90, baseSpeed: 70, baseReward: 15 }),
  furnace_hound: enemy('furnace_hound', 'Furnace Hound', 'swiftwisp', { baseHp: 60, baseSpeed: 105, baseReward: 17 }),
  siege_golem: enemy('siege_golem', 'Siege Golem', 'cragback', { baseHp: 250, baseSpeed: 43, baseReward: 35, physicalArmor: 0.18, isElite: true }),
  ironbound: enemy('ironbound', 'Ironbound', 'ironbark', { baseHp: 170, baseSpeed: 51, baseReward: 29, physicalArmor: 0.56 }),
  foundry_core: enemy('foundry_core', 'Foundry Core', 'mossmaw', { baseHp: 140, baseSpeed: 54, baseReward: 34, isElite: true, wardArmor: 0.24 }),
  iron_tyrant: enemy('iron_tyrant', 'Iron Tyrant', 'warlord', { baseHp: 6500, baseSpeed: 28, baseReward: 520, isBoss: true, isElite: true, livesLost: 5, physicalArmor: 0.3, wardArmor: 0.2, radius: 23 }),

  cloud_skitter: enemy('cloud_skitter', 'Cloud Skitter', 'thornling', { baseHp: 85, baseSpeed: 75, baseReward: 17 }),
  galeclaw: enemy('galeclaw', 'Galeclaw', 'swiftwisp', { baseHp: 70, baseSpeed: 90, baseReward: 20 }),
  aether_drake: enemy('aether_drake', 'Aether Drake', 'cragback', { baseHp: 230, baseSpeed: 52, baseReward: 42, physicalArmor: 0.18, wardArmor: 0.1, isElite: true }),
  stormguard: enemy('stormguard', 'Stormguard', 'ironbark', { baseHp: 160, baseSpeed: 55, baseReward: 34, physicalArmor: 0.5 }),
  tempest_herald: enemy('tempest_herald', 'Tempest Herald', 'mossmaw', { baseHp: 140, baseSpeed: 62, baseReward: 40, isElite: true, wardArmor: 0.26 }),
  stormmaw_prime: enemy('stormmaw_prime', 'Stormmaw Prime', 'warlord', { baseHp: 7000, baseSpeed: 30, baseReward: 650, isBoss: true, isElite: true, livesLost: 5, physicalArmor: 0.25, wardArmor: 0.2, radius: 24 }),

  shadeborn: enemy('shadeborn', 'Shadeborn', 'thornling', { baseHp: 75, baseSpeed: 50, baseReward: 19 }),
  dusk_runner: enemy('dusk_runner', 'Dusk Runner', 'swiftwisp', { baseHp: 55, baseSpeed: 65, baseReward: 22 }),
  moonstalker: enemy('moonstalker', 'Moonstalker', 'cragback', { baseHp: 190, baseSpeed: 48, baseReward: 48, physicalArmor: 0.2, wardArmor: 0.12, isElite: true }),
  grave_hulk: enemy('grave_hulk', 'Grave Hulk', 'ironbark', { baseHp: 150, baseSpeed: 50, baseReward: 38, physicalArmor: 0.52 }),
  echo_shade: enemy('echo_shade', 'Echo Shade', 'mossmaw', { baseHp: 110, baseSpeed: 60, baseReward: 45, isElite: true, wardArmor: 0.3 }),
  umbral_regent: enemy('umbral_regent', 'Umbral Regent', 'warlord', { baseHp: 6000, baseSpeed: 28, baseReward: 780, isBoss: true, isElite: true, livesLost: 5, physicalArmor: 0.28, wardArmor: 0.25, radius: 24 }),

  riftling: enemy('riftling', 'Riftling', 'thornling', { baseHp: 65, baseSpeed: 58, baseReward: 21 }),
  phase_hound: enemy('phase_hound', 'Phase Hound', 'swiftwisp', { baseHp: 55, baseSpeed: 66, baseReward: 24 }),
  astral_horror: enemy('astral_horror', 'Astral Horror', 'cragback', { baseHp: 270, baseSpeed: 50, baseReward: 56, physicalArmor: 0.22, wardArmor: 0.18, isElite: true }),
  voidplate: enemy('voidplate', 'Voidplate', 'ironbark', { baseHp: 180, baseSpeed: 52, baseReward: 44, physicalArmor: 0.58 }),
  rift_weaver: enemy('rift_weaver', 'Rift Weaver', 'mossmaw', { baseHp: 160, baseSpeed: 63, baseReward: 52, isElite: true, wardArmor: 0.34 }),
  rift_sovereign: enemy('rift_sovereign', 'Rift Sovereign', 'warlord', { baseHp: 4500, baseSpeed: 26, baseReward: 920, isBoss: true, isElite: true, livesLost: 5, physicalArmor: 0.3, wardArmor: 0.28, radius: 25 }),

  aetherborn: enemy('aetherborn', 'Aetherborn', 'thornling', { baseHp: 58, baseSpeed: 60, baseReward: 23 }),
  crown_runner: enemy('crown_runner', 'Crown Runner', 'swiftwisp', { baseHp: 55, baseSpeed: 80, baseReward: 26 }),
  aether_seer: enemy('aether_seer', 'Aether Seer', 'cragback', { baseHp: 200, baseSpeed: 52, baseReward: 66, physicalArmor: 0.24, wardArmor: 0.2, isElite: true }),
  sentry_colossus: enemy('sentry_colossus', 'Sentry Colossus', 'ironbark', { baseHp: 120, baseSpeed: 54, baseReward: 52, physicalArmor: 0.6 }),
  crown_archon: enemy('crown_archon', 'Crown Archon', 'mossmaw', { baseHp: 130, baseSpeed: 66, baseReward: 60, isElite: true, wardArmor: 0.38 }),
  aether_devourer: enemy('aether_devourer', 'Aether Devourer', 'warlord', { baseHp: 5000, baseSpeed: 22, baseReward: 1200, isBoss: true, isElite: true, livesLost: 5, physicalArmor: 0.32, wardArmor: 0.3, radius: 26 })
};

export function getCampaignEnemy(id: string): CampaignEnemyConfig {
  const config = Object.prototype.hasOwnProperty.call(CAMPAIGN_ENEMIES, id) ? CAMPAIGN_ENEMIES[id] : undefined;
  if (!config) throw new Error(`Unknown campaign enemy: ${id}`);
  return config;
}

export function isClassicEnemy(id: string): id is EnemyArchetype {
  return Object.prototype.hasOwnProperty.call(ENEMIES, id);
}
