import {expect,it} from 'vitest';
import {TowerTrayGesture,edgePan} from '../src/game/systems/TowerTrayGesture.ts';
it('horizontal scroll never turns into a purchase',()=>{
 const g=new TowerTrayGesture();g.down({id:1,kind:'touch',point:{x:80,y:600}},'longbow');
 expect(g.move({id:1,kind:'touch',point:{x:100,y:599}})?.type).toBe('scroll');
 expect(g.move({id:1,kind:'touch',point:{x:100,y:400}})?.type).toBe('scroll');
 expect(g.up({id:1,kind:'touch',point:{x:100,y:400}})).toBeNull();
});
it('drag cancels without a phantom release',()=>{
 const g=new TowerTrayGesture();g.down({id:1,kind:'touch',point:{x:80,y:600}},'longbow');
 expect(g.move({id:1,kind:'touch',point:{x:80,y:580}})).toMatchObject({type:'drag',anchor:{x:80,y:532}});
 g.cancel();expect(g.up({id:1,kind:'touch',point:{x:80,y:400}})).toBeNull();
});
it('second contact suppresses both releases',()=>{
 const g=new TowerTrayGesture();g.down({id:1,kind:'touch',point:{x:80,y:600}},'longbow');
 g.down({id:2,kind:'touch',point:{x:100,y:600}},'longbow');
 expect(g.up({id:2,kind:'touch',point:{x:100,y:600}})).toBeNull();
 expect(g.up({id:1,kind:'touch',point:{x:80,y:600}})).toBeNull();
});
it('tap selects, mouse drags without offset and duplicate release is ignored',()=>{
 const g=new TowerTrayGesture();g.down({id:1,kind:'touch',point:{x:80,y:600}},'longbow');
 expect(g.up({id:1,kind:'touch',point:{x:85,y:600}})).toEqual({type:'select',towerId:'longbow'});
 g.down({id:2,kind:'mouse',point:{x:80,y:600}},'longbow');
 expect(g.move({id:2,kind:'mouse',point:{x:90,y:600}})).toMatchObject({type:'drag',anchor:{x:90,y:600}});
 expect(g.up({id:2,kind:'mouse',point:{x:90,y:400}})?.type).toBe('drop');
 expect(g.up({id:2,kind:'mouse',point:{x:90,y:400}})).toBeNull();
});
it('downward touch motion cancels and exact threshold remains undecided',()=>{
 const g=new TowerTrayGesture();g.down({id:1,kind:'touch',point:{x:80,y:600}},'longbow');
 expect(g.move({id:1,kind:'touch',point:{x:80,y:590}})).toBeNull();
 expect(g.move({id:1,kind:'touch',point:{x:80,y:620}})?.type).toBe('cancel');
 expect(g.up({id:1,kind:'touch',point:{x:80,y:620}})).toBeNull();
});
it('pans only inside the battlefield and outside controls',()=>{
 const f={x:0,y:0,width:300,height:200};
 expect(edgePan({x:0,y:100},f,false)).toEqual({x:180,y:0});
 expect(edgePan({x:16,y:100},f,false)).toEqual({x:90,y:0});
 expect(edgePan({x:150,y:16},f,false)).toEqual({x:0,y:90});
 expect(edgePan({x:299,y:199},f,false)).toEqual({x:-174.375,y:-174.375});
 expect(edgePan({x:-1,y:100},f,false)).toEqual({x:0,y:0});
 expect(edgePan({x:0,y:100},f,true)).toEqual({x:0,y:0});
});
