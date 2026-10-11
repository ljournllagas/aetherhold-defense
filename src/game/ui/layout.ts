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
  safe: Insets;
  trayBounds: Rect;
  waveBounds: Rect;
  inspectorBounds: Rect | null;
  field: { x: number; y: number; width: number; height: number };
}

export function gameLayout(width: number, height: number, safe: Insets = {top:0,right:0,bottom:0,left:0}): GameLayout {
  const compact = width < 768 || height < 540;
  const inspector = width >= 1180 && !compact ? 240 : 0;
  const narrow = width < 768;
  const portrait = width < height && narrow;
  const hud = (portrait ? 104 : 56) + safe.top;
  const tray = (portrait ? 128 : 76) + safe.bottom;
  const available = Math.max(44,width-safe.left-safe.right);
  const y = height-tray;
  const trayBounds={x:safe.left,y,width:portrait?available:Math.max(44,available-240),height:76};
  const waveBounds={x:portrait?safe.left:width-safe.right-240,y:portrait?y+76:y,width:portrait?available:240,height:portrait?52:76};
  const field={x:safe.left,y:hud,width:Math.max(1,available-inspector),height:Math.max(1,height-hud-tray)};
  const inspectorBounds=inspector?{x:width-safe.right-inspector,y:hud,width:inspector,height:field.height}:null;
  return {width,height,hud,tray,inspector,compact,narrow,safe,trayBounds,waveBounds,inspectorBounds,field};
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
  const width = Math.min(560, layout.width - layout.safe.left - layout.safe.right - 16);
  const shortLandscape = layout.compact && layout.width > layout.height && !touchPreview && (kind === 'tower' || kind === 'evolve');
  const availableHeight=Math.max(96,layout.field.height-(touchPreview?56:0));
  const height = Math.min(availableHeight,shortLandscape ? Math.max(96, layout.field.height - 4) : Math.max(160, layout.field.height * 0.7));
  const y=Math.max(layout.hud,layout.height-layout.tray-height-(touchPreview?56:0));
  return { x: (layout.width - width) / 2, y, width, height };
}
