# UI and UX audit — 2026-10-14

Scope: read-only audit of current source at f97ff05 plus local browser checks. No application changes. Light route; no delegated work. Preserve the existing fantasy art, Cinzel/Inter typography, slate panels, and bronze/gold hierarchy.

## Evidence and limits

Browser inspected guest entry, menu, Classic difficulty, Settings, Campaign map and Mastery, selected-tower combat with first-play guidance, and Classic leaderboard failure. Viewports: 1280×720, 390×844, 844×390, 844×320, and 320×568. Local Vite URL: http://127.0.0.1:5182. QA routes come from src/game/qa.ts. Account API failures on Vite are environment behavior, not production defects. Ignore the development QA panel when judging game controls; it obscures some bottom-right areas. QA difficulty navigation can leave an extra account button from the menu; duplicate buttons are not reported as production defects.

Impeccable detector over src/game/ui, src/game/scenes, and src/style.css returned `[]`. That detector does not validate canvas geometry or keyboard operation; browser observations below remain actionable. No hardware performance profile, screen-reader session, real mobile keyboard, signed-in Google flow, or exhaustive 100-mission playthrough was performed. No test suite or build was needed for this documentation-only audit.

## Implementation integrity and health

The implementation expresses a coherent, product-specific visual system. Existing shared controls, responsive sheets, prerequisite guidance, save warnings, and Campaign presentation helpers provide a good repair foundation. The weaknesses are interaction accessibility and scene-level geometry, not a reason to replace the art direction.

| Dimension | Score / 4 | Evidence |
|---|---:|---|
| Accessibility | 1 | DOM account controls are accessible; primary canvas navigation lacks focusable actions and semantics. |
| Responsive design | 2 | Phone layouts exist, but verified header, wrapped-text, and short-landscape failures remain. |
| Theming | 3 | Shared tokens exist; scene helpers and DOM overlays also hard-code palette values. A new theme is not requested. |
| Implementation integrity | 3 | Coherent system; repeated scene-specific button/layout handling creates drift. Detector returned no findings. |
| Performance | Unscored | No production timing or real-device frame profile; assigning a score would imply unperformed measurement. |

Measured/code-reviewed subtotal: 9/16. A complete /20 health score is withheld until performance is measured.

Nine findings: no P0, three P1, six P2. P1 means substantial usability/accessibility difficulty; P2 means friction with a workaround.

## Findings and acceptance checks

### 1. [P1] Primary canvas actions cannot be operated through keyboard focus

Evidence: src/game/ui/components.ts:72; src/game/scenes/MainMenuScene.ts:50; src/main.ts; index.html. Menu accessibility tree exposes the canvas as an image and the DOM account button, but no Campaign, Classic, Settings, or Progression actions. Shared buttons only bind pointer events. Gameplay hotkeys cover some commands, not the menu and sheet workflow.

Impact: keyboard-only users cannot navigate the core entry flow; screen readers cannot identify the canvas actions. Relevant WCAG criteria: 2.1.1 and 4.1.2. This is a targeted finding, not a full WCAG certification.

Recommendation: add a consistent accessible control layer for menu and sheet actions, with synchronized labels, enabled/selected state, visible focus, and keyboard activation. Reuse the existing DOM account-control pattern. Do not attempt to narrate every animation or battlefield object in the first repair.

Acceptance: without a pointer, open each menu destination, select difficulty, operate a sheet, and return; Tab order follows visible order, Enter/Space activate once, disabled actions cannot activate, and focus is visible. Verify DOM semantics and a screen-reader walkthrough. Suggested command: `$impeccable harden`.

### 2. [P1] Short-landscape Settings collides with its footer

Evidence: src/game/scenes/SettingsScene.ts:34,51,73,143. At 844×320, width chooses desktop controls, while rows retain a 47px pitch. Preferred-speed controls extend below the panel and share vertical space with Back to Keep. At 844×390 the same screen fits.

