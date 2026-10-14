# Guest Play and Readable Displays Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for inline execution, or superpowers:subagent-driven-development if selected. Steps use checkbox syntax for tracking. User requires Luna MAX for independent reviews; do not select the preset Sol High reviewer roles.

**Goal:** Let named guests play and save locally while correcting responsive monster size, Campaign controls, tower-card overflow, and numeric presentation.

**Architecture:** Extend the existing AccountSystem with explicit guest selection and immutable captured run ownership. Store guest import batches in an IndexedDB transaction journal separate from cumulative local guest saves and account outboxes. Reuse authenticated import/score APIs; introduce focused pure display policies rather than moving simulation geometry.

**Tech Stack:** TypeScript, Phaser 4, Vitest, fake-indexeddb, Vite, Cloudflare Worker/D1; no new dependency.

**Spec:** `docs/superpowers/specs/2026-10-14-guest-play-display-design.md` (approved 2026-10-14).

## Global Constraints

- Workflow route remains Light. Implementation stays with the main agent unless the user selects subagent execution. Independent reviews use `gpt-6-luna` with `max` reasoning.
- Work in the existing checkout/current branch `codex/campaign-v5-20261012`; preserve unrelated untracked files and directories shown by Git status. Stage exact task-owned paths.
- Guest names reuse existing Unicode-aware validation and normalization, maximum 20 characters.
- Google sign-in remains required for public score submissions and cross-device saves. Keep `ACCOUNT_LOGIN_REQUIRED="1"` in production and backend anonymous score rejection enabled.
- No combat balance, route positions, collision radii, score era, campaign progression, anonymous cloud identities, or authentication provider changes.
- Round only at display time; persistence, API payloads, score comparison, and combat calculations retain original values.
- Counts/scores use comma grouping; damage/range/splash use at most one decimal; attack/fractional timing at most two; strip trailing zeroes and normalize negative zero. Nonfinite values display an em dash.
- Do not reduce tower-card labels below 12px. Preserve accessible labels, keyboard access, tray tap/drag targets, and scrolling.
- Application changes publish only after integrated verification using `rtk npm run deploy`; afterward verify live page, matching current bundle, and `/api/health`. Commit/push completed task-owned changes and verify remote HEAD.

## Review Focus

1. Guest mode with a live server cookie and failed logout: an explicit local choice must survive refresh without adopting the account (Task 3).
2. Progress earned while an import is awaiting acknowledgment: retain it in a separate open batch and never replace the frozen payload (Task 2).
3. Account deletion with an unacknowledged claimed batch: abandon it only after confirmed deletion, stop retries, preserve fresh unclaimed data (Task 3).
4. Google navigation with session-only saves: cancellation keeps memory; proceeding warns and promises no import after redirect (Task 4).
5. Tiny battlefield, animation pose changes, and death at zoom: keep size ordering and continuity without altering enemy geometry (Task 6).

## File Structure and Task Dependencies

- Task 1: `src/shared/displayNumbers.ts` and existing UI presentation consumers. Pure formatting only.
- Task 2: `src/game/systems/GuestProgress.ts`, `GuestStorage.ts`, shared guest types, and AccountStorage migration adapter. Own import journal and snapshot validation.
- Task 3: AccountSystem, AccountProgress, Settings, captured-run shared types. Own identity and sync integration; consumes Task 2.
- Task 4: Login/Difficulty/MainMenu/Game/GameOver/Campaign scenes, account controls, shared run settlement helpers. Own UI and run event integration; consumes Tasks 2–3.
- Task 5: `src/game/ui/campaignHeader.ts`, `campaignResultActions.ts`, `towerTrayLayout.ts` and existing layout consumers. Own the three reported layout corrections; consumes Task 1 and guest labels from Task 3.
- Task 6: `src/game/ui/enemyPresentation.ts`, GameScene projection and art-support consumers. Pure policy plus integration; independent of guest storage.
- Task 7: integration regression coverage and browser evidence. Consumes Tasks 1–6.
- Task 8: release documentation, publication, and remote synchronization. Consumes Task 7.

Do tasks in numerical order to avoid overlapping edits in GameScene. Each task is a testable checkpoint, not a separate production deployment: the guest contracts must land together before the application change is successful.

## Task 1: Shared numeric presentation

**Files:** Create `src/shared/displayNumbers.ts`, `tests/display-numbers.test.ts`. Modify `src/game/ui/progressionView.ts`, `src/game/ui/components.ts`, `src/game/ui/TowerTray.ts`, `src/game/scenes/{GameScene,GameOverScene,DifficultyScene,CampaignScene,LeaderboardScene,MainMenuScene,ProgressionScene}.ts`, `src/game/campaign/{presentation,prerequisites}.ts`, and `tests/stat-format.test.ts`.

