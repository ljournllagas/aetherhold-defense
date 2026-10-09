# Master Rebuild Prompt — Fantasy Tower Defense

You are a senior Phaser/TypeScript game engineer, game UI engineer, fantasy game-art integrator, Cloudflare architect, and QA reviewer.

You are rebuilding an existing browser-based Fantasy Tower Defense game.

The current implementation may contain working functionality, but its UI, art, architecture, responsiveness, gameplay presentation, or consistency may be poor.

Your responsibility is to **audit first, then systematically rebuild the game** against the project's authoritative documents and approved visual references.

Do not improvise a new design direction.

---

# 1. Read These Files Before Changing Code

Read these completely:

- `docs/SPEC.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/ART_BIBLE.md`
- `docs/AI_AGENT_INSTRUCTIONS.md`
- `references/VISUAL_REFERENCE_GUIDE.md`

Then inspect all approved images under:

- `references/visual/`

Required reference images:

- `01_main_menu.png`
- `02_difficulty_selection.png`
- `03_gameplay_normal.png`
- `04_gameplay_heavy_wave.png`
- `05_tower_placement_valid.png`
- `06_selected_tower.png`
- `07_powerup_reveal.png`
- `08_boss_wave.png`
- `09_game_over.png`
- `10_leaderboard.png`

Do not start implementation before completing this reading/inspection.

---

# 2. Authority and Conflict Rules

Use this precedence:

1. My latest explicit instruction.
2. `docs/SPEC.md` for gameplay, behavior, architecture, scope, and numeric rules.
3. `docs/DESIGN_SYSTEM.md` for UI structure, layout, tokens, components, typography, responsive behavior, and UI motion.
4. `docs/ART_BIBLE.md` for world art, towers, enemies, bosses, terrain, stronghold, icons, projectiles, VFX, lighting, materials, silhouettes, and animation direction.
5. `docs/AI_AGENT_INSTRUCTIONS.md` for implementation procedure, validation, testing, QA, and completion reporting.
6. `references/VISUAL_REFERENCE_GUIDE.md` and `references/visual/*` for concrete visual targets.
7. Existing implementation.
8. Your own preference.

IMPORTANT:

The approved screenshots are **visual/compositional references only**.

Do not copy gameplay numbers, tower mechanics, wave limits, targeting options, slot counts, or other functional values from an image if they conflict with the text documents.

If the screenshots show illustrative values that differ from `SPEC.md`, use `SPEC.md`.

---

# 3. Primary Objective

Transform the current project into a polished, original fantasy Tower Defense game that feels like one coherent studio built it.

The result should feel:

- tactical;
- readable;
- polished;
- atmospheric;
- performant;
- responsive;
- replayable;
- visually cohesive.

It must not feel like:

- a SaaS dashboard wrapped around a canvas;
- a generic web template;
- a mobile UI stretched onto desktop;
- a collection of unrelated asset packs;
- a prototype using debug shapes;
- a Warcraft clone.

The battlefield is the hero.

---

# 4. Phase 0 — Baseline Discovery

Before changing code:

- inspect package manager and lockfile;
- inspect Phaser version;
- inspect TypeScript/Vite setup;
- inspect Cloudflare configuration;
- inspect D1 migrations;
- inspect source structure;
- inspect Phaser scenes;
- inspect gameplay systems;
- inspect configuration/data files;
- inspect UI code;
- inspect current assets;
- inspect tests;
- inspect Worker/API code;
- inspect leaderboard implementation.

Run the project's appropriate equivalents of:

- dependency install;
- typecheck;
- tests;
- build;
- lint if configured.

Record failures.

Do not silently fix broad areas before you have a baseline.

---

# 5. Phase 1 — Compliance Audit

Audit the existing project against all authoritative references.

Produce a structured gap report using:

| ID | Requirement | Source | Current State | Status | Severity | Files Affected | Recommended Fix |
|---|---|---|---|---|---|---|---|

Statuses:

- PASS
- PARTIAL
- FAIL
- MISSING
- UNVERIFIED

Severities:

- CRITICAL
- HIGH
- MEDIUM
- LOW

Audit at minimum:

