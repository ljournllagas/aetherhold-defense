# Tower Evolution and Replay Progression Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking. Execution method awaits the user's choice.

**Goal:** Sustain tower investment after wave 10, conclude a 30-wave siege, and unlock alternative evolution branches for later runs.

**Architecture:** Typed configuration and pure progression operations provide combat stats and purchase transactions. Combat/status, unlock-storage, and siege-lifecycle systems handle behavior while existing Phaser scenes render and dispatch. Explicit terminal-result fields drive client scoring and Worker validation.

**Tech Stack:** Existing Phaser 4.2.1, TypeScript, Vite, Vitest, browser localStorage, Cloudflare Worker and D1. No new product dependency.

**Spec:** `docs/superpowers/specs/2026-10-08-progression-evolutions-design.md`, approved after review at 9/10 with zero blockers.

**Status:** Reviewed, awaiting user execution-method selection.

**Review:** Cleared in three rounds at 9/10; all 35 grouped requirements mapped, zero blockers and zero advisory findings. Baseline verification before implementation: 93 tests passed across 11 files. Gameplay changes, new tests, balancing, rendered QA, migration and deployment are upcoming execution work.

## Global constraints

- Working directory: `C:/dev/Warcraft 3 Inspired Tower Defense`. All shell commands begin with `rtk`; PowerShell operations use `rtk proxy powershell -NoProfile -Command ...`.
- The folder is not a Git repository. Do not initialize Git or create a worktree. Record each checkpoint in `agent_docs/progression_implementation_2026-10-08.md` instead of issuing nonfunctional commits. Preserve unrelated files. The Full design Tier does not change the user's Light workflow route.
- Standard siege: 30 waves; 20–30 minutes at normal speed including ordinary preparation; bosses at 10, 20, 30. Evolution purchase plus three upgrades; mastery only in optional endless.
- Five starters and five achievement-locked alternatives. No permanent stat bonuses, accounts, export/import, heroes, maps, talent framework, or in-progress save/resume.
- Keep foundation levels1–4 and authored sprite indexing separate from evolution ranks. Balance values stay in typed configuration.
- Preserve approved responsive behavior, pause reasons, hidden-page handling, relic inventory3, 70% sale refund, original fantasy art and leaderboard ordering.
- Transactions spend once; timers/effects stop on pause and clean up on terminal result/restart/shutdown. Render/resize must never issue gameplay mutations.
- Use explicit completion/outcome/milestone fields and a new score era. Additive D1 migration preserves historical scores; keep legacy personal best records.
- Every independently successful application increment must pass change-specific checks and automatically deploy via `rtk npm run deploy`, then verify production page, current bundle and health. Planning/docs-only checkpoints do not deploy. Core tasks remain unconnected until the complete integration checkpoint; never expose half-integrated public behavior.
- Unit tests do not establish tuned balance, measured retention, or rendered usability.

## Review focus

1. Upgrade/sale while a projectile flies must not rewrite its stats or double-multiply buffs (Task3).
2. Full relic inventory at victory must have reachable exits without Meteor targeting or Treasure Creature spawning (Tasks5,7,8).
3. Two tabs and failed/corrupt/future storage must retain earned choices without silently overwriting unsupported data (Task4).
4. Positive-lives boss escape and completed wave30 victory require different valid score payloads (Tasks5–7).
5. Rotation/background/repeated input must preserve purchases/rewards/victory without duplicate listeners (Tasks7–8).

## File responsibilities and order

| Area | Files |
| --- | --- |
| Contracts/config | Create `src/shared/progression.ts`, `src/game/config/evolutions.ts`; type existing `config/towers.ts`. |
| Purchases | Create `systems/EvolutionSystem.ts`; adapt `entities/Tower.ts` and `systems/EconomySystem.ts`. |
| Combat | Create `systems/EvolutionCombat.ts`; connect `entities/Enemy.ts` and scene combat in Task7. |
| Unlocks | Create `systems/UnlockSystem.ts` for achievement evaluation and browser profile. |
| Siege | Create `systems/SiegeSystem.ts`; add victory queries to `RewardSystem.ts`/`RunSimulation.ts`. |
| Results | Modify `shared/types.ts`, `validation.ts`, `version.ts`, `Settings.ts`, API client/Worker; additive migration and fixture helper. |
| Integration/UI | Adapt `GameScene.ts`, `GameOverScene.ts`, QA; add `ui/progressionView.ts` and `scenes/ProgressionScene.ts`, menu registration/art accents. |
| Evidence | New focused tests, `artifacts/progression/`, authoritative docs and handoff. |

Paths under systems/entities/config/scenes/ui are inside `src/game/`. Tests are at root `tests/`. Order:1→2→3;1→4;1→5;5→6;2–6→7→8→9. Keep overlapping edits sequential. This is one coherent run-to-result feature, with shared interfaces rather than independent subsystems.

## Shared contracts

Task1 creates the following exact contracts in `src/shared/progression.ts`. Import `TowerLevelStats` from `shared/types.ts` and `TargetCandidate` type from `systems/CombatSystem.ts`; neither import brings Phaser runtime code.

```ts
export type TowerId='longbow'|'ember'|'glacier'|'starfire'|'tempest';
export type BranchId='marksman'|'volley'|'siegebreaker'|'flame-mortar'
  |'winterguard'|'brittle-ice'|'spellbreaker'|'arcane-beacon'|'stormcaller'|'thunderlord';
export type EvolutionRank=0|1|2|3;
export interface EvolutionState {
  foundationLevel:number; branchId:BranchId|null; rank:EvolutionRank|null;
  masteryRank:number; invested:number; revision:number;
}
export type RunOutcome='victory'|'defeat'|'siege-failed';
export interface ResultProgress {
  highestWave:number; wavesCompleted:number; outcome:RunOutcome; siegeBossesDefeated:number;
}
export interface HitCounter { successes:number; }
export interface EffectiveTowerStats extends TowerLevelStats {
  bossDamageMultiplier:number; physicalArmorScale:number; wardArmorScale:number;
  volleyTargets:number; burningField:boolean;
  vulnerabilityMultiplier:number; vulnerabilityMs:number;
  auraDamageMultiplier:number; auraRange:number;
  control:'freeze'|'stun'|null; controlMs:number; bossControlMs:number;
}
export interface CombatTower {
  id:number; towerId:TowerId; x:number; y:number;
  progression:EvolutionState; counter:HitCounter;
}
export interface ShotSnapshot {
  ownerId:number; towerId:TowerId; branchId:BranchId|null; stats:EffectiveTowerStats;
  rawDamage:number; primary:boolean; counter:HitCounter;
}
export interface CombatVictim extends TargetCandidate {
  alive:boolean; isBoss:boolean; physicalArmor:number; wardArmor:number;
}
```

### Task1: Typed roster and effective-stat configuration

**Files:** Create `src/shared/progression.ts`, `src/game/config/evolutions.ts`, `tests/evolution-config.test.ts`. Modify `src/game/config/towers.ts` to export `TOWER_IDS:readonly TowerId[]` and `isTowerId(value:string):value is TowerId`. Retain its existing `Record<string,TowerConfig>` index signature and foundation values so existing string-based callers continue to compile.

**Interfaces:** Consumes existing TOWERS/TowerLevelStats/TargetCandidate. Produces contracts above and:

```ts
export interface EvolutionDefinition {
  id:BranchId; towerId:TowerId; name:string; description:string;
  starter:boolean; stats:readonly EffectiveTowerStats[];
}
export const EVOLUTIONS:Readonly<Record<BranchId,EvolutionDefinition>>;
export const STARTER_BRANCH:Readonly<Record<TowerId,BranchId>>;
export const ALTERNATIVE_BRANCH:Readonly<Record<TowerId,BranchId>>;
export const EVOLUTION_COST_FACTORS:readonly number[];
export const EVOLUTION_RULES:{fieldMs:number;tickMs:number;fieldFraction:number;
  controlCadence:number;controlImmunityMs:number;masteryGain:number;masteryCostGrowth:number};
```

- [ ] Write failing roster/config tests:

```ts
import {expect,it} from 'vitest';
import {EVOLUTIONS,STARTER_BRANCH,ALTERNATIVE_BRANCH} from '../src/game/config/evolutions.ts';
it('has a complete starter and alternative for every archetype',()=>{
  expect(Object.keys(EVOLUTIONS)).toHaveLength(10);
  for(const id of Object.keys(STARTER_BRANCH) as Array<keyof typeof STARTER_BRANCH>){
    expect(EVOLUTIONS[STARTER_BRANCH[id]].starter).toBe(true);
    expect(EVOLUTIONS[ALTERNATIVE_BRANCH[id]].starter).toBe(false);
    for(const branch of [STARTER_BRANCH[id],ALTERNATIVE_BRANCH[id]]){
      expect(EVOLUTIONS[branch].towerId).toBe(id);
      expect(EVOLUTIONS[branch].stats).toHaveLength(4);
      for(const s of EVOLUTIONS[branch].stats){
        expect(Number.isSafeInteger(s.cost)).toBe(true);
        expect(s.cost).toBeGreaterThan(0);
        expect(s.attackInterval).toBeGreaterThan(0);
      }
    }
  }
});
```

- [ ] Run `rtk npm test -- tests/evolution-config.test.ts`; expect missing-import failure.
- [ ] Build all ten rows using the approved spec. Centralize common damage[1.20,1.55,2.00,2.60], interval[1,.97,.94,.90], range[1,1.03,1.06,1.10], cost[1.50,2.00,2.75,3.75]; field3000/500/.30, control5/1500, mastery.05/1.25. Implement factory:

