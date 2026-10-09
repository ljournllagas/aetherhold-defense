# Fantasy Tower Defense — Art Bible

**Document:** `ART_BIBLE.md`  
**Version:** 1.0  
**Status:** Authoritative Visual Production Reference  
**Applies to:** Towers, enemies, bosses, map art, terrain, stronghold, projectiles, VFX, icons, environmental props, animation, visual asset production  
**Companion documents:**

- `SPEC.md`
- `DESIGN_SYSTEM.md`
- `AI_AGENT_INSTRUCTIONS.md`

---

# 1. Purpose

This document defines the visual production language for the game's actual art assets.

`DESIGN_SYSTEM.md` governs interface structure, layout, colors, typography, controls, spacing, and UI behavior.

This Art Bible governs:

- world art;
- units;
- towers;
- enemies;
- bosses;
- map tiles;
- environment;
- projectiles;
- spell effects;
- icons;
- stronghold;
- animation;
- lighting;
- proportions;
- visual consistency.

The goal is to make visual output predictable even when different AI agents or artists contribute assets.

This document is not a mood board.

It is a production contract.

---

# 2. Visual Identity

The game world combines:

**fortified medieval fantasy + ancient arcane machinery + living wilderness**

The tone is:

- heroic;
- tactical;
- grounded;
- magical;
- readable;
- slightly weathered;
- colorful without becoming cartoon candy;
- stylized rather than realistic.

The world should feel old, defended, and repeatedly fought over.

Magic exists visibly, but it should feel embedded in architecture and nature rather than sprayed over every surface.

---

# 3. Originality Requirement

The game may evoke the broad emotional memory of classic fantasy RTS Tower Defense custom maps.

It must not reproduce or imitate recognizable copyrighted Warcraft or Blizzard-specific:

- tower designs;
- unit silhouettes;
- faction architecture;
- armor motifs;
- weapons;
- logos;
- icons;
- maps;
- fonts;
- spell visuals;
- character likenesses;
- UI frames;
- banners;
- symbols;
- lore.

Avoid direct visual equivalents such as:

- Orcish spiked wood copied from Warcraft;
- Human Alliance-style blue-and-gold castle motifs;
- Night Elf moonwell-like structures;
- Undead ziggurat-like towers;
- recognizable Warcraft spell circles or faction symbols.

Create an original fantasy language.

---

# 4. Rendering Style

Use one consistent rendering language:

**stylized hand-painted fantasy strategy art**

Characteristics:

- simplified readable forms;
- controlled edge detail;
- clear silhouette;
- moderate surface texture;
- slightly exaggerated weapons and tower crowns;
- strong value grouping;
- minimal micro-detail;
- readable at gameplay scale.

Do not mix:

- pixel art;
- photorealism;
- flat vector;
- painterly concept art;
- low-poly 3D;
- anime;
- cel shading;
- photographic textures

inside the same battlefield.

---

# 5. Camera and Perspective

Use:

**top-down three-quarter strategy perspective**

Recommended apparent viewing angle:

approximately **35–50 degrees downward**

The player should see:

- tower base;
- tower body;
- top weapon / focal element;
- enemy body mass;
- route clearly.

Do not use full isometric diamond-grid projection.

Do not use side-view sprites.

Do not use a steep top-down angle that turns towers into circles.

---

# 6. Light Direction

All baked/static art assumes:

**primary light from upper-left**

Approximate art-light vector:

```text
horizontal: left → right
vertical: top → bottom
```

Highlights:

- upper-left planes;
- top-facing surfaces;
- exposed magical crystal edges.

Shadows:

- lower-right;
- soft;
- short-to-medium.

Dynamic magical effects may emit local colored light but must not reverse the global lighting logic.

---

# 7. Value Structure

At gameplay scale, readability depends on value before color.

Use this priority:

1. silhouette;
2. light/dark grouping;
3. color identity;
4. texture;
5. small detail.

Every tower and major enemy must still be identifiable in grayscale.

Avoid equal-value neighboring shapes.

---

# 8. Saturation Rules

Terrain:
- low to medium saturation.

Towers:
- medium saturation.

Enemies:
- medium saturation with role accents.

Projectiles:
- medium to high saturation.

Power-Ups / major VFX:
- highest saturation.

This keeps the battlefield readable.

Do not saturate the entire map.

---

# 9. Material Language

Use recurring materials:

## Stone
- cool gray;
- blue-gray;
- weathered edges;
- restrained moss.

