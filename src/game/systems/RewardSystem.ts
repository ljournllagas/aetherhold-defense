import { POWERUP_INVENTORY_LIMIT } from '../config/powerUps.ts';

export const FULL_REWARD_CHOICES = ['use-oldest', 'replace-oldest', 'discard-new'] as const;
export type FullRewardChoice = typeof FULL_REWARD_CHOICES[number];
export type RewardDisposition =
  | { kind: 'store' }
  | { kind: 'queue' }
  | { kind: 'full'; choices: typeof FULL_REWARD_CHOICES };

/**
 * pendingRewardsAhead is the number of older rewards awaiting resolution.
 * Pending rewards are unbounded; each queued reward remains until resolved.
 * When a reward reaches the head of the queue, call with pendingRewardsAhead=0.
 * A targeted reward still occupies a slot until targeting commits; pass it in
 * reservedCount if the caller temporarily removes it from the stored array.
 */
export function rewardDisposition(
  inventoryCount: number,
  pendingRewardsAhead: number,
  reservedCount = 0
): RewardDisposition {
  if (pendingRewardsAhead > 0) return { kind: 'queue' };
  if (inventoryCount + reservedCount < POWERUP_INVENTORY_LIMIT) return { kind: 'store' };
  return { kind: 'full', choices: FULL_REWARD_CHOICES };
}
