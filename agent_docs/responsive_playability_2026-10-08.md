# Responsive playability — 2026-10-08

User approved the Spec-only responsive-playability design. The workflow route is
Light. The folder has no Git repository; changes are saved locally.

## Implemented

- Full phone/tablet gameplay in portrait and landscape, proportional overview,
  zoom/pan/reset, and screen-space HUD and control sheets.
- Deliberate touch preview/confirm/cancel for building and Meteor; mouse keeps
  immediate placement. Gestures cannot spend gold or cast.
- Expandable, scrollable build/tower/relic/next-wave controls; hidden actions do
  not accept input. Phaser 4-compatible Text cropping contains sheet copy.
- Keyboard-safe name entry, responsive loading and error presentation, stacked
  phone reward/game-over panels, and readable phone leaderboard rows.
- Run, selections, reservations, rewards and pause settings survive rotation.
- Background pause freezes simulation and audio until explicit Resume. Score
  duration excludes time when the simulation is paused.
- Full next-wave composition and contextual rejection/error messages.

## Verification evidence

- `npm test`: 93 tests pass; existing gameplay/worker/score assertions retained.
- `npm run build`: passes. Existing large-chunk warning remains; staged loading
  is intentionally deferred.
- `artifacts/responsive/verification.json`: ten Chromium viewport sizes, eleven
  native interaction checks per size, zero page errors.
- `extended-verification.json`: keyboard viewport, tower upgrade/sell/all five
  targeting modes, full wave composition, reward overflow, Escape, repeated
  rotations, leaderboard error/retry, desktop controls and loading rotation.
- `sheet-mode.cjs` and `relic-error.cjs`: browser regressions reproduced before
  fixes, then passed; covering mode-sheet ordering and wrapped Overcharge error.
- `safe-area.json`: nonzero simulated host insets, matching canvas/renderer/input
  bounds, no body overflow.
- `performance.json`: production baseline versus candidate normal/heavy samples
  at 1280x720 and 1440x900; median frame time 16.7ms, 0% measured regression.
- Independent source review and bounded rechecks addressed clipping, keyboard,
  loader rotation, zoom compensation, full composition and modal error reflow.

WebKit interaction/rotation/game-over/replay checks pass at five phone/tablet/
desktop sizes with a mocked score API. Windows headless native-touch screenshot
captures can be blank despite successful interaction; separate longer render
diagnostics show the menu, battlefield and pause settings in both WebGL and Canvas.
Do not label those blank captures visual passes. No physical phone or tablet was
available; real-device Safari/Chrome validation remains a limitation.

The original battlefield/leaderboard GeometryMask calls produce a pre-existing
Phaser 4 WebGL warning. The new sheet implementation uses explicit cropping and
input gating instead. Asset staging and legacy mask migration are follow-ups.

## Publication

`npm run deploy` passed 93 tests and build, then published the existing Worker.
Version: `11cdf477-5dea-4f82-8d07-c05d6ea24334`.

Live URL: https://aetherhold-defense.ljournllagas.workers.dev/

`artifacts/responsive/live-verification.json` confirms HTTP 200 for HTML and its
current bundle, exact local/live JavaScript SHA-256 match, and `/api/health`
HTTP 200 with `ok: true`. The unmodified live phone smoke covers menu, name entry,
building, starting a wave and rotation, with zero page errors and zero POST writes.
Initial cold loading exceeded the first harness's five-second wait; the final
check waited for asset loading before native interaction. This does not resolve
the deliberately deferred asset-loading performance work.

Bundle: `/assets/index-Dyv9WxIs.js`, 1,860,250 bytes.
SHA-256: `194a55bc2689d33a3ed8c60bf2b9b01a05b478f5936bef65a7ce2f2717ea84b1`.
