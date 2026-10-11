import type { RunResult } from '../src/shared/account.ts';
import { validateScorePayload } from '../src/shared/validation.ts';
import { validateCampaignResult } from '../src/shared/campaignResult.ts';
import { plain, only } from '../src/shared/cloudProgress.ts';
import { body,checkMutation,fail,hash,missingSession,reply,requireSession,type AuthEnv } from './auth.ts';
export function canonicalResult(result:{mode:string;payload:object}):string { return JSON.stringify({mode:result.mode,payload:Object.fromEntries(Object.entries(result.payload).filter(([key])=>key!=='playerName').sort(([a],[b])=>a.localeCompare(b)))}); }
export function validateRunResult(v:unknown):RunResult|null {
  if(!plain(v)||!only(v,['mode','payload'])||!plain(v.payload))return null;
  if(v.mode==='campaign'){const p=validateCampaignResult(v.payload);return p?{mode:'campaign',payload:p}:null;}
  if(v.mode==='classic'){const p=validateScorePayload({...v.payload,playerName:'Warden'});return p.ok&&p.value?{mode:'classic',payload:p.value}:null;}
  return null;
}
export async function handleAccountScore(request:Request,env:AuthEnv & {SCORE_RATE_LIMITER?:RateLimit}):Promise<Response|null> {
  if(new URL(request.url).pathname!=='/api/account/scores'||request.method!=='POST')return null;
  const session=await requireSession(request,env);if(!session)return missingSession(request,env);if(!checkMutation(request,session,env))return fail('CSRF','Request could not be verified.',403);
  const quota=await env.SCORE_RATE_LIMITER?.limit({key:`account-scores:${session.account.playerId}`});if(!quota)return fail('API_UNAVAILABLE','Score submission is temporarily unavailable.',503);if(!quota.success){const r=fail('RATE_LIMITED','Uploads are limited. Retrying shortly.',429);r.headers.set('Retry-After','60');return r;}
  const input=await body(request,4096),result=validateRunResult(input);if(!result)return fail('INVALID_SCORE','Invalid or unsupported terminal result.',400);
  const canonical=canonicalResult(result),p=result.payload;
  if(result.mode==='campaign')await env.DB.prepare('INSERT INTO campaign_scores(run_id,player_id,generation,nickname,payload_json) SELECT ?,id,generation,nickname,? FROM players WHERE id=? AND generation=? ON CONFLICT(run_id) DO NOTHING').bind(p.runId,canonical,session.account.playerId,session.account.generation).run();
  else {
    const s=result.payload;
    await env.DB.prepare('INSERT INTO scores(run_id,player_name,difficulty,highest_wave,final_score,enemies_killed,bosses_killed,remaining_lives,game_duration_seconds,game_version,score_version,waves_completed,outcome,siege_bosses_defeated,player_id,account_generation,result_json) SELECT ?,nickname,?,?,?,?,?,?,?,?,?,?,?,?,id,generation,? FROM players WHERE id=? AND generation=? ON CONFLICT(run_id) DO NOTHING').bind(s.runId,s.difficulty,s.highestWave,s.finalScore,s.enemiesKilled,s.bossesKilled,s.remainingLives,s.gameDurationSeconds,s.gameVersion,s.scoreVersion,s.wavesCompleted,s.outcome,s.siegeBossesDefeated,canonical,session.account.playerId,session.account.generation).run();
  }
  const row=await env.DB.prepare(result.mode==='campaign'?'SELECT id,player_id,generation AS account_generation,nickname AS player_name,payload_json AS result_json FROM campaign_scores WHERE run_id=?':'SELECT * FROM scores WHERE run_id=?').bind(p.runId).first<Record<string,unknown>>();
  if(!row)return fail('ACCOUNT_DELETED','Account no longer exists.',401);
  if(row.player_id===null && result.mode==='classic') {
    const claim=await env.DB.prepare('SELECT import_id FROM guest_imports WHERE player_id=? AND generation=? AND consumed=1 AND result_digest=?').bind(session.account.playerId,session.account.generation,await hash(canonical)).first();
    const s=result.payload;
    const fields:Record<string,unknown>={difficulty:s.difficulty,highest_wave:s.highestWave,final_score:s.finalScore,enemies_killed:s.enemiesKilled,bosses_killed:s.bossesKilled,remaining_lives:s.remainingLives,game_duration_seconds:s.gameDurationSeconds,game_version:s.gameVersion,score_version:s.scoreVersion,waves_completed:s.wavesCompleted,outcome:s.outcome,siege_bosses_defeated:s.siegeBossesDefeated};
    if(claim&&Object.entries(fields).every(([k,v])=>row[k]===v))return reply({ok:true,value:{mode:result.mode,runId:p.runId,id:row.id,nickname:row.player_name,anonymousExisting:true}});
  }
  if(row.player_id!==session.account.playerId||row.account_generation!==session.account.generation||row.result_json!==canonical)return fail('RUN_CONFLICT','Run ID belongs to different result data.',409);
  return reply({ok:true,value:{mode:result.mode,runId:p.runId,id:row.id,nickname:row.player_name}});
}
