import { afterEach, describe, expect, it, vi } from 'vitest';
import { EventEmitter } from 'eventemitter3';
import { GameScene } from '../src/game/scenes/GameScene.ts';
import { parseQARequest, QA_STATES, isQACampaignFixture, installQA, type QACampaignFixture } from '../src/game/qa.ts';
import { CampaignRepository, campaignRepository } from '../src/game/campaign/progress.ts';
import { campaignVisualTier } from '../src/game/campaign/battle.ts';
import * as settingsModule from '../src/game/systems/Settings.ts';
import * as scoreApi from '../src/api/leaderboardClient.ts';
import { earnedBranches } from '../src/game/systems/UnlockSystem.ts';
import { towerTotalInvested } from '../src/game/config/towers.ts';
import { EVOLUTIONS } from '../src/game/config/evolutions.ts';
import type { QAAction, QAStatus } from '../src/game/qa.ts';
import type { SiegeSystem } from '../src/game/systems/SiegeSystem.ts';
import type { RelicVault } from '../src/game/systems/RunSimulation.ts';
import { ENEMIES } from '../src/game/config/enemies.ts';
import { Enemy } from '../src/game/entities/Enemy.ts';
import { SoundManager } from '../src/game/systems/SoundManager.ts';
import { loadSettings, saveSettings } from '../src/game/systems/Settings.ts';
import { Tower } from '../src/game/entities/Tower.ts';
import { buildTowerVisual } from '../src/game/art/towerArt.ts';
import type { EvolutionCombat } from '../src/game/systems/EvolutionCombat.ts';
import type { ShotSnapshot } from '../src/shared/progression.ts';

vi.mock('phaser', () => ({
  default: {
    Scene: class {
      constructor(_key?: string) {}
    },
    Scenes: { Events: { SHUTDOWN: 'shutdown' } },
    Math: { Vector2: class { constructor(public x: number, public y: number) {} } }
  }
}));
vi.mock('../src/game/art/towerArt.ts', () => ({ buildTowerVisual: vi.fn(() => ({ view: anyStub(), crown: anyStub(), muzzleX: 0, muzzleY: -32 })), decorateEvolution: () => {}, towerPortraitKey: () => 'tower' }));

describe('development QA entry', () => {
  it('accepts only the supported query states', () => {
    for (const state of QA_STATES) {
      expect(parseQARequest(`?qa=${state}`)?.state).toBe(state);
    }
    expect(parseQARequest('?qa=unlisted')).toBeNull();
    expect(parseQARequest('?fixture=empty')).toBeNull();
  });

  it('selects explicit empty and API-failure leaderboard fixtures', () => {
    expect(parseQARequest('?qa=leaderboard')).toEqual({ state: 'leaderboard', leaderboardFixture: 'empty' });
    expect(parseQARequest('?qa=leaderboard&fixture=failure')).toEqual({ state: 'leaderboard', leaderboardFixture: 'failure' });
  });
});

