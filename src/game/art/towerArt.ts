import Phaser from 'phaser';
import { TOWERS } from '../config/towers.ts';
import { EVOLUTIONS } from '../config/evolutions.ts';
import { contactShadow, P2 } from './artkit.ts';
import type { BranchId, EvolutionRank } from '../../shared/progression.ts';
import { campaignTowerTextureKey } from './campaignArt.ts';
import { ADDITIONAL_TOWER_GEOMETRY } from './additionalTowerGeometry.ts';

const CELL = 627;

type TowerId = 'longbow' | 'ember' | 'glacier' | 'starfire' | 'tempest' | 'sentinel' | 'cinder';
interface AlphaBounds { left: number; top: number; width: number; height: number; bottom: number; }
interface TowerStageArt {
  textureKey: string;
  sourceWidth: number;
  sourceHeight: number;
  bounds: AlphaBounds;
  targetHeight: number;
  focus: { x: number; y: number };
  frameIndex?: number;
  groundCenterX?: number;
}
interface TowerArtSpec {
  targetHeight: number;
  focus: { x: number; y: number };
  bounds: readonly [AlphaBounds, AlphaBounds, AlphaBounds, AlphaBounds];
  stages?: readonly [TowerStageArt, TowerStageArt, TowerStageArt, TowerStageArt];
  groundCentersX?: readonly number[];
  focuses?: readonly { x: number; y: number }[];
}

// Alpha-trimmed source bounds were measured per frame in the reviewed atlases.
// `bottom` is the last occupied source row; all placed art is anchored there.
const ART: Record<TowerId, TowerArtSpec> = {
  longbow: {
    targetHeight: 112, focus: { x: 0, y: -0.82 },
    bounds: [
      { left: 157, top: 84, width: 354, height: 484, bottom: 567 },
      { left: 0, top: 49, width: 519, height: 546, bottom: 594 },
      { left: 104, top: 0, width: 504, height: 577, bottom: 576 },
      { left: 0, top: 0, width: 584, height: 595, bottom: 594 }
    ]
  },
  ember: {
    targetHeight: 84, focus: { x: -0.08, y: -0.72 },
    bounds: [
      { left: 102, top: 135, width: 448, height: 459, bottom: 593 },
      { left: 21, top: 88, width: 571, height: 524, bottom: 611 },
      { left: 35, top: 16, width: 581, height: 547, bottom: 562 },
      { left: 7, top: 33, width: 613, height: 543, bottom: 575 }
    ],
    stages: [
      {
        textureKey: 'tower_ember_stage_1_v2', sourceWidth: 1254, sourceHeight: 1254,
        bounds: { left: 185, top: 256, width: 888, height: 830, bottom: 1085 },
        targetHeight: 72, focus: { x: 0.12, y: -0.92 }
      },
      {
        textureKey: 'tower_ember_stage_2_v2', sourceWidth: 1254, sourceHeight: 1254,
        bounds: { left: 39, top: 91, width: 1189, height: 1130, bottom: 1220 },
        targetHeight: 78, focus: { x: 0.18, y: -0.93 }
      },
      {
        textureKey: 'tower_ember_stage_3_v2', sourceWidth: 1254, sourceHeight: 1254,
        bounds: { left: 39, top: 108, width: 1177, height: 1116, bottom: 1223 },
        targetHeight: 84, focus: { x: 0.22, y: -0.94 }
      },
      {
        textureKey: 'tower_ember', sourceWidth: CELL, sourceHeight: CELL, frameIndex: 3,
        bounds: { left: 7, top: 33, width: 613, height: 543, bottom: 575 },
        targetHeight: 84, focus: { x: -0.08, y: -0.72 }
      }
    ]
  },
  glacier: {
    targetHeight: 96, focus: { x: 0, y: -0.64 },
    bounds: [
      { left: 161, top: 173, width: 366, height: 430, bottom: 602 },
      { left: 92, top: 68, width: 402, height: 543, bottom: 610 },
      { left: 119, top: 16, width: 466, height: 565, bottom: 580 },
      { left: 40, top: 0, width: 511, height: 579, bottom: 578 }
    ]
  },
  starfire: {
    targetHeight: 100, focus: { x: 0, y: -0.68 },
    bounds: [
      { left: 155, top: 139, width: 376, height: 488, bottom: 626 },
      { left: 80, top: 41, width: 425, height: 586, bottom: 626 },
      { left: 124, top: 0, width: 450, height: 576, bottom: 575 },
      { left: 27, top: 0, width: 541, height: 604, bottom: 603 }
    ]
  },
  tempest: {
    targetHeight: 92, focus: { x: 0, y: -0.70 },
    bounds: [
      { left: 172, top: 164, width: 375, height: 454, bottom: 617 },
      { left: 95, top: 52, width: 420, height: 575, bottom: 626 },
      { left: 137, top: 14, width: 478, height: 575, bottom: 588 },
      { left: 67, top: 10, width: 513, height: 586, bottom: 595 }
    ]
  },
  sentinel: {
    targetHeight: 112, focus: { x: 0, y: -0.82 },
    ...ADDITIONAL_TOWER_GEOMETRY.sentinel
  },
  cinder: {
    targetHeight: 84, focus: { x: -0.08, y: -0.72 },
    ...ADDITIONAL_TOWER_GEOMETRY.cinder
  }
};

