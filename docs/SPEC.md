# Fantasy Tower Defense — Product & Gameplay Specification

**Document:** `SPEC.md`  
**Version:** 1.0  
**Status:** Implementation Baseline  
**Primary target:** Desktop web browser  
**Secondary target:** Tablet and mobile, in portrait and landscape
**Frontend:** Phaser 4 + TypeScript + Vite  
**Backend:** Cloudflare Workers  
**Database:** Cloudflare D1  

---

## 1. Purpose

This document is the authoritative functional specification for an original browser-based fantasy Tower Defense game inspired by the pacing, clarity, progression, and replayability of classic RTS custom-map Tower Defense games.

This game must **not** copy Warcraft, Blizzard, or any other game's copyrighted characters, names, maps, UI, artwork, audio, lore, or trademarks.

If implementation behavior conflicts with this document, this document wins.

Visual implementation must also comply with `DESIGN_SYSTEM.md`.

---

## 2. AI Agent Execution Rules

These rules exist to reduce interpretation differences between AI coding agents.

1. Do not redesign the game unless explicitly instructed.
2. Do not add major features that are not in this specification.
3. Do not remove required features because they are difficult.
4. Do not replace Phaser gameplay UI with a generic website dashboard.
5. Do not use browser-default buttons, inputs, selects, modals, or tables without applying the design system.
6. Do not invent new colors, spacing values, radii, shadows, typography, or component patterns if a corresponding token already exists in `DESIGN_SYSTEM.md`.
7. Keep gameplay logic separate from rendering wherever practical.
8. Keep balancing values in configuration files.
9. Keep cloud/database logic out of Phaser gameplay systems.
10. Build and test after every meaningful implementation phase.
11. Fix existing defects before adding polish.
12. Do not leave placeholder TODO implementations for required MVP behavior.
13. Prefer simple, readable systems over clever abstractions.
14. If a visual decision is ambiguous, use the most conservative interpretation of `DESIGN_SYSTEM.md`.
15. Never use copyrighted Warcraft assets as placeholders.

---

# 3. Product Goal

Create a polished, replayable browser Tower Defense game with:

- immediately understandable controls;
- satisfying tower placement and upgrading;
- visible difficulty progression;
- meaningful tower strengths and weaknesses;
- random but controlled Power-Ups;
- increasingly intense waves;
- clear scoring;
- persistent high scores;
- fast restart flow;
- strong visual readability.

The player should understand the current battlefield state within approximately three seconds of looking at the screen.

---

# 4. Game Pillars

## 4.1 Clarity

The player must always be able to tell:

- where enemies enter;
- where enemies are going;
- which towers are firing;
- which enemies are dangerous;
- how much gold they have;
- how many lives remain;
- the current wave;
- whether a tower can be placed;
- why a tower cannot be placed;
- what a Power-Up does;
- when the next major threat is coming.

## 4.2 Strategy

Different enemy types must create different tower choices.

There must not be one tower that is optimal against nearly everything.

## 4.3 Progression

Each run should visibly evolve:

early game → stable defense → specialization → heavy pressure → boss challenges → late-game chaos.

A standard run is a 30-wave siege. Killing the scheduled wave-10 boss opens tower
evolution: a level-4 tower can take one of two evolution branches and buy evolution ranks
0–3. Winning the siege leads to a victory decision with an optional endless continuation,
where towers at evolution rank 3 can buy repeatable mastery.

Each archetype has a starter branch, available from the first run, and an alternative
branch. A branch achievement permanently unlocks the alternative branch in this browser
(§32). Unlocks add strategic choices only. They never grant a permanent damage, gold or
lives bonus, and they give no score bonus.

The authoritative feature specification is
`sdd/specs/20261008-progression-evolutions.md`. The sections below summarise it.

### Branch achievements

There are exactly five branch achievements, one per archetype.

| Archetype | Starter branch | Alternative branch (unlocked by the achievement) |
|---|---|---|
| Ranger | Marksman | Volley |
| Bombard | Siegebreaker | Flame Mortar |
| Frost | Winterguard | Brittle Ice |
| Arcane | Spellbreaker | Arcane Beacon |
| Tempest | Stormcaller | Thunderlord |

- **Requirement.** Complete wave 20 with lives > 0 while at least one starter-branch tower
  of the archetype is still present at evolution rank 2 or higher. This applies on every
  difficulty, and several archetypes may unlock at the same event. Defeating the wave-20
  boss is not required.
- **Not earned** when the qualifying tower is rank 1, is on the alternative branch, was
  sold before the wave cleared, reached rank 2 only after wave 20 completed, or the run
  reached zero lives during wave 20.
- **Evaluation.** Achievements are evaluated exactly once per wave-complete event, after
  combat consequences and before the next-wave or victory UI. Only the wave-20 completion
  can qualify; the wave-30 evaluation earns nothing.
- **Exclusions.** QA grants, previews, render or resize callbacks and debug-assisted runs
  never earn an achievement.
- **Saving.** An earned unlock is saved when it is earned. It survives defeat, quit,
  restart, victory and page reload.
- **Availability.** It becomes available from the next run's availability snapshot. The
  branches available to a run are fixed when the run is created.
- **Notice.** A brief nonblocking notice appears for each earned achievement, and the
  results summary lists them.
- **Menu panel.** A menu Progression panel lists the five achievements with their
  requirement, earned state and saved state (confirmed-saved or earned-but-unsaved).
- **In-run qualification.** During a run, a locked alternative branch in the tower
  inspector shows its requirement and the current run's qualification state.

Restarting a run resets all run development (towers, ranks, mastery, gold). Only earned
alternative-branch unlocks persist.

## 4.4 Replayability

Players should want to replay because of:

- difficulty modes;
- leaderboard ranking;
- high-score chasing;
- variable Power-Ups;
- tower combinations;
- late-game wave challenge.

---

# 5. Technology Stack

## 5.1 Game Client

Use:

- Phaser 4.x
- TypeScript
- Vite
- WebGL with Phaser Canvas fallback where applicable

Initial framework baseline for this specification:

- Phaser `4.2.1`

Pin the exact installed Phaser version in `package.json` and the lockfile. Do not silently upgrade Phaser during unrelated feature work. Framework upgrades require a normal build/test/runtime regression pass.

Recommended package structure:

```text
src/
  game/
    config/
    data/
    entities/
    maps/
    scenes/
    systems/
    ui/
  shared/
    types/
    utils/
  api/
```

## 5.2 Backend

Use:

- Cloudflare Workers
- TypeScript
- Cloudflare D1

The Worker provides:

- score submission;
- leaderboard retrieval;
- health endpoint;
- input validation;
- score plausibility checks.

## 5.3 Hosting

Deploy compiled static game assets and API through Cloudflare.

