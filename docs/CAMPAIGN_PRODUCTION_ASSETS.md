# Campaign Production Assets — Worlds 1–3

[`src/game/campaign/artManifest.ts`](../src/game/campaign/artManifest.ts) defines
43 raster targets. The current manifest has 25 `final` targets: three accepted
world panels, all twelve terrain plates, and ten Tier II/III tower sprites.
The remaining eighteen enemy/boss atlases are `final_required` and absent.
V7 passed raw review of all twelve terrain plates; P5 staged the eleven
remaining plates, and all twelve are now manifest-final and allowlisted.
V6 passed the combined three-world map/tower runtime visual review. The eighteen
enemy/boss atlases are absent and retain their procedural fallback; overall
final art remains UNVERIFIED. The production release completed under the user's
explicit missing-art allowance. V9 passed all-caller viewport-mask precision
and lifecycle verification ([results](../artifacts/campaign-production-completion-20261010/verification/v9-viewport-mask/v9-viewport-mask-results.json)); physical-device touch remains unverified. The loader requests an asset only when its manifest state is `final` and its exact path is in `AVAILABLE_CAMPAIGN_ART_PATHS`.

[`CAMPAIGN_PRODUCTION_ART_PROVENANCE.md`](CAMPAIGN_PRODUCTION_ART_PROVENANCE.md)
records all twelve terrain prompts, reference chains, source/output hashes, all
ten tower prompts and repair chains, and the exact eighteen missing atlas paths.
[`CAMPAIGN_WORLD_MAP_ART_PROVENANCE.md`](CAMPAIGN_WORLD_MAP_ART_PROVENANCE.md)
retains the accepted panels' prompts, references, crop packaging and hashes.

Atlas row indices below are zero-based. `rN×M` means row N with M frames. The
three realm panels, all twelve terrain plates, and all ten tower sprites have
`state=final, temporary=null`. The remaining eighteen atlas entries have
`state=final_required, temporary=procedural`.