Impact: controls become visually ambiguous and difficult to operate on short windows or landscape devices with browser chrome.

Recommendation: choose the existing scrollable layout based on available height as well as width, or keep the settings content in a bounded scrolling region with a separate footer.

Acceptance: 844×320 and 844×390 have no overlapping rows/footer; all sound and speed controls are reachable; changes retain scroll and persist. Suggested command: `$impeccable adapt`.

### 3. [P1] Campaign rows do not account for wrapped text height

Evidence: src/game/scenes/CampaignScene.ts:414–428. At 320×568, Mastery milestone rows wrap with almost no separation, and the two-line Emberfall Highlands Sigil label overlaps the following Frostveil Pass Sigil row. Milestones advance by 42px and sigils by 32px regardless of text height. Codex has the same fixed-increment pattern at lines 449–468; its unlocked content was reviewed in code, not exercised.

Impact: achievement requirements become hard to read; later text can be covered by earlier rows.

Recommendation: advance by each returned text object's measured height plus a consistent gap, as openMissionScoring already does. Apply this to Mastery, Codex, and Preparation text rows that use fixed advances.

Acceptance: at 320px and 390px widths, the longest labels and unlocked tactical/stat descriptions have non-overlapping bounds and remain scrollable. Test real strings, including all sigil names. Suggested command: `$impeccable layout`.

### 4. [P2] Account controls cover headings and sheet titles

Evidence: src/game/ui/accountControls.ts:14; src/game/scenes/DifficultyScene.ts:280; src/game/scenes/LeaderboardScene.ts:122; src/game/scenes/CampaignScene.ts:382; src/style.css `.account-access`. At 390×844, the account button covers the right part of Choose Your Defense and Hall of Legends. In Campaign Mastery at 390px and 320px it remains above the canvas sheet title. At 320px, the map's mastery/sigil badge is also truncated beneath the account action.

Impact: headings and status information are obscured; opening a sheet leaves unrelated account navigation visually mixed with its close action.

Recommendation: reserve header space using the existing Campaign header helper approach; size badge text to the available width. Hide or reposition the account action while a full-screen sheet is open and restore it on close.

Acceptance: headings, progress badges, account action, and sheet close action have disjoint visible bounds at 320px, 390px, and desktop widths. Suggested command: `$impeccable adapt`.

### 5. [P2] Leaderboard recovery action falls below short viewports

Evidence: src/game/scenes/LeaderboardScene.ts:196–225. Reproduce `?qa=leaderboard&fixture=failure` at 844×320. The panel minimum height and fixed retry offset put Try Again partly below the screen. More verbose API or saved-retry guidance can also exceed the assumed text height.

Impact: recovery is less visible and less tappable exactly when the player needs it.

Recommendation: lay out the failure message using measured height and reserve a bounded region for Retry and Back; use existing scrolling behavior when the message cannot fit.

Acceptance: empty, loading, failure, stale-board, and long-error states at 320px height leave complete recovery actions visible or intentionally scrollable. Suggested command: `$impeccable harden`.

### 6. [P2] Escape exits Campaign while a sheet is open

Evidence: src/game/scenes/CampaignScene.ts:102. Browser reproduction: Campaign → Mastery → Escape returns to MainMenu rather than closing Mastery.

Impact: dismissing the current layer unexpectedly loses the player's place in Campaign navigation.

Recommendation: close the active sheet first; return to MainMenu only when no sheet is open.

Acceptance: Escape closes Mastery, Codex, Preparation, and Scoring to the same selected mission and map position; a subsequent Escape returns to the menu. Suggested command: `$impeccable harden`.

### 7. [P2] Preparation edits reset the player's scroll position

Evidence: src/game/scenes/CampaignScene.ts:382,489,499–504,520. Every targeting/preset/specialization edit reopens Preparation; makeSheet constructs a new ScrollSheet at offset zero. SettingsScene already demonstrates preserving `scrollOffset` around a redraw.

