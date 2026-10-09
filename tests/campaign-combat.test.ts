import { afterEach, describe, expect, it, vi } from 'vitest';
import { CAMPAIGN_LEVELS } from '../src/game/campaign/config.ts';
import { CampaignBattle, campaignTowerStats, specializeShot } from '../src/game/campaign/battle.ts';
import { CampaignRepository } from '../src/game/campaign/progress.ts';
import { CAMPAIGN_ROUTES, distanceToRoute } from '../src/game/campaign/maps.ts';
import { CAMPAIGN_ENEMIES, getCampaignEnemy } from '../src/game/campaign/enemies.ts';
import { CampaignBossSystem, CAMPAIGN_BOSS_TUNING } from '../src/game/campaign/bosses.ts';
import { Tower } from '../src/game/entities/Tower.ts';
import { Enemy } from '../src/game/entities/Enemy.ts';
import { EvolutionCombat } from '../src/game/systems/EvolutionCombat.ts';
import { ENEMIES } from '../src/game/config/enemies.ts';
import { CAMPAIGN_SPECIALIZATIONS } from '../src/game/campaign/specializations.ts';

afterEach(() => vi.restoreAllMocks());

function repository(through = 30): CampaignRepository {
  const repo = new CampaignRepository(null);
  for (let level = 1; level <= through; level++) repo.recordClear(level, 100000, 20);
  return repo;
}
function campaignEnemy(id: string): Enemy {
  const cfg = getCampaignEnemy(id), enemy = new Enemy(cfg.visualArchetype, cfg.baseHp, cfg.baseSpeed, cfg.baseReward, cfg);
  enemy.campaignId = id; enemy.slowResistance = cfg.slowResistance; return enemy;
}
const slow = { slowFactor: 0.5, frozen: false, stunned: false, vulnerability: 1 };

