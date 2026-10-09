import { describe, expect, it } from 'vitest';
import { gameLayout, worldToViewport } from '../src/game/ui/layout.ts';
import { BattlefieldView } from '../src/game/ui/viewport.ts';
import { PointerGesture } from '../src/game/systems/PointerGesture.ts';
import { PauseState } from '../src/game/systems/PauseState.ts';

describe('portrait playability', () => {
  it('reserves two readable HUD rows and leaves a positive battlefield on a phone', () => {
    const l = gameLayout(360, 640);
    expect(l.hud).toBe(104);
    expect(l.field.height).toBe(472);
    expect(l.inspector).toBe(0);
  });
  it('fits the whole battlefield without distorting its aspect ratio', () => {
    const l = gameLayout(360, 640);
    const start = worldToViewport(l, { x: 0, y: 56 });
    const end = worldToViewport(l, { x: 1040, y: 640 });
    expect((end.x - start.x) / (end.y - start.y)).toBeCloseTo(1040 / 584);
    expect(start.y).toBeGreaterThan(l.hud);
  });
});

describe('battlefield camera', () => {
  it('anchors zoom under the fingers and clamps panning while rejecting letterbox taps', () => {
    const view = new BattlefieldView({ x: 10, y: 104, width: 360, height: 472 });
    expect(view.contains({ x: 20, y: 110 })).toBe(false);
    const anchor = { x: 190, y: 340 };
    const world = view.unproject(anchor);
    view.zoomAt(4, anchor);
    expect(view.project(world).x).toBeCloseTo(190);
    expect(view.project(world).y).toBeCloseTo(340);
    view.pan(9999, 9999);
    expect(view.project({ x: 0, y: 56 }).x).toBeCloseTo(10);
    view.reset();
    expect(view.zoom).toBe(1);
  });
  it('preserves world center across rotation and chooses the nearest enlarged hit target', () => {
    const view = new BattlefieldView({ x: 0, y: 104, width: 360, height: 472 });
    view.zoomAt(3, { x: 180, y: 340 });
    view.resize({ x: 0, y: 56, width: 844, height: 270 });
    expect(view.zoom).toBe(3);
    expect(view.unproject({ x: 422, y: 191 })).toEqual({ x: 520, y: 348 });
    expect(view.nearest([{ x: 520, y: 348 }, { x: 535, y: 348 }], { x: 423, y: 191 })).toBe(0);
  });
});

describe('touch gestures', () => {
  it('captures coordinates exposed through pointer getters', () => {
    class FrameworkPointer { get x() { return 120; } get y() { return 240; } }
    const pointer = new FrameworkPointer();
    const g = new PointerGesture(); g.down(1, pointer);
    expect(g.up(1)).toEqual({ type: 'tap', point: { x: 120, y: 240 } });
  });
  it('emits taps only on release and suppresses taps after a drag or pinch', () => {
    const g = new PointerGesture();
    g.down(1, { x: 10, y: 10 });
    expect(g.up(1)).toEqual({ type: 'tap', point: { x: 10, y: 10 } });
    g.down(1, { x: 10, y: 10 });
    expect(g.move(1, { x: 20, y: 10 })?.type).toBe('pan');
    expect(g.up(1)).toBeNull();
    g.down(1, { x: 10, y: 10 }); g.down(2, { x: 30, y: 10 });
    expect(g.move(2, { x: 50, y: 10 })?.type).toBe('pinch');
    expect(g.up(2)).toBeNull(); expect(g.up(1)).toBeNull();
  });
  it('cancels contacts and never reinterprets the remaining pinch finger as a tap', () => {
    const g = new PointerGesture();
    g.down(1, { x: 0, y: 0 }); g.down(2, { x: 40, y: 0 }); g.up(2);
    g.move(1, { x: 1, y: 0 }); expect(g.up(1)).toBeNull();
    g.down(3, { x: 20, y: 30 }); g.cancel(); expect(g.up(3)).toBeNull();
  });
});

describe('independent pause reasons', () => {
  it('requires explicit background resume and retains user/modal pause', () => {
    const p = new PauseState();
    p.set('modal', true); p.set('background', true);
    expect(p.blocked).toBe(true);
    p.set('background', false); expect(p.blocked).toBe(true);
    p.set('modal', false); expect(p.blocked).toBe(false);
    p.set('user', true); p.set('background', true); p.set('background', false);
    expect(p.blocked).toBe(true);
  });
});
