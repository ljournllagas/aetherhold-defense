import Phaser from 'phaser';
import type { EnemyArchetype } from '../../shared/types.ts';
import atlasMetadata from './enemyAtlasFrames.json';
import { ensureCampaignEnemyTexture, type CampaignBossArtState } from './campaignArt.ts';
import { campaignAnimationDefinitions } from '../campaign/artManifest.ts';
import { P2 } from './artkit.ts';

type Facing = 'left' | 'right';
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
  setCampaignState?(state: CampaignBossArtState): void;
}

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
  const sprite = (art.final ? scene.add.sprite(0, 0, key, frameName) : scene.add.sprite(0, 0, key)).setOrigin(0.5, 1).setScale(dimension / size);
  body.add(sprite); view.add(body);

  const overlay = (draw: (g: Phaser.GameObjects.Graphics) => void): Phaser.GameObjects.Graphics => {
    const g = scene.add.graphics().setPosition(-size / 2, -size).setScale(dimension / size);
    draw(g); body.add(g); return g;
  };
  let leftArmor: Phaser.GameObjects.Graphics | null = null, rightArmor: Phaser.GameObjects.Graphics | null = null;
  let core: Phaser.GameObjects.Graphics | null = null, telegraph: Phaser.GameObjects.Graphics | null = null;
  let ward: Phaser.GameObjects.Graphics | null = null, phaseAura: Phaser.GameObjects.Graphics | null = null;
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
  }
  let facing: Facing = 'right', walking = false, bossPose: string | null = null, currentPoseKey = '';
  // Register every manifest row. Support-buff clips are available by key, but
  // their playback remains unverified until the runtime signals a buff state.
  if (art.final) for (const definition of campaignAnimationDefinitions(key)) {
    if (!scene.anims.exists(definition.key)) scene.anims.create({
      key: definition.key,
      frames: definition.frames.map(frame => ({ key, frame })),
      frameRate: definition.frameRate,
      repeat: definition.repeat
    });
  }
  const showPose = (): void => {
    if (!art.final) return;
    const state = bossPose ?? (walking ? 'walk' : 'idle');
    const animationKey = `campaign_enemy_${campaignId}_${state}`;
    if (scene.anims.exists(animationKey)) {
      if (currentPoseKey !== animationKey) { currentPoseKey = animationKey; sprite.play(animationKey); }
    } else {
      sprite.anims.stop(); sprite.setFrame(frameName); currentPoseKey = animationKey;
    }
  };
  showPose();
  return {
    view, body, sprite, ...ROLE_MOTION[archetype], maxVisualDimension: dimension, atlas: key,
    frameRectangles: { right: [frame], left: [frame] },
    setFacing(dx: number) { if (Math.abs(dx) >= 0.01) { facing = dx < 0 ? 'left' : 'right'; sprite.setFlipX(facing === 'left'); } },
    setWalking(value: boolean) { if (walking !== value) { walking = value; showPose(); } },
    getFacing: () => facing, isWalking: () => walking,
    ...(campaignId === 'cinder_colossus' || campaignId === 'frostbound_matriarch' || campaignId === 'hollow_warden' ? {
      setCampaignState(state: CampaignBossArtState) {
        const phase = Math.max(1, Math.min(3, Math.floor(state.phase)));
        let nextBossPose: string | null = null;
        if (campaignId === 'cinder_colossus') {
          if (leftArmor) leftArmor.setVisible(phase === 1 || phase === 2);
          if (rightArmor) rightArmor.setVisible(phase === 1);
          if (core) core.setVisible(phase >= 2).setAlpha(phase === 3 ? 1 : 0.55);
          phaseAura?.setVisible(phase >= 2 || state.telegraph);
          nextBossPose = phase >= 3 ? 'exposed_core' : phase >= 2 ? 'armor_break' : null;
        } else if (campaignId === 'frostbound_matriarch') {
          telegraph?.setVisible(state.telegraph);
          phaseAura?.setVisible(phase >= 2);
          nextBossPose = state.telegraph ? 'freeze_cast' : phase >= 2 ? 'phase_two' : null;
        } else {
          ward?.setVisible(state.guarded);
          phaseAura?.setVisible(phase >= 2);
          nextBossPose = state.guarded || phase >= 2 ? 'special' : null;
        }
        if (bossPose !== nextBossPose) {
          bossPose = nextBossPose;
          showPose();
        }
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
    isWalking: () => walking
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
