# Google Login and Cloud Progress Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Require Google login and retain completed progress and terminal scores across devices without mixing accounts or losing pending results.

**Architecture:** The existing Worker owns Google OIDC callbacks, opaque sessions, account APIs, and D1 writes. Shared pure validation/merge code defines cloud projections; account-scoped browser repositories and an outbox connect them to the existing Phaser scenes. Enable required login only after real OAuth verification.

**Tech Stack:** TypeScript, Phaser 4, Cloudflare Workers/D1, Vitest, browser IndexedDB and Web Locks, oauth4webapi v3 (pin the exact current v3 release and lockfile at implementation).

**Spec:** docs/superpowers/specs/2026-10-11-google-login-cloud-progress-design.md

## Global Constraints

- Tier Full is design ceremony; repository route remains Light with the main agent implementing unless the user selects otherwise.
- Session lifetime is 30 days, without silent extension; OAuth attempts expire after ten minutes; deletion reauthentication must be within five minutes.
- Nickname maximum is 20 code units, default Warden; duplicate nicknames allowed; public nickname fixed at first server acceptance.
- Retry after approximately 2, 5, 15, 30, and 60 seconds, capped at 60 seconds with jitter; honor Retry-After.
- No unfinished battle saves, new Campaign rankings, passwords, additional providers, anti-cheat, or asset offline caching.
- Protect malformed/newer local bytes, account ownership, legacy score eras, historical anonymous rows, and device preferences.
- Every task consumes the approved spec, including its failure paths and acceptance section. Exact APIs below are the cross-task contract.
- Prefix shell commands with rtk. Preserve unrelated .scratch/ data. Commit/push verified completed changes to the current branch. Deploy application changes only after change-specific checks using npm run deploy; verify live page, current bundle, and /api/health.
- Intermediate commits are dependency steps of one application change; publish once the complete feature passes the release gate, never a half-integrated login gate.

## Review Focus

- IndexedDB blocked/private-mode failures: no silent outbox loss or false saved status (Task 5).
- Two tabs switch accounts while a battle settles: ownership remains the captured account (Tasks 6, 7).
- Account deletion races a cloud merge or delayed result upload: no recreated old generation (Tasks 3, 9).
- Google key rotation/network failure: valid current keys verify; failures do not create sessions (Task 2).
- Acknowledgement lost after nickname change: original accepted nickname and run survive unchanged (Task 4).

## File boundaries and dependency order

Create src/shared/account.ts for transport types, src/shared/cloudProgress.ts for pure projection rules, src/shared/campaignResult.ts for campaign validation. Create worker/auth.ts for identity/session middleware, worker/accounts.ts for profile/import/deletion persistence, worker/accountScores.ts for authenticated score persistence. Keep routing and existing health/leaderboard in worker/index.ts. Create src/api/accountClient.ts for HTTP, src/game/systems/AccountStorage.ts for IndexedDB, AccountSystem.ts for state/entry rules, and AccountSync.ts for synchronization scheduling. Existing CampaignRepository, UnlockRepository, Settings best APIs, and ScoreRetry remain the compatibility seams; do not introduce a second gameplay progression engine. Add LoginScene.ts; extend current account UI in MainMenu and Settings. Register through src/main.ts. Tests mirror these boundaries, with real local D1 acceptance rather than SQL-string assertions alone.

Task order: 1 contracts/schema → 2 auth → 3 profile/import → 4 scores → 5 browser persistence → 6 account lifecycle → 7 gameplay integration → 8 UI → 9 deletion → 10 release. Independent implementation is not assumed: later tasks consume exact interfaces below.

## Task 1: Shared contracts, validation, and additive schema

**Files:** Create src/shared/account.ts, src/shared/cloudProgress.ts, src/shared/campaignResult.ts, migrations/0005_player_accounts.sql, tests/cloud-progress.test.ts, tests/account-migration.test.ts. Modify src/game/campaign/progress.ts and src/game/systems/Settings.ts only to export existing pure parsers/derivation needed by shared code without browser singleton side effects; place reusable pure rules in shared/cloudProgress.ts instead of importing browser repositories into the Worker.

**Consumes:** CampaignLevelProgress and CampaignProfile from src/game/campaign/types.ts; BranchId, GameResultPayload, LocalBest structure, campaign definitions, existing score and nickname validation.

**Produces:** the following definitions in account.ts, exported validation/project/merge functions in cloudProgress.ts, and validateCampaignResult(value: unknown): CampaignResultPayload | null in campaignResult.ts.

```ts
import type { CampaignLevelProgress } from '../game/campaign/types.ts';
import type { BranchId } from './progression.ts';
import type { GameResultPayload } from './types.ts';
export interface AccountRef { playerId: string; generation: string }
export interface PersonalBest { score: number; wave: number; difficulty: 'easy'|'medium'|'hard'; date: string; scoreVersion: number }
export interface CloudProgress {
  version: 1; campaignVersion: number; progressionVersion: number;
  levels: Partial<Record<number, CampaignLevelProgress>>;
  earned: Partial<Record<BranchId, string>>;
  bests: PersonalBest[];
}
export interface AccountSession { account: AccountRef; nickname: string; expiresAt: number; csrf: string; canDelete: boolean }
export interface AccountConfig { loginRequired: boolean }
export type SyncStatus = 'loading'|'pending'|'retrying'|'synced'|'permanent'|'incompatible'|'unavailable';
export interface AccountProfile { account: AccountRef; nickname: string; revision: number; progress: CloudProgress }
export interface CampaignResultPayload {
  runId: string; campaignVersion: number; progressionVersion: number; level: number;
  outcome: 'victory'|'defeat'|'siege-failed'; finalScore: number; remainingLives: number;
  gameDurationSeconds: number; gameVersion: string;
}
export type RunResult = { mode: 'classic'; payload: GameResultPayload } | { mode: 'campaign'; payload: CampaignResultPayload };
export interface PendingResult { account: AccountRef; result: RunResult; status: 'pending'|'permanent'; error?: string }
export interface GuestSnapshot { progress: CloudProgress; nickname: string; result: RunResult | null; warnings: string[] }
export interface GuestClaim { importId: string; account: AccountRef; snapshot: GuestSnapshot; consumed: boolean }
export type ApiResult<T> = { ok: true; value: T } | { ok: false; code: string; message: string; status: number; retryAfterMs?: number };
export interface ScoreAck { runId: string; mode: RunResult['mode']; id: number; nickname: string; anonymousExisting?: boolean }
export type AuthState = 'loading'|'signed-out'|'ready'|'offline'|'expired'|'deleting'|'deleted'|'error';
export interface AccountView { state: AuthState; config: AccountConfig | null; playMode: 'blocked'|'legacy'|'account'; session: AccountSession | null; profile: AccountProfile | null; warning: string | null; pending: number; progressSync: SyncStatus; resultSync: SyncStatus; acknowledgedRevision: number | null; progressDirty: boolean }
```

