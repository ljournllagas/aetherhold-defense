import {campaignResultActions} from '../ui/campaignResultActions.ts';
import {enemyPresentation} from '../ui/enemyPresentation.ts';
import {guestRunProgress} from '../systems/GuestProgress.ts';
import {formatCount,formatQuantity} from '../../shared/displayNumbers.ts';
import Phaser from 'phaser';
import { accountSystem } from '../systems/AccountSystem.ts';
import { accountEntryAllowed, accountStatus } from '../ui/accountControls.ts';
import type { AccountRef,RunOwner,RunResult } from '../../shared/account.ts';
import type { GameOverData } from './GameOverScene.ts';
import type { GameStartData, LoadingRequest } from './PreloadScene.ts';
import { MAP1, HUD_HEIGHT, CLASSIC_ROAD_ENVELOPE, type MapDef } from '../maps/map1.ts';
import { BUILD_PLOT_POLICY } from '../maps/buildPlotPolicy.ts';
import { TOWER_LIST, TOWERS, towerTotalInvested, isTowerId } from '../config/towers.ts';
import { ENEMIES, BOSS_BEHAVIOR, BONUS_TARGET_HP_PER_WAVE } from '../config/enemies.ts';
import { getDifficulty } from '../config/difficulties.ts';
import { POWERUPS, POWERUP_EFFECTS, POWERUP_DROP_CHANCE_PER_KILL, POWERUP_INVENTORY_LIMIT } from '../config/powerUps.ts';
import { EVOLUTIONS } from '../config/evolutions.ts';
import type { DamageType, DifficultyId, EnemyArchetype, PowerUpId, TargetingMode } from '../../shared/types.ts';
import { createQACampaignRepository, isQACampaignFixture, type QACampaignFixture, type QAAction, type QAStatus } from '../qa.ts';
import { GAME_VERSION, SCORE_VERSION } from '../../shared/version.ts';
import { CAMPAIGN_SCORE_VERSION, calculateCampaignLiveScore, calculateCampaignScore, campaignScoreMetadata, type CampaignScoreBreakdown } from '../../shared/campaignScoring.ts';
import { buildWave, scheduleWave, enemyHpForWave, enemySpeedForWave } from '../systems/WaveSystem.ts';
import { RelicVault, advanceFlights } from '../systems/RunSimulation.ts';
import { AutoSystem, chooseAutoRelic, type AutoContext, type AutoRelicIntent } from '../systems/AutoSystem.ts';
import { gameLayout, sheetBounds, viewportToWorld, worldToViewport, type GameLayout } from '../ui/layout.ts';
import {TowerTray} from '../ui/TowerTray.ts';
import {TowerTrayGesture,edgePan,type TrayInput,type TrayIntent} from '../systems/TowerTrayGesture.ts';
import type {TowerId} from '../../shared/progression.ts';
import {localGuide,type GuideStep} from '../systems/ContextualGuide.ts';
import {HELP_TOPICS} from '../ui/helpContent.ts';
import {campaignProgressionLines,progressionPanelLines} from './ProgressionScene.ts';
import {campaignRequirements, missedAchievementDetail} from '../ui/prerequisites.ts';
import {achievementViews} from '../ui/progressionView.ts';
import {loadLegacyBests} from '../systems/Settings.ts';
import { button, panel, statRow } from '../ui/components.ts';
import { calculateLiveScore, calculateScore } from '../systems/ScoreSystem.ts';
import { killReward, waveClearBonus, canAfford } from '../systems/EconomySystem.ts';
import { rollPowerUp, shouldDropOnKill } from '../systems/PowerUpSystem.ts';
import { pickTarget } from '../systems/CombatSystem.ts';
import { loadSettings, saveSettings, loadBest, saveBest } from '../systems/Settings.ts';
import { runPlayerName } from '../../shared/playerName.ts';
import { SimulationClock, SIMULATION_STEP_MS } from '../systems/SimulationClock.ts';
import { SoundManager } from '../systems/SoundManager.ts';
import { newRunId } from '../../api/leaderboardClient.ts';
import { C, FONT_DISPLAY, RARITY_COLOR, RANGE_FILL_ALPHA, RANGE_STROKE, RANGE_STROKE_ALPHA, style } from '../ui/tokens.ts';
import { V2, emblemKey } from '../art/artkit.ts';
import { relicHeroTexture } from '../art/iconArt.ts';
import { buildTowerVisual, decorateEvolution, towerPortraitKey, towerArtGeometry } from '../art/towerArt.ts';
import { buildEnemyVisual, enemyVisualSupport, enemyVisibleDimension, type EnemyView } from '../art/enemyArt.ts';
import { paintBattlefield, refreshStronghold } from '../art/terrain.ts';
import type { BattlefieldArt } from '../art/terrain.ts';
import { Enemy } from '../entities/Enemy.ts';
import { Tower } from '../entities/Tower.ts';
import { BattlefieldView, type Point, type FitSupport, type Rect } from '../ui/viewport.ts';
import { PointerGesture } from '../systems/PointerGesture.ts';
import { ViewportMaskController } from '../ui/ViewportMask.ts';
import { PauseState } from '../systems/PauseState.ts';
import { ScrollSheet } from '../ui/ScrollSheet.ts';
import { SiegeSystem, victoryRewardChoices, victoryRewardsResolved } from '../systems/SiegeSystem.ts';
import { EvolutionCombat, chainShot, nextChainTarget, volleyTargets } from '../systems/EvolutionCombat.ts';
import { purchaseEvolution, effectiveStats, initialEvolution, investedRefund, previewPurchaseStats, PURCHASE_REASON_TEXT, type PurchaseContext, type PurchaseIntent } from '../systems/EvolutionSystem.ts';
import { unlockRepository as sharedUnlockRepository, earnedBranches, SAVE_FAILED_WARNING, UNLOCK_STORAGE_KEY, type UnlockRepository } from '../systems/UnlockSystem.ts';
import { formatStat, towerProgressionView, wavePresentation } from '../ui/progressionView.ts';
import type { BranchId, RunOutcome, ShotSnapshot } from '../../shared/progression.ts';
import { CampaignBattle, CAMPAIGN_BATTLE_TUNING, campaignTowerStats, specializeShot, type CampaignShot, type CampaignSpawn } from '../campaign/battle.ts';
import { CAMPAIGN_BOSS_PHASE_LABELS, CampaignBossSystem, CAMPAIGN_BOSS_TUNING, type CampaignBossPhaseLabel } from '../campaign/bosses.ts';
import { getCampaignEnemy, isClassicEnemy } from '../campaign/enemies.ts';
import { CampaignRepository, campaignRepository, CAMPAIGN_STORAGE_KEY } from '../campaign/progress.ts';
import { CAMPAIGN_LEVELS, getCampaignLevel } from '../campaign/config.ts';
import { getCampaignSpecialization } from '../campaign/specializations.ts';
import type { CampaignClearResult } from '../campaign/types.ts';

interface Flight {
  elapsedMs: number; durationMs: number;
  x1: number; y1: number; x2: number; y2: number;
  towerId: string; targetId: number;
  shot: CampaignShot;
  view: Phaser.GameObjects.Container;
  chainIndex: number;
  hit: Set<number>;
}

interface Floater {
  text: Phaser.GameObjects.Text;
  until: number;
}

const TARGET_MODES: TargetingMode[] = ['first', 'last', 'strongest', 'weakest', 'closest'];

export class GameScene extends Phaser.Scene {
  private map: MapDef = MAP1;
  private campaign: CampaignBattle | null = null;
  private campaignBosses = new CampaignBossSystem();
  private campaignCallout: { text: string; until: number } | null = null;
  private campaignCalloutView: Phaser.GameObjects.Text | null = null;
  private campaignStartRejected = false;
  private qaCampaignFixture: QACampaignFixture | null = null;
  private qaCampaignRepository: CampaignRepository | null = null;
  private get towerVisualTier(): 1 | 2 | 3 {
    return (import.meta.env.DEV ? this.qaCampaignFixture?.visualTier : undefined) ?? this.campaign?.visualTier ?? 1;
  }
  private campaignResult: { outcome: RunOutcome; score: number; lives: number; scheduledEnemiesKilled: number; wavesCompleted: number; missionBossesKilled: number; clear: CampaignClearResult | null; breakdown: CampaignScoreBreakdown } | null = null;
  private towerFreezeViews = new Map<number, Phaser.GameObjects.Arc>();
  private difficultyId: DifficultyId = 'medium';
  private playerName = 'Warden';
  private runAccount: AccountRef | null = null;
  private runOwner:RunOwner|null=null;
  private runId = '';
  private gold = 600;
  private lives = 20;
  private maxLives = 20;
  private wave = 0;
  private wavesCompleted = 0;
  private campaignScheduledIds = new Set<number>();
  private campaignScheduledKills = 0;
  private campaignMissionBossKills = 0;
  private waveActive = false;
  private currentWaveIsBoss = false;
  private enemies: Enemy[] = [];
  private towers: Tower[] = [];
  private dying: Array<{ view: Phaser.GameObjects.Container; shadow: Phaser.GameObjects.Ellipse | null; ring: Phaser.GameObjects.Ellipse | null; bar: Phaser.GameObjects.Graphics | null; t0: number; duration: number }> = [];
  private field: BattlefieldArt | null = null;
  private spawnQueue: CampaignSpawn[] = [];
  private gameTimeMs = 0;
  private lastQAStatusAt = 0;
  private speed = 1;
  private pauseState = new PauseState();
  private get paused(): boolean { return this.pauseState.has('user'); }
  private set paused(value: boolean) { this.pauseState.set('user', value); }
  private get pausedByModal(): boolean { return this.pauseState.has('modal') || this.pauseState.has('background'); }
  private set pausedByModal(value: boolean) { this.pauseState.set('modal', value); }
  private cameraView = new BattlefieldView(gameLayout(1280, 720).field);
  private gesture = new PointerGesture();
  private touchPreview: { point: Point; plot: number | null } | null = null;
  private towerTray:TowerTray|null=null;
  private bottomCommandObjects: Phaser.GameObjects.GameObject[] = [];
  private trayGesture=new TowerTrayGesture();
  private trayOwner:number|null=null;
  private trayPoint:Point|null=null;
  private trayDrag:{point:Point;anchor:Point}|null=null;
  private compactInspectorBounds:{x:number;y:number;width:number;height:number}|null=null;
  private beginTowerDrag(input:TrayInput,id:TowerId):void {
    if(this.trayOwner!==null&&this.trayOwner!==input.id){const owner=this.trayOwner,point=this.trayPoint;this.cancelGesture();if(point)this.gesture.down(owner,point);this.gesture.down(input.id,input.point);return;}
    if(this.gesture.contactCount){this.gesture.down(input.id,input.point);return;}
    if(this.isRunBlocked()||this.modal||this.sheetKind||this.pendingMeteor)return;
    this.trayOwner=input.id;this.trayPoint=input.point;this.trayGesture.down(input,id);this.gesture.cancel();
  }
  private pointerTrayInput(p:Phaser.Input.Pointer):TrayInput {
    return {id:p.id,point:{x:p.x,y:p.y},kind:p.wasTouch?'touch':(p.event as PointerEvent)?.pointerType==='pen'?'pen':'mouse'};
  }
  private overBattleControls(p:Point):boolean {
    const b=this.compactInspectorBounds;
    return !!this.towerTray?.contains(p)||!!this.sheet?.contains(p)||!!b&&(p.x>=b.x&&p.x<b.x+b.width&&p.y>=b.y&&p.y<b.y+b.height);
  }
  private handleTrayIntent(intent:TrayIntent|null):void {
    if(!intent)return;
    if(intent.type==='scroll'){this.towerTray?.scrollBy(intent.dx);return;}
    if(intent.type==='cancel'){this.cancelGesture();return;}
    if(intent.type==='select'){
      this.touchMode=true;this.placingTowerId=intent.towerId;this.selectedTower=null;this.touchPreview=null;
      this.refreshInfoPanel();this.refreshPlots();this.showTouchPreview();return;
    }
    if(intent.type==='drag'){
      const changed=this.placingTowerId!==intent.towerId;
      this.placingTowerId=intent.towerId;this.selectedTower=null;this.trayDrag=intent;
      if(changed)this.refreshPlots();
      this.infoPanel?.destroy(true);this.infoPanel=null;this.compactInspectorBounds=null;
      this.confirmStrip?.destroy(true);this.confirmStrip=null;this.touchPreview=null;
      const index=this.cameraView.nearest(this.map.buildable,intent.anchor,28);
      const point=index>=0?this.map.buildable[index]:this.cameraView.unproject(intent.anchor);
      this.updateGhost(point.x,point.y);return;
    }
    this.trayDrag=null;this.placingTowerId=null;
    if(!this.cameraView.inField(intent.point)||this.overBattleControls(intent.point)||this.isRunBlocked()){this.hideGhost();return;}
    const plot=this.cameraView.nearest(this.map.buildable,intent.anchor,28);
    if(plot>=0)this.tryBuild(intent.towerId,plot);
    else this.showBanner('Drop onto a build circle.',C.gold);
    this.hideGhost();this.refreshPlots();
  }
  private touchMode = false;
  private sheet: ScrollSheet | null = null;
  private refreshProgressionActions: (() => void) | null = null;
  private sheetKind: 'build' | 'tower' | 'more' | 'relics' | 'next' | 'evolve' | 'help' | 'progression' | null = null;
  private guide=localGuide();
  private progressionTab:'campaign'|'classic'='campaign';
  private guideStep:GuideStep|null=null;
  private showGuide(step:GuideStep):void {
    if(!this.guide.shouldShow(step)||this.ended||this.modal||this.sheetKind)return;
    this.guideStep=step;this.openDetails('help');
  }
  private confirmStrip: Phaser.GameObjects.Container | null = null;
  private modalRenderer: (() => void) | null = null;
  private modalSheet: ScrollSheet | null = null;
  private rebuildingModal = false;
  private modalError = '';
  private backgroundOverlay: Phaser.GameObjects.Container | null = null;
  private gestureHintShown = false;
  private enemiesKilled = 0;
  private elitesKilled = 0;
  private bossesKilled = 0;
  private startTime = 0;
  private runningDurationMs = 0;
  private simulationClock = new SimulationClock();
  private inSimulationTick = false;
  private freezeUntil = 0;
  private doubleBountyUntil = 0;
  private battleCryUntil = 0;
  private surgeUntil = 0;
  private vault = new RelicVault();
  private auto = new AutoSystem();
  private autoLastUpdateAt: number | null = null;
  private autoLastKeyAt = -Infinity;
  private get powerups(): PowerUpId[] { return this.vault.stored; }
  private get pendingMeteor(): boolean { return this.vault.target !== null; }
  private flights: Flight[] = [];
  private effects: Array<{ view: Phaser.GameObjects.GameObject & { setAlpha(value: number): unknown }; until: number; duration: number }> = [];
  private ended = false;
  private siege = new SiegeSystem();
  private evolutionCombat = new EvolutionCombat();
  private unlockRepository: UnlockRepository = sharedUnlockRepository;
  private runUnlocks: ReadonlySet<BranchId> = new Set();
  private unlocksEarnedThisRun: BranchId[] = [];
  private debugAssisted = false;
  private achievementNotices: Array<{ branchId: BranchId; remainingMs: number }> = [];
  private notifiedAchievements = new Set<BranchId>();
  private achievementNoticeView: Phaser.GameObjects.Text | null = null;
  private progressionListenerAttached = false;
  private readonly handleStorage = (event: { key: string | null }): void => {
    if (event.key === null || event.key === UNLOCK_STORAGE_KEY) this.unlockRepository.reconcile();
    if (event.key === null || event.key === CAMPAIGN_STORAGE_KEY) campaignRepository.reconcile();
  };
  private scheduledBossIds = new Map<number, number>();
  private victoryPanel: Phaser.GameObjects.Container | null = null;
  private layout: GameLayout = gameLayout(1280, 720);
  private worldRoot: Phaser.GameObjects.Container | null = null;
  private fieldMask: ViewportMaskController | null = null;
  private uiRoot: Phaser.GameObjects.Container | null = null;
  private catalog: Phaser.GameObjects.Container | null = null;
  private catalogOpen = false;
  private selectionRing: Phaser.GameObjects.Arc | null = null;
  private ghostBase: Phaser.GameObjects.Ellipse | null = null;
  private ghostTowerId = '';
  private revealTimer: Phaser.Time.TimerEvent | null = null;
  private storeAfterTarget = false;

  // selection / placement
  private selectedTower: Tower | null = null;
  private placingTowerId: string | null = null;

  // rendering refs
  private hudWaveLabel: Phaser.GameObjects.Text | null = null;
  private hudWaveValue: Phaser.GameObjects.Text | null = null;
  private hudGoldValue: Phaser.GameObjects.Text | null = null;
  private hudLivesValue: Phaser.GameObjects.Text | null = null;
  private hudScoreValue: Phaser.GameObjects.Text | null = null;
  private hudDiff: Phaser.GameObjects.Text | null = null;
  private hudStatus: Phaser.GameObjects.Text | null = null;
  private hudObjects: Phaser.GameObjects.GameObject[] = [];
  private hudMetricLabels: Phaser.GameObjects.Text[] = [];
  private topControlObjects: Phaser.GameObjects.GameObject[] = [];
  private autoButton: ReturnType<typeof button> | null = null;
  private pauseAutoButton: ReturnType<typeof button> | null = null;
  private autoStatusText: Phaser.GameObjects.Text | null = null;
  private autoDetailText: Phaser.GameObjects.Text | null = null;
  private startBtn: Phaser.GameObjects.Rectangle | null = null;
  private startBtnLabel: Phaser.GameObjects.Text | null = null;
  private nextPreview: Phaser.GameObjects.Text | null = null;
  private infoPanel: Phaser.GameObjects.Container | null = null;
  private towerCommands: Phaser.GameObjects.Container | null = null;
  private placePanel: Phaser.GameObjects.Container | null = null;
  private powerupRow: Phaser.GameObjects.Container | null = null;
  private rangeCircle: Phaser.GameObjects.Arc | null = null;
  private rangeBackdrop: Phaser.GameObjects.Arc | null = null;
  private fieldViews = new Map<number, Phaser.GameObjects.Arc>();
  private auraCircle: Phaser.GameObjects.Arc | null = null;
  private ghost:Phaser.GameObjects.Container | null = null;
  private ghostReason: Phaser.GameObjects.Text | null = null;
  private floaters: Floater[] = [];
  private enemyLayer: Phaser.GameObjects.Container | null = null;
  private bossWarned: Record<number, boolean> = {};
  private modal: Phaser.GameObjects.Container | null = null;
  private bossBar: Phaser.GameObjects.Container | null = null;
  private bossBarFill: Phaser.GameObjects.Rectangle | null = null;
  private bossBarText: Phaser.GameObjects.Text | null = null;
  private bossBarBackdrop: Phaser.GameObjects.Rectangle | null = null;
  private bossBarTrack: Phaser.GameObjects.Rectangle | null = null;
  private bossPanelHeight = 0;
  private bossHudReservedHeight = 0;
  private bossHudCameraBeforeReservation: { zoom: number; center: Point; headroom: number; reservedZoom: number; reservedCenter: Point; reservedHeadroom: number } | null = null;
  private compactBossActive = false;
  private bossFitBoss: Enemy | null = null;
  private bossFitMap: MapDef | null = null;
  private plotMarkers: Phaser.GameObjects.Arc[] = [];
  private occupied = new Set<number>();

  private readonly handlePointerDown = (ptr: Phaser.Input.Pointer): void => {
    if(this.trayOwner!==null&&ptr.id!==this.trayOwner){const id=this.trayOwner,point=this.trayPoint;this.cancelGesture();if(point)this.gesture.down(id,point);this.gesture.down(ptr.id,ptr);return;}
    if (this.pauseState.has('background')) return;
    SoundManager.get().unlock();
    if (this.modal || this.sheet?.contains(ptr)) return;
    if (ptr.wasTouch || (ptr.event as PointerEvent)?.pointerType === 'pen') {
      this.touchMode = true;
      if (this.cameraView.inField(ptr)) this.gesture.down(ptr.id, ptr);
      if (!this.gestureHintShown) { this.gestureHintShown = true; this.showBanner('Tap to select · Drag to pan · Pinch to zoom', C.gold); }
      return;
    }
    this.touchMode = false;
    this.selectBattlefield(ptr, false);
  };

  private selectBattlefield(screen: Point, touch: boolean): void {
    if (this.isRunBlocked()) return;
    if (this.modal ||this.pauseState.blocked || !this.cameraView.contains(screen)) return;
    const point = this.cameraView.unproject(screen);
    const inField = true;
    if (this.pendingMeteor) {
      if (touch) { this.touchPreview = { point, plot: null }; this.showTouchPreview(); }
      else if (inField) this.castMeteor(point.x, point.y);
      return;
    }
    if (this.placingTowerId && inField) {
      const index = touch ? this.cameraView.nearest(this.map.buildable, screen, Math.max(22, 26 * this.cameraView.scale)) : this.nearestPlot(point.x, point.y)?.index ?? -1;
      this.touchMode=true;this.touchPreview = { point: index >= 0 ? this.map.buildable[index] : point, plot: index >= 0 ? index : null }; this.showTouchPreview();
      return;
    }
    if (inField) {
      const index = this.cameraView.nearest(this.towers, screen, Math.max(22, 24 * this.cameraView.scale));
      const t = touch ? this.towers[index] ?? null : this.towerAt(point.x, point.y);
      this.selectedTower = t;
      if (!this.layout.inspector) this.sheetKind = null;
      this.refreshInfoPanel();
    }
  }

  private readonly handlePointerMove = (ptr: Phaser.Input.Pointer): void => {
    if(this.trayOwner===ptr.id){if(!ptr.isDown){this.cancelGesture();return;}this.trayPoint={x:ptr.x,y:ptr.y};this.handleTrayIntent(this.trayGesture.move(this.pointerTrayInput(ptr)));return;}
    if (ptr.wasTouch || (ptr.event as PointerEvent)?.pointerType === 'pen') {
      const intent = this.gesture.move(ptr.id, ptr);
      if (intent?.type === 'pinch') { this.cameraView.zoomAt(this.cameraView.zoom * intent.ratio, intent.point); this.cameraView.pan(intent.dx, intent.dy); }
      if (intent?.type === 'pan') this.cameraView.pan(intent.dx, intent.dy);
      if (intent) this.applyView();
      return;
    }
    const point = this.cameraView.unproject(ptr);
    this.updateGhost(point.x, point.y);
  };

  private readonly handlePointerUp = (ptr: Phaser.Input.Pointer): void => {
    if(this.trayOwner===ptr.id){const intent=this.trayGesture.up(this.pointerTrayInput(ptr));this.trayOwner=null;this.handleTrayIntent(intent);return;}
    const intent = this.gesture.up(ptr.id);
    if (intent?.type === 'tap') this.selectBattlefield(intent.point, true);
  };
  private readonly cancelGesture = (): void => { this.gesture.cancel();this.trayGesture.cancel();this.trayOwner=null;this.trayDrag=null;this.placingTowerId=null;this.touchPreview=null;this.hideGhost(); this.cancelAutoPress(); };
  private readonly handleControlDown = ():void=>{if(this.trayOwner!==null||this.gesture.contactCount)this.cancelGesture();};
  private readonly captureLost = (event: PointerEvent): void => { if (event.buttons !== 0) this.cancelGesture(); };
  private readonly visibilityChanged = (): void => {
    if (!document.hidden) return;
    this.cancelGesture(); this.pauseState.set('background', true);
    SoundManager.get().suspend(); this.updateHUD(); this.drawBackgroundPause();
  };

