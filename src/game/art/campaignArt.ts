import Phaser from 'phaser';
import type { MapDef } from '../maps/map1.ts';
import { BUILD_PLOT_POLICY } from '../maps/buildPlotPolicy.ts';
import { P2 } from './artkit.ts';
import { CAMPAIGN_ART_MANIFEST } from '../campaign/artManifest.ts';
import type { CampaignWorldId } from '../campaign/types.ts';

const WORLD_COLOR: Record<CampaignWorldId, { land: number; light: number; dark: number; accent: number }> = {
  borderkeep: { land: 0x354437, light: 0x526146, dark: 0x202c28, accent: 0x83a064 },
  emberfall: { land: 0x363434, light: 0x625449, dark: 0x211f21, accent: 0xe27737 },
  frostveil: { land: 0x58616a, light: 0x8997a0, dark: 0x313c45, accent: 0x9fd4e8 }
};

const ROAD_MATERIAL: Record<CampaignWorldId, { edge: number; shoulder: number; bed: number; pavers: readonly number[]; highlight: number; seam: number }> = {
  borderkeep: { edge: 0x51483d, shoulder: 0x726652, bed: 0x88775f, pavers: [0xa6967c, 0x877865, 0xb0a086, 0x756a5b, 0x95846d, 0x7e715f, 0xa0937e, 0x827665], highlight: 0xc8b58f, seam: 0x5c5144 },
  emberfall: { edge: 0x302a27, shoulder: 0x5a4c40, bed: 0x74604e, pavers: [0x8c7157, 0x77614f, 0x9a7856, 0x65584e, 0x826b58, 0x725b49], highlight: 0xb0916d, seam: 0x463b33 },
  frostveil: { edge: 0x3e474c, shoulder: 0x68737a, bed: 0x87939a, pavers: [0xaeb9bd, 0x929fa5, 0xc0c8c9, 0x78868d, 0x9eaaae, 0x89959a], highlight: 0xdbe0de, seam: 0x59666d }
};

const ENEMY_WORLD: Readonly<Record<string, CampaignWorldId>> = {
  marchling: 'borderkeep', skitter: 'borderkeep', stoneback: 'borderkeep', ironhide: 'borderkeep', veilborn: 'borderkeep',
  hollow_warden: 'borderkeep', cinderling: 'emberfall', ashrunner: 'emberfall', magmahide: 'emberfall',
  ember_brute: 'emberfall', ashcaller: 'emberfall', cinder_colossus: 'emberfall', snowstalker: 'frostveil',
  icebound: 'frostveil', frostback: 'frostveil', glacier_knight: 'frostveil', frost_shaman: 'frostveil', frostbound_matriarch: 'frostveil'
};
const BOSSES = new Set(['hollow_warden', 'cinder_colossus', 'frostbound_matriarch']);

