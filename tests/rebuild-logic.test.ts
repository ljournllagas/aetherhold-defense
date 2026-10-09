import { describe, expect, it } from 'vitest';
import { TOWERS } from '../src/game/config/towers.ts';
import { FULL_REWARD_CHOICES, rewardDisposition } from '../src/game/systems/RewardSystem.ts';
import { stepProjectile } from '../src/game/systems/ProjectileSystem.ts';

describe('shared rebuild logic', () => {
  it('keeps asset, audio, and projectile settings on every tower config', () => {
    expect(Object.values(TOWERS).map((tower) => tower.name)).toEqual(['Ranger', 'Bombard', 'Frost', 'Arcane', 'Tempest']);
    for (const tower of Object.values(TOWERS)) {
      expect(tower.assetKey).toBe(`tower_${tower.id}`);
      expect(tower.audioKey.length).toBeGreaterThan(0);
      expect(tower.projectileSpeed).toBeGreaterThan(0);
    }
  });

  it('advances projectiles in game time and clamps at impact', () => {
    const projectile = { elapsedMs: 0, durationMs: 100 };
    expect(stepProjectile(projectile, 40)).toBe(false);
    expect(projectile.elapsedMs).toBe(40);
    expect(stepProjectile(projectile, -20)).toBe(false);
    expect(projectile.elapsedMs).toBe(40);
    expect(stepProjectile(projectile, 100)).toBe(true);
    expect(projectile.elapsedMs).toBe(100);
    expect(stepProjectile({ elapsedMs: 0, durationMs: 0 }, 0)).toBe(true);
  });

  it('counts a targeted reward against storage and preserves explicit choices without queue caps', () => {
    expect(rewardDisposition(2, 0)).toEqual({ kind: 'store' });
    expect(rewardDisposition(2, 1)).toEqual({ kind: 'queue' });
    expect(rewardDisposition(2, 0, 1)).toEqual({ kind: 'full', choices: FULL_REWARD_CHOICES });
    expect(rewardDisposition(3, 0)).toEqual({ kind: 'full', choices: FULL_REWARD_CHOICES });
    expect(rewardDisposition(3, 1000)).toEqual({ kind: 'queue' });
    expect(FULL_REWARD_CHOICES).toEqual(['use-oldest', 'replace-oldest', 'discard-new']);
  });
});
