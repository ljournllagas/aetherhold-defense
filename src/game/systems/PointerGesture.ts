import type { Point } from '../ui/viewport.ts';
export type GestureIntent = { type: 'tap'; point: Point } | { type: 'pan'; dx: number; dy: number }
  | { type: 'pinch'; ratio: number; point: Point; dx: number; dy: number };
export class PointerGesture {
  private contacts = new Map<number, { start: Point; point: Point }>();
  private suppressed = false;
  down(id: number, point: Point): void {
    this.contacts.set(id, { start: { x: point.x, y: point.y }, point: { x: point.x, y: point.y } });
    if (this.contacts.size > 1) this.suppressed = true;
  }
  move(id: number, point: Point): GestureIntent | null {
    const contact = this.contacts.get(id); if (!contact) return null;
    const old = [...this.contacts.values()].map(c => c.point);
    const dx = point.x - contact.point.x, dy = point.y - contact.point.y;
    contact.point = { x: point.x, y: point.y };
    if (this.contacts.size >= 2) {
      const next = [...this.contacts.values()].map(c => c.point);
      const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
      const midpoint = (a: Point, b: Point) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
      const before = midpoint(old[0], old[1]), after = midpoint(next[0], next[1]);
      return { type: 'pinch', ratio: distance(next[0], next[1]) / Math.max(1, distance(old[0], old[1])), point: before, dx: after.x - before.x, dy: after.y - before.y };
    }
    if (Math.hypot(point.x - contact.start.x, point.y - contact.start.y) > 8) this.suppressed = true;
    return this.suppressed ? { type: 'pan', dx, dy } : null;
  }
  up(id: number): GestureIntent | null {
    const contact = this.contacts.get(id);
    const tap = contact && !this.suppressed ? { type: 'tap' as const, point: contact.point } : null;
    this.contacts.delete(id); if (!this.contacts.size) this.suppressed = false;
    return tap;
  }
  cancel(): void { this.contacts.clear(); this.suppressed = false; }
}
