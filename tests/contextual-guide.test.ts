import {expect,it} from 'vitest';
import {ContextualGuide,localGuide} from '../src/game/systems/ContextualGuide.ts';
it('Help replay resets the guide already held by gameplay even without storage',()=>{
 const game=localGuide();game.skip();expect(game.shouldShow('placement')).toBe(false);
 localGuide().replay();expect(game.shouldShow('placement')).toBe(true);
});
it('unavailable storage falls back to session and replay never touches progress',()=>{
 const g=new ContextualGuide({getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}});
 expect(g.shouldShow('placement')).toBe(true);g.complete('placement');expect(g.shouldShow('placement')).toBe(false);
 g.replay();expect(g.shouldShow('placement')).toBe(true);g.skip();expect(g.shouldShow('upgrade')).toBe(false);
});
it('guide completion is per device with a separate key',()=>{
 const values=new Map<string,string>();const storage={getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>{values.set(key,value);}};
 const g=new ContextualGuide(storage);g.complete('placement');
 expect(new ContextualGuide(storage).shouldShow('placement')).toBe(false);
 expect(new ContextualGuide(null).shouldShow('placement')).toBe(true);
 expect([...values.keys()]).toEqual(['aetherhold-ui-guide-v1']);
});
