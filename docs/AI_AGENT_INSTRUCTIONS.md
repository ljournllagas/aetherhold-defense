# Fantasy Tower Defense — AI Agent Instructions

**Document:** `AI_AGENT_INSTRUCTIONS.md`  
**Version:** 1.0  
**Status:** Mandatory Agent Operating Rules  
**Applies to:** Any AI coding, design, QA, refactoring, or implementation agent working on this repository  

---

# 1. Purpose

This document defines **how an AI agent must work on this project**.

The project uses three authoritative references, preferably stored under `docs/`:

1. `docs/SPEC.md` — product behavior, gameplay rules, architecture, scope, and acceptance criteria.
2. `docs/DESIGN_SYSTEM.md` — visual language, layout, components, responsive behavior, motion, and visual QA.
3. `docs/AI_AGENT_INSTRUCTIONS.md` — implementation procedure, change-control rules, validation requirements, and completion criteria.

If the repository stores these files at the root instead, the filenames remain authoritative. Do not create duplicate divergent copies.

These documents are not optional guidance.

They are implementation constraints.

An agent must not knowingly violate them unless the user explicitly changes the requirement.

---

# 2. Instruction Precedence

Use this precedence order:

1. The user's latest explicit instruction.
2. `SPEC.md`.
3. `DESIGN_SYSTEM.md`.
4. `AI_AGENT_INSTRUCTIONS.md`.
5. Existing implementation.
6. Agent preference.

Existing code is **not** authoritative if it conflicts with the specification or design system.

When documents appear to conflict:

- do not guess silently;
- prefer the more specific rule;
- preserve current behavior only if it does not violate a higher-priority rule;
- document the conflict in the final implementation report.

Do not create a fourth unofficial source of truth.

---

# 3. Required Reading Before Work

Before modifying the project, the agent must read:

- `SPEC.md`
- `DESIGN_SYSTEM.md`
- this file

The agent must inspect relevant existing implementation files before editing them.

For UI work, the agent must also inspect the rendered screen or existing screenshots if available.

For gameplay work, the agent must inspect the affected system, configuration, tests, and related state transitions.

For backend work, the agent must inspect the Worker routes, validation, D1 migrations, and API client code.

Do not begin implementation based only on filenames or assumptions.

---

# 4. Core Operating Principle

The agent's job is:

**implement the defined game correctly and consistently, not redesign it according to personal preference.**

Do not treat ambiguity as permission to invent a completely different experience.

Use the smallest interpretation that preserves:

- gameplay clarity;
- maintainability;
- visual consistency;
- performance;
- responsive behavior;
- testability.

---

# 5. Mandatory Work Sequence

For every meaningful task:

## Step 1 — Understand

Identify:

- requested outcome;
- affected screens/systems;
- relevant requirements from `SPEC.md`;
- relevant visual rules from `DESIGN_SYSTEM.md`;
- acceptance criteria;
- possible regressions.

## Step 2 — Inspect

Read the current implementation.

Do not overwrite working systems without understanding them.

## Step 3 — Plan

Create a short internal implementation plan covering:

- files to modify;
- behavior changes;
- visual changes;
- tests required;
- migration/API impact if any.

Do not generate excessive planning documents unless requested.

## Step 4 — Implement

Make the smallest coherent change that fully satisfies the requirement.

## Step 5 — Validate

Run all relevant:

- type checking;
- build;
- automated tests;
- linting if configured;
- runtime checks;
- visual checks.

## Step 6 — Inspect the Result

For UI work, render the actual result.

Do not assume CSS or Phaser layout is correct from source inspection alone.

## Step 7 — Fix

Resolve failures, regressions, layout defects, and obvious inconsistencies before stopping.

## Step 8 — Report

Provide a concise implementation summary using the completion format defined later in this file.

---

# 6. Do Not Declare Success Prematurely

An agent must not say:

- "done";
- "complete";
- "fully implemented";
- "production ready";
- "all requirements satisfied"

unless it has actually validated the relevant requirements.

If a validation step cannot be performed, explicitly label it:

