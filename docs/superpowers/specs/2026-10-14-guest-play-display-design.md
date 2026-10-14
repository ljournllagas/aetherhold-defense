# Guest play and readable displays

Date: 2026-10-14. Tier: Full. Workflow route: Light.

## Intent and agreed requirements

Players can start Classic or Campaign without Google sign-in, using a chosen in-game name. Guest progress and personal bests persist in the current browser. Google sign-in remains required for public score submissions and cross-device saves. Later sign-in merges guest achievements and retains better scores.

Correct the four reported display problems and format player-facing numbers consistently. Reference images: `F:/AD tests/desktop_too-little-monsters.png`, `floating account on campaign.png`, `level-cleared-next-level-on-top.png`, and `need_gold_outside_box.png` in the same directory.

## Approach and boundaries

Recommended: extend AccountSystem with explicit guest play, retaining separate guest/account repositories and the existing authenticated APIs. A configuration-only rollback to legacy mode would also reopen anonymous leaderboard submission and would not handle account switching correctly. A separate anonymous cloud identity would add an unnecessary server account lifecycle. Neither alternative meets the agreed local-only guest behavior as simply.

LoginScene owns entry and name editing. AccountSystem owns identity selection and battle ownership. Existing progress repositories own persistence. Shared display formatters own number presentation. Enemy projection owns visual size, independent of simulation coordinates and combat radius. Header layout owns Account and Back placement together.

No new authentication provider, anonymous cloud account, combat balance changes, leaderboard score era, or campaign progression changes. Keep existing Google sign-in, deletion, authenticated score validation, and pending-sync protections.

## Guest entry and naming

- The signed-out entry screen offers Sign in with Google and Play as Guest. Guest play remains available when account/config requests fail or the device is offline, after the application has loaded.
- Choosing guest requires a valid name before entering the game. Reuse the existing Unicode-aware validation and normalization, maximum 20 characters, and supported letters/numbers/spaces/punctuation. Empty or invalid input shows an inline error and stays on the name form.
- Remember the normalized name in browser settings. Returning guests with a valid remembered name can enter without retyping it. Guest identity persists across reloads until sign-in or an explicit identity change.
- Provide an editable guest-name control through the existing account entry. A rename applies to future runs; an active run retains its captured name. Guests see their name and Guest/local-save status rather than Synced.
- Google authentication cancellation leaves guest name and progress intact. Successful login selects the authenticated account. Its existing nickname wins; a newly initialized account may use the guest name under the current nickname-initialization rule.
- A signed-in user uses the existing sign-out action before choosing guest. Expired sessions offer sign-in again or explicit guest entry. Guest entry must not depend on completing an unreachable logout endpoint; any retained server session is suppressed locally until explicit Google sign-in succeeds. A deletion with uncertain server outcome remains blocked until resolved, preserving the existing deletion boundary.
- Guest mode never silently selects a cached account save. Selecting guest reloads only guest repositories. Account progress, pending results, and deletion metadata remain isolated and preserved.
- Never switch an active run's identity because of background refresh or another tab. Keep the captured owner and result behavior through settlement/discard; show an identity-change notice and resolve selection at the next menu. Guest/account changes are menu operations.

## Guest progress, results, and later sign-in

