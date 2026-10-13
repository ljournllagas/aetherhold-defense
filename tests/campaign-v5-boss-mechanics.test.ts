import { describe, expect, it } from 'vitest';
import { CampaignBossSystem, CAMPAIGN_BOSS_TUNING } from '../src/game/campaign/bosses.ts';
import { getCampaignEnemy } from '../src/game/campaign/enemies.ts';
import { Enemy } from '../src/game/entities/Enemy.ts';

function campaignEnemy(id: string): Enemy {
  const cfg = getCampaignEnemy(id);
  const enemy = new Enemy(cfg.visualArchetype, cfg.baseHp, cfg.baseSpeed, cfg.baseReward, cfg);
  enemy.campaignId = id;
  enemy.slowResistance = cfg.slowResistance;
  return enemy;
}

describe('World 5 campaign mechanics', () => {
  it('cycles the Oracle through readable partial resistance states on simulation time', () => {
    const system = new CampaignBossSystem(), boss = campaignEnemy('drowned_oracle');
    system.register(boss, 0);

    expect(system.presentation(boss.id, 0)).toMatchObject({ phaseLabel: 'oracle_physical', resistanceType: 'physical' });
    expect(system.incomingDamageMultiplier(boss.id, 'physical', 0)).toBe(CAMPAIGN_BOSS_TUNING.oracleResistanceMultiplier);
    expect(system.incomingDamageMultiplier(boss.id, 'arcane', 0)).toBe(1);
    expect(system.tick([boss], [], 0).map(event => event.text)).toContain('Drowned Oracle · Physical resistance');

    const transitions = [
      ['physical', 'arcane', 'oracle_arcane', 2],
      ['arcane', 'elemental', 'oracle_elemental', 3],
      ['elemental', 'physical', 'oracle_physical', 1]
    ] as const;
    let changedAt = 0;
    for (const [oldType, type, label, phase] of transitions) {
      const warnAt = changedAt + CAMPAIGN_BOSS_TUNING.oracleResistanceIntervalMs;
      expect(system.tick([boss], [], warnAt).map(event => event.text)).toContain(`Drowned Oracle · ${type[0].toUpperCase()}${type.slice(1)} resistance forming`);
      expect(system.presentation(boss.id, warnAt)).toMatchObject({ phase: phase === 1 ? 3 : phase - 1, telegraph: true, resistanceType: oldType, phaseLabel: label });
      expect(system.incomingDamageMultiplier(boss.id, oldType, warnAt)).toBe(CAMPAIGN_BOSS_TUNING.oracleResistanceMultiplier);
      expect(system.incomingDamageMultiplier(boss.id, type, warnAt)).toBe(1);

      // A paused clock can tick repeatedly without consuming the warning.
      system.tick([boss], [], warnAt);
      const resolveAt = warnAt + CAMPAIGN_BOSS_TUNING.bossTransitionTelegraphMs;
      system.tick([boss], [], resolveAt - 1);
      expect(system.presentation(boss.id, resolveAt - 1)).toMatchObject({ telegraph: true, resistanceType: oldType, phaseLabel: label });
      expect(system.incomingDamageMultiplier(boss.id, type, resolveAt - 1)).toBe(1);

      expect(system.tick([boss], [], resolveAt).map(event => event.text)).toContain(`Drowned Oracle · ${type[0].toUpperCase()}${type.slice(1)} resistance`);
      expect(system.presentation(boss.id, resolveAt)).toMatchObject({ phase, telegraph: false, resistanceType: type, phaseLabel: label });
      expect(system.incomingDamageMultiplier(boss.id, type, resolveAt)).toBe(CAMPAIGN_BOSS_TUNING.oracleResistanceMultiplier);
      expect(system.incomingDamageMultiplier(boss.id, type, resolveAt)).toBeGreaterThan(0);
      changedAt = resolveAt;
    }
  });

  it('gives Aetherbound shields a visible, bounded expiry and clears them with their source', () => {
    const system = new CampaignBossSystem(), support = campaignEnemy('aetherbound'), ally = campaignEnemy('tideborn');
    support.x = 0; ally.x = 20;
    system.register(support, 0);

    expect(system.tick([support, ally], [], CAMPAIGN_BOSS_TUNING.aetherboundIntervalMs)[0]?.text).toContain('Aether shields');
    expect(system.presentation(ally.id, CAMPAIGN_BOSS_TUNING.aetherboundIntervalMs).guarded).toBe(true);
    expect(system.incomingDamageMultiplier(ally.id, 'physical', CAMPAIGN_BOSS_TUNING.aetherboundIntervalMs)).toBe(CAMPAIGN_BOSS_TUNING.aetherboundShieldMultiplier);
    const expiry = CAMPAIGN_BOSS_TUNING.aetherboundIntervalMs + CAMPAIGN_BOSS_TUNING.aetherboundShieldDurationMs;
    expect(system.incomingDamageMultiplier(ally.id, 'physical', expiry)).toBe(1);
    expect(system.presentation(ally.id, expiry).guarded).toBe(false);
    expect(system.presentation(support.id, expiry).phaseLabel).toBeUndefined();

    system.tick([support, ally], [], CAMPAIGN_BOSS_TUNING.aetherboundIntervalMs * 2);
    system.remove(support.id);
    expect(system.incomingDamageMultiplier(ally.id, 'physical', CAMPAIGN_BOSS_TUNING.aetherboundIntervalMs * 2)).toBe(1);
  });
});

