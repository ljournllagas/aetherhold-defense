import {afterEach,expect,it,vi} from 'vitest';
import {autoScene} from './helpers/autoScene.ts';
import type {PurchaseContext} from '../src/game/systems/EvolutionSystem.ts';
import {Display,release} from './helpers/autoScene.ts';
import {Tower} from '../src/game/entities/Tower.ts';
import {gameLayout} from '../src/game/ui/layout.ts';
afterEach(()=>vi.restoreAllMocks());
it('desktop inspector routes targeting and selling into Details and closes its pause',()=>{
 const {scene,run,loose}=autoScene();const d=loose as any;run.layout=gameLayout(1366,768);run.selectedTower=new Tower('longbow',200,200,0);
 const controls:Array<{box:Display;label:string}>=[];const add=d.add;
 add.rectangle=()=>{const box=new Display();controls.push({box,label:''});return box;};
 add.text=(_x:number,_y:number,label:string)=>{if(controls.length&&!controls[controls.length-1].label)controls[controls.length-1].label=label;const t=new Display();t.text=label;return t;};
 Object.getPrototypeOf(scene).refreshInfoPanel.call(scene);
 expect(controls.some(c=>c.label==='Details')).toBe(true);expect(controls.some(c=>c.label==='First'||c.label.startsWith('Sell ·'))).toBe(false);
 run.pauseState.set('details' as any,true);d.sheetKind='evolve';
 release(controls.find(c=>c.label==='×')!.box as any);
 expect(run.pauseState.has('details' as any)).toBe(false);expect(run.selectedTower).toBeNull();
});
it('details quote excludes only its own pause',()=>{
 const {run,loose}=autoScene();
 const p=loose as unknown as {detailsPurchaseContext():PurchaseContext;closeDetails():void};
 run.pauseState.set('details' as any,true);expect(p.detailsPurchaseContext().blocked).toBe(false);
 for(const reason of ['user','modal','background'] as const){
  run.pauseState.set(reason,true);expect(p.detailsPurchaseContext().blocked).toBe(true);run.pauseState.set(reason,false);
 }
 loose.refreshProgressionActions=()=>{throw Error('disposed panel');};
 run.pauseState.set('user',true);p.closeDetails();expect(run.pauseState.blocked).toBe(true);
 expect(loose.refreshProgressionActions).toBeNull();
 expect(run.pauseState.has('details' as any)).toBe(false);
});
it('detailed actions close before mutation and retain background block',()=>{
 const {run,loose}=autoScene();
 const p=loose as unknown as {performDetailedAction(fn:()=>boolean):void};
 run.pauseState.set('details' as any,true);
 let changed=false;p.performDetailedAction(()=>{expect(run.pauseState.blocked).toBe(false);changed=true;return true;});
 expect(changed).toBe(true);
 expect(loose.sheetKind).toBeNull();
 run.pauseState.set('background',true);changed=false;
 p.performDetailedAction(()=>{changed=true;return true;});expect(changed).toBe(false);
});
