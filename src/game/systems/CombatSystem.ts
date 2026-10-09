import type { DamageType, TargetingMode } from '../../shared/types.ts';

// Damage after armor. Pure + testable.
// SPEC §11 taxonomy: Physical / Arcane / Elemental.
// - Physical is reduced by physicalArmor (plate works vs arrows and shells).
// - Arcane is reduced by wardArmor (wards work vs pure magic).
// - Elemental (frost/storm utility) partially pierces wards.
export function applyArmor(rawDamage: number, damageType: DamageType, physicalArmor: number, wardArmor: number): number {
  let mult = 1;
  if (damageType === 'physical') mult = 1 - physicalArmor;
  else if (damageType === 'arcane') mult = 1 - wardArmor;
  else mult = 1 - wardArmor * 0.5;
  return Math.max(1, Math.round(rawDamage * mult));
}

export interface TargetCandidate {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  distanceTraveled: number;
}

export function pickTarget(
  candidates: TargetCandidate[],
  towerX: number,
  towerY: number,
  range: number,
  mode: TargetingMode
): TargetCandidate | null {
  const inRange = candidates.filter((c) => {
    const dx = c.x - towerX;
    const dy = c.y - towerY;
    return dx * dx + dy * dy <= range * range;
  });
  if (inRange.length === 0) return null;
  const dist = (c: TargetCandidate) => (c.x - towerX) ** 2 + (c.y - towerY) ** 2;
  switch (mode) {
    case 'first':
      return inRange.reduce((a, b) => (b.distanceTraveled > a.distanceTraveled ? b : a));
    case 'last':
      return inRange.reduce((a, b) => (b.distanceTraveled < a.distanceTraveled ? b : a));
    case 'strongest':
      return inRange.reduce((a, b) => (b.hp > a.hp ? b : a));
    case 'weakest':
      return inRange.reduce((a, b) => (b.hp < a.hp ? b : a));
    case 'closest':
      return inRange.reduce((a, b) => (dist(b) < dist(a) ? b : a));
  }
}