## Timber
- dark brown;
- muted;
- sturdy;
- not cartoon-orange.

## Bronze / Iron
- desaturated metal;
- scratches;
- darker seams.

## Arcane Crystal
- translucent;
- saturated core;
- darker exterior structure.

## Cloth
- desaturated;
- used mainly for banners or accents.

## Nature
- muted green;
- earthy;
- varied shape language;
- never brighter than combat effects.

---

# 10. Asset Scale Reference

At the 1280×720 gameplay reference:

```text
Logical tile:         64 px
Standard tower:       56–64 px footprint
Large tower:          80–112 px visual height
Basic enemy:          34–38 px
Runner:               28–32 px
Armored enemy:        38–42 px
Brute:                44–50 px
Boss:                 72–96 px
Projectile:           6–18 px
Power-Up icon:        48–64 px
HUD icon:             18–22 px
```

Gameplay-scale readability is more important than source-resolution beauty.

---

# 11. Asset Resolution

Recommended source master scale:

**2× final gameplay size**

Example:

A 64 px gameplay tower should be authored around 128 px or higher, then exported appropriately.

Use higher source resolution for:

- bosses;
- splash art;
- menus;
- large reward art.

Do not ship giant textures when the asset appears at tiny scale.

---

# 12. Edge Treatment

Prefer:

- slightly painted edges;
- subtle anti-aliasing;
- readable contour;
- controlled rim highlight only where useful.

Avoid:

- thick black cartoon outlines;
- excessive white rim lighting;
- glowing outlines around every object.

Selection outlines belong to gameplay UI, not baked art.

---

# 13. Tower Family Visual Language

All towers belong to one defensive civilization / engineering tradition.

Shared design DNA:

- stone or reinforced timber base;
- bronze/iron structural braces;
- magical crystal or energy focal point where applicable;
- triangular or hexagonal structural motifs;
- compact military silhouette;
- slightly weathered surface.

Different towers should look related without looking identical.

---

# 14. Tower Base

Tower bases should:

- clearly sit on the ground;
- fit approximately one logical tile;
- avoid overhanging too far into adjacent build zones;
- provide a stable visual center.

Recommended base shape:

- octagonal;
- square with clipped corners;
- compact circular stone platform with geometric braces.

Do not use tiny bases with huge floating structures unless specifically a magical tower.

---

# 15. Tower Upgrade Language

Tower upgrade levels must be visually readable.

Recommended progression:

## Level 1
- simple structure;
- one primary weapon/focus;
- limited decoration.

## Level 2
- thicker structure;
- reinforced braces;
- larger weapon/focus;
- additional accent element.

## Level 3
- visibly more advanced;
- stronger silhouette;
- secondary mechanical or magical component;
- brighter controlled energy.

## Final Upgrade
- unique crown/weapon silhouette;
- strongest recognizable form;
- restrained VFX accent;
- visually prestigious without becoming enormous.

Do not only recolor the same sprite.

---

# 16. Ranger Tower Art Direction

Role:
fast physical DPS.

Visual identity:

- narrow wooden/stone watchtower;
- elevated firing platform;
- dual-bow or repeating crossbow mechanism;
- light construction;
- agile silhouette.

Shape language:

- vertical;
- narrow;
- angular;
- open platform.

Palette:

- muted wood;
- iron;
- small warm-gold accent.

Do not make it a generic medieval castle turret.

---

# 17. Bombard Tower Art Direction

Role:
slow AOE physical damage.

Visual identity:

- heavy squat emplacement;
- oversized mortar/cannon;
- reinforced stone and metal;
- large recoil mass.

Shape language:

- wide;
- low;
- circular barrel;
- heavy base.

Palette:

- dark iron;
- stone;
- warm ember accent.

Projectile identity:

- heavy dark shell;
- amber-orange impact.

---

# 18. Frost Tower Art Direction

Role:
slow/control.

Visual identity:

- stone pedestal;
- suspended ice crystal or rotating frost core;
- delicate cold-energy fins;
- vertical magical silhouette.

Shape language:

- crystalline;
- tapered;
- symmetrical.

Palette:

- slate;
- pale blue;
- icy white;
- low-saturation turquoise.

Avoid making everything bright cyan.

---

# 19. Arcane Tower Art Direction

Role:
high magical single-target damage.

Visual identity:

- ancient arcane obelisk;
- floating segmented crystal;
- geometric energy channel;
- controlled purple focus.

