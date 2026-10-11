# Road clearance and complete monster artwork

Date: 2026-10-11. Tier: Spec-only. Status: approved and implemented; release verification is recorded in `docs/ROAD_CLEARANCE_AND_MONSTER_ART.md`.

## Agreed outcome

Classic and Campaign Worlds 1–3 (all 30 levels) must offer build plots visibly close to the road, with useful road coverage for every base tower. Complete the intended monster visuals in both modes, including movement animations and bosses. Follow the existing Art Bible and campaign production contracts.

## Approaches and decision

Recommended: share a world-space clearance contract, relocate existing plots deterministically, and finish the existing atlas pipeline. This fixes placement without changing combat ranges and uses the authored monster identities and animation states.

Alternative: increase tower ranges. This leaves the visual distance complaint unresolved and changes balance.

Alternative: redraw all maps and replace the monster renderer. This adds unnecessary asset and integration work; retain accepted terrain plates and renderer interfaces instead. Small clearing touch-ups on Classic are allowed where relocation otherwise puts a plot on painted obstacles.

## Placement contract

- Clearance means the shortest distance from the visible 22-unit plot circle perimeter to the visible road edge, including its shoulder. Target 10 world units; accepted band 6–14. Stroke thickness must be included in clearance checks. Use one shared policy in Classic and Campaign, independent of camera scale.
- Campaign's current outer road band is 50 units wide. Account for its radius and round corners when measuring clearance. Classic's road is painted: record a world-space road-edge envelope traced from the accepted map, including varying width and curves; do not assume its width equals Campaign's.
- Every plot must cover at least 100 continuous world units of the enemy route with each unupgraded base tower's actual attack range. Compute segment/circle intersections and merge contiguous route-distance intervals; merely touching the route fails. The current shortest base range is 130 units; derive range checks from tower configuration rather than duplicating it.
- Relocate the existing plot candidates to satisfy both clearance and coverage. Preserve each map's current plot count and stable index order. Candidate selection must be deterministic. Keep all circles within the battlefield, separated by at least 52 units center-to-center, and clear of painted obstacles, the keep and spawn/gate passage. If no valid layout exists, revise the authored candidate positions; do not silently drop plots or relax acceptance.
- Keep the enemy route, spawn, gate, combat stats, costs, waves and progression unchanged. A relocated plot's marker, hit target, tower position, preview and range ring must use the same resolved coordinates.
- Repaint/overlay a small clearing if necessary for Classic visual coherence; do not draw a new road over its accepted painted road. Check final placement against actual terrain in both modes.

## Monster artwork contract

Campaign production is incomplete: all 15 normal enemies and three bosses in `src/game/campaign/artManifest.ts` have absent, `final_required` atlases. Supply each exact manifest path with its declared dimensions, cell sizes, rows and frame counts. The manifest is the authoritative inventory: Marchling, Skitter, Stoneback, Ironhide, Veilborn; Cinderling, Ashrunner, Magmahide, Ember Brute, Ashcaller; Snowstalker, Icebound, Frostback, Glacier Knight, Frost Shaman; Hollow Warden, Cinder Colossus, Frostbound Matriarch.