**UNVERIFIED**

Example:

```text
Responsive rendering at 844×390: UNVERIFIED because browser rendering was unavailable.
```

Never convert lack of evidence into assumed success.

---

# 7. Existing Code Is Allowed to Be Wrong

The current implementation may contain:

- poor UI;
- placeholder art;
- incorrect spacing;
- duplicate systems;
- hard-coded balancing values;
- untested logic;
- architectural mistakes.

Do not preserve a defect merely because it already exists.

When existing behavior conflicts with the authoritative documents, correct it.

---

# 8. Scope Discipline

Do not add unrelated features.

Do not introduce:

- account systems;
- multiplayer;
- clans;
- chat;
- achievements;
- battle passes;
- hero systems;
- crafting;
- additional currencies;
- skins stores;
- login flows;
- complex telemetry;
- unnecessary admin dashboards

unless explicitly requested.

Do not turn a contained feature request into a broad rewrite unless the existing architecture makes a focused fix impossible.

---

# 9. Architecture Rules

Use:

- Phaser 4.x;
- TypeScript;
- Vite;
- Cloudflare Workers;
- Cloudflare D1.

Initial baseline: Phaser `4.2.1`.

Respect the version pinned by the repository lockfile. Do not perform framework upgrades during unrelated implementation tasks.

Gameplay logic should be organized around focused systems.

Do not move the entire game into:

- one giant scene;
- one giant `Game.ts`;
- one giant state object;
- one enormous update loop.

Centralize configuration for:

- towers;
- enemies;
- waves;
- difficulty;
- economy;
- scoring;
- Power-Ups.

Do not scatter magic numbers across implementation files.

---

# 10. Game Loop Safety

Gameplay logic must not depend directly on frame rate.

Use elapsed/delta time or engine timing facilities.

When implementing pause or game-speed controls, verify that they correctly affect:

- spawning;
- movement;
- tower attacks;
- projectiles;
- status effects;
- Power-Up durations;
- wave timing.

Do not implement speed changes by simply multiplying arbitrary visual animation speeds while leaving gameplay timers unchanged.

---

# 11. State Management Rules

Game state transitions must be explicit.

At minimum protect against invalid combinations such as:

- paused + wave spawning;
- Game Over + active projectiles damaging enemies;
- placement mode + conflicting tower-selection action;
- reward selection + uncontrolled wave progression;
- duplicate score submission.

Whenever a new state is introduced, verify its interaction with:

- pause;
- speed;
- Game Over;
- scene transition;
- restart.

---

# 12. Visual Authority

All game UI must follow `DESIGN_SYSTEM.md`.

An agent may not replace the design system with:

- Tailwind defaults;
- Material UI defaults;
- Bootstrap defaults;
- generic game UI templates;
- generic admin dashboard patterns;
- random CSS generated for convenience.

Third-party libraries may support implementation, but the final rendered UI must follow project tokens and component rules.

---

# 13. Visual Implementation Rules

For every visual change:

1. use existing design tokens;
2. use existing reusable components where possible;
3. preserve battlefield prominence;
4. maintain hierarchy;
5. verify readability;
6. verify interaction states;
7. verify responsive states.

Do not add a new visual pattern if an existing component can represent the requirement.

---

# 14. Strict Visual Prohibitions

Do not introduce:

- glassmorphism;
- blur-heavy panels;
- random gradients;
- giant rounded cards;
- default HTML form styling;
- emoji as functional icons;
- neon sci-fi appearance;
- excessive gold;
- excessive glows;
- bouncing UI;
- uncontrolled particle spam;
- unreadably small labels;
- excessive modal dialogs;
- dashboards surrounding a tiny game canvas;
- decorative elements that obscure enemies;
- mismatched asset styles.

If the current implementation contains these patterns, gradually remove them when touching the relevant area.

---

# 15. Battlefield Priority Rule

At desktop reference layouts, the battlefield must remain the dominant visual region.

Do not increase permanent UI footprint without a strong gameplay reason.

Avoid:

- side panels wider than specified;
- unnecessary stacked HUD rows;
- large permanent tutorial boxes;
- leaderboard elements during active combat;
- permanent explanatory paragraphs.

Contextual information should appear only when useful.

---

# 16. Component Reuse

Before creating a new UI component, check whether one of these applies:

- `PrimaryButton`
- `SecondaryButton`
- `DangerButton`
- `IconButton`
- `HUDMetric`
- `TowerCard`
- `TowerInspector`
- `PowerUpSlot`
- `RewardPanel`
- `DifficultyCard`
- `Toast`
- `ModalPanel`
- `LeaderboardRow`
- `Badge`
- `StatRow`
- `BossHealthBar`
- `PlacementIndicator`

If a component already exists, improve/reuse it rather than creating a visual duplicate.

---

# 17. Typography Rules

Use the documented fonts and type scale.

Do not:

- invent random font sizes;
- use thin body text;
- use fantasy display font for dense body copy;
- use all-caps paragraphs;
- stretch or distort text.

Keep numeric HUD values highly legible.

---

# 18. Color Rules

All interface colors must map to design tokens.

If a new semantic color is genuinely required:

1. confirm no existing token fits;
2. add it to `DESIGN_SYSTEM.md`;
3. add it centrally;
4. document the reason.

Do not hardcode random colors inside individual components.

Gameplay art can contain richer palettes, but UI semantic colors remain standardized.

---

# 19. Asset Rules

Do not use copyrighted Warcraft or Blizzard assets.

Do not use assets with uncertain licensing in production.

Do not mix visually incompatible asset packs.

Placeholder assets must be:

- clearly temporary;
- structurally replaceable;
- stored in the proper asset category;
- not mistaken for final art in completion reports.

If production-quality artwork is unavailable, prefer coherent temporary silhouettes over a chaotic mixture of unrelated art styles.

---

# 20. Responsive Testing

For visual changes, test these minimum layouts:

```text
1440×900
1280×720
1024×768
844×390 landscape
```

Check:

- clipping;
- overflow;
- text wrapping;
- tower tray usability;
- inspector placement;
- HUD density;
- touch target sizing;
- battlefield visibility.

Portrait mobile is not a primary gameplay target.

Follow the rotation guidance in `DESIGN_SYSTEM.md`.

---

# 21. Visual Screenshot Review

If browser automation, screenshots, or a visual preview is available, use it.

For each affected screen:

1. render the screen;
2. inspect at intended viewport;
3. compare against the Design System QA checklist;
4. correct defects;
5. rerender.

Do not declare a UI polished without seeing the rendered result when rendering tools are available.

---

# 22. Required Visual States

When relevant to the change, inspect:

- normal;
- hover;
- focus;
- pressed;
- selected;
- disabled;
- loading;
- success;
- error.

For tower placement also inspect:

- valid placement;
- invalid placement;
- insufficient gold;
- occupied location;
- outside build zone.

For Power-Ups inspect:

- empty slot;
- occupied slot;
- reward reveal;
- full inventory.

---

# 23. Gameplay Configuration Rules

Balance values must come from config.

Examples:

```ts
difficulties.ts
towers.ts
enemies.ts
waves.ts
powerUps.ts
scoring.ts
economy.ts
```

Do not place balancing values directly in entity classes unless they are universal constants.

Use typed configuration structures.

---

# 24. Numerical Safety

Clamp and validate values where appropriate.

Protect against:

- negative gold;
- negative lives;
- NaN score;
- infinite cooldown;
- negative upgrade cost;
- invalid speed multiplier;
- impossible resistance values;
- Power-Up probability totals not equal to 100%.

Use integer currency and score values.

---

# 25. Tower Rules

When adding or modifying a tower:

verify:

- cost;
- range;
- damage;
- cooldown;
- damage type;
- upgrade values;
- sell refund;
- targeting;
- asset key;
- role clarity.

No tower should dominate every major enemy archetype.

When balance cannot be confidently established from static inspection, mark balance as requiring playtest rather than pretending it is final.