**Interfaces:** Consumes numeric values only. Produces `formatQuantity(value:number, digits:0|1|2=0):string`, `formatCount(value:number):string`, `formatPercent(value:number):string` (input already expressed in percentage points), and existing `formatStat(kind:StatKind,value:number):string` delegating to the shared formatter.

- [ ] Add failing examples, retaining behavioral assertions when updating old fixed-decimal expectations:

```ts
import {it,expect} from 'vitest';
import {formatQuantity,formatCount} from '../src/shared/displayNumbers.ts';
it('groups counts, limits decimals and does not mutate values',()=>{
  const range=214.50000000000003;
  expect(formatCount(12345)).toBe('12,345');
  expect(formatQuantity(range,1)).toBe('214.5');
  expect(formatQuantity(151.99999999999997,1)).toBe('152');
  expect(formatQuantity(.36000000000000004,2)).toBe('0.36');
  expect(formatQuantity(1,2)).toBe('1');
  expect(formatQuantity(-0,1)).toBe('0');
  expect(formatQuantity(Infinity,1)).toBe('—');
  expect(range).toBe(214.50000000000003);
});
```

- [ ] Run `rtk npm test -- tests/display-numbers.test.ts tests/stat-format.test.ts`; expected missing formatter failures/new expectations fail.
- [ ] Implement the formatter and stat delegation:

```ts
export function formatQuantity(value:number,digits:0|1|2=0):string {
  if(!Number.isFinite(value))return '—';
  const rounded=Number(value.toFixed(digits));
  return new Intl.NumberFormat('en-US',{minimumFractionDigits:0,maximumFractionDigits:digits}).format(Object.is(rounded,-0)?0:rounded);
}
export const formatCount=(value:number):string=>formatQuantity(value,0);
export const formatPercent=(value:number):string=>`${formatQuantity(value,2)}%`;
// progressionView:
// return formatQuantity(value,kind==='attackInterval'?2:1);
```

- [ ] Replace quantity interpolation at the named consumers, including raw Campaign tower preview around GameScene's `Damage ... → ...` line and result requirement progress strings. Retain `m:ss` clocks, dates, versions, rank/level/wave identifiers. Percent call sites multiply fractions by 100 before `formatPercent`; multipliers use `formatQuantity(value,2)+'×'`. Existing `number` helper in components delegates to `formatCount`. Search `rtk rg -n 'toFixed|toLocaleString|String\(cost\)|result.score|bestScore|finalScore|stats.range' src` and classify each remaining hit against the exclusions, recording reviewed quantity surfaces in the release ledger.
- [ ] Run `rtk npm test -- tests/display-numbers.test.ts tests/stat-format.test.ts tests/scene-progression-ui.test.ts tests/campaign-presentation.test.ts`; expected pass. Run `rtk npm run build` to catch consumer imports. Commit exact edited paths as `feat: format player-facing game quantities consistently`.

## Task 2: Durable guest journal and migration

**Files:** Create `src/game/systems/{GuestProgress,GuestStorage}.ts`, `tests/{guest-progress,guest-storage}.test.ts`. Modify `src/shared/account.ts`, `src/game/systems/AccountStorage.ts`, `src/game/systems/AccountProgress.ts`, `tests/account-storage.test.ts`.

**Interfaces:** Consume existing `CloudProgress`, `GuestSnapshot`, `GuestClaim`, `RunResult`, `AccountRef`, `mergeCloudProgress`, `validateCloudProgress`, `validateScorePayload`. Keep the server GuestClaim wire projection unchanged. Produce:

```ts
export interface GuestBatch extends GuestClaim {status:'claimed'|'consumed'|'abandoned'}
export interface GuestJournal {
  version:1; initialized:boolean; open:GuestSnapshot;
  batches:GuestBatch[]; seenRunIds:string[];
}
export interface GuestRunProgress {progress:CloudProgress;result:RunResult|null}
export interface GuestStoreView {journal:GuestJournal;persisted:boolean;warning:string|null}
export class GuestStorage {
  constructor(options?:{databaseName?:string});
  view():Promise<GuestStoreView>;
  bootstrap(snapshot:GuestSnapshot,legacy:GuestClaim|null):Promise<GuestStoreView>;
  record(run:GuestRunProgress,nickname:string):Promise<GuestStoreView>;
  claim(ref:AccountRef):Promise<GuestBatch|null>;
  acknowledge(importId:string,ref:AccountRef):Promise<void>;
  abandon(ref:AccountRef):Promise<void>;
  close():Promise<void>;
}
export function guestRunProgress(result:RunResult,earned:CloudProgress['earned']):GuestRunProgress;
```

