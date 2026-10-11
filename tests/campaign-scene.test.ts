import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import { GameScene } from '../src/game/scenes/GameScene.ts';
import { CampaignBattle, specializeShot } from '../src/game/campaign/battle.ts';
import { CampaignRepository, campaignRepository } from '../src/game/campaign/progress.ts';
import { CampaignBossSystem } from '../src/game/campaign/bosses.ts';
import { CAMPAIGN_LEVELS } from '../src/game/campaign/config.ts';
import { getCampaignEnemy } from '../src/game/campaign/enemies.ts';
import { Tower } from '../src/game/entities/Tower.ts';
import { Enemy } from '../src/game/entities/Enemy.ts';
import { SoundManager } from '../src/game/systems/SoundManager.ts';
import * as settings from '../src/game/systems/Settings.ts';
import * as scores from '../src/api/leaderboardClient.ts';
import { MAP1, type MapDef } from '../src/game/maps/map1.ts';
import { SIMULATION_STEP_MS } from '../src/game/systems/SimulationClock.ts';
import { TOWERS } from '../src/game/config/towers.ts';
import type { TowerId } from '../src/shared/progression.ts';

vi.mock('phaser', () => ({ default: { Scene: class { constructor(_key?: string) {} }, Math: { Vector2: class { constructor(public x: number, public y: number) {} } }, Scenes: { Events: { SHUTDOWN: 'shutdown' } }, Scale: { Events: { RESIZE: 'resize' } } } }));
vi.mock('../src/game/art/towerArt.ts', () => ({ buildTowerVisual: () => ({ view: anyStub(), crown: anyStub(), muzzleX: 0, muzzleY: -32 }), decorateEvolution: () => {}, towerPortraitKey: () => 'tower' }));

function anyStub(): any {
  const proxy: any = new Proxy(function () { return proxy; }, { get: (_t, key) => key === 'then' ? undefined : key === Symbol.toPrimitive ? () => 0 : proxy, apply: () => proxy });
  return proxy;
}
const PRESENTATION = ['updateHUD','refreshInfoPanel','drawSheet','drawPowerupBar','refreshPlots','refreshPlacePanel','hideGhost','showBanner','floatText','floatTextForEnemy','impactAt','impactBurst','startDeathAnim','drawCatalog','refreshTowerVisual','updateNextPreview','renderVictory','renderCampaignResult','showTouchPreview','projectEntity','makeEnemyVisual','presentReward','updateBossBar','updateDying','updateEffects','syncFieldViews','addEffect','drawTempestArc','publishQAStatus','drawAchievementNotice','renderFrame','closeModal'];
const balanceTraces: unknown[] = [];
afterAll(async () => {
  const path = process.env.CAMPAIGN_TRACE_PATH;
  if (!path) return;
  const moduleName = 'node:fs';
  const fs = await import(moduleName) as { writeFileSync(path: string, text: string): void };
  fs.writeFileSync(path,JSON.stringify({ task: 'P3', simulationStepMs: SIMULATION_STEP_MS, strategy: '600 gold / 20 lives; Ranger3 opener for unarmored units, Arcane3 for physical armor; double Arcane2 then max Arcane/Frost for all-heavy unwarded roster. Build at best route coverage. Execute purchased upgrades during preparation and every simulated second. Use Strongest for Arcane/Frost in heavy rosters, Weakest for Rangers, First otherwise, all Strongest on boss waves. Discard relics; no sidegrades, grants, selling, or permanent stat bonuses.', results: balanceTraces },null,2));
});
function repo(through: number, completionOnly = false): CampaignRepository {
  const repository = new CampaignRepository(null);
  for (let level = 1; level <= through; level++) repository.recordClear(level,completionOnly ? 0 : 100000,completionOnly ? 1 : 20);
  return repository;
}
function fixture(level = 1, through = 30, completionOnly = false): any {
  const repository = repo(through, completionOnly);
  vi.spyOn(campaignRepository,'view').mockImplementation(() => repository.view());
  vi.spyOn(campaignRepository,'recordClear').mockImplementation((id,score,lives) => repository.recordClear(id,score,lives));
  vi.spyOn(SoundManager,'get').mockReturnValue(anyStub());
  vi.spyOn(Math,'random').mockReturnValue(0.99);
  const run: any = new GameScene(); run.init({ mode: 'campaign', campaignLevel: level, difficulty: 'hard', playerName: 'Campaign Bot' });
  for (const key of PRESENTATION) run[key] = () => {};
  run.add = anyStub(); run.world = (object: unknown) => object;
  run.scene = { start: vi.fn(), restart: vi.fn() };
  return run;
}
function flight(shot: any, enemy: Enemy, chainIndex = 0): any { return { elapsedMs: 0, durationMs: 0, x1: 0, y1: 0, x2: enemy.x, y2: enemy.y, towerId: shot.towerId, targetId: enemy.id, shot, view: anyStub(), chainIndex, hit: new Set() }; }
afterEach(() => vi.restoreAllMocks());

