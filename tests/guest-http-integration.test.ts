import {expect,it} from 'vitest';
import worker from '../worker/index.ts';
import {accountDb} from './helpers/accountDb.ts';
import {emptyCloudProgress} from '../src/shared/cloudProgress.ts';
it('merges successive guest batches without downgrading scores or allowing anonymous uploads',async()=>{
 const f=await accountDb();try{
  for(const [score,id] of [[400,crypto.randomUUID()],[200,crypto.randomUUID()]] as const){const progress=emptyCloudProgress();progress.bests=[{score,wave:2,difficulty:'medium',date:new Date(0).toISOString(),scoreVersion:3}];const snapshot={progress,nickname:'Aria',warnings:[],result:null};
   expect((await worker.fetch(f.request('/api/account/import','a',{importId:id,generation:'g-a',snapshot}),f.env)).status).toBe(200);
   expect((await worker.fetch(f.request('/api/account/import','a',{importId:id,generation:'g-a',snapshot}),f.env)).status).toBe(200);
   expect((await worker.fetch(f.request('/api/account/import','b',{importId:id,generation:'g-b',snapshot}),f.env)).status).toBe(409);
  }
  const row=await f.db.prepare('SELECT progress_json FROM players WHERE id=?').bind('a').first<{progress_json:string}>();expect(JSON.parse(row!.progress_json).bests[0].score).toBe(400);
  expect((await f.db.prepare('SELECT COUNT(*) n FROM guest_imports').first())?.n).toBe(2);
  expect((await worker.fetch(new Request('https://game.example/api/scores',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}),f.env)).status).toBe(401);
  expect((await f.db.prepare('SELECT COUNT(*) n FROM scores').first())?.n).toBe(0);
 }finally{await f.dispose();}
},15000);
