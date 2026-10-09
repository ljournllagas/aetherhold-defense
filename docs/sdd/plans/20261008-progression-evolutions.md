---
type: plan
title: Tower evolution and replay progression
description: Builds tower evolution branches, branch-achievement unlocks, the 30-wave siege with victory decision and endless mastery, explicit terminal-result scoring, and its single complete release.
status: done
timestamp: 2026-10-08
---

# Tower evolution and replay progression — Plan

**Spec:** docs/sdd/specs/20261008-progression-evolutions.md
**Task count:** 37
**Adopted from:** docs/superpowers/plans/2026-10-08-progression-evolutions.md. Old Task 1→T1, 2→T2, 3→T3, 4→T4, 5→T5, 6→T7–T11, 7→T6 and T12–T17, 8→T18–T22, 9→T23–T28 (split to the five-file limit; order and interfaces kept; spec wins where it changed: purchase kinds, terminal events, finale seed, field replacement, Pause in victory, chain falloff).
**Workspace rules:** not a Git repository — Commit lines are checkpoint labels; never run git init. Commands in this plan are written without a prefix; implementers may run any of them through the `rtk` wrapper (for example `rtk npm test`), which passes them through unchanged. Paths under tests/ are vitest files (Node environment, Phaser mocked). No task before T28 runs npm run deploy (AC-138 overrides the per-change rule in AGENTS.md).

## Verify block

- build: `npm run build`
- test: `npm test`
- typecheck: `npm run typecheck`
- testOne: `npm test -- {target}`
- migrateLocal: `npm run db:migrate:local` (Manual steps only: T10, T36)
- migrateRemote: `npm run db:migrate:remote` (Manual steps only: T28)
- deploy: `npm run deploy` (Manual steps only: T28)
- dev: `npm run dev -- --host 127.0.0.1` (Manual steps only: T22)
- simulate: `$env:BALANCE_SIM='1'; npm test -- artifacts/progression/balance` (Manual steps and T31/T24 only; PowerShell syntax; Bash equivalent `BALANCE_SIM=1 npm test -- artifacts/progression/balance`)

## Accepted risks

None

## Coverage matrix

| AC | Tasks |
|---|---|
| AC-1 | T5, T6, T14 |
| AC-2 | T6 |
| AC-3 | T18, T19 |
| AC-4 | T5, T14 |
| AC-5 | T6, T24 |
| AC-6 | T5, T12 |
| AC-7 | T2, T18, T19 |
| AC-8 | T1, T2 |
| AC-9 | T2, T14, T18 |
| AC-10 | T2, T14 |
| AC-11 | T14 |
| AC-12 | T2 |
| AC-13 | T2 |
| AC-14 | T18, T19 |
| AC-15 | T18, T19 |
| AC-16 | T2, T12 |
| AC-17 | T2, T12 |
| AC-18 | T12 |
| AC-19 | T2, T12, T14 |
| AC-20 | T4, T12, T15 |
| AC-21 | T4, T18 |
| AC-22 | T2, T18, T19 |
| AC-23 | T1, T4 |
| AC-24 | T2, T12, T13 |
| AC-25 | T2, T12, T30 |
| AC-26 | T12 |
| AC-27 | T3, T12, T13 |
| AC-28 | T3, T13, T20 |
| AC-29 | T1, T2, T30 |
| AC-30 | T1 |
| AC-31 | T1 |
| AC-32 | T1, T6, T24 |
| AC-33 | T1, T3 |
| AC-34 | T1, T3, T13 |
| AC-35 | T1, T3 |
| AC-36 | T1, T3, T13 |
| AC-37 | T1, T3 |
| AC-38 | T1, T3 |
| AC-39 | T1, T3 |
| AC-40 | T1, T3 |
| AC-41 | T1, T13 |
| AC-42 | T1, T3, T13 |
| AC-43 | T1, T2 |
| AC-44 | T3, T13 |
| AC-45 | T3 |
| AC-46 | T3, T13 |
| AC-47 | T3, T14 |
| AC-48 | T3, T13 |
| AC-49 | T3, T13 |
| AC-50 | T3, T12, T13 |
| AC-51 | T3 |
| AC-52 | T3, T13 |
| AC-53 | T3, T13 |
| AC-54 | T3, T13 |
| AC-55 | T3, T13 |
| AC-56 | T3, T13 |
| AC-57 | T3 |
| AC-58 | T3 |
| AC-59 | T3, T13 |
| AC-60 | T3 |
| AC-61 | T3, T13 |
| AC-62 | T2, T18, T19, T32 |
| AC-63 | T20, T22 |
| AC-64 | T20, T22 |
| AC-65 | T19, T21, T22, T32, T33 |
| AC-66 | T2, T18 |
| AC-67 | T2 |
| AC-68 | T2, T18 |
| AC-69 | T2, T18 |
| AC-70 | T2 |
| AC-71 | T12, T14 |
| AC-72 | T4 |
| AC-73 | T4, T15 |
| AC-74 | T4, T15 |
| AC-75 | T15 |
| AC-76 | T4, T15, T17 |
| AC-77 | T4, T15 |
| AC-78 | T4, T15 |
| AC-79 | T15, T16, T22, T34 |
| AC-80 | T18, T19, T21 |
| AC-81 | T4, T11 |
| AC-82 | T4 |
| AC-83 | T4, T21 |
| AC-84 | T4 |
| AC-85 | T4 |
| AC-86 | T4 |
| AC-87 | T4, T15 |
| AC-88 | T4, T15, T21 |
| AC-89 | T4 |
| AC-90 | T11, T16, T21 |
| AC-91 | T5, T14, T16 |
| AC-92 | T5, T14, T16 |
| AC-93 | T5, T14 |
| AC-94 | T5, T14 |
| AC-95 | T5, T14, T15 |
| AC-96 | T5, T14 |
| AC-97 | T14, T15 |
| AC-98 | T14 |
| AC-99 | T5, T15 |
| AC-100 | T14, T15 |
| AC-101 | T14, T15, T22 |
| AC-102 | T5, T14 |
| AC-103 | T14, T22, T34 |
| AC-104 | T15 |
| AC-105 | T5, T14 |
| AC-106 | T14, T16 |
| AC-107 | T5, T16 |
| AC-108 | T5, T14, T16 |
| AC-109 | T14, T15 |
| AC-110 | T9, T10, T11 |
| AC-111 | T7, T9 |
| AC-112 | T7, T9, T14 |
| AC-113 | T9, T14 |
| AC-114 | T9 |
| AC-115 | T9, T10 |
| AC-116 | T7, T9, T10, T29 |
| AC-117 | T8, T9, T29 |
| AC-118 | T10, T28, T36 |
| AC-119 | T7, T9 |
| AC-120 | T14, T16 |
| AC-121 | T22, T33, T34 |
| AC-122 | T22, T33 |
| AC-123 | T25 |
| AC-124 | T2, T3, T4, T5, T18 |
| AC-125 | T27 |
| AC-126 | T23, T24, T31, T35 |
| AC-127 | T24 |
| AC-128 | T23, T24, T31, T35 |
| AC-129 | T23, T24, T31, T35 |
| AC-130 | T24, T31, T35 |
| AC-131 | T24, T31, T35 |
| AC-132 | T23 |
| AC-133 | T24, T31, T35 |
| AC-134 | T24, T26, T31, T35 |
| AC-135 | T23, T24 |
| AC-136 | T2, T24, T31, T35 |
| AC-137 | T27, T37 |
| AC-138 | T28, T37 |
| AC-139 | T16 |
| AC-140 | T5, T14 |
| AC-141 | T14 |
| AC-142 | T7, T9, T29 |
| AC-143 | T10, T11 |

## Shared test helpers used by several tasks

Each task that needs one of these restates it in its own block. `anyStub()` is a chainable stand-in for Phaser display factories:

```ts
function anyStub(): any {
  const proxy: any = new Proxy(function () { return proxy; }, {
    get: (_t, key) => (key === 'then' ? undefined : key === Symbol.toPrimitive ? () => 0 : proxy),
    apply: () => proxy
  });
  return proxy;
}
```

## Tasks

### T1 — Typed evolution roster and effective-stat configuration (old Task 1)   [x] done
Satisfies: AC-8, AC-23, AC-29, AC-30, AC-31, AC-32, AC-33, AC-34, AC-35, AC-36, AC-37, AC-38, AC-39, AC-40, AC-41, AC-42, AC-43
Depends on: none
Router summary: Add the typed data for the ten tower evolution branches, two per tower family, with their stats per rank derived from the level-four tower values and their prices. Also add the shared type contracts later tasks use. Configuration and types only; nothing in the game uses them yet.
Files:
  - create  src/shared/progression.ts       (contract types below)
  - create  src/game/config/evolutions.ts   (EVOLUTIONS, STARTER_BRANCH, ALTERNATIVE_BRANCH, factor arrays, EVOLUTION_RULES)
  - modify  src/game/config/towers.ts       (add TOWER_IDS, isTowerId; keep `TOWERS: Record<string, TowerConfig>` and every value)
  - create  tests/evolution-config.test.ts
Consumes: existing: src/shared/types.ts `TowerLevelStats { damage; range; attackInterval; damageType; splashRadius?; slowFactor?; slowDuration?; chainCount?; cost }`; existing: src/game/systems/CombatSystem.ts `interface TargetCandidate { id; x; y; hp; maxHp; distanceTraveled }`; existing: src/game/config/towers.ts `TOWERS` (levels[3] is the level-4 row: longbow 85/340, ember 200 splash 90 interval 1.15/480, glacier slow 0.6 for 2.8/420, starfire 190/460, tempest chain 7/520).
Produces:
```ts
// src/shared/progression.ts (type-only imports of TowerLevelStats and TargetCandidate)
export type TowerId = 'longbow' | 'ember' | 'glacier' | 'starfire' | 'tempest';
export type BranchId = 'marksman' | 'volley' | 'siegebreaker' | 'flame-mortar' | 'winterguard' | 'brittle-ice' | 'spellbreaker' | 'arcane-beacon' | 'stormcaller' | 'thunderlord';
export type EvolutionRank = 0 | 1 | 2 | 3;
export interface EvolutionState { foundationLevel: number; branchId: BranchId | null; rank: EvolutionRank | null; masteryRank: number; invested: number; revision: number; }
export type RunOutcome = 'victory' | 'defeat' | 'siege-failed';
export interface ResultProgress { highestWave: number; wavesCompleted: number; outcome: RunOutcome; siegeBossesDefeated: number; }
export const SIEGE_BOSS_BIT: Readonly<Record<10 | 20 | 30, number>> = { 10: 1, 20: 2, 30: 4 };
export interface HitCounter { successes: number; }
export interface EffectiveTowerStats extends TowerLevelStats {
  bossDamageMultiplier: number; physicalArmorScale: number; wardArmorScale: number; volleyTargets: number; burningField: boolean;
  vulnerabilityMultiplier: number; vulnerabilityMs: number; auraDamageMultiplier: number; auraRange: number;
  control: 'freeze' | 'stun' | null; controlMs: number; bossControlMs: number;
}
export interface CombatTower { id: number; towerId: TowerId; x: number; y: number; progression: EvolutionState; counter: HitCounter; }
export interface ShotSnapshot { ownerId: number; towerId: TowerId; branchId: BranchId | null; stats: EffectiveTowerStats; rawDamage: number; primary: boolean; counter: HitCounter; }
export interface CombatVictim extends TargetCandidate { alive: boolean; isBoss: boolean; physicalArmor: number; wardArmor: number; }
// src/game/config/evolutions.ts
export interface EvolutionDefinition { id: BranchId; towerId: TowerId; name: string; description: string; starter: boolean; stats: readonly EffectiveTowerStats[]; }
export const DAMAGE_FACTORS: readonly number[];      // [1.20, 1.55, 2.00, 2.60]
export const INTERVAL_FACTORS: readonly number[];    // [1.00, 0.97, 0.94, 0.90]
export const RANGE_FACTORS: readonly number[];       // [1.00, 1.03, 1.06, 1.10]
export const EVOLUTION_COST_FACTORS: readonly number[]; // [1.50, 2.00, 2.75, 3.75]
export const EVOLUTION_RULES: { fieldMs: 3000; tickMs: 500; fieldFraction: 0.3; controlCadence: 5; controlImmunityMs: 1500; masteryGain: 0.05; masteryCostGrowth: 1.25 }; // typed as numbers
export const EVOLUTIONS: Readonly<Record<BranchId, EvolutionDefinition>>;
export const STARTER_BRANCH: Readonly<Record<TowerId, BranchId>>;
export const ALTERNATIVE_BRANCH: Readonly<Record<TowerId, BranchId>>;
// src/game/config/towers.ts
export const TOWER_IDS: readonly TowerId[]; // ['longbow','ember','glacier','starfire','tempest']
export function isTowerId(value: string): value is TowerId;
```
Reuse: TOWERS level-4 rows in src/game/config/towers.ts; Math.round/Math.ceil. No dependency added.
Tests (complete): tests/evolution-config.test.ts
```ts
import { describe, expect, it } from 'vitest';
import { ALTERNATIVE_BRANCH, DAMAGE_FACTORS, EVOLUTION_COST_FACTORS, EVOLUTION_RULES, EVOLUTIONS, INTERVAL_FACTORS, RANGE_FACTORS, STARTER_BRANCH } from '../src/game/config/evolutions.ts';
import { TOWERS, TOWER_IDS, isTowerId } from '../src/game/config/towers.ts';
import type { BranchId, EffectiveTowerStats } from '../src/shared/progression.ts';

const ids = Object.keys(EVOLUTIONS) as BranchId[];
const all = <K extends keyof EffectiveTowerStats>(b: BranchId, k: K) => EVOLUTIONS[b].stats.map((s) => s[k]);
function expectDerived(b: BranchId, damage: number, interval: number): void {
  const ref = TOWERS[EVOLUTIONS[b].towerId].levels[3];
  EVOLUTIONS[b].stats.forEach((s, r) => {
    expect(s.damage).toBe(Math.round(ref.damage * DAMAGE_FACTORS[r] * damage));
    expect(s.attackInterval).toBeCloseTo(ref.attackInterval * INTERVAL_FACTORS[r] * interval);
    expect(s.range).toBeCloseTo(ref.range * RANGE_FACTORS[r]);
    expect(s.damageType).toBe(ref.damageType);
  });
}

describe('evolution roster', () => {
  it('has one starter and one alternative per archetype with four integer-priced ranks', () => {
    expect(ids).toHaveLength(10);
    expect([...TOWER_IDS].sort()).toEqual(Object.keys(TOWERS).sort());
    for (const id of TOWER_IDS) {
      expect(EVOLUTIONS[STARTER_BRANCH[id]].starter).toBe(true);
      expect(EVOLUTIONS[ALTERNATIVE_BRANCH[id]].starter).toBe(false);
      for (const b of [STARTER_BRANCH[id], ALTERNATIVE_BRANCH[id]]) {
        expect(EVOLUTIONS[b]).toMatchObject({ id: b, towerId: id });
        expect(EVOLUTIONS[b].description.length).toBeGreaterThan(0);
        expect(EVOLUTIONS[b].stats).toHaveLength(4);
        for (const s of EVOLUTIONS[b].stats) {
          expect(Number.isSafeInteger(s.cost) && s.cost > 0).toBe(true);
          expect(Number.isSafeInteger(s.damage)).toBe(true);
          expect(s.attackInterval).toBeGreaterThan(0);
        }
      }
    }
  });
  it('names the approved branches and starters', () => {
    expect(STARTER_BRANCH).toEqual({ longbow: 'marksman', ember: 'siegebreaker', glacier: 'winterguard', starfire: 'spellbreaker', tempest: 'stormcaller' });
    expect(ALTERNATIVE_BRANCH).toEqual({ longbow: 'volley', ember: 'flame-mortar', glacier: 'brittle-ice', starfire: 'arcane-beacon', tempest: 'thunderlord' });
    expect(ids.map((b) => EVOLUTIONS[b].name).sort()).toEqual(['Arcane Beacon', 'Brittle Ice', 'Flame Mortar', 'Marksman', 'Siegebreaker', 'Spellbreaker', 'Stormcaller', 'Thunderlord', 'Volley', 'Winterguard']);
  });
  it('narrows tower ids', () => { expect(isTowerId('longbow')).toBe(true); expect(isTowerId('laser')).toBe(false); });
});

describe('rank progression and prices', () => {
  it('uses the common seed factors and rules', () => {
    expect(DAMAGE_FACTORS).toEqual([1.2, 1.55, 2, 2.6]);
    expect(INTERVAL_FACTORS).toEqual([1, 0.97, 0.94, 0.9]);
    expect(RANGE_FACTORS).toEqual([1, 1.03, 1.06, 1.1]);
    expect(EVOLUTION_COST_FACTORS).toEqual([1.5, 2, 2.75, 3.75]);
    expect(EVOLUTION_RULES).toEqual({ fieldMs: 3000, tickMs: 500, fieldFraction: 0.3, controlCadence: 5, controlImmunityMs: 1500, masteryGain: 0.05, masteryCostGrowth: 1.25 });
  });
  it.each([...TOWER_IDS])('prices both %s branches identically from the level-4 cost', (id) => {
    const expected = EVOLUTION_COST_FACTORS.map((f) => Math.ceil(TOWERS[id].levels[3].cost * f));
    expect(all(STARTER_BRANCH[id], 'cost')).toEqual(expected);
    expect(all(ALTERNATIVE_BRANCH[id], 'cost')).toEqual(expected);
  });
  it('prices Ranger at 510, 680, 935, 1275', () => expect(all('marksman', 'cost')).toEqual([510, 680, 935, 1275]));
});

describe('branch modifiers (seed values)', () => {
  it('Marksman', () => { expectDerived('marksman', 1.35, 1.25); expect(all('marksman', 'bossDamageMultiplier')).toEqual([1.5, 1.5, 1.5, 1.5]); expect(all('marksman', 'volleyTargets')).toEqual([1, 1, 1, 1]); });
  it('Volley', () => { expectDerived('volley', 0.55, 1); expect(all('volley', 'volleyTargets')).toEqual([3, 3, 3, 3]); expect(all('volley', 'bossDamageMultiplier')).toEqual([1, 1, 1, 1]); });
  it('Siegebreaker', () => { expectDerived('siegebreaker', 1, 1); expect(all('siegebreaker', 'physicalArmorScale')).toEqual([0.5, 0.5, 0.5, 0.5]); expect(all('siegebreaker', 'wardArmorScale')).toEqual([1, 1, 1, 1]); expect(all('siegebreaker', 'splashRadius')).toEqual([90, 90, 90, 90]); expect(all('siegebreaker', 'burningField')).toEqual([false, false, false, false]); });
  it('Flame Mortar', () => { expectDerived('flame-mortar', 0.75, 1); expect(all('flame-mortar', 'burningField')).toEqual([true, true, true, true]); expect(all('flame-mortar', 'splashRadius')).toEqual([90, 90, 90, 90]); });
  it('Winterguard', () => { expectDerived('winterguard', 1, 1); expect(all('winterguard', 'control')).toEqual(['freeze', 'freeze', 'freeze', 'freeze']); expect(all('winterguard', 'controlMs')).toEqual([500, 500, 500, 500]); expect(all('winterguard', 'bossControlMs')).toEqual([150, 150, 150, 150]); expect(all('winterguard', 'slowFactor')).toEqual([0.6, 0.6, 0.6, 0.6]); expect(all('winterguard', 'slowDuration')).toEqual([2.8, 2.8, 2.8, 2.8]); });
  it('Brittle Ice', () => { expectDerived('brittle-ice', 1, 1); expect(all('brittle-ice', 'slowFactor')).toEqual([0.3, 0.3, 0.3, 0.3]); expect(all('brittle-ice', 'slowDuration')).toEqual([2, 2, 2, 2]); expect(all('brittle-ice', 'vulnerabilityMultiplier')).toEqual([1.15, 1.2, 1.25, 1.3]); expect(all('brittle-ice', 'vulnerabilityMs')).toEqual([3000, 3000, 3000, 3000]); expect(all('brittle-ice', 'control')).toEqual([null, null, null, null]); });
  it('Spellbreaker', () => { expectDerived('spellbreaker', 1, 1); expect(all('spellbreaker', 'wardArmorScale')).toEqual([0.5, 0.5, 0.5, 0.5]); expect(all('spellbreaker', 'physicalArmorScale')).toEqual([1, 1, 1, 1]); });
  it('Arcane Beacon', () => { expectDerived('arcane-beacon', 0.6, 1); expect(all('arcane-beacon', 'auraDamageMultiplier')).toEqual([1.15, 1.2, 1.25, 1.3]); expect(all('arcane-beacon', 'auraRange')).toEqual([160, 160, 160, 160]); });
  it('Stormcaller', () => { expectDerived('stormcaller', 1, 1); expect(all('stormcaller', 'chainCount')).toEqual([2, 3, 4, 5].map((n) => TOWERS.tempest.levels[3].chainCount! + n)); expect(all('stormcaller', 'chainCount')).toEqual([9, 10, 11, 12]); });
  it('Thunderlord', () => { expectDerived('thunderlord', 1.6, 1); expect(all('thunderlord', 'chainCount')).toEqual([3, 3, 3, 3]); expect(all('thunderlord', 'control')).toEqual(['stun', 'stun', 'stun', 'stun']); expect(all('thunderlord', 'controlMs')).toEqual([350, 350, 350, 350]); expect(all('thunderlord', 'bossControlMs')).toEqual([100, 100, 100, 100]); });
  it('keeps neutral defaults where a branch does not override', () => {
    expect(EVOLUTIONS.marksman.stats[0]).toMatchObject({ physicalArmorScale: 1, wardArmorScale: 1, burningField: false, vulnerabilityMultiplier: 1, vulnerabilityMs: 0, auraDamageMultiplier: 1, auraRange: 0, control: null, controlMs: 0, bossControlMs: 0 });
  });
});
```
Recipe:
1. Create src/shared/progression.ts with exactly the Produces block (type-only imports).
2. In towers.ts add `import type { TowerId } from '../../shared/progression.ts'`, TOWER_IDS in TOWERS key order and isTowerId via `(TOWER_IDS as readonly string[]).includes(value)`. Change nothing else.
3. In evolutions.ts export the factor arrays and EVOLUTION_RULES, and build every row with this factory (non-obvious; use exactly this multiplication order):
```ts
function branchStats(towerId: TowerId, damage: number, interval: number, modifiers: (rank: number) => Partial<EffectiveTowerStats>): EffectiveTowerStats[] {
  const f = TOWERS[towerId].levels[3];
  return DAMAGE_FACTORS.map((factor, rank) => ({
    ...f, damage: Math.round(f.damage * factor * damage), attackInterval: f.attackInterval * INTERVAL_FACTORS[rank] * interval,
    range: f.range * RANGE_FACTORS[rank], cost: Math.ceil(f.cost * EVOLUTION_COST_FACTORS[rank]),
    bossDamageMultiplier: 1, physicalArmorScale: 1, wardArmorScale: 1, volleyTargets: 1, burningField: false, vulnerabilityMultiplier: 1,
    vulnerabilityMs: 0, auraDamageMultiplier: 1, auraRange: 0, control: null, controlMs: 0, bossControlMs: 0, ...modifiers(rank)
  }));
}
```
4. Ten rows (name / description / damage / interval / modifiers): Marksman 'Heavy single arrows; +50% damage to bosses.' 1.35/1.25 {bossDamageMultiplier 1.5}; Volley 'Each attack looses up to three arrows at different foes.' 0.55/1 {volleyTargets 3}; Siegebreaker 'Splash shells that treat physical armor as half.' 1/1 {physicalArmorScale 0.5}; Flame Mortar 'Lighter shells that leave a burning field for 3 s.' 0.75/1 {burningField true}; Winterguard 'Strong slow; every fifth hit freezes the target.' 1/1 {control 'freeze', controlMs 500, bossControlMs 150}; Brittle Ice 'Weaker slow that makes targets take more damage.' 1/1 {slowFactor 0.3, slowDuration 2, vulnerabilityMultiplier [1.15,1.2,1.25,1.3][rank], vulnerabilityMs 3000}; Spellbreaker 'Arcane bolts that treat ward armor as half.' 1/1 {wardArmorScale 0.5}; Arcane Beacon 'Weaker bolts; nearby towers deal more damage.' 0.6/1 {auraDamageMultiplier [1.15,1.2,1.25,1.3][rank], auraRange 160}; Stormcaller 'Chain lightning that reaches more foes.' 1/1 {chainCount base+[2,3,4,5][rank]}; Thunderlord 'Heavy short chains; every fifth hit stuns the target.' 1.6/1 {chainCount 3, control 'stun', controlMs 350, bossControlMs 100}. Throw at module load if TOWERS.tempest.levels[3].chainCount is undefined.
Red:    `npm test -- tests/evolution-config.test.ts` → fails: cannot resolve src/game/config/evolutions.ts
Green:  `npm test -- tests/evolution-config.test.ts` → all tests pass
Verify: `npm run typecheck` → no errors; `npm test` → every file passes
Commit: Add typed evolution roster and effective-stat configuration

### T2 — Atomic purchases, recorded investment and mastery (old Task 2)   [x] done
Satisfies: AC-7, AC-8, AC-9, AC-10, AC-12, AC-13, AC-16, AC-17, AC-19, AC-22, AC-24, AC-25, AC-29, AC-43, AC-62, AC-66, AC-67, AC-68, AC-69, AC-70, AC-124, AC-136
Depends on: T1
Lenses: contract
Router summary: Add one pure purchase function covering the four purchase kinds (foundation upgrade, first evolution onto a branch, next evolution rank, endless mastery) that rechecks every rule, spends gold once and records the actual gold invested, so selling refunds seventy percent of real spend. Towers start reading their level and stats from this progression record.
Files:
  - create  src/game/systems/EvolutionSystem.ts
  - modify  src/game/entities/Tower.ts       (towerId: TowerId; progression; counter; level getter + temporary setter; stats)
  - create  tests/helpers/evolutionFixtures.ts (creates tests/helpers/)
  - create  tests/evolution-system.test.ts
Consumes: T1 TowerId, BranchId, EvolutionRank, EvolutionState, EffectiveTowerStats, HitCounter, CombatTower, CombatVictim, EVOLUTIONS, EVOLUTION_RULES, isTowerId; existing: src/game/config/towers.ts `TOWERS`, `towerTotalInvested(towerId: string, level: number): number`; existing: src/game/config/economy.ts `ECONOMY.sellRefundRate` (0.7).
Produces:
```ts
export type PurchaseIntent = { kind: 'foundation-upgrade' } | { kind: 'evolve'; branchId: BranchId } | { kind: 'evolution-rank' } | { kind: 'mastery' };
export type PurchaseReason = 'reach level 4' | 'defeat wave-10 boss' | 'complete branch achievement' | 'insufficient gold' | 'finish evolution' | 'continue into endless' | 'paused/ended' | 'numeric limit reached' | 'stale action' | 'not available';
export const PURCHASE_REASON_TEXT: Readonly<Record<PurchaseReason, string>>; // 'Reach level 4','Defeat the wave-10 boss','Complete the branch achievement','Not enough gold','Finish evolution first','Continue into endless for mastery','Unavailable while paused or ended','Numeric limit reached','Tower changed; try again','Not available for this tower'
export interface PurchaseContext { gold: number; evolutionOpen: boolean; endless: boolean; blocked: boolean; unlocked: ReadonlySet<BranchId>; } // unlocked = run snapshot of alternatives; starters always available
export type PurchaseResult = { ok: false; reason: PurchaseReason } | { ok: true; state: EvolutionState; gold: number; stats: EffectiveTowerStats; cost: number };
export function initialEvolution(id: TowerId): EvolutionState; // {foundationLevel 1, branchId null, rank null, masteryRank 0, invested levels[0].cost, revision 0}
export function effectiveStats(id: TowerId, state: EvolutionState): EffectiveTowerStats; // fresh copy each call
export function nextPurchaseCost(id: TowerId, state: EvolutionState, intent: PurchaseIntent): number | null; // null = not applicable or not a safe positive integer
export function purchaseEvolution(id: TowerId, state: EvolutionState, intent: PurchaseIntent, context: PurchaseContext, expectedRevision: number): PurchaseResult; // never mutates inputs
export function investedRefund(state: EvolutionState): number; // Math.floor(invested * ECONOMY.sellRefundRate)
// Tower: towerId: TowerId; progression: EvolutionState; counter: HitCounter = { successes: 0 };
// constructor(towerId: string, x, y, plotIndex) throws Error for unknown ids; get level(): number (= foundationLevel);
// set level(next) — temporary until T12: only unevolved, integer 1–4; sets foundationLevel, invested = towerTotalInvested, revision + 1;
// get stats(): EffectiveTowerStats; maxLevel and upgradeCost keep foundation semantics.
// tests/helpers/evolutionFixtures.ts: tower(branch = 'marksman', rank = 0, id = 1): CombatTower; victim(id = 1, x = 0, y = 0): CombatVictim
```
Reuse: towerTotalInvested and TOWERS (towers.ts); ECONOMY.sellRefundRate (economy.ts); EVOLUTIONS (T1); structuredClone and Number.isSafeInteger.
Tests (complete): tests/helpers/evolutionFixtures.ts
```ts
import { EVOLUTIONS } from '../../src/game/config/evolutions.ts';
import { towerTotalInvested } from '../../src/game/config/towers.ts';
import type { BranchId, CombatTower, CombatVictim, EvolutionRank } from '../../src/shared/progression.ts';

export function tower(branch: BranchId | null = 'marksman', rank: EvolutionRank = 0, id = 1): CombatTower {
  const towerId = branch ? EVOLUTIONS[branch].towerId : 'longbow';
  const invested = towerTotalInvested(towerId, 4) + (branch ? EVOLUTIONS[branch].stats.slice(0, rank + 1).reduce((sum, s) => sum + s.cost, 0) : 0);
  return { id, towerId, x: 0, y: 0, counter: { successes: 0 }, progression: { foundationLevel: 4, branchId: branch, rank: branch ? rank : null, masteryRank: 0, invested, revision: 0 } };
}
export function victim(id = 1, x = 0, y = 0): CombatVictim {
  return { id, x, y, hp: 100000, maxHp: 100000, distanceTraveled: id, alive: true, isBoss: false, physicalArmor: 0, wardArmor: 0 };
}
```
tests/evolution-system.test.ts
```ts
import { describe, expect, it } from 'vitest';
import { EVOLUTIONS } from '../src/game/config/evolutions.ts';
import { TOWERS, towerTotalInvested } from '../src/game/config/towers.ts';
import { Tower } from '../src/game/entities/Tower.ts';
import { PURCHASE_REASON_TEXT, effectiveStats, initialEvolution, investedRefund, nextPurchaseCost, purchaseEvolution, type PurchaseContext, type PurchaseIntent, type PurchaseReason } from '../src/game/systems/EvolutionSystem.ts';
import type { BranchId } from '../src/shared/progression.ts';
import { tower } from './helpers/evolutionFixtures.ts';

const context: PurchaseContext = { gold: 100000, evolutionOpen: true, endless: false, blocked: false, unlocked: new Set(Object.keys(EVOLUTIONS) as BranchId[]) };

describe('atomic purchases', () => {
  it('commits an evolution once and rejects the repeated stale action', () => {
    const state = { ...initialEvolution('longbow'), foundationLevel: 4, invested: 710 };
    const ctx: PurchaseContext = { gold: 2000, evolutionOpen: true, endless: false, blocked: false, unlocked: new Set<BranchId>() };
    const first = purchaseEvolution('longbow', state, { kind: 'evolve', branchId: 'marksman' }, ctx, 0);
    if (!first.ok) throw new Error(first.reason);
    expect([first.cost, first.state.invested, first.gold, investedRefund(first.state)]).toEqual([510, 1220, 1490, 854]);
    expect(first.state).toMatchObject({ branchId: 'marksman', rank: 0, revision: 1 });
    expect(state.branchId).toBe(null);
    expect(purchaseEvolution('longbow', first.state, { kind: 'evolve', branchId: 'marksman' }, { ...ctx, gold: first.gold }, 0)).toEqual({ ok: false, reason: 'stale action' });
  });
  it('raises foundation levels with the configured costs', () => {
    let state = initialEvolution('longbow');
    expect(state).toEqual({ foundationLevel: 1, branchId: null, rank: null, masteryRank: 0, invested: 100, revision: 0 });
    for (const level of [2, 3, 4]) {
      const r = purchaseEvolution('longbow', state, { kind: 'foundation-upgrade' }, context, state.revision);
      if (!r.ok) throw new Error(r.reason);
      expect([r.cost, r.state.foundationLevel, r.state.invested]).toEqual([TOWERS.longbow.levels[level - 1].cost, level, towerTotalInvested('longbow', level)]);
      state = r.state;
    }
    expect(purchaseEvolution('longbow', state, { kind: 'foundation-upgrade' }, context, state.revision)).toEqual({ ok: false, reason: 'not available' });
  });
  it.each(Object.keys(EVOLUTIONS) as BranchId[])('purchases every rank of %s, then mastery only in endless', (branch) => {
    const id = EVOLUTIONS[branch].towerId;
    let state = { ...initialEvolution(id), foundationLevel: 4, invested: towerTotalInvested(id, 4) };
    let gold = context.gold;
    for (let rank = 0; rank <= 3; rank++) {
      const intent: PurchaseIntent = rank === 0 ? { kind: 'evolve', branchId: branch } : { kind: 'evolution-rank' };
      const before = structuredClone(state);
      const r = purchaseEvolution(id, state, intent, { ...context, gold }, state.revision);
      if (!r.ok) throw new Error(r.reason);
      expect(state).toEqual(before);
      expect([r.state.rank, r.cost, r.state.invested, r.gold]).toEqual([rank, EVOLUTIONS[branch].stats[rank].cost, state.invested + r.cost, gold - r.cost]);
      state = r.state; gold = r.gold;
    }
    expect(purchaseEvolution(id, state, { kind: 'evolution-rank' }, { ...context, gold }, state.revision)).toEqual({ ok: false, reason: 'not available' });
    expect(purchaseEvolution(id, state, { kind: 'mastery' }, { ...context, gold }, state.revision)).toEqual({ ok: false, reason: 'continue into endless' });
    const m = purchaseEvolution(id, state, { kind: 'mastery' }, { ...context, gold, endless: true }, state.revision);
    if (!m.ok) throw new Error(m.reason);
    expect(m.state.masteryRank).toBe(1);
    expect(m.cost).toBe(Math.ceil(EVOLUTIONS[branch].stats[3].cost * 1.25));
    expect(m.stats.damage).toBe(Math.round(EVOLUTIONS[branch].stats[3].damage * 1.05));
    expect(investedRefund(m.state)).toBe(Math.floor(m.state.invested * 0.7));
  });
  it.each([
    { patch: { gold: 0 }, intent: { kind: 'evolve', branchId: 'marksman' }, reason: 'insufficient gold' },
    { patch: { evolutionOpen: false }, intent: { kind: 'evolve', branchId: 'marksman' }, reason: 'defeat wave-10 boss' },
    { patch: { blocked: true }, intent: { kind: 'evolve', branchId: 'marksman' }, reason: 'paused/ended' },
    { patch: { unlocked: new Set<BranchId>() }, intent: { kind: 'evolve', branchId: 'volley' }, reason: 'complete branch achievement' },
    { patch: {}, intent: { kind: 'evolve', branchId: 'spellbreaker' }, reason: 'not available' },
    { patch: { endless: true }, intent: { kind: 'mastery' }, reason: 'finish evolution' }
  ] as Array<{ patch: Partial<PurchaseContext>; intent: PurchaseIntent; reason: PurchaseReason }>)('rejects "$reason" without spending', ({ patch, intent, reason }) => {
    const state = tower(null).progression, before = structuredClone(state);
    expect(purchaseEvolution('longbow', state, intent, { ...context, ...patch }, 0)).toEqual({ ok: false, reason });
    expect(state).toEqual(before);
  });
  it('requires level 4, the evolution and rank 3 in order and never changes branch', () => {
    const level3 = { ...initialEvolution('longbow'), foundationLevel: 3, invested: 370 };
    expect(purchaseEvolution('longbow', level3, { kind: 'evolve', branchId: 'marksman' }, context, 0)).toEqual({ ok: false, reason: 'reach level 4' });
    expect(purchaseEvolution('longbow', level3, { kind: 'evolution-rank' }, context, 0)).toEqual({ ok: false, reason: 'reach level 4' });
    expect(purchaseEvolution('longbow', tower(null).progression, { kind: 'evolution-rank' }, context, 0)).toEqual({ ok: false, reason: 'not available' });
    expect(purchaseEvolution('longbow', tower('marksman', 1).progression, { kind: 'mastery' }, { ...context, endless: true }, 0)).toEqual({ ok: false, reason: 'finish evolution' });
    expect(purchaseEvolution('longbow', tower('marksman', 0).progression, { kind: 'evolve', branchId: 'volley' }, context, 0)).toEqual({ ok: false, reason: 'not available' });
    const next = purchaseEvolution('longbow', tower('marksman', 0).progression, { kind: 'evolution-rank' }, context, 0);
    expect(next.ok && next.state.rank).toBe(1);
  });
  it('rejects unsafe mastery without spending and prices mastery geometrically', () => {
    const huge = { ...tower('marksman', 3).progression, masteryRank: 100000 }, before = structuredClone(huge);
    expect(nextPurchaseCost('longbow', huge, { kind: 'mastery' })).toBe(null);
    expect(purchaseEvolution('longbow', huge, { kind: 'mastery' }, { ...context, endless: true }, 0)).toEqual({ ok: false, reason: 'numeric limit reached' });
    expect(huge).toEqual(before);
    const r3 = tower('marksman', 3).progression;
    expect(nextPurchaseCost('longbow', r3, { kind: 'mastery' })).toBe(Math.ceil(1275 * 1.25));
    expect(nextPurchaseCost('longbow', { ...r3, masteryRank: 1 }, { kind: 'mastery' })).toBe(Math.ceil(1275 * 1.25 ** 2));
    expect(effectiveStats('longbow', { ...r3, masteryRank: 2 }).damage).toBe(Math.round(EVOLUTIONS.marksman.stats[3].damage * 1.1));
    expect(effectiveStats('longbow', { ...r3, masteryRank: 2 }).range).toBe(EVOLUTIONS.marksman.stats[3].range);
  });
  it('keeps cooldown, targeting and position across purchases', () => {
    const owner = new Tower('longbow', 12, 24, 0);
    owner.progression = tower(null).progression; owner.cooldown = 0.75; owner.targeting = 'strongest';
    const r = purchaseEvolution('longbow', owner.progression, { kind: 'evolve', branchId: 'marksman' }, context, 0);
    if (!r.ok) throw new Error(r.reason);
    owner.progression = r.state;
    expect([owner.x, owner.y, owner.cooldown, owner.targeting]).toEqual([12, 24, 0.75, 'strongest']);
  });
  it('refunds recorded spend even after prices are retuned', () => {
    const r = purchaseEvolution('longbow', { ...initialEvolution('longbow'), foundationLevel: 4, invested: 710 }, { kind: 'evolve', branchId: 'marksman' }, context, 0);
    if (!r.ok) throw new Error(r.reason);
    const row = EVOLUTIONS.marksman.stats[0] as { cost: number }, original = row.cost;
    try { row.cost = 9999; expect(investedRefund(r.state)).toBe(854); } finally { row.cost = original; }
  });
  it('changes nothing when a quoted purchase is not committed', () => {
    const state = tower(null).progression, before = structuredClone(state), gold = 600;
    expect(purchaseEvolution('longbow', state, { kind: 'evolve', branchId: 'marksman' }, { ...context, gold }, 0).ok).toBe(true);
    expect(state).toEqual(before); expect(gold).toBe(600);
  });
  it('derives foundation stats without compounding', () => {
    const state = { ...initialEvolution('ember'), foundationLevel: 2, invested: 280 };
    expect(effectiveStats('ember', state)).toEqual({ ...TOWERS.ember.levels[1], bossDamageMultiplier: 1, physicalArmorScale: 1, wardArmorScale: 1, volleyTargets: 1, burningField: false, vulnerabilityMultiplier: 1, vulnerabilityMs: 0, auraDamageMultiplier: 1, auraRange: 0, control: null, controlMs: 0, bossControlMs: 0 });
    expect(effectiveStats('ember', state)).not.toBe(effectiveStats('ember', state));
  });
  it('lets a Tower read level and stats from its progression', () => {
    const t = new Tower('longbow', 0, 0, 0);
    expect([t.level, t.stats.damage, t.counter.successes]).toEqual([1, 12, 0]);
    t.level = 3;
    expect(t.progression).toMatchObject({ foundationLevel: 3, invested: towerTotalInvested('longbow', 3), revision: 1 });
    expect(() => new Tower('laser', 0, 0, 0)).toThrow();
  });
  it('labels every reason', () => { expect(Object.keys(PURCHASE_REASON_TEXT)).toHaveLength(10); expect(PURCHASE_REASON_TEXT['defeat wave-10 boss']).toBe('Defeat the wave-10 boss'); });
});
```
Recipe:
1. effectiveStats: unevolved → copy of TOWERS[id].levels[foundationLevel-1] plus the neutral fields from T1's factory; evolved → copy of EVOLUTIONS[branch].stats[rank]; when masteryRank > 0 set damage = Math.round(stats[3].damage * (1 + EVOLUTION_RULES.masteryGain * masteryRank)).
2. purchaseEvolution check order: (a) malformed state (level not integer 1–4; branch null iff rank null; evolved requires level 4; mastery > 0 only at rank 3; invested/revision/gold not safe non-negative integers; branch of another archetype) → 'not available'; (b) context.blocked → 'paused/ended'; (c) expectedRevision !== state.revision → 'stale action'; (d) per intent: foundation-upgrade (evolved or level 4 → 'not available'; cost levels[L].cost; candidate L+1); evolve (level < 4 → 'reach level 4'; already evolved or EVOLUTIONS[b].towerId !== id → 'not available'; alternative not in unlocked → 'complete branch achievement'; !evolutionOpen → 'defeat wave-10 boss'; cost stats[0]; candidate {branchId b, rank 0}); evolution-rank (unevolved → level < 4 ? 'reach level 4' : 'not available'; rank 3 → 'not available'; cost stats[r+1]); mastery (unevolved → level < 4 ? 'reach level 4' : 'finish evolution'; rank < 3 → 'finish evolution'; !endless → 'continue into endless'; cost via nextPurchaseCost; null or next damage / invested+cost not safe → 'numeric limit reached'); (e) gold < cost → 'insufficient gold'.
3. Success kernel: `return { ok: true, cost, gold: context.gold - cost, state: { ...candidate, invested: state.invested + cost, revision: state.revision + 1 }, stats: effectiveStats(id, candidate) };`
4. nextPurchaseCost mastery: `Math.ceil(stats[3].cost * EVOLUTION_RULES.masteryCostGrowth ** (m + 1))`, null unless safe integer > 0.
5. Tower.ts: replace `level = 1` field with progression/counter plus the getter and temporary setter described in Produces; stats delegates to effectiveStats.
Red:    `npm test -- tests/evolution-system.test.ts` → fails: cannot resolve src/game/systems/EvolutionSystem.ts
Green:  `npm test -- tests/evolution-system.test.ts` → all tests pass
Verify: `npm run typecheck` → no errors; `npm test` → every file passes (game.test.ts tower/economy assertions unchanged)
Commit: Add atomic evolution purchases with recorded investment

### T3 — Evolution combat engine: snapshots, armor, statuses, fields, Volley and chains (old Task 3)   [x] done
Satisfies: AC-27, AC-28, AC-33, AC-34, AC-35, AC-36, AC-37, AC-38, AC-39, AC-40, AC-42, AC-44, AC-45, AC-46, AC-47, AC-48, AC-49, AC-50, AC-51, AC-52, AC-53, AC-54, AC-55, AC-56, AC-57, AC-58, AC-59, AC-60, AC-61, AC-124
Depends on: T1, T2
Lenses: performance
Router summary: Add a pure combat engine that freezes each shot's damage and branch at firing, applies armor penetration, boss bonus and vulnerability once, tracks slows, freezes and stuns on game time with shared immunity, applies the strongest nearby Beacon bonus, picks distinct Volley and chain targets, and runs one burning field per tower whose replacement keeps already-due ticks.
Files:
  - create  src/game/systems/EvolutionCombat.ts
  - create  tests/evolution-combat.test.ts
Consumes: T1 ShotSnapshot, CombatTower, CombatVictim, EffectiveTowerStats, EVOLUTION_RULES; T2 effectiveStats(id, state); existing: src/game/systems/CombatSystem.ts `applyArmor(raw, type, physicalArmor, wardArmor): number` (rounds, minimum 1); existing: src/shared/types.ts `DamageType`, `TargetingMode`; T2 tests/helpers/evolutionFixtures.ts tower(), victim().
Produces:
```ts
export interface StatusView { slowFactor: number; frozen: boolean; stunned: boolean; vulnerability: number; }
export interface FieldTick { ownerId: number; x: number; y: number; radius: number; rawDamage: number; atMs: number; }
export class EvolutionCombat {
  makeShot(owner: CombatTower, towers: readonly CombatTower[], damageMultiplier: number, primary?: boolean): ShotSnapshot;
  damage(raw: number, type: DamageType, target: CombatVictim, nowMs: number, shot?: ShotSnapshot): number; // 0 for dead targets
  primaryHit(shot: ShotSnapshot, target: CombatVictim, nowMs: number, killed?: boolean): void;
  statuses(enemyId: number, nowMs: number): StatusView;
  addField(shot: ShotSnapshot, x: number, y: number, nowMs: number): void;
  tickFields(nowMs: number): FieldTick[];
  get activeFieldCount(): number;              // live fields + 1 while replaced-field ticks await emission
  get activeFields(): ReadonlyArray<{ ownerId: number; x: number; y: number; radius: number }>;
  removeOwner(ownerId: number): void; removeEnemy(enemyId: number): void; clear(): void;
}
export function volleyTargets(candidates: readonly CombatVictim[], tower: CombatTower, stats: EffectiveTowerStats, mode: TargetingMode): CombatVictim[];
export function nextChainTarget(candidates: readonly CombatVictim[], point: { x: number; y: number }, visited: ReadonlySet<number>): CombatVictim | null;
export function chainShot(previous: ShotSnapshot): ShotSnapshot; // { ...previous, rawDamage: previous.rawDamage * 0.85, primary: false }
```
Reuse: applyArmor (CombatSystem.ts); effectiveStats (T2); Map/Set.
Tests (complete): tests/evolution-combat.test.ts
```ts
import { describe, expect, it } from 'vitest';
import { EvolutionCombat, chainShot, nextChainTarget, volleyTargets } from '../src/game/systems/EvolutionCombat.ts';
import { effectiveStats, initialEvolution } from '../src/game/systems/EvolutionSystem.ts';
import type { CombatTower } from '../src/shared/progression.ts';
import { tower, victim } from './helpers/evolutionFixtures.ts';

const neutral = { slowFactor: 0, frozen: false, stunned: false, vulnerability: 1 };

describe('snapshots and Beacon auras', () => {
  it('snapshots damage, branch and aura at firing', () => {
    const ranger: CombatTower = { id: 1, towerId: 'longbow', x: 0, y: 0, counter: { successes: 0 }, progression: { ...initialEvolution('longbow'), foundationLevel: 4, branchId: 'marksman', rank: 0 } };
    const beacon: CombatTower = { id: 2, towerId: 'starfire', x: 10, y: 0, counter: { successes: 0 }, progression: { ...initialEvolution('starfire'), foundationLevel: 4, branchId: 'arcane-beacon', rank: 3 } };
    const engine = new EvolutionCombat(), shot = engine.makeShot(ranger, [ranger, beacon], 1.5);
    expect(shot.rawDamage).toBe(Math.round(effectiveStats('longbow', ranger.progression).damage * 1.3 * 1.5));
    expect(shot).toMatchObject({ ownerId: 1, towerId: 'longbow', branchId: 'marksman', primary: true });
    expect(shot.counter).toBe(ranger.counter);
    const before = structuredClone(shot);
    ranger.progression = { ...ranger.progression, rank: 3 }; engine.removeOwner(1);
    expect(shot).toEqual(before);
  });
  it('uses only the largest in-range Beacon of other towers, never recursively', () => {
    const engine = new EvolutionCombat(), owner = tower(null, 0, 1);
    const strong = { ...tower('arcane-beacon', 3, 2), x: 10 }, weak = { ...tower('arcane-beacon', 0, 3), x: 20 };
    const base = effectiveStats('longbow', owner.progression).damage;
    expect(engine.makeShot(owner, [owner, strong, weak], 1).rawDamage).toBe(Math.round(base * 1.3));
    expect(engine.makeShot(owner, [owner, { ...strong, x: 161 }, weak], 1).rawDamage).toBe(Math.round(base * 1.15));
    expect(engine.makeShot(owner, [owner, { ...strong, x: 161 }, { ...weak, x: 161 }], 1).rawDamage).toBe(base);
    const own = effectiveStats('starfire', strong.progression).damage;
    expect(engine.makeShot(strong, [strong], 1).rawDamage).toBe(own);
    expect(engine.makeShot(strong, [strong, weak], 1).rawDamage).toBe(Math.round(own * 1.15));
    expect(engine.makeShot(owner, [owner, strong], 1).stats.auraDamageMultiplier).toBe(1);
  });
});

describe('damage', () => {
  it.each([['siegebreaker', 'physical', 'physicalArmor'], ['spellbreaker', 'arcane', 'wardArmor']] as const)('penetrates only its own channel: %s', (branch, type, armor) => {
    const engine = new EvolutionCombat(), owner = tower(branch), target = victim();
    target[armor] = 0.55;
    expect(engine.damage(100, type, target, 0, engine.makeShot(owner, [owner], 1))).toBe(73);
    expect(engine.damage(100, type, target, 0)).toBe(45);
    const other = victim(2); other[armor === 'physicalArmor' ? 'wardArmor' : 'physicalArmor'] = 0.55;
    expect(engine.damage(100, type, other, 0, engine.makeShot(owner, [owner], 1))).toBe(100);
  });
  it('never damages dead targets and adds the Marksman boss bonus', () => {
    const engine = new EvolutionCombat(), dead = victim(); dead.alive = false;
    expect(engine.damage(100, 'physical', dead, 0)).toBe(0);
    const owner = tower('marksman'), boss = victim(2); boss.isBoss = true;
    expect(engine.damage(100, 'physical', boss, 0, engine.makeShot(owner, [owner], 1))).toBe(150);
  });
});

describe('targets and chains', () => {
  it('gives Volley distinct targets by mode with ID ties, only in range', () => {
    const v = tower('volley'), stats = effectiveStats(v.towerId, v.progression);
    expect(volleyTargets([victim(1), victim(2), victim(3), victim(4)], v, stats, 'first').map((t) => t.id)).toEqual([4, 3, 2]);
    expect(volleyTargets([victim(5), victim(6), victim(7)].map((t) => ({ ...t, distanceTraveled: 1 })), v, stats, 'first').map((t) => t.id)).toEqual([5, 6, 7]);
    expect(volleyTargets([victim(1), victim(9, 500, 0)], v, stats, 'first').map((t) => t.id)).toEqual([1]);
  });
  it('chains with x0.85 per jump, keeps the snapshot and never repeats a victim', () => {
    const engine = new EvolutionCombat(), owner = tower('stormcaller');
    const first = engine.makeShot(owner, [owner], 1.5), second = chainShot(first);
    expect(second.rawDamage).toBeCloseTo(first.rawDamage * 0.85);
    expect(second.primary).toBe(false); expect(second.counter).toBe(first.counter); expect(second.branchId).toBe(first.branchId);
    expect(nextChainTarget([victim(1), victim(2, 50), victim(3, 150)], { x: 0, y: 0 }, new Set([1]))?.id).toBe(2);
    expect(nextChainTarget([victim(2, 50), victim(3, 150)], { x: 0, y: 0 }, new Set([2]))).toBe(null);
  });
});

describe('statuses', () => {
  it.each([['winterguard', 'frozen', 500, 150], ['thunderlord', 'stunned', 350, 100]] as const)('uses fifth primaries and shared 1.5 s immunity: %s', (branch, status, normalMs, bossMs) => {
    const engine = new EvolutionCombat(), owner = tower(branch), target = victim(), shot = engine.makeShot(owner, [owner], 1);
    for (let n = 0; n < 5; n++) engine.primaryHit(shot, target, 0);
    expect(engine.statuses(target.id, 0)[status]).toBe(true);
    expect(engine.statuses(target.id, normalMs)[status]).toBe(false);
    for (let n = 0; n < 5; n++) engine.primaryHit(shot, target, 700);
    expect(engine.statuses(target.id, 700)[status]).toBe(false);
    for (let n = 0; n < 5; n++) engine.primaryHit(shot, target, 1501);
    expect(engine.statuses(target.id, 1501)[status]).toBe(true);
    const boss = victim(2); boss.isBoss = true; const other = tower(branch, 0, 2);
    for (let n = 0; n < 5; n++) engine.primaryHit(engine.makeShot(other, [other], 1), boss, 0);
    expect(engine.statuses(boss.id, bossMs)[status]).toBe(false);
  });
  it('counts only primary hits that land, letting a killing hit count without effects', () => {
    const engine = new EvolutionCombat(), owner = tower('winterguard'), shot = engine.makeShot(owner, [owner], 1);
    engine.primaryHit(chainShot(shot), victim(), 0);
    const dead = victim(2); dead.alive = false;
    engine.primaryHit(shot, dead, 0);
    expect(owner.counter.successes).toBe(0);
    engine.primaryHit(shot, dead, 0, true);
    expect(owner.counter.successes).toBe(1);
    expect(engine.statuses(dead.id, 0)).toEqual(neutral);
  });
  it('keeps independent vulnerability and slow expiries; weaker never extends stronger', () => {
    const engine = new EvolutionCombat(), target = victim(), strong = tower('brittle-ice', 3), weak = tower('brittle-ice', 0, 2);
    engine.primaryHit(engine.makeShot(strong, [strong], 1), target, 0);
    engine.primaryHit(engine.makeShot(weak, [weak], 1), target, 2000);
    expect(engine.damage(100, 'elemental', target, 2500)).toBe(130);
    expect(engine.damage(100, 'elemental', target, 3500)).toBe(115);
    expect(engine.damage(100, 'elemental', target, 5000)).toBe(100);
    const frost = tower('winterguard', 0, 3), brittle = tower('brittle-ice', 0, 4), slowed = victim(5);
    engine.primaryHit(engine.makeShot(frost, [frost], 1), slowed, 0);
    engine.primaryHit(engine.makeShot(brittle, [brittle], 1), slowed, 2000);
    expect(engine.statuses(slowed.id, 2799).slowFactor).toBe(0.6);
    expect(engine.statuses(slowed.id, 2900).slowFactor).toBe(0.3);
    expect(engine.statuses(slowed.id, 4000).slowFactor).toBe(0);
  });
  it('forgets an enemy on death or escape', () => {
    const engine = new EvolutionCombat(), owner = tower('thunderlord'), target = victim();
    for (let n = 0; n < 5; n++) engine.primaryHit(engine.makeShot(owner, [owner], 1), target, 0);
    engine.removeEnemy(target.id);
    expect(engine.statuses(target.id, 100)).toEqual(neutral);
  });
});

describe('burning fields', () => {
  it('snapshots field damage, replaces per owner and catches up exactly six ticks', () => {
    const engine = new EvolutionCombat(), owner = tower('flame-mortar'), shot = engine.makeShot(owner, [owner], 4.5);
    engine.addField(shot, 0, 0, 0); expect(engine.tickFields(0)).toEqual([]);
    engine.addField(shot, 10, 0, 0); expect(engine.activeFieldCount).toBe(1);
    const ticks = engine.tickFields(3000);
    expect(ticks.map((t) => t.atMs)).toEqual([500, 1000, 1500, 2000, 2500, 3000]);
    expect(ticks.every((t) => t.rawDamage === shot.rawDamage * 0.3 && t.x === 10 && t.radius === 90)).toBe(true);
    expect(engine.activeFieldCount).toBe(0);
    engine.addField(shot, 0, 0, 4000); engine.addField({ ...shot, ownerId: 2 }, 0, 0, 4000);
    expect(engine.activeFieldCount).toBe(2);
    engine.removeOwner(1); expect(engine.activeFieldCount).toBe(1);
    engine.clear(); expect(engine.activeFieldCount).toBe(0); expect(engine.activeFields).toEqual([]);
  });
  it('emits a replaced field’s due ticks once and drops the rest across a large delta', () => {
    const engine = new EvolutionCombat(), owner = tower('flame-mortar'), shot = engine.makeShot(owner, [owner], 1);
    engine.addField(shot, 0, 0, 0); engine.addField(shot, 50, 0, 1200);
    expect(engine.tickFields(1200).map((t) => [t.atMs, t.x])).toEqual([[500, 0], [1000, 0]]);
    expect(engine.tickFields(1200)).toEqual([]);
    expect(engine.tickFields(1700).map((t) => [t.atMs, t.x])).toEqual([[1700, 50]]);
  });
  it.each([1150, 1035])('yields at most two ticks per field under continuous fire every %i ms', (interval) => {
    const engine = new EvolutionCombat(), owner = tower('flame-mortar'), shot = engine.makeShot(owner, [owner], 1), ticks: number[] = [];
    for (let k = 0; k < 5; k++) { ticks.push(...engine.tickFields(k * interval).map((t) => t.atMs)); engine.addField(shot, 0, 0, k * interval); }
    for (let k = 0; k < 4; k++) expect(ticks.filter((at) => at > k * interval && at <= (k + 1) * interval)).toHaveLength(2);
  });
  it('follows game time only and reports active fields', () => {
    const engine = new EvolutionCombat(), owner = tower('flame-mortar'), shot = engine.makeShot(owner, [owner], 1);
    engine.addField(shot, 0, 0, 0);
    expect(engine.tickFields(250 * 2)).toHaveLength(1);
    expect(engine.tickFields(500)).toHaveLength(0);
    expect(engine.activeFields).toEqual([{ ownerId: 1, x: 0, y: 0, radius: 90 }]);
    engine.addField(engine.makeShot(tower('siegebreaker', 0, 7), [], 1), 0, 0, 0);
    expect(engine.activeFieldCount).toBe(1);
  });
  it('drops a sold owner’s pending ticks', () => {
    const engine = new EvolutionCombat(), owner = tower('flame-mortar'), shot = engine.makeShot(owner, [owner], 1);
    engine.addField(shot, 0, 0, 0); engine.addField(shot, 0, 0, 1200); engine.removeOwner(1);
    expect(engine.tickFields(5000)).toEqual([]); expect(engine.activeFieldCount).toBe(0);
  });
  it('credits no second death from overlapping fields', () => {
    const engine = new EvolutionCombat(), owner = tower('flame-mortar'), target = victim(), shot = engine.makeShot(owner, [owner], 1);
    target.hp = 1;
    engine.addField(shot, 0, 0, 0); engine.addField({ ...shot, ownerId: 2 }, 0, 0, 0);
    let deaths = 0;
    for (const tick of engine.tickFields(500)) {
      if (!target.alive) continue;
      target.hp -= engine.damage(tick.rawDamage, 'elemental', target, tick.atMs);
      if (target.hp <= 0) { target.alive = false; deaths++; }
    }
    expect(deaths).toBe(1);
  });
});
```
Recipe:
1. makeShot: stats = effectiveStats(owner); aura = max auraDamageMultiplier over towers t with t.id !== owner.id, branchId 'arcane-beacon', rank not null and Math.hypot(dx, dy) <= that Beacon's auraRange (Beacon's own unbuffed stats), default 1; rawDamage = Math.round(stats.damage * aura * damageMultiplier); branchId from owner.progression; counter = owner.counter; primary default true.
2. damage: if !target.alive return 0; bossMul = shot && target.isBoss ? shot.stats.bossDamageMultiplier : 1; armored = applyArmor(raw * bossMul, type, target.physicalArmor * (shot?.stats.physicalArmorScale ?? 1), target.wardArmor * (shot?.stats.wardArmorScale ?? 1)); return Math.round(armored * statuses(target.id, now).vulnerability).
3. primaryHit: return if !shot.primary; return if !target.alive && !killed; counter.successes++; return if killed or !target.alive; push slow {factor: slowFactor, untilMs: now + slowDuration*1000} when slowFactor; push vulnerability {multiplier, untilMs: now + vulnerabilityMs} when multiplier > 1; when control and successes % controlCadence === 0: if immuneUntil(enemy) > now reject (no extension), else push {kind, untilMs: now + (isBoss ? bossControlMs : controlMs)} and immuneUntil = now + controlImmunityMs.
4. statuses purges expired entries (untilMs > now stays) and reduces: slowFactor = Math.max(0, ...factors); vulnerability = Math.max(1, ...multipliers); frozen/stunned = any active of that kind.
5. Fields: Map<ownerId, {ownerId,x,y,radius: splashRadius ?? 0, rawDamage: shot.rawDamage * fieldFraction, nextTickMs: now + tickMs, expiresMs: now + fieldMs}> plus a flushed FieldTick[]. addField ignores shots without burningField; on replacement first move the old field's ticks with nextTickMs <= min(now, expiresMs) to flushed, then store the new field. tickFields(now): output = flushed (cleared) + for each field emit while nextTickMs <= min(now, expiresMs), stepping tickMs; delete fields whose nextTickMs > expiresMs. removeOwner deletes the field and that owner's flushed ticks; clear empties everything.
6. volleyTargets: alive candidates within stats.range of the tower, sorted by mode (first: distanceTraveled desc; last: asc; strongest: hp desc; weakest: hp asc; closest: distance asc), ties by id asc; take stats.volleyTargets. nextChainTarget: alive, not visited, distance < 130, sorted by distance then id; first or null.
Red:    `npm test -- tests/evolution-combat.test.ts` → fails: cannot resolve src/game/systems/EvolutionCombat.ts
Green:  `npm test -- tests/evolution-combat.test.ts` → all tests pass
Verify: `npm run typecheck` → no errors; `npm test` → every file passes
Commit: Add evolution combat engine with snapshots, statuses and fields

### T4 — Branch achievements and browser unlock repository (old Task 4)   [x] done
Satisfies: AC-20, AC-21, AC-23, AC-72, AC-73, AC-74, AC-76, AC-77, AC-78, AC-81, AC-82, AC-83, AC-84, AC-85, AC-86, AC-87, AC-88, AC-89, AC-124
Depends on: T1, T2
Lenses: data
Router summary: Add the achievement rule (a starter-branch tower still present at rank two or higher when wave twenty completes with lives left, not in debug-assisted runs) and a local unlock record that merges with other tabs, keeps first-earned times, never overwrites unreadable or newer data, and keeps unsaved unlocks in memory with a clear warning.
Files:
  - create  src/game/systems/UnlockSystem.ts
  - create  tests/unlocks.test.ts
Consumes: T1 BranchId, CombatTower, STARTER_BRANCH, ALTERNATIVE_BRANCH, TOWER_IDS; T2 tests/helpers/evolutionFixtures.ts tower().
Produces:
```ts
export const UNLOCK_STORAGE_KEY = 'aetherhold-unlocks-v1';
export const SAVE_FAILED_WARNING = 'Unlock earned, but progress could not be saved';
export interface UnlockProfile { version: 1; earned: Partial<Record<BranchId, string>>; }
export interface UnlockView { profile: UnlockProfile; unsaved: ReadonlySet<BranchId>; warning: string | null; }
export function earnedBranches(waveCompleted: number, lives: number, towers: readonly CombatTower[], debugAssisted: boolean): BranchId[]; // TOWER_IDS order, distinct
export class UnlockRepository {
  constructor(storage: Pick<Storage, 'getItem' | 'setItem'> | null, now?: () => string); // now defaults to new Date().toISOString()
  view(): UnlockView; snapshotForRun(): ReadonlySet<BranchId>; earn(branches: readonly BranchId[]): void; reconcile(): void;
}
export const unlockRepository: UnlockRepository; // built with localStorage inside try/catch; null when unavailable
```
Warnings (exact): unreadable 'Saved progress could not be read. Unlocks earned now are kept for this session only.'; newer 'Saved progress comes from a newer version. Unlocks earned now are kept for this session only.'; unavailable 'Progress storage is unavailable. Unlocks earned now are kept for this session only.'; write failure SAVE_FAILED_WARNING.
Reuse: JSON, Date.parse, Set/Map; ALTERNATIVE_BRANCH for recognition.
Tests (complete): tests/unlocks.test.ts
```ts
import { describe, expect, it } from 'vitest';
import { ALTERNATIVE_BRANCH, STARTER_BRANCH } from '../src/game/config/evolutions.ts';
import { SAVE_FAILED_WARNING, UNLOCK_STORAGE_KEY, UnlockRepository, earnedBranches } from '../src/game/systems/UnlockSystem.ts';
import { tower } from './helpers/evolutionFixtures.ts';

class MemoryStore {
  value: string | null; writes = 0; fail = false; keys: string[] = [];
  constructor(initial: string | null = null) { this.value = initial; }
  getItem = (key: string): string | null => { this.keys.push(key); return this.value; };
  setItem = (key: string, next: string): void => { this.keys.push(key); if (this.fail) throw new Error('quota'); this.value = next; this.writes++; };
}
const T0 = '2026-10-08T00:00:00Z', T1 = '2026-10-08T01:00:00Z';

describe('achievement rule', () => {
  it.each(Object.values(STARTER_BRANCH))('qualifies a retained rank-2 starter: %s', (branch) => {
    const good = tower(branch, 2), alt = ALTERNATIVE_BRANCH[good.towerId];
    expect(earnedBranches(20, 1, [good], false)).toEqual([alt]);
    expect(earnedBranches(20, 1, [tower(branch, 1)], false)).toEqual([]);
    expect(earnedBranches(20, 0, [good], false)).toEqual([]);
    expect(earnedBranches(21, 1, [good], false)).toEqual([]);
    expect(earnedBranches(20, 1, [], false)).toEqual([]);
    expect(earnedBranches(20, 1, [tower(alt, 2)], false)).toEqual([]);
    expect(earnedBranches(20, 1, [good], true)).toEqual([]);
  });
  it('earns several archetypes once each in the same event', () => {
    expect(earnedBranches(20, 3, [tower('stormcaller', 3, 2), tower('marksman', 2, 1), tower('marksman', 2, 3)], false)).toEqual(['volley', 'thunderlord']);
  });
});

describe('unlock repository', () => {
  it('keeps a failed save in memory and retries it', () => {
    const store = new MemoryStore(); store.fail = true;
    const repo = new UnlockRepository(store, () => T0);
    repo.earn(['volley']);
    expect(repo.view().unsaved.has('volley')).toBe(true);
    expect(repo.view().warning).toBe(SAVE_FAILED_WARNING);
    expect(repo.snapshotForRun().has('volley')).toBe(true);
    store.fail = false; repo.reconcile();
    expect(repo.view().unsaved.size).toBe(0); expect(repo.view().warning).toBe(null);
    expect(new UnlockRepository(store).snapshotForRun().has('volley')).toBe(true);
    expect(store.keys.every((k) => k === UNLOCK_STORAGE_KEY)).toBe(true);
  });
  it('treats an absent entry as a starter profile without warning or write', () => {
    const store = new MemoryStore(), repo = new UnlockRepository(store, () => T0);
    expect(repo.snapshotForRun().size).toBe(0); expect(repo.view().warning).toBe(null); expect(store.writes).toBe(0);
  });
  it.each(['{broken', '{"version":2,"earned":{"volley":"2026-10-08T00:00:00Z"}}', '{"version":1,"earned":[]}', '{"version":1,"earned":{"volley":"not-a-date"}}'])('never overwrites unreadable or newer bytes: %s', (raw) => {
    const store = new MemoryStore(raw), repo = new UnlockRepository(store, () => T0);
    repo.earn(['thunderlord']); repo.reconcile();
    expect(store.value).toBe(raw); expect(store.writes).toBe(0);
    expect(repo.snapshotForRun().has('thunderlord')).toBe(true);
    expect(repo.view().unsaved.has('thunderlord')).toBe(true);
    expect(repo.view().warning).not.toBe(null);
  });
  it('writes pending unlocks once the entry becomes absent', () => {
    const store = new MemoryStore('{broken'), repo = new UnlockRepository(store, () => T0);
    repo.earn(['thunderlord']); store.value = null; repo.reconcile();
    expect(JSON.parse(store.value!)).toEqual({ version: 1, earned: { thunderlord: T0 } });
    expect(repo.view().unsaved.size).toBe(0);
  });
  it('ignores unknown and starter ids without rewriting', () => {
    const raw = JSON.stringify({ version: 1, earned: { volley: T0, laser: T0, marksman: T0 } });
    const store = new MemoryStore(raw), repo = new UnlockRepository(store);
    expect([...repo.snapshotForRun()]).toEqual(['volley']); expect(store.value).toBe(raw);
  });
  it('converges two tabs while earlier run snapshots stay fixed', () => {
    const store = new MemoryStore(), a = new UnlockRepository(store, () => T0), b = new UnlockRepository(store, () => T1);
    const old = a.snapshotForRun();
    a.earn(['volley']); b.earn(['thunderlord']); a.reconcile(); b.reconcile();
    expect([...a.snapshotForRun()].sort()).toEqual(['thunderlord', 'volley']);
    expect([...b.snapshotForRun()].sort()).toEqual(['thunderlord', 'volley']);
    expect(old.size).toBe(0); expect(a.view().profile.earned.volley).toBe(T0);
    const writes = store.writes; a.reconcile(); b.reconcile(); expect(store.writes).toBe(writes);
    expect(a.snapshotForRun()).not.toBe(a.snapshotForRun());
  });
  it('merges a racing write keeping the earliest timestamp', () => {
    const store = new MemoryStore(), a = new UnlockRepository(store, () => T0);
    a.earn(['volley']);
    store.value = JSON.stringify({ version: 1, earned: { thunderlord: '2026-10-08T02:00:00Z', volley: '2026-10-09T00:00:00Z' } });
    a.reconcile();
    expect(JSON.parse(store.value!).earned).toEqual({ thunderlord: '2026-10-08T02:00:00Z', volley: T0 });
    const writes = store.writes; new UnlockRepository(store).reconcile(); expect(store.writes).toBe(writes);
  });
  it('is idempotent and keeps working without storage', () => {
    const store = new MemoryStore(), repo = new UnlockRepository(store, () => T0);
    repo.earn(['volley']); repo.earn(['volley']); expect(store.writes).toBe(1);
    const offline = new UnlockRepository(null, () => T0); offline.earn(['volley']);
    expect(offline.snapshotForRun().has('volley')).toBe(true); expect(offline.view().unsaved.has('volley')).toBe(true); expect(offline.view().warning).not.toBe(null);
  });
});
```
Recipe:
1. earnedBranches: [] unless waveCompleted === 20, lives > 0, !debugAssisted; else alternatives of archetypes (TOWER_IDS order) with a present tower on STARTER_BRANCH[id] at rank >= 2.
2. Classify a read: storage null → unavailable; getItem throws → unreadable; null → absent; parse failure or non-object → unreadable; version 1 with `earned` not a plain object, or a recognized alternative id whose value fails Date.parse → unreadable; integer version > 1 → newer; anything else → unreadable. Readable profiles keep only recognized alternative ids.
3. State: memory (session earned map), persisted (last readable profile), unsaved set, warning. sync(): classify; for unavailable/unreadable/newer set the matching warning, unsaved = all memory ids, no write. Otherwise merge persisted with memory (earliest Date.parse wins) and write `JSON.stringify({ version: 1, earned: <keys sorted> })` only when some memory id is missing from persisted or earlier than it; on throw set SAVE_FAILED_WARNING and unsaved = memory ids missing from persisted; on success re-read, persisted = re-read profile, unsaved = memory ids missing from it, warning null.
4. Constructor runs sync(); earn adds recognized alternatives not yet in memory with now(), then sync(); reconcile = sync(); view returns merged profile, a copy of unsaved, warning; snapshotForRun = sync() then a new Set of merged ids.
Red:    `npm test -- tests/unlocks.test.ts` → fails: cannot resolve src/game/systems/UnlockSystem.ts
Green:  `npm test -- tests/unlocks.test.ts` → all tests pass
Verify: `npm run typecheck` → no errors; `npm test` → every file passes
Commit: Add branch achievements and versioned unlock repository

### T5 — Siege lifecycle state machine and victory relic exits (old Task 5)   [x] done
Satisfies: AC-1, AC-4, AC-6, AC-47, AC-91, AC-92, AC-93, AC-94, AC-95, AC-96, AC-99, AC-102, AC-105, AC-107, AC-108, AC-124, AC-140
Depends on: T1
Router summary: Add a pure siege state machine: one phase at a time (siege, victory decision, endless, terminal), wave start and completion rules, boss milestone bits for waves ten, twenty and thirty, siege failure when the wave-ten or wave-thirty boss escapes with lives left, victory only after wave thirty is fully resolved, and the reward choices allowed during the victory decision.
Files:
  - create  src/game/systems/SiegeSystem.ts
  - create  tests/siege.test.ts
Consumes: T1 ResultProgress, RunOutcome, SIEGE_BOSS_BIT; existing: src/game/systems/RunSimulation.ts `RelicVault { stored; pending; target; offer(id, reason, reveal); beginUse(index, hasTower); cancelTarget(); resolve(choice) }`; existing: src/game/config/powerUps.ts `POWERUP_INVENTORY_LIMIT` (3).
Produces:
```ts
export interface ClearInput { wave: number; lives: number; spawns: number; enemies: number; flights: number; fields: number; }
export type ClearEvent = 'none' | 'wave-cleared' | 'victory';
export type SiegePhase = 'siege' | 'victory' | 'endless' | 'terminal';
export class SiegeSystem {
  phase: SiegePhase; highestWave: number; wavesCompleted: number; siegeBossesDefeated: number; // 'siege', 0, 0, 0
  get evolutionOpen(): boolean;                         // wave-10 bit set
  startWave(wave: number): boolean;                     // only completed+1, no active wave, phase siege/endless, 31+ only in endless
  bossKilled(wave: number): void;                       // sets the bit for 10/20/30 unless terminal
  bossEscaped(wave: number, lives: number): RunOutcome | null; // lives <= 0 → 'defeat'; 10/30 in siege → 'siege-failed'; else null
  completeWave(input: ClearInput): ClearEvent;
  choose(action: 'finish' | 'continue', rewardsResolved: boolean): boolean;
  fail(outcome: 'defeat' | 'siege-failed'): boolean;    // false when already terminal or no wave entered
  progress(): ResultProgress;                           // throws unless terminal
  seedForQA(wavesCompleted: number, mask: number, phase?: 'siege' | 'victory' | 'endless'): void; // debug fixtures only
}
export function victoryRewardChoices(inventoryCount: number): readonly ('store' | 'replace-oldest' | 'discard-new')[];
export function victoryRewardsResolved(vault: RelicVault, rewardModalOpen: boolean): boolean;
```
Reuse: RelicVault and POWERUP_INVENTORY_LIMIT (existing); SIEGE_BOSS_BIT (T1).
Tests (complete): tests/siege.test.ts
```ts
import { describe, expect, it } from 'vitest';
import { SiegeSystem, victoryRewardChoices, victoryRewardsResolved } from '../src/game/systems/SiegeSystem.ts';
import { RelicVault } from '../src/game/systems/RunSimulation.ts';

const clear = (wave: number, lives = 10) => ({ wave, lives, spawns: 0, enemies: 0, flights: 0, fields: 0 });
function advanceSiege(to: number): SiegeSystem {
  const siege = new SiegeSystem();
  for (let wave = 1; wave <= to; wave++) { siege.startWave(wave); if (wave % 10 === 0) siege.bossKilled(wave); siege.completeWave(clear(wave)); }
  return siege;
}

describe('siege lifecycle', () => {
  it('runs 30 waves into the victory decision, then endless once', () => {
    const siege = new SiegeSystem();
    for (let wave = 1; wave <= 30; wave++) {
      expect(siege.startWave(wave)).toBe(true);
      if (wave === 10 || wave === 30) siege.bossKilled(wave);
      expect(siege.completeWave(clear(wave))).toBe(wave === 30 ? 'victory' : 'wave-cleared');
    }
    expect(siege.startWave(31)).toBe(false);
    expect(siege.choose('continue', false)).toBe(false);
    expect(siege.choose('continue', true)).toBe(true);
    expect(siege.choose('continue', true)).toBe(false);
    expect(siege.startWave(31)).toBe(true);
  });
  it.each([10, 30])('fails the siege when the wave-%i boss escapes with lives left', (wave) => {
    const siege = advanceSiege(wave - 1); siege.startWave(wave);
    expect(siege.bossEscaped(wave, 10)).toBe('siege-failed');
    expect(siege.fail('siege-failed')).toBe(true);
    expect(siege.progress()).toMatchObject({ highestWave: wave, wavesCompleted: wave - 1, outcome: 'siege-failed' });
  });
  it('applies normal rules to the wave-20 boss and defeat at zero lives', () => {
    expect(advanceSiege(19).bossEscaped(20, 10)).toBe(null);
    const s = advanceSiege(9); s.startWave(10); expect(s.bossEscaped(10, 0)).toBe('defeat');
  });
  it.each(['spawns', 'enemies', 'flights', 'fields'] as const)('waits for %s after the final boss dies', (count) => {
    const siege = advanceSiege(29); siege.startWave(30); siege.bossKilled(30);
    expect(siege.completeWave({ ...clear(30), [count]: 1 })).toBe('none');
    expect(siege.completeWave(clear(30))).toBe('victory');
    expect(siege.completeWave(clear(30))).toBe('none');
  });
  it('prefers defeat when lives reach zero at wave 30', () => {
    const siege = advanceSiege(29); siege.startWave(30); siege.bossKilled(30);
    expect(siege.completeWave(clear(30, 0))).toBe('none');
    siege.fail('defeat'); expect(siege.progress().outcome).toBe('defeat');
  });
  it('opens evolution only from the wave-10 bit', () => {
    const s = new SiegeSystem(); s.bossKilled(7); expect(s.evolutionOpen).toBe(false);
    s.bossKilled(10); s.bossKilled(10); expect([s.evolutionOpen, s.siegeBossesDefeated]).toEqual([true, 1]);
  });
  it('accepts only the next wave and completes each wave once', () => {
    const s = new SiegeSystem();
    expect(s.startWave(2)).toBe(false); expect(s.startWave(1)).toBe(true); expect(s.startWave(2)).toBe(false);
    expect(s.completeWave(clear(2))).toBe('none'); expect(s.completeWave(clear(1))).toBe('wave-cleared'); expect(s.completeWave(clear(1))).toBe('none');
  });
  it('finishes a victory once and records an endless defeat cumulatively', () => {
    const won = advanceSiege(30);
    expect(won.choose('finish', true)).toBe(true); expect(won.choose('finish', true)).toBe(false); expect(won.fail('defeat')).toBe(false);
    expect(won.progress()).toEqual({ highestWave: 30, wavesCompleted: 30, outcome: 'victory', siegeBossesDefeated: 7 });
    const endless = advanceSiege(30); endless.choose('continue', true); endless.startWave(31);
    expect(endless.fail('defeat')).toBe(true);
    expect(endless.progress()).toEqual({ highestWave: 31, wavesCompleted: 30, outcome: 'defeat', siegeBossesDefeated: 7 });
  });
  it('creates no result before the first wave', () => {
    const s = new SiegeSystem(); expect(s.fail('defeat')).toBe(false); expect(s.phase).toBe('siege'); expect(() => s.progress()).toThrow();
  });
  it('seeds QA progress explicitly', () => {
    const s = new SiegeSystem(); s.seedForQA(24, 3);
    expect(s).toMatchObject({ phase: 'siege', wavesCompleted: 24, highestWave: 24, siegeBossesDefeated: 3 });
    expect(s.startWave(25)).toBe(true);
    const v = new SiegeSystem(); v.seedForQA(30, 7, 'victory'); expect(v.phase).toBe('victory');
  });
});

describe('victory relic exits', () => {
  it('resolves a full inventory in FIFO order without activation', () => {
    const vault = new RelicVault(); vault.stored.push('meteor_strike', 'treasure_goblin', 'emergency_repair');
    vault.offer('battle_cry', 'boss', true); vault.offer('arcane_surge', 'second', true);
    expect(victoryRewardChoices(3)).toEqual(['replace-oldest', 'discard-new']);
    expect(victoryRewardsResolved(vault, false)).toBe(false);
    expect(vault.resolve('replace-oldest')).toBe(true); expect(vault.pending).toHaveLength(1);
    expect(vault.resolve('discard-new')).toBe(true); expect(vault.resolve('discard-new')).toBe(false);
    expect(victoryRewardsResolved(vault, false)).toBe(true); expect(victoryRewardsResolved(vault, true)).toBe(false);
    expect(vault.stored).toEqual(['treasure_goblin', 'emergency_repair', 'battle_cry']);
  });
  it('offers Store and Discard New while space remains', () => {
    expect(victoryRewardChoices(0)).toEqual(['store', 'discard-new']); expect(victoryRewardChoices(2)).toEqual(['store', 'discard-new']);
  });
  it('cancels a Meteor target without consuming the reserved relic', () => {
    const vault = new RelicVault(); vault.stored.push('meteor_strike'); vault.beginUse(0, true);
    vault.offer('battle_cry', 'boss', true);
    expect(victoryRewardsResolved(vault, false)).toBe(false);
    vault.cancelTarget();
    expect([vault.target, vault.stored, vault.pending.length]).toEqual([null, ['meteor_strike'], 1]);
  });
});
```
Recipe:
1. Private `activeWave: number | null` and `terminalOutcome: RunOutcome | null`.
2. completeWave kernel:
```ts
if (this.phase === 'terminal' || input.wave !== this.activeWave || input.lives <= 0) return 'none';
if (input.spawns + input.enemies + input.flights + input.fields !== 0) return 'none';
this.wavesCompleted = input.wave; this.activeWave = null;
if (this.phase === 'siege' && input.wave === 30 && (this.siegeBossesDefeated & 5) === 5) { this.phase = 'victory'; return 'victory'; }
return 'wave-cleared';
```
3. choose: requires phase 'victory' and rewardsResolved; finish → phase terminal, outcome victory; continue → phase endless (counters untouched).
4. victoryRewardChoices: count >= POWERUP_INVENTORY_LIMIT ? ['replace-oldest','discard-new'] : ['store','discard-new']; victoryRewardsResolved: pending empty, target null, !rewardModalOpen.
5. seedForQA sets wavesCompleted, highestWave = wavesCompleted, mask, phase (default wavesCompleted >= 30 ? 'endless' : 'siege'), activeWave null.
Red:    `npm test -- tests/siege.test.ts` → fails: cannot resolve src/game/systems/SiegeSystem.ts
Green:  `npm test -- tests/siege.test.ts` → all tests pass
Verify: `npm run typecheck` → no errors; `npm test` → every file passes
Commit: Add siege lifecycle state machine and victory relic exits

### T6 — Explicit wave-30 siege finale configuration (old Task 7, wave part)   [x] done
Satisfies: AC-1, AC-2, AC-5, AC-32
Depends on: none
Router summary: Make wave thirty an explicit, tunable siege-finale definition in configuration with exactly one Warlord, seeded with today's wave-thirty enemy groups and boss health bonus, while waves ten and twenty and the endless escalation after thirty stay unchanged.
Files:
  - modify  src/game/config/waves.ts          (add SiegeFinaleConfig, SIEGE_FINALE)
  - modify  src/game/systems/WaveSystem.ts    (buildWave reads SIEGE_FINALE at its wave)
  - create  tests/siege-finale.test.ts
Consumes: existing: src/shared/types.ts `WaveEnemyGroup`; existing: WaveSystem.ts `buildWave(wave, countMultiplier = 1): WaveConfig`, `countForWave(base, wave): number`; today's endless branch at wave 30 (`WaveSystem.ts:68-83`).
Produces:
```ts
export interface SiegeFinaleConfig { wave: number; bossHpScaleBonus: number; bossSpawnInterval: number; bossDelayBefore: number; groups: WaveEnemyGroup[]; }
export const SIEGE_FINALE: SiegeFinaleConfig = { wave: 30, bossHpScaleBonus: 3.4, bossSpawnInterval: 3, bossDelayBefore: 15, groups: [
  { enemyId: 'thornling', count: 59, spawnInterval: 0.4, delayBefore: 0.3 }, { enemyId: 'swiftwisp', count: 59, spawnInterval: 0.3, delayBefore: 2 },
  { enemyId: 'ironbark', count: 47, spawnInterval: 0.5, delayBefore: 4 }, { enemyId: 'runescale', count: 47, spawnInterval: 0.5, delayBefore: 6 },
  { enemyId: 'mossmaw', count: 35, spawnInterval: 0.55, delayBefore: 8 }, { enemyId: 'gloomite', count: 46, spawnInterval: 0.2, delayBefore: 10 },
  { enemyId: 'cragback', count: 9, spawnInterval: 1.2, delayBefore: 12 } ] };
```
Reuse: existing buildWave difficulty scaling and safety rule; countForWave.
Tests (complete): tests/siege-finale.test.ts
```ts
import { describe, expect, it } from 'vitest';
import { DIFFICULTIES } from '../src/game/config/difficulties.ts';
import { SIEGE_FINALE } from '../src/game/config/waves.ts';
import { buildWave, countForWave } from '../src/game/systems/WaveSystem.ts';

describe('siege finale', () => {
  it('seeds the finale with today’s wave-30 endless-mix groups and boss bonus', () => {
    const tier = 3;
    expect(SIEGE_FINALE.wave).toBe(30);
    expect(SIEGE_FINALE.groups).toEqual([
      { enemyId: 'thornling', count: countForWave(10, 30), spawnInterval: 0.4, delayBefore: 0.3 },
      { enemyId: 'swiftwisp', count: countForWave(10, 30), spawnInterval: 0.3, delayBefore: 2 },
      { enemyId: 'ironbark', count: countForWave(8, 30), spawnInterval: 0.5, delayBefore: 4 },
      { enemyId: 'runescale', count: countForWave(8, 30), spawnInterval: 0.5, delayBefore: 6 },
      { enemyId: 'mossmaw', count: countForWave(6, 30), spawnInterval: 0.55, delayBefore: 8 },
      { enemyId: 'gloomite', count: 16 + 30, spawnInterval: 0.2, delayBefore: 10 },
      { enemyId: 'cragback', count: 3 + tier * 2, spawnInterval: 1.2, delayBefore: 12 }
    ]);
    expect(SIEGE_FINALE.bossHpScaleBonus).toBeCloseTo(1 + tier * 0.8);
  });
  it('builds wave 30 with exactly one Warlord finale', () => {
    const wave = buildWave(30);
    expect(wave.isBossWave).toBe(true);
    expect(wave.groups.filter((g) => g.enemyId === 'warlord')).toEqual([{ enemyId: 'warlord', count: 1, spawnInterval: 3, delayBefore: 15, hpScaleBonus: SIEGE_FINALE.bossHpScaleBonus }]);
    expect(wave.groups.filter((g) => g.enemyId !== 'warlord')).toEqual(SIEGE_FINALE.groups);
  });
  it('reads configuration without mutating it', () => {
    const original = SIEGE_FINALE.bossHpScaleBonus;
    try { SIEGE_FINALE.bossHpScaleBonus = 4; expect(buildWave(30).groups.find((g) => g.enemyId === 'warlord')?.hpScaleBonus).toBe(4); }
    finally { SIEGE_FINALE.bossHpScaleBonus = original; }
    const hard = buildWave(30, DIFFICULTIES.hard.enemyCountMultiplier);
    expect(hard.groups.find((g) => g.enemyId === 'warlord')?.count).toBe(1);
    expect(hard.groups[0].count).toBe(Math.max(1, Math.round(countForWave(10, 30) * DIFFICULTIES.hard.enemyCountMultiplier)));
    expect(SIEGE_FINALE.groups[0].count).toBe(countForWave(10, 30));
  });
  it('keeps bosses at 10 and 20 and endless escalation after 30', () => {
    expect(buildWave(10).groups.filter((g) => g.enemyId === 'warlord').map((g) => g.count)).toEqual([1]);
    expect(buildWave(20).groups.find((g) => g.enemyId === 'warlord')?.hpScaleBonus).toBe(1.8);
    expect(buildWave(40).groups.find((g) => g.enemyId === 'warlord')?.count).toBe(2);
    const total = (w: number) => buildWave(w).groups.reduce((n, g) => n + g.count, 0);
    expect(total(35)).toBeGreaterThan(total(31));
  });
});
```
Recipe:
1. waves.ts: `import type { WaveEnemyGroup } from '../../shared/types.ts'`; export the interface and SIEGE_FINALE as a plain mutable object (not `as const`).
2. buildWave: before `if (wave <= 5)`, add a branch for `wave === SIEGE_FINALE.wave` that pushes a copy (`{ ...g }`) of each finale group, then `{ enemyId: 'warlord', count: 1, spawnInterval: SIEGE_FINALE.bossSpawnInterval, delayBefore: SIEGE_FINALE.bossDelayBefore, hpScaleBonus: SIEGE_FINALE.bossHpScaleBonus }`; turn the existing chain into `else if`. Copies are required because difficulty scaling mutates group counts.
Red:    `npm test -- tests/siege-finale.test.ts` → fails: SIEGE_FINALE is undefined (not exported)
Green:  `npm test -- tests/siege-finale.test.ts` → all tests pass
Verify: `npm run typecheck` → no errors; `npm test` → every file passes (game.test.ts wave assertions unchanged)
Commit: Make the wave-30 siege finale an explicit configuration

### T7 — Terminal-result validity rules and result fixtures (old Task 6)   [x] done
Satisfies: AC-111, AC-112, AC-116, AC-119, AC-142
Depends on: T1
Lenses: security, contract
Router summary: Add the shared rules a terminal score result must satisfy (completed waves, outcome, lives, and the wave ten, twenty and thirty boss milestone bits) as one function used by both the game and the server, plus a test helper that builds realistic results from the real wave and score configuration.
Files:
  - create  src/shared/resultProgress.ts
  - create  tests/helpers/progressionResult.ts
  - create  tests/result-progress.test.ts
Consumes: T1 ResultProgress, RunOutcome; existing: src/shared/types.ts `GameResultPayload` (11 fields); existing: WaveSystem.ts `buildWave`; enemies.ts `ENEMIES` (isBoss, isElite); ScoreSystem.ts `calculateScore({ enemiesKilled, elitesKilled, wavesCompleted, bossesKilled, remainingLives, unusedGold }, difficulty).finalScore`; difficulties.ts `DIFFICULTIES`; version.ts `GAME_VERSION`, `SCORE_VERSION`.
Produces:
```ts
export function resultProgressErrors(progress: ResultProgress, remainingLives: number, bossesKilled: number): string[];
export function isValidResultProgress(progress: ResultProgress, remainingLives: number, bossesKilled: number): boolean;
// tests/helpers/progressionResult.ts
export interface ResultFixtureOptions { runId?: string; escapedBossWaves?: readonly number[]; }
export function resultFixture(progress: ResultProgress, remainingLives?: number, options?: ResultFixtureOptions): GameResultPayload & ResultProgress;
```
Error strings (exact): 'highestWave must be an integer from 1 to 500'; 'wavesCompleted must be an integer from 0 to highestWave'; 'outcome must be victory, defeat or siege-failed'; 'siegeBossesDefeated must be an integer from 0 to 7'; 'siegeBossesDefeated has more milestones than bossesKilled'; 'siegeBossesDefeated marks a boss wave that was never entered'; 'Progress beyond wave 10 requires the wave-10 boss milestone'; 'Progress beyond wave 30 requires the wave-30 boss milestone'; 'A victory requires 30 completed waves, lives remaining and the wave-10 and wave-30 milestones'; 'A defeat requires zero lives and wavesCompleted = highestWave - 1'; 'A siege failure requires wave 10 or 30, lives remaining, wavesCompleted = highestWave - 1 and no milestone for the escaped boss'.
Reuse: buildWave, ENEMIES, calculateScore, DIFFICULTIES (existing).
Tests (complete): tests/helpers/progressionResult.ts
```ts
import { DIFFICULTIES } from '../../src/game/config/difficulties.ts';
import { ENEMIES } from '../../src/game/config/enemies.ts';
import { calculateScore } from '../../src/game/systems/ScoreSystem.ts';
import { buildWave } from '../../src/game/systems/WaveSystem.ts';
import type { ResultProgress } from '../../src/shared/progression.ts';
import type { GameResultPayload } from '../../src/shared/types.ts';
import { GAME_VERSION, SCORE_VERSION } from '../../src/shared/version.ts';

export interface ResultFixtureOptions { runId?: string; escapedBossWaves?: readonly number[]; }
export function resultFixture(progress: ResultProgress, remainingLives = 10, options: ResultFixtureOptions = {}): GameResultPayload & ResultProgress {
  let enemiesKilled = 0, bossesKilled = 0, elitesKilled = 0;
  for (let wave = 1; wave <= progress.wavesCompleted; wave++) {
    for (const group of buildWave(wave).groups) {
      if (ENEMIES[group.enemyId].isBoss && options.escapedBossWaves?.includes(wave)) continue;
      enemiesKilled += group.count;
      if (ENEMIES[group.enemyId].isBoss) bossesKilled += group.count;
      if (ENEMIES[group.enemyId].isElite) elitesKilled += group.count;
    }
  }
  const score = calculateScore({ enemiesKilled, bossesKilled, elitesKilled, wavesCompleted: progress.wavesCompleted, remainingLives, unusedGold: 0 }, DIFFICULTIES.medium);
  return { ...progress, playerName: 'TestWarden', difficulty: 'medium', enemiesKilled, bossesKilled, remainingLives, finalScore: score.finalScore,
    gameDurationSeconds: 3600, runId: options.runId ?? 'progression-run-0001', gameVersion: GAME_VERSION, scoreVersion: SCORE_VERSION };
}
```
tests/result-progress.test.ts
```ts
import { describe, expect, it } from 'vitest';
import { isValidResultProgress, resultProgressErrors } from '../src/shared/resultProgress.ts';
import type { ResultProgress, RunOutcome } from '../src/shared/progression.ts';
import { resultFixture } from './helpers/progressionResult.ts';

const p = (highestWave: number, wavesCompleted: number, outcome: RunOutcome, siegeBossesDefeated: number): ResultProgress => ({ highestWave, wavesCompleted, outcome, siegeBossesDefeated });

describe('terminal result validity', () => {
  it.each([
    ['victory', p(30, 30, 'victory', 5), 10, 2], ['victory with wave-20 boss', p(30, 30, 'victory', 7), 10, 3],
    ['first boss escaped', p(10, 9, 'siege-failed', 0), 15, 0], ['final boss escaped', p(30, 29, 'siege-failed', 3), 4, 2],
    ['final boss escaped without wave-20 boss', p(30, 29, 'siege-failed', 1), 4, 1], ['defeat after wave 10', p(14, 13, 'defeat', 1), 0, 1],
    ['early defeat', p(1, 0, 'defeat', 0), 0, 0], ['endless defeat', p(31, 30, 'defeat', 7), 0, 3], ['deep endless defeat', p(45, 44, 'defeat', 5), 0, 4]
  ] as Array<[string, ResultProgress, number, number]>)('accepts %s', (_name, progress, lives, bosses) => {
    expect(resultProgressErrors(progress, lives, bosses)).toEqual([]);
    expect(isValidResultProgress(progress, lives, bosses)).toBe(true);
  });
  it.each([
    ['highestWave 0', p(0, 0, 'defeat', 0), 0, 0], ['wave 11 without the wave-10 bit', p(11, 10, 'defeat', 0), 0, 1],
    ['wave 31 without the wave-30 bit', p(31, 30, 'defeat', 3), 0, 3], ['defeat with lives left', p(12, 11, 'defeat', 1), 5, 1],
    ['victory with zero lives', p(30, 30, 'victory', 5), 0, 2], ['siege failure with zero lives', p(10, 9, 'siege-failed', 0), 0, 0],
    ['siege failure at another wave', p(20, 19, 'siege-failed', 1), 5, 1], ['siege failure holding the escaped bit', p(10, 9, 'siege-failed', 1), 5, 1],
    ['final siege failure holding the wave-30 bit', p(30, 29, 'siege-failed', 5), 5, 2], ['bit for an unentered wave', p(15, 14, 'defeat', 3), 0, 2],
    ['wave-30 bit before wave 30', p(25, 24, 'defeat', 5), 0, 2], ['more bits than bosses killed', p(31, 30, 'defeat', 7), 0, 2],
    ['victory short of 30 completions', p(30, 29, 'victory', 5), 10, 2], ['victory missing the wave-30 bit', p(30, 30, 'victory', 1), 10, 1],
    ['defeat with wrong completion', p(12, 12, 'defeat', 1), 0, 1], ['mask out of range', p(31, 30, 'defeat', 15), 0, 9],
    ['non-finite completion', p(12, Number.NaN, 'defeat', 1), 0, 1], ['unknown outcome', p(12, 11, 'won' as RunOutcome, 1), 0, 1]
  ] as Array<[string, ResultProgress, number, number]>)('rejects %s', (_name, progress, lives, bosses) => {
    expect(resultProgressErrors(progress, lives, bosses).length).toBeGreaterThan(0);
  });
  it('builds config-derived fixtures that satisfy the rules', () => {
    const victory = resultFixture(p(30, 30, 'victory', 7));
    expect(victory.bossesKilled).toBe(3);
    expect(isValidResultProgress(victory, victory.remainingLives, victory.bossesKilled)).toBe(true);
    const noTwenty = resultFixture(p(30, 30, 'victory', 5), 10, { escapedBossWaves: [20] });
    expect([noTwenty.bossesKilled, noTwenty.enemiesKilled]).toEqual([2, victory.enemiesKilled - 1]);
    expect(noTwenty.finalScore).toBeLessThan(victory.finalScore);
    expect(resultFixture(p(10, 9, 'siege-failed', 0), 10, { runId: 'progression-run-0002' }).runId).toBe('progression-run-0002');
  });
});
```
Recipe:
1. Schema checks first (Number.isSafeInteger; highestWave 1–500; wavesCompleted 0–highestWave; outcome in the three values; mask 0–7); return those errors alone if any.
2. Then: popcount(mask) > bossesKilled; bit 1/2/4 with highestWave below 10/20/30; highestWave >= 11 without bit 1; highestWave >= 31 without bit 4; outcome rules — victory: highestWave === 30, wavesCompleted === 30, lives > 0, (mask & 5) === 5; defeat: lives === 0, wavesCompleted === highestWave - 1; siege-failed: highestWave 10 or 30, wavesCompleted === highestWave - 1, lives > 0, bit of highestWave absent.
3. isValidResultProgress returns errors.length === 0.
Red:    `npm test -- tests/result-progress.test.ts` → fails: cannot resolve src/shared/resultProgress.ts
Green:  `npm test -- tests/result-progress.test.ts` → all tests pass
Verify: `npm run typecheck` → no errors; `npm test` → every file passes
Commit: Add shared terminal-result validity rules and fixtures

### T8 — Make existing score fixtures progress-complete (old Task 6)   [x] done
Satisfies: AC-117
Depends on: none
Router summary: Add the three new result fields (completed waves, outcome, boss milestones) to every existing score fixture and set defeat fixtures to zero lives, using values the current validation already accepts, so that the stricter validation in the next task keeps every existing assertion green.
Files:
  - modify  tests/game.test.ts      ('score validation' and 'leaderboard result' fixtures)
  - modify  tests/worker.test.ts    (validPayload, SQL-injection payload, prior-era row)
  - modify  tests/screens.test.ts   (gameOverData, hardScore)
  - modify  src/game/qa.ts          (gameover fixture data)
Consumes: existing fixtures listed below; current validateScorePayload ignores unknown fields and accepts remainingLives 0.
Produces: fixture objects only; no behaviour change.
Reuse: existing fixture objects.
Tests (complete): edits only —
- tests/game.test.ts `good`: `remainingLives: 0` and add `wavesCompleted: 11, outcome: 'defeat', siegeBossesDefeated: 1`.
- Hard wave-two loss: add `wavesCompleted: 1, siegeBossesDefeated: 0`. Both forged wave-six objects and the lucky object: add `wavesCompleted: 5, siegeBossesDefeated: 0`.
- atWaveEleven: add `wavesCompleted: 10, siegeBossesDefeated: 1`. atWaveTwenty: add `wavesCompleted: 19, siegeBossesDefeated: 1`.
- Late-run case becomes `{ ...good, highestWave: 40, wavesCompleted: 39, siegeBossesDefeated: 7, finalScore: 250000, enemiesKilled: 8000, bossesKilled: 3, gameDurationSeconds: 10000 }`.
- 'leaderboard result' `validScore`: add `wavesCompleted: 1, outcome: 'defeat', siegeBossesDefeated: 0`.
- tests/worker.test.ts validPayload: `remainingLives: 0` and add `wavesCompleted: 7, outcome: 'defeat', siegeBossesDefeated: 0`; SQL-injection payload adds `wavesCompleted: 2`; the prior-era row pushed into db.rows adds `wavesCompleted: 39, outcome: 'defeat', siegeBossesDefeated: 3`.
- tests/screens.test.ts gameOverData adds `wavesCompleted: 3, outcome: 'defeat' as const, siegeBossesDefeated: 0`; hardScore adds `wavesCompleted: 3, outcome: 'defeat', siegeBossesDefeated: 0`.
- src/game/qa.ts gameover fixture adds `wavesCompleted: 24, outcome: 'defeat', siegeBossesDefeated: 3,` after `highestWave: 25,`.
Recipe:
1. Apply exactly the edits above; change no assertion.
Red:    `npm test` → expected: passes before editing (fixture-only task; there is no failing state)
Green:  `npm test` → every file passes after editing with the same test count
Verify: `npm run typecheck` → no errors; `npm test` → every file passes
Commit: Make existing score fixtures progress-complete

### T9 — Shared payload contract and validation from explicit completion (old Task 6)   [x] done
Satisfies: AC-110, AC-111, AC-112, AC-113, AC-114, AC-115, AC-116, AC-117, AC-119, AC-142
Depends on: T7, T8
Lenses: security, contract
Router summary: Add completed waves, outcome and boss milestones to the shared score payload and make score validation use the explicit completion and outcome instead of assuming highest wave minus one, rejecting results that break the new validity rules while keeping every existing forged-score rejection. The results screen sends the new fields.
Files:
  - modify  src/shared/types.ts                (GameResultPayload extends ResultProgress)
  - modify  src/shared/validation.ts           (validateScorePayload)
  - modify  src/game/scenes/GameOverScene.ts   (Data fields; payload projection)
  - modify  tests/screens.test.ts              (projected key list)
  - create  tests/progression-results.test.ts
Consumes: T7 `resultProgressErrors(progress, remainingLives, bossesKilled): string[]`, resultFixture; T1 ResultProgress, RunOutcome; existing validation.ts internals `minimumNonBossKillsBeforeWave`, `scoreFloor`, `scoreCeiling`, `countMilestoneRewards`, `waveSpawnFinishMs`.
Produces: `interface GameResultPayload extends ResultProgress { ...existing 11 fields }` (type-only import from './progression.ts'); `validateScorePayload(body): ValidationResult & { value?: GameResultPayload }` unchanged signature, value includes wavesCompleted, outcome, siegeBossesDefeated; GameOverScene `Data` gains `wavesCompleted: number; outcome: RunOutcome; siegeBossesDefeated: number` and its POST projection includes them (14 keys). Note: GameScene supplies these fields from T14; until then local runs submit invalid payloads (no deployment happens before T28).
Reuse: resultProgressErrors (T7); existing validation helpers.
Tests (complete): tests/progression-results.test.ts
```ts
import { describe, expect, it } from 'vitest';
import { validateScorePayload } from '../src/shared/validation.ts';
import { SCORE_VERSION } from '../src/shared/version.ts';
import { resultFixture } from './helpers/progressionResult.ts';

describe('explicit completion validation', () => {
  const victory = resultFixture({ highestWave: 30, wavesCompleted: 30, outcome: 'victory', siegeBossesDefeated: 7 });
  it('accepts a legitimate wave-30 victory and returns the progress fields', () => {
    const result = validateScorePayload(victory);
    expect(result.errors).toEqual([]);
    expect(result.value).toMatchObject({ highestWave: 30, wavesCompleted: 30, outcome: 'victory', siegeBossesDefeated: 7, remainingLives: 10 });
  });
  it('accepts a victory whose wave-20 boss escaped', () => {
    expect(validateScorePayload(resultFixture({ highestWave: 30, wavesCompleted: 30, outcome: 'victory', siegeBossesDefeated: 5 }, 5, { escapedBossWaves: [20] })).errors).toEqual([]);
  });
  it('rejects victories without 30 completions, required bits or lives', () => {
    for (const forged of [{ ...victory, wavesCompleted: 29 }, { ...victory, siegeBossesDefeated: 3 }, { ...victory, remainingLives: 0 }]) expect(validateScorePayload(forged).ok).toBe(false);
  });
  it.each([11, 20, 30])('rejects progress past wave 10 without its boss bit at wave %i', (highestWave) => {
    expect(validateScorePayload(resultFixture({ highestWave, wavesCompleted: highestWave - 1, outcome: 'defeat', siegeBossesDefeated: 0 }, 0)).ok).toBe(false);
  });
  it.each([10, 30])('accepts a positive-lives siege failure at wave %i', (wave) => {
    const failed = resultFixture({ highestWave: wave, wavesCompleted: wave - 1, outcome: 'siege-failed', siegeBossesDefeated: wave === 30 ? 3 : 0 }, 10);
    expect(validateScorePayload(failed).errors).toEqual([]);
    expect(validateScorePayload({ ...failed, wavesCompleted: wave }).ok).toBe(false);
    expect(validateScorePayload({ ...failed, remainingLives: 0 }).ok).toBe(false);
  });
  it('accepts an endless defeat only after the siege milestones', () => {
    const defeat = resultFixture({ highestWave: 31, wavesCompleted: 30, outcome: 'defeat', siegeBossesDefeated: 7 }, 0);
    expect(validateScorePayload(defeat).errors).toEqual([]);
    expect(validateScorePayload({ ...defeat, siegeBossesDefeated: 1 }).ok).toBe(false);
    expect(validateScorePayload({ ...defeat, remainingLives: 10 }).ok).toBe(false);
    expect(validateScorePayload({ ...defeat, highestWave: 0 }).ok).toBe(false);
  });
  it('requires every new field, finite values and the current score version', () => {
    const { wavesCompleted: _w, ...missing } = victory; void _w;
    for (const bad of [missing, { ...victory, outcome: 'won' }, { ...victory, siegeBossesDefeated: Number.POSITIVE_INFINITY }, { ...victory, wavesCompleted: 29.5 }, { ...victory, scoreVersion: SCORE_VERSION - 1 }]) {
      expect(validateScorePayload(bad).ok).toBe(false);
    }
  });
});
```
tests/screens.test.ts: in 'submits each Game Over run once…' extend the expected key list with `'wavesCompleted', 'outcome', 'siegeBossesDefeated'`.
Recipe:
1. types.ts: `import type { ResultProgress } from './progression.ts'`; `export interface GameResultPayload extends ResultProgress {…}`.
2. validation.ts: read wavesCompleted/outcome/siegeBossesDefeated from the body. Add to the existing plausibility block's entry condition that wavesCompleted is a safe integer <= highestWave. Inside it: count minimum duration and completedScheduledBosses for `waveNumber <= wavesCompleted` (was `< highestWave`); `completedWaves = wavesCompleted`; split the Game Over check into `if (highestWave < 1) errors.push('highestWave must be at least 1')` and `if (outcome === 'defeat' && possibleLeakLives < config.startingLives) errors.push('Wave progress cannot reach Game Over')`.
3. minimumNonBossKillsBeforeWave(wavesCompleted, remainingLives, difficulty, enemiesKilled, bossesKilled, completedScheduledBosses): loop completed waves = wavesCompleted; budget `config.startingLives - Math.max(1, remainingLives) + repairBudget`.
4. scoreFloor uses `wavesCompleted: payload.wavesCompleted`; scoreCeiling keeps its highestWave loops and uses wavesCompleted for countMilestoneRewards.
5. After the plausibility block (outside it) append `errors.push(...resultProgressErrors({ highestWave, wavesCompleted, outcome, siegeBossesDefeated } as ResultProgress, remainingLives as number, bossesKilled as number))` so earlier messages (e.g. 'enemiesKilled is too low for completed-wave survival') still appear.
6. Include the three fields in `value`.
7. GameOverScene: add the three fields to Data and to the payload literal in submit().
8. Do not edit artifacts/rebuild/backend/independent.test.ts or artifacts/rebuild/backend/boundary-probe.test.ts: their payloads lack the three new fields and T29 makes them progress-complete. On a fix-forward re-run where steps 1–7 are already in the working tree, only confirm them against this block and run Green and Verify.
Red:    `npm test -- tests/progression-results.test.ts` → fails: victory is rejected and value lacks wavesCompleted (first dispatch; on a fix-forward re-run with the edits already applied this command already passes)
Green:  `npm test -- tests/progression-results.test.ts` → all tests pass
Verify: `npm run typecheck` → no errors; `npm test -- tests/progression-results.test.ts tests/screens.test.ts tests/worker.test.ts tests/game.test.ts` → every listed file passes (game.test.ts and worker.test.ts assertions unchanged). The full `npm test` is not a T9 gate: artifacts/rebuild/backend/independent.test.ts still builds payloads without the new fields until T29, which runs the full suite.
Commit: Validate scores from explicit completion, outcome and milestones

### T29 — Make the archived backend boundary tests progress-complete (amends T9)   [x] done
Satisfies: AC-116, AC-117, AC-142
Depends on: T9
Lenses: contract
Router summary: Add the three new result fields (completed waves, outcome, boss milestones) to the score payloads built by the two archived backend boundary test files so each describes a real Hard loss, and give the late high-score loss zero lives as a defeat requires. Every plausibility assertion and test name stays as it is, so the full test suite is green again under the stricter score validation.
Files:
  - modify  artifacts/rebuild/backend/independent.test.ts    (payload() defaults and per-test overrides)
  - modify  artifacts/rebuild/backend/boundary-probe.test.ts (probe payload literal)
Consumes: T9 `validateScorePayload(body: unknown): ValidationResult & { value?: GameResultPayload }` — enters its plausibility block only when `wavesCompleted` is a safe integer <= highestWave (so 'enemiesKilled is too low for completed-wave survival' is only produced then), requires `outcome` in 'victory' | 'defeat' | 'siege-failed' and `siegeBossesDefeated` an integer 0–7, and appends T7 `resultProgressErrors(progress: ResultProgress, remainingLives: number, bossesKilled: number): string[]`; T7 rules (AC-142): a defeat requires remainingLives 0 and wavesCompleted = highestWave - 1; highestWave >= 11 requires bit 1; highestWave >= 31 requires bit 4; a bit may be set only once its wave (10/20/30) was entered; popcount(siegeBossesDefeated) <= bossesKilled; T1 `SIEGE_BOSS_BIT = { 10: 1, 20: 2, 30: 4 }`.
Produces: fixture objects only; no source behaviour change. After this task `npm test` passes in full.
Reuse: the existing `payload(overrides)` helper and per-test override objects in independent.test.ts; the existing validateScorePayload literal in boundary-probe.test.ts. No dependency added.
Tests (complete): edits only —
- artifacts/rebuild/backend/independent.test.ts `payload()` defaults: directly after `highestWave: 2,` add the lines `wavesCompleted: 1,`, `outcome: 'defeat',` and `siegeBossesDefeated: 0,` (a Hard loss at wave 2 with zero lives; every override inherits `outcome: 'defeat'`).
- 'rejects an implausible Hard wave-6 submission that credits kills with repairs', 'accepts a plausible Hard wave-6 loss after the wave-5 repair reward' and 'rejects a Hard wave-6 run requiring more repairs than the configured RNG tail permits': in each `payload({ … })` override add `wavesCompleted: 5,` directly after `highestWave: 6,`.
- 'rejects a forged wave-500 run with no kills, score, or elapsed time': add `wavesCompleted: 499,` and `siegeBossesDefeated: 7,` directly after `highestWave: 500,` (the forged run claims all three milestones; it stays rejected by bossesKilled 0 and plausibility).
- 'accepts a low-score late Hard loss with configured boss clears': add `wavesCompleted: 20,` and `siegeBossesDefeated: 3,` directly after `highestWave: 21,` (bits 1 and 2 for the two cleared bosses of waves 10 and 20; bossesKilled 2).
- 'accepts a high late score whose kills include scheduled spawns, boss summons, and bonus targets': a Hard loss at wave 36 is a defeat, which requires zero lives (positive lives at wave 36 matches no outcome under AC-142). In the `score({ … }, 'hard')` input change `remainingLives: 10,` to `remainingLives: 0,`; in the `payload({ … })` override change `remainingLives: 10,` to `remainingLives: 0,` and add `wavesCompleted: 35,` and `siegeBossesDefeated: 7,` directly after `highestWave: 36,` (bits 1, 2 and 4; bossesKilled 3). Zero lives only lowers finalScore and loosens the completed-wave survival bound, so the asserted acceptance, `bosses` 3 and kills beyond the scheduled count are unchanged.
- artifacts/rebuild/backend/boundary-probe.test.ts: in the `validateScorePayload({ … })` literal change `playerName: 'Probe', difficulty: 'hard', highestWave: 6, finalScore,` to `playerName: 'Probe', difficulty: 'hard', highestWave: 6, wavesCompleted: 5, outcome: 'defeat', siegeBossesDefeated: 0, finalScore,`.
- Change no `expect(...)` line, no test name and no other value in either file.
Recipe:
1. Apply exactly the edits above.
2. Edit nothing under src/, tests/ or elsewhere in artifacts/. If any test in either file still fails after the edits, stop and report the test name and its `result.errors`; do not loosen validation or change an assertion.
Red:    `npm test -- artifacts/rebuild/backend/independent.test.ts` → 6 failures (payloads lack wavesCompleted, outcome, siegeBossesDefeated): 'allows an early Hard loss at wave 2 with zero kills', 'rejects an implausible Hard wave-6 submission that credits kills with repairs' and 'rejects a Hard wave-6 run requiring more repairs than the configured RNG tail permits' (errors lack 'enemiesKilled is too low for completed-wave survival'), 'accepts a plausible Hard wave-6 loss after the wave-5 repair reward', 'accepts a low-score late Hard loss with configured boss clears', 'accepts a high late score whose kills include scheduled spawns, boss summons, and bonus targets'
Green:  `npm test -- artifacts/rebuild/backend/independent.test.ts` → all tests pass; `npm test -- artifacts/rebuild/backend/boundary-probe.test.ts` → passes
Verify: `npm run typecheck` → no errors; `npm test` → every file passes
Commit: Make archived backend boundary tests progress-complete

### T10 — New score era, additive migration and Worker progress columns (old Task 6)   [x] done
Satisfies: AC-110, AC-115, AC-116, AC-118, AC-143
Depends on: T9, T29
Lenses: data, contract
Router summary: Start a new score era by bumping the game and score versions, add three columns with legacy defaults through an additive database migration that deletes nothing, and make the server store and return completed waves, outcome and boss milestones on each leaderboard row.
Files:
  - create  migrations/0004_progression_results.sql
  - modify  worker/index.ts          (LEADERBOARD_SELECT, INSERT)
  - modify  tests/worker.test.ts     (makeDb bindings/queries/tie order; new tests)
  - modify  src/shared/version.ts    (GAME_VERSION '0.2.0', SCORE_VERSION 2)
  - modify  package.json             ("version": "0.2.0" only)
Consumes: T9 validated value with wavesCompleted, outcome, siegeBossesDefeated; T7 resultFixture.
Produces:
```sql
ALTER TABLE scores ADD COLUMN waves_completed INTEGER NOT NULL DEFAULT 0;
ALTER TABLE scores ADD COLUMN outcome TEXT NOT NULL DEFAULT 'defeat';
ALTER TABLE scores ADD COLUMN siege_bosses_defeated INTEGER NOT NULL DEFAULT 0;
```
LEADERBOARD_SELECT adds `waves_completed AS wavesCompleted, outcome, siege_bosses_defeated AS siegeBossesDefeated`; INSERT adds the three columns as ?12, ?13, ?14 bound to s.wavesCompleted, s.outcome, s.siegeBossesDefeated; era filter, ordering, 409 DUPLICATE_RUN unchanged.
Reuse: existing Worker structure, makeDb/req helpers.
Tests (complete): tests/worker.test.ts — in makeDb add `queries: [] as string[]` (push each prepared query), map `wavesCompleted: b[11], outcome: b[12], siegeBossesDefeated: b[13]` in run(), and append `|| String(a.createdAt).localeCompare(String(c.createdAt))` to both sorts. Add at top `import { resultFixture } from './helpers/progressionResult.ts';` and inside the describe:
```ts
  const post = (env: Env, body: unknown) => worker.fetch(req('/api/scores', { method: 'POST', headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': `ip-${Math.random()}` }, body: JSON.stringify(body) }), env);
  it('round-trips victory, siege failure and endless defeat with progress fields', async () => {
    const db = makeDb(), env = { DB: db } as unknown as Env;
    for (const body of [
      resultFixture({ highestWave: 30, wavesCompleted: 30, outcome: 'victory', siegeBossesDefeated: 7 }, 10, { runId: 'progress-victory-01' }),
      resultFixture({ highestWave: 10, wavesCompleted: 9, outcome: 'siege-failed', siegeBossesDefeated: 0 }, 15, { runId: 'progress-failed-01' }),
      resultFixture({ highestWave: 31, wavesCompleted: 30, outcome: 'defeat', siegeBossesDefeated: 7 }, 0, { runId: 'progress-endless-01' })
    ]) expect((await post(env, body)).status).toBe(201);
    expect(db.queries.some((q) => q.includes('waves_completed') && q.includes('siege_bosses_defeated') && q.startsWith('INSERT'))).toBe(true);
    const body = (await (await worker.fetch(req('/api/leaderboard?difficulty=medium'), env)).json()) as { scoreVersion: number; scores: Array<Record<string, unknown>> };
    expect(SCORE_VERSION).toBe(2); expect(body.scoreVersion).toBe(SCORE_VERSION);
    expect(body.scores.map((s) => [s.runId, s.highestWave, s.wavesCompleted, s.outcome, s.siegeBossesDefeated, s.scoreVersion])).toEqual([
      ['progress-endless-01', 31, 30, 'defeat', 7, 2], ['progress-victory-01', 30, 30, 'victory', 7, 2], ['progress-failed-01', 10, 9, 'siege-failed', 0, 2]
    ]);
  });
  it('rejects forged progress and legacy-era payloads', async () => {
    const env = { DB: makeDb() } as unknown as Env;
    const victory = resultFixture({ highestWave: 30, wavesCompleted: 30, outcome: 'victory', siegeBossesDefeated: 7 }, 10, { runId: 'progress-forged-01' });
    for (const body of [{ ...victory, siegeBossesDefeated: 3 }, { ...victory, wavesCompleted: 29 }, { ...victory, scoreVersion: 1 }, { ...victory, remainingLives: 0 }]) {
      expect((await post(env, body)).status).toBe(400);
    }
  });
```
Recipe:
1. Create the migration file with exactly the three statements.
2. Update worker/index.ts SELECT and INSERT as in Produces.
3. Bump versions in version.ts and package.json (no dependency edits).
Red:    `npm test -- tests/worker.test.ts` → fails: leaderboard rows lack wavesCompleted/outcome/siegeBossesDefeated and SCORE_VERSION is 1
Green:  `npm test -- tests/worker.test.ts` → all tests pass
Verify: `npm run typecheck` → no errors; `npm test` → every file passes; Manual (local SQL smoke, not a remote action): run migrateLocal `npm run db:migrate:local` → applies 0004_progression_results.sql without error; run `npx wrangler d1 execute aetherhold_scores --local --command "INSERT INTO scores (run_id, player_name, difficulty, highest_wave, final_score, game_version, score_version) VALUES ('legacy-smoke-0001','Legacy','medium',5,500,'0.1.0',1)"` then `npx wrangler d1 execute aetherhold_scores --local --command "SELECT waves_completed, outcome, siege_bosses_defeated FROM scores WHERE run_id='legacy-smoke-0001'"` → one row 0, defeat, 0
Commit: Start score era 2 with additive progress columns

### T11 — Current-era personal best and leaderboard row contract (old Task 6)   [x] done
Satisfies: AC-81, AC-90, AC-110, AC-143
Depends on: T10
Lenses: data
Router summary: Store the personal best for the new score era under a new local key and compare only current-era scores, keep the old personal-best record untouched and readable as a legacy record, and make the game's leaderboard reader require the new progress fields on each row.
Files:
  - modify  src/game/systems/Settings.ts
  - modify  src/api/leaderboardClient.ts   (isScoreRecord)
  - create  tests/personal-best.test.ts
  - create  tests/leaderboard-client.test.ts
Consumes: T10 SCORE_VERSION (2); T9 ScoreRecord (extends the progress fields).
Produces:
```ts
export interface LocalBest { score: number; wave: number; difficulty: string; date: string; scoreVersion: number; }
export function loadBest(): LocalBest | null;            // key 'aetherhold-best-score-v2', only when scoreVersion === SCORE_VERSION and score finite
export function saveBest(b: Omit<LocalBest, 'scoreVersion'>): void; // writes v2 with SCORE_VERSION when no current best or higher; never writes 'aetherhold-best-v1'
export function loadLegacyBest(): LocalBest | null;      // read-only 'aetherhold-best-v1'; missing scoreVersion → 1
// isScoreRecord additionally requires: wavesCompleted integer 0..highestWave; outcome in victory|defeat|siege-failed; siegeBossesDefeated integer 0..7
```
Reuse: existing Settings parse pattern (try/catch, JSON.parse); isIntegerInRange in leaderboardClient.ts.
Tests (complete): tests/personal-best.test.ts
```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadBest, loadLegacyBest, saveBest } from '../src/game/systems/Settings.ts';
import { SCORE_VERSION } from '../src/shared/version.ts';

let storage: Map<string, string>;
beforeEach(() => { storage = new Map(); vi.stubGlobal('localStorage', { getItem: (k: string) => storage.get(k) ?? null, setItem: (k: string, v: string) => { storage.set(k, v); } }); });
afterEach(() => vi.unstubAllGlobals());
const best = (score: number) => ({ score, wave: 3, difficulty: 'medium', date: '2026-10-08T00:00:00.000Z' });

describe('score-era personal best', () => {
  it('keeps the legacy best byte-for-byte and compares only current-era scores', () => {
    const legacy = JSON.stringify({ score: 100000, wave: 40, difficulty: 'hard', date: '2026-01-01T00:00:00.000Z' });
    storage.set('aetherhold-best-v1', legacy);
    expect(loadBest()).toBeNull();
    expect(loadLegacyBest()).toMatchObject({ score: 100000, scoreVersion: 1 });
    saveBest(best(100)); expect(loadBest()).toMatchObject({ score: 100, scoreVersion: SCORE_VERSION });
    saveBest(best(50)); expect(loadBest()?.score).toBe(100);
    saveBest(best(150)); expect(loadBest()?.score).toBe(150);
    expect(storage.get('aetherhold-best-v1')).toBe(legacy);
    expect(JSON.parse(storage.get('aetherhold-best-score-v2')!)).toMatchObject({ score: 150, scoreVersion: SCORE_VERSION });
    expect(storage.has('aetherhold-settings-v1')).toBe(false);
  });
  it('treats malformed or other-era current records as absent', () => {
    storage.set('aetherhold-best-score-v2', '{broken'); expect(loadBest()).toBeNull();
    storage.set('aetherhold-best-score-v2', JSON.stringify({ ...best(5), scoreVersion: SCORE_VERSION + 1 })); expect(loadBest()).toBeNull();
    expect(loadLegacyBest()).toBeNull();
  });
});
```
tests/leaderboard-client.test.ts
```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchLeaderboard } from '../src/api/leaderboardClient.ts';
import { GAME_VERSION, SCORE_VERSION } from '../src/shared/version.ts';

const row = { id: 1, playerName: 'Aria', difficulty: 'medium', highestWave: 30, finalScore: 90000, enemiesKilled: 2000, bossesKilled: 3, remainingLives: 10, gameDurationSeconds: 1500, runId: 'progress-row-0001', gameVersion: GAME_VERSION, scoreVersion: SCORE_VERSION, createdAt: '2026-10-08T00:00:00.000Z', wavesCompleted: 30, outcome: 'victory', siegeBossesDefeated: 7 };
const respond = (scores: unknown[]) => vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ scores, scoreVersion: SCORE_VERSION }), { status: 200 })));
afterEach(() => vi.unstubAllGlobals());

describe('leaderboard row contract', () => {
  it('accepts rows carrying the progress fields', async () => { respond([row]); await expect(fetchLeaderboard()).resolves.toEqual({ ok: true, scores: [row] }); });
  it.each([['missing outcome', { ...row, outcome: undefined }], ['unknown outcome', { ...row, outcome: 'won' }], ['completion above highest wave', { ...row, wavesCompleted: 31 }], ['mask out of range', { ...row, siegeBossesDefeated: 8 }], ['fractional completion', { ...row, wavesCompleted: 29.5 }]] as const)('rejects %s', async (_name, bad) => {
    respond([bad]); await expect(fetchLeaderboard()).resolves.toEqual({ ok: false, message: 'Leaderboard returned malformed score data.' });
  });
});
```
Recipe:
1. Settings.ts: BEST_KEY becomes 'aetherhold-best-score-v2', add LEGACY_BEST_KEY 'aetherhold-best-v1'; import SCORE_VERSION; implement Produces with defensive parsing; existing callers keep working (they pass four fields).
2. leaderboardClient.ts isScoreRecord: add the three checks.
Red:    `npm test -- tests/personal-best.test.ts` → fails: loadLegacyBest is not exported and saveBest writes aetherhold-best-v1
Green:  `npm test -- tests/personal-best.test.ts` and `npm test -- tests/leaderboard-client.test.ts` → all pass
Verify: `npm run typecheck` → no errors; `npm test` → every file passes
Commit: Separate current-era personal best and validate progress rows

### T12 — Scene run setup and purchase transactions (old Task 7)   [x] done
Satisfies: AC-6, AC-16, AC-17, AC-18, AC-19, AC-20, AC-24, AC-25, AC-26, AC-27, AC-50, AC-71
Depends on: T2, T3, T4, T5
Lenses: contract
Router summary: Give each run its siege state, combat engine and frozen unlock snapshot, and route tower upgrades and evolutions through the purchase function with the selected tower's identity and version, so stale or repeated clicks never charge twice and nothing is bought, built or sold while paused, in the victory decision or after the run ends. Selling refunds seventy percent of recorded spend.
Files:
  - modify  src/game/scenes/GameScene.ts
  - modify  src/game/entities/Tower.ts          (remove the temporary level setter)
  - modify  tests/evolution-system.test.ts       (Tower test no longer assigns level)
  - create  tests/scene-purchases.test.ts
Consumes: T2 purchaseEvolution, investedRefund, PURCHASE_REASON_TEXT, PurchaseIntent, PurchaseContext; T3 EvolutionCombat (removeOwner, clear); T4 `unlockRepository`, UnlockRepository.snapshotForRun; T5 SiegeSystem (phase, evolutionOpen, bossKilled); existing GameScene `upgradeSelected` (1123), `sellSelected` (1147), `tryBuild` (1087), `init` (224), `shutdownRun` (480), labels at 385, 1052, 1084.
Produces (GameScene private members):
```ts
private siege = new SiegeSystem();
private evolutionCombat = new EvolutionCombat();
private unlockRepository: UnlockRepository = sharedUnlockRepository; // import { unlockRepository as sharedUnlockRepository }
private runUnlocks: ReadonlySet<BranchId> = new Set();
private unlocksEarnedThisRun: BranchId[] = [];
private debugAssisted = false;
private isRunBlocked(): boolean; // ended || pauseState.blocked || siege.phase is 'victory' or 'terminal'
private purchaseContext(): PurchaseContext; // { gold, evolutionOpen: siege.evolutionOpen, endless: siege.phase === 'endless', blocked: isRunBlocked(), unlocked: runUnlocks }
private purchaseSelected(intent: PurchaseIntent, expectedTowerId: number, expectedRevision: number): void;
private refreshTowerVisual(tower: Tower): void; // rebuild via buildTowerVisual (body moved from upgradeSelected lines 1136-1142)
```
Reuse: existing upgrade visual rebuild code; floatText/showBanner feedback.
Tests (complete): tests/evolution-system.test.ts — in 'lets a Tower read level and stats from its progression' replace the two lines `t.level = 3;` and the following `expect(t.progression).toMatchObject(...)` with:
```ts
    t.progression = { ...t.progression, foundationLevel: 3, invested: towerTotalInvested('longbow', 3) };
    expect([t.level, t.stats.damage]).toEqual([3, TOWERS.longbow.levels[2].damage]);
```
tests/scene-purchases.test.ts
```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameScene } from '../src/game/scenes/GameScene.ts';
import { Tower } from '../src/game/entities/Tower.ts';
import { SoundManager } from '../src/game/systems/SoundManager.ts';
import type { PauseState } from '../src/game/systems/PauseState.ts';
import type { SiegeSystem } from '../src/game/systems/SiegeSystem.ts';
import type { EvolutionCombat } from '../src/game/systems/EvolutionCombat.ts';
import type { PurchaseIntent } from '../src/game/systems/EvolutionSystem.ts';
import type { BranchId } from '../src/shared/progression.ts';

vi.mock('phaser', () => ({ default: { Scene: class { constructor(_key?: string) {} }, Scenes: { Events: { SHUTDOWN: 'shutdown' } }, Scale: { Events: { RESIZE: 'resize' } } } }));
function anyStub(): any {
  const proxy: any = new Proxy(function () { return proxy; }, { get: (_t, key) => (key === 'then' ? undefined : key === Symbol.toPrimitive ? () => 0 : proxy), apply: () => proxy });
  return proxy;
}
interface Run {
  gold: number; waveActive: boolean; ended: boolean; towers: Tower[]; selectedTower: Tower | null; occupied: Set<number>;
  siege: SiegeSystem; evolutionCombat: EvolutionCombat; runUnlocks: ReadonlySet<BranchId>; pauseState: PauseState;
  floatText: ReturnType<typeof vi.fn>; showBanner: ReturnType<typeof vi.fn>;
  purchaseSelected(intent: PurchaseIntent, towerId: number, revision: number): void; upgradeSelected(): void; sellSelected(): void; tryBuild(id: string, plot: number): void;
}
const PRESENTATION = ['updateHUD', 'refreshInfoPanel', 'drawSheet', 'drawPowerupBar', 'refreshPlots', 'refreshPlacePanel', 'hideGhost', 'floatTextForEnemy', 'drawCatalog', 'refreshTowerVisual', 'updateNextPreview'];
function sceneFixture() {
  vi.spyOn(SoundManager, 'get').mockReturnValue(anyStub());
  const scene = new GameScene(); scene.init({ difficulty: 'medium', playerName: 'Test Warden' });
  const run = scene as unknown as Run, loose = scene as unknown as Record<string, unknown>;
  for (const name of PRESENTATION) loose[name] = () => {};
  run.floatText = vi.fn(); run.showBanner = vi.fn();
  const tower = new Tower('longbow', 100, 100, 0);
  tower.progression = { ...tower.progression, foundationLevel: 4, invested: 710 };
  run.towers = [tower]; run.selectedTower = tower; run.occupied = new Set([0]); run.gold = 2000;
  run.siege.bossKilled(10); run.runUnlocks = new Set<BranchId>();
  return { scene, run, tower };
}
afterEach(() => vi.restoreAllMocks());

describe('scene purchase transactions', () => {
  it('commits an evolution once and ignores the repeated stale action', () => {
    const { run, tower } = sceneFixture();
    run.purchaseSelected({ kind: 'evolve', branchId: 'marksman' }, tower.id, 0);
    expect(run.gold).toBe(1490);
    expect(tower.progression).toMatchObject({ branchId: 'marksman', rank: 0, invested: 1220, revision: 1 });
    run.purchaseSelected({ kind: 'evolve', branchId: 'marksman' }, tower.id, 0);
    expect([run.gold, tower.progression.revision]).toEqual([1490, 1]);
  });
  it('blocks purchases in victory, terminal, every pause reason and after the end', () => {
    const { run, tower } = sceneFixture(), before = structuredClone(tower.progression);
    const attempt = () => run.purchaseSelected({ kind: 'evolve', branchId: 'marksman' }, tower.id, 0);
    run.siege.phase = 'victory'; attempt(); run.siege.phase = 'terminal'; attempt(); run.siege.phase = 'siege';
    for (const reason of ['user', 'modal', 'background'] as const) { run.pauseState.set(reason, true); attempt(); run.pauseState.set(reason, false); }
    run.ended = true; attempt();
    expect(tower.progression).toEqual(before); expect(run.gold).toBe(2000);
  });
  it('allows purchases during an active wave', () => {
    const { run, tower } = sceneFixture(); run.waveActive = true;
    run.purchaseSelected({ kind: 'evolve', branchId: 'marksman' }, tower.id, 0);
    expect(tower.progression.branchId).toBe('marksman');
  });
  it('rejects an action prepared for another tower and explains failures', () => {
    const { run, tower } = sceneFixture();
    run.purchaseSelected({ kind: 'evolve', branchId: 'marksman' }, tower.id + 1000, 0);
    expect(run.showBanner).toHaveBeenCalledWith('Tower changed; try again', expect.any(String));
    run.gold = 100; run.purchaseSelected({ kind: 'evolve', branchId: 'marksman' }, tower.id, 0);
    expect(run.floatText).toHaveBeenCalledWith(100, 70, 'Not enough gold', expect.any(String));
    expect(tower.progression.branchId).toBe(null);
  });
  it('routes foundation upgrades through the transaction', () => {
    const { run } = sceneFixture(), fresh = new Tower('longbow', 200, 200, 1);
    run.towers.push(fresh); run.selectedTower = fresh; run.upgradeSelected();
    expect([fresh.level, fresh.progression.invested, run.gold]).toEqual([2, 190, 1910]);
  });
  it('resets the hit counter only on first evolution and keeps cooldown, targeting and position', () => {
    const { run, tower } = sceneFixture();
    tower.counter.successes = 3; tower.cooldown = 0.5; tower.targeting = 'strongest';
    run.purchaseSelected({ kind: 'evolve', branchId: 'marksman' }, tower.id, 0);
    expect(tower.counter.successes).toBe(0);
    expect([tower.x, tower.y, tower.cooldown, tower.targeting]).toEqual([100, 100, 0.5, 'strongest']);
    tower.counter.successes = 2; run.purchaseSelected({ kind: 'evolution-rank' }, tower.id, 1);
    expect([tower.counter.successes, tower.progression.rank]).toEqual([2, 1]);
  });
  it('sells for 70% of recorded spend and removes the owner field', () => {
    const { run, tower } = sceneFixture();
    run.purchaseSelected({ kind: 'evolve', branchId: 'marksman' }, tower.id, 0);
    const remove = vi.spyOn(run.evolutionCombat, 'removeOwner');
    run.sellSelected();
    expect(run.gold).toBe(1490 + 854); expect(run.towers).toHaveLength(0); expect(remove).toHaveBeenCalledWith(tower.id);
  });
  it('rejects building and selling while blocked', () => {
    const { run } = sceneFixture(); run.siege.phase = 'victory';
    run.tryBuild('longbow', 1); run.sellSelected();
    expect([run.towers.length, run.gold]).toEqual([1, 2000]);
  });
  it('restarts with fresh run development', () => {
    const { scene, run } = sceneFixture(); run.siege.phase = 'endless';
    scene.init({ difficulty: 'medium' });
    expect([run.towers.length, run.gold, run.siege.phase, run.siege.evolutionOpen, run.evolutionCombat.activeFieldCount]).toEqual([0, 600, 'siege', false, 0]);
  });
});
```
Recipe:
1. Imports: SiegeSystem, EvolutionCombat, purchaseEvolution/investedRefund/PURCHASE_REASON_TEXT and types, `unlockRepository as sharedUnlockRepository` and UnlockRepository, BranchId.
2. init(): `this.siege = new SiegeSystem(); this.evolutionCombat = new EvolutionCombat(); this.runUnlocks = this.unlockRepository.snapshotForRun(); this.unlocksEarnedThisRun = []; this.debugAssisted = false;`. shutdownRun(): `this.evolutionCombat.clear()`.
3. purchaseSelected kernel:
```ts
const tower = this.selectedTower;
if (!tower || tower.id !== expectedTowerId || !this.towers.includes(tower)) { this.showBanner(PURCHASE_REASON_TEXT['stale action'], C.dangerBright); return; }
const result = purchaseEvolution(tower.towerId, tower.progression, intent, this.purchaseContext(), expectedRevision);
if (!result.ok) { this.floatText(tower.x, tower.y - 30, PURCHASE_REASON_TEXT[result.reason], C.dangerBright); return; }
const evolved = tower.progression.branchId === null && result.state.branchId !== null;
this.gold = result.gold; tower.progression = result.state;
if (evolved) tower.counter = { successes: 0 };
```
   then SoundManager upgrade sound, floatText `-${cost} gold`, refreshTowerVisual(tower), refreshInfoPanel(), updateHUD(). Never touch cooldown, targeting or position.
4. upgradeSelected(): `const t = this.selectedTower; if (t) this.purchaseSelected({ kind: 'foundation-upgrade' }, t.id, t.progression.revision);`
5. tryBuild and sellSelected return immediately when isRunBlocked(). sellSelected refunds investedRefund(t.progression) and calls `this.evolutionCombat.removeOwner(t.id)` before removing the tower. Sell labels at lines 385, 1052, 1084 use investedRefund(t.progression).
6. Tower.ts: delete the temporary setter (level is getter-only).
Red:    `npm test -- tests/scene-purchases.test.ts` → fails: purchaseSelected is not a function
Green:  `npm test -- tests/scene-purchases.test.ts` → all tests pass
Verify: `npm run typecheck` → no errors; `npm test` → every file passes
Commit: Route scene purchases through atomic evolution transactions

### T13 — Scene combat through shot snapshots and the combat engine (old Task 7)   [x] done
Satisfies: AC-24, AC-27, AC-28, AC-34, AC-36, AC-41, AC-42, AC-44, AC-46, AC-48, AC-49, AC-50, AC-52, AC-53, AC-54, AC-55, AC-56, AC-59, AC-61
Depends on: T3, T12
Lenses: performance
Router summary: Make every tower shot carry a frozen snapshot from firing, send all tower, field and relic damage through the combat engine once, give Volley three distinct arrows, keep chain falloff of 0.85 per jump and 0.75 on secondary hits within each branch's chain limit, count fifth-hit effects on primary hits only, process burning-field ticks each frame, and let slows, freezes and stuns drive enemy movement.
Files:
  - modify  src/game/scenes/GameScene.ts
  - modify  src/game/entities/Enemy.ts      (effectiveSpeed status parameter)
  - modify  tests/qa.test.ts                ('uses physical flight duration…' test, new fireProjectile signature)
  - create  tests/scene-combat.test.ts
Consumes: T3 EvolutionCombat.makeShot/damage/primaryHit/statuses/addField/tickFields/removeEnemy/activeFieldCount, volleyTargets, nextChainTarget, chainShot, StatusView; T1 ShotSnapshot; T12 evolutionCombat field; existing GameScene Flight (35-43), fireProjectile (1599), updateFlights (1656), chain limit `if (st.chainCount && flight.chainIndex + 1 < st.chainCount)` (1682), damageEnemy (1778), killEnemy (1787), tower loop (1959-1986), wave-clear (1989), movement (1859-1938); POWERUP_EFFECTS.surge/overcharge.
Produces:
```ts
// Enemy: effectiveSpeed(nowMs: number, globalFreeze: number, status?: StatusView): number
//   0 if frozen/stunned or nowMs < globalFreeze or nowMs < frozenUntil; else baseSpeed * (1 - (status ? status.slowFactor : nowMs < slowUntil ? slowFactor : 0))
interface Flight { elapsedMs; durationMs; x1; y1; x2; y2; towerId: string; targetId: number; shot: ShotSnapshot; view: Phaser.GameObjects.Container; chainIndex: number; hit: Set<number>; }
private fireProjectile(x1: number, y1: number, enemy: Enemy, shot: ShotSnapshot, chainIndex = 0, hit = new Set<number>(), visualStart?: { x: number; y: number }): void;
private fireTowers(dt: number): void;          // extracted tower loop
private processFieldTicks(): void;             // called right after updateFlights in update()
private damageEnemy(e: Enemy, raw: number, type: DamageType, shot?: ShotSnapshot): number;
```
Reuse: existing projectile visuals and flight stepping (advanceFlights), pickTarget, killEnemy reward path, tempo multiplier.
Tests (complete): tests/qa.test.ts — add imports `import { Tower } from '../src/game/entities/Tower.ts'; import type { EvolutionCombat } from '../src/game/systems/EvolutionCombat.ts'; import type { ShotSnapshot } from '../src/shared/progression.ts';` and replace the body of 'uses physical flight duration even when the rendered chain origin differs' with:
```ts
    const scene = new GameScene(); scene.init({ difficulty: 'medium' });
    const view = { setDepth() { return this; }, add: vi.fn() };
    const run = scene as unknown as {
      add: { container: ReturnType<typeof vi.fn>; circle: ReturnType<typeof vi.fn> }; world: (value: unknown) => unknown; evolutionCombat: EvolutionCombat;
      fireProjectile(x: number, y: number, enemy: Enemy, shot: ShotSnapshot, chain: number, hit: Set<number>, visualOrigin: { x: number; y: number }): void;
      flights: Array<{ durationMs: number; x1: number; y1: number }>;
    };
    run.add = { container: vi.fn(() => view), circle: vi.fn(() => ({})) }; run.world = (value) => value;
    const tempest = new Tower('tempest', 100, 200, 0);
    const enemy = new Enemy('thornling', 60, 70, 8); enemy.x = 400; enemy.y = 200;
    run.fireProjectile(100, 200, enemy, run.evolutionCombat.makeShot(tempest, [tempest], 1), 1, new Set(), { x: 120, y: 170 });
    expect(run.flights[0].durationMs).toBeCloseTo(300 / 430 * 1000);
    expect(run.flights[0]).toMatchObject({ x1: 120, y1: 170 });
```
tests/scene-combat.test.ts
```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameScene } from '../src/game/scenes/GameScene.ts';
import { Tower } from '../src/game/entities/Tower.ts';
import { Enemy } from '../src/game/entities/Enemy.ts';
import { SoundManager } from '../src/game/systems/SoundManager.ts';
import type { EvolutionCombat } from '../src/game/systems/EvolutionCombat.ts';
import type { BranchId, EvolutionRank, ShotSnapshot, TowerId } from '../src/shared/progression.ts';
import type { DamageType } from '../src/shared/types.ts';

vi.mock('phaser', () => ({ default: { Scene: class { constructor(_key?: string) {} }, Scenes: { Events: { SHUTDOWN: 'shutdown' } }, Scale: { Events: { RESIZE: 'resize' } } } }));
function anyStub(): any {
  const proxy: any = new Proxy(function () { return proxy; }, { get: (_t, key) => (key === 'then' ? undefined : key === Symbol.toPrimitive ? () => 0 : proxy), apply: () => proxy });
  return proxy;
}
interface FlightLike { elapsedMs: number; durationMs: number; x1: number; y1: number; x2: number; y2: number; towerId: string; targetId: number; shot: ShotSnapshot; view: unknown; chainIndex: number; hit: Set<number>; }
interface Run {
  towers: Tower[]; enemies: Enemy[]; flights: FlightLike[]; gameTimeMs: number; gold: number; enemiesKilled: number; surgeUntil: number; evolutionCombat: EvolutionCombat;
  damageEnemy(e: Enemy, raw: number, type: DamageType, shot?: ShotSnapshot): number; updateFlights(deltaMs: number): void; processFieldTicks(): void; fireTowers(dt: number): void;
  fireProjectile: (...args: unknown[]) => void;
}
const PRESENTATION = ['updateHUD', 'floatText', 'floatTextForEnemy', 'impactAt', 'impactBurst', 'startDeathAnim', 'drawPowerupBar', 'presentReward', 'addEffect', 'drawTempestArc'];
function sceneFixture() {
  vi.spyOn(SoundManager, 'get').mockReturnValue(anyStub());
  const scene = new GameScene(); scene.init({ difficulty: 'medium' });
  const run = scene as unknown as Run, loose = scene as unknown as Record<string, unknown>;
  for (const name of PRESENTATION) loose[name] = () => {};
  loose.add = anyStub(); loose.world = (value: unknown) => value;
  return run;
}
function evolved(towerId: TowerId, branchId: BranchId | null, rank: EvolutionRank = 0): Tower {
  const t = new Tower(towerId, 0, 0, 0);
  t.progression = { ...t.progression, foundationLevel: 4, branchId, rank: branchId ? rank : null };
  return t;
}
const enemyAt = (x: number, y: number, hp = 100000) => { const e = new Enemy('thornling', hp, 50, 8); e.x = x; e.y = y; return e; };
const flightFor = (shot: ShotSnapshot, enemy: Enemy, chainIndex = 0, hit = new Set<number>()): FlightLike => ({ elapsedMs: 1, durationMs: 1, x1: 0, y1: 0, x2: enemy.x, y2: enemy.y, towerId: shot.towerId, targetId: enemy.id, shot, view: anyStub(), chainIndex, hit });
const neutral = { slowFactor: 0, frozen: false, stunned: false, vulnerability: 1 };
afterEach(() => vi.restoreAllMocks());

describe('scene combat', () => {
  it('routes damage through penetration once; relic damage stays neutral', () => {
    const run = sceneFixture(), owner = evolved('ember', 'siegebreaker'), e = enemyAt(0, 0); e.physicalArmor = 0.55;
    expect(run.damageEnemy(e, 100, 'physical', run.evolutionCombat.makeShot(owner, [owner], 1))).toBe(73);
    expect(run.damageEnemy(e, 100, 'physical')).toBe(45);
  });
  it('counts living primary impacts and freezes movement on the fifth Winterguard hit', () => {
    const run = sceneFixture(), frost = evolved('glacier', 'winterguard'), e = enemyAt(10, 10);
    run.towers = [frost]; run.enemies = [e];
    for (let n = 0; n < 5; n++) { run.flights.push(flightFor(run.evolutionCombat.makeShot(frost, run.towers, 1), e)); run.updateFlights(0); }
    expect(frost.counter.successes).toBe(5);
    const status = run.evolutionCombat.statuses(e.id, run.gameTimeMs);
    expect(status.frozen).toBe(true); expect(e.effectiveSpeed(run.gameTimeMs, 0, status)).toBe(0);
  });
  it('chains with x0.85 per jump and x0.75 per secondary impact without repeats', () => {
    const run = sceneFixture(), storm = evolved('tempest', 'stormcaller'), a = enemyAt(100, 100), b = enemyAt(150, 100);
    run.towers = [storm]; run.enemies = [a, b];
    const fire = vi.fn(); run.fireProjectile = fire;
    const damage = vi.spyOn(run, 'damageEnemy'), shot = run.evolutionCombat.makeShot(storm, [storm], 1);
    run.flights.push(flightFor(shot, a)); run.updateFlights(0);
    expect(damage).toHaveBeenCalledWith(a, shot.rawDamage, 'elemental', shot);
    const [, , next, nextShot, chainIndex, hit] = fire.mock.calls[0] as [number, number, Enemy, ShotSnapshot, number, Set<number>];
    expect([next, chainIndex, nextShot.primary, hit.has(a.id)]).toEqual([b, 1, false, true]);
    expect(nextShot.rawDamage).toBeCloseTo(shot.rawDamage * 0.85);
    damage.mockClear();
    run.flights.push(flightFor(nextShot, b, 1, new Set([a.id]))); run.updateFlights(0);
    expect(damage).toHaveBeenCalledWith(b, nextShot.rawDamage * 0.75, 'elemental', nextShot);
    expect(fire).toHaveBeenCalledTimes(1); expect(storm.counter.successes).toBe(1);
  });
  it('stops a Thunderlord chain after its third victim using the snapshot chain limit', () => {
    const run = sceneFixture(), lord = evolved('tempest', 'thunderlord');
    const [a, b, c, d] = [100, 150, 200, 250].map((x) => enemyAt(x, 100));
    run.towers = [lord]; run.enemies = [a, b, c, d];
    const fire = vi.fn(); run.fireProjectile = fire;
    const shot = run.evolutionCombat.makeShot(lord, [lord], 1);
    expect(shot.stats.chainCount).toBe(3);
    run.flights.push(flightFor({ ...shot, primary: false }, b, 1, new Set([a.id]))); run.updateFlights(0);
    expect(fire).toHaveBeenCalledTimes(1); expect(fire.mock.calls[0][2]).toBe(c);
    run.flights.push(flightFor({ ...shot, primary: false }, c, 2, new Set([a.id, b.id]))); run.updateFlights(0);
    expect(fire).toHaveBeenCalledTimes(1);
  });
  it('keeps the fired snapshot after a sale and creates fields only for a live owner', () => {
    const run = sceneFixture(), mortar = evolved('ember', 'flame-mortar'), e = enemyAt(300, 300);
    run.towers = [mortar]; run.enemies = [e];
    const shot = run.evolutionCombat.makeShot(mortar, run.towers, 1), damage = vi.spyOn(run, 'damageEnemy');
    run.towers = []; run.flights.push(flightFor(shot, e)); run.updateFlights(0);
    expect(damage).toHaveBeenCalledWith(e, shot.rawDamage, 'physical', shot);
    expect(run.evolutionCombat.activeFieldCount).toBe(0);
    run.towers = [mortar]; run.flights.push(flightFor(shot, e)); run.updateFlights(0);
    expect(run.evolutionCombat.activeFieldCount).toBe(1);
  });
  it('processes overlapping field ticks with one death reward and forgets the enemy', () => {
    const run = sceneFixture(), mortar = evolved('ember', 'flame-mortar'), e = enemyAt(0, 0, 1);
    run.enemies = [e];
    const shot = run.evolutionCombat.makeShot(mortar, [mortar], 1);
    run.evolutionCombat.addField(shot, 0, 0, 0); run.evolutionCombat.addField({ ...shot, ownerId: 99 }, 0, 0, 0);
    run.gameTimeMs = 500; const gold = run.gold;
    run.processFieldTicks();
    expect([run.enemiesKilled, e.alive, run.gold]).toEqual([1, false, gold + 8]);
    expect(run.evolutionCombat.statuses(e.id, 500)).toEqual(neutral);
  });
  it('fires Volley at three distinct enemies with one snapshot and surge applied once', () => {
    const run = sceneFixture(), volley = evolved('longbow', 'volley');
    run.towers = [volley];
    run.enemies = [1, 2, 3, 4].map((n) => { const e = enemyAt(n * 10, 0); e.distanceTraveled = n; return e; });
    const fire = vi.fn(); run.fireProjectile = fire; run.surgeUntil = run.gameTimeMs + 1000;
    run.fireTowers(0.016);
    expect(fire).toHaveBeenCalledTimes(3);
    expect(new Set(fire.mock.calls.map((c) => (c[2] as Enemy).id)).size).toBe(3);
    expect(fire.mock.calls[0][3]).toBe(fire.mock.calls[1][3]);
    expect((fire.mock.calls[0][3] as ShotSnapshot).rawDamage).toBe(Math.round(volley.stats.damage * 1.5));
  });
  it('lets statuses drive speed while Time Lock stays independent', () => {
    const e = new Enemy('thornling', 10, 100, 1);
    expect(e.effectiveSpeed(0, 0)).toBe(100);
    expect(e.effectiveSpeed(0, 0, { ...neutral, slowFactor: 0.3 })).toBeCloseTo(70);
    expect(e.effectiveSpeed(0, 0, { ...neutral, stunned: true })).toBe(0);
    expect(e.effectiveSpeed(0, 500, neutral)).toBe(0);
    e.slowUntil = 100; e.slowFactor = 0.5; expect(e.effectiveSpeed(0, 0)).toBe(50);
  });
});
```
Recipe:
1. Enemy.effectiveSpeed as in Produces.
2. Flight: replace `damage` and `stats` with `shot`; fireProjectile takes the shot (towerId = shot.towerId); visuals unchanged.
3. fireTowers(dt) holds the old tower loop: multiplier = (surge active ? POWERUP_EFFECTS.surge.damageMultiplier : 1) × (overcharge active ? POWERUP_EFFECTS.overcharge.damageMultiplier : 1); after pickTarget, `const shot = this.evolutionCombat.makeShot(t, this.towers, multiplier)`; interval from shot.stats.attackInterval × tempo; targets = volleyTargets > 1 ? volleyTargets(this.enemies, t, shot.stats, t.targeting) : [enemy]; fireProjectile once per target with the same shot.
4. Impact (updateFlights): splash → damageEnemy(each alive enemy in radius, shot.rawDamage, type, shot), then primaryHit for the target when it was alive before the blast (killed = !target.alive), then addField(shot, target.x, target.y, gameTimeMs) only if `this.towers.some(t => t.id === shot.ownerId)`; single target → `wasAlive`; damageEnemy(target, chainIndex ? shot.rawDamage * 0.75 : shot.rawDamage, type, shot); when shot.primary call primaryHit(shot, target, now, !target.alive); chain: keep the existing limit from GameScene.ts:1682, now read from the snapshot — continue only when `shot.stats.chainCount && flight.chainIndex + 1 < shot.stats.chainCount` (Stormcaller 9–12 victims, Thunderlord 3, foundation Tempest unchanged); inside it hit.add(target.id), next = nextChainTarget(this.enemies, target, hit), and when next exists draw the existing arc and fireProjectile(target.x, target.y, next, chainShot(shot), chainIndex + 1, hit, point). Remove the old slowUntil/slowFactor assignment.
5. damageEnemy: `const dealt = this.evolutionCombat.damage(raw, type, e, this.gameTimeMs, shot)`.
6. processFieldTicks: for each tick, damage every alive enemy within tick.radius once with (tick.rawDamage, 'elemental') and no shot. Call after updateFlights.
7. Movement: `const status = this.evolutionCombat.statuses(e.id, this.gameTimeMs)`, pass to effectiveSpeed; frozen visuals include status.frozen || status.stunned; slowed = status.slowFactor > 0. Regen and boss clocks untouched.
8. evolutionCombat.removeEnemy(e.id) in killEnemy and on leak. Add `&& this.evolutionCombat.activeFieldCount === 0` to the wave-clear condition.
Red:    `npm test -- tests/scene-combat.test.ts` → fails: fireTowers/processFieldTicks are not functions and damage ignores the shot
Green:  `npm test -- tests/scene-combat.test.ts` → all tests pass
Verify: `npm run typecheck` → no errors; `npm test` → every file passes
Commit: Drive scene combat through snapshots and the combat engine

### T14 — Scene siege lifecycle, victory decision and discarded runs (old Task 7)   [x] done
Satisfies: AC-1, AC-4, AC-9, AC-10, AC-11, AC-19, AC-47, AC-71, AC-91, AC-92, AC-93, AC-94, AC-95, AC-96, AC-97, AC-98, AC-100, AC-101, AC-102, AC-103, AC-105, AC-106, AC-108, AC-109, AC-112, AC-113, AC-120, AC-140, AC-141
Depends on: T5, T6, T12, T13
Lenses: contract
Router summary: Connect the siege state machine to the game: track the scheduled boss of waves ten, twenty and thirty, open evolution when the wave-ten boss dies, end as a siege failure when a required boss escapes with lives left, declare victory only after wave thirty fully clears, show a non-blocking victory panel with Finish Run and Continue Endless while Pause stays reachable, and create a terminal result only for defeat, siege failure or Finish Run.
Files:
  - modify  src/game/scenes/GameScene.ts
  - create  tests/scene-siege.test.ts
Consumes: T5 SiegeSystem (startWave, bossKilled, bossEscaped, completeWave, choose, fail, progress, seedForQA, phase), victoryRewardsResolved; T12 isRunBlocked, evolutionCombat; T13 activeFieldCount; existing GameScene update (1843), spawnEnemy (1252), killEnemy (1787), startNextWave (1166) with its guard `if (this.ended || this.waveActive || this.paused || this.pausedByModal || this.pendingMeteor || this.vault.pending.length) return;` (1167), selectBattlefield (164), togglePauseMenu (932), closeModal (991), drawShell (461), presentReward (1350), handleQAAction seeds (541-576), gameOver (2018).
Produces:
```ts
private scheduledBossIds = new Map<number, number>();     // enemy id → wave 10/20/30
private victoryPanel: Phaser.GameObjects.Container | null = null;
private spawnEnemy(enemyId: EnemyArchetype, hpBonus: number): Enemy; // now returns the enemy
private handleLeak(e: Enemy): boolean;                    // true when the run ended
private checkWaveClear(): void;
private enterVictory(): void; private renderVictory(): void;
private chooseVictory(action: 'finish' | 'continue'): void;
private pauseMenuAvailable(): boolean;                    // !background && (!modal || modal is the pause menu)
private finishRun(outcome: RunOutcome): void;             // gameOver() now calls finishRun('defeat')
private cleanupProgression(): void;                       // idempotent
// scene.start('GameOver', data) data adds: wavesCompleted, outcome, siegeBossesDefeated, remainingLives = actual lives;
//   worldSnapshot.strongholdRatio = lives / maxLives; towers add branchId, rank, masteryRank
```
Reuse: existing gameOver payload build, button/panel/style from ui, scoreSoFar, vault.cancelTarget.
Tests (complete): tests/scene-siege.test.ts
```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameScene } from '../src/game/scenes/GameScene.ts';
import { Tower } from '../src/game/entities/Tower.ts';
import { Enemy } from '../src/game/entities/Enemy.ts';
import { SoundManager } from '../src/game/systems/SoundManager.ts';
import { SiegeSystem } from '../src/game/systems/SiegeSystem.ts';
import { waveClearBonus } from '../src/game/systems/EconomySystem.ts';
import { submitScore } from '../src/api/leaderboardClient.ts';
import { saveBest } from '../src/game/systems/Settings.ts';
import type { EvolutionCombat } from '../src/game/systems/EvolutionCombat.ts';
import type { RelicVault } from '../src/game/systems/RunSimulation.ts';
import type { RunOutcome } from '../src/shared/progression.ts';

vi.mock('phaser', () => ({ default: { Scene: class { constructor(_key?: string) {} }, Scenes: { Events: { SHUTDOWN: 'shutdown' } }, Scale: { Events: { RESIZE: 'resize' } } } }));
vi.mock('../src/api/leaderboardClient.ts', async (importOriginal) => ({ ...(await importOriginal<typeof import('../src/api/leaderboardClient.ts')>()), submitScore: vi.fn() }));
vi.mock('../src/game/systems/Settings.ts', async (importOriginal) => ({ ...(await importOriginal<typeof import('../src/game/systems/Settings.ts')>()), saveBest: vi.fn() }));
function anyStub(): any {
  const proxy: any = new Proxy(function () { return proxy; }, { get: (_t, key) => (key === 'then' ? undefined : key === Symbol.toPrimitive ? () => 0 : proxy), apply: () => proxy });
  return proxy;
}
function advanceSiege(to: number): SiegeSystem {
  const siege = new SiegeSystem();
  for (let wave = 1; wave <= to; wave++) { siege.startWave(wave); if (wave % 10 === 0) siege.bossKilled(wave); siege.completeWave({ wave, lives: 10, spawns: 0, enemies: 0, flights: 0, fields: 0 }); }
  return siege;
}
interface Run {
  wave: number; wavesCompleted: number; waveActive: boolean; currentWaveIsBoss: boolean; lives: number; gold: number; runId: string; paused: boolean; modal: unknown;
  towers: Tower[]; enemies: Enemy[]; siege: SiegeSystem; evolutionCombat: EvolutionCombat; vault: RelicVault; scheduledBossIds: Map<number, number>;
  scene: { start: ReturnType<typeof vi.fn>; restart: ReturnType<typeof vi.fn> };
  handleLeak(e: Enemy): boolean; killEnemy(e: Enemy): void; checkWaveClear(): void; enterVictory(): void; renderVictory(): void;
  chooseVictory(action: 'finish' | 'continue'): void; pauseMenuAvailable(): boolean; togglePauseMenu(): void;
  finishRun(outcome: RunOutcome): void; cleanupProgression(): void; startNextWave(): void; tryBuild(id: string, plot: number): void;
}
const PRESENTATION = ['updateHUD', 'refreshInfoPanel', 'drawSheet', 'drawPowerupBar', 'refreshPlots', 'refreshPlacePanel', 'hideGhost', 'showBanner', 'floatText', 'floatTextForEnemy', 'impactAt', 'impactBurst', 'startDeathAnim', 'drawCatalog', 'refreshTowerVisual', 'updateNextPreview', 'destroyView', 'renderVictory', 'showTouchPreview'];
function sceneFixture() {
  vi.spyOn(SoundManager, 'get').mockReturnValue(anyStub());
  const scene = new GameScene(); scene.init({ difficulty: 'medium', playerName: 'Test Warden' });
  const run = scene as unknown as Run, loose = scene as unknown as Record<string, unknown>;
  for (const name of PRESENTATION) loose[name] = () => {};
  run.scene = { start: vi.fn(), restart: vi.fn() };
  return { run, loose };
}
function atWave(run: Run, wave: number): void {
  run.siege = advanceSiege(wave - 1); run.siege.startWave(wave);
  run.wave = wave; run.wavesCompleted = wave - 1; run.waveActive = true; run.currentWaveIsBoss = wave % 10 === 0;
}
const warlord = () => new Enemy('warlord', 5000, 40, 150);
afterEach(() => { vi.restoreAllMocks(); vi.mocked(submitScore).mockClear(); vi.mocked(saveBest).mockClear(); });

describe('boss milestones and terminal events', () => {
  it.each([10, 30])('ends as a siege failure when the wave-%i boss escapes with lives left', (wave) => {
    const { run } = sceneFixture(); atWave(run, wave); run.lives = 20;
    const boss = warlord(); run.enemies = [boss]; run.scheduledBossIds.set(boss.id, wave);
    expect(run.handleLeak(boss)).toBe(true);
    expect(run.scene.start).toHaveBeenCalledTimes(1);
    expect(run.scene.start).toHaveBeenCalledWith('GameOver', expect.objectContaining({ outcome: 'siege-failed', highestWave: wave, wavesCompleted: wave - 1, remainingLives: 15, siegeBossesDefeated: wave === 30 ? 3 : 0, runId: run.runId }));
    expect(saveBest).toHaveBeenCalledTimes(1);
  });
  it('applies ordinary lives rules to the wave-20 boss', () => {
    const { run } = sceneFixture(); atWave(run, 20); run.lives = 20;
    const boss = warlord(); run.scheduledBossIds.set(boss.id, 20);
    expect(run.handleLeak(boss)).toBe(false);
    expect([run.lives, run.siege.phase]).toEqual([15, 'siege']); expect(run.scene.start).not.toHaveBeenCalled();
  });
  it('records defeat with zero lives even when a required boss escapes', () => {
    const { run } = sceneFixture(); atWave(run, 10); run.lives = 5;
    const boss = warlord(); run.scheduledBossIds.set(boss.id, 10);
    run.handleLeak(boss);
    expect(run.scene.start).toHaveBeenCalledWith('GameOver', expect.objectContaining({ outcome: 'defeat', remainingLives: 0, highestWave: 10, wavesCompleted: 9 }));
  });
  it('opens evolution only when the scheduled wave-10 boss dies', () => {
    const { run } = sceneFixture(); atWave(run, 10);
    run.killEnemy(new Enemy('pilferer', 10, 40, 250)); run.killEnemy(warlord());
    expect(run.siege.evolutionOpen).toBe(false);
    const boss = warlord(); run.scheduledBossIds.set(boss.id, 10); run.killEnemy(boss);
    expect(run.siege.evolutionOpen).toBe(true);
  });
});

describe('victory decision', () => {
  it('waits for every field before victory and pays the wave-30 bonus once', () => {
    const { run } = sceneFixture(); atWave(run, 30); run.siege.bossKilled(30);
    const mortar = new Tower('ember', 0, 0, 0);
    mortar.progression = { ...mortar.progression, foundationLevel: 4, branchId: 'flame-mortar', rank: 0 };
    run.evolutionCombat.addField(run.evolutionCombat.makeShot(mortar, [mortar], 1), 0, 0, 0);
    const gold = run.gold;
    run.checkWaveClear(); expect([run.siege.phase, run.gold]).toEqual(['siege', gold]);
    run.evolutionCombat.clear(); run.checkWaveClear(); run.checkWaveClear();
    expect([run.siege.phase, run.gold, run.wavesCompleted]).toEqual(['victory', gold + waveClearBonus(30), 30]);
  });
  it('cancels an uncommitted Meteor target without consuming it', () => {
    const { run } = sceneFixture(); run.vault.stored.push('meteor_strike'); run.vault.beginUse(0, true);
    run.siege = advanceSiege(30); run.enterVictory();
    expect([run.vault.target, run.vault.stored]).toEqual([null, ['meteor_strike']]);
  });
  it('continues once only after rewards resolve, keeps the run and starts wave 31', () => {
    const { run } = sceneFixture(); run.siege = advanceSiege(30); run.wave = 30; run.wavesCompleted = 30;
    run.vault.stored.push('meteor_strike', 'treasure_goblin', 'emergency_repair'); run.vault.offer('battle_cry', 'boss', true);
    const id = run.runId;
    run.chooseVictory('continue'); expect(run.siege.phase).toBe('victory');
    run.vault.resolve('replace-oldest'); run.modal = null;
    run.chooseVictory('continue'); run.chooseVictory('continue');
    expect([run.siege.phase, run.runId]).toEqual(['endless', id]);
    run.startNextWave(); expect([run.wave, run.siege.highestWave]).toEqual([31, 31]);
    expect(submitScore).not.toHaveBeenCalled(); expect(run.scene.start).not.toHaveBeenCalled();
  });
  it('finishes once with a terminal victory payload and no automatic submission', () => {
    const { run } = sceneFixture(); run.siege = advanceSiege(30); run.wave = 30; run.wavesCompleted = 30; run.lives = 12;
    run.chooseVictory('finish'); run.chooseVictory('finish');
    expect(run.scene.start).toHaveBeenCalledTimes(1);
    expect(run.scene.start).toHaveBeenCalledWith('GameOver', expect.objectContaining({ outcome: 'victory', highestWave: 30, wavesCompleted: 30, remainingLives: 12, siegeBossesDefeated: 7 }));
    expect(submitScore).not.toHaveBeenCalled();
  });
  it('keeps Pause reachable during the victory decision without changing the phase', () => {
    const { run, loose } = sceneFixture(); run.siege = advanceSiege(30);
    loose.add = anyStub(); loose.uiRoot = anyStub(); delete loose.renderVictory;
    run.renderVictory();
    expect(run.modal).toBe(null); expect(run.pauseMenuAvailable()).toBe(true);
    run.togglePauseMenu();
    expect([run.paused, run.siege.phase]).toEqual([true, 'victory']);
    run.chooseVictory('continue'); expect(run.siege.phase).toBe('victory');
  });
  it('blocks wave start and building during the victory decision', () => {
    const { run } = sceneFixture(); run.siege = advanceSiege(30); run.wave = 30; run.wavesCompleted = 30;
    run.startNextWave(); run.tryBuild('longbow', 1);
    expect([run.wave, run.towers.length]).toEqual([30, 0]);
  });
});

describe('discarded runs', () => {
  it('creates no result before the first wave or on restart/quit cleanup', () => {
    const { run } = sceneFixture();
    run.finishRun('defeat');
    expect(run.scene.start).not.toHaveBeenCalled(); expect(saveBest).not.toHaveBeenCalled();
    run.siege = advanceSiege(30); run.scheduledBossIds.set(1, 30);
    run.cleanupProgression(); run.cleanupProgression();
    expect(run.scene.start).not.toHaveBeenCalled();
    expect([run.scheduledBossIds.size, run.evolutionCombat.activeFieldCount]).toEqual([0, 0]);
  });
});
```
Fixture note: this fixture deliberately does not stub `drawAchievementNotice` (added by T15) and leaves `uiRoot` null in most tests. T15 makes `drawAchievementNotice` return early when there are no notices or `uiRoot` is null, so `checkWaveClear` (which calls `notifyAchievements` after T15) keeps these tests green without changes.
Recipe:
1. init(): `this.scheduledBossIds = new Map(); this.victoryPanel = null;`. update(): early return also when siege.phase is 'victory' or 'terminal'; the spawn loop captures `const enemy = this.spawnEnemy(...)` and records `scheduledBossIds.set(enemy.id, this.wave)` when enemy.isBoss and the wave is 10, 20 or 30; the leak branch becomes `if (this.handleLeak(e)) return;`; the wave-clear block becomes `this.checkWaveClear()`.
2. handleLeak(e): existing leak effects (alive false, reachedEnd, lives decrease, sound, float text, destroyView, stronghold, HUD) plus evolutionCombat.removeEnemy; then: lives <= 0 → lives = 0, finishRun('defeat'), true; scheduled boss wave present → delete it, outcome = siege.bossEscaped(wave, lives), if outcome finishRun(outcome) and true; else false.
3. killEnemy: when scheduledBossIds has e.id, siege.bossKilled(that wave), delete it, refreshInfoPanel().
4. checkWaveClear():
```ts
if (!this.waveActive) return;
const event = this.siege.completeWave({ wave: this.wave, lives: this.lives, spawns: this.spawnQueue.length, enemies: this.enemies.filter((e) => e.alive).length, flights: this.flights.length, fields: this.evolutionCombat.activeFieldCount });
if (event === 'none') return;
this.waveActive = false; this.wavesCompleted = this.siege.wavesCompleted;
const bonus = waveClearBonus(this.wave); this.gold += bonus; /* existing float text */
if (this.wave % 5 === 0 && !this.currentWaveIsBoss) this.grantPowerup(rollPowerUp(), `Wave ${this.wave} Relic`, true);
if (event === 'victory') this.enterVictory();
this.updateNextPreview(); this.updateHUD();
```
5. enterVictory(): vault.cancelTarget(), storeAfterTarget = false, placingTowerId = null, selectedTower = null, hideGhost(), renderVictory(), presentReward(), updateHUD().
6. renderVictory(): destroy the previous victoryPanel; build a container in uiRoot at depth 1500 (not `this.modal`, so togglePauseMenu still opens): panel, title 'Siege complete', `Score ${scoreSoFar()} · Lives ${lives}/${maxLives}`, unlock line (filled in T15), and two 44-px buttons 'Finish Run' and 'Continue Endless'; when `!victoryRewardsResolved(this.vault, this.modal !== null)` both use kind 'secondary' and append ' · Resolve rewards first'. Call it from closeModal() and at the end of drawShell() when phase is 'victory' (resize/rotation).
7. chooseVictory: return if phase !== 'victory' or pauseState.blocked; `if (!this.siege.choose(action, victoryRewardsResolved(this.vault, this.modal !== null))) return;` destroy the panel; finish → finishRun('victory'); continue → updateNextPreview(), updateHUD().
8. startNextWave: keep the existing guard at GameScene.ts:1167 first and unchanged (ended, waveActive, paused, pausedByModal, pendingMeteor, vault.pending.length); then `if (this.isRunBlocked()) return;`; then, as the LAST condition and only after every earlier check has passed, `if (!this.siege.startWave(this.wave + 1)) return;`. startWave changes siege state (it records the active wave and raises highestWave), so it must never run when the scene would still refuse to start the wave; evaluating it earlier would record a wave the scene never starts and refuse every later start (soft-lock). After it succeeds, increment wave as today. selectBattlefield returns when isRunBlocked().
9. pauseMenuAvailable(): the two existing guards of togglePauseMenu; togglePauseMenu uses it. Restart Run and Quit to Menu stay unchanged (they discard the run).
10. finishRun(outcome): return if ended; if outcome !== 'victory' and `!this.siege.fail(outcome)` return; ended = true; progress = siege.progress(); existing gameOver body with wavesCompleted/remainingLives from progress and actual lives (0 for defeat), saveBest once, scene.start('GameOver', data per Produces); cleanupProgression().
11. cleanupProgression(): evolutionCombat.clear(), scheduledBossIds.clear(), victoryPanel destroy/null; shutdownRun calls it.
12. handleQAAction seeds: after setting wave/wavesCompleted call `this.siege.seedForQA(this.wavesCompleted, (n >= 10 ? 1 : 0) | (n >= 20 ? 2 : 0))` with n = wavesCompleted (normal 7 → 0, heavy 24 → 3, boss 9 → 0).
Red:    `npm test -- tests/scene-siege.test.ts` → fails: handleLeak/checkWaveClear/chooseVictory are not functions
Green:  `npm test -- tests/scene-siege.test.ts` → all tests pass
Verify: `npm run typecheck` → no errors; `npm test` → every file passes
Commit: Connect the siege lifecycle, victory decision and terminal results

### T15 — In-run achievements, notices and victory-only relic choices (old Task 7)   [x] done
Satisfies: AC-20, AC-73, AC-74, AC-75, AC-76, AC-77, AC-78, AC-79, AC-87, AC-88, AC-95, AC-97, AC-99, AC-100, AC-101, AC-104, AC-109
Depends on: T4, T14
Router summary: Evaluate branch achievements once on each completed wave before the next-wave or victory UI, save them immediately, show a brief non-blocking notice per new unlock that states clearly when the unlock could not be saved, reconcile when another tab saves, and during the victory decision allow only Store or Replace Oldest and Discard New for relics, never using one.
Files:
  - modify  src/game/scenes/GameScene.ts
  - create  tests/scene-achievements.test.ts
Consumes: T4 earnedBranches, UnlockRepository (earn, view, reconcile), UNLOCK_STORAGE_KEY, `SAVE_FAILED_WARNING = 'Unlock earned, but progress could not be saved'`; T1 EVOLUTIONS (branch names); T5 victoryRewardChoices; T14 checkWaveClear, cleanupProgression, renderVictory, enterVictory; existing showRelicPanel (1365), presentReward (1350), activatePowerup (1478), applyPowerup (1500), castMeteor (1557), create (309), `uiRoot: Phaser.GameObjects.Container | null` (107).
Produces:
```ts
private achievementNotices: Array<{ branchId: BranchId; remainingMs: number }> = [];
private notifiedAchievements = new Set<BranchId>();
private notifyAchievements(): void;                      // queue 3000 ms notices for unlocksEarnedThisRun not yet notified
private updateAchievementNotices(visibleDeltaMs: number): void;
private achievementNoticeText(branchId: BranchId): string; // 'Unlocked: <name>' or 'Unlocked: <name> · ' + SAVE_FAILED_WARNING when unlockRepository.view().unsaved has it
private drawAchievementNotice(): void;                   // non-interactive text above the bottom tray, depth 1400; returns early when there are no notices or uiRoot is null
private showVictoryReward(id: PowerUpId, reason: string): void;
private resolveVictoryReward(choice: 'store' | 'replace-oldest' | 'discard-new'): void;
private attachProgressionListeners(): void;              // window 'storage' listener, once
private showRelicPanel(id, reason, full, use, keep, victory = false): void;
```
Reuse: existing showRelicPanel layouts; vault.resolve; UnlockRepository.reconcile; SAVE_FAILED_WARNING (T4) for the unsaved notice text.
Tests (complete): tests/scene-achievements.test.ts
```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameScene } from '../src/game/scenes/GameScene.ts';
import { Tower } from '../src/game/entities/Tower.ts';
import { SoundManager } from '../src/game/systems/SoundManager.ts';
import { SiegeSystem } from '../src/game/systems/SiegeSystem.ts';
import { SAVE_FAILED_WARNING, UNLOCK_STORAGE_KEY, UnlockRepository } from '../src/game/systems/UnlockSystem.ts';
import type { PauseState } from '../src/game/systems/PauseState.ts';
import type { RelicVault } from '../src/game/systems/RunSimulation.ts';
import type { Enemy } from '../src/game/entities/Enemy.ts';
import type { BranchId } from '../src/shared/progression.ts';
import type { PowerUpId } from '../src/shared/types.ts';

vi.mock('phaser', () => ({ default: { Scene: class { constructor(_key?: string) {} }, Scenes: { Events: { SHUTDOWN: 'shutdown' } }, Scale: { Events: { RESIZE: 'resize' } } } }));
function anyStub(): any {
  const proxy: any = new Proxy(function () { return proxy; }, { get: (_t, key) => (key === 'then' ? undefined : key === Symbol.toPrimitive ? () => 0 : proxy), apply: () => proxy });
  return proxy;
}
function advanceSiege(to: number): SiegeSystem {
  const siege = new SiegeSystem();
  for (let wave = 1; wave <= to; wave++) { siege.startWave(wave); if (wave % 10 === 0) siege.bossKilled(wave); siege.completeWave({ wave, lives: 10, spawns: 0, enemies: 0, flights: 0, fields: 0 }); }
  return siege;
}
class MemoryStore { value: string | null = null; getItem = (_k: string) => this.value; setItem = (_k: string, v: string) => { this.value = v; }; }
interface Run {
  wave: number; wavesCompleted: number; waveActive: boolean; currentWaveIsBoss: boolean; lives: number; gold: number; debugAssisted: boolean;
  towers: Tower[]; enemies: Enemy[]; siege: SiegeSystem; vault: RelicVault; pauseState: PauseState; pendingMeteor: boolean;
  unlockRepository: UnlockRepository; runUnlocks: ReadonlySet<BranchId>; unlocksEarnedThisRun: BranchId[]; achievementNotices: Array<{ branchId: BranchId; remainingMs: number }>;
  checkWaveClear(): void; notifyAchievements(): void; updateAchievementNotices(ms: number): void; achievementNoticeText(id: BranchId): string; applyPowerup(id: PowerUpId): void; presentReward(): void;
  showRelicPanel: ReturnType<typeof vi.fn>; attachProgressionListeners(): void; cleanupProgression(): void;
}
const PRESENTATION = ['updateHUD', 'refreshInfoPanel', 'drawSheet', 'drawPowerupBar', 'refreshPlots', 'refreshPlacePanel', 'hideGhost', 'showBanner', 'floatText', 'floatTextForEnemy', 'drawCatalog', 'refreshTowerVisual', 'updateNextPreview', 'destroyView', 'renderVictory', 'showTouchPreview', 'drawAchievementNotice', 'impactBurst', 'addEffect'];
function sceneFixture(rank: 0 | 1 | 2 | 3 = 2) {
  vi.spyOn(SoundManager, 'get').mockReturnValue(anyStub());
  const scene = new GameScene(); scene.init({ difficulty: 'medium', playerName: 'Test Warden' });
  const run = scene as unknown as Run, loose = scene as unknown as Record<string, unknown>;
  for (const name of PRESENTATION) loose[name] = () => {};
  loose.add = anyStub(); loose.world = (v: unknown) => v;
  const store = new MemoryStore();
  run.unlockRepository = new UnlockRepository(store, () => '2026-10-08T00:00:00Z'); run.runUnlocks = run.unlockRepository.snapshotForRun();
  const tower = new Tower('longbow', 100, 100, 0);
  tower.progression = { ...tower.progression, foundationLevel: 4, branchId: 'marksman', rank };
  run.towers = [tower];
  return { run, store };
}
function atWave(run: Run, wave: number): void {
  run.siege = advanceSiege(wave - 1); run.siege.startWave(wave);
  run.wave = wave; run.wavesCompleted = wave - 1; run.waveActive = true; run.currentWaveIsBoss = wave % 10 === 0; run.lives = 10;
}
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('in-run achievements', () => {
  it('earns on wave-20 completion, saves at once and keeps the current run fixed', () => {
    const { run, store } = sceneFixture(); atWave(run, 20);
    run.checkWaveClear();
    expect(run.unlocksEarnedThisRun).toEqual(['volley']);
    expect(run.achievementNotices).toEqual([{ branchId: 'volley', remainingMs: 3000 }]);
    expect(run.runUnlocks.has('volley')).toBe(false);
    expect(new UnlockRepository(store).snapshotForRun().has('volley')).toBe(true);
  });
  it.each([['debug-assisted', 2, 20, true], ['another wave', 2, 19, false], ['rank 1', 1, 20, false]] as const)('earns nothing when %s', (_n, rank, wave, debug) => {
    const { run } = sceneFixture(rank); atWave(run, wave); run.debugAssisted = debug;
    run.checkWaveClear();
    expect(run.unlocksEarnedThisRun).toEqual([]); expect(run.achievementNotices).toEqual([]);
  });
  it('does not announce a branch unlocked in an earlier run', () => {
    const { run } = sceneFixture(); run.unlockRepository.earn(['volley']); atWave(run, 20);
    run.checkWaveClear();
    expect(run.unlocksEarnedThisRun).toEqual([]);
  });
  it('notifies once and expires in visible time without pausing', () => {
    const { run } = sceneFixture(); run.unlocksEarnedThisRun = ['volley'];
    run.notifyAchievements(); run.notifyAchievements();
    expect(run.achievementNotices).toHaveLength(1); expect(run.pauseState.blocked).toBe(false);
    run.updateAchievementNotices(2999); expect(run.achievementNotices).toHaveLength(1);
    run.updateAchievementNotices(1); expect(run.achievementNotices).toHaveLength(0);
  });
  it('shows the exact save-failure message on the notice of an unsaved unlock', () => {
    const { run } = sceneFixture();
    run.unlockRepository.earn(['volley']);
    expect(run.achievementNoticeText('volley')).toBe('Unlocked: Volley');
    run.unlockRepository = new UnlockRepository(null, () => '2026-10-08T00:00:00Z'); run.unlockRepository.earn(['volley']);
    expect(SAVE_FAILED_WARNING).toBe('Unlock earned, but progress could not be saved');
    expect(run.achievementNoticeText('volley')).toBe('Unlocked: Volley · Unlock earned, but progress could not be saved');
  });
});

describe('victory-only relic exits', () => {
  it.each(['meteor_strike', 'treasure_goblin', 'emergency_repair'] as const)('blocks use of %s during the victory decision', (id) => {
    const { run } = sceneFixture(); run.siege = advanceSiege(30);
    const enemies = run.enemies.length, lives = run.lives, gold = run.gold;
    run.applyPowerup(id);
    expect([run.enemies.length, run.lives, run.gold, run.pendingMeteor]).toEqual([enemies, lives, gold, false]);
  });
  it('offers Replace Oldest or Store plus Discard New and never activates', () => {
    const { run } = sceneFixture(); run.siege = advanceSiege(30);
    run.vault.stored.push('meteor_strike', 'treasure_goblin', 'emergency_repair'); run.vault.offer('battle_cry', 'boss', true);
    run.showRelicPanel = vi.fn(); const beginUse = vi.spyOn(run.vault, 'beginUse');
    run.presentReward();
    expect(run.showRelicPanel).toHaveBeenCalledWith('battle_cry', 'boss', true, expect.any(Function), expect.any(Function), true);
    (run.showRelicPanel.mock.calls[0][3] as () => void)();
    expect(run.vault.stored).toEqual(['treasure_goblin', 'emergency_repair', 'battle_cry']);
    expect(run.vault.pending).toHaveLength(0); expect(beginUse).not.toHaveBeenCalled();
    run.vault.stored.splice(0); run.vault.offer('arcane_surge', 'boss', true);
    run.presentReward();
    expect(run.showRelicPanel.mock.calls[1][2]).toBe(false);
    (run.showRelicPanel.mock.calls[1][3] as () => void)();
    expect(run.vault.stored).toEqual(['arcane_surge']);
  });
  it('keeps siege-time reward choices unchanged', () => {
    const { run } = sceneFixture();
    run.vault.stored.push('meteor_strike', 'treasure_goblin', 'emergency_repair'); run.vault.offer('battle_cry', 'boss', true);
    run.showRelicPanel = vi.fn(); run.presentReward();
    expect(run.showRelicPanel.mock.calls[0][5]).toBeUndefined();
  });
});

describe('cross-tab listener', () => {
  it('reconciles on storage events and removes its listener once', () => {
    const add = vi.fn(), remove = vi.fn();
    vi.stubGlobal('window', { addEventListener: add, removeEventListener: remove });
    const { run } = sceneFixture(); const reconcile = vi.spyOn(run.unlockRepository, 'reconcile');
    run.attachProgressionListeners(); run.attachProgressionListeners();
    expect(add).toHaveBeenCalledTimes(1);
    (add.mock.calls[0][1] as (e: { key: string | null }) => void)({ key: UNLOCK_STORAGE_KEY });
    expect(reconcile).toHaveBeenCalledTimes(1);
    run.cleanupProgression(); run.cleanupProgression();
    expect(remove).toHaveBeenCalledTimes(1); expect(remove.mock.calls[0][1]).toBe(add.mock.calls[0][1]);
  });
});
```
Recipe:
1. checkWaveClear: right after `this.wavesCompleted = …` and before the wave bonus/relic/victory steps:
```ts
const earned = earnedBranches(this.wave, this.lives, this.towers, this.debugAssisted);
const known = this.unlockRepository.view().profile.earned;
for (const id of earned) if (!known[id] && !this.unlocksEarnedThisRun.includes(id)) this.unlocksEarnedThisRun.push(id);
this.unlockRepository.earn(earned);
this.notifyAchievements();
```
2. Notices: notifyAchievements queues `{ branchId, remainingMs: 3000 }` for new ids and calls drawAchievementNotice; updateAchievementNotices subtracts from the head only, removes it at <= 0 and redraws. update(): call `if (!this.pauseState.has('background')) this.updateAchievementNotices(deltaMs)` before the early return. achievementNoticeText(id): `Unlocked: ${EVOLUTIONS[id].name}`, and when `this.unlockRepository.view().unsaved.has(id)` append `' · ' + SAVE_FAILED_WARNING` so the notice shows the exact text 'Unlock earned, but progress could not be saved' (AC-88). drawAchievementNotice: first destroy the previous notice text (if any), then return early when `this.achievementNotices.length === 0` or `this.uiRoot === null` (this keeps T14's scene-siege tests, which leave uiRoot null and do not stub this method, green); otherwise add one text with achievementNoticeText(head.branchId) to uiRoot, centred above the bottom tray, word-wrapped to the field width, at depth 1400, never interactive. init() resets both collections.
3. presentReward: after the existing early-return guard, `if (this.siege.phase === 'victory') { this.showVictoryReward(reward.id, reward.reason); return; }`. showVictoryReward: full = powerups.length >= POWERUP_INVENTORY_LIMIT; showRelicPanel(id, reason, full, () => resolveVictoryReward(full ? 'replace-oldest' : 'store'), () => resolveVictoryReward('discard-new'), true). resolveVictoryReward: requires phase 'victory' and victoryRewardChoices(powerups.length) to include the choice; vault.resolve; closeModal(); drawPowerupBar(); presentReward(); renderVictory().
4. showRelicPanel victory mode (both phone and desktop branches): buttons [full ? 'Replace oldest' : 'Store'] → use callback, ['Discard new'] → keep callback, plus the text 'Continue into endless to use relics'; no Use/Choose target button.
5. applyPowerup, activatePowerup and castMeteor return immediately when siege.phase is 'victory' or 'terminal'.
6. attachProgressionListeners (called from create(), guarded by `typeof window !== 'undefined'` and an attached flag) registers a stored arrow handler reconciling when event.key is null or UNLOCK_STORAGE_KEY. cleanupProgression removes it once and clears notices; renderVictory shows `Unlocked: …` names of unlocksEarnedThisRun.
Red:    `npm test -- tests/scene-achievements.test.ts` → fails: achievementNotices is undefined and nothing is earned
Green:  `npm test -- tests/scene-achievements.test.ts` → all tests pass
Verify: `npm run typecheck` → no errors; `npm test` → every file passes (including tests/scene-siege.test.ts from T14 unchanged)
Commit: Evaluate achievements in run and restrict victory relic choices

### T16 — Terminal result screen with explicit Submit Score (old Tasks 7–8)   [x] done
Satisfies: AC-79, AC-90, AC-91, AC-92, AC-106, AC-107, AC-108, AC-120, AC-139
Depends on: T9, T11, T14, T15
Lenses: contract
Router summary: Stop submitting scores automatically. Every results screen (victory, defeat, siege failure, endless defeat) gets a Submit Score button that sends one fixed snapshot, shows the failure reason and allows retry with the same snapshot, and cannot submit again after success. Titles distinguish outcomes, show actual lives, earned unlocks and a separately labelled legacy best.
Files:
  - modify  src/game/scenes/GameOverScene.ts
  - modify  src/game/scenes/GameScene.ts        (finishRun data adds unlocksEarned)
  - modify  tests/screens.test.ts
  - modify  tests/scene-siege.test.ts
Consumes: T9 Data progress fields; T11 loadLegacyBest; T14 finishRun; T15 unlocksEarnedThisRun, unlockRepository.view().unsaved; existing submitScore(payload) → { ok, id?, error?, duplicate? }; GameOverScene runGeneration/isRunCurrent guard.
Produces: Data adds `unlocksEarned?: Array<{ branchId: BranchId; saved: boolean }>`; WorldSnapshot towers add optional `branchId?: BranchId | null; rank?: EvolutionRank | null`; `private submitState: 'idle' | 'submitting' | 'submitted' | 'failed'`; `private payload: GameResultPayload | null` (frozen once in create); `private submit(data: Data): Promise<void>`. Exact texts: titles 'SIEGE COMPLETE' (victory), 'SIEGE FAILED', 'GAME OVER'; lines 'The Borderkeep stands. The siege is won.', 'Siege failed: the first boss escaped' (wave 10), 'Siege failed: the final boss escaped' (wave 30), 'Siege won · The Borderkeep fell in endless.' (defeat with wavesCompleted >= 30 and mask & 5 === 5), existing defeat line otherwise; `Lives remaining · N`; `Unlocked: A, B (not saved)`; `Legacy best · 100,000`; messages idle 'Submit your score to the Hall of Legends.', submitting 'Submitting score...', saved `Score saved to the Hall of Legends  ·  #id`, duplicate 'This run was already recorded.', failed `Could not save online (reason). Your best is kept locally. Try again.`; action labels 'Submit Score' (idle/failed), 'Submitting…', 'Score Submitted'.
Reuse: existing local button(), text(), drawPanel layouts, generation guard.
Tests (complete): tests/scene-siege.test.ts — add `import type { BranchId } from '../src/shared/progression.ts';` and `import { UnlockRepository } from '../src/game/systems/UnlockSystem.ts';` and inside describe('victory decision'):
```ts
  it('passes earned unlocks with their saved state to the results screen', () => {
    const { run } = sceneFixture(); run.siege = advanceSiege(30); run.wave = 30; run.wavesCompleted = 30;
    const extra = run as unknown as { unlocksEarnedThisRun: BranchId[]; unlockRepository: UnlockRepository };
    extra.unlockRepository = new UnlockRepository(null); extra.unlockRepository.earn(['volley']); extra.unlocksEarnedThisRun = ['volley'];
    run.chooseVictory('finish');
    expect(run.scene.start).toHaveBeenCalledWith('GameOver', expect.objectContaining({ unlocksEarned: [{ branchId: 'volley', saved: false }] }));
  });
```
tests/screens.test.ts — add `legacyBest: null as null | { score: number; wave: number; difficulty: string; date: string; scoreVersion: number }` to screenMocks; change the Settings mock to `({ loadBest: () => null, loadLegacyBest: () => screenMocks.legacyBest })`; in beforeEach set `screenMocks.legacyBest = null`; replace the test 'submits each Game Over run once, projects only payload fields, and ignores stale responses' with:
```ts
  const texts = () => screenMocks.displays.filter((d) => d.kind === 'text').map((d) => d.currentText as string);
  const press = (label: string) => {
    const captions = screenMocks.displays.filter((d) => d.kind === 'text' && d.initialText === label);
    const caption = captions[captions.length - 1]; if (!caption) throw new Error(`No ${label} action`);
    screenMocks.displays[screenMocks.displays.indexOf(caption) - 1].fire('pointerdown');
  };
  const resultData = (overrides: Record<string, unknown> = {}) => ({ ...gameOverData('run-result-0001'), ...overrides }) as unknown as ReturnType<typeof gameOverData>;

  it.each([
    ['victory', { outcome: 'victory', highestWave: 30, wavesCompleted: 30, remainingLives: 12, siegeBossesDefeated: 7 }], ['defeat', {}],
    ['siege failure', { outcome: 'siege-failed', highestWave: 10, wavesCompleted: 9, remainingLives: 15 }],
    ['endless defeat', { highestWave: 31, wavesCompleted: 30, siegeBossesDefeated: 7 }]
  ] as Array<[string, Record<string, unknown>]>)('never submits automatically for a %s and offers Submit Score', async (_n, overrides) => {
    new GameOverScene().create(resultData(overrides)); await flushPromises();
    expect(screenMocks.submitScore).not.toHaveBeenCalled(); expect(texts()).toContain('Submit Score');
  });
  it('submits one projected snapshot per press and ignores presses while submitting', async () => {
    const pending = deferred<{ ok: boolean; id: number }>(); screenMocks.submitScore.mockReturnValueOnce(pending.promise);
    new GameOverScene().create({ ...gameOverData('run-submit-0001'), worldSnapshot: { mapId: 'ancient-border-keep', strongholdRatio: 0, towers: [], enemies: [] } } as ReturnType<typeof gameOverData>);
    press('Submit Score'); press('Submit Score');
    expect(screenMocks.submitScore).toHaveBeenCalledTimes(1);
    const payload = screenMocks.submitScore.mock.calls[0][0] as Record<string, unknown>;
    expect(Object.keys(payload).sort()).toEqual(['playerName', 'difficulty', 'highestWave', 'finalScore', 'enemiesKilled', 'bossesKilled', 'remainingLives', 'gameDurationSeconds', 'runId', 'gameVersion', 'scoreVersion', 'wavesCompleted', 'outcome', 'siegeBossesDefeated'].sort());
    expect(payload).not.toHaveProperty('worldSnapshot');
    pending.resolve({ ok: true, id: 7 }); await flushPromises();
    expect(texts().some((t) => t.startsWith('Score saved to the Hall of Legends'))).toBe(true);
    press('Score Submitted'); press('Submit Score');
    expect(screenMocks.submitScore).toHaveBeenCalledTimes(1);
  });
  it('shows the failure reason and retries the identical snapshot', async () => {
    screenMocks.submitScore.mockResolvedValueOnce({ ok: false, error: 'offline' }).mockResolvedValueOnce({ ok: true, id: 2 });
    new GameOverScene().create(gameOverData('run-retry-0001'));
    press('Submit Score'); await flushPromises();
    expect(texts().some((t) => t.includes('offline'))).toBe(true);
    press('Submit Score'); await flushPromises();
    expect(screenMocks.submitScore).toHaveBeenCalledTimes(2);
    expect(screenMocks.submitScore.mock.calls[1][0]).toEqual(screenMocks.submitScore.mock.calls[0][0]);
  });
  it('treats a duplicate run as recorded', async () => {
    screenMocks.submitScore.mockResolvedValueOnce({ ok: false, duplicate: true, error: 'dup' });
    new GameOverScene().create(gameOverData('run-dup-0001'));
    press('Submit Score'); await flushPromises(); press('Submit Score');
    expect(texts()).toContain('This run was already recorded.'); expect(screenMocks.submitScore).toHaveBeenCalledTimes(1);
  });
  it('ignores a stale response after the screen restarts', async () => {
    const first = deferred<{ ok: boolean; id: number }>(); screenMocks.submitScore.mockReturnValueOnce(first.promise);
    const scene = new GameOverScene(); scene.create(gameOverData('run-first-0001')); press('Submit Score');
    scene.events.emit('shutdown'); scene.create(gameOverData('run-second-0002'));
    first.resolve({ ok: true, id: 1 }); await flushPromises();
    expect(texts().some((t) => t.startsWith('Score saved'))).toBe(false); expect(screenMocks.fetchLeaderboard).not.toHaveBeenCalled();
  });
  it.each([
    [{ outcome: 'victory', highestWave: 30, wavesCompleted: 30, remainingLives: 12, siegeBossesDefeated: 7 }, 'SIEGE COMPLETE', 'The Borderkeep stands. The siege is won.', 12],
    [{ outcome: 'siege-failed', highestWave: 10, wavesCompleted: 9, remainingLives: 15 }, 'SIEGE FAILED', 'Siege failed: the first boss escaped', 15],
    [{ outcome: 'siege-failed', highestWave: 30, wavesCompleted: 29, remainingLives: 4, siegeBossesDefeated: 3 }, 'SIEGE FAILED', 'Siege failed: the final boss escaped', 4],
    [{ highestWave: 31, wavesCompleted: 30, siegeBossesDefeated: 7 }, 'GAME OVER', 'Siege won · The Borderkeep fell in endless.', 0]
  ] as Array<[Record<string, unknown>, string, string, number]>)('titles %o and keeps actual lives', (overrides, title, line, lives) => {
    new GameOverScene().create(resultData(overrides));
    expect(texts()).toEqual(expect.arrayContaining([title, line, `Lives remaining · ${lives}`]));
  });
  it('lists unlocks and labels a retained legacy best separately', () => {
    screenMocks.legacyBest = { score: 100000, wave: 40, difficulty: 'hard', date: '2026-01-01T00:00:00.000Z', scoreVersion: 1 };
    new GameOverScene().create(resultData({ unlocksEarned: [{ branchId: 'volley', saved: true }, { branchId: 'thunderlord', saved: false }] }));
    expect(texts()).toEqual(expect.arrayContaining(['Legacy best · 100,000', 'Unlocked: Volley, Thunderlord (not saved)']));
  });
```
Recipe:
1. GameOverScene.create: remove `void this.submit(...)`; set submitState 'idle', payload = Object.freeze(projection of the 14 fields), idle message.
2. submit(data): return when state is 'submitting' or 'submitted'; state submitting + redraw; `const result = await submitScore(this.payload!)`; ignore when !isRunCurrent; ok → 'submitted' + saved message; duplicate → 'submitted' + duplicate message; otherwise or thrown → 'failed' + failure message; redraw.
3. addActions: four equal buttons — submit label by state (calls submit only from idle/failed), Play Again, Leaderboard, Main Menu (desktop width `(width - 72 - 36) / 4`, compact `(width - 32 - gap * 3) / 4`); phone sheet gets a 'Submit Score' action first.
4. Panels: title and line per outcome; separate texts for lives (desktop at scoreY + 156), unlocks (y + 480) and legacy best (y + 530) when present; phone adds them as sheet lines; compact puts lives right-aligned in the header row.
5. GameScene.finishRun data: `unlocksEarned: this.unlocksEarnedThisRun.map((branchId) => ({ branchId, saved: !this.unlockRepository.view().unsaved.has(branchId) }))`.
Red:    `npm test -- tests/screens.test.ts` → fails: submitScore is called on create and no 'Submit Score' caption exists
Green:  `npm test -- tests/screens.test.ts` and `npm test -- tests/scene-siege.test.ts` → all pass
Verify: `npm run typecheck` → no errors; `npm test` → every file passes
Commit: Replace automatic score submission with explicit Submit Score

### T17 — QA fixtures for evolution, victory and mastery with debug assistance (old Task 7)   [x] done
Satisfies: AC-76
Depends on: T14, T15
Router summary: Add development-only test fixtures that open the game at an evolution-ready tower, a full-inventory victory decision, and an endless mastery tower; mark every run altered by a test command as debug-assisted so it can never earn achievements; and report progression state in the development status readout.
Files:
  - modify  src/game/qa.ts
  - modify  src/game/scenes/GameScene.ts   (handleQAAction, publishQAStatus)
  - modify  tests/qa.test.ts
Consumes: T5 seedForQA; T14 enterVictory; T12 debugAssisted, upgradeSelected; T4 earnedBranches; existing handleQAAction (539), publishQAStatus (593), QA_STATES, QAStatus.
Produces: QA_STATES adds 'evolution', 'victory', 'mastery' (after 'boss'); the seed action and isGameQAState accept them; QAStatus adds `phase: string; wavesCompleted: number; fields: number; debugAssisted: boolean; unsavedUnlocks: string[]; progression: Array<{ towerId: string; branchId: string | null; rank: number | null; masteryRank: number; invested: number }>`.
Reuse: existing seed flow (tryBuild, upgradeSelected, startNextWave), RelicVault.
Tests (complete): tests/qa.test.ts — add imports `import { earnedBranches } from '../src/game/systems/UnlockSystem.ts'; import { towerTotalInvested } from '../src/game/config/towers.ts'; import { EVOLUTIONS } from '../src/game/config/evolutions.ts'; import type { QAAction, QAStatus } from '../src/game/qa.ts'; import type { Tower } from '../src/game/entities/Tower.ts'; import type { SiegeSystem } from '../src/game/systems/SiegeSystem.ts'; import type { RelicVault } from '../src/game/systems/RunSimulation.ts';` and append:
```ts
function anyStub(): any {
  const proxy: any = new Proxy(function () { return proxy; }, { get: (_t, key) => (key === 'then' ? undefined : key === Symbol.toPrimitive ? () => 0 : proxy), apply: () => proxy });
  return proxy;
}
interface QARun { wave: number; waveActive: boolean; debugAssisted: boolean; towers: Tower[]; selectedTower: Tower | null; siege: SiegeSystem; vault: RelicVault; events: { emit: ReturnType<typeof vi.fn> }; handleQAAction(action: QAAction): void; }
function qaScene(): QARun {
  vi.spyOn(SoundManager, 'get').mockReturnValue(anyStub());
  const scene = new GameScene(); scene.init({ difficulty: 'medium', playerName: 'QA Warden' });
  const loose = scene as unknown as Record<string, unknown>;
  for (const name of ['updateHUD', 'refreshInfoPanel', 'drawSheet', 'drawPowerupBar', 'refreshPlots', 'refreshPlacePanel', 'hideGhost', 'showBanner', 'floatText', 'floatTextForEnemy', 'drawCatalog', 'updateNextPreview', 'renderVictory', 'projectEntity', 'presentReward', 'showTouchPreview', 'refreshTowerVisual']) loose[name] = () => {};
  loose.add = anyStub(); loose.world = (v: unknown) => v;
  loose.events = { emit: vi.fn(), on: vi.fn(), off: vi.fn() }; loose.input = { listenerCount: () => 0, keyboard: null }; loose.tweens = { getTweens: () => [] };
  return scene as unknown as QARun;
}
describe('progression QA fixtures', () => {
  afterEach(() => vi.restoreAllMocks());
  it('marks seeded runs as debug-assisted so they cannot earn achievements', () => {
    const run = qaScene(); run.handleQAAction({ type: 'seed', state: 'evolution' });
    expect([run.debugAssisted, run.siege.evolutionOpen, run.towers[0].level]).toEqual([true, true, 4]);
    expect(run.selectedTower).toBe(run.towers[0]);
    const qualifying = { ...run.towers[0], progression: { ...run.towers[0].progression, branchId: 'marksman' as const, rank: 2 as const } };
    expect(earnedBranches(20, 10, [qualifying], run.debugAssisted)).toEqual([]);
  });
  it('seeds a full-vault victory decision', () => {
    const run = qaScene(); run.handleQAAction({ type: 'seed', state: 'victory' });
    expect([run.siege.phase, run.vault.stored.length, run.vault.pending.length, run.wave]).toEqual(['victory', 3, 1, 30]);
  });
  it('seeds an endless rank-3 mastery tower', () => {
    const run = qaScene(); run.handleQAAction({ type: 'seed', state: 'mastery' });
    expect(run.siege.phase).toBe('endless');
    expect(run.towers[0].progression).toMatchObject({ branchId: 'marksman', rank: 3, invested: towerTotalInvested('longbow', 4) + EVOLUTIONS.marksman.stats.reduce((s, r) => s + r.cost, 0) });
  });
  it('keeps ordinary seeds startable through the siege and reports progression', () => {
    const run = qaScene(); run.handleQAAction({ type: 'seed', state: 'boss' });
    expect([run.wave, run.waveActive, run.siege.highestWave, run.debugAssisted]).toEqual([10, true, 10, true]);
    const calls = run.events.emit.mock.calls, status = calls[calls.length - 1][1] as QAStatus;
    expect(status).toMatchObject({ phase: 'siege', wavesCompleted: 9, fields: 0, debugAssisted: true, unsavedUnlocks: [] });
    expect(status.progression[0]).toMatchObject({ towerId: 'longbow', branchId: null, masteryRank: 0 });
  });
  it('does not treat speed changes as debug assistance', () => {
    const run = qaScene(); run.handleQAAction({ type: 'cycle-speed' }); expect(run.debugAssisted).toBe(false);
  });
});
```
Recipe:
1. qa.ts: extend QA_STATES, the seed union, GameQAState, isGameQAState and QAStatus.
2. handleQAAction: set `this.debugAssisted = true` for 'seed' and 'grant-powerup'. New seeds: evolution — gold 10000, tryBuild('longbow', 0), upgradeSelected ×3, wave = wavesCompleted = 10, siege.seedForQA(10, 1), gold 2000, keep selection, refreshInfoPanel; victory — wave = wavesCompleted = 30, siege.seedForQA(30, 7, 'victory'), vault.stored = ['meteor_strike','treasure_goblin','emergency_repair'], vault.offer('battle_cry','QA fixture',true), enterVictory(); mastery — gold 10000, tryBuild('longbow', 0), upgradeSelected ×3, then assign the tower's progression {branchId 'marksman', rank 3, invested as in the test} (explicit debug fixture state), wave = wavesCompleted = 30, siege.seedForQA(30, 7, 'endless'), gold 50000.
3. publishQAStatus fills the new fields from siege, evolutionCombat.activeFieldCount, debugAssisted, unlockRepository.view().unsaved and towers.
Red:    `npm test -- tests/qa.test.ts` → fails: 'evolution' seed does nothing and debugAssisted stays false
Green:  `npm test -- tests/qa.test.ts` → all tests pass
Verify: `npm run typecheck` → no errors; `npm test` → every file passes
Commit: Add progression QA fixtures and debug-assistance marking

### T18 — Pure progression presentation models (old Task 8)   [x] done
Satisfies: AC-3, AC-7, AC-9, AC-14, AC-15, AC-21, AC-22, AC-62, AC-66, AC-68, AC-69, AC-80, AC-124
Depends on: T2, T4
Router summary: Add rendering-free view models that the inspector, control sheet and menu panel display: tower title and role, next purchase actions with prices and one specific disabled reason, both branches with locked requirements and the current run's qualification, the five achievements with earned and saved state, and wave labels that call wave thirty the siege finale.
Files:
  - create  src/game/ui/progressionView.ts
  - create  tests/progression-ui.test.ts
Consumes: T1 EVOLUTIONS, STARTER_BRANCH, ALTERNATIVE_BRANCH, TOWER_IDS; T2 purchaseEvolution, nextPurchaseCost, effectiveStats, PURCHASE_REASON_TEXT, PurchaseContext, PurchaseIntent; T4 UnlockView; existing TOWERS (name, description), ENEMIES.warlord.name.
Produces:
```ts
export interface ProgressionAction { label: string; reason: string | null; intent: PurchaseIntent; revision: number; }
export interface BranchOption { id: BranchId; name: string; description: string; starter: boolean; locked: boolean; requirement: string | null; qualifiesNow: boolean; }
export interface TowerProgressionView { title: string; role: string; stats: EffectiveTowerStats; commitment: string | null; actions: ProgressionAction[]; branches: BranchOption[]; }
export interface AchievementView { towerId: TowerId; branchId: BranchId; starterName: string; alternativeName: string; requirement: string; earned: boolean; unsaved: boolean; qualifiesNow: boolean; }
export function achievementRequirement(towerId: TowerId): string; // `Keep a ${starterName} tower at evolution rank 2 or higher when wave 20 is completed.`
export function towerProgressionView(tower: CombatTower, context: PurchaseContext, waveCompleted?: number, towers?: readonly CombatTower[]): TowerProgressionView;
export function achievementViews(view: UnlockView, towers: readonly CombatTower[], waveCompleted: number): AchievementView[];
export function wavePresentation(wave: number, endless: boolean): { label: string; warning: string };
```
Reuse: purchaseEvolution as a dry run (never assign its state), nextPurchaseCost, PURCHASE_REASON_TEXT.
Tests (complete): tests/progression-ui.test.ts
```ts
import { describe, expect, it } from 'vitest';
import { achievementRequirement, achievementViews, towerProgressionView, wavePresentation } from '../src/game/ui/progressionView.ts';
import { UnlockRepository } from '../src/game/systems/UnlockSystem.ts';
import type { PurchaseContext } from '../src/game/systems/EvolutionSystem.ts';
import type { BranchId } from '../src/shared/progression.ts';
import { tower } from './helpers/evolutionFixtures.ts';

const ctx = (patch: Partial<PurchaseContext> = {}): PurchaseContext => ({ gold: 1000, evolutionOpen: false, endless: false, blocked: false, unlocked: new Set<BranchId>(), ...patch });

describe('tower progression view', () => {
  it('shows a level-4 tower as ready to evolve with both branches and specific reasons', () => {
    const t = tower(null), view = towerProgressionView(t, ctx());
    expect(view.title).toBe('Ranger · Level 4 · Ready to evolve');
    expect(view.actions.map((a) => a.label)).toEqual(['Evolve: Marksman · 510 gold', 'Evolve: Volley · 510 gold']);
    expect(view.actions.map((a) => a.reason)).toEqual(['Defeat the wave-10 boss', 'Complete the branch achievement']);
    expect(view.branches.find((b) => b.id === 'volley')).toMatchObject({ locked: true, requirement: achievementRequirement('longbow') });
    expect(view.commitment).toBe('Branch choice is permanent for this tower.');
    expect(t.progression.revision).toBe(0);
  });
  it('enables evolve after the boss with the captured intent and revision', () => {
    expect(towerProgressionView(tower(null), ctx({ evolutionOpen: true })).actions[0]).toEqual({ label: 'Evolve: Marksman · 510 gold', reason: null, intent: { kind: 'evolve', branchId: 'marksman' }, revision: 0 });
  });
  it('offers the foundation upgrade and asks for level 4 below it', () => {
    const t = tower(null); t.progression = { ...t.progression, foundationLevel: 2, invested: 190 };
    const view = towerProgressionView(t, ctx({ evolutionOpen: true }));
    expect(view.actions[0]).toMatchObject({ label: 'Upgrade to level 3 · 180 gold', reason: null, intent: { kind: 'foundation-upgrade' } });
    expect(view.actions[1].reason).toBe('Reach level 4');
  });
  it('reports insufficient gold and paused or ended runs', () => {
    const view = towerProgressionView(tower('marksman', 1), ctx({ gold: 10, evolutionOpen: true }));
    expect(view.title).toBe('Marksman · Rank 1');
    expect(view.actions).toEqual([{ label: 'Marksman rank 2 · 935 gold', reason: 'Not enough gold', intent: { kind: 'evolution-rank' }, revision: 0 }]);
    expect(towerProgressionView(tower('marksman', 1), ctx({ blocked: true, evolutionOpen: true })).actions[0].reason).toBe('Unavailable while paused or ended');
  });
  it('offers mastery only in endless and shows the numeric limit', () => {
    expect(towerProgressionView(tower('marksman', 3), ctx({ evolutionOpen: true })).actions[0]).toMatchObject({ label: `Mastery 1 · ${Math.ceil(1275 * 1.25)} gold`, reason: 'Continue into endless for mastery' });
    expect(towerProgressionView(tower('marksman', 3), ctx({ evolutionOpen: true, endless: true, gold: 5000 })).actions[0].reason).toBe(null);
    const huge = tower('marksman', 3); huge.progression = { ...huge.progression, masteryRank: 100000 };
    expect(towerProgressionView(huge, ctx({ evolutionOpen: true, endless: true })).actions[0]).toMatchObject({ label: 'Mastery 100001 · limit', reason: 'Numeric limit reached' });
  });
  it('shows the current run’s qualification on the locked alternative until wave 20', () => {
    const qualifying = tower('marksman', 2, 5);
    expect(towerProgressionView(tower(null), ctx(), 15, [tower(null), qualifying]).branches.find((b) => b.id === 'volley')?.qualifiesNow).toBe(true);
    expect(towerProgressionView(tower(null), ctx(), 20, [qualifying]).branches.find((b) => b.id === 'volley')?.qualifiesNow).toBe(false);
  });
});

describe('achievement and wave views', () => {
  it('lists five achievements for the menu without run qualification', () => {
    const views = achievementViews(new UnlockRepository(null).view(), [], 0);
    expect(views.map((v) => v.branchId)).toEqual(['volley', 'flame-mortar', 'brittle-ice', 'arcane-beacon', 'thunderlord']);
    expect(views.every((v) => !v.earned && !v.unsaved && !v.qualifiesNow)).toBe(true);
    expect(views[0]).toMatchObject({ starterName: 'Marksman', alternativeName: 'Volley', requirement: 'Keep a Marksman tower at evolution rank 2 or higher when wave 20 is completed.' });
  });
  it('marks earned-but-unsaved achievements', () => {
    const repo = new UnlockRepository(null, () => '2026-10-08T00:00:00Z'); repo.earn(['volley']);
    expect(achievementViews(repo.view(), [], 0)[0]).toMatchObject({ earned: true, unsaved: true });
  });
  it('labels wave 30 as the siege finale only in the siege', () => {
    expect(wavePresentation(30, false).label).toBe('Siege finale · Wave 30');
    expect(wavePresentation(30, false).warning).toContain('Siege finale');
    for (const wave of [10, 20]) expect(wavePresentation(wave, false).warning).not.toContain('Siege finale');
    expect(wavePresentation(40, true).label).toBe('Wave 40 · Endless');
    expect(wavePresentation(12, false).label).toBe('Wave 12 of 30');
  });
});
```
Recipe:
1. Actions by stage: level < 4 → [foundation-upgrade, evolve starter, evolve alternative]; level 4 unevolved → both evolves; evolved rank < 3 → evolution-rank; rank 3 → mastery. Labels: `Upgrade to level ${L+1} · ${cost} gold`, `Evolve: ${name} · ${cost} gold`, `${name} rank ${r+1} · ${cost} gold`, `Mastery ${m+1} · ${cost} gold` or `Mastery ${m+1} · limit` when the cost is null. reason = dry-run failure mapped through PURCHASE_REASON_TEXT, else null; revision = tower.progression.revision.
2. title: unevolved `${TOWERS[id].name} · Level ${L}` + (L === 4 ? ' · Ready to evolve' : ''); evolved `${branch name} · Rank ${rank}` + (m > 0 ? ` · Mastery ${m}` : ''). role: tower description or branch description. commitment 'Branch choice is permanent for this tower.' when evolve actions are present, else null.
3. branches: both branches of the archetype; locked = alternative not in context.unlocked; requirement for alternatives; qualifiesNow = waveCompleted < 20 and some tower in `towers` (default [tower]) on that starter at rank >= 2.
4. achievementViews: TOWER_IDS order; earned from view.profile.earned; unsaved from view.unsaved; qualifiesNow as above (menu passes [] → false).
5. wavePresentation: label endless ? `Wave ${w} · Endless` : w === 30 ? 'Siege finale · Wave 30' : `Wave ${w} of 30`; warning = w % 10 === 0 ? `${ENEMIES.warlord.name} approaches · ${label}` : label.
Red:    `npm test -- tests/progression-ui.test.ts` → fails: cannot resolve src/game/ui/progressionView.ts
Green:  `npm test -- tests/progression-ui.test.ts` → all tests pass
Verify: `npm run typecheck` → no errors; `npm test` → every file passes
Commit: Add pure progression presentation models

### T30 — Floating-point-safe sale refund (fixes T2 defect found by T19)   [x] done
Satisfies: AC-25, AC-29
Depends on: T2
Lenses: data
Router summary: The sale refund must be exactly seventy percent of recorded invested gold, rounded down. Multiplying by 0.7 in floating point returns 496 instead of 497 for 710 gold. Replace it with a shared integer-safe helper used by the evolution refund and the legacy level-based sell functions, and add exact-value tests.
Files:
  - modify  src/game/config/towers.ts            (add refundForInvested; towerSellValue uses it)
  - modify  src/game/systems/EconomySystem.ts    (sellRefund uses it)
  - modify  src/game/systems/EvolutionSystem.ts  (investedRefund uses it; drop the unused ECONOMY import)
  - modify  tests/evolution-system.test.ts       (add refund table and sweep; replace the assertion `expect(investedRefund(m.state)).toBe(Math.floor(m.state.invested * 0.7));` with `expect(investedRefund(m.state)).toBe(Math.floor(m.state.invested * 70 / 100));`)
  - modify  tests/game.test.ts                   (add one legacy-refund test; existing assertions unchanged)
Consumes: existing: src/game/config/towers.ts `SELL_REFUND_RATE = 0.7`, `towerTotalInvested(towerId: string, level: number): number`, `towerSellValue(towerId: string, level: number): number`; existing: src/game/systems/EconomySystem.ts `sellRefund(towerId: string, level: number): number`; T2 `investedRefund(state: EvolutionState): number`.
Produces:
```ts
// src/game/config/towers.ts
export function refundForInvested(invested: number): number; // Math.floor(invested * Math.round(SELL_REFUND_RATE * 100) / 100); exact for integer invested
// investedRefund(state) === refundForInvested(state.invested); sellRefund(id, level) === refundForInvested(towerTotalInvested(id, level)); towerSellValue likewise
```
Reuse: SELL_REFUND_RATE and towerTotalInvested (towers.ts); Math.round and Math.floor. No dependency added.
Tests (complete): append to tests/evolution-system.test.ts (it already imports describe, expect, it, investedRefund and initialEvolution)
```ts
describe('refund is exactly 70% of recorded investment, rounded down', () => {
  it.each([[0, 0], [100, 70], [370, 259], [710, 497], [1220, 854], [1990, 1393]])('refunds %i gold as %i', (invested, expected) => {
    expect(investedRefund({ ...initialEvolution('longbow'), invested })).toBe(expected);
  });
  it('matches integer arithmetic for every amount from 0 to 5000', () => {
    for (let invested = 0; invested <= 5000; invested++) {
      const exact = (invested * 70 - ((invested * 70) % 100)) / 100;
      expect(investedRefund({ ...initialEvolution('longbow'), invested })).toBe(exact);
    }
  });
});
```
and append to tests/game.test.ts (`describe`, `expect`, `it`, `sellRefund`, `towerSellValue` and `towerTotalInvested` are already imported there — `towerTotalInvested` at line 3 and `describe` at line 1 — so add no imports and no duplicate imports; append this as a new top-level `describe`)
```ts
describe('legacy sale value', () => {
  it('rounds seventy percent of a full Ranger build down exactly', () => {
    expect(towerTotalInvested('longbow', 4)).toBe(710);
    expect(sellRefund('longbow', 4)).toBe(497);
    expect(towerSellValue('longbow', 4)).toBe(497);
  });
});
```
Recipe:
1. Legacy check done while planning: `Math.floor(710 * 0.7)` is 496 (710 * 0.7 = 496.99999999999994), so `sellRefund` and `towerSellValue` have the same defect and are fixed here. Existing game.test.ts assertions use level 3 (370 gold: both formulas give 259) and an integer check, so they keep passing.
2. In towers.ts add and export `refundForInvested(invested)` returning `Math.floor(invested * Math.round(SELL_REFUND_RATE * 100) / 100)` (multiply by the integer percent first, then divide by 100; no epsilon). Make `towerSellValue` return `refundForInvested(towerTotalInvested(towerId, level))`. `SELL_REFUND_RATE` (towers.ts) is now the only source of the refund rate; the now-unread `ECONOMY.sellRefundRate` field in src/game/config/economy.ts is kept on purpose — do NOT remove it, and add no files.
3. In EconomySystem.ts import `refundForInvested` from '../config/towers.ts' (next to towerTotalInvested) and make `sellRefund` return `refundForInvested(towerTotalInvested(towerId, level))`. Keep the ECONOMY import (waveClearBonus uses it).
4. In EvolutionSystem.ts import `refundForInvested` from '../config/towers.ts' (extend the existing import), make `investedRefund` return `refundForInvested(state.invested)`, and delete the `ECONOMY` import, which is now unused.
5. In tests/evolution-system.test.ts make the single assertion replacement named in Files and append the describe block.
6. Append the legacy test to tests/game.test.ts.
Red:    `npm test -- tests/evolution-system.test.ts` → fails: 710→497 receives 496, and the 0..5000 sweep fails; the 1220→854 cases already pass
Green:  `npm test -- tests/evolution-system.test.ts` → all tests pass; `npm test -- tests/game.test.ts` → all tests pass
Verify: `npm run typecheck` → no errors; `npm test` → every file passes
Commit: Fix floating-point error in sale refunds

### T19 — Inspector, control sheet and wave labels render the models (old Task 8)   [x] done
Satisfies: AC-3, AC-7, AC-14, AC-15, AC-22, AC-62, AC-65, AC-80
Depends on: T12, T14, T18, T30
Router summary: Show the progression models in the existing tower inspector and scrollable control sheet: a Tower Progression sheet with branch name, effect, price, permanence note and one purchase button per action (disabled buttons show their reason and cannot fire), locked alternatives with requirements, plus siege-finale wave labels and a wave counter out of thirty.
Files:
  - modify  src/game/scenes/GameScene.ts
  - modify  src/game/ui/ScrollSheet.ts            (action enabled flag; returns the control)
  - create  tests/scene-progression-ui.test.ts
Consumes: T18 towerProgressionView, wavePresentation; T12 purchaseContext, purchaseSelected, investedRefund labels; existing drawSheet (359), refreshInfoPanel (1020), compositionSummary (909), startNextWave banner (1175), updateHUD wave value (793); components.button(scene, parent, x, y, width, label, action, kind, height); existing ScrollSheet constructor (ScrollSheet.ts:15-26), which calls `scene.input.on(...)` and `scene.game.canvas.addEventListener('touchcancel', …)` (lines 24-25).
Produces: `ScrollSheet.action(y, label, action, kind = 'secondary', enabled = true): { box; text }` (disabled → kind 'secondary', no-op action, caption alpha 0.6); sheetKind union adds 'evolve' (allowed on inspector layouts, title 'Tower Progression'); `private inspectorPrimaryAction(): void`; compositionSummary prefix `Next: ${wavePresentation(wave, endless).label} — `; boss banner text `wavePresentation(wave, endless).warning`; HUD wave value `${n}/30` in the siege and `${n}/∞` in endless.
Reuse: ScrollSheet, components.button, existing layouts.
Tests (complete): tests/scene-progression-ui.test.ts (the fixture stubs `input` and `game` because drawSheet builds a real ScrollSheet whose constructor uses `scene.input.on` and `scene.game.canvas.addEventListener`)
```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
const ui = vi.hoisted(() => {
  function anyStub(): any {
    const proxy: any = new Proxy(function () { return proxy; }, { get: (_t, key) => (key === 'then' ? undefined : key === Symbol.toPrimitive ? () => 0 : proxy), apply: () => proxy });
    return proxy;
  }
  return { anyStub, buttons: [] as Array<{ label: string; action: () => void; kind: string }> };
});
vi.mock('phaser', () => ({ default: { Scene: class { constructor(_key?: string) {} }, Scenes: { Events: { SHUTDOWN: 'shutdown' } }, Scale: { Events: { RESIZE: 'resize' } } } }));
vi.mock('../src/game/ui/components.ts', () => ({
  button: (_s: unknown, _p: unknown, _x: number, _y: number, _w: number, label: string, action: () => void, kind = 'secondary') => { ui.buttons.push({ label, action, kind }); return { box: ui.anyStub(), text: ui.anyStub() }; },
  panel: () => ui.anyStub(), statRow: () => undefined, etchedFrame: () => ui.anyStub()
}));
import { GameScene } from '../src/game/scenes/GameScene.ts';
import { ScrollSheet } from '../src/game/ui/ScrollSheet.ts';
import { Tower } from '../src/game/entities/Tower.ts';
import { SoundManager } from '../src/game/systems/SoundManager.ts';
import { SiegeSystem } from '../src/game/systems/SiegeSystem.ts';
import { gameLayout } from '../src/game/ui/layout.ts';
import type { BranchId } from '../src/shared/progression.ts';

function advanceSiege(to: number): SiegeSystem {
  const siege = new SiegeSystem();
  for (let wave = 1; wave <= to; wave++) { siege.startWave(wave); if (wave % 10 === 0) siege.bossKilled(wave); siege.completeWave({ wave, lives: 10, spawns: 0, enemies: 0, flights: 0, fields: 0 }); }
  return siege;
}
interface Run { sheetKind: string | null; selectedTower: Tower | null; towers: Tower[]; gold: number; wave: number; wavesCompleted: number; siege: SiegeSystem; runUnlocks: ReadonlySet<BranchId>;
  purchaseSelected: ReturnType<typeof vi.fn>; showBanner: ReturnType<typeof vi.fn>; drawSheet(): void; inspectorPrimaryAction(): void; compositionSummary(wave: number, complete?: boolean): string; startNextWave(): void; }
function sceneFixture(width = 1280, height = 720, level = 4) {
  vi.spyOn(SoundManager, 'get').mockReturnValue(ui.anyStub());
  const scene = new GameScene(); scene.init({ difficulty: 'medium' });
  const run = scene as unknown as Run, loose = scene as unknown as Record<string, unknown>;
  for (const name of ['updateHUD', 'refreshInfoPanel', 'showTouchPreview', 'updateNextPreview', 'floatText']) loose[name] = () => {};
  loose.add = ui.anyStub(); loose.uiRoot = ui.anyStub(); loose.input = ui.anyStub(); loose.game = ui.anyStub(); loose.layout = gameLayout(width, height);
  run.purchaseSelected = vi.fn(); run.showBanner = vi.fn();
  const t = new Tower('longbow', 100, 100, 0);
  t.progression = { ...t.progression, foundationLevel: level, invested: level === 4 ? 710 : 190 };
  run.towers = [t]; run.selectedTower = t; run.gold = 2000; run.siege.bossKilled(10); run.runUnlocks = new Set();
  ui.buttons.length = 0;
  return { run, loose, t };
}
const find = (prefix: string) => ui.buttons.find((b) => b.label.startsWith(prefix));
afterEach(() => vi.restoreAllMocks());

describe('progression controls', () => {
  it('renders disabled sheet actions that cannot fire', () => {
    const sheet = new ScrollSheet(ui.anyStub(), ui.anyStub(), { x: 0, y: 0, width: 320, height: 400 }, 'Tower Progression', () => {});
    const fire = vi.fn();
    sheet.action(0, 'Evolve: Volley · Complete the branch achievement', fire, 'primary', false);
    const disabled = ui.buttons[ui.buttons.length - 1]; disabled.action();
    expect(fire).not.toHaveBeenCalled(); expect(disabled.kind).toBe('secondary');
    sheet.action(56, 'Evolve: Marksman', fire, 'primary'); ui.buttons[ui.buttons.length - 1].action();
    expect(fire).toHaveBeenCalledTimes(1);
  });
  it('renders the evolve sheet and dispatches the captured intent and revision', () => {
    const { run, t } = sceneFixture(); run.sheetKind = 'evolve'; run.drawSheet();
    find('Evolve: Marksman · 510 gold')!.action();
    expect(run.purchaseSelected).toHaveBeenCalledWith({ kind: 'evolve', branchId: 'marksman' }, t.id, 0);
    find('Evolve: Volley · 510 gold · Complete the branch achievement')!.action();
    expect(run.purchaseSelected).toHaveBeenCalledTimes(1);
  });
  it('opens the sheet from the inspector at level 4 and upgrades directly below it', () => {
    const { run, loose } = sceneFixture(); loose.drawSheet = vi.fn();
    run.inspectorPrimaryAction(); expect(run.sheetKind).toBe('evolve');
    const low = sceneFixture(1280, 720, 2); low.loose.drawSheet = vi.fn(); low.run.inspectorPrimaryAction();
    expect(low.run.purchaseSelected).toHaveBeenCalledWith({ kind: 'foundation-upgrade' }, low.t.id, 0);
  });
  it('keeps Sell and the five targeting modes in the phone tower sheet', () => {
    const { run } = sceneFixture(390, 844); run.sheetKind = 'tower'; run.drawSheet();
    const labels = ui.buttons.map((b) => b.label);
    expect(labels).toEqual(expect.arrayContaining(['Sell · 497 gold', '✓ First', 'Last', 'Strongest', 'Weakest', 'Closest', 'Evolve: Marksman · 510 gold']));
  });
  it('labels the wave-30 preview and boss warning as the siege finale', () => {
    const { run } = sceneFixture();
    expect(run.compositionSummary(30)).toContain('Siege finale · Wave 30');
    run.siege = advanceSiege(29); run.wave = 29; run.wavesCompleted = 29; run.startNextWave();
    expect(run.showBanner.mock.calls[0][0]).toContain('Siege finale');
    run.siege.phase = 'endless'; expect(run.compositionSummary(31)).toContain('Wave 31 · Endless');
  });
});
```
Recipe:
1. ScrollSheet.action: add `enabled = true`; when false call button with a no-op and 'secondary', set caption alpha 0.6; return the control.
2. drawSheet: allow 'evolve' on inspector layouts; for 'evolve' render the model (title, role at 12 px, stats line, commitment) then each action with `sheet.action(y, reason ? `${label} · ${reason}` : label, () => { if (!reason) { this.purchaseSelected(intent, t.id, revision); this.drawSheet(); } }, 'primary', reason === null)` at 52-px spacing, then each branch line `${name}${starter ? ' (starter)' : ''} — ${description}` and for locked ones `Locked · ${requirement}${qualifiesNow ? ' · On track this run' : ''}`; advance y by measured text heights. 'tower' (phone) replaces its header and Upgrade line (380-384) with the same model header and actions, keeping Sell and targeting.
3. inspectorPrimaryAction: level < 4 → purchaseSelected foundation-upgrade with the current revision; otherwise sheetKind = 'evolve' and drawSheet(). Inspector buttons at 1051/1083 call it with labels `Upgrade · ${cost} gold` (level < 4), 'Evolve…' (level 4 unevolved), `${branch} rank ${r+1}…` (rank < 3), 'Mastery…' (rank 3); the level text lines use the model title.
4. compositionSummary, boss banner and HUD wave value use wavePresentation as in Produces.
Red:    `npm test -- tests/scene-progression-ui.test.ts` → fails: action ignores enabled and no 'evolve' sheet renders
Green:  `npm test -- tests/scene-progression-ui.test.ts` → all tests pass
Verify: `npm run typecheck` → no errors; `npm test` → every file passes
Commit: Render progression controls in the inspector and control sheet

### T20 — Branch art accents and effect visuals (old Task 8)   [x] done
Satisfies: AC-28, AC-63, AC-64
Depends on: T13, T14, T16
Router summary: Give each evolved tower a branch-specific crest silhouette and rank chevrons on its existing art, draw Marksman arrows heavier and Volley arrows slimmer based on the shot's captured branch, show one bounded burning-field circle per owner, distinct status rings for slow, freeze, stun and vulnerability, the Beacon radius when a Beacon is selected, and the same accents on results-screen towers.
Files:
  - modify  src/game/art/towerArt.ts
  - modify  src/game/scenes/GameScene.ts
  - modify  src/game/scenes/GameOverScene.ts
  - create  tests/progression-art.test.ts
Consumes: T3 activeFields; T13 fireProjectile(shot); T12 refreshTowerVisual; T14 snapshot towers with branchId/rank; T16 WorldSnapshot optional branchId/rank.
Produces:
```ts
export interface EvolutionAccent { silhouette: 'scope-crest' | 'fanned-quiver' | 'ram-wedge' | 'flame-crown' | 'shield-crest' | 'shard-spikes' | 'broken-ward' | 'beacon-spire' | 'twin-forks' | 'hammer-head'; color: number; label: string; }
export const EVOLUTION_ACCENTS: Readonly<Record<BranchId, EvolutionAccent>>; // marksman scope-crest 0xd7aa4e, volley fanned-quiver 0x8ee6a0, siegebreaker ram-wedge 0xb7c0c7, flame-mortar flame-crown 0xde8742, winterguard shield-crest 0xe1f5fe, brittle-ice shard-spikes 0x9fd4e8, spellbreaker broken-ward 0xd1b3ff, arcane-beacon beacon-spire 0xba68c8, stormcaller twin-forks 0x67d0c4, thunderlord hammer-head 0xffee58; label = branch name
export function decorateEvolution(scene: Phaser.Scene, parent: Phaser.GameObjects.Container, branchId: BranchId, rank: EvolutionRank): Phaser.GameObjects.Container;
// GameScene: private fieldViews = new Map<number, Phaser.GameObjects.Arc>(); private auraCircle: Phaser.GameObjects.Arc | null = null; private syncFieldViews(): void;
```
Reuse: buildTowerVisual output, existing projectile and slowRing visuals, world()/projectEntity.
Tests (complete): tests/progression-art.test.ts
```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { EVOLUTION_ACCENTS, decorateEvolution } from '../src/game/art/towerArt.ts';
import { EVOLUTIONS } from '../src/game/config/evolutions.ts';
import { GameScene } from '../src/game/scenes/GameScene.ts';
import { Tower } from '../src/game/entities/Tower.ts';
import { Enemy } from '../src/game/entities/Enemy.ts';
import type { EvolutionCombat } from '../src/game/systems/EvolutionCombat.ts';
import type { BranchId, ShotSnapshot } from '../src/shared/progression.ts';

vi.mock('phaser', () => ({ default: { Scene: class { constructor(_key?: string) {} }, Scenes: { Events: { SHUTDOWN: 'shutdown' } }, Scale: { Events: { RESIZE: 'resize' } } } }));
class FakeContainer {
  list: unknown[] = []; data: Record<string, unknown> = {}; destroyed = false;
  add(c: unknown) { this.list.push(...(Array.isArray(c) ? c : [c])); return this; }
  remove(c: unknown) { this.list = this.list.filter((x) => x !== c); return this; }
  setData(k: string, v: unknown) { this.data[k] = v; return this; } getData(k: string) { return this.data[k]; }
  setPosition() { return this; } setDepth() { return this; } setScale() { return this; } destroy() { this.destroyed = true; }
}
class FakeCircle { destroyed = false; setPosition() { return this; } setRadius() { return this; } setStrokeStyle() { return this; } setDepth() { return this; } setFillStyle() { return this; } setVisible() { return this; } destroy() { this.destroyed = true; } }
function makeGraphics() { const ops: string[] = []; const g: any = new Proxy({ ops }, { get: (t, k) => (k === 'ops' ? t.ops : (..._a: unknown[]) => { t.ops.push(String(k)); return g; }) }); return g; }
const fakeScene = () => ({ add: { container: () => new FakeContainer(), graphics: () => makeGraphics(), rectangle: vi.fn(() => ({})), triangle: vi.fn(() => ({})), circle: vi.fn(() => new FakeCircle()) } });
afterEach(() => vi.restoreAllMocks());

describe('branch accents', () => {
  it('defines a distinct labelled silhouette per branch', () => {
    const ids = Object.keys(EVOLUTIONS) as BranchId[];
    expect(new Set(ids.map((b) => EVOLUTION_ACCENTS[b].silhouette)).size).toBe(10);
    for (const b of ids) expect(EVOLUTION_ACCENTS[b].label).toBe(EVOLUTIONS[b].name);
  });
  it('adds one accent with rank chevrons and replaces it on update', () => {
    const scene = fakeScene(), parent = new FakeContainer();
    const first = decorateEvolution(scene as unknown as Phaser.Scene, parent as unknown as Phaser.GameObjects.Container, 'marksman', 2) as unknown as FakeContainer;
    expect(first.getData('evolutionAccent')).toBe('marksman'); expect(first.getData('evolutionRank')).toBe(2);
    const g = first.list[0] as { ops: string[] };
    expect(g.ops.filter((o) => o === 'fillTriangle')).toHaveLength(3);
    decorateEvolution(scene as unknown as Phaser.Scene, parent as unknown as Phaser.GameObjects.Container, 'marksman', 3);
    expect(parent.list.filter((c) => (c as FakeContainer).getData?.('evolutionAccent'))).toHaveLength(1);
    expect(first.destroyed).toBe(true);
  });
});

describe('effect visuals', () => {
  function run() {
    const scene = new GameScene(); scene.init({ difficulty: 'medium' });
    const loose = scene as unknown as Record<string, unknown>, add = fakeScene().add;
    loose.add = add; loose.world = (v: unknown) => v;
    return { r: scene as unknown as { evolutionCombat: EvolutionCombat; fieldViews: Map<number, FakeCircle>; syncFieldViews(): void; fireProjectile(x: number, y: number, e: Enemy, s: ShotSnapshot): void }, add };
  }
  it('draws arrows from the captured branch, not the current tower', () => {
    const { r, add } = run(), t = new Tower('longbow', 0, 0, 0), e = new Enemy('thornling', 60, 70, 8); e.x = 100;
    t.progression = { ...t.progression, foundationLevel: 4 };
    const foundation = r.evolutionCombat.makeShot(t, [t], 1);
    t.progression = { ...t.progression, branchId: 'marksman', rank: 0 };
    r.fireProjectile(0, 0, e, foundation); expect(add.rectangle.mock.calls[0].slice(0, 4)).toEqual([0, 0, 14, 2]);
    r.fireProjectile(0, 0, e, r.evolutionCombat.makeShot(t, [t], 1)); expect(add.rectangle.mock.calls[1].slice(0, 4)).toEqual([0, 0, 18, 3]);
    t.progression = { ...t.progression, branchId: 'volley' };
    r.fireProjectile(0, 0, e, r.evolutionCombat.makeShot(t, [t], 1)); expect(add.rectangle.mock.calls[2].slice(0, 4)).toEqual([0, 0, 12, 1.5]);
  });
  it('keeps one field view per active field and removes stale views', () => {
    const { r } = run(), m = new Tower('ember', 0, 0, 0);
    m.progression = { ...m.progression, foundationLevel: 4, branchId: 'flame-mortar', rank: 0 };
    const shot = r.evolutionCombat.makeShot(m, [m], 1);
    r.evolutionCombat.addField(shot, 0, 0, 0); r.evolutionCombat.addField({ ...shot, ownerId: 99 }, 5, 5, 0);
    r.syncFieldViews(); expect(r.fieldViews.size).toBe(2);
    const views = [...r.fieldViews.values()];
    r.evolutionCombat.clear(); r.syncFieldViews();
    expect(r.fieldViews.size).toBe(0); expect(views.every((v) => v.destroyed)).toBe(true);
  });
});
```
Recipe:
1. towerArt.ts: EVOLUTION_ACCENTS table; decorateEvolution destroys and removes any child of parent whose getData('evolutionAccent') is set, creates `scene.add.container(0, ((parent.getData('displayBounds') as { top: number } | undefined)?.top ?? -60) - 6)`, one graphics drawing the silhouette (fillPoints/lineBetween/strokeCircle only, ≤ 24×24 px, accent colour with 0x0a0e12 outline) and exactly rank + 1 chevrons via fillTriangle below it, sets data evolutionAccent/evolutionRank, adds it to parent. No tweens (reduced motion safe).
2. GameScene: refreshTowerVisual decorates evolved towers; fireProjectile for longbow uses shot.branchId: marksman `rectangle(0, 0, 18, 3, 0xd7aa4e)` + `triangle(10, 0, 0, -4, 0, 4, 8, 0, 0xe8e2d4)`; volley `rectangle(0, 0, 12, 1.5, 0xd7aa4e)` + `triangle(7, 0, 0, -2, 0, 2, 5, 0, 0xb7c0c7)`; foundation unchanged.
3. syncFieldViews after processFieldTicks and in cleanupProgression: one world circle per activeFields entry (`add.circle(x, y, radius, 0xde8742, 0.18)`, stroke 2 0xffb36b, depth 4.5), destroy views whose owner is gone.
4. Status ring per enemy: stun 3 px 0xffee58, freeze 3 px 0xe1f5fe, vulnerability 2 px 0xba68c8, slow 2 px 0x9fd4e8; visible when any applies.
5. auraCircle (created in create like rangeCircle, radius 160, stroke 0xba68c8): visible only while the selected tower is an Arcane Beacon; updated at the top of refreshInfoPanel.
6. GameOverScene.drawBackground decorates snapshot towers that carry branchId and rank.
Red:    `npm test -- tests/progression-art.test.ts` → fails: EVOLUTION_ACCENTS and decorateEvolution are not exported
Green:  `npm test -- tests/progression-art.test.ts` → all tests pass
Verify: `npm run typecheck` → no errors; `npm test` → every file passes
Commit: Add branch accents and evolution effect visuals

### T21 — Menu Progression panel and Legacy best display (old Task 8)   [x] done
Satisfies: AC-65, AC-80, AC-83, AC-88, AC-90
Depends on: T4, T11, T18
Router summary: Add a Progression screen reached from a fourth main-menu button that lists the five achievements with requirements, locked or unlocked state and saved or unsaved status, both branches per tower, any storage warning, and the current and legacy personal bests labelled separately, without showing any run's qualification.
Files:
  - create  src/game/scenes/ProgressionScene.ts
  - modify  src/game/scenes/MainMenuScene.ts   (Progression button; Legacy best line)
  - modify  src/main.ts                        (register ProgressionScene after LeaderboardScene)
  - create  tests/progression-scene.test.ts
Consumes: T18 achievementViews; T4 unlockRepository; T11 loadBest, loadLegacyBest, LocalBest; existing ScrollSheet; MainMenuScene addButton and its three layouts (106-134).
Produces: `export function progressionPanelLines(view: UnlockView, currentBest: LocalBest | null, legacyBest: LocalBest | null): string[]`; `export class ProgressionScene extends Phaser.Scene` (key 'Progression'). Lines: warning first when present; per archetype `${TOWERS[id].name}: ${starterName} (starter) / ${alternativeName}` then `${state} · ${requirement}` with state 'Locked' | 'Unlocked · saved' | 'Unlocked · not saved'; `Personal best · ${score.toLocaleString('en-US')} pts` or 'Personal best · none yet'; `Legacy best · ${score.toLocaleString('en-US')} pts` when present.
Reuse: ScrollSheet (scrolling, 44-px controls), tokens, achievementViews.
Tests (complete): tests/progression-scene.test.ts
```ts
import { describe, expect, it, vi } from 'vitest';
const ui = vi.hoisted(() => {
  function anyStub(): any {
    const proxy: any = new Proxy(function () { return proxy; }, { get: (_t, key) => (key === 'then' ? undefined : key === Symbol.toPrimitive ? () => 0 : proxy), apply: () => proxy });
    return proxy;
  }
  return { anyStub, start: vi.fn(), buttons: [] as Array<{ label: string; action: () => void }> };
});
vi.mock('phaser', () => ({ default: {
  Scene: class { add = ui.anyStub(); input = ui.anyStub(); game = ui.anyStub(); scale = { width: 1280, height: 720, on: () => undefined, off: () => undefined }; events = { once: () => undefined }; scene = { start: ui.start, restart: () => undefined }; constructor(_key?: string) {} },
  Scenes: { Events: { SHUTDOWN: 'shutdown' } }, Scale: { Events: { RESIZE: 'resize' } } } }));
vi.mock('../src/game/ui/components.ts', () => ({ button: (_s: unknown, _p: unknown, _x: number, _y: number, _w: number, label: string, action: () => void) => { ui.buttons.push({ label, action }); return { box: ui.anyStub(), text: ui.anyStub() }; }, panel: () => ui.anyStub(), statRow: () => undefined, etchedFrame: () => ui.anyStub() }));
import { ProgressionScene, progressionPanelLines } from '../src/game/scenes/ProgressionScene.ts';
import { UnlockRepository } from '../src/game/systems/UnlockSystem.ts';

const best = (score: number, scoreVersion: number) => ({ score, wave: 12, difficulty: 'medium', date: '2026-10-08T00:00:00.000Z', scoreVersion });
describe('progression panel', () => {
  it('lists achievements, saved state, both branches and both bests without run qualification', () => {
    const repo = new UnlockRepository(null, () => '2026-10-08T00:00:00Z'); repo.earn(['volley']);
    const lines = progressionPanelLines(repo.view(), best(900, 2), best(100000, 1));
    expect(lines[0]).toBe(repo.view().warning);
    expect(lines).toEqual(expect.arrayContaining([
      'Ranger: Marksman (starter) / Volley',
      'Unlocked · not saved · Keep a Marksman tower at evolution rank 2 or higher when wave 20 is completed.',
      'Locked · Keep a Siegebreaker tower at evolution rank 2 or higher when wave 20 is completed.',
      'Personal best · 900 pts', 'Legacy best · 100,000 pts'
    ]));
    expect(lines.some((l) => l.includes('On track'))).toBe(false);
    expect(progressionPanelLines(new UnlockRepository(null).view(), null, null)).toContain('Personal best · none yet');
  });
  it('returns to the main menu', () => {
    new ProgressionScene().create();
    ui.buttons.find((b) => b.label === 'Back')!.action();
    expect(ui.start).toHaveBeenCalledWith('MainMenu');
  });
});
```
Recipe:
1. ProgressionScene.create: dark background rectangle, centred ScrollSheet (width min(560, W - 24), height H - 24, title 'Progression', close → MainMenu); render progressionPanelLines(unlockRepository.view(), loadBest(), loadLegacyBest()) with measured spacing (body 14 px, requirement lines 12 px), then `sheet.action(y, 'Back', () => this.scene.start('MainMenu'))`. Resize restarts the scene; SHUTDOWN destroys the sheet and removes the resize listener.
2. MainMenuScene: narrowCompact column gets a fourth 44-px button (startY = max(H × 0.52, H − (44 × 4 + 8 × 3) − 18)); compact row uses width (W − 48 − 3 × 12) / 4 for four buttons; desktop splits the last row into Settings and Progression halves (gap 12). Under the personal best line add `Legacy best  ·  N pts  ·  Wave W` (12 px) when loadLegacyBest() returns a record (alone at bestY when no current best).
3. main.ts: import and append ProgressionScene to the scene list.
Red:    `npm test -- tests/progression-scene.test.ts` → fails: cannot resolve src/game/scenes/ProgressionScene.ts
Green:  `npm test -- tests/progression-scene.test.ts` → all tests pass
Verify: `npm run typecheck` → no errors; `npm test` → every file passes; `npm run build` → succeeds
Commit: Add the menu Progression panel and Legacy best display

### T22 — Rendered responsive QA at six viewports (old Task 8)   [x] done
Satisfies: AC-63, AC-64, AC-65, AC-79, AC-101, AC-103, AC-121, AC-122
Depends on: T16, T17, T19, T20, T21
Router summary: Manually check the real rendered game at the six required screen sizes for every new screen and state (evolution, locked branches, mastery, achievement list and notice, victory with full relic inventory, results with Submit Score idle, failed and submitted, pause, background, rotation and replay) and record screenshots and a pass or fail checklist. No source changes.
Files:
  - create  artifacts/progression/ui/checklist.md   (creates artifacts/progression/ui/; screenshots stored beside it)
Consumes: T17 QA states (?qa=evolution, ?qa=victory, ?qa=mastery, ?qa=gameover; QA blocks real submissions so Submit Score shows the failed/retry state), T21 menu Progression panel.
Produces: checklist.md with one row per viewport × state: viewport, state, screenshot file name `<width>x<height>-<state>.png`, result (pass/fail), note.
Reuse: existing DEV QA panel and fixtures.
Tests (complete): none — rendered checks cannot be automated here; covered by the Manual verify below.
Recipe:
1. Start the dev server with the Verify-block command dev (Manual: `npm run dev -- --host 127.0.0.1`).
2. For 1440x900, 1280x720, 1024x768, 844x390, 390x844, 360x640 open the menu → Progression, `?qa=evolution` (inspect and open Tower Progression, try the locked Volley, cancel), `?qa=mastery` (mastery action), `?qa=victory` (resolve the full inventory, Pause during the decision, then Continue Endless), `?qa=gameover` (Submit Score → failed message → retry), a normal run with backgrounding and rotation, and Play Again.
3. For each, check: no overlapping or clipped labels/actions, Pause never hidden or blocked by the victory panel or achievement notice, no input falling through panels, 44-px targets, focus/hover affordances, reduced-motion respected, at most one field circle per tower, Beacon radius only when selected, Marksman/Volley arrows distinguishable, status rings visible, legacy best labelled 'Legacy'.
4. Save screenshots and fill checklist.md. Any failure: record it and report it to the team lead as a fix finding; do not edit source here.
Red:    not applicable — manual rendered QA
Green:  not applicable — manual rendered QA
Verify: Manual: with the dev server from dev (`npm run dev -- --host 127.0.0.1`) running, every checklist row for the six viewports reads pass with a screenshot, or each failing row is reported as a fix finding with viewport, state and screenshot
Commit: Record rendered responsive QA for progression

### T23 — Balance trace reporter and deterministic economy gates (old Task 9)   [x] done
Satisfies: AC-126, AC-128, AC-129, AC-132, AC-135
Depends on: T2, T6
Router summary: Add a test-only trace format and gate checker for recorded playtests, and deterministic economy checks built from the real wave, reward and price functions with no relic luck: the first evolution of a mixed build is affordable during waves eleven to thirteen, one rank-two evolution comes before wave twenty, and nine fully evolved towers are unaffordable before wave twenty-five.
Files:
  - create  tests/helpers/progressionTrace.ts
  - create  tests/progression-balance.test.ts
Consumes: existing buildWave, killReward(base, difficulty, doubleBounty), waveClearBonus(wave), ENEMIES, DIFFICULTIES, TOWERS, towerTotalInvested; T1 EVOLUTIONS, STARTER_BRANCH, TOWER_IDS; T2 initialEvolution, purchaseEvolution, PurchaseIntent.
Produces: the helper API in the test code below (PurchaseTrace, ProgressionTrace, verifyTrace, ordinaryIncomeByWave, PlannedPurchase, MIXED_BUILD, simulatePurchases, cheapestFullEvolution).
Reuse: real economy and purchase functions; no copied constants.
Tests (complete): tests/helpers/progressionTrace.ts
```ts
import { DIFFICULTIES } from '../../src/game/config/difficulties.ts';
import { ENEMIES } from '../../src/game/config/enemies.ts';
import { EVOLUTIONS, STARTER_BRANCH } from '../../src/game/config/evolutions.ts';
import { TOWERS, TOWER_IDS, towerTotalInvested } from '../../src/game/config/towers.ts';
import { killReward, waveClearBonus } from '../../src/game/systems/EconomySystem.ts';
import { initialEvolution, purchaseEvolution, type PurchaseIntent } from '../../src/game/systems/EvolutionSystem.ts';
import { buildWave } from '../../src/game/systems/WaveSystem.ts';
import type { BranchId, EvolutionRank, EvolutionState, TowerId } from '../../src/shared/progression.ts';
import type { DifficultyId, PowerUpId } from '../../src/shared/types.ts';

export interface PurchaseTrace { wave: number; towerId: TowerId; branchId: BranchId | null; rank: EvolutionRank | null; masteryRank: number; spent: number; goldAfter: number; }
export interface ProgressionTrace { difficulty: DifficultyId; debugAssisted: boolean; unlocked: BranchId[]; purchases: PurchaseTrace[]; firstEvolutionWave: number | null; firstRank2Wave: number | null; fullyEvolvedAtVictory: number; siegeWon: boolean; ordinaryRewardsOnly: boolean; duration1xSeconds: number; maxForcedWaitWaves: number; goldByWave: number[]; leaksByWave: number[]; relics: Array<{ wave: number; id: PowerUpId; used: boolean }>; }

export function verifyTrace(trace: ProgressionTrace): string[] {
  const f: string[] = [];
  if (trace.debugAssisted) f.push('Trace must not be debug-assisted');
  if (!trace.siegeWon) f.push('Trace must record a siege victory');
  if (trace.firstEvolutionWave === null || trace.firstEvolutionWave > 13) f.push('First evolution must be affordable during waves 11–13');
  if (trace.firstRank2Wave === null || trace.firstRank2Wave >= 20) f.push('Rank 2 must be achievable before wave 20');
  if (trace.fullyEvolvedAtVictory < 2 || trace.fullyEvolvedAtVictory > 5) f.push('A successful mixed build must have 2–5 fully evolved towers at victory');
  if (trace.maxForcedWaitWaves > 3) f.push('No forced wait may exceed three consecutive completed waves');
  if (trace.difficulty === 'medium' && (trace.duration1xSeconds < 1200 || trace.duration1xSeconds > 1800)) f.push('Medium siege duration must be 1200–1800 seconds');
  return f;
}
/** Cumulative gold after each completed wave (index 0 = starting gold); every scheduled enemy killed; no relics, summons, bonus targets or selling. */
export function ordinaryIncomeByWave(difficulty: DifficultyId, throughWave: number): number[] {
  const config = DIFFICULTIES[difficulty], income = [config.startingGold];
  for (let wave = 1; wave <= throughWave; wave++) {
    let gold = waveClearBonus(wave);
    for (const g of buildWave(wave, config.enemyCountMultiplier).groups) {
      gold += g.count * killReward(ENEMIES[g.enemyId].baseReward, config, false);
      if (ENEMIES[g.enemyId].isBoss) gold += g.count * waveClearBonus(wave);
    }
    income.push(income[wave - 1] + gold);
  }
  return income;
}
export interface PlannedPurchase { towerId: TowerId; intent: PurchaseIntent | 'build'; }
const build = (towerId: TowerId): PlannedPurchase => ({ towerId, intent: 'build' });
const up = (towerId: TowerId): PlannedPurchase => ({ towerId, intent: { kind: 'foundation-upgrade' } });
const evolve = (towerId: TowerId, branchId: BranchId): PlannedPurchase => ({ towerId, intent: { kind: 'evolve', branchId } });
const rank = (towerId: TowerId): PlannedPurchase => ({ towerId, intent: { kind: 'evolution-rank' } });
export const MIXED_BUILD: readonly PlannedPurchase[] = [
  build('longbow'), build('ember'), build('glacier'), up('longbow'), build('starfire'), up('ember'), up('longbow'), build('tempest'), up('glacier'), up('starfire'),
  up('ember'), up('longbow'), evolve('longbow', 'marksman'), rank('longbow'), up('starfire'), rank('longbow'), up('ember'), up('tempest'), up('glacier'),
  evolve('ember', 'siegebreaker'), up('starfire'), evolve('starfire', 'spellbreaker'), up('tempest'), up('glacier'), rank('longbow'), evolve('glacier', 'winterguard'),
  up('tempest'), rank('ember'), evolve('tempest', 'stormcaller'), rank('ember'), rank('starfire')
];
/** Buys plan items strictly in order during each wave's preparation; evolution opens after wave 10 completes. */
export function simulatePurchases(difficulty: DifficultyId, plan: readonly PlannedPurchase[], throughWave: number): PurchaseTrace[] {
  const income = ordinaryIncomeByWave(difficulty, throughWave), states = new Map<TowerId, EvolutionState>(), trace: PurchaseTrace[] = [];
  let gold = income[0], next = 0;
  for (let wave = 1; wave <= throughWave; wave++) {
    while (next < plan.length) {
      const step = plan[next], state = states.get(step.towerId);
      let spent: number, after: EvolutionState;
      if (step.intent === 'build') {
        spent = TOWERS[step.towerId].levels[0].cost;
        if (state || gold < spent) break;
        after = initialEvolution(step.towerId);
      } else {
        if (!state) break;
        const r = purchaseEvolution(step.towerId, state, step.intent, { gold, evolutionOpen: wave > 10, endless: false, blocked: false, unlocked: new Set<BranchId>() }, state.revision);
        if (!r.ok) break;
        spent = r.cost; after = r.state;
      }
      gold -= spent; states.set(step.towerId, after);
      trace.push({ wave, towerId: step.towerId, branchId: after.branchId, rank: after.rank, masteryRank: after.masteryRank, spent, goldAfter: gold });
      next++;
    }
    gold += income[wave] - income[wave - 1];
  }
  return trace;
}
export function cheapestFullEvolution(): number {
  return Math.min(...TOWER_IDS.map((id) => towerTotalInvested(id, 4) + EVOLUTIONS[STARTER_BRANCH[id]].stats.reduce((sum, s) => sum + s.cost, 0)));
}
```
tests/progression-balance.test.ts
```ts
import { describe, expect, it } from 'vitest';
import { DIFFICULTIES } from '../src/game/config/difficulties.ts';
import { ENEMIES } from '../src/game/config/enemies.ts';
import { killReward, waveClearBonus } from '../src/game/systems/EconomySystem.ts';
import { buildWave } from '../src/game/systems/WaveSystem.ts';
import { MIXED_BUILD, cheapestFullEvolution, ordinaryIncomeByWave, simulatePurchases, verifyTrace, type ProgressionTrace } from './helpers/progressionTrace.ts';

const passing: ProgressionTrace = { difficulty: 'medium', debugAssisted: false, unlocked: [], purchases: [], firstEvolutionWave: 12, firstRank2Wave: 19, fullyEvolvedAtVictory: 3, siegeWon: true, ordinaryRewardsOnly: true, duration1xSeconds: 1500, maxForcedWaitWaves: 3, goldByWave: [], leaksByWave: [], relics: [] };
describe('trace reporter (synthetic data, not gameplay evidence)', () => {
  it('accepts a trace that meets every gate', () => expect(verifyTrace(passing)).toEqual([]));
  it.each([
    [{ firstEvolutionWave: 14 }, 'First evolution must be affordable during waves 11–13'], [{ firstEvolutionWave: null }, 'First evolution must be affordable during waves 11–13'],
    [{ firstRank2Wave: 20 }, 'Rank 2 must be achievable before wave 20'], [{ duration1xSeconds: 900 }, 'Medium siege duration must be 1200–1800 seconds'],
    [{ duration1xSeconds: 1801 }, 'Medium siege duration must be 1200–1800 seconds'], [{ fullyEvolvedAtVictory: 1 }, 'A successful mixed build must have 2–5 fully evolved towers at victory'],
    [{ fullyEvolvedAtVictory: 6 }, 'A successful mixed build must have 2–5 fully evolved towers at victory'], [{ maxForcedWaitWaves: 4 }, 'No forced wait may exceed three consecutive completed waves'],
    [{ debugAssisted: true }, 'Trace must not be debug-assisted'], [{ siegeWon: false }, 'Trace must record a siege victory']
  ] as Array<[Partial<ProgressionTrace>, string]>)('reports %o', (patch, message) => expect(verifyTrace({ ...passing, ...patch })).toContain(message));
  it('applies the duration gate only to Medium', () => expect(verifyTrace({ ...passing, difficulty: 'hard', duration1xSeconds: 900 })).toEqual([]));
});
describe('deterministic ordinary economy (Medium, no relics, no selling)', () => {
  const income = ordinaryIncomeByWave('medium', 30), trace = simulatePurchases('medium', MIXED_BUILD, 30), medium = DIFFICULTIES.medium;
  const kills = (wave: number) => buildWave(wave).groups.reduce((sum, g) => sum + g.count * killReward(ENEMIES[g.enemyId].baseReward, medium, false), 0);
  it('derives income from the real wave, reward and clear-bonus functions', () => {
    expect(income[0]).toBe(medium.startingGold);
    expect(income[1] - income[0]).toBe(kills(1) + waveClearBonus(1));
    expect(income[10] - income[9]).toBe(kills(10) + waveClearBonus(10) * 2);
  });
  it('affords the first evolution during waves 11–13', () => {
    const first = trace.find((p) => p.rank === 0);
    expect(first?.wave).toBeGreaterThanOrEqual(11); expect(first?.wave).toBeLessThanOrEqual(13);
  });
  it('reaches a rank-2 evolution before wave 20', () => expect(trace.find((p) => p.rank === 2)?.wave).toBeLessThan(20));
  it('cannot fully evolve nine plots before wave 25 from ordinary income', () => expect(9 * cheapestFullEvolution()).toBeGreaterThan(income[24]));
  it('never spends gold it does not have', () => expect(trace.every((p) => p.goldAfter >= 0 && Number.isSafeInteger(p.goldAfter))).toBe(true));
});
```
Recipe:
1. Create both files exactly as above.
2. If an economy gate fails with the seed configuration, do not tune anything in this task: stop and report the failing gate with the computed waves and gold (AC-135); tuning is dispatched as a separate fix task.
Red:    `npm test -- tests/progression-balance.test.ts` → fails: cannot resolve ./helpers/progressionTrace.ts (before the helper exists)
Green:  `npm test -- tests/progression-balance.test.ts` → all tests pass (or a reported AC-135 conflict)
Verify: `npm test` → every file passes; `npm run typecheck` → no errors
Commit: Add balance trace reporter and deterministic economy gates

### T31 — Headless simulation bot for balance traces   [x] done
Satisfies: AC-126, AC-128, AC-129, AC-130, AC-131, AC-133, AC-134, AC-136
Depends on: T23
Router summary: Add a test-only bot that plays the real game logic headless and faster than real time: it builds, upgrades and evolves with a fixed documented strategy, resolves rewards without using them, finishes or continues into endless, and records the same balance trace format as the trace reporter, clearly labelled as simulated with durations taken from simulated game time. It never uses development test commands. Includes a deterministic check over a few waves.
Files:
  - create  tests/helpers/simulationBot.ts
  - create  tests/simulation-bot.test.ts
  - create  artifacts/progression/balance/run-simulations.test.ts   (creates artifacts/progression/balance/; not type-checked, so it may import node:fs)
  - create  artifacts/progression/balance/traces/<label>.json and traces/summary.json   (written by run-simulations.test.ts, never by hand; creates traces/)
Consumes: T23 tests/helpers/progressionTrace.ts `interface PurchaseTrace { wave: number; towerId: TowerId; branchId: BranchId | null; rank: EvolutionRank | null; masteryRank: number; spent: number; goldAfter: number; }`, `interface ProgressionTrace { difficulty: DifficultyId; debugAssisted: boolean; unlocked: BranchId[]; purchases: PurchaseTrace[]; firstEvolutionWave: number | null; firstRank2Wave: number | null; fullyEvolvedAtVictory: number; siegeWon: boolean; ordinaryRewardsOnly: boolean; duration1xSeconds: number; maxForcedWaitWaves: number; goldByWave: number[]; leaksByWave: number[]; relics: Array<{ wave: number; id: PowerUpId; used: boolean }>; }`, `verifyTrace(trace: ProgressionTrace): string[]`, `interface PlannedPurchase { towerId: TowerId; intent: PurchaseIntent | 'build' }`, `MIXED_BUILD: readonly PlannedPurchase[]`; existing: src/game/scenes/GameScene.ts members (private in TypeScript, reached through a structural cast exactly as tests/scene-siege.test.ts does): `init(data: { difficulty?: DifficultyId; playerName?: string }): void`, `update(_time: number, deltaMs: number): void` (adds deltaMs × speed to gameTimeMs; returns early when ended, paused or in 'victory'/'terminal'), `tryBuild(towerId: string, plotIndex: number): void` (selects the new tower), `purchaseSelected(intent: PurchaseIntent, expectedTowerId: number, expectedRevision: number): void`, `purchaseContext(): PurchaseContext`, `startNextWave(): void` (refuses while vault.pending is non-empty), `resolveVictoryReward(choice: 'store' | 'replace-oldest' | 'discard-new'): void`, `chooseVictory(action: 'finish' | 'continue'): void`, `grantPowerup(id: PowerUpId, reason: string, wantModal: boolean): void`, fields gold, lives, wave, waveActive, ended, gameTimeMs, speed, towers: Tower[], selectedTower, occupied: Set<number>, spawnQueue: SpawnEvent[] ({ enemyId; hpBonus; atMs }), siege: SiegeSystem (phase), vault: RelicVault ({ stored; pending; resolve(choice): boolean }), runUnlocks, debugAssisted, unlockRepository, scene ({ start(key, data); restart() }; finishRun calls `scene.start('GameOver', data)` with data.outcome); existing: UnlockRepository(storage: null, now?: () => string).earn(ids), ALTERNATIVE_BRANCH, POWERUP_INVENTORY_LIMIT (3), MAP1.waypoints / MAP1.buildable (9 plots), TOWERS[id].levels[0].{cost, range}, TOWER_LIST, nextPurchaseCost(id, state, intent): number | null, purchaseEvolution(id, state, intent, context, expectedRevision): PurchaseResult, enemyHpForWave(enemyId, wave, difficulty: DifficultyConfig, hpScaleBonus = 1): number, getDifficulty(id), SoundManager.get.
Produces:
```ts
// tests/helpers/simulationBot.ts (test-only; imports vitest's vi; no node: imports because tests/ is type-checked without Node types)
export const SIM_STEP_MS = 50;      // one update(0, 50) at speed 1 = 50 ms of game time
export const PREP_MS = 10_000;      // simulated idle preparation before every wave, at 1x
export const SIMULATION_STRATEGY: string; // Recipe step 3, verbatim
export interface SimulationOptions { label: string; difficulty: DifficultyId; seed: number; unlockAll: boolean; throughWave: number; continueEndless: boolean; }
export interface EndlessCheckpoint { wave: number; reached: boolean; lives: number; leaks: number; gold: number; scheduledHp: number; gameTimeMs: number; masteryRanks: number[]; nextMasteryCosts: Array<number | null>; }
export interface SimulationTrace extends ProgressionTrace {
  simulated: true; label: string; seed: number; strategy: string; stepMs: number; prepSecondsPerWave: number;
  simulatedGameTimeMs: number;   // game time at the victory decision, else at the end of the simulation
  wavesCompleted: number; finalLives: number;
  outcome: 'victory' | 'endless' | 'defeat' | 'siege-failed' | 'incomplete';
  endless: EndlessCheckpoint[];  // [31, 35, 40] filtered to <= throughWave when continueEndless, else []
}
export function mulberry32(seed: number): () => number;          // deterministic PRNG in [0, 1)
export function runSimulation(options: SimulationOptions): SimulationTrace; // synchronous; restores every spy it installs
// duration1xSeconds = Math.round(simulatedGameTimeMs / 1000): simulated game time at 1x, NOT human playtime
```
Reuse: GameScene's own game logic (spawning, movement, combat, wave clear, siege, vault) driven through its existing methods; the Phaser mock and anyStub pattern of tests/scene-siege.test.ts and tests/scene-combat.test.ts; T23 MIXED_BUILD and the ProgressionTrace shape; RelicVault.resolve; vitest vi.spyOn. Searched package.json, tests/ and src/game/: Playwright is not installed and no headless game runner exists; no dependency added.
Tests (complete): tests/simulation-bot.test.ts
```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameScene } from '../src/game/scenes/GameScene.ts';
import { SiegeSystem } from '../src/game/systems/SiegeSystem.ts';
import { DIFFICULTIES } from '../src/game/config/difficulties.ts';
import { PREP_MS, SIM_STEP_MS, SIMULATION_STRATEGY, mulberry32, runSimulation, type SimulationOptions } from './helpers/simulationBot.ts';

vi.mock('phaser', () => ({ default: { Scene: class { constructor(_key?: string) {} }, Scenes: { Events: { SHUTDOWN: 'shutdown' } }, Scale: { Events: { RESIZE: 'resize' } } } }));
const SHORT: SimulationOptions = { label: 'bot-check', difficulty: 'medium', seed: 7, unlockAll: false, throughWave: 3, continueEndless: false };
afterEach(() => vi.restoreAllMocks());

describe('headless simulation bot', () => {
  it('has a deterministic seeded random source', () => {
    const a = mulberry32(1), b = mulberry32(1), values = [a(), a(), a()];
    expect(values).toEqual([b(), b(), b()]);
    expect(values.every((v) => v >= 0 && v < 1)).toBe(true);
  });
  it('produces the same trace for the same seed', () => {
    expect(runSimulation(SHORT)).toEqual(runSimulation(SHORT));
  }, 120_000);
  it('plays real waves without QA commands and labels the trace as simulated', () => {
    const qa = vi.spyOn(GameScene.prototype as unknown as { handleQAAction(action: unknown): void }, 'handleQAAction');
    const seed = vi.spyOn(SiegeSystem.prototype, 'seedForQA');
    const trace = runSimulation(SHORT);
    expect(qa).not.toHaveBeenCalled(); expect(seed).not.toHaveBeenCalled();
    expect(trace).toMatchObject({ simulated: true, debugAssisted: false, ordinaryRewardsOnly: true, difficulty: 'medium', wavesCompleted: 3, outcome: 'incomplete', siegeWon: false, endless: [] });
    expect(trace.goldByWave).toHaveLength(4); expect(trace.goldByWave[0]).toBe(DIFFICULTIES.medium.startingGold);
    expect(trace.leaksByWave).toHaveLength(3);
    expect(trace.purchases[0]).toMatchObject({ wave: 1, towerId: 'longbow', branchId: null, rank: null, masteryRank: 0 });
    expect(trace.purchases.every((p) => p.spent > 0 && p.goldAfter >= 0)).toBe(true);
    expect(trace.relics.every((r) => r.used === false)).toBe(true);
    expect(trace.simulatedGameTimeMs % SIM_STEP_MS).toBe(0);
    expect(trace.simulatedGameTimeMs).toBeGreaterThanOrEqual(3 * PREP_MS);
    expect(trace.duration1xSeconds).toBe(Math.round(trace.simulatedGameTimeMs / 1000));
    expect(trace.strategy).toBe(SIMULATION_STRATEGY); expect(SIMULATION_STRATEGY).toContain('never activated');
  }, 120_000);
});
```
artifacts/progression/balance/run-simulations.test.ts
```ts
import { mkdirSync, writeFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { DIFFICULTIES } from '../../../src/game/config/difficulties.ts';
import { verifyTrace } from '../../../tests/helpers/progressionTrace.ts';
import { runSimulation, type SimulationOptions } from '../../../tests/helpers/simulationBot.ts';

vi.mock('phaser', () => ({ default: { Scene: class { constructor(_key?: string) {} }, Scenes: { Events: { SHUTDOWN: 'shutdown' } }, Scale: { Events: { RESIZE: 'resize' } } } }));
const OUT = 'artifacts/progression/balance/traces';
const RUNS: SimulationOptions[] = [
  { label: 'medium-starter-1', difficulty: 'medium', seed: 1, unlockAll: false, throughWave: 30, continueEndless: false },
  { label: 'medium-starter-2', difficulty: 'medium', seed: 2, unlockAll: false, throughWave: 40, continueEndless: true },
  { label: 'medium-unlocked-1', difficulty: 'medium', seed: 3, unlockAll: true, throughWave: 30, continueEndless: false },
  { label: 'easy-1', difficulty: 'easy', seed: 4, unlockAll: false, throughWave: 30, continueEndless: false },
  { label: 'hard-1', difficulty: 'hard', seed: 5, unlockAll: false, throughWave: 30, continueEndless: false }
];
describe.runIf(process.env.BALANCE_SIM === '1')('recorded balance simulations (scripted bot, not human playtests)', () => {
  const summary: Array<{ label: string; outcome: string; simulatedMinutes: number; gateFailures: string[] }> = [];
  it.each(RUNS)('simulates $label', (options) => {
    const trace = runSimulation(options);
    expect(trace).toMatchObject({ simulated: true, debugAssisted: false, label: options.label, difficulty: options.difficulty });
    expect(trace.goldByWave[0]).toBe(DIFFICULTIES[options.difficulty].startingGold);
    if (options.continueEndless) expect(trace.endless.map((c) => c.wave)).toEqual([31, 35, 40]);
    mkdirSync(OUT, { recursive: true });
    writeFileSync(`${OUT}/${options.label}.json`, `${JSON.stringify(trace, null, 2)}\n`);
    summary.push({ label: options.label, outcome: trace.outcome, simulatedMinutes: Math.round(trace.simulatedGameTimeMs / 600) / 100, gateFailures: verifyTrace(trace) });
    writeFileSync(`${OUT}/summary.json`, `${JSON.stringify(summary, null, 2)}\n`);
  }, 600_000);
});
```
Recipe:
1. Approach (decided while planning, after reading GameScene.ts): vitest with the existing Phaser mock pattern of tests/scene-siege.test.ts and tests/scene-combat.test.ts, not Playwright — Playwright is not installed and no dependency may be added. GameScene's game logic runs headless once its presentation methods are no-ops (T12–T17 tests already prove this). Time advances by calling the scene's own `update(0, SIM_STEP_MS)` in a loop with speed forced to 1, so a 25-minute siege runs in seconds. The bot only calls init, tryBuild, purchaseSelected, purchaseContext, startNextWave, update, vault.resolve, resolveVictoryReward and chooseVictory; it never calls handleQAAction, siege.seedForQA, publishQAStatus or grantPowerup itself, so debugAssisted stays false.
2. runSimulation setup: `vi.spyOn(SoundManager, 'get').mockReturnValue(anyStub())` and `vi.spyOn(Math, 'random').mockImplementation(mulberry32(seed))` (restore both in `finally`); `new GameScene()`; set `unlockRepository = new UnlockRepository(null, () => '2026-10-08T00:00:00Z')`, and when unlockAll call `earn(Object.values(ALTERNATIVE_BRANCH))`; then `init({ difficulty, playerName: 'Simulation Bot' })` (after the repository, so runUnlocks holds the unlocks); replace these methods with no-ops: updateHUD, refreshInfoPanel, drawSheet, drawPowerupBar, refreshPlots, refreshPlacePanel, hideGhost, showBanner, floatText, floatTextForEnemy, impactAt, impactBurst, startDeathAnim, drawCatalog, refreshTowerVisual, updateNextPreview, renderVictory, showTouchPreview, projectEntity, makeEnemyVisual, presentReward, updateBossBar, updateDying, updateEffects, syncFieldViews, addEffect, drawTempestArc, publishQAStatus, drawAchievementNotice; `add = anyStub()`, `world = (v) => v`, `speed = 1`, `scene = { start: (key, data) => { if (key === 'GameOver') result = data; }, restart: () => {} }`; wrap the instance's grantPowerup so it first pushes `{ wave: scene wave, id, used: false }` into relics, then calls the original.
3. SIMULATION_STRATEGY (verbatim): 'Plan-first mixed build: buy the T23 MIXED_BUILD steps strictly in order as soon as each is affordable during preparation (evolve steps use the alternative branch when the profile has it unlocked); place each new tower on the free plot with the most road within its level-1 range. After the plan: buy the cheapest legal purchase among evolution ranks, foundation upgrades, evolutions and (in endless) mastery on existing towers, then build the cheapest tower on the best free plot. Relics are never activated: stored while a slot is free, otherwise discarded; the victory decision stores or discards the same way. 10 s of idle preparation at 1x before every wave; no selling, no pause, no speed change, no QA commands.'
4. Wave loop (pseudo-steps):
```
goldByWave = [gold]; waitRun = 0; maxWait = 0
for wave = 1 .. throughWave:
  if ended: break
  while vault.pending.length: vault.resolve(vault.stored.length < POWERUP_INVENTORY_LIMIT ? 'store' : 'discard-new')
  { bought, hasNext } = buyPhase(wave)
  if 11 <= wave <= 29: waitRun = (bought === 0 && hasNext) ? waitRun + 1 : 0; maxWait = max(maxWait, waitRun)
  step PREP_MS / SIM_STEP_MS times
  livesBefore = lives; startNextWave(); if scene.wave !== wave: throw Error(`wave ${wave} did not start`)
  scheduledHp = sum over spawnQueue of enemyHpForWave(s.enemyId, wave, getDifficulty(difficulty), s.hpBonus)
  while waveActive and !ended: step; throw Error(`wave ${wave} did not finish`) after 30 minutes of game time
  leaksByWave.push(livesBefore - lives); if ended: break
  goldByWave.push(gold)
  if siege.phase === 'victory':
    siegeWon = true; fullyEvolvedAtVictory = towers with progression.rank === 3; victoryTimeMs = gameTimeMs
    while vault.pending.length: resolveVictoryReward(vault.stored.length < POWERUP_INVENTORY_LIMIT ? 'store' : 'discard-new')
    chooseVictory(continueEndless && throughWave > 30 ? 'continue' : 'finish'); if ended: break
  if continueEndless and wave in [31, 35, 40]: push { wave, reached: true, lives, leaks: this wave's leaks, gold, scheduledHp, gameTimeMs,
     masteryRanks: towers' masteryRank, nextMasteryCosts: nextPurchaseCost(t.towerId, t.progression, { kind: 'mastery' }) }
after the loop: for each of [31, 35, 40] <= throughWave without a checkpoint (continueEndless only) push reached: false with current lives/gold/gameTimeMs, leaks 0, scheduledHp 0, empty arrays
firstEvolutionWave = first purchase with rank 0; firstRank2Wave = first purchase with rank 2; outcome = result?.outcome ?? (siege.phase === 'endless' ? 'endless' : 'incomplete')
simulatedGameTimeMs = victoryTimeMs ?? gameTimeMs; duration1xSeconds = Math.round(simulatedGameTimeMs / 1000); maxForcedWaitWaves = maxWait
wavesCompleted = siege.wavesCompleted; finalLives = lives; unlocked = [...runUnlocks]; ordinaryRewardsOnly = true; debugAssisted from the scene
```
5. buyPhase(wave): loop until nothing is bought. While MIXED_BUILD steps remain, the candidate is the next step only (its index advances on success): a build needs a free plot and gold >= TOWERS[id].levels[0].cost; other intents act on the bot's tower of that family, with an evolve branch of `unlockAll ? ALTERNATIVE_BRANCH[id] : STARTER_BRANCH[id]`, dry-run through purchaseEvolution with `purchaseContext()`; any failure (gold, wave-10 boss not yet killed, …) stops the phase with hasNext = true. After the plan: candidates for each bot tower in build order are evolution-rank, foundation-upgrade, evolve (same branch rule) and, when siege.phase is 'endless', mastery, kept only when the dry run with gold Number.MAX_SAFE_INTEGER succeeds; pick the lowest nextPurchaseCost (ties: build order, then the order above); when there is none, the candidate is a build of the TOWER_LIST entry with the lowest level-1 cost on the best free plot (none when all 9 plots are occupied → hasNext = false). An unaffordable candidate stops the phase with hasNext = true. Execute a build with `tryBuild(id, plot)` (success when towers.length grows; the new tower is the last one) and a purchase with `selectedTower = tower; purchaseSelected(intent, tower.id, tower.progression.revision)` (success when the revision grows). An execution that does not succeed (neither towers.length nor the tower's revision grows) stops the phase with hasNext = true. Record `{ wave, towerId, branchId, rank, masteryRank, spent: goldBefore - gold, goldAfter: gold }` (builds: branchId null, rank null, masteryRank 0).
6. bestPlot(range): among plots not in `occupied`, the one with the most road samples within range (samples every 10 px along each MAP1.waypoints segment); ties → lowest index.
7. Create the runner exactly as above. It is gated by `describe.runIf(process.env.BALANCE_SIM === '1')` and is not type-checked, so the default `npm test` (and `npm run deploy`) skips it and never runs the long simulations or rewrites trace files; run it only with the Verify block's `simulate` command. When run, it rewrites the traces deterministically (fixed seeds; the JSON contains no timestamps). The small 3-wave determinism test in tests/simulation-bot.test.ts stays in the default suite. If a run throws 'did not start' or 'did not finish', stop and report the wave and state; never relax a gate or the strategy to make a run pass. If the bot loses the siege (outcome 'defeat' or 'siege-failed'), report the run as a bot-competence limit, separate from balance verdicts: siegeWon false, and the fully-evolved, duration and endless checkpoints are reported as 'not reached because the bot lost'. Escalate it to the team lead under AC-135; strategy changes need lead approval and are never made to pass a gate.
Red:    `npm test -- tests/simulation-bot.test.ts` → fails: cannot resolve ./helpers/simulationBot.ts
Green:  `npm test -- tests/simulation-bot.test.ts` → all tests pass; `$env:BALANCE_SIM='1'; npm test -- artifacts/progression/balance` (the Verify block's simulate command) → passes and writes the five traces and traces/summary.json; default `npm test` skips the runner
Verify: `npm run typecheck` → no errors; `npm test` → every file passes
Commit: Add a headless simulation bot for balance traces

### T35 — Strengthen the simulation bot's strategy   [x] done
Satisfies: AC-126, AC-128, AC-129, AC-130, AC-131, AC-133, AC-134, AC-136
Depends on: T31
Router summary: Make the headless balance bot play better without changing the game. When its next planned purchase is locked until the wave-10 boss dies, it spends gold on upgrades and extra towers instead of saving it, and skips plan steps that are already done. On boss waves its towers target the strongest enemy and it uses stored relics through the normal relic actions. Then it reruns the recorded simulations and reports honestly whether it now wins.
Files:
  - modify  tests/helpers/simulationBot.ts
  - modify  tests/simulation-bot.test.ts
  - modify  artifacts/progression/balance/run-simulations.test.ts   (not type-checked, so it may import node:fs)
  - modify  artifacts/progression/balance/traces/<label>.json and traces/summary.json   (rewritten by run-simulations.test.ts, never by hand)
Consumes: T31 tests/helpers/simulationBot.ts `SIM_STEP_MS = 50`, `PREP_MS = 10_000`, `interface SimulationOptions { label: string; difficulty: DifficultyId; seed: number; unlockAll: boolean; throughWave: number; continueEndless: boolean; }`, `interface EndlessCheckpoint { wave: number; reached: boolean; lives: number; leaks: number; gold: number; scheduledHp: number; gameTimeMs: number; masteryRanks: number[]; nextMasteryCosts: Array<number | null>; }`, `mulberry32(seed: number): () => number`, `runSimulation(options: SimulationOptions): SimulationTrace`, its private `Run` structural cast, `bestPlot(occupied, range)`, `execute(wave, candidate)`, `nextCandidate()`, `buyPhase(wave)`, `resolvePending(resolve)` and the wave loop of T31 Recipe step 4; T23 tests/helpers/progressionTrace.ts `interface ProgressionTrace { difficulty: DifficultyId; debugAssisted: boolean; unlocked: BranchId[]; purchases: PurchaseTrace[]; firstEvolutionWave: number | null; firstRank2Wave: number | null; fullyEvolvedAtVictory: number; siegeWon: boolean; ordinaryRewardsOnly: boolean; duration1xSeconds: number; maxForcedWaitWaves: number; goldByWave: number[]; leaksByWave: number[]; relics: Array<{ wave: number; id: PowerUpId; used: boolean }>; }`, `verifyTrace(trace: ProgressionTrace): string[]` (unchanged by this task), `MIXED_BUILD: readonly PlannedPurchase[]` with `interface PlannedPurchase { towerId: TowerId; intent: PurchaseIntent | 'build' }`; existing: src/game/scenes/GameScene.ts private members reached through the same structural cast: `activatePowerup(index: number): void` (returns at once in siege phase 'victory' or 'terminal'; otherwise `vault.beginUse(index, towers.length > 0)` then finishUse: a non-target relic is removed from vault.stored and applied, Meteor sets vault.target and stays stored until cast, Tower Overcharge with no tower is 'unusable' and stays stored), `castMeteor(x: number, y: number): void` (commits vault.target when it is 'meteor_strike', removes it from vault.stored and damages every live enemy within POWERUP_EFFECTS.meteor.radius), `enemies: Enemy[]` (Enemy fields `alive: boolean`, `isBoss: boolean`, `x: number`, `y: number`, `hp: number`), `maxLives: number`, `towers: Tower[]` (Tower fields `x`, `y`, `stats: EffectiveTowerStats` with `range`, `targeting: TargetingMode` defaulting to 'first'; the inspector's targeting buttons assign this field directly), `vault: RelicVault` (`stored: PowerUpId[]`, `pending: PendingRelic[]`, `target: { id: PowerUpId; source: 'stored' | 'pending'; index: number } | null`, `resolve(choice: 'store' | 'replace-oldest' | 'discard-new'): boolean`, `cancelTarget(): void`), `siege.phase`; existing: src/game/systems/WaveSystem.ts `buildWave(wave: number, countMultiplier = 1): WaveConfig` (pure; `isBossWave` is true when wave % 10 === 0); src/game/systems/EvolutionSystem.ts `purchaseEvolution(id, state, intent, context: PurchaseContext, expectedRevision): PurchaseResult` with `type PurchaseResult = { ok: false; reason: PurchaseReason } | { ok: true; state: EvolutionState; gold: number; stats: EffectiveTowerStats; cost: number }` and reasons 'reach level 4' | 'defeat wave-10 boss' | 'complete branch achievement' | 'insufficient gold' | 'finish evolution' | 'continue into endless' | 'paused/ended' | 'numeric limit reached' | 'stale action' | 'not available' ('not available' for a foundation upgrade at level 4, an evolve on an evolved tower and a rank above 3), `initialEvolution(id: TowerId): EvolutionState`, `interface PurchaseContext { gold: number; evolutionOpen: boolean; endless: boolean; blocked: boolean; unlocked: ReadonlySet<BranchId>; }`; src/game/config/powerUps.ts `POWERUP_INVENTORY_LIMIT = 3`, `POWERUP_EFFECTS.repairLives = 4`; src/game/config/evolutions.ts `STARTER_BRANCH`; src/shared/types.ts `type TargetingMode = 'first' | 'last' | 'strongest' | 'weakest' | 'closest'`, `PowerUpId`.
Produces:
```ts
// tests/helpers/simulationBot.ts (additions and changes; SIM_STEP_MS, PREP_MS, SimulationOptions, EndlessCheckpoint, mulberry32 and runSimulation keep their T31 signatures)
export const SIMULATION_STRATEGY: string; // Recipe step 2, verbatim (replaces the T31 text)
export type PlanStepStatus = 'buy' | 'wait-gold' | 'locked' | 'skip';
/** dryRunWithMaxGold = purchaseEvolution(id, state, intent, { ...purchaseContext(), gold: Number.MAX_SAFE_INTEGER }, state.revision).
 *  ok and gold >= cost → 'buy'; ok → 'wait-gold'; reason 'not available' → 'skip'; any other reason → 'locked'. */
export function planStepStatus(dryRunWithMaxGold: PurchaseResult, gold: number): PlanStepStatus;
/** 'strongest' when buildWave(wave).isBossWave, else 'first'. */
export function targetingForWave(wave: number): TargetingMode;
/** Relics that can produce gold. */
export const GOLD_RELICS: ReadonlySet<PowerUpId>; // exactly gold_rush, double_bounty, treasure_goblin, ancient_blessing
/** Index of the first stored 'gold_rush' when buildWave(wave).isBossWave, or when pendingCount > 0 and stored.length >= POWERUP_INVENTORY_LIMIT; otherwise -1. */
export function goldRushIndex(stored: readonly PowerUpId[], wave: number, pendingCount: number): number;
/** Stored relics to use when a boss arrives, in stored order: every relic except 'gold_rush'; 'emergency_repair' only when lives <= maxLives - POWERUP_EFFECTS.repairLives. */
export function bossRelicsToActivate(stored: readonly PowerUpId[], lives: number, maxLives: number): PowerUpId[];
export interface SimulationTrace extends ProgressionTrace {
  simulated: true; label: string; seed: number; strategy: string; stepMs: number; prepSecondsPerWave: number;
  simulatedGameTimeMs: number;
  wavesCompleted: number; finalLives: number;
  outcome: 'victory' | 'endless' | 'defeat' | 'siege-failed' | 'incomplete';
  endless: EndlessCheckpoint[];
  relicUses: Array<{ wave: number; id: PowerUpId }>; // NEW: every relic the bot used, in order, with the wave it was used in
  goldAtLastWaveStart: number;                         // NEW: gold left after buying, when the last started wave began
  bossWaves: Array<{ wave: number; targeting: TargetingMode[]; storedAtBossArrival: PowerUpId[] | null; livesAtBossArrival: number | null; maxLives: number }>;
    // NEW: one entry per started boss wave (wave % 10 === 0), pushed right after startNextWave: targeting = every tower's targeting then;
    // storedAtBossArrival / livesAtBossArrival = [...vault.stored] and lives when a boss first came within a tower's range while the run was still going and the siege phase was neither 'victory' nor 'terminal' (null when none did; Recipe step 6)
  lockedSteps: Array<{ wave: number; fillerBought: number; goldAfterBuying: number; cheapestFillerCost: number | null }>;
    // NEW: one entry per buy phase that ended while the next plan step was 'locked': fallback purchases made in that phase,
    // gold when the phase ended, and the cost of the cheapest fallback candidate then (null when there was none: no legal purchase, no free plot)
  phaseEnds: Array<{ wave: number; status: PlanStepStatus | 'after-plan' }>;
    // NEW: one entry per buy phase (so one per started wave), pushed when the phase stops: the status of its last nextCandidate() result
    // ('buy' when that candidate's execution did not succeed, 'wait-gold', 'locked', or 'after-plan' once MIXED_BUILD is exhausted; never 'skip')
  relicAttribution: string; // NEW: always RELIC_ATTRIBUTION_NOTE
}
// ordinaryRewardsOnly is now !relicUses.some((u) => GOLD_RELICS.has(u.id)) (T31 always wrote true).
// Each use marks the earliest relics entry with the same id and used === false as used: true (per-id counts are exact; which grant gets marked is not, see RELIC_ATTRIBUTION_NOTE; discards are not tracked).
export const RELIC_ATTRIBUTION_NOTE: string; // Recipe step 5, verbatim
// runSimulation throws Error(`relic ${id} could not be used at wave ${wave}`) when a use does not shrink vault.stored,
// and Error(`relic reward could not be resolved at wave ${wave}`) as before.
// artifacts/progression/balance/traces/summary.json rows: { label; outcome; simulatedMinutes; gateFailures: string[];
//   wavesCompleted; finalLives; totalLeaks; goldAtLastWaveStart; relicsGranted; relicUses; ordinaryRewardsOnly: boolean;
//   ac128ac129Evidence: 'ordinary rewards only' | 'relic-assisted, not evidence for AC-128/AC-129' } (additive; T24's fields unchanged)
// gateFailures stays verifyTrace(trace), which never reads ordinaryRewardsOnly: for a relic-assisted row an empty AC-128/AC-129 failure list is NOT a pass (Recipe step 9).
// After writing each trace and summary.json the runner asserts strategy adherence from bossWaves, relicUses, lockedSteps and phaseEnds (Recipe step 9).
```
Reuse: GameScene's own relic paths `activatePowerup(index)` and `castMeteor(x, y)` (what the relic bar's Use button and the Meteor Cast button call) instead of applying effects; the `Tower.targeting` field the inspector's targeting buttons set; `buildWave(wave).isBossWave` for boss waves; `purchaseEvolution` failure reasons for lock detection; `RelicVault.resolve` / `cancelTarget`; `POWERUP_INVENTORY_LIMIT` and `POWERUP_EFFECTS.repairLives`; T31's after-plan selection code, moved into a function that also returns its cheapest candidate's cost; vitest. Searched src/game/scenes/GameScene.ts, src/game/systems/RunSimulation.ts, src/game/systems/EvolutionSystem.ts, src/game/config/powerUps.ts, src/game/systems/WaveSystem.ts and package.json: no dependency added, no game code touched.
Tests (complete): tests/simulation-bot.test.ts (replaces the T31 file; stays in the default suite)
```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameScene } from '../src/game/scenes/GameScene.ts';
import { SiegeSystem } from '../src/game/systems/SiegeSystem.ts';
import { DIFFICULTIES } from '../src/game/config/difficulties.ts';
import { STARTER_BRANCH } from '../src/game/config/evolutions.ts';
import { initialEvolution, purchaseEvolution, type PurchaseContext } from '../src/game/systems/EvolutionSystem.ts';
import type { BranchId, EvolutionState } from '../src/shared/progression.ts';
import {
  GOLD_RELICS, PREP_MS, SIM_STEP_MS, RELIC_ATTRIBUTION_NOTE, SIMULATION_STRATEGY, bossRelicsToActivate, goldRushIndex, mulberry32, planStepStatus, runSimulation, targetingForWave, type SimulationOptions
} from './helpers/simulationBot.ts';

vi.mock('phaser', () => ({ default: { Scene: class { constructor(_key?: string) {} }, Scenes: { Events: { SHUTDOWN: 'shutdown' } }, Scale: { Events: { RESIZE: 'resize' } } } }));
const SHORT: SimulationOptions = { label: 'bot-check', difficulty: 'medium', seed: 7, unlockAll: false, throughWave: 3, continueEndless: false };
const OPEN: PurchaseContext = { gold: Number.MAX_SAFE_INTEGER, evolutionOpen: true, endless: false, blocked: false, unlocked: new Set<BranchId>() };
afterEach(() => vi.restoreAllMocks());

describe('headless simulation bot', () => {
  it('has a deterministic seeded random source', () => {
    const a = mulberry32(1), b = mulberry32(1), values = [a(), a(), a()];
    expect(values).toEqual([b(), b(), b()]);
    expect(values.every((v) => v >= 0 && v < 1)).toBe(true);
  });
  it('produces the same trace for the same seed', () => {
    expect(runSimulation(SHORT)).toEqual(runSimulation(SHORT));
  }, 120_000);
  it('plays real waves without QA commands and labels the trace as simulated', () => {
    const qa = vi.spyOn(GameScene.prototype as unknown as { handleQAAction(action: unknown): void }, 'handleQAAction');
    const seed = vi.spyOn(SiegeSystem.prototype, 'seedForQA');
    const trace = runSimulation(SHORT);
    expect(qa).not.toHaveBeenCalled(); expect(seed).not.toHaveBeenCalled();
    expect(trace).toMatchObject({ simulated: true, debugAssisted: false, difficulty: 'medium', wavesCompleted: 3, outcome: 'incomplete', siegeWon: false, endless: [] });
    expect(trace.goldByWave).toHaveLength(4); expect(trace.goldByWave[0]).toBe(DIFFICULTIES.medium.startingGold);
    expect(trace.leaksByWave).toHaveLength(3);
    expect(trace.purchases[0]).toMatchObject({ wave: 1, towerId: 'longbow', branchId: null, rank: null, masteryRank: 0 });
    expect(trace.purchases.every((p) => p.spent > 0 && p.goldAfter >= 0)).toBe(true);
    // Waves 1-3 hold no boss: the only relic the bot may use is a Gold Rush that makes room in a full inventory.
    expect(trace.relicUses.every((u) => u.id === 'gold_rush' && u.wave >= 1 && u.wave <= 3)).toBe(true);
    expect(trace.relics.filter((r) => r.used)).toHaveLength(trace.relicUses.length);
    expect(trace.ordinaryRewardsOnly).toBe(!trace.relicUses.some((u) => GOLD_RELICS.has(u.id)));
    expect(trace.goldAtLastWaveStart).toBeGreaterThanOrEqual(0);
    // Waves 1-3 hold no boss; a buy phase that ends on a locked plan step leaves less gold than the cheapest fallback purchase.
    expect(trace.bossWaves).toEqual([]);
    expect(trace.lockedSteps.every((s) => s.wave >= 1 && s.wave <= 3 && (s.cheapestFillerCost === null || s.goldAfterBuying < s.cheapestFillerCost))).toBe(true);
    // One buy phase per started wave, each recording the plan status it ended on; the 'locked' ends are exactly the lockedSteps entries.
    expect(trace.phaseEnds.map((e) => e.wave)).toEqual([1, 2, 3]);
    expect(trace.phaseEnds.every((e) => ['buy', 'wait-gold', 'locked', 'after-plan'].includes(e.status))).toBe(true);
    expect(trace.lockedSteps.map((s) => s.wave)).toEqual(trace.phaseEnds.filter((e) => e.status === 'locked').map((e) => e.wave));
    expect(trace.relicAttribution).toBe(RELIC_ATTRIBUTION_NOTE); expect(RELIC_ATTRIBUTION_NOTE).toContain('discarded');
    expect(trace.simulatedGameTimeMs % SIM_STEP_MS).toBe(0);
    expect(trace.simulatedGameTimeMs).toBeGreaterThanOrEqual(3 * PREP_MS);
    expect(trace.duration1xSeconds).toBe(Math.round(trace.simulatedGameTimeMs / 1000));
    expect(trace.strategy).toBe(SIMULATION_STRATEGY);
    for (const phrase of ['locked', 'Strongest on boss waves', 'no selling, no pause, no speed change, no QA commands']) expect(SIMULATION_STRATEGY).toContain(phrase);
  }, 120_000);
});

describe('simulation bot strategy decisions', () => {
  it('buys or saves for an open plan step, falls back while it is locked and skips a finished one', () => {
    let state: EvolutionState = initialEvolution('longbow');
    const first = purchaseEvolution('longbow', state, { kind: 'foundation-upgrade' }, OPEN, state.revision);
    if (!first.ok) throw new Error(first.reason);
    expect(planStepStatus(first, first.cost)).toBe('buy');
    expect(planStepStatus(first, first.cost - 1)).toBe('wait-gold');
    for (let i = 0; i < 3; i++) {
      const r = purchaseEvolution('longbow', state, { kind: 'foundation-upgrade' }, OPEN, state.revision);
      if (!r.ok) throw new Error(r.reason);
      state = r.state;
    }
    const locked = purchaseEvolution('longbow', state, { kind: 'evolve', branchId: STARTER_BRANCH.longbow }, { ...OPEN, evolutionOpen: false }, state.revision);
    expect(locked).toEqual({ ok: false, reason: 'defeat wave-10 boss' });
    expect(planStepStatus(locked, Number.MAX_SAFE_INTEGER)).toBe('locked');
    const maxed = purchaseEvolution('longbow', state, { kind: 'foundation-upgrade' }, OPEN, state.revision);
    expect(maxed).toEqual({ ok: false, reason: 'not available' });
    expect(planStepStatus(maxed, Number.MAX_SAFE_INTEGER)).toBe('skip');
  });
  it('targets the strongest enemy only on boss waves', () => {
    expect([1, 9, 10, 11, 20, 29, 30, 31, 40].map((wave) => targetingForWave(wave))).toEqual(['first', 'first', 'strongest', 'first', 'strongest', 'first', 'strongest', 'first', 'strongest']);
  });
  it('uses Gold Rush on boss waves or to make room, and the other relics when a boss arrives', () => {
    expect(goldRushIndex(['battle_cry', 'gold_rush'], 10, 0)).toBe(1);
    expect(goldRushIndex(['battle_cry', 'gold_rush'], 9, 0)).toBe(-1);
    expect(goldRushIndex(['battle_cry', 'gold_rush', 'meteor_strike'], 9, 1)).toBe(1);
    expect(goldRushIndex(['battle_cry', 'meteor_strike', 'time_freeze'], 9, 1)).toBe(-1);
    expect(goldRushIndex(['battle_cry'], 20, 0)).toBe(-1);
    expect(bossRelicsToActivate(['gold_rush', 'battle_cry', 'emergency_repair'], 20, 20)).toEqual(['battle_cry']);
    expect(bossRelicsToActivate(['emergency_repair', 'meteor_strike', 'arcane_surge'], 16, 20)).toEqual(['emergency_repair', 'meteor_strike', 'arcane_surge']);
    expect(bossRelicsToActivate(['emergency_repair'], 17, 20)).toEqual([]);
    expect([...GOLD_RELICS].sort()).toEqual(['ancient_blessing', 'double_bounty', 'gold_rush', 'treasure_goblin']);
  });
});
```
artifacts/progression/balance/run-simulations.test.ts (replaces the T31 file; still gated by BALANCE_SIM)
```ts
import { mkdirSync, writeFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { DIFFICULTIES } from '../../../src/game/config/difficulties.ts';
import { verifyTrace } from '../../../tests/helpers/progressionTrace.ts';
import { SIMULATION_STRATEGY, bossRelicsToActivate, runSimulation, type SimulationOptions } from '../../../tests/helpers/simulationBot.ts';

vi.mock('phaser', () => ({ default: { Scene: class { constructor(_key?: string) {} }, Scenes: { Events: { SHUTDOWN: 'shutdown' } }, Scale: { Events: { RESIZE: 'resize' } } } }));
const OUT = 'artifacts/progression/balance/traces';
const RUNS: SimulationOptions[] = [
  { label: 'medium-starter-1', difficulty: 'medium', seed: 1, unlockAll: false, throughWave: 30, continueEndless: false },
  { label: 'medium-starter-2', difficulty: 'medium', seed: 2, unlockAll: false, throughWave: 40, continueEndless: true },
  { label: 'medium-unlocked-1', difficulty: 'medium', seed: 3, unlockAll: true, throughWave: 30, continueEndless: false },
  { label: 'easy-1', difficulty: 'easy', seed: 4, unlockAll: false, throughWave: 30, continueEndless: false },
  { label: 'hard-1', difficulty: 'hard', seed: 5, unlockAll: false, throughWave: 30, continueEndless: false }
];
type SummaryRow = {
  label: string; outcome: string; simulatedMinutes: number; gateFailures: string[];
  wavesCompleted: number; finalLives: number; totalLeaks: number; goldAtLastWaveStart: number; relicsGranted: number; relicUses: Array<{ wave: number; id: string }>;
  ordinaryRewardsOnly: boolean; ac128ac129Evidence: 'ordinary rewards only' | 'relic-assisted, not evidence for AC-128/AC-129';
};
describe.runIf(process.env.BALANCE_SIM === '1')('recorded balance simulations (scripted bot, not human playtests)', () => {
  const summary: SummaryRow[] = [];
  it.each(RUNS)('simulates $label', (options) => {
    const trace = runSimulation(options);
    expect(trace).toMatchObject({ simulated: true, debugAssisted: false, label: options.label, difficulty: options.difficulty, strategy: SIMULATION_STRATEGY });
    expect(trace.goldByWave[0]).toBe(DIFFICULTIES[options.difficulty].startingGold);
    if (options.continueEndless) expect(trace.endless.map((c) => c.wave)).toEqual([31, 35, 40]);
    mkdirSync(OUT, { recursive: true });
    writeFileSync(`${OUT}/${options.label}.json`, `${JSON.stringify(trace, null, 2)}\n`);
    summary.push({
      label: options.label, outcome: trace.outcome, simulatedMinutes: Math.round(trace.simulatedGameTimeMs / 600) / 100, gateFailures: verifyTrace(trace),
      wavesCompleted: trace.wavesCompleted, finalLives: trace.finalLives, totalLeaks: trace.leaksByWave.reduce((sum, n) => sum + n, 0),
      goldAtLastWaveStart: trace.goldAtLastWaveStart, relicsGranted: trace.relics.length, relicUses: trace.relicUses,
      ordinaryRewardsOnly: trace.ordinaryRewardsOnly,
      ac128ac129Evidence: trace.ordinaryRewardsOnly ? 'ordinary rewards only' : 'relic-assisted, not evidence for AC-128/AC-129'
    });
    writeFileSync(`${OUT}/summary.json`, `${JSON.stringify(summary, null, 2)}\n`);
    // Strategy adherence (Recipe step 9), asserted after writing so a failing run's trace is kept for the report.
    const started = trace.leaksByWave.length;
    expect(trace.bossWaves.map((b) => b.wave)).toEqual(Array.from({ length: started }, (_, i) => i + 1).filter((w) => w % 10 === 0));
    expect(trace.phaseEnds.map((e) => e.wave)).toEqual(Array.from({ length: started }, (_, i) => i + 1));
    expect(trace.lockedSteps.map((s) => s.wave)).toEqual(trace.phaseEnds.filter((e) => e.status === 'locked').map((e) => e.wave));
    for (const b of trace.bossWaves) {
      expect(b.targeting.length).toBeGreaterThan(0);
      expect(b.targeting.every((mode) => mode === 'strongest')).toBe(true);
      const used = trace.relicUses.filter((u) => u.wave === b.wave && u.id !== 'gold_rush').map((u) => u.id).sort();
      const expected = b.storedAtBossArrival === null ? [] : [...bossRelicsToActivate(b.storedAtBossArrival, b.livesAtBossArrival as number, b.maxLives)].sort();
      expect(used).toEqual(expected);
    }
    expect(trace.relicUses.every((u) => u.id === 'gold_rush' || u.wave % 10 === 0)).toBe(true);
    for (const s of trace.lockedSteps) if (s.cheapestFillerCost !== null) expect(s.goldAfterBuying).toBeLessThan(s.cheapestFillerCost);
    if (options.difficulty === 'medium' && started >= 10) {
      expect(trace.purchases.some((p) => p.wave === 10) || trace.lockedSteps.some((s) => s.wave === 10) || trace.phaseEnds.some((e) => e.wave === 10 && e.status === 'wait-gold')).toBe(true);
    }
  }, 600_000);
});
```
Recipe:
1. Scope and hard rules (user decision after T31: improve the bot before T24). Change only tests/helpers/simulationBot.ts, tests/simulation-bot.test.ts, artifacts/progression/balance/run-simulations.test.ts and the trace files that runner writes. Do not change game code, coefficients, configuration, waves, verifyTrace or any other gate, and do not tune anything to make a gate pass. Legitimate play only: the bot may call only init, update, tryBuild, purchaseSelected, purchaseContext, startNextWave, vault.resolve, vault.cancelTarget, resolveVictoryReward, chooseVictory, activatePowerup and castMeteor, and assign `Tower.targeting` (the field the inspector's targeting buttons set). It never calls grantPowerup itself (only T31's recording wrapper sits around it), handleQAAction, siege.seedForQA or publishQAStatus, never sells, never pauses and never changes speed (speed stays 1), so debugAssisted stays false. Every strategy rule is written into SIMULATION_STRATEGY (step 2) and nowhere else. This task is the one strategy revision round: implement exactly the strategy below; after the simulate run, fixing a defect that stops the bot from playing it (a throw, a use that does not happen) is allowed, changing the strategy again is not.
2. Replace SIMULATION_STRATEGY with this text, verbatim: 'Plan-first mixed build with a locked-step fallback: buy the T23 MIXED_BUILD steps in order as soon as each is affordable during preparation (evolve steps use the alternative branch when the profile has it unlocked). A step that is only unaffordable is saved for. A step that is locked (for example an evolution waiting for the wave-10 boss) does not hold the gold: meanwhile the bot buys the cheapest legal purchase among evolution ranks, foundation upgrades, evolutions and (in endless) mastery on existing towers, otherwise builds the cheapest tower on the best free plot. A step that is already complete or impossible (foundation already at level 4, tower already evolved, no free plot) is skipped. New towers go on the free plot with the most road within their level-1 range. After the plan the same cheapest-purchase rule applies. Targeting: every tower uses First, and Strongest on boss waves (every 10th wave). Relics: a reward is stored while a slot is free, otherwise discarded, except that a stored Gold Rush is used first to make room; on boss waves every stored Gold Rush is used during preparation before buying, and when a boss first comes within range of a tower every other stored relic is used at once (Meteor cast on the boss; Stronghold Repair only when at least 4 lives are missing); the victory decision only stores (slot free) or discards. 10 s of idle preparation at 1x before every wave; no selling, no pause, no speed change, no QA commands.'
3. Add the pure exports exactly as in Produces. `targetingForWave` and `goldRushIndex` decide boss waves with `buildWave(wave).isBossWave` (imported from src/game/systems/WaveSystem.ts, which the bot already imports). `bossRelicsToActivate` keeps stored order and duplicates. Import `type PurchaseResult` from EvolutionSystem.ts, `POWERUP_EFFECTS` from powerUps.ts, `type Enemy` from src/game/entities/Enemy.ts and `type TargetingMode` from src/shared/types.ts. Extend the private `Run` interface with `activatePowerup(index: number): void; castMeteor(x: number, y: number): void; enemies: Enemy[]; maxLives: number;`.
4. Purchases. Move T31's after-plan selection (cheapest legal purchase on bot towers, else the cheapest tower on the best free plot; returns `{ candidate, hasNext }`) into `fillerCandidate()`, unchanged except that it also returns `cheapestCost: number | null` (the chosen candidate's cost before the affordability check, i.e. `best.cost`; null when it returns hasNext: false). Rewrite `nextCandidate()` to return `{ candidate, fromPlan, hasNext, locked, cheapestCost }`, with `locked: true` only on the 'locked' return below (every other return has `locked: false`; buyPhase reads `cheapestCost` only from a locked result). Every return also carries `status: PlanStepStatus | 'after-plan'`: the plan-build return gives 'buy' when gold >= cost and 'wait-gold' otherwise, each switch return gives its planStepStatus value ('buy', 'wait-gold' or 'locked'), and the final return after the loop gives 'after-plan':
```
while planIndex < MIXED_BUILD.length:
  planned = MIXED_BUILD[planIndex]
  if planned.intent === 'build':
    plot = bestPlot(occupied, TOWERS[id].levels[0].range)
    if plot === null: planIndex++; continue                                   // skip: no free plot
    cost = TOWERS[id].levels[0].cost
    return gold >= cost ? { build candidate, fromPlan: true, hasNext: true } : { candidate: null, fromPlan: true, hasNext: true }
  tower = first bot tower whose towerId === planned.towerId
  if !tower: planIndex++; continue                                              // skip: its build was skipped
  intent = planned.intent.kind === 'evolve' ? { kind: 'evolve', branchId: branchFor(id) } : planned.intent
  dry = purchaseEvolution(id, tower.progression, intent, { ...purchaseContext(), gold: Number.MAX_SAFE_INTEGER }, tower.progression.revision)
  switch planStepStatus(dry, gold):
    'skip':      planIndex++; continue
    'buy':       return { purchase candidate with cost dry.cost, fromPlan: true, hasNext: true }
    'wait-gold': return { candidate: null, fromPlan: true, hasNext: true }
    'locked':    f = fillerCandidate(); return { candidate: f.candidate, fromPlan: false, hasNext: true, locked: true, cheapestCost: f.cheapestCost }   // the plan still has a step
return { ...fillerCandidate(), fromPlan: false }
```
   In `buyPhase`, advance planIndex after a successful execution only when `fromPlan` is true (T31 advanced it after every purchase while plan steps remained). `execute`, purchase recording and the AC-130 wait counter are unchanged. Count successful executions with `fromPlan: false` made while `locked` was true as `fillerBought`; when the phase stops and the last `nextCandidate()` result had `locked: true`, push `{ wave, fillerBought, goldAfterBuying: gold, cheapestFillerCost: <that result's cheapestCost> }` to a `lockedSteps` array declared inside `simulate` (no entry for a phase that ended on a 'buy', 'wait-gold' or after-plan result). Whenever a buy phase stops, whatever stopped it, also push `{ wave, status: <that last nextCandidate() result's status> }` to a `phaseEnds` array declared inside `simulate`. That gives exactly one entry per buy phase, so one per started wave, and the trace records which status ended each phase.
5. Relics. Add `relicUses` and these helpers inside `simulate`:
```
useStored(wave, index, boss: Enemy | null):
  id = vault.stored[index]; before = vault.stored.length
  activatePowerup(index)
  if id === 'meteor_strike' and vault.target and boss: castMeteor(boss.x, boss.y)
  if vault.stored.length >= before:
    if vault.target: vault.cancelTarget()
    throw Error(`relic ${id} could not be used at wave ${wave}`)
  relicUses.push({ wave, id }); mark the earliest relics entry with this id and used === false as used = true

prepareRelics(wave):                       // replaces T31's preparation call resolvePending((choice) => vault.resolve(choice))
  loop:
    if siege.phase is not 'victory' and not 'terminal':
      i = goldRushIndex(vault.stored, wave, vault.pending.length)
      if i >= 0: useStored(wave, i, null); continue
    if vault.pending.length === 0: break
    before = vault.pending.length
    vault.resolve(vault.stored.length < POWERUP_INVENTORY_LIMIT ? 'store' : 'discard-new')
    if vault.pending.length >= before: throw Error(`relic reward could not be resolved at wave ${wave}`)
```
   The victory decision keeps T31's `resolvePending((choice) => resolveVictoryReward(choice))` unchanged (store while a slot is free, otherwise discard; relics cannot be used there).
   Attribution limit (stated, not removed; discards are not tracked): export `RELIC_ATTRIBUTION_NOTE` with this text, verbatim: 'relics[].used is attributed, not tracked: each use marks the earliest grant of the same relic not yet marked, so when an earlier copy was discarded a later grant may be marked instead. relicUses (the wave and relic of every use) and the number of used grants per relic are exact.', and return it as the trace's `relicAttribution`.
6. Wave loop changes (everything else in T31 Recipe step 4 stays):
```
prepareRelics(wave); { bought, hasNext } = buyPhase(wave)            // AC-130 wait counter as before
for each tower in towers: tower.targeting = targetingForWave(wave)
idle PREP_MS as before; goldAtLastWaveStart = gold; livesBefore = lives; startNextWave() ...
bossWave = buildWave(wave).isBossWave                                  // once per wave, before the step loop (never per step)
if bossWave: record = { wave, targeting: towers.map((t) => t.targeting), storedAtBossArrival: null, livesAtBossArrival: null, maxLives }; bossWaves.push(record)
bossRelicsDone = false
while waveActive and not ended:
  step(); timeout check as before
  if bossWave and not bossRelicsDone and not ended and siege.phase not in ('victory', 'terminal'):   // a step that ends the run or wins the siege uses no relic (useStored would throw); storedAtBossArrival stays null
    boss = first enemy with alive and isBoss and some tower with Math.hypot(tower.x - boss.x, tower.y - boss.y) <= tower.stats.range
    if boss: bossRelicsDone = true; record.storedAtBossArrival = [...vault.stored]; record.livesAtBossArrival = lives
             for id of bossRelicsToActivate(record.storedAtBossArrival, lives, maxLives): useStored(wave, vault.stored.indexOf(id), boss)
```
   In the returned trace add `relicUses`, `goldAtLastWaveStart` (0 when no wave started), `bossWaves`, `lockedSteps`, `phaseEnds` and `relicAttribution: RELIC_ATTRIBUTION_NOTE`, and set `ordinaryRewardsOnly: !relicUses.some((u) => GOLD_RELICS.has(u.id))`. Tower Overcharge's random tower and Ancient Blessing's roll use the seeded Math.random spy, so runs stay deterministic. Waves 1–3 behave exactly as in T31 unless the inventory fills, so the 3-wave determinism test keeps its meaning.
7. Replace tests/simulation-bot.test.ts and artifacts/progression/balance/run-simulations.test.ts with the files above. The runner stays gated by `describe.runIf(process.env.BALANCE_SIM === '1')`, so the default `npm test` (and `npm run deploy`) skips it; the bot test stays fast and in the default suite.
8. Before running, note the T31 baseline from the current traces/summary.json: medium-starter-1, medium-starter-2 and medium-unlocked-1 siege-failed at wave 10 (9 waves completed, about 7.4 simulated minutes, 628 gold unspent at wave 10 in medium-starter-1, no relic ever used); hard-1 siege-failed at wave 10 (7.64 minutes); easy-1 reached wave 30 and lost to the final boss with 0 fully evolved towers (26 minutes). Then run the simulate command once (Green) and record the new summary.json per run: outcome, wavesCompleted, finalLives, totalLeaks, goldAtLastWaveStart, relicsGranted, relicUses, ordinaryRewardsOnly, ac128ac129Evidence and gateFailures, next to the baseline.
9. Evidence that the bot plays the strategy (required whether it wins or loses): the runner (step 7 file) asserts it for every run after writing the trace and summary.json: the bossWaves entries are exactly the started boss waves (every 10th wave up to leaksByWave.length) and on each all towers target 'strongest'; the non-Gold-Rush relics used on a boss wave are exactly bossRelicsToActivate(storedAtBossArrival, livesAtBossArrival, maxLives), and none when no boss came within range; relics other than Gold Rush are used only on boss waves; every lockedSteps entry ended with less gold than its cheapest fallback candidate (a locked step did not hold the gold); phaseEnds has exactly one entry per started wave and its 'locked' entries are exactly the lockedSteps waves; and every Medium run that started wave 10 either bought something at wave 10, has a wave-10 lockedSteps entry (gold below the cheapest legal purchase), or ended its wave-10 buy phase on a 'wait-gold' plan step (phaseEnds; saving for an open plan step it cannot yet afford is the strategy). The T35 unit tests prove the plan-step, targeting and relic decisions, including Gold Rush only on boss waves or with a full inventory. A failing adherence assertion is a bot defect: fix the bot so it plays the strategy as written (step 1), never the assertion. A wave-10 buy phase that ended on 'wait-gold' already satisfies the wave-10 assertion and is not a defect. T35 passes whether or not the bot wins, as long as these assertions pass. Relic-assisted runs: verifyTrace and gateFailures stay unchanged and verifyTrace never reads ordinaryRewardsOnly, so for a run with `ordinaryRewardsOnly: false` (it used Gold Rush, Double Bounty, Treasure Goblin or Ancient Blessing) the AC-128 (first evolution) and AC-129 (first rank 2) results are 'relic-assisted, not evidence for AC-128/AC-129' (summary.json ac128ac129Evidence) and are never reported as a pass, even when gateFailures lists no AC-128/AC-129 failure; the T23 deterministic ordinary-economy test (tests/progression-balance.test.ts, 'deterministic ordinary economy (Medium, no relics, no selling)') stays the ordinary-income evidence for AC-128/AC-129. T24 inherits this rule. Whenever relics[].used is cited, state the attribution limit (RELIC_ATTRIBUTION_NOTE). Report the outcome honestly to the team lead: a win, or a loss with the wave, the gold left at the start of the losing wave, the relics used and the leaks, plus each run's ac128ac129Evidence. Never relax a gate, change a coefficient or revise the strategy further inside this task; a loss stays a bot-competence result for T24 to report under AC-135.
Red:    `npm test -- tests/simulation-bot.test.ts` → fails: strategy helpers and `relicUses` missing (planStepStatus is not a function; trace.relicUses is undefined)
Green:  `npm test -- tests/simulation-bot.test.ts` → all tests pass; `$env:BALANCE_SIM='1'; npm test -- artifacts/progression/balance` (the Verify block's simulate command) → passes, including the step 9 strategy-adherence assertions, and rewrites the five traces and traces/summary.json with the new strategy text, relicUses, goldAtLastWaveStart, bossWaves, lockedSteps, phaseEnds, relicAttribution, ordinaryRewardsOnly and ac128ac129Evidence; the recorded outcome per run (win or still losing), each run's ac128ac129Evidence and the step 9 evidence are reported to the team lead; default `npm test` skips the runner
Verify: `npm run typecheck` → no errors; `npm test` → every file passes
Commit: Strengthen the simulation bot's strategy

### T24 — Recorded playtests, branch comparison and tuning evidence (old Task 9)   [x] done
Satisfies: AC-5, AC-32, AC-126, AC-127, AC-128, AC-129, AC-130, AC-131, AC-133, AC-134, AC-135, AC-136
Depends on: T22, T23, T31, T35
Router summary: Run the headless simulation bot for the required runs (two Medium fresh-profile, one Medium unlocked-profile, Easy, Hard, and endless to waves thirty-one, thirty-five and forty), compute an equal-investment comparison of each branch pair across four roles from the real combat engine, and write the simulation report and branch comparison. The report states plainly that these are scripted simulations, not human playtests. Gates are judged and conflicts reported; nothing is tuned.
Files:
  - create  artifacts/progression/balance/branch-comparison.test.ts   (not type-checked; may import node:fs)
  - create  artifacts/progression/balance/branch-comparison.json      (written by the test above)
  - create  artifacts/progression/balance/playtests.md
  - create  artifacts/progression/balance/branch-comparison.md
Consumes: T35 artifacts/progression/balance/run-simulations.test.ts (rewrites traces/medium-starter-1.json, medium-starter-2.json with endless checkpoints 31/35/40, medium-unlocked-1.json, easy-1.json, hard-1.json and traces/summary.json `Array<{ label: string; outcome: string; simulatedMinutes: number; gateFailures: string[]; wavesCompleted: number; finalLives: number; totalLeaks: number; goldAtLastWaveStart: number; relicsGranted: number; relicUses: Array<{ wave: number; id: string }>; ordinaryRewardsOnly: boolean; ac128ac129Evidence: 'ordinary rewards only' | 'relic-assisted, not evidence for AC-128/AC-129' }>`, and asserts strategy adherence per run), T35 tests/helpers/simulationBot.ts `SimulationTrace` (the T31 fields plus `relicUses: Array<{ wave: number; id: PowerUpId }>`, `goldAtLastWaveStart: number` (gold left after buying when the last started wave began), `bossWaves: Array<{ wave: number; targeting: TargetingMode[]; storedAtBossArrival: PowerUpId[] | null; livesAtBossArrival: number | null; maxLives: number }>`, `lockedSteps: Array<{ wave: number; fillerBought: number; goldAfterBuying: number; cheapestFillerCost: number | null }>`, `phaseEnds: Array<{ wave: number; status: 'buy' | 'wait-gold' | 'locked' | 'skip' | 'after-plan' }>` (the plan status that ended each buy phase, one entry per started wave), `relicAttribution: string`, and `ordinaryRewardsOnly: boolean`, true only when no gold relic (gold_rush, double_bounty, treasure_goblin, ancient_blessing) was used), T35 `SIMULATION_STRATEGY` and `RELIC_ATTRIBUTION_NOTE`; T35 Recipe step 9 rule: AC-128/AC-129 results from a run with `ordinaryRewardsOnly: false` are 'relic-assisted, not evidence for AC-128/AC-129', never a pass, because verifyTrace (unchanged) never reads ordinaryRewardsOnly; T23 tests/progression-balance.test.ts 'deterministic ordinary economy (Medium, no relics, no selling)' as the ordinary-income evidence for AC-128/AC-129; T23 `verifyTrace` gate wording and the nine-plot check in tests/progression-balance.test.ts; T3 `EvolutionCombat.makeShot(owner, towers, damageMultiplier, primary?)`, `damage(raw, type, target, nowMs, shot?)`, `primaryHit(shot, target, nowMs, killed?)`, `statuses(enemyId, nowMs): StatusView`, `addField(shot, x, y, nowMs)`, `tickFields(nowMs): FieldTick[]`, `volleyTargets(candidates, tower, stats, mode)`, `nextChainTarget(candidates, point, visited)`, `chainShot(previous)`; T2 `effectiveStats(id, state)`, `nextPurchaseCost(id, state, intent)`, `purchaseEvolution(id, state, intent, context, expectedRevision)`; T1 EVOLUTIONS, STARTER_BRANCH, ALTERNATIVE_BRANCH, TOWER_IDS; T2 tests/helpers/evolutionFixtures.ts `tower(branch = 'marksman', rank = 0, id = 1): CombatTower` (at 0,0), `victim(id = 1, x = 0, y = 0): CombatVictim`.
Produces: branch-comparison.json `{ method: string; rows: Array<{ towerId; rank: 0 | 3; investment: number; starter: { branch } & Record<Role, number>; alternative: { branch } & Record<Role, number>; starterBetter: Role[]; alternativeBetter: Role[]; dominated: boolean }>; mastery: Array<{ branch; ranks: Array<{ next; cost; damage }>; limitAt100000: string | null }> }` with Role = 'boss' | 'armored' | 'crowd' | 'support'; playtests.md opening with the exact sentence "These are simulations from a scripted bot, not human playtests." followed by "The AC-128–AC-133 timing and duration gates are therefore reported as 'simulated pass/fail, unverified by human play'.", then method (SIMULATION_STRATEGY, 50 ms steps, 10 s preparation per wave at 1x, seeds), a gate table per run (first evolution wave, first rank-2 wave, fully evolved at victory, longest forced wait in waves 11–29, simulated 1x duration in seconds and minutes labelled "simulated game time, not human playtime", nine-plot check, verifyTrace failures), outliers explained, endless notes at 31/35/40 (lives, leaks, scheduled enemy HP rising, mastery ranks and next costs), mastery arithmetic from branch-comparison.json, AC-135 conflicts, and what remains unverified (human play, retention); branch-comparison.md: one table per archetype × rank 0/3 with the four role scores, the winner of each role, the dominated flag and the model's limits.
Reuse: the T35 runner (run-simulations.test.ts) and bot; the real combat engine and purchase functions; verifyTrace wording from T23. No dependency added.
Tests (complete): artifacts/progression/balance/branch-comparison.test.ts
```ts
import { writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ALTERNATIVE_BRANCH, EVOLUTIONS, STARTER_BRANCH } from '../../../src/game/config/evolutions.ts';
import { TOWER_IDS } from '../../../src/game/config/towers.ts';
import { EvolutionCombat, chainShot, nextChainTarget, volleyTargets } from '../../../src/game/systems/EvolutionCombat.ts';
import { effectiveStats, nextPurchaseCost, purchaseEvolution } from '../../../src/game/systems/EvolutionSystem.ts';
import type { BranchId, CombatTower, CombatVictim, EvolutionRank } from '../../../src/shared/progression.ts';
import { tower, victim } from '../../../tests/helpers/evolutionFixtures.ts';

type Role = 'boss' | 'armored' | 'crowd' | 'support';
const ROLES: Role[] = ['boss', 'armored', 'crowd', 'support'], WINDOW_MS = 10_000, STEP_MS = 100;
function foes(role: Role): CombatVictim[] {
  return Array.from({ length: role === 'crowd' ? 8 : 1 }, (_, k) => {
    const v = victim(100 + k, 40 + 6 * k, 0); v.hp = v.maxHp = 1e9;
    if (role === 'boss') v.isBoss = true;
    if (role === 'armored') { v.physicalArmor = 0.55; v.wardArmor = 0.55; }
    return v;
  });
}
/** Instant hits, immortal targets; damage per second divided by the first target's mean speed factor (damage per stretch of road). */
function score(branch: BranchId, rank: EvolutionRank, role: Role): number {
  const engine = new EvolutionCombat(), main = tower(branch, rank, 1), targets = foes(role);
  const team: CombatTower[] = role === 'support' ? [main, { ...tower(null, 0, 2), x: 30 }, { ...tower(null, 0, 3), x: -30 }] : [main];
  const ready = new Map<number, number>(team.map((t) => [t.id, 0]));
  let dealt = 0, speed = 0, steps = 0;
  for (let now = 0; now < WINDOW_MS; now += STEP_MS) {
    for (const t of team) {
      if ((ready.get(t.id) ?? 0) > now) continue;
      const shot = engine.makeShot(t, team, 1), st = shot.stats;
      ready.set(t.id, now + st.attackInterval * 1000);
      for (const target of st.volleyTargets > 1 ? volleyTargets(targets, t, st, 'first') : [targets[0]]) {
        if (st.splashRadius) {
          for (const v of targets) if (Math.hypot(v.x - target.x, v.y - target.y) <= st.splashRadius) dealt += engine.damage(shot.rawDamage, st.damageType, v, now, shot);
          engine.primaryHit(shot, target, now); engine.addField(shot, target.x, target.y, now);
        } else {
          dealt += engine.damage(shot.rawDamage, st.damageType, target, now, shot); engine.primaryHit(shot, target, now);
          const hit = new Set([target.id]); let jump = shot, from: CombatVictim = target;
          for (let k = 1; st.chainCount && k < st.chainCount; k++) {
            const next = nextChainTarget(targets, from, hit); if (!next) break;
            jump = chainShot(jump); dealt += engine.damage(jump.rawDamage * 0.75, st.damageType, next, now, jump); hit.add(next.id); from = next;
          }
        }
      }
    }
    for (const tick of engine.tickFields(now)) for (const v of targets) if (Math.hypot(v.x - tick.x, v.y - tick.y) <= tick.radius) dealt += engine.damage(tick.rawDamage, 'elemental', v, tick.atMs);
    const s = engine.statuses(targets[0].id, now); speed += s.frozen || s.stunned ? 0 : 1 - s.slowFactor; steps++;
  }
  return dealt / (WINDOW_MS / 1000) / Math.max(0.05, speed / steps);
}
describe.runIf(process.env.BALANCE_SIM === '1')('equal-investment branch comparison and mastery arithmetic (computed, not observed play)', () => {
  it('writes branch-comparison.json', () => {
    const rows = TOWER_IDS.flatMap((id) => ([0, 3] as EvolutionRank[]).map((rank) => {
      const s = STARTER_BRANCH[id], a = ALTERNATIVE_BRANCH[id];
      const invest = (b: BranchId) => EVOLUTIONS[b].stats.slice(0, rank + 1).reduce((sum, row) => sum + row.cost, 0);
      expect(invest(s)).toBe(invest(a));
      const starter = Object.fromEntries(ROLES.map((r) => [r, score(s, rank, r)])) as Record<Role, number>;
      const alternative = Object.fromEntries(ROLES.map((r) => [r, score(a, rank, r)])) as Record<Role, number>;
      for (const value of [...Object.values(starter), ...Object.values(alternative)]) expect(Number.isFinite(value)).toBe(true);
      const starterBetter = ROLES.filter((r) => starter[r] > alternative[r]), alternativeBetter = ROLES.filter((r) => alternative[r] > starter[r]);
      return { towerId: id, rank, investment: invest(s), starter: { branch: s, ...starter }, alternative: { branch: a, ...alternative }, starterBetter, alternativeBetter, dominated: starterBetter.length === 4 || alternativeBetter.length === 4 };
    }));
    const mastery = (Object.keys(EVOLUTIONS) as BranchId[]).map((branch) => {
      const id = EVOLUTIONS[branch].towerId, r3 = tower(branch, 3).progression;
      const ranks = Array.from({ length: 10 }, (_, m) => ({ next: m + 1, cost: nextPurchaseCost(id, { ...r3, masteryRank: m }, { kind: 'mastery' }), damage: effectiveStats(id, { ...r3, masteryRank: m + 1 }).damage }));
      ranks.forEach((row, i) => { expect(Number.isSafeInteger(row.cost)).toBe(true); if (i > 0) expect(row.cost as number).toBeGreaterThan(ranks[i - 1].cost as number); });
      const limit = purchaseEvolution(id, { ...r3, masteryRank: 100000 }, { kind: 'mastery' }, { gold: Number.MAX_SAFE_INTEGER, evolutionOpen: true, endless: true, blocked: false, unlocked: new Set<BranchId>() }, 0);
      expect(limit).toEqual({ ok: false, reason: 'numeric limit reached' });
      return { branch, ranks, limitAt100000: limit.ok ? null : limit.reason };
    });
    expect(rows).toHaveLength(10);
    writeFileSync('artifacts/progression/balance/branch-comparison.json', `${JSON.stringify({ method: 'EvolutionCombat instant-hit model, 10 s window, 100 ms steps, immortal targets 40-82 px from the tower; score = damage per second / mean speed factor of the first target; support adds two level-4 Rangers at 30 px', rows, mastery }, null, 2)}\n`);
  });
});
```
Recipe:
1. Run the Verify block's `simulate` command (`$env:BALANCE_SIM='1'; npm test -- artifacts/progression/balance`; runs the T35 runner (run-simulations.test.ts) and bot and the branch comparison, which are gated and skipped by the default `npm test`) and read the five traces and traces/summary.json. Use no ?qa state and no QA command anywhere.
2. Create branch-comparison.test.ts exactly as above (gated by BALANCE_SIM and not type-checked, so the default `npm test` skips it) and run it with the simulate command; it writes branch-comparison.json. The test asserts only equal investment, finite numbers and safe mastery arithmetic; it does not assert non-dominance, so a dominating branch is reported, not hidden.
3. Write playtests.md as described in Produces. The first two sentences are verbatim. Every AC-128–AC-133 timing or duration result is labelled 'simulated pass/fail, unverified by human play'; AC-128 and AC-129: read ordinaryRewardsOnly and ac128ac129Evidence for each run from summary.json; for a run with `ordinaryRewardsOnly: false` label its first-evolution and first-rank-2 results 'relic-assisted, not evidence for AC-128/AC-129' (never a pass, even when its gateFailures lists no AC-128/AC-129 failure) and list the gold relics it used (from relicUses, with waves); only runs with `ordinaryRewardsOnly: true` and the T23 deterministic ordinary-economy test count as AC-128/AC-129 evidence. Each run's gate table also gives goldAtLastWaveStart, relicUses (wave and relic) and, per boss wave from bossWaves, the towers' targeting and the relics stored when the boss arrived; wherever relics[].used is cited, quote the trace's relicAttribution (RELIC_ATTRIBUTION_NOTE) as the attribution limit. AC-132 cites the T23 nine-plot test; AC-136 cites the endless checkpoints and the mastery table. Make no claim of universal balance or measured retention.
4. Write branch-comparison.md from branch-comparison.json only (numbers copied, not estimated), explaining the model and its limits (instant hits, immortal targets, fixed geometry).
5. AC-135: when the bot loses the siege in any run, report that run as a bot-competence limit, with the losing wave, goldAtLastWaveStart (gold left at the start of the losing wave), its relicUses and leaksByWave from the trace, separate from balance verdicts (siegeWon false; fully-evolved, duration and endless checkpoints 'not reached because the bot lost'), escalate it to the team lead, and make no strategy change without lead approval, never to pass a gate. Also, when a gate fails, gates conflict, or any row has dominated: true, record the gate, measured values and conflict in the report and report it to the team lead. A relic-assisted run (`ordinaryRewardsOnly: false`) is never reported as an AC-128/AC-129 pass and never settles an AC-128/AC-129 failure or conflict: report it under step 3's 'relic-assisted, not evidence for AC-128/AC-129' label. Never weaken a gate, change the strategy to make a gate pass, or edit coefficients here; coefficient changes return as fix tasks and must rerun T23, the T35 runner (run-simulations.test.ts) and bot, and this task.
Red:    `npm test -- artifacts/progression/balance/branch-comparison.test.ts` → fails: no test file found (before the file exists)
Green:  `$env:BALANCE_SIM='1'; npm test -- artifacts/progression/balance` (the Verify block's simulate command) → passes, writes branch-comparison.json and rewrites the traces; default `npm test` skips both writers
Verify: Manual: (user confirms) playtests.md opens with "These are simulations from a scripted bot, not human playtests." and reports the AC-128–AC-133 timing/duration gates as 'simulated pass/fail, unverified by human play'; traces exist for medium-starter-1, medium-starter-2 (endless checkpoints 31/35/40), medium-unlocked-1, easy-1 and hard-1 plus summary.json; every gate (AC-128–AC-133, AC-136) is marked pass, fail, 'relic-assisted, not evidence for AC-128/AC-129' (AC-128/AC-129 only, matching summary.json `ac128ac129Evidence`) or 'not reached because the bot lost', each with an explanation; branch-comparison.md is built from branch-comparison.json and shows no branch dominating its alternative in all four roles, or the conflict is reported; no gate was weakened (AC-135)
Commit: Record simulated balance runs and branch comparison

### T32 — Format printed tower stats (fix F1)   [x] done
Satisfies: AC-62, AC-65
Depends on: T22
Router summary: Tower stats in the Tower Progression sheet, the inspector rows and the next-level previews print raw floating-point values such as a range of 214.50000000000003 or an attack of 0.36000000000000004 seconds. Add one small formatting helper (whole numbers for damage, range and splash, two decimals for attack interval) and use it everywhere these stats are printed, with tests that no long decimals appear.
Files:
  - modify  src/game/ui/progressionView.ts   (add StatKind, formatStat)
  - modify  src/game/scenes/GameScene.ts     (lines 453, 1162, 1163, 1183, 1184, 1200, 1202)
  - create  tests/stat-format.test.ts
Consumes: existing: src/shared/types.ts `TowerLevelStats { damage: number; range: number; attackInterval: number; damageType: DamageType; splashRadius?: number; … }`; existing GameScene prints (found by grep `\$\{[^}]*(attackInterval|\.range|\.damage|splashRadius)` over src/ — no other file prints tower stats): drawProgressionModel line 453 `Damage ${st.damage} · Range ${st.range} · Attack ${st.attackInterval}s · ${st.damageType}`; compact inspector 1162 (`st.attackInterval.toFixed(2)`, raw `st.range`) and 1163 (`next.damage`, `next.range`, `next.attackInterval`); desktop rows 1183 (`${st.damage}`, `${st.attackInterval.toFixed(2)}s`, `${st.range}`) and 1184 (`${st.splashRadius}`); upgrade previews 1200 and 1202; existing ScrollSheet.text uses `scene.add.text(12, y, value, …)`; components.statRow(scene, parent, y, key, value, width); T19 drawSheet 'evolve' allowed on inspector layouts.
Produces:
```ts
// src/game/ui/progressionView.ts
export type StatKind = 'damage' | 'range' | 'attackInterval' | 'splashRadius';
export function formatStat(kind: StatKind, value: number): string; // damage, range, splashRadius → String(Math.round(value)); attackInterval → value.toFixed(2)
```
Reuse: Number.prototype.toFixed and Math.round; the existing `toFixed(2)` convention at GameScene.ts:1162 and :1183. Searched src/game/ui and src/game/systems for an existing number formatter: none. No dependency added.
Tests (complete): tests/stat-format.test.ts
```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
const ui = vi.hoisted(() => {
  function anyStub(): any {
    const proxy: any = new Proxy(function () { return proxy; }, { get: (_t, key) => (key === 'then' ? undefined : key === Symbol.toPrimitive ? () => 0 : proxy), apply: () => proxy });
    return proxy;
  }
  return { anyStub, texts: [] as string[] };
});
vi.mock('phaser', () => ({ default: { Scene: class { constructor(_key?: string) {} }, Scenes: { Events: { SHUTDOWN: 'shutdown' } }, Scale: { Events: { RESIZE: 'resize' } } } }));
vi.mock('../src/game/ui/components.ts', () => ({
  button: () => ({ box: ui.anyStub(), text: ui.anyStub() }), panel: () => ui.anyStub(), etchedFrame: () => ui.anyStub(),
  statRow: (_s: unknown, _c: unknown, _y: number, key: string, value: string) => { ui.texts.push(`${key} ${value}`); }
}));
import { GameScene } from '../src/game/scenes/GameScene.ts';
import { Tower } from '../src/game/entities/Tower.ts';
import { SoundManager } from '../src/game/systems/SoundManager.ts';
import { EVOLUTIONS } from '../src/game/config/evolutions.ts';
import { TOWER_IDS } from '../src/game/config/towers.ts';
import { effectiveStats } from '../src/game/systems/EvolutionSystem.ts';
import { formatStat } from '../src/game/ui/progressionView.ts';
import { gameLayout } from '../src/game/ui/layout.ts';
import type { BranchId, EvolutionRank } from '../src/shared/progression.ts';

interface Run { sheetKind: string | null; selectedTower: Tower | null; towers: Tower[]; drawSheet(): void; refreshInfoPanel(): void; }
const recordingAdd = () => new Proxy({}, { get: (_t, key) => (key === 'text' ? (_x: number, _y: number, value: string) => { ui.texts.push(String(value)); return ui.anyStub(); } : () => ui.anyStub()) });
function sceneWith(t: Tower): Run {
  vi.spyOn(SoundManager, 'get').mockReturnValue(ui.anyStub());
  const scene = new GameScene(); scene.init({ difficulty: 'medium' });
  const run = scene as unknown as Run, loose = scene as unknown as Record<string, unknown>;
  for (const name of ['updateHUD', 'showTouchPreview', 'drawCatalog', 'hideGhost']) loose[name] = () => {};
  loose.add = recordingAdd(); loose.uiRoot = ui.anyStub(); loose.input = ui.anyStub(); loose.game = ui.anyStub(); loose.layout = gameLayout(1280, 720);
  run.towers = [t]; run.selectedTower = t; ui.texts.length = 0;
  return run;
}
function evolved(branch: BranchId, rank: EvolutionRank): Tower {
  const t = new Tower(EVOLUTIONS[branch].towerId, 100, 100, 0);
  t.progression = { ...t.progression, foundationLevel: 4, branchId: branch, rank };
  return t;
}
const RAW_FLOAT = /\d\.\d{3,}/;
const cases = (Object.keys(EVOLUTIONS) as BranchId[]).flatMap((b) => ([0, 1, 2, 3] as EvolutionRank[]).map((r) => [b, r] as const));
afterEach(() => vi.restoreAllMocks());

describe('formatStat', () => {
  it('prints whole damage, range and splash and a two-decimal attack interval', () => {
    expect(formatStat('range', 214.50000000000003)).toBe('215');
    expect(formatStat('range', 195)).toBe('195');
    expect(formatStat('attackInterval', 0.36000000000000004)).toBe('0.36');
    expect(formatStat('attackInterval', 1)).toBe('1.00');
    expect(formatStat('damage', 151.99999999999997)).toBe('152');
    expect(formatStat('splashRadius', 90)).toBe('90');
  });
});

describe('printed tower stats', () => {
  it.each(cases)('Tower Progression sheet prints formatted stats for %s rank %i', (branch, rank) => {
    const t = evolved(branch, rank), run = sceneWith(t); run.sheetKind = 'evolve'; run.drawSheet();
    const s = effectiveStats(t.towerId, t.progression);
    expect(ui.texts).toContain(`Damage ${formatStat('damage', s.damage)} · Range ${formatStat('range', s.range)} · Attack ${formatStat('attackInterval', s.attackInterval)}s · ${s.damageType}`);
    expect(ui.texts.filter((text) => RAW_FLOAT.test(text))).toEqual([]);
  });
  it.each(cases)('desktop inspector prints no raw float for %s rank %i', (branch, rank) => {
    const run = sceneWith(evolved(branch, rank)); run.refreshInfoPanel();
    expect(ui.texts.filter((text) => RAW_FLOAT.test(text))).toEqual([]);
  });
  it.each([...TOWER_IDS].flatMap((id) => [1, 2, 3].map((level) => [id, level] as const)))('desktop upgrade preview is formatted for %s level %i', (id, level) => {
    const t = new Tower(id, 100, 100, 0); t.progression = { ...t.progression, foundationLevel: level };
    const run = sceneWith(t); run.refreshInfoPanel();
    expect(ui.texts.filter((text) => RAW_FLOAT.test(text))).toEqual([]);
  });
});
```
Recipe:
1. progressionView.ts: add StatKind and formatStat per Produces.
2. GameScene.ts: extend the `../ui/progressionView.ts` import with formatStat and route every listed print through it — line 453 becomes `Damage ${formatStat('damage', st.damage)} · Range ${formatStat('range', st.range)} · Attack ${formatStat('attackInterval', st.attackInterval)}s · ${st.damageType}`; lines 1162–1163 and 1200–1202 format the current and next damage, range and attack values the same way (keep the surrounding words, arrows and line breaks); rows 1183–1184 use formatStat for Damage, Attack (keep the `s` suffix), Range and Splash. Chain count and slow percentage stay unchanged (already integers).
3. Re-run the grep from Consumes; no raw `st.`/`next.` damage, range, attack or splash interpolation may remain. Change no layout, size or position.
Red:    `npm test -- tests/stat-format.test.ts` → fails: formatStat is not a function
Green:  `npm test -- tests/stat-format.test.ts` → all tests pass
Verify: `npm run typecheck` → no errors; `npm test` → every file passes
Commit: Format tower stats in the progression sheet and inspector

### T33 — Short-landscape Tower Progression sheet and QA seed HUD refresh (fix F4, F3)   [x] done
Satisfies: AC-65, AC-121, AC-122
Depends on: T22
Router summary: On a short landscape phone screen the Tower Progression sheet is only about 130 pixels tall, so the evolve or mastery button sits below the fold with no hint. Make the tower and progression sheets nearly field-height on short landscape layouts, keep every other layout unchanged, and make the development evolution and mastery fixtures refresh the top bar so it shows the seeded wave and gold.
Files:
  - modify  src/game/ui/layout.ts           (add sheetBounds)
  - modify  src/game/scenes/GameScene.ts    (drawSheet uses sheetBounds; 'evolution' and 'mastery' QA seeds call updateHUD)
  - create  tests/compact-sheet.test.ts
Consumes: existing: src/game/ui/layout.ts `interface GameLayout { width; height; hud; tray; inspector; compact; narrow; field: { x; y; width; height } }`, `gameLayout(width, height)` (844x390 → compact, hud 56, tray 64, field.height 270); existing GameScene.drawSheet lines 401–404: `const kind = this.sheetKind; const width = Math.min(480, this.layout.width - 16); const height = Math.max(96, this.layout.field.height * .5 - (this.touchPreview ? 80 : 0)); const bounds = { x: (this.layout.width - width) / 2, y: this.layout.height - this.layout.tray - height - (this.touchPreview ? 56 : 0), width, height };`; existing ScrollSheet (ScrollSheet.ts) — viewport height is bounds.height − 52, controls are 44 px and hidden when below the viewport, `readonly bounds` keeps height; existing handleQAAction cases 'evolution' (ends `this.gold = 2000; this.refreshInfoPanel();`) and 'mastery' (ends `this.gold = 50000;`); T17 QAAction `{ type: 'seed'; state: 'evolution' | 'mastery' | … }`.
Produces:
```ts
// src/game/ui/layout.ts
export function sheetBounds(layout: GameLayout, kind: 'build' | 'tower' | 'more' | 'relics' | 'next' | 'evolve', touchPreview: boolean): GameLayout['field'];
// width = Math.min(480, layout.width - 16); x = (layout.width - width) / 2
// shortLandscape = layout.compact && layout.width > layout.height && !touchPreview && (kind === 'tower' || kind === 'evolve')
// height = shortLandscape ? Math.max(96, layout.field.height - 16) : Math.max(96, layout.field.height * 0.5 - (touchPreview ? 80 : 0))
// y = layout.height - layout.tray - height - (touchPreview ? 56 : 0)          (844x390 evolve → height 254, y 72, viewport 202)
```
Reuse: the existing drawSheet bounds arithmetic (moved, unchanged for every other case); ScrollSheet scrolling; updateHUD. Decision: a taller sheet rather than a scroll hint, because at 254 px the first progression action (after title, role, stats and commitment, about 130 px of text) fits in the 202-px viewport with no new UI element. No dependency added.
Tests (complete): tests/compact-sheet.test.ts
```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
const ui = vi.hoisted(() => {
  function anyStub(): any {
    const proxy: any = new Proxy(function () { return proxy; }, { get: (_t, key) => (key === 'then' ? undefined : key === Symbol.toPrimitive ? () => 0 : proxy), apply: () => proxy });
    return proxy;
  }
  return { anyStub };
});
vi.mock('phaser', () => ({ default: { Scene: class { constructor(_key?: string) {} }, Scenes: { Events: { SHUTDOWN: 'shutdown' } }, Scale: { Events: { RESIZE: 'resize' } } } }));
vi.mock('../src/game/ui/components.ts', () => ({ button: () => ({ box: ui.anyStub(), text: ui.anyStub() }), panel: () => ui.anyStub(), statRow: () => undefined, etchedFrame: () => ui.anyStub() }));
import { GameScene } from '../src/game/scenes/GameScene.ts';
import { Tower } from '../src/game/entities/Tower.ts';
import { SoundManager } from '../src/game/systems/SoundManager.ts';
import { gameLayout, sheetBounds } from '../src/game/ui/layout.ts';
import type { ScrollSheet } from '../src/game/ui/ScrollSheet.ts';
import type { QAAction } from '../src/game/qa.ts';

const VIEWPORTS = [[1440, 900], [1280, 720], [1024, 768], [844, 390], [390, 844], [360, 640]] as const;
const KINDS = ['build', 'tower', 'more', 'relics', 'next', 'evolve'] as const;
afterEach(() => vi.restoreAllMocks());

describe('sheet bounds', () => {
  it('gives the 844x390 Tower Progression sheet room for its first action', () => {
    const layout = gameLayout(844, 390);
    for (const kind of ['evolve', 'tower'] as const) {
      const b = sheetBounds(layout, kind, false);
      expect(b.height - 52).toBeGreaterThanOrEqual(200);
      expect(b.y).toBeGreaterThanOrEqual(layout.hud);
      expect(b.y + b.height).toBeLessThanOrEqual(layout.height - layout.tray);
    }
  });
  it.each(VIEWPORTS)('keeps every sheet between the HUD and the tray at %ix%i', (width, height) => {
    const layout = gameLayout(width, height);
    for (const kind of KINDS) for (const preview of [false, true]) {
      const b = sheetBounds(layout, kind, preview);
      expect(b.x).toBeGreaterThanOrEqual(0); expect(b.x + b.width).toBeLessThanOrEqual(width);
      expect(b.y).toBeGreaterThanOrEqual(layout.hud); expect(b.y + b.height).toBeLessThanOrEqual(height - layout.tray);
    }
  });
  it('keeps the existing heights outside short landscape layouts', () => {
    for (const [width, height] of [[1024, 768], [390, 844], [360, 640]] as const) {
      const layout = gameLayout(width, height);
      expect(sheetBounds(layout, 'evolve', false).height).toBe(Math.max(96, layout.field.height * 0.5));
      expect(sheetBounds(layout, 'build', true).height).toBe(Math.max(96, layout.field.height * 0.5 - 80));
    }
  });
  it('draws the 844x390 Tower Progression sheet with those bounds', () => {
    vi.spyOn(SoundManager, 'get').mockReturnValue(ui.anyStub());
    const scene = new GameScene(); scene.init({ difficulty: 'medium' });
    const loose = scene as unknown as Record<string, unknown>;
    for (const name of ['updateHUD', 'refreshInfoPanel', 'showTouchPreview']) loose[name] = () => {};
    loose.add = ui.anyStub(); loose.uiRoot = ui.anyStub(); loose.input = ui.anyStub(); loose.game = ui.anyStub(); loose.layout = gameLayout(844, 390);
    const t = new Tower('longbow', 100, 100, 0); t.progression = { ...t.progression, foundationLevel: 4, invested: 710 };
    loose.towers = [t]; loose.selectedTower = t; loose.sheetKind = 'evolve';
    (scene as unknown as { drawSheet(): void }).drawSheet();
    expect((loose.sheet as ScrollSheet).bounds.height).toBe(sheetBounds(gameLayout(844, 390), 'evolve', false).height);
  });
});

describe('QA seed HUD refresh', () => {
  it.each([['evolution', 10, 2000], ['mastery', 30, 50000]] as const)('refreshes the top bar last after the %s seed', (state, wave, gold) => {
    vi.spyOn(SoundManager, 'get').mockReturnValue(ui.anyStub());
    const scene = new GameScene(); scene.init({ difficulty: 'medium', playerName: 'QA Warden' });
    const run = scene as unknown as { wave: number; gold: number; handleQAAction(action: QAAction): void }, loose = scene as unknown as Record<string, unknown>;
    for (const name of ['refreshInfoPanel', 'drawSheet', 'drawPowerupBar', 'refreshPlots', 'refreshPlacePanel', 'hideGhost', 'showBanner', 'floatText', 'floatTextForEnemy', 'drawCatalog', 'updateNextPreview', 'renderVictory', 'projectEntity', 'presentReward', 'showTouchPreview', 'refreshTowerVisual']) loose[name] = () => {};
    const seen: Array<[number, number]> = []; loose.updateHUD = () => { seen.push([run.wave, run.gold]); };
    loose.add = ui.anyStub(); loose.world = (v: unknown) => v;
    loose.events = { emit: vi.fn(), on: vi.fn(), off: vi.fn() }; loose.input = { listenerCount: () => 0, keyboard: null }; loose.tweens = { getTweens: () => [] };
    run.handleQAAction({ type: 'seed', state });
    expect(seen[seen.length - 1]).toEqual([wave, gold]);
  });
});
```
Recipe:
1. layout.ts: add sheetBounds per Produces.
2. GameScene.drawSheet: keep `const kind = this.sheetKind;`, replace the width/height/bounds lines with `const bounds = sheetBounds(this.layout, kind, this.touchPreview !== null);` and use bounds.width/bounds.height wherever width/height were used below; extend the `../ui/layout.ts` import with sheetBounds.
3. handleQAAction: append `this.updateHUD();` as the last statement of the 'evolution' case (after refreshInfoPanel) and of the 'mastery' case (after `this.gold = 50000;`). Change nothing else in the seeds (they stay debug-assisted).
Red:    `npm test -- tests/compact-sheet.test.ts` → fails: sheetBounds is not a function, and the last HUD refresh after the evolution and mastery seeds shows wave 0
Green:  `npm test -- tests/compact-sheet.test.ts` → all tests pass
Verify: `npm run typecheck` → no errors; `npm test` → every file passes
Commit: Fit the Tower Progression sheet on short landscape screens

### T34 — Redraw the achievement notice after resize (fix F2)   [x] done
Satisfies: AC-79, AC-103, AC-121
Depends on: T22
Router summary: The achievement unlock notice disappears when the screen is resized or rotated, because the interface is rebuilt without it. Redraw the current notice after every rebuild, keeping its queue and remaining time unchanged, and never add a duplicate notice.
Files:
  - modify  src/game/scenes/GameScene.ts   (drawShell)
  - create  tests/notice-resize.test.ts
Consumes: existing GameScene: `private achievementNotices: Array<{ branchId: BranchId; remainingMs: number }>`, `private achievementNoticeView: Phaser.GameObjects.Text | null`, `notifyAchievements(): void` (dedupes through notifiedAchievements, then calls drawAchievementNotice), `updateAchievementNotices(visibleDeltaMs: number): void` (head only), `drawAchievementNotice(): void` (destroys the old view, returns when there is no head or uiRoot is null, else adds one text in uiRoot via `this.add.text(...)`), `achievementNoticeText(branchId)`; `handleResize` arrow property (scale size → layout → drawShell → showTouchPreview → drawBackgroundPause); `drawShell(): void` (destroys uiRoot with its children, rebuilds the shell, ends with `if (this.siege.phase === 'victory') this.renderVictory();`); T4 UnlockRepository(null, now).
Produces: drawShell destroys and nulls achievementNoticeView before destroying uiRoot and calls drawAchievementNotice() as its last statement; the notice queue, its head and remainingMs are only read, never reset.
Reuse: the existing drawAchievementNotice (no new drawing code). Searched GameScene for an existing redraw hook for notices: none. No dependency added.
Tests (complete): tests/notice-resize.test.ts
```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameScene } from '../src/game/scenes/GameScene.ts';
import { SoundManager } from '../src/game/systems/SoundManager.ts';
import { UnlockRepository } from '../src/game/systems/UnlockSystem.ts';
import type { BranchId } from '../src/shared/progression.ts';

vi.mock('phaser', () => ({ default: { Scene: class { constructor(_key?: string) {} }, Scenes: { Events: { SHUTDOWN: 'shutdown' } }, Scale: { Events: { RESIZE: 'resize' } } } }));
function anyStub(): any {
  const proxy: any = new Proxy(function () { return proxy; }, { get: (_t, key) => (key === 'then' ? undefined : key === Symbol.toPrimitive ? () => 0 : proxy), apply: () => proxy });
  return proxy;
}
interface Run {
  achievementNotices: Array<{ branchId: BranchId; remainingMs: number }>; achievementNoticeView: unknown; unlocksEarnedThisRun: BranchId[]; unlockRepository: UnlockRepository;
  handleResize(): void; notifyAchievements(): void; updateAchievementNotices(ms: number): void;
}
const SHELL = ['applyView', 'drawHUD', 'drawTowerPanel', 'drawControls', 'drawPowerupBar', 'drawBossBar', 'refreshInfoPanel', 'refreshPlacePanel', 'updateNextPreview', 'updateHUD', 'drawSheet', 'showTouchPreview', 'drawBackgroundPause', 'renderVictory'];
function sceneFixture() {
  vi.spyOn(SoundManager, 'get').mockReturnValue(anyStub());
  const scene = new GameScene(); scene.init({ difficulty: 'medium' });
  const run = scene as unknown as Run, loose = scene as unknown as Record<string, unknown>;
  for (const name of SHELL) loose[name] = () => {};
  const text = vi.fn((..._args: unknown[]) => anyStub());
  loose.add = { container: () => anyStub(), text }; loose.make = anyStub(); loose.scale = { width: 844, height: 390 };
  run.unlockRepository = new UnlockRepository(null, () => '2026-10-08T00:00:00Z'); run.unlockRepository.earn(['volley']); run.unlocksEarnedThisRun = ['volley'];
  run.handleResize();
  return { run, text };
}
const noticeDraws = (text: { mock: { calls: unknown[][] } }) => text.mock.calls.filter((args) => String(args[2]).startsWith('Unlocked: Volley')).length;
afterEach(() => vi.restoreAllMocks());

describe('achievement notice across resize', () => {
  it('redraws the active notice after a resize and keeps its remaining time', () => {
    const { run, text } = sceneFixture();
    run.notifyAchievements(); run.updateAchievementNotices(1200);
    expect(noticeDraws(text)).toBe(1);
    run.handleResize();
    expect(noticeDraws(text)).toBe(2);
    expect(run.achievementNoticeView).toBe(text.mock.results[text.mock.results.length - 1].value);
    expect(run.achievementNotices).toEqual([{ branchId: 'volley', remainingMs: 1800 }]);
  });
  it('does not enqueue a duplicate and draws nothing after the notice expired', () => {
    const { run, text } = sceneFixture();
    run.notifyAchievements(); run.handleResize(); run.notifyAchievements();
    expect(run.achievementNotices).toHaveLength(1);
    run.updateAchievementNotices(3000);
    expect([run.achievementNotices, run.achievementNoticeView]).toEqual([[], null]);
    const draws = noticeDraws(text); run.handleResize();
    expect(noticeDraws(text)).toBe(draws);
  });
});
```
Recipe:
1. drawShell: before `this.uiRoot?.destroy(true);` add `this.achievementNoticeView?.destroy(); this.achievementNoticeView = null;`; after the final `if (this.siege.phase === 'victory') this.renderVictory();` add `this.drawAchievementNotice();`.
2. Do not touch notifyAchievements, updateAchievementNotices or the background rule in update() (background already freezes the countdown).
Red:    `npm test -- tests/notice-resize.test.ts` → fails: after the resize the notice is drawn once, not twice
Green:  `npm test -- tests/notice-resize.test.ts` → all tests pass
Verify: `npm run typecheck` → no errors; `npm test` → every file passes
Commit: Keep the achievement notice across resize

### T25 — Amend the authoritative SPEC and design system (old Tasks 7, 9)   [x] done
Satisfies: AC-123
Depends on: T24, T32, T33, T34
Router summary: Update the product specification and design system documents to describe evolution, achievements, the thirty-wave siege with victory decision and endless, explicit score submission, the new score fields and storage keys, and the final tuned values, keeping the approved responsive-playability rules and the original fantasy visual identity.
Files:
  - modify  docs/SPEC.md
  - modify  docs/DESIGN_SYSTEM.md
Consumes: final values from artifacts/progression/balance/playtests.md (T24); the approved spec docs/sdd/specs/20261008-progression-evolutions.md.
Produces: SPEC.md amendments in §4.3 Progression, §6 Core Game Loop, §7 Game States (siege / victory decision / endless / terminal; only three terminal events), §12 Tower Upgrades (foundation, evolution ranks, mastery, prices, Ready to evolve), §13 Tower Selling (refund from recorded spend), §17 Bosses (wave 10/30 milestones, siege failure, finale), §18 Wave System (30-wave siege, endless), §22/§24 Power-Ups (victory-decision reward rules), §28 Scoring and §29 Ranking (wavesCompleted, outcome, milestone mask, score era 2, unchanged ordering), §31 Score Submission Security (AC-142 rules), §32 Local Player Data (aetherhold-unlocks-v1, aetherhold-best-score-v2, legacy aetherhold-best-v1), §39 API and §40 D1 Schema (new row fields, migration 0004), plus a final coefficient table; DESIGN_SYSTEM.md amendments in §22 Wave Treatment, §25 Main Menu, §31 Selected Tower Inspector, §38 Projectile Visual Language, §43 Boss Warning, §45 Game Over Screen, §47 Toasts, §65–66 Visual QA.
Reuse: wording from the approved spec.
Tests (complete): none — documentation only.
Recipe:
1. Edit only the listed sections; keep the responsive-playability amendments intact.
2. Copy final coefficients exactly from playtests.md (seed values where unchanged).
Red:    not applicable — documentation
Green:  not applicable — documentation
Verify: Manual: reviewer confirms each listed section matches the approved spec and the recorded final values, and the responsive rules (§35, §51) are unchanged
Commit: Amend SPEC and design system for progression

### T26 — Verification record and session handoff documents (old Task 9)   [x] done
Satisfies: AC-134
Depends on: T25
Router summary: Write the verification record for the feature (tests, type checks, build, rendered checks, balance evidence and limits) and update the project handoff notes so the next session knows what changed, what was verified and what remains, including browser-local save limits.
Files:
  - create  artifacts/progression/verification.md
  - create  agent_docs/progression_implementation_2026-10-08.md
  - modify  agent_docs/project_progress.md
  - modify  agent_docs/project_structure.md
  - modify  agent_docs/latest_session_work.md
Consumes: outputs of T22–T25.
Produces: verification.md sections Automated (test count, typecheck, build), Rendered (link to ui/checklist.md), Balance (link to playtests.md and branch-comparison.md), Limits (no retention claim; local unlocks are not anti-cheat; unverified browsers listed), Release (filled in T28); handoff and structure notes listing the new files.
Reuse: existing agent_docs formats.
Tests (complete): none — documentation only.
Recipe:
1. Fill the documents from the recorded artifacts only; mark nothing as verified that was not performed.
Red:    not applicable — documentation
Green:  not applicable — documentation
Verify: Manual: every claim in verification.md links to an artifact or a command result; handoff files list all files created by T1–T21
Commit: Record progression verification and session handoff

### T27 — Final release gates and live-check script (old Task 9)   [x] done
Satisfies: AC-125, AC-137
Depends on: T26
Router summary: Run the final type check, tests and build on the complete feature, confirm no new dependency was added, and add a reusable script that checks the live page, its current JavaScript bundle (byte hash against the local build) and the health endpoint after deployment.
Files:
  - create  artifacts/progression/check-live.ps1
Consumes: dist/index.html and dist assets from `npm run build`.
Produces: check-live.ps1 (exit code 0 and an OK line on success; throws on any failure).
Reuse: PowerShell Invoke-WebRequest, Invoke-RestMethod, Get-FileHash.
Tests (complete): none — gate task; the script is exercised in T28.
```powershell
param([Parameter(Mandatory=$true)][string]$LiveUrl)
$page = Invoke-WebRequest -Uri $LiveUrl -UseBasicParsing
$bundle = [regex]::Match($page.Content, 'src="([^"]+\.js)"')
if (-not $bundle.Success) { throw 'No JavaScript bundle in live page' }
$bundlePath = $bundle.Groups[1].Value
$bundleUrl = [uri]::new([uri]$LiveUrl, $bundlePath).AbsoluteUri
$health = Invoke-RestMethod -Uri ([uri]::new([uri]$LiveUrl, '/api/health').AbsoluteUri)
$tmp = New-TemporaryFile
$js = Invoke-WebRequest -Uri $bundleUrl -OutFile $tmp.FullName -PassThru -UseBasicParsing
if ($page.StatusCode -ne 200 -or $js.StatusCode -ne 200 -or -not $health.ok) { throw 'Live page/bundle/health failed' }
$localIndex = Get-Content -Raw -LiteralPath 'dist/index.html'
if (-not $localIndex.Contains($bundlePath)) { throw 'Live bundle differs from build' }
$localHash = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path 'dist' $bundlePath.TrimStart('/'))).Hash
$remoteHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $tmp.FullName).Hash
Remove-Item $tmp.FullName
if ($localHash -ne $remoteHash) { throw 'Live bundle bytes differ from dist' }
Write-Output "OK page=200 bundle=$bundlePath sha256=$localHash health=ok scoreVersion=$($health.scoreVersion)"
```
Recipe:
1. Create the script exactly as above.
2. Confirm package.json dependencies are still @fontsource/cinzel, @fontsource/inter, phaser 4.2.1 and devDependencies unchanged (only "version" changed in T10).
Red:    not applicable — gate task
Green:  `npm test` → every file passes (all pre-existing assertions preserved plus new files)
Verify: `npm run typecheck` → no errors; `npm test` → every file passes; `npm run build` → succeeds and writes dist/index.html
Commit: Pass final progression gates and add the live-check script

### T36 — Database CHECK constraints on the migration 0004 progress columns (fix: code review r1)   [x] done
Satisfies: AC-118
Depends on: T10
Lenses: data, contract
Router summary: Add database-level checks to the three score columns from the unreleased progress migration: the outcome must be victory, defeat or siege failed, completed waves zero to five hundred, and the boss milestone mask zero to seven. Legacy defaults stay valid. Pin the migration text with a test, then rebuild only the local database, re-run the legacy-row smoke and confirm invalid values are rejected. The production database is not touched.
Files:
  - modify  migrations/0004_progression_results.sql   (edited in place: not yet applied to the remote database)
  - create  tests/migration-0004.test.ts
Consumes: existing: migrations/0004_progression_results.sql, currently exactly `ALTER TABLE scores ADD COLUMN waves_completed INTEGER NOT NULL DEFAULT 0;` / `ALTER TABLE scores ADD COLUMN outcome TEXT NOT NULL DEFAULT 'defeat';` / `ALTER TABLE scores ADD COLUMN siege_bosses_defeated INTEGER NOT NULL DEFAULT 0;` (T10); existing: migrations/0003_score_constraints.sql inline column CHECK style, e.g. `difficulty TEXT NOT NULL CHECK (difficulty IN ('easy','medium','hard'))` and `highest_wave INTEGER NOT NULL CHECK (highest_wave >= 0 AND highest_wave <= 500)`; existing: src/shared/progression.ts `type RunOutcome = 'victory' | 'defeat' | 'siege-failed'`; existing: src/shared/resultProgress.ts `resultProgressErrors(progress: ResultProgress, remainingLives: number, bossesKilled: number): string[]`, which already limits highestWave to 1..500, wavesCompleted to 0..highestWave, outcome to the three RunOutcome values and siegeBossesDefeated to 0..7 (so every payload the Worker accepts satisfies the new checks); existing: worker/index.ts INSERT binding ?12 s.wavesCompleted, ?13 s.outcome, ?14 s.siegeBossesDefeated (unchanged); existing: node_modules/vite/client.d.ts `declare module '*?raw' { const src: string; export default src }` (tsconfig.json `types` includes vite/client); existing: package.json script `db:migrate:local` = `wrangler d1 migrations apply aetherhold_scores --local`; existing: wrangler.toml D1 binding DB, database_name aetherhold_scores, migrations_dir migrations; existing local D1 state under .wrangler/state/v3/d1/ (miniflare-D1DatabaseObject/*.sqlite), where T10 already applied 0001–0004, so wrangler records 0004 as applied there and will not re-apply the edited file.
Produces: migrations/0004_progression_results.sql containing exactly these three statements, in this order, one per line, no comments, LF line endings, trailing newline:
```sql
ALTER TABLE scores ADD COLUMN waves_completed INTEGER NOT NULL DEFAULT 0 CHECK (waves_completed BETWEEN 0 AND 500);
ALTER TABLE scores ADD COLUMN outcome TEXT NOT NULL DEFAULT 'defeat' CHECK (outcome IN ('victory','defeat','siege-failed'));
ALTER TABLE scores ADD COLUMN siege_bosses_defeated INTEGER NOT NULL DEFAULT 0 CHECK (siege_bosses_defeated BETWEEN 0 AND 7);
```
Errors and side effects: since SQLite 3.37, an ADD COLUMN that carries a CHECK runs a quick_check of ALL the table's CHECK constraints against every existing row (the new column's check and also migration 0003's difficulty, highest_wave, final_score and run_id checks) and fails the statement if any row violates any of them. The conclusion still holds: existing rows take the defaults 0, 'defeat', 0, which satisfy the three new checks, and every existing row already satisfies 0003's checks (0003 rebuilt the table by inserting every row into the constrained scores_new, and SQLite has enforced those checks on every write since), so the remote apply in T28 cannot fail on legacy rows. If the local apply in Verify step (c) nevertheless fails, stop, restore nothing remote, report; do not proceed to T28. An INSERT that violates a check now fails with SQLite `CHECK constraint failed`; the Worker's existing catch rethrows it and answers 500 INTERNAL (unreachable for payloads that pass validateScorePayload). The local D1 database is recreated from 0001–0004; the previous local state is kept, renamed to .wrangler/state/v3/d1-before-t36. The remote database is not changed by this task. Worker code, the T10 block and migrations 0001–0003 are unchanged.
Reuse: Vite's `?raw` import (vite and its client types are already installed) to read the SQL text in vitest without node:fs; the npm script db:migrate:local (Verify-block command migrateLocal); `npx wrangler d1 execute … --local` from the installed wrangler 4.148.0, as in T10's smoke. No dependency added.
Tests (complete): tests/migration-0004.test.ts
```ts
import { describe, expect, it } from 'vitest';
import sql from '../migrations/0004_progression_results.sql?raw';

// The in-memory D1 stub in tests/worker.test.ts never parses SQL, so the database-level contract is pinned on the migration text.
const statements = sql.split(';').map((s) => s.replace(/\s+/g, ' ').trim()).filter((s) => s.length > 0);

describe('migration 0004_progression_results.sql', () => {
  it('adds the three progress columns with legacy defaults and CHECK constraints', () => {
    expect(statements).toEqual([
      'ALTER TABLE scores ADD COLUMN waves_completed INTEGER NOT NULL DEFAULT 0 CHECK (waves_completed BETWEEN 0 AND 500)',
      "ALTER TABLE scores ADD COLUMN outcome TEXT NOT NULL DEFAULT 'defeat' CHECK (outcome IN ('victory','defeat','siege-failed'))",
      'ALTER TABLE scores ADD COLUMN siege_bosses_defeated INTEGER NOT NULL DEFAULT 0 CHECK (siege_bosses_defeated BETWEEN 0 AND 7)'
    ]);
  });

  it('is additive: only ADD COLUMN, nothing dropped, deleted, renamed or rewritten', () => {
    expect(statements.every((s) => s.startsWith('ALTER TABLE scores ADD COLUMN '))).toBe(true);
    expect(sql).not.toMatch(/\b(DROP|DELETE|UPDATE|INSERT|RENAME)\b/i);
  });
});
```
Recipe:
1. Guard (read-only remote query, applies nothing): run `npx wrangler d1 migrations list aetherhold_scores --remote` → 0004_progression_results.sql must be listed as not yet applied. If it is listed as applied, stop, change nothing, and report to the team lead (an applied migration cannot be edited; the checks would need a new migration). If the command cannot run (for example wrangler is not logged in), record that and continue: T28 step (1) checks the same list before any remote apply.
2. Create tests/migration-0004.test.ts exactly as above and run Red.
3. Replace the three statements in migrations/0004_progression_results.sql with the Produces text exactly (same column order as today). Do not touch migrations 0001–0003, worker/index.ts or tests/worker.test.ts. Run Green.
4. Run the Verify commands, then the Manual local rebuild and smoke in Verify, in order. Never add `--remote` to any of those commands, never delete the moved-aside local state, and never run `npm run db:migrate:remote`.
Red:    `npm test -- tests/migration-0004.test.ts` → fails: 'adds the three progress columns with legacy defaults and CHECK constraints' (the statements have no CHECK clauses); the additive test passes
Green:  `npm test -- tests/migration-0004.test.ts` → both tests pass
Verify: `npm run typecheck` → no errors; `npm test` → every file passes; Manual (LOCAL database only; Bash on Windows (Git Bash) from the project root `/c/dev/Warcraft 3 Inspired Tower Defense`): (a) stop any running `npm run dev` or `wrangler dev` (they hold the local SQLite files open on Windows); (b) move the local D1 state aside: `mv .wrangler/state/v3/d1 .wrangler/state/v3/d1-before-t36` (PowerShell equivalent: `Rename-Item -LiteralPath .wrangler\state\v3\d1 -NewName d1-before-t36`; if that name exists, use d1-before-t36-2) → .wrangler/state/v3/d1 no longer exists; nothing outside .wrangler/state/v3/d1 is touched; (c) migrateLocal `npm run db:migrate:local` (answer yes if prompted) → applies 0001_initial.sql, 0002_run_version.sql, 0003_score_constraints.sql and 0004_progression_results.sql to a fresh local database without error; if (c) fails, stop, restore nothing remote, report (the full output of (c), to the team lead); do not proceed to T28 (skip (d)–(g) and leave .wrangler/state/v3/d1-before-t36 in place); (d) `npx wrangler d1 execute aetherhold_scores --local --command "SELECT sql FROM sqlite_master WHERE type='table' AND name='scores'"` → the table definition contains `CHECK (waves_completed BETWEEN 0 AND 500)`, `CHECK (outcome IN ('victory','defeat','siege-failed'))` and `CHECK (siege_bosses_defeated BETWEEN 0 AND 7)`; (e) re-run the T10 legacy-row smoke: `npx wrangler d1 execute aetherhold_scores --local --command "INSERT INTO scores (run_id, player_name, difficulty, highest_wave, final_score, game_version, score_version) VALUES ('legacy-smoke-0001','Legacy','medium',5,500,'0.1.0',1)"` → succeeds, then `npx wrangler d1 execute aetherhold_scores --local --command "SELECT waves_completed, outcome, siege_bosses_defeated FROM scores WHERE run_id='legacy-smoke-0001'"` → one row 0, defeat, 0; (f) `npx wrangler d1 execute aetherhold_scores --local --command "INSERT INTO scores (run_id, player_name, difficulty, highest_wave, final_score, game_version, score_version, outcome) VALUES ('bogus-smoke-0001','Bogus','medium',5,500,'0.2.0',2,'bogus')"` → REJECTED with `CHECK constraint failed` naming outcome; `npx wrangler d1 execute aetherhold_scores --local --command "INSERT INTO scores (run_id, player_name, difficulty, highest_wave, final_score, game_version, score_version, siege_bosses_defeated) VALUES ('bogus-smoke-0002','Bogus','medium',5,500,'0.2.0',2,8)"` → REJECTED with `CHECK constraint failed` naming siege_bosses_defeated; `npx wrangler d1 execute aetherhold_scores --local --command "INSERT INTO scores (run_id, player_name, difficulty, highest_wave, final_score, game_version, score_version, waves_completed) VALUES ('bogus-smoke-0003','Bogus','medium',5,500,'0.2.0',2,501)"` → REJECTED with `CHECK constraint failed` naming waves_completed; (g) `npx wrangler d1 execute aetherhold_scores --local --command "SELECT COUNT(*) AS n FROM scores WHERE run_id LIKE 'bogus-smoke-%'"` → n = 0; (h) leave .wrangler/state/v3/d1-before-t36 in place (the user may delete it) and report its path and the outputs of (c)–(g)
Commit: Constrain the progress columns at the database level

### T37 — Live check asserts score era 2 and a working leaderboard (fix: code review r1)   [x] done
Satisfies: AC-137, AC-138
Depends on: T27
Lenses: contract
Router summary: The post-deploy live check never confirms that the live server reports score version two and never calls the leaderboard, the request that reads the new database columns, so a missing migration could pass unnoticed. Make the check fail unless the score version is two and the leaderboard answers with status 200 and its usual shape, show the leaderboard result in the success line, and add an offline self-test mode run by an automated test.
Files:
  - modify  artifacts/progression/check-live.ps1
  - create  artifacts/progression/check-live.test.ts   (not type-checked: artifacts/ is outside tsconfig.json `include`; may import node:child_process and node:fs, like the T24 artifacts tests; picked up by vitest's default include)
Consumes: existing: artifacts/progression/check-live.ps1 (T27, 17 lines): line 1 `param([Parameter(Mandatory=$true)][string]$LiveUrl)`; lines 2–16 fetch the page, find the bundle, `$health = Invoke-RestMethod -Uri ([uri]::new([uri]$LiveUrl, '/api/health').AbsoluteUri)`, download the bundle, `if ($page.StatusCode -ne 200 -or $js.StatusCode -ne 200 -or -not $health.ok) { throw 'Live page/bundle/health failed' }` (line 10), compare with dist/index.html (`throw 'Live bundle differs from build'`) and the SHA256 of the dist bundle (`throw 'Live bundle bytes differ from dist'`); line 17 `Write-Output "OK page=200 bundle=$bundlePath sha256=$localHash health=ok scoreVersion=$($health.scoreVersion)"`. Existing: worker/index.ts routes (confirmed): `GET /api/health` → 200 `{ ok: true, time: string, scoreVersion: number }` with SCORE_VERSION = 2 (src/shared/version.ts, T10); `GET /api/leaderboard` with optional query params `difficulty` ('easy' | 'medium' | 'hard') and `limit` (default 20, clamped to 1..100) → 200 `{ scores: Array<{ id: number; runId: string; playerName: string; difficulty: string; highestWave: number; finalScore: number; enemiesKilled: number; bossesKilled: number; remainingLives: number; gameDurationSeconds: number; gameVersion: string; scoreVersion: number; createdAt: string; wavesCompleted: number; outcome: string; siegeBossesDefeated: number }>, scoreVersion: number }` (Cache-Control `public, max-age=15`); its SELECT reads waves_completed, outcome and siege_bosses_defeated, so a missing migration makes it throw and answer 500 `{ ok: false, error: { code: 'INTERNAL', message: string } }`. T28 step (6) runs `powershell -NoProfile -File artifacts/progression/check-live.ps1 -LiveUrl <live URL>`.
Produces: artifacts/progression/check-live.ps1 with:
- Parameters: `[CmdletBinding(DefaultParameterSetName='Live')] param([Parameter(Mandatory=$true, ParameterSetName='Live')][string]$LiveUrl, [Parameter(Mandatory=$true, ParameterSetName='SelfTest')][switch]$SelfTest)`.
- `function Assert-LiveApi { param($Health, [int]$LeaderboardStatus, $Leaderboard) }`: returns nothing; throws the first failing check, in this order: `'Live health failed: ok is not true'` when `-not $Health.ok`; `"Live health scoreVersion is $($Health.scoreVersion), expected 2"` when `$Health.scoreVersion -ne 2`; `"Live leaderboard returned status $LeaderboardStatus, expected 200"` when the status is not 200; `'Live leaderboard is not { scores: [...], scoreVersion: 2 }'` when `$Leaderboard` is null, has no `scores` property, `scores` is not an array, or `$Leaderboard.scoreVersion -ne 2`; `"Live leaderboard row lacks $name"` when the first row (if any) lacks a `wavesCompleted`, `outcome` or `siegeBossesDefeated` property.
- `function Get-LeaderboardResult { param([Parameter(Mandatory=$true)][scriptblock]$Request) }`: runs `& $Request` inside try/catch and returns `[pscustomobject]@{ Status = <int>; Body = <parsed object or $null> }`. When the request succeeds: Status = `[int]$response.StatusCode`, Body = `$response.Content | ConvertFrom-Json`. When the request throws and `$_.Exception.Response` is not null (an HTTP answer with a non-2xx status: in Windows PowerShell 5.1 a System.Net.WebException carrying an HttpWebResponse, in PowerShell 7 an HttpResponseException carrying an HttpResponseMessage): Status = `[int]$_.Exception.Response.StatusCode`, Body = `$null`, and it does not throw. When the request throws and `$_.Exception.Response` is null (DNS, connection or TLS failure, or a 2xx body that is not JSON): it rethrows the original error with a bare `throw`.
- `-SelfTest`: no network and no dist access; runs the 11 cases below: cases 1–8 through Assert-LiveApi (fixtures parsed with ConvertFrom-Json), cases 9–11 through Get-LeaderboardResult with an offline Request scriptblock; prints `SELFTEST OK cases=11` and exits 0; a case whose result differs from its expectation throws `SELFTEST FAIL: <case name>` (exit code 1). Cases (name; health JSON; status; leaderboard JSON; expected): 'valid with one row'; `{"ok":true,"scoreVersion":2}`; 200; `{"scores":[{"runId":"selftest-0001","wavesCompleted":30,"outcome":"victory","siegeBossesDefeated":7}],"scoreVersion":2}`; passes — 'valid empty board'; `{"ok":true,"scoreVersion":2}`; 200; `{"scores":[],"scoreVersion":2}`; passes — 'old score era'; `{"ok":true,"scoreVersion":1}`; 200; `{"scores":[],"scoreVersion":2}`; throws — 'health not ok'; `{"ok":false,"scoreVersion":2}`; 200; `{"scores":[],"scoreVersion":2}`; throws — 'leaderboard status 500'; `{"ok":true,"scoreVersion":2}`; 500; `{"scores":[],"scoreVersion":2}`; throws — 'leaderboard error body'; `{"ok":true,"scoreVersion":2}`; 200; `{"ok":false,"error":{"code":"INTERNAL","message":"no such column"}}`; throws — 'row lacks outcome'; `{"ok":true,"scoreVersion":2}`; 200; `{"scores":[{"runId":"selftest-0002","wavesCompleted":30,"siegeBossesDefeated":7}],"scoreVersion":2}`; throws — 'leaderboard era 1'; `{"ok":true,"scoreVersion":2}`; 200; `{"scores":[],"scoreVersion":1}`; throws. Cases 9–11 (name; Request scriptblock passed to Get-LeaderboardResult; expected): 'leaderboard request throws HTTP 503'; `{ $e = [System.Exception]::new('selftest HTTP 503'); Add-Member -InputObject $e -NotePropertyName Response -NotePropertyValue ([pscustomobject]@{ StatusCode = 503 }); throw $e }` (a thrown error carrying a Response, the shape Invoke-WebRequest throws for a non-2xx answer; PowerShell keeps the added member on the exception instance, so `$_.Exception.Response.StatusCode` reads 503 in the catch); returns Status 503 and Body $null without throwing, and then `Assert-LiveApi -Health ('{"ok":true,"scoreVersion":2}' | ConvertFrom-Json) -LeaderboardStatus 503 -Leaderboard $null` throws with the message exactly `Live leaderboard returned status 503, expected 200` — 'leaderboard request fails without HTTP answer'; `{ throw [System.Exception]::new('selftest no response') }`; Get-LeaderboardResult throws — 'leaderboard request succeeds'; `{ [pscustomobject]@{ StatusCode = 200; Content = '{"scores":[],"scoreVersion":2}' } }`; returns Status 200 and a Body whose scoreVersion is 2 and whose `@($Body.scores).Count` is 0, without throwing.
- `-LiveUrl`: every existing check and message of lines 2–16 kept; additionally GET `/api/leaderboard?limit=1` through Get-LeaderboardResult (so a non-2xx answer is reported with its real status, never as status 0) and Assert-LiveApi on the health result and the returned Status and Body; success line exactly `OK page=200 bundle=<bundle path> sha256=<hash> health=ok scoreVersion=<n> leaderboard=200 rows=<row count>` (rows is 0 or 1). Any failure throws (non-zero exit).
Reuse: Windows PowerShell built-ins already used by the script (Invoke-WebRequest, Invoke-RestMethod, Get-FileHash) plus ConvertFrom-Json, Add-Member (self-test only), try/catch and PowerShell parameter sets; Node's built-in node:child_process and node:fs in the vitest wrapper. No dependency added.
Tests (complete): artifacts/progression/check-live.test.ts
```ts
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SCRIPT = 'artifacts/progression/check-live.ps1';

describe('check-live.ps1 text', () => {
  const text = readFileSync(SCRIPT, 'utf8');
  it('keeps the page, bundle hash and health checks', () => {
    expect(text).toContain("'/api/health'");
    expect(text).toContain("throw 'Live page/bundle/health failed'");
    expect(text).toContain("throw 'Live bundle differs from build'");
    expect(text).toContain('Get-FileHash -Algorithm SHA256');
    expect(text).toContain("throw 'Live bundle bytes differ from dist'");
  });
  it('requires score version 2 and checks the leaderboard', () => {
    expect(text).toMatch(/scoreVersion -ne 2/);
    expect(text).toContain("'/api/leaderboard?limit=1'");
    expect(text).toContain('leaderboard=200 rows=');
    expect(text).toContain('function Get-LeaderboardResult');
    expect(text).toContain('$_.Exception.Response');
  });
});

describe.runIf(process.platform === 'win32')('check-live.ps1 -SelfTest (offline, Windows PowerShell)', () => {
  it('accepts valid API responses and rejects every broken one', () => {
    // Started from pwsh 7, the inherited PSModulePath points Windows PowerShell 5.1 at pwsh 7 modules and can break ConvertFrom-Json; drop it (any casing) so 5.1 rebuilds its default.
    const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => key.toLowerCase() !== 'psmodulepath'));
    const r = spawnSync('powershell', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', SCRIPT, '-SelfTest'], { encoding: 'utf8', timeout: 60_000, env });
    expect(r.error).toBeUndefined();
    expect(`${r.stdout}\n${r.stderr}`).toContain('SELFTEST OK cases=11');
    expect(r.status).toBe(0);
  }, 60_000);
});
```
Recipe:
1. Create artifacts/progression/check-live.test.ts exactly as above and run Red.
2. Replace line 1 of check-live.ps1 with the parameter-set declaration from Produces. Define Assert-LiveApi directly below it, before any network call. Check presence with `$Leaderboard.PSObject.Properties['scores']` and row fields with `$row.PSObject.Properties[$name]`; check the type with `-is [array]` (ConvertFrom-Json in Windows PowerShell 5.1 returns Object[] for JSON arrays, including empty and one-element arrays); take the first row as `@($Leaderboard.scores)[0]` only when the array is non-empty. Directly below Assert-LiveApi, define Get-LeaderboardResult as specified in Produces: in `try`, run `$response = & $Request` and return Status `[int]$response.StatusCode` with Body `$response.Content | ConvertFrom-Json`; in `catch`, read `$httpResponse = $_.Exception.Response`; if it is `$null`, rethrow with a bare `throw`; otherwise return Status `[int]$httpResponse.StatusCode` with Body `$null`.
3. Directly after the two functions, add the `-SelfTest` branch: build the 11 cases of Produces; run cases 1–8 through Assert-LiveApi and cases 9–11 through Get-LeaderboardResult (case 9 then also through Assert-LiveApi with the returned Status and Body, comparing the thrown message exactly), each inside try/catch to record whether it threw and what it returned; compare with the expectation, then print `SELFTEST OK cases=11` and `return`. It must not call the network or read dist.
4. Keep the existing lines 2–16 unchanged. After the existing line-10 check and before reading dist/index.html, run `$leaderboard = Get-LeaderboardResult -Request { Invoke-WebRequest -Uri ([uri]::new([uri]$LiveUrl, '/api/leaderboard?limit=1').AbsoluteUri) -UseBasicParsing }`, set `$board = $leaderboard.Body`, and call `Assert-LiveApi -Health $health -LeaderboardStatus $leaderboard.Status -Leaderboard $board`. Do not call Invoke-WebRequest bare and rely on it to stop the script: in Windows PowerShell 5.1 a non-2xx answer is a statement-terminating error, not a script-terminating one, so the script would continue and report status 0 after unrelated errors. The try/catch in Get-LeaderboardResult takes the status from `[int]$_.Exception.Response.StatusCode`, so a 500 from the leaderboard fails as `Live leaderboard returned status 500, expected 200`, and a failure with no HTTP answer is rethrown and fails the script.
5. Replace the final Write-Output with the success line from Produces (row count from `@($board.scores).Count`).
6. Keep the script ASCII-only (Windows PowerShell 5.1 reads BOM-less scripts as ANSI). Do not change $ErrorActionPreference, add modules or touch any other file. Do not run the script against the live site here; T28 step (6) does that.
Red:    `npm test -- artifacts/progression/check-live.test.ts` → fails: 'requires score version 2 and checks the leaderboard' (no `scoreVersion -ne 2`, no `'/api/leaderboard?limit=1'`, no `function Get-LeaderboardResult`, no `$_.Exception.Response`) and, on Windows, the -SelfTest test (PowerShell reports no parameter named SelfTest; no `SELFTEST OK` line, non-zero exit); 'keeps the page, bundle hash and health checks' passes
Green:  `npm test -- artifacts/progression/check-live.test.ts` → all tests pass (the -SelfTest test is skipped on non-Windows platforms)
Verify: `npm run typecheck` → no errors; `npm test` → every file passes; `npm run build` → succeeds; Manual: the live behaviour (leaderboard=200 against production) is verified only in T28 step (6)
Commit: Make the live check require score era 2 and a working leaderboard

### T28 — Remote migration, deployment and live verification (old Tasks 8–9)   [x] done
Satisfies: AC-118, AC-138
Depends on: T10, T27, T36, T37
Lenses: data
Router summary: Release the complete feature once: apply the additive database migration to the production database and confirm no score rows were lost, deploy with the project's deploy command, then verify the live page, its current script bundle, the health endpoint and a browser session, and record the live address and any failure. Stop without deploying if the migration fails.
Files:
  - modify  artifacts/progression/verification.md   (Release section)
Consumes: T27 green gates; migration 0004 as constrained by T36 (migrations/0004_progression_results.sql, created by T10: three ADD COLUMN statements with CHECK constraints); check-live.ps1 as extended by T37 (leaderboard and scoreVersion 2 assertions); wrangler.toml database aetherhold_scores.
Produces: Release section with migration id, before/after row counts, deploy output URL, bundle name, SHA256, health result, browser result, failures.
Reuse: package.json scripts db:migrate:remote and deploy (Verify-block commands migrateRemote and deploy); check-live.ps1.
Tests (complete): none — remote and browser actions.
Recipe:
1. Manual steps listed in Verify, in order; never reset tables or dump player data; never submit fake production scores.
2. Each later successful tuning change repeats steps 5–8 (and steps 1–4 only when it adds a migration).
Red:    not applicable — release task
Green:  not applicable — release task
Verify: Manual: (1) `npx wrangler d1 migrations list aetherhold_scores --remote` → 0004_progression_results.sql listed as pending; (2) `npx wrangler d1 execute aetherhold_scores --remote --command "SELECT COUNT(*) AS n FROM scores"` → record N; (3) migrateRemote `npm run db:migrate:remote` → 0004 applied without error (on failure stop and report; do not deploy); (4) repeat (1) → nothing pending, and (2) → still N; (5) deploy `npm run deploy` → tests, build and wrangler deploy succeed and print the live URL; (6) `powershell -NoProfile -File artifacts/progression/check-live.ps1 -LiveUrl <live URL>` → prints `OK … health=ok scoreVersion=2 leaderboard=200 rows=<0 or 1>` (since T37 the script throws unless /api/health reports scoreVersion 2 and GET /api/leaderboard?limit=1 returns 200 with the Worker's scores array and scoreVersion 2); (7) open the live URL in a browser → menu shows Progression, a run starts, no console errors or failed requests; (8) record everything in verification.md and report the live URL and any failure
Commit: Release tower evolution and replay progression