```ts
function branchStats(towerId:TowerId,damage:number,interval:number,
  modifiers:(rank:number)=>Partial<EffectiveTowerStats>):EffectiveTowerStats[]{
  const f=TOWERS[towerId].levels[3];
  return DAMAGE_FACTORS.map((factor,rank)=>({
    ...f,damage:Math.round(f.damage*factor*damage),
    attackInterval:f.attackInterval*INTERVAL_FACTORS[rank]*interval,
    range:f.range*RANGE_FACTORS[rank],
    cost:Math.ceil(f.cost*EVOLUTION_COST_FACTORS[rank]),
    bossDamageMultiplier:1,physicalArmorScale:1,wardArmorScale:1,
    volleyTargets:1,burningField:false,vulnerabilityMultiplier:1,vulnerabilityMs:0,
    auraDamageMultiplier:1,auraRange:0,control:null,controlMs:0,bossControlMs:0,
    ...modifiers(rank)
  }));
}
```

Define DAMAGE_FACTORS/INTERVAL_FACTORS/RANGE_FACTORS locally with the values above. Use ten explicit branchStats calls: Marksman1.35/1.25,boss1.5; Volley.55/1,targets3; Siege1/1,physicalScale.5; Flame.75/1,field; Winter1/1,freeze500/150; Brittle1/1,slow.30/2s,vulnerability[1.15,1.20,1.25,1.30]/3000ms; Spellbreaker1/1,wardScale.5; Beacon.60/1,aura[1.15,1.20,1.25,1.30],range160; Storm1/1,chain=TOWERS.tempest.levels[3].chainCount+[2,3,4,5] (currently[9,10,11,12]); Thunder1.60/1,chain3,stun350/100. Non-overridden stats retain foundation values. Assert the foundation chain count exists before adding offsets.
- [ ] Add concrete modifier assertions for each branch, common rank progression and identical same-archetype branch prices. Test physical/arcane/elemental identity remains correct.
- [ ] Run `rtk npm test -- tests/evolution-config.test.ts` and `rtk npm run typecheck`; expect pass. Record checkpoint. No deployment: unconnected modules do not change application behavior.

### Task2: Atomic purchases, historic investment and mastery

**Files:** Create `src/game/systems/EvolutionSystem.ts`, `tests/evolution-system.test.ts`. Modify `src/game/entities/Tower.ts` and `src/game/systems/EconomySystem.ts`.

**Interfaces:** Consumes Task1. Produces:

```ts
export type PurchaseIntent={kind:'foundation'}|{kind:'evolve';branchId:BranchId}
  |{kind:'upgrade'}|{kind:'mastery'};
export interface PurchaseContext {
  gold:number;evolutionOpen:boolean;endless:boolean;blocked:boolean;unlocked:ReadonlySet<BranchId>;
}
export type PurchaseResult={ok:false;reason:string}|{ok:true;state:EvolutionState;
  gold:number;stats:EffectiveTowerStats;cost:number};
export function initialEvolution(id:TowerId):EvolutionState;
export function effectiveStats(id:TowerId,state:EvolutionState):EffectiveTowerStats;
export function purchaseEvolution(id:TowerId,state:EvolutionState,intent:PurchaseIntent,
  context:PurchaseContext,expectedRevision:number):PurchaseResult;
export function investedRefund(state:EvolutionState):number;
```

Tower owns `progression` and `counter={successes:0}`; towerId is TowerId; constructor retains a string parameter and rejects it unless isTowerId narrows it. level reads foundationLevel (always1–4), stats delegates effectiveStats. initialEvolution records level1 cost after construction succeeds. Keep legacy sellRefund(id,level) for existing pure foundation callers; Task7 live calls use investedRefund. Until Task7 replaces existing `t.level++` and QA level assignments, retain a compatibility level setter for unevolved towers: validate next1–4, assign foundationLevel, record the corresponding foundation total via towerTotalInvested, and increment revision. This preserves current foundation behavior/typechecks; Task7 removes that setter after migrating all writes to transactions or explicitly debug-assisted fixture state construction.

- [ ] Write atomic transaction test:

```ts
const state={...initialEvolution('longbow'),foundationLevel:4,invested:710};
const ctx={gold:2000,evolutionOpen:true,endless:false,blocked:false,unlocked:new Set<BranchId>()};
const first=purchaseEvolution('longbow',state,{kind:'evolve',branchId:'marksman'},ctx,0);
expect(first.ok).toBe(true);
if(!first.ok)throw new Error(first.reason);
expect(first.cost).toBe(510);expect(first.state.invested).toBe(1220);
expect(first.gold).toBe(1490);expect(investedRefund(first.state)).toBe(854);
expect(state.branchId).toBe(null);
expect(purchaseEvolution('longbow',first.state,{kind:'evolve',branchId:'marksman'},
  {...ctx,gold:first.gold},0).ok).toBe(false);
```

- [ ] Run `rtk npm test -- tests/evolution-system.test.ts`; expect missing-functions failure.
- [ ] Validate state: level1–4; branch null iff rank null; evolved level4; mastery>0 only rank3; all integer state/invested/revision/gold safe and nonnegative. Construct candidate for foundation+1, branch rank0, rank+1, mastery+1. Reject cross-archetype/locked branches, branch change, skipped/finished ranks, early evolution/mastery, blocked run, stale revision, unsafe arithmetic and insufficient gold. Implement return kernel after validated candidate/cost:

```ts
return {ok:true,cost,gold:context.gold-cost,
  state:{...candidate,invested:state.invested+cost,revision:state.revision+1},
  stats:effectiveStats(id,candidate)};
```

effectiveStats copies configuration; never compounds mutable stats. Foundation neutral fields equal Task1 defaults. Mastery damage=round(rank3Damage*(1+.05*m)); next cost=ceil(rank3Cost*1.25^(m+1)), current m starts0. Check next stat/cost/invested sums against safe integers before commit. Refund=floor(.70*actual invested). Reset hit counter only on first evolution; no cooldown/position/targeting reset.
- [ ] Test all branches/ranks, locked alternatives, no purchase on canceled preview, permitted combat, pause/ended context, exact rank3 prerequisite, safe huge-rank rejection, historic refund despite later config tuning and unchanged cooldown/targeting/position on state assignment.
- [ ] Run `rtk npm test -- tests/evolution-config.test.ts tests/evolution-system.test.ts tests/game.test.ts` and `rtk npm run typecheck`; expect pass. Record checkpoint; no connected application behavior yet.

### Task3: Combat effects, status expiry and projectile snapshots

**Files:** Create `src/game/systems/EvolutionCombat.ts`, `tests/evolution-combat.test.ts`. Keep `CombatSystem.ts` armor/targeting pure. Scene/Enemy connection occurs in Task7.

**Interfaces:** Consumes Tasks1/2 and existing DamageType/TargetingMode/applyArmor/pickTarget. Produces:

```ts
export interface StatusView {slowFactor:number;frozen:boolean;stunned:boolean;vulnerability:number;}
export interface FieldTick {ownerId:number;x:number;y:number;radius:number;rawDamage:number;atMs:number;}
export class EvolutionCombat {
  makeShot(owner:CombatTower,towers:readonly CombatTower[],damageMultiplier:number,primary?:boolean):ShotSnapshot;
  damage(raw:number,type:DamageType,target:CombatVictim,nowMs:number,shot?:ShotSnapshot):number;
  primaryHit(shot:ShotSnapshot,target:CombatVictim,nowMs:number):void;
  statuses(enemyId:number,nowMs:number):StatusView;
  addField(shot:ShotSnapshot,x:number,y:number,nowMs:number):void;
  tickFields(nowMs:number):FieldTick[];
  get activeFieldCount():number;
  removeOwner(ownerId:number):void;removeEnemy(enemyId:number):void;clear():void;
}
export function volleyTargets(candidates:readonly CombatVictim[],tower:CombatTower,
  stats:EffectiveTowerStats,mode:TargetingMode):CombatVictim[];
export function nextChainTarget(candidates:readonly CombatVictim[],point:{x:number;y:number},
  visited:ReadonlySet<number>):CombatVictim|null;
export function chainShot(previous:ShotSnapshot):ShotSnapshot;
```

Snapshot captures branchId=owner.progression.branchId (null for foundation), copies stats and shares only captured HitCounter; later upgrades/sale never rewrite any of these fields. chainShot preserves branchId through its spread. Projectile art reads this immutable branchId, never the current tower. A sold owner's old shot may increment the captured counter but cannot recreate sold owner fields. primaryHit counts only successfully impacted primaries (including killing shots); applies effects only if target survives. Ground/secondary hits never count.

- [ ] Write immutable shot/nonrecursive aura test:

```ts
const ranger:CombatTower={id:1,towerId:'longbow',x:0,y:0,
  progression:{...initialEvolution('longbow'),foundationLevel:4,branchId:'marksman',rank:0},counter:{successes:0}};
const beacon:CombatTower={id:2,towerId:'starfire',x:10,y:0,
  progression:{...initialEvolution('starfire'),foundationLevel:4,branchId:'arcane-beacon',rank:3},counter:{successes:0}};
const engine=new EvolutionCombat();
const shot=engine.makeShot(ranger,[ranger,beacon],1.5);
expect(shot.rawDamage).toBe(Math.round(effectiveStats('longbow',ranger.progression).damage*1.30*1.5));
const before=shot.rawDamage;
ranger.progression={...ranger.progression,rank:3};engine.removeOwner(ranger.id);
expect(shot.rawDamage).toBe(before);
```

- [ ] Run `rtk npm test -- tests/evolution-combat.test.ts`; expect missing-class failure.
- [ ] Implement makeShot: capture branchId from owner.progression at firing, derive effective owner stats, find highest in-range non-self Beacon multiplier from its unbuffed stats, multiply scene-supplied surge/overcharge once and round. No self/recursive aura; Meteor has no owner shot. damage uses applyArmor(raw*bossMultiplier,type,physicalArmor*physicalScale,wardArmor*wardScale), then round once after largest unexpired vulnerability. Missing shot uses neutral penetration/boss values.
- [ ] Store independent timed slow/vulnerability applications; sample/purge by game time. Fifth-primary freeze/stun shares enemy immunity1500ms across towers, boss durations by isBoss; rejected control does not extend immunity. Time Lock remains independent. Status reduction:

```ts
const slowFactor=Math.max(0,...slows.filter(a=>a.untilMs>nowMs).map(a=>a.factor));
const vulnerability=Math.max(1,...vulnerabilities.filter(a=>a.untilMs>nowMs).map(a=>a.multiplier));
```

