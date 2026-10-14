import { CAMPAIGN_LEVELS } from '../game/campaign/config.ts';
import { campaignScoreMetadata, CAMPAIGN_SCORE_VERSION } from './campaignScoring.ts';

export interface CampaignLeaderboardRow {
  playerId: string;
  nickname: string;
  missionsCompleted: number;
  totalStars: number;
  totalScore: number;
}

export interface CampaignLeaderboardResponse {
  campaignScoreVersion: 1;
  missionCount: number;
  starCount: number;
  scores: CampaignLeaderboardRow[];
}

const missionCount = CAMPAIGN_LEVELS.length;
const starCount = missionCount * 3;
const maxTotalScore = CAMPAIGN_LEVELS.reduce((sum, level) => sum + campaignScoreMetadata(level.level).perfectScore, 0);

function plain(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function only(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(value).every((key) => keys.includes(key));
}

function integer(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= min && value <= max;
}

export function compareCampaignRows(a: CampaignLeaderboardRow, b: CampaignLeaderboardRow): number {
  return b.missionsCompleted - a.missionsCompleted || b.totalStars - a.totalStars || b.totalScore - a.totalScore
    || (a.playerId < b.playerId ? -1 : a.playerId > b.playerId ? 1 : 0);
}

export function validateCampaignLeaderboard(value: unknown, limit = 100): CampaignLeaderboardResponse | null {
  if (!integer(limit, 1, 100) || !plain(value) || !only(value, ['campaignScoreVersion', 'missionCount', 'starCount', 'scores'])
    || value.campaignScoreVersion !== CAMPAIGN_SCORE_VERSION || value.missionCount !== missionCount
    || value.starCount !== starCount || !Array.isArray(value.scores) || value.scores.length > limit) return null;

  const ids = new Set<string>();
  let previous: CampaignLeaderboardRow | undefined;
  for (const candidate of value.scores) {
    if (!plain(candidate) || !only(candidate, ['playerId', 'nickname', 'missionsCompleted', 'totalStars', 'totalScore'])
      || typeof candidate.playerId !== 'string' || candidate.playerId.length === 0
      || typeof candidate.nickname !== 'string' || candidate.nickname.trim().length === 0 || candidate.nickname.length > 20
      || !integer(candidate.missionsCompleted, 1, missionCount)
      || !integer(candidate.totalStars, 0, candidate.missionsCompleted * 3)
      || !integer(candidate.totalScore, 0, maxTotalScore) || ids.has(candidate.playerId)) return null;
    const row = candidate as unknown as CampaignLeaderboardRow;
    if (previous && compareCampaignRows(previous, row) >= 0) return null;
    ids.add(row.playerId);
    previous = row;
  }

  return value as unknown as CampaignLeaderboardResponse;
}
