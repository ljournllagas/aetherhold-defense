# Project Structure

```text
docs/                 Product, gameplay, design, art, and agent contracts
  sdd/                Spec-driven development specs/ and plans/ (task blocks, verify commands)
references/           Visual reference guide and approved screenshots
src/
  main.ts             Phaser bootstrap and ten-scene registration
  game/
    scenes/           Boot, preload, menu, campaign, difficulty, settings, gameplay, game-over, leaderboard, progression
    campaign/         100-level catalog, routes, combat profiles, local/cloud saves and art manifest
    systems/          Shared wave, combat, economy, scoring, power-up, settings, sound, evolution, unlock and siege logic
    config/           Classic tower, enemy, wave, difficulty, economy, score, power-up and evolution data
    entities/         Tower and enemy entities
    maps/             Map layout and game dimensions
    art/              Phaser drawing and texture-generation helpers, including procedural campaign fallback art
    ui/               Shared tokens/layout, scroll sheets and ViewportMask.ts for Campaign, Game and Leaderboard clipping
  api/                Leaderboard and score client
  shared/             Shared types, validation, version values, progression contract and result progress rules
worker/               Cloudflare Worker API
migrations/           D1 SQL migrations (0004 adds progression result columns)
tests/                Vitest game and Worker tests, including campaign-v5 compatibility and save fixtures
  helpers/            Evolution and result fixtures, balance trace reporter and headless simulation bot
public/assets/        Classic art, original campaign art, final World 4–10 v2 assets, and retained v1 rollback files
dist/                 Vite build output served by Wrangler
artifacts/            Verification evidence (including campaign-production-completion-20261010/) and promo/
agent_docs/           Durable agent context and deployment handoff
```

`src/game/art/` holds drawing and texture-generation helpers; runtime art is loaded from `public/assets/`. `docs/REFERENCE_AUDIT.md` is an older audit and contains stale inventory recommendations. Follow the current contracts in `SPEC.md`, `DESIGN_SYSTEM.md`, `ART_BIBLE.md`, and `AI_AGENT_INSTRUCTIONS.md`; use `references/VISUAL_REFERENCE_GUIDE.md` to interpret screenshots.

`docs/CAMPAIGN_WORLDS_1_3.md` preserves the original foundation contract; `docs/CAMPAIGN_WORLDS_4_10.md` records v5 requirements, verified runtime behavior, duration profile, review limits, and production evidence. The 100-level registry and routes are in `src/game/campaign/expansionContent.ts` and `expansionRoutes.ts`; campaign-v5 compatibility and save fixtures are under `tests/fixtures/campaign-v5/`. `docs/CAMPAIGN_PRODUCTION_ASSETS.md` tracks 120 active final assets (43 original and 77 accepted World 4–10 v2 assets), plus the 77 hash-pinned v1 rollback files.

## Progression and evolutions files (2026-10-08)

- `src/shared/progression.ts` — branch, rank and progression contract types.
- `src/shared/resultProgress.ts` — terminal-result validity rules for progress fields.
- `src/game/config/evolutions.ts` — evolution roster, starter/alternative branches, factors, rules.
- `src/game/systems/EvolutionSystem.ts` — purchases, investment, refund, mastery.
- `src/game/systems/EvolutionCombat.ts` — shot snapshots, armor, statuses, fields, Volley, chains.
- `src/game/systems/UnlockSystem.ts` — branch achievements and the local unlock repository (`aetherhold-unlocks-v1`).
- `src/game/systems/SiegeSystem.ts` — siege lifecycle, victory decision, relic exits.
- `src/game/ui/progressionView.ts` — pure presentation models and stat formatting.
- `src/game/scenes/ProgressionScene.ts` — menu Progression panel.
- `migrations/0004_progression_results.sql` — additive progress columns for score era 2.
- `artifacts/progression/` — `verification.md`, rendered QA (`ui/`), balance simulations and branch comparison (`balance/`; runners need `BALANCE_SIM=1`).

Full file list (created and modified): `agent_docs/progression_implementation_2026-10-08.md`.
