# Responsive Game Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Make all player-facing screens responsive and understandable, with direct tower dragging and accurate prerequisite guidance.

**Architecture:** Retain Phaser scenes, existing purchase/domain rules, view transforms, and account interfaces. Add a small pure tray gesture state machine and read-only prerequisite models, then consume them in the existing UI. The main implementer owns overlapping scene changes sequentially; this is not a whole-game rewrite.

**Tech Stack:** TypeScript, Phaser 4, Vite, Vitest, existing Cloudflare Worker/D1 deployment. No new dependency required.

**Spec:** `docs/superpowers/specs/2026-10-11-responsive-game-experience-design.md`

**Status:** Independent plan review cleared in two rounds, 9/10, zero blockers or advisory findings; awaiting user approval. Scope/spec approved on 2026-10-11. Execution method for this feature remains to be confirmed; earlier inline authorization applied to the login feature.

## Global constraints

- Keep rules, balance, save versions, Google login, account isolation and upload policy unchanged.
- Support portrait and landscape without forced rotation. Verify 360×640, 390×844, 640×360, 844×390, 768×1024, 1024×768, 1366×768, 1920×1080 CSS viewports.
- Primary hit targets at least 44×44px; essential HUD text at least 14px, explanatory body 16px, compact secondary labels 12px. Text contrast 4.5:1; large text/meaningful boundaries 3:1.
- Preserve world-space maps/ranges. Resize must not restart an active battle. Retain existing hotkeys and a complete tap alternative.
- Touch threshold 10px; horizontal dominance scrolls, upward dominance drags; mouse/stylus drag threshold 6px. Touch anchor 48px above finger, snap radius 28px, lowest-index ties.
- Drag edge band 32px; maximum pan speed 180px/second. Physical release over controls cancels even if offset anchor is valid.
- Detailed panels pause simulation/Auto independently of user/background/modal reasons. Close and revalidate before mutation, never bypass guards.
- Contextual guide is skippable and local, never cloud achievement data. Honor reduced motion; no animation/audio-only information.
- Use `rtk` on every shell command. Preserve `.scratch/` and `.superpowers/` preview files; stage only explicit project files.
- Application completion requires tests/build, `rtk npm run deploy`, live HTML/current bundle/health verification, commit/push and remote-HEAD check. Do not deploy intermediate tasks or docs-only changes.

## Review focus

1. Offset anchor points at a plot while finger releases over controls: no placement (Tasks 2–3).
2. Second finger/rotation/visibility interrupts dragging: cancel, preserve gold, no phantom tap (Tasks 2–3).
3. Details closes while user/background pause persists: no mutation/resume (Task 4).
4. Remote progress refresh or storage failure during reading: accurate state, preserved selection, Help still usable (Tasks 5–6).
5. Short landscape/full boss/reward UI: reachable controls without overlap or clipped navigation (Tasks 1, 3, 7).

## File responsibilities

Existing `src/game/ui/layout.ts`, `viewport.ts`, `components.ts`, `ScrollSheet.ts`, `tokens.ts` own geometry, common controls, and visual tokens. `src/style.css` owns existing DOM/CSS presentation (confirm actual stylesheet import in `src/main.ts` before editing).

New `src/game/systems/TowerTrayGesture.ts` owns only pointer arbitration and edge velocity. New `src/game/ui/TowerTray.ts` owns rendering/scroll/hit rectangles for the catalog. `GameScene.ts` owns camera changes, placement mutation, selected inspector, and detailed-panel lifecycle. New `src/game/ui/prerequisites.ts` owns pure explanation models. Existing `progressionView.ts`, `ProgressionScene.ts`, `CampaignScene.ts` consume those models. New `src/game/systems/ContextualGuide.ts` owns local guide state; new `src/game/ui/helpContent.ts` owns reusable static instruction copy. Register new `HelpScene.ts` through existing `src/main.ts` scene list.

## Task 1: Responsive geometry and shared presentation

**Files:** Modify `src/game/ui/layout.ts`, `components.ts`, `ScrollSheet.ts`, `tokens.ts`, `src/style.css`, `src/main.ts`; create `tests/responsive-layout.test.ts`; extend existing component/ScrollSheet tests discovered with `rtk rg --files tests`.