- [ ] Write merge tests with independently earned stars and maxima, unchanged device fields, illegal IDs/flags/lives, supported older best eras, and future-version rejection:

```ts
import { expect, it } from 'vitest';
import { emptyCloudProgress, mergeCloudProgress, validateCloudProgress } from '../src/shared/cloudProgress.ts';
it('unions stars without regressing level bests', () => {
  const a = emptyCloudProgress(), b = emptyCloudProgress();
  a.levels[1] = { completed:true, completionStar:true, livesStar:true, scoreStar:false, bestScore:100, bestRemainingLives:20 };
  b.levels[1] = { completed:true, completionStar:true, livesStar:false, scoreStar:true, bestScore:200, bestRemainingLives:10 };
  expect(mergeCloudProgress(a,b).levels[1]).toEqual({ completed:true, completionStar:true, livesStar:true, scoreStar:true, bestScore:200, bestRemainingLives:20 });
  expect(validateCloudProgress({ ...a, version: 99 })).toBeNull();
});
```

- [ ] Run `rtk npm test -- tests/cloud-progress.test.ts tests/account-migration.test.ts`; expect missing imports/schema failures.
- [ ] Implement `emptyCloudProgress(): CloudProgress`, `validateCloudProgress(value: unknown): CloudProgress | null`, `mergeCloudProgress(a: CloudProgress,b: CloudProgress): CloudProgress`, `campaignProfileFromCloud(progress: CloudProgress, local: CampaignProfile): CampaignProfile`, `guestSnapshot(storage: Pick<Storage,'getItem'> | null): GuestSnapshot`. Reuse existing supported versions/IDs and parsers; strict cloud validation rejects unknown fields and inconsistent stars. Merge unlock timestamps using the earliest, best ties preserving existing, stars by OR, numeric bests by max. Derive access through existing Campaign configuration and retain local choices/targeting/presets only where currently unlocked. Campaign result bounds: known level/current versions; integer score 0..10,000,000; lives 0..configured starting lives; duration 0..86,400; existing run ID/game version formats; victory requires positive lives, defeat requires zero, siege-failed requires a configured required boss. These are structural checks, not anti-cheat.

```sql
CREATE TABLE players (id TEXT PRIMARY KEY, generation TEXT NOT NULL UNIQUE, issuer TEXT NOT NULL, subject TEXT NOT NULL, nickname TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 0, progress_json TEXT NOT NULL, UNIQUE(issuer,subject));
CREATE TABLE sessions (token_hash TEXT PRIMARY KEY, player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE, generation TEXT NOT NULL, expires_at INTEGER NOT NULL, csrf TEXT NOT NULL, reauthenticated_at INTEGER);
CREATE TABLE oauth_attempts (state_hash TEXT PRIMARY KEY, browser_hash TEXT NOT NULL, verifier TEXT NOT NULL, nonce TEXT NOT NULL, expires_at INTEGER NOT NULL, purpose TEXT NOT NULL CHECK(purpose IN ('login','delete')), player_id TEXT, generation TEXT);
CREATE TABLE guest_imports (import_id TEXT PRIMARY KEY, player_id TEXT REFERENCES players(id) ON DELETE SET NULL, generation TEXT, consumed INTEGER NOT NULL DEFAULT 0 CHECK(consumed IN(0,1)));
CREATE TABLE campaign_scores (id INTEGER PRIMARY KEY AUTOINCREMENT, run_id TEXT NOT NULL UNIQUE, player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE, generation TEXT NOT NULL, nickname TEXT NOT NULL, payload_json TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
ALTER TABLE scores ADD COLUMN player_id TEXT REFERENCES players(id) ON DELETE CASCADE;
ALTER TABLE scores ADD COLUMN account_generation TEXT;
CREATE INDEX sessions_expiry ON sessions(expires_at);
CREATE INDEX scores_owner ON scores(player_id);
```

- [ ] Test on actual local D1: apply migrations to a separate `.scratch/login-plan-d1` persistence path, seed an anonymous pre-0005 score, apply 0005, confirm preserved score values and null owner, foreign-key cascade, and batch rollback on constraint error. Follow installed Wrangler command help for `--persist-to`; use native PowerShell commands through `rtk proxy powershell`. Do not modify the existing scratch DB.
- [ ] Run focused tests and typecheck, expect PASS; commit explicit Task 1 files with message `Define cloud account contracts and additive schema`.

## Task 2: Google callback and opaque sessions

**Files:** Create worker/auth.ts, tests/account-auth.test.ts; modify worker/index.ts, package.json, package-lock.json, wrangler.toml; create docs/GOOGLE_LOGIN_SETUP.md.

**Consumes:** AccountRef, AccountSession, ApiResult, players/sessions/oauth_attempts schema.
**Produces:** `AuthEnv { DB: D1Database; GOOGLE_CLIENT_ID: string; GOOGLE_CLIENT_SECRET: string; APP_ORIGIN: string; ACCOUNT_LOGIN_REQUIRED?: string }`; `requireSession(request: Request, env: AuthEnv): Promise<AccountSession|null>`; `checkMutation(request: Request, session: AccountSession, env: AuthEnv): boolean`; `handleAuth(request: Request,env: AuthEnv): Promise<Response|null>`. Endpoints GET /api/auth/start, GET /api/auth/callback, GET /api/auth/session, POST /api/auth/logout; later deletion calls /api/auth/start?purpose=delete.

- [ ] Write tests of server session issuance and rejection with mock discovery/token/JWKS endpoints and an actual test RSA key, not a mock that accepts every token:

```ts
it.each(['wrong-state','replayed-state','wrong-browser','expired-state','wrong-nonce','wrong-audience','wrong-issuer','expired-token','forged-signature','jwks-offline'])('does not establish a session for %s', async (fault) => {
  const reply = await authFixture.callback(fault);
  expect(reply.headers.get('set-cookie') ?? '').not.toContain('__Host-aether-session=');
  expect(await authFixture.sessionCount()).toBe(0);
});
```

