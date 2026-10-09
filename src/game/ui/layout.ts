export interface GameLayout {
  width: number;
  height: number;
  hud: number;
  tray: number;
  inspector: number;
  compact: boolean;
  narrow: boolean;
  field: { x: number; y: number; width: number; height: number };
}

export function gameLayout(width: number, height: number): GameLayout {
  const compact = width < 768 || height < 540;
  const inspector = width >= 1180 && !compact ? 240 : 0;
  const narrow = width < 768;
  const hud = narrow ? 104 : 56;
  const tray = compact ? 64 : 80;
  return { width, height, hud, tray, inspector, compact, narrow, field: { x: 0, y: hud, width: width - inspector, height: Math.max(1, height - hud - tray) } };
}

export function worldToViewport(layout: GameLayout, point: { x: number; y: number }): { x: number; y: number } {
  const f = layout.field;
  const s = Math.min(f.width / 1040, f.height / 584);
  return { x: f.x + (f.width - 1040 * s) / 2 + point.x * s, y: f.y + (f.height - 584 * s) / 2 + (point.y - 56) * s };
}

export function viewportToWorld(layout: GameLayout, point: { x: number; y: number }): { x: number; y: number } {
  const f = layout.field;
  const s = Math.min(f.width / 1040, f.height / 584);
  return { x: (point.x - f.x - (f.width - 1040 * s) / 2) / s, y: 56 + (point.y - f.y - (f.height - 584 * s) / 2) / s };
}

export function sheetBounds(layout: GameLayout, kind: 'build' | 'tower' | 'more' | 'relics' | 'next' | 'evolve', touchPreview: boolean): GameLayout['field'] {
  const width = Math.min(480, layout.width - 16);
  const shortLandscape = layout.compact && layout.width > layout.height && !touchPreview && (kind === 'tower' || kind === 'evolve');
  const height = shortLandscape ? Math.max(96, layout.field.height - 16) : Math.max(96, layout.field.height * 0.5 - (touchPreview ? 80 : 0));
  return { x: (layout.width - width) / 2, y: layout.height - layout.tray - height - (touchPreview ? 56 : 0), width, height };
}