export interface CampaignBossArtState { phase: number; telegraph: boolean; guarded: boolean; }

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
  const role = BOSSES.has(id) ? 'boss' : /runner|skitter|snowstalker/.test(id) ? 'runner'
    : /brute|stoneback|frostback/.test(id) ? 'brute'
    : /hide|knight|ironhide/.test(id) ? 'armored'
    : /caller|shaman/.test(id) ? 'support' : 'basic';
  const body = world === 'emberfall' ? 0x514b48 : world === 'frostveil' ? 0x728590 : 0x6b6554;
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
  const worldWidth = width / 3;
  const palettes = [WORLD_COLOR.borderkeep, WORLD_COLOR.emberfall, WORLD_COLOR.frostveil];
  const worldIds: readonly CampaignWorldId[] = ['borderkeep', 'emberfall', 'frostveil'];
  for (let world = 0; world < worldIds.length; world++) {
    const key = `campaign_worldmap_${worldIds[world]}`;
    if (scene.textures.exists(key)) {
      const source = scene.textures.get(key).getSourceImage();
      const crop = campaignWorldMapCoverCrop(source.width, source.height, worldWidth, height);
      if (crop) parent.add(scene.add.image(world * worldWidth + worldWidth / 2, height / 2, key)
        .setOrigin(0.5).setCrop(crop.x, crop.y, crop.width, crop.height).setScale(crop.scale));
    }
  }
  const g = scene.add.graphics(); parent.add(g);
  for (let world = 0; world < 3; world++) {
    const x = world * worldWidth, palette = palettes[world];
    if (scene.textures.exists(`campaign_worldmap_${worldIds[world]}`)) {
      g.lineStyle(1, 0x9e8e70, 0.65); g.strokeRect(x + 1, 1, worldWidth - 2, height - 2);
      continue;
    }
    g.fillStyle(palette.dark, 0.98); g.fillRect(x, 0, worldWidth, height);
    g.fillStyle(palette.land, 0.94); g.fillPoints(P2([
      { x, y: height * 0.7 }, { x: x + worldWidth * 0.12, y: height * 0.46 }, { x: x + worldWidth * 0.27, y: height * 0.55 },
      { x: x + worldWidth * 0.42, y: height * 0.28 }, { x: x + worldWidth * 0.58, y: height * 0.5 },
      { x: x + worldWidth * 0.79, y: height * 0.38 }, { x: x + worldWidth, y: height * 0.58 }, { x: x + worldWidth, y: height }, { x, y: height }
    ]), true);
    if (world === 0) {
      g.lineStyle(16, 0x28606a, 0.7); g.beginPath(); g.moveTo(x + 14, height * 0.82); g.lineTo(x + worldWidth * 0.28, height * 0.72); g.lineTo(x + worldWidth * 0.62, height * 0.89); g.lineTo(x + worldWidth - 12, height * 0.75); g.strokePath();
      for (let i = 0; i < 13; i++) { const tx = x + 22 + i * worldWidth / 13, ty = height * (0.33 + (i % 3) * 0.09); g.fillStyle(0x23352c, 0.95); g.fillTriangle(tx, ty - 24, tx + 19, ty + 14, tx - 19, ty + 14); g.fillStyle(0x536b48, 0.92); g.fillTriangle(tx - 3, ty - 19, tx + 13, ty + 9, tx - 12, ty + 9); }
      g.fillStyle(0x786e5c, 1); g.fillRect(x + worldWidth * 0.79, height * 0.18, 48, height * 0.31); g.fillRect(x + worldWidth * 0.84, height * 0.1, 14, height * 0.4);
    } else if (world === 1) {
      for (let i = 0; i < 9; i++) { const mx = x + 22 + i * worldWidth / 9, my = height * (0.48 + (i % 2) * 0.12); g.fillStyle(0x272629, 1); g.fillTriangle(mx - 34, my + 38, mx, my - 38 - (i % 3) * 11, mx + 35, my + 38); g.fillStyle(0x773e2d, 0.86); g.fillTriangle(mx - 5, my + 4, mx, my - 33, mx + 5, my + 4); }
      g.lineStyle(7, 0xc34a28, 0.8); g.beginPath(); g.moveTo(x + 18, height * 0.86); g.lineTo(x + worldWidth * 0.24, height * 0.72); g.lineTo(x + worldWidth * 0.4, height * 0.78); g.lineTo(x + worldWidth * 0.67, height * 0.63); g.lineTo(x + worldWidth - 10, height * 0.79); g.strokePath();
    } else {
      for (let i = 0; i < 10; i++) { const mx = x + 18 + i * worldWidth / 10, my = height * (0.52 + (i % 3) * 0.05); g.fillStyle(0x66737b, 1); g.fillTriangle(mx - 34, my + 42, mx, my - 44 - (i % 2) * 12, mx + 34, my + 42); g.fillStyle(0xd1e0e5, 0.95); g.fillTriangle(mx - 8, my + 5, mx, my - 44 - (i % 2) * 12, mx + 13, my + 7); }
      g.lineStyle(14, 0x488095, 0.72); g.beginPath(); g.moveTo(x + 8, height * 0.82); g.lineTo(x + worldWidth * 0.3, height * 0.72); g.lineTo(x + worldWidth * 0.55, height * 0.85); g.lineTo(x + worldWidth - 8, height * 0.76); g.strokePath();
    }
    g.lineStyle(1, 0x9e8e70, 0.45); g.strokeRect(x + 1, 1, worldWidth - 2, height - 2);
  }
  g.lineStyle(12, 0x171d20, 0.9); g.lineBetween(worldWidth - 4, height * 0.7, worldWidth + 4, height * 0.7); g.lineBetween(worldWidth * 2 - 4, height * 0.7, worldWidth * 2 + 4, height * 0.7);
}

export function drawCampaignEnemyBadge(scene: Phaser.Scene, parent: Phaser.GameObjects.Container, id: string, x: number, y: number, size: number): void {
  const profile = enemyProfile(id); if (!profile) return;
  const texture = ensureCampaignEnemyTexture(scene, id);
  const sprite = (texture.final ? scene.add.image(x, y, texture.key, 'walk_0') : scene.add.image(x, y, texture.key))
    .setOrigin(0.5).setDisplaySize(size, size);
  parent.add(sprite);
}
