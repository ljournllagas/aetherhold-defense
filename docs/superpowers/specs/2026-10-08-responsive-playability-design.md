# Responsive playability

Date: 2026-10-08. Tier: Spec-only. Workflow route: Light.
Status: User approved; implemented and published. Chromium emulation and live smoke pass; physical-device verification was unavailable. Detailed evidence and WebKit capture limits are recorded in agent_docs/responsive_playability_2026-10-08.md.

Review: Round 1 of a maximum 3, read-only spec-reviewer, score 9/10, zero blockers, zero advisory items. The reviewer checked completeness, ambiguity, testability, consistency, scope, vocabulary, and Spec-only executability. This is a design review, not verification of implemented browser behavior. No implementation plan is required after approval.

## Purpose and approved scope

Make Aegis of the Borderkeep fully playable on phones and tablets in portrait and landscape, with readable controls and deliberate touch actions. Preserve the existing game balance, original artwork, desktop mouse behavior, and score contract.

The user confirmed both orientations, proportional overview with pinch zoom and drag-to-pan, expandable controls, touch preview/confirm/cancel for tower building and Meteor, next-wave information on small screens, background pause with explicit Resume, and rotation preserving run and interaction state. The user accepted a 360px minimum portrait width and 44px minimum touch targets in the scope confirmation.

This spec expands the orientation requirements in docs/SPEC.md section 35 and replaces the phone rotate-notice fallback. Existing gameplay and reward rules remain authoritative. Where an existing design rule prevents the responsive requirements here, this spec governs layout and input only. Update the responsive portions of docs/SPEC.md and docs/DESIGN_SYSTEM.md during implementation to reflect the approved change.

## Current evidence and opportunities

- src/game/ui/layout.ts independently scales a 1040 by 584 battlefield to the available field. Portrait would distort map proportions.
- GameScene.drawHUD imposes a 96px metric spacing floor. drawCatalog puts all five tower cards in one compact row. Compact tower commands start at x=420 and derive widths from viewport width minus 440. Those rules cannot serve 360px phones.
- GameScene handles placement and Meteor on pointerdown, which must be separated from drag and pinch.
- PreloadScene uses a fixed 420px loading bar. Relic panels retain side-by-side artwork/details even at narrow widths.
- Existing verification covers 1440x900, 1280x720, 1024x768, and 844x390. Portrait devices need additional coverage.
- Prior release evidence in agent_docs/latest_session_work.md records about 31 MB of images and JavaScript. Staged loading is a valuable separate follow-up, explicitly deferred here.

These are source-derived constraints, not a claim that new device testing has already passed.

## Approaches and chosen design

1. **Recommended: retain Phaser, introduce explicit responsive layout and view transform, and isolate gesture interpretation and UI state.** Keeps rendering and simulation integration intact, with pure geometry/input helpers suitable for unit tests.
2. Replace controls with HTML overlays. Native scrolling and text layout help, but duplicating lifecycle and focus handling adds avoidable synchronization work.
3. Scale the current desktop composition. Cheapest initially, but fails readable text, deliberate touch targeting, and minimum hit-area requirements.

Use approach 1. No new framework or product dependency is required. Do not migrate rendering or create a second simulation.

## Responsive composition

Measure the actual game-root content box and dynamic viewport; reserve device safe-area insets. Set viewport-fit=cover and supply safe-area values to canvas layout. UI bounds are CSS pixels independent of device pixel ratio. Use ResizeObserver/scale resize to synchronize the canvas with its host. Recompute when browser chrome, orientation, host size, or the player-name keyboard changes usable height. Avoid duplicating resize subscriptions.

Supported baseline: portrait 360x640 and landscape 640x360, plus larger phone, tablet, and desktop sizes. Smaller temporary visual viewports caused by the keyboard use scrollable form/modal content; gameplay remains paused while a pause/modal flow is active. Smaller permanent devices are outside the acceptance baseline, but must not crash.

- **Narrow layout:** usable width below 768px. Two HUD rows, 104px total, showing wave, gold, lives, score, difficulty, speed, and Pause. Bottom action tray 64px tall, containing Build, Start Wave, and More. More exposes Relics, Next Wave, and Reset View. A selected tower replaces the sheet content, not the persistent Pause control.
- **Short layout:** width at least 768px and usable height below 540px. One 56px HUD row and 64px action tray. Secondary controls use sheets; no desktop inspector. All metrics must fit without collision.
- **Tablet layout:** width at least 768px, usable height at least 540px, width below 1180px. One 56px HUD row and 80px action tray. Sheets hold build and selected-tower controls.
- **Desktop layout:** width at least 1180px and usable height at least 540px. Retain the 240px inspector, 56px HUD, and 80px tray, with proportional battlefield fitting.