describe('GameScene replay lifecycle', () => {
  it('shows empty plots at rest and distinguishes valid and blocked placement', () => {
    const marker = () => ({
      setVisible: vi.fn().mockReturnThis(),
      setFillStyle: vi.fn().mockReturnThis(),
      setStrokeStyle: vi.fn().mockReturnThis()
    });
    const markers = [marker(), marker()];
    const run = new GameScene() as unknown as {
      plotMarkers: typeof markers; occupied: Set<number>; placingTowerId: string | null;
      placementCheck: (id: string, index: number) => { ok: boolean }; refreshPlots(): void;
    };
    run.plotMarkers = markers; run.occupied = new Set([1]); run.placingTowerId = null;
    run.placementCheck = (_id, index) => ({ ok: !run.occupied.has(index) });
    run.refreshPlots();
    expect(markers[0].setVisible).toHaveBeenLastCalledWith(true);
    expect(markers[1].setVisible).toHaveBeenLastCalledWith(false);
    expect(markers[0].setStrokeStyle).toHaveBeenLastCalledWith(2, 0xe8c879, 0.85);
    run.placingTowerId = 'test'; run.refreshPlots();
    expect(markers[1].setVisible).toHaveBeenLastCalledWith(true);
    expect(markers[0].setStrokeStyle).toHaveBeenLastCalledWith(3, 0x8ee6a0, 1);
    expect(markers[1].setStrokeStyle).toHaveBeenLastCalledWith(3, 0xff8078, 1);
    run.placingTowerId = null; run.occupied.delete(1); run.refreshPlots();
    expect(markers[1].setVisible).toHaveBeenLastCalledWith(true);
    expect(markers[1].setStrokeStyle).toHaveBeenLastCalledWith(2, 0xe8c879, 0.85);
  });

  it('changes transient speed without overwriting the preferred restart speed', () => {
    const storage = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (k: string) => storage.get(k), setItem: (k: string, v: string) => storage.set(k, v) });
    saveSettings({ ...loadSettings(), gameSpeed: 1 });
    const scene = new GameScene();
    const run = scene as unknown as { cycleSpeed(): void; updateHUD(): void; speed: number };
    run.updateHUD = () => {};
    scene.init({ difficulty: 'easy' });
    run.cycleSpeed();
    expect(run.speed).toBe(2);
    expect(loadSettings().gameSpeed).toBe(1);
    scene.init({ difficulty: 'easy' });
    expect(run.speed).toBe(1);
    vi.unstubAllGlobals();
  });

  it('stores the base bounty on spawned enemies so difficulty is applied once at death', () => {
    const scene = new GameScene();
    const run = scene as unknown as { spawnEnemy(id: string, bonus: number): void; makeEnemyVisual(): void; enemies: Array<{ reward: number }> };
    scene.init({ difficulty: 'hard' });
    run.makeEnemyVisual = () => {};
    run.spawnEnemy('thornling', 1);
    expect(run.enemies[0].reward).toBe(ENEMIES.thornling.baseReward);
  });

  it('awards the once-scaled bounty and queues exactly one boss reward during active combat', () => {
    const sound = vi.spyOn(SoundManager, 'get').mockReturnValue({ die() {} } as SoundManager);
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const scene = new GameScene();
    const run = scene as unknown as {
      wave: number; waveActive: boolean; gold: number; bossesKilled: number;
      killEnemy(enemy: Enemy): void; floatText(): void; impactBurst(): void; startDeathAnim(): void; updateHUD(): void; drawPowerupBar(): void;
      vault: { pending: unknown[]; stored: unknown[] };
    };
    scene.init({ difficulty: 'hard' });
    run.floatText = run.impactBurst = run.startDeathAnim = run.updateHUD = run.drawPowerupBar = () => {};
    const basic = new Enemy('thornling', 60, 70, ENEMIES.thornling.baseReward);
    run.killEnemy(basic);
    expect(run.gold).toBe(507);
    run.killEnemy(basic);
    expect(run.gold).toBe(507);
    run.wave = 10; run.waveActive = true;
    const boss = new Enemy('warlord', 2200, 52, ENEMIES.warlord.baseReward);
    run.killEnemy(boss); run.killEnemy(boss);
    expect(run.bossesKilled).toBe(1);
    expect(run.vault.pending).toHaveLength(1);
    expect(run.vault.stored).toHaveLength(0);
    sound.mockRestore(); random.mockRestore();
  });

  it('refuses all late impact damage after Game Over', () => {
    const scene = new GameScene();
    scene.init({ difficulty: 'medium' });
    const run = scene as unknown as { ended: boolean; damageEnemy(enemy: Enemy, damage: number, type: 'physical'): number };
    run.ended = true;
    const enemy = new Enemy('thornling', 60, 70, 8);
    expect(run.damageEnemy(enemy, 100, 'physical')).toBe(0);
    expect(enemy.hp).toBe(60);
    expect(enemy.alive).toBe(true);
  });

  it('keeps stable road-lane presentation separate from combat coordinates', () => {
    const scene = new GameScene();
    const run = scene as unknown as { enemyRenderPoint(enemy: Enemy): { x: number; y: number } };
    const enemy = new Enemy('ironbark', 150, 62, 12);
    enemy.x = 160; enemy.y = 180; enemy.distanceTraveled = 140;
    const before = { x: enemy.x, y: enemy.y, hp: enemy.hp, distance: enemy.distanceTraveled, waypoint: enemy.waypointIndex };
    const point = run.enemyRenderPoint(enemy);
    expect(run.enemyRenderPoint(enemy)).toEqual(point);
    expect(Math.hypot(point.x - enemy.x, point.y - enemy.y)).toBeLessThanOrEqual(Math.hypot(12, 8));
    expect({ x: enemy.x, y: enemy.y, hp: enemy.hp, distance: enemy.distanceTraveled, waypoint: enemy.waypointIndex }).toEqual(before);
  });

  it('uses physical flight duration even when the rendered chain origin differs', () => {
    const scene = new GameScene(); scene.init({ difficulty: 'medium' });
    const view = { setDepth() { return this; }, add: vi.fn() };
    const run = scene as unknown as {
      add: { container: ReturnType<typeof vi.fn>; circle: ReturnType<typeof vi.fn> }; world: (value: unknown) => unknown; evolutionCombat: EvolutionCombat;
      fireProjectile(x: number, y: number, enemy: Enemy, shot: ShotSnapshot, chain: number, hit: Set<number>, visualOrigin: { x: number; y: number }): void;
      flights: Array<{ durationMs: number; x1: number; y1: number }>;
    };
    run.add = { container: vi.fn(() => view), circle: vi.fn(() => ({})) }; run.world = (value) => value;
    const tempest = new Tower('tempest', 100, 200, 0);
    const enemy = new Enemy('thornling', 60, 70, 8); enemy.x = 400; enemy.y = 200;
    run.fireProjectile(100, 200, enemy, run.evolutionCombat.makeShot(tempest, [tempest], 1), 1, new Set(), { x: 120, y: 170 });
    expect(run.flights[0].durationMs).toBeCloseTo(300 / 430 * 1000);
    expect(run.flights[0]).toMatchObject({ x1: 120, y1: 170 });
  });

  it('clears stale HUD and tray references before a scene restart redraws them', () => {
    const scene = new GameScene();
    const refs = scene as unknown as Record<string, unknown>;
    const stale = {};
    const renderRefs = [
      'hudWaveLabel', 'hudWaveValue', 'hudGoldValue', 'hudLivesValue', 'hudScoreValue', 'hudDiff', 'hudStatus',
      'startBtn', 'startBtnLabel', 'nextPreview', 'speedBtnLabel', 'infoPanel', 'towerCommands', 'placePanel', 'powerupRow',
      'rangeCircle', 'rangeBackdrop', 'ghost', 'ghostReason', 'enemyLayer', 'bossBar', 'bossBarFill', 'bossBarText', 'bossBarHp'
    ];
    renderRefs.forEach((key) => { refs[key] = stale; });

    scene.init({ difficulty: 'hard', playerName: 'QA Warden' });

    renderRefs.forEach((key) => expect(refs[key], key).toBeNull());
  });

  it('releases its scene and keyboard input callbacks on shutdown', () => {
    const scene = new GameScene();
    const off = vi.fn();
    const keyboardOff = vi.fn();
    const internals = scene as unknown as {
      input: { off: typeof off; keyboard: { off: typeof keyboardOff } };
      detachInputListeners(): void;
    };
    internals.input = { off, keyboard: { off: keyboardOff } };

    internals.detachInputListeners();

    expect(off.mock.calls.map(([event]) => event)).toEqual(['pointerup', 'pointerupoutside', 'pointerdown', 'pointermove']);
    expect(keyboardOff.mock.calls.map(([event]) => event)).toEqual(['keydown-ESC', 'keydown-SPACE', 'keydown-P', 'keydown-A']);
  });
});

