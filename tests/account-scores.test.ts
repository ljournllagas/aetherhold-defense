import { expect,it } from 'vitest';
import { canonicalResult } from '../worker/accountScores.ts';
it('ignores client nickname while comparing immutable score data',()=>{
  const p={runId:'run-test-123',playerName:'Old',difficulty:'easy',highestWave:1,finalScore:100,enemiesKilled:1,bossesKilled:0,remainingLives:0,gameDurationSeconds:10,gameVersion:'0.3.0',scoreVersion:3,wavesCompleted:0,outcome:'defeat',siegeBossesDefeated:0};
  expect(canonicalResult({mode:'classic',payload:p})).toBe(canonicalResult({mode:'classic',payload:{...p,playerName:'New'}}));
  expect(canonicalResult({mode:'classic',payload:{...p,finalScore:101}})).not.toBe(canonicalResult({mode:'classic',payload:p}));
});
