import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const screenMocks = vi.hoisted(() => ({
  displays: [] as Array<Record<string, any>>,
  submitScore: vi.fn(),
  fetchLeaderboard: vi.fn(),
  sound: { stopMusic: vi.fn(), click: vi.fn() },
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
    setOrigin() { return this; }
    setDisplaySize() { return this; }
    setStrokeStyle() { return this; }
    setStroke() { return this; }
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
    removeAll() { return this; }
    destroy() { this.destroyed = true; return this; }
    on(event: string, callback: (...args: any[]) => void) { this.handlers.set(event, callback); return this; }
    add() { return this; }
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

  return {
    default: {
      Scene: FakeScene,
      Scenes: { Events: { SHUTDOWN: 'shutdown' } },
      Scale: { Events: { RESIZE: 'resize' } }
    }
  };
});

vi.mock('../src/api/leaderboardClient.ts', () => ({
  submitScore: screenMocks.submitScore,
  fetchLeaderboard: screenMocks.fetchLeaderboard
}));
vi.mock('../src/game/systems/Settings.ts', () => ({ loadBest: () => null, loadLegacyBest: () => screenMocks.legacyBest }));
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

const gameOverData = (runId: string) => ({
  difficulty: 'medium' as const,
  playerName: 'Warden',
  highestWave: 4,
  wavesCompleted: 3,
  outcome: 'defeat' as const,
  siegeBossesDefeated: 0,
  finalScore: 900,
  enemiesKilled: 12,
  bossesKilled: 0,
  remainingLives: 0,
  gameDurationSeconds: 75,
  runId,
  gameVersion: '1.0.0',
  scoreVersion: 1,
  isPersonalBest: false,
  breakdown: {
    killScore: 120, waveBonus: 400, bossBonus: 0, livesBonus: 0,
    baseScore: 520, difficultyMultiplier: 1.5, finalScore: 900
  }
});

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
};

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('screen lifecycle and leaderboard states', () => {
  beforeEach(() => {
    screenMocks.displays.length = 0;
    screenMocks.submitScore.mockReset().mockResolvedValue({ ok: true, id: 1 });
    screenMocks.fetchLeaderboard.mockReset().mockResolvedValue({ ok: true, scores: [] });
    screenMocks.refreshStronghold.mockClear();
    screenMocks.legacyBest = null;
  });

  afterEach(() => vi.clearAllMocks());

  const texts = () => screenMocks.displays.filter((d) => d.kind === 'text').map((d) => d.currentText as string);
  const press = (label: string) => {
    const captions = screenMocks.displays.filter((d) => d.kind === 'text' && d.initialText === label);
    const caption = captions[captions.length - 1]; if (!caption) throw new Error(`No ${label} action`);
    screenMocks.displays[screenMocks.displays.indexOf(caption) - 1].fire('pointerdown');
  };
  const resultData = (overrides: Record<string, unknown> = {}) => ({ ...gameOverData('run-result-0001'), ...overrides }) as unknown as ReturnType<typeof gameOverData>;

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
    expect(screenMocks.submitScore).toHaveBeenCalledTimes(1);
    const payload = screenMocks.submitScore.mock.calls[0][0] as Record<string, unknown>;
    expect(Object.keys(payload).sort()).toEqual(['playerName', 'difficulty', 'highestWave', 'finalScore', 'enemiesKilled', 'bossesKilled', 'remainingLives', 'gameDurationSeconds', 'runId', 'gameVersion', 'scoreVersion', 'wavesCompleted', 'outcome', 'siegeBossesDefeated'].sort());
    expect(payload).not.toHaveProperty('worldSnapshot');
    pending.resolve({ ok: true, id: 7 }); await flushPromises();
    expect(texts().some((t) => t.startsWith('Score saved to the Hall of Legends'))).toBe(true);
    press('Score Submitted'); press('Submit Score');
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
    expect(texts()).toEqual(expect.arrayContaining(['Legacy best · 100,000', 'Unlocked: Volley, Thunderlord (not saved)']));
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
