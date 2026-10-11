# Design fixes verification — 2026-10-12

## Delivered behavior

- Tower sprites use ground-footprint anchors rather than putting the front edge
  at the build plot center. Shadows, projectile origins, bounds and fallback
  overlays follow the adjusted art. Campaign PNG bounds exclude transparent padding.
- A dedicated opaque boss panel uses 16px full names, 14px HP/phase/enrage status
  and an 8px tracked health bar. Its position follows the battlefield rectangle.
  Compact inspectors move below it or offer a compact Details action into the
  existing tower sheet when space is insufficient. Closing that sheet stays
  closed. Wave controls remain visible.
- Live score counts combat points only. Campaign and Classic final settlement
  retain resource bonuses and the existing score era/mastery rules.
- Menu title and 14px score/subtitle rows have an opaque dark backing and measured
  vertical spacing. Narrow action labels wrap within their buttons.

## Regression evidence

Observed failures before fixes: fresh-score regression received 945 instead of
0; each tower family placed its front edge at approximately local y=0; boss-panel
tests found portrait/landscape content inside the tray and desktop placement above
the field with safe insets; menu score rows overlapped actions at 360x360/844x390.

The Campaign settlement regression was checked by temporarily restoring its old
live-score call: it received 1,237 rather than 2,182 and existing mastery-acceptance
tests also failed. The final calculator was restored; the regression and complete
suite passed. No assertions were weakened. Compact boss label tests now assert
full names with phase/enrage in the separate status row.

Final predeployment checks: `npm test` — 96 passed files, 4 existing skipped files;
1,137 passed tests, 11 existing skipped tests. `npm run build` passed. Vite still
reports its existing large-main-chunk warning. `git diff --check` passed.

## Browser verification

These are browser viewport simulations, not physical phone/tablet tests. The
existing local Worker ran with guest access for testing only; production account
configuration was not changed. No browser-console errors were observed in the
checked game and menu scenes.

Checked CSS sizes: 360x360, 360x640, 390x844, 640x360, 844x390, 768x1024,
1024x768, 1366x768 and 1920x1080.

- Classic boss fixture and Campaign Frostbound Matriarch phase-2 fixture: full
  name/status/bar visible clear of tray/wave controls; resize across phone,
  tablet and desktop layouts. At 390x844, rendered name/status rows occupy
  separate lines in the backed top-of-field panel. Tablet portrait/landscape
  retain the same readable text sizes. Other Campaign names/statuses are covered
  by the scene regression tests.
- In 844x390 landscape, resume then select a Tempest: inspector appears below
  the boss panel. Pause/resume and panel restoration checked. Boss escape removes
  the panel. Safe-inset Details fallback is covered by the scene regression,
  including avoiding automatic reopening of a closed sheet.
- Temporary render grid: all 60 family/foundation-stage/visual-tier combinations,
  20 first/final-stage fallback combinations and all 10 evolution decorations.
  Bases overlap circles with contact shadows. Shared geometry regression covers
  all stages and tiers. The grid uses the actual production art renderer.
- Normal menu → Campaign → Level 1 → Start Battle (no QA query): 600 gold,
  20 lives and score 0 before wave 1. Build Ranger, then upgrade before combat:
  gold drops to 500 then 410, score stays 0. Placement preview and upgraded tower
  inspected at overview and approximately 3x zoom; ground contact stays aligned.
- Menu fixture uses the actual scene with isolated temporary record keys, restoring
  them immediately after rendering. Both records at 10,000,000 points/wave 500
  fit across the entire size matrix, including wrapped legacy text at 360x360.
  Normal legacy-only menu and unit coverage of record/action geometry also checked.
  No persistent player records were changed by the fixture.

Text colors `#F3EBDD` and `#F0CD72` over opaque `#121920` satisfy the specified
contrast targets (14.96:1 and 11.54:1 respectively). Screenshots are attached to the task's local artifact output;
representative phone evidence is retained under `docs/verification/2026-10-12/`.

## Production release

`npm run deploy` passed its test/build gates and published Worker
`aetherhold-defense`, final version `aba22a91-a1e4-48e4-8e1d-2710c71fed24`.

- Live URL: https://aetherhold-defense.ljournllagas.workers.dev
- HTML and `/assets/index-DNTMeQuB.js`: HTTP 200; HTML references this bundle.
- Remote bundle SHA-256 matches the local build:
  `9449d868baa3ba798dbe9dd380030c9f7695abf98d67f1212b4fd8861b3408e0`.
- `/api/health`: HTTP 200, `ok: true`, score version 3; this endpoint checks D1.
- `/api/account/config`: HTTP 200, `loginRequired: true`, retaining production
  authentication. The production browser page loads its sign-in screen.

Remote synchronization is verified against `origin/main` after the task commit;
the commit hash and equality result are reported in the chat to avoid a document
that would need a second commit merely to include its own hash.
