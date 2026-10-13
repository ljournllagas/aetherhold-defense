import { expect, it, vi } from 'vitest';
import { GameScene } from '../src/game/scenes/GameScene.ts';
import { gameLayout, sheetBounds } from '../src/game/ui/layout.ts';
import { BattlefieldView } from '../src/game/ui/viewport.ts';
import { Tower } from '../src/game/entities/Tower.ts';
import { getCampaignLevel } from '../src/game/campaign/config.ts';
import { resolveCampaignMap } from '../src/game/campaign/maps.ts';
import { CAMPAIGN_LEVELS } from '../src/game/campaign/config.ts';
import { towerArtGeometry } from '../src/game/art/towerArt.ts';
import {enemyArtContract} from '../src/game/art/enemyArt.ts';
vi.mock('phaser', () => ({ default: { Scene: class { constructor(_key?: string) {} } } }));

it.each([[844,390,56,258],[320,390,128,210],[320,360,128,180]])('retains the playable field when compact boss status shares the HUD at %ix%i', (w,h,y,height) => {
  const run = makeBossRun(w,h,{id:1,name:'Mireheart Hydra',alive:true,isBoss:true,hp:100,maxHp:100});
  expect(run.layout.field.y).toBe(y);
  expect(run.layout.field.height).toBe(height);
  expect(panelBounds(run).y+panelBounds(run).height).toBeLessThanOrEqual(y-9);
});

it('fits the compact route and tower supports without collapsing the field for the top-route boss', () => {
  const level=getCampaignLevel(40)!;
  const boss:any={id:1,name:'Mireheart Hydra',alive:true,isBoss:true,hp:100,maxHp:100};
  const run=makeBossRun(844,390,boss,{top:0,right:0,bottom:0,left:0},(scene,enemy)=>{
    scene.map=resolveCampaignMap(level); attachResponsiveBossArt(scene,enemy);
  });
  expect(run.cameraView.fitScale).toBeGreaterThan(.30);
  expect(run.cameraView.topHeadroom).toBe(0);
  for(const p of run.map.buildable){
    const bottom=run.cameraView.project({x:p.x,y:p.y+23.5});
    const top=run.cameraView.project({x:p.x,y:p.y-140});
    expect(bottom.y).toBeLessThanOrEqual(run.layout.field.y+run.layout.field.height);
    expect(top.y).toBeGreaterThanOrEqual(run.layout.field.y);
  }
});

function display(x = 0, y = 0, width = 0, height = 18): any {
  const value: any = { x, y, width, height, list: [], visible: true, text: '', handlers: new Map(),
    wordWrapWidth: 0, characterWidth: 8, lineHeight: height,
    scaleX:1,scaleY:1,setScale(x:number,y=x){this.scaleX=x;this.scaleY=y;return this;},
    data:new Map(),getData(key:string){return this.data.get(key);},setData(key:string|Record<string,unknown>,value?:unknown){if(typeof key==='object'){for(const [name,item] of Object.entries(key))this.data.set(name,item);}else this.data.set(key,value);return this;},
    reflow() {
      if(this.autoWidth){
        const total=this.text.length*this.characterWidth;
        this.width=Math.min(total,this.wordWrapWidth||Infinity);
        this.height=Math.max(this.lineHeight,Math.ceil(total/(this.wordWrapWidth||Infinity))*this.lineHeight);
        return;
      }
      if (this.wordWrapWidth > 0 && typeof this.text === 'string') {
        this.height = Math.max(this.lineHeight, Math.ceil(this.text.length * this.characterWidth / this.wordWrapWidth) * this.lineHeight);
      }
    },
    on(event: string, handler: (...args: any[]) => void) { this.handlers.set(event,handler); return this; },
    add(items: any) { for (const item of (Array.isArray(items) ? items : [items])) { item.parent = this; this.list.push(item); } return this; },
    removeAll(destroy = false) { for (const item of [...this.list]) { if (destroy) item.destroy(); } this.list = []; return this; },
    destroy() { this.destroyed = true; if (this.parent) this.parent.list = this.parent.list.filter((item: any) => item !== proxy); return this; },
    setPosition(x: number, y: number) { this.x = x; this.y = y; return this; },
    setText(text: string) { this.text = text; this.reflow(); return this; },
    setWordWrapWidth(width: number) { this.wordWrapWidth = width; this.reflow(); return this; },
    setFontSize(size: number) { this.characterWidth = size * .55; this.lineHeight = size + 4; this.reflow(); return this; },
    setOrigin(x = 0, y = x) { this.originX = x; this.originY = y; return this; },
    getBounds() { return { x: this.x - (this.originX ?? 0) * this.width, y: this.y - (this.originY ?? 0) * this.height, width: this.width, height: this.height }; },
    setVisible(show: boolean) { this.visible = show; return this; },
    setSize(w: number, h: number) { this.width = w; this.height = h; return this; },
    setDisplaySize(w: number, h: number) { this.width = w; this.height = h; return this; }
  };
  const proxy = new Proxy(value, { get(t, key) { return key in t ? t[key] : () => proxy; } });
  return proxy;
}

function panelBounds(run: any) {
  return { x: run.bossBar.x, y: run.bossBar.y, width: run.bossBarBackdrop.width, height: run.bossBarBackdrop.height };
}

function intersects(a: {x:number;y:number;width:number;height:number}, b: {x:number;y:number;width:number;height:number}): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function useBossBoundsForFloaterCollision(run: any, bounds: {x:number;y:number;width:number;height:number}): void {
  const visual = { sprite: { scaleX: 1, getBounds: () => bounds }, frameRectangles: {right:[{width:256,height:256}],left:[{width:256,height:256}]} };
  run.enemies[0].view = { getData: (key: string) => key === 'enemyVisual' ? visual : undefined, setScale() { return this; }, setData() { return this; } };
}

function makeBossRun(w: number, h: number, boss: any = { id: 'warlord', name: 'The Hollow Warden', alive: true, isBoss: true, hp: 25, maxHp: 100 }, safe = {top:0,right:0,bottom:0,left:0}, prepare?: (run: any, boss: any) => void) {
  const run: any = new GameScene(); run.init({ difficulty: 'medium' });
  run.layout = gameLayout(w,h,safe);
  run.cameraView = new BattlefieldView(run.layout.field);
  run.uiRoot = display(); run.drawCatalog = () => {}; run.updateHUD = () => {};
  run.add = { container: (x: number,y: number) => display(x,y),
    text: (x: number,y: number,text = '',textStyle: any = {}) => {
      const fontSize = Number.parseInt(textStyle.fontSize, 10) || 16;
      const node = display(x,y,0,fontSize + 4);
      node.autoWidth = true;
      node.characterWidth = fontSize * .55; node.lineHeight = fontSize + 4; node.setText(text);
      return node;
    }, rectangle: (x: number,y: number,w: number,h: number) => display(x,y,w,h),
    graphics: () => display(), image: () => display() };
  run.enemies = [boss];
  prepare?.(run,boss);
  run.drawBossBar(); run.updateBossBar();
  return run;
}

