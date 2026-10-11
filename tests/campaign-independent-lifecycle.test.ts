import { afterEach, describe, expect, it, vi } from 'vitest';
import { EventEmitter } from 'eventemitter3';
import { GameScene } from '../src/game/scenes/GameScene.ts';
import { CampaignRepository, campaignRepository } from '../src/game/campaign/progress.ts';
import { getCampaignEnemy } from '../src/game/campaign/enemies.ts';
import { CAMPAIGN_LEVELS } from '../src/game/campaign/config.ts';
import { CAMPAIGN_BOSS_TUNING } from '../src/game/campaign/bosses.ts';
import { SIMULATION_STEP_MS } from '../src/game/systems/SimulationClock.ts';
import { Enemy } from '../src/game/entities/Enemy.ts';
import { Tower } from '../src/game/entities/Tower.ts';
import { TOWERS } from '../src/game/config/towers.ts';
import { SoundManager } from '../src/game/systems/SoundManager.ts';
import * as settings from '../src/game/systems/Settings.ts';
import * as scores from '../src/api/leaderboardClient.ts';
import type { TowerId } from '../src/shared/progression.ts';

vi.mock('phaser', () => ({ default: { Scene: class { constructor(_key?: string) {} }, Math: { Vector2: class { constructor(public x: number, public y: number) {} } }, Scenes: { Events: { SHUTDOWN: 'shutdown' } }, Scale: { Events: { RESIZE: 'resize' } } } }));
vi.mock('../src/game/art/towerArt.ts', () => ({ buildTowerVisual: () => ({ view: anyStub(), crown: anyStub(), muzzleX: 0, muzzleY: -32 }), decorateEvolution: () => {}, towerPortraitKey: () => 'tower' }));

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function anyStub(): any {
  const proxy: any = new Proxy(function () { return proxy; }, {
    get: (_target, key) => key === 'then' ? undefined : key === Symbol.toPrimitive ? () => 0 : proxy,
    apply: () => proxy
  });
  return proxy;
}

function fixture(level = 1): any {
  const repository = new CampaignRepository(null);
  for (let unlocked = 1; unlocked <= 30; unlocked++) repository.recordClear(unlocked, 100000, 20);
  vi.spyOn(campaignRepository, 'view').mockImplementation(() => repository.view());
  vi.spyOn(campaignRepository, 'recordClear').mockImplementation(() => null as never);
  vi.spyOn(SoundManager, 'get').mockReturnValue(anyStub());
  const run: any = new GameScene();
  run.init({ mode: 'campaign', campaignLevel: level });
  for (const key of ['updateHUD','refreshInfoPanel','refreshPlots','refreshPlacePanel','hideGhost','showBanner','floatText','floatTextForEnemy','impactAt','impactBurst','startDeathAnim','makeEnemyVisual','addEffect','drawAchievementNotice','drawPowerupBar','drawCatalog','refreshTowerVisual','updateNextPreview','renderCampaignResult','renderFrame','updateBossBar','updateDying','updateEffects','syncFieldViews','presentReward']) run[key] = () => {};
  run.add = anyStub(); run.world = (value: unknown) => value;
  run.scene = { start: vi.fn(), restart: vi.fn() };
  run.events = { emit: vi.fn() };
  run.input = Object.assign(new EventEmitter(), { keyboard: new EventEmitter() });
  run.tweens = { getTweens: () => [] };
  return run;
}

function openFinalWave(run: any): void {
  const finalWave = run.campaign.waveCount;
  for (let wave = 1; wave < finalWave; wave++) {
    expect(run.siege.startWave(wave)).toBe(true);
    expect(run.siege.completeWave({ wave, lives: run.maxLives, spawns: 0, enemies: 0, flights: 0, fields: 0 })).toBe('wave-cleared');
  }
  expect(run.siege.startWave(finalWave)).toBe(true);
  run.wave = finalWave;
  run.waveActive = true;
}

function enemy(id = 'marchling'): Enemy {
  const cfg = getCampaignEnemy(id);
  const spawned = new Enemy(cfg.visualArchetype, cfg.baseHp, cfg.baseSpeed, cfg.baseReward, cfg);
  spawned.campaignId = id; spawned.slowResistance = cfg.slowResistance;
  return spawned;
}

function routeBestPlot(run: any, towerId: TowerId): number {
  const samples: Array<{ x: number; y: number }> = [];
  for (let i = 1; i < run.map.waypoints.length; i++) {
    const from = run.map.waypoints[i - 1], to = run.map.waypoints[i];
    const divisions = Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / 15);
    for (let step = 0; step <= divisions; step++) samples.push({ x: from.x + (to.x - from.x) * step / divisions, y: from.y + (to.y - from.y) * step / divisions });
  }
  return run.map.buildable.map((point: { x: number; y: number }, index: number) => ({
    index,
    covered: run.occupied.has(index) ? -1 : samples.filter(sample => Math.hypot(sample.x - point.x, sample.y - point.y) <= TOWERS[towerId].levels[0].range).length
  })).sort((a: { covered: number; index: number }, b: { covered: number; index: number }) => b.covered - a.covered || a.index - b.index)[0].index;
}

