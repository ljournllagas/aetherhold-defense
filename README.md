# Aegis of the Borderkeep

An original browser fantasy tower-defense game built with Phaser, TypeScript and
Vite. The Aetherhold Defense campaign spans 100 levels across ten worlds.
Cloudflare Workers and D1 serve health, account sync, and separate Classic
Siege and Campaign leaderboard APIs.

## Modes

- **Classic Siege** — the existing 30-wave siege, with its score, best-run,
  achievement and leaderboard systems.
- **Campaign** — 100 levels across ten worlds, from The Borderkeep to Crown of
  Aetherhold. Progress, mastery stars, World Sigils and pre-battle sidegrades
  stay separate from Classic results. Guests save in this browser; Google
  accounts can sync progress and publish Campaign rankings.

## Run locally

```sh
npm install
npm run dev
```

Useful checks are `npm run typecheck`, `npm test` and `npm run build`.

## Project guides

- [Product and gameplay contract](docs/SPEC.md)
- [Visual rules](docs/DESIGN_SYSTEM.md)
- [Campaign Worlds 1–3](docs/CAMPAIGN_WORLDS_1_3.md)
- [Campaign Worlds 4–10](docs/CAMPAIGN_WORLDS_4_10.md)
- [Campaign production assets and art verification](docs/CAMPAIGN_PRODUCTION_ASSETS.md)
- [Art production rules](docs/ART_BIBLE.md)
- [Agent implementation instructions](docs/AI_AGENT_INSTRUCTIONS.md)
- [Current verification and deployment handoff](agent_docs/project_progress.md)
