# Responsive UI implementation and verification

Specification: [responsive game experience](superpowers/specs/2026-10-11-responsive-game-experience-design.md).
Plan: [implementation plan](superpowers/plans/2026-10-11-responsive-game-experience.md).
Branch: codex/responsive-game-experience; base 30ffadc.
Status: implementation verification and independent review in progress; production release not yet claimed.

## Changes

The battlefield has a visible tower tray, directional touch arbitration, mouse/stylus drag placement, offset touch preview, edge panning, and tap confirmation. Keyboard 1–5 selects a tower, arrows select a plot, Enter confirms and Escape cancels. Purchases still use original placement and evolution validation.

Compact selected-tower controls show cost/stat changes without opening a full panel. Details pauses independently, quotes eligibility excluding only its own pause, then closes before authoritative mutation. Branch commitment has a confirmation. Closing clears panel refresh callbacks.

Progression separates Campaign stars/Sigils/milestones from Classic branches. Detailed upgrades show all prerequisites. Campaign results show exact star targets. Local, skippable hints and reusable Help explain controls/mode differences. Guide state is a separate device preference; cloud/API versions and gameplay definitions are unchanged.

Phone/landscape HUD geometry, menu spacing, Account/Close separation, readable panel text and stronger control borders were adjusted. Existing responsive Campaign, difficulty, leaderboard and result components are retained.

## Evidence

- Original baseline: 1067 tests passed, 11 pre-existing optional simulation skips.
- The worktree initially lacked ignored historical test assets. Original verification files were copied without editing. Complete checkpoint: 1107 passed, same 11 skips.
- Typecheck and production build passed. Existing large Phaser bundle warning remains.
- RED→GREEN recorded for geometry, gestures, scene drop transaction, Details context, prerequisites, guide fallback, Campaign overview, HUD bounds, keyboard placement, contrast, disposed-panel cleanup and detailed action success.
- Browser: eight screenshots at 360×640, 390×844, 640×360, 844×390, 768×1024, 1024×768, 1366×768 and 1920×1080; representative phone, landscape, tablet and desktop renders inspected.
- Browser: selected tower, reward, boss introduction, victory with pending rewards and Campaign results inspected on phone; Progression tabs and preparation requirements inspected.
- Browser mouse drag built one Ranger: gold 600→500. Scene tests cover duplicate releases and rejection under pause. Browser inspection does not substitute for touch hardware.
- Local ignored evidence: artifacts/responsive-ui/. DEV QA controls appear intentionally. No production score or account deletion generated.
- Local Worker uses an ephemeral CLI legacy-mode override for QA. Production configuration remains required-login; release verification must confirm it.

## Rulings

1. The host already excludes safe-area insets. GameScene uses host dimensions instead of subtracting them twice. Cost if wrong: further device-specific inset calibration.
2. Portrait HUD is 104px rather than preliminary 88px to contain 44px controls ending at y98. Cost: 16px less battlefield height.
3. Drop validation stays in handleTrayIntent instead of a forwarding finishTowerDrop method with no later consumer. Cost: scene-input tests cover drops rather than a separate entry point.
4. The existing design-system document is docs/DESIGN_SYSTEM.md; update it rather than create the plan's mistaken root path. Cost: none.

## Verification limits

Physical phone/tablet touch acceptance and a full live two-device battle playthrough have not been performed. Scroll-versus-drag thresholds and above-finger positioning need physical-device calibration. Browser dimensions verify rendering, not gesture comfort.

Release requires a fresh green suite/build, independent review fixes, production page/bundle/health/required-login checks and remote HEAD verification. Their results are recorded below when performed.