const IDS: readonly TowerId[] = ['longbow', 'ember', 'glacier', 'starfire', 'tempest', 'sentinel', 'cinder'];

// Separate static evolution appearances. Each entry replaces the foundation
// frames for its branch only, at every rank; rank chevrons and branch crests
// still come from decorateEvolution. Bounds were measured on the lossless
// master (alpha > 8); targetHeight/focus inherit the tower family so muzzle,
// selection and ground contact keep foundation behaviour, and campaign tiers
// keep precedence (static art applies at visualTier 1 only).
interface EvolutionStaticArt extends TowerStageArt { groundInset: number; }
const EVOLUTION_STATIC_ART: Partial<Readonly<Record<BranchId, EvolutionStaticArt>>> = {
  marksman: {
    textureKey: 'tower_longbow_marksman', sourceWidth: 1254, sourceHeight: 1254,
    bounds: { left: 319, top: 26, width: 843, height: 1209, bottom: 1234 },
    targetHeight: 112, focus: { x: 0, y: -0.82 }, groundCenterX: 627, groundInset: 172
  },
  volley: {
    textureKey: 'tower_longbow_volley', sourceWidth: 1254, sourceHeight: 1254,
    bounds: { left: 200, top: 24, width: 927, height: 1209, bottom: 1232 },
    targetHeight: 112, focus: { x: 0, y: -0.82 }, groundCenterX: 627, groundInset: 172
  },
  siegebreaker: {
    textureKey: 'tower_ember_siegebreaker', sourceWidth: 1254, sourceHeight: 1254,
    bounds: { left: 84, top: 26, width: 1138, height: 1207, bottom: 1232 },
    targetHeight: 84, focus: { x: -0.08, y: -0.72 }, groundCenterX: 627, groundInset: 229
  },
  'flame-mortar': {
    textureKey: 'tower_ember_flame-mortar', sourceWidth: 1254, sourceHeight: 1254,
    bounds: { left: 246, top: 23, width: 786, height: 1186, bottom: 1208 },
    targetHeight: 84, focus: { x: -0.08, y: -0.72 }, groundCenterX: 627, groundInset: 225
  },
  winterguard: {
    textureKey: 'tower_glacier_winterguard', sourceWidth: 1254, sourceHeight: 1254,
    bounds: { left: 275, top: 21, width: 755, height: 1210, bottom: 1230 },
    targetHeight: 96, focus: { x: 0, y: -0.64 }, groundCenterX: 627, groundInset: 220
  },
  'brittle-ice': {
    textureKey: 'tower_glacier_brittle-ice', sourceWidth: 1254, sourceHeight: 1254,
    bounds: { left: 300, top: 35, width: 675, height: 1198, bottom: 1232 },
    targetHeight: 96, focus: { x: 0, y: -0.64 }, groundCenterX: 627, groundInset: 220
  },
  spellbreaker: {
    textureKey: 'tower_starfire_spellbreaker', sourceWidth: 1254, sourceHeight: 1254,
    bounds: { left: 360, top: 18, width: 549, height: 1209, bottom: 1226 },
    targetHeight: 100, focus: { x: 0, y: -0.68 }, groundCenterX: 627, groundInset: 220
  },
  'arcane-beacon': {
    textureKey: 'tower_starfire_arcane-beacon', sourceWidth: 1254, sourceHeight: 1254,
    bounds: { left: 325, top: 13, width: 615, height: 1224, bottom: 1237 },
    targetHeight: 100, focus: { x: 0, y: -0.68 }, groundCenterX: 627, groundInset: 220
  },
  stormcaller: {
    textureKey: 'tower_tempest_stormcaller', sourceWidth: 1254, sourceHeight: 1254,
    bounds: { left: 342, top: 7, width: 704, height: 1217, bottom: 1224 },
    targetHeight: 92, focus: { x: 0, y: -0.70 }, groundCenterX: 627, groundInset: 220
  },
  thunderlord: {
    textureKey: 'tower_tempest_thunderlord', sourceWidth: 1254, sourceHeight: 1254,
    bounds: { left: 293, top: 21, width: 667, height: 1208, bottom: 1229 },
    targetHeight: 92, focus: { x: 0, y: -0.70 }, groundCenterX: 627, groundInset: 220
  },
  deadeye: {
    textureKey: 'tower_sentinel_deadeye', sourceWidth: 1254, sourceHeight: 1254,
    bounds: { left: 303, top: 32, width: 859, height: 1192, bottom: 1224 },
    targetHeight: 112, focus: { x: 0, y: -0.82 }, groundCenterX: 627, groundInset: 172
  }
};const PORTRAIT_BACKGROUNDS: Record<TowerId, string> = {
  longbow: '#344132', ember: '#443128', glacier: '#293944', starfire: '#352b46', tempest: '#293e3b',
  sentinel: '#3d3a2a', cinder: '#402a20'
};

