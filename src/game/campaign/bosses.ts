import type { Enemy } from '../entities/Enemy.ts';
import type { Tower } from '../entities/Tower.ts';
import { CAMPAIGN_BATTLE_TUNING } from './battle.ts';

export const CAMPAIGN_BOSS_TUNING = {
  shieldIntervalMs: 8000, shieldDurationMs: 2500, shieldDamageMultiplier: 0.55,
  wardenSummonHp: 0.5, wardenSummonCount: 3, wardenEnrageHp: 0.25, wardenEnrageSpeed: 1.2,
  colossusBreakHp: 0.65, colossusCoreHp: 0.3, colossusCoreDamageMultiplier: 1.3,
  freezeIntervalMs: 7500, freezeTelegraphMs: 1500, towerFreezeMs: 3000, matriarchSecondPhaseHp: 0.5
} as const;

interface BossState { nextAt: number; shieldUntil: number; summoned: boolean; phase: number; targets: number[]; telegraphUntil: number; }
export interface CampaignBossEvent { boss: Enemy; text: string; summon?: { enemyId: string; count: number }; }

/** Only simulation time enters this system. Pause, speed, and restart share the combat clock. */
export class CampaignBossSystem {
  private states = new Map<number, BossState>();
  private supportNextAt = new Map<number, number>();

  register(enemy: Enemy, nowMs: number): void {
    if (enemy.isBoss) this.states.set(enemy.id, { nextAt: nowMs + (enemy.campaignId === 'hollow_warden' ? CAMPAIGN_BOSS_TUNING.shieldIntervalMs : CAMPAIGN_BOSS_TUNING.freezeIntervalMs), shieldUntil: enemy.campaignId === 'hollow_warden' ? nowMs + CAMPAIGN_BOSS_TUNING.shieldDurationMs : 0, summoned: false, phase: 1, targets: [], telegraphUntil: 0 });
    else this.supportNextAt.set(enemy.id, nowMs + CAMPAIGN_BATTLE_TUNING.supportIntervalMs);
  }

  tick(enemies: readonly Enemy[], towers: readonly Tower[], nowMs: number): CampaignBossEvent[] {
    const events: CampaignBossEvent[] = [];
    for (const enemy of enemies) {
      if (!enemy.alive || !enemy.campaignId) continue;
      if (enemy.campaignId === 'ashcaller' || enemy.campaignId === 'frost_shaman') {
        if (nowMs >= (this.supportNextAt.get(enemy.id) ?? Infinity)) {
          this.supportNextAt.set(enemy.id, nowMs + CAMPAIGN_BATTLE_TUNING.supportIntervalMs);
          for (const ally of enemies) if (ally.alive && Math.hypot(ally.x - enemy.x, ally.y - enemy.y) <= CAMPAIGN_BATTLE_TUNING.supportRadius) {
            if (enemy.campaignId === 'ashcaller') ally.speedBuffUntil = nowMs + CAMPAIGN_BATTLE_TUNING.supportDurationMs;
            else ally.slowResistanceUntil = nowMs + CAMPAIGN_BATTLE_TUNING.supportDurationMs;
          }
          events.push({ boss: enemy, text: enemy.campaignId === 'ashcaller' ? 'Ashcaller · Speed aura' : 'Frost Shaman · Slow ward' });
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
      }
    }
    return events;
  }

  phase(enemyId: number): number { return this.states.get(enemyId)?.phase ?? 1; }
  presentation(enemyId: number, nowMs: number): { phase: number; telegraph: boolean; guarded: boolean } {
    const state = this.states.get(enemyId);
    return { phase: state?.phase ?? 1, telegraph: !!state?.telegraphUntil && nowMs < state.telegraphUntil, guarded: !!state && nowMs < state.shieldUntil };
  }
  telegraphTargets(): readonly number[] { return Array.from(this.states.values()).flatMap(s => s.targets); }
  remove(enemyId: number): void { this.states.delete(enemyId); this.supportNextAt.delete(enemyId); }
  clear(): void { this.states.clear(); this.supportNextAt.clear(); }
}
