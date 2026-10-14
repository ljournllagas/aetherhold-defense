# Campaign Worlds 4–10

This is the v5 expansion contract and implementation handoff. The original
Worlds 1–3 requirements remain in [CAMPAIGN_WORLDS_1_3.md](CAMPAIGN_WORLDS_1_3.md);
the current product contract is in [SPEC.md](SPEC.md), §51. The supplied integration brief is
[`CODEX_V5_IMPLEMENTATION_PROMPT.md`](../artifacts/CODEX_V5_IMPLEMENTATION_PROMPT.md).

## Expansion catalog

The expansion adds 70 levels in seven ten-level worlds, bringing the catalog to
100 levels and 40 route families across all ten worlds. It registers 35 new
enemy profiles and seven bosses. Original level IDs, wave counts, milestones,
and the three Worlds 1–3 Sigil awards remain unchanged. Definitions live in
[`expansionContent.ts`](../src/game/campaign/expansionContent.ts) and routes in
[`expansionRoutes.ts`](../src/game/campaign/expansionRoutes.ts).

| World | Levels | Boss |
| --- | ---: | --- |
| 4 · Whisperfen | 31–40 | Mireheart Hydra |
| 5 · Sunken Aether Ruins | 41–50 | Drowned Oracle |
| 6 · Ironroot Foundry | 51–60 | Iron Tyrant |
| 7 · Shattered Sky Isles | 61–70 | Stormmaw Prime |
| 8 · Dreadmoon Wastes | 71–80 | Umbral Regent |
| 9 · The Astral Rift | 81–90 | Rift Sovereign |
| 10 · Crown of Aetherhold | 91–100 | Aether Devourer |

The required golden slice is World 4: four map families, five enemy roles, a
real Level 40 boss mechanic, world-map/Sigil presentation, the 40→41 unlock,
and save/cloud coverage at Levels 31 and 40. Later worlds must use the existing
fixed-step campaign combat and boss systems. Each new boss needs its own
telegraphed mechanic, bounded effects, simulation-time behavior, and cleanup.
The exact boss requirements are in
[`BOSS_IMPLEMENTATION_SPEC.md`](../artifacts/integration-v5/docs/BOSS_IMPLEMENTATION_SPEC.md).

## Verified integration state — 2026-10-12

The additive 100-level catalog, 40 route families, and 42 new enemy/boss
profiles are present. P1's 120 paid-resource cases across Levels 41–100 all
earned three stars without relics or debug assistance, covering 12 boss runs.
V1 independently audited 6,904 purchases with no invalid trace entries. The
minimum score margin was 6,851 and the minimum remaining lives was one. Levels
41–100 use 32–52 waves; Levels 1–40 and the global engine remain unchanged.
These runs averaged 1,261 simulated seconds (range 643–2,455), so longer
campaign battles trade duration for the combat volume needed to meet score
targets. Wall-clock time varies with speed controls and pauses. The paginated
map repair passed all 100 native hit targets across four viewports with stable
listeners; compact HUD verification also passed. The map's totals remain 300
stars and 10 Sigils. The original 30-level definitions, wave counts, and Sigil
rewards are preserved.

The local save key remains `aetherhold-campaign-v1`; local and account/cloud
saves keep their version-1 shapes. Validators
accept canonical decimal level keys 1–100 and reject malformed or out-of-range
keys; campaign results use the expanded `campaignResult` contract. Cloud writes
merge progress monotonically with compare-and-swap. A stored row the Worker
cannot safely read is rejected intact: it is never deleted or purged. No D1
schema migration was needed. A rollback must retain a Worker compatible with
expanded v1 records; older clients may reject a response containing Levels
31–100 and need a reload to use the new bundle.

The P2 save/API gate passed 44 tests; V1 independently passed 43 tests across
eight files. The tracked synthetic migration fixtures are under
[`tests/fixtures/campaign-v5/`](../tests/fixtures/campaign-v5/). World 4 combat
passed 224 owner tests. Twenty natural paid-resource cases were independently
audited across 568 purchases, with no grants, relics, or sidegrades. P3's 121
tests, typecheck, and build passed. A native paid Level 40 clear persisted
completion and exposed Next → Level 41: 31 paid purchases, 20/20 lives, score
19,023, and three stars. The final native Level 99→100 flow also passed: Level
99 saved score 138,394 with 20 lives and unlocked Level 100; native Next opened
Level 100, which saved score 134,284 with 20 lives and three stars. The terminal
result offered no Level 101. Only the prior Level 98 unlock precondition was
synthetic; Levels 99 and 100 were played in the real Phaser GameScene.