// Source-pixel distance from the front edge to the center of the stone footprint,
// measured on the family/stage review grid (not the tip of the tower silhouette).
const GROUND_INSETS: Record<TowerId, readonly number[]> = {
  longbow: [58, 76, 92, 103], ember: [135, 194, 190, 100],
  glacier: [75, 82, 92, 106], starfire: [80, 88, 100, 115],
  tempest: [79, 88, 96, 104], sentinel: ADDITIONAL_TOWER_GEOMETRY.sentinel.groundInsets, cinder: ADDITIONAL_TOWER_GEOMETRY.cinder.groundInsets
};
// Occupied bounds of the 192px Campaign PNGs, excluding transparent padding.
const CAMPAIGN_BOUNDS: Record<TowerId, readonly AlphaBounds[]> = {
  longbow: [{ left:36, top:6, width:131, height:186, bottom:191 }, { left:33, top:5, width:133, height:187, bottom:191 }],
  ember: [{ left:10, top:17, width:178, height:171, bottom:187 }, { left:10, top:18, width:177, height:168, bottom:185 }],
  glacier: [{ left:30, top:14, width:133, height:170, bottom:183 }, { left:32, top:13, width:131, height:168, bottom:180 }],
  starfire: [{ left:36, top:12, width:120, height:167, bottom:178 }, { left:35, top:6, width:122, height:175, bottom:180 }],
  tempest: [{ left:26, top:15, width:136, height:171, bottom:185 }, { left:27, top:12, width:139, height:173, bottom:184 }],
  sentinel: ADDITIONAL_TOWER_GEOMETRY.sentinel.campaignBounds,
  cinder: ADDITIONAL_TOWER_GEOMETRY.cinder.campaignBounds
};

function placedArt(id: TowerId, stage: number, visualTier: 1 | 2 | 3 = 1, branchId: BranchId | null = null): TowerStageArt & { groundInset: number } {
  if (visualTier === 1 && branchId !== null && EVOLUTIONS[branchId]?.towerId === id) {
    const evo = EVOLUTION_STATIC_ART[branchId];
    if (evo) return { ...evo };
  }
  const art = stageArt(id, ART[id], stage);
  if (visualTier === 1) return { ...art, groundInset: GROUND_INSETS[id][stage] };
  const bounds = CAMPAIGN_BOUNDS[id][visualTier - 2];
  const additional = id === 'sentinel' || id === 'cinder' ? ADDITIONAL_TOWER_GEOMETRY[id] : undefined;
  return { ...art, textureKey: campaignTowerTextureKey(id, visualTier), frameIndex: undefined,
    sourceWidth: 192, sourceHeight: 192, bounds, groundInset: bounds.width * 0.2,
    groundCenterX: additional?.campaignGroundCentersX[visualTier - 2],
    focus: additional?.campaignFocuses[visualTier - 2] ?? art.focus };
}