Define local application records with factor/multiplier and untilMs. A weaker application cannot extend a stronger application's expiry. Control stops movement only, preserving regen/boss clocks.
- [ ] Implement fields as Map<ownerId,field>. Replace same-owner field; nextTick=impact+500, expires=impact+3000. Emit due ticks while nextTick<=min(now,expires), increment500; delete after last due tick. Each emitted raw tick is snapshot.rawDamage*.30, elemental, radius snapshot splash. No second surge/aura multiplier; current vulnerability applies per victim at tick. Scene filters alive victims and uses its one-death reward path. One field per nine possible towers; removeOwner/clear delete fields.
- [ ] Implement distinct Volley targets through existing mode ordering, ID-stable ties, removing chosen IDs until3 or empty. nextChainTarget filters living/unvisited candidates at distance<130, sorts distance then ID and returns first or null. chainShot returns {...previous,rawDamage:previous.rawDamage*.85,primary:false} without re-snapshotting stats/buffs/counter. Scene applies secondary-impact*.75 once; counter reference/captured stats travel through chains. No victim repeats.
- [ ] Tests: every branch; armor channels; boss bonus; three arrows each once; five-hit cadence/immunity/durations; vulnerability fallback on expiry; Beacon highest-only/range160/self exclusion; field overlap/replacement/ticks500..3000/large delta; dead/escaped targets; pause with unchanged time; owner sale; clear on shutdown; upgrade preserves counters. Verify integration callback credits at most one kill after overlapping ticks.
- [ ] Run `rtk npm test -- tests/evolution-combat.test.ts tests/evolution-system.test.ts tests/run-simulation.test.ts` and `rtk npm run typecheck`; expect pass. Record checkpoint.

### Task4: Achievement evaluation and browser unlock repository

**Files:** Create `src/game/systems/UnlockSystem.ts`, `tests/unlocks.test.ts`. Preserve existing settings keys.

**Interfaces:** Consumes Task1 CombatTower/branches. Produces:

```ts
export interface UnlockProfile {version:1;earned:Partial<Record<BranchId,string>>;}
export interface UnlockView {profile:UnlockProfile;unsaved:ReadonlySet<BranchId>;warning:string|null;}
export function earnedBranches(waveCompleted:number,lives:number,towers:readonly CombatTower[],debugAssisted:boolean):BranchId[];
export class UnlockRepository {
  constructor(storage:Pick<Storage,'getItem'|'setItem'>|null,now?:()=>string);
  view():UnlockView;snapshotForRun():ReadonlySet<BranchId>;
  earn(branches:readonly BranchId[]):void;reconcile():void;
}
export const unlockRepository:UnlockRepository;
```

Singleton retains session-unsaved earnings across scene restarts. Accessing localStorage itself may throw; initialize inside try/catch. Scene storage listener invokes reconcile and is removed on shutdown. snapshotForRun reconciles persisted/session union and retries permitted writes before returning a new Set.

- [ ] Write failing persistence test:

```ts
let value:string|null=null;let fail=true;
const storage={getItem:()=>value,setItem:(_key:string,next:string)=>{
  if(fail)throw new Error('quota');value=next;
}};
const repo=new UnlockRepository(storage,()=> '2026-10-08T00:00:00Z');
repo.earn(['volley']);
expect(repo.view().unsaved.has('volley')).toBe(true);
expect(repo.snapshotForRun().has('volley')).toBe(true);
fail=false;repo.reconcile();
expect(repo.view().unsaved.size).toBe(0);
expect(new UnlockRepository(storage).snapshotForRun().has('volley')).toBe(true);
```

- [ ] Run `rtk npm test -- tests/unlocks.test.ts`; expect missing-import failure.
- [ ] earnedBranches returns distinct alternatives only on wave20 completion, lives>0, !debugAssisted, still-present corresponding starter tower rank>=2. No retroactive waves, win, or kill ownership condition; all difficulties identical.
- [ ] Use key aetherhold-unlocks-v1 and sorted canonical recognized alternative IDs/valid timestamps. Empty→starter profile/no warning. Malformed/access failures→starter fallback/warning; preserve original bytes. Future schema blocks writes. Memory earnings remain usable/unsaved even with corrupt/future storage. Only a later readable supported profile permits overwriting. Merge persisted and memory union before save; preserve earliest timestamp:

```ts
for(const [id,earnedAt] of Object.entries(incoming.earned)){
  if(!isRecognizedAlternative(id)||!validTimestamp(earnedAt))continue;
  const previous=profile.earned[id];
  profile.earned[id]=previous&&previous<earnedAt?previous:earnedAt;
}
```

Define isRecognizedAlternative(value:string):value is BranchId from ALTERNATIVE_BRANCH values and validTimestamp(value:unknown):value is string from string/finite Date.parse checks. Write only when canonical content differs; successful writes reread before clearing a branch's unsaved flag. Failed writes retain memory union and spec warning. Storage events reconcile retained unions after racing valid same-version saves; identical canonical data does not trigger another write. This promises normal eventual two-tab convergence, not atomic server authority.
- [ ] Test rank1/2, wrong branch, sold tower, multiple/repeated earnings, zero lives, debug grants, all difficulties, preserved captured run Set, corrupt/future raw bytes untouched, failed write retry, earliest timestamps and two repositories merging different simultaneous earnings via storage events without write loops.
- [ ] Run `rtk npm test -- tests/unlocks.test.ts` and `rtk npm run typecheck`; expect pass. Record checkpoint.

### Task5: Siege lifecycle and victory-only relic exits

**Files:** Create `src/game/systems/SiegeSystem.ts`, `tests/siege.test.ts`. Add queries to `RewardSystem.ts`/`RunSimulation.ts` without changing normal defaults.

**Interfaces:** Consumes ResultProgress/RunOutcome and existing RelicVault. Produces:

```ts
export interface ClearInput {wave:number;lives:number;spawns:number;enemies:number;flights:number;fields:number;}
export type ClearEvent='none'|'wave-cleared'|'victory';
export class SiegeSystem {
  phase:'siege'|'victory'|'endless'|'terminal'='siege';
  highestWave=0;wavesCompleted=0;siegeBossesDefeated=0;
  startWave(wave:number):boolean;bossKilled(wave:number):void;
  bossEscaped(wave:number,lives:number):RunOutcome|null;
  completeWave(input:ClearInput):ClearEvent;
  choose(action:'finish'|'continue',rewardsResolved:boolean):boolean;
  fail(outcome:'defeat'|'siege-failed'):void;progress():ResultProgress;
  get evolutionOpen():boolean;
}
export function victoryRewardChoices(inventoryCount:number):readonly ('store'|'replace-oldest'|'discard-new')[];
export function victoryRewardsResolved(vault:RelicVault,rewardModalOpen:boolean):boolean;
```

Private activeWave:number|null and terminalOutcome:RunOutcome|null enforce one completion/result. Bits1/2/4 identify scheduled bosses10/20/30; callers pass only marked scheduled boss deaths. startWave accepts completed+1 only if no active wave, rejects31 before endless, records highest. progress is valid only terminal; highest normalized to at least1.

- [ ] Write transition test:

```ts
const siege=new SiegeSystem();
for(let wave=1;wave<=30;wave++){
  expect(siege.startWave(wave)).toBe(true);
  if(wave===10||wave===30)siege.bossKilled(wave);
  expect(siege.completeWave({wave,lives:10,spawns:0,enemies:0,flights:0,fields:0}))
    .toBe(wave===30?'victory':'wave-cleared');
}
expect(siege.choose('continue',false)).toBe(false);
expect(siege.choose('continue',true)).toBe(true);
expect(siege.choose('continue',true)).toBe(false);
expect(siege.startWave(31)).toBe(true);
```

- [ ] Run `rtk npm test -- tests/siege.test.ts`; expect missing-class failure.
- [ ] Implement completeWave kernel:

```ts
if(this.phase==='terminal'||input.wave!==this.activeWave||input.lives<=0)return 'none';
if(input.spawns+input.enemies+input.flights+input.fields!==0)return 'none';
this.wavesCompleted=input.wave;this.activeWave=null;
if(input.wave===30&&(this.siegeBossesDefeated&5)===5){this.phase='victory';return 'victory';}
return 'wave-cleared';
```

choose requires phase victory/resolved rewards; Finish sets terminal/victory, Continue endless without counter/ID reset. bossEscaped10/30 returns defeat at zero lives, otherwise siege-failed;20 returns null unless zero. fail idempotent. evolutionOpen reads bit1. Scene retains orthogonal pause blockers.
- [ ] victoryRewardChoices(3)→replace-oldest/discard-new; at0–2→store/discard-new. resolved means pending0,target null,!rewardModalOpen. Keep normal FULL_REWARD_CHOICES; restrict activation/Use Oldest in scene Task7. Test actual FIFO resolution for full inventory containing Meteor/pilferer/repair; each choice resolves once, cancelTarget preserves reservation/source, navigation requires no simulation, and allowed choices never call beginUse.
- [ ] Test10/30 escapes,20 escape, adds/fields/flights after boss death, zero-lives victory priority, repeated/wrong completion,31 blocked, Finish completion30/highest30/mask5 or7, endless defeat, failed10 completed9 and fresh restart object. Pause tests withhold simulation calls rather than conflating phase and pause.
- [ ] Run `rtk npm test -- tests/siege.test.ts tests/run-simulation.test.ts tests/rebuild-logic.test.ts` and `rtk npm run typecheck`; expect pass. Record checkpoint.

### Task6: Result contracts, Worker validation, additive migration and best eras

**Files:** Create `src/shared/resultProgress.ts`, `migrations/0004_progression_results.sql`, `tests/helpers/progressionResult.ts`, `tests/progression-results.test.ts`. Modify `shared/types.ts`/`validation.ts`/`version.ts`, `systems/Settings.ts`, `api/leaderboardClient.ts`, `worker/index.ts`, `package.json` version, `GameScene.ts` terminal DTO, `GameOverScene.ts` Data, `qa.ts` fixtures and existing game/worker/screens/qa tests.

