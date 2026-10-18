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
    children = { list: [] as unknown[] };
    add = {
      text: () => display(), rectangle: () => display(), container: () => display(),
      image: () => display(), graphics: () => display()
    };
    constructor(_key?: string) {}
  }
  function display(): any {
    const target: any = { height: 16, width: 100, text: '', x: 0, y: 0, alpha: 1 };
    const proxy: any = new Proxy(target, {
      get(object, prop) {
        if (prop in object) return (object as any)[prop];
        return () => proxy;
      }
    });
    return proxy;
  }
  return { default: { Scene: FakeScene, Scenes: { Events: { SHUTDOWN: 'shutdown' } }, Scale: { Events: { RESIZE: 'resize' } } } };
});

vi.mock('../src/game/systems/AccountSystem.ts', () => ({
  accountSystem: {
    view: () => ({ playMode: 'legacy' }),
    currentPlayerName: () => 'Warden',
    renameGuest: async () => ({ ok: true })
  }
}));
vi.mock('../src/game/ui/accountControls.ts', () => ({ accountEntryAllowed: () => true, mountAccountButton: () => undefined }));
vi.mock('../src/game/systems/Settings.ts', () => {
  const state = { masterVolume: 1, musicVolume: 1, sfxVolume: 1, musicOn: true, sfxOn: true, gameSpeed: 1, difficulty: 'medium', playerName: '' };
  return { loadSettings: () => ({ ...state }), saveSettings: (next: unknown) => Object.assign(state, next) };
});
vi.mock('../src/game/systems/SoundManager.ts', () => ({ SoundManager: { get: () => ({ unlock: vi.fn(), click: vi.fn() }) } }));
vi.mock('../src/game/ui/tokens.ts', () => ({
  C: { dangerBright: '#f66', textSecondary: '#ddd', textMuted: '#999', textPrimary: '#fff', health: '#6f6', gold: '#fc6', goldBright: '#fd8', bgPanel: '#111' },
  FONT_DISPLAY: 'Cinzel', style: () => ({})
}));
vi.mock('../src/game/ui/components.ts', () => ({ etchedFrame: () => ({}) }));
vi.mock('../src/game/ui/ScrollSheet.ts', () => ({ ScrollSheet: class { destroy() {} } }));
vi.mock('../src/game/art/menubg.ts', () => ({ paintVista: () => {} }));
vi.mock('../src/game/art/artkit.ts', () => ({ emblemKey: () => 'emblem' }));

import { DifficultyScene } from '../src/game/scenes/DifficultyScene.ts';

type StubEl = any;
function makeEl(tag: string): StubEl {
  const el: StubEl = {
    tag, type: '', className: '', textContent: '', value: '', disabled: false, style: {}, attrs: {}, children: [], listeners: {},
    appendChild(child: StubEl) { this.children.push(child); return child; },
    replaceChildren() { this.children.length = 0; },
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
  vi.stubGlobal('document', {
    createElement: (tag: string) => makeEl(tag),
    getElementById: () => host,
    body: { appendChild: vi.fn() }
  });
});
afterEach(() => vi.unstubAllGlobals());

function labels(): string[] {
  return host.children[0].children.map((button: StubEl) => button.textContent);
}

describe('difficulty accessible control layer', () => {
  it('mirrors the three difficulty cards and the navigation actions', () => {
    const scene: any = new DifficultyScene();
    scene.create();

    expect(host.children[0].className).toBe('a11y-actions');
    expect(labels()).toEqual([
      'Easy difficulty', 'Medium difficulty (selected)', 'Hard difficulty', 'Back', 'Continue'
    ]);
  });

  it('announces the new selection and starts the chosen siege', () => {
    const scene: any = new DifficultyScene();
    scene.create();

    host.children[0].children[0].click();
    expect(labels()).toEqual([
      'Easy difficulty (selected)', 'Medium difficulty', 'Hard difficulty', 'Back', 'Continue'
    ]);

    host.children[0].children[4].click();
    expect(scene.scene.start).toHaveBeenCalledWith('Preload', expect.objectContaining({ stage: 'gameplay', destination: 'Game' }));
  });

  it('returns to the main menu from Back', () => {
    const scene: any = new DifficultyScene();
    scene.create();

    host.children[0].children[3].click();
    expect(scene.scene.start).toHaveBeenCalledWith('MainMenu');
  });

  it('removes the layer when the scene shuts down', () => {
    const scene: any = new DifficultyScene();
    scene.create();
    const root = host.children[0];
    scene.events.emit('shutdown');
    expect(root.removed).toBe(true);
  });
});