`GuestStorage` uses a separate database `aetherhold-guests`, version 1, one `journal` object store/key `current`. Each mutation opens one readwrite transaction, reads current, validates it, updates, writes, and resolves after transaction completion. Keep an in-memory equivalent if IndexedDB fails; expose `persisted:false` with a warning, never overwrite invalid stored bytes. Do not perform network calls inside transactions.

- [ ] Add actual transaction tests with fake-indexeddb and concrete empty snapshots:

```ts
import 'fake-indexeddb/auto';
import {it,expect} from 'vitest';
import {GuestStorage} from '../src/game/systems/GuestStorage.ts';
import {emptyCloudProgress} from '../src/shared/cloudProgress.ts';
it('freezes a claim while subsequent progress remains open',async()=>{
  const s=new GuestStorage({databaseName:crypto.randomUUID()});
  const a={playerId:'a',generation:'g'},b={playerId:'b',generation:'h'};
  const initial={progress:emptyCloudProgress(),nickname:'Guest',result:null,warnings:[]};
  initial.progress.earned.volley=new Date(0).toISOString();
  await s.bootstrap(initial,null);
  const first=await s.claim(a);expect(first).not.toBeNull();
  expect(await s.claim(a)).toEqual(first);
  await expect(s.claim(b)).rejects.toThrow(/claimed/i);
  await s.acknowledge(first!.importId,a);
  expect((await s.view()).journal.batches[0].status).toBe('consumed');
  await s.close();
});
```

Add concurrent claims from two GuestStorage instances sharing one database: exactly one account wins, loser receives ownership conflict. Add new run during claimed batch, acknowledge old, claim new: old snapshot is unchanged and new batch excludes old earned key/result. Test malformed journal preservation, IDB failure memory warning, duplicate run IDs, consumed and unconsumed legacy claims, account generations and abandon retaining `open`.

- [ ] Run `rtk npm test -- tests/guest-progress.test.ts tests/guest-storage.test.ts`; expected missing modules failures.
- [ ] Implement immutable snapshot copying and pure run projections. A Campaign victory record derives its booleans from this run's level thresholds (`getCampaignLevel`), score and lives; never copy the cumulative Campaign record into a fresh batch. Defeat/siege failure contributes no clear achievements. Independently re-earned completion needed to validate a new run's star is allowed; prior claimed score/lives/star values are never copied. Classic contributes a `PersonalBest` for its score era from that run and only newly earned branch entries passed by GameScene; `open` unions new events with the existing merge rules. Only current-era validated Classic terminal payloads become `open.result`, replacing the previous unclaimed result. Preserve claimed snapshots/results. Record each run ID once; debug/QA runs are excluded by Task 4.
- [ ] Implement bootstrap once atomically: no legacy claim imports validated legacy guest snapshot into open; unconsumed legacy claim becomes a frozen claimed batch and open starts empty; consumed legacy claim becomes consumed with its frozen snapshot and open starts empty. The cumulative browser guest save is untouched. Import legacy latest retry only when its validation succeeds. `AccountStorage.readGuestClaim()` remains the migration reader; old claim is not rewritten/deleted. On later bootstrap calls `initialized` prevents reseeding cumulative claimed data. Before allocating a fresh claim, return the outstanding claim for its same owner or raise ownership conflict for another; otherwise freeze/clear open only when it contains progress or a result. `acknowledge` and `abandon` verify owner/generation and retain tombstones; abandon claimed batches for that owner only, discard their results, keep open.
- [ ] Run `rtk npm test -- tests/guest-progress.test.ts tests/guest-storage.test.ts tests/account-storage.test.ts`; expected pass. Commit exact files as `feat: retain claimable guest progress batches`.

## Task 3: Explicit guest identity, import, and lifecycle

**Files:** Modify `src/shared/account.ts`, `src/game/systems/{AccountSystem,AccountProgress,Settings}.ts`, `tests/account-system.test.ts`; create `tests/guest-account-system.test.ts` and `tests/helpers/guestAccountFixture.ts`.

**Interfaces:** Consume GuestStorage from Task 2. Produce AccountView `playMode:'blocked'|'legacy'|'guest'|'account'`, `guestName:string`, `guestPersisted:boolean`; keep legacy only for existing disabled-rollout tests, never the production guest upload path. Add:

