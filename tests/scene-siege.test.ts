import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameScene } from '../src/game/scenes/GameScene.ts';
import { Tower } from '../src/game/entities/Tower.ts';
import { Enemy } from '../src/game/entities/Enemy.ts';
import { SoundManager } from '../src/game/systems/SoundManager.ts';
import { SiegeSystem } from '../src/game/systems/SiegeSystem.ts';
import { waveClearBonus } from '../src/game/systems/EconomySystem.ts';
import { submitScore } from '../src/api/leaderboardClient.ts';
import { saveBest } from '../src/game/systems/Settings.ts';
import type { EvolutionCombat } from '../src/game/systems/EvolutionCombat.ts';
import type { RelicVault } from '../src/game/systems/RunSimulation.ts';
import type { AutoSystem } from '../src/game/systems/AutoSystem.ts';
import type { RunOutcome } from '../src/shared/progression.ts';
import type { BranchId } from '../src/shared/progression.ts';
import { UnlockRepository } from '../src/game/systems/UnlockSystem.ts';

vi.mock('phaser', () => ({ default: { Scene: class { constructor(_key?: string) {} }, Scenes: { Events: { SHUTDOWN: 'shutdown' } }, Scale: { Events: { RESIZE: 'resize' } } } }));
vi.mock('../src/api/leaderboardClient.ts', async (importOriginal) => ({ ...(await importOriginal<typeof import('../src/api/leaderboardClient.ts')>()), submitScore: vi.fn() }));
vi.mock('../src/game/systems/Settings.ts', async (importOriginal) => ({ ...(await importOriginal<typeof import('../src/game/systems/Settings.ts')>()), saveBest: vi.fn() }));
function anyStub(): any {
  const proxy: any = new Proxy(function () { return proxy; }, { get: (_t, key) => (key === 'then' ? undefined : key === Symbol.toPrimitive ? () => 0 : proxy), apply: () => proxy });
  return proxy;
}
function advanceSiege(to: number): SiegeSystem {
  const siege = new SiegeSystem();
  for (let wave = 1; wave <= to; wave++) { siege.startWave(wave); if (wave % 10 === 0) siege.bossKilled(wave); siege.completeWave({ wave, lives: 10, spawns: 0, enemies: 0, flights: 0, fields: 0 }); }
  return siege;
}
interface Run {
  wave: number; wavesCompleted: number; waveActive: boolean; currentWaveIsBoss: boolean; lives: number; gold: number; runId: string; paused: boolean; modal: unknown;
  towers: Tower[]; enemies: Enemy[]; siege: SiegeSystem; evolutionCombat: EvolutionCombat; vault: RelicVault; scheduledBossIds: Map<number, number>;
  scene: { start: ReturnType<typeof vi.fn>; restart: ReturnType<typeof vi.fn> };
  handleLeak(e: Enemy): boolean; killEnemy(e: Enemy): void; checkWaveClear(): void; enterVictory(): void; renderVictory(): void;
  chooseVictory(action: 'finish' | 'continue'): void; pauseMenuAvailable(): boolean; togglePauseMenu(): void;
  finishRun(outcome: RunOutcome): void; cleanupProgression(): void; startNextWave(): void; tryBuild(id: string, plot: number): void;
}
const PRESENTATION = ['updateHUD', 'refreshInfoPanel', 'drawSheet', 'drawPowerupBar', 'refreshPlots', 'refreshPlacePanel', 'hideGhost', 'showBanner', 'floatText', 'floatTextForEnemy', 'impactAt', 'impactBurst', 'startDeathAnim', 'drawCatalog', 'refreshTowerVisual', 'updateNextPreview', 'destroyView', 'renderVictory', 'showTouchPreview'];
function sceneFixture() {
  vi.spyOn(SoundManager, 'get').mockReturnValue(anyStub());
  const scene = new GameScene(); scene.init({ difficulty: 'medium', playerName: 'Test Warden' });
  const run = scene as unknown as Run, loose = scene as unknown as Record<string, unknown>;
  for (const name of PRESENTATION) loose[name] = () => {};
  run.scene = { start: vi.fn(), restart: vi.fn() };
  return { run, loose };
}
function atWave(run: Run, wave: number): void {
  run.siege = advanceSiege(wave - 1); run.siege.startWave(wave);
  run.wave = wave; run.wavesCompleted = wave - 1; run.waveActive = true; run.currentWaveIsBoss = wave % 10 === 0;
}
const warlord = () => new Enemy('warlord', 5000, 40, 150);
afterEach(() => { vi.restoreAllMocks(); vi.mocked(submitScore).mockClear(); vi.mocked(saveBest).mockClear(); });

