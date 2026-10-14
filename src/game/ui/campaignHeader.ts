import type {Rect} from './viewport.ts';
export function campaignHeaderActions(width:number):{account:Rect;back:Rect;titleWidth:number}{return {back:{x:width-80,y:4,width:64,height:44},account:{x:width-158,y:4,width:72,height:44},titleWidth:Math.max(1,width-190)};}
