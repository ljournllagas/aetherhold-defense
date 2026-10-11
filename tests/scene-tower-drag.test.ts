import {afterEach,expect,it,vi} from 'vitest';
import {autoScene} from './helpers/autoScene.ts';
import {BattlefieldView} from '../src/game/ui/viewport.ts';
import {gameLayout} from '../src/game/ui/layout.ts';
type DragRun={beginTowerDrag(input:unknown,id:string):void;handlePointerMove(p:unknown):void;handlePointerUp(p:unknown):void;cameraView:BattlefieldView;map:{buildable:{x:number;y:number}[]};};
afterEach(()=>vi.restoreAllMocks());
it('valid drag commits once through the purchase path',()=>{
 const {run,loose}=autoScene();const d=loose as unknown as DragRun;
 run.layout=gameLayout(390,844);d.cameraView=new BattlefieldView(run.layout.field);
 const plot=d.map.buildable[0];const target=d.cameraView.project(plot);run.gold=1000;
 d.beginTowerDrag({id:1,point:{x:40,y:760},kind:'touch'},'longbow');
 d.handlePointerMove({id:1,x:target.x,y:target.y+48,wasTouch:true,isDown:true});
 d.handlePointerUp({id:1,x:target.x,y:target.y+48,wasTouch:true});
 expect(run.towers).toHaveLength(1);expect(run.gold).toBe(900);
 d.handlePointerUp({id:1,x:target.x,y:target.y+48,wasTouch:true});
 expect(run.towers).toHaveLength(1);expect(run.gold).toBe(900);
});
it('release over controls cancels even with an offset plot anchor',()=>{
 const {run,loose}=autoScene();const d=loose as unknown as DragRun;
 run.layout=gameLayout(390,844);d.cameraView=new BattlefieldView(run.layout.field);run.gold=1000;
 d.beginTowerDrag({id:1,point:{x:40,y:760},kind:'touch'},'longbow');
 d.handlePointerMove({id:1,x:100,y:720,wasTouch:true,isDown:true});
 d.handlePointerUp({id:1,x:100,y:740,wasTouch:true});
 expect(run.towers).toHaveLength(0);expect(run.gold).toBe(1000);
});
it.each(['user','background','modal'] as const)('paused %s drop never purchases',reason=>{
 const {run,loose}=autoScene();const d=loose as unknown as DragRun;
 run.layout=gameLayout(390,844);d.cameraView=new BattlefieldView(run.layout.field);run.gold=1000;
 const target=d.cameraView.project(d.map.buildable[0]);
 d.beginTowerDrag({id:1,point:{x:40,y:760},kind:'touch'},'longbow');
 d.handlePointerMove({id:1,x:target.x,y:target.y+48,wasTouch:true,isDown:true});run.pauseState.set(reason,true);
 d.handlePointerUp({id:1,x:target.x,y:target.y+48,wasTouch:true});
 expect(run.gold).toBe(1000);expect(run.towers).toHaveLength(0);
});
it('second finger cancels drop and cannot produce a tap',()=>{
 const {run,loose}=autoScene();const d=loose as unknown as DragRun&{handlePointerDown(p:unknown):void};
 run.layout=gameLayout(390,844);d.cameraView=new BattlefieldView(run.layout.field);run.gold=1000;
 d.beginTowerDrag({id:1,point:{x:40,y:760},kind:'touch'},'longbow');
 d.handlePointerDown({id:2,x:100,y:400,wasTouch:true});
 d.handlePointerUp({id:2,x:100,y:400,wasTouch:true});d.handlePointerUp({id:1,x:40,y:760,wasTouch:true});
 expect(run.placingTowerId).toBeNull();expect(run.gold).toBe(1000);expect(run.towers).toHaveLength(0);
});
