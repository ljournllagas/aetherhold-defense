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
  [330, 300], [550, 295], [780, 305], [1000, 320],
  [500, 555], [630, 570], [745, 575], [210, 570], [1370, 480]
];

const waypoints = pathNativePx.map(mapNativeToWorld);
const buildable = buildableNativePx.map(mapNativeToWorld);
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
