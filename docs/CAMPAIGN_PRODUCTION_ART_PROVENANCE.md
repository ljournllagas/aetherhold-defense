# Campaign Production Art Provenance — 2026-10-10

## Monster atlas completion — 2026-10-11

The eighteen missing monster/boss atlases were completed with the built-in imagegen tool, packaged as transparent production PNGs, reviewed and integrated. All 43 manifest targets are now final. Exact selected prompts, preserved source images, rejected attempts, extraction rectangles and source/output hashes are linked from [Road clearance and monster artwork](ROAD_CLEARANCE_AND_MONSTER_ART.md). The 2026-10-10 account below remains historical evidence of the earlier terrain/tower release and its missing-art allowance.

This document records the terrain plates and campaign tower sprites produced for the Worlds 1–3 campaign. The accepted realm-panel history remains in [CAMPAIGN_WORLD_MAP_ART_PROVENANCE.md](CAMPAIGN_WORLD_MAP_ART_PROVENANCE.md). Evidence: [V7 raw terrain review](../artifacts/campaign-production-completion-20261010/verification/terrain-raw/report.md), [V4 tower review](../artifacts/campaign-production-completion-20261010/verification/tower-batch/tower-batch-review.md), [V5 loader review](../artifacts/campaign-production-completion-20261010/verification/loading/verification-report.md), [V6 actual-loader run](../artifacts/campaign-production-completion-20261010/verification/maps-final-visual/actual-map-loader-results.json), [V6 boss overlay/lifecycle run](../artifacts/campaign-production-completion-20261010/verification/boss-overlays/boss-overlay-results.json), [V6 unlocked-state UI run](../artifacts/campaign/visual/final/unlocked-states/final-unlocked-ui-results.json), [supplementary responsive captures](../artifacts/campaign/visual/final/visual-results-responsive.json), [P6 automated recheck](../artifacts/campaign-production-completion-20261010/verification/loading/final-p6-recheck-report.md), [V9 mask acceptance](../artifacts/campaign-production-completion-20261010/verification/v9-viewport-mask/v9-viewport-mask-results.json), [P6 live release verification](../artifacts/campaign-production-completion-20261010/verification/release/live-verification-p6.json), and [P6 ordinary live smoke](../artifacts/campaign-production-completion-20261010/verification/release/native-live-smoke-p6.json).

## Historical manifest and release gate — 2026-10-10

The integrated manifest defines 43 raster targets: 25 are **final** (three realm panels, twelve terrain plates, and ten Tier II/III tower sprites); eighteen enemy/boss atlases are **final_required** and absent. V7 passed raw review of all twelve terrain plates; P5 staged the eleven remaining plates, so all twelve are now manifest-final and allowlisted. V6 passed the combined three-world map/tower runtime visual review. The missing atlases retain procedural fallback; overall final production art remains UNVERIFIED. The campaign production release completed under the user's explicit missing-art allowance. V9 passed all-caller viewport-mask precision/lifecycle verification; physical-device touch remains unverified. Current manifest status is defined by `src/game/campaign/artManifest.ts`, not older staged/unapproved status fields retained in production sidecars.

| Asset set | Manifest state | Evidence and runtime status |
| --- | --- | --- |
| Three realm panels | final | Accepted and published in the earlier world-map release; provenance remains in the panel document. |
| Twelve terrain plates | final | V7 raw review passed all twelve; P5 staged the eleven remaining plates. V6 passed the combined map/tower runtime visual review. |
| Ten Tier II/III towers | final | Candidate-level review passed for all five pairs; the earlier capture used interim terrain, while V6 passed the final combined review on staged plates. |
| Eighteen enemy/boss atlases | final_required, procedural fallback | Exact public targets are absent. Only Marchling was attempted; its four diagnostics were rejected. The other seventeen were not attempted. Final atlas art is UNVERIFIED. |

The loader queues an asset only when its manifest state is final and its exact path is in `AVAILABLE_CAMPAIGN_ART_PATHS`. V6 exercised the actual loader across all 30 campaign levels and six tower-tier matrix cases; no request, response, storage, or API safety issues were recorded. Its separate unlocked-state visual run passed 18 cases across six viewport sizes at 29, 30, and 90 stars with no layout issues. Supplementary responsive evidence contains 29 captures across the same six sizes with no errors, failed requests, bad responses, or console warnings; that JSON retains its V3 harness label, but its capture time and source fingerprints match the repaired sources. The boss overlay run recorded 20 phase views, three threshold cases, and a passing pause/speed/restart lifecycle; those captures used procedural boss sprites and do not certify atlas art. The Preload scene holds on a failed approved request and offers Retry/Back. Before P5, V5 observed staged map candidates copied into `dist` and directly served with HTTP 200 while gameplay did not request them. V9 passed headless Edge WebGL checks across six map viewports, all three campaign worlds plus Classic pan/zoom and lifecycle flows, leaderboard clipping/scrolling, and Canvas fallback tests; there were no errors, warnings, failed requests, or API mutations. Physical-device touch remains unverified. The final release passed under the user's explicit missing-art allowance; the [live verification](../artifacts/campaign-production-completion-20261010/verification/release/live-verification-p6.json) and [ordinary browser smoke](../artifacts/campaign-production-completion-20261010/verification/release/native-live-smoke-p6.json) confirm deployment and normal Campaign/Classic navigation. If a future review rejects a plate, move its public copy back to ignored artifacts before any subsequent release build/deploy and preserve the original.

## Exact missing enemy/boss atlas paths

These are the eighteen final_required paths from the production handoff; the status below records that handoff, not a prediction of later work.

- /assets/campaign/enemies/borderkeep/marchling-atlas-v1.png — attempted; diagnostic candidates rejected.
- /assets/campaign/enemies/borderkeep/skitter-atlas-v1.png — not attempted.
- /assets/campaign/enemies/borderkeep/stoneback-atlas-v1.png — not attempted.
- /assets/campaign/enemies/borderkeep/ironhide-atlas-v1.png — not attempted.
- /assets/campaign/enemies/borderkeep/veilborn-atlas-v1.png — not attempted.
- /assets/campaign/bosses/hollow_warden-atlas-v1.png — not attempted.
- /assets/campaign/enemies/emberfall/cinderling-atlas-v1.png — not attempted.
- /assets/campaign/enemies/emberfall/ashrunner-atlas-v1.png — not attempted.
- /assets/campaign/enemies/emberfall/magmahide-atlas-v1.png — not attempted.
- /assets/campaign/enemies/emberfall/ember_brute-atlas-v1.png — not attempted.
- /assets/campaign/enemies/emberfall/ashcaller-atlas-v1.png — not attempted.
- /assets/campaign/bosses/cinder_colossus-atlas-v1.png — not attempted; pilot stopped at Marchling review.
- /assets/campaign/enemies/frostveil/snowstalker-atlas-v1.png — not attempted.
- /assets/campaign/enemies/frostveil/icebound-atlas-v1.png — not attempted.
- /assets/campaign/enemies/frostveil/frostback-atlas-v1.png — not attempted.
- /assets/campaign/enemies/frostveil/glacier_knight-atlas-v1.png — not attempted.
- /assets/campaign/enemies/frostveil/frost_shaman-atlas-v1.png — not attempted.
- /assets/campaign/bosses/frostbound_matriarch-atlas-v1.png — not attempted.

Source: [atlas production handoff](../artifacts/campaign-production-completion-20261010/atlases/production-handoff.md); it records four rejected Marchling diagnostic outputs and seventeen targets not attempted.

## Terrain provenance

Built-in image_gen produced the opaque terrain originals from full-frame 1672×940 prompts. V7 reviewed each public terrain image individually and passed raw-art, dimensions, byte/provenance, and SHA-256 checks for all twelve. Seven generated sources match their delivered files pixel-for-pixel. Five 1672×941 originals were normalized by cropping exactly the bottom row; each retained 1672×940 crop is pixel-identical to the delivered image. No paint, resize, or other image edit is recorded.

| Asset | Manifest / raw result | Generated source and retained original | Delivered SHA-256 | Reference chain |
| --- | --- | --- | --- | --- |
| [borderkeep_a-v1.png](../public/assets/campaign/maps/borderkeep_a-v1.png) ([sidecar](../artifacts/campaign-production-completion-20261010/maps/borderkeep_a-v1.provenance.txt)) | final; raw PASS; V6 runtime PASS | Generated source: C:\Users\ljour\.codex\generated_images\01a1244c-318d-7062-a868-6697d8f03273\exec-051fabef-8997-4c7c-9104-5cefba56c90c.png; source and delivered bytes match (4037662ecaa3516498bd97f6379fab394f4536c75a2d123e5b9af1043feb5a3f) | 4037662ecaa3516498bd97f6379fab394f4536c75a2d123e5b9af1043feb5a3f | public/assets/campaign/world-map/borderkeep-v1.png |
| [borderkeep_b-v1.png](../public/assets/campaign/maps/borderkeep_b-v1.png) ([sidecar](../artifacts/campaign-production-completion-20261010/maps/borderkeep_b-v1.provenance.txt)) | final (P5 staged; V6 runtime PASS); raw PASS | Generated source: C:\Users\ljour\.codex\generated_images\01a1244c-318d-7062-a868-6697d8f03273\exec-2687b069-2c6d-4159-80cf-ea4f6e0ddc59.png; source and delivered bytes match (586d3381ee9763b15b538143c712451566049b138b2c79cd0980bd4020d39982) | 586d3381ee9763b15b538143c712451566049b138b2c79cd0980bd4020d39982 | accepted candidate artifact maps/borderkeep_a-v1.png (style/material only); public/assets/campaign/world-map/borderkeep-v1.png (realm palette/mood only) |
| [borderkeep_c-v1.png](../public/assets/campaign/maps/borderkeep_c-v1.png) ([sidecar](../artifacts/campaign-production-completion-20261010/maps/borderkeep_c-v1.provenance.txt)) | final (P5 staged; V6 runtime PASS); raw PASS | Generated source: C:\Users\ljour\.codex\generated_images\01a1244c-318d-7062-a868-6697d8f03273\exec-0c2e2066-84df-41cf-afe0-b1d048adfe93.png; source and delivered bytes match (72a4c78c8ba006537e3d5ec9a8fe41bc3d569e393b41e868d5b16ddfd4bcaacc) | 72a4c78c8ba006537e3d5ec9a8fe41bc3d569e393b41e868d5b16ddfd4bcaacc | accepted candidate artifact maps/borderkeep_a-v1.png (paint/material and camera only); public/assets/campaign/world-map/borderkeep-v1.png (realm mood/palette only) |
| [borderkeep_d-v1.png](../public/assets/campaign/maps/borderkeep_d-v1.png) ([sidecar](../artifacts/campaign-production-completion-20261010/maps/borderkeep_d-v1.provenance.txt)) | final (P5 staged; V6 runtime PASS); raw PASS | Generated source: C:\Users\ljour\.codex\generated_images\01a1244c-318d-7062-a868-6697d8f03273\exec-1823682e-b2b4-4f1f-9fc0-e77f45140170.png; preserved artifact: maps/borderkeep_d-v1-original-1672x941.png (d23cb67ae4a029db065f078914004ba0fd044dd259d102da63cf0eb5248c2ea2) | 27badc84706cfb873393278c9b7c96651c4b19e152f6f34b3d9f2d74f6007c6a | accepted candidate artifact maps/borderkeep_a-v1.png (paint/material and camera only); public/assets/campaign/world-map/borderkeep-v1.png (realm mood/palette only) |
| [emberfall_a-v1.png](../public/assets/campaign/maps/emberfall_a-v1.png) ([sidecar](../artifacts/campaign-production-completion-20261010/maps/emberfall_a-v1.provenance.txt)) | final (P5 staged; V6 runtime PASS); raw PASS | Generated source: C:\Users\ljour\.codex\generated_images\01a1244c-318d-7062-a868-6697d8f03273\exec-44ca5f64-d920-4e72-b057-f878e19919a8.png; source and delivered bytes match (dc593f1d85c3331623dae9deaf3567804713b61b233fcf59b5f84d22025e3fa1) | dc593f1d85c3331623dae9deaf3567804713b61b233fcf59b5f84d22025e3fa1 | accepted candidate artifact maps/borderkeep_a-v1.png (painted finish/camera only); public/assets/campaign/world-map/emberfall-v1.png (palette/mood only); artifacts/Aetherhold_Defense_Worlds_1_3_Expansion_Pack_v2/references/07_worlds_2_3_environment_and_sprite_reference.png (world terrain/material palette only) |
| [emberfall_b-v1.png](../public/assets/campaign/maps/emberfall_b-v1.png) ([sidecar](../artifacts/campaign-production-completion-20261010/maps/emberfall_b-v1.provenance.txt)) | final (P5 staged; V6 runtime PASS); raw PASS | Generated source: C:\Users\ljour\.codex\generated_images\01a1244c-318d-7062-a868-6697d8f03273\exec-fd5567d9-4974-4029-a883-adfb45ba1406.png; preserved artifact: maps/emberfall_b-v1-original-1672x941.png (b1a71f770f22c80e07e0073b2429812ed37423e6867858af26c5ea514fd447db) | f7ea81b15eaac7e9ab4a656df9b05f75651e2f5793fcfec001c0ae6c91c19592 | accepted candidate artifact maps/borderkeep_a-v1.png (painted finish/camera only); public/assets/campaign/world-map/emberfall-v1.png (palette/mood only); artifacts/Aetherhold_Defense_Worlds_1_3_Expansion_Pack_v2/references/07_worlds_2_3_environment_and_sprite_reference.png (terrain/material palette only) |
| [emberfall_c-v1.png](../public/assets/campaign/maps/emberfall_c-v1.png) ([sidecar](../artifacts/campaign-production-completion-20261010/maps/emberfall_c-v1.provenance.txt)) | final (P5 staged; V6 runtime PASS); raw PASS | Generated source: C:\Users\ljour\.codex\generated_images\01a1244c-318d-7062-a868-6697d8f03273\exec-f18e3e77-39f0-4558-b359-874b31489630.png; preserved artifact: maps/emberfall_c-v1-original-1672x941.png (851c6e21d0fc0be472e1f32ea5bc58dcfc238387a2a9639fbaccc6158c5e6620) | ffc392fd1f0328779492fc34373227a9047ca03c1b5339d5e3491f91029edf4c | accepted candidate artifact maps/borderkeep_a-v1.png (painted finish/camera only); public/assets/campaign/world-map/emberfall-v1.png (palette/mood only); artifacts/Aetherhold_Defense_Worlds_1_3_Expansion_Pack_v2/references/07_worlds_2_3_environment_and_sprite_reference.png (terrain/material palette only) |
| [emberfall_d-v1.png](../public/assets/campaign/maps/emberfall_d-v1.png) ([sidecar](../artifacts/campaign-production-completion-20261010/maps/emberfall_d-v1.provenance.txt)) | final (P5 staged; V6 runtime PASS); raw PASS | Generated source: C:\Users\ljour\.codex\generated_images\01a1244c-318d-7062-a868-6697d8f03273\exec-1fde6edd-35ee-48e8-b497-cdba1fca4bd8.png; source and delivered bytes match (2c100931a6ff966b2e9ad8e2f5f6b0dfe4948a1e6482697c1e14f7187fae40af) | 2c100931a6ff966b2e9ad8e2f5f6b0dfe4948a1e6482697c1e14f7187fae40af | accepted candidate artifact maps/borderkeep_a-v1.png (painted finish/camera only); public/assets/campaign/world-map/emberfall-v1.png (palette/mood only); artifacts/Aetherhold_Defense_Worlds_1_3_Expansion_Pack_v2/references/07_worlds_2_3_environment_and_sprite_reference.png (terrain/material palette only) |
| [frostveil_a-v1.png](../public/assets/campaign/maps/frostveil_a-v1.png) ([sidecar](../artifacts/campaign-production-completion-20261010/maps/frostveil_a-v1.provenance.txt)) | final (P5 staged; V6 runtime PASS); raw PASS | Generated source: C:\Users\ljour\.codex\generated_images\01a1244c-318d-7062-a868-6697d8f03273\exec-a4d7d622-db2d-4231-bbe6-78993150fb8d.png; source and delivered bytes match (eb7b4cbb97faee9169a47cdf5c11cf29217c71b8e0b3c6ad6f37670260624501) | eb7b4cbb97faee9169a47cdf5c11cf29217c71b8e0b3c6ad6f37670260624501 | accepted candidate artifact maps/borderkeep_a-v1.png (painted finish/camera only); public/assets/campaign/world-map/frostveil-v1.png (palette/mood only); artifacts/Aetherhold_Defense_Worlds_1_3_Expansion_Pack_v2/references/07_worlds_2_3_environment_and_sprite_reference.png (terrain/material palette only) |
| [frostveil_b-v1.png](../public/assets/campaign/maps/frostveil_b-v1.png) ([sidecar](../artifacts/campaign-production-completion-20261010/maps/frostveil_b-v1.provenance.txt)) | final (P5 staged; V6 runtime PASS); raw PASS | Generated source: C:\Users\ljour\.codex\generated_images\01a1244c-318d-7062-a868-6697d8f03273\exec-91b3dd4c-82ed-4a96-a738-18367dc6193a.png; source and delivered bytes match (114fea39b99e11822463c6c697238849747e1de93d6174bd8c16655de6dc2d3f) | 114fea39b99e11822463c6c697238849747e1de93d6174bd8c16655de6dc2d3f | accepted candidate artifact maps/borderkeep_a-v1.png (painted finish/camera only); public/assets/campaign/world-map/frostveil-v1.png (palette/mood only); artifacts/Aetherhold_Defense_Worlds_1_3_Expansion_Pack_v2/references/07_worlds_2_3_environment_and_sprite_reference.png (terrain/material palette only) |
| [frostveil_c-v1.png](../public/assets/campaign/maps/frostveil_c-v1.png) ([sidecar](../artifacts/campaign-production-completion-20261010/maps/frostveil_c-v1.provenance.txt)) | final (P5 staged; V6 runtime PASS); raw PASS | Generated source: C:\Users\ljour\.codex\generated_images\01a1244c-318d-7062-a868-6697d8f03273\exec-e3285800-5494-4a27-a4b4-9f7ac5cd5b1b.png; preserved artifact: maps/frostveil_c-v1-original-1672x941.png (bc23c4dc65839f520fa745376d19e4acf9ce8c88618f2680e1a6908eb0770de1) | 3c0e9e66571f742a892fa371cd0469eb2a4807e1694bdc46842c4c1b2c384ab9 | accepted candidate artifact maps/borderkeep_a-v1.png (painted finish/camera only); public/assets/campaign/world-map/frostveil-v1.png (palette/mood only); artifacts/Aetherhold_Defense_Worlds_1_3_Expansion_Pack_v2/references/07_worlds_2_3_environment_and_sprite_reference.png (terrain/material palette only) |
| [frostveil_d-v1.png](../public/assets/campaign/maps/frostveil_d-v1.png) ([sidecar](../artifacts/campaign-production-completion-20261010/maps/frostveil_d-v1.provenance.txt)) | final (P5 staged; V6 runtime PASS); raw PASS | Generated source: C:\Users\ljour\.codex\generated_images\01a1244c-318d-7062-a868-6697d8f03273\exec-117d0aa0-a22b-4b27-8a9a-fb1f32e4dcdb.png; preserved artifact: maps/frostveil_d-v1-original-1672x941.png (8868f2c7555519808acc47e69c7f93e7fb22d3de5f0805d64c776a4a6936ba88) | 546ef885e48d7047f6402ffea7a5e3771b3e6ba00ebe36f334a80fade2022cb9 | accepted candidate artifact maps/borderkeep_a-v1.png (painted finish/camera only); public/assets/campaign/world-map/frostveil-v1.png (palette/mood only); artifacts/Aetherhold_Defense_Worlds_1_3_Expansion_Pack_v2/references/07_worlds_2_3_environment_and_sprite_reference.png (terrain/material palette only) |

