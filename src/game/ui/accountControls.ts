import type Phaser from 'phaser';
import type { AccountView } from '../../shared/account.ts';
import { accountSystem } from '../systems/AccountSystem.ts';
import type {Rect} from './viewport.ts';
export function accountStatus(v:Pick<AccountView,'playMode'|'progressSync'|'resultSync'|'pending'|'progressDirty'|'warning'|'state'>):string {
  if(v.playMode==='guest')return v.warning??'Guest · Saved in this browser · Sign in to save across devices';
  if(v.playMode==='legacy')return 'Sign in to save across devices';
  if(v.state==='expired')return 'Session expired · Sign in to sync';
  if(v.state==='deleting')return 'Account deletion pending';
  if(v.warning)return v.warning;
  if(v.progressSync==='synced'&&v.resultSync==='synced'&&!v.progressDirty)return 'Synced';
  return `Pending sync${v.pending?` · ${v.pending} score${v.pending===1?'':'s'}`:''}`;
}
export function accountEntryAllowed():boolean {return accountSystem.canStartBattle()||(import.meta.env.DEV&&accountSystem.view().config===null);}
export function mountAccountButton(scene:Phaser.Scene,insetRight=12,shortLabel=false,bounds?:Rect):HTMLButtonElement|undefined {
  if(typeof document==='undefined')return;
  const button=document.createElement('button');button.className='account-access';button.type='button';button.setAttribute('aria-label','Open player account and cloud save status');
  button.style.right=`${insetRight}px`;
  const position=()=>{if(!bounds)return;const canvas=scene.game.canvas.getBoundingClientRect(),host=document.getElementById('game-root')!.getBoundingClientRect(),sx=canvas.width/scene.scale.width,sy=canvas.height/scene.scale.height;Object.assign(button.style,{right:'auto',left:`${canvas.left-host.left+bounds.x*sx}px`,top:`${canvas.top-host.top+bounds.y*sy}px`,width:`${bounds.width*sx}px`,height:`${bounds.height*sy}px`,minHeight:'0',maxWidth:'none',boxSizing:'border-box',padding:'0 4px',borderRadius:'0'});};
  button.onclick=()=>scene.scene.start('Login',{manage:true});document.getElementById('game-root')?.appendChild(button);
  const unsubscribe=accountSystem.subscribe(v=>{button.textContent=v.playMode==='guest'?(shortLabel?'Guest':`${v.guestName} · Guest`):shortLabel?(v.session?'Account':'Sign in'):v.session?`${v.session.nickname} · ${v.pending?'Pending sync':'Account'}`:'Sign in';button.title=accountStatus(v);});
  position();if(bounds)scene.scale.on('resize',position);
  scene.events.once('shutdown',()=>{unsubscribe();if(bounds)scene.scale.off('resize',position);button.remove();});
  return button;
}
