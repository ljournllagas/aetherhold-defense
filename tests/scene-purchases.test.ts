import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameScene } from '../src/game/scenes/GameScene.ts';
import { Tower } from '../src/game/entities/Tower.ts';
import { SoundManager } from '../src/game/systems/SoundManager.ts';
import type { PauseState } from '../src/game/systems/PauseState.ts';
import type { SiegeSystem } from '../src/game/systems/SiegeSystem.ts';
import type { EvolutionCombat } from '../src/game/systems/EvolutionCombat.ts';
import type { PurchaseIntent } from '../src/game/systems/EvolutionSystem.ts';
import type { BranchId } from '../src/shared/progression.ts';

vi.mock('phaser', () => ({ default: { Scene: class { constructor(_key?: string) {} }, Scenes: { Events: { SHUTDOWN: 'shutdown' } }, Scale: { Events: { RESIZE: 'resize' } } } }));
function anyStub(): any {
  const proxy: any = new Proxy(function () { return proxy; }, { get: (_t, key) => (key === 'then' ? undefined : key === Symbol.toPrimitive ? () => 0 : proxy), apply: () => proxy });
  return proxy;
}
interface Run {
  gold: number; waveActive: boolean; ended: boolean; towers: Tower[]; selectedTower: Tower | null; occupied: Set<number>;
  siege: SiegeSystem; evolutionCombat: EvolutionCombat; runUnlocks: ReadonlySet<BranchId>; pauseState: PauseState;
  floatText: ReturnType<typeof vi.fn>; showBanner: ReturnType<typeof vi.fn>;
  purchaseSelected(intent: PurchaseIntent, towerId: number, revision: number): void; upgradeSelected(): void; sellSelected(): void; tryBuild(id: string, plot: number): void;
}
const PRESENTATION = ['updateHUD', 'refreshInfoPanel', 'drawSheet', 'drawPowerupBar', 'refreshPlots', 'refreshPlacePanel', 'hideGhost', 'floatTextForEnemy', 'drawCatalog', 'refreshTowerVisual', 'updateNextPreview'];
function sceneFixture() {
  vi.spyOn(SoundManager, 'get').mockReturnValue(anyStub());
  const scene = new GameScene(); scene.init({ difficulty: 'medium', playerName: 'Test Warden' });
  const run = scene as unknown as Run, loose = scene as unknown as Record<string, unknown>;
  for (const name of PRESENTATION) loose[name] = () => {};
  run.floatText = vi.fn(); run.showBanner = vi.fn();
  const tower = new Tower('longbow', 100, 100, 0);
  tower.progression = { ...tower.progression, foundationLevel: 4, invested: 710 };
  run.towers = [tower]; run.selectedTower = tower; run.occupied = new Set([0]); run.gold = 2000;
  run.siege.bossKilled(10); run.runUnlocks = new Set<BranchId>();
  return { scene, run, tower };
}
afterEach(() => vi.restoreAllMocks());

describe('scene purchase transactions', () => {
  it('commits an evolution once and ignores the repeated stale action', () => {
    const { run, tower } = sceneFixture();
    run.purchaseSelected({ kind: 'evolve', branchId: 'marksman' }, tower.id, 0);
    expect(run.gold).toBe(1490);
    expect(tower.progression).toMatchObject({ branchId: 'marksman', rank: 0, invested: 1220, revision: 1 });
    run.purchaseSelected({ kind: 'evolve', branchId: 'marksman' }, tower.id, 0);
    expect([run.gold, tower.progression.revision]).toEqual([1490, 1]);
  });
  it('blocks purchases in victory, terminal, every pause reason and after the end', () => {
    const { run, tower } = sceneFixture(), before = structuredClone(tower.progression);
    const attempt = () => run.purchaseSelected({ kind: 'evolve', branchId: 'marksman' }, tower.id, 0);
    run.siege.phase = 'victory'; attempt(); run.siege.phase = 'terminal'; attempt(); run.siege.phase = 'siege';
    for (const reason of ['user', 'modal', 'background'] as const) { run.pauseState.set(reason, true); attempt(); run.pauseState.set(reason, false); }
    run.ended = true; attempt();
    expect(tower.progression).toEqual(before); expect(run.gold).toBe(2000);
  });
  it('allows purchases during an active wave', () => {
    const { run, tower } = sceneFixture(); run.waveActive = true;
    run.purchaseSelected({ kind: 'evolve', branchId: 'marksman' }, tower.id, 0);
    expect(tower.progression.branchId).toBe('marksman');
  });
  it('rejects an action prepared for another tower and explains failures', () => {
    const { run, tower } = sceneFixture();
    run.purchaseSelected({ kind: 'evolve', branchId: 'marksman' }, tower.id + 1000, 0);
    expect(run.showBanner).toHaveBeenCalledWith('Tower changed; try again', expect.any(String));
    run.gold = 100; run.purchaseSelected({ kind: 'evolve', branchId: 'marksman' }, tower.id, 0);
    expect(run.floatText).toHaveBeenCalledWith(100, 70, 'Not enough gold', expect.any(String));
    expect(tower.progression.branchId).toBe(null);
  });
  it('routes foundation upgrades through the transaction', () => {
    const { run } = sceneFixture(), fresh = new Tower('longbow', 200, 200, 1);
    run.towers.push(fresh); run.selectedTower = fresh; run.upgradeSelected();
    expect([fresh.level, fresh.progression.invested, run.gold]).toEqual([2, 190, 1910]);
  });
  it('resets the hit counter only on first evolution and keeps cooldown, targeting and position', () => {
    const { run, tower } = sceneFixture();
    tower.counter.successes = 3; tower.cooldown = 0.5; tower.targeting = 'strongest';
    run.purchaseSelected({ kind: 'evolve', branchId: 'marksman' }, tower.id, 0);
    expect(tower.counter.successes).toBe(0);
    expect([tower.x, tower.y, tower.cooldown, tower.targeting]).toEqual([100, 100, 0.5, 'strongest']);
    tower.counter.successes = 2; run.purchaseSelected({ kind: 'evolution-rank' }, tower.id, 1);
    expect([tower.counter.successes, tower.progression.rank]).toEqual([2, 1]);
  });
  it('sells for 70% of recorded spend and removes the owner field', () => {
    const { run, tower } = sceneFixture();
    run.purchaseSelected({ kind: 'evolve', branchId: 'marksman' }, tower.id, 0);
    const remove = vi.spyOn(run.evolutionCombat, 'removeOwner');
    run.sellSelected();
    expect(run.gold).toBe(1490 + 854); expect(run.towers).toHaveLength(0); expect(remove).toHaveBeenCalledWith(tower.id);
  });
  it('rejects building and selling while blocked', () => {
    const { run } = sceneFixture(); run.siege.phase = 'victory';
    run.tryBuild('longbow', 1); run.sellSelected();
    expect([run.towers.length, run.gold]).toEqual([1, 2000]);
  });
  it('restarts with fresh run development', () => {
    const { scene, run } = sceneFixture(); run.siege.phase = 'endless';
    scene.init({ difficulty: 'medium' });
    expect([run.towers.length, run.gold, run.siege.phase, run.siege.evolutionOpen, run.evolutionCombat.activeFieldCount]).toEqual([0, 600, 'siege', false, 0]);
  });
});
