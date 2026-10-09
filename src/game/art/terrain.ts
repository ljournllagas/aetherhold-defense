import Phaser from 'phaser';
import { MAP1, HUD_HEIGHT } from '../maps/map1.ts';
import type { MapDef } from '../maps/map1.ts';
import type { CampaignWorldId } from '../campaign/types.ts';
import { ensureCampaignBattleBackground } from './campaignArt.ts';

export interface StrongholdArt {
  root: Phaser.GameObjects.Container;
  cracks: Phaser.GameObjects.Graphics;
  smoke: Phaser.GameObjects.Graphics;
  ember: Phaser.GameObjects.Arc;
  beacon: Phaser.GameObjects.Arc;
  beaconSprite?: Phaser.GameObjects.Sprite;
}

export interface BattlefieldArt {
  stronghold: StrongholdArt;
  torchFlames: Phaser.GameObjects.Arc[];
}

const BEACON_FRAMES = [
  { name: 'healthy', x: 368, y: 35, width: 340, height: 622 },
  { name: 'damaged', x: 913, y: 43, width: 341, height: 609 },
  { name: 'critical', x: 1459, y: 40, width: 341, height: 611 }
] as const;

function ensureBeaconFrames(scene: Phaser.Scene): void {
  if (!scene.textures.exists('stronghold_beacon_atlas')) return;
  const texture = scene.textures.get('stronghold_beacon_atlas');
  for (const frame of BEACON_FRAMES) {
    if (!texture.has(frame.name)) texture.add(frame.name, 0, frame.x, frame.y, frame.width, frame.height);
  }
}

/**
 * Draws the reviewed painted battlefield at the canonical field rectangle.
 * The texture includes road, clearings, ruins, forest, keep, and its original
 * beacon; this layer adds only small runtime health cues and ambient light.
 */
export function paintBattlefield(scene: Phaser.Scene, map: MapDef = MAP1, worldId?: CampaignWorldId): BattlefieldArt {
  const field = map.field;
  const backgroundKey = worldId ? ensureCampaignBattleBackground(scene, map, worldId) : map.backgroundKey;
  scene.add.image(field.x, field.y, backgroundKey)
    .setOrigin(0, 0)
    .setDisplaySize(field.width, field.height)
    .setDepth(0);

  const stronghold = map.stronghold;
  const beaconPoint = map.beacon;
  const root = scene.add.container(0, 0).setDepth(3);

  // The beacon sits at the painted spire, separate from the bridge/gameplay gate.
  ensureBeaconFrames(scene);
  const beaconSprite = scene.textures.exists('stronghold_beacon_atlas')
    ? scene.add.sprite(beaconPoint.x, beaconPoint.y, 'stronghold_beacon_atlas', 'healthy')
      .setOrigin(0.5)
      .setScale(34 / BEACON_FRAMES[0].height)
      .setDepth(3)
    : undefined;
  if (beaconSprite) root.add(beaconSprite);

  const beacon = scene.add.circle(beaconPoint.x, beaconPoint.y, 8, 0x9e7ae6, 0.28).setDepth(4);
  root.add(beacon);
  scene.tweens.add({
    targets: beacon,
    alpha: 0.16,
    scale: 1.18,
    duration: 1450,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  });

  const cracks = scene.add.graphics().setDepth(4).setVisible(false);
  cracks.lineStyle(1.4, 0x211b17, 0.92);
  cracks.lineBetween(stronghold.x - 15, stronghold.y - 20, stronghold.x - 7, stronghold.y - 12);
  cracks.lineBetween(stronghold.x - 7, stronghold.y - 12, stronghold.x - 11, stronghold.y - 4);
  cracks.lineBetween(stronghold.x + 12, stronghold.y - 23, stronghold.x + 7, stronghold.y - 14);

  const smoke = scene.add.graphics().setDepth(5).setVisible(false);
  smoke.fillStyle(0x292a2c, 0.36);
  smoke.fillCircle(stronghold.x - 10, stronghold.y - 38, 4.5);
  smoke.fillCircle(stronghold.x + 4, stronghold.y - 44, 5.5);
  smoke.fillCircle(stronghold.x + 1, stronghold.y - 54, 3.6);
  const ember = scene.add.circle(stronghold.x, stronghold.y - 18, 4, 0xe8643c, 0.9)
    .setDepth(5)
    .setVisible(false);
  root.add([cracks, smoke, ember]);

  return {
    stronghold: { root, cracks, smoke, ember, beacon, beaconSprite },
    // The painted environment supplies its own torch props; no duplicate props
    // are created here. The scene keeps this array contract for ambient updates.
    torchFlames: []
  };
}

/** Healthy → damaged → critical. The keep art remains intact under these cues. */
export function refreshStronghold(s: StrongholdArt, livesFrac: number): void {
  const health = Math.max(0, Math.min(1, livesFrac));
  const state = health > 0.66 ? 0 : health > 0.3 ? 1 : 2;
  s.cracks.setVisible(state > 0);
  s.smoke.setVisible(state > 1);
  s.ember.setVisible(state > 1);
  if (s.beaconSprite) s.beaconSprite.setFrame(BEACON_FRAMES[state].name);
  s.beacon.setFillStyle(state === 0 ? 0x9e7ae6 : state === 1 ? 0xe8a33d : 0xd85f59, state === 2 ? 0.48 : 0.28);
}

export { HUD_HEIGHT };