**Interfaces:** Keep existing `gameLayout(width:number,height:number):GameLayout`; add optional third argument `safe?:Insets`, export `Insets={top:number;right:number;bottom:number;left:number}`. Extend GameLayout with `safe:Insets`, `trayBounds:Rect`, `waveBounds:Rect`, `inspectorBounds:Rect|null`. Existing callers passing two arguments remain valid. Export `readSafeInsets():Insets` using computed CSS safe-area probe. Retain `sheetBounds`, `BattlefieldView.resize/project/unproject` signatures.

- [ ] Add geometry tests first:
```ts
import { expect, it } from 'vitest';
import { gameLayout } from '../src/game/ui/layout.ts';
it.each([[360,640],[390,844],[640,360],[844,390],[768,1024],[1024,768],[1366,768],[1920,1080]])('keeps controls inside %s×%s', (w,h) => {
  const l=gameLayout(w,h,{top:12,right:0,bottom:20,left:0});
  for(const b of [l.trayBounds,l.waveBounds]) {
    expect(b.x).toBeGreaterThanOrEqual(0); expect(b.y).toBeGreaterThanOrEqual(12);
    expect(b.x+b.width).toBeLessThanOrEqual(w); expect(b.y+b.height).toBeLessThanOrEqual(h-20);
    expect(b.height).toBeGreaterThanOrEqual(44);
  }
  expect(l.field.height).toBeGreaterThan(0);
});
```
- [ ] Run `rtk npm test -- tests/responsive-layout.test.ts`; expect missing geometry assertions to fail before implementation.
- [ ] Implement layout bands using explicit inset origin, compact HUD (56px landscape/88px portrait), 76px catalog and 52px wave row on portrait, combined catalog/wave region on wide screens. Reserve desktop inspector only if width≥1180 and height≥540. Keep `tray` equal to total bottom controls height for older calculations until GameScene adopts rectangles. Adjust final band sizes only upward for measured labels while preserving test minima.
```ts
export interface Insets { top:number; right:number; bottom:number; left:number }
export function readSafeInsets():Insets {
  const el=document.createElement('div');
  el.style.cssText='position:fixed;visibility:hidden;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
  document.body.append(el); const s=getComputedStyle(el);
  const value={top:parseFloat(s.paddingTop)||0,right:parseFloat(s.paddingRight)||0,bottom:parseFloat(s.paddingBottom)||0,left:parseFloat(s.paddingLeft)||0};
  el.remove(); return value;
}
```
- [ ] Update ScrollSheet body default to 16px, preserve 44px actions, clipped input and held-press cancellation. Add optional offset preservation through existing `scrollOffset/scrollTo`. Increase disabled-label contrast without removing disabled semantics. Synchronize CSS/Phaser token values; measure contrast with relative-luminance calculation against actual background colors. Use `matchMedia('(prefers-reduced-motion: reduce)')` to skip presentation tweens rather than simulation updates. Set viewport meta to include `viewport-fit=cover` in `index.html` if absent (include that file in staging if modified).
- [ ] Run `rtk npm test -- tests/responsive-layout.test.ts` and `rtk npm run typecheck`; expect pass. Commit explicit edited files with message `Add responsive control geometry and readable UI tokens`.

## Task 2: Pure tray gesture ownership

**Files:** Create `src/game/systems/TowerTrayGesture.ts`, `tests/tower-tray-gesture.test.ts`. Reuse `Point/Rect` from `ui/viewport.ts` and `TowerId` from shared progression.

**Interfaces:** Export `TrayInput={id:number;point:Point;kind:'touch'|'mouse'|'pen'}`, `TrayIntent={type:'select';towerId:TowerId}|{type:'scroll';dx:number}|{type:'drag';towerId:TowerId;point:Point;anchor:Point}|{type:'drop';towerId:TowerId;point:Point;anchor:Point}|{type:'cancel'}`. Export class `TowerTrayGesture` with `down(input:TrayInput,towerId:TowerId):void`, `move(input:TrayInput):TrayIntent|null`, `up(input:TrayInput):TrayIntent|null`, `cancel():void`, `get dragging():boolean`. Export `edgePan(anchor:Point,field:Rect,blocked:boolean):Point` (velocity px/s).