---

# 26. Enemy Rules

When adding or modifying an enemy:

verify:

- HP;
- speed;
- reward;
- score;
- life penalty;
- resistance;
- visual role;
- spawn role;
- difficulty interaction.

Enemy role must be readable both mechanically and visually.

---

# 27. Wave Rules

Wave progression should create new tactical pressure, not only larger numbers.

Avoid replacing deliberate wave design with:

```text
HP = HP × 1.1 forever
```

Use composition changes.

Boss waves occur according to `SPEC.md`.

---

# 28. Power-Up Rules

Power-Up logic must:

- follow documented rarity probabilities;
- respect inventory capacity;
- use game-time aware durations;
- stop or clean up correctly at Game Over;
- remain balanced around tower strategy.

Do not implement hidden Power-Up replacement when inventory is full.

---

# 29. Scoring Rules

The scoring algorithm must be centralized.

Do not independently calculate score in:

- HUD;
- Game Over screen;
- API client;
- leaderboard.

Use a single authoritative scoring implementation.

Server-side validation should validate plausibility rather than blindly trusting the browser.

---

# 30. Leaderboard Rules

The leaderboard order is:

1. highest wave;
2. highest final score;
3. earliest achievement.

The server/database query and any client-side fallback sorting must use the same rule.

Each completed run must use a unique `run_id` so duplicate submissions can be rejected safely.

Leaderboard queries must respect the active `score_version` and must not silently combine incompatible score eras.

Do not display a different ordering than the backend returns unless explicitly required.

---

# 31. API Rules

Required endpoints:

```text
GET /api/health
GET /api/leaderboard
GET /api/leaderboard?difficulty={difficulty}
POST /api/scores
```

Use:

- schema validation;
- bounded input;
- prepared D1 statements;
- safe error messages;
- appropriate HTTP status codes.

Do not expose:

- secrets;
- stack traces;
- internal database details.

---

# 32. API Failure Rules

The game must remain playable if:

- leaderboard retrieval fails;
- score submission fails;
- D1 is temporarily unavailable.

The UI should clearly distinguish:

- local game success;
- remote leaderboard failure.

Never turn network failure into game failure.

---

# 33. Migration Rules

Database changes require migrations.

Do not manually assume production schema changes.

Migrations must be:

- deterministic;
- versioned;
- safe to apply in order.

If a schema change is destructive, document it explicitly.

---

# 34. Testing Rules

Use automated tests for deterministic logic.

Minimum expected categories:

- difficulty;
- scoring;
- waves;
- tower upgrades;
- tower selling;
- targeting;
- Power-Up rarity;
- Power-Up duration logic where practical;
- leaderboard sorting;
- API validation;
- score plausibility.

A new bug fix should normally include a regression test if the behavior is testable.

---

# 35. Build Gate

Before completing work, run the project's standard equivalent of:

```text
typecheck
test
build
```

Also run lint if configured.

Do not ignore failing tests because they appear unrelated without investigating them.

If unrelated pre-existing failures exist:

- identify them;
- confirm they existed before the change when possible;
- report them;
- do not falsely claim a clean validation run.

---

# 36. Runtime Gate

For gameplay changes, verify the game starts.

For affected interactions, verify the actual flow.

Examples:

Tower work:
- select;
- place;
- attack;
- upgrade;
- sell.

Wave work:
- start;
- spawn;
- complete;
- transition.

Power-Up work:
- award;
- reveal;
- store/use;
- expire.

Leaderboard work:
- fetch;
- filter;
- submit;
- display.

---

# 37. Performance Gate

For changes affecting active gameplay:

inspect for:

- per-frame allocations;
- repeated sorting;
- uncontrolled particle generation;
- unnecessary DOM mutation;
- duplicated event listeners;
- leaked timers;
- leaked Phaser objects;
- duplicate scene initialization.

Favor object pooling for high-frequency objects where beneficial.

---

# 38. Event Listener and Timer Cleanup

Any timer, event listener, tween, or subscription created by a gameplay scene/system must be cleaned up when appropriate.

