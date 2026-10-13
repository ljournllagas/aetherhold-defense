import {describe,expect,it,vi} from 'vitest';
import {BattlefieldView,type FitSupport} from '../src/game/ui/viewport.ts';
import {enemyVisualSupport,type EnemyView} from '../src/game/art/enemyArt.ts';
vi.mock('phaser',()=>({default:{}}));

describe('stable content-fit camera',()=>{
  const supports:FitSupport[]=[
    {bounds:{x:0,y:49,width:1040,height:521}},
    {bounds:{x:64,y:127,width:912,height:381},pixels:{x:-42,y:-80,width:84,height:90}}
  ];
  it.each([[844,258,.374717832956],[320,210,.245614035088],[320,180,.198645598194]])('fits world supports and fixed art without another headroom reservation in %ix%i',(width,height,wantScale)=>{
    const f={x:8,y:128,width,height},v=new BattlefieldView(f);v.setContentFit(supports);
    expect(v.fitField).toEqual(f);expect(v.topHeadroom).toBe(0);
    expect(v.fitScale).toBeCloseTo(wantScale,9);
    for(const s of supports){
      const p=s.pixels??{x:0,y:0,width:0,height:0},b=s.bounds;
      const a=v.project({x:b.x,y:b.y}),z=v.project({x:b.x+b.width,y:b.y+b.height});
      expect(a.x+p.x).toBeGreaterThanOrEqual(f.x+5.999);
      expect(a.y+p.y).toBeGreaterThanOrEqual(f.y+5.999);
      expect(z.x+p.x+p.width).toBeLessThanOrEqual(f.x+width-5.999);
      expect(z.y+p.y+p.height).toBeLessThanOrEqual(f.y+height-5.999);
    }
  });
  it('keeps project/inverse, nearest hits, zoom anchoring and pan on the same fitted transform',()=>{
    const v=new BattlefieldView({x:0,y:56,width:844,height:258});v.setContentFit(supports);
    const plot={x:430,y:350},screen=v.project(plot);
    expect(v.contains(screen)).toBe(true);expect(v.nearest([{x:410,y:350},plot],screen,22)).toBe(1);
    expect(v.unproject(screen).x).toBeCloseTo(plot.x);expect(v.unproject(screen).y).toBeCloseTo(plot.y);
    const center={x:422,y:185},world=v.unproject(center);v.zoomAt(3,center);
    expect(v.project(world).x).toBeCloseTo(center.x);expect(v.project(world).y).toBeCloseTo(center.y);
    const before=v.project(plot);v.pan(15,-8);
    expect(v.project(plot).x).toBeCloseTo(before.x+15);expect(v.project(plot).y).toBeCloseTo(before.y-8);
    v.reset();expect(v.zoom).toBe(1);expect(v.project(plot)).toEqual(screen);
  });
  it('restores the standard camera envelope after removing the content fit',()=>{
    const v=new BattlefieldView({x:0,y:56,width:844,height:258});v.setContentFit(supports);v.setContentFit(null);v.reset();
    expect(v.center).toEqual({x:520,y:348});expect(v.fitScale).toBeCloseTo(258/584);
  });
});

describe('all-action creature support',()=>{
  const visual=(atlas:string):any=>({atlas,bobAmp:2,frameRectangles:{right:[{width:100,height:150}],left:[{width:120,height:140}]},
    sprite:{scaleX:1,originY:.9,frame:{name:'walk'},texture:{getFrameNames:()=>['walk','death'],get:(name:string)=>name==='death'?{width:128,height:256}:{width:64,height:128}}}});
  it('includes taller death/phase frames, the lower edge origin, damage pop and bob without following the active pose',()=>{
    const v=visual('campaign_enemy_test') as EnemyView,rect=enemyVisualSupport(v);
    expect(rect.x).toBeCloseTo(-128*1.045*1.16/2);
    expect(rect.y).toBeCloseTo((1-256*1.045)*1.16-2);
    expect(rect.y+rect.height).toBeCloseTo(256*.1*1.16);
    v.sprite.frame.name='death';expect(enemyVisualSupport(v)).toBe(rect);
  });
  it('uses only this Classic creature’s trimmed frames rather than the shared atlas’s other creatures',()=>{
    const v=visual('enemy_production_atlas') as EnemyView,rect=enemyVisualSupport(v);
    expect(rect.width).toBeCloseTo(120*1.045*1.16);
    expect(rect.y).toBeCloseTo((1-150*1.045)*1.16-2);
  });
  it('uses existing frame rectangles for a single-frame procedural campaign fallback',()=>{
    const v=visual('campaign_enemy_fallback') as EnemyView;
    v.sprite.texture.getFrameNames=()=>[];
    expect(enemyVisualSupport(v).width).toBeCloseTo(120*1.045*1.16);
  });
});
