import Phaser from 'phaser';
import { loadBest, loadLegacyBest, loadSettings } from '../systems/Settings.ts';
import { scoreRetryRepository, submitRetainedScore, type RetryView, type SavedSubmission } from '../systems/ScoreRetry.ts';
import { SoundManager } from '../systems/SoundManager.ts';
import { C, FONT_DISPLAY, style } from '../ui/tokens.ts';
import { etchedFrame } from '../ui/components.ts';
import { ScrollSheet } from '../ui/ScrollSheet.ts';
import { emblemKey } from '../art/artkit.ts';
import { paintVista } from '../art/menubg.ts';
import type { LoadingRequest } from './PreloadScene.ts';

/** Reserved band for the saved-score footer action, in the existing responsive footer region. */
const SAVED_BAND_HEIGHT = 52;

function addButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  primary: boolean,
  action: () => void,
  iconKey?: string
): void {
  const fill = primary ? 0x153c31 : 0x101820;
  const edge = primary ? 0xd7aa4e : 0x6d7880;
  scene.add.rectangle(x + 2, y + 4, width, height, 0x080b0d, 0.76).setOrigin(0);
  const button = scene.add.rectangle(x, y, width, height, fill, 0.96)
    .setOrigin(0)
    .setStrokeStyle(primary ? 2 : 1, edge, 1);
  const trim = etchedFrame(scene, x, y, width, height, primary);
  const labelSize = primary ? (height >= 80 ? 22 : 17) : (height >= 60 ? 17 : 15);
  const text = scene.add.text(0, 0, label, style(labelSize, primary ? C.goldBright : C.textPrimary, true, FONT_DISPLAY)).setOrigin(0.5);
  text.setStroke('#171a18', primary ? 2 : 1).setShadow(0, 2, '#05080a', 0.65, true, true);
  const centerY = y + height / 2;
  if (iconKey) {
    const iconSize = Math.min(primary ? 42 : 28, height * 0.58);
    const groupWidth = iconSize + 12 + text.width;
    const groupLeft = x + (width - groupWidth) / 2;
    scene.add.image(groupLeft + iconSize / 2, centerY, iconKey).setDisplaySize(iconSize, iconSize);
    text.setPosition(groupLeft + iconSize + 12 + text.width / 2, centerY);
  } else {
    text.setPosition(x + width / 2, centerY);
  }
  button.setInteractive({ useHandCursor: true });
  button.on('pointerover', () => {
    button.setFillStyle(primary ? 0x1d4b3c : 0x1c2a34, 1).setStrokeStyle(2, 0xf0cd72, 1);
    etchedFrame(scene, x, y, width, height, true, trim);
  });
  button.on('pointerout', () => {
    button.setFillStyle(fill, 0.96).setStrokeStyle(primary ? 2 : 1, edge, 1);
    etchedFrame(scene, x, y, width, height, primary, trim);
  });
  button.on('pointerdown', () => {
    SoundManager.get().unlock();
    SoundManager.get().click();
    action();
  });
}

export class MainMenuScene extends Phaser.Scene {
  private savedSheet: ScrollSheet | null = null;
  private savedRoot: Phaser.GameObjects.Container | null = null;
  private savedRetryAction: { update(label: string, available: boolean): void } | null = null;
  private savedView: RetryView | null = null;
  private savedSubmitting = false;
  private openSaved = false;
  private sceneGeneration = 0;
  private readonly handleResize = (): void => { this.scene.restart({ openSaved: this.openSaved }); };

  constructor() {
    super('MainMenu');
  }

  init(data?: { openSaved?: boolean }): void {
    this.openSaved = data?.openSaved === true;
  }

  create(): void {
    const W = this.scale.width;
    const H = this.scale.height;
    const generation = ++this.sceneGeneration;
    this.savedSheet = null;
    this.savedRoot = null;
    this.savedRetryAction = null;
    this.savedSubmitting = false;
    const compact = H < 520 || W < 780;
    const narrowCompact = compact && W < 720;
    paintVista(this, 'menu');
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) this.tweens.getTweens().forEach((tween) => tween.stop());

