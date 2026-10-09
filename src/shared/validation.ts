import { DIFFICULTIES } from '../game/config/difficulties.ts';
import { ECONOMY } from '../game/config/economy.ts';
import { ENEMIES } from '../game/config/enemies.ts';
import {
  POWERUPS,
  POWERUP_BOSS_GUARANTEED,
  POWERUP_DROP_CHANCE_PER_KILL,
  POWERUP_LIST,
  RARITY_WEIGHTS
} from '../game/config/powerUps.ts';
import { SCORING } from '../game/config/scoring.ts';
import { buildWave, totalEnemiesInWave } from '../game/systems/WaveSystem.ts';
import { calculateScore } from '../game/systems/ScoreSystem.ts';
import { GAME_VERSION, SCORE_VERSION } from './version.ts';
import type { DifficultyId, GameResultPayload } from './types.ts';
import type { ResultProgress, RunOutcome } from './progression.ts';
import { resultProgressErrors } from './resultProgress.ts';
import { validatePlayerName } from './playerName.ts';

export { SCORE_VERSION, GAME_VERSION };

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  sanitizedName: string;
}

const RUN_ID_RE = /^[A-Za-z0-9\-_]{8,64}$/;
const MAX_GAME_SPEED = 3;
const MAX_GAME_DURATION_SECONDS = 24 * 3600;
const MAX_REPAIR_LIVES_PER_REWARD = 4;
const ANCIENT_BLESSING_REPAIR_CHANCE = 0.3;
const MIN_PLAUSIBLE_REPAIR_TAIL = 0.0001;

