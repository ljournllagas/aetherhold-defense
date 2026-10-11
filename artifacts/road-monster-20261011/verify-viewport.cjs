const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('C:/Users/ljour/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const { chromium } = require('C:/Users/ljour/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'artifacts/road-monster-20261011/viewport');
const BASE_URL = process.env.V9_QA_URL || 'http://127.0.0.1:5195/';
const STORAGE_KEY = 'aetherhold-campaign-v1';
const VIEWPORTS = [[1440,900],[1280,720],[1024,768],[844,390],[390,844],[360,640]];
const SOURCE_FILES = [
  'src/game/ui/ViewportMask.ts',
  'src/game/scenes/CampaignScene.ts',
  'src/game/scenes/GameScene.ts',
  'src/game/scenes/LeaderboardScene.ts',
  'src/game/scenes/MainMenuScene.ts',
  'src/game/scenes/DifficultyScene.ts',
  'src/game/campaign/mapLayout.ts',
  'src/game/ui/layout.ts',
  'src/game/qa.ts'
];
const report = {
  taskId: 'V9', capturedAt: new Date().toISOString(), baseUrl: BASE_URL,
  browser: 'Bundled Playwright with installed Microsoft Edge, headless; one isolated context per scenario; Phaser WebGL required.',
  sourceHashes: {}, sourceHashesAfter: {}, sourceStable: false,
  rendererTypes: [], mapCases: [], battleCases: [], leaderboardCases: [],
  safety: { apiMutationAttempts: [], pageErrors: [], consoleErrors: [], consoleWarnings: [], failedRequests: [], badResponses: [] },
  issues: []
};

function hashSources() {
  return Object.fromEntries(SOURCE_FILES.map(file => [file, crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, file))).digest('hex')]));
}

function campaignProfile() {
  const levels = {};
  for (let level = 1; level <= 30; level++) levels[level] = {
    completed: true, completionStar: true, livesStar: true, scoreStar: true,
    bestScore: 48250 + level * 100, bestRemainingLives: 20
  };
  return {
    campaignVersion: 1, progressionVersion: 1, highestUnlockedLevel: 30, levels,
    worldSigils: ['border_sigil','ember_sigil','frost_sigil'], unlockedFeatures: [],
    choices: { longbow: null, ember: null, glacier: null, starfire: null, tempest: null },
    targeting: { longbow: 'first', ember: 'first', glacier: 'first', starfire: 'first', tempest: 'first' },
    preparationPresets: []
  };
}

function scoreFixture() {
  return Array.from({ length: 20 }, (_, i) => ({
    id: i + 1, playerName: `FixturePlayer${String(i + 1).padStart(2, '0')}`,
    difficulty: ['easy','medium','hard'][i % 3], highestWave: 8 + i, wavesCompleted: 8 + i,
    enemiesKilled: 32 + i * 5, bossesKilled: 0, remainingLives: 25 - (i % 12),
    gameDurationSeconds: 300 + i * 18, runId: `v9-fixture-run-${String(i + 1).padStart(2, '0')}`,
    gameVersion: 'v9-fixture', scoreVersion: 3, outcome: 'victory', siegeBossesDefeated: 0,
    finalScore: 50000 - i * 1200, createdAt: `2026-10-${String(10 - Math.floor(i / 2)).padStart(2, '0')}T12:00:00.000Z`
  }));
}

function campaignLayout(width, height) {
  const compact = height < 520, narrowHeader = !compact && width < 520;
  const mapY = compact ? 104 : narrowHeader ? 160 : 152;
  const detailReserve = compact ? Math.min(196, Math.max(height < 380 ? 156 : 180, Math.floor(height * 0.48))) : height < 700 ? 192 : 170;
  const mapHeight = Math.max(compact ? 80 : 120, Math.min(compact ? 200 : 328, height * 0.42, height - mapY - 20 - detailReserve));
  return { x: 16, y: mapY, width: width - 32, height: mapHeight };
}

async function setupContext(browser, viewport, tag, options = {}) {
  const context = await browser.newContext({ viewport: { width: viewport[0], height: viewport[1] }, deviceScaleFactor: 1, isMobile: viewport[0] <= 430, hasTouch: options.hasTouch ?? viewport[0] <= 430, reducedMotion: options.reducedMotion ? 'reduce' : 'no-preference' });
  if (options.seedCampaign !== false) await context.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: STORAGE_KEY, value: campaignProfile() });
  await context.route('**/src/main.ts*', async route => {
    const response = await route.fetch();
    const body = await response.text();
    const anchor = 'const game = new Phaser.Game(config);';
    assert(body.includes(anchor), `${tag}: expected DEV bootstrap anchor is missing`);
    await route.fulfill({ response, body: body.replace(anchor, anchor + '\nwindow.__v9Game = game;') });
  });
  await context.route('**/api/**', async route => {
    const request = route.request();
    const method = request.method().toUpperCase();
    const pathname = new URL(request.url()).pathname;
    if (!pathname.startsWith('/api/')) { await route.continue(); return; }
    if (['POST','PUT','PATCH','DELETE'].includes(method)) {
      report.safety.apiMutationAttempts.push({ tag, method, url: request.url() });
      await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'V9 verification blocks API writes.' }) });
      return;
    }
    if (options.leaderboard === 'filled' && pathname === '/api/leaderboard') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ scores: scoreFixture(), scoreVersion: 3 }) });
      return;
    }
    if (options.leaderboard === 'filled' && pathname === '/api/health') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
      return;
    }
    await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'V9 verification blocks API access.' }) });
  });
  const page = await context.newPage();
  page.on('pageerror', error => report.safety.pageErrors.push({ tag, error: error.stack || error.message }));
  page.on('console', message => {
    if (message.type() === 'error') report.safety.consoleErrors.push({ tag, error: message.text() });
    if (message.type() === 'warning' || message.type() === 'warn') report.safety.consoleWarnings.push({ tag, warning: message.text() });
  });
  page.on('requestfailed', request => report.safety.failedRequests.push({ tag, url: request.url(), error: request.failure()?.errorText }));
  page.on('response', response => {
    if (response.status() >= 400) report.safety.badResponses.push({ tag, status: response.status(), url: response.url() });
  });
  return { context, page, tag, viewport };
}

