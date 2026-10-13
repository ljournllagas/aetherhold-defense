import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameScene } from '../src/game/scenes/GameScene.ts';
import { gameLayout } from '../src/game/ui/layout.ts';
import { SoundManager } from '../src/game/systems/SoundManager.ts';
import { CampaignBossSystem, CAMPAIGN_BOSS_TUNING } from '../src/game/campaign/bosses.ts';
import { getCampaignEnemy } from '../src/game/campaign/enemies.ts';
import { CAMPAIGN_BATTLE_TUNING } from '../src/game/campaign/battle.ts';
import { SIMULATION_STEP_MS } from '../src/game/systems/SimulationClock.ts';
import { Enemy } from '../src/game/entities/Enemy.ts';

vi.mock('phaser', () => ({ default: { Scene: class { constructor(_key?: string) {} } } }));
function stub(): any {
  const proxy: any = new Proxy(function () { return proxy; }, { get: (_target, key) => key === 'then' ? undefined : key === Symbol.toPrimitive ? () => 0 : proxy });
  return proxy;
}
function fixture(width = 1280, height = 720) {
  vi.spyOn(SoundManager, 'get').mockReturnValue(stub());
  const scene = new GameScene(); scene.init({ difficulty: 'medium' });
  const run: any = scene;
  run.layout = gameLayout(width, height); run.uiRoot = { add: vi.fn() };
  const views: any[] = [];
  run.add = { text: vi.fn((x, y, text, style) => {
    const view: any = { x, y, text, style, destroy: vi.fn(), setOrigin: vi.fn(() => view), setWordWrapWidth: vi.fn(() => view), setAlign: vi.fn(() => view), setDepth: vi.fn(() => view) };
    views.push(view); return view;
  }) };
  return { run, views };
}
function campaignBossActionFixture(campaignId: string) {
  const { run } = fixture();
  const cfg = getCampaignEnemy(campaignId);
  const boss = new Enemy(cfg.visualArchetype, cfg.baseHp, cfg.baseSpeed, cfg.baseReward, cfg);
  boss.campaignId = campaignId; boss.slowResistance = cfg.slowResistance;
  const visual = { playAction: vi.fn((_action: string) => 1000) };
  (boss as any).view = { getData: (key: string) => key === 'enemyVisual' ? visual : undefined };
  const system = new CampaignBossSystem(); system.register(boss, 0);
  run.campaign = {} as any; run.campaignBosses = system; run.enemies = [boss]; run.towers = [];
  let summonId = 100;
  run.spawnEnemy = vi.fn(() => ({ id: summonId++, x: 0, y: 0, waypointIndex: 1, distanceTraveled: 0 }));
  run.advanceEnemyAlongRoute = vi.fn();
  return { run, boss, visual, system };
}
afterEach(() => vi.restoreAllMocks());

const WORLD_SUPPORT_EVENT_TRACES = [
  { campaignId: 'aetherbound', events: [{ at: 6500, text: 'Aetherbound · Aether shields raised', telegraph: false, buff: true }] },
  { campaignId: 'tempest_herald', events: [
    { at: 6500, text: 'Tempest Herald · Haste gathering', telegraph: true, buff: false },
    { at: 7500, text: 'Tempest Herald · Nearby enemies hastened', telegraph: false, buff: true }
  ] },
  { campaignId: 'echo_shade', events: [
    { at: 7800, text: 'Echo Shade · Doubles forming', telegraph: true, buff: false },
    { at: 8700, text: 'Echo Shade · Decoys emerge', telegraph: false, buff: true }
  ] },
  { campaignId: 'rift_weaver', events: [
    { at: 7200, text: 'Rift Weaver · Phase jump gathering', telegraph: true, buff: false },
    { at: 8200, text: 'Rift Weaver · Phase jump', telegraph: false, buff: true }
  ] },
  { campaignId: 'crown_archon', events: [{ at: 7400, text: 'Crown Archon · Aether ward raised', telegraph: false, buff: true }] }
] as const;

