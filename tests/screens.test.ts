import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const screenMocks = vi.hoisted(() => ({
  displays: [] as Array<Record<string, any>>,
  submitScore: vi.fn(),
  submitRetainedScore: vi.fn(),
  scoreRetryRepository: null as any,
  realSubmitRetainedScore: null as any,
  fetchLeaderboard: vi.fn(),
  sound: { stopMusic: vi.fn(), click: vi.fn(), unlock: vi.fn() },
  refreshStronghold: vi.fn(),
  legacyBest: null as null | { score: number; wave: number; difficulty: string; date: string; scoreVersion: number }
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
    mask: { destroy?: () => void } | null = null;
    // Phaser 4 exposes these on Game Objects in both renderers. Canvas keeps
    // `filters` null and enableFilters() is a no-op, so ViewportMaskController
    // correctly chooses the GeometryMask path in this renderer-free harness.
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
    setVisible() { return this; }
    setDepth() { return this; }
    setWordWrapWidth() { return this; }
    setAlpha() { return this; }
    setMask(mask: { destroy?: () => void } | null) { this.mask = mask; return this; }
    clearMask(destroyMask = false) {
      if (destroyMask) this.mask?.destroy?.();
      this.mask = null;
      return this;
    }
    enableFilters() { return this; }
    setText(value: string) { this.currentText = value; this.textHistory.push(value); return this; }
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
      screenMocks.displays.push(display);
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
  submitScore: screenMocks.submitScore,
  fetchLeaderboard: screenMocks.fetchLeaderboard
}));
// The pure repository class stays real; only the exported singleton is injected per test
// so each test gets its own store and the service can be observed or delegated.
vi.mock('../src/game/systems/ScoreRetry.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/game/systems/ScoreRetry.ts')>();
  screenMocks.realSubmitRetainedScore = actual.submitRetainedScore;
  return {
    ...actual,
    get scoreRetryRepository() { return screenMocks.scoreRetryRepository; },
    submitRetainedScore: (...args: unknown[]) => screenMocks.submitRetainedScore(...args)
  };
});
vi.mock('../src/game/systems/Settings.ts', () => ({
  loadBest: () => null,
  loadLegacyBest: () => screenMocks.legacyBest,
  loadLegacyBests: () => (screenMocks.legacyBest ? [screenMocks.legacyBest] : []),
  loadSettings: () => ({ masterVolume: 1, musicVolume: 0.5, sfxVolume: 0.7, musicOn: true, sfxOn: true, gameSpeed: 1, difficulty: 'medium', playerName: '' })
}));
vi.mock('../src/game/systems/SoundManager.ts', () => ({ SoundManager: { get: () => screenMocks.sound } }));
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
vi.mock('../src/game/art/terrain.ts', () => ({
  paintBattlefield: (scene: any) => {
    scene.add.image(0, 56, 'map');
    const root = scene.add.container(0, 0);
    const cracks = scene.add.graphics();
    const smoke = scene.add.graphics();
    const ember = scene.add.circle(0, 0, 1, 0);
    const beacon = scene.add.circle(0, 0, 1, 0);
    return { stronghold: { root, cracks, smoke, ember, beacon }, torchFlames: [] };
  },
  refreshStronghold: screenMocks.refreshStronghold
}));

import { GameOverScene } from '../src/game/scenes/GameOverScene.ts';
import { LeaderboardScene } from '../src/game/scenes/LeaderboardScene.ts';
import { MainMenuScene } from '../src/game/scenes/MainMenuScene.ts';
import { ScoreRetryRepository, SCORE_RETRY_KEY, type RetryLock, type RetryStore } from '../src/game/systems/ScoreRetry.ts';
import { resultFixture } from './helpers/progressionResult.ts';
import { SCORE_VERSION } from '../src/shared/version.ts';

function serialLock(): RetryLock {
  let tail: Promise<unknown> = Promise.resolve();
  return work => {
    const result = tail.then(work);
    tail = result.catch(() => {});
    return result;
  };
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

/** A valid era-3 terminal payload for repository and submission tests. */
const retryPayload = (runId: string) => resultFixture({ highestWave: 30, wavesCompleted: 30, outcome: 'victory', siegeBossesDefeated: 7 }, 10, { runId });

const gameOverData = (runId: string) => {
  const payload = resultFixture({ highestWave: 4, wavesCompleted: 3, outcome: 'defeat', siegeBossesDefeated: 0 }, 0, { runId });
  return {
    ...payload,
    isPersonalBest: false,
    breakdown: {
      killScore: 120, waveBonus: 400, bossBonus: 0, livesBonus: 0,
      baseScore: 520, difficultyMultiplier: 1.5, finalScore: payload.finalScore
    }
  };
};

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
};

