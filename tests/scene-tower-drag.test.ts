import {afterEach,expect,it,vi} from 'vitest';
import {autoScene} from './helpers/autoScene.ts';
import {BattlefieldView} from '../src/game/ui/viewport.ts';
import {gameLayout} from '../src/game/ui/layout.ts';
import {button} from '../src/game/ui/components.ts';
import {installButtons} from './helpers/autoScene.ts';
type DragRun={beginTowerDrag(input:unknown,id:string):void;handlePointerMove(p:unknown):void;handlePointerUp(p:unknown):void;cameraView:BattlefieldView;map:{buildable:{x:number;y:number}[]};};
afterEach(()=>vi.restoreAllMocks());
it.each(['escape','details','pause','second-card','battlefield-first','control'] as const)('%s cancels the entire placement transaction',kind=>{
 const {scene,run,loose}=autoScene();const d=loose as any;
 run.layout=gameLayout(390,844);d.cameraView=new BattlefieldView(run.layout.field);run.gold=1000;
 const target=d.cameraView.project(d.map.buildable[0]);
 const start={id:1,point:{x:40,y:760},kind:'touch'};
 if(kind==='battlefield-first')d.handlePointerDown({id:2,x:100,y:400,wasTouch:true});
 d.beginTowerDrag(start,'longbow');d.handlePointerMove({id:1,x:target.x,y:target.y+48,wasTouch:true,isDown:true});
 if(kind==='escape')d.onEscape();
 if(kind==='details')d.openDetails('help');
 if(kind==='pause'){d.togglePauseMenu();d.togglePauseMenu();}
 if(kind==='second-card')d.beginTowerDrag({id:2,point:{x:140,y:760},kind:'touch'},'cannon');
 if(kind==='control'){installButtons(loose);run.input.on('control:pointerdown',d.handleControlDown??(()=>{}));const b=button(scene,d.uiRoot,0,0,80,'Pause',()=>{});b.box.emit('pointerdown',{id:2,x:10,y:10},0,0,{stopPropagation(){}});}
 d.handlePointerUp({id:1,x:target.x,y:target.y+48,wasTouch:true});d.handlePointerUp({id:2,x:140,y:760,wasTouch:true});
 expect(run.gold).toBe(1000);expect(run.towers).toHaveLength(0);expect(d.trayOwner).toBeNull();expect(d.trayDrag).toBeNull();
});
it('a button release reaches scene cancellation without activating the button',()=>{
 const {scene,run,loose}=autoScene();const d=loose as any;installButtons(loose);
 run.layout=gameLayout(390,844);d.cameraView=new BattlefieldView(run.layout.field);run.gold=1000;
 const action=vi.fn(),b=button(scene,d.uiRoot,0,0,80,'Pause',action);
 d.beginTowerDrag({id:1,point:{x:40,y:760},kind:'mouse'},'longbow');d.handlePointerMove({id:1,x:120,y:200,isDown:true});
 let stopped=false;const p={id:1,x:10,y:60};b.box.emit('pointerup',p,0,0,{stopPropagation(){stopped=true;}});
 if(!stopped)d.handlePointerUp(p);
 expect(action).not.toHaveBeenCalled();expect(d.trayOwner).toBeNull();expect(d.trayDrag).toBeNull();expect(run.gold).toBe(1000);
});
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
it('keyboard tap alternative requires a plot and commits only once',()=>{
 const {run,loose}=autoScene();
 const d=loose as unknown as {handleBuildKey(e:KeyboardEvent):void};run.gold=1000;
 const key=(key:string)=>d.handleBuildKey({key,repeat:false,preventDefault(){}} as KeyboardEvent);
 key('1');key('Enter');expect(run.gold).toBe(1000);
 key('ArrowRight');key('Enter');expect(run.gold).toBe(900);expect(run.towers).toHaveLength(1);
 key('Enter');expect(run.gold).toBe(900);
});
