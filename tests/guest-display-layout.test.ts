import {expect,it} from 'vitest';
import {campaignHeaderActions} from '../src/game/ui/campaignHeader.ts';
import {campaignResultActions} from '../src/game/ui/campaignResultActions.ts';
import {towerTrayCardLayout} from '../src/game/ui/towerTrayLayout.ts';
it('aligns Campaign header actions without overlapping title bounds',()=>{
 for(const width of [390,768,1440]){const h=campaignHeaderActions(width);expect(h.account.y+h.account.height/2).toBe(h.back.y+h.back.height/2);expect(h.account.x+h.account.width).toBeLessThan(h.back.x);expect(h.titleWidth).toBeGreaterThan(0);}
});
it('puts eligible next level first and omits it for defeat or final level',()=>{
 expect(campaignResultActions('victory',3,4,100)).toEqual(['next','restart','map']);expect(campaignResultActions('defeat',3,4,100)).toEqual(['restart','map']);expect(campaignResultActions('victory',100,100,100)).toEqual(['restart','map']);expect(campaignResultActions('victory',3,3,100)).toEqual(['restart','map']);
});
it('reserves two-line affordability space inside the card',()=>{
 const g=towerTrayCardLayout();for(const r of [g.portrait,g.cost,g.name,g.status]){expect(r.x).toBeGreaterThanOrEqual(0);expect(r.y).toBeGreaterThanOrEqual(0);expect(r.x+r.width).toBeLessThanOrEqual(g.width);expect(r.y+r.height).toBeLessThanOrEqual(g.height);}expect(g.status.height).toBeGreaterThanOrEqual(24);
});
