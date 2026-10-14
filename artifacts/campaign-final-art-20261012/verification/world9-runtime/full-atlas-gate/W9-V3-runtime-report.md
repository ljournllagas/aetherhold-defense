# Task W9-V3 — World9 staged runtime gate

**Decision: PASS for the World9 staged candidate/runtime gate.** All 11 pinned candidate assets rendered through the actual local CampaignScene and GameScene consumers. The run passed exact-response, source-freshness, actor registration, support, boss action, lifecycle, and viewport assertions. This is local unsaved QA with candidate URL substitutions; it does not claim public promotion or a live deployment.

## Frozen inputs

The fresh runtime ended with GameScene SHA-256 `640c9ea6a52bc611465e56c0f16a03e2a04b58206ef6805c69a4551ce91cb5f4`. The harness pinned 16 production source files and found no changed source or candidate hashes. The independent raw review is `verification/world9-raw/REPORT.md`, SHA-256 `b174c3777f8b6604982c98d9e3d4e0640e5aa221f57e2fdd4409eaef972b1fa1`, decision `all 11 PASS`.

| Candidate | SHA-256 |
|---|---|
| `world9/candidates/world-panel-astral-rift-candidate.png` | `dab7467998334b9e5bb630506cca0ab684d9c55fed8098a04f5cf0a2bff4908a` |
| `world9/repair-v1/candidates/astral-rift-map-a-repair-v2.png` | `be0ecbc01bfcd5b4fda7ffedd7a88485e7c9bf02d5978e9a28baa3f57ebd2b2e` |
| `world9/repair-v1/candidates/astral-rift-map-b-repair-v2.png` | `cf0e176ef41c74728f03256a5243bc77e73bc01c46de8d04bebe05b9456f3dab` |
| `world9/repair-v1/candidates/astral-rift-map-c-repair-v2.png` | `94b137421d54dcb87e46cde7adc71c0ab5ff5f1ae790443f66555bcb71652536` |
| `world9/repair-v1/candidates/astral-rift-map-d-repair-v3.png` | `3119f0db247fe479181964205235ed936f182f952362e31c8b75ecdbcd7814ab` |
| `world9/candidates/riftling-atlas-candidate.png` | `767eea2dec08a2825a323fb5cb62656c2857a247ce48aae40d93985f988695f6` |
| `world9/candidates/phase-hound-atlas-candidate.png` | `6b26a78225e14baf8d7c39f8729b6f613ce4d637b3abae66666752f995750c13` |
| `world9/candidates/astral-horror-atlas-candidate.png` | `15917d79ae4d4e05bc51c36470d94ea3ff87db27a12eba79cc798d319aae1140` |
| `world9/candidates/voidplate-atlas-candidate.png` | `61b31d9a92649908e8c51dc77a83aea9c677f7789170532db9f607dbf52240b4` |
| `world9/repair-v1/candidates/rift-weaver-atlas-repair-v1.png` | `025a247ebbc0115c4ebd18f2aca659ae1a158c32a84d002e79f63e5cdbc39b18` |
| `world9/repair-v1/candidates/rift-sovereign-atlas-repair-v1.png` | `afeb43fde71948dcd9b45bf2e6ee528dd0ef4d4f1b4b01f42b55e00422408620` |

## Coverage and result

The Playwright run used the frozen local Vite app, fresh browser contexts, service workers blocked, exact candidate bytes intercepted at their current asset URLs, and API writes blocked. The final report records **83 HTTP 200 candidate responses; every response SHA matched its pinned asset**, with zero failed requests, unexpected HTTP errors, browser errors, or failed assertions. All 21 local/session storage snapshots remained unchanged.

The real CampaignScene World9 panel rendered the candidate panel at `1440x900`, `1280x720`, `1024x768`, `844x390`, `320x390`, and `360x360`. Manual review found the route artwork, selected-level state, and navigation readable in the four required viewports. At `320x390`, the detail pane is dense and its two bottom action labels are close together, but they remain separate and legible; no overlap was visible in the captured render.

The staged GameScene used actual level 81/A, 84/B, 88/C, and 90/D. Level 88 was captured at all six viewports with five registered towers, the configured World9 roster, visible gold/status controls, and all five candidate enemy texture keys registered. At `844x390`, the five silhouettes and route motion are identifiable. At `320x390` and `360x360`, whole-map framing and major silhouettes remain visible, with less fine sprite detail at native compact size.

