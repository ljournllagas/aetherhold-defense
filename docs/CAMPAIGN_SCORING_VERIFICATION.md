# Campaign Scoring and Leaderboard — Release Verification

Date: 2026-10-14. Branch: `codex/campaign-v5-20261012`.
Live URL: https://aetherhold-defense.ljournllagas.workers.dev/
Worker Version ID: `3f366959-ce64-41cf-9ca3-c2f0d24fc478`.

## Release commits (all on current branch)

- `b8005fb` feat: add independent campaign score arithmetic (Task 1)
- `a100720` feat: preserve legacy campaign achievements alongside new bests (Task 2)
- `efe5adf` feat: settle validated campaign mission scores (Task 3)
- `3803bf1` test: cover cloud campaign score merging (Task 2 fix)
- `32f64a3` test: cover campaign boss count run identity (Task 3 fix)
- `2e38b73` feat: publish separate campaign progress leaderboard (Task 4)
- `aacc8e4` feat: explain campaign mission scoring and mastery goals (Task 5)
- `5406e91` feat: browse classic and campaign public rankings (Task 6)
- `e4602a2` feat: simplify guest entry and retry google sign-in (Task 7)

No D1 migration exists or was run for this release (`migrations/` untouched;
leaderboard aggregates acknowledged progress with SQL over existing tables).

## Automated gates (all green)

- Full suite `rtk npm test`: **125 files passed, 4 skipped; 1652 tests passed,
  11 skipped** (skips unchanged from baseline).
- `rtk npm run build` (`tsc -b && vite build`): pass; only the pre-existing
  Vite large-chunk advisory (~2.2 MB bundle).
- `rtk npm run typecheck`: pass. `rtk git diff --check`: pass.
- Focused gates: Task 5 UI (7 files/160), Task 6 boards (5 files/73 + 161
  adjacent), Task 7 auth/entry (5 files/54, extended 9 files/84).
- Real-D1 HTTP suites green: `campaign-leaderboard-worker`,
  `account-integration`, `guest-http-integration`, `account-deletion`,
  `guest-progress`, `worker`, `campaign-score-results`, `guest-run-settlement`.

## Local serving

- `rtk npm run dev -- --host 127.0.0.1 --port 5173`: `GET /` → 200
  (Aegis of the Borderkeep, `#game-root`, `/src/main.ts`); `GET /src/main.ts`
  → 200. Server stopped after the check.

## Production verification (fetched resources, read-only)

- `GET /` → 200, serves `/assets/index-Ce40le28.js` +
  `/assets/index-DbOMup-I.css` (byte-identical names to deploy output).
- `GET /assets/index-Ce40le28.js` → 200, 2,201,732 bytes; contains
  `api/campaign-leaderboard`, `COMBAT SCORE`, `Campaign rankings`,
  `account-separator`, `campaignScoreVersion` — page and bundle match the
  release, no stale-asset mismatch.
- `GET /api/health` → `{"ok":true,...,"scoreVersion":3}` (Classic era
  unchanged).
- `GET /api/campaign-leaderboard?limit=20` → 200,
  `campaignScoreVersion: 1, missionCount: 100, starCount: 300`, rows ordered
  11 missions/33 stars → 2/6 → 1/3 (missions, stars, score priority holds);
  rows expose only `playerId/nickname/missionsCompleted/totalStars/totalScore`
  (no `progress_json`, email, generation, subject, csrf); `Cache-Control:
  no-store`.
- `GET /api/leaderboard?limit=20` → 200, `scoreVersion: 3`, Classic rows and
  ordering unchanged.
- `limit=0`, `limit=101`, `limit=abc` on the campaign board → 400
  `{ok:false,error:{code:'INVALID_LIMIT',...}}`.
- Campaign rows with `totalScore: 0` are pre-era (legacy-only) accounts whose
  retained stars still rank; current-era bests add to the sum once earned.
- No Google login, deletion, nickname change, or score submission was
  performed against production for this verification.

## Retained legacy behavior

- Classic scoring, difficulty filters, rankings, submission, `SCORE_VERSION`,
  and personal bests unchanged (Classic board live-check above).
- Legacy campaign completions/stars/unlocks/presets/targets preserved;
  unknown/unreadable saves still protected (migration/compatibility suites
  green). Signed-in account-management screen order/controls unchanged.

## Public trust-model limits

- One row per Google account from acknowledged progress only; pending sync
  stays local context. Invalid/future profiles excluded server-side without
  starving valid contenders (125-corrupt-candidate continuation covered in
  `campaign-leaderboard-worker.test.ts`). No private progress crosses the
  response boundary.

## Not verified here (gap)

- Interactive browser checks across 1440x900 / 768x1024 / 390x844 / 844x390
  (guest form adjacency and keyboard order, no Retry connection, offline
  named guest start, both tabs, loading/empty/error/stale states, long
  nicknames, Campaign map entry, legacy/current results, resize
  while pending) were **not executed**: this environment has no browser
  tooling or installed browser binaries. Prior Task 5 controller screenshots
  live under `docs/verification/2026-10-14-campaign-scoring/` (pre-UI).
- No unassisted live mission run was played to earn/publish a new best.
- Recommended user smoke test on the live site: guest entry order and
  offline named start, both leaderboard tabs, Campaign world-map rankings
  entry, and one mission-1 winning clear with reload.
