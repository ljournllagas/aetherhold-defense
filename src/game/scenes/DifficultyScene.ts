import Phaser from 'phaser';
import { DIFFICULTY_LIST } from '../config/difficulties.ts';
import type { DifficultyId } from '../../shared/types.ts';
import { loadSettings, saveSettings } from '../systems/Settings.ts';
import { SoundManager } from '../systems/SoundManager.ts';
import { C, FONT_DISPLAY, style } from '../ui/tokens.ts';
import { etchedFrame } from '../ui/components.ts';
import { emblemKey } from '../art/artkit.ts';
import { paintVista } from '../art/menubg.ts';
import { ScrollSheet } from '../ui/ScrollSheet.ts';

const COLORS = { selected: 0xd7aa4e, line: 0x445564, card: 0x101820, raised: 0x19232d };

function addButton(scene: Phaser.Scene, x: number, y: number, width: number, height: number, label: string, primary: boolean, action: () => void): Phaser.GameObjects.Rectangle {
  const fill = primary ? 0x153c31 : COLORS.raised;
  const box = scene.add.rectangle(x, y, width, height, fill, 0.97)
    .setOrigin(0).setStrokeStyle(primary ? 2 : 1, primary ? COLORS.selected : COLORS.line);
  const frame = etchedFrame(scene, x, y, width, height, primary);
  scene.add.text(x + width / 2, y + height / 2, label, style(14, primary ? C.goldBright : C.textPrimary, true, FONT_DISPLAY)).setOrigin(0.5);
  box.setInteractive({ useHandCursor: true });
  box.on('pointerover', () => {
    box.setFillStyle(primary ? 0x1d4b3c : 0x22303c, 1).setStrokeStyle(2, 0xf0cd72);
    etchedFrame(scene, x, y, width, height, true, frame);
  });
  box.on('pointerout', () => {
    box.setFillStyle(fill, 0.97).setStrokeStyle(primary ? 2 : 1, primary ? COLORS.selected : COLORS.line);
    etchedFrame(scene, x, y, width, height, primary, frame);
  });
  box.on('pointerdown', action);
  return box;
}

export class DifficultyScene extends Phaser.Scene {
  private selectedDiff: DifficultyId = 'medium';
  private playerName = '';
  private nameInput: HTMLInputElement | null = null;
  private phoneSheet: ScrollSheet | null = null;
  private phoneRoot: Phaser.GameObjects.Container | null = null;
  private diffCards: Array<{ id: DifficultyId; box: Phaser.GameObjects.Rectangle; marker: Phaser.GameObjects.Text; frame: Phaser.GameObjects.Graphics; band: Phaser.GameObjects.Rectangle }> = [];
  private readonly handleResize = (): void => {
    if (this.phoneRoot) this.drawPhoneControls();
    else if (this.nameInput && this.nameInput === document.activeElement) { this.nameInput.blur(); this.scene.restart(); }
    else this.scene.restart();
  };

  constructor() {
    super('Difficulty');
  }

  create(): void {
    const W = this.scale.width;
    const H = this.scale.height;
    const compact = H < 560 || W < 900;
    const settings = loadSettings();
    this.selectedDiff = settings.difficulty;
    this.playerName = settings.playerName || '';
    this.diffCards = [];
    if (W < 1180 || H < 540) { this.createPhone(); return; }

    paintVista(this, 'menu');
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) this.tweens.getTweens().forEach((tween) => tween.stop());

    const headerWidth = Math.min(compact ? 430 : 520, W - 24);
    const headerHeight = compact ? 38 : 54;
    const headerY = compact ? 2 : 18;
    this.add.rectangle((W - headerWidth) / 2, headerY, headerWidth, headerHeight, 0x0b1117, 0.76).setOrigin(0).setStrokeStyle(1, 0x594b33, 0.82);
    etchedFrame(this, (W - headerWidth) / 2, headerY, headerWidth, headerHeight, false);
    const crest = compact ? 32 : 48;
    const brandY = headerY + headerHeight / 2;
    const brandSize = compact ? 16 : 22;
    const brandTitle = this.add.text(W / 2, brandY, 'Aegis of the Borderkeep', style(brandSize, C.goldBright, true, FONT_DISPLAY)).setOrigin(0.5);
    const brandGap = compact ? 9 : 14;
    const brandX = (W - crest - brandGap - brandTitle.width) / 2;
    this.add.image(brandX + crest / 2, brandY, emblemKey()).setDisplaySize(crest, crest);
    brandTitle.setX(brandX + crest + brandGap + brandTitle.width / 2);

