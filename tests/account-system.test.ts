import 'fake-indexeddb/auto';
import { expect,it,vi } from 'vitest';
import { AccountSystem } from '../src/game/systems/AccountSystem.ts';
import { AccountStorage } from '../src/game/systems/AccountStorage.ts';
import { emptyCloudProgress } from '../src/shared/cloudProgress.ts';
import type { AccountClient } from '../src/api/accountClient.ts';
const ref={playerId:'a',generation:'g'};
function fixture(){let now=100;const session={account:ref,nickname:'Warden',csrf:'csrf',expiresAt:1000,canDelete:false},profile={account:ref,nickname:'Warden',revision:0,progress:emptyCloudProgress()};const client:AccountClient={getConfig:async()=>({ok:true,value:{loginRequired:true}}),getSession:async()=>({ok:true,value:session}),getProfile:async()=>({ok:true,value:profile}),syncProfile:async progress=>({ok:true,value:{...profile,progress,revision:1}}),importGuest:async()=>({ok:true,value:profile}),uploadResult:async()=>({ok:false,code:'NETWORK',message:'offline',status:0}),updateNickname:async()=>({ok:true,value:profile}),logoutSession:async()=>({ok:true,value:{loggedOut:true}}),deleteAccount:async()=>({ok:true,value:{deleted:true}})};const storage=new AccountStorage(crypto.randomUUID());const system=new AccountSystem({storage,client,now:()=>now,listen:false});return {system,client,storage,advance:()=>{now=1001;}};}
it('blocks new battles after expiry but retains terminal results',async()=>{
  const f=fixture();await f.system.initialize();expect(f.system.canStartBattle()).toBe(true);f.advance();expect(f.system.canStartBattle()).toBe(false);
  await f.system.settle(ref,{mode:'campaign',payload:{runId:'run-expiry-1',campaignVersion:1,progressionVersion:1,level:1,outcome:'victory',finalScore:100,remainingLives:10,gameDurationSeconds:10,gameVersion:'0.3.0'}});
  expect(await f.storage.pending(ref)).toHaveLength(1);f.system.stop();await f.storage.close();
});
it('keeps legacy mode available with explicit disabled configuration',async()=>{
  const f=fixture();f.client.getConfig=async()=>({ok:true,value:{loginRequired:false}});f.client.getSession=async()=>({ok:false,code:'AUTH_UNCONFIGURED',message:'not configured',status:503});await f.system.initialize();expect(f.system.view().playMode).toBe('legacy');expect(f.system.canStartBattle()).toBe(true);f.system.stop();await f.storage.close();
});
it('does not report dirty progress as synced with an empty outbox',async()=>{
  const f=fixture();await f.system.initialize();f.client.syncProfile=async()=>({ok:false,code:'NETWORK',message:'offline',status:0});await f.system.progressChanged(ref);expect(f.system.view().progressSync).not.toBe('synced');f.system.stop();await f.storage.close();
});
it('rejects a profile belonging to a different session account',async()=>{
  const f=fixture();f.client.getProfile=async()=>({ok:true,value:{account:{playerId:'b',generation:'g-b'},nickname:'B',revision:0,progress:emptyCloudProgress()}});await f.system.initialize();expect(f.system.canStartBattle()).toBe(false);expect(f.system.view().profile).toBeNull();f.system.stop();await f.storage.close();
});
it('does not re-adopt a late refresh after logout',async()=>{
  const f=fixture();await f.system.initialize();let resolve!:(x:Awaited<ReturnType<AccountClient['getProfile']>>)=>void;f.client.getProfile=()=>new Promise(r=>{resolve=r;});const refreshing=f.system.refresh();for(let i=0;i<30&&!resolve;i++)await new Promise(r=>setTimeout(r,1));await f.system.logout();resolve({ok:true,value:{account:ref,nickname:'Warden',revision:0,progress:emptyCloudProgress()}});await refreshing;expect(f.system.view().session).toBeNull();expect(f.system.canStartBattle()).toBe(false);f.system.stop();await f.storage.close();
});
it('never adopts another account cache during an active offline battle',async()=>{
  const f=fixture();await f.system.initialize();f.system.captureAccount();const B={playerId:'b',generation:'g-b'},progress=emptyCloudProgress();progress.levels[2]={completed:true,completionStar:true,livesStar:false,scoreStar:false,bestScore:100,bestRemainingLives:10};await f.storage.writeCache({account:B,nickname:'B',revision:0,progress},{account:B,nickname:'B',csrf:'b',expiresAt:1000,canDelete:false});await f.storage.writeMeta('last-account',B);f.client.getSession=async()=>({ok:false,code:'NETWORK',message:'offline',status:0});await f.system.refresh();expect(f.system.view().profile?.account).toEqual(ref);expect(f.system.canStartBattle()).toBe(false);f.system.stop();await f.storage.close();
});
it('still revokes server logout when browser storage writes fail',async()=>{
  const f=fixture();await f.system.initialize();const revoke=vi.spyOn(f.client,'logoutSession');vi.spyOn(f.storage,'writeMeta').mockRejectedValue(new Error('blocked'));await expect(f.system.logout()).resolves.toBeUndefined();expect(revoke).toHaveBeenCalledTimes(1);expect(f.system.view().session).toBeNull();expect(f.system.canStartBattle()).toBe(false);f.system.stop();await f.storage.close();
});
it('does not call an unreadable outbox synced or stop retries',async()=>{
  const f=fixture();await f.system.initialize();vi.spyOn(f.storage,'pending').mockRejectedValue(new Error('read failed'));const result=await f.system.flushNow(ref);expect(result.ok).toBe(false);expect(f.system.view().resultSync).toBe('unavailable');expect(f.system.view().warning).toBeTruthy();f.system.stop();await f.storage.close();
});
