# W6-V1 — World6 raw art acceptance

Reviewed 2026-10-13. **Raw-art outcome: PASS for the six repair-v3 atlases.** The five panel/terrain candidates retain their earlier raw PASS because their scope is unchanged; their current bytes still match the pinned provenance hashes. This is static source/art acceptance, not runtime or playback acceptance.

## Candidate pins and decisions

| Asset | Raw result | Selected candidate SHA-256 |
|---|---|---|
| Ironroot panel | PASS, retained unchanged | `bb46fa28e5e9e5acf8d77a9bd2e059c0dfc71fead420fbc93ce5205bf98a499e` |
| Map A | PASS, retained unchanged | `f094f9dcf725d28be8409430baa1ae0adb6bf82faded6d13f567349db5ef2e2c` |
| Map B | PASS, retained unchanged | `5dcdb71ba2d33df1f4cd734b346f6cd216058737285ed597a4cfcaba74787404` |
| Map C | PASS, retained unchanged | `53aeece9783bfa5ed5f87ee766a9701939665f06b4bf9f93e350cd3a0aaf2b23` |
| Map D | PASS, retained unchanged | `72b13d5e41d2c0fd088fb2fcade469a79fb9f61cebf3bc24921b64baeab5821d` |
| Scrapling | PASS | `e56efb79c8859dc17ddd79ad5abfd410d310a7c5b4e5836e91022ce8858689ae` |
| Furnace Hound | PASS | `b1ffb21ef0244005289abae0bcfc897a3d8a479a278d327c9f6c2755e4f0e017` |
| Ironbound | PASS, footprint caveat below | `127fbe7f27c2aa4996cb9a09c95a029520ba9c664d113368ae10788d2694696d` |
| Foundry Core | PASS, footprint caveat below | `4d9ceee2092c1bc1e514f0e76125b3deaefd26246753df27c968259f889012f1` |
| Siege Golem | PASS, footprint caveat below | `2a74f89fd8d4610009ba55fb3b281489dd1aa2eafcd99479bf8ee0cb9862cde2` |
| Iron Tyrant | PASS | `7efca9d25dbe0f27b370f798c8c5e6035120a1f77e7fb5c473c2da856aa504d9` |

## Six-atlas inspection

I opened the six actual repair-v3 light/dark PNG contacts, the raw suspect-neighborhood contact, the v3 attack-cell contact, and the component-ownership overlays. All repaired actors retain complete anatomy, their own effects, fixed facing/camera, and distinct action poses. The attack cleanup removes separate neighboring actors without leaving detached strips; no character or effect clips a cell. The atlas PNG checks independently found the expected active counts, no cell-edge or outer-canvas alpha, exact empty idle overflow cells, and no byte-identical active frames:

- Scrapling, Furnace Hound, Ironbound, and Siege Golem: RGBA 768×512; rows `[4,6,6,6]`, 22 distinct active cells; idle cells 5–6 empty.
- Foundry Core: RGBA 768×640; rows `[4,6,6,6,6]`, 28 distinct active cells; idle cells 5–6 empty.
- Iron Tyrant: RGBA 2048×1536; ordered rows idle/walk/attack/special/phase_two/death with `[6,8,8,8,8,8]`, 46 distinct active cells; idle cells 7–8 empty.

The death contacts show monotonic collapse to a settled wreck for each unit; there is no return to an upright or powered pose. Tyrant's special row begins the armor break and brightens the core; phase_two keeps the same body identity with the core exposed. Foundry Core's buff row preserves its mobile sentinel body, attached gear halo, staff, and compact aura across all six distinct frames.

| Atlas | Focused visual / ownership evidence | Body footprint evidence (cell size 128 unless noted) |
|---|---|---|
| Scrapling | Four-footed gait, low lunge/snap, then one-way mechanical collapse. No foreign-component cleanup was needed. | Idle median 93.58×82.26 px; largest non-death action 113.2×76.7 px. |
| Furnace Hound | Natural low canine body and exhaust remain intact through run, bite/recoil, and death. Neighbor fragments are absent in attack frames. | Idle median 92.78×73.16 px; largest attack body 106.2×66.5 px. Its low height is consistent with the authored broad, low quadruped; do not stretch it to meet a height-only ratio. |
| Ironbound | Upright armored identity, feet, fist, and full shoulders remain intact in the three cleaned attack cells; walk and collapse rows retain the same facing and anchor. | Idle median 82.89×79.28 px; walk median height 87.36 px; largest attack 119.4×82.9 px (93% of cell width). One ordinary uniform scale, 0.42508711. Runtime should assess the smaller upright idle body against its nearly cell-wide strike pose. |
| Foundry Core | Staff/core pulses remain attached; buff row is visibly the same mobile sentinel with the rotating halo and aura. The six buff frames use one uniform scale, 0.238931827. | Idle median 85.54×86.68 px; buff median 91.39×85.54 px. Buff height matches the normal-row body median (85.5376 px); no per-frame rescaling or anatomy distortion. Largest attack body 107.3×89.9 px. |
| Siege Golem | Broad crusher-arm machine; the death row moves from loss of balance through kneeling/toppling to still wreck. Neighbor pixels removed from two death crops. | Idle median 105.3×85.12 px; largest active body 118.3×85.8 px (92% of cell width), consistent with the squat broad design. |
| Iron Tyrant | All six rows read as one crowned emperor; attack, armor-break, exposed-core phase, and death poses differ. Camera and bottom origin stay stable. | The six high-resolution 1774×887 source sheets are downsampled at one 0.514806378 scale into 256px cells. Idle median is 202.83×194.08 px; walk median 208.5×208.24 px (80.4% median walk height); largest attack body 230.6×160.6 px. Source detail is clear in the contact; no low-resolution blocker for this v3 candidate. |

