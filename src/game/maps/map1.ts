import { resolveBuildPlots, type RoadEnvelope } from './buildPlotPolicy.ts';
import { TOWERS } from '../config/towers.ts';

/**
 * Single production battlefield: Ancient Border Keep.
 * World coordinates use the full 1280x720 game canvas. The painted map is a
 * separate 1040x584 field below the 56px HUD; the 240px catalog and 80px tray
 * remain UI space and are not part of the background texture.
 */
export interface MapPoint {
  x: number;
  y: number;
}

export interface MapDef {
  id: string;
  name: string;
  width: number;
  height: number;
  field: { x: number; y: number; width: number; height: number };
  backgroundKey: string;
  waypoints: MapPoint[];
  buildable: MapPoint[]; // plot centers, in full-canvas world coordinates
  spawn: MapPoint;
  gate: MapPoint; // enemy route endpoint at the keep bridge
  stronghold: MapPoint; // painted keep/base anchor
  beacon: MapPoint; // separate health-state overlay anchor
}

const W = 1280;
const H = 720;
const HUD = 56;
const FIELD = { x: 0, y: HUD, width: 1040, height: 584 } as const;
const ART_WIDTH = 1672;
const ART_HEIGHT = 940;

/** Transform a native pixel in the accepted 1672x940 map to world space. */
export function mapNativeToWorld(point: readonly [number, number]): MapPoint {
  return {
    x: FIELD.x + (point[0] * FIELD.width) / ART_WIDTH,
    y: FIELD.y + (point[1] * FIELD.height) / ART_HEIGHT
  };
}

/** Centerline candidates traced against the accepted painted road. */
const pathNativePx: ReadonlyArray<readonly [number, number]> = [
  [42, 0], [120, 70], [160, 140], [245, 175], [365, 181], [470, 174],
  [580, 166], [702, 165], [850, 174], [986, 200], [1127, 239], [1230, 302],
  [1300, 365], [1295, 410], [1250, 456], [1168, 500], [1070, 523], [929, 520],
  [823, 497], [700, 458], [595, 424], [478, 399], [380, 415], [330, 460],
  [327, 520], [352, 566], [413, 622], [540, 662], [685, 680], [861, 687],
  [1018, 686], [1149, 679], [1245, 650], [1340, 611], [1425, 565], [1460, 526],
  [1475, 490], [1475, 420]
];

/** Candidate centers are only in the broad unmarked clearings beside the road. */
const buildableNativePx: ReadonlyArray<readonly [number, number]> = [
  [400, 275], [590, 280], [875, 295], [1100, 375],
  [555, 560], [665, 580], [805, 590], [235, 575], [1060, 775]
];

const waypoints = pathNativePx.map(mapNativeToWorld);
// Painted shoulder half-widths traced in native pixels, one per route segment.
// The wider upper bend and eastern turn differ from the narrow southern road.
const roadHalfWidthsNative = [48, 48, 43, 39, 38, 38, 38, 40, 43, 46, 48, 49,
  49, 48, 46, 43, 41, 40, 39, 38, 39, 42, 44, 46, 46, 44, 42, 40, 39, 39,
  40, 42, 43, 44, 45, 43, 40];
export const CLASSIC_ROAD_ENVELOPE: RoadEnvelope = {
  route: waypoints, radii: roadHalfWidthsNative.map(width => width * FIELD.width / ART_WIDTH)
};
const authored = buildableNativePx.map(mapNativeToWorld);
const buildable = resolveBuildPlots(authored, {
  road: CLASSIC_ROAD_ENVELOPE, field: FIELD,
  minimumRange: Math.min(...Object.values(TOWERS).map(tower => tower.levels[0].range)),
  // Retain the side and region of the existing clearings; avoid distant forest/keep candidates.
  allowed: (point, index) => Math.hypot(point.x - authored[index].x, point.y - authored[index].y) <= 95
});
const spawn = mapNativeToWorld(pathNativePx[0]);
const gate = mapNativeToWorld([1475, 420]);

export const MAP1: MapDef = {
  id: 'ancient-border-keep',
  name: 'Ancient Border Keep',
  width: W,
  height: H,
  field: FIELD,
  backgroundKey: 'map_ancient_border_keep',
  waypoints,
  buildable,
  spawn,
  gate,
  stronghold: mapNativeToWorld([1550, 330]),
  beacon: mapNativeToWorld([1620, 120])
};

export const GAME_WIDTH = W;
export const GAME_HEIGHT = H;
export const HUD_HEIGHT = HUD;