The game must remain playable even if the leaderboard API is temporarily unavailable.

---

# 6. Core Game Loop

The required loop is:

```text
Main Menu
  ↓
Player Name
  ↓
Difficulty Selection
  ↓
Load Map
  ↓
Preparation
  ↓
Start Wave
  ↓
Enemies Spawn
  ↓
Towers Attack
  ↓
Enemies Die / Escape
  ↓
Gold + Score Update
  ↓
Wave Complete
  ↓
Upgrade / Build / Evolve / Power-Up Decisions
  ↓
Next Wave
  ↓
...
  ↓
Wave 30 resolved (siege won)
  ↓
Victory Decision ──→ Continue Endless ──→ waves 31+ ──→ Lives Reach 0
  ↓                                                        ↓
Finish Run                                              Game Over
  ↓                                                        ↓
Score Summary  ←──────────────────────────────────────────┘
  ↓
Submit Score (explicit, retryable)
  ↓
Leaderboard
  ↓
Play Again
```

The siege can also end before wave 30. Lives reaching 0 ends it as a defeat. A siege
failure ends it when the wave-10 or wave-30 boss escapes while lives remain (§17). Both lead
to the score summary.

The transition from Game Over to another run should require no more than two deliberate actions.

---

# 7. Game States

Required top-level states:

1. Boot
2. Preload
3. Main Menu
4. Player Setup
5. Difficulty Selection
6. Gameplay
7. Paused
8. Game Over
9. Leaderboard
10. Settings

Gameplay also contains internal states:

- Preparation
- Wave Active
- Wave Complete
- Power-Up Selection / Reveal
- Boss Warning

Do not allow conflicting gameplay states.

Example: a paused game must not continue spawning enemies.

## 7.1 Run phases

A run is always in exactly one phase:

1. **Siege** — waves 1–30, in preparation or with an active wave.
2. **Victory decision** — the frozen phase after the siege is won.
3. **Endless** — waves 31 and beyond, in preparation or with an active wave.
4. **Terminal result** — the single end-of-run record.

User, modal and background pause are independent blockers. They never change the phase.
Pause remains reachable during the victory decision and in endless under the existing
pause-menu rules: not during a background pause, and not while another modal is open.

### Terminal results

Exactly three event kinds create a terminal result:

| Event | Outcome |
|---|---|
| Lives reach zero, in the siege or in endless | `defeat` |
| A siege failure (§17) | `siege-failed` |
| Finish Run is chosen in the victory decision | `victory` |

No other event creates a terminal result, a results screen, a Submit Score action or a
personal-best update. This includes Restart, Quit, closing or reloading the page, Continue
Endless, and a run whose first wave never started.

Restart Run and Quit to Menu discard the run from any phase: the siege, the victory
decision or endless. A discarded run creates no result, submits no score and leaves the
personal best unchanged. Earned unlocks are kept. To bank a won siege, the player must
choose Finish Run.

Restart and Quit perform the existing cleanup. They also remove burning fields, aura and
effect subscriptions, hit counters, transient notifications and modal or input callbacks.

### Victory decision

The siege is won only when wave 30 is fully resolved, the final boss was killed and lives
are above zero. Fully resolved means the spawn queue, living enemies, in-flight projectiles
and active ground effects are all empty. The boss's death alone does not trigger victory.
If lives reach zero, the result is defeat even if the victory conditions would otherwise be
met.

On entering the victory decision:

- any uncommitted Meteor target is canceled through the existing vault cancellation path,
  without consuming its reserved relic;
- the simulation freezes;
- battlefield, build, upgrade and relic-activation input is blocked;
- reward navigation input stays available.

The panel shows "Siege complete" with score, lives and unlocks, and offers **Finish Run**
and **Continue Endless**. Pending relic rewards are resolved first (§24). Both actions stay
disabled until the vault has no pending reward or target and no reward modal is open. An
empty queue needs no extra interaction.

During the victory decision:

- no enemy spawns and no gameplay effect occurs;
- reward reveal and navigation use visible UI time while the simulation stays frozen;
- backgrounding suspends reward reveal and navigation and preserves pending selections;
- the phase, reward state, branch state and pause reasons survive resize, rotation and
  backgrounding.

**Continue Endless** keeps the run ID, towers, gold, lives, targeting, stored relics and
cumulative statistics. The next wave is 31 and mastery opens. No score is submitted and no
Submit Score action is offered.

**Finish Run** creates exactly one terminal victory result, leaves the remaining stored
relics unused and shows the explicit Submit Score flow (§31).

Repeated clicks cannot end or continue a run twice. They cannot start wave 31 before
Continue Endless is chosen, and they cannot submit two result snapshots for one run. A
defeat in endless creates exactly one terminal result with the cumulative score and a
visible prior siege victory.

---

# 8. Difficulty Modes

All values must live in a centralized difficulty configuration.

## Easy

- Starting Gold: 700
- Starting Lives: 25
- Enemy HP multiplier: 0.80
- Enemy speed multiplier: 0.90
- Enemy count multiplier: 0.90
- Gold reward multiplier: 1.15
- Score multiplier: 1.00

Purpose: accessible introduction.

## Medium

- Starting Gold: 600
- Starting Lives: 20
- Enemy HP multiplier: 1.00
- Enemy speed multiplier: 1.00
- Enemy count multiplier: 1.00
- Gold reward multiplier: 1.00
- Score multiplier: 1.50

Purpose: intended default experience.

## Hard

- Starting Gold: 500
- Starting Lives: 15
- Enemy HP multiplier: 1.30
- Enemy speed multiplier: 1.10
- Enemy count multiplier: 1.10
- Gold reward multiplier: 0.90
- Score multiplier: 2.00

Purpose: optimized builds and strong decision-making.

Difficulty must be visible during gameplay and on leaderboard entries.

---

# 9. Map Specification

## 9.1 MVP Map

Ship one polished map.

The map contains:

- one enemy spawn;
- one stronghold destination;
- one predetermined enemy route;
- at least two major route bends;
- multiple strong tower positions;
- weaker tower positions;
- readable environmental zones;
- enough open space for combat effects.

## 9.2 Placement

Use predefined buildable cells or placement zones.

A tower:

- cannot overlap another tower;
- cannot be placed on the path;
- cannot be placed outside the playable build area;
- cannot be placed if the player lacks gold.

Placement preview must show:

- tower ghost;
- attack range;
- valid or invalid state;
- tower cost.

## 9.3 Route

For MVP, use deterministic waypoints.

Do not implement player-created mazes.

Map definitions must allow additional maps later.

Example:

```ts
interface MapDefinition {
  id: string;
  name: string;
  width: number;
  height: number;
  path: Point[];
  buildZones: BuildZone[];
  enemySpawn: Point;
  stronghold: Point;
}
```

---

# 10. Tower System

