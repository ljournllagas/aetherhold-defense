import type {AccountRef,CloudProgress,GuestSnapshot} from '../../shared/account.ts';
import {accountKey} from '../../shared/account.ts';
import {emptyCloudProgress,validateCloudProgress,validatePersonalBest} from '../../shared/cloudProgress.ts';
import {validateScorePayload} from '../../shared/validation.ts';
import {editPlayerName} from '../../shared/playerName.ts';
import {campaignRepository,CAMPAIGN_STORAGE_KEY,parseCampaignProfile,setCampaignAccountStorage} from '../campaign/progress.ts';
import {unlockRepository,UNLOCK_STORAGE_KEY,setUnlockAccountStorage} from './UnlockSystem.ts';
import {applyAccountBests,loadBest,loadLegacyBests,setBestAccount} from './Settings.ts';
export function browserStore():Storage|null {try{return typeof localStorage==='undefined'?null:localStorage;}catch{return null;}}
export function guestSnapshot(storage:Pick<Storage,'getItem'>|null=browserStore()):GuestSnapshot {
  const result:GuestSnapshot={progress:emptyCloudProgress(),nickname:'',result:null,warnings:[]};
  if(!storage)return result;
  const read=(key:string):unknown=>{try{const raw=storage.getItem(key);return raw===null?null:JSON.parse(raw);}catch{result.warnings.push(`${key}: saved data could not be read`);return null;}};
  const campaign=read(CAMPAIGN_STORAGE_KEY);if(campaign!==null){const profile=parseCampaignProfile(campaign);if(profile)result.progress.levels=profile.levels;else result.warnings.push('Campaign save is incompatible and was protected');}
  const unlock=read(UNLOCK_STORAGE_KEY);if(unlock!==null){const p=unlock as {version?:unknown;earned?:unknown};const validated=validateCloudProgress({...emptyCloudProgress(),earned:p.version===1?p.earned:null});if(validated)result.progress.earned=validated.earned;else result.warnings.push('Classic unlock save is incompatible and was protected');}
  for(const [key,era] of [['aetherhold-best-score-v3',3],['aetherhold-best-score-v2',2],['aetherhold-best-v1',1]] as const){const best=read(key);if(best&&typeof best==='object'){const p=validatePersonalBest({...best,scoreVersion:(best as {scoreVersion?:number}).scoreVersion??era});if(p)result.progress.bests.push(p);else result.warnings.push('Personal best is incompatible and was protected');}}
  const settings=read('aetherhold-settings-v1') as {playerName?:unknown}|null;result.nickname=editPlayerName(settings?.playerName);
  const retry=read('aetherhold-score-retry-v1') as {version?:number;payload?:unknown}|null;
  if(retry){const p=validateScorePayload(retry.payload);if(retry.version===1&&p.ok&&p.value)result.result={mode:'classic',payload:p.value};else result.warnings.push('Saved score is incompatible and was protected');}
  return result;
}
export function selectAccountProgress(ref:AccountRef|null):void {
  const storage=browserStore(),prefix=ref?`account:${accountKey(ref)}:`:'';
  const adapter=storage?{getItem:(key:string)=>storage.getItem(prefix+key),setItem:(key:string,value:string)=>storage.setItem(prefix+key,value)}:null;
  setCampaignAccountStorage(adapter);setUnlockAccountStorage(adapter);setBestAccount(ref);
}
export function seedGuestPreferences(ref:AccountRef):void {
  const storage=browserStore();if(!storage)return;const target=`account:${accountKey(ref)}:${CAMPAIGN_STORAGE_KEY}`;
  if(storage.getItem(target)!==null)return;const raw=storage.getItem(CAMPAIGN_STORAGE_KEY);if(raw!==null&&parseCampaignProfile(JSON.parse(raw)))storage.setItem(target,raw);
}
export function readActiveCloudProgress():CloudProgress {return {...emptyCloudProgress(),levels:campaignRepository.view().profile.levels,earned:unlockRepository.view().profile.earned,bests:[loadBest(),...loadLegacyBests()].filter((x):x is NonNullable<typeof x>=>x!==null) as CloudProgress['bests']};}
export function applyCloudProgress(progress:CloudProgress):void {campaignRepository.applyCloud(progress.levels);unlockRepository.applyCloud(progress.earned);applyAccountBests(progress.bests);}
export function purgeLocalAccount(ref:AccountRef):void {const s=browserStore();if(!s)return;const prefix=`account:${accountKey(ref)}:`;for(let i=s.length-1;i>=0;i--){const key=s.key(i);if(key?.startsWith(prefix))s.removeItem(key);}}