| ID | Required path | Dimensions / stage / kind | States and exact quality flags |
| --- | --- | --- | --- |
| `map:borderkeep:a` | `/assets/campaign/maps/borderkeep_a-v1.png` | 1672×940 · gameplay · image | final · temporary:null · V7 raw PASS; V6 combined runtime PASS · `terrain_plate`, `runtime_geometry_overlay` |
| `map:borderkeep:b` | `/assets/campaign/maps/borderkeep_b-v1.png` | 1672×940 · gameplay · image | final · temporary:null · V7 raw PASS; V6 combined runtime PASS · `terrain_plate`, `runtime_geometry_overlay` |
| `map:borderkeep:c` | `/assets/campaign/maps/borderkeep_c-v1.png` | 1672×940 · gameplay · image | final · temporary:null · V7 raw PASS; V6 combined runtime PASS · `terrain_plate`, `runtime_geometry_overlay` |
| `map:borderkeep:d` | `/assets/campaign/maps/borderkeep_d-v1.png` | 1672×940 · gameplay · image | final · temporary:null · V7 raw PASS; V6 combined runtime PASS · `terrain_plate`, `runtime_geometry_overlay` |
| `map:emberfall:a` | `/assets/campaign/maps/emberfall_a-v1.png` | 1672×940 · gameplay · image | final · temporary:null · V7 raw PASS; V6 combined runtime PASS · `terrain_plate`, `runtime_geometry_overlay` |
| `map:emberfall:b` | `/assets/campaign/maps/emberfall_b-v1.png` | 1672×940 · gameplay · image | final · temporary:null · V7 raw PASS; V6 combined runtime PASS · `terrain_plate`, `runtime_geometry_overlay` |
| `map:emberfall:c` | `/assets/campaign/maps/emberfall_c-v1.png` | 1672×940 · gameplay · image | final · temporary:null · V7 raw PASS; V6 combined runtime PASS · `terrain_plate`, `runtime_geometry_overlay` |
| `map:emberfall:d` | `/assets/campaign/maps/emberfall_d-v1.png` | 1672×940 · gameplay · image | final · temporary:null · V7 raw PASS; V6 combined runtime PASS · `terrain_plate`, `runtime_geometry_overlay` |
| `map:frostveil:a` | `/assets/campaign/maps/frostveil_a-v1.png` | 1672×940 · gameplay · image | final · temporary:null · V7 raw PASS; V6 combined runtime PASS · `terrain_plate`, `runtime_geometry_overlay` |
| `map:frostveil:b` | `/assets/campaign/maps/frostveil_b-v1.png` | 1672×940 · gameplay · image | final · temporary:null · V7 raw PASS; V6 combined runtime PASS · `terrain_plate`, `runtime_geometry_overlay` |
| `map:frostveil:c` | `/assets/campaign/maps/frostveil_c-v1.png` | 1672×940 · gameplay · image | final · temporary:null · V7 raw PASS; V6 combined runtime PASS · `terrain_plate`, `runtime_geometry_overlay` |
| `map:frostveil:d` | `/assets/campaign/maps/frostveil_d-v1.png` | 1672×940 · gameplay · image | final · temporary:null · V7 raw PASS; V6 combined runtime PASS · `terrain_plate`, `runtime_geometry_overlay` |
| `world-panel:borderkeep` | `/assets/campaign/world-map/borderkeep-v1.png` | 768×432 · campaign · image | final · temporary:null · none · `biome_illustration` |
| `world-panel:emberfall` | `/assets/campaign/world-map/emberfall-v1.png` | 768×432 · campaign · image | final · temporary:null · none · `biome_illustration` |
| `world-panel:frostveil` | `/assets/campaign/world-map/frostveil-v1.png` | 768×432 · campaign · image | final · temporary:null · none · `biome_illustration` |
| `enemy:marchling` | `/assets/campaign/enemies/borderkeep/marchling-atlas-v1.png` | 768×512 · gameplay · sheet · 128×128 cell | idle r0×4, walk r1×6, attack r2×6, death r3×6 · `final_art_unverified`, `transparent_png_required`, `consistent_feet_anchor`, `no_baked_ui_or_large_shadow` |
| `enemy:skitter` | `/assets/campaign/enemies/borderkeep/skitter-atlas-v1.png` | 768×512 · gameplay · sheet · 128×128 cell | idle r0×4, walk r1×6, attack r2×6, death r3×6 · `final_art_unverified`, `transparent_png_required`, `consistent_feet_anchor`, `no_baked_ui_or_large_shadow` |
| `enemy:stoneback` | `/assets/campaign/enemies/borderkeep/stoneback-atlas-v1.png` | 768×512 · gameplay · sheet · 128×128 cell | idle r0×4, walk r1×6, attack r2×6, death r3×6 · `final_art_unverified`, `transparent_png_required`, `consistent_feet_anchor`, `no_baked_ui_or_large_shadow` |
| `enemy:ironhide` | `/assets/campaign/enemies/borderkeep/ironhide-atlas-v1.png` | 768×512 · gameplay · sheet · 128×128 cell | idle r0×4, walk r1×6, attack r2×6, death r3×6 · `final_art_unverified`, `transparent_png_required`, `consistent_feet_anchor`, `no_baked_ui_or_large_shadow` |
| `enemy:veilborn` | `/assets/campaign/enemies/borderkeep/veilborn-atlas-v1.png` | 768×512 · gameplay · sheet · 128×128 cell | idle r0×4, walk r1×6, attack r2×6, death r3×6 · `final_art_unverified`, `transparent_png_required`, `consistent_feet_anchor`, `no_baked_ui_or_large_shadow` |
| `enemy:cinderling` | `/assets/campaign/enemies/emberfall/cinderling-atlas-v1.png` | 768×512 · gameplay · sheet · 128×128 cell | idle r0×4, walk r1×6, attack r2×6, death r3×6 · `final_art_unverified`, `transparent_png_required`, `consistent_feet_anchor`, `no_baked_ui_or_large_shadow` |
| `enemy:ashrunner` | `/assets/campaign/enemies/emberfall/ashrunner-atlas-v1.png` | 768×512 · gameplay · sheet · 128×128 cell | idle r0×4, walk r1×6, attack r2×6, death r3×6 · `final_art_unverified`, `transparent_png_required`, `consistent_feet_anchor`, `no_baked_ui_or_large_shadow` |
| `enemy:magmahide` | `/assets/campaign/enemies/emberfall/magmahide-atlas-v1.png` | 768×512 · gameplay · sheet · 128×128 cell | idle r0×4, walk r1×6, attack r2×6, death r3×6 · `final_art_unverified`, `transparent_png_required`, `consistent_feet_anchor`, `no_baked_ui_or_large_shadow` |
| `enemy:ember_brute` | `/assets/campaign/enemies/emberfall/ember_brute-atlas-v1.png` | 768×512 · gameplay · sheet · 128×128 cell | idle r0×4, walk r1×6, attack r2×6, death r3×6 · `final_art_unverified`, `transparent_png_required`, `consistent_feet_anchor`, `no_baked_ui_or_large_shadow` |
| `enemy:ashcaller` | `/assets/campaign/enemies/emberfall/ashcaller-atlas-v1.png` | 768×640 · gameplay · sheet · 128×128 cell | idle r0×4, walk r1×6, attack r2×6, death r3×6, buff r4×6 · `final_art_unverified`, `transparent_png_required`, `consistent_feet_anchor`, `no_baked_ui_or_large_shadow`, `support_buff_playback_unverified` |
| `enemy:snowstalker` | `/assets/campaign/enemies/frostveil/snowstalker-atlas-v1.png` | 768×512 · gameplay · sheet · 128×128 cell | idle r0×4, walk r1×6, attack r2×6, death r3×6 · `final_art_unverified`, `transparent_png_required`, `consistent_feet_anchor`, `no_baked_ui_or_large_shadow` |
| `enemy:icebound` | `/assets/campaign/enemies/frostveil/icebound-atlas-v1.png` | 768×512 · gameplay · sheet · 128×128 cell | idle r0×4, walk r1×6, attack r2×6, death r3×6 · `final_art_unverified`, `transparent_png_required`, `consistent_feet_anchor`, `no_baked_ui_or_large_shadow` |
| `enemy:frostback` | `/assets/campaign/enemies/frostveil/frostback-atlas-v1.png` | 768×512 · gameplay · sheet · 128×128 cell | idle r0×4, walk r1×6, attack r2×6, death r3×6 · `final_art_unverified`, `transparent_png_required`, `consistent_feet_anchor`, `no_baked_ui_or_large_shadow` |
| `enemy:glacier_knight` | `/assets/campaign/enemies/frostveil/glacier_knight-atlas-v1.png` | 768×512 · gameplay · sheet · 128×128 cell | idle r0×4, walk r1×6, attack r2×6, death r3×6 · `final_art_unverified`, `transparent_png_required`, `consistent_feet_anchor`, `no_baked_ui_or_large_shadow` |
| `enemy:frost_shaman` | `/assets/campaign/enemies/frostveil/frost_shaman-atlas-v1.png` | 768×640 · gameplay · sheet · 128×128 cell | idle r0×4, walk r1×6, attack r2×6, death r3×6, buff r4×6 · `final_art_unverified`, `transparent_png_required`, `consistent_feet_anchor`, `no_baked_ui_or_large_shadow`, `support_buff_playback_unverified` |
| `boss:hollow_warden` | `/assets/campaign/bosses/hollow_warden-atlas-v1.png` | 2048×1280 · gameplay · sheet · 256×256 cell | idle r0×6, walk r1×8, attack r2×8, special r3×8, death r4×8 · `final_art_unverified`, `transparent_png_required`, `consistent_feet_anchor`, `phase_state_readability_required` |
| `boss:cinder_colossus` | `/assets/campaign/bosses/cinder_colossus-atlas-v1.png` | 2048×1536 · gameplay · sheet · 256×256 cell | idle r0×6, walk r1×8, attack r2×8, armor_break r3×8, exposed_core r4×8, death r5×8 · `final_art_unverified`, `transparent_png_required`, `consistent_feet_anchor`, `phase_state_readability_required` |
| `boss:frostbound_matriarch` | `/assets/campaign/bosses/frostbound_matriarch-atlas-v1.png` | 2048×1536 · gameplay · sheet · 256×256 cell | idle r0×6, walk r1×8, attack r2×8, freeze_cast r3×8, phase_two r4×8, death r5×8 · `final_art_unverified`, `transparent_png_required`, `consistent_feet_anchor`, `phase_state_readability_required` |
| `tower:longbow:tier2` | `/assets/campaign/towers/longbow-tier2-v1.png` | 192×192 · gameplay · image | final · temporary:null · none · `transparent_png_required`, `cosmetic_only`, `classic_art_unchanged` |
| `tower:longbow:tier3` | `/assets/campaign/towers/longbow-tier3-v1.png` | 192×192 · gameplay · image | final · temporary:null · none · `transparent_png_required`, `cosmetic_only`, `classic_art_unchanged` |
| `tower:ember:tier2` | `/assets/campaign/towers/ember-tier2-v1.png` | 192×192 · gameplay · image | final · temporary:null · none · `transparent_png_required`, `cosmetic_only`, `classic_art_unchanged` |
| `tower:ember:tier3` | `/assets/campaign/towers/ember-tier3-v1.png` | 192×192 · gameplay · image | final · temporary:null · none · `transparent_png_required`, `cosmetic_only`, `classic_art_unchanged` |
| `tower:glacier:tier2` | `/assets/campaign/towers/glacier-tier2-v1.png` | 192×192 · gameplay · image | final · temporary:null · none · `transparent_png_required`, `cosmetic_only`, `classic_art_unchanged` |
| `tower:glacier:tier3` | `/assets/campaign/towers/glacier-tier3-v1.png` | 192×192 · gameplay · image | final · temporary:null · none · `transparent_png_required`, `cosmetic_only`, `classic_art_unchanged` |
| `tower:starfire:tier2` | `/assets/campaign/towers/starfire-tier2-v1.png` | 192×192 · gameplay · image | final · temporary:null · none · `transparent_png_required`, `cosmetic_only`, `classic_art_unchanged` |
| `tower:starfire:tier3` | `/assets/campaign/towers/starfire-tier3-v1.png` | 192×192 · gameplay · image | final · temporary:null · none · `transparent_png_required`, `cosmetic_only`, `classic_art_unchanged` |
| `tower:tempest:tier2` | `/assets/campaign/towers/tempest-tier2-v1.png` | 192×192 · gameplay · image | final · temporary:null · none · `transparent_png_required`, `cosmetic_only`, `classic_art_unchanged` |
| `tower:tempest:tier3` | `/assets/campaign/towers/tempest-tier3-v1.png` | 192×192 · gameplay · image | final · temporary:null · none · `transparent_png_required`, `cosmetic_only`, `classic_art_unchanged` |

