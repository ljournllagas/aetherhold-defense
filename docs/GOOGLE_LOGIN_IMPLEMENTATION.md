# Google login implementation ledger

Plan: docs/superpowers/plans/2026-10-11-google-login-cloud-progress.md
Base: 13fb03324d23ef69323f71e568a0474c2f011d6f
Execution: inline; no application publication until integrated verification.

Ruling: use the existing checkout/current branch specified by the approved plan and user remote-synchronization instructions; preserve unrelated .scratch content. No independent implementers are used.
Ruling: keep the execution ledger as a durable project document instead of a Bash-only ignored workspace script on Windows; record task evidence and deviations here.

Tasks 1–9: implemented; integrated verification and independent review in progress. Task 10: pending production acceptance.

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