```ts
export type RunOwner={mode:'guest';name:string}|{mode:'account';account:AccountRef;name:string};
// AccountSystem public additions
enterGuest(name:string):Promise<ApiResult<null>>;
renameGuest(name:string):Promise<ApiResult<null>>;
googleSignInPreflight():Promise<{allowed:boolean;requiresLossAcknowledgment:boolean;message:string|null}>;
beginGoogleSignIn(acknowledgeLoss:boolean=false):Promise<{ok:boolean;requiresLossAcknowledgment:boolean;message:string|null}>;
captureRun():RunOwner|null;
completeGuestRun(owner:Extract<RunOwner,{mode:'guest'}>,run:GuestRunProgress):Promise<void>;
currentPlayerName():string;
// Settings addition
guestSettingsStatus():{persisted:boolean;warning:string|null};
```

Inject optional `guestStorage?:GuestStorage` into AccountSystem options. Store an explicit identity intent in settings: `guestSelected:boolean`, `googleSignInPending:boolean`, preserving old normalization defaults (`false`). `googleSignInPreflight` performs no mutation and returns `allowed:false` for active-run/uncertain-deletion blocks; its loss flag is true when existing guest progress/result is not durably retained. `beginGoogleSignIn` reruns preflight; returns `ok:false` without mutation if disallowed or loss acknowledgment is needed and false. Only an allowed invocation with sufficient acknowledgment sets pending immediately before navigation and clears stale logout suppression. Cancelling the warning needs no rollback because preflight never mutates. Parse `authError` before AccountSystem's initial session adoption: failed/cancelled auth clears pending and restores guest choice; successful fresh auth clears guest choice. Memory fallback in Settings retains both normalized values and name on read/write failure and reports warning; existing best memory map must also cover prefix `''` so guest bests survive scenes without storage.

- [ ] Export test fixture `createGuestAccountFixture():{system:AccountSystem;client:AccountClient;storage:AccountStorage;guests:GuestStorage;close:()=>Promise<void>}` with unique fake-IDB databases, existing ref `{playerId:'a',generation:'g'}`, ready profile/session from the existing account-system fixture, and no network. In tests override getSession/getConfig, use vi spies, and always close systems/databases.

```ts
it('guest selection suppresses a retained Google cookie',async()=>{
  const f=createGuestAccountFixture();
  await f.system.initialize();
  const revoke=vi.spyOn(f.client,'logoutSession').mockResolvedValue({ok:false,code:'NETWORK',message:'offline',status:0});
  await f.system.logout();expect(revoke).toHaveBeenCalled();
  expect((await f.system.enterGuest('Aria')).ok).toBe(true);
  await f.system.refresh();
  expect(f.system.view()).toMatchObject({playMode:'guest',session:null,guestName:'Aria'});
  expect(f.system.canStartBattle()).toBe(true);await f.close();
});
```

- [ ] Run `rtk npm test -- tests/guest-account-system.test.ts tests/account-system.test.ts`; expected new APIs fail. Add required cases: invalid name blocked; failed config and session fetch still allows explicit guest; remembered name reload; expired account guest entry; late adoption after explicit guest ignored; active guest/account run on other-tab refresh never switches repository; uncertain deletion rejects guest; confirmed deletion abandons owner claim but preserves open; failed imports do not block ready account; different-owner claim conflict never uploads; failed enqueue/ack retries idempotently.
- [ ] Implement guest selection before remote config/session adoption. Validate name and active/deletion guards; stop sync; increment lifecycle; select guest repositories; clear presentation session/profile only, preserve account cache/outbox. `captureRun` records non-null owner for either mode, eliminating null as guest/idle ambiguity; retain `captureAccount` compatibility until Task 4 converts callers. Active-run refresh only emits notice/deferred identity; `discardBattle` or completed guest/account settlement releases owner and resolves refresh at the menu boundary. Do not reselect repositories while a run/result view still uses them.
- [ ] Implement import retry before account outbox upload in `flushNow`: bootstrap journal, claim with current owner, post unchanged `importGuest` projection, verify session/profile owner after response, enqueue Classic result, then acknowledge batch. If enqueue/ack fails, keep claim retryable: next import returns current profile and enqueue deduplicates by run ID before ack. Never upload the claim result before import succeeds. Claim conflict/import error surfaces warning/pending; ready profile remains playable; account's unrelated outbox remains owned by account. On confirmed deletion call `guests.abandon(ref)` and normal purge; on uncertain deletion keep claimed data. Server tombstone protection already exists in worker/accounts.ts; retain tests against it.
- [ ] Run `rtk npm test -- tests/guest-account-system.test.ts tests/account-system.test.ts tests/account-storage.test.ts tests/account-integration.test.ts`; expected pass. Commit exact files as `feat: support explicit local guest identity and safe account merge`.

