import { afterEach, describe, expect, it, vi } from 'vitest';
import { CampaignBossSystem, CAMPAIGN_BOSS_TUNING } from '../src/game/campaign/bosses.ts';
import { CAMPAIGN_BATTLE_TUNING } from '../src/game/campaign/battle.ts';
import { getCampaignEnemy } from '../src/game/campaign/enemies.ts';
import { Enemy } from '../src/game/entities/Enemy.ts';
import { Tower } from '../src/game/entities/Tower.ts';
import { GameScene } from '../src/game/scenes/GameScene.ts';
import { CampaignRepository, campaignRepository } from '../src/game/campaign/progress.ts';
import { SoundManager } from '../src/game/systems/SoundManager.ts';
import type { CampaignSpecializationId } from '../src/game/campaign/types.ts';

vi.mock('phaser', () => ({ default: { Scene: class { constructor(_key?: string) {} }, Scenes: { Events: { SHUTDOWN: 'shutdown' } }, Scale: { Events: { RESIZE: 'resize' } } } }));

afterEach(() => vi.restoreAllMocks());

function anyStub(): any {
  const proxy: any = new Proxy(function () { return proxy; }, {
    get: (_target, key) => key === 'then' ? undefined : key === Symbol.toPrimitive ? () => 0 : proxy,
    apply: () => proxy
  });
  return proxy;
}

function campaignEnemy(id: string): Enemy {
  const cfg = getCampaignEnemy(id);
  const enemy = new Enemy(cfg.visualArchetype, cfg.baseHp, cfg.baseSpeed, cfg.baseReward, cfg);
  enemy.campaignId = id;
  enemy.slowResistance = cfg.slowResistance;
  return enemy;
}

const slow = { slowFactor: 0.5, frozen: false, stunned: false, vulnerability: 1 };

function sceneFixture(): any {
  const repository = new CampaignRepository(null);
  for (let level = 1; level <= 30; level++) repository.recordClear(level, 100000, 20);
  vi.spyOn(campaignRepository, 'view').mockImplementation(() => repository.view());
  vi.spyOn(campaignRepository, 'recordClear').mockImplementation(() => null as never);
  vi.spyOn(SoundManager, 'get').mockReturnValue(anyStub());
  const run: any = new GameScene();
  run.init({ mode: 'campaign', campaignLevel: 1 });
  for (const key of ['updateHUD','refreshInfoPanel','refreshPlots','refreshPlacePanel','hideGhost','floatText','floatTextForEnemy','impactAt','impactBurst','startDeathAnim','makeEnemyVisual','addEffect','drawAchievementNotice','renderCampaignResult','renderFrame','updateBossBar','updateDying','updateEffects','syncFieldViews','presentReward']) run[key] = () => {};
  run.add = anyStub();
  run.world = (value: unknown) => value;
  run.scene = { start: vi.fn(), restart: vi.fn() };
  return run;
}

function at(x: number, y = 0, hp = 100000): Enemy {
  const enemy = new Enemy('thornling', hp, 0, 8);
  enemy.x = x; enemy.y = y;
  return enemy;
}

function fired(towerId: Tower['towerId'], specialization: CampaignSpecializationId | null, targetX = 100): { run: any; tower: Tower; target: Enemy; shot: any } {
  const run = sceneFixture(), tower = new Tower(towerId, 0, 0, 0), target = at(targetX);
  tower.specialization = specialization;
  run.towers = [tower]; run.enemies = [target]; run.fireProjectile = vi.fn();
  run.fireTowers(0);
  return { run, tower, target, shot: run.fireProjectile.mock.calls[0]?.[3] };
}

function flight(shot: any, target: Enemy): any {
  return { elapsedMs: 0, durationMs: 0, x1: 0, y1: 0, x2: target.x, y2: target.y, towerId: shot.towerId, targetId: target.id, shot, view: anyStub(), chainIndex: 0, hit: new Set<number>() };
}

