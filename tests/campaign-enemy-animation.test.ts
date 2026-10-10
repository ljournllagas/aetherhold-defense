import { describe, expect, it, vi } from 'vitest';
import { buildEnemyVisual } from '../src/game/art/enemyArt.ts';

vi.mock('phaser', () => ({ default: { Scene: class { constructor(_key?: string) {} } } }));

function chainStub(): any {
  let proxy: any;
  proxy = new Proxy({}, {
    get: (_target, key) => key === 'then' ? undefined : key === Symbol.toPrimitive ? () => 0 : () => proxy
  });
  return proxy;
}

function transformStub() {
  const object: any = { x: 0, y: 0, scaleX: 1, scaleY: 1, originX: 0, originY: 0, visible: true, children: [], operations: [] };
  object.setPosition = vi.fn((x: number, y: number) => { object.x = x; object.y = y; return object; });
  object.setScale = vi.fn((x: number, y = x) => { object.scaleX = x; object.scaleY = y; return object; });
  object.setOrigin = vi.fn((x: number, y = x) => { object.originX = x; object.originY = y; return object; });
  object.setVisible = vi.fn((visible: boolean) => { object.visible = visible; return object; });
  object.setAlpha = vi.fn((alpha: number) => { object.alpha = alpha; return object; });
  object.add = vi.fn((child: unknown) => { object.children.push(child); return object; });
  for (const method of ['fillStyle', 'lineStyle', 'fillPoints', 'lineBetween', 'strokeCircle', 'fillCircle', 'fillTriangle']) {
    object[method] = vi.fn((...args: unknown[]) => { object.operations.push({ method, args }); return object; });
  }
  return object;
}

function fixture(finalAtlas = true) {
  const definitions = new Map<string, unknown>();
  const listeners = new Map<string, (animation: { key?: string }) => void>();
  const containers: any[] = [];
  const graphics: any[] = [];
  const sprite: any = { frame: { name: 'walk_0' }, texture: { key: 'campaign_enemy_ashcaller' }, scaleX: 1 };
  sprite.anims = { timeScale: 1, stop: vi.fn(), pause: vi.fn(), resume: vi.fn() };
  sprite.setOrigin = vi.fn((x: number, y: number) => { sprite.originX = x; sprite.originY = y; return sprite; });
  sprite.setScale = vi.fn((x: number, y = x) => { sprite.scaleX = x; sprite.scaleY = y; return sprite; });
  sprite.setFlipX = vi.fn((flip: boolean) => { sprite.flipX = flip; return sprite; });
  sprite.setFrame = vi.fn((name: string) => { sprite.frame = { name }; return sprite; });
  sprite.play = vi.fn((key: string) => { sprite.currentAnimation = key; return sprite; });
  sprite.on = vi.fn((event: string, listener: (animation: { key?: string }) => void) => { listeners.set(event, listener); return sprite; });
  sprite.complete = (key: string) => listeners.get('animationcomplete')?.({ key });

  const texture = { has: vi.fn(() => true), add: vi.fn() };
  const scene: any = {
    textures: {
      exists: (key: string) => !key.includes('_temp_') && (finalAtlas || !key.startsWith('campaign_enemy_')),
      get: () => texture
    },
    add: {
      container: () => { const container = transformStub(); containers.push(container); return container; },
      sprite: () => sprite,
      graphics: () => { const graphic = transformStub(); graphics.push(graphic); return graphic; }
    },
    make: { graphics: () => chainStub() },
    anims: {
      exists: (key: string) => definitions.has(key),
      create: (definition: { key: string }) => { definitions.set(definition.key, definition); }
    }
  };
  return { scene, sprite, definitions, containers, graphics };
}

function spritePoint(sprite: any, point: { x: number; y: number }, size: number): { x: number; y: number } {
  return {
    x: (point.x - size * sprite.originX) * sprite.scaleX * (sprite.flipX ? -1 : 1),
    y: (point.y - size * sprite.originY) * sprite.scaleY
  };
}

function overlayPoint(root: any, graphic: any, point: { x: number; y: number }): { x: number; y: number } {
  return {
    x: root.x + (graphic.x + point.x * graphic.scaleX) * root.scaleX,
    y: root.y + (graphic.y + point.y * graphic.scaleY) * root.scaleY
  };
}

function expectSamePoint(actual: { x: number; y: number }, expected: { x: number; y: number }): void {
  expect(actual.x).toBeCloseTo(expected.x, 8);
  expect(actual.y).toBeCloseTo(expected.y, 8);
}

