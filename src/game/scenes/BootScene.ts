import Phaser from 'phaser';
import { accountSystem } from '../systems/AccountSystem.ts';

// Boot is deliberately small: production images load in Preload, where progress
// comes from Phaser's real loader rather than a timer.
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    void accountSystem.initialize().then(() => {
      const accountRoute = typeof location !== 'undefined' && /authError|accountDelete/.test(location.search);
      this.scene.start('Preload', { stage: 'menu', destination: accountSystem.canStartBattle() && !accountRoute ? 'MainMenu' : 'Login' });
    });
  }
}
