import type {CloudProgress,GuestSnapshot,RunResult} from '../../shared/account.ts';
import {emptyCloudProgress,validateCloudProgress} from '../../shared/cloudProgress.ts';
import {validateScorePayload} from '../../shared/validation.ts';
import {getCampaignLevel} from '../campaign/config.ts';
export interface GuestRunProgress {progress:CloudProgress;result:RunResult|null;runId?:string}
export function emptyGuestSnapshot(nickname=''):GuestSnapshot {return {progress:emptyCloudProgress(),nickname,result:null,warnings:[]};}
export function hasGuestProgress(snapshot:GuestSnapshot):boolean {const p=snapshot.progress;return !!snapshot.result||Object.keys(p.levels).length>0||Object.keys(p.earned).length>0||p.bests.length>0;}
export function validGuestSnapshot(value:unknown):value is GuestSnapshot {
 if(!value||typeof value!=='object')return false;
 const s=value as GuestSnapshot;
 return !!validateCloudProgress(s.progress)&&typeof s.nickname==='string'&&s.nickname.length<=20&&Array.isArray(s.warnings)&&s.warnings.length<=10&&s.warnings.every(x=>typeof x==='string'&&x.length<300)&&(s.result===null||s.result.mode==='classic'&&validateScorePayload(s.result.payload).ok);
}
export function guestRunProgress(result:RunResult,earned:CloudProgress['earned']):GuestRunProgress {
 const progress=emptyCloudProgress();progress.earned={...earned};
 if(result.mode==='campaign'){
  const p=result.payload,level=getCampaignLevel(p.level);
  if(level&&p.outcome==='victory')progress.levels[p.level]={completed:true,completionStar:true,livesStar:p.remainingLives>=level.mastery.minimumLivesForStar,scoreStar:p.finalScore>=level.mastery.scoreTarget,bestScore:p.finalScore,bestRemainingLives:p.remainingLives};
  return {progress,result:null,runId:p.runId};
 }
 const p=result.payload;
 progress.bests=[{score:p.finalScore,wave:p.highestWave,difficulty:p.difficulty,date:new Date().toISOString(),scoreVersion:p.scoreVersion}];
 const valid=validateScorePayload(p);
 return {progress,result:valid.ok&&valid.value?{mode:'classic',payload:valid.value}:null,runId:p.runId};
}
