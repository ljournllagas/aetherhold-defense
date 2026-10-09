import { DIFFICULTIES } from '../../src/game/config/difficulties.ts';
import { ENEMIES } from '../../src/game/config/enemies.ts';
import { EVOLUTIONS, STARTER_BRANCH } from '../../src/game/config/evolutions.ts';
import { TOWERS, TOWER_IDS, towerTotalInvested } from '../../src/game/config/towers.ts';
import { killReward, waveClearBonus } from '../../src/game/systems/EconomySystem.ts';
import { initialEvolution, purchaseEvolution, type PurchaseIntent } from '../../src/game/systems/EvolutionSystem.ts';
import { buildWave } from '../../src/game/systems/WaveSystem.ts';
import type { BranchId, EvolutionRank, EvolutionState, TowerId } from '../../src/shared/progression.ts';
import type { DifficultyId, PowerUpId } from '../../src/shared/types.ts';

export interface PurchaseTrace { wave: number; towerId: TowerId; branchId: BranchId | null; rank: EvolutionRank | null; masteryRank: number; spent: number; goldAfter: number; }
export interface ProgressionTrace { difficulty: DifficultyId; debugAssisted: boolean; unlocked: BranchId[]; purchases: PurchaseTrace[]; firstEvolutionWave: number | null; firstRank2Wave: number | null; fullyEvolvedAtVictory: number; siegeWon: boolean; ordinaryRewardsOnly: boolean; duration1xSeconds: number; maxForcedWaitWaves: number; goldByWave: number[]; leaksByWave: number[]; relics: Array<{ wave: number; id: PowerUpId; used: boolean }>; }

export function verifyTrace(trace: ProgressionTrace): string[] {
  const f: string[] = [];
  if (trace.debugAssisted) f.push('Trace must not be debug-assisted');
  if (!trace.siegeWon) f.push('Trace must record a siege victory');
  if (trace.firstEvolutionWave === null || trace.firstEvolutionWave > 13) f.push('First evolution must be affordable during waves 11–13');
  if (trace.firstRank2Wave === null || trace.firstRank2Wave >= 20) f.push('Rank 2 must be achievable before wave 20');
  if (trace.fullyEvolvedAtVictory < 2 || trace.fullyEvolvedAtVictory > 5) f.push('A successful mixed build must have 2–5 fully evolved towers at victory');
  if (trace.maxForcedWaitWaves > 3) f.push('No forced wait may exceed three consecutive completed waves');
  if (trace.difficulty === 'medium' && (trace.duration1xSeconds < 1200 || trace.duration1xSeconds > 1800)) f.push('Medium siege duration must be 1200–1800 seconds');
  return f;
}
/** Cumulative gold after each completed wave (index 0 = starting gold); every scheduled enemy killed; no relics, summons, bonus targets or selling. */
export function ordinaryIncomeByWave(difficulty: DifficultyId, throughWave: number): number[] {
  const config = DIFFICULTIES[difficulty], income = [config.startingGold];
  for (let wave = 1; wave <= throughWave; wave++) {
    let gold = waveClearBonus(wave);
    for (const g of buildWave(wave, config.enemyCountMultiplier).groups) {
      gold += g.count * killReward(ENEMIES[g.enemyId].baseReward, config, false);
      if (ENEMIES[g.enemyId].isBoss) gold += g.count * waveClearBonus(wave);
    }
    income.push(income[wave - 1] + gold);
  }
  return income;
}
export interface PlannedPurchase { towerId: TowerId; intent: PurchaseIntent | 'build'; }
const build = (towerId: TowerId): PlannedPurchase => ({ towerId, intent: 'build' });
const up = (towerId: TowerId): PlannedPurchase => ({ towerId, intent: { kind: 'foundation-upgrade' } });
const evolve = (towerId: TowerId, branchId: BranchId): PlannedPurchase => ({ towerId, intent: { kind: 'evolve', branchId } });
const rank = (towerId: TowerId): PlannedPurchase => ({ towerId, intent: { kind: 'evolution-rank' } });
export const MIXED_BUILD: readonly PlannedPurchase[] = [
  build('longbow'), build('ember'), build('glacier'), up('longbow'), build('starfire'), up('ember'), up('longbow'), build('tempest'), up('glacier'), up('starfire'),
  up('ember'), up('longbow'), evolve('longbow', 'marksman'), rank('longbow'), up('starfire'), rank('longbow'), up('ember'), up('tempest'), up('glacier'),
  evolve('ember', 'siegebreaker'), up('starfire'), evolve('starfire', 'spellbreaker'), up('tempest'), up('glacier'), rank('longbow'), evolve('glacier', 'winterguard'),
  up('tempest'), rank('ember'), evolve('tempest', 'stormcaller'), rank('ember'), rank('starfire')
];
/** Buys plan items strictly in order during each wave's preparation; evolution opens after wave 10 completes. */
export function simulatePurchases(difficulty: DifficultyId, plan: readonly PlannedPurchase[], throughWave: number): PurchaseTrace[] {
  const income = ordinaryIncomeByWave(difficulty, throughWave), states = new Map<TowerId, EvolutionState>(), trace: PurchaseTrace[] = [];
  let gold = income[0], next = 0;
  for (let wave = 1; wave <= throughWave; wave++) {
    while (next < plan.length) {
      const step = plan[next], state = states.get(step.towerId);
      let spent: number, after: EvolutionState;
      if (step.intent === 'build') {
        spent = TOWERS[step.towerId].levels[0].cost;
        if (state || gold < spent) break;
        after = initialEvolution(step.towerId);
      } else {
        if (!state) break;
        const r = purchaseEvolution(step.towerId, state, step.intent, { gold, evolutionOpen: wave > 10, endless: false, blocked: false, unlocked: new Set<BranchId>() }, state.revision);
        if (!r.ok) break;
        spent = r.cost; after = r.state;
      }
      gold -= spent; states.set(step.towerId, after);
      trace.push({ wave, towerId: step.towerId, branchId: after.branchId, rank: after.rank, masteryRank: after.masteryRank, spent, goldAfter: gold });
      next++;
    }
    gold += income[wave] - income[wave - 1];
  }
  return trace;
}
export function cheapestFullEvolution(): number {
  return Math.min(...TOWER_IDS.map((id) => towerTotalInvested(id, 4) + EVOLUTIONS[STARTER_BRANCH[id]].stats.reduce((sum, s) => sum + s.cost, 0)));
}
