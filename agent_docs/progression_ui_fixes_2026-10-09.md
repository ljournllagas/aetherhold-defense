# Progression UI reliability fixes — 2026-10-09

The game assessment reproduced stale purchase eligibility and lost scroll position in open progression sheets. The user proceeded with the recommended bug fixes; this first batch repairs those two UI issues. Combat timing, upgrade previews, balance investigation and staged loading remain separate follow-ups.

## Behavior and scope

- `GameScene` reevaluates open progression actions through the existing purchase policy whenever the HUD updates. Gold from kills, wave bonuses and relics, and user/modal/background pause changes, update labels and availability in place. Unchanged reasons do not redraw controls.
- `ScrollSheet.action` returns an update function for its label and enabled presentation. Eligibility changes cancel a held button press before changing availability. Visibility clipping and drag handling remain in the existing sheet and button code.
- Full progression redraws preserve the scroll offset for the same tower and sheet. Switching tower or sheet starts at the top. Resize restores the offset within the new scroll limits. Initialization, sheet replacement, shell replacement and shutdown clear the old refresh callback.
- Purchases retain captured tower identity and revision and revalidate at commit time. Refreshing spends no gold, evolves no tower and changes no unlocks. No combat, economy, score contract, database, dependency or evolution configuration changed.

Production files: `src/game/scenes/GameScene.ts`, `src/game/ui/ScrollSheet.ts`. Regression coverage extends `tests/scene-progression-ui.test.ts`.

## Acceptance and verification

Seven new regression cases failed against the original implementation, reproducing stale gold/pause availability and scroll loss. They pass after the fix. The existing purchase restrictions and stale-action assertions remain intact.

The final deployment command ran the full suite and build before publishing: 36 test files passed, two opt-in files skipped; 485 tests passed, six opt-in balance tests skipped. Production build passed with the existing large JavaScript chunk warning.

`artifacts/progression-ui-fixes/check.cjs` passed rendered Chromium checks at 1440×900, 1280×720, 1024×768, 844×390, 390×844 and 360×640. Each size verified:

- A real Thornling kill increased gold from 509 to 517 and enabled the 510-gold Marksman action without recreating the sheet or moving its scroll position.
- Releasing a press begun while the action was disabled did not buy anything; a subsequent native click bought exactly one rank-0 Marksman and left seven gold.
- User, modal and background pause/resume updated the existing button.
- Gold Rush and the authoritative wave-clear reward path refreshed eligibility.
- Wave-10 readiness redraws retained offset; rotation retained or clamped it to the new scroll limit.
- Native dragging with a concurrent gold update did not purchase an evolution.

Results and screenshots are in `artifacts/progression-ui-fixes/`. No page errors occurred. These are debug-seeded desktop Chromium checks, not human balance evidence or physical touch testing.

## Publication

`npm run deploy` published Worker version `4a7e0d26-8f7c-401f-af41-297cbc3ef5ae` to https://aetherhold-defense.ljournllagas.workers.dev/.

`artifacts/progression-ui-fixes/live.cjs` confirmed HTTP 200 for the live HTML, its referenced bundle `/assets/index-B-NSeh8-.js`, and `/api/health`. Health reports `ok: true`, scoreVersion 2. The bundle is byte-identical to the local production build: SHA-256 `5dc96a99b111eaa8d0bad0885648eea9dbd88d1b9758253e44c4097b79d18ee9`. The unmodified production page rendered with zero page errors and zero failed HTTP responses. No migration was needed.

## Remaining work and limits

The assessed coarse-frame attack scheduling bug remains: fast towers lose attacks when update deltas exceed their interval. Next-rank/mastery previews, balance validation and staged loading have not changed. Physical touch, cross-browser gameplay, full human siege/endless playtests and fresh balance simulation were not performed. The current handoff now records the real Git and era-2 production state.
