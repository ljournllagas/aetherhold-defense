import {expect,it} from 'vitest';
import {formatQuantity,formatCount,formatPercent} from '../src/shared/displayNumbers.ts';
it('groups counts and renders bounded decimals without changing calculations',()=>{
 const range=214.50000000000003;
 expect(formatCount(12345)).toBe('12,345');
 expect(formatQuantity(range,1)).toBe('214.5');
 expect(formatQuantity(151.99999999999997,1)).toBe('152');
 expect(formatQuantity(.36000000000000004,2)).toBe('0.36');
 expect(formatQuantity(1,2)).toBe('1');
 expect(formatQuantity(-0,1)).toBe('0');
 expect(formatQuantity(-.001,2)).toBe('0');
 expect(formatQuantity(Infinity,1)).toBe('—');
 expect(formatQuantity(NaN,1)).toBe('—');
 expect(formatCount(null)).toBe('—');
 expect(formatPercent(12.500000000000002)).toBe('12.5%');
 expect(range).toBe(214.50000000000003);
});
