# Project deployment

After completing each successful application change, automatically deploy to the
existing Cloudflare production Worker using `npm run deploy`. The user has
authorized these deployments; further confirmation is unnecessary.

Complete change-specific verification before deployment. The deploy command must
pass tests and build before publishing. After publishing, verify the live page,
current JavaScript bundle, and `/api/health`; report the live URL and any failure.
If verification or deployment fails, resolve it or report the concrete blocker.