Ship at least five tower archetypes.

All values belong in configuration files.

## 10.1 Ranger Tower

Role:
- inexpensive;
- fast physical attack;
- reliable early game.

Strength:
- basic enemies;
- runners.

Weakness:
- armor;
- large crowds.

## 10.2 Bombard Tower

Role:
- slow attack;
- splash physical damage.

Strength:
- swarms;
- clustered enemies.

Weakness:
- fast isolated enemies.

## 10.3 Frost Tower

Role:
- support/control.

Strength:
- slowing dangerous enemies;
- extending enemy time in range.

Weakness:
- low direct damage.

## 10.4 Arcane Tower

Role:
- magical single-target damage.

Strength:
- armored enemies;
- high-priority threats.

Weakness:
- arcane-resistant enemies.

## 10.5 Tempest Tower

Role:
- chain damage.

Strength:
- medium groups.

Weakness:
- high-health single targets.

---

# 11. Tower Statistics

Every tower definition must support:

- id;
- display name;
- description;
- cost;
- damage;
- damage type;
- attack cooldown;
- range;
- projectile speed if applicable;
- splash radius if applicable;
- maximum targets if applicable;
- targeting modes;
- upgrade costs;
- sell value;
- visual asset key;
- audio key.

Damage types for MVP:

- Physical
- Arcane
- Elemental

---

# 12. Tower Upgrades

Each tower has four foundation levels:

- Level 1
- Level 2
- Level 3
- Level 4

Foundation levels 1–4 keep their existing stats, costs and art. A level-4 tower that has not
evolved is presented as **Ready to evolve**, not as a permanent final upgrade.

Each upgrade must create a meaningful improvement.

Possible upgrade dimensions:

- damage;
- attack speed;
- range;
- splash radius;
- slow strength;
- chain targets;
- armor penetration;
- visual intensity.

Avoid upgrades that only increase a single stat by tiny percentages.

Upgrade cost must be visible before purchase.

## 12.1 Tower progression state

Each tower records, per run:

- foundation level (1–4);
- branch (none, or a valid branch of its archetype);
- evolution rank (0–3 when evolved, none otherwise);
- mastery rank (an integer ≥ 0, above 0 only at evolution rank 3);
- the actual total gold invested in the tower;
- a change token that lets a commit detect a stale action.

The four-frame art and the four-entry stat tables are never indexed by evolution rank or
mastery rank.

## 12.2 Purchase kinds

| Kind | Effect |
|---|---|
| `foundation-upgrade` | Raises foundation level L → L+1, for L in 1–3 |
| `evolve(branch)` | First evolution of an unevolved level-4 tower onto an available branch; sets evolution rank 0 |
| `evolution-rank` | Raises an evolved tower's evolution rank r → r+1, for r in 0–2 |
| `mastery` | Raises mastery rank m → m+1 on an evolution-rank-3 tower, in endless only |

Purchase rules:

- **Opening.** Evolution opens only when the scheduled wave-10 boss is killed this run,
  even while other wave-10 enemies are still alive. Killing a spawned bonus target or any
  other enemy does not open it.
- **Order.** Ranks cannot be skipped, and there is no rank above 3.
- **Branch is permanent.** A tower's branch can never change to the other branch.
- **Branch selection.** Before the single purchase action, the panel shows the branch's
  name, effect, price and the commitment "permanent for this tower". There is no extra
  confirmation modal. Canceling spends nothing and leaves the tower unchanged.
- **Commit-time recheck.** At commit time the purchase rechecks the run state, the
  selected tower's identity and existence, prerequisites, the next rank, branch
  availability and current gold. If any check fails, no gold is spent, the tower is
  unchanged and the specific reason is shown.
- **Stale or repeated actions.** A repeated or stale action prepared against an older
  tower state purchases and charges nothing.
- **During a wave.** Building, foundation upgrades, evolution and selling may still happen
  during an active wave.
- **Rejected states.** Every build, upgrade, evolution, mastery or sell action is
  rejected, with no state change, during a user, modal or background pause, in the victory
  decision, or after a terminal result.
- **What a purchase keeps.** A purchase keeps the tower's cooldown, targeting mode and
  position.
- **What a purchase does not do.** It grants no free attack, heals no enemy and duplicates
  no in-flight impact. It does not reset special-attack counters, except that the
  fifth-hit counter starts at zero on first evolution.
- **Projectile snapshots.** Each projectile snapshots its offensive stats, branch identity
  and aura contribution when it is fired. Later purchases or a sale do not change it.
- **Integers.** All prices, costs, refunds and gold balances are integers.

In endless, towers below evolution rank 3 can still buy their remaining evolution ranks.

The inspector shows:

- the branch name and rank;
- the current role and rank;
- the next stats and the cost.

When an action is disabled, it shows exactly one reason from this list: reach level 4,
defeat wave-10 boss, complete branch achievement, insufficient gold, finish evolution,
continue into endless, paused/ended, numeric limit reached.

## 12.3 Branch availability

- **Fresh profile.** Each archetype's starter branch is purchasable and its alternative is
  not.
- **Locked alternative.** A locked alternative branch stays inspectable (name, effect,
  requirement) but cannot be bought. Its disabled reason is "complete branch achievement".
- **Run snapshot.** The available branches are the snapshot taken when the run is
  created. An achievement earned during the run does not change them.

## 12.4 Evolution stats

Branch stats are derived from the archetype's level-4 stats by evolution rank 0–3. They are
never compounded by mutating the current stats.

- **Rank factors.** Raw damage × [1.20, 1.55, 2.00, 2.60], attack interval × [1.00, 0.97,
  0.94, 0.90] and range × [1.00, 1.03, 1.06, 1.10].
- **Branch modifiers.** The branch modifiers in the table below are then applied.
- **Preserved stats.** Splash, slow and chain stats that a branch does not override are
  kept.
- **Rounding.** Raw damage is rounded to an integer before the existing armor calculation.

| Branch | Archetype | Role (shipped values) |
|---|---|---|
| Marksman (starter) | Ranger | Raw damage ×1.35, interval ×1.25, ×1.50 damage to bosses; physical; one target |
| Volley | Ranger | Raw damage ×0.55 per arrow; each attack hits up to three distinct enemies in range, never two arrows at one enemy; physical |
| Siegebreaker (starter) | Bombard | Original physical splash; each victim's physical armor counts as 50% of its current value |
| Flame Mortar | Bombard | Raw damage ×0.75 physical impact with the original splash, plus an elemental burning field at the impact point |
| Winterguard (starter) | Frost | Original elemental slow; every fifth successful primary hit also freezes the target for 0.5 s (boss 0.15 s) |
| Brittle Ice | Frost | Elemental; slow factor 0.30 for 2 s, plus vulnerability for 3 s multiplying incoming damage by [1.15, 1.20, 1.25, 1.30] at ranks 0–3 |
| Spellbreaker (starter) | Arcane | Arcane damage; the victim's current ward armor counts as 50% of its value |
| Arcane Beacon | Arcane | Personal raw damage ×0.60; other towers within 160 world units gain raw damage ×[1.15, 1.20, 1.25, 1.30] at ranks 0–3 |
| Stormcaller (starter) | Tempest | Elemental chain limit = level-4 limit (7) + [2, 3, 4, 5] = 9, 10, 11, 12 at ranks 0–3 |
| Thunderlord | Tempest | Raw damage ×1.60, chain limit 3; every fifth successful primary hit stuns the primary target for 0.35 s (boss 0.10 s) |

