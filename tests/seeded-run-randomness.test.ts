import { describe, expect, it, vi } from 'vitest';
import { mulberry32 } from '../src/game/systems/runRandom.ts';
import { GameScene } from '../src/game/scenes/GameScene.ts';

vi.mock('phaser', () => ({ default: { Scene: class { constructor(_key?: string) {} } } }));

describe('mulberry32', () => {
  it('repeats a sequence for the same seed and diverges for another', () => {
    const draws = (seed: number) => {
      const rand = mulberry32(seed);
      return Array.from({ length: 32 }, () => rand());
    };

    expect(draws(1234)).toEqual(draws(1234));
    expect(draws(1234)).not.toEqual(draws(1235));
  });

  it('stays inside [0,1)', () => {
    const rand = mulberry32(99);
    const values = Array.from({ length: 5000 }, () => rand());

    expect(Math.min(...values)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...values)).toBeLessThan(1);
  });
});

describe('seeded run randomness', () => {
  function sceneWithSeed(seed: number): any {
    const scene: any = new GameScene();
    scene.init({ difficulty: 'medium' });
    scene.runRandom = mulberry32(seed);
    return scene;
  }

  it('produces the same reward sequence for the same seed', () => {
    const sequence = (seed: number) => {
      const scene = sceneWithSeed(seed);
      return Array.from({ length: 16 }, () => scene.rollReward());
    };

    expect(sequence(4242)).toEqual(sequence(4242));
    expect(sequence(4242)).not.toEqual(sequence(4243));
  });

  it('installs a fresh generator and a fresh 32-bit seed on every run start', () => {
    const scene: any = new GameScene();
    scene.init({ difficulty: 'medium' });
    const firstGenerator = scene.runRandom;
    const firstSeed = scene.runSeed;

    scene.init({ difficulty: 'medium' });

    expect(scene.runRandom).not.toBe(firstGenerator);
    expect(Number.isInteger(firstSeed)).toBe(true);
    expect(firstSeed).toBeGreaterThanOrEqual(0);
    expect(firstSeed).toBeLessThan(2 ** 32);
  });
});
