import '@fontsource/cinzel/600.css';
import '@fontsource/cinzel/700.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import './style.css';
import Phaser from 'phaser';
import { BootScene } from './game/scenes/BootScene.ts';
import { PreloadScene } from './game/scenes/PreloadScene.ts';
import { MainMenuScene } from './game/scenes/MainMenuScene.ts';
import { DifficultyScene } from './game/scenes/DifficultyScene.ts';
import { SettingsScene } from './game/scenes/SettingsScene.ts';
import { GameScene } from './game/scenes/GameScene.ts';
import { GameOverScene } from './game/scenes/GameOverScene.ts';
import { LeaderboardScene } from './game/scenes/LeaderboardScene.ts';
import { ProgressionScene } from './game/scenes/ProgressionScene.ts';

document.title = 'Aegis of the Borderkeep';
const host = document.getElementById('game-root')!;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-root',
  width: host.clientWidth,
  height: host.clientHeight,
  backgroundColor: '#0A0E12',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.NO_CENTER
  },
  input: {
    keyboard: true,
    activePointers: 3
  },
  scene: [BootScene, PreloadScene, MainMenuScene, DifficultyScene, SettingsScene, GameScene, GameOverScene, LeaderboardScene, ProgressionScene]
};

// eslint-disable-next-line no-new
const game = new Phaser.Game(config);
const resizeGame = () => {
  document.documentElement.style.setProperty('--viewport-height', `${window.visualViewport?.height ?? window.innerHeight}px`);
  if (game.isBooted && (game.scale.width !== host.clientWidth || game.scale.height !== host.clientHeight)) {
    game.scale.setParentSize(host.clientWidth, host.clientHeight);
  }
};
new ResizeObserver(resizeGame).observe(host);
window.visualViewport?.addEventListener('resize', resizeGame);
resizeGame();
game.events.once(Phaser.Core.Events.READY, resizeGame);

if (import.meta.env.DEV) {
  void import('./game/qa.ts').then(({ installQA }) => installQA(game));
}
