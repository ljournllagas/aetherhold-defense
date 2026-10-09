import Phaser from 'phaser';
import { vi } from 'vitest';
import { GameScene } from '../../src/game/scenes/GameScene.ts';
import { SoundManager } from '../../src/game/systems/SoundManager.ts';
import { UnlockRepository } from '../../src/game/systems/UnlockSystem.ts';
import { nextPurchaseCost, purchaseEvolution, type PurchaseContext, type PurchaseIntent, type PurchaseResult } from '../../src/game/systems/EvolutionSystem.ts';
import { buildWave, enemyHpForWave, type SpawnEvent } from '../../src/game/systems/WaveSystem.ts';
import type { SiegeSystem } from '../../src/game/systems/SiegeSystem.ts';
import type { RelicVault } from '../../src/game/systems/RunSimulation.ts';
import type { Tower } from '../../src/game/entities/Tower.ts';
import type { Enemy } from '../../src/game/entities/Enemy.ts';
import { ALTERNATIVE_BRANCH, STARTER_BRANCH } from '../../src/game/config/evolutions.ts';
import { POWERUP_EFFECTS, POWERUP_INVENTORY_LIMIT } from '../../src/game/config/powerUps.ts';
import { TOWERS, TOWER_LIST } from '../../src/game/config/towers.ts';
import { getDifficulty } from '../../src/game/config/difficulties.ts';
import { MAP1 } from '../../src/game/maps/map1.ts';
import type { BranchId, TowerId } from '../../src/shared/progression.ts';
import type { DifficultyId, GameResultPayload, PowerUpId, TargetingMode } from '../../src/shared/types.ts';
import { MIXED_BUILD, type ProgressionTrace, type PurchaseTrace } from './progressionTrace.ts';

export const SIM_STEP_MS = 50;
export const PREP_MS = 10_000;
export const SIMULATION_STRATEGY = 'Plan-first mixed build with a locked-step fallback: buy the T23 MIXED_BUILD steps in order as soon as each is affordable during preparation (evolve steps use the alternative branch when the profile has it unlocked). A step that is only unaffordable is saved for. A step that is locked (for example an evolution waiting for the wave-10 boss) does not hold the gold: meanwhile the bot buys the cheapest legal purchase among evolution ranks, foundation upgrades, evolutions and (in endless) mastery on existing towers, otherwise builds the cheapest tower on the best free plot. A step that is already complete or impossible (foundation already at level 4, tower already evolved, no free plot) is skipped. New towers go on the free plot with the most road within their level-1 range. After the plan the same cheapest-purchase rule applies. Targeting: every tower uses First, and Strongest on boss waves (every 10th wave). Relics: a reward is stored while a slot is free, otherwise discarded, except that a stored Gold Rush is used first to make room; on boss waves every stored Gold Rush is used during preparation before buying, and when a boss first comes within range of a tower every other stored relic is used at once (Meteor cast on the boss; Stronghold Repair only when at least 4 lives are missing); the victory decision only stores (slot free) or discards. 10 s of idle preparation at 1x before every wave; no selling, no pause, no speed change, no QA commands.';
export const RELIC_ATTRIBUTION_NOTE = 'relics[].used is attributed, not tracked: each use marks the earliest grant of the same relic not yet marked, so when an earlier copy was discarded a later grant may be marked instead. relicUses (the wave and relic of every use) and the number of used grants per relic are exact.';