## 12.5 Effect rules

**Targeting**
- The primary target uses the tower's existing targeting mode.
- Volley fills its remaining targets in that same order, breaking ties by stable enemy ID.

**Burning field**
- Radius: the shell's splash radius. It lasts 3 s.
- Ticks: every 0.5 s, starting 0.5 s after impact. Each tick deals raw elemental damage of
  0.30 × the shell's raw impact damage, before armor and vulnerability.
- One field per tower: a new impact replaces the tower's field. Ticks already due at or
  before the replacement time are emitted first; ticks not yet due are dropped.
- Overlap: fields from different towers damage independently, and a victim takes at most
  one tick per field per scheduled tick.
- Expiry: fields expire on game time. A wave is not cleared while any field is active.
- Large frame delta: every due tick is processed exactly once, an already dead victim takes
  no damage, and no kill is credited twice.

**Chain**
- A chain attack never hits the same victim twice.
- The existing reach and falloff apply: 130-unit reach, ×0.85 per jump and ×0.75 on every
  chain-secondary impact.

**Fifth-hit effects**
- A hit counts only if its damage lands on a living target.
- Only primary impacts count, never chain-secondary, splash or ground hits.
- The counter starts at zero when the tower evolves.

**Arcane Beacon aura**
- It affects other towers only, never itself, without recursive magnification.
- A tower in range of several Beacons gets only the largest bonus. Membership is evaluated
  at fire time.
- The bonus applies to tower damage and owned-ground damage through the shot snapshot, and
  never to Meteor.

**Global multipliers**
- Surge and overcharge multipliers apply exactly once to all tower-generated damage. Ground
  ticks are not multiplied a second time.

**Vulnerability (Brittle Ice)**
- The largest unexpired magnitude applies. Each application is tracked to its own expiry,
  and a weaker new application cannot extend a stronger one.
- It applies once, after armor, to tower, ground and relic damage.

**Freeze and stun**
- They stop movement but not regeneration or boss ability clocks, like Time Lock.
- Movement stops while any freeze or stun is active. The strongest active slow applies, and
  different controls never add their durations together.
- A tower-applied freeze or stun lands at most once per enemy per 1.5 game seconds, shared
  across all towers. Time Lock stays independently usable.
- Boss-specific durations follow the enemy's boss flag.

**General**
- Armor penetration never affects the other armor channel and never produces negative
  armor.
- Dead or escaped enemies ignore later effects. Every enemy yields at most one death
  reward across all damage sources.
- All durations and attacks advance on game time. They stop during user, modal and
  background pause and scale with 1x/2x/3x speed.

## 12.6 Evolution prices

The price of evolution rank r is ceil(level-4 upgrade cost × [1.50, 2.00, 2.75, 3.75][r]).
Both branches of an archetype have the same prices.

| Archetype | Level-4 upgrade cost | Rank 0 | Rank 1 | Rank 2 | Rank 3 | Foundation + ranks 0–3 |
|---|---|---|---|---|---|---|
| Ranger | 340 | 510 | 680 | 935 | 1275 | 710 + 3400 = 4110 |
| Bombard | 480 | 720 | 960 | 1320 | 1800 | 1020 + 4800 = 5820 |
| Frost | 420 | 630 | 840 | 1155 | 1575 | 870 + 4200 = 5070 |
| Arcane | 460 | 690 | 920 | 1265 | 1725 | 975 + 4600 = 5575 |
| Tempest | 520 | 780 | 1040 | 1430 | 1950 | 1110 + 5200 = 6310 |

## 12.7 Mastery

Mastery can be bought only in endless, only on a tower at evolution rank 3, and only during
an active playable run.

- **Damage.** At mastery rank m, damage = baseRank3Damage × (1 + 0.05 × m), additive per
  rank. It improves direct, splash, chain and owned-ground damage only. It does not change
  aura strength, penetration, vulnerability, control strength or duration, range or attack
  rate.
- **Cost.** The next rank m+1 costs ceil(rank3PurchaseCost × 1.25^(m+1)), with m starting at
  0. First mastery ranks cost: Ranger 1594, Bombard 2250, Frost 1969, Arcane 2157,
  Tempest 2438.
- **Inspector.** It shows the mastery rank, next damage and cost.
- **Numeric limit.** When the next price or stat is numerically unsafe or
  unrepresentable, the purchase is disabled with the reason "numeric limit reached". NaN,
  infinity, a price rounding to free and loss of integer gold precision never occur.
  Otherwise there is no gameplay rank cap.

## 12.8 Shipped coefficients

All evolution, effect, price and mastery coefficients, and the wave-30 siege finale (§18),
live in typed configuration (`src/game/config/evolutions.ts`, `src/game/config/waves.ts`).
Tuning may change these values. Branch identities, purchase stages, unlock requirements and
wave 30's single-Warlord finale stay fixed.

The shipped values are the approved seed values. No coefficient was tuned. The simulated
balance runs in `artifacts/progression/balance/playtests.md` record the evidence. Those runs
come from a scripted bot, not from human playtests. Their AC-128 to AC-133 timing,
economy and duration results are simulated pass/fail, unverified by human play.

Two gates did not pass with these values. The user accepted the conflicts as recorded, and
the values were not tuned for them:

- **Fully evolved towers at victory (AC-131).** The gate is 2–5 fully evolved towers in a
  representative mixed build. All five simulated runs ended the siege with 7–8.
- **Branch parity (AC-127).** The equal-investment branch comparison found that
  Winterguard beats Brittle Ice, and Spellbreaker beats Arcane Beacon, in every tested
  role.

These gates are not claimed as passed.

