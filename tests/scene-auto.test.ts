import { afterEach, it, expect, vi } from 'vitest';
import { autoScene, type AutoRun } from './helpers/autoScene.ts';
import { chooseAutoRelic } from '../src/game/systems/AutoSystem.ts';
import { Enemy } from '../src/game/entities/Enemy.ts';
import { Tower } from '../src/game/entities/Tower.ts';
import { GameScene } from '../src/game/scenes/GameScene.ts';
import type { ScrollSheet } from '../src/game/ui/ScrollSheet.ts';
afterEach(() => vi.restoreAllMocks());

function combat(run:AutoRun):void {
  run.siege.startWave(1);run.wave=1;run.waveActive=true;
  const e=new Enemy('thornling',1_000_000,0,8);e.x=300;e.y=300;run.enemies=[e];
  run.towers=[new Tower('longbow',300,300,0)];run.gameTimeMs=1000;
}
it('uses a later useful reward once and leaves a full-health repair waiting',()=>{
  const {run}=autoScene();run.setAutoEnabled(true);
  run.vault.offer('emergency_repair','old',true);run.vault.offer('gold_rush','new',true);
  const before=run.gold;run.tickAuto(0,false);
  expect(run.gold).toBe(before+120);
  expect(run.vault.pending).toEqual([{id:'emergency_repair',reason:'old',reveal:true}]);
  expect(run.debugAssisted).toBe(false);expect(run.waveActive).toBe(false);
});
it.each([1,2,3])('starts after real-time countdown at speed %i',(speed)=>{
  const {run,loose}=autoScene();loose.speed=speed;run.setAutoEnabled(true);
  run.tickAuto(0,true);run.tickAuto(4999,true);expect(run.waveActive).toBe(false);
  run.tickAuto(1,true);expect([run.wave,run.waveActive]).toEqual([1,true]);
});