Shape language:

- vertical;
- geometric;
- faceted;
- precise.

Palette:

- dark stone;
- muted bronze;
- purple/violet core.

Avoid neon-magenta sci-fi styling.

---

# 20. Tempest Tower Art Direction

Role:
chain damage.

Visual identity:

- forked conductors;
- rotating ring;
- suspended storm orb;
- exposed metal prongs.

Shape language:

- branching;
- circular;
- asymmetrical energy arcs.

Palette:

- dark metal;
- teal;
- blue-green;
- small white-hot electrical core.

Avoid Tesla-coil realism.

Keep it fantasy-engineered.

---

# 21. Tower Role Recognition

At a glance:

```text
Ranger   = tall / narrow
Bombard  = squat / heavy
Frost    = crystalline / vertical
Arcane   = geometric / obelisk
Tempest  = forked / ringed
```

If silhouette alone cannot distinguish them at normal zoom, redesign.

---

# 22. Enemy Family Visual Language

Enemies should feel like one broad invading ecosystem/faction, but not identical.

Recommended world concept:

**The Hollow March**

A corrupted wilderness host made of warped beasts, armored raiders, living stone creatures, and arcane-tainted predators.

This creates variety without copying existing fantasy factions.

Use original names in final implementation.

---

# 23. Enemy Design Principles

Enemies must be readable while moving.

Favor:

- large head/shoulder masses;
- strong body shape;
- clear limb rhythm;
- distinct locomotion;
- limited equipment detail.

Avoid:

- tiny accessories;
- thin silhouettes;
- excessive spikes;
- complex capes;
- overly humanoid designs at small scale.

---

# 24. Basic Enemy Art Direction

Suggested archetype:
**Marchling**

Visual identity:

- compact hunched creature;
- medium body;
- short limbs;
- rough hide/armor patches.

Silhouette:
balanced and immediately readable.

Palette:
earth brown, gray-green, muted red accent.

---

# 25. Runner Art Direction

Suggested archetype:
**Skitter**

Visual identity:

- low body;
- long rear limbs;
- forward-leaning posture;
- narrow silhouette.

Animation:
fast short stride or bounding gait.

Palette:
dark green / ochre.

Avoid tiny unreadable insect-like detail.

---

# 26. Brute Art Direction

Suggested archetype:
**Stoneback**

Visual identity:

- broad shoulders;
- very large torso;
- heavy forearms;
- thick legs;
- visible stone or bone plating.

Animation:
slow heavy stride.

Palette:
charcoal, brown-gray, muted orange fissures.

---

# 27. Armored Enemy Art Direction

Suggested archetype:
**Ironhide**

Visual identity:

- heavy frontal plates;
- layered armor shell;
- reduced visible flesh;
- broad shield-like upper body.

Silhouette:
blocky.

Palette:
iron, slate, muted rust.

Physical resistance should be visually obvious.

---

# 28. Arcane-Resistant Enemy Art Direction

Suggested archetype:
**Veilborn**

Visual identity:

- dark organic body;
- crystal growths;
- subtle purple/blue interference aura;
- narrow but unusual silhouette.

Do not use a generic glowing mage robe.

Resistance should read as a bodily trait, not just a floating icon.

---

# 29. Regenerator Art Direction

Suggested archetype:
**Rootwretch**

Visual identity:

- bark/flesh hybrid;
- vine growth;
- pulsing green core;
- asymmetrical limbs.

Regeneration VFX:
subtle inward green motes or growth pulse.

Avoid bright healing beams.

---

# 30. Swarm Enemy Art Direction

Suggested archetype:
**Gnawlings**

Visual identity:

- small;
- simple silhouette;
- high group readability.

Important:
swarm enemies should visually read as a mass.

Do not give every small creature elaborate details.

---

# 31. Boss Art Direction

Bosses must feel related to the enemy faction while being visually exceptional.

Boss traits:

- 1.7–2.5× normal enemy visual footprint;
- unique silhouette;
- large readable head/torso shape;
- one signature material or magical element;
- controlled VFX;
- clear attack/ability cue.

Do not simply enlarge a normal enemy sprite.

---

# 32. Boss #1 Direction

Suggested name:
**The Hollow Warden**

Visual concept:

- ancient beast in broken fortress armor;
- large shield-like shoulder structures;
- glowing corruption core in chest;
- heavy stride.

Primary mechanic candidate:
temporary damage reduction.