Runtime placement for each plate is the authored field (x=0, y=56, width=1040, height=584); source-pixel mapping is pixelX=worldX×1672/1040, pixelY=(worldY−56)×940/584. Exact prompts follow. Paths and hashes are repeated from the corresponding P3 sidecars so these records remain readable without depending on generated-image storage.

### borderkeep_a-v1

Generated source: C:\Users\ljour\.codex\generated_images\01a1244c-318d-7062-a868-6697d8f03273\exec-051fabef-8997-4c7c-9104-5cefba56c90c.png.
Reference chain: public/assets/campaign/world-map/borderkeep-v1.png.
Processing: generated source, artifact copy, and runtime copy are byte-identical; no crop or resize.
Delivered file: public/assets/campaign/maps/borderkeep_a-v1.png; SHA-256 4037662ecaa3516498bd97f6379fab394f4536c75a2d123e5b9af1043feb5a3f. Full sidecar: [maps/borderkeep_a-v1.provenance.txt](../artifacts/campaign-production-completion-20261010/maps/borderkeep_a-v1.provenance.txt).

```
Use case: stylized-concept
Asset type: original production terrain-only battlefield plate; full canvas 1672×940 pixels, landscape, opaque PNG.
Input images: Image 1 is a palette and painterly-style reference only. Do not copy its layout or landmarks.
Primary request: an original, quiet fortified-wilderness ground plane for the Borderkeep map family in Aetherhold Defense.
Scene/backdrop: broad open forest clearing seen from a readable overhead three-quarter strategy-game view; continuous terrain fills every pixel.
Style/medium: polished hand-painted fantasy strategy environment, broad painted shapes with restrained natural detail, upper-left global light, consistent with the reference's greens, warm stone, moss, and medieval wilderness mood.
Composition/framing: a wide, mostly open central field of mottled grass, compacted earth, leaf litter, and moss. Dense dark forest canopy and broken low stone wall fragments frame only the outer margins. Tiny waterfall accents can sit at the extreme upper-left and lower-right corners. Keep the middle 80 percent of the image visually calm and open so a runtime road, combat units, and small build sites remain readable over it. Small rocks, ferns, and flowers are scattered irregularly as isolated details, never in lines.
Lighting/mood: soft natural daylight from upper left; restrained, calm, old borderland.
Color palette: muted forest green, olive, warm earth, warm gray limestone, tiny restrained blue cloth scraps; no saturated color wash.
Materials/textures: natural grass and moss, subtle soil variation, irregular leaf litter, sparse isolated pebbles, a few low weathered masonry fragments at frame edges.
Constraints: pure terrain only. No road, path, trail, bridge, track, rut, pavement, cobblestone band, linear clearing, line of stones, repeated stripes, build site mark, circle, keep, stronghold, gate, building, tower, beacon, unit, enemy, object marker, UI, text, watermark, border, or grid. Specifically avoid any connected pale stone or earth shape that forms a continuous or parallel line. Do not place a large object silhouette within the open central field.
```

### borderkeep_b-v1

Generated source: C:\Users\ljour\.codex\generated_images\01a1244c-318d-7062-a868-6697d8f03273\exec-2687b069-2c6d-4159-80cf-ea4f6e0ddc59.png.
Reference chain: accepted candidate artifact maps/borderkeep_a-v1.png (style/material only); public/assets/campaign/world-map/borderkeep-v1.png (realm palette/mood only).
Processing: generated source, artifact copy, and runtime copy are byte-identical; no crop or resize.
Delivered file: public/assets/campaign/maps/borderkeep_b-v1.png; SHA-256 586d3381ee9763b15b538143c712451566049b138b2c79cd0980bd4020d39982. Full sidecar: [maps/borderkeep_b-v1.provenance.txt](../artifacts/campaign-production-completion-20261010/maps/borderkeep_b-v1.provenance.txt).

```
Task ID P3 production terrain plate candidate. Create a full-frame opaque 1672×940 PNG landscape, original polished painted fantasy strategy-game battlefield ground seen in the same readable overhead three-quarter camera as the references. References: (1) the accepted Borderkeep A terrain plate is the paint/render style and ground-material guide only; do not copy its exact layout. (2) the Borderkeep world panel is palette and realm-mood guidance only; do not copy its map composition, keep, waterfalls, or landmarks. Make an original Borderkeep B “pressure” area: a rugged forest-edge plateau where weathered warm-gray border masonry and scattered olive woodland press closer at the margins, but the broad gameplay field remains visible. Fill the entire canvas with continuous ground. Keep the central field mostly calm, open, and low-profile with nuanced muted green grass, compacted ochre earth, leaf litter, moss, broken small stone fragments; reserve broad, quiet meandering open corridors through the middle and open clear pockets for later runtime roads and tower sites. Put denser trees, low ruins, rocky shelves, ferns and occasional small puddles toward edges and corners, with irregular non-linear natural grouping, no large objects in center. Hand-painted, materially varied, soft upper-left daylight, painterly coherence with Borderkeep A; no hard graphic outlines. Constraints: terrain only: absolutely no path, road, trail, track, bridge, river crossing, cobblestone stripe, connected clearing or linear stone/earth band; no route, no build circles or marks; no keep, building, gate, stronghold, tower, beacon, people, unit, enemy, UI, text, watermark, border, grid, or concept-art panel/crop. Keep all terrain details modest enough that runtime units and overlays will read clearly. Specific family beat: B introduces pressure by denser framing and broken defensive masonry only along the far sides; leave generous open breathing room in the playfield.
```

### borderkeep_c-v1

Generated source: C:\Users\ljour\.codex\generated_images\01a1244c-318d-7062-a868-6697d8f03273\exec-0c2e2066-84df-41cf-afe0-b1d048adfe93.png.
Reference chain: accepted candidate artifact maps/borderkeep_a-v1.png (paint/material and camera only); public/assets/campaign/world-map/borderkeep-v1.png (realm mood/palette only).
Processing: generated source, artifact copy, and runtime copy are byte-identical; no crop or resize.
Delivered file: public/assets/campaign/maps/borderkeep_c-v1.png; SHA-256 72a4c78c8ba006537e3d5ec9a8fe41bc3d569e393b41e868d5b16ddfd4bcaacc. Full sidecar: [maps/borderkeep_c-v1.provenance.txt](../artifacts/campaign-production-completion-20261010/maps/borderkeep_c-v1.provenance.txt).

```
Task ID P3; original full-frame 1672×940 opaque landscape PNG terrain-only battlefield for Aetherhold Defense, Borderkeep map family. Follow the accepted Borderkeep A image for painted material treatment, upper-left daylight, muted olive/earth palette, overhead three-quarter strategy camera, and finish only. Use the Borderkeep world panel for realm mood and palette only. Create family C “advanced” terrain: an ancient mossy frontier clearing, weathered low limestone remnants, several larger forest edge masses and rugged rock shelves, with a broad open central playfield and multiple quiet open pockets. Ground is continuous and detailed but soft in value: muted forest grass, compacted soil, moss, leaves, modest scattered stones, little ferns, broken masonry. Heavier framing and a few additional rubble clusters at the far edges signal an older, more advanced battleground, but keep all central ground low and clear for later runtime route, units and build sites. Natural organic shapes, painterly soft joints, no crisp vector outlines, subtle upper-left light, restrained small amber flowers and tiny water glints only in corners. Terrain fills canvas to all edges; do not add a map panel or border. Absolutely no path/road/bridge/track/cobblestone lane/linear clearing/connected pale stripe, no route or landmarks, no build markers or circles, no keep/gate/stronghold/building/tower/beacon/unit/enemy/UI/text/watermark/grid. Leave a very generous open combat field; do not create a large central object or a continuous bare band.
```

### borderkeep_d-v1

Generated source: C:\Users\ljour\.codex\generated_images\01a1244c-318d-7062-a868-6697d8f03273\exec-1823682e-b2b4-4f1f-9fc0-e77f45140170.png.
Reference chain: accepted candidate artifact maps/borderkeep_a-v1.png (paint/material and camera only); public/assets/campaign/world-map/borderkeep-v1.png (realm mood/palette only).
Preserved source and normalization: maps/borderkeep_d-v1-original-1672x941.png; 1672x941 RGB PNG; SHA-256 D23CB67AE4A029DB065F078914004BA0FD044DD259D102DA63CF0EB5248C2EA2; Pillow crop box (0,0,1672,940), removing exactly the bottom row; every pixel in the retained 1672x940 area is byte-for-byte pixel-equivalent to the source crop.
Delivered file: public/assets/campaign/maps/borderkeep_d-v1.png; SHA-256 27badc84706cfb873393278c9b7c96651c4b19e152f6f34b3d9f2d74f6007c6a. Full sidecar: [maps/borderkeep_d-v1.provenance.txt](../artifacts/campaign-production-completion-20261010/maps/borderkeep_d-v1.provenance.txt).