  private readonly handleEscapeKey = (): void => this.onEscape();
  private readonly handleSpaceKey = (): void => {
    if (!this.modal && !this.waveActive && !this.paused) this.startNextWave();
  };
  private readonly handlePauseKey = (): void => {
    if (!this.modal || this.modal.getData('pauseMenu') === true) this.togglePauseMenu();
  };
  private readonly handleAutoKey = (event: KeyboardEvent): void => {
    const target = event.target as HTMLElement | null;
    if (event.repeat || target?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName ?? '')) return;
    // Phaser may replay queued keydowns before the frame queue is cleared.
    if (event.timeStamp <= this.autoLastKeyAt) return;
    this.autoLastKeyAt = event.timeStamp;
    this.setAutoEnabled(!this.auto.enabled);
  };
  private readonly handleBuildKey=(event:KeyboardEvent):void=>{
    const target=event.target as HTMLElement|null;
    if(event.repeat||this.isRunBlocked()||this.modal||this.sheetKind||target?.isContentEditable||['INPUT','TEXTAREA','SELECT'].includes(target?.tagName??''))return;
    if(/^[1-5]$/.test(event.key)){
      this.cancelGesture();this.touchMode=true;this.selectedTower=null;this.placingTowerId=TOWER_LIST[Number(event.key)-1].id;
      this.refreshPlots();this.showTouchPreview();return;
    }
    if(!this.placingTowerId)return;
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){
      event.preventDefault();
      const delta=event.key==='ArrowLeft'||event.key==='ArrowUp'?-1:1;
      const plot=((this.touchPreview?.plot??-1)+delta+this.map.buildable.length)%this.map.buildable.length;
      this.touchPreview={point:this.map.buildable[plot],plot};this.showTouchPreview();
    }else if(event.key==='Enter'&&this.touchPreview?.plot!==null&&this.touchPreview?.plot!==undefined){
      this.tryBuild(this.placingTowerId,this.touchPreview.plot);this.showTouchPreview();
    }
  };

  constructor() {
    super('Game');
  }

  init(data: Partial<GameStartData>): void {
    this.unlockRepository = sharedUnlockRepository;
    this.pauseState = new PauseState(); this.gesture.cancel();this.trayGesture.cancel();this.trayOwner=null;this.trayDrag=null;this.trayPoint=null; this.cameraView.setContentFit(null); this.cameraView.setTopHeadroom(0); this.cameraView.reset();
    this.touchPreview = null; this.touchMode = false; this.sheetKind = null; this.sheet = null;
    this.modalRenderer = null; this.modalSheet = null; this.backgroundOverlay = null; this.gestureHintShown = false;
    this.modalError = '';
    const s = loadSettings();
    this.campaign = null; this.campaignStartRejected = false; this.campaignResult = null;
    this.qaCampaignFixture = null; this.qaCampaignRepository = null;
    this.campaignCallout = null; this.campaignCalloutView = null;
    if (import.meta.env.DEV && data.mode === 'campaign' && isQACampaignFixture(data.qaCampaignFixture) && data.campaignLevel === data.qaCampaignFixture.level) {
      this.qaCampaignFixture = { ...data.qaCampaignFixture };
      this.qaCampaignRepository = createQACampaignRepository(this.qaCampaignFixture);
    }
    this.campaignBosses = new CampaignBossSystem(); this.towerFreezeViews = new Map();
    if (data.mode === 'campaign') {
      try { this.campaign = new CampaignBattle(data.campaignLevel ?? NaN, (this.qaCampaignRepository ?? campaignRepository).view(), data.campaignVisualTier); }
      catch { this.campaignStartRejected = true; }
    }
    this.map = this.campaign?.map ?? MAP1;
    this.difficultyId = this.campaign ? 'medium' : getDifficulty(data.difficulty ?? s.difficulty).id;
    this.playerName = runPlayerName(accountSystem.view().session?.nickname ?? data.playerName ?? s.playerName);
    const d = getDifficulty(this.difficultyId);
    this.gold = d.startingGold;
    this.lives = d.startingLives;
    this.maxLives = d.maxLives;
    this.speed = s.gameSpeed ?? 1;
    if (this.speed !== 1 && this.speed !== 2 && this.speed !== 3) this.speed = 1;
    // Full transient reset — replay must start clean (AI_AGENT_INSTRUCTIONS.md §39).
    this.runId = newRunId();
    this.wave = 0;
    this.wavesCompleted = 0;
    this.campaignScheduledIds.clear();
    this.campaignScheduledKills = 0;
    this.campaignMissionBossKills = 0;
    this.waveActive = false;
    this.currentWaveIsBoss = false;
    this.enemies = [];
    this.towers = [];
    this.dying = [];
    this.field = null;
    this.spawnQueue = [];
    this.floaters = [];
    this.gameTimeMs = 0;
    this.lastQAStatusAt = 0;
    this.paused = false;
    this.pausedByModal = false;
    this.enemiesKilled = 0;
    this.elitesKilled = 0;
    this.bossesKilled = 0;
    this.freezeUntil = 0;
    this.doubleBountyUntil = 0;
    this.battleCryUntil = 0;
    this.surgeUntil = 0;
    this.vault = new RelicVault();
    this.auto = new AutoSystem();
    this.autoLastUpdateAt = null;
    this.autoLastKeyAt = -Infinity;
    this.flights = [];
    this.effects = [];
    this.ended = false;
    this.refreshProgressionActions = null;
    this.siege = new SiegeSystem(); this.evolutionCombat = new EvolutionCombat(); this.runUnlocks = this.unlockRepository.snapshotForRun(); this.unlocksEarnedThisRun = []; this.debugAssisted = import.meta.env.DEV && this.qaCampaignFixture !== null;
    this.achievementNotices = []; this.notifiedAchievements = new Set(); this.achievementNoticeView = null;
    this.scheduledBossIds = new Map(); this.victoryPanel = null;
    this.selectedTower = null;
    this.placingTowerId = null;
    this.worldRoot = null;
    this.fieldMask = null;
    this.uiRoot = null;
    this.catalog = null;
    this.catalogOpen = false;
    this.selectionRing = null;
    this.ghostBase = null;
    this.ghostTowerId = '';
    this.revealTimer = null;
    this.storeAfterTarget = false;
    this.startTime = Date.now();
    this.runningDurationMs = 0; this.simulationClock.reset(); this.inSimulationTick = false;
    this.bossWarned = {};
    this.plotMarkers = [];
    this.occupied = new Set<number>();
    this.modal = null;
    this.bossBar = null;
    this.bossBarHp = null;
    this.bossBarBackdrop = null; this.bossBarTrack = null; this.bossPanelHeight = 0;
    this.bossHudReservedHeight = 0; this.bossHudCameraBeforeReservation = null; this.compactBossActive = false;
    this.bossFitBoss = null; this.bossFitMap = null;
    this.hudObjects = []; this.topControlObjects = []; this.hudMetricLabels = [];
    this.infoPanel = null;
    this.towerCommands = null;
    this.placePanel = null;
    this.powerupRow = null;
    this.rangeCircle = null;
    this.rangeBackdrop = null;
    this.fieldViews = new Map();
    this.auraCircle = null;
    this.ghost = null;
    this.ghostReason = null;
    this.hudWaveLabel = null;
    this.hudWaveValue = null;
    this.hudGoldValue = null;
    this.hudLivesValue = null;
    this.hudScoreValue = null;
    this.hudDiff = null;
    this.hudStatus = null;
    this.autoButton = null; this.pauseAutoButton = null; this.autoStatusText = null; this.autoDetailText = null;
    this.startBtn = null;
    this.startBtnLabel = null;
    this.nextPreview = null;
    this.speedBtnLabel = null;
    this.enemyLayer = null;
    this.bossBarFill = null;
    this.bossBarText = null;
  }

  create(): void {
    if (!accountEntryAllowed()) { this.scene.start('Login'); return; }
    if (this.campaignStartRejected) { this.scene.start('Campaign', { error: 'That campaign level is locked or unavailable.' }); return; }
    this.runOwner=accountSystem.captureRun();
    this.runAccount=this.runOwner?.mode==='account'?this.runOwner.account:null;
    if(this.runOwner)this.playerName=this.runOwner.name;
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (!this.ended) void accountSystem.discardBattle();
    });
    const unsubscribeAccount = accountSystem.subscribe(() => {
      if (this.campaignResult && this.ended && this.runOwner) this.renderCampaignResult();
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, unsubscribeAccount);
    const snd = SoundManager.get();
    const settings = loadSettings();
    Object.assign(snd, { masterVolume: settings.masterVolume, musicOn: settings.musicOn, sfxOn: settings.sfxOn, musicVolume: settings.musicVolume, sfxVolume: settings.sfxVolume });
    snd.applyVolumes(); snd.unlock();
    if (settings.musicOn) snd.startMusic();
    this.layout = gameLayout(this.scale.width, this.scale.height);
    this.cameraView.resize(this.layout.field);
    this.worldRoot = this.add.container(0, 0);
    this.drawMap();
    this.rangeBackdrop = this.world(this.add.circle(0, 0, 50, 0, 0).setStrokeStyle(5, 0x0a0e12, 0.6).setVisible(false).setDepth(4.99));
    this.rangeCircle = this.world(this.add.circle(0, 0, 50, RANGE_STROKE, RANGE_FILL_ALPHA)
      .setStrokeStyle(2, RANGE_STROKE, RANGE_STROKE_ALPHA).setVisible(false).setDepth(5));
    this.auraCircle = this.world(this.add.circle(0, 0, 160, 0xba68c8, 0)
      .setStrokeStyle(2, 0xba68c8, 0.85).setVisible(false).setDepth(5));
    this.selectionRing = this.world(this.add.circle(0, 0, 25, 0, 0).setStrokeStyle(2, RANGE_STROKE).setVisible(false).setDepth(6));
    this.drawShell();
    this.input.on('pointerdown', this.handlePointerDown);
    this.input.on('control:pointerdown',this.handleControlDown);
    this.input.on('pointermove', this.handlePointerMove);
    this.input.on('pointerup', this.handlePointerUp);
    this.input.on('pointerupoutside', this.cancelGesture);
    this.game.canvas.addEventListener('touchcancel', this.cancelGesture);
    this.game.canvas.addEventListener('lostpointercapture', this.captureLost);
    this.game.canvas.addEventListener('pointercancel', this.cancelGesture);
    document.addEventListener('visibilitychange', this.visibilityChanged);
    this.input.keyboard?.on('keydown-ESC', this.handleEscapeKey);
    this.input.keyboard?.on('keydown-SPACE', this.handleSpaceKey);
    this.input.keyboard?.on('keydown-P', this.handlePauseKey);
    this.input.keyboard?.on('keydown-A', this.handleAutoKey);
    this.input.keyboard?.on('keydown',this.handleBuildKey);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdownRun, this);
    if (import.meta.env.DEV) this.events.on('qa:action', this.handleQAAction, this);
    this.attachProgressionListeners();
    if (import.meta.env.DEV && this.qaCampaignFixture) this.seedQACampaignFixture();
    if(!this.qaCampaignFixture)this.time.delayedCall(0,()=>this.showGuide('placement'));
  }

  private attachProgressionListeners(): void {
    if (typeof window === 'undefined' || this.progressionListenerAttached) return;
    window.addEventListener('storage', this.handleStorage);
    this.progressionListenerAttached = true;
  }

  private world<T extends Phaser.GameObjects.GameObject>(view: T): T { this.worldRoot?.add(view); this.worldRoot?.sort('depth'); return view; }

  private applyView(): void {
    const origin = this.cameraView.origin;
    this.worldRoot?.setPosition(origin.x, origin.y).setScale(this.cameraView.scale);
    for (const enemy of this.enemies) if (enemy.alive && enemy.view) this.projectEntity(enemy.view);
    for (const death of this.dying) {
      this.projectEntity(death.view);
      const progress = Math.min(1, Math.max(0, (this.gameTimeMs - death.t0) / death.duration));
      const deathScale = 1 - progress * 0.8;
      death.view.setScale(
        (death.view.getData('baseScaleX') as number ?? 1) * deathScale,
        (death.view.getData('baseScaleY') as number ?? 1) * deathScale
      );
      death.view.setAlpha(1 - progress);
    }
    if (this.touchPreview) {
      if (this.pendingMeteor) this.rangeCircle?.setPosition(this.touchPreview.point.x, this.touchPreview.point.y).setRadius(POWERUP_EFFECTS.meteor.radius).setVisible(true);
      else this.updateGhost(this.touchPreview.point.x, this.touchPreview.point.y);
    }
  }

  private openSheet(kind: NonNullable<GameScene['sheetKind']>): void {
    if (this.modal || this.pauseState.has('background')) return;
    if (this.pendingMeteor && (kind === 'build' || kind === 'tower')) return;
    this.cancelGesture();
    if (kind === 'build') this.selectedTower = null;
    this.sheetKind = this.sheetKind === kind ? null : kind;
    this.pauseState.set('details',['tower','evolve','help','progression'].includes(this.sheetKind??''));
    this.drawSheet(); this.showTouchPreview();
  }
  private detailsPurchaseContext():PurchaseContext {
    return {...this.purchaseContext(),blocked:this.ended||this.siege.phase==='victory'||this.siege.phase==='terminal'||this.pauseState.blockedExcept('details')};
  }
  private openDetails(kind:'tower'|'evolve'|'help'|'progression'):void {this.cancelGesture();this.sheetKind=kind;this.pauseState.set('details',true);this.drawSheet();}
  private closeDetails():void {if(this.guideStep)this.guide.complete(this.guideStep);this.guideStep=null;this.sheetKind=null;this.pauseState.set('details',false);this.refreshProgressionActions=null;this.sheet?.destroy();this.sheet=null;this.refreshInfoPanel();}
  private performDetailedAction(action:()=>boolean):void {
    const kind=this.sheetKind==='evolve'?'evolve':'tower';
    this.closeDetails();
    if(this.isRunBlocked()){this.showBanner('Resume the battle before making changes.',C.gold);this.openDetails(kind);return;}
    if(!action())this.openDetails(kind);
  }

  private drawSheet(restoreOffset?: number): void {
    this.autoDetailText = null;
    const context = this.sheetKind === 'tower' || this.sheetKind === 'evolve' ? `${this.sheetKind}:${this.selectedTower?.id}` : null;
    const scrollOffset = restoreOffset ?? (context && this.sheet?.root.getData('progressionContext') === context ? this.sheet.scrollOffset : 0);
    this.refreshProgressionActions = null;
    this.sheet?.destroy(); this.sheet = null;
    if (!this.sheetKind || !this.uiRoot) return;
    const kind = this.sheetKind;
    const bounds = sheetBounds(this.layout, kind, this.touchPreview !== null);
    const title = { build: 'Build Towers', tower: 'Selected Tower', more: 'Battle Controls', relics: 'Relics', next: 'Next Wave', evolve: 'Tower Progression',help:'How to play',progression:'Progression' }[kind];
    const sheet = new ScrollSheet(this, this.uiRoot, bounds, title, () => { this.closeDetails();this.showTouchPreview(); }); this.sheet = sheet;
    sheet.root.setData('progressionContext', context);
    if(kind==='help'){
      let y=0;const topics=this.guideStep?HELP_TOPICS.filter(t=>t.id===this.guideStep):HELP_TOPICS;
      for(const t of topics){const title=sheet.text(y,t.title,C.gold,18);y+=title.height+8;const body=sheet.text(y,t.body,C.textSecondary,16);y+=body.height+20;}
      sheet.action(y,this.guideStep?'Dismiss hint':'Back to battle',()=>this.closeDetails());
      sheet.action(y+52,this.guideStep?'Skip all hints':'Replay hints',()=>{if(this.guideStep)this.guide.skip();else this.guide.replay();this.closeDetails();});
    }else if(kind==='progression'){
      sheet.pair(0,'Campaign','Classic',()=>{this.progressionTab='campaign';this.drawSheet();},()=>{this.progressionTab='classic';this.drawSheet();});
      const lines=this.progressionTab==='campaign'?campaignProgressionLines(campaignRepository.view()):progressionPanelLines(this.unlockRepository.view(),loadBest(),loadLegacyBests());
      let y=60;for(const value of lines){const t=sheet.text(y,value,C.textSecondary,16);y+=t.height+12;}
      if(this.campaign&&this.progressionTab==='campaign')for(const r of campaignRequirements(campaignRepository.view(),this.campaign.definition.level)){const t=sheet.text(y,`${r.met?'✓':'○'} ${r.label}: ${r.progress} · ${r.nextStep}`);y+=t.height+12;}
      if(!this.campaign&&this.progressionTab==='classic')for(const a of achievementViews(this.unlockRepository.view(),this.towers,this.wavesCompleted)){if(a.earned)continue;const t=sheet.text(y,`${TOWERS[a.towerId].name}: ${this.wavesCompleted>=20?`Try in a new Classic run. ${missedAchievementDetail(a.towerId,this.towers)}`:a.qualifiesNow?`On track · Wave ${this.wavesCompleted}/20`:'Build the starter branch and reach rank 2 before completing wave 20.'}`);y+=t.height+12;}
      sheet.action(y,'Back to battle',()=>this.closeDetails());
    }else if (kind === 'build') {
      let rowY = 0;
      TOWER_LIST.forEach(cfg => {
        const title = sheet.text(rowY, `${cfg.name} · ${cfg.role} · ${formatCount(cfg.levels[0].cost)} gold`, C.gold); rowY += title.height + 8;
        const choice = isTowerId(cfg.id) ? this.campaign?.choices[cfg.id] : null;
        const specialization = choice ? getCampaignSpecialization(choice) : null;
        const description = sheet.text(rowY, specialization ? `${specialization.name} · ${specialization.description}` : cfg.description, C.textSecondary, 12); rowY += description.height + 8;
        sheet.action(rowY, this.gold < cfg.levels[0].cost ? `Choose ${cfg.name} · Not enough gold` : `Choose ${cfg.name}`, () => {
          this.placingTowerId = cfg.id; this.touchPreview = null; this.sheetKind = null;
          this.drawSheet(); this.refreshPlots(); this.showTouchPreview();
        }, 'primary');
        rowY += 60;
      });
    } else if (kind === 'evolve' && this.selectedTower) {
      this.drawProgressionModel(sheet, this.selectedTower, 0);
    } else if (kind === 'tower' && this.selectedTower) {
      const t = this.selectedTower;
      let y = this.drawProgressionModel(sheet, t, 0);
      sheet.action(y, `Sell · ${formatCount(investedRefund(t.progression))} gold`, () => this.performDetailedAction(()=>this.sellSelected()), 'danger',!this.detailsPurchaseContext().blocked); y += 60;
      sheet.text(y, 'Targeting'); y += 28;
      TARGET_MODES.forEach((mode, i) => sheet.action(y + i * 52, `${t.targeting === mode ? '✓ ' : ''}${mode[0].toUpperCase() + mode.slice(1)}`, () => this.performDetailedAction(()=>{if(this.selectedTower!==t||!this.towers.includes(t))return false;t.targeting=mode;return true;}),'secondary',!this.detailsPurchaseContext().blocked));
    } else if (kind === 'more') {
      this.autoDetailText = sheet.text(0, this.autoDetail());
      const y = this.autoDetailText.height + 12;
      sheet.action(y, 'Relics', () => this.openSheet('relics'));
      sheet.action(y + 52, 'Next Wave', () => this.openSheet('next'));
      sheet.pair(y + 104, 'Zoom In', 'Zoom Out', () => this.changeZoom(1.25), () => this.changeZoom(.8));
      sheet.action(y + 156, 'Reset View', () => { this.cameraView.reset(); this.applyView(); });
      sheet.action(y+208,'Progression and requirements',()=>this.openDetails('progression'));
      sheet.action(y+260,'Help',()=>this.openDetails('help'));
      sheet.action(y+312,`Speed ${this.speed}×`,()=>{this.cycleSpeed();this.drawSheet();});
    } else if (kind === 'relics') {
      let rowY = 0;
      for (let i = 0; i < 3; i++) {
        const id = this.powerups[i], cfg = id ? POWERUPS[id] : null;
        const title = sheet.text(rowY, cfg ? `${i + 1}. ${cfg.name} · ${cfg.rarity}` : `${i + 1}. Empty slot`, C.gold); rowY += title.height + 8;
        if (cfg) { const description = sheet.text(rowY, cfg.description, C.textSecondary, 12); rowY += description.height + 8; sheet.action(rowY, 'Inspect / Use', () => this.inspectPowerup(i)); rowY += 60; }
      }
    } else if (kind === 'next') {
      const status = this.waveActive ? `Wave ${this.wave} · In battle` : this.compositionSummary(this.wave + 1, true);
      const text = sheet.text(0, status, C.gold);
      const reason = this.nextWaveReason();
      this.autoDetailText = sheet.text(text.height + 16, reason);
    }
    sheet.scrollTo(scrollOffset);
  }

  private drawProgressionModel(sheet: ScrollSheet, t: Tower, startY: number): number {
    if(this.guide.shouldShow('prerequisites')){
      this.guideStep='prerequisites';
      const hint=sheet.text(startY,'✓ means a requirement is met; ○ shows your next step. Permanent achievements and this-run conditions are separate.',C.gold,16);
      startY+=hint.height+16;
    }
    if (this.campaign) {
      const stats = t.stats;
      const specialization = t.specialization ? getCampaignSpecialization(t.specialization) : null;
      sheet.text(startY, `${t.cfg.name} · Foundation ${t.level}/4`, C.gold);
      const title = sheet.text(startY + 32, specialization ? `${specialization.name} · ${specialization.description}` : 'No specialization selected', C.textSecondary);
      const y = startY + 44 + title.height;
      const summary = sheet.text(y, `Damage ${formatStat('damage', stats.damage)} · Range ${formatStat('range', stats.range)} · Attack ${formatStat('attackInterval', stats.attackInterval)}s`);
      let actionY = y + summary.height + 16;
      const explanation=sheet.text(actionY,'Lower seconds means faster firing.',C.textSecondary,16);actionY+=explanation.height+12;
      const nextBase=previewPurchaseStats(t.towerId,t.progression,{kind:'foundation-upgrade'});
      if(!t.maxLevel&&nextBase){const next=campaignTowerStats(nextBase,t.specialization);const comparison=sheet.text(actionY,`Next: Damage ${formatStat('damage',stats.damage)} → ${formatStat('damage',next.damage)} · Range ${formatStat('range',stats.range)} → ${formatStat('range',next.range)} · Attack ${formatStat('attackInterval',stats.attackInterval)}s → ${formatStat('attackInterval',next.attackInterval)}s`);actionY+=comparison.height+12;}
      if(!t.maxLevel&&this.gold<t.upgradeCost()!){const shortage=sheet.text(actionY,`Need ${formatCount(t.upgradeCost()!-this.gold)} more gold`,C.gold,16);actionY+=shortage.height+12;}
      if (!t.maxLevel) sheet.action(actionY, `Upgrade · ${formatCount(t.upgradeCost())} gold`, () => this.performDetailedAction(()=>this.upgradeSelected()), 'primary', !this.detailsPurchaseContext().blocked && this.gold >= t.upgradeCost()!);
      else sheet.text(actionY, 'Maximum foundation · Specializations change before battle', C.textMuted);
      return actionY + 60;
    }
    const view = towerProgressionView(t, this.detailsPurchaseContext(), this.wavesCompleted, this.towers);
    const st = view.stats;
    let y = startY;
    const line = (value: string, color: string = C.textSecondary, size = 16) => { const text = sheet.text(y, value, color, size); y += text.height + 8; };
    line(view.title, C.gold);
    line(view.role, C.textSecondary, 16);
    line(`Damage ${formatStat('damage', st.damage)} · Range ${formatStat('range', st.range)} · Attack ${formatStat('attackInterval', st.attackInterval)}s · ${st.damageType}`);
    line('Lower seconds means faster firing.');
    const next = view.actions[0]?.nextStats ?? null;
    if (next) {
      line(`Next: Damage ${formatStat('damage', st.damage)} → ${formatStat('damage', next.damage)} · Attack ${formatStat('attackInterval', st.attackInterval)}s → ${formatStat('attackInterval', next.attackInterval)}s · Range ${formatStat('range', st.range)} → ${formatStat('range', next.range)}`, C.textSecondary, 12);
    } else if (view.actions.length) {
      line(`Next: ${PURCHASE_REASON_TEXT['numeric limit reached']}`, C.textMuted, 12);
    }
    if (view.commitment) line(view.commitment, C.textMuted, 12);
    if (view.branches.length) line('Base stats · Current → Evolved', C.textMuted, 12);
    const controls = view.actions.map(action => {
      if (action.intent.kind === 'evolve') {
        const branchId = action.intent.branchId;
        const branch = view.branches.find(b => b.id === branchId)!;
        line(`${branch.name}${branch.starter ? ' (starter)' : ''} — ${branch.description}`, C.textSecondary, 16);
        line(`Damage ${formatStat('damage', st.damage)} → ${formatStat('damage', branch.stats.damage)} · Attack ${formatStat('attackInterval', st.attackInterval)}s → ${formatStat('attackInterval', branch.stats.attackInterval)}s · Range ${formatStat('range', st.range)} → ${formatStat('range', branch.stats.range)}`, C.textSecondary, 12);
        if (branch.locked) line(`Locked · ${branch.requirement}${branch.qualifiesNow ? ' · On track this run' : ''}`, C.textMuted, 12);
      }
      for(const requirement of action.requirements)line(`${requirement.met?'✓':'○'} ${requirement.label} · ${requirement.progress}${requirement.met?'':` · ${requirement.nextStep}`}`,C.textSecondary,16);
      const control = sheet.action(y, action.reason ? `${action.label} · ${action.reason}` : action.label, () => {
        if (!action.reason) {
          if(action.intent.kind==='evolve'){
            this.refreshProgressionActions=null;this.sheet?.destroy();
            const confirm=new ScrollSheet(this,this.uiRoot!,sheetBounds(this.layout,'evolve',false),'Confirm evolution',()=>this.drawSheet());this.sheet=confirm;
            const text=confirm.text(0,'Branch choice is permanent for this tower. Review the benefits and requirements before committing.',C.textSecondary,16);
            confirm.action(text.height+16,`Confirm: ${action.label}`,()=>this.performDetailedAction(()=>this.purchaseSelected(action.intent,t.id,action.revision)),'primary');
            confirm.action(text.height+72,'Cancel',()=>this.drawSheet());
          }else this.performDetailedAction(()=>this.purchaseSelected(action.intent,t.id,action.revision));
        }
      }, 'primary', action.reason === null);
      y += 52;
      return { action, control };
    });
    this.refreshProgressionActions = () => {
      const context = this.detailsPurchaseContext();
      for (const { action, control } of controls) {
        const result = purchaseEvolution(t.towerId, t.progression, action.intent, context, action.revision);
        const reason = result.ok ? null : PURCHASE_REASON_TEXT[result.reason];
        if (reason === action.reason) continue;
        action.reason = reason;
        control.update(reason ? `${action.label} · ${reason}` : action.label, reason === null);
      }
    };
    return y + 8;
  }

  private inspectorPrimaryLabel(t: Tower): string {
    const p = t.progression;
    if (p.foundationLevel < 4) return `Upgrade · ${formatCount(t.upgradeCost())} gold`;
    if (this.campaign) return 'Maximum foundation';
    if (p.branchId === null || p.rank === null) return 'Evolve…';
    if (p.rank < 3) return `${EVOLUTIONS[p.branchId].name} rank ${p.rank + 1}…`;
    return 'Mastery…';
  }

  private inspectorPrimaryAction(): void {
    const t = this.selectedTower; if (!t) return;
    if (t.progression.foundationLevel < 4) { this.purchaseSelected({ kind: 'foundation-upgrade' }, t.id, t.progression.revision); return; }
    if (this.campaign) return;
    this.openDetails('evolve');
  }

  private changeZoom(factor: number): void {
    const f = this.layout.field; this.cameraView.zoomAt(this.cameraView.zoom * factor, { x: f.x + f.width / 2, y: f.y + f.height / 2 }); this.applyView();
  }

  private showTouchPreview(): void {
    this.confirmStrip?.destroy(true); this.confirmStrip = null;
    if (!this.uiRoot || (!this.placingTowerId && !this.pendingMeteor)) return;
    if (this.sheetKind) return;
    const w = Math.min(600, this.layout.width - 16);
    const c = this.add.container((this.layout.width - w) / 2, this.layout.height - this.layout.tray - 80); this.uiRoot.add(c); this.confirmStrip = c;
    panel(this, c, 0, 0, w, 76);
    const preview = this.touchPreview;
    const check = this.placingTowerId ? this.placementCheck(this.placingTowerId, preview?.plot ?? -1) : { ok: !!preview, reason: 'Tap a target' };
    const message = preview ? (check.ok ? this.pendingMeteor ? 'Meteor target ready' : `${TOWER_LIST.find(t => t.id === this.placingTowerId)?.name} · ${TOWER_LIST.find(t => t.id === this.placingTowerId)?.levels[0].cost} gold` : check.reason) : this.pendingMeteor ? 'Tap the map to preview Meteor' : 'Tap a clearing to preview';
    c.add(this.add.text(8, 4, message, style(12, check.ok ? C.gold : C.textSecondary)).setWordWrapWidth(w - 16));
    const bw = (w - 24) / 2;
    button(this, c, 8, 26, bw, this.pendingMeteor ? 'Cast' : 'Build', () => {
      if (!this.touchPreview || !check.ok || this.pauseState.blocked) return;
      const p = this.touchPreview; this.touchPreview = null;
      if (this.pendingMeteor) this.castMeteor(p.point.x, p.point.y);
      else if (this.placingTowerId && p.plot !== null) this.tryBuild(this.placingTowerId, p.plot);
      this.showTouchPreview();
    }, check.ok ? 'primary' : 'secondary');
    button(this, c, 16 + bw, 26, bw, 'Cancel', () => { this.touchPreview = null; this.onEscape(); this.showTouchPreview(); });
    if (preview) {
      if (this.pendingMeteor) this.rangeCircle?.setPosition(preview.point.x, preview.point.y).setRadius(POWERUP_EFFECTS.meteor.radius).setVisible(true);
      else this.updateGhost(preview.point.x, preview.point.y);
    }
  }

  private drawBackgroundPause(): void {
    this.backgroundOverlay?.destroy(true); this.backgroundOverlay = null;
    if (!this.pauseState.has('background')) return;
    const c = this.add.container(0, 0).setDepth(4000); this.backgroundOverlay = c;
    c.add(this.add.rectangle(0, 0, this.layout.width, this.layout.height, C.bgDeep, .9).setOrigin(0).setInteractive());
    c.add(this.add.text(this.layout.width / 2, this.layout.height / 2 - 48, 'Run paused while away', style(18, C.goldBright, true)).setOrigin(.5));
    button(this, c, this.layout.width / 2 - 120, this.layout.height / 2, 240, 'Resume', () => {
      this.pauseState.set('background', false); SoundManager.get().resume(); c.destroy(true); this.backgroundOverlay = null; this.updateHUD();
    }, 'primary');
  }

  private readonly handleResize = (): void => {
    this.cancelGesture();
    this.pauseAutoButton = null;
    this.bossHudReservedHeight = 0;
    this.bossHudCameraBeforeReservation = null;
    this.bossFitBoss = null; this.bossFitMap = null;
    this.cameraView.setContentFit(null);
    this.cameraView.setTopHeadroom(0);
    this.layout = gameLayout(this.scale.width, this.scale.height);
    this.cameraView.resize(this.layout.field);
    const render = this.modalRenderer;
    this.modalSheet?.destroy(); this.modalSheet = null;
    this.modal?.destroy(true); this.modal = null;
    this.drawShell();
    if (render) { this.rebuildingModal = true; render(); this.rebuildingModal = false; }
    this.showTouchPreview(); this.drawBackgroundPause();
  };

  private drawShell(): void {
    this.autoButton = null; this.autoStatusText = null; this.autoDetailText = null;
    const scrollOffset = this.sheetKind ? this.sheet?.scrollOffset ?? 0 : 0;
    this.refreshProgressionActions = null;
    this.sheet?.destroy(); this.sheet = null;
    this.achievementNoticeView?.destroy(); this.achievementNoticeView = null;
    this.campaignCalloutView?.destroy(); this.campaignCalloutView = null;
    this.uiRoot?.destroy(true);
    this.hudObjects = []; this.topControlObjects = []; this.hudMetricLabels = [];
    this.uiRoot = this.add.container(0, 0).setDepth(1000);
    this.bottomCommandObjects = [];
    this.nextPreview = null; this.confirmStrip = null;
    this.floaters = [];
    this.infoPanel = null; this.towerCommands = null; this.placePanel = null; this.powerupRow = null; this.catalog = null;
    this.bossBar = null; this.bossBarHp = null; this.bossBarText = null; this.bossBarFill = null;
    this.bossBarBackdrop = null; this.bossBarTrack = null; this.bossPanelHeight = 0;
    this.bossBarTextWrapWidth = 0;
    const f = this.layout.field;
    this.applyView();
    if (this.worldRoot) {
      if (!this.fieldMask) this.fieldMask = new ViewportMaskController(this, this.worldRoot, f);
      else this.fieldMask.refresh(f);
    }
    for (const view of [...this.towers.map(t => t.view), ...this.enemies.map(e => e.view), this.ghost]) if (view) this.projectEntity(view);
    this.drawHUD(); this.drawTowerPanel(); this.drawControls(); this.drawPowerupBar(); this.drawBossBar();
    this.refreshInfoPanel(); this.refreshPlacePanel(); this.updateNextPreview(); this.updateHUD();
    this.drawSheet(scrollOffset); this.showTouchPreview();
    if (this.campaignResult) this.renderCampaignResult();
    else if (this.siege.phase === 'victory') this.renderVictory();
    this.drawAchievementNotice();
    this.drawCampaignCallout();
  }

  private shutdownRun(): void {
    this.autoButton = null; this.pauseAutoButton = null; this.autoStatusText = null; this.autoDetailText = null;
    this.refreshProgressionActions = null;
    this.sheet?.destroy(); this.sheet = null; this.modalSheet?.destroy(); this.modalSheet = null;
    document.removeEventListener('visibilitychange', this.visibilityChanged);
    this.game.canvas.removeEventListener('touchcancel', this.cancelGesture);
    this.game.canvas.removeEventListener('lostpointercapture', this.captureLost);
    this.game.canvas.removeEventListener('pointercancel', this.cancelGesture);
    this.cancelGesture(); this.touchPreview = null; this.modalRenderer = null;
    this.ended = true;
    this.cleanupProgression();
    this.detachInputListeners();
    this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    if (import.meta.env.DEV) this.events.off('qa:action', this.handleQAAction, this);
    this.time.removeAllEvents(); this.tweens.killAll();
    this.revealTimer?.remove(false); this.revealTimer = null;
    for (const flight of this.flights) flight.view.destroy(true);
    for (const effect of this.effects) effect.view.destroy();
    this.flights = []; this.effects = []; this.spawnQueue = [];
    this.vault = new RelicVault();
    this.modal?.destroy(true); this.modal = null;
    this.fieldMask?.destroy(); this.fieldMask = null;
    this.worldRoot?.destroy(true); this.worldRoot = null;
    this.ghostReason?.destroy(); this.ghostReason = null;
    this.uiRoot?.destroy(true); this.uiRoot = null;
  }

  private projectEntity(view: Phaser.GameObjects.Container): void {
    const sx = Math.min(this.layout.field.width / 1040, this.layout.field.height / 584); const sy = sx;
    const visual = view.getData('enemyVisual') as EnemyView | undefined;
    const deathScreenScale = view.getData('deathScreenScale') as number | undefined;
    if(visual && typeof deathScreenScale==='number'){
      const scale=deathScreenScale/this.cameraView.fitScale;
      view.setScale(scale,scale).setData({baseScaleX:scale,baseScaleY:scale});return;
    }
    const canvas=this.game?.canvas?.getBoundingClientRect?.(),cssScale=canvas?canvas.width/Math.max(1,this.layout.width):1;
    const authoredDimension=visual?(view.getData('authoredEnemyDimension') as number|undefined)??enemyVisibleDimension(visual):1;
    const presentation=enemyPresentation({viewportWidth:canvas?.width??this.layout.width,viewportHeight:canvas?.height??this.layout.height,fieldHeight:this.layout.field.height*cssScale,authoredDimension:(visual?.maxVisualDimension??authoredDimension)*cssScale,isBoss:view.getData('isBoss')===true,isElite:view.getData('isElite')===true,fitScale:this.cameraView.fitScale});
    const displayedScale=visual?presentation.overviewDimension/(authoredDimension*cssScale*this.cameraView.fitScale):Math.min(sx,sy)*(this.layout.compact?1.25:1)/sx;
    view.setScale(displayedScale,displayedScale);
    if(visual)view.setData({authoredEnemyDimension:authoredDimension,bossResponsiveCap:presentation.overviewDimension/(authoredDimension*cssScale)});
    view.setData({ baseScaleX: displayedScale, baseScaleY: displayedScale });
  }

  private enemyRenderPoint(enemy: Enemy): { x: number; y: number } {
    const a = this.map.waypoints[Math.max(0, enemy.waypointIndex - 1)];
    const b = this.map.waypoints[Math.min(this.map.waypoints.length - 1, enemy.waypointIndex)];
    const length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const dx = (b.x - a.x) / length; const dy = (b.y - a.y) / length;
    // Stable visual ranks only: the simulation continues on its exact centerline.
    const lane = (enemy.id % 3 - 1) * 12;
    const stagger = ((enemy.id * 7) % 5 - 2) * 4;
    return { x: enemy.x + dx * stagger - dy * lane, y: enemy.y + dy * stagger + dx * lane };
  }

  private enemyImpactPoint(enemy: Enemy): { x: number; y: number } {
    const point = this.enemyRenderPoint(enemy);
    const visualHeight = (enemy.view?.getData('enemyVisual') as { maxVisualDimension?: number } | undefined)?.maxVisualDimension ?? enemy.radius * 2;
    return { x: point.x, y: point.y - visualHeight * 0.4 * (enemy.view?.scaleY ?? 1) };
  }

  private detachInputListeners(): void {
    this.input.off('pointerup', this.handlePointerUp); this.input.off('pointerupoutside', this.cancelGesture);
    this.input.off('pointerdown', this.handlePointerDown);
    this.input.off('control:pointerdown',this.handleControlDown);
    this.input.keyboard?.off('keydown',this.handleBuildKey);
    this.input.off('pointermove', this.handlePointerMove);
    this.input.keyboard?.off('keydown-ESC', this.handleEscapeKey);
    this.input.keyboard?.off('keydown-SPACE', this.handleSpaceKey);
    this.input.keyboard?.off('keydown-P', this.handlePauseKey);
    this.input.keyboard?.off('keydown-A', this.handleAutoKey);
  }

  private handleQAAction(action: QAAction): void {
    if (!import.meta.env.DEV) return;
    if (action.type === 'campaign-fixture') {
      if (!isQACampaignFixture(action.fixture)) return;
      this.scene.start('Preload', { stage: 'gameplay', destination: 'Game', data: { difficulty: 'medium', playerName: this.playerName, mode: 'campaign', campaignLevel: action.fixture.level, qaCampaignFixture: action.fixture } } satisfies LoadingRequest);
      return;
    }
    if (action.type === 'seed' || action.type === 'grant-powerup') this.debugAssisted = true;
    if (action.type === 'seed') {
      if (['normal', 'heavy', 'boss'].includes(action.state)) {
        this.gold = 10000;
        TOWER_LIST.forEach((cfg, i) => {
          this.tryBuild(cfg.id, [0, 2, 3, 4, 6][i] ?? i);
          if (action.state !== 'normal') { this.upgradeSelected(); this.upgradeSelected(); }
        });
        this.selectedTower = null; this.refreshInfoPanel();
        this.gold = action.state === 'normal' ? 420 : 1200;
      }
      switch (action.state) {
        case 'normal':
          this.wave = 7; this.wavesCompleted = 7; this.siege.seedForQA(7, 0); this.startNextWave();
          break;
        case 'heavy':
          this.wave = 24; this.wavesCompleted = 24; this.siege.seedForQA(24, 1 | 2);
          this.startNextWave();
          break;
        case 'placement': {
          this.placingTowerId = 'longbow';
          this.refreshPlots();
          this.refreshPlacePanel();
          const plot = this.map.buildable[0];
          if (plot) this.updateGhost(plot.x, plot.y);
          break;
        }
        case 'selected':
          this.tryBuild('longbow', 0);
          break;
        case 'reward':
          this.grantPowerup('meteor_strike', 'QA fixture', true);
          break;
        case 'boss':
          this.wave = 9; this.wavesCompleted = 9; this.siege.seedForQA(9, 0);
          this.startNextWave();
          break;
        case 'evolution':
          this.gold = 10000;
          this.tryBuild('longbow', 0);
          this.upgradeSelected(); this.upgradeSelected(); this.upgradeSelected();
          this.wave = 10; this.wavesCompleted = 10; this.siege.seedForQA(10, 1);
          this.gold = 2000;
          this.refreshInfoPanel();
          this.updateHUD();
          break;
        case 'victory':
          this.wave = 30; this.wavesCompleted = 30; this.siege.seedForQA(30, 7, 'victory');
          this.vault.stored = ['meteor_strike', 'treasure_goblin', 'emergency_repair'];
          this.vault.offer('battle_cry', 'QA fixture', true);
          this.enterVictory();
          break;
        case 'mastery': {
          this.gold = 10000;
          this.tryBuild('longbow', 0);
          this.upgradeSelected(); this.upgradeSelected(); this.upgradeSelected();
          const tower = this.towers[this.towers.length - 1];
          // Explicit debug fixture state: a rank-3 Marksman with its full recorded investment.
          if (tower) tower.progression = { ...tower.progression, branchId: 'marksman', rank: 3, invested: towerTotalInvested('longbow', 4) + EVOLUTIONS.marksman.stats.reduce((sum, rank) => sum + rank.cost, 0) };
          this.wave = 30; this.wavesCompleted = 30; this.siege.seedForQA(30, 7, 'endless');
          this.gold = 50000;
          this.updateHUD();
          break;
        }
      }
    } else if (action.type === 'toggle-pause') {
      if (this.qaCampaignFixture && this.paused && !this.modal) { this.paused = false; this.updateHUD(); }
      else this.togglePauseMenu();
    } else if (action.type === 'cycle-speed') {
      this.cycleSpeed();
    } else if (action.type === 'grant-powerup') {
      this.grantPowerup(action.id, 'QA fixture', false);
    } else if (action.type === 'start-wave') {
      this.startNextWave();
    } else if (action.type === 'restart') {
      this.restartRun();
      return;
    }
    this.publishQAStatus();
  }

  private seedQACampaignFixture(): void {
    if (!import.meta.env.DEV || !this.qaCampaignFixture || !this.campaign) return;
    const fixture = this.qaCampaignFixture;
    this.debugAssisted = true; this.speed = 1; this.gold = 10000;
    // Cosmetic comparisons use lower legal plots so the full tower silhouette is visible.
    const plots = this.map.buildable.map((point, index) => ({ point, index })).filter(({ point }) => !fixture.visualTier || point.y >= 210);
    TOWER_LIST.forEach((cfg, index) => {
      this.tryBuild(cfg.id, plots[index].index);
      this.upgradeSelected();
      if (fixture.state !== 'campaign') this.upgradeSelected();
    });
    this.selectedTower = null; this.placingTowerId = null; this.gold = 1200;
    if (fixture.state === 'campaign') {
      this.auto.setEnabled(true);
      this.startNextWave();
      for (let step = 0; step < 300 && !this.ended; step++) this.simulateTick(SIMULATION_STEP_MS);
      this.auto.reset(); this.vault = new RelicVault(); this.drawPowerupBar();
    } else {
      const finalWave = this.campaign.waveCount;
      this.wave = finalWave; this.wavesCompleted = finalWave - 1;
      this.siege.seedForQA(finalWave - 1, 0); this.siege.startWave(finalWave);
      this.waveActive = true; this.currentWaveIsBoss = !!this.campaign.definition.bossEnemyId;
      if (fixture.state === 'campaign-results') {
        const metadata = campaignScoreMetadata(this.campaign.definition.level);
        this.enemiesKilled = metadata.scheduledEnemyCount;
        this.campaignScheduledKills = metadata.scheduledEnemyCount;
        this.wavesCompleted = metadata.waveCount - 1;
        this.bossesKilled = Number(metadata.hasBoss);
        this.campaignMissionBossKills = Number(metadata.hasBoss);
        this.campaign.bossKilled = this.currentWaveIsBoss;
        this.checkWaveClear();
      } else {
        const boss = this.spawnEnemy(this.campaign.definition.bossEnemyId!, 1);
        const index = Math.min(3, this.map.waypoints.length - 2);
        boss.x = this.map.waypoints[index].x; boss.y = this.map.waypoints[index].y; boss.waypointIndex = index + 1;
        boss.distanceTraveled = this.map.waypoints.slice(1, index + 1).reduce((sum, point, i) => sum + Math.hypot(point.x - this.map.waypoints[i].x, point.y - this.map.waypoints[i].y), 0);
        const fixtureLabel = (CAMPAIGN_BOSS_PHASE_LABELS as readonly string[]).includes(String(fixture.bossPhase)) ? String(fixture.bossPhase) as CampaignBossPhaseLabel : null;
        if (fixtureLabel) this.seedNamedCampaignBossFixture(boss, fixtureLabel);
        else {
          if (fixture.bossPhase === 'enraged' || fixture.bossPhase === 'core') boss.hp = boss.maxHp * 0.24;
          if (fixture.bossPhase === 'broken') boss.hp = boss.maxHp * 0.6;
          if (fixture.bossPhase === 'phase2') boss.hp = boss.maxHp * 0.4;
          this.gameTimeMs = fixture.level === 10 && fixture.bossPhase !== 'guarded' ? CAMPAIGN_BOSS_TUNING.shieldDurationMs : ['telegraph','freeze','phase2'].includes(fixture.bossPhase) ? CAMPAIGN_BOSS_TUNING.freezeIntervalMs : 0;
          this.tickCampaignBosses();
          if (fixture.bossPhase === 'freeze') { this.gameTimeMs += CAMPAIGN_BOSS_TUNING.freezeTelegraphMs; this.tickCampaignBosses(); }
        }
      }
    }
    this.refreshInfoPanel(); this.refreshPlots(); this.updateNextPreview();
    if (!this.ended) { this.renderFrame(0); this.paused = true; }
    this.updateHUD(); this.publishQAStatus();
  }

  private seedNamedCampaignBossFixture(boss: Enemy, phaseLabel: CampaignBossPhaseLabel): void {
    const tickAt = (timeMs: number): void => { this.gameTimeMs = timeMs; this.tickCampaignBosses(); };
    switch (phaseLabel) {
      case 'oracle_physical': tickAt(0); return;
      case 'oracle_arcane': tickAt(0); tickAt(CAMPAIGN_BOSS_TUNING.oracleResistanceIntervalMs); return;
      case 'oracle_elemental':
        tickAt(0);
        tickAt(CAMPAIGN_BOSS_TUNING.oracleResistanceIntervalMs);
        tickAt(CAMPAIGN_BOSS_TUNING.oracleResistanceIntervalMs + CAMPAIGN_BOSS_TUNING.bossTransitionTelegraphMs);
        tickAt(CAMPAIGN_BOSS_TUNING.oracleResistanceIntervalMs * 2 + CAMPAIGN_BOSS_TUNING.bossTransitionTelegraphMs); return;
      case 'tyrant_plates': boss.hp = boss.maxHp * 0.8; tickAt(0); return;
      case 'tyrant_break': boss.hp = boss.maxHp * 0.6; tickAt(0); return;
      case 'tyrant_core': boss.hp = boss.maxHp * 0.25; tickAt(0); tickAt(CAMPAIGN_BOSS_TUNING.bossTransitionTelegraphMs); return;
      case 'storm_surge': {
        const ally = this.spawnEnemy('cloud_skitter', 1);
        ally.x = boss.x - 40; ally.y = boss.y;
        tickAt(CAMPAIGN_BOSS_TUNING.stormmawIntervalMs); return;
      }
      case 'regent_decoys': boss.hp = boss.maxHp * 0.6; tickAt(0); return;
      case 'sovereign_portal': tickAt(CAMPAIGN_BOSS_TUNING.sovereignIntervalMs); return;
      case 'devourer_normal': boss.hp = boss.maxHp * 0.8; tickAt(0); return;
      case 'devourer_resistance': boss.hp = boss.maxHp * 0.6; tickAt(0); return;
      case 'devourer_rift':
        boss.hp = boss.maxHp * 0.4; tickAt(0); tickAt(CAMPAIGN_BOSS_TUNING.devourerPortalIntervalMs); return;
      case 'devourer_core': boss.hp = boss.maxHp * 0.19; tickAt(0); return;
      case 'aether_shield': this.seedNamedSupportFixture('aetherbound', 'tideborn', CAMPAIGN_BOSS_TUNING.aetherboundIntervalMs, tickAt); return;
      case 'foundry_armor': this.seedNamedSupportFixture('foundry_core', 'scrapling', CAMPAIGN_BOSS_TUNING.foundryCoreIntervalMs, tickAt); return;
      case 'tempest_haste': this.seedNamedSupportFixture('tempest_herald', 'galeclaw', CAMPAIGN_BOSS_TUNING.tempestHeraldIntervalMs, tickAt); return;
      case 'echo_decoys': this.seedNamedSupportFixture('echo_shade', null, CAMPAIGN_BOSS_TUNING.echoShadeIntervalMs, tickAt); return;
      case 'rift_jump': this.seedNamedSupportFixture('rift_weaver', null, CAMPAIGN_BOSS_TUNING.riftWeaverIntervalMs, tickAt); return;
      case 'crown_ward': this.seedNamedSupportFixture('crown_archon', 'aetherborn', CAMPAIGN_BOSS_TUNING.crownArchonIntervalMs, tickAt); return;
    }
  }

  private seedNamedSupportFixture(supportId: string, allyId: string | null, intervalMs: number, tickAt: (timeMs: number) => void): void {
    const position = this.map.waypoints[Math.min(3, this.map.waypoints.length - 1)];
    const support = this.spawnEnemy(supportId, 1);
    support.x = position.x; support.y = position.y;
    if (allyId) {
      const ally = this.spawnEnemy(allyId, 1);
      ally.x = position.x + 36; ally.y = position.y;
    }
    tickAt(intervalMs);
  }

  private publishQAStatus(): void {
    if (!import.meta.env.DEV) return;
    const labelGeometry = (view: Phaser.GameObjects.Text) => { const { x, y, width, height } = view.getBounds(); return { text: view.text, bounds: { x, y, width, height } }; };
    const status: QAStatus = {
      enemyVisuals:this.enemies.filter(e=>e.alive&&e.view?.getData('enemyVisual')).map(e=>{const dimension=(e.view!.getData('authoredEnemyDimension') as number??1)*(e.view!.getData('baseScaleX') as number??1)*this.cameraView.fitScale*((this.game?.canvas?.getBoundingClientRect?.().width??this.layout.width)/this.layout.width);return {archetype:e.campaignId??e.archetype,boss:e.isBoss,elite:e.isElite,overviewDimension:dimension,screenDimension:dimension*this.cameraView.zoom,zoom:this.cameraView.zoom};}),
      wave: this.wave,
      gold: this.gold,
      lives: this.lives,
      speed: this.speed,
      paused: this.paused || this.pausedByModal,
      autoEnabled: this.auto.enabled,
      autoRemainingMs: this.auto.remainingMs,
      waveActive: this.waveActive,
      towers: this.towers.length,
      enemies: this.enemies.filter((enemy) => enemy.alive).length,
      powerups: this.powerups.length,
      projectiles: this.flights.length,
      pendingRewards: this.vault.pending.length,
      effects: this.effects.length,
      spawnEvents: this.spawnQueue.length,
      dying: this.dying.length,
      boss: this.enemies.some(e => e.alive && e.isBoss),
      target: this.pendingMeteor,
      gameTimeMs: Math.round(this.gameTimeMs),
      activeBuffs: [this.freezeUntil, this.doubleBountyUntil, this.battleCryUntil, this.surgeUntil, ...this.towers.map(t => t.overchargeUntil)].filter(until => until > this.gameTimeMs).length,
      inputListeners: this.input.listenerCount('pointerdown') + this.input.listenerCount('pointermove') + ['keydown-ESC', 'keydown-SPACE', 'keydown-P', 'keydown-A'].reduce((n, event) => n + (this.input.keyboard?.listenerCount(event) ?? 0), 0),
      timers: this.revealTimer?.getRemaining() ? 1 : 0,
      tweens: this.tweens.getTweens().length,
      selected: !!this.selectedTower,
      placing: !!this.placingTowerId,
      modal: !!this.modal,
      runId: this.runId,
      phase: this.siege.phase,
      wavesCompleted: this.siege.wavesCompleted,
      fields: this.evolutionCombat.activeFieldCount,
      debugAssisted: this.debugAssisted,
      unsavedUnlocks: [...this.unlockRepository.view().unsaved],
      progression: this.towers.map((t) => ({ towerId: t.towerId, branchId: t.progression.branchId, rank: t.progression.rank, masteryRank: t.progression.masteryRank, invested: t.progression.invested, visualTier: this.towerVisualTier })),
      campaignLevel: this.campaign?.definition.level ?? null,
      campaignFixture: this.qaCampaignFixture ? `${this.qaCampaignFixture.state}/${this.qaCampaignFixture.bossPhase} · DEV FIXTURE · unsaved` : null,
      campaignBoss: (() => {
        const supportFixtures: Partial<Record<CampaignBossPhaseLabel, string>> = {
          aether_shield: 'aetherbound', foundry_armor: 'foundry_core', tempest_haste: 'tempest_herald',
          echo_decoys: 'echo_shade', rift_jump: 'rift_weaver', crown_ward: 'crown_archon'
        };
        const fixtureLabel = this.qaCampaignFixture?.bossPhase as CampaignBossPhaseLabel | undefined;
        const fixtureSupportId = fixtureLabel ? supportFixtures[fixtureLabel] : undefined;
        const subject = fixtureSupportId
          ? this.enemies.find(e => e.alive && e.campaignId === fixtureSupportId)
          : this.enemies.find(e => e.alive && e.isBoss && e.campaignId);
        return subject ? { id: subject.campaignId!, ...this.campaignBosses.presentation(subject.id, this.gameTimeMs), targets: this.campaignBosses.telegraphTargets() } : null;
      })(),
      campaignOutcome: this.campaignResult?.outcome ?? null,
      campaignBossLabels: this.campaign && this.bossBarText && this.bossBarHp ? { name: labelGeometry(this.bossBarText), status: labelGeometry(this.bossBarHp) } : null,
      campaignCallout: this.campaignCallout && this.campaignCalloutView ? { ...this.campaignCallout, bounds: (() => { const { x, y, width, height } = this.campaignCalloutView!.getBounds(); return { x, y, width, height }; })() } : null
    };
    this.events.emit('qa:status', status);
  }

  private onEscape(): void {
    if(this.pauseState.has('details')){this.closeDetails();return;}
    const wasPlacing=this.placingTowerId;this.cancelGesture();
    if (this.modal) { if (this.modal.getData('pauseMenu') === true) this.togglePauseMenu(); return; }
    if (this.pendingMeteor) { this.vault.cancelTarget(); this.storeAfterTarget = false; this.hideGhost(); this.showTouchPreview(); this.presentReward(); this.updateHUD(); }
    else if (wasPlacing) { this.refreshPlots(); this.refreshPlacePanel(); this.drawCatalog(); }
    else if (this.selectedTower) { this.selectedTower = null; this.refreshInfoPanel(); }
    else { this.catalogOpen = false; this.drawCatalog(); }
  }

  // ---------- map (painted battlefield, ART_BIBLE.md §38-46) ----------
  private drawMap(): void {
    const before = new Set(this.children.list);
    this.field = paintBattlefield(this, this.map, this.campaign?.definition.worldId);
    this.worldRoot?.add(this.children.list.filter(view => !before.has(view) && !view.parentContainer));
    this.plotMarkers = this.map.buildable.map((p, i) => this.world(this.add.circle(p.x, p.y, BUILD_PLOT_POLICY.radius, 0, 0)
      .setStrokeStyle(BUILD_PLOT_POLICY.strokeWidth, 0x63c77c, 0).setDepth(2).setData('plot', i)));
    this.refreshPlots();
    this.enemyLayer = null;
  }

  private nearestPlot(x: number, y: number): { index: number; x: number; y: number } | null {
    let best: { index: number; x: number; y: number } | null = null;
    let bestD = 26 * 26;
    this.map.buildable.forEach((p, i) => {
      const dx = p.x - x; const dy = p.y - y;
      const d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = { index: i, x: p.x, y: p.y }; }
    });
    return best;
  }

  private towerAt(x: number, y: number): Tower | null {
    for (const t of this.towers) {
      const dx = t.x - x; const dy = t.y - y;
      const bounds = t.view?.getData('displayBounds') as { left: number; top: number; width: number; height: number } | undefined;
      if (bounds && t.view && x >= t.x + bounds.left * t.view.scaleX && x <= t.x + (bounds.left + bounds.width) * t.view.scaleX &&
        y >= t.y + bounds.top * t.view.scaleY && y <= t.y + (bounds.top + bounds.height) * t.view.scaleY) return t;
      if (dx * dx + dy * dy < 24 * 24) return t;
    }
    return null;
  }

  private placementCheck(towerId: string, plotIndex: number): { ok: boolean; reason: string } {
    const cfg = TOWER_LIST.find((t) => t.id === towerId);
    if (!cfg) return { ok: false, reason: 'Unknown tower' };
    if (plotIndex < 0 || plotIndex >= this.map.buildable.length) return { ok: false, reason: 'Outside build zone' };
    if (this.occupied.has(plotIndex)) return { ok: false, reason: 'Occupied' };
    if (!canAfford(this.gold, cfg.levels[0].cost)) return { ok: false, reason: 'Not enough gold' };
    return { ok: true, reason: '' };
  }

  private refreshPlots(): void {
    this.plotMarkers.forEach((marker, index) => {
      const placing = this.placingTowerId !== null;
      const valid = placing && this.placementCheck(this.placingTowerId!, index).ok;
      const color = placing ? (valid ? 0x8ee6a0 : 0xff8078) : 0xe8c879;
      marker.setVisible(placing || !this.occupied.has(index)).setFillStyle(0x0a0e12, 0.35)
        .setStrokeStyle(placing ? BUILD_PLOT_POLICY.strokeWidth : BUILD_PLOT_POLICY.idleStrokeWidth, color, placing ? 1 : 0.85);
    });
  }

  // ---------- placement ghost (follows cursor/touch anchor) ----------
  private updateGhost(x: number, y: number): void {
    if (!this.placingTowerId || this.modal || x < 0 || x > 1040 || y < 56 || y > 640) { this.hideGhost(); return; }
    const cfg = TOWER_LIST.find(t => t.id === this.placingTowerId);
    if (!cfg || !isTowerId(cfg.id)) return;
    const stats = campaignTowerStats(effectiveStats(cfg.id, initialEvolution(cfg.id)), this.campaign?.choices[cfg.id] ?? null);
    const dragIndex=this.trayDrag?this.cameraView.nearest(this.map.buildable,this.trayDrag.anchor,28):-1;
    const plot = this.trayDrag ? (dragIndex>=0?{index:dragIndex,...this.map.buildable[dragIndex]}:null) : this.nearestPlot(x, y);
    const gx = plot?.x ?? x; const gy = plot?.y ?? y;
    const check = plot ? this.placementCheck(cfg.id, plot.index) : { ok: false, reason: this.onRoute(x, y) ? 'Path blocked' : 'Outside build zone' };
    if (!this.ghost || this.ghostTowerId !== cfg.id) {
      this.ghost?.destroy(true);
      this.ghost = this.world(buildTowerVisual(this, cfg.id, 1, this.towerVisualTier).view).setDepth(7);
      this.projectEntity(this.ghost);
      this.ghostTowerId = cfg.id;
    }
    if (!this.ghostBase) this.ghostBase = this.world(this.add.ellipse(0, 0, 56, 32, 0, 0).setDepth(6));
    if (!this.ghostReason) this.ghostReason = this.add.text(0, 0, '', { ...style(14, C.textPrimary, true), backgroundColor: '#121920', padding: { x: 8, y: 4 } }).setOrigin(0.5).setDepth(1500);
    this.ghost.setPosition(gx, gy).setAlpha(check.ok ? 0.7 : 0.55).setVisible(true);
    this.ghostBase.setPosition(gx, gy).setFillStyle(check.ok ? 0x63c77c : 0xd85f59, 0.18).setStrokeStyle(2, check.ok ? 0x63c77c : 0xd85f59).setVisible(true);
    const labelPoint = this.cameraView.project({ x: gx, y: gy < 150 ? gy + 40 : gy - 116 });
    this.ghostReason.setPosition(Math.max(100, Math.min(this.layout.field.width - 100, labelPoint.x)), Math.max(120, labelPoint.y)).setVisible(true)
      .setText(`${check.ok ? 'Valid' : check.reason} · ${formatCount(cfg.levels[0].cost)} gold`).setColor(check.ok ? C.health : C.dangerBright);
    this.rangeCircle?.setPosition(gx, gy).setRadius(stats.range).setVisible(true)
      .setStrokeStyle(2, check.ok ? 0x63c77c : 0xd85f59, 0.8);
    this.rangeBackdrop?.setPosition(gx, gy).setRadius(stats.range).setVisible(true);
  }

  private onRoute(x: number, y: number): boolean {
    return this.map.waypoints.slice(1).some((b, i) => {
      const a = this.map.waypoints[i]; const dx = b.x - a.x; const dy = b.y - a.y;
      const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy || 1)));
      return Math.hypot(x - a.x - t * dx, y - a.y - t * dy) < 22;
    });
  }

  private hideGhost(): void {
    this.ghost?.setVisible(false); this.ghostBase?.setVisible(false); this.ghostReason?.setVisible(false);
    const t = this.selectedTower;
    this.rangeCircle?.setVisible(t !== null);
    this.rangeBackdrop?.setVisible(t !== null);
    this.selectionRing?.setVisible(t !== null);
    if (t) {
      this.rangeCircle?.setPosition(t.x, t.y).setRadius(t.stats.range).setStrokeStyle(2, RANGE_STROKE, RANGE_STROKE_ALPHA);
      this.rangeBackdrop?.setPosition(t.x, t.y).setRadius(t.stats.range);
      this.selectionRing?.setPosition(t.x, t.y);
    }
  }

  // ---------- HUD (icon + label-over-value metrics, DS §19-22, ref 03) ----------
  private hudMetric(x: number, icon: string, label: string, valueSize: number, valueColor: string): Phaser.GameObjects.Text {
    this.uiRoot!.add(this.add.image(x + 12, 30, icon).setDisplaySize(22, 22));
    this.uiRoot!.add(this.add.text(x + 32, 6, label, style(12, C.textSecondary, true)));
    const value = this.add.text(x + 32, 24, '—', style(valueSize, valueColor, true));
    this.uiRoot!.add(value); return value;
  }

  private drawHUD(): void {
    this.hudObjects.forEach(object => object.destroy());
    this.hudObjects = []; this.hudMetricLabels = [];
    const firstObject = this.uiRoot!.list.length;
    const remember = (): void => { this.hudObjects = this.uiRoot!.list.slice(firstObject); };
    const w = this.layout.width;
    const scoreCaption = this.campaign ? 'COMBAT SCORE' : 'SCORE';
    if(this.layout.compact&&!this.layout.stackedHud){
      panel(this,this.uiRoot!,0,0,w,this.layout.hud);
      const cell=(w-this.layout.safe.left-this.layout.safe.right-268)/4;
      const metric=(i:number,label:string,color:string,size=12)=>{
        const caption=this.add.text(this.layout.safe.left+8+i*cell,this.layout.safe.top+4,label,style(size,C.textSecondary,true));
        this.hudMetricLabels.push(caption);this.uiRoot!.add(caption);
        const t=this.add.text(caption.x,this.layout.safe.top+24,'',style(16,color,true));this.uiRoot!.add(t);return t;
      };
      this.hudWaveValue=metric(0,'WAVE',C.textPrimary);this.hudGoldValue=metric(1,'GOLD',C.gold);
      this.hudLivesValue=metric(2,'LIVES',C.textPrimary);this.hudScoreValue=metric(3,scoreCaption,C.textPrimary,this.campaign?10:12);
      this.hudWaveLabel=null;this.hudDiff=this.add.text(0,0,'',style(14,C.textSecondary)).setVisible(false);
      this.autoStatusText=null;this.hudStatus=this.add.text(8,this.layout.hud+4,'',style(14,C.gold)).setWordWrapWidth(w-16);
      this.uiRoot!.add([this.hudDiff,this.hudStatus]);remember();return;
    }
    if (this.layout.stackedHud) {
      panel(this, this.uiRoot!, 0, 0, w, this.layout.hud);
      const cell = (w - this.layout.safe.left - this.layout.safe.right - 16) / 4;
      const metric = (i: number, label: string, color: string, size = 12) => {
        const caption=this.add.text(this.layout.safe.left+8+cell*i,this.layout.safe.top+6,label,style(size,C.textSecondary,true));
        this.hudMetricLabels.push(caption); this.uiRoot!.add(caption);
        const value = this.add.text(caption.x,this.layout.safe.top+24,'',style(16,color,true)); this.uiRoot!.add(value); return value;
      };
      this.hudWaveValue = metric(0,'WAVE',C.textPrimary); this.hudWaveLabel = this.hudMetricLabels[0];
      this.hudGoldValue = metric(1, 'GOLD', C.gold); this.hudLivesValue = metric(2, 'LIVES', C.textPrimary); this.hudScoreValue = metric(3, scoreCaption, C.textPrimary, this.campaign ? 10 : 12);
      this.hudDiff = this.add.text(8, 62, '', style(14, C.textSecondary, true)).setVisible(false); this.uiRoot!.add(this.hudDiff);
      this.autoStatusText = null;
      this.hudStatus = this.add.text(8, this.layout.hud + 4, '', style(12, C.gold)).setWordWrapWidth(w - 16); this.uiRoot!.add(this.hudStatus);
      remember(); return;
    }
    panel(this, this.uiRoot!, 0, 0, w, 56);
    const brand = w >= 1180;
    const offset = brand ? 216 : 8;
    if (brand) {
      this.uiRoot!.add(this.add.image(32, 28, emblemKey()).setDisplaySize(40, 40));
      this.uiRoot!.add(this.add.text(60, 8, 'Aegis of the\nBorderkeep', style(16, C.goldBright, true, FONT_DISPLAY)));
    }
    const step = Math.max(80, Math.min(144, (w - offset - 352) / 5));
    this.hudWaveValue = this.hudMetric(offset, 'hud_wave', 'WAVE', 22, C.textPrimary);
    this.hudWaveLabel = this.uiRoot!.list[this.uiRoot!.list.length - 2] as Phaser.GameObjects.Text;
    this.hudGoldValue = this.hudMetric(offset + step, 'hud_gold', 'GOLD', 18, C.gold);
    this.hudLivesValue = this.hudMetric(offset + step * 2, 'hud_lives', 'LIVES', 18, C.textPrimary);
    this.hudScoreValue = this.hudMetric(offset + step * 3, 'hud_score', scoreCaption, 18, C.textPrimary);
    this.uiRoot!.add(this.add.text(offset + step * 4, 6, 'DIFFICULTY', style(12, C.textSecondary, true)));
    this.hudDiff = this.add.text(offset + step * 4, 22, '', style(14, C.textPrimary, true));
    this.uiRoot!.add(this.hudDiff);
    this.autoStatusText = this.add.text(offset + step * 4, 40, '', style(12, C.gold)).setWordWrapWidth(step - 8); this.uiRoot!.add(this.autoStatusText);
    this.hudStatus = this.add.text(this.layout.compact ? 512 : 544, this.layout.height - this.layout.tray + 12, '', style(12, C.gold)).setWordWrapWidth(Math.max(160, this.layout.field.width - 560));
    this.uiRoot!.add(this.hudStatus);
    remember();
  }

  private fitHudMetrics(): void {
    if (!this.layout.compact || this.hudMetricLabels.length !== 4) return;
    const values=[this.hudWaveValue,this.hudGoldValue,this.hudLivesValue,this.hudScoreValue];
    const inline=this.compactBossActive&&!this.layout.stackedHud;
    const cell=(this.layout.width-this.layout.safe.left-this.layout.safe.right-(this.layout.stackedHud?16:268))/4;
    this.hudMetricLabels[0].setText('WAVE');
    values.forEach((value,i)=>{
      if(!value)return;
      const label=this.hudMetricLabels[i], full=value.text;
      label.setFontSize(i===3&&this.campaign?10:12);
      const x=inline?label.x+label.width+4:label.x;
      const available=inline?cell-label.width-12:cell-8;
      value.setPosition(x,this.layout.safe.top+(inline?4:24)).setFontSize(inline?12:16).setData('fullValue',full);
      if(value.width>available){
        value.setFontSize(12);
        if(value.width>available){
          const formatter=new Intl.NumberFormat('en',{notation:'compact',maximumSignificantDigits:2});
          value.setText(full.replace(/\d+/g,number=>formatter.format(Number(number))));
          if(value.width>available){
            const scientific=new Intl.NumberFormat('en',{notation:'scientific',maximumSignificantDigits:1});
            value.setText(full.replace(/\d+/g,number=>scientific.format(Number(number))));
          }
        }
      }
    });
  }

  private scoreSoFar(): number {
    if (this.campaign) return calculateCampaignLiveScore({
      scheduledEnemiesKilled: this.campaignScheduledKills, wavesCompleted: this.wavesCompleted,
      missionBossesKilled: this.campaignMissionBossKills, remainingLives: 0
    });
    const d = getDifficulty(this.difficultyId);
    return calculateLiveScore(
      { enemiesKilled: this.enemiesKilled, elitesKilled: this.elitesKilled, wavesCompleted: this.wavesCompleted, bossesKilled: this.bossesKilled, remainingLives: this.lives, unusedGold: this.gold },
      d
    );
  }

  private updateHUD(): void {
    if (this.autoSnapshot().blocked) this.auto.suspend();
    this.refreshProgressionActions?.();
    const d = getDifficulty(this.difficultyId);
    const bossNow = this.waveActive && this.currentWaveIsBoss;
    const bossNext = !this.waveActive && (this.campaign ? this.wave + 1 === this.campaign.waveCount && !!this.campaign.definition.bossEnemyId : buildWave(this.wave + 1, 1).isBossWave);
    const total = this.campaign ? String(this.campaign.waveCount) : this.siege.phase === 'endless' ? '∞' : '30';
    if (bossNow || bossNext) {
      this.hudWaveLabel?.setText('BOSS WAVE').setColor(C.dangerBright);
      this.hudWaveValue?.setText(`${bossNow ? this.wave : this.wave + 1}/${total}`).setColor(C.dangerBright);
    } else {
      this.hudWaveLabel?.setText('WAVE').setColor(C.textMuted);
      this.hudWaveValue?.setText(`${Math.max(1, this.wave)}/${total}`).setColor(C.textPrimary);
    }
    this.hudGoldValue?.setText(`${formatCount(this.gold)}`);
    this.hudGoldValue?.setColor(this.gold < 100 ? C.danger : C.gold);
    this.hudLivesValue?.setText(`${this.lives}/${this.maxLives}`);
    // Urgent at low lives, but no continuous flashing (§21).
    this.hudLivesValue?.setColor(this.lives <= 5 ? C.danger : C.textPrimary);
    this.hudScoreValue?.setText(`${formatCount(this.scoreSoFar())}`);
    this.fitHudMetrics();
    this.hudDiff?.setText(this.campaign ? `Level ${this.campaign.definition.level}` : d.label);
    const bits: string[] = [];
    if (import.meta.env.DEV && this.qaCampaignFixture) bits.push(`DEV CAMPAIGN FIXTURE · L${this.qaCampaignFixture.level} · unsaved`);
    if (this.paused || this.pausedByModal) bits.push('PAUSED');
    if (this.speed !== 1) bits.push(`${this.speed}x`);
    if (this.gameTimeMs < this.freezeUntil) bits.push('FROZEN');
    if (this.gameTimeMs < this.doubleBountyUntil) bits.push('2x GOLD');
    if (this.gameTimeMs < this.battleCryUntil) bits.push('TEMPO');
    if (this.gameTimeMs < this.surgeUntil) bits.push('SURGE');
    if (this.pendingMeteor) bits.push(this.touchMode ? 'METEOR: TAP TO PREVIEW' : 'METEOR: CLICK BATTLEFIELD');
    const devFixtureLabel = import.meta.env.DEV && this.qaCampaignFixture !== null;
    if (devFixtureLabel && this.layout.compact) this.hudStatus?.setPosition(8, this.layout.hud + 4).setWordWrapWidth(this.layout.width - 16);
    this.hudStatus?.setText(bits.join(' · ')).setVisible(bits.length > 0 && !(this.layout.compact && this.compactBossActive && this.bossHudReservedHeight > 0) && (!(this.layout.compact && this.compactBossActive) || devFixtureLabel));
    if (!this.waveActive) {
      this.startBtnLabel?.setText(`Start Wave ${this.wave + 1}`);
      this.startBtn?.setFillStyle(0x19232d, 1).setStrokeStyle(2, 0xd7aa4e, 1);
    } else {
      this.startBtnLabel?.setText(`Wave ${this.wave} · In battle`);
      this.startBtn?.setFillStyle(0x121920, 1).setStrokeStyle(1, 0x2c3945, 1);
    }
    if (this.layout.portraitBossCommands) this.startBtnLabel?.setText('Wave');
    this.startBtnLabel?.setVisible(true);
    this.tweens.timeScale = this.paused || this.pausedByModal ? 0 : this.speed;
    this.time.paused = this.paused || this.pauseState.has('background');
    this.syncEnemyAnimationPlayback();
    this.refreshAutoDisplay();
    this.publishQAStatus();
  }

  // ---------- bottom command tray (80px): build + relics + wave action ----------
  private drawTowerPanel(): void {
      this.bottomCommandObjects.forEach(object => object.destroy());
      this.bottomCommandObjects = [];
      this.towerTray?.destroy();
      this.towerTray = null;
      const {x,y,width}=this.layout.waveBounds;
      const addBottomCommand = <T>(draw: () => T): T => {
        const before = this.uiRoot!.list.length;
        const result = draw();
        this.bottomCommandObjects.push(...this.uiRoot!.list.slice(before));
        return result;
      };
      if (this.layout.portraitBossCommands) {
        addBottomCommand(() => panel(this,this.uiRoot!,x,y,width,52));
        const inset = 8, gap = 4;
        const buttonWidth = (width - inset * 2 - gap * 3) / 4;
        const rowButton = (index: number, label: string, action: () => void, kind: 'primary' | 'secondary' = 'secondary') => {
          const choice = addBottomCommand(() => button(this,this.uiRoot!,x + inset + index * (buttonWidth + gap),y + 4,buttonWidth,label,action,kind,44));
          choice.text.setWordWrapWidth(buttonWidth - 8).setAlign('center');
          return choice;
        };
        rowButton(0,'Build',()=>this.openSheet('build'));
        rowButton(1,'Relics',()=>this.openSheet('relics'));
        const wave = rowButton(2,'Wave',()=>{
          if (this.waveActive || this.pauseState.blocked || this.pendingMeteor || (!this.auto.enabled && this.vault.pending.length)) { this.openSheet('next'); return; }
          this.startNextWave();
        },'primary');
        this.startBtn = wave.box; this.startBtnLabel = wave.text;
        rowButton(3,'More',()=>this.openSheet('more'));
        return;
      }
      this.towerTray=new TowerTray(this,this.uiRoot!,this.layout.trayBounds,(input,id)=>this.beginTowerDrag(input,id));
      this.towerTray.refresh(this.gold,this.placingTowerId as TowerId|null);
      const {x:waveX,y:waveY,width:waveWidth,height}=this.layout.waveBounds;
      addBottomCommand(() => panel(this,this.uiRoot!,waveX,waveY,waveWidth,height));
      addBottomCommand(() => button(this,this.uiRoot!,waveX+4,waveY+8,54,'Relics',()=>this.openSheet('relics')));
      const wave = addBottomCommand(() => button(this, this.uiRoot!, waveX+62, waveY + 8, waveWidth-124, '', () => {
        if (this.waveActive || this.pauseState.blocked || this.pendingMeteor || (!this.auto.enabled && this.vault.pending.length)) { this.openSheet('next'); return; }
        this.startNextWave();
      }, 'primary', 44));
      this.startBtn = wave.box; this.startBtnLabel = wave.text;
      wave.text.setWordWrapWidth(waveWidth-140).setAlign('center');
      addBottomCommand(() => button(this, this.uiRoot!, waveX+waveWidth-58, waveY + 8, 54, 'More', () => this.openSheet('more'), 'secondary', 44));
  }

  private drawCatalog(): void {
    if (!this.layout.inspector) {
      this.infoPanel?.destroy(true);this.infoPanel=null;this.compactInspectorBounds=null;
      const t=this.selectedTower;if(!t||this.sheetKind)return;
      const w=Math.min(560,this.layout.width-16),h=108;
      const screen=this.cameraView.project(t);
      let y=this.layout.width<this.layout.height?this.layout.height-this.layout.tray-h-4:
        screen.y>this.layout.hud+this.layout.field.height/2?this.layout.hud+4:this.layout.height-this.layout.tray-h-4;
      if (this.bossBar?.visible && y < this.bossBar.y + this.bossPanelHeight + 8) {
        y = this.bossBar.y + this.bossPanelHeight + 8;
        if (y + h > this.layout.field.y + this.layout.field.height - 4) {
          const detailsY = this.layout.field.y + this.layout.field.height - 48;
          const c = this.add.container((this.layout.width - w) / 2, detailsY);
          this.uiRoot!.add(c); this.infoPanel = c;
          this.compactInspectorBounds = {x:c.x,y:detailsY,width:w,height:44};
          button(this, c, 0, 0, w - 48, `${t.cfg.name} · Details`, () => this.openDetails('tower'), 'primary');
          button(this, c, w - 44, 0, 44, '×', () => { this.selectedTower = null; this.refreshInfoPanel(); });
          return;
        }
      }
      const x=(this.layout.width-w)/2,c=this.add.container(x,y);this.uiRoot!.add(c);this.infoPanel=c;
      this.compactInspectorBounds={x,y,width:w,height:h};
      panel(this,c,0,0,w,h).setInteractive().on('pointerdown',(_p:unknown,_x:number,_y:number,e:Phaser.Types.Input.EventData)=>e.stopPropagation());
      c.add(this.add.text(8,6,`${t.cfg.name} · Level ${t.level}`,style(14,C.textPrimary,true)));
      const next=towerProgressionView(t,this.purchaseContext(),this.wavesCompleted,this.towers).actions[0];
      c.add(this.add.text(8,26,next?.nextStats?`Damage ${formatQuantity(t.stats.damage,1)} → ${formatQuantity(next.nextStats.damage,1)} · Range ${formatQuantity(t.stats.range,1)} → ${formatQuantity(next.nextStats.range,1)}`:'View progression and requirements',style(14,C.textSecondary)).setWordWrapWidth(w-16));
      button(this,c,8,58,w-128,this.inspectorPrimaryLabel(t),()=>this.inspectorPrimaryAction(),'primary');
      button(this,c,w-112,58,60,'Details',()=>this.openSheet('tower'));
      button(this,c,w-48,58,44,'×',()=>{this.selectedTower=null;this.refreshInfoPanel();});
      return;
    }
  }

  private compositionSummary(wave: number, complete = false): string {
    if (this.campaign) {
      if (wave > this.campaign.waveCount) return 'Campaign battle resolved';
      const cfg = this.campaign.wave(wave);
      const counts = new Map<string, number>();
      for (const spawn of cfg.spawns) counts.set(spawn.enemyId, (counts.get(spawn.enemyId) ?? 0) + 1);
      return `Next: Wave ${wave}/${this.campaign.waveCount} · ${[...counts].map(([id, count]) => `${count}x ${getCampaignEnemy(id).name}`).join(', ')}`;
    }
    const d = getDifficulty(this.difficultyId);
    const cfg = buildWave(wave, d.enemyCountMultiplier);
    const parts = cfg.groups
      .filter((gr) => gr.enemyId !== 'warlord')
      .map((gr) => `${gr.count}x ${ENEMIES[gr.enemyId].name}`);
    const boss = cfg.isBossWave ? ` — ${cfg.groups.filter(g => g.enemyId === 'warlord').reduce((n, g) => n + g.count, 0)}x ${ENEMIES.warlord.name}` : '';
    return `Next: ${wavePresentation(wave, this.siege.phase === 'endless').label} — ${(complete ? parts : parts.slice(0, 3)).join(', ')}${!complete && parts.length > 3 ? ', …' : ''}${boss}`;
  }

  private updateNextPreview(): void {
    this.nextPreview?.setText(this.waveActive ? `Hold the line — Wave ${this.wave}.` : this.compositionSummary(this.wave + 1));
    if (this.sheetKind === 'next') this.drawSheet(this.sheet?.scrollOffset ?? 0);
  }

  private drawControls(): void {
    this.topControlObjects.forEach(object=>object.destroy()); this.topControlObjects=[];
    const firstObject=this.uiRoot!.list.length;
    const remember=():void=>{this.topControlObjects=this.uiRoot!.list.slice(firstObject);};
    const w = this.layout.width;
    const portrait=this.layout.stackedHud;
    const y = this.layout.safe.top + (portrait ? 54 + this.layout.bossStatusHeight : 6);
    if (this.layout.compact && !portrait) {
      this.autoButton = button(this, this.uiRoot!, w - 252, y, 84, this.auto.enabled ? 'Auto ON' : 'Auto OFF', () => this.setAutoEnabled(!this.auto.enabled));
      this.speedBtnLabel = null;
      button(this, this.uiRoot!, w - 164, y, 88, 'Overview', () => { this.cancelGesture(); this.cameraView.reset(); this.applyView(); });
      button(this, this.uiRoot!, w - 72, y, 64, 'Pause', () => this.togglePauseMenu());
      remember(); return;
    }
    if(portrait){
      const left=this.layout.safe.left+8,available=w-this.layout.safe.left-this.layout.safe.right-16;
      const width=(available-12)/4;
      const control=(i:number,label:string,action:()=>void)=>{
        const result=button(this,this.uiRoot!,left+i*(width+4),y,width,label,action);
        result.text.setFontSize(12);return result;
      };
      control(0,'Overview',()=>{this.cancelGesture();this.cameraView.reset();this.applyView();});
      this.autoButton=control(1,this.auto.enabled?'Auto ON':'Auto OFF',()=>this.setAutoEnabled(!this.auto.enabled));
      this.speedBtnLabel=control(2,`${this.speed}×`,()=>this.cycleSpeed()).text;
      control(3,'Pause',()=>this.togglePauseMenu());remember();return;
    }
    this.autoButton = button(this, this.uiRoot!, w - 248, y, 88, this.auto.enabled ? 'Auto ON' : 'Auto OFF', () => this.setAutoEnabled(!this.auto.enabled));
    this.speedBtnLabel = button(this, this.uiRoot!, w - 152, y, 64, `${this.speed}×`, () => this.cycleSpeed()).text;
    button(this, this.uiRoot!, w - 80, y, 68, 'Pause', () => this.togglePauseMenu());
    if(portrait)button(this,this.uiRoot!,8,y,88,'Overview',()=>{this.cancelGesture();this.cameraView.reset();this.applyView();});
    else button(this,this.uiRoot!,w-344,y,88,'Overview',()=>{this.cancelGesture();this.cameraView.reset();this.applyView();});
    remember();
  }

  private speedBtnLabel: Phaser.GameObjects.Text | null = null;

  private autoShortStatus(): string {
    if (!this.auto.enabled) return '';
    if (this.siege.phase === 'victory') return 'Victory';
    if (this.paused || this.pauseState.has('background')) return 'Paused';
    if (this.pendingMeteor) return 'Wait target';
    if (this.modal || this.pausedByModal) return 'Wait dialog';
    if (!this.waveActive) return this.auto.remainingMs === 0 ? 'Starting' : `${Math.max(1, Math.ceil((this.auto.remainingMs ?? 5000) / 1000))}s`;
    return 'In battle';
  }

  private autoDetail(): string {
    const base = this.auto.enabled ? `Auto ON · ${this.autoShortStatus()}` : 'Auto OFF';
    const stats=this.layout.compact?`\nWave ${this.wave}/${this.campaign?.waveCount ?? 30}\nGold ${formatCount(this.gold)}\nLives ${this.lives}/${this.maxLives}\n${this.campaign?'Combat score':'Score'} ${formatCount(this.scoreSoFar())}`:'';
    return `${base} · ${this.vault.pending.length} queued · A toggles Auto${stats}`;
  }

  private refreshAutoDisplay(): void {
    const label = this.auto.enabled ? 'Auto ON' : 'Auto OFF';
    for (const control of [this.autoButton, this.pauseAutoButton]) {
      control?.text.setText(label);
      control?.box.setStrokeStyle(this.auto.enabled ? 2 : 1, this.auto.enabled ? 0xd7aa4e : 0x445564);
    }
    this.autoStatusText?.setText(this.autoShortStatus());
    if (this.autoDetailText && this.sheet) {
      const height = this.autoDetailText.height;
      this.autoDetailText.setText(this.sheetKind === 'next' ? this.nextWaveReason() : this.autoDetail());
      if (this.autoDetailText.height !== height) this.drawSheet(this.sheet.scrollOffset);
    }
    if (!this.waveActive && this.auto.enabled) {
      const status = this.autoSnapshot().blocked ? 'waiting' : this.autoShortStatus();
      this.startBtnLabel?.setText(`Start Wave ${this.wave + 1} · ${status}`);
    }
  }

  private cancelAutoPress(): void {
    this.autoButton?.box.emit('pointerout'); this.pauseAutoButton?.box.emit('pointerout');
  }

  private pauseMenuAvailable(): boolean {
    if (this.pauseState.has('background')) return false;
    if (this.modal && this.modal.getData('pauseMenu') !== true) return false;
    return true;
  }

  private togglePauseMenu(): void {
    if (!this.pauseMenuAvailable()) return;
    if (this.modal) { this.closeModal(); this.paused = false; this.presentReward(); this.updateHUD(); return; }
    this.paused = true;
    this.cancelGesture();
    this.modalRenderer = () => { this.paused = false; this.togglePauseMenu(); };
    const c = this.modalFrame(Math.min(320, this.layout.width - 24), 348); this.modal!.setData('pauseMenu', true);
    c.add(this.add.text(160, 20, 'Paused', style(22, C.textPrimary, true, FONT_DISPLAY)).setOrigin(0.5,0));
    button(this, c, 24, 68, 272, 'Resume', () => this.togglePauseMenu(), 'primary');
    button(this, c, 24, 120, 272, 'Settings', () => this.showPauseSettings());
    this.pauseAutoButton = button(this, c, 24, 172, 272, this.auto.enabled ? 'Auto ON' : 'Auto OFF', () => this.setAutoEnabled(!this.auto.enabled));
    button(this, c, 24, 224, 272, 'Restart Run', () => this.restartRun());
    button(this, c, 24, 276, 272, this.campaign ? 'World Map' : 'Quit to Menu', () => { SoundManager.get().stopMusic(); this.scene.start(this.campaign ? 'Campaign' : 'MainMenu'); }, 'danger');
    this.updateHUD();
  }

  private showPauseSettings(): void {
    const scrollOffset = this.modalSheet?.scrollOffset ?? 0;
    this.closeModal(); this.paused = true;
    this.modalRenderer = () => this.showPauseSettings();
    if (this.layout.width < 768 || this.layout.height < 540) {
      const settings = loadSettings();
      const root = this.modalFrame(this.layout.width - 24, Math.min(460, this.layout.height - 24));
      this.modal!.setData('pauseMenu', true);
      const sheet = new ScrollSheet(this, root, { x: 0, y: 0, width: this.layout.width - 24, height: Math.min(460, this.layout.height - 24) }, 'Settings', () => { this.closeModal(); this.togglePauseMenu(); }); this.modalSheet = sheet;
      const apply = () => { saveSettings(settings); Object.assign(SoundManager.get(), settings); SoundManager.get().applyVolumes(); };
      sheet.action(0, `Music ${settings.musicOn ? 'On' : 'Off'}`, () => { settings.musicOn = !settings.musicOn; apply(); if (settings.musicOn) SoundManager.get().startMusic(); else SoundManager.get().stopMusic(); this.showPauseSettings(); });
      sheet.action(52, `SFX ${settings.sfxOn ? 'On' : 'Off'}`, () => { settings.sfxOn = !settings.sfxOn; apply(); this.showPauseSettings(); });
      (['masterVolume', 'musicVolume', 'sfxVolume'] as const).forEach((key, i) => {
        sheet.text(112 + i * 104, `${key.replace('Volume', ' volume')} · ${Math.round(settings[key] * 100)}%`);
        sheet.pair(140 + i * 104, '−', '+', () => { settings[key] = Math.max(0, Math.round((settings[key] - .1) * 10) / 10); apply(); this.showPauseSettings(); }, () => { settings[key] = Math.min(1, Math.round((settings[key] + .1) * 10) / 10); apply(); this.showPauseSettings(); });
      });
      sheet.action(432, `Preferred ${settings.gameSpeed}×`, () => { settings.gameSpeed = settings.gameSpeed === 3 ? 1 : settings.gameSpeed + 1; apply(); this.showPauseSettings(); });
      sheet.action(484, 'Back', () => { this.closeModal(); this.togglePauseMenu(); }); sheet.scrollTo(scrollOffset); this.updateHUD(); return;
    }
    const c = this.modalFrame(360, 356); this.modal!.setData('pauseMenu', true);
    c.add(this.add.text(180, 16, 'Settings', style(22, C.textPrimary, true, FONT_DISPLAY)).setOrigin(0.5,0));
    const settings = loadSettings();
    const sound = SoundManager.get();
    const apply = () => { saveSettings(settings); Object.assign(sound, { masterVolume: settings.masterVolume, musicOn: settings.musicOn, sfxOn: settings.sfxOn, musicVolume: settings.musicVolume, sfxVolume: settings.sfxVolume }); sound.applyVolumes(); if (settings.musicOn) sound.startMusic(); else sound.stopMusic(); };
    const music = button(this, c, 16, 60, 160, `Music ${settings.musicOn ? 'On' : 'Off'}`, () => { settings.musicOn = !settings.musicOn; apply(); music.text.setText(`Music ${settings.musicOn ? 'On' : 'Off'}`); });
    const sfx = button(this, c, 184, 60, 160, `SFX ${settings.sfxOn ? 'On' : 'Off'}`, () => { settings.sfxOn = !settings.sfxOn; apply(); sfx.text.setText(`SFX ${settings.sfxOn ? 'On' : 'Off'}`); });
    for (const [key, label, y] of [['musicVolume','Music volume',112],['sfxVolume','SFX volume',164],['masterVolume','Master volume',216]] as const) {
      const text = this.add.text(16, y + 12, `${label} ${Math.round(settings[key] * 100)}%`, style(14, C.textSecondary)); c.add(text);
      for (const [x, delta, mark] of [[240,-0.1,'−'],[292,0.1,'+']] as const) button(this, c, x, y, 44, mark, () => { settings[key] = Math.max(0, Math.min(1, settings[key] + delta)); apply(); text.setText(`${label} ${Math.round(settings[key] * 100)}%`); });
    }
    button(this, c, 16, 288, 160, 'Back', () => { this.closeModal(); this.togglePauseMenu(); });
    const speed = button(this, c, 184, 288, 160, `Preferred ${settings.gameSpeed}×`, () => { settings.gameSpeed = settings.gameSpeed === 1 ? 2 : settings.gameSpeed === 2 ? 3 : 1; apply(); speed.text.setText(`Preferred ${settings.gameSpeed}×`); });
    this.updateHUD();
  }

  private modalFrame(width: number, height: number, edge = 0x445564): Phaser.GameObjects.Container {
    const root = this.add.container(0, 0).setDepth(2000);
    const dim = this.add.rectangle(0, 0, this.layout.width, this.layout.height, 0x0a0e12, 0.72).setOrigin(0);
    dim.setInteractive().on('pointerdown', (_p: unknown, _x: number, _y: number, e: Phaser.Types.Input.EventData) => e.stopPropagation()); root.add(dim);
    const c = this.add.container((this.layout.width - width) / 2, (this.layout.height - height) / 2);
    panel(this, c, 0, 0, width, height, edge); root.add(c); this.modal = root; return c;
  }

  private closeModal(): void {
    this.pauseAutoButton = null;
    this.modalError = '';
    this.modalSheet?.destroy(); this.modalSheet = null; this.modalRenderer = null;
    this.revealTimer?.remove(false); this.revealTimer = null;
    this.modal?.destroy(true); this.modal = null; this.pausedByModal = false;
    this.updateHUD();
    if (this.siege.phase === 'victory') this.renderVictory();
  }

  private cycleSpeed(): void {
    this.speed = this.speed === 1 ? 2 : this.speed === 2 ? 3 : 1;
    this.speedBtnLabel?.setText(`${this.speed}×`); this.updateHUD();
  }

  // ---------- placement context panel (ref 05): role stats while placing ----------
  private refreshPlacePanel(): void {
    if (!this.layout.inspector) { this.showTouchPreview(); return; }
    this.placePanel?.destroy(true); this.placePanel = null;
    if (!this.placingTowerId) return;
    const cfg = TOWER_LIST.find(t => t.id === this.placingTowerId)!;
    const width = Math.min(440, this.layout.field.width - 24);
    const c = this.add.container(12, this.layout.height - this.layout.tray - 56); this.uiRoot!.add(c);
    panel(this, c, 0, 0, width, 48);
    c.add(this.add.text(12, 8, `Place ${cfg.name} · ${formatCount(cfg.levels[0].cost)} gold`, style(14, C.textPrimary, true)));
    c.add(this.add.text(12, 28, 'Choose a clearing. Escape cancels.', style(12, C.textSecondary)));
    button(this, c, width - 56, 2, 44, '×', () => { this.placingTowerId = null; this.hideGhost(); this.refreshPlots(); this.refreshPlacePanel(); this.drawCatalog(); });
    this.placePanel = c;
  }

  // ---------- selected tower inspector (240px, §31) ----------
  private refreshInfoPanel(): void {
    const beacon = this.selectedTower;
    const showAura = !!beacon && beacon.progression.branchId === 'arcane-beacon' && beacon.progression.rank !== null;
    this.auraCircle?.setVisible(showAura);
    if (showAura && beacon) this.auraCircle?.setPosition(beacon.x, beacon.y);
    if (!this.layout.inspector) { this.drawCatalog(); return; }
    if (this.sheetKind === 'evolve') this.drawSheet();
    this.infoPanel?.destroy(true); this.infoPanel = null; this.hideGhost();
    this.towerCommands?.destroy(true); this.towerCommands = null;
    this.hudStatus?.setPosition(this.layout.compact ? 512 : 544, this.layout.height - this.layout.tray + 12);
    this.drawCatalog();
    const t = this.selectedTower;
    if (!t) { if (this.sheetKind === 'evolve') { this.sheetKind = null;this.pauseState.set('details',false);this.drawSheet(); } return; }
    const compact = this.layout.compact;
    const width = compact ? Math.min(820, this.layout.width - 24) : 240;
    const height = compact ? 108 : this.layout.field.height;
    const x = compact ? (this.layout.width - width) / 2 : this.layout.width - width;
    const selectedPoint = this.cameraView.project(t);
    const aboveTower = selectedPoint.y >= this.layout.field.y + this.layout.field.height / 2;
    const y = compact ? (aboveTower ? this.layout.hud + 8 : this.layout.height - this.layout.tray - height - 8) : this.layout.hud;
    const view = towerProgressionView(t, this.purchaseContext(), this.wavesCompleted, this.towers);
    const c = this.add.container(x, y); this.uiRoot!.add(c); this.infoPanel = c;
    const progressionLabel = this.campaign ? `${t.maxLevel ? 'Maximum foundation' : `Foundation ${t.level}/4`} · ${t.specialization ? getCampaignSpecialization(t.specialization)?.name : 'No specialization'}` : view.title;
    panel(this, c, 0, 0, width, height).setInteractive().on('pointerdown', (_p: unknown, _x: number, _y: number, e: Phaser.Types.Input.EventData) => e.stopPropagation());
    if (compact) {
      const st = t.stats;
      const nextBase = this.campaign && t.maxLevel ? null : view.actions[0]?.nextStats ?? null;
      const next = nextBase && this.campaign ? campaignTowerStats(nextBase, t.specialization) : nextBase;
      c.add(this.add.image(28, 28, towerPortraitKey(t.towerId)).setDisplaySize(40, 40));
      c.add(this.add.text(60, 6, progressionLabel, style(14, C.textPrimary, true, FONT_DISPLAY)).setWordWrapWidth(width - 120));
      c.add(this.add.text(60, 28, `Damage ${formatStat('damage', st.damage)} · Attack ${formatStat('attackInterval', st.attackInterval)}s · Range ${formatStat('range', st.range)} · Type ${st.damageType}`, style(14, C.textSecondary)));
      if (next) c.add(this.add.text(width - 60, 8, `Next: ${formatStat('damage', next.damage)} damage · ${formatStat('range', next.range)} range · ${formatStat('attackInterval', next.attackInterval)}s`, style(12, C.gold)).setOrigin(1, 0));
      button(this, c, width - 52, 4, 44, '×', () => { this.selectedTower = null; this.refreshInfoPanel(); });
      TARGET_MODES.forEach((mode, i) => {
        const bw = (width - 16) / 5;
        button(this, c, 8 + i * bw, 56, bw - 4, mode[0].toUpperCase() + mode.slice(1), () => { t.targeting = mode; this.refreshInfoPanel(); }, t.targeting === mode ? 'primary' : 'secondary');
      });
      const commands = this.add.container(420, this.layout.height - this.layout.tray + 8);
      this.uiRoot!.add(commands); this.towerCommands = commands;
      const commandWidth = this.layout.width - 440;
      const bw = (commandWidth - 8) / 2;
      button(this, commands, 0, 0, bw, this.inspectorPrimaryLabel(t), () => this.inspectorPrimaryAction(), 'primary', 44);
      button(this, commands, bw + 8, 0, bw, `Sell · ${formatCount(investedRefund(t.progression))} gold`, () => this.sellSelected(), 'danger', 44);
      return;
    }
    c.add(this.add.image(40, 40, towerPortraitKey(t.towerId)).setDisplaySize(56, 56));
    c.add(this.add.text(76, 12, t.cfg.name, style(18, C.textPrimary, true, FONT_DISPLAY)));
    const progressionTitle = this.add.text(76, 36, progressionLabel, style(12, C.gold, true)).setWordWrapWidth(width - 130);
    c.add(progressionTitle);
    const detailsY = Math.max(80, 36 + progressionTitle.height + 8);
    const detailsOffset = detailsY - 80;
    if (!compact) c.add(this.add.text(16, detailsY, t.cfg.role, style(12, C.textSecondary)).setWordWrapWidth(width - 32));
    button(this, c, width - 52, 4, 44, '×', () => { if(this.pauseState.has('details'))this.closeDetails();this.selectedTower = null; this.refreshInfoPanel(); });
    const st = t.stats;
    const rows: Array<[string, string]> = [['Damage', formatStat('damage', st.damage)], ['Attack', `${formatStat('attackInterval', st.attackInterval)}s`], ['Range', formatStat('range', st.range)], ['Type', st.damageType]];
    if (st.splashRadius) rows.push(['Splash', formatStat('splashRadius', st.splashRadius)]);
    if (st.chainCount) rows.push(['Chain', `${st.chainCount}`]);
    if (st.slowFactor) rows.push(['Slow', `${Math.round(st.slowFactor * 100)}%`]);
    if (compact) rows.forEach(([k,v], i) => c.add(this.add.text(16 + (i % 3) * (width - 32) / 3, 72 + Math.floor(i / 3) * 24, `${k}  ${v}`, style(14, C.textSecondary))));
    else rows.forEach(([k, v], i) => statRow(this, c, 120 + detailsOffset + i * 24, k, v, width));
    const modesY = compact ? 132 : 144 + detailsOffset + rows.length * 24;
    const upgradeY = compact ? 184 : modesY;
    const nextBase = this.campaign && t.maxLevel ? null : view.actions[0]?.nextStats ?? null;
    const next = nextBase && this.campaign ? campaignTowerStats(nextBase, t.specialization) : nextBase;
    if (next) {
      const preview = `Damage ${formatStat('damage', st.damage)} → ${formatStat('damage', next.damage)}   Range ${formatStat('range', st.range)} → ${formatStat('range', next.range)}\nAttack ${formatStat('attackInterval', st.attackInterval)}s → ${formatStat('attackInterval', next.attackInterval)}s`;
      if (!compact) c.add(this.add.text(16, upgradeY, preview, style(12, C.textSecondary)).setWordWrapWidth(width - 32));
      else c.add(this.add.text(width / 2 + 12, 12, `Next: ${formatStat('damage', next.damage)} damage\n${formatStat('range', next.range)} range · ${formatStat('attackInterval', next.attackInterval)}s`, style(12, C.textSecondary)));
    }
    const buttonsY = compact ? 192 : upgradeY + 56;
    button(this, c, 16, buttonsY, compact ? width / 2 - 24 : width - 32, this.inspectorPrimaryLabel(t), () => this.inspectorPrimaryAction(), 'primary');
    button(this,c,16,buttonsY+52,width-32,'Details',()=>this.openDetails('tower'));
  }

  private tryBuild(towerId: string, plotIndex: number): void {
    if (this.isRunBlocked()) return;
    const cfg = TOWER_LIST.find((t) => t.id === towerId);
    if (!cfg) return;
    const check = this.placementCheck(towerId, plotIndex);
    if (!check.ok) {
      const p = this.map.buildable[plotIndex] ?? { x: this.map.width / 2, y: this.map.height / 2 };
      this.floatText(p.x, p.y - 26, check.reason, C.dangerBright);
      SoundManager.get().sell();
      return;
    }
    const cost = cfg.levels[0].cost;
    this.gold -= cost;
    const p = this.map.buildable[plotIndex];
    const tw = new Tower(towerId, p.x, p.y, plotIndex);
    if (this.campaign) { tw.specialization = this.campaign.choices[tw.towerId]; tw.targeting = this.campaign.targeting[tw.towerId]; }
    // Authored family visual + contact shadow (§13-14, §65).
    const visual = buildTowerVisual(this, towerId, 1, this.towerVisualTier);
    const { view, crown } = visual;
    view.setData({ muzzleX: visual.muzzleX, muzzleY: visual.muzzleY, displayBounds: visual.displayBounds });
    this.world(view).setPosition(p.x, p.y).setDepth(3 + p.y / 1000);
    this.projectEntity(view);
    tw.view = view;
    tw.crown = crown;
    tw.shadow = null;
    this.towers.push(tw);
    this.occupied.add(plotIndex);
    SoundManager.get().build();
    this.floatText(p.x, p.y - 28, `-${formatCount(cost)} gold`, C.gold);
    this.placingTowerId = null;
    this.selectedTower = tw; // deliberate build-then-inspect
    this.refreshInfoPanel();
    this.refreshPlots();
    this.refreshPlacePanel();
    this.hideGhost();
    this.updateHUD();
    if(!this.debugAssisted)this.time?.delayedCall(0,()=>this.showGuide('upgrade'));
  }

  private isRunBlocked(): boolean {
    return this.ended || this.pauseState.blocked || this.siege.phase === 'victory' || this.siege.phase === 'terminal';
  }

  private purchaseContext(): PurchaseContext {
    return { gold: this.gold, evolutionOpen: !this.campaign && this.siege.evolutionOpen, endless: !this.campaign && this.siege.phase === 'endless', blocked: this.isRunBlocked(), unlocked: this.runUnlocks };
  }

  private purchaseSelected(intent: PurchaseIntent, expectedTowerId: number, expectedRevision: number): boolean {
    if (this.campaign && intent.kind !== 'foundation-upgrade') return false;
    const tower = this.selectedTower;
    if (!tower || tower.id !== expectedTowerId || !this.towers.includes(tower)) { this.showBanner(PURCHASE_REASON_TEXT['stale action'], C.dangerBright); return false; }
    const result = purchaseEvolution(tower.towerId, tower.progression, intent, this.purchaseContext(), expectedRevision);
    if (!result.ok) { this.floatText(tower.x, tower.y - 30, PURCHASE_REASON_TEXT[result.reason], C.dangerBright); return false; }
    const evolved = tower.progression.branchId === null && result.state.branchId !== null;
    this.gold = result.gold; tower.progression = result.state;
    if (evolved) tower.counter = { successes: 0 };
    SoundManager.get().upgrade();
    this.floatText(tower.x, tower.y - 30, `-${formatCount(result.cost)} gold`, C.gold);
    this.refreshTowerVisual(tower);
    this.refreshInfoPanel();
    this.updateHUD();
    return true;
  }

  private refreshTowerVisual(t: Tower): void {
    // Upgrade visibly evolves the silhouette (§15, §91): rebuild at new level.
    t.view?.destroy(true);
    const rebuilt = buildTowerVisual(this, t.towerId, t.level, this.towerVisualTier);
    rebuilt.view.setData({ muzzleX: rebuilt.muzzleX, muzzleY: rebuilt.muzzleY, displayBounds: rebuilt.displayBounds });
    this.world(rebuilt.view).setPosition(t.x, t.y).setDepth(3 + t.y / 1000);
    const { branchId, rank } = t.progression;
    if (branchId !== null && rank !== null) decorateEvolution(this, rebuilt.view, branchId, rank);
    this.projectEntity(rebuilt.view);
    t.view = rebuilt.view;
    t.crown = rebuilt.crown;
  }

  private upgradeSelected(): boolean {
    const t = this.selectedTower;
    return !!t&&this.purchaseSelected({ kind: 'foundation-upgrade' }, t.id, t.progression.revision);
  }

  private sellSelected(): boolean {
    if (this.isRunBlocked()) return false;
    const t = this.selectedTower;
    if (!t||!this.towers.includes(t)) return false;
    const sv = investedRefund(t.progression);
    this.gold += sv;
    SoundManager.get().sell();
    this.floatText(t.x, t.y - 30, `+${formatCount(sv)} gold`, C.gold);
    this.evolutionCombat.removeOwner(t.id);
    t.view?.destroy(true);
    t.shadow?.destroy();
    this.towers = this.towers.filter((x) => x.id !== t.id);
    this.occupied.delete(t.plotIndex);
    this.selectedTower = null;
    this.refreshInfoPanel();
    this.refreshPlots();
    this.hideGhost();
    this.updateHUD();
    return true;
  }

  // ---------- waves ----------
  private nextWaveReason(): string {
    if (this.waveActive) return 'Finish this wave before starting another.';
    if (this.pendingMeteor) return 'Confirm or cancel the Meteor target first.';
    if (!this.auto.enabled && this.vault.pending.length) return 'Resolve the pending reward first.';
    if (this.pauseState.blocked) return 'Resume the run to start a wave.';
    if (this.auto.enabled && this.vault.pending.length) return `Auto retains ${this.vault.pending.length} queued rewards. Manual Start skips the countdown.`;
    return 'Ready when you are.';
  }

  private autoSnapshot(): AutoContext {
    return { phase: this.siege.phase, wave: this.wave, waveActive: this.waveActive,
      blocked: this.isRunBlocked() || this.lives <= 0 || this.modal !== null || this.pendingMeteor,
      nowMs: this.gameTimeMs, lives: this.lives, maxLives: this.maxLives, enemies: this.enemies, towers: this.towers,
      freezeUntil: this.freezeUntil, battleCryUntil: this.battleCryUntil, surgeUntil: this.surgeUntil, doubleBountyUntil: this.doubleBountyUntil };
  }

  private setAutoEnabled(value: boolean): void {
    if (this.ended || this.siege.phase === 'terminal') return;
    this.auto.setEnabled(value); this.updateHUD();
    if (this.siege.phase === 'victory') this.renderVictory();
    if (!value) this.presentReward();
  }

  private performAutoRelic(intent: AutoRelicIntent, expectedRunId: string, expectedAutoRevision: number): boolean {
    if (!this.auto.enabled || expectedRunId !== this.runId || expectedAutoRevision !== this.auto.revision) return false;
    const fresh = chooseAutoRelic(this.autoSnapshot(), this.vault);
    if (!fresh || fresh.source !== intent.source || fresh.index !== intent.index || fresh.id !== intent.id || fresh.revision !== intent.revision) return false;
    if (intent.id === 'meteor_strike' && (!fresh.meteorTarget || !intent.meteorTarget ||
      fresh.meteorTarget.enemyId !== intent.meteorTarget.enemyId || fresh.meteorTarget.x !== intent.meteorTarget.x || fresh.meteorTarget.y !== intent.meteorTarget.y)) return false;
    const result = this.vault.beginSelectedUse(fresh, this.towers.length > 0);
    if (result.kind === 'apply') this.applyPowerup(result.id);
    else if (result.kind === 'target' && fresh.meteorTarget) {
      const reservation = this.vault.target;
      try { this.castMeteor(fresh.meteorTarget.x, fresh.meteorTarget.y, true); }
      finally { if (this.vault.target === reservation) this.vault.cancelTarget(); }
    } else return false;
    this.drawPowerupBar(); this.updateHUD(); return true;
  }

  private tickAuto(realDeltaMs: number, frameWasWaiting: boolean): void {
    const before = this.autoSnapshot();
    if (before.blocked) { this.auto.advance(0, before); return; }
    if (!this.auto.enabled) return;
    const expectedRunId = this.runId, expectedAutoRevision = this.auto.revision;
    const intent = chooseAutoRelic(before, this.vault);
    if (intent) this.performAutoRelic(intent, expectedRunId, expectedAutoRevision);
    this.checkWaveClear();
    const after = this.autoSnapshot();
    const charge = frameWasWaiting && !after.waveActive ? realDeltaMs : 0;
    if (this.auto.advance(charge, after)) this.startNextWave('auto', expectedRunId, expectedAutoRevision);
  }

  private startNextWave(source: 'manual' | 'auto' = 'manual', expectedRunId = this.runId, expectedAutoRevision = this.auto.revision): void {
    if (source === 'auto' && (!this.auto.enabled || expectedRunId !== this.runId || expectedAutoRevision !== this.auto.revision)) return;
    if (this.ended || this.waveActive || this.paused || this.pausedByModal || this.modal || this.pendingMeteor || (!this.auto.enabled && this.vault.pending.length)) return;
    if (this.isRunBlocked()) return;
    // Classic uses the 30-wave siege state machine. Campaign battles have their own
    // finite wave budget and must not inherit the Classic cap or its victory phase.
    if (!this.campaign && !this.siege.startWave(this.wave + 1)) return;
    this.auto.cancelCountdown();
    this.wave++;
    const d = getDifficulty(this.difficultyId);
    const cfg = this.campaign ? this.campaign.wave(this.wave, d.enemyCountMultiplier) : buildWave(this.wave, d.enemyCountMultiplier);
    this.currentWaveIsBoss = cfg.isBossWave;
    this.spawnQueue = 'spawns' in cfg ? cfg.spawns.map(spawn => ({ ...spawn, atMs: spawn.atMs + this.gameTimeMs })) : scheduleWave(cfg.groups, this.gameTimeMs + (cfg.isBossWave ? 1300 : 800));
    this.waveActive = true;
    if (cfg.isBossWave) {
      this.bossWarned[this.wave] = true; SoundManager.get().boss();
      this.showBanner(this.campaign ? getCampaignEnemy(this.campaign.definition.bossEnemyId!).name : wavePresentation(this.wave, this.siege.phase === 'endless').warning, C.dangerBright);
    } else this.floatText(520, 128, `Wave ${this.wave}`, C.textPrimary, 22);
    this.updateNextPreview(); this.updateHUD();
  }

  private showBanner(text: string, color: string): void {
    const b = this.add.text(this.layout.field.width / 2, this.layout.hud + 32, text, { ...style(this.layout.compact ? 14 : 22, color, true, FONT_DISPLAY), backgroundColor: '#121920', padding: { x: 12, y: 8 }, wordWrap: { width: this.layout.field.width - 48 } }).setOrigin(0.5).setAlign('center').setDepth(1500);
    this.addEffect(b, 1300);
  }

  private makeEnemyVisual(e: Enemy): void {
    // Authored creature + contact shadow + slow ring (bible §22-30, §65).
    // Slow uses a ring, never a full recolor (§50).
    const shadow = this.add.ellipse(e.x, e.y + e.radius * 0.7, e.radius * 2.1, e.radius * 0.9, 0x000000, 0.3).setDepth(3);
    const visual = buildEnemyVisual(this, e.archetype, e.campaignId ?? undefined);
    const { view, body, bobAmp, bobFreq, rockAmp } = visual;
    view.setData({ enemyVisual: visual, isBoss: e.isBoss, isElite:e.isElite });
    const edge = this.add.image(0, 1, visual.sprite.texture.key, visual.sprite.frame.name).setOrigin(0.5, 1)
      .setScale(visual.sprite.scaleX * 1.045).setTint(0x080c10).setAlpha(0.55);
    body.addAt(edge, 0); view.setData('silhouetteEdge', edge);
    const point = this.enemyRenderPoint(e);
    view.setPosition(point.x, point.y).setDepth(3 + point.y / 1000);
    const slowRing = this.add.ellipse(e.x, e.y, e.radius * 2.5, e.radius * 2.5, 0x000000, 0)
      .setStrokeStyle(2, 0x9fd4e8, 0.85).setDepth(3).setVisible(false);
    const hpbar = this.add.graphics().setDepth(5);
    e.view = view;
    e.body = body;
    e.shadow = shadow;
    e.slowRing = slowRing;
    e.hpBar = hpbar;
    view.setData({ bobAmp, bobFreq, rockAmp });
    this.worldRoot?.add([shadow, slowRing, view, hpbar]);
    this.worldRoot?.sort('depth');
    this.projectEntity(view);
  }

  /** Immediate teardown (leaks, scene transitions). Deaths use startDeathAnim. */
  private destroyView(e: Enemy): void {
    this.campaignScheduledIds.delete(e.id);
    e.view?.destroy(true);
    e.shadow?.destroy();
    e.slowRing?.destroy();
    e.hpBar?.destroy();
    e.view = null;
    e.body = null;
    e.shadow = null;
    e.slowRing = null;
    e.hpBar = null;
  }

  /** Collapse/dissolve over ~300ms, pause-safe (bible §62). */
  private startDeathAnim(e: Enemy): void {
    if (!e.view) return;
    const visual = e.view.getData('enemyVisual') as EnemyView | undefined;
    if(visual)e.view.setData('deathScreenScale',(e.view.getData('baseScaleX') as number ?? 1)*this.cameraView.fitScale);
    const duration = visual?.playAction('death') ?? (e.isBoss ? 900 : 320);
    this.dying.push({ view: e.view, shadow: e.shadow, ring: e.slowRing, bar: e.hpBar, t0: this.gameTimeMs, duration });
    e.hpBar?.clear();
    e.view = null;
    e.body = null;
    e.shadow = null;
    e.slowRing = null;
    e.hpBar = null;
  }

  private updateDying(): void {
    for (let i = this.dying.length - 1; i >= 0; i--) {
      const d = this.dying[i];
      const k = Math.min(1, (this.gameTimeMs - d.t0) / d.duration);
      const visual = d.view.getData('enemyVisual') as EnemyView | undefined;
      const edge = d.view.getData('silhouetteEdge') as Phaser.GameObjects.Image | undefined;
      if (visual && edge) edge.setFrame(visual.sprite.frame.name);
      d.view.setScale((d.view.getData('baseScaleX') as number ?? 1) * (1 - k * 0.8), (d.view.getData('baseScaleY') as number ?? 1) * (1 - k * 0.8));
      d.view.setAlpha(1 - k);
      if (k >= 1) {
        d.view.destroy(true);
        d.shadow?.destroy();
        d.ring?.destroy();
        d.bar?.destroy();
        this.dying.splice(i, 1);
      }
    }
  }

  private spawnEnemy(enemyId: string, hpBonus: number, campaignVisualId?: string): Enemy {
    if (this.campaign && enemyId !== 'pilferer') {
      const cfg = getCampaignEnemy(enemyId);
      const hp = Math.round(cfg.baseHp * (1 + CAMPAIGN_BATTLE_TUNING.hpGrowthPerWave * (this.wave - 1) + CAMPAIGN_BATTLE_TUNING.levelHpGrowth * (this.campaign.definition.level - 1)) * hpBonus);
      const enemy = new Enemy(cfg.visualArchetype, hp, cfg.baseSpeed * (1 + CAMPAIGN_BATTLE_TUNING.speedGrowthPerWave * (this.wave - 1)), cfg.baseReward, cfg);
      enemy.campaignId = campaignVisualId ?? cfg.id; enemy.slowResistance = cfg.slowResistance;
      enemy.x = this.map.spawn.x; enemy.y = this.map.spawn.y;
      this.campaignBosses.register(enemy, this.gameTimeMs);
      this.makeEnemyVisual(enemy); this.enemies.push(enemy); return enemy;
    }
    if (!isClassicEnemy(enemyId)) throw new Error(`Unknown classic enemy: ${enemyId}`);
    const d = getDifficulty(this.difficultyId);
    const w = Math.max(1, this.wave);
    const hp = enemyId === 'pilferer'
      ? Math.round(ENEMIES.pilferer.baseHp * (1 + w * BONUS_TARGET_HP_PER_WAVE))
      : enemyHpForWave(enemyId, w, d, hpBonus);
    const speed = enemySpeedForWave(enemyId, w, d);
    const cfg = ENEMIES[enemyId];
    const reward = cfg.baseReward;
    const e = new Enemy(enemyId, hp, speed, reward);
    const wp0 = this.map.waypoints[0];
    e.x = wp0.x; e.y = wp0.y;
    e.waypointIndex = 1;
    this.makeEnemyVisual(e);
    this.enemies.push(e);
    return e;
  }

  // ---------- boss bar (ref 08: skull banner bar with numeric HP) ----------
  private bossBarHp: Phaser.GameObjects.Text | null = null;
  private bossBarTextWrapWidth = 0;
  private bossCompactStatusWidth = 0;

  private drawBossBar(): void {
    this.bossCompactStatusWidth = 0;
    const field = this.layout.field;
    const width = Math.min(440, field.width - 16);
    const c = this.add.container(field.x + (field.width - width) / 2, this.layout.compact ? field.y + 32 : field.y).setVisible(false);
    this.uiRoot!.add(c);
    this.bossBarBackdrop = this.add.rectangle(0, 0, width, 76, C.bgPanel, 1).setOrigin(0).setStrokeStyle(1, 0xd85f59);
    this.bossBarText = this.add.text(12, 8, '', style(16, C.textPrimary, true)).setWordWrapWidth(width - 24);
    this.bossBarHp = this.add.text(12, 34, '', style(14, C.textPrimary, true)).setWordWrapWidth(width - 24);
    this.bossBarTextWrapWidth = width - 24;
    this.bossBarTrack = this.add.rectangle(12, 60, width - 24, 8, 0x493438).setOrigin(0);
    this.bossBarFill = this.add.rectangle(12, 60, width - 24, 8, 0xee7b71).setOrigin(0);
    c.add([this.bossBarBackdrop, this.bossBarText, this.bossBarHp, this.bossBarTrack, this.bossBarFill]);
    this.bossBar = c; this.bossPanelHeight = 0;
    this.updateBossBar();
  }

  private bossFitSupports(boss: Enemy): FitSupport[] {
    const supports: FitSupport[] = [];
    const radius = BUILD_PLOT_POLICY.radius + BUILD_PLOT_POLICY.strokeWidth / 2;
    const towerScale = 1.25;
    const towerGeometry = TOWER_LIST.flatMap(tower => [1,2,3,4].flatMap(level => [1,this.towerVisualTier].map(tier => towerArtGeometry(tower.id,level,tier as 1|2|3))));
    const towerLeft = Math.min(-31,...towerGeometry.map(g=>g.left));
    const towerRight = Math.max(31,...towerGeometry.map(g=>g.left+g.width));
    // Existing evolution crests extend 34px above their authored tower top.
    const towerTop = Math.min(...towerGeometry.map(g=>g.top)) - 34;
    const towerBottom = Math.max(13,...towerGeometry.map(g=>g.top+g.height));
    for(const point of this.map.buildable){
      supports.push({bounds:{x:point.x-radius,y:point.y-radius,width:radius*2,height:radius*2}});
      supports.push({bounds:{x:point.x+towerLeft*towerScale,y:point.y+towerTop*towerScale,
        width:(towerRight-towerLeft)*towerScale,height:(towerBottom-towerTop)*towerScale}});
    }
    for(let i=1;i<this.map.waypoints.length;i++){
      const a=this.map.waypoints[i-1],b=this.map.waypoints[i];
      const r=this.map.id===MAP1.id?CLASSIC_ROAD_ENVELOPE.radii[i-1]:BUILD_PLOT_POLICY.campaignRoadRadius;
      supports.push({bounds:{x:Math.min(a.x,b.x)-r,y:Math.min(a.y,b.y)-r,width:Math.abs(a.x-b.x)+r*2,height:Math.abs(a.y-b.y)+r*2}});
    }
    const visual=boss.view?.getData('enemyVisual') as EnemyView|undefined;
    if(visual){
      const art=enemyVisualSupport(visual),cap=boss.view!.getData('bossResponsiveCap') as number ?? 1;
      const smallest=Math.min(...[...visual.frameRectangles.right,...visual.frameRectangles.left].map(frame=>Math.max(frame.width,frame.height)*visual.sprite.scaleX));
      const multiplier=Math.max(1,24/smallest)*cap;
      const field=this.map.field;
      // Boss ingress/egress at the terrain edge is masked normally. Include all
      // playable interior route anchors plus every stable visual-rank offset.
      const points=this.map.waypoints.map(p=>({x:Math.max(field.x+64,Math.min(field.x+field.width-64,p.x)),
        y:Math.max(field.y+64,Math.min(field.y+field.height-64,p.y))}));
      const left=Math.min(...points.map(p=>p.x))-20,top=Math.min(...points.map(p=>p.y))-20;
      const right=Math.max(...points.map(p=>p.x))+20,bottom=Math.max(...points.map(p=>p.y))+20;
      supports.push({bounds:{x:left,y:top,width:right-left,height:bottom-top},pixels:{
        x:art.x*multiplier,y:art.y*multiplier-6,width:art.width*multiplier,height:art.height*multiplier+6}});
    }
    return supports;
  }

  private refreshBossFit(boss: Enemy): void {
    if(!this.layout.compact || this.bossFitBoss===boss&&this.bossFitMap===this.map)return;
    if(boss.view)this.projectEntity(boss.view);
    this.cameraView.setContentFit(this.bossFitSupports(boss));
    this.bossFitBoss=boss;this.bossFitMap=this.map;
    this.applyView();
  }

  private updateCompactBossBar(boss: Enemy, pct: number): void {
    if(!this.bossBarText || !this.bossBarHp || !this.bossBarBackdrop)return;
    const stacked=this.layout.stackedHud;
    const width=this.layout.field.width-(stacked?16:268);
    this.bossBarText.setFontSize(12);
    this.bossBarHp.setFontSize(12).setWordWrapWidth(0);
    if(!this.bossCompactStatusWidth){
      const text=this.bossBarHp.text;
      this.bossBarHp.setText(this.campaign?'HP 100% · Phase 99':'HP 100% · Enraged');
      this.bossCompactStatusWidth=this.bossBarHp.width;
      this.bossBarHp.setText(text);
    }
    const nameWidth=Math.max(44,width-32-this.bossCompactStatusWidth);
    this.bossBarText.setWordWrapWidth(nameWidth).setPosition(12,0);
    const lineHeight=Math.max(this.bossBarText.height,this.bossBarHp.height);
    const statusHeight=Math.max(24,lineHeight+8);
    const regular=gameLayout(this.layout.width,this.layout.height,this.layout.safe);
    const needsCommands=stacked&&regular.field.height-statusHeight<200;
    this.setBossLayout(needsCommands,statusHeight);
    this.refreshBossFit(boss);
    const y=this.layout.safe.top+(stacked?49:21);
    this.bossBar?.setPosition(this.layout.field.x+8,y);
    this.bossBarHp.setPosition(width-12-this.bossCompactStatusWidth,0);
    const trackY=lineHeight+3;
    this.bossBarTrack?.setPosition(12,trackY).setSize(width-24,4);
    this.bossBarFill?.setPosition(12,trackY).setDisplaySize((width-24)*pct,4);
    this.bossPanelHeight=trackY+7;
    this.bossBarBackdrop.setSize(width,this.bossPanelHeight);
    this.hudStatus?.setVisible(false);
    this.repositionBossFloaters(boss);
  }

  private bossArtBounds(boss: Enemy): { x: number; y: number; width: number; height: number } | null {
    const visual = boss.view?.getData('enemyVisual') as EnemyView | undefined;
    const bounds = visual?.sprite.getBounds();
    if (!bounds || !Number.isFinite(bounds.x) || !Number.isFinite(bounds.y) || bounds.width <= 0 || bounds.height <= 0) return null;
    const edge = boss.view?.getData('silhouetteEdge') as Phaser.GameObjects.Image | undefined;
    const edgeBounds = edge?.getBounds();
    if (edgeBounds && Number.isFinite(edgeBounds.x) && Number.isFinite(edgeBounds.y) && edgeBounds.width > 0 && edgeBounds.height > 0) {
      const right = Math.max(bounds.x + bounds.width, edgeBounds.x + edgeBounds.width);
      const bottom = Math.max(bounds.y + bounds.height, edgeBounds.y + edgeBounds.height);
      const x = Math.min(bounds.x, edgeBounds.x), y = Math.min(bounds.y, edgeBounds.y);
      return { x, y, width: right - x, height: bottom - y };
    }
    return bounds;
  }

  private bossHealthBarAnchor(boss: Enemy): Point | null {
    const bounds = this.bossArtBounds(boss);
    if (!bounds) return null;
    return this.cameraView.unproject({ x: bounds.x + bounds.width / 2, y: bounds.y - 4 });
  }

  private bossSpriteScreenBounds(boss: Enemy): { x: number; y: number; width: number; height: number } | null {
    const bounds = this.bossArtBounds(boss);
    if (!bounds) return null;
    const field = this.layout.field;
    const x = Math.max(bounds.x, field.x), y = Math.max(bounds.y, field.y);
    const right = Math.min(bounds.x + bounds.width, field.x + field.width);
    const bottom = Math.min(bounds.y + bounds.height, field.y + field.height);
    if (right <= x || bottom <= y) return null;
    return { x, y, width: right - x, height: bottom - y };
  }

  private bossHeadroomForFit(boss: Enemy | undefined): number {
    if (!boss || !this.bossArtBounds(boss)) return 0;
    const field = this.layout.field;
    const maxHeadroom = Math.max(0, field.height - Math.min(field.height, 44));
    const targetTop = field.y + 6;
    const initial = {
      zoom: this.cameraView.zoom,
      center: { ...this.cameraView.center },
      headroom: this.cameraView.topHeadroom
    };
    const restoreInitialCamera = (): void => {
      this.cameraView.zoom = initial.zoom;
      this.cameraView.center = { ...initial.center };
      this.cameraView.setTopHeadroom(initial.headroom);
      this.applyView();
    };

    const fitsAt = (headroom: number): boolean => {
      this.cameraView.zoom = initial.zoom;
      this.cameraView.center = { ...initial.center };
      this.cameraView.setTopHeadroom(headroom);
      this.applyView();
      const bounds = this.bossArtBounds(boss);
      return !!bounds && bounds.y >= targetTop;
    };

    // Measure the actual capped renderer bounds under the current pan/zoom. The
    // headroom changes camera scale, so each candidate must reproject the boss.
    if (fitsAt(0)) {
      restoreInitialCamera();
      return 0;
    }
    if (!fitsAt(maxHeadroom)) {
      restoreInitialCamera();
      return maxHeadroom;
    }
    let low = 0, high = maxHeadroom;
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      if (fitsAt(middle)) high = middle;
      else low = middle + 1;
    }

    restoreInitialCamera();
    return low;
  }

  private rectsOverlap(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }): boolean {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }

  private clampFloaterToField(text: Phaser.GameObjects.Text): void {
    const bounds = text.getBounds();
    const field = this.layout.field;
    const minX = field.x + 4, maxX = field.x + field.width - 4;
    const minY = field.y + 4, maxY = field.y + field.height - 4;
    let dx = 0, dy = 0;
    if (bounds.x < minX) dx = minX - bounds.x;
    else if (bounds.x + bounds.width > maxX) dx = maxX - bounds.x - bounds.width;
    if (bounds.y < minY) dy = minY - bounds.y;
    else if (bounds.y + bounds.height > maxY) dy = maxY - bounds.y - bounds.height;
    if (dx || dy) text.setPosition(text.x + dx, text.y + dy);
  }

  private placeFloaterClearOfBoss(text: Phaser.GameObjects.Text, boss: Enemy): void {
    this.clampFloaterToField(text);
    if (!this.bossBar?.visible || !this.bossBarBackdrop) return;
    const panel = { x: this.bossBar.x, y: this.bossBar.y, width: this.bossBarBackdrop.width, height: this.bossBarBackdrop.height };
    const sprite = this.bossSpriteScreenBounds(boss);
    const textBounds = text.getBounds();
    const obstacles = [panel, ...(sprite ? [sprite] : []), ...(this.hudStatus?.visible ? [this.hudStatus.getBounds()] : [])];
    if (!obstacles.some(obstacle => this.rectsOverlap(textBounds, obstacle))) return;

    const halfWidth = textBounds.width / 2;
    const halfHeight = textBounds.height / 2;
    const field = this.layout.field;
    const minX = field.x + halfWidth + 4;
    const maxX = field.x + field.width - halfWidth - 4;
    const minY = field.y + halfHeight + 4;
    const maxY = field.y + field.height - halfHeight - 4;
    if (minX > maxX || minY > maxY) return;
    const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));
    const xs = [text.x, minX, maxX, (minX + maxX) / 2,
      panel.x - halfWidth - 4, panel.x + panel.width + halfWidth + 4,
      ...(sprite ? [sprite.x - halfWidth - 4, sprite.x + sprite.width + halfWidth + 4] : [])]
      .map(value => clamp(value, minX, maxX));
    const ys = [text.y, minY, (minY + maxY) / 2, maxY, panel.y - halfHeight - 4, panel.y + panel.height + halfHeight + 4]
      .map(value => clamp(value, minY, maxY));
    const candidates = xs.flatMap(x => ys.map(y => ({ x, y })))
      .sort((a, b) => (a.x - text.x) ** 2 + (a.y - text.y) ** 2 - ((b.x - text.x) ** 2 + (b.y - text.y) ** 2));
    for (const point of candidates) {
      const candidate = { x: point.x - halfWidth, y: point.y - halfHeight, width: textBounds.width, height: textBounds.height };
      if (obstacles.some(obstacle => this.rectsOverlap(candidate, obstacle))) continue;
      text.setPosition(point.x, point.y);
      return;
    }
  }

  private repositionBossFloaters(boss?: Enemy): void {
    for (const floater of this.floaters) {
      if (boss) this.placeFloaterClearOfBoss(floater.text, boss);
      else this.clampFloaterToField(floater.text);
    }
  }

  private updateBossBar(): void {
    const boss = this.enemies.find(e => e.alive && e.isBoss);
    const compactActive = this.layout.compact && !!boss;
    const compactChanged = compactActive !== this.compactBossActive;
    this.compactBossActive = compactActive;
    this.startBtnLabel?.setVisible(true);
    this.bossBar?.setVisible(!!boss);
    if (!boss) {
      const hadTemporaryLayout = this.layout.portraitBossCommands || this.bossHudReservedHeight > 0;
      if (hadTemporaryLayout) this.setBossLayout(false, 0);
      else if (compactChanged) { this.updateHUD(); this.drawCatalog(); }
      return;
    }
    const pct = Math.max(0, Math.min(1, boss.maxHp > 0 ? boss.hp / boss.maxHp : 0));
    this.bossBarText?.setText(boss.name);
    this.bossBarHp?.setText(`HP ${Math.ceil(pct * 100)}%${this.campaign ? ` · Phase ${this.campaignBosses.phase(boss.id)}` : pct < 0.3 ? ' · Enraged' : ''}`);
    if (!this.bossBarBackdrop || !this.bossBarText || !this.bossBarHp) return;
    if(this.layout.compact){this.updateCompactBossBar(boss,pct);return;}
    const field = this.layout.field;
    const maxWidth = Math.min(440, field.width - 16);
    let width = maxWidth;
    let x = field.x + (field.width - width) / 2;
    const y = this.layout.hud + 8;
    const setTextWidth = (nextWidth: number): void => {
      width = nextWidth;
      const wrapWidth = width - 24;
      if (wrapWidth !== this.bossBarTextWrapWidth) {
        this.bossBarText!.setWordWrapWidth(wrapWidth);
        this.bossBarHp!.setWordWrapWidth(wrapWidth);
        this.bossBarTextWrapWidth = wrapWidth;
      }
    };
    const panelHeightAtWidth = (candidateWidth: number): number => {
      setTextWidth(candidateWidth);
      const wrappedName = this.bossBarText!.height > 20;
      const top = wrappedName ? 4 : 8;
      const gap = wrappedName ? 4 : 8;
      const trackHeight = wrappedName ? 6 : 8;
      const bottom = wrappedName ? 4 : 8;
      const statusY = top + this.bossBarText!.height + gap;
      const trackY = statusY + this.bossBarHp!.height + gap;
      return trackY + trackHeight + bottom;
    };
    const panelHeight = panelHeightAtWidth(width);
    const reservedHeight = Math.ceil(panelHeight + 18);
    const regularField = gameLayout(this.layout.width, this.layout.height, this.layout.safe).field;
    const needsPortraitBossCommands = this.layout.narrow && this.layout.width < this.layout.height
      && regularField.height < reservedHeight + 72;
    if (needsPortraitBossCommands !== this.layout.portraitBossCommands || reservedHeight !== this.bossHudReservedHeight) {
      this.setBossLayout(needsPortraitBossCommands, reservedHeight);
    }
    x = this.layout.field.x + (this.layout.field.width - width) / 2;
    if (this.layout.compact) this.hudStatus?.setVisible(false);

    const wrappedName = this.bossBarText.height > 20;
    const top = wrappedName ? 4 : 8;
    const gap = wrappedName ? 4 : 8;
    const trackHeight = wrappedName ? 6 : 8;
    const bottom = wrappedName ? 4 : 8;
    const statusY = top + this.bossBarText.height + gap;
    const trackY = statusY + this.bossBarHp.height + gap;
    const finalPanelHeight = trackY + trackHeight + bottom;
    this.bossBar?.setPosition(x, y);
    this.bossBarHp.setPosition(12, statusY);
    this.bossBarTrack?.setPosition(12, trackY).setSize(width - 24, trackHeight);
    this.bossBarFill?.setPosition(12, trackY).setDisplaySize((width - 24) * pct, trackHeight);
    this.bossBarBackdrop.setSize(width, finalPanelHeight);
    this.repositionBossFloaters(boss);
    const changed = finalPanelHeight !== this.bossPanelHeight;
    this.bossPanelHeight = finalPanelHeight;
    if (compactChanged || changed) this.drawCatalog();
  }

  private setBossLayout(portraitBossCommands: boolean, reservedHeight: number): void {
    const nextLayout = gameLayout(this.layout.width, this.layout.height, this.layout.safe, {
      portraitBossCommands, bossStatusHeight: this.layout.compact ? reservedHeight : 0
    });
    const baseField = nextLayout.field;
    const inset = this.layout.compact ? 0 : Math.max(0, Math.min(Math.round(reservedHeight), baseField.height - 72));
    const reservation = this.layout.compact ? reservedHeight : inset;
    if (portraitBossCommands === this.layout.portraitBossCommands && reservation === this.bossHudReservedHeight) return;
    const activeSheetScrollOffset = this.sheetKind && this.sheet ? this.sheet.scrollOffset : null;
    const commandRowChanged = portraitBossCommands !== this.layout.portraitBossCommands;
    const wasReserved = this.layout.portraitBossCommands || this.bossHudReservedHeight > 0;
    const willBeReserved = portraitBossCommands || reservation > 0;
    const cameraSnapshot = this.bossHudCameraBeforeReservation;
    const currentMatchesReservation = cameraSnapshot
      && Math.abs(this.cameraView.zoom - cameraSnapshot.reservedZoom) < 0.0001
      && Math.abs(this.cameraView.center.x - cameraSnapshot.reservedCenter.x) < 0.001
      && Math.abs(this.cameraView.center.y - cameraSnapshot.reservedCenter.y) < 0.001
      && this.cameraView.topHeadroom === cameraSnapshot.reservedHeadroom;
    const restoreCamera = !willBeReserved && !!cameraSnapshot && !!currentMatchesReservation;
    if (!wasReserved && willBeReserved) {
      this.bossHudCameraBeforeReservation = {
        zoom: this.cameraView.zoom,
        center: { ...this.cameraView.center },
        headroom: this.cameraView.topHeadroom,
        reservedZoom: this.cameraView.zoom,
        reservedCenter: { ...this.cameraView.center },
        reservedHeadroom: this.cameraView.topHeadroom
      };
    } else if (wasReserved && willBeReserved && cameraSnapshot && !currentMatchesReservation) {
      this.bossHudCameraBeforeReservation = null;
    }
    const currentCamera={zoom:this.cameraView.zoom,center:{...this.cameraView.center}};
    this.bossHudReservedHeight = reservation;
    this.layout = {
      ...nextLayout,
      field: inset > 0
      ? { ...baseField, y: baseField.y + inset, height: baseField.height - inset }
      : baseField
    };
    this.bossFitBoss=null;this.bossFitMap=null;
    this.cameraView.setContentFit(null);
    this.cameraView.setTopHeadroom(0);
    this.cameraView.zoom=currentCamera.zoom;this.cameraView.center=currentCamera.center;
    this.cameraView.resize(this.layout.field);
    if (restoreCamera && cameraSnapshot) {
      this.cameraView.zoom = cameraSnapshot.zoom;
      this.cameraView.center = { ...cameraSnapshot.center };
      this.cameraView.resize(this.layout.field);
    }
    this.applyView();
    for (const view of [...this.towers.map(tower => tower.view), ...this.enemies.map(enemy => enemy.view), this.ghost]) if (view) this.projectEntity(view);
    const activeBoss = this.enemies.find(enemy => enemy.alive && enemy.isBoss);
    if (willBeReserved && activeBoss) {
      if(this.layout.compact)this.refreshBossFit(activeBoss);
      else this.cameraView.setTopHeadroom(this.bossHeadroomForFit(activeBoss));
      this.applyView();
      for (const view of [...this.towers.map(tower => tower.view), ...this.enemies.map(enemy => enemy.view), this.ghost]) if (view) this.projectEntity(view);
    }
    if (willBeReserved && this.bossHudCameraBeforeReservation) {
      this.bossHudCameraBeforeReservation.reservedZoom = this.cameraView.zoom;
      this.bossHudCameraBeforeReservation.reservedCenter = { ...this.cameraView.center };
      this.bossHudCameraBeforeReservation.reservedHeadroom = this.cameraView.topHeadroom;
    } else if (!willBeReserved) this.bossHudCameraBeforeReservation = null;
    this.fieldMask?.refresh(this.layout.field);
    if (commandRowChanged) this.drawTowerPanel();
    if(this.layout.compact){this.drawHUD();this.drawControls();if(this.bossBar)this.uiRoot?.bringToTop(this.bossBar);}
    this.updateHUD();
    this.drawCatalog();
    this.repositionBossFloaters(this.enemies.find(enemy => enemy.alive && enemy.isBoss));
    this.drawCampaignCallout();
    if (activeSheetScrollOffset !== null) this.drawSheet(activeSheetScrollOffset);
  }

  // ---------- power-ups ----------
  private drawPowerupBar(): void {
    this.powerupRow?.destroy(true);this.powerupRow=null;
    if(this.sheetKind==='relics')this.drawSheet();
  }

  private inspectPowerup(index: number): void {
    const id = this.powerups[index]; if (!id) return;
    this.showRelicPanel(id, 'Stored Power-Up', false, () => this.activatePowerup(index), () => this.closeModal());
  }

  /** Store a relic; modal/choice rules per SPEC §24/§26. wantModal requests the
   *  reveal panel, which is only shown when it cannot interrupt combat. */
  private grantPowerup(id: PowerUpId, reason: string, wantModal: boolean): void {
    if (this.ended) return;
    const stored = this.vault.offer(id, reason, wantModal);
    this.drawPowerupBar();
    if (stored || this.auto.enabled) { this.floatText(520, 140, `${reason}: ${POWERUPS[id].name}`, C.gold, 14); SoundManager.get().powerup(); }
    this.presentReward(); this.updateHUD();
  }

  private presentReward(): void {
    if (this.inSimulationTick) return;
    if (this.auto.enabled || this.ended || this.modal || this.pendingMeteor || this.paused || !this.vault.pending.length) return;
    const reward = this.vault.pending[0];
    if (reward.reveal && this.waveActive) return;
    if (this.siege.phase === 'victory') { this.showVictoryReward(reward.id, reward.reason); return; }
    if (this.powerups.length >= 3) this.showInventoryFullModal(reward.id, reward.reason);
    else this.showPowerupModal(reward.id, reward.reason);
  }

  /** Victory decision: relics may only be stored (or replace the oldest) or discarded, never used. */
  private showVictoryReward(id: PowerUpId, reason: string): void {
    const full = this.powerups.length >= POWERUP_INVENTORY_LIMIT;
    this.showRelicPanel(id, reason, full, () => this.resolveVictoryReward(full ? 'replace-oldest' : 'store'), () => this.resolveVictoryReward('discard-new'), true);
  }

  private resolveVictoryReward(choice: 'store' | 'replace-oldest' | 'discard-new'): void {
    if (this.siege.phase !== 'victory' || !victoryRewardChoices(this.powerups.length).includes(choice)) return;
    this.vault.resolve(choice);
    this.closeModal(); this.drawPowerupBar(); this.presentReward(); this.renderVictory();
  }

  private showPowerupModal(id: PowerUpId, reason: string): void {
    this.showRelicPanel(id, reason, false, () => {
      const result = this.vault.beginPendingUse(this.towers.length > 0);
      this.finishUse(result);
    }, () => { this.vault.resolve('store'); this.closeModal(); this.drawPowerupBar(); this.presentReward(); });
  }

  private showRelicPanel(id: PowerUpId, reason: string, full: boolean, use: () => void, keep: () => void, victory = false): void {
    if (!this.rebuildingModal) this.modalError = '';
    this.cancelGesture();
    this.modalRenderer = () => this.showRelicPanel(id, reason, full, use, keep, victory);
    const cfg = POWERUPS[id];
    const reroll = this.canRerollReward(id, reason);
    this.pausedByModal = true;
    if (!this.rebuildingModal) SoundManager.get().powerup();
    if (this.layout.width < 768) {
      const width = this.layout.width - 24, height = Math.min(510, this.layout.height - 24);
      const root = this.modalFrame(width, height, 0x80674a);
      const sheet = new ScrollSheet(this, root, { x: 0, y: 0, width, height }, reason === 'Stored Power-Up' ? 'Stored Relic' : 'Power-Up Revealed', () => {}); this.modalSheet = sheet;
      for (const item of sheet.root.list.slice(3, 5)) (item as Phaser.GameObjects.Rectangle).setVisible(false);
      sheet.content.add(this.add.image(width / 2, 48, relicHeroTexture(this, id)).setDisplaySize(88, 88));
      sheet.text(104, `${cfg.name} · ${cfg.rarity.toUpperCase()}`, RARITY_COLOR[cfg.rarity], 18);
      const summary = sheet.text(140, this.modalError || cfg.description); this.modal!.setData('message', summary);
      let y = 156 + summary.height;
      if (victory) { const message = sheet.text(y, 'Continue into endless to use relics'); y += message.height + 12;
        sheet.action(y, full ? 'Replace oldest' : 'Store', use, 'primary'); sheet.action(y + 52, 'Discard new', keep);
      } else if (full) { const message = sheet.text(y, 'Inventory full · Choose one action to make room.'); y += message.height + 12;
        sheet.action(y, 'Use oldest', use, 'primary'); sheet.action(y + 52, 'Replace oldest', keep);
        sheet.action(y + 104, 'Discard new', () => { this.vault.resolve('discard-new'); this.closeModal(); this.presentReward(); });
      } else { sheet.action(y, cfg.requiresTarget ? 'Choose target' : 'Use Now', use, 'primary'); sheet.action(y + 52, reason === 'Stored Power-Up' ? 'Keep' : 'Store', keep); }
      if (reroll) sheet.action(y + (full ? 156 : 104), 'Reroll · Once this level', () => this.rerollReward(id, reason));
      this.updateHUD(); return;
    }
    const compact = this.layout.compact;
    const width = Math.min(compact ? 650 : 620, this.layout.width - 32);
    const height = (compact ? 324 : (full ? 348 : 332)) + (reroll ? 52 : 0);
    const rarityColor = Number(RARITY_COLOR[cfg.rarity].replace('#', '0x'));
    const c = this.modalFrame(width, height, 0x80674a);
    const frame = this.add.graphics();
    frame.lineStyle(1.5, 0x8a6a3e, 0.92).strokeRect(3, 3, width - 6, height - 6);
    frame.lineStyle(1, 0xd7aa4e, 0.5).strokeRect(7, 7, width - 14, height - 14);
    for (const [x, y, sx, sy] of [[10, 10, 1, 1], [width - 10, 10, -1, 1], [10, height - 10, 1, -1], [width - 10, height - 10, -1, -1]] as const) {
      frame.lineStyle(1.5, 0xd7aa4e, 0.82);
      frame.lineBetween(x, y + sy * 16, x, y);
      frame.lineBetween(x, y, x + sx * 16, y);
      frame.lineStyle(1, 0x8a6a3e, 0.8);
      frame.lineBetween(x + sx * 4, y + sy * 4, x + sx * 11, y + sy * 11);
    }
    frame.fillStyle(0xd7aa4e, 0.78);
    frame.fillPoints(V2([width / 2, 3, width / 2 + 5, 8, width / 2, 13, width / 2 - 5, 8]), true);
    c.add(frame);
    const accent = this.add.rectangle(5, 5, width - 10, height - 10, 0, 0).setOrigin(0).setStrokeStyle(1, rarityColor, 0.3);
    c.add(accent);
    if (!this.rebuildingModal) this.revealTimer = this.time.delayedCall(800, () => { accent.destroy(); this.revealTimer = null; });

    const title = full || reason !== 'Stored Power-Up' ? 'Power-Up Revealed' : 'Stored Power-Up';
    const headerWidth = Math.min(320, width - 48);
    c.add(this.add.rectangle(width / 2, 18, headerWidth, 28, C.bgRaised, 1).setStrokeStyle(1, 0xd7aa4e, 0.78));
    const headerTrim = this.add.graphics();
    headerTrim.lineStyle(1, 0xd7aa4e, 0.78);
    headerTrim.lineBetween(width / 2 - headerWidth / 2 - 14, 18, width / 2 - headerWidth / 2 + 2, 18);
    headerTrim.lineBetween(width / 2 + headerWidth / 2 - 2, 18, width / 2 + headerWidth / 2 + 14, 18);
    headerTrim.fillStyle(0xd7aa4e, 0.82);
    headerTrim.fillPoints(V2([width / 2 - headerWidth / 2 - 15, 18, width / 2 - headerWidth / 2 - 10, 14, width / 2 - headerWidth / 2 - 5, 18, width / 2 - headerWidth / 2 - 10, 22]), true);
    headerTrim.fillPoints(V2([width / 2 + headerWidth / 2 + 15, 18, width / 2 + headerWidth / 2 + 10, 14, width / 2 + headerWidth / 2 + 5, 18, width / 2 + headerWidth / 2 + 10, 22]), true);
    c.add(headerTrim);
    c.add(this.add.text(width / 2, 9, title, style(18, C.goldBright, true, FONT_DISPLAY)).setOrigin(0.5, 0));
    if (full) {
      c.add(this.add.text(width / 2, 32, 'INVENTORY FULL · 3/3', style(12, C.textSecondary, true)).setOrigin(0.5, 0));
    } else if (import.meta.env.DEV && reason === 'QA fixture') {
      c.add(this.add.text(width - 12, 14, 'DEV FIXTURE', style(12, C.textMuted, true)).setOrigin(1, 0));
    } else if (reason !== 'Stored Power-Up') {
      c.add(this.add.text(width / 2, 32, reason, style(12, C.textSecondary)).setOrigin(0.5, 0));
    }

    const portraitWidth = compact ? 180 : 174;
    const detailsX = portraitWidth + 22;
    const detailsWidth = width - detailsX - 16;
    const artY = 54;
    panel(this, c, 12, artY, portraitWidth, height - artY - 12, 0x80674a);
    const etching = this.add.graphics();
    etching.lineStyle(1, 0xd7aa4e, 0.34);
    etching.strokeRect(18, artY + 6, portraitWidth - 12, height - artY - 24);
    etching.lineStyle(1, 0x7f8c97, 0.3);
    etching.lineBetween(24, artY + 18, portraitWidth / 2, artY + 8);
    etching.lineBetween(portraitWidth - 6, artY + 18, portraitWidth / 2, artY + 8);
    c.add(etching);
    const heroSize = Math.min(compact ? 152 : 154, height - artY - 44);
    c.add(this.add.image(12 + portraitWidth / 2, artY + (height - artY - 12) / 2, relicHeroTexture(this, id)).setDisplaySize(heroSize, heroSize));

    const rarityBanner = this.add.rectangle(detailsX, artY + 6, detailsWidth, 26, rarityColor, 0.12).setOrigin(0).setStrokeStyle(1, rarityColor, 0.8);
    c.add(rarityBanner);
    c.add(this.add.text(detailsX + detailsWidth / 2, artY + 19, cfg.rarity.toUpperCase(), style(12, RARITY_COLOR[cfg.rarity], true)).setOrigin(0.5));
    c.add(this.add.text(detailsX, artY + 42, cfg.name, style(22, C.textPrimary, true, FONT_DISPLAY)).setWordWrapWidth(detailsWidth));
    const summaryY = artY + (full ? 100 : 82);
    const summary = this.add.text(detailsX, summaryY, this.modalError || cfg.description, style(14, C.textSecondary)).setWordWrapWidth(detailsWidth).setLineSpacing(2);
    c.add(summary); this.modal!.setData('message', summary);
    if (full) c.add(this.add.text(detailsX, artY + 76, 'Choose one action to make room.', style(12, C.textSecondary)));

    const y = height - 56;
    if (reroll) button(this, c, detailsX, y - 52, detailsWidth, 'Reroll · Once this level', () => this.rerollReward(id, reason), 'secondary', 44);
    if (victory) {
      c.add(this.add.text(detailsX, y - 24, 'Continue into endless to use relics', style(12, C.gold)).setWordWrapWidth(detailsWidth));
      const gap = 8;
      const choiceWidth = (detailsWidth - gap) / 2;
      button(this, c, detailsX, y, choiceWidth, full ? 'Replace oldest' : 'Store', use, 'primary', 44);
      button(this, c, detailsX + choiceWidth + gap, y, choiceWidth, 'Discard new', keep, 'secondary', 44);
    } else if (full) {
      const gap = 6;
      const choiceWidth = (detailsWidth - gap * 2) / 3;
      button(this, c, detailsX, y, choiceWidth, 'Use oldest', use, 'primary', 44);
      button(this, c, detailsX + choiceWidth + gap, y, choiceWidth, 'Replace oldest', keep, 'secondary', 44);
      button(this, c, detailsX + (choiceWidth + gap) * 2, y, choiceWidth, 'Discard new', () => { this.vault.resolve('discard-new'); this.closeModal(); this.presentReward(); }, 'secondary', 44);
    } else {
      const gap = 8;
      const choiceWidth = (detailsWidth - gap) / 2;
      button(this, c, detailsX, y, choiceWidth, cfg.requiresTarget ? 'Choose target' : 'Use Now', use, 'primary', 44);
      button(this, c, detailsX + choiceWidth + gap, y, choiceWidth, reason === 'Stored Power-Up' ? 'Keep' : 'Store', keep, 'secondary', 44);
    }
    this.updateHUD();
  }

  private showInventoryFullModal(id: PowerUpId, reason: string): void {
    this.showRelicPanel(id, reason, true, () => {
      const result = this.vault.beginUse(0, this.towers.length > 0);
      if (result.kind === 'target') this.storeAfterTarget = true;
      if (result.kind === 'apply') { this.applyPowerup(result.id); this.vault.resolve('store'); }
      this.finishUse(result, result.kind === 'apply');
    }, () => { this.vault.resolve('replace-oldest'); this.closeModal(); this.drawPowerupBar(); this.presentReward(); });
  }

  private rollReward(): PowerUpId { return this.campaign ? this.campaign.rollReward() : rollPowerUp(); }

  private canRerollReward(id: PowerUpId, reason: string): boolean {
    const reward = this.vault.pending[0];
    return !!this.campaign && reason !== 'QA fixture' && reason !== 'Stored Power-Up' && reward?.id === id && reward.reason === reason && this.campaign.canReroll(reward.reveal);
  }

  private rerollReward(id: PowerUpId, reason: string): void {
    if (!this.canRerollReward(id, reason) || this.pauseState.has('background')) return;
    const reward = this.vault.pending[0];
    const replacement = this.campaign!.reroll(id, reward.reveal);
    if (!replacement) return;
    reward.id = replacement; this.vault.revision++;
    this.closeModal(); this.presentReward();
  }

  private activatePowerup(index: number): void {
    if (this.siege.phase === 'victory' || this.siege.phase === 'terminal') return;
    this.finishUse(this.vault.beginUse(index, this.towers.length > 0));
  }

  private finishUse(result: ReturnType<RelicVault['beginUse']>, alreadyApplied = false): void {
    if (result.kind === 'empty') return;
    if (result.kind === 'unusable') {
      this.modalError = 'Build a tower before using Overcharge. This Power-Up remains yours.';
      const render = this.modalRenderer;
      if (render) {
        this.modalSheet?.destroy(); this.modalSheet = null; this.modal?.destroy(true); this.modal = null;
        this.rebuildingModal = true; render(); this.rebuildingModal = false;
      }
      return;
    }
    this.closeModal();
    if (result.kind === 'apply' && !alreadyApplied) this.applyPowerup(result.id);
    if (result.kind === 'target') { this.placingTowerId = null; this.hideGhost(); this.refreshPlots(); this.refreshPlacePanel(); this.floatText(520, 128, 'Choose a Meteor target · Escape cancels', C.fire, 16); }
    this.sheetKind = null; this.drawSheet(); this.showTouchPreview();
    this.drawPowerupBar(); this.presentReward(); this.updateHUD();
  }

  private applyPowerup(id: PowerUpId): void {
    if (this.siege.phase === 'victory' || this.siege.phase === 'terminal') return;
    const d = getDifficulty(this.difficultyId);
    switch (id) {
      case 'gold_rush': {
        const g = POWERUP_EFFECTS.gold.base + this.wave * POWERUP_EFFECTS.gold.perWave;
        this.gold += g;
        this.floatText(this.map.width / 2, 160, `Gold Rush! +${formatCount(g)} gold`, C.gold, 20);
        break;
      }
      case 'time_freeze':
        this.freezeUntil = this.gameTimeMs + POWERUP_EFFECTS.freezeMs;
        this.floatText(this.map.width / 2, 160, 'TIME FROZEN', C.frost, 22);
        break;
      case 'battle_cry':
        this.battleCryUntil = this.gameTimeMs + POWERUP_EFFECTS.tempo.durationMs;
        this.floatText(520, 160, 'Battle Tempo: +60% attack speed', C.fire, 18);
        break;
      case 'arcane_surge':
        this.surgeUntil = this.gameTimeMs + POWERUP_EFFECTS.surge.durationMs;
        this.floatText(this.map.width / 2, 160, 'ARCANE SURGE: +50% damage', C.arcane, 20);
        break;
      case 'emergency_repair': {
        const before = this.lives;
        this.lives = Math.min(this.maxLives, this.lives + POWERUP_EFFECTS.repairLives);
        this.floatText(this.map.width / 2, 160, `Repaired ${this.lives - before} lives`, C.health, 20);
        break;
      }
      case 'treasure_goblin':
        this.spawnEnemy('pilferer', 1);
        this.floatText(this.map.width / 2, 160, 'A Gilded Pilferer appears!', C.gold, 20);
        break;
      case 'double_bounty':
        this.doubleBountyUntil = this.gameTimeMs + POWERUP_EFFECTS.doubleBountyMs;
        this.floatText(this.map.width / 2, 160, 'DOUBLE BOUNTY for 20s', C.gold, 20);
        break;
      case 'tower_overcharge': {
        if (this.towers.length === 0) return;
        const t = this.towers[Math.floor(Math.random() * this.towers.length)];
        t.overchargeUntil = this.gameTimeMs + POWERUP_EFFECTS.overcharge.durationMs;
        this.floatText(t.x, t.y - 30, 'OVERCHARGED', C.mana, 16);
        break;
      }
      case 'ancient_blessing': {
        const roll = Math.random();
        if (roll < POWERUP_EFFECTS.blessing.coinChance) { const g = POWERUP_EFFECTS.blessing.goldBase + this.wave * POWERUP_EFFECTS.blessing.goldPerWave; this.gold += g; this.floatText(this.map.width / 2, 160, `Blessing of Coin: +${formatCount(g)} gold`, C.gold, 20); }
        else if (roll < POWERUP_EFFECTS.blessing.repairThreshold) { this.lives = Math.min(d.maxLives, this.lives + POWERUP_EFFECTS.blessing.repairLives); this.floatText(this.map.width / 2, 160, 'Blessing of Stone: +2 lives', C.health, 20); }
        else { this.surgeUntil = this.gameTimeMs + POWERUP_EFFECTS.surge.durationMs; this.floatText(this.map.width / 2, 160, 'Blessing of Stars: Surge', C.arcane, 20); }
        break;
      }
      case 'meteor_strike':
        break; // handled via castMeteor
    }
    if (this.field) refreshStronghold(this.field.stronghold, this.lives / this.maxLives);
    SoundManager.get().powerup();
    this.updateHUD();
  }

  private castMeteor(x: number, y: number, automatic = false): void {
    if (this.siege.phase === 'victory' || this.siege.phase === 'terminal') return;
    if (this.ended || this.vault.commitTarget() !== 'meteor_strike') return;
    const labelTarget = this.enemies.filter(e => e.alive && Math.hypot(e.x - x, e.y - y) <= POWERUP_EFFECTS.meteor.radius)
      .sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0];
    if (labelTarget) this.floatTextForEnemy(labelTarget, 'METEOR', C.fire, 18);
    else this.floatText(x, y - 40, 'METEOR', C.fire, 18);
    const blast = this.world(this.add.circle(x, y, POWERUP_EFFECTS.meteor.radius, 0xde8742, 0.25).setDepth(7));
    this.addEffect(blast, 450); SoundManager.get().cannon();
    for (const e of this.enemies) if (e.alive && Math.hypot(e.x - x, e.y - y) <= POWERUP_EFFECTS.meteor.radius) this.damageEnemy(e, POWERUP_EFFECTS.meteor.damage + this.wave * POWERUP_EFFECTS.meteor.perWave, 'arcane');
    if (!automatic) {
      if (this.storeAfterTarget) this.vault.resolve('store');
      this.storeAfterTarget = false;
      this.touchPreview = null; this.hideGhost(); this.showTouchPreview();
    }
    this.drawPowerupBar(); this.presentReward(); this.updateHUD();
  }

  // ---------- projectiles + impacts (bible §47-48: one identity per family) ----------

  private drawTempestArc(g: Phaser.GameObjects.Graphics, from: { x: number; y: number }, to: { x: number; y: number }, seed = 0): void {
    const dx = to.x - from.x; const dy = to.y - from.y;
    const length = Math.hypot(dx, dy) || 1;
    const segments = Math.max(3, Math.min(9, Math.ceil(length / 18)));
    const nx = -dy / length; const ny = dx / length;
    const points = [from];
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const jitter = Math.sin(i * 9.13 + seed * 0.037) * Math.min(8, length / segments * 0.42);
      points.push({ x: from.x + dx * t + nx * jitter, y: from.y + dy * t + ny * jitter });
    }
    points.push(to);
    g.lineStyle(3, 0x427d9a, 0.72);
    for (let i = 0; i < points.length - 1; i++) g.lineBetween(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
    g.lineStyle(1.25, 0xf3f7f4, 0.96);
    for (let i = 0; i < points.length - 1; i++) g.lineBetween(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
    if (segments >= 5) {
      const fork = points[Math.floor(segments / 2)];
      const side = seed % 2 ? 1 : -1;
      g.lineStyle(1.4, 0x85cde0, 0.86);
      g.lineBetween(fork.x, fork.y, fork.x + nx * 7 * side + dx / length * 3, fork.y + ny * 7 * side + dy / length * 3);
      g.lineStyle(0.8, 0xf3f7f4, 0.9);
      g.lineBetween(fork.x, fork.y, fork.x + nx * 7 * side + dx / length * 3, fork.y + ny * 7 * side + dy / length * 3);
    }
  }

  private fireProjectile(x1: number, y1: number, enemy: Enemy, shot: CampaignShot, chainIndex = 0, hit = new Set<number>(), visualStart?: { x: number; y: number }): void {
    if (this.ended) return;
    const towerId = shot.towerId;
    const cfg = TOWER_LIST.find(t => t.id === towerId)!;
    const durationMs = Math.max(40, Math.hypot(enemy.x - x1, enemy.y - y1) / cfg.projectileSpeed * 1000);
    const origin = visualStart ?? { x: x1, y: y1 };
    const view = this.world(this.add.container(origin.x, origin.y).setDepth(8));
    if (towerId === 'longbow') {
      // Arrow weight follows the branch captured on the shot, not the tower's current state.
      if (shot.branchId === 'marksman') {
        view.add(this.add.rectangle(0, 0, 18, 3, 0xd7aa4e));
        view.add(this.add.triangle(10, 0, 0, -4, 0, 4, 8, 0, 0xe8e2d4));
      } else if (shot.branchId === 'volley') {
        view.add(this.add.rectangle(0, 0, 12, 1.5, 0xd7aa4e));
        view.add(this.add.triangle(7, 0, 0, -2, 0, 2, 5, 0, 0xb7c0c7));
      } else {
        view.add(this.add.rectangle(0, 0, 14, 2, 0xd7aa4e));
        view.add(this.add.triangle(8, 0, 0, -3, 0, 3, 6, 0, 0xb7c0c7));
      }
    } else if (towerId === 'ember') {
      const shell = this.add.graphics();
      // A muted trailing wake separates the heavy shell from the busy painted field.
      shell.fillStyle(0x766651, 0.42);
      shell.fillEllipse(-22, 2, 23, 11); shell.fillEllipse(-31, 1, 14, 8);
      shell.fillStyle(0x473a30, 0.4); shell.fillEllipse(-29, 2, 12, 6);
      shell.lineStyle(2, 0x9a744d, 0.52); shell.lineBetween(-34, 1, -13, 1);
      shell.lineStyle(1.2, 0xde8742, 0.84); shell.lineBetween(-28, -2, -15, -2);
      shell.fillStyle(0x151d23, 0.99);
      shell.fillPoints(V2([-19, -7, 4, -7, 13, -3, 16, 0, 13, 3, 4, 7, -19, 7, -21, 4, -21, -4]), true);
      shell.fillStyle(0x46545c, 0.99);
      shell.fillPoints(V2([-17, -5, 4, -5, 11, -2.5, 13, 0, 11, 2.5, 4, 5, -17, 5, -19, 3, -19, -3]), true);
      shell.lineStyle(1.4, 0xb7c0c7, 0.94); shell.lineBetween(-14, -4, 3, -4);
      shell.lineStyle(1.2, 0x253039, 0.98); shell.lineBetween(-14, 4, 4, 4);
      shell.lineStyle(1.5, 0xc5cdd0, 0.9); shell.lineBetween(-7, -4, -7, 4); shell.lineBetween(1, -4, 1, 4);
      shell.fillStyle(0x182127, 1); shell.fillCircle(10, 0, 2);
      shell.fillStyle(0xde8742, 0.98); shell.fillCircle(-17, -1, 3); shell.fillCircle(-25, 3, 1.9);
      shell.fillStyle(0xffd17a, 0.98); shell.fillCircle(-17, -1, 1.3);
      view.add(shell);
    } else if (towerId === 'glacier') {
      const shard = this.add.graphics();
      shard.fillStyle(0x4da4ca, 0.94); shard.fillPoints(V2([-13,0,-4,-3,2,-8,0,-2,10,0,0,2,2,8,-4,3]), true);
      shard.fillStyle(0xe1f5fe, 0.92); shard.fillPoints(V2([-4,0,2,-6,0,-1,6,0,0,1,2,6]), true);
      shard.lineStyle(1, 0xf3f7f4, 0.72); shard.lineBetween(-10, 0, 0, 0);
      view.add(shard);
    } else if (towerId === 'starfire') {
      const orb = this.add.graphics();
      orb.lineStyle(1, 0x9e7ae6, 0.8); orb.strokeCircle(0, 0, 7);
      orb.fillStyle(0x6c4aa4, 0.94); orb.fillCircle(0, 0, 4.5);
      orb.fillStyle(0xe4d2ff, 1); orb.fillCircle(1.4, -1.2, 1.8);
      orb.fillStyle(0x9e7ae6, 0.7); orb.fillTriangle(-11, -2, -5, -4, -5, 4);
      view.add(orb);
    } else {
      if (typeof this.add.graphics === 'function') {
        const arc = this.add.graphics();
        this.drawTempestArc(arc, { x: -19, y: 1 }, { x: 2, y: -1 }, chainIndex + enemy.id);
        arc.lineStyle(1, 0x67d0c4, 0.95); arc.strokeCircle(0, 0, 5);
        arc.fillStyle(0xf3f7f4, 1); arc.fillCircle(0, 0, 2.2);
        view.add(arc);
      } else {
        // Some unit test stubs expose only a circle factory; production uses the segmented arc above.
        view.add(this.add.circle(0, 0, 5, 0x67d0c4, 0.9));
      }
    }
    const point = this.enemyImpactPoint(enemy);
    this.flights.push({ elapsedMs: 0, durationMs, x1: origin.x, y1: origin.y, x2: point.x, y2: point.y, targetId: enemy.id, towerId, shot, view, chainIndex, hit });
  }

  private updateFlights(gameDeltaMs: number): void {
    for (const flight of this.flights) {
      const target = this.enemies.find(e => e.id === flight.targetId && e.alive);
      if (target) { const point = this.enemyImpactPoint(target); flight.x2 = point.x; flight.y2 = point.y; }
    }
    const arrived = advanceFlights(this.flights, gameDeltaMs, this.ended);
    for (const flight of arrived) {
      flight.view.destroy(true);
      if (this.ended) continue;
      const target = this.enemies.find(e => e.id === flight.targetId && e.alive);
      if (!target) continue;
      const point = this.enemyImpactPoint(target);
      this.impactAt(point.x, point.y, flight.towerId);
      SoundManager.get().impact(flight.towerId);
      const shot = flight.shot;
      const st = shot.stats;
      if (st.splashRadius) {
        const blast = this.world(this.add.circle(target.x, target.y, st.splashRadius, 0xde8742, 0.16).setDepth(6)); this.addEffect(blast, 220);
        for (const enemy of this.enemies) if (enemy.alive && Math.hypot(enemy.x - target.x, enemy.y - target.y) <= st.splashRadius) this.damageEnemy(enemy, shot.rawDamage, st.damageType, shot);
        this.evolutionCombat.primaryHit(shot, target, this.gameTimeMs, !target.alive);
        if (this.towers.some(t => t.id === shot.ownerId)) this.evolutionCombat.addField(shot, target.x, target.y, this.gameTimeMs, shot.specialization?.burnDurationMs, shot.specialization?.burnDamageMultiplier);
      } else {
        this.damageEnemy(target, flight.chainIndex ? shot.rawDamage * 0.75 * (shot.specialization?.chainDamageMultiplier ?? 1) : shot.rawDamage, st.damageType, shot);
        if (shot.primary) this.evolutionCombat.primaryHit(shot, target, this.gameTimeMs, !target.alive);
        if (st.chainCount && flight.chainIndex + 1 < st.chainCount) {
          flight.hit.add(target.id);
          const next = nextChainTarget(this.enemies, target, flight.hit) as Enemy | null;
          if (next) {
            const nextPoint = this.enemyImpactPoint(next);
            if (typeof this.add.graphics === 'function') {
              const arc = this.world(this.add.graphics().setDepth(7));
              this.drawTempestArc(arc, point, nextPoint, next.id + flight.chainIndex);
              this.addEffect(arc, 160);
            }
            const chained = chainShot(shot.primary && shot.specialization?.primaryDamageMultiplier ? { ...shot, rawDamage: shot.rawDamage / shot.specialization.primaryDamageMultiplier } : shot);
            this.fireProjectile(target.x, target.y, next, chained, flight.chainIndex + 1, flight.hit, point);
          }
        }
      }
    }
  }

  private addEffect(view: Phaser.GameObjects.GameObject & { setAlpha(value: number): unknown }, duration: number): void {
    // ponytail: bounded short-lived VFX; pool only if profiling shows allocation pressure.
    if (this.effects.length >= 64) this.effects.shift()!.view.destroy();
    this.effects.push({ view, until: this.gameTimeMs + duration, duration });
  }

  private updateEffects(): void {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const effect = this.effects[i]; const remaining = effect.until - this.gameTimeMs;
      if (remaining <= 0) { effect.view.destroy(); this.effects.splice(i, 1); }
      else effect.view.setAlpha(Math.min(1, remaining / effect.duration));
    }
  }

  /** Impact language per family (§48). Effects disappear quickly. */
  private impactAt(x: number, y: number, towerId: string): void {
    const sx = this.layout.field.width / 1040;
    const sy = this.layout.field.height / 584;
    const g = towerId === 'ember'
      ? this.world(this.add.graphics().setPosition(x, y).setScale(1 / sx, 1 / sy).setDepth(7))
      : this.world(this.add.graphics().setDepth(7));
    if (towerId === 'ember') {
      // A compact warm burst, grounded by soot, dust, and a few stone/steel chips.
      g.fillStyle(0x262925, 0.36); g.fillEllipse(0, 8, 34, 14);
      g.fillStyle(0x51463d, 0.55);
      g.fillEllipse(-12, 2, 20, 10); g.fillEllipse(10, 5, 20, 9); g.fillEllipse(0, 8, 25, 8);
      g.fillStyle(0x88745a, 0.42); g.fillEllipse(-8, 4, 15, 7); g.fillEllipse(11, 2, 13, 6);
      g.lineStyle(2.4, 0x80502f, 0.9); g.strokeCircle(0, 0, 17);
      g.lineStyle(1.5, 0xe29a48, 0.98); g.strokeCircle(0, 0, 12);
      g.lineStyle(2, 0xde8742, 0.96);
      g.lineBetween(-17, -9, -22, -15); g.lineBetween(14, -11, 19, -17);
      g.lineBetween(16, 8, 23, 11); g.lineBetween(-12, 13, -17, 19);
      g.fillStyle(0x4a4c4a, 0.98);
      g.fillPoints(V2([-22, -15, -17, -14, -18, -9]), true);
      g.fillPoints(V2([19, -18, 23, -14, 18, -13]), true);
      g.fillPoints(V2([22, 10, 27, 11, 24, 15]), true);
      g.fillPoints(V2([-18, 19, -13, 17, -14, 22]), true);
      g.fillStyle(0xde8742, 0.98); g.fillCircle(0, 0, 9);
      g.fillStyle(0xf0b45c, 0.98); g.fillCircle(-1, -2, 5.5);
      g.fillStyle(0xffe4a3, 0.96); g.fillCircle(-2, -3, 2.5);
    } else if (towerId === 'glacier') {
      g.fillStyle(0x9fd4e8, 0.9);
      g.fillPoints(V2([x - 6, y, x - 2, y - 3, x + 2, y, x - 2, y + 3]), true);
      g.fillPoints(V2([x + 2, y - 4, x + 6, y - 6, x + 7, y - 1, x + 3, y + 1]), true);
      g.fillStyle(0xe1f5fe, 0.3);
      g.fillCircle(x, y, 10);
    } else if (towerId === 'starfire') {
      g.lineStyle(2, 0x9e7ae6, 1);
      g.strokeCircle(x, y, 8);
      g.fillStyle(0xd1b3ff, 1);
      g.fillPoints(V2([x, y - 5, x + 3, y, x, y + 5, x - 3, y]), true);
    } else if (towerId === 'tempest') {
      this.drawTempestArc(g, { x: x - 10, y: y + 4 }, { x: x + 9, y: y - 3 }, Math.round(x + y));
      this.drawTempestArc(g, { x: x - 4, y: y + 8 }, { x: x + 5, y: y + 1 }, Math.round(x - y));
      g.fillStyle(0xf3f7f4, 0.92); g.fillCircle(x, y, 2.2);
    } else {
      // Physical: small sparks/dust.
      g.fillStyle(0xd7aa4e, 1);
      g.fillCircle(x - 3, y - 2, 1.6);
      g.fillCircle(x + 3, y + 1, 1.6);
      g.fillStyle(0x8a8172, 0.8);
      g.fillCircle(x, y + 3, 2.2);
    }
    this.addEffect(g, 220);
  }

  /** Kill burst (dust/energy release, §62). */
  private impactBurst(x: number, y: number, color: number, n: number): void {
    const g = this.world(this.add.graphics().setDepth(7));
    g.fillStyle(color, 0.9);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = 4 + Math.random() * 10;
      g.fillCircle(x + Math.cos(a) * d, y + Math.sin(a) * d, 1.5 + Math.random() * 1.5);
    }
    this.addEffect(g, 260);
  }

  private damageEnemy(e: Enemy, raw: number, type: DamageType, shot?: CampaignShot): number {
    if (this.ended || !e.alive) return 0;
    const slowed = this.evolutionCombat.statuses(e.id, this.gameTimeMs).slowFactor > 0;
    const campaignResistance = this.campaign ? this.campaignBosses.incomingDamageMultiplier(e.id, type, this.gameTimeMs) : 1;
    const dealt = this.evolutionCombat.damage(raw * e.damageTakenMultiplier * campaignResistance * (slowed ? shot?.specialization?.slowedTargetDamageMultiplier ?? 1 : 1), type, e, this.gameTimeMs, shot);
    e.hp -= dealt;
    e.flashUntil = this.gameTimeMs + 110; // 50–100ms-class hit reaction (§63)
    if (e.hp <= 0 && e.alive) this.killEnemy(e);
    return dealt;
  }

  private killEnemy(e: Enemy): void {
    if (this.ended || !e.alive) return;
    e.alive = false;
    const scheduled = this.campaignScheduledIds.delete(e.id);
    if (this.campaign && scheduled) {
      this.campaignScheduledKills++;
      if (e.campaignId === this.campaign.definition.bossEnemyId) {
        this.campaignMissionBossKills = 1;
        this.campaign.bossKilled = true;
      }
    }
    this.clearCampaignOwnedSummons(this.campaignBosses.remove(e.id));
    this.evolutionCombat.removeEnemy(e.id);
    const siegeWave = this.scheduledBossIds.get(e.id);
    if (siegeWave !== undefined) { this.siege.bossKilled(siegeWave); this.scheduledBossIds.delete(e.id); this.refreshInfoPanel(); }
    const d = getDifficulty(this.difficultyId);
    const dbl = this.gameTimeMs < this.doubleBountyUntil;
    const reward = killReward(e.reward, d, dbl);
    this.gold += reward;
    this.enemiesKilled++;
    if (e.isElite) this.elitesKilled++;
    if (e.isBoss) {
      this.bossesKilled++;
      this.gold += waveClearBonus(this.wave);
      this.grantPowerup(this.rollReward(), 'Boss defeated', true);
    } else if (shouldDropOnKill(Math.random, POWERUP_DROP_CHANCE_PER_KILL)) {
      // Rare drops never interrupt combat: store + toast (SPEC §26, no long block).
      this.grantPowerup(this.rollReward(), 'Relic Found', false);
    }
    SoundManager.get().die();
    const point = this.enemyImpactPoint(e);
    this.floatTextForEnemy(e, `+${formatCount(reward)} gold`, C.gold, 14);
    this.impactBurst(point.x, point.y, e.isBoss ? 0xd85f59 : 0xcfc4ae, e.isBoss ? 10 : 5);
    this.startDeathAnim(e);
    this.updateHUD();
  }

  private floatText(x: number, y: number, msg: string, color: string, size = 14): void {
    if (!this.uiRoot) return;
    // Floating feedback lives in viewport space: the battlefield can shrink to 46% at 844x390,
    // while these glyphs keep a readable screen-pixel size.
    this.floatTextAtViewport(this.cameraView.project({ x, y }), msg, color, size);
  }

  private floatTextForEnemy(enemy: Enemy, msg: string, color: string, size = 14): void {
    const visual = enemy.view?.getData('enemyVisual') as { maxVisualDimension?: number } | undefined;
    const sy = this.layout.field.height / 584;
    const displayedHeight = (visual?.maxVisualDimension ?? enemy.radius * 2) * (enemy.view?.scaleY ?? 1) * sy;
    const point = this.cameraView.project(this.enemyRenderPoint(enemy));
    const bossBounds = enemy.isBoss ? this.bossArtBounds(enemy) : null;
    this.floatTextAtViewport({
      x: bossBounds ? bossBounds.x + bossBounds.width / 2 : point.x,
      y: bossBounds ? bossBounds.y - Math.max(13, size * 0.9) : point.y - displayedHeight - Math.max(13, size * 0.9)
    }, msg, color, size);
  }

  private floatTextAtViewport(point: { x: number; y: number }, msg: string, color: string, size: number): void {
    if (!this.uiRoot) return;
    if (this.floaters.length >= 12) this.floaters.shift()!.text.destroy();
    this.floaters = this.floaters.filter(floater => {
      if (Math.hypot(floater.text.x - point.x, floater.text.y - point.y) >= 40) return true;
      floater.text.destroy(); return false;
    });
    const pxSize = Math.max(14, size);
    const minY = this.layout.hud + pxSize / 2 + 2;
    const maxY = this.layout.height - this.layout.tray - pxSize / 2 - 2;
    const text = this.add.text(Math.max(100, Math.min(this.layout.field.width - 100, point.x)), Math.max(minY, Math.min(maxY, point.y)), msg,
      { ...style(pxSize, color, true), stroke: '#0A0E12', strokeThickness: 3 }).setOrigin(0.5).setDepth(40);
    this.uiRoot.add(text); this.floaters.push({ text, until: this.gameTimeMs + 1400 });
    const boss = this.enemies.find(enemy => enemy.alive && enemy.isBoss);
    if (boss) this.placeFloaterClearOfBoss(text, boss);
    else this.clampFloaterToField(text);
  }

  private fireTowers(dt: number): void {
    const cryActive = this.gameTimeMs < this.battleCryUntil;
    const surgeActive = this.gameTimeMs < this.surgeUntil;
    const cands = this.enemies.map(e => ({ id: e.id, x: e.x, y: e.y, hp: e.hp, maxHp: e.maxHp, distanceTraveled: e.distanceTraveled }));
    for (const t of this.towers) {
      if (this.gameTimeMs < t.frozenUntil) continue;
      t.cooldown -= dt;
      if (t.cooldown > 0) continue;
      const target = pickTarget(cands, t.x, t.y, t.stats.range, t.targeting);
      if (!target) { t.cooldown = 0; continue; }
      const enemy = this.enemies.find((e) => e.id === target.id);
      if (!enemy) continue;
      const multiplier = (surgeActive ? POWERUP_EFFECTS.surge.damageMultiplier : 1)
        * (this.gameTimeMs < t.overchargeUntil ? POWERUP_EFFECTS.overcharge.damageMultiplier : 1);
      const baseShot = this.evolutionCombat.makeShot(t, this.towers, multiplier, true, t.stats);
      const shot = specializeShot(baseShot, t.specialization);
      const interval = shot.stats.attackInterval * (cryActive ? POWERUP_EFFECTS.tempo.intervalMultiplier : 1);
      t.cooldown = Math.max(0, t.cooldown + interval);
      t.recoilUntil = this.gameTimeMs + 130; // attack animation reinforces cadence (§60)
      const snd = SoundManager.get();
      if (t.cfg.audioKey === 'cannon') snd.cannon();
      else if (t.cfg.audioKey === 'frost') snd.frost();
      else if (t.cfg.audioKey === 'zap') snd.zap();
      else snd.shoot();
      const mx = (t.view?.getData('muzzleX') as number | undefined) ?? 0;
      const my = (t.view?.getData('muzzleY') as number | undefined) ?? -48;
      const targets = shot.stats.volleyTargets > 1 ? volleyTargets(this.enemies, t, shot.stats, t.targeting) as Enemy[] : [enemy];
      for (let i = 0; i < targets.length; i++) {
        const splitShot = i > 0 && shot.specialization?.splitTargets ? { ...shot, primary: false, rawDamage: shot.rawDamage * (shot.specialization.splitDamageMultiplier ?? 1) } : shot;
        this.fireProjectile(t.x + mx * (t.view?.scaleX ?? 1), t.y + my * (t.view?.scaleY ?? 1), targets[i], splitShot);
      }
    }
  }

  private processFieldTicks(): void {
    for (const tick of this.evolutionCombat.tickFields(this.gameTimeMs)) {
      for (const e of this.enemies) {
        if (e.alive && Math.hypot(e.x - tick.x, e.y - tick.y) <= tick.radius) this.damageEnemy(e, tick.rawDamage, 'elemental');
      }
    }
  }

  /** One bounded burning-field circle per owner; views of expired or removed fields are destroyed. */
  private syncFieldViews(): void {
    const active = new Set<number>();
    for (const field of this.evolutionCombat.activeFields) {
      active.add(field.ownerId);
      const existing = this.fieldViews.get(field.ownerId);
      if (existing) { existing.setPosition(field.x, field.y).setRadius(field.radius); continue; }
      const view = this.world(this.add.circle(field.x, field.y, field.radius, 0xde8742, 0.18)
        .setStrokeStyle(2, 0xffb36b).setDepth(4.5));
      this.fieldViews.set(field.ownerId, view);
    }
    for (const [ownerId, view] of this.fieldViews) {
      if (active.has(ownerId)) continue;
      view.destroy();
      this.fieldViews.delete(ownerId);
    }
  }

  private tickCampaignBosses(): void {
    for (const event of this.campaignBosses.tick(this.enemies, this.towers, this.gameTimeMs)) {
      this.showCampaignCallout(event.text);
      if (event.summon) {
        const visualId = event.summon.kind === 'regent-clone' ? 'umbral_regent' : undefined;
        for (let i = 0; i < event.summon.count; i++) {
          const add = this.spawnEnemy(event.summon.enemyId, event.summon.hpBonus ?? 1, visualId);
          add.x = event.boss.x; add.y = event.boss.y;
          add.waypointIndex = event.boss.waypointIndex; add.distanceTraveled = event.boss.distanceTraveled;
          if (event.summon.kind === 'regent-clone' || event.summon.kind === 'echo-decoy') {
            const ownerId = event.summon.ownerId ?? event.boss.id;
            add.campaignBossOwnerId = ownerId;
            add.campaignCloneKind = event.summon.kind === 'regent-clone' ? 'regent_echo' : 'echo_decoy';
            add.name = event.summon.kind === 'regent-clone' ? 'Regent Echo' : 'Echo Decoy';
            add.reward = 0; add.isElite = false;
            this.campaignBosses.trackOwnedSummon(ownerId, add.id, event.summon.kind);
          }
        }
      }
      if (event.routeAdvanceFraction) this.advanceEnemyAlongRoute(event.boss, event.routeAdvanceFraction);
      if (event.presentationAction) {
        (event.boss.view?.getData('enemyVisual') as EnemyView | undefined)?.playAction(event.presentationAction);
      }
    }
  }

  private advanceEnemyAlongRoute(enemy: Enemy, routeFraction: number): void {
    const waypoints = this.map.waypoints;
    if (!enemy.alive || waypoints.length < 2 || !Number.isFinite(routeFraction) || routeFraction <= 0) return;
    let totalDistance = 0;
    for (let index = 1; index < waypoints.length; index++) totalDistance += Math.hypot(waypoints[index].x - waypoints[index - 1].x, waypoints[index].y - waypoints[index - 1].y);
    const guardDistance = totalDistance * CAMPAIGN_BOSS_TUNING.sovereignStrongholdGuardFraction;
    const currentDistance = Math.max(0, enemy.distanceTraveled);
    if (currentDistance >= guardDistance) return;
    const destinationDistance = Math.min(guardDistance, currentDistance + totalDistance * Math.min(routeFraction, CAMPAIGN_BOSS_TUNING.sovereignRouteFraction));
    if (destinationDistance <= currentDistance) return;

    let traversed = 0;
    for (let index = 1; index < waypoints.length; index++) {
      const start = waypoints[index - 1], end = waypoints[index];
      const segmentLength = Math.hypot(end.x - start.x, end.y - start.y);
      if (destinationDistance < traversed + segmentLength) {
        const progress = segmentLength > 0 ? (destinationDistance - traversed) / segmentLength : 0;
        enemy.x = start.x + (end.x - start.x) * progress;
        enemy.y = start.y + (end.y - start.y) * progress;
        enemy.waypointIndex = index;
        enemy.distanceTraveled = destinationDistance;
        enemy.heading = Math.atan2(end.y - start.y, end.x - start.x);
        return;
      }
      traversed += segmentLength;
    }
  }

  private clearCampaignOwnedSummons(childIds: readonly number[]): void {
    if (!childIds.length) return;
    const children = new Set(childIds);
    for (const child of this.enemies) {
      if (!children.has(child.id)) continue;
      child.alive = false;
      this.campaignBosses.remove(child.id);
      this.evolutionCombat.removeEnemy(child.id);
      this.destroyView(child);
    }
    this.enemies = this.enemies.filter(enemy => !children.has(enemy.id));
  }

  private syncEnemyAnimationPlayback(): void {
    const paused = this.paused || this.pausedByModal || this.gameTimeMs < this.freezeUntil;
    const sync = (view: Phaser.GameObjects.Container | null): void => {
      const visual = view?.getData('enemyVisual') as EnemyView | undefined;
      if (!visual) return;
      visual.sprite.anims.timeScale = this.speed;
      if (paused) visual.sprite.anims.pause();
      else visual.sprite.anims.resume();
    };
    for (const enemy of this.enemies) sync(enemy.view);
    for (const dying of this.dying) sync(dying.view);
  }

  private syncTowerFreezeViews(): void {
    if (!this.campaign) return;
    const telegraphs = this.campaignBosses.telegraphTargets();
    const active = new Set<number>();
    for (const tower of this.towers) {
      const frozen = this.gameTimeMs < tower.frozenUntil, marked = telegraphs.includes(tower.id);
      if (!frozen && !marked) continue;
      active.add(tower.id);
      let view = this.towerFreezeViews.get(tower.id);
      if (!view) { view = this.world(this.add.circle(tower.x, tower.y, 30, 0x9fd4e8, 0.08).setDepth(6)); this.towerFreezeViews.set(tower.id, view); }
      view.setStrokeStyle(frozen ? 4 : 2, frozen ? 0xe1f5fe : 0x9fd4e8, 0.95).setRadius(frozen ? 32 : 30);
    }
    for (const [id, view] of this.towerFreezeViews) if (!active.has(id)) { view.destroy(); this.towerFreezeViews.delete(id); }
  }

  // Combat uses fixed game-time steps; Auto and presentation observe visible frames.
  override update(time: number, deltaMs: number): void {
    if(this.trayDrag&&!this.isRunBlocked()){
      const v=edgePan(this.trayDrag.anchor,this.layout.field,this.overBattleControls(this.trayDrag.point));
      this.cameraView.pan(v.x*Math.min(deltaMs,100)/1000,v.y*Math.min(deltaMs,100)/1000);this.applyView();
      const plot=this.cameraView.nearest(this.map.buildable,this.trayDrag.anchor,28);
      const p=plot>=0?this.map.buildable[plot]:this.cameraView.unproject(this.trayDrag.anchor);this.updateGhost(p.x,p.y);
    }
    this.towerTray?.refresh(this.gold,this.placingTowerId as TowerId|null);
    const validDelta = Number.isFinite(deltaMs) && deltaMs > 0 ? deltaMs : 0;
    const autoDeltaMs = this.autoLastUpdateAt === null ? 0 : time - this.autoLastUpdateAt;
    if (Number.isFinite(time) && (this.autoLastUpdateAt === null || time >= this.autoLastUpdateAt)) this.autoLastUpdateAt = time;
    const beforeAuto = this.autoSnapshot();
    const frameWasWaiting = this.auto.enabled && !beforeAuto.blocked && !beforeAuto.waveActive &&
      (beforeAuto.phase === 'siege' || beforeAuto.phase === 'endless');
    if (!this.pauseState.has('background')) this.updateAchievementNotices(validDelta);
    if (this.isRunBlocked()) {
      this.auto.advance(0, this.autoSnapshot()); this.refreshAutoDisplay(); return;
    }
    this.runningDurationMs += validDelta;
    const consumed = this.simulationClock.advance(validDelta * this.speed, step => this.simulateTick(step));
    if (this.ended || this.siege.phase === 'terminal') return;
    this.renderFrame(consumed * SIMULATION_STEP_MS);
    this.tickAuto(autoDeltaMs, frameWasWaiting);
    this.refreshAutoDisplay(); this.presentReward();
    if (import.meta.env.DEV && this.gameTimeMs - this.lastQAStatusAt >= 500) {
      this.lastQAStatusAt = this.gameTimeMs; this.publishQAStatus();
    }
  }

  private simulateTick(stepMs: number): boolean {
    if (this.isRunBlocked()) return false;
    this.inSimulationTick = true;
    try {
      this.gameTimeMs += stepMs;
      while (this.spawnQueue.length && this.spawnQueue[0].atMs <= this.gameTimeMs) {
        const spawn = this.spawnQueue.shift()!;
        const enemy = this.spawnEnemy(spawn.enemyId, spawn.hpBonus);
        if (this.campaign) this.campaignScheduledIds.add(enemy.id);
        if (!this.campaign && enemy.isBoss && [10, 20, 30].includes(this.wave)) this.scheduledBossIds.set(enemy.id, this.wave);
      }
      if (this.campaign) this.tickCampaignBosses();
      this.moveEnemies(stepMs);
      if (this.isRunBlocked()) return false;
      this.enemies = this.enemies.filter(e => e.alive);
      this.updateFlights(stepMs); this.processFieldTicks();
      this.enemies = this.enemies.filter(e => e.alive);
      this.fireTowers(stepMs / 1000); this.checkWaveClear();
    } finally { this.inSimulationTick = false; }
    this.presentReward();
    return !this.isRunBlocked();
  }

  private moveEnemies(stepMs: number): void {
    const dt = stepMs / 1000;
    const wps = this.map.waypoints;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      if (e.regen > 0 && e.hp < e.maxHp) e.hp = Math.min(e.maxHp, e.hp + e.regen * dt);
      const status = this.evolutionCombat.statuses(e.id, this.gameTimeMs);
      const sp = e.effectiveSpeed(this.gameTimeMs, this.freezeUntil, status);
      // Boss enrage below 30% HP (one of max two early mechanics: regen + enrage).
      const enraged = !this.campaign && e.isBoss && e.hp < e.maxHp * BOSS_BEHAVIOR.enrageHpFraction;
      const v = sp * (enraged ? BOSS_BEHAVIOR.enrageSpeedMultiplier : 1);
      const fromX = e.x;
      const fromY = e.y;
      let remaining = v * dt;
      let guard = 0;
      while (remaining > 0 && e.waypointIndex < wps.length && guard++ < 8) {
        const wp = wps[e.waypointIndex];
        const dx = wp.x - e.x; const dy = wp.y - e.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= remaining || dist < 1) {
          e.x = wp.x; e.y = wp.y;
          e.distanceTraveled += dist;
          remaining -= dist;
          e.waypointIndex++;
        } else {
          e.x += (dx / dist) * remaining;
          e.y += (dy / dist) * remaining;
          e.distanceTraveled += remaining;
          remaining = 0;
        }
      }
      if (e.waypointIndex >= wps.length) {
        if (this.handleLeak(e)) return;
      } else {
        // Heading + walk cycle + hit pop + status rings (bible §61, §63).
        const movedX = e.x - fromX;
        const movedY = e.y - fromY;
        if (movedX * movedX + movedY * movedY > 0.01) e.heading = Math.atan2(movedY, movedX);

      }
      // Late-game summoning (wave 20+ only — early bosses stay at 2 mechanics).
      if (!this.campaign && e.isBoss && e.alive && this.wave >= BOSS_BEHAVIOR.summonFromWave && Math.floor(this.gameTimeMs / BOSS_BEHAVIOR.summonIntervalMs) !== Math.floor((this.gameTimeMs - stepMs) / BOSS_BEHAVIOR.summonIntervalMs)) {
        for (let i = 0; i < BOSS_BEHAVIOR.summonCount; i++) {
          const d = getDifficulty(this.difficultyId);
          const m = new Enemy('gloomite', enemyHpForWave('gloomite', this.wave, d, 1), enemySpeedForWave('gloomite', this.wave, d), ENEMIES.gloomite.baseReward);
          m.x = e.x - 10 - i * 12; m.y = e.y + 8;
          m.waypointIndex = e.waypointIndex;
          m.distanceTraveled = e.distanceTraveled - 20;
          this.makeEnemyVisual(m);
          this.enemies.push(m);
        }
        this.floatTextForEnemy(e, 'Warlord calls the swarm', C.arcane, 14);
      }
    }
  }

  private renderFrame(processedGameMs: number): void {
    this.updateCampaignCallout();
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const status = this.evolutionCombat.statuses(e.id, this.gameTimeMs);
      const movedX = Math.cos(e.heading), movedY = Math.sin(e.heading);
        const frozen = status.frozen || status.stunned || this.gameTimeMs < e.frozenUntil || this.gameTimeMs < this.freezeUntil;
        const slowed = !frozen && status.slowFactor > 0;
        const data = (e.view?.getData('bobAmp') as number | undefined) ?? 1.6;
        const freq = (e.view?.getData('bobFreq') as number | undefined) ?? 9;
        const tSec = this.gameTimeMs / 1000;
        const point = this.enemyRenderPoint(e);
        e.view?.setPosition(point.x, point.y);
        e.view?.setRotation(0).setDepth(3 + point.y / 1000);
        const visual = e.view?.getData('enemyVisual') as { setFacing?: (dx: number, dy: number) => void; setWalking?: (walking: boolean) => void } | undefined;
        if (e.campaignId) (visual as { setCampaignState?: (state: { phase: number; telegraph: boolean; guarded: boolean }) => void } | undefined)?.setCampaignState?.(this.campaignBosses.presentation(e.id, this.gameTimeMs));
        visual?.setFacing?.(movedX, movedY); visual?.setWalking?.(!frozen && e.effectiveSpeed(this.gameTimeMs, this.freezeUntil, status) > 0);
        const sprite = (visual as { sprite?: Phaser.GameObjects.Sprite } | undefined)?.sprite;
        if (sprite) sprite.anims.timeScale = this.speed * (slowed ? 1 - status.slowFactor : 1);
        const edge = e.view?.getData('silhouetteEdge') as Phaser.GameObjects.Image | undefined;
        if (sprite && edge) edge.setFrame(sprite.frame.name);
        const bobY = frozen ? 0 : Math.abs(Math.sin(tSec * freq + e.phase)) * -data;
        const pop = this.gameTimeMs < e.flashUntil ? 1.16 : 1;
        e.body?.setPosition(0, bobY);
        e.body?.setScale(pop);
        if (e.isBoss && e.view) this.projectEntity(e.view);
        const sx = this.layout.field.width / 1040; const sy = this.layout.field.height / 584;
        const dimension = (visual as { maxVisualDimension?: number } | undefined)?.maxVisualDimension ?? e.radius * 2;
        e.shadow?.setPosition(point.x, point.y + 2 / sy).setSize(dimension * 0.62 / sx, (e.isBoss ? 12 : 7) / sy).setAlpha(0.4);
        // One status ring, strongest effect first: stun, freeze, vulnerability, slow.
        const ring: [number, number, number] | null = status.stunned ? [3, 0xffee58, 1]
          : frozen ? [3, 0xe1f5fe, 1]
          : status.vulnerability > 1 ? [2, 0xba68c8, 0.9]
          : slowed ? [2, 0x9fd4e8, 0.85] : null;
        e.slowRing?.setPosition(point.x, point.y).setVisible(ring !== null);
        if (ring) e.slowRing?.setStrokeStyle(ring[0], ring[1], ring[2]);
        if (e.hpBar && (e.hp < e.maxHp || e.isElite || e.isBoss)) {
          e.hpBar.clear();
          const w = (e.isBoss ? 44 : 26) * 1040 / this.layout.field.width;
          const barHeight = (e.isBoss ? 5 : 4) * 584 / this.layout.field.height;
          const visualHeight = ((visual as { maxVisualDimension?: number } | undefined)?.maxVisualDimension ?? e.radius * 2) * (e.view?.scaleY ?? 1);
          let barX = point.x, barY = point.y - visualHeight - 4 / sy;
          const healthAnchor = e.isBoss ? this.bossHealthBarAnchor(e) : null;
          if (healthAnchor) {
            barX = healthAnchor.x;
            barY = healthAnchor.y;
          }
          e.hpBar.fillStyle(0x000000, 0.7);
          e.hpBar.fillRect(barX - w / 2, barY, w, barHeight);
          e.hpBar.fillStyle(e.isBoss ? 0xd85f59 : 0xb65b50, 1);
          e.hpBar.fillRect(barX - w / 2, barY, w * Math.max(0, e.hp / e.maxHp), barHeight);
        } else e.hpBar?.clear();
    }
    for (const flight of this.flights) {
      const k = flight.elapsedMs / flight.durationMs;
      flight.view.setPosition(flight.x1 + (flight.x2 - flight.x1) * k, flight.y1 + (flight.y2 - flight.y1) * k)
        .setRotation(Math.atan2(flight.y2 - flight.y1, flight.x2 - flight.x1));
    }
    for (const tower of this.towers) tower.crown?.setScale(this.gameTimeMs < tower.recoilUntil ? 0.88 : 1);
    this.syncFieldViews(); this.syncTowerFreezeViews(); this.updateBossBar(); this.updateDying(); this.updateEffects();
    this.worldRoot?.sort('depth');
    const activeBoss = this.enemies.find(enemy => enemy.alive && enemy.isBoss);
    for (const f of this.floaters) {
      f.text.y -= processedGameMs * 0.02;
      if (activeBoss) this.placeFloaterClearOfBoss(f.text, activeBoss);
      else this.clampFloaterToField(f.text);
      f.text.alpha = Math.max(0, Math.min(1, (f.until - this.gameTimeMs) / 700));
    }
    while (this.floaters.length > 0 && this.floaters[0].until <= this.gameTimeMs) {
      const f = this.floaters.shift()!;
      f.text.destroy();
    }
  }

  /** An enemy reached the stronghold. Returns true when the run ended. */
  private handleLeak(e: Enemy): boolean {
    e.alive = false;
    e.reachedEnd = true;
    this.clearCampaignOwnedSummons(this.campaignBosses.remove(e.id));
    this.evolutionCombat.removeEnemy(e.id);
    this.lives = Math.max(0, this.lives - e.livesLost);
    SoundManager.get().leak();
    this.floatText(this.map.stronghold.x - 40, this.map.stronghold.y - 60, `-${e.livesLost} lives`, C.dangerBright, 16);
    this.destroyView(e);
    if (this.field) refreshStronghold(this.field.stronghold, this.lives / this.maxLives);
    this.updateHUD();
    if (this.lives <= 0) {
      this.lives = 0;
      this.finishRun('defeat');
      return true;
    }
    if (this.campaign && e.isBoss) { this.finishCampaign('siege-failed'); return true; }
    const wave = this.scheduledBossIds.get(e.id);
    if (wave === undefined) return false;
    this.scheduledBossIds.delete(e.id);
    const outcome = this.siege.bossEscaped(wave, this.lives);
    if (!outcome) return false;
    this.finishRun(outcome);
    return true;
  }

  // Wave clear → bonus + guaranteed milestone relic on non-boss 5th waves (SPEC §22).
  private checkWaveClear(): void {
    if (!this.waveActive) return;
    const clearInput = { wave: this.wave, lives: this.lives, spawns: this.spawnQueue.length, enemies: this.enemies.filter((e) => e.alive).length, flights: this.flights.length, fields: this.evolutionCombat.activeFieldCount };
    const event = this.campaign
      ? clearInput.lives > 0 && clearInput.spawns + clearInput.enemies + clearInput.flights + clearInput.fields === 0 ? 'wave-cleared' : 'none'
      : this.siege.completeWave(clearInput);
    if (event === 'none') return;
    this.waveActive = false; this.wavesCompleted = this.campaign ? this.wave : this.siege.wavesCompleted;
    const earned = this.campaign ? [] : earnedBranches(this.wave, this.lives, this.towers, this.debugAssisted);
    const known = this.unlockRepository.view().profile.earned;
    for (const id of earned) if (!known[id] && !this.unlocksEarnedThisRun.includes(id)) this.unlocksEarnedThisRun.push(id);
    if (!this.campaign) this.unlockRepository.earn(earned);
    if (earned.length && this.runAccount) void accountSystem.progressChanged(this.runAccount);
    if(earned.length&&this.runOwner?.mode==='guest'&&!this.debugAssisted){const fresh=Object.fromEntries(this.unlocksEarnedThisRun.map(id=>[id,this.unlockRepository.view().profile.earned[id]??new Date().toISOString()]));void accountSystem.guestProgressChanged(fresh);}
    this.notifyAchievements();
    const bonus = waveClearBonus(this.wave); this.gold += bonus;
    this.floatText(this.map.width / 2, 140, `Wave ${this.wave} cleared! +${formatCount(bonus)} gold`, C.health, 18);
    if (this.campaign?.readyToClear(this.wave, this.lives, this.spawnQueue.length + this.enemies.filter(e => e.alive).length + this.flights.length + this.evolutionCombat.activeFieldCount)) { this.finishCampaign('victory'); return; }
    if (this.wave % 5 === 0 && !this.currentWaveIsBoss) this.grantPowerup(this.rollReward(), `Wave ${this.wave} Relic`, true);
    if (event === 'victory') this.enterVictory();
    this.updateNextPreview(); this.updateHUD();
  }

  private enterVictory(): void {
    this.auto.cancelCountdown();
    this.vault.cancelTarget(); this.storeAfterTarget = false;
    this.placingTowerId = null; this.selectedTower = null;
    this.hideGhost(); this.renderVictory(); this.presentReward(); this.updateHUD();
  }

  /** Non-blocking decision panel: lives in uiRoot, not this.modal, so Pause stays reachable. */
  private renderVictory(): void {
    this.victoryPanel?.destroy(true); this.victoryPanel = null;
    if (!this.uiRoot) return;
    const f = this.layout.field;
    const width = Math.min(360, f.width - 24), height = 212;
    const c = this.add.container(f.x + (f.width - width) / 2, f.y + Math.max(8, (f.height - height) / 2)).setDepth(1500);
    this.uiRoot.add(c); this.victoryPanel = c;
    panel(this, c, 0, 0, width, height, 0xd7aa4e);
    c.add(this.add.text(width / 2, 14, 'Siege complete', style(22, C.goldBright, true, FONT_DISPLAY)).setOrigin(0.5, 0));
    c.add(this.add.text(width / 2, 50, `Score ${formatCount(this.scoreSoFar())} · Lives ${this.lives}/${this.maxLives}`, style(14, C.textPrimary, true)).setOrigin(0.5, 0));
    const unlocked = this.unlocksEarnedThisRun.length ? `Unlocked: ${this.unlocksEarnedThisRun.map((id) => EVOLUTIONS[id].name).join(', ')}` : '';
    c.add(this.add.text(width / 2, 74, unlocked, style(12, C.textSecondary)).setOrigin(0.5, 0).setWordWrapWidth(width - 32));
    const resolved = victoryRewardsResolved(this.vault, this.modal !== null, this.auto.enabled);
    const suffix = resolved ? '' : ' · Resolve rewards first';
    const kind = resolved ? 'primary' : 'secondary';
    button(this, c, 16, 104, width - 32, `Finish Run${suffix}`, () => this.chooseVictory('finish'), kind, 44);
    button(this, c, 16, 156, width - 32, `Continue Endless${suffix}`, () => this.chooseVictory('continue'), kind, 44);
  }

  private chooseVictory(action: 'finish' | 'continue'): void {
    if (this.siege.phase !== 'victory' || this.pauseState.blocked) return;
    if (!this.siege.choose(action, victoryRewardsResolved(this.vault, this.modal !== null, this.auto.enabled))) return;
    this.victoryPanel?.destroy(true); this.victoryPanel = null;
    if (action === 'finish') this.finishRun('victory');
    else { this.updateNextPreview(); this.updateHUD(); }
  }

  private gameOver(): void { this.finishRun('defeat'); }

  private restartRun(): void {
    if (!accountEntryAllowed()) { this.scene.start('Login'); return; }
    this.scene.restart({ difficulty: this.difficultyId, playerName: this.playerName, ...(this.campaign ? { mode: 'campaign', campaignLevel: this.campaign.definition.level, campaignVisualTier: this.towerVisualTier } : {}), ...(import.meta.env.DEV && this.qaCampaignFixture ? { qaCampaignFixture: this.qaCampaignFixture } : {}) } satisfies GameStartData);
  }

  private finishCampaign(outcome: RunOutcome): void {
    const campaign = this.campaign;
    if (!campaign || campaign.settled || this.ended) return;
    const unresolved = this.spawnQueue.length + this.enemies.filter(e => e.alive).length + this.flights.length + this.evolutionCombat.activeFieldCount;
    if (outcome === 'victory' && !campaign.readyToClear(this.wave, this.lives, unresolved)) return;
    campaign.settled = true; this.ended = true; this.waveActive = false;
    const breakdown = calculateCampaignScore({ scheduledEnemiesKilled: this.campaignScheduledKills,
      wavesCompleted: this.wavesCompleted, missionBossesKilled: this.campaignMissionBossKills,
      remainingLives: this.lives });
    const score = breakdown.finalScore;
    const fixtureRepository = import.meta.env.DEV ? this.qaCampaignRepository : null;
    const clear = outcome === 'victory' && (!this.debugAssisted || fixtureRepository) ? (fixtureRepository ?? campaignRepository).recordClear(campaign.definition.level, score, this.lives) : null;
    this.campaignResult = { outcome, score, lives: this.lives, scheduledEnemiesKilled: this.campaignScheduledKills, wavesCompleted: this.wavesCompleted, missionBossesKilled: this.campaignMissionBossKills, clear, breakdown };
    if ((this.runAccount||this.runOwner) && !this.debugAssisted && !this.qaCampaignFixture) {
      this.settleCapturedRun({ mode: 'campaign', payload: {
        runId: this.runId, campaignVersion: 1, progressionVersion: 1, level: campaign.definition.level,
        outcome, finalScore: score, remainingLives: this.lives, gameDurationSeconds: Math.floor(this.runningDurationMs / 1000), gameVersion: GAME_VERSION,
        campaignScoreVersion: CAMPAIGN_SCORE_VERSION, scheduledEnemiesKilled: this.campaignScheduledKills,
        wavesCompleted: this.wavesCompleted, missionBossesKilled: this.campaignMissionBossKills
      }});
    }
    this.spawnQueue = [];
    this.campaignScheduledIds.clear();
    for (const flight of this.flights) flight.view.destroy(true);
    for (const effect of this.effects) effect.view.destroy();
    this.flights = []; this.effects = [];
    this.vault = new RelicVault(); this.storeAfterTarget = false;
    this.placingTowerId = null; this.selectedTower = null; this.touchPreview = null;
    this.closeModal(); this.cleanupProgression(); this.hideGhost();
    SoundManager.get().gameover(); SoundManager.get().stopMusic();
    this.renderCampaignResult(); this.updateHUD();
  }

  private renderCampaignResult(): void {
    if (!this.campaign || !this.campaignResult) return;
    this.modalSheet?.destroy(); this.modalSheet = null;
    this.modal?.destroy(true); this.modal = null;
    this.modalRenderer = () => this.renderCampaignResult();
    const result = this.campaignResult, level = this.campaign.definition.level, totalMasteryStars = CAMPAIGN_LEVELS.length * 3;
    const repository = this.qaCampaignRepository ?? campaignRepository;
    const view = repository.view(), metadata = campaignScoreMetadata(level), finalScore = result.breakdown.finalScore;
    const width = Math.min(480, this.layout.width - 24), height = Math.min(450, this.layout.height - 24);
    const root = this.modalFrame(width, height);
    const sheet = new ScrollSheet(this, root, { x: 0, y: 0, width, height }, result.outcome === 'victory' ? `Level ${level} cleared` : result.outcome === 'siege-failed' ? 'Boss escaped · Battle failed' : 'Stronghold lost', () => this.scene.start('Campaign'));
    this.modalSheet = sheet;
    let y = 0;
    const line = (message: string, color: string = C.textSecondary) => { const text = sheet.text(y, message, color); y += text.height + 12; };
    if (import.meta.env.DEV && this.qaCampaignFixture) line('DEV CAMPAIGN FIXTURE · Reward preview · Not saved', C.gold);
    line(`Scheduled enemies: ${formatCount(result.scheduledEnemiesKilled)} × 10 = ${formatCount(result.breakdown.killScore)} points`);
    line(`Waves cleared: ${formatCount(result.wavesCompleted)} × 100 = ${formatCount(result.breakdown.waveBonus)} points`);
    line(metadata.hasBoss
      ? `Mission boss: ${formatCount(result.missionBossesKilled)} × 500 = ${formatCount(result.breakdown.bossBonus)} points`
      : `Mission boss: Not applicable · ${formatCount(result.breakdown.bossBonus)} points`);
    line(`Remaining lives: ${formatCount(result.lives)} × 50 = ${formatCount(result.breakdown.livesBonus)} points`);
    line(`Final score: ${formatCount(finalScore)}`, C.gold);
    line(`Score target: ${formatCount(metadata.scoreTarget)} points — ${finalScore >= metadata.scoreTarget ? 'reached' : 'missed'}`);
    const progress = view.profile.levels[level];
    const currentBest = progress?.campaignScore?.bestScore ?? null;
    line(`Current best: ${currentBest === null ? 'Not scored yet' : `${formatCount(currentBest)} points`}`);
    if ((progress?.bestScore ?? 0) > 0) line(`Legacy score — excluded from current total: ${formatCount(progress!.bestScore)} points`, C.textMuted);
    if (result.outcome !== 'victory') line('Winning clears contribute to your campaign ranking. This failure does not improve your best.', C.gold);
    for(const r of campaignRequirements(view,level).filter(r=>r.id!=='previous')){
      line(`${r.met?'★':'☆'} ${r.label} · ${r.progress}${r.met?'':` · ${r.nextStep}`}`);
    }
    if (this.runAccount||this.runOwner) line(accountStatus(accountSystem.view()));
    if (result.clear) {
      const cleared = result.clear.progress, newStars = new Set(result.clear.newlyEarnedStars);
      const starState = (kind: 'completion' | 'lives' | 'score', earned: boolean) => newStars.has(kind) ? 'newly earned' : earned ? 'retained from earlier progress' : 'not earned';
      line(`Completion star: ${starState('completion', cleared.completionStar)}`);
      line(`Lives star: ${starState('lives', cleared.livesStar)}`);
      line(`Score star: ${starState('score', cleared.scoreStar)}`);
      line(result.clear.newlyEarnedStars.length ? `New stars: ${result.clear.newlyEarnedStars.join(', ')} · Total ${formatCount(result.clear.totalMasteryStars)}/${formatCount(totalMasteryStars)}` : `Total ${formatCount(result.clear.totalMasteryStars)}/${formatCount(totalMasteryStars)} · Stars retained from earlier clears`);
      if (result.clear.newlyEarnedSigils.length) line(`World Sigil earned: ${result.clear.newlyEarnedSigils.map(id => id.replace(/_/g, ' ')).join(', ')}`, C.gold);
      if (result.clear.newlyUnlockedFeatures.length) line(`Unlocked: ${result.clear.newlyUnlockedFeatures.map(id => id.replace(/_/g, ' ')).join(', ')}`, C.gold);
      line(view.unsavedLevels.has(level) ? 'Earned this session · Progress could not be saved' : 'Progress saved in this browser', view.unsavedLevels.has(level) ? C.dangerBright : C.health);
      if (view.warning) line(view.warning, C.dangerBright);
    } else line(result.outcome === 'victory' ? 'Assisted battle · Campaign progress was not awarded' : 'No stars awarded · Replay to clear this level');
    const actions=campaignResultActions(result.outcome,level,(this.qaCampaignRepository??campaignRepository).view().highestUnlockedLevel,CAMPAIGN_LEVELS.length);
    if(actions[0]==='next'){sheet.action(y, `Next · Level ${level + 1}`, () => this.scene.start('Preload', { stage: 'gameplay', destination: 'Game', data: { difficulty: 'medium', playerName: this.playerName, mode: 'campaign', campaignLevel: level + 1, ...(import.meta.env.DEV && this.qaCampaignFixture ? { qaCampaignFixture: { state: 'campaign', level: level + 1, bossPhase: 'initial' } satisfies QACampaignFixture } : {}) } } satisfies LoadingRequest), 'primary'); y+=52;}
    sheet.action(y, 'Restart Level', () => this.restartRun(), actions[0]==='next'?'secondary':'primary'); y += 52;
    sheet.action(y, 'World Map', () => this.scene.start('Campaign')); y += 52;
  }

  private finishRun(outcome: RunOutcome): void {
    if (this.campaign) { this.finishCampaign(outcome); return; }
    if (this.ended) return;
    if (outcome !== 'victory' && !this.siege.fail(outcome)) return;
    this.ended = true;
    const progress = this.siege.progress();
    const remainingLives = outcome === 'defeat' ? 0 : this.lives;
    this.waveActive = false; this.spawnQueue = [];
    for (const flight of this.flights) flight.view.destroy(true);
    this.flights = [];
    SoundManager.get().gameover();
    SoundManager.get().stopMusic();
    const d = getDifficulty(this.difficultyId);
    const breakdown = calculateScore(
      { enemiesKilled: this.enemiesKilled, elitesKilled: this.elitesKilled, wavesCompleted: progress.wavesCompleted, bossesKilled: this.bossesKilled, remainingLives, unusedGold: this.gold },
      d
    );
    const duration = Math.floor(this.runningDurationMs / 1000);
    const isPersonalBest = breakdown.finalScore > (loadBest()?.score ?? -1);
    saveBest({ score: breakdown.finalScore, wave: progress.highestWave, difficulty: this.difficultyId, date: new Date().toISOString() });
    const result: GameOverData = {
      runOwner:this.runOwner??undefined,
      difficulty: this.difficultyId,
      playerName: this.playerName,
      highestWave: progress.highestWave,
      wavesCompleted: progress.wavesCompleted,
      outcome: progress.outcome,
      siegeBossesDefeated: progress.siegeBossesDefeated,
      finalScore: breakdown.finalScore,
      enemiesKilled: this.enemiesKilled,
      bossesKilled: this.bossesKilled,
      remainingLives,
      gameDurationSeconds: duration,
      runId: this.runId,
      gameVersion: GAME_VERSION,
      scoreVersion: SCORE_VERSION,
      breakdown,
      isPersonalBest,
      unlocksEarned: this.unlocksEarnedThisRun.map((branchId) => ({ branchId, saved: !this.unlockRepository.view().unsaved.has(branchId) })),
      worldSnapshot: {
        mapId: this.map.id,
        strongholdRatio: remainingLives / this.maxLives,
        towers: this.towers.map(t => ({ towerId: t.towerId, level: t.level, x: t.x, y: t.y, branchId: t.progression.branchId, rank: t.progression.rank, masteryRank: t.progression.masteryRank })),
        enemies: this.enemies.filter(e => e.alive).map(e => ({ archetype: e.archetype, x: e.x, y: e.y, hpFraction: Math.max(0, e.hp / e.maxHp) }))
      }
    };
    if ((this.runAccount||this.runOwner) && !this.debugAssisted) {
      this.settleCapturedRun({ mode: 'classic', payload: {
        playerName: result.playerName, difficulty: result.difficulty, highestWave: result.highestWave,
        finalScore: result.finalScore, enemiesKilled: result.enemiesKilled, bossesKilled: result.bossesKilled,
        remainingLives: result.remainingLives, gameDurationSeconds: result.gameDurationSeconds, runId: result.runId,
        gameVersion: result.gameVersion, scoreVersion: result.scoreVersion, wavesCompleted: result.wavesCompleted,
        outcome: result.outcome, siegeBossesDefeated: result.siegeBossesDefeated
      }});
    }
    if (result.worldSnapshot && result.worldSnapshot.strongholdRatio <= .02) {
      this.scene.start('Preload', { stage: 'defeat', destination: 'GameOver', data: result } satisfies LoadingRequest);
    } else this.scene.start('GameOver', result);
    this.cleanupProgression();
  }

  private settleCapturedRun(result:RunResult):void {
    if(this.runOwner?.mode==='guest'){
      const earned=Object.fromEntries(this.unlocksEarnedThisRun.map(id=>[id,this.unlockRepository.view().profile.earned[id]??new Date().toISOString()]));
      void accountSystem.completeGuestRun(this.runOwner,guestRunProgress(result,earned));
    }else if(this.runAccount)void accountSystem.settle(this.runAccount,result);
  }

  /** Idempotent; restart/quit discard the run without creating a result. */
  private cleanupProgression(): void {
    this.cancelGesture();this.pauseState.set('details',false);
    this.campaignCallout = null;
    this.campaignCalloutView?.destroy(); this.campaignCalloutView = null;
    this.simulationClock.reset(); this.inSimulationTick = false;
    this.auto.reset();
    this.autoLastUpdateAt = null;
    this.autoLastKeyAt = -Infinity;
    this.evolutionCombat.clear();
    this.campaignBosses.clear();
    for (const view of this.towerFreezeViews.values()) view.destroy();
    this.towerFreezeViews.clear();
    this.syncFieldViews();
    this.scheduledBossIds.clear(); this.campaignScheduledIds.clear();
    this.victoryPanel?.destroy(true); this.victoryPanel = null;
    if (this.progressionListenerAttached && typeof window !== 'undefined') window.removeEventListener('storage', this.handleStorage);
    this.progressionListenerAttached = false;
    this.achievementNotices = [];
    this.achievementNoticeView?.destroy(); this.achievementNoticeView = null;
  }

  /** Latest ability cue stays in the UI for three seconds of game time, including across resize. */
  private showCampaignCallout(text: string): void {
    this.campaignCallout = { text, until: this.gameTimeMs + 3000 };
    this.drawCampaignCallout();
  }

  private updateCampaignCallout(): void {
    if (!this.campaignCallout || this.gameTimeMs < this.campaignCallout.until) return;
    this.campaignCallout = null;
    this.campaignCalloutView?.destroy(); this.campaignCalloutView = null;
  }

  private drawCampaignCallout(): void {
    this.campaignCalloutView?.destroy(); this.campaignCalloutView = null;
    this.updateCampaignCallout();
    if (!this.campaignCallout || !this.uiRoot) return;
    const f = this.layout.field;
    const view = this.add.text(f.x + f.width / 2, f.y + f.height - 12, this.campaignCallout.text, {
      ...style(14, C.frost, true), backgroundColor: `#${C.bgPanel.toString(16).padStart(6, '0')}`, padding: { x: 8, y: 4 }
    }).setOrigin(0.5, 1).setWordWrapWidth(Math.min(420, f.width - 40)).setAlign('center').setDepth(1400);
    this.uiRoot.add(view); this.campaignCalloutView = view;
  }

  /** Queue one 3000 ms notice per newly earned branch; never pauses the run. */
  private notifyAchievements(): void {
    for (const branchId of this.unlocksEarnedThisRun) {
      if (this.notifiedAchievements.has(branchId)) continue;
      this.notifiedAchievements.add(branchId);
      this.achievementNotices.push({ branchId, remainingMs: 3000 });
    }
    this.drawAchievementNotice();
  }

  private updateAchievementNotices(visibleDeltaMs: number): void {
    const head = this.achievementNotices[0];
    if (!head) return;
    head.remainingMs -= visibleDeltaMs;
    if (head.remainingMs > 0) return;
    this.achievementNotices.shift();
    this.drawAchievementNotice();
  }

  private achievementNoticeText(branchId: BranchId): string {
    const text = `Unlocked: ${EVOLUTIONS[branchId].name}`;
    return this.unlockRepository.view().unsaved.has(branchId) ? `${text} · ${SAVE_FAILED_WARNING}` : text;
  }

  private drawAchievementNotice(): void {
    this.achievementNoticeView?.destroy(); this.achievementNoticeView = null;
    const head = this.achievementNotices[0];
    if (!head || this.uiRoot === null) return;
    const f = this.layout.field;
    const text = this.add.text(f.x + f.width / 2, this.layout.height - this.layout.tray - 12, this.achievementNoticeText(head.branchId), style(14, C.goldBright, true))
      .setOrigin(0.5, 1).setWordWrapWidth(f.width - 24).setAlign('center').setDepth(1400);
    this.uiRoot.add(text); this.achievementNoticeView = text;
  }
}