describe('boss milestones and terminal events', () => {
  it.each([10, 30])('ends as a siege failure when the wave-%i boss escapes with lives left', (wave) => {
    const { run } = sceneFixture(); atWave(run, wave); run.lives = 20;
    const boss = warlord(); run.enemies = [boss]; run.scheduledBossIds.set(boss.id, wave);
    expect(run.handleLeak(boss)).toBe(true);
    expect(run.scene.start).toHaveBeenCalledTimes(1);
    expect(run.scene.start).toHaveBeenCalledWith('GameOver', expect.objectContaining({ outcome: 'siege-failed', highestWave: wave, wavesCompleted: wave - 1, remainingLives: 15, siegeBossesDefeated: wave === 30 ? 3 : 0, runId: run.runId }));
    expect(saveBest).toHaveBeenCalledTimes(1);
  });
  it('applies ordinary lives rules to the wave-20 boss', () => {
    const { run } = sceneFixture(); atWave(run, 20); run.lives = 20;
    const boss = warlord(); run.scheduledBossIds.set(boss.id, 20);
    expect(run.handleLeak(boss)).toBe(false);
    expect([run.lives, run.siege.phase]).toEqual([15, 'siege']); expect(run.scene.start).not.toHaveBeenCalled();
  });
  it('records defeat with zero lives even when a required boss escapes', () => {
    const { run } = sceneFixture(); atWave(run, 10); run.lives = 5;
    const boss = warlord(); run.scheduledBossIds.set(boss.id, 10);
    run.handleLeak(boss);
    expect(run.scene.start).toHaveBeenCalledWith('Preload', expect.objectContaining({ stage: 'defeat', destination: 'GameOver', data: expect.objectContaining({ outcome: 'defeat', remainingLives: 0, highestWave: 10, wavesCompleted: 9 }) }));
  });
  it('opens evolution only when the scheduled wave-10 boss dies', () => {
    const { run } = sceneFixture(); atWave(run, 10);
    run.killEnemy(new Enemy('pilferer', 10, 40, 250)); run.killEnemy(warlord());
    expect(run.siege.evolutionOpen).toBe(false);
    const boss = warlord(); run.scheduledBossIds.set(boss.id, 10); run.killEnemy(boss);
    expect(run.siege.evolutionOpen).toBe(true);
  });
});

