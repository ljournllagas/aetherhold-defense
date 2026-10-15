import { expect, it, vi } from 'vitest';
import { GameScene } from '../src/game/scenes/GameScene.ts';
import { Tower } from '../src/game/entities/Tower.ts';
import { Enemy } from '../src/game/entities/Enemy.ts';
import { TOWERS } from '../src/game/config/towers.ts';
import type { BranchId, ShotSnapshot } from '../src/shared/progression.ts';

vi.mock('phaser', () => ({ default: { Scene: class { constructor(_key?: string) {} }, Scenes: { Events: { SHUTDOWN: 'shutdown' } }, Scale: { Events: { RESIZE: 'resize' } } } }));

it.each([
  ['sentinel', null], ['sentinel', 'deadeye'], ['sentinel', 'headhunter'],
  ['cinder', null], ['cinder', 'pyre'], ['cinder', 'contagion']
] as const)('%s %s keeps its physical/fire identity without changing the shot or travel time', (id, branch) => {
  const scene = new GameScene(); scene.init({ difficulty: 'medium' });
  const operations: { name: string; args: unknown[] }[] = [];
  const graphics = () => {
    const g: any = new Proxy({}, { get: (_target, name) => (...args: unknown[]) => { operations.push({ name: String(name), args }); return g; } });
    return g;
  };
  const view: any = { setDepth() { return this; }, add: vi.fn() };
  const add = { container: () => view, graphics, rectangle: vi.fn(() => ({})), triangle: vi.fn(() => ({})) };
  const arc = vi.fn(), effect = vi.fn();
  const loose = scene as unknown as Record<string, any>;
  loose.add = add; loose.world = (value: unknown) => value; loose.drawTempestArc = arc; loose.addEffect = effect;
  const tower = new Tower(id, 0, 0, 0), enemy = new Enemy('thornling', 10000, 50, 8);
  enemy.x = 120; enemy.y = 90;
  tower.progression = { ...tower.progression, foundationLevel: 4, branchId: branch as BranchId | null, rank: branch ? 0 : null };
  const shot: ShotSnapshot = loose.evolutionCombat.makeShot(tower, [tower], 1);
  loose.fireProjectile(0, 0, enemy, shot);
  expect(arc).not.toHaveBeenCalled();
  expect(loose.flights[0].shot).toBe(shot);
  expect(loose.flights[0].durationMs).toBeCloseTo(150 / TOWERS[id].projectileSpeed * 1000);
  if (id === 'sentinel') {
    expect(add.rectangle).toHaveBeenCalled(); expect(add.triangle).toHaveBeenCalled();
  } else {
    expect(operations.some(op => op.name === 'fillStyle' && op.args[0] === 0xde8742)).toBe(true);
    expect(operations.some(op => op.name === 'fillCircle')).toBe(true);
  }
  operations.length = 0;
  loose.impactAt(120, 90, id);
  expect(arc).not.toHaveBeenCalled();
  expect(effect).toHaveBeenCalledWith(expect.anything(), 220);
  expect(operations.some(op => op.name === 'fillStyle' && op.args[0] === (id === 'cinder' ? 0xde8742 : 0xd7aa4e))).toBe(true);
});
