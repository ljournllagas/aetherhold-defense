const fs = require('fs');
const crypto = require('crypto');
const base = 'https://aetherhold-defense.ljournllagas.workers.dev';
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
async function get(path) {
  const response = await fetch(base + path);
  const bytes = Buffer.from(await response.arrayBuffer());
  return { path, status: response.status, bytes: bytes.length, sha256: sha(bytes), contentType: response.headers.get('content-type'), cacheControl: response.headers.get('cache-control'), cfCacheStatus: response.headers.get('cf-cache-status'), data: bytes };
}
(async () => {
  const ledger = JSON.parse(fs.readFileSync('artifacts/campaign-final-art-20261012/integration/asset-status.json'));
  const html = await get('/');
  const jsPath = html.data.toString().match(/src="([^\"]+\.js)"/)[1];
  const js = await get(jsPath);
  const localJs = fs.readFileSync('dist' + jsPath);
  if (html.status !== 200 || js.status !== 200 || js.sha256 !== sha(localJs)) throw Error('HTML/bundle mismatch');
  const healthResponse = await get('/api/health');
  const health = JSON.parse(healthResponse.data.toString());
  if (healthResponse.status !== 200 || health.scoreVersion !== 3) throw Error('health mismatch');
  const assets = [];
  for (const row of ledger.assets.filter(x => x.promoted)) {
    let result = await get(row.promoted.path);
    if (result.status !== 200 || result.sha256 !== row.promoted.sha256 || !result.contentType.includes('image/png')) throw Error(row.id);
    result = await get(row.promoted.path);
    if (result.sha256 !== row.promoted.sha256) throw Error(row.id);
    delete result.data;
    assets.push({ id: row.id, worldId: row.worldId, ...result, match: true });
  }
  delete html.data; delete js.data; delete healthResponse.data;
  const result = { verifiedAtUtc: new Date().toISOString(), productionUrl: base, html, bundle: js, exactLocalBuildMatch: true, health: { status: healthResponse.status, ...health }, assets, newAssetsVerified: assets.filter(x => x.worldId === 'aether_crown').length, previousAssetsVerified: assets.filter(x => x.worldId !== 'aether_crown').length };
  const { chromium } = require('C:/Users/ljour/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
  const browser = await chromium.launch({headless:true,executablePath:'C:/Users/ljour/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe',args:['--no-sandbox']});
  const page = await browser.newPage({viewport:{width:1440,height:900}});
  await page.goto(base,{waitUntil:'networkidle'});
  const text = await page.locator('body').innerText();
  await page.screenshot({path:'artifacts/campaign-final-art-20261012/integration/o8-live-page.png'});
  result.render = { title:await page.title(), visibleText:text, signInGateObserved:/sign in|sign-in|google/i.test(text), authenticatedGameplayVerified:false, accountWrites:false };
  result.assetRenders=[];
  for(const world of ['aether_crown']) {
    await page.goto(base+'/assets/campaign/world-map/'+world+'-v2.png');
    const dimensions=await page.locator('img').evaluate(x=>({width:x.naturalWidth,height:x.naturalHeight,complete:x.complete}));
    if(dimensions.width!==768||dimensions.height!==432||!dimensions.complete)throw Error('image render '+world);
    await page.screenshot({path:'artifacts/campaign-final-art-20261012/integration/o8-live-'+world+'.png'});
    result.assetRenders.push({world,...dimensions});
  }
  await browser.close();
  fs.writeFileSync('artifacts/campaign-final-art-20261012/integration/o8-live-check.json', JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({bundle:js, health:result.health,newAssets:result.newAssetsVerified,world4:result.previousAssetsVerified}));
})().catch(e => {console.error(e); process.exit(1)});
