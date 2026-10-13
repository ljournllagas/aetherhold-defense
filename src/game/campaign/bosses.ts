import type { Enemy } from '../entities/Enemy.ts';
import type { Tower } from '../entities/Tower.ts';
import type { DamageType } from '../../shared/types.ts';
import { CAMPAIGN_BATTLE_TUNING } from './battle.ts';

export const CAMPAIGN_BOSS_PHASE_LABELS = [
  'oracle_physical', 'oracle_arcane', 'oracle_elemental',
  'tyrant_plates', 'tyrant_break', 'tyrant_core',
  'storm_surge', 'regent_decoys', 'sovereign_portal',
  'devourer_normal', 'devourer_resistance', 'devourer_rift', 'devourer_core',
  'aether_shield', 'foundry_armor', 'tempest_haste', 'echo_decoys', 'rift_jump', 'crown_ward'
] as const;

export type CampaignBossPhaseLabel = typeof CAMPAIGN_BOSS_PHASE_LABELS[number];

export interface CampaignBossPresentation {
  phase: number;
  telegraph: boolean;
  guarded: boolean;
  phaseLabel?: CampaignBossPhaseLabel;
  resistanceType?: DamageType;
  cloneCount?: number;
}

export type CampaignSummonKind = 'add' | 'regent-clone' | 'echo-decoy';

export const CAMPAIGN_BOSS_TUNING = {
  shieldIntervalMs: 8000, shieldDurationMs: 2500, shieldDamageMultiplier: 0.55,
  wardenSummonHp: 0.5, wardenSummonCount: 3, wardenEnrageHp: 0.25, wardenEnrageSpeed: 1.2,
  colossusBreakHp: 0.65, colossusCoreHp: 0.3, colossusCoreDamageMultiplier: 1.3,
  freezeIntervalMs: 7500, freezeTelegraphMs: 1500, towerFreezeMs: 3000, matriarchSecondPhaseHp: 0.5,
  rootwretchHealFraction: 0.04, rootwretchHealTargetCooldownMs: 8000,
  hydraHealIntervalMs: 6000, hydraHealPerPulseFraction: 0.015, hydraHealPeriodMs: 24000, hydraHealPeriodCapFraction: 0.04,
  hydraSummonHp: 0.65, hydraSecondSummonHp: 0.3, hydraSummonCount: 2, hydraMaximumSummons: 4,
  hydraTelegraphMs: 1500, hydraSummonCooldownMs: 1200,

  oracleResistanceIntervalMs: 5200, oracleResistanceMultiplier: 0.62,
  bossTransitionTelegraphMs: 1200,
  tyrantBreakHp: 0.65, tyrantCoreHp: 0.3, tyrantCoreDamageMultiplier: 1.3,
  stormmawIntervalMs: 9500, stormmawTelegraphMs: 1400, stormmawBuffDurationMs: 3000, stormmawRadius: 180, stormmawMaximumTargets: 8,
  regentCloneHpBonus: 0.22, regentCloneHp: 0.65, regentMaximumClones: 2,
  sovereignIntervalMs: 8500, sovereignTelegraphMs: 1300, sovereignMaximumJumps: 2, sovereignRouteFraction: 0.1,
  sovereignStrongholdGuardFraction: 0.88,
  devourerResistanceMultiplier: 0.7, devourerResistanceIntervalMs: 4200,
  devourerPortalIntervalMs: 8200, devourerPortalTelegraphMs: 1400, devourerPortalMaximumJumps: 2, devourerPortalRouteFraction: 0.06,

  aetherboundIntervalMs: 6500, aetherboundShieldDurationMs: 2800, aetherboundShieldMultiplier: 0.72,
  foundryCoreIntervalMs: 6500, foundryCoreArmorDurationMs: 3000, foundryCoreArmorMultiplier: 0.78,
  tempestHeraldIntervalMs: 6500, tempestHeraldTelegraphMs: 1000, tempestHeraldDurationMs: 2300,
  echoShadeIntervalMs: 7800, echoShadeTelegraphMs: 900, echoShadeMaximumDecoys: 2, echoShadeHpBonus: 0.22,
  riftWeaverIntervalMs: 7200, riftWeaverTelegraphMs: 1000, riftWeaverRouteFraction: 0.08,
  crownArchonIntervalMs: 7400, crownArchonWardDurationMs: 2800, crownArchonWardMultiplier: 0.78
} as const;

interface BossState {
  nextAt: number;
  shieldUntil: number;
  summoned: boolean;
  phase: number;
  targets: number[];
  enemyTargets: number[];
  telegraphUntil: number;
  phaseLabel?: CampaignBossPhaseLabel;
  resistanceType: DamageType | null;
  pendingResistanceType: DamageType | null;
  resistanceMultiplier: number;
  resistanceInitialized: boolean;
  jumpCount: number;
  hydraSummonPhase: number;
  hydraPendingSummons: number;
  hydraSummoned: number;
  hydraRegenNextAt: number;
  hydraRegenPeriodEndsAt: number;
  hydraRegenUsed: number;
}

interface WorldSupportState {
  nextAt: number;
  telegraphUntil: number;
  targetIds: number[];
  casts: number;
  phaseLabel?: CampaignBossPhaseLabel;
  phaseUntil?: number;
}

interface TemporaryMitigation {
  sourceId: number;
  untilMs: number;
  multiplier: number;
  damageTypes?: readonly DamageType[];
}

export interface CampaignBossEvent {
  boss: Enemy;
  text: string;
  presentationAction?: 'buff';
  summon?: {
    enemyId: string;
    count: number;
    kind?: CampaignSummonKind;
    ownerId?: number;
    hpBonus?: number;
  };
  routeAdvanceFraction?: number;
}

