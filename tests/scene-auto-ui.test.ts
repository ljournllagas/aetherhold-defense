import { afterEach, it, expect, vi } from 'vitest';
import { autoScene, Display, installButtons, release } from './helpers/autoScene.ts';
import { GameScene } from '../src/game/scenes/GameScene.ts';
import { gameLayout } from '../src/game/ui/layout.ts';
import type { ScrollSheet } from '../src/game/ui/ScrollSheet.ts';
import type { QAStatus } from '../src/game/qa.ts';
afterEach(() => vi.restoreAllMocks());

it('keeps exact compact HUD values available in the live More detail after status refresh',()=>{
  const {run,loose}=autoScene();run.layout=gameLayout(844,390);run.gold=987654321;
  loose.scoreSoFar=()=>123456789;
  const detail=new Display();loose.autoDetailText=detail;run.sheetKind='more';run.sheet={scrollOffset:40} as unknown as ScrollSheet;
  run.refreshAutoDisplay();
  expect(detail.text).toContain('Gold 987,654,321');expect(detail.text).toContain('Score 123,456,789');
  expect(detail.text).toContain(`Lives ${run.lives}/${run.maxLives}`);expect(run.sheet.scrollOffset).toBe(40);
});

it('does not toggle again when Phaser replays an older keydown from its frame queue', () => {
  const { run } = autoScene();
  const press = { repeat: false, target: null, timeStamp: 100 } as KeyboardEvent;
  run.handleAutoKey(press); expect(run.auto.enabled).toBe(true);
  run.handleAutoKey({ ...press, repeat: true, timeStamp: 101 } as KeyboardEvent);
  run.handleAutoKey(press); expect(run.auto.enabled).toBe(true);
  run.handleAutoKey({ ...press, timeStamp: 102 } as KeyboardEvent); expect(run.auto.enabled).toBe(false);
  run.handleAutoKey(press); expect(run.auto.enabled).toBe(false);
});

it('ignores repeats/editable targets, and the Auto key never starts a wave directly',()=>{
  const {run}=autoScene();
  const key=(patch:Partial<KeyboardEvent>={})=>({repeat:false,target:null,...patch} as KeyboardEvent);
  run.handleAutoKey(key({repeat:true}));expect(run.auto.enabled).toBe(false);
  run.handleAutoKey(key({target:{tagName:'INPUT'} as unknown as EventTarget}));expect(run.auto.enabled).toBe(false);
  run.handleAutoKey(key({target:{isContentEditable:true} as unknown as EventTarget}));expect(run.auto.enabled).toBe(false);
  run.handleAutoKey(key());expect(run.auto.enabled).toBe(true);expect(run.waveActive).toBe(false);
});
it('disables while paused without resuming or consuming',()=>{
  const {run}=autoScene();run.setAutoEnabled(true);run.pauseState.set('user',true);
  run.vault.offer('gold_rush','held',true);run.handleAutoKey({repeat:false,target:null} as KeyboardEvent);
  expect(run.auto.enabled).toBe(false);expect(run.pauseState.has('user')).toBe(true);
  expect(run.vault.pending.map(r=>r.id)).toEqual(['gold_rush']);
});

