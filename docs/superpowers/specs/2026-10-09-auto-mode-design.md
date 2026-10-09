# Auto mode

Date: 2026-10-09
Tier: Full
Status: shared understanding approved; written spec awaits user approval
Review: round 1 cleared at 9/10, zero blockers and zero advisory items.
Workflow route: Light; main agent owns design and eventual implementation, with the skill-required cold reviews.

## Purpose and agreed choices

Let a player who is satisfied with their defenses continue playing without repeatedly starting waves or handling every found relic. The player requested one Auto switch, a five-second wait between waves, situational relic use, Meteor aimed at the largest eligible group, retention of overflow rewards, and Auto OFF for each new run. The player confirmed the combined understanding and recommended per-relic rules before this document was written.

Auto does not assess whether a build is strong enough. The player decides when to enable it. It never builds, sells, upgrades or evolves towers, changes targeting or speed, chooses Finish Run/Continue Endless, restarts, quits or submits a score. No cloud scheduler, external AI, new dependency, settings persistence, database migration or balance tuning is needed. The previously assessed coarse-frame attack-scheduling bug and upgrade-preview enhancement remain separate work.

## Approach and ownership

Recommended: a small `src/game/systems/AutoSystem.ts` controller owns the per-run toggle/countdown and pure relic eligibility/target selection. It reads explicit run snapshots and proposes actions; it does not own Phaser objects, timers, storage, enemies or inventory. `GameScene` executes those actions through the existing wave-start, vault, power-up and Meteor paths, and owns presentation. `RelicVault` remains the owner of consumption and target reservations. This makes rules independently testable and preserves the current damage, random effects and reward accounting.

Putting all decisions directly in `GameScene` needs fewer interfaces but couples countdowns, targeting and inventory policy to rendering and makes state tests harder. A general gameplay bot could automate tower development as well, but adds a strategy subsystem outside the agreed goal. Neither alternative is selected.

The implementation plan will define concrete interfaces and task order after written-spec approval. This spec defines behavior, not a task-by-task plan. No ADR is needed: the controller is replaceable, the trade-off is ordinary, and no persistent contract changes.

## Mode and lifecycle

**A1.** There is one logical Auto setting controlling both automatic wave starts and situational relic use. Every `GameScene.init` creates OFF state with no remaining countdown. Do not load or save it in settings/local storage. Restart and a new run reset it; Continue Endless is the same run and retains its current setting.

**A2.** Turning Auto OFF immediately cancels its countdown and any uncommitted Auto action. It does not consume, discard, reorder or replace relics, alter a manual Meteor reservation, close a manual dialog or undo an already committed effect. Turning it ON during a wave starts relic evaluation and waits for the authoritative clear before arming a countdown. Turning it ON between waves, including before wave 1, arms a fresh five seconds when wave-start blockers are absent. No minimum tower count is imposed on wave starts.

**A3.** User/modal/background pause, an open manual dialog, a manual Meteor reservation, victory decision and terminal/ended state prohibit ALL Auto actions. No repair, coin grant, creature spawn, Meteor or wave start occurs behind those blockers. Enabling Auto in a blocked state records ON but waits. Manual actions retain their existing permissions and validation; Auto does not silently close or resolve an already open dialog. Opening a build/progression/control sheet alone does not pause the run.

**A4.** A suspended countdown retains its remaining time while a blocker exists. After explicit resume or resolution it continues from that remainder. If no countdown had been armed, it starts at five seconds on first eligibility. OFF/ON starts a fresh five seconds. Resize preserves the setting and remaining time, and never acts. Shutdown/terminal cleanup removes all Auto callbacks/state references; stale callbacks cannot affect another run. A countdown cleared by entering an active wave or victory is not carried to a different wave.

## Five-second wave countdown

**A5.** Count five seconds of unpaused, foreground real time, independent of 1×/2×/3× game speed. Use the existing visible update loop's unscaled elapsed time; no background timer. Reject non-finite or negative elapsed values. Account only elapsed eligible time, not time before enabling, before an authoritative clear, while blocked or while a wave is active. The frame that establishes eligibility arms a fresh countdown without charging that frame's earlier time. No wave starts before 5000 eligible milliseconds; the first eligible update at/after zero may request it.