describe('victory decision', () => {
  it('waits for every field before victory and pays the wave-30 bonus once', () => {
    const { run } = sceneFixture(); atWave(run, 30); run.siege.bossKilled(30);
    const mortar = new Tower('ember', 0, 0, 0);
    mortar.progression = { ...mortar.progression, foundationLevel: 4, branchId: 'flame-mortar', rank: 0 };
    run.evolutionCombat.addField(run.evolutionCombat.makeShot(mortar, [mortar], 1), 0, 0, 0);
    const gold = run.gold;
    run.checkWaveClear(); expect([run.siege.phase, run.gold]).toEqual(['siege', gold]);
    run.evolutionCombat.clear(); run.checkWaveClear(); run.checkWaveClear();
    expect([run.siege.phase, run.gold, run.wavesCompleted]).toEqual(['victory', gold + waveClearBonus(30), 30]);
  });
  it('cancels an uncommitted Meteor target without consuming it', () => {
    const { run } = sceneFixture(); run.vault.stored.push('meteor_strike'); run.vault.beginUse(0, true);
    run.siege = advanceSiege(30); run.enterVictory();
    expect([run.vault.target, run.vault.stored]).toEqual([null, ['meteor_strike']]);
  });
  it('continues once only after rewards resolve, keeps the run and starts wave 31', () => {
    const { run } = sceneFixture(); run.siege = advanceSiege(30); run.wave = 30; run.wavesCompleted = 30;
    run.vault.stored.push('meteor_strike', 'treasure_goblin', 'emergency_repair'); run.vault.offer('battle_cry', 'boss', true);
    const id = run.runId;
    run.chooseVictory('continue'); expect(run.siege.phase).toBe('victory');
    run.vault.resolve('replace-oldest'); run.modal = null;
    run.chooseVictory('continue'); run.chooseVictory('continue');
    expect([run.siege.phase, run.runId]).toEqual(['endless', id]);
    run.startNextWave(); expect([run.wave, run.siege.highestWave]).toEqual([31, 31]);
    expect(submitScore).not.toHaveBeenCalled(); expect(run.scene.start).not.toHaveBeenCalled();
  });
  it('finishes once with a terminal victory payload and no automatic submission', () => {
    const { run } = sceneFixture(); run.siege = advanceSiege(30); run.wave = 30; run.wavesCompleted = 30; run.lives = 12;
    run.chooseVictory('finish'); run.chooseVictory('finish');
    expect(run.scene.start).toHaveBeenCalledTimes(1);
    expect(run.scene.start).toHaveBeenCalledWith('GameOver', expect.objectContaining({ outcome: 'victory', highestWave: 30, wavesCompleted: 30, remainingLives: 12, siegeBossesDefeated: 7 }));
    expect(submitScore).not.toHaveBeenCalled();
  });
  it('keeps Pause reachable during the victory decision without changing the phase', () => {
    const { run, loose } = sceneFixture(); run.siege = advanceSiege(30);
    loose.add = anyStub(); loose.uiRoot = anyStub(); delete loose.renderVictory;
    run.renderVictory();
    expect(run.modal).toBe(null); expect(run.pauseMenuAvailable()).toBe(true);
    run.togglePauseMenu();
    expect([run.paused, run.siege.phase]).toEqual([true, 'victory']);
    run.chooseVictory('continue'); expect(run.siege.phase).toBe('victory');
  });
  it('blocks wave start and building during the victory decision', () => {
    const { run } = sceneFixture(); run.siege = advanceSiege(30); run.wave = 30; run.wavesCompleted = 30;
    run.startNextWave(); run.tryBuild('longbow', 1);
    expect([run.wave, run.towers.length]).toEqual([30, 0]);
  });
  it('passes earned unlocks with their saved state to the results screen', () => {
    const { run } = sceneFixture(); run.siege = advanceSiege(30); run.wave = 30; run.wavesCompleted = 30;
    const extra = run as unknown as { unlocksEarnedThisRun: BranchId[]; unlockRepository: UnlockRepository };
    extra.unlockRepository = new UnlockRepository(null); extra.unlockRepository.earn(['volley']); extra.unlocksEarnedThisRun = ['volley'];
    run.chooseVictory('finish');
    expect(run.scene.start).toHaveBeenCalledWith('GameOver', expect.objectContaining({ unlocksEarned: [{ branchId: 'volley', saved: false }] }));
  });
});

describe('discarded runs', () => {
  it('creates no result before the first wave or on restart/quit cleanup', () => {
    const { run } = sceneFixture();
    run.finishRun('defeat');
    expect(run.scene.start).not.toHaveBeenCalled(); expect(saveBest).not.toHaveBeenCalled();
    run.siege = advanceSiege(30); run.scheduledBossIds.set(1, 30);
    run.cleanupProgression(); run.cleanupProgression();
    expect(run.scene.start).not.toHaveBeenCalled();
    expect([run.scheduledBossIds.size, run.evolutionCombat.activeFieldCount]).toEqual([0, 0]);
  });
});

it.each(['finish','continue'] as const)('Auto %s leaves score submission manual',(action)=>{
  const {run}=sceneFixture();run.siege=advanceSiege(30);run.wave=30;run.wavesCompleted=30;
  const automatic=run as unknown as {auto:AutoSystem;setAutoEnabled(value:boolean):void};
  automatic.setAutoEnabled(true);run.vault.offer('emergency_repair','retained',true);
  run.chooseVictory(action);
  expect(run.siege.phase).toBe(action==='finish'?'terminal':'endless');
  expect(submitScore).not.toHaveBeenCalled();
});