```
Task ID P3 production candidate: full-frame 1672×940 opaque PNG landscape terrain plate for Aetherhold Defense, Borderkeep family D, an advanced boss arena. References: accepted Borderkeep A plate for painted ground, upper-left light, olive/earth/warm limestone palette, overhead three-quarter strategy camera; Borderkeep world panel for broad realm mood only. Produce an original, broad, quiet forest-frontier arena with much more breathing room than ordinary maps: wide continuous low-profile grass-and-earth clearing fills most of the canvas, gently mottled with moss, scattered leaf litter, sparse gravel and occasional tiny plants. Frame the distant perimeter with irregular dark forest groups, old weathered low stone remnants, rubble shelves and a few mossy boulders, chiefly near far edges and corners; keep them small/low enough that sprites and towers read clearly. Suggest an ancient remote defensive ground through material detail alone, no landmark. The central 75% stays calm and open and has no large silhouettes; keep broad separated clear pockets for the later route and build sites. Painterly hand-painted finish like the accepted plate, soft natural upper-left daylight, natural edges and material variation, no hard graphic outline, no panel/crop/border. Terrain fills every pixel edge-to-edge. Absolutely no path, trail, road, track, bridge, river, cobblestone lane, continuous linear clearing, repeated stripe, route, build mark or circle, keep, gate, stronghold, building, tower, beacon, unit, enemy, UI, text, watermark, or grid. Do not burn gameplay geometry into the terrain.
```

### emberfall_a-v1

Generated source: C:\Users\ljour\.codex\generated_images\01a1244c-318d-7062-a868-6697d8f03273\exec-44ca5f64-d920-4e72-b057-f878e19919a8.png.
Reference chain: accepted candidate artifact maps/borderkeep_a-v1.png (painted finish/camera only); public/assets/campaign/world-map/emberfall-v1.png (palette/mood only); artifacts/Aetherhold_Defense_Worlds_1_3_Expansion_Pack_v2/references/07_worlds_2_3_environment_and_sprite_reference.png (world terrain/material palette only).
Processing: generated source, artifact copy, and runtime copy are byte-identical; no crop or resize.
Delivered file: public/assets/campaign/maps/emberfall_a-v1.png; SHA-256 dc593f1d85c3331623dae9deaf3567804713b61b233fcf59b5f84d22025e3fa1. Full sidecar: [maps/emberfall_a-v1.provenance.txt](../artifacts/campaign-production-completion-20261010/maps/emberfall_a-v1.provenance.txt).

```
Task ID P3; original full-frame opaque 1672×940 landscape terrain plate, Aetherhold Defense Emberfall family A introduction. Use the accepted Borderkeep A terrain plate only as an approved painted-material and overhead three-quarter camera guide; use the Emberfall world panel and World 2 environment reference only for volcanic basalt/ash palette and realm mood, never copy their composition or baked road. Create a readable strategy-game ground plane of ancient dark basalt foothills and ash: continuous floor of charcoal, warm gray and muted umber volcanic earth, gently fractured rock plates with irregular low seams, scattered cinders, sparse dry grass, little soot-dark stones, and distant broken basalt shelves framing outer edges. Keep broad quiet middle routes and separate open build clearings for runtime overlay, no obvious track or line. Introductory pressure: modest low rock clusters and a couple tiny restrained ember glows far at corners only, while center stays low contrast and calm for units. Soft upper-left light, hand-painted surface variation, rich but controlled materials, no graphic outline, coherent painted finish with reference style. Entire canvas is ground, no framing panel. Absolutely no trail/road/bridge/rut/linear crack/lava river/cobblestone lane/connected stripe, no route, no build sites or circles, no keep/stronghold/gate/building/tower/beacon/unit/enemy/UI/text/watermark/border/grid. Lava is a few small edge accents, never a wallpaper wash.
```

### emberfall_b-v1

Generated source: C:\Users\ljour\.codex\generated_images\01a1244c-318d-7062-a868-6697d8f03273\exec-fd5567d9-4974-4029-a883-adfb45ba1406.png.
Reference chain: accepted candidate artifact maps/borderkeep_a-v1.png (painted finish/camera only); public/assets/campaign/world-map/emberfall-v1.png (palette/mood only); artifacts/Aetherhold_Defense_Worlds_1_3_Expansion_Pack_v2/references/07_worlds_2_3_environment_and_sprite_reference.png (terrain/material palette only).
Preserved source and normalization: maps/emberfall_b-v1-original-1672x941.png; 1672x941 RGB PNG; SHA-256 B1A71F770F22C80E07E0073B2429812ED37423E6867858AF26C5EA514FD447DB; Pillow crop box (0,0,1672,940), removing exactly the bottom row; every pixel in the retained 1672x940 area is byte-for-byte pixel-equivalent to the source crop.
Delivered file: public/assets/campaign/maps/emberfall_b-v1.png; SHA-256 f7ea81b15eaac7e9ab4a656df9b05f75651e2f5793fcfec001c0ae6c91c19592. Full sidecar: [maps/emberfall_b-v1.provenance.txt](../artifacts/campaign-production-completion-20261010/maps/emberfall_b-v1.provenance.txt).

```
Task ID P3; full-frame opaque 1672×940 landscape production terrain plate, Aetherhold Defense Emberfall family B “pressure.” Follow accepted Borderkeep A for overhead three-quarter gameplay camera and painted material quality only; use Emberfall world panel and World 2 environment reference only for charcoal basalt, muted ash and restrained ember palette, not their scene layout or roads. Create an original volcanic highland battlefield floor: continuous dark slate-black basalt and warm ash soil with naturally broken, irregular broad rock shelves around the distant margins, scattered low cinder mounds and a few sparse withered grasses. Press the terrain framing inward more than an intro map, with weathered jagged basalt outcrops at the far edges and tiny molten accents in a few edge cracks only. Keep broad meandering low-detail open corridors and separate clear build pockets through the center; central gameplay ground remains spacious, soft in contrast, and mostly free of obstacles. Painterly ground variation with subtle upper-left light and low natural seams, no repeated paving or hard grid; no crisp graphic outlines. Entire image is terrain, full bleed, no crop or panel. No trail, path, road, bridge, track, rut, lava river, glowing stripe, linear clearing, parallel band, connected row of stones, build mark/circle, fortification, gate, keep, building, tower, beacon, unit, enemy, UI, text, watermark or grid. Use lava as small edge flickers, not a glowing carpet or stripe.
```

### emberfall_c-v1

Generated source: C:\Users\ljour\.codex\generated_images\01a1244c-318d-7062-a868-6697d8f03273\exec-f18e3e77-39f0-4558-b359-874b31489630.png.
Reference chain: accepted candidate artifact maps/borderkeep_a-v1.png (painted finish/camera only); public/assets/campaign/world-map/emberfall-v1.png (palette/mood only); artifacts/Aetherhold_Defense_Worlds_1_3_Expansion_Pack_v2/references/07_worlds_2_3_environment_and_sprite_reference.png (terrain/material palette only).
Preserved source and normalization: maps/emberfall_c-v1-original-1672x941.png; 1672x941 RGB PNG; SHA-256 851C6E21D0FC0BE472E1F32EA5BC58DCFC238387A2A9639FBACCC6158C5E6620; Pillow crop box (0,0,1672,940), removing exactly the bottom row; every pixel in the retained 1672x940 area is byte-for-byte pixel-equivalent to the source crop.
Delivered file: public/assets/campaign/maps/emberfall_c-v1.png; SHA-256 ffc392fd1f0328779492fc34373227a9047ca03c1b5339d5e3491f91029edf4c. Full sidecar: [maps/emberfall_c-v1.provenance.txt](../artifacts/campaign-production-completion-20261010/maps/emberfall_c-v1.provenance.txt).

```
Task ID P3; original opaque 1672×940 full-frame landscape PNG terrain plate for Emberfall family C, Aetherhold Defense. Use accepted Borderkeep A only to match the overhead three-quarter strategy camera and hand-painted broad material quality. Use Emberfall world map panel and World 2 environment reference for muted basalt/ash with small hot-orange accents only. Scene: a mature volcanic badland battlefield at the lip of an ancient highland, continuous charcoal and umber earth with naturally weathered irregular basalt plates, loose cinders, subdued ash drifts, low scattered volcanic rocks and occasional sparse dry scrub. This C advanced zone has more rocky shelves and broken outcrops around the remote sides than B, with a few low dark remnants and barely glowing ember cracks confined to far margins; keep middle ground broad, low and calm, with multiple large open pockets and unobstructed corridors for future runtime route/build overlays. Distinct natural formations must be scattered in non-linear uneven groups and stay out of gameplay lanes. Soft upper-left daylight, hand-painted highlights and shadow planes; irregular organic fissures only, no paving pattern, no tiled grid, no graphic vector edges. Fill the canvas edge-to-edge, no frame, no concept sheet. Absolute exclusions: no road, trail, path, bridge, crossing, track, rut, route, lava river, continuous glowing seam, parallel line, linear bare strip, build circles or markers, structure, keep, gate, fort, building, tower, beacon, unit, enemy, UI, text, watermark, border or grid. Terrain detail only; no large center silhouette.
```

### emberfall_d-v1

Generated source: C:\Users\ljour\.codex\generated_images\01a1244c-318d-7062-a868-6697d8f03273\exec-1fde6edd-35ee-48e8-b497-cdba1fca4bd8.png.
Reference chain: accepted candidate artifact maps/borderkeep_a-v1.png (painted finish/camera only); public/assets/campaign/world-map/emberfall-v1.png (palette/mood only); artifacts/Aetherhold_Defense_Worlds_1_3_Expansion_Pack_v2/references/07_worlds_2_3_environment_and_sprite_reference.png (terrain/material palette only).
Processing: generated source, artifact copy, and runtime copy are byte-identical; no crop or resize.
Delivered file: public/assets/campaign/maps/emberfall_d-v1.png; SHA-256 2c100931a6ff966b2e9ad8e2f5f6b0dfe4948a1e6482697c1e14f7187fae40af. Full sidecar: [maps/emberfall_d-v1.provenance.txt](../artifacts/campaign-production-completion-20261010/maps/emberfall_d-v1.provenance.txt).

```
Task ID P3 production terrain candidate; opaque landscape PNG 1672×940, full-frame Emberfall D boss arena for Aetherhold Defense. Take the accepted Borderkeep A only for its painted material handling and overhead three-quarter gameplay camera; use the Emberfall world panel and World 2 environment reference only for charcoal basalt, ash and minute ember tones. Create an original remote volcanic caldera floor with maximum arena breathing room: broad continuous low-profile dark slate, charcoal and warm-umber ash ground occupies nearly all the central field, naturally mottled with very subtle irregular mineral variation, sparse cinders and occasional small rock clusters. Form a distant irregular perimeter of low basalt shelves, broken rock and sparse scorched shrubs; tiny restrained molten orange glints can appear only in a few peripheral fissures. Center is especially quiet and open for the final boss and combat overlay; leave several large separated clearings and broad quiet meandering runtime corridors. Painterly soft upper-left light, readable tonal detail, natural broken shapes, no road-like strip, no tile pattern, no grid and no dramatic central crater. Edge-to-edge terrain only, no crop or border. Exclude all paths, roads, bridges, trails, tracks, lava rivers, glowing lines, continuous cracks, parallel stripes, geometric arena markings, build sites or circles, buildings, forts, gate, keep, tower, beacon, characters, units, enemies, UI, text, watermark. Keep lava a tiny edge accent, never a bright field wash.
```

### frostveil_a-v1

Generated source: C:\Users\ljour\.codex\generated_images\01a1244c-318d-7062-a868-6697d8f03273\exec-a4d7d622-db2d-4231-bbe6-78993150fb8d.png.
Reference chain: accepted candidate artifact maps/borderkeep_a-v1.png (painted finish/camera only); public/assets/campaign/world-map/frostveil-v1.png (palette/mood only); artifacts/Aetherhold_Defense_Worlds_1_3_Expansion_Pack_v2/references/07_worlds_2_3_environment_and_sprite_reference.png (terrain/material palette only).
Processing: generated source, artifact copy, and runtime copy are byte-identical; no crop or resize.
Delivered file: public/assets/campaign/maps/frostveil_a-v1.png; SHA-256 eb7b4cbb97faee9169a47cdf5c11cf29217c71b8e0b3c6ad6f37670260624501. Full sidecar: [maps/frostveil_a-v1.provenance.txt](../artifacts/campaign-production-completion-20261010/maps/frostveil_a-v1.provenance.txt).

```
Task ID P3; full-frame opaque 1672×940 landscape PNG terrain-only battlefield plate, Aetherhold Defense Frostveil family A introduction. Match accepted Borderkeep A only for the overhead three-quarter game camera, painted ground treatment and soft directional light; use Frostveil world panel and World 3 environment reference only for slate, snow, controlled ice-blue palette and realm mood, never copy their map layout, river or road. Create an original snowy pass ground plane: continuous low-profile snowpack over slate and muted gray earth, softly mottled with powder, small irregular wind-sculpted drifts, patches of dark rock, sparse low snow-covered conifers and tiny frozen brush mainly near edges. Keep a broad open middle field and quiet meandering clear corridors plus separate clear build pockets, leaving later runtime road and sprites legible. Introductory Frostveil should feel serene and cold, not a white-out: snow highlights are soft, slate ground shows through in places, ice-blue accents are limited to a few small outer-edge ice shelves, and tiny warm amber torchlike reflections may touch a couple far-edge stones without showing torches or structures. Hand-painted material variation, upper-left light, soft natural edges, painterly cohesion. Continuous terrain to all image edges; no panel or border. Absolutely no river/stream/canal, bridge, path, road, track, trail, linear clearing, repeated stripe, glowing seam, build mark/circle, keep, gate, building, fort, tower, beacon, unit, enemy, UI, text, watermark or grid. Leave the entire central 70% low and open; do not add a large landmark.
```