Palette:
stone gray, dark bronze, muted crimson core.

---

# 33. Boss #2 Direction

Suggested name:
**Stormmaw**

Visual concept:

- large quadruped predator;
- split horn structures;
- internal teal lightning;
- faster motion than Warden.

Primary mechanic candidate:
temporary haste.

Palette:
deep slate, teal, pale electric accents.

---

# 34. Boss #3 Direction

Suggested name:
**The Root Sovereign**

Visual concept:

- massive plant-stone hybrid;
- crown-like branch structure;
- pulsing life core;
- slow but regenerating.

Primary mechanic candidate:
regeneration + summons.

Palette:
charcoal bark, moss, sickly green core.

---

# 35. Boss Visual Escalation

Later bosses may become more elaborate, but preserve readability.

Escalation should occur through:

- silhouette complexity;
- scale;
- VFX;
- armor;
- animation;
- mechanics.

Do not rely only on brighter glow.

---

# 36. Stronghold Art Direction

The stronghold is the player's protected destination.

Visual identity:

- compact fortified keep;
- central arcane beacon/core;
- stone foundation;
- defensive banners or lanterns;
- visibly different from towers.

Shape language:

- broad base;
- central vertical beacon;
- fortress silhouette.

Palette:

- warm stone;
- dark metal;
- restrained gold;
- pale arcane core.

The stronghold should feel valuable and defensible.

---

# 37. Stronghold States

## Healthy
- steady core glow;
- intact structure.

## Damaged
- small cracks;
- intermittent sparks;
- subtle smoke.

## Critical
- stronger cracks;
- low-intensity ember effect;
- red UI treatment, not a fully red sprite.

Do not replace the entire stronghold art for every life lost.

---

# 38. Map Theme

MVP map visual theme:

**Ancient Border Keep**

Setting:

- abandoned forest road;
- weathered defensive ruins;
- fortified stronghold;
- old arcane infrastructure;
- wilderness reclaiming stone.

This supports towers, ruins, magic, and enemy invasion without copying an existing franchise.

---

# 39. Terrain Palette

Recommended approximate ranges:

```text
Grass:
#43533D
#58644B
#687054

Stone path:
#766F63
#8A8172
#5E5A53

Earth:
#665544
#78634D

Water:
#2D5557
#3B6665

Ruins:
#596069
#72777C

Moss:
#5C6B45
```

These are art-direction anchors, not UI semantic tokens.

Terrain may vary naturally around them.

---

# 40. Path Art

Path must be readable without arrows.

Use:

- lighter stone/earth than surrounding terrain;
- compressed or worn center;
- scattered edge stones;
- occasional cart grooves;
- subtle directional rhythm.

Avoid:

- glowing road edges;
- permanent arrow decals;
- high-contrast checker patterns.

---

# 41. Buildable Area Art

Buildable terrain should visually feel plausible.

Use:

- clearings;
- stone pads;
- grass flats;
- old defensive foundations.

Do not permanently mark every build cell.

Grid appears only during placement mode.

---

# 42. Environment Props

Allowed props:

- trees;
- broken walls;
- stones;
- ruins;
- banners;
- old carts;
- barrels;
- torches;
- crystals;
- grass clumps;
- mushrooms;
- small water features;
- statues.

Props should:

- enrich the map;
- create world identity;
- avoid obstructing route readability.

---

# 43. Prop Density

Near route:
low density.

Far from route:
medium density.

Behind stronghold:
medium-high decorative density allowed.

Never place visually loud props behind active combat areas if they compete with enemies.

---

# 44. Tree Art Direction

Trees:

- broad simplified canopy;
- dark trunk;
- muted leaves;
- asymmetrical but readable;
- avoid photoreal detail.

Use 2–4 major silhouette variants.

Do not rotate one identical tree endlessly.

---

# 45. Ruin Art Direction

Ruins:

- chipped stone;
- moss;
- subtle bronze fixtures;
- no ornate cathedral-level detail.

Ruins should imply:

**old defense network**

not:

**high fantasy palace**

---

# 46. Crystal Art Direction

Arcane crystals:

- faceted;
- translucent center;
- dark support/base;
- limited glow radius.

Do not use crystals as decoration everywhere.

Reserve them for:

- arcane tower;
- old map machinery;
- stronghold;
- specific Power-Ups.

---

# 47. Projectile Language

Every tower family has a distinct projectile identity.

## Ranger
small physical bolt/arrow.

