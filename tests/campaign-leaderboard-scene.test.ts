import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const boardMocks = vi.hoisted(() => ({
  displays: [] as Array<Record<string, any>>,
  sheets: [] as Array<{ title: string; lines: string[]; actions: Array<{ label: string; action: () => void }> }>,
  fetchLeaderboard: vi.fn(),
  fetchCampaignLeaderboard: vi.fn(),
  sound: { stopMusic: vi.fn(), click: vi.fn(), unlock: vi.fn() },
  accountView: null as any,
  retryView: { status: 'empty', record: null, persisted: false, warning: null } as any
}));

vi.mock('phaser', () => {
  class FakeDisplay {
    kind = '';
    args: unknown[] = [];
    x = 0;
    y = 0;
    width = 0;
    height = 0;
    initialText = '';
    currentText = '';
    textHistory: string[] = [];
    handlers = new Map<string, (...args: any[]) => void>();
    destroyed = false;
    visible = true;
    mask: { destroy?: () => void } | null = null;
    filters: null = null;
    setOrigin() { return this; }
    setDisplaySize() { return this; }
    setStrokeStyle() { return this; }
    setStroke() { return this; }
    setShadow() { return this; }
    setFontSize() { return this; }
    setCrop() { return this; }
    emit() { return this; }
    getBounds() { return { x: this.x, y: this.y, centerX: this.x, centerY: this.y, width: this.width, height: this.height }; }
    getWorldTransformMatrix() { return { tx: this.x, ty: this.y }; }
    setInteractive() { return this; }
    setFillStyle() { return this; }
    setPosition() { return this; }
    setScale() { return this; }
    setRotation() { return this; }
    setY(value?: number) { if (typeof value === 'number') this.y = value; return this; }
    setX(value?: number) { if (typeof value === 'number') this.x = value; return this; }
    setTint() { return this; }
    setAlign() { return this; }
    setVisible(value = true) { this.visible = value; return this; }
    setDepth() { return this; }
    setWordWrapWidth() { return this; }
    setAlpha() { return this; }
    setColor() { return this; }
    setMask(mask: { destroy?: () => void } | null) { this.mask = mask; return this; }
    clearMask(destroyMask = false) {
      if (destroyMask) this.mask?.destroy?.();
      this.mask = null;
      return this;
    }
    enableFilters() { return this; }
    setText(value: string) { this.currentText = value; this.textHistory.push(value); return this; }
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
      once: (event: string, callback: () => void) => {
        this.listeners.set(event, [...(this.listeners.get(event) ?? []), callback]);
      },
      emit: (event: string) => {
        const callbacks = this.listeners.get(event) ?? [];
        this.listeners.delete(event);
        callbacks.forEach((callback) => callback());
      }
    };
    scale = { width: 1280, height: 720, on: vi.fn(), off: vi.fn() };
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
      display.kind = kind;
      display.args = args;
      display.x = Number(args[0]) || 0;
      display.y = Number(args[1]) || 0;
      if (kind === 'rectangle') {
        display.width = Number(args[2]) || 0;
        display.height = Number(args[3]) || 0;
      }
      if (kind === 'text') {
        display.currentText = String(args[2] ?? '');
        display.initialText = display.currentText;
        display.width = display.initialText.length * 7;
        display.height = 16;
      }
      this.children.list.push(display);
      boardMocks.displays.push(display);
      return display;
    }
    constructor(_key: string) {}
  }

  class FakeGeometryMask {
    geometryMask: FakeDisplay | null;
    constructor(_scene: FakeScene, graphicsGeometry: FakeDisplay) { this.geometryMask = graphicsGeometry; }
    destroy() { this.geometryMask = null; }
  }

  return {
    default: {
      Scene: FakeScene,
      Display: { Masks: { GeometryMask: FakeGeometryMask } },
      Scenes: { Events: { SHUTDOWN: 'shutdown' } },
      Scale: { Events: { RESIZE: 'resize' } }
    }
  };
});

