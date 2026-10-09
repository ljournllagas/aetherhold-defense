import { describe, expect, it } from 'vitest';
import { EVOLUTIONS } from '../src/game/config/evolutions.ts';
import { TOWERS, towerTotalInvested } from '../src/game/config/towers.ts';
import { Tower } from '../src/game/entities/Tower.ts';
import { PURCHASE_REASON_TEXT, effectiveStats, initialEvolution, investedRefund, nextPurchaseCost, purchaseEvolution, type PurchaseContext, type PurchaseIntent, type PurchaseReason } from '../src/game/systems/EvolutionSystem.ts';
import type { BranchId } from '../src/shared/progression.ts';
import { tower } from './helpers/evolutionFixtures.ts';

const context: PurchaseContext = { gold: 100000, evolutionOpen: true, endless: false, blocked: false, unlocked: new Set(Object.keys(EVOLUTIONS) as BranchId[]) };

describe('atomic purchases', () => {
  it('commits an evolution once and rejects the repeated stale action', () => {
    const state = { ...initialEvolution('longbow'), foundationLevel: 4, invested: 710 };
    const ctx: PurchaseContext = { gold: 2000, evolutionOpen: true, endless: false, blocked: false, unlocked: new Set<BranchId>() };
    const first = purchaseEvolution('longbow', state, { kind: 'evolve', branchId: 'marksman' }, ctx, 0);
    if (!first.ok) throw new Error(first.reason);
    expect([first.cost, first.state.invested, first.gold, investedRefund(first.state)]).toEqual([510, 1220, 1490, 854]);
    expect(first.state).toMatchObject({ branchId: 'marksman', rank: 0, revision: 1 });
    expect(state.branchId).toBe(null);
    expect(purchaseEvolution('longbow', first.state, { kind: 'evolve', branchId: 'marksman' }, { ...ctx, gold: first.gold }, 0)).toEqual({ ok: false, reason: 'stale action' });
  });
  it('raises foundation levels with the configured costs', () => {
    let state = initialEvolution('longbow');
    expect(state).toEqual({ foundationLevel: 1, branchId: null, rank: null, masteryRank: 0, invested: 100, revision: 0 });
    for (const level of [2, 3, 4]) {
      const r = purchaseEvolution('longbow', state, { kind: 'foundation-upgrade' }, context, state.revision);
      if (!r.ok) throw new Error(r.reason);
      expect([r.cost, r.state.foundationLevel, r.state.invested]).toEqual([TOWERS.longbow.levels[level - 1].cost, level, towerTotalInvested('longbow', level)]);
      state = r.state;
    }
    expect(purchaseEvolution('longbow', state, { kind: 'foundation-upgrade' }, context, state.revision)).toEqual({ ok: false, reason: 'not available' });
  });
  it.each(Object.keys(EVOLUTIONS) as BranchId[])('purchases every rank of %s, then mastery only in endless', (branch) => {
    const id = EVOLUTIONS[branch].towerId;
    let state = { ...initialEvolution(id), foundationLevel: 4, invested: towerTotalInvested(id, 4) };
    let gold = context.gold;
    for (let rank = 0; rank <= 3; rank++) {
      const intent: PurchaseIntent = rank === 0 ? { kind: 'evolve', branchId: branch } : { kind: 'evolution-rank' };
      const before = structuredClone(state);
      const r = purchaseEvolution(id, state, intent, { ...context, gold }, state.revision);
      if (!r.ok) throw new Error(r.reason);
      expect(state).toEqual(before);
      expect([r.state.rank, r.cost, r.state.invested, r.gold]).toEqual([rank, EVOLUTIONS[branch].stats[rank].cost, state.invested + r.cost, gold - r.cost]);
      state = r.state; gold = r.gold;
    }
    expect(purchaseEvolution(id, state, { kind: 'evolution-rank' }, { ...context, gold }, state.revision)).toEqual({ ok: false, reason: 'not available' });
    expect(purchaseEvolution(id, state, { kind: 'mastery' }, { ...context, gold }, state.revision)).toEqual({ ok: false, reason: 'continue into endless' });
    const m = purchaseEvolution(id, state, { kind: 'mastery' }, { ...context, gold, endless: true }, state.revision);
    if (!m.ok) throw new Error(m.reason);
    expect(m.state.masteryRank).toBe(1);
    expect(m.cost).toBe(Math.ceil(EVOLUTIONS[branch].stats[3].cost * 1.25));
    expect(m.stats.damage).toBe(Math.round(EVOLUTIONS[branch].stats[3].damage * 1.05));
    expect(investedRefund(m.state)).toBe(Math.floor(m.state.invested * 70 / 100));
  });
  it.each([
    { patch: { gold: 0 }, intent: { kind: 'evolve', branchId: 'marksman' }, reason: 'insufficient gold' },
    { patch: { evolutionOpen: false }, intent: { kind: 'evolve', branchId: 'marksman' }, reason: 'defeat wave-10 boss' },
    { patch: { blocked: true }, intent: { kind: 'evolve', branchId: 'marksman' }, reason: 'paused/ended' },
    { patch: { unlocked: new Set<BranchId>() }, intent: { kind: 'evolve', branchId: 'volley' }, reason: 'complete branch achievement' },
    { patch: {}, intent: { kind: 'evolve', branchId: 'spellbreaker' }, reason: 'not available' },
    { patch: { endless: true }, intent: { kind: 'mastery' }, reason: 'finish evolution' }
  ] as Array<{ patch: Partial<PurchaseContext>; intent: PurchaseIntent; reason: PurchaseReason }>)('rejects "$reason" without spending', ({ patch, intent, reason }) => {
    const state = tower(null).progression, before = structuredClone(state);
    expect(purchaseEvolution('longbow', state, intent, { ...context, ...patch }, 0)).toEqual({ ok: false, reason });
    expect(state).toEqual(before);
  });
  it('requires level 4, the evolution and rank 3 in order and never changes branch', () => {
    const level3 = { ...initialEvolution('longbow'), foundationLevel: 3, invested: 370 };
    expect(purchaseEvolution('longbow', level3, { kind: 'evolve', branchId: 'marksman' }, context, 0)).toEqual({ ok: false, reason: 'reach level 4' });
    expect(purchaseEvolution('longbow', level3, { kind: 'evolution-rank' }, context, 0)).toEqual({ ok: false, reason: 'reach level 4' });
    expect(purchaseEvolution('longbow', tower(null).progression, { kind: 'evolution-rank' }, context, 0)).toEqual({ ok: false, reason: 'not available' });
    expect(purchaseEvolution('longbow', tower('marksman', 1).progression, { kind: 'mastery' }, { ...context, endless: true }, 0)).toEqual({ ok: false, reason: 'finish evolution' });
    expect(purchaseEvolution('longbow', tower('marksman', 0).progression, { kind: 'evolve', branchId: 'volley' }, context, 0)).toEqual({ ok: false, reason: 'not available' });
    const next = purchaseEvolution('longbow', tower('marksman', 0).progression, { kind: 'evolution-rank' }, context, 0);
    expect(next.ok && next.state.rank).toBe(1);
  });
  it('rejects unsafe mastery without spending and prices mastery geometrically', () => {
    const huge = { ...tower('marksman', 3).progression, masteryRank: 100000 }, before = structuredClone(huge);
    expect(nextPurchaseCost('longbow', huge, { kind: 'mastery' })).toBe(null);
    expect(purchaseEvolution('longbow', huge, { kind: 'mastery' }, { ...context, endless: true }, 0)).toEqual({ ok: false, reason: 'numeric limit reached' });
    expect(huge).toEqual(before);
    const r3 = tower('marksman', 3).progression;
    expect(nextPurchaseCost('longbow', r3, { kind: 'mastery' })).toBe(Math.ceil(1275 * 1.25));
    expect(nextPurchaseCost('longbow', { ...r3, masteryRank: 1 }, { kind: 'mastery' })).toBe(Math.ceil(1275 * 1.25 ** 2));
    expect(effectiveStats('longbow', { ...r3, masteryRank: 2 }).damage).toBe(Math.round(EVOLUTIONS.marksman.stats[3].damage * 1.1));
    expect(effectiveStats('longbow', { ...r3, masteryRank: 2 }).range).toBe(EVOLUTIONS.marksman.stats[3].range);
  });
  it('keeps cooldown, targeting and position across purchases', () => {
    const owner = new Tower('longbow', 12, 24, 0);
    owner.progression = tower(null).progression; owner.cooldown = 0.75; owner.targeting = 'strongest';
    const r = purchaseEvolution('longbow', owner.progression, { kind: 'evolve', branchId: 'marksman' }, context, 0);
    if (!r.ok) throw new Error(r.reason);
    owner.progression = r.state;
    expect([owner.x, owner.y, owner.cooldown, owner.targeting]).toEqual([12, 24, 0.75, 'strongest']);
  });
  it('refunds recorded spend even after prices are retuned', () => {
    const r = purchaseEvolution('longbow', { ...initialEvolution('longbow'), foundationLevel: 4, invested: 710 }, { kind: 'evolve', branchId: 'marksman' }, context, 0);
    if (!r.ok) throw new Error(r.reason);
    const row = EVOLUTIONS.marksman.stats[0] as { cost: number }, original = row.cost;
    try { row.cost = 9999; expect(investedRefund(r.state)).toBe(854); } finally { row.cost = original; }
  });
  it('changes nothing when a quoted purchase is not committed', () => {
    const state = tower(null).progression, before = structuredClone(state), gold = 600;
    expect(purchaseEvolution('longbow', state, { kind: 'evolve', branchId: 'marksman' }, { ...context, gold }, 0).ok).toBe(true);
    expect(state).toEqual(before); expect(gold).toBe(600);
  });
  it('derives foundation stats without compounding', () => {
    const state = { ...initialEvolution('ember'), foundationLevel: 2, invested: 280 };
    expect(effectiveStats('ember', state)).toEqual({ ...TOWERS.ember.levels[1], bossDamageMultiplier: 1, physicalArmorScale: 1, wardArmorScale: 1, volleyTargets: 1, burningField: false, vulnerabilityMultiplier: 1, vulnerabilityMs: 0, auraDamageMultiplier: 1, auraRange: 0, control: null, controlMs: 0, bossControlMs: 0 });
    expect(effectiveStats('ember', state)).not.toBe(effectiveStats('ember', state));
  });
  it('lets a Tower read level and stats from its progression', () => {
    const t = new Tower('longbow', 0, 0, 0);
    expect([t.level, t.stats.damage, t.counter.successes]).toEqual([1, 12, 0]);
    t.progression = { ...t.progression, foundationLevel: 3, invested: towerTotalInvested('longbow', 3) };
    expect([t.level, t.stats.damage]).toEqual([3, TOWERS.longbow.levels[2].damage]);
    expect(() => new Tower('laser', 0, 0, 0)).toThrow();
  });
  it('labels every reason', () => { expect(Object.keys(PURCHASE_REASON_TEXT)).toHaveLength(10); expect(PURCHASE_REASON_TEXT['defeat wave-10 boss']).toBe('Defeat the wave-10 boss'); });
});

describe('refund is exactly 70% of recorded investment, rounded down', () => {
  it.each([[0, 0], [100, 70], [370, 259], [710, 497], [1220, 854], [1990, 1393]])('refunds %i gold as %i', (invested, expected) => {
    expect(investedRefund({ ...initialEvolution('longbow'), invested })).toBe(expected);
  });
  it('matches integer arithmetic for every amount from 0 to 5000', () => {
    for (let invested = 0; invested <= 5000; invested++) {
      const exact = (invested * 70 - ((invested * 70) % 100)) / 100;
      expect(investedRefund({ ...initialEvolution('longbow'), invested })).toBe(exact);
    }
  });
});
