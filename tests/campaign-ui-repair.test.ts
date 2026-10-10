import { describe, expect, it, vi } from 'vitest';
import Phaser from 'phaser';
import { CampaignScene } from '../src/game/scenes/CampaignScene.ts';
import { handleViewportPointerUp, ViewportMaskController } from '../src/game/ui/ViewportMask.ts';

vi.mock('phaser', () => ({
  default: {
    Scene: class {},
    Display: { Masks: { GeometryMask: class { constructor(readonly scene: unknown, readonly source: unknown) {} } } }
  }
}));

function maskFixture(webgl: boolean) {
  const source = {
    visible: true,
    clear: vi.fn().mockReturnThis(),
    fillStyle: vi.fn().mockReturnThis(),
    fillRect: vi.fn().mockReturnThis(),
    destroy: vi.fn()
  };
  const filter = { autoUpdate: true, setGameObject: vi.fn() };
  const external = { addMask: vi.fn(() => filter), remove: vi.fn() };
  const camera = {};
  const target = {
    enableFilters: vi.fn(), filters: webgl ? { external } : null,
    setMask: vi.fn(), clearMask: vi.fn()
  };
  const scene = { make: { graphics: vi.fn(() => source) }, cameras: { main: camera } };
  return { scene, target, source, filter, external, camera };
}

describe('viewport mask controller', () => {
  it('uses one external parent-space WebGL filter and refreshes its source without accumulation', () => {
    const fixture = maskFixture(true);
    const controller = new ViewportMaskController(fixture.scene as never, fixture.target as never, { x: 16, y: 32, width: 400, height: 280 });

    expect(fixture.scene.make.graphics).toHaveBeenCalledWith({ x: 0, y: 0 }, false);
    expect(fixture.source.visible).toBe(true);
    expect(fixture.source.fillRect).toHaveBeenNthCalledWith(1, 16, 32, 400, 280);
    expect(fixture.external.addMask).toHaveBeenCalledWith(fixture.source, false, fixture.camera, 'world');
    expect(fixture.filter.autoUpdate).toBe(false);
    expect(fixture.filter.setGameObject).toHaveBeenCalledWith(fixture.source);
    expect(fixture.target.setMask).not.toHaveBeenCalled();

    controller.refresh({ x: 20, y: 40, width: 360, height: 240 });
    controller.refresh({ x: 24, y: 42, width: 350, height: 230 });
    expect(fixture.external.addMask).toHaveBeenCalledTimes(1);
    expect(fixture.filter.setGameObject).toHaveBeenCalledTimes(3);
    expect(fixture.source.fillRect).toHaveBeenLastCalledWith(24, 42, 350, 230);

    controller.destroy();
    controller.destroy();
    expect(fixture.external.remove).toHaveBeenCalledTimes(1);
    expect(fixture.external.remove).toHaveBeenCalledWith(fixture.filter, true);
    expect(fixture.source.destroy).toHaveBeenCalledTimes(1);
  });

  it('preserves the Canvas GeometryMask path and cleans it up', () => {
    const fixture = maskFixture(false);
    const controller = new ViewportMaskController(fixture.scene as never, fixture.target as never, { x: 10, y: 20, width: 100, height: 80 });
    const canvasMask = fixture.target.setMask.mock.calls[0][0];

    expect(canvasMask).toBeInstanceOf(Phaser.Display.Masks.GeometryMask);
    expect(canvasMask).toMatchObject({ scene: fixture.scene, source: fixture.source });
    expect(fixture.external.addMask).not.toHaveBeenCalled();
    controller.destroy();
    expect(fixture.target.clearMask).toHaveBeenCalledWith(true);
    expect(fixture.source.destroy).toHaveBeenCalledTimes(1);
  });

  it('ignores pointerup on visually clipped map nodes outside the fixed viewport', () => {
    const action = vi.fn(), stopPropagation = vi.fn();
    const bounds = { x: 16, y: 70, width: 328, height: 220 };

    expect(handleViewportPointerUp(bounds, { x: 12, y: 90 }, { stopPropagation }, action)).toBe(false);
    expect(handleViewportPointerUp(bounds, { x: 344, y: 290 }, { stopPropagation }, action)).toBe(false);
    expect(action).not.toHaveBeenCalled();
    expect(stopPropagation).toHaveBeenCalledTimes(2);
    expect(handleViewportPointerUp(bounds, { x: 20, y: 90 }, { stopPropagation }, action)).toBe(true);
    expect(action).toHaveBeenCalledTimes(1);
  });
});

describe('fully unlocked Codex spacing', () => {
  it('places boss stats after measured wrapped descriptions with the existing gap', () => {
    const rows: Array<{ y: number; value: string; height: number }> = [];
    const wrappedBossDescriptions = new Set([
      'Temporary damage ward; summons Marchlings at half health; quickens below 25% health.',
      'Resists slowing and telegraphs temporary tower freezes; later freezes can catch two towers.'
    ]);
    const sheet = {
      text: vi.fn((y: number, value: string) => {
        const height = wrappedBossDescriptions.has(value) ? 54 : 18;
        rows.push({ y, value, height });
        return { height };
      })
    };
    const scene = Object.create(CampaignScene.prototype) as any;
    scene.campaignView = {
      totalMasteryStars: 90,
      profile: { unlockedFeatures: [
        'aether_codex_tactics', 'advanced_codex_stats', 'hollow_warden_codex_entry',
        'cinder_colossus_codex_entry', 'frostbound_matriarch_codex_entry'
      ] }
    };
    scene.makeSheet = vi.fn(() => sheet);

    scene.openCodex();

    for (const description of wrappedBossDescriptions) {
      const index = rows.findIndex(row => row.value === description);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(rows[index + 1].value).toMatch(/^HP /);
      expect(rows[index + 1].y).toBeGreaterThanOrEqual(rows[index].y + rows[index].height + 22);
    }
  });
});