async function waitScene(page, key, timeout = 45000) {
  await page.waitForFunction(key => window.__v9Game?.scene?.isActive(key), key, { timeout });
  await page.waitForTimeout(250);
}

async function openPage(session, query = '') {
  const response = await session.page.goto(BASE_URL + query, { waitUntil: 'domcontentloaded', timeout: 60000 });
  assert(response?.ok(), `${session.tag}: app shell returned ${response?.status()}`);
  await session.page.waitForFunction(() => window.__v9Game?.renderer && document.querySelector('canvas'), null, { timeout: 30000 });
  await waitScene(session.page, 'MainMenu');
  const renderer = await session.page.evaluate(() => ({ type: window.__v9Game.renderer.type, width: window.__v9Game.scale.width, height: window.__v9Game.scale.height }));
  report.rendererTypes.push({ tag: session.tag, ...renderer });
  assert.equal(renderer.type, 2, `${session.tag}: Phaser did not use WebGL renderer (type ${renderer.type})`);
}

async function inspectScene(page, key, expression = '') {
  return page.evaluate(({ key, expression }) => {
    const game = window.__v9Game, scene = game?.scene.getScene(key);
    if (!scene) return null;
    const flat = [];
    const visit = list => { for (const object of list || []) { flat.push(object); if (Array.isArray(object.list)) visit(object.list); } };
    visit(scene.children.list);
    const mask = scene.mapMask || scene.fieldMask || scene.rowMask || null;
    const target = scene.mapRoot || scene.worldRoot || scene.rowLayer || null;
    const external = target?.filters?.external || null;
    const texts = flat.filter(object => object.type === 'Text').map(object => ({ text: object.text, bounds: object.getBounds(), visible: object.visible }));
    const nodeHits = scene.mapRoot?.list?.filter(object => object.type === 'Rectangle' && object.input?.enabled && object.width === 44 && object.height === 44) || [];
    const rows = scene.rowViews || [];
    const result = {
      active: game.scene.isActive(key), rendererType: game.renderer.type,
      scale: { width: game.scale.width, height: game.scale.height },
      selectedLevel: scene.selectedLevel ?? null,
      mapRoot: scene.mapRoot ? { x: scene.mapRoot.x, y: scene.mapRoot.y, scaleX: scene.mapRoot.scaleX, scaleY: scene.mapRoot.scaleY } : null,
      field: scene.layout?.field || null,
      mapBounds: scene.mapRoot ? null : undefined,
      bodyTop: scene.bodyTop ?? null, bodyBottom: scene.bodyBottom ?? null,
      panelX: scene.panelX ?? null, panelWidth: scene.panelWidth ?? null,
      scrollOffset: scene.scrollOffset ?? null, maxScroll: scene.maxScroll ?? null,
      rowHeight: scene.rowHeight ?? null, visibleRowCount: scene.visibleRowCount ?? null,
      records: scene.records?.length ?? null, rowCount: rows.length,
      rowVisible: rows.map(row => row.visible),
      mode: scene.campaign?.definition?.worldId ? { worldId: scene.campaign.definition.worldId, level: scene.campaign.definition.level } : scene.campaign ? 'campaign' : 'classic',
      paused: scene.paused ?? null, modal: scene.modal ? scene.modal.getData('pauseMenu') === true ? 'pause' : 'other' : null,
      zoom: scene.cameraView?.zoom ?? null, center: scene.cameraView?.center ?? null,
      mask: mask ? {
        destroyed: mask.destroyed, filterCount: mask.filterList?.list?.length ?? null,
        filterPresent: !!mask.filter && (mask.filterList?.list?.includes(mask.filter) ?? false),
        filterActive: mask.filter?.active ?? null, autoUpdate: mask.filter?.autoUpdate ?? null,
        viewTransform: mask.filter?.viewTransform ?? null, hasMainCamera: mask.filter?.viewCamera === scene.cameras.main,
        maskGameObjectIsSource: mask.filter?.maskGameObject === mask.source,
        filterNeedsUpdate: mask.filter?.needsUpdate ?? null,
        sourceVisible: mask.source?.visible ?? null, sourceInSceneList: !!mask.source && scene.children.list.includes(mask.source),
        sourceHasScene: !!mask.source?.scene, externalKeys: external ? Object.keys(external) : [],
        externalCount: external?.list?.length ?? null,
        externalContainsControllerFilter: !!mask.filter && (external?.list?.includes(mask.filter) ?? false)
      } : null,
      allText: texts,
      nodeHits: nodeHits.map((node, index) => ({ level: index + 1, x: node.x, y: node.y })),
      inputListeners: { pointerdown: scene.input?.listenerCount?.('pointerdown') ?? null, pointermove: scene.input?.listenerCount?.('pointermove') ?? null, pointerup: scene.input?.listenerCount?.('pointerup') ?? null }
    };
    return result;
  }, { key, expression });
}

