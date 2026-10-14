# Campaign scoring, public rankings, and guest entry

Date: 2026-10-14 (Asia/Manila)
Tier: Full. Design awaiting written-spec approval; application implementation has not started.

## Intent and agreed scope

Players must see who is leading Campaign separately from Classic, understand how to earn high mission scores, and enter guest play without a disconnected name/action pair. Campaign publishes one row per Google-linked player account, ordered by distinct missions completed, then retained mastery stars, then total current-era mission bests. Guest players can view public rankings but contribute only after signing in and successfully importing browser-local progress. Account publication is automatic on successful progress synchronization or guest import.

All 100 currently defined missions are in scope. Preserve previous completions, stars, unlocks, preparations, and legacy scores. New score totals start at zero; replays establish current-era bests. Keep Classic scoring, difficulty filters, rankings, submission behavior, score era, and personal bests unchanged.

Guest entry order is in-game name, Play as Guest, a small “or” separator, then Sign in with Google. Remove Retry connection. The signed-in account-management screen in the attached screenshot stays unchanged, including nickname editing, sign-out, and deletion controls.

## Existing behavior and design choice

`GameScene` currently uses `ScoreSystem.calculateScore` for both modes, including Classic's difficulty multiplier and unused-gold bonus. Campaign progression stores `bestScore` and three sticky star flags. Account campaign terminal results are stored separately in `campaign_scores`, but public `/api/leaderboard` lists Classic records only. Guest campaign settlement retains per-level progress and no campaign result in the guest snapshot. Cloud progress merges per-level achievements and bests with OR/max and uses account-generation ownership, revision retries, and once-only guest imports.

Three options were considered:

1. **Recommended: independent Campaign formula, per-level current bests in existing progress, and public aggregation of acknowledged account progress.** This includes imported guests' bests even though guest snapshots do not retain every terminal result; preserves all achievements; avoids a second source of ranking truth.
2. Separate the leaderboard while retaining Classic's formula. Smaller, but does not satisfy the approved mission-specific scoring goal or remove gold/difficulty incentives.
3. Build ranks solely from campaign terminal-result history. Requires a new durable guest result ledger and synchronization rules to include all guest mission bests; more state than this feature needs.

Use the existing layers and synchronization protocol. A pure Campaign scoring module is shared by the browser and Worker, with deterministic, platform-independent mission scoring metadata. Do not import Phaser or browser storage into Worker scoring validation. Reuse the battle's scheduled wave composition rather than maintaining a second roster/count algorithm; make that deterministic metadata available through a small shared boundary if required. This spec defines behavior; the reviewed implementation plan will assign exact files and ordering.

## Campaign score era 1 and formula

Introduce `CAMPAIGN_SCORE_VERSION = 1`, independent of Classic `SCORE_VERSION`, campaign content version, and progression version. Campaign continues its intended medium battle tuning: twenty starting/maximum lives and default enemy-count multiplier one. A ranked Campaign battle cannot select Classic easy/hard modifiers. Changing point weights or scoring-relevant wave metadata in future requires a new Campaign score era; this release does not alter enemies, wave composition, or combat tuning.

For a settled mission:

| Component | Points |
| --- | --- |
| Scheduled wave enemies defeated | 10 each |
| Waves fully completed | 100 each |
| Scheduled mission boss defeated | 500, once, on a boss mission |
| Lives remaining at settlement | 50 each, from 0 through 20 |

`finalScore = 10 * scheduledEnemiesKilled + 100 * wavesCompleted + 500 * missionBossesKilled + 50 * remainingLives`.

The scheduled boss receives both its ordinary 10 kill points and its 500 boss bonus. Elite enemies have no additional bonus. Gold, time, pause duration, game speed, tower spending, and Classic difficulty multipliers award no points. Lives restored by existing relics count as remaining lives; there is no cumulative healing score.

Track scheduled enemy eligibility by spawn origin, not enemy type: all enemies originating in the mission's authored wave queue qualify, and all boss-created adds, clones, decoys, support spawns, and their descendants do not. Each actual scheduled enemy can award points once; escaped, despawned, or cleaned-up enemies award none. Existing bounty, relic, combat kill counters, and boss mechanics retain their behavior. The boss bonus recognizes only the authored mission boss, not clones that share its appearance/type.