The remaining rectangle is the battlefield viewport. At overview, fit the entire map proportionally, centered, and fill unused space with the existing deep background. Do not stretch axes separately. Screen-space HUD, sheets, boss health, messages, and modals never zoom with the map.

Use at least 14px body/control text and 12px supplementary text. Every actionable touch hit area is at least 44x44 CSS pixels, with at least 8px separation between adjacent actions. Text wraps or uses sheet scrolling rather than overlapping or reducing below these sizes. Decorative artwork may shrink before text or actions do.

One control sheet can be open at a time. Opening Build clears tower selection; selecting a tower replaces Build/More with its inspector. Sheets cover at most 50% of battlefield height and scroll internally as needed, with a fixed accessible Close action. Below that limit, at least half the battlefield viewport remains exposed. Drawers block map input over their own area and do not implicitly pause combat. Opening a sheet cancels an uncommitted touch preview but retains its placement/targeting mode; closing it restores that mode's prompt. Opening unrelated build/tower actions during Meteor targeting is disabled until Meteor is confirmed or canceled.

Build sheets use two columns in narrow portrait, switching to one if two cannot satisfy text and target sizes; remaining layouts can use rows/grid according to measured available space. All five tower names, roles, and costs are accessible. Tower sheets expose current stats, next-upgrade stats/cost, all five targeting modes, Upgrade, Sell, and Close. Disabled upgrade states show unaffordable or final-level reasons. Relic sheets expose all three inventory slots, names, descriptions, and existing activation/keep actions; empty slots cannot activate anything.

Next Wave displays the complete existing wave composition and boss warning before a wave starts, scrollable if necessary. During combat, it displays the active wave status. Start Wave retains all current eligibility rules and visibly reports the reason when unavailable. Boss health remains visible above sheets without blocking Pause.

## Battlefield view and gesture contract

Keep all simulation positions, paths, ranges, effect radii, and plot coordinates in the current world space. The single view transform provides forward and inverse mapping for map art, entities, range/selection effects, targeting, and hit testing. World y=56 is the top of the 584-unit battlefield.

Overview zoom is 1. Zoom range is 1 through 4 relative to the fitted map scale. Pinch anchors the world point under the two-finger midpoint. Clamp pan so the rendered map covers the viewport on axes where it is larger; on smaller axes keep it centered. Reset View returns to overview. Provide screen-space Zoom In, Zoom Out, and Reset View in More for mouse/hybrid devices; steps multiply/divide zoom by 1.25. Desktop scroll wheel behavior stays unchanged.

Touch/pen actions use the gesture path; mouse retains existing single-click placement and Meteor behavior. Determine this from the current pointer's type, not a device-wide assumption.

- A one-pointer contact in the battlefield starts a candidate tap. Total movement above 8 CSS pixels from its start becomes pan and suppresses the tap. Pan applies only when the map exceeds the viewport on that axis.
- Adding a second contact turns the entire contact sequence into pinch. Neither contact may commit an action when it is released; the sequence resets only after all contacts are released.
- A completed candidate tap is interpreted on pointerup. UI contacts never participate in battlefield gestures. Contacts started outside the battlefield cannot become map gestures by entering it.
- Pointer cancel, lost capture, opening a modal, resize, or backgrounding cancels the in-progress gesture. No gameplay action fires from canceled contacts.
- Drag or pinch retains an already selected touch preview, updating its projection; it does not commit or silently relocate it.
- Blank overview margins reject map selection and targeting. Valid map taps map through the inverse transform exactly once.

Touch plot/tower selection uses at least a 44px screen-space hit diameter, independent of zoom. When enlarged hit areas overlap, choose the nearest projected plot/tower center; exact ties use the stable plot index or tower ID. In build mode, occupied/invalid plots remain selectable for explanatory feedback. Tower selection is available only outside build/Meteor mode.

Show a brief inline gesture hint the first time a run enters the touch battlefield: tap to select, drag to pan, pinch to zoom. It can be dismissed and does not block gameplay or require a tutorial subsystem.

## Touch actions and interruption states

