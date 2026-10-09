import type { TowerConfig } from '../../shared/types.ts';
import type { TowerId } from '../../shared/progression.ts';

// Original towers of the Aetherhold universe. All balance lives here.
export const SELL_REFUND_RATE = 0.7;

export const TOWERS: Record<string, TowerConfig> = {
  longbow: {
    id: 'longbow',
    name: 'Ranger',
    description: 'Fast physical arrows. Reliable vs Thornlings.',
    role: 'DPS',
    color: 0x4caf50,
    damageType: 'physical',
    assetKey: 'tower_longbow',
    audioKey: 'shoot',
    projectileSpeed: 430,
    sellRefundRate: SELL_REFUND_RATE,
    levels: [
      { damage: 12, range: 150, attackInterval: 0.55, damageType: 'physical', cost: 100 },
      { damage: 22, range: 160, attackInterval: 0.5, damageType: 'physical', cost: 90 },
      { damage: 40, range: 175, attackInterval: 0.42, damageType: 'physical', cost: 180 },
      { damage: 85, range: 195, attackInterval: 0.32, damageType: 'physical', cost: 340 }
    ]
  },
  ember: {
    id: 'ember',
    name: 'Bombard',
    description: 'Slow siege shells, splash damage. Crushes packs.',
    role: 'AOE',
    color: 0xff7043,
    damageType: 'physical',
    assetKey: 'tower_ember',
    audioKey: 'cannon',
    projectileSpeed: 260,
    sellRefundRate: SELL_REFUND_RATE,
    levels: [
      { damage: 30, range: 135, attackInterval: 1.6, damageType: 'physical', splashRadius: 55, cost: 150 },
      { damage: 55, range: 140, attackInterval: 1.5, damageType: 'physical', splashRadius: 62, cost: 130 },
      { damage: 100, range: 150, attackInterval: 1.35, damageType: 'physical', splashRadius: 72, cost: 260 },
      { damage: 200, range: 165, attackInterval: 1.15, damageType: 'physical', splashRadius: 90, cost: 480 }
    ]
  },
  glacier: {
    id: 'glacier',
    name: 'Frost',
    description: 'Chilling bolts slow the Gloomtide.',
    role: 'SLOW',
    color: 0x4fc3f7,
    damageType: 'elemental',
    assetKey: 'tower_glacier',
    audioKey: 'frost',
    projectileSpeed: 380,
    sellRefundRate: SELL_REFUND_RATE,
    levels: [
      { damage: 8, range: 130, attackInterval: 0.9, damageType: 'elemental', slowFactor: 0.35, slowDuration: 1.6, cost: 120 },
      { damage: 14, range: 140, attackInterval: 0.85, damageType: 'elemental', slowFactor: 0.4, slowDuration: 1.8, cost: 110 },
      { damage: 26, range: 150, attackInterval: 0.75, damageType: 'elemental', slowFactor: 0.5, slowDuration: 2.2, cost: 220 },
      { damage: 55, range: 165, attackInterval: 0.6, damageType: 'elemental', slowFactor: 0.6, slowDuration: 2.8, cost: 420 }
    ]
  },
  starfire: {
    id: 'starfire',
    name: 'Arcane',
    description: 'High arcane damage. Pierces Ironbark plate.',
    role: 'ARCANE',
    color: 0xba68c8,
    damageType: 'arcane',
    assetKey: 'tower_starfire',
    audioKey: 'shoot',
    projectileSpeed: 340,
    sellRefundRate: SELL_REFUND_RATE,
    levels: [
      { damage: 26, range: 145, attackInterval: 1.1, damageType: 'arcane', cost: 140 },
      { damage: 48, range: 152, attackInterval: 1.0, damageType: 'arcane', cost: 125 },
      { damage: 92, range: 162, attackInterval: 0.9, damageType: 'arcane', cost: 250 },
      { damage: 190, range: 178, attackInterval: 0.75, damageType: 'arcane', cost: 460 }
    ]
  },
  tempest: {
    id: 'tempest',
    name: 'Tempest',
    description: 'Chain lightning strikes up to N foes.',
    role: 'CHAIN',
    color: 0xffee58,
    damageType: 'elemental',
    assetKey: 'tower_tempest',
    audioKey: 'zap',
    projectileSpeed: 430,
    sellRefundRate: SELL_REFUND_RATE,
    levels: [
      { damage: 14, range: 140, attackInterval: 1.0, damageType: 'elemental', chainCount: 3, cost: 160 },
      { damage: 24, range: 148, attackInterval: 0.95, damageType: 'elemental', chainCount: 4, cost: 150 },
      { damage: 44, range: 158, attackInterval: 0.85, damageType: 'elemental', chainCount: 5, cost: 280 },
      { damage: 95, range: 175, attackInterval: 0.7, damageType: 'elemental', chainCount: 7, cost: 520 }
    ]
  }
};

export const TOWER_LIST = Object.values(TOWERS);

export const TOWER_IDS: readonly TowerId[] = ['longbow', 'ember', 'glacier', 'starfire', 'tempest'];

export function isTowerId(value: string): value is TowerId {
  return (TOWER_IDS as readonly string[]).includes(value);
}

export function towerLevelCost(towerId: string, level: number): number {
  // level is 1-based target level; lvl1 = build cost
  const t = TOWERS[towerId];
  if (!t) return 0;
  const idx = Math.max(0, Math.min(level - 1, t.levels.length - 1));
  return t.levels[idx].cost;
}

export function towerTotalInvested(towerId: string, level: number): number {
  const t = TOWERS[towerId];
  if (!t) return 0;
  let sum = 0;
  for (let i = 0; i < level && i < t.levels.length; i++) sum += t.levels[i].cost;
  return sum;
}

export function towerSellValue(towerId: string, level: number): number {
  return refundForInvested(towerTotalInvested(towerId, level));
}

export function refundForInvested(invested: number): number {
  return Math.floor(invested * Math.round(SELL_REFUND_RATE * 100) / 100);
}