## Gameplay
- difficulty;
- waves;
- tower placement;
- towers;
- upgrades;
- selling;
- targeting;
- enemies;
- resistances;
- bosses;
- Power-Ups;
- economy;
- lives;
- speed;
- pause;
- scoring;
- restart;
- Game Over.

## UI / UX
- main menu;
- player setup;
- difficulty selection;
- top HUD;
- battlefield proportion;
- right inspector/catalog;
- bottom command tray;
- tower placement;
- selected tower;
- Power-Up reveal;
- boss UI;
- pause;
- Game Over;
- leaderboard;
- responsive layouts.

## Art
- rendering style;
- camera/perspective;
- light direction;
- tower-family silhouette;
- enemy readability;
- boss design;
- stronghold;
- map/terrain;
- props;
- projectile language;
- VFX;
- icons;
- animation;
- asset consistency.

## Technical
- architecture;
- config-driven balance;
- game-time correctness;
- scene/system cleanup;
- restart safety;
- Cloudflare compatibility;
- D1;
- score submission;
- error handling.

---

# 6. Phase 2 — Visual Comparison

For each major screen, compare the current rendered result to the matching approved reference.

Use:

- main menu → `01_main_menu.png`
- difficulty/player setup → `02_difficulty_selection.png`
- normal gameplay → `03_gameplay_normal.png`
- heavy combat → `04_gameplay_heavy_wave.png`
- placement → `05_tower_placement_valid.png`
- tower inspector → `06_selected_tower.png`
- Power-Up → `07_powerup_reveal.png`
- boss wave → `08_boss_wave.png`
- Game Over → `09_game_over.png`
- leaderboard → `10_leaderboard.png`

Do not compare only code.

Render the game when tools allow it.

For each screen assess:

- information hierarchy;
- battlefield size;
- panel footprint;
- visual weight;
- typography;
- spacing;
- materials;
- colors;
- asset coherence;
- VFX density;
- interaction clarity.

---

# 7. Phase 3 — Rebuild Plan

Prioritize:

- P0: broken core gameplay / blocking defect;
- P1: major gameplay, architecture, art, or visual issue;
- P2: important UX/consistency issue;
- P3: polish.

Use controlled implementation phases.

Do not perform a blind repository rewrite.

Recommended sequence:

1. foundation / architecture;
2. map and battlefield;
3. HUD and gameplay shell;
4. tower placement;
5. tower interaction/inspector;
6. combat readability;
7. waves/enemies/bosses;
8. Power-Ups;
9. scoring/Game Over;
10. Cloudflare/D1/leaderboard;
11. art/VFX consistency;
12. responsive behavior;
13. regression and visual QA.

---

# 8. Visual Target Rules

The approved screenshots establish the concrete visual north star.

Reproduce their:

- dark slate/metal fantasy UI;
- restrained gold accents;
- warm stone/torch environment;
- muted terrain;
- readable top-down three-quarter battlefield;
- strongly differentiated towers;
- visually distinct enemies;
- scenic stronghold;
- painterly strategy-game rendering;
- compact right inspector;
- command-oriented bottom tray;
- controlled magical VFX.

Do not reproduce arbitrary screenshot text/numbers.

Do not trace copyrighted external games.

---

# 9. Visual Prohibitions

Do not introduce:

- glassmorphism;
- SaaS cards;
- giant border radii;
- generic Material/Bootstrap look;
- cyberpunk neon;
- random gradients;
- excessive glow;
- emoji icons;
- inconsistent icon packs;
- photoreal art mixed with stylized sprites;
- a tiny battlefield surrounded by UI;
- particle spam;
- permanent bright grids;
- huge blocking combat modals.

---

# 10. Art Production Rules

All new or replaced world/game assets must follow `ART_BIBLE.md`.

Before accepting an asset:

- inspect it at actual gameplay scale;
- verify silhouette;
- verify upper-left lighting;
- verify material language;
- verify palette;
- verify perspective;
- verify neighboring-asset compatibility;
- verify originality;
- verify web-performance suitability.

Do not judge assets only at concept-art resolution.

---

# 11. Gameplay and Image Conflict Example

If `02_difficulty_selection.png` visually shows values that differ from `SPEC.md`:

- preserve the screenshot's visual composition;
- replace the displayed values with the actual values from `SPEC.md`.

If `06_selected_tower.png` shows a targeting choice not supported by `SPEC.md`:

- preserve the inspector's layout/style;
- implement only supported targeting modes.

Apply this principle everywhere.

---

# 12. Responsive Validation

At minimum test:

- 1440×900
- 1280×720
- 1024×768
- 844×390 landscape

Desktop references are not an excuse to make smaller layouts unusable.

Maintain visual identity while adapting structure according to `DESIGN_SYSTEM.md`.

---

# 13. Required Runtime Validation

Test relevant flows including:

- new game;
- difficulty selection;
- tower build;
- invalid build;
- tower attack;
- upgrade;
- sell;
- targeting;
- wave progression;
- boss wave;
- Power-Up acquisition/use/store;
- pause;
- speed change;
- Game Over;
- restart;
- leaderboard submission/fetch;
- API-failure fallback.

---

# 14. Restart Regression Gate

After Game Over, start a new game and verify no leaked:

- enemies;
- towers;
- projectiles;
- timers;
- listeners;
- tweens;
- Power-Up effects;
- boss state;
- pause state;
- speed state;
- score;
- wave state.

State leakage is release-blocking.

---

# 15. Final Visual QA

For each major screen:

- compare to the approved reference;
- verify it belongs to the same visual family;
- verify battlefield prominence;
- verify readable controls;
- verify tokens;
- verify art consistency;
- verify no clipping;
- verify responsive adaptation.

If browser/screenshot tools exist, actually inspect rendered screenshots.

Do not declare Visual QA PASS based solely on source inspection.

---

# 16. Final Compliance Audit

After rebuilding, rerun the requirements audit.

Every former FAIL, PARTIAL, MISSING, or UNVERIFIED item must receive a new status.

Do not hide unresolved issues.

---

# 17. Completion Report

Use:

REBUILD SUMMARY

Implemented
- ...

Architecture
- ...

Gameplay
- ...

Visual / UX
- ...

Art / Assets
- ...

Cloudflare / Backend
- ...

Testing
- ...

VALIDATION

- Build: PASS / FAIL / UNVERIFIED
- Typecheck: PASS / FAIL / UNVERIFIED
- Tests: PASS / FAIL / UNVERIFIED
- Runtime gameplay: PASS / FAIL / UNVERIFIED
- Restart regression: PASS / FAIL / UNVERIFIED
- Leaderboard API: PASS / FAIL / UNVERIFIED
- Visual QA: PASS / FAIL / UNVERIFIED
- Art Bible compliance: PASS / FAIL / UNVERIFIED
- Approved-reference comparison: PASS / FAIL / UNVERIFIED
- Responsive 1440×900: PASS / FAIL / UNVERIFIED
- Responsive 1280×720: PASS / FAIL / UNVERIFIED
- Responsive 1024×768: PASS / FAIL / UNVERIFIED
- Responsive 844×390: PASS / FAIL / UNVERIFIED

REQUIREMENTS AUDIT

- Critical unresolved: <count>
- High unresolved: <count>
- Medium unresolved: <count>
- Low unresolved: <count>

Known Limitations
- ...

Documentation Updated
- SPEC.md: Yes / No / Not required
- DESIGN_SYSTEM.md: Yes / No / Not required
- ART_BIBLE.md: Yes / No / Not required
- AI_AGENT_INSTRUCTIONS.md: Yes / No / Not required
- VISUAL_REFERENCE_GUIDE.md: Yes / No / Not required

---

# 18. Definition of Success

Success means:

- behavior follows `SPEC.md`;
- UI follows `DESIGN_SYSTEM.md`;
- game art follows `ART_BIBLE.md`;
- implementation process follows `AI_AGENT_INSTRUCTIONS.md`;
- major screens visibly belong beside the approved reference images;
- the game remains responsive and performant;
- tests/build pass;
- core runtime flows work;
- restart is clean;
- network failure does not prevent gameplay;
- no unresolved Critical issues remain.

Do not optimize for the amount of code changed.

Optimize for a game that is:

**fun, readable, coherent, stable, performant, and visually authored.**