describe('campaign combat profiles', () => {
  it('rejects locked, malformed, and forged unlock starts', () => {
    const view = new CampaignRepository(null).view();
    for (const level of [0, 2, 31, 1.5, NaN]) expect(() => new CampaignBattle(level, view)).toThrow();
    expect(() => new CampaignBattle(2, { ...view, highestUnlockedLevel: 30 })).toThrow();
    expect(new CampaignBattle(1, view).definition.level).toBe(1);
  });
  it('snapshots sidegrades, targeting, visual tier and relic gates once', () => {
    const repo = repository(15);
    repo.setSpecialization('longbow', 'repeater_tower'); repo.setPreparationTargeting('longbow', 'strongest');
    const battle = new CampaignBattle(1, repo.view());
    repo.setSpecialization('longbow', 'longbow_bastion'); repo.setPreparationTargeting('longbow', 'last');
    expect([battle.choices.longbow, battle.targeting.longbow, battle.visualTier]).toEqual(['repeater_tower', 'strongest', 2]);
    expect(battle.powerUpPool).toContain('meteor_strike'); expect(battle.powerUpPool).not.toContain('battle_cry'); expect(battle.powerUpPool).not.toContain('time_freeze');
    expect(new CampaignBattle(1, repository(20).view()).visualTier).toBe(3);
    expect(new CampaignBattle(1, new CampaignRepository(null).view()).powerUpPool).not.toContain('meteor_strike');
  });
  it('uses twelve route families with safe build zones and authored variants', () => {
    expect(Object.keys(CAMPAIGN_ROUTES)).toHaveLength(12);
    expect(new Set(Object.values(CAMPAIGN_ROUTES).map(route => JSON.stringify(route))).size).toBe(12);
    const view = repository().view();
    for (const level of CAMPAIGN_LEVELS) {
      const battle = new CampaignBattle(level.level, view), map = battle.map;
      expect(map.id).toBe(level.mapLayoutId); expect(map.waypoints[0]).toEqual(map.spawn); expect(map.waypoints[map.waypoints.length - 1]).toEqual(map.gate);
      expect(map.buildable.length).toBeGreaterThanOrEqual(8);
      for (const point of [...map.waypoints, ...map.buildable]) { expect(point.x).toBeGreaterThanOrEqual(0); expect(point.x).toBeLessThanOrEqual(1040); expect(point.y).toBeGreaterThanOrEqual(56); expect(point.y).toBeLessThanOrEqual(640); }
      for (const point of map.buildable) expect(distanceToRoute(point, map.waypoints)).toBeGreaterThanOrEqual(46);
      const spawns = Array.from({ length: battle.waveCount }, (_, i) => battle.wave(i + 1)).flatMap(w => w.spawns);
      for (const spawn of spawns) { expect(CAMPAIGN_ENEMIES[spawn.enemyId]).toBeDefined(); expect(spawn.hpBonus).toBeGreaterThan(0); }
      expect(spawns.filter(s => getCampaignEnemy(s.enemyId).isBoss).map(s => s.enemyId)).toEqual(level.bossEnemyId ? [level.bossEnemyId] : []);
      for (let wave = 1; wave <= battle.waveCount; wave++) {
        const queue = battle.wave(wave).spawns;
        expect(queue).toEqual([...queue].sort((a, b) => a.atMs - b.atMs));
      }
    }
    expect(new CampaignBattle(1, view).map.waypoints).not.toEqual(new CampaignBattle(2, view).map.waypoints);
  });
  it('only settles the final fully resolved battle with its boss killed and lives intact', () => {
    const battle = new CampaignBattle(10, repository().view());
    expect(battle.readyToClear(battle.waveCount, 20, 0)).toBe(false);
    battle.bossKilled = true;
    expect(battle.readyToClear(battle.waveCount, 20, 0)).toBe(true);
    for (const [wave, lives, unresolved] of [[battle.waveCount - 1,20,0],[battle.waveCount,0,0],[battle.waveCount,20,1]]) expect(battle.readyToClear(wave,lives,unresolved)).toBe(false);
    battle.settled = true; expect(battle.readyToClear(battle.waveCount,20,0)).toBe(false);
  });
  it('rerolls one random reveal per attempt to a different unlocked relic', () => {
    const battle = new CampaignBattle(1, repository(15).view());
    expect(battle.reroll('gold_rush', false)).toBeNull();
    const replacement = battle.reroll('gold_rush', true, () => 0);
    expect(replacement).not.toBe('gold_rush'); expect(battle.powerUpPool).toContain(replacement);
    expect(battle.reroll(replacement!, true)).toBeNull();
    expect(new CampaignBattle(1, repository(15).view()).canReroll(true)).toBe(true);
    expect(new CampaignBattle(1, repository(14).view()).reroll('gold_rush', true)).toBeNull();
    const locked = new CampaignBattle(1, new CampaignRepository(null).view());
    for (let n = 0; n < 100; n++) expect(['meteor_strike','battle_cry','time_freeze']).not.toContain(locked.rollReward(() => n / 100));
  });
});

describe('campaign sidegrades', () => {
  it.each(CAMPAIGN_SPECIALIZATIONS)('$id transforms its tower stats without changing classic base stats', specialization => {
    const tower = new Tower(specialization.towerId,0,0,0), base = tower.stats;
    tower.specialization = specialization.id;
    expect(tower.stats).toEqual(campaignTowerStats(base, specialization.id));
    expect(tower.stats).not.toEqual(base);
    expect(new Tower(specialization.towerId,0,0,0).stats).toEqual(base);
    expect(tower.stats.attackInterval).toBeGreaterThan(0);
  });
  it('captures specialty damage and creates a short burn that drains before settlement', () => {
    const tower = new Tower('ember',0,0,0); tower.specialization = 'ember_cannon';
    const combat = new EvolutionCombat(), shot = specializeShot(combat.makeShot(tower,[tower],1,true,tower.stats),tower.specialization);
    tower.specialization = 'siege_mortar';
    expect(shot.stats.splashRadius).toBeCloseTo(55 * 0.78);
    combat.addField(shot,0,0,0,shot.specialization?.burnDurationMs,shot.specialization?.burnDamageMultiplier);
    expect(combat.activeFieldCount).toBe(1);
    expect(combat.tickFields(1000).reduce((total,tick) => total + tick.rawDamage,0)).toBeCloseTo(shot.rawDamage * 0.12 * 2);
    expect(combat.activeFieldCount).toBe(0);
  });
});

