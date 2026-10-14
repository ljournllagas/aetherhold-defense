import {expect,it} from 'vitest';
import {enemyPresentation} from '../src/game/ui/enemyPresentation.ts';
it('uses responsive overview bands with proportional zoom',()=>{
 const base={fieldHeight:500,authoredDimension:28,isElite:false,isBoss:false,fitScale:.5};
 const desktop=enemyPresentation({...base,viewportWidth:1440,viewportHeight:900}),tablet=enemyPresentation({...base,viewportWidth:768,viewportHeight:1024}),phone=enemyPresentation({...base,viewportWidth:390,viewportHeight:844});
 expect(desktop.overviewDimension).toBe(32);expect(tablet.overviewDimension).toBe(28);expect(phone.overviewDimension).toBe(28);
 expect(desktop.localScale*.5*28).toBe(32);expect(desktop.localScale*.5*2*28).toBe(64);
 expect(enemyPresentation({...base,authoredDimension:50,viewportWidth:844,viewportHeight:390}).overviewDimension).toBe(30);
});
it('preserves boss size ordering even on tiny fields',()=>{
 const base={fieldHeight:60,authoredDimension:28,isElite:false,isBoss:false,fitScale:.5,viewportWidth:390,viewportHeight:844};
 expect(enemyPresentation(base).overviewDimension).toBeCloseTo(14.4);
 const boss=enemyPresentation({...base,isBoss:true,authoredDimension:96});expect(boss.overviewDimension).toBe(18);
 expect(enemyPresentation({...base,isElite:true,authoredDimension:50}).overviewDimension).toBeLessThan(boss.overviewDimension);
});
