import type {AccountConfig,AccountSession,AccountProfile,CloudProgress,GuestClaim,RunResult,ScoreAck,ApiResult} from '../shared/account.ts';
import { plain,validateCloudProgress } from '../shared/cloudProgress.ts';
async function call<T>(path:string,method='GET',data?:unknown,csrf?:string):Promise<ApiResult<T>>{
  try {
    const response=await fetch(path,{method,credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(8000),headers:{...(data!==undefined?{'Content-Type':'application/json'}:{}),...(csrf?{'X-CSRF-Token':csrf}:{})},body:data!==undefined?JSON.stringify(data):undefined});
    const value:unknown=await response.json();
    if(!plain(value))return {ok:false,code:'INVALID_RESPONSE',message:'Server response was unreadable.',status:502};
    if(!response.ok||value.ok!==true){const retry=response.headers.get('Retry-After');return {ok:false,code:typeof value.code==='string'?value.code:'API_ERROR',message:typeof value.message==='string'?value.message:'Account service unavailable.',status:response.status,retryAfterMs:retry?(Number.isFinite(Number(retry))?Number(retry)*1000:Math.max(0,Date.parse(retry)-Date.now())):undefined};}
    return {ok:true,value:value.value as T};
  }catch{return {ok:false,code:'NETWORK',message:'Connection unavailable. Progress will retry syncing.',status:0};}
}
export interface AccountClient {
  getConfig():Promise<ApiResult<AccountConfig>>;getSession():Promise<ApiResult<AccountSession>>;getProfile():Promise<ApiResult<AccountProfile>>;
  syncProfile(progress:CloudProgress,csrf:string):Promise<ApiResult<AccountProfile>>;importGuest(claim:GuestClaim,csrf:string):Promise<ApiResult<AccountProfile>>;
  uploadResult(result:RunResult,csrf:string):Promise<ApiResult<ScoreAck>>;updateNickname(nickname:string,csrf:string):Promise<ApiResult<AccountProfile>>;
  logoutSession(csrf:string):Promise<ApiResult<{loggedOut:true}>>;deleteAccount(csrf:string):Promise<ApiResult<{deleted:true}>>;
}
function validProfile(result:ApiResult<AccountProfile>):ApiResult<AccountProfile>{if(!result.ok)return result;const p=result.value;if(!plain(p)||!plain(p.account)||typeof p.account.playerId!=='string'||typeof p.account.generation!=='string'||typeof p.nickname!=='string'||p.nickname.length>20||!Number.isSafeInteger(p.revision)||!validateCloudProgress(p.progress))return {ok:false,code:'INCOMPATIBLE_SAVE',message:'Cloud save is incompatible.',status:409};return result;}
export const accountClient:AccountClient={
  async getConfig(){const r=await call<AccountConfig>('/api/account/config');return r.ok&&typeof r.value?.loginRequired!=='boolean'?{ok:false,code:'INVALID_CONFIG',message:'Login configuration unavailable.',status:502}:r;},
  async getSession(){const r=await call<AccountSession>('/api/auth/session');if(r.ok&&(!r.value?.account||typeof r.value.account.playerId!=='string'||typeof r.value.account.generation!=='string'||typeof r.value.csrf!=='string'||typeof r.value.nickname!=='string'||!Number.isFinite(r.value.expiresAt)||typeof r.value.canDelete!=='boolean'))return {ok:false,code:'INVALID_RESPONSE',message:'Login response unreadable.',status:502};return r;},
  async getProfile(){return validProfile(await call<AccountProfile>('/api/account'));},
  async syncProfile(progress,csrf){return validProfile(await call<AccountProfile>('/api/account/sync','POST',{progress},csrf));},
  async importGuest(claim,csrf){return validProfile(await call<AccountProfile>('/api/account/import','POST',{importId:claim.importId,generation:claim.account.generation,snapshot:claim.snapshot},csrf));},
  async uploadResult(result,csrf){const r=await call<ScoreAck>('/api/account/scores','POST',result,csrf);if(r.ok&&(!r.value||r.value.runId!==result.payload.runId||r.value.mode!==result.mode||!Number.isSafeInteger(r.value.id)||r.value.id<1||typeof r.value.nickname!=='string'))return {ok:false,code:'INVALID_ACK',message:'Score acknowledgement did not match this run. Retrying safely.',status:502};return r;},
  async updateNickname(nickname,csrf){return validProfile(await call<AccountProfile>('/api/account/nickname','PATCH',{nickname},csrf));},
  logoutSession:csrf=>call<{loggedOut:true}>('/api/auth/logout','POST',{},csrf),deleteAccount:csrf=>call<{deleted:true}>('/api/account/delete','POST',{confirm:true},csrf)
};
