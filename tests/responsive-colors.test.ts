import {expect,it} from 'vitest';
import {C} from '../src/game/ui/tokens.ts';
function luminance(hex:string):number{
 const n=parseInt(hex.replace('#',''),16);
 const rgb=[n>>16&255,n>>8&255,n&255].map(v=>{const s=v/255;return s<=.04045?s/12.92:((s+.055)/1.055)**2.4;});
 return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
}
function contrast(a:string,b:string):number{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
it('readable labels and meaningful boundaries survive dark panel backgrounds',()=>{
 for(const bg of ['#121920','#19232d'])for(const color of [C.textPrimary,C.textSecondary,C.textMuted])expect(contrast(color,bg)).toBeGreaterThanOrEqual(4.5);
 expect(contrast(C.borderStrong,'#19232d')).toBeGreaterThanOrEqual(3);
});
