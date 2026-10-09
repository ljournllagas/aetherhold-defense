import type { TowerLevelStats } from './types.ts';
import type { TargetCandidate } from '../game/systems/CombatSystem.ts';

export type TowerId = 'longbow' | 'ember' | 'glacier' | 'starfire' | 'tempest';
export type BranchId = 'marksman' | 'volley' | 'siegebreaker' | 'flame-mortar' | 'winterguard' | 'brittle-ice' | 'spellbreaker' | 'arcane-beacon' | 'stormcaller' | 'thunderlord';
export type EvolutionRank = 0 | 1 | 2 | 3;
export interface EvolutionState { foundationLevel: number; branchId: BranchId | null; rank: EvolutionRank | null; masteryRank: number; invested: number; revision: number; }
export type RunOutcome = 'victory' | 'defeat' | 'siege-failed';
export interface ResultProgress { highestWave: number; wavesCompleted: number; outcome: RunOutcome; siegeBossesDefeated: number; }
export const SIEGE_BOSS_BIT: Readonly<Record<10 | 20 | 30, number>> = { 10: 1, 20: 2, 30: 4 };
export interface HitCounter { successes: number; }
export interface EffectiveTowerStats extends TowerLevelStats {
  bossDamageMultiplier: number; physicalArmorScale: number; wardArmorScale: number; volleyTargets: number; burningField: boolean;
  vulnerabilityMultiplier: number; vulnerabilityMs: number; auraDamageMultiplier: number; auraRange: number;
  control: 'freeze' | 'stun' | null; controlMs: number; bossControlMs: number;
}
export interface CombatTower { id: number; towerId: TowerId; x: number; y: number; progression: EvolutionState; counter: HitCounter; }
export interface ShotSnapshot { ownerId: number; towerId: TowerId; branchId: BranchId | null; stats: EffectiveTowerStats; rawDamage: number; primary: boolean; counter: HitCounter; }
export interface CombatVictim extends TargetCandidate { alive: boolean; isBoss: boolean; physicalArmor: number; wardArmor: number; }