- [ ] Pin arbitration and no-switch ownership:
```ts
import {expect,it} from 'vitest';
import {TowerTrayGesture,edgePan} from '../src/game/systems/TowerTrayGesture.ts';
it('scroll cannot become placement',()=>{
 const g=new TowerTrayGesture();g.down({id:1,kind:'touch',point:{x:80,y:600}},'longbow');
 expect(g.move({id:1,kind:'touch',point:{x:100,y:599}})?.type).toBe('scroll');
 expect(g.move({id:1,kind:'touch',point:{x:100,y:400}})?.type).toBe('scroll');
 expect(g.up({id:1,kind:'touch',point:{x:100,y:400}})).toBeNull();
});
it('drag anchor is above finger and cancellation suppresses release',()=>{
 const g=new TowerTrayGesture();g.down({id:1,kind:'touch',point:{x:80,y:600}},'longbow');
 expect(g.move({id:1,kind:'touch',point:{x:80,y:580}})).toMatchObject({type:'drag',anchor:{x:80,y:532}});
 g.cancel();expect(g.up({id:1,kind:'touch',point:{x:80,y:400}})).toBeNull();
 expect(edgePan({x:0,y:100},{x:0,y:0,width:300,height:200},false)).toEqual({x:180,y:0});
});
```
- [ ] Run `rtk npm test -- tests/tower-tray-gesture.test.ts`; expect missing module fail.
- [ ] Implement one active contact/state; second `down` cancels and suppresses all contacts until released. `cancel` clears candidate; pointer IDs other than owner cannot drop. Apply thresholds exactly, mouse/pen no offset, release while undecided selects only within threshold. Pan velocity direction matches BattlefieldView.pan (left edge positive dx). Clamp band interpolation:
```ts
const band=(distance:number)=>Math.max(0,Math.min(1,(32-distance)/32))*180;
// Return zero outside field or when blocked; within field:
return {x:band(anchor.x-field.x)-band(field.x+field.width-anchor.x),
        y:band(anchor.y-field.y)-band(field.y+field.height-anchor.y)};
```
- [ ] Add boundary tests at 10px/6px, equal diagonals, downward rejection, click, pen, duplicate release, wrong contact, second contact, all edge directions and outside-field zero. Run targeted tests/typecheck, expect pass. Commit `Define tower tray gesture arbitration`.

## Task 3: Visible tray, placement and compact inspector

**Files:** Create `src/game/ui/TowerTray.ts`, `tests/tower-tray-ui.test.ts`, `tests/scene-tower-drag.test.ts`; modify `GameScene.ts`, `viewport.ts` only if geometry needs extending; extend `tests/game-scene.test.ts`, `scene-purchases.test.ts`.

**Interfaces:** TowerTray constructor `(scene:Phaser.Scene,parent:Phaser.GameObjects.Container,bounds:Rect,onDown:(input:TrayInput,id:TowerId)=>void)`; methods `refresh(gold:number,selected:TowerId|null):void`, `scrollBy(dx:number):void`, `contains(point:Point):boolean`, `controlBounds():Rect[]`, `resize(bounds:Rect):void`, `destroy():void`. It owns no scene-global move/up handlers. GameScene adds private `beginTowerDrag(input:TrayInput,id:TowerId):void`, `handleTrayIntent(intent:TrayIntent|null):void`, `finishTowerDrop(intent:Extract<TrayIntent,{type:'drop'}>):void`. Both tap and drop call existing `tryBuild` exactly once after existing `placementCheck`.