const RESISTANCE_TYPES: readonly DamageType[] = ['physical', 'arcane', 'elemental'];

/** Only simulation time enters this system. Pause, speed, and restart share the combat clock. */
export class CampaignBossSystem {
  private states = new Map<number, BossState>();
  private supportNextAt = new Map<number, number>();
  private rootwretchHealNextAt = new Map<number, number>();
  private worldSupportStates = new Map<number, WorldSupportState>();
  private temporaryMitigation = new Map<number, Map<number, TemporaryMitigation>>();
  private ownedSummons = new Map<number, Set<number>>();
  private summonOwnerById = new Map<number, number>();
  private clonePhaseLabels = new Map<number, CampaignBossPhaseLabel>();

  register(enemy: Enemy, nowMs: number): void {
    if (enemy.isBoss) {
      const oracle = enemy.campaignId === 'drowned_oracle';
      const tyrant = enemy.campaignId === 'iron_tyrant';
      const devourer = enemy.campaignId === 'aether_devourer';
      const phaseLabel: CampaignBossPhaseLabel | undefined = oracle ? 'oracle_physical'
        : tyrant ? 'tyrant_plates' : devourer ? 'devourer_normal' : undefined;
      this.states.set(enemy.id, {
        nextAt: nowMs + this.initialBossDelay(enemy.campaignId),
        shieldUntil: enemy.campaignId === 'hollow_warden' ? nowMs + CAMPAIGN_BOSS_TUNING.shieldDurationMs : 0,
        summoned: false, phase: 1, targets: [], enemyTargets: [], telegraphUntil: 0,
        phaseLabel, resistanceType: oracle ? 'physical' : null,
        pendingResistanceType: null,
        resistanceMultiplier: oracle ? CAMPAIGN_BOSS_TUNING.oracleResistanceMultiplier : 1,
        resistanceInitialized: false, jumpCount: 0,
        hydraSummonPhase: 1, hydraPendingSummons: 0, hydraSummoned: 0,
        hydraRegenNextAt: nowMs + CAMPAIGN_BOSS_TUNING.hydraHealIntervalMs,
        hydraRegenPeriodEndsAt: nowMs + CAMPAIGN_BOSS_TUNING.hydraHealPeriodMs,
        hydraRegenUsed: 0
      });
    } else if (enemy.campaignId && !enemy.campaignCloneKind) {
      const interval = this.worldSupportInterval(enemy.campaignId);
      if (interval) this.worldSupportStates.set(enemy.id, { nextAt: nowMs + interval, telegraphUntil: 0, targetIds: [], casts: 0 });
      else this.supportNextAt.set(enemy.id, nowMs + CAMPAIGN_BATTLE_TUNING.supportIntervalMs);
    }
  }

