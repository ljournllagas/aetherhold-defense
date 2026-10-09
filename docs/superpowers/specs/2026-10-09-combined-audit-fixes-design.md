# Combined game audit fixes

Date: 2026-10-09
Tier: Full
Workflow route: Light; main agent owns the work, with skill-required cold reviews.
Status: approved specification; reviewed implementation plan awaiting user handoff
Written-spec approval: user approved on 2026-10-09.
Review: round 1 cleared at 9/10, zero blockers and zero advisory items.
Scope approval: user confirmed all eleven audit items as one release.
Score-era decision: user selected era 3 with preserved legacy records.
Implementation plan: [combined audit fixes](../plans/2026-10-09-combined-audit-fixes.md),
cleared cold review round 3 at 9/10 with zero blockers/advisory findings.

## Purpose and scope

Make the existing game reliable across frame rates, failed downloads, malformed
settings and failed score submissions. Make its balance checks enforce their stated
targets, reduce the download needed to reach the menu, and make later tower
purchases understandable. Deliver all eleven audited items in one verified release
to the existing production Worker, followed by commit and push to the current branch.

The scope is the confirmed audit list: combat timing; asset failure recovery;
settings validation; balance enforcement/tuning; native submission throttling;
page security headers; consistent player names; truthful offline messages; staged
loading; rank/mastery previews; and a persistent manual score retry.

This specification supersedes the shipped seed-price exception in SPEC section
12.8, the era-2 current-best/ranking rules, and result retry being limited to an
open results screen. Other contracts remain in force, including explicit submission,
unlock snapshots, actual-investment refunds, irreversible branch choice, once-only
wave rewards, victory choice, pause behavior and responsive controls. Branch parity
(the previously accepted AC-127 model limitation) is outside this audit scope.
No account system, authoritative replay verification, general gameplay bot,
new gameplay content, or dependency upgrade is included. Human balance and physical
device verification remain separate from the automated acceptance evidence.

## Approach and boundaries

Recommended: reuse the current systems and scenes, introducing only small units for
simulation time, an asset manifest/stage selector, shared name policy, and the saved
submission repository. GameScene continues to orchestrate the run; SiegeSystem,
RelicVault, EvolutionCombat and purchaseEvolution keep their responsibilities.
PreloadScene owns loading/recovery and routes to an existing destination scene.
The Worker uses a native binding; Static Assets uses public/_headers.

A cooldown-only catch-up patch is smaller but leaves movement, status expiry,
projectiles and boss abilities observing inconsistent times. A complete rewrite
into a new simulation/rendering framework creates unnecessary migration work.
The selected approach isolates a fixed simulation tick while retaining existing
combat rules, rendering and UI components.

The Full implementation plan will define interfaces, tasks and concrete sequencing.
The behavioral dependency is fixed timing before balance evaluation, and final
coefficients/era validation before release verification. The loading stage and
failure gate are one change. The saved retry and offline text share one repository
view, so messages cannot claim persistence that failed.

## R1. Combat time and frame independence

1. Accumulate finite, positive, unpaused game delta from the visible update loop,
   scaled once by the speed active when that delta is received. Negative, zero and
   non-finite deltas add no time. Consume game time in fixed 1/60-second ticks;
   retain fractional remainder and unprocessed time. Use a finite processing budget
   of at most 60 simulation ticks per visible frame, retaining excess for later
   frames rather than discarding overdue attacks.
2. Each tick advances spawning, movement, regeneration, statuses, projectile
   arrival, tower attacks, ground damage, boss ability clocks and authoritative
   wave completion through the existing rules. Due events use simulation time;
   a missed render frame does not remove attacks or skip a summon boundary.
   Keep one death reward and one clear reward per entity/wave.
3. No-target time does not accumulate a stockpile of future attacks. Cooldowns
   survive purchases as today; upgrades grant no immediate extra attack. Fired
   projectiles retain their snapshots. Pause freezes accumulated time and adds no
   new time. Resume processes only time earned while playable; background time is
   never charged. Init, restart, shutdown and terminal cleanup reset the clock.
4. Rendering, input and Auto evaluation happen once per visible update. Preserve
   Auto's five eligible real seconds, at most one relic action per visible update,
   and a fresh countdown after an authoritative clear. A tick entering victory or
   terminal stops remaining simulation work before another action can occur.
   Catch-up is prohibited behind current pause/dialog/victory/terminal blockers.
5. For equal seeded input and elapsed playable time, 60/30/10 FPS and irregular
   frame partitions at 1x/2x/3x yield the same attack/kill/reward counts after draining
   retained time, with at most one simulation tick of clock remainder. Test the
   reported Volley/Battle Cry case, no-target recovery, pause/resume, status expiry,
   chain and ground damage, boss summons, and terminal transitions during catch-up.
   Active duration remains unscaled active plus preparation time, not game speed.