## Task 4: Guest screens and immutable run settlement

**Files:** Modify `src/game/scenes/{LoginScene,DifficultyScene,MainMenuScene,GameScene,GameOverScene,CampaignScene}.ts`, `src/game/ui/{accountControls,helpContent}.ts`, `src/style.css`, `tests/{account-gameplay,saved-score-ui,scene-auto-ui}.test.ts`; create `tests/guest-entry-ui.test.ts`, `tests/guest-run-settlement.test.ts`.

**Interfaces:** Consume Task 3 APIs/RunOwner and `guestRunProgress(result,earned)` from Task 2. GameOver Data adds `runOwner:RunOwner`; GameScene stores `runOwner:RunOwner|null` captured once after entry guard; account-only `runAccount` derived from it for existing sync consumers. `mountAccountButton` still supports existing call arguments until Task 5 adds bounds option. Produces named guest entry in both game modes and local-only result actions.

- [ ] Test UI with existing scene/mock patterns from account-gameplay and saved-score-ui, plus DOM stubs used by screens tests. Provide form labels/error/status/buttons in assertions. Pin guest terminal and discard behavior:

```ts
import {afterEach,expect,it,vi} from 'vitest';
import {GameScene} from '../src/game/scenes/GameScene.ts';
import {accountSystem} from '../src/game/systems/AccountSystem.ts';
import {SoundManager} from '../src/game/systems/SoundManager.ts';
vi.mock('phaser',()=>({default:{Scene:class{},Math:{Vector2:class{constructor(public x:number,public y:number){}}},Scenes:{Events:{SHUTDOWN:'shutdown'}},Scale:{Events:{RESIZE:'resize'}}}}));
afterEach(()=>vi.restoreAllMocks());
it('settles a captured guest once despite later account presentation',()=>{
  const run=new GameScene() as any;
  run.init({difficulty:'medium',playerName:'Aria'});
  run.runOwner={mode:'guest',name:'Aria'};run.runAccount=null;
  run.scene={start:vi.fn(),restart:vi.fn()};
  vi.spyOn(SoundManager,'get').mockReturnValue({gameover:()=>{},stopMusic:()=>{}} as any);
  const guest=vi.spyOn(accountSystem,'completeGuestRun').mockResolvedValue();
  const account=vi.spyOn(accountSystem,'settle').mockResolvedValue();
  vi.spyOn(accountSystem,'view').mockReturnValue({...accountSystem.view(),playMode:'account'});
  run.siege.highestWave=1;
  run.siege.progress=()=>({highestWave:1,wavesCompleted:0,outcome:'defeat',siegeBossesDefeated:0});
  run.finishRun('defeat');run.finishRun('defeat');
  expect(guest).toHaveBeenCalledTimes(1);
  expect(guest).toHaveBeenCalledWith({mode:'guest',name:'Aria'},expect.objectContaining({result:expect.objectContaining({mode:'classic'})}));
  expect(account).not.toHaveBeenCalled();
});
```

Test Campaign clear, Classic Finish/defeat/siege failure, Restart/Quit zero settlement, debug/QA exclusion, retained latest valid result, a session-only sign-in warning cancel, remembered guest skipping name input, and a live refresh while on guest result screen.
- [ ] Run `rtk npm test -- tests/guest-entry-ui.test.ts tests/guest-run-settlement.test.ts tests/account-gameplay.test.ts`; expected guest entry/settlement failures.
- [ ] LoginScene renders guest name form and Play as Guest even in loading/error states, disabling only while its own operation is busy or deletion uncertain. Use existing validatePlayerName before enterGuest/renameGuest. Input supports composition without invalid premature validation; inline role=alert errors and role=status warning. Guest manage screen offers Save name, Continue, Google sign-in and browser-only explanation. Use the sign-in sequence below. Google failure query is resolved before initial session adoption as specified in Task 3, retaining guest mode. Guest account controls display guest name/status; signed-in controls keep existing deletion flow and expand deletion warning to pending guest claims.

```ts
// LoginScene's Google click handler; warning UI calls confirmedGoogleSignIn(true).
const preflight=await accountSystem.googleSignInPreflight();
if(!preflight.allowed){this.message=preflight.message??'Sign-in is unavailable.';this.render();return;}
if(preflight.requiresLossAcknowledgment){
  this.message=preflight.message??'Unsaved guest progress will be lost during sign-in.';
  this.lossWarningOpen=true;this.render();return;
}
await this.confirmedGoogleSignIn(false);
// confirmedGoogleSignIn(acknowledgeLoss:boolean):Promise<void>
const prepared=await accountSystem.beginGoogleSignIn(acknowledgeLoss);
if(!prepared.ok){this.message=prepared.message??'Sign-in is unavailable.';this.render();return;}
location.assign('/api/auth/start');
// Cancel only sets lossWarningOpen=false and rerenders; identity intent is untouched.
```

