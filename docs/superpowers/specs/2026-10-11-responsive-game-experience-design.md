# Responsive game experience

Status: scope confirmed; awaiting independent specification review and user approval.
Tier: Full. Execution route remains Light; implementation method is selected after plan approval.

## Purpose and scope

Make the complete player journey understandable and usable on touch phones, tablets, and desktop, prioritizing battlefield controls and progression explanations. Retain the dark fantasy identity. Improve existing rules' presentation, not their balance. Preserve Google login, account isolation, cloud progress, score submission, campaign preparation, and all existing unlock semantics.

Cover Login/Account, main menu, difficulty selection, Campaign map/preparation, battlefield, detailed control sheets, Progression, Help, settings, leaderboard, and result/victory screens. No new quests, achievements, rewards, combat mechanics, resuming unfinished battles, account APIs, or save migrations. Do not require purchases or additional dependencies for visual polish.

## Chosen approach and alternatives

Recommended and selected: adapt existing Phaser layouts, control sheets, view transforms, and progression models. Use a visible tower tray and contextual inspectors on compact screens; keep a persistent side inspector where width permits. This preserves familiar controls and concentrates new behavior in placement gestures and explanatory views.

Alternative: persistent detailed inspector at every size. Rejected by the user because it consumes scarce battlefield space. Alternative: rewrite all controls as a separate DOM interface. Not selected: it duplicates input ownership and adds integration risk without being required for this scope. Existing accessible DOM Account controls remain.

## Responsive layout and visual hierarchy

Support portrait and landscape without forced rotation. Layout responds to actual available CSS viewport size and safe-area insets, including browser chrome changes. Initial verification sizes: 360×640, 390×844, 640×360, 844×390, 768×1024, 1024×768, 1366×768, and 1920×1080. Below 360px width or 360px height, preserve reachable controls and scrollable panels; no claim of optimized gameplay below that boundary.

Primary actions have at least 44×44 CSS-pixel hit targets with no overlapping hit areas. Essential HUD labels and controls use at least 14px text, explanatory body text at least 16px, and secondary compact labels at least 12px. Normal text targets 4.5:1 contrast, large text and meaningful control boundaries 3:1. Lock/affordability/selection states use words or icons as well as color. Use existing tokens and artwork; simplify decoration that obscures labels.

Keep gold, lives, wave state, Pause, and Overview visible. Distinguish tower choices from Relics and the wave action. Primary wave action explicitly says Start wave, Resume, or the existing victory decision; it never silently changes into a purchase. Audio/speed/Auto remain accessible through existing controls. Drawers may scroll internally, never put their Close or main navigation action outside the viewport. Account/sync errors remain readable.

On portrait phones the compact selected-tower inspector sits above the tray and can be dismissed; no selected tower means no inspector. On short landscape devices it is a compact overlay positioned away from the selected tower where possible, with a close action and Details access. Do not cover Pause or wave controls. On spacious desktop retain a right inspector. A compact inspector shows name, level/rank, cost, major next-upgrade benefit, quick upgrade, and Details. Sell and targeting remain accessible in Details. Detailed panels may occupy most of the screen and scroll.

Fit the full battlefield using the existing Overview transform. Pan and zoom remain available; never alter world-space plot geometry or attack ranges to fit a screen. Menus, Campaign cards, results, and leaderboard use responsive wrapping and internal scrolling instead of clipped fixed coordinates. Resizing retains battle state, selection when valid, and scroll/guide state; cancel any unfinished gesture without spending gold. Do not restart an active battle on resize.

## Tower tray and gesture contract

All five existing base towers appear in stable order with portrait/icon, name, current build price, and affordability. A horizontally scrollable tray accommodates narrow widths; an edge cue indicates additional choices. Controls outside the tray do not scroll with it. A disabled purchase can still expose its role and insufficient-gold explanation.

Touch contact on a tray card starts undecided. A release within 10 CSS pixels selects the tower for tap placement. After exceeding 10px, horizontal movement with |dx| >= |dy| owns tray scrolling; movement toward the battlefield with |dy| > |dx| owns tower dragging. Movement away from the battlefield cancels selection. Once assigned, ownership does not switch until all contacts end. Horizontal scrolling cannot build or pan the map. Mouse/stylus card movement beyond 6px begins dragging in any direction; click selects. No long press. Moving a placed tower is out of scope.