The live HUD score contains the first three earned components only. Before combat it is zero. The remaining-lives bonus is added once on settlement and appears in the results breakdown. Restart and Quit are discarded runs and produce no saved result, best, star, or public update. Defeat and siege failure may display a final score and retain the existing account terminal-result acknowledgment, but cannot improve mission progress, stars, current bests, or public totals. Assisted/debug/QA runs retain the existing exclusion from durable awards and uploads.

For each mission, derive `N` as its number of scheduled enemies across all waves, `W` as its scheduled wave count, and `B` as one when it has an authored boss, otherwise zero. Define `perfectScore = 10*N + 100*W + 500*B + 1000`. The new score-star target is `ceil(0.9 * perfectScore / 10) * 10`. This gives each mission its own explicit target at roughly 90% of its best achievable scheduled performance. A victory with `finalScore >= target` earns the score star. Completion and lives stars retain their existing conditions. Stars remain sticky across separate winning runs; a player need not earn every star in one run.

Retain the old authored `mastery.scoreTarget` values as legacy evidence only. Every active score-star label and check uses the new derived target. For all 100 missions, automated checks must prove the target is positive, no larger than the perfect score, achieved by a perfect clear, and rejected at target minus one for a player who has not previously earned the score star. At least one attainable imperfect-clear example per world must illustrate the threshold. These are mathematical reachability checks, not proof that every mission is easy to clear through real combat.

## Make high-score goals visible

Mission selection/briefing shows the current-era mission best, the exact score-star target, and a concise rule: “Defeat wave enemies, clear waves, defeat the mission boss, and preserve lives. Summoned enemies give no score. Gold and time do not affect points.” Include the four point weights in the mission's existing scrollable details. Boss bonus is shown as zero/not applicable on ordinary missions.

The HUD labels its number as earned combat score and makes the settlement lives bonus understandable through existing help/details. Results show each component's count and points, final score, target reached/missed, current mission best, and any newly earned stars. Previously retained stars are clearly identified as retained; they need not be earned again. For failure, show “Winning clears contribute to your campaign ranking” and no best improvement. A legacy best, when nonzero, is shown separately with “Legacy score — excluded from current total”; never present it as the current best. When a legacy-only mission is selected, show current best as “Not scored yet” and explain replaying establishes a new score.

Reuse existing scroll sheets, number formatting, colors, and button components. Mission details, results, and leaderboard must fit desktop, tablet, portrait phone, and landscape phone, preserving reachable primary actions and readable wrapping.

## Progress representation, migration, and validation

Extend each `CampaignLevelProgress` with an optional `campaignScore: { version: 1; bestScore: number }`. Its absence means no current-era mission best. Existing `bestScore` remains the legacy Classic-formula Campaign best, never a source of current-era total score. New-formula clears update only `campaignScore.bestScore`; do not copy their scores into legacy `bestScore`. For new missions, legacy `bestScore` starts at zero. Keep `bestRemainingLives` and sticky achievement flags.

This additive representation avoids overwriting old scores and allows a legacy-only entry to retain its score star without pretending its new best reached the new target. Validators accept a score star only when supported by either the legacy best against the old authored target or a supported current-era best against the new derived target. Completion and lives-star invariants remain enforced. A current-era best is a safe integer, strictly positive, bounded by this mission's perfect score, and belongs only to a completed mission; absence is distinct from zero. Unknown scoring versions or fields in an individual save make the affected save incompatible, with its raw stored data preserved under the existing protection behavior. Do not silently discard unknown versions, reset progress, or overwrite unreadable saves.

Existing local profile/cloud versions and storage keys remain intact. Update their explicit allowed-field checks, cloning, equality checks, progression derivation, serialization, and guest snapshot validation for the optional field. Merge legacy `bestScore` by max independently from current-era best by max, and flags by OR; deep-copy the new nested value. Missing fields in an old client submission cannot erase newer fields. Legacy numeric bests are never converted or estimated into the new era. Existing saved local/cloud JSON and claimed guest batches remain readable without modification of historical import IDs or ownership.

Read-only profile reads and leaderboard reads normalize missing current scores to zero contribution without requiring a player to replay or sign in again. Old accounts with completed missions are eligible immediately with retained mission/star totals and a current score total of zero. Persisting a normalized shape occurs only on an existing authorized save/sync path. Existing legacy campaign terminal payloads in pending account uploads or guest import snapshots remain accepted under their existing validation and canonical run-ID identity; they never create a current-era best. Keep existing historical `campaign_scores.payload_json` rows intact.

