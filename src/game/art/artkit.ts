import Phaser from 'phaser';
import { PAL, hi, sh } from './palette.ts';

// Shared canvas-art helpers: contact shadows + generated icon textures.
// ART_BIBLE.md §56-57 (2-3 value groups, consistent treatment), §65 (shadows), §76 (emblem).

/** Soft contact shadow ellipse. Art itself never bakes selection/placement rings. */
export function contactShadow(scene: Phaser.Scene, x: number, y: number, w: number, h = w * 0.42): Phaser.GameObjects.Ellipse {
  return scene.add.ellipse(x, y, w, h, 0x000000, 0.32);
}

/** Point-array adapters: Phaser 4 typings require Vector2 instances. */
export function P2(arr: Array<{ x: number; y: number }>): Phaser.Math.Vector2[] {
  return arr as unknown as Phaser.Math.Vector2[];
}

export function V2(flat: number[]): Phaser.Math.Vector2[] {
  const out: Phaser.Math.Vector2[] = [];
  for (let i = 0; i + 1 < flat.length; i += 2) out.push(new Phaser.Math.Vector2(flat[i], flat[i + 1]));
  return out;
}

function tex(scene: Phaser.Scene, key: string, size: number, draw: (g: Phaser.GameObjects.Graphics) => void): void {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  draw(g);
  g.generateTexture(key, size, size);
  g.destroy();
}

const RELIC_IDS = [
  'gold_rush', 'meteor_strike', 'time_freeze', 'battle_cry', 'arcane_surge',
  'emergency_repair', 'treasure_goblin', 'double_bounty', 'tower_overcharge', 'ancient_blessing'
] as const;

const RELIC_TRIMS = [
  [24, 28, 365, 357], [414, 28, 366, 357], [810, 28, 363, 357], [1197, 28, 366, 357], [1595, 28, 364, 357],
  [24, 403, 364, 357], [414, 403, 366, 359], [810, 403, 365, 359], [1197, 403, 365, 359], [1594, 403, 365, 359]
] as const;

const HUD_TRIMS = [
  [46, 55, 379, 370], [495, 113, 369, 296], [955, 45, 330, 380], [1364, 46, 381, 377],
  [50, 455, 363, 374], [511, 504, 346, 291], [988, 502, 243, 297], [1410, 462, 284, 373]
] as const;

const HUD_IDS = ['wave', 'gold', 'lives', 'score', 'diff', 'speed', 'pause', 'skull'] as const;

function drawTrimmedAtlasIcons(scene: Phaser.Scene, atlasKey: string, keys: readonly string[], rects: readonly (readonly [number, number, number, number])[]): void {
  if (!scene.textures.exists(atlasKey)) return;
  const source = scene.textures.get(atlasKey).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
  const size = 96;
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    if (scene.textures.exists(key)) continue;
    const [sx, sy, sw, sh] = rects[index];
    const canvas = scene.textures.createCanvas(key, size, size);
    if (!canvas) continue;
    const context = canvas.getContext();
    context.clearRect(0, 0, size, size);
    const fit = 82 / Math.max(sw, sh);
    const drawW = sw * fit;
    const drawH = sh * fit;
    context.drawImage(source, sx, sy, sw, sh, (size - drawW) / 2, (size - drawH) / 2, drawW, drawH);
    canvas.refresh();
  }
}

function ensureHudAtlasTextures(scene: Phaser.Scene): void {
  drawTrimmedAtlasIcons(scene, 'hud_icons_atlas', HUD_IDS.map((id) => `hud_${id}`), HUD_TRIMS);
}

/** Build the stable one-icon texture keys from the reviewed 5x2 painted atlas. */
function ensureRelicAtlasTextures(scene: Phaser.Scene): void {
  drawTrimmedAtlasIcons(scene, 'relic_icons_atlas', RELIC_IDS.map((id) => `relic_${id}`), RELIC_TRIMS);
}

