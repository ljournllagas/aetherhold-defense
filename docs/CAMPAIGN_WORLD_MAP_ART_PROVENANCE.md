# Campaign World-Map Art Provenance

This record covers the three accepted realm panels shipped in deployment
`campaign-worldmap-art-20261010`; their manifest entries remain `final` with
`temporary=null`. It preserves the panel-specific prompts and provenance from
that release. The current 43-target inventory is in
[`CAMPAIGN_PRODUCTION_ASSETS.md`](CAMPAIGN_PRODUCTION_ASSETS.md), and the later
terrain/tower prompts and exact atlas handoff are in
[`CAMPAIGN_PRODUCTION_ART_PROVENANCE.md`](CAMPAIGN_PRODUCTION_ART_PROVENANCE.md).
The deployment and verification handoff is canonical in
[`agent_docs/project_progress.md`](../agent_docs/project_progress.md).

## Generation, edits and packaging

The V2 panels were created with one built-in `image_gen.imagegen` style-transfer
edit per world, with `transparent_background: false`. Image 1 was the corresponding
V1 panel (`borderkeep-v1.png`, `emberfall-v1.png`, or `frostveil-v1.png`). Borderkeep
used `public/assets/world/maps/ancient-border-keep-map-v2.png` as Image 2 for style
and camera reference only. Emberfall and Frostveil used that map as Image 2 and
`artifacts/worldmap-art-20261010/borderkeep-v2.png` as Image 3, also for style and
camera reference only. The references did not supply feature or layout content.
Generated originals and packaged V2 candidates are preserved under
`artifacts/worldmap-art-20261010/`; generated originals are also under the Codex
generated-images directory below. The originals are 1672×941 px; packaging took a
centered 1664×936 crop (4 px from each side, 2 px from the top, 3 px from the
bottom), then a high-quality bicubic resize to 768×432 px.

| World | Generated original | Generated output | Public path and SHA-256 |
| --- | --- | --- | --- |
| Borderkeep | `borderkeep-v2-original-1672x941.png` | `exec-b30d237e-33a3-455b-806b-f48ec1584d91.png` | [`borderkeep-v1.png`](../public/assets/campaign/world-map/borderkeep-v1.png) · `3e992478ad4fa7bba9d6e913218d8fd188164ba56588d6bb21f248a29c4bc37c` |
| Emberfall | `emberfall-v2-original-1672x941.png` | `exec-29f70ef0-dedc-4683-a5c0-3a93d6675295.png` | [`emberfall-v1.png`](../public/assets/campaign/world-map/emberfall-v1.png) · `0405fba11386789870d4f29ac8065412ccee5c5cc55d29f46a3ee286b8d4b920` |
| Frostveil | `frostveil-v2-original-1672x941.png` | `exec-7a405f67-fdca-4c95-b447-78bf226707fc.png` | [`frostveil-v1.png`](../public/assets/campaign/world-map/frostveil-v1.png) · `ac56d70e228f1fc6302640f599482d8e9fa66b44351e3210f4012964a796f4fa` |

