import { writeFileSync } from 'node:fs';
import { describe, it, vi } from 'vitest';

vi.mock('phaser', () => ({ default: { Scene: class {}, Scenes: { Events: { SHUTDOWN: 'shutdown' } }, Scale: { Events: { RESIZE: 'resize' } } } }));

import { runSimulation } from './helpers/simulationBot.ts';
import type { PlannedPurchase } from './helpers/progressionTrace.ts';
import { STARTER_BRANCH } from '../src/game/config/evolutions.ts';
import { TOWER_LIST } from '../src/game/config/towers.ts';
import type { TowerId } from '../src/shared/progression.ts';

/** Fully invests every tower in `ids`: builds, then foundations, the starter branch and its ranks, round-robin. */
function plan(ids: readonly TowerId[]): PlannedPurchase[] {
  const steps: PlannedPurchase[] = ids.map((towerId) => ({ towerId, intent: 'build' }));
  for (let i = 0; i < 3; i++) for (const towerId of ids) steps.push({ towerId, intent: { kind: 'foundation-upgrade' } });
  for (const towerId of ids) steps.push({ towerId, intent: { kind: 'evolve', branchId: STARTER_BRANCH[towerId] } });
  for (let i = 0; i < 3; i++) for (const towerId of ids) steps.push({ towerId, intent: { kind: 'evolution-rank' } });
  return steps;
}

/** Opt-in tower-dominance report: `TOWER_REPORT=<out.md> npx vitest run tests/tower-balance-report.test.ts`. Not an acceptance gate. */
describe.skipIf(!process.env.TOWER_REPORT)('tower balance report (Classic, Medium, seed 1)', () => {
  const all = TOWER_LIST.map((t) => t.id);
  const rows: string[] = ['| Lineup | Outcome | Waves | Lives | Score |', '| --- | --- | ---: | ---: | ---: |'];
  const run = (label: string, ids: readonly TowerId[]) => {
    const trace = runSimulation({ label, difficulty: 'medium', seed: 1, unlockAll: false, throughWave: 30, continueEndless: false, plan: plan(ids) });
    rows.push(`| ${label} | ${trace.outcome} | ${trace.wavesCompleted} | ${trace.finalLives} | ${trace.terminalPayload?.finalScore ?? '-'} |`);
  };
  it('runs every lineup', () => {
    run('all 7', all);
    for (const id of all) run(`all 7 minus ${id}`, all.filter((x) => x !== id));
    for (const id of all) run(`${id} alone`, [id]);
    for (const id of all) run(`${id} + longbow + glacier`, [...new Set<TowerId>([id, 'longbow', 'glacier'])]);
    writeFileSync(process.env.TOWER_REPORT!, rows.join('\n') + '\n');
  }, 1_800_000);
});
