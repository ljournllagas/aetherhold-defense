# Project Overview

Aegis of the Borderkeep is an original browser fantasy tower-defense game inspired by classic RTS custom maps. It has Classic Siege and a separate local Campaign covering Worlds 1–3 / Levels 1–30. Both reuse the same fixed-step combat engine; campaign scores and progression stay outside Classic bests, achievements, submissions, and leaderboard records. The product specification is authoritative for gameplay and originality requirements.

The client is a Phaser 4.2.1 and TypeScript game built with Vite. A Cloudflare Worker and D1 database provide health and leaderboard APIs. The implementation is organized into Phaser scenes, focused game systems, centralized configuration, and separate API/shared modules.

Use these documents as the project contract:

- `docs/SPEC.md` defines product behavior and gameplay.
- `docs/DESIGN_SYSTEM.md` defines interface rules and visual tokens.
- `docs/ART_BIBLE.md` defines game-art production rules.
- `docs/AI_AGENT_INSTRUCTIONS.md` defines implementation and validation procedure.
- `docs/CAMPAIGN_WORLDS_1_3.md` records the campaign contract and implementation ownership.
- `docs/CAMPAIGN_PRODUCTION_ASSETS.md` lists all campaign raster production targets and their loading gates.
- `docs/CAMPAIGN_WORLD_MAP_ART_PROVENANCE.md` records the accepted realm-panel prompts, references and fingerprints.
- `references/VISUAL_REFERENCE_GUIDE.md` explains how to use screenshots; screenshots do not override the text specifications.

Consult `agent_docs/project_progress.md` for current deployment and verification state. Source files, tests, or build output alone do not establish that runtime or visual behavior was verified.
