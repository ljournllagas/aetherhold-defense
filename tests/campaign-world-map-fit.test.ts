import { expect, it, vi } from 'vitest';
vi.mock('../src/game/art/artkit.ts', () => ({ P2: (points: unknown) => points }));
import { campaignWorldMapCoverCrop, paintCampaignWorldMap } from '../src/game/art/campaignArt.ts';

it.each([
  [600, 80, 0, 164.8, 768, 102.4, 0.78125],
  [600, 328, 0, 6.08, 768, 419.84, 0.78125],
  [500, 400, 114, 0, 540, 432, 400 / 432]
])('center-crops a %ix%i world panel without stretching or exposing adjacent art', (width, height, x, y, cropWidth, cropHeight, scale) => {
  const crop = campaignWorldMapCoverCrop(768, 432, width, height)!;

  expect(crop.x).toBeCloseTo(x);
  expect(crop.y).toBeCloseTo(y);
  expect(crop.width).toBeCloseTo(cropWidth);
  expect(crop.height).toBeCloseTo(cropHeight);
  expect(crop.scale).toBeCloseTo(scale);
  expect(crop.width * crop.scale).toBeCloseTo(width);
  expect(crop.height * crop.scale).toBeCloseTo(height);
  expect(crop.x).toBeGreaterThanOrEqual(0);
  expect(crop.y).toBeGreaterThanOrEqual(0);
  expect(crop.x + crop.width).toBeLessThanOrEqual(768);
  expect(crop.y + crop.height).toBeLessThanOrEqual(432);
});

it('rejects invalid bounds and crops each illustrated region before display', () => {
  expect(campaignWorldMapCoverCrop(768, 432, 600, 0)).toBeNull();
  expect(campaignWorldMapCoverCrop(Number.NaN, 432, 600, 328)).toBeNull();

  const cropCalls: number[][] = [], scales: number[] = [];
  const graphics = {
    lineStyle: () => graphics,
    lineBetween: () => graphics,
    strokeRect: () => graphics
  };
  const scene = {
    textures: { exists: () => true, get: () => ({ getSourceImage: () => ({ width: 768, height: 432 }) }) },
    add: {
      image: () => ({
        setOrigin() { return this; },
        setCrop(...args: number[]) { cropCalls.push(args); return this; },
        setScale(value: number) { scales.push(value); return this; }
      }),
      graphics: () => graphics
    }
  };
  paintCampaignWorldMap(scene as never, { add: () => {} } as never, 1800, 328);

  expect(cropCalls).toHaveLength(3);
  expect(cropCalls[0]).toEqual([0, expect.closeTo(6.08), 768, expect.closeTo(419.84)]);
  expect(scales).toEqual([0.78125, 0.78125, 0.78125]);
});
