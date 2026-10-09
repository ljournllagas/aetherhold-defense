import Phaser from 'phaser';
import { TOWERS } from '../config/towers.ts';
import { loadBest, loadLegacyBest } from '../systems/Settings.ts';
import type { LocalBest } from '../systems/Settings.ts';
import { unlockRepository } from '../systems/UnlockSystem.ts';
import type { UnlockView } from '../systems/UnlockSystem.ts';
import { achievementViews } from '../ui/progressionView.ts';
import { ScrollSheet } from '../ui/ScrollSheet.ts';
import { C } from '../ui/tokens.ts';

const STATE_PREFIX = /^(Locked|Unlocked) · /;

export function progressionPanelLines(view: UnlockView, currentBest: LocalBest | null, legacyBest: LocalBest | null): string[] {
  const lines: string[] = [];
  if (view.warning) lines.push(view.warning);
  for (const a of achievementViews(view, [], 0)) {
    const state = !a.earned ? 'Locked' : a.unsaved ? 'Unlocked · not saved' : 'Unlocked · saved';
    lines.push(`${TOWERS[a.towerId].name}: ${a.starterName} (starter) / ${a.alternativeName}`);
    lines.push(`${state} · ${a.requirement}`);
  }
  lines.push(currentBest ? `Personal best · ${currentBest.score.toLocaleString('en-US')} pts` : 'Personal best · none yet');
  if (legacyBest) lines.push(`Legacy best · ${legacyBest.score.toLocaleString('en-US')} pts`);
  return lines;
}

export class ProgressionScene extends Phaser.Scene {
  private sheet: ScrollSheet | null = null;
  private readonly handleResize = (): void => { this.scene.restart(); };

  constructor() {
    super('Progression');
  }

  create(): void {
    const W = this.scale.width;
    const H = this.scale.height;
    this.add.rectangle(0, 0, W, H, 0x0a0e12, 1).setOrigin(0);
    const root = this.add.container(0, 0);
    const width = Math.min(560, W - 24);
    const sheet = new ScrollSheet(this, root, { x: (W - width) / 2, y: 12, width, height: H - 24 }, 'Progression', () => this.scene.start('MainMenu'));
    this.sheet = sheet;
    const view = unlockRepository.view();
    let y = 0;
    for (const line of progressionPanelLines(view, loadBest(), loadLegacyBest())) {
      const requirement = STATE_PREFIX.test(line);
      const color = line === view.warning ? C.dangerBright : requirement ? C.textSecondary : C.textPrimary;
      const text = sheet.text(y, line, color, requirement ? 12 : 14);
      y += text.height + (requirement ? 12 : 4);
    }
    sheet.action(y + 8, 'Back', () => this.scene.start('MainMenu'));

    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.sheet?.destroy();
      this.sheet = null;
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    });
  }
}