Verify cleanup on:

- restart;
- Game Over;
- scene shutdown;
- return to menu.

Do not allow duplicate callbacks after replaying a run.

---

# 39. Restart Safety

A new run after Game Over must start cleanly.

Reset:

- enemies;
- towers;
- projectiles;
- timers;
- Power-Up effects;
- wave counters;
- score;
- gold;
- lives;
- game speed;
- pause state;
- boss state;
- transient UI.

Persistent settings such as volume and preferred difficulty may remain.

---

# 40. Error Handling

Errors presented to the player must be understandable.

Good:

```text
Leaderboard unavailable.
Your game can continue normally.
```

Bad:

```text
TypeError: Cannot read property 'rows' of undefined
```

Log technical detail for development, not as player-facing UI.

---

# 41. Change-Control Rule

If a request requires changing a baseline product or visual rule:

update the authoritative document in the same change when appropriate.

Examples:

- adding a fourth difficulty → update `SPEC.md`;
- changing primary HUD dimensions → update `DESIGN_SYSTEM.md`;
- changing validation workflow → update this file.

Do not allow implementation and documentation to silently diverge.

---

# 42. Documentation Drift Check

Before a major release, compare:

- actual game behavior vs `SPEC.md`;
- actual rendering vs `DESIGN_SYSTEM.md`;
- actual workflow/tests vs this file.

Any mismatch must be:

- fixed;
- or explicitly documented and approved.

---

# 43. Refactoring Rules

Refactoring must preserve behavior unless the task explicitly changes behavior.

Do not combine:

- visual redesign;
- gameplay rebalance;
- backend rewrite;
- large architecture migration

inside one change unless explicitly requested.

Smaller changes are easier to validate.

---

# 44. Dependency Rules

Before adding a dependency, ask:

- can Phaser/browser APIs already do this?
- does this materially reduce complexity?
- is it maintained?
- does it work in the deployment target?
- is the bundle impact justified?

Do not add large UI frameworks for a small component need.

Do not add React merely to render a menu.

---

# 45. No Placeholder Completion

The following do not count as implementation:

- TODO comments;
- fake API responses;
- hard-coded leaderboard fixtures presented as production data;
- buttons with no behavior;
- unconnected settings;
- disabled features without explanation;
- placeholder methods returning success;
- fake score validation.

Placeholders may exist during intermediate work but must not be reported as completed MVP behavior.

---

# 46. Development Content vs Production Content

Development-only elements must not appear in production builds unless intentionally enabled.

Examples:

- hitbox outlines;
- path waypoint dots;
- debug FPS panels;
- tower range debug labels;
- spawn controls;
- cheat gold buttons;
- invincibility toggles.

Use explicit development flags if such tools are needed.

---

# 47. Accessibility Rules

Do not reduce accessibility when polishing visuals.

Maintain:

- readable contrast;
- usable focus states;
- touch sizes;
- reduced-motion handling where practical;
- non-color indicators for critical states.

Do not use animations that rapidly flash.

---

# 48. Browser Compatibility

Target current evergreen desktop browsers.

At minimum consider:

- Chrome/Chromium;
- Edge;
- Firefox;
- Safari.

Avoid browser-specific APIs without fallback unless explicitly justified.

---

# 49. Cloudflare Compatibility

Backend code must be compatible with Cloudflare Workers runtime.

Do not assume Node.js APIs are universally available.

Use Workers-compatible APIs and packages.

D1 access must use bindings/config appropriate to Cloudflare deployment.

---

# 50. Security Rules

Never commit:

- API secrets;
- private tokens;
- credentials;
- private keys.

Validate untrusted input.

Bound request sizes.

Use prepared statements.

Do not trust score submissions merely because they originated from the game's frontend.

---

# 51. User-Facing Copy

Keep copy:

- short;
- direct;
- fantasy-flavored only where helpful;
- easy to scan.

Avoid excessive lore in core controls.

Example:

Good:
`Not enough gold`

