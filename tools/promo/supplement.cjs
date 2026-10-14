const {chromium}=require('C:/Users/ljour/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs');
const out='artifacts/promo/captures/';
(async()=>{
 const browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:1600,height:900}});const page=await context.newPage();
 await page.route('**/src/main.ts',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text()).replace('const game = new Phaser.Game(config);','const game = window.__promoGame = new Phaser.Game(config);')});});
 await page.route('**/api/**',async route=>{const u=new URL(route.request().url());if(!u.pathname.startsWith('/api/'))return route.continue();if(route.request().method()!=='GET')return route.fulfill({status:403,body:'Read-only capture'});const r=await fetch('https://aetherhold-defense.ljournllagas.workers.dev'+u.pathname+u.search);await route.fulfill({status:r.status,contentType:'application/json',body:await r.text()});});
 await page.addInitScript(()=>localStorage.setItem('aetherhold-ui-guide-v1',JSON.stringify({skipped:true,done:[]})));
 async function enter(q){await page.goto('http://127.0.0.1:5179/?qa='+q);await page.waitForTimeout(1500);if(await page.getByRole('textbox').count()){await page.getByRole('textbox').fill('Defender');await page.getByRole('button',{name:'Play as Guest',exact:true}).click();}await page.waitForFunction(q=>window.__promoGame.scene.isActive(q==='menu'?'MainMenu':'Game'),q);await page.waitForTimeout(450);await page.addStyleTag({content:'details[aria-label="Development QA controls"]{display:none!important}'});}
 async function record(name,seconds=4){const b64=await page.evaluate(async seconds=>{const c=document.querySelector('canvas'),stream=c.captureStream(30),chunks=[],r=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:10000000});r.ondataavailable=e=>chunks.push(e.data);const done=new Promise(resolve=>r.onstop=resolve);r.start();await new Promise(resolve=>setTimeout(resolve,seconds*1000));r.stop();await done;stream.getTracks().forEach(t=>t.stop());return await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(new Blob(chunks));});},seconds);fs.writeFileSync(out+name+'.webm',Buffer.from(b64,'base64'));await page.screenshot({path:out+name+'.png'});console.log('Captured',name);}
 await enter('selected');
 await page.evaluate(()=>{const s=window.__promoGame.scene.getScene('Game');s.gold=10000;setTimeout(()=>s.upgradeSelected(),700);setTimeout(()=>s.upgradeSelected(),1700);setTimeout(()=>s.upgradeSelected(),2700);});
 await record('upgrade-action',4);
 await enter('evolution');
 await page.evaluate(async()=>{
  const g=window.__promoGame;const {buildTowerVisual,decorateEvolution}=await import('/src/game/art/towerArt.ts');const {EVOLUTIONS}=await import('/src/game/config/evolutions.ts');
  g.scene.pause('Game');g.scene.getScene('Game').children.list.forEach(o=>o.setVisible?.(false));g.scene.add('PromoGallery',{create(){this.cameras.main.setBackgroundColor('#080e14');Object.values(EVOLUTIONS).forEach((e,i)=>{const x=160+(i%5)*320,y=390+Math.floor(i/5)*415;const v=buildTowerVisual(this,e.towerId,4);v.view.setData('displayBounds',v.displayBounds);decorateEvolution(this,v.view,e.id,3);v.view.setPosition(x,y).setScale(2.4);this.add.text(x,y+35,e.name,{fontFamily:'Cinzel',fontSize:20,color:'#efd28c'}).setOrigin(.5,0);});}},true);
 });
 await page.waitForTimeout(300);await page.screenshot({path:out+'evolutions-art.png'});
 await enter('menu');
 await page.evaluate(async()=>{const {campaignRepository:r}=await import('/src/game/campaign/progress.ts');const {campaignScoreMetadata:m}=await import('/src/shared/campaignScoring.ts');for(let l=1;l<=100;l++)r.recordClear(l,m(l).perfectScore,20);const g=window.__promoGame;g.scene.stop('MainMenu');g.scene.start('Preload',{stage:'campaign',destination:'Campaign',data:{selectedLevel:100}});});
 await page.waitForFunction(()=>window.__promoGame.scene.isActive('Campaign'));
 await page.evaluate(()=>window.__promoGame.scene.getScene('Campaign').openCodex());await page.waitForTimeout(250);await page.screenshot({path:out+'codex.png'});
 await page.evaluate(()=>window.__promoGame.scene.getScene('Campaign').scene.start('Settings'));await page.waitForTimeout(400);await page.screenshot({path:out+'settings.png'});
 await page.evaluate(()=>window.__promoGame.scene.getScene('Settings').scene.start('Help'));await page.waitForTimeout(350);await page.screenshot({path:out+'help.png'});
 await page.evaluate(()=>window.__promoGame.scene.getScene('Help').scene.start('Leaderboard',{mode:'campaign'}));await page.waitForTimeout(6000);await record('leaderboard',4);
 await context.close();await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