export interface TowerView {
  /** Container origin is the build-plot ground anchor. */
  view: Phaser.GameObjects.Container;
  /** Empty focus group kept separate so a consumer can animate the weapon only. */
  crown: Phaser.GameObjects.Container;
  /** Projectile origin in canonical world pixels, measured from `view` origin. */
  muzzleX: number;
  muzzleY: number;
  /** Ground footprint and alpha-trimmed displayed bounds in local canonical pixels. */
  footprintPx: number;
  visualWidth: number;
  visualHeight: number;
  displayBounds: { left: number; top: number; width: number; height: number };
}

function normalizeTowerId(towerId: string): TowerId {
  return IDS.includes(towerId as TowerId) ? towerId as TowerId : 'longbow';
}

function atlasKey(id: TowerId): string {
  return TOWERS[id].assetKey;
}

function stageArt(id: TowerId, spec: TowerArtSpec, stage: number): TowerStageArt {
  return spec.stages?.[stage] ?? {
    textureKey: atlasKey(id), sourceWidth: CELL, sourceHeight: CELL,
    frameIndex: stage, bounds: spec.bounds[stage], targetHeight: spec.targetHeight, focus: spec.focuses?.[stage] ?? spec.focus,
    groundCenterX: spec.groundCentersX?.[stage]
  };
}

function addCampaignTierOverlay(scene: Phaser.Scene, parent: Phaser.GameObjects.Container, tier: 2 | 3): void {
  const g = scene.add.graphics();
  g.fillStyle(0x483b29, 0.94); g.fillRect(-24, -15, 48, 7);
  g.lineStyle(3, 0x8a744e, 0.96);
  g.lineBetween(-21, -14, -18, -42); g.lineBetween(21, -14, 18, -42);
  g.lineBetween(-22, -28, 22, -28); g.lineBetween(-18, -42, -9, -48); g.lineBetween(18, -42, 9, -48);
  g.fillStyle(0xd7aa4e, 1); g.fillCircle(-21, -15, 2.5); g.fillCircle(21, -15, 2.5);
  if (tier === 3) {
    g.lineStyle(2, 0x9e7ae6, 0.92);
    g.lineBetween(-14, -54, -7, -62); g.lineBetween(-7, -62, 0, -54); g.lineBetween(0, -54, 7, -62); g.lineBetween(7, -62, 14, -54);
    g.fillStyle(0xd1b3ff, 1);
    g.fillPoints(P2([{ x: 0, y: -72 }, { x: 5, y: -64 }, { x: 0, y: -57 }, { x: -5, y: -64 }]), true);
    g.fillCircle(-15, -54, 2); g.fillCircle(15, -54, 2);
  }
  parent.add(g);
}

/** Production sprite art; campaign tiers add replaceable cosmetics without changing classic towers.
 * An evolved branch with its own static appearance replaces the foundation
 * frames at visualTier 1; a missing texture falls back to foundation art. */
export function buildTowerVisual(scene: Phaser.Scene, towerId: string, level: number, visualTier: 1 | 2 | 3 = 1, branchId: BranchId | null = null): TowerView {
  const id = normalizeTowerId(towerId);
  const spec = ART[id];
  const stage = Math.max(1, Math.min(4, Math.floor(level))) - 1;
  const productionKey = visualTier === 2 || visualTier === 3 ? campaignTowerTextureKey(id, visualTier) : '';
  const hasProductionArt = productionKey !== '' && scene.textures.exists(productionKey);
  const tier: 1 | 2 | 3 = hasProductionArt ? visualTier : 1;
  const wantsStatic = tier === 1 && branchId !== null && EVOLUTIONS[branchId]?.towerId === id
    && EVOLUTION_STATIC_ART[branchId] !== undefined && scene.textures.exists(EVOLUTION_STATIC_ART[branchId].textureKey);
  const art = placedArt(id, stage, tier, wantsStatic ? branchId : null);
  const bounds = art.bounds;
  const scale = art.targetHeight / bounds.height;
  const sourceCenterX = art.groundCenterX ?? bounds.left + bounds.width / 2;
  const centerOffsetX = sourceCenterX - art.sourceWidth / 2;
  const bottomMargin = art.sourceHeight - 1 - bounds.bottom;
  const groundOffset = art.groundInset * scale;
  const view = scene.add.container(0, 0);
  const shadow = contactShadow(scene, 0, 0, 62, 25).setAlpha(0.42);
  const sprite = (art.frameIndex === undefined
      ? scene.add.image(-centerOffsetX * scale, bottomMargin * scale + groundOffset, art.textureKey)
      : scene.add.image(-centerOffsetX * scale, bottomMargin * scale + groundOffset, art.textureKey, art.frameIndex))
      .setOrigin(0.5, 1).setScale(scale);
  const crown = scene.add.container(0, 0);
  view.add([shadow, sprite, crown]);
  if ((visualTier === 2 || visualTier === 3) && !hasProductionArt) {
    const overlay = scene.add.container(0, groundOffset);
    addCampaignTierOverlay(scene, overlay, visualTier); view.add(overlay);
  }

  const visualWidth = bounds.width * scale;
  const visualHeight = bounds.height * scale;
  const displayBounds = { left: (bounds.left - sourceCenterX) * scale,
    top: (bounds.top - bounds.bottom) * scale + groundOffset, width: visualWidth, height: visualHeight };

  return {
    view,
    crown,
    muzzleX: Math.round(art.focus.x * art.targetHeight),
    muzzleY: Math.round(art.focus.y * art.targetHeight + groundOffset),
    footprintPx: 64,
    visualWidth,
    visualHeight,
    displayBounds
  };
}

