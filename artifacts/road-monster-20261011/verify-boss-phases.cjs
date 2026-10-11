const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/ljour/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const sharp = require('C:/Users/ljour/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'artifacts/road-monster-20261011/boss-phases');
const BASE_URL = process.env.BOSS_QA_URL || 'http://127.0.0.1:5195/';
const sourceFiles = ['src/game/art/enemyArt.ts', 'src/game/art/campaignArt.ts', 'src/game/scenes/GameScene.ts', 'src/game/campaign/bosses.ts', 'src/game/qa.ts'];
const bossIds = { 10: 'hollow_warden', 20: 'cinder_colossus', 30: 'frostbound_matriarch' };
const phases = [
  { level: 10, label: 'initial', phase: 1, guarded: false, telegraph: false, targets: 0, frozen: 0, visible: [false, false], alpha: [1, 1] },
  { level: 10, label: 'guarded', phase: 1, guarded: true, telegraph: false, targets: 0, frozen: 0, visible: [true, false], alpha: [1, 1] },
  { level: 10, label: 'enraged', phase: 3, guarded: false, telegraph: false, targets: 0, frozen: 0, visible: [false, true], alpha: [1, 1] },
  { level: 20, label: 'initial', phase: 1, guarded: false, telegraph: false, targets: 0, frozen: 0, visible: [true, true, false, false], alpha: [1, 1, 0.55, 1] },
  { level: 20, label: 'broken', phase: 2, guarded: false, telegraph: false, targets: 0, frozen: 0, visible: [true, false, true, true], alpha: [1, 1, 0.55, 1] },
  { level: 20, label: 'core', phase: 3, guarded: false, telegraph: false, targets: 0, frozen: 0, visible: [false, false, true, true], alpha: [1, 1, 1, 1] },
  { level: 30, label: 'initial', phase: 1, guarded: false, telegraph: false, targets: 0, frozen: 0, visible: [false, false], alpha: [1, 1] },
  { level: 30, label: 'telegraph', phase: 1, guarded: false, telegraph: true, targets: 1, frozen: 0, visible: [true, false], alpha: [1, 1] },
  { level: 30, label: 'freeze', phase: 1, guarded: false, telegraph: false, targets: 0, frozen: 1, visible: [false, false], alpha: [1, 1] },
  { level: 30, label: 'phase2', phase: 2, guarded: false, telegraph: true, targets: 2, frozen: 0, visible: [true, true], alpha: [1, 1] }
];
const evidence = { taskId: 'V6 campaign boss overlay browser verification', failures: [], phaseCases: [], thresholdCases: [], lifecycle: null, contactSheets: [] };

function hashes() {
  return Object.fromEntries(sourceFiles.map(file => [
    file, crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, file))).digest('hex')
  ]));
}
async function fixture(browser, level, phase) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const tracker = { errors: [], failedRequests: [], postAttempts: [], mapResponses: [], responseTasks: [] };
  await context.addInitScript(() => {
    window.__verifyStorageWrites = [];
    for (const method of ['setItem', 'removeItem', 'clear']) Storage.prototype[method] = function (...args) {
      window.__verifyStorageWrites.push({ method, key: args[0] ?? null });
      return undefined;
    };
  });
  await context.route('**/src/main.ts*', async route => {
    const response = await route.fetch();
    let body = await response.text();
    const anchor = 'const game = new Phaser.Game(config);';
    assert(body.includes(anchor), 'DEV QA game injection anchor changed');
    body = body.replace(anchor, anchor + '\nwindow.__qaGame = game;');
    await route.fulfill({ response, body });
  });
  await context.route('**/api/**', async route => {
    if (route.request().method().toUpperCase() === 'POST') {
      tracker.postAttempts.push(route.request().url());
      await route.fulfill({ status: 503, body: 'V6 verification blocks API writes.' });
    } else await route.continue();
  });
  const page = await context.newPage();
  page.on('console', msg => { if (msg.type() === 'error') tracker.errors.push(msg.text()); });
  page.on('pageerror', err => tracker.errors.push(err.stack || err.message));
  page.on('requestfailed', req => tracker.failedRequests.push({ url: req.url(), error: req.failure()?.errorText }));
  page.on('response', response => {
    const url = new URL(response.url());
    if (url.pathname.startsWith('/assets/campaign/maps/')) tracker.responseTasks.push((async () => {
      const body = await response.body();
      tracker.mapResponses.push({ path: url.pathname, status: response.status(),
        sha256: crypto.createHash('sha256').update(body).digest('hex') });
    })());
  });
  const response = await page.goto(BASE_URL + '?qa=campaign-boss&level=' + level + '&bossPhase=' + encodeURIComponent(phase), {
    waitUntil: 'domcontentloaded', timeout: 60000
  });
  assert(response?.ok(), 'fixture entry failed for L' + level + '/' + phase);
  await page.waitForFunction(() => {
    const game = window.__qaGame;
    if (!game || !game.scene.isActive('Game')) return false;
    const scene = game.scene.getScene('Game');
    return !!scene.campaign?.definition && scene.enemies?.some(e => e.alive && e.isBoss && e.campaignId);
  }, null, { timeout: 60000 });
  await page.waitForTimeout(250);
  await Promise.all(tracker.responseTasks);
  await page.locator('details[aria-label="Development QA controls"]').evaluateAll(nodes => nodes.forEach(node => node.remove()));
  return { context, page, tracker };
}
function inspect(page, facing) {
  return page.evaluate(direction => {
    const scene = window.__qaGame.scene.getScene('Game');
    const boss = scene.enemies.find(e => e.alive && e.isBoss && e.campaignId);
    if (!boss) throw new Error('No live campaign boss');
    const visual = boss.view.getData('enemyVisual');
    const body = visual.body;
    const overlay = body.list.find(o => o.type === 'Container');
    if (direction) {
      boss.heading = direction === 'left' ? Math.PI : 0;
      scene.renderFrame(0);
    }
    const state = scene.campaignBosses.presentation(boss.id, scene.gameTimeMs);
    return {
      id: boss.campaignId,
      aliveBossCount: scene.enemies.filter(e => e.alive && e.isBoss && e.campaignId).length,
      hpRatio: boss.hp / boss.maxHp,
      phase: state.phase, guarded: state.guarded, telegraph: state.telegraph,
      targets: scene.campaignBosses.telegraphTargets(),
      frozenTowers: scene.towers.filter(t => t.frozenUntil > scene.gameTimeMs).length,
      gameTimeMs: scene.gameTimeMs, paused: scene.paused, speed: scene.speed,
      debugAssisted: scene.debugAssisted,
      fixture: scene.qaCampaignFixture ? scene.qaCampaignFixture.state + '/' + scene.qaCampaignFixture.bossPhase : null,
      atlasKey: visual.atlas, finalTextureLoaded: scene.textures.exists('campaign_enemy_' + boss.campaignId),
      facing: visual.getFacing(),
      sprite: {
        x: visual.sprite.x, y: visual.sprite.y, originX: visual.sprite.originX, originY: visual.sprite.originY,
        displayWidth: visual.sprite.displayWidth, displayHeight: visual.sprite.displayHeight,
        flipX: visual.sprite.flipX, visible: visual.sprite.visible, alpha: visual.sprite.alpha
      },
      body: { x: body.x, y: body.y, childTypes: body.list.map(o => o.type) },
      overlay: {
        x: overlay.x, y: overlay.y, scaleX: overlay.scaleX, scaleY: overlay.scaleY, parentIsBody: overlay.parentContainer === body,
        children: overlay.list.map(o => ({
          type: o.type, x: o.x, y: o.y, scaleX: o.scaleX, scaleY: o.scaleY,
          visible: o.visible, alpha: o.alpha
        }))
      },
      runId: scene.runId,
      sceneObjectCount: scene.children.list.length
    };
  }, facing || null);
}
function assertPhase(actual, expected) {
  assert.equal(actual.id, bossIds[expected.level], 'wrong campaign boss');
  assert.equal(actual.aliveBossCount, 1, 'expected one living boss');
  assert.equal(actual.phase, expected.phase, 'campaign boss system phase differs');
  assert.equal(actual.guarded, expected.guarded, 'guard state differs');
  assert.equal(actual.telegraph, expected.telegraph, 'telegraph state differs');
  assert.equal(actual.targets.length, expected.targets, 'boss target count differs');
  assert.equal(actual.frozenTowers, expected.frozen, 'active tower freeze count differs');
  assert.equal(actual.debugAssisted, true, 'expected isolated DEV fixture');
  assert.equal(actual.fixture, 'campaign-boss/' + expected.label, 'wrong fixture label');
  assert.equal(actual.finalTextureLoaded, true, 'final atlas was not loaded in fixture');
  assert.equal(actual.atlasKey, 'campaign_enemy_' + bossIds[expected.level], 'expected final atlas');
  assert(Math.abs(actual.sprite.displayWidth * 0.78 - 96) < 1e-8, 'painted boss content does not match its 96-unit budget');
  assert(Math.abs(actual.sprite.displayHeight * 0.78 - 96) < 1e-8, 'painted boss content does not match its 96-unit budget');
  assert.equal(actual.sprite.originX, 0.5, 'sprite horizontal anchor changed');
  assert.equal(actual.sprite.originY, 0.9, 'sprite contact anchor changed');
  assert.equal(actual.overlay.children.length, expected.visible.length, 'overlay count differs');
  assert.deepEqual(actual.overlay.children.map(o => o.visible), expected.visible, 'overlay phase visibility differs');
  assert.deepEqual(actual.overlay.children.map(o => Math.round(o.alpha * 100) / 100), expected.alpha, 'overlay phase opacity differs');
  for (const child of actual.overlay.children) {
    assert.equal(child.type, 'Graphics', 'expected procedural boss graphics overlay');
    assert(Math.abs(child.x + 48 / 0.78) < 1e-8, 'overlay does not start at left sprite edge');
    assert(Math.abs(child.y + 96 * 0.9 / 0.78) < 1e-8, 'overlay does not meet the sprite contact anchor');
    assert(Math.abs(child.scaleX - 0.375 / 0.78) < 1e-8, 'overlay source width does not match sprite');
    assert(Math.abs(child.scaleY - 0.375 / 0.78) < 1e-8, 'overlay source height does not match sprite');
  }
}
async function assertSafe(session, label) {
  const writes = await session.page.evaluate(() => window.__verifyStorageWrites || []);
  assert.deepEqual(writes, [], label + ': browser storage writes');
  assert.deepEqual(session.tracker.errors, [], label + ': browser/page errors');
  assert.deepEqual(session.tracker.failedRequests, [], label + ': failed requests');
  assert.deepEqual(session.tracker.postAttempts, [], label + ': attempted API POSTs');
}
async function screenshot(page, name) {
  const destination = path.join(OUT, name);
  await page.screenshot({ path: destination, animations: 'disabled' });
  assert(fs.statSync(destination).size > 10000, 'screenshot file is unexpectedly small');
  return path.relative(ROOT, destination);
}
async function phaseRun(browser, expected) {
  const record = { level: expected.level, boss: bossIds[expected.level], phase: expected.label, outcome: 'pending', screenshots: [] };
  let session;
  try {
    session = await fixture(browser, expected.level, expected.label);
    const world = expected.level === 10 ? 'borderkeep' : expected.level === 20 ? 'emberfall' : 'frostveil';
    const expectedMapPath = '/assets/campaign/maps/' + world + '_d-v1.png';
    const expectedMapHash = crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, 'public', expectedMapPath.slice(1)))).digest('hex');
    assert.equal(session.tracker.mapResponses.length, 1, 'boss fixture did not load exactly one ordinary D-family map plate');
    assert.deepEqual(session.tracker.mapResponses[0], { path: expectedMapPath, status: 200, sha256: expectedMapHash }, 'boss fixture did not load the approved final D-family map bytes');
    record.mapResponse = session.tracker.mapResponses[0];
    const baseline = await inspect(session.page, null);
    assertPhase(baseline, expected);
    record.runtime = baseline;
    for (const direction of ['right', 'left']) {
      const actual = await inspect(session.page, direction);
      assertPhase(actual, expected);
      assert.equal(actual.facing, direction, 'path direction did not reach rendered sprite');
      assert.equal(actual.sprite.flipX, direction === 'left', 'body facing differs');
      assert.equal(actual.overlay.scaleX, direction === 'left' ? -1 : 1, 'overlays did not mirror with body');
      assert.equal(actual.overlay.parentIsBody, true, 'overlay container is not a child of the animated body');
      assert.equal(actual.overlay.x, 0, 'overlay container horizontal body-local origin differs');
      assert.equal(actual.overlay.y, 0, 'overlay container vertical body-local origin differs');
      record.screenshots.push(await screenshot(session.page, 'L' + expected.level + '-' + expected.label + '-' + direction + '.png'));
    }
    await assertSafe(session, 'L' + expected.level + '/' + expected.label);
    record.safety = session.tracker;
    record.outcome = 'PASS';
  } catch (error) {
    record.outcome = 'FAIL';
    record.failure = error.stack || error.message;
    evidence.failures.push({ case: 'phase L' + expected.level + '/' + expected.label, error: record.failure });
  } finally {
    if (session) await session.context.close();
  }
  evidence.phaseCases.push(record);
}
async function thresholdRun(browser, level, samples) {
  const record = { level, boss: bossIds[level], samples: [], outcome: 'pending' };
  let session;
  try {
    session = await fixture(browser, level, 'initial');
    record.samples = await session.page.evaluate(inputs => {
      const scene = window.__qaGame.scene.getScene('Game');
      const boss = scene.enemies.find(e => e.alive && e.isBoss && e.campaignId);
      return inputs.map(input => {
        boss.hp = boss.maxHp * input.ratio;
        scene.tickCampaignBosses();
        scene.renderFrame(0);
        const presentation = scene.campaignBosses.presentation(boss.id, scene.gameTimeMs);
        const visual = boss.view.getData('enemyVisual');
        const overlay = visual.body.list.find(o => o.type === 'Container');
        return {
          ratio: input.ratio, expectedPhase: input.phase, phase: presentation.phase,
          guarded: presentation.guarded, telegraph: presentation.telegraph,
          physicalArmor: boss.physicalArmor, wardArmor: boss.wardArmor,
          speedMultiplier: boss.bossSpeedMultiplier, damageTakenMultiplier: boss.damageTakenMultiplier,
          visible: overlay.list.map(o => o.visible),
          marchlings: scene.enemies.filter(e => e.alive && e.campaignId === 'marchling').length
        };
      });
    }, samples);
    for (const sample of record.samples) {
      assert.equal(sample.phase, sample.expectedPhase, 'phase threshold failed at HP ' + sample.ratio);
      if (level === 10 && sample.ratio === 0.5) assert.equal(sample.marchlings, 3, 'Hollow Warden half-health summon did not appear');
      if (level === 10 && sample.ratio === 0.25) assert.equal(sample.phase, 2, 'Warden enrage must be below 25%, not at 25%');
      if (level === 10 && sample.ratio < 0.25) assert.equal(sample.speedMultiplier, 1.2, 'Warden enrage speed did not activate');
      if (level === 20 && sample.ratio === 0.65) {
        assert.equal(sample.physicalArmor, 0.32, 'Colossus did not lose armor at 65%');
        assert.equal(sample.speedMultiplier, 1.2, 'Colossus speed did not rise after armor break');
      }
      if (level === 20 && sample.ratio === 0.3) {
        assert.equal(sample.physicalArmor, 0.08, 'Colossus did not expose the core at 30%');
        assert.equal(sample.speedMultiplier, 1.4, 'Colossus final phase speed did not rise');
        assert.equal(sample.damageTakenMultiplier, 1.3, 'exposed core damage multiplier did not activate');
      }
    }
    await assertSafe(session, 'threshold L' + level);
    record.safety = session.tracker;
    record.outcome = 'PASS';
  } catch (error) {
    record.outcome = 'FAIL';
    record.failure = error.stack || error.message;
    evidence.failures.push({ case: 'threshold L' + level, error: record.failure });
  } finally {
    if (session) await session.context.close();
  }
  evidence.thresholdCases.push(record);
}
async function lifecycleRun(browser) {
  const record = { case: 'pause/resume/speed/restart cleanup', outcome: 'pending' };
  let session;
  try {
    session = await fixture(browser, 10, 'initial');
    const page = session.page;
    const state = () => page.evaluate(() => {
      const scene = window.__qaGame.scene.getScene('Game');
      return { gameTimeMs: scene.gameTimeMs, paused: scene.paused, speed: scene.speed, runId: scene.runId };
    });
    const act = action => page.evaluate(value => window.__qaGame.scene.getScene('Game').events.emit('qa:action', value), action);
    const initial = await state();
    assert.equal(initial.paused, true, 'fixture did not start paused');
    await page.waitForTimeout(350);
    assert.equal((await state()).gameTimeMs, initial.gameTimeMs, 'pause did not hold simulation time');

    await act({ type: 'cycle-speed' });
    assert.equal((await state()).speed, 2, 'speed did not cycle to 2x');
    await act({ type: 'toggle-pause' });
    const resumed2x = await state();
    assert.equal(resumed2x.paused, false, 'fixture did not resume');
    await page.waitForTimeout(600);
    const delta2x = (await state()).gameTimeMs - resumed2x.gameTimeMs;
    assert(delta2x > 400, 'resumed simulation clock did not advance');

    await act({ type: 'toggle-pause' });
    const paused = await state();
    assert.equal(paused.paused, true, 'pause action did not pause');
    await page.waitForTimeout(300);
    assert.equal((await state()).gameTimeMs, paused.gameTimeMs, 'paused simulation clock advanced');
    await act({ type: 'cycle-speed' });
    assert.equal((await state()).speed, 3, 'speed did not cycle to 3x while paused');
    await act({ type: 'toggle-pause' });
    const resumed3x = await state();
    assert.equal(resumed3x.paused, false, 'pause menu did not resume');
    await page.waitForTimeout(600);
    const delta3x = (await state()).gameTimeMs - resumed3x.gameTimeMs;
    assert(delta3x > delta2x * 1.2, '3x simulation clock did not outpace 2x');

    await act({ type: 'toggle-pause' });
    const beforeRestart = await page.evaluate(() => {
      const scene = window.__qaGame.scene.getScene('Game');
      const boss = scene.enemies.find(e => e.alive && e.isBoss && e.campaignId);
      window.__oldBossView = boss.view;
      return { runId: scene.runId, gameTimeMs: scene.gameTimeMs, paused: scene.paused, objectCount: scene.children.list.length };
    });
    assert.equal(beforeRestart.paused, true, 'restart did not begin from paused state');
    await act({ type: 'restart' });
    await page.waitForFunction(oldRunId => {
      const game = window.__qaGame;
      return game?.scene.isActive('Game') && game.scene.getScene('Game').runId !== oldRunId &&
        game.scene.getScene('Game').enemies?.some(e => e.alive && e.isBoss && e.campaignId);
    }, beforeRestart.runId, { timeout: 30000 });
    const after = await page.evaluate(() => {
      const scene = window.__qaGame.scene.getScene('Game');
      const boss = scene.enemies.find(e => e.alive && e.isBoss && e.campaignId);
      const visual = boss.view.getData('enemyVisual');
      const overlay = visual.body.list.find(o => o.type === 'Container');
      return {
        runId: scene.runId, gameTimeMs: scene.gameTimeMs, paused: scene.paused, speed: scene.speed,
        bossCount: scene.enemies.filter(e => e.alive && e.isBoss && e.campaignId).length,
        oldViewActive: window.__oldBossView.active,
        oldViewInScene: scene.children.list.includes(window.__oldBossView),
        oldViewInWorld: scene.worldRoot.list.includes(window.__oldBossView),
        newView: boss.view !== window.__oldBossView,
        overlayVisible: overlay.list.map(o => o.visible),
        phase: scene.campaignBosses.presentation(boss.id, scene.gameTimeMs).phase
      };
    });
    assert.notEqual(after.runId, beforeRestart.runId, 'restart kept the old run ID');
    assert.equal(after.gameTimeMs, initial.gameTimeMs, 'restart did not reset campaign clock to fixture state');
    assert.equal(after.paused, true, 'restarted fixture did not restore paused state');
    assert.equal(after.speed, 1, 'restart did not reset game speed');
    assert.equal(after.bossCount, 1, 'restart duplicated or lost the boss');
    assert.equal(after.oldViewActive, false, 'old boss view remained active after restart');
    assert.equal(after.oldViewInScene, false, 'old boss view remained attached to scene');
    assert.equal(after.oldViewInWorld, false, 'old boss view remained attached to world');
    assert.equal(after.newView, true, 'restart reused old boss view');
    assert.deepEqual(after.overlayVisible, [false, false], 'restart carried stale overlay visibility');
    assert.equal(after.phase, 1, 'restart carried stale boss phase');
    record.delta2xMs = delta2x;
    record.delta3xMs = delta3x;
    record.beforeRestart = beforeRestart;
    record.afterRestart = after;
    await assertSafe(session, record.case);
    record.safety = session.tracker;
    record.outcome = 'PASS';
  } catch (error) {
    record.outcome = 'FAIL';
    record.failure = error.stack || error.message;
    evidence.failures.push({ case: record.case, error: record.failure });
  } finally {
    if (session) await session.context.close();
  }
  evidence.lifecycle = record;
}
async function contactSheets() {
  for (const level of [10, 20, 30]) {
    const runs = evidence.phaseCases.filter(run => run.level === level && run.outcome === 'PASS');
    if (!runs.length) continue;
    const layers = [];
    for (let row = 0; row < runs.length; row++) {
      for (const facing of ['right', 'left']) {
        const file = path.join(OUT, 'L' + level + '-' + runs[row].phase + '-' + facing + '.png');
        if (!fs.existsSync(file)) continue;
        const x = facing === 'right' ? 0 : 300;
        const y = row * 240;
        const label = Buffer.from('<svg width="300" height="20"><rect width="300" height="20" fill="#151b21"/><text x="8" y="15" fill="#f2c66d" font-size="13" font-family="Arial">' + runs[row].phase + ' · ' + facing + '</text></svg>');
        const crop = await sharp(file).extract({ left: 680, top: 42, width: 300, height: 220 }).png().toBuffer();
        layers.push({ input: label, left: x, top: y });
        layers.push({ input: crop, left: x, top: y + 20 });
      }
    }
    const file = path.join(OUT, 'L' + level + '-contact-sheet.png');
    await sharp({ create: { width: 600, height: runs.length * 240, channels: 4, background: '#10161c' } }).composite(layers).png().toFile(file);
    evidence.contactSheets.push(path.relative(ROOT, file));
  }
}
async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  evidence.startedAt = new Date().toISOString();
  evidence.baseUrl = BASE_URL;
  evidence.browser = 'Bundled Playwright Chromium, headless';
  evidence.safety = { apiPosts: 'intercepted, blocked, and asserted absent', storage: 'all mutators intercepted and asserted absent', fixture: 'DEV QA campaign boss fixture; debug-assisted and unsaved' };
  evidence.sourceHashes = { start: hashes() };
  const browser = await chromium.launch({ headless: true });
  try {
    for (const phase of phases) await phaseRun(browser, phase);
    await thresholdRun(browser, 10, [
      { ratio: 0.5001, phase: 1 }, { ratio: 0.5, phase: 2 },
      { ratio: 0.2501, phase: 2 }, { ratio: 0.25, phase: 2 }, { ratio: 0.2499, phase: 3 }
    ]);
    await thresholdRun(browser, 20, [
      { ratio: 0.6501, phase: 1 }, { ratio: 0.65, phase: 2 },
      { ratio: 0.3001, phase: 2 }, { ratio: 0.3, phase: 3 }
    ]);
    await thresholdRun(browser, 30, [
      { ratio: 0.5001, phase: 1 }, { ratio: 0.5, phase: 2 }
    ]);
    await lifecycleRun(browser);
    await contactSheets();
  } finally {
    await browser.close();
  }
  evidence.finishedAt = new Date().toISOString();
  evidence.sourceHashes.end = hashes();
  evidence.sourceHashes.stable = JSON.stringify(evidence.sourceHashes.start) === JSON.stringify(evidence.sourceHashes.end);
  if (!evidence.sourceHashes.stable) evidence.failures.push({ case: 'freshness', error: 'A relevant production source file changed during capture.' });
  evidence.limits = [
    'All captures use final painted enemy/boss atlases.',
    'Facing is changed on the live fixture enemy heading and rendered through GameScene.renderFrame.',
    'Threshold probes set live boss HP ratios and tick CampaignBossSystem; they do not simulate tower damage or validate balance.'
  ];
  const report = path.join(OUT, 'boss-overlay-results.json');
  fs.writeFileSync(report, JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify({
    taskId: evidence.taskId, startedAt: evidence.startedAt, finishedAt: evidence.finishedAt,
    phasePasses: evidence.phaseCases.filter(run => run.outcome === 'PASS').length,
    phaseFails: evidence.phaseCases.filter(run => run.outcome === 'FAIL').length,
    thresholds: evidence.thresholdCases.map(run => ({ level: run.level, outcome: run.outcome, samples: run.samples })),
    lifecycle: evidence.lifecycle, contactSheets: evidence.contactSheets,
    sourcesStable: evidence.sourceHashes.stable, failures: evidence.failures,
    report: path.relative(ROOT, report)
  }, null, 2));
  if (evidence.failures.length) process.exitCode = 1;
}
main().catch(error => {
  fs.mkdirSync(OUT, { recursive: true });
  evidence.failures.push({ case: 'harness', error: error.stack || error.message });
  evidence.finishedAt = new Date().toISOString();
  fs.writeFileSync(path.join(OUT, 'boss-overlay-results.json'), JSON.stringify(evidence, null, 2));
  console.error(error.stack || error);
  process.exitCode = 1;
});
