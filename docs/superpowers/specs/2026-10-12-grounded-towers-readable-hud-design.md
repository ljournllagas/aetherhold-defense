# Grounded towers, readable boss HUD and menu, earned live score

Date: 2026-10-12 (Asia/Manila)
Tier: Spec-only. Execute directly after written-spec approval; no implementation plan.

## Intent and agreed scope

Fix the four issues demonstrated in the user's screenshots: hovering towers,
boss information overlapping the mobile tower tray, a Campaign score of 945
before combat, and menu title/score text blending into the painted background.
Retain the existing fantasy visual identity. Cover Classic and Campaign, phones,
tablets, desktop, portrait/landscape, resize, safe areas and camera zoom.

The user confirmed that the live SCORE starts at zero and contains earned combat
points; remaining-lives and unused-gold bonuses are added only at completion.
Final scoring rules, score era, saved records and Campaign mastery thresholds
retain their existing meaning.

## Evidence and approach

- `src/game/art/towerArt.ts` anchors each tower's bottommost occupied atlas row
  at the build plot's center. Its shadow sits at local y=2. Circular clearings
  in `src/game/art/terrain.ts` extend below that center, so the visual base sits
  toward the back of the circle. Campaign production textures use the full
  image's bottom rather than measured occupied bounds, which must also be checked.
  The screenshots demonstrate the visual defect; exact footprint anchors require
  measurement of the loaded textures during implementation.
- `GameScene.drawBossBar()` places compact content at x=88 and
  height-tray+10 with a fixed 136px width, inside the tower tray in portrait.
  `gameLayout()` already exposes separate field, trayBounds and waveBounds.
- `scoreSoFar()` calls the terminal calculator with current lives and gold.
  Campaign starting values yield floor((20*30 + 600*0.05)*1.5)=945.
  `finishCampaign()` also calls `scoreSoFar()`, so changing that function alone
  would unintentionally reduce final Campaign scores.
- `MainMenuScene` uses 12px subtitle and best-score text over a painting with
  only a 0.24-alpha global veil. Best lines have fixed 16px separation even
  when wrapping.

Chosen approach: shared footprint anchoring, a responsive dedicated boss panel,
explicit live-versus-final score calculation, and measured menu text layout with
a local dark backing. Alternatives are device-specific offsets (fragile on
resize) and repainting tower/menu assets (larger asset change than necessary).

## Tower ground contact

Keep Tower.x/y, build plot centers, targeting/ranges, collision policy and camera
projection as the canonical gameplay coordinates. Change the visual geometry in
`towerArt.ts`, not the build plots or gameplay positions.

Represent the center of the visible ground footprint as local (0,0). Determine
its position within each source image/frame, accounting for transparent padding
and the base's front edge. Position the sprite so that the footprint center lies
on the build plot center and the front edge extends naturally toward the front
of the circle. Place the contact shadow at that same ground contact, behind the
base; a shadow must not merely conceal a remaining vertical separation.

Use one explicit per-art geometry contract for sprite placement, displayed bounds,
shadow and projectile muzzle offsets. Recompute muzzle positions relative to the
shifted art so shots still originate from the weapon. Keep camera framing/selection
metadata consistent with the displayed silhouette.

Cover all five tower families, all four foundation stages, all three Campaign
visual tiers, fallback tier overlays, Classic evolution decorations and mastery
visuals, and uncommitted placement previews. Decorations share the base transform
and must not drift after rebuilding a tower on upgrade. Missing Campaign art
continues to use the existing fallback, with the same ground-contact contract.

Acceptance: no visible strip separating the tower base from its contact shadow or
plot; the base appears centered on the clearing rather than perched on its rear
edge. At native screenshot size, the measured footprint center projects within
one CSS pixel of the projected plot center. Verify at overview and zoomed views;
transparent padding never creates a gap. Empty plot markers remain readable.

## Dedicated responsive boss panel

Replace the compact tray overlay and desktop fixed-position assumptions with a
shared boss-panel layout derived from `GameLayout.field` and safe insets. Anchor
the panel eight pixels inside the top of the field, centered horizontally, with
width min(440, field.width-16). It is a screen-space overlay, so camera movement
does not move it. It may cover a narrow strip of battlefield, but never HUD,
tower tray, wave controls, inspector, or touch targets.

Use an opaque dark backing, visible border, a name row, a separate status row
and a health track with contrasting fill. Name text is at least 14 CSS px;
status at least 14 CSS px; track at least 8 CSS px. Wrap a full boss name to
available width instead of shortening it or shrinking below the minimum. Compute
panel height from measured text plus padding, with at least 8px between rows
and track. Numeric status is `HP N%`, with Campaign phase or Classic enrage
alongside it; wrap status if needed. Clamp percentage/fill to 0–100%; preserve
ceil rounding of the existing numeric percentage.

Show only while a live boss exists; remove immediately on death, escape or reset.
Pause preserves current data. Rebuild/reposition on resize or orientation change.
Restore ordinary wave status visibility when the boss leaves. Modal/control-sheet
layers remain above the panel; reopening/closing them cannot leave stale content.
The panel must not capture battlefield input. For very short landscape fields,
fit the measured panel within the field by compact padding/row spacing while
retaining 14px text and an 8px health track; if a name wraps, use the needed
height rather than overlaying its status. Supported minimum viewport is 360x360.
When the compact selected-tower inspector would occupy the same top-of-field
space, move the inspector below the boss panel if both fit. Otherwise route its
actions into the existing tower control sheet, keeping the tray selectable;
do not cover the boss panel with a second persistent inspector. An intentionally
opened sheet/modal may temporarily cover it and restores it on close.

