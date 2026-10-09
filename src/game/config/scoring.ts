// Scoring tuning, centralized (SPEC §28, §38).
export const SCORING = {
  killScoreBase: 10,
  eliteKillBonus: 15,
  waveBonusBase: 50,
  waveBonusPerWave: 25,
  bossBonus: 500,
  bossBonusPerBossTier: 250,
  lifeBonusPerLife: 30,
  maxReasonableScore: 10_000_000,
  maxReasonableWave: 500,
  maxReasonableKills: 100_000
};