describe('campaign settlement gates in the scene', () => {
  it('waits for every queued spawn, living enemy, flight, and burning field before awarding a clear', () => {
    const run = fixture(1); openFinalWave(run);
    const earnClassicAchievement = vi.spyOn(run.unlockRepository, 'earn');
    const saveBest = vi.spyOn(settings, 'saveBest'), submit = vi.spyOn(scores, 'submitScore');
    const pendingSpawn = { enemyId: 'marchling', atMs: 1000, hpBonus: 1 };
    const living = enemy();
    const pendingFlight = { view: anyStub() };
    const fieldTower = new Tower('ember', 0, 0, 0); fieldTower.specialization = 'ember_cannon';
    const shot = run.evolutionCombat.makeShot(fieldTower, [fieldTower], 1, true, fieldTower.stats);
    run.evolutionCombat.addField(shot, 0, 0, 0, 1000, 0.12);

    for (const pending of [
      () => { run.spawnQueue = [pendingSpawn]; },
      () => { run.enemies = [living]; },
      () => { run.flights = [pendingFlight]; },
      () => { run.evolutionCombat.addField(shot, 0, 0, 0, 1000, 0.12); }
    ]) {
      run.spawnQueue = []; run.enemies = []; run.flights = []; run.evolutionCombat.clear();
      pending(); run.checkWaveClear();
      expect(run.campaignResult).toBeNull();
      expect(campaignRepository.recordClear).not.toHaveBeenCalled();
      expect(run.ended).toBe(false);
    }

    run.spawnQueue = []; run.enemies = []; run.flights = []; run.evolutionCombat.clear();
    run.checkWaveClear(); run.checkWaveClear();
    expect(run.campaignResult.outcome).toBe('victory');
    expect(campaignRepository.recordClear).toHaveBeenCalledTimes(1);
    expect(run.unlocksEarnedThisRun).toEqual([]);
    expect(run.achievementNotices).toEqual([]);
    expect(earnClassicAchievement).not.toHaveBeenCalled();
    expect(saveBest).not.toHaveBeenCalled();
    expect(submit).not.toHaveBeenCalled();
  });

  it('does not award progression or classic score results when an ordinary enemy takes the last life', () => {
    const run = fixture(1), escaping = enemy();
    run.lives = escaping.livesLost;
    const saveBest = vi.spyOn(settings, 'saveBest'), submit = vi.spyOn(scores, 'submitScore');
    expect(run.handleLeak(escaping)).toBe(true);
    expect([run.campaignResult.outcome, run.campaignResult.clear, run.lives, run.ended]).toEqual(['defeat', null, 0, true]);
    expect(campaignRepository.recordClear).not.toHaveBeenCalled();
    expect(saveBest).not.toHaveBeenCalled();
    expect(submit).not.toHaveBeenCalled();
    expect(run.unlocksEarnedThisRun).toEqual([]);
    expect(run.achievementNotices).toEqual([]);
  });

  it('awards a boss-level clear only after the required boss dies', () => {
    const run = fixture(10); openFinalWave(run);
    const boss = run.spawnEnemy('hollow_warden', 1);
    run.checkWaveClear();
    expect(run.campaignResult).toBeNull();
    expect(campaignRepository.recordClear).not.toHaveBeenCalled();
    run.killEnemy(boss);
    run.checkWaveClear();
    expect(run.campaignResult.outcome).toBe('victory');
    expect(run.campaignResult.clear).toBeNull();
    expect(campaignRepository.recordClear).toHaveBeenCalledTimes(1);
  });
});