async function clickText(page, sceneKey, text, occurrence = 0, input = 'mouse') {
  const matches = await page.evaluate(({ sceneKey, text }) => {
    const scene = window.__v9Game?.scene.getScene(sceneKey), result = [];
    const visit = list => { for (const object of list || []) { if (object.type === 'Text' && object.text === text && object.visible) { const b = object.getBounds(); result.push({ x: b.x, y: b.y, width: b.width, height: b.height }); } if (Array.isArray(object.list)) visit(object.list); } };
    if (scene) visit(scene.children.list);
    return result;
  }, { sceneKey, text });
  assert(matches.length > occurrence, `${sceneKey}: visible text ${JSON.stringify(text)} not found; got ${matches.map(m => JSON.stringify(m)).join(',')}`);
  const bounds = matches[occurrence];
  if (input === 'touch') await page.touchscreen.tap(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  else await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.waitForTimeout(200);
}

async function openCampaignMap(session) {
  await clickText(session.page, 'MainMenu', 'Campaign');
  await waitScene(session.page, 'Campaign');
  await session.page.waitForFunction(() => window.__v9Game.scene.getScene('Campaign')?.mapMask && window.__v9Game.scene.getScene('Campaign')?.mapRoot, null, { timeout: 30000 });
}

async function screenshot(session, name) {
  const filepath = path.join(OUT, `${name}.png`);
  await session.page.screenshot({ path: filepath, animations: 'disabled' });
  return filepath;
}

async function rawImage(filepath) {
  return sharp(fs.readFileSync(filepath)).raw().toBuffer({ resolveWithObject: true });
}

function countDiff(a, b, regions, threshold = 0) {
  assert.equal(a.info.width, b.info.width, 'screenshot widths differ');
  assert.equal(a.info.height, b.info.height, 'screenshot heights differ');
  let changed = 0;
  for (const region of regions) {
    const x0 = Math.max(0, Math.floor(region.x)), y0 = Math.max(0, Math.floor(region.y));
    const x1 = Math.min(a.info.width, Math.ceil(region.x + region.width)), y1 = Math.min(a.info.height, Math.ceil(region.y + region.height));
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const index = (y * a.info.width + x) * a.info.channels;
      if (Math.abs(a.data[index] - b.data[index]) > threshold || Math.abs(a.data[index + 1] - b.data[index + 1]) > threshold || Math.abs(a.data[index + 2] - b.data[index + 2]) > threshold) changed++;
    }
  }
  return changed;
}

function mapOutsideRegions(width, height, bounds) {
  const regions = [];
  if (bounds.x > 0) regions.push({ x: 0, y: bounds.y, width: bounds.x, height: bounds.height });
  const right = bounds.x + bounds.width;
  if (right < width) regions.push({ x: right, y: bounds.y, width: width - right, height: bounds.height });
  return regions;
}

function mapOutsideEdgeRegions(width, height, bounds) {
  const edge = 5;
  const top = Math.floor(bounds.y);
  const bottom = Math.ceil(bounds.y + bounds.height);
  return [
    { x: bounds.x, y: Math.max(0, top - edge), width: bounds.width, height: Math.min(edge, top) },
    { x: bounds.x, y: bottom, width: bounds.width, height: Math.min(edge, height - bottom) }
  ].filter(region => region.width > 0 && region.height > 0);
}

function assertSingleMask(state, tag) {
  assert(state?.mask, `${tag}: expected a live ViewportMaskController`);
  assert.equal(state.mask.destroyed, false, `${tag}: live controller is marked destroyed`);
  assert.equal(state.mask.filterCount, 1, `${tag}: expected one filter in controller-owned list; got ${state.mask.filterCount}`);
  assert.equal(state.mask.externalCount, 1, `${tag}: expected one external filter for the target root; got ${state.mask.externalCount}`);
  assert.equal(state.mask.filterPresent, true, `${tag}: controller filter is absent from its FilterList`);
  assert.equal(state.mask.externalContainsControllerFilter, true, `${tag}: target root does not contain the controller filter`);
  assert.equal(state.mask.sourceInSceneList, false, `${tag}: mask source leaked onto the scene display list`);
  assert.equal(state.mask.autoUpdate, false, `${tag}: WebGL mask unexpectedly enables repeated source updates`);
  assert.equal(state.mask.viewTransform, 'world', `${tag}: mask does not use world-space external rendering`);
  assert.equal(state.mask.hasMainCamera, true, `${tag}: mask is not rendered through the scene main camera`);
  assert.equal(state.mask.maskGameObjectIsSource, true, `${tag}: WebGL filter is not using the intended source object`);
}

async function nodePoint(page, level) {
  return page.evaluate(level => {
    const scene = window.__v9Game.scene.getScene('Campaign'), rect = scene.mapRoot.list.filter(o => o.type === 'Rectangle' && o.input?.enabled && o.width === 44 && o.height === 44)[level - 1];
    return { x: scene.mapRoot.x + rect.x * scene.mapRoot.scaleX, y: scene.mapRoot.y + rect.y * scene.mapRoot.scaleY };
  }, level);
}

async function storeOldMask(page, sceneKey, property) {
  await page.evaluate(({ sceneKey, property }) => {
    window.__v9OldMask = window.__v9Game.scene.getScene(sceneKey)[property];
    window.__v9OldFilterList = window.__v9OldMask?.filterList ?? null;
  }, { sceneKey, property });
}

async function oldMaskState(page) {
  return page.evaluate(() => {
    const old = window.__v9OldMask;
    return old ? {
      destroyed: old.destroyed, controllerFilterCleared: old.filter === null,
      oldFilterListCount: window.__v9OldFilterList?.list?.length ?? null,
      sourceDestroyed: old.source?.isDestroyed === true, sourceInactive: old.source?.active === false,
      sourceInvisible: old.source?.visible === false, sourceSceneCleared: old.source?.scene == null,
      sourceDisplayListCleared: old.source?.displayList === null
    } : null;
  });
}

function assertMaskCleanup(state, tag) {
  assert(state, `${tag}: prior mask controller was not retained for cleanup inspection`);
  assert.equal(state.destroyed, true, `${tag}: old mask controller was not destroyed`);
  assert.equal(state.controllerFilterCleared, true, `${tag}: old controller still owns its filter`);
  assert.equal(state.oldFilterListCount, 0, `${tag}: old external FilterList still contains a filter`);
  assert.equal(state.sourceDestroyed, true, `${tag}: old mask source was not destroyed`);
  assert.equal(state.sourceInactive, true, `${tag}: old mask source remains active`);
  assert.equal(state.sourceInvisible, true, `${tag}: old mask source remains visible`);
  assert.equal(state.sourceSceneCleared, true, `${tag}: old source still retains its scene`);
  assert.equal(state.sourceDisplayListCleared, true, `${tag}: old source remains on a display list`);
}