During tower dragging suppress battlefield pan, tower selection, and ordinary tap placement for that pointer. Highlight available build plots and show a tower ghost, range, price, and valid/invalid reason. Touch ghost/target anchor is 48 CSS pixels above the finger; mouse/stylus anchor is the pointer. The highlighted plot is the exact plot checked on release. Snap to the nearest plot center within 28 CSS pixels of the anchor; ties select the lowest plot index. Occupied plots may be targeted but show Occupied; unaffordable placement shows the gold shortage. Revalidate affordability, occupancy, lifecycle, and placement rules at release through the existing shared build action.

Valid drop commits exactly one tower and charges exactly once; select the newly built tower and show its inspector. Invalid drop cancels without charge and shows a brief reason. End the drag and return the tray to idle in either case. Pointer cancellation, release outside the app, second contact, resizing, hiding the page, opening a panel, pause, restart, quit, or terminal result cancels without placement and clears highlights. A second contact cancels the tower drag before handing contacts to pinch zoom; releasing either finger must not generate a tap/build. No accidental purchase from a scroll or pinch.

While dragging, an anchor inside the battlefield's 32px edge band pans at a continuous speed from zero at the band's inner edge to 180 CSS pixels/second at the outer edge, clamped by existing camera bounds. It never pans while the anchor is over HUD/tray/inspector or outside the battlefield. Recompute target from the current transform each frame; never use a stale plot after panning. Overview cancels placement before restoring the full map.

Tap placement remains an equal alternative: tap a card, tap a circle, see Touch preview, then confirm Build or Cancel. Use this confirmation on desktop tap/click too. Invalid previews explain why confirmation is unavailable. Existing hotkeys retain meanings; neither keyboard users nor players unable to drag must be required to drag. Visible guidance explains the alternatives.

## Detailed panels and pause ownership

Detailed tower upgrades, evolution comparisons, prerequisite information, in-battle Progression, and Help pause simulation and Auto actions using a panel-owned pause reason. Compact selection and quick foundation upgrades do not pause combat. Preserve user, background, and other modal pause reasons independently; closing a detailed panel removes only that panel's reason. If another reason remains, show Resume and stay paused. Nested panel navigation retains panel pause until its final exit. Returning from a hidden page still requires existing explicit Resume.

Detailed panels are read/compare views while combat is paused. Purchasing an evolution, evolution rank, mastery, selling, or changing targeting from Details first closes the panel and removes only its pause, then revalidates through existing rules. If user/background/terminal state still blocks actions, explain it and perform no mutation. Branch purchase confirmation states that commitment is permanent for this tower; confirming performs that close-and-revalidate sequence. Never bypass existing purchase guards to allow an action during pause. If revalidation fails, return to Details with a fresh reason and panel pause. Quick foundation upgrades remain one action using current state and cost.

## Progression presentation

Reuse authoritative Campaign and Classic definitions and repository views. Do not duplicate numeric rules in UI constants or infer eligibility from text labels. Derive a read-only prerequisite checklist separately from purchase execution so all applicable prerequisites can be displayed even when the engine returns only its first failing reason. Purchase execution remains authoritative and revalidates current state.

Every upgrade detail shows current stage, next stage, gold cost/current gold/shortage, before-and-after relevant stats, benefits, drawbacks, and all unmet conditions. Use plain-language firing speed descriptions alongside any attack-interval number so a lower interval is not misrepresented as slower. Show maximum level/rank and mastery numeric-limit states explicitly. Distinguish permanent account achievements, current-tower stages, and current-run gates. Show permanent branch commitment before purchase.

Classic: show foundation levels 1–4, defeat of the wave-10 boss, starter versus alternative branches, evolution ranks 0–3, and Endless mastery. Alternative branch achievements require retaining the appropriate starter-branch tower at rank 2 or higher when wave 20 completes. During a run show each applicable condition separately: qualifying tower/rank and wave completion; On track means not yet earned. After the checkpoint has passed without qualification say Try in a new Classic run. Earned achievements never appear locked merely because the current run lacks the qualifying tower. Mastery requires completed evolution and Endless; Campaign must not display these Classic gates.

Campaign: show sequential level requirements from the existing contiguous-completion rule, each level's completion/lives/score stars with its actual configured thresholds, total collected stars, star milestones, World Sigils earned by completing their configured levels, and the features those unlock. Explain preparation presets at the configured 20-star threshold and specializations at the configured 30-star threshold using imported definitions, not hardcoded copies. Specializations are sidegrades chosen during preparation; show both advantages and tradeoffs, not account-wide power upgrades. Results show earned stars, missing-star targets, newly available content, and the valid next level/replay action.