/** 'disabled' keeps every gold-producing relic out of the run: no Gold Rush preparation and no gold relic at boss arrival. */
export type GoldRelicMode = 'normal' | 'disabled';
export interface SimulationOptions { label: string; difficulty: DifficultyId; seed: number; unlockAll: boolean; throughWave: number; continueEndless: boolean; goldRelics?: GoldRelicMode; }
export interface EndlessCheckpoint { wave: number; reached: boolean; lives: number; leaks: number; gold: number; scheduledHp: number; gameTimeMs: number; masteryRanks: number[]; nextMasteryCosts: Array<number | null>; }
export interface SimulationTrace extends ProgressionTrace {
  simulated: true; label: string; seed: number; strategy: string; stepMs: number; prepSecondsPerWave: number;
  simulatedGameTimeMs: number;
  wavesCompleted: number; finalLives: number;
  outcome: 'victory' | 'endless' | 'defeat' | 'siege-failed' | 'incomplete';
  /** The scene-produced GameOver payload (direct or defeat-Preload request) for a finished run; null while a run is still alive. */
  terminalPayload: GameResultPayload | null;
  goldRelics: GoldRelicMode;
  endless: EndlessCheckpoint[];
  relicUses: Array<{ wave: number; id: PowerUpId }>;
  goldAtLastWaveStart: number;
  bossWaves: Array<{ wave: number; targeting: TargetingMode[]; storedAtBossArrival: PowerUpId[] | null; livesAtBossArrival: number | null; maxLives: number }>;
  lockedSteps: Array<{ wave: number; fillerBought: number; goldAfterBuying: number; cheapestFillerCost: number | null }>;
  phaseEnds: Array<{ wave: number; status: PlanStepStatus | 'after-plan' }>;
  relicAttribution: string;
}

export type PlanStepStatus = 'buy' | 'wait-gold' | 'locked' | 'skip';

/** dryRunWithMaxGold = purchaseEvolution(id, state, intent, { ...purchaseContext(), gold: Number.MAX_SAFE_INTEGER }, state.revision).
 *  ok and gold >= cost → 'buy'; ok → 'wait-gold'; reason 'not available' → 'skip'; any other reason → 'locked'. */
export function planStepStatus(dryRunWithMaxGold: PurchaseResult, gold: number): PlanStepStatus {
  if (dryRunWithMaxGold.ok) return gold >= dryRunWithMaxGold.cost ? 'buy' : 'wait-gold';
  return dryRunWithMaxGold.reason === 'not available' ? 'skip' : 'locked';
}

/** 'strongest' when buildWave(wave).isBossWave, else 'first'. */
export function targetingForWave(wave: number): TargetingMode {
  return buildWave(wave).isBossWave ? 'strongest' : 'first';
}

/** Relics that can produce gold. */
export const GOLD_RELICS: ReadonlySet<PowerUpId> = new Set<PowerUpId>(['gold_rush', 'double_bounty', 'treasure_goblin', 'ancient_blessing']);

/** Index of the first stored 'gold_rush' when buildWave(wave).isBossWave, or when pendingCount > 0 and stored.length >= POWERUP_INVENTORY_LIMIT; otherwise -1. */
export function goldRushIndex(stored: readonly PowerUpId[], wave: number, pendingCount: number): number {
  if (buildWave(wave).isBossWave || (pendingCount > 0 && stored.length >= POWERUP_INVENTORY_LIMIT)) return stored.indexOf('gold_rush');
  return -1;
}

/** Stored relics to use when a boss arrives, in stored order: every relic except 'gold_rush'; 'emergency_repair' only when lives <= maxLives - POWERUP_EFFECTS.repairLives. */
export function bossRelicsToActivate(stored: readonly PowerUpId[], lives: number, maxLives: number): PowerUpId[] {
  return stored.filter((id) => id !== 'gold_rush' && (id !== 'emergency_repair' || lives <= maxLives - POWERUP_EFFECTS.repairLives));
}