function repairProbabilityPerPowerup(): number {
  const totalRarityWeight = Object.values(RARITY_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
  const repair = POWERUPS.emergency_repair;
  const repairRarityPoolSize = POWERUP_LIST.filter((powerup) => powerup.rarity === repair.rarity).length;
  const directRepairChance = repairRarityPoolSize > 0
    ? RARITY_WEIGHTS[repair.rarity] / totalRarityWeight / repairRarityPoolSize
    : 0;
  const blessing = POWERUPS.ancient_blessing;
  const blessingRepairChance = RARITY_WEIGHTS[blessing.rarity] / totalRarityWeight * ANCIENT_BLESSING_REPAIR_CHANCE;
  return directRepairChance + blessingRepairChance;
}

function binomialPmf(trials: number, probability: number): number[] {
  const pmf = [Math.pow(1 - probability, trials)];
  let cumulative = pmf[0];
  let term = pmf[0];
  for (let successes = 1; successes <= trials; successes++) {
    term *= ((trials - successes + 1) / successes) * (probability / (1 - probability));
    pmf.push(term);
    cumulative += term;
    // Preserve the quantile tail while bounding work for the 100k-kill input cap.
    if (cumulative >= 1 - 1e-12) break;
  }
  return pmf;
}

function plausibleRepairCount(nonBossKills: number, guaranteedRewardRolls: number): number {
  const repairChance = repairProbabilityPerPowerup();
  const killRepairChance = POWERUP_DROP_CHANCE_PER_KILL * repairChance;
  const fromKills = binomialPmf(nonBossKills, killRepairChance);
  const fromGuaranteedRewards = binomialPmf(guaranteedRewardRolls, repairChance);
  const combined = new Array(fromKills.length + fromGuaranteedRewards.length - 1).fill(0) as number[];
  fromKills.forEach((left, i) => {
    fromGuaranteedRewards.forEach((right, j) => { combined[i + j] += left * right; });
  });

  // Keep repair totals whose configured RNG tail is at least 0.01%. For each
  // repair count k, evaluate P(R >= k) after accumulating outcomes below k.
  let belowEvents = 0;
  for (let events = 1; events < combined.length; events++) {
    belowEvents += combined[events - 1];
    if (1 - belowEvents < MIN_PLAUSIBLE_REPAIR_TAIL) return events - 1;
  }
  return combined.length - 1;
}

function countMilestoneRewards(completedWaves: number): number {
  let count = 0;
  for (let wave = 5; wave <= completedWaves; wave += 5) {
    if (wave % 10 !== 0) count++;
  }
  return count;
}

function waveSpawnFinishMs(waveNumber: number, difficulty: DifficultyId): number {
  const wave = buildWave(waveNumber, DIFFICULTIES[difficulty].enemyCountMultiplier);
  return 800 + Math.max(...wave.groups.map((group) =>
    group.delayBefore * 1000 + Math.max(0, group.count - 1) * group.spawnInterval * 1000
  ));
}

function minimumNonBossKillsBeforeWave(
  wavesCompleted: number,
  remainingLives: number,
  difficulty: DifficultyId,
  enemiesKilled: number,
  bossesKilled: number,
  completedScheduledBosses: number
): number {
  const completedWaves = wavesCompleted;
  let leakedLives = 0;
  const nonBossLeakCounts = new Map<number, number>();
  const completedBossLeaks: number[] = [];
  for (let waveNumber = 1; waveNumber <= completedWaves; waveNumber++) {
    for (const group of buildWave(waveNumber, DIFFICULTIES[difficulty].enemyCountMultiplier).groups) {
      const leak = ENEMIES[group.enemyId].livesLost;
      leakedLives += leak * group.count;
      if (ENEMIES[group.enemyId].isBoss) {
        for (let i = 0; i < group.count; i++) completedBossLeaks.push(leak);
      } else {
        nonBossLeakCounts.set(leak, (nonBossLeakCounts.get(leak) ?? 0) + group.count);
      }
    }
  }

  const config = DIFFICULTIES[difficulty];
  const guaranteedBossRewards = POWERUP_BOSS_GUARANTEED
    ? Math.min(bossesKilled, completedScheduledBosses)
    : 0;
  const guaranteedRewardRolls = countMilestoneRewards(completedWaves) + guaranteedBossRewards;
  const nonBossKills = Math.max(0, enemiesKilled - bossesKilled);
  const allowedRepairCount = plausibleRepairCount(nonBossKills, guaranteedRewardRolls);
  const repairBudget = allowedRepairCount * MAX_REPAIR_LIVES_PER_REWARD;
  // Lives lost over the completed waves cannot exceed the starting lives minus
  // the lives still remaining (at least one) plus repairs.
  let leakToPrevent = leakedLives - (config.startingLives - Math.max(1, remainingLives) + repairBudget);
  if (leakToPrevent <= 0) return 0;

  // Only claimed kills of bosses from already completed waves can prevent
  // their five-life leaks; an unclaimed boss cannot be credited as a kill.
  const creditedBossKills = Math.min(bossesKilled, completedBossLeaks.length);
  completedBossLeaks.sort((a, b) => b - a);
  for (let i = 0; i < creditedBossKills; i++) leakToPrevent -= completedBossLeaks[i];
  if (leakToPrevent <= 0) return 0;

  // ponytail: model kills as preventing only their configured leak damage. The
  // repair allowance uses configured drops/reward rolls and a bounded RNG tail;
  // signed run events remain the upgrade path for authoritative replay checks.
  let requiredNonBossKills = 0;
  for (const leak of [...nonBossLeakCounts.keys()].sort((a, b) => b - a)) {
    const count = nonBossLeakCounts.get(leak) ?? 0;
    const killsAtThisLeak = Math.min(count, Math.ceil(leakToPrevent / leak));
    requiredNonBossKills += killsAtThisLeak;
    leakToPrevent -= killsAtThisLeak * leak;
    if (leakToPrevent <= 0) break;
  }
  return leakToPrevent > 0 ? Number.POSITIVE_INFINITY : requiredNonBossKills;
}

function scoreFloor(payload: Pick<GameResultPayload, 'wavesCompleted' | 'enemiesKilled' | 'bossesKilled' | 'remainingLives'>, difficulty: DifficultyId): number {
  return calculateScore({
    enemiesKilled: payload.enemiesKilled,
    elitesKilled: 0,
    wavesCompleted: payload.wavesCompleted,
    bossesKilled: payload.bossesKilled,
    remainingLives: payload.remainingLives,
    unusedGold: 0
  }, DIFFICULTIES[difficulty]).finalScore;
}

function scoreCeiling(
  payload: Pick<GameResultPayload, 'highestWave' | 'wavesCompleted' | 'enemiesKilled' | 'bossesKilled'>,
  difficulty: DifficultyId
): number {
  const config = DIFFICULTIES[difficulty];
  const milestoneRewards = countMilestoneRewards(payload.wavesCompleted);
  const rewardCount = milestoneRewards + payload.bossesKilled + payload.enemiesKilled;
  const maximumKillGold = Math.floor(Math.max(...Object.values(ENEMIES).map((enemy) => enemy.baseReward)) * config.goldRewardMultiplier * 2);
  const maximumPowerupGold = Math.max(120 + payload.highestWave * 12, 150 + payload.highestWave * 10, 100);
  let maximumWaveGold = 0;
  for (let wave = 1; wave <= payload.highestWave; wave++) {
    maximumWaveGold += ECONOMY.waveClearBonusBase + ECONOMY.waveClearBonusPerWave * wave;
  }
  maximumWaveGold += payload.bossesKilled * (ECONOMY.waveClearBonusBase + ECONOMY.waveClearBonusPerWave * payload.highestWave);
  const maximumGold = config.startingGold + payload.enemiesKilled * maximumKillGold + maximumWaveGold + rewardCount * maximumPowerupGold;
  const scoreFromObservedProgress = calculateScore({
    enemiesKilled: payload.enemiesKilled,
    elitesKilled: payload.enemiesKilled,
    wavesCompleted: payload.highestWave,
    bossesKilled: payload.bossesKilled,
    remainingLives: config.maxLives,
    unusedGold: maximumGold
  }, config).finalScore;

  // Bonus targets and summons are included in the observed kills; all kills
  // receive the maximum elite bonus and generous unused-gold ceiling here.
  // This is a plausibility check, not replay proof.
  return Math.min(SCORING.maxReasonableScore, scoreFromObservedProgress);
}

export function validateScorePayload(body: unknown): ValidationResult & { value?: GameResultPayload } {
  const errors: string[] = [];
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { ok: false, errors: ['Invalid JSON body'], sanitizedName: '' };
  }
  const b = body as Record<string, unknown>;
  const playerName = validatePlayerName(b.playerName);
  const difficulty = b.difficulty;
  const highestWave = b.highestWave;
  const finalScore = b.finalScore;
  const enemiesKilled = b.enemiesKilled;
  const bossesKilled = b.bossesKilled;
  const remainingLives = b.remainingLives;
  const gameDurationSeconds = b.gameDurationSeconds;
  const runId = b.runId;
  const gameVersion = b.gameVersion;
  const scoreVersion = b.scoreVersion;
  const wavesCompleted = b.wavesCompleted;
  const outcome = b.outcome;
  const siegeBossesDefeated = b.siegeBossesDefeated;

  const sanitizedName = playerName.name;
  if (!playerName.ok) errors.push(playerName.error!);

  if (difficulty !== 'easy' && difficulty !== 'medium' && difficulty !== 'hard') errors.push('Invalid difficulty');
  const isNonNegInt = (v: unknown) => typeof v === 'number' && Number.isInteger(v) && v >= 0;
  if (!isNonNegInt(highestWave)) errors.push('highestWave must be a non-negative integer');
  if (!isNonNegInt(finalScore)) errors.push('finalScore must be a non-negative integer');
  if (!isNonNegInt(enemiesKilled)) errors.push('enemiesKilled must be a non-negative integer');
  if (!isNonNegInt(bossesKilled)) errors.push('bossesKilled must be a non-negative integer');
  if (typeof remainingLives !== 'number' || !Number.isInteger(remainingLives) || remainingLives < 0 || remainingLives > 99) {
    errors.push('remainingLives out of range');
  }
  if (typeof gameDurationSeconds !== 'number' || !Number.isInteger(gameDurationSeconds) || gameDurationSeconds < 0 || gameDurationSeconds > MAX_GAME_DURATION_SECONDS) {
    errors.push('gameDurationSeconds out of range');
  }
  if (typeof runId !== 'string' || !RUN_ID_RE.test(runId)) errors.push('runId is required and must be a unique 8-64 char token');
  if (typeof gameVersion !== 'string' || gameVersion.length < 1 || gameVersion.length > 16) errors.push('gameVersion is required');
  if (scoreVersion !== SCORE_VERSION) errors.push(`Unsupported scoreVersion (active: ${SCORE_VERSION})`);

  if (typeof highestWave === 'number' && highestWave > SCORING.maxReasonableWave) errors.push('highestWave unrealistic');
  if (typeof finalScore === 'number' && finalScore > SCORING.maxReasonableScore) errors.push('finalScore unrealistic');
  if (typeof enemiesKilled === 'number' && enemiesKilled > SCORING.maxReasonableKills) errors.push('enemiesKilled unrealistic');

  if (
    errors.length === 0 &&
    (difficulty === 'easy' || difficulty === 'medium' || difficulty === 'hard') &&
    typeof highestWave === 'number' && Number.isSafeInteger(wavesCompleted) && (wavesCompleted as number) <= highestWave && typeof finalScore === 'number' &&
    typeof enemiesKilled === 'number' && typeof bossesKilled === 'number' &&
    typeof remainingLives === 'number' && typeof gameDurationSeconds === 'number'
  ) {
    const diff = difficulty as DifficultyId;
    const config = DIFFICULTIES[diff];
    if (remainingLives > config.maxLives) errors.push('remainingLives exceeds difficulty maximum');
    const completedCount = wavesCompleted as number;
    let scheduledEnemies = 0;
    let scheduledBosses = 0;
    let completedScheduledBosses = 0;
    let minimumDurationMs = 0;
    let possibleLeakLives = 0;
    for (let waveNumber = 1; waveNumber <= highestWave; waveNumber++) {
      const wave = buildWave(waveNumber, config.enemyCountMultiplier);
      scheduledEnemies += totalEnemiesInWave(wave);
      if (waveNumber <= completedCount) minimumDurationMs += waveSpawnFinishMs(waveNumber, diff);
      for (const group of wave.groups) {
        const enemy = ENEMIES[group.enemyId];
        possibleLeakLives += enemy.livesLost * group.count;
        if (enemy.isBoss) {
          scheduledBosses += group.count;
          if (waveNumber <= completedCount) completedScheduledBosses += group.count;
        }
      }
    }

    const milestoneRewards = countMilestoneRewards(completedCount);
    const minimumDurationSeconds = Math.floor(minimumDurationMs / (MAX_GAME_SPEED * 1000));
    if (highestWave < 1) errors.push('highestWave must be at least 1');
    if (outcome === 'defeat' && possibleLeakLives < config.startingLives) errors.push('Wave progress cannot reach Game Over');
    if (gameDurationSeconds < minimumDurationSeconds) errors.push('gameDurationSeconds is too short for completed waves');
    const nonBossKills = Math.max(0, enemiesKilled - bossesKilled);
    if (nonBossKills < minimumNonBossKillsBeforeWave(completedCount, remainingLives, diff, enemiesKilled, bossesKilled, completedScheduledBosses)) {
      errors.push('enemiesKilled is too low for completed-wave survival');
    }
    if (bossesKilled > scheduledBosses) errors.push('bossesKilled exceeds configured boss count');
    if (bossesKilled > enemiesKilled) errors.push('bossesKilled exceeds enemiesKilled');

    // ponytail: all scheduled bosses get the full run duration for summons; this
    // may overstate kills, with replayed boss lifetimes as the tighter upgrade path.
    const summonAllowance = Math.min(
      SCORING.maxReasonableKills,
      scheduledBosses * Math.floor((gameDurationSeconds * MAX_GAME_SPEED) / 8) * 2
    );
    const targetAllowance = scheduledEnemies + summonAllowance + milestoneRewards + scheduledBosses;
    const possibleKills = Math.min(SCORING.maxReasonableKills, scheduledEnemies + summonAllowance + targetAllowance);
    if (enemiesKilled > possibleKills) errors.push('enemiesKilled exceeds configured spawns and reward targets');

    if (errors.length === 0) {
      if (finalScore < scoreFloor({ wavesCompleted: completedCount, enemiesKilled, bossesKilled, remainingLives }, diff)) {
        errors.push('finalScore is below the configured scoring minimum');
      } else if (finalScore > scoreCeiling({ highestWave, wavesCompleted: completedCount, enemiesKilled, bossesKilled }, diff)) {
        errors.push('finalScore exceeds the configured progress envelope');
      }
    }
  }

  errors.push(...resultProgressErrors({ highestWave, wavesCompleted, outcome, siegeBossesDefeated } as ResultProgress, remainingLives as number, bossesKilled as number));

  if (errors.length > 0) return { ok: false, errors, sanitizedName };
  const value: GameResultPayload = {
    playerName: sanitizedName,
    difficulty: difficulty as DifficultyId,
    highestWave: highestWave as number,
    wavesCompleted: wavesCompleted as number,
    outcome: outcome as RunOutcome,
    siegeBossesDefeated: siegeBossesDefeated as number,
    finalScore: finalScore as number,
    enemiesKilled: enemiesKilled as number,
    bossesKilled: bossesKilled as number,
    remainingLives: remainingLives as number,
    gameDurationSeconds: gameDurationSeconds as number,
    runId: runId as string,
    gameVersion: gameVersion as string,
    scoreVersion: SCORE_VERSION
  };
  return { ok: true, errors: [], sanitizedName, value };
}
