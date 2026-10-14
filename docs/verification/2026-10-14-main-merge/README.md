# Main branch integration verification

Date: 2026-10-14 (Asia/Manila).

Merged `origin/codex/campaign-v5-20261012` at
`9aed4cbb5d8a460e3b773b94495780e91e6ec1d0` into `main`, whose starting HEAD was
`366c08e340cd9566605bd1db8992d9051f5b409b`. This integrates all 34 pending
commits: the 100-level Campaign, ten worlds and final art, guest progress,
responsive fixes, Campaign scoring, and separate public rankings. The other
local/remote feature branches were already ancestors of main.

The merge had no conflicts. Application code, public assets, tests, and Vite
configuration match the release branch exactly. The only additional product
documentation correction updates the root README from its stale 30-level
description to the implemented 100-level Campaign. The promotional video and
its production tools remain unchanged. No schema, dependency, or binding
change required migration or installation.

## Local verification and deployment

- Full merged suite: **1,652 passed, 11 existing skipped tests**; 125 passing
  files and four existing skipped files. No tests or assertions were removed,
  disabled, or changed.
- `npm run build`: passed TypeScript and Vite; the existing large-bundle
  advisory remains.
- `wrangler deploy --dry-run --keep-vars`: passed with the existing production
  Worker and bindings.
- `npm run deploy`: passed its full test suite and build before publication.
- Production Worker version: `d1a525a3-9cde-4158-aa6d-84bd578cc0ba`.
- Live URL: https://aetherhold-defense.ljournllagas.workers.dev/.

The first broad test discovery also found a second copy of the tests inside
the ignored video capture archive at `artifacts/promo/source`. Its provenance
test failed because the archive lacks an ignored intermediate art candidate.
The capture snapshot was moved outside the repository to the current chat's
visualization workspace, retaining its contents and the original source tar.
The complete merged suite and deployment gate then passed without changing
test configuration or coverage.

## Live verification

`live-verification.json` records the checks performed after deployment:

- Homepage and current JavaScript bundle returned HTTP 200.
- `/assets/index-Ce40le28.js` exactly matches the merged local production build.
  SHA-256: `52dc7b455c8be1eda211d9a8fc2194a31dd8b30ee1f780f35d09671f13a9dd25`.
- `/api/health` returned `ok: true`, with score version 3.
- All 120 registered final Campaign art paths returned HTTP 200 with image
  content types: 40 maps, ten world panels, 50 regular enemies, ten bosses,
  and ten Campaign tower-tier images.
- A fresh production browser context entered as a named guest and opened the
  fully rendered Campaign map and Classic difficulty selection. Captured
  screenshots were inspected; no browser exceptions or server errors occurred.

No new public score was submitted. Interactive Google consent, cross-device
sync, and a complete 100-level playthrough were not repeated during this merge.
The existing automated account, scoring, compatibility, boss, art and lifecycle
tests remain part of the passing suite.

Unrelated local files were preserved. The user report saved before switching
to main remains recoverable in the named stash and is restored after committing
and pushing the integration. Feature branches are retained for reference.