**Build:** choose a tower, tap a plot, inspect a range/cost preview, then Build or Cancel. Another valid tap replaces the preview. An invalid plot displays the existing rejection reason and disables Build. Confirm rechecks occupancy and gold against current run state and builds exactly once. Cancel exits placement, clears the preview, and spends nothing. Mouse behavior remains single-click.

**Meteor:** choose the existing relic use action, tap within the map to preview the existing blast radius, then Cast or Cancel. Valid targets are inside the canonical battlefield bounds. Confirm revalidates the reserved relic and run state and applies exactly once at the selected world point. Cancel follows RelicVault.cancelTarget, returning the reserved relic to its existing inventory/pending source without consumption. Preserve the existing full-inventory use-oldest/store-new flow; no reward duplication or loss.

Confirmation/cancel actions stay in a screen-space strip immediately above the action tray, with labels, cost where applicable, and at least 44px hit targets. Opening a control sheet clears the uncommitted preview and temporarily hides this strip; closing the sheet restores the retained mode's prompt and cancel action. This keeps the smallest landscape sheet usable without overlapping actions. The strip may overlay the battlefield but never overlaps another action or boss-health UI. If the finger obscures the preview, release leaves the preview visible for confirmation.

Do not pause combat merely for a build/Meteor preview. Enemy movement can continue, so Meteor confirms a location rather than an enemy snapshot. Changing tower type clears the preview. Defeat, restart, and quit clear previews, camera state, contacts, and listeners. Victory behavior remains the game's existing behavior.

**Pause:** track user pause, modal pause, and background pause as independent reasons; simulation runs only when no reason applies. Existing modal rules continue to pause combat. Opening/closing pause settings preserves its existing UI state through resize.

**Background:** page visibility becoming hidden cancels contacts and sets background pause, including during modal/targeting flows. Freeze game-time simulation, spawns, projectiles, timed relic effects, reward timing, animations, and audio. Hidden wall-clock time contributes neither simulation elapsed time nor score duration. On visible, retain the background reason and show Resume above the preserved UI. Resume clears background pause only; an existing user pause or reward modal still blocks simulation. When background pause was the sole reason, Resume returns directly to the preserved control state. Restore audio according to existing settings only after an explicit user gesture.

**Rotation/resize:** preserve run ID, gold, lives, wave, enemies, tower selection/targeting modes, chosen build type/plot, Meteor reservation/point, relic inventory, pending reward order, modal type/payload, pause settings, and pause reasons. Preserve camera zoom and world center, then clamp to the new viewport. Rebuild presentation without replaying rewards, restarting modal timers, spending currency, sending scores, or attaching duplicate listeners. Cancel only the active contact sequence. Orientation does not change game speed or trigger automatic Resume.

**Form keyboard:** Difficulty/player-name inputs remain readable above the on-screen keyboard. Their draft text and selected difficulty survive resize. Closing the keyboard restores the correct layout. Menu transitions, restart, and scene shutdown release all added listeners/observers and clear interaction state.

## Other screens and failure behavior

Loading, menu, difficulty/name entry, settings, game over, leaderboard, pause settings, reward reveal, and full-inventory decisions must meet the same bounds/text/touch requirements in both orientations. Loading bar width is min(420px, safe width minus 32px). Titles wrap or reduce decorative prominence while remaining legible. Narrow relic modals stack artwork, text, and actions; short modals scroll their content with reachable actions. Menus and leaderboards may scroll their panel content without allowing body scroll or map gestures.

Preserve current loading error reporting, leaderboard loading/empty/error/retry behavior, stale-response rejection, and score submission lifecycle. Resizing must never turn an error into an empty state. No new external service is introduced. Offline leaderboard failures remain explicitly visible and retryable. This change does not claim offline gameplay availability or persistence after browser termination.

## Implementation boundaries and sequencing constraints

- src/game/ui/layout.ts: pure safe viewport/layout metrics; extend with explicit layouts rather than scattered scene width checks.
- New src/game/ui/viewport.ts: pure proportional fit, zoom/pan clamping, forward/inverse coordinate projection, and nearest screen-space hit selection.
- New src/game/systems/PointerGesture.ts: testable gesture states and emitted tap/pan/pinch/cancel intents, separate from economy/combat mutations.
- GameScene.ts: consume those helpers; keep durable interaction/modal state separate from display objects; connect confirm/cancel to current economy and RelicVault methods. Factor sheet rendering into a cohesive ui module if needed.
- main.ts, style.css, index.html: safe-area/dynamic viewport host sizing, multi-pointer support, and removal of mandatory rotate prompt. Enable at least two simultaneous touch contacts using the installed Phaser API.
- All affected scene files and ui/components.ts: responsive panel sizing, scrolling, wrap, safe input fields, reachable controls, resize cleanup.
- Pause handling: centralize reason tracking in a small pure helper and gate GameScene update/timers/tweens/audio through it; use existing SoundManager lifecycle rather than a new audio engine.
- Existing tests plus new layout/viewport/gesture/pause tests: extend assertions, never relax accepted gameplay/score coverage.