describe('independent campaign boss and support boundaries', () => {
  it('applies support only inside its radius and expires the speed buff at its game-time deadline', () => {
    const system = new CampaignBossSystem(), caller = campaignEnemy('ashcaller');
    const inside = campaignEnemy('icebound'), edge = campaignEnemy('icebound'), outside = campaignEnemy('icebound');
    edge.x = CAMPAIGN_BATTLE_TUNING.supportRadius;
    outside.x = CAMPAIGN_BATTLE_TUNING.supportRadius + 0.01;
    system.register(caller, 0);

    expect(system.tick([caller, inside, edge, outside], [], CAMPAIGN_BATTLE_TUNING.supportIntervalMs - 1)).toHaveLength(0);
    expect([inside.speedBuffUntil, edge.speedBuffUntil, outside.speedBuffUntil]).toEqual([0, 0, 0]);
    const events = system.tick([caller, inside, edge, outside], [], CAMPAIGN_BATTLE_TUNING.supportIntervalMs);
    expect(events).toHaveLength(1);
    expect(inside.speedBuffUntil).toBeGreaterThan(CAMPAIGN_BATTLE_TUNING.supportIntervalMs);
    expect(edge.speedBuffUntil).toBe(inside.speedBuffUntil);
    expect(outside.speedBuffUntil).toBe(0);
    const until = inside.speedBuffUntil;
    expect(inside.effectiveSpeed(until - 1, 0, slow)).toBeCloseTo(inside.baseSpeed * 0.5 * 1.22);
    expect(inside.effectiveSpeed(until, 0, slow)).toBeCloseTo(inside.baseSpeed * 0.5);
  });

  it('applies and expires the Shaman slow-resistance ward without changing an unbuffed ally', () => {
    const system = new CampaignBossSystem(), shaman = campaignEnemy('frost_shaman'), ally = campaignEnemy('icebound');
    const outside = campaignEnemy('icebound'); outside.x = CAMPAIGN_BATTLE_TUNING.supportRadius + 1;
    system.register(shaman, 0);
    system.tick([shaman, ally, outside], [], CAMPAIGN_BATTLE_TUNING.supportIntervalMs);
    const until = ally.slowResistanceUntil;
    expect(until).toBeGreaterThan(CAMPAIGN_BATTLE_TUNING.supportIntervalMs);
    expect(ally.effectiveSpeed(until - 1, 0, slow)).toBeCloseTo(ally.baseSpeed * 0.7);
    expect(ally.effectiveSpeed(until, 0, slow)).toBeCloseTo(ally.baseSpeed * 0.5);
    expect(outside.slowResistanceUntil).toBe(0);
  });

  it('keeps the Warden summon at half HP, enrage strictly below one quarter, and guard temporary', () => {
    const system = new CampaignBossSystem(), boss = campaignEnemy('hollow_warden');
    system.register(boss, 0);
    system.tick([boss], [], 0);
    expect(boss.damageTakenMultiplier).toBeLessThan(1);
    system.tick([boss], [], CAMPAIGN_BOSS_TUNING.shieldDurationMs - 1);
    expect(boss.damageTakenMultiplier).toBeLessThan(1);
    system.tick([boss], [], CAMPAIGN_BOSS_TUNING.shieldDurationMs);
    expect(boss.damageTakenMultiplier).toBe(1);

    boss.hp = boss.maxHp * 0.5001;
    expect(system.tick([boss], [], 3000).some(event => event.summon)).toBe(false);
    boss.hp = boss.maxHp * 0.5;
    expect(system.tick([boss], [], 3001).filter(event => event.summon)).toHaveLength(1);
    expect(system.tick([boss], [], 3002).some(event => event.summon)).toBe(false);
    boss.hp = boss.maxHp * 0.25;
    system.tick([boss], [], 3500);
    expect(boss.bossSpeedMultiplier).toBe(1);
    boss.hp = boss.maxHp * 0.249;
    system.tick([boss], [], 3501);
    expect(boss.bossSpeedMultiplier).toBeGreaterThan(1);
  });

  it('changes Colossus armor and speed at the authored phase edges and applies core vulnerability to real damage', () => {
    const system = new CampaignBossSystem(), boss = campaignEnemy('cinder_colossus');
    system.register(boss, 0);
    boss.hp = boss.maxHp * 0.6501;
    system.tick([boss], [], 0);
    expect([boss.physicalArmor, boss.bossSpeedMultiplier]).toEqual([0.65, 1]);
    boss.hp = boss.maxHp * 0.65;
    system.tick([boss], [], 1);
    expect([boss.physicalArmor, boss.bossSpeedMultiplier]).toEqual([0.32, 1.2]);
    boss.hp = boss.maxHp * 0.3001;
    system.tick([boss], [], 2);
    expect(boss.bossSpeedMultiplier).toBe(1.2);
    boss.hp = boss.maxHp * 0.3;
    system.tick([boss], [], 3);
    expect([boss.physicalArmor, boss.wardArmor, boss.bossSpeedMultiplier, boss.damageTakenMultiplier]).toEqual([0.08, 0, 1.4, 1.3]);

    const run = sceneFixture(), combatBoss = run.spawnEnemy('cinder_colossus', 1);
    combatBoss.physicalArmor = combatBoss.wardArmor = 0;
    const normalHit = run.damageEnemy(combatBoss, 100, 'physical');
    combatBoss.hp = combatBoss.maxHp * 0.3;
    run.campaignBosses.tick([combatBoss], [], 1);
    combatBoss.physicalArmor = combatBoss.wardArmor = 0;
    expect(run.damageEnemy(combatBoss, 100, 'physical')).toBe(Math.round(normalHit * 1.3));
  });

  it('telegraphs one then two nearest Matriarch targets before freezing them for a temporary window', () => {
    const system = new CampaignBossSystem(), boss = campaignEnemy('frostbound_matriarch');
    const towers = [new Tower('longbow', 10, 0, 0), new Tower('starfire', 20, 0, 1), new Tower('ember', 30, 0, 2)];
    boss.x = boss.y = 0;
    system.register(boss, 0);
    expect(system.tick([boss], towers, CAMPAIGN_BOSS_TUNING.freezeIntervalMs - 1)).toHaveLength(0);
    system.tick([boss], towers, CAMPAIGN_BOSS_TUNING.freezeIntervalMs);
    expect(system.telegraphTargets()).toEqual([towers[0].id]);
    system.tick([boss], towers, CAMPAIGN_BOSS_TUNING.freezeIntervalMs + CAMPAIGN_BOSS_TUNING.freezeTelegraphMs - 1);
    expect(towers[0].frozenUntil).toBe(0);
    const firstFreezeAt = CAMPAIGN_BOSS_TUNING.freezeIntervalMs + CAMPAIGN_BOSS_TUNING.freezeTelegraphMs;
    system.tick([boss], towers, firstFreezeAt);
    expect(towers[0].frozenUntil).toBe(firstFreezeAt + CAMPAIGN_BOSS_TUNING.towerFreezeMs);
    expect(towers[0].frozenUntil).toBeGreaterThan(firstFreezeAt);

    boss.hp = boss.maxHp * 0.5;
    const next = CAMPAIGN_BOSS_TUNING.freezeIntervalMs * 2;
    expect(system.tick([boss], towers, next - 1)).toHaveLength(0);
    system.tick([boss], towers, next);
    expect(system.telegraphTargets()).toEqual(towers.slice(0, 2).map(tower => tower.id));
    system.tick([boss], towers, next + CAMPAIGN_BOSS_TUNING.freezeTelegraphMs);
    expect(towers.slice(0, 2).every(tower => tower.frozenUntil === next + CAMPAIGN_BOSS_TUNING.freezeTelegraphMs + CAMPAIGN_BOSS_TUNING.towerFreezeMs)).toBe(true);
    expect(boss.effectiveSpeed(0, 0, { ...slow, slowFactor: 1 })).toBeCloseTo(boss.baseSpeed * 0.6);
  });
});

