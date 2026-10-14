import Phaser from 'phaser';
import type { MapDef } from '../maps/map1.ts';
import { BUILD_PLOT_POLICY } from '../maps/buildPlotPolicy.ts';
import { P2 } from './artkit.ts';
import { CAMPAIGN_ART_MANIFEST } from '../campaign/artManifest.ts';
import { CAMPAIGN_LEVELS, CAMPAIGN_WORLDS } from '../campaign/config.ts';
import { CAMPAIGN_ENEMIES } from '../campaign/enemies.ts';
import type { CampaignWorldId } from '../campaign/types.ts';
import type { CampaignBossSystem } from '../campaign/bosses.ts';

const WORLD_COLOR: Record<CampaignWorldId, { land: number; light: number; dark: number; accent: number }> = {
  borderkeep: { land: 0x354437, light: 0x526146, dark: 0x202c28, accent: 0x83a064 },
  emberfall: { land: 0x363434, light: 0x625449, dark: 0x211f21, accent: 0xe27737 },
  frostveil: { land: 0x58616a, light: 0x8997a0, dark: 0x313c45, accent: 0x9fd4e8 },
  whisperfen: { land: 0x33483c, light: 0x536c4c, dark: 0x172c2c, accent: 0x83bf72 },
  sunken_aether: { land: 0x29444a, light: 0x497078, dark: 0x152a36, accent: 0x55c7c6 },
  ironroot: { land: 0x48413b, light: 0x74604b, dark: 0x25272b, accent: 0xd58b57 },
  sky_isles: { land: 0x52616e, light: 0x7f99aa, dark: 0x28384a, accent: 0x83c7ee },
  dreadmoon: { land: 0x413d51, light: 0x63596f, dark: 0x201f32, accent: 0xb38de3 },
  astral_rift: { land: 0x403650, light: 0x655070, dark: 0x1e1931, accent: 0xd579e8 },
  aether_crown: { land: 0x554b42, light: 0x847454, dark: 0x282735, accent: 0xf1d27a }
};

const ROAD_MATERIAL: Record<CampaignWorldId, { edge: number; shoulder: number; bed: number; pavers: readonly number[]; highlight: number; seam: number }> = {
  borderkeep: { edge: 0x51483d, shoulder: 0x726652, bed: 0x88775f, pavers: [0xa6967c, 0x877865, 0xb0a086, 0x756a5b, 0x95846d, 0x7e715f, 0xa0937e, 0x827665], highlight: 0xc8b58f, seam: 0x5c5144 },
  emberfall: { edge: 0x302a27, shoulder: 0x5a4c40, bed: 0x74604e, pavers: [0x8c7157, 0x77614f, 0x9a7856, 0x65584e, 0x826b58, 0x725b49], highlight: 0xb0916d, seam: 0x463b33 },
  frostveil: { edge: 0x3e474c, shoulder: 0x68737a, bed: 0x87939a, pavers: [0xaeb9bd, 0x929fa5, 0xc0c8c9, 0x78868d, 0x9eaaae, 0x89959a], highlight: 0xdbe0de, seam: 0x59666d },
  whisperfen: { edge: 0x26332b, shoulder: 0x3c5140, bed: 0x536b51, pavers: [0x687761, 0x536956, 0x7c8068, 0x495e4b, 0x6c755e], highlight: 0xa6ae7f, seam: 0x354638 },
  sunken_aether: { edge: 0x22343a, shoulder: 0x35555b, bed: 0x4d7375, pavers: [0x6d8984, 0x527276, 0x83958a, 0x3e646b, 0x66807e], highlight: 0xb2c7b5, seam: 0x304e53 },
  ironroot: { edge: 0x302c2a, shoulder: 0x51463b, bed: 0x6b5a49, pavers: [0x80674e, 0x685545, 0x927452, 0x5c5048, 0x79634d], highlight: 0xc59c6c, seam: 0x403733 },
  sky_isles: { edge: 0x35434d, shoulder: 0x536674, bed: 0x6f8793, pavers: [0x91a5aa, 0x728b96, 0xa7b8b8, 0x607984, 0x8299a0], highlight: 0xcbd9d8, seam: 0x485a65 },
  dreadmoon: { edge: 0x2d2b3d, shoulder: 0x474458, bed: 0x5d596c, pavers: [0x797486, 0x5c586c, 0x898291, 0x4d4a5f, 0x6c667b], highlight: 0xb1a7c0, seam: 0x393647 },
  astral_rift: { edge: 0x2b2539, shoulder: 0x45374e, bed: 0x604766, pavers: [0x80618a, 0x644e75, 0x92719a, 0x53445f, 0x765c84], highlight: 0xd29edb, seam: 0x3b2f4a },
  aether_crown: { edge: 0x352f36, shoulder: 0x5d5049, bed: 0x796752, pavers: [0x9b8058, 0x7b684e, 0xb09360, 0x675a50, 0x8d7654], highlight: 0xe2ca8b, seam: 0x463b3b }
};

