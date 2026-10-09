import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameScene } from '../src/game/scenes/GameScene.ts';
import { Tower } from '../src/game/entities/Tower.ts';
import { SoundManager } from '../src/game/systems/SoundManager.ts';
import { SiegeSystem } from '../src/game/systems/SiegeSystem.ts';
import { SAVE_FAILED_WARNING, UNLOCK_STORAGE_KEY, UnlockRepository } from '../src/game/systems/UnlockSystem.ts';
import type { PauseState } from '../src/game/systems/PauseState.ts';
import type { RelicVault } from '../src/game/systems/RunSimulation.ts';
import type { Enemy } from '../src/game/entities/Enemy.ts';
import type { BranchId } from '../src/shared/progression.ts';
import type { PowerUpId } from '../src/shared/types.ts';

vi.mock('phaser', () => ({ default: { Scene: class { constructor(_key?: string) {} }, Scenes: { Events: { SHUTDOWN: 'shutdown' } }, Scale: { Events: { RESIZE: 'resize' } } } }));
function anyStub(): any {
  const proxy: any = new Proxy(function () { return proxy; }, { get: (_t, key) => (key === 'then' ? undefined : key === Symbol.toPrimitive ? () => 0 : proxy), apply: () => proxy });
  return proxy;
}
function advanceSiege(to: number): SiegeSystem {
  const siege = new SiegeSystem();
  for (let wave = 1; wave <= to; wave++) { siege.startWave(wave); if (wave % 10 === 0) siege.bossKilled(wave); siege.completeWave({ wave, lives: 10, spawns: 0, enemies: 0, flights: 0, fields: 0 }); }
  return siege;
}
class MemoryStore { value: string | null = null; getItem = (_k: string) => this.value; setItem = (_k: string, v: string) => { this.value = v; }; }
interface Run {
  wave: number; wavesCompleted: number; waveActive: boolean; currentWaveIsBoss: boolean; lives: number; gold: number; debugAssisted: boolean;
  towers: Tower[]; enemies: Enemy[]; siege: SiegeSystem; vault: RelicVault; pauseState: PauseState; pendingMeteor: boolean;
  unlockRepository: UnlockRepository; runUnlocks: ReadonlySet<BranchId>; unlocksEarnedThisRun: BranchId[]; achievementNotices: Array<{ branchId: BranchId; remainingMs: number }>;
  checkWaveClear(): void; notifyAchievements(): void; updateAchievementNotices(ms: number): void; achievementNoticeText(id: BranchId): string; applyPowerup(id: PowerUpId): void; presentReward(): void;
  showRelicPanel: ReturnType<typeof vi.fn>; attachProgressionListeners(): void; cleanupProgression(): void;
}
const PRESENTATION = ['updateHUD', 'refreshInfoPanel', 'drawSheet', 'drawPowerupBar', 'refreshPlots', 'refreshPlacePanel', 'hideGhost', 'showBanner', 'floatText', 'floatTextForEnemy', 'drawCatalog', 'refreshTowerVisual', 'updateNextPreview', 'destroyView', 'renderVictory', 'showTouchPreview', 'drawAchievementNotice', 'impactBurst', 'addEffect'];
function sceneFixture(rank: 0 | 1 | 2 | 3 = 2) {
  vi.spyOn(SoundManager, 'get').mockReturnValue(anyStub());
  const scene = new GameScene(); scene.init({ difficulty: 'medium', playerName: 'Test Warden' });
  const run = scene as unknown as Run, loose = scene as unknown as Record<string, unknown>;
  for (const name of PRESENTATION) loose[name] = () => {};
  loose.add = anyStub(); loose.world = (v: unknown) => v;
  const store = new MemoryStore();
  run.unlockRepository = new UnlockRepository(store, () => '2026-10-08T00:00:00Z'); run.runUnlocks = run.unlockRepository.snapshotForRun();
  const tower = new Tower('longbow', 100, 100, 0);
  tower.progression = { ...tower.progression, foundationLevel: 4, branchId: 'marksman', rank };
  run.towers = [tower];
  return { run, store };
}
function atWave(run: Run, wave: number): void {
  run.siege = advanceSiege(wave - 1); run.siege.startWave(wave);
  run.wave = wave; run.wavesCompleted = wave - 1; run.waveActive = true; run.currentWaveIsBoss = wave % 10 === 0; run.lives = 10;
}
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('in-run achievements', () => {
  it('earns on wave-20 completion, saves at once and keeps the current run fixed', () => {
    const { run, store } = sceneFixture(); atWave(run, 20);
    run.checkWaveClear();
    expect(run.unlocksEarnedThisRun).toEqual(['volley']);
    expect(run.achievementNotices).toEqual([{ branchId: 'volley', remainingMs: 3000 }]);
    expect(run.runUnlocks.has('volley')).toBe(false);
    expect(new UnlockRepository(store).snapshotForRun().has('volley')).toBe(true);
  });
  it.each([['debug-assisted', 2, 20, true], ['another wave', 2, 19, false], ['rank 1', 1, 20, false]] as const)('earns nothing when %s', (_n, rank, wave, debug) => {
    const { run } = sceneFixture(rank); atWave(run, wave); run.debugAssisted = debug;
    run.checkWaveClear();
    expect(run.unlocksEarnedThisRun).toEqual([]); expect(run.achievementNotices).toEqual([]);
  });
  it('does not announce a branch unlocked in an earlier run', () => {
    const { run } = sceneFixture(); run.unlockRepository.earn(['volley']); atWave(run, 20);
    run.checkWaveClear();
    expect(run.unlocksEarnedThisRun).toEqual([]);
  });
  it('notifies once and expires in visible time without pausing', () => {
    const { run } = sceneFixture(); run.unlocksEarnedThisRun = ['volley'];
    run.notifyAchievements(); run.notifyAchievements();
    expect(run.achievementNotices).toHaveLength(1); expect(run.pauseState.blocked).toBe(false);
    run.updateAchievementNotices(2999); expect(run.achievementNotices).toHaveLength(1);
    run.updateAchievementNotices(1); expect(run.achievementNotices).toHaveLength(0);
  });
  it('shows the exact save-failure message on the notice of an unsaved unlock', () => {
    const { run } = sceneFixture();
    run.unlockRepository.earn(['volley']);
    expect(run.achievementNoticeText('volley')).toBe('Unlocked: Volley');
    run.unlockRepository = new UnlockRepository(null, () => '2026-10-08T00:00:00Z'); run.unlockRepository.earn(['volley']);
    expect(SAVE_FAILED_WARNING).toBe('Unlock earned, but progress could not be saved');
    expect(run.achievementNoticeText('volley')).toBe('Unlocked: Volley · Unlock earned, but progress could not be saved');
  });
});

