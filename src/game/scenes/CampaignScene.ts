import Phaser from 'phaser';
import { CAMPAIGN_LEVELS, CAMPAIGN_SIGILS, CAMPAIGN_WORLDS, getCampaignLevel, getCampaignWorld } from '../campaign/config.ts';
import { campaignRepository, isWorldUnlocked } from '../campaign/progress.ts';
import { getTowerSpecializations } from '../campaign/specializations.ts';
import {
  campaignClearStatus, campaignCompactDetailMeta, campaignEnemyPreviewText,
  campaignHeaderBadgeLines, campaignLevelDetail, campaignMilestones, campaignWarningCompactMessage
} from '../campaign/presentation.ts';
import {
  CAMPAIGN_MAP_WORLD_WIDTH, CAMPAIGN_NODE_HIT_SIZE,
  campaignDetailContentLayout, campaignMapRoute, campaignScreenLayout, campaignWorldCaptionLayout
} from '../campaign/mapLayout.ts';
import { getCampaignEnemy } from '../campaign/enemies.ts';
import type { CampaignClearResult, CampaignFeatureId, CampaignView, CampaignWorldId, TargetingMode, TowerId } from '../campaign/types.ts';
import { TOWERS } from '../config/towers.ts';
import { loadSettings } from '../systems/Settings.ts';
import { SoundManager } from '../systems/SoundManager.ts';
import { button, panel } from '../ui/components.ts';
import { C, FONT_DISPLAY, style } from '../ui/tokens.ts';
import { ScrollSheet } from '../ui/ScrollSheet.ts';
import { handleViewportPointerUp, ViewportMaskController } from '../ui/ViewportMask.ts';
import { drawCampaignEnemyBadge, paintCampaignWorldMap } from '../art/campaignArt.ts';

const TARGETING_MODES: readonly TargetingMode[] = ['first', 'last', 'strongest', 'weakest', 'closest'];
const TOWER_IDS: readonly TowerId[] = ['longbow', 'ember', 'glacier', 'starfire', 'tempest'];
const WORLD_ACCENTS: Readonly<Record<CampaignWorldId, number>> = { borderkeep: 0x8cae70, emberfall: 0xe27737, frostveil: 0xa8d4e4 };
const TACTICS: Readonly<Record<string, string>> = {
  marchling: 'Steady front-line attacker.', skitter: 'Fast runner; cover long route bends early.', stoneback: 'High vitality; use focused damage.',
  ironhide: 'Resists physical damage; pair with arcane towers.', veilborn: 'Resists arcane damage; use physical towers.',
  cinderling: 'Compact basalt infantry with no special resistance.', ashrunner: 'Fast low-profile runner.', magmahide: 'Armored plates resist physical damage.',
  ember_brute: 'Large, durable attacker.', ashcaller: 'Support totem briefly speeds nearby enemies.', snowstalker: 'Fast runner; prioritize before the bend.',
  icebound: 'Balanced front-line attacker.', frostback: 'High vitality; use sustained fire.', glacier_knight: 'Resists slowing effects.',
  frost_shaman: 'Support focus briefly increases nearby slow resistance.'
};
const BOSS_FEATURE: Readonly<Record<string, CampaignFeatureId>> = {
  hollow_warden: 'hollow_warden_codex_entry', cinder_colossus: 'cinder_colossus_codex_entry', frostbound_matriarch: 'frostbound_matriarch_codex_entry'
};

interface CampaignSceneData { selectedLevel?: number; result?: CampaignClearResult; }

function addAction(
  scene: Phaser.Scene, parent: Phaser.GameObjects.Container, x: number, y: number, width: number, label: string,
  action: () => void, kind: 'primary' | 'secondary' = 'secondary', enabled = true, height = 44
): void {
  const control = button(scene, parent, x, y, width, label, () => {
    if (!enabled) return;
    SoundManager.get().unlock(); SoundManager.get().click(); action();
  }, kind, height);
  if (!enabled) { control.box.setAlpha(0.48); control.box.input!.enabled = false; }
}

function worldIndex(worldId: CampaignWorldId): number {
  return CAMPAIGN_WORLDS.findIndex(world => world.id === worldId);
}

function worldLabel(worldId: CampaignWorldId): string {
  return worldId === 'borderkeep' ? 'Borderkeep' : worldId === 'emberfall' ? 'Emberfall' : 'Frostveil';
}

