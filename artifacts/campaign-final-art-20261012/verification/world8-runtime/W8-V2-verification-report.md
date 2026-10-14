# Task ID W8-V2 — independent Regent repair and World8 staging review

**Decision: PASS for the focused Regent idle raw gate and local World8 candidate staging.** This is a local unsaved QA result using exact candidate-byte HTTP substitutions. It is not public-asset promotion or live-site approval.

## Raw repair gate

The Regent candidate `world8/repair-v1/candidates/dreadmoon-umbral-regent-boss-atlas.png` (SHA-256 `84be00d661c6257be484845715d45308b61fb1028fa5e937db2b4b8aec79fba4`) passes the independently inspected idle-row gate. Six distinct complete solo poses occupy idle cells 1–6, cells 7–8 are blank, and rows 1–5 are pixel-byte-identical to the pinned base (`48d1313ef42e1d11c877ab3fe1f8dd3deae3be5eb5ec9338e8ca290eadbc6f82`). The original raw source board has silhouettes touching or crossing requested cell gutters; the extracted candidate uses separated whole-body components, and the report preserves that limitation. Prompt/output/reference-chain hashes and the Map C lineage clarification are recorded in `verification/world8-raw/regent-idle-recheck.md` and its JSON audit.

## Frozen source and candidate bytes

The runtime run used a fresh local Vite page at `127.0.0.1:5218`, real Phaser `GameScene`, Playwright Chromium, and local-only candidate response interception. The source pin was checked again after the run: all nine pinned source files still match, including `src/game/scenes/GameScene.ts` SHA-256 `640c9ea6a52bc611465e56c0f16a03e2a04b58206ef6805c69a4551ce91cb5f4`. All eleven selected candidate files also still match their pinned hashes:

| Candidate | SHA-256 |
|---|---|
| World panel | `5265dc72db5643fcc1aeb053de8c0f106257aa7aa383d2bb1f9e412631ff8f57` |
| Map A | `1e9948f299017acf0a1831d911496f859666205d9245d8797a3422feb59dc9a8` |
| Map B | `b48f3e80abb216782fbc24fc28ce215f126947a7878eeaf3758dec148c07d5e1` |
| Map C | `b052f72f6a0e9ef861728d52b0fc39c7e6ef995b618c8378a50519fb5af11095` |
| Map D | `75e57c7913b871523513130b1cbb5d1575e613e6e0a901b38600ff8b02d1a100` |
| Shadeborn | `afe8203fd49130e5fc44da7205e941b66f8f552a5ff4753c389e03b048d7ff56` |
| Dusk Runner | `7b0cc66af71cc0f62e1fe0e02dbfc93f3f55b34aa096a990c1821e13791e4a33` |
| Moonstalker | `d3584094b09d7700617fecc591f9b07435ed727b56567290d38a8517ef1776ff` |
| Grave Hulk | `4cf391664b3403e12fc10c8d70dae25e5346232f9e5f39637baa092092e11294` |
| Echo Shade | `d51cb8c255ef3abab0ae3d52d2fe281b66408b4d4c96d5a5c3d3e28da16e1b97` |
| Umbral Regent | `84be00d661c6257be484845715d45308b61fb1028fa5e937db2b4b8aec79fba4` |

The candidate path and runtime-key mapping for every hash is pinned in `candidate-inputs.json`. The main staging report observed 178 candidate requests; every requested path served only its expected hash (`candidateTransport.allExact=true`). The runtime report records zero browser errors, failed requests, HTTP errors, blocked API requests, or assertion failures. All 31 local progress snapshots remained unchanged. No campaign completion or account write occurred.

## Actual runtime coverage and visual review

The main capture recorded the actual Dreadmoon world panel at 1440×900, 1280×720, 1024×768, 844×390, 320×390, and 360×360. It ran 24 map cases: maps A–D at the four required sizes, plus all four maps at 320×390 and 360×360. Each stage had five real registered, visible tower views, five registered candidate EnemyViews using their exact atlas keys, a visible 1200-gold indicator, and real map route/build-plot geometry. Across every case the eight route points remained in the battlefield mask; all plot-circle bounds fit the field. I visually reviewed actual screenshots for A/B/C at 844×390, A and C at compact size, D with the Regent at desktop and compact size, and the compact panel. Roads, build plots, occupied towers, and terrain remain identifiable in these views; edge ingress/egress sit at the expected map edges without hiding interior route turns or plots. The compact field is necessarily small, so fine creature detail is reduced, but routes and placement circles remain distinguishable.