  tick(enemies: readonly Enemy[], towers: readonly Tower[], nowMs: number): CampaignBossEvent[] {
    const events: CampaignBossEvent[] = [];
    this.pruneTemporaryMitigation(enemies, nowMs);
    for (const enemy of enemies) {
      if (!enemy.alive || !enemy.campaignId || enemy.campaignCloneKind) continue;
      if (this.worldSupportStates.has(enemy.id)) {
        this.tickWorldSupport(enemy, enemies, nowMs, events);
        continue;
      }
      if (enemy.campaignId === 'ashcaller' || enemy.campaignId === 'frost_shaman' || enemy.campaignId === 'rootwretch') {
        if (nowMs >= (this.supportNextAt.get(enemy.id) ?? Infinity)) {
          this.supportNextAt.set(enemy.id, nowMs + CAMPAIGN_BATTLE_TUNING.supportIntervalMs);
          for (const ally of enemies) if (ally.alive && Math.hypot(ally.x - enemy.x, ally.y - enemy.y) <= CAMPAIGN_BATTLE_TUNING.supportRadius) {
            if (enemy.campaignId === 'ashcaller') ally.speedBuffUntil = nowMs + CAMPAIGN_BATTLE_TUNING.supportDurationMs;
            else if (enemy.campaignId === 'frost_shaman') ally.slowResistanceUntil = nowMs + CAMPAIGN_BATTLE_TUNING.supportDurationMs;
            else if (ally.isBoss) continue;
            else if (nowMs >= (this.rootwretchHealNextAt.get(ally.id) ?? -Infinity)) {
              const healing = Math.min(ally.maxHp * CAMPAIGN_BOSS_TUNING.rootwretchHealFraction, ally.maxHp - ally.hp);
              if (healing > 0) {
                ally.hp += healing;
                this.rootwretchHealNextAt.set(ally.id, nowMs + CAMPAIGN_BOSS_TUNING.rootwretchHealTargetCooldownMs);
              }
            }
          }
          events.push({ boss: enemy, text: enemy.campaignId === 'ashcaller' ? 'Ashcaller · Speed aura' : enemy.campaignId === 'frost_shaman' ? 'Frost Shaman · Slow ward' : 'Rootwretch · Healing roots', presentationAction: 'buff' });
        }
        continue;
      }
      const state = this.states.get(enemy.id);
      if (!state) continue;
      const hp = enemy.hp / enemy.maxHp;
      if (enemy.campaignId === 'hollow_warden') {
        state.phase = hp < CAMPAIGN_BOSS_TUNING.wardenEnrageHp ? 3 : hp <= CAMPAIGN_BOSS_TUNING.wardenSummonHp ? 2 : 1;
        if (nowMs >= state.nextAt) { state.shieldUntil = nowMs + CAMPAIGN_BOSS_TUNING.shieldDurationMs; state.nextAt = nowMs + CAMPAIGN_BOSS_TUNING.shieldIntervalMs; events.push({ boss: enemy, text: 'Warden · Guard raised' }); }
        enemy.damageTakenMultiplier = nowMs < state.shieldUntil ? CAMPAIGN_BOSS_TUNING.shieldDamageMultiplier : 1;
        enemy.bossSpeedMultiplier = hp < CAMPAIGN_BOSS_TUNING.wardenEnrageHp ? CAMPAIGN_BOSS_TUNING.wardenEnrageSpeed : 1;
        if (!state.summoned && hp <= CAMPAIGN_BOSS_TUNING.wardenSummonHp) {
          state.summoned = true;
          events.push({ boss: enemy, text: 'Warden · Marchlings summoned', summon: { enemyId: 'marchling', count: CAMPAIGN_BOSS_TUNING.wardenSummonCount } });
        }
      } else if (enemy.campaignId === 'cinder_colossus') {
        const phase = hp <= CAMPAIGN_BOSS_TUNING.colossusCoreHp ? 3 : hp <= CAMPAIGN_BOSS_TUNING.colossusBreakHp ? 2 : 1;
        if (phase > state.phase) { state.phase = phase; events.push({ boss: enemy, text: phase === 3 ? 'Colossus · Core exposed' : 'Colossus · Armor broken' }); }
        enemy.physicalArmor = state.phase === 1 ? 0.65 : state.phase === 2 ? 0.32 : 0.08;
        enemy.wardArmor = state.phase === 1 ? 0.35 : state.phase === 2 ? 0.18 : 0;
        enemy.bossSpeedMultiplier = state.phase === 1 ? 1 : state.phase === 2 ? 1.2 : 1.4;
        enemy.damageTakenMultiplier = state.phase === 3 ? CAMPAIGN_BOSS_TUNING.colossusCoreDamageMultiplier : 1;
      } else if (enemy.campaignId === 'frostbound_matriarch') {
        state.phase = hp <= CAMPAIGN_BOSS_TUNING.matriarchSecondPhaseHp ? 2 : 1;
        if (state.telegraphUntil > 0 && nowMs >= state.telegraphUntil) {
          for (const id of state.targets) { const tower = towers.find(t => t.id === id); if (tower) tower.frozenUntil = nowMs + CAMPAIGN_BOSS_TUNING.towerFreezeMs; }
          state.targets = []; state.telegraphUntil = 0;
          events.push({ boss: enemy, text: 'Matriarch · Towers frozen briefly' });
        }
        if (!state.telegraphUntil && nowMs >= state.nextAt) {
          state.targets = [...towers].sort((a, b) => Math.hypot(a.x - enemy.x, a.y - enemy.y) - Math.hypot(b.x - enemy.x, b.y - enemy.y) || a.id - b.id).slice(0, state.phase).map(t => t.id);
          state.nextAt = nowMs + CAMPAIGN_BOSS_TUNING.freezeIntervalMs;
          if (state.targets.length) { state.telegraphUntil = nowMs + CAMPAIGN_BOSS_TUNING.freezeTelegraphMs; events.push({ boss: enemy, text: `Matriarch · Freezing ${state.targets.length} tower${state.targets.length > 1 ? 's' : ''}` }); }
        }
      } else if (enemy.campaignId === 'mireheart_hydra') {
        this.tickHydra(enemy, state, nowMs, events);
      } else if (enemy.campaignId === 'drowned_oracle') {
        this.tickOracle(enemy, state, nowMs, events);
      } else if (enemy.campaignId === 'iron_tyrant') {
        this.tickTyrant(enemy, state, hp, nowMs, events);
      } else if (enemy.campaignId === 'stormmaw_prime') {
        this.tickStormmaw(enemy, state, enemies, nowMs, events);
      } else if (enemy.campaignId === 'umbral_regent') {
        this.tickRegent(enemy, state, hp, nowMs, events);
      } else if (enemy.campaignId === 'rift_sovereign') {
        this.tickSovereign(enemy, state, nowMs, events);
      } else if (enemy.campaignId === 'aether_devourer') {
        this.tickDevourer(enemy, state, hp, nowMs, events);
      }
    }
    return events;
  }

  phase(enemyId: number): number { return this.states.get(enemyId)?.phase ?? 1; }

  incomingDamageMultiplier(enemyId: number, damageType: DamageType, nowMs: number): number {
    const factors: number[] = [];
    const state = this.states.get(enemyId);
    if (state?.resistanceType === damageType && state.resistanceMultiplier < 1) factors.push(state.resistanceMultiplier);
    for (const mitigation of this.temporaryMitigation.get(enemyId)?.values() ?? []) {
      if (nowMs < mitigation.untilMs && (!mitigation.damageTypes || mitigation.damageTypes.includes(damageType))) factors.push(mitigation.multiplier);
    }
    return factors.length ? Math.min(...factors) : 1;
  }

  trackOwnedSummon(ownerId: number, summonId: number, kind: Exclude<CampaignSummonKind, 'add'>): void {
    this.worldSupportStates.delete(summonId);
    this.supportNextAt.delete(summonId);
    this.states.delete(summonId);
    const owned = this.ownedSummons.get(ownerId) ?? new Set<number>();
    owned.add(summonId);
    this.ownedSummons.set(ownerId, owned);
    this.summonOwnerById.set(summonId, ownerId);
    this.clonePhaseLabels.set(summonId, kind === 'regent-clone' ? 'regent_decoys' : 'echo_decoys');
  }