| Coefficient | Shipped value |
|---|---|
| Rank damage factors (ranks 0–3) | 1.20, 1.55, 2.00, 2.60 |
| Rank attack-interval factors | 1.00, 0.97, 0.94, 0.90 |
| Rank range factors | 1.00, 1.03, 1.06, 1.10 |
| Evolution price factors (× level-4 upgrade cost, rounded up) | 1.50, 2.00, 2.75, 3.75 |
| Marksman | damage ×1.35, interval ×1.25, boss damage ×1.50 |
| Volley | damage ×0.55 per arrow, 3 targets |
| Siegebreaker | physical armor scale 0.50 |
| Flame Mortar | damage ×0.75; burning field |
| Burning field | 3000 ms duration, 500 ms ticks, 0.30 of raw impact damage per tick, radius = splash radius |
| Winterguard | freeze 500 ms (boss 150 ms) on every 5th primary hit |
| Brittle Ice | slow factor 0.30 for 2 s; vulnerability 3000 ms, ×1.15/1.20/1.25/1.30 |
| Spellbreaker | ward armor scale 0.50 |
| Arcane Beacon | personal damage ×0.60; aura 160 units, ×1.15/1.20/1.25/1.30 |
| Stormcaller | chain limit 7 + 2/3/4/5 |
| Thunderlord | damage ×1.60, chain limit 3, stun 350 ms (boss 100 ms) on every 5th primary hit |
| Control cadence / shared control immunity | every 5th primary hit / 1500 ms |
| Mastery damage gain per rank | +0.05 × rank-3 damage (additive) |
| Mastery cost growth | ×1.25 per rank, on the rank-3 price, rounded up |
| Wave-30 finale Warlord HP bonus | 3.4 |
| Wave-30 finale boss spawn interval / delay before | 3 s / 15 s |
| Wave-30 finale non-boss groups | thornling 59, swiftwisp 59, ironbark 47, runescale 47, mossmaw 35, gloomite 46, cragback 9 (before difficulty scaling) |

---

# 13. Tower Selling

Sell refund:

**70% of total gold invested in that tower**

The refund is floor(0.70 × the actual total gold spent on the tower), including evolution and
mastery purchases. It is computed from the tower's recorded spend and never recomputed from
current or later-tuned prices.

Selling removes the tower's owned aura and ground effects immediately. Debuffs it already
applied to enemies expire normally, and its in-flight projectiles keep their snapshots. A
tower built later on the same plot may choose a different available branch but must buy its
levels and evolution again.

Round consistently using integer currency.

Selling must require one deliberate action but not a modal confirmation during normal gameplay.

---

# 14. Tower Targeting

Supported targeting modes:

- First
- Last
- Strongest
- Weakest
- Closest

Default:
- First

Targeting mode appears in the selected tower inspector.

Changing targeting takes effect immediately.

---

# 15. Enemy Archetypes

Ship at least these mechanical archetypes with original fantasy names.

## Basic

Balanced HP and speed.

## Runner

Low HP, high speed.

## Brute

Very high HP, low speed.

## Armored

Reduces physical damage.

## Arcane Resistant

Reduces magical/arcane damage.

## Regenerator

Regenerates HP while alive.

## Swarm

Low HP, appears in large numbers.

## Boss

Very high HP and one or more abilities.

---

# 16. Enemy Resistances

Resistance must be mechanically readable.

Example rules:

- Armored enemy: reduced Physical damage.
- Arcane-resistant enemy: reduced Arcane damage.
- No enemy should be fully immune in MVP.

Use bounded resistance values.

Avoid 100% immunity because it can create unwinnable states.

---

# 17. Bosses

Boss waves occur every 10 waves.

Bosses must:

- have a unique silhouette;
- use a dedicated health bar;
- trigger a warning;
- provide a large score reward;
- provide a Power-Up or guaranteed Power-Up roll;
- have at least one special mechanic.

Example boss abilities:

- temporary haste;
- temporary damage reduction;
- regeneration;
- summon adds;
- resistance phase.

Do not use more than two simultaneous special mechanics for early bosses.

## 17.1 Siege boss milestones

The siege schedules bosses on waves 10, 20 and 30.

| Wave | Milestone | If the boss is killed | If the boss escapes while lives remain |
|---|---|---|---|
| 10 | First boss | Evolution opens (§12.2) | Siege failure: "Siege failed: the first boss escaped" |
| 20 | Second boss | Recorded in the milestone mask | Existing lives rules apply; the run continues |
| 30 | Siege finale | Victory once wave 30 is fully resolved (§7.1) | Siege failure: "Siege failed: the final boss escaped" |

All other leaks follow the existing lives rules.

A siege failure is a terminal result with outcome `siege-failed`. It keeps the actual
remaining lives. If a required boss's escape reduces lives to zero, the outcome is defeat.

Wave 30 is the **siege finale**. It schedules exactly one Warlord (The Hollow Warden) as the final boss, with its
existing enrage and summoning abilities, alongside non-boss enemies. It is an explicit typed
configuration (`SIEGE_FINALE`, `src/game/config/waves.ts`), not the endless multi-boss
escalation. Its shipped values are the seed values in §12.8.

When the next wave is 30, the next-wave preview and the boss warning both label it as the
siege finale. Wave-10, wave-20 and endless boss warnings do not carry that label.

---

# 18. Wave System

Wave scaling must not rely only on HP inflation.

Use a combination of:

- enemy count;
- HP;
- speed;
- enemy mix;
- resistance mix;
- spawn interval;
- elite frequency.

Suggested progression:

### Waves 1–5
Teach fundamentals.

### Waves 6–10
Introduce speed pressure.

### Waves 11–15
Introduce armor.

### Waves 16–20
Introduce arcane resistance and mixed compositions.

### Waves 21–30
Mix archetypes more aggressively. Wave 30 is the explicit siege finale (§17.1).

### Waves 31+ (endless)
Endless keeps increasing enemy pressure with varied composition and bosses. There is no
mandatory additional victory, and survival is not guaranteed.

Every 5 waves:
- noticeable difficulty step.

Every 10 waves:
- boss.

A standard siege is waves 1–30. The run then enters the victory decision (§7.1). Endless
waves 31 and beyond are played only after Continue Endless.

There is no mandatory inter-wave timer, and no purchase is gated to waves 15 or 20. The HUD
shows siege waves as "w/30" and endless waves as "w/∞".

---

# 19. Wave Preparation

Between waves:

- enemies stop spawning;
- player can build;
- player can upgrade;
- player can sell;
- player can inspect Power-Ups;
- next wave summary is visible.

Player starts the next wave using a clear CTA.

Optional auto-start countdown may exist later, but must not be mandatory in MVP.

---

# 20. Economy

Player earns gold from:

- enemy kills;
- boss kills;
- selected Power-Ups.

Player spends gold on:

- towers;
- upgrades.

Currency is integer-based.

No premium currency.

No real-money purchases.

No energy system.

---

# 21. Lives

Lives represent escaped enemies.

Suggested penalties:

- normal enemy: 1
- elite enemy: 2
- boss: 5

These must be configurable by enemy.

Lives cannot drop below zero.

At zero lives:

- wave processing stops;
- combat stops;
- Game Over transition begins.

---

