import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {createGuestAccountFixture} from './helpers/guestAccountFixture.ts';
import {saveSettings,loadSettings} from '../src/game/systems/Settings.ts';
import {emptyCloudProgress} from '../src/shared/cloudProgress.ts';
import {readActiveCloudProgress,selectAccountProgress} from '../src/game/systems/AccountProgress.ts';
const fixtures:ReturnType<typeof createGuestAccountFixture>[]=[];
const make=()=>{const f=createGuestAccountFixture();fixtures.push(f);return f;};
beforeEach(()=>{const m=new Map<string,string>();vi.stubGlobal('localStorage',{getItem:(k:string)=>m.get(k)??null,setItem:(k:string,v:string)=>m.set(k,v),removeItem:(k:string)=>m.delete(k),key:(n:number)=>[...m.keys()][n],get length(){return m.size;}});saveSettings({...loadSettings(),playerName:'',guestSelected:false,googleSignInPending:false});});
afterEach(async()=>{await Promise.all(fixtures.splice(0).map(f=>f.close()));vi.restoreAllMocks();vi.unstubAllGlobals();});
it('allows named guest entry after config and account requests fail',async()=>{
 const f=make();f.client.getConfig=async()=>({ok:false,code:'NETWORK',message:'offline',status:0});await f.system.initialize();
 expect((await f.system.enterGuest('')).ok).toBe(false);
 expect((await f.system.enterGuest(' Aria ')).ok).toBe(true);
 expect(f.system.view()).toMatchObject({playMode:'guest',session:null,guestName:'Aria'});
 expect(f.system.canStartBattle()).toBe(true);expect(f.system.captureRun()).toEqual({mode:'guest',name:'Aria'});
});
it('suppresses a retained Google session after failed logout and refresh',async()=>{
 const f=make();await f.system.initialize();const revoke=vi.spyOn(f.client,'logoutSession').mockResolvedValue({ok:false,code:'NETWORK',message:'offline',status:0});
 await f.system.logout();expect(revoke).toHaveBeenCalled();await f.system.enterGuest('Aria');await f.system.refresh();
 expect(f.system.view()).toMatchObject({playMode:'guest',session:null,guestName:'Aria'});expect(f.system.canStartBattle()).toBe(true);
});
it('preserves captured guest ownership on refresh until settlement',async()=>{
 const f=make();await f.system.enterGuest('Aria');const owner=f.system.captureRun()!;
 const get=vi.spyOn(f.client,'getProfile');await f.system.refresh();expect(get).not.toHaveBeenCalled();expect(f.system.view().playMode).toBe('guest');
 const progress=emptyCloudProgress();progress.earned.volley=new Date(0).toISOString();
 await f.system.completeGuestRun(owner as {mode:'guest';name:string},{progress,result:null,runId:'guest1234'});
 expect((await f.guests.view()).journal.open.progress.earned).toEqual(progress.earned);
});
it('keeps sign-in preflight and cancelled loss warnings side-effect free',async()=>{
 const f=make();await f.system.enterGuest('Aria');vi.spyOn(f.guests,'view').mockResolvedValue({persisted:false,warning:'session only',journal:{version:1,initialized:true,batches:[],seenRunIds:[],open:{nickname:'Aria',warnings:[],result:null,progress:{...emptyCloudProgress(),earned:{volley:new Date(0).toISOString()}}}}});
 expect((await f.system.googleSignInPreflight()).requiresLossAcknowledgment).toBe(true);
 expect((await f.system.beginGoogleSignIn()).ok).toBe(false);expect(loadSettings().googleSignInPending).toBe(false);
 expect(f.system.view().playMode).toBe('guest');
 expect((await f.system.beginGoogleSignIn(true)).ok).toBe(true);expect(loadSettings().googleSignInPending).toBe(true);
});
it('blocks guest entry while deletion is uncertain',async()=>{
 const f=make();await f.storage.writeMeta('delete-requested',f.ref);expect((await f.system.enterGuest('Aria')).ok).toBe(false);
});
it('retains newly earned guest branches when a run is discarded',async()=>{
 const f=make();await f.system.enterGuest('Aria');f.system.captureRun();
 await f.system.guestProgressChanged({volley:new Date(0).toISOString()});await f.system.discardBattle();
 expect((await f.guests.view()).journal.open.progress.earned.volley).toBe(new Date(0).toISOString());expect(f.system.canStartBattle()).toBe(true);
});
it('preserves ready account play and frozen data after failed import',async()=>{
 const f=make();await f.system.enterGuest('Aria');const owner=f.system.captureRun()! as {mode:'guest';name:string};
 const progress=emptyCloudProgress();progress.earned.volley=new Date(0).toISOString();
 await f.system.completeGuestRun(owner,{progress,result:null,runId:'guest-run-999'});
 await f.system.beginGoogleSignIn();f.client.importGuest=async()=>({ok:false,code:'NETWORK',message:'offline import',status:0});
 await f.system.initialize();await f.system.flushNow(f.ref);
 expect(f.system.canStartBattle()).toBe(true);expect((await f.guests.view()).journal.batches[0].status).toBe('claimed');
});
it('confirmed deletion abandons claimed guest data but leaves later progress open',async()=>{
 const f=make(),progress=emptyCloudProgress();progress.earned.volley=new Date(0).toISOString();
 await f.guests.bootstrap({progress,nickname:'Aria',warnings:[],result:null},null);await f.guests.claim(f.ref);
 const later=emptyCloudProgress();later.earned['flame-mortar']=new Date(1).toISOString();await f.guests.record({progress:later,result:null},'Aria');
 f.client.importGuest=async()=>({ok:false,code:'NETWORK',message:'offline',status:0});await f.system.initialize();
 await f.system.beginDelete();expect((await f.system.deleteAccount()).ok).toBe(true);
 const j=(await f.guests.view()).journal;expect(j.batches[0].status).toBe('abandoned');expect(j.open.progress.earned).toEqual(later.earned);
});
it('old guest settlement cannot release a newly captured run',async()=>{
 const f=make();await f.system.enterGuest('Aria');const owner=f.system.captureRun()! as {mode:'guest';name:string};
 const view=await f.guests.view();let finish!:(v:typeof view)=>void;
 vi.spyOn(f.guests,'record').mockImplementationOnce(()=>new Promise(r=>{finish=r;}));
 const old=f.system.completeGuestRun(owner,{progress:emptyCloudProgress(),result:null,runId:'old-guest-run'});
 for(let n=0;n<20&&!finish;n++)await new Promise(r=>setTimeout(r,1));
 f.system.captureRun();finish(view);await old;
 expect((await f.system.enterGuest('Other')).ok).toBe(false);
});
it('old account settlement cannot release a newly captured run',async()=>{
 const f=make();await f.system.initialize();f.system.captureRun();let finish!:()=>void;
 vi.spyOn(f.storage,'enqueue').mockImplementationOnce(()=>new Promise<void>(r=>{finish=r;}));
 const old=f.system.settle(f.ref,{mode:'campaign',payload:{runId:'old-account-run',campaignVersion:1,progressionVersion:1,level:1,outcome:'defeat',finalScore:0,remainingLives:0,gameDurationSeconds:10,gameVersion:'0.3.0'}});
 f.system.captureRun();finish();await old;expect((await f.system.enterGuest('Other')).ok).toBe(false);
});
it('blocks guest entry when deletion metadata cannot be read',async()=>{
 const f=make();vi.spyOn(f.storage,'readMeta').mockRejectedValue(new Error('unreadable'));expect((await f.system.enterGuest('Aria')).ok).toBe(false);expect(f.system.canStartBattle()).toBe(false);
});
it('warns before OAuth when an unacknowledged claimed batch is session-only',async()=>{
 const f=make();await f.system.enterGuest('Aria');const progress=emptyCloudProgress();progress.earned.volley=new Date(0).toISOString();await f.guests.record({progress,result:null},'Aria');await f.guests.claim(f.ref);
 const view=await f.guests.view();vi.spyOn(f.guests,'view').mockResolvedValue({...view,persisted:false});
 expect(view.journal.open.progress.earned).toEqual({});expect((await f.system.googleSignInPreflight()).requiresLossAcknowledgment).toBe(true);expect((await f.system.beginGoogleSignIn()).ok).toBe(false);
});
it('restores abandoned progress for local guest play without reopening import',async()=>{
 const f=make(),progress=emptyCloudProgress();progress.levels[1]={completed:true,completionStar:true,livesStar:false,scoreStar:false,bestScore:100,bestRemainingLives:10};
 await f.guests.bootstrap({progress,nickname:'Aria',warnings:[],result:null},null);await f.guests.claim(f.ref);await f.guests.abandon(f.ref);
 selectAccountProgress(f.ref);vi.stubGlobal('localStorage',{getItem(){throw new Error('denied');},setItem(){throw new Error('denied');}});
 expect((await f.system.enterGuest('Aria')).ok).toBe(true);expect(readActiveCloudProgress().levels[1]?.completed).toBe(true);expect(await f.guests.claim({playerId:'new',generation:'new'})).toBeNull();
});
