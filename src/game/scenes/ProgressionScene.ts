import {formatCount,formatQuantity} from '../../shared/displayNumbers.ts';
import Phaser from 'phaser';
import { TOWERS } from '../config/towers.ts';
import { loadBest, loadLegacyBests } from '../systems/Settings.ts';
import type { LocalBest } from '../systems/Settings.ts';
import { unlockRepository } from '../systems/UnlockSystem.ts';
import type { UnlockView } from '../systems/UnlockSystem.ts';
import { achievementViews } from '../ui/progressionView.ts';
import { ScrollSheet } from '../ui/ScrollSheet.ts';
import { C } from '../ui/tokens.ts';
import {campaignRepository} from '../campaign/progress.ts';
import {CAMPAIGN_MILESTONES,CAMPAIGN_SIGILS,CAMPAIGN_WORLDS} from '../campaign/config.ts';
import {CAMPAIGN_MILESTONE_LABELS} from '../campaign/presentation.ts';
import {campaignNextStep} from '../ui/prerequisites.ts';
import type {CampaignView} from '../campaign/types.ts';
import {accountSystem} from '../systems/AccountSystem.ts';
import {accountStatus} from '../ui/accountControls.ts';

export function campaignProgressionLines(view:CampaignView):string[]{
 const lines=[`Campaign stars · ${view.totalMasteryStars}/90`,campaignNextStep(view).text];
 if(view.warning)lines.push(view.warning);
 for(const m of CAMPAIGN_MILESTONES)lines.push(`${view.totalMasteryStars>=m.stars?'Unlocked':'Locked'} · ${m.stars} stars · ${CAMPAIGN_MILESTONE_LABELS[m.stars]} · ${view.totalMasteryStars}/${m.stars}`);
 for(const s of CAMPAIGN_SIGILS)lines.push(`${view.profile.worldSigils.includes(s.id)?'Earned':'Locked'} · ${CAMPAIGN_WORLDS.find(w=>w.sigilId===s.id)?.name} Sigil · Complete Level ${s.level} · Unlocks ${s.unlocks.map(id=>id.replace(/_/g,' ')).join(', ')}`);
 return lines;
}

const STATE_PREFIX = /^(Locked|Unlocked) · /;

export function progressionPanelLines(view: UnlockView, currentBest: LocalBest | null, legacyBests: readonly LocalBest[]): string[] {
  const lines: string[] = [];
  if (view.warning) lines.push(view.warning);
  for (const a of achievementViews(view, [], 0)) {
    const state = !a.earned ? 'Locked' : a.unsaved ? 'Unlocked · not saved' : 'Unlocked · saved';
    lines.push(`${TOWERS[a.towerId].name}: ${a.starterName} (starter) / ${a.alternativeName}`);
    lines.push(`${state} · ${a.requirement}`);
  }
  lines.push(currentBest ? `Personal best · ${formatCount(currentBest.score)} pts` : 'Personal best · none yet');
  for (const record of legacyBests) lines.push(`Legacy era ${record.scoreVersion} best · ${formatCount(record.score)} pts`);
  return lines;
}

export class ProgressionScene extends Phaser.Scene {
  private activeTab:'campaign'|'classic'='classic';
  private returnTo='MainMenu';
  private root:Phaser.GameObjects.Container|null=null;
  private savedScroll=0;
  init(data?:{tab?:'campaign'|'classic';returnTo?:string}):void{this.activeTab=data?.tab??this.activeTab;this.returnTo=data?.returnTo??'MainMenu';}
  private sheet: ScrollSheet | null = null;
  private readonly handleResize = (): void => { this.savedScroll=this.sheet?.scrollOffset??0;this.scene.restart({tab:this.activeTab,returnTo:this.returnTo}); };

  constructor() {
    super('Progression');
  }

  create(): void {
    const W = this.scale.width;
    const H = this.scale.height;
    this.add.rectangle(0, 0, W, H, 0x0a0e12, 1).setOrigin(0);
    const root = this.add.container(0, 0);this.root=root;
    const width = Math.min(560, W - 24);
    const sheet = new ScrollSheet(this, root, { x: (W - width) / 2, y: 12, width, height: H - 24 }, 'Progression', () => this.scene.start('MainMenu'));
    this.sheet = sheet;
    const view = unlockRepository.view();
    sheet.pair(0,'Campaign','Classic',()=>{this.activeTab='campaign';this.renderProgression();},()=>{this.activeTab='classic';this.renderProgression();});
    const sync=sheet.text(60,accountStatus(accountSystem.view()),C.textSecondary,16);
    let y = 60+sync.height+16;
    for (const line of this.activeTab==='campaign'?campaignProgressionLines(campaignRepository.view()):progressionPanelLines(view, loadBest(), loadLegacyBests())) {
      const requirement = STATE_PREFIX.test(line);
      const color = line === view.warning ? C.dangerBright : requirement ? C.textSecondary : C.textPrimary;
      const text = sheet.text(y, line, color, 16);
      y += text.height + (requirement ? 12 : 4);
    }
    if(this.activeTab==='campaign')sheet.action(y+8,'Open Campaign levels and star targets',()=>this.scene.start('Campaign'));
    sheet.action(y+68,'Help',()=>this.scene.start('Help',{returnTo:'Progression'}));
    sheet.action(y+120,'Back',()=>this.scene.start(this.returnTo));
    sheet.scrollTo(this.savedScroll);
    let revision=accountSystem.view().profile?.revision;
    const unsubscribe=accountSystem.subscribe(v=>{sync.setText(accountStatus(v));if(v.profile?.revision!==revision){revision=v.profile?.revision;this.savedScroll=sheet.scrollOffset;this.renderProgression();}});

    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.sheet?.destroy();
      this.sheet = null;
      unsubscribe();
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    });
  }
  private renderProgression():void {this.scene.restart({tab:this.activeTab,returnTo:this.returnTo});}
}
