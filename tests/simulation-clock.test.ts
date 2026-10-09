import { expect, it, vi } from 'vitest';
import { SimulationClock, SIMULATION_STEP_MS } from '../src/game/systems/SimulationClock.ts';
it('retains overflow and stops at a terminal tick', () => {
  const clock = new SimulationClock(), step = vi.fn(() => true);
  expect(clock.advance(2500, step)).toBe(60);
  expect(clock.pendingMs).toBeCloseTo(1500);
  expect(clock.advance(0, step)).toBe(60);
  expect(clock.advance(0, step)).toBe(30);
  expect(step).toHaveBeenCalledTimes(150);
  clock.reset();
  expect(clock.advance(100, () => false)).toBe(1);
  expect(clock.pendingMs).toBeCloseTo(100 - SIMULATION_STEP_MS);
});
it.each([-1, NaN, Infinity])('adds no invalid time %s', value => {
  const clock = new SimulationClock(); clock.advance(5, () => true);
  expect(clock.advance(value, () => true)).toBe(0); expect(clock.pendingMs).toBe(5);
});
it.each([Array(60).fill(1000 / 60), Array(30).fill(1000 / 30), Array(10).fill(100), [7, 341, 51, 600, 1]])('keeps equal simulation time for a partition %#', (...parts: number[]) => {
  const clock = new SimulationClock(); let ticks = 0;
  for (const part of parts) clock.advance(part, () => { ticks++; return true; });
  expect(ticks).toBe(60); expect(clock.pendingMs).toBeCloseTo(0);
});
it('does not call another tick after reset during a callback', () => {
  const clock = new SimulationClock(), step = vi.fn(() => { clock.reset(); return true; });
  expect(clock.advance(2500, step)).toBe(1); expect(step).toHaveBeenCalledTimes(1); expect(clock.pendingMs).toBe(0);
});
