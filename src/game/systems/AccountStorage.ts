import { accountKey,sameAccount,sameResult,type AccountRef,type AccountProfile,type AccountSession,type GuestClaim,type GuestSnapshot,type PendingResult,type RunResult } from '../../shared/account.ts';
import { validateCloudProgress } from '../../shared/cloudProgress.ts';
function requestValue<T>(request:IDBRequest<T>):Promise<T>{return new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
function complete(tx:IDBTransaction):Promise<void>{return new Promise((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onerror=tx.onabort=()=>reject(tx.error??new Error('Account storage transaction aborted'));});}
export class AccountStorage {
  private database:Promise<IDBDatabase>|null=null;
  constructor(private readonly name='aetherhold-accounts'){}
  private open():Promise<IDBDatabase>{
    if(this.database)return this.database;
    this.database=new Promise<IDBDatabase>((resolve,reject)=>{
      if(typeof indexedDB==='undefined'){reject(new Error('Account storage unavailable'));return;}
      const request=indexedDB.open(this.name,1),timer=setTimeout(()=>reject(new Error('Account storage blocked')),8000);
      request.onupgradeneeded=()=>{const db=request.result;for(const name of ['cache','outbox','meta'])if(!db.objectStoreNames.contains(name))db.createObjectStore(name);};
      request.onsuccess=()=>{clearTimeout(timer);request.result.onversionchange=()=>request.result.close();resolve(request.result);};
      request.onerror=()=>{clearTimeout(timer);reject(request.error);};request.onblocked=()=>{clearTimeout(timer);reject(new Error('Account storage blocked'));};
    }).catch(error=>{this.database=null;throw error;});return this.database!;
  }
  async close():Promise<void>{(await this.database)?.close();this.database=null;}
  async readMeta<T>(key:string):Promise<T|null>{const db=await this.open(),tx=db.transaction('meta','readonly'),done=complete(tx),value=await requestValue<T|undefined>(tx.objectStore('meta').get(key));await done;return value??null;}
  async writeMeta(key:string,value:unknown):Promise<void>{const db=await this.open(),tx=db.transaction('meta','readwrite'),done=complete(tx);tx.objectStore('meta').put(value,key);await done;}
  async readCache(ref:AccountRef):Promise<{profile:AccountProfile;session:AccountSession}|null>{
    const db=await this.open(),tx=db.transaction('cache','readonly'),done=complete(tx),value=await requestValue<{profile:AccountProfile;session:AccountSession}|undefined>(tx.objectStore('cache').get(accountKey(ref)));await done;
    if(!value)return null;if(!sameAccount(value.profile?.account,ref)||!sameAccount(value.session?.account,ref)||!validateCloudProgress(value.profile.progress)||!Number.isFinite(value.session.expiresAt))throw new Error('Account cache is incompatible');return value;
  }
  async writeCache(profile:AccountProfile,session:AccountSession):Promise<void>{const db=await this.open(),tx=db.transaction('cache','readwrite'),done=complete(tx);tx.objectStore('cache').put({profile,session},accountKey(profile.account));await done;}
  private key(ref:AccountRef,result:RunResult):string{return `${accountKey(ref)}:${result.mode}:${result.payload.runId}`;}
  async enqueue(record:PendingResult):Promise<void>{
    const db=await this.open(),tx=db.transaction('outbox','readwrite'),done=complete(tx),store=tx.objectStore('outbox'),key=this.key(record.account,record.result),old=await requestValue<PendingResult|undefined>(store.get(key));
    if(old&&!sameResult(old.result,record.result)){tx.abort();await done.catch(()=>{});throw new Error('Pending result conflict');}if(!old)store.put(record,key);await done;
  }
  async pending(ref:AccountRef):Promise<PendingResult[]>{const db=await this.open(),tx=db.transaction('outbox','readonly'),done=complete(tx),all=await requestValue<PendingResult[]>(tx.objectStore('outbox').getAll());await done;return all.filter(r=>sameAccount(r.account,ref));}
  async ack(ref:AccountRef,result:RunResult):Promise<void>{const db=await this.open(),tx=db.transaction('outbox','readwrite'),done=complete(tx),store=tx.objectStore('outbox'),key=this.key(ref,result),old=await requestValue<PendingResult|undefined>(store.get(key));if(old&&sameResult(old.result,result))store.delete(key);await done;}
  async markPermanent(ref:AccountRef,result:RunResult,error:string):Promise<void>{const db=await this.open(),tx=db.transaction('outbox','readwrite'),done=complete(tx),store=tx.objectStore('outbox'),key=this.key(ref,result),old=await requestValue<PendingResult|undefined>(store.get(key));if(old&&sameResult(old.result,result))store.put({...old,status:'permanent',error},key);await done;}
  async readGuestClaim():Promise<GuestClaim|null>{return this.readMeta('guest-claim');}
  async claimGuest(ref:AccountRef,snapshot:GuestSnapshot):Promise<GuestClaim>{
    const db=await this.open(),tx=db.transaction('meta','readwrite'),done=complete(tx),store=tx.objectStore('meta'),old=await requestValue<GuestClaim|undefined>(store.get('guest-claim'));
    if(old&&!sameAccount(old.account,ref)){tx.abort();await done.catch(()=>{});throw new Error('This browser save was already claimed by another account');}
    const claim=old??{importId:crypto.randomUUID(),account:ref,snapshot,consumed:false};if(!old)store.put(claim,'guest-claim');await done;return claim;
  }
  async consumeGuest(importId:string):Promise<void>{const db=await this.open(),tx=db.transaction('meta','readwrite'),done=complete(tx),store=tx.objectStore('meta'),claim=await requestValue<GuestClaim|undefined>(store.get('guest-claim'));if(claim?.importId===importId)store.put({...claim,consumed:true},'guest-claim');await done;}
  async purge(ref:AccountRef):Promise<void>{const db=await this.open(),tx=db.transaction(['cache','outbox'],'readwrite'),done=complete(tx);tx.objectStore('cache').delete(accountKey(ref));const cursor=tx.objectStore('outbox').openCursor();cursor.onsuccess=()=>{const row=cursor.result;if(!row)return;if(sameAccount((row.value as PendingResult).account,ref))row.delete();row.continue();};await done;}
  async lease(key:string,owner:string):Promise<boolean>{const db=await this.open(),tx=db.transaction('meta','readwrite'),done=complete(tx),store=tx.objectStore('meta'),old=await requestValue<{owner:string;expires:number}|undefined>(store.get(`lease:${key}`));if(old&&old.expires>Date.now()&&old.owner!==owner){await done;return false;}store.put({owner,expires:Date.now()+30000},`lease:${key}`);await done;return true;}
  async release(key:string,owner:string):Promise<void>{const db=await this.open(),tx=db.transaction('meta','readwrite'),done=complete(tx),store=tx.objectStore('meta'),old=await requestValue<{owner:string}|undefined>(store.get(`lease:${key}`));if(old?.owner===owner)store.delete(`lease:${key}`);await done;}
}
