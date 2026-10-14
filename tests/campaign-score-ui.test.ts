import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import legacyLocalCompleted30 from './fixtures/campaign-v5/legacy_local_completed_30.json';
import { CampaignScene } from '../src/game/scenes/CampaignScene.ts';
import { GameScene } from '../src/game/scenes/GameScene.ts';
import { CampaignRepository, parseCampaignProfile } from '../src/game/campaign/progress.ts';
import { campaignLevelDetail } from '../src/game/campaign/presentation.ts';
import { campaignRequirements } from '../src/game/ui/prerequisites.ts';
import { campaignScoreMetadata, calculateCampaignScore } from '../src/shared/campaignScoring.ts';
import { formatCount } from '../src/shared/displayNumbers.ts';
import { accountSystem } from '../src/game/systems/AccountSystem.ts';
import { SoundManager } from '../src/game/systems/SoundManager.ts';
import { HELP_TOPICS } from '../src/game/ui/helpContent.ts';

const ui = vi.hoisted(() => ({ sheets: [] as any[], actions: [] as any[], texts: [] as any[] }));

vi.mock('phaser', () => ({ default: { Scene: class { constructor(_key?: string) {} } } }));
vi.mock('../src/game/ui/ScrollSheet.ts', () => ({
  ScrollSheet: class {
    readonly root = { destroy: vi.fn() };
    private entry: any;
    constructor(_scene: unknown, parent: any, bounds: unknown, title: string) {
      this.entry = { title, bounds, lines: [], actions: [], destroyed: false };
      ui.sheets.push(this.entry);
      parent?.add?.(this.root);
    }
    text(_y: number, value: string) { this.entry.lines.push(value); return { height: 16 }; }
    action(_y: number, label: string, action: () => void) { this.entry.actions.push({ label, action }); }
    destroy() { this.entry.destroyed = true; }
  }
}));
vi.mock('../src/game/ui/components.ts', () => ({
  button: (_scene: unknown, _parent: unknown, x: number, y: number, width: number, label: string, action: () => void, kind: string, height: number) => {
    const control = { x, y, width, height, label, action, kind };
    ui.actions.push(control);
    return { box: { input: { enabled: true }, setAlpha: vi.fn(), on: vi.fn() }, text: { setAlpha: vi.fn() } };
  },
  panel: vi.fn(),
  statRow: vi.fn()
}));
vi.mock('../src/game/art/campaignArt.ts', () => ({ drawCampaignEnemyBadge: vi.fn(), paintCampaignWorldMap: vi.fn() }));

function legacyRepository(): CampaignRepository {
  let raw = JSON.stringify(legacyLocalCompleted30);
  return new CampaignRepository({ getItem: () => raw, setItem: (_key, value) => { raw = value; } });
}

function display(x: number, y: number, value: string, textStyle: any = {}): any {
  const view: any = {
    x, y, text: value, style: textStyle, height: 14,
    width: value.length * (textStyle.fontSize ?? 12) * 0.5,
    setWordWrapWidth(width: number) { this.wrapWidth = width; return this; },
    setOrigin() { return this; }, setY(next: number) { this.y = next; return this; }, setVisible() { return this; },
    setDisplaySize() { return this; }
  };
  ui.texts.push(view);
  return view;
}

function sceneAdd(): any {
  const container = { add: vi.fn(), setDepth: vi.fn(function (this: any) { return this; }) };
  return {
    text: vi.fn(display), image: vi.fn((x: number, y: number, _key: string) => display(x, y, '')),
    container: vi.fn(() => container)
  };
}

function resultScene(repository: CampaignRepository, result: any): any {
  const scene: any = new GameScene();
  scene.campaign = { definition: { level: 1 } };
  scene.campaignResult = result;
  scene.qaCampaignRepository = repository;
  scene.layout = { width: 360, height: 640 };
  scene.maxLives = 20;
  scene.modalFrame = vi.fn(() => ({ add: vi.fn() }));
  scene.modal = null; scene.modalSheet = null; scene.modalRenderer = null;
  scene.runAccount = false; scene.runOwner = null; scene.qaCampaignFixture = null;
  scene.add = sceneAdd(); scene.scene = { start: vi.fn() };
  return scene;
}

