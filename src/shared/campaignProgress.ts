import { getCampaignLevel } from '../game/campaign/config.ts';
import { CAMPAIGN_SCORE_VERSION, campaignScoreMetadata } from './campaignScoring.ts';
import type { CampaignLevelProgress } from '../game/campaign/types.ts';

function plain(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function integer(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= min && value <= max;
}

function only(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(value).every((key) => keys.includes(key));
}

export function validateCampaignLevelProgress(value: unknown, level: number): CampaignLevelProgress | null {
  if (!plain(value) || !only(value, ['completed', 'completionStar', 'livesStar', 'scoreStar', 'bestScore', 'bestRemainingLives', 'campaignScore'])) return null;
  const { completed, completionStar, livesStar, scoreStar, bestScore, bestRemainingLives } = value;
  const definition = getCampaignLevel(level);
  if (!definition || typeof completed !== 'boolean' || typeof completionStar !== 'boolean'
    || typeof livesStar !== 'boolean' || typeof scoreStar !== 'boolean'
    || !integer(bestScore, 0, 10_000_000) || !integer(bestRemainingLives, 0, 25)
    || completed !== completionStar || ((livesStar || scoreStar) && !completed)
    || livesStar && bestRemainingLives < definition.mastery.minimumLivesForStar) return null;

  let campaignScore: CampaignLevelProgress['campaignScore'];
  if (Object.prototype.hasOwnProperty.call(value, 'campaignScore')) {
    const score = value.campaignScore;
    if (!plain(score) || !only(score, ['version', 'bestScore']) || score.version !== CAMPAIGN_SCORE_VERSION
      || !integer(score.bestScore, 1, campaignScoreMetadata(level).perfectScore) || !completed) return null;
    campaignScore = { version: CAMPAIGN_SCORE_VERSION, bestScore: score.bestScore };
  }

  if (scoreStar && bestScore < definition.mastery.scoreTarget
    && (campaignScore?.bestScore ?? 0) < campaignScoreMetadata(level).scoreTarget) return null;
  return {
    completed,
    completionStar,
    livesStar,
    scoreStar,
    bestScore,
    bestRemainingLives,
    ...(campaignScore ? { campaignScore } : {})
  };
}

export function cloneCampaignLevelProgress(progress: CampaignLevelProgress): CampaignLevelProgress {
  return { ...progress, ...(progress.campaignScore ? { campaignScore: { ...progress.campaignScore } } : {}) };
}

export function mergeCampaignLevelProgress(
  a: CampaignLevelProgress | undefined,
  b: CampaignLevelProgress | undefined
): CampaignLevelProgress | undefined {
  if (!a) return b ? cloneCampaignLevelProgress(b) : undefined;
  if (!b) return cloneCampaignLevelProgress(a);
  const bestScore = Math.max(a.campaignScore?.bestScore ?? 0, b.campaignScore?.bestScore ?? 0);
  return {
    completed: a.completed || b.completed,
    completionStar: a.completionStar || b.completionStar,
    livesStar: a.livesStar || b.livesStar,
    scoreStar: a.scoreStar || b.scoreStar,
    bestScore: Math.max(a.bestScore, b.bestScore),
    bestRemainingLives: Math.max(a.bestRemainingLives, b.bestRemainingLives),
    ...(bestScore > 0 ? { campaignScore: { version: CAMPAIGN_SCORE_VERSION, bestScore } } : {})
  };
}

export function applyCampaignClear(
  old: CampaignLevelProgress | undefined,
  level: number,
  score: number,
  lives: number
): CampaignLevelProgress | null {
  const definition = getCampaignLevel(level);
  if (!definition || !integer(score, 1, campaignScoreMetadata(level).perfectScore) || !integer(lives, 1, 25)) return null;
  const campaignScore = campaignScoreMetadata(level);
  const bestScore = Math.max(old?.campaignScore?.bestScore ?? 0, score);
  return {
    completed: true,
    completionStar: true,
    livesStar: !!old?.livesStar || lives >= definition.mastery.minimumLivesForStar,
    scoreStar: !!old?.scoreStar || (old?.bestScore ?? 0) >= definition.mastery.scoreTarget || bestScore >= campaignScore.scoreTarget,
    bestScore: old?.bestScore ?? 0,
    bestRemainingLives: Math.max(old?.bestRemainingLives ?? 0, lives),
    campaignScore: { version: CAMPAIGN_SCORE_VERSION, bestScore }
  };
}
