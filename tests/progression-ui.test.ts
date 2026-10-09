import { describe, expect, it } from 'vitest';
import { achievementRequirement, achievementViews, towerProgressionView, wavePresentation } from '../src/game/ui/progressionView.ts';
import { UnlockRepository } from '../src/game/systems/UnlockSystem.ts';
import type { PurchaseContext } from '../src/game/systems/EvolutionSystem.ts';
import type { BranchId } from '../src/shared/progression.ts';
import { tower } from './helpers/evolutionFixtures.ts';
import { EVOLUTIONS } from '../src/game/config/evolutions.ts';
import { TOWERS } from '../src/game/config/towers.ts';
import { effectiveStats, previewPurchaseStats, purchaseEvolution } from '../src/game/systems/EvolutionSystem.ts';

const ctx = (patch: Partial<PurchaseContext> = {}): PurchaseContext => ({ gold: 1000, evolutionOpen: false, endless: false, blocked: false, unlocked: new Set<BranchId>(), ...patch });

describe('tower progression view', () => {
  it('shows a level-4 tower waiting for the boss with both branches and specific reasons', () => {
    const t = tower(null), view = towerProgressionView(t, ctx());
    expect(view.title).toBe('Ranger · Level 4 · Defeat the wave-10 boss to evolve');
    expect(view.actions.map((a) => a.label)).toEqual(['Evolve: Marksman · 510 gold', 'Evolve: Volley · 510 gold']);
    expect(view.actions.map((a) => a.reason)).toEqual(['Defeat the wave-10 boss', 'Complete the branch achievement']);
    expect(view.branches.find((b) => b.id === 'volley')).toMatchObject({ locked: true, requirement: achievementRequirement('longbow') });
    expect(view.commitment).toBe('Branch choice is permanent for this tower.');
    expect(t.progression.revision).toBe(0);
  });
  it.each([1, 4])('previews both rank-0 branches at foundation level %i without mutating state', (level) => {
    const t = tower(null); t.progression.foundationLevel = level;
    const before = structuredClone(t.progression), context = ctx({ gold: 0, blocked: true });
    const view = towerProgressionView(t, context);
    expect(view.stats).toEqual(effectiveStats(t.towerId, before));
    for (const branch of view.branches) expect(branch.stats).toEqual(EVOLUTIONS[branch.id].stats[0]);
    expect(view.branches[1].locked).toBe(true);
    expect(t.progression).toEqual(before); expect(context.gold).toBe(0);
  });
  it('reports readiness after the boss and omits branch choices after evolution', () => {
    expect(towerProgressionView(tower(null), ctx({ evolutionOpen: true })).title).toBe('Ranger · Level 4 · Ready to evolve');
    expect(towerProgressionView(tower('marksman'), ctx()).branches).toEqual([]);
  });
  it('enables evolve after the boss with the captured intent and revision', () => {
    const action = towerProgressionView(tower(null), ctx({ evolutionOpen: true })).actions[0];
    expect(action).toMatchObject({ label: 'Evolve: Marksman · 510 gold', reason: null, intent: { kind: 'evolve', branchId: 'marksman' }, revision: 0 });
    expect(action.nextStats).toEqual({ ...EVOLUTIONS.marksman.stats[0] });
  });
  it('offers the foundation upgrade and asks for level 4 below it', () => {
    const t = tower(null); t.progression = { ...t.progression, foundationLevel: 2, invested: 190 };
    const view = towerProgressionView(t, ctx({ evolutionOpen: true }));
    expect(view.actions[0]).toMatchObject({ label: 'Upgrade to level 3 · 180 gold', reason: null, intent: { kind: 'foundation-upgrade' } });
    expect(view.actions[1].reason).toBe('Reach level 4');
  });
  it('reports insufficient gold and paused or ended runs', () => {
    const view = towerProgressionView(tower('marksman', 1), ctx({ gold: 10, evolutionOpen: true }));
    expect(view.title).toBe('Marksman · Rank 1');
    expect(view.actions).toMatchObject([{ label: 'Marksman rank 2 · 935 gold', reason: 'Not enough gold', intent: { kind: 'evolution-rank' }, revision: 0 }]);
    expect(view.actions[0].nextStats).toEqual(EVOLUTIONS.marksman.stats[2]);
    expect(towerProgressionView(tower('marksman', 1), ctx({ blocked: true, evolutionOpen: true })).actions[0].reason).toBe('Unavailable while paused or ended');
  });
  it('offers mastery only in endless and shows the numeric limit', () => {
    expect(towerProgressionView(tower('marksman', 3), ctx({ evolutionOpen: true })).actions[0]).toMatchObject({ label: `Mastery 1 · ${Math.ceil(EVOLUTIONS.marksman.stats[3].cost * 1.25)} gold`, reason: 'Continue into endless for mastery' });
    expect(towerProgressionView(tower('marksman', 3), ctx({ evolutionOpen: true, endless: true, gold: 5000 })).actions[0].reason).toBe(null);
    const huge = tower('marksman', 3); huge.progression = { ...huge.progression, masteryRank: 100000 };
    expect(towerProgressionView(huge, ctx({ evolutionOpen: true, endless: true })).actions[0]).toMatchObject({ label: 'Mastery 100001 · limit', reason: 'Numeric limit reached' });
  });
  it('shows the current run’s qualification on the locked alternative until wave 20', () => {
    const qualifying = tower('marksman', 2, 5);
    expect(towerProgressionView(tower(null), ctx(), 15, [tower(null), qualifying]).branches.find((b) => b.id === 'volley')?.qualifiesNow).toBe(true);
    expect(towerProgressionView(tower(null), ctx(), 20, [qualifying]).branches.find((b) => b.id === 'volley')?.qualifiesNow).toBe(false);
  });
});

