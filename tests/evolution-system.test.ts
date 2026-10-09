import { describe, expect, it } from 'vitest';
import { EVOLUTIONS } from '../src/game/config/evolutions.ts';
import { TOWERS, towerTotalInvested } from '../src/game/config/towers.ts';
import { Tower } from '../src/game/entities/Tower.ts';
import { PURCHASE_REASON_TEXT, effectiveStats, initialEvolution, investedRefund, nextPurchaseCost, previewPurchaseStats, purchaseEvolution, type PurchaseContext, type PurchaseIntent, type PurchaseReason } from '../src/game/systems/EvolutionSystem.ts';
import { towerProgressionView } from '../src/game/ui/progressionView.ts';
import { ALTERNATIVE_BRANCH, STARTER_BRANCH } from '../src/game/config/evolutions.ts';
import type { BranchId, TowerId } from '../src/shared/progression.ts';
import { tower } from './helpers/evolutionFixtures.ts';

const context: PurchaseContext = { gold: 100000, evolutionOpen: true, endless: false, blocked: false, unlocked: new Set(Object.keys(EVOLUTIONS) as BranchId[]) };
const ctx = (patch: Partial<PurchaseContext> = {}): PurchaseContext => ({ gold: 1000, evolutionOpen: false, endless: false, blocked: false, unlocked: new Set<BranchId>(), ...patch });

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
    expect(nextPurchaseCost('longbow', r3, { kind: 'mastery' })).toBe(Math.ceil(EVOLUTIONS.marksman.stats[3].cost * 1.25));
    expect(nextPurchaseCost('longbow', { ...r3, masteryRank: 1 }, { kind: 'mastery' })).toBe(Math.ceil(EVOLUTIONS.marksman.stats[3].cost * 1.25 ** 2));
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

describe('purchase previews before spending', () => {
  it('previews a rank without requiring gold and matches its committed stats', () => {
    const t = tower('marksman', 1);
    const before = structuredClone(t.progression);
    const intent = { kind: 'evolution-rank' as const };
    const preview = previewPurchaseStats(t.towerId, t.progression, intent);
    const bought = purchaseEvolution(t.towerId, t.progression, intent,
      { gold: 1000000, evolutionOpen: true, endless: false, blocked: false, unlocked: new Set() }, t.progression.revision);
    expect(bought.ok).toBe(true);
    if (!bought.ok) throw Error(bought.reason);
    expect(preview).toEqual(bought.stats);
    expect(t.progression).toEqual(before);
    expect(towerProgressionView(t, ctx({ gold: 0, blocked: true })).actions[0].nextStats).toEqual(preview);
  });
  it('previews the next foundation level for every tower without changing the quoted state', () => {
    for (const id of Object.keys(TOWERS) as TowerId[]) {
      const t = new Tower(id, 0, 0, 0);
      for (const level of [1, 2, 3]) {
        t.progression = { ...t.progression, foundationLevel: level, invested: towerTotalInvested(id, level) };
        const before = structuredClone(t.progression);
        const preview = previewPurchaseStats(id, t.progression, { kind: 'foundation-upgrade' });
        expect(preview).toEqual(effectiveStats(id, { ...t.progression, foundationLevel: level + 1 }));
        expect(towerProgressionView(t, ctx({ gold: 0, blocked: true })).actions[0].nextStats).toEqual(preview);
        expect(t.progression).toEqual(before);
      }
    }
  });
  it.each((Object.keys(TOWERS) as TowerId[]).flatMap((id) => ([STARTER_BRANCH[id], ALTERNATIVE_BRANCH[id]] as BranchId[]).map((branch) => [id, branch] as const)))(
    'previews every %s stage on %s against the committed reducer', (_id, branch) => {
      const id = EVOLUTIONS[branch].towerId;
      let state = { ...initialEvolution(id), foundationLevel: 4, invested: towerTotalInvested(id, 4), revision: 0 };
      let gold = context.gold;
      const evolve: PurchaseIntent = { kind: 'evolve', branchId: branch };
      const evolvePreview = previewPurchaseStats(id, state, evolve);
      const evolved = purchaseEvolution(id, state, evolve, context, state.revision);
      if (!evolved.ok) throw new Error(evolved.reason);
      expect(evolvePreview).toEqual(evolved.stats);
      expect(evolvePreview).toEqual(EVOLUTIONS[branch].stats[0]);
      state = evolved.state; gold = evolved.gold;
      for (let rank = 1; rank <= 3; rank++) {
        const intent: PurchaseIntent = { kind: 'evolution-rank' };
        const preview = previewPurchaseStats(id, state, intent);
        const before = structuredClone(state);
        const bought = purchaseEvolution(id, state, intent, { ...context, gold }, state.revision);
        if (!bought.ok) throw new Error(bought.reason);
        expect(preview).toEqual(bought.stats);
        expect(preview).toEqual(EVOLUTIONS[branch].stats[rank]);
        expect(state).toEqual(before);
        state = bought.state; gold = bought.gold;
      }
      const masteryPreview = previewPurchaseStats(id, state, { kind: 'mastery' });
      const mastery = purchaseEvolution(id, state, { kind: 'mastery' }, { ...context, gold, endless: true }, state.revision);
      if (!mastery.ok) throw new Error(mastery.reason);
      expect(masteryPreview).toEqual(mastery.stats);
      expect(masteryPreview?.damage).toBe(Math.round(EVOLUTIONS[branch].stats[3].damage * 1.05));
      expect(masteryPreview?.attackInterval).toBe(EVOLUTIONS[branch].stats[3].attackInterval);
      expect(masteryPreview?.range).toBe(EVOLUTIONS[branch].stats[3].range);
    });
  it('reports the numeric limit as no preview instead of an infinite or NaN value', () => {
    const huge = { ...tower('marksman', 3).progression, masteryRank: 100000 };
    const before = structuredClone(huge);
    expect(previewPurchaseStats('longbow', huge, { kind: 'mastery' })).toBe(null);
    const view = towerProgressionView({ ...tower('marksman', 3), progression: huge }, ctx({ gold: 0, evolutionOpen: true, endless: true }));
    expect(view.actions[0]).toMatchObject({ label: 'Mastery 100001 · limit', reason: 'Numeric limit reached', nextStats: null });
    expect(huge).toEqual(before);
  });
  it('returns no preview for intents the quoted state cannot buy, without changing it', () => {
    const r1 = tower('marksman', 1), level3 = { ...initialEvolution('longbow'), foundationLevel: 3, invested: towerTotalInvested('longbow', 3) };
    const mastered = { ...tower('marksman', 3).progression, masteryRank: 2 };
    const cases: Array<[typeof r1['progression'], PurchaseIntent]> = [
      [r1.progression, { kind: 'evolve', branchId: 'volley' }],
      [r1.progression, { kind: 'foundation-upgrade' }],
      [r1.progression, { kind: 'mastery' }],
      [level3, { kind: 'evolution-rank' }],
      [mastered, { kind: 'evolution-rank' }]
    ];
    for (const [state, intent] of cases) {
      const before = structuredClone(state);
      expect(previewPurchaseStats('longbow', state, intent)).toBe(null);
      expect(state).toEqual(before);
    }
  });
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