Central Progression has separate Campaign and Classic tabs, reachable from menu and in-battle Help/More. Preserve current/legacy personal-best information. Outside a battle display permanent progress only; do not fabricate current-run conditions. Campaign cards lead to their existing level/preparation view; in-battle links do not leave/discard a battle without the existing quit confirmation. Locked action explanations can open relevant prerequisites even though the purchase button is disabled.

Choose next-step guidance deterministically: first unmet prerequisite in gameplay dependency order, then gold shortage when structural gates are satisfied. Campaign overview recommends the next sequential unlocked unfinished level; when all levels are complete, recommend the lowest-numbered level missing a star and name its missing target. When all stars are earned, show Completed rather than inventing a quest. Classic overview shows each tower branch's next step without creating persistent tracked quests.

Account-owned progress refreshes after existing sync completes. Preserve selection/scroll when possible. Earned, pending sync, unavailable storage, and sync failed are separate states; never call an unsynced achievement Saved to cloud. Empty profiles show attainable first steps. Newer/unreadable data uses existing warnings and does not fabricate progress. Cloud sync failure must not prevent reading Help or block an otherwise authorized offline battle.

## Contextual guide and Help

A short skippable guide covers tower tray/tap/drag placement on first gameplay entry, selecting/upgrading after the first placement, and prerequisites when first opening upgrade/locked content. Hints do not demand an unavailable action, spend resources automatically, wait for wave 20, or block battle controls. Dismiss/Skip is always visible. Help can replay instructions and explains camera gestures, Overview, waves, Relics, Auto, Campaign stars and Classic evolution distinctions.

Guide completion is local device preference, not cloud progress, keyed by guide version. Storage failure falls back to session memory and does not gate play; switching accounts does not expose account data in generic Help. Guide overlays do not consume a placement pointer or cause a purchase on dismissal. Instruction reading follows the detailed-panel pause contract; brief nonblocking control hints do not pause. Honor reduced motion for UI transitions and keep all information understandable without animation or sound.

## Architecture and state flow

Retain existing layout/view-transform, PointerGesture, control-sheet, PauseState, evolution purchase, Campaign repository, and account interfaces. Give tray gesture ownership one explicit state machine (idle/undecided/scrolling/dragging/cancelled), returning intentions to the scene; the scene owns placement mutations. Keep responsive dimensions independent of campaign progression. Put prerequisite presentation into reusable pure view models consumed by contextual panels and Progression. Use existing UI components/tokens rather than per-screen copies. UI reads account projections but does not change sync policy.

## Acceptance and verification

1. At every listed viewport, essential actions are visible/reachable, no text/actions are clipped, and panels scroll without scrolling/purchasing the battlefield. Test selected/unselected tower, long explanations, full Relic inventory, boss HUD, rewards, victory, defeat, empty/max progression, Account errors, and long nickname/leaderboard content.
2. Automated gesture checks distinguish tap, horizontal scroll, drag, pinch and cancellation; transformed/zoomed targets and edge panning place exactly the highlighted valid plot. Rejected drops and all cancellations leave gold/tower count unchanged. Valid drop spends once. Tap confirmation and mouse placement pass equivalent mutation checks.
3. Pause tests prove simulation/Auto stay stopped in Details, nested close preserves other reasons, and every detailed-panel mutation closes/revalidates without bypassing user/background/terminal guards. Fast gestures and repeated clicks cannot double-purchase.
4. Prerequisite view tests cover multiple unmet gates, completed/missed Classic checkpoint, maximum ranks, Campaign threshold boundaries, all-earned/empty progress, pending sync and storage failure. Compare against existing authoritative domain behavior. No changes to balance/save versions/cloud endpoints.
5. Resize/orientation tests preserve an active run and cancel drags. Verify pan/pinch and Overview after cancellation; lifecycle subscriptions clean up on scene shutdown.
6. Inspect actual rendered app at phone portrait, short landscape, tablet and desktop sizes. Independently report emulator coverage versus real touch hardware; physical touch acceptance is needed to claim actual-device gesture usability. Do not claim hardware verification from screenshots alone.
7. Run appropriate existing tests, full test suite/typecheck/build, then authorized production deploy. Verify live page/current bundle/health. Commit/push approved artifacts and verified changes; confirm local HEAD equals remote. Record any concrete remaining limitation.

## Known design risks

Directional drag versus scrolling needs real touch calibration. The offset anchor must remain visually explicit to prevent surprise drops. Short landscape height requires compact HUD and bounded panels. Plain-language prerequisites must distinguish Campaign sidegrades from Classic evolutions. Current visual companion diagrams are reduced-scale layout illustrations, not evidence of final readability or usable touch behavior.
