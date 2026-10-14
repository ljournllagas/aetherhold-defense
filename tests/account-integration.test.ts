import {expect,it} from 'vitest';
import worker from '../worker/index.ts';
import {accountDb} from './helpers/accountDb.ts';
import legacyCloudCompleted30 from './fixtures/campaign-v5/legacy_cloud_completed_30.json';
import {emptyCloudProgress,validateCloudProgress} from '../src/shared/cloudProgress.ts';
import {resultFixture} from './helpers/progressionResult.ts';
import {campaignScoreMetadata} from '../src/shared/campaignScoring.ts';
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
  const importId=crypto.randomUUID(),snapshot={progress:validateCloudProgress(legacyCloudCompleted30)!,nickname:'Imported',result:null,warnings:[]};
  const first=await worker.fetch(f.request('/api/account/import','a',{importId,generation:'g-a',snapshot}),f.env);expect(first.status).toBe(200);
  const imported=await f.db.prepare('SELECT progress_json,revision FROM players WHERE id=?').bind('a').first<{progress_json:string;revision:number}>();
  const again=await worker.fetch(f.request('/api/account/import','a',{importId,generation:'g-a',snapshot}),f.env);expect(again.status).toBe(200);
  expect(await f.db.prepare('SELECT progress_json,revision FROM players WHERE id=?').bind('a').first()).toEqual(imported);
  const another=await worker.fetch(f.request('/api/account/import','b',{importId,generation:'g-b',snapshot}),f.env);expect(another.status).toBe(409);
  expect((await f.db.prepare('SELECT COUNT(*) n FROM guest_imports').first())?.n).toBe(1);
  expect(JSON.parse(imported!.progress_json).levels['30'].completed).toBe(true);
  expect(JSON.parse((await f.db.prepare('SELECT progress_json FROM players WHERE id=?').bind('b').first<{progress_json:string}>())!.progress_json).levels).toEqual({});
 }finally{await f.dispose();}
},15000);
it('accepts level 31 and 100 cloud progress and preserves it after an old-client upload',async()=>{
 const f=await accountDb();try{
  const completion={completed:true,completionStar:true,livesStar:false,scoreStar:false,bestScore:0,bestRemainingLives:0};
  const expanded=structuredClone(validateCloudProgress(legacyCloudCompleted30)!);
  expanded.levels[31]=completion;expanded.levels[40]=completion;expanded.levels[100]=completion;
  expanded.bests=[{score:900,wave:10,difficulty:'medium',date:'2026-10-12T00:00:00Z',scoreVersion:3}];
  expect((await worker.fetch(f.request('/api/account/sync','a',{progress:expanded}),f.env)).status).toBe(200);
  const old=validateCloudProgress(legacyCloudCompleted30)!;
  expect((await worker.fetch(f.request('/api/account/sync','a',{progress:old}),f.env)).status).toBe(200);
  const stored=await f.db.prepare('SELECT progress_json,revision FROM players WHERE id=?').bind('a').first<{progress_json:string;revision:number}>();
  const merged=JSON.parse(stored!.progress_json);
  expect([merged.levels['31'],merged.levels['40'],merged.levels['100']]).toEqual([completion,completion,completion]);
  expect(merged.bests).toEqual(expanded.bests);
  expect(stored!.revision).toBe(2);
  for(const key of ['01','101']){
   const invalid=JSON.parse(JSON.stringify(old));invalid.levels={[key]:completion};
   const rejected=await worker.fetch(f.request('/api/account/sync','a',{progress:invalid}),f.env);
   expect(rejected.status).toBe(409);expect(await rejected.json()).toMatchObject({code:'INCOMPATIBLE_SAVE'});
   expect(await f.db.prepare('SELECT progress_json,revision FROM players WHERE id=?').bind('a').first()).toEqual(stored);
  }
 }finally{await f.dispose();}
},15000);
it('protects unreadable existing cloud saves and reserves deleted-account errors for missing accounts',async()=>{
 const f=await accountDb();try{
  const raw='{"version":99,"preserve":"corrupt bytes"}';
  await f.db.prepare('UPDATE players SET progress_json=?,revision=? WHERE id=?').bind(raw,7,'a').run();
  const before=await f.db.prepare('SELECT progress_json,revision,nickname FROM players WHERE id=?').bind('a').first();
  const get=await worker.fetch(f.request('/api/account'),f.env);expect(get.status).toBe(409);expect(await get.json()).toMatchObject({code:'INCOMPATIBLE_SAVE'});
  const sync=await worker.fetch(f.request('/api/account/sync','a',{progress:emptyCloudProgress()}),f.env);expect(sync.status).toBe(409);expect(await sync.json()).toMatchObject({code:'INCOMPATIBLE_SAVE'});
  const snapshot={progress:emptyCloudProgress(),nickname:'Guest',result:null,warnings:[]};
  const imported=await worker.fetch(f.request('/api/account/import','a',{importId:crypto.randomUUID(),generation:'g-a',snapshot}),f.env);expect(imported.status).toBe(409);expect(await imported.json()).toMatchObject({code:'INCOMPATIBLE_SAVE'});
  const renamed=await worker.fetch(f.request('/api/account/nickname','a',{nickname:'Changed'},'PATCH'),f.env);expect(renamed.status).toBe(409);expect(await renamed.json()).toMatchObject({code:'INCOMPATIBLE_SAVE'});
  expect(await f.db.prepare('SELECT progress_json,revision,nickname FROM players WHERE id=?').bind('a').first()).toEqual(before);
  expect((await f.db.prepare('SELECT COUNT(*) n FROM guest_imports').first())?.n).toBe(0);
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

it('validates and retries current Campaign scores with every component in run identity',async()=>{
 const f=await accountDb();try{
  const metadata=campaignScoreMetadata(10),payload={runId:'campaign-current-123',campaignVersion:1,progressionVersion:1,level:10,outcome:'victory',finalScore:metadata.perfectScore,remainingLives:20,gameDurationSeconds:10,gameVersion:'0.3.0',campaignScoreVersion:1,scheduledEnemiesKilled:metadata.scheduledEnemyCount,wavesCompleted:metadata.waveCount,missionBossesKilled:1},result={mode:'campaign',payload};
  const first=await worker.fetch(f.request('/api/account/scores','a',result),f.env);expect(first.status).toBe(200);const acknowledged=await first.json();
  const retry=await worker.fetch(f.request('/api/account/scores','a',result),f.env);expect(await retry.json()).toEqual(acknowledged);
  const invalid=await worker.fetch(f.request('/api/account/scores','a',{...result,payload:{...payload,scheduledEnemiesKilled:payload.scheduledEnemiesKilled-1}}),f.env);expect(invalid.status).toBe(400);
  const validConflict={...result,payload:{...payload,scheduledEnemiesKilled:payload.scheduledEnemiesKilled-1,finalScore:payload.finalScore-10}};
  expect((await worker.fetch(f.request('/api/account/scores','a',validConflict),f.env)).status).toBe(409);
  expect((await f.db.prepare('SELECT COUNT(*) n FROM campaign_scores').first())?.n).toBe(1);
 }finally{await f.dispose();}
},15000);