Geometry and gesture contracts precede scene integration; durable modal/interaction state precedes resize rebuilding; verification precedes deployment. Keep tests and helpers independent of Phaser rendering where feasible. Preserve unrelated files and assets. No Git repository exists here, so saving/reviewing is possible but committing is unavailable unless the user supplies a repository; do not initialize one as part of this spec.

## Acceptance and verification

All criteria below must pass before claiming responsive support or deploying.

Viewport matrix in CSS pixels: 360x640, 390x844, 640x360, 844x390, 768x1024, 1024x768, 820x1180, 1180x820, 1280x720, 1440x900. Include simulated nonzero safe-area insets and dynamic height changes. Test phone touch and tablet touch, plus desktop mouse and hybrid pointer-type switching.

1. Every listed screen fits the safe bounds. No unintended clipping, overlapping labels/actions, inaccessible scroll content, or body overflow. Body text and hit areas meet specified sizes. No rotate requirement blocks gameplay.
2. Camera round-trip tests recover points at overview and zoom with nonzero field origin; pan clamp, letterbox rejection, midpoint anchoring, and min/max zoom pass. All plots and route endpoints are visible at overview. All plots remain reachable when zoomed.
3. Gesture tests prove tap on release, 8px threshold, drag suppression, two-contact suppression until all contacts end, cancellation, and UI-contact exclusion. No drag/pinch spends gold, casts Meteor, selects an accidental tower, or starts a wave.
4. Native touch flow at every phone/tablet size covers build preview/cancel/confirm, insufficient gold, occupied plot, tower select/upgrade/sell, all targeting modes, all three relic slots, Meteor preview/reposition/cancel/cast, next-wave composition, boss status, Pause, and Resume. Native mouse smoke flow covers immediate placement, immediate Meteor, and existing keyboard shortcuts.
5. Rotate portrait to landscape and back during combat, build preview, Meteor preview, pause settings, reward reveal, full-inventory choice, and leaderboard loading. Preserve the state named above; no double build/cast/reward/score submission and no listener accumulation over five rotations/restarts.
6. Background for at least five seconds during active combat, paused gameplay, Meteor targeting, and reward decisions. No game-time, spawns, damage, gold/lives, effects, or score duration advance. Returning does not resume until tapped; other pause reasons remain effective. Audio obeys settings after Resume.
7. Player-name keyboard open/close retains draft input and reachable start action. Leaderboard loading, empty, failure/retry, and delayed stale filter responses remain distinct on narrow screens. Loading error text and game-over actions remain reachable.
8. Run npm test and npm run build, preserving all existing assertions. Record native browser interaction results/screenshots with viewport and pointer type; emulation evidence must be identified as emulation. Check an actual phone browser and tablet browser when available; if unavailable, report that limitation explicitly and do not claim physical-device verification.
9. No console errors or unhandled rejections in those flows. Reuse existing performance QA to compare normal/heavy-wave desktop cadence and record the same-browser before/after measurements; investigate a median frame-time regression above 10% rather than relabeling it a pass. Phone/tablet performance observations are recorded with device/browser and rendering mode, without promising a new fixed FPS target.

During implementation, use browser emulation on Chromium and WebKit where the available harness supports them. If a required browser/device check cannot run, list the exact missing coverage for user disposition before claiming full verification.

After successful application verification, npm run deploy is already authorized by AGENTS.md and must run tests and build before publishing. Verify the live HTML, its referenced current JavaScript bundle against the local deployment build, and /api/health. Perform a live menu and responsive gameplay smoke test without intentional leaderboard writes. Report the live URL and any failure; deployment is not part of this documentation-only stage.

## Deliberate exclusions

Staged loading/asset recompression, new maps/towers/relics, balance changes, campaign/progression, save-and-resume across browser termination, offline installation, new anti-cheat systems, and a full tutorial are separate work. No persistent score-version change is required. This spec remains one coherent responsive-playability change.
