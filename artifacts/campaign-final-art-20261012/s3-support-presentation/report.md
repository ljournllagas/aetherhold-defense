# Task ID S3 — campaign support presentation hook

## Outcome

The scene now requests `buff` only when a `CampaignBossEvent` carries the typed `presentationAction: 'buff'` marker. The marker is attached to completed support pulses: Ashcaller, Frost Shaman, Rootwretch, Aetherbound, Foundry Core, Crown Archon, and the resolution events for Tempest Herald, Echo Shade, and Rift Weaver. The latter three warning events retain their existing callouts and telegraph states without starting the animation.

The marker changes presentation metadata only. Support cadence, target selection, buffs, armor, healing, summons, route movement, and all combat tuning remain in the existing system code. `EnemyView.playAction()` still governs whether canonical final art can play the registered one-shot; provisional procedural visuals remain a safe no-op.

## Regression evidence

- First updated the real-system World 5–10 event traces to require zero actions on multi-stage warning events and one action on resolution. Before the typed marker, Tempest Herald, Echo Shade, and Rift Weaver each failed because the warning event requested one action.
- The passing traces assert the warning callout and active telegraph, zero warning actions, one resolution action, and no repeat at the same game time or while the state remains active.
- Foundry Core coverage verifies the real armor pulse, its existing armor multiplier and callout, and one action request. Existing Ashcaller, Frost Shaman, and Rootwretch coverage still passes.
- Pause/resume coverage verifies both an immediate Foundry Core pulse and a Tempest Herald cast paused during its telegraph. Simulation time and telegraph state hold while paused; one action request occurs after the resolved event on resume.

## Verification

- `rtk npm test -- tests/campaign-callout.test.ts` — passed, 24 tests.
- `rtk npm test -- tests/campaign-v5-boss-mechanics.test.ts tests/campaign-combat.test.ts` — passed, 40 tests.
- `rtk npm run typecheck` — passed.
- `rtk git diff --check -- src/game/campaign/bosses.ts src/game/scenes/GameScene.ts tests/campaign-callout.test.ts` — passed with no whitespace errors.

## Source hashes

- `src/game/campaign/bosses.ts` — SHA-256 `3502b60287ad07ed13d858387589e8b0742ea93064ef1e2cd4d1ba0e14963ac1`
- `src/game/scenes/GameScene.ts` — SHA-256 `640c9ea6a52bc611465e56c0f16a03e2a04b58206ef6805c69a4551ce91cb5f4`
- `tests/campaign-callout.test.ts` — SHA-256 `565ec470544326048c9f177e29aa766deba806a59e3d5b4cddfc9bd525f0a80a`
- Unchanged `src/game/art/enemyArt.ts` — SHA-256 `1cebc2b6dc9f5bbca348ca206619c88e13ae939c84f18c80ecc2f85dfaae5045`
- Unchanged by S3 `src/game/campaign/artManifest.ts` — SHA-256 `f908a805a4b39ec3112067281d1a6cf2579fdbfd9fb0e69163e569c7bebf14d0`

Implementation references: `src/game/campaign/bosses.ts` (`CampaignBossEvent` and resolved support event producers), `src/game/scenes/GameScene.ts` (`tickCampaignBosses()`), and `tests/campaign-callout.test.ts` (real-system event traces and pause coverage).

## Remaining work

No Git or deployment operations were performed under S3 ownership. The report directory is Git-ignored. Full-suite/build and the repository deployment and remote synchronization steps remain with the main agent after integration.
