import {expect,it} from 'vitest';
import {guestRunProgress,validGuestSnapshot} from '../src/game/systems/GuestProgress.ts';
import {getCampaignLevel} from '../src/game/campaign/config.ts';
import {campaignScoreMetadata} from '../src/shared/campaignScoring.ts';
it('projects only this Campaign run, not cumulative achievements',()=>{
 const d=getCampaignLevel(1)!;
 const p=guestRunProgress({mode:'campaign',payload:{runId:'guest-run-1',campaignVersion:1,progressionVersion:1,level:1,outcome:'victory',finalScore:d.mastery.scoreTarget,remainingLives:d.mastery.minimumLivesForStar,gameDurationSeconds:10,gameVersion:'0.3.0'}},{});
 expect(p.progress.levels[1]).toMatchObject({completed:true,livesStar:true,scoreStar:true,bestScore:d.mastery.scoreTarget});
 expect(p.result).toBeNull();
 const metadata=campaignScoreMetadata(1);
 const current=guestRunProgress({mode:'campaign',payload:{runId:'guest-run-current',campaignVersion:1,progressionVersion:1,level:1,outcome:'victory',finalScore:metadata.perfectScore,remainingLives:20,gameDurationSeconds:10,gameVersion:'0.3.0',campaignScoreVersion:1,scheduledEnemiesKilled:metadata.scheduledEnemyCount,wavesCompleted:metadata.waveCount,missionBossesKilled:0}},{});
 expect(current).toMatchObject({runId:'guest-run-current',result:null,progress:{levels:{1:{completed:true,completionStar:true,livesStar:true,scoreStar:true,bestScore:0,bestRemainingLives:20,campaignScore:{version:1,bestScore:metadata.perfectScore}}}}});
 expect(validGuestSnapshot({progress:current.progress,nickname:'Aria',result:null,warnings:[]})).toBe(true);
 const currentLoss=guestRunProgress({mode:'campaign',payload:{runId:'guest-run-current-loss',campaignVersion:1,progressionVersion:1,level:1,outcome:'defeat',finalScore:0,remainingLives:0,gameDurationSeconds:10,gameVersion:'0.3.0',campaignScoreVersion:1,scheduledEnemiesKilled:0,wavesCompleted:0,missionBossesKilled:0}},{});
 expect(currentLoss.progress.levels).toEqual({});
 const loss=guestRunProgress({mode:'campaign',payload:{runId:'guest-run-2',campaignVersion:1,progressionVersion:1,level:1,outcome:'defeat',finalScore:0,remainingLives:0,gameDurationSeconds:10,gameVersion:'0.3.0'}},{});
 expect(loss.progress.levels).toEqual({});
});