- Use `docs/ART_BIBLE.md`, campaign enemy profiles in `campaignArt.ts`, and `docs/CAMPAIGN_PRODUCTION_ASSETS.md` for intended identity and role. Create missing original painted assets consistent with these references; concept-board crops and static procedural drawings do not count as completed production sprites.
- Each required frame must contain a distinct, valid pose where the animation calls for motion; repeating a static frame to fill an atlas fails. Transparent PNGs must have clean edges, no baked UI, no oversized baked shadows, consistent feet anchors and readable silhouettes at gameplay size. Cell contents must not clip or bleed into adjacent cells. Unused cells remain transparent.
- Support idle, walk, attack and death for every Campaign enemy. Ashcaller and Frost Shaman also require buff. Bosses require exactly the additional states declared in the manifest: Hollow Warden special; Cinder Colossus armor_break and exposed_core; Frostbound Matriarch freeze_cast and phase_two. Playback follows existing gameplay cues and action priorities; art does not introduce attacks or abilities absent from gameplay.
- Preserve existing facing, pause/resume, speed, one-shot priority, death completion and boss overlay behavior. Confirm phase poses and overlays remain readable with new art. Correct integration defects within these contracts when found.
- Classic's nine archetypes already have painted directional movement atlases in `enemyAtlasFrames.json`. Inspect every archetype, including its boss, in both directions and moving/stopped states. Repair missing, clipped, wrongly mapped or unanimated intended art if found. Retain accepted Classic identities and its existing animation-state contract; no new Classic attack/death atlas inventory is required.
- Include all gameplay appearances, previews and boss summons. Promote Campaign entries to `final`, set `temporary=null`, update the exact-path allowlist and clear only quality flags actually verified, after raw and runtime review passes. Preserve asset provenance (source, prompts/references if generated, transformations and hashes) in campaign provenance documentation.
- Missing or malformed required art is a verification/release blocker, with asset ID and reason reported. Keep the existing diagnostic fallback for unexpected runtime load failures, but fallback cannot satisfy final-art acceptance. Do not claim complete visuals or deploy this change with known absent required art.

## Boundaries and execution

Implement a cohesive placement-policy module shared by `maps/map1.ts` and `campaign/maps.ts`; terrain/plot rendering consumes its resulting geometry. Keep range/coverage math independent of Phaser for unit verification. `GameScene.ts` remains the consumer of resolved plot positions.

Asset inventory, loader promotion and animation definitions belong to `campaign/artManifest.ts`; frame slicing and playback stay in `art/enemyArt.ts` and `art/campaignArt.ts`. Follow `art/assetManifest.ts` and existing preload callers for Classic. Produce and inspect source art first, validate packaging next, then integrate and verify actual playback. Placement work and art production may proceed independently; final runtime review covers both together. Execute directly from this spec after approval, without a separate plan.

## Acceptance and verification

1. Automated geometry checks cover Classic and all 30 Campaign levels: plot count/index stability, determinism, field bounds, spacing, road-edge clearance and continuous coverage with every base tower. Include corners, endpoints and narrow stretches. Existing map tests must pass with deliberately updated placement expectations where applicable.
2. Atlas checks cover every required Campaign source and Classic frame: path existence, dimensions, valid frame rectangles, nonempty required frames, transparency, identity-to-texture mapping and complete manifest/allowlist agreement. Use image inspection for pose quality and anchors; metadata alone is insufficient.
3. Runtime visual evidence covers every Classic archetype, every Campaign normal enemy and boss, all additional Campaign animation states and summoned Marchlings. Confirm loader uses final textures, not procedural fallbacks; verify both directions, moving/stopped states, pause/resume, speed changes, restart, one-shot completion and boss phase transitions. Existing enemy-animation and loader tests remain required.
4. Inspect every map layout at desktop 1280×720 and touch-sized 390×844 with overview/zoom. Verify circles and built towers align with terrain, plots remain selectable, road coverage is visible, sprites are anchored and health bars/effects remain readable. Browser touch emulation suffices; label it accurately and do not claim physical-device verification.
5. Run the full test suite and build before publishing. Fix failures or report concrete blockers. `npm run deploy` must pass its tests/build before publishing, as authorized by AGENTS.md. Verify live HTML, current JavaScript bundle against built output, required artwork delivery and `/api/health`; report the live URL and failures.
6. Commit and push only task changes, including this spec and documentation, to the current remote branch. Preserve unrelated work; verify local HEAD equals the remote branch. Documentation-only spec publication does not require an application deployment.

## Scope limits

No tower stat rebalance, new monsters, additional Campaign worlds, new abilities, UI redesign or terrain replacement. Existing gameplay bugs unrelated to placement or artwork integration are outside this change. Final spec approval remains required before application implementation.
