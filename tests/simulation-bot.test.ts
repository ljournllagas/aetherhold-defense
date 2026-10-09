import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameScene } from '../src/game/scenes/GameScene.ts';
import { SiegeSystem } from '../src/game/systems/SiegeSystem.ts';
import { DIFFICULTIES } from '../src/game/config/difficulties.ts';
import { STARTER_BRANCH } from '../src/game/config/evolutions.ts';
import { initialEvolution, purchaseEvolution, type PurchaseContext } from '../src/game/systems/EvolutionSystem.ts';
import type { BranchId, EvolutionState } from '../src/shared/progression.ts';
import {
  GOLD_RELICS, PREP_MS, SIM_STEP_MS, RELIC_ATTRIBUTION_NOTE, SIMULATION_STRATEGY, bossRelicsToActivate, goldRushIndex, mulberry32, planStepStatus, runSimulation, targetingForWave, type SimulationOptions
} from './helpers/simulationBot.ts';

vi.mock('phaser', () => ({ default: { Scene: class { constructor(_key?: string) {} }, Scenes: { Events: { SHUTDOWN: 'shutdown' } }, Scale: { Events: { RESIZE: 'resize' } } } }));
const SHORT: SimulationOptions = { label: 'bot-check', difficulty: 'medium', seed: 7, unlockAll: false, throughWave: 3, continueEndless: false };
const OPEN: PurchaseContext = { gold: Number.MAX_SAFE_INTEGER, evolutionOpen: true, endless: false, blocked: false, unlocked: new Set<BranchId>() };
afterEach(() => vi.restoreAllMocks());

describe('headless simulation bot', () => {
  it('has a deterministic seeded random source', () => {
    const a = mulberry32(1), b = mulberry32(1), values = [a(), a(), a()];
    expect(values).toEqual([b(), b(), b()]);
    expect(values.every((v) => v >= 0 && v < 1)).toBe(true);
  });
  it('produces the same trace for the same seed', () => {
    expect(runSimulation(SHORT)).toEqual(runSimulation(SHORT));
  }, 120_000);
  it('plays real waves without QA commands and labels the trace as simulated', () => {
    const qa = vi.spyOn(GameScene.prototype as unknown as { handleQAAction(action: unknown): void }, 'handleQAAction');
    const seed = vi.spyOn(SiegeSystem.prototype, 'seedForQA');
    const trace = runSimulation(SHORT);
    expect(qa).not.toHaveBeenCalled(); expect(seed).not.toHaveBeenCalled();
    expect(trace).toMatchObject({ simulated: true, debugAssisted: false, difficulty: 'medium', wavesCompleted: 3, outcome: 'incomplete', siegeWon: false, endless: [] });
    expect(trace.goldByWave).toHaveLength(4); expect(trace.goldByWave[0]).toBe(DIFFICULTIES.medium.startingGold);
    expect(trace.leaksByWave).toHaveLength(3);
    expect(trace.purchases[0]).toMatchObject({ wave: 1, towerId: 'longbow', branchId: null, rank: null, masteryRank: 0 });
    expect(trace.purchases.every((p) => p.spent > 0 && p.goldAfter >= 0)).toBe(true);
    // Waves 1-3 hold no boss: the only relic the bot may use is a Gold Rush that makes room in a full inventory.
    expect(trace.relicUses.every((u) => u.id === 'gold_rush' && u.wave >= 1 && u.wave <= 3)).toBe(true);
    expect(trace.relics.filter((r) => r.used)).toHaveLength(trace.relicUses.length);
    expect(trace.ordinaryRewardsOnly).toBe(!trace.relicUses.some((u) => GOLD_RELICS.has(u.id)));
    expect(trace.goldAtLastWaveStart).toBeGreaterThanOrEqual(0);
    // Waves 1-3 hold no boss; a buy phase that ends on a locked plan step leaves less gold than the cheapest fallback purchase.
    expect(trace.bossWaves).toEqual([]);
    expect(trace.lockedSteps.every((s) => s.wave >= 1 && s.wave <= 3 && (s.cheapestFillerCost === null || s.goldAfterBuying < s.cheapestFillerCost))).toBe(true);
    // One buy phase per started wave, each recording the plan status it ended on; the 'locked' ends are exactly the lockedSteps entries.
    expect(trace.phaseEnds.map((e) => e.wave)).toEqual([1, 2, 3]);
    expect(trace.phaseEnds.every((e) => ['buy', 'wait-gold', 'locked', 'after-plan'].includes(e.status))).toBe(true);
    expect(trace.lockedSteps.map((s) => s.wave)).toEqual(trace.phaseEnds.filter((e) => e.status === 'locked').map((e) => e.wave));
    expect(trace.relicAttribution).toBe(RELIC_ATTRIBUTION_NOTE); expect(RELIC_ATTRIBUTION_NOTE).toContain('discarded');
    expect(trace.simulatedGameTimeMs % SIM_STEP_MS).toBe(0);
    expect(trace.simulatedGameTimeMs).toBeGreaterThanOrEqual(3 * PREP_MS);
    expect(trace.duration1xSeconds).toBe(Math.round(trace.simulatedGameTimeMs / 1000));
    expect(trace.strategy).toBe(SIMULATION_STRATEGY);
    for (const phrase of ['locked', 'Strongest on boss waves', 'no selling, no pause, no speed change, no QA commands']) expect(SIMULATION_STRATEGY).toContain(phrase);
  }, 120_000);
});

