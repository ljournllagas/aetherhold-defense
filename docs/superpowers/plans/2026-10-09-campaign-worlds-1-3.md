# Campaign Worlds 1–3 Implementation Plan

**Goal:** Implement the supplied campaign expansion for Levels 1–30 using existing combat, with persistent mastery and independent verification.

**Authority:** Existing `docs/SPEC.md`, `DESIGN_SYSTEM.md`, `ART_BIBLE.md`, `AI_AGENT_INSTRUCTIONS.md`; expansion pack `docs/CAMPAIGN_SPEC_W1_W3.md`, `WORLD_DESIGN_BIBLE_W1_W3.md`, `PROGRESSION_SYSTEM_W1_W3.md`, sprite guide and config schema. Written rules outrank concept images. No Worlds 4–10.

**Architecture:** A typed campaign configuration and browser-local repository feed a campaign selection/preparation scene. The existing GameScene consumes a campaign run snapshot, configurable map/waves, and campaign boss/support behavior. Classic siege scoring, validation, audio, relic effects, assets and Cloudflare bindings remain compatible. Campaign results use local campaign progression and do not enter the classic siege leaderboard.

## Packages and contracts

- [x] P1: `src/game/campaign/{types,config,progress,specializations}.ts`, corresponding config/progress/specialization tests. Own the 30 authored level definitions, stable feature/Sigil IDs, monotone separate star flags, versioned save/load and protected malformed/future data. Expose `CAMPAIGN_LEVELS`, `CAMPAIGN_WORLDS`, `getCampaignLevel`, `CampaignRepository.view`, `recordClear`, `reconcile`, `setSpecialization`, `setPreparationTargeting`, `savePreparationPreset`, `loadPreparationPreset`, and singleton `campaignRepository`.
- [x] P2: campaign selection/preparation/Codex/result UI, main-menu entry and scene registration; illustrated connected realm nodes, level details, enemy/boss preview, star/Sigil displays, presets and specialization selectors using house controls, fonts and tokens. Snapshot preparation at battle entry. Implement desktop and scrollable compact layouts with 44px controls.
- [x] P3: new campaign battle/maps/asset modules and targeted shared-engine adapters. Own campaign wave profiles, twelve canonical map families with authored level variants, support enemies and boss mechanics, campaign tower appearance, actual specialization combat effects, gated campaign Power-Up pool and one non-identical reward reroll per level at 45 stars. Reuse fixed-step simulation, existing projectile/effect snapshots, pause/speed/restart cleanup and scoring. Preserve classic behavior with regression checks.
- [x] V1: independent progression/save verification, including every unlock transition, replay star union, Level 10→11 and 20→21, Level30 completion, milestones and specialization threshold. Test storage denial, corrupt/future versions and reload.
- [x] V2: independent combat/restart and screenshot QA across three worlds, normal/boss detail, all bosses and rewards. Cover responsive UI at 1440×900, 1280×720, 1024×768, 844×390, 390×844 and 360×640, including rotation and actionable controls.
- [ ] Release: Executor runs final typecheck/full tests/build, then authorized `npm run deploy`; verify live HTML/current JavaScript and `/api/health`, native campaign entry and classic smoke, commit only task-owned changes and push current branch. Verify local/remote HEAD equality. Archivist closes verified documentation and token report.

## Acceptance gates

No passing claim without fresh evidence. Progression requires real success settlement only: defeat, discard, restart, locked-level requests, duplicate completion callbacks and QA grants cannot manufacture progress. Stars survive replays with worse scores/lives. Save failures retain truthful session-only state and never overwrite protected bytes. Campaign battles must fully resolve spawns/enemies/projectiles/fields before completion and reset transient boss/freeze/reroll state on restart. Boss mechanics advance on game time and freeze effects expire.

Final-art approval requires the sprite production checks at gameplay scales, clean transparency, stable anchors, proper animation, world materials and silhouette readability. Supplied concept boards and starter sheets cannot establish approval. Missing final assets require an exact production list and UNVERIFIED final-art status.

## Open verification limits

Starter mastery targets are explicitly initial playtest values. Human balance, physical device touch and physical audio require separate evidence; no implied passing claim. Asset quality and responsive functionality receive separate verdicts.