async function verifyMap(browser) {
  const tag = 'campaign-map-resize-rotation-reentry';
  const session = await setupContext(browser, VIEWPORTS[0], tag);
  try {
    await openPage(session);
    await openCampaignMap(session);
    const cases = [];
    for (let i = 0; i < VIEWPORTS.length; i++) {
      const [width, height] = VIEWPORTS[i];
      if (i > 0) {
        await storeOldMask(session.page, 'Campaign', 'mapMask');
        await session.page.setViewportSize({ width, height });
        await session.page.waitForFunction(({ width, height }) => {
          const game = window.__v9Game, scene = game?.scene.getScene('Campaign');
          return game?.scale.width === width && game?.scale.height === height && game.scene.isActive('Campaign') && scene?.mapMask && scene?.mapRoot && scene.mapMask !== window.__v9OldMask;
        }, { width, height }, { timeout: 30000 });
        await session.page.waitForTimeout(350);
      }
      const state = await inspectScene(session.page, 'Campaign');
      assert.equal(state.scale.width, width, `${width}x${height}: game scale width mismatches viewport`);
      assert.equal(state.scale.height, height, `${width}x${height}: game scale height mismatches viewport`);
      assertSingleMask(state, `${width}x${height} map`);
      const bounds = campaignLayout(width, height);
      await clickText(session.page, 'Campaign', 'Borderkeep');
      const focused = await inspectScene(session.page, 'Campaign');
      assert.equal(focused.selectedLevel, 10, `${width}x${height}: Borderkeep tab did not focus its last unlocked level`);
      assertSingleMask(focused, `${width}x${height} map after world focus`);
      await session.page.mouse.move(0, 0);
      const prePath = await screenshot(session, `map-${width}x${height}-before-pan`);

      const hidden = await session.page.evaluate(({ bounds, width }) => {
        const scene = window.__v9Game.scene.getScene('Campaign');
        const hits = scene.mapRoot.list.filter(o => o.type === 'Rectangle' && o.input?.enabled && o.width === 44 && o.height === 44);
        for (let i = 0; i < hits.length; i++) {
          const hit = hits[i], centerX = scene.mapRoot.x + hit.x * scene.mapRoot.scaleX, centerY = scene.mapRoot.y + hit.y * scene.mapRoot.scaleY;
          const testX = bounds.x + bounds.width + 2;
          if (testX < width && testX >= centerX - 22 && testX < centerX + 22 && centerY >= bounds.y && centerY < bounds.y + bounds.height) return { level: i + 1, x: testX, y: centerY };
        }
        return null;
      }, { bounds, width });
      let hiddenPointer = { exercised: false };
      if (hidden) {
        await session.page.mouse.click(hidden.x, hidden.y);
        await session.page.waitForTimeout(120);
        const afterHidden = await inspectScene(session.page, 'Campaign');
        assert.equal(afterHidden.selectedLevel, 10, `${width}x${height}: partially hidden node ${hidden.level} selected outside the map pane`);
        hiddenPointer = { exercised: true, level: hidden.level, point: { x: hidden.x, y: hidden.y }, selectedLevelAfter: afterHidden.selectedLevel };
      }

      const visibleCandidate = await session.page.evaluate(({ bounds, current }) => {
        const scene = window.__v9Game.scene.getScene('Campaign');
        const hits = scene.mapRoot.list.filter(o => o.type === 'Rectangle' && o.input?.enabled && o.width === 44 && o.height === 44);
        let candidate = null;
        for (let i = 0; i < hits.length; i++) {
          const hit = hits[i], x = scene.mapRoot.x + hit.x * scene.mapRoot.scaleX, y = scene.mapRoot.y + hit.y * scene.mapRoot.scaleY;
          if (i + 1 !== current && x >= bounds.x + 22 && x < bounds.x + bounds.width - 22 && y >= bounds.y + 22 && y < bounds.y + bounds.height - 22 && (!candidate || x > candidate.x)) candidate = { level: i + 1, x, y };
        }
        return candidate;
      }, { bounds, current: 10 });
      assert(visibleCandidate, `${width}x${height}: no fully visible node available for pointer acceptance`);
      await session.page.mouse.click(visibleCandidate.x, visibleCandidate.y);
      await session.page.waitForFunction(level => window.__v9Game.scene.getScene('Campaign')?.selectedLevel === level, visibleCandidate.level, { timeout: 10000 });
      const selected = await inspectScene(session.page, 'Campaign');
      assert.equal(selected.selectedLevel, visibleCandidate.level, `${width}x${height}: visible node hit did not select`);
      assertSingleMask(selected, `${width}x${height} after node selection`);
      await session.page.mouse.move(0, 0);
      const selectedPath = await screenshot(session, `map-${width}x${height}-after-node-selection`);
      const before = await rawImage(prePath), selectedPixels = await rawImage(selectedPath);
      const outsideDiff = countDiff(before, selectedPixels, mapOutsideRegions(width, height, bounds));
      const edgeDiff = countDiff(before, selectedPixels, mapOutsideEdgeRegions(width, height, bounds));
      const insideDiff = countDiff(before, selectedPixels, [{ x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height }]);
      assert.equal(outsideDiff, 0, `${width}x${height}: pixels in side gutters changed during map pan/selection (${outsideDiff})`);
      assert.equal(edgeDiff, 0, `${width}x${height}: pixels immediately above/below the map pane changed during selection (${edgeDiff})`);
      assert(insideDiff > 100, `${width}x${height}: map pane pixels did not change after selection`);

      await clickText(session.page, 'Campaign', 'Frostveil');
      const panned = await inspectScene(session.page, 'Campaign');
      assert.equal(panned.selectedLevel, 30, `${width}x${height}: Frostveil tab did not pan to the last unlocked level`);
      assertSingleMask(panned, `${width}x${height} after world pan`);
      await session.page.mouse.move(0, 0);
      const postPath = await screenshot(session, `map-${width}x${height}-after-world-pan`);
      const afterWorld = await rawImage(postPath);
      const worldGutterDiff = countDiff(before, afterWorld, mapOutsideRegions(width, height, bounds));
      assert.equal(worldGutterDiff, 0, `${width}x${height}: pixels in side gutters changed during world pan (${worldGutterDiff})`);

      let oldMask = null;
      if (i > 0) oldMask = await oldMaskState(session.page);
      if (i > 0) assertMaskCleanup(oldMask, `${width}x${height} resize/re-entry`);
      cases.push({ viewport: [width,height], expectedBounds: bounds, selectedAfterVisiblePointer: selected.selectedLevel, hiddenNodePointer: hiddenPointer, selectedAfterWorldPan: panned.selectedLevel, sideGutterChangedPixelsDuringSelectionPan: outsideDiff, topBottomBoundaryChangedPixelsDuringSelectionPan: edgeDiff, mapPaneChangedPixelsDuringSelectionPan: insideDiff, sideGutterChangedPixelsDuringWorldPan: worldGutterDiff, mask: panned.mask, priorMaskCleanup: oldMask, screenshots: [path.relative(ROOT, prePath), path.relative(ROOT, selectedPath), path.relative(ROOT, postPath)] });
    }
    report.mapCases = cases;
  } finally { await session.context.close(); }
}

