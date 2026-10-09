# Fantasy Tower Defense — Design System

**Document:** `DESIGN_SYSTEM.md`  
**Version:** 1.0  
**Status:** Visual Baseline  
**Applies to:** Entire game client  
**Design target:** Original polished fantasy strategy UI  
**Primary canvas reference:** 1280×720 gameplay area  

---

# 1. Purpose

This document removes visual guesswork from implementation.

Any AI agent implementing or modifying the game must follow these rules unless explicitly instructed otherwise.

The goal is a cohesive fantasy Tower Defense visual language with strong gameplay readability.

This is **not** a loose mood board.

It is an implementation contract.

---

# 2. Visual North Star

The visual identity is:

**ancient fortress + arcane energy + readable strategy interface**

The mood is:

- grounded;
- tactical;
- slightly mysterious;
- heroic rather than grim;
- colorful enough to distinguish mechanics;
- restrained enough that combat effects remain readable.

The game may evoke the broad feeling of classic fantasy RTS custom maps, but must use original art, shapes, UI, names, and assets.

---

# 3. Non-Negotiable Visual Rules

1. The battlefield is visually dominant.
2. UI must never look like a business dashboard.
3. No generic white cards floating over the game.
4. No glassmorphism.
5. No rainbow gradients.
6. No excessive neon.
7. No bright cyan-on-black "sci-fi" styling.
8. No browser-default controls.
9. No giant rounded mobile-app cards.
10. No pill-shaped button everywhere.
11. No excessive drop shadows.
12. No random accent colors.
13. No text directly over noisy terrain without a backing treatment.
14. No tiny text below 12 px equivalent.
15. No decorative animation that obscures enemies or projectiles.
16. No emoji as in-game icons.
17. No copyrighted Warcraft interface motifs or assets.
18. No layout changes that reduce the battlefield below approximately 70% of the useful gameplay region on desktop.

---

# 4. Art Direction

## 4.1 Camera

Use:

**2D top-down / three-quarter fantasy strategy presentation**

Do not use:

- first person;
- side-scrolling;
- fully isometric diamond-grid presentation for MVP.

The camera angle should make path readability and tower placement effortless.

---

# 5. Visual Hierarchy

From strongest to weakest:

1. battlefield threats;
2. player lives / boss state;
3. current wave;
4. tower placement / selected tower;
5. gold;
6. Power-Ups;
7. score;
8. secondary help text.

A player in combat should never need to search visually for lives, gold, or wave.

---

# 6. Color Tokens

Use these exact colors unless the document is formally revised.

```css
:root {
  --color-bg-deep: #0A0E12;
  --color-bg-panel: #121920;
  --color-bg-raised: #19232D;
  --color-bg-hover: #22303C;

  --color-border-subtle: #2C3945;
  --color-border-strong: #445564;

  --color-text-primary: #F3EBDD;
  --color-text-secondary: #B7C0C7;
  --color-text-muted: #7F8C97;
  --color-text-dark: #121820;

  --color-gold: #D7AA4E;
  --color-gold-bright: #F0CD72;

  --color-health: #63C77C;
  --color-danger: #D85F59;
  --color-danger-bright: #EE7B71;

  --color-mana: #5F9FE8;
  --color-frost: #72C8E8;
  --color-arcane: #9E7AE6;
  --color-storm: #67D0C4;
  --color-fire: #DE8742;

  --color-valid: #63C77C;
  --color-invalid: #D85F59;

  --color-common: #B7C0C7;
  --color-uncommon: #63C77C;
  --color-rare: #5F9FE8;
  --color-legendary: #D7AA4E;
}
```

---

# 7. Color Usage Rules

## Gold

Use for:

- currency;
- premium visual emphasis;
- primary CTA edge/highlight;
- legendary Power-Ups;
- achievement emphasis.

Do not use gold as the default body text color.

## Green

Use for:

- health;
- valid placement;
- positive recovery;
- uncommon rarity.

## Red

Use for:

- lost lives;
- invalid placement;
- dangerous alerts;
- destructive action;
- critical HP.

## Blue

Use for:

- arcane information;
- rare rarity;
- selected informational states where gold is not appropriate.

## Purple

Use for:

- magical/arcane damage;
- special enemy resistance;
- magical tower effects.

