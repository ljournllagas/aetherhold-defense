import { it, expect } from 'vitest';
import { AutoSystem, chooseAutoRelic, chooseAutoMeteorTarget, type AutoContext, type AutoEnemy } from '../src/game/systems/AutoSystem.ts';
import { RelicVault } from '../src/game/systems/RunSimulation.ts';
import type { PowerUpId } from '../src/shared/types.ts';

const enemy=(id=1,x=0,y=0,isBoss=false):AutoEnemy=>({id,x,y,isBoss,alive:true,archetype:isBoss?'warlord':'thornling'});
const context=(patch:Partial<AutoContext>={}):AutoContext=>({
  phase:'siege',wave:1,waveActive:true,blocked:false,nowMs:1000,lives:20,maxLives:20,
  enemies:[enemy()],towers:[{overchargeUntil:0}],freezeUntil:0,battleCryUntil:0,
  surgeUntil:0,doubleBountyUntil:0,...patch
});
it('starts OFF and requires 5000 eligible milliseconds after arming',()=>{
  const a=new AutoSystem(),s=context({waveActive:false});
  expect(a.enabled).toBe(false); expect(a.advance(9000,s)).toBe(false);
  a.setEnabled(true); expect(a.advance(9000,s)).toBe(false); expect(a.remainingMs).toBe(5000);
  expect(a.advance(4999,s)).toBe(false); expect(a.remainingMs).toBe(1);
  expect(a.advance(1,s)).toBe(true); expect(a.remainingMs).toBe(0);
});
it('does not charge a suspended interval and preserves the remainder',()=>{
  const a=new AutoSystem(),s=context({waveActive:false});a.setEnabled(true);a.advance(0,s);a.advance(2000,s);
  a.suspend(); expect(a.advance(8000,s)).toBe(false);expect(a.remainingMs).toBe(3000);
  a.advance(3000,s);expect(a.remainingMs).toBe(0);
});

const rows:Array<[PowerUpId,Partial<AutoContext>,Partial<AutoContext>]>= [
  ['gold_rush',{}, {blocked:true}],
  ['emergency_repair',{lives:19}, {lives:20}],
  ['meteor_strike',{enemies:[enemy(1),enemy(2,20),enemy(3,40)]},{enemies:[enemy(1),enemy(2,20)]}],
  ['time_freeze',{freezeUntil:1000},{freezeUntil:1001}],
  ['battle_cry',{battleCryUntil:1000},{battleCryUntil:1001}],
  ['arcane_surge',{surgeUntil:1000},{surgeUntil:1001}],
  ['double_bounty',{doubleBountyUntil:1000},{doubleBountyUntil:1001}],
  ['tower_overcharge',{towers:[{overchargeUntil:1000}]},{towers:[{overchargeUntil:1001}]}],
  ['treasure_goblin',{}, {enemies:[{...enemy(),archetype:'pilferer'}]}],
  ['ancient_blessing',{lives:19},{lives:20}]
];
it.each(rows)('checks %s eligibility',(id,good,bad)=>{
  const v=new RelicVault();v.offer(id,'fixture',false);
  expect(chooseAutoRelic(context(good),v)?.id).toBe(id);
  expect(chooseAutoRelic(context(bad),v)).toBeNull();
});

