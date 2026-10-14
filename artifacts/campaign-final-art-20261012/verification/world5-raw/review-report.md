# Task ID W5-V1 — World5 raw-art acceptance

**Current decision: 11 PASS, 0 FAIL.** The original nine passing assets retain their prior candidate hashes and acceptance scope. The Aetherbound and Drowned Oracle repairs below pass this focused independent recheck and replace the previously failing candidate hashes. Runtime integration is outside this raw-art gate.

## Per-asset decision and pinned candidate hash

| Asset | Decision | Candidate SHA-256 | Evidence / note |
|---|---|---|---|
| Sunken Aether panel | PASS | `a8d0b31fa2d7323ee47a0a8f5de2b71d47992db0863358adbba22ea115fad0af` | `maps-panel-contact.png`; cohesive submerged-temple focal art, no text/UI. |
| Map A | PASS | `884c699225f32f88b51a970cf0593fecfb9e7cd73481a3900329a12ebbe332d7` | `maps-panel-contact.png`; open pool route space, no baked gameplay path/UI. |
| Map B | PASS | `dfd66ef9fa4c88b678a482af4ef2e6f3a522d03ac4f9ea5026dcb54a2dc1903d` | `maps-panel-contact.png`, `maps-bc-route-overlay.png`; denser broken colonnades and waterfall landmarks; center remains traversable/quiet. |
| Map C | PASS | `580c0b22d986c28e74134dbe37932bd3aa477d808dfc6787dd9deef51c053e3e` | `maps-panel-contact.png`, `maps-bc-route-overlay.png`; ringed shrine and twin cascades distinguish it from B; center remains broadly quiet. |
| Map D | PASS | `47a83efd27dfbc07d7efcf333e2e8c0aa3ba2240d7130fb076148cf457ed6225` | `maps-panel-contact.png`; distinct open boss-arena landmarking, no painted route/UI. |
| Tideborn | PASS | `c003c2ecd9fc4ec12f1fafad1ac3e52eabf654fdaa5e233bca3541e165a34122` | `atlas-enemy-tideborn-white.png`, `atlas-enemy-tideborn-dark.png`; complete actor, visibly distinct walk/attack/death, inert death end. |
| Crystal Wisp | PASS | `fe8be230637cefbef9ad887c6d628671a422fbd20e1094ccd9b50a3cbb28084d` | `atlas-enemy-crystal-wisp-white.png`, `atlas-enemy-crystal-wisp-dark.png`; attack retains core/shards/ribbons, walk floats consistently, death disperses monotonically. |
| Deepcrawler | PASS | `b4b9ec1910437a7fd270b009bb126c3442b9fa187e2ab9debeb7f2292f84504e` | `atlas-enemy-deepcrawler-white.png`, `atlas-enemy-deepcrawler-dark.png`, `focus-deepcrawler-attack.png`; broad squat body and six-legged walk read at cell scale; genuine attack/death changes. Small isolated debris/leg-like flecks persist in attack cell 5; no major body or limb is clipped. |
| Relic Guardian | PASS | `2089222291f53968107c7c3d467cd5c298c7b7ca92a1fa5a26dfe17593ca121f` | `atlas-enemy-relic-guardian-white.png`, `atlas-enemy-relic-guardian-dark.png`; faceplate identity stable; distinct gait and attack; death collapses to inert state. |
| Aetherbound | PASS | `c54ead85262b714e2c3507a9f61689b26d94f04c1bc5ad2db218fa8c0b21dd6b` | Selected repair `world5/repair-v1/candidates/aetherbound-atlas-candidate-repair-r3.png`; repaired white/dark death row in `world5/repair-v1/reviews/aetherbound-atlas-repair-r3-death-row-white.png` and `...-dark.png`. Cells 1/4/5 are clean; all six poses show collapse to inert prone end. |
| Drowned Oracle | PASS | `1710521cc2377ff1c5ca7c0a879c59aa83a523783106481c49f3210a3e205cf7` | Selected repair `world5/repair-v1/candidates/drowned-oracle-atlas-candidate-repair-r2.png`; repaired white/dark death row in `world5/repair-v1/reviews/drowned-oracle-atlas-repair-r2-death-row-white.png` and `...-dark.png`. Eight distinct poses progress from the retained clean prefix through falling, prone, and inert terminal pose; the detached fragment is gone. |

## Resolved findings from the first pass

The following findings applied to the superseded original candidate hashes (`66c49afa...ab291` for Aetherbound and `422bc0d8...dbf` for Oracle), not to the currently selected repair candidates listed above.

- **Aetherbound death cells 1, 4, and 5:** detached components were respectively 234, 161, and 204 alpha pixels (1.43%, 0.98%, and 1.25% of their 128×128 cells), at local boxes `[29,17,83,24]`, `[31,18,78,23]`, and `[44,16,93,22]`. Their exact source-sheet counterparts are visible in `focus-aetherbound-death-seam-c1-c4-c5.png`. The independent seam scan also measured 793 columns of soft alpha overlap within 3 px at the death/buff boundary, with zero hard-alpha overlap; this is useful source-edge evidence but does not alone prove the detached pieces came from that boundary. The selected repair below removes these fragments and passes the collapse/inertness check.
- **Drowned Oracle death cell 7:** a disconnected 825-pixel component at `[58,44,182,55]` (1.26% of the 256×256 cell) was visibly carried from the raw source into the original candidate, while the body itself remained in `[34,160,221,241]`. The raw source had 1,211 columns with alpha overlap within 3 px across the phase-two/death row boundary, including 712 hard-alpha columns. See `focus-oracle-phase2-death-seam-c7.png`. The selected repair below removes this fragment and passes the death/inertness check.

