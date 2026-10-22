# Tower balance evidence — 2026-10-22

Method: `TOWER_REPORT=<out.md> npx vitest run tests/tower-balance-report.test.ts` (opt-in, not a gate).
Classic, Medium, seed 1, the real `GameScene` driven by the simulation bot. Each lineup fully invests
every tower in it (builds, 3 foundation upgrades, starter branch, 3 ranks; round-robin). Classic has
one map, so there is no per-map axis.

| Lineup | Outcome | Waves | Lives |
| --- | --- | ---: | ---: |
| all 7 | victory | 30 | 20 |
| all 7 minus longbow (Ranger) | siege-failed | 9 | 15 |
| all 7 minus any other single tower | victory | 30 | 20 |
| ember (Bombard) alone | victory | 30 | 20 |
| cinder alone | victory | 30 | 19 |
| tempest alone | defeat | 20 | 0 |
| longbow alone | defeat | 16 | 0 |
| starfire alone | defeat | 15 | 0 |
| sentinel alone | defeat | 15 | 0 |
| glacier (Frost) alone | defeat | 2 | 0 |
| ember + longbow + glacier | victory | 30 | 20 |
| cinder + longbow + glacier | victory | 30 | 20 |
| starfire / glacier / tempest + longbow + glacier | defeat | 15–20 | 0 |
| sentinel + longbow + glacier | defeat | 11 | 0 |

## Findings

1. **Splash towers dominate.** One fully invested Bombard or Cinder clears Classic Medium at (almost)
   full lives; no other tower reaches wave 21 alone. Cinder is *not* weak: its Pyre field is the carry.
2. **Sentinel is on par with Ranger and Arcane solo** (15 vs 16 vs 15 waves), so it does not need a buff.
   Its weakness is only as a support in the trio (wave 11), where it does no crowd work.
3. **Classic Medium is too easy**: any 6 of 7 towers wins at full lives (consistent with F5 in
   `FEATURE_ART_BALANCE_AUDIT.md`). `all 7 minus longbow` failing at wave 9 is probably a plot-order
   artefact (the first tower built takes the best plot); unverified.

## AOE rebalance (shipped)

Single-seed results were chaotic (a lone splash tower either clears wave 3 or it does not), so the report
now aggregates seeds (`TOWER_SEEDS`, default 6) and reports effective damage per tower. Findings that shaped the change:

- Cinder alone won 6/6 at 19.3 average lives even after 25-40% stat cuts; evolutions and the burning field
  were not the driver (halving `fieldFraction` did nothing). Damage cuts only hit a cliff at wave 3-4.
- The Campaign gate bot uses foundation towers only, and level 21 has a one-life margin, so Bombard foundation
  stats cannot move without re-pinning Campaign. Stat nerfs also broke 9-10 pinned tests.
- Effective damage in the full lineup was ~90% Tempest, Bombard and Cinder (incl. field), ~2% Ranger, Arcane and Frost.

Change: **Classic-only splash falloff** in `GameScene` (`SPLASH_EDGE_FALLOFF = 0.5`: full damage at the impact,
50% at the edge), plus **Hard enemy HP 1.3 -> 1.2** because Hard's only reference win leaned on full-strength
splash (it fell to 1 of 15 lives at 1.3 with the falloff; 14 at 1.2). Campaign battles keep flat splash.

| Lineup (6 seeds, Medium) | Before | After |
| --- | --- | --- |
| Cinder alone | 6/6 wins, 19.3 lives | 6/6 wins, 7.0 lives |
| Bombard alone | 4/6 wins, 8.8 lives | 4/6 wins, 10.3 lives (within noise) |
| Bombard + Ranger + Frost | 5/6, 10.0 lives | 6/6, 11.5 lives (within noise) |
| all 7 | 6/6, 20 lives | 6/6, 20 lives |
| acceptance runs (Medium) | 20 lives | 20 lives (starter-2 endless: 11) |
| acceptance Hard | 15 lives | 14 lives |

Not fixed: Tempest is still ~33% of damage, Bombard is within noise of before, and a lone Cinder still wins
(its burning field is not subject to falloff). Classic late-wave density, not tower stats, is the underlying
reason an AOE tower can win alone; fixing that is a Classic enemy/wave change and needs its own decision.
