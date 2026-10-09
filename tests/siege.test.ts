import { describe, expect, it } from 'vitest';
import { SiegeSystem, victoryRewardChoices, victoryRewardsResolved } from '../src/game/systems/SiegeSystem.ts';
import { RelicVault } from '../src/game/systems/RunSimulation.ts';

const clear = (wave: number, lives = 10) => ({ wave, lives, spawns: 0, enemies: 0, flights: 0, fields: 0 });
function advanceSiege(to: number): SiegeSystem {
  const siege = new SiegeSystem();
  for (let wave = 1; wave <= to; wave++) { siege.startWave(wave); if (wave % 10 === 0) siege.bossKilled(wave); siege.completeWave(clear(wave)); }
  return siege;
}

describe('siege lifecycle', () => {
  it('runs 30 waves into the victory decision, then endless once', () => {
    const siege = new SiegeSystem();
    for (let wave = 1; wave <= 30; wave++) {
      expect(siege.startWave(wave)).toBe(true);
      if (wave === 10 || wave === 30) siege.bossKilled(wave);
      expect(siege.completeWave(clear(wave))).toBe(wave === 30 ? 'victory' : 'wave-cleared');
    }
    expect(siege.startWave(31)).toBe(false);
    expect(siege.choose('continue', false)).toBe(false);
    expect(siege.choose('continue', true)).toBe(true);
    expect(siege.choose('continue', true)).toBe(false);
    expect(siege.startWave(31)).toBe(true);
  });
  it.each([10, 30])('fails the siege when the wave-%i boss escapes with lives left', (wave) => {
    const siege = advanceSiege(wave - 1); siege.startWave(wave);
    expect(siege.bossEscaped(wave, 10)).toBe('siege-failed');
    expect(siege.fail('siege-failed')).toBe(true);
    expect(siege.progress()).toMatchObject({ highestWave: wave, wavesCompleted: wave - 1, outcome: 'siege-failed' });
  });
  it('applies normal rules to the wave-20 boss and defeat at zero lives', () => {
    expect(advanceSiege(19).bossEscaped(20, 10)).toBe(null);
    const s = advanceSiege(9); s.startWave(10); expect(s.bossEscaped(10, 0)).toBe('defeat');
  });
  it.each(['spawns', 'enemies', 'flights', 'fields'] as const)('waits for %s after the final boss dies', (count) => {
    const siege = advanceSiege(29); siege.startWave(30); siege.bossKilled(30);
    expect(siege.completeWave({ ...clear(30), [count]: 1 })).toBe('none');
    expect(siege.completeWave(clear(30))).toBe('victory');
    expect(siege.completeWave(clear(30))).toBe('none');
  });
  it('prefers defeat when lives reach zero at wave 30', () => {
    const siege = advanceSiege(29); siege.startWave(30); siege.bossKilled(30);
    expect(siege.completeWave(clear(30, 0))).toBe('none');
    siege.fail('defeat'); expect(siege.progress().outcome).toBe('defeat');
  });
  it('opens evolution only from the wave-10 bit', () => {
    const s = new SiegeSystem(); s.bossKilled(7); expect(s.evolutionOpen).toBe(false);
    s.bossKilled(10); s.bossKilled(10); expect([s.evolutionOpen, s.siegeBossesDefeated]).toEqual([true, 1]);
  });
  it('accepts only the next wave and completes each wave once', () => {
    const s = new SiegeSystem();
    expect(s.startWave(2)).toBe(false); expect(s.startWave(1)).toBe(true); expect(s.startWave(2)).toBe(false);
    expect(s.completeWave(clear(2))).toBe('none'); expect(s.completeWave(clear(1))).toBe('wave-cleared'); expect(s.completeWave(clear(1))).toBe('none');
  });
  it('finishes a victory once and records an endless defeat cumulatively', () => {
    const won = advanceSiege(30);
    expect(won.choose('finish', true)).toBe(true); expect(won.choose('finish', true)).toBe(false); expect(won.fail('defeat')).toBe(false);
    expect(won.progress()).toEqual({ highestWave: 30, wavesCompleted: 30, outcome: 'victory', siegeBossesDefeated: 7 });
    const endless = advanceSiege(30); endless.choose('continue', true); endless.startWave(31);
    expect(endless.fail('defeat')).toBe(true);
    expect(endless.progress()).toEqual({ highestWave: 31, wavesCompleted: 30, outcome: 'defeat', siegeBossesDefeated: 7 });
  });
  it('creates no result before the first wave', () => {
    const s = new SiegeSystem(); expect(s.fail('defeat')).toBe(false); expect(s.phase).toBe('siege'); expect(() => s.progress()).toThrow();
  });
  it('seeds QA progress explicitly', () => {
    const s = new SiegeSystem(); s.seedForQA(24, 3);
    expect(s).toMatchObject({ phase: 'siege', wavesCompleted: 24, highestWave: 24, siegeBossesDefeated: 3 });
    expect(s.startWave(25)).toBe(true);
    const v = new SiegeSystem(); v.seedForQA(30, 7, 'victory'); expect(v.phase).toBe('victory');
  });
});

describe('victory relic exits', () => {
  it('resolves a full inventory in FIFO order without activation', () => {
    const vault = new RelicVault(); vault.stored.push('meteor_strike', 'treasure_goblin', 'emergency_repair');
    vault.offer('battle_cry', 'boss', true); vault.offer('arcane_surge', 'second', true);
    expect(victoryRewardChoices(3)).toEqual(['replace-oldest', 'discard-new']);
    expect(victoryRewardsResolved(vault, false)).toBe(false);
    expect(vault.resolve('replace-oldest')).toBe(true); expect(vault.pending).toHaveLength(1);
    expect(vault.resolve('discard-new')).toBe(true); expect(vault.resolve('discard-new')).toBe(false);
    expect(victoryRewardsResolved(vault, false)).toBe(true); expect(victoryRewardsResolved(vault, true)).toBe(false);
    expect(vault.stored).toEqual(['treasure_goblin', 'emergency_repair', 'battle_cry']);
  });
  it('offers Store and Discard New while space remains', () => {
    expect(victoryRewardChoices(0)).toEqual(['store', 'discard-new']); expect(victoryRewardChoices(2)).toEqual(['store', 'discard-new']);
  });
  it('cancels a Meteor target without consuming the reserved relic', () => {
    const vault = new RelicVault(); vault.stored.push('meteor_strike'); vault.beginUse(0, true);
    vault.offer('battle_cry', 'boss', true);
    expect(victoryRewardsResolved(vault, false)).toBe(false);
    vault.cancelTarget();
    expect([vault.target, vault.stored, vault.pending.length]).toEqual([null, ['meteor_strike'], 1]);
  });
});

it('permits retained pending rewards only when requested, never a target or dialog', () => {
  const v=new RelicVault(); v.offer('meteor_strike','held',true);
  expect(victoryRewardsResolved(v,false)).toBe(false);
  expect(victoryRewardsResolved(v,false,true)).toBe(true);
  expect(victoryRewardsResolved(v,true,true)).toBe(false);
  v.beginPendingUse(true);
  expect(victoryRewardsResolved(v,false,true)).toBe(false);
});
