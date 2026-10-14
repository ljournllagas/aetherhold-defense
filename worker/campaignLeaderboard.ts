import { CAMPAIGN_LEVELS } from '../src/game/campaign/config.ts';
import { campaignScoreMetadata, CAMPAIGN_SCORE_VERSION } from '../src/shared/campaignScoring.ts';
import { compareCampaignRows, validateCampaignLeaderboard } from '../src/shared/campaignLeaderboard.ts';
import type { CampaignLeaderboardResponse, CampaignLeaderboardRow } from '../src/shared/campaignLeaderboard.ts';
import { validateCloudProgress } from '../src/shared/cloudProgress.ts';
import { json } from './response.ts';
import type { AuthEnv } from './auth.ts';

const PAGE_SIZE = 100;
const metadataJson = JSON.stringify(CAMPAIGN_LEVELS.map(({ level, mastery }) => ({
  level,
  minimumLivesForStar: mastery.minimumLivesForStar,
  legacyTarget: mastery.scoreTarget,
  scoreTarget: campaignScoreMetadata(level).scoreTarget,
  perfectScore: campaignScoreMetadata(level).perfectScore
})));

interface Candidate {
  playerId: string;
  nickname: string;
  missionsCompleted: number;
  totalStars: number;
  totalScore: number;
  privateProgress: string;
}

const RANKING_QUERY = `
WITH profile_source AS (
  SELECT id, nickname, progress_json,
    CASE WHEN json_valid(progress_json) THEN progress_json ELSE '{}' END AS safe_json
  FROM players
), eligible_profiles AS (
  SELECT * FROM profile_source p
  WHERE json_type(p.safe_json)='object'
    AND json_type(p.safe_json,'$.version') IN ('integer','real') AND json_extract(p.safe_json,'$.version')=1
    AND json_type(p.safe_json,'$.campaignVersion') IN ('integer','real') AND json_extract(p.safe_json,'$.campaignVersion')=1
    AND json_type(p.safe_json,'$.progressionVersion') IN ('integer','real') AND json_extract(p.safe_json,'$.progressionVersion')=1
    AND json_type(p.safe_json,'$.levels')='object'
), metadata AS (
  SELECT CAST(json_extract(value,'$.level') AS INTEGER) AS level,
    json_extract(value,'$.minimumLivesForStar') AS lives_target,
    json_extract(value,'$.legacyTarget') AS legacy_target,
    json_extract(value,'$.scoreTarget') AS score_target,
    json_extract(value,'$.perfectScore') AS perfect_score
  FROM json_each(?1)
), level_source AS (
  SELECT p.id, p.nickname, p.progress_json, j.type AS level_type,
    CASE WHEN j.type='object' THEN j.value ELSE '{}' END AS level_json,
    m.level, m.lives_target, m.legacy_target, m.score_target, m.perfect_score
  FROM eligible_profiles p
  JOIN json_each(CASE WHEN json_type(p.safe_json,'$.levels')='object'
    THEN json_extract(p.safe_json,'$.levels') ELSE '{}' END) j
  LEFT JOIN metadata m ON j.key=CAST(m.level AS TEXT)
), ranked AS (
  SELECT p.id AS playerId, p.nickname,
    SUM(json_extract(l.level_json,'$.completed')) AS missionsCompleted,
    SUM(json_extract(l.level_json,'$.completionStar') + json_extract(l.level_json,'$.livesStar') + json_extract(l.level_json,'$.scoreStar')) AS totalStars,
    SUM(COALESCE(json_extract(l.level_json,'$.campaignScore.bestScore'),0)) AS totalScore,
    p.progress_json AS privateProgress
  FROM eligible_profiles p JOIN level_source l ON l.id=p.id
  WHERE NOT EXISTS (
    SELECT 1 FROM level_source invalid
    WHERE invalid.id=p.id AND COALESCE(
      invalid.level IS NOT NULL AND invalid.level_type='object'
      AND NOT EXISTS (SELECT 1 FROM json_each(invalid.level_json) k WHERE k.key NOT IN
        ('completed','completionStar','livesStar','scoreStar','bestScore','bestRemainingLives','campaignScore'))
      AND json_type(invalid.level_json,'$.completed') IN ('true','false')
      AND json_type(invalid.level_json,'$.completionStar') IN ('true','false')
      AND json_type(invalid.level_json,'$.livesStar') IN ('true','false')
      AND json_type(invalid.level_json,'$.scoreStar') IN ('true','false')
      AND json_extract(invalid.level_json,'$.completed')=json_extract(invalid.level_json,'$.completionStar')
      AND (json_extract(invalid.level_json,'$.completed')=1 OR
        (json_extract(invalid.level_json,'$.livesStar')=0 AND json_extract(invalid.level_json,'$.scoreStar')=0))
      AND json_type(invalid.level_json,'$.bestScore') IN ('integer','real')
      AND json_extract(invalid.level_json,'$.bestScore')=CAST(json_extract(invalid.level_json,'$.bestScore') AS INTEGER)
      AND json_extract(invalid.level_json,'$.bestScore') BETWEEN 0 AND 10000000
      AND json_type(invalid.level_json,'$.bestRemainingLives') IN ('integer','real')
      AND json_extract(invalid.level_json,'$.bestRemainingLives')=CAST(json_extract(invalid.level_json,'$.bestRemainingLives') AS INTEGER)
      AND json_extract(invalid.level_json,'$.bestRemainingLives') BETWEEN 0 AND 25
      AND (json_extract(invalid.level_json,'$.livesStar')=0 OR
        json_extract(invalid.level_json,'$.bestRemainingLives')>=invalid.lives_target)
      AND (json_type(invalid.level_json,'$.campaignScore') IS NULL OR
        (json_type(invalid.level_json,'$.campaignScore')='object'
        AND json_type(invalid.level_json,'$.campaignScore.version') IN ('integer','real')
        AND json_extract(invalid.level_json,'$.campaignScore.version')=CAST(json_extract(invalid.level_json,'$.campaignScore.version') AS INTEGER)
        AND json_extract(invalid.level_json,'$.campaignScore.version')=1
        AND json_type(invalid.level_json,'$.campaignScore.bestScore') IN ('integer','real')
        AND json_extract(invalid.level_json,'$.campaignScore.bestScore')=CAST(json_extract(invalid.level_json,'$.campaignScore.bestScore') AS INTEGER)
        AND json_extract(invalid.level_json,'$.campaignScore.bestScore') BETWEEN 1 AND invalid.perfect_score
        AND NOT EXISTS (SELECT 1 FROM json_each(CASE
          WHEN json_type(invalid.level_json,'$.campaignScore')='object'
          THEN json_extract(invalid.level_json,'$.campaignScore') ELSE '{}' END) k
          WHERE k.key NOT IN ('version','bestScore'))))
      AND (json_extract(invalid.level_json,'$.scoreStar')=0 OR
        json_extract(invalid.level_json,'$.bestScore')>=invalid.legacy_target OR
        COALESCE(json_extract(invalid.level_json,'$.campaignScore.bestScore'),0)>=invalid.score_target)
    ,0)=0
  )
  GROUP BY p.id, p.nickname, p.progress_json
  HAVING SUM(json_extract(l.level_json,'$.completed'))>0
)
SELECT playerId,nickname,missionsCompleted,totalStars,totalScore,privateProgress FROM ranked
ORDER BY missionsCompleted DESC,totalStars DESC,totalScore DESC,playerId COLLATE BINARY ASC
LIMIT ?2 OFFSET ?3`;

