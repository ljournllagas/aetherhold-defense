import Phaser from 'phaser';
import type { LoadingRequest } from './PreloadScene.ts';
import type { DifficultyId, EnemyArchetype, GameResultPayload, ScoreBreakdown } from '../../shared/types.ts';
import type { BranchId, EvolutionRank, RunOutcome } from '../../shared/progression.ts';
import { scoreRetryRepository, submitRetainedScore, type SavedSubmission } from '../systems/ScoreRetry.ts';
import { loadBest, loadLegacyBest } from '../systems/Settings.ts';
import { EVOLUTIONS } from '../config/evolutions.ts';
import { SoundManager } from '../systems/SoundManager.ts';
import { C, FONT_DISPLAY, style } from '../ui/tokens.ts';
import { MAP1 } from '../maps/map1.ts';
import { paintBattlefield, refreshStronghold } from '../art/terrain.ts';
import { buildTowerVisual, decorateEvolution } from '../art/towerArt.ts';
import { buildEnemyVisual } from '../art/enemyArt.ts';
import { emblemKey } from '../art/artkit.ts';
import { ScrollSheet } from '../ui/ScrollSheet.ts';

interface WorldSnapshot {
  mapId: string;
  strongholdRatio: number;
  towers: Array<{ towerId: string; level: number; x: number; y: number; branchId?: BranchId | null; rank?: EvolutionRank | null }>;
  enemies: Array<{ archetype: EnemyArchetype; x: number; y: number; hpFraction: number }>;
}

export interface GameOverData {
  difficulty: DifficultyId;
  playerName: string;
  highestWave: number;
  wavesCompleted: number;
  outcome: RunOutcome;
  siegeBossesDefeated: number;
  finalScore: number;
  enemiesKilled: number;
  bossesKilled: number;
  remainingLives: number;
  gameDurationSeconds: number;
  runId: string;
  gameVersion: string;
  scoreVersion: number;
  breakdown: ScoreBreakdown;
  isPersonalBest: boolean;
  worldSnapshot?: WorldSnapshot;
  unlocksEarned?: Array<{ branchId: BranchId; saved: boolean }>;
}

const IDLE_MESSAGE = 'Submit your score to the Hall of Legends.';
type Data = GameOverData;

const number = (value: number): string => Math.max(0, Math.floor(Number.isFinite(value) ? value : 0)).toLocaleString('en-US');

function text(scene: Phaser.Scene, parent: Phaser.GameObjects.Container, x: number, y: number, value: string, size: number, color: string, bold = false, font = '"Inter", system-ui, sans-serif', originX = 0.5): Phaser.GameObjects.Text {
  const item = scene.add.text(x, y, value, style(size, color, bold, font)).setOrigin(originX, 0.5);
  parent.add(item);
  return item;
}

function button(scene: Phaser.Scene, parent: Phaser.GameObjects.Container, x: number, y: number, width: number, height: number, label: string, primary: boolean, action: () => void): void {
  const fill = primary ? 0x153c31 : 0x111920;
  const box = scene.add.rectangle(x, y, width, height, fill, 0.98).setOrigin(0).setStrokeStyle(primary ? 2 : 1, primary ? 0xd7aa4e : 0x59636b);
  const caption = scene.add.text(x + width / 2, y + height / 2, label, style(14, primary ? C.goldBright : C.textPrimary, true, FONT_DISPLAY)).setOrigin(0.5);
  parent.add([box, caption]);
  box.setInteractive({ useHandCursor: true });
  box.on('pointerover', () => box.setFillStyle(primary ? 0x1e4b3b : 0x22303c, 1).setStrokeStyle(2, 0xf0cd72));
  box.on('pointerout', () => box.setFillStyle(fill, 0.98).setStrokeStyle(primary ? 2 : 1, primary ? 0xd7aa4e : 0x59636b));
  box.on('pointerdown', () => { SoundManager.get().click(); action(); });
}

