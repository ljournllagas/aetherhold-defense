import { EVOLUTIONS, EVOLUTION_RULES, STARTER_BRANCH } from '../config/evolutions.ts';
import { TOWERS, refundForInvested } from '../config/towers.ts';
import type { BranchId, EffectiveTowerStats, EvolutionRank, EvolutionState, TowerId } from '../../shared/progression.ts';

export type PurchaseIntent = { kind: 'foundation-upgrade' } | { kind: 'evolve'; branchId: BranchId } | { kind: 'evolution-rank' } | { kind: 'mastery' };
export type PurchaseReason = 'reach level 4' | 'defeat wave-10 boss' | 'complete branch achievement' | 'insufficient gold' | 'finish evolution' | 'continue into endless' | 'paused/ended' | 'numeric limit reached' | 'stale action' | 'not available';

export const PURCHASE_REASON_TEXT: Readonly<Record<PurchaseReason, string>> = {
  'reach level 4': 'Reach level 4',
  'defeat wave-10 boss': 'Defeat the wave-10 boss',
  'complete branch achievement': 'Complete the branch achievement',
  'insufficient gold': 'Not enough gold',
  'finish evolution': 'Finish evolution first',
  'continue into endless': 'Continue into endless for mastery',
  'paused/ended': 'Unavailable while paused or ended',
  'numeric limit reached': 'Numeric limit reached',
  'stale action': 'Tower changed; try again',
  'not available': 'Not available for this tower'
};

export interface PurchaseContext { gold: number; evolutionOpen: boolean; endless: boolean; blocked: boolean; unlocked: ReadonlySet<BranchId>; }

export type PurchaseResult = { ok: false; reason: PurchaseReason } | { ok: true; state: EvolutionState; gold: number; stats: EffectiveTowerStats; cost: number };

const FOUNDATION_MAX = 4;
const MAX_RANK = 3;

function isSafeCount(n: number): boolean {
  return Number.isSafeInteger(n) && n >= 0;
}

function isBranchId(value: unknown): value is BranchId {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(EVOLUTIONS, value);
}

export function initialEvolution(id: TowerId): EvolutionState {
  return { foundationLevel: 1, branchId: null, rank: null, masteryRank: 0, invested: TOWERS[id].levels[0].cost, revision: 0 };
}

function masteryDamage(branchId: BranchId, masteryRank: number): number {
  return Math.round(EVOLUTIONS[branchId].stats[MAX_RANK].damage * (1 + EVOLUTION_RULES.masteryGain * masteryRank));
}

export function effectiveStats(id: TowerId, state: EvolutionState): EffectiveTowerStats {
  if (state.branchId === null || state.rank === null) {
    return {
      ...TOWERS[id].levels[state.foundationLevel - 1],
      bossDamageMultiplier: 1, physicalArmorScale: 1, wardArmorScale: 1, volleyTargets: 1, burningField: false,
      vulnerabilityMultiplier: 1, vulnerabilityMs: 0, auraDamageMultiplier: 1, auraRange: 0, control: null, controlMs: 0, bossControlMs: 0
    };
  }
  const stats: EffectiveTowerStats = { ...EVOLUTIONS[state.branchId].stats[state.rank] };
  if (state.masteryRank > 0) stats.damage = masteryDamage(state.branchId, state.masteryRank);
  return stats;
}

function positiveSafe(cost: number): number | null {
  return Number.isSafeInteger(cost) && cost > 0 ? cost : null;
}

export function nextPurchaseCost(id: TowerId, state: EvolutionState, intent: PurchaseIntent): number | null {
  const evolved = state.branchId !== null && state.rank !== null;
  switch (intent.kind) {
    case 'foundation-upgrade': {
      if (evolved || state.foundationLevel >= FOUNDATION_MAX) return null;
      const row = TOWERS[id].levels[state.foundationLevel];
      return row ? positiveSafe(row.cost) : null;
    }
    case 'evolve': {
      if (evolved || !isBranchId(intent.branchId) || EVOLUTIONS[intent.branchId].towerId !== id) return null;
      return positiveSafe(EVOLUTIONS[intent.branchId].stats[0].cost);
    }
    case 'evolution-rank': {
      if (!evolved || state.rank === null || state.branchId === null || state.rank >= MAX_RANK) return null;
      return positiveSafe(EVOLUTIONS[state.branchId].stats[state.rank + 1].cost);
    }
    case 'mastery': {
      if (!evolved || state.branchId === null || state.rank !== MAX_RANK) return null;
      const m = state.masteryRank;
      return positiveSafe(Math.ceil(EVOLUTIONS[state.branchId].stats[MAX_RANK].cost * EVOLUTION_RULES.masteryCostGrowth ** (m + 1)));
    }
    default:
      return null;
  }
}

