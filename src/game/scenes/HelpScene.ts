import Phaser from 'phaser';
import {ScrollSheet} from '../ui/ScrollSheet.ts';
import {HELP_TOPICS} from '../ui/helpContent.ts';
import {localGuide} from '../systems/ContextualGuide.ts';
import {C} from '../ui/tokens.ts';
export class HelpScene extends Phaser.Scene {
 private sheet:ScrollSheet|null=null;
 private returnTo='MainMenu';
 constructor(){super('Help');}
 init(data?:{returnTo?:string}):void{this.returnTo=data?.returnTo??'MainMenu';}
 create():void {
  const w=this.scale.width,h=this.scale.height;
  this.add.rectangle(0,0,w,h,C.bgDeep).setOrigin(0);
  const root=this.add.container(0,0);
  const width=Math.min(600,w-16);
  const sheet=new ScrollSheet(this,root,{x:(w-width)/2,y:8,width,height:h-16},'How to play',()=>this.scene.start(this.returnTo));this.sheet=sheet;
  let y=0;for(const topic of HELP_TOPICS){const title=sheet.text(y,topic.title,C.gold,18);y+=title.height+8;const body=sheet.text(y,topic.body,C.textSecondary,16);y+=body.height+24;}
  sheet.action(y,'Replay first-play hints',()=>{localGuide().replay();this.scene.start(this.returnTo);});
  const resize=()=>this.scene.restart({returnTo:this.returnTo});
  this.scale.on('resize',resize);this.events.once('shutdown',()=>{sheet.destroy();this.scale.off('resize',resize);});
 }
}