### frostveil_b-v1

Generated source: C:\Users\ljour\.codex\generated_images\01a1244c-318d-7062-a868-6697d8f03273\exec-91b3dd4c-82ed-4a96-a738-18367dc6193a.png.
Reference chain: accepted candidate artifact maps/borderkeep_a-v1.png (painted finish/camera only); public/assets/campaign/world-map/frostveil-v1.png (palette/mood only); artifacts/Aetherhold_Defense_Worlds_1_3_Expansion_Pack_v2/references/07_worlds_2_3_environment_and_sprite_reference.png (terrain/material palette only).
Processing: generated source, artifact copy, and runtime copy are byte-identical; no crop or resize.
Delivered file: public/assets/campaign/maps/frostveil_b-v1.png; SHA-256 114fea39b99e11822463c6c697238849747e1de93d6174bd8c16655de6dc2d3f. Full sidecar: [maps/frostveil_b-v1.provenance.txt](../artifacts/campaign-production-completion-20261010/maps/frostveil_b-v1.provenance.txt).

```
Task ID P3; original full-frame opaque 1672×940 PNG terrain-only battlefield for Frostveil family B pressure, Aetherhold Defense. Use approved Borderkeep A for painted broad material style and overhead three-quarter strategy camera only. Use Frostveil world panel plus World 3 environment reference for restrained slate/snow/ice palette and cold pass atmosphere only; no copied road, map or watercourse. Create a high snowy mountain pass with continuous low-profile snow over dark slate earth, subtle blue-gray ice at distant margins, wind-softened snow mounds, broken low frozen rock shelves, scattered tiny pines and sparse frozen brush. Bring the cliff and spruce framing slightly closer at far edges than introductory terrain, suggesting tighter pressure while preserving a spacious, low-obstacle middle. Keep broad open meandering corridors and separate clear pockets for the later route and build sites. Snow must be textured but not pure white wash; reveal natural slate and subdued charcoal in uneven patches. Ice should be localized, not a bright blue field. A couple far-edge stones may catch a tiny warm amber torchlike glint without any visible lamp or architecture. Painterly hand-finished surface, gentle upper-left light, no sharp cutout lines, edge-to-edge ground not a panel/crop. Absolutely no river/stream/canal, path, road, bridge, trail, track, crossing, linear snow clearing, blue stripe, glowing seam, tile/grid, build marker/circle, keep, fort, gate, building, tower, beacon, character, unit, enemy, UI, text, watermark or border. Keep gameplay field open and readable.
```

### frostveil_c-v1

Generated source: C:\Users\ljour\.codex\generated_images\01a1244c-318d-7062-a868-6697d8f03273\exec-e3285800-5494-4a27-a4b4-9f7ac5cd5b1b.png.
Reference chain: accepted candidate artifact maps/borderkeep_a-v1.png (painted finish/camera only); public/assets/campaign/world-map/frostveil-v1.png (palette/mood only); artifacts/Aetherhold_Defense_Worlds_1_3_Expansion_Pack_v2/references/07_worlds_2_3_environment_and_sprite_reference.png (terrain/material palette only).
Preserved source and normalization: maps/frostveil_c-v1-original-1672x941.png; 1672x941 RGB PNG; SHA-256 BC23C4DC65839F520FA745376D19E4ACF9CE8C88618F2680E1A6908EB0770DE1; Pillow crop box (0,0,1672,940), removing exactly the bottom row; every pixel in the retained 1672x940 area is byte-for-byte pixel-equivalent to the source crop.
Delivered file: public/assets/campaign/maps/frostveil_c-v1.png; SHA-256 3c0e9e66571f742a892fa371cd0469eb2a4807e1694bdc46842c4c1b2c384ab9. Full sidecar: [maps/frostveil_c-v1.provenance.txt](../artifacts/campaign-production-completion-20261010/maps/frostveil_c-v1.provenance.txt).

```
Task ID P3; original terrain-only full-frame 1672×940 opaque PNG for Aetherhold Defense Frostveil family C advanced. Use accepted Borderkeep A only for camera and painterly surface treatment; use Frostveil world panel and World 3 environment reference for cold slate/snow palette, modest ice-blue accents and alpine mood only, with no copied landform arrangement. Depict an older, harder mountain pass with continuous powdery snow, muted charcoal slate seams, irregular wind-scoured drifts, a few low broken ice shelves and rocky outcrops along the distant edges, small dark pines and frozen brush scattered in uneven groups. This advanced family should feel rougher and more enclosed at the perimeter than B, while keeping all interior gameplay ground low-profile and open. Preserve wide quiet corridors and multiple separate clear pockets for the runtime road/build sites. Add slight deep blue-gray shadowing under rocks and only tiny cold cyan glints on isolated outer ice; a few distant warm amber reflected highlights on snow may suggest torchlight offscreen but show no actual props. Painted, readable material variation with soft upper-left light and naturally rounded edges; no hard vector contour or white-out. Terrain continues to all canvas edges, no frame/panel. Absolutely no river, channel, creek, bridge, path, trail, road, track, linear clearing, striped drift, repeated pattern or grid; no build markers, structures, ruins, keep, gate, tower, beacon, people, units, enemies, UI, text, watermark or border. No large central object; leave an expansive open battle floor.
```

### frostveil_d-v1

Generated source: C:\Users\ljour\.codex\generated_images\01a1244c-318d-7062-a868-6697d8f03273\exec-117d0aa0-a22b-4b27-8a9a-fb1f32e4dcdb.png.
Reference chain: accepted candidate artifact maps/borderkeep_a-v1.png (painted finish/camera only); public/assets/campaign/world-map/frostveil-v1.png (palette/mood only); artifacts/Aetherhold_Defense_Worlds_1_3_Expansion_Pack_v2/references/07_worlds_2_3_environment_and_sprite_reference.png (terrain/material palette only).
Preserved source and normalization: maps/frostveil_d-v1-original-1672x941.png; 1672x941 RGB PNG; SHA-256 8868F2C7555519808ACC47E69C7F93E7FB22D3DE5F0805D64C776A4A6936BA88; Pillow crop box (0,0,1672,940), removing exactly the bottom row; every pixel in the retained 1672x940 area is byte-for-byte pixel-equivalent to the source crop.
Delivered file: public/assets/campaign/maps/frostveil_d-v1.png; SHA-256 546ef885e48d7047f6402ffea7a5e3771b3e6ba00ebe36f334a80fade2022cb9. Full sidecar: [maps/frostveil_d-v1.provenance.txt](../artifacts/campaign-production-completion-20261010/maps/frostveil_d-v1.provenance.txt).

```
Task ID P3; original opaque PNG terrain plate 1672×940 landscape, Aetherhold Defense Frostveil D boss arena. Use approved Borderkeep A only as the painted ground and overhead three-quarter strategy-camera guide; use Frostveil world panel and World 3 environment reference only for slate, soft snow, controlled ice-blue and alpine atmosphere. Create a remote snowbound summit arena with maximum breathing room: nearly the entire center is broad, continuous, low-profile snow over muted charcoal-gray slate, gently wind-textured with sparse scattered powder and very restrained blue-gray mineral shadows. Frame the far perimeter with low broken snow-covered rock shelves, several distant pines and a few small ice faces at far corners, all irregular and separated; do not encroach on central combat space. Keep the central 75% especially open and low contrast, with multiple broad, separated clearings and quiet corridors for later route/build overlays. Add only a few distant warm amber snow reflections, suggesting torchlight offscreen without visible objects. Soft upper-left natural light, painterly material variation, rounded natural forms and no hard outline, no white-out or excessive cyan. Full-bleed ground only, not a panel or crop. Exclude all waterways, rivers, tracks, roads, trails, bridges, connected ice stripe, continuous linear clearing, geometric arena marks, build circles, buildings, walls, keep, gate, tower, beacon, characters, units, enemies, UI, text, watermark, border and grid. Do not place any large landmark in the middle.
```

## Tower provenance

All ten campaign tower sprites use the built-in image_gen with a transparent background. Full-resolution originals were copied unchanged, then resized to 192×192 with installed sharp (Lanczos3) while preserving alpha. The candidates received no paint, mask, recolor, or crop processing. Where targeted image-generation repairs were made, every call and exact prompt is retained below. The five accepted Tier I atlas references and their SHA-256 fingerprints are listed in each reference chain.

| Asset | Manifest path and delivered SHA-256 | Final generated original and SHA-256 |
| --- | --- | --- |
| tower:ember:tier2 | /assets/campaign/towers/ember-tier2-v1.png · 734599887abaad7589d2e2aec0496acdc904b61067325458feaac88769f7fffb | ember-tier2-v1-generation-01-original.png (d5332c4f1eedff42dccdbb9c33a643ab9f09bf6d64cb63a0274f13ebb1fa27bd) |
| tower:ember:tier3 | /assets/campaign/towers/ember-tier3-v1.png · 08d1ab6b40577bb2e5c61f71f46903d4ddd488dfab901fa7f113a4f8c420f2c7 | ember-tier3-v1-repair-01-final-original.png (9f7d6f73ca95d7585646d473d94be5f85c297a22d581f1818881e941d4d186bf) |
| tower:glacier:tier2 | /assets/campaign/towers/glacier-tier2-v1.png · 440312bdb8f88989777d298692b08ad3068e1701cc0aba6bec5bfc0099e24cf5 | glacier-tier2-v1-generation-01-original.png (c48a459e8640ee61791278b5c3a7cce3975f21fa99aee4a1527f0f0f92cf55f4) |
| tower:glacier:tier3 | /assets/campaign/towers/glacier-tier3-v1.png · b4d39322b050e702fce19783aa2ccffa28eb7929c603489766dacd554fc670a9 | glacier-tier3-v1-repair-01-final-original.png (7e7ad28a6d5dae4a89cde88afb74fda1b12a8abf61562ca942fee1617eba6331) |
| tower:longbow:tier2 | /assets/campaign/towers/longbow-tier2-v1.png · cfe35daada1e3a1b5d6977ee27b52d5a0477b095455c4b1275cf475356159324 | longbow-tier2-v1-final-original.png (80ff99e9e1f8d35071edf3775a5f1e85b5fcc9677c8905528ea5863885927021) |
| tower:longbow:tier3 | /assets/campaign/towers/longbow-tier3-v1.png · 915c48cd12cdd1be142ca8bcc036d2233183e5861c18c0f14eeafbcfe1720f4f | longbow-tier3-v1-final-original.png (299cd0382f38df6714b7dd9825aedae602733014df6bd2405357f463a1bc0a4a) |
| tower:starfire:tier2 | /assets/campaign/towers/starfire-tier2-v1.png · 384362b183450efebbc59748055991f18a6a76641553ebaf268fe8236e84adf1 | starfire-tier2-v1-generation-01-original.png (93f35211e6db1075bdcf2f56b37fe28f9290fd945fadde688bf0d7c61422bf63) |
| tower:starfire:tier3 | /assets/campaign/towers/starfire-tier3-v1.png · 17f3b88ba00533062729f4a008291590d3650908ad521b9ae0720a60fc8aec50 | starfire-tier3-v1-generation-01-original.png (27eb38a2874749d85339fed990aed43035def2f59c2cfc0aca709c75bbf72190) |
| tower:tempest:tier2 | /assets/campaign/towers/tempest-tier2-v1.png · f4744b2a8704464677c4860c78092de27ac4947783e6969ef234f3dd11eb95d4 | tempest-tier2-v1-generation-01-original.png (8ecd1f2d81e89f6ae958203eae383fef31d99ff95202fca8bcbb5b19242d6a7f) |
| tower:tempest:tier3 | /assets/campaign/towers/tempest-tier3-v1.png · b84478b91cabab8fc5002904fe390f34ed90737847872b941c3efc5034476870 | tempest-tier3-v1-repair-01-final-original.png (dd321f104bf68e43627e923c3fe7bd08b4e945990acedc64f0c3a781279f9f5e) |

V4 passed raw PNG integrity, placed texture selection, anchor centering, and visual progression for all five Tier II/III pairs. Its capture used an interim terrain revision; V6 later passed the final combined visual review on the P5-staged terrain. The current manifest and `AVAILABLE_CAMPAIGN_ART_PATHS` list the ten tower files as final and available; the old `candidate_staged_unapproved` values in the P1 sidecars describe the pre-integration staging snapshot.

### tower:ember:tier2

Manifest path: /assets/campaign/towers/ember-tier2-v1.png; delivered SHA-256 734599887abaad7589d2e2aec0496acdc904b61067325458feaac88769f7fffb.
Final image_gen source: C:/Users/ljour/.codex/generated_images/01a1243f-818f-7311-b43c-5af7db7c5377/exec-a556c7ec-3a98-47c5-ba7b-ca3d6f83eab7.png; SHA-256 d5332c4f1eedff42dccdbb9c33a643ab9f09bf6d64cb63a0274f13ebb1fa27bd.
Preserved original copy: artifacts/campaign-production-completion-20261010/towers/ember-tier2-v1-generation-01-original.png.
Processing: Copied the full-resolution image_gen original unchanged. Resized to 192x192 with installed sharp (Lanczos3), preserving alpha; staged identical candidate bytes at exact manifest path. No paint, mask, recolor, or crop.

#### Image-generation call 1: initial generation

Generated source: C:/Users/ljour/.codex/generated_images/01a1243f-818f-7311-b43c-5af7db7c5377/exec-a556c7ec-3a98-47c5-ba7b-ca3d6f83eab7.png; SHA-256 d5332c4f1eedff42dccdbb9c33a643ab9f09bf6d64cb63a0274f13ebb1fa27bd.
Reference chain:
- public/assets/towers/tower_bombard_stage1-v2.png · SHA-256 73e2b205c7586ae59aa56ae243e9fe197b9375965549666087534e6170d382ca — accepted Tier I Bombard base art