Generated output files were saved under
`C:\Users\ljour\.codex\generated_images\01a122e3-0c62-7821-923c-3459753fbe88\`.
The public PNGs are opaque 24-bit RGB files. Their SHA-256 values match the
campaign copies in `dist/assets/campaign/world-map/`.

## Independent acceptance and release

All three revised panels passed independent raw-art review. Independent browser
QA captured 29 screenshots across six viewports and passed campaign-only loading,
proportional map crops, 44 px route targets, selection and battle entry, warm
cache, reload and rotation, plus Retry/Back recovery without storage or API
writes. A fresh recheck passed all three worlds at both portrait sizes, desktop
and short landscape. The accepted panels shipped with Worker
`6382e8c5-060e-4ba5-a29a-d41441313ef0`; the release handoff records 907 passing
tests, 11 configured skips, typecheck/build, live asset parity, health and native
campaign/classic verification.

## Exact V2 edit prompts

### Borderkeep

```text
Use case: style-transfer
Asset type: revised candidate for a 16:9 campaign world-map region illustration.
Input images: Image 1 is the Borderkeep illustration to revise; preserve its Borderkeep forest, weathered stone ruins, river/waterfall accents and muted palette. Image 2 is a style and camera reference only for chunky readable overhead strategy-game terrain, tree and stone rendering; do not copy its road, keep placement, symbols, object layout or battle-map composition.
Primary request: Repaint Image 1 as original stylized hand-painted fantasy strategy region art, with a 35–50 degree downward orthographic/top-down three-quarter strategy view. Show the terrain as a broad ground plan from above, with layered ground forms rather than a cinematic vista. No horizon, sky, atmospheric vanishing point, panoramic distance, or photographic matte-painting treatment.
Scene/backdrop: Fortified forest wilderness with simplified broad tree canopies, mossy stone ruins, dark timber, a small old keep toward an upper outer edge, and a river with a modest waterfall confined toward an outer edge. Keep a few warm torch accents. The key green/stone/water identity must remain clear across the middle of the image, including the short-landscape center crop.
Style/medium: Cohesive classic fantasy strategy-game environment art; chunky simplified terrain planes and tree shapes, readable silhouettes, moderate painted surface texture, controlled detail, strong value groups, grounded and original. Use the reference image's overhead readability and painted material language without reproducing its specific features.
Composition/framing: 16:9 landscape, full frame filled by terrain, readable at small size and when the top/bottom are cropped. Keep a subdued, low-contrast open corridor across the lower center for route nodes and labels. Small landmarks belong near upper or outer areas. Do not make this an exact gameplay map or a continuous road layout.
Lighting/mood: Consistent global light from upper-left, shadows toward lower-right.
Color palette: Muted greens, warm-gray stone, dark timber and moss; subdued river blue-green; violet only as a very restrained distant accent.
Constraints: Original fantasy setting; opaque full-frame illustration; no text or border.
Avoid: Any text, logos, watermark, UI, route lines, roads, paths, arrows, nodes, circles, towers, enemies, characters, recognizable franchise motifs, horizon, sky, foggy vanishing point, photoreal textures, fine microdetail, tiny checker-like terrain, full isometric diamond grid, and high-contrast props in the lower central band.
```

### Emberfall

```text
Use case: style-transfer
Asset type: revised 16:9 campaign world-map region illustration for Emberfall Highlands.
Input images: Image 1 is the Emberfall candidate to revise; preserve its charcoal basalt, ash earth, charred pines and localized lava/ember accents. Image 2 is a style and camera reference only for the game's overhead strategy-map rendering; Image 3 is the approved Borderkeep art candidate and style reference only. Do not copy either reference's forest, river, keep, road, symbols, object layout or battle-map composition.
Primary request: Repaint Image 1 as original stylized hand-painted fantasy strategy region art with a 35–50 degree downward orthographic/top-down three-quarter strategy view. Show terrain as a broad ground plan from above, built from layered ground forms rather than a cinematic landscape. No horizon, sky, atmospheric vanishing point, panoramic distance, or photographic matte-painting treatment.
Scene/backdrop: Emberfall Highlands, a burned volcanic frontier. Make the terrain read as dark basalt and ash, with chunky charcoal ridges and a few simplified charred pine silhouettes. Place only small lava fissures and ember vents near outer areas. Keep the central/lower corridor broad, subdued, low contrast and clear for route nodes and labels. Key basalt/ash/charred-pine identity should remain visible through the middle and the short-landscape center crop.
Style/medium: Cohesive classic fantasy strategy-game environment art, consistent with Image 3's painted volumetric material treatment and Image 2's high-downward camera; chunky simplified terrain planes and tree shapes, readable silhouettes, moderate painted surface texture, controlled detail and strong value groups. Do not flatten it into vector shapes or add photoreal microdetail.
Composition/framing: Full-frame 16:9 ground-filled region illustration, legible when scaled down and with top/bottom cropped. Keep significant volcanic forms small or toward upper/outer areas; keep the center corridor quiet. This is biome art, not an exact gameplay map or continuous route layout.
Lighting/mood: Consistent global light from upper-left, shadows toward lower-right; tiny local ember light at sparse fissures only.
Color palette: Basalt charcoal, slate, ash earth, burnt brown and muted dry grass; localized warm ember-orange. Keep most terrain dark neutral gray-brown, never a field of orange or red.
Materials/textures: Painted weathered basalt, ash, charred pine and sparse fractured rock; moderate texture, no smoke wall.
Constraints: Original fantasy setting; opaque full-frame illustration; no text or border.
Avoid: Any text, logos, watermark, UI, routes, roads, paths, arrows, nodes, circles, towers, enemies, characters, recognizable franchise motifs, horizon, sky, distant atmospheric peaks, foggy vanishing point, photoreal textures, fine microdetail, tiny checker-like terrain, full isometric diamond grid, extensive lava rivers, and high-contrast props in the lower central band.
```

### Frostveil

```text
Use case: style-transfer
Asset type: revised 16:9 campaign world-map region illustration for Frostveil Pass.
Input images: Image 1 is the Frostveil candidate to revise; preserve its slate mountains, pale snow, frosted pines, frozen river and small monastery-ruin accents. Image 2 is a style and camera reference only for the game's overhead strategy-map rendering; Image 3 is the approved Borderkeep art candidate and style reference only. Do not copy either reference's forest, waterfall, keep, road, symbols, object layout or battle-map composition.
Primary request: Repaint Image 1 as original stylized hand-painted fantasy strategy region art with a 35–50 degree downward orthographic/top-down three-quarter strategy view. Show terrain as a broad ground plan from above, built from layered ground forms rather than a cinematic landscape. No horizon, sky, atmospheric vanishing point, panoramic distance, or photographic matte-painting treatment.
Scene/backdrop: Frostveil Pass, a snowbound mountain pass. Use chunky slate ridges and rock shelves, broad pale snow shapes and a few simplified frosted pine groups. Keep a frozen river confined to an outer edge, with a small monastery ruin and tiny warm torch accents near an upper or outer area. Keep the central/lower corridor broad, subdued, low contrast and clear for route nodes and labels. Key slate/snow/pine/ice identity should remain visible through the middle and the short-landscape center crop.
Style/medium: Cohesive classic fantasy strategy-game environment art, consistent with Image 3's painted volumetric material treatment and Image 2's high-downward camera; chunky simplified terrain planes, broad snow and tree shapes, readable silhouettes, moderate painted surface texture, controlled detail and strong value groups. Do not flatten it into vector shapes or add photoreal microdetail.
Composition/framing: Full-frame 16:9 ground-filled region illustration, legible when scaled down and with top/bottom cropped. Keep significant monastery and cliff landmarks modest and toward upper/outer areas; keep the center corridor quiet. This is biome art, not an exact gameplay map or continuous route layout.
Lighting/mood: Consistent global light from upper-left, shadows toward lower-right; a few warm torch points only.
Color palette: Slate gray, snow white, muted spruce green, pale ice blue and restrained steel blue. Keep the snow mostly neutral and avoid an all-cyan cast.
Materials/textures: Painted weathered slate, layered snow, frosted pine and pale ice; moderate texture and restrained frozen mist.
Constraints: Original fantasy setting; opaque full-frame illustration; no text or border.
Avoid: Any text, logos, watermark, UI, routes, roads, paths, arrows, nodes, circles, towers, enemies, characters, recognizable franchise motifs, horizon, sky, distant atmospheric peaks, foggy vanishing point, photoreal textures, fine microdetail, tiny checker-like terrain, full isometric diamond grid, bright cyan glow, and high-contrast props in the lower central band.
```
