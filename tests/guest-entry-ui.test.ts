import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {accountStatus} from '../src/game/ui/accountControls.ts';
it('never presents guests as cloud-synced',()=>{
  const guest={playMode:'guest' as const,progressSync:'synced' as const,resultSync:'synced' as const,pending:0,progressDirty:false,warning:null,state:'signed-out' as const};
  expect(accountStatus(guest)).toMatch(/browser/i);expect(accountStatus(guest)).not.toBe('Synced');
  expect(accountStatus({...guest,warning:'Guest saves are available in this session only.'})).toMatch(/session only/i);
});

const entryMocks = vi.hoisted(() => ({
  view: null as any,
  initialize: vi.fn(),
  subscribe: vi.fn((listener: (view: unknown) => void) => { listener(entryMocks.view); return () => {}; }),
  enterGuest: vi.fn(async (_name: string) => ({ ok: true, value: null })),
  prepareGoogleSignIn: vi.fn(),
  googleSignInPreflight: vi.fn(async () => ({ allowed: true, requiresLossAcknowledgment: false, message: null })),
  canStartBattle: vi.fn(() => true),
  rename: vi.fn(),
  logout: vi.fn(),
  beginDelete: vi.fn(),
  deleteAccount: vi.fn(),
  cancelDelete: vi.fn(),
  sceneStart: vi.fn(),
  assignedUrl: null as string | null,
  sessionStore: new Map<string, string>()
}));

vi.mock('phaser', () => ({ default: { Scene: class { constructor(_key?: string) {} } } }));
vi.mock('../src/game/systems/AccountSystem.ts', () => ({
  accountSystem: {
    view: () => entryMocks.view,
    initialize: () => entryMocks.initialize(),
    subscribe: (listener: (view: unknown) => void) => entryMocks.subscribe(listener),
    enterGuest: (name: string) => entryMocks.enterGuest(name),
    prepareGoogleSignIn: (ack?: boolean) => entryMocks.prepareGoogleSignIn(ack),
    googleSignInPreflight: () => entryMocks.googleSignInPreflight(),
    canStartBattle: () => entryMocks.canStartBattle(),
    rename: (name: string) => entryMocks.rename(name),
    logout: () => entryMocks.logout(),
    beginDelete: () => entryMocks.beginDelete(),
    deleteAccount: () => entryMocks.deleteAccount(),
    cancelDelete: () => entryMocks.cancelDelete()
  }
}));
vi.mock('../src/game/art/menubg.ts', () => ({ paintVista: () => {} }));

import { LoginScene } from '../src/game/scenes/LoginScene.ts';

type StubEl = {
  tag: string; className: string; textContent: string; children: StubEl[];
  value: string; disabled: boolean; onclick: ((...args: any[]) => unknown) | null; oninput: (() => void) | null;
  attrs: Record<string, string>;
  appendChild(child: StubEl): StubEl; setAttribute(k: string, v: string): void;
  querySelector(sel: string): StubEl | null; focus(): void; setSelectionRange(): void; remove(): void;
  replaceChildren(): void;
  click(): void;
};

function makeEl(tag: string): StubEl {
  const el: StubEl = {
    tag, className: '', textContent: '', children: [], value: '', disabled: false,
    onclick: null, oninput: null, attrs: {},
    appendChild(child) { this.children.push(child); return child; },
    setAttribute(k, v) { this.attrs[k] = v; },
    querySelector(sel) {
      const queue = [...this.children];
      while (queue.length) {
        const next = queue.shift()!;
        if (sel === 'input' && next.tag === 'input') return next;
        queue.push(...next.children);
      }
      return null;
    },
    focus() {}, setSelectionRange() {}, remove() {},
    replaceChildren() { this.children.length = 0; },
    click() { this.onclick?.(); }
  };
  return el;
}

const signedOutView = (overrides = {}) => ({
  state: 'signed-out', config: null, playMode: 'legacy', guestName: '', guestPersisted: true,
  session: null, profile: null, warning: null, pending: 0, progressSync: 'synced', resultSync: 'synced',
  acknowledgedRevision: null, progressDirty: false, ...overrides
});

const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };

function mount(view: unknown, seedDraft?: string) {
  entryMocks.view = view;
  let root: StubEl | null = null;
  vi.stubGlobal('document', {
    createElement: (tag: string) => {
      const el = makeEl(tag);
      if (tag === 'div' && !root) root = el;
      return el;
    },
    getElementById: () => ({ appendChild: () => {} }),
    activeElement: null
  });
  vi.stubGlobal('location', { search: '', pathname: '/', assign: (url: string) => { entryMocks.assignedUrl = url; } });
  vi.stubGlobal('history', { replaceState: () => {} });
  entryMocks.sessionStore.clear();
  if (seedDraft !== undefined) entryMocks.sessionStore.set('aetherhold-account-entry-name', seedDraft);
  vi.stubGlobal('sessionStorage', {
    getItem: (k: string) => entryMocks.sessionStore.get(k) ?? null,
    setItem: (k: string, v: string) => { entryMocks.sessionStore.set(k, v); },
    removeItem: (k: string) => { entryMocks.sessionStore.delete(k); }
  });
  const m = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => m.set(k, v),
    removeItem: (k: string) => m.delete(k), key: (n: number) => [...m.keys()][n], get length() { return m.size; }
  });
  const scene: any = new LoginScene();
  scene.scene = { start: entryMocks.sceneStart };
  scene.events = { once: () => {} };
  scene.init({});
  scene.create();
  return { scene, panel: () => root!.children[0] };
}

const panelOrder = (panel: StubEl) => panel.children.map((child) => {
  if (child.tag === 'label') return `label:${child.children.map((c) => c.tag).join(',')}`;
  if (child.tag === 'button') return `button:${child.textContent}[${child.className}]`;
  if (child.tag === 'div') return `div.${child.className}:${child.textContent}`;
  return `${child.tag}:${child.textContent}`;
});

const buttons = (panel: StubEl) => panel.children.filter((child) => child.tag === 'button');

beforeEach(() => {
  entryMocks.view = signedOutView();
  entryMocks.assignedUrl = null;
  entryMocks.sceneStart.mockReset();
  entryMocks.prepareGoogleSignIn.mockReset().mockResolvedValue({ ok: true, value: { url: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=test' } });
  entryMocks.enterGuest.mockReset().mockResolvedValue({ ok: true, value: null });
  entryMocks.googleSignInPreflight.mockReset().mockResolvedValue({ allowed: true, requiresLossAcknowledgment: false, message: null });
});

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('guest entry order and recovery', () => {
  it('places the guest action next to its name with an or separator before Google', () => {
    const { panel } = mount(signedOutView());
    expect(panelOrder(panel())).toEqual([
      'h1:Welcome, Defender',
      'p:Play as a guest to save in this browser. Google saves progress across devices and lets you submit public scores. Clearing browser data removes guest saves.',
      'label:input',
      'button:Play as Guest[account-primary]',
      'div.account-separator:or',
      'button:Sign in with Google[]',
      'button:Continue playing[]'
    ]);
    expect(panelOrder(panel()).some((row) => row.includes('Retry connection'))).toBe(false);
  });

  it('keeps the typed name and guest entry after a failed Google preparation', async () => {
    entryMocks.prepareGoogleSignIn.mockResolvedValueOnce({ ok: false, code: 'API_UNAVAILABLE', status: 503, message: 'Try again.' });
    const { panel, scene } = mount(signedOutView());
    const input = panel().querySelector('input')!;
    input.value = 'Aria';
    input.oninput!();
    buttons(panel()).find((b) => b.textContent === 'Sign in with Google')!.click();
    await flush();
    expect(entryMocks.assignedUrl).toBeNull();
    expect(panel().querySelector('input')!.value).toBe('Aria');
    expect(panel().children.some((c) => c.className === 'account-warning' && c.textContent.includes('Try again.'))).toBe(true);
    buttons(panel()).find((b) => b.textContent === 'Play as Guest')!.click();
    await flush();
    expect(entryMocks.enterGuest).toHaveBeenCalledWith('Aria');
    expect(scene.scene.start).toHaveBeenCalledWith('MainMenu');
    expect(entryMocks.prepareGoogleSignIn).toHaveBeenCalledTimes(1);
  });

  it('saves the draft and navigates only after successful preparation', async () => {
    const { panel } = mount(signedOutView());
    const input = panel().querySelector('input')!;
    input.value = 'Aria';
    input.oninput!();
    buttons(panel()).find((b) => b.textContent === 'Sign in with Google')!.click();
    await flush();
    expect(entryMocks.sessionStore.get('aetherhold-account-entry-name')).toBe('Aria');
    expect(entryMocks.assignedUrl).toBe('https://accounts.google.com/o/oauth2/v2/auth?client_id=test');
  });

  it('recovers the saved draft when returning to the entry screen', () => {
    const { panel } = mount(signedOutView(), 'Aria');
    expect(panel().querySelector('input')!.value).toBe('Aria');
    expect(entryMocks.sessionStore.has('aetherhold-account-entry-name')).toBe(false);
  });

  it('labels the guest action for returning guests without touching signed-in controls', () => {
    const { panel } = mount(signedOutView({ playMode: 'guest', guestName: 'Aria' }));
    expect(buttons(panel()).map((b) => b.textContent)).toContain('Save name and continue');
  });
});
