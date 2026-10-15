import type { Rect } from './viewport.ts';
export interface Insets { top:number; right:number; bottom:number; left:number }
export interface GameLayout {
  width: number;
  height: number;
  hud: number;
  tray: number;
  inspector: number;
  compact: boolean;
  narrow: boolean;
  stackedHud: boolean;
  /** Minimal HUD: slim top row + Build/Wave/More bottom row (phones + portrait <1180). */
  minimal: boolean;
  /** Short landscape: Build/Wave/More live in a right-edge rail instead of a bottom bar. */
  rail: boolean;
  portraitBossCommands: boolean;
  bossStatusHeight: number;
  safe: Insets;
  trayBounds: Rect;
  waveBounds: Rect;
  inspectorBounds: Rect | null;
  field: { x: number; y: number; width: number; height: number };
}

export function gameLayout(width: number, height: number, safe: Insets = {top:0,right:0,bottom:0,left:0}, options: { portraitBossCommands?: boolean; bossStatusHeight?: number } = {}): GameLayout {
  const compact = width < 768 || height < 540;
  const inspector = width >= 1180 && !compact ? 240 : 0;
  const narrow = width < 768;
  const portrait = width < height && narrow;
  const stackedHud = portrait || width < 600;
  const portraitBossCommands = stackedHud && options.portraitBossCommands === true;
  const bossStatusHeight = compact ? options.bossStatusHeight ?? 0 : 0;
  const hud = (stackedHud ? 104 + bossStatusHeight : 56 + Math.max(0,bossStatusHeight-24)) + safe.top;
  const tray = (portraitBossCommands ? 52 : portrait ? 128 : 76) + safe.bottom;
  const available = Math.max(44,width-safe.left-safe.right);
  const y = height-tray;
  const trayBounds={x:safe.left,y,width:portrait?available:Math.max(44,available-240),height:portraitBossCommands?0:76};
  const waveBounds=portraitBossCommands
    ? {x:safe.left,y,width:available,height:52}
    : {x:portrait?safe.left:width-safe.right-240,y:portrait?y+76:y,width:portrait?available:240,height:portrait?52:76};
  const field={x:safe.left,y:hud,width:Math.max(1,available-inspector),height:Math.max(1,height-hud-tray)};
  // The 16:9 board is width-limited in portrait, so a slim HUD would only enlarge empty bands:
  // keep the full chrome (always-visible tower tray) whenever the board fits beside it.
  const roomyPortrait = width < height && available * 584 / 1040 + 24 <= field.height;
  const minimal = !roomyPortrait && (compact || (width < height && width < 1180));
  const inspectorBounds=inspector?{x:width-safe.right-inspector,y:hud,width:inspector,height:field.height}:null;
  return {width,height,hud,tray,inspector,compact,narrow,stackedHud,minimal,portraitBossCommands,bossStatusHeight,safe,trayBounds,waveBounds,inspectorBounds,field,rail:false};
}

/**
 * Minimal HUD override (GameScene normal play only): slim stacked portrait
 * chrome (104px top + 128px tray) to a 48px top row + 76px action row,
 * maximizing the map field. Compact landscape is already 56/76 so only its
 * content is minimized by draw branches, not its geometry. gameLayout()
 * itself is unchanged so existing geometry contracts hold; boss encounters
 * keep legacy geometry via their own reservation flags.
 */
export function toMinimalLayout(layout: GameLayout): GameLayout {
  if (!layout.minimal) return layout;
  if (layout.portraitBossCommands || layout.bossStatusHeight > 0) return { ...layout, minimal: false };
  const { width, height, safe } = layout;
  if (!layout.stackedHud && width > height) {
    // Short landscape: slim top row; Build/Wave/More stack in a right-edge rail so the
    // board gets the full remaining height (a bottom bar would cost 76px of a ~390px screen).
    const railWidth = 112, railHud = 48 + safe.top, railTray = safe.bottom;
    const available = Math.max(44, width - safe.left - safe.right);
    const rail = { x: width - safe.right - railWidth, y: railHud, width: railWidth, height: Math.max(1, height - railHud - railTray) };
    const field = { x: safe.left, y: railHud, width: Math.max(1, available - railWidth), height: rail.height };
    return { ...layout, hud: railHud, tray: railTray, rail: true, trayBounds: rail, waveBounds: rail, field };
  }
  const hud = layout.stackedHud ? 48 + safe.top : layout.hud;
  const portrait = width < height && width < 768;
  const tray = portrait ? 76 + safe.bottom : layout.tray;
  if (hud === layout.hud && tray === layout.tray) return layout;
  const available = Math.max(44, width - safe.left - safe.right);
  const y = height - tray;
  const trayBounds = { x: safe.left, y, width: available, height: tray - safe.bottom };
  const waveBounds = { x: safe.left, y, width: available, height: tray - safe.bottom };
  const field = { x: safe.left, y: hud, width: available, height: Math.max(1, height - hud - tray) };
  return { ...layout, hud, tray, trayBounds, waveBounds, field };
}

export function readSafeInsets():Insets {
  if(typeof document==='undefined')return {top:0,right:0,bottom:0,left:0};
  const el=document.createElement('div');
  el.style.cssText='position:fixed;visibility:hidden;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
  document.body.appendChild(el);const s=getComputedStyle(el);
  const result={top:parseFloat(s.paddingTop)||0,right:parseFloat(s.paddingRight)||0,bottom:parseFloat(s.paddingBottom)||0,left:parseFloat(s.paddingLeft)||0};
  el.remove();return result;
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

export function sheetBounds(layout: GameLayout, kind: 'build' | 'tower' | 'more' | 'relics' | 'next' | 'evolve' | 'help' | 'progression', touchPreview: boolean): GameLayout['field'] {
  const width = Math.min(560, (layout.rail ? layout.field.width : layout.width - layout.safe.left - layout.safe.right) - 16);
  const shortLandscape = layout.compact && layout.width > layout.height && !touchPreview && (kind === 'tower' || kind === 'evolve');
  const availableHeight=Math.max(96,layout.field.height-(touchPreview?56:0));
  const height = Math.min(availableHeight,shortLandscape ? Math.max(96, layout.field.height - 4) : Math.max(160, layout.field.height * 0.7));
  const y=Math.max(layout.hud,layout.height-layout.tray-height-(touchPreview?56:0));
  return { x: layout.rail ? layout.field.x + (layout.field.width - width) / 2 : (layout.width - width) / 2, y, width, height };
}

/**
 * Default camera zoom for narrow portrait phones: the width-limited 16:9 board is a thin strip, so
 * start closer (up to 1.5x) instead of leaving ~60% of the field empty. Zoom 1 remains the full-map
 * Fit view; pinch-out and the Fit button return to it. Boss encounters and wider screens stay at 1.
 */
export function portraitComfortZoom(layout: GameLayout, fitScale: number): number {
  if (layout.width >= 600 || layout.width >= layout.height || layout.rail || layout.portraitBossCommands || layout.bossStatusHeight > 0) return 1;
  const boardHeight = fitScale * 584;
  if (!(boardHeight > 0)) return 1;
  return Math.max(1, Math.min(1.5, layout.field.height * 0.6 / boardHeight));
}
