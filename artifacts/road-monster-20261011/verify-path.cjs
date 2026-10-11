const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/ljour/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true}),results=[],errors=[];
 for(const [world,level] of [['classic',0],['borderkeep',1],['emberfall',11],['frostveil',21]]){
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/src/main.ts*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('const game = new Phaser.Game(config);','const game = new Phaser.Game(config); window.__pathGame=game;')});});
  await page.goto('http://127.0.0.1:5195/?qa='+(level?'campaign&level='+level:'placement'));
  await page.waitForFunction(()=>window.__pathGame?.scene.isActive('Game'),null,{timeout:60000});
  await page.locator('details[aria-label="Development QA controls"]').evaluateAll(nodes=>nodes.forEach(n=>n.remove()));
  await page.evaluate(()=>{
   const s=window.__pathGame.scene.getScene('Game');
   s.towers.forEach(t=>t.view?.destroy());s.towers=[];s.occupied.clear();s.placingTowerId=null;s.hideGhost();s.refreshPlots();
   s.paused=false;s.speed=1;if(!s.waveActive)s.startNextWave();
  });
  for(const seconds of [4,4,4]){
   await page.waitForTimeout(seconds*1000);
   const inspected=await page.evaluate(async()=>{
    const s=window.__pathGame.scene.getScene('Game');const {distanceToRoute}=await import('/src/game/campaign/maps.ts');
    return {world:s.map.id,gameTimeMs:s.gameTimeMs,enemies:s.enemies.filter(e=>e.alive).map(e=>{
     const v=e.view.getData('enemyVisual');
     return {id:e.campaignId??e.archetype,x:e.x,y:e.y,routeDistance:distanceToRoute(e,s.map.waypoints),atlas:v.atlas,originY:v.sprite.originY,walking:v.isWalking(),frame:v.sprite.frame.name};
    })};
   });
   assert(inspected.enemies.length>0,world+' no moving wave');
   for(const e of inspected.enemies){assert(e.routeDistance<1e-6,JSON.stringify(e));assert(e.walking,e.id+' not walking');if(level){assert(!e.atlas.includes('_temp_'));assert.equal(e.originY,0.9);}}
   await page.screenshot({path:path.join(__dirname,`path-${world}-${Math.round(inspected.gameTimeMs/1000)}.png`)});results.push(inspected);
  }
  await page.close();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(__dirname,'path-results.json'),JSON.stringify({results,errors},null,2));
 console.log(JSON.stringify({actualWaveCaptures:results.length,errors}));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
