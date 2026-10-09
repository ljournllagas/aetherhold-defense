import Phaser from 'phaser';
import { TOWERS } from '../config/towers.ts';
import { C, FONT_DISPLAY, style } from '../ui/tokens.ts';
import { ensureArtTextures } from '../art/artkit.ts';
import { ensureTowerPortraits } from '../art/towerArt.ts';

const TOWER_SHEET = { frameWidth: 627, frameHeight: 627 };
const TOWER_ASSETS = {
  longbow: '/assets/towers/tower_ranger_stages-v2.webp',
  ember: '/assets/towers/tower_bombard_stages-v1.webp',
  glacier: '/assets/towers/tower_frost_stages-v1.webp',
  starfire: '/assets/towers/tower_arcane_stages-v1.webp',
  tempest: '/assets/towers/tower_tempest_stages-v1.webp'
} as const;
const EMBER_STAGE_ASSETS = [
  ['tower_ember_stage_1_v2', '/assets/towers/tower_bombard_stage1-v2.webp'],
  ['tower_ember_stage_2_v2', '/assets/towers/tower_bombard_stage2-v2.webp'],
  ['tower_ember_stage_3_v2', '/assets/towers/tower_bombard_stage3-v2.webp']
] as const;

/** Loads the painted battlefield and sprite atlases with real loader progress. */
export class PreloadScene extends Phaser.Scene {
  private loadingRoot: Phaser.GameObjects.Container | null = null;
  private progress = 0;
  private errorText = '';
  private readonly resizeLoading = (): void => this.drawLoading();
  constructor() {
    super('Preload');
  }

  preload(): void {
    this.progress = 0; this.errorText = ''; this.drawLoading();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.resizeLoading);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off(Phaser.Scale.Events.RESIZE, this.resizeLoading));
    this.load.on('progress', (value: number) => { this.progress = value; this.drawLoading(); });
    this.load.on('loaderror', (file: Phaser.Loader.File) => { this.errorText = `Could not load ${file.key}`; this.drawLoading(); });

    this.load.image('map_ancient_border_keep', '/assets/world/maps/ancient-border-keep-map-v2.webp');
    this.load.image('map_ancient_border_keep_defeated', '/assets/world/maps/ancient-border-keep-defeated-v1.webp');

    for (const [id, path] of Object.entries(TOWER_ASSETS)) {
      this.load.spritesheet(TOWERS[id].assetKey, path, TOWER_SHEET);
    }
    for (const [key, path] of EMBER_STAGE_ASSETS) this.load.image(key, path);

    // The lossless transport siblings retain the source dimensions required by
    // enemyAtlasFrames.json and its per-frame crop coordinates.
    this.load.image('enemy_walk_atlas_nature-v2', '/assets/enemies/enemy_walk_atlas_nature-v2.webp');
    this.load.image('enemy_walk_atlas_warden-v1', '/assets/enemies/enemy_walk_atlas_warden-v1.webp');
    this.load.image('enemy_walk_atlas_elite-v1', '/assets/enemies/enemy_walk_atlas_elite-v1.webp');

    this.load.image('relic_icons_atlas', '/assets/powerups/relic-icons-atlas-v1.webp');
    this.load.image('hud_icons_atlas', '/assets/ui/hud-icons-atlas-v1.webp');
    this.load.image('difficulty_helm_easy', '/assets/ui/difficulty-helm-easy-v1.webp');
    this.load.image('difficulty_helm_medium', '/assets/ui/difficulty-helm-medium-v1.webp');
    this.load.image('difficulty_helm_hard', '/assets/ui/difficulty-helm-hard-v1.webp');
    this.load.image('stronghold_beacon_atlas', '/assets/world/overlays/borderkeep-beacon-states-v1.webp');
    this.load.image('emblem', '/assets/branding/aegis-emblem-v1.webp');
    this.load.image('menu_vista', '/assets/world/vistas/ancient-border-keep-vista-v1.webp');
    this.load.image('menu_vista_sunset', '/assets/world/vistas/ancient-border-keep-vista-menu-v2.webp');
  }

  create(): void {
    ensureArtTextures(this);
    ensureTowerPortraits(this);

    const fontsReady = (document as Document).fonts?.ready ?? Promise.resolve();
    void fontsReady.then(() => {
      if (this.scene.isActive('Preload')) this.scene.start('MainMenu');
    });
    // Keep the entry flow moving if a browser's font promise never resolves.
    this.time.delayedCall(2500, () => {
      if (this.scene.isActive('Preload')) this.scene.start('MainMenu');
    });
  }

  private drawLoading(): void {
    this.loadingRoot?.destroy(true);
    const W = this.scale.width || 1280, H = this.scale.height || 720;
    const root = this.add.container(0, 0); this.loadingRoot = root;
    const barW = Math.min(420, W - 32), barX = (W - barW) / 2;
    this.cameras.main.setBackgroundColor('#0A0E12');
    root.add(this.add.text(W / 2, H * .32, 'AEGIS OF THE BORDERKEEP', style(W < 768 ? 22 : 34, C.gold, true, FONT_DISPLAY)).setWordWrapWidth(W - 32).setAlign('center').setOrigin(.5));
    root.add(this.add.text(W / 2, H * .46, 'Ancient Border Keep', style(16, C.textSecondary)).setOrigin(.5));
    root.add(this.add.rectangle(barX, H * .54, barW, 12, C.bgRaised).setOrigin(0));
    root.add(this.add.rectangle(barX, H * .54, Math.max(4, barW * this.progress), 12, 0xd7aa4e).setOrigin(0));
    root.add(this.add.text(W / 2, H * .64, this.errorText || `Loading the borderlands… ${Math.round(this.progress * 100)}%`, style(14, this.errorText ? C.dangerBright : C.textSecondary)).setWordWrapWidth(W - 32).setAlign('center').setOrigin(.5));
  }
}