describe('campaign ability callout', () => {
  it('routes real boss events into a backed notice, leaving classic floating text separate', () => {
    const { run, views } = fixture();
    const boss = { x: 100, y: 100, waypointIndex: 2, distanceTraveled: 70 };
    run.campaignBosses = { tick: () => [{ boss, text: 'Marchlings summoned', summon: { count: 3, enemyId: 'marchling' } }] };
    run.floatTextForEnemy = vi.fn(); run.spawnEnemy = vi.fn(() => ({})); run.tickCampaignBosses();
    expect(run.floatTextForEnemy).not.toHaveBeenCalled();
    expect(run.spawnEnemy).toHaveBeenCalledTimes(3);
    expect(views[0]).toMatchObject({ text: 'Marchlings summoned', style: { backgroundColor: '#121920', padding: { x: 8, y: 4 } } });
    expect(run.campaignCallout).toEqual({ text: 'Marchlings summoned', until: 3000 });
  });
  it('dispatches marked actions once from real expansion boss events', () => {
    const actions = (visual: ReturnType<typeof campaignBossActionFixture>['visual']) => visual.playAction.mock.calls.map(([action]) => action);
    const at = (ctx: ReturnType<typeof campaignBossActionFixture>, time: number, expected: string[], hpFraction?: number) => {
      if (hpFraction !== undefined) ctx.boss.hp = ctx.boss.maxHp * hpFraction;
      ctx.run.gameTimeMs = time; ctx.run.tickCampaignBosses();
      expect(actions(ctx.visual)).toEqual(expected);
      return ctx.system.presentation(ctx.boss.id, time);
    };

    const oracle = campaignBossActionFixture('drowned_oracle');
    at(oracle, 0, []);
    const oracleWarnAt = CAMPAIGN_BOSS_TUNING.oracleResistanceIntervalMs;
    expect(at(oracle, oracleWarnAt, ['special'])).toMatchObject({ phase: 1, telegraph: true, resistanceType: 'physical' });
    at(oracle, oracleWarnAt, ['special']);
    at(oracle, oracleWarnAt + CAMPAIGN_BOSS_TUNING.bossTransitionTelegraphMs - 1, ['special']);
    expect(at(oracle, oracleWarnAt + CAMPAIGN_BOSS_TUNING.bossTransitionTelegraphMs, ['special', 'phase_two']))
      .toMatchObject({ phase: 2, telegraph: false, resistanceType: 'arcane' });

    const tyrant = campaignBossActionFixture('iron_tyrant');
    expect(at(tyrant, 100, ['special'], 0.649)).toMatchObject({ phase: 1, telegraph: true });
    at(tyrant, 100, ['special']);
    at(tyrant, 1299, ['special']);
    expect(at(tyrant, 1300, ['special', 'phase_two'])).toMatchObject({ phase: 2, telegraph: false });

    const hydra = campaignBossActionFixture('mireheart_hydra');
    hydra.visual.playAction.mockImplementation(action => {
      if (action === 'phase_two') expect(hydra.run.spawnEnemy).toHaveBeenCalledTimes(2);
      return 1000;
    });
    expect(at(hydra, 0, ['special'], CAMPAIGN_BOSS_TUNING.hydraSummonHp)).toMatchObject({ phase: 2, telegraph: true });
    at(hydra, 0, ['special']);
    at(hydra, CAMPAIGN_BOSS_TUNING.hydraTelegraphMs - 1, ['special']);
    expect(at(hydra, CAMPAIGN_BOSS_TUNING.hydraTelegraphMs, ['special', 'phase_two']))
      .toMatchObject({ phase: 2, telegraph: false });

    const stormmaw = campaignBossActionFixture('stormmaw_prime');
    const ally = new Enemy('swiftwisp', 100, 30, 1, getCampaignEnemy('cloud_skitter'));
    ally.x = 30; stormmaw.run.enemies.push(ally);
    const stormWarnAt = CAMPAIGN_BOSS_TUNING.stormmawIntervalMs;
    expect(at(stormmaw, stormWarnAt, ['special'])).toMatchObject({ phase: 1, telegraph: true });
    const stormResolveAt = stormWarnAt + CAMPAIGN_BOSS_TUNING.stormmawTelegraphMs;
    expect(at(stormmaw, stormResolveAt, ['special'])).toMatchObject({ phase: 1, telegraph: false });
    expect(ally.speedBuffUntil).toBe(stormResolveAt + CAMPAIGN_BOSS_TUNING.stormmawBuffDurationMs);

    const regent = campaignBossActionFixture('umbral_regent');
    regent.visual.playAction.mockImplementation(action => {
      if (action === 'phase_two') expect(regent.run.spawnEnemy).toHaveBeenCalledTimes(2);
      return 1000;
    });
    expect(at(regent, 100, ['special'], 0.64)).toMatchObject({ phase: 1, telegraph: true });
    at(regent, 100 + CAMPAIGN_BOSS_TUNING.bossTransitionTelegraphMs - 1, ['special']);
    expect(at(regent, 100 + CAMPAIGN_BOSS_TUNING.bossTransitionTelegraphMs, ['special', 'phase_two']))
      .toMatchObject({ phase: 2, telegraph: false });

    const sovereign = campaignBossActionFixture('rift_sovereign');
    const sovereignWarnAt = CAMPAIGN_BOSS_TUNING.sovereignIntervalMs;
    expect(at(sovereign, sovereignWarnAt, ['special'])).toMatchObject({ phase: 1, telegraph: true });
    const sovereignResolveAt = sovereignWarnAt + CAMPAIGN_BOSS_TUNING.sovereignTelegraphMs;
    expect(at(sovereign, sovereignResolveAt, ['special', 'phase_two'])).toMatchObject({ phase: 2, telegraph: false });

    const devourer = campaignBossActionFixture('aether_devourer');
    at(devourer, 0, []);
    expect(at(devourer, 100, ['phase_two'], 0.69)).toMatchObject({ phase: 2, telegraph: false });
    at(devourer, 200, ['phase_two'], 0.44);
    const devourerWarnAt = 200 + CAMPAIGN_BOSS_TUNING.devourerPortalIntervalMs;
    expect(at(devourer, devourerWarnAt, ['phase_two', 'special'])).toMatchObject({ phase: 3, telegraph: true });
    at(devourer, devourerWarnAt + CAMPAIGN_BOSS_TUNING.devourerPortalTelegraphMs, ['phase_two', 'special']);
  });
  it('holds an Oracle warning through pause and dispatches Phase 2 only after simulation time resumes', () => {
    const { run, boss, visual, system } = campaignBossActionFixture('drowned_oracle');
    run.gameTimeMs = 0; run.tickCampaignBosses();
    for (const method of ['updateAchievementNotices', 'renderFrame', 'moveEnemies', 'updateFlights', 'processFieldTicks', 'fireTowers', 'checkWaveClear', 'tickAuto', 'refreshAutoDisplay', 'presentReward', 'publishQAStatus']) run[method] = vi.fn();
    run.gameTimeMs = CAMPAIGN_BOSS_TUNING.oracleResistanceIntervalMs - SIMULATION_STEP_MS;
    run.simulationClock.reset();

    run.update(0, SIMULATION_STEP_MS);
    expect(run.gameTimeMs).toBeCloseTo(CAMPAIGN_BOSS_TUNING.oracleResistanceIntervalMs);
    expect(visual.playAction).toHaveBeenCalledExactlyOnceWith('special');
    expect(system.presentation(boss.id, run.gameTimeMs)).toMatchObject({ phase: 1, telegraph: true, resistanceType: 'physical' });

    run.pauseState.set('user', true);
    const pausedAt = run.gameTimeMs;
    run.update(1000, 5000);
    expect(run.gameTimeMs).toBe(pausedAt);
    expect(visual.playAction).toHaveBeenCalledExactlyOnceWith('special');
    expect(system.presentation(boss.id, run.gameTimeMs).telegraph).toBe(true);

    run.pauseState.set('user', false);
    run.update(6000, 1000); // The simulation clock caps each rendered frame at one second.
    expect(system.presentation(boss.id, run.gameTimeMs)).toMatchObject({ phase: 1, telegraph: true, resistanceType: 'physical' });
    expect(visual.playAction.mock.calls.map(([action]) => action)).toEqual(['special']);
    run.update(7017, 250);
    expect(system.presentation(boss.id, run.gameTimeMs)).toMatchObject({ phase: 2, telegraph: false, resistanceType: 'arcane' });
    expect(visual.playAction.mock.calls.map(([action]) => action)).toEqual(['special', 'phase_two']);
    run.update(7034, SIMULATION_STEP_MS);
    expect(visual.playAction.mock.calls.map(([action]) => action)).toEqual(['special', 'phase_two']);
  });
  it.each(['ashcaller', 'frost_shaman'])('plays the authored buff clip on a real %s pulse', (campaignId) => {
    const { run } = fixture();
    const visual = { playAction: vi.fn() };
    const support = { id: 7, campaignId, alive: true, isBoss: false, x: 0, y: 0, view: { getData: () => visual } };
    const ally = { alive: true, x: 12, y: 0, speedBuffUntil: 0, slowResistanceUntil: 0 };
    const bosses = new CampaignBossSystem();
    bosses.register(support as unknown as Enemy, 0);
    run.campaignBosses = bosses; run.enemies = [support, ally]; run.towers = [];
    run.gameTimeMs = CAMPAIGN_BATTLE_TUNING.supportIntervalMs;

    run.tickCampaignBosses();

    expect(visual.playAction).toHaveBeenCalledOnce();
    expect(visual.playAction).toHaveBeenCalledWith('buff');
    if (campaignId === 'ashcaller') expect(ally.speedBuffUntil).toBe(run.gameTimeMs + CAMPAIGN_BATTLE_TUNING.supportDurationMs);
    else expect(ally.slowResistanceUntil).toBe(run.gameTimeMs + CAMPAIGN_BATTLE_TUNING.supportDurationMs);
  });
  it('plays the authored buff clip once on Foundry Core armor pulse from the real support system', () => {
    const { run } = fixture();
    const visual = { playAction: vi.fn() };
    const support = { id: 7, campaignId: 'foundry_core', alive: true, isBoss: false, x: 0, y: 0, view: { getData: () => visual } };
    const ally = { id: 8, alive: true, isBoss: false, x: 12, y: 0 };
    const bosses = new CampaignBossSystem();
    bosses.register(support as unknown as Enemy, 0);
    run.campaignBosses = bosses; run.enemies = [support, ally]; run.towers = [];
    run.gameTimeMs = CAMPAIGN_BOSS_TUNING.foundryCoreIntervalMs;

    run.tickCampaignBosses();
    expect(run.campaignCallout.text).toBe('Foundry Core · Nearby armor reinforced');
    expect(bosses.incomingDamageMultiplier(ally.id, 'physical', run.gameTimeMs)).toBe(CAMPAIGN_BOSS_TUNING.foundryCoreArmorMultiplier);
    expect(visual.playAction).toHaveBeenCalledExactlyOnceWith('buff');

    run.tickCampaignBosses(); // Re-reading one simulation time cannot replay the pulse.
    expect(visual.playAction).toHaveBeenCalledTimes(1);
  });
  it.each(WORLD_SUPPORT_EVENT_TRACES)('plays the authored buff clip once for each real $campaignId support event', ({ campaignId, events }) => {
    const { run } = fixture();
    const visual = { playAction: vi.fn() };
    const support = { id: 7, campaignId, alive: true, isBoss: false, x: 0, y: 0, view: { getData: () => visual } };
    const ally = { id: 8, alive: true, isBoss: false, x: 12, y: 0, speedBuffUntil: 0 };
    const bosses = new CampaignBossSystem();
    bosses.register(support as unknown as Enemy, 0);
    run.campaignBosses = bosses; run.enemies = [support, ally]; run.towers = [];
    let summonId = 20;
    run.spawnEnemy = vi.fn(() => ({ id: summonId++ }));

    events.forEach((event, index) => {
      run.gameTimeMs = event.at;
      run.tickCampaignBosses();
      expect(run.campaignCallout.text).toBe(event.text);
      expect(bosses.presentation(support.id, event.at).telegraph).toBe(event.telegraph);
      const expectedCalls = events.slice(0, index + 1).filter(candidate => candidate.buff).length;
      expect(visual.playAction).toHaveBeenCalledTimes(expectedCalls);
      if (event.buff) expect(visual.playAction).toHaveBeenLastCalledWith('buff');

      run.tickCampaignBosses(); // No event at the frozen simulation time.
      run.gameTimeMs = event.at + 1; run.tickCampaignBosses(); // Active state alone does not replay the action.
      expect(visual.playAction).toHaveBeenCalledTimes(expectedCalls);
    });
  });
  it('holds a Foundry Core support pulse through pause until game time resumes', () => {
    const { run } = fixture();
    const visual = { playAction: vi.fn() };
    const support = { id: 7, campaignId: 'foundry_core', alive: true, isBoss: false, x: 0, y: 0, view: { getData: () => visual } };
    const ally = { id: 8, alive: true, isBoss: false, x: 12, y: 0 };
    const bosses = new CampaignBossSystem(); bosses.register(support as unknown as Enemy, 0);
    run.campaign = {} as any; run.campaignBosses = bosses; run.enemies = [support, ally]; run.towers = [];
    for (const method of ['updateAchievementNotices', 'renderFrame', 'moveEnemies', 'updateFlights', 'processFieldTicks', 'fireTowers', 'checkWaveClear', 'tickAuto', 'refreshAutoDisplay', 'presentReward', 'publishQAStatus']) run[method] = vi.fn();
    run.gameTimeMs = CAMPAIGN_BOSS_TUNING.foundryCoreIntervalMs - SIMULATION_STEP_MS;
    run.simulationClock.reset(); run.pauseState.set('user', true);

    const pausedAt = run.gameTimeMs;
    run.update(0, CAMPAIGN_BOSS_TUNING.foundryCoreIntervalMs);
    expect(run.gameTimeMs).toBe(pausedAt);
    expect(visual.playAction).not.toHaveBeenCalled();

    run.pauseState.set('user', false);
    run.update(1000, SIMULATION_STEP_MS);
    expect(run.gameTimeMs).toBeCloseTo(CAMPAIGN_BOSS_TUNING.foundryCoreIntervalMs);
    expect(visual.playAction).toHaveBeenCalledExactlyOnceWith('buff');
    run.update(1017, SIMULATION_STEP_MS);
    expect(visual.playAction).toHaveBeenCalledTimes(1);
  });
  it('holds a Tempest Herald cast in telegraph through pause and plays buff only at resolution', () => {
    const { run } = fixture();
    const visual = { playAction: vi.fn() };
    const support = { id: 7, campaignId: 'tempest_herald', alive: true, isBoss: false, x: 0, y: 0, view: { getData: () => visual } };
    const ally = { id: 8, alive: true, isBoss: false, x: 12, y: 0, speedBuffUntil: 0 };
    const bosses = new CampaignBossSystem(); bosses.register(support as unknown as Enemy, 0);
    run.campaign = {} as any; run.campaignBosses = bosses; run.enemies = [support, ally]; run.towers = [];
    for (const method of ['updateAchievementNotices', 'renderFrame', 'moveEnemies', 'updateFlights', 'processFieldTicks', 'fireTowers', 'checkWaveClear', 'tickAuto', 'refreshAutoDisplay', 'presentReward', 'publishQAStatus']) run[method] = vi.fn();
    run.gameTimeMs = CAMPAIGN_BOSS_TUNING.tempestHeraldIntervalMs - SIMULATION_STEP_MS;
    run.simulationClock.reset();

    run.update(0, SIMULATION_STEP_MS);
    expect(run.campaignCallout.text).toBe('Tempest Herald · Haste gathering');
    expect(bosses.presentation(support.id, run.gameTimeMs).telegraph).toBe(true);
    expect(visual.playAction).not.toHaveBeenCalled();

    run.pauseState.set('user', true);
    const pausedAt = run.gameTimeMs;
    run.update(1000, 5000);
    expect(run.gameTimeMs).toBe(pausedAt);
    expect(bosses.presentation(support.id, run.gameTimeMs).telegraph).toBe(true);
    expect(visual.playAction).not.toHaveBeenCalled();

    run.pauseState.set('user', false);
    run.update(6000, CAMPAIGN_BOSS_TUNING.tempestHeraldTelegraphMs + SIMULATION_STEP_MS);
    run.update(6017, SIMULATION_STEP_MS);
    expect(run.campaignCallout.text).toBe('Tempest Herald · Nearby enemies hastened');
    expect(bosses.presentation(support.id, run.gameTimeMs).telegraph).toBe(false);
    expect(ally.speedBuffUntil).toBeGreaterThan(run.gameTimeMs);
    expect(visual.playAction).toHaveBeenCalledExactlyOnceWith('buff');
    run.update(6034, SIMULATION_STEP_MS);
    expect(visual.playAction).toHaveBeenCalledTimes(1);
  });
  it('routes the real Rootwretch heal pulse into buff playback without changing cadence, radius or target cooldown', () => {
    const { run } = fixture();
    const visual = { playAction: vi.fn(() => 0) };
    const support = { id: 7, campaignId: 'rootwretch', alive: true, isBoss: false, x: 0, y: 0, hp: 100, maxHp: 100, view: { getData: () => visual } };
    const ally = { id: 8, alive: true, isBoss: false, x: 145, y: 0, hp: 50, maxHp: 100 };
    const outside = { ...ally, id: 9, x: 146 };
    const boss = { ...ally, id: 10, x: 40, isBoss: true };
    const bosses = new CampaignBossSystem(); bosses.register(support as unknown as Enemy, 0);
    run.campaignBosses = bosses; run.enemies = [support, ally, outside, boss]; run.towers = [];
    run.gameTimeMs = 5499; run.tickCampaignBosses();
    expect(visual.playAction).not.toHaveBeenCalled(); expect(ally.hp).toBe(50);
    run.gameTimeMs = 5500; run.tickCampaignBosses();
    expect(visual.playAction).toHaveBeenCalledExactlyOnceWith('buff');
    expect(run.campaignCallout.text).toBe('Rootwretch · Healing roots');
    expect(ally.hp).toBe(54); expect(outside.hp).toBe(50); expect(boss.hp).toBe(50);
    run.tickCampaignBosses(); // An unchanged simulation clock cannot repeat a pulse.
    expect(visual.playAction).toHaveBeenCalledTimes(1);
    run.gameTimeMs = 11000; run.tickCampaignBosses();
    expect(visual.playAction).toHaveBeenCalledTimes(2); expect(ally.hp).toBe(54);
    run.gameTimeMs = 16500; run.tickCampaignBosses();
    expect(visual.playAction).toHaveBeenCalledTimes(3); expect(ally.hp).toBe(58);
    // The existing provisional view may have no authored EnemyView at all.
    support.view.getData = () => undefined as any;
    run.gameTimeMs = 22000; expect(() => run.tickCampaignBosses()).not.toThrow();
  });
  it('starts the authored death clip while retaining detached-view cleanup and clip duration', () => {
    const { run } = fixture();
    const visual = { playAction: vi.fn(() => 750) };
    const data=new Map<string,unknown>([['enemyVisual',visual]]);
    const view = { getData: (key:string) => data.get(key), setData: (key:string,value:unknown) => {data.set(key,value);return view;} };
    const enemy: any = { isBoss: false, view, shadow: null, slowRing: null, hpBar: { clear: vi.fn() }, body: {} };
    run.gameTimeMs = 120;

    run.startDeathAnim(enemy);

    expect(visual.playAction).toHaveBeenCalledWith('death');
    expect(view.getData('deathScreenScale')).toBeGreaterThan(0);
    expect(run.dying[0]).toMatchObject({ view, t0: 120, duration: 750 });
    expect(enemy).toMatchObject({ view: null, body: null, shadow: null, slowRing: null, hpBar: null });
    expect(enemy.hpBar).toBeNull();
  });
  it('pauses and resumes detached death clips with simulation speed', () => {
    const { run } = fixture();
    const sprite = { anims: { timeScale: 1, pause: vi.fn(), resume: vi.fn() } };
    const view = { getData: () => ({ sprite }) };
    run.dying = [{ view }]; run.speed = 3; run.paused = true;

    run.syncEnemyAnimationPlayback();
    expect(sprite.anims.timeScale).toBe(3); expect(sprite.anims.pause).toHaveBeenCalledOnce();
    run.paused = false;
    run.syncEnemyAnimationPlayback();
    expect(sprite.anims.resume).toHaveBeenCalledOnce();
  });
  it.each([[1440,900],[1280,720],[1024,768],[844,390],[390,844],[360,640]])('keeps the notice inside the bottom of the field at %ix%i', (width, height) => {
    const { run, views } = fixture(width,height);
    run.showCampaignCallout('Freezing 2 towers');
    const f = run.layout.field, view = views[0];
    expect(view.x).toBe(f.x + f.width / 2); expect(view.y).toBe(f.y + f.height - 12);
    expect(view.setOrigin).toHaveBeenCalledWith(0.5,1);
    expect(view.setWordWrapWidth).toHaveBeenCalledWith(Math.min(420,f.width-40));
    expect(view.y).toBeLessThan(height-run.layout.tray);
    expect(view.y-28).toBeGreaterThan(f.y+60);
    expect(view.setDepth).toHaveBeenCalledWith(1400);
  });
  it('replaces one notice, preserves its lifetime on redraw, and expires only with game time', () => {
    const { run, views } = fixture();
    run.gameTimeMs = 1000; run.showCampaignCallout('Armor broken');
    run.gameTimeMs = 1200; run.showCampaignCallout('Core exposed');
    expect(views[0].destroy).toHaveBeenCalledOnce();
    expect(run.campaignCallout.until).toBe(4200);
    run.gameTimeMs = 2200; run.layout = gameLayout(1024,768); run.drawCampaignCallout();
    expect(views[1].destroy).toHaveBeenCalledOnce(); expect(run.campaignCallout.until).toBe(4200);
    run.paused = true; run.updateCampaignCallout(); run.updateCampaignCallout();
    expect(run.campaignCallout.text).toBe('Core exposed');
    run.gameTimeMs = 4199; run.updateCampaignCallout(); expect(run.campaignCallout).not.toBeNull();
    run.gameTimeMs = 4200; run.updateCampaignCallout();
    expect(run.campaignCallout).toBeNull(); expect(run.campaignCalloutView).toBeNull(); expect(views[2].destroy).toHaveBeenCalledOnce();
  });
  it('destroys the notice during settlement/quit cleanup and resets it for restart', () => {
    const { run, views } = fixture(); run.showCampaignCallout('Shield raised'); run.syncFieldViews = () => {};
    run.cleanupProgression(); expect(views[0].destroy).toHaveBeenCalledOnce(); expect(run.campaignCallout).toBeNull();
    run.showCampaignCallout('Core exposed'); run.init({ difficulty: 'medium' });
    expect(run.campaignCallout).toBeNull(); expect(run.campaignCalloutView).toBeNull();
  });
  it.each([[844,390],[390,844]])('separates campaign boss identity from phase and HP at %ix%i', (width,height) => {
    const { run } = fixture(width,height);
    run.campaign = {}; run.campaignBosses = { phase: () => 3 };
    run.bossBarText = { setText: vi.fn() }; run.bossBarHp = { setText: vi.fn() };
    for (const [id,name] of [['hollow_warden','The Hollow Warden'],['cinder_colossus','Cinder Colossus'],['frostbound_matriarch','Frostbound Matriarch']]) {
      run.enemies = [{ id: 1,campaignId: id,name,alive: true,isBoss: true,hp: 24,maxHp: 100 }];
      run.updateBossBar();
      expect(run.bossBarText.setText).toHaveBeenLastCalledWith(name);
      expect(run.bossBarHp.setText).toHaveBeenLastCalledWith('HP 24% · Phase 3');
    }
    run.campaign = null; run.updateBossBar();
    expect(run.bossBarText.setText).toHaveBeenLastCalledWith('Frostbound Matriarch');
    expect(run.bossBarHp.setText).toHaveBeenLastCalledWith('HP 24% · Enraged');
  });
});
