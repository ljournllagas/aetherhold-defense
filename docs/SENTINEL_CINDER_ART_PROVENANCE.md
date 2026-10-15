# Sentinel and Cinder production art

Generated on 2026-10-15 with the built-in `image_gen` tool and true transparent-background requests. These original designs replace the two reused Ranger/Bombard foundation sheets and add both campaign cosmetic tiers. Tower balance and evolution crests are unchanged.

Sentinel is a solid stone precision arbalest with a long iron execution rail; Cinder is an open ember brazier with reinforced vents and flues. Both use the Art Bible's hand-painted strategy style, three-quarter overhead camera and upper-left light. Level progression changes construction and silhouette rather than just color.

## Sources and prompts

All twelve accepted, unmodified full-size generated PNGs are retained in `output/tower-art/sources/`. Exact generation prompts and reference paths are in `output/tower-art/generation-prompts.json`. The first Sentinel candidate was rejected because its timber watchtower too closely resembled Ranger; the accepted replacement uses a solid octagonal stone pillar. Existing Ranger and Bombard sources were used only for camera and material style. Each subsequent family asset references its accepted level-one sprite.

`tools/pack-additional-tower-art.py` crops, downsamples and packs the accepted artwork. Generated originals contain near-invisible alpha values of 1 at isolated canvas edges. Cropping uses alpha > 8/255 to identify the actual contour, then preserves every alpha value inside that crop; no global alpha threshold or repaint is applied. The script asserts that visible source contours have clear margins and genuine transparency.

## Runtime files and geometry

Foundation sheets are `public/assets/towers/tower_sentinel_stages-v1.{png,webp}` and `tower_cinder_stages-v1.{png,webp}`: 1254×1254, four 627×627 cells ordered left-to-right then top-to-bottom. Campaign sources are `public/assets/campaign/towers/{sentinel,cinder}-tier{2,3}-v1.{png,webp}`: 192×192. Runtime loads WebP; PNGs preserve packaged sources.

The measured bounds, horizontal ground centers, ground insets and normalized weapon origins are in `output/tower-art/geometry.json`; the same data is generated into `src/game/art/additionalTowerGeometry.ts`. Sentinel uses 112px visible height and Cinder 84px. Their foundation front edges sit 16px/18px in front of the ground anchor. Campaign centers are measured separately in 192px source space. Sentinel weapon origins follow the rail tips; Cinder origins lie inside the ember basin. Legacy tower transforms and source files retain their previous values.

`output/tower-art/native-size-review.png` shows all foundation levels and campaign tiers at their intended visible heights. Tray portraits crop the final foundation frame under each tower's own key. Gameplay placement previews, placed towers, upgrades, evolution crests and result miniatures use the shared renderer; campaign preload requests the chosen cosmetic tier for all seven families.

## Verification scope

Change-specific checks cover dedicated asset paths and files, all seven families' ground contact, Sentinel tip/Cinder basin weapon origins, final-frame portrait crops, campaign manifest additions, unchanged historical hashes and battlefield viewport bounds. Required release gates are `npm test`, `npm run typecheck`, `npm run build`, independent native/browser review, followed by the authorized production deployment and live page/bundle/health checks.

The local ignored `artifacts/campaign-final-art-20261012/preflight/manifest-snapshot.test.ts` also needed its current total updated from 120 to 124 with an explicit four-path addition assertion; its historical snapshots were unchanged. The maintained equivalent is `tests/verification-v5-registry-geometry.test.ts`, which retains all 43 historical hashes and 77 promotion contracts and checks the four additions separately. Eleven existing opt-in tests in `artifacts/audit-fixes/balance/{candidates,report}.test.ts` and `artifacts/progression/balance/{run-simulations,branch-comparison}.test.ts` remain gated by `BALANCE_TUNE`/`BALANCE_SIM`: they search tuning candidates or overwrite historical reports and are outside this art-only release.