Exact prompt:
```
Use case: stylized-concept
Asset type: one transparent 192×192 campaign tower sprite for Aetherhold Defense, a fantasy tower-defense game
Primary request: Create the Tier II Reinforced Ember tower as a cosmetic evolution of the accepted Bombard tower shown in Image 1. Output one tower only, never a sheet or multiple variants.
Input images: Image 1 is the existing accepted Stage I Bombard tower. Use it only to preserve the tower’s identity, silhouette, proportions, palette, and painterly rendering; ignore any atlas layout.
Scene/backdrop: true transparent alpha; no environment, ground plane, or detached cast shadow.
Subject: the same compact single-barrel bronze bombard mounted on a timber pivot frame over a strong gray-stone foundation. Keep its open upward-angled muzzle, wooden struts, metal trunnions, and forward three-quarter perspective.
Style/medium: hand-painted fantasy strategy-game tower art matching Image 1; top-down three-quarter view at the same camera angle; soft upper-left global light; crisp painted edges, clear value groups, moderate surface texture. Muted warm timber, weathered gray stone, dark desaturated iron, and worn bronze.
Composition/framing: one centered complete bombard, square canvas, modest transparent padding, full barrel and base visible, upright bottom-center ground anchor; clear around 100 pixels tall in gameplay.
Materials/textures: Tier II Reinforced construction with visibly thicker timber braces, more substantial stone footings, improved but mechanically plausible cannon pivot and elevation bearings, and a few restrained bronze/iron reinforcement bands. Show the same single cannon and familiar shape; this is structural craftsmanship, not a new weapon or combat effect.
Lighting/mood: upper-left highlights on top-facing barrel, braces, and stone; shading integrated into surfaces only.
Constraints: cosmetic upgrade only; retain the single open-muzzle Bombard identity, compact footprint, original color/material family, natural silhouette, and transparent alpha. No recoloring-only tier change.
Avoid: text, UI, icons, atlas, multiple towers, extra barrels, projectiles, flames, explosions, glowing effects, smoke, detached shadows, contact ovals, borders, selection/range circles, health bars, badges, photorealism, anime, pixel art, thick black outlines, Warcraft/Blizzard-specific motifs, red/magenta fringe or outline.
```

Full production sidecar: [towers/ember-tier2-v1.provenance.json](../artifacts/campaign-production-completion-20261010/towers/ember-tier2-v1.provenance.json).

### tower:ember:tier3

Manifest path: /assets/campaign/towers/ember-tier3-v1.png; delivered SHA-256 08d1ab6b40577bb2e5c61f71f46903d4ddd488dfab901fa7f113a4f8c420f2c7.
Final image_gen source: C:/Users/ljour/.codex/generated_images/01a1243f-818f-7311-b43c-5af7db7c5377/exec-ebc96dca-fc11-4590-abb7-e20462a5a062.png; SHA-256 9f7d6f73ca95d7585646d473d94be5f85c297a22d581f1818881e941d4d186bf.
Preserved original copy: artifacts/campaign-production-completion-20261010/towers/ember-tier3-v1-repair-01-final-original.png.
Processing: Copied both full-resolution image_gen originals unchanged. Resized final original to 192x192 with installed sharp (Lanczos3), preserving alpha; staged identical candidate bytes at the exact manifest path. No paint, mask, recolor, or crop operation.

#### Image-generation call 1: initial generation

Generated source: C:/Users/ljour/.codex/generated_images/01a1243f-818f-7311-b43c-5af7db7c5377/exec-61b405dc-61a6-4426-a86b-ad80a1e812ee.png; SHA-256 d3bbf9f84d1f3643c60ac29f23e141642270bd99553f6b20021bd4b31b165c15.
Reference chain:
- public/assets/towers/tower_bombard_stage1-v2.png · SHA-256 73e2b205c7586ae59aa56ae243e9fe197b9375965549666087534e6170d382ca — accepted Tier I Bombard base art
- artifacts/campaign-production-completion-20261010/towers/ember-tier2-v1.png · SHA-256 734599887abaad7589d2e2aec0496acdc904b61067325458feaac88769f7fffb — Tier II Reinforced Ember continuity reference

Exact prompt:
```
Use case: stylized-concept
Asset type: one transparent 192×192 campaign tower sprite for Aetherhold Defense
Primary request: Create the Tier III Runic Masterwork Ember bombard as a cosmetic evolution of Image 1. Use Image 2 to confirm the original Bombard identity. Output one complete tower only, never a sheet or multiple variants.
Input images: Image 1 is the newly produced Tier II Reinforced Bombard candidate and the direct continuity reference. Image 2 is the accepted Stage I Bombard tower identity reference.
Scene/backdrop: true transparent alpha; no environment, ground plane, or detached shadow.
Subject: exactly the same single-barrel bronze bombard mounted on timber braces and a compact gray-stone base. Preserve the open upward-angled muzzle, recognizable barrel profile, pivot position, three-quarter camera angle, and one-tile ground footprint from both images.
Style/medium: polished hand-painted fantasy strategy-game art consistent with both references; top-down three-quarter perspective; upper-left light; crisp natural edges and readable value groups. Aged warm bronze, dark iron, honey-brown timber, weathered gray stone; Aether accents remain subtle.
Composition/framing: one centered complete bombard with the full barrel and base visible, square canvas, modest transparent padding, upright bottom-center ground anchor, readable at roughly 100 gameplay pixels tall. Keep the overall framing and size close to Image 1.
Lighting/mood: natural upper-left highlights; shading integrated into the structure; no bloom.
Materials/textures: refine the Tier II construction into a prestigious masterwork with precise bronze-and-iron pivot geometry, cleanly shaped reinforced braces, and strong but compact stone footings. Add one tiny amber/ivory faceted focal core integrated into the existing cannon pivot and a few faint pale Aether runes engraved in existing bronze or stone surfaces. Make the runes visible only as fine craft marks, not glowing symbols.
Constraints: clearly refined Tier III workmanship while preserving the same single cannon and Bombard family identity. Cosmetic-only appearance; no changed projectile, damage, or range implication. Genuine transparent alpha, clean natural edges.
Avoid: a second barrel, extra weapon, extra structure, projectiles, sparks, explosions, flame, smoke, luminous magic, large crystal, glowing core, large or repeated runes, red or magenta fringe, text, UI, logos, atlas layout, selection rings, detached shadows, photorealism, anime, pixel art, Warcraft/Blizzard-specific motifs.
```

#### Image-generation call 2: targeted visual repair 1 (reduce excessive runic decoration)

Generated source: C:/Users/ljour/.codex/generated_images/01a1243f-818f-7311-b43c-5af7db7c5377/exec-ebc96dca-fc11-4590-abb7-e20462a5a062.png; SHA-256 9f7d6f73ca95d7585646d473d94be5f85c297a22d581f1818881e941d4d186bf.
Reference chain:
- artifacts/campaign-production-completion-20261010/towers/ember-tier3-v1-generation-01-original.png · SHA-256 d3bbf9f84d1f3643c60ac29f23e141642270bd99553f6b20021bd4b31b165c15 — initial Tier III generated image edit target
- artifacts/campaign-production-completion-20261010/towers/ember-tier2-v1.png · SHA-256 734599887abaad7589d2e2aec0496acdc904b61067325458feaac88769f7fffb — Tier II Reinforced Ember continuity reference
- public/assets/towers/tower_bombard_stage1-v2.png · SHA-256 73e2b205c7586ae59aa56ae243e9fe197b9375965549666087534e6170d382ca — accepted Tier I Bombard base art

Exact prompt:
```
Use case: precise-object-edit
Asset type: one transparent 192×192 Tier III Runic Masterwork Ember tower sprite
Primary request: Quiet the excessive decorative markings in Image 1. Keep the exact same Bombard tower, overall structure, composition, perspective, camera, single barrel, wood braces, iron pivot, stone base, material palette and lighting. Remove the repeated large rune pattern covering the barrel band and most supports. Retain only three small, fine Aether engravings: one on the pivot housing and one each on two front-facing stone or bronze surfaces. They should be understated craft details, visible at close inspection, without glow.
Input images: Image 1 is the current Tier III Ember edit target. Image 2 is the Tier II Reinforced Ember tower for continuity. Image 3 is the accepted Stage I Bombard identity reference.
Scene/backdrop: fully transparent alpha, no environment, ground plane or detached shadow.
Subject: the same single-barrel bronze Bombard mounted on timber braces over a compact gray-stone foundation. Do not change the open upward-angled muzzle or its placement.
Style/medium: hand-painted fantasy strategy-game sprite, same painterly construction, upper-left light, aged bronze, dark iron, honey-brown timber, weathered gray stone.
Composition/framing: preserve the same full tower framing, size, and bottom-center ground anchor; keep the barrel and base inside the square canvas.
Materials/textures: retain Tier III's refined pivot and small amber focal core. Engravings must be tiny and etched into existing metal or stone, not bright decals or added objects.
Constraints: make only the runic-decoration correction; preserve the existing structure, color balance, camera, silhouette and genuine transparent alpha. Keep natural crisp edge materials.
Avoid: repeated rune bands, rune-covered braces, more than three accents, bright gold runes, luminous effects, red/magenta fringe, redesign, extra weapons or barrels, text, UI, badges, range circles, health bars, shadows, Warcraft/Blizzard-specific motifs.
```

Full production sidecar: [towers/ember-tier3-v1.provenance.json](../artifacts/campaign-production-completion-20261010/towers/ember-tier3-v1.provenance.json).

### tower:glacier:tier2

Manifest path: /assets/campaign/towers/glacier-tier2-v1.png; delivered SHA-256 440312bdb8f88989777d298692b08ad3068e1701cc0aba6bec5bfc0099e24cf5.
Final image_gen source: C:/Users/ljour/.codex/generated_images/01a1243f-818f-7311-b43c-5af7db7c5377/exec-88ae0ed6-d1e7-4175-93db-7d1f141e7134.png; SHA-256 c48a459e8640ee61791278b5c3a7cce3975f21fa99aee4a1527f0f0f92cf55f4.
Preserved original copy: artifacts/campaign-production-completion-20261010/towers/glacier-tier2-v1-generation-01-original.png.
Processing: Copied the full-resolution image_gen original unchanged. Resized to 192x192 with installed sharp (Lanczos3), preserving alpha; staged identical candidate bytes at the exact manifest path. No paint, mask, recolor, or crop.

#### Image-generation call 1: initial generation

Generated source: C:/Users/ljour/.codex/generated_images/01a1243f-818f-7311-b43c-5af7db7c5377/exec-88ae0ed6-d1e7-4175-93db-7d1f141e7134.png; SHA-256 c48a459e8640ee61791278b5c3a7cce3975f21fa99aee4a1527f0f0f92cf55f4.
Reference chain:
- public/assets/towers/tower_frost_stages-v1.png · SHA-256 218e9ba10b3faf147fb61c7485e79d8e94d99baea41dc8e8efc6b175c0204b69 — accepted Tier I Frost tower atlas; use the top-left first-stage cell only

Exact prompt:
```
Use case: stylized-concept
Asset type: one transparent 192×192 campaign tower sprite for Aetherhold Defense
Primary request: Create the Tier II Reinforced Glacier tower as a cosmetic evolution of the accepted Frost tower shown in Image 1. Use only the atlas's top-left first-stage tower as the design identity. Output one tower only, not an atlas.
Input images: Image 1 is the accepted four-stage Frost tower atlas; the top-left cell is the original Tier I design. Preserve its recognizable construction, silhouette, materials and painterly rendering; ignore all other cells and the sheet layout.
Scene/backdrop: true transparent alpha; no environment, ground plane, or detached cast shadow.
Subject: the same solitary upright faceted blue-white ice crystal set in a bronze collar and timber cradle above a compact gray-stone base. Keep the crystal as the tower's central focal shape; do not create additional crystals.
Style/medium: polished hand-painted fantasy strategy-game asset matching Image 1; top-down three-quarter camera; soft upper-left light; crisp natural painted edges and readable value groups. Cool translucent ice, dark weathered stone, warm bronze, subdued timber and dark iron.
Composition/framing: one centered complete tower, crystal tip and full base inside a square 192×192 canvas, modest transparent padding, bottom-center ground anchor, readable when displayed around 100 gameplay pixels tall.
Lighting/mood: upper-left highlights on the crystal and metal; internal facet color only, no emitted glow or bloom.
Materials/textures: Tier II Reinforced craftsmanship: thicker timber braces, stronger and more compact stone footings, an improved bronze-and-iron crystal collar and stable support mechanism, with a few subtle bronze reinforcement bands. Preserve the same single central crystal and compact footprint.
Constraints: cosmetic evolution only with no implied change in attack, range, or ice effects. True transparent alpha and natural material edges. Keep its actual crystal palette; do not recolor the tower to a biome.
Avoid: extra crystals, extra towers, new weapons, ice blasts, snow, particles, magic glow, detached shadows, text, UI, badges, labels, borders, selection circles, atlas layout, photorealism, anime, pixel art, thick black outlines, Warcraft/Blizzard motifs, red/magenta fringe or outlines.
```

Full production sidecar: [towers/glacier-tier2-v1.provenance.json](../artifacts/campaign-production-completion-20261010/towers/glacier-tier2-v1.provenance.json).

### tower:glacier:tier3

Manifest path: /assets/campaign/towers/glacier-tier3-v1.png; delivered SHA-256 b4d39322b050e702fce19783aa2ccffa28eb7929c603489766dacd554fc670a9.
Final image_gen source: C:/Users/ljour/.codex/generated_images/01a1243f-818f-7311-b43c-5af7db7c5377/exec-e5a3f795-1b23-484e-80c8-c6b1db1693bb.png; SHA-256 7e7ad28a6d5dae4a89cde88afb74fda1b12a8abf61562ca942fee1617eba6331.
Preserved original copy: artifacts/campaign-production-completion-20261010/towers/glacier-tier3-v1-repair-01-final-original.png.
Processing: Copied the full-resolution image_gen original unchanged. Resized to 192x192 with installed sharp (Lanczos3), preserving alpha; staged identical candidate bytes at the exact manifest path. No paint, mask, recolor, or crop operation. Preserved the prior 192x192 candidate and provenance backup, then replaced the owned candidate/public copy with a 192x192 resize of the repaired image_gen original.

#### Image-generation call 1: initial generation

