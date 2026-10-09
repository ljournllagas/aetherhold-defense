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
  frostbound_matriarch: enemy('frostbound_matriarch', 'Frostbound Matriarch', 'warlord', { baseHp: 5200, baseSpeed: 38, baseReward: 300, slowResistance: 0.6 })
};

export function getCampaignEnemy(id: string): CampaignEnemyConfig {
  const config = Object.prototype.hasOwnProperty.call(CAMPAIGN_ENEMIES, id) ? CAMPAIGN_ENEMIES[id] : undefined;
  if (!config) throw new Error(`Unknown campaign enemy: ${id}`);
  return config;
}

export function isClassicEnemy(id: string): id is EnemyArchetype {
  return Object.prototype.hasOwnProperty.call(ENEMIES, id);
}
