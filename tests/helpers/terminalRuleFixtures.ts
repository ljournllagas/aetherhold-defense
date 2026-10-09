import { vi } from 'vitest';
import { GameScene } from '../../src/game/scenes/GameScene.ts';
import { Enemy } from '../../src/game/entities/Enemy.ts';
import { SoundManager } from '../../src/game/systems/SoundManager.ts';
import { SiegeSystem } from '../../src/game/systems/SiegeSystem.ts';
import { buildWave } from '../../src/game/systems/WaveSystem.ts';
import { ENEMIES } from '../../src/game/config/enemies.ts';
import { resultFixture } from './progressionResult.ts';
import type { EvolutionCombat } from '../../src/game/systems/EvolutionCombat.ts';
import type { RelicVault } from '../../src/game/systems/RunSimulation.ts';
import type { Tower } from '../../src/game/entities/Tower.ts';
import type { RunOutcome } from '../../src/shared/progression.ts';

export function anyStub(): any {
  const proxy: any = new Proxy(function () { return proxy; }, { get: (_t, key) => (key === 'then' ? undefined : key === Symbol.toPrimitive ? () => 0 : proxy), apply: () => proxy });
  return proxy;
}

export function advanceSiege(to: number): SiegeSystem {
  const siege = new SiegeSystem();
  for (let wave = 1; wave <= to; wave++) { siege.startWave(wave); if (wave % 10 === 0) siege.bossKilled(wave); siege.completeWave({ wave, lives: 10, spawns: 0, enemies: 0, flights: 0, fields: 0 }); }
  return siege;
}

export interface Run {
  wave: number; wavesCompleted: number; waveActive: boolean; currentWaveIsBoss: boolean; lives: number; gold: number; runId: string; paused: boolean; modal: unknown;
  towers: Tower[]; enemies: Enemy[]; siege: SiegeSystem; evolutionCombat: EvolutionCombat; vault: RelicVault; scheduledBossIds: Map<number, number>;
  scene: { start: ReturnType<typeof vi.fn>; restart: ReturnType<typeof vi.fn> };
  handleLeak(e: Enemy): boolean; killEnemy(e: Enemy): void; checkWaveClear(): void; enterVictory(): void; renderVictory(): void;
  chooseVictory(action: 'finish' | 'continue'): void; pauseMenuAvailable(): boolean; togglePauseMenu(): void;
  finishRun(outcome: RunOutcome): void; cleanupProgression(): void; startNextWave(): void; tryBuild(id: string, plot: number): void;
}

export const PRESENTATION = ['updateHUD', 'refreshInfoPanel', 'drawSheet', 'drawPowerupBar', 'refreshPlots', 'refreshPlacePanel', 'hideGhost', 'showBanner', 'floatText', 'floatTextForEnemy', 'impactAt', 'impactBurst', 'startDeathAnim', 'drawCatalog', 'refreshTowerVisual', 'updateNextPreview', 'destroyView', 'renderVictory', 'showTouchPreview'];

export function sceneFixture(): { run: Run; loose: Record<string, unknown> } {
  vi.spyOn(SoundManager, 'get').mockReturnValue(anyStub());
  const scene = new GameScene(); scene.init({ difficulty: 'medium', playerName: 'Test Warden' });
  const run = scene as unknown as Run, loose = scene as unknown as Record<string, unknown>;
  for (const name of PRESENTATION) loose[name] = () => {};
  run.scene = { start: vi.fn(), restart: vi.fn() };
  return { run, loose };
}

export function atWave(run: Run, wave: number): void {
  run.siege = advanceSiege(wave - 1); run.siege.startWave(wave);
  run.wave = wave; run.wavesCompleted = wave - 1; run.waveActive = true; run.currentWaveIsBoss = wave % 10 === 0;
}

export const warlord = (): Enemy => new Enemy('warlord', 5000, 40, 150);

export type TerminalRuleKind = 'siege-failed' | 'endless-defeat';

/**
 * Drives the real scene rules (handleLeak -> finishRun -> result routing) for the two
 * non-victory terminal shapes and returns the payload the scene actually produced.
 * This is seeded rule integration evidence, never a natural play trace.
 */
export function terminalRulePayload(kind: TerminalRuleKind): { payload: Record<string, unknown>; startKey: string } {
  const { run, loose } = sceneFixture();
  const progress = kind === 'siege-failed'
    ? { highestWave: 10, wavesCompleted: 9, outcome: 'siege-failed' as const, siegeBossesDefeated: 0 }
    : { highestWave: 31, wavesCompleted: 30, outcome: 'defeat' as const, siegeBossesDefeated: 7 };
  const before = resultFixture(progress, kind === 'siege-failed' ? 15 : 0);
  if (kind === 'siege-failed') atWave(run, 10);
  else {
    run.siege = advanceSiege(30); run.chooseVictory('continue'); run.siege.startWave(31);
    run.wave = 31; run.wavesCompleted = 30; run.waveActive = true;
  }
  loose.enemiesKilled = before.enemiesKilled; loose.bossesKilled = before.bossesKilled;
  loose.elitesKilled = Array.from({ length: progress.wavesCompleted }, (_, index) => buildWave(index + 1).groups)
    .flat().filter((group) => ENEMIES[group.enemyId].isElite).reduce((total, group) => total + group.count, 0);
  loose.runningDurationMs = before.gameDurationSeconds * 1000; run.gold = 0;
  const enemy = kind === 'siege-failed' ? warlord() : new Enemy('thornling', 1, 40, 8);
  run.lives = kind === 'siege-failed' ? 20 : enemy.livesLost;
  run.enemies = [enemy];
  if (kind === 'siege-failed') run.scheduledBossIds.set(enemy.id, 10);
  run.handleLeak(enemy);
  const [startKey, data] = run.scene.start.mock.calls[0] as [string, { data?: Record<string, unknown> }];
  return { payload: (startKey === 'Preload' ? data.data : data) as Record<string, unknown>, startKey };
}
