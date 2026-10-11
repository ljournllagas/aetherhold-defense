import {accountClient,type AccountClient} from '../../api/accountClient.ts';
import {sameAccount,accountKey,type AccountRef,type AccountView,type AccountProfile,type AccountSession,type ApiResult,type PendingResult,type RunResult} from '../../shared/account.ts';
import {mergeCloudProgress} from '../../shared/cloudProgress.ts';
import {AccountStorage} from './AccountStorage.ts';
import {AccountSync} from './AccountSync.ts';
import {accountBestWarning} from './Settings.ts';
import {guestSnapshot,selectAccountProgress,readActiveCloudProgress,applyCloudProgress,purgeLocalAccount,seedGuestPreferences} from './AccountProgress.ts';
export class AccountSystem {
  private data:AccountView={state:'loading',config:null,playMode:'blocked',session:null,profile:null,warning:null,pending:0,progressSync:'loading',resultSync:'loading',acknowledgedRevision:null,progressDirty:false};
  private readonly storage:AccountStorage;
  private readonly client:AccountClient;
  private readonly now:()=>number;
  private readonly listeners=new Set<(view:AccountView)=>void>();
  private readonly sync:AccountSync;
  private readonly memory=new Map<string,PendingResult>();
  private activeBattle:AccountRef|null=null;
  private initializing:Promise<void>|null=null;
  private channel:BroadcastChannel|null=null;
  private storageFailed=false;
  private outboxUnavailable=false;
  private lifecycle=0;
  private logoutRef:AccountRef|null=null;
  private stagingWrites=0;
  private readonly onFocus=()=>{if(typeof document==='undefined'||!document.hidden)void this.refresh();};
  private readonly onVisibility=()=>{if(document.hidden)this.sync.stop();else this.onFocus();};
  constructor(options:{storage?:AccountStorage;client?:AccountClient;now?:()=>number;listen?:boolean}={}){
    this.storage=options.storage??new AccountStorage();this.client=options.client??accountClient;this.now=options.now??Date.now;this.sync=new AccountSync(ref=>this.flushNow(ref));
    if(options.listen!==false&&typeof window!=='undefined'){
      window.addEventListener('online',this.onFocus);window.addEventListener('focus',this.onFocus);document.addEventListener('visibilitychange',this.onVisibility);
      if(typeof BroadcastChannel!=='undefined'){this.channel=new BroadcastChannel('aetherhold-account');this.channel.onmessage=()=>this.onFocus();}
    }
  }
  view():AccountView {if(this.data.session&&this.data.session.expiresAt<=this.now()&&this.data.state!=='deleting'){this.data.state='expired';this.data.playMode='blocked';}return {...this.data};}
  subscribe(listener:(view:AccountView)=>void):()=>void {this.listeners.add(listener);listener(this.view());return ()=>this.listeners.delete(listener);}
  private emit():void {const view=this.view();for(const listener of this.listeners)listener(view);}
  canStartBattle():boolean {const v=this.view();return v.playMode==='legacy'||v.playMode==='account'&&!!v.profile&&!!v.session&&v.session.expiresAt>this.now()&&['ready','offline'].includes(v.state);}
  captureAccount():AccountRef|null {if(!this.canStartBattle())return null;this.activeBattle=this.data.session?.account??null;return this.activeBattle;}
  stop():void {this.sync.stop();this.channel?.close();if(typeof window!=='undefined'){window.removeEventListener('online',this.onFocus);window.removeEventListener('focus',this.onFocus);document.removeEventListener('visibilitychange',this.onVisibility);}}
  initialize():Promise<void> {if(this.initializing)return this.initializing;this.initializing=this.load(this.lifecycle).finally(()=>{this.initializing=null;});return this.initializing;}
  private async load(lifecycle:number):Promise<void>{
    try{
      const config=await this.client.getConfig();
      if(lifecycle!==this.lifecycle)return;
      if(config.ok){this.data.config=config.value;await this.storage.writeMeta('config',config.value).catch(()=>{this.storageFailed=true;});}
      else {const cached=await this.storage.readMeta<{loginRequired:boolean}>('config').catch(()=>null);if(cached?.loginRequired===true)this.data.config=cached;else{this.data.state='error';this.data.playMode='blocked';this.data.warning=config.message;this.emit();return;}}
      const deletion=await this.storage.readMeta<AccountRef>('deleting').catch(()=>null),logout=this.logoutRef??await this.storage.readMeta<AccountRef>('logout').catch(()=>null),last=await this.storage.readMeta<AccountRef>('last-account').catch(()=>null);
      const result=await this.client.getSession();
      if(lifecycle!==this.lifecycle)return;
      if(!result.ok){
        if(result.code==='ACCOUNT_DELETED'&&last){await this.purge(last);this.data.state='deleted';}
        else if((result.status===0||result.status>=500)&&last&&!logout&&!deletion){
          if(this.activeBattle){this.data.state=sameAccount(last,this.activeBattle)?'offline':'expired';this.data.playMode=sameAccount(last,this.activeBattle)?'account':'blocked';this.data.warning='Connection unavailable; this battle remains tied to its original account.';this.emit();return;}
          const cache=await this.storage.readCache(last).catch(()=>null);if(lifecycle!==this.lifecycle)return;if(cache&&cache.session.expiresAt>this.now()){this.adopt(cache.profile,cache.session);this.data.state='offline';this.data.warning=result.message;this.emit();return;}
        }
        if(!this.data.config?.loginRequired&&!last&&!deletion&&!logout){selectAccountProgress(null);this.data.playMode='legacy';this.data.state='signed-out';this.data.session=null;this.data.profile=null;this.data.warning=null;this.emit();return;}
        this.data.playMode='blocked';this.data.state=this.data.state==='deleted'?'deleted':'signed-out';this.data.warning=result.code==='AUTH_REQUIRED'?null:result.message;this.emit();return;
      }
      const session=result.value;
      if(this.activeBattle&&!sameAccount(this.activeBattle,session.account)){this.data.state='expired';this.data.playMode='blocked';this.data.warning='Account changed in another tab. Finish this battle, then sign in.';this.emit();return;}
      if(logout&&sameAccount(logout,session.account)){const r=await this.client.logoutSession(session.csrf);if(r.ok){await this.storage.writeMeta('logout',null);await this.storage.writeMeta('last-account',null);}this.data.state='signed-out';this.data.playMode='blocked';this.data.warning=r.ok?null:r.message;this.emit();return;}
      if(deletion&&sameAccount(deletion,session.account)){this.data.session=session;this.data.state='deleting';this.data.playMode='blocked';this.emit();return;}
      const fetched=await this.client.getProfile();if(!fetched.ok){this.data.state='error';this.data.playMode='blocked';this.data.warning=fetched.message;this.emit();return;}
      if(lifecycle!==this.lifecycle)return;
      if(!sameAccount(fetched.value.account,session.account)){this.data.state='expired';this.data.playMode='blocked';this.data.warning='Account changed during loading. Sign in again.';this.emit();return;}
      let profile=fetched.value;
      const oldClaim=await this.storage.readGuestClaim().catch(()=>{this.storageFailed=true;return null;});
      if(!oldClaim||sameAccount(oldClaim.account,session.account)&&!oldClaim.consumed){
        try{const claim=await this.storage.claimGuest(session.account,guestSnapshot());const imported=await this.client.importGuest(claim,session.csrf);if(imported.ok){profile=imported.value;if(claim.snapshot.result)await this.storage.enqueue({account:session.account,result:claim.snapshot.result,status:'pending'});await this.storage.consumeGuest(claim.importId);seedGuestPreferences(session.account);if(claim.snapshot.warnings.length)this.data.warning=claim.snapshot.warnings.join('. ');}else this.data.warning=imported.message;}catch{this.storageFailed=true;this.data.warning='Guest progress could not be bound to this account. Import will retry when storage is available.';}
      }
      const changed=!sameAccount(this.data.profile?.account??null,session.account);
      const cached=await this.storage.readCache(session.account).catch(()=>null);
      if(lifecycle!==this.lifecycle)return;
      this.adopt(profile,session,changed);
      if(cached&&!this.activeBattle){applyCloudProgress(cached.profile.progress);this.data.progressDirty=JSON.stringify(mergeCloudProgress(profile.progress,readActiveCloudProgress()))!==JSON.stringify(profile.progress);this.data.progressSync=this.data.progressDirty?'pending':'synced';}
      await this.storage.writeMeta('last-account',session.account).catch(()=>{this.storageFailed=true;});
      await this.cache();await this.count();this.emit();if(!this.activeBattle)void this.sync.flush(session.account);
    }catch(error){this.data.state='error';this.data.playMode='blocked';this.data.warning=error instanceof Error?error.message:'Account unavailable';this.emit();}
  }
  private adopt(profile:AccountProfile,session:AccountSession,select=true):void{
    if(select)selectAccountProgress(session.account);if(!this.activeBattle)applyCloudProgress(profile.progress);
    this.data.profile=profile;this.data.session=session;this.data.state='ready';this.data.playMode='account';this.data.acknowledgedRevision=profile.revision;
    this.data.progressDirty=JSON.stringify(mergeCloudProgress(profile.progress,readActiveCloudProgress()))!==JSON.stringify(profile.progress);
    this.data.progressSync=this.data.progressDirty?'pending':'synced';this.data.resultSync='synced';
  }
  async refresh():Promise<void>{if(this.data.state==='deleting')return;await this.initialize();}
  private async cache():Promise<void>{if(!this.data.profile||!this.data.session)return;try{await this.storage.writeCache({...this.data.profile,progress:mergeCloudProgress(this.data.profile.progress,readActiveCloudProgress())},this.data.session);}catch{this.storageFailed=true;this.data.warning='Local account storage unavailable. New progress is available in this session only.';}const bestWarning=accountBestWarning();if(bestWarning)this.data.warning=bestWarning;}
  private async records(ref:AccountRef):Promise<PendingResult[]>{let durable:PendingResult[]=[];try{durable=await this.storage.pending(ref);this.outboxUnavailable=false;}catch{this.storageFailed=true;this.outboxUnavailable=true;this.data.warning='Saved score queue could not be read. Sync will retry; existing queued scores remain protected.';}const all=new Map(durable.map(x=>[`${x.result.mode}:${x.result.payload.runId}`,x]));for(const r of this.memory.values())if(sameAccount(r.account,ref))all.set(`${r.result.mode}:${r.result.payload.runId}`,r);return [...all.values()];}
  private async count():Promise<void>{const ref=this.data.session?.account;if(!ref)return;const records=await this.records(ref);this.data.pending=records.length;this.data.resultSync=this.outboxUnavailable?'unavailable':records.some(r=>r.status==='permanent')?'permanent':records.length?'pending':'synced';if(this.storageFailed&&records.length)this.data.warning='Some progress could only be retained in this session. Keep this page open until synced.';}
  async settle(ref:AccountRef,result:RunResult):Promise<void>{
    this.stagingWrites++;
    if(sameAccount(ref,this.data.session?.account??null)){this.data.progressDirty=true;this.data.progressSync='pending';this.data.resultSync='pending';this.data.pending++;this.emit();}
    const record:PendingResult={account:ref,result,status:'pending'};try{await this.storage.enqueue(record);}catch{this.memory.set(`${accountKey(ref)}:${result.mode}:${result.payload.runId}`,record);this.storageFailed=true;this.data.warning='Result retained for this session only. Keep this page open until synced.';}
    this.stagingWrites--;
    if(sameAccount(ref,this.data.profile?.account??null)){this.data.progressDirty=true;this.data.progressSync='pending';await this.cache();}
    this.activeBattle=null;await this.count();this.emit();if(sameAccount(ref,this.data.session?.account??null))void this.sync.flush(ref);
  }
  async progressChanged(ref:AccountRef):Promise<void>{if(!sameAccount(ref,this.data.profile?.account??null))return;this.data.progressDirty=true;this.data.progressSync='pending';await this.cache();this.emit();if(!this.activeBattle)await this.sync.flush(ref);}
  async flushNow(ref:AccountRef):Promise<ApiResult<null>>{
    if(this.stagingWrites)return {ok:false,code:'STAGING_RESULT',message:'Saving result before upload.',status:503};
    const session=this.data.session;if(!session||!sameAccount(ref,session.account)||session.expiresAt<=this.now()||this.data.state==='deleting'||this.data.playMode!=='account')return {ok:false,code:'AUTH_REQUIRED',message:'Sign in to sync.',status:401};
    if(this.data.progressDirty&&this.data.profile){
      const sent=mergeCloudProgress(this.data.profile.progress,readActiveCloudProgress());this.data.progressSync='retrying';this.emit();const result=await this.client.syncProfile(sent,session.csrf);
      if(!result.ok){this.data.progressSync=result.status>=500||result.status===0||result.status===429?'pending':'incompatible';this.data.warning=result.message;if(result.status===401)await this.handleAuthFailure(result,ref);this.emit();return result;}
      if(!sameAccount(this.data.session?.account??null,ref))return {ok:false,code:'ACCOUNT_CHANGED',message:'Account changed.',status:401};
      if(!this.activeBattle)applyCloudProgress(result.value.progress);
      const now=mergeCloudProgress(result.value.progress,readActiveCloudProgress());this.data.profile=result.value;this.data.acknowledgedRevision=result.value.revision;this.data.progressDirty=JSON.stringify(now)!==JSON.stringify(result.value.progress);this.data.progressSync=this.data.progressDirty?'pending':'synced';await this.cache();
    }
    for(const record of await this.records(ref)){
      if(record.status==='permanent')continue;
      const key=`${accountKey(ref)}:${record.result.mode}:${record.result.payload.runId}`,owner=crypto.randomUUID();
      const send=async()=>{
        if(!sameAccount(this.data.session?.account??null,ref)||this.data.state==='deleting')return null;
        if(!(await this.records(ref)).some(r=>r.result.mode===record.result.mode&&r.result.payload.runId===record.result.payload.runId))return null;
        this.data.resultSync='retrying';this.emit();return this.client.uploadResult(record.result,session.csrf);
      };
      let response:ApiResult<import('../../shared/account.ts').ScoreAck>|null=null;
      if(typeof navigator!=='undefined'&&navigator.locks){await navigator.locks.request(key,async()=>{response=await send();});}
      else {const leased=await this.storage.lease(key,owner).catch(()=>true);if(!leased)continue;try{response=await send();}finally{await this.storage.release(key,owner).catch(()=>{});}}
      const result=response as ApiResult<import('../../shared/account.ts').ScoreAck>|null;if(!result)continue;
      if(result.ok){await this.storage.ack(ref,record.result).catch(()=>{this.storageFailed=true;});this.memory.delete(key);}
      else if(result.status===401||result.code==='CSRF'){await this.handleAuthFailure(result,ref);return result;}
      else if(result.status===0||result.status===429||result.status>=500){this.data.warning=result.message;await this.count();this.emit();return result;}
      else {await this.storage.markPermanent(ref,record.result,result.message).catch(()=>{});const m=this.memory.get(key);if(m){m.status='permanent';m.error=result.message;}this.data.warning=result.message;}
    }
    await this.count();if(!this.storageFailed&&!this.data.pending&&this.data.progressSync==='synced')this.data.warning=null;this.emit();
    if(this.outboxUnavailable)return {ok:false,code:'STORAGE_UNAVAILABLE',message:'Saved score queue is unreadable. Retrying.',status:503};
    if(this.data.progressDirty)return {ok:false,code:'MORE_PROGRESS',message:'New progress pending.',status:503};return {ok:true,value:null};
  }
  private async handleAuthFailure(result:{code:string;message:string},ref:AccountRef):Promise<void>{if(!sameAccount(ref,this.data.session?.account??null))return;this.sync.stop();if(result.code==='ACCOUNT_DELETED'){await this.purge(ref);this.data.state='deleted';this.data.profile=null;this.data.session=null;}else this.data.state='expired';this.data.playMode='blocked';this.data.warning=result.message;this.emit();}
  async logout():Promise<void>{this.lifecycle++;this.sync.stop();const session=this.data.session;this.logoutRef=session?.account??null;this.activeBattle=null;this.data.session=null;this.data.profile=null;this.data.playMode='blocked';this.data.state='signed-out';selectAccountProgress(null);this.emit();if(session){await this.storage.writeMeta('logout',session.account).catch(()=>{this.data.warning='Browser storage unavailable; server sign-out is being attempted.';});const r=await this.client.logoutSession(session.csrf);if(r.ok){this.logoutRef=null;await this.storage.writeMeta('logout',null).catch(()=>{});await this.storage.writeMeta('last-account',null).catch(()=>{});this.data.warning=null;}else this.data.warning=r.message;}this.channel?.postMessage({changed:true});this.emit();}
  async rename(nickname:string):Promise<ApiResult<AccountProfile>>{const s=this.data.session;if(!s)return {ok:false,code:'AUTH_REQUIRED',message:'Sign in first.',status:401};const r=await this.client.updateNickname(nickname,s.csrf);if(r.ok){if(!sameAccount(s.account,this.data.session?.account??null)||!sameAccount(r.value.account,s.account))return {ok:false,code:'ACCOUNT_CHANGED',message:'Account changed during nickname update.',status:401};this.data.profile=r.value;s.nickname=r.value.nickname;await this.cache();this.channel?.postMessage({changed:true});this.emit();}return r;}
  async beginDelete():Promise<void>{const s=this.data.session;if(!s)return;try{await this.storage.writeMeta('deleting',s.account);}catch{this.data.warning='Account deletion needs working browser storage to recover safely. No deletion was started.';this.emit();return;}this.lifecycle++;this.sync.stop();this.data.state='deleting';this.data.playMode='blocked';this.emit();}
  async cancelDelete():Promise<void>{if(await this.storage.readMeta('delete-requested')){this.data.warning='Deletion status is uncertain. Retry deletion to resolve it before playing.';this.emit();return;}await this.storage.writeMeta('deleting',null);this.data.state='loading';await this.initialize();}
  async deleteAccount():Promise<ApiResult<{deleted:true}>>{const s=this.data.session;if(!s)return {ok:false,code:'AUTH_REQUIRED',message:'Sign in first.',status:401};await this.storage.writeMeta('delete-requested',s.account);const r=await this.client.deleteAccount(s.csrf);if(r.ok){await this.purge(s.account);this.data.session=null;this.data.profile=null;this.data.state='deleted';this.data.playMode='blocked';this.channel?.postMessage({changed:true});this.emit();}else if(r.code==='ACCOUNT_DELETED')await this.handleAuthFailure(r,s.account);else {if(r.status>0&&r.status<500)await this.storage.writeMeta('delete-requested',null);this.data.warning=r.message;this.emit();}return r;}
  private async purge(ref:AccountRef):Promise<void>{await this.storage.purge(ref);purgeLocalAccount(ref);await this.storage.writeMeta('last-account',null);await this.storage.writeMeta('deleting',null);await this.storage.writeMeta('delete-requested',null);await this.storage.writeMeta('logout',null);for(const [key,value]of this.memory)if(sameAccount(value.account,ref))this.memory.delete(key);this.activeBattle=null;}
  async discardBattle():Promise<void>{this.activeBattle=null;await this.refresh();}
}
export const accountSystem=new AccountSystem();