The active-boss fit remains conservative without collapsing the map. At 844×390, the boss stage uses fit scale `0.3861` versus `0.4418` on A–C; at 320×390 it uses `0.2509` versus `0.2705` on A–C. The full field, interior roads, and plot circles still fit. At 1440×900 the boss fit is `1.1507` versus `1.1538` on A–C. The real 256-pixel Regent frame produced 96×110 changed visible pixels at 1440×900, 95×97 at 1280×720, 96×111 at 1024×768, and 55×54 at 844×390; frozen hidden baselines were pixel-stable. The 320×390 boss-stage screenshot shows the whole map and boss status, with the Regent itself small; fine facial and costume details should not be promised at that size.

Five ordinary enemy views advanced idle, walk, attack, and death states at all four required viewport sizes. Echo Shade also advanced its supported buff clip; the other four correctly reported no authored buff clip. Attack action coverage is explicit registered-EnemyView QA, because ordinary enemies have no natural attack event to trigger. Regent idle/walk, attack, special, phase-two, and death animations were checked on the real registered EnemyView; a focused addendum exercised all six in both left and right facings at 844×390, verifying action-frame progression and correct facing. The normal boss kill path advanced death frames, hid the boss panel, removed the dying view, and restored the field/camera. Boss left/right orientation and visible-body pixel evidence were collected at the four required viewport sizes.

The 844×390 camera/control check exercised 1.25× zoom, deliberate pan, reset, pause/resume, speed 1→2→3→1, resize to 320×390, and restoration to 844×390. Camera fit stayed fixed during Regent movement through first, middle, and last route samples. Real-world screenshots show meaningful gold-cost feedback above occupied towers.

Echo Shade support was exercised through its real unpaused `CampaignBossSystem` and `GameScene` consumer using an explicitly labeled QA setup, not an earned campaign. At telegraph, the actual callout was “Echo Shade · Doubles forming” and the buff consumer call count was zero. At resolution, “Echo Shade · Decoys emerge” appeared, the registered EnemyView received exactly one `buff` call, and two registered decoys existed. The ally HP correctly remained unchanged because this encounter summons rather than heals.

The Regent's 60% threshold produced the real “Echoes forming” telegraph, remained active at 1199 ms, and resolved exactly at 1200 ms to “Two echoes emerge” with two registered clones. Source inspection confirms the generic boss-wave spawn lead remains 1300 ms in pinned `GameScene.ts:1950`; the QA fixture exercised the Regent's 1200 ms transition, not a naturally elapsed boss-wave preamble. The original generated runtime report's file named `regent-phase-warning-844x390.png` was captured after that transition and shows the resolved message. I preserved it and added a correctly timed frozen active-warning capture and a separate 1200 ms resolution capture; see `regent-warning-capture-report.json` and `screenshots/regent-warning-active-844x390.png`.

## Evidence files and method

- Main runtime assertions, hashes, controls, and screenshot manifest: `w8-stage-gate-report.json` (`runtimeOutcome=PASS`; its `visualReview=PENDING` field is the harness's initial placeholder, superseded by this manual review).
- Main harness and exact source/candidate pins: `w8-stage-gate.cjs`, `source-pin.json`, `candidate-inputs.json`.
- Correctly timed warning/resolution recapture: `capture-regent-warning.cjs`, `regent-warning-capture-report.json`.
- Six Regent actions in both facings: `recheck-regent-actions-both-facings.cjs`, `regent-actions-both-facings-report.json`.
- Screenshots: `screenshots/game-dreadmoon_{a,b,c}-844x390-mixed-walk.png`, `screenshots/game-dreadmoon_d_boss-1440x900-mixed-walk.png`, `screenshots/compact-stage-dreadmoon-{a,c,d}-320x390.png`, `screenshots/panel-320x390.png`, `screenshots/regent-visible-{1440x900,1280x720,1024x768,844x390}.png`, and the active/resolved warning captures above.
- Raw repair screenshots and byte audit: `../world8-raw/regent-idle-recheck/` and `../world8-raw/regent-idle-recheck.md`.

Methods: `rtk node artifacts/campaign-final-art-20261012/verification/world8-runtime/w8-stage-gate.cjs`, `rtk node artifacts/campaign-final-art-20261012/verification/world8-runtime/capture-regent-warning.cjs`, `rtk node artifacts/campaign-final-art-20261012/verification/world8-runtime/recheck-regent-actions-both-facings.cjs`, and the independent raw audit described above. QA used only local API stubs and unsaved in-memory fixtures; account/progress profiles, production/public assets, and Git state were untouched. Remaining visual limit: compact displays preserve route/placement readability but cannot resolve fine atlas detail.