# 22. Power-Up System

Power-Ups are temporary or consumable gameplay modifiers.

They are awarded through:

- a guaranteed reward roll after every 5th completed non-boss wave;
- a guaranteed reward after every boss kill;
- rare enemy drops.

Default MVP cadence:

- Wave 5: guaranteed Power-Up reward
- Wave 10: boss reward
- Wave 15: guaranteed Power-Up reward
- Wave 20: boss reward
- continue the same 5-wave cadence

Boss waves replace the normal 5-wave reward rather than granting two guaranteed rewards.

Rare enemy drops are additional and must use a configurable low drop chance.

Power-Ups must not replace tower strategy.

Reward behavior before the victory decision is unchanged. The victory-decision rules in §24
apply only during the victory decision. In endless, relics are awarded and used as during
the siege.

---

# 23. Power-Up Rarity

Default distribution:

- Common: 55%
- Uncommon: 28%
- Rare: 13%
- Legendary: 4%

Probabilities must total 100%.

Random selection logic must be unit-tested.

---

# 24. Power-Up Inventory

Maximum stored Power-Ups:

**3**

If inventory is full and a new stored Power-Up is received:

- player must use, replace, or discard one;
- game must clearly communicate the choice.

No hidden replacement.

### Victory-decision reward rules

During the victory decision:

- pending relics are resolved in FIFO order with **Store** (when a slot is free),
  **Replace Oldest** (when full) or **Discard New**;
- relic activation and Use Oldest are unavailable, with the reason "Continue into endless
  to use relics";
- no relic is ever auto-used, and a full inventory always has the Replace Oldest and
  Discard New exits;
- no Meteor targeting, no repair that changes the result and no Treasure Creature can
  occur;
- repeated resolution cannot store or replace twice.

Choosing Finish Run leaves the stored relics unused. Choosing Continue Endless carries them
into wave 31, where they can be used normally.

---

# 25. Required Power-Ups

## Gold Cache
Instant gold.

## Meteor
Targeted AOE burst damage.

## Time Lock
Temporarily freezes enemies.

## Battle Tempo
Temporary tower attack-speed increase.

## Arcane Surge
Temporary tower damage increase.

## Stronghold Repair
Restore limited lives up to maximum.

## Treasure Creature
Spawn a bonus target worth significant gold.

## Double Bounty
Temporary double gold rewards.

## Tower Overcharge
Temporarily empower one tower.

## Ancient Blessing
Randomly grants one of several smaller positive buffs.

---

# 26. Power-Up Presentation

When a major Power-Up is awarded:

1. briefly reduce game pace or use a safe presentation state;
2. display rarity;
3. display name;
4. display one-line effect summary;
5. display icon;
6. allow use/store where applicable.

Do not use a long blocking animation.

Recommended reveal duration:
**600–1000 ms**

---

# 27. Game Speed

Required:

- 1x
- 2x
- Pause

Optional:
- 3x

Speed changes must correctly affect:

- enemy movement;
- spawning;
- tower cooldowns;
- projectiles;
- status effects;
- Power-Up timers;
- animation timing that represents gameplay.

Do not tie gameplay timing to frame rate.

---

# 28. Scoring

Scoring must reward both survival and performance.

Recommended model:

```text
Kill Score
+ Wave Completion Score
+ Boss Score
+ Remaining Lives Bonus
= Base Score

Base Score × Difficulty Multiplier
= Final Score
```

Suggested defaults:

- basic kill: 10
- runner kill: 12
- brute kill: 20
- armored kill: 22
- resistant kill: 22
- regenerator kill: 25
- elite kill: 40
- boss kill: 500 + wave-based bonus
- completed wave: 100 × wave number
- remaining life: 50 each

Values remain configurable.

Score must use integer arithmetic.

Wave completion score is counted over the explicit number of completed waves
(`wavesCompleted`), never by assuming highestWave − 1. The wave-30 wave-clear bonus is
applied exactly once. Owning unlocks gives no score bonus.

## 28.1 Terminal result fields

A terminal result keeps the existing fields:

- playerName, difficulty, highestWave, finalScore;
- enemiesKilled, bossesKilled, remainingLives, gameDurationSeconds;
- runId, gameVersion, scoreVersion.

It adds three fields:

- `wavesCompleted` — an integer ≥ 0.
- `outcome` — `victory`, `defeat` or `siege-failed`.
- `siegeBossesDefeated` — an integer bitmask of required siege bosses killed: wave 10 = 1,
  wave 20 = 2, wave 30 = 4.

Field rules:

- `highestWave` is the highest wave entered.
  - A victory has highestWave = wavesCompleted = 30.
  - A defeat or siege failure during wave w has highestWave = w and wavesCompleted = w − 1.
    This includes an endless defeat.
- No terminal result can be created before wave 1 starts, so every result has
  highestWave ≥ 1.
- `remainingLives` is the actual lives remaining. It is positive for a siege failure and
  never forced to zero.

## 28.2 Score era

`GAME_VERSION` is `0.2.0` and `SCORE_VERSION` is `2` (`src/shared/version.ts`). Score
version 2 is the current score era.

- Stored scores from earlier eras are retained. They are excluded from current rankings.
- Personal-best comparisons use only current-era scores (§32).

---

# 29. High Score Ranking

Leaderboard sorting:

1. highest wave;
2. highest final score;
3. earliest achievement.

Store:

- id;
- run id;
- player name;
- difficulty;
- highest wave;
- final score;
- enemies killed;
- bosses killed;
- remaining lives;
- game duration;
- waves completed;
- outcome (victory, defeat, siege-failed);
- siege bosses defeated (milestone mask);
- game version;
- score version;
- created timestamp.

The ordering is unchanged in the new score era: highest wave, then final score, then
earliest timestamp. Rankings use only the current score version (2).

`run id` must uniquely identify one completed run and prevent accidental duplicate submission.

`score version` allows future scoring/balance changes without silently mixing incompatible leaderboard eras.

---

# 30. Leaderboard

Required views:

- Overall
- Easy
- Medium
- Hard

Show at least Top 20.

Columns:

- Rank
- Player
- Difficulty
- Wave
- Score
- Date

Highlight the newly submitted player result if present.

---

# 31. Score Submission Security

Never trust a final score supplied by the browser without validation.

Server validation must check:

- schema;
- player name length;
- supported difficulty;
- non-negative numeric values;
- plausible wave range;
- plausible score range;
- plausible enemies killed;
- plausible bosses killed;
- plausible game duration;
- request size.

Use prepared D1 statements.

Add reasonable anti-spam/rate-limiting protection.

The architecture should permit stronger run verification later.

The client and the Worker share one payload definition and one validation module
(`src/shared/validation.ts`). Wave bonuses, spawn and duration plausibility, kill bounds,
repairs and rewards are validated from the explicit completion and outcome, never by
assuming highestWave − 1 completed waves. This is plausibility checking of a client claim,
not authoritative replay verification.

