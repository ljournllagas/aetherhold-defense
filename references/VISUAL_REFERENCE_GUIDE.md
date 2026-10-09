# Approved Visual Reference Guide

**Status:** Approved visual north-star set  
**Applies to:** UI composition, art direction, visual hierarchy, asset style, material language, combat density, and presentation  
**Does NOT override:** `docs/SPEC.md`, `docs/DESIGN_SYSTEM.md`, `docs/ART_BIBLE.md`, or `docs/AI_AGENT_INSTRUCTIONS.md`

---

## 1. Critical Interpretation Rule

These screenshots are **visual references, not functional specifications**.

Use them to understand:

- composition;
- visual hierarchy;
- battlefield prominence;
- panel materials;
- UI density;
- art style;
- tower/enemy visual language;
- environmental richness;
- color relationships;
- VFX intensity;
- screen-state presentation.

Do **not** copy gameplay numbers, tower behavior, targeting modes, slot counts, wave limits, labels, or other functional values from the screenshots when they conflict with the authoritative documents.

If a screenshot conflicts with text requirements:

1. `SPEC.md` wins for gameplay/product behavior and numeric values.
2. `DESIGN_SYSTEM.md` wins for UI/layout/component rules.
3. `ART_BIBLE.md` wins for world/game-art production rules.
4. `AI_AGENT_INSTRUCTIONS.md` wins for implementation/QA procedure.
5. The screenshot remains a visual/compositional target only.

---

## 2. Known Illustrative Content That Must Not Override the Spec

Some generated screens contain illustrative placeholder content.

Examples include:

- difficulty starting gold/lives/score multipliers that differ from `SPEC.md`;
- a finite-looking wave fraction such as `8 / 14` or `18 / 20`;
- a selected Arcane tower panel containing labels or targeting choices that may not match the specified mechanics;
- some screenshots visually showing a different number of empty Power-Up boxes than the required inventory capacity;
- illustrative leaderboard dates/names/scores.

These are **not approved gameplay rules**.

An implementation agent must use the documents for actual values and mechanics.

---

## 3. Reference Screens

### 01 — Main Menu

File:

`references/visual/01_main_menu.png`

Use as the reference for:

- title-screen atmosphere;
- game logo/crest scale;
- scenic world backdrop;
- menu hierarchy;
- button material language;
- restrained menu density.

Do not treat background architecture as an exact map layout.

---

### 02 — Difficulty Selection

File:

`references/visual/02_difficulty_selection.png`

Use as the reference for:

- three-card desktop composition;
- selected-card gold treatment;
- player-name placement;
- background treatment;
- Back / Continue hierarchy.

Use `SPEC.md` for all actual difficulty values.

---

### 03 — Normal Gameplay

File:

`references/visual/03_gameplay_normal.png`

This is the **primary gameplay visual anchor**.

Use as the strongest reference for:

- top HUD;
- battlefield-to-UI proportion;
- right-side tower catalog;
- bottom command tray;
- map density;
- tower-family differentiation;
- enemy readability;
- environmental detail;
- restrained VFX;
- stronghold prominence.

Do not assume the shown wave denominator is part of the product requirement.

---

### 04 — Heavy Wave

File:

`references/visual/04_gameplay_heavy_wave.png`

Use as the upper bound reference for:

- late-game enemy density;
- combat intensity;
- overlapping tower attacks;
- VFX escalation;
- continued readability under pressure.

The target is **busy but legible**, never visual soup.

---

### 05 — Valid Tower Placement

File:

`references/visual/05_tower_placement_valid.png`

Use as the reference for:

- ghost tower;
- range visualization;
- valid-placement color/state;
- placement-focused bottom context;
- selected build-card treatment.

For invalid placement, follow `DESIGN_SYSTEM.md` and use the corresponding red state plus a non-color cue/reason.

---

### 06 — Selected Tower

File:

`references/visual/06_selected_tower.png`

Use as the reference for:

- selected tower ring;
- range circle;
- right-side inspector density;
- stat-row composition;
- Upgrade and Sell hierarchy;
- battlefield remaining visible while inspecting.

Use `SPEC.md` for actual tower role, stats, targeting options, and mechanics.

---

### 07 — Power-Up Reveal

File:

`references/visual/07_powerup_reveal.png`

Use as the reference for:

- reward hierarchy;
- rarity treatment;
- central reveal panel;
- dimmed/subdued battlefield treatment;
- large symbolic Power-Up art;
- Use Now / Store actions.

Use the spec for actual Power-Up mechanics and inventory rules.

---

### 08 — Boss Wave

File:

`references/visual/08_boss_wave.png`

Use as the reference for:

- boss visual dominance;
- boss health bar;
- temporary Boss Wave banner;
- boss-to-normal-enemy scale;
- elevated but controlled combat effects.

The boss shown is a visual direction for **The Hollow Warden**, not a requirement to copy every armor detail literally.

---

### 09 — Game Over

File:

`references/visual/09_game_over.png`

Use as the reference for:

- defeated-world continuity;
- damaged stronghold backdrop;
- Final Score hierarchy;
- compact supporting statistics;
- Play Again / Leaderboard / Main Menu hierarchy.

Use `SPEC.md` for actual run statistics and score calculation.

---

### 10 — Leaderboard

File:

`references/visual/10_leaderboard.png`

Use as the reference for:

- fantasy-scoreboard presentation;
- tab/filter placement;
- compact rows;
- top-three emphasis;
- current-player highlight;
- scenic background.

Use `SPEC.md` for ranking order, filters, score versions, and actual data.

---

## 4. Pixel-Perfect vs Directional Use

These are **approved directional references**, not literal raster blueprints.

Agents should reproduce:

- hierarchy;
- proportional layout;
- mood;
- materials;
- information density;
- relative prominence;
- art consistency.

Agents should not:

- trace every decorative stone edge;
- hardcode screenshot text;
- treat every screenshot coordinate as a fixed pixel requirement;
- sacrifice responsiveness to reproduce one desktop image exactly.

The implementation must still comply with the responsive behavior in `DESIGN_SYSTEM.md`.

---

## 5. Visual Drift Rule

If a newly rendered screen no longer looks like it belongs beside these references, it is visually drifting.

Common drift indicators:

- SaaS-style flat cards;
- oversized rounded panels;
- glass blur;
- neon cyberpunk colors;
- tiny battlefield;
- highly saturated terrain;
- mismatched icon styles;
- flat web buttons;
- unrestrained spell effects;
- photoreal assets mixed with stylized assets.

Correct the drift before declaring visual QA complete.

---

## 6. Screenshot Comparison Workflow

For every major UI/gameplay rebuild:

1. open the closest approved reference;
2. render the current implementation at the matching desktop viewport;
3. compare:
   - layout;
   - battlefield proportion;
   - panel weight;
   - typography scale;
   - contrast;
   - spacing;
   - VFX density;
   - art consistency;
4. fix obvious drift;
5. then test responsive sizes from `DESIGN_SYSTEM.md`.

The approved image is the north star.

The text documents remain the law.
