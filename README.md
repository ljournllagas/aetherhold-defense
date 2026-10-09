# Aegis of the Borderkeep

An original browser fantasy tower-defense game built with Phaser, TypeScript and
Vite. This release adds the Aetherhold Defense campaign foundation. Cloudflare
Workers and D1 serve the health and Classic Siege leaderboard APIs.

## Modes

- **Classic Siege** — the existing 30-wave siege, with its score, best-run,
  achievement and leaderboard systems.
- **Campaign** — 30 local levels across The Borderkeep, Emberfall Highlands and
  Frostveil Pass. Progress, stars, Sigils and pre-battle sidegrades are saved in
  the browser and stay separate from Classic results. Worlds 4–10 are not part
  of the current campaign.

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
- [Campaign production asset manifest and missing art](docs/CAMPAIGN_PRODUCTION_ASSETS.md)
- [Art production rules](docs/ART_BIBLE.md)
- [Agent implementation instructions](docs/AI_AGENT_INSTRUCTIONS.md)
- [Current verification and deployment handoff](agent_docs/project_progress.md)