export class GameOverScene extends Phaser.Scene {
  private phoneSheet: ScrollSheet | null = null;
  private submitState: 'idle' | 'submitting' | 'submitted' | 'failed' = 'idle';
  private payload: GameResultPayload | null = null;
  private runGeneration = 0;
  private activeRunId: string | null = null;
  private runData: Data | null = null;
  /** The retained attempt this screen owns; it keeps later retries conditional across tabs. */
  private scoreAttempt: SavedSubmission | null = null;
  private retryNotice: string | null = null;
  private backgroundRoot: Phaser.GameObjects.Container | null = null;
  private shadeRoot: Phaser.GameObjects.Container | null = null;
  private panelRoot: Phaser.GameObjects.Container | null = null;
  private submitMessage = IDLE_MESSAGE;
  private readonly handleResize = (): void => {
    if (!this.runData) return;
    this.drawBackground(this.runData);
    this.drawPanel(this.runData);
  };

  constructor() {
    super('GameOver');
  }

  create(data: Data): void {
    this.submitState = 'idle';
    this.runGeneration++;
    const generation = this.runGeneration;
    this.activeRunId = data.runId;
    this.runData = data;
    // Keep the POST projection strict: worldSnapshot, unlocksEarned and
    // isPersonalBest are presentation-only and never cross the score API boundary.
    this.payload = Object.freeze({
      playerName: data.playerName,
      difficulty: data.difficulty,
      highestWave: data.highestWave,
      wavesCompleted: data.wavesCompleted,
      outcome: data.outcome,
      siegeBossesDefeated: data.siegeBossesDefeated,
      finalScore: data.finalScore,
      enemiesKilled: data.enemiesKilled,
      bossesKilled: data.bossesKilled,
      remainingLives: data.remainingLives,
      gameDurationSeconds: data.gameDurationSeconds,
      runId: data.runId,
      gameVersion: data.gameVersion,
      scoreVersion: data.scoreVersion
    });
    this.submitMessage = IDLE_MESSAGE;
    this.scoreAttempt = null;
    this.retryNotice = null;
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.phoneSheet?.destroy(); this.phoneSheet = null;
      if (this.runGeneration === generation && this.activeRunId === data.runId) {
        this.runGeneration++;
        this.activeRunId = null;
        this.runData = null;
      }
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    });
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    SoundManager.get().stopMusic();
    this.drawBackground(data);
    this.drawPanel(data);
    void this.refreshRetryNotice(generation);
  }

  /**
   * Reads the retained retry view under a generation guard. Opening results never
   * stages anything; the notice only explains what an explicit Submit will do.
   */
  private async refreshRetryNotice(generation: number): Promise<void> {
    const view = await scoreRetryRepository.view();
    const current = this.payload;
    if (!current || !this.runData || this.runGeneration !== generation || this.activeRunId !== current.runId) return;
    const other = view.record && view.record.payload.runId !== current.runId ? view.record : null;
    if (other) {
      this.retryNotice = view.persisted
        ? 'Submitting replaces the previous saved score retry.'
        : 'Submitting replaces a saved score retry that is available in this session only.';
    } else if (view.status === 'unreadable') {
      this.retryNotice = view.warning;
    } else if (view.status === 'incompatible' && view.record) {
      this.retryNotice = `A saved score from era ${view.record.payload.scoreVersion} is kept and cannot be replaced.`;
    } else {
      this.retryNotice = null;
    }
    if (this.runData) this.drawPanel(this.runData);
  }

  private drawBackground(data: Data): void {
    this.tweens.killAll();
    this.backgroundRoot?.destroy(true);
    this.shadeRoot?.destroy(true);
    this.backgroundRoot = null;
    this.shadeRoot = null;
    const before = new Set(this.children.list);
    const fieldArt = paintBattlefield(this);
    const terrain = this.children.list.filter((view) => !before.has(view));
    const world = this.add.container(0, 0).setDepth(-30);
    world.add(terrain);
    const W = this.scale.width;
    const H = this.scale.height;
    const sx = W / MAP1.field.width;
    const sy = H / MAP1.field.height;
    world.setPosition(-MAP1.field.x * sx, -MAP1.field.y * sy).setScale(sx, sy);
    this.backgroundRoot = world;

    const snapshot = data.worldSnapshot;
    const matchesMap = snapshot?.mapId === MAP1.id;
    const defeatedMap = matchesMap && snapshot.strongholdRatio <= 0.02;
    if (defeatedMap) fieldArt.stronghold.root.setVisible(false);
    else refreshStronghold(fieldArt.stronghold, matchesMap ? snapshot.strongholdRatio : 0);
    if (matchesMap && snapshot) {
      if (defeatedMap) {
        const mapImage = terrain.find((view) => (view as Phaser.GameObjects.Image).texture?.key === MAP1.backgroundKey) as Phaser.GameObjects.Image | undefined;
        mapImage?.setTexture('map_ancient_border_keep_defeated').setDisplaySize(MAP1.field.width, MAP1.field.height);
      }
      for (const tower of snapshot.towers) {
        if (![tower.x, tower.y, tower.level].every(Number.isFinite)) continue;
        const visual = buildTowerVisual(this, tower.towerId, tower.level);
        visual.view.setPosition(tower.x, tower.y).setDepth(4 + tower.y / 1000);
        visual.view.setData('displayBounds', visual.displayBounds);
        if (tower.branchId && EVOLUTIONS[tower.branchId] && tower.rank !== undefined && tower.rank !== null) {
          decorateEvolution(this, visual.view, tower.branchId, tower.rank);
        }
        world.add(visual.view);
      }
      for (const enemy of snapshot.enemies) {
        if (![enemy.x, enemy.y, enemy.hpFraction].every(Number.isFinite)) continue;
        const visual = buildEnemyVisual(this, enemy.archetype);
        visual.setWalking(false);
        const shadow = this.add.ellipse(enemy.x, enemy.y + 3, 30, 10, 0x000000, 0.35).setDepth(3 + enemy.y / 1000);
        const hp = Math.max(0, Math.min(1, enemy.hpFraction));
        const bar = this.add.graphics().setDepth(6 + enemy.y / 1000);
        bar.fillStyle(0x211b17, 0.95).fillRect(enemy.x - 16, enemy.y - 30, 32, 4);
        if (hp > 0) bar.fillStyle(hp > 0.5 ? 0x63c77c : 0xd7aa4e, 0.96).fillRect(enemy.x - 15, enemy.y - 29, 30 * hp, 2);
        visual.view.setPosition(enemy.x, enemy.y).setDepth(4 + enemy.y / 1000);
        world.add([shadow, visual.view, bar]);
      }
    }

    const shade = this.add.container(0, 0).setDepth(-20);
    const vignette = this.add.graphics();
    vignette.fillGradientStyle(0x080a0d, 0x080a0d, 0x080a0d, 0x080a0d, 0.30, 0.30, 0, 0).fillRect(0, 0, W, H);
    vignette.fillGradientStyle(0x080a0d, 0x080a0d, 0x080a0d, 0x080a0d, 0, 0, 0.34, 0.34).fillRect(0, 0, W, H);
    vignette.fillGradientStyle(0x080a0d, 0x080a0d, 0x080a0d, 0x080a0d, 0.22, 0, 0.22, 0).fillRect(0, 0, W, H);
    vignette.fillGradientStyle(0x080a0d, 0x080a0d, 0x080a0d, 0x080a0d, 0, 0.22, 0, 0.22).fillRect(0, 0, W, H);
    shade.add([
      this.add.rectangle(0, 0, W, H, 0x080a0d, 0.20).setOrigin(0),
      this.add.rectangle(0, 0, W, H, 0x88857d, 0.12).setOrigin(0),
      this.add.rectangle(0, 0, W, H, 0x35120f, 0.035).setOrigin(0),
      vignette
    ]);
    this.shadeRoot = shade;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) this.tweens.getTweens().forEach((tween) => tween.stop());
  }

  private drawPanel(data: Data): void {
    this.phoneSheet?.destroy(); this.phoneSheet = null;
    this.panelRoot?.destroy(true);
    const W = this.scale.width;
    const H = this.scale.height;
    const compact = W < 900 || H < 560;
    const panel = this.add.container(0, 0).setDepth(100);
    this.panelRoot = panel;
    const { title, line: outcomeLine } = this.outcomeText(data);
    const livesLine = `Lives remaining · ${Math.max(0, Math.floor(data.remainingLives))}`;
    const unlocksLine = this.unlocksLine(data);
    const legacy = loadLegacyBest();
    const legacyLine = legacy ? `Legacy era ${legacy.scoreVersion} best · ${number(legacy.score)}` : null;
    if (W < 768) {
      const sheet = new ScrollSheet(this, panel, { x: 12, y: 8, width: W - 24, height: H - 16 }, title, () => this.scene.start('MainMenu')); this.phoneSheet = sheet;
      let y = 0;
      const lines = [`${outcomeLine ?? 'The Borderkeep has fallen'} · ${data.playerName}`, `FINAL SCORE · ${number(data.finalScore)}`, `Highest wave · ${data.highestWave}`, livesLine, `${data.difficulty.toUpperCase()} · ${this.duration(data.gameDurationSeconds)}`, `${data.enemiesKilled} enemies · ${data.bossesKilled} bosses`, data.isPersonalBest ? 'NEW PERSONAL BEST' : `Personal best · ${number(loadBest()?.score ?? 0)}`];
      if (unlocksLine) lines.push(unlocksLine);
      if (legacyLine) lines.push(legacyLine);
      lines.push(this.scoreSummary(data), this.submitMessage);
      if (this.retryNotice) lines.push(this.retryNotice);
      for (const line of lines) { const t = sheet.text(y, line, C.textPrimary, 14); y += t.height + 16; }
      sheet.action(y, this.submitLabel(), () => this.requestSubmit(data), this.canSubmit() ? 'primary' : 'secondary');
      sheet.action(y + 52, 'Play Again', () => this.scene.start('Preload', { stage: 'gameplay', destination: 'Game', data: { difficulty: data.difficulty, playerName: data.playerName } } satisfies LoadingRequest), 'primary');
      sheet.action(y + 104, 'Leaderboard', () => this.scene.start('Leaderboard', { filter: data.difficulty, highlightRunId: data.runId }));
      sheet.action(y + 156, 'Main Menu', () => this.scene.start('MainMenu'));
      return;
    }

    if (compact) {
      const x = 12;
      const y = 8;
      const width = Math.min(622, W - 24);
      const centerX = x + width / 2;
      const height = H - 16;
      this.drawFrame(panel, x, y, width, height, 0.68);
      panel.add(this.add.rectangle(x + 16, y + 5, width - 32, 29, 0x341a16, 0.86).setOrigin(0).setStrokeStyle(1, 0x8a5140, 0.82));
      panel.add(this.add.image(x + 36, y + 19, emblemKey()).setDisplaySize(24, 24));
      text(this, panel, centerX + 8, y + 19, title, 18, C.goldBright, true, FONT_DISPLAY);
      text(this, panel, x + width - 28, y + 19, livesLine, 12, C.textPrimary, true, undefined, 1);
      text(this, panel, centerX, y + 40, `${outcomeLine ?? 'The Borderkeep has fallen'}  ·  ${data.playerName}  ·  Wave ${data.highestWave}`, 12, C.textSecondary, true);
      text(this, panel, centerX, y + 68, `FINAL SCORE  ·  ${number(data.finalScore)}`, 29, C.goldBright, true, FONT_DISPLAY);
      text(this, panel, centerX, y + 94, `HIGHEST WAVE REACHED  ·  ${data.highestWave}  ·  ${this.duration(data.gameDurationSeconds)}`, 12, C.textPrimary, true);
      this.drawStatCards(panel, data, x + 18, y + 112, width - 36, 44, true);
      text(this, panel, centerX, y + 174, this.scoreSummary(data), 12, C.textSecondary, true).setWordWrapWidth(width - 38).setAlign('center');
      const extras = [unlocksLine, legacyLine].filter((line): line is string => line !== null).join('  ·  ');
      if (extras) text(this, panel, centerX, y + 206, extras, 12, C.textPrimary, true).setWordWrapWidth(width - 38).setAlign('center');
      text(this, panel, centerX, y + 224, this.submitMessage, 12, this.submitMessage.startsWith('Score saved') ? C.health : C.textSecondary, true);
      if (this.retryNotice) text(this, panel, centerX, y + 240, this.retryNotice, 11, C.goldBright, true).setWordWrapWidth(width - 38).setAlign('center');
      const actionY = H - 58;
      const gap = 10;
      const actionWidth = (width - 32 - gap * 3) / 4;
      this.addActions(panel, data, x + 16, actionY, actionWidth, 48, gap);
    } else {
      const width = Math.min(760, W - 36);
      const height = Math.min(660, H - 24);
      const x = (W - width) / 2;
      const y = (H - height) / 2;
      this.drawFrame(panel, x, y, width, height, 0.91);
      panel.add(this.add.rectangle(x + 24, y + 18, width - 48, 70, 0x341a16, 0.88).setOrigin(0).setStrokeStyle(1, 0x986043, 0.9));
      panel.add(this.add.image(x + 84, y + 53, emblemKey()).setDisplaySize(48, 48));
      text(this, panel, W / 2 + 24, y + 50, title, 30, C.goldBright, true, FONT_DISPLAY);
      text(this, panel, W / 2, y + 105, outcomeLine ?? 'The Borderkeep has fallen. Your defense will be remembered.', 14, C.textPrimary);
      text(this, panel, W / 2, y + 128, `${data.playerName}  ·  ${data.difficulty.toUpperCase()}  ·  ${this.duration(data.gameDurationSeconds)}`, 12, C.textSecondary, true);

      const scoreX = x + 46;
      const scoreY = y + 146;
      const scoreWidth = width - 92;
      panel.add(this.add.rectangle(scoreX, scoreY, scoreWidth, 166, 0x0b1117, 0.93).setOrigin(0).setStrokeStyle(1, 0xb08b48, 0.92));
      text(this, panel, W / 2, scoreY + 24, 'FINAL SCORE', 13, C.textSecondary, true, FONT_DISPLAY);
      text(this, panel, W / 2, scoreY + 76, number(data.finalScore), 58, C.goldBright, true, FONT_DISPLAY);
      text(this, panel, W / 2, scoreY + 137, `HIGHEST WAVE REACHED  ·  ${data.highestWave}`, 15, C.textPrimary, true);
      text(this, panel, W / 2, scoreY + 156, livesLine, 12, C.textSecondary, true);

      this.drawStatCards(panel, data, x + 38, y + 332, width - 76, 78, false);
      text(this, panel, W / 2, y + 447, this.scoreSummary(data), 13, C.textSecondary, true).setWordWrapWidth(width - 84).setAlign('center');
      if (unlocksLine) text(this, panel, W / 2, y + 480, unlocksLine, 13, C.goldBright, true).setWordWrapWidth(width - 84).setAlign('center');
      text(this, panel, W / 2, y + 508, this.submitMessage, 12, this.submitMessage.startsWith('Score saved') ? C.health : C.textSecondary, true);
      if (legacyLine) text(this, panel, W / 2, y + 530, legacyLine, 12, C.textSecondary, true);
      if (this.retryNotice) text(this, panel, W / 2, y + 552, this.retryNotice, 12, C.goldBright, true).setWordWrapWidth(width - 84).setAlign('center');
      this.addActions(panel, data, x + 36, y + height - 64, (width - 72 - 36) / 4, 46, 12);
    }
  }

  private drawFrame(parent: Phaser.GameObjects.Container, x: number, y: number, width: number, height: number, alpha: number): void {
    parent.add(this.add.rectangle(x, y, width, height, 0x0b1117, alpha).setOrigin(0).setStrokeStyle(2, 0xb08b48, 1));
    const trim = this.add.graphics();
    trim.lineStyle(1, 0x445564, 0.9);
    trim.strokeRect(x + 7, y + 7, width - 14, height - 14);
    trim.lineStyle(2, 0xf0cd72, 0.82);
    const c = 20;
    trim.lineBetween(x + 8, y + c, x + 8, y + 8); trim.lineBetween(x + 8, y + 8, x + c, y + 8);
    trim.lineBetween(x + width - c, y + height - 8, x + width - 8, y + height - 8); trim.lineBetween(x + width - 8, y + height - c, x + width - 8, y + height - 8);
    parent.add(trim);
  }

  private drawStatCards(parent: Phaser.GameObjects.Container, data: Data, x: number, y: number, width: number, height: number, compact: boolean): void {
    const gap = compact ? 6 : 10;
    const cellWidth = (width - gap * 3) / 4;
    const personalBest = data.isPersonalBest ? 'NEW BEST' : `${number(loadBest()?.score ?? 0)} PTS`;
    const items: Array<[string, string]> = [
      ['DIFFICULTY', data.difficulty.toUpperCase()],
      ['ENEMIES DEFEATED', number(data.enemiesKilled)],
      ['BOSSES DEFEATED', number(data.bossesKilled)],
      ['PERSONAL BEST', personalBest]
    ];
    items.forEach(([label, value], index) => {
      const cellX = x + index * (cellWidth + gap);
      parent.add(this.add.rectangle(cellX, y, cellWidth, height, 0x101820, 0.92).setOrigin(0).setStrokeStyle(1, 0x59636b, 0.78));
      text(this, parent, cellX + cellWidth / 2, y + (compact ? 12 : 23), label, 12, C.textSecondary, true);
      text(this, parent, cellX + cellWidth / 2, y + (compact ? 31 : 52), value, compact ? 12 : 15, data.isPersonalBest && index === 3 ? C.goldBright : C.textPrimary, true);
    });
  }

  private scoreSummary(data: Data): string {
    const b = data.breakdown;
    const goldBonus = Math.max(0, b.baseScore - b.killScore - b.waveBonus - b.bossBonus - b.livesBonus);
    return `SCORE BREAKDOWN  ·  ${number(b.killScore)} defeats  +  ${number(b.waveBonus)} waves  +  ${number(b.bossBonus)} bosses  +  ${number(b.livesBonus)} lives  +  ${number(goldBonus)} unused-gold bonus  =  ${number(b.baseScore)} base  ×  ${b.difficultyMultiplier.toFixed(2)}  =  ${number(data.finalScore)}`;
  }

  private outcomeText(data: Data): { title: string; line: string | null } {
    if (data.outcome === 'victory') return { title: 'SIEGE COMPLETE', line: 'The Borderkeep stands. The siege is won.' };
    if (data.outcome === 'siege-failed') return { title: 'SIEGE FAILED', line: data.highestWave >= 30 ? 'Siege failed: the final boss escaped' : 'Siege failed: the first boss escaped' };
    if (data.wavesCompleted >= 30 && (data.siegeBossesDefeated & 5) === 5) return { title: 'GAME OVER', line: 'Siege won · The Borderkeep fell in endless.' };
    return { title: 'GAME OVER', line: null };
  }

  private unlocksLine(data: Data): string | null {
    const earned = (data.unlocksEarned ?? []).filter((entry) => EVOLUTIONS[entry.branchId]);
    if (!earned.length) return null;
    return `Unlocked: ${earned.map((entry) => `${EVOLUTIONS[entry.branchId].name}${entry.saved ? '' : ' (not saved)'}`).join(', ')}`;
  }

  private canSubmit(): boolean {
    return this.submitState === 'idle' || this.submitState === 'failed';
  }

  private submitLabel(): string {
    if (this.submitState === 'submitting') return 'Submitting…';
    if (this.submitState === 'submitted') return 'Score Submitted';
    return 'Submit Score';
  }

  private requestSubmit(data: Data): void {
    if (this.canSubmit()) void this.submit(data);
  }

  private addActions(parent: Phaser.GameObjects.Container, data: Data, x: number, y: number, width: number, height: number, gap: number): void {
    button(this, parent, x, y, width, height, this.submitLabel(), this.canSubmit(), () => this.requestSubmit(data));
    button(this, parent, x + width + gap, y, width, height, 'Play Again', true, () => {
      this.scene.start('Preload', { stage: 'gameplay', destination: 'Game', data: { difficulty: data.difficulty, playerName: data.playerName } } satisfies LoadingRequest);
    });
    button(this, parent, x + (width + gap) * 2, y, width, height, 'Leaderboard', false, () => {
      this.scene.start('Leaderboard', { filter: data.difficulty, highlightRunId: data.runId });
    });
    button(this, parent, x + (width + gap) * 3, y, width, height, 'Main Menu', false, () => this.scene.start('MainMenu'));
  }

  private duration(seconds: number): string {
    const safe = Math.max(0, Math.floor(seconds));
    return `${Math.floor(safe / 60)}m ${safe % 60}s`;
  }

  private isRunCurrent(data: Data, generation: number): boolean {
    return this.scene.isActive('GameOver') && this.runGeneration === generation && this.activeRunId === data.runId;
  }

  private async submit(data: Data): Promise<void> {
    if (this.submitState === 'submitting' || this.submitState === 'submitted') return;
    const payload = this.payload;
    if (!payload || !this.canSubmit()) return;
    const generation = this.runGeneration;
    this.submitState = 'submitting';
    this.submitMessage = 'Submitting score...';
    this.drawPanel(data);
    try {
      const completed = await submitRetainedScore(payload, scoreRetryRepository, this.scoreAttempt ?? undefined);
      if (!this.isRunCurrent(data, generation)) return;
      if (completed.attempted) this.scoreAttempt = completed.attempted;
      const result = completed.result;
      this.submitState = result.ok || result.duplicate ? 'submitted' : 'failed';
      const retained = completed.retry.record?.payload.runId === payload.runId;
      this.submitMessage = result.ok ? 'Score saved to the Hall of Legends.'
        : result.duplicate ? 'This run was already recorded.'
        : retained && completed.retry.persisted ? `Could not save online (${result.error ?? 'offline'}). Saved for manual retry from the menu.`
        : retained ? `Could not save online (${result.error ?? 'offline'}). Retry is available in this session only.`
        : `Could not save online (${result.error ?? 'offline'}). A newer attempt replaced this saved retry.`;
      // Success still reports a storage warning when the saved duplicate could not be cleared.
      if ((result.ok || result.duplicate) && completed.retry.warning) this.submitMessage += ` ${completed.retry.warning}`;
      const other = completed.retry.record && completed.retry.record.payload.runId !== payload.runId ? completed.retry.record : null;
      this.retryNotice = other
        ? (completed.retry.persisted
          ? 'Submitting replaces the previous saved score retry.'
          : 'Submitting replaces a saved score retry that is available in this session only.')
        : completed.retry.status === 'unreadable' ? completed.retry.warning : null;
    } catch (error) {
      if (!this.isRunCurrent(data, generation)) return;
      this.submitState = 'failed';
      this.submitMessage = error instanceof Error ? error.message : 'This score could not be submitted.';
    }
    if (this.isRunCurrent(data, generation)) this.drawPanel(data);
  }
}