    const emblemSize = compact ? Math.min(62, H * 0.16) : Math.min(205, W * 0.14, H * 0.205);
    const emblemY = compact ? H * 0.12 : H * 0.20;
    this.add.image(W / 2, emblemY, emblemKey()).setDisplaySize(emblemSize, emblemSize);

    // The two-line title and substantial painted emblem make this a game title
    // screen, while leaving the same scenic keep visible around the mark.
    const firstLineSize = compact ? 20 : Math.min(64, W * 0.04);
    const secondLineSize = compact ? Math.min(36, W * 0.047) : Math.min(90, W * 0.054);
    const firstLineY = compact ? H * 0.255 : H * 0.315;
    const secondLineY = compact ? H * 0.35 : H * 0.405;
    const firstLine = this.add.text(W / 2, firstLineY, 'Aegis of the', style(firstLineSize, C.goldBright, true, FONT_DISPLAY)).setOrigin(0.5);
    const secondLine = this.add.text(W / 2, secondLineY, 'Borderkeep', style(secondLineSize, C.goldBright, true, FONT_DISPLAY)).setOrigin(0.5);
    for (const titleLine of [firstLine, secondLine]) {
      titleLine.setStroke('#211b16', 3).setShadow(0, 3, '#080a0c', 0.76, true, true);
    }
    const ruleY = compact ? H * 0.433 : H * 0.475;
    const rule = this.add.graphics();
    rule.lineStyle(1.5, 0xd7aa4e, 0.82);
    rule.lineBetween(W / 2 - Math.min(compact ? 120 : 230, W * 0.28), ruleY, W / 2 - 12, ruleY);
    rule.lineBetween(W / 2 + 12, ruleY, W / 2 + Math.min(compact ? 120 : 230, W * 0.28), ruleY);
    rule.lineStyle(2, 0xf0cd72, 1);
    rule.lineBetween(W / 2, ruleY - 5, W / 2 + 5, ruleY);
    rule.lineBetween(W / 2 + 5, ruleY, W / 2, ruleY + 5);
    rule.lineBetween(W / 2, ruleY + 5, W / 2 - 5, ruleY);
    rule.lineBetween(W / 2 - 5, ruleY, W / 2, ruleY - 5);

    const subtitleY = compact ? H * 0.47 : H * 0.51;
    this.add.text(W / 2, subtitleY, 'ANCIENT BORDER KEEP  ·  DEFEND THE PASS', style(12, C.textPrimary, true)).setOrigin(0.5);

    const best = loadBest();
    const legacy = loadLegacyBest();
    const bestY = compact ? H * 0.515 : H * 0.545;
    const bestWrap = Math.max(220, W - 32);
    if (best) {
      this.add.text(W / 2, bestY, `Personal best  ·  ${best.score.toLocaleString('en-US')} pts  ·  Wave ${best.wave}`, style(12, C.textSecondary)).setOrigin(0.5).setWordWrapWidth(bestWrap);
    }
    if (legacy) {
      this.add.text(W / 2, best ? bestY + 16 : bestY, `Legacy era ${legacy.scoreVersion} best  ·  ${legacy.score.toLocaleString('en-US')} pts  ·  Wave ${legacy.wave}`, style(12, C.textSecondary)).setOrigin(0.5).setWordWrapWidth(bestWrap);
    }

