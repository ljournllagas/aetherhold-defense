import type { TowerConfig } from '../../shared/types.ts';
import { SELL_REFUND_RATE } from './towers.ts';

// Extension roster — does NOT modify the classic 5-tower balance.
// Approved in grill 2026-10-15: gap-fill, 2 towers, full parity, sidegrade-only.
// Enablement path: merge ADDITIONAL_TOWER_IDS into TOWER_IDS + extend
// TowerId/BranchId unions + register art/manifest entries. Until then classic
// tests asserting exactly 5 towers / 10 branches stay green.
export type AdditionalTowerId = 'sentinel' | 'cinder';

export const ADDITIONAL_TOWERS: Record<AdditionalTowerId, TowerConfig> = {
  sentinel: {
    id: 'sentinel',
    name: 'Sentinel',
    description: 'Slow execution bolts. Hunts bosses, weak vs packs.',
    role: 'EXEC',
    color: 0xd7aa4e,
    damageType: 'physical',
    assetKey: 'tower_longbow',
    audioKey: 'shoot',
    projectileSpeed: 430,
    sellRefundRate: SELL_REFUND_RATE,
    levels: [
      { damage: 30, range: 150, attackInterval: 1.4, damageType: 'physical', cost: 150 },
      { damage: 55, range: 155, attackInterval: 1.3, damageType: 'physical', cost: 135 },
      { damage: 105, range: 165, attackInterval: 1.15, damageType: 'physical', cost: 270 },
      { damage: 210, range: 180, attackInterval: 1.0, damageType: 'physical', cost: 480 }
    ]
  },
  cinder: {
    id: 'cinder',
    name: 'Cinder',
    description: 'Ember pools deny zones. Weak direct hit, strong field.',
    role: 'ZONE',
    color: 0xde8742,
    damageType: 'elemental',
    assetKey: 'tower_ember',
    audioKey: 'cannon',
    projectileSpeed: 260,
    sellRefundRate: SELL_REFUND_RATE,
    levels: [
      { damage: 12, range: 130, attackInterval: 1.6, damageType: 'elemental', splashRadius: 60, cost: 150 },
      { damage: 22, range: 138, attackInterval: 1.5, damageType: 'elemental', splashRadius: 66, cost: 130 },
      { damage: 42, range: 148, attackInterval: 1.35, damageType: 'elemental', splashRadius: 74, cost: 250 },
      { damage: 88, range: 162, attackInterval: 1.2, damageType: 'elemental', splashRadius: 88, cost: 470 }
    ]
  }
};

export const ADDITIONAL_TOWER_IDS: readonly AdditionalTowerId[] = ['sentinel', 'cinder'];

export function additionalTowerTotalInvested(towerId: AdditionalTowerId, level: number): number {
  const t = ADDITIONAL_TOWERS[towerId];
  let sum = 0;
  for (let i = 0; i < level && i < t.levels.length; i++) sum += t.levels[i].cost;
  return sum;
}

// Foundation totals: sentinel 1035, cinder 1000 — both in 870-1110 sidegrade band.