const ENEMY_WORLD = Object.fromEntries(CAMPAIGN_LEVELS.flatMap(level => [
  ...level.enemyIds,
  ...(level.bossEnemyId ? [level.bossEnemyId] : [])
].map(id => [id, level.worldId]))) as Readonly<Record<string, CampaignWorldId>>;
const BOSSES = new Set(CAMPAIGN_WORLDS.map(world => world.bossEnemyId));

export type CampaignBossArtState = ReturnType<CampaignBossSystem['presentation']>;

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) h = Math.imul(h ^ value.charCodeAt(i), 16777619);
  return h >>> 0;
}

function randomFor(seed: number): () => number {
  let state = seed || 1;
  return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
}

function path(g: Phaser.GameObjects.Graphics, points: readonly { x: number; y: number }[], color: number, width: number, alpha = 1): void {
  if (points.length < 2) return;
  g.lineStyle(width, color, alpha);
  g.beginPath(); g.moveTo(points[0].x, points[0].y);
  for (const p of points.slice(1)) g.lineTo(p.x, p.y);
  g.strokePath();
}

function brushRoadBand(g: Phaser.GameObjects.Graphics, points: readonly { x: number; y: number }[], color: number, width: number, alpha: number): void {
  const radius = width / 2;
  const spacing = Math.max(8, width * 0.28);
  g.fillStyle(color, alpha);
  for (let segment = 1; segment < points.length; segment++) {
    const from = points[segment - 1], to = points[segment];
    const dx = to.x - from.x, dy = to.y - from.y;
    const length = Math.hypot(dx, dy);
    if (length === 0) continue;
    const steps = Math.ceil(length / spacing);
    for (let step = segment === 1 ? 0 : 1; step <= steps; step++) {
      const t = step / steps;
      g.fillCircle(from.x + dx * t, from.y + dy * t, radius);
    }
  }
}

function paintRoadStones(g: Phaser.GameObjects.Graphics, points: readonly { x: number; y: number }[], mapId: string, worldId: CampaignWorldId): void {
  const material = ROAD_MATERIAL[worldId];
  const random = randomFor(hash(`${worldId}:${mapId}:road`));
  const across = [-15.2, -7.6, 0, 7.6, 15.2];
  const stoneShape = [[-0.82, -0.34], [-0.35, -0.91], [0.42, -0.86], [0.96, -0.2], [0.74, 0.63], [0.13, 0.97], [-0.62, 0.78], [-0.98, 0.17]] as const;

  for (let segment = 1; segment < points.length; segment++) {
    const from = points[segment - 1], to = points[segment];
    const dx = to.x - from.x, dy = to.y - from.y;
    const length = Math.hypot(dx, dy);
    if (length === 0) continue;
    const tangentX = dx / length, tangentY = dy / length;
    const normalX = -tangentY, normalY = tangentX;
    for (let row = 0; row < across.length; row++) {
      const phase = row % 2 ? 6.2 : 0;
      let distance = -3 + phase + random() * 3;
      while (distance < length + 3) {
        const along = distance + (random() - 0.5) * 3.4;
        const offset = across[row] + (random() - 0.5) * 2.6;
        const centerX = from.x + tangentX * along + normalX * offset;
        const centerY = from.y + tangentY * along + normalY * offset;
        const halfLength = 4.6 + random() * 2.9;
        const halfWidth = 2.4 + random() * 1.1;
        const rotation = (random() - 0.5) * 0.24;
        const cos = Math.cos(rotation), sin = Math.sin(rotation);
        const vertices = stoneShape.map(([u, v]) => {
          const roughU = u * halfLength + (random() - 0.5) * 1.25;
          const roughV = v * halfWidth + (random() - 0.5) * 0.62;
          const rotatedU = roughU * cos - roughV * sin;
          const rotatedV = roughU * sin + roughV * cos;
          return {
            x: centerX + tangentX * rotatedU + normalX * rotatedV,
            y: centerY + tangentY * rotatedU + normalY * rotatedV
          };
        });

        g.fillStyle(material.pavers[Math.floor(random() * material.pavers.length)], 0.96);
        g.fillPoints(P2(vertices), true);

        let lightEdge = 0, shadeEdge = 0, lightScore = Infinity, shadeScore = -Infinity;
        for (let edge = 0; edge < vertices.length; edge++) {
          const next = (edge + 1) % vertices.length;
          const score = vertices[edge].x + vertices[next].x + vertices[edge].y + vertices[next].y;
          if (score < lightScore) { lightScore = score; lightEdge = edge; }
          if (score > shadeScore) { shadeScore = score; shadeEdge = edge; }
        }
        const lightNext = (lightEdge + 1) % vertices.length;
        const shadeNext = (shadeEdge + 1) % vertices.length;
        g.lineStyle(0.8, material.highlight, 0.42);
        g.lineBetween(vertices[lightEdge].x, vertices[lightEdge].y, vertices[lightNext].x, vertices[lightNext].y);
        g.lineStyle(0.7, material.seam, 0.35);
        g.lineBetween(vertices[shadeEdge].x, vertices[shadeEdge].y, vertices[shadeNext].x, vertices[shadeNext].y);
        distance += 10.8 + random() * 5.1;
      }
    }
  }
}

