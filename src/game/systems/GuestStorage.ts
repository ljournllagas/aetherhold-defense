import {sameAccount,type AccountRef,type GuestClaim,type GuestSnapshot} from '../../shared/account.ts';
import {mergeCloudProgress} from '../../shared/cloudProgress.ts';
import {emptyGuestSnapshot,hasGuestProgress,validGuestSnapshot,type GuestRunProgress} from './GuestProgress.ts';
export interface GuestBatch extends GuestClaim {status:'claimed'|'consumed'|'abandoned'}
export interface GuestJournal {version:1;initialized:boolean;open:GuestSnapshot;batches:GuestBatch[];seenRunIds:string[]}
export interface GuestStoreView {journal:GuestJournal;persisted:boolean;warning:string|null}
const empty=():GuestJournal=>({version:1,initialized:false,open:emptyGuestSnapshot(),batches:[],seenRunIds:[]});
function valid(v:unknown):v is GuestJournal {
 if(!v||typeof v!=='object')return false;const j=v as GuestJournal;
 return j.version===1&&typeof j.initialized==='boolean'&&validGuestSnapshot(j.open)&&Array.isArray(j.seenRunIds)&&j.seenRunIds.every(x=>typeof x==='string')&&Array.isArray(j.batches)&&j.batches.every(b=>typeof b.importId==='string'&&typeof b.account?.playerId==='string'&&typeof b.account?.generation==='string'&&['claimed','consumed','abandoned'].includes(b.status)&&validGuestSnapshot(b.snapshot));
}
const result=<T>(r:IDBRequest<T>):Promise<T>=>new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
const completed=(t:IDBTransaction):Promise<void>=>new Promise((resolve,reject)=>{t.oncomplete=()=>resolve();t.onabort=t.onerror=()=>reject(t.error??new Error('Guest transaction aborted'));});
export class GuestStorage {
 private db:Promise<IDBDatabase>|null=null;
 private memory=empty();private persisted=true;private protected=false;private warning:string|null=null;
 private readonly databaseName:string;
 constructor(options:{databaseName?:string}={}){this.databaseName=options.databaseName??'aetherhold-guests';}
 useSessionOnly():void{this.persisted=false;this.warning='Guest saves are available in this session only; legacy ownership could not be verified.';}
 private open():Promise<IDBDatabase>{
  if(this.db)return this.db;
  this.db=new Promise((resolve,reject)=>{
   if(typeof indexedDB==='undefined'){reject(new Error('Guest storage unavailable'));return;}
   const r=indexedDB.open(this.databaseName,1),timer=setTimeout(()=>reject(new Error('Guest storage blocked')),3000);
   r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('journal'))r.result.createObjectStore('journal');};
   r.onsuccess=()=>{clearTimeout(timer);r.result.onversionchange=()=>r.result.close();resolve(r.result);};
   r.onerror=r.onblocked=()=>{clearTimeout(timer);reject(r.error??new Error('Guest storage blocked'));};
  });return this.db;
 }
 private async mutate<T>(work:(journal:GuestJournal)=>T):Promise<T>{
  if(!this.persisted)return work(this.memory);
  let db:IDBDatabase;
  try{db=await this.open();}catch{this.persisted=false;this.warning='Guest saves are available in this session only; browser storage is unavailable.';return work(this.memory);}
  const tx=db.transaction('journal','readwrite'),done=completed(tx);let domainError=false;
  try{
   const store=tx.objectStore('journal'),raw=await result<unknown>(store.get('current'));
   if(raw!==undefined&&!valid(raw)){this.protected=true;throw new Error('Guest save is incompatible and was protected');}
   const j=raw===undefined?empty():raw as GuestJournal;
   let value:T;
   try{value=work(j);}catch(error){domainError=true;throw error;}
   store.put(j,'current');await done;this.memory=structuredClone(j);return value;
  }catch(error){
   try{tx.abort();}catch{/* transaction already finished */}await done.catch(()=>{});
   if(domainError)throw error;
   this.persisted=false;this.warning=this.protected?'Guest save is incompatible and was protected. New progress is available in this session only.':'Guest saves are available in this session only; browser storage is unavailable.';
   return work(this.memory);
  }
 }
 async view():Promise<GuestStoreView>{await this.mutate(()=>null);return {journal:structuredClone(this.memory),persisted:this.persisted,warning:this.warning};}
 async bootstrap(snapshot:GuestSnapshot,legacy:GuestClaim|null):Promise<GuestStoreView>{
  await this.mutate(j=>{if(j.initialized)return;j.initialized=true;
   if(legacy){if(!validGuestSnapshot(legacy.snapshot))throw new Error('Legacy guest claim is incompatible');j.batches.push({...structuredClone(legacy),status:legacy.consumed?'consumed':'claimed'});}
   else if(validGuestSnapshot(snapshot))j.open=structuredClone(snapshot);
  });return this.view();
 }
 async record(run:GuestRunProgress,nickname:string):Promise<GuestStoreView>{
  await this.mutate(j=>{if(run.runId&&j.seenRunIds.includes(run.runId))return;
   const next={...j.open,nickname,progress:mergeCloudProgress(j.open.progress,run.progress),result:run.result??j.open.result};
   if(!validGuestSnapshot(next))throw new Error('Guest result is incompatible');j.open=structuredClone(next);
   if(run.runId)j.seenRunIds.push(run.runId);
  });return this.view();
 }
 async claim(ref:AccountRef):Promise<GuestBatch|null>{
  await this.view();if(!this.persisted)throw new Error('Durable guest storage is unavailable; import is protected');
  const claimed=await this.mutate(j=>{const outstanding=j.batches.find(b=>b.status==='claimed');
   if(outstanding){if(!sameAccount(outstanding.account,ref))throw new Error('Guest progress was already claimed by another account');return structuredClone(outstanding);}
   if(!hasGuestProgress(j.open))return null;
   const batch:GuestBatch={importId:crypto.randomUUID(),account:{...ref},snapshot:structuredClone(j.open),consumed:false,status:'claimed'};
   j.batches.push(batch);j.open=emptyGuestSnapshot(j.open.nickname);return structuredClone(batch);
  });if(!this.persisted)throw new Error('Durable guest storage failed; import is protected');return claimed;
 }
 async acknowledge(importId:string,ref:AccountRef):Promise<void>{await this.mutate(j=>{const b=j.batches.find(x=>x.importId===importId);if(!b||!sameAccount(b.account,ref))throw new Error('Guest import owner changed');if(b.status==='claimed'){b.status='consumed';b.consumed=true;}});}
 async abandon(ref:AccountRef):Promise<void>{await this.mutate(j=>{for(const b of j.batches)if(b.status==='claimed'&&sameAccount(b.account,ref)){b.status='abandoned';b.consumed=true;b.snapshot.result=null;}});}
 async close():Promise<void>{await this.db?.then(db=>db.close()).catch(()=>{});this.db=null;}
}