## R2 and R9. Staged loading with recovery

1. A single manifest assigns each of today's 22 images to a stage and preserves
   its existing path, texture key, source dimensions and spritesheet framing.
   Menu stage contains emblem, both menu vistas and the three difficulty helms.
   Gameplay stage contains the normal map, five tower sheets, three Bombard stage
   images, three enemy atlases, relic/HUD atlases and the stronghold overlay.
   Defeat stage contains only the defeated-map image.
2. Initial boot requests only the six menu images. Main Menu, Difficulty,
   Settings, Leaderboard and Progression remain reachable without gameplay images.
   Starting a new run routes through gameplay loading before GameScene.init/create.
   Preserve selected difficulty and player name through that transition. Reuse
   loaded textures on replay; request only missing stage assets.
3. Terminal results retain their payload and world snapshot while defeat art loads.
   Load defeat art only for a result whose snapshot needs the defeated map.
   A victory or positive-lives siege failure can open with retained gameplay art.
   Do not reinitialize or resume the completed run to load its result art.
4. Loading states are loading, failed and ready. Ready requires every asset needed
   by the destination to be present. A loaderror cannot fall through to the menu,
   Game or results. Show an understandable failure message with Retry and Back to
   Keep; initial menu-stage failure offers Retry and a page reload action instead
   of routing to an unloaded menu. Retry clears the current error and requests
   missing assets while keeping successful textures.
5. Cancel/Back during gameplay loading returns to the loaded menu and creates no
   run or score. Back from failed result-art loading returns to the menu, keeping
   the terminal result's personal best/unlocks and any saved submission. Cancellation
   and shutdown invalidate loader/font callbacks; stale completion cannot navigate
   a later stage. Resize redraws loading state without restarting or losing data.
   A terminal result remains available through Retry while the loading scene is open.
6. Generate derived HUD/relic/tower textures only after their source stage is ready.
   Fonts may use the existing timeout fallback, but it cannot bypass an image gate.
   Stage progress reflects real pending loads. Verify cold menu requests exclude
   gameplay/defeat images, gameplay waits for all dependencies, a failed enemy atlas
   recovers, a failed result map retains the result, and warm replay avoids duplicate
   image loads. Record initial image bytes; they must be below the 29.6 MB baseline.

## R3 and R7. Settings and player names

1. Parse storage as unknown. Absent, invalid JSON, null, scalar and array settings
   yield defaults. For an object, accept only defined settings fields with valid
   types: finite clamped volumes; boolean music/SFX toggles; speed 1, 2 or 3;
   difficulty easy, medium or hard; and a string player name. Each invalid field
   falls back independently. saveSettings uses the same normalization, never blindly
   persisting unknown fields. Storage errors keep gameplay available.
2. Use one shared name policy for desktop input, phone input, saved settings,
   run creation and score validation. Normalize to NFC; permit Unicode letters
   and numbers plus space, underscore, hyphen, apostrophe and period. The maximum
   remains 20 UTF-16 code units, matching the HTML maximum and current payload limit.
   Do not split a surrogate pair when truncating an input value. UI and settings
   may hold an empty name; a started run substitutes Warden for an empty trimmed name.
3. Editing retains allowed non-ASCII names and periods, including Jose with an
   accented e and decomposed accents after NFC normalization. Filter disallowed
   characters in the UI; defer filtering during IME composition until it completes.
   At run start trim/collapse spaces. Server validation normalizes and validates
   rather than deleting forbidden characters or silently truncating oversized names.
   Valid names appear identically in the run, submission and leaderboard.
4. Tests cover every malformed setting type, partial valid objects, unavailable
   storage, Unicode/combining names, supplementary letters, punctuation, empty
   names, forbidden markup, composition, and overlength input/server rejection.

## R4. Enforced balance acceptance

1. Run balance against the corrected simulation. Keep the existing Medium targets:
   first evolution affordable during waves 11-13; a rank-2 evolution before wave 20;
   no forced wait longer than three consecutive completed waves for the progressing
   mixed strategy; 2-5 rank-3 towers at siege victory; no fully evolved nine-plot
   defense before wave 25 from ordinary income; 1200-1800 simulated seconds at 1x
   including the established 10-second preparation policy.
2. Use the existing documented mixed-build strategy and seeded RNG. Record two
   Medium starter runs (seeds 1 and 2), a Medium unlocked run (seed 3), Easy/Hard
   sanity runs (seeds 4 and 5), and additional versions of the three Medium runs
   that never activate gold-granting relics. Retain ordinary-income arithmetic
   checks. Label scripted evidence and relic assistance accurately; all three
   no-gold-relic runs must establish the first two milestones and a siege victory.
