import Phaser from 'phaser';
import type { EnemyArchetype } from '../../shared/types.ts';
import atlasMetadata from './enemyAtlasFrames.json';

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

export function buildEnemyVisual(scene: Phaser.Scene, archetype: EnemyArchetype): EnemyView {
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