**Interfaces:** GameResultPayload extends ResultProgress; ScoreRecord extends it. Keep validateScorePayload/calculateScore/submitScore/fetchLeaderboard signatures. Produce `isValidResultProgress(progress:ResultProgress,lives:number,bossesKilled:number):boolean` from resultProgress.ts, shared by Worker/client. LocalBest adds scoreVersion; loadBest returns current-era only; produce `loadLegacyBest():LocalBest|null` for unchanged legacy data display (normalize absent old scoreVersion to1).

- [ ] Create configured result fixture:

```ts
export function resultFixture(progress:ResultProgress,remainingLives=10):GameResultPayload{
  let enemiesKilled=0,bossesKilled=0,elitesKilled=0;
  for(let wave=1;wave<=progress.wavesCompleted;wave++){
    for(const group of buildWave(wave).groups){
      enemiesKilled+=group.count;
      if(ENEMIES[group.enemyId].isBoss)bossesKilled+=group.count;
      if(ENEMIES[group.enemyId].isElite)elitesKilled+=group.count;
    }
  }
  const score=calculateScore({enemiesKilled,bossesKilled,elitesKilled,
    wavesCompleted:progress.wavesCompleted,remainingLives,unusedGold:0},DIFFICULTIES.medium);
  return {...progress,playerName:'TestWarden',difficulty:'medium',enemiesKilled,bossesKilled,
    remainingLives,finalScore:score.finalScore,gameDurationSeconds:3600,runId:'progression-run-0001',
    gameVersion:GAME_VERSION,scoreVersion:SCORE_VERSION};
}
const victory=resultFixture({highestWave:30,wavesCompleted:30,outcome:'victory',siegeBossesDefeated:7});
expect(validateScorePayload(victory).ok).toBe(true);
expect(validateScorePayload({...victory,wavesCompleted:29}).ok).toBe(false);
expect(validateScorePayload({...victory,siegeBossesDefeated:3}).ok).toBe(false);
```

Imports in helper use exact existing WaveSystem/ENEMIES/DIFFICULTIES/ScoreSystem/version exports and shared ResultProgress/GameResultPayload types. Use unique runId per independent POST. For wave20 escaped fixture subtract that boss/enemy/elite kill and recompute score; do not just change mask while leaving all-boss-kill count.
- [ ] Run `rtk npm test -- tests/progression-results.test.ts`; expect explicit new-field/rule failures before production edits.
- [ ] Add required fields (no implicit defaults for new era), GAME_VERSION0.2.0 and SCORE_VERSION2, package version0.2.0 without dependency updates. Update every DTO/fixture. Temporary GameScene.gameOver supplies actual completed counter/outcome defeat and milestone mask from observed scheduled boss kills, retained for Task7; add that field once. GameOver Data extends payload and submits every required field. Existing validPayload tests with lives>0 become genuine victory or siege-failed fixtures; actual defeat has lives0.
- [ ] Implement rules: highest safe integer1–500, completed0–highest, mask0–7, set bits only after corresponding milestone was entered, popcount(mask)<=bossesKilled. Completion>=10 requires bit1, because an escaped first boss ends the siege. Completion>=30 requires bits1 and4. Victory highest=completed=30,lives>0,mask&5=5. Defeat lives0,completed=highest-1. Siege-failed highest10/30,completed=highest-1,lives>0,escaped boss bit absent; at30 bit1 present. Beyond30 requires completed>=30,mask&5=5. Before10 mask0. Check named scheduled-boss masks/count consistency without claiming replay authority.
- [ ] Refactor validation helpers around explicit completion: minimumNonBossKillsBeforeWave accepts completedWaves rather than highest-1; scoreFloor/scoreCeiling receive wavesCompleted; duration/completed-boss loops use waveNumber<=wavesCompleted; reward/repair wave-roll counts use completed. highest remains bound on possible current-wave kills/gold. Survival budget uses actual lives for completed victory, zero for defeat. Game Over possibleLeakLives rule applies only defeat. Preserve schema/name/request/score caps and configured repair/bounty/summon allowances; fix legitimate final-wave inclusion without blanket widening. Retain every previous forged-score rejection with correct new DTO fields.
- [ ] Add migration:

```sql
ALTER TABLE scores ADD COLUMN waves_completed INTEGER NOT NULL DEFAULT 0;
ALTER TABLE scores ADD COLUMN outcome TEXT NOT NULL DEFAULT 'defeat';
ALTER TABLE scores ADD COLUMN siege_bosses_defeated INTEGER NOT NULL DEFAULT 0;
```

Worker SELECT aliases and INSERT bindings include new fields, preserving era filter/ordering. Extend makeDb stub fields and earliest-date tie ordering; round-trip all outcomes/masks, duplicate, old era, oversized/malformed and failure tests. Validate SQL separately with `rtk npm run db:migrate:local` and `rtk npx wrangler d1 execute aetherhold_scores --local --command "PRAGMA table_info(scores)"`. Seed one legacy row in a local migration smoke fixture and verify count/old values remain; mock D1 does not validate SQL.
- [ ] Keep aetherhold-best-v1 bytes unchanged; new key aetherhold-best-score-v2. Parse current best/version defensively; compare only current era. Test legacy100000 followed by new100 yields new best100 and preserved old record; menu labels old value Legacy if displayed.
- [ ] Run `rtk npm test`, `rtk npm run typecheck`, `rtk npm run build`; expect pass. Record checkpoint; remote publish waits for Task7 complete integration and migration ordering.

### Task7: Integrate run, combat, progression and terminal results

**Files:** Modify `GameScene.ts`, `Enemy.ts`, `WaveSystem.ts`, `GameOverScene.ts`, `qa.ts`; create `tests/progression-integration.test.ts`; adapt affected existing fixtures. Amend authoritative `docs/SPEC.md` gameplay/upgrades/selling/waves/scoring/storage and `DESIGN_SYSTEM.md` wave/victory/progression requirements without undoing responsive amendments.

**Interfaces:** Consumes Tasks2–6. Add scene fields siege:SiegeSystem, evolutionCombat:EvolutionCombat, runUnlocks:ReadonlySet<BranchId>, unlockRepository=singleton, unlocksEarnedThisRun:BranchId[], debugAssisted:boolean. Add methods `purchaseSelected(intent:PurchaseIntent,expectedTowerId:number,expectedRevision:number):void`, `chooseVictory(action:'finish'|'continue'):void`, `finishRun(outcome:RunOutcome):void`. Existing upgradeSelected/gameOver delegate. Flight gains shot:ShotSnapshot; WorldSnapshot towers gain branchId/rank/mastery but retain foundation level1–4.

- [ ] Create Phaser-mocked adapter tests using the constructor/mock pattern already in `tests/rebuild-logic.test.ts`. Assign actual tower/gold/domain fields and stub only render/audio callbacks; invoke production scene commands. Pin stale input:

```ts
scene.purchaseSelected({kind:'evolve',branchId:'marksman'},tower.id,0);
expect(scene.gold).toBe(1490);
expect(tower.progression.branchId).toBe('marksman');
scene.purchaseSelected({kind:'evolve',branchId:'marksman'},tower.id,0);
expect(scene.gold).toBe(1490);
```

Fixture is level4 Ranger/invested710/gold2000, siege bit1, revision0, unblocked, empty runUnlocks. Implement typed test facade via casting new GameScene, with layout-independent presentation stubs; never replace purchase/lifecycle/combat methods under test. Spy submitScore to prove zero calls at victory/Continue/render.
- [ ] Run `rtk npm test -- tests/progression-integration.test.ts`; expect absent-method/assertion failure.
- [ ] At create/reset instantiate systems, capture repository.snapshotForRun, clear prior fields/counters/earned IDs and attach one removable storage listener. New run ID only on new run. Mutating QA commands mark debugAssisted; ordinary trace observation does not. Rendering only reads state; preserve all domain fields through resize.
- [ ] Replace every live `t.level++` with the purchase transaction and every QA level assignment with an explicit debug-assisted progression fixture; remove Task2's compatibility setter. Route purchases through live blockers/identity/revision:

```ts
if(this.selectedTower?.id!==expectedTowerId||this.ended)return;
const tower=this.selectedTower;
const result=purchaseEvolution(tower.towerId,tower.progression,intent,{
  gold:this.gold,evolutionOpen:this.siege.evolutionOpen,endless:this.siege.phase==='endless',
  blocked:this.pauseState.blocked||this.siege.phase==='victory'||this.siege.phase==='terminal',
  unlocked:this.runUnlocks
},expectedRevision);
if(!result.ok){this.showBanner(result.reason);return;}
const evolved=tower.progression.branchId===null&&result.state.branchId!==null;
this.gold=result.gold;tower.progression=result.state;
if(evolved)tower.counter={successes:0};
```

After kernel refresh HUD/inspector/art. tryBuild stores actual investment after existing placement validation. Sale uses investedRefund, removes owner field before removing tower, preserves captured shot counter/stats. Never reset cooldown/targeting/position on purchase.
- [ ] Firing computes surge/overcharge multiplier once and makeShot; Volley selects distinct primaries. Flight carries snapshot and shared visited IDs through chain recursion without reapplying aura/buffs. All tower/ground/Meteor damage goes through evolutionCombat.damage once; remove the prior extra applyArmor path. primaryHit after successful primary damage; field only for current live owner. Process field ticks through alive victims/existing one-kill callback and include fields in wave-clear. Remove statuses on death/escape.
- [ ] Enemy movement reads statuses plus independent Time Lock. Freeze/stun zero movement while regen and boss clocks continue; slow strongest active. Simulation returns early for user/modal/background pause and victory/terminal, not only frozen movement. Frame/game time follows existing speed scaling, not Date.now timers.
- [ ] startNextWave calls siege.startWave; track scheduled boss entity IDs for10/20/30. Death invokes bossKilled for those IDs only;10 opens evolution. Escape subtracts lives then calls bossEscaped and finishes positive-lives siege failure/zero defeat correctly. buildWave30 explicitly contains one Warlord, mixed enemies and existing enrage/summon;31+ retains escalations. Label next-wave preview and boss warning “Siege finale · Wave 30”; ordinary10/20/endless warnings remain distinct.
- [ ] After combat consequences evaluate wave-clear once:

```ts
const event=this.siege.completeWave({wave:this.wave,lives:this.lives,
  spawns:this.spawnQueue.length,enemies:this.enemies.filter(e=>e.alive).length,
  flights:this.flights.length,fields:this.evolutionCombat.activeFieldCount});
if(event!=='none'){
  this.waveActive=false;this.wavesCompleted=this.siege.wavesCompleted;
  this.gold+=waveClearBonus(this.wave);
  const earned=earnedBranches(this.wave,this.lives,this.towers,this.debugAssisted);
  for(const id of earned)if(!this.unlockRepository.view().profile.earned[id]
    &&!this.unlocksEarnedThisRun.includes(id))this.unlocksEarnedThisRun.push(id);
  this.unlockRepository.earn(earned);
  this.notifyAchievements();
  if(this.wave%5===0&&!this.currentWaveIsBoss)this.grantPowerup(rollPowerUp(),'Wave '+this.wave+' Relic',true);
  if(event==='victory'){this.vault.cancelTarget();this.pendingMeteor=null;this.renderVictory();}
}
```

renderVictory is a new presentation-only scene method, implemented now with usable Finish/Continue and later styled in Task8. Zero lives takes precedence. presentReward uses victoryRewardChoices only at victory. Guard all activation/hotkeys/build/sell/target/start-wave routes, while navigation/store/replace/discard remain available. UI reveal clocks run visibly while simulation freezes; background/user pause still require Resume and preserve queue/modal. Add notifyAchievements():void and notifiedAchievements:Set<BranchId>. Emit a brief nonblocking screen-space notice per newly earned branch (3000ms visible UI time), with unsaved status when applicable; queue simultaneous notices without pausing or covering Pause/boss controls. Queue/head/remaining time survive resize/background; rebuilding never enqueues again. Clear on terminal/restart/shutdown; results retain the recap.
- [ ] chooseVictory gates on victoryRewardsResolved and user/background blockers. Continue preserves runID/towers/gold/lives/relics/counters/timers, phase endless, next31, no score submission. Finish emits exactly one terminal victory. finishRun uses siege.progress(), actual lives/gold/completed counters/duration/mask; save current-era best once and snapshot branch/rank/stronghold. If called for defeat/siege failure, call siege.fail first; do not fail a Finish victory already terminal. Clean simulation/listeners/views/fields/targeting once on terminal/shutdown/restart.
- [ ] GameOverScene.create must stop automatic submission. Add explicit Submit Score with existing generation/runId guard, retry, duplicate handling and local-success/network-failure distinction. Results show actual positive lives in siege failure; endless defeat derives prior siege victory from completed>=30/mask&5=5. Update QA fixtures/contracts, DEV-only evolution/victory/mastery states; debug-assisted scenes cannot earn achievements. Runtime status exposes phase, completed waves, field count, branch/rank/mastery/investment and unsaved IDs.
- [ ] Integration tests exercise commit once, all input blockers, sale snapshot, status damage callbacks, boss escape, zero-lives priority, wave20 achievement saved then next-run availability, full vault victory exits with activation spies, repeated Finish/Continue, no submit checkpoint/create, async old-result callbacks, restart cleanup and resize preserving modal/state.
- [ ] Run `rtk npm test`, `rtk npm run typecheck`, `rtk npm run build`; expect pass. Browser smoke through domain/DEV fixtures, explicitly not balance evidence. Task7 remains internal integration: do not publish the new siege until Task8 supplies usable evolution/progression controls. The first complete application increment ends at Task8, where migration precedes deployment/live checks. Record checkpoint and remaining interface/tuning work.

### Task8: Progression controls, readable art and responsive results

**Files:** Create `src/game/ui/progressionView.ts`, `src/game/scenes/ProgressionScene.ts`, `tests/progression-ui.test.ts`. Modify `MainMenuScene.ts`, `main.ts`, `GameScene.ts` inspector/sheets/victory, `GameOverScene.ts`, `towerArt.ts`, `ScrollSheet.ts` if needed, responsive/QA tests and Design System.

**Interfaces:** Consumes Tasks1–7. Produces:

```ts
export interface ProgressionAction {label:string;reason:string|null;intent:PurchaseIntent;revision:number;}
export interface TowerProgressionView {title:string;role:string;stats:EffectiveTowerStats;
  actions:ProgressionAction[];branches:Array<{id:BranchId;name:string;description:string;locked:boolean}>;}
export interface AchievementView {towerId:TowerId;branchId:BranchId;requirement:string;
  earned:boolean;unsaved:boolean;qualifiesNow:boolean;}
export function towerProgressionView(tower:CombatTower,context:PurchaseContext):TowerProgressionView;
export function achievementViews(profile:UnlockView,towers:readonly CombatTower[],waveCompleted:number):AchievementView[];
export function decorateEvolution(scene:Phaser.Scene,parent:Phaser.GameObjects.Container,
  branchId:BranchId,rank:EvolutionRank):Phaser.GameObjects.Container;
```

Views are pure: use effectiveStats/purchaseEvolution for quotes without assigning returned state. Desktop/phone consume same model.

- [ ] Write view tests:

```ts
const ctx={gold:1000,evolutionOpen:false,endless:false,blocked:false,unlocked:new Set<BranchId>()};
const view=towerProgressionView(tower,ctx);
expect(view.actions.some(a=>a.reason==='Defeat the wave-10 boss')).toBe(true);
expect(view.branches.find(b=>b.id==='volley')?.locked).toBe(true);
expect(tower.progression.revision).toBe(0);
expect(achievementViews(repo.view(),[],0)).toHaveLength(5);
```

tower is level4/rank-null Ranger/invested710/revision0; repo is empty injected UnlockRepository. Run `rtk npm test -- tests/progression-ui.test.ts`; expect missing-model failure.
- [ ] Implement model: foundation Upgrade through4; both Evolve choices at4/rank-null; branch upgrades0–2; mastery or Continue Endless reason at3. Show current role/rank/next stats/price, commitment and exact locked achievement. Callbacks capture tower ID/revision. Existing ScrollSheet rendering kernel:

```ts
const model=towerProgressionView(tower,context);
sheet.text(0,model.title);
let row=56;
for(const action of model.actions){
  sheet.action(row,action.reason?action.label+' · '+action.reason:action.label,()=>{
    if(!action.reason)this.purchaseSelected(action.intent,tower.id,action.revision);
  },'primary');
  row+=56;
}
```

Extend ScrollSheet.action to return its control or accept an enabled parameter with defaulttrue, so disabled actions are visibly/noninteractively disabled. Measure wrapped descriptions' actual height;56 is single-line action spacing, not fixed description height. Keep locked descriptions inspectable and five targeting modes accessible.
- [ ] Register ProgressionScene as fourth menu action beside Play/Leaderboard/Settings. Scrollable panel lists five achievement requirements and both branches, saved/unsaved state and Back. Read singleton repository without changing gameplay. Label legacy best separately. Use tokens/fonts, body>=14px/supplements>=12px, touch>=44px, safe bounds and focus. No permanent new HUD row/sidebar. Wave label w/30 siege, w/∞ endless.
- [ ] Add branch-specific original crown/weapon accents using level4 family art, bounded shapes/rank chevrons; replace old decoration on update. Apply same decorator to result snapshots. Show Beacon radius only selected, one world field per owner, distinct slow/freeze/stun/vulnerability marker. Marksman arrows have a heavier shaft/arrowhead; Volley uses three slimmer trails toward actual targets. Projectile decoration reads captured shot branch so upgrading cannot relabel an old arrow; foundation shots keep existing family art. World visuals use existing transform; UI screen space. No new full atlas/map-art rewrite.
- [ ] Victory view serializes selection/scroll and rewards through resize/background. Finish/Continue disabled reason while pending; Store/Replace/Discard accessible with full inventory. Result titles differentiate victory/defeat/failure, retain actual stronghold health, earned/unsaved summary and prior siege victory for endless defeat. Submit Score remains explicit and retryable; old generation callbacks cannot update new scene.
- [ ] Run `rtk npm test`, `rtk npm run typecheck`, `rtk npm run build`; expect pass. Start dev server `rtk npm run dev -- --host 127.0.0.1` (background pipes/PTYS, no visible helper window). Use browser/computer-use skill to inspect actual rendering at1440x900,1280x720,1024x768,844x390,390x844,360x640. Capture evolve locked/unlocked/unaffordable, mastery, achievement menu, full-vault victory, results, focus, pause, rotation/background and replay under `artifacts/progression/ui/`. Verify no clipped controls/input-through/hidden Pause/stale selection/duplicate listeners/unbounded effects. Fix and rerender before claiming pass.
- [ ] After complete controls and change-specific checks pass, apply the additive remote migration and deploy this first independently successful application increment using Task9 release commands/live checks. Later successful tuning changes deploy through those same gates. Record checkpoint URL and evidence.

### Task9: Balance evidence, final documentation and release

**Files:** Create `tests/helpers/progressionTrace.ts`, `tests/progression-balance.test.ts`, `artifacts/progression/balance/`, `artifacts/progression/verification.md`. Tune config evolutions/waves/enemies/economy (foundation only if evidence requires). Update authoritative SPEC final coefficients and `agent_docs/project_progress.md`/`project_structure.md`/`latest_session_work.md`/progression handoff.

**Interfaces:** Consumes complete feature; produces:

