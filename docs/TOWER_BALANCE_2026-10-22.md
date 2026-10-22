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

## Tuning trial (reverted)

Scaling Bombard and Cinder `splashRadius` by 0.8 and Pyre's field from 110 to 90 moved Bombard-alone to a
wave-29 defeat, but a Bombard+Ranger+Frost trio dropped from 20 to 8 lives, Cinder alone still won (16
lives), and 9 tests failed (pinned radii in `evolution-config`, `evolution-combat`,
`additional-towers-progression`, `campaign-combat`, and the level-96 clear gates in
`campaign-v5-expansion-paid-resource`). Nothing was changed. A real AOE rebalance has to re-baseline
those pins and the campaign gates together, with a human playtest.
