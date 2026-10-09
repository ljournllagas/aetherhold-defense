import { afterEach, describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { EVOLUTION_ACCENTS, decorateEvolution } from '../src/game/art/towerArt.ts';
import { EVOLUTIONS } from '../src/game/config/evolutions.ts';
import { GameScene } from '../src/game/scenes/GameScene.ts';
import { Tower } from '../src/game/entities/Tower.ts';
import { Enemy } from '../src/game/entities/Enemy.ts';
import type { EvolutionCombat } from '../src/game/systems/EvolutionCombat.ts';
import type { BranchId, ShotSnapshot } from '../src/shared/progression.ts';

vi.mock('phaser', () => ({ default: { Scene: class { constructor(_key?: string) {} }, Scenes: { Events: { SHUTDOWN: 'shutdown' } }, Scale: { Events: { RESIZE: 'resize' } } } }));
class FakeContainer {
  list: unknown[] = []; data: Record<string, unknown> = {}; destroyed = false;
  add(c: unknown) { this.list.push(...(Array.isArray(c) ? c : [c])); return this; }
  remove(c: unknown) { this.list = this.list.filter((x) => x !== c); return this; }
  setData(k: string, v: unknown) { this.data[k] = v; return this; } getData(k: string) { return this.data[k]; }
  setPosition() { return this; } setDepth() { return this; } setScale() { return this; } destroy() { this.destroyed = true; }
}
class FakeCircle { destroyed = false; setPosition() { return this; } setRadius() { return this; } setStrokeStyle() { return this; } setDepth() { return this; } setFillStyle() { return this; } setVisible() { return this; } destroy() { this.destroyed = true; } }
function makeGraphics() { const ops: string[] = []; const g: any = new Proxy({ ops }, { get: (t, k) => (k === 'ops' ? t.ops : (..._a: unknown[]) => { t.ops.push(String(k)); return g; }) }); return g; }
const fakeScene = () => ({ add: { container: () => new FakeContainer(), graphics: () => makeGraphics(), rectangle: vi.fn(() => ({})), triangle: vi.fn(() => ({})), circle: vi.fn(() => new FakeCircle()) } });
afterEach(() => vi.restoreAllMocks());

describe('branch accents', () => {
  it('defines a distinct labelled silhouette per branch', () => {
    const ids = Object.keys(EVOLUTIONS) as BranchId[];
    expect(new Set(ids.map((b) => EVOLUTION_ACCENTS[b].silhouette)).size).toBe(10);
    for (const b of ids) expect(EVOLUTION_ACCENTS[b].label).toBe(EVOLUTIONS[b].name);
  });
  it('adds one accent with rank chevrons and replaces it on update', () => {
    const scene = fakeScene(), parent = new FakeContainer();
    const first = decorateEvolution(scene as unknown as Phaser.Scene, parent as unknown as Phaser.GameObjects.Container, 'marksman', 2) as unknown as FakeContainer;
    expect(first.getData('evolutionAccent')).toBe('marksman'); expect(first.getData('evolutionRank')).toBe(2);
    const g = first.list[0] as { ops: string[] };
    expect(g.ops.filter((o) => o === 'fillTriangle')).toHaveLength(3);
    decorateEvolution(scene as unknown as Phaser.Scene, parent as unknown as Phaser.GameObjects.Container, 'marksman', 3);
    expect(parent.list.filter((c) => (c as FakeContainer).getData?.('evolutionAccent'))).toHaveLength(1);
    expect(first.destroyed).toBe(true);
  });
});

describe('effect visuals', () => {
  function run() {
    const scene = new GameScene(); scene.init({ difficulty: 'medium' });
    const loose = scene as unknown as Record<string, unknown>, add = fakeScene().add;
    loose.add = add; loose.world = (v: unknown) => v;
    return { r: scene as unknown as { evolutionCombat: EvolutionCombat; fieldViews: Map<number, FakeCircle>; syncFieldViews(): void; fireProjectile(x: number, y: number, e: Enemy, s: ShotSnapshot): void }, add };
  }
  it('draws arrows from the captured branch, not the current tower', () => {
    const { r, add } = run(), t = new Tower('longbow', 0, 0, 0), e = new Enemy('thornling', 60, 70, 8); e.x = 100;
    t.progression = { ...t.progression, foundationLevel: 4 };
    const foundation = r.evolutionCombat.makeShot(t, [t], 1);
    t.progression = { ...t.progression, branchId: 'marksman', rank: 0 };
    r.fireProjectile(0, 0, e, foundation); expect(add.rectangle.mock.calls[0].slice(0, 4)).toEqual([0, 0, 14, 2]);
    r.fireProjectile(0, 0, e, r.evolutionCombat.makeShot(t, [t], 1)); expect(add.rectangle.mock.calls[1].slice(0, 4)).toEqual([0, 0, 18, 3]);
    t.progression = { ...t.progression, branchId: 'volley' };
    r.fireProjectile(0, 0, e, r.evolutionCombat.makeShot(t, [t], 1)); expect(add.rectangle.mock.calls[2].slice(0, 4)).toEqual([0, 0, 12, 1.5]);
  });
  it('keeps one field view per active field and removes stale views', () => {
    const { r } = run(), m = new Tower('ember', 0, 0, 0);
    m.progression = { ...m.progression, foundationLevel: 4, branchId: 'flame-mortar', rank: 0 };
    const shot = r.evolutionCombat.makeShot(m, [m], 1);
    r.evolutionCombat.addField(shot, 0, 0, 0); r.evolutionCombat.addField({ ...shot, ownerId: 99 }, 5, 5, 0);
    r.syncFieldViews(); expect(r.fieldViews.size).toBe(2);
    const views = [...r.fieldViews.values()];
    r.evolutionCombat.clear(); r.syncFieldViews();
    expect(r.fieldViews.size).toBe(0); expect(views.every((v) => v.destroyed)).toBe(true);
  });
});