describe('campaign scene contracts', () => {
  it('refuses a locked start before gameplay and snapshots map/medium baseline', () => {
    const run = fixture(2,0); expect(run.campaignStartRejected).toBe(true);
    run.create(); expect(run.scene.start).toHaveBeenCalledWith('Campaign',expect.objectContaining({ error: expect.any(String) }));
    run.init({ mode: 'campaign', campaignLevel: 1 }); expect([run.map.id,run.difficultyId,run.gold,run.lives]).toEqual(['borderkeep_a','medium',600,20]);
  });
  it('builds towers from the immutable prebattle sidegrade/targeting snapshot', () => {
    const run = fixture();
    run.campaign.choices.longbow = 'repeater_tower'; run.campaign.targeting.longbow = 'last';
    run.tryBuild('longbow',0);
    expect([run.towers[0].specialization,run.towers[0].targeting]).toEqual(['repeater_tower','last']);
    expect(run.towers[0].stats.range).toBeCloseTo(150 * 0.86);
    expect(run.map).not.toBe(MAP1);
  });
  it('executes Prism split and snapshots damage through subsequent selection changes', () => {
    const run = fixture(), tower = new Tower('starfire',100,100,0);
    tower.specialization = 'prism_tower'; run.towers = [tower];
    const enemies = [110,120].map(x => { const e = new Enemy('thornling',10000,70,8); e.x = x; e.y = 100; return e; }); run.enemies = enemies;
    const fire = vi.fn(); run.fireProjectile = fire; run.fireTowers(0);
    expect(fire).toHaveBeenCalledTimes(2);
    const first = fire.mock.calls[0][3], second = fire.mock.calls[1][3];
    expect([first.primary,second.primary]).toEqual([true,false]); expect(second.rawDamage).toBeCloseTo(first.rawDamage * 0.5);
    tower.specialization = 'aether_obelisk';
    run.flights.push(flight(first,enemies[0]),flight(second,enemies[1])); run.updateFlights(0);
    expect(enemies.map(e => 10000 - e.hp)).toEqual([17,9]);
  });
  it('Shatter bonuses already slowed victims and does not amplify its first chill', () => {
    const run = fixture(), tower = new Tower('glacier',0,0,0); tower.specialization = 'shatter_spire'; run.towers = [tower];
    const enemy = new Enemy('thornling',10000,70,8); run.enemies = [enemy];
    const shot = specializeShot(run.evolutionCombat.makeShot(tower,[tower],1,true,tower.stats),tower.specialization);
    expect(run.damageEnemy(enemy,100,'elemental',shot)).toBe(100);
    run.evolutionCombat.primaryHit(shot,enemy,0);
    expect(run.evolutionCombat.statuses(enemy.id,0).slowFactor).toBeCloseTo(0.35 * 0.7);
    expect(run.damageEnemy(enemy,100,'elemental',shot)).toBe(120);
  });
  it('applies campaign chain damage only to secondary hits and keeps classic chain rules', () => {
    const run = fixture(), tower = new Tower('tempest',0,0,0); tower.specialization = 'storm_conduit';
    const enemy = new Enemy('thornling',10000,70,8); run.enemies = [enemy]; run.fireProjectile = vi.fn();
    const shot = specializeShot(run.evolutionCombat.makeShot(tower,[tower],1,true,tower.stats),tower.specialization);
    run.flights.push(flight(shot,enemy,1)); run.updateFlights(0);
    expect(10000 - enemy.hp).toBe(Math.round(shot.rawDamage * 0.75 * 0.78));
    expect(shot.stats.chainCount).toBe(5);
  });
  it('freezes tower firing and game-time progress under pause, then resumes after expiry', () => {
    const run = fixture(), tower = new Tower('longbow',100,100,0), enemy = new Enemy('thornling',10000,70,8);
    enemy.x = 110; enemy.y = 100; run.towers = [tower]; run.enemies = [enemy]; tower.frozenUntil = 3000; run.fireProjectile = vi.fn();
    run.fireTowers(1); expect(run.fireProjectile).not.toHaveBeenCalled();
    run.pauseState.set('user',true); const before = run.gameTimeMs; run.update(0,5000); expect(run.gameTimeMs).toBe(before);
    run.pauseState.set('user',false); run.gameTimeMs = 3000; run.fireTowers(0); expect(run.fireProjectile).toHaveBeenCalledTimes(1);
  });
  it.each([10,20,30])('a level-%i boss escape fails without campaign award, classic best, or submission', level => {
    const run = fixture(level), save = vi.spyOn(settings,'saveBest'), submit = vi.spyOn(scores,'submitScore');
    run.wave = run.campaign.waveCount;
    const boss = run.spawnEnemy(run.campaign.definition.bossEnemyId,1);
    expect(run.handleLeak(boss)).toBe(true);
    expect([run.campaignResult.outcome,run.campaignResult.clear,run.ended]).toEqual(['siege-failed',null,true]);
    expect(campaignRepository.recordClear).not.toHaveBeenCalled(); expect(save).not.toHaveBeenCalled(); expect(submit).not.toHaveBeenCalled(); expect(run.scene.start).not.toHaveBeenCalled();
  });
  it('settles once after all flights and fields drain, and never updates classic results', () => {
    const run = fixture(1), save = vi.spyOn(settings,'saveBest'), submit = vi.spyOn(scores,'submitScore');
    for (let wave = 1; wave <= run.campaign.waveCount; wave++) {
      run.siege.startWave(wave); run.wave = wave; run.waveActive = true;
      if (wave !== run.campaign.waveCount) run.checkWaveClear();
    }
    const tower = new Tower('ember',0,0,0); tower.specialization = 'ember_cannon';
    const shot = specializeShot(run.evolutionCombat.makeShot(tower,[tower],1,true,tower.stats),tower.specialization);
    run.evolutionCombat.addField(shot,0,0,0,1000,0.12);
    run.checkWaveClear(); expect(run.ended).toBe(false);
    run.evolutionCombat.tickFields(1000); run.flights = [{ view: anyStub() }];
    run.checkWaveClear(); expect(run.ended).toBe(false);
    run.flights = []; run.checkWaveClear(); run.checkWaveClear(); run.finishCampaign('victory');
    expect(run.campaignResult.outcome).toBe('victory'); expect(campaignRepository.recordClear).toHaveBeenCalledTimes(1);
    expect(save).not.toHaveBeenCalled(); expect(submit).not.toHaveBeenCalled(); expect(run.siege.phase).not.toBe('endless');
  });
  it('restart preserves campaign request and clears run-local freeze/reward/boss state', () => {
    const run = fixture(30); const boss = run.spawnEnemy('frostbound_matriarch',1);
    const tower = new Tower('longbow',100,100,0); run.towers = [tower]; run.campaignBosses.tick([boss],[tower],7500);
    run.vault.stored = ['meteor_strike']; run.vault.beginUse(0,true); run.flights = [{ view: anyStub() }];
    run.restartRun(); expect(run.scene.restart).toHaveBeenCalledWith(expect.objectContaining({ mode: 'campaign', campaignLevel: 30 }));
    run.init({ mode: 'campaign', campaignLevel: 30 });
    expect([run.towers.length,run.enemies.length,run.flights.length,run.vault.stored.length,run.vault.target,run.campaignBosses.telegraphTargets().length,run.gameTimeMs,run.wave,run.ended]).toEqual([0,0,0,0,null,0,0,0,false]);
    run.init({ difficulty: 'hard' }); expect(run.campaign).toBeNull(); expect(run.map).toBe(MAP1); expect(run.difficultyId).toBe('hard');
  });
});