    const headingY = compact ? 58 : 104;
    this.add.text(W / 2, headingY, 'Choose Your Defense', style(compact ? 18 : 27, C.goldBright, true, FONT_DISPLAY)).setOrigin(0.5);
    if (!compact) {
      this.add.text(W / 2, headingY + 29, 'Set a defender name, then choose the siege you are ready to face.', style(14, C.textSecondary)).setOrigin(0.5);
    }

    const fieldWidth = Math.min(compact ? 500 : 540, W - (compact ? 40 : 64));
    const fieldX = (W - fieldWidth) / 2;
    const labelY = compact ? 78 : 160;
    const fieldY = compact ? 92 : 179;
    const fieldHeight = compact ? 44 : 46;
    this.add.text(fieldX, labelY, 'DEFENDER NAME  ·  20 CHARACTERS MAX', style(12, C.textPrimary, true)).setOrigin(0, 0);
    this.add.rectangle(fieldX, fieldY, fieldWidth, fieldHeight, 0x0b1117, 0.97).setOrigin(0).setStrokeStyle(1, 0x8a7045, 1);
    etchedFrame(this, fieldX, fieldY, fieldWidth, fieldHeight, false);

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.value = this.playerName;
    nameInput.maxLength = 20;
    nameInput.autocomplete = 'name';
    nameInput.spellcheck = false;
    nameInput.setAttribute('aria-label', 'Defender name, 20 characters maximum');
    nameInput.placeholder = 'Enter a name for the chronicles';
    nameInput.style.cssText = [
      'position:fixed', 'z-index:1000', 'box-sizing:border-box', 'padding:0 14px',
      'border:1px solid #6d7880', 'border-radius:2px', 'background:rgba(10,14,18,.96)',
      'color:#F3EBDD', 'font:600 14px Inter,system-ui,sans-serif', 'outline:none',
      'box-shadow:inset 0 0 0 1px rgba(215,170,78,.18)', 'touch-action:manipulation'
    ].join(';');
    const positionInput = (): void => {
      const bounds = this.game.canvas.getBoundingClientRect();
      const sx = bounds.width / Math.max(1, this.scale.width);
      const sy = bounds.height / Math.max(1, this.scale.height);
      nameInput.style.left = `${bounds.left + fieldX * sx}px`;
      nameInput.style.top = `${bounds.top + fieldY * sy}px`;
      nameInput.style.width = `${fieldWidth * sx}px`;
      nameInput.style.height = `${fieldHeight * sy}px`;
      nameInput.style.fontSize = `${Math.max(12, 14 * Math.min(sx, sy))}px`;
    };
    nameInput.addEventListener('focus', () => { nameInput.style.outline = '2px solid #F0CD72'; nameInput.style.outlineOffset = '2px'; });
    nameInput.addEventListener('blur', () => { nameInput.style.outline = 'none'; nameInput.style.outlineOffset = '0'; });
    nameInput.addEventListener('input', () => {
      const clean = nameInput.value.replace(/[^\w '\-]/g, '').slice(0, 20);
      if (clean !== nameInput.value) nameInput.value = clean;
      this.playerName = clean;
      const next = loadSettings();
      next.playerName = clean;
      saveSettings(next);
    });
    nameInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') this.beginSiege();
      if (event.key === 'Escape') this.scene.start('MainMenu');
    });
    document.body.appendChild(nameInput);
    this.nameInput = nameInput;
    positionInput();

    const gap = compact ? 10 : 20;
    const margin = compact ? 12 : W < 1100 ? 32 : Math.min(128, W * 0.09);
    const cardWidth = Math.min(340, (W - margin * 2 - gap * 2) / 3);
    const totalWidth = cardWidth * 3 + gap * 2;
    const cardX = (W - totalWidth) / 2;
    const cardHeight = compact ? Math.min(168, Math.max(156, H * 0.42)) : Math.min(410, Math.max(350, H * 0.46));
    const cardY = compact ? fieldY + fieldHeight + 14 : Math.max(fieldY + fieldHeight + 26, H * 0.32);
    const crestKeys: Record<DifficultyId, string> = {
      easy: 'difficulty_helm_easy',
      medium: 'difficulty_helm_medium',
      hard: 'difficulty_helm_hard'
    };
    const tierColors: Record<DifficultyId, number> = { easy: 0x66865d, medium: 0x6686aa, hard: 0x925454 };

