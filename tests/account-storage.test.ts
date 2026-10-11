import 'fake-indexeddb/auto';
import { expect,it } from 'vitest';
import { AccountStorage } from '../src/game/systems/AccountStorage.ts';
import type { RunResult } from '../src/shared/account.ts';
import { emptyCloudProgress } from '../src/shared/cloudProgress.ts';
const A={playerId:'a',generation:'g'},B={playerId:'b',generation:'g'};
const result=(runId:string):Extract<RunResult,{mode:'campaign'}>=>({mode:'campaign',payload:{runId,campaignVersion:1,progressionVersion:1,level:1,outcome:'victory',finalScore:100,remainingLives:10,gameDurationSeconds:20,gameVersion:'0.3.0'}});
it('retains multiple runs across instances and isolates account acknowledgements',async()=>{
  const name=crypto.randomUUID(),s=new AccountStorage(name),reopened=new AccountStorage(name);
  await s.enqueue({account:A,result:result('run-test-1'),status:'pending'});await s.enqueue({account:A,result:result('run-test-2'),status:'pending'});await s.enqueue({account:B,result:result('run-test-1'),status:'pending'});
  expect(await reopened.pending(A)).toHaveLength(2);await reopened.ack(A,result('run-test-1'));
  expect(await reopened.pending(A)).toHaveLength(1);expect(await reopened.pending(B)).toHaveLength(1);
  await s.close();await reopened.close();
});
it('claims guest saves atomically and keeps consumed ownership after purge',async()=>{
  const s=new AccountStorage(crypto.randomUUID()),snapshot={progress:emptyCloudProgress(),nickname:'Warden',result:null,warnings:[]};
  const claim=await s.claimGuest(A,snapshot);await expect(s.claimGuest(B,snapshot)).rejects.toThrow();
  await s.consumeGuest(claim.importId);await s.purge(A);
  expect((await s.readGuestClaim())?.consumed).toBe(true);await expect(s.claimGuest(B,snapshot)).rejects.toThrow();await s.close();
});
it('does not erase a changed record with an old acknowledgement',async()=>{
  const s=new AccountStorage(crypto.randomUUID()),r=result('run-test-1');await s.enqueue({account:A,result:r,status:'pending'});
  await expect(s.enqueue({account:A,result:{...r,payload:{...r.payload,finalScore:200}},status:'pending'})).rejects.toThrow();
  await s.ack(A,{...r,payload:{...r.payload,finalScore:300}});expect(await s.pending(A)).toHaveLength(1);await s.close();
});