## 31.1 Terminal-result validity rules

Shared validation enforces these rules, and the client never produces a result that breaks
them:

- highestWave ≥ 1 (unchanged minimum).
- `victory` ⇒ highestWave = wavesCompleted = 30, remainingLives > 0, and the mask includes
  the wave-10 and wave-30 bits. The wave-20 bit is not required.
- `defeat` or `siege-failed` during wave w ⇒ wavesCompleted = w − 1.
- `defeat` ⇒ remainingLives = 0.
- `siege-failed` ⇒ remainingLives > 0, highestWave is 10 or 30, and the mask lacks that
  wave's bit.
- highestWave ≥ 11 ⇒ the wave-10 bit is set.
- highestWave ≥ 31 ⇒ the wave-30 bit is also set.
- A milestone bit is set only when its wave was entered: the wave-10, wave-20 and wave-30
  bits require highestWave ≥ 10, 20 and 30.
- The number of set bits is ≤ bossesKilled.

The Worker accepts a legitimate wave-30 victory, a positive-lives siege failure and an
endless defeat.

The Worker rejects:

- invalid completion/outcome combinations;
- a mask inconsistent with bossesKilled or with the entered and completed waves;
- any payload breaking the rules above;
- non-finite fields;
- incompatible score versions, including legacy-version payloads;
- duplicate run IDs, with the existing 409 `DUPLICATE_RUN`.

All earlier forged-score rejection cases remain rejected.

## 31.2 Explicit score submission

Every terminal result screen offers an explicit **Submit Score** action: finished victory,
defeat, siege failure and endless defeat. Nothing is submitted automatically when the
results screen opens or at any earlier point. Continue Endless, Restart and Quit never
submit.

Submission states are not submitted, submitting, submitted and failed (with a reason,
retryable).

- **One snapshot.** Each run has one result snapshot. Repeated clicks while submitting send
  one request.
- **Failure and retry.** A failure (offline, network or server error) shows the reason and
  leaves Submit Score available. A retry resends the same snapshot from the same screen.
- **After success.** The action cannot submit again.
- **Reused handling.** The existing player-name entry, duplicate-run handling and offline
  behavior are reused.
- **API unavailable.** If the score API is unavailable, victory and endless stay playable
  and local results and unlocks are kept.

---

# 32. Local Player Data

Persist non-sensitive settings locally:

- player name;
- selected difficulty;
- music volume;
- SFX volume;
- preferred speed;
- local personal best;
- branch unlock profile.

Do not store secrets.

Leaderboard failure must not prevent play.

## 32.1 Storage keys

| Key | Contents | Written by this version |
|---|---|---|
| `aetherhold-settings-v1` | Settings | Yes; key and data format unchanged |
| `aetherhold-best-score-v2` | Current-era personal best | Yes; only when a terminal result is created |
| `aetherhold-best-v1` | Legacy personal best | Never; its bytes stay unchanged |
| `aetherhold-unlocks-v1` | Unlock profile | Yes, subject to the rules below |

## 32.2 Personal best

- **Scope.** Personal-best comparisons use only current-era scores. The first current-era
  score becomes the current best even if it is lower than the legacy best.
- **Legacy best.** A retained legacy best is shown separately, labelled "Legacy", wherever
  the personal best is displayed. It is never compared with, ranked against or replaced by
  current-era scores. It is not shown when no legacy record exists.
- **Discarded runs.** A run discarded by Restart or Quit leaves the personal best
  unchanged.

## 32.3 Unlock profile

The unlock profile is a separate, versioned local record under `aetherhold-unlocks-v1`. It
maps earned alternative-branch IDs to their earned timestamps (ISO 8601). It is not an
anti-cheat record.

- **Empty profile.** All starter branches and no alternatives, with no warning. An absent
  entry is writable.
- **Unreadable profile.** A stored profile that cannot be parsed, or that has a known
  version but malformed content, is unreadable. The game:
  - uses a starter profile;
  - shows an understandable progress-storage warning;
  - keeps unlocks earned meanwhile in memory, shown as earned but unsaved.
- **Never overwritten.** Unreadable data and data with a newer unsupported version are
  never automatically overwritten; their stored bytes stay unchanged. An unlock write
  happens only when the stored entry is absent or is a readable supported profile.
- **Recognized IDs.** Only recognized alternative-branch IDs count as unlocks. Unknown IDs
  are ignored.
- **Merging writes.** A write merges the recognized persisted unlocks with the current
  earned unlocks. Writes are idempotent and keep each branch's original earned timestamp.
- **Two tabs.** Tabs that earn different unlocks converge through storage-change
  notifications by merging before writing. The next run in either tab loads the persisted
  union.
- **Failed save.** If a save fails:
  - the unlock stays available in memory;
  - the message "Unlock earned, but progress could not be saved" is shown;
  - a retry happens on the next earn and at the next run creation, subject to the
    never-overwrite rule.

  The UI distinguishes session-available unlocks from confirmed-saved ones.
- **No reset from the UI.** No UI removes or resets unlocks, and a failed backend request
  never removes them. Clearing browser site data resets the profile.

---

# 33. Audio

Support:

- master audio;
- music;
- SFX.

Required SFX categories:

- tower fire;
- impact;
- enemy death;
- build;
- upgrade;
- sell;
- Power-Up;
- boss arrival;
- stronghold damage;
- game over.

Audio must be original or properly licensed.

---

# 34. Controls

Desktop:

- mouse primary;
- keyboard shortcuts optional but recommended.

Touch:

- tap tower;
- tap placement cell;
- tap UI actions.

Never require hover for essential information.

Escape may close an inspector or pause menu where appropriate.

---

# 35. Responsive Behavior

Priority:

1. desktop;
2. tablet;
3. portrait and landscape mobile.

Required test widths:

- 1440×900
- 1280×720
- 1024×768
- 844×390 landscape
- 360×640 and 390×844 portrait
- 640×360 landscape
- 768×1024 and 820×1180 tablet portrait
- 1180×820 tablet landscape

At narrow widths:

- preserve battlefield visibility;
- collapse secondary information;
- move tower controls to bottom tray;
- do not simply scale desktop UI until text becomes unreadable.

Full gameplay is supported in both orientations. Fit the battlefield proportionally,
provide pinch zoom, drag-to-pan and Reset View, and keep canvas controls in screen
space. Touch building and Meteor targeting use preview, confirm, and cancel;
gestures never commit gameplay actions. Backgrounding pauses the run until explicit
Resume. Rotation preserves run, modal, selection and reserved-target state.

The approved responsive contract and complete acceptance matrix are in
`superpowers/specs/2026-10-08-responsive-playability-design.md`.

