import { afterEach, describe, expect, it, vi } from 'vitest';
const ui = vi.hoisted(() => {
  function anyStub(): any {
    const proxy: any = new Proxy(function () { return proxy; }, { get: (_t, key) => (key === 'then' ? undefined : key === Symbol.toPrimitive ? () => 0 : proxy), apply: () => proxy });
    return proxy;
  }
  return { anyStub };
});
vi.mock('phaser', () => ({ default: { Scene: class { constructor(_key?: string) {} }, Scenes: { Events: { SHUTDOWN: 'shutdown' } }, Scale: { Events: { RESIZE: 'resize' } } } }));
vi.mock('../src/game/ui/components.ts', () => ({ button: () => ({ box: ui.anyStub(), text: ui.anyStub() }), panel: () => ui.anyStub(), statRow: () => undefined, etchedFrame: () => ui.anyStub() }));
import { GameScene } from '../src/game/scenes/GameScene.ts';
import { Tower } from '../src/game/entities/Tower.ts';
import { SoundManager } from '../src/game/systems/SoundManager.ts';
import { gameLayout, sheetBounds } from '../src/game/ui/layout.ts';
import type { ScrollSheet } from '../src/game/ui/ScrollSheet.ts';
import type { QAAction } from '../src/game/qa.ts';

const VIEWPORTS = [[1440, 900], [1280, 720], [1024, 768], [844, 390], [390, 844], [360, 640]] as const;
const KINDS = ['build', 'tower', 'more', 'relics', 'next', 'evolve'] as const;
afterEach(() => vi.restoreAllMocks());