/** Gold coin with upper-left highlight. */
function coin(g: Phaser.GameObjects.Graphics, c: number, r: number): void {
  g.fillStyle(sh(0xd7aa4e, 0.35), 1);
  g.fillCircle(c + 2, c + 3, r);
  g.fillStyle(0xd7aa4e, 1);
  g.fillCircle(c, c, r);
  g.fillStyle(hi(0xd7aa4e, 0.45), 1);
  g.fillCircle(c - r * 0.3, c - r * 0.35, r * 0.45);
  g.lineStyle(2, 0x8a6a2e, 1);
  g.strokeCircle(c, c, r - 1);
}

/** Heart-shield in flat fantasy style. */
function heart(g: Phaser.GameObjects.Graphics, c: number, s: number): void {
  g.fillStyle(sh(0xd85f59, 0.3), 1);
  g.fillTriangle(c - s + 1, c + s * 0.1 + 2, c + s + 1, c + s * 0.1 + 2, c + 1, c + s + 2);
  g.fillStyle(0xd85f59, 1);
  g.beginPath();
  g.moveTo(c, c + s);
  g.lineTo(c - s, c + s * 0.1);
  g.lineTo(c - s * 0.95, c - s * 0.55);
  g.lineTo(c - s * 0.55, c - s * 1.05);
  g.lineTo(c, c - s * 0.55);
  g.lineTo(c + s * 0.55, c - s * 1.05);
  g.lineTo(c + s * 0.95, c - s * 0.55);
  g.lineTo(c + s, c + s * 0.1);
  g.closePath();
  g.fillPath();
  g.fillStyle(hi(0xd85f59, 0.4), 1);
  g.fillCircle(c - s * 0.4, c - s * 0.5, s * 0.22);
}

function star(g: Phaser.GameObjects.Graphics, c: number, r1: number, r2: number, color = 0xf0cd72): void {
  const pts: number[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? r1 : r2;
    const a = -Math.PI / 2 + (Math.PI / 5) * i;
    pts.push(c + Math.cos(a) * r, c + Math.sin(a) * r);
  }
  g.fillStyle(sh(color, 0.35), 1);
  g.fillPoints(V2(pts.map((v, i) => v + (i % 2 === 0 ? 1 : 2))), true);
  g.fillStyle(color, 1);
  g.fillPoints(V2(pts), true);
}

function swords(g: Phaser.GameObjects.Graphics, c: number, s: number): void {
  g.lineStyle(s * 0.34, 0xb9c2c9, 1);
  g.lineBetween(c - s * 0.7, c + s * 0.8, c + s * 0.6, c - s * 0.7);
  g.lineBetween(c + s * 0.7, c + s * 0.8, c - s * 0.6, c - s * 0.7);
  g.lineStyle(s * 0.2, 0xd7aa4e, 1);
  g.lineBetween(c - s * 0.35, c + s * 0.25, c + s * 0.35, c + s * 0.25);
  g.fillStyle(0xd7aa4e, 1);
  g.fillCircle(c - s * 0.28, c + s * 0.62, s * 0.14);
  g.fillCircle(c + s * 0.28, c + s * 0.62, s * 0.14);
}

function knot(g: Phaser.GameObjects.Graphics, c: number, r: number): void {
  // Triquetra-like trinity knot: three interlocking arcs, bronze-gold.
  g.lineStyle(3, 0xd7aa4e, 1);
  for (let k = 0; k < 3; k++) {
    const a = (Math.PI * 2 * k) / 3 - Math.PI / 2;
    g.strokeCircle(c + Math.cos(a) * r * 0.42, c + Math.sin(a) * r * 0.42, r * 0.58);
  }
  g.fillStyle(0xf0cd72, 1);
  g.fillCircle(c, c, 3);
}

function chevrons(g: Phaser.GameObjects.Graphics, c: number, s: number): void {
  g.lineStyle(s * 0.3, 0x9fd4e8, 1);
  for (const dx of [-s * 0.35, s * 0.25]) {
    g.beginPath();
    g.moveTo(c + dx - s * 0.25, c - s * 0.55);
    g.lineTo(c + dx + s * 0.25, c);
    g.lineTo(c + dx - s * 0.25, c + s * 0.55);
    g.strokePath();
  }
}