  private tickHydra(enemy: Enemy, state: BossState, nowMs: number, events: CampaignBossEvent[]): void {
    if (nowMs >= state.hydraRegenPeriodEndsAt) {
      state.hydraRegenPeriodEndsAt = nowMs + CAMPAIGN_BOSS_TUNING.hydraHealPeriodMs;
      state.hydraRegenUsed = 0;
    }
    if (nowMs >= state.hydraRegenNextAt) {
      state.hydraRegenNextAt = nowMs + CAMPAIGN_BOSS_TUNING.hydraHealIntervalMs;
      const periodCap = enemy.maxHp * CAMPAIGN_BOSS_TUNING.hydraHealPeriodCapFraction;
      const pulse = enemy.maxHp * CAMPAIGN_BOSS_TUNING.hydraHealPerPulseFraction;
      const healed = Math.min(pulse, periodCap - state.hydraRegenUsed, enemy.maxHp - enemy.hp);
      if (healed > 0) {
        enemy.hp += healed;
        state.hydraRegenUsed += healed;
      }
    }

    const hp = enemy.hp / enemy.maxHp;
    state.phase = Math.max(state.phase, hp <= CAMPAIGN_BOSS_TUNING.hydraSecondSummonHp ? 3 : hp <= CAMPAIGN_BOSS_TUNING.hydraSummonHp ? 2 : 1);
    if (state.telegraphUntil > 0 && nowMs >= state.telegraphUntil) {
      const count = Math.min(state.hydraPendingSummons, CAMPAIGN_BOSS_TUNING.hydraMaximumSummons - state.hydraSummoned);
      state.telegraphUntil = 0;
      state.hydraPendingSummons = 0;
      state.nextAt = nowMs + CAMPAIGN_BOSS_TUNING.hydraSummonCooldownMs;
      if (count > 0) {
        state.hydraSummoned += count;
        events.push({ boss: enemy, text: 'Hydra · Boglings summoned', summon: { enemyId: 'bogling', count } });
      }
    }
    if (!state.telegraphUntil && nowMs >= state.nextAt && state.phase > state.hydraSummonPhase && state.hydraSummoned < CAMPAIGN_BOSS_TUNING.hydraMaximumSummons) {
      state.hydraSummonPhase = state.phase;
      state.hydraPendingSummons = Math.min(CAMPAIGN_BOSS_TUNING.hydraSummonCount, CAMPAIGN_BOSS_TUNING.hydraMaximumSummons - state.hydraSummoned);
      state.telegraphUntil = nowMs + CAMPAIGN_BOSS_TUNING.hydraTelegraphMs;
      events.push({ boss: enemy, text: 'Hydra · Bogling brood gathering' });
    }
  }

  private tickOracle(enemy: Enemy, state: BossState, nowMs: number, events: CampaignBossEvent[]): void {
    if (!state.resistanceInitialized) {
      state.resistanceInitialized = true;
      state.nextAt = nowMs + CAMPAIGN_BOSS_TUNING.oracleResistanceIntervalMs;
      events.push({ boss: enemy, text: 'Drowned Oracle · Physical resistance' });
      return;
    }
    if (state.telegraphUntil > 0) {
      if (nowMs < state.telegraphUntil) return;
      const resistanceType = state.pendingResistanceType;
      state.telegraphUntil = 0;
      state.pendingResistanceType = null;
      if (!resistanceType) return;
      state.resistanceType = resistanceType;
      state.resistanceMultiplier = CAMPAIGN_BOSS_TUNING.oracleResistanceMultiplier;
      state.phase = RESISTANCE_TYPES.indexOf(resistanceType) + 1;
      state.phaseLabel = this.oracleLabel(resistanceType);
      state.nextAt = nowMs + CAMPAIGN_BOSS_TUNING.oracleResistanceIntervalMs;
      events.push({ boss: enemy, text: `Drowned Oracle · ${this.damageTypeName(resistanceType)} resistance` });
      return;
    }
    if (nowMs < state.nextAt) return;
    const current = RESISTANCE_TYPES.indexOf(state.resistanceType ?? 'physical');
    const resistanceType = RESISTANCE_TYPES[(current + 1) % RESISTANCE_TYPES.length];
    state.pendingResistanceType = resistanceType;
    state.phaseLabel = this.oracleLabel(resistanceType);
    state.telegraphUntil = nowMs + CAMPAIGN_BOSS_TUNING.bossTransitionTelegraphMs;
    events.push({ boss: enemy, text: `Drowned Oracle · ${this.damageTypeName(resistanceType)} resistance forming` });
  }