Generated source: C:/Users/ljour/.codex/generated_images/01a1243f-818f-7311-b43c-5af7db7c5377/exec-41186225-bf15-44e0-8f15-0395e36b0019.png; SHA-256 853fabd65f9d912a7847be73e5c5023120da0b6d68598e9254705d3f331ad3e7.
Reference chain:
- artifacts/campaign-production-completion-20261010/towers/glacier-tier2-v1.png · SHA-256 440312bdb8f88989777d298692b08ad3068e1701cc0aba6bec5bfc0099e24cf5 — Tier II Reinforced Glacier continuity reference
- public/assets/towers/tower_frost_stages-v1.png · SHA-256 218e9ba10b3faf147fb61c7485e79d8e94d99baea41dc8e8efc6b175c0204b69 — accepted Tier I Frost tower atlas; use the top-left first-stage cell only

Exact prompt:
```
Use case: stylized-concept
Asset type: one transparent 192×192 campaign tower sprite for Aetherhold Defense
Primary request: Create the Tier III Runic Masterwork Glacier tower as a cosmetic evolution of Image 1. Use Image 2 only to confirm the accepted original Frost/Glacier identity. Output one tower only, never an atlas.
Input images: Image 1 is the Tier II Reinforced Glacier candidate and direct continuity reference. Image 2 is the accepted four-stage Frost tower atlas; the top-left cell is the original Tier I design. Ignore the remaining cells and the sheet layout.
Scene/backdrop: true transparent alpha; no environment, ground plane, or detached cast shadow.
Subject: the same single tall faceted blue-white ice crystal held by a bronze collar, timber braces, and compact gray-stone foundation. Preserve the central crystal, mount, proportions, perspective, and one-tile footprint.
Style/medium: hand-painted fantasy strategy-game art consistent with both references; top-down three-quarter perspective; soft upper-left light; crisp natural edges, clear value groups and restrained painted texture. Cool translucent ice, weathered gray stone, warm bronze, subdued timber and desaturated iron.
Composition/framing: one centered complete tower, crystal tip and base fully visible, square canvas with modest transparent padding and bottom-center ground anchor; read cleanly around 100 gameplay pixels tall. Keep Image 1's overall scale and framing.
Lighting/mood: retain natural crystal facets and upper-left highlights; no bloom or emitted glow.
Materials/textures: refine the Tier II mount into a prestigious masterwork with precise bronze-and-iron collar geometry, cleaner brace joints, and refined compact stonework. Let the existing single crystal remain the stronger focal core through more precise facet definition, without enlarging it or adding another. Add only three very small pale-silver/cool-blue Aether engravings in existing bronze or stone, subtle enough to read as crafted inlays rather than bright symbols.
Constraints: visibly more refined than Tier II but still recognizably the same Glacier tower. Cosmetic appearance only, with no new combat or ice effect. Preserve transparent alpha and natural edge colors.
Avoid: extra crystals, extra towers, floating shards, snow, ice blasts, particles, glow, bloom, oversized runes, repeated rune bands, red/magenta fringe, text, UI, labels, icons, selection rings, shadows, background, Warcraft/Blizzard motifs, photorealism, anime, pixel art, thick outlines, or atlas layout.
```

#### Image-generation call 2: targeted visual repair 1 (align Tier III stone-base ground anchor)

Generated source: C:/Users/ljour/.codex/generated_images/01a1243f-818f-7311-b43c-5af7db7c5377/exec-e5a3f795-1b23-484e-80c8-c6b1db1693bb.png; SHA-256 7e7ad28a6d5dae4a89cde88afb74fda1b12a8abf61562ca942fee1617eba6331.
Reference chain:
- artifacts/campaign-production-completion-20261010/towers/glacier-tier3-v1-generation-01-original.png · SHA-256 853fabd65f9d912a7847be73e5c5023120da0b6d68598e9254705d3f331ad3e7 — original Tier III Glacier image edited for anchor alignment
- artifacts/campaign-production-completion-20261010/towers/glacier-tier2-v1.png · SHA-256 440312bdb8f88989777d298692b08ad3068e1701cc0aba6bec5bfc0099e24cf5 — Tier II Reinforced Glacier alignment reference
- public/assets/towers/tower_frost_stages-v1.png · SHA-256 218e9ba10b3faf147fb61c7485e79d8e94d99baea41dc8e8efc6b175c0204b69 — accepted Tier I Frost tower atlas

Exact prompt:
```
Use case: precise-object-edit
Asset type: one transparent 192×192 Tier III Runic Masterwork Glacier tower sprite
Primary request: Correct the ground alignment in Image 1. The Tier III tower currently has too much transparent padding below its base compared with Tier II. Preserve Image 1's existing complete crystal, runes, materials, perspective, camera and silhouette, but extend the lowest stone foundation downward so its bottom contact line matches Image 2's bottom-center anchor in the 192×192 delivery frame. The target is about 6 pixels lower at delivery size; keep the crystal tip at its current height and do not scale the whole tower.
Input images: Image 1 is the current Tier III Glacier full-resolution edit target. Image 2 is the accepted-style Tier II Glacier delivery-size reference used only to match scale and ground anchor. Image 3 is the accepted Stage I Frost atlas used to retain tower identity.
Scene/backdrop: true transparent alpha; no environment, ground plane, or detached shadow.
Subject: the same single blue-white crystal on its bronze collar, timber braces and compact gray-stone foundation.
Style/medium: hand-painted fantasy strategy-game art, upper-left light, natural crystal facets, weathered stone, restrained bronze and subdued wood.
Composition/framing: retain the same crystal-tip position, same camera and width; only extend/refine the lowest visible stone footing downward by approximately 6 delivery pixels so it shares Tier II's bottom-center ground line. Keep all artwork inside the square canvas.
Constraints: preserve the same one-crystal Glacier identity, refined mount, all three subtle inlays, materials and actual transparent alpha. This is a local base-alignment repair only.
Avoid: shrinking the full sprite, moving the crystal or upper structure, changing proportions or width, adding new stones or crystals, changing runes, glow, red/magenta fringe, background, shadow, UI or text.
```

Full production sidecar: [towers/glacier-tier3-v1.provenance.json](../artifacts/campaign-production-completion-20261010/towers/glacier-tier3-v1.provenance.json).

### tower:longbow:tier2

Manifest path: /assets/campaign/towers/longbow-tier2-v1.png; delivered SHA-256 cfe35daada1e3a1b5d6977ee27b52d5a0477b095455c4b1275cf475356159324.
Final image_gen source: C:/Users/ljour/.codex/generated_images/01a1243f-818f-7311-b43c-5af7db7c5377/exec-54d2f372-73ca-4e6c-842f-e697b5c695ed.png; SHA-256 80ff99e9e1f8d35071edf3775a5f1e85b5fcc9677c8905528ea5863885927021.
Preserved original copy: artifacts/campaign-production-completion-20261010/towers/longbow-tier2-v1-final-original.png.
Processing: Copied all three full-resolution image_gen originals unchanged. Resized the final original to 192x192 with installed sharp (Lanczos3), preserving its alpha; staged identical candidate bytes at the exact manifest asset path. No paint, mask, recolor, or crop operation.

#### Image-generation call 1: initial generation

Generated source: C:/Users/ljour/.codex/generated_images/01a1243f-818f-7311-b43c-5af7db7c5377/exec-8861167f-744e-4cf9-8a95-986755c41cf7.png; SHA-256 f4d5285cd861250978face66ac79f289fa94aa07d2d267dc42eb2d9028a49cf0.
Reference chain:
- public/assets/towers/tower_ranger_stages-v2.png · SHA-256 daa5552a3e688d15820d7b8c84b784eb73ba3c49619efbbc63e174bc8feb2439 — accepted Tier I Longbow identity/style reference atlas (first stage is the identity reference)

Exact prompt:
```
Use case: stylized-concept
Asset type: one transparent 192×192 campaign tower sprite for Aetherhold Defense, a fantasy tower-defense game
Primary request: Create Tier II Reinforced Longbow tower art as a cosmetic evolution of the existing Longbow tower in the reference atlas. Use the top-left / first-stage Longbow as the design identity reference; output one tower only, never an atlas or multiple variants.
Input images: Image 1 is the existing accepted four-stage Longbow tower atlas, used only to preserve the first-stage tower's recognizable construction language, proportions, palette, and painterly rendering.
Scene/backdrop: transparent; no environment or detached cast shadow.
Subject: the same tall, narrow Borderkeep Longbow watchtower with its elevated open firing platform, wooden supports, compact stone foundation, and forward-facing repeating crossbow. Preserve the existing tower family identity and one-tile footprint.
Style/medium: stylized hand-painted fantasy strategy-game asset; top-down three-quarter view with the same apparent camera angle as the reference; upper-left global light; crisp painted edges, clear value groups, moderate surface texture, muted wood, weathered gray stone, desaturated iron, and restrained warm bronze.
Composition/framing: one centered complete tower, nearly filling a square 192×192 canvas with modest transparent padding; keep the full weapon, platform, supports, and base inside the canvas; upright ground anchor at bottom center; readable at small gameplay size.
Lighting/mood: soft upper-left highlights on top-facing wood and stone; soft short contact shading integrated only where attached to the structure.
Materials/textures: add visibly thicker structural braces, improved crossbow mechanism, stronger stone base, and a few subtle bronze reinforcement bands or fittings. These are visual refinements of the same Longbow, not a new combat role.
Constraints: retain the narrow vertical watchtower silhouette and original crossbow identity; keep the structure compact and grounded; real transparent alpha; no recoloring the whole tower; no separate ground plane, contact oval, or cast shadow; no text or marks.
Avoid: UI, labels, icons, borders, selection/range circles, health bars, badges, projectiles, extra towers, extra weapons, banners, glowing effects, detached shadows, photorealism, anime, pixel art, thick black outlines, exaggerated fantasy spikes, Warcraft/Blizzard motifs, and any layout or objects from the reference atlas.
```

#### Image-generation call 2: targeted visual repair 1 (red edge fringe)

Generated source: C:/Users/ljour/.codex/generated_images/01a1243f-818f-7311-b43c-5af7db7c5377/exec-f38c547b-dab1-41f4-95cd-cc0e539ad83b.png; SHA-256 cea11b1e81adc839c59fd395cc891124edee51b8b5d26234d4a5df02140c1807.
Reference chain:
- public/assets/towers/tower_ranger_stages-v2.png · SHA-256 daa5552a3e688d15820d7b8c84b784eb73ba3c49619efbbc63e174bc8feb2439 — accepted Tier I Longbow identity/style reference atlas (first stage is the identity reference)

Exact prompt:
```
Use case: precise-object-edit
Asset type: one transparent 192×192 campaign tower sprite for Aetherhold Defense
Primary request: Remove the accidental red fringe and red halo around the Longbow tower silhouette in Image 1. Preserve the tower itself as closely as possible: same exact composition, camera angle, silhouette, crossbow, wooden structure, braces, stone base, subtle bronze fittings, materials, palette, and upper-left lighting.
Input images: Image 1 is the Tier II Longbow edit target. Image 2 is the accepted Longbow tower atlas for style and identity reference.
Scene/backdrop: fully transparent alpha beyond the tower; no environment.
Subject: one reinforced Borderkeep Longbow watchtower, unchanged from Image 1 except for clean natural painted edges.
Style/medium: the existing stylized hand-painted fantasy strategy-game art; painted wood, weathered stone, desaturated iron, restrained bronze; upper-left light.
Composition/framing: keep Image 1's centered, upright tower, full weapon and full base visible, same modest square-canvas padding and bottom-center ground anchor.
Constraints: change only the red fringe/halo; remove all bright red outline pixels and edge glow. Keep the current tower colors and all structural details. Preserve real transparent alpha. No additional shadow.
Avoid: redesign, repainting, recoloring, changes to silhouette or proportions, changes to weapon or base, extra details, glow, red pixels outside existing materials, text, UI, selection rings, health bars, background, or detached shadow.
```

#### Image-generation call 3: targeted visual repair 2 (residual red edge pixels)

Generated source: C:/Users/ljour/.codex/generated_images/01a1243f-818f-7311-b43c-5af7db7c5377/exec-54d2f372-73ca-4e6c-842f-e697b5c695ed.png; SHA-256 80ff99e9e1f8d35071edf3775a5f1e85b5fcc9677c8905528ea5863885927021.
Reference chain:
- public/assets/towers/tower_ranger_stages-v2.png · SHA-256 daa5552a3e688d15820d7b8c84b784eb73ba3c49619efbbc63e174bc8feb2439 — accepted Tier I Longbow identity/style reference atlas (first stage is the identity reference)

Exact prompt:
```
Use case: precise-object-edit
Asset type: final transparent Longbow campaign tower sprite
Primary request: Clean the remaining accidental bright red pixels and red edge-fringe from the Longbow tower in Image 1. The first cleanup left small red marks around the top crossbow mechanism and along outer wooden braces. Replace those marks with the immediately adjacent natural wood, iron, or stone edge color, and remove any red halo. Preserve all other pixels and details as closely as possible.
Input images: Image 1 is the current Tier II edit target. Image 2 is the accepted Longbow atlas for the tower's original material and color language.
Scene/backdrop: fully transparent background; no environment.
Subject: one centered Reinforced Longbow watchtower, exactly the same design and framing as Image 1.
Style/medium: existing stylized hand-painted fantasy strategy art, upper-left lighting, muted wood and stone, desaturated iron, restrained bronze.
Composition/framing: maintain current square framing, upright bottom-center ground anchor, complete crossbow/platform/supports/base.
Constraints: this is a tiny edge-material cleanup only. There must be no bright red or magenta outline, fringe, or glow outside the tower. Maintain genuine transparent alpha and the current silhouette. Do not change the structure, colors, proportions, base, crossbow, overall lighting, or composition.
Avoid: any redesign, added or removed tower details, recoloring, outline, glow, shadow, text, UI, symbols, or background.
```

Full production sidecar: [towers/longbow-tier2-v1.provenance.json](../artifacts/campaign-production-completion-20261010/towers/longbow-tier2-v1.provenance.json).

### tower:longbow:tier3