The runtime resolver check enumerated **10 authored World9 levels and 12 family/offset resolver variants** (`a/b/c/d` × base/2/3). For each of the six viewports, all 12 routes had eight waypoints and all route interior points projected inside the live battlefield mask; all build-plot centers were also inside the mask. The independent map-only report separately covers all 10 authored levels at all six viewport sizes, five registered towers, all 147 authored build plots, and plot-circle/mask clearance: `verification/world9-runtime/maps/MAP-subset-report.md` (map-only gate; no atlas approval implied by that report).

The five registered EnemyViews passed three focused live-animation groups at `844x390`: running walk and explicit attack clips, left/right facing flips using the same authored cell, and normal GameScene death/dying cleanup. Ordinary attack was exercised as an explicit presentation QA action; it is not represented as naturally triggered combat. Synthetic lethal damage in the unsaved fixture removed all five dying views after their authored 750 ms clips.

The authored level 88 Rift Weaver support loop passed on the running GameScene clock without a direct `playAction('buff')` call: it telegraphed at about 12.2 s with zero buff calls, then its actual event produced one registered `campaign_enemy_rift_weaver_buff` action and one `advanceEnemyAlongRoute` call, moving the Weaver forward by the configured route fraction. The fixture holds the Weaver's base speed at zero to keep the actor in frame; its support timer and normal simulation clock are not changed. The observed Rift Weaver contract is a self route jump; this run does not claim a separate pull or slow effect on other enemies.

The actual Rift Sovereign candidate rendered at all six viewports. The initial portal warning is QA-seeded. The live boss then traversed the route, produced its second phase warning/jump, and rendered the explicit `attack`, `special`, and `phase_two` presentation actions. Normal kill/death cleanup passed: the view detached, remained for the authored 1000 ms death clip, and was removed with zero dying views remaining. An extra stationary, high-health registered Riftling prevents the unsaved boss fixture from triggering a terminal results modal before cleanup. No progression or account state was written.

## Evidence and limits

- Full pinned runtime report: `w9-full-atlas-runtime-report.json`.
- Clean native GameScene/panel captures: `screenshots/` (QA control panel hidden only during screenshots; fixture labeling remains visible).
- Representative captures: `screenshots/panel-320x390.png` SHA `f63b2e25199d3622b3c4ab138a8951de275069dc4ca90c67489f7313461da7e4`; `screenshots/roster-l88-844x390.png` SHA `819be53d6126407d1a75b7ebb219620e817d4820f2f473ac48f7c7c873e51d5c`; `screenshots/roster-l88-320x390.png` SHA `513bd31c7a5a01aa37ac1e6a6ffc1ca8a95b3405af151c847e5da94a01864c14`; `screenshots/weaver-telegraph-844x390.png` SHA `b06f40696b09f7ace24fe428ef112ddeb23b3bc170059a1612818fed34ea56eb`; `screenshots/weaver-resolution-844x390.png` SHA `199e58cae2411bb955a7aa08dc7967fa6a903d7bb6286ef16a573c803852eefa`; `screenshots/sovereign-warning-844x390.png` SHA `5f0f2beb3d15cffa946bfa5ab4dfca45a484aca926a5db21e4983082d8a9ffdf`; `screenshots/sovereign-phase2-844x390.png` SHA `5e315216cf430503698685d6a262ca2430f3af0724ccfa60ad57bce3b65b5de6`; `screenshots/sovereign-death-start-844x390.png` SHA `3ff0e379f6996ee0d2fe6043d3134250e99baf27aafe27afe7356384d8de7dde`.
- Map-only PASS remains limited to map and panel fit. This report adds EnemyView, support, and boss runtime evidence; it is not a public/live consumer check.
- The previous successful and failed harness artifacts are preserved in `prior-clean-pass/`, `prior-runtime-pass/`, and the `w9-full-atlas-runtime-attempt-*.json` files.

Command used for the final runtime: `rtk C:\Users\ljour\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe artifacts/campaign-final-art-20261012/verification/world9-runtime/full-atlas-gate/w9-full-atlas-runtime.cjs`.
