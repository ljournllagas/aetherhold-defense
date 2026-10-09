import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameScene } from '../src/game/scenes/GameScene.ts';
import { SoundManager } from '../src/game/systems/SoundManager.ts';
import { UnlockRepository } from '../src/game/systems/UnlockSystem.ts';
import type { BranchId } from '../src/shared/progression.ts';

vi.mock('phaser', () => ({ default: { Scene: class { constructor(_key?: string) {} }, Scenes: { Events: { SHUTDOWN: 'shutdown' } }, Scale: { Events: { RESIZE: 'resize' } } } }));
function anyStub(): any {
  const proxy: any = new Proxy(function () { return proxy; }, { get: (_t, key) => (key === 'then' ? undefined : key === Symbol.toPrimitive ? () => 0 : proxy), apply: () => proxy });
  return proxy;
}
interface Run {
  achievementNotices: Array<{ branchId: BranchId; remainingMs: number }>; achievementNoticeView: unknown; unlocksEarnedThisRun: BranchId[]; unlockRepository: UnlockRepository;
  handleResize(): void; notifyAchievements(): void; updateAchievementNotices(ms: number): void;
}
const SHELL = ['applyView', 'drawHUD', 'drawTowerPanel', 'drawControls', 'drawPowerupBar', 'drawBossBar', 'refreshInfoPanel', 'refreshPlacePanel', 'updateNextPreview', 'updateHUD', 'drawSheet', 'showTouchPreview', 'drawBackgroundPause', 'renderVictory'];
function sceneFixture() {
  vi.spyOn(SoundManager, 'get').mockReturnValue(anyStub());
  const scene = new GameScene(); scene.init({ difficulty: 'medium' });
  const run = scene as unknown as Run, loose = scene as unknown as Record<string, unknown>;
  for (const name of SHELL) loose[name] = () => {};
  const text = vi.fn((..._args: unknown[]) => anyStub());
  loose.add = { container: () => anyStub(), text }; loose.make = anyStub(); loose.scale = { width: 844, height: 390 };
  run.unlockRepository = new UnlockRepository(null, () => '2026-10-08T00:00:00Z'); run.unlockRepository.earn(['volley']); run.unlocksEarnedThisRun = ['volley'];
  run.handleResize();
  return { run, text };
}
const noticeDraws = (text: { mock: { calls: unknown[][] } }) => text.mock.calls.filter((args) => String(args[2]).startsWith('Unlocked: Volley')).length;
afterEach(() => vi.restoreAllMocks());

describe('achievement notice across resize', () => {
  it('redraws the active notice after a resize and keeps its remaining time', () => {
    const { run, text } = sceneFixture();
    run.notifyAchievements(); run.updateAchievementNotices(1200);
    expect(noticeDraws(text)).toBe(1);
    run.handleResize();
    expect(noticeDraws(text)).toBe(2);
    expect(run.achievementNoticeView).toBe(text.mock.results[text.mock.results.length - 1].value);
    expect(run.achievementNotices).toEqual([{ branchId: 'volley', remainingMs: 1800 }]);
  });
  it('does not enqueue a duplicate and draws nothing after the notice expired', () => {
    const { run, text } = sceneFixture();
    run.notifyAchievements(); run.handleResize(); run.notifyAchievements();
    expect(run.achievementNotices).toHaveLength(1);
    run.updateAchievementNotices(3000);
    expect([run.achievementNotices, run.achievementNoticeView]).toEqual([[], null]);
    const draws = noticeDraws(text); run.handleResize();
    expect(noticeDraws(text)).toBe(draws);
  });
});
