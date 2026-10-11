import 'fake-indexeddb/auto';
import { expect,it } from 'vitest';
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