describe('independent natural-economy challenge', () => {
  it.each([8, 18, 28, 10, 20, 30])('clears heavy introduction or boss level %i with paid foundation towers only', level => {
    const run = fixture(level), definition = CAMPAIGN_LEVELS[level - 1];
    const bosses: Enemy[] = [];
    const originalSpawn = run.spawnEnemy.bind(run);
    run.spawnEnemy = (id: string, hpBonus: number) => { const spawned = originalSpawn(id, hpBonus); if (spawned.isBoss) bosses.push(spawned); return spawned; };
    expect([run.gold, run.lives]).toEqual([600, 20]);
    const initialVault = run.vault, consumePowerUp = vi.spyOn(initialVault, 'beginUse');
    const purchases: Array<{ kind: 'build' | 'upgrade'; tower: TowerId; from: number; to: number; cost: number; goldAfter: number }> = [];
    const hasPhysicalArmor = definition.enemyIds.some(id => getCampaignEnemy(id).physicalArmor > 0.4);
    const focusOrder: TowerId[] = hasPhysicalArmor ? ['starfire', 'ember', 'glacier', 'longbow', 'tempest'] : ['longbow', 'starfire', 'glacier', 'ember', 'tempest'];
    const prepare = () => {
      for (let guard = 0; guard < 50; guard++) {
        const missing = focusOrder.find(id => !run.towers.some((tower: Tower) => tower.towerId === id) && TOWERS[id].levels[0].cost <= run.gold);
        if (missing) {
          const before = run.gold;
          run.tryBuild(missing, routeBestPlot(run, missing));
          const tower = run.towers.find((candidate: Tower) => candidate.towerId === missing);
          expect(tower, JSON.stringify({ level, missing, gold: before, buildable: run.map.buildable.length, occupied: [...run.occupied], towers: run.towers.map((candidate: Tower) => candidate.towerId) })).toBeDefined();
          purchases.push({ kind: 'build', tower: missing, from: 0, to: tower.level, cost: before - run.gold, goldAfter: run.gold });
          expect(before - run.gold).toBe(TOWERS[missing].levels[0].cost);
          continue;
        }

        const candidates = [...run.towers].filter((tower: Tower) => !tower.maxLevel)
          .sort((a: Tower, b: Tower) => focusOrder.indexOf(a.towerId) - focusOrder.indexOf(b.towerId) || (a.upgradeCost()! - b.upgradeCost()!) || a.id - b.id);
        const upgrade = candidates.find((tower: Tower) => tower.upgradeCost()! <= run.gold);
        if (upgrade) {
          const before = run.gold, from = upgrade.level, cost = upgrade.upgradeCost()!;
          run.selectedTower = upgrade; run.upgradeSelected();
          if (upgrade.level > from) purchases.push({ kind: 'upgrade', tower: upgrade.towerId, from, to: upgrade.level, cost: before - run.gold, goldAfter: run.gold });
          expect(before - run.gold).toBe(cost);
          continue;
        }
        if (run.towers.length >= run.map.buildable.length || run.towers.some((tower: Tower) => !tower.maxLevel)) break;
        if (focusOrder.some(id => !run.towers.some((tower: Tower) => tower.towerId === id))) break;
        const repeat = focusOrder.find(id => TOWERS[id].levels[0].cost <= run.gold);
        if (!repeat) break;
        const before = run.gold;
        run.tryBuild(repeat, routeBestPlot(run, repeat));
        const duplicate = run.towers.filter((candidate: Tower) => candidate.towerId === repeat).at(-1);
        expect(duplicate).toBeDefined();
        purchases.push({ kind: 'build', tower: repeat, from: 0, to: duplicate.level, cost: before - run.gold, goldAfter: run.gold });
        expect(before - run.gold).toBe(TOWERS[repeat].levels[0].cost);
      }
    };

    let ticks = 0;
    while (!run.ended && run.wave < run.campaign.waveCount) {
      run.vault.pending = []; run.vault.stored = [];
      prepare();
      const heavy = definition.enemyIds.some(id => getCampaignEnemy(id).baseHp > 140);
      for (const tower of run.towers) tower.targeting = run.campaign.wave(run.wave + 1).isBossWave || heavy && ['starfire', 'ember', 'tempest'].includes(tower.towerId)
        ? 'strongest' : tower.towerId === 'longbow' && definition.warnings.includes('fast') ? 'weakest' : 'first';
      run.startNextWave();
      expect(run.waveActive).toBe(true);
      ticks = 0;
      while (run.waveActive && !run.ended && ticks++ < 60 * 240) {
        run.simulateTick(SIMULATION_STEP_MS);
        if (ticks % 60 === 0) prepare();
      }
      expect(ticks).toBeLessThan(60 * 240);
    }

    expect(run.campaignResult?.outcome, JSON.stringify({ wave: run.wave, lives: run.lives, score: run.campaignResult?.score, bossesKilled: run.bossesKilled, bossHealth: bosses.map(boss => [boss.hp, boss.maxHp]), gold: run.gold, towers: run.towers.map((tower: Tower) => [tower.towerId, tower.level, tower.x, tower.y]) })).toBe('victory');
    expect(run.campaignResult?.score).toBeGreaterThanOrEqual(definition.mastery.scoreTarget);
    expect(run.lives).toBeGreaterThanOrEqual(definition.mastery.minimumLivesForStar);
    expect(run.bossesKilled).toBe(definition.bossEnemyId ? 1 : 0);
    expect(purchases.length).toBeGreaterThan(0);
    expect(purchases.every(purchase => purchase.cost > 0 && purchase.goldAfter >= 0)).toBe(true);
    expect(run.debugAssisted).toBe(false);
    expect(run.towers.every((tower: Tower) => tower.specialization === null)).toBe(true);
    expect(consumePowerUp).not.toHaveBeenCalled();
  }, 30000);
});

