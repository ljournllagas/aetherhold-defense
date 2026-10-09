import { MAP1, type MapDef, type MapPoint } from '../maps/map1.ts';
import type { CampaignLevelDefinition } from './types.ts';

type Route = readonly (readonly [number, number])[];

// Four separately authored route families per biome, in the existing field coordinates.
export const CAMPAIGN_ROUTES: Readonly<Record<string, Route>> = {
  borderkeep_a: [[0,130],[230,130],[230,320],[620,320],[620,510],[925,510],[925,280],[1000,280]],
  borderkeep_b: [[0,490],[210,490],[210,170],[490,170],[490,470],[760,470],[760,250],[1000,250]],
  borderkeep_c: [[0,170],[790,170],[790,350],[260,350],[260,535],[925,535],[925,290],[1000,290]],
  borderkeep_d: [[0,350],[180,350],[180,140],[780,140],[780,520],[380,520],[380,330],[1000,330]],
  emberfall_a: [[0,190],[290,190],[290,475],[600,475],[600,250],[830,250],[830,490],[1000,490]],
  emberfall_b: [[0,510],[340,510],[340,340],[140,340],[140,145],[680,145],[680,420],[1000,420]],
  emberfall_c: [[0,130],[820,130],[820,320],[220,320],[220,530],[760,530],[760,420],[1000,420]],
  emberfall_d: [[0,310],[190,310],[190,145],[780,145],[780,515],[420,515],[420,310],[1000,310]],
  frostveil_a: [[0,480],[240,480],[240,210],[560,210],[560,490],[850,490],[850,280],[1000,280]],
  frostveil_b: [[0,160],[360,160],[360,460],[660,460],[660,210],[850,210],[850,500],[1000,500]],
  frostveil_c: [[0,530],[770,530],[770,345],[180,345],[180,145],[910,145],[910,330],[1000,330]],
  frostveil_d: [[0,340],[160,340],[160,150],[800,150],[800,530],[410,530],[410,340],[1000,340]]
};

export function distanceToRoute(point: MapPoint, route: readonly MapPoint[]): number {
  let nearest = Infinity;
  for (let i = 1; i < route.length; i++) {
    const a = route[i - 1], b = route[i], dx = b.x - a.x, dy = b.y - a.y;
    const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy)));
    nearest = Math.min(nearest, Math.hypot(point.x - a.x - t * dx, point.y - a.y - t * dy));
  }
  return nearest;
}

export function resolveCampaignMap(level: CampaignLevelDefinition): MapDef {
  const match = /^(borderkeep|emberfall|frostveil)_([abcd])/.exec(level.mapLayoutId);
  const family = match ? `${match[1]}_${match[2]}` : '';
  const route = CAMPAIGN_ROUTES[family];
  if (!route) throw new Error(`Unknown campaign map: ${level.mapLayoutId}`);
  const variant = level.mapLayoutId.endsWith('2') ? 1 : level.mapLayoutId.endsWith('3') ? 2 : 0;
  const waypoints = route.map(([x, y], index) => ({ x, y: y + (index > 0 && index < route.length - 1 ? variant * (family.endsWith('a') ? 10 : -8) : 0) }));
  const buildable: MapPoint[] = [];
  // Variants author different building clearings as well as route offsets.
  for (let row = 0; row < 5; row++) for (let col = 0; col < 8; col++) {
    const point = { x: 105 + col * 108, y: 110 + row * 106 };
    const distance = distanceToRoute(point, waypoints);
    if (distance >= 46 && distance <= 155 && (row + col + variant) % 3 !== 0) buildable.push(point);
  }
  const gate = waypoints[waypoints.length - 1];
  return { ...MAP1, id: level.mapLayoutId, name: `${level.worldId} · Level ${level.level}`, backgroundKey: `campaign_${family}`, waypoints, buildable, spawn: waypoints[0], gate, stronghold: { x: 1005, y: gate.y - 35 }, beacon: { x: 1005, y: gate.y - 85 } };
}
