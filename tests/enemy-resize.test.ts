import {expect,it,vi} from 'vitest';
vi.mock('phaser',()=>({default:{Scene:class{},Math:{Vector2:class{constructor(public x:number,public y:number){}}}}}));
import {GameScene} from '../src/game/scenes/GameScene.ts';
import {BattlefieldView} from '../src/game/ui/viewport.ts';
import {gameLayout} from '../src/game/ui/layout.ts';
it('reprojects existing regular enemies when switching viewport categories',()=>{
 const run=new GameScene() as any;run.layout=gameLayout(1440,900);run.cameraView=new BattlefieldView(run.layout.field);
 const data:Record<string,unknown>={enemyVisual:{atlas:'classic',frameRectangles:{right:[{width:28,height:28}],left:[]},sprite:{scaleX:1}}};
 const view:any={scaleX:1,getData:(k:string)=>data[k],setData:(v:any)=>{Object.assign(data,v);return view;},setScale:(x:number)=>{view.scaleX=x;return view;}};
 run.enemies=[{alive:true,isBoss:false,view}];run.projectEntity(view);expect(view.scaleX*run.cameraView.fitScale*28).toBeCloseTo(32);
 run.layout=gameLayout(390,844);run.cameraView.resize(run.layout.field);run.applyView();expect(view.scaleX*run.cameraView.fitScale*28).toBeCloseTo(28);
});
