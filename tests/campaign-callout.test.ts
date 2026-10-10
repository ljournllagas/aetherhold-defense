import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameScene } from '../src/game/scenes/GameScene.ts';
import { gameLayout } from '../src/game/ui/layout.ts';
import { SoundManager } from '../src/game/systems/SoundManager.ts';
import { CampaignBossSystem } from '../src/game/campaign/bosses.ts';
import { CAMPAIGN_BATTLE_TUNING } from '../src/game/campaign/battle.ts';
import type { Enemy } from '../src/game/entities/Enemy.ts';

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
afterEach(() => vi.restoreAllMocks());

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
  it('starts the authored death clip while retaining detached-view cleanup and clip duration', () => {
    const { run } = fixture();
    const visual = { playAction: vi.fn(() => 750) };
    const view = { getData: () => visual };
    const enemy: any = { isBoss: false, view, shadow: null, slowRing: null, hpBar: { clear: vi.fn() }, body: {} };
    run.gameTimeMs = 120;

    run.startDeathAnim(enemy);

    expect(visual.playAction).toHaveBeenCalledWith('death');
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
    for (const [id,name,shortName] of [['hollow_warden','The Hollow Warden','Hollow Warden'],['cinder_colossus','Cinder Colossus','Cinder Colossus'],['frostbound_matriarch','Frostbound Matriarch','Frost Matriarch']]) {
      run.enemies = [{ id: 1,campaignId: id,name,alive: true,isBoss: true,hp: 24,maxHp: 100 }];
      run.updateBossBar();
      expect(run.bossBarText.setText).toHaveBeenLastCalledWith(shortName);
      expect(run.bossBarHp.setText).toHaveBeenLastCalledWith('Phase 3 · HP 24%');
    }
    run.campaign = null; run.updateBossBar();
    expect(run.bossBarText.setText).toHaveBeenLastCalledWith('Frostbound Matriarch · Enraged');
    expect(run.bossBarHp.setText).toHaveBeenLastCalledWith('HP 24%');
  });
});