Current-era campaign terminal payloads add a distinct campaign score version and the three combat component counters to the existing fields. Validate integer counts, per-mission scheduled bounds, boss identity/count constraints, outcome/lives consistency, and exact score recalculation. Victory requires all scheduled waves completed and the authored boss defeated when present. Validate counted kills against scheduled enemies available by the stated wave progress, allowing the current unfinished wave for failure. Reject unknown versions, extra fields, negative/fractional/nonfinite counts, impossible counts, or mismatched final scores before writes. Accept unversioned legacy payloads only as legacy; do not infer a new version from score size. Canonicalization and duplicate detection retain every scoring field, preserving identical retry acknowledgments and rejecting conflicting run IDs.

Guests continue to store campaign mission bests in their progress snapshots without a new all-results ledger. Importing any number of mission bests updates public totals once using existing OR/max merging. Account switching, delayed sync, retry, deleted/re-created accounts, and concurrent devices keep existing account-generation isolation and import ownership. Failed persistence retains a session-only warning; failed sync keeps pending state visible and does not claim publication succeeded.

Old browser bundles may reject the additive fields through their older strict validators. The new server must preserve current-era fields when receiving legacy progress, and old pending payloads stay valid. Reloading the application obtains the compatible client. Do not solve this by dropping new fields or weakening validation; verify stale-client writes cannot erase scores or achievements. Future incompatible saves retain the existing session-only/protected behavior.

## Public Campaign leaderboard

Add an unauthenticated GET `/api/campaign-leaderboard?limit=20`, distinct from Classic `/api/leaderboard`. Default limit 20; accept only decimal integer limits from 1 through 100, otherwise return a clear 400 error. No world, difficulty, seasonal, or score-era selection in this release.

Response identifies `campaignScoreVersion`, `missionCount` (currently 100), and `starCount` (currently 300), plus an ordered `scores` list. Each row contains only opaque game player ID, current public nickname, `missionsCompleted`, `totalStars`, and `totalScore`. No Google subject/email, account generation, session data, raw save, or terminal-result payload is public. Rows with at least one completed mission qualify; account creation alone does not publish a zero-progress row. Renaming immediately uses the current account nickname; deleting the account removes the row; re-creation starts a distinct entry.

Derive rows from acknowledged, valid account progress, not client-supplied aggregate totals and not sums over all `campaign_scores` runs. Count each defined completed mission once. Sum each earned completion/lives/score flag once, including retained legacy stars. Sum only supported current-era bests once per mission. Aggregate for all eligible accounts before ordering and limiting; do not limit source profiles before ranking. Use D1-side aggregation over the existing profile data rather than an application-side full-account scan or a separately synchronized ranking table. Invalid/unreadable/future-version profiles are excluded intact, never partially reinterpreted. Guard malformed JSON and unsupported per-level score versions before aggregation. The implementation must produce the same aggregates and validation outcome as the shared progress rules.

Order by missions descending, stars descending, score descending, then opaque player ID ascending for deterministic exact ties. Assign sequential displayed rank positions; exact ties use the same deterministic ordering rather than shared rank numbers. No time bonus or achieved-at tie rule. Preserve the existing top-list size convention; a player's row is highlighted only if present in the returned list. Global “my rank” lookup, pagination, searchable nicknames, and filters are outside this release.

Use `Cache-Control: no-store` for the new endpoint so successfully acknowledged progress, rename, and deletion appear on the next successful fetch. Database/query failure returns an explicit server error, never a successful empty list. Empty valid ranking, loading, offline/error, and successful populated ranking are distinct UI states. Validate the response on the client, including era, bounds, unique IDs, aggregate bounds (`missions <= missionCount`, `stars <= 3*missions`, `totalScore` bounded by the sum of all mission perfect scores), and ranking order. Bad responses enter the error state, not a misleading empty state.

Reuse `LeaderboardScene` with Classic/Campaign tabs. Entry from the main menu defaults to Classic; entering through a Campaign leaderboard action on the world map defaults to Campaign. Switching tabs starts the correct query and prevents a late result for one tab from overwriting the other. Classic retains its filters and columns; Campaign shows rank, defender, missions completed out of the mission count, stars out of the star count, and score. Phone rows can wrap into the existing compact row style. Explain the ranking order and that old mission/star achievements remain while score totals require new-era clears. Guests can browse; a concise guest note explains Google sign-in is needed to publish. Refresh updates the selected mode. A failed fetch preserves a clearly stale prior list if one exists, with an error and retry action; otherwise show the error alone. Pending account sync is distinguished from the last public totals.

