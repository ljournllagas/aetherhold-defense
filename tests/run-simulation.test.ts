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
