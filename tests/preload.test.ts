import { afterEach, expect, it, vi } from 'vitest';
import { EventEmitter } from 'eventemitter3';
vi.mock('phaser', () => ({ default: { Scene: class {}, Scenes: { Events: { SHUTDOWN: 'shutdown' } }, Scale: { Events: { RESIZE: 'resize' } } } }));
vi.mock('../src/game/art/artkit.ts', () => ({ ensureMenuTextures: vi.fn(), ensureArtTextures: vi.fn() }));
vi.mock('../src/game/art/towerArt.ts', () => ({ ensureTowerPortraits: vi.fn() }));
import { PreloadScene } from '../src/game/scenes/PreloadScene.ts';
import { requiredAssets, requiredAssetsForRequest } from '../src/game/art/assetManifest.ts';
import { campaignRepository } from '../src/game/campaign/progress.ts';
import { ensureArtTextures, ensureMenuTextures } from '../src/game/art/artkit.ts';
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
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
  return { scene, loose, loaded, queued, load, start, timers, activate: () => { active = true; }, deactivate: () => { active = false; }, stop: () => { active = false; loose.events.emit('shutdown'); } };
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
it('keeps campaign failure, readiness, and retry scoped to the selected family and tier', async () => {
  const f = loaderFixture();
  const data = { difficulty: 'medium' as const, playerName: 'Scoped', mode: 'campaign' as const, campaignLevel: 1, campaignVisualTier: 2 as const };
  const required = requiredAssetsForRequest('gameplay', data);
  const family = required.find(asset => asset.key === 'campaign_borderkeep_a')!;
  for (const asset of required) if (asset.key !== family.key) f.loaded.add(asset.key);

  f.scene.init({ stage: 'gameplay', destination: 'Game', data }); f.scene.preload();
  expect(f.queued).toEqual([family.key]);
  f.load.emit('loaderror', { key: 'campaign_borderkeep_b' });
  expect(f.loose.state).toBe('loading');
  f.load.emit('loaderror', { key: family.key });
  f.scene.create();
  expect(f.loose.state).toBe('failed');
  expect(f.start).not.toHaveBeenCalled();

  f.queued.length = 0; f.loose.retryLoading();
  expect(f.queued).toEqual([family.key]);
  f.load.emit('complete');
  expect(f.loose.state).toBe('failed');
  expect(f.start).not.toHaveBeenCalled();

  f.queued.length = 0; f.loose.retryLoading();
  f.loaded.add(family.key); f.load.emit('complete');
  expect(f.start).toHaveBeenCalledWith('Game', data);
});
it('snapshots the effective production tier once for a campaign loading request', () => {
  const view = vi.spyOn(campaignRepository, 'view').mockReturnValue({ unlockedFeatures: ['tower_visual_tier_ii'] } as any);
  const f = loaderFixture();
  f.scene.init({ stage: 'gameplay', destination: 'Game', data: { difficulty: 'medium', playerName: 'Snapshot', mode: 'campaign', campaignLevel: 1 } });
  expect(f.loose.request.data.campaignVisualTier).toBe(2);
  view.mockReturnValue({ unlockedFeatures: ['tower_visual_tier_iii'] } as any);
  expect(f.loose.required.filter((asset: { path: string }) => asset.path.includes('/assets/campaign/towers/')).every((asset: { path: string }) => asset.path.includes('-tier2-'))).toBe(true);
  expect(f.loose.request.data.campaignVisualTier).toBe(2);
});
it.each([1, 2, 3] as const)('snapshots DEV campaign fixture tier %i before preload selection', visualTier => {
  const f = loaderFixture();
  f.scene.init({ stage: 'gameplay', destination: 'Game', data: {
    difficulty: 'medium', playerName: 'QA tier', mode: 'campaign', campaignLevel: 1,
    qaCampaignFixture: { state: 'campaign', level: 1, bossPhase: 'initial', visualTier }
  } });
  expect(f.loose.request.data.campaignVisualTier).toBe(visualTier);
  expect(f.loose.required.filter((asset: { path: string }) => asset.path.includes('/assets/campaign/towers/')).map((asset: { path: string }) => asset.path)).toEqual(
    visualTier === 1 ? [] : ['longbow', 'ember', 'glacier', 'starfire', 'tempest'].map(id => `/assets/campaign/towers/${id}-tier${visualTier}-v1.png`)
  );
});
it('uses the isolated seeded tier for a DEV boss fixture without an explicit override', () => {
  const f = loaderFixture();
  f.scene.init({ stage: 'gameplay', destination: 'Game', data: {
    difficulty: 'medium', playerName: 'QA boss', mode: 'campaign', campaignLevel: 30,
    qaCampaignFixture: { state: 'campaign-boss', level: 30, bossPhase: 'initial' }
  } });
  expect(f.loose.request.data.campaignVisualTier).toBe(3);
  expect(f.loose.required.filter((asset: { path: string }) => asset.path.includes('/assets/campaign/towers/')).map((asset: { path: string }) => asset.path)).toEqual(
    ['longbow', 'ember', 'glacier', 'starfire', 'tempest'].map(id => `/assets/campaign/towers/${id}-tier3-v1.png`)
  );
});
it('does not request campaign art for classic or GameOver loading', () => {
  for (const request of [
    { stage: 'gameplay' as const, destination: 'Game' as const, data: { difficulty: 'medium' as const, playerName: 'Classic' } },
    { stage: 'gameplay' as const, destination: 'GameOver' as const, data: { runId: 'terminal-retained-0001', finalScore: 123 } as any },
    { stage: 'defeat' as const, destination: 'GameOver' as const, data: { runId: 'terminal-retained-0001', finalScore: 123 } as any }
  ]) {
    const f = loaderFixture(); f.scene.init(request); f.scene.preload();
    expect(f.queued.some(key => key.startsWith('campaign_'))).toBe(false);
  }
});
it('reuses warm campaign family and tier assets without queueing files', () => {
  const f = loaderFixture(), data = { difficulty: 'hard' as const, playerName: 'Warm', mode: 'campaign' as const, campaignLevel: 1, campaignVisualTier: 3 as const };
  for (const asset of requiredAssetsForRequest('gameplay', data)) f.loaded.add(asset.key);
  f.scene.init({ stage: 'gameplay', destination: 'Game', data }); f.scene.preload(); f.scene.create();
  expect(f.queued).toEqual([]);
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
it('waits for campaign-stage readiness, retries only missing menu art, and skips gameplay derivation', () => {
  vi.clearAllMocks();
  const f = loaderFixture(), missing = requiredAssets('campaign')[0];
  f.scene.init({ stage: 'campaign', destination: 'Campaign' }); f.scene.preload();
  for (const asset of requiredAssets('campaign').slice(1)) f.loaded.add(asset.key);
  f.load.emit('loaderror', { key: missing.key }); f.scene.create();
  expect(f.start).not.toHaveBeenCalled();

  f.queued.length = 0; f.loose.retryLoading();
  expect(f.queued).toEqual([missing.key]);
  f.loaded.add(missing.key); f.load.emit('complete');
  expect(f.start).toHaveBeenCalledWith('Campaign', undefined);
  expect(ensureMenuTextures).toHaveBeenCalledTimes(1);
  expect(ensureArtTextures).not.toHaveBeenCalled();
});
it('enters Campaign from warm menu-stage cache without queueing', () => {
  const f = loaderFixture(); for (const asset of requiredAssets('campaign')) f.loaded.add(asset.key);
  f.scene.init({ stage: 'campaign', destination: 'Campaign' }); f.scene.preload(); f.scene.create();
  expect(f.queued).toEqual([]);
  expect(f.start).toHaveBeenCalledWith('Campaign', undefined);
});
it('transitions after create even though Phaser marks the scene running only afterwards', () => {
  // SceneManager.create calls scene.create() and assigns CONST.RUNNING after it returns,
  // so a synchronous isActive('Preload') guard is false during create in a real game.
  const f = loaderFixture();
  for (const asset of requiredAssets('gameplay')) f.loaded.add(asset.key);
  const data = { difficulty: 'medium' as const, playerName: 'Late Active' };
  f.scene.init({ stage: 'gameplay', destination: 'Game', data });
  f.scene.preload();
  f.deactivate();
  f.scene.create();
  expect(f.start).not.toHaveBeenCalled();
  f.activate();
  for (const timer of f.timers) timer();
  expect(f.start).toHaveBeenCalledTimes(1);
  expect(f.start).toHaveBeenCalledWith('Game', data);
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
