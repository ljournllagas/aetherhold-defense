import { expect, it } from 'vitest';
import { TOWER_IDS } from '../src/game/config/towers.ts';
import {
  formatSlowDetail,
  towerBuildDetail,
  towerDetailCostLine,
  towerDetailSpecialLine,
  towerDetailStatsLine,
} from '../src/game/ui/towerDetails.ts';

it('covers every tower with L1 stats, description and role', () => {
  expect(TOWER_IDS).toHaveLength(7);
  for (const id of TOWER_IDS) {
    const detail = towerBuildDetail(id);
    expect(detail).not.toBeNull();
    expect(detail!.name.length).toBeGreaterThan(0);
    expect(detail!.role.length).toBeGreaterThan(0);
    expect(detail!.description.length).toBeGreaterThan(0);
    expect(detail!.cost).toBeGreaterThan(0);
    expect(detail!.totalToMax).toBeGreaterThanOrEqual(detail!.cost);
    expect(towerDetailStatsLine(detail!)).toContain('Damage');
  }
});

it('renders slow with duration instead of percent alone', () => {
  expect(formatSlowDetail(0.35, 1.6)).toBe('35% for 1.6s');
  const glacier = towerBuildDetail('glacier')!;
  expect(glacier.slow).toBe('35% for 1.6s');
  expect(towerDetailSpecialLine(glacier)).toContain('Slow 35% for 1.6s');
});

it('renders splash and chain specials', () => {
  expect(towerDetailSpecialLine(towerBuildDetail('ember')!)).toContain('Splash');
  expect(towerDetailSpecialLine(towerBuildDetail('tempest')!)).toContain('Chain 3');
});

it('gates the cost line on gold with a total-to-max hint', () => {
  const detail = towerBuildDetail('longbow')!;
  expect(detail.totalToMax).toBe(100 + 90 + 180 + 340);
  expect(towerDetailCostLine(detail, 10000)).toEqual({
    text: '100 gold · Total to max 710 gold',
    affordable: true,
  });
  const broke = towerDetailCostLine(detail, 0);
  expect(broke.affordable).toBe(false);
  expect(broke.text).toContain('Need 100 more');
});

it('returns null for unknown towers', () => {
  expect(towerBuildDetail('cannon')).toBeNull();
});