/** Deterministic PRNG in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** GameScene members reached through a structural cast, as tests/scene-siege.test.ts does. */
interface Run {
  init(data: { difficulty?: DifficultyId; playerName?: string }): void;
  update(time: number, deltaMs: number): void;
  tryBuild(towerId: string, plotIndex: number): void;
  purchaseSelected(intent: PurchaseIntent, expectedTowerId: number, expectedRevision: number): void;
  purchaseContext(): PurchaseContext;
  startNextWave(): void;
  resolveVictoryReward(choice: 'store' | 'replace-oldest' | 'discard-new'): void;
  chooseVictory(action: 'finish' | 'continue'): void;
  grantPowerup(id: PowerUpId, reason: string, wantModal: boolean): void;
  activatePowerup(index: number): void; castMeteor(x: number, y: number): void; enemies: Enemy[]; maxLives: number;
  gold: number; lives: number; wave: number; waveActive: boolean; ended: boolean; gameTimeMs: number; speed: number;
  towers: Tower[]; selectedTower: Tower | null; occupied: Set<number>; spawnQueue: SpawnEvent[];
  siege: SiegeSystem; vault: RelicVault; runUnlocks: ReadonlySet<BranchId>; debugAssisted: boolean; unlockRepository: UnlockRepository;
  scene: { start(key: string, data: unknown): void; restart(): void };
}

const PRESENTATION = ['updateHUD', 'refreshInfoPanel', 'drawSheet', 'drawPowerupBar', 'refreshPlots', 'refreshPlacePanel', 'hideGhost', 'showBanner', 'floatText', 'floatTextForEnemy', 'impactAt', 'impactBurst', 'startDeathAnim', 'drawCatalog', 'refreshTowerVisual', 'updateNextPreview', 'renderVictory', 'showTouchPreview', 'projectEntity', 'makeEnemyVisual', 'presentReward', 'updateBossBar', 'updateDying', 'updateEffects', 'syncFieldViews', 'addEffect', 'drawTempestArc', 'publishQAStatus', 'drawAchievementNotice','renderFrame'];
const ENDLESS_CHECKPOINTS = [31, 35, 40];
const WAVE_TIMEOUT_MS = 30 * 60 * 1000;

function anyStub(): any {
  const proxy: any = new Proxy(function () { return proxy; }, { get: (_t, key) => (key === 'then' ? undefined : key === Symbol.toPrimitive ? () => 0 : proxy), apply: () => proxy });
  return proxy;
}

/** Free plot with the most road samples (every 10 px along each waypoint segment) within range; ties → lowest index. */
function bestPlot(occupied: ReadonlySet<number>, range: number): number | null {
  const samples: Array<{ x: number; y: number }> = [];
  const wps = MAP1.waypoints;
  for (let i = 0; i + 1 < wps.length; i++) {
    const a = wps[i], b = wps[i + 1], length = Math.hypot(b.x - a.x, b.y - a.y), n = Math.floor(length / 10);
    for (let k = 0; k <= n; k++) {
      const f = length === 0 ? 0 : (k * 10) / length;
      samples.push({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f });
    }
  }
  let best: number | null = null, bestCount = -1;
  MAP1.buildable.forEach((p, index) => {
    if (occupied.has(index)) return;
    const count = samples.filter((s) => Math.hypot(s.x - p.x, s.y - p.y) <= range).length;
    if (count > bestCount) { best = index; bestCount = count; }
  });
  return best;
}

export function runSimulation(options: SimulationOptions): SimulationTrace {
  const sound = vi.spyOn(SoundManager, 'get').mockReturnValue(anyStub());
  const random = vi.spyOn(Math, 'random').mockImplementation(mulberry32(options.seed));
  // The test Phaser mock has no Math namespace; ember/glacier projectile art builds points with
  // artkit V2 → new Phaser.Math.Vector2. Supply a plain point class for the run and remove it after.
  const mocked = Phaser as unknown as { Math?: unknown };
  const shimMath = mocked.Math === undefined;
  if (shimMath) mocked.Math = { Vector2: class { constructor(public x = 0, public y = 0) {} } };
  try {
    return simulate(options);
  } finally {
    if (shimMath) delete mocked.Math;
    random.mockRestore();
    sound.mockRestore();
  }
}

