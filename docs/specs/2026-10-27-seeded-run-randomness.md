# Seeded run randomness

**Aligned-to:** `bc0d80b`

## Problem

Every gameplay roll calls `Math.random` directly, so a run cannot be reproduced. Two
consequences today:

- A bug report that says "the relic roll gave me a useless pick" cannot be replayed.
- The campaign reward path cannot be tested for determinism: `GameScene.rollReward()`
  and `GameScene.rerollReward()` reach `Math.random` through default parameters, so a
  simulation harness that supplies its own `rand` still gets real randomness from the
  scene.

Server-side replay verification (the follow-on item) needs a run to be a pure function
of its inputs. This slice supplies the seed and the injection points; it does not
persist the seed or the action log.

The 2026-10-27 handoff named only `GameScene.ts:3288` and `:3294` as remaining direct
call sites. That is incomplete: the **primary** reward path
(`GameScene.rollReward()` at `:3211` and `GameScene.rerollReward()` at `:3221`) and the
drop-on-kill roll (`:3593`) also call the defaults. Seeding only the two named sites
would leave the reward sequence non-deterministic and the acceptance test below
impossible to satisfy.

## Scope

One slice: a seed is created once per run, gameplay rolls consume it, and the same seed
with the same inputs yields the same sequence of gameplay outcomes.

## Approach

### PRNG

A new module `src/game/systems/runRandom.ts`:

- `mulberry32(seed: number): () => number` — the generator. Small, fast, no shared
  state, and stable across engines.
- `createRunSeed(): number` — 32 bits from `crypto.getRandomValues`, not `Math.random`,
  so the seed does not depend on the same weak source it replaces.

Neither function is exported into any payload, URL or persisted record in this slice.

### Seed lifecycle

`GameScene` gains `runSeed` and `runRandom`, assigned in `init()`:

- Every `init()` — including the one `restartRun()` triggers through `scene.restart` —
  creates a fresh seed. A restart is a new run; it does not replay the previous one.
- The seed is written once to the console at run start so a bug report can quote it.
  This is developer-facing only; there is no UI.

### What the seed governs

| Site | Roll |
|---|---|
| `GameScene.ts:3211` `rollReward()` | relic/reward pool pick (campaign and endless) |
| `GameScene.ts:3221` `rerollReward()` | reroll replacement |
| `GameScene.ts:3288` | overcharge target tower |
| `GameScene.ts:3294` | ancient blessing outcome |
| `GameScene.ts:3593` | drop-on-kill relic chance |

All five pass `this.runRandom` explicitly. `CampaignBattle.rollReward` and `reroll`
already accept `rand`, so no signature changes are needed there.

### What stays random

Cosmetic and non-gameplay randomness keeps `Math.random` deliberately, so a seeded run
still looks alive: enemy walk-cycle phase (`Enemy.ts:33`), menu embers
(`menubg.ts:41`), shot and impact particles (`GameScene.ts:3550-3552`), sound pitch
(`SoundManager.ts:97`), account-sync retry jitter (`AccountSync.ts:2`) and run ids
(`leaderboardClient.ts:120`).

Probabilities are unchanged. The same distribution is consumed from a different source;
only reproducibility differs.

## Acceptance

- `mulberry32` returns the same sequence for the same seed and different sequences for
  different seeds.
- Two scenes initialised with the same seed produce an identical sequence of
  `rollReward()`, `reroll()` and drop-on-kill outcomes.
- With the seed held constant, `shouldDropOnKill` and the overcharge pick are stable.
- Cosmetic call sites still use `Math.random` (unchanged).
- The full suite stays green, and `SCORE_VERSION`, the score payload and the D1 schema
  are untouched.

## Out of scope

- Persisting the seed, or sending it to the leaderboard. That rides with replay
  verification, which also bumps the score version.
- A `?seed=` parameter or any player-facing seed entry.
- A daily challenge (date-derived seed, shared standings). It is a player-facing
  feature with date-sensitive logic and needs its own spec.
- Replaying an action log, and any change to `/api/account/scores`.

## Risks

- A seeded run makes a run repeatable, not verified. Leaderboard trust still depends on
  the absent replay check; nothing in this slice changes what the server accepts.
- `init()` now touches `crypto.getRandomValues`. It is available in the browser and in
  the Vitest Node environment, but any future non-browser harness must provide it.