describe('World 6 campaign mechanics', () => {
  it('breaks Tyrant armor at 65%, exposes the core at 30%, and never regresses', () => {
    const system = new CampaignBossSystem(), boss = campaignEnemy('iron_tyrant');
    system.register(boss, 0);
    system.tick([boss], [], 0);
    expect(system.presentation(boss.id, 0)).toMatchObject({ phase: 1, phaseLabel: 'tyrant_plates' });

    boss.hp = boss.maxHp * 0.649;
    const breakAt = 100;
    expect(system.tick([boss], [], breakAt).map(event => event.text)).toContain('Iron Tyrant · Armor plates fracturing');
    expect(system.presentation(boss.id, breakAt)).toMatchObject({ phase: 1, telegraph: true, phaseLabel: 'tyrant_break' });
    expect([boss.physicalArmor, boss.wardArmor, boss.bossSpeedMultiplier, boss.damageTakenMultiplier]).toEqual([0.65, 0.35, 1, 1]);
    system.tick([boss], [], breakAt); // Paused game time leaves the warning pending.
    const breakResolveAt = breakAt + CAMPAIGN_BOSS_TUNING.bossTransitionTelegraphMs;
    system.tick([boss], [], breakResolveAt - 1);
    expect([boss.physicalArmor, boss.wardArmor, boss.bossSpeedMultiplier]).toEqual([0.65, 0.35, 1]);
    expect(system.tick([boss], [], breakResolveAt).map(event => event.text)).toContain('Iron Tyrant · Armor broken');
    expect(system.presentation(boss.id, breakResolveAt)).toMatchObject({ phase: 2, telegraph: false, phaseLabel: 'tyrant_break' });
    expect([boss.physicalArmor, boss.wardArmor, boss.bossSpeedMultiplier, boss.damageTakenMultiplier]).toEqual([0.32, 0.18, 1.2, 1]);

    boss.hp = boss.maxHp * 0.299;
    const coreAt = breakResolveAt + 100;
    expect(system.tick([boss], [], coreAt).map(event => event.text)).toContain('Iron Tyrant · Core exposure imminent');
    expect(system.presentation(boss.id, coreAt)).toMatchObject({ phase: 2, telegraph: true, phaseLabel: 'tyrant_core' });
    expect([boss.physicalArmor, boss.wardArmor, boss.bossSpeedMultiplier, boss.damageTakenMultiplier]).toEqual([0.32, 0.18, 1.2, 1]);
    const coreResolveAt = coreAt + CAMPAIGN_BOSS_TUNING.bossTransitionTelegraphMs;
    expect(system.tick([boss], [], coreResolveAt).map(event => event.text)).toContain('Iron Tyrant · Core exposed');
    expect(system.presentation(boss.id, coreResolveAt)).toMatchObject({ phase: 3, telegraph: false, phaseLabel: 'tyrant_core' });
    expect([boss.physicalArmor, boss.wardArmor, boss.bossSpeedMultiplier, boss.damageTakenMultiplier]).toEqual([0.08, 0, 1.4, 1.3]);

    boss.hp = boss.maxHp;
    system.tick([boss], [], 300);
    expect(system.presentation(boss.id, 300)).toMatchObject({ phase: 3, phaseLabel: 'tyrant_core' });
  });

  it('limits Foundry Core armor support to its radius, damage types, and duration', () => {
    const system = new CampaignBossSystem(), support = campaignEnemy('foundry_core');
    const nearby = campaignEnemy('scrapling'), distant = campaignEnemy('scrapling');
    support.x = 0; nearby.x = 40; distant.x = 300;
    system.register(support, 0);
    const castAt = CAMPAIGN_BOSS_TUNING.foundryCoreIntervalMs;
    system.tick([support, nearby, distant], [], castAt);
    expect(system.incomingDamageMultiplier(nearby.id, 'physical', castAt)).toBe(CAMPAIGN_BOSS_TUNING.foundryCoreArmorMultiplier);
    expect(system.incomingDamageMultiplier(nearby.id, 'arcane', castAt)).toBe(1);
    expect(system.incomingDamageMultiplier(distant.id, 'physical', castAt)).toBe(1);
    expect(system.incomingDamageMultiplier(nearby.id, 'physical', castAt + CAMPAIGN_BOSS_TUNING.foundryCoreArmorDurationMs)).toBe(1);
    expect(system.presentation(support.id, castAt + CAMPAIGN_BOSS_TUNING.foundryCoreArmorDurationMs).phaseLabel).toBeUndefined();
  });
});