`authFixture` is a test helper defined in tests/account-auth.test.ts providing `callback(fault:string):Promise<Response>` and `sessionCount():Promise<number>`; back it with real local D1 or a SQL-executing local Worker fixture, seeded attempts and generated keys. Also assert state consumption, key rotation, callback cancellation, secure cookie attributes, expiry, logout, origin/CSRF failures, and private no-store.
- [ ] Run `rtk npm test -- tests/account-auth.test.ts`; expect missing auth implementation.
- [ ] Install the exact available oauth4webapi v3 release using `rtk npm install --save-exact oauth4webapi@3`, record resolved version, and use official v3 signatures. Start discovery only against https://accounts.google.com; request `openid profile` as Google's documented OIDC scope combination, discard profile claims instead of storing names/photos; never persist access/refresh/ID tokens. Generate random state/verifier/nonce and browser cookie, store hashed state/browser token with ten-minute expiry, bind delete purpose to existing account, then redirect. Callback atomically consumes `DELETE ... RETURNING` attempt matching cookie and expiry before exchange. Reject replay.

```ts
import * as oauth from 'oauth4webapi';
const issuer = new URL('https://accounts.google.com');
const as = await oauth.discoveryRequest(issuer).then(r => oauth.processDiscoveryResponse(issuer,r));
const client: oauth.Client = { client_id: env.GOOGLE_CLIENT_ID };
const params = oauth.validateAuthResponse(as,client,new URL(request.url),expectedState);
const tokenResponse = await oauth.authorizationCodeGrantRequest(as,client,oauth.ClientSecretPost(env.GOOGLE_CLIENT_SECRET),params,`${env.APP_ORIGIN}/api/auth/callback`,attempt.verifier);
const tokens = await oauth.processAuthorizationCodeResponse(as,client,tokenResponse,{expectedNonce:attempt.nonce,requireIdToken:true});
await oauth.validateApplicationLevelSignature(as,tokenResponse);
const claims = oauth.getValidatedIdTokenClaims(tokens)!;
```