  private tickTyrant(enemy: Enemy, state: BossState, hp: number, nowMs: number, events: CampaignBossEvent[]): void {
    const targetPhase = hp <= CAMPAIGN_BOSS_TUNING.tyrantCoreHp ? 3 : hp <= CAMPAIGN_BOSS_TUNING.tyrantBreakHp ? 2 : 1;
    if (state.telegraphUntil > 0 && nowMs >= state.telegraphUntil) {
      state.telegraphUntil = 0;
      state.phase = Math.min(3, state.phase + 1);
      state.phaseLabel = state.phase === 2 ? 'tyrant_break' : 'tyrant_core';
      events.push({ boss: enemy, text: state.phase === 2 ? 'Iron Tyrant · Armor broken' : 'Iron Tyrant · Core exposed' });
    }
    if (!state.telegraphUntil && state.phase < targetPhase) {
      const nextPhase = state.phase + 1;
      state.phaseLabel = nextPhase === 2 ? 'tyrant_break' : 'tyrant_core';
      state.telegraphUntil = nowMs + CAMPAIGN_BOSS_TUNING.bossTransitionTelegraphMs;
      events.push({ boss: enemy, text: nextPhase === 2 ? 'Iron Tyrant · Armor plates fracturing' : 'Iron Tyrant · Core exposure imminent' });
    }
    if (state.phase === 1) {
      if (!state.telegraphUntil) state.phaseLabel = 'tyrant_plates';
      enemy.physicalArmor = 0.65; enemy.wardArmor = 0.35; enemy.bossSpeedMultiplier = 1; enemy.damageTakenMultiplier = 1;
    } else if (state.phase === 2) {
      if (!state.telegraphUntil) state.phaseLabel = 'tyrant_break';
      enemy.physicalArmor = 0.32; enemy.wardArmor = 0.18; enemy.bossSpeedMultiplier = 1.2; enemy.damageTakenMultiplier = 1;
    } else {
      if (!state.telegraphUntil) state.phaseLabel = 'tyrant_core';
      enemy.physicalArmor = 0.08; enemy.wardArmor = 0; enemy.bossSpeedMultiplier = 1.4;
      enemy.damageTakenMultiplier = CAMPAIGN_BOSS_TUNING.tyrantCoreDamageMultiplier;
    }
  }

  private tickStormmaw(enemy: Enemy, state: BossState, enemies: readonly Enemy[], nowMs: number, events: CampaignBossEvent[]): void {
    if (state.telegraphUntil > 0 && nowMs >= state.telegraphUntil) {
      for (const targetId of state.enemyTargets) {
        const target = enemies.find(candidate => candidate.id === targetId && candidate.alive);
        if (target) target.speedBuffUntil = Math.max(target.speedBuffUntil, nowMs + CAMPAIGN_BOSS_TUNING.stormmawBuffDurationMs);
      }
      state.enemyTargets = []; state.telegraphUntil = 0;
      state.nextAt = nowMs + CAMPAIGN_BOSS_TUNING.stormmawIntervalMs;
      events.push({ boss: enemy, text: 'Stormmaw · Nearby enemies hastened' });
      return;
    }
    if (state.telegraphUntil > 0 || nowMs < state.nextAt) return;
    state.enemyTargets = this.nearbyTargets(enemy, enemies, CAMPAIGN_BOSS_TUNING.stormmawRadius, CAMPAIGN_BOSS_TUNING.stormmawMaximumTargets);
    if (!state.enemyTargets.length) { state.nextAt = nowMs + CAMPAIGN_BOSS_TUNING.stormmawIntervalMs; return; }
      state.phaseLabel = 'storm_surge';
    state.telegraphUntil = nowMs + CAMPAIGN_BOSS_TUNING.stormmawTelegraphMs;
    events.push({ boss: enemy, text: 'Stormmaw · Storm Surge gathering' });
  }

  private tickRegent(enemy: Enemy, state: BossState, hp: number, nowMs: number, events: CampaignBossEvent[]): void {
    if (state.telegraphUntil > 0) {
      if (nowMs < state.telegraphUntil) return;
      state.telegraphUntil = 0;
      state.summoned = true;
      state.phase = 2;
      state.phaseLabel = 'regent_decoys';
      events.push({
        boss: enemy, text: 'Umbral Regent · Two echoes emerge',
        summon: { enemyId: 'echo_shade', count: CAMPAIGN_BOSS_TUNING.regentMaximumClones, kind: 'regent-clone', ownerId: enemy.id, hpBonus: CAMPAIGN_BOSS_TUNING.regentCloneHpBonus }
      });
      return;
    }
    if (hp > CAMPAIGN_BOSS_TUNING.regentCloneHp || state.summoned) return;
    state.phaseLabel = 'regent_decoys';
    state.telegraphUntil = nowMs + CAMPAIGN_BOSS_TUNING.bossTransitionTelegraphMs;
    events.push({ boss: enemy, text: 'Umbral Regent · Echoes forming' });
  }

  private tickSovereign(enemy: Enemy, state: BossState, nowMs: number, events: CampaignBossEvent[]): void {
    if (state.telegraphUntil > 0 && nowMs >= state.telegraphUntil) {
      state.telegraphUntil = 0;
      state.jumpCount++;
      state.phase = state.jumpCount + 1;
      state.nextAt = nowMs + CAMPAIGN_BOSS_TUNING.sovereignIntervalMs;
      events.push({ boss: enemy, text: 'Rift Sovereign · Portal jump', routeAdvanceFraction: CAMPAIGN_BOSS_TUNING.sovereignRouteFraction });
      return;
    }
    if (state.telegraphUntil > 0 || state.jumpCount >= CAMPAIGN_BOSS_TUNING.sovereignMaximumJumps || nowMs < state.nextAt) return;
    state.phaseLabel = 'sovereign_portal';
    state.telegraphUntil = nowMs + CAMPAIGN_BOSS_TUNING.sovereignTelegraphMs;
    events.push({ boss: enemy, text: 'Rift Sovereign · Portal opening ahead' });
  }