- Guest Campaign achievements, Classic branch achievements, preparation preferences, and personal bests use browser-local guest storage. Clearing browser data removes these saves; another device does not have them. Explain this beside guest entry and in guest account controls.
- With browser storage unavailable, allow session-only guest play and naming, with a visible warning that progress cannot survive reload. Do not present successful durable saving or cloud synchronization.
- Guest terminal results update local bests but never call public score-upload APIs. Result screens offer Sign in to submit/save across devices. Restart and Quit remain discarded runs without results.
- Keep the latest eligible Classic guest terminal result for submission after sign-in, using the existing single saved-result convention, with the run's immutable name/payload and run ID. No historical guest result queue is added. Campaign guest results contribute local progress/bests and do not become public Classic entries.
- Following sign-in, import guest progress before uploading its eligible Classic result. Use the existing merge semantics: union earned achievements, retain best per-level achievements/scores, and compare personal bests only within their score era and existing categories. Never downgrade either save.
- Generalize the existing once-only guest import into guest save batches. Freeze each claimed batch's snapshot and import ID so retry/reload does not duplicate it or mutate its payload. After acknowledgment, later guest play forms a fresh batch; a consumed batch is never imported to another account or account generation. Fresh batches contain only unclaimed guest progress/results, not earlier claimed achievements, even if the guest-facing cumulative save retains them for local play. Preserve legacy consumed-claim ownership during upgrade; unclaimed legacy data remains importable under existing rules.
- Failed imports retain the batch for retry and show pending/error status. They do not erase local progress or prevent playing with a successfully loaded account profile. A different account cannot take an outstanding claimed batch; show the conflict and preserve it for its owner. Do not upload its result to the different account.
- Guest progress earned while an import is pending is retained as a subsequent batch and never lost when the frozen batch is acknowledged. Multiple tabs must claim/acknowledge batches atomically and converge without double consumption. Account deletion does not re-enable reuse of its consumed batches.
- Account deletion permanently abandons that account generation's claimed batches, including batches whose import acknowledgment is still pending, and discards their eligible results. Include this consequence in the existing deletion warning/confirmation. Once deletion is confirmed, mark those batches abandoned locally; server ownership/tombstones remain protected. Abandoned snapshots remain available only through the cumulative local guest save for local play, never for import to another account. Resolve an uncertain deletion before abandonment. New unclaimed guest progress and fresh batches remain eligible for a future account. This intentional deletion behavior must not leave imports perpetually labeled pending or repeatedly retried against a deleted generation.
- Session-only guest progress and results cannot survive the full-page Google OAuth redirect when durable browser storage is unavailable. Before that navigation, show a clear warning that the unsaved guest progress/result will be lost and allow the player to cancel and keep playing. No automatic import/submission is promised for that data. If another supported durable storage adapter successfully retains the batch before navigation, normal import rules apply; otherwise require acknowledgment of the loss warning. A successful login starts from that account's profile without fabricating a guest import.
- Keep backend anonymous score rejection enabled in production. Decouple permission to play locally from permission to submit public scores; do not use `ACCOUNT_LOGIN_REQUIRED=0` as the guest feature switch. No database migration is expected unless planning establishes a necessary contract change.

## Responsive monster presentation

Apply one viewport-aware visual policy to Classic and Campaign regular enemies, elites, and bosses. Use visible art bounds across animation poses, not transparent source-canvas size, to compute apparent dimensions.

At battlefield overview, use a regular-enemy longest-visible-dimension band of 32–48 CSS px on desktop, 24–36 on tablet, and 20–30 on phone. Preserve relative archetype sizes within each band; elites may reach 1.2 times the regular maximum. Classify using CSS viewport dimensions: phone when the short edge is below 600px, otherwise desktop when width is at least 1024px, otherwise tablet. Thus 1440x900 is desktop, 768x1024 is tablet, and 844x390 remains phone. Bosses remain larger than regular enemies and capped at the lesser of 96px or 30% of visible battlefield height on phone/tablet; desktop cap is the lesser of 144px or 40%. Tiny battlefields use the proportional cap in preference to any minimum.

Camera zoom continues to enlarge enemies in proportion to zoom; the bands describe overview, not a fixed size at every zoom. Resize/orientation recalculates the overview policy. Death animations start at the current living visual size and shrink smoothly. Health bars, shadows, status effects, and boss panels stay attached without changing targeting, collision, route positions, or attack coverage. No pose should visibly jump in scale merely because its art rectangle changes.

If the proportional boss cap would be at or below a regular/elite enemy's displayed size on an extremely short battlefield, scale regular/elite enemies below their normal bands as needed to keep their maximum longest dimension at most 80% of the boss cap. This tiny-battlefield exception preserves size ordering and takes priority over normal minimum sizes. Include a 60px-tall battlefield projection check.

## Layout corrections

- Campaign Account/Guest and Back controls share header bounds, vertical center, gap, and resize handling. Their click targets never overlap each other, the title, or world tabs. Long names use the short Account/Guest label in this constrained header. Keep keyboard access and accessible labels.
- Campaign result actions appear in this order: Next Level when victory unlocks a valid next level, Restart Level, World Map. Next Level is the primary action. At the final level, on defeat, or when the next level is unavailable, omit it and put Restart first. Each action appears once and retains current navigation behavior.
- Tower cards keep portrait, name, formatted cost, and affordability status inside their own bounds. Wrap Need gold to two lines or reserve a full-width status row; never solve this by reducing text below the existing 12px size. Preserve tap/drag targets, selected state, and horizontal tray scrolling. Inspect every tower name and affordable/unaffordable state.

