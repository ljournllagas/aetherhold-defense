# Feature, artwork, balance and mode-entry audit

Date: 2026-10-11. Tier: Spec-only. Status: awaiting written-spec approval.

## Intent and agreed scope

Audit all shipped Classic and Campaign features, repair confirmed defects and missing artwork, and expose both modes directly on the main menu. Report evidence-backed balance concerns before changing tuning values. Use the Light route; the spec review is the one delegated activity required by /speccing.

This is an audit and bounded repair release, not a new content expansion. No new worlds, towers, relics, persistence schema, leaderboard era or dependencies. Preserve unrelated changes, including the existing untracked .scratch directory. Balance tuning and speculative redesign require a subsequent user decision; confirmed logic defects that violate existing behavior are in scope.

## Current evidence

- MainMenuScene has three responsive layout branches, each showing Campaign but no Classic entry. CampaignScene exposes Classic Siege through Difficulty. Difficulty already loads gameplay through Preload.
- The current Campaign manifest marks all fifteen ordinary enemies and three bosses final. The monster-production test checks physical PNG headers, dimensions and loader coverage. Older CAMPAIGN_PRODUCTION_ASSETS documentation still records eighteen missing atlases; reconcile historical claims without erasing release history.
- Initial verification: 36 tests passed across assets, monster production art, campaign art manifest, progression balance and campaign configuration. This establishes contracts, not complete runtime visual quality or gameplay balance.
- Classic balance acceptance uses eight fixed-strategy seeded scenarios, including no-gold-relic comparisons. Configuration and combat tests do not prove Campaign completion or mastery thresholds are attainable.

## Approach and boundaries

Reuse MainMenuScene's addButton, existing textures, tokens and transitions. Prefer this over a new mode-selection screen (adds navigation) or a card subsystem (unnecessary interface and art work).

MainMenuScene owns the mode-entry layout. DifficultyScene, CampaignScene and PreloadScene retain their existing responsibilities. Art manifests, artkit, renderers and entity animation callers own asset fixes. Existing configuration and simulation systems own confirmed gameplay logic repairs. Amend existing tests and fixtures at those boundaries; do not introduce a parallel gameplay implementation for the audit.

Execute directly from this spec after approval: establish a baseline and feature inventory, implement and verify the menu change, audit feature/art/balance behavior, repair evidenced defects with regression coverage, record the audit, then run release verification. A newly discovered defect needing a major subsystem or data-contract redesign is documented as blocked follow-up rather than silently expanding this release.

## Main-menu behavior

Display exactly one Campaign and one Classic Siege primary action, with equal button styling and legible labels. Campaign remains first in reading order. Both must be available on a fresh browser without campaign progress.

- Campaign retains Preload with stage campaign and destination Campaign.
- Classic Siege starts Difficulty directly, without entering Campaign or requiring campaign assets. Continuing difficulty selection retains the existing gameplay preload and Classic run behavior.
- Keep Classic Siege inside Campaign as an existing shortcut.
- Preserve Hall of Legends, Settings, Progression, defender name, personal/legacy bests and Saved Score states/actions.
- Desktop: place mode actions side by side in the current central menu width, above secondary controls; allow enough width for both labels. Narrow portrait: stack the two mode actions. Compact landscape: use a mode row followed by a secondary-action row. Adjust title spacing/button sizing using current patterns where necessary; do not squeeze all five actions into a single row.
- Buttons, labels, best-score text and saved-score footer must stay within the viewport without overlap at 360x640, 390x844, 844x390, 1280x720 and 1920x1080. Actions have at least 44px height. Resize/rotation returns a usable menu and preserves the existing open Saved Score behavior.
- Test both no-best/no-saved and current-best plus legacy-best plus saved-score states. Saved-score ready, incompatible and unreadable states retain their current retry and warning behavior. Mode selection does not modify Campaign progress, unlocks, best scores or saved submissions.

## Audit coverage and deliverable

Create docs/FEATURE_ART_BALANCE_AUDIT.md. Inventory actual shipped features from scene registrations, configuration, runtime systems and existing specs, not only the baseline product document. Each inventory entry has mode applicability, implementation reference, verification reference and status: verified, repaired, concern, or unverified. Each finding records reproduction, expected/actual behavior, severity, evidence, disposition and any remaining limitation. Historical evidence is dated and distinguished from checks made in this release.

Cover these groups:

1. Entry/loading/navigation: boot, staged loading failures/retry, both modes, setup, settings, progression, leaderboard and results return/restart flows.
2. Battlefield/combat: plots, range/targeting, all five tower foundations and evolution branches, Campaign specializations/visual tiers, damage/resistance/control interactions, projectiles, enemy families, support buffs, bosses and summons.
3. Run lifecycle: wave start/clear, speed, pause/background/resize, auto mode, relic reward/target/inventory flows, siege failure/victory/endless, restart/quit cleanup.
4. Persistence/results: Classic achievements, Campaign levels/stars/sigils/milestones/unlocks, mode isolation, personal and legacy bests, explicit score submission and retained retry, offline/error behavior.
5. Presentation: map/world panels, tower/evolution art, enemies/boss states, relic/HUD/menu icons, stronghold/result states, effects/audio and responsive controls.

Trace each feature group to existing automated coverage and exercise representative real browser flows. Do not label an entire group verified solely because a related unit test passes. Record unavailable environments explicitly; physical touch hardware is not assumed available.

## Artwork acceptance

Enumerate every asset requested by shipped menus, Classic and all thirty Campaign levels at every supported visual tier, including boss summons, evolution previews and result states. Check referenced public files exist, decode with expected dimensions/cell bounds and are included by the appropriate loader. Distinguish intentional vector/text/procedural UI from a required production image absent or substituted by an unintended fallback.

Inspect runtime representative cases covering every unique map family, tower art variant, enemy family and declared boss/support animation state. Reuse QA fixtures where possible and mark their evidence debug-assisted. Check transparent edges, anchors, silhouette/readability, animation frame selection and overlays at gameplay scale. Presence in a manifest does not alone establish visual acceptance.

Fix confirmed broken paths, loader omissions, frame selection and unintended fallbacks at their shared source. If a required image is truly absent, supply original artwork under existing art guidance and verify its rendering. Do not regenerate already acceptable art or replace intentional procedural UI. Keep provenance for newly created art. Any asset that cannot be accepted is a concrete unresolved finding, not silently marked final.

## Balance assessment

Run existing Classic balance acceptance and retain labeled results for all eight scenarios: outcomes, waves reached, remaining lives, gold/economy, purchases and relic use. Assess tower roles/cost progression, alternative-branch availability, boss timing, difficulty ordering, gold-relic dependence and endless scaling against current intended behavior.

For Campaign, evaluate all thirty authored level configurations and use actual combat rules for reproducible completion/mastery evidence. Reuse the existing simulation/QA machinery where compatible; a small opt-in harness may be added if needed, using production combat rather than copied formulas. Record strategy, seed where randomness applies, available unlocks, starting resources, outcome, lives, score, stars and relic use. Model the earliest legally available progression for each level and separately check fully unlocked replay behavior. Never use debug grants as evidence that ordinary progression is attainable.

Screen all levels for impossible or anomalous score/lives mastery targets and economy pressure. Investigate suspicious results with multiple repeatable runs or an alternate legal strategy before calling a level impossible or a tower dominant. Separate configuration/logic defects, measured balance concerns and insufficient evidence. A fixed bot's failure is a concern, not proof of impossibility; a bot win is not proof of enjoyable player difficulty. Report gaps if a reliable Campaign simulation cannot be produced, with exact affected levels and checks performed.

Do not change HP, costs, rewards, score multipliers, mastery targets or drop rates merely to make acceptance pass. Recommendations identify the affected values and observed impact; tuning awaits user review. Repair confirmed violations of existing combat/economy rules with a reproducing test and record resulting balance effects.

## Verification and completion

Add behavior tests in the existing screen harness for direct mode routing, both buttons at every layout branch, fresh/save-bearing states and unchanged secondary navigation. Use real browser checks for layout/text fit and asset loading; mocked display geometry alone is insufficient. Confirm Classic works on a cold load and no Campaign loader is required to reach Difficulty. Exercise Campaign entry and return to menu.

Every nontrivial repair gets a focused regression test using the affected production path. Run all tests, typecheck and build. Preserve assertions, skipped-test visibility and existing acceptance thresholds. Fix failures introduced by this work; document and resolve existing failures where bounded, otherwise report the concrete blocker. Include audit coverage limitations in the final report, without describing unverified areas as complete.

For a successful application change, run npm run deploy (which runs tests and build before publish). Verify live HTML, current JavaScript bundle against local dist, /api/health, both menu routes and changed assets. Record URL and deployment identity. Resolve failures or report a concrete blocker. Commit completed code, spec and audit documentation, push the current branch, and verify local HEAD equals the remote branch. Stage only task-owned files. Documentation-only specification work does not trigger production deployment.

Acceptance: direct Classic access works on all target layouts; all audit groups have evidence-linked dispositions; confirmed bounded defects are repaired and checked; balance recommendations and unverified coverage are explicit; successful release and remote synchronization checks are recorded. Any unresolved confirmed defect is reported with impact and prevents a claim that all defects are fixed.
