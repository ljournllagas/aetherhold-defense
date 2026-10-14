# Campaign Scoring and Leaderboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Campaign its own understandable scoring and public progress ranking, while placing guest naming next to guest entry and removing Retry connection.

**Architecture:** Share deterministic scheduled-wave metadata and Campaign score arithmetic between browser and Worker. Extend existing per-mission progress with independent current-era bests, preserve legacy evidence, and rank acknowledged account progress using D1 aggregation. Reuse existing scene, account ownership, sync, import, and responsive UI behavior.

**Tech Stack:** TypeScript, Phaser 4, Vite, Vitest, Cloudflare Workers/D1, existing Miniflare test helper, PowerShell/RTK. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-14-campaign-scoring-leaderboard-design.md` (approved; spec review 9/10, zero blockers).

## Global Constraints

- All 100 currently defined missions are in scope.
- Preserve previous completions, stars, unlocks, preparations, and legacy scores.
- Keep Classic scoring, difficulty filters, rankings, submission behavior, score era, and personal bests unchanged.
- `CAMPAIGN_SCORE_VERSION = 1`, independent of Classic `SCORE_VERSION`, campaign content version, and progression version.
- `finalScore = 10 * scheduledEnemiesKilled + 100 * wavesCompleted + 500 * missionBossesKilled + 50 * remainingLives`.
- New score-star target: `ceil(0.9 * perfectScore / 10) * 10`.
- Guest entry order is in-game name, Play as Guest, a small “or” separator, then Sign in with Google. Remove Retry connection.
- The signed-in account-management screen stays unchanged.
- Preserve unknown/unreadable saves; do not weaken assertions, validation, failure visibility, or accessibility.
- Deploy verified application work with `rtk npm run deploy`; commit/push to the current branch and verify remote HEAD. Documentation-only planning does not publish an unchanged application.
- Default repository workflow route remains Light. The Full design tier does not change it. Production execution remains with the main agent unless the user selects subagent execution; the required plan reviewer is read-only.

## Review Focus

1. A stale client sends progress without `campaignScore`: preserve newer bests and all stars (Task 2 tests; Task 4 HTTP test).
2. A boss clone shares its boss's visual/type: it awards neither scheduled kill points nor the mission boss bonus (Task 3 scene tests).
3. Invalid profile data sits ahead of valid contenders: exclude it without starving the requested top list or leaking raw saves (Task 4 real-D1 tests).
4. A fetch finishes after a mode switch, resize, or scene shutdown: it cannot replace the selected board (Task 6 deferred-fetch tests).
5. Google auth preparation fails after a typed guest name: the same form/name remains, another click retries, and guest play works (Task 7 browser and unit checks).

## Execution boundary and file map

Work in the existing checkout/current branch, preserving unrelated untracked `(c[a.currentStatus]`, `.scratch/`, `.superpowers/`, `verification/`, and `{console.error(e)`. Inspect status before execution; do not stage those paths. Do not create an isolated worktree unless execution-time instructions require it. Commit cohesive task changes locally, but publish/push the completed, verified release together; partially integrated scoring must not reach production.

New production files:

| File | Responsibility |
| --- | --- |
| `src/game/campaign/waveProfile.ts` | Existing scheduled wave composition/counts, extracted without balance changes |
| `src/shared/campaignScoring.ts` | Score inputs, breakdown, era, metadata, and targets |
| `src/shared/campaignProgress.ts` | Per-level validation, cloning, merge, and current-clear updates |
| `src/shared/campaignLeaderboard.ts` | Public response types, comparator, response validation |
| `worker/campaignLeaderboard.ts` | D1 aggregation and public GET handler |

Modify the existing account/result types and validators, Campaign repository/battle/presentation, Game/Campaign/Leaderboard/Login scenes, `GuestProgress`, leaderboard/account API clients, Worker routing/auth, CSS, affected tests and fixture consumers. Keep `AccountProgress`, `GuestStorage`, and `AccountStorage` protocol formats unchanged apart from preserving the new nested field through their existing validation/serialization paths. Add tests named in each task and `docs/CAMPAIGN_SCORING_VERIFICATION.md` for release evidence.

Run shell commands through RTK. The commands below are PowerShell commands; execute dependent mutations separately. Each test command lists the exact test paths. A newly introduced module/export may deliberately be missing at its first red checkpoint: the expected error must name that exact missing feature (`campaignScoring`, `campaignProgress`, `campaignLeaderboard`, or `prepareGoogleSignIn`) and disappear when that task implements it. This is an intentional feature-absence red result; do not add production stubs merely to change its wording. Any unrelated import, syntax, test-runner, or build error is not an acceptable red result. Once exports exist, use behavioral assertion failures for later red checks. Expected green means all assertions in the listed files pass. Read failure output before continuing. Task commits use explicit listed files, never `git add .`.

## Task 1: Share scheduled waves and Campaign score arithmetic

**Files:** Create `src/game/campaign/waveProfile.ts`, `src/shared/campaignScoring.ts`, `tests/campaign-scoring.test.ts`; modify `src/game/campaign/battle.ts`; exercise `tests/campaign-combat.test.ts`, `tests/campaign-v5-compatibility.test.ts`.

**Interfaces:**
- Consumes: `getCampaignLevel(level: number): CampaignLevelDefinition | null`, `getCampaignEnemy(id: string): CampaignEnemyConfig`, existing enemy config fields and scheduled wave data in `battle.ts`.
- Produces: `CampaignSpawn`, `CampaignWave`, `getCampaignWaveCount(level: number): number`, `getCampaignWave(level: number, wave: number, countMultiplier?: number): CampaignWave`; `CampaignBattle.wave` delegates without changing its signature; re-export `CampaignSpawn` from `battle.ts` to preserve callers.
- Produces scoring interfaces exactly as follows:

```ts
export const CAMPAIGN_SCORE_VERSION = 1;
export interface CampaignScoreInput {
  scheduledEnemiesKilled: number;
  wavesCompleted: number;
  missionBossesKilled: number;
  remainingLives: number;
}
export interface CampaignScoreBreakdown {
  killScore: number;
  waveBonus: number;
  bossBonus: number;
  livesBonus: number;
  finalScore: number;
}
export interface CampaignScoreMetadata {
  level: number;
  waveCount: number;
  scheduledEnemyCount: number;
  scheduledEnemiesThroughWave: readonly number[];
  hasBoss: boolean;
  perfectScore: number;
  scoreTarget: number;
}
export function campaignScoreMetadata(level: number): CampaignScoreMetadata;
export function calculateCampaignScore(input: CampaignScoreInput): CampaignScoreBreakdown;
export function calculateCampaignLiveScore(input: CampaignScoreInput): number;
```

- [x] **1. Add failing formula and metadata tests.** Include these assertions plus gold/time invariance by confirming no such inputs occur in the Campaign interface, and compare identical counters across Classic difficulty configs without passing those configs to Campaign functions.

```ts
it('settles the lives bonus once and keeps opening live score zero', () => {
  const input = { scheduledEnemiesKilled: 7, wavesCompleted: 2,
    missionBossesKilled: 1, remainingLives: 18 };
  expect(calculateCampaignScore(input)).toEqual({
    killScore: 70, waveBonus: 200, bossBonus: 500,
    livesBonus: 900, finalScore: 1670
  });
  expect(calculateCampaignLiveScore(input)).toBe(770);
  expect(calculateCampaignLiveScore({ ...input, scheduledEnemiesKilled: 0,
    wavesCompleted: 0, missionBossesKilled: 0 })).toBe(0);
});
it('has reachable targets for every registered mission', () => {
  for (const def of CAMPAIGN_LEVELS) {
    const m = campaignScoreMetadata(def.level);
    expect(m.scoreTarget).toBe(Math.ceil(0.9 * m.perfectScore / 10) * 10);
    expect(m.scoreTarget).toBeGreaterThan(0);
    expect(m.scoreTarget).toBeLessThanOrEqual(m.perfectScore);
    expect(m.scheduledEnemiesThroughWave[0]).toBe(0);
    expect(m.scheduledEnemiesThroughWave.at(-1)).toBe(m.scheduledEnemyCount);
    expect(calculateCampaignScore({ scheduledEnemiesKilled: m.scheduledEnemyCount,
      wavesCompleted: m.waveCount, missionBossesKilled: Number(m.hasBoss),
      remainingLives: 20 }).finalScore).toBe(m.perfectScore);
  }
});
```

- [x] **2. Run red:** `rtk npm test -- tests/campaign-scoring.test.ts`. Before Task 1 creates the module, expect the resolver to name missing `src/shared/campaignScoring.ts`; after adding exports, expect the formula/target assertion to fail until its implementation is complete. An unrelated missing dependency is a blocker.
- [x] **3. Extract the existing wave algorithm verbatim.** Move original/established/expansion wave counts, the wave-specific tuning values, and `CampaignBattle.wave` composition into `waveProfile.ts`. Keep reward, specialization, map, and unlock logic in `battle.ts`. Preserve `CAMPAIGN_BATTLE_TUNING`'s public shape by spreading exported wave tuning into its existing object; do not make the pure module import `battle.ts` or `progress.ts`. New helper validation rejects invalid levels/waves using the existing exceptions. Before replacing delegation, add an equivalence test over all 100 levels/all waves and count multipliers 0.9, 1, 1.1 using the old function captured in the test, then remove duplicate test algorithm after recording unchanged expectations as spawn count/ID fixtures or snapshots.

```ts
// CampaignBattle retains its public method.
wave(wave: number, countMultiplier = 1): CampaignWave {
  return getCampaignWave(this.definition.level, wave, countMultiplier);
}
// Scoring remains pure and independent of Classic.
export function calculateCampaignScore(i: CampaignScoreInput): CampaignScoreBreakdown {
  const killScore = i.scheduledEnemiesKilled * 10;
  const waveBonus = i.wavesCompleted * 100;
  const bossBonus = i.missionBossesKilled * 500;
  const livesBonus = i.remainingLives * 50;
  return { killScore, waveBonus, bossBonus, livesBonus,
    finalScore: killScore + waveBonus + bossBonus + livesBonus };
}
export function calculateCampaignLiveScore(i: CampaignScoreInput): number {
  return calculateCampaignScore({ ...i, remainingLives: 0 }).finalScore;
}
```

Build metadata by iterating `getCampaignWave(level,wave).spawns.length`, with prefix count `[0]`, adding each wave count, and computing perfect score from the exact formula. Memoize immutable metadata by registered level so render/validation does not repeatedly enumerate spawns. Freeze nested prefix arrays to prevent a caller changing server bounds.

- [x] **4. Add per-world imperfect examples.** For each world select its first mission; enumerate lives 1..19 and scheduled kills 0..N with all waves cleared, selecting a score below perfect that reaches target. Assert at least one exists per world; emit actual counts in assertion failures. Test target-minus-one rejection through the award helper in Task 2.
- [x] **5. Run green:** `rtk npm test -- tests/campaign-scoring.test.ts tests/campaign-combat.test.ts tests/campaign-v5-compatibility.test.ts`; `rtk npm run build`. Confirm Worker-bound imports contain no Phaser/browser modules.
- [x] **6. Commit only Task 1 paths:** run `rtk git add -- src/game/campaign/waveProfile.ts src/shared/campaignScoring.ts src/game/campaign/battle.ts tests/campaign-scoring.test.ts`; if the equivalence fixtures changed, stage their specifically named paths separately. Then run `rtk git commit -m "feat: add independent campaign score arithmetic"`.

## Task 2: Preserve legacy progress and merge current mission bests

**Files:** Create `src/shared/campaignProgress.ts`, `tests/campaign-score-migration.test.ts`; modify `src/game/campaign/types.ts`, `src/shared/cloudProgress.ts`, `src/game/campaign/progress.ts`; update `tests/campaign-progress.test.ts`, `tests/cloud-progress.test.ts`, `tests/campaign-v5-compatibility.test.ts`, `tests/verification-v5-save.test.ts`, and discovered callers/fixtures affected by the new-clear meaning.

**Interfaces:**
- Consumes: Task 1 scoring metadata and `CAMPAIGN_SCORE_VERSION`.
- Produces: optional `CampaignLevelProgress.campaignScore?: { version: 1; bestScore: number }`; legacy `bestScore` meaning stays independent.
- Produces these shared functions:

```ts
export function validateCampaignLevelProgress(value: unknown, level: number): CampaignLevelProgress | null;
export function cloneCampaignLevelProgress(p: CampaignLevelProgress): CampaignLevelProgress;
export function mergeCampaignLevelProgress(a: CampaignLevelProgress | undefined,
  b: CampaignLevelProgress | undefined): CampaignLevelProgress | undefined;
export function applyCampaignClear(old: CampaignLevelProgress | undefined,
  level: number, score: number, lives: number): CampaignLevelProgress | null;
```

`CampaignRepository.recordClear(level: number, score: number, lives: number): CampaignClearResult | null` now records a current-era winning score. Its public signature is unchanged, but all new-clear test callers must supply meaningful current-era values. Parsing old stored JSON remains legacy-compatible.

- [x] **1. Search every legacy best/clear caller before editing:** `rtk rg -n 'recordClear\(|bestScore|scoreTarget|normalizeProgress|cloneLevelProgress|mergeLevelProgress|sameProgress' src tests`. Assign active UI callers to Task 5 and GameScene/guest callers to Task 3; update remaining fixtures/helpers here, preserving migration fixtures unchanged.
- [x] **2. Add failing preservation/merge tests.** Import the actual legacy local/cloud fixtures. Verify unchanged parsed legacy numeric bests and retained stars, no invented `campaignScore`, unlocked worlds/presets/targeting unchanged, reload preserves both eras, and unknown score versions leave raw storage unwritten. Iterate all 100 missions for target equality, target-minus-one, and perfect-clear score-star awards using an empty level; sticky legacy star checks use fixture evidence rather than bypassing validation.

```ts
it('awards the exact score boundary and perfect clear on every mission', () => {
  for (const def of CAMPAIGN_LEVELS) {
    const m = campaignScoreMetadata(def.level);
    expect(applyCampaignClear(undefined, def.level, m.scoreTarget, 20)?.scoreStar).toBe(true);
    expect(applyCampaignClear(undefined, def.level, m.scoreTarget - 1, 20)?.scoreStar).toBe(false);
    expect(applyCampaignClear(undefined, def.level, m.perfectScore, 20)?.scoreStar).toBe(true);
  }
});
```

```ts
it('preserves a newer best across stale uploads and deep clones', () => {
  const current = emptyCloudProgress();
  current.levels[1] = applyCampaignClear(undefined, 1,
    campaignScoreMetadata(1).perfectScore, 20)!;
  const stale = emptyCloudProgress();
  stale.levels[1] = { completed: true, completionStar: true, livesStar: false,
    scoreStar: false, bestScore: 100, bestRemainingLives: 1 };
  const merged = mergeCloudProgress(current, stale);
  expect(merged.levels[1]?.campaignScore?.bestScore).toBe(campaignScoreMetadata(1).perfectScore);
  expect(merged.levels[1]?.bestScore).toBe(100);
  merged.levels[1]!.campaignScore!.bestScore = 1;
  expect(current.levels[1]?.campaignScore?.bestScore).toBe(campaignScoreMetadata(1).perfectScore);
});
```

- [x] **3. Run red:** `rtk npm test -- tests/campaign-score-migration.test.ts`. The initial expected resolver error names the new `src/shared/campaignProgress.ts`; after implementing its exports, retain a behavioral red check for unsupported nested data or lost current bests before completing the parser/merge changes.
- [x] **4. Implement one shared per-level validator and use it in both local and cloud parsing.** Keep explicit allowed keys, canonical level IDs, booleans, completion/star invariants, old max/remaining-lives bounds, and untouched classic best validation. For `campaignScore`, require exactly `version,bestScore`, version 1, completed true, and safe integer score from 1 through mission perfect. A score star requires old best >= old target OR new best >= new target. Unknown fields/version fail; do not strip them.

```ts
// Clone primitive flags/legacy metrics and the optional nested score.
export function cloneCampaignLevelProgress(p: CampaignLevelProgress): CampaignLevelProgress {
  return { ...p, ...(p.campaignScore ? { campaignScore: { ...p.campaignScore } } : {}) };
}
// Within mergeCampaignLevelProgress after handling undefined operands:
const newBest = Math.max(a.campaignScore?.bestScore ?? 0, b.campaignScore?.bestScore ?? 0);
const merged = {
  completed: a.completed || b.completed, completionStar: a.completionStar || b.completionStar,
  livesStar: a.livesStar || b.livesStar, scoreStar: a.scoreStar || b.scoreStar,
  bestScore: Math.max(a.bestScore, b.bestScore),
  bestRemainingLives: Math.max(a.bestRemainingLives, b.bestRemainingLives),
  ...(newBest > 0 ? { campaignScore: { version: 1 as const, bestScore: newBest } } : {})
};
```

Implement `applyCampaignClear` with score/lives validation, unchanged completion/lives rules, score-star threshold against new metadata, current best max, legacy best unchanged (zero for a new level). Use it inside `recordClear`; retain locked-level rejection, newly earned stars/sigils/features, pending persistence flags, and storage protections. Include nested score in equality checks. Replace duplicated clone/merge/validation operations with shared functions; no new wrapper layer around storage.

- [x] **5. Update new-clear fixture producers.** A helper that completes a mission uses `campaignScoreMetadata(level).perfectScore`; a score-star boundary test uses the new target. Assertions distinguish `bestScore` legacy from `campaignScore.bestScore`, preserving original test intent and all migrated legacy values. Do not weaken expected achievements or drop failing assertions.
- [x] **6. Verify failures/concurrency:** existing in-memory stores with denied reads/quota failures still keep session-only changes and warnings. Merge two different device clears in both orders, asserting max current best, max legacy best, OR stars, and identical derived unlocks; claimed/imported batches preserve IDs and owner. Run `rtk npm test -- tests/campaign-score-migration.test.ts tests/campaign-progress.test.ts tests/cloud-progress.test.ts tests/campaign-v5-compatibility.test.ts tests/verification-v5-save.test.ts tests/guest-storage.test.ts tests/account-storage.test.ts`.
- [x] **7. Commit only Task 2 paths:** message `feat: preserve legacy campaign achievements alongside new bests`.

## Task 3: Validate new terminal results and award scheduled combat correctly

**Files:** Modify `src/shared/account.ts`, `src/shared/campaignResult.ts`, `src/game/scenes/GameScene.ts`, `src/game/systems/GuestProgress.ts`; verify/reuse existing `worker/accountScores.ts` validation and generic canonicalization without a behaviorless source edit; create `tests/campaign-score-results.test.ts`; update `tests/guest-run-settlement.test.ts`, `tests/account-scores.test.ts`, `tests/guest-progress.test.ts`, `tests/campaign-independent-lifecycle.test.ts`, and relevant scene fixture callers discovered with `rg`.

**Interfaces:**
- Consumes: Tasks 1–2 score calculation, metadata, `applyCampaignClear`.
- Produces `LegacyCampaignResultPayload` (existing shape unchanged), `CurrentCampaignResultPayload` extending it with required `campaignScoreVersion: 1`, `scheduledEnemiesKilled`, `wavesCompleted`, `missionBossesKilled`; `CampaignResultPayload` is their union. Current fields cannot be partially present on a legacy payload.
- `validateCampaignResult(v: unknown): CampaignResultPayload | null` keeps its signature. `RunResult` and acknowledgment shape stay unchanged. New guest campaign results still become per-level progress with `result:null` in the snapshot.
- GameScene adds scheduled identity set and two counters; existing `enemiesKilled`/`bossesKilled` retain combat/bounty behavior. Results retain `breakdown: CampaignScoreBreakdown` for Task 5.

- [x] **1. Add failing result arithmetic tests and scene tests.** Use the existing Phaser mock pattern from `guest-run-settlement.test.ts`. An exact new payload is built from metadata; change one counter/score/version at a time and assert rejection. Old unversioned results retain their existing acceptance and canonical representation.

```ts
it('recalculates a current-era victory and rejects changed arithmetic', () => {
  const m = campaignScoreMetadata(10);
  const payload = { runId: 'campaign-run-123', campaignVersion: 1, progressionVersion: 1,
    level: 10, outcome: 'victory' as const, remainingLives: 20,
    gameDurationSeconds: 100, gameVersion: '0.3.0', campaignScoreVersion: 1,
    scheduledEnemiesKilled: m.scheduledEnemyCount, wavesCompleted: m.waveCount,
    missionBossesKilled: 1, finalScore: m.perfectScore };
  expect(validateCampaignResult(payload)).not.toBeNull();
  expect(validateCampaignResult({ ...payload, finalScore: payload.finalScore + 1 })).toBeNull();
  expect(validateCampaignResult({ ...payload, wavesCompleted: m.waveCount - 1 })).toBeNull();
  expect(validateCampaignResult({ ...payload, campaignScoreVersion: 2 })).toBeNull();
});
```

Scene assertions must call actual kill/escape/settlement methods with render/audio effects stubbed, not just test a set in isolation: scheduled ordinary enemy awards once; scheduled real boss awards both bonuses; summon/clone with the same `campaignId` does neither; cleanup does neither; final duplicate settlement sends one captured-owner result. Test failure/restart/quit/assisted exclusion and zero live score.

- [x] **2. Run red:** `rtk npm test -- tests/campaign-score-results.test.ts tests/guest-run-settlement.test.ts`.
- [x] **3. Implement current result validation.** Recognize current format only by the complete versioned key set; missing version with any new counter is invalid. Retain old legacy validation verbatim. For new results require safe integers, W completed waves in 0..W, kills in 0..prefix[min(W,completed+1)], boss count 0..Number(hasBoss), and no boss kill before the final wave could be active. Boss count <= eligible kills. Enforce exact score calculation, existing outcome/lives/duration/version/run-ID validation, victory completed=W/boss=required, defeat lives=0, siege-failed authored boss exists/lives>0/bossKills=0. Do not infer era from score. Result canonicalization continues sorting every payload field.
- [x] **4. Wire scheduled identity and scoring into GameScene.** Reset identity set/counters in `init`. Only the authored wave-queue path registers identities. Summon paths never register. The kill path consumes the set before score changes; cleanup/escape delete without awarding. Determine the boss bonus from the consumed authored identity plus its definition, preventing clone-type false matches.

```ts
// At the authored queue spawn, after spawnEnemy:
if (this.campaign) this.campaignScheduledIds.add(enemy.id);
// Inside killEnemy after the alive guard, before existing combat counters:
const scheduled = this.campaignScheduledIds.delete(e.id);
if (this.campaign && scheduled) {
  this.campaignScheduledKills++;
  if (e.campaignId === this.campaign.definition.bossEnemyId) {
    this.campaignMissionBossKills = 1;
    this.campaign.bossKilled = true;
  }
}
```

Move the existing unconditional campaign boss-killed assignment into that scheduled branch. Keep unrelated Classic/bounty counters/logic. In `scoreSoFar`, branch to Campaign live arithmetic before Classic; in `finishCampaign`, calculate breakdown once, award current clear only for existing allowed victories, populate all new payload fields, and preserve captured run-owner settlement. The final fully cleared wave must increment `wavesCompleted` before settlement; test the actual `checkWaveClear` path and adjust ordering if necessary, without altering Classic lifecycle. QA fixture scores use actual metadata/counters but retain no-save/no-upload exclusions.

- [x] **5. Update guestRunProgress.** For a current victory, use `applyCampaignClear` for the mission and retain `result:null,runId`. Legacy campaign victories keep the old legacy progress construction; failures award no levels in either format. `validGuestSnapshot` retains its existing classic-result compatibility and receives nested campaign progress through `validateCloudProgress`.
- [x] **6. Run green:** `rtk npm test -- tests/campaign-score-results.test.ts tests/guest-run-settlement.test.ts tests/guest-progress.test.ts tests/account-scores.test.ts tests/campaign-independent-lifecycle.test.ts tests/scene-siege.test.ts tests/earned-score.test.ts`; `rtk npm run build`. HTTP result tests must retain unauthorized, CSRF, rate-limit, conflicting run ID, identical retry, and account-generation assertions.
- [x] **7. Commit only Task 3 paths:** message `feat: settle validated campaign mission scores`.

## Task 4: Aggregate valid acknowledged progress into a public ranking

**Files:** Create `src/shared/campaignLeaderboard.ts`, `worker/campaignLeaderboard.ts`, `tests/campaign-leaderboard-worker.test.ts`; modify `worker/index.ts`; reuse `tests/helpers/accountDb.ts` and exercise `worker/accounts.ts` without changing its protocol.

**Interfaces:**
- Consumes: `validateCloudProgress`, Tasks 1–2 metadata/progress, existing `handleAccount` sync/import, real D1 test helper.
- Produces:

```ts
export interface CampaignLeaderboardRow {
  playerId: string; nickname: string;
  missionsCompleted: number; totalStars: number; totalScore: number;
}
export interface CampaignLeaderboardResponse {
  campaignScoreVersion: 1; missionCount: number; starCount: number;
  scores: CampaignLeaderboardRow[];
}
export function compareCampaignRows(a: CampaignLeaderboardRow, b: CampaignLeaderboardRow): number;
export function validateCampaignLeaderboard(value: unknown, limit?: number): CampaignLeaderboardResponse | null;
export function handleCampaignLeaderboard(request: Request, env: Pick<AuthEnv, 'DB'>): Promise<Response | null>;
```

- [x] **1. Add real-D1 failing tests.** Each test obtains/disposes `accountDb()` with `try/finally`; write player profiles through `/api/account/sync` for normal cases, directly through D1 only to simulate corruption/future data. Cover all ordering priorities/ties, new-only and legacy-only progress, no missions, max score/max stars bounds, multiple mission bests after guest import, stale upload, rename/delete/re-create, privacy, query failure, invalid limit, and malformed/future profiles placed ahead of valid players.

```ts
it('publishes one row and preserves its score after stale sync', async () => {
  const f = await accountDb();
  try {
    const progress = emptyCloudProgress();
    progress.levels[1] = applyCampaignClear(undefined, 1,
      campaignScoreMetadata(1).perfectScore, 20)!;
    expect((await handleAccount(f.request('/api/account/sync', 'a', { progress }), f.env))?.status).toBe(200);
    expect((await handleAccount(f.request('/api/account/sync', 'a',
      { progress: emptyCloudProgress() }), f.env))?.status).toBe(200);
    const response = await handleCampaignLeaderboard(
      new Request('https://game.example/api/campaign-leaderboard?limit=20'), f.env);
    const body = await response!.json() as CampaignLeaderboardResponse;
    expect(body.scores).toEqual([{ playerId: 'a', nickname: 'Name a',
      missionsCompleted: 1, totalStars: 3, totalScore: campaignScoreMetadata(1).perfectScore }]);
    expect(response!.headers.get('Cache-Control')).toBe('no-store');
    expect(JSON.stringify(body)).not.toMatch(/generation|subject|csrf|progress_json|email/);
  } finally { await f.dispose(); }
});
```

- [x] **2. Run red:** `rtk npm test -- tests/campaign-leaderboard-worker.test.ts`. Initial feature-absence errors name only the new shared/Worker campaign leaderboard modules; once the handler exists, use the real-D1 ordering/privacy assertions as the behavioral red checkpoint.
- [x] **3. Define comparator, aggregate metadata, and response validation.** Use bytewise/string `<` ordering for playerId, matching SQLite BINARY collation, not locale-specific collation. Require only known fields, nonempty nickname <=20, opaque nonempty ID, integer nonnegative metrics, missions 1..100, stars<=3*missions, score<=sum(perfectScores), correct era/counts, unique IDs, correctly sorted rows, rows<=requested limit. Export no private profile fields.

```ts
export function compareCampaignRows(a: CampaignLeaderboardRow, b: CampaignLeaderboardRow): number {
  return b.missionsCompleted - a.missionsCompleted || b.totalStars - a.totalStars ||
    b.totalScore - a.totalScore || (a.playerId < b.playerId ? -1 : a.playerId > b.playerId ? 1 : 0);
}
```

- [x] **4. Implement D1 aggregation with guarded JSON and final shared validation.** No new table/migration. Pass one bound JSON metadata array for registered levels/targets/lives/perfect scores; never interpolate user input. SQL normalizes malformed profile JSON to `{}` before any JSON function, rejects unsupported top-level versions/nonobject levels, then joins `json_each(levels)` to registered canonical IDs. Per-level shape/invariant guards match Task 2, including unknown keys, supported nested era, integer counts, boolean flags, completion/lives/legacy-or-current-score-star evidence. An invalid level excludes the whole player, not just that mission. Aggregate all candidate profiles before ORDER BY and candidate LIMIT.

Core query structure (expand the validity predicate with the exact checks listed below; these are SQL construction rules, not application-side aggregate computation):

```sql
WITH profile_source AS (
  SELECT id, nickname, progress_json,
    CASE WHEN json_valid(progress_json) THEN progress_json ELSE '{}' END AS safe_json
  FROM players
), metadata AS (
  SELECT CAST(json_extract(value,'$.level') AS INTEGER) AS level,
    json_extract(value,'$.minimumLivesForStar') AS lives_target,
    json_extract(value,'$.legacyTarget') AS legacy_target,
    json_extract(value,'$.scoreTarget') AS score_target,
    json_extract(value,'$.perfectScore') AS perfect_score FROM json_each(?1)
), level_source AS (
  SELECT p.id, j.key AS level_key, j.type AS level_type,
    CASE WHEN j.type='object' THEN j.value ELSE '{}' END AS level_json,
    m.level, m.lives_target, m.legacy_target, m.score_target, m.perfect_score
  FROM profile_source p
  JOIN json_each(CASE WHEN json_type(p.safe_json,'$.levels')='object'
    THEN json_extract(p.safe_json,'$.levels') ELSE '{}' END) j
  LEFT JOIN metadata m ON j.key=CAST(m.level AS TEXT)
), ranked AS (
  SELECT p.id AS playerId, p.nickname,
    SUM(json_extract(l.level_json,'$.completed')) AS missionsCompleted,
    SUM(json_extract(l.level_json,'$.completionStar') +
        json_extract(l.level_json,'$.livesStar') +
        json_extract(l.level_json,'$.scoreStar')) AS totalStars,
    SUM(COALESCE(json_extract(l.level_json,'$.campaignScore.bestScore'),0)) AS totalScore,
    p.progress_json AS privateProgress
  FROM profile_source p JOIN level_source l ON l.id=p.id
  WHERE json_extract(p.safe_json,'$.version')=1
    AND json_extract(p.safe_json,'$.campaignVersion')=1
    AND json_extract(p.safe_json,'$.progressionVersion')=1
    AND NOT EXISTS (SELECT 1 FROM level_source invalid
      WHERE invalid.id=p.id AND COALESCE(
        invalid.level IS NOT NULL AND invalid.level_type='object'
        AND NOT EXISTS (SELECT 1 FROM json_each(invalid.level_json) k WHERE k.key NOT IN
          ('completed','completionStar','livesStar','scoreStar','bestScore','bestRemainingLives','campaignScore'))
        AND json_type(invalid.level_json,'$.completed') IN ('true','false')
        AND json_type(invalid.level_json,'$.completionStar') IN ('true','false')
        AND json_type(invalid.level_json,'$.livesStar') IN ('true','false')
        AND json_type(invalid.level_json,'$.scoreStar') IN ('true','false')
        AND json_extract(invalid.level_json,'$.completed')=json_extract(invalid.level_json,'$.completionStar')
        AND (json_extract(invalid.level_json,'$.completed')=1 OR
          (json_extract(invalid.level_json,'$.livesStar')=0 AND json_extract(invalid.level_json,'$.scoreStar')=0))
        AND json_type(invalid.level_json,'$.bestScore')='integer'
        AND json_extract(invalid.level_json,'$.bestScore') BETWEEN 0 AND 10000000
        AND json_type(invalid.level_json,'$.bestRemainingLives')='integer'
        AND json_extract(invalid.level_json,'$.bestRemainingLives') BETWEEN 0 AND 25
        AND (json_extract(invalid.level_json,'$.livesStar')=0 OR
          json_extract(invalid.level_json,'$.bestRemainingLives')>=invalid.lives_target)
        AND (json_type(invalid.level_json,'$.campaignScore') IS NULL OR
          (json_type(invalid.level_json,'$.campaignScore')='object'
          AND json_extract(invalid.level_json,'$.completed')=1
          AND json_type(invalid.level_json,'$.campaignScore.version')='integer'
          AND json_extract(invalid.level_json,'$.campaignScore.version')=1
          AND json_type(invalid.level_json,'$.campaignScore.bestScore')='integer'
          AND json_extract(invalid.level_json,'$.campaignScore.bestScore') BETWEEN 1 AND invalid.perfect_score
          AND NOT EXISTS (SELECT 1 FROM json_each(CASE
            WHEN json_type(invalid.level_json,'$.campaignScore')='object'
            THEN json_extract(invalid.level_json,'$.campaignScore') ELSE '{}' END) k
            WHERE k.key NOT IN ('version','bestScore'))))
        AND (json_extract(invalid.level_json,'$.scoreStar')=0 OR
          json_extract(invalid.level_json,'$.bestScore')>=invalid.legacy_target OR
          COALESCE(json_extract(invalid.level_json,'$.campaignScore.bestScore'),0)>=invalid.score_target)
      ,0)=0)
  GROUP BY p.id, p.nickname, p.progress_json
  HAVING missionsCompleted>0
)
SELECT * FROM ranked
ORDER BY missionsCompleted DESC, totalStars DESC, totalScore DESC, playerId COLLATE BINARY ASC
LIMIT ?2 OFFSET ?3
```

The invalid-level predicate above uses `COALESCE(condition,0)=0` to reject missing required fields. Its nested JSON traversal is guarded before `json_each`. Keep this predicate aligned with Task 2's shared validation and verify numeric/boolean type distinctions with real-D1 fixtures. Do not use JSON extraction on unguarded strings/arrays.

The SQL computes totals and ordering across the database. Shared `validateCloudProgress(JSON.parse(privateProgress))` then excludes remaining incompatible profiles (including unrelated classic progress corruption) from the sorted candidate stream. Fetch candidate chunks of 100, continuing with OFFSET until `limit` valid rows or exhaustion; invalid candidates must not starve valid contenders. Validate each accepted row's totals against a pure reduction of its already fetched validated profile, rejecting a SQL mismatch as a server error. This is validation of the top candidate stream, not an application-side all-account aggregation: never load all profiles into memory, compute rankings in JavaScript, or limit players before SQL aggregation. No privateProgress crosses the response boundary. A Set suppresses duplicate IDs if concurrent changes shift candidate pages; compare/sort final rows before emitting. Refresh provides eventual visibility rather than a cross-request snapshot guarantee.

- [x] **5. Wire the public handler.** Match GET exact path before authenticated handlers; nonmatching requests return null. Parse default 20 or `/^[1-9][0-9]*$/` and range 1..100; repeated `limit` parameters are rejected. Invalid input uses 400 with `{ok:false,error:{code:'INVALID_LIMIT',message:'Limit must be an integer from 1 to 100.'}}`. Success uses the declared response and no-store plus the existing JSON/security/CORS headers. Database failure uses 503 `{ok:false,error:{code:'API_UNAVAILABLE',message:'Campaign leaderboard is temporarily unavailable.'}}`, never empty-success. Reuse/export the existing Worker JSON header helper rather than copying security header constants.
- [x] **6. Run green:** `rtk npm test -- tests/campaign-leaderboard-worker.test.ts tests/account-integration.test.ts tests/guest-http-integration.test.ts tests/account-deletion.test.ts tests/worker.test.ts`; `rtk npm run build`. Include 125 corrupt candidates ahead of a valid player to test continuation, a future nested version, array/string levels, malformed JSON, and classic-date corruption. Assert data remains byte-for-byte unchanged by reads.
- [x] **7. Commit only Task 4 paths:** message `feat: publish separate campaign progress leaderboard`.

## Task 5: Show mission score goals and results clearly

**Files:** Modify `src/game/campaign/presentation.ts`, `src/game/ui/prerequisites.ts`, `src/game/scenes/CampaignScene.ts`, `src/game/scenes/GameScene.ts`, `src/game/ui/helpContent.ts`; update `tests/campaign-presentation.test.ts`, `tests/prerequisites.test.ts`, `tests/campaign-scene.test.ts`, `tests/campaign-callout.test.ts`; create `tests/campaign-score-ui.test.ts`.

**Interfaces:**
- Consumes: Task 1 metadata/breakdown, Task 2 progress, Task 3 result.breakdown.
- Produces: `CampaignLevelDetail.bestScore` current-era best/null; add `legacyBestScore: number | null` and `scoreTarget: number`. Existing bestLives remains lifetime best. `campaignRequirements` score progress uses current best and target, retaining earned flag. Campaign result UI uses four count/point lines and final/target/best labels.

- [x] **1. Add failing pure presentation tests and behavioral scene assertions.** A legacy-only fixture returns current best null, nonzero legacyBestScore, retained score-star earned, and new target. A new winning clear returns current best but legacy best unchanged. Exact target and target-minus-one results display reached/missed independently from a retained star.

```ts
it('separates a retained legacy star from the new scoring goal', () => {
  const profile = parseCampaignProfile(legacyLocalCompleted30)!;
  const repo = new CampaignRepository({ getItem: () => JSON.stringify(profile), setItem: () => {} });
  const detail = campaignLevelDetail(1, repo.view())!;
  expect(detail.bestScore).toBeNull();
  expect(detail.legacyBestScore).toBe(profile.levels[1]!.bestScore);
  expect(detail.scoreTarget).toBe(campaignScoreMetadata(1).scoreTarget);
  expect(campaignRequirements(repo.view(), 1).find(r => r.id === 'score')?.met)
    .toBe(profile.levels[1]!.scoreStar);
});
```

- [x] **2. Run red:** `rtk npm test -- tests/campaign-score-ui.test.ts`.
- [x] **3. Replace every active Campaign target/best label.** Run `rtk rg -n 'mastery.scoreTarget|bestScore' src/game` and account for each match: old target only in legacy validation, active UI always metadata. In existing scrollable mission details append weights, rule, target, new best/Not scored yet, and separate nonzero legacy line. Preserve map viewport and compact header constraints. Results use the saved breakdown, current best, retained/new star distinction, target comparison, failure ranking guidance, and accountStatus pending/acknowledged wording.

```ts
const m = campaignScoreMetadata(level);
const rule = 'Defeat wave enemies, clear waves, defeat the mission boss, and preserve lives. ' +
  'Summoned enemies give no score. Gold and time do not affect points.';
const weights = 'Wave enemies: 10 each · Cleared waves: 100 each · ' +
  (m.hasBoss ? 'Mission boss: 500 · ' : 'Mission boss: not applicable · ') +
  'Remaining lives: 50 each at settlement';
// Feed rule/weights to the existing scrollable details, not a fixed-height header.
const legacyLabel = 'Legacy score — excluded from current total';
const failureLabel = 'Winning clears contribute to your campaign ranking';
```

Change all three Campaign HUD creation branches (`metric` calls near GameScene lines 1309/1323 and `hudMetric` near 1341) from `SCORE` to `COMBAT SCORE`; Classic keeps `SCORE`. The compact stats sheet labels its live number `Combat score`. Final results label their settled number `Final score`. Add scene text assertions for the mode-specific label and browser checks that the longer Campaign label fits each viewport; use smaller existing caption sizing if needed, never truncate its meaning.

```ts
const scoreCaption = this.campaign ? 'COMBAT SCORE' : 'SCORE';
// Use scoreCaption in each existing HUD metric branch.
const statsScoreCaption = this.campaign ? 'Combat score' : 'Score';
```

Add a short Campaign entry to the existing help describing live combat score versus settled lives bonus. Do not change Classic help/formula. Render count/point component lines with `formatCount` in the existing `ScrollSheet`; resize re-renders from the saved result so no recalculation/double bonus occurs.
- [x] **4. Run green:** `rtk npm test -- tests/campaign-score-ui.test.ts tests/campaign-presentation.test.ts tests/prerequisites.test.ts tests/campaign-scene.test.ts tests/campaign-callout.test.ts tests/campaign-ui-repair.test.ts tests/content-fit.test.ts`. Browser layout is checked in Task 8, including legacy-only mission and ordinary/boss/failure results.
- [x] **5. Commit only Task 5 paths:** message `feat: explain campaign mission scoring and mastery goals`.

## Task 6: Add Campaign mode to the public leaderboard UI/client

**Files:** Modify `src/api/leaderboardClient.ts`, `src/game/scenes/LeaderboardScene.ts`, `src/game/scenes/CampaignScene.ts`; preserve MainMenu/GameOver callers; create `tests/campaign-leaderboard-client.test.ts`, `tests/campaign-leaderboard-scene.test.ts`; exercise `tests/leaderboard-client.test.ts`, `tests/saved-score-ui.test.ts`, `tests/screens.test.ts`.

**Interfaces:**
- Consumes: Task 4 response/comparator/validator and existing `LeaderboardResult<T>`.
- Produces: `fetchCampaignLeaderboard(limit = 20): Promise<LeaderboardResult<CampaignLeaderboardRow>>`, reusing private fetchJson timeout/error handling; Classic fetch signature unchanged.
- `LeaderboardScene.init(data: {mode?: 'classic'|'campaign'; filter?: Filter; highlightRunId?: string}): void` defaults classic. Resize restarts include mode. Campaign map action starts `{mode:'campaign'}`; main menu/default and Classic result links remain classic.

- [x] **1. Add failing client tests.** Mock fetch with valid era/counts/rows and malformed response examples: wrong era/counts, duplicate player IDs, negative/fractional metrics, too many stars/missions/score, wrong ordering, oversized nickname, limit overflow, HTML/HTTP failure, and aborted timeout. Verify the endpoint path and no mutation requests.

```ts
it('rejects a board whose primary ordering is wrong', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
    campaignScoreVersion: 1, missionCount: 100, starCount: 300,
    scores: [
      { playerId: 'a', nickname: 'A', missionsCompleted: 1, totalStars: 3, totalScore: 1000 },
      { playerId: 'b', nickname: 'B', missionsCompleted: 2, totalStars: 2, totalScore: 1 }
    ]
  }), { status: 200 })));
  expect((await fetchCampaignLeaderboard()).ok).toBe(false);
});
```

- [x] **2. Run red:** `rtk npm test -- tests/campaign-leaderboard-client.test.ts tests/campaign-leaderboard-scene.test.ts`.
- [x] **3. Add the API call and two-mode rendering.** Validate the entire response with Task 4 helper before returning its rows. Add two mode tabs above the existing Classic filter row; Campaign hides Classic filters and uses that space for ranking explanation/guest/pending notes. Keep Classic rendering intact. Store Classic/Campaign row arrays separately and preserve selected-mode successful rows during refresh, marking stale on failure. A mode change clears visible other-mode rows immediately; it may re-render its own retained list while loading.

```ts
const modeAtRequest = this.mode;
const request = ++this.requestGeneration;
const result = modeAtRequest === 'campaign'
  ? await fetchCampaignLeaderboard(ROWS)
  : await fetchLeaderboard(this.filter === 'overall' ? undefined : this.filter, ROWS);
