import { afterAll, describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => ({ default: { Scene: class {}, Scenes: { Events: { SHUTDOWN: 'shutdown' } }, Scale: { Events: { RESIZE: 'resize' } } } }));

import { BALANCE_RUNS } from './helpers/balanceRuns.ts';
import { runSimulation, GOLD_RELICS } from './helpers/simulationBot.ts';
import { verifyTrace } from './helpers/progressionTrace.ts';
import { validateScorePayload } from '../src/shared/validation.ts';

const traces: ReturnType<typeof runSimulation>[] = [];
afterAll(async () => {
  const path = process.env.CLASSIC_TRACE_PATH;
  if (!path) return;
  const moduleName = 'node:fs';
  const { writeFileSync } = await import(moduleName);
  writeFileSync(path, JSON.stringify(traces, null, 2));
});

describe('real seeded balance acceptance', () => {
  it.each(BALANCE_RUNS)('$label', (options) => {
    const trace = runSimulation(options);
    traces.push(trace);
    if (options.difficulty === 'medium') expect(verifyTrace(trace), JSON.stringify(trace)).toEqual([]);
    else expect(trace.siegeWon).toBe(true);
    expect(trace.debugAssisted).toBe(false);
    expect(trace.purchases.every((p) => Number.isSafeInteger(p.goldAfter) && p.goldAfter >= 0)).toBe(true);
    if (trace.outcome === 'endless' || trace.outcome === 'incomplete') {
      expect(options.continueEndless).toBe(true);
      expect(trace.wavesCompleted).toBe(options.throughWave);
      expect(trace.terminalPayload).toBeNull();
    } else {
      expect(trace.terminalPayload).not.toBeNull();
      expect(validateScorePayload(trace.terminalPayload).errors).toEqual([]);
    }
    if (options.goldRelics === 'disabled') {
      expect(trace.relicUses.some((use) => GOLD_RELICS.has(use.id))).toBe(false);
      expect(trace.ordinaryRewardsOnly).toBe(true);
    }
  }, 120000);
});