describe('simulation bot strategy decisions', () => {
  it('buys or saves for an open plan step, falls back while it is locked and skips a finished one', () => {
    let state: EvolutionState = initialEvolution('longbow');
    const first = purchaseEvolution('longbow', state, { kind: 'foundation-upgrade' }, OPEN, state.revision);
    if (!first.ok) throw new Error(first.reason);
    expect(planStepStatus(first, first.cost)).toBe('buy');
    expect(planStepStatus(first, first.cost - 1)).toBe('wait-gold');
    for (let i = 0; i < 3; i++) {
      const r = purchaseEvolution('longbow', state, { kind: 'foundation-upgrade' }, OPEN, state.revision);
      if (!r.ok) throw new Error(r.reason);
      state = r.state;
    }
    const locked = purchaseEvolution('longbow', state, { kind: 'evolve', branchId: STARTER_BRANCH.longbow }, { ...OPEN, evolutionOpen: false }, state.revision);
    expect(locked).toEqual({ ok: false, reason: 'defeat wave-10 boss' });
    expect(planStepStatus(locked, Number.MAX_SAFE_INTEGER)).toBe('locked');
    const maxed = purchaseEvolution('longbow', state, { kind: 'foundation-upgrade' }, OPEN, state.revision);
    expect(maxed).toEqual({ ok: false, reason: 'not available' });
    expect(planStepStatus(maxed, Number.MAX_SAFE_INTEGER)).toBe('skip');
  });
  it('targets the strongest enemy only on boss waves', () => {
    expect([1, 9, 10, 11, 20, 29, 30, 31, 40].map((wave) => targetingForWave(wave))).toEqual(['first', 'first', 'strongest', 'first', 'strongest', 'first', 'strongest', 'first', 'strongest']);
  });
  it('uses Gold Rush on boss waves or to make room, and the other relics when a boss arrives', () => {
    expect(goldRushIndex(['battle_cry', 'gold_rush'], 10, 0)).toBe(1);
    expect(goldRushIndex(['battle_cry', 'gold_rush'], 9, 0)).toBe(-1);
    expect(goldRushIndex(['battle_cry', 'gold_rush', 'meteor_strike'], 9, 1)).toBe(1);
    expect(goldRushIndex(['battle_cry', 'meteor_strike', 'time_freeze'], 9, 1)).toBe(-1);
    expect(goldRushIndex(['battle_cry'], 20, 0)).toBe(-1);
    expect(bossRelicsToActivate(['gold_rush', 'battle_cry', 'emergency_repair'], 20, 20)).toEqual(['battle_cry']);
    expect(bossRelicsToActivate(['emergency_repair', 'meteor_strike', 'arcane_surge'], 16, 20)).toEqual(['emergency_repair', 'meteor_strike', 'arcane_surge']);
    expect(bossRelicsToActivate(['emergency_repair'], 17, 20)).toEqual([]);
    expect([...GOLD_RELICS].sort()).toEqual(['ancient_blessing', 'double_bounty', 'gold_rush', 'treasure_goblin']);
  });
});
