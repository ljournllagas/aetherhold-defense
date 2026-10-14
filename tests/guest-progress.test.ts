import {expect,it} from 'vitest';
import {guestRunProgress} from '../src/game/systems/GuestProgress.ts';
import {getCampaignLevel} from '../src/game/campaign/config.ts';
it('projects only this Campaign run, not cumulative achievements',()=>{
 const d=getCampaignLevel(1)!;
 const p=guestRunProgress({mode:'campaign',payload:{runId:'guest-run-1',campaignVersion:1,progressionVersion:1,level:1,outcome:'victory',finalScore:d.mastery.scoreTarget,remainingLives:d.mastery.minimumLivesForStar,gameDurationSeconds:10,gameVersion:'0.3.0'}},{});
 expect(p.progress.levels[1]).toMatchObject({completed:true,livesStar:true,scoreStar:true,bestScore:d.mastery.scoreTarget});
 expect(p.result).toBeNull();
 const loss=guestRunProgress({mode:'campaign',payload:{runId:'guest-run-2',campaignVersion:1,progressionVersion:1,level:1,outcome:'defeat',finalScore:0,remainingLives:0,gameDurationSeconds:10,gameVersion:'0.3.0'}},{});
 expect(loss.progress.levels).toEqual({});
});
