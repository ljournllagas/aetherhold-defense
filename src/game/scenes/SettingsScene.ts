import Phaser from 'phaser';
import { loadSettings, saveSettings } from '../systems/Settings.ts';
import { SoundManager } from '../systems/SoundManager.ts';
import { C, FONT_DISPLAY, style } from '../ui/tokens.ts';
import { emblemKey } from '../art/artkit.ts';
import { paintVista } from '../art/menubg.ts';
import { ScrollSheet } from '../ui/ScrollSheet.ts';

const PANEL = 0x101820;
const BORDER = 0x58636b;
const GOLD = 0xd7aa4e;

function drawControl(scene: Phaser.Scene, x: number, y: number, width: number, height: number, label: string, selected: boolean, action: () => void): { box: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text } {
  const box = scene.add.rectangle(x, y, width, height, selected ? 0x263529 : 0x19232d, 0.98)
    .setOrigin(0).setStrokeStyle(selected ? 2 : 1, selected ? GOLD : BORDER);
  const text = scene.add.text(x + width / 2, y + height / 2, label, style(12, selected ? C.goldBright : C.textPrimary, true)).setOrigin(0.5);
  box.setInteractive({ useHandCursor: true });
  box.on('pointerover', () => box.setStrokeStyle(2, 0xf0cd72));
  box.on('pointerout', () => box.setStrokeStyle(selected ? 2 : 1, selected ? GOLD : BORDER));
  box.on('pointerdown', action);
  return { box, label: text };
}

export class SettingsScene extends Phaser.Scene {
  private savedScroll = 0;
  private readonly handleResize = (): void => { this.scene.restart(); };

  constructor() {
    super('Settings');
  }

  create(): void {
    const W = this.scale.width;
    const H = this.scale.height;
    if (W < 768) { this.createPhone(); return; }
    const compact = H < 560 || W < 850;
    paintVista(this, 'board');
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) this.tweens.getTweens().forEach((tween) => tween.stop());

    const crest = compact ? 30 : 46;
    const titleY = compact ? 28 : 76;
    const title = this.add.text(W / 2, titleY, 'WARDEN SETTINGS', style(compact ? 20 : 30, C.goldBright, true, FONT_DISPLAY)).setOrigin(0.5);
    const titleGap = compact ? 10 : 14;
    const titleX = (W - crest - titleGap - title.width) / 2;
    this.add.image(titleX + crest / 2, titleY, emblemKey()).setDisplaySize(crest, crest);
    title.setX(titleX + crest + titleGap + title.width / 2);
    if (!compact) this.add.text(W / 2, 116, 'Set the sound and pace of your next defense.', style(14, C.textSecondary)).setOrigin(0.5);

    const panelWidth = Math.min(compact ? 760 : 820, W - (compact ? 28 : 80));
    const panelX = (W - panelWidth) / 2;
    const panelTop = compact ? 52 : Math.max(150, H * 0.2);
    const actionY = H - (compact ? 52 : 84);
    const panelBottom = compact ? actionY - 8 : actionY - 18;
    const panelHeight = panelBottom - panelTop;
    this.add.rectangle(panelX, panelTop, panelWidth, panelHeight, PANEL, 0.96).setOrigin(0).setStrokeStyle(1, BORDER, 1);
    const trim = this.add.graphics();
    trim.lineStyle(1, GOLD, 0.4);
    trim.strokeRect(panelX + 5, panelTop + 5, panelWidth - 10, panelHeight - 10);
    trim.lineStyle(2, GOLD, 0.82);
    trim.lineBetween(panelX + 9, panelTop + 9, panelX + 30, panelTop + 9);
    trim.lineBetween(panelX + 9, panelTop + 9, panelX + 9, panelTop + 30);
    trim.lineBetween(panelX + panelWidth - 30, panelTop + panelHeight - 9, panelX + panelWidth - 9, panelTop + panelHeight - 9);
    trim.lineBetween(panelX + panelWidth - 9, panelTop + panelHeight - 30, panelX + panelWidth - 9, panelTop + panelHeight - 9);