vi.mock('../src/api/leaderboardClient.ts', () => ({
  submitScore: vi.fn(),
  fetchLeaderboard: boardMocks.fetchLeaderboard,
  fetchCampaignLeaderboard: boardMocks.fetchCampaignLeaderboard
}));
vi.mock('../src/game/systems/ScoreRetry.ts', () => ({
  get scoreRetryRepository() {
    return { view: async () => boardMocks.retryView };
  }
}));
vi.mock('../src/game/systems/AccountSystem.ts', () => ({
  get accountSystem() {
    return { view: () => boardMocks.accountView };
  }
}));
vi.mock('../src/game/systems/SoundManager.ts', () => ({ SoundManager: { get: () => boardMocks.sound } }));
vi.mock('../src/game/ui/tokens.ts', () => ({
  C: {
    dangerBright: '#f66', textSecondary: '#ddd', textMuted: '#999', textPrimary: '#fff',
    health: '#6f6', gold: '#fc6', goldBright: '#fd8'
  },
  FONT_DISPLAY: 'Cinzel',
  FONT_UI: 'Inter',
  style: () => ({})
}));
vi.mock('../src/game/art/menubg.ts', () => ({ paintVista: () => {} }));
vi.mock('../src/game/ui/ScrollSheet.ts', () => ({
  ScrollSheet: class {
    constructor(_scene: unknown, parent: any, _bounds: unknown, title: string, _onClose?: unknown) {
      const entry = { title, lines: [] as string[], actions: [] as Array<{ label: string; action: () => void }> };
      boardMocks.sheets.push(entry);
      parent?.add?.({});
      const active = entry;
      (this as any).text = (_y: number, value: string) => { active.lines.push(value); return { height: 16 }; };
      (this as any).action = (_y: number, label: string, action: () => void) => { active.actions.push({ label, action }); };
    }
    destroy() {}
  }
}));

import { LeaderboardScene } from '../src/game/scenes/LeaderboardScene.ts';
import { CampaignScene } from '../src/game/scenes/CampaignScene.ts';
import { CampaignRepository } from '../src/game/campaign/progress.ts';

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
};

const flushPromises = async () => {
  for (let i = 0; i < 20; i++) await Promise.resolve();
};

const classicRow = (overrides: Record<string, unknown> = {}) => ({
  id: 1, playerName: 'Aria', difficulty: 'medium', highestWave: 30, finalScore: 90000,
  enemiesKilled: 2000, bossesKilled: 3, remainingLives: 10, gameDurationSeconds: 1500,
  runId: 'classic-run-0001', gameVersion: '0.3.0', scoreVersion: 1, wavesCompleted: 30,
  outcome: 'victory', siegeBossesDefeated: 7, createdAt: '2026-10-08T00:00:00.000Z', ...overrides
});

const campaignRow = (overrides: Record<string, unknown> = {}) => ({
  playerId: 'player-a', nickname: 'Aria', missionsCompleted: 3, totalStars: 8, totalScore: 6400, ...overrides
});

const guestView = () => ({
  state: 'signed-out', config: null, playMode: 'guest', guestName: 'Aria', guestPersisted: true,
  session: null, profile: null, warning: null, pending: 0, progressSync: 'synced', resultSync: 'synced',
  acknowledgedRevision: null, progressDirty: false
});

const accountView = () => ({
  state: 'ready', config: null, playMode: 'account', guestName: '', guestPersisted: true,
  session: { account: { playerId: 'player-a', generation: 'g1' }, nickname: 'Aria', csrf: 'csrf', expiresAt: Date.now() + 3600_000, canDelete: true },
  profile: null, warning: null, pending: 2, progressSync: 'pending', resultSync: 'pending',
  acknowledgedRevision: 1, progressDirty: true
});

type Internals = {
  mode: string;
  tabs: Array<{ filter: string; box: { fire: (event: string) => void } }>;
  modeTabs: Array<{ mode: string; box: { fire: (event: string) => void; height: number } }>;
  records: Array<{ runId: string }>;
  campaignRecords: Array<{ playerId: string }>;
  handleResize: () => void;
};

const internalsOf = (scene: LeaderboardScene): Internals => scene as unknown as Internals;
const texts = () => boardMocks.displays.filter((d) => d.kind === 'text').map((d) => d.currentText as string);

beforeEach(() => {
  boardMocks.displays.length = 0;
  boardMocks.sheets.length = 0;
  boardMocks.fetchLeaderboard.mockReset().mockResolvedValue({ ok: true, scores: [] });
  boardMocks.fetchCampaignLeaderboard.mockReset().mockResolvedValue({ ok: true, scores: [] });
  boardMocks.accountView = guestView();
  boardMocks.retryView = { status: 'empty', record: null, persisted: false, warning: null };
});

afterEach(() => vi.clearAllMocks());