V1 loaded and rendered all 100 registered PreloadScene/GameScene stages using
marked DEV QA fixtures; this verifies stage assets and runtime rendering, not
natural play for every level. Six new bosses and six support roles were
captured at four viewports. The 146 mechanic/lifecycle tests and compact HUD
and map regression gates passed. V1's Oracle, Tyrant, and Regent warning delta
also passed at four viewports, including pause, speed, death, and retry; 151
focused tests passed. R1's final recheck had no findings. The final verification
snapshot passed fresh `npm ci` (zero vulnerabilities), typecheck, standalone
strict TypeScript, build, and the default 99-file/1,397-test suite. The
route-geometry test uses a local 10-second timeout; assertions and global
timeout settings were unchanged.

Evidence includes the [save/API gate report](../artifacts/campaign-v5-20261012/verification/save-gate-report.md)
and [save/API test log](../artifacts/campaign-v5-20261012/verification/save-api-final-verbose.log),
the [paid-resource simulation](../artifacts/campaign-v5-20261012/p1-w4-paid-resource-simulation.json),
the [save compatibility tests](../tests/verification-v5-save.test.ts), the
[native Level 40 → 41 report](../artifacts/campaign-v5-20261012/verification/headless-evidence/headless-v1-report.md),
the [final native runtime report](../artifacts/campaign-v5-20261012/verification/v1-final-runtime/v1-final-runtime-report.md),
the [boss-warning delta report](../artifacts/campaign-v5-20261012/verification/v1-final-runtime/v1-boss-warning-delta-report.md),
the [V1 purchase audit](../artifacts/campaign-v5-20261012/verification/v1-final-runtime/v1-independent-p1-paid-trace-audit.json),
the [P1 120-case trace](../artifacts/campaign-v5-20261012/p1-w5-w10-final-natural-paid-120.json),
the [final registry/geometry report](../artifacts/campaign-v5-20261012/verification/v2/registry-geometry-final-report.md),
the [V3 placed-context comparison](../artifacts/campaign-v5-20261012/verification/v3-candidate-art/qa-tower-context/qa-tower-context-report.md),
and the [100-node map recheck](../artifacts/campaign-v5-20261012/verification/v1-ui-recheck/headless-v1-map-recheck.json).
The V1 report distinguishes actual paid Level 99/100 gameplay from synthetic
precondition and DEV QA stage-render fixtures.

## Art, release, and continuation — historical v5 snapshot (2026-10-12)

All 77 expansion starter assets are provisionally active within their staged
campaign stages while remaining registered as `final_required`; all 77
final-art approvals remain UNVERIFIED. Verified hashes and dimensions confirm
that staged files match their sources; the 70 illustration candidates remain
reference material, and seven boss portraits lack candidate source/hash. V3's
corrected placed-context comparison passed for 28 map candidates, each shown
with five actual registered tower views, plus three approved Worlds 1–3
baselines. All 70 candidates were reviewed. The Crown world-panel candidate
was rejected for embedded `LD` text; seven portraits were excluded, and no
candidates were promoted. The comparison used still captures and synthetic,
unsaved QA fixtures; it does not approve animation, mobile layout, collision,
tower balance, or gameplay fit. Original Worlds 1–3 asset approvals are
preserved. See [Campaign Production Assets](CAMPAIGN_PRODUCTION_ASSETS.md) for
asset integrity and provenance details.

The O1 production deployment is live at the [game URL](https://aetherhold-defense.ljournllagas.workers.dev/),
Worker version `cb1eb993-64e5-4f3c-9d17-5d7aee12b1e2`. Live HTML and `/api/health`
returned 200 (`ok: true`, `scoreVersion: 3`). The live JavaScript bundle
`/assets/index-CcWiL_Dr.js` returned 200 at 2,150,945 bytes with SHA-256
`b167192c56c964567c8a02c4a117c51f222ccd20df1b46f1c2b6275925ec25db`, matching
the local build. Browser welcome/game-background rendering passed with no
account writes. `npm run deploy` passed its tests/build using temporary
`VITEST_MAX_WORKERS=1` after parallel geometry runs timed out; it reported
1,431 passed and 11 configured skips. No assertions or timeout settings were
changed for the deployment run. These
checks record the published build; they do not approve expansion art. All 77
expansion assets remain `final_required` and UNVERIFIED.