function pauseBars(g: Phaser.GameObjects.Graphics, c: number, s: number): void {
  g.fillStyle(0xf3ebdd, 1);
  g.fillRect(c - s * 0.45, c - s * 0.6, s * 0.32, s * 1.2);
  g.fillRect(c + s * 0.13, c - s * 0.6, s * 0.32, s * 1.2);
}

function skull(g: Phaser.GameObjects.Graphics, c: number, s: number): void {
  g.fillStyle(0xcfc4ae, 1);
  g.fillCircle(c, c - s * 0.15, s * 0.62);
  g.fillRect(c - s * 0.38, c + s * 0.2, s * 0.76, s * 0.42);
  g.fillStyle(0x1a1410, 1);
  g.fillCircle(c - s * 0.24, c - s * 0.15, s * 0.16);
  g.fillCircle(c + s * 0.24, c - s * 0.15, s * 0.16);
  g.fillRect(c - s * 0.06, c + s * 0.28, s * 0.12, s * 0.26);
}

/** Game emblem: fortress gate + arcane crystal + defensive chevron (§76). */
export function emblemKey(): string {
  return 'emblem';
}

function drawEmblem(g: Phaser.GameObjects.Graphics, S: number): void {
  const c = S / 2;
  // Shield field.
  g.fillStyle(0x1a2432, 1);
  g.fillPoints(P2([{ x: c - 40, y: 14 }, { x: c + 40, y: 14 }, { x: c + 40, y: 62 }, { x: c, y: 112 }, { x: c - 40, y: 62 }]), true);
  g.lineStyle(4, 0xd7aa4e, 1);
  g.strokePoints(P2([{ x: c - 40, y: 14 }, { x: c + 40, y: 14 }, { x: c + 40, y: 62 }, { x: c, y: 112 }, { x: c - 40, y: 62 }]), true);
  // Gate towers.
  g.fillStyle(0x596069, 1);
  g.fillRect(c - 30, 34, 12, 34);
  g.fillRect(c + 18, 34, 12, 34);
  g.fillStyle(hi(0x596069, 0.3), 1);
  g.fillRect(c - 30, 34, 5, 34);
  g.fillRect(c + 18, 34, 5, 34);
  // Gate arch.
  g.fillStyle(0x0a0e12, 1);
  g.fillEllipse(c, 66, 26, 30);
  // Floating crystal.
  g.fillStyle(0x9e7ae6, 1);
  g.fillPoints(P2([{ x: c, y: 26 }, { x: c + 9, y: 42 }, { x: c, y: 56 }, { x: c - 9, y: 42 }]), true);
  g.fillStyle(0xd1b3ff, 1);
  g.fillPoints(P2([{ x: c, y: 30 }, { x: c + 4, y: 42 }, { x: c, y: 52 }, { x: c - 4, y: 42 }]), true);
  // Defensive chevron.
  g.lineStyle(4, 0xd7aa4e, 1);
  g.beginPath();
  g.moveTo(c - 24, 88);
  g.lineTo(c, 76);
  g.lineTo(c + 24, 88);
  g.strokePath();
}

function hourglass(g: Phaser.GameObjects.Graphics, c: number, s: number, top: number, bot: number): void {
  g.fillStyle(0x8a6a3e, 1);
  g.fillRect(c - s * 0.7, c - s, s * 1.4, s * 0.22);
  g.fillRect(c - s * 0.7, c + s * 0.78, s * 1.4, s * 0.22);
  g.fillStyle(top, 0.9);
  g.fillTriangle(c - s * 0.5, c - s * 0.72, c + s * 0.5, c - s * 0.72, c, c - s * 0.05);
  g.fillStyle(bot, 0.95);
  g.fillTriangle(c - s * 0.4, c + s * 0.7, c + s * 0.4, c + s * 0.7, c, c + s * 0.08);
}