describe('campaign enemy animation playback', () => {
  it('keeps boss overlays on the sprite origin through phase changes and both facings', () => {
    const bosses = [
      { id: 'cinder_colossus', phases: [{ phase: 1, telegraph: false, guarded: false }, { phase: 2, telegraph: false, guarded: false }, { phase: 3, telegraph: false, guarded: false }] },
      { id: 'frostbound_matriarch', phases: [{ phase: 1, telegraph: false, guarded: false }, { phase: 1, telegraph: true, guarded: false }, { phase: 2, telegraph: false, guarded: false }, { phase: 2, telegraph: true, guarded: false }] },
      { id: 'hollow_warden', phases: [{ phase: 1, telegraph: false, guarded: false }, { phase: 1, telegraph: false, guarded: true }, { phase: 2, telegraph: false, guarded: true }, { phase: 3, telegraph: false, guarded: false }] }
    ] as const;

    for (const finalAtlas of [true, false]) for (const boss of bosses) {
      const { scene, sprite, containers, graphics } = fixture(finalAtlas);
      const visual = buildEnemyVisual(scene, 'warlord', boss.id);
      const overlayRoot = containers.find(container => container.children.some((child: unknown) => graphics.includes(child)));
      expect(overlayRoot).toBeDefined();

      for (const phaseState of boss.phases) {
        visual.setCampaignState?.(phaseState);
        for (const facing of [1, -1]) {
          visual.setFacing(facing);
          const ringGraphic = graphics.find(graphic => graphic.visible && graphic.operations.some((op: any) => op.method === 'strokeCircle'));
          if (!ringGraphic) continue;
          const ring = ringGraphic.operations.find((op: any) => op.method === 'strokeCircle')!;
          const [centerX, centerY, radius] = ring.args as [number, number, number];
          const size = centerX * 2;

          // Both the ring center and a point on its right edge must land exactly where
          // the same atlas coordinates land on the sprite, including a left-facing flip.
          for (const point of [{ x: centerX, y: centerY }, { x: centerX + radius, y: centerY }]) {
            expectSamePoint(overlayPoint(overlayRoot, ringGraphic, point), spritePoint(sprite, point, size));
          }

          if (finalAtlas) expect(sprite.texture.key).toContain('campaign_enemy_');
        }
      }

      if (boss.id === 'cinder_colossus') {
        const plates = graphics.filter(graphic => graphic.operations.some((op: any) => op.method === 'fillPoints') && graphic.operations.some((op: any) => op.method === 'lineBetween'));
        expect(plates).toHaveLength(2);
        const firstVertex = plates[0].operations.find((op: any) => op.method === 'fillPoints')!.args[0][0];
        visual.setFacing(1);
        const rightFacingX = overlayPoint(overlayRoot, plates[0], firstVertex).x;
        visual.setFacing(-1);
        const leftFacingX = overlayPoint(overlayRoot, plates[0], firstVertex).x;
        expect(rightFacingX).toBeLessThan(0);
        expect(leftFacingX).toBeCloseTo(-rightFacingX, 8);
      }
    }
  });

  it('plays an explicit one-shot through completion, then follows current movement', () => {
    const { scene, sprite } = fixture();
    const visual = buildEnemyVisual(scene, 'gloomite', 'ashcaller');

    expect(visual.playAction('attack')).toBe(750);
    visual.setWalking(true);
    expect(sprite.play).toHaveBeenLastCalledWith('campaign_enemy_ashcaller_attack');
    sprite.complete('campaign_enemy_ashcaller_idle');
    expect(sprite.play).toHaveBeenLastCalledWith('campaign_enemy_ashcaller_attack');
    sprite.complete('campaign_enemy_ashcaller_attack');
    expect(sprite.play).toHaveBeenLastCalledWith('campaign_enemy_ashcaller_walk');
    visual.setWalking(false);
    expect(sprite.play).toHaveBeenLastCalledWith('campaign_enemy_ashcaller_idle');
  });

  it('uses event and death priority without restarting or replacing a death clip', () => {
    const { scene, sprite } = fixture();
    const visual = buildEnemyVisual(scene, 'warlord', 'frostbound_matriarch');
    visual.setWalking(true);

    expect(visual.playAction('attack')).toBe(1000);
    visual.setCampaignState?.({ phase: 1, telegraph: true, guarded: false });
    expect(sprite.play).toHaveBeenLastCalledWith('campaign_enemy_frostbound_matriarch_freeze_cast');
    expect(visual.playAction('attack')).toBeNull();
    sprite.complete('campaign_enemy_frostbound_matriarch_freeze_cast');
    expect(sprite.play).toHaveBeenLastCalledWith('campaign_enemy_frostbound_matriarch_walk');

    expect(visual.playAction('attack')).toBe(1000);
    expect(visual.playAction('death')).toBe(1000);
    visual.setWalking(false);
    sprite.complete('campaign_enemy_frostbound_matriarch_death');
    expect(visual.playAction('attack')).toBeNull();
    expect(sprite.play).toHaveBeenLastCalledWith('campaign_enemy_frostbound_matriarch_death');
  });

  it('holds the Matriarch phase pose after phase and freeze clips complete', () => {
    const { scene, sprite } = fixture();
    const visual = buildEnemyVisual(scene, 'warlord', 'frostbound_matriarch');
    visual.setWalking(true);
    visual.setCampaignState?.({ phase: 1, telegraph: false, guarded: false });
    visual.setCampaignState?.({ phase: 2, telegraph: false, guarded: false });
    expect(sprite.play).toHaveBeenLastCalledWith('campaign_enemy_frostbound_matriarch_phase_two');
    visual.setCampaignState?.({ phase: 2, telegraph: false, guarded: false });
    expect(sprite.play).toHaveBeenCalledTimes(3); // idle, walk, phase_two
    sprite.complete('campaign_enemy_frostbound_matriarch_phase_two');
    expect(sprite.frame.name).toBe('phase_two_7');

    visual.setWalking(false); visual.setWalking(true);
    expect(sprite.frame.name).toBe('phase_two_7');
    expect(sprite.play).toHaveBeenCalledTimes(3);

    visual.setCampaignState?.({ phase: 2, telegraph: true, guarded: false });
    expect(sprite.play).toHaveBeenLastCalledWith('campaign_enemy_frostbound_matriarch_freeze_cast');
    sprite.complete('campaign_enemy_frostbound_matriarch_freeze_cast');
    expect(sprite.frame.name).toBe('phase_two_7');
  });

  it('keeps Colossus armor/core phase frames instead of restoring intact locomotion', () => {
    const { scene, sprite } = fixture();
    const visual = buildEnemyVisual(scene, 'warlord', 'cinder_colossus');
    visual.setWalking(true);
    visual.setCampaignState?.({ phase: 1, telegraph: false, guarded: false });
    visual.setCampaignState?.({ phase: 2, telegraph: false, guarded: false });
    expect(sprite.play).toHaveBeenLastCalledWith('campaign_enemy_cinder_colossus_armor_break');
    sprite.complete('campaign_enemy_cinder_colossus_armor_break');
    expect(sprite.frame.name).toBe('armor_break_7');

    visual.setWalking(false);
    visual.setCampaignState?.({ phase: 2, telegraph: false, guarded: false });
    expect(sprite.frame.name).toBe('armor_break_7');
    expect(sprite.play).toHaveBeenCalledTimes(3); // no phase animation restart

    visual.setCampaignState?.({ phase: 3, telegraph: false, guarded: false });
    expect(sprite.play).toHaveBeenLastCalledWith('campaign_enemy_cinder_colossus_exposed_core');
    sprite.complete('campaign_enemy_cinder_colossus_exposed_core');
    expect(sprite.frame.name).toBe('exposed_core_7');
    visual.setWalking(true);
    expect(sprite.frame.name).toBe('exposed_core_7');
    expect(visual.playAction('death')).toBe(1000);
    sprite.complete('campaign_enemy_cinder_colossus_death');
    expect(visual.playAction('attack')).toBeNull();
    expect(sprite.play).toHaveBeenLastCalledWith('campaign_enemy_cinder_colossus_death');
  });

  it('keeps Warden special art only while guarding or in a later phase', () => {
    const { scene, sprite } = fixture();
    const visual = buildEnemyVisual(scene, 'warlord', 'hollow_warden');
    visual.setWalking(true);
    visual.setCampaignState?.({ phase: 1, telegraph: false, guarded: false });
    visual.setCampaignState?.({ phase: 1, telegraph: false, guarded: true });
    expect(sprite.play).toHaveBeenLastCalledWith('campaign_enemy_hollow_warden_special');
    sprite.complete('campaign_enemy_hollow_warden_special');
    expect(sprite.frame.name).toBe('special_7');

    visual.setCampaignState?.({ phase: 1, telegraph: false, guarded: false });
    expect(sprite.play).toHaveBeenLastCalledWith('campaign_enemy_hollow_warden_walk');
    visual.setCampaignState?.({ phase: 2, telegraph: false, guarded: false });
    expect(sprite.play).toHaveBeenLastCalledWith('campaign_enemy_hollow_warden_special');
    sprite.complete('campaign_enemy_hollow_warden_special');
    expect(sprite.frame.name).toBe('special_7');
  });

  it('leaves the procedural fallback static and returns no authored action duration', () => {
    const { scene, sprite } = fixture(false);
    const visual = buildEnemyVisual(scene, 'gloomite', 'ashcaller');

    expect(visual.playAction('buff')).toBeNull();
    expect(sprite.play).not.toHaveBeenCalled();
  });

  it('keeps classic directional locomotion unchanged and exposes no authored actions', () => {
    const { scene, sprite } = fixture();
    const visual = buildEnemyVisual(scene, 'gloomite');

    expect(visual.playAction('attack')).toBeNull();
    visual.setWalking(true);
    expect(sprite.play).toHaveBeenLastCalledWith('enemy_gloomite_right', true);
    visual.setWalking(false);
    expect(sprite.anims.stop).toHaveBeenCalledOnce();
  });
});
