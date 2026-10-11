# Google login implementation ledger

Plan: docs/superpowers/plans/2026-10-11-google-login-cloud-progress.md
Base: 13fb03324d23ef69323f71e568a0474c2f011d6f
Execution: inline; no application publication until integrated verification.

Ruling: use the existing checkout/current branch specified by the approved plan and user remote-synchronization instructions; preserve unrelated .scratch content. No independent implementers are used.
Ruling: keep the execution ledger as a durable project document instead of a Bash-only ignored workspace script on Windows; record task evidence and deviations here.

Tasks 1–9: implemented and verified. Task 10: production release verified; full live two-device battle playthrough remains an additional manual check.

Evidence:
- Baseline: 1,017 passed, 11 existing skips.
- Shared projection tests: RED missing modules, GREEN 4 tests.
- Real local D1: additive migration preserves anonymous score rows, cascades account sessions, and rolls back failed batches.
- OIDC callback tests: 13 pass, using generated RSA-signed tokens and real local D1; wrong state/browser/nonce/audience/issuer, expired/replayed attempts/tokens, forged signature, missing JWKS, and cancelled consent never establish sessions.
- Account HTTP integration/deletion: concurrent progress union, repeated score immutable nickname, conflicting ownership/payload, import claims, CSRF, unsupported versions, Campaign isolation, confirmation, actual auth freshness, and deleted-generation rejection verified against local D1.
- Browser persistence/lifecycle: multi-record outbox, per-account acknowledgement, consumed import ownership, expiry retention, explicit legacy rollout, and independent progress sync statuses pass.
- Full suite after initial integration: 1,035 passed. Subsequent full run exposed an older oversized-body test expecting 413 without rollout configuration; preserve the existing body-size guard before legacy endpoint authentication. Focused regression now passes without weakening assertions.

Ruling: use oauth4webapi for actual OIDC protocol verification and fake-indexeddb only for browser persistence tests; current Miniflare exposes convertV4MiniflareOptions, so use its installed compatibility adapter rather than assuming older constructor options.
Ruling: authenticated Campaign terminal results remain separate from public Classic scores. Preserve legacy manual submission controls only while explicit disabled rollout allows guest play.
Ruling: first account import retains its browser-local Campaign preparation fields by seeding only a validated absent account storage key; preferences are never uploaded.
Ruling: perform one integrated implementation checkpoint before publication, because the contracts, imports, and browser adapters must build together. No partial deployment.

Independent whole-implementation review: five important client lifecycle/storage findings, no critical or minor findings. All five received failing regression tests before fixes: mismatched session/profile rejection; late refresh after logout; active-battle offline owner preservation; server logout when IndexedDB fails; unreadable outbox never synced; account personal-best memory retention with failed localStorage. Focused fix verification: 41 tests passed; scene/lifecycle follow-up: 88 tests passed. Full post-fix suite: 1,066 passed, 11 existing skips; build passed.

Review rulings: real Google consent/reauth and live acceptance are release gates, not assumed from token fixtures. Actual Google current-key behavior is still externally dependent; generated signed-token verification and failed JWKS paths pass. Local login controls were inspected at desktop and 390x844 phone size and remained visible/enabled.

Additional correctness: mark settlement pending before asynchronous queue persistence; defer uploads until persistence finishes. Result screens subscribe to acknowledgement state. Expired account results retain automatic upload semantics; readonly difficulty nickname directs account users to their editable account nickname.

## Production release

2026-10-11: migration 0005 applied successfully to existing Cloudflare D1. All 18 historical anonymous scores remain intact. Google client ID/secret names verified without reading values. The user completed actual Google sign-in and returned to the game, then completed deletion reauthentication and cancelled without deleting data. Production account count, session creation, and consumed guest import were independently confirmed with aggregate queries.

The user confirmed the final deletion button was visible after reauthentication, cancelled, then signed out. The subsequent session contains no reauthentication timestamp, consistent with revoking the verified session and starting a separate login session; no production account was deleted.

Required login enabled (`ACCOUNT_LOGIN_REQUIRED=1`). Final `npm run deploy` passed 1,067 tests (11 pre-existing skips) and TypeScript/Vite build, then published Worker version `cba3a0ff-34d3-495f-9fce-c215a013aeeb`.

Live URL: https://aetherhold-defense.ljournllagas.workers.dev/
Current bundle: `/assets/index-Cpzo3M7a.js`
SHA-256: `4e65795f737193eb236d4360e378ec7e07a9bbde798c2c4918824ba96fa02283`

Live HTML, byte-identical current JavaScript bundle, `/api/health`, Google authorization redirect with exact callback/PKCE/nonce, private API rejection, legacy anonymous score rejection, and login-required configuration were checked after publishing. The signed-out production browser displays Google login with no Continue playing action. Desktop and phone account layout were inspected locally. Native Chrome automation was unavailable; real Google flows were completed by the user in their regular browser. Two-device merging, offline retention, and duplicate settlement were exercised locally against actual D1 and browser storage fixtures; a full production battle on two physical devices was not run. Destructive production account deletion was deliberately not performed; real reauthentication plus local D1 deletion tests cover that boundary.