describe('sheet bounds', () => {
  it('gives the 844x390 Tower Progression sheet room for its first action', () => {
    const layout = gameLayout(844, 390);
    for (const kind of ['evolve', 'tower'] as const) {
      const b = sheetBounds(layout, kind, false);
      expect(b.height - 52).toBeGreaterThanOrEqual(200);
      expect(b.y).toBeGreaterThanOrEqual(layout.hud);
      expect(b.y + b.height).toBeLessThanOrEqual(layout.height - layout.tray);
    }
  });
  it.each(VIEWPORTS)('keeps every sheet between the HUD and the tray at %ix%i', (width, height) => {
    const layout = gameLayout(width, height);
    for (const kind of KINDS) for (const preview of [false, true]) {
      const b = sheetBounds(layout, kind, preview);
      expect(b.x).toBeGreaterThanOrEqual(0); expect(b.x + b.width).toBeLessThanOrEqual(width);
      expect(b.y).toBeGreaterThanOrEqual(layout.hud); expect(b.y + b.height).toBeLessThanOrEqual(height - layout.tray);
    }
  });
  it('keeps the existing heights outside short landscape layouts', () => {
    for (const [width, height] of [[1024, 768], [390, 844], [360, 640]] as const) {
      const layout = gameLayout(width, height);
      expect(sheetBounds(layout, 'evolve', false).height).toBe(Math.max(96, layout.field.height * 0.5));
      expect(sheetBounds(layout, 'build', true).height).toBe(Math.max(96, layout.field.height * 0.5 - 80));
    }
  });
  it('draws the 844x390 Tower Progression sheet with those bounds', () => {
    vi.spyOn(SoundManager, 'get').mockReturnValue(ui.anyStub());
    const scene = new GameScene(); scene.init({ difficulty: 'medium' });
    const loose = scene as unknown as Record<string, unknown>;
    for (const name of ['updateHUD', 'refreshInfoPanel', 'showTouchPreview']) loose[name] = () => {};
    loose.add = ui.anyStub(); loose.uiRoot = ui.anyStub(); loose.input = ui.anyStub(); loose.game = ui.anyStub(); loose.layout = gameLayout(844, 390);
    const t = new Tower('longbow', 100, 100, 0); t.progression = { ...t.progression, foundationLevel: 4, invested: 710 };
    loose.towers = [t]; loose.selectedTower = t; loose.sheetKind = 'evolve';
    (scene as unknown as { drawSheet(): void }).drawSheet();
    expect((loose.sheet as ScrollSheet).bounds.height).toBe(sheetBounds(gameLayout(844, 390), 'evolve', false).height);
  });
  it('keeps every action reachable in the 844x390 sheet with the taller wrapped preview', () => {
    vi.spyOn(SoundManager, 'get').mockReturnValue(ui.anyStub());
    const scene = new GameScene(); scene.init({ difficulty: 'medium' });
    const run = scene as unknown as { gold: number; sheet: ScrollSheet | null; wave: number; wavesCompleted: number; towers: Tower[]; sheetKind: string | null; drawSheet(): void };
    const loose = scene as unknown as Record<string, unknown>;
    for (const name of ['updateHUD', 'refreshInfoPanel', 'showTouchPreview', 'updateNextPreview', 'floatText']) loose[name] = () => {};
    const texts: Array<{ text: string; y: number; height: number }> = [];
    const textStub = (value: string, y: number) => {
      const view = { type: 'Text', text: value, y, height: 20, setWordWrapWidth: () => view, setCrop: () => view, setVisible: () => view };
      texts.push(view); return view;
    };
    loose.add = {
      text: (x: number, y: number, value: string) => x === 12 ? textStub(value, y) : ui.anyStub(),
      container: () => ({ list: [], add: () => {}, destroy: () => {}, getWorldTransformMatrix: () => ({ tx: 0, ty: 0 }), setData() { return this; }, getData: () => undefined })
    };
    loose.uiRoot = { add: () => {} }; loose.game = ui.anyStub(); loose.layout = gameLayout(844, 390);
    loose.input = { on() { return this; }, off() { return this; } };
    (scene as unknown as { siege: { bossKilled(wave: number): void } }).siege.bossKilled(10);
    const t = new Tower('longbow', 100, 100, 0); t.progression = { ...t.progression, foundationLevel: 4, invested: 710 };
    run.towers = [t]; run.sheetKind = 'evolve'; (loose as { selectedTower: Tower }).selectedTower = t; run.gold = 2000;
    run.drawSheet();
    const sheet = run.sheet!;
    const preview = texts.find((view) => view.text.startsWith('Next:'));
    const startedAt = sheet.scrollOffset;
    expect(preview).toBeDefined();
    expect(preview!.text).toContain('·');
    sheet.scrollTo(sheet.bounds.height);
    expect(sheet.scrollOffset).toBeGreaterThan(startedAt);
  });
});

describe('QA seed HUD refresh', () => {
  it.each([['evolution', 10, 2000], ['mastery', 30, 50000]] as const)('refreshes the top bar last after the %s seed', (state, wave, gold) => {
    vi.spyOn(SoundManager, 'get').mockReturnValue(ui.anyStub());
    const scene = new GameScene(); scene.init({ difficulty: 'medium', playerName: 'QA Warden' });
    const run = scene as unknown as { wave: number; gold: number; handleQAAction(action: QAAction): void }, loose = scene as unknown as Record<string, unknown>;
    for (const name of ['refreshInfoPanel', 'drawSheet', 'drawPowerupBar', 'refreshPlots', 'refreshPlacePanel', 'hideGhost', 'showBanner', 'floatText', 'floatTextForEnemy', 'drawCatalog', 'updateNextPreview', 'renderVictory', 'projectEntity', 'presentReward', 'showTouchPreview', 'refreshTowerVisual']) loose[name] = () => {};
    const seen: Array<[number, number]> = []; loose.updateHUD = () => { seen.push([run.wave, run.gold]); };
    loose.add = ui.anyStub(); loose.world = (v: unknown) => v;
    loose.events = { emit: vi.fn(), on: vi.fn(), off: vi.fn() }; loose.input = { listenerCount: () => 0, keyboard: null }; loose.tweens = { getTweens: () => [] };
    run.handleQAAction({ type: 'seed', state });
    expect(seen[seen.length - 1]).toEqual([wave, gold]);
  });
});
