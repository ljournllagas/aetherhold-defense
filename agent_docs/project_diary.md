# Project diary

## Lasting decisions and lessons

- The SPEC controls mechanics and numbers; approved images control visual family, composition, materials, hierarchy, and state presentation. Functional rendering can still fail visual acceptance.
- Preserve verified pure systems and configuration; rebuild placeholder world art and conflicting layouts. Canonical coordinates and adaptive controls preserve gameplay visibility at 844×390 without shrinking text and targets.
- Use game-time projectile travel and effects so pause and speed affect simulation consistently. Keep relic inventory at three slots with explicit pending-reward choices.
- Scene activity alone does not guard stale asynchronous callbacks: a reused Game Over scene needs run identity and generation checks. Reset submission flags per run. Verify a delayed response while the same scene is active for a later run.
- Successful local Worker/D1 traffic and natural gameplay runs are distinct from controlled visual fixtures. Block fixture score POSTs and label injected failures and timeouts explicitly.
- Record the actually served production bundle hash. A preview can serve an older default dist despite an intended isolated build.
- Review tower progression, enemy atlas crops, and projectiles at native size and in grayscale. Large concepts and recolors do not establish gameplay readability.
- Keep the defeated map composition aligned to the healthy map and render the actual loss snapshot. Compact result panels must expose the destroyed stronghold.
- A 16.7 ms median reported as 59.88 FPS can reflect browser timestamp precision. Preserve raw values and compare identical empty-WebGL refresh cadence rather than rounding or weakening the 60 FPS target. Software rendering and physical GPU measurements remain separate.
- Narrow the Game Over result panel and reuse the full Hall instead of maintaining a competing inline leaderboard that races score submission.
- Durable documents contain verified decisions and continuation state; raw captures and chronological logs live under artifacts/rebuild/.
- Compare decoded dimensions, alpha and visible RGB when changing raster transport. All 22 lossless WebPs preserved these properties and saved 35.22%; bundle equivalence isolated the release delta to asset URLs.
- Preserve unversioned scores in legacy era 0 and require explicit current era 1. Export and fingerprint remote records before migrating; scope account selection to each Wrangler process. Clean verification rows by exact run UUID only.