describe('World 7 campaign mechanics', () => {
  it('telegraphs Stormmaw Surge before briefly hastening only nearby enemies', () => {
    const system = new CampaignBossSystem(), boss = campaignEnemy('stormmaw_prime');
    const ally = campaignEnemy('cloud_skitter'), distant = campaignEnemy('cloud_skitter');
    ally.x = 30; distant.x = 500;
    system.register(boss, 0);
    const castAt = CAMPAIGN_BOSS_TUNING.stormmawIntervalMs;
    expect(system.tick([boss, ally, distant], [], castAt).map(event => event.text)).toContain('Stormmaw · Storm Surge gathering');
    expect(system.presentation(boss.id, castAt)).toMatchObject({ telegraph: true, phaseLabel: 'storm_surge' });
    expect(ally.speedBuffUntil).toBe(0);

    const resolveAt = castAt + CAMPAIGN_BOSS_TUNING.stormmawTelegraphMs;
    expect(system.tick([boss, ally, distant], [], resolveAt).map(event => event.text)).toContain('Stormmaw · Nearby enemies hastened');
    expect(ally.speedBuffUntil).toBe(resolveAt + CAMPAIGN_BOSS_TUNING.stormmawBuffDurationMs);
    expect(distant.speedBuffUntil).toBe(0);
    expect(system.presentation(boss.id, resolveAt).telegraph).toBe(false);
  });

  it('telegraphs Tempest Herald haste and applies it only after the warning', () => {
    const system = new CampaignBossSystem(), support = campaignEnemy('tempest_herald'), ally = campaignEnemy('galeclaw');
    ally.x = 30; system.register(support, 0);
    const castAt = CAMPAIGN_BOSS_TUNING.tempestHeraldIntervalMs;
    system.tick([support, ally], [], castAt);
    expect(system.presentation(support.id, castAt)).toMatchObject({ telegraph: true, phaseLabel: 'tempest_haste' });
    expect(ally.speedBuffUntil).toBe(0);
    const resolveAt = castAt + CAMPAIGN_BOSS_TUNING.tempestHeraldTelegraphMs;
    system.tick([support, ally], [], resolveAt);
    expect(ally.speedBuffUntil).toBe(resolveAt + CAMPAIGN_BOSS_TUNING.tempestHeraldDurationMs);
  });
});