function integer(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value);
}

function response(value: unknown, status = 200): Response {
  const result = json(value, status);
  result.headers.set('Cache-Control', 'no-store');
  result.headers.set('Access-Control-Allow-Origin', '*');
  return result;
}

function invalidLimit(): Response {
  return response({ ok: false, error: { code: 'INVALID_LIMIT', message: 'Limit must be an integer from 1 to 100.' } }, 400);
}

function aggregate(progress: NonNullable<ReturnType<typeof validateCloudProgress>>): Omit<CampaignLeaderboardRow, 'playerId' | 'nickname'> {
  let missionsCompleted = 0;
  let totalStars = 0;
  let totalScore = 0;
  for (const level of Object.values(progress.levels)) {
    if (!level?.completed) continue;
    missionsCompleted++;
    totalStars += Number(level.completionStar) + Number(level.livesStar) + Number(level.scoreStar);
    totalScore += level.campaignScore?.version === CAMPAIGN_SCORE_VERSION ? level.campaignScore.bestScore : 0;
  }
  return { missionsCompleted, totalStars, totalScore };
}

export async function handleCampaignLeaderboard(request: Request, env: Pick<AuthEnv, 'DB'>): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname !== '/api/campaign-leaderboard' || request.method !== 'GET') return null;

  const limits = url.searchParams.getAll('limit');
  let limit = 20;
  if (limits.length > 1) return invalidLimit();
  if (limits.length === 1) {
    if (!/^[1-9][0-9]*$/.test(limits[0]!)) return invalidLimit();
    limit = Number(limits[0]);
    if (!integer(limit) || limit < 1 || limit > 100) return invalidLimit();
  }

  try {
    const scores: CampaignLeaderboardRow[] = [];
    const seen = new Set<string>();
    let offset = 0;
    while (scores.length < limit) {
      const result = await env.DB.prepare(RANKING_QUERY).bind(metadataJson, PAGE_SIZE, offset).all<Candidate>();
      if (!Array.isArray(result.results)) throw new Error('Campaign leaderboard query returned no result set');
      const candidates = result.results;
      if (candidates.length === 0) break;
      offset += candidates.length;

      for (const candidate of candidates) {
        if (seen.has(candidate.playerId)) continue;
        seen.add(candidate.playerId);
        let parsed: unknown;
        try { parsed = JSON.parse(candidate.privateProgress); } catch { continue; }
        const progress = validateCloudProgress(parsed);
        if (!progress) continue;

        const totals = aggregate(progress);
        if (totals.missionsCompleted !== candidate.missionsCompleted || totals.totalStars !== candidate.totalStars
          || totals.totalScore !== candidate.totalScore) throw new Error('Campaign leaderboard SQL totals did not match validated progress');

        const row: CampaignLeaderboardRow = {
          playerId: candidate.playerId,
          nickname: candidate.nickname,
          ...totals
        };
        const validatedRow = validateCampaignLeaderboard({
          campaignScoreVersion: CAMPAIGN_SCORE_VERSION, missionCount: CAMPAIGN_LEVELS.length,
          starCount: CAMPAIGN_LEVELS.length * 3, scores: [row]
        }, 1);
        if (!validatedRow) continue;
        scores.push(row);
        if (scores.length === limit) break;
      }
      if (candidates.length < PAGE_SIZE) break;
    }

    scores.sort(compareCampaignRows);
    const result = validateCampaignLeaderboard({
      campaignScoreVersion: CAMPAIGN_SCORE_VERSION,
      missionCount: CAMPAIGN_LEVELS.length,
      starCount: CAMPAIGN_LEVELS.length * 3,
      scores
    }, limit);
    if (!result) throw new Error('Campaign leaderboard response failed shared validation');
    return response(result);
  } catch {
    return response({ ok: false, error: { code: 'API_UNAVAILABLE', message: 'Campaign leaderboard is temporarily unavailable.' } }, 503);
  }
}