function attachResponsiveBossArt(run: any, boss: any): void {
  const route = run.map.waypoints;
  const topY = Math.min(...route.map((point: {y:number}) => point.y));
  const topSegment = route.slice(1).map((point: {x:number;y:number}, index: number) => ({start:route[index],end:point,index}))
    .find(({start,end}: {start:{x:number;y:number};end:{x:number;y:number};index:number}) => start.y === topY && end.y === topY);
  if (!topSegment) throw new Error('Map fixture has no horizontal top road');
  boss.id = 1;
  boss.x = topSegment.start.x;
  boss.y = topY;
  boss.waypointIndex = topSegment.index + 1;
  const sourceScale = 96 / (256 * 0.78);
  const view: any = {
    scaleX: 1,
    scaleY: 1,
    alpha: 1,
    data: new Map<string, any>(),
    getData(key: string) { return this.data.get(key); },
    setScale(x: number, y: number) { this.scaleX = x; this.scaleY = y; return this; },
    setAlpha(alpha: number) { this.alpha = alpha; return this; },
    destroy() { this.destroyed = true; return this; },
    setData(key: string | Record<string, unknown>, value?: unknown) {
      if (typeof key === 'object') for (const [name,item] of Object.entries(key)) this.data.set(name,item);
      else this.data.set(key,value);
      return this;
    }
  };
  const frameRectangles = {
    right:[{width:50,height:50},{width:196,height:256}],
    left:[{width:50,height:50},{width:196,height:256}]
  };
  const bounds = (edgeScale = 1) => {
    const point = run.cameraView.project(run.enemyRenderPoint(boss));
    const width = 196 * sourceScale * view.scaleX * run.cameraView.scale * edgeScale;
    const height = 256 * sourceScale * view.scaleY * run.cameraView.scale * edgeScale;
    return {x:point.x-width/2,y:point.y-height*0.9,width,height};
  };
  const sprite = {scaleX:sourceScale,originY:.9,frame:{name:'boss'},getBounds:()=>bounds()};
  const edge = {getBounds:()=>bounds(1.045),setFrame:vi.fn()};
  const visual = {sprite,frameRectangles,maxVisualDimension:96,playAction:vi.fn(() => 900)};
  view.setData({enemyVisual:visual,isBoss:true,silhouetteEdge:edge});
  boss.view = view;
}

it.each([[1440,900],[1280,720],[1024,768],[768,390],[320,390],[320,360]])('reserves a stable boss strip above the actual battlefield at %ix%i', (w,h) => {
  const run = makeBossRun(w,h,{ id:'mireheart_hydra', name:'Mireheart Hydra', alive:true, isBoss:true, hp:100, maxHp:100 });
  const panel = panelBounds(run), field = run.layout.field;
  const reserved = run.layout.compact ? run.layout.bossStatusHeight : Math.ceil(panel.height + 18);

  expect(run.bossHudReservedHeight).toBe(reserved);
  expect(field.y).toBe(run.layout.hud + (run.layout.compact ? 0 : reserved));
  expect(panel.y).toBe(run.layout.compact ? run.layout.safe.top + (run.layout.stackedHud ? 49 : 21) : run.layout.hud + 8);
  expect(panel.y + panel.height).toBeLessThanOrEqual(field.y - 8);
  expect(field.height).toBeGreaterThanOrEqual(72);
  expect(run.cameraView.field).toEqual(field);
});

it.each([[320,390],[320,360],[768,390],[1280,720],[1440,900]])('fits stable all-action boss support and magnifies intentional zoom at %ix%i', (w,h) => {
  const boss: any = { id:1, name:'Mireheart Hydra', alive:true, isBoss:true, hp:100, maxHp:100 };
  const level = getCampaignLevel(40);
  if (!level) throw new Error('Campaign level 40 fixture is missing');
  const run = makeBossRun(w,h,boss,{top:0,right:0,bottom:0,left:0},(scene,enemy) => {
    scene.map = resolveCampaignMap(level);
    attachResponsiveBossArt(scene,enemy);
  });

  const field = run.layout.field, art = run.bossArtBounds(boss), topY = Math.min(...run.map.waypoints.map((point: {y:number}) => point.y));
  const topRoad = run.cameraView.project({x:run.map.waypoints.find((point: {y:number}) => point.y === topY).x,y:topY});
  const hpAnchor = run.cameraView.project(run.bossHealthBarAnchor(boss));

  expect(run.cameraView.field).toEqual(field);
  expect(run.cameraView.fitField.height).toBeGreaterThanOrEqual(44);
  expect(run.cameraView.topHeadroom).toBeLessThanOrEqual(field.height - 44);
  if(run.layout.compact)expect(run.cameraView.topHeadroom).toBe(0);else expect(run.cameraView.topHeadroom).toBeGreaterThan(0);
  expect(art.height).toBeLessThanOrEqual(field.height * 0.5 + 1);
  expect(art.y).toBeGreaterThanOrEqual(field.y + 5);
  expect(art.y).toBeLessThan(topRoad.y);
  expect(hpAnchor.y).toBeCloseTo(art.y - 4,1);
  expect(boss.view.scaleX).toBeCloseTo(boss.view.scaleY,6);
  if (w >= 1280 && h >= 720) expect(boss.view.getData('bossResponsiveCap')).toBe(1);
  else expect(boss.view.getData('bossResponsiveCap')).toBeLessThan(1);

  const headroom = run.cameraView.topHeadroom;
  const anchor = {x:run.cameraView.fitField.x+run.cameraView.fitField.width/2,y:run.cameraView.fitField.y+run.cameraView.fitField.height/2};
  const world = run.cameraView.unproject(anchor);
  run.cameraView.zoomAt(4,anchor);
  run.applyView();
  expect(run.cameraView.project(world).x).toBeCloseTo(anchor.x);
  expect(run.cameraView.project(world).y).toBeCloseTo(anchor.y);
  let zoomedArt = run.bossArtBounds(boss);
  expect(zoomedArt.height).toBeCloseTo(art.height*4,5);
  expect(run.cameraView.topHeadroom).toBe(headroom);
  run.cameraView.pan(20,-10);
  run.applyView();
  zoomedArt = run.bossArtBounds(boss);
  expect(zoomedArt.height).toBeCloseTo(art.height*4,5);
  expect(boss.view.scaleX).toBeCloseTo(boss.view.scaleY,6);
});

it('fits the actual boss bounds while retaining a zoomed camera before the boss appears', () => {
  const boss: any = { id:1, name:'Mireheart Hydra', alive:true, isBoss:true, hp:100, maxHp:100 };
  const level = getCampaignLevel(40);
  if (!level) throw new Error('Campaign level 40 fixture is missing');
  const run = makeBossRun(320,390,boss,{top:0,right:0,bottom:0,left:0},(scene,enemy) => {
    scene.map = resolveCampaignMap(level);
    attachResponsiveBossArt(scene,enemy);
    scene.cameraView.zoomAt(3,{x:160,y:scene.layout.field.y+40});
    scene.cameraView.pan(0,-24);
  });

  const field = run.layout.field, art = run.bossArtBounds(boss);
  expect(run.cameraView.zoom).toBe(3);
  if(run.layout.compact)expect(run.cameraView.topHeadroom).toBe(0);else expect(run.cameraView.topHeadroom).toBeGreaterThan(0);
  expect(run.cameraView.fitField.height).toBeGreaterThanOrEqual(44);
  expect(art.height).toBeGreaterThan(field.height*.36);
  run.cameraView.reset();run.applyView();
  expect(run.bossArtBounds(boss).y).toBeGreaterThanOrEqual(field.y+5);
  expect(run.bossArtBounds(boss).height).toBeLessThanOrEqual(field.height*.36+1);
});