- [ ] Use Phaser test mocks from `tests/scene-purchases.test.ts` and `autoScene` helper. Add real scene mutation checks (do not stub `tryBuild` in transaction checks): place with sufficient gold into an empty plot, duplicate release, occupied plot, gold depleted between preview/release, pause/ended, finger over inspector with valid anchor, scroll+pinch. Assert counts/gold unchanged on rejection. Add UI recording tests for five card identities/order/prices/edge cue and hit rectangles:
```ts
expect(run.towers).toHaveLength(beforeCount+1);
expect(run.gold).toBe(beforeGold-TOWERS.longbow.levels[0].cost);
run.finishTowerDrop(drop); // duplicate physical release must already have been consumed
expect(run.towers).toHaveLength(beforeCount+1);
```
Invoke drop through the pointer-up handler for duplicate-release coverage, not directly twice without gesture state. Expose private methods via typed test casts as existing tests do.
- [ ] Run `rtk npm test -- tests/scene-tower-drag.test.ts tests/tower-tray-ui.test.ts`; expect fail.
- [ ] Render cards using existing tower portrait keys and config. Use clipped viewport/hit boxes; horizontal scroll hides/disables offscreen cards. Resolve on-card down before camera down and stop propagation. Route move/up to tray owner; pan/zoom only when no tray owner. On second contact cancel drag, seed both current positions into PointerGesture, suppress taps until all release. Do not treat stylus as touch for tray offsets.
```ts
// Drop guard before existing domain mutation:
const overControls=this.towerTray!.contains(intent.point)||this.inputOverlayBounds().some(b=>containsPoint(b,intent.point));
if(overControls||!this.cameraView.inField(intent.point)||this.isRunBlocked())return;
const plot=this.cameraView.nearest(this.map.buildable,intent.anchor,28);
if(plot>=0&&this.placementCheck(intent.towerId,plot).ok)this.tryBuild(intent.towerId,plot);
```
Define private `inputOverlayBounds():Rect[]` covering HUD, wave row, active compact inspector, sheet, Relic controls; define local `containsPoint(Rect,Point):boolean` using inclusive left/top and exclusive right/bottom. Avoid allocating stale rectangles after resize.
- [ ] In update, use `edgePan` times `delta/1000`, `cameraView.pan`, `applyView`, and then recompute highlight from anchor. Keep drag overlays screen-space, plot/range world-space. In all lifecycle cancellation paths call tray gesture cancel, clear held contacts and ghost. Overview calls cancellation before reset. Make mouse tap build use Touch preview/confirmation just like touch; preserve Meteor behavior and hotkeys.
- [ ] Replace compact selection's full tower sheet with bounded inline inspector showing upgrade preview/Details/Close. Reserve its physical bounds against placement. Retain desktop right inspector; move targeting/Sell into Details. Wire current Relics/Auto/wave/pause controls into layout bands without changing their actions. On resize use camera resize, redraw controls, restore selection, sheet scroll; never scene restart. Test run ID/wave/gold/towers unchanged and listener cleanup.
- [ ] Run `rtk npm test -- tests/scene-tower-drag.test.ts tests/tower-tray-ui.test.ts tests/scene-purchases.test.ts tests/game-scene.test.ts tests/scene-auto-ui.test.ts`; typecheck. Commit `Add direct tower tray placement and contextual battle controls`.

## Task 4: Detailed panel pause and safe actions

**Files:** Modify `src/game/systems/PauseState.ts`, `GameScene.ts`, `ScrollSheet.ts`; create `tests/scene-detail-pause.test.ts`; extend `scene-timing.test.ts`, `scene-auto.test.ts`.

**Interfaces:** Extend `PauseReason` with `'details'` and add `PauseState.blockedExcept(reason:PauseReason):boolean` for read-only eligibility. GameScene private `detailsPurchaseContext():PurchaseContext`, `openDetails(kind:'tower'|'evolve'|'progression'|'help'):void`, `closeDetails():void`, `performDetailedAction(action:()=>void):void`. The callback invokes existing purchase/sell/targeting logic; no alternate transaction implementation. Reuse `purchaseSelected(intent,towerId,revision)`.