/** Existing UI key contract; portraits are rendered from the production atlas. */
export function towerPortraitKey(towerId: string): string {
  return `portrait_${normalizeTowerId(towerId)}`;
}

export function ensureTowerPortraits(scene: Phaser.Scene): void {
  for (const id of IDS) {
    const key = towerPortraitKey(id);
    if (scene.textures.exists(key)) continue;
    const spec = ART[id];
    const textureKey = atlasKey(id);
    if (!scene.textures.exists(textureKey)) continue;
    const bounds = spec.bounds[3];
    const atlas = scene.textures.get(textureKey);
    const source = atlas.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    const canvas = scene.textures.createCanvas(key, 64, 64);
    if (!canvas) continue;
    const context = canvas.getContext();
    context.clearRect(0, 0, 64, 64);
    context.fillStyle = PORTRAIT_BACKGROUNDS[id];
    context.fillRect(0, 0, 64, 64);
    context.fillStyle = 'rgba(0,0,0,0.24)';
    context.fillRect(0, 50, 64, 14);
    const maxW = 54;
    const maxH = 58;
    const portraitScale = Math.min(maxW / bounds.width, maxH / bounds.height);
    const drawW = bounds.width * portraitScale;
    const drawH = bounds.height * portraitScale;
    const x = (64 - drawW) / 2;
    const y = 61 - drawH;
    const atlasColumn = 1;
    const atlasRow = 1;
    context.drawImage(
      source,
      atlasColumn * CELL + bounds.left, atlasRow * CELL + bounds.top, bounds.width, bounds.height,
      x, y, drawW, drawH
    );
    canvas.refresh();
  }
}

export interface EvolutionAccent {
  silhouette: 'scope-crest' | 'fanned-quiver' | 'ram-wedge' | 'flame-crown' | 'shield-crest' | 'shard-spikes' | 'broken-ward' | 'beacon-spire' | 'twin-forks' | 'hammer-head' | 'crosshair' | 'twin-daggers' | 'fire-pit' | 'plague-drop';
  color: number;
  label: string;
}

export const EVOLUTION_ACCENTS: Readonly<Record<BranchId, EvolutionAccent>> = {
  marksman: { silhouette: 'scope-crest', color: 0xd7aa4e, label: EVOLUTIONS.marksman.name },
  volley: { silhouette: 'fanned-quiver', color: 0x8ee6a0, label: EVOLUTIONS.volley.name },
  siegebreaker: { silhouette: 'ram-wedge', color: 0xb7c0c7, label: EVOLUTIONS.siegebreaker.name },
  'flame-mortar': { silhouette: 'flame-crown', color: 0xde8742, label: EVOLUTIONS['flame-mortar'].name },
  winterguard: { silhouette: 'shield-crest', color: 0xe1f5fe, label: EVOLUTIONS.winterguard.name },
  'brittle-ice': { silhouette: 'shard-spikes', color: 0x9fd4e8, label: EVOLUTIONS['brittle-ice'].name },
  spellbreaker: { silhouette: 'broken-ward', color: 0xd1b3ff, label: EVOLUTIONS.spellbreaker.name },
  'arcane-beacon': { silhouette: 'beacon-spire', color: 0xba68c8, label: EVOLUTIONS['arcane-beacon'].name },
  stormcaller: { silhouette: 'twin-forks', color: 0x67d0c4, label: EVOLUTIONS.stormcaller.name },
  thunderlord: { silhouette: 'hammer-head', color: 0xffee58, label: EVOLUTIONS.thunderlord.name },
  deadeye: { silhouette: 'crosshair', color: 0xd7aa4e, label: EVOLUTIONS.deadeye.name },
  headhunter: { silhouette: 'twin-daggers', color: 0x8ee6a0, label: EVOLUTIONS.headhunter.name },
  pyre: { silhouette: 'fire-pit', color: 0xde8742, label: EVOLUTIONS.pyre.name },
  contagion: { silhouette: 'plague-drop', color: 0x9fd4e8, label: EVOLUTIONS.contagion.name }
};