## Numeric display contract

Use deterministic English-style comma grouping for player-facing numeric quantities. Counts and scores are integer displays (`12,345`); damage, range, splash radius, and other distance/damage statistics use at most one fractional digit (`172.5`); attack intervals and fractional time statistics use at most two (`0.55s`). Strip trailing zeroes and normalize negative zero. Percentages and multipliers use up to two fractional digits unless an existing whole-percent presentation already conveys the value exactly. Countdown clocks retain their `m:ss` structure. Level/wave/rank identifiers stay integer identifiers; version numbers and dates are not quantities.

Cover HUD resources/score, tower tray, selected-tower panels, upgrade/evolution/mastery comparisons, Campaign preparation/details/results/star targets, Classic results and breakdowns, personal bests, and leaderboard rows. Units and labels remain adjacent. Round only at display time; persistence, API payloads, score comparison, and combat calculations retain original values. Nonfinite values display an em dash rather than NaN/Infinity. Values that round to the same display precision may share a label; values that round differently must remain distinguishable.

## Acceptance and verification

Use meaningful unit/integration regression tests for guest ownership, persistence, import batches, authenticated API boundaries, formatting, responsive projection, and action ordering. Preserve current coverage and failure visibility. Verify:

1. A fresh signed-out player chooses a name and starts both modes without Google; reload preserves name and local achievements/bests. Guest play also works after failed config/account fetches. Invalid names and unavailable browser storage have the specified visible outcomes.
2. Existing account users retain their saves. Guest selection, sign-out, expiry, another-tab changes, uncertain deletion, and subsequent sign-in never expose or overwrite another identity's save/outbox. Active-run ownership remains unchanged.
3. Sign-in imports achievements and better scores, retains account nickname, and uploads only the eligible Classic result after successful import. Retry, reload, repeated sign-in, subsequent guest batches, pending-import new progress, competing tabs/accounts, legacy claims, and deleted generations preserve ownership and idempotency. Delete an account with an unacknowledged claimed batch: its batch/result become abandoned after confirmed deletion, stop retrying, remain unavailable to another generation, and do not block importing fresh unclaimed progress. Session-only sign-in warns before redirect, cancellation retains in-memory play, and proceeding without durable retention does not claim that lost guest data was imported. Direct unauthenticated score requests remain rejected in production.
4. Formatting examples: `12345 -> 12,345`; `214.50000000000003 -> 214.5`; `195 -> 195`; `0.36000000000000004 -> 0.36`; `1s -> 1s`; `151.99999999999997 -> 152`. Exercise zero, negative zero, large scores, comparison arrows, and nonfinite input. Assert underlying values are unchanged.
5. Inspect live UI at 1440x900 desktop, 768x1024 tablet, 390x844 phone, and phone landscape. Check both modes, regular/elite/boss animation, overview and zoom, orientation/resize, header alignment, all affordability states, large numbers, and victory/defeat/final-level actions. Capture screenshots and measured visible bounds; compare the four user references. No clipped labels or inaccessible actions.
6. Before publication, full tests and TypeScript/Vite build pass through `npm run deploy`. After publication verify live HTML, the current JavaScript bundle against the local build, and `/api/health` at https://aetherhold-defense.ljournllagas.workers.dev/. Commit/push only task-owned files and verify local HEAD equals the current remote branch. Report concrete failures and the live URL.

## Design review and handoff

The user confirmed the requirements synthesis on 2026-10-14. This written design still requires independent spec review and user approval before Full planning. Planning must define exact integration contracts and test fixtures without weakening the behavior above. Application code has not been changed in this specification stage.

Independent review completed using Luna MAX: round 2 scored 7/10 with one deletion/import blocker; round 3 scored 9/10 with zero blockers. The session-only OAuth advisory and final tiny-battlefield advisory were incorporated. The initial interrupted review identified the corrected viewport-classification and rounding-wording contradictions. No advisories remain open.