Manifest path: /assets/campaign/towers/longbow-tier3-v1.png; delivered SHA-256 915c48cd12cdd1be142ca8bcc036d2233183e5861c18c0f14eeafbcfe1720f4f.
Final image_gen source: C:/Users/ljour/.codex/generated_images/01a1243f-818f-7311-b43c-5af7db7c5377/exec-22bbb547-3844-4523-8856-289c768d0f74.png; SHA-256 299cd0382f38df6714b7dd9825aedae602733014df6bd2405357f463a1bc0a4a.
Preserved original copy: artifacts/campaign-production-completion-20261010/towers/longbow-tier3-v1-final-original.png.
Processing: Copied all three full-resolution image_gen originals unchanged. Resized final original to 192x192 with installed sharp (Lanczos3), preserving alpha; staged identical candidate bytes at the exact manifest asset path. No paint, mask, recolor, or crop operation.

#### Image-generation call 1: initial generation

Generated source: C:/Users/ljour/.codex/generated_images/01a1243f-818f-7311-b43c-5af7db7c5377/exec-408cf4b9-ba35-4c34-bb63-8d9746f36824.png; SHA-256 7c29fcef035e7a508d595fda565489431118360ac810de7e8825cd9b42bef318.
Reference chain:
- artifacts/campaign-production-completion-20261010/towers/longbow-tier2-v1-final-original.png · SHA-256 80ff99e9e1f8d35071edf3775a5f1e85b5fcc9677c8905528ea5863885927021
- public/assets/towers/tower_ranger_stages-v2.png · SHA-256 daa5552a3e688d15820d7b8c84b784eb73ba3c49619efbbc63e174bc8feb2439

Exact prompt:
```
Use case: stylized-concept
Asset type: one transparent 192×192 campaign tower sprite for Aetherhold Defense, a fantasy tower-defense game
Primary request: Create the Tier III Runic Masterwork Longbow tower, a cosmetic evolution of the Tier II Reinforced Longbow in Image 1. Use Image 2's first-stage Longbow to confirm the original tower identity. Output one complete tower only, never a sheet, atlas, or multiple variants.
Input images: Image 1 is the approved-style Tier II Longbow pilot candidate and the direct visual continuity reference. Image 2 is the accepted four-stage Longbow atlas; use its first-stage tower only as the identity reference.
Scene/backdrop: transparent; no environment or detached cast shadow.
Subject: the same tall, narrow Borderkeep Longbow watchtower with the elevated open firing platform, repeating crossbow, timber supports, and compact stone foundation. Keep the existing Longbow family silhouette and one-tile ground footprint.
Style/medium: stylized hand-painted fantasy strategy-game art matching both references; top-down three-quarter perspective; upper-left global light; readable silhouette, clear value groups, moderate painted texture. Muted wood, weathered gray stone, desaturated iron, warm bronze, and a very restrained pale-violet Aether accent.
Composition/framing: one centered complete tower, full crossbow and base visible, square canvas with modest transparent padding, upright bottom-center ground anchor; detailed enough at source size but clear when displayed around 100 gameplay pixels tall.
Lighting/mood: soft upper-left highlights on top-facing surfaces; subtle shading integrated into the structure only.
Materials/textures: refine the Tier II geometry into a prestigious masterwork: more precise crossbow fittings and cleanly shaped braces, stronger but still compact stonework, a few small carved Aether runes etched into bronze or stone, and a tiny faceted focus set at the crossbow pivot. Runic detail is engraved and restrained, with no bloom or combat effect.
Constraints: make Tier III visibly more refined than Tier II while retaining the same recognizable Longbow, proportions, narrow vertical watchtower silhouette, forward crossbow, natural Borderkeep materials, and compact scale. Cosmetic change only, with no indication of changed damage or range. True transparent alpha with clean natural edges.
Avoid: text, UI, badges, level markers, selection/range rings, health bars, projectiles, flags, detached shadows, ground plane, large crystals, luminous magic, heavy glow, red/magenta edge fringe, extra towers, extra weapons, photorealism, anime, pixel art, thick outlines, Warcraft/Blizzard-specific motifs, and any atlas layout from the references.
```

#### Image-generation call 2: targeted visual repair 1 (runic restraint and red fringe cleanup)

Generated source: C:/Users/ljour/.codex/generated_images/01a1243f-818f-7311-b43c-5af7db7c5377/exec-e6e52848-ba41-4573-a9bf-9a50e9f7c28c.png; SHA-256 d8614df1220e8147415949608ba395c315923d01111a228fcea55ab00a174f6c.
Reference chain:
- artifacts/campaign-production-completion-20261010/towers/longbow-tier3-v1-generation-01-original.png · SHA-256 7c29fcef035e7a508d595fda565489431118360ac810de7e8825cd9b42bef318
- artifacts/campaign-production-completion-20261010/towers/longbow-tier2-v1-final-original.png · SHA-256 80ff99e9e1f8d35071edf3775a5f1e85b5fcc9677c8905528ea5863885927021
- public/assets/towers/tower_ranger_stages-v2.png · SHA-256 daa5552a3e688d15820d7b8c84b784eb73ba3c49619efbbc63e174bc8feb2439

Exact prompt:
```
Use case: precise-object-edit
Asset type: final transparent Tier III Longbow campaign tower sprite
Primary request: Refine Image 1 so it follows the World Design Bible's restrained Runic Masterwork treatment. Keep the same tower, composition, camera, crossbow, braces, base, and proportions. Reduce the large and repeated bright violet rune shapes to a few tiny carved Aether engravings that are visible only on close inspection, with just one very small pale-violet faceted focus at the crossbow pivot. The runes must look engraved or inlaid into existing bronze and stone, not like large purple gems or glowing decals.
Input images: Image 1 is the Tier III edit target. Image 2 is the Tier II Longbow pilot used to preserve the established reinforcements and materials. Image 3 is the accepted Longbow atlas used to preserve the original tower family identity.
Scene/backdrop: fully transparent; no environment.
Subject: one complete Longbow watchtower, matching the same narrow Borderkeep silhouette and one-tile footprint from Images 2 and 3.
Style/medium: stylized hand-painted fantasy strategy art, upper-left lighting; muted wood, weathered stone, desaturated iron, warm bronze, minimal cool Aether detail.
Composition/framing: preserve Image 1's square framing, centered tower, intact crossbow and base, and upright bottom-center ground anchor.
Lighting/mood: keep existing natural light and painted shading; no light bloom or emitted glow.
Materials/textures: retain refined masterwork geometry and bronze fittings; replace oversized violet shapes with subtle fine engravings and quiet inlays. Also remove bright red fringe or halo along the transparency edge, coloring edge pixels naturally with their adjacent materials.
Constraints: make only these two visual corrections: reduce the purple runic decoration to subtle etched accents, and remove red edge artifacts. Preserve actual transparent alpha. Keep the existing tower identity and silhouette.
Avoid: redesign, extra ornament, large purple crystals, bright runes, glowing edges, glow, red/magenta fringe, text, UI, range or selection circles, health bars, detached shadow, background, Warcraft/Blizzard-specific designs.
```

#### Image-generation call 3: targeted visual repair 2 (three readable restrained runic inlays)

Generated source: C:/Users/ljour/.codex/generated_images/01a1243f-818f-7311-b43c-5af7db7c5377/exec-22bbb547-3844-4523-8856-289c768d0f74.png; SHA-256 299cd0382f38df6714b7dd9825aedae602733014df6bd2405357f463a1bc0a4a.
Reference chain:
- artifacts/campaign-production-completion-20261010/towers/longbow-tier3-v1-repair-01-original.png · SHA-256 d8614df1220e8147415949608ba395c315923d01111a228fcea55ab00a174f6c
- artifacts/campaign-production-completion-20261010/towers/longbow-tier2-v1.png · SHA-256 cfe35daada1e3a1b5d6977ee27b52d5a0477b095455c4b1275cf475356159324

Exact prompt:
```
Use case: precise-object-edit
Asset type: final transparent Tier III Longbow campaign tower sprite
Primary request: Keep Image 1's refined Longbow masterwork and add only a few restrained, clearly readable Aether inlays so the Tier III sprite remains visibly distinct from the Tier II tower in Image 2 at gameplay scale. Use exactly three small painted/inlaid runic accents: one at the crossbow pivot, one on the front diagonal brace, and one on a front stone base block. Each should be a modest pale-violet/silver carved mark, approximately 8–12 pixels in this 192×192 delivery canvas, with no glow. Do not add additional runes.
Input images: Image 1 is the Tier III edit target. Image 2 is the Tier II Longbow candidate and progression comparison.
Scene/backdrop: transparent; no environment.
Subject: one complete Borderkeep Longbow masterwork watchtower, same established narrow silhouette, repeating crossbow, wood supports, bronze and iron reinforcement, compact stone foundation.
Style/medium: stylized hand-painted fantasy strategy art matching both references; upper-left lighting; weathered natural materials and restrained Aether detail.
Composition/framing: preserve Image 1's centered square framing, full weapon and base, bottom-center ground anchor, and one-tile scale.
Lighting/mood: natural upper-left light, no glow or bloom.
Materials/textures: retain Tier III's refined metal geometry and fittings; the three runes are engraved or inlaid in existing bronze/stone, not standalone gems.
Constraints: change only the rune visibility/count as described; keep the same structure, materials, colors, camera, lighting and silhouette. Preserve actual transparent alpha with clean natural edges and no red fringe.
Avoid: large crystals, glowing magic, bright purple fill, extra runes, new objects, red/magenta outline, cast shadow, ground plane, UI, text, badges, selection rings, health bars, Warcraft/Blizzard-specific motifs.
```

Full production sidecar: [towers/longbow-tier3-v1.provenance.json](../artifacts/campaign-production-completion-20261010/towers/longbow-tier3-v1.provenance.json).

### tower:starfire:tier2

Manifest path: /assets/campaign/towers/starfire-tier2-v1.png; delivered SHA-256 384362b183450efebbc59748055991f18a6a76641553ebaf268fe8236e84adf1.
Final image_gen source: C:/Users/ljour/.codex/generated_images/01a1243f-818f-7311-b43c-5af7db7c5377/exec-c0ab7ea8-f0e9-405b-8584-2487dbecadbb.png; SHA-256 93f35211e6db1075bdcf2f56b37fe28f9290fd945fadde688bf0d7c61422bf63.
Preserved original copy: artifacts/campaign-production-completion-20261010/towers/starfire-tier2-v1-generation-01-original.png.
Processing: Copied the full-resolution image_gen original unchanged. Resized to 192x192 with installed sharp (Lanczos3), preserving alpha; staged identical candidate bytes at the exact manifest path. No paint, mask, recolor, or crop.

#### Image-generation call 1: initial generation

Generated source: C:/Users/ljour/.codex/generated_images/01a1243f-818f-7311-b43c-5af7db7c5377/exec-c0ab7ea8-f0e9-405b-8584-2487dbecadbb.png; SHA-256 93f35211e6db1075bdcf2f56b37fe28f9290fd945fadde688bf0d7c61422bf63.
Reference chain:
- public/assets/towers/tower_arcane_stages-v1.png · SHA-256 37d26002535f0ac63b6687d8f2e72bbcaad64f9518fb56ea154ea06a86cab665 — accepted Tier I Arcane tower atlas; use the top-left first-stage cell only

Exact prompt:
```
Use case: stylized-concept
Asset type: one transparent 192×192 campaign tower sprite for Aetherhold Defense
Primary request: Create the Tier II Reinforced Starfire tower as a cosmetic evolution of the accepted Arcane tower in Image 1. Use the top-left first-stage tower as the identity reference. Output one tower only, never an atlas or multiple variants.
Input images: Image 1 is the accepted four-stage Arcane tower atlas. The top-left cell shows the original Tier I tower; preserve its tower identity, proportions, palette, and painterly language. Ignore all other cells and atlas layout.
Scene/backdrop: true transparent alpha with no environment, ground plane, or detached cast shadow.
Subject: the same compact stone obelisk tower with one narrow violet crystal set vertically in its central bronze-and-stone housing, a pointed cap, bronze fittings, and a sturdy gray-stone foundation. Keep the recognizable vertical spire and single central crystal.
Style/medium: polished hand-painted fantasy strategy-game art matching Image 1; top-down three-quarter perspective; soft upper-left light; crisp natural painted edges, clear value groups, moderate surface texture. Weathered charcoal-gray stone, restrained warm bronze, one amethyst-violet crystal.
Composition/framing: one centered complete tower, pointed top and full base visible, square canvas, modest transparent padding and bottom-center ground anchor; readable around 100 gameplay pixels tall.
Lighting/mood: natural upper-left highlights and controlled crystal facets; no emitted light, bloom, or combat effects.
Materials/textures: Tier II Reinforced construction with thicker stone braces and buttresses, a more secure crystal collar and improved bronze mounting fittings, and a stronger compact foundation. Add structural variation and metal reinforcement rather than recoloring the tower.
Constraints: keep the same single spire and crystal, silhouette, camera angle, proportions, and compact ground footprint. Cosmetic evolution only, no indication of increased damage or range. Preserve true transparent alpha and natural edges.
Avoid: extra spires, crystals, towers, free-floating gems, runes, lightning, projectiles, glow, text, UI, labels, icons, selection circles, shadows, atlas layout, Warcraft/Blizzard motifs, photorealism, anime, pixel art, thick outlines, red/magenta fringe or outline.
```

Full production sidecar: [towers/starfire-tier2-v1.provenance.json](../artifacts/campaign-production-completion-20261010/towers/starfire-tier2-v1.provenance.json).

### tower:starfire:tier3

Manifest path: /assets/campaign/towers/starfire-tier3-v1.png; delivered SHA-256 17f3b88ba00533062729f4a008291590d3650908ad521b9ae0720a60fc8aec50.
Final image_gen source: C:/Users/ljour/.codex/generated_images/01a1243f-818f-7311-b43c-5af7db7c5377/exec-a8a7cf67-6303-42f8-8f5d-0f226f6633a6.png; SHA-256 27eb38a2874749d85339fed990aed43035def2f59c2cfc0aca709c75bbf72190.
Preserved original copy: artifacts/campaign-production-completion-20261010/towers/starfire-tier3-v1-generation-01-original.png.
Processing: Copied the full-resolution image_gen original unchanged. Resized to 192x192 with installed sharp (Lanczos3), preserving alpha; staged identical candidate bytes at the exact manifest path. No paint, mask, recolor, or crop operation.

#### Image-generation call 1: initial generation