/** All icon + relic + emblem textures. Idempotent and restart-safe. */
const menuFallbacks = new WeakSet<Phaser.Textures.Texture>();

export function ensureMenuTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists('hud_icons_atlas')) { ensureHudAtlasTextures(scene); return; }
  for (const [key, draw] of [['hud_wave', swords], ['hud_score', star]] as const) {
    if (scene.textures.exists(key)) continue;
    tex(scene, key, 48, g => draw(g, 24, 13, 6));
    menuFallbacks.add(scene.textures.get(key));
  }
}

export function ensureArtTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists('hud_icons_atlas')) for (const key of ['hud_wave', 'hud_score']) {
    if (scene.textures.exists(key) && menuFallbacks.has(scene.textures.get(key))) scene.textures.remove(key);
  }
  ensureHudAtlasTextures(scene);
  ensureRelicAtlasTextures(scene);
  const S = 48;
  tex(scene, 'hud_wave', S, (g) => swords(g, S / 2, 13));
  tex(scene, 'hud_gold', S, (g) => coin(g, S / 2, 13));
  tex(scene, 'hud_lives', S, (g) => heart(g, S / 2, 12));
  tex(scene, 'hud_score', S, (g) => star(g, S / 2, 14, 6));
  tex(scene, 'hud_diff', S, (g) => knot(g, S / 2, 12));
  tex(scene, 'hud_speed', S, (g) => chevrons(g, S / 2, 12));
  tex(scene, 'hud_pause', S, (g) => pauseBars(g, S / 2, 12));
  tex(scene, 'hud_skull', S, (g) => skull(g, S / 2, 13));

  // Relic icons: symbolic fantasy objects on transparent ground (§54-55).
  tex(scene, 'relic_gold_rush', S, (g) => {
    const c = S / 2;
    g.fillStyle(sh(0x5c4c3c, 0.3), 1);
    g.fillRect(c - 14, c - 4, 30, 18);
    g.fillStyle(0x5c4c3c, 1);
    g.fillRect(c - 15, c - 6, 30, 18);
    g.fillStyle(0x463a2d, 1);
    g.fillRect(c - 15, c - 6, 30, 6);
    g.fillStyle(0xd7aa4e, 1);
    for (let i = 0; i < 5; i++) g.fillCircle(c - 10 + i * 5, c + 1, 3.4);
    g.fillStyle(hi(0xd7aa4e, 0.5), 1);
    for (let i = 0; i < 5; i++) g.fillCircle(c - 11 + i * 5, c, 1.2);
  });
  tex(scene, 'relic_meteor_strike', S, (g) => {
    const c = S / 2;
    g.fillStyle(0x4a4f55, 1);
    g.fillPoints(P2([{ x: c - 10, y: c + 12 }, { x: c - 3, y: c - 8 }, { x: c + 11, y: c - 2 }, { x: c + 6, y: c + 13 }]), true);
    g.fillStyle(hi(0x4a4f55, 0.35), 1);
    g.fillPoints(P2([{ x: c - 6, y: c + 4 }, { x: c - 3, y: c - 8 }, { x: c + 4, y: c - 4 }]), true);
    g.fillStyle(0xe8a33d, 1);
    g.fillTriangle(c - 8, c - 14, c + 2, c - 16, c - 2, c - 4);
    g.fillTriangle(c + 2, c - 12, c + 12, c - 10, c + 6, c - 1);
    g.fillStyle(0xffd54f, 1);
    g.fillCircle(c - 2, c - 9, 2.4);
  });
  tex(scene, 'relic_time_freeze', S, (g) => hourglass(g, S / 2, 12, 0x9fd4e8, 0xe1f5fe));
  tex(scene, 'relic_battle_cry', S, (g) => {
    const c = S / 2;
    g.fillStyle(0x6b2a2a, 1);
    g.fillEllipse(c, c + 2, 30, 24);
    g.fillStyle(hi(0x6b2a2a, 0.25), 1);
    g.fillEllipse(c - 3, c - 1, 22, 15);
    g.fillStyle(0xcfc4ae, 1);
    g.fillEllipse(c, c - 8, 30, 8);
    g.lineStyle(2, 0xd7aa4e, 1);
    g.lineBetween(c - 12, c + 8, c - 18, c + 16);
    g.lineBetween(c + 12, c + 8, c + 18, c + 16);
  });
  tex(scene, 'relic_arcane_surge', S, (g) => {
    const c = S / 2;
    g.fillStyle(0x424750, 1);
    g.fillRect(c - 12, c + 6, 24, 8);
    g.fillStyle(0x9e7ae6, 1);
    g.fillPoints(P2([{ x: c, y: c - 16 }, { x: c + 8, y: c + 2 }, { x: c, y: c + 8 }, { x: c - 8, y: c + 2 }]), true);
    g.fillStyle(0xd1b3ff, 1);
    g.fillPoints(P2([{ x: c, y: c - 11 }, { x: c + 3.5, y: c + 1 }, { x: c, y: c + 5 }, { x: c - 3.5, y: c + 1 }]), true);
  });
  tex(scene, 'relic_emergency_repair', S, (g) => {
    const c = S / 2;
    g.fillStyle(0x596069, 1);
    g.fillPoints(P2([{ x: c, y: c - 14 }, { x: c + 12, y: c - 4 }, { x: c + 7, y: c + 12 }, { x: c - 7, y: c + 12 }, { x: c - 12, y: c - 4 }]), true);
    g.lineStyle(3, 0xd7aa4e, 1);
    g.strokePoints(P2([{ x: c, y: c - 14 }, { x: c + 12, y: c - 4 }, { x: c + 7, y: c + 12 }, { x: c - 7, y: c + 12 }, { x: c - 12, y: c - 4 }, { x: c, y: c - 14 }]), true);
    g.fillStyle(0x63c77c, 1);
    g.fillRect(c - 2.5, c - 7, 5, 14);
    g.fillRect(c - 7, c - 2.5, 14, 5);
  });
  tex(scene, 'relic_treasure_goblin', S, (g) => {
    const c = S / 2;
    g.fillStyle(sh(0xd7aa4e, 0.3), 1);
    g.fillEllipse(c, c + 3, 26, 22);
    g.fillStyle(0xd7aa4e, 1);
    g.fillEllipse(c, c, 24, 26);
    g.fillStyle(0x1a1410, 1);
    g.fillCircle(c - 5, c - 3, 2.6);
    g.fillCircle(c + 5, c - 3, 2.6);
    g.fillStyle(0x9e7ae6, 1);
    g.fillCircle(c + 8, c + 8, 3);
    g.fillStyle(hi(0xd7aa4e, 0.4), 1);
    g.fillCircle(c - 6, c - 8, 3);
  });
  tex(scene, 'relic_double_bounty', S, (g) => {
    coin(g, S / 2 - 6, 9);
    coin(g, S / 2 + 6, 9);
  });
  tex(scene, 'relic_tower_overcharge', S, (g) => {
    const c = S / 2;
    g.lineStyle(3, 0x82b1ff, 1);
    g.strokeCircle(c, c, 14);
    g.fillStyle(0x596069, 1);
    g.fillRect(c - 5, c - 2, 10, 14);
    g.fillStyle(0xd1b3ff, 1);
    g.fillCircle(c, c - 6, 5);
  });
  tex(scene, 'relic_ancient_blessing', S, (g) => {
    const c = S / 2;
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI / 4) * i;
      g.lineStyle(3, 0xd7aa4e, 1);
      g.lineBetween(c + Math.cos(a) * 9, c + Math.sin(a) * 9, c + Math.cos(a) * 15, c + Math.sin(a) * 15);
    }
    star(g, c, 9, 4.5, 0xf0cd72);
  });

  tex(scene, emblemKey(), 128, (g) => drawEmblem(g, 128));

  // Silence unused helper warnings for builds that only need part of the kit.
  void PAL;
}