The trust model remains the existing client's bounded progress reporting. The Worker validates shapes, ranges, and result arithmetic; this is not an authoritative combat replay or tamper-proof anti-cheat system. Google identity prevents duplicate identity per linked account, not dishonest gameplay claims. Authoritative simulation, fraud moderation, and historic-score audits are explicitly outside this release.

## Guest entry and connection recovery

Place the guest name field immediately above its primary action. Existing guests keep the “Save name and continue” label; first-time players use “Play as Guest”. Place Google sign-in after the “or” separator. Keep the existing name length/validation, focus/selection preservation, busy-state disabling, storage warnings, unsaved-progress loss acknowledgment, and accessible labels. Do not duplicate guest warnings. The separator is visual and must not interfere with keyboard navigation.

Remove Retry connection entirely from the guest-choice screen. Google sign-in performs the existing preflight and attempts the actual auth start even when an earlier configuration/connection check failed; guest play never depends on that check. A failed auth/configuration request shows a clear reason and leaves the same Google action available for another attempt, with entered name and guest progress intact. Preserve existing loss confirmation before navigation, cancellation, deletion restrictions, account-switching rules, and startup `authError` handling. Do not create a recurring retry loop or ask the player to re-enter their name. Keep the signed-in account screen's controls/order unchanged, apart from any shared corrected error text needed for recovery.

## Acceptance and verification

Before implementation, the plan must map these requirements to callers, validators, storage, UI, tests, fixtures, API handling, and deployment. Required verification includes:

1. Formula unit tests for zero live score, ordinary/boss missions, scheduled eligibility, summoned enemies/clones excluded, idempotent kills, full-wave versus partial-wave points, lives bonus once, and invariance to gold/time/Classic multipliers.
2. All-mission metadata/target assertions and imperfect-clear threshold examples per world; briefing and results agree with the shared formula and target.
3. Lifecycle tests proving only unassisted victories award bests/stars; replays improve by max; failures/restart/quit cannot inflate rankings; simultaneous clears preserve the better result and all stars.
4. Local/cloud/guest migration tests using actual legacy fixtures, retained legacy stars with no current score, independent legacy/current maxima, nested-copy isolation, serialization/reload, stale-client writes, unknown-version protection, storage failure, and retry after interrupted migration/import. Preserve Classic bests, unlocks, presets, and existing expansions.
5. Worker tests for legacy and new payload validation, exact recalculation, impossible counts, unauthorized/CSRF writes, account-generation ownership, once-only guest imports, conflict/idempotent retries, and public privacy. Use real D1/SQLite query execution for aggregation/order/limit/JSON guards; a mock that merely returns expected rows is insufficient.
6. Ranking tests with players differing at each ordering priority, exact ties, repeated runs, legacy-only accounts, multi-mission guest import, rename/delete/re-create, malformed/future saves, no qualifying rows, limit validation, and database failure.
7. UI behavior tests and browser checks for mode selection, late fetches/tab switches, loading/empty/error/stale rows, refresh, guest visibility, selected-mode retry, exact goal labels, and readable responsive layouts. Guest entry checks include keyboard order, adjacent name/action, no Retry connection, offline guest start, Google retry after failure, loss acknowledgment, name retention, and unchanged account-management controls.
8. Run appropriate focused tests, then the complete test/build gate required by `npm run deploy`. Resolve failures without weakening assertions or skipping coverage. Apply any necessary backward-compatible D1 migration before code that depends on it; this design requires no new ranking table and should need no schema change solely for scoring metadata stored in progress JSON.
9. After publishing to the existing Worker, verify the live page, referenced current JavaScript bundle, `/api/health`, both leaderboard endpoints, guest entry, and visible Campaign ranking mode. Smoke checks must not fabricate public scores or alter a real user's account. Record the live URL and any concrete failure; schema or authorization blockers must be reported rather than bypassed.
10. Commit and push only this work, including approved spec/plan and verified documentation, on the current branch; preserve unrelated untracked files. Verify local HEAD equals the remote branch. Documentation-only spec work is committed/pushed without deploying an unchanged application.

## Deliberate limits

No new combat balance, tower/enemy changes, Classic score reset, sign-in provider, result ledger, all-era browser, season, world filter, rank search, account-management redesign, or dependency. Point weights and target policy are concrete design proposals for written-spec approval; testing mathematical reachability does not replace later real-play balance assessment. Ranking includes preserved historical achievements by the user's explicit choice.
