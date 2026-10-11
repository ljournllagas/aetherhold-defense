import type Phaser from 'phaser';
import type { AccountView } from '../../shared/account.ts';
import { accountSystem } from '../systems/AccountSystem.ts';
export function accountStatus(v:Pick<AccountView,'playMode'|'progressSync'|'resultSync'|'pending'|'progressDirty'|'warning'|'state'>):string {
  if(v.playMode==='legacy')return 'Sign in to save across devices';
  if(v.state==='expired')return 'Session expired · Sign in to sync';
  if(v.state==='deleting')return 'Account deletion pending';
  if(v.warning)return v.warning;
  if(v.progressSync==='synced'&&v.resultSync==='synced'&&!v.progressDirty)return 'Synced';
  return `Pending sync${v.pending?` · ${v.pending} score${v.pending===1?'':'s'}`:''}`;
}
export function accountEntryAllowed():boolean {return accountSystem.canStartBattle()||(import.meta.env.DEV&&accountSystem.view().config===null);}
export function mountAccountButton(scene:Phaser.Scene):void {
  if(typeof document==='undefined')return;
  const button=document.createElement('button');button.className='account-access';button.type='button';button.setAttribute('aria-label','Open player account and cloud save status');
  button.onclick=()=>scene.scene.start('Login',{manage:true});document.getElementById('game-root')?.appendChild(button);
  const unsubscribe=accountSystem.subscribe(v=>{button.textContent=v.session?`${v.session.nickname} · ${v.pending?'Pending sync':'Account'}`:'Sign in';button.title=accountStatus(v);});
  scene.events.once('shutdown',()=>{unsubscribe();button.remove();});
}