---

# 36. Gameplay HUD Information

Always show during gameplay:

- current wave;
- gold;
- lives;
- score;
- difficulty;
- speed;
- pause control.

Contextually show:

- next-wave preview;
- selected tower;
- Power-Up inventory;
- boss health;
- placement cost/range.

Visual details are governed by `DESIGN_SYSTEM.md`.

---

# 37. Scene Architecture

Recommended:

```text
BootScene
PreloadScene
MainMenuScene
GameScene
GameOverScene
LeaderboardScene
```

`GameScene` must not contain all business logic.

Use focused systems such as:

```text
WaveSystem
CombatSystem
TowerSystem
EnemySystem
EconomySystem
PowerUpSystem
ScoreSystem
GameStateSystem
```

---

# 38. Configuration Architecture

Do not scatter balancing numbers across implementation code.

Required config modules:

```text
difficulties.ts
towers.ts
enemies.ts
waves.ts
powerUps.ts
scoring.ts
economy.ts
```

A designer should be able to rebalance most of the game without editing combat classes.

---

# 39. Cloudflare API

Required endpoints:

```http
GET /api/health
GET /api/leaderboard
GET /api/leaderboard?difficulty=hard
POST /api/scores
```

Return JSON.

Use consistent API error structure.

Example:

```json
{
  "error": {
    "code": "INVALID_SCORE",
    "message": "The submitted score is invalid."
  }
}
```

Do not leak internal stack traces in production.

`POST /api/scores` accepts the terminal result payload of §28.1, including `wavesCompleted`,
`outcome` and `siegeBossesDefeated`. It validates the payload with the shared rules of §31.1.
A duplicate run ID returns 409 `DUPLICATE_RUN`.

`GET /api/leaderboard` rows include `wavesCompleted`, `outcome` and `siegeBossesDefeated`
alongside the existing fields:

- id, runId, playerName, difficulty;
- highestWave, finalScore, enemiesKilled, bossesKilled;
- remainingLives, gameDurationSeconds;
- gameVersion, scoreVersion, createdAt.

The per-row and top-level `scoreVersion` report the current score era (2).

---

# 40. D1 Schema

Minimum `scores` table:

```sql
CREATE TABLE scores (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL UNIQUE,
  player_name TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  highest_wave INTEGER NOT NULL,
  final_score INTEGER NOT NULL,
  enemies_killed INTEGER NOT NULL,
  bosses_killed INTEGER NOT NULL,
  remaining_lives INTEGER NOT NULL,
  game_duration_seconds INTEGER NOT NULL,
  game_version TEXT NOT NULL,
  score_version INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
```

Create indexes for:

- leaderboard ordering;
- difficulty filtering;
- score version filtering where required.

The active public leaderboard must not silently mix incompatible score versions.

Migration `migrations/0004_progression_results.sql` adds the progression result fields. It is
additive, gives legacy rows defaults and deletes no score:

```sql
ALTER TABLE scores ADD COLUMN waves_completed INTEGER NOT NULL DEFAULT 0;
ALTER TABLE scores ADD COLUMN outcome TEXT NOT NULL DEFAULT 'defeat';
ALTER TABLE scores ADD COLUMN siege_bosses_defeated INTEGER NOT NULL DEFAULT 0;
```

The migration must be applied to the remote database before publishing a Worker that
expects the new columns.

---

# 41. Performance Requirements

Target:
**60 FPS on ordinary modern desktop hardware.**

Avoid:

- allocating large numbers of objects every frame;
- expensive array sorting every frame;
- excessive particle counts;
- DOM-heavy gameplay UI;
- synchronous network activity in gameplay loops.

Use pooling where beneficial.

---

# 42. Testing Requirements

Use Vitest for deterministic game logic.

Required tests:

- difficulty modifiers;
- scoring;
- wave scaling;
- tower upgrades;
- sell refund;
- target selection;
- power-up rarity;
- life clamping;
- speed scaling;
- leaderboard sorting;
- API validation;
- score plausibility validation.

Do not waste effort unit-testing Phaser rendering internals.

---

# 43. Error Handling

The game must gracefully handle:

- leaderboard fetch failure;
- score submission failure;
- missing local save values;
- audio initialization failure;
- malformed API response.

Gameplay must remain available.

Use user-friendly messages.

Do not expose raw exceptions in UI.

---

# 44. MVP Non-Goals

Do not implement unless explicitly requested:

- multiplayer;
- account registration;
- chat;
- clans;
- PvP;
- map editor;
- player-created maze paths;
- hero units;
- inventory equipment;
- crafting;
- real-money purchases;
- loot boxes;
- battle pass;
- live service events;
- complex authentication.

---

# 45. Definition of Done

The MVP is done only when a new player can:

1. open the game;
2. enter a name;
3. select a difficulty;
4. understand the map;
5. build a tower;
6. see its range;
7. start a wave;
8. watch enemies follow the path;
9. earn gold;
10. upgrade a tower;
11. sell a tower;
12. change targeting;
13. receive a Power-Up;
14. use a Power-Up;
15. fight a boss;
16. change game speed;
17. pause;
18. lose lives;
19. reach Game Over;
20. receive a score;
21. submit the score;
22. view leaderboard results;
23. start a new run.

No required step may be represented by a placeholder.

---

# 46. Implementation Phases

## Phase 1 — Foundation
Project structure, Phaser bootstrap, Cloudflare config, D1 config, tests.

## Phase 2 — Battlefield
Map, route, build zones, enemy waypoint movement.

## Phase 3 — Core Combat
Tower placement, targeting, firing, damage, death.

## Phase 4 — Waves
Wave progression, enemy mixes, difficulty.

## Phase 5 — Economy
Gold, building costs, upgrades, selling.

## Phase 6 — Enemy Variety
Resistances, runners, brutes, swarms, regeneration.

## Phase 7 — Bosses
Boss health bar, warning, mechanics.

## Phase 8 — Power-Ups
Drops, rarity, inventory, activation.

## Phase 9 — Scoring
Score system, run stats, Game Over summary.

## Phase 10 — Backend
Worker API, D1 migration, leaderboard.

## Phase 11 — Visual System
Apply `DESIGN_SYSTEM.md` completely.

## Phase 12 — Audio and Feedback
SFX, music hooks, hit feedback, boss cues.

## Phase 13 — QA
Responsive tests, gameplay tests, performance pass, production deployment.

Each phase must build successfully before continuing.

---

# 47. Final Product Standard

The finished game should feel like a purpose-built fantasy strategy game, not:

- a generic SaaS dashboard;
- a collection of HTML cards around a canvas;
- a prototype with debug graphics;
- a mobile game enlarged for desktop;
- a Warcraft clone.

The battlefield is the hero.

UI exists to support decisions, not compete with the battlefield.
