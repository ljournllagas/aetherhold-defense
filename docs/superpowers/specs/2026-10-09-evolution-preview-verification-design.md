# Evolution preview and verification fixes

Date: 2026-10-09
Tier: Spec-only
Status: awaiting written-spec approval

## Intent and agreed scope

Help players judge a permanent evolution branch choice with a compact numerical comparison and accurate readiness feedback. Correct the balance trace reporter's missing lower bound and malformed Git ignore patterns. The user confirmed this scope and chose UI and verification fixes before balance investigation.

No balance values, purchase permissions, unlock rules, persistence, score rules, dependencies, or loading architecture change. Human balance playtesting, branch tuning, and loading optimization are deferred. Existing simulation reports already label relic-assisted runs; changing their ordinary-reward attribution policy is out of scope. This supersedes only the level-4 readiness wording in the earlier evolution design, not its purchase contract.

## Design choice

Use the existing progression view model, evolution configuration, formatter, and ScrollSheet. Compared with a separate comparison panel, this keeps branch information beside its action with fewer layout and interaction changes. Compared with retaining descriptions alone, it lets players see the damage and cadence tradeoff before committing. No additional confirmation action is introduced.

## Preview behavior

1. For each evolve action on an unevolved tower, show the branch name, current → evolved damage, attack interval in seconds, and range, plus the existing branch effect description and gold price, before the corresponding purchase button. Retain the permanent-choice notice. Group each branch's information and action together; avoid a separate repeated description list beneath all buttons.
2. Current values come from effectiveStats for the selected tower's current state. Evolved values come from that branch's rank-0 configuration. The preview is informational even below foundation level 4: it compares the current tower against the initial evolution, while the button retains the level-4 requirement. It does not imply purchasing skips foundation upgrades.
3. Values are base configured stats, excluding aura, relic, boss, armor, target-count, and vulnerability multipliers. Identify them as base stats once in the comparison area. Retain role descriptions so damage per arrow is not confused with Volley damage across three targets. Do not display a derived DPS or aggregate damage number.
4. Use the existing formatStat behavior: integer display for damage and range, two decimals for attack interval. Use current → evolved notation and explicit stat labels. Both branches, including locked alternatives, have a preview. No purchase dry-run is used to determine preview values, so insufficient gold and pause do not hide them.
5. Foundation upgrade, evolution-rank, and mastery actions retain their current presentation; this comparison applies only to choosing an initial evolution branch. An evolved tower does not show another branch-choice comparison.
6. Desktop evolution sheets and phone tower/evolution sheets use the same view model and grouped content. Reuse word wrapping, scrolling, and measured text height; no fixed added row height for wrapped comparison text. At 1440×900, 1280×720, 1024×768, 844×390, 390×844, and 360×640, information and actions must be reachable by scrolling without overlap or accidental purchase while dragging.

## Readiness feedback and purchase invariants

7. A level-4 unevolved tower's progression title shows "Defeat the wave-10 boss to evolve" when evolutionOpen is false, and "Ready to evolve" when evolutionOpen is true. Below level 4 and after evolution, retain existing title conventions. Here readiness refers to the evolution prerequisite; gold, alternative-branch availability, and pause restrictions remain explicit on each button.
8. Killing the scheduled wave-10 boss updates an open progression presentation through the existing refresh path, including while other enemies remain. Closing or canceling the sheet spends no gold. Preview rendering must not mutate tower state, gold, hit counters, or unlocks.
9. Preserve captured tower identity and revision, commit-time validation, disabled action behavior, permanent branch choice, and unlock snapshots. Foundation upgrades, ranks, mastery, selling, targeting, pause, victory, and terminal-state behavior remain unchanged.

## Verification corrections

10. In tests/helpers/progressionTrace.ts, verifyTrace reports the existing first-evolution failure message when firstEvolutionWave is null, less than 11, or greater than 13. Values 11 and 13 are accepted if all other gates pass. Add cases for 10, 11, 13, and 14 to the existing trace-reporter tests. Retain all other gates and ordinaryRewardsOnly handling; relic-assisted traces remain labeled by the existing report writer, not silently upgraded to evidence.
11. Repair only the three stray-name patterns at the end of .gitignore. Preserve their intended literal exclusions: the existing root files named `({label`, `String(i+153).padStart(4)+'`, and `['Cinzel'`. Escape Git glob metacharacters rather than deleting or renaming these unrelated files. Retain all other ignore entries.

## Implementation boundaries and acceptance

- src/game/ui/progressionView.ts: supply branch preview values from existing data and select the readiness suffix. Extend its existing branch/action model only as needed; no new subsystem.
- src/game/scenes/GameScene.ts: render grouped preview content in drawProgressionModel using the existing sheet text/action APIs. Reuse its callers for tower and evolution sheets, and existing refresh behavior.
- tests/progression-ui.test.ts: check both branches' current/rank-0 values, locked and insufficient-gold previews, lower foundation levels, readiness before/after the boss, and absence of branch-choice comparisons on evolved towers. Preserve existing restriction and commitment assertions.
- tests/scene-progression-ui.test.ts and applicable compact-sheet/scene-purchase tests: check comparison/effect text precedes the matching action and that disabled/stale actions remain inert. Use existing mocks; do not weaken existing assertions.
- tests/helpers/progressionTrace.ts and tests/progression-balance.test.ts: implement and verify criterion 10.
- .gitignore: implement criterion 11. Verify `git check-ignore` still excludes all three literal files and node_modules/dist; ordinary `rg --files` must no longer report a glob parse error.

Work starts with focused regression tests for the view and reporter, then the minimal model/rendering/ignore changes. Run affected tests, full npm test, and npm run build. The six opt-in balance simulation tests are deliberately skipped in the default suite; balance values and simulation strategy do not change, so their artifact-writing runners need not be rerun for this release.

Use the existing QA evolution state to inspect the rendered comparison at the six sizes above, including scroll reachability and disabled alternatives. Check an unevolved level-4 tower before and after the scheduled boss prerequisite. Report any unavailable browser or physical touch verification explicitly rather than treating unit mocks as visual evidence.

After successful change-specific verification, deploy with npm run deploy (already authorized by AGENTS.md; it runs tests and build before publishing). Verify the production HTML, its referenced current JavaScript bundle, and /api/health; report the live URL and concrete failures. If verification fails, resolve it before publishing or report the blocker. No database migration is required.