Add `lossWarningOpen:boolean` and `confirmedGoogleSignIn(acknowledgeLoss:boolean):Promise<void>` to LoginScene. Tests spy on navigation: preflight warning and Cancel make zero navigation calls and leave `googleSignInPending:false`; Continue passes true, makes one navigation, sets pending once. If storage state worsens between preflight and confirmation, beginGoogleSignIn returns its refreshed loss/block status and the UI keeps the player on the screen.
- [ ] MainMenu hides legacy anonymous-submit/retry controls in production guest mode; replaces them with Sign in to submit. Difficulty uses currentPlayerName, makes account name readonly, and routes guest edits through renameGuest on validated entry rather than saving an account nickname into guest settings. Campaign starts with currentPlayerName. GameScene init/create obtains RunOwner once and never substitutes a refreshed session nickname. Capture branch-earned entries during each run; on terminal settlement build the existing validated result payload once, preserve run ID, and call completeGuestRun(owner,guestRunProgress(result,earned)) for guests. Persist before terminal navigation where possible; visible warning on failure. Campaign uses independent run score/lives projection, not cumulative clear progress; Classic local best remains cumulative. Settlement/discard marks captured owner complete exactly once.
- [ ] GameOver determines result mode from `data.runOwner`, never `config.loginRequired` or a later session. Guest shows local-save status and Google sign-in action; cannot call submitRetainedScore/submitScore. Keep legacy manual controls only for legacy rollout fixtures. Account results retain automatic-upload status. GameScene Campaign result includes guest save status. After all consumers use captureRun, remove obsolete captureAccount call sites and ambiguous activeBattle null checks.
- [ ] Run `rtk npm test -- tests/guest-entry-ui.test.ts tests/guest-run-settlement.test.ts tests/account-gameplay.test.ts tests/saved-score-ui.test.ts tests/scene-auto-ui.test.ts`; expected pass. Run `rtk npm run build`. Commit task-owned files as `feat: let named guests enter and finish both game modes`.

## Task 5: Header, result action order, and tray containment

**Files:** Create `src/game/ui/{campaignHeader,campaignResultActions,towerTrayLayout}.ts`, `tests/guest-display-layout.test.ts`. Modify `src/game/scenes/{CampaignScene,GameScene}.ts`, `src/game/campaign/mapLayout.ts`, `src/game/ui/{accountControls,TowerTray}.ts`, `src/style.css`; extend `tests/campaign-world-map-fit.test.ts` and `tests/tower-tray-gesture.test.ts` if present.

**Interfaces:** Consume Rect, formatCount, accountSystem labels. Produce:

```ts
campaignHeaderActions(width:number):{account:Rect;back:Rect;titleWidth:number};
campaignResultActions(outcome:'victory'|'defeat'|'siege-failed',level:number,highestUnlocked:number,totalLevels:number):Array<'next'|'restart'|'map'>;
towerTrayCardLayout():{width:88;height:68;portrait:Rect;name:Rect;cost:Rect;status:Rect};
// mountAccountButton gains optional fourth parameter:
// bounds?:Rect — canvas-space bounds projected through canvas DOM rect.
```

- [ ] Add pass/fail geometry and action tests:

```ts
expect(campaignResultActions('victory',3,4,100)).toEqual(['next','restart','map']);
expect(campaignResultActions('victory',100,100,100)).toEqual(['restart','map']);
expect(campaignResultActions('defeat',3,4,100)).toEqual(['restart','map']);
for(const width of [390,768,1440]){
 const h=campaignHeaderActions(width);
 expect(h.account.y+h.account.height/2).toBe(h.back.y+h.back.height/2);
 expect(h.account.x+h.account.width).toBeLessThan(h.back.x);
 expect(h.titleWidth).toBeGreaterThan(0);
}
```

