import { describe, it, vi } from 'vitest';
import { GameScene } from '../src/game/scenes/GameScene.ts';

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
describe.skipIf(!process.env.TOWER_REPORT)('tower balance report (Classic, Medium, seeds 1..TOWER_SEEDS)', () => {
  const all = TOWER_LIST.map((t) => t.id) as TowerId[];
  const seeds = Array.from({ length: Number(process.env.TOWER_SEEDS ?? 6) }, (_, i) => i + 1);
  const rows: string[] = [`| Lineup | Wins / ${seeds.length} | Avg waves | Avg lives |`, '| --- | ---: | ---: | ---: |'];
  const only = process.env.TOWER_ONLY ? new RegExp(process.env.TOWER_ONLY) : null;
  const run = (label: string, ids: readonly TowerId[]) => {
    if (only && !only.test(label)) return;
    const traces = seeds.map((seed) => runSimulation({ label, difficulty: 'medium', seed, unlockAll: false, throughWave: 30, continueEndless: false, plan: plan(ids) }));
    const avg = (pick: (t: (typeof traces)[number]) => number) => (traces.reduce((n, t) => n + pick(t), 0) / traces.length).toFixed(1);
    rows.push(`| ${label} | ${traces.filter((t) => t.outcome === 'victory').length} | ${avg((t) => t.wavesCompleted)} | ${avg((t) => t.finalLives)} |`);
  };
  /** Effective damage (overkill excluded) per source. Field ticks carry no shot; only Cinder fields exist in these plans. */
  const damage = new Map<string, number>();
  const trackDamage = () => {
    const proto = GameScene.prototype as unknown as { damageEnemy: (e: { hp: number }, raw: number, type: string, shot?: { towerId: string }) => number };
    const original = proto.damageEnemy;
    return vi.spyOn(proto, 'damageEnemy').mockImplementation(function (this: unknown, e, raw, type, shot) {
      const before = Math.max(0, e.hp), dealt = original.call(this, e, raw, type, shot);
      const key = shot?.towerId ?? (type === 'elemental' ? 'cinder-field' : 'relic');
      damage.set(key, (damage.get(key) ?? 0) + Math.min(dealt, before));
      return dealt;
    });
  };
  it('runs every lineup', async () => {
    const spy = trackDamage();
    run('all 7', all);
    const total = [...damage.values()].reduce((n, v) => n + v, 0);
    rows.push('', '| Damage share (all 7) | % of effective damage |', '| --- | ---: |', ...[...damage].sort((x, y) => y[1] - x[1]).map(([k, v]) => `| ${k} | ${(100 * v / total).toFixed(1)} |`), '');
    spy.mockRestore();
    for (const id of all) run(`all 7 minus ${id}`, all.filter((x) => x !== id));
    for (const id of all) run(`${id} alone`, [id]);
    for (const id of all) run(`${id} + longbow + glacier`, [...new Set<TowerId>([id, 'longbow', 'glacier'])]);
    const moduleName = 'node:fs'; // no @types/node; same trick as balance-acceptance
    const { writeFileSync } = await import(moduleName);
    writeFileSync(process.env.TOWER_REPORT!, rows.join('\n') + '\n');
  }, 1_800_000);
});