async function startCampaignBattle(session, world) {
  await openPage(session);
  await openCampaignMap(session);
  if (world === 'classic') {
    await clickText(session.page, 'Campaign', 'Classic Siege');
    await waitScene(session.page, 'Difficulty');
    await clickText(session.page, 'Difficulty', 'Continue');
    await waitScene(session.page, 'Game');
    return { mode: 'classic', level: null };
  }
  const worldNames = { borderkeep: 'Borderkeep', emberfall: 'Emberfall', frostveil: 'Frostveil' };
  const levels = { borderkeep: 10, emberfall: 20, frostveil: 30 };
  await clickText(session.page, 'Campaign', worldNames[world]);
  let state = await inspectScene(session.page, 'Campaign');
  assert.equal(state.selectedLevel, levels[world], `${world}: world tab selected unexpected level`);
  await clickText(session.page, 'Campaign', 'Start Battle');
  await waitScene(session.page, 'Game', 60000);
  return { mode: world, level: levels[world] };
}

async function touchPanAndZoom(session) {
  const page = session.page;
  const field = await page.evaluate(() => window.__v9Game.scene.getScene('Game').layout.field);
  const center = { x: field.x + field.width * 0.52, y: field.y + field.height * 0.52 };
  await page.evaluate(() => {
    window.__v9InputEvents = [];
    window.__v9PhaserEvents = [];
    const canvas = document.querySelector('canvas');
    for (const name of ['pointerdown','pointermove','pointerup','touchstart','touchmove','touchend']) canvas.addEventListener(name, event => {
      window.__v9InputEvents.push({ type: event.type, pointerType: event.pointerType || null, x: event.clientX, y: event.clientY, trusted: event.isTrusted });
    }, { capture: true });
    const scene = window.__v9Game.scene.getScene('Game');
    window.__v9PhaserHandlers = {};
    for (const name of ['pointerdown','pointermove','pointerup']) {
      window.__v9PhaserHandlers[name] = pointer => {
        window.__v9PhaserEvents.push({ type: name, id: pointer.id, pointerId: pointer.pointerId, wasTouch: pointer.wasTouch, x: pointer.x, y: pointer.y, eventType: pointer.event?.type, pointerType: pointer.event?.pointerType });
      };
      scene.input.on(name, window.__v9PhaserHandlers[name]);
    }
  });
  const cdp = await session.context.newCDPSession(page);
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 2 });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ id: 21, x: center.x, y: center.y }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ id: 21, x: center.x + 72, y: center.y + 26 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(150);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [
    { id: 31, x: center.x - 32, y: center.y }, { id: 32, x: center.x + 32, y: center.y }
  ] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [
    { id: 31, x: center.x - 82, y: center.y - 12 }, { id: 32, x: center.x + 82, y: center.y + 12 }
  ] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(350);
  await cdp.detach();
  return page.evaluate(() => {
    const scene = window.__v9Game.scene.getScene('Game');
    const result = { dom: window.__v9InputEvents, phaser: window.__v9PhaserEvents, gestureContacts: scene.gesture.contacts.size };
    for (const [name, handler] of Object.entries(window.__v9PhaserHandlers)) scene.input.off(name, handler);
    return result;
  });
}

async function oldFieldMaskState(page) {
  return page.evaluate(() => {
    const old = window.__v9OldFieldMask;
    return old ? {
      destroyed: old.destroyed, controllerFilterCleared: old.filter === null,
      oldFilterListCount: window.__v9OldFieldFilterList?.list?.length ?? null,
      sourceDestroyed: old.source?.isDestroyed === true, sourceInactive: old.source?.active === false,
      sourceInvisible: old.source?.visible === false, sourceSceneCleared: old.source?.scene == null,
      sourceDisplayListCleared: old.source?.displayList === null
    } : null;
  });
}

async function gameMaskState(page) { return inspectScene(page, 'Game'); }