if (this.loadGeneration !== generation || this.requestGeneration !== request ||
    this.mode !== modeAtRequest || !this.scene.isActive('Leaderboard')) return;
```

Use existing generation guards on every awaited suffix lookup too. Campaign failure suffix uses accountStatus/guest-browser guidance, not the Classic saved-submission retry repository. Success replaces its own cache; empty-success replaces any stale list with distinct empty copy. Refresh/retry fetches the current mode. Hide pending/cloud identity details from public row values, but show current account status as local context. Highlight Campaign rows by current session account playerId only, Classic by existing runId. Campaign desktop columns are rank/name/missions/stars/score; compact rows wrap name and show `Missions x/100 · Stars y/300` beneath it. Use at least existing 44px mode/action hit targets and viewport masks; row count/scroll uses the selected array's length.
- [x] **4. Add scene tests with deferred mocked fetch promises.** Mock Phaser as existing scene tests do; stub add/render primitives only, then invoke actual loadBoard/mode/resize/shutdown handlers. Resolve Campaign after switching to Classic, resolve Classic after Campaign, and reject a refreshed board after prior success; assert correct selected arrays, stale error/retry visibility, empty-success replacement, highlight, and selected-mode retry. Do not substitute source-text assertions for these async behaviors.
- [x] **5. Add a Campaign leaderboard action using existing campaign header/footer actions.** Keep world-map navigation and playable viewport clear, including phone landscape; use existing ScrollSheet action space if fixed header would overflow. Confirm all existing `scene.start('Leaderboard',...)` links still default/preserve Classic. Browser acceptance in Task 8 covers both tabs and Campaign entry point.
- [x] **6. Run green:** `rtk npm test -- tests/campaign-leaderboard-client.test.ts tests/campaign-leaderboard-scene.test.ts tests/leaderboard-client.test.ts tests/saved-score-ui.test.ts tests/screens.test.ts`; `rtk npm run build`.
- [x] **7. Commit only Task 6 paths:** message `feat: browse classic and campaign public rankings`.

## Task 7: Put guest name/action together and make Google retries concrete

**Files:** Modify `src/game/scenes/LoginScene.ts`, `src/style.css`, `src/api/accountClient.ts`, `src/game/systems/AccountSystem.ts`, `worker/auth.ts`, `tests/helpers/guestAccountFixture.ts`; create `tests/guest-entry-recovery.test.ts`; update `tests/account-auth.test.ts`, `tests/guest-entry-ui.test.ts`, `tests/guest-account-system.test.ts`, and every typed `AccountClient` fake found by `rtk rg -n 'AccountClient|client:' tests`.

**Interfaces:**
- Consumes: existing AccountSystem preflight/loss acknowledgment and client `ApiResult<T>`.
- Produces: `AccountClient.prepareGoogleSignIn(): Promise<ApiResult<{url:string}>>`, fetching same-origin `/api/auth/start?prepare=1` without navigating; `AccountSystem.prepareGoogleSignIn(acknowledgeLoss?: boolean): Promise<ApiResult<{url:string}>>` runs existing preflight/begin guards and client preparation. Retain existing `beginGoogleSignIn` signature/semantics for tests/callers; LoginScene uses new prepared flow. Existing top-level GET `/api/auth/start` and deletion-purpose flow stay supported.
- New preparation response uses existing `{ok:true,value:{url}}` envelope and the same HttpOnly OAuth browser cookie/state machinery. Return the ordinary public authorization URL, including its standard `state`, `nonce`, and PKCE `code_challenge` query parameters, exactly as the existing redirect would. Never return the private PKCE verifier, browser-cookie value, stored attempt row, access/ID tokens, or client secret. Named guest entry and account management keep current APIs.

- [x] **1. Add failing retry tests with injectable AccountClient.** Extend client fakes with the new method. First preparation returns 503; second returns a valid Google authorization URL. Assert two clicks perform two attempts, no navigation on failure, input value unchanged, guest entry remains callable, and begin guards prevent preparation during a battle/deletion. Loss acknowledgment cancellation performs no auth request. Use a small DOM test stub for actual LoginScene.render event handlers if no DOM dependency is installed; browser checks in Task 8 must verify the real DOM keyboard order.

```ts
it('keeps guest entry available after a failed auth attempt', async () => {
  const f = createGuestAccountFixture();
  f.client.prepareGoogleSignIn = vi.fn()
    .mockResolvedValueOnce({ ok:false, code:'API_UNAVAILABLE', status:503, message:'Try again.' })
    .mockResolvedValueOnce({ ok:true, value:{ url:'https://accounts.google.com/o/oauth2/v2/auth?client_id=test' } });
  try {
    expect((await f.system.prepareGoogleSignIn(false)).ok).toBe(false);
    expect((await f.system.enterGuest('Aria')).ok).toBe(true);
    expect((await f.system.prepareGoogleSignIn(false)).ok).toBe(true);
    expect(f.client.prepareGoogleSignIn).toHaveBeenCalledTimes(2);
  } finally { await f.close(); }
});
```

Import `createGuestAccountFixture` from the existing `tests/helpers/guestAccountFixture.ts`; add the new typed default client method there. Reuse the beforeEach browser-store setup and afterEach cleanup from `guest-account-system.test.ts`; no new production or test factory is needed.
- [x] **2. Run red:** `rtk npm test -- tests/guest-entry-recovery.test.ts`.
- [x] **3. Add preparation response to the existing auth-start handler.** Reuse its exact discovery, PKCE, OAuth attempt creation, destination construction, and cookie. If `prepare=1`, return JSON with url instead of redirect plus no-store and the same cookie; normal/deletion redirect unchanged. Catch unavailable configuration/discovery/database preparation errors for this flow into explicit retryable 503 envelopes; invalid deletion/session remains existing 401/403 behavior. No repeated automatic attempts and no changes to callback validation/CSRF protections. Auth tests confirm PKCE/cookie secrecy and unchanged normal/deletion redirects.

```ts
// After the existing verified OAuth destination and browser cookie exist:
const response = url.searchParams.get('prepare') === '1'
  ? reply({ ok: true, value: { url: destination.href } })
  : new Response(null, { status: 302, headers: { Location: destination.href } });