describe('World 8 campaign mechanics', () => {
  it('creates at most two low-health Regent echoes and tracks them to boss cleanup', () => {
    const system = new CampaignBossSystem(), boss = campaignEnemy('umbral_regent');
    system.register(boss, 0);
    boss.hp = boss.maxHp * 0.64;
    const warnAt = 100;
    const warning = system.tick([boss], [], warnAt);
    expect(warning.map(event => event.text)).toContain('Umbral Regent · Echoes forming');
    expect(warning.some(event => event.summon)).toBe(false);
    expect(system.presentation(boss.id, warnAt)).toMatchObject({ phase: 1, telegraph: true, phaseLabel: 'regent_decoys' });
    expect(system.tick([boss], [], warnAt).some(candidate => candidate.summon)).toBe(false);
    const resolveAt = warnAt + CAMPAIGN_BOSS_TUNING.bossTransitionTelegraphMs;
    system.tick([boss], [], resolveAt - 1);
    expect(system.presentation(boss.id, resolveAt - 1)).toMatchObject({ phase: 1, telegraph: true, phaseLabel: 'regent_decoys' });
    const event = system.tick([boss], [], resolveAt).find(candidate => candidate.summon);
    expect(event?.summon).toMatchObject({ enemyId: 'echo_shade', count: 2, kind: 'regent-clone', ownerId: boss.id });
    expect(event?.summon?.hpBonus).toBeLessThan(1);
    expect(system.presentation(boss.id, resolveAt)).toMatchObject({ phase: 2, telegraph: false, phaseLabel: 'regent_decoys' });
    expect(system.tick([boss], [], resolveAt + 100).filter(candidate => candidate.summon)).toHaveLength(0);

    const clone = campaignEnemy('echo_shade');
    clone.campaignCloneKind = 'regent_echo'; clone.campaignBossOwnerId = boss.id;
    system.trackOwnedSummon(boss.id, clone.id, 'regent-clone');
    expect(system.presentation(boss.id, resolveAt + 200).cloneCount).toBe(1);
    expect(system.presentation(clone.id, resolveAt + 200).phaseLabel).toBe('regent_decoys');
    expect(system.remove(clone.id)).toEqual([]);
    expect(system.presentation(boss.id, resolveAt + 201).cloneCount).toBeUndefined();

    const second = campaignEnemy('echo_shade');
    system.trackOwnedSummon(boss.id, second.id, 'regent-clone');
    expect(system.remove(boss.id)).toEqual([second.id]);
    expect(system.presentation(boss.id, resolveAt + 202)).toMatchObject({ phase: 1, telegraph: false, guarded: false });
  });

  it.each(['drowned_oracle', 'iron_tyrant', 'umbral_regent'] as const)('discards a pending %s warning when the boss dies', campaignId => {
    const system = new CampaignBossSystem(), boss = campaignEnemy(campaignId);
    system.register(boss, 0);
    let warnAt = 100;
    if (campaignId === 'drowned_oracle') {
      system.tick([boss], [], 0);
      warnAt = CAMPAIGN_BOSS_TUNING.oracleResistanceIntervalMs;
    } else boss.hp = boss.maxHp * 0.64;
    system.tick([boss], [], warnAt);
    expect(system.presentation(boss.id, warnAt).telegraph).toBe(true);

    boss.alive = false;
    expect(system.tick([boss], [], warnAt + CAMPAIGN_BOSS_TUNING.bossTransitionTelegraphMs)).toHaveLength(0);
    expect(system.incomingDamageMultiplier(boss.id, 'arcane', warnAt + CAMPAIGN_BOSS_TUNING.bossTransitionTelegraphMs)).toBe(1);
    expect(system.remove(boss.id)).toEqual([]);
    expect(system.presentation(boss.id, warnAt + CAMPAIGN_BOSS_TUNING.bossTransitionTelegraphMs)).toMatchObject({ phase: 1, telegraph: false, guarded: false });
    expect(system.tick([boss], [], warnAt + CAMPAIGN_BOSS_TUNING.bossTransitionTelegraphMs * 2)).toHaveLength(0);
  });

  it('clears a pending transition when the campaign run resets', () => {
    const system = new CampaignBossSystem(), boss = campaignEnemy('umbral_regent');
    system.register(boss, 0); boss.hp = boss.maxHp * 0.64;
    system.tick([boss], [], 100);
    system.clear();
    const resolveAt = 100 + CAMPAIGN_BOSS_TUNING.bossTransitionTelegraphMs;
    expect(system.tick([boss], [], resolveAt)).toHaveLength(0);
    expect(system.presentation(boss.id, resolveAt)).toMatchObject({ phase: 1, telegraph: false, guarded: false });
  });

  it('keeps ordinary Echo Shade decoys bounded and does not allow recursive decoys', () => {
    const system = new CampaignBossSystem(), support = campaignEnemy('echo_shade');
    system.register(support, 0);
    const warnAt = CAMPAIGN_BOSS_TUNING.echoShadeIntervalMs;
    system.tick([support], [], warnAt);
    expect(system.presentation(support.id, warnAt)).toMatchObject({ telegraph: true, phaseLabel: 'echo_decoys' });
    const resolveAt = warnAt + CAMPAIGN_BOSS_TUNING.echoShadeTelegraphMs;
    const event = system.tick([support], [], resolveAt).find(candidate => candidate.summon);
    expect(event?.summon).toMatchObject({ count: CAMPAIGN_BOSS_TUNING.echoShadeMaximumDecoys, kind: 'echo-decoy', ownerId: support.id });
  });
});