function simulate(options: SimulationOptions): SimulationTrace {
  const { difficulty, unlockAll, throughWave, continueEndless } = options;
  const goldRelics: GoldRelicMode = options.goldRelics ?? 'normal';
  const instance = new GameScene();
  const run = instance as unknown as Run, loose = instance as unknown as Record<string, unknown>;
  run.unlockRepository = new UnlockRepository(null, () => '2026-10-08T00:00:00Z');
  if (unlockAll) run.unlockRepository.earn(Object.values(ALTERNATIVE_BRANCH));
  run.init({ difficulty, playerName: 'Simulation Bot' });
  for (const name of PRESENTATION) loose[name] = () => {};
  loose.add = anyStub(); loose.world = (value: unknown) => value; run.speed = 1;
  // Capture the actual scene-produced result: GameOver receives it directly unless a
  // terminal defeat routes through the defeat-stage Preload request. The holder keeps
  // the assignment visible to control-flow analysis (the writes happen in a callback).
  const terminal: { payload: GameResultPayload | null } = { payload: null };
  run.scene = {
    start: (key, data) => {
      if (key === 'GameOver') terminal.payload = data as GameResultPayload;
      else if (key === 'Preload' && (data as { destination?: string } | undefined)?.destination === 'GameOver') {
        terminal.payload = (data as { data: GameResultPayload }).data;
      }
    },
    restart: () => {}
  };
  const relics: ProgressionTrace['relics'] = [];
  const grant = run.grantPowerup.bind(instance);
  run.grantPowerup = (id, reason, wantModal) => { relics.push({ wave: run.wave, id, used: false }); grant(id, reason, wantModal); };

  const purchases: PurchaseTrace[] = [];
  const branchFor = (id: TowerId): BranchId => (unlockAll ? ALTERNATIVE_BRANCH[id] : STARTER_BRANCH[id]);
  const step = (): void => run.update(0, SIM_STEP_MS);
  let planIndex = 0;

  type Candidate = { kind: 'build'; towerId: TowerId; plot: number; cost: number } | { kind: 'purchase'; tower: Tower; intent: PurchaseIntent; cost: number };
  const execute = (wave: number, candidate: Candidate): boolean => {
    const goldBefore = run.gold;
    if (candidate.kind === 'build') {
      const count = run.towers.length;
      run.tryBuild(candidate.towerId, candidate.plot);
      if (run.towers.length <= count) return false;
      const tower = run.towers[run.towers.length - 1];
      purchases.push({ wave, towerId: tower.towerId, branchId: null, rank: null, masteryRank: 0, spent: goldBefore - run.gold, goldAfter: run.gold });
      return true;
    }
    const { tower, intent } = candidate, revision = tower.progression.revision;
    run.selectedTower = tower;
    run.purchaseSelected(intent, tower.id, revision);
    if (tower.progression.revision <= revision) return false;
    purchases.push({ wave, towerId: tower.towerId, branchId: tower.progression.branchId, rank: tower.progression.rank, masteryRank: tower.progression.masteryRank, spent: goldBefore - run.gold, goldAfter: run.gold });
    return true;
  };

  /** Cheapest legal purchase on bot towers, else the cheapest tower on the best free plot; cheapestCost is that candidate's cost before the affordability check. */
  const fillerCandidate = (): { candidate: Candidate | null; hasNext: boolean; cheapestCost: number | null } => {
    let best: Candidate | null = null;
    for (const tower of run.towers) {
      const intents: PurchaseIntent[] = [{ kind: 'evolution-rank' }, { kind: 'foundation-upgrade' }, { kind: 'evolve', branchId: branchFor(tower.towerId) }];
      if (run.siege.phase === 'endless') intents.push({ kind: 'mastery' });
      for (const intent of intents) {
        const dry = purchaseEvolution(tower.towerId, tower.progression, intent, { ...run.purchaseContext(), gold: Number.MAX_SAFE_INTEGER }, tower.progression.revision);
        if (!dry.ok) continue;
        const cost = nextPurchaseCost(tower.towerId, tower.progression, intent);
        if (cost === null) continue;
        if (best === null || cost < best.cost) best = { kind: 'purchase', tower, intent, cost };
      }
    }
    if (best === null) {
      let cheapest = TOWER_LIST[0];
      for (const cfg of TOWER_LIST) if (cfg.levels[0].cost < cheapest.levels[0].cost) cheapest = cfg;
      const plot = bestPlot(run.occupied, cheapest.levels[0].range);
      if (plot === null) return { candidate: null, hasNext: false, cheapestCost: null };
      best = { kind: 'build', towerId: cheapest.id as TowerId, plot, cost: cheapest.levels[0].cost };
    }
    if (run.gold < best.cost) return { candidate: null, hasNext: true, cheapestCost: best.cost };
    return { candidate: best, hasNext: true, cheapestCost: best.cost };
  };

  type NextResult = { candidate: Candidate | null; fromPlan: boolean; hasNext: boolean; locked: boolean; cheapestCost: number | null; status: PlanStepStatus | 'after-plan' };
  /** Next candidate, or null with hasNext when nothing can be bought now. */
  const nextCandidate = (): NextResult => {
    while (planIndex < MIXED_BUILD.length) {
      const planned = MIXED_BUILD[planIndex];
      if (planned.intent === 'build') {
        const plot = bestPlot(run.occupied, TOWERS[planned.towerId].levels[0].range);
        if (plot === null) { planIndex++; continue; }
        const cost = TOWERS[planned.towerId].levels[0].cost;
        return run.gold >= cost
          ? { candidate: { kind: 'build', towerId: planned.towerId, plot, cost }, fromPlan: true, hasNext: true, locked: false, cheapestCost: null, status: 'buy' }
          : { candidate: null, fromPlan: true, hasNext: true, locked: false, cheapestCost: null, status: 'wait-gold' };
      }
      const tower = run.towers.find((t) => t.towerId === planned.towerId);
      if (!tower) { planIndex++; continue; }
      const intent: PurchaseIntent = planned.intent.kind === 'evolve' ? { kind: 'evolve', branchId: branchFor(planned.towerId) } : planned.intent;
      const dry = purchaseEvolution(tower.towerId, tower.progression, intent, { ...run.purchaseContext(), gold: Number.MAX_SAFE_INTEGER }, tower.progression.revision);
      const status = planStepStatus(dry, run.gold);
      switch (status) {
        case 'skip': planIndex++; continue;
        case 'buy': return { candidate: { kind: 'purchase', tower, intent, cost: (dry as { cost: number }).cost }, fromPlan: true, hasNext: true, locked: false, cheapestCost: null, status };
        case 'wait-gold': return { candidate: null, fromPlan: true, hasNext: true, locked: false, cheapestCost: null, status };
        case 'locked': {
          const f = fillerCandidate();
          return { candidate: f.candidate, fromPlan: false, hasNext: true, locked: true, cheapestCost: f.cheapestCost, status };
        }
      }
    }
    return { ...fillerCandidate(), fromPlan: false, locked: false, status: 'after-plan' };
  };

  const lockedSteps: SimulationTrace['lockedSteps'] = [], phaseEnds: SimulationTrace['phaseEnds'] = [];
  const buyPhase = (wave: number): { bought: number; hasNext: boolean } => {
    let bought = 0, fillerBought = 0;
    for (;;) {
      const next = nextCandidate();
      const stop = (hasNext: boolean): { bought: number; hasNext: boolean } => {
        if (next.locked) lockedSteps.push({ wave, fillerBought, goldAfterBuying: run.gold, cheapestFillerCost: next.cheapestCost });
        phaseEnds.push({ wave, status: next.status });
        return { bought, hasNext };
      };
      if (!next.candidate) return stop(next.hasNext);
      if (!execute(wave, next.candidate)) return stop(true);
      bought++;
      if (next.fromPlan) planIndex++;
      else if (next.locked) fillerBought++;
    }
  };

  const resolvePending = (resolve: (choice: 'store' | 'discard-new') => void): void => {
    while (run.vault.pending.length) {
      const before = run.vault.pending.length;
      resolve(run.vault.stored.length < POWERUP_INVENTORY_LIMIT ? 'store' : 'discard-new');
      if (run.vault.pending.length >= before) throw new Error(`relic reward could not be resolved at wave ${run.wave}`);
    }
  };

  const relicUses: SimulationTrace['relicUses'] = [];
  const useStored = (wave: number, index: number, boss: Enemy | null): void => {
    const id = run.vault.stored[index], before = run.vault.stored.length, grantsBefore = relics.length, pendingBefore = run.vault.pending.length;
    run.activatePowerup(index);
    if (id === 'meteor_strike' && run.vault.target && boss) run.castMeteor(boss.x, boss.y);
    // Kills caused by the use (Meteor) may grant relics that go straight into a free slot; those do not count against the use.
    const storedByGrants = (relics.length - grantsBefore) - (run.vault.pending.length - pendingBefore);
    if (run.vault.stored.length - storedByGrants >= before) {
      if (run.vault.target) run.vault.cancelTarget();
      throw new Error(`relic ${id} could not be used at wave ${wave}`);
    }
    relicUses.push({ wave, id });
    const granted = relics.find((r) => r.id === id && !r.used);
    if (granted) granted.used = true;
  };
  const prepareRelics = (wave: number): void => {
    for (;;) {
      if (goldRelics === 'normal' && run.siege.phase !== 'victory' && run.siege.phase !== 'terminal') {
        const i = goldRushIndex(run.vault.stored, wave, run.vault.pending.length);
        if (i >= 0) { useStored(wave, i, null); continue; }
      }
      if (run.vault.pending.length === 0) break;
      const before = run.vault.pending.length;
      run.vault.resolve(run.vault.stored.length < POWERUP_INVENTORY_LIMIT ? 'store' : 'discard-new');
      if (run.vault.pending.length >= before) throw new Error(`relic reward could not be resolved at wave ${wave}`);
    }
  };

  const goldByWave = [run.gold], leaksByWave: number[] = [], endless: EndlessCheckpoint[] = [];
  const bossWaves: SimulationTrace['bossWaves'] = [];
  let waitRun = 0, maxWait = 0, siegeWon = false, fullyEvolvedAtVictory = 0, victoryTimeMs: number | null = null, goldAtLastWaveStart = 0;
  for (let wave = 1; wave <= throughWave; wave++) {
    if (run.ended) break;
    prepareRelics(wave);
    const { bought, hasNext } = buyPhase(wave);
    if (wave >= 11 && wave <= 29) { waitRun = bought === 0 && hasNext ? waitRun + 1 : 0; maxWait = Math.max(maxWait, waitRun); }
    for (const tower of run.towers) tower.targeting = targetingForWave(wave);
    for (let i = 0; i < PREP_MS / SIM_STEP_MS; i++) step();
    goldAtLastWaveStart = run.gold;
    const livesBefore = run.lives;
    run.startNextWave();
    if (run.wave !== wave) throw new Error(`wave ${wave} did not start`);
    const config = getDifficulty(difficulty);
    const scheduledHp = run.spawnQueue.reduce((sum, s) => sum + enemyHpForWave(s.enemyId, wave, config, s.hpBonus), 0);
    const startedAt = run.gameTimeMs;
    const bossWave = buildWave(wave).isBossWave;
    const record: SimulationTrace['bossWaves'][number] | null = bossWave
      ? { wave, targeting: run.towers.map((t) => t.targeting), storedAtBossArrival: null, livesAtBossArrival: null, maxLives: run.maxLives }
      : null;
    if (record) bossWaves.push(record);
    let bossRelicsDone = false;
    while (run.waveActive && !run.ended) {
      step();
      if (run.gameTimeMs - startedAt > WAVE_TIMEOUT_MS) throw new Error(`wave ${wave} did not finish`);
      if (record && !bossRelicsDone && !run.ended && run.siege.phase !== 'victory' && run.siege.phase !== 'terminal') {
        const boss = run.enemies.find((e) => e.alive && e.isBoss && run.towers.some((t) => Math.hypot(t.x - e.x, t.y - e.y) <= t.stats.range));
        if (boss) {
          bossRelicsDone = true;
          record.storedAtBossArrival = [...run.vault.stored]; record.livesAtBossArrival = run.lives;
          const activatable = bossRelicsToActivate(record.storedAtBossArrival, run.lives, run.maxLives)
            .filter((id) => goldRelics === 'normal' || !GOLD_RELICS.has(id));
          for (const id of activatable) useStored(wave, run.vault.stored.indexOf(id), boss);
        }
      }
    }
    const leaks = livesBefore - run.lives;
    leaksByWave.push(leaks);
    if (run.ended) break;
    goldByWave.push(run.gold);
    if (run.siege.phase === 'victory') {
      siegeWon = true; fullyEvolvedAtVictory = run.towers.filter((t) => t.progression.rank === 3).length; victoryTimeMs = run.gameTimeMs;
      resolvePending((choice) => run.resolveVictoryReward(choice));
      run.chooseVictory(continueEndless && throughWave > 30 ? 'continue' : 'finish');
      if (run.ended) break;
    }
    if (continueEndless && ENDLESS_CHECKPOINTS.includes(wave)) {
      endless.push({
        wave, reached: true, lives: run.lives, leaks, gold: run.gold, scheduledHp, gameTimeMs: run.gameTimeMs,
        masteryRanks: run.towers.map((t) => t.progression.masteryRank),
        nextMasteryCosts: run.towers.map((t) => nextPurchaseCost(t.towerId, t.progression, { kind: 'mastery' }))
      });
    }
  }
  if (continueEndless) {
    for (const wave of ENDLESS_CHECKPOINTS) {
      if (wave > throughWave || endless.some((c) => c.wave === wave)) continue;
      endless.push({ wave, reached: false, lives: run.lives, leaks: 0, gold: run.gold, scheduledHp: 0, gameTimeMs: run.gameTimeMs, masteryRanks: [], nextMasteryCosts: [] });
    }
  }

  const simulatedGameTimeMs = victoryTimeMs ?? run.gameTimeMs;
  return {
    difficulty,
    debugAssisted: run.debugAssisted,
    unlocked: [...run.runUnlocks],
    purchases,
    firstEvolutionWave: purchases.find((p) => p.rank === 0)?.wave ?? null,
    firstRank2Wave: purchases.find((p) => p.rank === 2)?.wave ?? null,
    fullyEvolvedAtVictory,
    siegeWon,
    ordinaryRewardsOnly: !relicUses.some((u) => GOLD_RELICS.has(u.id)),
    duration1xSeconds: Math.round(simulatedGameTimeMs / 1000),
    maxForcedWaitWaves: maxWait,
    goldByWave,
    leaksByWave,
    relics,
    simulated: true,
    label: options.label,
    seed: options.seed,
    strategy: SIMULATION_STRATEGY,
    stepMs: SIM_STEP_MS,
    prepSecondsPerWave: PREP_MS / 1000,
    simulatedGameTimeMs,
    wavesCompleted: run.siege.wavesCompleted,
    finalLives: run.lives,
    outcome: terminal.payload?.outcome ?? (run.siege.phase === 'endless' ? 'endless' : 'incomplete'),
    terminalPayload: terminal.payload,
    goldRelics,
    endless,
    relicUses,
    goldAtLastWaveStart,
    bossWaves,
    lockedSteps,
    phaseEnds,
    relicAttribution: RELIC_ATTRIBUTION_NOTE
  };
}