response.headers.set('Cache-Control', 'no-store');
response.headers.set('Set-Cookie', browserCookie);
return response;
```

The Worker keeps discovery and verifies its destination's HTTPS Google origin before issuing the prepared URL. The client uses the fixed trusted origin `https://accounts.google.com`, matching this application's Google-only provider; it does not run discovery or trust a returned origin field. Reject non-HTTPS URLs, a different origin, or embedded username/password before navigation and show an in-form error. Keep the authorization path supplied by the Worker's discovery result.

```ts
const authUrl = new URL(value.url);
if (authUrl.origin !== 'https://accounts.google.com' || authUrl.protocol !== 'https:' ||
    authUrl.username || authUrl.password) {
  return { ok: false, code: 'INVALID_AUTH_URL', status: 502,
    message: 'Google sign-in returned an invalid destination. Please retry.' };
}
```

Preparation itself retries connectivity even when initialization/config checks previously failed. Set `googleSignInPending` only when navigating after successful preparation, or clear it on preparation failure; failure must not make the next reload unexpectedly abandon guest play.
- [x] **4. Reorder the unsigned-in form only.** Guest action comes immediately after its label/input; insert a noninteractive `div.account-separator` with visible “or”; append Google sign-in/loss confirmation beneath it; remove Retry connection and duplicate warning. Give guest action an existing-compatible primary CSS class; add small separator margins/colors using current tokens. Keep all signed-in controls/order untouched. Existing users see Save name and continue. Busy disables actions, not successful local entry permanently; focus/selection remains restored by existing render.