The ordinary atlas idle-body heights span about 57–68% of a 128px cell. The quadrupeds are naturally low; the upright Ironbound and compact Foundry Core bodies are also below the prompt's nominal 78% height. Their complete action/effect footprints constrain uniform enlargement (for example, Ironbound's largest attack is already 93% cell width), and their rows preserve the same ordinary scale. I therefore pass the raw anatomy/pose gate while leaving in-game visibility and relative footprint to the active Runtime V9 review. If runtime evidence finds those units too small, this raw PASS does not waive that failure.

## Provenance and rebuild evidence

All 11 original selected records were independently rehashed: candidate, raw source, authored prompt, reference-chain file, and the file at each recorded ImageGen output ID matched `world6/provenance.json`. The five unchanged landscape/panel candidate bytes match those same pins. For the six repair-v3 atlases, raw source bytes and generated-output-ID files also match their recorded hashes. Every retained per-call prompt and reference-chain hash matched its file, and both sidecar modification times precede the source file time; no consolidated-document timestamp was used to infer call chronology.

The six Iron Tyrant source records are the selected idle, walk, attack, special, phase_two retry, and death retry3 outputs in `world6/repair-v2/iron-tyrant-repair-v2-report.json`. Their exact raw/output hashes, ImageGen IDs, prompt/reference hashes, and per-call times all matched. The selected death retry is attempt 3, with source hash `636c9e6751e658a7d470ccfc61c88ce06a2b84e1cc59a06516b5af042ae73a4d`; its raw PNG contact shows six faint edge pixels at alpha 8–12, retained inside transparent padding rather than cropped. The Tyrant row order and two empty idle cells match the authored prompt.

For ordinary repair inputs, `world6/repair-v2/ordinary-source-provenance-v2.json` pins the five enemy-source calls plus Foundry's buff-source call. For Tyrant chronology, the report is paired with `world6/repair-v2/reviews/iron-tyrant-death-retry-provenance.json`. No ImageGen call or new prompt/reference was used for v3; this was a mechanical extraction and ownership rebuild. The v3 source audit reports zero remaining foreign-actor pixels at alpha ≥8 and preservation of each selected pose's soft edges. The overlays confirm that the removed fragments were separate neighboring actors, not missing limbs or detached effects.

The authored World6 prompts identify the Ironroot Foundry, keep routes/roads/UI out of the art, and reserve quiet gameplay corridors. Maps A–D carry different route-keep-clear vertices; B and C are not the same route. Those five landscapes were unchanged and remain accepted under the prior raw visual pass. The panel candidate remains the previously accepted scenic panel without baked labels or UI.

## Hash-pinned review records

| Evidence | SHA-256 |
|---|---|
| `world6/provenance.json` | `7995ab58b7146951500ad583902011f36c022e52bc9ae71120876f095c09a115` |
| `world6/reviews/review-state.md` | `0492c1230dd3ba3b4fdff57187f965539c9be6af3132990b099512257f62070b` |
| `world6/references/reference-chain.md` | `82a3e6d386713bb118e4d010a7a02d3015e28a0721df708017177a7e804101b8` |
| `world6/repair-v3/world6-repair-handoff-v3.md` | `61413014541e33e034decd8773ac15cc70fafc8d0e9e868dd34596f1da12783a` |
| `world6/repair-v3/repair-v3-extraction-report.json` | `ce3ad5286f27110cf874949714c41b46691b5767763bce1b1b746086d0612a53` |
| `world6/repair-v3/selfcheck-report-v3.json` | `2205ae51325934b4c098b9ed202cbe1f8e47706aef2b116140425f34d027d575` |
| `world6/repair-v2/ordinary-source-provenance-v2.json` | `ae29ae19fbae30cd3bc7660b38b4c8cc0812e5418fdc4ba6fa2d6fae04f0a5bd` |
| `world6/repair-v2/iron-tyrant-repair-v2-report.json` | `0d911ef13cc0a1661eccbf7896a49061d65b0df3ad1fc922b3731f2cfd6e6623` |
| `world6/repair-v2/reviews/iron-tyrant-death-retry-provenance.json` | `a7b31a98d6e030dc182037a2f6c3a6475c304c342c24fef21b4dc196a1f11e4a` |
| `world6/repair-v3/reviews/source-ownership-overlays-v3.png` | `2242fd8abf47e6fd1608c03882795dd6fee3442ded555bf0a6b91cfd694f56fa` |
| `world6/repair-v3/reviews/candidate-suspect-attack-cells-repair-v3.png` | `80546a1c7234a8c6cbe69c5619e31b3d0ae933f7486faa24ef23bc907832bf19` |
| `world6/repair-v3/reviews/raw-suspect-attack-neighborhoods-v3.png` | `9c0f915f99ec2b37232959ee64b2cc14e4b76d2fdb1ae180db4f31d91b0eaa75` |

## Coverage and remaining limits

Checks used `rtk python` read-only PNG/hash/metadata inspections and visual review of the existing PNG contacts/overlays. No GIF playback workaround was used. The accepted surface covers the PNG candidates, provenance, row geometry, alpha isolation, and depicted action/death poses. It does not establish animation timing, loop closure, runtime scale, or deployment status; those remain with runtime review. No source, public asset, Git, or deployment file was changed. This report is the only output in `verification/world6-raw/`.
