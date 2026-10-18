# UI and UX audit re-run — 2026-10-15

Scope: code-level re-check of `docs/UI_UX_AUDIT_2026-10-14.md` against main at 8d6a150, plus the boss-wave layout change. The full browser matrix was not re-run.

## Boss waves no longer change the screen (fixed)

Cause: on compact screens, `updateCompactBossBar` called `setBossLayout`, which dropped minimal mode, swapped the landscape rail for the legacy bottom tray, grew the HUD and re-fitted the camera when a boss spawned (for example Classic wave 10). Everything reverted when the boss died.

Change: in minimal layouts the boss bar is a slim translucent overlay at the top edge of the board. Layout, HUD, rail and camera are untouched. Non-minimal layouts (desktop, roomy portrait) keep the reserved boss strip. Tests in `tests/boss-panel-placement.test.ts` now assert that layout and camera are identical before and after a boss spawns at 844x390, 667x390, 768x390, 767x540, 360x360, 320x390 and 320x360. The legacy reserved-geometry tests for those sizes, and the short-portrait 52px command-row tests, were removed because that path is unreachable there.

Known tradeoff: the bar covers about 24px of the board's top edge during a boss. Floaters steer clear of it; the boss sprite may pass beneath it.

## Status of the 2026-10-14 findings

| # | Finding | Status |
|---|---|---|
| 1 | Canvas menu/sheet actions not keyboard-operable | Partly fixed: main menu (2026-10-18) and Classic difficulty selection (2026-10-18) have DOM button layers; in-battle and portrait-phone ScrollSheet rows remain open |
| 2-5 | Short-landscape Settings, Campaign row heights, header overlap, leaderboard recovery | Not re-checked |
| 6 | Escape closes sheet first | Fixed |
| 7 | Preparation scroll preserved | Fixed |
| 8 | Reduced motion | Resolved (2026-10-18): boot splash, painted menu backdrop motes and the battlefield stronghold beacon all honour the preference; the login screen shares the backdrop primitive |
| 9 | Press vs release | Mostly fixed; MainMenu buttons unconfirmed |

## New observations

- The first-play "How to play" card covers roughly 35-45% of the board on phones and freezes play until dismissed; consider a slimmer inline hint.
- Roomy portrait phones still reserve and refit for bosses (HUD grows, camera refits); extending the overlay there is a follow-up.
