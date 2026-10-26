import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import { GameScene } from '../src/game/scenes/GameScene.ts';
import { CampaignRepository, campaignRepository } from '../src/game/campaign/progress.ts';
import { CAMPAIGN_LEVELS } from '../src/game/campaign/config.ts';
import { getCampaignEnemy } from '../src/game/campaign/enemies.ts';
import { Enemy } from '../src/game/entities/Enemy.ts';
import { Tower } from '../src/game/entities/Tower.ts';
import { SoundManager } from '../src/game/systems/SoundManager.ts';
import { TOWERS } from '../src/game/config/towers.ts';
import { SIMULATION_STEP_MS } from '../src/game/systems/SimulationClock.ts';
import type { TowerId } from '../src/shared/progression.ts';
import type { MapDef } from '../src/game/maps/map1.ts';
import { campaignScoreMetadata } from '../src/shared/campaignScoring.ts';

vi.mock('phaser', () => ({
  default: {
    Scene: class { constructor(_key?: string) {} },
    Math: { Vector2: class { constructor(public x: number, public y: number) {} } },
    Scenes: { Events: { SHUTDOWN: 'shutdown' } },
    Scale: { Events: { RESIZE: 'resize' } }
  }
}));
vi.mock('../src/game/art/towerArt.ts', () => ({
  buildTowerVisual: () => ({ view: anyStub(), crown: anyStub(), muzzleX: 0, muzzleY: -32 }),
  decorateEvolution: () => {},
  towerPortraitKey: () => 'tower'
}));

function anyStub(): any {
  const proxy: any = new Proxy(function () { return proxy; }, {
    get: (_target, key) => key === 'then' ? undefined : key === Symbol.toPrimitive ? () => 0 : proxy,
    apply: () => proxy
  });
  return proxy;
}

const PRESENTATION = [
  'updateHUD', 'refreshInfoPanel', 'drawSheet', 'drawPowerupBar', 'refreshPlots', 'refreshPlacePanel',
  'hideGhost', 'showBanner', 'floatText', 'floatTextForEnemy', 'impactAt', 'impactBurst', 'startDeathAnim',
  'drawCatalog', 'refreshTowerVisual', 'updateNextPreview', 'renderVictory', 'renderCampaignResult',
  'showTouchPreview', 'projectEntity', 'makeEnemyVisual', 'presentReward', 'updateBossBar', 'updateDying',
  'updateEffects', 'syncFieldViews', 'addEffect', 'drawTempestArc', 'publishQAStatus', 'drawAchievementNotice',
  'renderFrame', 'closeModal'
];

function repository(through: number, completionOnly: boolean): CampaignRepository {
  const result = new CampaignRepository(null);
  for (let level = 1; level <= through; level++) result.recordClear(level, completionOnly ? 1 : campaignScoreMetadata(level).perfectScore, completionOnly ? 1 : 20);
  return result;
}

function battleScene(level: number, unlockedThrough: number, completionOnly: boolean): any {
  const progress = repository(unlockedThrough, completionOnly);
  vi.spyOn(campaignRepository, 'view').mockImplementation(() => progress.view());
  vi.spyOn(campaignRepository, 'recordClear').mockImplementation((id, score, lives) => progress.recordClear(id, score, lives));
  vi.spyOn(SoundManager, 'get').mockReturnValue(anyStub());
  vi.spyOn(Math, 'random').mockReturnValue(0.99);
  const run: any = new GameScene();
  run.init({ mode: 'campaign', campaignLevel: level, difficulty: 'hard', playerName: 'Paid Resource Simulation' }); run.runRandom = () => 0.99;
  for (const name of PRESENTATION) run[name] = () => {};
  run.add = anyStub(); run.world = (value: unknown) => value;
  run.scene = { start: vi.fn(), restart: vi.fn() };
  return run;
}

