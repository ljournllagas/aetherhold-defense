# W9-V1 independent raw-art and provenance recheck

**Decision: PASS the 11-asset raw-art gate.** The five previously passing assets remain byte-identical to their accepted SHA-256 pins. All four repaired map candidates and both repaired atlases now pass independent source, provenance, and visual review. This is a raw-PNG decision; runtime rendering/integration is outside this review.

## Pinned candidate decisions

| Asset | Result | Exact candidate SHA-256 | Independent finding |
|---|---|---|---|
| `world-panel-astral-rift` | PASS, carried forward | `dab7467998334b9e5bb630506cca0ab684d9c55fed8098a04f5cf0a2bff4908a` | Existing panel identity remains unchanged from the prior independent pass. |
| `astral-rift-map-a` | PASS | `be0ecbc01bfcd5b4fda7ffedd7a88485e7c9bf02d5978e9a28baa3f57ebd2b2e` | Continuous dark basalt, flush violet grain, no baked route/markers/UI; all three route/plot variants remain on open level-looking floor. |
| `astral-rift-map-b` | PASS | `cf0e176ef41c74728f03256a5243bc77e73bc01c46de8d04bebe05b9456f3dab` | Continuous cool midnight basalt; no obstacle, break, baked route/markers/UI, or route/plot collision. |
| `astral-rift-map-c` | PASS | `94b137421d54dcb87e46cde7adc71c0ab5ff5f1ae790443f66555bcb71652536` | Continuous weathered ash basalt; all three variants keep required road corridors and plot clearings on unobstructed ground. |
| `astral-rift-map-d` | PASS | `3119f0db247fe479181964205235ed936f182f952362e31c8b75ecdbcd7814ab` | Distinct larger polished slabs read as the final arena and clearly differ from Map B; no baked route/markers/UI or obstructed route/plot geometry. |
| `riftling-atlas` | PASS, carried forward | `767eea2dec08a2825a323fb5cb62656c2857a247ce48aae40d93985f988695f6` | Existing raw review pass remains hash-identical. |
| `phase-hound-atlas` | PASS, carried forward | `6b26a78225e14baf8d7c39f8729b6f613ce4d637b3abae66666752f995750c13` | Existing anatomy-aware quadruped pass remains hash-identical. |
| `astral-horror-atlas` | PASS, carried forward | `15917d79ae4d4e05bc51c36470d94ea3ff87db27a12eba79cc798d319aae1140` | Existing raw review pass remains hash-identical. |
| `voidplate-atlas` | PASS, carried forward | `61b31d9a92649908e8c51dc77a83aea9c677f7789170532db9f607dbf52240b4` | Existing raw review pass remains hash-identical. |
| `rift-weaver-atlas` | PASS | `025a247ebbc0115c4ebd18f2aca659ae1a158c32a84d002e79f63e5cdbc39b18` | Correct support identity and scale; attack poses vary, repaired death row falls to and remains prone, buff poses are complete, empty idle slots remain empty, and no foreign strips or cell-boundary alpha remain. |
| `rift-sovereign-atlas` | PASS | `afeb43fde71948dcd9b45bf2e6ee528dd0ef4d4f1b4b01f42b55e00422408620` | Consistent colossal biped identity/scale; phase-two poses vary; death frames descend monotonically and stay down; floating Aether fragments read as owned character effects, with no foreign strips or cell-boundary alpha. |

## Map verification

I reviewed the four exact candidate PNGs and made a new route/plot contact sheet from the current runtime resolver (`resolveCampaignMap` in `src/game/campaign/maps.ts`), not from the producer's overlay claim. The saved geometry contains all 12 live family variants. The contact overlay shows each 46-world-unit route capsule, each 23.5-world-unit plot rim, and each 84×84-world-unit conservative footprint over the source map. Across all variants, the underlying map remains connected and level-looking, without a cliff, chasm, bridge, road-like stripe, prop, or plot marker blocking a route or plot. None of the selected maps has baked road/plot geometry or UI. Map D's broader smooth plate treatment is materially distinct from Map B's smaller, rougher slabs.