```ts
const separator = document.createElement('div');
separator.className = 'account-separator';
separator.textContent = 'or';
separator.setAttribute('aria-hidden', 'true');
panel.appendChild(separator);
```

Before a successful auth navigation retain the typed draft in sessionStorage under `aetherhold-account-entry-name`; recover/remove it on returning to the entry screen, including existing authError callbacks. Store no account/session secrets there. A preparation failure never navigates or touches the draft. If draft storage is unavailable, retain the name in the current form and explain its possible loss in the existing loss-warning flow before navigation; guest progress storage warnings remain accurate. Do not change the saved guest identity merely because someone clicked Google. Handle browser Back/callback errors by returning to the same entry screen with name and retry action available.
- [x] **5. Run green:** `rtk npm test -- tests/guest-entry-recovery.test.ts tests/account-auth.test.ts tests/guest-entry-ui.test.ts tests/guest-account-system.test.ts tests/account-system.test.ts`; `rtk npm run build`. Test expired/busy/deleting sessions and insecure/unexpected auth URL failures without changing deletion behavior.
- [x] **6. Commit only Task 7 paths:** message `feat: simplify guest entry and retry google sign-in`.

## Task 8: Verify the complete release, deploy, and synchronize

**Files:** Create `docs/CAMPAIGN_SCORING_VERIFICATION.md`; store only task-owned browser evidence under `docs/verification/2026-10-14-campaign-scoring/`; modify tests/helpers/fixtures only to close failures traced to this feature. Read-only production verification; no fabricated score/account writes.

