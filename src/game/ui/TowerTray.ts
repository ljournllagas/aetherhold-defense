import {formatCount} from '../../shared/displayNumbers.ts';
import type Phaser from 'phaser';
import type {Point,Rect} from './viewport.ts';
import {TOWER_IDS,TOWERS} from '../config/towers.ts';
import {towerPortraitKey} from '../art/towerArt.ts';
import {C,style} from './tokens.ts';
import type {TowerId} from '../../shared/progression.ts';
import type {TrayInput} from '../systems/TowerTrayGesture.ts';
import {button} from './components.ts';
import {towerTrayCardLayout} from './towerTrayLayout.ts';
export class TowerTray {
 private root:Phaser.GameObjects.Container;
 private offset=0;
 private gold=-1;
 private selected:TowerId|null=null;
 constructor(private scene:Phaser.Scene,parent:Phaser.GameObjects.Container,private bounds:Rect,private onDown:(input:TrayInput,id:TowerId)=>void){
  this.root=scene.add.container(bounds.x,bounds.y);parent.add(this.root);
 }
 contains(p:Point):boolean {const b=this.bounds;return p.x>=b.x&&p.y>=b.y&&p.x<b.x+b.width&&p.y<b.y+b.height;}
 controlBounds():Rect[]{return [this.bounds];}
 refresh(gold:number,selected:TowerId|null):void {
  if(this.gold===gold&&this.selected===selected)return;this.gold=gold;this.selected=selected;this.draw();
 }
 private get visibleWidth():number{return this.bounds.width-(TOWER_IDS.length*94>this.bounds.width?48:0);}
 private get maxOffset():number{return Math.max(0,TOWER_IDS.length*94-this.visibleWidth+8);}
 scrollBy(dx:number):void {this.offset=Math.max(0,Math.min(this.maxOffset,this.offset-dx));this.draw();}
 resize(bounds:Rect):void {this.bounds=bounds;this.root.setPosition(bounds.x,bounds.y);this.draw();}
 private draw():void {
  this.root.removeAll(true);
  this.root.add(this.scene.add.rectangle(0,0,this.bounds.width,this.bounds.height,C.bgPanel).setOrigin(0));
  TOWER_IDS.forEach((id,i)=>{
   const x=4+i*94-this.offset;if(x<0||x+88>this.visibleWidth)return;
   const cfg=TOWERS[id],cost=cfg.levels[0].cost;
   const box=this.scene.add.rectangle(x,4,88,68,C.bgRaised).setOrigin(0).setStrokeStyle(1,id===this.selected?0xd7aa4e:0x586b76).setInteractive({useHandCursor:true});
   box.on('pointerdown',(p:Phaser.Input.Pointer,_x:number,_y:number,e:Phaser.Types.Input.EventData)=>{
    e.stopPropagation();this.onDown({id:p.id,point:{x:p.x,y:p.y},kind:p.wasTouch?'touch':(p.event as PointerEvent)?.pointerType==='pen'?'pen':'mouse'},id);
   });
   const g=towerTrayCardLayout(),top=4;
   this.root.add([box,this.scene.add.image(x+g.portrait.x+14,top+g.portrait.y+14,towerPortraitKey(id)).setDisplaySize(28,28),
    this.scene.add.text(x+g.name.x,top+g.name.y,cfg.name,style(12,C.textPrimary,true)),
    this.scene.add.text(x+g.cost.x,top+g.cost.y,formatCount(cost),style(14,this.gold>=cost?C.gold:C.textSecondary)),
    this.scene.add.text(x+g.status.x,top+g.status.y,this.gold>=cost?'gold':'Need\ngold',style(12,C.textSecondary))]);
  });
  if(this.maxOffset)button(this.scene,this.root,this.bounds.width-44,4,44,this.offset>=this.maxOffset?'↺':'›',()=>{this.offset=this.offset>=this.maxOffset?0:Math.min(this.maxOffset,this.offset+94);this.draw();},'secondary',68);
 }
 destroy():void {this.root.destroy(true);}
}
