import 'fake-indexeddb/auto';
import {AccountSystem} from '../../src/game/systems/AccountSystem.ts';
import {AccountStorage} from '../../src/game/systems/AccountStorage.ts';
import {GuestStorage} from '../../src/game/systems/GuestStorage.ts';
import {emptyCloudProgress} from '../../src/shared/cloudProgress.ts';
import type {AccountClient} from '../../src/api/accountClient.ts';
export function createGuestAccountFixture(){
 const ref={playerId:'a',generation:'g'},session={account:ref,nickname:'Google Name',csrf:'csrf',expiresAt:Date.now()+100000,canDelete:true},profile={account:ref,nickname:'Google Name',revision:0,progress:emptyCloudProgress()};
 const client:AccountClient={getConfig:async()=>({ok:true,value:{loginRequired:true}}),getSession:async()=>({ok:true,value:session}),getProfile:async()=>({ok:true,value:profile}),syncProfile:async progress=>({ok:true,value:{...profile,progress}}),importGuest:async claim=>({ok:true,value:{...profile,progress:claim.snapshot.progress}}),uploadResult:async()=>({ok:false,code:'NETWORK',message:'offline',status:0}),updateNickname:async nickname=>({ok:true,value:{...profile,nickname}}),logoutSession:async()=>({ok:true,value:{loggedOut:true}}),deleteAccount:async()=>({ok:true,value:{deleted:true}})};
 const storage=new AccountStorage(crypto.randomUUID()),guests=new GuestStorage({databaseName:crypto.randomUUID()}),system=new AccountSystem({client,storage,guestStorage:guests,listen:false});
 return {ref,session,profile,system,storage,guests,client,close:async()=>{system.stop();await storage.close();await guests.close();}};
}