---

# 8. Typography

Bundle fonts with the application.

Recommended:

```text
Display / fantasy headings:
Cinzel SemiBold / Bold

UI / numeric / body:
Inter Medium / SemiBold / Bold
```

Use package-bundled font files such as Fontsource rather than depending on remote runtime font loading.

Fallbacks:

```css
--font-display: "Cinzel", Georgia, serif;
--font-ui: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

---

# 9. Type Scale

Use only these primary sizes.

```text
11 px  Micro label
12 px  Secondary label
14 px  Standard UI text
16 px  Important UI text
18 px  Panel heading
22 px  Section heading
28 px  Screen heading
36 px  Major game-state heading
48 px  Hero/game-over number
```

Do not invent a new font size for every component.

---

# 10. Typography Rules

- Numeric HUD values: Inter Bold.
- Panel headings: Cinzel SemiBold.
- Main menu title: Cinzel Bold.
- Body text: Inter Medium.
- All caps only for short labels.
- Avoid paragraphs wider than ~60 characters.
- Never use thin font weights on dark backgrounds.
- Avoid text glow except extremely subtle boss/legendary emphasis.

---

# 11. Spacing Scale

Use an 8 px base grid.

Allowed spacing values:

```text
4
8
12
16
24
32
40
48
64
```

Avoid arbitrary values such as 13, 19, 27, or 37 unless required for sprite alignment.

---

# 12. Corner Radius

```text
Small controls: 6 px
Buttons: 8 px
Panels: 10 px
Modal/reward panel: 12 px
```

Do not use 20–32 px SaaS-style radii.

Tower cards should not look like social media cards.

---

# 13. Borders

Standard:

```text
1 px solid var(--color-border-subtle)
```

Focused / selected:

```text
2 px solid var(--color-gold)
```

Danger:

```text
1–2 px solid var(--color-danger)
```

Avoid thick decorative borders except on major fantasy frames.

---

# 14. Shadows

Use shadows sparingly.

Standard floating panel:

```css
box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
```

Selected tower or reward:

```css
box-shadow:
  0 0 0 1px rgba(215, 170, 78, 0.22),
  0 10px 30px rgba(0, 0, 0, 0.32);
