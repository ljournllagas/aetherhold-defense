import { expect,it } from 'vitest';
import { parseProfileRow } from '../worker/accounts.ts';
import { emptyCloudProgress } from '../src/shared/cloudProgress.ts';
it('validates stored cloud versions before exposing profiles',()=>{
  const row={id:'a',generation:'g',nickname:'Warden',revision:1,progress_json:JSON.stringify(emptyCloudProgress())};
  expect(parseProfileRow(row)?.account).toEqual({playerId:'a',generation:'g'});
  expect(parseProfileRow({...row,progress_json:'{"version":99}'})).toBeNull();
});