const flushPromises = async () => {
  for (let i = 0; i < 20; i++) await Promise.resolve();
};

describe('screen lifecycle and leaderboard states', () => {
  let retryBytes: Map<string, string>;
  beforeEach(() => {
    screenMocks.displays.length = 0;
    screenMocks.submitScore.mockReset().mockResolvedValue({ ok: true, id: 1 });
    screenMocks.fetchLeaderboard.mockReset().mockResolvedValue({ ok: true, scores: [] });
    screenMocks.refreshStronghold.mockClear();
    screenMocks.legacyBest = null;
    const memory = memoryStore();
    retryBytes = memory.bytes;
    screenMocks.scoreRetryRepository = new ScoreRetryRepository(memory.store, serialLock());
    screenMocks.submitRetainedScore.mockReset().mockImplementation(
      (payload: unknown, repository: unknown, expected: unknown) => screenMocks.realSubmitRetainedScore(payload, repository, expected)
    );
  });

  afterEach(() => vi.clearAllMocks());

  const texts = () => screenMocks.displays.filter((d) => d.kind === 'text').map((d) => d.currentText as string);
  const press = (label: string) => {
    const captions = screenMocks.displays.filter((d) => d.kind === 'text' && d.initialText === label);
    const caption = captions[captions.length - 1]; if (!caption) throw new Error(`No ${label} action`);
    screenMocks.displays[screenMocks.displays.indexOf(caption) - 1].fire('pointerdown');
  };
  const resultData = (overrides: Record<string, unknown> = {}) => ({ ...gameOverData('run-result-0001'), ...overrides }) as unknown as ReturnType<typeof gameOverData>;

  it.each([[390, 844], [800, 400], [1280, 720]])('loads Campaign through its preload stage at %ix%i', (width, height) => {
    const scene = new MainMenuScene(); (scene.scale as any).width = width; (scene.scale as any).height = height; scene.create();
    const campaignButton = (scene as any).children.list.find((display: any) => display.kind === 'rectangle' && display.handlers.has('pointerdown'));
    expect(campaignButton).toBeDefined();
    campaignButton.fire('pointerdown');
    expect(scene.scene.start).toHaveBeenCalledWith('Preload', { stage: 'campaign', destination: 'Campaign' });
    scene.events.emit('shutdown');
  });

  it.each([
    ['victory', { outcome: 'victory', highestWave: 30, wavesCompleted: 30, remainingLives: 12, siegeBossesDefeated: 7 }], ['defeat', {}],
    ['siege failure', { outcome: 'siege-failed', highestWave: 10, wavesCompleted: 9, remainingLives: 15 }],
    ['endless defeat', { highestWave: 31, wavesCompleted: 30, siegeBossesDefeated: 7 }]
  ] as Array<[string, Record<string, unknown>]>)('never submits automatically for a %s and offers Submit Score', async (_n, overrides) => {
    new GameOverScene().create(resultData(overrides)); await flushPromises();
    expect(screenMocks.submitScore).not.toHaveBeenCalled(); expect(texts()).toContain('Submit Score');
  });
  it('submits one projected snapshot per press and ignores presses while submitting', async () => {
    const pending = deferred<{ ok: boolean; id: number }>(); screenMocks.submitScore.mockReturnValueOnce(pending.promise);
    new GameOverScene().create({ ...gameOverData('run-submit-0001'), worldSnapshot: { mapId: 'ancient-border-keep', strongholdRatio: 0, towers: [], enemies: [] } } as ReturnType<typeof gameOverData>);
    press('Submit Score'); press('Submit Score');
    await flushPromises();
    expect(screenMocks.submitScore).toHaveBeenCalledTimes(1);
    const payload = screenMocks.submitScore.mock.calls[0][0] as Record<string, unknown>;
    expect(Object.keys(payload).sort()).toEqual(['playerName', 'difficulty', 'highestWave', 'finalScore', 'enemiesKilled', 'bossesKilled', 'remainingLives', 'gameDurationSeconds', 'runId', 'gameVersion', 'scoreVersion', 'wavesCompleted', 'outcome', 'siegeBossesDefeated'].sort());
    expect(payload).not.toHaveProperty('worldSnapshot');
    pending.resolve({ ok: true, id: 7 }); await flushPromises();
    expect(texts().some((t) => t.startsWith('Score saved to the Hall of Legends'))).toBe(true);
    press('Score Submitted'); press('Submit Score');
    await flushPromises();
    expect(screenMocks.submitScore).toHaveBeenCalledTimes(1);
  });
  it('shows the failure reason and retries the identical snapshot', async () => {
    screenMocks.submitScore.mockResolvedValueOnce({ ok: false, error: 'offline' }).mockResolvedValueOnce({ ok: true, id: 2 });
    new GameOverScene().create(gameOverData('run-retry-0001'));
    press('Submit Score'); await flushPromises();
    expect(texts().some((t) => t.includes('offline'))).toBe(true);
    press('Submit Score'); await flushPromises();
    expect(screenMocks.submitScore).toHaveBeenCalledTimes(2);
    expect(screenMocks.submitScore.mock.calls[1][0]).toEqual(screenMocks.submitScore.mock.calls[0][0]);
  });
  it('treats a duplicate run as recorded', async () => {
    screenMocks.submitScore.mockResolvedValueOnce({ ok: false, duplicate: true, error: 'dup' });
    new GameOverScene().create(gameOverData('run-dup-0001'));
    press('Submit Score'); await flushPromises(); press('Submit Score');
    expect(texts()).toContain('This run was already recorded.'); expect(screenMocks.submitScore).toHaveBeenCalledTimes(1);
  });
  it('ignores a stale response after the screen restarts', async () => {
    const first = deferred<{ ok: boolean; id: number }>(); screenMocks.submitScore.mockReturnValueOnce(first.promise);
    const scene = new GameOverScene(); scene.create(gameOverData('run-first-0001')); press('Submit Score');
    scene.events.emit('shutdown'); scene.create(gameOverData('run-second-0002'));
    first.resolve({ ok: true, id: 1 }); await flushPromises();
    expect(texts().some((t) => t.startsWith('Score saved'))).toBe(false); expect(screenMocks.fetchLeaderboard).not.toHaveBeenCalled();
  });
  it('settles after results navigation but never redraws the closed screen', async () => {
    const pending = deferred<{ result: { ok: boolean; id: number }; retry: { status: 'empty'; record: null; persisted: boolean; warning: null }; attempted: null }>();
    screenMocks.submitRetainedScore.mockReturnValueOnce(pending.promise);
    const scene = new GameOverScene();
    scene.create(gameOverData('retained-navigation-0001'));
    press('Submit Score');
    scene.events.emit('shutdown');
    const draws = screenMocks.displays.length;
    pending.resolve({ result: { ok: true, id: 1 }, retry: { status: 'empty', record: null, persisted: false, warning: null }, attempted: null });
    await flushPromises();
    expect(screenMocks.displays.length).toBe(draws);
  });
  it('shows the explicit replacement note when another saved run is retained', async () => {
    await screenMocks.scoreRetryRepository.stage(retryPayload('retry-previous-0001'));
    screenMocks.submitRetainedScore.mockImplementation(() => new Promise(() => {}));
    new GameOverScene().create(gameOverData('retry-current-0001'));
    await flushPromises();
    expect(texts()).toContain('Submitting replaces the previous saved score retry.');
    expect(screenMocks.submitScore).not.toHaveBeenCalled();
  });
  it('guards repeated menu retry clicks synchronously while the repository claim awaits a lock', async () => {
    const { store } = memoryStore(), lock = serialLock(), repo = new ScoreRetryRepository(store, lock);
    const saved = (await repo.stage(retryPayload('retry-doubleclick-0001'))).record!;
    let release!: () => void;
    const held = lock(() => new Promise<void>((resolve) => { release = resolve; }));
    await Promise.resolve();
    screenMocks.scoreRetryRepository = repo;
    const scene = new MainMenuScene(); scene.create();
    const menu = scene as unknown as { retrySavedScore(record: typeof saved): Promise<void> };
    screenMocks.submitScore.mockReset().mockResolvedValue({ ok: true, id: 1 });
    const one = menu.retrySavedScore(saved), two = menu.retrySavedScore(saved);
    await Promise.resolve();
    expect(screenMocks.submitScore).not.toHaveBeenCalled();
    release(); await held; await Promise.all([one, two]);
    expect(screenMocks.submitScore).toHaveBeenCalledTimes(1);
  });
  it('keeps the A attempt identity after B replaces it and refuses a stale results retry', async () => {
    const { bytes, store } = memoryStore(), repo = new ScoreRetryRepository(store, serialLock());
    screenMocks.scoreRetryRepository = repo;
    let failA!: (result: { ok: boolean; error: string }) => void;
    screenMocks.submitScore.mockReset();
    screenMocks.submitScore.mockImplementation(() => new Promise((resolve) => { failA = resolve; }));
    const first = retryPayload('retry-result-A-0001'), second = retryPayload('retry-result-B-0001');
    const scene = new GameOverScene(); scene.create({ ...gameOverData(first.runId), ...first });
    press('Submit Score');
    for (let i = 0; i < 20 && !failA; i++) await Promise.resolve();
    expect(screenMocks.submitScore).toHaveBeenCalledTimes(1);
    const stagedA = JSON.parse(bytes.get(SCORE_RETRY_KEY)!);
    await repo.stage(second); const rawB = bytes.get(SCORE_RETRY_KEY);
    failA({ ok: false, error: 'offline' });
    await flushPromises();
    expect((scene as unknown as { scoreAttempt: unknown }).scoreAttempt).toEqual(stagedA);
    press('Submit Score');
    await flushPromises();
    expect(screenMocks.submitScore).toHaveBeenCalledTimes(1); expect(bytes.get(SCORE_RETRY_KEY)).toBe(rawB);
    expect(screenMocks.displays.some((d) => String(d.currentText || d.initialText).includes('newer attempt'))).toBe(true);
  });
  it.each([
    [{ outcome: 'victory', highestWave: 30, wavesCompleted: 30, remainingLives: 12, siegeBossesDefeated: 7 }, 'SIEGE COMPLETE', 'The Borderkeep stands. The siege is won.', 12],
    [{ outcome: 'siege-failed', highestWave: 10, wavesCompleted: 9, remainingLives: 15 }, 'SIEGE FAILED', 'Siege failed: the first boss escaped', 15],
    [{ outcome: 'siege-failed', highestWave: 30, wavesCompleted: 29, remainingLives: 4, siegeBossesDefeated: 3 }, 'SIEGE FAILED', 'Siege failed: the final boss escaped', 4],
    [{ highestWave: 31, wavesCompleted: 30, siegeBossesDefeated: 7 }, 'GAME OVER', 'Siege won · The Borderkeep fell in endless.', 0]
  ] as Array<[Record<string, unknown>, string, string, number]>)('titles %o and keeps actual lives', (overrides, title, line, lives) => {
    new GameOverScene().create(resultData(overrides));
    expect(texts()).toEqual(expect.arrayContaining([title, line, `Lives remaining · ${lives}`]));
  });
  it('lists unlocks and labels a retained legacy best separately', () => {
    screenMocks.legacyBest = { score: 100000, wave: 40, difficulty: 'hard', date: '2026-01-01T00:00:00.000Z', scoreVersion: 1 };
    new GameOverScene().create(resultData({ unlocksEarned: [{ branchId: 'volley', saved: true }, { branchId: 'thunderlord', saved: false }] }));
    expect(texts()).toEqual(expect.arrayContaining(['Legacy era 1 best · 100,000', 'Unlocked: Volley, Thunderlord (not saved)']));
  });

  it('reports local progress truthfully and names a saved retry only when one exists', async () => {
    screenMocks.fetchLeaderboard.mockResolvedValueOnce({ ok: false, message: 'Worker unavailable.' });
    const scene = new LeaderboardScene();
    scene.init({ filter: 'overall' });
    scene.create();
    await flushPromises();
    const status = screenMocks.displays.find((display) => display.initialText === 'Consulting the archives...')!;
    expect(status.currentText).toContain('Local progress is unaffected.');
    expect(status.currentText).not.toContain('Your run remains saved locally.');
    expect(status.currentText).not.toContain('saved score retry');
  });

  it('names a retained saved retry in the leaderboard failure text', async () => {
    await screenMocks.scoreRetryRepository.stage(retryPayload('retry-board-0001'));
    screenMocks.fetchLeaderboard.mockResolvedValueOnce({ ok: false, message: 'Worker unavailable.' });
    const scene = new LeaderboardScene();
    scene.init({ filter: 'overall' });
    scene.create();
    await flushPromises();
    const status = screenMocks.displays.find((display) => display.initialText === 'Consulting the archives...')!;
    expect(status.currentText).toContain('Local progress is unaffected.');
    expect(status.currentText).toContain('saved score retry is ready from the main menu');
  });

  it('opens the full filtered Hall of Legends for the completed run', async () => {
    const scene = new GameOverScene();
    const data = gameOverData('run-current-0003');
    scene.create(data);
    await flushPromises();

    const leaderboardCaption = screenMocks.displays.find((display) => display.kind === 'text' && display.initialText === 'Leaderboard')!;
    const leaderboardButton = screenMocks.displays[screenMocks.displays.indexOf(leaderboardCaption) - 1];
    leaderboardButton.fire('pointerdown');

    expect(scene.scene.start).toHaveBeenCalledWith('Leaderboard', {
      filter: 'medium',
      highlightRunId: data.runId
    });
    expect(screenMocks.fetchLeaderboard).not.toHaveBeenCalled();
  });

  it('shows leaderboard failure separately from empty and retries', async () => {
    screenMocks.fetchLeaderboard
      .mockResolvedValueOnce({ ok: false, message: 'Worker unavailable.' })
      .mockResolvedValueOnce({ ok: true, scores: [] });
    const scene = new LeaderboardScene();
    scene.init({ filter: 'overall' });
    scene.create();
    await flushPromises();

    const status = screenMocks.displays.find((display) => display.initialText === 'Consulting the archives...')!;
    expect(status.currentText).toContain('Leaderboard unavailable.');
    const retry = screenMocks.displays.find((display) => display.kind === 'rectangle' && display.args[2] === 144)!;
    retry.fire('pointerdown');
    await flushPromises();

    expect(screenMocks.fetchLeaderboard).toHaveBeenCalledTimes(2);
    expect(status.currentText).toContain('No champions yet.');
  });

  it('keeps the archive loading state and ignores an older filter response', async () => {
    const older = deferred<{ ok: true; scores: Array<Record<string, unknown>> }>();
    const current = deferred<{ ok: true; scores: Array<Record<string, unknown>> }>();
    screenMocks.fetchLeaderboard.mockReturnValueOnce(older.promise).mockReturnValueOnce(current.promise);
    const scene = new LeaderboardScene();
    scene.init({ filter: 'overall' });
    scene.create();
    const status = screenMocks.displays.find((display) => display.currentText === 'Consulting the archives...')!;
    expect(status.currentText).toBe('Consulting the archives...');

    const internals = scene as unknown as {
      tabs: Array<{ filter: string; box: { fire: (event: string) => void } }>;
      records: Array<{ difficulty: string; runId: string }>;
    };
    internals.tabs.find((tab) => tab.filter === 'hard')!.box.fire('pointerdown');
    const hardScore = {
      id: 11, playerName: 'Hard Warden', difficulty: 'hard', highestWave: 4,
      wavesCompleted: 3, outcome: 'defeat', siegeBossesDefeated: 0, finalScore: 900,
      enemiesKilled: 12, bossesKilled: 0, remainingLives: 0, gameDurationSeconds: 75,
      runId: 'hard-run-0001', gameVersion: '1.0.0', scoreVersion: 1, createdAt: '2026-10-08T00:00:00.000Z'
    };
    const easyScore = { ...hardScore, id: 12, playerName: 'Easy Warden', difficulty: 'easy', runId: 'easy-run-0002' };
    current.resolve({ ok: true, scores: [hardScore] });
    await flushPromises();
    expect(internals.records.map((record) => record.difficulty)).toEqual(['hard']);

    older.resolve({ ok: true, scores: [easyScore] });
    await flushPromises();
    expect(internals.records.map((record) => record.runId)).toEqual(['hard-run-0001']);
  });

});
