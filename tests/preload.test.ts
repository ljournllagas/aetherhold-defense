import { afterEach, expect, it, vi } from 'vitest';
import { EventEmitter } from 'eventemitter3';
vi.mock('phaser', () => ({ default: { Scene: class {}, Scenes: { Events: { SHUTDOWN: 'shutdown' } }, Scale: { Events: { RESIZE: 'resize' } } } }));
vi.mock('../src/game/art/artkit.ts', () => ({ ensureMenuTextures: vi.fn(), ensureArtTextures: vi.fn() }));
vi.mock('../src/game/art/towerArt.ts', () => ({ ensureTowerPortraits: vi.fn() }));
import { PreloadScene } from '../src/game/scenes/PreloadScene.ts';
import { requiredAssets } from '../src/game/art/assetManifest.ts';
afterEach(() => vi.unstubAllGlobals());
function loaderFixture() {
  const scene = new PreloadScene();
  const loose = scene as unknown as Record<string, any>;
  const loaded = new Set<string>(), queued: string[] = [], timers: Array<() => void> = [];
  const load = Object.assign(new EventEmitter(), {
    image: vi.fn((key: string) => { queued.push(key); }),
    spritesheet: vi.fn((key: string) => { queued.push(key); }), start: vi.fn()
  });
  let active = true;
  const start = vi.fn();
  loose.load = load; loose.events = new EventEmitter();
  loose.scale = { width: 390, height: 844, on: vi.fn(), off: vi.fn() };
  loose.textures = { exists: (key: string) => loaded.has(key), get: (key: string) => ({ has: () => loaded.has(key) }) };
  loose.scene = { isActive: () => active, start };
  loose.time = { delayedCall: (_ms: number, callback: () => void) => { timers.push(callback); return { remove: vi.fn() }; } };
  loose.drawLoading = vi.fn();
  vi.stubGlobal('document', { fonts: { ready: Promise.resolve() } });
  return { scene, loose, loaded, queued, load, start, timers, activate: () => { active = true; }, stop: () => { active = false; loose.events.emit('shutdown'); } };
}
it('waits through a failed atlas and retries only missing assets', async () => {
  const f = loaderFixture();
  const data = { difficulty: 'medium' as const, playerName: 'Jos\u00e9' };
  f.scene.init({ stage: 'gameplay', destination: 'Game', data });
  f.scene.preload();
  for (const asset of requiredAssets('gameplay')) if (asset.key !== 'enemy_walk_atlas_nature-v2') f.loaded.add(asset.key);
  f.load.emit('loaderror', { key: 'enemy_walk_atlas_nature-v2' });
  f.scene.create(); await Promise.resolve();
  expect(f.start).not.toHaveBeenCalled();
  f.queued.length = 0; f.loose.retryLoading();
  expect(f.queued).toEqual(['enemy_walk_atlas_nature-v2']);
  f.loaded.add('enemy_walk_atlas_nature-v2'); f.load.emit('complete');
  await Promise.resolve(); await Promise.resolve();
  expect(f.start).toHaveBeenCalledTimes(1);
  expect(f.start).toHaveBeenCalledWith('Game', data);
});
it('ignores fonts and timeout callbacks owned by a canceled request', async () => {
  let resolve!: () => void;
  const f = loaderFixture(); vi.stubGlobal('document', { fonts: { ready: new Promise<void>(r => { resolve = r; }) } });
  f.scene.init(); f.scene.preload(); for (const a of requiredAssets('menu')) f.loaded.add(a.key);
  f.scene.create(); const oldTimer = f.timers[0]; f.stop();
  f.activate(); f.scene.init({ stage: 'gameplay', destination: 'Game', data: { difficulty: 'hard', playerName: 'New' } }); f.scene.preload(); f.scene.create();
  resolve(); oldTimer?.(); await Promise.resolve(); await Promise.resolve();
  expect(f.start).not.toHaveBeenCalled();
});
it('never starts an incomplete menu and ignores repeated loading retry', async () => {
  const f = loaderFixture(); f.scene.init(); f.scene.preload();
  f.loose.retryLoading(); expect(f.queued).toHaveLength(6); f.scene.create();
  for (const timer of f.timers) timer(); await Promise.resolve(); expect(f.start).not.toHaveBeenCalled();
});
it('reuses warm cache without queueing and starts its destination once', async () => {
  const f = loaderFixture(); for (const a of requiredAssets('gameplay')) f.loaded.add(a.key);
  const data = { difficulty: 'hard' as const, playerName: 'Cached' };
  f.scene.init({ stage: 'gameplay', destination: 'Game', data }); f.scene.preload(); f.scene.create(); f.load.emit('complete');
  await Promise.resolve(); await Promise.resolve(); for (const timer of f.timers) timer();
  expect(f.queued).toEqual([]); expect(f.start).toHaveBeenCalledTimes(1); expect(f.start).toHaveBeenCalledWith('Game', data);
});
it('preserves the exact terminal result through a failed defeat asset retry', async () => {
  const f = loaderFixture(), data = { runId: 'terminal-retained-0001', finalScore: 123 } as any;
  f.scene.init({ stage: 'defeat', destination: 'GameOver', data }); f.scene.preload();
  for (const a of requiredAssets('gameplay')) f.loaded.add(a.key);
  f.load.emit('loaderror', { key: 'map_ancient_border_keep_defeated' }); f.scene.create();
  f.loose.retryLoading(); f.loaded.add('map_ancient_border_keep_defeated'); f.load.emit('complete');
  await Promise.resolve(); await Promise.resolve(); expect(f.start.mock.calls[0]).toEqual(['GameOver', data]); expect(f.start.mock.calls[0][1]).toBe(data);
});
it('canceling gameplay returns to the loaded menu and cannot start Game later', async () => {
  const f = loaderFixture(); f.scene.init({ stage: 'gameplay', destination: 'Game', data: { difficulty: 'medium', playerName: 'Cancel' } });
  f.scene.preload(); f.loose.returnToMenu(); f.stop();
  for (const a of requiredAssets('gameplay')) f.loaded.add(a.key); f.load.emit('complete');
  await Promise.resolve(); expect(f.start.mock.calls.map(call => call[0])).toEqual(['MainMenu']);
});
