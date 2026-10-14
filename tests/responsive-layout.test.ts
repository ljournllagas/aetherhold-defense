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

it.each([[320,390],[320,360]])('reclaims exactly the tower-card row for short portrait boss commands at %ix%i',(w,h)=>{
 const safe={top:12,right:8,bottom:20,left:8};
 const ordinary=gameLayout(w,h,safe);
 const boss=gameLayout(w,h,safe,{portraitBossCommands:true});
 expect(boss.portraitBossCommands).toBe(true);
 expect(boss.tray).toBe(72);
 expect(boss.field.height).toBe(ordinary.field.height+76);
 expect(boss.trayBounds.height).toBe(0);
 expect(boss.waveBounds).toEqual({x:8,y:h-72,width:w-16,height:52});
 expect(boss.waveBounds.y+boss.waveBounds.height).toBe(h-safe.bottom);
 for(const layout of [ordinary,boss]){
  const sheet=sheetBounds(layout,'build',false);
  expect(sheet.y+sheet.height).toBeLessThanOrEqual(layout.height-layout.tray);
 }
 expect(gameLayout(844,390,safe,{portraitBossCommands:true}).portraitBossCommands).toBe(false);
});
