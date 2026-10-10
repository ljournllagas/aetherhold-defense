import Phaser from 'phaser';
import type { DifficultyId } from '../../shared/types.ts';
import type { GameOverData } from './GameOverScene.ts';
import { createQACampaignRepository, isQACampaignFixture, type QACampaignFixture } from '../qa.ts';
import { C, FONT_DISPLAY, style } from '../ui/tokens.ts';
import { button } from '../ui/components.ts';
import { ensureArtTextures, ensureMenuTextures } from '../art/artkit.ts';
import { ensureTowerPortraits } from '../art/towerArt.ts';
import { requiredAssetsForRequest, type AssetSpec } from '../art/assetManifest.ts';
import { campaignVisualTier } from '../campaign/battle.ts';
import { campaignRepository } from '../campaign/progress.ts';
import type { CampaignVisualTier } from '../campaign/types.ts';

export interface GameStartData { difficulty: DifficultyId; playerName: string; mode?: 'classic' | 'campaign'; campaignLevel?: number; campaignVisualTier?: CampaignVisualTier; qaCampaignFixture?: QACampaignFixture; }
export type LoadingRequest =
  | { stage: 'menu'; destination: 'MainMenu'; data?: undefined }
  | { stage: 'campaign'; destination: 'Campaign'; data?: undefined }
  | { stage: 'gameplay'; destination: 'Game'; data: GameStartData }
  | { stage: 'gameplay' | 'defeat'; destination: 'GameOver'; data: GameOverData };

/** The request owns its callbacks and starts only after complete asset readiness. */
export class PreloadScene extends Phaser.Scene {
  private request: LoadingRequest = { stage: 'menu', destination: 'MainMenu' };
  private generation = 0;
  private state: 'loading' | 'failed' | 'ready' = 'loading';
  private required: readonly AssetSpec[] = [];
  private destinationStarted = false;
  private created = false;
  private loadingRoot: Phaser.GameObjects.Container | null = null;
  private progress = 0;
  private errorText = '';
  private fontTimer: Phaser.Time.TimerEvent | null = null;
  private removeLoaderListeners: (() => void) | null = null;
  private readonly resizeLoading = (): void => this.drawLoading();
  constructor() { super('Preload'); }

