import {expect,it} from 'vitest';
import worker from '../worker/index.ts';
import {accountDb} from './helpers/accountDb.ts';
import {emptyCloudProgress} from '../src/shared/cloudProgress.ts';
import {resultFixture} from './helpers/progressionResult.ts';
it('merges two devices concurrently and accepts repeated immutable scores exactly once',async()=>{
 const f=await accountDb();try{
  const p=emptyCloudProgress(),q=emptyCloudProgress();p.levels[1]={completed:true,completionStar:true,livesStar:false,scoreStar:false,bestScore:100,bestRemainingLives:10};q.levels[2]={...p.levels[1]!};
  const replies=await Promise.all([worker.fetch(f.request('/api/account/sync','a',{progress:p}),f.env),worker.fetch(f.request('/api/account/sync','a',{progress:q}),f.env)]);expect(replies.map(x=>x.status)).toEqual([200,200]);
  const profile=await (await worker.fetch(f.request('/api/account'),f.env)).json() as {value:{progress:typeof p}};expect(Object.keys(profile.value.progress.levels)).toHaveLength(2);
  const payload=resultFixture({highestWave:30,wavesCompleted:30,outcome:'victory',siegeBossesDefeated:7},10,{runId:'account-run-123'}),result={mode:'classic',payload};
  const first=await worker.fetch(f.request('/api/account/scores','a',result),f.env);expect(first.status).toBe(200);const value=await first.json();
  await worker.fetch(f.request('/api/account/nickname','a',{nickname:'Changed'},'PATCH'),f.env);
  const repeat=await worker.fetch(f.request('/api/account/scores','a',{...result,payload:{...payload,playerName:'Ignored'}}),f.env);expect(await repeat.json()).toEqual(value);
  expect((await f.db.prepare('SELECT COUNT(*) n FROM scores').first())?.n).toBe(1);
  expect((await worker.fetch(f.request('/api/account/scores','b',result),f.env)).status).toBe(409);
  expect((await worker.fetch(f.request('/api/account/scores','a',{...result,payload:{...payload,gameDurationSeconds:payload.gameDurationSeconds+1}}),f.env)).status).toBe(409);
 }finally{await f.dispose();}
},15000);
it('claims browser imports once and never assigns anonymous history',async()=>{
 const f=await accountDb();try{
  const importId=crypto.randomUUID(),snapshot={progress:emptyCloudProgress(),nickname:'Imported',result:null,warnings:[]};
  const first=await worker.fetch(f.request('/api/account/import','a',{importId,generation:'g-a',snapshot}),f.env);expect(first.status).toBe(200);
  const again=await worker.fetch(f.request('/api/account/import','a',{importId,generation:'g-a',snapshot}),f.env);expect(again.status).toBe(200);
  const another=await worker.fetch(f.request('/api/account/import','b',{importId,generation:'g-b',snapshot}),f.env);expect(another.status).toBe(409);
  expect((await f.db.prepare('SELECT COUNT(*) n FROM guest_imports').first())?.n).toBe(1);
 }finally{await f.dispose();}
},15000);
it('rejects cross-origin, unauthenticated and unsupported saves',async()=>{
 const f=await accountDb();try{
  expect((await worker.fetch(new Request('https://game.example/api/account'),f.env)).status).toBe(401);
  const wrong=f.request('/api/account/sync','a',{progress:emptyCloudProgress()});wrong.headers.set('Origin','https://evil.example');expect((await worker.fetch(wrong,f.env)).status).toBe(403);
  expect((await worker.fetch(f.request('/api/account/sync','a',{progress:{...emptyCloudProgress(),version:99}}),f.env)).status).toBe(409);
  expect((await worker.fetch(f.request('/api/scores','a',{}),f.env)).status).toBe(401);
  const config=await worker.fetch(new Request('https://game.example/api/account/config'),{...f.env,ACCOUNT_LOGIN_REQUIRED:undefined});expect(await config.json()).toMatchObject({value:{loginRequired:true}});
 }finally{await f.dispose();}
},15000);
it('keeps Campaign results outside Classic leaderboard',async()=>{
 const f=await accountDb();try{
  const result={mode:'campaign',payload:{runId:'campaign-run-123',campaignVersion:1,progressionVersion:1,level:1,outcome:'victory',finalScore:100,remainingLives:20,gameDurationSeconds:10,gameVersion:'0.3.0'}};
  expect((await worker.fetch(f.request('/api/account/scores','a',result),f.env)).status).toBe(200);
  expect((await f.db.prepare('SELECT COUNT(*) n FROM scores').first())?.n).toBe(0);expect((await f.db.prepare('SELECT COUNT(*) n FROM campaign_scores').first())?.n).toBe(1);
 }finally{await f.dispose();}
},15000);
