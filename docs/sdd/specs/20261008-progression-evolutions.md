# Tower evolution and replay progression — Spec

**Status:** approved
**Date:** 2026-10-08

Source: adopted from the approved design `docs/superpowers/specs/2026-10-08-progression-evolutions-design.md` (approved by the user for implementation planning; review round 2 scored 9/10, zero blockers). This spec is a proposed amendment to the authoritative baseline `docs/SPEC.md`, not a competing permanent baseline. All numbers below are the design's values; tuning seeds are marked as such. Revision 2 folds in the user's answers to seven open questions (all recommended answers accepted, 2026-10-08). Revision 3 resolves the spec-review round 1 blocker with the user's decision on which events create a terminal result (AC-140, AC-141), and folds in eight should-fix items from the same review (`.sdd/review/20261008-progression-evolutions-spec-r1.md`).

## Goal

Players who exhaust tower upgrades around wave 10 get continued strategic development: a 30-wave siege in which defeating the wave-10 boss opens tower evolution, ending in a victory decision with an optional endless continuation that offers repeatable mastery. Branch achievements permanently unlock one alternative evolution per tower archetype in this browser, so repeat runs offer new strategic choices without permanent stat bonuses.

## Background

Verified against the codebase on 2026-10-08. The workspace is not a Git repository.

Towers and economy
- Five tower archetypes exist, each with exactly four levels: Ranger (`longbow`), Bombard (`ember`), Frost (`glacier`), Arcane (`starfire`), Tempest (`tempest`) — `src/game/config/towers.ts:6-97`.
- Level-4 rows (the evolution reference) — Ranger `src/game/config/towers.ts:22` (damage 85, cost 340), Bombard `:40` (damage 200, splash 90, attack interval 1.15 s, cost 480), Frost `:58` (slow 0.6 for 2.8 s, cost 420), Arcane `:76` (damage 190, cost 460), Tempest `:94` (chainCount 7, cost 520). Ranger's total foundation cost is 100+90+180+340 = 710 (`:19-22`).
- The Tempo relic multiplies attack intervals by 0.625 — `src/game/config/powerUps.ts:10`.
- Sell refund rate is 0.70 — `src/game/config/towers.ts:4`, `src/game/config/economy.ts:3`. The current refund is recomputed from configured prices by level, not from recorded spend — `src/game/systems/EconomySystem.ts:19-20`, `src/game/config/towers.ts:109-119`.
- A tower holds a single `level` 1..4 and its stats index the four-entry levels array — `src/game/entities/Tower.ts:9`, `:32-34`; `maxLevel` is true at level 4 — `:36-38`. The inspector shows "Final upgrade" at max level — `src/game/scenes/GameScene.ts:384`, `:1051`, `:1083`.
- Upgrading checks only selection, max level and gold, then increments `level` — `src/game/scenes/GameScene.ts:1123-1145`. Selling refunds by level and removes the tower — `:1147-1163`.
- The battlefield has nine build plots — `src/game/maps/map1.ts:54-57`.

Waves and bosses
- Waves are generated indefinitely by a pure deterministic builder — `src/game/systems/WaveSystem.ts:43-100`; bosses every 10 waves — `src/game/config/waves.ts:9`.
- Wave 10 schedules one Warlord — `src/game/systems/WaveSystem.ts:56`; wave 20 one Warlord at 1.8x HP — `:67`; waves 21+ use the endless mix — `:68-83`, where boss waves schedule `1 + floor((wave-20)/20)` Warlords (so one at wave 30, more from wave 40) — `:79`. A safety rule inserts a Warlord on any boss wave lacking one — `:86-88`. Boss groups are exempt from difficulty count scaling — `:92-97`.
- Wave 30 today is produced by the endless mix: tier = floor(30/10) = 3 (`src/game/systems/WaveSystem.ts:70`), so its single Warlord has hpScaleBonus 1 + 3 × 0.8 = 3.4 (`:79`), alongside the endless non-boss groups (`:71-77`).
- The next wave can start only when no wave is active, the run has not ended, nothing is paused and no Meteor target or pending reward exists — `src/game/scenes/GameScene.ts:1166-1167`; so a wave's boss is killed or has escaped before the following wave can be entered.
- Warlord: the only `isBoss` enemy — `src/game/config/enemies.ts:126-139`; costs 5 lives on escape — `:133`; regenerates 10/s — `:136`. Boss enrage below 30% HP (x1.4 speed) and summoning from wave 20 (2 every 8 s) — `src/game/config/enemies.ts:3-9`, `src/game/scenes/GameScene.ts:1863-1865`, `:1940`.

Relics, pause and speed
- Relic inventory limit is 3 — `src/game/config/powerUps.ts:3`. Meteor requires a target — `:27`; Time Lock freezes all enemies 4 s — `:9`, `:28`; Arcane Surge x1.5 — `:11`; Tower Overcharge x3 — `:14`; Stronghold Repair — `:31`; Treasure Creature — `:32`. Bosses guarantee a relic reward; milestone rewards every 5 waves — `:42-44`.
- The relic vault queues pending rewards, reserves a slot while targeting, cancels targets without consuming (`cancelTarget`) and resolves Store / Replace Oldest / Discard New — `src/game/systems/RunSimulation.ts:10-58` (`:48`, `:50-57`). The full-inventory choices today include Use Oldest — `src/game/systems/RewardSystem.ts:3`, `:17-25`.
- Pause reasons are `user`, `modal`, `background` and are orthogonal — `src/game/systems/PauseState.ts:1-7`. Hiding the page imposes a background pause — `src/game/scenes/GameScene.ts:208`, `:331`. Game speed is 1x/2x/3x — `src/game/scenes/GameScene.ts:236-237`, `:1000`.
- Time Lock is a global movement freeze timer — `src/game/scenes/GameScene.ts:94`, `:1509-1510`, `:1862`.
- Chain lightning: next victim must be living, not already hit this attack, within 130 units — `src/game/scenes/GameScene.ts:1682-1685`. Two multipliers apply: every chain-secondary impact (chain index > 0) deals x0.75 of its flight's damage — `:1680`; and each jump passes x0.85 of the current flight's damage to the next flight — `:1693`. So the k-th secondary impact (k ≥ 1) lands 0.75 × 0.85^k of the primary flight's damage.

Run end today
- The only path to a result today is `gameOver()`, called when lives reach 0 during enemy movement — `src/game/scenes/GameScene.ts:1895-1897`, `:2018`; the personal best is written there — `:2032-2033`.
- `wave` is 0 before the first wave starts — `src/game/scenes/GameScene.ts:59`, `:240`.
- The pause menu offers Restart Run and Quit to Menu, which start a new scene without creating a result — `src/game/scenes/GameScene.ts:943-944`; the pause menu opens unless a background pause or a non-pause modal is active — `:932-934`.
- Validation requires highestWave to be a non-negative integer and, under today's defeat-only semantics, highestWave ≥ 1 with enough possible leaked lives ("Wave progress cannot reach Game Over") — `src/shared/validation.ts:218`, `:268`.

Scores, storage and backend
- `GAME_VERSION = '0.1.0'`, `SCORE_VERSION = 1` — `src/shared/version.ts:3-4`.
- The result payload has no completion, outcome or milestone fields — `src/shared/types.ts:130-142`.
- Validation assumes `highestWave - 1` waves were completed — `src/shared/validation.ts:102`, `:155`, `:167`, `:265`.
- The Worker filters rankings by score version — `worker/index.ts:75-80`, orders by highest wave, final score, earliest creation — `:116`, `:121`, and rejects duplicate run IDs with 409 `DUPLICATE_RUN` — `:160-173`.
- The leaderboard response rows carry id, runId, playerName, difficulty, highestWave, finalScore, enemiesKilled, bossesKilled, remainingLives, gameDurationSeconds, gameVersion, scoreVersion and createdAt, plus a top-level scoreVersion — `worker/index.ts:75-80`, `:124`.
- D1 migrations 0001–0003 exist under `migrations/`.
- Local storage keys today: settings `aetherhold-settings-v1` and personal best `aetherhold-best-v1` — `src/game/systems/Settings.ts:12-13`; `saveBest` writes `aetherhold-best-v1` whenever a new score is higher — `:77-81`.
- The results scene submits the score automatically on create — `src/game/scenes/GameOverScene.ts:97`, `:284-317`. This spec replaces that with an explicit, retryable Submit Score action (AC-139).
- Scripts: `build`, `test`, `typecheck`, `deploy` (runs tests and build, then `wrangler deploy`), `db:migrate:local`, `db:migrate:remote` — `package.json:9-16`.
- Project instructions require deployment after each successful application change with `npm run deploy`, followed by live verification of the page, current JavaScript bundle and `/api/health` — `AGENTS.md`. This spec defines what counts as a deployable change for this feature (AC-138).

