import {expect,it,vi} from 'vitest';
vi.mock('phaser',()=>({default:{}}));
import {TowerTray} from '../src/game/ui/TowerTray.ts';
it('offscreen choices cannot receive input and scrolling reveals them',()=>{
 let active:Array<{x:number;width:number;handlers:Record<string,Function>}>=[];const labels:string[]=[];
 const root:any={add(){},removeAll(){active=[];labels.length=0;},setPosition(){},destroy(){}};
 const add:any={container:()=>root,rectangle:(x:number,_y:number,width:number)=>{
  const r:any={x,width,handlers:{},setOrigin(){return r;},setStrokeStyle(){return r;},setInteractive(){active.push(r);return r;},on(event:string,fn:Function){r.handlers[event]=fn;return r;}};return r;
 },image:()=>({setDisplaySize(){return this;}}),text:(_x:number,_y:number,value:string)=>{labels.push(value);return {setOrigin(){return this;}};}};
 const onDown=vi.fn(),tray=new TowerTray({add} as any,root,{x:0,y:0,width:280,height:76},onDown);
 tray.refresh(100,'longbow');expect(labels).toContain('Ranger');expect(labels).toContain('100');expect(labels).not.toContain('Tempest');
 expect(active.every(r=>r.x>=0&&r.x+r.width<=280)).toBe(true);
 tray.scrollBy(-500);expect(labels).not.toContain('Ranger');expect(active.length).toBeGreaterThan(0);
 const p={id:1,x:40,y:20,wasTouch:true};active[0].handlers.pointerdown(p,0,0,{stopPropagation(){}});
 expect(onDown.mock.calls[0][0]).toMatchObject({kind:'touch',point:{x:40,y:20}});
});
it('mouse browsing reaches the final tower without starting a placement',()=>{
 let boxes:any[]=[],labels:string[]=[];const root:any={add(){},removeAll(){boxes=[];labels=[];},destroy(){}};
 const add:any={container:()=>root,rectangle:()=>{const r:any={handlers:{},setOrigin(){return r;},setStrokeStyle(){return r;},setFillStyle(){return r;},setInteractive(){boxes.push(r);return r;},on(k:string,f:Function){r.handlers[k]=f;return r;}};return r;},image:()=>({setDisplaySize(){return this;}}),text:(_x:number,_y:number,v:string)=>{labels.push(v);return {setOrigin(){return this;}};}};
 const onDown=vi.fn(),tray=new TowerTray({add} as any,root,{x:0,y:0,width:360,height:76},onDown);tray.refresh(1000,null);
 for(let i=0;i<5&&!labels.includes('Tempest');i++){const next=boxes.find(b=>b.handlers.pointerup);expect(next).toBeDefined();const p={id:1,x:340,y:30};next.handlers.pointerdown(p,0,0,{stopPropagation(){}});next.handlers.pointerup(p,0,0,{stopPropagation(){}});}
 expect(labels).toContain('Tempest');expect(onDown).not.toHaveBeenCalled();
});