    const savedY = H - SAVED_BAND_HEIGHT;
    if (narrowCompact) {
      const width = Math.min(360, W - 32);
      const height = 44;
      const gap = 8;
      const startY = H - SAVED_BAND_HEIGHT - (height * 4 + gap * 3) - 12;
      addButton(this, (W - width) / 2, startY, width, height, 'Campaign', true, () => this.scene.start('Preload', { stage: 'campaign', destination: 'Campaign' } satisfies LoadingRequest), 'hud_wave');
      addButton(this, (W - width) / 2, startY + height + gap, width, height, 'Classic Siege', true, () => this.scene.start('Difficulty'), 'hud_wave');
      addButton(this, (W - width) / 2, startY + (height + gap) * 2, width, height, 'Hall of Legends', false, () => this.scene.start('Leaderboard', {}), 'hud_score');
      const half = (width - gap) / 2;
      const lastY = startY + (height + gap) * 3;
      addButton(this, (W - width) / 2, lastY, half, height, 'Settings', false, () => this.scene.start('Settings'));
      addButton(this, (W - width) / 2 + half + gap, lastY, half, height, 'Progression', false, () => this.scene.start('Progression'));
    } else if (compact) {
      const gap = 12;
      const margin = 24;
      const total = W - margin * 2;
      const modeWidth = (total - gap) / 2;
      const width = (total - gap * 2) / 3;
      const height = 44;
      const y = H - SAVED_BAND_HEIGHT - 12 - height * 2 - gap;
      addButton(this, margin, y, modeWidth, height, 'Campaign', true, () => this.scene.start('Preload', { stage: 'campaign', destination: 'Campaign' } satisfies LoadingRequest), 'hud_wave');
      addButton(this, margin + modeWidth + gap, y, modeWidth, height, 'Classic Siege', true, () => this.scene.start('Difficulty'), 'hud_wave');
      addButton(this, margin, y + height + gap, width, height, 'Hall of Legends', false, () => this.scene.start('Leaderboard', {}), 'hud_score');
      addButton(this, margin + width + gap, y + height + gap, width, height, 'Settings', false, () => this.scene.start('Settings'));
      addButton(this, margin + (width + gap) * 2, y + height + gap, width, height, 'Progression', false, () => this.scene.start('Progression'));
    } else {
      const width = Math.min(680, Math.max(600, W * 0.4));
      const startY = H * (best ? 0.588 : 0.566);
      const playHeight = Math.min(98, H * 0.105);
      const secondaryHeight = Math.min(76, H * 0.082);
      const gap = Math.max(12, Math.min(16, H * 0.018));
      const half = (width - 12) / 2;
      addButton(this, (W - width) / 2, startY, half, playHeight, 'Campaign', true, () => this.scene.start('Preload', { stage: 'campaign', destination: 'Campaign' } satisfies LoadingRequest), 'hud_wave');
      addButton(this, (W - width) / 2 + half + 12, startY, half, playHeight, 'Classic Siege', true, () => this.scene.start('Difficulty'), 'hud_wave');
      addButton(this, (W - width) / 2, startY + playHeight + gap, width, secondaryHeight, 'Hall of Legends', false, () => this.scene.start('Leaderboard', {}), 'hud_score');
      const lastY = startY + playHeight + gap + secondaryHeight + gap;
      addButton(this, (W - width) / 2, lastY, half, secondaryHeight, 'Settings', false, () => this.scene.start('Settings'));
      addButton(this, (W - width) / 2 + half + 12, lastY, half, secondaryHeight, 'Progression', false, () => this.scene.start('Progression'));
    }

