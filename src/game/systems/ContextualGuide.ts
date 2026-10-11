export type GuideStep='placement'|'upgrade'|'prerequisites';
export class ContextualGuide {
 private done=new Set<GuideStep>();
 private skipped=false;
 constructor(private storage:Pick<Storage,'getItem'|'setItem'>|null){
  try{const value=JSON.parse(storage?.getItem('aetherhold-ui-guide-v1')??'null');
   if(value&&typeof value==='object'){this.skipped=value.skipped===true;
    if(Array.isArray(value.done))for(const s of value.done)if(['placement','upgrade','prerequisites'].includes(s))this.done.add(s);}
  }catch{/* Guidance remains available when storage cannot be read. */}
 }
 shouldShow(step:GuideStep):boolean{return !this.skipped&&!this.done.has(step);}
 complete(step:GuideStep):void{this.done.add(step);this.save();}
 skip():void{this.skipped=true;this.save();}
 replay():void{this.done.clear();this.skipped=false;this.save();}
 private save():void{try{this.storage?.setItem('aetherhold-ui-guide-v1',JSON.stringify({done:[...this.done],skipped:this.skipped}));}catch{/* Session memory keeps dismissals effective. */}}
}
let deviceGuide:ContextualGuide|undefined;
export function localGuide():ContextualGuide {
 if(deviceGuide)return deviceGuide;
 try{return deviceGuide=new ContextualGuide(typeof localStorage==='undefined'?null:localStorage);}catch{return deviceGuide=new ContextualGuide(null);}
}
