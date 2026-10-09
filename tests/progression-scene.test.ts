import { describe, expect, it, vi } from 'vitest';
const ui = vi.hoisted(() => {
  function anyStub(): any {
    const proxy: any = new Proxy(function () { return proxy; }, { get: (_t, key) => (key === 'then' ? undefined : key === Symbol.toPrimitive ? () => 0 : proxy), apply: () => proxy });
    return proxy;
  }
  return { anyStub, start: vi.fn(), buttons: [] as Array<{ label: string; action: () => void }> };
});
vi.mock('phaser', () => ({ default: {
  Scene: class { add = ui.anyStub(); input = ui.anyStub(); game = ui.anyStub(); scale = { width: 1280, height: 720, on: () => undefined, off: () => undefined }; events = { once: () => undefined }; scene = { start: ui.start, restart: () => undefined }; constructor(_key?: string) {} },
  Scenes: { Events: { SHUTDOWN: 'shutdown' } }, Scale: { Events: { RESIZE: 'resize' } } } }));
vi.mock('../src/game/ui/components.ts', () => ({ button: (_s: unknown, _p: unknown, _x: number, _y: number, _w: number, label: string, action: () => void) => { ui.buttons.push({ label, action }); return { box: ui.anyStub(), text: ui.anyStub() }; }, panel: () => ui.anyStub(), statRow: () => undefined, etchedFrame: () => ui.anyStub() }));
import { ProgressionScene, progressionPanelLines } from '../src/game/scenes/ProgressionScene.ts';
import { UnlockRepository } from '../src/game/systems/UnlockSystem.ts';

const best = (score: number, scoreVersion: number) => ({ score, wave: 12, difficulty: 'medium', date: '2026-10-08T00:00:00.000Z', scoreVersion });
describe('progression panel', () => {
  it('lists achievements, saved state, both branches and both bests without run qualification', () => {
    const repo = new UnlockRepository(null, () => '2026-10-08T00:00:00Z'); repo.earn(['volley']);
    const lines = progressionPanelLines(repo.view(), best(900, 2), best(100000, 1));
    expect(lines[0]).toBe(repo.view().warning);
    expect(lines).toEqual(expect.arrayContaining([
      'Ranger: Marksman (starter) / Volley',
      'Unlocked · not saved · Keep a Marksman tower at evolution rank 2 or higher when wave 20 is completed.',
      'Locked · Keep a Siegebreaker tower at evolution rank 2 or higher when wave 20 is completed.',
      'Personal best · 900 pts', 'Legacy best · 100,000 pts'
    ]));
    expect(lines.some((l) => l.includes('On track'))).toBe(false);
    expect(progressionPanelLines(new UnlockRepository(null).view(), null, null)).toContain('Personal best · none yet');
  });
  it('returns to the main menu', () => {
    new ProgressionScene().create();
    ui.buttons.find((b) => b.label === 'Back')!.action();
    expect(ui.start).toHaveBeenCalledWith('MainMenu');
  });
});