describe('next purchase stats', () => {
  it('puts the next stats on every action even when the purchase itself is unavailable', () => {
    const t = tower(null); t.progression = { ...t.progression, foundationLevel: 1, invested: 100 };
    const view = towerProgressionView(t, ctx({ gold: 0 }));
    expect(view.actions.map((a) => a.nextStats)).toEqual([effectiveStats('longbow', { ...t.progression, foundationLevel: 2 }), null, null]);
    expect(view.actions.map((a) => a.reason)).toEqual(['Not enough gold', 'Reach level 4', 'Reach level 4']);
    const ready = towerProgressionView(tower(null), ctx({ gold: 0 }));
    expect(ready.actions.map((a) => a.nextStats)).toEqual([{ ...EVOLUTIONS.marksman.stats[0] }, { ...EVOLUTIONS.volley.stats[0] }]);
    expect(ready.actions.map((a) => a.reason)).toEqual(['Defeat the wave-10 boss', 'Complete the branch achievement']);
    const open = towerProgressionView(tower(null), ctx({ gold: 0, evolutionOpen: true }));
    expect(open.actions.map((a) => a.reason)).toEqual(['Not enough gold', 'Complete the branch achievement']);
    expect(open.actions.map((a) => a.nextStats)).toEqual(ready.actions.map((a) => a.nextStats));
  });
  it.each([['marksman', 0], ['marksman', 1], ['marksman', 2], ['volley', 2]] as const)('matches the committed stats for %s rank %i', (branch, rank) => {
    const t = tower(branch, rank), state = structuredClone(t.progression), preview = previewPurchaseStats(t.towerId, state, { kind: 'evolution-rank' });
    const bought = purchaseEvolution(t.towerId, state, { kind: 'evolution-rank' }, { ...ctx(), gold: 1000000, evolutionOpen: true }, state.revision);
    expect(bought.ok).toBe(true);
    if (!bought.ok) throw Error(bought.reason);
    expect(preview).toEqual(bought.stats);
    expect(towerProgressionView(t, ctx()).actions[0]).toMatchObject({ nextStats: preview, revision: state.revision });
    expect(t.progression).toEqual(state);
  });
  it('keeps attack and range unchanged through mastery while damage grows', () => {
    const t = tower('marksman', 3), view = towerProgressionView(t, ctx({ gold: 0, evolutionOpen: true, endless: true }));
    const next = view.actions[0].nextStats!;
    expect(view.actions[0].reason).toBe('Not enough gold');
    expect([next.attackInterval, next.range]).toEqual([EVOLUTIONS.marksman.stats[3].attackInterval, EVOLUTIONS.marksman.stats[3].range]);
    expect(next.damage).toBe(Math.round(EVOLUTIONS.marksman.stats[3].damage * 1.05));
  });
  it('reports no next stats at the numeric limit', () => {
    const huge = tower('marksman', 3); huge.progression = { ...huge.progression, masteryRank: 100000 };
    expect(towerProgressionView(huge, ctx({ evolutionOpen: true, endless: true })).actions[0]).toMatchObject({ nextStats: null, reason: 'Numeric limit reached' });
  });
});

describe('achievement and wave views', () => {
  it('lists five achievements for the menu without run qualification', () => {
    const views = achievementViews(new UnlockRepository(null).view(), [], 0);
    expect(views.map((v) => v.branchId)).toEqual(['volley', 'flame-mortar', 'brittle-ice', 'arcane-beacon', 'thunderlord']);
    expect(views.every((v) => !v.earned && !v.unsaved && !v.qualifiesNow)).toBe(true);
    expect(views[0]).toMatchObject({ starterName: 'Marksman', alternativeName: 'Volley', requirement: 'Keep a Marksman tower at evolution rank 2 or higher when wave 20 is completed.' });
  });
  it('marks earned-but-unsaved achievements', () => {
    const repo = new UnlockRepository(null, () => '2026-10-08T00:00:00Z'); repo.earn(['volley']);
    expect(achievementViews(repo.view(), [], 0)[0]).toMatchObject({ earned: true, unsaved: true });
  });
  it('labels wave 30 as the siege finale only in the siege', () => {
    expect(wavePresentation(30, false).label).toBe('Siege finale · Wave 30');
    expect(wavePresentation(30, false).warning).toContain('Siege finale');
    for (const wave of [10, 20]) expect(wavePresentation(wave, false).warning).not.toContain('Siege finale');
    expect(wavePresentation(40, true).label).toBe('Wave 40 · Endless');
    expect(wavePresentation(12, false).label).toBe('Wave 12 of 30');
  });
});