async function verifyBattle(browser, world) {
  const tag = `battle-${world}`;
  const session = await setupContext(browser, [1440,900], tag, { hasTouch: true });
  try {
    const started = await startCampaignBattle(session, world);
    let state = await gameMaskState(session.page);
    assertSingleMask(state, `${tag} initial`);
    assert.equal(state.scale.width, 1440); assert.equal(state.scale.height, 900);
    assert.equal(state.mode?.worldId ?? 'classic', world === 'classic' ? 'classic' : world);
    if (world !== 'classic') assert.equal(state.mode.level, started.level);
    const initialState = state;
    const initialPath = await screenshot(session, `${tag}-initial`);

    const inputEvents = await touchPanAndZoom(session);
    state = await gameMaskState(session.page);
    assertSingleMask(state, `${tag} after pan and pinch zoom`);
    assert(state.zoom >= 1.4, `${tag}: touch pinch did not zoom the world (${state.zoom}); events=${JSON.stringify(inputEvents)}`);
    assert(state.center.x !== 520 || state.center.y !== 348, `${tag}: touch pan/zoom did not move the camera center`);
    const panZoomState = state;
    panZoomState.inputEvents = inputEvents;
    const movedPath = await screenshot(session, `${tag}-panned-zoomed`);
    const field = state.field;
    const initialPixels = await rawImage(initialPath), movedPixels = await rawImage(movedPath);
    const outside = [
      { x: 0, y: 0, width: 1440, height: field.y },
      { x: field.x + field.width, y: field.y + 20, width: 1440 - field.x - field.width, height: Math.max(0, field.height - 40) },
      { x: 0, y: field.y + field.height, width: 1440, height: 900 - field.y - field.height }
    ].filter(region => region.width > 0 && region.height > 0);
    const outsideChanged = countDiff(initialPixels, movedPixels, outside);
    const fieldChanged = countDiff(initialPixels, movedPixels, [{ x: field.x, y: field.y, width: field.width, height: field.height }]);
    assert.equal(outsideChanged, 0, `${tag}: pixels outside fixed field pane changed during touch pan/zoom (${outsideChanged})`);
    assert(fieldChanged > 100, `${tag}: field pixels did not respond to touch pan/zoom`);

    await session.page.keyboard.press('p');
    await session.page.waitForFunction(() => { const s = window.__v9Game.scene.getScene('Game'); return s?.modal?.getData('pauseMenu') === true && s.paused; }, null, { timeout: 10000 });
    const paused = await gameMaskState(session.page);
    assertSingleMask(paused, `${tag} paused`);
    await session.page.evaluate(() => {
      window.__v9OldFieldMask = window.__v9Game.scene.getScene('Game').fieldMask;
      window.__v9OldFieldFilterList = window.__v9OldFieldMask?.filterList ?? null;
    });
    await clickText(session.page, 'Game', 'Restart Run', 0, 'touch');
    try {
      await session.page.waitForFunction(() => {
        const s = window.__v9Game.scene.getScene('Game');
        return window.__v9Game.scene.isActive('Game') && s.fieldMask && !s.modal;
      }, null, { timeout: 10000 });
    } catch (error) {
      const diagnostic = await session.page.evaluate(() => {
        const s = window.__v9Game.scene.getScene('Game');
        return { active: window.__v9Game.scene.isActive('Game'), paused: s.paused, modal: s.modal?.getData('pauseMenu'), labels: s.children.list.flatMap(o => o.type === 'Container' ? o.list || [] : [o]).filter(o => o.type === 'Text' && o.visible).map(o => o.text).slice(-30), listeners: { down: s.input.listenerCount('pointerdown'), up: s.input.listenerCount('pointerup') } };
      });
      await screenshot(session, `${tag}-restart-timeout`);
      throw new Error(`${tag}: restart click did not close pause UI; ${JSON.stringify(diagnostic)}; ${error.message}`);
    }
    await session.page.waitForTimeout(300);
    const restartCleanup = await oldFieldMaskState(session.page);
    assertMaskCleanup(restartCleanup, `${tag} restart`);
    state = await gameMaskState(session.page);
    assertSingleMask(state, `${tag} after restart`);
    assert.equal(state.zoom, 1, `${tag}: restart did not reset battlefield camera zoom`);
    assert.equal(state.inputListeners.pointerdown, 1, `${tag}: pointerdown listeners accumulated on restart`);
    assert.equal(state.inputListeners.pointermove, 1, `${tag}: pointermove listeners accumulated on restart`);
    assert.equal(state.inputListeners.pointerup, 1, `${tag}: pointerup listeners accumulated on restart`);
    const restarted = state;

    const maskBeforeResize = await session.page.evaluate(() => {
      const scene = window.__v9Game.scene.getScene('Game');
      window.__v9ResizeMask = scene.fieldMask; window.__v9ResizeSource = scene.fieldMask.source;
      return { externalCount: scene.worldRoot.filters.external.list.length, field: scene.layout.field };
    });
    await session.page.setViewportSize({ width: 390, height: 844 });
    await session.page.waitForFunction(() => {
      const game = window.__v9Game, s = game?.scene.getScene('Game');
      return game?.scale.width === 390 && game?.scale.height === 844 && game.scene.isActive('Game') && s?.layout?.field?.width === 390 && s?.fieldMask;
    }, null, { timeout: 30000 });
    state = await gameMaskState(session.page);
    assertSingleMask(state, `${tag} after portrait resize`);
    const resizeReuse = await session.page.evaluate(() => {
      const scene = window.__v9Game.scene.getScene('Game');
      return { sameController: scene.fieldMask === window.__v9ResizeMask, sameSource: scene.fieldMask.source === window.__v9ResizeSource, externalCount: scene.worldRoot.filters.external.list.length, field: scene.layout.field };
    });
    assert.equal(resizeReuse.sameController, true, `${tag}: HUD rebuild replaced the controller despite preserving worldRoot`);
    assert.equal(resizeReuse.sameSource, true, `${tag}: HUD rebuild allocated a second mask source`);
    assert.equal(resizeReuse.externalCount, 1, `${tag}: resize accumulated external filters`);
    assert.deepEqual(resizeReuse.field, { x: 0, y: 104, width: 390, height: 676 }, `${tag}: resized field has unexpected bounds`);
    await screenshot(session, `${tag}-portrait-resize`);
    await session.page.setViewportSize({ width: 844, height: 390 });
    await session.page.waitForFunction(() => window.__v9Game.scale.width === 844 && window.__v9Game.scale.height === 390 && window.__v9Game.scene.getScene('Game')?.fieldMask, null, { timeout: 30000 });
    state = await gameMaskState(session.page);
    assertSingleMask(state, `${tag} after landscape rotation`);
    assert.deepEqual(state.field, { x: 0, y: 56, width: 844, height: 270 }, `${tag}: landscape field bounds are unexpected`);
    const rotated = state;
    await screenshot(session, `${tag}-landscape-rotation`);

    await session.page.setViewportSize({ width: 1440, height: 900 });
    await session.page.waitForFunction(() => window.__v9Game.scale.width === 1440 && window.__v9Game.scale.height === 900 && window.__v9Game.scene.getScene('Game')?.fieldMask, null, { timeout: 30000 });
    await session.page.keyboard.press('p');
    await session.page.waitForFunction(() => window.__v9Game.scene.getScene('Game')?.modal?.getData('pauseMenu') === true, null, { timeout: 10000 });
    await session.page.evaluate(() => {
      window.__v9OldFieldMask = window.__v9Game.scene.getScene('Game').fieldMask;
      window.__v9OldFieldFilterList = window.__v9OldFieldMask?.filterList ?? null;
    });
    if (world === 'classic') {
      await clickText(session.page, 'Game', 'Quit to Menu', 0, 'touch');
      await waitScene(session.page, 'MainMenu');
      const cleanup = await oldFieldMaskState(session.page);
      assertMaskCleanup(cleanup, `${tag} quit to menu`);
      await clickText(session.page, 'MainMenu', 'Campaign', 0, 'touch');
      await waitScene(session.page, 'Campaign');
      await clickText(session.page, 'Campaign', 'Classic Siege', 0, 'touch');
      await waitScene(session.page, 'Difficulty');
      await clickText(session.page, 'Difficulty', 'Continue', 0, 'touch');
      await waitScene(session.page, 'Game');
    } else {
      await clickText(session.page, 'Game', 'World Map', 0, 'touch');
      await waitScene(session.page, 'Campaign');
      const cleanup = await oldFieldMaskState(session.page);
      assertMaskCleanup(cleanup, `${tag} world map exit`);
      await clickText(session.page, 'Campaign', ({ borderkeep: 'Borderkeep', emberfall: 'Emberfall', frostveil: 'Frostveil' })[world], 0, 'touch');
      await clickText(session.page, 'Campaign', 'Start Battle', 0, 'touch');
      try { await waitScene(session.page, 'Game'); }
      catch (error) {
        const diagnostic = await session.page.evaluate(() => ({
          activeScenes: window.__v9Game.scene.getScenes(false, true).map(scene => scene.sys.settings.key),
          campaign: (() => { const scene = window.__v9Game.scene.getScene('Campaign'); return { active: window.__v9Game.scene.isActive('Campaign'), selectedLevel: scene?.selectedLevel, mode: scene?.campaign, text: scene?.children.list.filter(o => o.type === 'Text' && o.visible).map(o => o.text).slice(0, 24) }; })(),
          gameActive: window.__v9Game.scene.isActive('Game'), gameMask: !!window.__v9Game.scene.getScene('Game')?.fieldMask
        }));
        await screenshot(session, `${tag}-reentry-timeout`);
        throw new Error(`${tag}: battle re-entry timed out; ${JSON.stringify(diagnostic)}; ${error.message}`);
      }
    }
    state = await gameMaskState(session.page);
    assertSingleMask(state, `${tag} after leave/re-entry`);
    assert.equal(state.mode?.worldId ?? 'classic', world === 'classic' ? 'classic' : world);
    const reentered = state;
    const finalPath = await screenshot(session, `${tag}-reentry`);
    const final = await gameMaskState(session.page);
    report.battleCases.push({ world, initialLevel: started.level, rendererType: final.rendererType, initialMask: initialState.mask, afterPanZoom: { zoom: panZoomState.zoom, center: panZoomState.center, mask: panZoomState.mask }, pauseMask: paused.mask, restartMask: restarted.mask, restartCleanup, resizeReuse, rotateField: rotated.field, reentryMask: reentered.mask, inputListenersAfterRestart: { pointerdown: restarted.inputListeners.pointerdown, pointermove: restarted.inputListeners.pointermove, pointerup: restarted.inputListeners.pointerup }, pixelsOutsideFieldChangedDuringPanZoom: outsideChanged, pixelsInsideFieldChangedDuringPanZoom: fieldChanged, screenshots: [path.relative(ROOT, initialPath), path.relative(ROOT, movedPath), path.relative(ROOT, finalPath)] });
  } finally { await session.context.close(); }
}

