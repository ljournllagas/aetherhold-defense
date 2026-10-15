import { expect, it } from 'vitest';
import { gameLayout, toMinimalLayout } from '../src/game/ui/layout.ts';

it('flags landscape phones minimal; roomy portrait phones/tablets and desktop keep full chrome', () => {
  expect(gameLayout(844, 390).minimal).toBe(true);
  expect(gameLayout(667, 375).minimal).toBe(true);
  // Portrait: the 16:9 board is width-limited, so the tray fits without costing the map.
  expect(gameLayout(390, 844).minimal).toBe(false);
  expect(gameLayout(360, 640).minimal).toBe(false);
  expect(gameLayout(768, 1024).minimal).toBe(false);
  expect(gameLayout(1280, 720).minimal).toBe(false);
  expect(gameLayout(1024, 768).minimal).toBe(false);
});

it('portrait keeps the always-visible tray and the board still fits beside it', () => {
  for (const [w, h] of [[390, 844], [360, 640], [768, 1024], [600, 960]]) {
    const layout = toMinimalLayout(gameLayout(w, h));
    expect(layout.minimal).toBe(false);
    expect(layout.field.height).toBeGreaterThanOrEqual(w * 584 / 1040 + 24);
  }
  expect(toMinimalLayout(gameLayout(390, 844))).toMatchObject({ hud: 104, tray: 128 });
});

it('short landscape moves Build/Wave/More into a right rail and gives the board the full height', () => {
  expect(gameLayout(844, 390)).toMatchObject({ hud: 56, tray: 76, rail: false });
  const m = toMinimalLayout(gameLayout(844, 390));
  expect(m).toMatchObject({ hud: 48, tray: 0, minimal: true, rail: true });
  expect(m.field).toEqual({ x: 0, y: 48, width: 844 - 112, height: 390 - 48 });
  expect(m.waveBounds).toEqual({ x: 844 - 112, y: 48, width: 112, height: 390 - 48 });
  // The rail never overlaps the field, and three 44px buttons with gaps fit its height.
  expect(m.field.x + m.field.width).toBeLessThanOrEqual(m.waveBounds.x);
  expect(8 + 52 * 2 + 44 + 8).toBeLessThanOrEqual(m.waveBounds.height);
  // Board scale improves over the old 56px bar + 76px tray.
  const old = gameLayout(844, 390).field, scale = (f: { width: number; height: number }) => Math.min(f.width / 1040, f.height / 584);
  expect(scale(m.field)).toBeGreaterThan(scale(old) * 1.25);
  // Safe-area insets are honoured on both sides.
  const safe = toMinimalLayout(gameLayout(844, 390, { top: 0, right: 44, bottom: 21, left: 44 }));
  expect(safe.field.x).toBe(44);
  expect(safe.waveBounds.x + safe.waveBounds.width).toBe(844 - 44);
  expect(safe.field.y + safe.field.height).toBe(390 - 21);
  expect(toMinimalLayout(gameLayout(1280, 720))).toMatchObject({ hud: 56, tray: 76, rail: false });
});

it('preserves legacy boss geometry while boss chrome is reserved', () => {
  const boss = gameLayout(390, 844, { top: 0, right: 0, bottom: 0, left: 0 }, { portraitBossCommands: true });
  const slimmed = toMinimalLayout(boss);
  expect(slimmed.minimal).toBe(false);
  expect(slimmed.tray).toBe(boss.tray);
  const reserved = gameLayout(844, 390, { top: 0, right: 0, bottom: 0, left: 0 }, { bossStatusHeight: 24 });
  expect(toMinimalLayout(reserved).hud).toBe(reserved.hud);
});