function drawHud(mode: 'campaign' | 'classic' | 'compact-landscape' | 'compact-portrait', campaign: boolean): string[] {
  const scene: any = new GameScene();
  const layout = mode === 'compact-landscape'
    ? { width: 640, height: 360, compact: true, stackedHud: false, safe: { left: 0, right: 0, top: 0 }, hud: 56, field: { width: 640 } }
    : mode === 'compact-portrait'
      ? { width: 360, height: 640, compact: true, stackedHud: true, safe: { left: 0, right: 0, top: 0 }, hud: 80, field: { width: 360 } }
      : { width: 900, height: 640, compact: false, stackedHud: false, safe: { left: 0, right: 0, top: 0 }, hud: 56, field: { width: 900 } };
  const root: any = { list: [], add(child: any) { this.list.push(...(Array.isArray(child) ? child : [child])); } };
  scene.layout = layout; scene.uiRoot = root; scene.campaign = campaign ? {} : null;
  scene.hudObjects = []; scene.hudMetricLabels = []; scene.add = sceneAdd();
  scene.drawHUD();
  return root.list.filter((item: any) => typeof item?.text === 'string').map((item: any) => item.text);
}

beforeEach(() => { ui.sheets.length = 0; ui.actions.length = 0; ui.texts.length = 0; });
afterEach(() => vi.restoreAllMocks());

