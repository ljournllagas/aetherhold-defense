import Phaser from 'phaser';
import type { EnemyArchetype } from '../../shared/types.ts';
import atlasMetadata from './enemyAtlasFrames.json';
import { ensureCampaignEnemyTexture, type CampaignBossArtState } from './campaignArt.ts';
import { CAMPAIGN_ATLAS_CONTENT_FRACTION, CAMPAIGN_ATLAS_GROUND_ORIGIN, campaignAnimationDefinitions } from '../campaign/artManifest.ts';
import { P2 } from './artkit.ts';
import type { Rect } from '../ui/viewport.ts';

type Facing = 'left' | 'right';
export type EnemyAnimationAction = 'attack' | 'buff' | 'death' | 'armor_break' | 'exposed_core' | 'freeze_cast' | 'phase_two' | 'special';
interface TrimFrame {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  area: number;
  facing: Facing;
  cycle: number;
  pivot: { x: number; y: number };
  baselineSourceY: number;
}
interface EnemyAtlasSpec {
  atlas: string;
  targetDimension: number;
  rightFrames: TrimFrame[];
  leftFrames: TrimFrame[];
}

const SPECS = atlasMetadata.enemies as Record<EnemyArchetype, EnemyAtlasSpec>;

export interface EnemyView {
  view: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Sprite;
  bobAmp: number;
  bobFreq: number;
  rockAmp: number;
  maxVisualDimension: number;
  atlas: string;
  frameRectangles: { right: TrimFrame[]; left: TrimFrame[] };
  /** Choose painted directional poses; the three-quarter view is never rotated. */
  setFacing(dx: number, dy?: number): void;
  /** Run or pause the role-specific three-frame cycle. */
  setWalking(walking: boolean): void;
  getFacing(): Facing;
  isWalking(): boolean;
  /** Play an authored one-shot without coupling presentation to combat resolution. */
  playAction(action: EnemyAnimationAction): number | null;
  setCampaignState?(state: CampaignBossArtState): void;
}