```

Do not stack multiple glowing shadows.

---

# 15. Texture

Panels may use very subtle texture suggesting:

- dark wood;
- slate;
- forged metal;
- aged stone.

Texture opacity must remain low enough that text stays clean.

Do not use photographic textures behind controls.

---

# 16. Battlefield Palette

Terrain should be lower contrast than gameplay entities.

Recommended:

```text
Forest ground: muted olive / charcoal green
Stone path: warm desaturated gray
Water: deep muted blue-green
Ruins: slate / brown-gray
Buildable clearings: slightly brighter ground value
```

Avoid saturated terrain.

Towers, enemies, projectiles, and placement indicators must visually separate from the map.

---

# 17. Battlefield Grid

Reference logical tile:

**64 × 64 px**

Recommended tower footprint:

**1 tile**

Large future towers may use:

**2 × 2 tiles**

Grid lines:

- hidden during normal play;
- shown subtly during tower placement.

Do not permanently draw a bright strategy grid.

---

# 18. Gameplay Screen Anatomy

Desktop reference at 1280×720:

```text
┌──────────────────────────────────────────────────────────────┐
│ Top HUD: 56 px                                               │
├──────────────────────────────────────────────┬───────────────┤
│                                              │               │
│                                              │ Tower /       │
│                BATTLEFIELD                   │ Selection     │
│                                              │ Inspector     │
│                                              │               │
│                                              │ 240 px        │
│                                              │               │
├──────────────────────────────────────────────┴───────────────┤
│ Build / Power-Up Tray: 80 px                                 │
└──────────────────────────────────────────────────────────────┘
```

This is the primary desktop composition.

The battlefield should retain visual priority.

---

# 19. Top HUD

Height:

**56 px**

Contains, left to right:

1. Wave
2. Gold
3. Lives
4. Score
5. Difficulty
6. flexible spacer
7. Speed
8. Pause

HUD panel background:

`--color-bg-panel`

Use separators sparingly.

---

# 20. HUD Metric Pattern

Every metric uses:

```text
small label
large value
optional icon
```

Example:

```text
GOLD
1,240
```

Do not write:

`Gold: 1240`

when there is room for a deliberate HUD treatment.

Numeric values should be instantly scannable.

---

# 21. Lives Treatment

Lives are critical.

Display:

- heart/shield-style original icon;
- numeric value;
- brief red pulse when damaged.

When lives <= 5:

- use danger color;
- do not flash continuously.

---

# 22. Wave Treatment

Wave receives strongest normal HUD emphasis.

Example:

During the siege the counter shows the wave out of 30. In endless it shows ∞:

```text
WAVE            WAVE
18/30           34/∞
```

Before a boss wave:

```text
BOSS WAVE
20/30
```

Use restrained gold/red emphasis.

The next-wave preview names the wave as "Wave w of 30" during the siege and "Wave w ·
Endless" in endless. Wave 30 is labelled "Siege finale · Wave 30". Only wave 30 carries
the siege-finale label.

---

# 23. Right Inspector

Desktop width:

**240 px**

Use for either:

- selected tower information;
- build catalog;
- contextual wave information.

Do not create multiple competing sidebars.

---

# 24. Bottom Tray

Height:

**80 px**

Contains:

- build shortcuts;
- Power-Up slots;
- start-next-wave action when applicable.

The bottom tray should feel like a strategy-game command bar, not a website navigation bar.

---

# 25. Main Menu

Composition:

- original game logo/title;
- subtle animated fantasy background;
- primary action: Play;
- secondary: Leaderboard;
- tertiary: Settings;
- secondary: Progression.

**Progression panel**
- Opened from the Progression menu button. It never takes permanent battlefield space.
- Lists the five branch achievements, each with:
  - its requirement;
  - its earned state;
  - its saved state (confirmed-saved, or earned-but-unsaved);
  - both branches of its archetype.
- It shows no run's qualification.
- When the unlock profile cannot be read, it shows an understandable progress-storage
  warning.

**Personal best**
- The menu shows the current-era personal best.
- A retained legacy best is shown separately on its own line, labelled "Legacy best", in
  secondary text. It is not shown when none exists.

Avoid:

- more than 4 menu buttons;
- feature cards;
- marketing copy;
- carousel UI.

Target visual:

**game title screen**, not landing page.

---

# 26. Difficulty Selection

Use three side-by-side compact panels on desktop.

Each includes:

- difficulty name;
- one-sentence description;
- lives;
- starting gold;
- score multiplier.

Recommended labels:

```text
EASY
Relaxed defense.

MEDIUM
Intended challenge.

