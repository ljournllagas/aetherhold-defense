# Additional Towers — Progression Spec (2026-10-15)

Grill-approved: gap-fill, 2 towers, full parity, sidegrade-only.
Classic 5-tower balance untouched; new content lives in extension modules.

## Roster

| Tower | Role | Type | L1 | L2 | L3 | L4 | Total |
|---|---|---|---|---|---|---|---|
| sentinel `Sentinel` | EXEC anti-boss | physical | 30/150/1.4/150 | 55/155/1.3/135 | 105/165/1.15/270 | 210/180/1.0/480 | 1035 |
| cinder `Cinder` | ZONE denial | elemental | 12/130/1.6/s60/150 | 22/138/1.5/s66/130 | 42/148/1.35/s74/250 | 88/162/1.2/s88/470 | 1000 |

Format: damage/range/interval/cost (+splash s). Both totals in 870–1110 band.
Armor: physical → `physicalArmor`, elemental → `wardArmor*0.5` (`CombatSystem.ts:9-14`). No new armor type.

## Evolutions R0–R3 (shared factors)

`DAMAGE_FACTORS=[1.2,1.55,2.6,3.38]`, `INTERVAL=[1,0.97,0.94,0.9]`,
`RANGE=[1,1.03,1.06,1.1]`, `COST=[1.5,2,2.75,8]` (`evolutions.ts:11-14`).
Cost = `ceil(L4cost*factor)`. Same L4 + wave-10 `evolutionOpen` gate,
starter always available, alt needs achievement, permanent choice,
mastery endless-only `round(rank3*(1+0.05*m))`, `ceil(rank3*1.25^(m+1))`.

### sentinel (L4 480 → evo 720/960/1320/3840, full 7875)

- `deadeye` starter, 1.35x dmg / 1.25x int / boss x2.0:
  R0 340/180/1.25, R1 439/185.4/1.2125, R2 737/190.8/1.175, R3 958/198/1.125.
  R3 general 851 DPS < marksman 1077; boss 1702 > marksman 1616 (+5%).
- `headhunter` alt, 0.75x dmg / volley 2:
  R0 189, R1 244, R2 410, R3 532 (ranges/intervals mirror deadeye, int x1).
  R3 591/target; 2-target 1182 beats volley 2-target 1096, loses 3-target 1645.
  Note: grill Q8 execute mechanic dropped — volleyTargets=2 uses existing
  `EffectiveTowerStats` only, zero `EvolutionCombat.ts` change.

### cinder (L4 470 → evo 705/940/1293/3760, full 7698)

- `pyre` starter, 0.75x dmg / burningField / splash 110:
  R0 79/162/1.2, R1 102/166.86/1.164, R2 172/171.72/1.128, R3 223/178.2/1.08.
  Per-target loses to flame-mortar 507; wins coverage 110 vs 90 (+49% area)
  + cheaper full 7698 vs 7860. Field 3s/0.5s/0.3x (`EvolutionCombat.ts:84-93`).
- `contagion` alt, 0.6x dmg / burningField / vuln [1.15,1.20,1.25,1.30]/3000ms:
  R0 63, R1 82, R2 137, R3 178 (same ranges/intervals as pyre, splash 88).
  Wins damage synergy vs brittle-ice, loses slow control (no slow field).

Mastery first costs: sentinel 4800, cinder 4700. Sell 70% (`towers.ts:124-130`):
sentinel L4 724, full deadeye 5512; cinder L4 700, full pyre 5388.

## Campaign specs (2 each)

- `sentinel_bastion` 1.15/1.12/1.2, `sentinel_repeater` 0.8/0.88/0.82.
- `cinder_mortar` splash 1.25/int 1.2, `cinder_cannon` 0.9/0.8/0.9 + burn 1000ms x0.12.
  Mirrors `specializations.ts:10-61` shape.

## Art (recolor + crest, Q13)

- sentinel reuses `tower_longbow`, color `0xd7aa4e`; cinder reuses
  `tower_ember`, color `0xde8742` (`additionalTowerArt.ts`).
- New crests `crosshair-dagger` (deadeye/headhunter),
  `pit-cauldron` (pyre/contagion) — vector only, same 24x24 contract as
  `drawSilhouette` (`towerArt.ts:312-353`).
- Deferred painted drop-ins: `tower_sentinel/cinder_stages-v1.webp` (627px),
  `sentinel/cinder-tier2/3-v1.png` (192px). No `artManifest.ts` change until present.

## Files

- `src/game/config/additionalTowers.ts`
- `src/game/config/additionalEvolutions.ts`
- `src/game/campaign/additionalSpecializations.ts`
- `src/game/art/additionalTowerArt.ts`
- `tests/additional-towers-progression.test.ts`

## Enablement (not done — keeps 5/10-count tests green)

1. Extend `TowerId` += `sentinel|cinder`, `BranchId` += 4 branches.
2. Merge `ADDITIONAL_*` into `TOWERS`/`EVOLUTIONS`/`STARTER/ALTERNATIVE_BRANCH`.
3. Add `ART`/`IDS`/`GROUND_INSETS`/`EVOLUTION_ACCENTS` entries + manifest PNGs.
4. Update count-asserting tests (`evolution-config`, `campaign-art-manifest`,
   `campaign-specializations`, `verification-v5-registry-geometry`).
5. Add tray slots 6–7 (`GameScene.ts:381` hotkeys, `towerTrayLayout.ts`).