describe('campaign support and bosses', () => {
  it('supports speed and slow-resistance buffs, with expiry and slow-resistant knights', () => {
    const system = new CampaignBossSystem(), caller = campaignEnemy('ashcaller'), shaman = campaignEnemy('frost_shaman'), ally = campaignEnemy('icebound'), knight = campaignEnemy('glacier_knight');
    system.register(caller,0); system.register(shaman,0);
    system.tick([caller,shaman,ally],[ ],5500);
    expect(ally.effectiveSpeed(5500,0,slow)).toBeCloseTo(70 * 0.7 * 1.22);
    expect(ally.effectiveSpeed(7700,0,slow)).toBeCloseTo(70 * 0.5);
    expect(knight.effectiveSpeed(5500,0,slow)).toBeCloseTo(57 * 0.75);
    expect(ally.effectiveSpeed(5500,6000,slow)).toBe(0);
  });
  it('Warden guards temporarily, summons once near half HP, then enrages below 25%', () => {
    const system = new CampaignBossSystem(), boss = campaignEnemy('hollow_warden'); system.register(boss,0);
    system.tick([boss],[],0); expect(boss.damageTakenMultiplier).toBe(0.55);
    system.tick([boss],[],2500); expect(boss.damageTakenMultiplier).toBe(1);
    boss.hp = boss.maxHp / 2;
    expect(system.tick([boss],[],3000).filter(event => event.summon)).toHaveLength(1);
    expect(system.tick([boss],[],3500).filter(event => event.summon)).toHaveLength(0);
    boss.hp = boss.maxHp * 0.24; system.tick([boss],[],4000);
    expect(boss.bossSpeedMultiplier).toBe(1.2); expect(system.phase(boss.id)).toBe(3);
    system.tick([boss],[],8000); expect(boss.damageTakenMultiplier).toBe(0.55);
    expect(ENEMIES.warlord.regenPerSecond).toBe(10); expect(boss.regen).toBe(0);
  });
  it('Colossus irreversibly breaks armor, gains speed, and exposes its core', () => {
    const system = new CampaignBossSystem(), boss = campaignEnemy('cinder_colossus'); system.register(boss,0);
    system.tick([boss],[],0); expect(boss.physicalArmor).toBe(0.65);
    boss.hp = boss.maxHp * 0.6; expect(system.tick([boss],[],1000)[0].text).toContain('Armor broken');
    expect([boss.physicalArmor,boss.bossSpeedMultiplier]).toEqual([0.32,1.2]);
    boss.hp = boss.maxHp * 0.25; system.tick([boss],[],2000);
    expect([boss.physicalArmor,boss.wardArmor,boss.bossSpeedMultiplier,boss.damageTakenMultiplier]).toEqual([0.08,0,1.4,1.3]);
    boss.hp = boss.maxHp; system.tick([boss],[],3000); expect(system.phase(boss.id)).toBe(3);
  });
  it('Matriarch telegraphs then freezes one tower, later two, and expires in game time', () => {
    const system = new CampaignBossSystem(), boss = campaignEnemy('frostbound_matriarch');
    const towers = [new Tower('longbow',10,0,0),new Tower('starfire',20,0,1),new Tower('ember',30,0,2)];
    system.register(boss,0); system.tick([boss],towers,7500);
    expect(system.telegraphTargets()).toEqual([towers[0].id]); expect(towers[0].frozenUntil).toBe(0);
    system.tick([boss],towers,8999); expect(towers[0].frozenUntil).toBe(0);
    system.tick([boss],towers,9000); expect(towers[0].frozenUntil).toBe(12000); expect(system.telegraphTargets()).toHaveLength(0);
    boss.hp = boss.maxHp * 0.4; system.tick([boss],towers,15000);
    expect(system.telegraphTargets()).toEqual(towers.slice(0,2).map(t => t.id));
    system.tick([boss],towers,16500); expect(towers.slice(0,2).map(t => t.frozenUntil)).toEqual([19500,19500]);
    expect(boss.effectiveSpeed(16500,0,slow)).toBeCloseTo(boss.baseSpeed * 0.8);
    system.clear(); expect(system.telegraphTargets()).toHaveLength(0); expect(system.phase(boss.id)).toBe(1);
    expect(CAMPAIGN_BOSS_TUNING.towerFreezeMs).toBeLessThan(CAMPAIGN_BOSS_TUNING.freezeIntervalMs);
  });
});