HARD
Aggressive waves, higher score.
```

Selected difficulty:

- 2 px gold border;
- slightly raised background;
- clear check/selection indicator.

Do not make Easy green and Hard red as entire card backgrounds.

---

# 27. Buttons

## Primary

Use:

- dark raised background;
- gold border/accent;
- light text.

Hover:

- slightly brighter background;
- gold-bright border.

Pressed:

- 1–2 px visual depression.

## Secondary

Use:

- raised dark background;
- subtle border;
- primary text.

## Danger

Use for destructive/quit actions only.

Never use solid bright red as a normal CTA.

---

# 28. Button Sizes

Desktop:

```text
Small:   32 px high
Medium:  40 px high
Large:   48 px high
```

Touch target:
minimum approximately **44 px**

Horizontal padding:
16–24 px.

---

# 29. Icons

Style:

- solid or semi-solid fantasy strategy pictograms;
- consistent stroke/fill language;
- high silhouette recognition.

Recommended icon subjects:

- coin;
- shield/heart;
- crossed blades;
- hourglass;
- wave crest;
- hammer;
- upgrade chevron;
- sell pouch;
- snowflake;
- arcane crystal;
- lightning fork.

Do not use emojis.

Do not mix unrelated icon libraries with visibly different styles.

---

# 30. Tower Cards

Tower card recommended size:

```text
72–88 px wide
64–76 px high
```

Show:

- tower icon;
- short tower name;
- gold cost.

Optional small role badge:

- DPS
- AOE
- SLOW
- ARCANE
- CHAIN

Do not show full stats on every build card.

Detailed stats belong in inspector.

---

# 31. Selected Tower Inspector

Required:

- tower name;
- level;
- role;
- damage;
- attack speed;
- range;
- damage type;
- targeting;
- upgrade button + cost;
- sell button + refund.

Use two-column stat rows:

```text
Damage        42
Range         160
Attack        0.8s
```

Do not use charts for basic tower stats.

## 31.1 Evolution states

Locked, evolve, upgrading and mastery states use this same inspector, or the control sheet
on narrow screens. They keep:

- the existing tokens and fonts;
- sheet scrolling;
- 44 px touch targets;
- safe-area layout;
- focus affordances;
- reduced-motion rules.

They add no new panel and no confirmation modal.

Title line:

```text
Ranger · Level 4 · Ready to evolve
Marksman · Rank 2
Marksman · Rank 3 · Mastery 4
```

- **Unevolved level-4 tower.** Shown as **Ready to evolve**, never "Final upgrade".
- **Role line.** Shows the branch's effect once the tower has evolved; before that it
  shows the tower's role.
- **Branch choice.** A level-4 tower lists both branches of its archetype:
  - each with its name, effect and price;
  - the line "Branch choice is permanent for this tower.";
  - one purchase action per branch.

  There is no extra confirmation.
- **Locked alternative.** It stays visible, with its requirement and the current run's
  qualification state, and its action is disabled with "complete branch achievement".
- **Action labels.** They state the purchase and cost:
  - "Upgrade to level 3 · 180 gold"
  - "Evolve: Marksman · 510 gold"
  - "Marksman rank 2 · 935 gold"
  - "Mastery 1 · 1594 gold"
- **Disabled action.** It shows exactly one reason: reach level 4, defeat wave-10 boss,
  complete branch achievement, insufficient gold, finish evolution, continue into endless,
  paused/ended, or numeric limit reached.
- **Mastery.** The inspector shows the mastery rank, next damage and cost.
- **Sell.** The sell action shows the refund computed from the recorded spend.
- **Arcane Beacon.** Selecting an evolved Beacon shows its 160-unit aura radius.

**Evolution accent**
- An evolved tower keeps its level-4 art and adds a branch-specific crest above it, plus
  one chevron per evolution rank (rank + 1 chevrons).
- Each branch has a distinct crest silhouette:

  | Branch | Crest |
  |---|---|
  | Marksman | scope crest |
  | Volley | fanned quiver |
  | Siegebreaker | ram wedge |
  | Flame Mortar | flame crown |
  | Winterguard | shield crest |
  | Brittle Ice | shard spikes |
  | Spellbreaker | broken ward |
  | Arcane Beacon | beacon spire |
  | Stormcaller | twin forks |
  | Thunderlord | hammer head |

- Branches are told apart by label and silhouette, not by color alone.
- No new sprite atlas is used, and the accent has no tweens.

---

# 32. Tower Selection State

Selected tower:

- thin gold selection ring at base;
- range circle;
- inspector opens.

Do not tint the entire tower bright yellow.

---

# 33. Tower Range Indicator

Use:

- semi-transparent ring;
- minimal fill;
- crisp edge.

Suggested:

```text
stroke: rgba(215,170,78,0.80)
fill: rgba(215,170,78,0.08)
```

Range indicator is shown during:

- tower placement;
- tower selection.

Hide otherwise.

---

# 34. Placement Preview

Valid:

- tower ghost at ~70% opacity;
- green base indicator;
- readable range circle.

Invalid:

- tower ghost at ~55% opacity;
- red base indicator;
- optional small reason text near cursor/touch anchor.

Examples:

```text
Path blocked
Not enough gold
Occupied
Outside build zone
```

---

# 35. Enemy Readability

Enemy silhouettes must differ by role.

Recommended relative sizes:

```text
Runner       28–32 px
Basic        34–38 px
Armored      38–42 px
Brute        44–50 px
Boss         72–96 px
```

The player should identify enemy class before reading text.

---

# 36. Enemy Health Bars

Show:

- after first damage;
- always for elites and bosses;
- optionally always at higher zoom.

Standard enemy health bar:

```text
width: 26–40 px
height: 4 px
```

Boss health bar:

- dedicated UI treatment below top HUD or centered under it;
- boss name;
- HP percentage;
- status/resistance icons.

---

# 37. Damage Feedback

Use:

- small hit flash;
- impact particle;
- optional damage number.

Damage numbers should:

- be short-lived;
- not appear for every tiny damage tick if it causes clutter;
- use distinct treatment for crits or resisted damage if added later.

Never cover enemy sprites with large numbers continuously.

---

# 38. Projectile Visual Language

Physical:
- warm metallic / amber.

Frost:
- pale blue.

Arcane:
- purple.

Storm:
- teal/cyan.

Fire/explosion:
- orange.

Keep projectile colors consistent with tower role.

Evolution branches:

- **Marksman.** A longer, heavier arrow with a pale head.
- **Volley.** Thinner, lighter arrows, one per target, up to three per attack.
- **Flame Mortar.** A burning field is a translucent orange circle with a brighter orange
  rim, the size of the shell's splash radius. Each tower has at most one.
- **Status markers.** Each enemy shows one status ring, strongest effect first: stun
  (thick yellow), freeze (thick ice white), vulnerability (purple), slow (pale blue). Stun
  and freeze rings are thicker than vulnerability and slow rings.
- **Arcane Beacon.** The aura radius is a purple circle, shown only while the Beacon is
  selected.

A projectile's appearance follows the branch captured when it was fired, not the tower's
current state. Fields and particles stay within the combat effects budget (§39).

---

# 39. Combat Effects Budget

Effects must communicate gameplay.

Maximum principle:

**clarity before spectacle**

Avoid:

- full-screen bloom;
- constant screen shake;
- high-opacity particles;
- long-lived smoke over the route.

Use screen shake only for:

- boss arrival;
- major meteor;
- stronghold hit;
- very large tower impact.

Shake duration:
generally **80–180 ms**

---

# 40. Power-Up UI

Inventory slots:

**3**

Display:

- icon;
- rarity edge;
- optional quantity if future stacking is added.

Rarity should use edge/highlight color, not fully saturated card backgrounds.

---

# 41. Power-Up Reveal

Recommended structure:

```text
[rarity label]