**Interfaces:** Consumes completed Tasks 1–7; produces release evidence, successful existing production deployment, and matching local/remote HEAD.

- [x] **1. Run the complete suite/build gate before deployment:** `rtk npm test`; `rtk npm run build`; `rtk git diff --check`. Record exact pass/fail counts and build result. Investigate failures; do not replace strong assertions with weak source matches or remove regression tests. A clean focused suite is insufficient for this release's multiple shared storage/result boundaries.
- [ ] **2. Verify locally with the existing dev server and available browser tools.** Start `rtk npm run dev -- --host 127.0.0.1` in an exec session; use computer-use skill/tools for browser interaction when available. Test 1440x900 desktop, 768x1024 tablet, 390x844 phone portrait, and 844x390 phone landscape. Inspect screenshot and interaction evidence for guest form/name adjacency, keyboard order, no Retry connection, offline named guest start, both boards, loading/empty/error/stale responses, long nicknames, 100-mission/300-star totals, scroll/retry visibility, Campaign map action, legacy mission details, current target/weights, ordinary/boss/failure results, and resize while a request is pending. Use local-only fixtures/intercepts for failures, never alter production profiles. A real unassisted mission-1 winning run must save/reload its new best; capture a loss and a replay to verify max-only behavior. Existing QA previews do not prove earned-score publication.
- [x] **3. Verify sync/import with the real-D1 HTTP integration tests.** Named guest clears at least two missions in test fixtures, signs in to a test account, imports once, and appears with expected missions/stars/sum. Repeat import and stale upload; totals stay unchanged. Concurrent devices preserve maxima. Confirm account result/sync may arrive in either order: public totals reflect acknowledged progress only, while pending sync remains visible. Classic tests and old pending terminal results remain green.
- [x] **4. Release only after the complete gate and browser checks pass.** This plan creates no D1 schema. Check `rtk git diff --name-only` and migrations before deploying; if implementation introduced a justified backward-compatible migration, run tests/build first and `rtk npm run db:migrate:remote` before dependent code, reporting a concrete blocker if it fails. Run `rtk npm run deploy`, whose existing script reruns tests and build before `wrangler deploy --keep-vars`. Record Worker version/live URL and command result. Do not manually publish to bypass this gate.
- [ ] **5. Verify production through actual fetched resources.** Use `https://aetherhold-defense.ljournllagas.workers.dev/` (confirm the deploy output still names it), fetch HTML, resolve its script URL from the fetched page, and fetch that current JS bundle. Verify `/api/health`, `/api/leaderboard?limit=20`, `/api/campaign-leaderboard?limit=20`, new response era/counts/privacy/order/no-store, valid empty behavior if no eligible accounts, and invalid new limit 400. Use the visible live page to inspect guest entry and both leaderboard modes, including Campaign world-map entry. No real Google login, deletion, nickname modification, or public score submission solely to test production. If bundle/page/API mismatch or deployment fails, fix within authorized scope or report the exact failure; do not claim release success.
- [x] **6. Write verification evidence.** Record commands/counts, local/D1/browser checks, screenshots, live resource hashes or URLs and Worker version, retained legacy behavior, public trust-model limit, and any real-play balance not tested. No secrets/account raw data in documentation. Mark plan task checkboxes only for completed verified steps. Updated score weights/targets require spec agreement and era handling rather than an undocumented balancing change.
- [ ] **7. Commit release documentation and any verified fixes with explicit paths.** Run `rtk git diff --cached --check` before commit. Push current branch with `rtk git push origin HEAD`; verify `rtk git rev-parse HEAD` equals `rtk git ls-remote --heads origin codex/campaign-v5-20261012` (recheck actual current branch first). Preserve unrelated untracked files. Report live URL, verification result, commit, and any push failure.

## Coverage and handoff

| Spec area | Tasks |
| --- | --- |
| Independent era/formula/scheduled eligibility/targets | 1, 3 |
| Legacy retention/current bests/cloning/merging/save protection | 2, 3, 4 |
| Public aggregation/order/privacy/invalid profiles/automatic publication | 4 |
| Clear goals/results/legacy labels/responsive details | 5, 8 |
| Classic/Campaign client/tabs/async and failure states | 6, 8 |
| Guest name/action/layout/Google retry/loss acknowledgment | 7, 8 |
| Real D1, full tests/build, live page/bundle/health, commit/push | 8 |

Execution recommendation: **Native/inline**, because tasks share scoring/progress/result interfaces and production remains under one verified release. The main agent implements sequentially with checkpoints; the required execution workflow supplies the final independent whole-change review. Subagent-driven execution remains available if the user prefers its per-task independent implementation/review cost. Written-plan review and execution-method selection are required before product edits.

Plan review: Round 1 scored 7/10 with four blockers; Round 2 scored 9/10 with zero blockers and zero advisory items. All 40 reviewed requirement groups map to tasks. User review and execution-method selection are pending. No application implementation, runtime testing, build, or deployment occurred during planning.
