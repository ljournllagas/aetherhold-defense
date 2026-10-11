import { getCampaignLevel } from '../game/campaign/config.ts';
import type { CampaignResultPayload } from './account.ts';
import { plain, only, integer } from './cloudProgress.ts';
export function validateCampaignResult(v:unknown):CampaignResultPayload|null {
  if(!plain(v)||!only(v,['runId','campaignVersion','progressionVersion','level','outcome','finalScore','remainingLives','gameDurationSeconds','gameVersion'])||typeof v.runId!=='string'||!/^[A-Za-z0-9_-]{8,64}$/.test(v.runId)||v.campaignVersion!==1||v.progressionVersion!==1||!integer(v.level,1,30)||!integer(v.finalScore,0,10000000)||!integer(v.remainingLives,0,20)||!integer(v.gameDurationSeconds,0,86400)||typeof v.gameVersion!=='string'||!v.gameVersion||v.gameVersion.length>16) return null;
  if(v.outcome==='victory'&&v.remainingLives===0 || v.outcome==='defeat'&&v.remainingLives!==0 || v.outcome==='siege-failed'&&(!getCampaignLevel(v.level)?.bossEnemyId||v.remainingLives===0) || !['victory','defeat','siege-failed'].includes(String(v.outcome))) return null;
  return v as unknown as CampaignResultPayload;
}
