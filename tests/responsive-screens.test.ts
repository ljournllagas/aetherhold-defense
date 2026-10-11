import {afterEach,expect,it,vi} from 'vitest';
import {autoScene} from './helpers/autoScene.ts';
import {gameLayout} from '../src/game/ui/layout.ts';
afterEach(()=>vi.restoreAllMocks());
it.each([[360,640],[390,844],[640,360],[844,390],[768,1024],[1024,768],[1366,768],[1920,1080]])('HUD actions fit their reserved area at %s×%s',(w,h)=>{
 const {run,loose}=autoScene();run.layout=gameLayout(w,h);
 const rectangles:Array<{x:number;y:number;width:number;height:number}>=[];
 const chain=():any=>{const p:any=new Proxy(()=>p,{get:(t,k)=>Reflect.has(t,k)?Reflect.get(t,k):k==='then'?undefined:p,apply:()=>p});return p;};
 const add=chain();add.rectangle=(x:number,y:number,width:number,height:number)=>{rectangles.push({x,y,width,height});return chain();};loose.add=add;
 (loose as unknown as {drawControls():void}).drawControls();
 expect(rectangles.length).toBeGreaterThanOrEqual(3);
 for(const r of rectangles){expect(r.x).toBeGreaterThanOrEqual(0);expect(r.x+r.width).toBeLessThanOrEqual(w);expect(r.y+r.height).toBeLessThanOrEqual(run.layout.hud);expect(r.width).toBeGreaterThanOrEqual(44);}
});