function anyStub(): any {
  const proxy: any = new Proxy(function () { return proxy; }, { get: (_t, key) => (key === 'then' ? undefined : key === Symbol.toPrimitive ? () => 0 : proxy), apply: () => proxy });
  return proxy;
}
interface QARun { wave: number; waveActive: boolean; debugAssisted: boolean; towers: Tower[]; selectedTower: Tower | null; siege: SiegeSystem; vault: RelicVault; events: { emit: ReturnType<typeof vi.fn> }; handleQAAction(action: QAAction): void; }
function qaScene(fixture?: QACampaignFixture): QARun {
  vi.spyOn(SoundManager, 'get').mockReturnValue(anyStub());
  const scene = new GameScene(); scene.init({ difficulty: 'medium', playerName: 'QA Warden', ...(fixture ? { mode: 'campaign', campaignLevel: fixture.level, qaCampaignFixture: fixture, ...(fixture.visualTier === undefined ? {} : { campaignVisualTier: fixture.visualTier }) } : {}) });
  const loose = scene as unknown as Record<string, unknown>;
  for (const name of ['updateHUD', 'refreshInfoPanel', 'drawSheet', 'drawPowerupBar', 'refreshPlots', 'refreshPlacePanel', 'hideGhost', 'showBanner', 'floatText', 'floatTextForEnemy', 'drawCatalog', 'updateNextPreview', 'renderVictory', 'projectEntity', 'presentReward', 'showTouchPreview', 'refreshTowerVisual', 'makeEnemyVisual', 'renderFrame', 'renderCampaignResult', 'closeModal', 'syncFieldViews', 'impactAt', 'impactBurst', 'startDeathAnim', 'addEffect']) loose[name] = () => {};
  loose.add = anyStub(); loose.world = (v: unknown) => v;
  loose.events = { emit: vi.fn(), on: vi.fn(), off: vi.fn() }; loose.input = { listenerCount: () => 0, keyboard: null }; loose.tweens = { getTweens: () => [] };
  return scene as unknown as QARun;
}

