import {vi} from 'vitest';
import type Phaser from 'phaser';
vi.mock('phaser',()=>({default:{Scene:class{constructor(_key?:string){}},Scenes:{Events:{SHUTDOWN:'shutdown'}},Scale:{Events:{RESIZE:'resize'}}}}));
import {EventEmitter} from 'node:events';
import {GameScene} from '../../src/game/scenes/GameScene.ts';
import {SoundManager} from '../../src/game/systems/SoundManager.ts';
import {AutoSystem,type AutoContext,type AutoRelicIntent} from '../../src/game/systems/AutoSystem.ts';
import type {RelicVault} from '../../src/game/systems/RunSimulation.ts';
import type {SiegeSystem} from '../../src/game/systems/SiegeSystem.ts';
import type {PauseState} from '../../src/game/systems/PauseState.ts';
import type {Tower} from '../../src/game/entities/Tower.ts';
import type {Enemy} from '../../src/game/entities/Enemy.ts';
import type {ScrollSheet} from '../../src/game/ui/ScrollSheet.ts';
import type {GameLayout} from '../../src/game/ui/layout.ts';
import type {button} from '../../src/game/ui/components.ts';
export interface AutoRun {
  auto:AutoSystem;vault:RelicVault;siege:SiegeSystem;pauseState:PauseState;
  runId:string;wave:number;wavesCompleted:number;waveActive:boolean;gold:number;lives:number;maxLives:number;gameTimeMs:number;
  towers:Tower[];enemies:Enemy[];selectedTower:Tower|null;placingTowerId:string|null;
  touchPreview:{point:{x:number;y:number};plot:number|null}|null;sheetKind:string|null;sheet:ScrollSheet|null;
  ended:boolean;debugAssisted:boolean;freezeUntil:number;battleCryUntil:number;surgeUntil:number;doubleBountyUntil:number;
  layout:GameLayout;scene:{start:ReturnType<typeof vi.fn>;restart:ReturnType<typeof vi.fn>};
  input:EventEmitter&{keyboard:EventEmitter};scheduledBossIds:Map<number,number>;
  autoSnapshot():AutoContext;setAutoEnabled(value:boolean):void;tickAuto(delta:number,waiting:boolean):void;
  performAutoRelic(intent:AutoRelicIntent,runId:string,revision:number):boolean;
  startNextWave(source?:'manual'|'auto',runId?:string,revision?:number):void;update(time:number,delta:number):void;updateHUD():void;
  presentReward():void;enterVictory():void;chooseVictory(action:'finish'|'continue'):void;cleanupProgression():void;
  nextWaveReason():string;drawTowerPanel():void;drawControls():void;drawSheet(offset?:number):void;detachInputListeners():void;
  autoButton:ReturnType<typeof button>|null;pauseAutoButton:ReturnType<typeof button>|null;autoDetailText:Phaser.GameObjects.Text|null;
  autoShortStatus():string;autoDetail():string;refreshAutoDisplay():void;handleAutoKey(event:KeyboardEvent):void;cancelGesture():void;
  startBtn:Phaser.GameObjects.Rectangle|null;
}
function chain():any {
  const p:any=new Proxy(function(){return p;},{get:(target,key)=>Reflect.has(target,key)?Reflect.get(target,key):key==='then'?undefined:key===Symbol.toPrimitive?()=>0:p,apply:()=>p});return p;
}
export function autoScene():{scene:GameScene;run:AutoRun;loose:Record<string,unknown>} {
  vi.spyOn(SoundManager,'get').mockReturnValue(chain());const scene=new GameScene();scene.init({difficulty:'medium'});
  const run=scene as unknown as AutoRun,loose=scene as unknown as Record<string,unknown>;
  for(const name of ['drawPowerupBar','drawSheet','refreshInfoPanel','refreshPlots','refreshPlacePanel','hideGhost','showTouchPreview',
    'floatText','floatTextForEnemy','impactAt','impactBurst','startDeathAnim','makeEnemyVisual','addEffect','drawCatalog','drawAchievementNotice',
    'updateBossBar','renderVictory','publishQAStatus','updateHUD'])loose[name]=vi.fn();
  loose.add=chain();loose.world=(v:unknown)=>v;loose.uiRoot=chain();loose.game=chain();loose.time=chain();loose.tweens=chain();
  run.input=Object.assign(new EventEmitter(),{keyboard:new EventEmitter()});run.scene={start:vi.fn(),restart:vi.fn()};
  return {scene,run,loose};
}
export class Display extends EventEmitter {
  text='';height=14;input={enabled:true};visible=true;
  setOrigin(){return this;}setStrokeStyle(){return this;}setInteractive(){return this;}setFillStyle(){return this;}
  setText(value:string){this.text=value;return this;}setWordWrapWidth(){return this;}setVisible(value:boolean){this.visible=value;return this;}
  setAlpha(){return this;}setColor(){return this;}
}
export function installButtons(loose:Record<string,unknown>):void {
  const add=chain();add.rectangle=()=>new Display();add.text=(_x:number,_y:number,value:string)=>{const d=new Display();d.text=value;return d;};loose.add=add;
}
export function release(box:Phaser.GameObjects.Rectangle):void {
  const p={id:1,x:10,y:10},event={stopPropagation(){}};
  box.emit('pointerdown',p,0,0,event);box.emit('pointerup',p,0,0,event);
}