it('reprojects a detached boss death across field restoration without restarting its clip', () => {
  const boss: any = { id:1, name:'Mireheart Hydra', alive:true, isBoss:true, hp:100, maxHp:100 };
  const level = getCampaignLevel(40);
  if (!level) throw new Error('Campaign level 40 fixture is missing');
  const run = makeBossRun(320,390,boss,{top:0,right:0,bottom:0,left:0},(scene,enemy) => {
    scene.map = resolveCampaignMap(level);
    attachResponsiveBossArt(scene,enemy);
  });
  expect(run.layout.portraitBossCommands).toBe(true);
  expect(run.bossHudReservedHeight).toBeGreaterThan(0);

  const deadView = boss.view;
  const deathAction = deadView.getData('enemyVisual').playAction;
  const startedAt = run.gameTimeMs;
  run.startDeathAnim(boss);
  const death = run.dying[0];
  run.gameTimeMs = death.t0 + 450;
  run.updateDying();
  const previousBaseScale = death.view.getData('baseScaleX');
  const apparentHeightBefore=deadView.getData('enemyVisual').sprite.getBounds().height;
  const deathProgress = 0.5;
  expect(death.view.scaleX).toBeCloseTo(previousBaseScale * (1 - deathProgress * 0.8),6);
  expect(death.view.alpha).toBeCloseTo(1 - deathProgress,6);

  boss.alive = false;
  run.enemies = [];
  run.drawTowerPanel = () => {};
  run.drawCampaignCallout = () => {};
  run.repositionBossFloaters = () => {};
  run.setBossLayout(false,0);

  const restoredBaseScale = death.view.getData('baseScaleX');
  expect(deadView.getData('enemyVisual').sprite.getBounds().height).toBeCloseTo(apparentHeightBefore,6);
  expect(restoredBaseScale).not.toBeCloseTo(previousBaseScale,5);
  expect(death.view.scaleX).toBeCloseTo(restoredBaseScale * (1 - deathProgress * 0.8),6);
  expect(death.view.scaleY).toBeCloseTo(death.view.scaleX,6);
  expect(death.view.alpha).toBeCloseTo(1 - deathProgress,6);
  expect(death.t0).toBe(startedAt);
  expect(death.duration).toBe(900);
  expect(boss.view).toBeNull();
  expect(deathAction).toHaveBeenCalledTimes(1);
  expect(deathAction).toHaveBeenCalledWith('death');

  run.gameTimeMs = death.t0 + death.duration;
  run.updateDying();
  expect(run.dying).toHaveLength(0);
  expect(death.view.destroyed).toBe(true);
});

it.each([[360,360],[360,640],[390,844],[667,390],[768,390],[844,390],[768,1024],[1024,768],[1366,768]])('keeps boss information above the reserved field at %ix%i', (w,h) => {
  const run = makeBossRun(w,h);
  const panel = panelBounds(run), field = run.layout.field;
  expect(panel.x).toBeGreaterThanOrEqual(0);
  expect(panel.x + panel.width).toBeLessThanOrEqual(w);
  expect(panel.y).toBeGreaterThanOrEqual(run.layout.compact ? run.layout.safe.top : run.layout.hud);
  expect(panel.y + panel.height).toBeLessThanOrEqual(h - run.layout.tray);
  expect(panel.y + panel.height).toBeLessThanOrEqual(field.y - 8);
  expect(run.bossBarTrack.width).toBe(panel.width - 24);
  expect(run.bossBarText.text).toBe('The Hollow Warden');
  expect(run.bossBarHp.text).toContain('HP 25%');
  run.enemies = []; run.updateBossBar(); expect(run.bossBar.visible).toBe(false);
});

it.each([[768,540],[767,540],[360,360]])('shares compact boss status with the HUD and keeps the desktop strip at %ix%i', (w,h) => {
  const run = makeBossRun(w,h,{ id:'mireheart_hydra', name:'Mireheart Hydra', alive:true, isBoss:true, hp:100, maxHp:100 });
  const baseField = gameLayout(w,h).field;
  const statusY = run.layout.compact ? baseField.y + 4 : h - run.layout.tray + 12;
  run.hudStatus = display(8,statusY,w - 16,run.layout.compact ? 18 : 30).setText('DEV CAMPAIGN FIXTURE · L40 · unsaved').setVisible(true);
  run.campaign = {};
  run.campaignBosses = { phase: () => 2 };
  run.updateBossBar();

  const panel = panelBounds(run), field = run.layout.field;
  if(run.layout.compact&&!run.layout.stackedHud)expect(field.y).toBe(baseField.y);else expect(field.y).toBeGreaterThan(baseField.y);
  expect(field.y).toBe(baseField.y + (run.layout.compact ? run.layout.stackedHud ? run.layout.bossStatusHeight : Math.max(0,run.layout.bossStatusHeight-24) : panel.height+18));
  expect(panel.y).toBe(run.layout.compact ? run.layout.safe.top + (run.layout.stackedHud ? 49 : 21) : run.layout.hud + 8);
  expect(panel.y + panel.height).toBeLessThanOrEqual(field.y - 8);
  const statusOverlapsPanel = run.hudStatus.y < panel.y + panel.height && run.hudStatus.y + run.hudStatus.height > panel.y;
  expect(!run.hudStatus.visible || !statusOverlapsPanel).toBe(true);
  if (run.layout.compact) expect(run.hudStatus.visible).toBe(false);
  expect(panel.x).toBeGreaterThanOrEqual(0);
  expect(panel.x + panel.width).toBeLessThanOrEqual(w);
  expect(run.cameraView.field).toEqual(field);
  expect(run.bossBarHp.text).toContain('Phase 2');

  run.enemies = [];
  run.updateBossBar();
  expect(run.layout.field).toEqual(baseField);
  expect(run.cameraView.field).toEqual(baseField);
});

it.each([[768,540],[767,540],[360,360]])('keeps the boss panel fixed above the battlefield through camera movement at %ix%i', (w,h) => {
  const run = makeBossRun(w,h,{ id:'mireheart_hydra', name:'Mireheart Hydra', alive:true, isBoss:true, hp:100, maxHp:100 });
  const before = panelBounds(run);
  run.cameraView.zoom = 2;
  run.cameraView.resize(run.layout.field);
  run.cameraView.pan(24,-10);
  run.updateBossBar();

  const panel = panelBounds(run), field = run.layout.field;
  expect(panel.x).toBe(before.x);
  expect(panel.y).toBe(run.layout.compact ? run.layout.safe.top + (run.layout.stackedHud ? 49 : 21) : run.layout.hud + 8);
  expect(panel.y + panel.height).toBeLessThanOrEqual(field.y - 8);
  expect(run.cameraView.field).toEqual(field);
  expect(run.bossBarText.text).toBe('Mireheart Hydra');
  expect(run.bossBarHp.text).toContain('HP 100%');
});