[large icon]

POWER-UP NAME

one-line effect description

[USE NOW] [STORE]
```

Panel width:

**360–440 px desktop**

Animation:

- 150–200 ms fade/scale in;
- reveal highlight;
- no roulette animation longer than ~1 second.

---

# 42. Rarity Treatments

## Common
Gray/silver edge.

## Uncommon
Green edge.

## Rare
Blue edge.

## Legendary
Gold edge with restrained particle accent.

Legendary does not mean:
- giant explosion;
- flashing screen;
- unreadable glow.

---

# 43. Boss Warning

Duration:
**1.0–1.5 seconds**

Presentation:

- short audio cue;
- top-center banner;
- boss name;
- minimal dramatic darkening.

Do not completely hide the battlefield.

The banner names the boss and the wave label: "The Hollow Warden approaches · Wave 10 of
30". Only the wave-30 warning carries the siege-finale label: "The Hollow Warden approaches ·
Siege finale · Wave 30". Endless boss warnings use "Wave w · Endless".

---

# 44. Pause Menu

Centered compact panel.

Actions:

- Resume
- Settings
- Restart
- Quit to Menu

Restart and Quit are visually secondary/destructive.

Do not show the leaderboard inside pause.

---

# 45. Game Over Screen

Show:

1. Game Over title
2. Highest Wave
3. Final Score
4. Difficulty
5. Enemies Defeated
6. Bosses Defeated
7. Personal Best indicator if applicable
8. Submit/Leaderboard state
9. Play Again
10. Main Menu

Primary number:
Final Score.

Secondary:
Highest Wave.

Do not overwhelm the player with every internal statistic.

The same screen serves every terminal result. Its title and outcome line follow the outcome:

| Result | Title | Outcome line |
|---|---|---|
| Finished victory | SIEGE COMPLETE | The Borderkeep stands. The siege is won. |
| Siege failure at wave 10 | SIEGE FAILED | Siege failed: the first boss escaped |
| Siege failure at wave 30 | SIEGE FAILED | Siege failed: the final boss escaped |
| Endless defeat after a won siege | GAME OVER | Siege won · The Borderkeep fell in endless. |
| Defeat | GAME OVER | The Borderkeep has fallen |

The screen also shows:

- **Lives remaining.** The actual value; a siege failure keeps its positive lives.
- **Unlocks.** Any unlocks earned this run, with "(not saved)" for an unsaved one.
- **Legacy best.** The retained legacy personal best, labelled "Legacy best", when one
  exists.
- **Submit Score.** An explicit primary action. Nothing is submitted when the screen
  opens.
  - While a request is pending it reads "Submitting…" and is disabled.
  - After a failure it shows the reason and stays available to retry the same result.
  - After success it reads "Score Submitted" and is disabled.

All result actions (Submit Score, Play Again, Leaderboard, Main Menu) stay reachable in both
orientations. Below 768 px wide they sit in the scrolling sheet.

## 45.1 Victory Decision Panel

After the siege is won, a compact centered panel titled "Siege complete" shows score, lives
and unlocks above two actions: **Finish Run** and **Continue Endless**.

- The battlefield stays visible behind it and the simulation is frozen.
- Both actions are disabled until pending relic rewards are resolved.
- In the reward choice, relic activation and Use Oldest are unavailable, with the reason
  "Continue into endless to use relics".
- Pause stays reachable, using the existing pause-menu rules.
- The panel survives resize, rotation and backgrounding.

---

# 46. Leaderboard Design

Leaderboard is a game scoreboard, not an enterprise data table.

Columns:

```text
#
PLAYER
MODE
WAVE
SCORE
DATE
```

Use:

- compact row height;
- strong rank numbers;
- difficulty badge;
- highlighted current-player row.

Desktop row height:
**40–44 px**

Top 3 may receive restrained medal/gold/silver/bronze accents.

---

# 47. Toasts / Notifications

Use for:

- not enough gold;
- score submission failure;
- score submission success;
- settings saved;
- Power-Up acquired.

Position:
top-center below HUD or upper-right if it does not cover battlefield threats.

Duration:
**1.5–3 seconds**

Do not stack more than 3.

**Achievement notice**
- One brief notice per earned achievement: "Unlocked: <branch>".
- If saving failed, it adds "Unlock earned, but progress could not be saved".
- Notices queue and show one at a time, for 3 seconds each, in visible UI time. A
  background pause suspends them.
- Each notice is centered at the bottom of the battlefield, above the tray, in gold body
  text.
- It is nonblocking:
  - it has no interactive area;
  - it never covers or blocks Pause or boss controls;
  - it never changes pause state.

---

# 48. Tooltips

Desktop tooltips may explain:

- tower role;
- targeting mode;
- status effect;
- resistance icon;
- Power-Up.

Tooltips:

- appear after short hover delay;
- remain compact;
- never contain critical information unavailable on click/tap.

Touch devices need tap-accessible equivalents.

---

# 49. Motion Tokens

Use:

```text
Fast:      100 ms
Standard:  160 ms
Slow:      240 ms
Reward:    600–1000 ms
Boss cue:  1000–1500 ms
```

UI easing:

```css
cubic-bezier(0.2, 0.8, 0.2, 1)
```

Avoid long spring animations.

---

# 50. UI Animation Rules

Good:

- button depress;
- selection ring;
- panel fade/slide;
- gold number bump;
- damage pulse;
- Power-Up reveal;
- boss warning.

Bad:

- bouncing buttons;
- idle wobble everywhere;
- large floating panels;
- constant shimmering borders;
- looping text animation.

---

# 51. Responsive Rules

## >= 1180 px

Use:

- top HUD;
- right inspector;
- bottom command tray.

## 768–1179 px

Use expandable, internally scrollable build, tower, relic and next-wave sheets.
Keep essential HUD visible and at least half the battlefield exposed.

## < 768 px, both orientations

Use:

- two-row 104px HUD;
- bottom drawer for build controls;
- contextual tower inspector as slide-up panel.

Use a 64px action tray and expandable controls. Fit the battlefield proportionally
with overview, pinch zoom, drag-to-pan and Reset View. Touch actions have at least
44×44px hit targets and 8px separation. Body text is at least 14px; supplementary
text is at least 12px. No mandatory rotate prompt is shown. Short landscape layouts
at widths of at least 768px use a 56px HUD and the same sheet controls.

Respect safe-area insets and the dynamic viewport. Touch building and Meteor use
preview/confirm/cancel. Preserve run and modal state through rotation. The approved
responsive-playability spec dated 2026-10-08 supersedes the original portrait fallback.

---

# 52. Accessibility

Minimum expectations:

- readable contrast;
- labels do not rely only on color;
- keyboard focus visible in HTML UI;
- touch targets >= 44 px where practical;
- audio controls;
- reduced-motion support for nonessential UI motion;
- clear button states;
- no rapid flashing.

Placement state should combine:

- color;
- icon or symbol;
- cursor/outline behavior.

---

# 53. Loading Screen

Show:

- game mark/title;
- loading progress;
- one short rotating gameplay tip if desired.

Do not use fake progress.

Do not create a long cinematic.

---

# 54. Empty / Error States

Leaderboard unavailable:

```text
Leaderboard unavailable.
Your run is still saved locally.
[TRY AGAIN]
```

No scores:

```text
No champions yet.
Be the first to claim the board.
```

Avoid generic:
`Something went wrong.`

---

# 55. Asset Guidelines

All art must be:

- original;
- licensed;
- generated for the project;
- or clearly temporary developer art.

Asset categories:

```text
maps/
towers/
enemies/
bosses/
projectiles/
effects/
icons/
ui/
audio/
```

Do not mix uncoordinated free asset packs with radically different rendering styles.

---

# 56. Sprite Consistency

Choose and maintain one rendering language.

Recommended:

- stylized painted fantasy;
- strong silhouettes;
- moderate detail;
- slightly exaggerated tower tops/weapons;
- limited baked shadows;
- consistent light direction.

Avoid mixing:

- pixel art;
- flat vector;
- photorealism;
- hand-painted sprites

within the same battlefield.

---

# 57. Lighting

Use a consistent implied light source:

**upper-left / top-left**

Towers and enemies should share the same lighting direction.

Magic may emit local colored light visually, but should not reverse global lighting.

---

# 58. Map Decoration

Allowed:

- trees;
- rocks;
- ruins;
- banners;
- crystals;
- grass;
- torches;
- small bridges;
- broken carts;
- statues.

Decoration must never obscure:

- enemy route;
- tower placement;
- enemies;
- projectile impacts.

Keep decorative contrast below gameplay contrast.

---

# 59. Path Readability

Enemy route must be recognizable without debug lines.

Use:

- distinct material;
- edge stones;
- worn ground;
- subtle directional flow.

Do not draw bright arrows permanently.

Arrows may appear temporarily during tutorial or first-run help.

---

# 60. Stronghold

Stronghold must be visually distinct.

Requirements:

- clear destination landmark;
- health/life relevance;
- subtle idle animation;
- obvious hit reaction when an enemy escapes.

The stronghold should not look like another tower.

---

# 61. Asset Size Reference

At the 1280×720 reference:

```text
Tile:              64 px
Standard tower:    56–64 px
Enemy:             28–50 px
Boss:              72–96 px
Tower icon:        40–48 px
Power-Up icon:     48–64 px
HUD icon:          18–22 px
```

Adjust only if the chosen sprite style demands it.

---

# 62. CSS Token Starter

For HTML-based overlays:

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;

  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-panel: 10px;
  --radius-modal: 12px;

  --duration-fast: 100ms;
  --duration-standard: 160ms;
  --duration-slow: 240ms;

  --font-display: "Cinzel", Georgia, serif;
  --font-ui: "Inter", system-ui, sans-serif;
}
```