- [ ] Start with actual PauseState and scene fixture tests:
```ts
it('details close retains user and background pause',()=>{
 const {run,loose}=autoScene();
 const panel=loose as unknown as {openDetails(k:'tower'):void;closeDetails():void};
 run.pauseState.set('user',true);panel.openDetails('tower');
 expect(run.pauseState.has('details')).toBe(true);
 run.pauseState.set('background',true);panel.closeDetails();
 expect(run.pauseState.has('details')).toBe(false);expect(run.pauseState.blocked).toBe(true);
});
```
Also test simulation time/Auto unchanged during Details, nested navigation, failed revalidation reopens Details, stale tower/revision, double confirmation and all terminal states. Assert that eligible Campaign foundation and Classic evolution/rank/mastery actions, Sell and targeting controls remain enabled with only details pause, and become disabled with user/background/modal or terminal state. Test both initial render and dynamic action-refresh callbacks; clicking an enabled panel action must close Details before the real mutation.
- [ ] Run `rtk npm test -- tests/scene-detail-pause.test.ts`; expect fail.
- [ ] Add details reason, open/close ownership and callback sequencing:
```ts
// PauseState: used only to quote panel availability, never to mutate:
blockedExcept(reason:PauseReason):boolean {
 return [...this.reasons].some(current=>current!==reason);
}
// GameScene: retain original purchaseContext() for all actual mutations.
private detailsPurchaseContext():PurchaseContext {
 return {...this.purchaseContext(),blocked:this.ended||this.siege.phase==='victory'||
  this.siege.phase==='terminal'||this.pauseState.blockedExcept('details')};
}
private performDetailedAction(action:()=>void):void {
 this.closeDetails();
 if(this.isRunBlocked()){this.showBanner('Resume the battle before making changes.',C.gold);this.openDetails('tower');return;}
 action();
}
```
Use detailsPurchaseContext() only for initial Details rendering, drawProgressionModel eligibility and its sheetRefresh refresh callback, Campaign foundation quote, Sell availability, and targeting availability. Pass it into towerProgressionView/classicRequirements and purchaseEvolution only for read-only previews. Compact inspector continues using normal purchaseContext(). Neither purchaseSelected nor tryBuild nor sellSelected receives this relaxed context: they always use original authoritative guards after closeDetails. For purchases inspect the returned/reported existing transaction result: on failure reopen same Details kind with fresh reason; on success refresh compact inspector. If existing scene action returns void, change it to a boolean success with all callers updated and no altered validation. Confirmation retains selected tower id+revision. Do not replace unrelated modal pause (reward/victory). Details navigation may redraw without toggling details reason. Terminal cleanup removes panel views and cancels inputs.
- [ ] Run detail/timing/Auto/purchase tests and typecheck; expect pass. Commit `Pause detailed reading and revalidate panel actions`.

## Task 5: Complete prerequisite view models

**Files:** Create `src/game/ui/prerequisites.ts`, `tests/prerequisites.test.ts`; modify `progressionView.ts`; extend `progression-ui.test.ts`, `campaign-presentation.test.ts`. Domain files are imported, not changed: EvolutionSystem, campaign config/progress/specializations, UnlockSystem.

**Interfaces:** Export `Requirement={id:string;label:string;met:boolean;progress:string;nextStep:string}`, `classicRequirements(tower:CombatTower,intent:PurchaseIntent,context:PurchaseContext,wavesCompleted:number,towers:readonly CombatTower[]):Requirement[]`, `campaignRequirements(view:CampaignView,level:number):Requirement[]`, `campaignNextStep(view:CampaignView):{level:number|null;text:string}`. Extend `ProgressionAction` with `requirements:Requirement[]`; retain its `reason` for compatibility. All callers use these exact exported models; no parsing requirement text.

- [ ] Test authoritative gates using existing Tower/evolution fixtures:
```ts
const t=new Tower('longbow',100,100,0);
const requirements=classicRequirements(t,{kind:'evolve',branchId:'deadeye'},
 {gold:0,evolutionOpen:false,endless:false,blocked:false,unlocked:new Set()},0,[t]);
expect(requirements.filter(r=>!r.met).map(r=>r.id)).toEqual(['foundation','branch','boss','gold']);
```
Use actual alternative ID from `ALTERNATIVE_BRANCH.longbow` rather than the illustrative literal if it differs. Add Campaign profile factory tests for zero stars, 19/20,29/30 stars, sequential unlocks, configured sigil levels, missing-star next step, all stars, and merged progress. Test Classic rank2 before wave20 (on track), missed checkpoint, earned account branch without current qualifying tower, rank0–3, mastery/limit.
- [ ] Run `rtk npm test -- tests/prerequisites.test.ts`; expect fail.
- [ ] Implement independent gate enumeration in dependency order using `nextPurchaseCost`, imported rules, `context.unlocked`, current tower stage and current run boss/endless. Availability/paused/stale is separately explained by existing action result. Campaign imports `CAMPAIGN_LEVELS`, milestones, sigils, specialization threshold and repository view. For missing lives/score star show actual threshold and recorded best. All-complete returns `{level:null,text:'All Campaign stars earned.'}`.
```ts
const missingGold=Math.max(0,(nextPurchaseCost(tower.towerId,tower.progression,intent)??0)-context.gold);
const goldRequirement:Requirement={id:'gold',label:'Gold',met:missingGold===0,
 progress:`${context.gold} available`,nextStep:missingGold?`Earn ${missingGold} more gold.`:'Cost covered.'};
```
Add stat comparison copy using effective stats, campaign sidegrade modifiers, numeric benefits/drawbacks; attack interval explicitly lower=faster. Keep generic role concise, maximum stage explicit.
- [ ] Run prerequisite/existing progression and Campaign domain tests/typecheck; expect pass. Commit `Explain all progression prerequisites from existing rules`.

