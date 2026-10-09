import { ECONOMY } from '../config/economy.ts';
import { refundForInvested, towerTotalInvested } from '../config/towers.ts';
import type { DifficultyConfig } from '../../shared/types.ts';

export function killReward(baseReward: number, difficulty: DifficultyConfig, doubleBountyActive: boolean): number {
  let r = baseReward * difficulty.goldRewardMultiplier;
  if (doubleBountyActive) r *= 2;
  return Math.max(1, Math.floor(r));
}

export function waveClearBonus(wave: number): number {
  return ECONOMY.waveClearBonusBase + wave * ECONOMY.waveClearBonusPerWave;
}

export function canAfford(gold: number, cost: number): boolean {
  return gold >= cost;
}

export function sellRefund(towerId: string, level: number): number {
  return refundForInvested(towerTotalInvested(towerId, level));
}
