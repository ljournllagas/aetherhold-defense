import { afterEach, describe, expect, it, vi } from 'vitest';
import { Tower } from '../src/game/entities/Tower.ts';
import { Enemy } from '../src/game/entities/Enemy.ts';
import { waveClearBonus } from '../src/game/systems/EconomySystem.ts';
import { submitScore } from '../src/api/leaderboardClient.ts';
import { saveBest } from '../src/game/systems/Settings.ts';
import { validateScorePayload } from '../src/shared/validation.ts';
import { UnlockRepository } from '../src/game/systems/UnlockSystem.ts';
import { advanceSiege, anyStub, atWave, sceneFixture, terminalRulePayload, warlord } from './helpers/terminalRuleFixtures.ts';
import type { BranchId } from '../src/shared/progression.ts';
import type { AutoSystem } from '../src/game/systems/AutoSystem.ts';

vi.mock('phaser', () => ({ default: { Scene: class { constructor(_key?: string) {} }, Scenes: { Events: { SHUTDOWN: 'shutdown' } }, Scale: { Events: { RESIZE: 'resize' } } } }));
vi.mock('../src/api/leaderboardClient.ts', async (importOriginal) => ({ ...(await importOriginal<typeof import('../src/api/leaderboardClient.ts')>()), submitScore: vi.fn() }));
vi.mock('../src/game/systems/Settings.ts', async (importOriginal) => ({ ...(await importOriginal<typeof import('../src/game/systems/Settings.ts')>()), saveBest: vi.fn() }));
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

describe('final-configuration terminal rule integration', () => {
  it.each(['siege-failed', 'endless-defeat'] as const)('validates the final %s scene-produced payload', (kind) => {
    const progress = kind === 'siege-failed'
      ? { highestWave: 10, wavesCompleted: 9, outcome: 'siege-failed', siegeBossesDefeated: 0 }
      : { highestWave: 31, wavesCompleted: 30, outcome: 'defeat', siegeBossesDefeated: 7 };
    const { payload, startKey } = terminalRulePayload(kind);
    // Lives remain in a siege failure, so results load directly; a zero-life endless
    // defeat needs the defeat art and routes through the defeat-stage Preload request.
    expect(startKey).toBe(kind === 'siege-failed' ? 'GameOver' : 'Preload');
    expect(payload).toMatchObject(progress);
    expect(validateScorePayload(payload).errors).toEqual([]);
    expect(submitScore).not.toHaveBeenCalled();
  });
});

