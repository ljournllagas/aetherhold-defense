import {formatCount} from '../../shared/displayNumbers.ts';
import Phaser from 'phaser';
import { fetchCampaignLeaderboard, fetchLeaderboard } from '../../api/leaderboardClient.ts';
import type { CampaignLeaderboardRow } from '../../shared/campaignLeaderboard.ts';
import { CAMPAIGN_LEVELS } from '../campaign/config.ts';
import { accountSystem } from '../systems/AccountSystem.ts';
import { scoreRetryRepository } from '../systems/ScoreRetry.ts';
import type { DifficultyId, ScoreRecord } from '../../shared/types.ts';
import { SoundManager } from '../systems/SoundManager.ts';
import { C, FONT_DISPLAY, style } from '../ui/tokens.ts';
import { accountStatus } from '../ui/accountControls.ts';
import { etchedFrame } from '../ui/components.ts';
import { paintVista } from '../art/menubg.ts';
import { ViewportMaskController } from '../ui/ViewportMask.ts';

type Filter = DifficultyId | 'overall';
type BoardMode = 'classic' | 'campaign';
const ROWS = 20;
const MISSION_COUNT = CAMPAIGN_LEVELS.length;
const STAR_COUNT = MISSION_COUNT * 3;

interface TabView {
  filter: Filter;
  box: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  icon: Phaser.GameObjects.Image;
  frame: Phaser.GameObjects.Graphics;
}

interface ModeTabView {
  mode: BoardMode;
  box: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  frame: Phaser.GameObjects.Graphics;
}

export class LeaderboardScene extends Phaser.Scene {
  private mode: BoardMode = 'classic';
  private filter: Filter = 'overall';
  private highlightRunId: string | null = null;
  private statusText: Phaser.GameObjects.Text | null = null;
  private rowLayer: Phaser.GameObjects.Container | null = null;
  private rowViews: Phaser.GameObjects.Container[] = [];
  private retryBox: Phaser.GameObjects.Rectangle | null = null;
  private retryLabel: Phaser.GameObjects.Text | null = null;
  private scrollZone: Phaser.GameObjects.Rectangle | null = null;
  private rowMask: ViewportMaskController | null = null;
  private tabs: TabView[] = [];
  private modeTabs: ModeTabView[] = [];
  private campaignNote: Phaser.GameObjects.Text | null = null;
  private headerViews: Phaser.GameObjects.Text[] = [];
  private records: ScoreRecord[] = [];
  private campaignRecords: CampaignLeaderboardRow[] = [];
  private loadGeneration = 0;
  private requestGeneration = 0;
  private scrollOffset = 0;
  private maxScroll = 0;
  private rowHeight = 40;
  private visibleRowCount = 1;
  private panelX = 0;
  private panelWidth = 0;
  private bodyTop = 0;
  private bodyBottom = 0;
  private dragging = false;
  private dragStartY = 0;
  private dragStartOffset = 0;
  private tabY = 0;
  private readonly handleResize = (): void => { this.scene.restart({ mode: this.mode, filter: this.filter, highlightRunId: this.highlightRunId ?? undefined }); };
  private readonly handlePointerMove = (pointer: Phaser.Input.Pointer): void => {
    if (!this.dragging) return;
    const distance = this.dragStartY - pointer.y;
    this.setScroll(this.dragStartOffset + distance);
  };
  private readonly handlePointerUp = (): void => { this.dragging = false; };
  private readonly handleWheel = (pointer: Phaser.Input.Pointer, _over: Phaser.GameObjects.GameObject[], _deltaX: number, deltaY: number): void => {
    if (pointer.x < 0 || pointer.x > this.scale.width || pointer.y < this.bodyTop || pointer.y > this.bodyBottom) return;
    this.setScroll(this.scrollOffset + Math.sign(deltaY) * this.rowHeight * 3);
  };

  constructor() {
    super('Leaderboard');
  }

  init(data: { mode?: BoardMode; filter?: Filter; highlightRunId?: string }): void {
    this.mode = data.mode ?? 'classic';
    this.filter = data.filter ?? 'overall';
    this.highlightRunId = data.highlightRunId ?? null;
  }

