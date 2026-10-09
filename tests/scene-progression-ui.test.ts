import { afterEach, describe, expect, it, vi } from 'vitest';
const ui = vi.hoisted(() => {
  function anyStub(): any {
    const proxy: any = new Proxy(function () { return proxy; }, { get: (_t, key) => (key === 'then' ? undefined : key === Symbol.toPrimitive ? () => 0 : proxy), apply: () => proxy });
    return proxy;
  }
  return { anyStub, buttons: [] as Array<{ label: string; action: () => void; kind: string }> };
});
vi.mock('phaser', () => ({ default: { Scene: class { constructor(_key?: string) {} }, Scenes: { Events: { SHUTDOWN: 'shutdown' } }, Scale: { Events: { RESIZE: 'resize' } } } }));
vi.mock('../src/game/ui/components.ts', () => ({
  button: (_s: unknown, _p: unknown, _x: number, _y: number, _w: number, label: string, action: () => void, kind = 'secondary') => { ui.buttons.push({ label, action, kind }); return { box: ui.anyStub(), text: ui.anyStub() }; },
  panel: () => ui.anyStub(), statRow: () => undefined, etchedFrame: () => ui.anyStub()
}));
import { GameScene } from '../src/game/scenes/GameScene.ts';
import { ScrollSheet } from '../src/game/ui/ScrollSheet.ts';
import { Tower } from '../src/game/entities/Tower.ts';
import { SoundManager } from '../src/game/systems/SoundManager.ts';
import { SiegeSystem } from '../src/game/systems/SiegeSystem.ts';
import { gameLayout } from '../src/game/ui/layout.ts';
import type { BranchId } from '../src/shared/progression.ts';

function advanceSiege(to: number): SiegeSystem {
  const siege = new SiegeSystem();
  for (let wave = 1; wave <= to; wave++) { siege.startWave(wave); if (wave % 10 === 0) siege.bossKilled(wave); siege.completeWave({ wave, lives: 10, spawns: 0, enemies: 0, flights: 0, fields: 0 }); }
  return siege;
}
interface Run { sheetKind: string | null; selectedTower: Tower | null; towers: Tower[]; gold: number; wave: number; wavesCompleted: number; siege: SiegeSystem; runUnlocks: ReadonlySet<BranchId>;
  purchaseSelected: ReturnType<typeof vi.fn>; showBanner: ReturnType<typeof vi.fn>; drawSheet(): void; inspectorPrimaryAction(): void; compositionSummary(wave: number, complete?: boolean): string; startNextWave(): void; }
function sceneFixture(width = 1280, height = 720, level = 4) {
  vi.spyOn(SoundManager, 'get').mockReturnValue(ui.anyStub());
  const scene = new GameScene(); scene.init({ difficulty: 'medium' });
  const run = scene as unknown as Run, loose = scene as unknown as Record<string, unknown>;
  for (const name of ['updateHUD', 'refreshInfoPanel', 'showTouchPreview', 'updateNextPreview', 'floatText']) loose[name] = () => {};
  loose.add = ui.anyStub(); loose.uiRoot = ui.anyStub(); loose.input = ui.anyStub(); loose.game = ui.anyStub(); loose.layout = gameLayout(width, height);
  run.purchaseSelected = vi.fn(); run.showBanner = vi.fn();
  const t = new Tower('longbow', 100, 100, 0);
  t.progression = { ...t.progression, foundationLevel: level, invested: level === 4 ? 710 : 190 };
  run.towers = [t]; run.selectedTower = t; run.gold = 2000; run.siege.bossKilled(10); run.runUnlocks = new Set();
  ui.buttons.length = 0;
  return { run, loose, t };
}
const find = (prefix: string) => ui.buttons.find((b) => b.label.startsWith(prefix));
afterEach(() => vi.restoreAllMocks());

describe('progression controls', () => {
  it('renders disabled sheet actions that cannot fire', () => {
    const sheet = new ScrollSheet(ui.anyStub(), ui.anyStub(), { x: 0, y: 0, width: 320, height: 400 }, 'Tower Progression', () => {});
    const fire = vi.fn();
    sheet.action(0, 'Evolve: Volley · Complete the branch achievement', fire, 'primary', false);
    const disabled = ui.buttons[ui.buttons.length - 1]; disabled.action();
    expect(fire).not.toHaveBeenCalled(); expect(disabled.kind).toBe('secondary');
    sheet.action(56, 'Evolve: Marksman', fire, 'primary'); ui.buttons[ui.buttons.length - 1].action();
    expect(fire).toHaveBeenCalledTimes(1);
  });
  it('renders the evolve sheet and dispatches the captured intent and revision', () => {
    const { run, t } = sceneFixture(); run.sheetKind = 'evolve'; run.drawSheet();
    find('Evolve: Marksman · 510 gold')!.action();
    expect(run.purchaseSelected).toHaveBeenCalledWith({ kind: 'evolve', branchId: 'marksman' }, t.id, 0);
    find('Evolve: Volley · 510 gold · Complete the branch achievement')!.action();
    expect(run.purchaseSelected).toHaveBeenCalledTimes(1);
  });
  it('opens the sheet from the inspector at level 4 and upgrades directly below it', () => {
    const { run, loose } = sceneFixture(); loose.drawSheet = vi.fn();
    run.inspectorPrimaryAction(); expect(run.sheetKind).toBe('evolve');
    const low = sceneFixture(1280, 720, 2); low.loose.drawSheet = vi.fn(); low.run.inspectorPrimaryAction();
    expect(low.run.purchaseSelected).toHaveBeenCalledWith({ kind: 'foundation-upgrade' }, low.t.id, 0);
  });
  it('keeps Sell and the five targeting modes in the phone tower sheet', () => {
    const { run } = sceneFixture(390, 844); run.sheetKind = 'tower'; run.drawSheet();
    const labels = ui.buttons.map((b) => b.label);
    expect(labels).toEqual(expect.arrayContaining(['Sell · 497 gold', '✓ First', 'Last', 'Strongest', 'Weakest', 'Closest', 'Evolve: Marksman · 510 gold']));
  });
  it('labels the wave-30 preview and boss warning as the siege finale', () => {
    const { run } = sceneFixture();
    expect(run.compositionSummary(30)).toContain('Siege finale · Wave 30');
    run.siege = advanceSiege(29); run.wave = 29; run.wavesCompleted = 29; run.startNextWave();
    expect(run.showBanner.mock.calls[0][0]).toContain('Siege finale');
    run.siege.phase = 'endless'; expect(run.compositionSummary(31)).toContain('Wave 31 · Endless');
  });
});
