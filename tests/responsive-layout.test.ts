import {expect,it} from 'vitest';
import {gameLayout,sheetBounds} from '../src/game/ui/layout.ts';
it.each([[360,640],[390,844],[640,360],[844,390],[768,1024],[1024,768],[1366,768],[1920,1080]])('keeps controls reachable at %s×%s',(w,h)=>{
 const l=gameLayout(w,h,{top:12,right:8,bottom:20,left:8});
 for(const b of [l.trayBounds,l.waveBounds]){
  expect(b.x).toBeGreaterThanOrEqual(8);expect(b.y).toBeGreaterThanOrEqual(12);
  expect(b.x+b.width).toBeLessThanOrEqual(w-8);expect(b.y+b.height).toBeLessThanOrEqual(h-20);
  expect(b.height).toBeGreaterThanOrEqual(44);
 }
 expect(l.field.height).toBeGreaterThan(0);
 const b=sheetBounds(l,'evolve',false);
 expect(b.y).toBeGreaterThanOrEqual(12);expect(b.y+b.height).toBeLessThanOrEqual(h-20);
});