Context
- The baseline `docs/SPEC.md` exists and has a Progression section (`docs/SPEC.md:91`). An approved responsive-playability design exists at `docs/superpowers/specs/2026-10-08-responsive-playability-design.md` and must be preserved.
- A reviewed implementation plan exists at `docs/superpowers/plans/2026-10-08-progression-evolutions.md`; the planner will convert it. Each of its requirements traces to an AC below; presentation details it adds beyond this spec are planner defaults (see Decisions). The plan already uses the storage keys `aetherhold-unlocks-v1` and `aetherhold-best-score-v2` (`docs/superpowers/plans/2026-10-08-progression-evolutions.md:304`, `:419`) and mask values 1, 2, 4 (`:366`, `:399`); its purchase intents `foundation`/`upgrade` (`:164-165`, `:628`) are renamed by this spec (see Interfaces).

## Glossary terms

Used from `CONTEXT.md`: Run, Battlefield, Build plot, Control sheet, Relic, Pending reward, Background pause, Siege, Evolution, Evolution branch, Evolution rank, Mastery, Branch achievement, Unlock profile, Endless.

New terms appended to `CONTEXT.md`:
- **Starter branch:** The evolution branch of an archetype available from the first run.
- **Alternative branch:** The evolution branch of an archetype that becomes available only after its branch achievement.
- **Victory decision:** The frozen phase after the siege is won, in which pending rewards are resolved and the player chooses Finish Run or Continue Endless.
- **Siege failure:** A terminal result caused by a required boss (wave 10 or wave 30) escaping while lives remain.
- **Score era:** The set of scores sharing one score version; rankings and personal-best comparisons use only the current era.
- **Terminal result:** The single end-of-run record, created only by a lives-zero defeat, a siege failure or Finish Run; only a terminal result can be submitted as a score.
- **Discarded run:** A run ended by Restart or Quit; it creates no terminal result and no score submission.

## Requirements

### Acceptance criteria

Siege structure and phases
- **AC-1** A standard siege consists of waves 1–30 with scheduled bosses on waves 10, 20 and 30.
- **AC-2** Wave 30's scheduled composition is an explicit siege-finale definition in typed configuration: exactly one Warlord as the final boss, with its existing enrage and summoning abilities, alongside non-boss enemies; it is not derived from the endless multi-boss escalation. Its seed keeps today's wave-30 endless-mix non-boss groups and the Warlord's 3.4 HP bonus (`src/game/systems/WaveSystem.ts:70-79`); both are tunable under AC-32.
- **AC-3** Given the next wave is 30, when the next-wave preview and the boss warning are shown, then both label wave 30 as the siege finale; wave-10, wave-20 and endless boss warnings do not carry that label.
- **AC-4** A run is always in exactly one phase: siege (preparation or active wave), victory decision, endless (preparation or active wave), or terminal result; user, modal and background pause are independent blockers that never change the phase.
- **AC-5** Given endless play, waves 31 and beyond keep increasing enemy pressure with varied composition and bosses, and there is no mandatory additional victory.
- **AC-6** No mandatory inter-wave timer is introduced and no purchase is gated to waves 15 or 20.

Foundation, evolution purchase contract
- **AC-7** Foundation levels 1–4 keep their existing identity (stats, costs, art); a level-4 unevolved tower is presented as "Ready to evolve", not as a permanent final upgrade.
- **AC-8** Each tower's state explicitly records foundation level (1–4), branch (none or a valid branch of its archetype), evolution rank (0–3 when evolved, none otherwise), mastery rank (integer ≥ 0) and actual total gold invested; the four-frame art and four-entry stat tables are never indexed by evolution or mastery rank.
- **AC-9** Given the scheduled wave-10 boss has not been killed this run, when a level-4 tower's evolve options are inspected, then purchasing is disabled with the reason "defeat wave-10 boss".
- **AC-10** Given the scheduled wave-10 boss has been killed, when other wave-10 enemies are still alive, then a level-4 tower can purchase an available branch at evolution rank 0.
- **AC-11** Killing a spawned bonus target or any enemy other than the scheduled wave-10 boss does not open evolution.
- **AC-12** Given a tower at evolution rank r < 3, the only evolution purchase offered is rank r+1; ranks cannot be skipped and no rank above 3 exists.
- **AC-13** Given a tower with a branch, no purchase can change it to the other branch.
- **AC-14** Given branch selection is open, the branch's name, effect, price and the "permanent for this tower" commitment are shown before the single purchase action; there is no extra confirmation modal.
- **AC-15** Given branch selection is open, when it is canceled, then no gold is spent and the tower is unchanged.
- **AC-16** At commit time a purchase rechecks run state, the selected tower's identity and existence, prerequisites, next rank, branch availability and current gold; when any check fails, then no gold is spent, the tower is unchanged and the specific reason is shown.
- **AC-17** Given a purchase action prepared against a tower state, when the same action is delivered again (repeated input or stale action) after that purchase committed, then nothing further is purchased or charged.
- **AC-18** Building, foundational upgrades, evolution and selling keep their existing permission to occur during an active wave.
- **AC-19** Given a user, modal or background pause, the victory decision or a terminal result, when a build, upgrade, evolution, mastery or sell action is attempted, then it is rejected with no state change.
- **AC-20** The branches available to every tower in a run are the snapshot of unlocked branches taken at run creation; an achievement earned during the run does not change them.
- **AC-21** Given a fresh unlock profile, each archetype's starter branch is purchasable and its alternative branch is not.
- **AC-22** A locked alternative branch remains inspectable (name, effect, requirement) but is not purchasable, with the disabled reason "complete branch achievement".
- **AC-23** No unlock grants a permanent damage, gold or lives bonus.
- **AC-24** A purchase preserves the tower's cooldown, targeting mode and position; it grants no immediate free attack, does not reset special-attack counters (other than the counter starting at zero on first evolution, AC-50), heals no enemy and duplicates no in-flight impact.
- **AC-25** When a tower is sold, the refund is floor(0.70 × actual total gold spent on it), including evolution and mastery purchases, computed from recorded spend and never recomputed from current or later-tuned prices.
- **AC-26** Given a tower is sold and a new tower is built, the new tower may choose a different available branch but must repurchase its levels and evolution.
- **AC-27** When a tower is sold, its owned aura and ground effects are removed immediately, and debuffs it already applied to enemies expire normally.
- **AC-28** Each projectile snapshots its offensive stats, branch identity and aura contribution at firing; later upgrades or the owner's sale do not change that projectile's damage, effects or appearance.
- **AC-29** All prices, costs, refunds and gold balances are integers.