function isWellFormed(id: TowerId, state: EvolutionState, gold: number): boolean {
  const L = state.foundationLevel;
  if (!Number.isInteger(L) || L < 1 || L > FOUNDATION_MAX) return false;
  if ((state.branchId === null) !== (state.rank === null)) return false;
  if (!isSafeCount(state.masteryRank) || !isSafeCount(state.invested) || !isSafeCount(state.revision) || !isSafeCount(gold)) return false;
  if (state.branchId !== null) {
    if (!isBranchId(state.branchId) || EVOLUTIONS[state.branchId].towerId !== id) return false;
    if (!Number.isInteger(state.rank) || (state.rank as number) < 0 || (state.rank as number) > MAX_RANK) return false;
    if (L !== FOUNDATION_MAX) return false;
  }
  if (state.masteryRank > 0 && state.rank !== MAX_RANK) return false;
  return true;
}

function fail(reason: PurchaseReason): PurchaseResult {
  return { ok: false, reason };
}

export function purchaseEvolution(id: TowerId, state: EvolutionState, intent: PurchaseIntent, context: PurchaseContext, expectedRevision: number): PurchaseResult {
  if (!Object.prototype.hasOwnProperty.call(TOWERS, id) || !isWellFormed(id, state, context.gold)) return fail('not available');
  if (context.blocked) return fail('paused/ended');
  if (expectedRevision !== state.revision) return fail('stale action');

  const evolved = state.branchId !== null && state.rank !== null;
  const L = state.foundationLevel;
  let candidate: Omit<EvolutionState, 'invested' | 'revision'>;
  let cost: number | null;

  switch (intent.kind) {
    case 'foundation-upgrade': {
      if (evolved || L >= FOUNDATION_MAX) return fail('not available');
      cost = nextPurchaseCost(id, state, intent);
      if (cost === null) return fail('not available');
      candidate = { foundationLevel: L + 1, branchId: null, rank: null, masteryRank: 0 };
      break;
    }
    case 'evolve': {
      if (L < FOUNDATION_MAX) return fail('reach level 4');
      const b = intent.branchId;
      if (evolved || !isBranchId(b) || EVOLUTIONS[b].towerId !== id) return fail('not available');
      if (STARTER_BRANCH[id] !== b && !context.unlocked.has(b)) return fail('complete branch achievement');
      if (!context.evolutionOpen) return fail('defeat wave-10 boss');
      cost = nextPurchaseCost(id, state, intent);
      if (cost === null) return fail('not available');
      candidate = { foundationLevel: L, branchId: b, rank: 0, masteryRank: 0 };
      break;
    }
    case 'evolution-rank': {
      if (!evolved || state.rank === null) return fail(L < FOUNDATION_MAX ? 'reach level 4' : 'not available');
      if (state.rank >= MAX_RANK) return fail('not available');
      cost = nextPurchaseCost(id, state, intent);
      if (cost === null) return fail('not available');
      candidate = { foundationLevel: L, branchId: state.branchId, rank: (state.rank + 1) as EvolutionRank, masteryRank: 0 };
      break;
    }
    case 'mastery': {
      if (!evolved || state.branchId === null) return fail(L < FOUNDATION_MAX ? 'reach level 4' : 'finish evolution');
      if (state.rank !== MAX_RANK) return fail('finish evolution');
      if (!context.endless) return fail('continue into endless');
      cost = nextPurchaseCost(id, state, intent);
      const nextMastery = state.masteryRank + 1;
      if (cost === null || !Number.isSafeInteger(nextMastery) || !Number.isSafeInteger(masteryDamage(state.branchId, nextMastery)) || !Number.isSafeInteger(state.invested + cost)) {
        return fail('numeric limit reached');
      }
      candidate = { foundationLevel: L, branchId: state.branchId, rank: MAX_RANK, masteryRank: nextMastery };
      break;
    }
    default:
      return fail('not available');
  }

  if (context.gold < cost) return fail('insufficient gold');
  const next: EvolutionState = { ...candidate, invested: state.invested + cost, revision: state.revision + 1 };
  return { ok: true, cost, gold: context.gold - cost, state: next, stats: effectiveStats(id, next) };
}

export function investedRefund(state: EvolutionState): number {
  return refundForInvested(state.invested);
}
