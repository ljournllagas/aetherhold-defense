import { afterEach, it, expect, vi } from 'vitest';
import { autoScene, Display, installButtons, release } from './helpers/autoScene.ts';
import { GameScene } from '../src/game/scenes/GameScene.ts';
import { gameLayout } from '../src/game/ui/layout.ts';
import type { ScrollSheet } from '../src/game/ui/ScrollSheet.ts';
import type { QAStatus } from '../src/game/qa.ts';
afterEach(() => vi.restoreAllMocks());

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