describe('specializations reach live combat', () => {
  it('uses Longbow Bastion reach and heavier slower shots while Repeater trades reach and damage for cadence', () => {
    const normal = fired('longbow', null), bastion = fired('longbow', 'longbow_bastion'), repeater = fired('longbow', 'repeater_tower');
    expect(bastion.shot.rawDamage).toBeGreaterThan(normal.shot.rawDamage);
    expect(bastion.tower.cooldown).toBeGreaterThan(normal.tower.cooldown);
    expect(bastion.tower.stats.range).toBeGreaterThan(normal.tower.stats.range);
    expect(repeater.shot.rawDamage).toBeLessThan(normal.shot.rawDamage);
    expect(repeater.tower.cooldown).toBeLessThan(normal.tower.cooldown);
    expect(repeater.tower.stats.range).toBeLessThan(normal.tower.stats.range);

    expect(fired('longbow', null, 160).shot).toBeUndefined();
    expect(fired('longbow', 'longbow_bastion', 160).shot).toBeDefined();
    expect(fired('longbow', 'repeater_tower', 140).shot).toBeUndefined();
  });

  it('uses Siege Mortar radius in splash impacts and Ember Cannon creates a damage-ticking field', () => {
    const normal = fired('ember', null), mortar = fired('ember', 'siege_mortar');
    expect(mortar.shot.stats.splashRadius).toBeGreaterThan(normal.shot.stats.splashRadius);
    expect(mortar.tower.cooldown).toBeGreaterThan(normal.tower.cooldown);

    const splashRun = mortar.run, primary = mortar.target, secondary = at(primary.x + normal.shot.stats.splashRadius + 1, primary.y);
    splashRun.enemies = [primary, secondary];
    splashRun.flights.push(flight(mortar.shot, primary));
    splashRun.updateFlights(0);
    expect(secondary.hp).toBeLessThan(secondary.maxHp);

    const cannon = fired('ember', 'ember_cannon');
    expect(cannon.shot.rawDamage).toBeLessThan(fired('ember', null).shot.rawDamage);
    expect(cannon.shot.stats.splashRadius).toBeLessThan(fired('ember', null).shot.stats.splashRadius);
    cannon.run.flights.push(flight(cannon.shot, cannon.target));
    cannon.run.updateFlights(0);
    expect(cannon.run.evolutionCombat.activeFieldCount).toBeGreaterThan(0);
    const before = cannon.target.hp;
    cannon.run.gameTimeMs = 500;
    cannon.run.processFieldTicks();
    expect(cannon.target.hp).toBeLessThan(before);
  });

  it('applies Glacial Spire chill on a live hit and Aether Obelisk damage, reach, and cadence changes', () => {
    const glacier = fired('glacier', 'glacial_spire');
    glacier.run.flights.push(flight(glacier.shot, glacier.target));
    glacier.run.updateFlights(0);
    expect(glacier.run.evolutionCombat.statuses(glacier.target.id, glacier.run.gameTimeMs).slowFactor).toBeGreaterThan(0.35);

    const normal = fired('starfire', null), obelisk = fired('starfire', 'aether_obelisk');
    expect(obelisk.shot.rawDamage).toBeGreaterThan(normal.shot.rawDamage);
    expect(obelisk.tower.cooldown).toBeGreaterThan(normal.tower.cooldown);
    expect(obelisk.tower.stats.range).toBeLessThan(normal.tower.stats.range);
    expect(fired('starfire', null, 140).shot).toBeDefined();
    expect(fired('starfire', 'aether_obelisk', 140).shot).toBeUndefined();
  });

  it('applies Thunder Crown’s heavier primary and weaker secondary damage through flight resolution', () => {
    const base = fired('tempest', null), crown = fired('tempest', 'thunder_crown');
    expect(crown.shot.rawDamage).toBeGreaterThan(base.shot.rawDamage);
    expect(crown.shot.stats.chainCount).toBeLessThan(base.shot.stats.chainCount);
    const secondary = { ...crown.shot, primary: false };
    crown.run.flights.push({ ...flight(secondary, crown.target), chainIndex: 1 });
    crown.run.updateFlights(0);
    expect(crown.target.maxHp - crown.target.hp).toBe(Math.round(crown.shot.rawDamage * 0.75 * 0.75));
  });
});