## Task 6: Progression screens and local contextual Help

**Files:** Modify `ProgressionScene.ts`, `CampaignScene.ts`, `GameScene.ts`, `MainMenuScene.ts`, `src/main.ts`; create `ContextualGuide.ts`, `helpContent.ts`, `HelpScene.ts`, `tests/contextual-guide.test.ts`, `tests/responsive-progression.test.ts`; extend `progression-scene.test.ts`, `campaign-scene.test.ts`.

**Interfaces:** ContextualGuide constructor `(storage:Pick<Storage,'getItem'|'setItem'>|null)`, `shouldShow(step:'placement'|'upgrade'|'prerequisites'):boolean`, `complete(step):void`, `skip():void`, `replay():void` (same step union); versioned key `aetherhold-ui-guide-v1`. Export Help topics `HELP_TOPICS:ReadonlyArray<{id:string;title:string;body:string}>`. ProgressionScene `init(data?:{tab?:'campaign'|'classic';returnTo?:string}):void`; standalone scene defaults MainMenu. In-battle uses shared read-only content inside GameScene Details rather than replacing the active scene.

- [ ] Write guide failure/replay tests:
```ts
it('unavailable storage never blocks guidance or play',()=>{
 const g=new ContextualGuide({getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}});
 expect(g.shouldShow('placement')).toBe(true);g.complete('placement');
 expect(g.shouldShow('placement')).toBe(false);g.replay();expect(g.shouldShow('placement')).toBe(true);
 g.skip();expect(g.shouldShow('upgrade')).toBe(false);
});
```
Progression tests record displayed text/actions from Phaser mock: separate tabs, empty/all-earned, configured thresholds, saved locally/pending/failed labels, cloud update preserves tab+scroll, and in-battle navigation never discards run. Reuse `ScrollSheet` recording pattern from existing scene tests.
- [ ] Run new tests; expect fail.
- [ ] Build Campaign and Classic sections using Task5 models. Use rows with status words/icon, current/target, next step and relevant navigation. Add “Why locked?” actions beside disabled actions; keep actual purchase unavailable. Preserve existing personal/legacy best lines. Campaign preparation compares sidegrades and prerequisite checklist; result panels show each earned/missing star threshold and next level/replay. Subscribe to existing AccountSystem notifications for refresh; unsubscribe shutdown; preserve existing warnings. Do not create new sync state labels from guessed repository storage status.
```ts
// Reading panel state refresh must preserve UI context:
const offset=this.sheet?.scrollOffset??0;
this.renderProgression(this.activeTab);
this.sheet?.scrollTo(offset);
```
Define private `renderProgression(tab:'campaign'|'classic'):void` and `activeTab` in the standalone scene, and equivalent GameScene renderer without scene transition.
- [ ] Implement Guide with try/catch storage and session state. At gameplay start offer placement instruction; after first successful build offer upgrade hint; on first Details/locked item offer prerequisite hint. Each has visible Dismiss/Skip, does not consume the active placement pointer. Use deferred next pointer cycle after drop, not release click propagation. Help replay resets only guide state. Help includes pan/pinch/Overview, tap/drag, waves, Relics/Auto and both mode rules; no quest system. Instructions shown for reading use Task4 pause. In-battle exit returns same battle; standalone Help returns its passed return scene.
- [ ] Run new/existing Progression/Campaign/Account UI tests/typecheck; expect pass. Commit `Add Campaign and Classic guidance with skippable Help`.

## Task 7: Whole-journey polish, verification and release

**Files:** Modify `LoginScene.ts`, `MainMenuScene.ts`, `DifficultyScene.ts`, `CampaignScene.ts`, `SettingsScene.ts`, `LeaderboardScene.ts`, `GameOverScene.ts`, `GameScene.ts`, `src/style.css`; extend respective existing scene tests and create `tests/responsive-screens.test.ts`; create `docs/RESPONSIVE_UI_VERIFICATION.md`; update `DESIGN_SYSTEM.md` with actual changed tokens/control conventions. Keep Worker/account domain files untouched.