describe('World 9 campaign mechanics', () => {
  it('telegraphs Sovereign portal jumps, caps their count, and emits only forward progress', () => {
    const system = new CampaignBossSystem(), boss = campaignEnemy('rift_sovereign');
    system.register(boss, 0);
    const castAt = CAMPAIGN_BOSS_TUNING.sovereignIntervalMs;
    system.tick([boss], [], castAt);
    expect(system.presentation(boss.id, castAt)).toMatchObject({ telegraph: true, phaseLabel: 'sovereign_portal' });
    expect(system.tick([boss], [], castAt + CAMPAIGN_BOSS_TUNING.sovereignTelegraphMs).find(event => event.routeAdvanceFraction)?.routeAdvanceFraction).toBe(0.1);
    for (let jump = 1; jump < CAMPAIGN_BOSS_TUNING.sovereignMaximumJumps; jump++) {
      const next = castAt + CAMPAIGN_BOSS_TUNING.sovereignTelegraphMs + CAMPAIGN_BOSS_TUNING.sovereignIntervalMs * jump;
      system.tick([boss], [], next);
      expect(system.tick([boss], [], next + CAMPAIGN_BOSS_TUNING.sovereignTelegraphMs).some(event => event.routeAdvanceFraction === 0.1)).toBe(true);
    }
    const afterCap = castAt + CAMPAIGN_BOSS_TUNING.sovereignTelegraphMs + CAMPAIGN_BOSS_TUNING.sovereignIntervalMs * CAMPAIGN_BOSS_TUNING.sovereignMaximumJumps;
    expect(system.tick([boss], [], afterCap + CAMPAIGN_BOSS_TUNING.sovereignTelegraphMs).some(event => event.routeAdvanceFraction)).toBe(false);
  });

  it('telegraphs Rift Weaver phase jumps before bounded route-advance events', () => {
    const system = new CampaignBossSystem(), support = campaignEnemy('rift_weaver');
    system.register(support, 0);
    const castAt = CAMPAIGN_BOSS_TUNING.riftWeaverIntervalMs;
    system.tick([support], [], castAt);
    expect(system.presentation(support.id, castAt)).toMatchObject({ telegraph: true, phaseLabel: 'rift_jump' });
    const event = system.tick([support], [], castAt + CAMPAIGN_BOSS_TUNING.riftWeaverTelegraphMs).find(candidate => candidate.routeAdvanceFraction);
    expect(event?.routeAdvanceFraction).toBe(CAMPAIGN_BOSS_TUNING.riftWeaverRouteFraction);
  });
});

