import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  displays: [] as Array<Record<string, any>>,
  sheets: [] as Array<{
    title: string;
    lines: string[];
    actions: Array<{ label: string; enabled: boolean; action: () => void; update: (label: string, available: boolean) => void }>;
    destroyed: boolean;
  }>,
  submitScore: vi.fn(),
  submitRetainedScore: vi.fn(),
  scoreRetryRepository: null as any,
  realSubmitRetainedScore: null as any,
  resizeHandlers: [] as Array<() => void>,
  legacyBest: null as any,
  sound: { stopMusic: vi.fn(), click: vi.fn(), unlock: vi.fn() }
}));

vi.mock('phaser', () => {
  class FakeDisplay {
    kind = '';
    args: unknown[] = [];
    x = 0;
    y = 0;
    width = 0;
    height = 16;
    initialText = '';
    currentText = '';
    handlers = new Map<string, (...args: any[]) => void>();
    destroyed = false;
    setOrigin() { return this; }
    setDisplaySize() { return this; }
    setStrokeStyle() { return this; }
    setStroke() { return this; }
    setShadow() { return this; }
    setFontSize() { return this; }
    setCrop() { return this; }
    setInteractive() { return this; }
    setFillStyle() { return this; }
    setPosition() { return this; }
    setScale() { return this; }
    setRotation() { return this; }
    setY(value?: number) { if (typeof value === 'number') this.y = value; return this; }
    setX(value?: number) { if (typeof value === 'number') this.x = value; return this; }
    setTint() { return this; }
    setAlign() { return this; }
    setVisible() { return this; }
    setDepth() { return this; }
    setWordWrapWidth() { return this; }
    setAlpha() { return this; }
    setMask() { return this; }
    clearMask() { return this; }
    setText(value: string) { this.currentText = value; return this; }
    setColor() { return this; }
    lineStyle() { return this; }
    beginPath() { return this; }
    moveTo() { return this; }
    lineTo() { return this; }
    closePath() { return this; }
    strokePath() { return this; }
    clear() { return this; }
    fillGradientStyle() { return this; }
    lineBetween() { return this; }
    fillStyle() { return this; }
    fillCircle() { return this; }
    fillRect() { return this; }
    strokeRect() { return this; }
    createGeometryMask() { return {}; }
    list: FakeDisplay[] = [];
    add(items: unknown) { this.list.push(...(Array.isArray(items) ? items : [items]) as FakeDisplay[]); return this; }
    removeAll() { this.list.length = 0; return this; }
    destroy() { this.destroyed = true; return this; }
    on(event: string, callback: (...args: any[]) => void) { this.handlers.set(event, callback); return this; }
    fire(event: string) { this.handlers.get(event)?.(); }
  }

  class FakeScene {
    private listeners = new Map<string, Array<() => void>>();
    events = {
      once: (event: string, callback: () => void) => { this.listeners.set(event, [...(this.listeners.get(event) ?? []), callback]); },
      emit: (event: string) => { const callbacks = this.listeners.get(event) ?? []; this.listeners.delete(event); callbacks.forEach((callback) => callback()); }
    };
    scale = {
      width: 1280, height: 720,
      on: (_event: string, _callback: () => void) => { mocks.resizeHandlers.push(_callback); },
      off: vi.fn()
    };
    input = { on: vi.fn(), off: vi.fn() };
    tweens = { getTweens: () => [], killAll: vi.fn() };
    children = { list: [] as FakeDisplay[] };
    make = { graphics: () => this.makeDisplay('graphics', []) };
    game = { canvas: { addEventListener: vi.fn(), removeEventListener: vi.fn() } };
    scene = { isActive: () => true, start: vi.fn(), restart: vi.fn() };
    add = {
      text: (...args: unknown[]) => this.makeDisplay('text', args),
      rectangle: (...args: unknown[]) => this.makeDisplay('rectangle', args),
      container: (...args: unknown[]) => this.makeDisplay('container', args),
      image: (...args: unknown[]) => this.makeDisplay('image', args),
      circle: (...args: unknown[]) => this.makeDisplay('circle', args),
      ellipse: (...args: unknown[]) => this.makeDisplay('ellipse', args),
      graphics: (...args: unknown[]) => this.makeDisplay('graphics', args)
    };
    private makeDisplay(kind: string, args: unknown[]): FakeDisplay {
      const display = new FakeDisplay();
      display.kind = kind; display.args = args;
      display.x = Number(args[0]) || 0; display.y = Number(args[1]) || 0;
      if (kind === 'rectangle') { display.width = Number(args[2]) || 0; display.height = Number(args[3]) || 0; }
      if (kind === 'text') { display.currentText = String(args[2] ?? ''); display.initialText = display.currentText; display.width = display.initialText.length * 7; }
      this.children.list.push(display); mocks.displays.push(display);
      return display;
    }
    constructor(_key: string) {}
  }

  return { default: { Scene: FakeScene, Scenes: { Events: { SHUTDOWN: 'shutdown' } }, Scale: { Events: { RESIZE: 'resize' } } } };
});

