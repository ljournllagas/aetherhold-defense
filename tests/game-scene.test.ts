import { describe, expect, it } from 'vitest';
import { gameLayout, worldToViewport, viewportToWorld } from '../src/game/ui/layout.ts';

describe('adaptive battlefield coordinates', () => {
  it('uses canonical desktop anatomy and a compact short-landscape drawer', () => {
    expect(gameLayout(1280, 720)).toMatchObject({ hud: 56, tray: 80, inspector: 240, compact: false });
    expect(gameLayout(844, 390)).toMatchObject({ hud: 56, tray: 64, inspector: 0, compact: true });
    expect(gameLayout(1024, 768).inspector).toBe(0);
  });
  it('round-trips route, placement and meteor coordinates at all target viewports', () => {
    for (const [width, height] of [[1440, 900], [1280, 720], [1024, 768], [844, 390]]) {
      const layout = gameLayout(width, height);
      for (const point of [{ x: 0, y: 56 }, { x: 520, y: 348 }, { x: 1040, y: 640 }]) {
        const screen = worldToViewport(layout, point);
        expect(viewportToWorld(layout, screen).x).toBeCloseTo(point.x);
        expect(viewportToWorld(layout, screen).y).toBeCloseTo(point.y);
      }
    }
  });
});