Impact: players repeatedly scroll back to the control they were editing, especially later specialization choices. Code-confirmed; unlocked preparation was not exercised in the browser.

Recommendation: retain the current Preparation scroll offset across a successful edit and clamp it if content shrinks.

Acceptance: editing a lower control keeps its section visible, deleting a preset clamps safely, and opening Preparation afresh starts at its intended initial position. Suggested command: `$impeccable harden`.

### 8. [P2] Reduced-motion handling differs across entry and phone screens

Evidence: src/game/art/menubg.ts:39 adds ten repeating motes. Desktop menu/difficulty/settings/leaderboard paths stop these tweens for reduced motion. LoginScene.ts:17 and the phone branches in DifficultyScene.ts:249 and SettingsScene.ts:170 call paintVista without that check.

Impact: players who requested reduced motion still receive decorative animation on entry and phone screens. Code-confirmed; OS preference emulation was not performed.

Recommendation: honor the preference inside the shared vista helper for decorative effects, preserving functional gameplay feedback. Avoid stopping every scene tween indiscriminately.

Acceptance: reduced-motion mode produces a static vista on login, phone/desktop difficulty and settings, menu, leaderboard, and results; essential state changes still communicate clearly. Suggested command: `$impeccable animate`.

### 9. [P2] Some actions commit on press instead of release

Evidence: src/game/scenes/MainMenuScene.ts:59; DifficultyScene.ts:34,204; LeaderboardScene.ts:160,192,227,248; compare src/game/ui/components.ts:81–89, which records a press and checks displacement on release.

Impact: touching an action immediately navigates or changes selection, preventing the familiar slide-away cancellation. The inconsistency is especially noticeable beside drag-safe sheet controls. Relevant WCAG criterion: 2.5.2; assess each action rather than declaring a blanket conformance failure.

Recommendation: retain scene styling but reuse the shared release/cancellation semantics, including pointer cancellation. No new button styling is needed.

Acceptance: a tap activates once; pressing then leaving or dragging cancels; touch cancellation and multi-pointer input never produce an accidental navigation. Suggested command: `$impeccable harden`.

## Recommended repair order

1. `$impeccable adapt` and `$impeccable layout`: fix short Settings, measured Campaign rows, header clearance, and leaderboard recovery geometry in one bounded repair pass.
2. `$impeccable harden`: correct Escape, preserve Preparation position, and standardize release behavior.
3. `$impeccable harden`: design and verify keyboard/semantic controls for menus and sheets; this has real scope decisions and warrants a separate spec before implementation.
4. `$impeccable animate`: centralize reduced-motion handling for decorative vistas.
5. `$impeccable polish`: verify visual hierarchy and spacing after the functional repairs, preserving the incumbent visual identity.

Run change-specific regression checks before any application deployment. Relevant existing tests include responsive-layout, guest-display-layout, campaign-ui-repair, campaign-map-layout, campaign-leaderboard-scene, account-ui, guest-entry-ui, and tower-tray-ui. Add geometry/interaction assertions for the actual defects rather than merely checking constants. Re-run the browser matrix and audit after repairs.

## Positive findings to preserve

- Guest entry explains local saves, cross-device sign-in, and browser-data loss; the HTML form has labels and status/error semantics.
- Most shared controls are 44px tall; ScrollSheet clips offscreen actions and prevents normal drag activation through release checks.
- First-play instructions explain tap/drag placement and offer dismissal; tower details expose upgrade cost and stat changes.
- Campaign separates mission score guidance, retained achievements, and current score era.
- Backgrounding pauses battle and asks for an explicit Resume; layout supports overview and touch camera controls.
- The existing artwork and restrained material palette are distinctive. A visual redesign, extra currencies, new navigation destinations, and new dependencies are unnecessary for these repairs.