it('rejects a stale vault, mode revision and previous-run ticket',()=>{
  const {run,scene}=autoScene();run.setAutoEnabled(true);
  run.vault.offer('gold_rush','first',false);run.vault.offer('gold_rush','second',false);
  const intent=chooseAutoRelic(run.autoSnapshot(),run.vault)!,id=run.runId,rev=run.auto.revision,gold=run.gold;
  run.vault.beginUse(0,true);expect(run.performAutoRelic(intent,id,rev)).toBe(false);expect(run.gold).toBe(gold);
  const next=chooseAutoRelic(run.autoSnapshot(),run.vault)!;run.setAutoEnabled(false);run.setAutoEnabled(true);
  expect(run.performAutoRelic(next,id,rev)).toBe(false);expect(run.vault.stored).toEqual(['gold_rush']);
  scene.init({difficulty:'medium'});run.setAutoEnabled(true);run.vault.offer('gold_rush','fresh',false);
  const fresh=chooseAutoRelic(run.autoSnapshot(),run.vault)!;
  expect(run.performAutoRelic(fresh,id,run.auto.revision)).toBe(false);expect(run.vault.stored).toEqual(['gold_rush']);
});
it('uses one relic per update without starving a due start, and preserves OFF/manual blocking',()=>{
  const {run}=autoScene();run.setAutoEnabled(true);run.tickAuto(0,true);
  run.vault.offer('gold_rush','one',true);run.vault.offer('gold_rush','two',true);
  const gold=run.gold;run.tickAuto(5000,true);
  expect(run.gold).toBe(gold+120);expect(run.vault.pending.map(r=>r.id)).toEqual(['gold_rush']);expect(run.wave).toBe(1);
  const off=autoScene().run;off.vault.offer('emergency_repair','held',true);off.startNextWave();expect(off.waveActive).toBe(false);
});
it('manual Start wins once and rejected Auto starts remain due',()=>{
  const {run}=autoScene();run.setAutoEnabled(true);run.tickAuto(0,true);run.tickAuto(2000,true);run.startNextWave();
  run.tickAuto(9000,true);expect([run.wave,run.waveActive]).toEqual([1,true]);
  const other=autoScene().run;other.setAutoEnabled(true);other.tickAuto(0,true);
  const reject=vi.spyOn(other.siege,'startWave').mockReturnValue(false);other.tickAuto(5000,true);expect(other.auto.remainingMs).toBe(0);
  reject.mockRestore();other.tickAuto(0,true);expect(other.wave).toBe(1);
});
it('an authoritative clear receives its full new countdown',()=>{
  const {run}=autoScene();run.setAutoEnabled(true);run.siege.startWave(1);run.wave=1;run.waveActive=true;
  run.tickAuto(9000,false);expect(run.wavesCompleted).toBe(1);expect(run.auto.remainingMs).toBe(5000);expect(run.wave).toBe(1);
});
it.each(['user','modal','background'] as const)('suspends %s between updates without spending its interval',(reason)=>{
  const {run}=autoScene();run.setAutoEnabled(true);run.tickAuto(0,true);run.tickAuto(2000,true);
  run.pauseState.set(reason,true);(GameScene.prototype as unknown as {updateHUD():void}).updateHUD.call(run);
  run.pauseState.set(reason,false);run.tickAuto(9000,true);expect(run.auto.remainingMs).toBe(3000);
});
it('respects a manual reservation, then clears all countdown state on cleanup',()=>{
  const {run}=autoScene();run.setAutoEnabled(true);run.tickAuto(0,true);run.tickAuto(2000,true);
  run.vault.offer('meteor_strike','manual',false);run.vault.offer('gold_rush','later',true);run.vault.beginUse(0,true);
  const target=run.vault.target,gold=run.gold;run.tickAuto(9000,true);
  expect(run.vault.target).toBe(target);expect(run.gold).toBe(gold);expect(run.auto.remainingMs).toBe(3000);
  run.cleanupProgression();expect(run.auto.enabled).toBe(false);expect(run.auto.remainingMs).toBeNull();
});
it.each([
  ['time_freeze','freezeUntil',5000],['battle_cry','battleCryUntil',11000],
  ['arcane_surge','surgeUntil',13000],['double_bounty','doubleBountyUntil',21000]
] as const)('uses the actual %s deadline once',(id,field,deadline)=>{
  const {run}=autoScene();combat(run);run.setAutoEnabled(true);run.vault.offer(id,'fixture',false);
  run.tickAuto(0,false);expect(run[field]).toBe(deadline);expect(run.vault.stored).toEqual([]);
  run.vault.offer(id,'duplicate',false);run.tickAuto(0,false);expect(run[field]).toBe(deadline);expect(run.vault.stored).toEqual([id]);
});
it('applies real repair, random Overcharge and one Pilferer without duplicates',()=>{
  const repair=autoScene().run;repair.lives=19;repair.setAutoEnabled(true);repair.vault.offer('emergency_repair','fix',false);
  repair.tickAuto(0,true);expect(repair.lives).toBe(20);
  const over=autoScene().run;combat(over);over.setAutoEnabled(true);over.vault.offer('tower_overcharge','one',false);
  over.tickAuto(0,false);expect(over.towers[0].overchargeUntil).toBe(16000);
  const treasure=autoScene().run;combat(treasure);treasure.setAutoEnabled(true);treasure.vault.offer('treasure_goblin','one',false);
  treasure.tickAuto(0,false);expect(treasure.enemies.filter(e=>e.alive&&e.archetype==='pilferer')).toHaveLength(1);
  treasure.vault.offer('treasure_goblin','two',false);treasure.tickAuto(0,false);
  expect(treasure.enemies.filter(e=>e.alive&&e.archetype==='pilferer')).toHaveLength(1);expect(treasure.vault.stored).toEqual(['treasure_goblin']);
});
it.each([0.1,0.5,0.9])('keeps the existing Blessing outcome for roll %s',(roll)=>{
  const {run}=autoScene();combat(run);run.lives=16;run.setAutoEnabled(true);run.vault.offer('ancient_blessing','gift',false);
  const gold=run.gold;vi.spyOn(Math,'random').mockReturnValue(roll);run.tickAuto(0,false);
  expect([run.gold,run.lives,run.surgeUntil]).toEqual(roll===0.1?[gold+160,16,0]:roll===0.5?[gold,18,0]:[gold,16,13000]);
  expect(run.vault.stored).toEqual([]);
});
it('Auto Meteor deals real damage once without closing a build/tower preview',()=>{
  const {run}=autoScene();combat(run);vi.spyOn(Math,'random').mockReturnValue(0.99);
  run.enemies=[300,310,320].map(x=>{const e=new Enemy('thornling',1,0,8);e.x=x;e.y=300;return e;});
  run.selectedTower=run.towers[0];run.placingTowerId='longbow';const preview={point:{x:100,y:100},plot:1};run.touchPreview=preview;
  run.sheetKind='evolve';const sheet={scrollOffset:40} as unknown as ScrollSheet;run.sheet=sheet;
  run.setAutoEnabled(true);run.vault.offer('meteor_strike','blast',true);run.tickAuto(0,false);
  expect(run.enemies.every(e=>!e.alive)).toBe(true);expect(run.vault.target).toBeNull();
  expect([run.selectedTower,run.placingTowerId,run.touchPreview,run.sheetKind,run.sheet]).toEqual([run.towers[0],'longbow',preview,'evolve',sheet]);
  expect(run.debugAssisted).toBe(false);
});
it('a last wave-30 boss kill becomes victory before any next relic/start',()=>{
  const {run}=autoScene();run.siege.seedForQA(29,1);run.siege.startWave(30);run.wave=30;run.waveActive=true;
  const boss=new Enemy('warlord',1,0,150);boss.x=300;boss.y=300;run.enemies=[boss];run.scheduledBossIds.set(boss.id,30);
  run.setAutoEnabled(true);run.auto.remainingMs=0;run.vault.offer('meteor_strike','boss',true);run.vault.offer('gold_rush','later',true);
  run.tickAuto(9000,false);expect(run.siege.phase).toBe('victory');expect(run.wave).toBe(30);
  expect(run.vault.pending.some(r=>r.id==='gold_rush')).toBe(true);expect(run.auto.remainingMs).toBeNull();
});
it.each(['finish','continue'] as const)('lets ON %s retain a large queue while OFF still blocks',(action)=>{
  const {run}=autoScene();run.siege.seedForQA(30,5,'victory');run.wave=30;run.wavesCompleted=30;
  for(let i=0;i<20;i++)run.vault.offer('emergency_repair',`held ${i}`,true);
  run.chooseVictory(action);expect(run.siege.phase).toBe('victory');
  run.setAutoEnabled(true);run.chooseVictory(action);
  expect(run.siege.phase).toBe(action==='finish'?'terminal':'endless');
  expect(run.vault.pending).toHaveLength(20);
  if(action==='continue'){expect(run.auto.enabled).toBe(true);run.tickAuto(0,true);expect(run.auto.remainingMs).toBe(5000);expect(run.scene.start).not.toHaveBeenCalled();}
  else expect(run.scene.start).toHaveBeenCalledWith('GameOver',expect.objectContaining({outcome:'victory',highestWave:30}));
});
