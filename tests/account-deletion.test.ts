import {expect,it} from 'vitest';
import worker from '../worker/index.ts';
import {accountDb} from './helpers/accountDb.ts';
import {emptyCloudProgress} from '../src/shared/cloudProgress.ts';
it('deletes all sessions and rejects late old-generation writes',async()=>{
 const f=await accountDb();try{
  await f.db.prepare("INSERT INTO guest_imports(import_id,player_id,generation,consumed) VALUES('claim','a','g-a',1)").run();
  const response=await worker.fetch(f.request('/api/account/delete','a',{confirm:true}),f.env);expect(response.status).toBe(200);
  expect(await f.db.prepare("SELECT id FROM players WHERE id='a'").first()).toBeNull();
  expect((await f.db.prepare("SELECT player_id,generation,consumed FROM guest_imports WHERE import_id='claim'").first())).toEqual({player_id:null,generation:null,consumed:1});
  const late=await worker.fetch(f.request('/api/account/sync','a',{progress:emptyCloudProgress()}),f.env);expect(await late.json()).toMatchObject({code:'ACCOUNT_DELETED'});
  expect((await f.db.prepare('SELECT COUNT(*) n FROM players').first())?.n).toBe(1);
 }finally{await f.dispose();}
},15000);
it('requires confirmation and actual recent reauthentication',async()=>{
 const f=await accountDb();try{
  expect((await worker.fetch(f.request('/api/account/delete','a',{confirm:false}),f.env)).status).toBe(400);
  await f.db.prepare("UPDATE sessions SET reauthenticated_at=? WHERE player_id='a'").bind(Date.now()-301000).run();
  expect((await worker.fetch(f.request('/api/account/delete','a',{confirm:true}),f.env)).status).toBe(403);
  expect(await f.db.prepare("SELECT id FROM players WHERE id='a'").first()).not.toBeNull();
 }finally{await f.dispose();}
},15000);