## Bombard
heavy shell with subtle smoke trail.

## Frost
short pale-blue shard or pulse.

## Arcane
tight purple energy lance/orb.

## Tempest
brief teal-white arc.

Projectiles must remain visible but not oversized.

---

# 48. Impact Language

## Physical
small sparks/dust.

## Bombard
dust + orange impact + debris.

## Frost
ice shards + brief pale mist.

## Arcane
purple geometric burst.

## Tempest
forked teal-white flash.

Effects should disappear quickly.

---

# 49. Damage Type Visual Coding

Use consistent VFX language:

```text
Physical   = amber / steel / dust
Arcane     = violet / geometric energy
Elemental  = blue-green / frost / storm depending subtype
```

Do not introduce unrelated colors for the same damage type.

---

# 50. Frost Effects

Frost should look:

- cold;
- crystalline;
- restrained;
- thin-edged.

Use:

- shards;
- small frost ring;
- subtle slowing trail.

Avoid:

- giant opaque blue circles;
- full enemy recoloring;
- long-lasting fog.

---

# 51. Arcane Effects

Arcane should look:

- precise;
- geometric;
- ancient;
- concentrated.

Use:

- segmented rings;
- faceted sparks;
- brief glyph fragments.

Avoid:
- endless magical circles covering the path.

---

# 52. Storm Effects

Storm should look:

- energetic;
- branching;
- short-lived.

Use:

- 1–3 visible forks;
- sharp white core;
- teal outer energy.

Avoid:
- constant screen-wide lightning.

---

# 53. Explosion Effects

Bombard/explosion:

- warm center;
- dust/debris outer layer;
- quick expansion;
- short fade.

Duration:
roughly 250–450 ms.

Avoid:
- huge fireballs that obscure multiple towers.

---

# 54. Power-Up Visual Identity

Power-Ups should use symbolic fantasy relics rather than generic game icons.

Examples:

## Gold Cache
sealed coin coffer.

## Meteor
burning rune stone.

## Time Lock
broken hourglass with frozen shards.

## Battle Tempo
war drum / crossed speed marks.

## Arcane Surge
charged crystal.

## Stronghold Repair
stone-and-gold repair sigil.

## Treasure Creature
small jeweled creature silhouette.

## Double Bounty
paired coin crest.

## Tower Overcharge
tower core surrounded by energy ring.

## Ancient Blessing
sun/stone relic.

---

# 55. Power-Up Rarity Art

Common:
simple iron/silver frame.

Uncommon:
green inset gem/accent.

Rare:
blue arcane inset.

Legendary:
gold structural frame + small particle accent.

Do not fully recolor the icon for rarity.

Icon identity must remain consistent.

---

# 56. UI Icon Production

Icons should use:

- 2–3 value groups;
- simple silhouettes;
- minimal inner detail;
- consistent pseudo-3D or painted treatment;
- transparent background.

Avoid:

- line-only icons beside painted icons;
- emojis;
- random open-source icon sets with mismatched stroke weights.

---

# 57. Icon Shape Language

Preferred:

- sturdy;
- symmetrical where appropriate;
- clear negative space;
- readable at 18–22 px.

Icons should be recognizable without labels at 24 px where possible.

---

# 58. Animation Principles

Animation style:

- quick;
- responsive;
- weight-aware;
- readable;
- not excessively elastic.

Combat animation must never make the game feel sluggish.

---

# 59. Tower Idle Animation

Keep subtle:

- small weapon tracking;
- crystal rotation;
- tiny energy pulse;
- slight mechanical movement.

Do not animate entire tower bodies continuously.

---

# 60. Tower Attack Animation

Ranger:
quick recoil/release.

Bombard:
heavy recoil.

Frost:
brief crystal flare.

Arcane:
focus/charge then discharge.

Tempest:
ring spin/forked arc.

Attack animation should reinforce attack cadence.

---

# 61. Enemy Walk Animation

Use distinct locomotion:

Runner:
fast bounding.

Basic:
steady march.

Brute:
slow heavy weight shift.

Armored:
stiff, deliberate.

Regenerator:
uneven organic movement.

Boss:
large deliberate motion.

Animation must reflect gameplay speed differences.

---

# 62. Enemy Death Animation

Target duration:
250–500 ms.

Use:

- collapse;
- dissolve;
- break apart;
- brief energy release.

Do not let corpses persist and clutter the path.

Boss death may be longer:
700–1200 ms.

