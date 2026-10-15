import Phaser from 'phaser';
import { accountSystem } from '../systems/AccountSystem.ts';
import { STAGE_ASSETS } from '../art/assetManifest.ts';
import { ensureUiFonts, warmImages } from '../ui/fonts.ts';

// Boot is deliberately small: production images load in Preload, where progress
// comes from Phaser's real loader rather than a timer.
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    // The account check below is a network round-trip; fetch fonts and menu art alongside it, not after it.
    void ensureUiFonts();
    warmImages(STAGE_ASSETS.menu.map(asset => asset.path));
    void accountSystem.initialize().then(() => {
      const accountRoute = typeof location !== 'undefined' && /authError|accountDelete/.test(location.search);
      this.scene.start('Preload', { stage: 'menu', destination: accountSystem.canStartBattle() && !accountRoute ? 'MainMenu' : 'Login' });
    });
  }
}
