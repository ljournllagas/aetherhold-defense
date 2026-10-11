import { describe, expect, it } from 'vitest';
import { CLASSIC_ROAD_ENVELOPE, MAP1 } from '../src/game/maps/map1.ts';
import { longestRoadCoverage, plotRoadClearance, roadEdgeDistance } from '../src/game/maps/buildPlotPolicy.ts';
import { CAMPAIGN_LEVELS } from '../src/game/campaign/config.ts';
import { distanceToRoute, resolveCampaignMap } from '../src/game/campaign/maps.ts';
import { TOWERS } from '../src/game/config/towers.ts';

describe('useful build plots beside the road', () => {
  it.each(CAMPAIGN_LEVELS)('keeps every Campaign plot close to the road in level $level', level => {
    const map = resolveCampaignMap(level);
    for (const point of map.buildable) {
      // Outer road radius 25, plot radius 22 plus half its widest 3-unit stroke.
      const gap = distanceToRoute(point, map.waypoints) - 25 - 23.5;
      expect(gap).toBeGreaterThanOrEqual(6 - 1e-6);
      expect(gap).toBeLessThanOrEqual(14 + 1e-6);
    }
  });

  it('puts all nine Classic plots within useful reach of the painted road', () => {
    expect(MAP1.buildable).toHaveLength(9);
    for (const point of MAP1.buildable) {
      expect(distanceToRoute(point, MAP1.waypoints)).toBeLessThanOrEqual(90);
      expect(plotRoadClearance(point, CLASSIC_ROAD_ENVELOPE)).toBeGreaterThanOrEqual(6 - 1e-6);
      expect(plotRoadClearance(point, CLASSIC_ROAD_ENVELOPE)).toBeLessThanOrEqual(14 + 1e-6);
    }
  });

  it('keeps every full plot circle in the field and separates hit targets', () => {
    const counts = [12, 10, 13, 17, 22, 17, 18, 18, 18, 12, 17, 15, 14, 11, 13, 12, 11, 9, 10, 12, 18, 14, 14, 14, 15, 14, 12, 12, 12, 14];
    expect(CAMPAIGN_LEVELS.map(level => resolveCampaignMap(level).buildable.length)).toEqual(counts);
    for (const map of [MAP1, ...CAMPAIGN_LEVELS.map(resolveCampaignMap)]) {
      for (const [index, point] of map.buildable.entries()) {
        expect(point.x - 23.5).toBeGreaterThanOrEqual(map.field.x);
        expect(point.x + 23.5).toBeLessThanOrEqual(map.field.x + map.field.width);
        expect(point.y - 23.5).toBeGreaterThanOrEqual(map.field.y);
        expect(point.y + 23.5).toBeLessThanOrEqual(map.field.y + map.field.height);
        for (const other of map.buildable.slice(index + 1)) expect(Math.hypot(point.x - other.x, point.y - other.y)).toBeGreaterThanOrEqual(52);
      }
    }
    for (const level of CAMPAIGN_LEVELS) expect(resolveCampaignMap(level).buildable).toEqual(resolveCampaignMap(level).buildable);
  });

  it('measures rounded road ends and different shoulder widths', () => {
    const road = { route: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }], radii: [25, 35] };
    expect(roadEdgeDistance({ x: -35, y: 0 }, road)).toBeCloseTo(10);
    expect(roadEdgeDistance({ x: 145, y: 50 }, road)).toBeCloseTo(10);
    expect(roadEdgeDistance({ x: 0, y: 0 }, road)).toBe(-25);
  });

  it('merges continuous coverage through a turn without joining separated passes', () => {
    const corner = [{ x: -100, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 100 }];
    expect(longestRoadCoverage({ x: 0, y: 0 }, corner, 50)).toBeCloseTo(100);
    expect(longestRoadCoverage({ x: 0, y: 50 }, [{ x: -100, y: 0 }, { x: 100, y: 0 }], 50)).toBe(0);
    const separate = [{ x: -100, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 200 }, { x: -100, y: 200 }];
    expect(longestRoadCoverage({ x: 0, y: 100 }, separate, 110)).toBeCloseTo(2 * Math.sqrt(2100));
  });

  it('gives every base tower a continuous attack window of at least 100 units', () => {
    for (const map of [MAP1, ...CAMPAIGN_LEVELS.map(resolveCampaignMap)]) {
      for (const point of map.buildable) for (const tower of Object.values(TOWERS)) {
        let current = 0, longest = 0;
        // Independent 1-unit traversal oracle, allowing one unit sampling error.
        for (let i = 1; i < map.waypoints.length; i++) {
          const a = map.waypoints[i - 1], b = map.waypoints[i];
          const length = Math.hypot(b.x - a.x, b.y - a.y), steps = Math.ceil(length);
          for (let step = 1; step <= steps; step++) {
            const t = step / steps;
            if (Math.hypot(a.x + (b.x - a.x) * t - point.x, a.y + (b.y - a.y) * t - point.y) <= tower.levels[0].range) {
              current += length / steps; longest = Math.max(longest, current);
            } else current = 0;
          }
        }
        expect(longest, `${map.id}/${tower.id}`).toBeGreaterThanOrEqual(99);
      }
    }
  });
});
