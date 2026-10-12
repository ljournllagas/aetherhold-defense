import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameScene } from '../src/game/scenes/GameScene.ts';
import { CAMPAIGN_BOSS_TUNING, type CampaignBossPhaseLabel } from '../src/game/campaign/bosses.ts';
import { getCampaignEnemy } from '../src/game/campaign/enemies.ts';
import { Enemy } from '../src/game/entities/Enemy.ts';
import { SoundManager } from '../src/game/systems/SoundManager.ts';

vi.mock('phaser', () => ({
  default: {
    Scene: class { constructor(_key?: string) {} },
    Scenes: { Events: { SHUTDOWN: 'shutdown' } },
    Math: { Vector2: class { constructor(public x: number, public y: number) {} } }
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
  'updateEffects', 'syncFieldViews', 'addEffect', 'drawTempestArc', 'drawAchievementNotice',
  'renderFrame', 'closeModal'
];

function qaRun(label: CampaignBossPhaseLabel, level: number): any {
  const run: any = new GameScene();
  run.init({
    mode: 'campaign', campaignLevel: level,
    qaCampaignFixture: { state: 'campaign-boss', level, bossPhase: label }
  });
  for (const name of PRESENTATION) run[name] = () => {};
  run.add = anyStub(); run.world = (value: unknown) => value;
  run.events = { emit: vi.fn(), on: vi.fn(), off: vi.fn() };
  run.input = { listenerCount: () => 0, keyboard: null };
  run.tweens = { getTweens: () => [] };
  run.scene = { start: vi.fn(), restart: vi.fn() };
  run.makeEnemyVisual = () => {};
  return run;
}

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('campaign named fixture scene integration', () => {
  const supportFixtures = [
    ['aether_shield', 'aetherbound', 'tideborn', 50, true],
    ['foundry_armor', 'foundry_core', 'scrapling', 60, true],
    ['tempest_haste', 'tempest_herald', 'galeclaw', 70, false],
    ['echo_decoys', 'echo_shade', null, 80, false],
    ['rift_jump', 'rift_weaver', null, 90, false],
    ['crown_ward', 'crown_archon', 'aetherborn', 100, true]
  ] as const;

  it.each(supportFixtures)('seeds %s on its actual campaign support entity', (label, supportId, allyId, level, allyGuarded) => {
    vi.spyOn(SoundManager, 'get').mockReturnValue(anyStub());
    const run = qaRun(label, level);
    run.seedQACampaignFixture();
    const support = run.enemies.find((enemy: Enemy) => enemy.campaignId === supportId) as Enemy | undefined;
    expect(support).toBeDefined();
    expect(support!.isBoss).toBe(false);
    const presentation = run.campaignBosses.presentation(support!.id, run.gameTimeMs);
    expect(presentation.phaseLabel).toBe(label);
    if (label === 'tempest_haste' || label === 'echo_decoys' || label === 'rift_jump') expect(presentation.telegraph).toBe(true);
    if (allyId) {
      const ally = run.enemies.find((enemy: Enemy) => enemy.campaignId === allyId) as Enemy | undefined;
      expect(ally).toBeDefined();
      expect(run.campaignBosses.presentation(ally!.id, run.gameTimeMs).guarded).toBe(allyGuarded);
      if (label === 'tempest_haste') expect(ally!.speedBuffUntil).toBe(0);
    }
    const status = run.events.emit.mock.calls.at(-1)![1] as { campaignBoss: { id: string; phaseLabel?: string } };
    expect(status.campaignBoss).toMatchObject({ id: supportId, phaseLabel: label });
  });

  const warningFixtures = [
    ['oracle_arcane', 50, 'drowned_oracle', 1, 'physical', 'Drowned Oracle · Arcane resistance forming'],
    ['oracle_elemental', 50, 'drowned_oracle', 2, 'arcane', 'Drowned Oracle · Elemental resistance forming'],
    ['tyrant_break', 60, 'iron_tyrant', 1, null, 'Iron Tyrant · Armor plates fracturing'],
    ['tyrant_core', 60, 'iron_tyrant', 2, null, 'Iron Tyrant · Core exposure imminent'],
    ['regent_decoys', 80, 'umbral_regent', 1, null, 'Umbral Regent · Echoes forming']
  ] as const;

  it.each(warningFixtures)('seeds %s as a pre-effect boss warning', (label, level, bossId, phase, resistanceType, warning) => {
    vi.spyOn(SoundManager, 'get').mockReturnValue(anyStub());
    const run = qaRun(label, level);
    run.seedQACampaignFixture();
    const boss = run.enemies.find((enemy: Enemy) => enemy.campaignId === bossId) as Enemy;
    expect(boss).toBeDefined();
    expect(run.campaignBosses.presentation(boss.id, run.gameTimeMs)).toMatchObject({
      phase, telegraph: true, phaseLabel: label, ...(resistanceType ? { resistanceType } : {})
    });
    expect(run.campaignCallout?.text).toBe(warning);
    if (bossId === 'drowned_oracle') {
      expect(run.campaignBosses.incomingDamageMultiplier(boss.id, resistanceType as 'physical' | 'arcane', run.gameTimeMs)).toBe(CAMPAIGN_BOSS_TUNING.oracleResistanceMultiplier);
      expect(run.campaignBosses.incomingDamageMultiplier(boss.id, label === 'oracle_arcane' ? 'arcane' : 'elemental', run.gameTimeMs)).toBe(1);
    }
    if (bossId === 'iron_tyrant') {
      expect([boss.physicalArmor, boss.wardArmor, boss.bossSpeedMultiplier, boss.damageTakenMultiplier]).toEqual(
        phase === 1 ? [0.65, 0.35, 1, 1] : [0.32, 0.18, 1.2, 1]
      );
    }
    if (bossId === 'umbral_regent') {
      expect(run.enemies.filter((enemy: Enemy) => enemy.campaignCloneKind === 'regent_echo')).toHaveLength(0);
    }
  });

  it('cleans owned Regent echoes when the real boss dies without leaving clone rewards behind', () => {
    vi.spyOn(SoundManager, 'get').mockReturnValue(anyStub());
    const run = qaRun('regent_decoys', 80);
    run.seedQACampaignFixture();
    const boss = run.enemies.find((enemy: Enemy) => enemy.campaignId === 'umbral_regent') as Enemy;
    expect(run.campaignBosses.presentation(boss.id, run.gameTimeMs)).toMatchObject({ phase: 1, telegraph: true, phaseLabel: 'regent_decoys' });
    expect(run.enemies.filter((enemy: Enemy) => enemy.campaignCloneKind === 'regent_echo')).toHaveLength(0);
    run.gameTimeMs += CAMPAIGN_BOSS_TUNING.bossTransitionTelegraphMs;
    run.tickCampaignBosses();
    const clones = run.enemies.filter((enemy: Enemy) => enemy.campaignCloneKind === 'regent_echo') as Enemy[];
    expect(clones).toHaveLength(2);
    expect(clones.every(clone => clone.reward === 0 && clone.campaignBossOwnerId === boss.id)).toBe(true);

    run.killEnemy(boss);
    expect(boss.alive).toBe(false);
    expect(run.enemies).not.toEqual(expect.arrayContaining(clones));
    expect(clones.every(clone => !clone.alive)).toBe(true);
    expect(run.campaignBosses.presentation(boss.id, run.gameTimeMs)).toEqual({ phase: 1, telegraph: false, guarded: false });
  });

  it('does not summon Regent echoes after the boss dies during its warning', () => {
    vi.spyOn(SoundManager, 'get').mockReturnValue(anyStub());
    const run = qaRun('regent_decoys', 80);
    run.seedQACampaignFixture();
    const boss = run.enemies.find((enemy: Enemy) => enemy.campaignId === 'umbral_regent') as Enemy;
    expect(run.campaignBosses.presentation(boss.id, run.gameTimeMs).telegraph).toBe(true);
    run.killEnemy(boss);
    run.gameTimeMs += CAMPAIGN_BOSS_TUNING.bossTransitionTelegraphMs;
    run.tickCampaignBosses();
    expect(run.enemies.filter((enemy: Enemy) => enemy.campaignCloneKind === 'regent_echo')).toHaveLength(0);
    expect(run.campaignBosses.presentation(boss.id, run.gameTimeMs)).toEqual({ phase: 1, telegraph: false, guarded: false });
  });

  it('keeps Sovereign route movement forward-only and below the stronghold guard', () => {
    const run = new GameScene() as any;
    run.map = { waypoints: [ { x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 200, y: 100 } ] };
    const cfg = getCampaignEnemy('rift_sovereign');
    const enemy = new Enemy(cfg.visualArchetype, cfg.baseHp, cfg.baseSpeed, cfg.baseReward, cfg);
    enemy.distanceTraveled = 0; enemy.waypointIndex = 1;
    run.advanceEnemyAlongRoute(enemy, 0.1);
    const firstAdvance = enemy.distanceTraveled;
    expect(firstAdvance).toBeCloseTo(30);
    run.advanceEnemyAlongRoute(enemy, 0.1);
    expect(enemy.distanceTraveled).toBeGreaterThan(firstAdvance);
    expect(enemy.distanceTraveled).toBeLessThanOrEqual(264);
    while (enemy.distanceTraveled < 264) run.advanceEnemyAlongRoute(enemy, 0.1);
    const guardedPosition = { x: enemy.x, y: enemy.y, distanceTraveled: enemy.distanceTraveled, waypointIndex: enemy.waypointIndex };
    run.advanceEnemyAlongRoute(enemy, 0.1);
    expect(enemy).toMatchObject(guardedPosition);

    enemy.distanceTraveled = 264; enemy.x = 164; enemy.y = 100; enemy.waypointIndex = 3;
    run.advanceEnemyAlongRoute(enemy, 0.1);
    expect(enemy.distanceTraveled).toBe(264);
    expect([enemy.x, enemy.y, enemy.waypointIndex]).toEqual([164, 100, 3]);
  });
});