---

# 63. Hit Reaction

Normal enemy:
small 1–2 frame or 50–100 ms reaction.

Boss:
subtle reaction only.

Do not stop enemy movement for every damage event unless the game mechanic requires it.

---

# 64. Selection Visuals

Selection ring / range ring is UI, not baked art.

Tower asset should not contain permanent:

- green circles;
- yellow outlines;
- selection arrows.

Keep art reusable.

---

# 65. Shadow Rules

Use soft contact shadows.

Tower:
compact oval or footprint-conforming shadow.

Enemy:
small soft ellipse.

Boss:
larger but not pitch-black.

Projectiles:
generally no ground shadow unless slow/large.

Avoid sharp directional shadows that conflict with baked lighting.

---

# 66. VFX Layering

Recommended render order:

```text
terrain
ground decorations
path
ground decals
tower bases
enemies
towers / structures
projectiles
impact effects
selection/range indicators
floating combat text
HUD
```

Some scenes may require local exceptions.

Do not let ground VFX render above UI.

---

# 67. Particle Budget

Use particles intentionally.

Suggested on-screen target:

- normal wave: low-to-medium particle density;
- heavy wave: medium;
- boss event: short high-intensity burst permitted.

Avoid hundreds of long-lived particles.

Use pooling.

---

# 68. Screen Shake

Permitted:

- stronghold hit;
- boss entrance;
- meteor;
- very heavy bombard impact.

Not permitted:

- every normal tower shot;
- every enemy death;
- basic Power-Up pickup.

Keep shake short and low amplitude.

---

# 69. Environmental Animation

Allowed:

- torch flicker;
- water ripple;
- banner movement;
- subtle crystal pulse;
- drifting leaves;
- occasional ambient particles.

Do not animate everything.

Environmental motion should sit below gameplay motion in visual priority.

---

# 70. Weather

MVP:
no heavy weather required.

Optional subtle ambience:

- drifting leaf;
- mild fog at map edge;
- rare dust mote.

Avoid:
- rain covering route readability;
- lightning independent of Tempest mechanics;
- dense fog.

---

# 71. Background Layers

Keep outer/background space darker and lower contrast than playable field.

Use:

- forest edge;
- cliff;
- ruined wall;
- dim terrain extension.

Do not put high-contrast landmarks outside the map that compete with the battlefield.

---

# 72. Main Menu Background Art

The main menu should use a composition built from the same world.

Recommended:

- distant border keep;
- forested approach;
- one tower silhouette;
- arcane beacon;
- dawn/dusk lighting.

Do not use unrelated heroic character splash art if the game is primarily about towers.

The menu should visually promise the battlefield experience.

---

# 73. Difficulty Art Treatment

Difficulty modes should not require separate worlds.

Use restrained visual modifiers:

Easy:
slightly warmer calm accent.

Medium:
neutral intended look.

Hard:
subtle danger accent / darker banner.

Do not recolor the entire interface by difficulty.

---

# 74. Game Over Art Treatment

Use:

- darkened battlefield or controlled vignette;
- damaged stronghold;
- reduced saturation;
- score panel.

Do not switch to an unrelated cinematic illustration.

Keep continuity with the run.

---

# 75. Leaderboard Art Treatment

Leaderboard may use:

- carved slate/metal panel;
- small trophy/crest motif;
- subtle animated torch/crystal.

It must remain readable and compact.

Do not add giant decorative medals to every row.

---

# 76. Menu Emblem / Game Mark

Create an original symbol for the game.

Recommended concept:

**fortress gate + arcane crystal + defensive chevron**

The symbol should:

- work at 32 px;
- work in monochrome;
- work as favicon;
- not resemble an existing game faction crest.

---

# 77. Naming and Art Cohesion

Names should reinforce art.

Example pairings:

```text
Ranger Tower     → Watchtower / crossbow silhouette
Bombard Tower    → Mortar Bastion
Frost Tower      → Glacial Spire
Arcane Tower     → Aether Obelisk
Tempest Tower    → Storm Conduit
```

Final names may differ, but avoid names that imply visuals the asset does not have.

---

# 78. Audio-Visual Sync

Major VFX timing should match audio:

- cannon impact with explosion frame;
- arcane discharge with energy flash;
- boss cue with banner appearance;
- stronghold hit with shake;
- Power-Up reveal with rarity highlight.

Do not let audio feel detached from visible events.

---

# 79. Asset Naming Convention