    const current = loadSettings();
    const soundState = SoundManager.get();
    soundState.masterVolume = current.masterVolume;
    soundState.musicVolume = current.musicVolume;
    soundState.sfxVolume = current.sfxVolume;
    soundState.musicOn = current.musicOn;
    soundState.sfxOn = current.sfxOn;
    soundState.applyVolumes();
    const rowHeight = compact ? 44 : 52;
    const rowGap = compact ? 47 : Math.min(76, Math.max(62, (H - 280) / 7));
    const contentTop = panelTop + (compact ? 8 : 24);
    const valueX = panelX + panelWidth * 0.78;
    const minusX = panelX + panelWidth * 0.64;
    const plusX = panelX + panelWidth * 0.86;

    const setVolume = (key: 'masterVolume' | 'musicVolume' | 'sfxVolume', delta: number): void => {
      const next = loadSettings();
      next[key] = Math.max(0, Math.min(1, Math.round((next[key] + delta) * 10) / 10));
      saveSettings(next);
      const sound = SoundManager.get();
      sound.masterVolume = next.masterVolume;
      sound.musicVolume = next.musicVolume;
      sound.sfxVolume = next.sfxVolume;
      sound.applyVolumes();
      SoundManager.get().click();
      this.scene.restart();
    };

    const volumeRows: Array<{ key: 'masterVolume' | 'musicVolume' | 'sfxVolume'; label: string }> = [
      { key: 'masterVolume', label: 'Master Volume' },
      { key: 'musicVolume', label: 'Music Volume' },
      { key: 'sfxVolume', label: 'Sound Effects Volume' }
    ];
    volumeRows.forEach(({ key, label }, index) => {
      const y = contentTop + index * rowGap;
      this.add.text(panelX + 24, y + rowHeight / 2, label, style(14, C.textPrimary, true)).setOrigin(0, 0.5);
      const trackX = panelX + panelWidth * 0.40;
      const trackW = Math.max(36, minusX - trackX - 14);
      this.add.rectangle(trackX, y + rowHeight / 2 - 2, trackW, 4, 0x445564).setOrigin(0);
      const value = current[key];
      this.add.rectangle(trackX, y + rowHeight / 2 - 2, trackW * value, 4, GOLD).setOrigin(0);
      this.add.text(valueX, y + rowHeight / 2, `${Math.round(value * 100)}%`, style(12, C.goldBright, true)).setOrigin(0.5);
      drawControl(this, minusX, y + (rowHeight - 44) / 2, 44, 44, '−', false, () => setVolume(key, -0.1));
      drawControl(this, plusX, y + (rowHeight - 44) / 2, 44, 44, '+', false, () => setVolume(key, 0.1));
      if (index < volumeRows.length - 1) {
        const line = this.add.graphics();
        line.lineStyle(1, 0x445564, 0.64);
        line.lineBetween(panelX + 22, y + rowHeight + 1, panelX + panelWidth - 22, y + rowHeight + 1);
      }
    });

    const togglesY = contentTop + rowGap * 3 + 7;
    this.add.text(panelX + 24, togglesY + 22, 'Audio Channels', style(14, C.textPrimary, true)).setOrigin(0, 0.5);
    const toggleWidth = Math.min(154, panelWidth * 0.24);
    const toggleGap = 10;
    const toggleStart = panelX + panelWidth - toggleWidth * 2 - toggleGap - 20;
    const music = drawControl(this, toggleStart, togglesY, toggleWidth, 44, current.musicOn ? 'Music  ·  ON' : 'Music  ·  OFF', current.musicOn, () => {
      const next = loadSettings();
      next.musicOn = !next.musicOn;
      saveSettings(next);
      const sound = SoundManager.get();
      sound.musicOn = next.musicOn;
      sound.applyVolumes();
      if (next.musicOn) sound.startMusic(); else sound.stopMusic();
      sound.click();
      this.scene.restart();
    });
    const effects = drawControl(this, toggleStart + toggleWidth + toggleGap, togglesY, toggleWidth, 44, current.sfxOn ? 'SFX  ·  ON' : 'SFX  ·  OFF', current.sfxOn, () => {
      const next = loadSettings();
      next.sfxOn = !next.sfxOn;
      saveSettings(next);
      const sound = SoundManager.get();
      sound.sfxOn = next.sfxOn;
      sound.applyVolumes();
      sound.click();
      this.scene.restart();
    });
    void music; void effects;