/** Connected, responsive world map and pre-battle campaign preparation. */
export class CampaignScene extends Phaser.Scene {
  private selectedLevel = 1;
  private mapScroll = 0;
  private campaignView!: CampaignView;
  private mapRoot: Phaser.GameObjects.Container | null = null;
  private mapMask: ViewportMaskController | null = null;
  private sheet: ScrollSheet | null = null;
  private sheetRoot: Phaser.GameObjects.Container | null = null;
  private lastResult: CampaignClearResult | undefined;
  private readonly handleResize = (): void => { this.scene.restart({ selectedLevel: this.selectedLevel, result: this.lastResult }); };
  private readonly handleEscape = (): void => { this.scene.start('MainMenu'); };

  constructor() { super('Campaign'); }

  init(data?: CampaignSceneData): void {
    this.selectedLevel = Number.isInteger(data?.selectedLevel) ? Math.max(1, Math.min(30, data!.selectedLevel!)) : 1;
    this.lastResult = data?.result;
    this.mapScroll = 0;
  }

  create(): void {
    this.campaignView = campaignRepository.view();
    if (!this.lastResult && this.selectedLevel === 1) this.selectedLevel = this.campaignView.highestUnlockedLevel;
    this.draw();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
      this.input.keyboard?.off('keydown-ESC', this.handleEscape);
      this.closeSheet(); this.mapMask?.destroy(); this.mapMask = null; this.mapRoot = null;
    });
    this.input.keyboard?.on('keydown-ESC', this.handleEscape);
  }

  private draw(): void {
    this.closeSheet(); this.mapMask?.destroy(); this.mapMask = null; this.mapRoot = null;
    this.children.removeAll(true);
    this.campaignView = campaignRepository.view();
    this.cameras.main.setBackgroundColor('#0A0E12');
    const W = this.scale.width, H = this.scale.height;
    const root = this.add.container(0, 0);
    const current = campaignLevelDetail(this.selectedLevel, this.campaignView) ?? campaignLevelDetail(1, this.campaignView)!;
    const layout = campaignScreenLayout(W, H);
    this.drawHeader(root, W, H);
    this.drawWorldTabs(root, W, current.worldId, layout.tabsY);
    this.drawMap(root, W, layout.mapY, layout.mapHeight, current.worldId);
    this.drawDetail(root, W, layout.detailY, layout.detailHeight);
  }

  private drawHeader(root: Phaser.GameObjects.Container, width: number, height: number): void {
    if (height < 520) {
      const margin = 12, gap = 6, backW = 62;
      const actionW = Math.max(72, (width - margin * 2 - backW - gap * 3) / 3);
      addAction(this, root, margin, 4, actionW, 'Aether\nCodex', () => this.openCodex(), 'secondary', true, 44);
      addAction(this, root, margin + actionW + gap, 4, actionW, 'Mastery', () => this.openMastery());
      addAction(this, root, margin + (actionW + gap) * 2, 4, actionW, 'Prepare', () => this.openPreparation());
      addAction(this, root, width - backW - 8, 4, backW, 'Back', () => this.scene.start('MainMenu'));
      return;
    }
    if (width < 520) {
      const tier = this.campaignView.profile.unlockedFeatures.includes('tower_visual_tier_iii') ? 'III · RUNIC'
        : this.campaignView.profile.unlockedFeatures.includes('tower_visual_tier_ii') ? 'II · REINFORCED' : 'I · STANDARD';
      const [masteryLine, tierLine] = campaignHeaderBadgeLines(this.campaignView.totalMasteryStars, this.campaignView.profile.worldSigils.length, tier);
      root.add(this.add.text(16, 9, 'AEGIS OF THE BORDERKEEP', style(16, C.goldBright, true, FONT_DISPLAY)));
      root.add(this.add.text(16, 29, masteryLine, style(12, C.textSecondary, true)));
      root.add(this.add.text(16, 43, tierLine, style(12, C.textSecondary, true)));
      addAction(this, root, width - 80, 4, 64, 'Back', () => this.scene.start('MainMenu'));
      const actionY = 60, margin = 16, gap = 6, buttonW = (width - margin * 2 - gap * 2) / 3;
      addAction(this, root, margin, actionY, buttonW, 'Aether Codex', () => this.openCodex());
      addAction(this, root, margin + buttonW + gap, actionY, buttonW, 'Mastery', () => this.openMastery(), 'secondary');
      addAction(this, root, margin + (buttonW + gap) * 2, actionY, buttonW, 'Preparation', () => this.openPreparation(), 'secondary');
      return;
    }
    const veteran = this.campaignView.profile.unlockedFeatures.includes('veteran_banner');
    const conqueror = this.campaignView.profile.unlockedFeatures.includes('frostveil_conqueror_crest');
    const tier = this.campaignView.profile.unlockedFeatures.includes('tower_visual_tier_iii') ? 'III · RUNIC'
      : this.campaignView.profile.unlockedFeatures.includes('tower_visual_tier_ii') ? 'II · REINFORCED' : 'I · STANDARD';
    root.add(this.add.text(16, 9, 'AEGIS OF THE BORDERKEEP', style(width < 520 ? 16 : 20, C.goldBright, true, FONT_DISPLAY)));
    const sigils = this.campaignView.profile.worldSigils.length;
    const badge = `MASTERY ${this.campaignView.totalMasteryStars}/90  ·  SIGILS ${sigils}/3  ·  TIER ${tier}${veteran ? '  ·  VETERAN' : ''}${conqueror ? '  ·  CONQUEROR' : ''}`;
    root.add(this.add.text(16, 30, badge, style(12, C.textSecondary, true)).setWordWrapWidth(width - 108));
    addAction(this, root, width - 80, 4, 64, 'Back', () => this.scene.start('MainMenu'));
    const actionY = 52, gap = 8, buttonW = (width - 32 - gap * 2) / 3;
    addAction(this, root, 16, actionY, buttonW, 'Aether Codex', () => this.openCodex());
    addAction(this, root, 16 + buttonW + gap, actionY, buttonW, 'Mastery', () => this.openMastery(), 'secondary');
    addAction(this, root, 16 + (buttonW + gap) * 2, actionY, buttonW, 'Preparation', () => this.openPreparation(), 'secondary');
  }

  private drawWorldTabs(root: Phaser.GameObjects.Container, width: number, active: CampaignWorldId, y: number): void {
    const gap = 8, tabW = (width - 32 - gap * 2) / 3;
    for (const [index, world] of CAMPAIGN_WORLDS.entries()) {
      const x = 16 + index * (tabW + gap), unlocked = isWorldUnlocked(world.id, this.campaignView);
      const label = `${worldLabel(world.id)}${unlocked ? '' : ' · Locked'}`;
      const control = button(this, root, x, y, tabW, label, () => this.focusWorld(world.id), active === world.id ? 'primary' : 'secondary', 44);
      control.text.setFontSize(width < 520 ? '12px' : '13px');
      if (!unlocked) { control.text.setColor(C.textMuted); control.box.setAlpha(0.72); }
    }
  }

  private drawMap(root: Phaser.GameObjects.Container, width: number, top: number, height: number, active: CampaignWorldId): void {
    const viewportX = 16, viewportW = width - 32, scale = 1;
    const viewport = { x: viewportX, y: top, width: viewportW, height };
    const route = campaignMapRoute(height);
    panel(this, root, viewportX, top, viewportW, height, 0x445564).setFillStyle(0x121920, 0.98);
    const mapRoot = this.add.container(0, 0); root.add(mapRoot); this.mapRoot = mapRoot;
    paintCampaignWorldMap(this, mapRoot, route.width, route.height);
    const routeGraphics = this.add.graphics(); mapRoot.add(routeGraphics);
    // All 30 nodes exist before roads are built, so both world crossings have endpoints.
    const centers = route.nodes;
    const scrollMax = Math.max(0, route.width - viewportW / scale);
    this.mapScroll = Math.max(0, Math.min(scrollMax, centers[this.selectedLevel - 1].x - viewportW / scale / 2));
    const centeredOffset = Math.max(0, (viewportW - route.width) / 2);
    const visibleMapStart = this.mapScroll - centeredOffset;
    for (const world of CAMPAIGN_WORLDS) {
      const wi = worldIndex(world.id), worldNodes = centers.filter(node => node.worldId === world.id);
      routeGraphics.lineStyle(18, 0x172025, 0.94);
      routeGraphics.beginPath(); routeGraphics.moveTo(worldNodes[0].x, worldNodes[0].y);
      for (const node of worldNodes.slice(1)) routeGraphics.lineTo(node.x, node.y);
      routeGraphics.strokePath();
      routeGraphics.lineStyle(8, WORLD_ACCENTS[world.id], 0.78);
      routeGraphics.beginPath(); routeGraphics.moveTo(worldNodes[0].x, worldNodes[0].y);
      for (const node of worldNodes.slice(1)) routeGraphics.lineTo(node.x, node.y);
      routeGraphics.strokePath();
      routeGraphics.lineStyle(1, 0xd7aa4e, active === world.id ? 0.78 : 0.34);
      routeGraphics.strokeRect(wi * CAMPAIGN_MAP_WORLD_WIDTH + 10, 5, CAMPAIGN_MAP_WORLD_WIDTH - 20, route.height - 10);
    }
    for (const link of route.links.filter(item => item.crossesWorld)) {
      routeGraphics.lineStyle(7, 0xd7aa4e, 0.7); routeGraphics.lineBetween(link.from.x, link.from.y, link.to.x, link.to.y);
      const x = (link.from.x + link.to.x) / 2, y = (link.from.y + link.to.y) / 2;
      routeGraphics.fillStyle(0x19232d, 0.94); routeGraphics.fillCircle(x, y, 16);
      routeGraphics.lineStyle(2, 0xd7aa4e, 0.75); routeGraphics.strokeCircle(x, y, 16);
    }
    if (height >= 100) for (const [wi, world] of CAMPAIGN_WORLDS.entries()) {
      const caption = campaignWorldCaptionLayout(wi, visibleMapStart, viewportW);
      if (!caption) continue;
      const compact = width < 520;
      const title = this.add.text(caption.textX, 8, `WORLD ${world.worldNumber}  ·  ${world.name.toUpperCase()}`, style(compact ? 13 : 15, C.textPrimary, true, FONT_DISPLAY))
        .setWordWrapWidth(caption.textWidth);
      const sigilEarned = this.campaignView.profile.worldSigils.includes(world.sigilId);
      const sigil = this.add.text(caption.textX, 8 + title.height + 4,
        `${world.levelStart}–${world.levelEnd}   ${sigilEarned ? 'SIGIL EARNED' : `BOSS SIGIL · LEVEL ${world.bossLevel}`}`,
        style(12, sigilEarned ? C.goldBright : C.textMuted)).setWordWrapWidth(caption.textWidth);
      panel(this, mapRoot, caption.x, 0, caption.width, sigil.y + sigil.height + 6, 0x445564).setFillStyle(C.bgPanel, 0.88);
      mapRoot.add([title, sigil]);
    }

    // Route nodes, mastery stars and sigil labels are house-style vector/text pictograms; no raster files are needed.
    const nodes = this.add.graphics(); mapRoot.add(nodes);
    for (const point of centers) {
      const detail = campaignLevelDetail(point.level, this.campaignView)!;
      const selected = point.level === this.selectedLevel;
      const boss = point.level % 10 === 0;
      const count = detail.stars;
      const radius = boss ? 28 : 16;
      const accent = WORLD_ACCENTS[point.worldId];
      if (selected) { nodes.fillStyle(0xf0cd72, 0.24); nodes.fillCircle(point.x, point.y, radius + 12); nodes.lineStyle(3, 0xf0cd72, 0.96); nodes.strokeCircle(point.x, point.y, radius + 6); }
      nodes.fillStyle(detail.locked ? 0x19232d : detail.completed ? accent : 0x253438, 0.98);
      nodes.fillCircle(point.x, point.y, radius);
      nodes.lineStyle(boss ? 3 : 2, detail.locked ? 0x63717a : detail.completed ? 0xf0cd72 : accent, detail.locked ? 0.65 : 0.95);
      nodes.strokeCircle(point.x, point.y, radius);
      if (boss) {
        nodes.fillStyle(detail.locked ? 0x68737b : accent, 0.96);
        nodes.fillTriangle(point.x - 13, point.y - 13, point.x - 8, point.y - 25, point.x - 2, point.y - 12);
        nodes.fillTriangle(point.x + 13, point.y - 13, point.x + 8, point.y - 25, point.x + 2, point.y - 12);
        nodes.fillStyle(0x121920, 0.98); nodes.fillCircle(point.x, point.y - 2, 8);
      }
      const label = this.add.text(point.x, point.y + (boss ? 6 : 0), `${boss ? 'B' : ''}${point.level}`, style(boss ? 12 : 13, detail.locked ? C.textMuted : C.textPrimary, true)).setOrigin(0.5);
      mapRoot.add(label);
      if (count > 0) {
        const earned = this.add.text(point.x, point.y + radius + 3, '★'.repeat(count), style(11, C.goldBright, true)).setOrigin(0.5, 0);
        mapRoot.add(earned);
      }
      const hit = this.add.rectangle(point.x, point.y, CAMPAIGN_NODE_HIT_SIZE, CAMPAIGN_NODE_HIT_SIZE, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
      hit.on('pointerup', (pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
        handleViewportPointerUp(viewport, pointer, event, () => { this.selectedLevel = point.level; this.lastResult = undefined; this.draw(); });
      });
      mapRoot.add(hit);
    }

    mapRoot.setPosition(viewportX + centeredOffset - this.mapScroll * scale, top).setScale(scale);
    this.mapMask = new ViewportMaskController(this, mapRoot, viewport);
  }

  private drawDetail(root: Phaser.GameObjects.Container, width: number, top: number, height: number): void {
    if (height < 100) return;
    const detail = campaignLevelDetail(this.selectedLevel, this.campaignView)!;
    const x = 16, panelW = width - 32, boxH = height;
    panel(this, root, x, top, panelW, boxH, detail.boss ? WORLD_ACCENTS[detail.worldId] : 0x445564);
    const bossText = detail.boss ? ` · ${detail.boss.name}` : '';
    root.add(this.add.text(x + 16, top + 10, `LEVEL ${detail.level}${bossText}`, style(width < 520 ? 16 : 20, detail.boss ? C.goldBright : C.textPrimary, true, FONT_DISPLAY)).setWordWrapWidth(panelW - 32));
    const starsText = `${detail.stars}/3 stars`;
    const layoutLabel = detail.layoutId.split('_').pop()?.toUpperCase() ?? detail.layoutId;
    const compact = boxH < 220;
    const veryCompact = boxH < 180;
    const meta = width < 520
      ? campaignCompactDetailMeta(detail)
      : `${detail.worldName}  ·  Layout ${layoutLabel}  ·  Difficulty ${detail.difficulty}/5  ·  ${starsText}  ·  ${detail.bestScore === null ? 'Best score: —' : `Best ${detail.bestScore.toLocaleString('en-US')} pts · ${detail.bestLives} lives`}`;
    const metaText = this.add.text(x + 16, top + (compact ? 32 : 36), meta, style(12, C.textSecondary)).setWordWrapWidth(panelW - 32);
    root.add(metaText);

    const resultStatus = this.lastResult?.level === detail.level ? campaignClearStatus(this.lastResult) : null;
    const warning = resultStatus && !resultStatus.saved ? resultStatus.warning : this.campaignView.warning;
    const hasCompactNotice = compact && Boolean(resultStatus || warning);
    let contentLayout = campaignDetailContentLayout(boxH, hasCompactNotice, Boolean(detail.boss), metaText.height);
    if (detail.boss && !compact) {
      const guidance = this.add.text(x + 16, top + 58, detail.boss.guidance, style(12, C.textSecondary)).setWordWrapWidth(panelW - 32);
      root.add(guidance);
    }

    const mastery = getCampaignLevel(detail.level)!.mastery;
    const goals = compact
      ? `${detail.objectives[0].earned ? '★' : '☆'} Clear · ${detail.objectives[1].earned ? '★' : '☆'} ${mastery.minimumLivesForStar}+ lives · ${detail.objectives[2].earned ? '★' : '☆'} ${mastery.scoreTarget.toLocaleString('en-US')} score`
      : detail.objectives.map((objective, index) => `${objective.earned ? '★' : '☆'} ${index === 0 ? 'Complete level' : index === 1 ? `Keep ${mastery.minimumLivesForStar}+ lives` : `Reach ${mastery.scoreTarget.toLocaleString('en-US')} score`}`).join('   ·   ');
    const goalsText = this.add.text(x + 16, top + contentLayout.goalsY, goals, style(12, C.textSecondary)).setWordWrapWidth(panelW - 32);
    root.add(goalsText);
    contentLayout = campaignDetailContentLayout(boxH, hasCompactNotice, Boolean(detail.boss), metaText.height, goalsText.height);
    goalsText.setY(top + contentLayout.goalsY);

    const enemyTop = top + contentLayout.enemyCenterY;
    const previewIds = detail.enemyIds.slice(0, Math.min(6, Math.max(1, Math.floor((panelW - 24) / 52))));
    if (!hasCompactNotice) {
      previewIds.forEach((id, index) => {
        const ex = x + 38 + index * 52;
        const previewSize = veryCompact ? (id === detail.boss?.id ? 24 : 20)
          : compact ? (id === detail.boss?.id ? 28 : 24)
            : id === detail.boss?.id ? 42 : 34;
        drawCampaignEnemyBadge(this, root, id, ex, enemyTop, previewSize);
      });
      if (detail.enemyIds.length > previewIds.length) root.add(this.add.text(x + 38 + previewIds.length * 52, enemyTop, `+${detail.enemyIds.length - previewIds.length}`, style(12, C.textSecondary, true)));
    }
    const enemyNames = campaignEnemyPreviewText(detail.enemyIds.map(id => getCampaignEnemy(id).name));
    const namesY = top + contentLayout.enemyNamesY;
    const enemyNameText = this.add.text(x + 10, namesY, enemyNames, style(12, detail.boss ? C.goldBright : C.textSecondary, true)).setWordWrapWidth(panelW - 20);
    root.add(enemyNameText);
    const buttonY = top + contentLayout.buttonY, gap = 8, innerW = panelW - 32;
    const classicW = Math.min(140, innerW * 0.34), startW = innerW - classicW - gap;
    addAction(this, root, x + 16, buttonY, startW, detail.canStart ? 'Start Battle' : 'Clear previous level first', () => this.startBattle(detail.level), 'primary', detail.canStart);
    addAction(this, root, x + 16 + startW + gap, buttonY, classicW, 'Classic Siege', () => this.scene.start('Difficulty'));
    if (compact) {
      const compactCopy = resultStatus
        ? resultStatus.compactMessage
        : warning ? campaignWarningCompactMessage(warning) : null;
      if (compactCopy) {
        const statusY = top + contentLayout.statusY;
        const tone = resultStatus?.tone === 'success' ? C.health : C.dangerBright;
        root.add(this.add.text(x + 16, statusY, compactCopy, style(12, tone, true)).setWordWrapWidth(panelW - 32));
      }
    } else if (resultStatus) {
      const tone = resultStatus.tone === 'success' ? C.health : C.dangerBright;
      root.add(this.add.text(width - 24, top + 10, resultStatus.message, style(12, tone, true)).setOrigin(1, 0));
    }
    if (!compact && warning) root.add(this.add.text(x + 16, buttonY - 20, warning, style(12, C.dangerBright)).setWordWrapWidth(panelW - 32));
  }

  private focusWorld(worldId: CampaignWorldId): void {
    const world = getCampaignWorld(worldId), preferred = Math.max(world.levelStart, Math.min(world.levelEnd, this.campaignView.highestUnlockedLevel));
    this.selectedLevel = isWorldUnlocked(worldId, this.campaignView) ? preferred : world.levelStart;
    this.lastResult = undefined; this.draw();
  }

  private startBattle(level: number): void {
    const detail = campaignLevelDetail(level, campaignRepository.view());
    if (!detail?.canStart) return;
    this.scene.start('Preload', {
      stage: 'gameplay', destination: 'Game',
      data: { difficulty: 'medium', playerName: loadSettings().playerName, mode: 'campaign', campaignLevel: level }
    });
  }

  private makeSheet(title: string): ScrollSheet {
    this.closeSheet();
    const root = this.add.container(0, 0).setDepth(100); this.sheetRoot = root;
    const sheet = new ScrollSheet(this, root, { x: 12, y: 12, width: this.scale.width - 24, height: this.scale.height - 24 }, title, () => this.closeSheet());
    this.sheet = sheet; return sheet;
  }

  private closeSheet(): void {
    this.sheet?.destroy(); this.sheet = null;
    this.sheetRoot?.destroy(true); this.sheetRoot = null;
  }

  private openMastery(): void {
    const sheet = this.makeSheet('Mastery · Stars and Sigils');
    let y = 0;
    sheet.text(y, `Mastery Stars  ${this.campaignView.totalMasteryStars}/90`, C.goldBright, 16); y += 36;
    for (const milestone of campaignMilestones(this.campaignView)) {
      sheet.text(y, `${milestone.earned ? 'UNLOCKED' : 'LOCKED'}  ·  ${milestone.stars} stars  ·  ${milestone.label}`, milestone.earned ? C.textPrimary : C.textMuted);
      y += 42;
    }
    y += 8;
    for (const sigil of CAMPAIGN_SIGILS) {
      const earned = this.campaignView.profile.worldSigils.includes(sigil.id);
      const name = sigil.id === 'border_sigil' ? 'Border Sigil' : sigil.id === 'ember_sigil' ? 'Ember Sigil' : 'Frost Sigil';
      sheet.text(y, `${earned ? 'EARNED' : `LEVEL ${sigil.level}`}  ·  ${name}`, earned ? C.goldBright : C.textMuted);
      y += 32;
    }
    const tier = this.campaignView.profile.unlockedFeatures.includes('tower_visual_tier_iii') ? 'Runic Masterwork · Tier III'
      : this.campaignView.profile.unlockedFeatures.includes('tower_visual_tier_ii') ? 'Reinforced · Tier II' : 'Borderkeep Standard · Tier I';
    sheet.text(y + 8, `Tower visuals: ${tier}`); y += 48;
    if (this.campaignView.warning) sheet.text(y, this.campaignView.warning, C.dangerBright);
    sheet.action(y + 48, 'Return to the map', () => this.closeSheet(), 'primary');
  }

  private openCodex(): void {
    const sheet = this.makeSheet('Aether Codex');
    if (!this.campaignView.profile.unlockedFeatures.includes('aether_codex_tactics')) {
      sheet.text(0, `Tactical entries unlock at 10 Mastery Stars. You have ${this.campaignView.totalMasteryStars}/10.`);
      return;
    }
    let y = 0;
    const ids = CAMPAIGN_LEVELS.flatMap(level => level.enemyIds).filter((id, index, all) => all.indexOf(id) === index);
    for (const id of ids) {
      const enemy = getCampaignEnemy(id);
      sheet.text(y, `${enemy.name} · ${worldLabel(CAMPAIGN_LEVELS.find(level => level.enemyIds.includes(id))!.worldId)}`, C.goldBright);
      y += 22; sheet.text(y, TACTICS[id] ?? 'Observe its movement and defenses.'); y += 36;
      if (this.campaignView.profile.unlockedFeatures.includes('advanced_codex_stats')) {
        sheet.text(y, `HP ${enemy.baseHp} · Speed ${enemy.baseSpeed} · Physical armor ${Math.round(enemy.physicalArmor * 100)}% · Ward ${Math.round(enemy.wardArmor * 100)}% · Slow resistance ${Math.round(enemy.slowResistance * 100)}%`, C.textMuted, 12);
        y += 40;
      }
    }
    for (const world of CAMPAIGN_WORLDS) {
      const enemy = getCampaignEnemy(world.bossEnemyId), feature = BOSS_FEATURE[world.bossEnemyId];
      const unlocked = feature !== undefined && this.campaignView.profile.unlockedFeatures.includes(feature);
      sheet.text(y, `${unlocked ? 'CODEX ENTRY' : `REQUIRES ${world.sigilId.replace('_', ' ').toUpperCase()}`}  ·  ${enemy.name}`, unlocked ? C.goldBright : C.textMuted);
      y += 22;
      if (unlocked) {
        const description = sheet.text(y, world.bossEnemyId === 'hollow_warden' ? 'Temporary damage ward; summons Marchlings at half health; quickens below 25% health.'
          : world.bossEnemyId === 'cinder_colossus' ? 'High starting armor breaks in stages; its exposed core takes increased damage.'
          : 'Resists slowing and telegraphs temporary tower freezes; later freezes can catch two towers.');
        y += description.height + 22;
        if (this.campaignView.profile.unlockedFeatures.includes('advanced_codex_stats')) {
          sheet.text(y, `HP ${enemy.baseHp} · Speed ${enemy.baseSpeed} · Physical armor ${Math.round(enemy.physicalArmor * 100)}% · Ward ${Math.round(enemy.wardArmor * 100)}%`, C.textMuted, 12); y += 36;
        }
      } else y += 32;
    }
  }

  private openPreparation(): void {
    this.campaignView = campaignRepository.view();
    const sheet = this.makeSheet('Battle Preparation');
    const starsNow = this.campaignView.totalMasteryStars;
    const unlocked20 = this.campaignView.profile.unlockedFeatures.includes('battle_preparation_presets');
    const unlocked30 = this.campaignView.profile.unlockedFeatures.includes('tower_specialization_i');
    let y = 0;
    sheet.text(y, `Campaign setup · ${starsNow} Mastery Stars`, C.goldBright, 16); y += 34;
    if (!unlocked20) {
      sheet.text(y, `Targeting preferences and saved presets unlock at 20 stars. You have ${starsNow}/20.`); y += 48;
    } else {
      sheet.text(y, 'Tower targeting'); y += 26;
      for (const id of TOWER_IDS) {
        const current = this.campaignView.profile.targeting[id];
        const next = TARGETING_MODES[(TARGETING_MODES.indexOf(current) + 1) % TARGETING_MODES.length];
        const label = TOWERS[id].name;
        sheet.action(y, `${label} · ${current.toUpperCase()}  →  ${next.toUpperCase()}`, () => {
          campaignRepository.setPreparationTargeting(id, next); this.campaignView = campaignRepository.view(); this.openPreparation();
        });
        y += 52;
      }
      y += 8; sheet.text(y, `Saved presets · ${this.campaignView.profile.preparationPresets.length}/3`, C.goldBright); y += 28;
      const presetNames = ['Watch', 'Assault', 'Finale'];
      presetNames.forEach((name, index) => {
        const id = `campaign-slot-${index + 1}`;
        const preset = this.campaignView.profile.preparationPresets.find(item => item.id === id);
        sheet.text(y, `${name}${preset ? ` · saved as “${preset.name}”` : ' · empty'}`); y += 22;
        sheet.action(y, 'Save this setup', () => { campaignRepository.savePreparationPreset(id, name); this.campaignView = campaignRepository.view(); this.openPreparation(); }, 'secondary'); y += 52;
        sheet.action(y, preset ? 'Load saved setup' : 'No saved setup', () => {
          if (preset) { campaignRepository.loadPreparationPreset(id); this.campaignView = campaignRepository.view(); this.openPreparation(); }
        }, 'secondary', Boolean(preset));
        y += 52;
        if (preset) { sheet.action(y, 'Delete preset', () => { campaignRepository.deletePreparationPreset(id); this.campaignView = campaignRepository.view(); this.openPreparation(); }, 'secondary'); y += 52; }
      });
    }

    y += 8; sheet.text(y, 'Tower specialization sidegrades', C.goldBright, 16); y += 32;
    if (!unlocked30) {
      sheet.text(y, `Unlocks at 30 Mastery Stars. You have ${starsNow}/30. Choices remain reversible between levels.`);
    } else {
      for (const id of TOWER_IDS) {
        const options = getTowerSpecializations(id), chosen = this.campaignView.profile.choices[id];
        sheet.text(y, `${TOWERS[id].name} · ${chosen ? options.find(option => option.id === chosen)?.name : 'No specialization'}`, C.textPrimary, 14); y += 22;
        for (const option of options) {
          sheet.text(y, `${option.name}: ${option.description}`, C.textSecondary, 12); y += 34;
          const isChosen = chosen === option.id;
          sheet.action(y, isChosen ? `Selected · ${option.name}` : `Choose · ${option.name}`, () => {
            campaignRepository.setSpecialization(id, option.id); this.campaignView = campaignRepository.view(); this.openPreparation();
          }, isChosen ? 'secondary' : 'primary', !isChosen);
          y += 52;
        }
        if (chosen) { sheet.action(y, 'Remove specialization', () => { campaignRepository.setSpecialization(id, null); this.campaignView = campaignRepository.view(); this.openPreparation(); }); y += 52; }
        y += 8;
      }
    }
    if (this.campaignView.warning) sheet.text(y + 20, this.campaignView.warning, C.dangerBright);
  }
}