3. Tune configured late evolution prices first, preserving early prerequisites,
   branch identities and equal prices for both branches of each archetype. Reuse
   actual-investment refunds and derive mastery prices from the final rank-3 price.
   If late prices alone cannot meet the entire gate set, tune the existing typed
   combat/economy coefficients within this same scope and record the rationale.
   Do not replace the reference strategy, seed set or assertions to make it pass.
4. All Medium reference runs, including the no-gold-relic variants, must meet the
   full Medium gate set. Easy and Hard must produce a siege victory with legal
   purchases and valid terminal payloads; they do not inherit Medium duration or
   composition targets. A continued-endless run measures siege gates at wave 30,
   even if its final outcome is defeat later.
5. Critical balance simulations and their assertions run in npm test and therefore
   the deploy gate. An opt-in report writer may remain for detailed evidence, but
   cannot be the sole acceptance check. Write real traces before reporting any
   failing gate; preserve the failing evidence. Avoid overwriting tracked reports
   as a side effect of the default suite. Record final coefficients and outcomes
   in the release evidence and update current product documentation.

## R5 and R6. Worker throttling and page headers

1. Replace the per-isolate IP map with a configured native SCORE_RATE_LIMITER
   binding: 10 POST attempts per 60-second period, using a dedicated namespace and
   a key scoped to the score route and trusted CF-Connecting-IP. Without that header,
   use a shared anonymous key; do not trust caller-supplied X-Forwarded-For. GETs and
   OPTIONS do not consume submission quota. Preserve current error envelopes and
   bounded-body/schema/plausibility/prepared-statement validation.
2. A denied request returns 429 RATE_LIMITED and Retry-After: 60 without a DB write.
   A missing/failing binding returns a retryable API-unavailable error and performs
   no write. The native limit is practical abuse protection with per-location,
   eventually consistent counters, not an exact worldwide quota. Local Worker
   integration verifies the configured binding; unit tests use an explicit fake.
3. Put page/asset security policy in public/_headers, copied by Vite into dist.
   Preserve Worker-generated API headers. The page must receive nosniff, DENY frame
   protection, no-referrer, disabled camera/microphone/geolocation, and CSP allowing
   the existing same-origin scripts, fonts, API and image/audio sources plus the
   existing inline style requirement. Include frame-ancestors 'none', object-src
   'none' and base-uri 'self'. No new script eval permission or third-party source.
4. Verify production HTML headers, the current bundle's MIME/headers and runtime
   behavior. Fonts, name inputs, image stages, Phaser and synthesized audio must
   still work without policy violations. API responses continue returning JSON,
   with no internal errors exposed. Configure no destructive D1 migration.

## R10. Next-purchase previews

1. Extend the existing progression view/sheet and inspector with current-to-next
   damage, attack interval and range for foundation and evolution-rank purchases;
   mastery shows current-to-next damage and its unchanged attack/range values.
   Identify these as base configured stats, excluding auras, relics, armor, boss
   multipliers and aggregate Volley/chain damage. Keep effect descriptions and
   the existing formatting, cost, specific disabled reason and branch commitment.
2. Derive preview values without mutating the tower or requiring sufficient gold,
   an unpaused run or unlocked prerequisites. A numerically invalid next mastery
   shows the numeric-limit reason and no fabricated NaN/infinite next value.
   Locked initial branches retain their existing comparison and requirements.
3. Gold/readiness changes refresh availability; purchases refresh values; held
   stale controls remain inert through existing tower/revision validation. Use
   word wrapping, measured text height and scrolling at all required sizes.
   Verify preview matches the actual successful next purchase and does not alter
   gold, counters, progression, cooldowns, projectiles or unlocks.

## R8 and R11. Saved manual score submission

1. A saved submission is one immutable terminal-result API payload plus its attempt
   timestamp, under a new version-1 local record aetherhold-score-retry-v1. Save it
   when the player explicitly submits, before the network request, to retain an
   interrupted attempt whose server outcome may be unknown. Opening results,
   Continue Endless, Restart and Quit do not create or send a submission.
2. Keep at most the latest explicit attempt. If a different saved run exists,
   identify beside the new Submit action that submitting will replace that saved
   retry; the explicit action performs that replacement. Opening another result
   alone never overwrites it. Success or DUPLICATE_RUN clears only the matching
   currently saved run, so an old response cannot erase a newer attempt.
3. Serialize repository read/replace/conditional-clear operations across tabs
   with the browser Web Locks API; do not hold a lock during a network request.
   If locks or storage are unavailable, keep the attempt in memory for the current
   session and explain that reload recovery is unavailable. A failed persistence
   write never blocks the explicit POST or alters personal bests/unlocks.