function paintCampaignMapOverlay(g: Phaser.GameObjects.Graphics, map: MapDef, worldId: CampaignWorldId): void {
  const { width, height } = map.field;
  const palette = WORLD_COLOR[worldId];
  const clearings = map.buildable;
  for (const point of clearings) {
    g.fillStyle(palette.light, 0.11); g.fillCircle(point.x - map.field.x, point.y - map.field.y, 26);
  }
  const waypoints = map.waypoints.map(point => ({ x: point.x - map.field.x, y: point.y - map.field.y }));
  const road = ROAD_MATERIAL[worldId];
  brushRoadBand(g, waypoints, road.edge, BUILD_PLOT_POLICY.campaignRoadRadius * 2, 0.78);
  brushRoadBand(g, waypoints, road.shoulder, 44, 0.96);
  brushRoadBand(g, waypoints, road.bed, 37, 1);
  paintRoadStones(g, waypoints, map.id, worldId);
  g.fillStyle(palette.accent, 0.92); g.fillCircle(map.beacon.x - map.field.x, map.beacon.y - map.field.y, 5);
}

/** Reuses an approved terrain plate under the authored runtime route; otherwise keeps the deterministic painter. */
export function ensureCampaignBattleBackground(scene: Phaser.Scene, map: MapDef, worldId: CampaignWorldId): string {
  const key = `campaign_temp_${map.id}`;
  if (scene.textures.exists(key)) return key;
  const { width, height } = map.field;
  if (scene.textures.exists(map.backgroundKey)) {
    const texture = scene.textures.addDynamicTexture(key, width, height);
    if (texture) {
      const background = scene.make.image({ x: 0, y: 0 }, false)
        .setTexture(map.backgroundKey).setOrigin(0, 0).setDisplaySize(width, height);
      const overlay = scene.make.graphics({ x: 0, y: 0 }, false);
      paintCampaignMapOverlay(overlay, map, worldId);
      texture.draw([background, overlay]).render();
      background.destroy(); overlay.destroy();
      return key;
    }
  }
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const palette = WORLD_COLOR[worldId];
  const random = randomFor(hash(`${worldId}:${map.id}`));
  g.fillStyle(palette.land, 1); g.fillRect(0, 0, width, height);
  for (let i = 0; i < 190; i++) {
    const x = random() * width, y = random() * height;
    const radius = 3 + random() * 13;
    g.fillStyle(i % 3 ? palette.dark : palette.light, 0.14 + random() * 0.14);
    g.fillEllipse(x, y, radius * (worldId === 'frostveil' ? 1.6 : 2.1), radius);
  }
  if (worldId === 'borderkeep') {
    path(g, [{ x: 0, y: height * 0.76 }, { x: width * 0.22, y: height * 0.62 }, { x: width * 0.48, y: height * 0.74 }, { x: width * 0.72, y: height * 0.57 }, { x: width, y: height * 0.66 }], 0x254d50, 23, 0.78);
    path(g, [{ x: 0, y: height * 0.74 }, { x: width * 0.22, y: height * 0.6 }, { x: width * 0.48, y: height * 0.72 }, { x: width * 0.72, y: height * 0.55 }, { x: width, y: height * 0.64 }], 0x679092, 2, 0.72);
    for (let i = 0; i < 29; i++) {
      const x = random() * width, y = random() * height;
      if (y > height * 0.52 && y < height * 0.84) continue;
      const r = 12 + random() * 16;
      g.fillStyle(0x25352a, 0.92); g.fillTriangle(x, y - r * 1.6, x + r, y + r, x - r, y + r);
      g.fillStyle(0x55704a, 0.9); g.fillTriangle(x - 3, y - r * 1.3, x + r * 0.66, y + r * 0.8, x - r * 0.7, y + r * 0.8);
    }
  } else if (worldId === 'emberfall') {
    for (let i = 0; i < 15; i++) {
      const x = random() * width, y = random() * height, r = 34 + random() * 54;
      g.fillStyle(0x262427, 0.95); g.fillPoints(P2([{ x: x - r, y: y + r }, { x: x - r * 0.45, y: y - r * 0.38 }, { x, y: y - r }, { x: x + r * 0.52, y: y - r * 0.12 }, { x: x + r, y: y + r }]), true);
      g.fillStyle(0x4d4745, 0.8); g.fillTriangle(x - r * 0.38, y, x, y - r * 0.82, x + r * 0.35, y);
    }
    path(g, [{ x: width * 0.16, y: height }, { x: width * 0.25, y: height * 0.72 }, { x: width * 0.18, y: height * 0.48 }, { x: width * 0.31, y: height * 0.28 }, { x: width * 0.27, y: 0 }], 0xb34a25, 17, 0.72);
    path(g, [{ x: width * 0.16, y: height }, { x: width * 0.25, y: height * 0.72 }, { x: width * 0.18, y: height * 0.48 }, { x: width * 0.31, y: height * 0.28 }, { x: width * 0.27, y: 0 }], 0xe27737, 4, 0.92);
  } else {
    for (let i = 0; i < 15; i++) {
      const x = random() * width, y = random() * height, r = 42 + random() * 48;
      g.fillStyle(0x465159, 0.95); g.fillPoints(P2([{ x: x - r, y: y + r }, { x: x - r * 0.48, y: y - r * 0.3 }, { x: x - r * 0.08, y: y - r }, { x: x + r * 0.2, y: y - r * 0.28 }, { x: x + r, y: y + r }]), true);
      g.fillStyle(0xc2d0d8, 0.85); g.fillTriangle(x - r * 0.34, y - r * 0.06, x - r * 0.08, y - r, x + r * 0.12, y - r * 0.02);
    }
    path(g, [{ x: 0, y: height * 0.38 }, { x: width * 0.19, y: height * 0.47 }, { x: width * 0.41, y: height * 0.34 }, { x: width * 0.63, y: height * 0.42 }, { x: width * 0.84, y: height * 0.3 }, { x: width, y: height * 0.4 }], 0x44798c, 26, 0.75);
    path(g, [{ x: 0, y: height * 0.37 }, { x: width * 0.19, y: height * 0.46 }, { x: width * 0.41, y: height * 0.33 }, { x: width * 0.63, y: height * 0.41 }, { x: width * 0.84, y: height * 0.29 }, { x: width, y: height * 0.39 }], 0xa7d9e5, 2, 0.76);
  }
  paintCampaignMapOverlay(g, map, worldId);
  g.generateTexture(key, width, height); g.destroy();
  return key;
}