const ACCENT_OUTLINE = 0x0a0e12;

function points(flat: readonly number[]): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i + 1 < flat.length; i += 2) out.push({ x: flat[i], y: flat[i + 1] });
  return out;
}

/** Filled accent polygon with a dark edge drawn segment by segment. */
function accentPolygon(g: Phaser.GameObjects.Graphics, color: number, flat: readonly number[]): void {
  const pts = points(flat);
  g.fillStyle(color, 1);
  // fillPoints reads only x/y; plain points keep this module free of Phaser.Math at import time.
  g.fillPoints(pts as unknown as Phaser.Math.Vector2[], true);
  g.lineStyle(1.5, ACCENT_OUTLINE, 1);
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    g.lineBetween(a.x, a.y, b.x, b.y);
  }
}

/** Accent strokes over a wider dark stroke so the line reads on any terrain. */
function accentLines(g: Phaser.GameObjects.Graphics, color: number, draw: () => void): void {
  g.lineStyle(4, ACCENT_OUTLINE, 1); draw();
  g.lineStyle(2, color, 1); draw();
}

function polyline(g: Phaser.GameObjects.Graphics, flat: readonly number[]): void {
  for (let i = 0; i + 3 < flat.length; i += 2) g.lineBetween(flat[i], flat[i + 1], flat[i + 2], flat[i + 3]);
}

/** Silhouettes fit x -11..11, y -26..-2 (at most 24×24 px) above the rank chevrons. */
function drawSilhouette(g: Phaser.GameObjects.Graphics, accent: EvolutionAccent): void {
  const c = accent.color;
  switch (accent.silhouette) {
    case 'scope-crest':
      accentLines(g, c, () => { g.strokeCircle(0, -14, 8); g.lineBetween(-11, -14, 11, -14); g.lineBetween(0, -25, 0, -3); });
      break;
    case 'fanned-quiver':
      accentLines(g, c, () => { g.lineBetween(0, -3, -9, -22); g.lineBetween(0, -3, 0, -24); g.lineBetween(0, -3, 9, -22); });
      accentPolygon(g, c, [-11, -26, -6, -22, -10, -19]);
      accentPolygon(g, c, [0, -26, 3, -22, -3, -22]);
      accentPolygon(g, c, [11, -26, 10, -19, 6, -22]);
      break;
    case 'ram-wedge':
      accentPolygon(g, c, [-10, -3, 10, -3, 10, -14, 0, -25, -10, -14]);
      break;
    case 'flame-crown':
      accentPolygon(g, c, [-11, -3, 11, -3, 11, -18, 7, -11, 3, -25, -1, -12, -5, -22, -8, -11, -11, -18]);
      break;
    case 'shield-crest':
      accentPolygon(g, c, [-10, -25, 10, -25, 10, -12, 0, -2, -10, -12]);
      break;
    case 'shard-spikes':
      accentPolygon(g, c, [-11, -3, -6, -3, -9, -20]);
      accentPolygon(g, c, [-3, -3, 3, -3, 0, -26]);
      accentPolygon(g, c, [6, -3, 11, -3, 9, -20]);
      break;
    case 'broken-ward':
      accentLines(g, c, () => { g.strokeCircle(0, -14, 9); polyline(g, [-6, -6, -1, -14, 3, -12, 7, -22]); });
      break;
    case 'beacon-spire':
      accentLines(g, c, () => { g.strokeCircle(0, -16, 10); });
      accentPolygon(g, c, [0, -26, 5, -14, 3, -3, -3, -3, -5, -14]);
      break;
    case 'twin-forks':
      accentLines(g, c, () => { polyline(g, [-6, -25, -9, -15, -4, -15, -7, -3]); polyline(g, [6, -25, 3, -15, 8, -15, 5, -3]); });
      break;
    case 'hammer-head':
      accentPolygon(g, c, [-2, -17, 2, -17, 2, -3, -2, -3]);
      accentPolygon(g, c, [-11, -25, 11, -25, 11, -17, -11, -17]);
      break;
    case 'crosshair':
      accentLines(g, c, () => { g.strokeCircle(0, -14, 8); g.lineBetween(-11, -14, 11, -14); g.lineBetween(0, -25, 0, -3); });
      accentPolygon(g, c, [0, -26, 4, -20, 0, -18, -4, -20]);
      break;
    case 'twin-daggers':
      accentPolygon(g, c, [-11, -3, -6, -3, -8, -24]);
      accentPolygon(g, c, [11, -3, 6, -3, 8, -24]);
      accentPolygon(g, c, [-3, -8, 3, -8, 0, -26]);
      break;
    case 'fire-pit':
      accentPolygon(g, c, [-11, -3, 11, -3, 8, -12, -8, -12]);
      accentPolygon(g, c, [-5, -12, 5, -12, 3, -25, -3, -25]);
      break;
    case 'plague-drop':
      accentLines(g, c, () => { g.strokeCircle(0, -17, 7); });
      accentPolygon(g, c, [0, -26, 5, -14, 3, -3, -3, -3, -5, -14]);
      break;
  }
}