**Interfaces:** Use Task1 geometry/tokens, existing Account controls and ScrollSheet; retain all scene keys/start-data contracts. No new global navigation service. Preserve active-tab/scroll/form fields across resize; login DOM overlay uses CSS responsive bounds/safe padding.

- [ ] Add recording tests for viewport bounds/long content in menus, sign-in error, nickname/account/delete verification, difficulty choices, Campaign preparation, Help, settings, leaderboard, defeat/victory. Use exact viewport matrix. Disabled lock explanations remain selectable; pointerdown-only settings controls must become release-validated existing button controls to avoid actions during scrolling.
```ts
for(const [width,height] of [[360,640],[640,360],[768,1024],[1366,768]]) {
 expect(controlRect.x+controlRect.width).toBeLessThanOrEqual(width);
 expect(controlRect.y+controlRect.height).toBeLessThanOrEqual(height);
 expect(controlRect.width).toBeGreaterThanOrEqual(44);
}
```
Bind assertions to recorded actual controls from each scene, never a synthetic rectangle detached from rendering.
- [ ] Run `rtk npm test -- tests/responsive-screens.test.ts`; expect fail for existing overlaps/clipping. Replace fixed positioning with bounded panel/grid/ScrollSheet for long lists. Ensure essential non-scroll footer/header actions stay reachable, context navigation preserved and Account button does not overlap title/Close. Preserve Google/deletion form behavior, account status and keyboard focus. Review live hotkeys and keyboard tap alternative; every build remains usable without dragging. Add reduced-motion behavior for guide/panel animation without changing combat effects timing.
- [ ] Run targeted scene tests, then `rtk npm test`, `rtk npm run typecheck`, `rtk npm run build`; expect all current and new assertions pass with only recorded pre-existing skips. Fix failures; do not weaken tests or suppress errors.
- [ ] Start local app with `rtk npm run dev -- --host 127.0.0.1` and local Worker only if account APIs are needed. Use existing DEV QA fixtures for test battles, never fabricated production scores. Inspect every viewport's selected/unselected/boss/reward/terminal/long-content states. Save evidence under ignored `artifacts/responsive-ui/`; report actual screenshots versus tested interactions. Real touchscreen acceptance: tray swipe, upward drag/drop, invalid drop, edge pan, second finger, rotation, Details pause on one phone and one tablet. If hardware unavailable, record that limitation explicitly and request user's targeted check; emulator results alone must not be called hardware verification.
- [ ] Record evidence in `docs/RESPONSIVE_UI_VERIFICATION.md`: viewport/state table, commands/results, known skips, gesture hardware coverage, required-login/Google redirect smoke check, pending-sync status preservation. Have one independent final reviewer examine the whole change if inline execution is selected; fix genuine findings with regressions before deployment.
- [ ] Deploy authorized changes with `rtk npm run deploy` (already tests/build gated). Fetch production HTML and `/api/health`; extract current JS asset and compare SHA256 with local dist asset. Use existing ignored `artifacts/account-acceptance/verify-live.mjs --required` if still applicable; otherwise implement equivalent assertion-based script in ignored artifacts and retain required-login, anonymous-score rejection and no credential output. Expect HTML200, exact current bundle, health ok and required-login true. Browser inspect signed-out live page at phone/desktop without making production scores or deleting accounts.
- [ ] Commit explicit modified files/docs, push `rtk git push origin main` (or current branch selected at execution), and compare `rtk proxy git rev-parse HEAD` with `rtk proxy git ls-remote origin refs/heads/main`. Report live URL, commit and material unverified device behavior. Stop temporary verification servers; leave reusable preview files local.

## Coverage map and handoff

Responsive geometry/readability/safe areas: Tasks1,3,7. Gesture/tap/drag/edge/cancellation: Tasks2–3. Pause/actions: Task4. Rule fidelity and all prerequisites: Tasks5–6. Campaign results/progression and offline refresh: Task6. All screens/Help/guide/accessibility/reduced motion: Tasks1,6–7. Deployment/remote verification: Task7.

Recommend inline execution because the scene/control interfaces are tightly coupled and the user previously favored inline work. Present the reviewed plan for approval and ask which execution method to use before product edits. This planning turn changes documentation only and requires no production deployment.