describe('development campaign fixtures', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
  const fixture = (level: number, bossPhase: QACampaignFixture['bossPhase'] = 'initial', state: QACampaignFixture['state'] = 'campaign-boss'): QACampaignFixture => ({ state,level,bossPhase });
  it('validates explicit levels and boss-specific phase requests', () => {
    expect(parseQARequest('?qa=campaign&level=21')).toEqual({ state: 'campaign', campaignFixture: fixture(21,'initial','campaign') });
    expect(parseQARequest('?qa=campaign-boss&level=20&bossPhase=core')?.campaignFixture).toEqual(fixture(20,'core'));
    expect(parseQARequest('?qa=campaign-results&level=10')?.campaignFixture).toEqual(fixture(10,'initial','campaign-results'));
    for (const query of ['?qa=campaign&level=31','?qa=campaign&level=1.5','?qa=campaign&level=1e1','?qa=campaign-boss&level=11','?qa=campaign-boss&level=10&bossPhase=core','?qa=campaign-boss&level=30&bossPhase=guarded','?qa=campaign-results&level=10&bossPhase=core']) expect(parseQARequest(query)).toBeNull();
    expect(isQACampaignFixture(null)).toBe(false); expect(isQACampaignFixture(fixture(NaN))).toBe(false);
  });
  it.each([1,2,3] as const)('constructs cosmetic tier %i on legal lower plots without changing foundation stats or progress', visualTier => {
    const request = parseQARequest(`?qa=campaign&level=1&tier=${visualTier}`)!;
    expect(request.campaignFixture).toEqual({ ...fixture(1,'initial','campaign'), visualTier });
    const sharedClear = vi.spyOn(campaignRepository,'recordClear'), write = vi.fn();
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: write });
    vi.mocked(buildTowerVisual).mockClear();
    const run: any = qaScene(request.campaignFixture); run.seedQACampaignFixture();
    expect(run.campaign.visualTier).toBe(visualTier); expect(run.qaCampaignRepository.view().totalMasteryStars).toBe(0);
    expect(run.towers).toHaveLength(5);
    for (const tower of run.towers) {
      expect(tower.y).toBeGreaterThanOrEqual(210);
      expect(run.map.buildable[tower.plotIndex]).toEqual({ x: tower.x, y: tower.y });
      const baseline = new Tower(tower.towerId,tower.x,tower.y,tower.plotIndex); baseline.progression.foundationLevel = tower.level;
      expect(tower.level).toBe(2); expect(tower.stats).toEqual(baseline.stats);
    }
    expect(vi.mocked(buildTowerVisual).mock.calls).toHaveLength(5);
    expect(vi.mocked(buildTowerVisual).mock.calls.every(call => call[3] === visualTier)).toBe(true);
    const status = run.events.emit.mock.calls[run.events.emit.mock.calls.length - 1][1];
    expect(status.progression.every((tower: { visualTier: number }) => tower.visualTier === visualTier)).toBe(true);
    expect(sharedClear).not.toHaveBeenCalled(); expect(write).not.toHaveBeenCalled();
  });
  it('rejects invalid cosmetic tiers and ignores a valid tier override in production', () => {
    for (const tier of ['0','4','2.0','2e0','NaN','']) expect(parseQARequest(`?qa=campaign&level=1&tier=${tier}`)).toBeNull();
    expect(isQACampaignFixture({ ...fixture(1,'initial','campaign'),visualTier: '3' })).toBe(false);
    const run: any = qaScene({ ...fixture(1,'initial','campaign'),visualTier: 3 }); expect(run.towerVisualTier).toBe(3);
    vi.stubEnv('DEV',false);
    const productionTier = campaignVisualTier(campaignRepository.view());
    run.init({ mode: 'campaign', campaignLevel: 1, qaCampaignFixture: { ...fixture(1,'initial','campaign'),visualTier: 3 } });
    expect(run.qaCampaignFixture).toBeNull(); expect(run.towerVisualTier).toBe(productionTier);
  });
  it('keeps the seeded cosmetic tier in sync for boss fixtures without an explicit override', () => {
    const run: any = qaScene(fixture(30,'initial','campaign-boss'));
    expect(run.qaCampaignRepository.view().totalMasteryStars).toBe(87);
    expect(run.campaign.visualTier).toBe(3);
    expect(run.towerVisualTier).toBe(3);
  });
  it.each([1,11,21])('seeds level %i using the actual campaign map, roster, and fixed-step wave', level => {
    const sharedView = vi.spyOn(campaignRepository,'view'), sharedClear = vi.spyOn(campaignRepository,'recordClear');
    const run: any = qaScene(fixture(level,'initial','campaign')); run.seedQACampaignFixture();
    expect([run.campaign.definition.level,run.wave,run.waveActive,run.debugAssisted,run.paused]).toEqual([level,1,true,true,true]);
    expect(run.map.id).toBe(run.campaign.definition.mapLayoutId);
    expect(run.towers).toHaveLength(5); expect(run.spawnQueue.length).toBeGreaterThan(0);
    expect(run.gameTimeMs).toBeCloseTo(5000);
    expect(sharedView).not.toHaveBeenCalled(); expect(sharedClear).not.toHaveBeenCalled();
    const status = run.events.emit.mock.calls[run.events.emit.mock.calls.length-1][1];
    expect(status).toMatchObject({ campaignLevel: level, debugAssisted: true }); expect(status.campaignFixture).toContain('DEV FIXTURE');
  });
  it.each([
    [10,'guarded',1,true,0],[10,'enraged',3,false,0],
    [20,'initial',1,false,0],[20,'broken',2,false,0],[20,'core',3,false,0],
    [30,'initial',1,false,0],[30,'telegraph',1,false,1],[30,'freeze',1,false,0],[30,'phase2',2,false,2]
  ] as const)('shows the real level %i %s boss state', (level,phase,expectedPhase,guarded,targets) => {
    const run: any = qaScene(fixture(level,phase)); run.seedQACampaignFixture();
    const boss = run.enemies.find((enemy: Enemy) => enemy.isBoss);
    expect(boss.campaignId).toBe(run.campaign.definition.bossEnemyId);
    expect(run.campaignBosses.presentation(boss.id,run.gameTimeMs)).toMatchObject({ phase: expectedPhase,guarded });
    expect(run.campaignBosses.telegraphTargets()).toHaveLength(targets);
    expect(run.towers.filter((tower: Tower) => tower.frozenUntil > run.gameTimeMs)).toHaveLength(phase === 'freeze' ? 1 : 0);
    expect(run.debugAssisted).toBe(true); expect(run.paused).toBe(true);
    if (phase === 'core') expect(boss.damageTakenMultiplier).toBe(1.3);
    if (phase === 'enraged') expect(run.enemies.filter((enemy: Enemy) => enemy.campaignId === 'marchling')).toHaveLength(3);
  });
  it('derives the mastery/Sigil results in memory without shared progress, storage, best, or submission writes', () => {
    const write = vi.fn(); vi.stubGlobal('localStorage',{ getItem: () => null, setItem: write });
    const sharedClear = vi.spyOn(campaignRepository,'recordClear'), best = vi.spyOn(settingsModule,'saveBest'), submit = vi.spyOn(scoreApi,'submitScore');
    const run: any = qaScene(fixture(10,'initial','campaign-results')); run.seedQACampaignFixture();
    expect(run.campaignResult).toMatchObject({ outcome: 'victory', clear: { newlyEarnedStars: ['completion','lives','score'], newlyEarnedSigils: ['border_sigil'], saved: false } });
    expect(run.qaCampaignRepository.view().profile.levels[10].completionStar).toBe(true);
    expect(run.debugAssisted).toBe(true); expect(run.ended).toBe(true);
    expect(sharedClear).not.toHaveBeenCalled(); expect(write).not.toHaveBeenCalled(); expect(best).not.toHaveBeenCalled(); expect(submit).not.toHaveBeenCalled();
  });
  it('keeps fixtures assisted across restart and cleans their boss subscriptions', () => {
    const run: any = qaScene(fixture(30,'phase2')); run.scene = { restart: vi.fn(),start: vi.fn() }; run.seedQACampaignFixture();
    const bosses = run.campaignBosses; expect(bosses.telegraphTargets()).toHaveLength(2);
    run.restartRun(); const data = run.scene.restart.mock.calls[0][0]; expect(data.qaCampaignFixture).toEqual(fixture(30,'phase2'));
    run.cleanupProgression(); expect(bosses.telegraphTargets()).toHaveLength(0);
    run.init(data); expect(run.debugAssisted).toBe(true); expect(run.campaign.definition.level).toBe(30); expect(run.campaignBosses).not.toBe(bosses);
    expect(run.flights).toHaveLength(0); expect(run.vault.target).toBeNull();
  });
  it('routes explicit fixture actions through staged loading and rejects them in production', () => {
    const run: any = qaScene(); run.scene = { start: vi.fn() };
    run.handleQAAction({ type: 'campaign-fixture',fixture: fixture(20,'core') });
    expect(run.scene.start).toHaveBeenCalledWith('Preload',expect.objectContaining({ destination: 'Game',data: expect.objectContaining({ mode: 'campaign',campaignLevel: 20,qaCampaignFixture: fixture(20,'core') }) }));
    run.scene.start.mockClear(); vi.stubEnv('DEV',false);
    run.handleQAAction({ type: 'campaign-fixture',fixture: fixture(30,'phase2') }); expect(run.scene.start).not.toHaveBeenCalled();
    const empty = new CampaignRepository(null); vi.spyOn(campaignRepository,'view').mockReturnValue(empty.view());
    run.init({ mode: 'campaign',campaignLevel: 30,qaCampaignFixture: fixture(30,'phase2') });
    expect(run.campaignStartRejected).toBe(true); expect(run.qaCampaignRepository).toBeNull(); expect(run.debugAssisted).toBe(false);
    expect(() => installQA({} as never)).not.toThrow();
  });
  it('rejects mismatched level and phase fixture data instead of bypassing ordinary unlocks', () => {
    const run: any = qaScene(), empty = new CampaignRepository(null);
    vi.spyOn(campaignRepository,'view').mockReturnValue(empty.view());
    for (const [level,qaCampaignFixture] of [[30,fixture(20,'core')],[10,fixture(10,'core')],[31,fixture(31,'initial','campaign')]] as const) {
      run.init({ mode: 'campaign',campaignLevel: level,qaCampaignFixture });
      expect(run.campaignStartRejected).toBe(true); expect(run.qaCampaignRepository).toBeNull(); expect(run.debugAssisted).toBe(false);
    }
  });
});