function bestRoutePlot(map: MapDef, occupied: ReadonlySet<number>, range: number): number {
  const samples: Array<{ x: number; y: number }> = [];
  for (let index = 1; index < map.waypoints.length; index++) {
    const start = map.waypoints[index - 1], end = map.waypoints[index];
    const steps = Math.ceil(Math.hypot(end.x - start.x, end.y - start.y) / 12);
    for (let step = 0; step <= steps; step++) samples.push({ x: start.x + (end.x - start.x) * step / steps, y: start.y + (end.y - start.y) * step / steps });
  }
  return map.buildable.map((point, index) => ({ index, coverage: occupied.has(index) ? -1 : samples.filter(sample => Math.hypot(sample.x - point.x, sample.y - point.y) <= range).length }))
    .sort((a, b) => b.coverage - a.coverage || a.index - b.index)[0].index;
}

const traces: unknown[] = [];
afterAll(async () => {
  const target = process.env.CAMPAIGN_V5_P1_TRACE_PATH;
  if (!target) return;
  const moduleName = 'node:fs';
  const fs = await import(moduleName) as { writeFileSync(path: string, contents: string): void };
  fs.writeFileSync(target, JSON.stringify({
    task: 'P1', scope: 'Worlds 5–10; levels 41–100; completion-only and unlocked-replay profiles',
    simulationStepMs: SIMULATION_STEP_MS,
    strategy: '600 starting gold / 20 lives; for an elite, 260+ HP, or >0.4 physical-armor opening role, build and upgrade one counter tower twice before adding a second counter tower, then continue cheapest available upgrades. Add an early Glacier slow tower on the Astral Rift and Crown routes; otherwise place three counter towers before upgrades. Use Starfire against physical armor above 0.4, Longbow otherwise; purchase resources earned in-game only, with no relics, selling, grants, sidegrades, or permanent stat bonuses.',
    results: traces
  }, null, 2));
});
afterEach(() => vi.restoreAllMocks());

describe('campaign wave budgets remain independent of Classic siege finality', () => {
  it('clears a registered wave-35 boss through campaign victory while Classic stays capped at 30', () => {
    const campaign = battleScene(50, 49, true);
    expect(campaign.campaign.waveCount).toBe(35);
    campaign.wave = 29; campaign.wavesCompleted = 29;
    for (let nextWave = 30; nextWave <= 34; nextWave++) {
      campaign.startNextWave();
      expect(campaign.waveActive).toBe(true);
      campaign.spawnQueue = []; campaign.enemies = [];
      campaign.checkWaveClear(); campaign.vault.pending = [];
      expect([campaign.wave, campaign.wavesCompleted, campaign.ended]).toEqual([nextWave, nextWave, false]);
    }
    campaign.startNextWave();
    expect([campaign.wave, campaign.waveActive, campaign.currentWaveIsBoss]).toEqual([35, true, true]);
    const bossIndex = campaign.spawnQueue.findIndex((spawn: { enemyId: string }) => spawn.enemyId === campaign.campaign.definition.bossEnemyId);
    const bossSpawn = campaign.spawnQueue[bossIndex];
    campaign.spawnQueue = [{ ...bossSpawn, atMs: campaign.gameTimeMs }];
    campaign.simulateTick(SIMULATION_STEP_MS);
    const boss = campaign.enemies.find((enemy: Enemy) => enemy.campaignId === campaign.campaign.definition.bossEnemyId) as Enemy;
    boss.hp = 1; campaign.enemies = [boss];
    campaign.damageEnemy(boss, 2, 'arcane');
    campaign.checkWaveClear();
    expect([campaign.campaignResult.outcome, campaign.wavesCompleted, campaign.campaign.bossKilled]).toEqual(['victory', 35, true]);

    const classic: any = new GameScene();
    classic.init({ difficulty: 'hard' });
    classic.wave = 30; classic.wavesCompleted = 30;
    classic.siege.seedForQA(30, 7, 'siege');
    classic.startNextWave();
    expect([classic.wave, classic.waveActive, classic.siege.wavesCompleted]).toEqual([30, false, 30]);
  });
});

