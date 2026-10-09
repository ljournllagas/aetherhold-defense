import Phaser from 'phaser';

// Boot is deliberately small: production images load in Preload, where progress
// comes from Phaser's real loader rather than a timer.
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    this.scene.start('Preload');
  }
}