vi.mock('../src/game/ui/ScrollSheet.ts', () => ({
  ScrollSheet: class {
    readonly root = { destroy: vi.fn() };
    readonly bounds: unknown;
    private readonly entry: (typeof mocks.sheets)[number];
    constructor(_scene: unknown, parent: { add?: (child: unknown) => void } | null, bounds: unknown, title: string, _close: () => void) {
      this.bounds = bounds;
      this.entry = { title, lines: [], actions: [], destroyed: false };
      mocks.sheets.push(this.entry);
      parent?.add?.(this.root);
    }
    text(_y: number, value: string) { this.entry.lines.push(value); return { height: 16 }; }
    action(_y: number, label: string, action: () => void, _kind?: string, enabled = true) {
      const record = { label, enabled, action, update: (next: string, available: boolean) => { record.label = next; record.enabled = available; } };
      this.entry.actions.push(record);
      return { update: record.update };
    }
    destroy() { this.entry.destroyed = true; }
  }
}));

vi.mock('../src/api/leaderboardClient.ts', () => ({
  submitScore: mocks.submitScore,
  fetchLeaderboard: vi.fn()
}));
vi.mock('../src/game/systems/ScoreRetry.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/game/systems/ScoreRetry.ts')>();
  mocks.realSubmitRetainedScore = actual.submitRetainedScore;
  return {
    ...actual,
    get scoreRetryRepository() { return mocks.scoreRetryRepository; },
    submitRetainedScore: (...args: unknown[]) => mocks.submitRetainedScore(...args)
  };
});
vi.mock('../src/game/systems/Settings.ts', () => ({
  loadBest: () => null,
  loadLegacyBest: () => mocks.legacyBest,
  loadLegacyBests: () => [],
  loadSettings: () => ({ masterVolume: 1, musicVolume: 0.5, sfxVolume: 0.7, musicOn: true, sfxOn: true, gameSpeed: 1, difficulty: 'medium', playerName: '' })
}));
vi.mock('../src/game/systems/SoundManager.ts', () => ({ SoundManager: { get: () => mocks.sound } }));
vi.mock('../src/game/ui/tokens.ts', () => ({
  C: { dangerBright: '#f66', textSecondary: '#ddd', textMuted: '#999', textPrimary: '#fff', health: '#6f6', gold: '#fc6', goldBright: '#fd8' },
  FONT_DISPLAY: 'Cinzel', FONT_UI: 'Inter', style: () => ({})
}));
vi.mock('../src/game/art/menubg.ts', () => ({ paintVista: () => {} }));

import { MainMenuScene } from '../src/game/scenes/MainMenuScene.ts';
import { SCORE_RETRY_KEY, ScoreRetryRepository, type RetryLock, type RetryStore } from '../src/game/systems/ScoreRetry.ts';
import { resultFixture } from './helpers/progressionResult.ts';

function serialLock(): RetryLock {
  let tail: Promise<unknown> = Promise.resolve();
  return work => { const result = tail.then(work); tail = result.catch(() => {}); return result; };
}

function memoryStore() {
  const bytes = new Map<string, string>();
  const store: RetryStore = {
    getItem: (key: string) => bytes.get(key) ?? null,
    setItem: (key: string, value: string) => { bytes.set(key, value); },
    removeItem: (key: string) => { bytes.delete(key); }
  };
  return { bytes, store };
}

const retryPayload = (runId: string) => resultFixture({ highestWave: 30, wavesCompleted: 30, outcome: 'victory', siegeBossesDefeated: 7 }, 10, { runId });
const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };
const texts = () => mocks.displays.filter((d) => d.kind === 'text').map((d) => d.currentText as string);
type SheetRecord = (typeof mocks.sheets)[number];
const lastSheet = (): SheetRecord => mocks.sheets[mocks.sheets.length - 1];
const actionLabels = (sheet: SheetRecord): string[] => sheet.actions.map((action) => action.label);
const press = (label: string) => {
  const captions = mocks.displays.filter((d) => d.kind === 'text' && d.initialText === label);
  const caption = captions[captions.length - 1];
  if (!caption) throw new Error(`No ${label} action`);
  // MainMenuScene draws the etched frame between the box and its caption, so the
  // interactive rectangle is the nearest preceding rectangle with a handler.
  for (let i = mocks.displays.indexOf(caption) - 1; i >= 0; i--) {
    const candidate = mocks.displays[i];
    if (candidate.kind === 'rectangle' && candidate.handlers.has('pointerdown')) { candidate.fire('pointerdown'); return; }
  }
  throw new Error(`No interactive box for ${label}`);
};

