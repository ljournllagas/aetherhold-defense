import {afterEach,expect,it,vi} from 'vitest';
import {saveBest,loadBest,setBestAccount,accountBestWarning} from '../src/game/systems/Settings.ts';
import {applyCloudProgress} from '../src/game/systems/AccountProgress.ts';
import {emptyCloudProgress} from '../src/shared/cloudProgress.ts';
afterEach(()=>{setBestAccount(null);vi.unstubAllGlobals();});
it('retains account personal best in memory and exposes a failed local save',()=>{
  vi.stubGlobal('localStorage',{getItem:()=>null,setItem:()=>{throw new Error('quota');}});setBestAccount({playerId:'a',generation:'g'});
  saveBest({score:100,wave:2,difficulty:'medium',date:'2026-10-11T00:00:00Z'});
  expect(loadBest()?.score).toBe(100);expect(accountBestWarning()).toContain('session');
  setBestAccount({playerId:'b',generation:'g'});expect(loadBest()).toBeNull();
});
it('can display a cloud personal best when localStorage is absent',()=>{
  vi.stubGlobal('localStorage',undefined);setBestAccount({playerId:crypto.randomUUID(),generation:'g'});const progress=emptyCloudProgress();progress.bests=[{score:300,wave:5,difficulty:'medium',date:'2026-10-11T00:00:00Z',scoreVersion:3}];applyCloudProgress(progress);expect(loadBest()?.score).toBe(300);
});
