import Phaser from 'phaser';
import { button, panel } from './components.ts';
import { C, FONT_DISPLAY, style } from './tokens.ts';
import type { Point, Rect } from './viewport.ts';

/** A clipped canvas panel. Dragging content never activates its buttons. */
export class ScrollSheet {
  readonly root: Phaser.GameObjects.Container;
  readonly content: Phaser.GameObjects.Container;
  private offset = 0;
  private contentHeight = 0;
  private controls: Array<{ y: number; box: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text }> = [];
  private texts: Phaser.GameObjects.Text[] = [];
  private drag: { id: number; y: number } | null = null;
  constructor(private scene: Phaser.Scene, parent: Phaser.GameObjects.Container, readonly bounds: Rect, title: string, close: () => void) {
    const { x, y, width, height } = bounds;
    this.root = scene.add.container(x, y); parent.add(this.root);
    const transform = this.root.getWorldTransformMatrix();
    this.bounds = { ...bounds, x: transform.tx, y: transform.ty };
    panel(scene, this.root, 0, 0, width, height).setInteractive().on('pointerdown', (p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => { this.down(p); e.stopPropagation(); });
    this.root.add(scene.add.text(12, 14, title, style(16, C.goldBright, true, FONT_DISPLAY)).setWordWrapWidth(width - 76));
    button(scene, this.root, width - 56, 4, 44, '×', close);
    this.content = scene.add.container(0, 48); this.root.add(this.content);
    scene.input.on('pointerdown', this.down); scene.input.on('pointermove', this.move); scene.input.on('pointerup', this.up); scene.input.on('wheel', this.wheel);
    scene.game.canvas.addEventListener('touchcancel', this.up);
  }
  contains(p: Point): boolean { const b = this.bounds; return p.x >= b.x && p.y >= b.y && p.x < b.x + b.width && p.y < b.y + b.height; }
  get scrollOffset(): number { return this.offset; }
  scrollTo(offset: number): void { this.scroll(offset - this.offset); }
  text(y: number, value: string, color: string = C.textSecondary, size = 14): Phaser.GameObjects.Text {
    const text = this.scene.add.text(12, y, value, style(size, color)).setWordWrapWidth(this.bounds.width - 24);
    this.content.add(text); this.texts.push(text); this.contentHeight = Math.max(this.contentHeight, y + text.height + 12); this.clipControls(); return text;
  }
  action(y: number, label: string, action: () => void, kind: 'primary' | 'secondary' | 'danger' = 'secondary', enabled = true): { box: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text } {
    const control = button(this.scene, this.content, 12, y, this.bounds.width - 24, label, enabled ? action : () => {}, enabled ? kind : 'secondary', 44);
    if (!enabled) control.text.setAlpha(0.6);
    control.box.on('pointerdown', this.down);
    this.controls.push({ y, ...control }); this.clipControls();
    this.contentHeight = Math.max(this.contentHeight, y + 56);
    return control;
  }
  pair(y: number, left: string, right: string, first: () => void, second: () => void): void {
    const width = (this.bounds.width - 32) / 2;
    for (const [x, label, action] of [[12, left, first], [20 + width, right, second]] as const) {
      const control = button(this.scene, this.content, x, y, width, label, action, 'secondary', 44);
      control.box.on('pointerdown', this.down); this.controls.push({ y, ...control });
    }
    this.contentHeight = Math.max(this.contentHeight, y + 56);
    this.clipControls();
  }
  private down = (p: Phaser.Input.Pointer): void => { if (this.contains(p) && p.y >= this.bounds.y + 48) this.drag = { id: p.id, y: p.y }; };
  private move = (p: Phaser.Input.Pointer): void => { if (this.drag?.id === p.id && p.isDown) { this.scroll(this.drag.y - p.y); this.drag.y = p.y; } };
  private up = (): void => {
    this.drag = null;
    if (this.bounds.height - 52 <= 64 && this.controls.length) {
      const positions = [0, ...this.controls.map(control => control.y)];
      const nearest = positions.reduce((best, y) => Math.abs(y - this.offset) < Math.abs(best - this.offset) ? y : best, 0);
      this.scrollTo(nearest);
    }
  };
  private wheel = (p: Phaser.Input.Pointer, _over: unknown, _dx: number, dy: number): void => {
    if (!this.contains(p)) return;
    if (this.bounds.height - 52 <= 64) {
      const positions = [0, ...this.controls.map(control => control.y)].sort((a, b) => a - b);
      const next = dy > 0 ? positions.find(y => y > this.offset + .5) : positions.reverse().find(y => y < this.offset - .5);
      if (next !== undefined) this.scrollTo(next);
    } else this.scroll(dy);
  };
  private scroll(delta: number): void { this.offset = Math.max(0, Math.min(Math.max(0, this.contentHeight - (this.bounds.height - 52)), this.offset + delta)); this.content.y = 48 - this.offset; this.clipControls(); }
  private clipControls(): void {
    const viewportHeight = this.bounds.height - 52;
    for (const text of this.texts) {
      const top = Math.max(0, this.offset - text.y);
      const bottom = Math.min(text.height, viewportHeight + this.offset - text.y);
      text.setVisible(bottom > top);
      if (bottom > top) text.setCrop(0, top, text.width, bottom - top);
    }
    for (const view of this.content.list) {
      if (view.type === 'Image') {
        const image = view as Phaser.GameObjects.Image;
        image.setVisible(image.y - image.displayHeight / 2 - this.offset >= 0 && image.y + image.displayHeight / 2 - this.offset <= viewportHeight);
      }
    }
    for (const { y, box, text } of this.controls) {
      const visible = y - this.offset >= 0 && y - this.offset + 44 <= this.bounds.height - 52;
      box.setVisible(visible); text.setVisible(visible); if (box.input) box.input.enabled = visible;
    }
  }
  destroy(): void {
    this.scene.input.off('pointerdown', this.down); this.scene.input.off('pointermove', this.move); this.scene.input.off('pointerup', this.up); this.scene.input.off('wheel', this.wheel);
    this.scene.game.canvas.removeEventListener('touchcancel', this.up);
    this.root.destroy(true);
  }
}