**A6.** After each authoritative wave clear, arm a fresh five seconds unless the siege has entered victory/terminal. Wave-clear bonuses and achievements remain once-only. Manual Start while Auto is ON may skip the wait through the same start transaction and cancels the countdown only when the wave actually starts. A rejected manual/Auto start cannot mark a wave active, increment its number, pay a bonus or leave an immortal countdown callback.

**A7.** At commit, recheck the setting for an Auto request, pause/dialog/target blockers, `waveActive`, run phase and the existing `SiegeSystem.startWave` guard. Waiting rewards are not a wave-start blocker while Auto is ON, including for Manual Start used to skip the countdown. When OFF, retain the current pending-reward requirement. Never overlap scheduled waves, skip a wave, start wave 31 before the player's victory choice or start twice from a manual click racing a due Auto request. A due request blocked by a concurrent state change stays due and retries only after eligibility returns, unless the active wave/phase has changed.

## Situational relic use

**A8.** Evaluate actual current run state. "Combat" here means `waveActive` and at least one living enemy. "Towers exist" means at least one current tower; do not predict firing range, future kills or build strength. Buff expiration is checked against the existing game-time deadlines, with an effect inactive when its deadline is <= current game time. Auto uses the unchanged coefficients, damage channels, armor/vulnerability handling, random rolls and random Overcharge target.

| Relic | Eligibility in playable, unblocked Auto mode |
|---|---|
| Gold Rush | Always; it can benefit preparation as well as combat. |
| Stronghold Repair | Current lives < maximum lives. Use even for one missing life; the existing cap still applies. |
| Meteor | Combat and an eligible target under A10. No towers required. |
| Time Lock | Combat and the global Time Lock deadline is inactive. Tower-applied freeze/stun does not make global Time Lock "already active." |
| Battle Tempo | Combat, towers exist, and the Battle Tempo deadline is inactive. |
| Arcane Surge | Combat, towers exist, and the Arcane Surge deadline is inactive. |
| Double Bounty | Combat and the Double Bounty deadline is inactive. No towers required: relic/field kills still qualify normally. |
| Tower Overcharge | Combat, towers exist, and no current tower has an active Overcharge deadline. Retain the random target selection. |
| Treasure Creature | Combat, towers exist, and no living `pilferer` exists. |
| Ancient Blessing | Combat, towers exist, lives are missing, and Arcane Surge is inactive. Thus gold, repair and surge can each provide their intended benefit; the original random outcome remains. |

Do not refresh an identical active buff or waste a repair at full lives. Different buffs may coexist normally. Auto need not guarantee that a combat buff reaches a kill before expiration, or that a summoned Pilferer is caught. Waiting relics can remain unused indefinitely if their conditions never occur; this is situational use, not forced consumption. There is no per-relic configuration UI in this release.

**A9.** Choose the oldest currently eligible relic. The current vault's stored order precedes its pending order: offer/store rules keep stored items older than waiting rewards. Scan stored slots in order, then pending rewards in order, skipping ineligible items without moving them. For example, a waiting repair at full lives must not block a later Gold Rush. Execute at most one Auto relic per visible game update, then recompute eligibility on the next update. Do not recurse through reward presentation or drain the queue in an unbounded action loop. A large queue must not prevent a due wave start: at most one relic action and one wave-start transaction may occur sequentially in an update, with current-state validation between them.

**A10.** Auto Meteor aims at living-enemy world positions. For each such candidate center, count living victims within the configured Meteor radius, inclusive of the boundary. A candidate is eligible if it covers at least three enemies OR at least one boss. Among eligible candidates choose greatest victim count, then preference for covering a boss, then preference for a boss-centered candidate, then lowest center enemy ID. Compute a candidate's target once per Auto decision and reuse it for duplicate Meteor items. This is a deterministic enemy-centered cluster rule, not a search over every possible point on the map. No viable candidate means retain the Meteor.

