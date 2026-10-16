import { describe, expect, it } from 'vitest';
import { STAGE_ASSETS } from '../src/game/art/assetManifest.ts';
import { CAMPAIGN_ART_MANIFEST } from '../src/game/campaign/artManifest.ts';
import { CAMPAIGN_ENEMIES } from '../src/game/campaign/enemies.ts';
import { CAMPAIGN_LEVELS, CAMPAIGN_WORLDS } from '../src/game/campaign/config.ts';
import { TOWERS } from '../src/game/config/towers.ts';

const MASTERS: ReadonlyArray<{ file: string; width: number; height: number }> = [
  { file: '../artifacts/image-reserve-20261015/masters/amber-hourglass-vista.png', width: 1672, height: 941 },
  { file: '../artifacts/image-reserve-20261015/masters/amber-hourglass-terrain.png', width: 1672, height: 941 },
  { file: '../artifacts/image-reserve-20261015/masters/amber-hourglass-chronolens.png', width: 1254, height: 1254 },
  { file: '../artifacts/image-reserve-20261015/masters/amber-hourglass-clockmite.png', width: 1254, height: 1254 },
  { file: '../artifacts/image-reserve-20261015/masters/amber-hourglass-pendulum-knight.png', width: 1254, height: 1254 },
  { file: '../artifacts/image-reserve-20261015/masters/amber-hourglass-hourkeeper.png', width: 1254, height: 1254 },
  { file: '../artifacts/image-reserve-20261015/masters/amber-hourglass-unwound-king.png', width: 1254, height: 1254 }
];

const FORBIDDEN = /amber|hourglass|chronolens|clockmite|pendulum|hourkeeper|unwound/i;

describe('amber hourglass preproduction kit', () => {
  it.each(MASTERS)('master decodes as PNG at its recorded size: $file', async ({ file, width, height }) => {
    const moduleName = 'node:fs';
    const { readFileSync } = await import(moduleName);
    const bytes = readFileSync(new URL(file, import.meta.url));
    expect(bytes.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    expect(bytes.readUInt32BE(16)).toBe(width);
    expect(bytes.readUInt32BE(20)).toBe(height);
  });

  it('registers no amber hourglass runtime content anywhere', () => {
    expect(CAMPAIGN_WORLDS.some(world => FORBIDDEN.test(world.id))).toBe(false);
    expect(CAMPAIGN_LEVELS.some(level => FORBIDDEN.test(level.worldId) || FORBIDDEN.test(String(level.level)))).toBe(false);
    expect(Object.keys(CAMPAIGN_ENEMIES).some(id => FORBIDDEN.test(id))).toBe(false);
    expect(Object.keys(TOWERS).some(id => FORBIDDEN.test(id))).toBe(false);
    expect(CAMPAIGN_ART_MANIFEST.some(asset => FORBIDDEN.test(asset.id) || FORBIDDEN.test(asset.key) || FORBIDDEN.test(asset.path))).toBe(false);
    for (const assets of Object.values(STAGE_ASSETS)) {
      expect(assets.some(asset => FORBIDDEN.test(asset.key) || FORBIDDEN.test(asset.path))).toBe(false);
    }
  });
});