Bad:
`The ancient coffers of the kingdom do not presently contain sufficient coinage to construct this magnificent defensive structure.`

Gameplay clarity wins.

---

# 52. Naming Consistency

Use one term for each concept.

Preferred:

- Gold
- Lives
- Wave
- Score
- Power-Up
- Tower
- Upgrade
- Sell
- Difficulty
- Boss

Do not alternate between:

- coins / gold / credits;
- health / lives / hearts;
- round / stage / wave

unless those concepts genuinely differ.

---

# 53. Final Visual QA Checklist

Before completing visual work verify:

- battlefield dominates;
- HUD is readable;
- Wave, Gold, Lives, Score are immediately findable;
- no default browser controls remain;
- colors use tokens;
- spacing follows the scale;
- buttons are consistent;
- selected states are obvious;
- tower placement is clear;
- no critical enemies are obscured;
- no clipped text;
- no overlapping panels;
- no unreadable low contrast;
- no inconsistent radii;
- no unnecessary gradients/glows;
- required responsive sizes work.

---

# 54. Final Gameplay QA Checklist

Before completing gameplay work verify relevant items:

- enemy route works;
- tower targeting works;
- damage applies correctly;
- death cleanup works;
- escaped enemies reduce lives correctly;
- wave transitions work;
- boss state works;
- gold cannot become invalid;
- upgrades apply once;
- selling refunds correctly;
- Power-Ups expire correctly;
- pause works;
- speed works;
- Game Over stops gameplay;
- restart produces a clean run;
- score is deterministic.

---

# 55. Final Backend QA Checklist

Before completing backend work verify relevant items:

- D1 migration exists;
- endpoint returns expected schema;
- validation rejects malformed payloads;
- prepared statements are used;
- difficulty filtering works;
- leaderboard ordering matches spec;
- network errors are handled;
- frontend can play without API;
- no secrets are exposed.

---

# 56. Completion Report Format

At the end of a task, report:

```text
Implemented
- <what changed>

Validated
- Build: PASS / FAIL / UNVERIFIED
- Typecheck: PASS / FAIL / UNVERIFIED
- Tests: PASS / FAIL / UNVERIFIED
- Runtime flow: PASS / FAIL / UNVERIFIED
- Visual QA: PASS / FAIL / UNVERIFIED
- Responsive QA: PASS / FAIL / UNVERIFIED

Files changed
- <file>
- <file>

Known limitations
- <only real unresolved limitations>

Documentation
- SPEC.md updated: Yes/No/Not required
- DESIGN_SYSTEM.md updated: Yes/No/Not required
- AI_AGENT_INSTRUCTIONS.md updated: Yes/No/Not required
```

Do not hide failures inside prose.

---

# 57. Release Gate

A feature is not ready for release if any critical item is:

- known broken;
- placeholder-only;
- visually unusable;
- inaccessible to the intended device class;
- inconsistent with authoritative requirements;
- causing build failure;
- causing test failure in the affected area;
- leaking state across restarts;
- exposing unsafe backend behavior.

Noncritical visual polish may be deferred only when explicitly documented.

---

# 58. Agent Self-Audit Before Stopping

Before ending work, answer internally:

1. Did I follow `SPEC.md`?
2. Did I follow `DESIGN_SYSTEM.md`?
3. Did I introduce a pattern that those documents do not define?
4. Did I actually test what I changed?
5. Did I inspect the rendered result when possible?
6. Did I introduce regressions?
7. Did I clean up event listeners/timers/state?
8. Did I update docs if I changed a baseline?
9. Am I claiming anything I did not verify?

If the answer to question 9 is yes, correct the final report.

---

# 59. Definition of a Good Agent Change

A good change is:

- correct;
- small enough to understand;
- consistent with the product;
- visually coherent;
- tested;
- responsive;
- maintainable;
- documented when necessary.

A large amount of generated code is not evidence of quality.

---

# 60. Final Instruction

Do not optimize for making the repository look busy.

Optimize for making the game:

**fun, readable, stable, coherent, testable, and faithful to its specification.**
