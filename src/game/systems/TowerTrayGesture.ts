import type {Point,Rect} from '../ui/viewport.ts';
import type {TowerId} from '../../shared/progression.ts';
export interface TrayInput {id:number;point:Point;kind:'touch'|'mouse'|'pen'}
export type TrayIntent={type:'select';towerId:TowerId}|{type:'scroll';dx:number}
 |{type:'drag'|'drop';towerId:TowerId;point:Point;anchor:Point}|{type:'cancel'};
export class TowerTrayGesture {
 private contact:(TrayInput&{start:Point;towerId:TowerId})|null=null;
 private mode:'undecided'|'scrolling'|'dragging'|'cancelled'='undecided';
 private contacts=new Set<number>();
 get dragging():boolean{return this.mode==='dragging'&&this.contact!==null;}
 down(input:TrayInput,towerId:TowerId):void {
  this.contacts.add(input.id);
  if(this.contacts.size>1){this.mode='cancelled';this.contact=null;return;}
  this.contact={...input,start:{...input.point},point:{...input.point},towerId};this.mode='undecided';
 }
 move(input:TrayInput):TrayIntent|null {
  const c=this.contact;if(!c||c.id!==input.id||this.mode==='cancelled')return null;
  const delta=input.point.x-c.point.x;c.point={...input.point};
  const dx=c.point.x-c.start.x,dy=c.point.y-c.start.y;
  if(this.mode==='undecided'){
   if(Math.hypot(dx,dy)<=(c.kind==='touch'?10:6))return null;
   this.mode=c.kind!=='touch'?'dragging':Math.abs(dx)>=Math.abs(dy)?'scrolling':dy<0?'dragging':'cancelled';
   if(this.mode==='cancelled')return {type:'cancel'};
  }
  if(this.mode==='scrolling')return {type:'scroll',dx:delta};
  return {type:'drag',towerId:c.towerId,point:{...c.point},anchor:this.anchor(c)};
 }
 up(input:TrayInput):TrayIntent|null {
  const c=this.contact;this.contacts.delete(input.id);
  if(!c||c.id!==input.id){if(!this.contacts.size)this.cancel();return null;}
  const mode=this.mode;this.contact=null;
  if(!this.contacts.size)this.mode='undecided';
  if(mode==='dragging')return {type:'drop',towerId:c.towerId,point:{...input.point},anchor:this.anchor({...c,point:input.point})};
  if(mode==='undecided'&&Math.hypot(input.point.x-c.start.x,input.point.y-c.start.y)<=(c.kind==='touch'?10:6))return {type:'select',towerId:c.towerId};
  return null;
 }
 cancel():void {this.contact=null;this.mode='cancelled';this.contacts.clear();}
 private anchor(input:TrayInput):Point{return {x:input.point.x,y:input.point.y-(input.kind==='touch'?48:0)};}
}
export function edgePan(anchor:Point,field:Rect,blocked:boolean):Point {
 if(blocked||anchor.x<field.x||anchor.y<field.y||anchor.x>=field.x+field.width||anchor.y>=field.y+field.height)return {x:0,y:0};
 const band=(distance:number)=>Math.max(0,Math.min(1,(32-distance)/32))*180;
 return {x:band(anchor.x-field.x)-band(field.x+field.width-anchor.x),y:band(anchor.y-field.y)-band(field.y+field.height-anchor.y)};
}
