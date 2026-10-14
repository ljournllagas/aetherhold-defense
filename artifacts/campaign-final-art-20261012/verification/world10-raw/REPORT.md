# W10-V1 — Independent World 10 raw acceptance

**Current selected raw decision: PASS, 11/11 assets.** Four repair-v2 maps replace the original failed map candidates below; the previous seven passing assets remain byte-identical. This decision covers raw art and provenance only.

## Current selected candidate set

| Asset | Decision | Candidate SHA-256 | Generation output ID |
|---|---|---|---|
| world-panel | PASS | `f8f435616240ba841b84bcd472bae3eeb961f0a6408c8d236363b94a0eeef083` | `exec-f5bacce9-fb2a-4f33-ac9b-4bcc3f487dea` |
| map-a (repair-v2 attempt 2) | PASS | `2a5a18c73d4914f8451b0d8b74c9a936f8a611c2db1879c2269a468fa339daa9` | `exec-d3f0d9ec-c458-47f6-9413-1b703e1797e0` |
| map-b (repair-v2 attempt 1) | PASS | `066eda646130c0847701b1f1694104f276fa24fccd81ec07c688ae445f11097b` | `exec-0a6c44b6-d20a-4137-8d6e-4311d2548338` |
| map-c (repair-v2 attempt 1) | PASS | `024234dcf969ccea0f76141471a2b200815bb15e0cb4b99be46bbc7b5db2d964` | `exec-4bade873-82ef-4a4b-92fb-ad1a7a36e380` |
| map-d (repair-v2 attempt 1) | PASS | `49e427473869ca967add41f80d237e2b2978b467dc3218cc0f0493e0da6926cb` | `exec-0908b7cc-aea5-40a0-b3a0-c5a464601eaf` |
| aetherborn | PASS | `17323698c1f2bf34939390e56726bb2f5cd8b1f1f2307e1098fe81bdaa7beb30` | retained original selected candidate |
| crown-runner | PASS | `e177eae916c36c576c0190e411e6f46239e2c6bbe9f8f9600705486c1e6cf417` | retained original selected candidate |
| aether-seer | PASS | `026c459442aaa6e98ed9ce5be856b90005edafa1bfed6f54a26db401939c7c05` | retained original selected candidate |
| sentry-colossus | PASS | `31c9a5eda829070c05e0b2571eafaece2af1382859a0a26ee3ffd953932f2edc` | retained original selected candidate |
| crown-archon | PASS | `28098ac3e6433f91759c2327ab01614322e2e1e3152fd3ee78d7750fc91e9fb9` | retained original selected candidate |
| aether-devourer | PASS | `4ce4f9d0d079ae04968c6f4659f10822f8e603a84e68565602d5c9c7e03a103c` | retained original selected candidate |

## Original candidate decisions (map hashes superseded)

### Initial hash-pinned decisions

| Asset | Decision | Candidate SHA-256 |
|---|---|---|
| world-panel | PASS | `f8f435616240ba841b84bcd472bae3eeb961f0a6408c8d236363b94a0eeef083` |
| map-a | FAIL | `9e8dcd07641684aa7bfc62b1526b850b63b8a110834e89b5774a1dbf8bbe2a9c` |
| map-b | FAIL | `585893ced89df56dbafb42705b34fa6cbe09cd2cba8c3ca9d1dd751528b66776` |
| map-c | FAIL | `66b32463a86e20f19b661d0e53a265ada6283d0ce069c8e8cf5f7690f20ac697` |
| map-d | FAIL | `3d47e9cd2dc749ee8231fd39b91f83e6fd7bb9554d135a2b773aee9df408890b` |
| aetherborn | PASS | `17323698c1f2bf34939390e56726bb2f5cd8b1f1f2307e1098fe81bdaa7beb30` |
| crown-runner | PASS | `e177eae916c36c576c0190e411e6f46239e2c6bbe9f8f9600705486c1e6cf417` |
| aether-seer | PASS | `026c459442aaa6e98ed9ce5be856b90005edafa1bfed6f54a26db401939c7c05` |
| sentry-colossus | PASS | `31c9a5eda829070c05e0b2571eafaece2af1382859a0a26ee3ffd953932f2edc` |
| crown-archon | PASS | `28098ac3e6433f91759c2327ab01614322e2e1e3152fd3ee78d7750fc91e9fb9` |
| aether-devourer | PASS | `4ce4f9d0d079ae04968c6f4659f10822f8e603a84e68565602d5c9c7e03a103c` |

All listed candidate hashes match the package self-check and the candidate hashes recorded by provenance. Static outputs are the expected opaque RGB dimensions; atlases are RGBA with transparent backgrounds.

## Original map findings (superseded)

I overlaid the authored route geometry and generated build-plot centres on each exact map candidate, then checked plot-radius contacts. The route centre paths and quiet central floor areas are readable, the four map families have distinct compositions, and the candidate art contains no baked route lines or UI. The build areas do not remain clear across the required variants: 23.5-world-unit plot rims intersect prominent scenery.

