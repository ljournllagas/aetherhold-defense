import { afterEach, describe, expect, it, vi } from 'vitest';
import { CAMPAIGN_LEVELS } from '../src/game/campaign/config.ts';
import { CampaignBattle, campaignTowerStats, specializeShot } from '../src/game/campaign/battle.ts';
import { getCampaignWave, getCampaignWaveCount } from '../src/game/campaign/waveProfile.ts';
import { CampaignRepository } from '../src/game/campaign/progress.ts';
import { CAMPAIGN_ROUTES, distanceToRoute } from '../src/game/campaign/maps.ts';
import { CAMPAIGN_ENEMIES, getCampaignEnemy } from '../src/game/campaign/enemies.ts';
import { CampaignBossSystem, CAMPAIGN_BOSS_TUNING } from '../src/game/campaign/bosses.ts';
import { Tower } from '../src/game/entities/Tower.ts';
import { Enemy } from '../src/game/entities/Enemy.ts';
import { EvolutionCombat } from '../src/game/systems/EvolutionCombat.ts';
import { ENEMIES } from '../src/game/config/enemies.ts';
import { CAMPAIGN_SPECIALIZATIONS } from '../src/game/campaign/specializations.ts';
import { campaignScoreMetadata } from '../src/shared/campaignScoring.ts';

afterEach(() => vi.restoreAllMocks());