/** Replaces any earlier accent on `parent` with the branch crest and rank + 1 chevrons. No tweens. */
export function decorateEvolution(scene: Phaser.Scene, parent: Phaser.GameObjects.Container, branchId: BranchId, rank: EvolutionRank): Phaser.GameObjects.Container {
  for (const child of [...parent.list] as Phaser.GameObjects.GameObject[]) {
    if (!child.getData?.('evolutionAccent')) continue;
    parent.remove(child);
    child.destroy();
  }
  const top = (parent.getData('displayBounds') as { top: number } | undefined)?.top ?? -60;
  const accentView = scene.add.container(0, top - 6);
  const accent = EVOLUTION_ACCENTS[branchId];
  const g = scene.add.graphics();
  drawSilhouette(g, accent);
  const count = rank + 1, spacing = 7, start = -((count - 1) * spacing) / 2;
  for (let i = 0; i < count; i++) {
    const cx = start + i * spacing;
    g.fillStyle(accent.color, 1);
    g.fillTriangle(cx - 3, 0, cx + 3, 0, cx, 4);
    g.lineStyle(1, ACCENT_OUTLINE, 1);
    g.lineBetween(cx - 3, 0, cx, 4); g.lineBetween(cx, 4, cx + 3, 0); g.lineBetween(cx - 3, 0, cx + 3, 0);
  }
  accentView.add(g);
  accentView.setData('evolutionAccent', branchId);
  accentView.setData('evolutionRank', rank);
  parent.add(accentView);
  return accentView;
}

/** Read-only geometry for render audits and the consuming scene's contracts. */
export function towerArtGeometry(towerId: string, level: number, visualTier: 1 | 2 | 3 = 1, branchId: BranchId | null = null): TowerView['displayBounds'] & {
  footprintPx: number; visualWidth: number; visualHeight: number; muzzleX: number; muzzleY: number;
} {
  const id = normalizeTowerId(towerId);
  const spec = ART[id];
  const stage = Math.max(1, Math.min(4, Math.floor(level))) - 1;
  const art = placedArt(id, stage, visualTier, branchId);
  const bounds = art.bounds;
  const scale = art.targetHeight / bounds.height;
  const center = art.groundCenterX ?? bounds.left + bounds.width / 2;
  return {
    left: (bounds.left - center) * scale,
    top: (bounds.top - bounds.bottom + art.groundInset) * scale,
    width: bounds.width * scale,
    height: bounds.height * scale,
    footprintPx: 64,
    visualWidth: bounds.width * scale,
    visualHeight: bounds.height * scale,
    muzzleX: Math.round(art.focus.x * art.targetHeight),
    muzzleY: Math.round(art.focus.y * art.targetHeight + art.groundInset * scale)
  };
}