it.each([-1,NaN,Infinity])('does not charge invalid delta %s',(delta)=>{
  const a=new AutoSystem(),s=context({waveActive:false});a.setEnabled(true);a.advance(0,s);
  expect(a.advance(delta,s)).toBe(false);expect(a.remainingMs).toBe(5000);
});
it('keeps a due request through blockage and resets for wave/phase/OFF transitions',()=>{
  const a=new AutoSystem(),s=context({waveActive:false});a.setEnabled(true);a.advance(0,s);
  for(const delta of [1200,800,2999])expect(a.advance(delta,s)).toBe(false);
  expect(a.advance(1,s)).toBe(true);
  expect(a.advance(9000,{...s,blocked:true})).toBe(false);expect(a.remainingMs).toBe(0);
  expect(a.advance(0,s)).toBe(true);
  a.advance(0,{...s,waveActive:true});expect(a.remainingMs).toBeNull();
  expect(a.advance(9999,{...s,wave:2})).toBe(false);expect(a.remainingMs).toBe(5000);
  const rev=a.revision;a.setEnabled(false);a.setEnabled(true);expect(a.revision).toBe(rev+2);
  expect(a.remainingMs).toBeNull();a.advance(0,s);
  for(const phase of ['victory','terminal'] as const){a.advance(0,{...s,phase});expect(a.remainingMs).toBeNull();}
  a.reset();expect(a.enabled).toBe(false);expect(a.remainingMs).toBeNull();
});
it.each(rows.map(([id])=>id))('blocks %s in nonplayable contexts and classifies combat/towers',(id)=>{
  const v=new RelicVault();v.offer(id,'fixture',false);
  const capable=context({lives:19,enemies:[enemy(1),enemy(2,20),enemy(3,40)]});
  expect(chooseAutoRelic(capable,v)?.id).toBe(id);
  for(const patch of [{blocked:true},{phase:'victory' as const},{phase:'terminal' as const}])expect(chooseAutoRelic({...capable,...patch},v)).toBeNull();
  const preparation=chooseAutoRelic({...capable,waveActive:false,enemies:[]},v);
  expect(preparation?.id??null).toBe(['gold_rush','emergency_repair'].includes(id)?id:null);
  const noTower=chooseAutoRelic({...capable,towers:[]},v);
  expect(noTower?.id??null).toBe(['gold_rush','emergency_repair','meteor_strike','time_freeze','double_bounty'].includes(id)?id:null);
});
it('allows independent buffs and checks every Blessing prerequisite',()=>{
  const v=new RelicVault();v.offer('arcane_surge','independent',false);
  expect(chooseAutoRelic(context({battleCryUntil:9000}),v)?.id).toBe('arcane_surge');
  const b=new RelicVault();b.offer('ancient_blessing','held',false);
  const good=context({lives:19});expect(chooseAutoRelic(good,b)?.id).toBe('ancient_blessing');
  for(const patch of [{lives:20},{towers:[]},{waveActive:false},{enemies:[]},{surgeUntil:1001}])expect(chooseAutoRelic({...good,...patch},b)).toBeNull();
});
it('selects oldest useful across collections without mutation',()=>{
  const v=new RelicVault();v.offer('emergency_repair','stored',false);v.offer('emergency_repair','head',true);v.offer('gold_rush','later',true);
  const before=structuredClone({stored:v.stored,pending:v.pending,revision:v.revision});
  expect(chooseAutoRelic(context(),v)).toMatchObject({source:'pending',index:1,id:'gold_rush',revision:v.revision});
  expect({stored:v.stored,pending:v.pending,revision:v.revision}).toEqual(before);
  expect(chooseAutoRelic(context({lives:19}),v)).toMatchObject({source:'stored',index:0,id:'emergency_repair'});
});
it('uses exact radius, boss eligibility, dead filtering and deterministic ties',()=>{
  expect(chooseAutoMeteorTarget([enemy(1),enemy(2,110),enemy(3,220)])).toMatchObject({enemyId:2,count:3});
  expect(chooseAutoMeteorTarget([enemy(1),enemy(2,110),enemy(3,221)])).toBeNull();
  expect(chooseAutoMeteorTarget([enemy(9,500,0,true)])).toMatchObject({enemyId:9,count:1,hasBoss:true});
  expect(chooseAutoMeteorTarget([enemy(1),enemy(2,20),enemy(9,500,0,true)])?.enemyId).toBe(9);
  const tied=[enemy(1),enemy(2,10),enemy(3,20),enemy(7,500,0,true),enemy(8,510),enemy(9,520)];
  expect(chooseAutoMeteorTarget(tied)?.enemyId).toBe(7);
  expect(chooseAutoMeteorTarget([enemy(1),enemy(2,10),enemy(3,20,0,true)])?.enemyId).toBe(3);
  const regular=[enemy(3),enemy(2,10),enemy(1,20)];const before=structuredClone(regular);
  expect(chooseAutoMeteorTarget(regular)?.enemyId).toBe(1);expect(regular).toEqual(before);
  expect(chooseAutoMeteorTarget(regular.slice().reverse())?.enemyId).toBe(1);
  expect(chooseAutoMeteorTarget([enemy(1),enemy(2,20),{...enemy(3,0,0,true),alive:false},enemy(4,Infinity)])).toBeNull();
});
it('reuses held-Meteor geometry for duplicates within one decision',()=>{
  const measure=(count:number)=>{
    let reads=0;const e=enemy();Object.defineProperty(e,'x',{get:()=>{reads++;return 0;}});
    const v=new RelicVault();for(let i=0;i<count;i++)v.offer('meteor_strike','held',true);
    expect(chooseAutoRelic(context({enemies:[e,enemy(2,20)]}),v)).toBeNull();return reads;
  };
  expect(measure(20)).toBe(measure(1));
});