async function verifyLeaderboard(browser) {
  const empty = await setupContext(browser, [390,844], 'leaderboard-empty', { seedCampaign: false, reducedMotion: true });
  try {
    await openPage(empty, '?qa=leaderboard');
    await waitScene(empty.page, 'Leaderboard');
    await empty.page.waitForFunction(() => {
      const scene = window.__v9Game.scene.getScene('Leaderboard');
      return scene?.records?.length === 0 && scene?.statusText?.text?.includes('No champions yet');
    }, null, { timeout: 15000 });
    const state = await inspectScene(empty.page, 'Leaderboard');
    assertSingleMask(state, 'empty leaderboard');
    assert.equal(state.records, 0);
    const emptyPath = await screenshot(empty, 'leaderboard-empty-390x844');
    report.leaderboardCases.push({ state: 'empty-local-QA-fixture', records: state.records, mask: state.mask, screenshot: path.relative(ROOT, emptyPath) });
  } finally { await empty.context.close(); }

  const session = await setupContext(browser, [1440,900], 'leaderboard-filled', { seedCampaign: false, leaderboard: 'filled', reducedMotion: true });
  try {
    await openPage(session);
    await clickText(session.page, 'MainMenu', 'Hall of Legends');
    await waitScene(session.page, 'Leaderboard');
    await session.page.waitForFunction(() => window.__v9Game.scene.getScene('Leaderboard')?.records?.length === 20, null, { timeout: 20000 });
    let state = await inspectScene(session.page, 'Leaderboard');
    assertSingleMask(state, 'filled leaderboard initial');
    assert.equal(state.records, 20, 'filled leaderboard fixture was not accepted');
    const bounds = { x: state.panelX + 4, y: state.bodyTop, width: state.panelWidth - 8, height: state.bodyBottom - state.bodyTop };
    const topPath = await screenshot(session, 'leaderboard-filled-1440x900-top');
    await session.page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    for (let i = 0; i < 12; i++) await session.page.mouse.wheel(0, 120);
    await session.page.waitForFunction(() => {
      const scene = window.__v9Game.scene.getScene('Leaderboard');
      return scene?.scrollOffset === scene?.maxScroll;
    }, null, { timeout: 15000 });
    state = await inspectScene(session.page, 'Leaderboard');
    assertSingleMask(state, 'filled leaderboard bottom scroll');
    assert(state.scrollOffset > 0 && state.scrollOffset === state.maxScroll, 'filled rows did not scroll to the bottom');
    const bottomPath = await screenshot(session, 'leaderboard-filled-1440x900-bottom');
    const topPixels = await rawImage(topPath), bottomPixels = await rawImage(bottomPath);
    const outsideRows = countDiff(topPixels, bottomPixels, [
      { x: bounds.x, y: bounds.y - 4, width: bounds.width, height: 4 },
      { x: bounds.x, y: bounds.y + bounds.height, width: bounds.width, height: 6 }
    ]);
    const insideRows = countDiff(topPixels, bottomPixels, [{ x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height }]);
    assert.equal(outsideRows, 0, `leaderboard row scroll painted outside fixed row viewport (${outsideRows} pixels changed)`);
    assert(insideRows > 100, 'leaderboard visible row viewport did not change after scrolling');

    await storeOldMask(session.page, 'Leaderboard', 'rowMask');
    await session.page.setViewportSize({ width: 390, height: 844 });
    await session.page.waitForFunction(() => window.__v9Game.scale.width === 390 && window.__v9Game.scale.height === 844 && window.__v9Game.scene.getScene('Leaderboard')?.rowMask, null, { timeout: 30000 });
    const resizeCleanup = await oldMaskState(session.page);
    assertMaskCleanup(resizeCleanup, 'leaderboard resize');
    state = await inspectScene(session.page, 'Leaderboard');
    assertSingleMask(state, 'filled leaderboard after resize');
    assert.equal(state.records, 20, 'filled fixture did not reload after resize');
    const phoneBounds = { x: state.panelX + 4, y: state.bodyTop, width: state.panelWidth - 8, height: state.bodyBottom - state.bodyTop };
    const phoneTopPath = await screenshot(session, 'leaderboard-filled-390x844-top');
    await session.page.mouse.move(phoneBounds.x + phoneBounds.width / 2, phoneBounds.y + phoneBounds.height / 2);
    for (let i = 0; i < 24; i++) await session.page.mouse.wheel(0, 120);
    await session.page.waitForFunction(() => {
      const scene = window.__v9Game.scene.getScene('Leaderboard');
      return scene?.scrollOffset === scene?.maxScroll;
    }, null, { timeout: 15000 });
    state = await inspectScene(session.page, 'Leaderboard');
    assertSingleMask(state, 'filled leaderboard phone bottom scroll');
    const phoneBottomPath = await screenshot(session, 'leaderboard-filled-390x844-bottom');
    const phoneTop = await rawImage(phoneTopPath), phoneBottom = await rawImage(phoneBottomPath);
    const phoneOutside = countDiff(phoneTop, phoneBottom, [
      { x: phoneBounds.x, y: phoneBounds.y - 4, width: phoneBounds.width, height: 4 },
      { x: phoneBounds.x, y: phoneBounds.y + phoneBounds.height, width: phoneBounds.width, height: 6 }
    ]);
    const phoneInside = countDiff(phoneTop, phoneBottom, [{ x: phoneBounds.x, y: phoneBounds.y, width: phoneBounds.width, height: phoneBounds.height }]);
    assert.equal(phoneOutside, 0, `portrait leaderboard rows painted outside viewport (${phoneOutside} pixels changed)`);
    assert(phoneInside > 100, 'portrait leaderboard rows did not visibly scroll');

    await clickText(session.page, 'Leaderboard', 'Back to Keep');
    await waitScene(session.page, 'MainMenu');
    await clickText(session.page, 'MainMenu', 'Hall of Legends');
    await waitScene(session.page, 'Leaderboard');
    await session.page.waitForFunction(() => window.__v9Game.scene.getScene('Leaderboard')?.records?.length === 20, null, { timeout: 20000 });
    state = await inspectScene(session.page, 'Leaderboard');
    assertSingleMask(state, 'filled leaderboard after re-entry');
    assert.equal(state.records, 20, 'filled records did not return on re-entry');
    const reentryPath = await screenshot(session, 'leaderboard-filled-reentry-390x844');
    report.leaderboardCases.push({ state: 'filled-local-API-fixture', records: 20, desktopScrollOffset: state.maxScroll, desktopOutsideViewportChangedPixels: outsideRows, desktopInsideViewportChangedPixels: insideRows, portraitOutsideViewportChangedPixels: phoneOutside, portraitInsideViewportChangedPixels: phoneInside, resizeCleanup, reentryMask: state.mask, screenshots: [path.relative(ROOT, topPath), path.relative(ROOT, bottomPath), path.relative(ROOT, phoneTopPath), path.relative(ROOT, phoneBottomPath), path.relative(ROOT, reentryPath)] });
  } finally { await session.context.close(); }
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  report.sourceHashes = hashSources();
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    if (process.env.V9_ONLY) await verifyBattle(browser, process.env.V9_ONLY);
    else {

      for (const world of ['borderkeep','emberfall','frostveil','classic']) await verifyBattle(browser, world);
    }
  } finally {
    await browser.close();
    report.sourceHashesAfter = hashSources();
    report.sourceStable = JSON.stringify(report.sourceHashes) === JSON.stringify(report.sourceHashesAfter);
    fs.writeFileSync(path.join(OUT, 'v9-viewport-mask-results.json'), JSON.stringify(report, null, 2));
  }
})().catch(error => {
  report.issues.push({ message: error.message, stack: error.stack });
  try { report.sourceHashesAfter = hashSources(); report.sourceStable = JSON.stringify(report.sourceHashes) === JSON.stringify(report.sourceHashesAfter); fs.writeFileSync(path.join(OUT, 'v9-viewport-mask-results.json'), JSON.stringify(report, null, 2)); } catch {}
  console.error(error.stack || error);
  process.exitCode = 1;
});