describe('victory-only relic exits', () => {
  it.each(['meteor_strike', 'treasure_goblin', 'emergency_repair'] as const)('blocks use of %s during the victory decision', (id) => {
    const { run } = sceneFixture(); run.siege = advanceSiege(30);
    const enemies = run.enemies.length, lives = run.lives, gold = run.gold;
    run.applyPowerup(id);
    expect([run.enemies.length, run.lives, run.gold, run.pendingMeteor]).toEqual([enemies, lives, gold, false]);
  });
  it('offers Replace Oldest or Store plus Discard New and never activates', () => {
    const { run } = sceneFixture(); run.siege = advanceSiege(30);
    run.vault.stored.push('meteor_strike', 'treasure_goblin', 'emergency_repair'); run.vault.offer('battle_cry', 'boss', true);
    run.showRelicPanel = vi.fn(); const beginUse = vi.spyOn(run.vault, 'beginUse');
    run.presentReward();
    expect(run.showRelicPanel).toHaveBeenCalledWith('battle_cry', 'boss', true, expect.any(Function), expect.any(Function), true);
    (run.showRelicPanel.mock.calls[0][3] as () => void)();
    expect(run.vault.stored).toEqual(['treasure_goblin', 'emergency_repair', 'battle_cry']);
    expect(run.vault.pending).toHaveLength(0); expect(beginUse).not.toHaveBeenCalled();
    run.vault.stored.splice(0); run.vault.offer('arcane_surge', 'boss', true);
    run.presentReward();
    expect(run.showRelicPanel.mock.calls[1][2]).toBe(false);
    (run.showRelicPanel.mock.calls[1][3] as () => void)();
    expect(run.vault.stored).toEqual(['arcane_surge']);
  });
  it('keeps siege-time reward choices unchanged', () => {
    const { run } = sceneFixture();
    run.vault.stored.push('meteor_strike', 'treasure_goblin', 'emergency_repair'); run.vault.offer('battle_cry', 'boss', true);
    run.showRelicPanel = vi.fn(); run.presentReward();
    expect(run.showRelicPanel.mock.calls[0][5]).toBeUndefined();
  });
});

describe('cross-tab listener', () => {
  it('reconciles on storage events and removes its listener once', () => {
    const add = vi.fn(), remove = vi.fn();
    vi.stubGlobal('window', { addEventListener: add, removeEventListener: remove });
    const { run } = sceneFixture(); const reconcile = vi.spyOn(run.unlockRepository, 'reconcile');
    run.attachProgressionListeners(); run.attachProgressionListeners();
    expect(add).toHaveBeenCalledTimes(1);
    (add.mock.calls[0][1] as (e: { key: string | null }) => void)({ key: UNLOCK_STORAGE_KEY });
    expect(reconcile).toHaveBeenCalledTimes(1);
    run.cleanupProgression(); run.cleanupProgression();
    expect(remove).toHaveBeenCalledTimes(1); expect(remove.mock.calls[0][1]).toBe(add.mock.calls[0][1]);
  });
});