Do not duplicate tokens under different names.

---

# 63. Phaser UI vs HTML UI

Prefer Phaser-native UI for:

- combat HUD;
- tower placement;
- selected tower indicators;
- boss bars;
- Power-Up inventory during gameplay.

HTML overlay UI may be used for:

- main menu;
- settings;
- leaderboard;
- accessibility-heavy forms.

Do not create visible stylistic differences between Phaser UI and HTML UI.

They must share tokens and component rules.

---

# 64. Required Component Inventory

Implement reusable components/patterns for:

- PrimaryButton
- SecondaryButton
- DangerButton
- IconButton
- HUDMetric
- TowerCard
- TowerInspector
- PowerUpSlot
- RewardPanel
- DifficultyCard
- Toast
- ModalPanel
- LeaderboardRow
- Badge
- StatRow
- BossHealthBar
- PlacementIndicator

Do not independently restyle the same conceptual control in different screens.

---

# 65. Visual QA Reference Screens

Every implementation should be reviewed at these states:

1. Main Menu
2. Difficulty Selection
3. Empty Battlefield
4. Tower Placement Valid
5. Tower Placement Invalid
6. Early Wave
7. Heavy Wave
8. Selected Tower
9. Power-Up Reveal
10. Boss Wave
11. Paused
12. Game Over
13. Leaderboard
14. Tablet Width
15. Landscape Mobile Width
16. Selected Tower — Ready to evolve, with a locked alternative branch
17. Evolved Tower — branch accent, rank, and Beacon radius when selected
18. Mastery in endless
19. Achievement notice and the menu Progression panel
20. Victory Decision with pending relic rewards
21. Results — victory, siege failure and endless defeat, with Submit Score idle, failed and submitted
22. Replay after a finished or discarded run

