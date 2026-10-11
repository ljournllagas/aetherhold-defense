import { expect, it, vi } from 'vitest';
import { GameScene } from '../src/game/scenes/GameScene.ts';
import { gameLayout } from '../src/game/ui/layout.ts';
import { Tower } from '../src/game/entities/Tower.ts';
vi.mock('phaser', () => ({ default: { Scene: class { constructor(_key?: string) {} } } }));

function display(x = 0, y = 0, width = 0, height = 18): any {
  const value: any = { x, y, width, height, list: [], visible: true, text: '', handlers: new Map(),
    on(event: string, handler: (...args: any[]) => void) { this.handlers.set(event,handler); return this; },
    add(items: any) { this.list.push(...(Array.isArray(items) ? items : [items])); return this; },
    setPosition(x: number, y: number) { this.x = x; this.y = y; return this; },
    setText(text: string) { this.text = text; return this; },
    setVisible(show: boolean) { this.visible = show; return this; },
    setSize(w: number, h: number) { this.width = w; this.height = h; return this; },
    setDisplaySize(w: number, h: number) { this.width = w; this.height = h; return this; }
  };
  const proxy = new Proxy(value, { get(t, key) { return key in t ? t[key] : () => proxy; } });
  return proxy;
}

it.each([[360,360],[390,844],[844,390],[768,1024],[1024,768],[1366,768]])('keeps boss information inside the field at %ix%i', (w,h) => {
  const run: any = new GameScene(); run.init({ difficulty: 'medium' });
  run.layout = gameLayout(w,h,{top:12,right:8,bottom:20,left:8});
  run.uiRoot = display(); run.drawCatalog = () => {}; run.updateHUD = () => {};
  run.add = { container: (x: number,y: number) => display(x,y),
    text: (x: number,y: number) => display(x,y), rectangle: (x: number,y: number,w: number,h: number) => display(x,y,w,h),
    graphics: () => display(), image: () => display() };
  run.enemies = [{ name:'The Hollow Warden',alive:true,isBoss:true,hp:25,maxHp:100 }];
  run.drawBossBar(); run.updateBossBar();
  expect(run.bossBar.y).toBeGreaterThanOrEqual(run.layout.field.y);
  expect(run.bossBar.y + 64).toBeLessThanOrEqual(run.layout.field.y + run.layout.field.height);
  expect(run.bossBarText.text).toBe('The Hollow Warden');
  expect(run.bossBarHp.text).toContain('HP 25%');
  run.enemies = []; run.updateBossBar(); expect(run.bossBar.visible).toBe(false);
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