it.each([[320,390],[320,360]])('uses a temporary 52px portrait command row to reserve the boss panel at %ix%i', (w,h) => {
  const run = makeBossRun(w,h,{ id:'mireheart_hydra', name:'Mireheart Hydra', alive:true, isBoss:true, hp:100, maxHp:100 });
  run.campaign = {};
  run.campaignBosses = { phase: () => 2 };
  run.updateBossBar();

  const panel = panelBounds(run), field = run.layout.field;
  expect(run.layout.portraitBossCommands).toBe(true);
  expect(run.layout.tray).toBe(52);
  expect(run.bossHudReservedHeight).toBe(run.layout.compact ? run.layout.bossStatusHeight : Math.ceil(panel.height + 18));
  expect(run.layout.field.height).toBeGreaterThanOrEqual(72);
  expect(field.height).toBe(gameLayout(w,h).field.height+76-run.layout.bossStatusHeight);
  expect(run.bossHudReservedHeight).toBeGreaterThan(0);
  expect(panel.y).toBe(run.layout.compact ? run.layout.safe.top + (run.layout.stackedHud ? 49 : 21) : run.layout.hud + 8);
  expect(panel.y+panel.height).toBeLessThanOrEqual(field.y-8);
  expect(run.bossBarText.text).toBe('Mireheart Hydra');
  expect(run.bossBarHp.text).toContain('Phase 2');

  const labels = run.uiRoot.list.filter((item: any) => ['Build','Relics','Wave','More'].includes(item.text)).map((item: any) => item.text);
  expect(labels).toEqual(['Build','Relics','Wave','More']);
  const commandLabels = run.uiRoot.list.filter((item: any) => ['Build','Relics','Wave','More'].includes(item.text));
  const boxes = commandLabels.map((label: any) => run.uiRoot.list[run.uiRoot.list.indexOf(label)-1]);
  expect(boxes).toHaveLength(4);
  for (const box of boxes) {
    expect(box.height).toBe(44);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x+box.width).toBeLessThanOrEqual(w);
    expect(box.y+box.height).toBeLessThanOrEqual(h);
  }
  expect(run.towerTray).toBeNull();

  const buildLabel = commandLabels.find((item: any) => item.text === 'Build');
  const buildBox = run.uiRoot.list[run.uiRoot.list.indexOf(buildLabel)-1];
  const openSheet = vi.fn(); run.openSheet = openSheet;
  const pointer = {id:1,x:buildBox.x+buildBox.width/2,y:buildBox.y+buildBox.height/2};
  const event = {stopPropagation:vi.fn()};
  buildBox.handlers.get('pointerdown')(pointer,0,0,event);
  buildBox.handlers.get('pointerup')(pointer,0,0,event);
  expect(openSheet).toHaveBeenCalledWith('build');

  const baseField = gameLayout(w,h).field;
  run.enemies = [];
  run.updateBossBar();
  expect(run.layout.portraitBossCommands).toBe(false);
  expect(run.layout.field).toEqual(baseField);
  expect(run.layout.tray).toBe(128);
  expect(run.cameraView.center).toEqual({x:520,y:348});
  expect(run.towerTray).not.toBeNull();
  expect(run.uiRoot.list.some((item: any) => item.text === 'Build')).toBe(false);
});

it('restores the ordinary portrait tray and keeps the stable boss strip after resizing to a roomy portrait', () => {
  const run = makeBossRun(320,390,{ id:'mireheart_hydra', name:'Mireheart Hydra', alive:true, isBoss:true, hp:100, maxHp:100 });
  expect(run.layout.portraitBossCommands).toBe(true);
  expect(run.uiRoot.list.some((item: any) => item.text === 'Build')).toBe(true);

  // Model handleResize's reset and shell rebuild before the boss HUD is remeasured.
  run.bossHudReservedHeight = 0;
  run.bossHudCameraBeforeReservation = null;
  run.layout = gameLayout(390,844);
  run.cameraView.resize(run.layout.field);
  run.drawTowerPanel();
  run.updateBossBar();

  expect(run.layout.portraitBossCommands).toBe(false);
  expect(run.layout.tray).toBe(128);
  expect(run.bossHudReservedHeight).toBeGreaterThan(0);
  expect(run.layout.field.y).toBe(gameLayout(390,844).field.y + run.bossHudReservedHeight);
  expect(panelBounds(run).y + panelBounds(run).height).toBeLessThanOrEqual(run.layout.field.y - 8);
  expect(run.uiRoot.list.some((item: any) => item.text === 'Build')).toBe(false);
  expect(run.towerTray).not.toBeNull();
});

it('keeps the Hydra callout clear by reserving the top strip after a tall-portrait resize', () => {
  const run = makeBossRun(844,390,{ id:'mireheart_hydra', name:'Mireheart Hydra', alive:true, isBoss:true, hp:100, maxHp:100 });
  run.campaign = {};
  run.campaignBosses = { phase: () => 2 };
  run.bossHudReservedHeight = 0;
  run.bossHudCameraBeforeReservation = null;
  run.layout = gameLayout(390,844);
  run.cameraView.resize(run.layout.field);
  run.hudStatus = display(8,run.layout.hud+4,374,18).setText('DEV CAMPAIGN FIXTURE · L40 · unsaved').setVisible(true);
  const expectedCallout = {text:'Hydra · Bogling brood gathering',until:3000};
  run.campaignCallout = expectedCallout;
  run.campaignCalloutView = display(195,run.layout.field.y+run.layout.field.height-12,234,26).setOrigin(.5,1);
  run.uiRoot.add(run.campaignCalloutView);
  run.updateBossBar();

  const panel = panelBounds(run), callout = run.campaignCalloutView.getBounds(), field = run.layout.field;
  expect(run.layout.portraitBossCommands).toBe(false);
  expect(run.bossHudReservedHeight).toBeGreaterThan(0);
  expect(panel.y).toBe(run.layout.compact ? run.layout.safe.top + (run.layout.stackedHud ? 49 : 21) : run.layout.hud + 8);
  expect(panel.y+panel.height).toBeLessThanOrEqual(field.y-8);
  expect(intersects(panel,callout)).toBe(false);
  expect(!run.hudStatus.visible || !intersects(panel,run.hudStatus.getBounds())).toBe(true);
  expect(run.campaignCallout).toEqual(expectedCallout);
  expect(callout.y + callout.height).toBeLessThanOrEqual(field.y + field.height);
  expect(run.bossBarHp.text).toContain('Phase 2');
});

it('keeps the compact portrait boss panel above the battlefield through camera pan', () => {
  const run = makeBossRun(320,390,{ id:'mireheart_hydra', name:'Mireheart Hydra', alive:true, isBoss:true, hp:100, maxHp:100 });
  run.cameraView.zoom = 2;
  run.cameraView.resize(run.layout.field);
  const before = panelBounds(run);

  for (const movement of [{x:0,y:0},{x:24,y:-10},{x:-38,y:16}]) {
    if (movement.x || movement.y) run.cameraView.pan(movement.x,movement.y);
    run.updateBossBar();
    const panel = panelBounds(run), field = run.layout.field;
    expect(panel.y+panel.height).toBeLessThanOrEqual(field.y-8);
    expect(panel.y).toBe(before.y);
    expect(field).toEqual(run.cameraView.field);
  }
});

