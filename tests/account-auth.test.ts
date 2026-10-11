import { expect,it,vi } from 'vitest';
import { checkMutation, authCookie, freshGoogleAuthentication,handleAuth } from '../worker/auth.ts';
import {accountDb} from './helpers/accountDb.ts';
it('requires same origin and matching session csrf',()=>{
  const session={account:{playerId:'a',generation:'g'},nickname:'Warden',expiresAt:99,csrf:'secret',canDelete:false};
  const env={APP_ORIGIN:'https://game.example'};
  expect(checkMutation(new Request('https://game.example/api/account',{method:'POST',headers:{Origin:'https://game.example','X-CSRF-Token':'secret'}}),session,env)).toBe(true);
  expect(checkMutation(new Request('https://game.example/api/account',{method:'POST',headers:{Origin:'https://evil.example','X-CSRF-Token':'secret'}}),session,env)).toBe(false);
  expect(checkMutation(new Request('https://game.example/api/account',{method:'POST'}),session,env)).toBe(false);
});

function b64(value:string|Uint8Array):string{return Buffer.from(value).toString('base64url');}
it.each(['valid','wrong-state','wrong-browser','expired-state','wrong-nonce','wrong-audience','wrong-issuer','expired-token','forged-signature','jwks-offline','cancelled'])('verifies the real OIDC callback: %s',async fault=>{
  const f=await accountDb();const env={...f.env,GOOGLE_CLIENT_ID:'test-client',GOOGLE_CLIENT_SECRET:'test-secret'};
  const keys=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',hash:'SHA-256',modulusLength:2048,publicExponent:new Uint8Array([1,0,1])},true,['sign','verify']);
  const jwk={...await crypto.subtle.exportKey('jwk',keys.publicKey),kid:'test-key',alg:'RS256',use:'sig'};
  let nonce='';
  vi.stubGlobal('fetch',vi.fn(async(url:URL|string|Request)=>{
    const path=String(url);
    if(path.includes('.well-known'))return Response.json({issuer:'https://accounts.google.com',authorization_endpoint:'https://accounts.google.com/o/oauth2/v2/auth',token_endpoint:'https://oauth2.googleapis.com/token',jwks_uri:'https://www.googleapis.com/oauth2/v3/certs',response_types_supported:['code'],subject_types_supported:['public'],id_token_signing_alg_values_supported:['RS256'],code_challenge_methods_supported:['S256']});
    if(path.includes('/certs')){if(fault==='jwks-offline')throw new Error('offline');return Response.json({keys:[jwk]});}
    if(path.includes('/token')){
      const now=Math.floor(Date.now()/1000),claims={iss:fault==='wrong-issuer'?'https://evil.example':'https://accounts.google.com',sub:'new-google-account',aud:fault==='wrong-audience'?'other-client':'test-client',iat:now,exp:fault==='expired-token'?now-100:now+3600,nonce:fault==='wrong-nonce'?'wrong':nonce};
      const content=`${b64(JSON.stringify({alg:'RS256',kid:'test-key'}))}.${b64(JSON.stringify(claims))}`;
      let signature=b64(new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',keys.privateKey,new TextEncoder().encode(content))));if(fault==='forged-signature')signature=(signature[0]==='A'?'B':'A')+signature.slice(1);
      return Response.json({access_token:'access-test',token_type:'Bearer',expires_in:3600,id_token:`${content}.${signature}`});
    }
    throw new Error('Unexpected OIDC URL');
  }));
  try{
    const start=await handleAuth(new Request('https://game.example/api/auth/start'),env);expect(start?.status).toBe(302);const destination=new URL(start!.headers.get('Location')!),state=destination.searchParams.get('state')!;nonce=destination.searchParams.get('nonce')!;
    const cookie=start!.headers.get('Set-Cookie')!.split(';')[0];if(fault==='expired-state')await f.db.prepare('UPDATE oauth_attempts SET expires_at=0').run();
    const url=new URL('https://game.example/api/auth/callback');url.searchParams.set('state',fault==='wrong-state'?'forged':state);url.searchParams.set(fault==='cancelled'?'error':'code',fault==='cancelled'?'access_denied':'test-code');
    const callback=await handleAuth(new Request(url,{headers:{Cookie:fault==='wrong-browser'?'__Host-aether-oauth=wrong':cookie}}),env);
    const session=callback?.headers.get('Set-Cookie')??'';
    if(fault==='valid'){
      expect(session).toContain('__Host-aether-session=');expect(session).toContain('Secure; HttpOnly; SameSite=Lax');
      const replay=await handleAuth(new Request(url,{headers:{Cookie:cookie}}),env);expect(replay?.headers.get('Set-Cookie')).toBeNull();
    }else expect(session).not.toContain('__Host-aether-session=');
    expect((await f.db.prepare('SELECT COUNT(*) n FROM sessions').first())?.n).toBe(fault==='valid'?3:2);
  }finally{vi.unstubAllGlobals();await f.dispose();}
},20000);
it('does not equate a freshly issued token to recent authentication',()=>{
  expect(freshGoogleAuthentication({auth_time:100},500000)).toBe(false);
  expect(freshGoogleAuthentication({iat:500},500000)).toBe(false);
  expect(freshGoogleAuthentication({auth_time:501},500000)).toBe(false);
  expect(freshGoogleAuthentication({auth_time:499},500000)).toBe(true);
  expect(authCookie('token','https://game.example',1000)).toContain('Secure; HttpOnly; SameSite=Lax');
});