```ts
export interface PurchaseTrace {wave:number;towerId:TowerId;branchId:BranchId|null;
  rank:EvolutionRank|null;masteryRank:number;spent:number;goldAfter:number;}
export interface ProgressionTrace {difficulty:DifficultyId;debugAssisted:boolean;unlocked:BranchId[];
  purchases:PurchaseTrace[];firstEvolutionWave:number|null;firstRank2Wave:number|null;
  fullyEvolvedAtVictory:number;siegeWon:boolean;ordinaryRewardsOnly:boolean;
  duration1xSeconds:number;maxForcedWaitWaves:number;goldByWave:number[];leaksByWave:number[];
  relics:Array<{wave:number;id:PowerUpId;used:boolean}>;}
export function verifyTrace(trace:ProgressionTrace):string[];
```

Trace recording is DEV-only/read-only; commands that alter gameplay mark debug assistance. Trace flags cannot substitute for actual observed purchases or deterministic income tests.

- [ ] Write reporter tests:

```ts
const passing:ProgressionTrace={difficulty:'medium',debugAssisted:false,unlocked:[],purchases:[],
  firstEvolutionWave:12,firstRank2Wave:19,fullyEvolvedAtVictory:3,siegeWon:true,ordinaryRewardsOnly:true,
  duration1xSeconds:1500,maxForcedWaitWaves:3,goldByWave:[],leaksByWave:[],relics:[]};
expect(verifyTrace(passing)).toEqual([]);
expect(verifyTrace({...passing,firstEvolutionWave:14})).toContain('First evolution must be affordable during waves 11–13');
expect(verifyTrace({...passing,firstRank2Wave:20})).toContain('Rank 2 must be achievable before wave 20');
expect(verifyTrace({...passing,duration1xSeconds:900})).toContain('Medium siege duration must be 1200–1800 seconds');
```

Run `rtk npm test -- tests/progression-balance.test.ts`; missing reporter fails initially. Implement comparisons to approved gates (including2–5 full evolutions, wait<=3,!debugAssisted and victory). Reporter test data is synthetic and is not gameplay evidence.
- [ ] Add deterministic ordinary-income tests calling real buildWave/killReward/waveClearBonus/purchaseEvolution, without relic luck: first evolution affordable11–13 after a viable mixed foundation; rank2 achievable before20; nine-cheapest-path spend lower bound exceeds maximum ordinary income through24, including the application's boss bonus once. Derive totals from actual config/functions, never assert copied constants. Record fixture build positions/types and purchases. Compare branch combat at equal investment for bosses/isolated targets/armor/wards/crowds/support; each alternative must have one role advantage and a tradeoff, not dominate every role.
- [ ] Run two recorded Medium starter-profile playtests and one unlocked-profile playtest at1x without skips/gold grants; include normal preparation and exclude pause/background. Easy/Hard sanity runs, plus31/35/40 endless checks. Capture purchase waves/composition/gold/leaks/relics/duration. Verify first evolution11–13, rank2 before20 without favorable relic dependency, no forced progressing-build drought>3 completed waves,2–5 fully evolved at victory,20–30 minute duration and no all-nine evolved before25 from ordinary rewards. Record failed attempts/outliers rather than discarding them or claiming universal balance.
- [ ] Tune typed coefficients and rerun affected deterministic tests after changes. Preserve branch identities/achievement conditions and armor/resistance/mixed wave progression. Do not extend duration with mandatory waits. If timing/economy gates cannot coexist, report concrete conflict rather than weaken them. Record final values/reasons and actual traces in artifacts/SPEC.
- [ ] Final gates: `rtk npm run typecheck`, `rtk npm test`, `rtk npm run build`; all pass with previous93-test assertions preserved plus new coverage. No lint unless configured. Repeat rendered checks affected by final changes. Record performance fields/particles/listeners and browser runtime/network/console results; explicitly mark unverified browsers.
- [ ] Before first publish expecting new columns, apply `rtk npm run db:migrate:remote`; confirm `rtk npx wrangler d1 migrations list aetherhold_scores --remote` shows0004 and aggregate legacy row count remains. On migration failure stop publishing and resolve/report blocker. No destructive table reset or production player-data dump.
- [ ] Deploy with `rtk npm run deploy`; expect tests/build/Wrangler success and actual production URL. Repeat release actions for the completed Task8 increment and later successful tuning changes. Do not infer account subdomain from Worker name aetherhold-defense.
- [ ] Save `artifacts/progression/check-live.ps1` with this executable parameterized verification:

```powershell
param([Parameter(Mandatory=$true)][string]$LiveUrl)
$progressionPage = Invoke-WebRequest -Uri $LiveUrl
$progressionBundle = [regex]::Match($progressionPage.Content,'src="([^"]+\.js)"')
if (-not $progressionBundle.Success) { throw 'No JavaScript bundle in live page' }
$progressionBundleUrl = [uri]::new([uri]$LiveUrl,$progressionBundle.Groups[1].Value).AbsoluteUri
$progressionJs = Invoke-WebRequest -Uri $progressionBundleUrl
$progressionHealth = Invoke-RestMethod -Uri ([uri]::new([uri]$LiveUrl,'/api/health').AbsoluteUri)
if ($progressionPage.StatusCode -ne 200 -or $progressionJs.StatusCode -ne 200 -or -not $progressionHealth.ok) {
  throw 'Live page/bundle/health failed'
}
$progressionLocalIndex = Get-Content -Raw -LiteralPath 'dist/index.html'
if (-not $progressionLocalIndex.Contains($progressionBundle.Groups[1].Value)) { throw 'Live bundle differs from build' }
```

Run `rtk proxy powershell -NoProfile -File artifacts/progression/check-live.ps1 -LiveUrl <actual Wrangler URL>`. Also compare remote JS bytes/hash with dist's referenced JS using fetch byte arrays and SHA256, not just status200. Open actual live page in browser; verify new progression roster and no fatal network/console errors. Do not submit fake production scores.
- [ ] Deployment/live failure: fix within scope, rerun checks and republish after resolution, or report precise blocker/live URL. Existing user authorization covers deployment without further confirmation.
- [ ] Final handoff records files, tests/typecheck/build/runtime/visual/responsive/performance status, actual balance gates/limitations, migration/deploy identifiers, URL/bundle match/health and browser-local save limits. Only mark completed checkboxes for performed work. No retention claim without player data.

## Concrete verification packets

The following are required steps of their named owning tasks, before that task's passing checks. They supplement initial red tests with executable assertions for the prose matrices. Test imports use the exact production contracts/functions listed in each task.

Task2 also creates `tests/helpers/evolutionFixtures.ts`, used by Tasks2–8. Import types from progression.ts, EVOLUTIONS from evolutions.ts and towerTotalInvested from towers.ts. Do not import future SiegeSystem/scene modules in this helper:

```ts
export function tower(branch:BranchId|null='marksman',rank:EvolutionRank=0,id=1):CombatTower{
  const towerId=branch?EVOLUTIONS[branch].towerId:'longbow';
  const invested=towerTotalInvested(towerId,4)+(branch
    ?EVOLUTIONS[branch].stats.slice(0,rank+1).reduce((sum,s)=>sum+s.cost,0):0);
  return {id,towerId,x:0,y:0,counter:{successes:0},progression:{
    foundationLevel:4,branchId:branch,rank:branch?rank:null,masteryRank:0,invested,revision:0}};
}
export function victim(id=1,x=0,y=0):CombatVictim{
  return {id,x,y,hp:100000,maxHp:100000,distanceTraveled:id,alive:true,
    isBoss:false,physicalArmor:0,wardArmor:0};
}
```

**Task2 — complete paths, constraints, mastery and refunds.**

```ts
const context:PurchaseContext={gold:100000,evolutionOpen:true,endless:false,blocked:false,
  unlocked:new Set(Object.keys(EVOLUTIONS) as BranchId[])};
it.each(Object.keys(EVOLUTIONS) as BranchId[])('purchases every rank of %s atomically',branch=>{
  const id=EVOLUTIONS[branch].towerId;
  let state={...initialEvolution(id),foundationLevel:4,invested:towerTotalInvested(id,4)};
  let gold=context.gold;
  for(let rank=0;rank<=3;rank++){
    const intent:PurchaseIntent=rank===0?{kind:'evolve',branchId:branch}:{kind:'upgrade'};
    const before=structuredClone(state);
    const result=purchaseEvolution(id,state,intent,{...context,gold},state.revision);
    expect(result.ok).toBe(true);if(!result.ok)throw new Error(result.reason);
    expect(state).toEqual(before);expect(result.state.rank).toBe(rank);
    expect(result.state.invested).toBe(state.invested+result.cost);
    expect(result.gold).toBe(gold-result.cost);
    state=result.state;gold=result.gold;
  }
  expect(purchaseEvolution(id,state,{kind:'upgrade'},{...context,gold},state.revision).ok).toBe(false);
  expect(purchaseEvolution(id,state,{kind:'mastery'},{...context,gold},state.revision).ok).toBe(false);
  const mastery=purchaseEvolution(id,state,{kind:'mastery'},{...context,gold,endless:true},state.revision);
  expect(mastery.ok).toBe(true);if(!mastery.ok)throw new Error(mastery.reason);
  expect(mastery.state.masteryRank).toBe(1);
  expect(mastery.stats.damage).toBe(Math.round(EVOLUTIONS[branch].stats[3].damage*1.05));
  expect(investedRefund(mastery.state)).toBe(Math.floor(mastery.state.invested*.70));
});
it.each([
  {patch:{gold:0},intent:{kind:'evolve',branchId:'marksman'}},
  {patch:{evolutionOpen:false},intent:{kind:'evolve',branchId:'marksman'}},
  {patch:{blocked:true},intent:{kind:'evolve',branchId:'marksman'}},
  {patch:{unlocked:new Set<BranchId>()},intent:{kind:'evolve',branchId:'volley'}},
  {patch:{},intent:{kind:'evolve',branchId:'spellbreaker'}},
  {patch:{endless:true},intent:{kind:'mastery'}}
] as Array<{patch:Partial<PurchaseContext>;intent:PurchaseIntent}>)('rejects unmet constraints',({patch,intent})=>{
  const state=tower(null).progression,before=structuredClone(state);
  expect(purchaseEvolution('longbow',state,intent,{...context,...patch},0).ok).toBe(false);
  expect(state).toEqual(before);
});
it('rejects unsafe mastery without spending',()=>{
  const state={...tower('marksman',3).progression,masteryRank:100000},before=structuredClone(state);
  expect(purchaseEvolution('longbow',state,{kind:'mastery'},{...context,endless:true},0).ok).toBe(false);
  expect(state).toEqual(before);
});
it('keeps cooldown, targeting and location across upgrades',()=>{
  const owner=new Tower('longbow',12,24,0);
  owner.progression=tower(null).progression;owner.cooldown=.75;owner.targeting='strongest';
  const result=purchaseEvolution('longbow',owner.progression,{kind:'evolve',branchId:'marksman'},context,0);
  if(!result.ok)throw new Error(result.reason);owner.progression=result.state;
  expect([owner.x,owner.y,owner.cooldown,owner.targeting]).toEqual([12,24,.75,'strongest']);
});
```