it('compact Start skips the countdown with retained rewards instead of opening Next Wave',()=>{
  const {run,loose}=autoScene();installButtons(loose);run.layout=gameLayout(390,844);
  run.setAutoEnabled(true);run.tickAuto(0,true);run.vault.offer('emergency_repair','held',true);
  run.drawTowerPanel();release(run.startBtn!);expect([run.wave,run.waveActive]).toEqual([1,true]);
  expect(run.sheetKind).not.toBe('next');
  expect(run.nextWaveReason()).toContain('Finish this wave');
  const off=autoScene().run;off.vault.offer('emergency_repair','held',true);expect(off.nextWaveReason()).toContain('Resolve the pending reward');
});
it('live More detail reflects mode, waiting state and queued count without losing scroll',()=>{
  const {run,loose}=autoScene();const detail=new Display();loose.autoDetailText=detail;
  run.sheetKind='more';const sheet={scrollOffset:40} as unknown as ScrollSheet;run.sheet=sheet;
  run.auto.setEnabled(true);run.vault.offer('emergency_repair','one',true);run.refreshAutoDisplay();
  expect(detail.text).toContain('Auto ON');expect(detail.text).toContain('1 queued');expect(run.sheet).toBe(sheet);
  run.vault.offer('meteor_strike','two',true);run.vault.beginSelectedUse({source:'pending',index:1,id:'meteor_strike',revision:run.vault.revision},true);
  run.refreshAutoDisplay();expect(detail.text).toContain('Wait target');expect(detail.text).toContain('2 queued');expect(run.sheet!.scrollOffset).toBe(40);
  run.vault.cancelTarget();run.auto.setEnabled(false);run.refreshAutoDisplay();expect(detail.text).toContain('Auto OFF');
});
it('reflows wrapped live text at its preserved offset and forgets destroyed text',()=>{
  const {run,loose}=autoScene();const detail=new Display();
  detail.setText=(value:string)=>{detail.text=value;detail.height=28;return detail;};loose.autoDetailText=detail;
  run.sheetKind='more';run.sheet={scrollOffset:40} as unknown as ScrollSheet;
  const redraw=vi.fn();loose.drawSheet=redraw;run.auto.setEnabled(true);run.refreshAutoDisplay();expect(redraw).toHaveBeenCalledWith(40);
  loose.autoDetailText=null;run.sheet=null;redraw.mockClear();run.refreshAutoDisplay();expect(redraw).not.toHaveBeenCalled();
});
it('displays each blocking state and rounds the countdown up',()=>{
  const {run,loose}=autoScene();expect(run.autoShortStatus()).toBe('');run.auto.setEnabled(true);
  run.auto.remainingMs=1001;expect(run.autoShortStatus()).toBe('2s');
  run.pauseState.set('user',true);expect(run.autoShortStatus()).toBe('Paused');run.pauseState.set('user',false);
  loose.modal={};expect(run.autoShortStatus()).toBe('Wait dialog');loose.modal=null;
  run.siege.seedForQA(30,5,'victory');expect(run.autoShortStatus()).toBe('Victory');
  const rev=run.auto.revision;run.ended=true;run.handleAutoKey({repeat:false,target:null} as KeyboardEvent);expect(run.auto.revision).toBe(rev);
});
it('house Auto button respects drag, pointerout and cancellation',()=>{
  const {run,loose}=autoScene();installButtons(loose);run.drawControls();const box=run.autoButton!.box;
  const down={id:1,x:10,y:10},event={stopPropagation(){}};
  box.emit('pointerdown',down,0,0,event);run.cancelGesture();box.emit('pointerup',down,0,0,event);expect(run.auto.enabled).toBe(false);
  box.emit('pointerdown',down,0,0,event);box.emit('pointerup',{...down,x:30},0,0,event);expect(run.auto.enabled).toBe(false);
  box.emit('pointerdown',down,0,0,event);box.emit('pointerout');box.emit('pointerup',down,0,0,event);expect(run.auto.enabled).toBe(false);
  release(box);expect(run.auto.enabled).toBe(true);
});
it.each([
  {width:390,height:844,labels:['Overview','Auto OFF','1×','Pause'],bounds:[[8,54,90.5,44],[102.5,54,90.5,44],[197,54,90.5,44],[291.5,54,90.5,44]]},
  {width:1280,height:720,labels:['Auto OFF','1×','Pause','Overview'],bounds:[[1032,6,88,44],[1128,6,64,44],[1200,6,68,44],[936,6,88,44]]}
])('keeps direct speed controls reachable at $width×$height without overlap',({width,height,labels:expectedLabels,bounds})=>{
  const {run,loose}=autoScene();run.layout=gameLayout(width,height);
  type PlacedDisplay=Display&{x:number;y:number;width:number;height:number};
  const boxes:PlacedDisplay[]=[],labels:Display[]=[];
  loose.add={
    rectangle:(x:number,y:number,width:number,height:number)=>{
      const box=Object.assign(new Display(),{x,y,width,height});boxes.push(box);return box;
    },
    text:(x:number,y:number,value:string)=>{
      const label=Object.assign(new Display(),{x,y});label.text=value;labels.push(label);return label;
    }
  };
  run.drawControls();
  const controls=boxes.map((box,index)=>({box,label:labels[index]}));
  expect(controls.map(control=>control.label.text)).toEqual(expectedLabels);
  expect(controls.map(({box})=>[box.x,box.y,box.width,box.height])).toEqual(bounds);
  const leftToRight=[...controls].sort((a,b)=>a.box.x-b.box.x);
  for(let index=0;index<leftToRight.length;index++){
    const {box}=leftToRight[index];
    expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(width);
    if(index>0)expect(leftToRight[index-1].box.x+leftToRight[index-1].box.width).toBeLessThanOrEqual(box.x);
  }
  const speed=controls.find(control=>control.label.text==='1×')!;
  expect(loose.speed).toBe(1);
  release(speed.box as never);expect([loose.speed,speed.label.text]).toEqual([2,'2×']);
  release(speed.box as never);expect([loose.speed,speed.label.text]).toEqual([3,'3×']);
  release(speed.box as never);expect([loose.speed,speed.label.text]).toEqual([1,'1×']);
});

