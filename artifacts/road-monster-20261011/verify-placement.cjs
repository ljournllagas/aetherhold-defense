const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/ljour/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const OUT = __dirname;
(async () => {
  const browser = await chromium.launch({headless:true});
  const results = [], errors = [];
  for (const [width,height] of [[1280,720],[390,844]]) {
    const page = await browser.newPage({viewport:{width,height},hasTouch:width===390});
    page.on('pageerror', e=>errors.push(e.message));
    await page.route('**/src/main.ts*',async route=>{
      const response=await route.fetch();
      await route.fulfill({response,body:(await response.text()).replace('const game = new Phaser.Game(config);','const game = new Phaser.Game(config); window.__placementGame = game;')});
    });
    for (let level=0;level<=30;level++) {
      await page.goto('http://127.0.0.1:5195/?qa='+(level?'campaign&level='+level:'placement'));
      await page.waitForFunction(()=>window.__placementGame?.scene.isActive('Game'),null,{timeout:60000});
      await page.locator('details[aria-label="Development QA controls"]').evaluateAll(nodes=>nodes.forEach(n=>n.remove()));
      const result=await page.evaluate(async()=>{
        const scene=window.__placementGame.scene.getScene('Game');
        const { CLASSIC_ROAD_ENVELOPE }=await import('/src/game/maps/map1.ts');
        const { plotRoadClearance,longestRoadCoverage }=await import('/src/game/maps/buildPlotPolicy.ts');
        const { TOWERS }=await import('/src/game/config/towers.ts');
        const road=scene.campaign?{route:scene.map.waypoints,radii:scene.map.waypoints.slice(1).map(()=>25)}:CLASSIC_ROAD_ENVELOPE;
        scene.paused=true;
        const plots=scene.map.buildable.map((p,i)=>({index:i,x:p.x,y:p.y,gap:plotRoadClearance(p,road),coverage:Math.min(...Object.values(TOWERS).map(t=>longestRoadCoverage(p,scene.map.waypoints,t.levels[0].range)))}));
        // Expose plot circles for terrain review without changing application art.
        scene.plotMarkers.forEach((m,i)=>m.setStrokeStyle(1,0x63ff7c,1).setFillStyle(0x63ff7c,0.1));
        return {id:scene.map.id,plots,towers:scene.towers.map(t=>({index:t.plotIndex,x:t.x,y:t.y})),scale:scene.cameraView.scale};
      });
      for(const p of result.plots){assert(p.gap>=6-1e-6&&p.gap<=14+1e-6,JSON.stringify(p));assert(p.coverage>=100);}
      for(const t of result.towers)assert.deepEqual([t.x,t.y],[result.plots[t.index].x,result.plots[t.index].y]);
      await page.screenshot({path:path.join(OUT,`placement-${level}-${width}x${height}.png`)});
      results.push({level,width,height,...result});
    }
    await page.close();
  }
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(OUT,'placement-results.json'),JSON.stringify({results,errors},null,2));
  console.log(JSON.stringify({maps:results.length,errors}));
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
