export interface Point { x: number; y: number }
export interface Rect extends Point { width: number; height: number }
/** World geometry with optional fixed screen-pixel art extending from its anchors. */
export interface FitSupport { bounds: Rect; pixels?: Rect }

function fitContent(field: Rect, supports: readonly FitSupport[]): { scale: number; bounds: Rect } {
  const union = (scale: number): Rect => {
    let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
    for (const { bounds: b, pixels: p = { x: 0, y: 0, width: 0, height: 0 } } of supports) {
      left = Math.min(left, b.x * scale + p.x); top = Math.min(top, b.y * scale + p.y);
      right = Math.max(right, (b.x + b.width) * scale + p.x + p.width);
      bottom = Math.max(bottom, (b.y + b.height) * scale + p.y + p.height);
    }
    return { x: left, y: top, width: right - left, height: bottom - top };
  };
  let low = 0, high = 4;
  for (let i = 0; i < 48; i++) {
    const scale = (low + high) / 2, b = union(scale);
    if (b.width <= field.width - 12 && b.height <= field.height - 12) low = scale;
    else high = scale;
  }
  const scale = Math.max(.0001, low), b = union(scale);
  return { scale, bounds: { x: b.x / scale, y: b.y / scale, width: b.width / scale, height: b.height / scale } };
}

/** Camera geometry only: simulation coordinates never change. */
export class BattlefieldView {
  zoom = 1;
  center: Point = { x: 520, y: 348 };
  private headroom = 0;
  private contentFit: { scale: number; bounds: Rect } | null = null;
  private supports: readonly FitSupport[] | null = null;
  constructor(public field: Rect) {}
  get fitField(): Rect {
    return { ...this.field, y: this.field.y + this.headroom, height: this.field.height - this.headroom };
  }
  get fitScale(): number { const f = this.fitField; return this.contentFit?.scale ?? Math.min(f.width / 1040, f.height / 584); }
  get topHeadroom(): number { return this.headroom; }
  get scale(): number { return this.fitScale * this.zoom; }
  get origin(): Point {
    const f = this.fitField;
    return { x: f.x + f.width / 2 - this.center.x * this.scale,
      y: f.y + f.height / 2 - this.center.y * this.scale };
  }
  project(p: Point): Point { const o = this.origin; return { x: o.x + p.x * this.scale, y: o.y + p.y * this.scale }; }
  unproject(p: Point): Point { const o = this.origin; return { x: (p.x - o.x) / this.scale, y: (p.y - o.y) / this.scale }; }
  inField(p: Point): boolean { const f = this.field; return p.x >= f.x && p.y >= f.y && p.x < f.x + f.width && p.y < f.y + f.height; }
  contains(p: Point): boolean { const w = this.unproject(p); return this.inField(p) && w.x >= 0 && w.x <= 1040 && w.y >= 56 && w.y <= 640; }
  resize(field: Rect): void { this.field = field; if (this.supports) this.contentFit = fitContent(field, this.supports); this.clamp(); }
  reset(): void { this.zoom = 1; this.center = this.fitCenter(); }
  setContentFit(supports: readonly FitSupport[] | null): void {
    this.supports = supports;
    this.contentFit = supports?.length ? fitContent(this.field, supports) : null;
    this.clamp();
  }
  pan(dx: number, dy: number): void { this.center.x -= dx / this.scale; this.center.y -= dy / this.scale; this.clamp(); }
  zoomAt(zoom: number, anchor: Point): void {
    const before = this.unproject(anchor);
    this.zoom = Math.max(1, Math.min(4, zoom));
    const after = this.unproject(anchor);
    this.center.x += before.x - after.x; this.center.y += before.y - after.y; this.clamp();
  }
  setTopHeadroom(pixels: number): void {
    this.headroom = Math.max(0, Math.min(Math.max(0, this.field.height - 44), Math.round(pixels)));
    this.clamp();
  }
  nearest(points: Point[], p: Point, radius = 22): number {
    let best = -1, distance = radius * radius;
    points.forEach((point, i) => { const s = this.project(point); const d = (s.x - p.x) ** 2 + (s.y - p.y) ** 2;
      if (d <= distance && (best < 0 || d < distance)) { distance = d; best = i; } });
    return best;
  }
  private clamp(): void {
    const fit = this.fitField;
    const halfW = fit.width / this.scale / 2, halfH = fit.height / this.scale / 2;
    const b = this.contentFit?.bounds ?? { x: 0, y: 56, width: 1040, height: 584 }, center = this.fitCenter();
    this.center.x = halfW >= b.width / 2 ? center.x : Math.max(b.x + halfW, Math.min(b.x + b.width - halfW, this.center.x));
    this.center.y = halfH >= b.height / 2 ? center.y : Math.max(b.y + halfH, Math.min(b.y + b.height - halfH, this.center.y));
  }
  private fitCenter(): Point {
    const b = this.contentFit?.bounds;
    return b ? { x: b.x + b.width / 2, y: b.y + b.height / 2 } : { x: 520, y: 348 };
  }
}