describe('saved score menu sheet', () => {
  let bytes: Map<string, string>;
  beforeEach(() => {
    mocks.displays.length = 0;
    mocks.sheets.length = 0;
    mocks.resizeHandlers.length = 0;
    mocks.submitScore.mockReset().mockResolvedValue({ ok: true, id: 1 });
    mocks.legacyBest = null;
    const memory = memoryStore();
    bytes = memory.bytes;
    mocks.scoreRetryRepository = new ScoreRetryRepository(memory.store, serialLock());
    mocks.submitRetainedScore.mockReset().mockImplementation(
      (payload: unknown, repository: unknown, expected: unknown) => mocks.realSubmitRetainedScore(payload, repository, expected)
    );
  });

  it('offers the persisted record, opens it without sending, and closes on Back', async () => {
    await mocks.scoreRetryRepository.stage(retryPayload('saved-ready-0001'));
    const scene = new MainMenuScene(); scene.create(); await flush();
    expect(texts()).toContain('Saved Score');
    press('Saved Score'); await flush();
    const sheet = lastSheet();
    expect(sheet.title).toBe('Saved Score');
    expect(sheet.lines.join('\n')).toContain('TestWarden');
    expect(sheet.lines.join('\n')).toContain('Saved in this browser.');
    expect(actionLabels(sheet)).toEqual(['Retry Submission', 'Back']);
    expect(sheet.actions[0].enabled).toBe(true);
    expect(mocks.submitScore).not.toHaveBeenCalled();
    expect(mocks.submitRetainedScore).not.toHaveBeenCalled();
    sheet.actions[1].action();
    expect(sheet.destroyed).toBe(true);
    expect(mocks.submitScore).not.toHaveBeenCalled();
  });

  it('shows a session-only record with the same explicit retry action', async () => {
    mocks.scoreRetryRepository = new ScoreRetryRepository(null, serialLock());
    await mocks.scoreRetryRepository.stage(retryPayload('saved-session-0001'));
    const scene = new MainMenuScene(); scene.create(); await flush();
    press('Saved Score'); await flush();
    const sheet = lastSheet();
    expect(sheet.lines.join('\n')).toMatch(/session only/i);
    expect(sheet.actions[0].enabled).toBe(true);
    expect(mocks.submitScore).not.toHaveBeenCalled();
  });

  it('shows a retired-era record with a disabled retry and keeps its bytes', async () => {
    const retired = JSON.stringify({ version: 1, attemptedAt: '2026-10-09T00:00:00.000Z', payload: { ...retryPayload('saved-retired-01'), scoreVersion: 2, gameVersion: '0.2.0' } });
    bytes.set(SCORE_RETRY_KEY, retired);
    const scene = new MainMenuScene(); scene.create(); await flush();
    press('Saved Score'); await flush();
    const sheet = lastSheet();
    expect(sheet.lines.join('\n')).toContain('earlier leaderboard era');
    expect(actionLabels(sheet)).toEqual(['Retry Submission', 'Back']);
    expect(sheet.actions[0].enabled).toBe(false);
    sheet.actions[0].action();
    await flush();
    expect(mocks.submitScore).not.toHaveBeenCalled();
    expect(bytes.get(SCORE_RETRY_KEY)).toBe(retired);
  });

  it('shows a storage warning instead of a sheet for unreadable storage', async () => {
    bytes.set(SCORE_RETRY_KEY, '{broken');
    const scene = new MainMenuScene(); scene.create(); await flush();
    expect(texts()).not.toContain('Saved Score');
    expect(texts().some((t) => t.includes('could not be read'))).toBe(true);
    expect(mocks.sheets).toHaveLength(0);
    expect(mocks.submitScore).not.toHaveBeenCalled();
  });

  it('reopens the sheet across a resize restart', async () => {
    await mocks.scoreRetryRepository.stage(retryPayload('saved-resize-0001'));
    const scene = new MainMenuScene(); scene.create(); await flush();
    press('Saved Score'); await flush();
    expect(mocks.sheets).toHaveLength(1);
    mocks.resizeHandlers[mocks.resizeHandlers.length - 1]();
    expect(scene.scene.restart).toHaveBeenCalledWith({ openSaved: true });
    const reopened = new MainMenuScene();
    reopened.init({ openSaved: true });
    reopened.create(); await flush();
    expect(actionLabels(lastSheet())).toEqual(['Retry Submission', 'Back']);
    expect(mocks.submitScore).not.toHaveBeenCalled();
  });

  it('retries the matching attempt once and reports an already-recorded run', async () => {
    await mocks.scoreRetryRepository.stage(retryPayload('saved-duplicate-01'));
    mocks.submitScore.mockResolvedValue({ ok: false, duplicate: true, error: 'dup' });
    const scene = new MainMenuScene(); scene.create(); await flush();
    press('Saved Score'); await flush();
    lastSheet().actions[0].action();
    await flush();
    expect(mocks.submitScore).toHaveBeenCalledTimes(1);
    expect(lastSheet().lines.join('\n')).toContain('This run was already recorded.');
    expect(bytes.has(SCORE_RETRY_KEY)).toBe(false);
  });
});