  private tickDevourer(enemy: Enemy, state: BossState, hp: number, nowMs: number, events: CampaignBossEvent[]): void {
    const targetPhase = hp <= 0.2 ? 4 : hp <= 0.45 ? 3 : hp <= 0.7 ? 2 : 1;
    while (state.phase < targetPhase) {
      state.phase++;
      if (state.phase === 2) {
        state.phaseLabel = 'devourer_resistance';
        state.resistanceType = 'physical';
        state.resistanceMultiplier = CAMPAIGN_BOSS_TUNING.devourerResistanceMultiplier;
        state.nextAt = nowMs + CAMPAIGN_BOSS_TUNING.devourerResistanceIntervalMs;
        events.push({ boss: enemy, text: 'Aether Devourer · Resistance shift' });
      } else if (state.phase === 3) {
        state.phaseLabel = 'devourer_rift';
        state.resistanceType = null; state.resistanceMultiplier = 1;
        state.telegraphUntil = 0; state.jumpCount = 0;
        enemy.bossSpeedMultiplier = 1.22;
        state.nextAt = nowMs + CAMPAIGN_BOSS_TUNING.devourerPortalIntervalMs;
        events.push({ boss: enemy, text: 'Aether Devourer · Rift acceleration' });
      } else {
        state.phaseLabel = 'devourer_core';
        state.resistanceType = null; state.resistanceMultiplier = 1;
        state.telegraphUntil = 0;
        enemy.physicalArmor = 0.08; enemy.wardArmor = 0;
        enemy.damageTakenMultiplier = CAMPAIGN_BOSS_TUNING.tyrantCoreDamageMultiplier;
        enemy.bossSpeedMultiplier = 1.4;
        events.push({ boss: enemy, text: 'Aether Devourer · Exposed core' });
      }
    }
    if (state.phase === 2 && state.resistanceType && nowMs >= state.nextAt) {
      const steps = Math.floor((nowMs - state.nextAt) / CAMPAIGN_BOSS_TUNING.devourerResistanceIntervalMs) + 1;
      const current = RESISTANCE_TYPES.indexOf(state.resistanceType);
      state.resistanceType = RESISTANCE_TYPES[(current + steps) % RESISTANCE_TYPES.length];
      state.phase = 2;
      state.nextAt += steps * CAMPAIGN_BOSS_TUNING.devourerResistanceIntervalMs;
      events.push({ boss: enemy, text: `Aether Devourer · ${this.damageTypeName(state.resistanceType)} resistance` });
    }
    if (state.phase !== 3) return;
    if (state.telegraphUntil > 0 && nowMs >= state.telegraphUntil) {
      state.telegraphUntil = 0; state.jumpCount++;
      state.nextAt = nowMs + CAMPAIGN_BOSS_TUNING.devourerPortalIntervalMs;
      events.push({ boss: enemy, text: 'Aether Devourer · Rift jump', routeAdvanceFraction: CAMPAIGN_BOSS_TUNING.devourerPortalRouteFraction });
      return;
    }
    if (state.telegraphUntil > 0 || state.jumpCount >= CAMPAIGN_BOSS_TUNING.devourerPortalMaximumJumps || nowMs < state.nextAt) return;
    state.telegraphUntil = nowMs + CAMPAIGN_BOSS_TUNING.devourerPortalTelegraphMs;
    events.push({ boss: enemy, text: 'Aether Devourer · Rift portal opening' });
  }

  private tickWorldSupport(enemy: Enemy, enemies: readonly Enemy[], nowMs: number, events: CampaignBossEvent[]): void {
    const state = this.worldSupportStates.get(enemy.id);
    if (!state) return;
    if (enemy.campaignId === 'aetherbound') {
      if (nowMs < state.nextAt) return;
      state.nextAt = nowMs + CAMPAIGN_BOSS_TUNING.aetherboundIntervalMs;
      for (const target of this.nearbyAllies(enemy, enemies)) this.applyMitigation(target.id, enemy.id, nowMs + CAMPAIGN_BOSS_TUNING.aetherboundShieldDurationMs, CAMPAIGN_BOSS_TUNING.aetherboundShieldMultiplier);
      state.phaseLabel = 'aether_shield';
      state.phaseUntil = nowMs + CAMPAIGN_BOSS_TUNING.aetherboundShieldDurationMs;
      events.push({ boss: enemy, text: 'Aetherbound · Aether shields raised', presentationAction: 'buff' });
    } else if (enemy.campaignId === 'foundry_core') {
      if (nowMs < state.nextAt) return;
      state.nextAt = nowMs + CAMPAIGN_BOSS_TUNING.foundryCoreIntervalMs;
      for (const target of this.nearbyAllies(enemy, enemies)) this.applyMitigation(target.id, enemy.id, nowMs + CAMPAIGN_BOSS_TUNING.foundryCoreArmorDurationMs, CAMPAIGN_BOSS_TUNING.foundryCoreArmorMultiplier, ['physical']);
      state.phaseLabel = 'foundry_armor';
      state.phaseUntil = nowMs + CAMPAIGN_BOSS_TUNING.foundryCoreArmorDurationMs;
      events.push({ boss: enemy, text: 'Foundry Core · Nearby armor reinforced', presentationAction: 'buff' });
    } else if (enemy.campaignId === 'tempest_herald') {
      this.tickHasteSupport(enemy, enemies, state, nowMs, events, 'Tempest Herald', CAMPAIGN_BOSS_TUNING.tempestHeraldIntervalMs, CAMPAIGN_BOSS_TUNING.tempestHeraldTelegraphMs, CAMPAIGN_BOSS_TUNING.tempestHeraldDurationMs, 'tempest_haste', 'buff');
    } else if (enemy.campaignId === 'echo_shade') {
      this.tickEchoShade(enemy, state, nowMs, events);
    } else if (enemy.campaignId === 'rift_weaver') {
      if (state.telegraphUntil > 0 && nowMs >= state.telegraphUntil) {
        state.telegraphUntil = 0; state.casts++;
        state.nextAt = nowMs + CAMPAIGN_BOSS_TUNING.riftWeaverIntervalMs;
        state.phaseLabel = 'rift_jump';
        events.push({ boss: enemy, text: 'Rift Weaver · Phase jump', presentationAction: 'buff', routeAdvanceFraction: CAMPAIGN_BOSS_TUNING.riftWeaverRouteFraction });
      } else if (!state.telegraphUntil && !state.casts && nowMs >= state.nextAt) {
        state.phaseLabel = 'rift_jump';
        state.telegraphUntil = nowMs + CAMPAIGN_BOSS_TUNING.riftWeaverTelegraphMs;
        events.push({ boss: enemy, text: 'Rift Weaver · Phase jump gathering' });
      }
    } else if (enemy.campaignId === 'crown_archon') {
      if (nowMs < state.nextAt) return;
      state.nextAt = nowMs + CAMPAIGN_BOSS_TUNING.crownArchonIntervalMs;
      for (const target of this.nearbyAllies(enemy, enemies)) this.applyMitigation(target.id, enemy.id, nowMs + CAMPAIGN_BOSS_TUNING.crownArchonWardDurationMs, CAMPAIGN_BOSS_TUNING.crownArchonWardMultiplier, ['arcane', 'elemental']);
      state.phaseLabel = 'crown_ward';
      state.phaseUntil = nowMs + CAMPAIGN_BOSS_TUNING.crownArchonWardDurationMs;
      events.push({ boss: enemy, text: 'Crown Archon · Aether ward raised', presentationAction: 'buff' });
    }
  }

