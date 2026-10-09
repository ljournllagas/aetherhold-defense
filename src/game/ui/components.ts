import type Phaser from 'phaser';
import { C, style } from './tokens.ts';

export function panel(scene: Phaser.Scene, parent: Phaser.GameObjects.Container, x: number, y: number, width: number, height: number, edge = 0x445564): Phaser.GameObjects.Rectangle {
  const box = scene.add.rectangle(x, y, width, height, C.bgPanel, 0.98).setOrigin(0).setStrokeStyle(1, edge);
  const inset = scene.add.graphics();
  inset.lineStyle(1, 0x2c3945, 0.8);
  inset.strokeRect(x + 4, y + 4, width - 8, height - 8);
  inset.lineStyle(1, 0xd7aa4e, 0.35);
  for (const [cx, cy, dx, dy] of [[x + 8, y + 8, 1, 1], [x + width - 8, y + 8, -1, 1], [x + 8, y + height - 8, 1, -1], [x + width - 8, y + height - 8, -1, -1]]) {
    inset.lineBetween(cx, cy, cx + dx * 12, cy);
    inset.lineBetween(cx, cy, cx, cy + dy * 12);
  }
  parent.add([box, inset]);
  return box;
}

/** Draw the clipped-corner slate and bronze trim used by title and archive panels. */
export function etchedFrame(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  selected = false,
  graphics = scene.add.graphics()
): Phaser.GameObjects.Graphics {
  graphics.clear();
  const cut = Math.min(12, Math.max(6, Math.floor(Math.min(width, height) * 0.075)));
  const drawOutline = (inset: number, lineWidth: number, color: number, alpha: number): void => {
    const left = x + inset;
    const top = y + inset;
    const right = x + width - inset;
    const bottom = y + height - inset;
    const bevel = Math.max(4, cut - inset * 0.45);
    graphics.lineStyle(lineWidth, color, alpha);
    graphics.beginPath();
    graphics.moveTo(left + bevel, top);
    graphics.lineTo(right - bevel, top);
    graphics.lineTo(right, top + bevel);
    graphics.lineTo(right, bottom - bevel);
    graphics.lineTo(right - bevel, bottom);
    graphics.lineTo(left + bevel, bottom);
    graphics.lineTo(left, bottom - bevel);
    graphics.lineTo(left, top + bevel);
    graphics.closePath();
    graphics.strokePath();
  };

  drawOutline(0, selected ? 2 : 1.5, selected ? 0xf0cd72 : 0x8a7045, selected ? 0.98 : 0.88);
  drawOutline(4, 1, selected ? 0xd7aa4e : 0x445564, selected ? 0.66 : 0.78);
  graphics.lineStyle(1, 0xc2a268, selected ? 0.72 : 0.42);
  const facet = Math.max(5, cut - 4);
  graphics.lineBetween(x + 2, y + facet, x + 2, y + 2);
  graphics.lineBetween(x + 2, y + 2, x + facet, y + 2);
  graphics.lineBetween(x + width - facet, y + 2, x + width - 2, y + 2);
  graphics.lineBetween(x + width - 2, y + 2, x + width - 2, y + facet);
  graphics.lineBetween(x + 2, y + height - facet, x + 2, y + height - 2);
  graphics.lineBetween(x + 2, y + height - 2, x + facet, y + height - 2);
  graphics.lineBetween(x + width - facet, y + height - 2, x + width - 2, y + height - 2);
  graphics.lineBetween(x + width - 2, y + height - facet, x + width - 2, y + height - 2);

  graphics.fillStyle(selected ? 0xf0cd72 : 0x8a7045, selected ? 0.8 : 0.58);
  for (const [cx, cy] of [
    [x + cut * 0.52, y + cut * 0.52],
    [x + width - cut * 0.52, y + cut * 0.52],
    [x + cut * 0.52, y + height - cut * 0.52],
    [x + width - cut * 0.52, y + height - cut * 0.52]
  ]) graphics.fillCircle(cx, cy, Math.max(1.2, Math.min(2.2, Math.min(width, height) * 0.012)));
  return graphics;
}

export function button(scene: Phaser.Scene, parent: Phaser.GameObjects.Container, x: number, y: number, width: number, label: string, action: () => void, kind: 'primary' | 'secondary' | 'danger' = 'secondary', height = 44): { box: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text } {
  const color = kind === 'danger' ? 0xd85f59 : kind === 'primary' ? 0xd7aa4e : 0x445564;
  const box = scene.add.rectangle(x, y, width, height, C.bgRaised).setOrigin(0).setStrokeStyle(kind === 'primary' ? 2 : 1, color);
  const text = scene.add.text(x + width / 2, y + height / 2, label, style(14, kind === 'danger' ? C.dangerBright : C.textPrimary, true)).setOrigin(0.5);
  box.setInteractive({ useHandCursor: true });
  box.on('pointerover', () => box.setFillStyle(C.bgHover));
  box.on('pointerout', () => box.setFillStyle(C.bgRaised));
  let press: { id: number; x: number; y: number } | null = null;
  box.on('pointerdown', (p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
    event.stopPropagation(); press = { id: p.id, x: p.x, y: p.y };
  });
  box.on('pointerup', (p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
    event.stopPropagation(); const start = press; press = null;
    if (start?.id === p.id && Math.hypot(p.x - start.x, p.y - start.y) <= 8) action();
  });
  box.on('pointerout', () => { press = null; });
  parent.add([box, text]);
  return { box, text };
}

export function statRow(scene: Phaser.Scene, parent: Phaser.GameObjects.Container, y: number, label: string, value: string, width: number): void {
  parent.add(scene.add.text(16, y, label, style(14, C.textSecondary)));
  parent.add(scene.add.text(width - 16, y, value, style(14, C.textPrimary, true)).setOrigin(1, 0));
}