`expectedState` is the callback's state already authenticated by its hash; `attempt` is the consumed database row. Explicitly verify library signature verification API/order against installed declarations; do not equate claim validation with signature validation. Fetches timeout at 8 seconds and failures become a generic retryable login error. Upsert the Google key to a UUID player/generation with Warden and empty progress, then mint a 32-byte random session, SHA-256 hash, CSRF token, and fixed 30-day expiry. Cookie `__Host-aether-session`, Path=/, Secure, HttpOnly, SameSite=Lax, no Domain. Store expiry in milliseconds consistently. Local HTTP development uses a separate clearly named non-__Host cookie; production never relaxes secure flags. Delete-purpose callback only grants fresh reauth to the same existing session/identity; it does not create a player or switch accounts.
- [ ] Route auth before score handlers; keep /api/health and Classic leaderboard public. Add public GET /api/account/config returning `ApiResult<AccountConfig>` with `{loginRequired:env.ACCOUNT_LOGIN_REQUIRED !== '0'}` and Cache-Control:no-store. Missing rollout var therefore requires login, never implies legacy mode. This endpoint does not require Google credentials. Auth/session endpoints return 503 if OAuth configuration is absent, but explicitly configured legacy mode remains playable via the config endpoint. Account APIs always no-store without wildcard CORS; CSRF cookie/session token plus exact Origin required for mutations. Add `APP_ORIGIN` and rollout var but no secret values to wrangler config; `run_worker_first` for /api/* to guarantee auth handlers reach the Worker.
- [ ] Implement deletion freshness using Google's supported `claims` request for auth_time and `prompt=select_account consent`; never use undocumented prompt=login/max_age as a guarantee. Enable auth_time in Google Auth Platform settings as linked by the official OIDC guide. After normal signature/claims/nonce verification and exact subject match, require integer signed `claims.auth_time` with `0 <= nowSeconds-auth_time <= 300`, and set reauthenticated_at to `auth_time*1000`, not callback/iat time. Missing, stale, or future auth_time returns REAUTH_REQUIRED without deleting or setting canDelete. Consent/account selection alone is insufficient. If Google's session is old, show instructions to sign out and sign back into that Google account in Google's own page, then retry the game's deletion flow; do not sign users out of Google automatically. Fresh Google authentication within five minutes plus a new purpose-bound callback is the supported forced freshness gate. Test a freshly issued token with old auth_time, missing claim, wrong identity, future time, disabled metadata configuration, and a genuine recent auth_time. Real Google acceptance must prove this path before release.
- [ ] Document Google Web OAuth client, exact registered callback, auth_time metadata settings, stale Google-session reauthentication instructions, localhost setup through Vite /api proxy, `wrangler secret put GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET`, separate development secrets, and account data/log privacy. Cleanup expired attempts/sessions opportunistically in bounded SQL batches during login (not new cron).
- [ ] Run focused tests/typecheck, expect PASS; commit Task 2 files `Add Google sign-in and secure game sessions`.

## Task 3: Profile sync and idempotent guest claims

**Files:** Create worker/accounts.ts, tests/account-profile.test.ts; modify worker/index.ts.
**Consumes:** Task 1 cloud functions and schema; requireSession/checkMutation.
**Produces:** `handleAccount(request: Request, env: AuthEnv): Promise<Response|null>` handling GET /api/account, POST /api/account/sync, POST /api/account/import, PATCH /api/account/nickname. Sync body `{ progress: CloudProgress }`; import body `{ importId:string, generation:string, snapshot:GuestSnapshot }`; success AccountProfile. Nickname body `{ nickname:string }`.

- [ ] Write concurrent/response-loss tests:

```ts
it('keeps both device achievements across competing writes',async () => {
  const [a,b] = await Promise.all([profileFixture.sync('stars'),profileFixture.sync('unlocks')]);
  expect(a.ok && b.ok).toBe(true);
  const profile = await profileFixture.read();
  expect(profile.progress.levels[1]?.completed).toBe(true);
  expect(Object.keys(profile.progress.earned)).toHaveLength(1);
});
it('rejects importing the same browser snapshot into another account',async () => {
  expect((await profileFixture.import('browser-1','A')).ok).toBe(true);
  expect((await profileFixture.import('browser-1','B')).code).toBe('IMPORT_CLAIMED');
});
```

Define `profileFixture` in this test as a local D1-backed helper with named `stars/unlocks` validated projections, accounts A/B, and methods shown above. Test empty profiles, invalid/future JSON, generation mismatch, bounded bodies (64 KiB cloud/import, 1 KiB nickname), CSRF, batch failure, malformed partial guest data, nickname precedence, and deletion racing CAS.
- [ ] Run `rtk npm test -- tests/account-profile.test.ts`; expect missing handler.
- [ ] Implement bounded strict body parsing before merge; extend existing bounded-body utility with per-route maximum instead of globally lifting 4096-byte score limit. Compare-and-swap progress with `UPDATE players SET progress_json=?1, revision=revision+1 WHERE id=?2 AND generation=?3 AND revision=?4 RETURNING ...`. Read fresh canonical data, validate server versions, merge, try CAS up to 5 times, then return retryable 503. No blind read-modify-write.

```ts
for(let attempt=0;attempt<5;attempt++) {
  const current = await readAccount(db,session.account);
  if(!current) return accountDeletedResponse();
  const next = mergeCloudProgress(current.progress,incoming);
  const row = await db.prepare('UPDATE players SET progress_json=?1, revision=revision+1 WHERE id=?2 AND generation=?3 AND revision=?4 RETURNING id, generation, nickname, revision, progress_json')
    .bind(JSON.stringify(next),session.account.playerId,session.account.generation,current.revision).first();
  if(row) return profileResponse(row);
}
return retryableResponse('SYNC_BUSY',503);
```

The internal functions in this snippet are private in accounts.ts: `readAccount` returns AccountProfile|null; response builders produce no-store ApiResult JSON. Import wraps first claim, CAS merge, and consumed flag in one D1 batch. Use `guest_imports` INSERT with `ON CONFLICT DO NOTHING`, conditional UPDATE matching owner/generation, and consumed guarded by the resulting revision. If CAS fails, no consumed flag changes; reread/try again. Require exact claim ownership on repeats and return canonical profile when consumed. Imported old submission is queued client-side only after the claim acknowledgement; best-only records never insert scores. Nickname import: add `nickname_initialized` column to players (default 0), set it once through a validated imported name/default Warden; explicit PATCH sets initialized=1 so other devices cannot overwrite. This is folded into 0005 before deployment.
- [ ] Run focused tests/typecheck and actual D1 concurrency cases, expect PASS; commit Task 3 files `Synchronize account progress and claim guest saves once`.

## Task 4: Authenticated Classic and Campaign score writes

**Files:** Create worker/accountScores.ts, tests/account-scores.test.ts; modify worker/index.ts, src/api/leaderboardClient.ts, tests/worker.test.ts, tests/score-submission.test.ts. Retain old ScoreRetry compatibility until Task 7 removes manual UI callers.
**Consumes:** RunResult/ScoreAck, validateScorePayload, validateCampaignResult, session middleware.
**Produces:** `handleAccountScore(request:Request,env:AuthEnv):Promise<Response|null>` for POST /api/account/scores body RunResult. Existing /api/scores delegates authenticated classic envelope when rollout enabled; anonymous submission remains available only during disabled rollout. ApiResult<ScoreAck>; errors AUTH_REQUIRED/ACCOUNT_DELETED/INVALID_SCORE/INCOMPATIBLE_SCORE/RUN_CONFLICT/RATE_LIMITED/API_UNAVAILABLE.

- [ ] Write tests covering immutable identity:

```ts
it('preserves first accepted nickname after acknowledgement loss',async () => {
  const first = await scoreFixture.submit('run-lost-ack','Warden');
  await scoreFixture.rename('New Name');
  const second = await scoreFixture.submit('run-lost-ack','Ignored client name');
  expect(second.value).toEqual(first.value);
  expect(await scoreFixture.count()).toBe(1);
});
```

Define scoreFixture with actual SQL insert/read, authenticated sessions and complete structurally valid Classic payloads. Add duplicate mismatch/other owner, existing anonymous import run acknowledgement (no ownership reassignment), Campaign outcomes/bounds, era protection, rate limits, concurrent inserts, delete race, no public Campaign rows and strict envelopes.
- [ ] Run `rtk npm test -- tests/account-scores.test.ts tests/worker.test.ts`; expect missing handler/new ownership assertions failing.
- [ ] Implement insert guarded in SQL by existence of player/generation, selecting current nickname from players at insertion. For Classic keep existing columns/constraints and run_id uniqueness. Add `result_json TEXT` to scores in 0005, storing canonical gameplay fields without nickname for new rows; anonymous legacy matching uses existing columns. For Campaign use separate campaign_scores. Use ON CONFLICT(run_id) DO NOTHING; then read by run ID and compare canonical fields/mode and owner/generation. Anonymous existing Classic IDs can be acknowledged only on the imported legacy-result path; restrict with a consumed guest claim containing the same run ID and payload digest (store `result_digest TEXT` in guest_imports); regular uploads conflict. Same-account repeats return original id/nickname; conflicting records 409. Never catch all unique errors as success.

```sql
INSERT INTO campaign_scores(run_id,player_id,generation,nickname,payload_json)
SELECT ?1,id,generation,nickname,?2 FROM players WHERE id=?3 AND generation=?4
ON CONFLICT(run_id) DO NOTHING;
```

- [ ] Preserve Classic ranking SELECT/era/order, use session owner for authenticated rate-limit keys with native limiter, respect body bound 4096 and validation. Return Retry-After on 429. Update existing tests deliberately for authenticated behavior, preserve all previous structural validation cases. The client compatibility submitScore must send current CSRF token after Task 6; do not erase prior failure visibility.
- [ ] Run focused tests/typecheck, expect PASS; commit Task 4 files `Persist account-owned terminal scores idempotently`.

## Task 5: Persistent account outbox and guest ownership

**Files:** Create src/game/systems/AccountStorage.ts, tests/account-storage.test.ts; modify package.json/package-lock.json to add fake-indexeddb as dev-only test dependency if no installed IndexedDB harness exists.
**Consumes:** AccountRef, PendingResult, GuestClaim, AccountProfile, AccountSession.
**Produces:** `AccountStorage` class with `readCache(ref:AccountRef):Promise<{profile:AccountProfile;session:AccountSession}|null>`, `writeCache(profile:AccountProfile,session:AccountSession):Promise<void>`, `enqueue(record:PendingResult):Promise<void>`, `pending(ref:AccountRef):Promise<PendingResult[]>`, `ack(ref:AccountRef,result:RunResult):Promise<void>`, `markPermanent(ref:AccountRef,result:RunResult,error:string):Promise<void>`, `claimGuest(ref:AccountRef,snapshot:GuestSnapshot):Promise<GuestClaim>`, `consumeGuest(importId:string):Promise<void>`, `purge(ref:AccountRef):Promise<void>`, `readGuestClaim():Promise<GuestClaim|null>`. All methods reject on unavailable durable storage; caller owns memory fallback/warning.

- [ ] Tests pin multiple results and account separation:

```ts
it('keeps every pending run through reload',async () => {
  await storage.enqueue({account:A,result:classic1,status:'pending'});
  await storage.enqueue({account:A,result:classic2,status:'pending'});
  await storage.enqueue({account:B,result:classic1,status:'pending'});
  expect((await reopened.pending(A)).map(x=>x.result.payload.runId).sort()).toEqual([classic1.payload.runId,classic2.payload.runId].sort());
  await reopened.ack(A,classic1);
  expect(await reopened.pending(B)).toHaveLength(1);
});
```

Define A/B AccountRefs, valid result fixtures, storage/reopened instances pointing to same test database, and fake IndexedDB in the test. Add transaction abort/quota, two-tab claim race, consumed-marker preservation after purge, changed record versus old acknowledgement, blocked upgrade, permanent entries, and cache future-version cases.
- [ ] Run `rtk npm test -- tests/account-storage.test.ts`; expect missing implementation.
- [ ] Open IndexedDB `aetherhold-accounts` v1, stores cache/outbox/meta, compound key `[playerId,generation,mode,runId]` for results and `[playerId,generation]` for cache. Claim guest in one read-write meta transaction with key `guest-claim`; bind account and generated UUID import ID before returning, reject another account, never reset consumed marker on purge. Store snapshot with claim so interruption cannot replace it. Resolve only on transaction complete, not request success. Bound opening to 8 seconds; blocked/error produces visible storage failure, no upload of unbound guest snapshot. Outbox writes refuse conflicting immutable payloads; acknowledgement compares current snapshot and only deletes matching record. Do not cap/evict older records. Memory fallback belongs to AccountSystem; guest import requires durable claim.

```ts
const tx = db.transaction('outbox','readwrite');
const store = tx.objectStore('outbox');
const current = await requestValue<PendingResult|undefined>(store.get(key));
if(current && !sameResult(current.result,record.result)) { tx.abort(); throw new Error('Pending result conflict'); }
store.put(record);
await transactionComplete(tx);
```

`requestValue<T>` and `transactionComplete` are private promise helpers in AccountStorage.ts; register completion/error handlers before asynchronous requests to avoid missed completion. Use fake-indexeddb only in tests.
- [ ] Run focused tests/typecheck, expect PASS; commit Task 5 files `Retain account-scoped pending results and import ownership`.

## Task 6: Account lifecycle, save adapters, and sync scheduler

**Files:** Create src/api/accountClient.ts, src/game/systems/AccountSystem.ts, src/game/systems/AccountSync.ts, tests/account-system.test.ts, tests/account-sync.test.ts. Modify progress.ts, UnlockSystem.ts, Settings.ts with explicit account storage adapter entrypoints preserving guest fixtures; ScoreRetry.ts exposes a pure legacy snapshot reader for guestSnapshot.
**Consumes:** Tasks 1-5, existing CampaignRepository(storage), UnlockRepository constructor, local best parsers, device settings, AccountStorage.
**Produces:** `accountSystem` singleton and `AccountSystem` class exposing `view():AccountView`, `initialize():Promise<void>`, `canStartBattle():boolean`, `captureAccount():AccountRef|null`, `refresh():Promise<void>`, `settle(ref:AccountRef,result:RunResult):Promise<void>`, `progressChanged(ref:AccountRef):Promise<void>`, `logout():Promise<void>`, `rename(nickname:string):Promise<ApiResult<AccountProfile>>`, `subscribe(listener:(view:AccountView)=>void):()=>void`. Task 9 adds delete methods. `AccountSync` class `flush(ref:AccountRef):Promise<void>`, `stop():void`. AccountClient methods: `getConfig():Promise<ApiResult<AccountConfig>>`, `getSession():Promise<ApiResult<AccountSession>>`, `getProfile():Promise<ApiResult<AccountProfile>>`, `syncProfile(progress:CloudProgress,csrf:string):Promise<ApiResult<AccountProfile>>`, `importGuest(claim:GuestClaim,csrf:string):Promise<ApiResult<AccountProfile>>`, `uploadResult(result:RunResult,csrf:string):Promise<ApiResult<ScoreAck>>`, `updateNickname(nickname:string,csrf:string):Promise<ApiResult<AccountProfile>>`, `logoutSession(csrf:string):Promise<ApiResult<{loggedOut:true}>>`. Fetch credentials same-origin and 8s abort.

- [ ] Write tests using injected clock/network/storage and real pure projection functions:

```ts
it('blocks new battles at expiry but retains the captured result',async () => {
  await system.initialize(); const ref = system.captureAccount()!;
  clock.advance(30*24*60*60*1000+1);
  expect(system.canStartBattle()).toBe(false);
  await system.settle(ref,finishedRun);
  expect(await storage.pending(ref)).toHaveLength(1);
});
it('does not flush A through B session',async () => {
  await fixture.signIn(A); await system.settle(A,finishedRun);
  await fixture.signIn(B); await sync.flush(A);
  expect(network.uploadsFor(A)).toHaveLength(0);
});
```

Define fixture signIn, clock.advance, network.uploadsFor, system and sync with injectable options in tests; constructor `AccountSystem(options?:{storage?:AccountStorage; now?:()=>number; client?:AccountClient})`, `AccountSync(system:AccountSystem, storage:AccountStorage, client:AccountClient, options?:{now?:()=>number; random?:()=>number})`; AccountClient interface mirrors named exported HTTP methods. Also test initial uncached offline blocks, cached known session offline allows until expiry, definitive 401 locks, protected local bytes, independent ack statuses, fetch timeout, profile refresh between battles, single import acknowledgement, resume on online/focus/menu, jitter/Retry-After, permanent failure, multiple queued runs and memory-only warning.
- [ ] Run `rtk npm test -- tests/account-system.test.ts tests/account-sync.test.ts`; expect missing implementation.
- [ ] initialize first calls getConfig(), then inspects session regardless of rollout flag. A verified Google session always enters `playMode:'account'` after profile/import initialization, even when loginRequired=false, allowing controlled production acceptance through /api/auth/start. Disabled rollout only permits `playMode:'legacy'` for a signed-out browser with no active/cached account or deletion intent; absent OAuth credentials may return 503 without blocking that legacy fallback. Signed-in/expired cached accounts never fall back to guest repositories; use Login to recover. Cache config with an explicit version. On transient offline config failure use a previously cached required=true config; never trust cached false to enable legacy play, and absent/malformed config blocks entry with Retry. Load server profile before new-device account play, otherwise use validated cached last-session metadata only for transient network errors, never after explicit 401/ACCOUNT_DELETED. `canStartBattle()` returns true only for current explicit legacy mode, or account mode with initialized profile and ready/offline state before session expiry. `captureAccount()` returns null only in legacy/blocked mode, and returns the account reference for verified account mode under either rollout value. Account upload hooks skip null; legacy score controls remain available only in playMode=legacy. Add tests proving disabled-rollout signed-out fallback and signed-in account settlement/merge both work, and required rollout never admits legacy. Cache last account ref in IndexedDB meta as convenience only. Durably claim and import guest before selecting account repositories; invalid independent guest components warn while valid components import. Account localStorage keys use playerId+generation prefixes through a getItem/setItem adapter; repository exports stay stable while their active storage is switched at menu/login boundaries. Add `setCampaignAccountStorage(storage:CampaignStorage|null):void`, `setUnlockAccountStorage(storage:Pick<Storage,'getItem'|'setItem'>|null):void`, `setBestAccount(ref:AccountRef|null):void` as explicit seams resetting in-memory state on account switch; preserve QA custom repositories. `applyCloudProgress(progress:CloudProgress):void` merges into active repositories via their validation; `readActiveCloudProgress():CloudProgress` excludes preferences. No unsafe overwrite of protected bytes. Device preparation keys are device-local per account to avoid shared-device preferences granting features. Nickname comes from account, not global Settings.playerName after import.
- [ ] Maintain progressSync independently from resultSync: progressDirty=true whenever active projection gains unsent achievements, progressSync=pending/retrying until canonical server acknowledgement contains that projection; then set acknowledgedRevision and synced only if no later dirty changes remain. resultSync is pending/retrying while outbox has records, permanent if any permanent result, unavailable if persistence fails; empty loaded outbox is synced only after the account's initialization succeeds. Cloud statuses loading/incompatible/unavailable cannot be rendered as synced. Combined status is Synced only if both fields are synced and progressDirty=false. Tests must cover zero pending results with dirty progress, late old revision acknowledgement, accepted score with failed progress upload, and merged progress with a failed score upload, as well as config=false plus missing credentials, unknown config, and offline cached-false rejection.

```ts
const delays = [2000,5000,15000,30000,60000];
const delay = Math.max(reply.retryAfterMs ?? 0, delays[Math.min(failures,4)]*(0.9+random()*0.2));
if(reply.status===401) { await system.refresh(); return; }
if(reply.status===429 || reply.status>=500 || reply.status===0) schedule(delay);
else await storage.markPermanent(ref,record.result,reply.message);
```

- [ ] Use navigator.locks per account+mode+run ID, reread record inside lock before fetch, and compare captured session before request and acknowledgement. Without Web Locks, acquire an expiring lease in an IndexedDB meta transaction, 30s lease with 8s request timeout; ownership token required to release. Server idempotency still handles response loss. Sync progress is a monotonic full projection; save acknowledgement revision plus any unsent changes separately so a late response cannot erase new progress. BroadcastChannel/storage events notify tabs; no tokens in broadcasts. Stop timers on logout, hidden page (resume focus), deletion, shutdown; bound retries and attach listeners once. Import result goes to account queue after successful claim acknowledgement and only once through run-ID uniqueness. Imported anonymous duplicate ack is represented explicitly. Trigger refresh and flush on menu entry via refresh().
- [ ] Run focused tests/typecheck and existing campaign-progress/unlock/score-retry tests, expect PASS; commit Task 6 files `Coordinate account lifecycle and cloud synchronization`.

## Task 7: Capture owners and settle all terminal gameplay paths

**Files:** Modify src/game/scenes/GameScene.ts, GameOverScene.ts, MainMenuScene.ts, DifficultyScene.ts, CampaignScene.ts, LeaderboardScene.ts; create tests/account-gameplay.test.ts. Update tests/score-submission.test.ts, saved-score-ui.test.ts and campaign lifecycle assertions for new behavior.
**Consumes:** AccountSystem captureAccount/canStartBattle/settle/progressChanged, RunResult.
**Produces:** All legitimate terminal results enter the durable outbox automatically; scene start gates and result status reflect account ownership.

- [ ] Write parameterized tests over every outcome/mode plus excluded paths:

```ts
it.each(['classic-defeat','classic-siege-failed','classic-finish','campaign-victory','campaign-defeat','campaign-siege-failed'])('queues %s once',async kind => {
  await gameplayFixture.finish(kind); await gameplayFixture.finish(kind);
  expect(gameplayFixture.queued()).toHaveLength(1);
});
it.each(['restart','quit','debug-assisted','qa-fixture','continue-endless'])('does not queue %s',async action => {
  await gameplayFixture.act(action);
  expect(gameplayFixture.queued()).toHaveLength(0);
});
```

Define gameplayFixture in the test using existing GameScene test harness patterns and injected accountSystem spy that captures actual payloads; add logout/switch while battle settles, expiry Restart/Next Level rejection, first Classic branch earning event, and public Campaign leaderboard exclusion.
- [ ] Run `rtk npm test -- tests/account-gameplay.test.ts tests/score-submission.test.ts`; expect existing manual-only settlement failing new assertions.
- [ ] At GameScene.create battle initialization, guard canStartBattle and capture AccountRef; redirect Login if blocked before any playable state. Generate current runId once as before. Attach captures to finishRun and finishCampaign, preserving existing single terminal guards and progression award checks. Classic creates existing GameResultPayload; Campaign creates CampaignResultPayload from actual configured level/outcome/score/lives/duration. Call settle once after local progression updates, without awaiting network in rendering. Call progressChanged on Classic unlock earning. Never submit assisted/fixture battles, never reward failed Campaign clears.

```ts
const owner = this.runAccount;
if(owner && !this.debugAssisted && !this.qaCampaignFixture) {
  void accountSystem.settle(owner,{mode:'campaign',payload:{
    runId:this.runId,campaignVersion:CAMPAIGN_VERSION,progressionVersion:PROGRESSION_VERSION,
    level:campaign.definition.level,outcome,finalScore:score,remainingLives:this.lives,
    gameDurationSeconds:Math.floor(this.runningDurationMs/1000),gameVersion:GAME_VERSION
  }});
}
```

Use existing runningDurationMs, matching Classic duration. `runAccount:AccountRef|null` is the captured member. Result panels subscribe to account view/pending record changes and distinguish local save versus cloud ack. In playMode=account replace Submit Score controls and manual retry callers in GameOver/MainMenu/Leaderboard with queued count, automatic retry status, and explicit permanent-error details under either rollout value; retain legacy submission controls only in playMode=legacy, and preserve legacy parser/protected-byte tests. Add guard in Difficulty/Campaign create and every GameScene restart/replay/next-level path; central GameScene guard catches deep entry. Cross-tab account switch allows captured active battle to finish, then returns Login; same-tab explicit logout/switch uses existing Quit discard semantics. Result panels never offer expired new battle entry.
- [ ] Run targeted tests/typecheck and existing Campaign/Classic independent lifecycle suites, expect PASS; commit explicit Task 7 files `Automatically retain and upload terminal game results`.

## Task 8: Login and account controls

**Files:** Create src/game/scenes/LoginScene.ts, tests/account-ui.test.ts; modify src/main.ts, BootScene.ts, MainMenuScene.ts, SettingsScene.ts, DifficultyScene.ts, CampaignScene.ts, GameOverScene.ts.
**Consumes:** AccountView and AccountSystem lifecycle/rename/logout, existing button/panel/ScrollSheet/layout helpers.
**Produces:** Login screen and responsive account controls; signed-in nickname/status replaces guest naming UI.

- [ ] Write UI state assertions:

```ts
it.each(['signed-out','loading','expired','error'])('blocks play for %s',state => {
  const view = accountUiFixture.render(state);
  expect(view.playEnabled).toBe(false);
  expect(view.loginActionVisible).toBe(state!=='loading');
});
it('distinguishes pending from synced',() => {
  expect(accountUiFixture.status({pending:2,progressSync:'synced',resultSync:'pending',progressDirty:false})).toContain('Pending sync');
  expect(accountUiFixture.status({pending:0,progressSync:'pending',resultSync:'synced',progressDirty:true})).toContain('Pending sync');
  expect(accountUiFixture.status({pending:0,progressSync:'synced',resultSync:'synced',progressDirty:false})).toContain('Synced');
});
```

Define accountUiFixture using existing scene harness and actual view rendering functions, not copied implementation formulas; assert accessible keyboard activation/focus, storage warning, nickname errors, compact layouts, permanent error copy, and logout cleanup.
- [ ] Run `rtk npm test -- tests/account-ui.test.ts`; expect absent UI failing.
- [ ] Register LoginScene. Boot/Preload sends to Login until initialize completes; redirect to MainMenu only after ready/offline admissible cache. Login button navigates same-origin /api/auth/start; fixed callback returns root with a bounded reason code, never raw provider error. Keep imagery consistent with existing menu. Account header displays nickname, account controls, and Sync/Pending/Session expired/Storage unavailable states. Settings validates nickname with existing rules and PATCH; failed rename leaves prior name. Logout invokes server revocation, and clears active in-memory account access; network-failed logout clears local play access and retains token revocation pending so startup cannot silently restore it. Switch account uses logout plus account-selector Google login. If revocation is pending, no fresh auto-login until server confirms logout; offer retry. A forced account-selector parameter is server-controlled, no arbitrary OAuth redirect parameters.

```ts
const unsubscribe = accountSystem.subscribe(view => this.renderAccountState(view));
this.events.once(Phaser.Scenes.Events.SHUTDOWN,unsubscribe);
```

- [ ] Implement keyboard/focus/labels with existing house control patterns; DOM login/nickname/deletion controls where Phaser cannot expose accessibility semantics. Resize must preserve nickname input and not repeat imports. Disable actions while in flight; listener cleanup on shutdown. Keep public leaderboard readable on login screen via existing scene if desired, but no play entry bypass. Disabled rollout permits guest compatibility and a verified Google session enters full account mode for acceptance; enabled rollout admits account mode only. Visiting /api/auth/start is the controlled acceptance entry, never a client-only bypass. Do not add an end-user rollout toggle.
- [ ] Run targeted tests/typecheck; manually check desktop and mobile widths and keyboard-only login/nickname/logout using browser tools once app exists, expect no clipped controls and no unreachable actions; commit Task 8 files `Add login and responsive account controls`.

## Task 9: Confirmed deletion with fresh Google reauthentication

**Files:** Modify worker/accounts.ts, worker/auth.ts, AccountSystem.ts, AccountStorage.ts, SettingsScene.ts; create tests/account-deletion.test.ts.
**Consumes:** same-identity delete-purpose OAuth, AccountRef generations, schema cascades and guest marker rules.
**Produces:** POST /api/account/delete with body `{ confirm:true }`, ApiResult<{deleted:true}>; AccountSystem `beginDelete():void`, `deleteAccount():Promise<ApiResult<{deleted:true}>>`. AccountSession.canDelete is derived from the server's verified Google auth_time in reauthenticated_at; do not trust a client timestamp or fresh token issuance time.

- [ ] Write server/client race tests:

```ts
it('cannot resurrect deleted generation with late uploads',async () => {
  const old = await deletionFixture.currentAccount();
  await deletionFixture.reauthenticate(old);
  expect((await deletionFixture.delete(old)).ok).toBe(true);
  expect((await deletionFixture.upload(old)).code).toBe('ACCOUNT_DELETED');
  const fresh = await deletionFixture.loginAgain();
  expect(fresh.playerId).not.toBe(old.playerId);
  expect((await deletionFixture.profile(fresh)).progress.levels).toEqual({});
});
```

Define deletionFixture backed by actual local D1 sessions/OAuth fixture. Cover confirmation=false, >5min reauth, different Google identity, cancel, batch constraint failure, response lost then status reconciliation, concurrent merge, stale devices, consumed guest bytes, and local purge failures.
- [ ] Run `rtk npm test -- tests/account-deletion.test.ts`; expect missing endpoint.
- [ ] Settings deletion flow shows consequences, records a durable deletion-intent marker, stops uploads, performs same-identity reauth, then explicit confirmation sends delete with CSRF. Worker atomically verifies session/generation and fresh reauth within SQL batch; delete via `DELETE FROM players WHERE id=? AND generation=? AND EXISTS(SELECT 1 FROM sessions WHERE token_hash=? AND reauthenticated_at>=?) RETURNING id`. Cascades remove sessions and owned Classic/Campaign scores. Before deletion null guest_imports owner/generation and set consumed=1; guard updates by same fresh session predicate. Clear nickname/progress/identity with player row; never delete anonymous scores. `oauth_attempts` matching deleted account are deleted in batch. Foreign-key constraints guard writes racing deletion.
- [ ] Distinguish ACCOUNT_DELETED from ordinary AUTH_REQUIRED using a signed non-secret account-generation cookie or session-hash tombstone table. Chosen minimal mechanism: `revoked_sessions(token_hash TEXT PRIMARY KEY, reason TEXT CHECK(reason IN('deleted')), expires_at INTEGER NOT NULL)` in 0005; populate hashes of deleted account sessions atomically before cascade, no provider/player IDs retained. requireSession null plus tombstone lookup returns deleted. Expire tombstones after original session expiry. This lets stale devices purge exact cached account; expired old tokens never permit upload and new accounts have new IDs.
- [ ] On successful/confirmed deleted status purge account cache/outbox/preparation/profile keys, preserve consumed guest claim, broadcast deletion for same generation, return Login. Storage purge failures remain visible and retry; fresh IDs prevent reuse. Unknown deletion response: remain deleting with durable intent; inspect session/tombstone before retries; authenticated still-existing account permits retry delete after reauth if needed; never resume uploads until resolved. Login to another account does not cancel/delete intent for the old generation or upload its records.
- [ ] Run tests/typecheck plus D1 deletion race cases, expect PASS; commit Task 9 files `Delete cloud accounts safely after Google reauthentication`.

## Task 10: Integrated acceptance, OAuth provisioning, production release

**Files:** Create tests/account-integration.test.ts; update docs/GOOGLE_LOGIN_SETUP.md, docs/superpowers/specs/2026-10-11-google-login-cloud-progress-design.md and this plan with verified outcomes; modify wrangler.toml rollout variable only after checks.
**Consumes:** All preceding APIs and scenes.
**Produces:** Feature verified in two independent browser contexts and deployed, or a precise documented credential/access blocker with login still disabled.

- [ ] Run full suite and build before external activation: `rtk npm test`, `rtk npm run build`. Account integration test starts a local Worker using separate D1 persistence and test issuer only in test harness; production issuer remains fixed Google. Test actual HTTP session/profile/import/result/delete paths, not mocked SQL text.

```ts
it('syncs two clients and preserves separate device preparation',async () => {
  const a = await integration.client('A'), b = await integration.client('B');
  await a.loginSameGoogleAccount(); await b.loginSameGoogleAccount();
  await a.earnLevel(1); await b.earnClassicUnlock();
  await Promise.all([a.flush(),b.flush()]);
  await a.refresh(); await b.refresh();
  expect(a.progress()).toEqual(b.progress());
  expect(a.preparation()).not.toEqual(b.preparation());
});
```

Define integration harness in tests/account-integration.test.ts with actual local Worker, two cookie jars, real local D1, signed test OIDC tokens, isolated local browser adapters, explicit differently seeded preparation, and deterministic valid earn projections. Include response loss, score dedupe/nickname, import interrupted, ACCOUNT_DELETED reconciliation, and stale generation rejection. These tests do not replace real Google acceptance.
- [ ] Provision Google configuration using the documented owner workflow. Discover existing config names without printing secrets. If owner interaction/credentials are missing, ask for that setup (never request secret text in chat), continue local checks, and report activation blocked. Do not claim live Google success or enable mandatory login until real sign-in, callback, logout, and fresh same-identity reauth succeed.
- [ ] Verify registered origin equals deployed Worker/custom domain and callback `${APP_ORIGIN}/api/auth/callback`. Apply additive migrations remotely with `rtk npm run db:migrate:remote` only after local migration and anonymous-row preservation checks. Publish feature with ACCOUNT_LOGIN_REQUIRED=0 temporarily using `rtk npm run deploy`; all account APIs still enforce sessions. Enter /api/auth/start in two controlled browser contexts and verify playMode=account after actual Google callback; both exercise automatic settlement/import/sync/deletion despite disabled global enforcement. Signed-out browsers retain guest compatibility during this acceptance window. Inspect cookie attributes via supported tools without outputting token values. Clear pending test results/account after deletion acceptance.
- [ ] Perform desktop/mobile/keyboard acceptance: mandatory-login view, actual Google callback, import, two device progress merge, several offline completed runs and reconnection, expiry, switching, nickname, independent score/progress statuses, logout, deletion/fresh account. Use controlled test account records; no fabricated real leaderboard scores. For scripted results use local/test deployment only.
- [ ] Set ACCOUNT_LOGIN_REQUIRED=1 only after OAuth acceptance; repeat `rtk npm run deploy` (tests and build precede publication). Check live HTML is current, extract the referenced /assets/*.js path and fetch it, and GET /api/health returns ok:true. Check anonymous /api/account and score writes fail, current script enables required login, public Classic leaderboard remains valid.
- [ ] If failed activation, restore ACCOUNT_LOGIN_REQUIRED=0 and redeploy verified compatibility behavior; retain additive schema, do not drop users/scores. Report exact failure and live URL. Never disable security validation to pass release.
- [ ] Update docs with actual credentials setup state (names only), migration status, live URL/bundle, test outputs, and any unresolved limitations. `rtk git diff --check`; commit only feature files, `rtk git push origin main` if still on main (otherwise current branch), compare `rtk git rev-parse HEAD` with `rtk git ls-remote origin refs/heads/<current-branch>`.

## Plan review record

Cold review completed in three rounds: 7/10 with three contract blockers, 8/10 with one release-order blocker, then 9/10 with zero blockers and zero advisory findings. All nine spec acceptance requirements map to tasks. No application code or dependencies have been changed during planning. Awaiting user plan review and execution-method selection.

## Source references

- oauth4webapi runtime support: https://github.com/panva/oauth4webapi
- OIDC example/signatures (verify installed version during Task 2): https://github.com/panva/oauth4webapi/blob/main/examples/oidc.ts
- D1 batch transaction semantics: https://developers.cloudflare.com/d1/worker-api/d1-database/
- Google supported parameters and auth_time: https://developers.google.com/identity/openid-connect/reference
