import type { MapPoint } from './map1.ts';

export const BUILD_PLOT_POLICY = {
  radius: 22, strokeWidth: 3, idleStrokeWidth: 2, clearance: 10, minClearance: 6, maxClearance: 14,
  spacing: 52, minimumCoverage: 100, campaignRoadRadius: 25
} as const;

const outerRadius = BUILD_PLOT_POLICY.radius + BUILD_PLOT_POLICY.strokeWidth / 2;
export interface RoadEnvelope { route: readonly MapPoint[]; radii: readonly number[]; }

function projection(point: MapPoint, a: MapPoint, b: MapPoint): MapPoint {
  const dx = b.x - a.x, dy = b.y - a.y, squared = dx * dx + dy * dy;
  const t = squared ? Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / squared)) : 0;
  return { x: a.x + t * dx, y: a.y + t * dy };
}

/** Signed distance to the union of road segment capsules, including round corners. */
export function roadEdgeDistance(point: MapPoint, road: RoadEnvelope): number {
  if (road.route.length < 2 || road.radii.length !== road.route.length - 1) throw new Error('Invalid road envelope');
  return Math.min(...road.radii.map((radius, i) => {
    if (!Number.isFinite(radius) || radius < 0) throw new Error('Invalid road radius');
    const nearest = projection(point, road.route[i], road.route[i + 1]);
    return Math.hypot(point.x - nearest.x, point.y - nearest.y) - radius;
  }));
}

export function plotRoadClearance(point: MapPoint, road: RoadEnvelope): number {
  return roadEdgeDistance(point, road) - outerRadius;
}

/** Exact continuous route-distance intervals inside an attack circle. */
export function longestRoadCoverage(point: MapPoint, route: readonly MapPoint[], range: number): number {
  let offset = 0, intervalStart = -1, intervalEnd = -1, longest = 0;
  for (let i = 1; i < route.length; i++) {
    const a = route[i - 1], b = route[i], dx = b.x - a.x, dy = b.y - a.y;
    const length = Math.hypot(dx, dy);
    if (!length) continue;
    const ux = dx / length, uy = dy / length, px = point.x - a.x, py = point.y - a.y;
    const along = px * ux + py * uy, perpendicular = px * uy - py * ux;
    const discriminant = range * range - perpendicular * perpendicular;
    if (discriminant > 0) {
      const half = Math.sqrt(discriminant), start = Math.max(0, along - half), end = Math.min(length, along + half);
      if (end > start) {
        const absoluteStart = offset + start, absoluteEnd = offset + end;
        if (intervalStart >= 0 && absoluteStart <= intervalEnd + 1e-7) intervalEnd = absoluteEnd;
        else { intervalStart = absoluteStart; intervalEnd = absoluteEnd; }
        longest = Math.max(longest, intervalEnd - intervalStart);
      }
    }
    offset += length;
  }
  return longest;
}

interface PlacementOptions {
  road: RoadEnvelope;
  field: { x: number; y: number; width: number; height: number };
  minimumRange: number;
  allowed?: (point: MapPoint, index: number) => boolean;
}

/** Relocate authored clearings, preserving count and indices rather than generating extra plots. */
export function resolveBuildPlots(authored: readonly MapPoint[], options: PlacementOptions): MapPoint[] {
  const { road, field, minimumRange } = options;
  const candidates: MapPoint[] = [];
  for (let i = 1; i < road.route.length; i++) {
    const a = road.route[i - 1], b = road.route[i], dx = b.x - a.x, dy = b.y - a.y;
    const length = Math.hypot(dx, dy);
    if (!length) continue;
    const steps = Math.ceil(length / 8), distance = road.radii[i - 1] + outerRadius + BUILD_PLOT_POLICY.clearance;
    for (let step = 0; step <= steps; step++) for (const side of [-1, 1]) {
      const t = step / steps;
      candidates.push({ x: a.x + dx * t - dy / length * distance * side, y: a.y + dy * t + dx / length * distance * side });
    }
  }
  const valid = candidates.filter(point => {
    if (point.x - outerRadius < field.x || point.x + outerRadius > field.x + field.width ||
      point.y - outerRadius < field.y || point.y + outerRadius > field.y + field.height) return false;
    if ([road.route[0], road.route[road.route.length - 1]].some(end => Math.hypot(point.x - end.x, point.y - end.y) < 62)) return false;
    const clearance = plotRoadClearance(point, road);
    return clearance >= BUILD_PLOT_POLICY.minClearance - 1e-6 && clearance <= BUILD_PLOT_POLICY.maxClearance + 1e-6 &&
      longestRoadCoverage(point, road.route, minimumRange) >= BUILD_PLOT_POLICY.minimumCoverage;
  });
  const placed: MapPoint[] = [];
  for (const [index, original] of authored.entries()) {
    const nearest = valid.filter(point => (!options.allowed || options.allowed(point, index)) &&
      placed.every(other => Math.hypot(point.x - other.x, point.y - other.y) >= BUILD_PLOT_POLICY.spacing))
      .sort((a, b) => Math.hypot(a.x - original.x, a.y - original.y) - Math.hypot(b.x - original.x, b.y - original.y))[0];
    if (!nearest) throw new Error(`No valid build clearing for plot ${index}`);
    placed.push({ ...nearest });
  }
  return placed;
}
