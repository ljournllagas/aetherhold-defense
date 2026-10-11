import { expect,it } from 'vitest';
import { accountStatus } from '../src/game/ui/accountControls.ts';
it('requires both acknowledgements before reporting synced',()=>{
  expect(accountStatus({playMode:'account',progressSync:'pending',resultSync:'synced',pending:0,progressDirty:true,warning:null,state:'ready'})).toContain('Pending sync');
  expect(accountStatus({playMode:'account',progressSync:'synced',resultSync:'synced',pending:0,progressDirty:false,warning:null,state:'ready'})).toBe('Synced');
  expect(accountStatus({playMode:'account',progressSync:'synced',resultSync:'permanent',pending:1,progressDirty:false,warning:'invalid',state:'ready'})).not.toBe('Synced');
});