Historic-spend test uses an isolated cloned config to calculate a changed quote while keeping state.invested; refund must equal the original invested*.70. Canceled preview test calls the pure purchase function without assigning its return and asserts original state/gold unchanged. Stale revision test is already the initial Task2 red test.

**Task3 — armor, targets, control, expiry and fields.**

```ts
it.each([
  ['siegebreaker','physical','physicalArmor',73],
  ['spellbreaker','arcane','wardArmor',73]
] as const)('penetrates its channel: %s',(branch,type,armor,expected)=>{
  const engine=new EvolutionCombat(),target=victim(),owner=tower(branch);
  target[armor]=.55;
  expect(engine.damage(100,type,target,0,engine.makeShot(owner,[owner],1))).toBe(expected);
  expect(engine.damage(100,type,target,0)).toBe(45);
});
it('gives Marksman a boss bonus and Volley distinct targets',()=>{
  const engine=new EvolutionCombat(),owner=tower('marksman'),target=victim();target.isBoss=true;
  expect(engine.damage(100,'physical',target,0,engine.makeShot(owner,[owner],1))).toBe(150);
  const volley=tower('volley'),targets=[victim(1),victim(2),victim(3),victim(4)];
  expect(volleyTargets(targets,volley,effectiveStats(volley.towerId,volley.progression),'first')
    .map(t=>t.id)).toEqual([4,3,2]);
});
it('retains chain snapshots and cannot select a visited victim',()=>{
  const engine=new EvolutionCombat(),owner=tower('stormcaller');
  const first=engine.makeShot(owner,[owner],1.5),second=chainShot(first);
  expect(second.rawDamage).toBeCloseTo(first.rawDamage*.85);
  expect(second.primary).toBe(false);expect(second.counter).toBe(first.counter);
  expect(second.branchId).toBe(first.branchId);
  expect(nextChainTarget([victim(1),victim(2,50),victim(3,150)],{x:0,y:0},new Set([1]))?.id).toBe(2);
  expect(nextChainTarget([victim(2,50),victim(3,150)],{x:0,y:0},new Set([2]))).toBe(null);
});
it.each([['winterguard','frozen',500,150],['thunderlord','stunned',350,100]] as const)(
  'uses fifth primaries and shared immunity: %s',(branch,status,normalMs,bossMs)=>{
    const engine=new EvolutionCombat(),owner=tower(branch),target=victim();
    const shot=engine.makeShot(owner,[owner],1);
    for(let n=0;n<5;n++)engine.primaryHit(shot,target,0);
    expect(engine.statuses(target.id,0)[status]).toBe(true);
    expect(engine.statuses(target.id,normalMs)[status]).toBe(false);
    for(let n=0;n<5;n++)engine.primaryHit(shot,target,700);
    expect(engine.statuses(target.id,700)[status]).toBe(false);
    for(let n=0;n<5;n++)engine.primaryHit(shot,target,1501);
    expect(engine.statuses(target.id,1501)[status]).toBe(true);
    const boss=victim(2);boss.isBoss=true;const other=tower(branch,0,2);
    for(let n=0;n<5;n++)engine.primaryHit(engine.makeShot(other,[other],1),boss,0);
    expect(engine.statuses(boss.id,bossMs)[status]).toBe(false);
});
it('keeps independent vulnerability and slow expiries',()=>{
  const engine=new EvolutionCombat(),target=victim(),strong=tower('brittle-ice',3),weak=tower('brittle-ice',0,2);
  engine.primaryHit(engine.makeShot(strong,[strong],1),target,0);
  engine.primaryHit(engine.makeShot(weak,[weak],1),target,2000);
  expect(engine.damage(100,'elemental',target,2500)).toBe(130);
  expect(engine.damage(100,'elemental',target,3500)).toBe(115);
  expect(engine.damage(100,'elemental',target,5000)).toBe(100);
});
it('snapshots field buffs, replaces owners, and catches up exactly six ticks',()=>{
  const engine=new EvolutionCombat(),owner=tower('flame-mortar'),shot=engine.makeShot(owner,[owner],4.5);
  engine.addField(shot,0,0,0);expect(engine.tickFields(0)).toEqual([]);
  engine.addField(shot,10,0,0);expect(engine.activeFieldCount).toBe(1);
  const ticks=engine.tickFields(3000);
  expect(ticks.map(t=>t.atMs)).toEqual([500,1000,1500,2000,2500,3000]);
  expect(ticks.every(t=>t.rawDamage===shot.rawDamage*.30&&t.x===10)).toBe(true);
  expect(engine.activeFieldCount).toBe(0);
  engine.addField(shot,0,0,4000);engine.addField({...shot,ownerId:2},0,0,4000);
  expect(engine.activeFieldCount).toBe(2);
  engine.removeOwner(1);expect(engine.activeFieldCount).toBe(1);
  engine.clear();expect(engine.activeFieldCount).toBe(0);
});
it('credits no second death from overlapping fields',()=>{
  const engine=new EvolutionCombat(),owner=tower('flame-mortar'),target=victim();target.hp=1;
  const shot=engine.makeShot(owner,[owner],1);
  engine.addField(shot,0,0,0);engine.addField({...shot,ownerId:2},0,0,0);
  let deaths=0;
  for(const tick of engine.tickFields(500)){
    if(!target.alive)continue;
    target.hp-=engine.damage(tick.rawDamage,'elemental',target,tick.atMs);
    if(target.hp<=0){target.alive=false;deaths++;}
  }
  expect(deaths).toBe(1);
});
```

Use explicit assertions extending these fixtures: highest Beacon1.30 beats weaker1.15 without stacking; move it161 units→no aura; same owner excludes self. Dead target primaryHit leaves counter/status unchanged; secondary shot leaves counter unchanged. Repeated tickFields at unchanged game time emits no extra ticks; wall250ms*speed2 and wall500ms*speed1 both produce one tick. Strong Winterguard slow.60 until2800 beats Brittle.30 until4000, then falls to.30 at2900. Integration tests assert freeze/stun do not suspend regen/ability clocks.

**Task4 — achievements, unknown storage and two tabs.**

```ts
it.each(Object.values(STARTER_BRANCH))('qualifies a retained rank2 starter: %s',branch=>{
  const good=tower(branch,2),alt=ALTERNATIVE_BRANCH[good.towerId];
  expect(earnedBranches(20,1,[good],false)).toEqual([alt]);
  expect(earnedBranches(20,1,[tower(branch,1)],false)).toEqual([]);
  expect(earnedBranches(20,0,[good],false)).toEqual([]);
  expect(earnedBranches(21,1,[good],false)).toEqual([]);
  expect(earnedBranches(20,1,[],false)).toEqual([]);
  expect(earnedBranches(20,1,[tower(alt,2)],false)).toEqual([]);
  expect(earnedBranches(20,1,[good],true)).toEqual([]);
});
it.each(['{broken','{"version":2,"earned":{"volley":"2026-10-08T00:00:00Z"}}'])(
  'preserves malformed/future stored bytes: %s',raw=>{
    let value=raw;
    const repo=new UnlockRepository({getItem:()=>value,setItem:(_k,v)=>{value=v;}});
    repo.earn(['thunderlord']);repo.reconcile();
    expect(value).toBe(raw);expect(repo.snapshotForRun().has('thunderlord')).toBe(true);
    expect(repo.view().warning).not.toBe(null);
});
it('converges tab unions while previous run snapshots remain fixed',()=>{
  let value:string|null=null,writes=0;
  const store={getItem:()=>value,setItem:(_k:string,v:string)=>{value=v;writes++;}};
  const a=new UnlockRepository(store,()=> '2026-10-08T00:00:00Z');
  const b=new UnlockRepository(store,()=> '2026-10-08T01:00:00Z');
  const old=a.snapshotForRun();a.earn(['volley']);b.earn(['thunderlord']);
  a.reconcile();b.reconcile();
  expect([...a.snapshotForRun()].sort()).toEqual(['thunderlord','volley']);
  expect([...b.snapshotForRun()].sort()).toEqual(['thunderlord','volley']);
  expect(old.size).toBe(0);
  expect(a.view().profile.earned.volley).toBe('2026-10-08T00:00:00Z');
  const before=writes;a.reconcile();b.reconcile();expect(writes).toBe(before);
});
```

Additional two-tab race: replace shared raw value with each tab's divergent valid serialized profile before invoking storage-event reconciliation in both orders; assert final recognized union and timestamp minima. All difficulty setups call the same evaluator (difficulty intentionally absent), with identical expected alternative IDs. Failed-write retry test is the initial Task4 red test.

**Task5 — terminal precedence and victory vault.** Define this helper locally in siege.test.ts and repeat its complete body in progression-integration.test.ts, avoiding an import cycle with future production files:

