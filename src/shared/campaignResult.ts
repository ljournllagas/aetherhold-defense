import { CAMPAIGN_LEVELS, getCampaignLevel } from '../game/campaign/config.ts';
import { campaignScoreMetadata, calculateCampaignScore, CAMPAIGN_SCORE_VERSION } from './campaignScoring.ts';
import type { CampaignResultPayload, CurrentCampaignResultPayload } from './account.ts';
import { plain, only, integer } from './cloudProgress.ts';
export function validateCampaignResult(v:unknown):CampaignResultPayload|null {
  const legacyKeys=['runId','campaignVersion','progressionVersion','level','outcome','finalScore','remainingLives','gameDurationSeconds','gameVersion'];
  const currentKeys=['campaignScoreVersion','scheduledEnemiesKilled','wavesCompleted','missionBossesKilled'];
  if(!plain(v))return null;
  const current=currentKeys.some(key=>Object.prototype.hasOwnProperty.call(v,key));
  if(!only(v,current?[...legacyKeys,...currentKeys]:legacyKeys)||typeof v.runId!=='string'||!/^[A-Za-z0-9_-]{8,64}$/.test(v.runId)||v.campaignVersion!==1||v.progressionVersion!==1||!integer(v.level,1,CAMPAIGN_LEVELS.length)||!integer(v.finalScore,0,10000000)||!integer(v.remainingLives,0,20)||!integer(v.gameDurationSeconds,0,86400)||typeof v.gameVersion!=='string'||!v.gameVersion||v.gameVersion.length>16) return null;
  if(v.outcome==='victory'&&v.remainingLives===0 || v.outcome==='defeat'&&v.remainingLives!==0 || v.outcome==='siege-failed'&&(!getCampaignLevel(v.level)?.bossEnemyId||v.remainingLives===0) || !['victory','defeat','siege-failed'].includes(String(v.outcome))) return null;
  if(current){
    const metadata=campaignScoreMetadata(v.level);
    if(v.campaignScoreVersion!==CAMPAIGN_SCORE_VERSION||!integer(v.scheduledEnemiesKilled,0,metadata.scheduledEnemyCount)||!integer(v.wavesCompleted,0,metadata.waveCount)||!integer(v.missionBossesKilled,0,Number(metadata.hasBoss)))return null;
    if(v.outcome==='siege-failed'&&v.missionBossesKilled!==0)return null;
    if(v.scheduledEnemiesKilled>metadata.scheduledEnemiesThroughWave[Math.min(metadata.waveCount,v.wavesCompleted+1)]!||v.missionBossesKilled>v.scheduledEnemiesKilled||v.missionBossesKilled>0&&v.wavesCompleted<metadata.waveCount-1)return null;
    if(calculateCampaignScore({scheduledEnemiesKilled:v.scheduledEnemiesKilled,wavesCompleted:v.wavesCompleted,missionBossesKilled:v.missionBossesKilled,remainingLives:v.remainingLives}).finalScore!==v.finalScore)return null;
    if(v.outcome==='victory'&&(v.wavesCompleted!==metadata.waveCount||v.missionBossesKilled!==Number(metadata.hasBoss)))return null;
    return v as unknown as CurrentCampaignResultPayload;
  }
  return v as unknown as CampaignResultPayload;
}