  private tickHasteSupport(enemy: Enemy, enemies: readonly Enemy[], state: WorldSupportState, nowMs: number, events: CampaignBossEvent[], name: string, intervalMs: number, telegraphMs: number, durationMs: number, label: CampaignBossPhaseLabel, presentationAction?: CampaignBossEvent['presentationAction']): void {
    if (state.telegraphUntil > 0 && nowMs >= state.telegraphUntil) {
      for (const targetId of state.targetIds) {
        const target = enemies.find(candidate => candidate.id === targetId && candidate.alive);
        if (target) target.speedBuffUntil = Math.max(target.speedBuffUntil, nowMs + durationMs);
      }
      state.targetIds = []; state.telegraphUntil = 0; state.nextAt = nowMs + intervalMs;
      events.push({ boss: enemy, text: `${name} · Nearby enemies hastened`, ...(presentationAction ? { presentationAction } : {}) });
      return;
    }
    if (state.telegraphUntil > 0 || nowMs < state.nextAt) return;
    state.targetIds = this.nearbyTargets(enemy, enemies, CAMPAIGN_BATTLE_TUNING.supportRadius, CAMPAIGN_BOSS_TUNING.stormmawMaximumTargets);
    if (!state.targetIds.length) { state.nextAt = nowMs + intervalMs; return; }
    state.phaseLabel = label; state.telegraphUntil = nowMs + telegraphMs;
    events.push({ boss: enemy, text: `${name} · Haste gathering` });
  }

  private tickEchoShade(enemy: Enemy, state: WorldSupportState, nowMs: number, events: CampaignBossEvent[]): void {
    if (state.telegraphUntil > 0 && nowMs >= state.telegraphUntil) {
      state.telegraphUntil = 0; state.casts++;
      events.push({
        boss: enemy, text: 'Echo Shade · Decoys emerge', presentationAction: 'buff',
        summon: { enemyId: 'echo_shade', count: CAMPAIGN_BOSS_TUNING.echoShadeMaximumDecoys, kind: 'echo-decoy', ownerId: enemy.id, hpBonus: CAMPAIGN_BOSS_TUNING.echoShadeHpBonus }
      });
      return;
    }
    if (state.casts || state.telegraphUntil || nowMs < state.nextAt) return;
    state.phaseLabel = 'echo_decoys'; state.telegraphUntil = nowMs + CAMPAIGN_BOSS_TUNING.echoShadeTelegraphMs;
    events.push({ boss: enemy, text: 'Echo Shade · Doubles forming' });
  }

  private nearbyTargets(enemy: Enemy, enemies: readonly Enemy[], radius: number, maximum: number): number[] {
    return enemies.filter(target => target.alive && target.id !== enemy.id && !target.isBoss && !target.campaignCloneKind && Math.hypot(target.x - enemy.x, target.y - enemy.y) <= radius)
      .sort((a, b) => Math.hypot(a.x - enemy.x, a.y - enemy.y) - Math.hypot(b.x - enemy.x, b.y - enemy.y) || a.id - b.id)
      .slice(0, maximum).map(target => target.id);
  }

  private nearbyAllies(enemy: Enemy, enemies: readonly Enemy[]): Enemy[] {
    return enemies.filter(target => target.alive && target.id !== enemy.id && !target.isBoss && !target.campaignCloneKind && Math.hypot(target.x - enemy.x, target.y - enemy.y) <= CAMPAIGN_BATTLE_TUNING.supportRadius)
      .sort((a, b) => Math.hypot(a.x - enemy.x, a.y - enemy.y) - Math.hypot(b.x - enemy.x, b.y - enemy.y) || a.id - b.id)
      .slice(0, CAMPAIGN_BOSS_TUNING.stormmawMaximumTargets);
  }

  private applyMitigation(targetId: number, sourceId: number, untilMs: number, multiplier: number, damageTypes?: readonly DamageType[]): void {
    const sources = this.temporaryMitigation.get(targetId) ?? new Map<number, TemporaryMitigation>();
    sources.set(sourceId, { sourceId, untilMs, multiplier, damageTypes });
    this.temporaryMitigation.set(targetId, sources);
  }