Check states 16–22 at 1440×900, 1280×720, 1024×768, 844×390, 390×844 and 360×640, in
both orientations, including pause, background and rotation.

---

# 66. Visual QA Checklist

For every screen ask:

- Is the battlefield still the visual focus?
- Can I find Wave, Gold, Lives, and Score instantly?
- Are interactive elements clearly interactive?
- Is text readable without zoom?
- Are there any browser-default controls?
- Are colors from the token system?
- Are spacing values from the spacing scale?
- Are panel shapes consistent?
- Are icons stylistically consistent?
- Does any effect cover critical enemies?
- Does any UI feel like a SaaS dashboard?
- Does the screen still work at 1024×768?
- Does the screen still work at landscape mobile width?
- Are there any unexplained decorative elements?
- Is the selected state obvious?
- Is the next action obvious?
- Are evolution branches distinguishable by label and silhouette, not color alone?
- Does every disabled progression action show exactly one specific reason?
- Are victory and result actions reachable without overlap, clipped labels or input
  falling through panels?
- Do notices leave Pause and boss controls uncovered?
- Are burning fields and particles bounded?

If any answer is bad, the screen is not complete.

---

# 67. Screenshot Approval Criteria

A screen should not be considered polished until:

- alignment is consistent;
- no text overlaps;
- no clipped labels;
- no controls touch screen edges;
- no unreadable low-contrast text;
- no arbitrary colors;
- no temporary debug graphics;
- no visible placeholder icons;
- no inconsistent border radii;
- no unnecessary empty space;
- no UI blocking critical battlefield areas.

