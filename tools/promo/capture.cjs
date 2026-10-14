// Capture actual release scenes. The game reference is exposed only in this local capture browser.
const {chromium}=require('C:/Users/ljour/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.resolve('artifacts/promo');
fs.mkdirSync(path.join(ROOT,'captures'),{recursive:true});
const errors=[];
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
 const context=await browser.newContext({viewport:{width:1600,height:900}});
 await context.route('**/src/main.ts',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text()).replace('const game = new Phaser.Game(config);','const game = window.__promoGame = new Phaser.Game(config);')});});
 await context.route('**/api/**',async route=>{
  const u=new URL(route.request().url());
  if(!u.pathname.startsWith('/api/'))return route.continue();
  if(route.request().method()!=='GET')return route.fulfill({status:403,body:'Capture session is read-only'});
  try{const r=await fetch('https://aetherhold-defense.ljournllagas.workers.dev'+u.pathname+u.search);await route.fulfill({status:r.status,contentType:'application/json',body:await r.text()});}
  catch{await route.fulfill({status:503,body:'{}'});}
 });
 await context.addInitScript(()=>localStorage.setItem('aetherhold-ui-guide-v1',JSON.stringify({skipped:true,done:[]})));
 const page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 async function navigate(query){
  await page.goto('http://127.0.0.1:5179/'+query);
  await page.waitForFunction(()=>window.__promoGame?.scene?.isActive('MainMenu')||window.__promoGame?.scene?.isActive('Login')||window.__promoGame?.scene?.isActive('Game'),null,{timeout:15000}).catch(async e=>{await page.screenshot({path:path.join(ROOT,'capture-error.png')});console.log('Boot errors',errors,await page.locator('body').innerText());throw e;});
  if(await page.getByRole('button',{name:'Play as Guest',exact:true}).count()){
   await page.getByRole('textbox').fill('Defender');await page.getByRole('button',{name:'Play as Guest',exact:true}).click();
  }
  if(query.includes('qa=')&&!query.includes('qa=menu'))await page.waitForFunction(()=>window.__promoGame.scene.isActive('Game')||window.__promoGame.scene.isActive('Difficulty'));
  else await page.waitForFunction(()=>window.__promoGame.scene.isActive('MainMenu'));
  await page.waitForTimeout(450);
  await page.addStyleTag({content:'details[aria-label="Development QA controls"]{display:none!important}'});
  await page.evaluate(()=>{
   const walk=o=>{if(o.type==='Text'&&/DEV CAMPAIGN FIXTURE|DEV FIXTURE/.test(o.text))o.setVisible(false);if(o.list)o.list.forEach(walk)};
   window.__promoGame.scene.getScenes(true).forEach(s=>s.children.list.forEach(walk));
  });
 }
 async function shot(name){await page.screenshot({path:path.join(ROOT,'captures',name+'.png')});}
 async function record(name,seconds=6){
  const data=await page.evaluate(async seconds=>{
   const canvas=document.querySelector('canvas');const chunks=[];
   const stream=canvas.captureStream(30);
   const recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:10000000});
   recorder.ondataavailable=e=>chunks.push(e.data);
   const done=new Promise(resolve=>recorder.onstop=resolve);
   recorder.start();await new Promise(r=>setTimeout(r,seconds*1000));recorder.stop();await done;
   stream.getTracks().forEach(t=>t.stop());
   return await new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve(r.result.split(',')[1]);r.readAsDataURL(new Blob(chunks,{type:'video/webm'}));});
  },seconds);
  fs.writeFileSync(path.join(ROOT,'captures',name+'.webm'),Buffer.from(data,'base64'));
  await shot(name);console.log('Captured',name);
 }
 async function scene(key,data={},stage=null){
  await page.evaluate(({key,data,stage})=>{const g=window.__promoGame;for(const s of g.scene.getScenes(true))g.scene.stop(s.scene.key);g.scene.start(stage?'Preload':key,stage?{stage,destination:key,data}:data);},{key,data,stage});
  await page.waitForFunction(key=>window.__promoGame.scene.isActive(key),key);await page.waitForTimeout(350);
 }
 await navigate('?qa=menu');
 const metadata=await page.evaluate(async()=>{
  const [cfg,art,tower,power,evo,spec,enemy,assets]=await Promise.all([
   import('/src/game/campaign/config.ts'),import('/src/game/campaign/artManifest.ts'),import('/src/game/config/towers.ts'),
   import('/src/game/config/powerUps.ts'),import('/src/game/config/evolutions.ts'),import('/src/game/campaign/specializations.ts'),
   import('/src/game/campaign/enemies.ts'),import('/src/game/art/assetManifest.ts')]);
  const ids=[...new Set(cfg.CAMPAIGN_LEVELS.flatMap(l=>[...l.enemyIds,...(l.bossEnemyId?[l.bossEnemyId]:[])]))];
  return {worlds:cfg.CAMPAIGN_WORLDS,levels:cfg.CAMPAIGN_LEVELS,art:art.CAMPAIGN_ART_MANIFEST,towers:tower.TOWER_LIST,powerups:power.POWERUP_LIST,evolutions:Object.values(evo.EVOLUTIONS),specializations:spec.CAMPAIGN_SPECIALIZATIONS,enemies:ids.map(enemy.getCampaignEnemy),classicAssets:assets.STAGE_ASSETS};
 });
 if(metadata.levels.length!==100||metadata.worlds.length!==10)throw new Error('Release scope mismatch');
 fs.writeFileSync(path.join(ROOT,'metadata.json'),JSON.stringify(metadata,null,2));
 await record('menu',4);
 await scene('Difficulty');await record('difficulty',3);
 for(const [name,query] of [['placement','placement'],['selected','selected'],['normal','normal'],['heavy','heavy'],['classic-boss','boss'],['evolution','evolution'],['mastery','mastery'],['reward','reward'],['victory','victory']]){
  await navigate('?qa='+query);
  if(['normal','heavy','classic-boss'].includes(name))await page.evaluate(()=>{const s=window.__promoGame.scene.getScene('Game');s.paused=false;s.speed=1;for(let i=0;i<180;i++)s.simulateTick(1000/30);});
  if(name==='evolution'||name==='mastery')await page.evaluate(name=>{const s=window.__promoGame.scene.getScene('Game');s.openDetails(name==='evolution'?'evolve':'tower');},name);
  await record(name,6);
 }
 for(const world of metadata.worlds){
  await navigate('?qa=campaign&level='+(world.levelStart+8)+'&tier=3');
  await page.evaluate(()=>{const s=window.__promoGame.scene.getScene('Game');s.paused=false;s.updateHUD();});
  await record('world-'+world.id,5);
  await navigate('?qa=campaign-boss&level='+world.bossLevel+'&tier=3');
  await page.evaluate(()=>{const s=window.__promoGame.scene.getScene('Game');s.paused=false;s.updateHUD();});
  await record('boss-'+world.id,3);
 }
 await navigate('?qa=campaign-results&level=100');await record('campaign-result',4);
 await navigate('?qa=menu');
 await page.evaluate(async()=>{const {campaignRepository:r}=await import('/src/game/campaign/progress.ts');const {campaignScoreMetadata:m}=await import('/src/shared/campaignScoring.ts');for(let l=1;l<=100;l++)r.recordClear(l,m(l).perfectScore,20);});
 await scene('Campaign',{selectedLevel:100},'campaign');await record('campaign-map',4);
 console.log('Campaign methods',await page.evaluate(()=>Object.getOwnPropertyNames(Object.getPrototypeOf(window.__promoGame.scene.getScene('Campaign')))));
 await page.evaluate(()=>window.__promoGame.scene.getScene('Campaign').openPreparation?.());await shot('preparation');
 await scene('Progression',{tab:'campaign'});await record('progression',4);
 await scene('Leaderboard',{mode:'campaign'});await page.waitForTimeout(3500);await record('leaderboard',4);
 await navigate('?qa=menu');
 await page.setViewportSize({width:430,height:932});await page.waitForTimeout(700);await shot('phone-menu');
 await page.setViewportSize({width:1600,height:900});
 await navigate('?qa=normal');
 await page.evaluate(()=>{const s=window.__promoGame.scene.getScene('Game');s.paused=false;s.auto.setEnabled(true);s.speed=2;s.updateHUD();});
 await record('auto',5);
 await context.close();await browser.close();
 fs.writeFileSync(path.join(ROOT,'capture-report.json'),JSON.stringify({errors,levels:100,worlds:10,capturedAt:new Date().toISOString(),sourceRef:'origin/codex/campaign-v5-20261012',sourceCommit:'9aed4cb'},null,2));
 if(errors.length)throw new Error(errors.join('\n'));
})().catch(e=>{console.error(e);process.exit(1)});