function repository(through = 30): CampaignRepository {
  const repo = new CampaignRepository(null);
  for (let level = 1; level <= through; level++) repo.recordClear(level, campaignScoreMetadata(level).perfectScore, 20);
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
    for (const level of [0, 2, 31, 101, 1.5, NaN]) expect(() => new CampaignBattle(level, view)).toThrow();
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
  it('uses forty route families with safe build zones and authored variants', () => {
    expect(Object.keys(CAMPAIGN_ROUTES)).toHaveLength(40);
    expect(new Set(Object.values(CAMPAIGN_ROUTES).map(route => JSON.stringify(route))).size).toBe(40);
    const view = repository(100).view();
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
  }, 10_000);
  it('preserves original and World 4 wave counts, then gives Levels 41–100 finite score-bearing wave plans', () => {
    const view = repository(100).view();
    const waveCounts = CAMPAIGN_LEVELS.map(level => new CampaignBattle(level.level, view).waveCount);
    expect(waveCounts.slice(0, 30)).toEqual([5,6,6,7,8,8,9,10,10,10,10,11,12,13,13,14,14,15,15,15,16,16,19,20,18,22,20,20,21,21]);
    const establishedProfile = [16,16,19,20,18,22,20,20,21,21];
    expect(waveCounts.slice(30, 40)).toEqual(establishedProfile);
    expect(waveCounts.slice(40)).toEqual(Array.from({ length: 60 }, (_, index) => 32 + Math.round(index * 20 / 59)));
    expect(waveCounts.slice(40).every((count, index, values) => count >= 32 && count <= 52 && (!index || count >= values[index - 1]))).toBe(true);
    expect(new CampaignBattle(31, view).wave(1).spawns).toHaveLength(7);
    expect(new CampaignBattle(21, view).wave(1).spawns).toHaveLength(10);
  });
  it('matches the captured scheduled spawn IDs and counts across every mission and count multiplier', async () => {
    const view = repository(100).view();
    const enemyIds = [...new Set(CAMPAIGN_LEVELS.flatMap(({ enemyIds: roster, bossEnemyId }) => [...roster, ...(bossEnemyId ? [bossEnemyId] : [])]))].sort();
    const enemyCodes = new Map(enemyIds.map((id, index) => [id, index.toString(36)]));
    const legacyDigests: string[] = [];
    for (const def of CAMPAIGN_LEVELS) {
      const battle = new CampaignBattle(def.level, view);
      const waveCount = getCampaignWaveCount(def.level);
      const waveSignatures = [`${def.level}/${waveCount}`];
      expect(battle.waveCount).toBe(waveCount);
      for (let wave = 1; wave <= waveCount; wave++) {
        for (const multiplier of [0.9, 1, 1.1]) {
          const expected = getCampaignWave(def.level, wave, multiplier);
          expect(battle.wave(wave, multiplier)).toEqual(expected);
          const counts = new Map<string, number>();
          for (const spawn of expected.spawns) counts.set(spawn.enemyId, (counts.get(spawn.enemyId) ?? 0) + 1);
          waveSignatures.push(`${wave}/${multiplier.toFixed(1)}/${Number(expected.isBossWave)}/${[...counts].map(([id, count]) => `${enemyCodes.get(id)}=${count}`).join(',')}`);
        }
      }
      const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(waveSignatures.join(';')));
      legacyDigests.push(`${def.level}/${[...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('')}`);
    }
    expect({ enemyIds, legacyDigests }).toMatchSnapshot();
  }, 20_000);
  it('rejects invalid shared wave-profile levels and waves with Campaign errors', () => {
    expect(() => getCampaignWaveCount(0)).toThrow('Campaign level is locked or invalid');
    expect(() => getCampaignWaveCount(101)).toThrow('Campaign level is locked or invalid');
    expect(() => getCampaignWave(0, 1)).toThrow('Campaign level is locked or invalid');
    expect(() => getCampaignWave(1, 0)).toThrow('Campaign wave is out of range');
    expect(() => getCampaignWave(1, getCampaignWaveCount(1) + 1)).toThrow('Campaign wave is out of range');
  });
  it('registers all 42 expansion enemy and boss profiles with bounded stat domains', () => {
    const expansionIds = [
      'bogling','fen_skitter','mossguard','rotback','rootwretch','mireheart_hydra',
      'tideborn','crystal_wisp','deepcrawler','relic_guardian','aetherbound','drowned_oracle',
      'scrapling','furnace_hound','siege_golem','ironbound','foundry_core','iron_tyrant',
      'cloud_skitter','galeclaw','aether_drake','stormguard','tempest_herald','stormmaw_prime',
      'shadeborn','dusk_runner','moonstalker','grave_hulk','echo_shade','umbral_regent',
      'riftling','phase_hound','astral_horror','voidplate','rift_weaver','rift_sovereign',
      'aetherborn','crown_runner','aether_seer','sentry_colossus','crown_archon','aether_devourer'
    ];
    expect(expansionIds).toHaveLength(42);
    for (const id of expansionIds) {
      const config = getCampaignEnemy(id);
      expect(config.baseHp).toBeGreaterThan(0);
      expect(config.baseSpeed).toBeGreaterThan(0);
      expect(config.baseReward).toBeGreaterThanOrEqual(0);
      expect(config.physicalArmor).toBeGreaterThanOrEqual(0);
      expect(config.physicalArmor).toBeLessThanOrEqual(0.9);
      expect(config.wardArmor).toBeGreaterThanOrEqual(0);
      expect(config.wardArmor).toBeLessThanOrEqual(0.9);
      expect(Number.isFinite(config.slowResistance)).toBe(true);
    }
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
  it('Rootwretch heals nearby allies in a bounded simulation-time pulse', () => {
    const system = new CampaignBossSystem(), rootwretch = campaignEnemy('rootwretch'), ally = campaignEnemy('bogling');
    rootwretch.x = 0; rootwretch.y = 0; ally.x = 40; ally.y = 0; ally.hp = ally.maxHp / 2;
    system.register(rootwretch, 0);
    system.tick([rootwretch, ally], [], 5499);
    expect(ally.hp).toBe(ally.maxHp / 2);
    expect(system.tick([rootwretch, ally], [], 5500).map(event => event.text)).toContain('Rootwretch · Healing roots');
    expect(ally.hp).toBeCloseTo(ally.maxHp * 0.54);
    system.tick([rootwretch, ally], [], 11000);
    expect(ally.hp).toBeCloseTo(ally.maxHp * 0.54);
    system.tick([rootwretch, ally], [], 16500);
    expect(ally.hp).toBeCloseTo(ally.maxHp * 0.58);
    const hydra = campaignEnemy('mireheart_hydra'); hydra.hp = hydra.maxHp / 2;
    system.tick([rootwretch, hydra], [], 22000);
    expect(hydra.hp).toBe(hydra.maxHp / 2);
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
  it('Hydra regeneration is period-capped and its Bogling summons are telegraphed and capped', () => {
    const system = new CampaignBossSystem(), boss = campaignEnemy('mireheart_hydra');
    system.register(boss, 0);
    boss.hp = boss.maxHp * 0.5;
    expect(system.tick([boss], [], 1000).some(event => event.text.includes('brood gathering'))).toBe(true);
    expect(system.presentation(boss.id, 1000)).toEqual({ phase: 2, telegraph: true, guarded: false });
    expect(system.tick([boss], [], 2499).filter(event => event.summon)).toHaveLength(0);
    expect(system.tick([boss], [], 2500).find(event => event.summon)?.summon).toEqual({ enemyId: 'bogling', count: 2 });
    expect(system.presentation(boss.id, 2500).telegraph).toBe(false);

    boss.hp = boss.maxHp * 0.25;
    expect(system.tick([boss], [], 3700).some(event => event.text.includes('brood gathering'))).toBe(true);
    expect(system.tick([boss], [], 5200).find(event => event.summon)?.summon).toEqual({ enemyId: 'bogling', count: 2 });
    boss.hp = boss.maxHp * 0.1;
    expect(system.tick([boss], [], 8000).filter(event => event.summon)).toHaveLength(0);
    expect(system.phase(boss.id)).toBe(3);

    const healing = new CampaignBossSystem(), regenerator = campaignEnemy('mireheart_hydra');
    healing.register(regenerator, 0); regenerator.hp = 0;
    for (const nowMs of [6000, 12000, 18000]) healing.tick([regenerator], [], nowMs);
    expect(regenerator.hp / regenerator.maxHp).toBeCloseTo(CAMPAIGN_BOSS_TUNING.hydraHealPeriodCapFraction);
    healing.tick([regenerator], [], 24000);
    expect(regenerator.hp / regenerator.maxHp).toBeCloseTo(0.055);
    healing.remove(regenerator.id);
    const hpAtRemoval = regenerator.hp;
    healing.tick([regenerator], [], 30000);
    expect(regenerator.hp).toBe(hpAtRemoval);
    expect(healing.phase(regenerator.id)).toBe(1);
  });
});
