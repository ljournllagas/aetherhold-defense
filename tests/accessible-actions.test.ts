import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mountAccessibleActions, type AccessibleAction } from '../src/game/ui/accessibleActions.ts';

interface StubEl {
  tag: string; type: string; className: string; textContent: string; disabled: boolean;
  style: Record<string, string>; attrs: Record<string, string>; children: StubEl[];
  listeners: Record<string, Array<() => void>>; removed?: boolean;
  appendChild(child: StubEl): StubEl;
  setAttribute(k: string, v: string): void;
  addEventListener(type: string, handler: () => void): void;
  getBoundingClientRect(): { left: number; top: number; width: number; height: number };
  remove(): void;
  click(): void;
}

function makeEl(tag: string): StubEl {
  const el: StubEl = {
    tag, type: '', className: '', textContent: '', disabled: false, style: {}, attrs: {}, children: [], listeners: {},
    appendChild(child) { this.children.push(child); return child; },
    setAttribute(k, v) { this.attrs[k] = v; },
    addEventListener(type, handler) { (this.listeners[type] ??= []).push(handler); },
    getBoundingClientRect() { return { left: 0, top: 0, width: 0, height: 0 }; },
    remove() { this.removed = true; },
    click() { for (const handler of this.listeners.click ?? []) handler(); }
  };
  return el;
}

let host: StubEl;
function stubDocument(): void {
  host = makeEl('div');
  host.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1000, height: 700 });
  vi.stubGlobal('document', {
    createElement: (tag: string) => makeEl(tag),
    getElementById: (id: string) => (id === 'game-root' ? host : null)
  });
}

function sceneStub() {
  const on = vi.fn(), off = vi.fn();
  let shutdown: (() => void) | null = null;
  const scene = {
    game: { canvas: { getBoundingClientRect: () => ({ left: 10, top: 20, width: 1000, height: 700 }) } },
    scale: { width: 1000, height: 700, on, off },
    events: { once: (event: string, handler: () => void) => { if (event === 'shutdown') shutdown = handler; } }
  };
  return { scene: scene as never, on, off, fireShutdown: () => shutdown?.() };
}

const action = (label: string, x: number, y: number, width: number, height: number, run = vi.fn(), disabled = false): AccessibleAction =>
  ({ label, x, y, width, height, action: run, disabled });

beforeEach(() => { stubDocument(); });
afterEach(() => { vi.unstubAllGlobals(); });

describe('accessible action layer', () => {
  it('mirrors each canvas control as a labelled, ordered DOM button', () => {
    const { scene } = sceneStub();
    mountAccessibleActions(scene, [
      action('Campaign', 200, 396, 294, 70),
      action('Classic Siege', 506, 396, 294, 70),
      action('Settings', 200, 480, 294, 60)
    ]);

    const root = host.children[0];
    expect(root.className).toBe('a11y-actions');
    expect(root.attrs.role).toBe('group');
    const buttons = root.children;
    expect(buttons.map(button => button.textContent)).toEqual(['Campaign', 'Classic Siege', 'Settings']);
    expect(buttons.map(button => button.attrs['aria-label'])).toEqual(['Campaign', 'Classic Siege', 'Settings']);
    expect(buttons.every(button => button.tag === 'button' && button.type === 'button')).toBe(true);
  });

  it('activates once on click and never activates a disabled control', () => {
    const { scene } = sceneStub();
    const run = vi.fn(), blocked = vi.fn();
    const layer = mountAccessibleActions(scene, [action('Campaign', 0, 0, 10, 10, run)])!;
    layer.add(action('Saved Score', 0, 0, 10, 10, blocked, true));

    const buttons = host.children[0].children;
    buttons[0].click();
    buttons[0].click();
    buttons[1].click();
    expect(run).toHaveBeenCalledTimes(2);
    expect(blocked).not.toHaveBeenCalled();
  });

  it('positions buttons over the canvas and follows resize', () => {
    const { scene, on, off } = sceneStub();
    mountAccessibleActions(scene, [action('Campaign', 200, 396, 294, 70)]);
    const button = host.children[0].children[0];
    expect(button.style).toMatchObject({ left: '210px', top: '416px', width: '294px', height: '70px' });
    expect(on).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(off).not.toHaveBeenCalled();
  });

  it('removes the layer and unsubscribes on scene shutdown', () => {
    const { scene, off, fireShutdown } = sceneStub();
    mountAccessibleActions(scene, [action('Campaign', 0, 0, 10, 10)]);
    const root = host.children[0];
    fireShutdown();
    expect(off).toHaveBeenCalledWith('resize', expect.any(Function));
    expect((root as StubEl & { removed?: boolean }).removed).toBe(true);
  });

  it('is a no-op without a document or game root', () => {
    vi.stubGlobal('document', undefined);
    expect(mountAccessibleActions(sceneStub().scene, [action('Campaign', 0, 0, 10, 10)])).toBeNull();
    vi.stubGlobal('document', { createElement: () => makeEl('div'), getElementById: () => null });
    expect(mountAccessibleActions(sceneStub().scene, [action('Campaign', 0, 0, 10, 10)])).toBeNull();
  });
});