Deepcrawler is not failed for nominal source-grid seam contact: its actor is unusually squat by design, with an idle body around 0.61 cell height but about 0.80 cell width. The full carapace/six-leg silhouette and gait remain legible; the isolated small flecks do not sever a required limb or body contour.

## W5-R1 focused repair recheck

I reviewed the two selected repair files, repair-v1 self-checks, contributing provenance records, prompt/reference sidecars, raw source boards, and light/dark death-row contacts. Producer self-check claims were not treated as independent approval.

- **Aetherbound:** `world5/repair-v1/candidates/aetherbound-atlas-candidate-repair-r3.png` matches pinned SHA-256 `c54ead85262b714e2c3507a9f61689b26d94f04c1bc5ad2db218fa8c0b21dd6b` (768×640 RGBA). A direct pixel comparison with the prior candidate found changes only at death row 3, columns 1, 4, and 5; the remaining 27 cells are byte-identical. The three replaced frames are distinct, preserve the actor/camera, and show the continuing collapse into a prone inert terminal pose. White/dark contacts show the former detached strips are absent. The full atlas has 28 unique used frames, the two unused idle cells remain transparent, and no alpha touches any cell border.
- **Drowned Oracle:** `world5/repair-v1/candidates/drowned-oracle-atlas-candidate-repair-r2.png` matches pinned SHA-256 `1710521cc2377ff1c5ca7c0a879c59aa83a523783106481c49f3210a3e205cf7` (2048×1536 RGBA). Direct pixel comparison confirms rows 0–4 are byte-identical to the prior candidate. Death slots 0–3 come from the reviewed clean prefix; slots 4–7 come from the new late-pose board. In the complete row, the Oracle loses its upright stance, falls forward/sideways, settles prone, and remains inert in slot 7; the apparent bbox-height variation in an intermediate pose comes from the tilted halo/cape silhouette, and the actor does not return to an upright stance. White/dark contacts show the prior detached strip is absent. All 46 used frames are pixel-distinct, the two unused idle cells remain transparent, and no alpha touches any cell border.
- **Prompt, reference, and raw-output lineage:** for Aetherbound generation calls r3, r7, and r8 and Oracle late-pose call r2, I independently recomputed each prompt hash, reference-sidecar hash, every listed reference-image hash, generated tool-output hash, and copied raw-output hash. All matched their provenance declarations. Each prompt and reference sidecar predates its linked generation output. The identity reference and source camera/scale context remain tied to the authored asset; no repair source was upscaled.
- **Overall scope:** the original nine accepted candidate hashes remain unchanged from the first report. Replacing only the two previously failing candidate selections yields 11 raw-art PASS results.

## Coverage, lineage, and limitations

I read the package `SELF_CHECK.md`, `provenance/index.json`, all eleven per-asset provenance sidecars, their generation prompt/reference sidecars, `artifacts/CODEX_FINAL_ART_IMPLEMENTATION_PROMPT.md`, and the authored World05 panel/map/atlas briefs. The shared final-art prompt provides workflow guidance; asset-specific authored briefs and generation prompts supplied the World5 acceptance criteria. The producer self-check was treated as a claim to verify, not as acceptance evidence.

Independent inspection used the script `inspect_world5.py` and its `independent-measurements.json` output for the original package, plus direct SHA-256 and pixel comparisons for the two repairs. The original eleven candidates match the index SHA-256. For the selected repairs, all contributing raw generation copies match their declared and recorded image-generation output hashes; prompt and reference-sidecar hashes match; every referenced image hash matches; and all contributing prompt/reference sidecars predate the linked generation output. There are zero lineage mismatches in the recorded evidence.

All six atlases have their authored cell dimensions and expected occupied/empty-cell counts, zero candidate alpha on cell borders, and distinct exact pixel frames (regular enemy atlases 22, Aetherbound 28, Oracle 46). The ordinary enemy and Aetherbound sprites read at approximately the requested 78% normal-body footprint, allowing row-specific attacks/deaths and anatomy-aware Deepcrawler height variation. Oracle uses 256-pixel cells as authored; body size and detail were judged at final 0.78 contract scale, not from source dimensions alone. Review found no genuine full-body canvas clips, cell-bridging body poses, identity substitution, baked roads/UI, or death revival. B/C map route overlay is a geometry approximation at the authored coordinates, not runtime integration or collision verification.

Raw GIF playback was not attempted because the environment policy denies it; animation review used PNG contact sheets and per-frame inspection only. The evidence does not establish runtime animation timing, compositing, or deployment behavior. No production files, public assets, source art, Git state, or deployment targets were changed.

## Evidence files

- `independent-measurements.json` — first-pass candidate hashes, measured dimensions/frames, source seam evidence, reference hashes, and prompt/output chronology.
- `inspect_world5.py` — reproducible read-only inspection script.
- `maps-panel-contact.png`, `maps-bc-route-overlay.png` — panel/map inspection.
- `atlas-*-white.png`, `atlas-*-dark.png` — transparent atlas inspection on light/dark backgrounds.
- `raw-source-*` contacts — documented source grids, including repaired rows.
- `focus-*` contacts — targeted pose and seam evidence cited above.
- For the repair recheck, light/dark contacts, raw boards, self-checks, and provenance/prompt/reference sidecars are under `artifacts/campaign-final-art-20261012/world5/repair-v1/`; the chosen candidate hashes and the independently checked results are recorded in this report.
