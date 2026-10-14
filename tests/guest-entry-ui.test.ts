import {expect,it} from 'vitest';
import {accountStatus} from '../src/game/ui/accountControls.ts';
it('never presents guests as cloud-synced',()=>{
 const guest={playMode:'guest' as const,progressSync:'synced' as const,resultSync:'synced' as const,pending:0,progressDirty:false,warning:null,state:'signed-out' as const};
 expect(accountStatus(guest)).toMatch(/browser/i);expect(accountStatus(guest)).not.toBe('Synced');
 expect(accountStatus({...guest,warning:'Guest saves are available in this session only.'})).toMatch(/session only/i);
});
