import * as oauth from 'oauth4webapi';
import type { AccountSession } from '../src/shared/account.ts';
import { emptyCloudProgress, plain } from '../src/shared/cloudProgress.ts';
export interface AuthEnv { DB:D1Database; GOOGLE_CLIENT_ID?:string; GOOGLE_CLIENT_SECRET?:string; APP_ORIGIN?:string; ACCOUNT_LOGIN_REQUIRED?:string }
export function reply(value:unknown,status=200):Response { return Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}}); }
export function fail(code:string,message:string,status:number):Response { return reply({ok:false,code,message,status},status); }
export async function hash(value:string):Promise<string> { return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),n=>n.toString(16).padStart(2,'0')).join(''); }
export function random():string { return Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join(''); }
function cookieName(origin:string):string { return origin.startsWith('https:')?'__Host-aether-session':'aether-dev-session'; }
export function authCookie(token:string,origin:string,maxAge:number):string { return `${cookieName(origin)}=${token}; Path=/; Max-Age=${maxAge}; ${origin.startsWith('https:')?'Secure; ':''}HttpOnly; SameSite=Lax`; }
function cookie(request:Request,name:string):string|null { return request.headers.get('Cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith(`${name}=`))?.slice(name.length+1)??null; }
export function sessionToken(request:Request,env:AuthEnv):string|null { return cookie(request,cookieName(env.APP_ORIGIN??new URL(request.url).origin)); }
export function checkMutation(request:Request,session:AccountSession,env:Pick<AuthEnv,'APP_ORIGIN'>):boolean { return request.headers.get('Origin')===(env.APP_ORIGIN??new URL(request.url).origin) && request.headers.get('X-CSRF-Token')===session.csrf; }
export function freshGoogleAuthentication(claims:Record<string,unknown>,now:number):boolean { return Number.isSafeInteger(claims.auth_time)&&Number(claims.auth_time)*1000<=now&&now-Number(claims.auth_time)*1000<=300000; }
export async function requireSession(request:Request,env:AuthEnv):Promise<AccountSession|null> {
  const token=sessionToken(request,env); if(!token) return null;
  const row=await env.DB.prepare('SELECT s.player_id,s.generation,s.expires_at,s.csrf,s.reauthenticated_at,p.nickname FROM sessions s JOIN players p ON p.id=s.player_id AND p.generation=s.generation WHERE token_hash=?1 AND expires_at>?2').bind(await hash(token),Date.now()).first<{player_id:string;generation:string;expires_at:number;csrf:string;reauthenticated_at:number|null;nickname:string}>();
  return row?{account:{playerId:row.player_id,generation:row.generation},nickname:row.nickname,expiresAt:row.expires_at,csrf:row.csrf,canDelete:row.reauthenticated_at!==null && row.reauthenticated_at<=Date.now() && Date.now()-row.reauthenticated_at<=300000}:null;
}
export async function missingSession(request:Request,env:AuthEnv):Promise<Response> {
  const token=sessionToken(request,env);
  if(token&&await env.DB.prepare('SELECT token_hash FROM revoked_sessions WHERE token_hash=? AND expires_at>?').bind(await hash(token),Date.now()).first()) return fail('ACCOUNT_DELETED','This account was deleted. Local account data will be cleared.',401);
  return fail('AUTH_REQUIRED','Please sign in again.',401);
}
export async function body(request:Request,max=65536):Promise<Record<string,unknown>|null> {
  const reader=request.body?.getReader(); if(!reader||!request.headers.get('Content-Type')?.includes('application/json')) return null;
  let size=0,text=''; const decoder=new TextDecoder('utf-8',{fatal:true});
  try { for(;;){const chunk=await reader.read();if(chunk.done)break;size+=chunk.value.byteLength;if(size>max){await reader.cancel();return null;}text+=decoder.decode(chunk.value,{stream:true});} const v:unknown=JSON.parse(text+decoder.decode());return plain(v)?v:null; } catch {return null;}
}
export async function handleAuth(request:Request,env:AuthEnv):Promise<Response|null> {
  const url=new URL(request.url),origin=env.APP_ORIGIN??url.origin;
  if(url.pathname==='/api/account/config'&&request.method==='GET') return reply({ok:true,value:{loginRequired:env.ACCOUNT_LOGIN_REQUIRED!=='0'}});
  if(!url.pathname.startsWith('/api/auth/')) return null;
  if(url.pathname==='/api/auth/session'&&request.method==='GET'){const s=await requireSession(request,env);return s?reply({ok:true,value:s}):missingSession(request,env);}
  if(url.pathname==='/api/auth/logout'&&request.method==='POST') {
    const s=await requireSession(request,env); if(!s)return missingSession(request,env); if(!checkMutation(request,s,env))return fail('CSRF','Request could not be verified.',403);
    await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await hash(sessionToken(request,env)!)).run();
    const response=reply({ok:true,value:{loggedOut:true}});response.headers.set('Set-Cookie',authCookie('',origin,0));return response;
  }
  if(!env.GOOGLE_CLIENT_ID||!env.GOOGLE_CLIENT_SECRET||!env.APP_ORIGIN) return fail('AUTH_UNCONFIGURED','Google sign-in has not been configured yet.',503);
  const issuer=new URL('https://accounts.google.com');
  const options={signal:AbortSignal.timeout(8000)};
  const as=await oauth.discoveryRequest(issuer,options).then(r=>oauth.processDiscoveryResponse(issuer,r));
  const client:oauth.Client={client_id:env.GOOGLE_CLIENT_ID};
  const browserName=origin.startsWith('https:')?'__Host-aether-oauth':'aether-dev-oauth';
  if(url.pathname==='/api/auth/start'&&request.method==='GET') {
    const purpose=url.searchParams.get('purpose')==='delete'?'delete':'login';
    const session=purpose==='delete'?await requireSession(request,env):null;
    if(purpose==='delete'&&!session)return missingSession(request,env);
    const state=random(),browser=random(),nonce=oauth.generateRandomNonce(),verifier=oauth.generateRandomCodeVerifier();
    await env.DB.batch([env.DB.prepare('DELETE FROM oauth_attempts WHERE state_hash IN(SELECT state_hash FROM oauth_attempts WHERE expires_at<? LIMIT 100)').bind(Date.now()),env.DB.prepare('DELETE FROM revoked_sessions WHERE token_hash IN(SELECT token_hash FROM revoked_sessions WHERE expires_at<? LIMIT 100)').bind(Date.now()),env.DB.prepare('DELETE FROM sessions WHERE token_hash IN(SELECT token_hash FROM sessions WHERE expires_at<? LIMIT 100)').bind(Date.now()),env.DB.prepare('INSERT INTO oauth_attempts(state_hash,browser_hash,verifier,nonce,expires_at,purpose,player_id,generation) VALUES(?,?,?,?,?,?,?,?)').bind(await hash(state),await hash(browser),verifier,nonce,Date.now()+600000,purpose,session?.account.playerId??null,session?.account.generation??null)]);
    const destination=new URL(as.authorization_endpoint!);
    const params={client_id:client.client_id,redirect_uri:`${origin}/api/auth/callback`,response_type:'code',scope:'openid profile',state,nonce,code_challenge:await oauth.calculatePKCECodeChallenge(verifier),code_challenge_method:'S256',prompt:purpose==='delete'?'select_account consent':'select_account'};
    Object.entries(params).forEach(([k,v])=>destination.searchParams.set(k,v));
    if(purpose==='delete')destination.searchParams.set('claims',JSON.stringify({id_token:{auth_time:{essential:true}}}));
    return new Response(null,{status:302,headers:{Location:destination.href,'Cache-Control':'no-store','Set-Cookie':`${browserName}=${browser}; Path=/; Max-Age=600; ${origin.startsWith('https:')?'Secure; ':''}HttpOnly; SameSite=Lax`}});
  }
  if(url.pathname==='/api/auth/callback'&&request.method==='GET') {
    const state=url.searchParams.get('state'),browser=cookie(request,browserName);
    if(!state||!browser)return new Response(null,{status:302,headers:{Location:'/?authError=invalid-attempt','Cache-Control':'no-store'}});
    const attempt=await env.DB.prepare('DELETE FROM oauth_attempts WHERE state_hash=? AND browser_hash=? AND expires_at>? RETURNING *').bind(await hash(state),await hash(browser),Date.now()).first<{verifier:string;nonce:string;purpose:string;player_id:string|null;generation:string|null}>();
    if(!attempt)return new Response(null,{status:302,headers:{Location:'/?authError=invalid-attempt','Cache-Control':'no-store'}});
    try {
      const params=oauth.validateAuthResponse(as,client,url,state);
      const response=await oauth.authorizationCodeGrantRequest(as,client,oauth.ClientSecretPost(env.GOOGLE_CLIENT_SECRET),params,`${origin}/api/auth/callback`,attempt.verifier,options);
      const tokens=await oauth.processAuthorizationCodeResponse(as,client,response,{expectedNonce:attempt.nonce,requireIdToken:true});
      await oauth.validateApplicationLevelSignature(as,response,options);
      const claims=oauth.getValidatedIdTokenClaims(tokens)!;
      if(attempt.purpose==='delete'){
        const current=await requireSession(request,env);
        const p=await env.DB.prepare('SELECT subject FROM players WHERE id=? AND generation=?').bind(attempt.player_id,attempt.generation).first<{subject:string}>();
        if(!current||current.account.playerId!==attempt.player_id||current.account.generation!==attempt.generation||p?.subject!==claims.sub||!freshGoogleAuthentication(claims,Date.now()))throw new Error('reauth');
        await env.DB.prepare('UPDATE sessions SET reauthenticated_at=? WHERE token_hash=? AND player_id=? AND generation=?').bind(Number(claims.auth_time)*1000,await hash(sessionToken(request,env)!),attempt.player_id,attempt.generation).run();
        return new Response(null,{status:302,headers:{Location:'/?accountDelete=confirm','Cache-Control':'no-store'}});
      }
      await env.DB.prepare('INSERT INTO players(id,generation,issuer,subject,nickname,progress_json) VALUES(?,?,?,?,?,?) ON CONFLICT(issuer,subject) DO NOTHING').bind(crypto.randomUUID(),crypto.randomUUID(),issuer.href.replace(/\/$/,''),claims.sub,'Warden',JSON.stringify(emptyCloudProgress())).run();
      const player=await env.DB.prepare('SELECT id,generation FROM players WHERE issuer=? AND subject=?').bind(issuer.href.replace(/\/$/,''),claims.sub).first<{id:string;generation:string}>();
      if(!player)throw new Error('account');const token=random();
      await env.DB.prepare('INSERT INTO sessions(token_hash,player_id,generation,expires_at,csrf) SELECT ?,id,generation,?,? FROM players WHERE id=? AND generation=?').bind(await hash(token),Date.now()+2592000000,random(),player.id,player.generation).run();
      return new Response(null,{status:302,headers:{Location:'/?signedIn=1','Cache-Control':'no-store','Set-Cookie':authCookie(token,origin,2592000)}});
    }catch{return new Response(null,{status:302,headers:{Location:`/?authError=${attempt.purpose==='delete'?'reauth-required':'sign-in-failed'}`,'Cache-Control':'no-store'}});}
  }
  return fail('NOT_FOUND','Unknown login endpoint.',404);
}
