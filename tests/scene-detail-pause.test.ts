import {afterEach,expect,it,vi} from 'vitest';
import {autoScene} from './helpers/autoScene.ts';
import type {PurchaseContext} from '../src/game/systems/EvolutionSystem.ts';
afterEach(()=>vi.restoreAllMocks());
it('details quote excludes only its own pause',()=>{
 const {run,loose}=autoScene();
 const p=loose as unknown as {detailsPurchaseContext():PurchaseContext;closeDetails():void};
 run.pauseState.set('details' as any,true);expect(p.detailsPurchaseContext().blocked).toBe(false);
 for(const reason of ['user','modal','background'] as const){
  run.pauseState.set(reason,true);expect(p.detailsPurchaseContext().blocked).toBe(true);run.pauseState.set(reason,false);
 }
 run.pauseState.set('user',true);p.closeDetails();expect(run.pauseState.blocked).toBe(true);
 expect(run.pauseState.has('details' as any)).toBe(false);
});
it('detailed actions close before mutation and retain background block',()=>{
 const {run,loose}=autoScene();
 const p=loose as unknown as {performDetailedAction(fn:()=>void):void};
 run.pauseState.set('details' as any,true);
 let changed=false;p.performDetailedAction(()=>{expect(run.pauseState.blocked).toBe(false);changed=true;});
 expect(changed).toBe(true);
 run.pauseState.set('background',true);changed=false;
 p.performDetailedAction(()=>{changed=true;});expect(changed).toBe(false);
});
