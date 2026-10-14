import {afterEach,expect,it,vi} from 'vitest';
vi.mock('phaser',()=>({default:{}}));
import {enemyVisibleDimension} from '../src/game/art/enemyArt.ts';
afterEach(()=>vi.unstubAllGlobals());
it('measures Campaign opaque silhouettes rather than padded frame canvases',()=>{
 const pixels=new Uint8ClampedArray(128*128*4);for(let y=60;y<115;y++)for(let x=37;x<92;x++)pixels[(y*128+x)*4+3]=255;
 const read=vi.fn(()=>({data:pixels}));vi.stubGlobal('document',{createElement:()=>({width:0,height:0,getContext:()=>({drawImage(){},getImageData:read})})});
 const texture={getSourceImage:()=>({width:128,height:128}),getFrameNames:()=>['walk_0'],get:()=>({cutX:0,cutY:0,cutWidth:128,cutHeight:128,width:128,height:128})};
 const visual:any={atlas:'campaign_enemy_marchling',sprite:{scaleX:.5,texture},frameRectangles:{right:[{width:128,height:128}],left:[]},maxVisualDimension:38};
 expect(enemyVisibleDimension(visual)).toBe(27.5);expect(enemyVisibleDimension(visual)).toBe(27.5);expect(read).toHaveBeenCalledTimes(1);
});
it('keeps attack effects from shrinking the living monster silhouette',()=>{
 const pixels=new Uint8ClampedArray(128*256*4);for(let y=60;y<115;y++)for(let x=37;x<92;x++)pixels[(y*128+x)*4+3]=255;for(let y=128;y<228;y++)for(let x=0;x<100;x++)pixels[(y*128+x)*4+3]=255;
 vi.stubGlobal('document',{createElement:()=>({width:0,height:0,getContext:()=>({drawImage(){},getImageData:()=>({data:pixels})})})});
 const texture={getSourceImage:()=>({width:128,height:256}),getFrameNames:()=>['walk_0','attack_0'],get:(name:string)=>({cutX:0,cutY:name==='walk_0'?0:128,cutWidth:128,cutHeight:128,width:128,height:128})};
 const visual:any={atlas:'campaign_enemy_marchling',sprite:{scaleX:.5,texture},frameRectangles:{right:[{width:128,height:128}],left:[]}};
 expect(enemyVisibleDimension(visual)).toBe(27.5);
});