Generated source: C:/Users/ljour/.codex/generated_images/01a1243f-818f-7311-b43c-5af7db7c5377/exec-a8a7cf67-6303-42f8-8f5d-0f226f6633a6.png; SHA-256 27eb38a2874749d85339fed990aed43035def2f59c2cfc0aca709c75bbf72190.
Reference chain:
- artifacts/campaign-production-completion-20261010/towers/starfire-tier2-v1.png · SHA-256 384362b183450efebbc59748055991f18a6a76641553ebaf268fe8236e84adf1 — Tier II Reinforced Starfire continuity reference
- public/assets/towers/tower_arcane_stages-v1.png · SHA-256 37d26002535f0ac63b6687d8f2e72bbcaad64f9518fb56ea154ea06a86cab665 — accepted Tier I Arcane tower atlas; use the top-left first-stage cell only

Exact prompt:
```
Use case: stylized-concept
Asset type: one transparent 192×192 campaign tower sprite for Aetherhold Defense
Primary request: Create the Tier III Runic Masterwork Starfire tower as a cosmetic evolution of Image 1. Use Image 2 only to confirm the original Arcane family identity. Output a single complete tower, never an atlas.
Input images: Image 1 is the Tier II Reinforced Starfire candidate and direct continuity reference. Image 2 is the accepted four-stage Arcane tower atlas; its top-left cell is the original Stage I tower. Ignore other cells and the sheet layout.
Scene/backdrop: true transparent alpha; no background, ground plane, or detached shadow.
Subject: the same tall compact dark-stone spire with one narrow vertical amethyst crystal held in a bronze frame and a pointed stone cap. Preserve the single-spire silhouette, crystal position, camera angle, and one-tile footprint.
Style/medium: hand-painted fantasy strategy-game sprite matching both references; top-down three-quarter view, upper-left light, clear value grouping, moderate stone texture and crisp natural edges. Weathered charcoal-gray stone, aged warm bronze, and a single violet crystal.
Composition/framing: one centered complete spire with top and foundation visible. Keep the size, framing, and bottom-center ground anchor closely aligned to Image 1; square canvas with modest transparent padding; readable around 100 gameplay pixels tall.
Lighting/mood: retain the calm existing crystal facet highlights; no added bloom, light emission, or combat effect.
Materials/textures: refine the Tier II structure into a prestigious masterwork: clean, precise bronze fittings, more intentional stone geometry, and a slightly more articulated setting that strengthens the existing single crystal as the focal core without enlarging it. Add only three small subtle pale-violet/silver Aether engravings in existing bronze or stone—one at the crystal collar and two on front-facing lower supports. Keep each etched and restrained, not bright or glowing.
Constraints: visibly refined from Tier II, with the same single crystal, same spire identity, same proportions and footprint. Cosmetic-only visual evolution, not a gameplay claim. Preserve true transparent alpha, natural edges, and bottom alignment.
Avoid: extra towers, crystals, spires, gems, rays, particles, lightning, projectiles, glowing runes, repeated symbol patterns, large bright symbols, red/magenta fringe, text, UI, badges, selection rings, detached shadow, photorealism, anime, pixel art, Warcraft/Blizzard motifs, and any atlas layout.
```

Full production sidecar: [towers/starfire-tier3-v1.provenance.json](../artifacts/campaign-production-completion-20261010/towers/starfire-tier3-v1.provenance.json).

### tower:tempest:tier2

Manifest path: /assets/campaign/towers/tempest-tier2-v1.png; delivered SHA-256 f4744b2a8704464677c4860c78092de27ac4947783e6969ef234f3dd11eb95d4.
Final image_gen source: C:/Users/ljour/.codex/generated_images/01a1243f-818f-7311-b43c-5af7db7c5377/exec-bf8f34f7-da9b-4443-bd86-01e57be293aa.png; SHA-256 8ecd1f2d81e89f6ae958203eae383fef31d99ff95202fca8bcbb5b19242d6a7f.
Preserved original copy: artifacts/campaign-production-completion-20261010/towers/tempest-tier2-v1-generation-01-original.png.
Processing: Copied the full-resolution image_gen original unchanged. Resized to 192x192 with installed sharp (Lanczos3), preserving alpha; staged identical candidate bytes at the exact manifest path. No paint, mask, recolor, or crop operation.

#### Image-generation call 1: initial generation

Generated source: C:/Users/ljour/.codex/generated_images/01a1243f-818f-7311-b43c-5af7db7c5377/exec-bf8f34f7-da9b-4443-bd86-01e57be293aa.png; SHA-256 8ecd1f2d81e89f6ae958203eae383fef31d99ff95202fca8bcbb5b19242d6a7f.
Reference chain:
- public/assets/towers/tower_tempest_stages-v1.png · SHA-256 62eae86a7cacea9a8bfe9c69c0230818e26a2dd06805cd88ceae2226d2677f0a — accepted Tier I Tempest tower atlas; use the top-left first-stage cell only

Exact prompt:
```
Use case: stylized-concept
Asset type: one transparent 192×192 campaign tower sprite for Aetherhold Defense
Primary request: Create the Tier II Reinforced Tempest tower as a cosmetic evolution of the accepted Tempest tower shown in Image 1. Use the top-left first-stage tower as the identity reference. Output one tower only, never an atlas.
Input images: Image 1 is the accepted four-stage Tempest tower atlas. Its top-left cell is the original Tier I design; preserve its identity, silhouette, proportions and hand-painted material style. Ignore all other cells and the sheet layout.
Scene/backdrop: true transparent alpha; no environment, ground plane, or detached cast shadow.
Subject: the same single turquoise faceted orb held in a bronze U-shaped cradle and ring mechanism above a compact gray-stone foundation. Keep its existing upright support, ring, one central orb, and three-quarter view.
Style/medium: hand-painted fantasy strategy-game sprite matching Image 1; top-down three-quarter perspective, soft upper-left light, clear value groups, crisp natural edges and moderate painted texture. Weathered charcoal-gray stone, dark desaturated iron, warm bronze, and translucent turquoise.
Composition/framing: one centered complete orb tower, full ring and base visible, square canvas with modest transparent padding and bottom-center ground anchor; readable around 100 gameplay pixels tall.
Lighting/mood: gentle upper-left highlights and natural facets on the orb. No emitted glow or combat effect.
Materials/textures: Tier II Reinforced craftsmanship: thicker ring and cradle braces, improved pivot and orb-retaining fittings, stronger compact stone footings, and restrained bronze reinforcement. Preserve the original single orb and recognizable U-cradle silhouette.
Constraints: cosmetic-only evolution; do not imply any change in attack, range, or electrical effect. Maintain true transparent alpha and natural edge colors. This is material and mechanical refinement, not a palette swap.
Avoid: extra orbs, duplicated rings, additional towers, lightning, energy arcs, projectiles, sparks, magic glow, detached shadow, text, UI, labels, badges, selection circles, atlas layout, photorealism, anime, pixel art, Warcraft/Blizzard-specific motifs, red/magenta fringe or outline.
```

Full production sidecar: [towers/tempest-tier2-v1.provenance.json](../artifacts/campaign-production-completion-20261010/towers/tempest-tier2-v1.provenance.json).

### tower:tempest:tier3

Manifest path: /assets/campaign/towers/tempest-tier3-v1.png; delivered SHA-256 b84478b91cabab8fc5002904fe390f34ed90737847872b941c3efc5034476870.
Final image_gen source: C:/Users/ljour/.codex/generated_images/01a1243f-818f-7311-b43c-5af7db7c5377/exec-44f02669-e761-4593-83e9-92bd650de6ba.png; SHA-256 dd321f104bf68e43627e923c3fe7bd08b4e945990acedc64f0c3a781279f9f5e.
Preserved original copy: artifacts/campaign-production-completion-20261010/towers/tempest-tier3-v1-repair-01-final-original.png.
Processing: Copied the full-resolution image_gen original unchanged. Resized to 192x192 with installed sharp (Lanczos3), preserving alpha; staged identical candidate bytes at the exact manifest path. No paint, mask, recolor, or crop operation. Preserved the prior 192x192 candidate and provenance backup, then replaced the owned candidate/public copy with a 192x192 resize of the repaired image_gen original.

#### Image-generation call 1: initial generation

Generated source: C:/Users/ljour/.codex/generated_images/01a1243f-818f-7311-b43c-5af7db7c5377/exec-7a77a9f7-664d-46f5-9813-2a037aee8e76.png; SHA-256 6b664d24b93e4fc387103f138015b78905f9b0df03bad2c93f94144c0c669f3e.
Reference chain:
- artifacts/campaign-production-completion-20261010/towers/tempest-tier2-v1.png · SHA-256 f4744b2a8704464677c4860c78092de27ac4947783e6969ef234f3dd11eb95d4 — Tier II Reinforced Tempest continuity reference
- public/assets/towers/tower_tempest_stages-v1.png · SHA-256 62eae86a7cacea9a8bfe9c69c0230818e26a2dd06805cd88ceae2226d2677f0a — accepted Tier I Tempest tower atlas; use the top-left first-stage cell only

Exact prompt:
```
Use case: stylized-concept
Asset type: one transparent 192×192 campaign tower sprite for Aetherhold Defense
Primary request: Create the Tier III Runic Masterwork Tempest tower as a cosmetic evolution of Image 1. Use Image 2 only to confirm the accepted Tempest identity. Output one complete tower only, never an atlas.
Input images: Image 1 is the Tier II Reinforced Tempest candidate and direct continuity reference. Image 2 is the accepted four-stage Tempest tower atlas; its top-left cell is the original Stage I design. Ignore the other cells and sheet layout.
Scene/backdrop: true transparent alpha; no environment, ground plane, or detached shadow.
Subject: the same single faceted turquoise orb held in a bronze U-shaped cradle and circular retaining ring above a compact dark-stone base. Preserve the original orb, cradle silhouette, front view angle, proportions, and one-tile ground footprint.
Style/medium: polished hand-painted fantasy strategy-game art matching both references; top-down three-quarter view, upper-left global light, clear value groups, moderate surface texture, crisp natural edges. Weathered charcoal stone, aged bronze, desaturated iron, and one turquoise crystal core.
Composition/framing: one centered complete tower, complete cradle and base visible; keep the size, framing, and bottom-center ground anchor aligned closely with Image 1. Square canvas with modest transparent padding; readable around 100 gameplay pixels tall.
Lighting/mood: natural highlights on the orb and metal only; no emitted light, bloom, particles, or electrical effect.
Materials/textures: refine the Tier II ring mechanism and braces into a prestigious masterwork with more precise bronze geometry, clean structural joints, and refined compact stonework. Preserve the single existing orb as the stronger focal core by sharpening its facet design and improving its existing retaining bands; do not enlarge it or add any new orb. Add only three small etched pale-teal/silver Aether marks on existing bronze or stone surfaces, restrained and non-glowing.
Constraints: Tier III should look more precise than Tier II but unmistakably the same Tempest tower, with cosmetic-only changes. Keep genuine transparent alpha, natural edge colors, and the stable ground anchor.
Avoid: multiple orbs, floating crystals, duplicate rings or stands, lightning, sparks, projectiles, magical beams, bright runes, glow, repeated symbol bands, text, UI, badges, selection rings, detached shadows, backgrounds, atlas layout, photorealism, anime, pixel art, thick outlines, Warcraft/Blizzard motifs, red/magenta fringe.
```

#### Image-generation call 2: targeted visual repair 1 (align Tier III stone-base ground anchor)

Generated source: C:/Users/ljour/.codex/generated_images/01a1243f-818f-7311-b43c-5af7db7c5377/exec-44f02669-e761-4593-83e9-92bd650de6ba.png; SHA-256 dd321f104bf68e43627e923c3fe7bd08b4e945990acedc64f0c3a781279f9f5e.
Reference chain:
- artifacts/campaign-production-completion-20261010/towers/tempest-tier3-v1-generation-01-original.png · SHA-256 6b664d24b93e4fc387103f138015b78905f9b0df03bad2c93f94144c0c669f3e — original Tier III Tempest image edit target
- artifacts/campaign-production-completion-20261010/towers/tempest-tier2-v1.png · SHA-256 f4744b2a8704464677c4860c78092de27ac4947783e6969ef234f3dd11eb95d4 — Tier II Reinforced Tempest anchor alignment reference
- public/assets/towers/tower_tempest_stages-v1.png · SHA-256 62eae86a7cacea9a8bfe9c69c0230818e26a2dd06805cd88ceae2226d2677f0a — accepted Tier I Tempest tower atlas

Exact prompt:
```
Use case: precise-object-edit
Asset type: one transparent 192×192 Tier III Runic Masterwork Tempest tower sprite
Primary request: Correct the ground alignment in Image 1. The Tier III tower leaves too much transparent padding below the foundation compared with Tier II. Preserve Image 1's existing orb, cradle, runes, materials, perspective, camera, and full silhouette, but extend the lowest visible stone base downward so its bottom-center ground contact matches Image 2 in the 192×192 delivery frame. The target is about 10 pixels lower at delivery size. Keep the topmost finials at their current height; do not scale the full tower.
Input images: Image 1 is the original Tier III Tempest edit target. Image 2 is the Tier II Reinforced Tempest delivery-size alignment reference. Image 3 is the accepted Stage I Tempest atlas used to preserve tower identity.
Scene/backdrop: genuine transparent alpha; no environment, floor, or detached cast shadow.
Subject: the same one turquoise orb in the bronze ring and U-shaped support above the compact dark-stone base.
Style/medium: hand-painted fantasy strategy-game art, upper-left lighting, weathered stone, warm bronze, dark iron and restrained turquoise facets.
Composition/framing: keep the existing crystal, cradle, width, camera and top position. Extend only the bottom-most stone footing downward about 10 pixels in the 192×192 delivery frame so the tower shares Tier II's bottom-center ground line; keep the full asset inside the square.
Constraints: preserve the single-orb Tempest identity, refined ring geometry, three subtle Aether marks, materials and transparent alpha. This is a base-anchor alignment repair only.
Avoid: shrinking or moving the entire tower, moving the orb or upper cradle, widening the footprint, adding blocks or crystals, changing rune design, glow, electrical effects, red/magenta fringe, background, shadows, text or UI.
```

Full production sidecar: [towers/tempest-tier3-v1.provenance.json](../artifacts/campaign-production-completion-20261010/towers/tempest-tier3-v1.provenance.json).
