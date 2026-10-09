import type { PowerUpConfig, PowerUpId, PowerUpRarity } from '../../shared/types.ts';

export const POWERUP_INVENTORY_LIMIT = 3;

// Existing effect coefficients, shared by presentation and run-time application.
export const POWERUP_EFFECTS = {
  gold: { base: 120, perWave: 12 },
  meteor: { radius: 110, damage: 400, perWave: 15 },
  freezeMs: 4000,
  tempo: { durationMs: 10000, intervalMultiplier: 0.625 },
  surge: { durationMs: 12000, damageMultiplier: 1.5 },
  repairLives: 4,
  doubleBountyMs: 20000,
  overcharge: { durationMs: 15000, damageMultiplier: 3 },
  blessing: { coinChance: 0.4, repairThreshold: 0.7, goldBase: 150, goldPerWave: 10, repairLives: 2 }
} as const;

export const RARITY_WEIGHTS: Record<PowerUpRarity, number> = {
  common: 55,
  uncommon: 28,
  rare: 13,
  legendary: 4
};

export const POWERUPS: Record<PowerUpId, PowerUpConfig> = {
  gold_rush: { id: 'gold_rush', name: 'Gold Rush', description: `Gain ${POWERUP_EFFECTS.gold.base} gold + ${POWERUP_EFFECTS.gold.perWave} per wave.`, rarity: 'common', color: 0xffd54f, requiresTarget: false },
  meteor_strike: { id: 'meteor_strike', name: 'Meteor', description: `Target a blast: ${POWERUP_EFFECTS.meteor.damage} damage + ${POWERUP_EFFECTS.meteor.perWave} per wave.`, rarity: 'uncommon', color: 0xff5722, requiresTarget: true },
  time_freeze: { id: 'time_freeze', name: 'Time Lock', description: 'Freeze all enemies for 4s.', rarity: 'rare', color: 0x80deea, requiresTarget: false },
  battle_cry: { id: 'battle_cry', name: 'Battle Tempo', description: '+60% attack speed for all towers, 10s.', rarity: 'uncommon', color: 0xff8a65, requiresTarget: false },
  arcane_surge: { id: 'arcane_surge', name: 'Arcane Surge', description: '+50% tower damage, 12s.', rarity: 'uncommon', color: 0xce93d8, requiresTarget: false },
  emergency_repair: { id: 'emergency_repair', name: 'Stronghold Repair', description: 'Restore +4 lives (capped at max).', rarity: 'rare', color: 0xa5d6a7, requiresTarget: false },
  treasure_goblin: { id: 'treasure_goblin', name: 'Treasure Creature', description: 'Summon a fleeing Pilferer worth a fortune.', rarity: 'rare', color: 0xffd700, requiresTarget: false },
  double_bounty: { id: 'double_bounty', name: 'Double Bounty', description: 'Double gold from kills for 20s.', rarity: 'uncommon', color: 0xfff176, requiresTarget: false },
  tower_overcharge: { id: 'tower_overcharge', name: 'Tower Overcharge', description: 'Random tower: 3x damage, 15s.', rarity: 'rare', color: 0x82b1ff, requiresTarget: false },
  ancient_blessing: { id: 'ancient_blessing', name: 'Ancient Blessing', description: 'Random gift: gold, repair, or surge.', rarity: 'legendary', color: 0xe1bee7, requiresTarget: false }
};

export const POWERUP_LIST = Object.values(POWERUPS);

// Chance tuning
export const POWERUP_DROP_CHANCE_PER_KILL = 0.008;
export const POWERUP_BOSS_GUARANTEED = true;
export const POWERUP_WAVE_MILESTONE_EVERY = 5;
export const POWERUP_WAVE_MILESTONE_CHANCE = 0.6;