Independent checks confirm all four candidate files are 1672×940 RGB, and their SHA-256 values match the frozen repair pins. A/B/C are pixel-exact copies of their pinned raw sources. D is the declared rightmost-one-pixel crop from 1673×940 to 1672×940 with no resampling. All four actual pre-call prompt files match their recorded hashes and predate their selected raw-source files; referenced image hashes (where supplied) and geometry-guide hashes also match. The selected A lineage uses its valid Astral reference; the World 4 marsh-reference attempts and the D near-clone/diagnostic output remain recorded as rejected history, not selected candidates.

Evidence: `world9-map-independent-integrity.json`, `runtime-geometry.json`, `world9-map-candidates-contact.png`, and `world9-map-route-plot-contact.png`. The route/plot review remains visual; no game/runtime screenshot or GIF was used.

## Atlas verification

The Weaver candidate is 768×640 RGBA on a 6×5 grid. Cells 14–15 (attack), 21–23 (death), and 24/29 (buff) are the only changed cells; the other 23 cells are pixel-identical to the pinned baseline. The four idle frames remain populated and idle cells 4–5 remain empty. Repaired attack frames show distinct staff/portal casting poses; the death progression reaches a horizontal terminal pose without revival; the buff sequence returns to a steady stance. All 30 cell boundaries have zero alpha. The replacement body and portal/staff stay inside their cells, with no cross-cell bridge or detached neighbor strip.

The Sovereign candidate is 2048×1536 RGBA on an 8×6 grid. Cells 36–43 are the only changed cells; the other 40 are pixel-identical to the pinned baseline. Idle cells 6–7 remain empty. The four repaired phase-two poses preserve the same broad armored biped, camera, and scale while changing the action. Death-frame body bounds descend from 157 to 129 to 106 to 82 pixels in height (source atlas cell units), with feet near the same lower-cell origin; subsequent preserved death frames stay grounded. The floating stones and Aether effects are consistent with the authored “fractured colossal biped ringed by dislocated floating Aether stone limbs” identity. They do not resemble the earlier narrow foreign strips. All 48 cell boundaries have zero alpha; no body/effect is cut by an atlas-cell boundary.

For both atlases, I independently checked the exact candidate hashes, dimensions, alpha boundaries, empty idle slots, and unchanged-cell counts. All 15 selected raw source hashes and all 15 pre-call prompt hashes match their sidecars/provenance; every actual sidecar predates its raw output; all prompt-declared reference hashes match their local files. The generation output IDs match the raw filename tokens. No populated frames are exact duplicates. Light/dark PNG contacts and enlarged replacement-cell crops were visually reviewed; the earlier failing strips are absent, not merely hidden by a new atlas crop.

Evidence: `world9-atlas-independent-integrity.json`, `rift-weaver-atlas-repaired-cell-zooms.png`, and `rift-sovereign-atlas-repaired-cell-zooms.png`. Producer checks were supporting evidence only; acceptance came from the candidate/source bytes, sidecar chronology and references, independent cell checks, and direct PNG inspection.

## Commands, scope, and remaining limit

I ran:

```text
rtk npx tsx -e "import { writeFileSync } from 'node:fs'; import { resolveCampaignMap } from './src/game/campaign/maps.ts'; const maps:any={}; for (const f of ['a','b','c','d']) for (let v=0;v<3;v++){ const id='astral_rift_'+f+(v===0?'':String(v+1)); const m=resolveCampaignMap({mapLayoutId:id,worldId:'astral_rift',level:81+v} as any); maps[id]={waypoints:m.waypoints,buildable:m.buildable}; } writeFileSync('artifacts/campaign-final-art-20261012/verification/world9-raw/runtime-geometry.json',JSON.stringify(maps,null,2)); console.log(Object.keys(maps).length)"
rtk python artifacts/campaign-final-art-20261012/verification/world9-raw/audit_maps.py
rtk python artifacts/campaign-final-art-20261012/verification/world9-raw/audit_atlases.py
```

The original five PASS decisions are carried forward because the five current candidate hashes equal the previously accepted hashes; their earlier independent evidence remains in the original route/contact/source-grid images beside `audit.json`. No source art, production art, public asset, Git state, or deployment was changed. Raw GIF playback was not attempted or bypassed. Runtime/game integration, in-game scale, and map readability under the actual rendered road remain unverified and should be covered by the separate runtime gate.