---

# 68. Common AI Failure Modes to Avoid

AI agents frequently produce these mistakes.

Do not:

- put every section inside a card;
- overuse gradients;
- overuse rounded rectangles;
- make every label uppercase;
- create tiny gray text;
- use mismatched icon packs;
- make the battlefield too small;
- use giant sidebars;
- render heavy particle effects constantly;
- use CSS blur for every panel;
- add fake decorative knobs and ornaments;
- create a 1990s stone-frame parody;
- copy Warcraft visual motifs directly;
- mix 3D-rendered towers with flat cartoon enemies;
- use green/red as full-screen difficulty themes;
- add unrequested currencies;
- add achievement popups during intense combat;
- hide important controls inside hover menus.

---

# 69. AI Agent Visual Implementation Procedure

When an AI agent modifies the UI, it must follow this order:

## Step 1
Read `SPEC.md`.

## Step 2
Read this document completely.

## Step 3
Identify the exact screen or component being modified.

## Step 4
Use existing tokens and components.

## Step 5
Implement the smallest required visual change.

## Step 6
Render/test the screen at:

- 1440×900
- 1280×720
- 1024×768
- 844×390 landscape

## Step 7
Check against the Visual QA Checklist.

## Step 8
Fix regressions before continuing.

Do not begin by inventing a new visual direction.

---

# 70. Final Visual Standard

The final result should communicate:

**"This is a real fantasy strategy game."**

It should not communicate:

**"This is a web dashboard containing a game canvas."**

The battlefield is the stage.

Towers and enemies are the actors.

The UI is the quiet stage crew that makes everything legible.