it('fits a full long boss label and all four 44px commands with portrait safe insets', () => {
  const name = 'The Hollow Warden, Keeper of the Whisperfen';
  const run = makeBossRun(320,360,{ id:'hollow_warden', name, alive:true, isBoss:true, hp:25, maxHp:100 },{top:12,right:8,bottom:20,left:8});
  run.campaign = {};
  run.campaignBosses = { phase: () => 2 };
  run.updateBossBar();

  const panel = panelBounds(run), field = run.layout.field;
  expect(run.layout.portraitBossCommands).toBe(true);
  expect(run.bossBarText.text).toBe(name);
  expect(run.bossBarHp.text).toContain('Phase 2');
  expect(run.bossHudReservedHeight).toBeGreaterThan(0);
  expect(field.height).toBeGreaterThanOrEqual(72);
  expect(panel.y+panel.height).toBeLessThanOrEqual(field.y-8);

  const labels = run.uiRoot.list.filter((item: any) => ['Build','Relics','Wave','More'].includes(item.text));
  const boxes = labels.map((label: any) => run.uiRoot.list[run.uiRoot.list.indexOf(label)-1]);
  expect(labels.map((item: any) => item.text)).toEqual(['Build','Relics','Wave','More']);
  for (const box of boxes) {
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBe(44);
    expect(box.x).toBeGreaterThanOrEqual(8);
    expect(box.x+box.width).toBeLessThanOrEqual(312);
    expect(box.y+box.height).toBeLessThanOrEqual(340);
  }
});

it('reflows an open Build sheet when the short portrait boss row starts and ends', () => {
  const run = makeBossRun(320,390,{ id:'mireheart_hydra', name:'Mireheart Hydra', alive:true, isBoss:true, hp:100, maxHp:100 });
  const boss = run.enemies[0];
  run.drawTowerPanel = () => {};
  run.enemies = [];
  run.updateBossBar();

  const reflowedBounds: Array<{x:number;y:number;width:number;height:number}> = [];
  const drawSheet = vi.fn((restoreOffset?: number) => {
    reflowedBounds.push(sheetBounds(run.layout, 'build', run.touchPreview !== null));
    if (run.sheet && restoreOffset !== undefined) run.sheet.scrollOffset = restoreOffset;
  });
  run.drawSheet = drawSheet;
  run.showTouchPreview = () => {};
  run.openSheet('build');
  const sheet = { scrollOffset: 72 };
  run.sheet = sheet;
  drawSheet.mockClear();
  reflowedBounds.length = 0;
  const selectedTower = run.selectedTower;
  const pauseState = run.pauseState.blocked;

  run.enemies = [boss];
  const bossStartCall = drawSheet.mock.calls.length;
  run.updateBossBar();
  expect(run.layout.portraitBossCommands).toBe(true);
  expect(drawSheet).toHaveBeenLastCalledWith(72);
  expect(drawSheet.mock.calls.length).toBeGreaterThan(bossStartCall);
  expect(sheet.scrollOffset).toBe(72);
  let bounds = reflowedBounds[reflowedBounds.length - 1];
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(run.layout.height - run.layout.tray);
  expect(run.pauseState.blocked).toBe(pauseState);
  expect(run.selectedTower).toBe(selectedTower);

  run.enemies = [];
  const bossEndCall = drawSheet.mock.calls.length;
  run.updateBossBar();
  expect(run.layout.portraitBossCommands).toBe(false);
  expect(drawSheet).toHaveBeenLastCalledWith(72);
  expect(drawSheet.mock.calls.length).toBeGreaterThan(bossEndCall);
  expect(sheet.scrollOffset).toBe(72);
  bounds = reflowedBounds[reflowedBounds.length - 1];
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(run.layout.height - run.layout.tray);
  expect(bounds.y + bounds.height).toBe(262);
  expect(run.pauseState.blocked).toBe(pauseState);
  expect(run.selectedTower).toBe(selectedTower);
});

it('reflows an open Build sheet and preserves its scroll when resizing to a roomy portrait', () => {
  const run = makeBossRun(320,390,{ id:'mireheart_hydra', name:'Mireheart Hydra', alive:true, isBoss:true, hp:100, maxHp:100 });
  run.enemies = [];
  run.drawTowerPanel = () => {};
  run.updateBossBar();
  run.drawSheet = () => {};
  run.showTouchPreview = () => {};
  run.openSheet('build');
  const sheet = { scrollOffset: 56, destroy: vi.fn() };
  run.sheet = sheet;

  run.scale = { width:390, height:844 };
  run.cancelGesture = () => {};
  run.uiRoot.parent = null;
  run.drawHUD = () => {};
  run.drawTowerPanel = () => {};
  run.drawControls = () => {};
  run.drawPowerupBar = () => {};
  run.drawBossBar = () => {};
  run.refreshInfoPanel = () => {};
  run.refreshPlacePanel = () => {};
  run.updateNextPreview = () => {};
  run.updateHUD = () => {};
  run.drawAchievementNotice = () => {};
  run.drawCampaignCallout = () => {};
  run.showTouchPreview = () => {};
  const reflowedBounds: Array<{x:number;y:number;width:number;height:number}> = [];
  const drawSheet = vi.fn((restoreOffset?: number) => {
    reflowedBounds.push(sheetBounds(run.layout, 'build', run.touchPreview !== null));
  });
  run.drawSheet = drawSheet;
  const pauseState = run.pauseState.blocked;
  const selectedTower = run.selectedTower;

  run.handleResize();

  expect(run.layout.width).toBe(390);
  expect(run.layout.height).toBe(844);
  expect(drawSheet).toHaveBeenCalledWith(56);
  expect(reflowedBounds[0].y + reflowedBounds[0].height).toBeLessThanOrEqual(run.layout.height - run.layout.tray);
  expect(run.pauseState.blocked).toBe(pauseState);
  expect(run.selectedTower).toBe(selectedTower);
});

it('keeps gold feedback visible and clear of the panel and visible boss bounds', () => {
  const run = makeBossRun(360,360,{ id:'mireheart_hydra', name:'Mireheart Hydra', alive:true, isBoss:true, hp:100, maxHp:100 });
  run.campaign = {};
  run.campaignBosses = { phase: () => 2 };
  const field = run.layout.field;
  const spriteBounds = {x:160,y:field.y+24,width:40,height:40};
  useBossBoundsForFloaterCollision(run,spriteBounds);
  const floater = display(180,field.y+44,84,18).setOrigin(.5).setText('-180 gold');
  const deadline = 1400;
  run.floaters = [{text:floater,until:deadline}];
  run.updateBossBar();

  const bounds = floater.getBounds();
  expect(floater.visible).toBe(true);
  expect(floater.text).toBe('-180 gold');
  expect(run.floaters[0].until).toBe(deadline);
  expect(intersects(bounds,panelBounds(run))).toBe(false);
  expect(intersects(bounds,spriteBounds)).toBe(false);
  expect(bounds.x).toBeGreaterThanOrEqual(field.x);
  expect(bounds.x+bounds.width).toBeLessThanOrEqual(field.x+field.width);
  expect(bounds.y).toBeGreaterThanOrEqual(field.y);
  expect(bounds.y+bounds.height).toBeLessThanOrEqual(field.y+field.height);
});

