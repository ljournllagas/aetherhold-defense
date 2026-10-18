# Accessible menu controls (main-menu slice)

## Problem

Primary canvas navigation is pointer-only. A keyboard-only user cannot open
Campaign, Classic Siege, Hall of Legends, Settings or Progression, and a screen
reader cannot identify them. This is the entry-flow part of WCAG 2.1.1 (Keyboard)
and 4.1.2 (Name, Role, Value) reported in the 2026-10-14/15 UI/UX audits.

## Scope (this slice)

Make the **main-menu destinations** keyboard- and assistive-tech-operable. Later
slices cover difficulty selection and in-battle/sheet actions.

## Approach

Add a reusable DOM overlay that mirrors the existing `.account-access` pattern:

- `mountAccessibleActions(scene, actions)` creates one real `<button>` per canvas
  control inside `#game-root`, labelled from the same string as the canvas button.
- Buttons are transparent and `pointer-events:none`, so mouse/touch keeps the
  existing canvas press/release and hover behaviour; keyboard focus and
  activation are unaffected by `pointer-events`.
- Position tracks the canvas rectangle and Phaser resize, like `.account-access`.
- `:focus-visible` shows the shared gold outline, so focus is visible.
- Buttons are removed on scene shutdown; the layer exposes `add` for controls
  created after mount (the async Saved Score button).

## Acceptance

- With no pointer, Tab reaches Campaign, Classic Siege, Hall of Legends, Settings
  and Progression in visible order; Enter and Space each activate exactly once.
- Labels match the visible canvas labels; a disabled control cannot activate.
- Focus is visibly outlined. Mouse and touch behaviour is unchanged.
- The layer is removed when the menu scene shuts down.

## Out of scope

Difficulty cards, in-battle sheets/modals, and leaderboard rows. These keep the
2026-10-15 audit's separate-slice recommendation.
