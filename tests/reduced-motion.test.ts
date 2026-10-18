import { afterEach, expect, it, vi } from 'vitest';
import { prefersReducedMotion } from '../src/game/art/reducedMotion.ts';
import { paintVista } from '../src/game/art/menubg.ts';

afterEach(() => { vi.unstubAllGlobals(); });

function stubMotion(matches: boolean): void {
  vi.stubGlobal('window', { matchMedia: (query: string) => ({ matches: query.includes('reduce') && matches }) });
}

function fakeVistaScene() {
  const chain = () => {
    const object: Record<string, unknown> = {};
    for (const method of ['setOrigin', 'setDisplaySize', 'setDepth', 'setPosition', 'setAlpha']) object[method] = () => object;
    return object;
  };
  return {
    scale: { width: 960, height: 600 },
    textures: { exists: () => true },
    add: { image: chain, rectangle: chain, circle: chain, ellipse: chain },
    tweens: { add: vi.fn() }
  };
}

it('reports no reduced motion without a matchMedia-capable window', () => {
  expect(prefersReducedMotion()).toBe(false);
  vi.stubGlobal('window', {});
  expect(prefersReducedMotion()).toBe(false);
});

it('reports reduced motion when the media query matches', () => {
  stubMotion(true);
  expect(prefersReducedMotion()).toBe(true);
  stubMotion(false);
  expect(prefersReducedMotion()).toBe(false);
});

it('skips the drifting menu motes when motion is reduced', () => {
  const animated = fakeVistaScene();
  paintVista(animated as never, 'gameover');
  expect(animated.tweens.add).toHaveBeenCalled();

  stubMotion(true);
  const calm = fakeVistaScene();
  paintVista(calm as never, 'gameover');
  expect(calm.tweens.add).not.toHaveBeenCalled();
});
