# Project Overview

Aegis of the Borderkeep is an original browser fantasy tower-defense game inspired by classic RTS custom maps. Its intended loop covers difficulty selection, tower placement and upgrades, escalating waves, Power-Ups, scoring, and leaderboard replay. The product specification is authoritative for gameplay and originality requirements.

The client is a Phaser 4.2.1 and TypeScript game built with Vite. A Cloudflare Worker and D1 database provide health and leaderboard APIs. The implementation is organized into Phaser scenes, focused game systems, centralized configuration, and separate API/shared modules.

Use these documents as the project contract:

- `docs/SPEC.md` defines product behavior and gameplay.
- `docs/DESIGN_SYSTEM.md` defines interface rules and visual tokens.
- `docs/ART_BIBLE.md` defines game-art production rules.
- `docs/AI_AGENT_INSTRUCTIONS.md` defines implementation and validation procedure.
- `references/VISUAL_REFERENCE_GUIDE.md` explains how to use screenshots; screenshots do not override the text specifications.

Consult `agent_docs/project_progress.md` for current deployment and verification state. Source files, tests, or build output alone do not establish that runtime or visual behavior was verified.