    DIFFICULTY_LIST.forEach((difficulty, index) => {
      const x = cardX + index * (cardWidth + gap);
      const selected = difficulty.id === this.selectedDiff;
      const box = this.add.rectangle(x, cardY, cardWidth, cardHeight, selected ? 0x1b2832 : 0x0d141a, 0.96)
        .setOrigin(0).setStrokeStyle(selected ? 2 : 1, selected ? COLORS.selected : COLORS.line);
      const frame = etchedFrame(this, x, cardY, cardWidth, cardHeight, selected);
      const band = this.add.rectangle(x + 10, cardY + 8, cardWidth - 20, 3, selected ? 0xf0cd72 : tierColors[difficulty.id], selected ? 0.96 : 0.72).setOrigin(0);
      const marker = this.add.text(x + cardWidth - 16, cardY + (compact ? 13 : 18), selected ? 'SELECTED' : '', style(12, C.goldBright, true)).setOrigin(1, 0);
      const crestSize = compact ? 56 : Math.min(128, cardHeight * 0.34);
      const crestY = cardY + (compact ? 31 : 86);
      this.add.image(x + cardWidth / 2, crestY, crestKeys[difficulty.id]).setDisplaySize(crestSize, crestSize);
      const headingY = cardY + (compact ? 65 : 160);
      this.add.text(x + cardWidth / 2, headingY, difficulty.label.toUpperCase(), style(compact ? 16 : 22, selected ? C.goldBright : C.textPrimary, true, FONT_DISPLAY)).setOrigin(0.5, 0);
      const descriptionY = headingY + (compact ? 22 : 31);
      const compactDescriptions: Record<DifficultyId, string> = {
        easy: 'A forgiving first siege.',
        medium: 'The intended challenge.',
        hard: 'A trial for veteran wardens.'
      };
      const description = compact ? compactDescriptions[difficulty.id] : difficulty.description;
      this.add.text(x + cardWidth / 2, descriptionY, description, style(compact ? 12 : 13, C.textSecondary))
        .setOrigin(0.5, 0).setWordWrapWidth(cardWidth - 34).setAlign('center');
      const statTop = cardY + cardHeight - (compact ? 53 : 128);
      const rowGap = compact ? 16 : 35;
      const statRows = [
        [`STARTING GOLD`, `${difficulty.startingGold.toLocaleString('en-US')}`, 'hud_gold'],
        [`STARTING LIVES`, `${difficulty.startingLives}`, 'hud_lives'],
        [`SCORE MULTIPLIER`, `${difficulty.scoreMultiplier.toFixed(2)}×`, 'hud_score']
      ];
      statRows.forEach(([label, value, iconKey], statIndex) => {
        const rowY = statTop + statIndex * rowGap;
        if (!compact) {
          const divider = this.add.graphics();
          divider.lineStyle(1, 0x445564, 0.7);
          divider.lineBetween(x + 20, rowY - 14, x + cardWidth - 20, rowY - 14);
        }
        const iconSize = compact ? 16 : 22;
        this.add.image(x + (compact ? 18 : 25), rowY, iconKey).setDisplaySize(iconSize, iconSize);
        this.add.text(x + (compact ? 30 : 42), rowY, label, style(12, C.textSecondary, true)).setOrigin(0, 0.5);
        this.add.text(x + cardWidth - 14, rowY, value, style(compact ? 12 : 14, C.goldBright, true)).setOrigin(1, 0.5);
      });
      box.setInteractive({ useHandCursor: true });
      box.on('pointerdown', () => this.selectDifficulty(difficulty.id));
      band.setDepth(1);
      this.diffCards.push({ id: difficulty.id, box, marker, frame, band });
    });

