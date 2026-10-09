import Phaser from 'phaser';

// One painted view of the same borderkeep realm used by the battlefield. The
// live menu text and controls remain separate scene UI.
export type VistaVariant = 'menu' | 'board' | 'gameover';

export function paintVista(scene: Phaser.Scene, variant: VistaVariant): void {
  const W = scene.scale.width || 960;
  const H = scene.scale.height || 600;
  const textureKey = variant === 'menu' && scene.textures.exists('menu_vista_sunset')
    ? 'menu_vista_sunset'
    : 'menu_vista';
  if (!scene.textures.exists(textureKey)) {
    throw new Error(`The painted ${textureKey} texture must be loaded by Preload.`);
  }

  scene.add.image(0, 0, textureKey)
    .setOrigin(0, 0)
    .setDisplaySize(W, H)
    .setDepth(-10);

  // The text hierarchy needs a calm value field over the scenic painting.
  const veilAlpha = variant === 'menu' ? 0.24 : variant === 'board' ? 0.58 : 0.5;
  scene.add.rectangle(0, 0, W, H, 0x0a0e12, veilAlpha)
    .setOrigin(0, 0)
    .setDepth(-9);

  if (variant === 'gameover') {
    scene.add.rectangle(0, 0, W, H, 0x4b1717, 0.2)
      .setOrigin(0, 0)
      .setDepth(-8);
  }

  // A small number of motes keeps the menu connected to the live battlefield.
  const emberColor = variant === 'gameover' ? 0xe8643c : 0xd7aa4e;
  for (let i = 0; i < 10; i++) {
    const mote = scene.add.circle(Math.random() * W, Math.random() * H, 1.2, emberColor, 0.44).setDepth(-7);
    scene.tweens.add({
      targets: mote,
      y: '-=52',
      x: `+=${14 - Math.random() * 28}`,
      alpha: 0.08,
      duration: 5000 + Math.random() * 3500,
      repeat: -1,
      delay: Math.random() * 4000,
      onRepeat: () => mote.setPosition(Math.random() * W, H - 20).setAlpha(0.44)
    });
  }

  if (variant === 'gameover') {
    for (const sx of [W * 0.31, W * 0.72]) {
      const smoke = scene.add.ellipse(sx, H * 0.49, 38, 120, 0x151515, 0.18).setDepth(-7);
      scene.tweens.add({ targets: smoke, alpha: 0.32, y: smoke.y - 18, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }
}