    const settings = loadSettings();
    if (settings.playerName) {
      const name = settings.playerName.slice(0, 20);
      this.add.text(W - 18, 16, `DEFENDER  ${name}`, style(12, C.textPrimary, true)).setOrigin(1, 0);
    }

    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
      this.destroySavedSheet();
      if (this.sceneGeneration === generation) {
        this.sceneGeneration++;
        this.openSaved = false;
      }
    });
    // Opening the menu never stages anything; this only reads the retained retry view.
    void this.loadSavedScore(generation, savedY, W);
  }

  private destroySavedSheet(): void {
    this.savedSheet?.destroy();
    this.savedSheet = null;
    this.savedRoot?.destroy(true);
    this.savedRoot = null;
    this.savedRetryAction = null;
  }

  private async loadSavedScore(generation: number, savedY: number, W: number): Promise<void> {
    const view = await scoreRetryRepository.view();
    if (this.sceneGeneration !== generation) return;
    this.savedView = view;
    if (view.status === 'ready' || view.status === 'incompatible') {
      const width = Math.min(320, W - 48);
      addButton(this, (W - width) / 2, savedY, width, 44, 'Saved Score', false, () => { void this.openSavedScore(); });
    } else if (view.status === 'unreadable' && view.warning) {
      this.add.text(W / 2, savedY + 22, view.warning, style(11, C.dangerBright, true)).setOrigin(0.5).setWordWrapWidth(Math.min(440, W - 32)).setAlign('center');
    }
    if (this.openSaved) this.drawSavedScore(view, null);
  }

  /** Explicit user action: read the retained attempt fresh under a scene generation guard. */
  async openSavedScore(): Promise<void> {
    const generation = this.sceneGeneration;
    this.openSaved = true;
    const view = await scoreRetryRepository.view();
    if (this.sceneGeneration !== generation) return;
    this.savedView = view;
    this.drawSavedScore(view, null);
  }

  private drawSavedScore(view: RetryView, message: string | null): void {
    this.destroySavedSheet();
    const W = this.scale.width, H = this.scale.height;
    const root = this.add.container(0, 0).setDepth(60);
    this.savedRoot = root;
    const sheet = new ScrollSheet(this, root, { x: 12, y: 12, width: W - 24, height: H - 24 }, 'Saved Score', () => this.closeSavedScore());
    this.savedSheet = sheet;
    const record = view.record;
    let y = 0;
    const lines = message ? [message] : [];
    if (record) {
      const p = record.payload;
      lines.push(p.playerName, `${p.difficulty.toUpperCase()} · ${p.outcome}`, `Wave ${p.highestWave} · Score ${p.finalScore.toLocaleString('en-US')}`);
      if (view.status === 'incompatible') lines.push('This saved score belongs to an earlier leaderboard era and cannot be submitted to the current board.');
      else lines.push(view.warning ?? (view.persisted ? 'Saved in this browser.' : 'Available in this session only.'));
    } else if (!message) {
      lines.push(view.warning ?? 'No saved score retry to submit.');
    }
    for (const line of lines) { const text = sheet.text(y, line); y += text.height + 12; }
    if (record) {
      // Ready records retry; a retired-era record shows the same control disabled.
      this.savedRetryAction = sheet.action(y, 'Retry Submission', () => { void this.retrySavedScore(record); }, 'primary', view.status === 'ready');
      sheet.action(y + 52, 'Back', () => this.closeSavedScore());
    } else {
      sheet.action(y, 'Back', () => this.closeSavedScore());
    }
  }

  /**
   * Menu counterpart of the results submission: the held action is disabled
   * synchronously before the first await, and the claim is conditional on the
   * displayed attempt, so a newer tab attempt is never silently replaced.
   */
  async retrySavedScore(record: SavedSubmission): Promise<void> {
    if (this.savedSubmitting) return;
    this.savedSubmitting = true;
    this.savedRetryAction?.update('Retry Submission', false);
    const generation = this.sceneGeneration;
    try {
      const completed = await submitRetainedScore(record.payload, scoreRetryRepository, record);
      if (this.sceneGeneration !== generation) return;
      const message = completed.result.ok ? 'Score saved to the Hall of Legends.'
        : completed.result.duplicate ? 'This run was already recorded.'
        : completed.result.error ?? 'This score could not be submitted.';
      this.drawSavedScore(completed.retry, message);
    } finally {
      this.savedSubmitting = false;
    }
  }

  private closeSavedScore(): void {
    this.openSaved = false;
    this.destroySavedSheet();
  }
}