describe('Worlds 5–10 paid-resource viability in fixed-step campaign battles', () => {
  const cases = CAMPAIGN_LEVELS.slice(40).flatMap(level => ['completion-only', 'unlocked-replay'].map(profile => ({ ...level, profile })));

  it.each(cases)('$profile level $level clears on ordinary paid tower progression', definition => {
    const completionOnly = definition.profile === 'completion-only';
    const run = battleScene(definition.level, completionOnly ? definition.level - 1 : CAMPAIGN_LEVELS.length, completionOnly);
    let bossLeak: unknown = null;
    const handleLeak = run.handleLeak.bind(run);
    run.handleLeak = (enemy: Enemy) => {
      if (enemy.isBoss && enemy.campaignId) bossLeak = { id: enemy.campaignId, hp: enemy.hp, maxHp: enemy.maxHp, phase: run.campaignBosses.phase(enemy.id), ...run.campaignBosses.presentation(enemy.id, run.gameTimeMs) };
      return handleLeak(enemy);
    };
    expect(run.debugAssisted).toBe(false);
    expect([run.gold, run.lives]).toEqual([600, 20]);
    const purchases: unknown[] = [];
    const build = run.tryBuild.bind(run), upgrade = run.upgradeSelected.bind(run);
    run.tryBuild = (id: TowerId, plot: number) => {
      const goldBefore = run.gold, countBefore = run.towers.length, cost = TOWERS[id].levels[0].cost;
      build(id, plot);
      if (run.towers.length > countBefore) {
        expect(goldBefore).toBeGreaterThanOrEqual(cost);
        expect(run.gold).toBe(goldBefore - cost);
        const tower = run.towers[run.towers.length - 1];
        purchases.push({ timeMs: run.gameTimeMs, wave: run.wave, kind: 'build', id, foundation: tower.level, x: tower.x, y: tower.y, cost, goldBefore, goldAfter: run.gold });
      }
    };
    run.upgradeSelected = () => {
      const goldBefore = run.gold, tower = run.selectedTower, foundationBefore = tower.level, cost = tower.upgradeCost();
      upgrade();
      if (tower.level > foundationBefore) {
        expect(cost).not.toBeNull();
        expect(goldBefore).toBeGreaterThanOrEqual(cost);
        expect(run.gold).toBe(goldBefore - cost);
        purchases.push({ timeMs: run.gameTimeMs, wave: run.wave, kind: 'upgrade', id: tower.towerId, foundation: tower.level, x: tower.x, y: tower.y, cost, goldBefore, goldAfter: run.gold });
      }
    };

    const roster: TowerId[] = ['longbow', 'starfire', 'glacier', 'ember', 'tempest'];
    let nextTower = 0, openingIndex = 0;
    const firstEnemy = getCampaignEnemy(definition.enemyIds[0]);
    const first: TowerId = firstEnemy.physicalArmor > 0.4 ? 'starfire' : 'longbow';
    const heavyOpening = firstEnemy.isElite || firstEnemy.baseHp >= 260 || firstEnemy.physicalArmor > 0.4;
    const opening: Array<{ id: TowerId; upgrade?: boolean; ordinal?: number }> = heavyOpening
      ? [{ id: first }, { id: first, upgrade: true }, { id: first, upgrade: true }, { id: first, ordinal: 1 }, ...(definition.worldId === 'astral_rift' || definition.worldId === 'aether_crown' ? [{ id: 'glacier' as const }] : []), { id: first, upgrade: true, ordinal: 1 }, { id: first, ordinal: 2 }]
      : [{ id: first }, { id: first }, { id: first }, { id: first, upgrade: true }, { id: first, upgrade: true }];
    const prepare = (): void => {
      for (let guard = 0; guard < 100; guard++) {
        if (openingIndex < opening.length) {
          const action = opening[openingIndex], tower = run.towers.filter((candidate: Tower) => candidate.towerId === action.id)[action.ordinal ?? 0];
          const cost = action.upgrade ? tower.upgradeCost() : TOWERS[action.id].levels[0].cost;
          if (cost > run.gold) break;
          if (action.upgrade) { run.selectedTower = tower; run.upgradeSelected(); }
          else run.tryBuild(action.id, bestRoutePlot(run.map, run.occupied, TOWERS[action.id].levels[0].range));
          openingIndex++;
          continue;
        }
        const nextUpgrade = [...run.towers].filter((tower: Tower) => !tower.maxLevel).sort((a: Tower, b: Tower) => a.upgradeCost()! - b.upgradeCost()! || a.id - b.id)[0];
        if (nextUpgrade && nextUpgrade.upgradeCost() <= run.gold) { run.selectedTower = nextUpgrade; run.upgradeSelected(); continue; }
        if (!nextUpgrade && run.towers.length < run.map.buildable.length) {
          const id = roster[nextTower++ % roster.length];
          if (TOWERS[id].levels[0].cost <= run.gold) { run.tryBuild(id, bestRoutePlot(run.map, run.occupied, TOWERS[id].levels[0].range)); continue; }
        }
        break;
      }
    };

    let resultTraced = false;
    const recordResult = (): void => {
      if (resultTraced) return;
      resultTraced = true;
      traces.push({
        profile: definition.profile, progressionStarsBefore: completionOnly ? definition.level - 1 : CAMPAIGN_LEVELS.length * 3,
        debugAssisted: run.debugAssisted, randomValue: 0.99, startingGold: 600, startingLives: 20,
        relicUses: [], remainingGold: run.gold, mastery: run.campaignResult?.clear?.progress, level: definition.level,
        waves: run.wave, outcome: run.campaignResult?.outcome, score: run.campaignResult?.score,
        scoreTarget: campaignScoreMetadata(definition.level).scoreTarget, lives: run.lives, livesTarget: definition.mastery.minimumLivesForStar,
        registeredWaveCount: run.campaign.waveCount, ended: run.ended, waveActive: run.waveActive, siegePhase: run.siege.phase,
        bossesKilled: run.bossesKilled, bossLeak, kills: run.enemiesKilled, elitesKilled: run.elitesKilled,
        durationSeconds: Math.round(run.gameTimeMs / 1000), purchases
      });
    };

    while (!run.ended && run.wave < run.campaign.waveCount) {
      run.vault.pending = []; run.vault.stored = [];
      prepare();
      const heavyRoster = definition.enemyIds.some(id => getCampaignEnemy(id).baseHp > 300);
      for (const tower of run.towers) tower.targeting = run.campaign.wave(run.wave + 1).isBossWave || heavyRoster && (tower.towerId === 'starfire' || tower.towerId === 'glacier')
        ? 'strongest' : heavyRoster && tower.towerId === 'longbow' ? 'weakest' : 'first';
      run.startNextWave();
      if (!run.waveActive) recordResult();
      expect(run.waveActive).toBe(true);
      let ticks = 0;
      while (run.waveActive && !run.ended && ticks++ < 60 * 240) {
        run.simulateTick(SIMULATION_STEP_MS);
        if (ticks % 60 === 0) prepare();
      }
      expect(ticks, `level ${definition.level} wave ${run.wave} timed out`).toBeLessThan(60 * 240);
    }

    recordResult();
    expect(run.campaignResult?.outcome, `level ${definition.level}, wave ${run.wave}, lives ${run.lives}`).toBe('victory');
    expect(run.campaignResult?.lives).toBeGreaterThanOrEqual(definition.mastery.minimumLivesForStar);
    expect(run.campaignResult?.score, `level ${definition.level} target ${campaignScoreMetadata(definition.level).scoreTarget}`).toBeGreaterThanOrEqual(campaignScoreMetadata(definition.level).scoreTarget);
    expect(run.campaignResult?.clear?.progress).toMatchObject({ completionStar: true, livesStar: true, scoreStar: true });
  }, 30000);
});