```ts
function advanceSiege(to:number):SiegeSystem{
  const siege=new SiegeSystem();
  for(let wave=1;wave<=to;wave++){
    siege.startWave(wave);if(wave%10===0)siege.bossKilled(wave);
    siege.completeWave({wave,lives:10,spawns:0,enemies:0,flights:0,fields:0});
  }
  return siege;
}
it.each([10,30])('ends required-boss escape at %i',wave=>{
  const siege=advanceSiege(wave-1);siege.startWave(wave);
  expect(siege.bossEscaped(wave,10)).toBe('siege-failed');siege.fail('siege-failed');
  expect(siege.progress()).toMatchObject({highestWave:wave,wavesCompleted:wave-1,outcome:'siege-failed'});
});
it.each(['spawns','enemies','flights','fields'] as const)('waits for %s after final boss',count=>{
  const siege=advanceSiege(29);siege.startWave(30);siege.bossKilled(30);
  const input={wave:30,lives:10,spawns:0,enemies:0,flights:0,fields:0};
  expect(siege.completeWave({...input,[count]:1})).toBe('none');
  expect(siege.completeWave(input)).toBe('victory');expect(siege.completeWave(input)).toBe('none');
});
it('prioritizes zero lives while allowing a living wave20 boss escape',()=>{
  expect(advanceSiege(19).bossEscaped(20,10)).toBe(null);
  const siege=advanceSiege(29);siege.startWave(30);siege.bossKilled(30);
  expect(siege.completeWave({wave:30,lives:0,spawns:0,enemies:0,flights:0,fields:0})).toBe('none');
  siege.fail('defeat');expect(siege.progress().outcome).toBe('defeat');
});
it('resolves full victory inventory with no activation',()=>{
  const vault=new RelicVault();vault.stored.push('meteor_strike','treasure_goblin','emergency_repair');
  vault.offer('battle_cry','boss',true);vault.offer('arcane_surge','second',true);
  expect(victoryRewardChoices(3)).toEqual(['replace-oldest','discard-new']);
  expect(victoryRewardsResolved(vault,false)).toBe(false);
  expect(vault.resolve('replace-oldest')).toBe(true);expect(vault.pending).toHaveLength(1);
  expect(vault.resolve('discard-new')).toBe(true);expect(vault.resolve('discard-new')).toBe(false);
  expect(victoryRewardsResolved(vault,false)).toBe(true);
  expect(vault.stored).toEqual(['treasure_goblin','emergency_repair','battle_cry']);
});
```

Meteor reservation: use actual vault.beginUse/ cancelTarget; assert original stored/pending source remains, target=null and queue unchanged. Scene activation spies are covered in Task7.

**Task6 — forged completion, positive lives and endless.**

```ts
it.each([11,20,30])('rejects progress past10 without its killed boss at wave%i',highestWave=>{
  const forged=resultFixture({highestWave,wavesCompleted:highestWave-1,outcome:'defeat',siegeBossesDefeated:0},0);
  expect(validateScorePayload(forged).ok).toBe(false);
});
it('accepts positive-lives first-boss failure, not completed-wave fiction',()=>{
  const failed=resultFixture({highestWave:10,wavesCompleted:9,outcome:'siege-failed',siegeBossesDefeated:0});
  expect(validateScorePayload(failed).ok).toBe(true);
  expect(validateScorePayload({...failed,wavesCompleted:10}).ok).toBe(false);
});
it('accepts endless defeat only after completed siege milestones',()=>{
  const defeat=resultFixture({highestWave:31,wavesCompleted:30,outcome:'defeat',siegeBossesDefeated:7},0);
  expect(validateScorePayload(defeat).ok).toBe(true);
  expect(validateScorePayload({...defeat,siegeBossesDefeated:1}).ok).toBe(false);
  expect(validateScorePayload({...defeat,remainingLives:10}).ok).toBe(false);
});
```

Worker POST/GET tests use updated existing req/makeDb helpers: assert round-trip outcome/completed/mask, duplicate409 and preserved historical rows absent from current rankings. Retain malformed/body-size and forged-survival assertions.

**Task7 — integrated commands and interruptions.** Add `refreshTowerVisual(tower:Tower):void`, `notifyAchievements():void`, `updateAchievementNotices(visibleDeltaMs:number):void` and `cleanupProgression():void` to GameScene, and `achievementNotices:Array<{branchId:BranchId;remainingMs:number}>`. Runtime notice update decrements only the visible head, hides/removes at0, then advances the queue; create/restart starts empty. cleanupProgression clears engine/statuses/notices, removes progression-owned storage listener and is called from terminal/restart/shutdown, idempotently.

Tests create `sceneFixture` locally: construct new GameScene with the existing mocked Phaser constructor pattern; assign actual Tower (level4/invested710), SiegeSystem (bit1), EvolutionCombat, RelicVault, UnlockRepository injected store, empty runUnlocks, gold2000/lives10/runId/counters/arrays, real PauseState and a scene.start spy. Stub only presentation/audio factories and refresh callbacks, not command/domain implementations. Cast through an explicit test facade exposing these named methods and fields; private TypeScript visibility must not cause test intersections to become never. vi.spyOn the existing API export yields submitSpy. The exact tested calls/assertions are:

```ts
it('blocks victory and paused purchases without changing gold/state',()=>{
  const {run,tower}=sceneFixture();run.siege.phase='victory';
  const before=structuredClone(tower.progression),gold=run.gold;
  run.purchaseSelected({kind:'evolve',branchId:'marksman'},tower.id,0);
  expect(tower.progression).toEqual(before);expect(run.gold).toBe(gold);
  run.siege.phase='siege';run.pauseState.set('user',true);
  run.purchaseSelected({kind:'evolve',branchId:'marksman'},tower.id,0);
  expect(tower.progression).toEqual(before);expect(run.gold).toBe(gold);
});
it.each(['meteor_strike','treasure_goblin','emergency_repair'] as const)('blocks victory use of %s',id=>{
  const {run}=sceneFixture();run.siege.phase='victory';
  const enemies=run.enemies.length,lives=run.lives,gold=run.gold;
  run.applyPowerup(id);
  expect(run.enemies).toHaveLength(enemies);expect(run.lives).toBe(lives);
  expect(run.gold).toBe(gold);expect(run.pendingMeteor).toBe(null);
});
it('continues once only after vault resolution and retains run identity',()=>{
  const {run}=sceneFixture();run.siege=advanceSiege(30);
  run.vault.stored.push('meteor_strike','treasure_goblin','emergency_repair');
  run.vault.offer('battle_cry','boss',true);const id=run.runId;
  run.chooseVictory('continue');expect(run.siege.phase).toBe('victory');
  run.vault.resolve('replace-oldest');run.modal=null;
  run.chooseVictory('continue');run.chooseVictory('continue');
  expect(run.siege.phase).toBe('endless');expect(run.runId).toBe(id);
  expect(submitSpy).not.toHaveBeenCalled();
});
it('notifies once while keeping current-run branch availability fixed',()=>{
  const {run,tower}=sceneFixture();tower.progression={...tower.progression,branchId:'marksman',rank:2};
  const earned=earnedBranches(20,10,[tower],false);
  run.unlocksEarnedThisRun=earned;run.unlockRepository.earn(earned);
  run.notifyAchievements();run.notifyAchievements();expect(run.achievementNotices).toHaveLength(1);
  expect(run.runUnlocks.has('volley')).toBe(false);
  expect(run.unlockRepository.snapshotForRun().has('volley')).toBe(true);
  run.updateAchievementNotices(2999);expect(run.achievementNotices).toHaveLength(1);
  run.updateAchievementNotices(1);expect(run.achievementNotices).toHaveLength(0);
});
it('preserves victory and reward state across resize/background and cleans up twice safely',()=>{
  const {run}=sceneFixture();run.siege=advanceSiege(30);
  run.vault.offer('meteor_strike','boss',true);
  const before=structuredClone(run.vault.pending);
  run.pauseState.set('background',true);run.handleResize();
  expect(run.vault.pending).toEqual(before);expect(run.siege.phase).toBe('victory');
  run.chooseVictory('continue');expect(run.siege.phase).toBe('victory');
  run.pauseState.set('background',false);
  run.cleanupProgression();run.cleanupProgression();
  expect(run.evolutionCombat.activeFieldCount).toBe(0);
  expect(run.achievementNotices).toHaveLength(0);
});
```

PauseState's actual API is set(reason,enabled); use it in production/test fixture, not invented pauseUser/resume methods. Repeat advanceSiege's body locally in this integration test. Rendering calls during handleResize use existing screen/QA test factory mocks. Assert listener attach/remove spy counts over create/shutdown/replay, and old result-generation callbacks ignored. Finish test invokes chooseVictory('finish') twice on an empty vault; scene.start called once with outcome victory/completed30/lives10 and submitSpy untouched until explicit results Submit click. Unit tests plus full runtime flows jointly verify interruption; do not replace runtime verification with state-only stubs.

**Task8 — presentation packet.** Add a pure `wavePresentation(wave:number,endless:boolean):{label:string;warning:string}` to progressionView.ts, used by preview/warnings:

```ts
expect(wavePresentation(30,false).label).toContain('Siege finale');
expect(wavePresentation(30,false).warning).toContain('Siege finale');
expect(wavePresentation(40,true).label).not.toContain('Siege finale');
for(const branch of ['marksman','volley'] as const){
  const owner=tower(branch),shot=new EvolutionCombat().makeShot(owner,[owner],1);
  owner.progression={...owner.progression,rank:3};
  expect(shot.branchId).toBe(branch);
  expect(shot.stats.volleyTargets).toBe(branch==='volley'?3:1);
}
```

Renderer assertions additionally inspect heavy single Marksman arrow vs slim Volley trails using actual graphics factory spies and captured branch; normal foundation arrows unchanged. Test level1/foundation, level4/early boss, locked alternative, unaffordable rank, rank3/siege and rank3/endless models with actual purchase contexts, checking intents/revisions/disable reasons and no mutation. Nonblocking notice must have no interactive hit area and leave PauseState reasons unchanged. Required runtime screenshot matrix still applies.

## Execution handoff

Present the reviewed plan for user review and execution-method choice. Recommend inline execution for this coupled pipeline and a single main owner with checkpoints; subagent-driven execution remains available for per-task independent implementation/review. Invoke the chosen execution skill after the user selects. Review-only agents explicitly required by planning do not change the Light workflow route.