it('moves existing floaters into the boss battlefield strip without changing their message or deadline', () => {
  const run = makeBossRun(768,390,{ id:'mireheart_hydra', name:'Mireheart Hydra', alive:true, isBoss:true, hp:100, maxHp:100 });
  const boss = run.enemies[0];
  run.enemies = [];
  run.updateBossBar();
  const floater = display(160,70,100,18).setOrigin(.5).setText('+250 gold');
  const deadline = 2400;
  run.floaters = [{text:floater,until:deadline}];

  run.enemies = [boss];
  run.updateBossBar();

  const bounds = floater.getBounds(), field = run.layout.field;
  expect(run.bossHudReservedHeight).toBeGreaterThan(0);
  expect(floater.text).toBe('+250 gold');
  expect(run.floaters[0].until).toBe(deadline);
  expect(bounds.x).toBeGreaterThanOrEqual(field.x);
  expect(bounds.x+bounds.width).toBeLessThanOrEqual(field.x+field.width);
  expect(bounds.y).toBeGreaterThanOrEqual(field.y);
  expect(bounds.y+bounds.height).toBeLessThanOrEqual(field.y+field.height);

  run.enemies = [];
  run.updateBossBar();
  const restoredBounds = floater.getBounds(), restoredField = run.layout.field;
  expect(restoredField).toEqual(gameLayout(768,390).field);
  expect(restoredBounds.x).toBeGreaterThanOrEqual(restoredField.x);
  expect(restoredBounds.x+restoredBounds.width).toBeLessThanOrEqual(restoredField.x+restoredField.width);
  expect(restoredBounds.y).toBeGreaterThanOrEqual(restoredField.y);
  expect(restoredBounds.y+restoredBounds.height).toBeLessThanOrEqual(restoredField.y+restoredField.height);
  expect(floater.text).toBe('+250 gold');
  expect(run.floaters[0].until).toBe(deadline);
});

it('restores zoom and center after temporary boss-row reservation unless the player pans during the boss', () => {
  const run = makeBossRun(768,540,{ id:'mireheart_hydra', name:'Mireheart Hydra', alive:true, isBoss:true, hp:100, maxHp:100 });
  const boss = run.enemies[0];
  const baseField = gameLayout(768,540).field;

  run.enemies = []; run.updateBossBar();
  run.cameraView.zoom = 4;
  run.cameraView.center = {x:880,y:550};
  run.cameraView.resize(baseField);
  const original = {zoom:run.cameraView.zoom,center:{...run.cameraView.center}};
  run.enemies = [boss]; run.updateBossBar();
  expect(run.layout.field.y).toBeGreaterThan(baseField.y);
  run.enemies = []; run.updateBossBar();
  expect(run.cameraView.zoom).toBe(original.zoom);
  expect(run.cameraView.center).toEqual(original.center);

  run.enemies = [boss]; run.updateBossBar();
  run.cameraView.pan(20,0);
  const panned = new BattlefieldView(baseField);
  panned.zoom = run.cameraView.zoom;
  panned.center = {...run.cameraView.center};
  panned.resize(baseField);
  run.enemies = []; run.updateBossBar();
  expect(run.cameraView.zoom).toBe(panned.zoom);
  expect(run.cameraView.center).toEqual(panned.center);
  expect(run.cameraView.center).not.toEqual(original.center);
});

it('keeps the desktop boss strip outside the field containing Whisperfen’s top road', () => {
  const run = makeBossRun(1280,720,{ id:'mireheart_hydra', name:'Mireheart Hydra', alive:true, isBoss:true, hp:100, maxHp:100 });
  const level = getCampaignLevel(40);
  if (!level) throw new Error('Campaign level 40 fixture is missing');
  run.map = resolveCampaignMap(level);
  run.updateBossBar();

  const route = run.map.waypoints;
  const topRoad = route.slice(1).map((point: {x:number;y:number}, index: number) => ({ start: route[index], end: point }))
    .find(({start,end}: {start:{x:number;y:number};end:{x:number;y:number}}) => start.y === 147 && end.y === 147);
  if (!topRoad) throw new Error('Whisperfen level 40 horizontal top road is missing');
  const start = run.cameraView.project(topRoad.start), end = run.cameraView.project(topRoad.end);
  const panel = panelBounds(run), field = run.layout.field;
  const topRoadY = (start.y + end.y) / 2;
  expect(panel.y + panel.height).toBeLessThanOrEqual(field.y - 8);
  expect(topRoadY).toBeGreaterThanOrEqual(field.y);
});

it.each([[1440,900],[1280,720],[1024,768],[768,540],[767,540],[360,360],[768,390]])('keeps the visible top-road corridor below the boss strip after V9 zoom/pan at %ix%i', (w,h) => {
  const run = makeBossRun(w,h,{ id:'mireheart_hydra', name:'Mireheart Hydra', alive:true, isBoss:true, hp:100, maxHp:100 });
  const level = getCampaignLevel(40);
  if (!level) throw new Error('Whisperfen level 40 fixture is missing');
  run.map = resolveCampaignMap(level);
  run.cameraView.zoom = 1.35;
  run.cameraView.resize(run.layout.field);
  run.cameraView.pan(17,-11);
  run.updateBossBar();

  const route = run.map.waypoints;
  const topRoad = route.slice(1).map((point: {x:number;y:number}, index: number) => ({ start:route[index], end:point }))
    .find(({start,end}: {start:{x:number;y:number};end:{x:number;y:number}}) => start.y === 147 && end.y === 147);
  if (!topRoad) throw new Error('Whisperfen level 40 horizontal top road is missing');
  const start = run.cameraView.project(topRoad.start), end = run.cameraView.project(topRoad.end);
  const panel = panelBounds(run), field = run.layout.field;
  const roadY = (start.y + end.y) / 2;
  const visibleRoadX = Math.min(Math.max(start.x,end.x),field.x+field.width) - Math.max(Math.min(start.x,end.x),field.x);
  const roadVisible = roadY >= field.y && roadY <= field.y + field.height && visibleRoadX > 0;

  expect(panel.y + panel.height).toBeLessThanOrEqual(field.y - 8);
  if (roadVisible) expect(roadY).toBeGreaterThanOrEqual(panel.y + panel.height + 9);
});

