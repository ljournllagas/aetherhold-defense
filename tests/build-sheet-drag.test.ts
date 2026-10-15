import { expect, it, vi } from 'vitest';
import { GameScene } from '../src/game/scenes/GameScene.ts';
import { gameLayout, toMinimalLayout } from '../src/game/ui/layout.ts';
import { TOWER_LIST } from '../src/game/config/towers.ts';
vi.mock('phaser', () => ({ default: { Scene: class { constructor(_key?: string) {} } } }));

function display(x = 0, y = 0, width = 0, height = 18): any {
  const value: any = { x, y, width, height, list: [], visible: true, text: '', handlers: new Map(),
    scaleX: 1, scaleY: 1,
    data: new Map(), getData(key: string) { return this.data.get(key); }, setData() { return this; },
    on(event: string, handler: (...args: any[]) => void) { this.handlers.set(event, handler); return this; },
    add(items: any) { for (const item of (Array.isArray(items) ? items : [items])) this.list.push(item); return this; },
    removeAll() { this.list = []; return this; },
    destroy() { return this; },
    setPosition(px: number, py: number) { this.x = px; this.y = py; return this; },
    setText(text: string) { this.text = text; return this; },
    setWordWrapWidth() { return this; },
    setVisible(show: boolean) { this.visible = show; return this; },
    setSize(w: number, h: number) { this.width = w; this.height = h; return this; },
    setDisplaySize(w: number, h: number) { this.width = w; this.height = h; return this; },
    setAlpha() { return this; }, setOrigin() { return this; }, setColor() { return this; },
    setFontSize() { return this; }, setAlign() { return this; }, setCrop() { return this; },
    setInteractive() { return this; }, setStrokeStyle() { return this; }, setFillStyle() { return this; },
    getWorldTransformMatrix() { return { tx: this.x, ty: this.y }; },
    getBounds() { return { x: this.x, y: this.y, width: this.width, height: this.height }; },
  };
  return new Proxy(value, { get(t, key) { return key in t ? (t as any)[key] : (..._args: any[]) => value; } });
}

function makeSheetRun(): any {
  const run: any = new GameScene();
  run.init({ difficulty: 'medium' });
  run.layout = toMinimalLayout(gameLayout(390, 844));
  run.gold = 10000;
  run.campaign = null;
  run.modal = null;
  run.sheet = null;
  run.sheetKind = null;
  run.touchPreview = null;
  run.selectedTower = null;
  run.uiRoot = display();
  const images: any[] = [];
  run.add = {
    container: (x: number, y: number) => display(x, y),
    text: (x: number, y: number, text = '') => Object.assign(display(x, y), { text }),
    rectangle: (x: number, y: number, w: number, h: number) => display(x, y, w, h),
    image: (x: number, y: number) => { const img = display(x, y, 48, 48); images.push(img); return img; },
    graphics: () => display(),
  };
  run.images = images;
  run.input = { on() {}, off() {}, emit() {} };
  run.game = { canvas: { addEventListener() {}, removeEventListener() {} } };
  return run;
}

it('shows every tower portrait side by side in the build grid', () => {
  const run = makeSheetRun();
  run.openSheet('build');
  expect(run.sheetKind).toBe('build');
  expect(run.images).toHaveLength(TOWER_LIST.length);
  expect(new Set(run.images.map((img: any) => img.x)).size).toBeGreaterThan(1);
  // Tempest, Sentinel and Cinder share one row instead of stranding Cinder.
  const rowY = run.images.map((img: any) => img.y);
  expect(new Set(rowY).size).toBe(2);
  expect(rowY[4]).toBe(rowY[5]);
  expect(rowY[5]).toBe(rowY[6]);
});

it('starts a tray drag from a sheet portrait and closes the sheet', () => {
  const run = makeSheetRun();
  run.openSheet('build');
  const portrait = run.images[0];
  const down = portrait.handlers.get('pointerdown');
  expect(down).toBeDefined();
  const pointer: any = { id: 7, x: 36, y: 80, wasTouch: true };
  down(pointer, 0, 0, { stopPropagation() {} });
  expect(run.sheetKind).toBeNull();
  expect(run.trayOwner).toBe(7);
  expect(run.placingTowerId).toBeNull();
  // Drag continues through the normal tray gesture: dragging upward out of the
  // sheet starts ghost targeting for that tower.
  run.handlePointerMove({ ...pointer, x: 40, y: 20, isDown: true });
  expect(run.placingTowerId).toBe(TOWER_LIST[0].id);
});

it('arms placement for towers the run cannot afford yet', () => {
  const run = makeSheetRun();
  run.gold = 0;
  run.openSheet('build');
  const portrait = run.images[0];
  portrait.handlers.get('pointerdown')({ id: 9, x: 36, y: 80, wasTouch: true }, 0, 0, { stopPropagation() {} });
  expect(run.sheetKind).toBeNull();
  expect(run.trayOwner).toBeNull();
  expect(run.placingTowerId).toBe(TOWER_LIST[0].id);
});
