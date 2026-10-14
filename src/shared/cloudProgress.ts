import type { CloudProgress, PersonalBest } from './account.ts';
import { ALTERNATIVE_BRANCH } from '../game/config/evolutions.ts';
import { mergeCampaignLevelProgress, validateCampaignLevelProgress } from './campaignProgress.ts';
import type { BranchId } from './progression.ts';
export function emptyCloudProgress():CloudProgress { return {version:1,campaignVersion:1,progressionVersion:1,levels:{},earned:{},bests:[]}; }
export function plain(value:unknown):value is Record<string,unknown> { return value!==null && typeof value==='object' && !Array.isArray(value); }
export function integer(value:unknown,min:number,max:number):value is number { return typeof value==='number' && Number.isSafeInteger(value) && value>=min && value<=max; }
export function only(value:Record<string,unknown>,keys:readonly string[]):boolean { return Object.keys(value).every(k=>keys.includes(k)); }
export function validatePersonalBest(v:unknown):PersonalBest|null {
  if(!plain(v)||!only(v,['score','wave','difficulty','date','scoreVersion'])||!integer(v.score,0,10000000)||!integer(v.wave,0,500)||!['easy','medium','hard'].includes(String(v.difficulty))||!integer(v.scoreVersion,1,3)||typeof v.date!=='string'||!Number.isFinite(Date.parse(v.date))) return null;
  return v as unknown as PersonalBest;
}
export function validateCloudProgress(v:unknown):CloudProgress|null {
  if(!plain(v)||!only(v,['version','campaignVersion','progressionVersion','levels','earned','bests'])||v.version!==1||v.campaignVersion!==1||v.progressionVersion!==1||!plain(v.levels)||!plain(v.earned)||!Array.isArray(v.bests)||v.bests.length>3) return null;
  const result=emptyCloudProgress();
  for(const [key,p] of Object.entries(v.levels)) {
    const levelId=Number(key);
    const progress=String(levelId)===key?validateCampaignLevelProgress(p,levelId):null;
    if(!progress) return null;
    result.levels[levelId]=progress;
  }
  for(const [key,time] of Object.entries(v.earned)) {
    if(!Object.values(ALTERNATIVE_BRANCH).includes(key as BranchId)||typeof time!=='string'||time.length>40||!Number.isFinite(Date.parse(time))) return null;
    result.earned[key as BranchId]=time;
  }
  for(const best of v.bests) { const p=validatePersonalBest(best); if(!p||result.bests.some(b=>b.scoreVersion===p.scoreVersion)) return null; result.bests.push({...p}); }
  return result;
}
export function mergeCloudProgress(a:CloudProgress,b:CloudProgress):CloudProgress {
  const result=structuredClone(a);
  for(const [key,p] of Object.entries(b.levels)) {
    if(!p) continue; const old=result.levels[Number(key)];
    const merged=mergeCampaignLevelProgress(old,p);
    if(merged) result.levels[Number(key)]=merged;
  }
  for(const [key,time] of Object.entries(b.earned)) { const old=result.earned[key as BranchId]; if(time&&(!old||Date.parse(time)<Date.parse(old))) result.earned[key as BranchId]=time; }
  for(const best of b.bests) { const index=result.bests.findIndex(x=>x.scoreVersion===best.scoreVersion); if(index<0) result.bests.push({...best}); else if(best.score>result.bests[index].score) result.bests[index]={...best}; }
  result.bests.sort((x,y)=>x.scoreVersion-y.scoreVersion); return result;
}
