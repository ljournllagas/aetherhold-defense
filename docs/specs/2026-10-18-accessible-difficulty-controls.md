# Accessible difficulty controls (Classic Siege entry slice)

## Problem

The difficulty screen is pointer-only. A keyboard-only user can reach it from the
main menu but cannot choose a difficulty or continue, so they cannot start a
Classic Siege. A screen reader cannot identify the cards. This is the next part
of WCAG 2.1.1 (Keyboard) and 4.1.2 (Name, Role, Value) reported in the
2026-10-14/15 UI/UX audits, after the main-menu slice.

## Scope (this slice)

The **number-keyboard and screen-reader operable difficulty choice** on the two
layouts that draw the cards directly: the standard layout and the short-landscape
layout. Both the three difficulty cards and the Back / Continue actions are
mirrored so the whole entry step is completable without a pointer.

## Approach

Reuse `mountAccessibleActions` from the main-menu slice.

- The scene collects one `AccessibleAction` per interactive canvas control while
  it draws them, then mounts the layer.
- The layer gains `set(actions)`, which replaces every mirrored control. The
  difficulty screen redraws on resize and on the short-landscape pick, so the
  mirror has to follow the canvas rather than only grow.
- A card's label carries its state: `Easy difficulty`, `Medium difficulty
  (selected)`. Changing difficulty re-labels and re-sets the layer so the choice
  is announced.
- Buttons stay transparent and `pointer-events:none`; mouse and touch keep the
  existing press/release behaviour.

## Acceptance

- Tab reaches Easy, Medium, Hard, Back and Continue in visible order on the
  standard layout and the short-landscape layout.
- Enter activates exactly the same action as the matching canvas control.
- Selecting a difficulty updates the announced label to mark the new selection.
- The layer is removed when the scene shuts down.

## Out of scope

- The portrait-phone difficulty rows, which live inside a scrollable
  `ScrollSheet`; scrolling and clipping need their own design.
- In-battle build, tower, relic and next-wave sheets and modals. These keep the
  2026-10-15 audit's separate-slice recommendation.
