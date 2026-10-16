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

it('tapping a sheet portrait previews its details without closing the sheet', () => {
  const run = makeSheetRun();
  run.openSheet('build');
  const portrait = run.images[0];
  const down = portrait.handlers.get('pointerdown');
  expect(down).toBeDefined();
  const pointer: any = { id: 7, x: 36, y: 80, wasTouch: true };
  down(pointer, 0, 0, { stopPropagation() {} });
  // Tap fills the detail strip; gold is never committed by browsing.
  expect(run.sheetKind).toBe('build');
  expect(run.towerPreviewId).toBe(TOWER_LIST[0].id);
  expect(run.placingTowerId).toBeNull();
  expect(run.towers ?? []).toHaveLength(0);
});

it('the sheet Build action arms placement and closes the sheet', () => {
  const run = makeSheetRun();
  run.openSheet('build');
  run.images[0].handlers.get('pointerdown')({ id: 7, x: 36, y: 80, wasTouch: true }, 0, 0, { stopPropagation() {} });
  const build = (run.sheet.controls as any[]).find((control: any) => String(control.text.text).startsWith('Build '));
  expect(build).toBeDefined();
  expect(String(build.text.text)).toContain(`Build ${TOWER_LIST[0].name}`);
  expect(run.commitBuildPreview()).toBe(true);
  expect(run.sheetKind).toBeNull();
  expect(run.placingTowerId).toBe(TOWER_LIST[0].id);
});

it('the sheet Build commit refuses towers the run cannot afford', () => {
  const run = makeSheetRun();
  run.gold = 0;
  run.openSheet('build');
  expect(run.commitBuildPreview()).toBe(false);
  expect(run.sheetKind).toBe('build');
  expect(run.placingTowerId).toBeNull();
});

it('unaffordable towers preview with a disabled Build action', () => {
  const run = makeSheetRun();
  run.gold = 0;
  run.openSheet('build');
  const portrait = run.images[0];
  portrait.handlers.get('pointerdown')({ id: 9, x: 36, y: 80, wasTouch: true }, 0, 0, { stopPropagation() {} });
  // Preview always works; Build gates on gold instead of arming placement.
  expect(run.sheetKind).toBe('build');
  expect(run.towerPreviewId).toBe(TOWER_LIST[0].id);
  expect(run.trayOwner).toBeNull();
  expect(run.placingTowerId).toBeNull();
  const build = (run.sheet.controls as any[]).find((control: any) => String(control.text.text).startsWith('Build '));
  expect(String(build.text.text)).toContain('Need');
});
