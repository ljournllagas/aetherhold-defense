import { describe, expect, it } from 'vitest';
import { RelicVault, advanceFlights } from '../src/game/systems/RunSimulation.ts';
import type { PowerUpId } from '../src/shared/types.ts';

describe('relic transactions', () => {
  it('holds every overflow reward until an explicit choice resolves it', () => {
    const vault = new RelicVault();
    ['meteor_strike', 'gold_rush', 'time_freeze'].forEach(id => vault.stored.push(id as PowerUpId));
    vault.offer('battle_cry', 'first', false);
    vault.offer('arcane_surge', 'second', false);
    expect(vault.pending.map(r => r.id)).toEqual(['battle_cry', 'arcane_surge']);
    expect(vault.beginUse(0, true)).toEqual({ kind: 'target', id: 'meteor_strike' });
    expect(vault.stored).toHaveLength(3);
    expect(vault.pending).toHaveLength(2);
    vault.cancelTarget();
    expect(vault.pending[0].id).toBe('battle_cry');
    expect(vault.stored[0]).toBe('meteor_strike');
    vault.beginUse(0, true);
    expect(vault.commitTarget()).toBe('meteor_strike');
    expect(vault.stored).toHaveLength(2);
    expect(vault.resolve('store')).toBe(true);
    expect(vault.stored).toEqual(['gold_rush', 'time_freeze', 'battle_cry']);
    expect(vault.pending[0].id).toBe('arcane_surge');
    vault.resolve('replace-oldest');
    expect(vault.stored).toEqual(['time_freeze', 'battle_cry', 'arcane_surge']);
    expect(vault.pending).toHaveLength(0);
  });

  it('retains unusable overcharge and permits reveal targeting without reserving a fourth slot', () => {
    const vault = new RelicVault();
    vault.stored.push('tower_overcharge');
    expect(vault.beginUse(0, false)).toEqual({ kind: 'unusable', id: 'tower_overcharge' });
    expect(vault.stored).toEqual(['tower_overcharge']);
    vault.offer('meteor_strike', 'Boss', true);
    expect(vault.beginPendingUse(true)).toEqual({ kind: 'target', id: 'meteor_strike' });
    vault.cancelTarget();
    expect(vault.pending[0].id).toBe('meteor_strike');
    vault.beginPendingUse(true);
    vault.commitTarget();
    expect(vault.stored).toEqual(['tower_overcharge']);
    expect(vault.pending).toHaveLength(0);
  });
});

describe('flight game-time stepping', () => {
  it('arrives only after game time advances, and clears without impacts on game over', () => {
    const flights = [{ elapsedMs: 0, durationMs: 100, id: 1 }];
    expect(advanceFlights(flights, 0, false)).toEqual([]);
    expect(advanceFlights(flights, 40, false)).toEqual([]);
    expect(flights[0].elapsedMs).toBe(40);
    expect(advanceFlights(flights, 60, false)).toEqual([{ elapsedMs: 100, durationMs: 100, id: 1 }]);
    expect(flights).toEqual([]);
    flights.push({ elapsedMs: 0, durationMs: 100, id: 2 });
    expect(advanceFlights(flights, 200, true)).toEqual([]);
    expect(flights).toEqual([]);
  });
});

it('rejects a stale identical-ID selection after an older copy is consumed', () => {
  const v = new RelicVault();
  v.offer('gold_rush', 'older', false); v.offer('gold_rush', 'later', false);
  const pick = {source: 'stored' as const, index: 0, id: 'gold_rush' as const, revision: v.revision};
  v.beginUse(0, true);
  expect(v.beginSelectedUse(pick, true)).toEqual({kind: 'empty'});
  expect(v.stored).toEqual(['gold_rush']);
});
it('uses a later pending reward without deleting its waiting head or metadata', () => {
  const v = new RelicVault();
  v.offer('emergency_repair', 'waiting', true); v.offer('gold_rush', 'ready', true);
  const pick = {source: 'pending' as const, index: 1, id: 'gold_rush' as const, revision: v.revision};
  expect(v.beginSelectedUse(pick, true)).toEqual({kind:'apply', id:'gold_rush'});
  expect(v.pending).toEqual([{id:'emergency_repair', reason:'waiting', reveal:true}]);
  expect(v.beginSelectedUse(pick, true)).toEqual({kind:'empty'});
});
it('retains a selected pending Meteor on cancel without changing manual FIFO', () => {
  const v = new RelicVault();
  v.offer('emergency_repair', 'head', true); v.offer('meteor_strike', 'later', true);
  const pick = {source:'pending' as const, index:1, id:'meteor_strike' as const, revision:v.revision};
  expect(v.beginSelectedUse(pick,true).kind).toBe('target');
  expect(v.pending).toHaveLength(2); v.cancelTarget();
  expect(v.pending.map(r=>r.id)).toEqual(['emergency_repair','meteor_strike']);
  expect(v.beginPendingUse(true)).toEqual({kind:'apply',id:'emergency_repair'});
});

it.each([-1,0.5,99,Number.MAX_SAFE_INTEGER+1])('does not mutate for index %s',(index)=>{
  const v=new RelicVault();v.offer('gold_rush','held',false);
  const before=structuredClone({stored:v.stored,pending:v.pending,target:v.target,revision:v.revision});
  expect(v.beginSelectedUse({source:'stored',index,id:'gold_rush',revision:v.revision},true)).toEqual({kind:'empty'});
  expect({stored:v.stored,pending:v.pending,target:v.target,revision:v.revision}).toEqual(before);
});
it('rejects mismatched ID/revision and keeps overflow without a fourth slot',()=>{
  const v=new RelicVault();for(let i=0;i<3;i++)v.offer('emergency_repair','stored',false);
  v.offer('gold_rush','overflow',false);const before=structuredClone(v.pending);
  expect(v.beginSelectedUse({source:'pending',index:0,id:'meteor_strike',revision:v.revision},true).kind).toBe('empty');
  expect(v.beginSelectedUse({source:'pending',index:0,id:'gold_rush',revision:v.revision-1},true).kind).toBe('empty');
  expect(v.pending).toEqual(before);
  expect(v.beginSelectedUse({source:'pending',index:0,id:'gold_rush',revision:v.revision},true)).toEqual({kind:'apply',id:'gold_rush'});
  expect(v.stored).toHaveLength(3);expect(v.pending).toEqual([]);
});
it('revises every successful mutation but not failed/unusable operations',()=>{
  const v=new RelicVault();expect(v.revision).toBe(0);
  v.cancelTarget();expect(v.revision).toBe(0);expect(v.resolve('store')).toBe(false);expect(v.revision).toBe(0);
  v.offer('tower_overcharge','one',false);expect(v.revision).toBe(1);
  expect(v.beginUse(0,false).kind).toBe('unusable');expect(v.revision).toBe(1);
  v.beginUse(0,true);expect(v.revision).toBe(2);
  v.offer('meteor_strike','two',true);expect(v.revision).toBe(3);
  v.beginPendingUse(true);expect(v.revision).toBe(4);
  v.cancelTarget();expect(v.revision).toBe(5);
  v.beginPendingUse(true);expect(v.revision).toBe(6);
  expect(v.commitTarget()).toBe('meteor_strike');expect(v.revision).toBe(7);
  v.offer('gold_rush','three',true);expect(v.revision).toBe(8);
  expect(v.resolve('store')).toBe(true);expect(v.revision).toBe(9);
});