describe('Campaign scoring UI', () => {
  it('shows the derived goal in the mission card and explains a legacy-only score in its scroll sheet', () => {
    const repository = legacyRepository(), profile = parseCampaignProfile(legacyLocalCompleted30)!;
    const detail = campaignLevelDetail(1, repository.view())!;
    const target = campaignScoreMetadata(1).scoreTarget;
    expect(detail).toMatchObject({ bestScore: null, legacyBestScore: profile.levels[1]!.bestScore, scoreTarget: target });
    expect(detail.objectives[2].label).toBe(`Reach ${formatCount(target)} points`);
    expect(campaignRequirements(repository.view(), 1).find(row => row.id === 'score'))
      .toMatchObject({ met: profile.levels[1]!.scoreStar, progress: `0/${formatCount(target)} points` });

    vi.spyOn(SoundManager, 'get').mockReturnValue({ unlock: vi.fn(), click: vi.fn() } as any);
    const scene: any = new CampaignScene();
    scene.selectedLevel = 1; scene.campaignView = repository.view(); scene.scale = { width: 360, height: 640 };
    scene.add = sceneAdd(); scene.sheet = null; scene.sheetRoot = null;
    scene.drawDetail({ add: vi.fn() }, 360, 0, 240);

    const cardText = ui.texts.map(view => view.text).join('\n');
    expect(cardText).toContain(`Reach ${formatCount(target)} score`);
    expect(cardText).toContain('Not scored yet');
    ui.actions.find(action => action.label === 'Scoring')!.action();

    const lines = ui.sheets[ui.sheets.length - 1]!.lines.join('\n');
    expect(lines).toContain('Wave enemies: 10 points each');
    expect(lines).toContain('Cleared waves: 100 points each');
    expect(lines).toContain('Mission boss: not applicable');
    expect(lines).toContain('Remaining lives: 50 points each at settlement');
    expect(lines).toContain('Defeat wave enemies, clear waves, defeat the mission boss, and preserve lives. Summoned enemies give no score. Gold and time do not affect points.');
    expect(lines).toContain(`Score-star target: ${formatCount(target)} points`);
    expect(lines).toContain('Current best: Not scored yet');
    expect(lines).toContain('Replay this level to establish a new score.');
    expect(lines).toContain(`Legacy score — excluded from current total: ${formatCount(profile.levels[1]!.bestScore)} points`);
  });

  it.each([
    ['compact-landscape', true, 'COMBAT SCORE'], ['compact-portrait', true, 'COMBAT SCORE'], ['classic', true, 'COMBAT SCORE'],
    ['compact-landscape', false, 'SCORE'], ['compact-portrait', false, 'SCORE'], ['classic', false, 'SCORE']
  ] as const)('labels %s layout with campaign=%s as %s', (layout, campaign, label) => {
    expect(drawHud(layout, campaign)).toContain(label);
  });

  it('renders saved component totals and rerenders the same result after resize', () => {
    const repository = new CampaignRepository(null), metadata = campaignScoreMetadata(1);
    const counts = { scheduledEnemiesKilled: metadata.scheduledEnemyCount, wavesCompleted: metadata.waveCount, missionBossesKilled: 0, remainingLives: 20 };
    const breakdown = calculateCampaignScore(counts);
    const clear = repository.recordClear(1, breakdown.finalScore, counts.remainingLives)!;
    const result = { outcome: 'victory', score: breakdown.finalScore, lives: counts.remainingLives, clear, breakdown, ...counts };
    const scene = resultScene(repository, result);
    scene.runOwner = { mode: 'account' };
    vi.spyOn(accountSystem, 'view').mockReturnValue({ state: 'ready', playMode: 'account', progressSync: 'pending', resultSync: 'pending', pending: 1, progressDirty: false, warning: null } as any);

    scene.renderCampaignResult();
    const first = ui.sheets[ui.sheets.length - 1]!.lines;
    expect(first).toContain(`Scheduled enemies: ${formatCount(counts.scheduledEnemiesKilled)} × 10 = ${formatCount(breakdown.killScore)} points`);
    expect(first).toContain(`Waves cleared: ${formatCount(counts.wavesCompleted)} × 100 = ${formatCount(breakdown.waveBonus)} points`);
    expect(first).toContain('Mission boss: Not applicable · 0 points');
    expect(first).toContain(`Remaining lives: 20 × 50 = ${formatCount(breakdown.livesBonus)} points`);
    expect(first).toContain(`Final score: ${formatCount(breakdown.finalScore)}`);
    expect(first).toContain(`Score target: ${formatCount(metadata.scoreTarget)} points — reached`);
    expect(first).toContain('Score star: newly earned');
    expect(first).toContain('Pending sync · 1 score');

    scene.campaignScheduledKills = 0; scene.wavesCompleted = 0; scene.campaignMissionBossKills = 0; scene.lives = 0;
    scene.modalRenderer();
    expect(ui.sheets[ui.sheets.length - 1]!.lines).toEqual(first);
  });

  it('reports a missed target separately from a retained legacy score star', () => {
    const repository = legacyRepository(), metadata = campaignScoreMetadata(1), score = metadata.scoreTarget - 1;
    const clear = repository.recordClear(1, score, 12)!;
    expect(clear.progress.scoreStar).toBe(true);
    const result = {
      outcome: 'victory', score, lives: 12, clear,
      scheduledEnemiesKilled: 0, wavesCompleted: 0, missionBossesKilled: 0,
      breakdown: { killScore: 0, waveBonus: 0, bossBonus: 0, livesBonus: score, finalScore: score }
    };
    const scene = resultScene(repository, result);

    scene.renderCampaignResult();
    const lines = ui.sheets[ui.sheets.length - 1]!.lines.join('\n');
    expect(lines).toContain(`Score target: ${formatCount(metadata.scoreTarget)} points — missed`);
    expect(lines).toContain('Score star: retained from earlier progress');
    expect(lines).toContain('Final score: 2,159');
  });

  it('reports an exact target as reached while keeping an earlier score star retained', () => {
    const repository = legacyRepository(), metadata = campaignScoreMetadata(1), score = metadata.scoreTarget;
    const clear = repository.recordClear(1, score, 12)!;
    const result = {
      outcome: 'victory', score, lives: 12, clear,
      scheduledEnemiesKilled: score / 10, wavesCompleted: 0, missionBossesKilled: 0,
      breakdown: { killScore: score, waveBonus: 0, bossBonus: 0, livesBonus: 0, finalScore: score }
    };
    const scene = resultScene(repository, result);

    scene.renderCampaignResult();
    const lines = ui.sheets[ui.sheets.length - 1]!.lines.join('\n');
    expect(lines).toContain(`Score target: ${formatCount(metadata.scoreTarget)} points — reached`);
    expect(lines).toContain('Score star: retained from earlier progress');
  });

  it('shows ranking guidance and leaves the current best alone after failure', () => {
    const repository = legacyRepository();
    const result = {
      outcome: 'siege-failed', score: 100, lives: 0, clear: null,
      scheduledEnemiesKilled: 0, wavesCompleted: 0, missionBossesKilled: 0,
      breakdown: { killScore: 0, waveBonus: 0, bossBonus: 0, livesBonus: 100, finalScore: 100 }
    };
    const scene = resultScene(repository, result);

    scene.renderCampaignResult();
    const lines = ui.sheets[ui.sheets.length - 1]!.lines.join('\n');
    expect(lines).toContain('Winning clears contribute to your campaign ranking. This failure does not improve your best.');
    expect(lines).toContain('Current best: Not scored yet');
  });

  it('explains that Campaign combat score excludes the settlement lives bonus', () => {
    const body = HELP_TOPICS.find(topic => topic.id === 'campaign')?.body;
    expect(body).toContain('the live score excludes the remaining-lives bonus, which is settled once at the end');
  });
});
