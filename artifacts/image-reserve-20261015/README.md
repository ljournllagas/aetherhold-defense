# Image reserve — 44 reviewed source masters

This package contains 44 reviewed source masters generated with built-in image_gen, four retained portrait drafts, twelve reference snapshots, saved generation prompts and an integration prompt for every selected image. It is separate from production assets. Source review does not establish runtime acceptance; follow the use-case checks below.

## Authorized scope
14 existing Classic evolution designs; 10 world sigils; 10 existing boss portraits; 1 campaign finale; 2 Last Lantern map plates; 7 Amber Hourglass expansion designs. Amber Hourglass is new content, not a shipped campaign world.

## Compatibility contracts
- Evolution IDs and tower mappings come from src/game/config/evolutions.ts. Each new master is a SINGLE static appearance, never an animation sheet or a replacement for the existing four foundation frames.
- Current foundation sheets use 627px cells. Do not resize a new image into that contract blindly. Measure its occupied alpha bounds, ground center and muzzle, then adapt src/game/art/towerArt.ts while retaining contactShadow, rank crests, selection/hit areas and existing campaign visual tiers.
- Portraits and sigils are standalone UI art. Keep readable labels as runtime text and keep touch targets independent of image bounds.
- Campaign terrain plates are 1672x940 with runtime geometry overlays. Classic map art has its own map1.ts geometry. Map recolors must preserve the exact current roads, build plots, gate and framing; a concept plate is not proof of geometric compatibility.
- Existing enemies use 128px atlas cells (idle/walk/attack/death, support buff where required); bosses use 256px cells and manifest-defined states. New expansion designs are single-pose concept masters, NOT compatible animation atlases. Author and inspect the required animation frames before gameplay integration.
- Save high resolution lossless masters. Derive WebP delivery files only during integration. Inspect actual alpha, dimensions, edge clipping and scaled readability, not filename or generation claims.
- Preserve all unrelated working-tree changes. No balance, saves, scoring, unlocks, routes or authentication changes are authorized by this asset package.

## Generic integration prompt
Read this package manifest and the selected asset's prompt and inspection record. Inspect the actual image and current repository implementation before editing. Integrate ONLY the selected use case, preserve unrelated work, and reuse existing loaders/renderers. Treat all unverified assets as candidates. Measure dimensions, alpha bounds, grounding and small-screen readability. Do not infer sprite frames or invent gameplay rules from artwork. Keep runtime text separate. Add change-specific verification covering loading, display, lifecycle and relevant desktop/mobile states. Run project tests/build; use npm run deploy only after those pass, verify live HTML/current bundle and /api/health, then commit/push only the bounded verified change and verify remote HEAD, per AGENTS.md. Report limits honestly.

## Use-case prompts
- Evolution: Integrate [evolution ID] as a static cosmetic branch appearance using its manifest tower ID. Inspect decorateEvolution and foundation/campaign art precedence. Keep all four evolution ranks, muzzle origin, contact shadow, UI portraits and gameplay stats correct. Verify both branches and campaign tiers before deployment.
- Sigil: Integrate [world ID] trophy into the existing earned/locked sigil presentation; retain accessible text, unlock conditions and readable contrast. Do not rasterize controls or alter progress.
- Boss portrait: Add [boss ID] portrait to existing Codex/preview presentation; preserve the gameplay atlas and animations. Load only when needed; verify cropping and phone layouts.
- Finale: Show the finale illustration only at the existing final campaign completion presentation. Keep score settlement, reward decisions, replay and dismissal controls intact; fit landscape art safely on phones.
- Last Lantern: Use the selected night/dawn master as a visual variant of Classic. Compare it against the original map and exact map1.ts roads, plots and gate. Reject or repair spatial drift before replacing any texture. Change no route/hit geometry to fit the painting.
- Amber Hourglass: Treat the seven files as preproduction art. First propose a bounded content design; do not append world IDs, enemies, towers or saves without an agreed design. Generate required animation/state assets and verify their contracts before runtime integration.

## Resume
Inspect manifest.json, then the filesystem and generation logs. Resume pending items in the authorized order; never mark an asset complete from a prompt alone. Keep one built-in image generation call per distinct asset. Record original tool output paths and final project paths.

## Give this package to another model
Open index.html for the image gallery. Choose a card, provide its master image and matching integration-prompts/*.md file together with repository access, and ask the model to follow that prompt. The prompt is per asset, so it does not require implementing the entire reserve at once. README.md contains the shared generic prompt and compatibility rules.

references/ contains twelve immutable copies of the original art used for style, character identity and map geometry. references/index.json records their original paths and hashes. If moved to another computer, resolve generation-jobs.json reference paths through this index rather than assuming the old Windows paths exist.

Run `python verify_assets.py` from this folder (Python 3 and Pillow required) to decode every master and regenerate file-validation.json. It checks the full 44-asset coverage, companion prompts and cutout transparency, and retains edge warnings. Visual review and runtime acceptance remain separate requirements.
