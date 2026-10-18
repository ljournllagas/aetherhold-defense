import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => {
  class FakeScene {
    private listeners = new Map<string, Array<() => void>>();
    events = {
      once: (event: string, callback: () => void) => { this.listeners.set(event, [...(this.listeners.get(event) ?? []), callback]); },
      emit: (event: string) => { const callbacks = this.listeners.get(event) ?? []; this.listeners.delete(event); callbacks.forEach((callback) => callback()); }
    };
    scale = { width: 1280, height: 720, on: vi.fn(), off: vi.fn() };
    tweens = { getTweens: () => [] };
    game = { canvas: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 720 }) } };
    scene = { start: vi.fn(), restart: vi.fn() };
    add = {
      text: () => display(),
      rectangle: () => display(),
      container: () => display(),
      image: () => display(),
      circle: () => display()
    };
    constructor(_key?: string) {}
  }
  function display(): any {
    const view: any = {
      setOrigin() { return view; }, setDisplaySize() { return view; }, setStrokeStyle() { return view; },
      setStroke() { return view; }, setShadow() { return view; }, setWordWrapWidth() { return view; },
      setAlign() { return view; }, setY() { return view; }, setX() { return view; }, setDepth() { return view; },
      setInteractive() { return view; }, setPosition() { return view; }, setVisible() { return view; },
      on() { return view; }, height: 16, width: 100, text: ''
    };
    return view;
  }
  return { default: { Scene: FakeScene, Scenes: { Events: { SHUTDOWN: 'shutdown' } }, Scale: { Events: { RESIZE: 'resize' } } } };
});

vi.mock('../src/game/systems/AccountSystem.ts', () => ({
  accountSystem: { refresh: async () => {}, view: () => ({ playMode: 'legacy' }), subscribe: () => () => {} }
}));
vi.mock('../src/game/ui/accountControls.ts', () => ({ accountEntryAllowed: () => true, mountAccountButton: () => undefined }));
vi.mock('../src/game/systems/Settings.ts', () => ({
  loadBest: () => null, loadLegacyBest: () => null,
  loadSettings: () => ({ masterVolume: 1, musicVolume: 1, sfxVolume: 1, musicOn: true, sfxOn: true, gameSpeed: 1 })
}));
vi.mock('../src/game/systems/SoundManager.ts', () => ({ SoundManager: { get: () => ({ unlock: vi.fn(), click: vi.fn() }) } }));
vi.mock('../src/game/systems/ScoreRetry.ts', () => ({
  scoreRetryRepository: { view: async () => ({ status: 'none' }) }, submitRetainedScore: vi.fn()
}));
vi.mock('../src/game/ui/tokens.ts', () => ({
  C: { dangerBright: '#f66', textSecondary: '#ddd', textMuted: '#999', textPrimary: '#fff', health: '#6f6', gold: '#fc6', goldBright: '#fd8', bgPanel: '#111' },
  FONT_DISPLAY: 'Cinzel', style: () => ({})
}));
vi.mock('../src/game/ui/components.ts', () => ({ etchedFrame: () => ({}) }));
vi.mock('../src/game/ui/ScrollSheet.ts', () => ({ ScrollSheet: class { destroy() {} } }));
vi.mock('../src/game/art/menubg.ts', () => ({ paintVista: () => {} }));
vi.mock('../src/game/art/artkit.ts', () => ({ emblemKey: () => 'emblem' }));

import { MainMenuScene } from '../src/game/scenes/MainMenuScene.ts';

type StubEl = any;
function makeEl(tag: string): StubEl {
  const el: StubEl = {
    tag, type: '', className: '', textContent: '', disabled: false, style: {}, attrs: {}, children: [], listeners: {},
    appendChild(child: StubEl) { this.children.push(child); return child; },
    setAttribute(k: string, v: string) { this.attrs[k] = v; },
    addEventListener(type: string, handler: () => void) { (this.listeners[type] ??= []).push(handler); },
    getBoundingClientRect() { return { left: 0, top: 0, width: 1280, height: 720 }; },
    remove() { this.removed = true; },
    click() { for (const handler of this.listeners.click ?? []) handler(); }
  };
  return el;
}

let host: StubEl;
beforeEach(() => {
  host = makeEl('div');
  vi.stubGlobal('document', { createElement: (tag: string) => makeEl(tag), getElementById: () => host });
});
afterEach(() => vi.unstubAllGlobals());

const flush = async () => { for (let i = 0; i < 10; i++) await Promise.resolve(); };

describe('main-menu accessible control layer', () => {
  it('mirrors every menu destination with a labelled DOM button', async () => {
    const scene: any = new MainMenuScene();
    scene.create();
    await flush();

    const root = host.children[0];
    expect(root.className).toBe('a11y-actions');
    expect(root.children.map((button: StubEl) => button.textContent))
      .toEqual(['Campaign', 'Classic Siege', 'Hall of Legends', 'Settings', 'Progression']);
    expect(root.children.map((button: StubEl) => button.attrs['aria-label']))
      .toEqual(['Campaign', 'Classic Siege', 'Hall of Legends', 'Settings', 'Progression']);
  });

  it('activates the same destination as the canvas control', async () => {
    const scene: any = new MainMenuScene();
    scene.create();
    await flush();

    const buttons = host.children[0].children;
    buttons[0].click();
    expect(scene.scene.start).toHaveBeenCalledWith('Preload', { stage: 'campaign', destination: 'Campaign' });
    buttons[2].click();
    expect(scene.scene.start).toHaveBeenCalledWith('Leaderboard', {});
  });

  it('removes the layer when the menu shuts down', async () => {
    const scene: any = new MainMenuScene();
    scene.create();
    await flush();
    const root = host.children[0];
    scene.events.emit('shutdown');
    expect(root.removed).toBe(true);
  });
});
