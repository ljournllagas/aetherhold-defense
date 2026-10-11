# Google login and cloud progress

Date: 2026-10-11. Tier: Full. Status: independently reviewed; awaiting user approval.

Review: round 1 scored 8/10 with one nickname-timing blocker; clarified first-server-acceptance semantics. Round 2 scored 9/10 with zero blockers and zero advisory findings.

## Purpose and agreed scope

Require Google login before playing and retain completed Campaign progress, Classic branch achievements, personal bests, and finished-run scores across devices. Automatically claim existing guest saves once per browser save. Automatically upload terminal results and retry failures. Keep unfinished battles, audio, speed, difficulty preference, specialization choices, targeting preferences, and preparation presets local. Provide logout, account switching, editable public nickname, and account deletion. Anti-cheat, other identity providers, passwords, battle snapshots, and historical anonymous-score attribution are excluded.

## Approach and existing boundaries

Recommended: Google OpenID Connect authorization-code flow through the existing same-origin Cloudflare Worker; D1 stores player accounts, sessions, cloud achievements, and score ownership. Google proves identity; the game owns sessions and saves. A managed identity service adds an external provider without a current requirement; a general authentication framework is an alternative if multiple providers become necessary. Use maintained protocol/verification libraries compatible with Workers rather than inventing token verification.

Existing boundaries: worker/index.ts and wrangler.toml provide the API and D1 binding; migrations/ defines score storage. src/game/campaign/progress.ts validates, merges, and persists CampaignProfile, including device preferences. Settings.ts stores nickname and score-era personal bests; UnlockSystem.ts stores Classic achievements. ScoreRetry.ts currently retains one manually submitted result, insufficient for automatic uploads of multiple results. GameScene.finishCampaign and Classic terminal handling are separate; both must integrate. Boot, MainMenu, Difficulty, Campaign, GameOver, Leaderboard, and Settings flows must observe account state. Shared validation and current UI components remain authoritative. Development fixtures remain isolated from real accounts and production APIs.

## Identity and sessions

Create an internal unpredictable player ID linked uniquely to Google's issuer and stable sub, never email as an ownership key. Store only the Google identity key and nickname needed by this feature; do not publish email, provider ID, cookies, or tokens. Use the existing nickname normalizer and validator, maximum 20 code units; default Warden when no valid imported nickname exists. Duplicate nicknames are allowed. A result's public nickname is fixed at its first successful server acceptance using the account's nickname at that moment. This includes offline results finished before a nickname change. Accepted scores never change nickname; retries after a lost acknowledgement return the original accepted record. Duplicate matching compares immutable gameplay fields and ownership, excluding nickname, which the server supplies.

Worker routes cover login start, callback, session inspection, logout, profile synchronization, nickname update, score upload, and account deletion. All account reads and writes derive identity exclusively from a validated server session, never a supplied player ID. Protect mutations with same-origin checks and CSRF protection; return private no-store responses. Login callback validates one-use state, PKCE, nonce, token signature, issuer, audience, and expiry. Allow only configured callback and return destinations. OAuth attempts expire after ten minutes. Secrets stay in Worker secrets; use exact production and development callback registrations.

Issue opaque high-entropy session tokens, store only token hashes server-side, and use Secure, HttpOnly, SameSite=Lax host-only cookies. Session lifetime is 30 days, without silent extension; logout revokes the current session. Expired/revoked sessions return an explicit authentication-required response, never fall back to guest access. Login cancellation and provider/API failures return to a retryable login screen without importing, erasing, or exposing saves.

Authenticated account data must load successfully before the first battle on a new device. A cached account with a previously verified session may start battles during connectivity loss until its locally known expiry. On reconnect, server rejection overrides the cache. A known expired session blocks new battles, including Restart, Replay, Next Level, and Classic entry; a battle already running may finish and retain its original account's results. Initial offline visits cannot authenticate or load an uncached game; this feature does not add service-worker asset caching.

## Account isolation and local persistence