    const actionHeight = 48;
    const actionGap = 16;
    const actionWidth = Math.min(compact ? 232 : 240, (W - 44 - actionGap) / 2);
    const actionY = H - actionHeight - (compact ? 8 : 24);
    const actionStartX = W / 2 - actionWidth - actionGap / 2;
    addButton(this, actionStartX, actionY, actionWidth, actionHeight, 'Back', false, () => {
      SoundManager.get().click();
      this.scene.start('MainMenu');
    });
    addButton(this, W / 2 + actionGap / 2, actionY, actionWidth, actionHeight, 'Continue', true, () => this.beginSiege());

    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
      this.nameInput?.remove();
      this.nameInput = null;
    });
  }

  private selectDifficulty(id: DifficultyId): void {
    this.selectedDiff = id;
    SoundManager.get().click();
    const settings = loadSettings();
    settings.difficulty = id;
    saveSettings(settings);
    this.diffCards.forEach(({ id: cardId, box, marker }) => {
      const selected = cardId === id;
      box.setFillStyle(selected ? 0x1b2832 : 0x0d141a, 0.96);
      box.setStrokeStyle(selected ? 2 : 1, selected ? COLORS.selected : COLORS.line);
      marker.setText(selected ? 'SELECTED' : '');
    });
    this.diffCards.forEach(({ id: cardId, frame, band, box }) => {
      const selected = cardId === id;
      const x = box.x;
      const y = box.y;
      etchedFrame(this, x, y, box.width, box.height, selected, frame);
      band.setFillStyle(selected ? 0xf0cd72 : (cardId === 'easy' ? 0x66865d : cardId === 'medium' ? 0x6686aa : 0x925454), selected ? 0.96 : 0.72);
    });
  }

  private createPhone(): void {
    paintVista(this, 'menu');
    this.phoneRoot = this.add.container(0, 0).setDepth(100);
    const input = document.createElement('input'); input.value = this.playerName; input.maxLength = 20; input.autocomplete = 'name';
    input.setAttribute('aria-label', 'Defender name, 20 characters maximum'); input.placeholder = 'Defender name';
    input.style.cssText = 'position:fixed;height:44px;box-sizing:border-box;z-index:1000;background:#0a0e12;color:#f3ebdd;border:1px solid #d7aa4e;padding:8px 12px;font:16px Inter,system-ui';
    input.addEventListener('input', () => { this.playerName = input.value.replace(/[^\w '\-]/g, '').slice(0, 20); input.value = this.playerName; saveSettings({ ...loadSettings(), playerName: this.playerName }); });
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { input.blur(); this.beginSiege(); } });
    document.body.appendChild(input); this.nameInput = input;
    input.addEventListener('blur', () => { if (this.phoneRoot && this.scene.isActive('Difficulty')) this.drawPhoneControls(); });
    this.drawPhoneControls();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this); this.phoneSheet?.destroy(); this.phoneSheet = null; this.phoneRoot = null; input.remove(); this.nameInput = null; });
  }

  private drawPhoneControls(): void {
    if (!this.phoneRoot || !this.nameInput) return;
    const W = this.scale.width, H = this.scale.height;
    this.phoneSheet?.destroy(); this.phoneSheet = null; this.phoneRoot.removeAll(true);
    const before = new Set(this.children.list);
    this.add.text(W / 2, 20, 'Choose Your Defense', style(20, C.goldBright, true, FONT_DISPLAY)).setOrigin(.5);
    this.add.text(16, 48, 'DEFENDER NAME · 20 CHARACTERS MAX', style(12, C.textSecondary));
    const bounds = this.game.canvas.getBoundingClientRect();
    Object.assign(this.nameInput.style, { left: `${bounds.left + 16}px`, top: `${bounds.top + 70}px`, width: `${W - 32}px` });
    const height = Math.max(96, H - 198);
    const sheet = new ScrollSheet(this, this.phoneRoot, { x: 8, y: 126, width: W - 16, height }, 'Difficulty', () => this.scene.start('MainMenu')); this.phoneSheet = sheet;
    DIFFICULTY_LIST.forEach((d, i) => {
      sheet.action(i * 132, `${d.id === this.selectedDiff ? '✓ ' : ''}${d.label}`, () => { this.selectedDiff = d.id; saveSettings({ ...loadSettings(), difficulty: d.id }); this.drawPhoneControls(); }, d.id === this.selectedDiff ? 'primary' : 'secondary');
      sheet.text(i * 132 + 52, `${d.description}\n${d.startingGold} gold · ${d.startingLives} lives · ${d.scoreMultiplier}× score`);
    });
    addButton(this, 16, H - 56, (W - 40) / 2, 44, 'Back', false, () => this.scene.start('MainMenu'));
    addButton(this, 24 + (W - 40) / 2, H - 56, (W - 40) / 2, 44, 'Continue', true, () => this.beginSiege());
    this.phoneRoot.add(this.children.list.filter(view => !before.has(view) && !view.parentContainer));
  }

  private beginSiege(): void {
    SoundManager.get().unlock();
    SoundManager.get().click();
    const name = (this.nameInput?.value ?? this.playerName).trim().replace(/\s+/g, ' ').slice(0, 20) || 'Warden';
    const settings = loadSettings();
    settings.playerName = name;
    settings.difficulty = this.selectedDiff;
    saveSettings(settings);
    this.scene.start('Game', { difficulty: this.selectedDiff, playerName: name });
  }
}