describe('campaign mechanics use the shared game-time clock', () => {
  it('keeps Matriarch telegraph and freeze timing equal at 1x and 3x speed, and stops time while paused', () => {
    function advanceGameSeconds(run: any, seconds: number, speed: number): void {
      run.speed = speed;
      for (let frame = 1; frame <= seconds; frame++) run.update(frame * 1000 / speed, 1000 / speed);
    }
    function preparedRun(speed: number): { run: any; tower: Tower } {
      const run = fixture(30), boss = run.spawnEnemy('frostbound_matriarch', 1), tower = new Tower('longbow', 100, 100, 0);
      run.towers = [tower]; run.enemies = [boss];
      advanceGameSeconds(run, 10, speed);
      return { run, tower };
    }
    const normal = preparedRun(1), fast = preparedRun(3);
    expect([normal.run.gameTimeMs, normal.tower.frozenUntil]).toEqual([fast.run.gameTimeMs, fast.tower.frozenUntil]);
    expect(normal.tower.frozenUntil).toBeGreaterThan(normal.run.gameTimeMs);

    for (const { run, tower } of [normal, fast]) {
      const gameTime = run.gameTimeMs, frozenUntil = tower.frozenUntil;
      run.pauseState.set('user', true);
      run.update(100000, 5000);
      expect([run.gameTimeMs, tower.frozenUntil]).toEqual([gameTime, frozenUntil]);
      run.pauseState.set('user', false);
      advanceGameSeconds(run, 3, run.speed);
      expect(run.gameTimeMs).toBeGreaterThanOrEqual(frozenUntil);
      expect(tower.frozenUntil).toBe(frozenUntil);
    }
  });
});

describe('campaign shutdown and scene reuse', () => {
  it('cancels game timers and discards transient boss, freeze, reward, and projectile state on quit', () => {
    vi.stubGlobal('document', { removeEventListener: vi.fn() });
    const run = fixture(30), boss = run.spawnEnemy('frostbound_matriarch', 1), tower = new Tower('longbow', 100, 100, 0);
    run.towers = [tower];
    run.campaignBosses.tick([boss], [tower], CAMPAIGN_BOSS_TUNING.freezeIntervalMs);
    run.vault.stored = ['meteor_strike'];
    run.spawnQueue = [{ enemyId: 'icebound', atMs: 1000, hpBonus: 1 }];
    run.flights = [{ view: anyStub() }];
    run.effects = [{ view: { destroy: vi.fn() } }];
    const fieldTower = new Tower('ember', 0, 0, 0); fieldTower.specialization = 'ember_cannon';
    run.evolutionCombat.addField(run.evolutionCombat.makeShot(fieldTower, [fieldTower], 1, true, fieldTower.stats), 0, 0, 0, 1000, 0.12);
    const timerRemoved = vi.fn(), timersCleared = vi.fn(), tweensKilled = vi.fn();
    run.revealTimer = { remove: timerRemoved };
    run.time = { removeAllEvents: timersCleared };
    run.tweens = { killAll: tweensKilled };
    run.game = { canvas: { removeEventListener: vi.fn() } };
    run.scale = { off: vi.fn() };
    run.events = new EventEmitter();
    run.input = Object.assign(new EventEmitter(), { keyboard: new EventEmitter() });
    run.simulationClock.advance(8, () => true);
    const oldBossSystem = run.campaignBosses;

    run.shutdownRun();
    expect([run.ended, run.spawnQueue.length, run.flights.length, run.effects.length, run.evolutionCombat.activeFieldCount, run.campaignBosses.telegraphTargets().length, run.vault.stored.length, run.simulationClock.pendingMs]).toEqual([true, 0, 0, 0, 0, 0, 0, 0]);
    expect(timerRemoved).toHaveBeenCalledWith(false);
    expect(timersCleared).toHaveBeenCalledOnce();
    expect(tweensKilled).toHaveBeenCalledOnce();

    run.init({ mode: 'campaign', campaignLevel: 30 });
    expect(run.campaignBosses).not.toBe(oldBossSystem);
    expect([run.ended, run.gameTimeMs, run.enemies.length, run.campaignBosses.telegraphTargets().length, run.campaignResult]).toEqual([false, 0, 0, 0, null]);
    expect(campaignRepository.recordClear).not.toHaveBeenCalled();
  });
});
