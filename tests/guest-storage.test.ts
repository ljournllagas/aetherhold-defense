import 'fake-indexeddb/auto';
import {afterEach,expect,it,vi} from 'vitest';
import {GuestStorage} from '../src/game/systems/GuestStorage.ts';
import {emptyCloudProgress} from '../src/shared/cloudProgress.ts';
const stores:GuestStorage[]=[];
const ref={playerId:'a',generation:'g'},other={playerId:'b',generation:'h'};
const snapshot=()=>({progress:emptyCloudProgress(),nickname:'Aria',result:null,warnings:[]});
const make=(databaseName=crypto.randomUUID())=>{const s=new GuestStorage({databaseName});stores.push(s);return s;};
afterEach(async()=>{vi.restoreAllMocks();await Promise.all(stores.splice(0).map(s=>s.close()));});
it('keeps a frozen claim and later guest achievements separately',async()=>{
 const s=make(),initial=snapshot();initial.progress.earned.volley=new Date(0).toISOString();
 await s.bootstrap(initial,null);const first=await s.claim(ref);expect(first).not.toBeNull();
 const progress=emptyCloudProgress();progress.earned['flame-mortar']=new Date(1).toISOString();
 await s.record({progress,result:null},'Aria');expect(await s.claim(ref)).toEqual(first);
 await expect(s.claim(other)).rejects.toThrow(/claimed/i);
 await s.acknowledge(first!.importId,ref);const next=await s.claim(other);
 expect(next!.snapshot.progress.earned).toEqual(progress.earned);
 expect(next!.importId).not.toBe(first!.importId);
});
it('atomically assigns competing tabs to exactly one owner',async()=>{
 const name=crypto.randomUUID(),a=make(name),b=make(name),initial=snapshot();initial.progress.earned.volley=new Date(0).toISOString();
 await a.bootstrap(initial,null);
 const results=await Promise.allSettled([a.claim(ref),b.claim(other)]);
 expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);
 expect(results.filter(r=>r.status==='rejected')).toHaveLength(1);
});
it('migrates consumed legacy ownership without reseeding cumulative progress',async()=>{
 const s=make(),initial=snapshot();initial.progress.earned.volley=new Date(0).toISOString();
 const old={importId:crypto.randomUUID(),account:ref,snapshot:initial,consumed:true};
 await s.bootstrap(initial,old);expect(await s.claim(other)).toBeNull();
 await s.bootstrap(initial,null);expect(await s.claim(other)).toBeNull();
 expect((await s.view()).journal.batches[0].account).toEqual(ref);
});
it('abandons only deleted-owner claims and leaves fresh progress importable',async()=>{
 const s=make(),initial=snapshot();initial.progress.earned.volley=new Date(0).toISOString();
 await s.bootstrap(initial,null);const first=await s.claim(ref);
 const progress=emptyCloudProgress();progress.earned['flame-mortar']=new Date(1).toISOString();
 await s.record({progress,result:null},'Aria');await s.abandon(ref);
 const view=await s.view();expect(view.journal.batches.find(x=>x.importId===first!.importId)?.status).toBe('abandoned');
 expect((await s.claim(other))!.snapshot.progress.earned).toEqual(progress.earned);
});
it('retains session progress visibly when durable storage is unavailable',async()=>{
 vi.spyOn(indexedDB,'open').mockImplementation(()=>{throw new Error('blocked');});
 const s=make(),initial=snapshot();await s.bootstrap(initial,null);
 const progress=emptyCloudProgress();progress.earned.volley=new Date(0).toISOString();
 const view=await s.record({progress,result:null},'Aria');
 expect(view.persisted).toBe(false);expect(view.warning).toMatch(/session/i);
 expect(view.journal.open.progress.earned).toEqual(progress.earned);
 await expect(s.claim(ref)).rejects.toThrow(/storage/i);
});
it('protects unknown-version journal bytes from replacement and import',async()=>{
 const name=crypto.randomUUID();const db=await new Promise<IDBDatabase>(resolve=>{const r=indexedDB.open(name,1);r.onupgradeneeded=()=>r.result.createObjectStore('journal');r.onsuccess=()=>resolve(r.result);});
 const raw={version:99,sentinel:'keep'};await new Promise<void>(resolve=>{const tx=db.transaction('journal','readwrite');tx.objectStore('journal').put(raw,'current');tx.oncomplete=()=>resolve();});
 const s=make(name);await s.bootstrap(snapshot(),null);expect((await s.view()).warning).toMatch(/protected/i);await expect(s.claim(ref)).rejects.toThrow(/storage/i);
 const saved=await new Promise(resolve=>{const r=db.transaction('journal').objectStore('journal').get('current');r.onsuccess=()=>resolve(r.result);});expect(saved).toEqual(raw);db.close();
});
it('deduplicates settlement and migrates an outstanding legacy snapshot',async()=>{
 const s=make(),initial=snapshot();initial.progress.earned.volley=new Date(0).toISOString();
 const old={importId:crypto.randomUUID(),account:ref,snapshot:initial,consumed:false};await s.bootstrap(initial,old);
 const progress=emptyCloudProgress();progress.earned['flame-mortar']=new Date(1).toISOString();
 await s.record({progress,result:null,runId:'new-run-123'},'Aria');await s.record({progress,result:null,runId:'new-run-123'},'Aria');
 expect(await s.claim(ref)).toMatchObject({importId:old.importId,snapshot:initial});
 expect((await s.view()).journal.seenRunIds).toEqual(['new-run-123']);
});