Revalidate living victims/eligibility and the vault selection immediately before consumption. Use the existing target reservation and `castMeteor` damage/effect transaction synchronously, without entering a manual targeting preview or closing the player's selected tower/control sheet. If a stale item/target or new blocker prevents commit, cancel only an Auto-created reservation and retain the relic. Never consume a manual reservation or let a later manual cancel undo an Auto cast. A committed Meteor may kill bosses, earn ordinary rewards and trigger normal siege transitions once.

## Reward retention and manual control

**A11.** Keep the inventory limit of three. While Auto is ON in siege/endless, new finds still go through `RelicVault.offer`; eligible rewards may be used from stored or pending sources without requiring a fourth slot. Ineligible rewards remain in their current collection. Never automatically replace, discard or expire them. Preserve IDs, reasons, reveal metadata, relative order and reservation semantics. Pending Auto-eligible selection may bypass an ineligible pending head; ordinary manual pending-use/resolve remains FIFO. Extend the existing vault transaction as needed rather than directly splicing pending rewards in `GameScene`.

**A12.** Auto suppresses NEW reward-reveal/inventory-full dialogs while retaining their rewards. Preserve nonblocking found-relic feedback, and show the pending count in the Auto status/control sheet when nonzero. Do not set a modal pause just because a reward is deferred. A manual relic inspection/target action remains available; Auto waits while that dialog or reservation exists. Turning OFF returns to the normal manual FIFO reward flow at the next presentation opportunity, with all retained rewards still available. Reveal metadata is not discarded by toggling ON/OFF, so normal presentation can resume when OFF. A failed/stale use makes no vault mutation and does not spin a retry loop within the same update.

**A13.** Victory decision freezes all Auto relic and wave actions. Keep the switch setting and pending rewards. With Auto ON, retained pending rewards do not block the player's Finish Run/Continue Endless buttons; a manual dialog or reservation still must resolve first. Continue carries stored AND pending rewards into the same endless run and arms a fresh five seconds before wave 31. Finish creates the existing single terminal victory result with those remaining relics unused, as already happens for unused stored relics. With Auto OFF, keep the existing manual FIFO victory reward choices and "Resolve rewards first" gate.

This is the deliberate boundary change required by retention: a large queue must not force many manual discards before the player can continue Auto into endless. A7, A11–A13 supersede only the prior progression spec's blanket pending-reward requirements and FIFO ordering for Auto paths. The prior manual reward rules, three-slot limit and prohibition on victory-time activation remain. Nothing is auto-discarded when finishing; the player's explicit Finish ends the run normally. Toggle behavior at victory follows A12: OFF exposes the manual choices; ON retains unopened queued rewards and permits the victory choice once any already-open manual dialog is resolved.

**A14.** Auto is ordinary player assistance, not QA/debug assistance. It must not set `debugAssisted` or change achievement qualification, relic drop probabilities, repair limits, score formulas, score version, run ID, terminal snapshots, manual score submission or Worker validation. Offline/API failure does not affect Auto or remove rewards. No external service is involved.

## Presentation

**A15.** Add one logical Auto toggle, using the house button and tokens, beside Speed and Pause in the game HUD. Reserve space by adjusting the existing HUD metric layout as needed; do not cover gold/lives/difficulty or remove Speed/Pause. Use explicit `Auto OFF` / `Auto ON` text and an active treatment, not color alone. Make countdown and waiting state visible: `Auto · 5s` through `Auto · 1s`, `Auto paused`, `Auto waiting for target/dialog`, and `Auto · victory decision` as applicable. The remaining-time display rounds up. Display retained pending count without blocking actions; fuller reason/count text can use the existing Battle Controls sheet. The Auto control remains visible during boss waves even when other status text is hidden.

Provide the same logical toggle in the pause menu so a player can disable Auto before resuming; this is not a second setting. Keyboard `A` toggles during Game, ignoring key repeats and editable HTML targets; show its hint in Battle Controls. Toggle input does not unpause, cast or start immediately, and is inert after the run ends. Register/detach this shortcut through the existing scene input lifecycle. Manual reward dialogs keep their current input capture; the shortcut may change the setting, but automation remains blocked until the dialog resolves.

