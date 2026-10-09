import { afterEach, describe, expect, it, vi } from 'vitest';
const ui = vi.hoisted(() => {
  function anyStub(): any {
    const proxy: any = new Proxy(function () { return proxy; }, { get: (target, key) => Reflect.has(target, key) ? Reflect.get(target, key) : (key === 'then' ? undefined : key === Symbol.toPrimitive ? () => 0 : proxy), apply: () => proxy });
    return proxy;
  }
  return { anyStub, buttons: [] as Array<{ label: string; action: () => void; kind: string }> };
});
vi.mock('phaser', () => ({ default: { Scene: class { constructor(_key?: string) {} }, Scenes: { Events: { SHUTDOWN: 'shutdown' } }, Scale: { Events: { RESIZE: 'resize' } } } }));
vi.mock('../src/game/ui/components.ts', () => ({
  button: (_s: unknown, _p: unknown, _x: number, _y: number, _w: number, label: string, action: () => void, kind = 'secondary') => {
    const entry = { label, action, kind }, text = ui.anyStub();
    text.setText = (value: string) => { entry.label = value; return text; };
    ui.buttons.push(entry); return { box: ui.anyStub(), text };
  },
  panel: () => ui.anyStub(), statRow: () => undefined, etchedFrame: () => ui.anyStub()
}));
import { GameScene } from '../src/game/scenes/GameScene.ts';
import { ScrollSheet } from '../src/game/ui/ScrollSheet.ts';
import { Tower } from '../src/game/entities/Tower.ts';
import { SoundManager } from '../src/game/systems/SoundManager.ts';
import { SiegeSystem } from '../src/game/systems/SiegeSystem.ts';
import { gameLayout } from '../src/game/ui/layout.ts';
import type { BranchId } from '../src/shared/progression.ts';
import type { PauseState } from '../src/game/systems/PauseState.ts';

function advanceSiege(to: number): SiegeSystem {
  const siege = new SiegeSystem();
  for (let wave = 1; wave <= to; wave++) { siege.startWave(wave); if (wave % 10 === 0) siege.bossKilled(wave); siege.completeWave({ wave, lives: 10, spawns: 0, enemies: 0, flights: 0, fields: 0 }); }
  return siege;
}
interface Run { sheetKind: string | null; selectedTower: Tower | null; towers: Tower[]; gold: number; wave: number; wavesCompleted: number; siege: SiegeSystem; runUnlocks: ReadonlySet<BranchId>;
  sheet: ScrollSheet | null; pauseState: PauseState; updateHUD(): void;
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
function liveSheetFixture(kind: 'tower' | 'evolve') {
  const fixture = sceneFixture(kind === 'tower' ? 390 : 1280, kind === 'tower' ? 844 : 720);
  fixture.loose.add = { text: () => ui.anyStub(), container: () => {
    const data = new Map<string, unknown>();
    return { list: [], add: () => {}, destroy: () => {}, getWorldTransformMatrix: () => ({ tx: 0, ty: 0 }),
      setData(key: string, value: unknown) { data.set(key, value); return this; }, getData: (key: string) => data.get(key) };
  } };
  fixture.loose.updateHUD = (GameScene.prototype as unknown as { updateHUD(): void }).updateHUD.bind(fixture.run);
  fixture.loose.publishQAStatus = () => {};
  fixture.loose.tweens = {}; fixture.loose.time = {};
  fixture.run.sheetKind = kind;
  return fixture;
}
afterEach(() => vi.restoreAllMocks());

describe('progression controls', () => {
  it.each(['tower', 'evolve'] as const)('updates affordability in the open %s sheet without rebuilding it', (kind) => {
    const { run, t } = liveSheetFixture(kind);
    run.gold = 509; run.drawSheet();
    const sheet = run.sheet!, action = find('Evolve: Marksman')!;
    sheet.scrollTo(100); const offset = sheet.scrollOffset;
    expect(action.label).toContain('Not enough gold'); action.action();
    expect(run.purchaseSelected).not.toHaveBeenCalled();
    run.gold = 517; run.updateHUD();
    expect(run.sheet).toBe(sheet); expect(sheet.scrollOffset).toBe(offset);
    expect(action.label).toBe('Evolve: Marksman · 510 gold');
    action.action(); expect(run.purchaseSelected).toHaveBeenCalledWith({ kind: 'evolve', branchId: 'marksman' }, t.id, 0);
  });
  it('disables an open action when gold falls and keeps the locked alternative inert', () => {
    const { run } = liveSheetFixture('evolve'); run.drawSheet();
    const action = find('Evolve: Marksman')!, locked = find('Evolve: Volley')!;
    run.gold = 0; run.updateHUD();
    expect(action.label).toContain('Not enough gold'); action.action(); locked.action();
    expect(locked.label).toContain('Complete the branch achievement'); expect(run.purchaseSelected).not.toHaveBeenCalled();
  });
  it.each(['user', 'modal', 'background'] as const)('refreshes availability across %s pause and resume', (reason) => {
    const { run } = liveSheetFixture('evolve'); run.drawSheet(); const action = find('Evolve: Marksman')!;
    run.pauseState.set(reason, true); run.updateHUD();
    expect(action.label).toContain('Unavailable while paused or ended'); action.action(); expect(run.purchaseSelected).not.toHaveBeenCalled();
    run.pauseState.set(reason, false); run.updateHUD();
    expect(action.label).toBe('Evolve: Marksman · 510 gold'); action.action(); expect(run.purchaseSelected).toHaveBeenCalledTimes(1);
  });
  it('preserves same-tower scroll on readiness rebuild and resets it for a different tower or sheet', () => {
    const { run } = liveSheetFixture('tower'); run.siege = new SiegeSystem(); run.drawSheet();
    run.sheet!.scrollTo(100); const offset = run.sheet!.scrollOffset; expect(offset).toBe(100);
    run.siege.bossKilled(10); run.drawSheet(); expect(run.sheet!.scrollOffset).toBe(offset);
    const other = new Tower('longbow', 200, 200, 1); run.selectedTower = other; run.towers.push(other);
    run.drawSheet(); expect(run.sheet!.scrollOffset).toBe(0);
    run.sheet!.scrollTo(100); run.sheetKind = 'evolve'; run.drawSheet(); expect(run.sheet!.scrollOffset).toBe(0);
  });
  it.each([['evolve', 1280, 720], ['tower', 390, 844]] as const)('groups branch comparisons before their actions in the %s sheet', (kind, width, height) => {
    const { run } = sceneFixture(width, height);
    const content: string[] = [];
    vi.spyOn(ScrollSheet.prototype, 'text').mockImplementation((_y, value) => { content.push(value); return { height: 20 } as never; });
    vi.spyOn(ScrollSheet.prototype, 'action').mockImplementation((_y, label) => { content.push(label); return ui.anyStub(); });
    run.sheetKind = kind; run.drawSheet();
    expect(content.filter(value => value.includes('Base stats'))).toHaveLength(1);
    for (const branch of ['Marksman', 'Volley']) {
      const description = content.findIndex(value => value.startsWith(branch + ' (') || value.startsWith(branch + ' —'));
      const action = content.findIndex(value => value.startsWith('Evolve: ' + branch));
      expect(description).toBeGreaterThan(-1); expect(action).toBeGreaterThan(description);
      const comparison = content.slice(description + 1, action).join(' ');
      for (const stat of ['Damage', 'Attack', 'Range', '→']) expect(comparison).toContain(stat);
      expect(content.filter(value => value.startsWith(branch + ' (') || value.startsWith(branch + ' —'))).toHaveLength(1);
    }
  });
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