Use predictable names.

Example:

```text
tower_ranger_l1.png
tower_ranger_l2.png
tower_ranger_l3.png
tower_ranger_final.png

enemy_marchling_walk_01.png
enemy_stoneback_walk_01.png

boss_hollow_warden_idle.png

fx_arcane_impact_01.png
fx_frost_slow_01.png

icon_powerup_meteor.png
icon_tower_ranger.png
```

If using atlases:

```text
tower_ranger.json
tower_ranger.png
```

Do not use names like:

```text
newtower2final_FINAL.png
enemy-good-v3.png
```

---

# 80. Asset Folder Structure

Recommended:

```text
public/
  assets/
    world/
      terrain/
      path/
      props/
      stronghold/
    towers/
      ranger/
      bombard/
      frost/
      arcane/
      tempest/
    enemies/
      basic/
      runner/
      brute/
      armored/
      resistant/
      regenerator/
      swarm/
    bosses/
    projectiles/
    effects/
    powerups/
    icons/
    ui/
    audio/
```

---

# 81. Asset Metadata

For production assets, maintain metadata where practical:

```text
asset id
category
source
license
author/generator
date created
version
notes
```

Do not ship unknown-license art.

---

# 82. Generated Art Rules

AI-generated art may be used if permitted by project policy.

Generated assets must still pass:

- originality review;
- consistency review;
- silhouette review;
- lighting review;
- gameplay-scale readability review.

Do not accept an asset merely because it looks impressive at 1024 px.

Test it at actual gameplay size.

---

# 83. Asset Review at Gameplay Scale

Every tower/enemy asset must be reviewed at:

```text
100% gameplay scale
75% gameplay scale
125% gameplay scale
```

Ask:

- Can I identify it?
- Does it merge into terrain?
- Does its role read?
- Is the silhouette distinct?
- Is detail becoming noise?

If it only looks good when enlarged, it fails.

---

# 84. Grayscale Review

For every tower/enemy family:

convert temporarily to grayscale.

Verify:

- distinct silhouettes;
- readable value separation;
- path/background contrast;
- boss dominance.

If all units collapse into the same gray blob, revise.

---

# 85. Color-Blind Safety

Do not encode important combat roles using only red/green distinction.

Pair color with:

- shape;
- icon;
- silhouette;
- particle behavior.

Example:

armored enemy should look armored even if color perception differs.

---

# 86. Animation Frame Budget

Suggested sprite animation ranges:

```text
Enemy walk:       6–10 frames
Tower attack:     4–8 frames
Enemy death:      5–8 frames
Boss special:     6–12 frames
Ambient props:    4–8 frames
```

These are guidelines, not hard technical limits.

Avoid excessive frame counts that inflate downloads without visible benefit.

---

# 87. Web Performance Art Rules

Optimize for browser delivery.

Use:

- texture atlases;
- compressed audio;
- appropriately sized PNG/WebP where supported;
- sprite reuse;
- pooled VFX.

Avoid:

- dozens of 4K textures;
- uncompressed WAV for all effects;
- huge transparent sprites with tiny content;
- excessive unique particles.

---

# 88. Asset Loading Priority

Load first:

- core map;
- basic towers;
- basic enemies;
- HUD icons;
- essential VFX.

Defer or lazy-load where practical:

- later bosses;
- nonessential decorative assets;
- optional menu art.

Do not block first play on unnecessary assets.

---

# 89. First-Run Visual Experience

The first 60 seconds should showcase:

- clear path;
- stronghold;
- tower placement;
- tower attack;
- readable enemy death;
- gold gain;
- clean HUD.

Do not overwhelm first-run players with:

- massive VFX;
- too many enemy types;
- huge tutorial overlays.

---

# 90. Visual Progression Through a Run

Early:
- calmer;
- fewer effects;
- basic enemies.

Mid:
- more mixed silhouettes;
- stronger tower upgrades;
- more visible magic.

Late:
- more intense but still readable;
- elite effects;
- bosses;
- upgraded towers;
- stronger Power-Up moments.

Escalation should be visible without turning the screen into visual noise.

---

# 91. Visual Upgrade Test

A tower upgrade should be recognizable without opening the inspector.

Ask:

- Is the weapon larger?
- Is the crown changed?
- Is the crystal/core stronger?
- Is structure reinforced?
- Does the silhouette evolve?

If answer is no, the upgrade art is insufficient.

---

# 92. Boss Readability Test