describe('QA bootstrap before Phaser scene registration', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
  it('waits for a registered Game scene, installs once, and starts the requested staged fixture', () => {
    const nodes: any[] = [], append = vi.fn(), beforeUnload = vi.fn();
    const element = () => {
      const node = { style: {}, dataset: {}, appendChild: vi.fn(), setAttribute: vi.fn(), addEventListener: vi.fn(), remove: vi.fn() };
      nodes.push(node); return node;
    };
    vi.stubGlobal('document',{ createElement: element, body: { appendChild: append }, querySelector: () => null });
    vi.stubGlobal('window',{ location: { search: '?qa=campaign-boss&level=10&bossPhase=guarded',origin: 'http://127.0.0.1:5183' }, fetch: vi.fn(), addEventListener: beforeUnload });
    const events = new EventEmitter(), sceneEvents = new EventEmitter();
    let registered = false;
    const scene = { events: sceneEvents };
    const start = vi.fn(), stop = vi.fn();
    const game = { events, scene: { getScene: () => registered ? scene : null, isActive: (key: string) => registered && key === 'MainMenu', getScenes: () => [{ scene: { key: 'MainMenu' } }], start, stop } };
    expect(() => installQA(game as never)).not.toThrow();
    expect(append).not.toHaveBeenCalled(); expect(start).not.toHaveBeenCalled();
    expect(events.listenerCount('step')).toBe(1);
    registered = true; events.emit('step');
    expect(append).toHaveBeenCalledTimes(1); expect(sceneEvents.listenerCount('qa:status')).toBe(1);
    events.emit('step'); events.emit('step');
    expect(start).toHaveBeenCalledTimes(1);
    expect(start).toHaveBeenCalledWith('Preload',expect.objectContaining({ destination: 'Game', data: expect.objectContaining({ mode: 'campaign',campaignLevel: 10,qaCampaignFixture: { state: 'campaign-boss',level: 10,bossPhase: 'guarded' } }) }));
    expect(stop).toHaveBeenCalledWith('MainMenu');
    beforeUnload.mock.calls[0][1]();
    expect(events.listenerCount('step')).toBe(0); expect(sceneEvents.listenerCount('qa:status')).toBe(0);
    expect(nodes[0].remove).toHaveBeenCalledTimes(1);
  });
});
describe('progression QA fixtures', () => {
  afterEach(() => vi.restoreAllMocks());
  it('marks seeded runs as debug-assisted so they cannot earn achievements', () => {
    const run = qaScene(); run.handleQAAction({ type: 'seed', state: 'evolution' });
    expect([run.debugAssisted, run.siege.evolutionOpen, run.towers[0].level]).toEqual([true, true, 4]);
    expect(run.selectedTower).toBe(run.towers[0]);
    const qualifying = { ...run.towers[0], progression: { ...run.towers[0].progression, branchId: 'marksman' as const, rank: 2 as const } };
    expect(earnedBranches(20, 10, [qualifying], run.debugAssisted)).toEqual([]);
  });
  it('seeds a full-vault victory decision', () => {
    const run = qaScene(); run.handleQAAction({ type: 'seed', state: 'victory' });
    expect([run.siege.phase, run.vault.stored.length, run.vault.pending.length, run.wave]).toEqual(['victory', 3, 1, 30]);
  });
  it('seeds an endless rank-3 mastery tower', () => {
    const run = qaScene(); run.handleQAAction({ type: 'seed', state: 'mastery' });
    expect(run.siege.phase).toBe('endless');
    expect(run.towers[0].progression).toMatchObject({ branchId: 'marksman', rank: 3, invested: towerTotalInvested('longbow', 4) + EVOLUTIONS.marksman.stats.reduce((s, r) => s + r.cost, 0) });
  });
  it('keeps ordinary seeds startable through the siege and reports progression', () => {
    const run = qaScene(); run.handleQAAction({ type: 'seed', state: 'boss' });
    expect([run.wave, run.waveActive, run.siege.highestWave, run.debugAssisted]).toEqual([10, true, 10, true]);
    const calls = run.events.emit.mock.calls, status = calls[calls.length - 1][1] as QAStatus;
    expect(status).toMatchObject({ phase: 'siege', wavesCompleted: 9, fields: 0, debugAssisted: true, unsavedUnlocks: [] });
    expect(status.autoEnabled).toBe(false); expect(status.autoRemainingMs).toBeNull();
    expect(status.progression[0]).toMatchObject({ towerId: 'longbow', branchId: null, masteryRank: 0 });
  });
  it('does not treat speed changes as debug assistance', () => {
    const run = qaScene(); run.handleQAAction({ type: 'cycle-speed' }); expect(run.debugAssisted).toBe(false);
  });
});