interface EnemyProfile { world: CampaignWorldId; role: 'basic' | 'runner' | 'brute' | 'armored' | 'support' | 'boss'; size: number; body: number; accent: number; }
function enemyProfile(id: string): EnemyProfile | null {
  const world = ENEMY_WORLD[id]; if (!world) return null;
  const palette = WORLD_COLOR[world];
  const config = CAMPAIGN_ENEMIES[id];
  if (!config) return null;
  const role = BOSSES.has(id) || config.isBoss ? 'boss' : config.baseSpeed >= 130 ? 'runner'
    : config.visualArchetype === 'mossmaw' && config.isElite ? 'support'
      : config.physicalArmor >= 0.35 ? 'armored' : config.baseHp >= 300 ? 'brute' : 'basic';
  const body = world === 'emberfall' ? 0x514b48 : world === 'frostveil' ? 0x728590
    : world === 'borderkeep' ? 0x6b6554 : palette.light;
  const accent = id === 'veilborn' || id === 'hollow_warden' ? 0x9e7ae6 : palette.accent;
  return { world, role, size: role === 'boss' ? 256 : 128, body, accent };
}

function drawCreature(g: Phaser.GameObjects.Graphics, id: string, s: number, body: number, accent: number, role: EnemyProfile['role']): void {
  const c = s / 2, k = s / 128;
  g.fillStyle(0x000000, 0.3); g.fillEllipse(c, s * 0.8, s * 0.52, s * 0.12);
  const large = role === 'boss' ? 1.45 : role === 'brute' ? 1.1 : 1;
  if (role === 'runner') {
    g.fillStyle(body, 1); g.fillEllipse(c, c + 12 * k, 63 * k, 32 * k);
    g.fillTriangle(c + 22 * k, c + 8 * k, c + 51 * k, c + 1 * k, c + 34 * k, c + 24 * k);
    g.lineStyle(6 * k, body, 1); g.lineBetween(c - 17 * k, c + 19 * k, c - 29 * k, c + 36 * k); g.lineBetween(c + 15 * k, c + 19 * k, c + 28 * k, c + 35 * k);
  } else {
    g.fillStyle(body, 1);
    g.fillEllipse(c, c + 6 * k, 42 * k * large, 57 * k * large);
    g.fillEllipse(c - 22 * k * large, c + 2 * k, 28 * k * large, 36 * k * large);
    g.fillEllipse(c + 22 * k * large, c + 2 * k, 28 * k * large, 36 * k * large);
    g.lineStyle(7 * k * large, body, 1); g.lineBetween(c - 10 * k, c + 25 * k, c - 13 * k, c + 40 * k); g.lineBetween(c + 10 * k, c + 25 * k, c + 13 * k, c + 40 * k);
    if (role === 'support') {
      g.lineStyle(5 * k, 0x443a30, 1); g.lineBetween(c + 34 * k, c + 27 * k, c + 30 * k, c - 34 * k);
      g.fillStyle(accent, 1); g.fillTriangle(c + 30 * k, c - 43 * k, c + 39 * k, c - 30 * k, c + 21 * k, c - 30 * k);
    }
  }
  if (role === 'brute' || role === 'armored' || role === 'boss') {
    const width = (role === 'boss' ? 80 : 54) * k, y = c - (role === 'boss' ? 12 : 15) * k;
    g.fillStyle(role === 'boss' ? 0x36373a : 0x484943, 1);
    g.fillPoints(P2([{ x: c - width / 2, y: y + 7 * k }, { x: c - width * 0.4, y: y - 14 * k }, { x: c - width * 0.12, y: y - 22 * k }, { x: c + width * 0.16, y: y - 19 * k }, { x: c + width * 0.45, y: y - 6 * k }, { x: c + width / 2, y: y + 8 * k }]), true);
    g.lineStyle(3 * k, accent, 0.95); g.lineBetween(c - width * 0.3, y - 7 * k, c - width * 0.12, y + 4 * k); g.lineBetween(c + width * 0.28, y - 8 * k, c + width * 0.1, y + 4 * k);
  }
  if (role === 'boss') {
    g.fillStyle(accent, 0.9); g.fillTriangle(c - 24 * k, c - 36 * k, c - 18 * k, c - 60 * k, c - 5 * k, c - 32 * k);
    g.fillTriangle(c + 24 * k, c - 36 * k, c + 18 * k, c - 60 * k, c + 5 * k, c - 32 * k);
    g.fillStyle(id === 'cinder_colossus' ? 0xffbd5f : id === 'frostbound_matriarch' ? 0xd5f3ff : 0xd1b3ff, 1);
    g.fillCircle(c, c + 2 * k, 9 * k);
  } else {
    g.fillStyle(role === 'runner' ? 0xe8c48b : 0x201e1c, 1);
    g.fillCircle(c + 7 * k, c - 4 * k, 3.3 * k);
    g.fillStyle(accent, id === 'ashcaller' || id === 'frost_shaman' ? 1 : 0.9);
    if (id === 'cinderling' || id === 'magmahide' || id === 'ember_brute') {
      g.lineStyle(3 * k, accent, 1); g.lineBetween(c - 6 * k, c - 11 * k, c - 2 * k, c + 2 * k); g.lineBetween(c - 2 * k, c + 2 * k, c - 9 * k, c + 13 * k);
    } else if (id === 'frostback' || id === 'glacier_knight' || id === 'icebound') {
      g.fillTriangle(c - 21 * k, c - 16 * k, c - 10 * k, c - 34 * k, c - 3 * k, c - 10 * k);
      g.fillTriangle(c + 4 * k, c - 14 * k, c + 16 * k, c - 32 * k, c + 20 * k, c - 5 * k);
    }
  }
}

