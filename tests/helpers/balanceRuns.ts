import type { SimulationOptions } from './simulationBot.ts';

/**
 * The accepted reference scenarios for the fixed-strategy balance evidence.
 *
 * The first five keep the historical labels/seeds so archived traces stay
 * comparable. The last three are Medium no-gold variants of seeds 1/2/3: they
 * mirror their base run's profile (difficulty, seed, unlock set) and differ only
 * in `goldRelics: 'disabled'`, so an economy difference is attributable to the
 * gold-producing relics alone. All three finish the siege at wave 30 so they
 * produce a terminal payload rather than an endless checkpoint.
 *
 * This is test data for the acceptance suite and the opt-in report/candidate
 * runners; it is not runtime configuration.
 */
export const BALANCE_RUNS: readonly SimulationOptions[] = [
  { label: 'medium-starter-1', difficulty: 'medium', seed: 1, unlockAll: false, throughWave: 30, continueEndless: false },
  { label: 'medium-starter-2', difficulty: 'medium', seed: 2, unlockAll: false, throughWave: 40, continueEndless: true },
  { label: 'medium-unlocked-1', difficulty: 'medium', seed: 3, unlockAll: true, throughWave: 30, continueEndless: false },
  { label: 'easy-1', difficulty: 'easy', seed: 4, unlockAll: false, throughWave: 30, continueEndless: false },
  { label: 'hard-1', difficulty: 'hard', seed: 5, unlockAll: false, throughWave: 30, continueEndless: false },
  { label: 'medium-nogold-1', difficulty: 'medium', seed: 1, unlockAll: false, throughWave: 30, continueEndless: false, goldRelics: 'disabled' },
  { label: 'medium-nogold-2', difficulty: 'medium', seed: 2, unlockAll: false, throughWave: 30, continueEndless: false, goldRelics: 'disabled' },
  { label: 'medium-nogold-3', difficulty: 'medium', seed: 3, unlockAll: true, throughWave: 30, continueEndless: false, goldRelics: 'disabled' }
];