it('keeps the 844x390 boss panel in the stable top strip above the battlefield', () => {
  const run = makeBossRun(844,390,{ id:'mireheart_hydra', name:'Mireheart Hydra', alive:true, isBoss:true, hp:100, maxHp:100 });
  run.hudStatus = display(8,run.layout.field.y + 4,400,18).setText('DEV CAMPAIGN FIXTURE · L40 · unsaved');
  run.campaign = {};
  run.campaignBosses = { phase: () => 1 };
  run.updateBossBar();

  const panel = panelBounds(run), field = run.layout.field;
  expect(run.bossHudReservedHeight).toBe(run.layout.compact ? run.layout.bossStatusHeight : Math.ceil(panel.height + 18));
  expect(panel.y).toBe(run.layout.compact ? run.layout.safe.top + (run.layout.stackedHud ? 49 : 21) : run.layout.hud + 8);
  expect(panel.y + panel.height).toBeLessThanOrEqual(field.y - 8);
  expect(field.y).toBe(run.layout.hud + (run.layout.compact ? 0 : run.bossHudReservedHeight));
  expect(panel.y).toBeGreaterThanOrEqual(run.layout.compact ? run.layout.safe.top : run.layout.hud);
  expect(!run.hudStatus.visible || !intersects(panel,run.hudStatus.getBounds())).toBe(true);
  expect(run.bossBarText.text).toBe('Mireheart Hydra');
  expect(run.bossBarHp.text).toContain('Phase 1');
});

it('reserves the boss strip in roomy portrait without replacing the full command tray', () => {
  const run = makeBossRun(360,640,{ id:'mireheart_hydra', name:'Mireheart Hydra', alive:true, isBoss:true, hp:100, maxHp:100 });
  const panel = panelBounds(run), field = run.layout.field;
  expect(run.layout.portraitBossCommands).toBe(false);
  expect(run.layout.tray).toBe(128);
  expect(run.bossHudReservedHeight).toBe(run.layout.compact ? run.layout.bossStatusHeight : Math.ceil(panel.height + 18));
  expect(field.y).toBe(gameLayout(360,640).field.y + run.bossHudReservedHeight);
  expect(panel.y + panel.height).toBeLessThanOrEqual(field.y - 8);
});

it('keeps a long label readable and reflows the stable strip across landscape-to-portrait resize', () => {
  const longName = 'The Hollow Warden, Keeper of the Whisperfen';
  const run = makeBossRun(768,390,{ id:'hollow_warden', name:longName, alive:true, isBoss:true, hp:18, maxHp:100 });
  run.campaign = {};
  run.campaignBosses = { phase: () => 2 };
  run.updateBossBar();

  let panel = panelBounds(run), field = run.layout.field;
  expect(panel.y + panel.height).toBeLessThanOrEqual(field.y - 8);
  expect(run.bossHudReservedHeight).toBe(run.layout.compact ? run.layout.bossStatusHeight : Math.ceil(panel.height + 18));
  expect(run.bossBarText.text).toBe(longName);
  expect(run.bossBarHp.text).toContain('Phase 2');

  // Resize follows handleResize: clear the old viewport reservation before
  // the boss panel is measured against the new viewport.
  run.bossHudReservedHeight = 0;
  run.bossHudCameraBeforeReservation = null;
  run.layout = gameLayout(390,844);
  run.cameraView.resize(run.layout.field);
  run.updateBossBar();
  panel = panelBounds(run); field = run.layout.field;
  expect(run.layout.portraitBossCommands).toBe(false);
  expect(run.bossHudReservedHeight).toBe(run.layout.compact ? run.layout.bossStatusHeight : Math.ceil(panel.height + 18));
  expect(field.y).toBe(gameLayout(390,844).field.y + run.bossHudReservedHeight);
  expect(panel.y + panel.height).toBeLessThanOrEqual(field.y - 8);
  expect(panel.x).toBeGreaterThanOrEqual(field.x);
  expect(panel.x + panel.width).toBeLessThanOrEqual(field.x + field.width);
  expect(run.bossBarText.text).toBe(longName);
  expect(run.bossBarHp.text).toContain('Phase 2');
});

it('offers details without automatically reopening a closed sheet when the inspector cannot fit', () => {
  const run: any = new GameScene(); run.init({ difficulty:'medium' });
  run.layout = gameLayout(360,360,{top:12,right:8,bottom:20,left:8});
  run.cameraView = { project: () => ({x:180,y:220}) };
  run.selectedTower = new Tower('longbow',0,0,0); run.bossBar = { visible:true,y:76 }; run.bossPanelHeight = 78;
  const details = vi.spyOn(run,'openDetails');
  run.cancelGesture = () => {}; run.drawSheet = () => {};
  run.uiRoot = display();
  run.add = {container:(x: number,y: number)=>display(x,y),rectangle:(x: number,y: number,w: number,h: number)=>display(x,y,w,h),
    text:(x: number,y: number,text: string)=>Object.assign(display(x,y),{text}),graphics:()=>display()};
  run.drawCatalog();
  expect(details).not.toHaveBeenCalled();
  expect(run.infoPanel.y).toBeGreaterThanOrEqual(162);
  expect(run.infoPanel.y+44).toBeLessThanOrEqual(264);
  expect(run.infoPanel.list.some((view: any)=>view.text==='Ranger · Details')).toBe(true);
  const action = run.infoPanel.list[0], pointer = {id:1,x:0,y:0}, event = {stopPropagation(){}};
  action.handlers.get('pointerdown')(pointer,0,0,event);
  action.handlers.get('pointerup')(pointer,0,0,event);
  expect(run.sheetKind).toBe('tower'); expect(run.pauseState.blocked).toBe(true);
  run.closeDetails();
  expect(run.sheetKind).toBeNull(); expect(run.pauseState.blocked).toBe(false);
  expect(details).toHaveBeenCalledTimes(1);
});

it.each([[320,360],[320,390],[360,360],[599,390],[600,390],[844,390]])('retains labeled metrics, readable values and four 44px controls at %ix%i',(w,h)=>{
  const run=makeBossRun(w,h,{id:1,name:'Mireheart Hydra',alive:true,isBoss:true,hp:100,maxHp:100});
  run.hudWaveValue.setText('52/52');run.hudGoldValue.setText('987654321');run.hudLivesValue.setText('25/35');run.hudScoreValue.setText('123456789');
  run.fitHudMetrics();
  const labels=run.hudMetricLabels,values=[run.hudWaveValue,run.hudGoldValue,run.hudLivesValue,run.hudScoreValue];
  expect(labels.map((l:any)=>l.text)).toEqual(['WAVE','GOLD','LIVES','SCORE']);
  expect(values[1].getData('fullValue')).toBe('987654321');expect(values[3].getData('fullValue')).toBe('123456789');
  for(let i=0;i<4;i++){
    expect(values[i].text.length).toBeGreaterThan(0);
    expect(values[i].lineHeight).toBeGreaterThanOrEqual(16);
    if(i<3)expect(values[i].x+values[i].width).toBeLessThanOrEqual(labels[i+1].x-4);
    const label=labels[i].getBounds(),value=values[i].getBounds();
    expect(intersects(label,value)).toBe(false);
    const panel=panelBounds(run);expect(intersects(panel,label)).toBe(false);expect(intersects(panel,value)).toBe(false);
  }
  const boxes=run.topControlObjects.filter((view:any)=>view.handlers.has('pointerdown'));
  expect(boxes).toHaveLength(run.layout.stackedHud?4:3);
  for(let i=0;i<boxes.length;i++){
    expect(boxes[i].height).toBe(44);expect(boxes[i].width).toBeGreaterThanOrEqual(44);
    expect(intersects(panelBounds(run),boxes[i].getBounds())).toBe(false);
    if(i)expect(intersects(boxes[i-1].getBounds(),boxes[i].getBounds())).toBe(false);
    expect(boxes[i].y+44).toBeLessThanOrEqual(run.layout.field.y-6);
  }
});

