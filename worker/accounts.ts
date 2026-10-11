import type { AccountProfile, AccountRef, AccountSession } from '../src/shared/account.ts';
import { mergeCloudProgress, validateCloudProgress, plain, only } from '../src/shared/cloudProgress.ts';
import { validatePlayerName, runPlayerName } from '../src/shared/playerName.ts';
import { body, checkMutation, fail, hash, missingSession, reply, requireSession, sessionToken, authCookie, type AuthEnv } from './auth.ts';
import { canonicalResult, validateRunResult } from './accountScores.ts';
interface ProfileRow { id:string;generation:string;nickname:string;revision:number;progress_json:string }
export function parseProfileRow(row:ProfileRow):AccountProfile|null {
  try {const progress=validateCloudProgress(JSON.parse(row.progress_json));return progress?{account:{playerId:row.id,generation:row.generation},nickname:row.nickname,revision:row.revision,progress}:null;}catch{return null;}
}
async function read(db:D1Database,ref:AccountRef):Promise<AccountProfile|null> {const row=await db.prepare('SELECT id,generation,nickname,revision,progress_json FROM players WHERE id=? AND generation=?').bind(ref.playerId,ref.generation).first<ProfileRow>();return row?parseProfileRow(row):null;}
export async function handleAccount(request:Request,env:AuthEnv):Promise<Response|null> {
  const path=new URL(request.url).pathname;
  if(!['/api/account','/api/account/sync','/api/account/import','/api/account/nickname','/api/account/delete'].includes(path))return null;
  const session=await requireSession(request,env);if(!session)return missingSession(request,env);
  if(path==='/api/account'&&request.method==='GET'){const profile=await read(env.DB,session.account);return profile?reply({ok:true,value:profile}):fail('INCOMPATIBLE_SAVE','Cloud save could not be read.',409);}
  if(!checkMutation(request,session,env))return fail('CSRF','Request could not be verified.',403);
  if(path==='/api/account/delete'&&request.method==='POST')return deleteAccount(request,env,session);
  const input=await body(request,path==='/api/account/nickname'?1024:65536);if(!input)return fail('INVALID_BODY','Request body is invalid or too large.',400);
  if(path==='/api/account/nickname'&&request.method==='PATCH'){
    const v=validatePlayerName(input.nickname);if(!v.ok||!only(input,['nickname']))return fail('INVALID_NAME',v.error??'Invalid name.',400);
    await env.DB.prepare('UPDATE players SET nickname=?,nickname_initialized=1 WHERE id=? AND generation=?').bind(v.name,session.account.playerId,session.account.generation).run();const profile=await read(env.DB,session.account);return profile?reply({ok:true,value:profile}):fail('ACCOUNT_DELETED','Account no longer exists.',401);
  }
  if(request.method!=='POST'||!['/api/account/sync','/api/account/import'].includes(path))return fail('NOT_FOUND','Unknown account operation.',404);
  const importing=path.endsWith('/import');
  const snapshot=importing&&plain(input.snapshot)?input.snapshot:null;
  const incoming=validateCloudProgress(importing?snapshot?.progress:input.progress);
  if(!incoming||(!importing&&!only(input,['progress'])))return fail('INCOMPATIBLE_SAVE','Progress has an invalid or unsupported format.',409);
  let importId:string|null=null,digest:string|null=null;
  if(importing){
    if(!only(input,['importId','generation','snapshot'])||typeof input.importId!=='string'||!/^[a-f0-9-]{36}$/.test(input.importId)||input.generation!==session.account.generation||!snapshot||!only(snapshot,['progress','nickname','result','warnings'])||typeof snapshot.nickname!=='string'||snapshot.nickname.length>20||!Array.isArray(snapshot.warnings)||snapshot.warnings.length>10||!snapshot.warnings.every(x=>typeof x==='string'&&x.length<300))return fail('INVALID_IMPORT','Invalid guest import.',400);
    importId=input.importId;
    if(snapshot.result!==null){const result=validateRunResult(snapshot.result);if(!result)return fail('INVALID_IMPORT','Guest result could not be imported.',400);digest=await hash(canonicalResult(result));}
  }
  for(let attempt=0;attempt<5;attempt++){
    const current=await read(env.DB,session.account);if(!current)return fail('ACCOUNT_DELETED','Account no longer exists.',401);
    if(importId){const claim=await env.DB.prepare('SELECT player_id,generation,consumed,result_digest FROM guest_imports WHERE import_id=?').bind(importId).first<{player_id:string|null;generation:string|null;consumed:number;result_digest:string|null}>();if(claim&&(claim.player_id!==session.account.playerId||claim.generation!==session.account.generation))return fail('IMPORT_CLAIMED','This browser save was already claimed.',409);if(claim?.consumed)return reply({ok:true,value:current});}
    const next=mergeCloudProgress(current.progress,incoming);
    if(importId){
      await env.DB.batch([
        env.DB.prepare('INSERT INTO guest_imports(import_id,player_id,generation,result_digest) SELECT ?,id,generation,? FROM players WHERE id=? AND generation=? ON CONFLICT(import_id) DO NOTHING').bind(importId,digest,session.account.playerId,session.account.generation),
        env.DB.prepare('UPDATE players SET progress_json=?,revision=revision+1,nickname=CASE WHEN nickname_initialized=0 THEN ? ELSE nickname END,nickname_initialized=1 WHERE id=? AND generation=? AND revision=? AND EXISTS(SELECT 1 FROM guest_imports WHERE import_id=? AND player_id=players.id AND generation=players.generation AND consumed=0)').bind(JSON.stringify(next),runPlayerName(snapshot!.nickname),session.account.playerId,session.account.generation,current.revision,importId),
        env.DB.prepare('UPDATE guest_imports SET consumed=1 WHERE changes()=1 AND import_id=? AND player_id=? AND generation=?').bind(importId,session.account.playerId,session.account.generation)
      ]);
      const claim=await env.DB.prepare('SELECT consumed,player_id,generation FROM guest_imports WHERE import_id=?').bind(importId).first<{consumed:number;player_id:string;generation:string}>();
      if(claim?.player_id!==session.account.playerId||claim?.generation!==session.account.generation)return fail('IMPORT_CLAIMED','This browser save was already claimed.',409);
      if(claim?.consumed){const profile=await read(env.DB,session.account);return profile?reply({ok:true,value:profile}):fail('ACCOUNT_DELETED','Account no longer exists.',401);}
    }else{
      const row=await env.DB.prepare('UPDATE players SET progress_json=?,revision=revision+1 WHERE id=? AND generation=? AND revision=? RETURNING id,generation,nickname,revision,progress_json').bind(JSON.stringify(next),session.account.playerId,session.account.generation,current.revision).first<ProfileRow>();if(row)return reply({ok:true,value:parseProfileRow(row)});
    }
  }
  return fail('SYNC_BUSY','Progress is being updated. Retrying shortly.',503);
}
async function deleteAccount(request:Request,env:AuthEnv,session:AccountSession):Promise<Response> {
  const input=await body(request,1024);if(!input||!only(input,['confirm'])||input.confirm!==true)return fail('CONFIRM_REQUIRED','Confirm account deletion.',400);
  if(!session.canDelete)return fail('REAUTH_REQUIRED','Sign in to Google again within five minutes before deleting.',403);
  const tokenHash=await hash(sessionToken(request,env)!);
  const guard='EXISTS(SELECT 1 FROM sessions s WHERE s.token_hash=? AND s.player_id=? AND s.generation=? AND s.reauthenticated_at>=? AND s.reauthenticated_at<=?)';
  const args=[tokenHash,session.account.playerId,session.account.generation,Date.now()-300000,Date.now()];
  const result=await env.DB.batch([
    env.DB.prepare(`INSERT INTO revoked_sessions(token_hash,reason,expires_at) SELECT token_hash,'deleted',expires_at FROM sessions WHERE player_id=? AND generation=? AND ${guard} ON CONFLICT(token_hash) DO NOTHING`).bind(session.account.playerId,session.account.generation,...args),
    env.DB.prepare(`UPDATE guest_imports SET player_id=NULL,generation=NULL,consumed=1 WHERE player_id=? AND generation=? AND ${guard}`).bind(session.account.playerId,session.account.generation,...args),
    env.DB.prepare(`DELETE FROM oauth_attempts WHERE player_id=? AND generation=? AND ${guard}`).bind(session.account.playerId,session.account.generation,...args),
    env.DB.prepare(`DELETE FROM players WHERE id=? AND generation=? AND ${guard} RETURNING id`).bind(session.account.playerId,session.account.generation,...args)
  ]);
  if(!result[3].results?.length)return fail('REAUTH_REQUIRED','Deletion authentication expired. Please retry.',403);
  const response=reply({ok:true,value:{deleted:true}});response.headers.set('Set-Cookie',authCookie('',env.APP_ORIGIN??new URL(request.url).origin,0));return response;
}