4. The main menu offers Saved Score when a retry is available. Open a lightweight
   existing ScrollSheet showing its name, difficulty, outcome, wave and final score,
   with explicit Retry Submission and Back actions. It does not reconstruct missing
   score breakdown, world snapshot or personal-best flags and never resumes a run.
   The results screen keeps its own existing retry. Both paths share the repository
   and submission behavior, disable repeated clicks while submitting, retain the
   identical payload/runId on failure, and prevent stale callbacks touching a
   restarted or different scene. Repository settlement still occurs after navigation.
5. Retry states are ready, submitting, submitted/already-recorded, failed and
   incompatible/unreadable. Reload treats a saved interrupted attempt as ready;
   UUID uniqueness safely resolves an already accepted request. Network errors,
   timeout, 429 and 5xx leave it retryable. Other rejection reasons remain visible;
   a stored current-era payload failing validation cannot be posted. A retired-era
   attempt cannot be relabeled/recomputed for era 3 or submitted to its leaderboard.
6. Parse records as unknown with a bounded size and validate the stored payload at
   the API trust boundary. Malformed/unsupported-newer records stay byte-for-byte
   intact, are not auto-posted or auto-overwritten, and show an understandable
   storage warning. A new explicit submission may proceed online without overwriting
   such bytes, with the warning that its retry is session-only. Recognized older-era
   records remain preserved and viewable as ineligible; replacing one requires the
   same visible replacement notice and a new explicit Submit action.
7. Offline text reflects repository state: confirmed saved retry, session-only retry,
   personal best availability or unavailable storage. Leaderboard errors must not
   claim that every run was saved. No new automatic network retry, background task,
   account synchronization, submission history or implicit discard action.
8. Verify failure -> leave -> reload -> manual success; timeout after server accept
   -> retry -> duplicate; storage refusal; malformed/newer/retired records; repeated
   clicks; simultaneous tabs and stale response after a newer saved run; result
   navigation while POST is pending; and no POST from any non-submit action.

## Score era and retained progress

1. Publish GAME_VERSION 0.3.0 and SCORE_VERSION 3 through the existing shared source
   of truth. The Worker filters current rankings to era 3 and rejects old-era POSTs
   explicitly. Preserve every existing D1 row, run ID and index; an empty era-3 board
   shows the existing empty state. No destructive migration or score conversion.
2. Use aetherhold-best-score-v3 for current bests. Keep aetherhold-best-score-v2 and
   aetherhold-best-v1 byte-for-byte unchanged. Read valid older records separately,
   display available era-2 and era-1 bests labeled by era in the progression panel,
   and show the most recent available legacy era beside current best in menu/results.
   Never compare a new score against either legacy era or choose the largest value
   across incompatible eras. Malformed legacy entries do not block another valid era.
3. Settings keys and unlock profile format remain unchanged. Existing unlocks survive.
   An old open client may finish its run but receives an era-mismatch rejection when
   posting after deployment; the reason is visible and its best/retry stays local.
   Do not silently replace its claimed era with 3. Validate legitimate era-3 victory,
   siege failure and endless-defeat payloads under the final configured rules while
   retaining all existing forged-payload rejection coverage.

## Acceptance and release evidence

- Every audited item above has a change-specific regression check. Keep existing
  assertions and failure visibility; a balance miss or missing binding fails release.
- Run typecheck, the complete default suite (including critical balance), build,
  local Worker/API integration and a cold review of the complete change.
- Native browser checks at 1440x900, 1280x720, 1024x768, 844x390, 390x844 and 360x640:
  staged entry/retry, Unicode name, new run, progression previews, purchases, Auto,
  pause/background resume, rotation, victory/endless, terminal result and saved-score
  retry. Controlled asset/API/storage failures are labeled; success uses real local
  Worker/D1 responses. No unexpected browser error, failed request or CSP violation
  is accepted outside the deliberately injected failure cases.
- Keep screenshots/request logs, seed traces, final coefficient table, test/build
  results and known limits under a release evidence directory. Human and physical
  hardware results must not be inferred from scripts or viewport emulation.
- After approval of this spec and its implementation plan, publish the complete
  verified application with npm run deploy, whose tests/build precede Wrangler.
  Verify live HTML, its current JavaScript byte equality with dist, /api/health
  reporting era 3, page headers, leaderboard current-era filtering and basic native
  entry/replay. Use local D1 for mutation/failure tests; live verification is read-only.
  Report the live URL and any concrete verification/deployment blocker.
- Commit completed code/spec/plan/documentation/evidence, push the current branch
  without further deployment or push approval, and verify local HEAD equals the
  remote branch. Preserve unrelated user changes. This specification stage alone
  changes no application and therefore does not deploy.

## Primary platform references

- [Cloudflare native rate limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)
- [Cloudflare Static Assets headers](https://developers.cloudflare.com/workers/static-assets/headers/)

These references were checked on 2026-10-09. Their native API/configuration facts
inform R5/R6; the numbers and player behavior above are this game's chosen contract.