export function ensureCampaignEnemyTexture(scene: Phaser.Scene, id: string): { key: string; size: number; profile: EnemyProfile | null; final: boolean } {
  const profile = enemyProfile(id);
  if (!profile) return { key: '', size: 0, profile: null, final: false };
  const finalKey = `campaign_enemy_${id}`;
  if (scene.textures.exists(finalKey)) {
    const asset = CAMPAIGN_ART_MANIFEST.find(item => item.key === finalKey);
    if (asset?.kind === 'sheet') {
      const texture = scene.textures.get(finalKey), columns = asset.width / asset.frameWidth!;
      for (const [state, frames] of Object.entries(asset.states)) for (let i = 0; i < frames.frames; i++) {
        const name = `${state}_${i}`;
        if (!texture.has(name)) texture.add(name, 0, (i % columns) * asset.frameWidth!, frames.row * asset.frameHeight!, asset.frameWidth!, asset.frameHeight!);
      }
    }
    return { key: finalKey, size: profile.size, profile, final: true };
  }
  const key = `campaign_enemy_temp_${id}`;
  if (!scene.textures.exists(key)) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    drawCreature(g, id, profile.size, profile.body, profile.accent, profile.role);
    g.generateTexture(key, profile.size, profile.size); g.destroy();
  }
  return { key, size: profile.size, profile, final: false };
}