Every cached account profile and queued result is namespaced by internal player ID and account generation. A run captures that identity at start. Logout and account switching return to login/menu and discard an unfinished run, following existing Quit semantics; they never assign its results to another account. Pending uploads survive ordinary logout and can resume only after the same account authenticates. Cross-tab account changes stop new battle entry; an active battle may finish for its captured account but cannot upload through a different account's session. Device preparation state must not grant access to locked features in the selected account.

Display login/loading, signed in, locally saved/pending sync, synced, session expired, retrying, permanent upload error, incompatible save, and storage unavailable distinctly. Synced means server acknowledgement of the relevant revision/result. Show local persistence failure distinctly from network failure; keep session-memory progress where possible without claiming durable storage. Never overwrite malformed or newer-version bytes.

## One-time guest import

On the first successful sign-in on each browser installation, snapshot compatible existing Campaign achievements, Classic unlocks, current and supported legacy personal bests, nickname, and the existing saved submission. Import into the authenticated account, even when it already has progress from another device. Existing nickname is used only when creating an account, not to overwrite an established nickname. Unsupported/malformed portions remain untouched and show an import warning; valid independent portions may import.

Assign a stable browser-import ID and bind it to the first authenticated account locally before any upload. D1 records the claim and imported projection atomically; repeat requests return the same acknowledgement. A lost response or interrupted import retries for the same account. Other accounts cannot claim that browser snapshot. Local binding failure prevents import and warns; it must not upload without a durable ownership marker. Retain source bytes until acknowledgement; subsequently mark them consumed so account switches and recreation cannot re-import them. Browser markers cannot survive the user clearing storage; this limitation is explicit and is not an anti-cheat guarantee.

The old saved submission imports only if compatible and complete. An already-stored anonymous run stays anonymous: acknowledge its existing run ID without assigning ownership. A local personal best lacks a full result payload and imports privately, never creates a public leaderboard entry. Historic anonymous leaderboard rows remain unchanged. Supported legacy score eras retain their era and never enter current-era rankings.

## Cloud progress and merging

Cloud projection includes versioned Campaign level achievement flags, per-level best score and best remaining lives, Classic branch achievement IDs, and personal-best records by score era. Union achievement flags and unlock IDs; take maxima for score and lives independently, without implying they came from one run. Derive Campaign access, total stars, sigils, and feature unlocks from validated level achievements and current configuration; client-provided derived access never grants privileges. Personal-best ties preserve the existing record. Version mismatches produce explicit protected/incompatible state rather than resetting progress.

Server validates bounds, configured IDs, achievement consistency, and supported versions. Merge writes atomically using database operations or revision-checked retries so simultaneous devices cannot lose achievements. Stale uploads may add valid achievements but cannot regress them. Return the canonical merged projection and revision; client merges it with unsent local achievements. Never include device preparation fields in the cloud projection or erase those fields when applying the projection.

Sync after initial account load/import, battle settlement, achievement earning, and reconnect; refresh on menu return and page focus when connected. Cloud updates apply between battles, without changing an active battle's loadout or configuration. Use the same retry policy as results. Successful campaign clears earn progression; failed campaign battles upload scores but do not grant completion achievements.

## Automatic scores and retry

Queue every eligible terminal result before its first network attempt, bound to the captured account and stable run ID. Classic retains existing defeat, siege failure, Finish Run, and endless rules; Restart/Quit never submit. Campaign uses its existing single settlement guard, with victory/defeat/siege failure results and a campaign level identifier. Keep Campaign results in a separate score collection and account history, outside the existing Classic leaderboard; new Campaign rankings are out of scope. Debug-assisted results and QA fixtures never upload.

Preserve the existing Classic score validation, score eras, rate limits, and ranking order. Campaign gets its own bounded validation based on campaign configuration, rather than bypassing Classic constraints. Server derives owner and nickname from the session. Per-mode run-ID uniqueness prevents duplicates; matching repeated results return success, conflicting payloads or another owner's run ID do not. Cloud progress and score uploads can acknowledge independently and must display their status independently.

