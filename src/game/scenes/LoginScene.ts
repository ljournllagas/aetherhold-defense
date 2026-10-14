import Phaser from 'phaser';
import { accountSystem } from '../systems/AccountSystem.ts';
import { accountStatus } from '../ui/accountControls.ts';
import { editPlayerName,validatePlayerName } from '../../shared/playerName.ts';
import { paintVista } from '../art/menubg.ts';
import {loadSettings} from '../systems/Settings.ts';
export class LoginScene extends Phaser.Scene {
  private root:HTMLDivElement|null=null;
  private name='';
  private manage=false;
  private message='';
  private busy=false;
  private lossWarningOpen=false;
  constructor(){super('Login');}
  init(data?:{manage?:boolean}):void{this.manage=!!data?.manage;this.message='';this.lossWarningOpen=false;this.name=accountSystem.view().session?.nickname??loadSettings().playerName;}
  create():void{
    paintVista(this,'menu');this.root=document.createElement('div');this.root.className='account-overlay';document.getElementById('game-root')!.appendChild(this.root);
    const query=new URLSearchParams(location.search);if(query.get('authError')==='reauth-required')this.message='Google needs a recent sign-in for deletion. Sign out and sign back into your Google account on Google’s website, then retry.';else if(query.has('authError'))this.message='Google sign-in did not complete. Please retry.';
    history.replaceState(null,'',location.pathname);
    const unsubscribe=accountSystem.subscribe(()=>this.render());this.events.once('shutdown',()=>{unsubscribe();this.root?.remove();this.root=null;});
    if(accountSystem.view().state==='loading')void accountSystem.initialize();
  }
  private render():void{
    if(!this.root)return;const previous=this.root.querySelector<HTMLInputElement>('input');if(previous)this.name=previous.value;
    const focused=previous===document.activeElement,selection=previous?.selectionStart??null;
    const view=accountSystem.view();this.root.replaceChildren();const panel=document.createElement('section');panel.className='account-panel';panel.setAttribute('aria-label','Player account');this.root.appendChild(panel);
    const title=document.createElement('h1');title.textContent=view.session?'Your Defender':view.playMode==='guest'?'Your Guest Defender':'Welcome, Defender';panel.appendChild(title);
    const summary=document.createElement('p');summary.textContent=view.session?accountStatus(view):'Play as a guest to save in this browser. Google saves progress across devices and lets you submit public scores. Clearing browser data removes guest saves.';summary.setAttribute('role','status');panel.appendChild(summary);
    if(this.message){const alert=document.createElement('p');alert.className='account-warning';alert.setAttribute('role','alert');alert.textContent=this.message;panel.appendChild(alert);}
    const action=(label:string,fn:()=>void,danger=false)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.disabled=this.busy;if(danger)b.className='account-danger';b.onclick=fn;panel.appendChild(b);return b;};
    if(view.session){
      const label=document.createElement('label');label.textContent='Public nickname';const input=document.createElement('input');input.maxLength=20;input.value=this.name||view.session.nickname;input.oninput=()=>{this.name=input.value;};label.appendChild(input);panel.appendChild(label);
      action('Save nickname',()=>{const name=editPlayerName(input.value),valid=validatePlayerName(name);if(!valid.ok){this.message=valid.error??'Enter a nickname.';this.render();return;}this.perform(async()=>{const r=await accountSystem.rename(name);this.message=r.ok?'Nickname saved.':r.message;});});
      if(view.state==='deleting'){
        const warning=document.createElement('p');warning.textContent='Deleting permanently removes cloud progress and account-linked scores, including unfinished guest imports claimed by this account. Pending results will be discarded.';panel.appendChild(warning);
        if(view.session.canDelete)action('Permanently delete my account',()=>{if(!confirm('Permanently delete your cloud progress and scores? This cannot be undone.'))return;this.perform(async()=>{const r=await accountSystem.deleteAccount();this.message=r.ok?'Account deleted.':r.message;});},true);
        else action('Verify Google account for deletion',()=>location.assign('/api/auth/start?purpose=delete'));
        action('Cancel deletion',()=>this.perform(()=>accountSystem.cancelDelete()));
      }else{
        action('Continue to game',()=>this.scene.start('MainMenu')).disabled=this.busy||!accountSystem.canStartBattle();
        if(view.state==='expired'){action('Sign in again',()=>this.googleSignIn());action('Play as Guest',()=>this.perform(async()=>{await accountSystem.logout();const r=await accountSystem.enterGuest(this.name);if(r.ok)this.scene.start('MainMenu');else this.message=r.message;}));}
        action('Sign out / Switch account',()=>this.perform(()=>accountSystem.logout()));
        action('Delete account and cloud data',()=>this.perform(()=>accountSystem.beginDelete()),true);
      }
    }else{
      const label=document.createElement('label');label.textContent='In-game name · 20 characters max';const input=document.createElement('input');input.maxLength=20;input.value=this.name;input.autocomplete='name';input.setAttribute('aria-label','Guest in-game name');input.oninput=()=>{this.name=input.value;};label.appendChild(input);panel.appendChild(label);
      if(this.lossWarningOpen){action('Continue to Google — lose unsaved progress',()=>this.perform(()=>this.confirmedGoogleSignIn(true)));action('Cancel — keep playing',()=>{this.lossWarningOpen=false;this.message='';this.render();});}
      else action('Sign in with Google',()=>this.googleSignIn());
      action(view.playMode==='guest'?'Save name and continue':'Play as Guest',()=>this.perform(async()=>{const r=await accountSystem.enterGuest(input.value);if(r.ok)this.scene.start('MainMenu');else this.message=r.message;}));
      if(view.playMode==='guest'&&view.warning){const warning=document.createElement('p');warning.textContent=view.warning;warning.setAttribute('role','status');panel.appendChild(warning);}
      if(view.playMode==='legacy')action('Continue playing',()=>this.scene.start('MainMenu'));
      if(view.warning){const warning=document.createElement('p');warning.textContent=view.warning;panel.appendChild(warning);}
      action('Retry connection',()=>void accountSystem.initialize());
    }
    if(focused){const input=panel.querySelector('input');input?.focus();if(selection!==null)input?.setSelectionRange(selection,selection);}
  }
  private googleSignIn():void {this.perform(async()=>{const p=await accountSystem.googleSignInPreflight();if(!p.allowed){this.message=p.message??'Sign-in unavailable.';return;}if(p.requiresLossAcknowledgment){this.message=p.message??'';this.lossWarningOpen=true;return;}await this.confirmedGoogleSignIn(false);});}
  private async confirmedGoogleSignIn(acknowledgeLoss:boolean):Promise<void>{const p=await accountSystem.beginGoogleSignIn(acknowledgeLoss);if(!p.ok){this.message=p.message??'Sign-in unavailable.';this.lossWarningOpen=p.requiresLossAcknowledgment;return;}location.assign('/api/auth/start');}
  private perform(work:()=>Promise<unknown>):void {
    if(this.busy)return;this.busy=true;this.render();
    void work().catch(error=>{this.message=error instanceof Error?error.message:'Account operation failed. Please retry.';}).finally(()=>{this.busy=false;this.render();});
  }
}