- [ ] Run `rtk npm test -- tests/guest-display-layout.test.ts`; expected missing policy failures.
- [ ] Set header actions to `{back:{x:width-80,y:4,width:64,height:44},account:{x:width-158,y:4,width:72,height:44},titleWidth:width-190}`. Replace Campaign's floating account placement with these bounds and reserve title/badge width. In landscape height<520, move Codex/Mastery/Prepare to a second row y=52 and update campaignScreenLayout header/tabs/map positions consistently; Account and Back remain first-row y=4. DOM mount projects x/y/width/height using canvas rect scale; removes default top/right CSS when custom bounds supplied and unsubscribes resize/shutdown. Test account and Back remain aligned even with canvas offset/scaling.
- [ ] Build Campaign result actions from helper list, one loop advancing y by 52; Next primary, Restart primary only when Next absent, World Map secondary. Preserve next-level eligibility and QA fixture guards.
- [ ] Tray geometry: portrait `{x:6,y:8,width:28,height:28}`, cost `{x:40,y:8,width:44,height:16}`, status `{x:40,y:25,width:44,height:27}`, name `{x:4,y:52,width:80,height:14}`. Render unavailable status as `Need\ngold`, affordable as `gold`, using 12px; cost uses formatCount and 14px with width bound, shrinking cost to 12px only if necessary (current base costs 100–160 fit). Keep 88x68 hitbox, existing 94px step, clipping/scroll affordance. Use measured text bounds tests for all TOWERS and both statuses, plus browser inspection.
- [ ] Run `rtk npm test -- tests/guest-display-layout.test.ts tests/campaign-world-map-fit.test.ts tests/tower-tray-gesture.test.ts tests/tower-tray-ui.test.ts`; expected pass. Commit exact files as `fix: contain tower labels and align campaign actions`.

## Task 6: Responsive enemy visual policy

**Files:** Create `src/game/ui/enemyPresentation.ts`, `tests/enemy-presentation.test.ts`. Modify `src/game/scenes/GameScene.ts`, `src/game/art/enemyArt.ts` only if a bounds accessor is needed; extend `tests/{boss-panel-placement,campaign-enemy-animation}.test.ts`.

**Interfaces:** Consume viewport CSS dimensions, battlefield CSS height, visible art pose rectangles and source scale, camera fit/zoom. Produce:

```ts
type EnemyPresentationInput={viewportWidth:number;viewportHeight:number;fieldHeight:number;authoredDimension:number;isElite:boolean;isBoss:boolean;fitScale:number};
type EnemyPresentation={overviewDimension:number;localScale:number;bossCap:number};
enemyPresentation(input:EnemyPresentationInput):EnemyPresentation;
```

- [ ] Test policy bands, boundaries, tiny field, and actual visual projection:

```ts
const base={fieldHeight:500,authoredDimension:28,isElite:false,isBoss:false,fitScale:.5};
const desktop=enemyPresentation({...base,viewportWidth:1440,viewportHeight:900});
const phone=enemyPresentation({...base,viewportWidth:390,viewportHeight:844});
expect(desktop.overviewDimension).toBe(32);
expect(phone.overviewDimension).toBe(28);
expect(desktop.localScale*.5*28).toBe(desktop.overviewDimension);
const tiny=enemyPresentation({...base,fieldHeight:60,viewportWidth:390,viewportHeight:844});
expect(tiny.overviewDimension).toBeLessThanOrEqual(14.4);
```

- [ ] Run `rtk npm test -- tests/enemy-presentation.test.ts`; expected missing policy failures.
- [ ] Implement classification exactly as spec. Clamp authoredDimension to regular [32,48]/[24,36]/[20,30]; elite upper limit 1.2x, preserve authored dimension rather than force identical size. Boss target at least 1.25x regular/elite maximum, then cap by 144/40% desktop or 96/30% phone/tablet. For tiny field constrain regular/elite to 80% boss cap. `localScale=overviewDimension/(max(1,authoredDimension)*max(.0001,fitScale))`. Determine authoredDimension once using maximum longest dimension across all visible left/right pose rectangles times original sprite source scale, store in enemy view data, and never recompute from a changing animation pose. Use CSS viewport width/height and canvas-to-CSS scale when Phaser units differ; fieldHeight converted to CSS px, returned overview dimension converted back into canvas units before local scale.
- [ ] Replace GameScene projectEntity fixed floor/compact boost for painted enemies with policy. Preserve fallback non-art projection. WorldRoot already multiplies fitScale*zoom, so localScale cancels fit only; zoom remains proportional. Existing deathScreenScale capture must include zoom: store the current overview-local scale (or divide measured screenScale by fitScale*zoom) and apply shrink without double-counting zoom. Keep shadows/status/HP support attached; boss panel support uses new measured size, retaining existing viewport placement tests. Do not modify Enemy radius or coordinates.
- [ ] Run `rtk npm test -- tests/enemy-presentation.test.ts tests/boss-panel-placement.test.ts tests/campaign-enemy-animation.test.ts`; expected pass. Compare animation poses/death at zoom=1/2/4 and resize in scene harness. Commit exact files as `fix: scale enemy art for desktop tablet and phone`.