describe('World 10 campaign mechanics', () => {
  it('advances Devourer through four named irreversible phases with partial resistance and bounded portal pressure', () => {
    const system = new CampaignBossSystem(), boss = campaignEnemy('aether_devourer');
    system.register(boss, 0);
    system.tick([boss], [], 0);
    expect(system.presentation(boss.id, 0)).toMatchObject({ phase: 1, phaseLabel: 'devourer_normal' });

    boss.hp = boss.maxHp * 0.69;
    system.tick([boss], [], 100);
    expect(system.presentation(boss.id, 100)).toMatchObject({ phase: 2, phaseLabel: 'devourer_resistance' });
    const resistingType = system.presentation(boss.id, 100).resistanceType!;
    expect(system.incomingDamageMultiplier(boss.id, resistingType, 100)).toBeLessThan(1);
    expect(system.incomingDamageMultiplier(boss.id, resistingType, 100)).toBeGreaterThan(0);

    boss.hp = boss.maxHp * 0.44;
    system.tick([boss], [], 200);
    expect(system.presentation(boss.id, 200)).toMatchObject({ phase: 3, phaseLabel: 'devourer_rift' });
    expect(system.incomingDamageMultiplier(boss.id, resistingType, 200)).toBe(1);
    const jumpAt = 200 + CAMPAIGN_BOSS_TUNING.devourerPortalIntervalMs;
    system.tick([boss], [], jumpAt);
    expect(system.presentation(boss.id, jumpAt)).toMatchObject({ telegraph: true, phaseLabel: 'devourer_rift' });
    expect(system.tick([boss], [], jumpAt + CAMPAIGN_BOSS_TUNING.devourerPortalTelegraphMs).some(event => event.routeAdvanceFraction === CAMPAIGN_BOSS_TUNING.devourerPortalRouteFraction)).toBe(true);

    boss.hp = boss.maxHp * 0.19;
    system.tick([boss], [], jumpAt + 5000);
    const corePresentation = system.presentation(boss.id, jumpAt + 5000);
    expect(corePresentation).toMatchObject({ phase: 4, phaseLabel: 'devourer_core' });
    expect(corePresentation.resistanceType).toBeUndefined();
    expect([boss.physicalArmor, boss.wardArmor, boss.damageTakenMultiplier, boss.bossSpeedMultiplier]).toEqual([0.08, 0, 1.3, 1.4]);
    boss.hp = boss.maxHp;
    system.tick([boss], [], jumpAt + 7000);
    expect(system.presentation(boss.id, jumpAt + 7000)).toMatchObject({ phase: 4, phaseLabel: 'devourer_core' });
  });

  it('applies Crown Archon aether ward temporarily and clears it when the source dies', () => {
    const system = new CampaignBossSystem(), support = campaignEnemy('crown_archon'), ally = campaignEnemy('aetherborn');
    ally.x = 50; system.register(support, 0);
    const castAt = CAMPAIGN_BOSS_TUNING.crownArchonIntervalMs;
    system.tick([support, ally], [], castAt);
    expect(system.incomingDamageMultiplier(ally.id, 'arcane', castAt)).toBe(CAMPAIGN_BOSS_TUNING.crownArchonWardMultiplier);
    expect(system.incomingDamageMultiplier(ally.id, 'physical', castAt)).toBe(1);
    system.remove(support.id);
    expect(system.incomingDamageMultiplier(ally.id, 'arcane', castAt)).toBe(1);
  });
});

