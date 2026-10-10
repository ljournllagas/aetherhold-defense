# Campaign Worlds 1–3

This document records the implemented campaign foundation and its boundaries.
The product contract is in [SPEC.md](SPEC.md) §51; visual acceptance is in
[DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) §71. The runtime definitions in
[`src/game/campaign/`](../src/game/campaign/) hold the stable level IDs, exact
per-level mastery targets, combat tuning, enemy stats and route geometry.

## Scope and reuse

Campaign adds an illustrated route map, selected-level detail and enemy preview
for 30 levels. It reuses the existing fixed-step `GameScene`, towers, economy,
Power-Up flow, projectiles, effects, simulation clock and cleanup paths. Campaign
configuration is run-local. Its results do not affect Classic bests, branch
achievements, score submission or the siege leaderboard. Foundation-level
specializations are reversible sidegrades and never serve as Classic evolution
triggers. Worlds 4–10 are out of scope.

Each world uses an accepted 768×432 realm panel loaded by the separate campaign
entry stage. The map uses centered cover cropping with equal-axis scaling; world
captions wrap inside each currently visible realm slice and their backing height
follows the rendered lines. The three panels' exact provenance and acceptance are
recorded in [CAMPAIGN_WORLD_MAP_ART_PROVENANCE.md](CAMPAIGN_WORLD_MAP_ART_PROVENANCE.md).

## World and level plan

| World | Levels | Theme and canonical enemy family | Level layout sequence | Boss |
| --- | --- | --- | --- | --- |
| 1 · The Borderkeep | 1–10 | Forest fortress; Marchling, Skitter, Stoneback, Ironhide, Veilborn | A, A2, A3, B, B2, B3, C, C2, C3, D boss arena | The Hollow Warden |
| 2 · Emberfall Highlands | 11–20 | Volcanic frontier; Cinderling, Ashrunner, Magmahide, Ember Brute, Ashcaller | A, A2, A3, B, B2, B3, C, C2, C3, D boss arena | Cinder Colossus |
| 3 · Frostveil Pass | 21–30 | Snowbound mountain pass; Snowstalker, Icebound, Frostback, Glacier Knight, Frost Shaman | A, A2, A3, B, B2, B3, C, C2, C3, D boss arena | Frostbound Matriarch |

Each world reuses four canonical routes: A introduces the biome, B increases
pressure, C combines advanced threats, and D is the boss arena. Variants adjust
enemy composition and building clearings. They retain the same map family and
do not require 30 separately authored maps. The selected-level panel exposes
the level's configured objectives, progress/best score and lives, enemy roles,
warnings and boss guidance.

World 2 introduces a fast Ashrunner, armored Magmahide, Ember Brute and Ashcaller
support that briefly speeds nearby enemies. World 3 introduces a fast Snowstalker,
heavy Frostback, slow-resistant Glacier Knight and Frost Shaman support that
briefly increases nearby enemies' slow resistance.

## Boss mechanics

- **The Hollow Warden:** a temporary ward reduces damage; at half health it
  summons three Marchlings; below one quarter health its movement speed rises.
- **Cinder Colossus:** armor breaks at 65% health, then its core is exposed at
  30%; each transition lowers its armor and increases its speed, and the exposed
  core takes 1.3× damage.
- **Frostbound Matriarch:** resists slows, telegraphs periodic freezes, and freezes
  the nearest tower briefly. At half health it can target two towers instead of
  one. Freeze is temporary and simulation-time controlled.

The boss state/callout system and reset behavior are owned by
[`bosses.ts`](../src/game/campaign/bosses.ts) and the shared `GameScene`.

## Mastery and unlocks

Each level can earn a completion star, a configured remaining-lives star and a
configured score star. These are stored as separate monotone flags; replays add
missing stars and retain best score/lives. Completing each level in sequence
unlocks the next. The boss clears at 10, 20 and 30 award Border, Ember and Frost
Sigils. Border Sigil opens World 2; Ember Sigil opens World 3; Frost Sigil marks
completion of this three-world foundation.

| Stars | Unlock |
| ---: | --- |
| 10 | Aether Codex tactical entries |
| 20 | Preparation presets |
| 30 | Tower Specialization I |
| 45 | One Power-Up reroll per level |
| 60 | Tier III Runic Masterwork tower visuals |
| 75 | Veteran banner and advanced Codex stats |
| 90 | Frostveil Conqueror crest |

World Sigils separately grant the next world, Tier II visuals, boss Codex entries,
biome cosmetics and their named Power-Up additions. No permanent damage, gold
or lives bonus is granted. Specialization I offers two choices per tower:
Longbow Bastion / Repeater Tower; Siege Mortar / Ember Cannon; Glacial Spire /
Shatter Spire; Aether Obelisk / Prism Tower; Storm Conduit / Thunder Crown.
These choices are selected before battle and may be changed between levels.

## Local save

`CampaignRepository` stores data in browser local storage at
`aetherhold-campaign-v1`, with `campaignVersion: 1` and `progressionVersion: 1`.
It persists contiguous unlock progress, per-level star flags and bests, Sigils,
derived feature unlocks, tower choices/targeting and preparation presets. Save
input is validated; malformed or newer-version saves are not overwritten. If
storage is unreadable or unavailable, the UI reports that new progress is
session-only instead of claiming it was saved. No campaign progress is uploaded.

## Code ownership

- [`config.ts`](../src/game/campaign/config.ts): worlds, all 30 stable level
  definitions, star targets, milestones and Sigil rewards.
- [`maps.ts`](../src/game/campaign/maps.ts) and `mapLayout.ts`: canonical routes,
  variants and responsive route-node layout.
- [`enemies.ts`](../src/game/campaign/enemies.ts), `battle.ts` and `bosses.ts`:
  campaign-only combat content and mechanics.
- [`progress.ts`](../src/game/campaign/progress.ts): save versions, validation,
  monotone progression and unlock derivation.
- `specializations.ts` and `presentation.ts`: sidegrades and selected-level/Codex
  presentation models.
- [`artManifest.ts`](../src/game/campaign/artManifest.ts): gated production asset
  loading contract. Three world panels are `final`; the other 40 raster targets
  remain `final_required`; see
  [CAMPAIGN_PRODUCTION_ASSETS.md](CAMPAIGN_PRODUCTION_ASSETS.md).