  create(): void {
    const W = this.scale.width;
    const H = this.scale.height;
    const compact = W < 900 || H < 560;
    const generation = ++this.loadGeneration;
    this.requestGeneration++;
    this.records = [];
    this.campaignRecords = [];
    this.scrollOffset = 0;
    this.rowViews = [];
    this.dragging = false;
    this.tabs = [];
    this.modeTabs = [];
    this.headerViews = [];
    this.campaignNote = null;

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.loadGeneration === generation) this.loadGeneration++;
      this.requestGeneration++;
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
      this.input.off('pointermove', this.handlePointerMove);
      this.input.off('pointerup', this.handlePointerUp);
      this.input.off('wheel', this.handleWheel);
      this.rowMask?.destroy();
      this.rowMask = null;
      this.rowLayer = null;
    });
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);

    paintVista(this, 'board');
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) this.tweens.getTweens().forEach((tween) => tween.stop());

    const titleY = compact ? 5 : 12;
    const titleWidth = Math.min(compact ? 390 : 520, W - 24);
    const titleHeight = compact ? 42 : 56;
    const titleX = (W - titleWidth) / 2;
    this.add.rectangle(titleX, titleY, titleWidth, titleHeight, 0x0b1117, 0.87).setOrigin(0).setStrokeStyle(1, 0x80663c, 0.9);
    etchedFrame(this, titleX, titleY, titleWidth, titleHeight, true);
    const titleIconSize = compact ? 30 : 42;
    const title = this.add.text(0, titleY + titleHeight / 2, 'Hall of Legends', style(compact ? 22 : 31, C.goldBright, true, FONT_DISPLAY)).setOrigin(0, 0.5);
    const titleGroupWidth = titleIconSize + 10 + title.width;
    const titleGroupX = W / 2 - titleGroupWidth / 2;
    this.add.image(titleGroupX + titleIconSize / 2, titleY + titleHeight / 2, 'emblem').setDisplaySize(titleIconSize, titleIconSize);
    title.setX(titleGroupX + titleIconSize + 10);
    this.add.text(W / 2, titleY + titleHeight + 7, 'ANCIENT BORDER KEEP  ·  CURRENT SCORE ERA', style(12, C.textSecondary, true)).setOrigin(0.5);

    const widthRatio = compact ? 0.97 : W >= 1200 ? 0.81 : 0.9;
    this.panelWidth = Math.min(W - 24, W * widthRatio);
    this.panelX = (W - this.panelWidth) / 2;
    const panelX = this.panelX;
    const panelWidth = this.panelWidth;
    const modeTabY = compact ? 64 : 84;
    const modeTabHeight = 44;
    const modeTabGap = compact ? 8 : 12;
    const modeTabWidth = (panelWidth - modeTabGap) / 2;
    const modeNames: Array<{ mode: BoardMode; label: string }> = [
      { mode: 'classic', label: 'Classic Siege' },
      { mode: 'campaign', label: 'Campaign' }
    ];
    this.modeTabs = [];
    modeNames.forEach((tab, index) => {
      const x = panelX + index * (modeTabWidth + modeTabGap);
      const selected = this.mode === tab.mode;
      const box = this.add.rectangle(x, modeTabY, modeTabWidth, modeTabHeight, selected ? 0x19232d : 0x101820, 0.98)
        .setOrigin(0).setStrokeStyle(selected ? 2 : 1, selected ? 0xd7aa4e : 0x59636b);
      const frame = etchedFrame(this, x, modeTabY, modeTabWidth, modeTabHeight, selected);
      const label = this.add.text(x + modeTabWidth / 2, modeTabY + modeTabHeight / 2, tab.label, style(14, selected ? C.goldBright : C.textPrimary, true, FONT_DISPLAY)).setOrigin(0.5);
      box.setInteractive({ useHandCursor: true });
      box.on('pointerover', () => box.setStrokeStyle(2, 0xf0cd72));
      box.on('pointerout', () => box.setStrokeStyle(this.mode === tab.mode ? 2 : 1, this.mode === tab.mode ? 0xd7aa4e : 0x59636b));
      box.on('pointerdown', () => this.changeMode(tab.mode));
      this.modeTabs.push({ mode: tab.mode, box, label, frame });
    });

    const tabY = compact ? 116 : 136;
    this.tabY = tabY;
    const tabHeight = 46;
    const tabGap = compact ? 8 : 12;
    const tabWidth = (panelWidth - tabGap * 3) / 4;
    const tabNames: Array<{ filter: Filter; label: string; iconKey: string }> = [
      { filter: 'overall', label: 'Overall', iconKey: 'emblem' },
      { filter: 'easy', label: 'Easy', iconKey: 'difficulty_helm_easy' },
      { filter: 'medium', label: 'Medium', iconKey: 'difficulty_helm_medium' },
      { filter: 'hard', label: 'Hard', iconKey: 'difficulty_helm_hard' }
    ];
    tabNames.forEach((tab, index) => {
      const x = panelX + index * (tabWidth + tabGap);
      const selected = this.filter === tab.filter;
      const box = this.add.rectangle(x, tabY, tabWidth, tabHeight, selected ? 0x19232d : 0x101820, 0.98)
        .setOrigin(0).setStrokeStyle(selected ? 2 : 1, selected ? 0xd7aa4e : 0x59636b);
      const frame = etchedFrame(this, x, tabY, tabWidth, tabHeight, selected);
      const iconSize = compact ? 23 : 28;
      const icon = this.add.image(0, tabY + tabHeight / 2, tab.iconKey).setDisplaySize(iconSize, iconSize);
      const label = this.add.text(0, tabY + tabHeight / 2, tab.label, style(13, selected ? C.goldBright : C.textPrimary, true, FONT_DISPLAY)).setOrigin(0, 0.5);
      const groupWidth = iconSize + 9 + label.width;
      const groupLeft = x + (tabWidth - groupWidth) / 2;
      icon.setX(groupLeft + iconSize / 2);
      label.setX(groupLeft + iconSize + 9);
      if (W < 600) { icon.setVisible(false); label.setFontSize(14).setOrigin(.5).setX(x + tabWidth / 2); }
      box.setInteractive({ useHandCursor: true });
      box.on('pointerover', () => box.setStrokeStyle(2, 0xf0cd72));
      box.on('pointerout', () => box.setStrokeStyle(this.filter === tab.filter ? 2 : 1, this.filter === tab.filter ? 0xd7aa4e : 0x59636b));
      box.on('pointerdown', () => this.changeFilter(tab.filter));
      this.tabs.push({ filter: tab.filter, box, label, icon, frame });
    });

    const panelTop = tabY + tabHeight + 12;
    const panelBottom = H - (compact ? 64 : 78);
    const panelHeight = Math.max(120, panelBottom - panelTop);
    this.add.rectangle(panelX, panelTop, panelWidth, panelHeight, 0x0b1117, 0.97).setOrigin(0).setStrokeStyle(2, 0x59636b, 0.95);
    etchedFrame(this, panelX, panelTop, panelWidth, panelHeight, false);
    this.add.rectangle(panelX + 6, panelTop + 6, panelWidth - 12, panelHeight - 12, 0x101820, 0.56).setOrigin(0);

    const headerHeight = compact ? 34 : 42;
    const headerY = panelTop + 7;
    const header = this.add.rectangle(panelX + 1, headerY, panelWidth - 2, headerHeight, 0x19232d, 0.98).setOrigin(0);
    void header;
    this.headerViews = [];
    this.buildHeader(headerY, headerHeight);

    this.campaignNote = this.add.text(panelX + 20, tabY + 2, '', style(12, C.textSecondary))
      .setOrigin(0, 0).setWordWrapWidth(panelWidth - 40);

    this.bodyTop = headerY + headerHeight + 2;
    this.bodyBottom = panelTop + panelHeight - 8;
    const bodyHeight = this.bodyBottom - this.bodyTop;
    this.rowHeight = W < 768 ? 80 : compact ? 28 : 42;
    this.rowLayer = this.add.container(0, 0).setDepth(3);
    this.rowMask = new ViewportMaskController(this, this.rowLayer, { x: panelX + 4, y: this.bodyTop, width: panelWidth - 8, height: bodyHeight });

    this.statusText = this.add.text(W / 2, this.bodyTop + bodyHeight / 2, 'Consulting the archives...', style(14, C.textSecondary)).setOrigin(0.5).setAlign('center').setWordWrapWidth(panelWidth - 40);
    this.retryBox = this.add.rectangle(W / 2 - 72, this.bodyTop + bodyHeight / 2 + 34, 144, 44, 0x19232d, 0.98)
      .setOrigin(0).setStrokeStyle(1, 0xd7aa4e).setVisible(false);
    this.retryLabel = this.add.text(W / 2, this.bodyTop + bodyHeight / 2 + 56, 'Try Again', style(12, C.goldBright, true)).setOrigin(0.5).setVisible(false);
    this.retryBox.setDepth(10);
    this.retryLabel.setDepth(10);
    this.retryBox.setInteractive({ useHandCursor: true });
    this.retryBox.on('pointerdown', () => { SoundManager.get().click(); void this.loadBoard(generation); });
    this.scrollZone = this.add.rectangle(panelX + 4, this.bodyTop, panelWidth - 8, bodyHeight, 0xffffff, 0)
      .setOrigin(0).setInteractive();
    this.scrollZone.on('pointerdown', (pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      this.dragging = true;
      this.dragStartY = pointer.y;
      this.dragStartOffset = this.scrollOffset;
      event.stopPropagation();
    });
    this.input.on('pointermove', this.handlePointerMove);
    this.input.on('pointerup', this.handlePointerUp);
    this.input.on('wheel', this.handleWheel);

    const backY = H - 54;
    const backWidth = Math.min(176, panelWidth);
    const back = this.add.rectangle(panelX, backY, backWidth, 44, 0x111920, 0.98).setOrigin(0).setStrokeStyle(1, 0x59636b);
    const backFrame = etchedFrame(this, panelX, backY, backWidth, 44, false);
    this.add.text(panelX + backWidth / 2, backY + 22, 'Back to Keep', style(13, C.textPrimary, true, FONT_DISPLAY)).setOrigin(0.5);
    back.setInteractive({ useHandCursor: true });
    back.on('pointerover', () => { back.setStrokeStyle(2, 0xf0cd72); etchedFrame(this, panelX, backY, backWidth, 44, true, backFrame); });
    back.on('pointerout', () => { back.setStrokeStyle(1, 0x59636b); etchedFrame(this, panelX, backY, backWidth, 44, false, backFrame); });
    back.on('pointerdown', () => { SoundManager.get().click(); this.scene.start('MainMenu'); });

    this.updateModeChrome();
    void this.loadBoard(generation);
  }

  private columns(x: number, width: number): { rank: number; player: number; mode: number; wave: number; score: number; date: number; missions: number; stars: number } {
    if (this.mode === 'campaign') {
      if (this.scale.width < 768) return { rank: x + 12, player: x + 60, mode: x + 60, wave: x + 60, score: x + width - 88, date: x + 60, missions: x + 60, stars: x + 60 };
      return {
        rank: x + 18,
        player: x + Math.max(72, width * 0.092),
        mode: x + width * 0.55,
        wave: x + width * 0.55,
        score: x + width * 0.80,
        date: x + width * 0.885,
        missions: x + width * 0.55,
        stars: x + width * 0.68
      };
    }
    if (this.scale.width < 768) return { rank: x + 12, player: x + 60, mode: x + 60, wave: x + 140, score: x + width - 88, date: x + 60, missions: x + 60, stars: x + 60 };
    return {
      rank: x + 18,
      player: x + Math.max(72, width * 0.092),
      mode: x + width * 0.55,
      wave: x + width * 0.68,
      score: x + width * 0.77,
      date: x + width * 0.885,
      missions: x + width * 0.55,
      stars: x + width * 0.68
    };
  }

  private buildHeader(headerY: number, headerHeight: number): void {
    for (const view of this.headerViews) view.destroy();
    this.headerViews = [];
    const compact = this.scale.width < 900 || this.scale.height < 560;
    const cols = this.columns(this.panelX, this.panelWidth);
    const headerSize = compact ? 12 : 13;
    const label = (x: number, text: string): void => {
      this.headerViews.push(this.add.text(x, headerY + headerHeight / 2, text, style(headerSize, C.textSecondary, true)).setOrigin(0, 0.5));
    };
    label(cols.rank, 'RANK');
    label(cols.player, 'PLAYER');
    if (this.mode === 'campaign') {
      if (this.scale.width >= 768) {
        label(cols.missions, 'MISSIONS');
        label(cols.stars, 'STARS');
      }
      label(cols.score, 'SCORE');
      return;
    }
    if (this.scale.width >= 768) {
      label(cols.mode, 'MODE');
      label(cols.wave, 'WAVE');
      label(cols.date, 'DATE');
    }
    label(cols.score, 'SCORE');
  }

  private describeCampaignNote(): string {
    const view = accountSystem.view();
    const context = view.playMode === 'guest'
      ? 'Guest progress stays in this browser. Sign in and import to publish campaign totals.'
      : accountStatus(view);
    return `Campaign ranks acknowledged Google-account progress: most missions, then stars, then score. ${context}`;
  }

  private updateModeChrome(): void {
    for (const tab of this.modeTabs) {
      const selected = tab.mode === this.mode;
      tab.box.setFillStyle(selected ? 0x19232d : 0x101820, 0.98);
      tab.box.setStrokeStyle(selected ? 2 : 1, selected ? 0xd7aa4e : 0x59636b);
      tab.label.setColor(selected ? C.goldBright : C.textPrimary);
      etchedFrame(this, tab.box.x, tab.box.y, tab.box.width, tab.box.height, selected, tab.frame);
    }
    const classic = this.mode === 'classic';
    for (const tab of this.tabs) {
      tab.box.setVisible(classic);
      tab.label.setVisible(classic);
      tab.icon.setVisible(classic && this.scale.width >= 600);
      tab.frame.setVisible(classic);
    }
    this.campaignNote?.setText(this.describeCampaignNote()).setVisible(!classic);
    const headerHeight = (this.scale.width < 900 || this.scale.height < 560) ? 34 : 42;
    this.buildHeader(this.bodyTop - headerHeight - 2, headerHeight);
  }

  private changeMode(mode: BoardMode): void {
    if (mode === this.mode) return;
    SoundManager.get().click();
    this.mode = mode;
    this.rowLayer?.removeAll(true);
    this.rowViews = [];
    this.rowLayer?.setY(0);
    this.scrollOffset = 0;
    this.updateModeChrome();
    void this.loadBoard(this.loadGeneration);
  }

  private changeFilter(filter: Filter): void {
    if (filter === this.filter) return;
    SoundManager.get().click();
    this.filter = filter;
    this.tabs.forEach((tab) => {
      const selected = tab.filter === filter;
      tab.box.setFillStyle(selected ? 0x19232d : 0x101820, 0.98);
      tab.box.setStrokeStyle(selected ? 2 : 1, selected ? 0xd7aa4e : 0x59636b);
      tab.label.setColor(selected ? C.goldBright : C.textPrimary);
      etchedFrame(this, tab.box.x, tab.box.y, tab.box.width, tab.box.height, selected, tab.frame);
    });
    void this.loadBoard(this.loadGeneration);
  }

  private async loadBoard(generation: number): Promise<void> {
    const modeAtRequest = this.mode;
    const request = ++this.requestGeneration;
    const retained = (modeAtRequest === 'campaign' ? this.campaignRecords : this.records).slice();
    this.rowLayer?.removeAll(true);
    this.rowViews = [];
    this.rowLayer?.setY(0);
    this.scrollOffset = 0;
    if (retained.length > 0) {
      if (modeAtRequest === 'campaign') this.campaignRecords = [...retained] as CampaignLeaderboardRow[];
      else this.records = [...retained] as ScoreRecord[];
      this.statusText?.setVisible(false);
      this.renderRows();
    } else {
      this.statusText?.setText('Consulting the archives...').setVisible(true);
    }
    this.retryBox?.setVisible(false);
    this.retryLabel?.setVisible(false);
    try {
      const result = modeAtRequest === 'campaign'
        ? await fetchCampaignLeaderboard(ROWS)
        : await fetchLeaderboard(this.filter === 'overall' ? undefined : this.filter, ROWS);
      if (this.loadGeneration !== generation || this.requestGeneration !== request ||
        this.mode !== modeAtRequest || !this.scene.isActive('Leaderboard')) return;
      if (!result.ok) {
        const suffix = await this.failureSuffix(generation, request, modeAtRequest);
        if (!suffix) return;
        const stale = retained.length > 0 ? 'Showing last successful board.\n' : '';
        const title = modeAtRequest === 'campaign' ? 'Campaign board unavailable.' : 'Leaderboard unavailable.';
        this.statusText?.setText(`${title}\n${result.message}\n${stale}${suffix}`).setVisible(true);
        this.retryBox?.setVisible(true);
        this.retryLabel?.setVisible(true);
        return;
      }
      if (result.scores.length === 0) {
        if (modeAtRequest === 'campaign') this.campaignRecords = [];
        else this.records = [];
        this.rowLayer?.removeAll(true);
        this.rowViews = [];
        this.statusText?.setText(modeAtRequest === 'campaign'
          ? 'No campaign legends yet.\nWin a mission while signed in to claim the board.'
          : 'No champions yet.\nBe the first to claim the board.').setVisible(true);
        return;
      }
      if (modeAtRequest === 'campaign') {
        this.campaignRecords = (result.scores as CampaignLeaderboardRow[]).slice(0, ROWS);
      } else {
        this.records = (result.scores as ScoreRecord[]).slice(0, ROWS);
      }
      this.statusText?.setVisible(false);
      this.renderRows();
    } catch (error) {
      if (this.loadGeneration !== generation || this.requestGeneration !== request ||
        this.mode !== modeAtRequest || !this.scene.isActive('Leaderboard')) return;
      const suffix = await this.failureSuffix(generation, request, modeAtRequest);
      if (!suffix) return;
      const stale = retained.length > 0 ? 'Showing last successful board.\n' : '';
      const title = modeAtRequest === 'campaign' ? 'Campaign board unavailable.' : 'Leaderboard unavailable.';
      const message = error instanceof Error ? error.message : 'The archives could not be reached.';
      this.statusText?.setText(`${title}\n${message}\n${stale}${suffix}`).setVisible(true);
      this.retryBox?.setVisible(true);
      this.retryLabel?.setVisible(true);
    }
  }

  /**
   * Local progress is never affected by a leaderboard failure; a saved-retry or
   * session-only notice is added only when the repository view establishes it.
   * Campaign failures use account/guest guidance instead of the Classic
   * saved-submission retry repository. Returns null when the request is no
   * longer current.
   */
  private async failureSuffix(generation: number, request: number, mode: BoardMode): Promise<string | null> {
    const base = 'Local progress is unaffected.';
    if (mode === 'campaign') {
      if (this.loadGeneration !== generation || this.requestGeneration !== request ||
        this.mode !== mode || !this.scene.isActive('Leaderboard')) return null;
      const view = accountSystem.view();
      if (view.playMode === 'guest') return `${base}\nGuest progress stays in this browser. Sign in to publish campaign totals.`;
      return `${base}\n${accountStatus(view)}`;
    }
    const view = await scoreRetryRepository.view();
    if (this.loadGeneration !== generation || this.requestGeneration !== request || this.mode !== mode || !this.scene.isActive('Leaderboard')) return null;
    if (view.status === 'ready' || view.status === 'incompatible') {
      return view.persisted ? `${base}\nA saved score retry is ready from the main menu.` : `${base}\nA saved score retry is available in this session only.`;
    }
    if (view.status === 'unreadable' && view.warning) return `${base}\n${view.warning}`;
    return base;
  }

  private renderRows(): void {
    if (this.mode === 'campaign') {
      this.renderCampaignRows();
      return;
    }
    const layer = this.rowLayer;
    if (!layer) return;
    layer.removeAll(true);
    const panelX = this.panelX;
    const panelWidth = this.panelWidth;
    const cols = this.columns(panelX, panelWidth);
    const compact = this.scale.width < 900 || this.scale.height < 560;
    const fontSize = compact ? 12 : 14;
    this.rowViews = [];
    this.records.forEach((record, index) => {
      const y = this.bodyTop + 3 + index * this.rowHeight;
      const rowTop = y;
      const current = this.highlightRunId !== null && record.runId === this.highlightRunId;
      const row = this.add.container(0, 0);
      if (this.scale.width < 768) {
        row.add(this.add.rectangle(panelX + 6, rowTop, panelWidth - 12, this.rowHeight - 4, current ? 0x2a2418 : 0x19232d, .9).setOrigin(0));
        row.add(this.add.text(cols.rank, rowTop + 12, `${index + 1}`, style(14, current ? C.goldBright : C.textPrimary, true)));
        row.add(this.add.text(cols.player, rowTop + 8, record.playerName + (current ? ' · YOU' : ''), style(14, C.textPrimary, true)).setWordWrapWidth(Math.max(80, cols.score - cols.player - 8)));
        row.add(this.add.text(cols.score, rowTop + 12, numberForRow(record.finalScore), style(14, C.goldBright, true)));
        row.add(this.add.text(cols.player, rowTop + 48, `${record.difficulty.toUpperCase()} · Wave ${record.highestWave} · ${(record.createdAt ?? '').slice(0, 10)}`, style(12, C.textSecondary)).setWordWrapWidth(panelWidth - 72));
        layer.add(row); this.rowViews.push(row); return;
      }
      if (current) {
        row.add(this.add.rectangle(panelX + 6, rowTop, panelWidth - 12, this.rowHeight, 0x2a2418, 0.98).setOrigin(0).setStrokeStyle(1, 0xd7aa4e, 0.96));
        row.add(this.add.rectangle(panelX + 6, rowTop + 2, 3, this.rowHeight - 4, 0xf0cd72).setOrigin(0));
      } else if (index % 2 === 1) {
        row.add(this.add.rectangle(panelX + 7, rowTop, panelWidth - 14, this.rowHeight, 0x19232d, 0.46).setOrigin(0));
      }
      const rankColor = index === 0 ? C.goldBright : index === 1 ? '#c9d2d8' : index === 2 ? '#d08a4e' : C.textPrimary;
      const color = current ? C.goldBright : C.textPrimary;
      const textY = rowTop + this.rowHeight / 2;
      if (index < 3) {
        const medalSize = compact ? 22 : 30;
        const medal = this.add.image(cols.rank + 13, textY, 'hud_score').setDisplaySize(medalSize, medalSize);
        medal.setTint(index === 0 ? 0xf0cd72 : index === 1 ? 0xc9d2d8 : 0xd08a4e);
        row.add(medal);
        const medalRank = this.add.text(cols.rank + 13, textY, `${index + 1}`, style(compact ? 12 : 14, C.textPrimary, true, FONT_DISPLAY)).setOrigin(0.5);
        medalRank.setStroke('#0A0E12', 2);
        row.add(medalRank);
      } else {
        row.add(this.add.text(cols.rank + 4, textY, `${index + 1}`, style(fontSize, rankColor, true, FONT_DISPLAY)).setOrigin(0, 0.5));
      }
      const playerName = `${record.playerName.slice(0, compact ? 24 : 32)}${current ? '  ·  YOU' : ''}`;
      row.add(this.add.text(cols.player, textY, playerName, style(fontSize, color, current)).setOrigin(0, 0.5));
      const modeColor = record.difficulty === 'easy' ? C.health : record.difficulty === 'hard' ? C.dangerBright : C.goldBright;
      row.add(this.add.text(cols.mode, textY, record.difficulty.toUpperCase(), style(compact ? 12 : 13, modeColor, true)).setOrigin(0, 0.5));
      row.add(this.add.text(cols.wave, textY, `${record.highestWave}`, style(fontSize, color, true)).setOrigin(0, 0.5));
      row.add(this.add.text(cols.score, textY, numberForRow(record.finalScore), style(fontSize, color, true)).setOrigin(0, 0.5));
      row.add(this.add.text(cols.date, textY, (record.createdAt ?? '').slice(0, 10), style(compact ? 12 : 13, current ? C.goldBright : C.textSecondary)).setOrigin(0, 0.5));
      if (index < this.records.length - 1) {
        const line = this.add.graphics();
        line.lineStyle(1, 0x445564, 0.55);
        line.lineBetween(panelX + 8, rowTop + this.rowHeight, panelX + panelWidth - 8, rowTop + this.rowHeight);
        row.add(line);
      }
      layer.add(row);
      this.rowViews.push(row);
    });
    this.visibleRowCount = Math.max(1, Math.floor((this.bodyBottom - this.bodyTop - 3) / this.rowHeight));
    this.maxScroll = Math.max(0, this.records.length - this.visibleRowCount) * this.rowHeight;
    this.setScroll(this.scrollOffset);
  }

  private renderCampaignRows(): void {
    const layer = this.rowLayer;
    if (!layer) return;
    layer.removeAll(true);
    const panelX = this.panelX;
    const panelWidth = this.panelWidth;
    const cols = this.columns(panelX, panelWidth);
    const compact = this.scale.width < 900 || this.scale.height < 560;
    const fontSize = compact ? 12 : 14;
    const accountId = accountSystem.view().session?.account.playerId ?? null;
    this.rowViews = [];
    this.campaignRecords.forEach((record, index) => {
      const y = this.bodyTop + 3 + index * this.rowHeight;
      const rowTop = y;
      const current = accountId !== null && record.playerId === accountId;
      const row = this.add.container(0, 0);
      if (this.scale.width < 768) {
        row.add(this.add.rectangle(panelX + 6, rowTop, panelWidth - 12, this.rowHeight - 4, current ? 0x2a2418 : 0x19232d, .9).setOrigin(0));
        row.add(this.add.text(cols.rank, rowTop + 12, `${index + 1}`, style(14, current ? C.goldBright : C.textPrimary, true)));
        row.add(this.add.text(cols.player, rowTop + 8, record.nickname + (current ? ' · YOU' : ''), style(14, C.textPrimary, true)).setWordWrapWidth(Math.max(80, cols.score - cols.player - 8)));
        row.add(this.add.text(cols.score, rowTop + 12, numberForRow(record.totalScore), style(14, C.goldBright, true)));
        row.add(this.add.text(cols.player, rowTop + 48, `Missions ${record.missionsCompleted}/${MISSION_COUNT} · Stars ${record.totalStars}/${STAR_COUNT}`, style(12, C.textSecondary)).setWordWrapWidth(panelWidth - 72));
        layer.add(row); this.rowViews.push(row); return;
      }
      if (current) {
        row.add(this.add.rectangle(panelX + 6, rowTop, panelWidth - 12, this.rowHeight, 0x2a2418, 0.98).setOrigin(0).setStrokeStyle(1, 0xd7aa4e, 0.96));
        row.add(this.add.rectangle(panelX + 6, rowTop + 2, 3, this.rowHeight - 4, 0xf0cd72).setOrigin(0));
      } else if (index % 2 === 1) {
        row.add(this.add.rectangle(panelX + 7, rowTop, panelWidth - 14, this.rowHeight, 0x19232d, 0.46).setOrigin(0));
      }
      const rankColor = index === 0 ? C.goldBright : index === 1 ? '#c9d2d8' : index === 2 ? '#d08a4e' : C.textPrimary;
      const color = current ? C.goldBright : C.textPrimary;
      const textY = rowTop + this.rowHeight / 2;
      if (index < 3) {
        const medalSize = compact ? 22 : 30;
        const medal = this.add.image(cols.rank + 13, textY, 'hud_score').setDisplaySize(medalSize, medalSize);
        medal.setTint(index === 0 ? 0xf0cd72 : index === 1 ? 0xc9d2d8 : 0xd08a4e);
        row.add(medal);
        const medalRank = this.add.text(cols.rank + 13, textY, `${index + 1}`, style(compact ? 12 : 14, C.textPrimary, true, FONT_DISPLAY)).setOrigin(0.5);
        medalRank.setStroke('#0A0E12', 2);
        row.add(medalRank);
      } else {
        row.add(this.add.text(cols.rank + 4, textY, `${index + 1}`, style(fontSize, rankColor, true, FONT_DISPLAY)).setOrigin(0, 0.5));
      }
      const playerName = `${record.nickname.slice(0, compact ? 24 : 32)}${current ? '  ·  YOU' : ''}`;
      row.add(this.add.text(cols.player, textY, playerName, style(fontSize, color, current)).setOrigin(0, 0.5));
      row.add(this.add.text(cols.missions, textY, `${record.missionsCompleted}`, style(fontSize, color, true)).setOrigin(0, 0.5));
      row.add(this.add.text(cols.stars, textY, `${record.totalStars}`, style(fontSize, color, true)).setOrigin(0, 0.5));
      row.add(this.add.text(cols.score, textY, numberForRow(record.totalScore), style(fontSize, color, true)).setOrigin(0, 0.5));
      if (index < this.campaignRecords.length - 1) {
        const line = this.add.graphics();
        line.lineStyle(1, 0x445564, 0.55);
        line.lineBetween(panelX + 8, rowTop + this.rowHeight, panelX + panelWidth - 8, rowTop + this.rowHeight);
        row.add(line);
      }
      layer.add(row);
      this.rowViews.push(row);
    });
    this.visibleRowCount = Math.max(1, Math.floor((this.bodyBottom - this.bodyTop - 3) / this.rowHeight));
    this.maxScroll = Math.max(0, this.campaignRecords.length - this.visibleRowCount) * this.rowHeight;
    this.setScroll(this.scrollOffset);
  }

  private setScroll(value: number): void {
    const maxSteps = Math.floor(this.maxScroll / this.rowHeight);
    const steps = Math.max(0, Math.min(maxSteps, Math.round(value / this.rowHeight)));
    this.scrollOffset = steps * this.rowHeight;
    this.rowLayer?.setY(-this.scrollOffset);
    this.rowViews.forEach((row, index) => row.setVisible(index >= steps && index < steps + this.visibleRowCount));
  }
}

function numberForRow(value: number): string {
  return formatCount(value);
}
