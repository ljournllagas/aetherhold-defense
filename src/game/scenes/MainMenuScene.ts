import Phaser from 'phaser';
import { loadBest, loadLegacyBest, loadSettings } from '../systems/Settings.ts';
import { SoundManager } from '../systems/SoundManager.ts';
import { C, FONT_DISPLAY, style } from '../ui/tokens.ts';
import { etchedFrame } from '../ui/components.ts';
import { emblemKey } from '../art/artkit.ts';
import { paintVista } from '../art/menubg.ts';

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
  private readonly handleResize = (): void => { this.scene.restart(); };

  constructor() {
    super('MainMenu');
  }

  create(): void {
    const W = this.scale.width;
    const H = this.scale.height;
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

    if (narrowCompact) {
      const width = Math.min(360, W - 32);
      const height = 44;
      const gap = 8;
      const startY = Math.max(H * 0.52, H - (height * 4 + gap * 3) - 18);
      addButton(this, (W - width) / 2, startY, width, height, 'Play', true, () => this.scene.start('Difficulty'), 'hud_wave');
      addButton(this, (W - width) / 2, startY + height + gap, width, height, 'Hall of Legends', false, () => this.scene.start('Leaderboard', {}), 'hud_score');
      addButton(this, (W - width) / 2, startY + (height + gap) * 2, width, height, 'Settings', false, () => this.scene.start('Settings'));
      addButton(this, (W - width) / 2, startY + (height + gap) * 3, width, height, 'Progression', false, () => this.scene.start('Progression'));
    } else if (compact) {
      const gap = 12;
      const margin = 24;
      const width = (W - margin * 2 - gap * 3) / 4;
      const total = width * 4 + gap * 3;
      const startX = (W - total) / 2;
      const height = 48;
      const y = Math.min(H - height - 20, H * (best ? 0.64 : 0.61));
      addButton(this, startX, y, width, height, 'Play', true, () => this.scene.start('Difficulty'), 'hud_wave');
      addButton(this, startX + width + gap, y, width, height, 'Hall of Legends', false, () => this.scene.start('Leaderboard', {}), 'hud_score');
      addButton(this, startX + (width + gap) * 2, y, width, height, 'Settings', false, () => this.scene.start('Settings'));
      addButton(this, startX + (width + gap) * 3, y, width, height, 'Progression', false, () => this.scene.start('Progression'));
    } else {
      const width = Math.min(500, Math.max(320, W * 0.29));
      const startY = H * (best ? 0.588 : 0.566);
      const playHeight = Math.min(98, H * 0.105);
      const secondaryHeight = Math.min(76, H * 0.082);
      const gap = Math.max(12, Math.min(16, H * 0.018));
      addButton(this, (W - width) / 2, startY, width, playHeight, 'Play', true, () => this.scene.start('Difficulty'), 'hud_wave');
      addButton(this, (W - width) / 2, startY + playHeight + gap, width, secondaryHeight, 'Hall of Legends', false, () => this.scene.start('Leaderboard', {}), 'hud_score');
      const lastY = startY + playHeight + gap + secondaryHeight + gap;
      const half = (width - 12) / 2;
      addButton(this, (W - width) / 2, lastY, half, secondaryHeight, 'Settings', false, () => this.scene.start('Settings'));
      addButton(this, (W - width) / 2 + half + 12, lastY, half, secondaryHeight, 'Progression', false, () => this.scene.start('Progression'));
    }

    const settings = loadSettings();
    if (settings.playerName) {
      const name = settings.playerName.slice(0, 20);
      this.add.text(W - 18, 16, `DEFENDER  ${name}`, style(12, C.textPrimary, true)).setOrigin(1, 0);
    }

    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this));
  }
}
