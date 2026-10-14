import { afterEach, expect, it, vi } from 'vitest';
import { GameScene } from '../src/game/scenes/GameScene.ts';
import { CampaignRepository, campaignRepository } from '../src/game/campaign/progress.ts';
import { SoundManager } from '../src/game/systems/SoundManager.ts';
import { campaignScoreMetadata } from '../src/shared/campaignScoring.ts';

vi.mock('phaser', () => ({ default: { Scene: class { constructor(_key?: string) {} }, Math: { Vector2: class { constructor(public x: number, public y: number) {} } }, Scenes: { Events: { SHUTDOWN: 'shutdown' } }, Scale: { Events: { RESIZE: 'resize' } } } }));
vi.mock('../src/game/art/towerArt.ts', () => ({ buildTowerVisual: () => anyStub(), decorateEvolution: () => {}, towerPortraitKey: () => 'tower' }));

function anyStub(): any {
  const proxy: any = new Proxy(function () { return proxy; }, { get: (_target, key) => key === 'then' ? undefined : key === Symbol.toPrimitive ? () => 0 : proxy, apply: () => proxy });
  return proxy;
}

const PRESENTATION = [
  'updateHUD', 'refreshInfoPanel', 'drawSheet', 'drawPowerupBar', 'refreshPlots', 'refreshPlacePanel', 'hideGhost', 'showBanner',
  'floatText', 'floatTextForEnemy', 'impactAt', 'impactBurst', 'startDeathAnim', 'drawCatalog', 'refreshTowerVisual', 'updateNextPreview',
  'renderVictory', 'renderCampaignResult', 'showTouchPreview', 'projectEntity', 'makeEnemyVisual', 'presentReward', 'updateBossBar',
  'updateDying', 'updateEffects', 'syncFieldViews', 'addEffect', 'drawTempestArc', 'publishQAStatus', 'renderFrame', 'closeModal'
];

function w4Run(): { run: any; repository: CampaignRepository } {
  const repository = new CampaignRepository(null);
  for (let level = 1; level < 40; level++) repository.recordClear(level, campaignScoreMetadata(level).perfectScore, 1);
  vi.spyOn(campaignRepository, 'view').mockImplementation(() => repository.view());
  vi.spyOn(SoundManager, 'get').mockReturnValue(anyStub());
  vi.spyOn(Math, 'random').mockReturnValue(0.99);
  const run: any = new GameScene();
  run.init({ mode: 'campaign', campaignLevel: 40, difficulty: 'hard', playerName: 'W4 lifecycle fixture' });
  for (const name of PRESENTATION) run[name] = () => {};
  run.add = anyStub();
  run.world = (object: unknown) => object;
  run.scene = { start: vi.fn(), restart: vi.fn() };
  return { run, repository };
}

afterEach(() => vi.restoreAllMocks());

it('treats the World 4 Hydra leak as a failed siege without awarding a clear', () => {
  const { run, repository } = w4Run();
  const recordClear = vi.spyOn(repository, 'recordClear');
  run.wave = run.campaign.waveCount;
  const hydra = run.spawnEnemy('mireheart_hydra', 1);

  expect(run.handleLeak(hydra)).toBe(true);
  expect(run.campaign.definition.level).toBe(40);
  expect(run.campaignResult).toMatchObject({ outcome: 'siege-failed', clear: null });
  expect(run.ended).toBe(true);
  expect(recordClear).not.toHaveBeenCalled();
});

it('retries World 4 on Level 40 and clears Hydra telegraph, summons, rewards, and run-local state', () => {
  const { run } = w4Run();
  const hydra = run.spawnEnemy('mireheart_hydra', 1);
  run.campaignBosses.register(hydra, 0);
  hydra.hp = hydra.maxHp * 0.5;
  run.campaignBosses.tick([hydra], [], 1000);
  expect(run.campaignBosses.presentation(hydra.id, 1000).telegraph).toBe(true);

  run.vault.stored = ['meteor_strike'];
  run.vault.beginUse(0, true);
  run.flights = [{ view: anyStub() }];
  run.effects = [{ view: anyStub() }];
  run.gameTimeMs = 1000;
  run.wave = 21;
  run.ended = true;

  run.restartRun();
  expect(run.scene.restart).toHaveBeenCalledWith(expect.objectContaining({ mode: 'campaign', campaignLevel: 40 }));
  run.init({ mode: 'campaign', campaignLevel: 40, difficulty: 'hard', playerName: 'W4 lifecycle fixture' });

  expect(run.campaign.definition.level).toBe(40);
  expect([run.gold, run.lives, run.wave, run.gameTimeMs, run.enemies.length, run.flights.length, run.effects.length, run.vault.stored.length, run.vault.target, run.ended]).toEqual([600, 20, 0, 0, 0, 0, 0, 0, null, false]);
  expect(run.campaignBosses.presentation(hydra.id, 5000)).toEqual({ phase: 1, telegraph: false, guarded: false });
  expect(run.campaignBosses.telegraphTargets()).toEqual([]);
});