  init(request?: LoadingRequest): void {
    this.releaseCallbacks(); this.generation++;
    const next = request?.stage ? request : { stage: 'menu' as const, destination: 'MainMenu' as const };
    this.request = next.stage === 'gameplay' && next.destination === 'Game' && next.data.mode === 'campaign'
      ? this.snapshotCampaignTier(next) : next;
    this.required = this.request.destination === 'Game'
      ? requiredAssetsForRequest(this.request.stage, this.request.data)
      : requiredAssetsForRequest(this.request.stage);
    this.state = 'loading'; this.destinationStarted = false; this.created = false;
    this.progress = 0; this.errorText = '';
  }
  preload(): void {
    this.drawLoading(); this.scale.on(Phaser.Scale.Events.RESIZE, this.resizeLoading);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdownLoading, this);
    this.bindLoader(); this.queueMissing();
  }
  create(): void { this.created = true; this.completeLoading(this.generation); }
  private assetReady(asset: AssetSpec): boolean {
    return this.textures.exists(asset.key) && (asset.kind !== 'sheet' || this.textures.get(asset.key).has('3'));
  }
  private snapshotCampaignTier(request: Extract<LoadingRequest, { destination: 'Game' }>): Extract<LoadingRequest, { destination: 'Game' }> {
    const fixture = import.meta.env.DEV && isQACampaignFixture(request.data.qaCampaignFixture)
      && request.data.campaignLevel === request.data.qaCampaignFixture.level ? request.data.qaCampaignFixture : undefined;
    const view = fixture ? createQACampaignRepository(fixture).view() : campaignRepository.view();
    const visualTier = fixture?.visualTier ?? request.data.campaignVisualTier ?? campaignVisualTier(view);
    return { ...request, data: { ...request.data, campaignVisualTier: visualTier } };
  }
  private queueMissing(): void {
    for (const asset of this.required) {
      if (this.assetReady(asset)) continue;
      if (this.textures.exists(asset.key)) this.textures.remove(asset.key);
      if (asset.kind === 'sheet') this.load.spritesheet(asset.key, asset.path, { frameWidth: asset.frameWidth, frameHeight: asset.frameHeight });
      else this.load.image(asset.key, asset.path);
    }
  }
  private bindLoader(): void {
    this.removeLoaderListeners?.();
    const generation = this.generation;
    const progress = (value: number) => { if (generation === this.generation) { this.progress = value; this.drawLoading(); } };
    const failed = (file: Phaser.Loader.File) => {
      if (generation !== this.generation || !this.required.some(a => a.key === file.key)) return;
      this.state = 'failed'; this.errorText = 'Some artwork could not load. Retry to continue.'; this.drawLoading();
    };
    const complete = () => this.completeLoading(generation);
    this.load.on('progress', progress); this.load.on('loaderror', failed); this.load.on('complete', complete);
    this.removeLoaderListeners = () => { this.load.off('progress', progress); this.load.off('loaderror', failed); this.load.off('complete', complete); };
  }
  private completeLoading(generation: number): void {
    if (generation !== this.generation || !this.created || this.destinationStarted || this.state === 'failed') return;
    if (this.required.some(asset => !this.assetReady(asset))) {
      this.state = 'failed'; this.errorText = 'Some artwork is unavailable. Retry to continue.'; this.drawLoading(); return;
    }
    this.state = 'ready'; this.progress = 1;
    if (this.request.stage === 'menu' || this.request.stage === 'campaign') ensureMenuTextures(this);
    else { ensureArtTextures(this); ensureTowerPortraits(this); }
    const transition = () => {
      if (generation !== this.generation || !this.scene.isActive('Preload') || this.state !== 'ready' || this.destinationStarted) return;
      this.destinationStarted = true; this.scene.start(this.request.destination, this.request.data);
    };
    if (this.request.stage !== 'menu') {
      // Phaser's SceneManager.create() runs scene.create() and only assigns CONST.RUNNING
      // after it returns, so the isActive guard is false while this runs during create.
      // Defer by one tick so the guard evaluates against the real running state.
      if (this.scene.isActive('Preload')) transition();
      else this.time.delayedCall(0, transition);
      return;
    }
    const fontsReady = typeof document !== 'undefined' ? document.fonts?.ready ?? Promise.resolve() : Promise.resolve();
    void fontsReady.then(transition, transition);
    this.fontTimer?.remove(); this.fontTimer = this.time.delayedCall(2500, transition);
  }
  private retryLoading(): void {
    if (this.state !== 'failed' || this.destinationStarted) return;
    this.generation++; this.state = 'loading'; this.progress = 0; this.errorText = '';
    this.bindLoader(); this.queueMissing(); this.drawLoading(); this.load.start();
  }
  private returnToMenu(): void {
    if (this.request.stage === 'menu') { window.location.reload(); return; }
    this.generation++; this.releaseCallbacks(); this.load.reset?.(); this.scene.start('MainMenu');
  }
  private releaseCallbacks(): void {
    this.removeLoaderListeners?.(); this.removeLoaderListeners = null;
    this.fontTimer?.remove(); this.fontTimer = null;
  }
  private shutdownLoading(): void {
    this.generation++; this.releaseCallbacks(); this.created = false;
    this.scale.off(Phaser.Scale.Events.RESIZE, this.resizeLoading);
    this.loadingRoot?.destroy(true); this.loadingRoot = null;
  }
  private drawLoading(): void {
    this.loadingRoot?.destroy(true);
    const W = this.scale.width || 1280, H = this.scale.height || 720;
    const root = this.add.container(0, 0); this.loadingRoot = root;
    const barW = Math.min(420, W - 32), barX = (W - barW) / 2;
    this.cameras.main.setBackgroundColor('#0A0E12');
    root.add(this.add.text(W / 2, H * .28, 'AEGIS OF THE BORDERKEEP', style(W < 768 ? 22 : 34, C.gold, true, FONT_DISPLAY)).setWordWrapWidth(W - 32).setAlign('center').setOrigin(.5));
    root.add(this.add.text(W / 2, H * .42, this.request.stage === 'menu' ? 'Ancient Border Keep' : this.request.destination === 'GameOver' ? 'Your defense is remembered' : 'Preparing your defense', style(16, C.textSecondary)).setWordWrapWidth(W - 32).setAlign('center').setOrigin(.5));
    root.add(this.add.rectangle(barX, H * .52, barW, 12, C.bgRaised).setOrigin(0));
    root.add(this.add.rectangle(barX, H * .52, Math.max(4, barW * this.progress), 12, 0xd7aa4e).setOrigin(0));
    root.add(this.add.text(W / 2, H * .64, this.errorText || `Loading the borderlands… ${Math.round(this.progress * 100)}%`, style(14, this.errorText ? C.dangerBright : C.textSecondary)).setWordWrapWidth(W - 32).setAlign('center').setOrigin(.5));
    const width = Math.min(220, W - 32), y = Math.min(H - 104, H * .77);
    if (this.state === 'failed') button(this, root, (W - width) / 2, y, width, 'Retry', () => this.retryLoading(), 'primary', 44);
    if (this.request.stage !== 'menu' || this.state === 'failed') button(this, root, (W - width) / 2, y + 52, width, this.request.stage === 'menu' ? 'Reload' : 'Back to Keep', () => this.returnToMenu(), 'secondary', 44);
  }
}