it.each([[844,390],[320,390],[320,360]])('fits every campaign road capsule, plot rim and authored tower support at %ix%i',(w,h)=>{
  const boss:any={id:1,name:'Mireheart Hydra',alive:true,isBoss:true,hp:100,maxHp:100};
  const run=makeBossRun(w,h,boss);
  for(const definition of CAMPAIGN_LEVELS){
    run.map=resolveCampaignMap(definition);run.refreshBossFit(boss);
    const f=run.layout.field,check=(point:{x:number;y:number})=>{
      const p=run.cameraView.project(point);
      expect(p.x).toBeGreaterThanOrEqual(f.x-1e-6);expect(p.x).toBeLessThanOrEqual(f.x+f.width+1e-6);
      expect(p.y).toBeGreaterThanOrEqual(f.y-1e-6);expect(p.y).toBeLessThanOrEqual(f.y+f.height+1e-6);
    };
    for(const p of run.map.waypoints)for(const dx of [-25,25])for(const dy of [-25,25])check({x:p.x+dx,y:p.y+dy});
    for(const p of run.map.buildable){
      for(const dx of [-23.5,23.5])for(const dy of [-23.5,23.5])check({x:p.x+dx,y:p.y+dy});
      for(const id of ['longbow','ember','glacier','starfire','tempest'])for(const level of [1,2,3,4]){
        const g=towerArtGeometry(id,level,1);
        check({x:p.x+g.left*1.25,y:p.y+(g.top-34)*1.25});
        check({x:p.x+(g.left+g.width)*1.25,y:p.y+(g.top+g.height)*1.25});
      }
    }
  }
});

it('keeps compact fit scale, center and boss cap stable across route movement, phase and frame changes',()=>{
  const boss:any={id:1,name:'Mireheart Hydra',alive:true,isBoss:true,hp:100,maxHp:100};
  const run=makeBossRun(844,390,boss,{top:0,right:0,bottom:0,left:0},(s,e)=>{s.map=resolveCampaignMap(getCampaignLevel(40)!);attachResponsiveBossArt(s,e);});
  const scale=run.cameraView.fitScale,center={...run.cameraView.center},cap=boss.view.getData('bossResponsiveCap');
  for(const p of run.map.waypoints){boss.x=p.x;boss.y=p.y;boss.hp=18;run.projectEntity(boss.view);run.updateBossBar();
    expect(run.cameraView.fitScale).toBe(scale);expect(run.cameraView.center).toEqual(center);expect(boss.view.getData('bossResponsiveCap')).toBe(cap);
  }
});

it.each([[844,390],[320,390],[360,360],[1280,720]])('retains the Classic trimmed boss renderer and stable cap at %ix%i',(w,h)=>{
  const boss:any={id:1,name:'Warlord',alive:true,isBoss:true,hp:100,maxHp:100};
  const run=makeBossRun(w,h,boss,{top:0,right:0,bottom:0,left:0},(scene,enemy)=>{
    const art=enemyArtContract('warlord'),frames=[...art.rightFrames,...art.leftFrames];
    const max=Math.max(...frames.map(f=>Math.max(f.width,f.height))),sourceScale=art.targetDimension/max;
    const view=display(),frame=art.rightFrames[0];
    const bounds=(factor=1)=>{
      const anchor=scene.cameraView.project(scene.enemyRenderPoint(enemy));
      const scale=sourceScale*view.scaleX*scene.cameraView.scale*factor;
      return {x:anchor.x-frame.width*scale/2,y:anchor.y-frame.height*scale,width:frame.width*scale,height:frame.height*scale};
    };
    const sprite={scaleX:sourceScale,originY:1,texture:{key:art.atlas},frame:{name:frame.name},getBounds:()=>bounds()};
    view.setData({enemyVisual:{sprite,atlas:art.atlas,frameRectangles:{right:art.rightFrames,left:art.leftFrames},maxVisualDimension:art.targetDimension,bobAmp:art.motion.bobAmp},isBoss:true,silhouetteEdge:{getBounds:()=>bounds(1.045)}});
    enemy.x=scene.map.waypoints[3].x;enemy.y=scene.map.waypoints[3].y;enemy.waypointIndex=4;enemy.view=view;
  });
  const before=run.cameraView.fitScale,center={...run.cameraView.center},cap=boss.view.getData('bossResponsiveCap');
  expect(run.bossArtBounds(boss).height).toBeGreaterThan(24);
  if(run.layout.compact){expect(run.cameraView.topHeadroom).toBe(0);expect(before).toBeGreaterThan(w>600?.30:.19);}
  for(const point of run.map.waypoints.slice(3,12)){
    boss.x=point.x;boss.y=point.y;run.projectEntity(boss.view);run.updateBossBar();
    expect(run.cameraView.fitScale).toBe(before);expect(run.cameraView.center).toEqual(center);expect(boss.view.getData('bossResponsiveCap')).toBe(cap);
  }
});

it.each([[844,390],[320,390]])('restores the preboss compact camera unless the player deliberately changes it at %ix%i',(w,h)=>{
  const boss:any={id:1,name:'Mireheart Hydra',alive:true,isBoss:true,hp:100,maxHp:100};
  const run=makeBossRun(w,h,boss,{top:0,right:0,bottom:0,left:0},(s,e)=>{s.map=resolveCampaignMap(getCampaignLevel(40)!);attachResponsiveBossArt(s,e);});
  run.enemies=[];run.updateBossBar();
  run.cameraView.zoom=3;run.cameraView.center={x:600,y:400};run.cameraView.resize(run.layout.field);
  const before={zoom:run.cameraView.zoom,center:{...run.cameraView.center}};
  run.enemies=[boss];run.updateBossBar();run.enemies=[];run.updateBossBar();
  expect(run.cameraView.zoom).toBe(before.zoom);expect(run.cameraView.center).toEqual(before.center);
  run.enemies=[boss];run.updateBossBar();run.cameraView.pan(20,-16);
  const normal=new BattlefieldView(gameLayout(w,h).field);normal.zoom=run.cameraView.zoom;normal.center={...run.cameraView.center};normal.resize(normal.field);
  run.enemies=[];run.updateBossBar();
  expect(run.cameraView.zoom).toBe(normal.zoom);expect(run.cameraView.center).toEqual(normal.center);
});

it('keeps the measured long-name HUD allocation and camera fixed across HP and phase changes',()=>{
  const boss:any={id:1,name:'The Hollow Warden, Keeper of the Whisperfen',alive:true,isBoss:true,hp:100,maxHp:100};
  const run=makeBossRun(320,390,boss);
  const field={...run.layout.field},center={...run.cameraView.center},scale=run.cameraView.fitScale;
  run.campaign={};run.campaignBosses={phase:()=>99};boss.hp=9;run.updateBossBar();
  expect(run.layout.field).toEqual(field);expect(run.cameraView.center).toEqual(center);expect(run.cameraView.fitScale).toBe(scale);
  expect(run.bossBarHp.text).toContain('Phase 99');expect(run.bossBarText.text).toBe(boss.name);
});
