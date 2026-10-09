# Project Core Technology

- **Client:** Phaser `4.2.1`, TypeScript, and Vite. `src/main.ts` creates the Phaser game and registers eight scenes. The scene size comes from `src/game/maps/map1.ts`.
- **Backend:** Cloudflare Worker in `worker/index.ts`, with a D1 binding named `DB`. The client API module is `src/api/leaderboardClient.ts`; shared types and score validation live in `src/shared/`.
- **Local development:** `npm run dev` starts Vite; `/api` requests proxy to `http://localhost:8787`.
- **Build and checks:** `npm run build` runs `tsc -b` then `vite build`; `npm test` runs Vitest. These commands are available, but their presence does not indicate a passing run.
- **Deployment:** `wrangler.toml` points to `worker/index.ts`, serves static assets from generated `dist/`, and configures D1 migrations from `migrations/`.

Keep gameplay rules and balancing values in `src/game/systems/` and `src/game/config/`. Keep cloud and database access in the API/Worker boundary, outside Phaser gameplay systems, as required by `docs/SPEC.md` and `docs/AI_AGENT_INSTRUCTIONS.md`.
