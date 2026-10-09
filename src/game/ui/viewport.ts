export interface Point { x: number; y: number }
export interface Rect extends Point { width: number; height: number }

/** Camera geometry only: simulation coordinates never change. */
export class BattlefieldView {
  zoom = 1;
  center: Point = { x: 520, y: 348 };
  constructor(public field: Rect) {}
  get scale(): number { return Math.min(this.field.width / 1040, this.field.height / 584) * this.zoom; }
  get origin(): Point {
    return { x: this.field.x + this.field.width / 2 - this.center.x * this.scale,
      y: this.field.y + this.field.height / 2 - this.center.y * this.scale };
  }
  project(p: Point): Point { const o = this.origin; return { x: o.x + p.x * this.scale, y: o.y + p.y * this.scale }; }
  unproject(p: Point): Point { const o = this.origin; return { x: (p.x - o.x) / this.scale, y: (p.y - o.y) / this.scale }; }
  inField(p: Point): boolean { const f = this.field; return p.x >= f.x && p.y >= f.y && p.x < f.x + f.width && p.y < f.y + f.height; }
  contains(p: Point): boolean { const w = this.unproject(p); return this.inField(p) && w.x >= 0 && w.x <= 1040 && w.y >= 56 && w.y <= 640; }
  resize(field: Rect): void { this.field = field; this.clamp(); }
  reset(): void { this.zoom = 1; this.center = { x: 520, y: 348 }; }
  pan(dx: number, dy: number): void { this.center.x -= dx / this.scale; this.center.y -= dy / this.scale; this.clamp(); }
  zoomAt(zoom: number, anchor: Point): void {
    const before = this.unproject(anchor);
    this.zoom = Math.max(1, Math.min(4, zoom));
    const after = this.unproject(anchor);
    this.center.x += before.x - after.x; this.center.y += before.y - after.y; this.clamp();
  }
  nearest(points: Point[], p: Point, radius = 22): number {
    let best = -1, distance = radius * radius;
    points.forEach((point, i) => { const s = this.project(point); const d = (s.x - p.x) ** 2 + (s.y - p.y) ** 2;
      if (d <= distance && (best < 0 || d < distance)) { distance = d; best = i; } });
    return best;
  }
  private clamp(): void {
    const halfW = this.field.width / this.scale / 2, halfH = this.field.height / this.scale / 2;
    this.center.x = halfW >= 520 ? 520 : Math.max(halfW, Math.min(1040 - halfW, this.center.x));
    this.center.y = halfH >= 292 ? 348 : Math.max(56 + halfH, Math.min(640 - halfH, this.center.y));
  }
}
