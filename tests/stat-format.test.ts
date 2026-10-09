import { afterEach, describe, expect, it, vi } from 'vitest';
const ui = vi.hoisted(() => {
  function anyStub(): any {
    const proxy: any = new Proxy(function () { return proxy; }, { get: (_t, key) => (key === 'then' ? undefined : key === Symbol.toPrimitive ? () => 0 : proxy), apply: () => proxy });
    return proxy;
  }
  return { anyStub, texts: [] as string[] };
});
vi.mock('phaser', () => ({ default: { Scene: class { constructor(_key?: string) {} }, Scenes: { Events: { SHUTDOWN: 'shutdown' } }, Scale: { Events: { RESIZE: 'resize' } } } }));
vi.mock('../src/game/ui/components.ts', () => ({
  button: () => ({ box: ui.anyStub(), text: ui.anyStub() }), panel: () => ui.anyStub(), etchedFrame: () => ui.anyStub(),
  statRow: (_s: unknown, _c: unknown, _y: number, key: string, value: string) => { ui.texts.push(`${key} ${value}`); }
}));
import { GameScene } from '../src/game/scenes/GameScene.ts';
import { Tower } from '../src/game/entities/Tower.ts';
import { SoundManager } from '../src/game/systems/SoundManager.ts';
import { EVOLUTIONS } from '../src/game/config/evolutions.ts';
import { TOWER_IDS } from '../src/game/config/towers.ts';
import { effectiveStats } from '../src/game/systems/EvolutionSystem.ts';
import { formatStat } from '../src/game/ui/progressionView.ts';
import { gameLayout } from '../src/game/ui/layout.ts';
import type { BranchId, EvolutionRank } from '../src/shared/progression.ts';

interface Run { sheetKind: string | null; selectedTower: Tower | null; towers: Tower[]; drawSheet(): void; refreshInfoPanel(): void; }
const recordingAdd = () => new Proxy({}, { get: (_t, key) => (key === 'text' ? (_x: number, _y: number, value: string) => { ui.texts.push(String(value)); return ui.anyStub(); } : () => ui.anyStub()) });
function sceneWith(t: Tower): Run {
  vi.spyOn(SoundManager, 'get').mockReturnValue(ui.anyStub());
  const scene = new GameScene(); scene.init({ difficulty: 'medium' });
  const run = scene as unknown as Run, loose = scene as unknown as Record<string, unknown>;
  for (const name of ['updateHUD', 'showTouchPreview', 'drawCatalog', 'hideGhost']) loose[name] = () => {};
  loose.add = recordingAdd(); loose.uiRoot = ui.anyStub(); loose.input = ui.anyStub(); loose.game = ui.anyStub(); loose.layout = gameLayout(1280, 720);
  run.towers = [t]; run.selectedTower = t; ui.texts.length = 0;
  return run;
}
function evolved(branch: BranchId, rank: EvolutionRank): Tower {
  const t = new Tower(EVOLUTIONS[branch].towerId, 100, 100, 0);
  t.progression = { ...t.progression, foundationLevel: 4, branchId: branch, rank };
  return t;
}
const RAW_FLOAT = /\d\.\d{3,}/;
const cases = (Object.keys(EVOLUTIONS) as BranchId[]).flatMap((b) => ([0, 1, 2, 3] as EvolutionRank[]).map((r) => [b, r] as const));
afterEach(() => vi.restoreAllMocks());

describe('formatStat', () => {
  it('prints whole damage, range and splash and a two-decimal attack interval', () => {
    expect(formatStat('range', 214.50000000000003)).toBe('215');
    expect(formatStat('range', 195)).toBe('195');
    expect(formatStat('attackInterval', 0.36000000000000004)).toBe('0.36');
    expect(formatStat('attackInterval', 1)).toBe('1.00');
    expect(formatStat('damage', 151.99999999999997)).toBe('152');
    expect(formatStat('splashRadius', 90)).toBe('90');
  });
});

describe('printed tower stats', () => {
  it.each(cases)('Tower Progression sheet prints formatted stats for %s rank %i', (branch, rank) => {
    const t = evolved(branch, rank), run = sceneWith(t); run.sheetKind = 'evolve'; run.drawSheet();
    const s = effectiveStats(t.towerId, t.progression);
    expect(ui.texts).toContain(`Damage ${formatStat('damage', s.damage)} · Range ${formatStat('range', s.range)} · Attack ${formatStat('attackInterval', s.attackInterval)}s · ${s.damageType}`);
    expect(ui.texts.filter((text) => RAW_FLOAT.test(text))).toEqual([]);
  });
  it.each(cases)('desktop inspector prints no raw float for %s rank %i', (branch, rank) => {
    const run = sceneWith(evolved(branch, rank)); run.refreshInfoPanel();
    expect(ui.texts.filter((text) => RAW_FLOAT.test(text))).toEqual([]);
  });
  it.each([...TOWER_IDS].flatMap((id) => [1, 2, 3].map((level) => [id, level] as const)))('desktop upgrade preview is formatted for %s level %i', (id, level) => {
    const t = new Tower(id, 100, 100, 0); t.progression = { ...t.progression, foundationLevel: level };
    const run = sceneWith(t); run.refreshInfoPanel();
    expect(ui.texts.filter((text) => RAW_FLOAT.test(text))).toEqual([]);
  });
});