const SUPPORT_CACHE = new WeakMap<EnemyView, Rect>();
const VISIBLE_DIMENSIONS=new WeakMap<object,number>();
/** Normalize living silhouettes across idle/walk poses; action effects retain separate full support. */
export function enemyVisibleDimension(visual:EnemyView):number {
 const sprite=visual.sprite,texture=sprite.texture;
 const fallback=()=>Math.max(1,...[...visual.frameRectangles.right,...visual.frameRectangles.left].map(frame=>Math.max(frame.width,frame.height)*Math.abs(sprite.scaleX)));
 if(!visual.atlas?.startsWith('campaign_enemy_')||!texture?.getSourceImage||typeof document==='undefined')return fallback();
 let dimension=VISIBLE_DIMENSIONS.get(texture);
 if(dimension===undefined){
  try{
   const source=texture.getSourceImage() as HTMLImageElement,canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
   const context=canvas.getContext('2d',{willReadFrequently:true});if(!context)return fallback();context.drawImage(source,0,0);
   const data=context.getImageData(0,0,canvas.width,canvas.height).data;dimension=0;
   const names=texture.getFrameNames(),living=names.filter(name=>/^(idle|walk)_/.test(name));
   for(const name of living.length?living:names){
    const f=texture.get(name);let left=f.cutWidth,top=f.cutHeight,right=-1,bottom=-1;
    for(let y=0;y<f.cutHeight;y++)for(let x=0;x<f.cutWidth;x++)if(data[((f.cutY+y)*canvas.width+f.cutX+x)*4+3]>32){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
    if(right>=left)dimension=Math.max(dimension,right-left+1,bottom-top+1);
   }
   if(dimension<=0)return fallback();VISIBLE_DIMENSIONS.set(texture,dimension);
  }catch{return fallback();}
 }
 return dimension*Math.abs(sprite.scaleX);
}

/** Stable all-action support, including both facings, edge, bob and damage pop. */
export function enemyVisualSupport(visual: EnemyView): Rect {
  const cached = SUPPORT_CACHE.get(visual);
  if (cached) return cached;
  const sprite = visual.sprite, texture = sprite.texture;
  const names = visual.atlas?.startsWith('campaign_enemy_') && texture?.getFrameNames ? texture.getFrameNames() : [];
  const frames = names.length ? names.map(name => texture.get(name)) : [...visual.frameRectangles.right, ...visual.frameRectangles.left];
  const width = Math.max(...frames.map(frame => frame.width)), height = Math.max(...frames.map(frame => frame.height));
  const sourceScale = Math.abs(sprite.scaleX), originY = sprite.originY ?? 1;
  const halfWidth = width * sourceScale * 1.045 / 2;
  const top = Math.min(-height * sourceScale * originY, 1 - height * sourceScale * 1.045);
  const bottom = Math.max(height * sourceScale * (1 - originY), 1);
  const rect = { x: -halfWidth * 1.16, y: top * 1.16 - (visual.bobAmp ?? 0), width: halfWidth * 2 * 1.16,
    height: (bottom - top) * 1.16 + (visual.bobAmp ?? 0) };
  SUPPORT_CACHE.set(visual, rect);
  return rect;
}

const ACTION_PRIORITY: Record<EnemyAnimationAction, number> = {
  buff: 50, phase_two: 60, armor_break: 60, exposed_core: 65, special: 70,
  attack: 80, freeze_cast: 90, death: 100
};

const ROLE_MOTION: Record<EnemyArchetype, Pick<EnemyView, 'bobAmp' | 'bobFreq' | 'rockAmp'>> = {
  thornling: { bobAmp: 1.6, bobFreq: 9, rockAmp: 0.05 },
  swiftwisp: { bobAmp: 2.4, bobFreq: 15, rockAmp: 0.02 },
  cragback: { bobAmp: 1.2, bobFreq: 5, rockAmp: 0.07 },
  ironbark: { bobAmp: 1.0, bobFreq: 5, rockAmp: 0.025 },
  runescale: { bobAmp: 1.5, bobFreq: 8, rockAmp: 0.045 },
  mossmaw: { bobAmp: 1.8, bobFreq: 7, rockAmp: 0.06 },
  gloomite: { bobAmp: 2.0, bobFreq: 16, rockAmp: 0.08 },
  warlord: { bobAmp: 0.8, bobFreq: 3.5, rockAmp: 0.02 },
  pilferer: { bobAmp: 2.6, bobFreq: 13, rockAmp: 0.08 }
};

const FRAME_RATE: Record<EnemyArchetype, number> = {
  thornling: 8, swiftwisp: 10, cragback: 4,
  ironbark: 4, runescale: 8, mossmaw: 6,
  gloomite: 11, warlord: 3, pilferer: 10
};

function framesFor(spec: EnemyAtlasSpec, facing: Facing): TrimFrame[] {
  return facing === 'right' ? spec.rightFrames : spec.leftFrames;
}

function maxSourceDimension(spec: EnemyAtlasSpec): number {
  return [...spec.rightFrames, ...spec.leftFrames]
    .reduce((max, frame) => Math.max(max, frame.width, frame.height), 0);
}

function ensureAtlasFrames(scene: Phaser.Scene, spec: EnemyAtlasSpec): void {
  if (!scene.textures.exists(spec.atlas)) {
    throw new Error(`Enemy atlas texture "${spec.atlas}" was not loaded before GameScene.`);
  }
  const texture = scene.textures.get(spec.atlas);
  for (const frame of [...spec.rightFrames, ...spec.leftFrames]) {
    if (!texture.has(frame.name)) texture.add(frame.name, 0, frame.x, frame.y, frame.width, frame.height);
  }
}

function ensureAnimation(scene: Phaser.Scene, key: string, atlas: string, frames: TrimFrame[], rate: number): void {
  if (scene.anims.exists(key)) return;
  scene.anims.create({
    key,
    frames: frames.map((frame) => ({ key: atlas, frame: frame.name })),
    frameRate: rate,
    repeat: -1
  });
}

function buildCampaignEnemyVisual(scene: Phaser.Scene, archetype: EnemyArchetype, campaignId: string): EnemyView | null {
  const art = ensureCampaignEnemyTexture(scene, campaignId);
  if (!art.profile) return null;
  const { key, size, profile } = art;
  const dimension = profile.role === 'boss' ? 96 : profile.role === 'runner' ? 34 : profile.role === 'brute' ? 50 : profile.role === 'armored' ? 44 : profile.role === 'support' ? 42 : 38;
  const frameName = art.final ? 'walk_0' : '__BASE';
  const frame = { name: frameName, x: 0, y: 0, width: size, height: size, area: size * size, facing: 'right' as const, cycle: 0, pivot: { x: size / 2, y: size }, baselineSourceY: size };
  const view = scene.add.container(0, 0), body = scene.add.container(0, 0);
  const groundOrigin = art.final ? CAMPAIGN_ATLAS_GROUND_ORIGIN : 1;
  const sourceScale = dimension / (size * (art.final ? CAMPAIGN_ATLAS_CONTENT_FRACTION : 1));
  const sprite = (art.final ? scene.add.sprite(0, 0, key, frameName) : scene.add.sprite(0, 0, key)).setOrigin(0.5, groundOrigin).setScale(sourceScale);
  const overlays = scene.add.container(0, 0);
  body.add(sprite); body.add(overlays); view.add(body);

  const overlay = (draw: (g: Phaser.GameObjects.Graphics) => void): Phaser.GameObjects.Graphics => {
    // Graphics use source-atlas coordinates. Match the sprite's ground origin
    // after scaling; object position itself is not scaled by Phaser.
    const g = scene.add.graphics().setPosition(-size * sourceScale / 2, -size * sourceScale * groundOrigin).setScale(sourceScale);
    draw(g); overlays.add(g); return g;
  };
  let leftArmor: Phaser.GameObjects.Graphics | null = null, rightArmor: Phaser.GameObjects.Graphics | null = null;
  let core: Phaser.GameObjects.Graphics | null = null, telegraph: Phaser.GameObjects.Graphics | null = null;
  let ward: Phaser.GameObjects.Graphics | null = null, phaseAura: Phaser.GameObjects.Graphics | null = null;
  let tyrantSpeed: Phaser.GameObjects.Graphics | null = null, stormWarning: Phaser.GameObjects.Graphics | null = null;
  let regentEcho: Phaser.GameObjects.Graphics | null = null, portalCue: Phaser.GameObjects.Graphics | null = null;
  let oraclePhases: Phaser.GameObjects.Graphics[] = [], devourerPhases: Phaser.GameObjects.Graphics[] = [];
  if (campaignId === 'cinder_colossus') {
    const plate = (left: boolean) => overlay(g => {
      const c = size / 2, sign = left ? -1 : 1, x = c + sign * 43;
      g.fillStyle(left ? 0x343335 : 0x44403d, 1);
      g.fillPoints(P2([
        { x: x - 27, y: c - 20 }, { x: x - 16, y: c - 47 }, { x: x + 7, y: c - 51 },
        { x: x + 23, y: c - 31 }, { x: x + 20, y: c - 2 }, { x: x - 1, y: c + 6 }
      ]), true);
      g.lineStyle(3, profile.accent, 0.9); g.lineBetween(x - 15, c - 35, x - 2, c - 22); g.lineBetween(x - 2, c - 22, x - 12, c - 4);
    });
    leftArmor = plate(true); rightArmor = plate(false);
    core = overlay(g => {
      const c = size / 2;
      g.fillStyle(0xf79436, 0.35); g.fillCircle(c, c + 1, 31);
      g.fillStyle(0xffc55c, 1); g.fillPoints(P2([{ x: c, y: c - 21 }, { x: c + 15, y: c }, { x: c, y: c + 19 }, { x: c - 15, y: c } ]), true);
      g.fillStyle(0xffefb0, 1); g.fillCircle(c, c, 5);
    }).setVisible(false);
    phaseAura = overlay(g => { const c = size / 2; g.lineStyle(3, 0xf78a39, 0.85); g.strokeCircle(c, c, 54); }).setVisible(false);
  } else if (campaignId === 'frostbound_matriarch') {
    telegraph = overlay(g => {
      const c = size / 2;
      g.lineStyle(4, 0x8fe6ff, 0.88); g.strokeCircle(c, c + 6, 62); g.strokeCircle(c, c + 6, 48);
      for (let i = 0; i < 8; i++) { const a = Math.PI * i / 4; g.lineBetween(c + Math.cos(a) * 48, c + 6 + Math.sin(a) * 48, c + Math.cos(a) * 70, c + 6 + Math.sin(a) * 70); }
      g.fillStyle(0xe1f5fe, 0.72); g.fillTriangle(c, c - 72, c + 8, c - 56, c - 8, c - 56);
    }).setVisible(false);
    phaseAura = overlay(g => {
      const c = size / 2; g.lineStyle(3, 0x75afc6, 0.92); g.strokeCircle(c, c, 38);
      g.lineStyle(2, 0xd4f1f8, 0.8); g.lineBetween(c - 25, c + 22, c - 7, c + 5); g.lineBetween(c + 25, c + 22, c + 7, c + 5);
    }).setVisible(false);
  } else if (campaignId === 'hollow_warden') {
    ward = overlay(g => {
      const c = size / 2;
      g.lineStyle(5, 0x8b6ad0, 0.84); g.strokeCircle(c, c, 52); g.lineStyle(2, 0xc9aaff, 0.9);
      g.strokeCircle(c, c, 59); g.fillStyle(0x9e7ae6, 0.9);
      for (let i = 0; i < 6; i++) { const a = Math.PI * i / 3; g.fillCircle(c + Math.cos(a) * 53, c + Math.sin(a) * 53, 4); }
    }).setVisible(false);
    phaseAura = overlay(g => {
      const c = size / 2; g.lineStyle(3, 0x9e7ae6, 0.75);
      for (let i = 0; i < 3; i++) g.strokeCircle(c, c, 32 + i * 9);
      g.lineStyle(2, 0xc2a2ff, 0.8); g.lineBetween(c - 36, c, c + 36, c); g.lineBetween(c, c - 36, c, c + 36);
    }).setVisible(false);
  } else if (campaignId === 'drowned_oracle') {
    const cues = [0xb99a61, 0x63d3d2, 0xe59a61];
    oraclePhases = cues.map((color, index) => overlay(g => {
      const c = size / 2;
      g.lineStyle(5, color, 0.9); g.strokeCircle(c, c + 3, 48 + index * 5);
      g.lineStyle(3, color, 0.85);
      if (index === 0) {
        g.lineBetween(c - 28, c - 20, c - 28, c + 20); g.lineBetween(c + 28, c - 20, c + 28, c + 20);
        g.lineBetween(c - 28, c - 20, c, c - 36); g.lineBetween(c + 28, c - 20, c, c - 36);
      } else if (index === 1) {
        g.fillPoints(P2([{ x: c, y: c - 42 }, { x: c + 34, y: c }, { x: c, y: c + 42 }, { x: c - 34, y: c }]), false);
        g.fillCircle(c, c, 7);
      } else {
        for (let i = 0; i < 6; i++) {
          const a = Math.PI * i / 3, x = c + Math.cos(a) * 46, y = c + Math.sin(a) * 46;
          g.fillTriangle(x - 8, y + 11, x, y - 13, x + 8, y + 11);
        }
      }
    }).setVisible(false));
  } else if (campaignId === 'iron_tyrant') {
    const plate = (side: -1 | 1) => overlay(g => {
      const c = size / 2, x = c + side * 45;
      g.fillStyle(side < 0 ? 0x514b44 : 0x65584a, 1);
      g.fillPoints(P2([{ x: x - 30, y: c - 26 }, { x: x - 18, y: c - 52 }, { x: x + 12, y: c - 48 },
        { x: x + 26, y: c - 24 }, { x: x + 22, y: c + 8 }, { x: x - 8, y: c + 12 }]), true);
      g.lineStyle(3, profile.accent, 0.92);
      g.lineBetween(x - 13, c - 36, x - 2, c - 18); g.lineBetween(x - 2, c - 18, x - 14, c + 1);
    });
    leftArmor = plate(-1); rightArmor = plate(1);
    core = overlay(g => {
      const c = size / 2;
      g.fillStyle(0xf0a354, 0.44); g.fillCircle(c, c + 6, 28);
      g.fillStyle(0xffd489, 1); g.fillPoints(P2([{ x: c, y: c - 17 }, { x: c + 14, y: c + 5 }, { x: c, y: c + 25 }, { x: c - 14, y: c + 5 }]), true);
      g.fillStyle(0xfff1c5, 1); g.fillCircle(c, c + 5, 5);
    }).setVisible(false);
    phaseAura = overlay(g => { const c = size / 2; g.lineStyle(4, 0xeaa15b, 0.9); g.strokeCircle(c, c, 56); }).setVisible(false);
    tyrantSpeed = overlay(g => {
      const c = size / 2; g.lineStyle(3, 0xffd18a, 0.85);
      g.lineBetween(c - 68, c + 38, c - 34, c + 31); g.lineBetween(c - 70, c + 52, c - 34, c + 44);
      g.lineBetween(c + 68, c + 38, c + 34, c + 31); g.lineBetween(c + 70, c + 52, c + 34, c + 44);
    }).setVisible(false);
  } else if (campaignId === 'stormmaw_prime') {
    phaseAura = overlay(g => {
      const c = size / 2; g.lineStyle(4, 0x83d8fb, 0.72); g.strokeCircle(c, c + 8, 54);
      g.lineStyle(2, 0xc7edff, 0.72); g.strokeCircle(c, c + 8, 66);
    }).setVisible(false);
    stormWarning = overlay(g => {
      const c = size / 2;
      g.lineStyle(4, 0xbbeaff, 0.95); g.strokeCircle(c, c - 48, 25);
      g.lineStyle(3, 0x75c9f4, 0.95);
      g.lineBetween(c + 1, c - 68, c - 9, c - 48); g.lineBetween(c - 9, c - 48, c + 3, c - 48);
      g.lineBetween(c + 3, c - 48, c - 7, c - 28);
      for (const side of [-1, 1]) g.lineBetween(c + side * 36, c - 24, c + side * 58, c - 5);
    }).setVisible(false);
  } else if (campaignId === 'umbral_regent') {
    phaseAura = overlay(g => { const c = size / 2; g.lineStyle(3, 0xb391df, 0.68); g.strokeCircle(c, c + 8, 49); }).setVisible(false);
    regentEcho = overlay(g => {
      const c = size / 2;
      g.lineStyle(4, 0xc9b5ec, 0.62); g.strokeCircle(c - 73, c + 2, 20); g.strokeCircle(c + 73, c + 2, 20);
      g.lineStyle(2, 0xe1d4f6, 0.58);
      g.lineBetween(c - 88, c + 2, c - 58, c + 2); g.lineBetween(c + 58, c + 2, c + 88, c + 2);
      g.fillTriangle(c - 73, c - 7, c - 66, c + 2, c - 73, c + 11);
      g.fillTriangle(c + 73, c - 7, c + 66, c + 2, c + 73, c + 11);
    }).setVisible(false);
  } else if (campaignId === 'rift_sovereign') {
    phaseAura = overlay(g => { const c = size / 2; g.lineStyle(3, 0xc879ea, 0.7); g.strokeCircle(c, c + 14, 48); }).setVisible(false);
    portalCue = overlay(g => {
      const c = size / 2, y = c + 43;
      g.lineStyle(5, 0xe6a5fb, 0.92); g.strokeCircle(c, y, 53); g.strokeCircle(c, y, 37);
      g.lineStyle(3, 0xb968df, 0.9);
      for (let i = 0; i < 8; i++) { const a = Math.PI * i / 4; g.lineBetween(c + Math.cos(a) * 38, y + Math.sin(a) * 38, c + Math.cos(a) * 51, y + Math.sin(a) * 51); }
      g.fillPoints(P2([{ x: c, y: y - 18 }, { x: c + 9, y }, { x: c, y: y + 18 }, { x: c - 9, y }]), true);
    }).setVisible(false);
  } else if (campaignId === 'aether_devourer') {
    const colors = [0xf0d28a, 0x77d5c9, 0xc07bea, 0xff9b72];
    devourerPhases = colors.map((color, index) => overlay(g => {
      const c = size / 2, radius = 40 + index * 5;
      g.lineStyle(4, color, 0.88); g.strokeCircle(c, c + 4, radius);
      if (index === 0) {
        g.lineStyle(3, color, 0.92); g.lineBetween(c - 27, c + 4, c + 27, c + 4);
      } else if (index === 1) {
        g.strokeCircle(c, c + 4, radius - 11); g.fillCircle(c, c + 4, 5);
      } else if (index === 2) {
        g.fillPoints(P2([{ x: c, y: c - 48 }, { x: c + 10, y: c - 6 }, { x: c + 34, y: c + 5 }, { x: c + 7, y: c + 13 }, { x: c, y: c + 48 }, { x: c - 8, y: c + 13 }, { x: c - 34, y: c + 5 }, { x: c - 10, y: c - 6 }]), false);
      } else {
        for (let i = 0; i < 4; i++) { const a = Math.PI * i / 2; g.lineBetween(c + Math.cos(a) * 10, c + 4 + Math.sin(a) * 10, c + Math.cos(a) * 48, c + 4 + Math.sin(a) * 48); }
      }
    }).setVisible(false));
    core = overlay(g => {
      const c = size / 2;
      g.fillStyle(0xffa178, 0.46); g.fillCircle(c, c + 4, 30);
      g.fillStyle(0xffe2b4, 1); g.fillPoints(P2([{ x: c, y: c - 21 }, { x: c + 17, y: c + 3 }, { x: c, y: c + 28 }, { x: c - 17, y: c + 3 }]), true);
      g.fillStyle(0xffffff, 1); g.fillCircle(c, c + 3, 6);
    }).setVisible(false);
  } else if (campaignId === 'aetherbound') {
    ward = overlay(g => {
      const c = size / 2;
      g.lineStyle(4, 0x76ded9, 0.88); g.strokeCircle(c, c, 42);
      g.lineStyle(2, 0xc4fff0, 0.9);
      g.lineBetween(c, c - 53, c + 13, c - 39); g.lineBetween(c + 13, c - 39, c + 13, c + 39);
      g.lineBetween(c + 13, c + 39, c, c + 53); g.lineBetween(c, c + 53, c - 13, c + 39);
      g.lineBetween(c - 13, c + 39, c - 13, c - 39); g.lineBetween(c - 13, c - 39, c, c - 53);
    }).setVisible(false);
  } else if (campaignId === 'foundry_core') {
    const plate = (side: -1 | 1) => overlay(g => {
      const c = size / 2, x = c + side * 40;
      g.fillStyle(side < 0 ? 0x55493e : 0x665741, 1);
      g.fillPoints(P2([{ x: x - 22, y: c - 23 }, { x: x - 13, y: c - 43 }, { x: x + 15, y: c - 38 },
        { x: x + 23, y: c - 14 }, { x: x + 17, y: c + 16 }, { x: x - 12, y: c + 21 }]), true);
      g.lineStyle(3, 0xf3bf78, 0.9); g.lineBetween(x - 11, c - 26, x + 8, c - 8);
    }).setVisible(false);
    leftArmor = plate(-1); rightArmor = plate(1);
  } else if (campaignId === 'tempest_herald') {
    phaseAura = overlay(g => { const c = size / 2; g.lineStyle(3, 0x86d9fa, 0.68); g.strokeCircle(c, c + 5, 42); }).setVisible(false);
    telegraph = overlay(g => {
      const c = size / 2;
      g.lineStyle(3, 0xbbeaff, 0.95); g.strokeCircle(c, c - 39, 20);
      g.lineBetween(c + 1, c - 57, c - 8, c - 39); g.lineBetween(c - 8, c - 39, c + 4, c - 39);
      g.lineBetween(c + 4, c - 39, c - 5, c - 20);
    }).setVisible(false);
  } else if (campaignId === 'echo_shade') {
    regentEcho = overlay(g => {
      const c = size / 2;
      g.lineStyle(3, 0xd2b5f0, 0.72); g.strokeCircle(c - 42, c, 16); g.strokeCircle(c + 42, c, 16);
      g.lineStyle(2, 0xf0e1ff, 0.8); g.lineBetween(c - 52, c, c - 32, c); g.lineBetween(c + 32, c, c + 52, c);
      g.fillTriangle(c - 42, c - 6, c - 36, c, c - 42, c + 6);
      g.fillTriangle(c + 42, c - 6, c + 36, c, c + 42, c + 6);
    }).setVisible(false);
  } else if (campaignId === 'rift_weaver') {
    portalCue = overlay(g => {
      const c = size / 2, y = c + 28;
      g.lineStyle(4, 0xc879ea, 0.9); g.strokeCircle(c, y, 36); g.strokeCircle(c, y, 24);
      g.lineStyle(2, 0xe6a5fb, 0.9);
      for (let i = 0; i < 6; i++) { const a = Math.PI * i / 3; g.lineBetween(c + Math.cos(a) * 27, y + Math.sin(a) * 27, c + Math.cos(a) * 36, y + Math.sin(a) * 36); }
    }).setVisible(false);
  } else if (campaignId === 'crown_archon') {
    ward = overlay(g => {
      const c = size / 2;
      g.lineStyle(4, 0xf1d27a, 0.9); g.strokeCircle(c, c, 42); g.strokeCircle(c, c, 51);
      g.lineStyle(2, 0xffefb0, 0.9);
      g.lineBetween(c - 20, c - 16, c - 12, c + 14); g.lineBetween(c - 12, c + 14, c, c - 3);
      g.lineBetween(c, c - 3, c + 12, c + 14); g.lineBetween(c + 12, c + 14, c + 20, c - 16);
      g.fillCircle(c, c - 3, 4);
    }).setVisible(false);
  }
  let facing: Facing = 'right', walking = false, currentPoseKey = '';
  let activeAction: { state: EnemyAnimationAction; key: string; priority: number } | null = null;
  let phasePose: { state: EnemyAnimationAction; frame: string } | null = null;
  let deathStarted = false;
  let previousPhase = 1, previousTelegraph = false, previousGuarded = false;
  const definitions = new Map(campaignAnimationDefinitions(key).map(definition => [definition.state, definition] as const));
  // Temporary procedural art remains static. Only approved atlas frames receive clips.
  if (art.final) for (const definition of definitions.values()) {
    if (!scene.anims.exists(definition.key)) scene.anims.create({
      key: definition.key,
      frames: definition.frames.map(frame => ({ key, frame })),
      frameRate: definition.frameRate,
      repeat: definition.repeat
    });
  }
  const showPose = (): void => {
    if (!art.final || activeAction) return;
    if (phasePose) {
      const heldPoseKey = `held:${phasePose.state}`;
      if (currentPoseKey !== heldPoseKey || sprite.frame.name !== phasePose.frame) {
        sprite.anims.stop();
        sprite.setFrame(phasePose.frame);
        currentPoseKey = heldPoseKey;
      }
      return;
    }
    const state = walking ? 'walk' : 'idle';
    const animationKey = `campaign_enemy_${campaignId}_${state}`;
    if (scene.anims.exists(animationKey)) {
      if (currentPoseKey !== animationKey) { currentPoseKey = animationKey; sprite.play(animationKey); }
    } else {
      sprite.anims.stop(); sprite.setFrame(frameName); currentPoseKey = animationKey;
    }
  };
  const playAction = (state: EnemyAnimationAction): number | null => {
    if (!art.final) return null;
    const definition = definitions.get(state);
    if (!definition || definition.repeat !== 0 || !scene.anims.exists(definition.key)) return null;
    const durationMs = definition.frames.length * 1000 / definition.frameRate;
    if (!Number.isFinite(durationMs) || durationMs <= 0) return null;
    if (deathStarted) return state === 'death' && activeAction?.state === 'death' ? durationMs : null;
    if (activeAction?.state === state) return durationMs;
    const priority = ACTION_PRIORITY[state];
    if (activeAction && priority <= activeAction.priority) return null;
    if (state === 'death') deathStarted = true;
    activeAction = { state, key: definition.key, priority };
    currentPoseKey = definition.key;
    sprite.play(definition.key);
    return durationMs;
  };
  sprite.on('animationcomplete', (animation: { key?: string } | undefined) => {
    if (!activeAction || animation?.key !== activeAction.key || activeAction.state === 'death') return;
    activeAction = null;
    currentPoseKey = '';
    showPose();
  });
  showPose();
  return {
    view, body, sprite, ...ROLE_MOTION[archetype], maxVisualDimension: dimension, atlas: key,
    frameRectangles: { right: [frame], left: [frame] },
    setFacing(dx: number) { if (Math.abs(dx) >= 0.01) { facing = dx < 0 ? 'left' : 'right'; sprite.setFlipX(facing === 'left'); overlays.setScale(facing === 'left' ? -1 : 1, 1); } },
    setWalking(value: boolean) { if (walking !== value) { walking = value; showPose(); } },
    getFacing: () => facing, isWalking: () => walking, playAction,
    ...(profile.role === 'boss' || ['aetherbound', 'foundry_core', 'tempest_herald', 'echo_shade', 'rift_weaver', 'crown_archon'].includes(campaignId) ? {
      setCampaignState(state: CampaignBossArtState) {
        const phase = Math.max(1, Math.min(4, Math.floor(state.phase)));
        let transitionAction: EnemyAnimationAction | null = null;
        let nextPhasePose: EnemyAnimationAction | null = null;
        const preferAction = (action: EnemyAnimationAction): void => {
          if (!transitionAction || ACTION_PRIORITY[action] > ACTION_PRIORITY[transitionAction]) transitionAction = action;
        };
        if (campaignId === 'cinder_colossus') {
          if (leftArmor) leftArmor.setVisible(phase === 1 || phase === 2);
          if (rightArmor) rightArmor.setVisible(phase === 1);
          if (core) core.setVisible(phase >= 2).setAlpha(phase === 3 ? 1 : 0.55);
          phaseAura?.setVisible(phase >= 2 || state.telegraph);
          nextPhasePose = phase >= 3 ? 'exposed_core' : phase === 2 ? 'armor_break' : null;
          if (phase > previousPhase && nextPhasePose) preferAction(nextPhasePose);
        } else if (campaignId === 'frostbound_matriarch') {
          telegraph?.setVisible(state.telegraph);
          phaseAura?.setVisible(phase >= 2);
          nextPhasePose = phase >= 2 ? 'phase_two' : null;
          if (phase > previousPhase) preferAction('phase_two');
          if (state.telegraph && !previousTelegraph) preferAction('freeze_cast');
        } else if (campaignId === 'mireheart_hydra') {
          phaseAura?.setVisible(phase >= 2 || state.telegraph);
          nextPhasePose = state.telegraph ? 'special' : phase >= 2 ? 'phase_two' : null;
        } else if (campaignId === 'hollow_warden') {
          ward?.setVisible(state.guarded);
          phaseAura?.setVisible(phase >= 2);
          nextPhasePose = state.guarded || phase >= 2 ? 'special' : null;
          if ((state.guarded && !previousGuarded) || phase > previousPhase) preferAction('special');
        } else if (campaignId === 'drowned_oracle') {
          const phaseIndex = state.phaseLabel === 'oracle_physical' ? 0
            : state.phaseLabel === 'oracle_arcane' ? 1
              : state.phaseLabel === 'oracle_elemental' ? 2
                : state.resistanceType === 'physical' ? 0 : state.resistanceType === 'arcane' ? 1
                  : state.resistanceType === 'elemental' ? 2 : phase - 1;
          oraclePhases.forEach((cue, index) => cue.setVisible(index === phaseIndex));
        } else if (campaignId === 'iron_tyrant') {
          const tyrantPhase = state.phaseLabel === 'tyrant_plates' ? 1
            : state.phaseLabel === 'tyrant_break' ? 2
              : state.phaseLabel === 'tyrant_core' ? 3 : phase;
          if (leftArmor) leftArmor.setVisible(tyrantPhase <= 2);
          if (rightArmor) rightArmor.setVisible(tyrantPhase === 1);
          if (core) core.setVisible(tyrantPhase >= 3).setAlpha(tyrantPhase >= 3 ? 1 : 0.55);
          phaseAura?.setVisible(tyrantPhase >= 2);
          tyrantSpeed?.setVisible(tyrantPhase >= 3);
        } else if (campaignId === 'stormmaw_prime') {
          stormWarning?.setVisible(state.telegraph);
          phaseAura?.setVisible(state.phase >= 2 || state.telegraph);
        } else if (campaignId === 'umbral_regent') {
          regentEcho?.setVisible((state.cloneCount ?? 0) > 0 || state.telegraph);
          phaseAura?.setVisible((state.cloneCount ?? 0) > 0 || state.phase >= 2);
        } else if (campaignId === 'rift_sovereign') {
          portalCue?.setVisible(state.telegraph);
          phaseAura?.setVisible(state.phase >= 2 || state.telegraph);
        } else if (campaignId === 'aether_devourer') {
          const phaseIndex = state.phaseLabel === 'devourer_normal' ? 0
            : state.phaseLabel === 'devourer_resistance' ? 1
              : state.phaseLabel === 'devourer_rift' ? 2
                : state.phaseLabel === 'devourer_core' ? 3 : phase - 1;
          devourerPhases.forEach((cue, index) => cue.setVisible(index === phaseIndex));
          if (core) core.setVisible(phaseIndex === 3).setAlpha(phaseIndex === 3 ? 1 : 0.55);
        } else if (campaignId === 'aetherbound') {
          ward?.setVisible(state.phaseLabel === 'aether_shield');
        } else if (campaignId === 'foundry_core') {
          const reinforced = state.phaseLabel === 'foundry_armor';
          leftArmor?.setVisible(reinforced); rightArmor?.setVisible(reinforced);
        } else if (campaignId === 'tempest_herald') {
          telegraph?.setVisible(state.telegraph && state.phaseLabel === 'tempest_haste');
          phaseAura?.setVisible(state.telegraph);
        } else if (campaignId === 'echo_shade') {
          regentEcho?.setVisible(state.phaseLabel === 'echo_decoys' || state.telegraph);
        } else if (campaignId === 'rift_weaver') {
          portalCue?.setVisible(state.telegraph && state.phaseLabel === 'rift_jump');
        } else if (campaignId === 'crown_archon') {
          ward?.setVisible(state.phaseLabel === 'crown_ward');
        }
        const frames = nextPhasePose ? definitions.get(nextPhasePose)?.frames : undefined;
        phasePose = nextPhasePose && frames?.length ? { state: nextPhasePose, frame: frames[frames.length - 1] } : null;
        if (transitionAction) playAction(transitionAction);
        showPose();
        previousPhase = phase;
        previousTelegraph = state.telegraph;
        previousGuarded = state.guarded;
      }
    } : {})
  };
}

export function buildEnemyVisual(scene: Phaser.Scene, archetype: EnemyArchetype, campaignId?: string): EnemyView {
  if (campaignId) {
    const campaignVisual = buildCampaignEnemyVisual(scene, archetype, campaignId);
    if (campaignVisual) return campaignVisual;
  }
  const spec = SPECS[archetype];
  const rightFrames = framesFor(spec, 'right');
  const leftFrames = framesFor(spec, 'left');
  ensureAtlasFrames(scene, spec);
  const rightKey = `enemy_${archetype}_right`;
  const leftKey = `enemy_${archetype}_left`;
  ensureAnimation(scene, rightKey, spec.atlas, rightFrames, FRAME_RATE[archetype]);
  ensureAnimation(scene, leftKey, spec.atlas, leftFrames, FRAME_RATE[archetype]);

  const view = scene.add.container(0, 0);
  const body = scene.add.container(0, 0);
  const sprite = scene.add.sprite(0, 0, spec.atlas, rightFrames[0].name)
    .setOrigin(0.5, 1)
    .setScale(spec.targetDimension / maxSourceDimension(spec));
  body.add(sprite);
  view.add(body);

  let facing: Facing = 'right';
  let walking = false;
  const showPose = () => {
    if (walking) sprite.play(facing === 'right' ? rightKey : leftKey, true);
    else {
      sprite.anims.stop();
      sprite.setFrame(framesFor(spec, facing)[0].name);
    }
  };

  return {
    view,
    body,
    sprite,
    ...ROLE_MOTION[archetype],
    maxVisualDimension: spec.targetDimension,
    atlas: spec.atlas,
    frameRectangles: { right: rightFrames, left: leftFrames },
    setFacing(dx: number, _dy = 0) {
      if (Math.abs(dx) < 0.01) return;
      const next: Facing = dx < 0 ? 'left' : 'right';
      if (next === facing) return;
      facing = next;
      showPose();
    },
    setWalking(value: boolean) {
      if (walking === value) return;
      walking = value;
      showPose();
    },
    getFacing: () => facing,
    isWalking: () => walking,
    playAction: () => null
  };
}

/** Exact input to the renderer, including irregular source rects and pivots. */
export function enemyArtContract(archetype: EnemyArchetype): {
  atlas: string;
  rightFrames: TrimFrame[];
  leftFrames: TrimFrame[];
  targetDimension: number;
  frameRate: number;
  motion: Pick<EnemyView, 'bobAmp' | 'bobFreq' | 'rockAmp'>;
} {
  const spec = SPECS[archetype];
  return {
    atlas: spec.atlas,
    rightFrames: spec.rightFrames,
    leftFrames: spec.leftFrames,
    targetDimension: spec.targetDimension,
    frameRate: FRAME_RATE[archetype],
    motion: ROLE_MOTION[archetype]
  };
}