**A16.** Use >=44px targets, house typography/contrast, ordinary focus/hover/input conventions and existing sheet scrolling. At 1440×900, 1280×720, 1024×768, 844×390, 390×844 and 360×640 the toggle, countdown, relevant waiting/pending status and manual Start are reachable with no label/control overlap. Dragging and canceled presses do not toggle. Resize preserves state; it cannot consume a relic, reset the five-second remainder, auto-resume a background pause or trigger a wave. Reduced motion needs no new animation; use text updates instead of a flashing indicator.

## Ordering and failures

**A17.** Resolve authoritative combat consequences, leaks/terminal transitions and wave clear/victory before proposing Auto work for that update. Terminal/victory takes precedence over countdown expiry or relic eligibility. When still playable, execute at most one validated relic action, resolve any resulting kills/clear/victory, then advance/request wave start against the resulting current state. A newly cleared wave receives its full five seconds, not elapsed time from the combat portion of that frame. Reward offers during these actions are queued/presented according to the current mode, without nested Auto execution.

The timer/control state is run-local, while decision snapshots are disposable. Stale item indices, vanished towers/enemies, changed wave/phase, an existing reservation or a new blocker cause a no-op and a fresh decision next eligible update. Validate selection and state before calling a mutating vault method. Preserve trust-boundary validation and visible failures in existing storage/API paths; do not convert errors to success to make Auto seem reliable. Render/input callbacks only change the setting or invoke the existing manual action, never run an Auto pump.

## Acceptance and verification

**A18. Policy tests:** Cover every table row eligible/ineligible, deadline equality, duplicate-buff prevention, full-lives repairs, no-tower behavior, Pilferer gating, all three Ancient Blessing outcomes remaining the existing implementation, and oldest-useful selection across stored/pending collections. Test Meteor count 2 vs 3, single boss, dead victims, exact radius, boss ties, stable ID ties and duplicate-Meteor target reuse. Verify that pure previews/decisions do not mutate input state.

**A19. Lifecycle tests:** Verify OFF on init/restart, ON preservation into endless, exactly 5000 eligible real milliseconds at each speed, no earlier start, clear-frame accounting, pause/background/dialog/manual-target suspension and resume, OFF/ON reset, rejected start, manual skip/race, a long/irregular frame starting only one wave, victory precedence, cleanup and stale callbacks. Keep separate tests for Auto ON waiting rewards permitting start and Auto OFF retaining the existing block.

**A20. Vault/scene tests:** Retain all rewards at full inventory, use a useful pending reward behind an ineligible head once, preserve unused order/metadata, handle repeated/stale intents and cancellation without consumption, cap committed Auto relics at one/update, and preserve manual FIFO behavior. Exercise real `GameScene` action paths for Gold Rush, repair, all buff deadlines, Treasure Creature spawning and Meteor killing/reward/siege effects. Verify no unintended panel closure, modal, fourth inventory slot, duplicate grant, debug flag, achievement change or backend call. Test ON/OFF transitions with retained queues, a manual dialog, and wave-30 victory with a large queue; test both Finish and Continue plus an OFF/manual victory regression.

**A21. Rendered checks:** At the six sizes, use native pointer/keyboard interaction to toggle, skip countdown, inspect/pause/disable, drag/cancel, rotate and background/resume. Observe a natural clear and automatic next start after five seconds, automatic useful relic consumption, a deferred full-health repair with a later useful reward, and at least one targeted Auto Meteor. Check current UI, listener cleanup, boss controls and no browser errors. Seeded QA is acceptable for rare states but must be labeled; do not substitute policy mocks for rendered integration evidence. Report unavailable physical touch or other-browser checks.

Run new regression tests before production code, then affected existing wave/reward/siege/UI tests, the full default suite and production build. The opt-in balance runners need not be rerun: no tuning or combat coefficients change. Do not weaken existing assertions; update only tests whose Auto-specific behavior is intentionally superseded and keep OFF/manual coverage.

After successful implementation verification, the already-authorized `npm run deploy` must run tests/build before publishing. Verify production HTML, its current JavaScript against the local build and `/api/health`; inspect the rendered live page and report the URL or a concrete failure. Commit/push the completed spec, reviewed plan, implementation/tests and verified documentation to the current remote branch, preserve unrelated work, and verify local HEAD equals the remote. This design-only stage requires no application deployment.
