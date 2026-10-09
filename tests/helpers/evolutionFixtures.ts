import { EVOLUTIONS } from '../../src/game/config/evolutions.ts';
import { towerTotalInvested } from '../../src/game/config/towers.ts';
import type { BranchId, CombatTower, CombatVictim, EvolutionRank } from '../../src/shared/progression.ts';

export function tower(branch: BranchId | null = 'marksman', rank: EvolutionRank = 0, id = 1): CombatTower {
  const towerId = branch ? EVOLUTIONS[branch].towerId : 'longbow';
  const invested = towerTotalInvested(towerId, 4) + (branch ? EVOLUTIONS[branch].stats.slice(0, rank + 1).reduce((sum, s) => sum + s.cost, 0) : 0);
  return { id, towerId, x: 0, y: 0, counter: { successes: 0 }, progression: { foundationLevel: 4, branchId: branch, rank: branch ? rank : null, masteryRank: 0, invested, revision: 0 } };
}
export function victim(id = 1, x = 0, y = 0): CombatVictim {
  return { id, x, y, hp: 100000, maxHp: 100000, distanceTraveled: id, alive: true, isBoss: false, physicalArmor: 0, wardArmor: 0 };
}