describe('campaign leaderboard scene modes', () => {
  it('defaults to classic and leaves the campaign client untouched', async () => {
    const scene = new LeaderboardScene();
    scene.init({});
    scene.create();
    await flushPromises();
    expect(boardMocks.fetchLeaderboard).toHaveBeenCalledTimes(1);
    expect(boardMocks.fetchLeaderboard).toHaveBeenCalledWith(undefined, 20);
    expect(boardMocks.fetchCampaignLeaderboard).not.toHaveBeenCalled();
    expect(internalsOf(scene).mode).toBe('classic');
  });

  it('loads the campaign board and highlights the signed-in account only', async () => {
    boardMocks.accountView = accountView();
    boardMocks.fetchCampaignLeaderboard.mockResolvedValue({
      ok: true,
      scores: [campaignRow(), campaignRow({ playerId: 'player-b', nickname: 'Bram', missionsCompleted: 1, totalStars: 3, totalScore: 2100 })]
    });
    const scene = new LeaderboardScene();
    scene.init({ mode: 'campaign' });
    scene.create();
    await flushPromises();
    expect(boardMocks.fetchCampaignLeaderboard).toHaveBeenCalledWith(20);
    expect(boardMocks.fetchLeaderboard).not.toHaveBeenCalled();
    expect(internalsOf(scene).campaignRecords.map((row) => row.playerId)).toEqual(['player-a', 'player-b']);
    expect(texts().some((text) => text.includes('Aria') && text.includes('YOU'))).toBe(true);
    expect(texts().some((text) => text.includes('Bram') && text.includes('YOU'))).toBe(false);
    expect(texts()).toEqual(expect.arrayContaining(['MISSIONS', 'STARS']));
  });

  it('ignores a classic response that resolves after switching to campaign', async () => {
    const classic = deferred<{ ok: true; scores: Array<Record<string, unknown>> }>();
    const campaign = deferred<{ ok: true; scores: Array<Record<string, unknown>> }>();
    boardMocks.fetchLeaderboard.mockReturnValueOnce(classic.promise);
    boardMocks.fetchCampaignLeaderboard.mockReturnValueOnce(campaign.promise);
    const scene = new LeaderboardScene();
    scene.init({});
    scene.create();
    internalsOf(scene).modeTabs.find((tab) => tab.mode === 'campaign')!.box.fire('pointerdown');
    classic.resolve({ ok: true, scores: [classicRow()] });
    await flushPromises();
    expect(internalsOf(scene).records).toEqual([]);
    expect(internalsOf(scene).campaignRecords).toEqual([]);
    campaign.resolve({ ok: true, scores: [campaignRow()] });
    await flushPromises();
    expect(internalsOf(scene).campaignRecords.map((row) => row.playerId)).toEqual(['player-a']);
    expect(internalsOf(scene).records).toEqual([]);
  });

  it('ignores a campaign response that resolves after switching back to classic', async () => {
    const campaign = deferred<{ ok: true; scores: Array<Record<string, unknown>> }>();
    const classic = deferred<{ ok: true; scores: Array<Record<string, unknown>> }>();
    boardMocks.fetchCampaignLeaderboard.mockReturnValueOnce(campaign.promise);
    boardMocks.fetchLeaderboard.mockReturnValueOnce(classic.promise);
    const scene = new LeaderboardScene();
    scene.init({ mode: 'campaign' });
    scene.create();
    internalsOf(scene).modeTabs.find((tab) => tab.mode === 'classic')!.box.fire('pointerdown');
    campaign.resolve({ ok: true, scores: [campaignRow()] });
    await flushPromises();
    expect(internalsOf(scene).campaignRecords).toEqual([]);
    classic.resolve({ ok: true, scores: [classicRow()] });
    await flushPromises();
    expect(internalsOf(scene).records.map((row) => row.runId)).toEqual(['classic-run-0001']);
    expect(internalsOf(scene).campaignRecords).toEqual([]);
  });

  it('clears classic rows immediately on mode change and re-renders retained campaign rows while loading', async () => {
    boardMocks.fetchLeaderboard.mockResolvedValue({ ok: true, scores: [classicRow()] });
    const campaign = deferred<{ ok: true; scores: Array<Record<string, unknown>> }>();
    boardMocks.fetchCampaignLeaderboard.mockReturnValueOnce(campaign.promise);
    const scene = new LeaderboardScene();
    scene.init({});
    scene.create();
    await flushPromises();
    expect(internalsOf(scene).records).toHaveLength(1);
    const renderedBefore = (scene as unknown as { rowViews: unknown[] }).rowViews.length;
    expect(renderedBefore).toBeGreaterThan(0);
    internalsOf(scene).modeTabs.find((tab) => tab.mode === 'campaign')!.box.fire('pointerdown');
    expect((scene as unknown as { rowViews: unknown[] }).rowViews).toEqual([]);
    campaign.resolve({ ok: true, scores: [campaignRow()] });
    await flushPromises();
    expect(internalsOf(scene).campaignRecords).toHaveLength(1);
  });

  it('preserves campaign rows across a failed refresh and retries the campaign endpoint', async () => {
    boardMocks.fetchCampaignLeaderboard
      .mockResolvedValueOnce({ ok: true, scores: [campaignRow()] })
      .mockResolvedValueOnce({ ok: false, message: 'Worker unavailable.' });
    const scene = new LeaderboardScene();
    scene.init({ mode: 'campaign' });
    scene.create();
    await flushPromises();
    expect(internalsOf(scene).campaignRecords).toHaveLength(1);
    const retry = boardMocks.displays.find((display) => display.kind === 'rectangle' && display.args[2] === 144)!;
    retry.fire('pointerdown');
    await flushPromises();
    expect(boardMocks.fetchCampaignLeaderboard).toHaveBeenCalledTimes(2);
    expect(boardMocks.fetchLeaderboard).not.toHaveBeenCalled();
    expect(internalsOf(scene).campaignRecords).toHaveLength(1);
    const status = boardMocks.displays.find((display) => display.initialText === 'Consulting the archives...')!;
    expect(status.currentText).toContain('Showing last successful board.');
  });

  it('replaces a stale classic list with an empty board on empty success', async () => {
    boardMocks.fetchLeaderboard
      .mockResolvedValueOnce({ ok: true, scores: [classicRow()] })
      .mockResolvedValueOnce({ ok: true, scores: [] });
    const scene = new LeaderboardScene();
    scene.init({});
    scene.create();
    await flushPromises();
    const stale = internalsOf(scene).records;
    expect(stale).toHaveLength(1);
    const retry = boardMocks.displays.find((display) => display.kind === 'rectangle' && display.args[2] === 144)!;
    retry.fire('pointerdown');
    expect((scene as unknown as { rowViews: unknown[] }).rowViews).toHaveLength(1);
    await flushPromises();
    expect(internalsOf(scene).records).toEqual([]);
    expect(internalsOf(scene).records).not.toBe(stale);
    const status = boardMocks.displays.find((display) => display.initialText === 'Consulting the archives...')!;
    expect(status.currentText).toContain('No champions yet.');
  });

  it('explains campaign failures with account guidance instead of the classic retry repository', async () => {
    boardMocks.fetchCampaignLeaderboard.mockResolvedValue({ ok: false, message: 'Worker unavailable.' });
    const scene = new LeaderboardScene();
    scene.init({ mode: 'campaign' });
    scene.create();
    await flushPromises();
    const status = boardMocks.displays.find((display) => display.initialText === 'Consulting the archives...')!;
    expect(status.currentText).toContain('Guest progress stays in this browser.');
    expect(status.currentText).not.toContain('saved score retry');
  });

  it('shows pending sync context for a signed-in campaign failure', async () => {
    boardMocks.accountView = accountView();
    boardMocks.fetchCampaignLeaderboard.mockResolvedValue({ ok: false, message: 'Worker unavailable.' });
    const scene = new LeaderboardScene();
    scene.init({ mode: 'campaign' });
    scene.create();
    await flushPromises();
    const status = boardMocks.displays.find((display) => display.initialText === 'Consulting the archives...')!;
    expect(status.currentText).toContain('Pending sync');
  });

  it('carries the board mode through resize restarts', () => {
    const scene = new LeaderboardScene();
    scene.init({ mode: 'campaign' });
    scene.create();
    internalsOf(scene).handleResize();
    expect(scene.scene.restart).toHaveBeenCalledWith({ mode: 'campaign', filter: 'overall', highlightRunId: undefined });
  });

  it('uses 44px mode hit targets', () => {
    const scene = new LeaderboardScene();
    scene.init({});
    scene.create();
    for (const tab of internalsOf(scene).modeTabs) {
      expect(tab.box.height).toBeGreaterThanOrEqual(44);
    }
  });
});

describe('campaign map leaderboard entry', () => {
  it('opens the campaign board from the mastery sheet', () => {
    const scene: any = new CampaignScene();
    scene.campaignView = new CampaignRepository(null).view();
    scene.scale = { width: 1280, height: 720 };
    scene.add = { container: () => ({ setDepth: () => ({ add: () => {} }), add: () => {} }) };
    scene.scene = { start: vi.fn() };
    scene.sheet = null;
    scene.sheetRoot = null;
    scene.openMastery();
    const entry = boardMocks.sheets[boardMocks.sheets.length - 1];
    const rankings = entry.actions.find((action) => action.label === 'Campaign rankings');
    expect(rankings).toBeDefined();
    rankings!.action();
    expect(scene.scene.start).toHaveBeenCalledWith('Leaderboard', { mode: 'campaign' });
  });
});