At normal zoom:

- boss must be instantly distinguishable;
- health bar must correspond clearly;
- mechanic cue must be visible;
- boss must not visually disappear inside effects.

---

# 93. VFX Readability Test

For each effect:

1. What gameplay information does it communicate?
2. Is its color consistent?
3. How long is it visible?
4. Does it cover enemies?
5. Does it stack badly with multiple copies?

If it communicates nothing, remove or reduce it.

---

# 94. Asset Acceptance Checklist

Before marking an asset production-ready:

- original;
- correct category;
- correct perspective;
- correct lighting;
- correct scale;
- clear silhouette;
- correct palette family;
- readable at gameplay size;
- compatible with neighboring assets;
- no accidental copyrighted motif;
- optimized file size;
- correct filename;
- transparent background where required.

---

# 95. Tower Acceptance Checklist

Each tower must pass:

- family resemblance;
- unique role silhouette;
- correct level progression;
- readable weapon/focus;
- range indicator works around it;
- selection ring not obscured;
- fits one build tile visually;
- readable against terrain.

---

# 96. Enemy Acceptance Checklist

Each enemy must pass:

- archetype silhouette;
- role readable at speed;
- health bar readable;
- hit VFX readable;
- path contrast adequate;
- death does not leave clutter;
- animation speed matches movement.

---

# 97. Boss Acceptance Checklist

Each boss must pass:

- unique silhouette;
- visual hierarchy;
- mechanic cue;
- dedicated health bar compatibility;
- impact without visual obstruction;
- death sequence;
- no copyrighted resemblance.

---

# 98. Map Acceptance Checklist

The map must pass:

- route readable without arrows;
- spawn readable;
- stronghold readable;
- tower build areas understandable;
- decorations do not obstruct;
- terrain saturation controlled;
- tower/enemy contrast adequate;
- no dead visual zones that look unfinished.

---

# 99. Cross-Agent Consistency Rule

Any AI agent generating or modifying art must:

1. read this document first;
2. identify the asset category;
3. follow the category's silhouette, palette, and material rules;
4. inspect neighboring existing assets;
5. preserve light direction;
6. preserve rendering style;
7. review at gameplay scale.

Do not generate each asset from scratch with a totally independent prompt.

---

# 100. Suggested AI Image Prompt Template

When generating concept/reference art, use a structure like:

```text
Original fantasy tower defense game asset.
Stylized hand-painted strategy game art.
Top-down three-quarter perspective, approximately 40-degree downward view.
Upper-left light source.
Readable silhouette at small gameplay scale.
Muted environment palette, medium saturation unit palette.
Weathered stone, dark iron, restrained magical energy.
No text, no UI, transparent or simple neutral background.
Original design, not based on any existing game franchise.

Asset:
<asset description>

Role:
<gameplay role>

Required silhouette:
<shape language>

Palette:
<palette>

Materials:
<materials>

Avoid:
<prohibited motifs and style conflicts>
```

Do not omit the originality clause.

---

# 101. Reference Screen Targets

The project should eventually maintain approved screenshots for:

1. Main Menu
2. Difficulty Selection
3. Empty Battlefield
4. Early Wave
5. Heavy Wave
6. Tower Placement
7. Selected Tower
8. Power-Up Reveal
9. Boss Wave
10. Game Over
11. Leaderboard
12. Tablet
13. Landscape Mobile

These images become visual regression targets.

---

# 102. Art Review Process

For new production art:

## Step 1
Concept.

## Step 2
Silhouette review.

## Step 3
Palette/material review.

## Step 4
Gameplay-scale test.

## Step 5
Animation/VFX test if applicable.

## Step 6
In-game screenshot review.

## Step 7
Approve or revise.

Do not approve assets only from isolated image previews.

---

# 103. What "Polished" Means

Polished does not mean:

- more detail;
- more particles;
- more glow;
- more animation;
- more decoration.

Polished means:

- coherent;
- intentional;
- readable;
- responsive to gameplay;
- visually consistent;
- technically optimized.

---

# 104. Final Art Standard

The finished game should look like one studio created it.

A player should never wonder:

- why one tower looks like pixel art;
- why one enemy looks photoreal;
- why one spell uses neon sci-fi effects;
- why icons use five different styles;
- why shadows point in different directions.

The world should feel authored.

The strongest visual test is simple:

**If all UI were temporarily hidden, the battlefield should still look like a coherent original fantasy strategy game.**