Evolution roster and stats
- **AC-30** There are exactly ten branches, one starter and one alternative per archetype: Ranger — Marksman / Volley; Bombard — Siegebreaker / Flame Mortar; Frost — Winterguard / Brittle Ice; Arcane — Spellbreaker / Arcane Beacon; Tempest — Stormcaller / Thunderlord.
- **AC-31** Branch stats derive from the archetype's level-4 stats by evolution rank 0–3: raw damage x[1.20, 1.55, 2.00, 2.60], attack interval x[1.00, 0.97, 0.94, 0.90], range x[1.00, 1.03, 1.06, 1.10], then the branch modifiers (AC-33 to AC-42); values are derived from the reference, never compounded by mutating current stats; non-overridden splash, slow and chain stats are preserved; raw damage is rounded to an integer before the existing armor calculation.
- **AC-32** All evolution, effect, price and mastery coefficients, and the wave-30 siege-finale composition and boss HP bonus (AC-2), live in typed configuration; the seed values in this spec may be tuned to meet AC-128 to AC-136, but branch identities, purchase stages, unlock requirements and wave 30's single-Warlord finale stay fixed, and final values are recorded with playtest evidence.
- **AC-33** Marksman (seed): raw damage x1.35, interval x1.25, damage to bosses x1.50; physical; one target.
- **AC-34** Volley (seed): raw damage x0.55 per arrow; each attack hits at most three distinct enemies in tower range; physical; never two arrows at one enemy in one attack.
- **AC-35** Siegebreaker: original physical splash, treating each victim's physical armor as 50% of its current value.
- **AC-36** Flame Mortar (seed): raw damage x0.75 physical impact with original splash, plus an elemental burning field at the impact point (AC-45 to AC-48).
- **AC-37** Winterguard (seed): original elemental slow; every fifth successful primary hit additionally freezes that target for 0.5 s (boss: 0.15 s).
- **AC-38** Brittle Ice (seed): elemental damage; slow factor 0.30 for 2 s, plus vulnerability for 3 s multiplying incoming damage by [1.15, 1.20, 1.25, 1.30] at evolution ranks 0–3.
- **AC-39** Spellbreaker: arcane damage treating the victim's current ward armor as 50% of its value.
- **AC-40** Arcane Beacon (seed): personal raw damage x0.60; other towers within 160 world units gain raw damage x[1.15, 1.20, 1.25, 1.30] at evolution ranks 0–3.
- **AC-41** Stormcaller (seed): elemental chain whose limit is the level-4 chain limit plus [2, 3, 4, 5] targets at ranks 0–3 (with today's level-4 limit of 7: 9, 10, 11, 12).
- **AC-42** Thunderlord (seed): raw damage x1.60, chain limit 3; every fifth successful primary hit stuns its primary target for 0.35 s (boss: 0.10 s).
- **AC-43** Evolution prices (seed) for ranks 0, 1, 2, 3 are ceil(level-4 upgrade cost × [1.50, 2.00, 2.75, 3.75]) and are identical for both branches of an archetype (e.g. Ranger rank 0 = 510).

Effect semantics
- **AC-44** The primary target uses the tower's existing targeting mode; Volley fills its remaining targets by that same ordering with ties broken by stable enemy ID.
- **AC-45** Burning field (seed): radius equals the shell's splash radius; lasts 3 s; ticks every 0.5 s starting 0.5 s after impact; each tick deals raw elemental damage equal to 0.30 of the shell's raw impact damage before armor and vulnerability.
- **AC-46** Each tower owns at most one active burning field; a new impact replaces that tower's field; overlapping fields from different towers damage independently; each victim takes at most one tick per field per scheduled tick. When a field is replaced, its ticks due at or before the replacement time are emitted first and its not-yet-due ticks are dropped (this also holds within one large frame delta, AC-48). Under continuous fire a field therefore yields at most two ticks before it is replaced (Bombard's level-4 interval is 1.15 s, about 1.04 s at rank 3; fewer under the Tempo relic); this is intended, and the full 3 s duration matters only after the tower's last shot.
- **AC-47** Burning fields expire on game time, and a wave cannot be detected as cleared while any field is active.
- **AC-48** Given a large frame delta, all due field ticks are processed exactly once, an already dead victim takes no damage, and no kill is credited twice; every enemy yields at most one death reward across all damage sources.
- **AC-49** A chain attack cannot hit the same victim twice, and existing chain reach and falloff rules apply (130-unit reach; x0.85 per jump and x0.75 on every chain-secondary impact).
- **AC-50** A hit counts as successful only if damage lands on a living target; fifth-hit effects count primary impacts only, never chain-secondary, splash or ground hits; the counter starts at zero when the tower evolves.
- **AC-51** Arcane Beacon affects other towers only (including other Beacons' personal attacks), never itself, without recursive aura magnification; each recipient gets only the largest active Beacon bonus; membership is evaluated at fire time.
- **AC-52** The Beacon bonus applies to tower damage and owned-ground damage through the shot snapshot and never to Meteor.
- **AC-53** Existing surge and overcharge multipliers apply exactly once to all tower-generated damage, with no second multiplication on ground ticks.
- **AC-54** Brittle vulnerability uses the largest unexpired magnitude; each application is tracked to its own expiry; a weaker new application cannot extend a stronger one's duration; vulnerability applies once, after armor, to tower, ground and relic damage.
- **AC-55** Freeze and stun stop movement but not regeneration or boss ability clocks, matching Time Lock's movement behavior.
- **AC-56** The strongest active slow applies; movement stops while any freeze or stun is active; different controls do not add their durations together.
- **AC-57** Tower-applied freeze or stun lands at most once per enemy per 1.5 game seconds, shared across all towers; Time Lock remains independently usable.
- **AC-58** Boss-specific control durations apply according to the enemy's boss flag.
- **AC-59** Dead or escaped enemies ignore later effects.
- **AC-60** Armor penetration never affects the other armor channel and never produces negative armor.
- **AC-61** All effect durations and attack behavior advance on game time: they stop during user, modal and background pause and scale with 1x/2x/3x speed.

Presentation
- **AC-62** The tower inspector shows the branch name and rank, the current role and rank, next stats, cost, and when an action is disabled one specific reason from: reach level 4, defeat wave-10 boss, complete branch achievement, insufficient gold, finish evolution, continue into endless, paused/ended, numeric limit reached.
- **AC-63** An evolved tower shows a branch-specific weapon or crown accent on its existing art; branches are distinguishable by label and silhouette, not by color alone; no new full sprite atlas is required.
- **AC-64** Marksman and Volley arrows, burning areas, control and debuff markers are visually distinguishable, and the Beacon radius is shown when the Beacon is selected; projectile appearance follows the branch captured at firing.
- **AC-65** Locked, evolve, upgrading and mastery states use the existing inspector/control sheet with existing tokens, fonts, sheet scrolling, 44 px touch targets, safe-area layout, focus affordances and reduced-motion rules.

Economy and mastery
- **AC-66** Mastery can be purchased only in endless, on a tower at evolution rank 3, during an active playable run.
- **AC-67** Each mastery rank m gives damage baseRank3Damage × (1 + 0.05 × m) (additive), improving direct, splash, chain and owned-ground damage only, not aura strength, penetration, vulnerability, control strength or duration, range or attack rate.
- **AC-68** The seed cost of the next mastery rank m+1 is ceil(rank3PurchaseCost × 1.25^(m+1)), where the current m starts at 0; the inspector displays the mastery rank, next damage and cost.
- **AC-69** When the next mastery price or stat is numerically unsafe or unrepresentable, purchasing is disabled with a visible limit reason; NaN, infinity, a price rounding to free and loss of integer gold precision never occur; otherwise there is no gameplay rank cap.
- **AC-70** In endless, towers that have not reached rank 3 can still buy their remaining evolution ranks; mastery follows rank 3.
- **AC-71** Restarting resets all run development (towers, ranks, mastery, gold); only earned alternative-branch unlocks persist.

Branch achievements
- **AC-72** There are exactly five branch achievements, one per archetype, each unlocking that archetype's alternative branch.
- **AC-73** Given wave 20 is successfully completed with lives > 0, when an archetype has at least one starter-branch tower still present at evolution rank ≥ 2, then that archetype's alternative is unlocked; this holds on every difficulty and several archetypes may unlock in the same event.
- **AC-74** An achievement is not earned when the qualifying tower is rank 1, is on the alternative branch, was sold before the wave-clear event, reached rank 2 only after wave 20 completed, or when the run reached zero lives during wave 20; defeating the wave-20 boss is not required (enemies may be killed or leak as lives permit).
- **AC-75** Achievements are evaluated exactly once, from the authoritative wave-complete event, after combat consequences and before the next-wave or victory UI.
- **AC-76** Achievements are never earned from QA grants, previews, render or resize callbacks, or debug-assisted runs (any run altered by a gameplay-mutating debug/QA command).
- **AC-77** An earned unlock is saved at earn time and remains after defeat, quit, restart, victory and page reload.
- **AC-78** An unlock earned during a run becomes available starting with the next run's availability snapshot.
- **AC-79** When achievements are earned, a brief nonblocking notice appears per earned achievement (not covering or blocking Pause or boss controls), and the results summary lists them.
- **AC-80** A menu Progression panel lists the five achievements with their requirements, earned state and saved state (confirmed-saved versus earned-but-unsaved), and both branches per archetype, without taking permanent battlefield space; the menu panel does not show any run's qualification. During a run, a locked alternative branch in the tower inspector shows its requirement and the current run's qualification state.

Unlock persistence
- **AC-81** The unlock profile is a separate, versioned local record stored under the key `aetherhold-unlocks-v1`; the current-era personal best is stored under the key `aetherhold-best-score-v2`; the settings key `aetherhold-settings-v1` and its data format are unchanged, and the legacy personal-best entry `aetherhold-best-v1` is never written by the new version, so its bytes stay unchanged.
- **AC-82** An empty profile means all starter branches and no alternatives, with no warning.
- **AC-83** When the stored profile cannot be read, or has a known version but malformed content, it is treated as unreadable: the game uses a starter profile and shows an understandable progress-storage warning, and unlocks earned while the stored data is unreadable are kept in memory and shown as earned but unsaved.
- **AC-84** Unreadable data (including malformed known-version data) and data with a newer unsupported version are never automatically overwritten: their original stored bytes stay unchanged, and an unlock write occurs only when the stored entry is absent or is a readable supported profile.
- **AC-85** Only recognized alternative-branch IDs count as unlocks; unknown IDs are ignored.
- **AC-86** Writes merge the recognized persisted unlocks with current earned unlocks, are idempotent, and preserve each branch's original earned timestamp.
- **AC-87** Given two tabs earn different unlocks, they converge through storage-change notifications by merging before writing, and the next run in either tab loads the persisted union.
- **AC-88** When a save fails, the unlock stays available in memory, the message "Unlock earned, but progress could not be saved" is shown, a retry happens on the next earn and at next run creation (subject to AC-84), and the UI distinguishes session-available from confirmed-saved unlocks.
- **AC-89** No UI removes or resets unlocks, and a failed backend request never removes unlocks; clearing browser site data resets the profile.
- **AC-90** Existing local personal bests are retained as legacy records when the score era changes, and new personal-best comparisons use only current-era scores. Wherever the personal best is displayed today, a retained legacy best is shown separately and labelled "Legacy"; it is never compared with, ranked against or replaced by current-era scores.

Boss milestones, victory and siege failure
- **AC-91** Given the scheduled wave-10 boss escapes while lives remain, then the run ends with the result "Siege failed: the first boss escaped".
- **AC-92** Given the scheduled wave-30 boss escapes while lives remain, then the run ends with the result "Siege failed: the final boss escaped".
- **AC-93** Other leaks, including the wave-20 boss, follow the existing lives rules.
- **AC-94** Victory occurs only when wave 30 is fully resolved (spawn queue, living enemies, in-flight projectiles and active ground effects all empty), the final boss was killed and lives > 0; the boss's death alone does not trigger victory.
- **AC-95** The achievement evaluator runs on every wave-complete event (AC-75) and can qualify only on the completion of wave 20 (AC-73); on wave 30's completion the wave-clear bonus is applied exactly once and the evaluator runs once without earning any achievement.
- **AC-96** Given lives reach zero, then the result is defeat even if victory conditions would otherwise be met.
- **AC-97** On entering the victory decision, any uncommitted Meteor target is canceled through the existing vault cancellation path without consuming its reserved relic, the simulation freezes, and battlefield, build, upgrade and relic-activation input is blocked while reward navigation input remains available.
- **AC-98** The victory decision shows "Siege complete" with score, lives and unlocks, and offers Finish Run and Continue Endless.
- **AC-99** During the victory decision pending relics are resolved in FIFO order with Store (when space exists), Replace Oldest (when full) or Discard New; relic activation and Use Oldest are unavailable with the reason "Continue into endless to use relics"; no relic is ever auto-used; a full inventory always has Replace Oldest and Discard New exits.
- **AC-100** During the victory decision no enemy spawns and no gameplay effect occurs (no Meteor targeting, no repair changing the result, no Treasure Creature).
- **AC-101** Reward reveal and navigation use visible UI time while the simulation stays frozen; backgrounding suspends them and preserves pending selections.
- **AC-102** Finish Run and Continue Endless are disabled until the vault has no pending reward or target and no reward modal is open; an empty queue needs no extra interaction; repeated resolution cannot store or replace twice.
- **AC-103** The victory decision, reward state, branch state and pause reasons survive resize, rotation and backgrounding.
- **AC-104** The victory-only relic restriction applies only in the victory decision; reward behavior earlier in the run is unchanged.
- **AC-105** When Continue Endless is chosen, the same run ID, towers, gold, lives, targeting, stored relics and cumulative statistics carry over, the next wave is 31, mastery opens, and no score is submitted and no Submit Score action is offered.
- **AC-106** When Finish Run is chosen, exactly one terminal victory result is created, remaining stored relics are left unused, and the explicit Submit Score flow of AC-139 is exposed.
- **AC-107** Given a defeat in endless, exactly one terminal result is created with the cumulative score and a visible prior siege victory.
- **AC-108** Repeated clicks cannot end or continue a run twice, cannot start wave 31 before Continue Endless is chosen, and cannot submit two result snapshots for one run.
- **AC-109** Restart and quit (which discard the run, AC-141) perform existing cleanup plus removal of burning fields, aura/effect subscriptions, hit counters, transient notifications and modal/input callbacks.
- **AC-140** Exactly three event kinds create a terminal result: (a) lives reaching zero, in the siege or in endless — outcome defeat; (b) a siege failure (AC-91, AC-92) — outcome siege-failed; (c) choosing Finish Run in the victory decision — outcome victory. No other event — including Restart, Quit, closing or reloading the page, Continue Endless, or a run whose first wave never started — creates a terminal result, a results screen, a Submit Score action or a personal-best update.
- **AC-141** Pause remains reachable during the victory decision and in endless under the existing pause-menu rules (not during a background pause or while another modal is open), and its Restart Run and Quit to Menu actions remain available there. Given the victory decision or endless, when Restart or Quit is chosen, then the run is discarded: no terminal result is created, no score is submitted, no Submit Score action is offered and the personal best is unchanged; earned unlocks are kept (AC-77). To bank a won siege the player must choose Finish Run. Restart and Quit during the siege phase likewise discard the run.

Score and backend compatibility
- **AC-110** GAME_VERSION and SCORE_VERSION are bumped for the new era; stored old-era scores are retained and excluded from current rankings as today; ordering stays highest wave, then score, then earliest timestamp; owning unlocks gives no score bonus.
- **AC-111** The terminal score contract adds wavesCompleted, outcome (victory, defeat, siege-failed) and a siegeBossesDefeated milestone mask.
- **AC-112** highestWave is the highest entered wave: a victory has highestWave = wavesCompleted = 30; a defeat or siege failure during wave w has highestWave = w and wavesCompleted = w − 1 (endless defeat included). Because no terminal result can be created before wave 1 starts (AC-140), every terminal result has highestWave ≥ 1; the existing minimum-wave validation is unchanged.
- **AC-113** A result's remainingLives is the actual lives remaining (positive for a positive-lives siege failure, not forced to zero).
- **AC-114** Wave bonuses, spawn/duration plausibility, kill bounds, repairs and rewards are validated from the explicit completion and outcome, never by assuming highestWave − 1 waves completed.
- **AC-115** The Worker accepts a legitimate wave-30 victory, a positive-lives siege failure and an endless defeat.
- **AC-116** The Worker rejects invalid completion/outcome combinations, a victory with other than exactly 30 completed waves, a victory whose mask lacks the wave-10 or wave-30 boss, a mask inconsistent with bossesKilled or with entered/completed waves, a payload violating the validity rules of AC-142, non-finite fields, incompatible score versions (including legacy-version payloads) and duplicate run IDs; a victory does not require the wave-20 boss.
- **AC-117** All existing forged-score rejection cases remain rejected.
- **AC-118** New score fields are added by an additive D1 migration with legacy defaults; no old score is deleted; the migration is applied before publishing a Worker that expects the new columns.
- **AC-119** The client and the Worker use one shared payload definition and validation.
- **AC-120** Given the score API is unavailable, victory and endless remain playable and local results and unlocks are kept.
- **AC-139** Every terminal result screen (finished victory, defeat, siege failure and endless defeat; AC-140) offers an explicit Submit Score action; nothing is submitted automatically when the results screen opens or at any earlier point. A submission failure (offline, network or server error) shows the reason and leaves Submit Score available to retry from the same screen with the same result snapshot; existing duplicate-run handling and offline behavior are kept; after a successful submission the action cannot submit again.
- **AC-142** Shared validation enforces these terminal-result validity rules, and the client never produces a result that breaks them: highestWave ≥ 11 requires the wave-10 bit; highestWave ≥ 31 also requires the wave-30 bit; outcome defeat requires remainingLives = 0; outcome victory and siege-failed require remainingLives > 0; siege-failed occurs only with highestWave 10 or 30 and without that wave's bit; a milestone bit is set only when its wave was entered (wave-10, -20, -30 bits require highestWave ≥ 10, 20, 30 respectively); the number of set bits is ≤ bossesKilled.
- **AC-143** `GET /api/leaderboard` rows include wavesCompleted, outcome and siegeBossesDefeated in addition to the existing fields, and the existing per-row and top-level scoreVersion report the new era's score version.

Responsive and runtime
- **AC-121** At 1440x900, 1280x720, 1024x768, 844x390, 390x844 and 360x640, evolution preview and commit, locked alternatives, the achievement list and notice, mastery, victory and rewards, final results (including Submit Score and its retry state), pause/background, rotation and replay show no UI overlap, clipped labels or actions, blocked Pause, input falling through panels, or unbounded particles or fields.
- **AC-122** Victory and result actions are reachable in both orientations, and existing responsive behavior remains intact.

Baseline and boundaries
- **AC-123** `docs/SPEC.md` is amended for evolution, achievements, victory, endless, explicit score submission and score semantics (including final tuned coefficients), preserving the approved responsive-playability contract and the original fantasy visual identity.
- **AC-124** Progression decisions and effective combat stats are computed independently of the rendering layer; scenes render and dispatch actions and do not own storage validation, branch arithmetic or duplicated victory detection.
- **AC-125** Existing economy, reward vault, projectile, pause and wave systems are reused, and no new framework or product dependency is added.

Balance and playtest evidence (recorded Medium playtests at 1x unless stated)
- **AC-126** Seed stats and prices are tuned using deterministic economy/simulation fixtures together with the recorded playtest gates.
- **AC-127** At equal investment, comparing boss/isolated targets, armored/resistant targets, clustered crowds and support combinations, no branch outperforms its alternative in every tested role.
- **AC-128** The first evolution is affordable within waves 11–13 without selling the core defense and without relying on power-up luck.
- **AC-129** At least one rank-2 evolution is achievable before wave 20 without relying on power-up luck.
- **AC-130** Meaningful build, evolution or upgrade purchase opportunities exist throughout waves 11–29, with no forced wait exceeding three consecutive completed waves for an otherwise viable progressing mixed build.
- **AC-131** A successful representative mixed build has 2–5 fully evolved towers at victory.
- **AC-132** All nine plots cannot be fully evolved before wave 25 from ordinary rewards.
- **AC-133** A competent Medium run at 1x, including ordinary preparation, lasts 20–30 minutes. This is a recorded pass/fail gate evaluated on the Medium starter-profile playtests of AC-134: each recorded duration passes or fails against the range, outliers are explained, and a conflict with other gates is reported under AC-135. The game never enforces it (no countdown, timer, mandatory wait or duration-based rule).
- **AC-134** At least two Medium starter-profile playtests, one unlocked-profile playtest and Easy and Hard sanity runs are recorded with purchase waves, tower composition, gold, leaks, random rewards and 1x active-plus-preparation duration; outliers are explained; no claim of universal balance or measured retention is made.
- **AC-135** When timing and economy gates cannot coexist, the concrete conflict is reported rather than any criterion being weakened silently.
- **AC-136** Endless sanity checks confirm increasing pressure beyond wave 30 (AC-5) and safe mastery arithmetic (AC-69).

Release gates
- **AC-137** `npm run typecheck`, `npm test` and `npm run build` pass, with existing test assertions preserved.
- **AC-138** Partially integrated increments of this feature are not deployed. The first deployment happens only when the complete feature, including usable in-game progression controls, passes AC-137 and its change-specific verification; the additive migration is applied to the remote database before that deployment. Deployment uses `npm run deploy` (which reruns tests and build before publishing); afterwards the production page, its currently referenced JavaScript bundle and `/api/health` are verified and the live URL and any failure are reported. Each later successful tuning change is deployed through the same gates. Writing this spec alone triggers no deployment and establishes no gameplay gate as passed.

### Unhappy paths

Evolution purchases
- Empty: no tower selected or the selected tower no longer exists at commit → rejected, nothing spent (AC-16).
- Zero: insufficient gold → disabled with "insufficient gold"; commit-time recheck spends nothing (AC-16, AC-62).
- Partial: tower below level 4 → "reach level 4" (AC-62); tower mid-evolution asking for mastery → "finish evolution" (AC-62, AC-66); rank 3 in siege → "continue into endless" (AC-62, AC-66).
- Expired / stale: action prepared against an older tower state or delivered twice → no second purchase (AC-17); branch selection canceled → nothing spent (AC-15).
- Concurrent: purchase during an active wave allowed (AC-18); during pause, victory decision or terminal → rejected (AC-19); an achievement earned mid-run does not change availability (AC-20).
- First-run: fresh profile → starters only, alternatives locked and inspectable (AC-21, AC-22).
- Dependency failure: wave-10 boss not yet killed → "defeat wave-10 boss" (AC-9); boss escapes → siege failure (AC-91); mastery arithmetic unsafe → disabled with "numeric limit reached" (AC-62, AC-69).

Combat effects
- Empty: no other towers in Beacon range → no bonus (AC-51); fewer than three enemies in range → Volley hits only those present, no duplicates (AC-34, AC-44).
- Zero: armor already zero → penetration produces no negative armor (AC-60).
- Partial: chain runs out of unvisited victims → chain ends (AC-49); primary killed by the fifth hit → counts only if damage landed on a living target (AC-50); field replaced by a new impact → due ticks emitted, not-yet-due ticks dropped (AC-46).
- Expired: vulnerability/slow applications expire independently; weaker cannot extend stronger (AC-54, AC-56); fields expire on game time (AC-47).
- Concurrent: overlapping fields from different towers (AC-46); multiple Beacons (AC-51); simultaneous freeze/stun from several towers (AC-57); Time Lock alongside tower control (AC-55, AC-57); upgrade or sale while projectile in flight (AC-28, AC-27).
- Large delta / pause / speed: catch-up without double kill (AC-48); a delta spanning a field replacement emits the old field's due ticks once and drops the rest (AC-46, AC-48); pause and 1x/2x/3x (AC-61).
- Dead/escaped targets: ignore later effects (AC-59); one death reward per enemy (AC-48).

Achievements and unlock persistence
- Empty: no profile stored → starter profile, no warning, writes allowed (AC-82, AC-84); no qualifying tower at wave 20 → nothing earned (AC-74).
- Zero: zero lives during wave 20 → no achievement (AC-74).
- Partial: rank 1 starter, alternative-branch tower, tower sold before wave clear, rank 2 bought after wave 20 → not earned (AC-74); known-version profile with malformed content → treated as unreadable (AC-83, AC-84).
- Expired: next run only — current run's snapshot unchanged (AC-20, AC-78).
- Concurrent: two tabs earning different unlocks converge (AC-87); repeated evaluation earns once (AC-75, AC-86); evaluation at wave-30 completion earns nothing (AC-95).
- First-run: fresh profile (AC-21, AC-82); menu panel shows all five achievements unearned (AC-80).
- Dependency failure: storage read failure or malformed data → warning plus starter fallback, original bytes untouched, new unlocks held in memory as unsaved (AC-83, AC-84); newer-version data not overwritten (AC-84); write failure → in-memory unlock, message and retry (AC-88); backend failure never removes unlocks (AC-89, AC-120); debug-assisted run → no achievement (AC-76).

Personal best
- Empty: no legacy best stored → no "Legacy" entry shown (AC-90).
- First-run in new era: legacy best shown labelled "Legacy"; the first current-era score becomes the current best even if lower (AC-90).
- Partial: run discarded by Restart or Quit → personal best unchanged (AC-140, AC-141).
- Dependency failure: personal-best storage unavailable → existing behavior; legacy record `aetherhold-best-v1` never rewritten (AC-81, AC-90).

Siege lifecycle and victory decision
- Empty: empty reward queue at victory → no extra interaction needed (AC-102).
- Zero: zero lives at wave 30 → defeat, not victory (AC-96).
- Partial: final boss dead but enemies, flights, spawns or fields remain → no victory yet (AC-94); full inventory at victory → Replace Oldest / Discard New exits (AC-99); Meteor targeting in progress at victory → canceled without consuming (AC-97).
- Expired: wave-10 or wave-30 boss escapes with lives left → siege failure (AC-91, AC-92); wave-20 boss escape → existing lives rules (AC-93).
- Concurrent: repeated Finish/Continue clicks, attempt to start wave 31 early (AC-108); resize/rotation/backgrounding during victory decision (AC-101, AC-103); Pause opened during the victory decision → phase unchanged, Restart and Quit available (AC-4, AC-141); Restart or Quit during the victory decision or in endless → run discarded, no result, no submission (AC-141).
- First-run: Restart or Quit before the first wave starts → run discarded, no result and no Submit Score (AC-140, AC-141).
- Dependency failure: score API unavailable at victory or endless → play continues, local data kept (AC-120); nothing is submitted at Continue Endless (AC-105).

Score submission and backend
- Empty: run discarded at any point (before wave 1, during the siege, the victory decision or endless) → no terminal result, nothing to submit (AC-140, AC-141).
- Zero: positive-lives siege failure keeps actual lives (AC-113); a defeat always reports remainingLives 0 (AC-142).
- Partial: endless defeat during wave w (AC-112, AC-107, AC-139).
- Expired: results screen left without submitting → nothing is submitted (AC-139).
- Concurrent / duplicate: repeated Submit Score clicks → one submission (AC-108, AC-139); duplicate run ID → rejected with existing handling (AC-116, AC-139); two result snapshots for one run prevented client-side (AC-108).
- Forged: invalid completion/outcome/mask, mask or lives breaking the validity rules, legacy version, non-finite fields → rejected (AC-116, AC-117, AC-142).
- Dependency failure: submission fails offline or with a server error → reason shown, retry available with the same snapshot (AC-139); migration not yet applied → Worker expecting new columns is not published (AC-118, AC-138); API unavailable (AC-120); migration failure → publishing stops (AC-138).

Release
- Partial: feature only partly integrated or controls not yet usable → not deployed (AC-138).
- Dependency failure: tests, build or live verification fail → deployment blocked or failure reported (AC-137, AC-138).

## Interfaces and contracts

Tower progression state (per tower, per run)
- foundationLevel: integer 1–4
- branch: BranchId or none
- evolutionRank: integer 0–3 when branch is set; none otherwise
- masteryRank: integer ≥ 0; > 0 only at evolutionRank 3
- invested: non-negative safe integer, actual gold spent on this tower
- a change token that lets a commit detect a stale action (AC-17)

BranchId: one of marksman, volley, siegebreaker, flame-mortar, winterguard, brittle-ice, spellbreaker, arcane-beacon, stormcaller, thunderlord. Each belongs to exactly one archetype and is flagged starter or alternative (AC-30).

Purchase request: kind, target tower identity, expected tower state token. Kind is one of:
- foundation-upgrade — raises foundationLevel L → L+1 for L in 1–3 (the existing level upgrade).
- evolve(branch) — the first evolution of an unevolved level-4 tower onto an available branch, setting evolutionRank 0.
- evolution-rank — raises an evolved tower's evolutionRank r → r+1 for r in 0–2.
- mastery — raises masteryRank m → m+1 on an evolutionRank-3 tower in endless.
Purchase result: either success {new tower state, new gold, cost} or failure {reason}. Disabled/failure reasons: reach level 4; defeat wave-10 boss; complete branch achievement; insufficient gold; finish evolution; continue into endless; paused/ended; numeric limit reached.

Run phase: siege | victory-decision | endless | terminal. Pause reasons (user, modal, background) are separate. Terminal is entered only through the three events of AC-140. Restart or Quit from any phase discards the run without entering terminal (AC-141).

Unlock profile (local, versioned; storage key `aetherhold-unlocks-v1`)
- version: integer (the first version of this record)
- earned: map BranchId (alternatives only) → earned timestamp (ISO 8601 string)
- Stored-entry classification on read: absent | readable supported | unreadable (cannot be parsed, or known version with malformed content) | unsupported newer version. Writes are permitted only for absent and readable supported (AC-84).
- Run-start snapshot: set of BranchId available to this run.
- Session view: profile, set of earned-but-unsaved BranchIds, warning text or none.

Personal best (local): current-era record under storage key `aetherhold-best-score-v2`, plus the read-only legacy record `aetherhold-best-v1` (never written), displayed labelled "Legacy" (AC-81, AC-90). Updated only when a terminal result is created (AC-140).

Terminal result payload (shared by client and Worker), existing fields plus:
- wavesCompleted: integer ≥ 0
- outcome: victory | defeat | siege-failed
- siegeBossesDefeated: integer bitmask, one bit per required siege boss (wave 10, wave 20, wave 30; plan uses values 1, 2, 4)
- Existing fields kept: playerName, difficulty, highestWave, finalScore, enemiesKilled, bossesKilled, remainingLives, gameDurationSeconds, runId, gameVersion, scoreVersion.
- Created only by the events of AC-140: lives-zero defeat ⇒ defeat; siege failure ⇒ siege-failed; Finish Run ⇒ victory.
- Validity (AC-112, AC-116, AC-142): highestWave ≥ 1 (unchanged minimum); victory ⇒ highestWave = wavesCompleted = 30, remainingLives > 0, mask includes wave-10 and wave-30 bits; defeat/siege-failed during wave w ⇒ wavesCompleted = w − 1; defeat ⇒ remainingLives = 0; siege-failed only at wave 10 or 30 with remainingLives > 0 and without the escaped boss's bit; highestWave ≥ 11 ⇒ wave-10 bit set; highestWave ≥ 31 ⇒ wave-30 bit also set; a bit only for an entered milestone wave; count of set bits ≤ bossesKilled.
- Errors: existing Worker validation rejection format; duplicate run → existing 409 `DUPLICATE_RUN` (`worker/index.ts:173`).

Score submission (client): user-initiated from the terminal result screen only. Submission state per terminal result: not submitted | submitting | submitted | failed (reason, retryable). One result snapshot per run; a retry resends that same snapshot; never triggered by Continue Endless, Restart or Quit (AC-105, AC-139, AC-141).

Leaderboard read (`GET /api/leaderboard`): each row adds wavesCompleted (integer), outcome (victory | defeat | siege-failed) and siegeBossesDefeated (integer mask) to the existing fields; the existing per-row and top-level scoreVersion carry the new era's version (AC-143).

Score storage: three new columns (waves completed, outcome, siege bosses defeated) with legacy defaults via additive migration (AC-118).

## Data and state

- Tower progression state: in memory per run, owned by the run; changed only by committed purchase transactions; discarded on sale, restart, quit or terminal result (AC-8, AC-71).
- Shot snapshots: per projectile, immutable after firing (AC-28).
- Effect state (slows, vulnerability, freeze/stun with shared 1.5 s immunity, burning fields, hit counters): in memory, game-time based, removed on enemy death/escape, owner sale (owned fields), restart, quit and terminal (AC-27, AC-59, AC-109). A replaced burning field is removed after its due ticks are emitted (AC-46).
- Siege phase, highest entered wave, completed waves and boss milestone mask: in memory per run; Continue keeps them (AC-105); discarded on restart or quit (AC-141).
- Run unlock snapshot: taken at run creation; immutable for the run (AC-20).
- Unlock profile: browser local storage under `aetherhold-unlocks-v1`, a separate versioned entry; written at earn time and retried at next earn/run creation; merged across tabs; never reset by UI; reset only by clearing site data; not an authoritative anti-cheat record (AC-81 to AC-89). When the stored entry is unreadable (including malformed known-version content) or of a newer unsupported version, its bytes are left untouched and session unlocks live only in memory, marked unsaved, until a later read finds the entry absent or readable and supported (AC-83, AC-84, AC-88).
- Personal best: current-era record under `aetherhold-best-score-v2`, compared by current score version and updated only at a terminal result; legacy record `aetherhold-best-v1` kept byte-for-byte unchanged and displayed labelled "Legacy", never compared (AC-81, AC-90, AC-140).
- Terminal result snapshot and submission state: in memory on the results screen; created once per run, only by an AC-140 event; a discarded run creates none; discarded on leaving the screen, restart or quit (AC-108, AC-139, AC-140, AC-141).
- Scores: Cloudflare D1, additive columns, old-era rows retained and filtered from current rankings (AC-110, AC-118).
- Settings: unchanged key `aetherhold-settings-v1` and data (AC-81).

## Non-functional requirements

- Determinism and timing: all combat effects advance on game time and honor pause and 1x/2x/3x (AC-61).
- Numeric safety: all gold, prices and investment are safe integers; no NaN, infinity or free-by-rounding purchases (AC-29, AC-69).
- Boundedness: at most one burning field per tower (nine plots ⇒ at most nine fields); particles and fields bounded at runtime (AC-46, AC-121).
- Accessibility: 44 px touch targets, focus affordances, reduced-motion rules, labels and silhouettes not color alone (AC-63, AC-65).
- Responsiveness: the six named viewports pass without overlap, clipping or input fall-through (AC-121, AC-122).
- Availability: gameplay, victory, endless and unlocks do not depend on the score API; score submission is retryable (AC-120, AC-139).
- Data preservation: no unreadable or newer-version unlock data, legacy personal best (`aetherhold-best-v1`) or old-era score is overwritten or deleted (AC-81, AC-84, AC-90, AC-118).
- Integrity: backend validation is plausibility checking of a client claim, not authoritative replay verification; local unlocks are not anti-cheat (AC-116, AC-142, Data and state).
- Playtime: a competent Medium run targets 20–30 minutes at 1x, proven by recorded playtests, never enforced in game (AC-133).
- Operability: only the complete feature is deployed; deployment verifies page, current bundle and `/api/health` (AC-138).
- Dependencies: no new framework or product dependency (AC-125).

## Risk areas

- Auth: not touched (no accounts).
- Money: no real money; in-game gold accounting changes (atomic purchases, refunds from actual spend) — correctness risk, not financial.
- Schema or migrations: yes — additive D1 migration adding three columns with legacy defaults; must be applied to the remote database before the first Worker publish; old scores must never be deleted.
- Public contracts: yes — the score submission payload and Worker validation change (new required fields wavesCompleted, outcome, siegeBossesDefeated; new score era; new rejection rules including AC-142); the `GET /api/leaderboard` response rows gain wavesCompleted, outcome and siegeBossesDefeated, and scoreVersion reports the new era (AC-143); client and Worker must ship together. Score submission changes from automatic to user-initiated and retryable (AC-139), and only the three AC-140 events produce a submittable result.
- PII: no new personal data; existing player name submission unchanged.
- Deletion: no score deletion; unlock removal from UI excluded; browser site-data clearing resets the profile; unreadable (including malformed known-version) or future-version local data must not be overwritten; legacy personal best must not be overwritten. A run discarded by Restart or Quit loses its unbanked result by design (AC-141).
- Local storage: new persisted records `aetherhold-unlocks-v1` and `aetherhold-best-score-v2` alongside the unchanged `aetherhold-settings-v1`; legacy best `aetherhold-best-v1` preserved and displayed, never written.
- Release: a partial deployment would publish a Worker or client out of step with the migration or with unusable controls; AC-138 limits deployment to the complete feature.

## Decisions

- Chose explicit tower branches, a small unlock profile and a siege state machine over extending flat levels indefinitely, because flat levels cannot express alternative roles or achievement-locked branches and conflict with the agreed strategic variety.
- Chose that over a general talent/loadout/reward framework, because it adds systems the player did not choose and makes progression harder to explain.
- Chose a 30-wave siege with bosses at 10/20/30 and a victory decision, to make wave 10 a progression transition and give runs an ending.
- Chose to open evolution only on killing the scheduled wave-10 boss, and to end the run as a siege failure if the wave-10 or wave-30 boss escapes with lives remaining, because the siege cannot otherwise continue through its required progression milestones.
- Chose to snapshot unlocked branches at run creation, so an achievement earned during a run changes only later runs.
- Chose achievements that unlock choices, not permanent damage/gold/lives bonuses.
- Chose refunds from recorded actual spend, so later price tuning never rewrites historic investment.
- Chose per-projectile stat snapshots and fire-time aura sampling, so upgrades and sales never rewrite in-flight attacks.
- Chose victory-decision reward resolution with Store/Replace/Discard only, because activation would allow Meteor targeting, repair changing a frozen result or a Treasure Creature spawning on a cleared battlefield.
- Chose mastery only in endless, as additive damage with geometric cost, to extend meaningful spending without promising indefinite survival.
- Chose explicit wavesCompleted/outcome/milestone-mask fields over the highestWave − 1 assumption, because victory and positive-lives siege failure need distinct, valid payloads.
- Chose not to require the wave-20 boss for victory, because the agreed achievement/victory flow permits it to escape.
- Chose a new score era with old scores retained, and an additive migration, so no historical data is lost.
- Chose browser-local unlocks with merge-on-write and storage-event convergence over accounts or cloud sync.
- Chose to reuse existing inspector/control sheet, art families and systems with accents rather than a new sprite atlas.
- (User answer Q1) Chose an explicit, retryable Submit Score action on every terminal result screen, replacing today's automatic submission, with nothing submitted at Continue Endless, because the design's Finish Run "exposes the normal manual score-submission flow" and a run that continues must not be scored early (AC-105, AC-106, AC-139).
- (User answer Q2) Chose to treat malformed data with a known version as unreadable: keep its bytes, fall back to a starter profile with a warning, keep new unlocks in memory as unsaved, and write only once the stored entry is absent or a readable supported profile, because silently replacing it could destroy earned progress (AC-83, AC-84).
- (User answer Q3) Chose to show requirements, earned and saved state in the menu Progression panel and the current run's qualification only on the locked branch in the in-run inspector, because the menu is outside any run (AC-80).
- (User answer Q4) Chose to display the retained legacy personal best separately, labelled "Legacy", and never compare it with current-era scores (AC-90).
- (User answer Q5) Chose the 20–30 minute Medium duration as a recorded pass/fail playtest gate, never enforced in game, consistent with the no-mandatory-timer rule (AC-6, AC-133).
- (User answer Q6) Chose not to deploy partially integrated increments despite the per-change deployment rule in `AGENTS.md`: the remote migration is applied, then the complete feature with usable controls is deployed once it passes its checks, and each later tuning change goes through the same gates (AC-138).
- (User answer Q7) The reviewed plan's presentation details — a 3-second achievement notice in visible UI time, a "w/30" siege versus "w/∞" endless wave counter, and minimum text sizes of 14 px body and 12 px supplements — are planner defaults within the existing design system, not spec requirements; the spec requires only a brief nonblocking notice (AC-79) and the existing tokens and fonts (AC-65).
- (User decision, spec review round 1 blocker) Only three event kinds create a terminal result: a lives-zero defeat (including in endless), a siege failure, and Finish Run (AC-140). Restart and Quit discard the run from any phase with no result and no score submission; Pause, Restart and Quit remain reachable during the victory decision and in endless, and a player who wants to bank a won siege must choose Finish Run (AC-141). The design's compatibility note that "any pre-first-wave result uses highestWave=1 and wavesCompleted=0" (`docs/superpowers/specs/2026-10-08-progression-evolutions-design.md:97`) is dropped because no such result can be created; minimum-wave validation (highestWave ≥ 1) is unchanged (AC-112).
- Chose to keep today's wave-30 composition and 3.4 HP bonus as the seed of an explicit, tunable siege-finale definition, rather than inventing a new composition before playtest evidence exists (AC-2, AC-32).
- Chose that a replaced burning field emits its already-due ticks and drops the rest, and accepted that continuous fire yields at most two ticks per field; Flame Mortar's sustained value comes from repeated impacts, with the 3 s duration covering the gap after the last shot (AC-46).
- Chose unambiguous purchase kinds (foundation-upgrade, evolve(branch), evolution-rank, mastery); these replace the plan's `foundation` and `upgrade` intents, where `upgrade` meant the evolution-rank purchase.

## Out of scope

- Accounts, cloud sync, save export/import, currency shop, new maps, heroes, new relic system.
- Saving or resuming an in-progress run.
- General talent, loadout or reward framework.
- Permanent damage, gold or lives bonuses.
- Removing or resetting unlocks from the UI.
- A mandatory additional final victory in endless; guaranteed indefinite survival in endless.
- An ordinary gameplay cap on mastery rank.
- A new full sprite atlas or map-art rewrite.
- A mandatory inter-wave timer or purchases gated at waves 15/20.
- An in-game timer, countdown or rule enforcing the 20–30 minute run duration.
- An authoritative anti-cheat or replay-verification system.
- Claims of universal balance or measured retention.
- Score bonus for owning unlocks.
- Changing the existing early rewards and foundation costs initially (tuned only if evidence requires).
- Repairing, migrating or overwriting unreadable or newer-version unlock data.
- Comparing or merging legacy personal bests with current-era scores.
- Score submission at Continue Endless or automatic submission on any results screen.
- Deploying partially integrated increments of this feature.
- A terminal result, results screen or score submission for a run that is restarted, quit, closed or reloaded (including a won siege not finished through Finish Run, and a run whose first wave never started).

## Open questions

1. NON-BLOCKING: Because Restart and Quit during the victory decision or in endless discard a won siege (AC-141), should the pause menu warn about this in those phases? Recommended: show a one-line note in the pause menu during the victory decision and endless ("Restarting or quitting discards this run; choose Finish Run to record the siege"), with no extra confirmation modal (consistent with AC-14).

Assumptions (proceeding on these unless corrected)
- ASSUMPTION: If a required boss's escape reduces lives to zero, the outcome is defeat, not siege failure (follows "while lives remain" and zero-lives precedence, AC-96, AC-142).
- ASSUMPTION: A killing primary hit counts toward the fifth-hit counter (damage landed on a living target), but its freeze/stun has no effect because the target is dead (AC-50, AC-59).
- ASSUMPTION: "Existing chain reach/falloff" means today's 130-unit reach, x0.85 per jump on the damage passed to the next flight, and x0.75 on every chain-secondary impact, so the k-th secondary impact lands 0.75 × 0.85^k of the primary flight's damage (`src/game/scenes/GameScene.ts:1680`, `:1684`, `:1693`).
- ASSUMPTION: Slow factor keeps its existing meaning, where a larger factor is a stronger slow, so Brittle Ice's 0.30 is weaker than Winterguard's inherited 0.6 (`src/game/config/towers.ts:58`).
- ASSUMPTION: The wave-30 Warlord's summoning comes from the existing wave-20+ rule (`src/game/config/enemies.ts:6`).
- ASSUMPTION: An absent unlock entry counts as writable (it is the empty starter profile of AC-82), so a first-ever unlock can be saved; only unreadable or newer-version entries block writes (AC-84).
- ASSUMPTION: The existing player-name entry and duplicate/offline messaging on the results screen are reused unchanged by the explicit Submit Score flow (`src/game/scenes/GameOverScene.ts:284-317`).

## Verification approach

- AC-1, AC-2, AC-5, AC-6: unit tests on the pure wave builder (wave 30 read from the siege-finale configuration: exactly one Warlord, seed HP bonus 3.4, today's non-boss groups, and a changed configured value changes the built wave; boss cadence; waves 31+ escalation); endless sanity runs at waves 31/35/40 for AC-5.
- AC-3, AC-62, AC-64, AC-80 (model part): pure presentation-model tests (labels, every disabled reason including "numeric limit reached", locked branches with current-run qualification in the inspector model, menu panel model with requirements, earned and saved/unsaved state and no run qualification) plus rendered checks.
- AC-4, AC-91 to AC-96, AC-105 to AC-108, AC-140, AC-141: state-machine unit tests of the siege lifecycle (boss kill versus escape at 10/20/30, wave-clear versus boss-death victory, zero-lives priority, achievement evaluator invoked on every wave-complete event and earning only at wave 20, wave-30 clear bonus applied once, repeated Finish/Continue, wave 31 blocked before Continue, no submission call and no Submit Score at Continue Endless; exactly the three AC-140 events create a result with the matching outcome) plus scene-integration tests that Restart and Quit before wave 1, during the siege, during the victory decision and in endless create no result, no results screen, no submission request and no personal-best write, keep earned unlocks, and that the pause menu with Restart and Quit opens during the victory decision and endless.
- AC-7 to AC-29: pure purchase/stat unit tests (every archetype/branch/rank and each purchase kind foundation-upgrade, evolve(branch), evolution-rank, mastery; prerequisite failures, locked/wrong branch, stale input, insufficient gold, cancel, commitment, refunds from actual spend despite tuned config, preserved cooldown/targeting/position) plus scene-integration tests that drive the real purchase command under each blocker.
- AC-30 to AC-43: configuration tests asserting each branch modifier, common rank progression, rounding, preserved stats and identical same-archetype prices (e.g. Ranger rank 0 = 510; Stormcaller chain 9–12).
- AC-44 to AC-61: combat/effect unit tests (armor channels and no negative armor, boss bonus, distinct Volley targets with ID ties, chain no-repeat with x0.85 per jump and x0.75 on secondary impacts, fifth-hit cadence and shared 1.5 s immunity, boss durations, vulnerability/slow expiry and overlap, highest-only non-recursive Beacon at 160 units, burning field ticks 0.5–3.0 s, replacement emitting ticks due at or before the replacement time and dropping later ones, continuous fire at the rank-0 and rank-3 Bombard intervals yielding at most two ticks per field, a large delta spanning a replacement, overlap, large-delta catch-up, surge/overcharge applied once, relic interactions, shot snapshots after upgrade/sale, pause and speed scaling, one death reward); integration test that freeze/stun keep regen and boss clocks running.
- AC-63, AC-65, AC-79, AC-121, AC-122: rendered runtime checks at the six viewports with screenshots (evolution, locked alternatives, achievement list and notice, mastery, victory and rewards, results with Submit Score idle/failed/submitted, pause/background, rotation, replay), plus unit checks that the notice has no interactive area and does not alter pause state.
- AC-66 to AC-71: pure mastery tests (endless-only, rank-3-only, damage formula, cost formula, unsafe huge rank rejected without spending, remaining siege ranks in endless) and a restart-reset integration test.
- AC-72 to AC-78: achievement-evaluator unit tests (rank 1 versus 2, wrong branch, sold tower, after-wave-20 purchase, zero lives, all difficulties, multiple unlocks, repeat evaluation, debug-assisted) and an integration test that an earned unlock is saved and appears only in the next run's snapshot.
- AC-81 to AC-89: unlock-repository unit tests with injected storage (reads and writes use `aetherhold-unlocks-v1`; empty/absent entry writable with no warning; unparseable bytes and known-version malformed content each produce the starter fallback and warning, leave the stored bytes byte-for-byte unchanged after an earn and after run creation, and mark new unlocks unsaved; future-version bytes untouched; a later read finding a readable supported or absent entry allows the pending unlocks to be written; write failure with retry; earliest timestamp preserved; two repositories merging via storage events without write loops; unrecognized IDs ignored).
- AC-90: personal-best tests (writes go to `aetherhold-best-score-v2`; `aetherhold-best-v1` bytes unchanged; legacy value retained; a lower current-era score becomes the current best; legacy never used in comparison) plus a rendered check that the legacy best appears labelled "Legacy" wherever the personal best is shown, and does not appear when no legacy record exists.
- AC-97 to AC-104: siege and vault tests (FIFO resolution with full inventory containing Meteor, Treasure Creature and Repair; Meteor target canceled with reservation kept; no activation path called) plus scene-integration tests with activation spies, resize/background preservation, and a check that siege-time reward choices are unchanged.
- AC-109: integration test that cleanup on restart/quit/terminal is idempotent and leaves no fields, notices or listeners (attach/remove counts across replay).
- AC-110 to AC-120, AC-142, AC-143: shared validation and Worker tests (legitimate victory, positive-lives siege failure at 10 and 30, endless defeat accepted; forged completion, outcome, mask, legacy version, non-finite and duplicate rejected; each AC-142 rule rejected when broken — highestWave 11 without the wave-10 bit, highestWave 31 without the wave-30 bit, defeat with remainingLives > 0, victory or siege failure with 0 lives, siege failure at another wave or with the escaped boss's bit, a bit for an unentered wave, more bits than bossesKilled; highestWave 0 still rejected; all prior rejection cases retained; round-trip of new fields; leaderboard rows include wavesCompleted, outcome and siegeBossesDefeated with the new scoreVersion; era filter and ordering); a local migration smoke test with a seeded legacy row; a client test that API failure keeps play and local data.
- AC-139: results-flow tests with an injected score client for each terminal outcome (victory, defeat, siege failure, endless defeat): no request on screen creation; one request per Submit Score activation; repeated clicks while submitting send one request; offline and server failure show the reason and a retry resends the identical snapshot; duplicate-run response uses existing handling; after success the action is unavailable.
- AC-123: review of the amended `docs/SPEC.md` against this spec.
- AC-124, AC-125: code review against the stated boundaries; dependency manifest unchanged apart from the version.
- AC-126 to AC-132, AC-134 to AC-136: deterministic economy fixtures using the real wave, reward and price functions (first evolution waves 11–13, rank 2 before wave 20, nine-plot full evolution unaffordable before wave 25 from ordinary income), equal-investment branch comparisons across the four roles, and recorded manual playtests (at least two Medium starter-profile, one unlocked-profile, Easy and Hard sanity) with traces and explained outliers.
- AC-133: recorded 1x active-plus-preparation durations of the Medium starter-profile playtests, each marked pass or fail against 20–30 minutes, with outliers explained and any conflict reported under AC-135; code review confirms no in-game duration enforcement.
- AC-137: `npm run typecheck`, `npm test`, `npm run build`.
- AC-138: confirmation that the deployed change is the complete feature with usable progression controls (no earlier partial deployment); remote migration applied and listed before deploy; `npm run deploy`; scripted live check of page status, referenced bundle matching the build, and `/api/health`; browser check of the live page; report URL and failures; the same sequence for each later tuning change.

## Accepted risks

None
