# Balance evidence — 2026-10-18

Method: re-ran the existing simulation gates on the current `main`. No tuning
was performed. Sources: `tests/campaign-scene.test.ts` (Campaign, 600 gold /
20 lives, resistance-aware opener, randomValue 0.99, no sidegrades/relics/grants)
and `tests/balance-acceptance.test.ts` (Classic, mixed-bot strategy). Traces were
written via `CAMPAIGN_TRACE_PATH` and `CLASSIC_TRACE_PATH` and are not committed.
All gates passed.

## Campaign levels 21–30 (completion-only profile)

The live star target is `campaignScoreMetadata(level).scoreTarget`, computed as
`ceil(0.9 × perfectScore / 10) × 10`. `perfectScore` = scheduled kills ×10 +
waves ×100 + mission boss ×500 + 20 lives ×50.

| Level | Score | Target | Margin | Margin % | Lives / star | Seconds |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 21 | 6,490 | 6,330 | 160 | 2.53% | 11 / 10 | 335 |
| 22 | 7,070 | 6,370 | 700 | 10.99% | 20 / 10 | 369 |
| 23 | 6,120 | 5,890 | 230 | 3.90% | 13 / 10 | 520 |
| 24 | 7,820 | 7,040 | 780 | 11.08% | 20 / 10 | 477 |
| 25 | 7,180 | 6,470 | 710 | 10.97% | 20 / 10 | 476 |
| 26 | 5,620 | 5,600 | 20 | 0.36% | 10 / 10 | 760 |
| 27 | 7,790 | 7,020 | 770 | 10.97% | 20 / 10 | 398 |
| 28 | 7,480 | 6,740 | 740 | 10.98% | 20 / 10 | 540 |
| 29 | 7,590 | 6,840 | 750 | 10.96% | 20 / 10 | 716 |
| 30 | 9,490 | 8,550 | 940 | 10.99% | 20 / 8 | 530 |

The ~11% figure is structural: a run that loses no lives scores ~100% of the
perfect score, and the target is 90% of it. The tighter rows are explained by
lives lost at 50 points each, not by missed kills or waves.

## Classic (mixed bot)

| Run | Difficulty | Outcome | Waves | Lives | Fully evolved | Seconds (1×) |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| medium-starter-1 | medium | victory | 30 | 20 | 5 | 1426 |
| medium-starter-2 | medium | endless | 40 | 16 | 5 | 1441 |
| medium-unlocked-1 | medium | victory | 30 | 20 | 5 | 1440 |
| easy-1 | easy | victory | 30 | 25 | 5 | 1312 |
| hard-1 | hard | victory | 30 | 15 | 5 | 1513 |
| medium-nogold-1 | medium | victory | 30 | 20 | 5 | 1442 |
| medium-nogold-2 | medium | victory | 30 | 20 | 5 | 1443 |
| medium-nogold-3 | medium | victory | 30 | 20 | 5 | 1458 |
| medium-sentinel-1 | medium | victory | 30 | 20 | 4 | 1477 |
| medium-cinder-1 | medium | victory | 30 | 20 | 5 | 1464 |

Every run wins at full lives for its difficulty, fully evolving five towers,
with and without gold relics; Sentinel and Cinder builds now clear Medium.

## Findings

1. **The configured `mastery.scoreTarget` values are unreachable — on 98 of the
   100 levels.** Every level from 3 to 100 authors a bar above its own perfect
   score, so no play can satisfy it. Only level 1 (1,950) and level 2 (2,400)
   author a bar *below* the live one; no level authors a value between the live
   bar and its perfect score. Levels 21–30 illustrate it:

   | Level | Perfect score | Live target | Config target |
   | ---: | ---: | ---: | ---: |
   | 21 | 7,030 | 6,330 | 12,950 |
   | 22 | 7,070 | 6,370 | 13,900 |
   | 23 | 6,540 | 5,890 | 14,850 |
   | 24 | 7,820 | 7,040 | 15,800 |
   | 25 | 7,180 | 6,470 | 16,750 |
   | 26 | 6,220 | 5,600 | 17,700 |
   | 27 | 7,790 | 7,020 | 18,650 |
   | 28 | 7,480 | 6,740 | 19,600 |
   | 29 | 7,590 | 6,840 | 20,550 |
   | 30 | 9,490 | 8,550 | 21,500 |

   The config value is an alternative star bar in `campaignProgress.ts` (save
   validation and `applyCampaignClear`), the only bar in the `GuestProgress.ts`
   legacy-payload branch, and the campaign leaderboard's `legacy_target`; it is
   never player-visible. The bar the player is shown and judged against
   (`presentation.ts`, `prerequisites.ts`) is always the metadata target.

   **Resolved 2026-10-18.** `legacyCampaignScoreTarget(level)` clamps the authored
   value to the live bar. Levels 3–100 therefore drop from an unreachable bar to
   the live one — a strict relaxation, since the legacy clause is OR-ed with the
   live clause — while levels 1–2 keep their authored bars, so an existing legacy
   save that earned a score star through the old bar still validates. No
   re-authoring and no production data change was needed; the clamp can only
   accept more, never less. `tests/campaign-legacy-score-target.test.ts` pins the
   invariant, the level 1–2 floor, and the save-validation and guest-payload
   behaviour; `tests/campaign-leaderboard-worker.test.ts` pins the leaderboard
   clause.
2. **The 2026-10-11 audit's F4 margins no longer describe the live target.**
   Its table's "score-star target" column equals the config values, so those
   percentages were measured against a bar that cannot be met.
3. **Tightest live margins:** level 26 (0.36%, bot ends exactly at its 10-life
   star threshold), 21 (2.53%), 23 (3.90%).
4. **Pacing:** levels 26 (760s) and 29 (716s) are longer than the level-30 boss
   (530s).
5. **Classic difficulty spread is not exercised by the fixed bot** (F5): Easy,
   Medium and Hard all finish at full lives.

## Recommendation (no change made)

- **Decided 2026-10-18.** The authored `mastery.scoreTarget` is reconciled with
  the live bar by clamping (`legacyCampaignScoreTarget`) rather than re-authoring
  numbers: the legacy and live bars now agree wherever the authored value was
  unreachable, and no existing save is invalidated. Re-authoring the values, or
  deleting the now-inert field, stays **REQUIRES-HUMAN** and is deferred.
- The *live* bar (`ceil(0.9 × perfectScore / 10) × 10`) was deliberately left
  unchanged: it is player-visible and self-consistent, and retuning it is a
  separate balance decision, not a correctness fix. If that is ever taken up,
  playtest levels 21, 23 and 26 (margins) and 26/29 (pacing) with novice builds,
  and play Classic Easy/Medium/Hard with a non-optimized strategy. Bot success is
  not evidence that a human target is fair.
- Levels 22 and 28 are no longer tight against the live target; the earlier
  concern about them is superseded.
