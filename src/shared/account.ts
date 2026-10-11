import type { CampaignLevelProgress } from '../game/campaign/types.ts';
import type { BranchId } from './progression.ts';
import type { GameResultPayload } from './types.ts';
export interface AccountRef { playerId: string; generation: string }
export interface PersonalBest { score: number; wave: number; difficulty:'easy'|'medium'|'hard'; date:string; scoreVersion:number }
export interface CloudProgress { version:1; campaignVersion:number; progressionVersion:number; levels:Partial<Record<number,CampaignLevelProgress>>; earned:Partial<Record<BranchId,string>>; bests:PersonalBest[] }
export interface AccountSession { account:AccountRef; nickname:string; expiresAt:number; csrf:string; canDelete:boolean }
export interface AccountConfig { loginRequired:boolean }
export type SyncStatus='loading'|'pending'|'retrying'|'synced'|'permanent'|'incompatible'|'unavailable';
export interface AccountProfile { account:AccountRef; nickname:string; revision:number; progress:CloudProgress }
export interface CampaignResultPayload { runId:string; campaignVersion:number; progressionVersion:number; level:number; outcome:'victory'|'defeat'|'siege-failed'; finalScore:number; remainingLives:number; gameDurationSeconds:number; gameVersion:string }
export type RunResult={mode:'classic';payload:GameResultPayload}|{mode:'campaign';payload:CampaignResultPayload};
export interface PendingResult { account:AccountRef;result:RunResult;status:'pending'|'permanent';error?:string }
export interface GuestSnapshot { progress:CloudProgress;nickname:string;result:RunResult|null;warnings:string[] }
export interface GuestClaim { importId:string;account:AccountRef;snapshot:GuestSnapshot;consumed:boolean }
export type ApiResult<T>={ok:true;value:T}|{ok:false;code:string;message:string;status:number;retryAfterMs?:number};
export interface ScoreAck { runId:string;mode:RunResult['mode'];id:number;nickname:string;anonymousExisting?:boolean }
export type AuthState='loading'|'signed-out'|'ready'|'offline'|'expired'|'deleting'|'deleted'|'error';
export interface AccountView { state:AuthState;config:AccountConfig|null;playMode:'blocked'|'legacy'|'account';session:AccountSession|null;profile:AccountProfile|null;warning:string|null;pending:number;progressSync:SyncStatus;resultSync:SyncStatus;acknowledgedRevision:number|null;progressDirty:boolean }
export function sameAccount(a:AccountRef|null,b:AccountRef|null):boolean { return !!a && !!b && a.playerId===b.playerId && a.generation===b.generation; }
export function accountKey(a:AccountRef):string { return `${a.playerId}:${a.generation}`; }
export function sameResult(a:RunResult,b:RunResult):boolean {
  if(a.mode!==b.mode) return false;
  const keys=Object.keys(a.payload).filter(k=>k!=='playerName').sort();
  return JSON.stringify(keys)===JSON.stringify(Object.keys(b.payload).filter(k=>k!=='playerName').sort()) && keys.every(k=>a.payload[k as keyof typeof a.payload]===b.payload[k as keyof typeof b.payload]);
}
