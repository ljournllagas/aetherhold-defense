import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import a from '../../migrations/0001_initial.sql?raw';
import b from '../../migrations/0002_run_version.sql?raw';
import c from '../../migrations/0003_score_constraints.sql?raw';
import d from '../../migrations/0004_progression_results.sql?raw';
import e from '../../migrations/0005_player_accounts.sql?raw';
import {emptyCloudProgress} from '../../src/shared/cloudProgress.ts';
import {hash} from '../../worker/auth.ts';
export async function accountDb(){
  const mf=new Miniflare(convertV4MiniflareOptions({modules:true,script:'export default {fetch(){return new Response("ok")}}',d1Databases:['DB'],compatibilityDate:'2024-11-01'}));const native=await mf.getD1Database('DB');
  for(const sql of [a,b,c,d,e])for(const s of sql.replace(/^--.*$/gm,'').split(';').filter(s=>s.trim()))await native.prepare(s).run();
  const db=native as unknown as D1Database;
  for(const id of ['a','b']){await db.prepare('INSERT INTO players(id,generation,issuer,subject,nickname,progress_json) VALUES(?,?,?,?,?,?)').bind(id,`g-${id}`,'https://accounts.google.com',`sub-${id}`,`Name ${id}`,JSON.stringify(emptyCloudProgress())).run();await db.prepare('INSERT INTO sessions(token_hash,player_id,generation,expires_at,csrf,reauthenticated_at) VALUES(?,?,?,?,?,?)').bind(await hash(`token-${id}`),id,`g-${id}`,Date.now()+1000000,`csrf-${id}`,Date.now()).run();}
  const env={DB:db,APP_ORIGIN:'https://game.example',ACCOUNT_LOGIN_REQUIRED:'1',SCORE_RATE_LIMITER:{limit:async()=>({success:true})} as RateLimit};
  const request=(path:string,id='a',body?:unknown,method=body===undefined?'GET':'POST')=>new Request(`https://game.example${path}`,{method,headers:{Cookie:`__Host-aether-session=token-${id}`,Origin:'https://game.example','X-CSRF-Token':`csrf-${id}`,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
  return {db,env,request,dispose:()=>mf.dispose()};
}
