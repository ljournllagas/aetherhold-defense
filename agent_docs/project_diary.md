# Project diary

## Lasting decisions and lessons

- Responsive progression coverage must include fully unlocked content, not only early milestones. The 90-Star Codex exposed 14px boss paragraph/stats overlaps missed by the 10-Star view; advance text layout by measured rendered height.
- Phaser 4.2.1 GeometryMask/setMask is Canvas-only. WebGL fixed viewport clips require external parent-space Mask filters, visible off-display-list source Graphics, controlled refresh and separate input bounds checks. An accepted screenshot can still miss narrow gutter spill; inspect actual viewport boundaries and unsupported API warnings.

- Stage raw-approved art in a held working manifest so native review exercises the real loader. Keep publication gated on combined runtime acceptance; browser-only manifest injection is unnecessary once the integration can be tested safely before release.

- Boss effects must share the sprite's transformed origin and facing. Scaling Graphics does not scale its position: use display-size origin offsets and a mirrored parent, then compare transformed geometry with sprite reference points. Native screenshots still establish visual acceptance.
- Pending manifest status does not prevent publication of public files. Independently accept candidates before release or remove rejected runtime copies from public output, preserving originals separately.

- Separate persistent boss phase appearance from transient authored clips. Completion must restore the current armor/core/enraged pose rather than ordinary idle art; test after completion and movement updates, not only clip selection.
- Generated terrain plates must not redefine campaign roads or build sites. Composite the existing painter with actual variant geometry and cache by map identity; independently review both pixel alignment and the rendered road finish.
- Campaign realm panels require ground-filled strategy-map composition; cinematic horizon landscapes can suit the menu while failing this surface. Preserve full generated originals and exact prompts, and approve the rendered crop independently before manifest promotion.
- Load approved realm panels in a separate campaign stage to preserve the six-asset cold menu. Use centered cover cropping with equal-axis scaling and bounded caption backings; keep route geometry and touch targets independent of illustration details.
- A label that fits a full realm can still clip after the campaign map pans on a phone. Compute caption width from the visible realm intersection, wrap at readable size, measure its backing, and independently recapture each selected world.
- Campaign reuses the fixed-step GameScene with run-local map, wave, enemy, preparation and specialization configuration. Keep its local results outside classic bests, branch achievements and siege leaderboard validation; campaign foundation levels and prebattle sidegrades do not invent a classic evolution unlock trigger.
- Derive campaign unlocks and feature summaries from contiguous clears, boss Sigils and monotone individual star flags. Never overwrite malformed or future-version saves; report session-only progress truthfully.
- Build all campaign route nodes before cross-world links. Preserve 44px hit areas with 8px separation instead of shrinking a thirty-node route on phones. Measure wrapped metadata/objective heights before placing later detail rows.
- Cached runtime imports can make a development QA installer run before Phaser registers scenes. Guard actual scene availability before subscriptions, controls or network fixtures; prove the timing repair in a native browser as well as tests.
- Campaign ability notices need a backed, bounded surface separate from enemy anchors and boss bars. Compact boss identity, phase/HP and health rows must be measured independently. Label seeded fixtures and document hiding only the external QA dock for unobscured captures.
- Natural paid-resource simulations and seeded visual fixtures answer different questions. Audit configured costs and before/after balances, not only recorded purchases; preserve narrow target margins and do not claim human balance from a bot.
- Production art manifests describe dimensions, anchors and required state rows, while explicit final-quality and approved-path gates control loading. Procedural fallback and concept sheets do not establish final-art acceptance.

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
- Phaser 4 WebGL requires an external Mask filter for fixed pane clipping; GeometryMask/setMask is Canvas-only. Keep the mask source visible off the display list, refresh the static controller after redraw, and guard input bounds separately. Native pixel-band comparisons and restart/resize listener counts exposed and verified the repair across map, battlefield and leaderboard.
- Verify the fully unlocked campaign UI at exact threshold profiles and narrow portrait sizes. Measured description height prevents boss Codex paragraphs colliding with stats; lower-Star fixtures cannot establish the 30/90-Star layout.
- Campaign production completion 20261010 published Worker af75da8f-9800-42ce-919d-e823a0ad471a after independent native acceptance and939 passing tests/11 configured skips. Live current bundle, health and25 images matched the build. Eighteen absent atlases remain explicitly UNVERIFIED under the user's fallback allowance; raw art and exact prompts are retained separately from production files.
