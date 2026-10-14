# Responsive UI repair verification — 2026-10-14

Scope: the first four layout repairs recommended in UI_UX_AUDIT_2026-10-14.md. Light route. The existing visual identity and gameplay rules are preserved.

## Changes

- Settings uses its existing scrollable control sheet below 360px height, as well as on narrow screens. Editing keeps the existing saved scroll offset.
- Campaign Mastery, Codex, and Preparation advance text rows by measured wrapped height. ScrollSheet also measures its heading so a two-line title clears the content.
- Difficulty reserves a 72×44 account action beside its compact heading and updates the position during resize. Campaign places progress badges below header actions and hides the account action while a full-screen Campaign sheet is open.
- Leaderboard keeps Retry beside Back in the footer. Messages that exceed the available body height use a scrollable status sheet. Its lifecycle cleans up on retry, mode/filter changes, and shutdown. Short text-only sheets accept wheel scrolling without button snapping.
- Corrected an audit false positive: the Leaderboard account-button overlap was caused by QA navigation leaving MainMenu active. Ordinary navigation has no account button on that screen.

## Automated checks

- `npm run deploy` ran the complete suite: 125 test files passed, four skipped; 1,663 tests passed, 11 skipped; zero failures.
- Production TypeScript/Vite build passed. The existing single-bundle size warning remains (2,203.14 kB minified; 535.19 kB gzip); bundle splitting is outside this layout repair.
- Added checks for measured Mastery/Codex rows including wrapped warnings, short-screen Settings routing, Campaign header space at 320/360/390px, and Retry/Back geometry with long error messages at 320×568, 390×844, 844×320, and 1280×720.
- The short text-only sheet wheel test failed before its fix (offset 0 instead of 32), then passed after the fix, including release without snapping back.
- Impeccable detector returned no findings on the affected scene/control files. `git diff --check` passed.

## Browser verification

- 320×568: ordinary Classic navigation shows the complete Difficulty heading beside Guest. Campaign badges clear account/back actions. Mastery title and wrapped rows remain separated; wheel scrolling reaches sigils and footer actions. The account action hides on sheet entry and returns on close.
- 390×844: Settings controls remain separated and Back/close work. Ordinary Leaderboard navigation confirms no account-button overlap and separate Retry/Back actions.
- 844×320: Settings scrolls to Music, SFX, preferred speed and Back; changing speed retains the visible section. Leaderboard failure shows the complete Retry and Back controls; the status message scrolls through to local-progress reassurance; Retry runs again.
- 1280×720: ordinary desktop menu and Settings render correctly.
- Development `/api` proxy failures are expected without a local Worker; both QA failure and ordinary error handling were inspected. QA controls were excluded from geometry judgments.

## Remaining scope

Keyboard/semantic navigation, Escape dismissal, Preparation edit scroll retention, reduced-motion consistency, and press/release consistency remain separate audit items. Real mobile keyboards, screen-reader operation, real-device performance, and signed-in Google flows were not exercised. Unrelated workspace files were left untouched.

## Production validation

- `npm run deploy` completed successfully against the existing aetherhold-defense production Worker. Version: `607bd1fb-a5cb-476b-b0a8-0e1a78a73a2f`.
- Live URL: https://aetherhold-defense.ljournllagas.workers.dev/ — HTTP 200.
- Published page references `/assets/index-F9j-boo7.js`; fetched bundle is HTTP 200, 2,203,139 bytes, and its SHA-256 exactly matches the local production build: `f865df51308223254c5067a9e4a0cc7cecf9c3d3aa8a7992cf8bc952e250aa60`.
- `/api/health` returned HTTP 200 and `{ "ok": true, "scoreVersion": 3 }` at 2026-10-14T14:36:20.554Z (22:36 Manila).
- Live browser: 320×568 Difficulty heading and account action clear each other; Campaign header badges remain visible; Mastery title/rows are separated and the account action hides/restores with the sheet. At 844×320, Settings scrolls cleanly to preferred speed and Back. No production failure was forced; leaderboard recovery was verified locally.
- Temporary viewport override was reset after inspection. No production game progress, settings, nickname, or scores were modified by the live checks.