Acceptance: full name, percentage, phase/enrage and fill are distinguishable and
neither clipped nor mutually overlapping at all verification viewports. No boss
content overlaps tower choices or Relics/More/Start Wave controls. Cover all three
Campaign bosses and the longest Classic name, full and low HP, and disappearance.

## Earned live score and final settlement

In `ScoreSystem.ts`, expose an explicit live-score operation using the existing
kill (including elite), completed-wave and boss components and difficulty
multiplier. Live score = floor((killScore+waveBonus+bossBonus)*multiplier).
Use existing component rules rather than duplicating tuning constants.

`GameScene.scoreSoFar()` uses that operation. Building/selling, spending/earning
gold and losing lives cannot change earned live points. A new or restarted battle
shows 0, including after pre-wave tower purchases. Uncompleted waves earn no wave
bonus; kills can award points during wave 1.

`calculateScore()` remains the final calculator with lives and gold bonuses.
Classic terminal results keep using it. Change `finishCampaign()` to call the
final calculator directly before recording clear/mastery/account settlement.
Final result screens and any score visible beneath them must agree on the settled
total. Add bonuses once; refresh/resize does not award them again. Campaign defeat
uses its actual remaining lives under the existing settlement semantics. Restart
and Quit preserve their existing discarded-run behavior and do not settle bonuses
or create score submissions. Classic victory before Continue Endless still shows
earned live points; bonuses settle only on Finish Run or another terminal outcome.

Acceptance: the reported 20 lives/600 gold/medium fresh Campaign case displays 0;
its final calculation still includes 945 bonus points when those resources remain.
For identical terminal inputs, Classic and Campaign final totals match their
pre-change rules, including difficulty rounding. Saved bests, score versions,
mastery targets and server validation are unaffected.

## Readable menu identity and score records

In `MainMenuScene.ts`, retain the emblem, two-line title, subtitle, scenic vista
and menu actions. Add local dark backing behind title/subtitle/score text rather
than obscuring the entire painting. Use primary light text for score records and
gold emphasis for title. Subtitle and records are at least 14 CSS px. Keep title
legible with its outline/shadow and responsive sizing; never clip it at screen edges.

Measure text/wrapping before placing subsequent rows and buttons. Leave at least
8px between text rows and 12px before menu actions. Both current and legacy bests
retain their label, points and wave. Handle neither record, either record alone,
both records, and large valid values without overlap. Keep all menu actions and
the saved-submission band reachable at short landscape sizes. Compact the emblem
and discretionary whitespace first when space is limited.

Acceptance: subtitle/score text contrast against the backing is at least 4.5:1;
large title text is at least 3:1. Visually inspect at native size after fonts load,
including bright areas of the painting. There is no text/button overlap, truncation
or need to zoom to read the best-score lines.

## Implementation boundaries and verification

Work is bounded to tower art geometry and its consumers, responsive boss/menu
layout, score display/settlement, their meaningful regression tests, and a brief
verification record. Existing `layout.ts`/pure helper conventions are preferred
for testable geometry. No map rebalance, new art generation, database migration,
authentication change or scoring-era change is needed.

Implement each diagnosed fix with regression evidence before changing its code.
Measure source footprint geometry before editing tower offsets. Then verify the
affected renderer, score settlement and responsive layout together. Update tests
that intentionally assert old compact boss labels to the new full-name contract;
do not remove failure visibility or weaken unrelated assertions.

Automated verification:
- Ground geometry: all registered family/stage/tier variants, fallback art,
  displayed bounds and muzzle/decorations relative to the measured footprint.
- Boss panel: field/safe-area containment, text-row spacing, zero/full HP,
  resizing, and tray/wave/inspector exclusion; scene test for lifecycle visibility.
- Score: initial zero, earned kills/elites/waves/bosses, difficulty rounding,
  spending/selling/lives independence, Classic terminal and Campaign settlement,
  discarded runs and Endless continuation.
- Menu geometry: measured wrapped record rows and action clearance with zero,
  one and both best records, large values, and compact landscape.

Browser visual/interaction verification at CSS viewports 360x360, 360x640, 390x844,
640x360, 844x390, 768x1024, 1024x768, 1366x768 and 1920x1080, plus nonzero safe
insets. Use the existing DEV QA fixtures for menu, placement, selected/evolved
towers, Classic boss and Campaign boss levels 10/20/30. Validate normal unassisted
fresh Campaign start separately; fixtures must not be mistaken for scoring proof.
Capture phone and tablet native-size screenshots. Rotate/resize while a boss is
active, verify HP updates, pause/resume and tower-tray interaction.
At 360x360, explicitly verify panel fit and the selected-inspector sheet fallback.
Inspect all tower-art variants through a review grid/fixture and representative battlefield
placements at overview/zoom; confirm upgrading keeps ground contact.

Run the complete test suite and build. After application implementation succeeds,
run `npm run deploy` (which itself runs tests/build), then fetch and verify the live
page, its current JavaScript bundle and `/api/health` at
https://aetherhold-defense.ljournllagas.workers.dev. Record checks and concrete
failures honestly; resolve failures or report blockers. Commit only task files,
including this spec and verification documentation, and push the current branch.
Verify local HEAD equals the remote branch. Preserve unrelated `.scratch/` and
`.superpowers/` content. A documentation-only spec commit does not deploy the app.