No standalone raster is required for route-node circles/road crossings/boss crests,
Mastery Star glyphs or World Sigil labels; the manifest declares these as
procedural/vector or text UI. The support buff playback flags above remain
unverified until approved support atlases are integrated and viewed in game.

Sprite acceptance follows `docs/ART_BIBLE.md` and the expansion pack's sprite
production guide: transparent edges, consistent anchors, legible silhouettes at
gameplay scale, correct animation states, no baked UI, and review against terrain,
health bars and active effects. Concept-board crops are references only and are
not accepted as production atlases. V6 passed the combined map/tower visual
review using all twelve manifest-final terrain plates. Its actual-loader sweep
covered all 30 campaign levels plus six tower-tier matrix cases; the boss
overlay run captured 20 phase views and passed threshold and pause/speed/restart
checks. Eighteen enemy/boss atlases remain absent with procedural fallbacks, so
final art remains UNVERIFIED. The production release completed under the user's
explicit missing-art allowance. V9 passed all-caller viewport-mask precision
and lifecycle verification; physical-device touch remains unverified. If a
future review rejects a plate, move its public copy out of `public/` before any
subsequent release build/deploy and preserve the original. The exact atlas paths and attempt status are in
[`CAMPAIGN_PRODUCTION_ART_PROVENANCE.md`](CAMPAIGN_PRODUCTION_ART_PROVENANCE.md).
The three world-panel acceptance records and exact prompts remain in
[`CAMPAIGN_WORLD_MAP_ART_PROVENANCE.md`](CAMPAIGN_WORLD_MAP_ART_PROVENANCE.md).

## Published release — 2026-10-10

Deployment `campaign-production-completion-20261010` is live at
https://aetherhold-defense.ljournllagas.workers.dev/ (Worker
`af75da8f-9800-42ce-919d-e823a0ad471a`). The 939-test / 11-skip suite,
typecheck and build passed. HTML, JavaScript, CSS and all 25 campaign PNGs
returned 200 and matched `dist`; `/api/health` returned 200 with `ok: true` and
`scoreVersion: 3`. See the [live verification](../artifacts/campaign-production-completion-20261010/verification/release/live-verification-p6.json)
and [ordinary live smoke](../artifacts/campaign-production-completion-20261010/verification/release/native-live-smoke-p6.json).
The 18 absent atlases remain UNVERIFIED under the approved allowance.
Implementation sync passed: commit
`d4d54623ccc5e4a833908e5fe127958f9b072c58` is pushed to `origin/main` with 55
task files, including 22 PNGs; 23 unrelated scratch files were preserved. The
closure documentation requires a docs-only commit/push next.
