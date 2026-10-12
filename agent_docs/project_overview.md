# Project Overview

Aegis of the Borderkeep is an original browser fantasy tower-defense game inspired by classic RTS custom maps. It has Classic Siege and a separate Campaign that reuses the fixed-step combat engine while keeping results outside Classic bests, achievements, submissions, and leaderboard records. Campaign spans Levels 1–100 with version-1 local and account/cloud contracts. Paid Level 41–100 gameplay, native Level 99→100 progression, all-stage fixture rendering, map, compact HUD, candidate comparison, boss-warning gates, and R1 review passed. The v5 build is live at [aetherhold-defense.ljournllagas.workers.dev](https://aetherhold-defense.ljournllagas.workers.dev/); expansion art approvals remain unverified. See [SPEC.md](../docs/SPEC.md), [Campaign Worlds 1–3](../docs/CAMPAIGN_WORLDS_1_3.md), and [Campaign Worlds 4–10](../docs/CAMPAIGN_WORLDS_4_10.md) for runtime limits, review scope, and deployed evidence.

The client is a Phaser 4.2.1 and TypeScript game built with Vite. A Cloudflare Worker and D1 database provide health and leaderboard APIs. The implementation is organized into Phaser scenes, focused game systems, centralized configuration, and separate API/shared modules.

Use these documents as the project contract:

- `docs/SPEC.md` defines product behavior and gameplay.
- `docs/DESIGN_SYSTEM.md` defines interface rules and visual tokens.
- `docs/ART_BIBLE.md` defines game-art production rules.
- `docs/AI_AGENT_INSTRUCTIONS.md` defines implementation and validation procedure.
- `docs/CAMPAIGN_WORLDS_1_3.md` records the campaign contract and implementation ownership.
- `docs/CAMPAIGN_WORLDS_4_10.md` records v5 expansion requirements, verified integration decisions, and current acceptance gates.
- `docs/CAMPAIGN_PRODUCTION_ASSETS.md` lists all campaign raster production targets and their loading gates.
- `docs/CAMPAIGN_WORLD_MAP_ART_PROVENANCE.md` records the accepted realm-panel prompts, references and fingerprints.
- `docs/CAMPAIGN_PRODUCTION_ART_PROVENANCE.md` records terrain/tower prompts and provenance, manifest status, fallback behavior and the missing atlas handoff.
- `references/VISUAL_REFERENCE_GUIDE.md` explains how to use screenshots; screenshots do not override the text specifications.

Consult `agent_docs/project_progress.md` for current deployment and verification state. Source files, tests, or build output alone do not establish that runtime or visual behavior was verified.
