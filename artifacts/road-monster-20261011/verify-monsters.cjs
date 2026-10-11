const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/ljour/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const OUT=__dirname;
(async()=>{
 const browser=await chromium.launch({headless:true}),results=[],errors=[];
 for(const [width,height] of [[1280,720],[390,844]]){
  const page=await browser.newPage({viewport:{width,height},hasTouch:width===390});
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/src/main.ts*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('const game = new Phaser.Game(config);','const game = new Phaser.Game(config); window.__monsterGame=game;')});});
  for(const [world,level] of [['classic',0],['borderkeep',10],['emberfall',20],['frostveil',30]]){
   await page.goto('http://127.0.0.1:5195/?qa='+(level?'campaign&level='+level:'placement'));
   await page.waitForFunction(()=>window.__monsterGame?.scene.isActive('Game'),null,{timeout:60000});
   await page.locator('details[aria-label="Development QA controls"]').evaluateAll(nodes=>nodes.forEach(n=>n.remove()));
   const ids=await page.evaluate(async world=>{
    const s=window.__monsterGame.scene.getScene('Game');s.paused=true;
    const {CAMPAIGN_ART_MANIFEST}=await import('/src/game/campaign/artManifest.ts');
    const {CAMPAIGN_ENEMIES}=await import('/src/game/campaign/enemies.ts');
    const {ENEMIES}=await import('/src/game/config/enemies.ts');
    const {buildEnemyVisual}=await import('/src/game/art/enemyArt.ts');
    const assets=CAMPAIGN_ART_MANIFEST.filter(a=>a.kind==='sheet'&&(a.path.includes('/'+world+'/')||a.id==='boss:'+({borderkeep:'hollow_warden',emberfall:'cinder_colossus',frostveil:'frostbound_matriarch'}[world])));
    const queued=assets.filter(a=>!s.textures.exists(a.key));
    if(queued.length)await new Promise((resolve,reject)=>{
     s.load.once('complete',resolve);s.load.once('loaderror',file=>reject(new Error('Load failed '+file.key)));
     for(const a of queued)s.load.spritesheet(a.key,a.path,{frameWidth:a.frameWidth,frameHeight:a.frameHeight});s.load.start();
    });
    s.enemies.forEach(e=>e.view?.setVisible(false));s.towers.forEach(t=>t.view?.setVisible(false));
    window.__monsterFixture={s,buildEnemyVisual,configs:world==='classic'?ENEMIES:CAMPAIGN_ENEMIES,assets,world,visuals:[],labels:[]};
    return world==='classic'?Object.keys(ENEMIES):assets.map(a=>a.id.split(':')[1]);
   },world);
   const states=world==='classic'?['walk','idle']:['idle','walk','attack','buff','special','armor_break','exposed_core','freeze_cast','phase_two','death'];
   for(const state of states)for(const facing of ['right','left']){
    const views=await page.evaluate(({ids,state,facing})=>{
     const f=window.__monsterFixture;
     for(const v of f.visuals)v.view.destroy();for(const label of f.labels)label.destroy();f.visuals=[];f.labels=[];
     const records=[];
     ids.forEach((id,index)=>{
      const asset=f.assets.find(a=>a.id.endsWith(':'+id));if(asset&&!asset.states[state])return;
      const cfg=f.configs[id],v=f.buildEnemyVisual(f.s,cfg.visualArchetype??id,f.world==='classic'?undefined:id);
      const x=105+(index%6)*150,y=index>=6?510:365;
      v.view.setPosition(x,y).setDepth(y);f.s.worldRoot.add(v.view);f.visuals.push(v);
      const label=f.s.add.text(x,y+12,id,{fontSize:'11px',color:'#ffffff',backgroundColor:'#111820'}).setOrigin(0.5,0).setDepth(y+1);f.s.worldRoot.add(label);f.labels.push(label);
      v.setFacing(facing==='left'?-1:1);v.setWalking(state==='walk');
      let duration=null;if(!['idle','walk'].includes(state))duration=v.playAction(state);
      records.push({id,atlas:v.atlas,state,facing,duration,frame:v.sprite.frame.name,scale:v.sprite.scaleX});
     });return records;
    },{ids,state,facing});
    if(!views.length)continue;
    for(const v of views){assert(!v.atlas.includes('_temp_'),v.id+' fallback');if(!['idle','walk'].includes(state))assert(v.duration>0);}
    await page.waitForTimeout(200);
    const advanced=await page.evaluate(()=>window.__monsterFixture.visuals.map(v=>({frame:v.sprite.frame.name,flip:v.sprite.flipX,facing:v.getFacing(),animation:v.sprite.anims.currentAnim?.key,key:v.sprite.texture.key})));
    for(const v of advanced){
      assert.equal(v.facing,facing);
      if(world!=='classic'){assert.equal(v.flip,facing==='left');assert(v.animation.endsWith('_'+state));}
      else if(state==='walk')assert(v.animation.endsWith('_'+facing));
    }
    await page.screenshot({path:path.join(OUT,`monsters-${world}-${state}-${facing}-${width}.png`)});
    results.push({width,height,world,state,facing,views,advanced});
   }
   // Exercise actual Phaser pause/resume and animation speed on all walking views.
   await page.evaluate(({ids})=>{
    const f=window.__monsterFixture;for(const v of f.visuals)v.view.destroy();f.visuals=ids.map((id,i)=>{
     const cfg=f.configs[id],v=f.buildEnemyVisual(f.s,cfg.visualArchetype??id,f.world==='classic'?undefined:id);v.view.setPosition(105+i*120,450);f.s.worldRoot.add(v.view);v.setWalking(true);return v;
    });
   },{ids});
   await page.waitForTimeout(160);
   const paused=await page.evaluate(()=>window.__monsterFixture.visuals.map(v=>{v.sprite.anims.pause();return v.sprite.frame.name;}));
   await page.waitForTimeout(300);
   assert.deepEqual(await page.evaluate(()=>window.__monsterFixture.visuals.map(v=>v.sprite.frame.name)),paused);
   await page.evaluate(()=>window.__monsterFixture.visuals.forEach(v=>{v.sprite.anims.timeScale=2;v.sprite.anims.resume();}));
   await page.waitForTimeout(110);
   const resumed=await page.evaluate(()=>window.__monsterFixture.visuals.map(v=>v.sprite.frame.name));assert(resumed.some((v,i)=>v!==paused[i]),world+' animation did not resume');
   results.push({width,height,world,pauseResumeSpeed:{paused,resumed}});
  }
  await page.close();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(OUT,'monster-runtime.json'),JSON.stringify({results,errors},null,2));
 console.log(JSON.stringify({cases:results.length,errors}));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
