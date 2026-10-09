import { POWERUP_LIST, RARITY_WEIGHTS } from '../config/powerUps.ts';
import type { PowerUpId, PowerUpRarity } from '../../shared/types.ts';

export function rollRarity(rand: () => number = Math.random): PowerUpRarity {
  const total = RARITY_WEIGHTS.common + RARITY_WEIGHTS.uncommon + RARITY_WEIGHTS.rare + RARITY_WEIGHTS.legendary;
  const r = rand() * total;
  if (r < RARITY_WEIGHTS.common) return 'common';
  if (r < RARITY_WEIGHTS.common + RARITY_WEIGHTS.uncommon) return 'uncommon';
  if (r < RARITY_WEIGHTS.common + RARITY_WEIGHTS.uncommon + RARITY_WEIGHTS.rare) return 'rare';
  return 'legendary';
}

export function rollPowerUp(rand: () => number = Math.random): PowerUpId {
  const rarity = rollRarity(rand);
  const pool = POWERUP_LIST.filter((p) => p.rarity === rarity);
  const list = pool.length > 0 ? pool : POWERUP_LIST;
  const idx = Math.floor(rand() * list.length);
  return list[Math.min(idx, list.length - 1)].id;
}

export function shouldDropOnKill(rand: () => number = Math.random, chance = 0.008): boolean {
  return rand() < chance;
}