    const speedY = togglesY + rowGap;
    this.add.text(panelX + 24, speedY + 22, 'Preferred Run Speed', style(14, C.textPrimary, true)).setOrigin(0, 0.5);
    this.add.text(panelX + 24, speedY + 39, 'Used when a new run begins', style(12, C.textSecondary)).setOrigin(0, 0.5);
    const speedWidth = 62;
    const speedGap = 8;
    const speedX = panelX + panelWidth - speedWidth * 3 - speedGap * 2 - 20;
    [1, 2, 3].forEach((speed, index) => {
      drawControl(this, speedX + index * (speedWidth + speedGap), speedY + (rowHeight - 44) / 2, speedWidth, 44, `${speed}×`, current.gameSpeed === speed, () => {
        const next = loadSettings();
        next.gameSpeed = speed;
        saveSettings(next);
        SoundManager.get().click();
        this.scene.restart();
      });
    });

    const backWidth = Math.min(220, W - 48);
    const back = drawControl(this, (W - backWidth) / 2, actionY, backWidth, 48, 'Back to Keep', true, () => {
      SoundManager.get().click();
      this.scene.start('MainMenu');
    });
    void back;

    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this));
  }

  private createPhone(): void {
    paintVista(this, 'menu');
    const root = this.add.container(0, 0), W = this.scale.width, H = this.scale.height;
    const sheet = new ScrollSheet(this, root, { x: 8, y: 8, width: W - 16, height: H - 16 }, 'Settings', () => this.scene.start('MainMenu'));
    const settings = loadSettings();
    const apply = () => { this.savedScroll = sheet.scrollOffset; saveSettings(settings); Object.assign(SoundManager.get(), settings); SoundManager.get().applyVolumes(); this.scene.restart(); };
    (['masterVolume', 'musicVolume', 'sfxVolume'] as const).forEach((key, i) => {
      sheet.text(i * 88, `${key.replace('Volume', ' volume')} · ${Math.round(settings[key] * 100)}%`);
      sheet.pair(i * 88 + 28, '−', '+', () => { settings[key] = Math.max(0, Math.round((settings[key] - .1) * 10) / 10); apply(); }, () => { settings[key] = Math.min(1, Math.round((settings[key] + .1) * 10) / 10); apply(); });
    });
    sheet.action(272, `Music · ${settings.musicOn ? 'ON' : 'OFF'}`, () => { settings.musicOn = !settings.musicOn; if (!settings.musicOn) SoundManager.get().stopMusic(); apply(); if (settings.musicOn) SoundManager.get().startMusic(); });
    sheet.action(324, `SFX · ${settings.sfxOn ? 'ON' : 'OFF'}`, () => { settings.sfxOn = !settings.sfxOn; apply(); });
    sheet.text(380, `Preferred run speed · ${settings.gameSpeed}×`);
    sheet.action(408, 'Change speed', () => { settings.gameSpeed = settings.gameSpeed === 3 ? 1 : settings.gameSpeed + 1; apply(); });
    sheet.action(460, 'Back to Keep', () => this.scene.start('MainMenu'), 'primary');
    sheet.scrollTo(this.savedScroll);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { sheet.destroy(); this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this); });
  }
}