- **map-a:** A0-04 at `(535.833, 219.5)` intersects a square stone ruin; A0-06 at `(805, 219.5)` sits against a large wall/pillar; A0-13 at `(176.5, 506)` overlaps the crystal-and-rubble cluster. A1-01 and A2-01 also land on arch/wall scenery.
- **map-b:** B0-11 at `(393.5, 536)` and B0-12 at `(666.16, 524.175)` are centered on ornate columns; B1-03 also overlaps a column. Other plots intersect ruin bases and rock/plant clusters.
- **map-c:** C0-01 at `(217.234, 101.811)` overlaps a broken wall; C0-04 at `(646.663, 120.326)` intersects an arch/pillar group. Similar obstructions occur in B/C-family variants around the cliffs, crystals, and arches.
- **map-d:** D0-02 at `(321.756, 142.5)` overlaps ruin masonry; D0-04 at `(641.244, 142.5)` intersects an arch/pillar; D0-05 at `(793, 142.5)` is against a tall tower structure; D0-15 lands on the blue arch/crystal group.

The route-and-plot overlays and full plot contact sheets are `map-{a,b,c,d}-route-and-plots-review.png` and `map-{a,b,c,d}-buildplot-contact.png` in this folder. These show reviewer overlays; they are not part of the submitted art.

## Atlas and panel findings

All six atlas candidates rebuild pixel-for-pixel from the pinned raw source sheets using their recorded extraction, fit, and placement operations. Their frame counts, row order, exact empty idle cells, frame uniqueness, and transparent margins match the authored briefs. Every cell has zero nontransparent pixels on its border. Normal-bodied units use the intended roughly 78% maximum fit while preserving shape; the Crown Runner's shorter quadruped silhouette is naturally wide and remains full-sized. The boss is assembled at native 256-pixel cells without upscaling; the four-horned figure and exposed heart persist through its rows, the special uses one compact rift, and no idle echoes or duplicate figures appear. Attack poses differ from idle, and the reviewed death rows progress into a downed body without a visible revival.

Alpha-matte PNG contacts were reviewed on light, mid-gray, and dark backgrounds. No GIF was played. The panel is a coherent ruined Aether Crown landscape with a clear central approach and no baked gameplay markings.

## Provenance and method

The independent audit examined all 46 provenance JSON records (45 unique generation output IDs). The 32 selected candidate/source output IDs—five panel/map outputs and 27 atlas action-source outputs—each have matching raw hashes, normalized prompt hashes, pre-call reference sidecars, recorded pre-call times, sidecar timestamps preceding the generated source, and exact reference hashes. All 84 inspected reference hashes match. Candidate pixel reconstruction is exact for all 11 assets, with zero differing pixels.

One history-only issue is outside the selected lineage: a superseded Aetherborn attack alias shares output ID `exec-392e4e65-7e27-4c36-9f5c-9af6c3192480`; its selected atlas instead uses attempt 3. The superseded panel attempt 1 has a raw, non-JSON sidecar without a structured `preparedUtc`; selected panel attempt 2 has a valid pre-call sidecar and passes. These do not alter the selected candidates' acceptance.

Commands/methods: `rtk python artifacts/campaign-final-art-20261012/verification/world10-raw/audit_world10.py`; independent SHA/prompt/reference checks and deterministic pixel reconstruction in that script; read-only route/build-plot geometry review against `src/game/campaign/expansionRoutes.ts`, `src/game/campaign/maps.ts`, and `src/game/maps/buildPlotPolicy.ts`; PNG contact-sheet visual review. Package self-check SHA-256: `1a7e5441173cac919a342a2eb5c04838129d1457449baaa4f98986ea5802ee0c`. Audit JSON SHA-256: `a0154c1c48cff3608d795dfe5e16c13e711fee3fcbb9805093fecf69426a2372`.

## Focused repair-v2 recheck and limits

All four repair-v2 selections are opaque RGB at 1672×940 and have exact source-to-candidate reconstruction. A–C retain the raw source at native dimensions; D is a one-pixel right-edge trim without resampling. The generation output IDs match provenance and the producer self-check. Each selected prompt hash matches its pre-call sidecar and provenance; all four sidecars were prepared before the source files, and all four pinned World 4 brushwork/camera reference hashes match the actual referenced image. No roads, route symbols, UI, props, or hard-edged gameplay marks appear in the candidates.

I independently checked 10 supported route variants and all 142 authored plot centres, overlaying each 46-world-unit route envelope, 84×84-world-unit tower-clearance square, and 23.5-world-unit plot rim. Every overlay location falls on continuous low-contrast paving, with only ordinary paving joints, mineral grain, and faint scuffs. The four courts share the required Crown marble biome but retain distinguishable surface treatments: A smoother softened slabs; B denser fine-grain veining; C diffuse mineral clouding; D broader calm grain and a gentle warm-to-cool light shift. Their tonal differences are subtle by design; no architectural landmarks were required for these quiet courts.

Fresh reviewer overlays: `repair-v2-map-{a,b,c,d}-all-variants-review.png`. Audit script: `repair_v2_recheck.py`; detailed machine evidence: `repair-v2-audit.json` (SHA-256 `704013cd31b261fdd850cacab1f74be710742001b067637653e3d5c5eabc3608`). The script completed successfully and confirms the prior seven candidate hashes are unchanged.

This is raw asset and lineage acceptance only. No game runtime or gameplay integration was exercised, and no public/source art was changed.