  private pruneTemporaryMitigation(enemies: readonly Enemy[], nowMs: number): void {
    const liveIds = new Set(enemies.filter(enemy => enemy.alive).map(enemy => enemy.id));
    for (const [targetId, sources] of this.temporaryMitigation) {
      for (const [sourceId, effect] of sources) if (nowMs >= effect.untilMs || !liveIds.has(sourceId) || !liveIds.has(targetId)) sources.delete(sourceId);
      if (!sources.size) this.temporaryMitigation.delete(targetId);
    }
  }

  private isTemporarilyGuarded(enemyId: number, nowMs: number): boolean {
    for (const effect of this.temporaryMitigation.get(enemyId)?.values() ?? []) if (nowMs < effect.untilMs) return true;
    return false;
  }

  private initialBossDelay(campaignId: string | null): number {
    if (campaignId === 'mireheart_hydra') return 0;
    if (campaignId === 'hollow_warden') return CAMPAIGN_BOSS_TUNING.shieldIntervalMs;
    if (campaignId === 'drowned_oracle') return CAMPAIGN_BOSS_TUNING.oracleResistanceIntervalMs;
    if (campaignId === 'stormmaw_prime') return CAMPAIGN_BOSS_TUNING.stormmawIntervalMs;
    if (campaignId === 'rift_sovereign') return CAMPAIGN_BOSS_TUNING.sovereignIntervalMs;
    if (campaignId === 'aether_devourer') return CAMPAIGN_BOSS_TUNING.devourerResistanceIntervalMs;
    return CAMPAIGN_BOSS_TUNING.freezeIntervalMs;
  }

  private worldSupportInterval(campaignId: string): number | null {
    if (campaignId === 'aetherbound') return CAMPAIGN_BOSS_TUNING.aetherboundIntervalMs;
    if (campaignId === 'foundry_core') return CAMPAIGN_BOSS_TUNING.foundryCoreIntervalMs;
    if (campaignId === 'tempest_herald') return CAMPAIGN_BOSS_TUNING.tempestHeraldIntervalMs;
    if (campaignId === 'echo_shade') return CAMPAIGN_BOSS_TUNING.echoShadeIntervalMs;
    if (campaignId === 'rift_weaver') return CAMPAIGN_BOSS_TUNING.riftWeaverIntervalMs;
    if (campaignId === 'crown_archon') return CAMPAIGN_BOSS_TUNING.crownArchonIntervalMs;
    return null;
  }

  private oracleLabel(damageType: DamageType): CampaignBossPhaseLabel {
    return damageType === 'physical' ? 'oracle_physical' : damageType === 'arcane' ? 'oracle_arcane' : 'oracle_elemental';
  }

  private damageTypeName(damageType: DamageType): string {
    return damageType[0].toUpperCase() + damageType.slice(1);
  }

  presentation(enemyId: number, nowMs: number): CampaignBossPresentation {
    const state = this.states.get(enemyId);
    const support = this.worldSupportStates.get(enemyId);
    const result: CampaignBossPresentation = {
      phase: state?.phase ?? 1,
      telegraph: (!!state?.telegraphUntil && nowMs < state.telegraphUntil) || (!!support?.telegraphUntil && nowMs < support.telegraphUntil),
      guarded: (!!state && nowMs < state.shieldUntil) || this.isTemporarilyGuarded(enemyId, nowMs)
    };
    const supportPhaseLabel = support?.phaseUntil !== undefined && nowMs >= support.phaseUntil ? undefined : support?.phaseLabel;
    const phaseLabel = state?.phaseLabel ?? supportPhaseLabel ?? this.clonePhaseLabels.get(enemyId);
    if (phaseLabel) result.phaseLabel = phaseLabel;
    if (state?.resistanceType) result.resistanceType = state.resistanceType;
    const cloneCount = this.ownedSummons.get(enemyId)?.size ?? 0;
    if (cloneCount > 0) result.cloneCount = cloneCount;
    return result;
  }

  telegraphTargets(): readonly number[] { return Array.from(this.states.values()).flatMap(state => state.targets); }

  telegraphEnemyTargets(): readonly number[] {
    return [...Array.from(this.states.values()).flatMap(state => state.enemyTargets), ...Array.from(this.worldSupportStates.values()).flatMap(state => state.targetIds)];
  }

  remove(enemyId: number): number[] {
    const owned = [...(this.ownedSummons.get(enemyId) ?? [])];
    this.ownedSummons.delete(enemyId);
    for (const childId of owned) { this.summonOwnerById.delete(childId); this.clonePhaseLabels.delete(childId); }
    const ownerId = this.summonOwnerById.get(enemyId);
    if (ownerId !== undefined) {
      const ownerSet = this.ownedSummons.get(ownerId);
      ownerSet?.delete(enemyId);
      if (ownerSet && !ownerSet.size) this.ownedSummons.delete(ownerId);
      this.summonOwnerById.delete(enemyId);
    }
    this.states.delete(enemyId); this.supportNextAt.delete(enemyId); this.rootwretchHealNextAt.delete(enemyId);
    this.worldSupportStates.delete(enemyId); this.temporaryMitigation.delete(enemyId); this.clonePhaseLabels.delete(enemyId);
    for (const sources of this.temporaryMitigation.values()) sources.delete(enemyId);
    return owned;
  }

  clear(): void {
    this.states.clear(); this.supportNextAt.clear(); this.rootwretchHealNextAt.clear(); this.worldSupportStates.clear();
    this.temporaryMitigation.clear(); this.ownedSummons.clear(); this.summonOwnerById.clear(); this.clonePhaseLabels.clear();
  }
}
