import { expect, it } from 'vitest';
import { gameLayout, toMinimalLayout } from '../src/game/ui/layout.ts';

it('flags phones, small landscape and portrait tablets minimal, desktop not', () => {
  expect(gameLayout(390, 844).minimal).toBe(true);
  expect(gameLayout(844, 390).minimal).toBe(true);
  expect(gameLayout(768, 1024).minimal).toBe(true);
  expect(gameLayout(1280, 720).minimal).toBe(false);
  expect(gameLayout(1024, 768).minimal).toBe(false);
});

it('keeps base geometry contracts; slimming applies to stacked portrait only', () => {
  expect(gameLayout(1280, 720)).toMatchObject({ hud: 56, tray: 76 });
  expect(gameLayout(844, 390)).toMatchObject({ hud: 56, tray: 76 });
  expect(gameLayout(360, 640)).toMatchObject({ hud: 104, tray: 128 });
  // Compact landscape keeps 56/76 geometry (content minimized, not geometry).
  expect(toMinimalLayout(gameLayout(844, 390))).toMatchObject({ hud: 56, tray: 76, minimal: true });
  // Stacked portrait reclaims 108px for the field.
  const m = toMinimalLayout(gameLayout(390, 844));
  expect(m).toMatchObject({ hud: 48, tray: 76, minimal: true });
  expect(m.field.height).toBe(gameLayout(390, 844).field.height + 108);
  expect(toMinimalLayout(gameLayout(1280, 720))).toMatchObject({ hud: 56, tray: 76 });
});

it('preserves legacy boss geometry while boss chrome is reserved', () => {
  const boss = gameLayout(390, 844, { top: 0, right: 0, bottom: 0, left: 0 }, { portraitBossCommands: true });
  const slimmed = toMinimalLayout(boss);
  expect(slimmed.minimal).toBe(false);
  expect(slimmed.tray).toBe(boss.tray);
  const reserved = gameLayout(844, 390, { top: 0, right: 0, bottom: 0, left: 0 }, { bossStatusHeight: 24 });
  expect(toMinimalLayout(reserved).hud).toBe(reserved.hud);
});