Replace the one-record retry limitation with a persistent account-scoped outbox that cannot evict older pending results when another run finishes. Storage exhaustion warns visibly and retains what is possible in memory; no claimed durable guarantee. Retry immediately when online, then after approximately 2, 5, 15, 30, and 60 seconds, capped at 60 seconds with jitter while the page is open. Respect Retry-After for 429. Reconnect, login, menu return, and focus resume retry; only one in-flight request per queued record across tabs. Network errors, timeout, 429, and 5xx retry; 401 waits for same-account login; incompatible/invalid/conflicting results remain visible without endless automatic retry. Do not retry in a closed page. On response loss, retry the same run ID. Remove a queued record only after acknowledgement and only if it still matches the acknowledged snapshot.

## Deletion

Account deletion is available from account settings, explains deletion of cloud progress and account-owned scores, requires explicit confirmation, and requires a successful forced Google reauthentication within five minutes for the exact existing identity. Switching Google identity cannot authorize deletion. Cancellation or reauth failure changes nothing.

Deletion atomically removes account-owned scores, cloud profile, nickname, provider link, and all sessions; invalidate the account generation so stale uploads cannot recreate it. Preserve only minimal non-identifying import-consumed markers needed to prevent guest-save resurrection. Return to login and purge that account's local cache and outbox in the deleting browser. Other devices purge on the next definitive account-deleted response; while offline they may hold stale data, but it can never sync into a recreated account. A later Google login creates a fresh player ID; old caches and consumed guest saves are not imported. Failed or ambiguous deletion shows pending/error state and resolves server status before resuming upload, without prematurely erasing local data.

## Verification and release acceptance

1. Logged-out direct scene entry and all battle-start paths are blocked; cancellation and failed callback retain guest bytes. No production bypass exists.
2. Verify OAuth forgery, replay, wrong issuer/audience/nonce, expired token/state, CSRF, and cross-account read/write rejection. Cookie attributes and no-store headers are checked.
3. Two-device tests show union of stars/unlocks and maxima of bests under concurrent uploads and lost acknowledgements; preferences remain local. Invalid/newer data stays protected.
4. Import tests cover new/existing accounts, multiple devices, account switching, interrupted import, storage failure, partial incompatible input, old best-only data, and anonymous duplicate run IDs.
5. Finish multiple Classic and Campaign runs offline, reload, reconnect, and verify all durable queued results arrive exactly once. Cover duplicate/conflicting requests, 429, 5xx, permanent errors, tab races, expiry, logout, and wrong-account retries.
6. Confirm all terminal outcomes and endless semantics; Restart/Quit and assisted fixtures never submit. Campaign scores never contaminate Classic rankings.
7. Deletion tests cover recent reauth, wrong identity, cancellation, partial failure, response loss, all-session revocation, concurrent writes, stale offline devices, and fresh account creation without resurrecting data.
8. Responsive keyboard/touch login, nickname, sync status, logout, and deletion flows use accessible existing controls. Public responses disclose no identity secrets.
9. Before publication, test Google login and logout with configured credentials and exact production callback on a controlled route, then full tests/build and D1 migration checks. Do not enable mandatory login without working OAuth configuration. No irreversible changes to historical anonymous scores. Follow repository deployment command and verify live page, current bundle, and /api/health; commit/push verified changes and check remote HEAD.

## Operational dependencies and limits

Implementation requires the owner's Google OAuth client configuration and Worker secrets; these have not been provisioned or tested by this spec. Keep account data out of logs. D1 is already bound; new additive migrations must preserve existing score rows. Implementation planning must specify the atomic merge/deletion and import/outbox mechanisms and their tests before execution. This documentation change does not deploy the application.

Official protocol reference: https://developers.google.com/identity/openid-connect/openid-connect
Cloudflare D1 integration reference: https://developers.cloudflare.com/workers/databases/connecting-to-databases/