describe('natural expansion boss presentation actions', () => {
  it('marks warnings as special and only the first real Phase 2 effect as phase_two', () => {
    const oracleSystem = new CampaignBossSystem(), oracle = campaignEnemy('drowned_oracle');
    oracleSystem.register(oracle, 0);
    oracleSystem.tick([oracle], [], 0);
    const oracleWarnAt = CAMPAIGN_BOSS_TUNING.oracleResistanceIntervalMs;
    const oracleWarning = oracleSystem.tick([oracle], [], oracleWarnAt)[0];
    expect(oracleWarning).toMatchObject({ presentationAction: 'special' });
    expect(oracleSystem.presentation(oracle.id, oracleWarnAt)).toMatchObject({ phase: 1, telegraph: true, resistanceType: 'physical' });
    expect(oracleSystem.tick([oracle], [], oracleWarnAt)).toHaveLength(0);
    const oracleResolveAt = oracleWarnAt + CAMPAIGN_BOSS_TUNING.bossTransitionTelegraphMs;
    expect(oracleSystem.tick([oracle], [], oracleResolveAt)[0]).toMatchObject({ presentationAction: 'phase_two' });
    expect(oracleSystem.presentation(oracle.id, oracleResolveAt)).toMatchObject({ phase: 2, telegraph: false, resistanceType: 'arcane' });
    const nextOracleWarnAt = oracleResolveAt + CAMPAIGN_BOSS_TUNING.oracleResistanceIntervalMs;
    expect(oracleSystem.tick([oracle], [], nextOracleWarnAt)[0]).toMatchObject({ presentationAction: 'special' });
    const nextOracleResolveAt = nextOracleWarnAt + CAMPAIGN_BOSS_TUNING.bossTransitionTelegraphMs;
    expect(oracleSystem.tick([oracle], [], nextOracleResolveAt)[0]).not.toHaveProperty('presentationAction', 'phase_two');

    const tyrantSystem = new CampaignBossSystem(), tyrant = campaignEnemy('iron_tyrant');
    tyrantSystem.register(tyrant, 0); tyrant.hp = tyrant.maxHp * 0.649;
    expect(tyrantSystem.tick([tyrant], [], 100)[0]).toMatchObject({ presentationAction: 'special' });
    expect(tyrantSystem.presentation(tyrant.id, 100)).toMatchObject({ phase: 1, telegraph: true });
    expect(tyrantSystem.tick([tyrant], [], 100)).toHaveLength(0);
    expect(tyrantSystem.tick([tyrant], [], 100 + CAMPAIGN_BOSS_TUNING.bossTransitionTelegraphMs)[0]).toMatchObject({ presentationAction: 'phase_two' });
    tyrant.hp = tyrant.maxHp * 0.299;
    const coreAt = 100 + CAMPAIGN_BOSS_TUNING.bossTransitionTelegraphMs + 100;
    expect(tyrantSystem.tick([tyrant], [], coreAt)[0]).toMatchObject({ presentationAction: 'special' });
    expect(tyrantSystem.tick([tyrant], [], coreAt + CAMPAIGN_BOSS_TUNING.bossTransitionTelegraphMs)[0]).not.toHaveProperty('presentationAction', 'phase_two');

    const regentSystem = new CampaignBossSystem(), regent = campaignEnemy('umbral_regent');
    regentSystem.register(regent, 0); regent.hp = regent.maxHp * 0.64;
    expect(regentSystem.tick([regent], [], 100)[0]).toMatchObject({ presentationAction: 'special' });
    expect(regentSystem.presentation(regent.id, 100)).toMatchObject({ phase: 1, telegraph: true });
    expect(regentSystem.tick([regent], [], 100)).toHaveLength(0);
    expect(regentSystem.tick([regent], [], 100 + CAMPAIGN_BOSS_TUNING.bossTransitionTelegraphMs)[0]).toMatchObject({ presentationAction: 'phase_two', summon: { count: 2 } });

    const sovereignSystem = new CampaignBossSystem(), sovereign = campaignEnemy('rift_sovereign');
    sovereignSystem.register(sovereign, 0);
    const sovereignWarnAt = CAMPAIGN_BOSS_TUNING.sovereignIntervalMs;
    expect(sovereignSystem.tick([sovereign], [], sovereignWarnAt)[0]).toMatchObject({ presentationAction: 'special' });
    expect(sovereignSystem.presentation(sovereign.id, sovereignWarnAt)).toMatchObject({ phase: 1, telegraph: true });
    const sovereignResolveAt = sovereignWarnAt + CAMPAIGN_BOSS_TUNING.sovereignTelegraphMs;
    expect(sovereignSystem.tick([sovereign], [], sovereignResolveAt)[0]).toMatchObject({ presentationAction: 'phase_two', routeAdvanceFraction: CAMPAIGN_BOSS_TUNING.sovereignRouteFraction });
    expect(sovereignSystem.presentation(sovereign.id, sovereignResolveAt)).toMatchObject({ phase: 2, telegraph: false });

    const devourerSystem = new CampaignBossSystem(), devourer = campaignEnemy('aether_devourer');
    devourerSystem.register(devourer, 0); devourerSystem.tick([devourer], [], 0);
    devourer.hp = devourer.maxHp * 0.69;
    expect(devourerSystem.tick([devourer], [], 100)[0]).toMatchObject({ presentationAction: 'phase_two' });
    expect(devourerSystem.presentation(devourer.id, 100)).toMatchObject({ phase: 2, telegraph: false });
    devourer.hp = devourer.maxHp * 0.44;
    devourerSystem.tick([devourer], [], 200);
    const devourerWarnAt = 200 + CAMPAIGN_BOSS_TUNING.devourerPortalIntervalMs;
    expect(devourerSystem.tick([devourer], [], devourerWarnAt)[0]).toMatchObject({ presentationAction: 'special' });
    expect(devourerSystem.presentation(devourer.id, devourerWarnAt)).toMatchObject({ phase: 3, telegraph: true });
  });

  it('plays Hydra special at warning onset and phase_two only after the first summons resolve', () => {
    const system = new CampaignBossSystem(), boss = campaignEnemy('mireheart_hydra');
    system.register(boss, 0); boss.hp = boss.maxHp * CAMPAIGN_BOSS_TUNING.hydraSummonHp;

    const warning = system.tick([boss], [], 0)[0];
    expect(warning).toMatchObject({ presentationAction: 'special' });
    expect(system.presentation(boss.id, 0)).toMatchObject({ phase: 2, telegraph: true });
    expect(system.tick([boss], [], 0)).toHaveLength(0);

    const resolveAt = CAMPAIGN_BOSS_TUNING.hydraTelegraphMs;
    expect(system.tick([boss], [], resolveAt - 1)).toHaveLength(0);
    expect(system.presentation(boss.id, resolveAt - 1).telegraph).toBe(true);
    expect(system.tick([boss], [], resolveAt)[0]).toMatchObject({ presentationAction: 'phase_two', summon: { enemyId: 'bogling', count: 2 } });
    expect(system.presentation(boss.id, resolveAt)).toMatchObject({ phase: 2, telegraph: false });
    expect(system.tick([boss], [], resolveAt)).toHaveLength(0);
  });

  it('marks Stormmaw warnings as special without creating a Phase 2 action or phase', () => {
    const system = new CampaignBossSystem(), boss = campaignEnemy('stormmaw_prime'), ally = campaignEnemy('cloud_skitter');
    ally.x = 30; system.register(boss, 0);
    const warnAt = CAMPAIGN_BOSS_TUNING.stormmawIntervalMs;
    expect(system.tick([boss, ally], [], warnAt)[0]).toMatchObject({ presentationAction: 'special' });
    expect(system.presentation(boss.id, warnAt)).toMatchObject({ phase: 1, telegraph: true });
    const resolveAt = warnAt + CAMPAIGN_BOSS_TUNING.stormmawTelegraphMs;
    const event = system.tick([boss, ally], [], resolveAt)[0];
    expect(event).not.toHaveProperty('presentationAction', 'phase_two');
    expect(system.presentation(boss.id, resolveAt)).toMatchObject({ phase: 1, telegraph: false });
    expect(ally.speedBuffUntil).toBe(resolveAt + CAMPAIGN_BOSS_TUNING.stormmawBuffDurationMs);
  });
});