export function campaignTowerTextureKey(towerId: string, tier: 2 | 3): string {
  return `campaign_tower_${towerId}_tier${tier}`;
}

export function campaignWorldMapCoverCrop(sourceWidth: number, sourceHeight: number, targetWidth: number, targetHeight: number) {
  if (![sourceWidth, sourceHeight, targetWidth, targetHeight].every(value => Number.isFinite(value) && value > 0)) return null;
  const scale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight);
  const width = targetWidth / scale, height = targetHeight / scale;
  return { x: (sourceWidth - width) / 2, y: (sourceHeight - height) / 2, width, height, scale };
}

export function paintCampaignWorldMap(scene: Phaser.Scene, parent: Phaser.GameObjects.Container, width: number, height: number): void {
  const worldWidth = width / CAMPAIGN_WORLDS.length;
  const worlds = CAMPAIGN_WORLDS;
  for (const [index, world] of worlds.entries()) {
    const key = `campaign_worldmap_${world.id}`;
    if (scene.textures.exists(key)) {
      const source = scene.textures.get(key).getSourceImage();
      const crop = campaignWorldMapCoverCrop(source.width, source.height, worldWidth, height);
      if (crop) parent.add(scene.add.image(index * worldWidth + worldWidth / 2, height / 2, key)
        .setOrigin(0.5).setCrop(crop.x, crop.y, crop.width, crop.height).setScale(crop.scale));
    }
  }
  const g = scene.add.graphics(); parent.add(g);
  for (const [index, world] of worlds.entries()) {
    const x = index * worldWidth, palette = WORLD_COLOR[world.id];
    if (scene.textures.exists(`campaign_worldmap_${world.id}`)) {
      g.lineStyle(1, 0x9e8e70, 0.65); g.strokeRect(x + 1, 1, worldWidth - 2, height - 2);
      continue;
    }
    g.fillStyle(palette.dark, 0.98); g.fillRect(x, 0, worldWidth, height);
    g.fillStyle(palette.land, 0.94); g.fillPoints(P2([
      { x, y: height * 0.7 }, { x: x + worldWidth * 0.12, y: height * 0.46 }, { x: x + worldWidth * 0.27, y: height * 0.55 },
      { x: x + worldWidth * 0.42, y: height * 0.28 }, { x: x + worldWidth * 0.58, y: height * 0.5 },
      { x: x + worldWidth * 0.79, y: height * 0.38 }, { x: x + worldWidth, y: height * 0.58 }, { x: x + worldWidth, y: height }, { x, y: height }
    ]), true);
    if (index === 0) {
      g.lineStyle(16, 0x28606a, 0.7); g.beginPath(); g.moveTo(x + 14, height * 0.82); g.lineTo(x + worldWidth * 0.28, height * 0.72); g.lineTo(x + worldWidth * 0.62, height * 0.89); g.lineTo(x + worldWidth - 12, height * 0.75); g.strokePath();
      for (let i = 0; i < 13; i++) { const tx = x + 22 + i * worldWidth / 13, ty = height * (0.33 + (i % 3) * 0.09); g.fillStyle(0x23352c, 0.95); g.fillTriangle(tx, ty - 24, tx + 19, ty + 14, tx - 19, ty + 14); g.fillStyle(0x536b48, 0.92); g.fillTriangle(tx - 3, ty - 19, tx + 13, ty + 9, tx - 12, ty + 9); }
      g.fillStyle(0x786e5c, 1); g.fillRect(x + worldWidth * 0.79, height * 0.18, 48, height * 0.31); g.fillRect(x + worldWidth * 0.84, height * 0.1, 14, height * 0.4);
    } else if (index === 1) {
      for (let i = 0; i < 9; i++) { const mx = x + 22 + i * worldWidth / 9, my = height * (0.48 + (i % 2) * 0.12); g.fillStyle(0x272629, 1); g.fillTriangle(mx - 34, my + 38, mx, my - 38 - (i % 3) * 11, mx + 35, my + 38); g.fillStyle(0x773e2d, 0.86); g.fillTriangle(mx - 5, my + 4, mx, my - 33, mx + 5, my + 4); }
      g.lineStyle(7, 0xc34a28, 0.8); g.beginPath(); g.moveTo(x + 18, height * 0.86); g.lineTo(x + worldWidth * 0.24, height * 0.72); g.lineTo(x + worldWidth * 0.4, height * 0.78); g.lineTo(x + worldWidth * 0.67, height * 0.63); g.lineTo(x + worldWidth - 10, height * 0.79); g.strokePath();
    } else if (index === 2) {
      for (let i = 0; i < 10; i++) { const mx = x + 18 + i * worldWidth / 10, my = height * (0.52 + (i % 3) * 0.05); g.fillStyle(0x66737b, 1); g.fillTriangle(mx - 34, my + 42, mx, my - 44 - (i % 2) * 12, mx + 34, my + 42); g.fillStyle(0xd1e0e5, 0.95); g.fillTriangle(mx - 8, my + 5, mx, my - 44 - (i % 2) * 12, mx + 13, my + 7); }
      g.lineStyle(14, 0x488095, 0.72); g.beginPath(); g.moveTo(x + 8, height * 0.82); g.lineTo(x + worldWidth * 0.3, height * 0.72); g.lineTo(x + worldWidth * 0.55, height * 0.85); g.lineTo(x + worldWidth - 8, height * 0.76); g.strokePath();
    } else if (world.id === 'whisperfen') {
      g.lineStyle(13, 0x285e57, 0.8); g.beginPath(); g.moveTo(x + 4, height * 0.78); g.lineTo(x + worldWidth * 0.23, height * 0.7); g.lineTo(x + worldWidth * 0.48, height * 0.82); g.lineTo(x + worldWidth * 0.7, height * 0.68); g.lineTo(x + worldWidth - 4, height * 0.76); g.strokePath();
      for (let i = 0; i < 12; i++) { const rx = x + 20 + i * worldWidth / 12, ry = height * (0.35 + (i % 3) * 0.08); g.lineStyle(3, palette.accent, 0.82); g.lineBetween(rx, ry + 16, rx - 3, ry - 16); g.lineBetween(rx, ry + 16, rx + 8, ry - 12); g.fillStyle(0x354b38, 0.94); g.fillEllipse(rx, ry + 14, 17, 9); }
    } else if (world.id === 'sunken_aether') {
      g.lineStyle(16, 0x286c78, 0.72); g.beginPath(); g.moveTo(x + 6, height * 0.83); g.lineTo(x + worldWidth * 0.31, height * 0.69); g.lineTo(x + worldWidth * 0.55, height * 0.84); g.lineTo(x + worldWidth - 4, height * 0.68); g.strokePath();
      for (let i = 0; i < 5; i++) { const rx = x + 42 + i * worldWidth / 5, ry = height * (0.42 + (i % 2) * 0.11); g.fillStyle(0x556b68, 0.95); g.fillRect(rx, ry, 24, height * 0.32); g.fillRect(rx - 6, ry - 8, 36, 8); g.lineStyle(2, palette.accent, 0.58); g.lineBetween(rx + 12, ry + 8, rx + 12, ry + height * 0.26); }
    } else if (world.id === 'ironroot') {
      for (let i = 0; i < 6; i++) { const fx = x + 25 + i * worldWidth / 6, fy = height * (0.53 + (i % 2) * 0.1); g.fillStyle(0x373336, 1); g.fillPoints(P2([{ x: fx - 28, y: fy + 28 }, { x: fx - 20, y: fy - 10 }, { x: fx - 8, y: fy - 18 }, { x: fx + 5, y: fy - 46 }, { x: fx + 17, y: fy - 8 }, { x: fx + 26, y: fy + 28 }]), true); g.fillStyle(palette.accent, 0.7); g.fillRect(fx + 1, fy - 22, 5, 28); }
      g.lineStyle(8, 0xb16742, 0.76); g.beginPath(); g.moveTo(x + 4, height * 0.82); g.lineTo(x + worldWidth * 0.4, height * 0.72); g.lineTo(x + worldWidth * 0.64, height * 0.83); g.lineTo(x + worldWidth - 6, height * 0.7); g.strokePath();
    } else if (world.id === 'sky_isles') {
      for (let i = 0; i < 7; i++) { const sx = x + 22 + i * worldWidth / 7, sy = height * (0.48 + (i % 3) * 0.09); g.fillStyle(palette.light, 0.88); g.fillEllipse(sx, sy, 74, 20); g.fillStyle(palette.land, 1); g.fillTriangle(sx - 27, sy + 3, sx + 24, sy + 2, sx, sy + 40 + (i % 2) * 12); }
      g.lineStyle(2, 0xd5ebf0, 0.58); g.beginPath(); g.moveTo(x + 12, height * 0.72); g.lineTo(x + worldWidth * 0.36, height * 0.66); g.lineTo(x + worldWidth * 0.67, height * 0.75); g.lineTo(x + worldWidth - 10, height * 0.64); g.strokePath();
    } else if (world.id === 'dreadmoon') {
      g.fillStyle(0xaaa0c7, 0.66); g.fillCircle(x + worldWidth * 0.76, height * 0.25, Math.max(13, height * 0.12));
      for (let i = 0; i < 8; i++) { const tx = x + 20 + i * worldWidth / 8, ty = height * (0.57 + (i % 2) * 0.08); g.fillStyle(0x292638, 1); g.fillPoints(P2([{ x: tx - 18, y: ty + 34 }, { x: tx - 9, y: ty - 18 }, { x: tx, y: ty - 32 }, { x: tx + 8, y: ty - 12 }, { x: tx + 18, y: ty + 34 }]), true); g.fillStyle(palette.accent, 0.82); g.fillCircle(tx, ty - 4, 3); }
    } else if (world.id === 'astral_rift') {
      g.lineStyle(4, palette.accent, 0.8); g.beginPath(); g.moveTo(x + 6, height * 0.72); g.lineTo(x + worldWidth * 0.2, height * 0.54); g.lineTo(x + worldWidth * 0.38, height * 0.71); g.lineTo(x + worldWidth * 0.58, height * 0.4); g.lineTo(x + worldWidth * 0.78, height * 0.62); g.lineTo(x + worldWidth - 6, height * 0.46); g.strokePath();
      for (let i = 0; i < 7; i++) { const cx = x + 25 + i * worldWidth / 7, cy = height * (0.5 + (i % 3) * 0.07); g.fillStyle(0x473553, 0.95); g.fillTriangle(cx - 14, cy + 24, cx, cy - 28 - (i % 2) * 12, cx + 15, cy + 24); g.fillStyle(palette.accent, 0.75); g.fillTriangle(cx - 2, cy + 13, cx, cy - 20, cx + 3, cy + 13); }
    } else {
      const crownX = x + worldWidth * 0.5, crownY = height * 0.46;
      g.fillStyle(0x49444a, 1); g.fillRect(crownX - 62, crownY - 16, 124, height * 0.43); g.fillTriangle(crownX - 70, crownY - 10, crownX - 40, crownY - 62, crownX - 10, crownY - 10); g.fillTriangle(crownX - 20, crownY - 10, crownX + 12, crownY - 76, crownX + 42, crownY - 10); g.fillTriangle(crownX + 26, crownY - 10, crownX + 52, crownY - 52, crownX + 76, crownY - 10);
      g.lineStyle(4, palette.accent, 0.72); g.strokeCircle(crownX, crownY + 16, Math.max(24, height * 0.17)); g.fillStyle(palette.accent, 0.95); g.fillCircle(crownX, crownY + 16, 6);
    }
    g.lineStyle(1, 0x9e8e70, 0.45); g.strokeRect(x + 1, 1, worldWidth - 2, height - 2);
  }
  g.lineStyle(12, 0x171d20, 0.9);
  for (let boundary = 1; boundary < worlds.length; boundary++) {
    const x = boundary * worldWidth;
    g.lineBetween(x - 4, height * 0.7, x + 4, height * 0.7);
  }
}

export function drawCampaignEnemyBadge(scene: Phaser.Scene, parent: Phaser.GameObjects.Container, id: string, x: number, y: number, size: number): void {
  const profile = enemyProfile(id); if (!profile) return;
  const texture = ensureCampaignEnemyTexture(scene, id);
  const sprite = (texture.final ? scene.add.image(x, y, texture.key, 'walk_0') : scene.add.image(x, y, texture.key))
    .setOrigin(0.5).setDisplaySize(size, size);
  parent.add(sprite);
}
