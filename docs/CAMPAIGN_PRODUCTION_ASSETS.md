# Campaign Production Assets — Worlds 1–3

[`src/game/campaign/artManifest.ts`](../src/game/campaign/artManifest.ts) defines
43 required raster targets. All 43 currently have `state=final_required` and
`temporary=procedural`; none is queued by the production loader. The exact path
must be listed in `AVAILABLE_CAMPAIGN_ART_PATHS` and the manifest entry promoted
to `final` before it can be loaded. Current procedural biome art and concept
references do not meet final-art acceptance. Final-art verification is
**UNVERIFIED**.

Atlas row indices below are zero-based. `rN×M` means row N with M frames. Every
entry inherits `final_required` and `temporary=procedural`.

| ID | Required path | Dimensions / stage / kind | States and exact quality flags |
| --- | --- | --- | --- |
| `map:borderkeep:a` | `/assets/campaign/maps/borderkeep_a-v1.png` | 1672×940 · gameplay · image | none · `final_art_unverified`, `procedural_biome_fallback` |
| `map:borderkeep:b` | `/assets/campaign/maps/borderkeep_b-v1.png` | 1672×940 · gameplay · image | none · `final_art_unverified`, `procedural_biome_fallback` |
| `map:borderkeep:c` | `/assets/campaign/maps/borderkeep_c-v1.png` | 1672×940 · gameplay · image | none · `final_art_unverified`, `procedural_biome_fallback` |
| `map:borderkeep:d` | `/assets/campaign/maps/borderkeep_d-v1.png` | 1672×940 · gameplay · image | none · `final_art_unverified`, `procedural_biome_fallback` |
| `map:emberfall:a` | `/assets/campaign/maps/emberfall_a-v1.png` | 1672×940 · gameplay · image | none · `final_art_unverified`, `procedural_biome_fallback` |
| `map:emberfall:b` | `/assets/campaign/maps/emberfall_b-v1.png` | 1672×940 · gameplay · image | none · `final_art_unverified`, `procedural_biome_fallback` |
| `map:emberfall:c` | `/assets/campaign/maps/emberfall_c-v1.png` | 1672×940 · gameplay · image | none · `final_art_unverified`, `procedural_biome_fallback` |
| `map:emberfall:d` | `/assets/campaign/maps/emberfall_d-v1.png` | 1672×940 · gameplay · image | none · `final_art_unverified`, `procedural_biome_fallback` |
| `map:frostveil:a` | `/assets/campaign/maps/frostveil_a-v1.png` | 1672×940 · gameplay · image | none · `final_art_unverified`, `procedural_biome_fallback` |
| `map:frostveil:b` | `/assets/campaign/maps/frostveil_b-v1.png` | 1672×940 · gameplay · image | none · `final_art_unverified`, `procedural_biome_fallback` |
| `map:frostveil:c` | `/assets/campaign/maps/frostveil_c-v1.png` | 1672×940 · gameplay · image | none · `final_art_unverified`, `procedural_biome_fallback` |
| `map:frostveil:d` | `/assets/campaign/maps/frostveil_d-v1.png` | 1672×940 · gameplay · image | none · `final_art_unverified`, `procedural_biome_fallback` |
| `world-panel:borderkeep` | `/assets/campaign/world-map/borderkeep-v1.png` | 768×432 · menu · image | none · `final_art_unverified`, `biome_illustration` |
| `world-panel:emberfall` | `/assets/campaign/world-map/emberfall-v1.png` | 768×432 · menu · image | none · `final_art_unverified`, `biome_illustration` |
| `world-panel:frostveil` | `/assets/campaign/world-map/frostveil-v1.png` | 768×432 · menu · image | none · `final_art_unverified`, `biome_illustration` |
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
| `tower:longbow:tier2` | `/assets/campaign/towers/longbow-tier2-v1.png` | 192×192 · gameplay · image | none · `final_art_unverified`, `transparent_png_required`, `cosmetic_only`, `classic_art_unchanged` |
| `tower:longbow:tier3` | `/assets/campaign/towers/longbow-tier3-v1.png` | 192×192 · gameplay · image | none · `final_art_unverified`, `transparent_png_required`, `cosmetic_only`, `classic_art_unchanged` |
| `tower:ember:tier2` | `/assets/campaign/towers/ember-tier2-v1.png` | 192×192 · gameplay · image | none · `final_art_unverified`, `transparent_png_required`, `cosmetic_only`, `classic_art_unchanged` |
| `tower:ember:tier3` | `/assets/campaign/towers/ember-tier3-v1.png` | 192×192 · gameplay · image | none · `final_art_unverified`, `transparent_png_required`, `cosmetic_only`, `classic_art_unchanged` |
| `tower:glacier:tier2` | `/assets/campaign/towers/glacier-tier2-v1.png` | 192×192 · gameplay · image | none · `final_art_unverified`, `transparent_png_required`, `cosmetic_only`, `classic_art_unchanged` |
| `tower:glacier:tier3` | `/assets/campaign/towers/glacier-tier3-v1.png` | 192×192 · gameplay · image | none · `final_art_unverified`, `transparent_png_required`, `cosmetic_only`, `classic_art_unchanged` |
| `tower:starfire:tier2` | `/assets/campaign/towers/starfire-tier2-v1.png` | 192×192 · gameplay · image | none · `final_art_unverified`, `transparent_png_required`, `cosmetic_only`, `classic_art_unchanged` |
| `tower:starfire:tier3` | `/assets/campaign/towers/starfire-tier3-v1.png` | 192×192 · gameplay · image | none · `final_art_unverified`, `transparent_png_required`, `cosmetic_only`, `classic_art_unchanged` |
| `tower:tempest:tier2` | `/assets/campaign/towers/tempest-tier2-v1.png` | 192×192 · gameplay · image | none · `final_art_unverified`, `transparent_png_required`, `cosmetic_only`, `classic_art_unchanged` |
| `tower:tempest:tier3` | `/assets/campaign/towers/tempest-tier3-v1.png` | 192×192 · gameplay · image | none · `final_art_unverified`, `transparent_png_required`, `cosmetic_only`, `classic_art_unchanged` |

No standalone raster is required for route-node circles/road crossings/boss crests,
Mastery Star glyphs or World Sigil labels; the manifest declares these as
procedural/vector or text UI. The support buff playback flags above remain
unverified until approved support atlases are integrated and viewed in game.

Production acceptance follows `docs/ART_BIBLE.md` and the expansion pack's sprite
production guide: transparent edges, consistent anchors, legible silhouettes at
gameplay scale, correct animation states, no baked UI, and review against terrain,
health bars and active effects. Concept-board crops are references only and are
not accepted as production atlases.
