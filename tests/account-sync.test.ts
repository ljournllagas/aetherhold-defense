import {expect,it,vi} from 'vitest';
import {AccountSync,retryDelay} from '../src/game/systems/AccountSync.ts';
it('backs off and respects server retry after',()=>{expect(retryDelay(0,0,()=>0.5)).toBe(2000);expect(retryDelay(99,90000,()=>0.5)).toBe(90000);});
it('pauses authentication failures instead of repeatedly submitting',async()=>{
  vi.useFakeTimers();const send=vi.fn(async()=>({ok:false as const,code:'AUTH_REQUIRED',message:'login',status:401}));const sync=new AccountSync(send);await sync.flush({playerId:'a',generation:'g'});await vi.advanceTimersByTimeAsync(100000);expect(send).toHaveBeenCalledTimes(1);sync.stop();vi.useRealTimers();
});