## Task 7: Integrated verification and review

**Files:** Extend `tests/{guest-account-system,guest-storage,guest-run-settlement,account-integration,account-gameplay,guest-display-layout,enemy-presentation}.test.ts`. Create `docs/GUEST_PLAY_DISPLAY_VERIFICATION.md` and task-owned evidence under `docs/verification/2026-10-14-guest-play/`.

**Interfaces:** Consume integrated application and existing worker fixture `tests/helpers/accountDb.ts`; produce evidence of all spec acceptance checks and any concrete remaining limitation.

- [ ] Run `rtk npm test` and `rtk npm run build`; expected every existing and new test passes, existing skips unchanged unless explicitly resolved. Record counts and commands. No assertion weakening or coverage removal.
- [ ] Add real D1 regression through existing accountDb fixture: unauthenticated public submission rejects with production login-required env; authenticated repeated import and result yields one score row; deletion retains import ownership tombstone; different generation cannot claim an old import. Use existing account-integration payload/request helpers, and assert row counts and owner rather than mocked call counts alone.
- [ ] Run targeted tests then full suite once after these additions. Start dev server using `rtk npm run dev -- --host 127.0.0.1`; keep session available. Use available browser tools for UI inspection; if unavailable report that concrete blocker instead of claiming screenshots. Use development QA fixtures solely for visual combat/result states, never as proof of guest save behavior.
- [ ] At 1440x900, 768x1024, 390x844, 844x390 inspect entry, name errors/edit, both modes, header, all tower-card affordability states, large score/stat comparisons, victory/defeat/final-level actions, normal/elite/boss, overview/zoom/death/resize. Measure DOM/canvas account/back centers and visible sprite CSS dimensions; save screenshots against user references. Perform a real local guest clear/terminal result, reload, sign-in via account fixture integration, and confirm no anonymous upload. For Google production consent, preserve existing verified flow; never claim a new end-to-end Google login if not exercised.
- [ ] Dispatch one bounded independent whole-change review with Luna MAX, spec/plan paths and exact task-owned diff. Fix concrete findings and rerun affected verification before publication. The user preference overrides preset role models. Do not start multiple review agents or broader repository audit.
- [ ] Record evidence with each acceptance case, test count, visual dimensions, known limits, and review resolution. Commit exact test/evidence/docs files as `test: verify named guest play and responsive displays`.

## Task 8: Production release and synchronization

**Files:** Update `docs/GUEST_PLAY_DISPLAY_VERIFICATION.md` only with verified release facts; package/wrangler config remains unchanged unless an implementation contract demonstrably requires it.

**Interfaces:** Consume passing integrated verification; produce deployed Worker URL/version/current bundle hash, health result, and equal local/remote SHA.

- [ ] Run `rtk npm run deploy`; its existing script runs all tests and TypeScript/Vite build before `wrangler deploy --keep-vars`. A failed command stops publication; fix cause or report blocker.
- [ ] Fetch `https://aetherhold-defense.ljournllagas.workers.dev/` and `/api/health` with a cache-busting query using PowerShell Invoke-WebRequest/Invoke-RestMethod or browser. Parse the script asset URL from live HTML, fetch bytes and compare SHA-256 with corresponding local dist file; assert health success and named guest entry is present in actual UI. Verify unauthenticated score rejection remains enabled. Record Worker version from deploy output and bundle path/hash, never infer them from old docs.
- [ ] Verify the deployed page visually in signed-out browser: guest name entry and MainMenu, Campaign aligned Account/Guest and Back. If browser cannot inspect production, report exact limitation while retaining HTTP/bundle/health evidence. Do not delete production accounts for testing.
- [ ] Commit verified release doc. Run `rtk git push`, `rtk git rev-parse HEAD`, and `rtk git ls-remote origin refs/heads/codex/campaign-v5-20261012`; assert full SHA equality. Final report gives live URL, verification summary, changes, and concrete failure/limitation if any.

## Approval and Execution Handoff

This plan requires independent review, then the user reviews it and selects execution method. Recommend inline/native execution to reduce fresh contexts and conserve usage; one Luna MAX whole-change review remains mandatory. No application implementation starts at this planning stage.

Independent Luna MAX plan review: round 1 scored 8/10 with two blockers (failed-logout test ordering and sign-in preflight/confirmation); both corrected. Round 2 scored 9/10, all 22 explicit spec requirements mapped, zero blockers, zero advisories. Ready for user plan review and execution-method selection.