function bestPlot(map: MapDef, occupied: ReadonlySet<number>, range: number): number {
  const samples: Array<{ x: number; y: number }> = [];
  for (let i = 1; i < map.waypoints.length; i++) {
    const a = map.waypoints[i-1], b = map.waypoints[i], steps = Math.ceil(Math.hypot(b.x-a.x,b.y-a.y) / 12);
    for (let step = 0; step <= steps; step++) samples.push({ x: a.x + (b.x-a.x)*step/steps, y: a.y + (b.y-a.y)*step/steps });
  }
  return map.buildable.map((point,index) => ({ index, coverage: occupied.has(index) ? -1 : samples.filter(s => Math.hypot(s.x-point.x,s.y-point.y) <= range).length })).sort((a,b) => b.coverage-a.coverage || a.index-b.index)[0].index;
}

// One reproducible baseline: a level-3 counter tower, then a mixed roster,
// best route coverage, and cheapest remaining upgrades;
// no relics, selling, sidegrades, QA grants, or persistent bonuses.
describe('all authored campaign battles in the shared fixed-step simulation', () => {
  it.each(CAMPAIGN_LEVELS.flatMap(level => ['completion-only', 'unlocked-replay'].map(profile => ({ ...level, profile }))))('$profile level $level can clear with ordinary foundation towers', definition => {
    const run = fixture(definition.level, definition.profile === 'completion-only' ? definition.level - 1 : 30, definition.profile === 'completion-only');
    expect(run.debugAssisted).toBe(false);
    expect([run.gold, run.lives]).toEqual([600, 20]);
    const purchases: unknown[] = [];
    const build = run.tryBuild.bind(run), upgradeSelected = run.upgradeSelected.bind(run);
    run.tryBuild = (id: string, plot: number) => {
      const goldBefore = run.gold, countBefore = run.towers.length, cost = TOWERS[id].levels[0].cost;
      build(id,plot);
      if (run.towers.length > countBefore) {
        expect(goldBefore).toBeGreaterThanOrEqual(cost);
        expect(run.gold).toBe(goldBefore - cost);
        const tower = run.towers[run.towers.length-1];
        purchases.push({ timeMs: run.gameTimeMs, wave: run.wave, kind: 'build', id, foundation: tower.level, x: tower.x, y: tower.y, cost, goldBefore, goldAfter: run.gold });
      }
    };
    run.upgradeSelected = () => {
      const goldBefore = run.gold, tower = run.selectedTower, foundationBefore = tower.level, cost = tower.upgradeCost();
      upgradeSelected();
      if (tower.level > foundationBefore) {
        expect(cost).not.toBeNull();
        expect(goldBefore).toBeGreaterThanOrEqual(cost);
        expect(run.gold).toBe(goldBefore - cost);
        purchases.push({ timeMs: run.gameTimeMs, wave: run.wave, kind: 'upgrade', id: tower.towerId, foundation: tower.level, x: tower.x, y: tower.y, cost, goldBefore, goldAfter: run.gold });
      }
    };
    const roster: TowerId[] = ['longbow','starfire','glacier','ember','tempest'];
    let nextTower = 0;
    let opener = 0;
    const firstEnemy = getCampaignEnemy(definition.enemyIds[0]);
    const first: TowerId = firstEnemy.physicalArmor > 0.4 ? 'starfire' : 'longbow';
    const second: TowerId = first === 'longbow' ? 'starfire' : 'longbow';
    const allHeavy = definition.enemyIds.every(id => getCampaignEnemy(id).baseHp > 140 && getCampaignEnemy(id).wardArmor < 0.4);
    const opening: Array<{ id: TowerId; upgrade?: boolean; ordinal?: number }> = allHeavy ? [
      { id: 'starfire' },{ id: 'starfire',upgrade: true },{ id: 'starfire' },{ id: 'starfire',upgrade: true,ordinal: 1 },{ id: 'glacier' },
      { id: 'starfire',upgrade: true },{ id: 'starfire',upgrade: true,ordinal: 1 },{ id: 'starfire',upgrade: true },{ id: 'starfire',upgrade: true,ordinal: 1 },
      { id: 'glacier',upgrade: true },{ id: 'glacier',upgrade: true },{ id: 'glacier',upgrade: true },{ id: 'ember' },{ id: 'tempest' },{ id: 'longbow' }
    ] : [{ id: first },{ id: first,upgrade: true },{ id: first,upgrade: true },{ id: 'glacier' },{ id: second },{ id: second,upgrade: true },{ id: second,upgrade: true },{ id: 'ember' },{ id: 'tempest' }];
    const prepare = () => {
      for (let guard = 0; guard < 100; guard++) {
        if (opener < opening.length) {
          const action = opening[opener], tower = run.towers.filter((t: Tower) => t.towerId === action.id)[action.ordinal ?? 0];
          const cost = action.upgrade ? tower.upgradeCost() : TOWERS[action.id].levels[0].cost;
          if (cost > run.gold) break;
          if (action.upgrade) { run.selectedTower = tower; run.upgradeSelected(); }
          else run.tryBuild(action.id,bestPlot(run.map,run.occupied,TOWERS[action.id].levels[0].range));
          opener++; continue;
        }
        const upgrade = [...run.towers].filter((t: Tower) => !t.maxLevel).sort((a: Tower,b: Tower) => a.upgradeCost()!-b.upgradeCost()! || a.id-b.id)[0];
        if (upgrade && upgrade.upgradeCost() <= run.gold) { run.selectedTower = upgrade; run.upgradeSelected(); continue; }
        if (!upgrade && run.towers.length < run.map.buildable.length) {
          const id = roster[nextTower++ % roster.length];
          if (TOWERS[id].levels[0].cost <= run.gold) { run.tryBuild(id,bestPlot(run.map,run.occupied,TOWERS[id].levels[0].range)); continue; }
        }
        break;
      }
    };
    while (!run.ended && run.wave < run.campaign.waveCount) {
      run.vault.pending = []; run.vault.stored = [];
      prepare();
      const heavyRoster = definition.enemyIds.some(id => getCampaignEnemy(id).baseHp > 140);
      for (const tower of run.towers) tower.targeting = run.campaign.wave(run.wave + 1).isBossWave || heavyRoster && (tower.towerId === 'starfire' || tower.towerId === 'glacier') ? 'strongest' : heavyRoster && tower.towerId === 'longbow' ? 'weakest' : 'first';
      run.startNextWave(); expect(run.waveActive).toBe(true);
      let ticks = 0;
      while (run.waveActive && !run.ended && ticks++ < 60 * 240) { run.simulateTick(SIMULATION_STEP_MS); if (ticks % 60 === 0) prepare(); }
      expect(ticks,`level ${definition.level} wave ${run.wave} timed out`).toBeLessThan(60 * 240);
    }
    expect(run.campaignResult?.outcome,`level ${definition.level}, wave ${run.wave}, lives ${run.lives}`).toBe('victory');
    expect(run.campaignResult?.lives).toBeGreaterThanOrEqual(definition.mastery.minimumLivesForStar);
    expect(run.campaignResult?.score,`level ${definition.level} target ${definition.mastery.scoreTarget}`).toBeGreaterThanOrEqual(definition.mastery.scoreTarget);
    expect(run.campaignResult?.clear?.progress).toMatchObject({ completionStar: true, livesStar: true, scoreStar: true });
    balanceTraces.push({ profile: definition.profile, progressionStarsBefore: definition.profile === 'completion-only' ? definition.level - 1 : 90, debugAssisted: run.debugAssisted, randomValue: 0.99, startingGold: 600, startingLives: 20, relicUses: [], remainingGold: run.gold, mastery: run.campaignResult?.clear?.progress, level: definition.level, waves: run.wave, outcome: run.campaignResult?.outcome, score: run.campaignResult?.score, scoreTarget: definition.mastery.scoreTarget, lives: run.lives, livesTarget: definition.mastery.minimumLivesForStar, bossesKilled: run.bossesKilled, kills: run.enemiesKilled, durationSeconds: Math.round(run.gameTimeMs/1000), purchases });
  },30000);
});