it('keeps compact landscape header clear of a 10,000,000 score and cycles speed through the native More menu',()=>{
  const {run,loose}=autoScene();run.layout=gameLayout(844,390);
  class LayoutDisplay extends Display {
    x=0;y=0;width=0;height=14;type='Text';input={enabled:true};
    setCrop(){return this;}
    setDisplaySize(width:number,height:number){this.width=width;this.height=height;return this;}
  }
  class LayoutContainer {
    x:number;y:number;list:any[]=[];private data=new Map<string,unknown>();
    constructor(x=0,y=0){this.x=x;this.y=y;}
    add(children:any|any[]){this.list.push(...(Array.isArray(children)?children:[children]));return this;}
    getWorldTransformMatrix(){return {tx:this.x,ty:this.y};}
    setData(key:string,value:unknown){this.data.set(key,value);return this;}
    getData(key:string){return this.data.get(key);}
    setPosition(x:number,y:number){this.x=x;this.y=y;return this;}
    setScale(){return this;}
    sort(){return this;}
    removeAll(){this.list=[];return this;}
    destroy(){this.list=[];return this;}
  }
  type Box=LayoutDisplay&{x:number;y:number;width:number;height:number};
  const boxes:Box[]=[],labels:LayoutDisplay[]=[];
  const graphics=()=>new Proxy(function(){return graphics();},{
    get:(_target,key)=>key==='then'?undefined:key===Symbol.toPrimitive?()=>0:graphics,
    apply:()=>graphics()
  });
  loose.add={
    rectangle:(x:number,y:number,width:number,height:number)=>{const box=Object.assign(new LayoutDisplay(),{x,y,width,height,type:'Rectangle'});boxes.push(box);return box;},
    text:(x:number,y:number,value:string)=>{const label=Object.assign(new LayoutDisplay(),{x,y,text:value});labels.push(label);return label;},
    container:(x:number,y:number)=>new LayoutContainer(x,y),
    image:(x:number,y:number)=>Object.assign(new LayoutDisplay(),{x,y,type:'Image'}),
    graphics
  };
  loose.uiRoot=new LayoutContainer();
  loose.game={canvas:{addEventListener:vi.fn(),removeEventListener:vi.fn()}};
  const drawHud=(GameScene.prototype as unknown as {drawHUD():void}).drawHUD;
  drawHud.call(run);
  const score=loose.hudScoreValue as LayoutDisplay;
  score.setText('10,000,000');
  const highScoreBounds={left:440,right:584};

  run.drawControls();
  expect(boxes.slice(-3).map(({x,y,width,height})=>[x,y,width,height])).toEqual([
    [716,4,56,44],[776,4,60,44],[652,4,60,44]
  ]);
  expect(labels.slice(-3).map(label=>label.text)).toEqual(['1×','II','Fit']);
  expect(loose.speedBtnLabel).not.toBeNull();
  expect(boxes.slice(-3).every(box=>box.x>=highScoreBounds.right||box.x+box.width<=highScoreBounds.left)).toBe(true);

  const drawSheet=(GameScene.prototype as unknown as {drawSheet(offset?:number):void}).drawSheet;
  const openSheet=(GameScene.prototype as unknown as {openSheet(kind:'more'):void}).openSheet;
  loose.drawSheet=drawSheet.bind(run);
  openSheet.call(run,'more');
  const clickSpeed=(expected:number)=>{
    const label=[...labels].reverse().find(candidate=>candidate.text===`Speed ${expected}×`)!;
    expect(label).toBeDefined();
    const box=boxes.find(candidate=>Math.abs(candidate.x+candidate.width/2-label.x)<1&&Math.abs(candidate.y+candidate.height/2-label.y)<1)!;
    expect(box.input.enabled).toBe(true);
    release(box as never);
    expect(loose.speed).toBe(expected===3?1:expected+1);
  };
  (run.sheet as unknown as ScrollSheet).scrollTo(364);
  clickSpeed(1);
  (run.sheet as unknown as ScrollSheet).scrollTo(364);
  clickSpeed(2);
  (run.sheet as unknown as ScrollSheet).scrollTo(364);
  clickSpeed(3);
});
it('detach removes the Auto handler; replay attachment is verified in the real browser',()=>{
  const {run}=autoScene();run.input.keyboard.on('keydown-A',run.handleAutoKey);
  expect(run.input.keyboard.listenerCount('keydown-A')).toBe(1);run.detachInputListeners();
  expect(run.input.keyboard.listenerCount('keydown-A')).toBe(0);run.input.keyboard.emit('keydown-A',{repeat:false,target:null});expect(run.auto.enabled).toBe(false);
});

it('publishes actual Auto state without changing debug assistance',()=>{
  const {run,loose}=autoScene(),emit=vi.fn(),debug=run.debugAssisted;
  loose.events={emit};loose.tweens={getTweens:()=>[]};
  const methods=GameScene.prototype as unknown as {publishQAStatus():void;updateHUD():void};
  loose.publishQAStatus=methods.publishQAStatus;loose.updateHUD=methods.updateHUD;
  run.setAutoEnabled(true);
  const status=emit.mock.calls[emit.mock.calls.length-1][1] as QAStatus;
  expect(status.autoEnabled).toBe(true);expect(status.autoRemainingMs).toBeNull();expect(status.debugAssisted).toBe(debug);
});
