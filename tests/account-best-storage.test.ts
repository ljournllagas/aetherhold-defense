import {afterEach,expect,it,vi} from 'vitest';
import {saveBest,loadBest,setBestAccount,accountBestWarning} from '../src/game/systems/Settings.ts';
afterEach(()=>{setBestAccount(null);vi.unstubAllGlobals();});
it('retains account personal best in memory and exposes a failed local save',()=>{
  vi.stubGlobal('localStorage',{getItem:()=>null,setItem:()=>{throw new Error('quota');}});setBestAccount({playerId:'a',generation:'g'});
  saveBest({score:100,wave:2,difficulty:'medium',date:'2026-10-11T00:00:00Z'});
  expect(loadBest()?.score).toBe(100);expect(accountBestWarning()).toContain('session');
  setBestAccount({playerId:'b',generation:'g'});expect(loadBest()).toBeNull();
});
