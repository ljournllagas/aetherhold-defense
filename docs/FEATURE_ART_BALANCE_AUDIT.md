# Feature, artwork and balance audit

Date: 2026-10-11. Scope: shipped Classic and Campaign Worlds 1–3, Levels 1–30. This release adds direct mode entry, repairs cold difficulty-selection icons and repairs one development preview defect. Gameplay tuning is unchanged.

## Findings and disposition

| ID | Priority/status | Reproduction and evidence | Disposition |
| --- | --- | --- | --- |
| F1 | P2, repaired | Cold main menu offered Campaign only; Classic Siege required opening Campaign. [MainMenuScene](../src/game/scenes/MainMenuScene.ts), [screen regression tests](../tests/screens.test.ts). | Both modes now have equal primary actions. Campaign retains its staged map load; Classic opens Difficulty directly. Five target viewports checked; all existing secondary actions retained. |
| F2 | P2, repaired, development only | Open `/?qa=gameover` on the Vite server. The menu remained active while gameplay readiness replaced menu icon textures, causing Phaser `TexturerImage.run` to read a null texture source and freeze the preview. Campaign QA already stopped active scenes. | [qa.ts](../src/game/qa.ts) stops MainMenu before Game Over preloading. [qa.test.ts](../tests/qa.test.ts) reproduces the missing stop and checks stop-before-start ordering. Real WebGL preview now renders. Normal game results already leave their source scene. |
| F3 | P2, concern: advertised cosmetic rewards | `emberfall_cosmetics` and `frostveil_cosmetics` are awarded in [Campaign configuration](../src/game/campaign/config.ts), declared in types and documented in [Campaign scope](CAMPAIGN_WORLDS_1_3.md). A repository-wide search finds no presentation consumer of either flag. | These rewards have no separately gated visible effect. Biome terrain already appears independently of the flags. Define what cosmetic is earned before adding it; no required image path exists for these flags, so this is a feature-design gap rather than an absent production file. No speculative cosmetic added. |
| F4 | P2, balance concern | Completion-only bot: Level 22 scores 13,926 against 13,900, a 26-point margin (0.19%); Level 28 margin 258 (1.32%); Level 8 margin 175 (3.43%). Level 21 finishes one life above its lives-star threshold; Level 26 finishes exactly at its ten-life threshold. Full table below. | Three stars are attainable, but these objectives deserve slower-purchase and human strategy checks before any target adjustment. Fixed-strategy success is not proof that the margins are fair. |
| F5 | P2, balance concern | The mixed Classic bot wins Easy with 25/25 lives, Medium with 20/20 and Hard with 15/15. All seven siege-ending scenarios fully evolve five towers. The no-gold-relic Medium runs also end with full lives and 3,268 gold. | Difficulty configs differ correctly, but optimized strategies may flatten the intended challenge. Compare novice builds and several Hard seeds before increasing pressure; no HP/reward/price changes made. |
| F6 | P3, pacing concern | Campaign Level 26 takes 760 simulated seconds; Level 29 takes 709. Boss Level 30 takes 530. The bot buys during combat, uses no speed increase and excludes idle preparation/reward decisions. | Later non-boss pacing can exceed boss pacing. Review enemy durability, spawn intervals and wave counts with players; these measurements do not include actual player decision time. |
| F7 | P3, coverage concern | Existing Classic runs exercise one mixed strategy and limited seeds. Campaign runs use no specializations or relics and make near-optimal coverage/purchase decisions. | Branch dominance, relic combinations, all ten Campaign sidegrades, novice difficulty and long endless runs need broader play evidence. Combat rules are tested, but strategic equivalence and enjoyable difficulty are not established. |
| F8 | P2, repaired | Cold desktop Main Menu → Classic Siege displayed missing-texture placeholders for starting gold/lives. DifficultyScene requests `hud_gold`/`hud_lives`, while [artkit](../src/game/art/artkit.ts) created only `hud_wave`/`hud_score` at menu readiness. The files were present; their derived textures were not created yet. | Reuse the existing coin/heart drawing functions during menu readiness, then promote all four cold icons to painted atlas icons when gameplay loads. [assets.test.ts](../tests/assets.test.ts) fails before the fix and verifies all four are promoted once without recreating painted textures. No extra network asset or new drawing helper. |
| F9 | P3, repaired | At 1280×720, wrapped difficulty descriptions reached the starting-gold row and collided with its label. The affected desktop card used a fixed statistics offset 128px above its bottom. | Move the three desktop stat rows down 14px within the existing cards. Compact rows are unchanged. Before/after real-browser screenshots verify separation and continued card containment; this is a spacing-only correction. |

No required production image file was missing, corrupt, blank in a required Campaign monster frame, or absent from its level/tier loader in the checks performed. F8 was an uncreated derived texture, caught by a real cold desktop visit despite the files being present. Existing older missing-art statements are already explicitly labeled historical in [production assets](CAMPAIGN_PRODUCTION_ASSETS.md) and [provenance](CAMPAIGN_PRODUCTION_ART_PROVENANCE.md); their current-status sections correctly record completion. They were preserved.

## Feature inventory and evidence

“Verified” below names the covered contract; it does not certify every human interaction on every device. Runtime captures used real WebGL on the in-app browser; QA captures are debug-assisted and do not prove gameplay balance. Automated simulations are separate and not debug-assisted.

| Feature | Mode | Implementation | Fresh verification and status |
| --- | --- | --- | --- |
| Boot, font readiness, staged assets, Retry/Back and stale-callback cleanup | Both | [BootScene](../src/game/scenes/BootScene.ts), [PreloadScene](../src/game/scenes/PreloadScene.ts) | [preload tests](../tests/preload.test.ts), [asset tests](../tests/assets.test.ts); cold Classic setup/gameplay and Campaign entry exercised. Verified; F2 repaired. Failed requests tested through loader fixtures, not a fresh browser network outage. |
| Main menu, direct modes, leaderboard/settings/progression/saved retry | Both | [MainMenuScene](../src/game/scenes/MainMenuScene.ts) | [screens](../tests/screens.test.ts), [saved-score UI](../tests/saved-score-ui.test.ts); browser 360×640, 390×844, 844×390, 1280×720, 1920×1080. F1 repaired. Save-bearing button geometry and routing automated; browser captures had a legacy best, not an injected current best plus retained submission. |
| Defender setup, three difficulty choices, Unicode/name limits | Classic | [DifficultyScene](../src/game/scenes/DifficultyScene.ts), [playerName](../src/shared/playerName.ts) | [player-name](../tests/player-name.test.ts), [responsive](../tests/responsive.test.ts), [assets](../tests/assets.test.ts); direct phone setup and Continue to gameplay exercised. Cold desktop setup exposed F8; repaired and rechecked. |
| World map, connected routes, locks, level details and scrolling/masking | Campaign | [CampaignScene](../src/game/scenes/CampaignScene.ts), [mapLayout](../src/game/campaign/mapLayout.ts) | [map layout](../tests/campaign-map-layout.test.ts), [world-map fit](../tests/campaign-world-map-fit.test.ts), [UI repair](../tests/campaign-ui-repair.test.ts); ordinary world map and start route exercised. Verified; physical touch gestures unverified. |
| Plot validity/clearance, previews, occupancy and affordability | Both | [buildPlotPolicy](../src/game/maps/buildPlotPolicy.ts), [GameScene](../src/game/scenes/GameScene.ts) | [clearance](../tests/build-plot-clearance.test.ts), [purchases](../tests/scene-purchases.test.ts), [game scene](../tests/game-scene.test.ts); twelve map families rendered. Verified rules; gestures covered separately. |
| Five tower archetypes, four foundation stages, sell/refund and five targeting modes | Both | [Tower](../src/game/entities/Tower.ts), [towers](../src/game/config/towers.ts), [CombatSystem](../src/game/systems/CombatSystem.ts) | [game](../tests/game.test.ts), [purchases](../tests/scene-purchases.test.ts), [combat](../tests/scene-combat.test.ts), actual-game simulations. Verified mechanics; tower dominance unverified (F7). |
| Ten evolution branches, ranks, achievement gates, previews and endless mastery | Classic | [EvolutionSystem](../src/game/systems/EvolutionSystem.ts), [EvolutionCombat](../src/game/systems/EvolutionCombat.ts), [UnlockSystem](../src/game/systems/UnlockSystem.ts) | [evolution system](../tests/evolution-system.test.ts), [evolution combat](../tests/evolution-combat.test.ts), [progression art](../tests/progression-art.test.ts), [achievements](../tests/scene-achievements.test.ts), [progression UI](../tests/progression-ui.test.ts); evolution/mastery runtime views sampled. Verified contracts; complete branch/rank visual matrix uses prior evidence below. |
| Two Campaign specializations per tower, prebattle targeting and immutable snapshots | Campaign | [specializations](../src/game/campaign/specializations.ts), [battle](../src/game/campaign/battle.ts) | [specializations](../tests/campaign-specializations.test.ts), [independent combat](../tests/campaign-independent-combat.test.ts), [Campaign scene](../tests/campaign-scene.test.ts). Verified gating and shot effects; complete sidegrade strategy balance unverified. |
| Thirty levels, authored rosters, wave timing, armor, wards, slow resistance/support | Campaign | [config](../src/game/campaign/config.ts), [enemies](../src/game/campaign/enemies.ts), [battle](../src/game/campaign/battle.ts) | [independent combat](../tests/campaign-independent-combat.test.ts), [Campaign combat](../tests/campaign-combat.test.ts), 60 full battle simulations. Verified production rules and attainable objectives for this strategy. |
| Classic roster, boss pressure, projectile/splash/chain/field/aura interactions | Classic | [enemies](../src/game/config/enemies.ts), [WaveSystem](../src/game/systems/WaveSystem.ts), [EvolutionCombat](../src/game/systems/EvolutionCombat.ts) | [combat](../tests/scene-combat.test.ts), [evolution combat](../tests/evolution-combat.test.ts), [simulation clock](../tests/simulation-clock.test.ts), eight balance runs; normal/heavy views sampled. Verified rules; F5/F7 concerns. |
| Hollow Warden shielding/summons, Colossus armor/core, Matriarch freeze/phase two | Campaign | [bosses](../src/game/campaign/bosses.ts), [enemy art](../src/game/art/enemyArt.ts) | [independent combat](../tests/campaign-independent-combat.test.ts), [enemy animation](../tests/campaign-enemy-animation.test.ts); all ten supported boss-phase fixtures rendered. Verified phase rules and sampled presentation; death/movement/facing priority additionally automated. |
| Fixed-step timing, speed, background/user/modal pause, resize and cleanup | Both | [SimulationClock](../src/game/systems/SimulationClock.ts), [PauseState](../src/game/systems/PauseState.ts), [GameScene](../src/game/scenes/GameScene.ts) | [scene timing](../tests/scene-timing.test.ts), [responsive](../tests/responsive.test.ts), [Campaign lifecycle](../tests/campaign-independent-lifecycle.test.ts), [QA lifecycle](../tests/qa.test.ts). Verified contracts; menu rotation checked through resize. Real hidden-tab timing is not remeasured in this release. |
| Auto wave starts and situational relic use | Both | [AutoSystem](../src/game/systems/AutoSystem.ts), [GameScene](../src/game/scenes/GameScene.ts) | [auto system](../tests/auto-system.test.ts), [scene auto](../tests/scene-auto.test.ts), [auto UI](../tests/scene-auto-ui.test.ts). Verified contexts, countdowns, pause and retained-reward behavior. |
| Ten relics, rarity/drop pools, overflow decisions, Meteor targeting, unusable retention | Both | [PowerUpSystem](../src/game/systems/PowerUpSystem.ts), [RunSimulation](../src/game/systems/RunSimulation.ts), [GameScene](../src/game/scenes/GameScene.ts) | [run simulation](../tests/run-simulation.test.ts), [game](../tests/game.test.ts), [auto system](../tests/auto-system.test.ts); reward/victory panels rendered. Verified transactions; human effectiveness and combined relic balance unverified. |
| Campaign Sigil relic gates and once-per-level reroll | Campaign | [progress](../src/game/campaign/progress.ts), [battle](../src/game/campaign/battle.ts) | [independent progress](../tests/campaign-independent-progress.test.ts), [Campaign combat](../tests/campaign-combat.test.ts), [Campaign scene](../tests/campaign-scene.test.ts). Verified pool/snapshot/reroll rules. |
| Siege boss escape/failure, fully settled victory, pending rewards, Finish/Endless | Classic | [SiegeSystem](../src/game/systems/SiegeSystem.ts), [GameScene](../src/game/scenes/GameScene.ts) | [siege finale](../tests/siege-finale.test.ts), [scene siege](../tests/scene-siege.test.ts), [score submission](../tests/score-submission.test.ts); victory panel sampled, seed 2 reaches wave 40. Verified contracts; beyond-wave-40 balance unverified. |
| Campaign completion/failure, three monotone stars, bests, next-level/result actions | Campaign | [progress](../src/game/campaign/progress.ts), [GameScene](../src/game/scenes/GameScene.ts) | [independent lifecycle](../tests/campaign-independent-lifecycle.test.ts), [independent progress](../tests/campaign-independent-progress.test.ts), 60 battle clears; results fixture rendered. Verified award/isolation contracts. |
| Seven mastery gates, three Sigils, Codex, preparation presets, cosmetic tiers | Campaign | [CampaignScene](../src/game/scenes/CampaignScene.ts), [progress](../src/game/campaign/progress.ts) | [independent progress](../tests/campaign-independent-progress.test.ts), [presentation](../tests/campaign-presentation.test.ts), all three tower-tier captures. Codex/preset/visual-tier contracts verified. Veteran/Conqueror are text indications rather than missing raster files; biome cosmetic flags remain F3. |
| Save merging, malformed/newer/denied storage, session-only warnings, mode isolation | Both | [progress](../src/game/campaign/progress.ts), [Settings](../src/game/systems/Settings.ts), [UnlockSystem](../src/game/systems/UnlockSystem.ts) | [Campaign independent progress](../tests/campaign-independent-progress.test.ts), [personal best](../tests/personal-best.test.ts), [unlocks](../tests/unlocks.test.ts), [settings](../tests/settings.test.ts); session-only Campaign result warning rendered. Verified storage contracts. |
| Results scoring, manual score submit, retained retries, legacy bests and leaderboard | Classic | [GameOverScene](../src/game/scenes/GameOverScene.ts), [LeaderboardScene](../src/game/scenes/LeaderboardScene.ts), [ScoreRetry](../src/game/systems/ScoreRetry.ts), [Worker](../worker/index.ts) | [screens](../tests/screens.test.ts), [score retry](../tests/score-retry.test.ts), [submission](../tests/score-submission.test.ts), [Worker](../tests/worker.test.ts), [validation](../tests/result-progress.test.ts). Verified contracts. No audit score was posted to production. |
| Original painted terrain/towers/monsters/icons, procedural effects and UI, result stronghold states | Both | [asset manifest](../src/game/art/assetManifest.ts), [Campaign manifest](../src/game/campaign/artManifest.ts), [art directory](../src/game/art) | [monster production](../tests/monster-production-art.test.ts), [assets](../tests/assets.test.ts), [progression art](../tests/progression-art.test.ts), [enemy animation](../tests/campaign-enemy-animation.test.ts); decoder/frame checks and 39 runtime captures. Verified presence and sampled rendering; all animation instants not freshly reviewed. |
| Audio synthesis, music/SFX toggles, volume and reduced motion | Both | [SoundManager](../src/game/systems/SoundManager.ts), [SettingsScene](../src/game/scenes/SettingsScene.ts) | [audio](../tests/audio.test.ts), [settings](../tests/settings.test.ts). Automated contracts verified; real output-device volume and subjective mix unverified. |

## Artwork evidence

- The unique runtime inventory is 65 files: six menu assets, fifteen shared gameplay assets, one defeat asset, and 43 Campaign assets (three world panels, twelve terrain plates, ten tower-tier images, eighteen monster sheets). The source directory also retains PNG counterparts for the 22 shared WebP files, making 87 public PNG/WebP files. Pillow decoded all 87.
- The new physical-file check visits all thirty levels at tiers 1–3 and includes boss summons. Existing production tests check eighteen RGBA sheet headers/dimensions and declared row bounds. An audit self-check inspected all 472 required monster frames: nonempty content, transparent pixels, and changing poses within every state.
- Fresh real-renderer captures cover twelve map families; fourteen ordinary enemy families as first-wave fixtures plus Stoneback in Level 4 mixed-wave combat; all three Campaign tower visual tiers; ten boss phase fixtures; and Classic normal/heavy/evolution/mastery/reward/victory/results. The repaired Game Over preview was recaptured after its initial failure. Forty art cases were inspected, with additional menu/setup/world-map captures.
- Some brief action states (buff, attack, death) are established through production animation/cue tests and prior review, rather than a new frame-by-frame browser recording. Current fresh stills alone do not certify every transient frame. Prior reviewed boards and full animation provenance are linked from [road/monster art](ROAD_CLEARANCE_AND_MONSTER_ART.md). Classic evolution accents and projectiles are intentionally procedural; prior full preview verification is in [evolution preview spec](superpowers/specs/2026-10-09-evolution-preview-verification-design.md).
- Route-node glyphs, mastery stars, Sigil labels, enemy preview badges, tower branch accents and effect overlays intentionally use vector/text/UI art. They were not treated as missing raster files.
- Raw local evidence lives under `artifacts/feature-audit-20261011/`: `decoded-assets.json`, `visual-cases.json`, screenshots, balance traces and `tests.json`. Artifacts are ignored by this repository; the findings and numerical results below are committed so conclusions remain readable without those files.

## Balance method and results

Classic uses [the existing eight runs](../tests/helpers/balanceRuns.ts) and [mixed bot](../tests/helpers/simulationBot.ts). It invokes actual GameScene combat at 50ms updates, ten seconds of preparation each wave, no selling/debug commands. Medium seed 2 continues to wave 40. Relic attribution has the existing limitation described by `RELIC_ATTRIBUTION_NOTE`; exact uses are in `relicUses`. The bot's reported duration is siege time even in its endless trace.

| Classic run | Outcome/waves completed | Lives | Gold at last recorded wave clear | Purchases | Relic uses | Fully evolved at siege victory |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Medium starter, seed 1 | Victory / 30 | 20 | 6,533 | 47 | 18 | 5 |
| Medium starter, seed 2 | Endless checkpoint / 40 | 16 | 10,296 | 55 | 18 | 5 |
| Medium alternative branches, seed 3 | Victory / 30 | 20 | 6,106 | 45 | 10 | 5 |
| Easy, seed 4 | Victory / 30 | 25 | 5,212 | 46 | 14 | 5 |
| Hard, seed 5 | Victory / 30 | 15 | 3,201 | 43 | 16 | 5 |
| Medium no gold relics, seed 1 | Victory / 30 | 20 | 3,268 | 41 | 3 | 5 |
| Medium no gold relics, seed 2 | Victory / 30 | 20 | 3,268 | 41 | 1 | 5 |
| Medium no gold relics, seed 3 | Victory / 30 | 20 | 3,268 | 41 | 0 | 5 |

All eight pass their existing acceptance rules. No-gold runs demonstrate that this strategy can win without gold-producing relics; they do not establish that every legal strategy can. Compare seed 1 and seed 3 to their matching no-gold cases; the ordinary seed-2 run continues into endless, so its wave-40 gold cannot be treated as a matched wave-30 economy comparison. Equal-difficulty cross-seed differences are not evidence of difficulty ordering.

Campaign reuses [campaign-scene.test.ts](../tests/campaign-scene.test.ts), invoking actual fixed-step combat at 16.67ms. Each battle starts with 600 gold/20 lives, buys a resistance-aware Ranger/Arcane opener and mixed foundation upgrades at high-coverage plots, and can buy every simulated second during combat. Rewards are discarded, random draws fixed at 0.99, no selling/relic activation/sidegrades/QA grants/permanent stat bonuses. Every level now runs twice: completion-only prior levels (minimum progression stars, prior boss Sigils earned), and a 90-star replay profile. The replay profile has every feature available but deliberately selects no specializations.

All 60 runs finish with victory and all three mastery flags. The two profiles produce the same combat results with these choices, consistent with cosmetic unlocks granting no permanent power. Profiles are repository-valid isolated fixtures, not a single continuously simulated save journey; completion-only prior results are 0 score/1 life. Those synthetic records provide a conservative lower bound on feature availability, not evidence that those exact earlier results are attainable. No unlocked sidegrade or relic is used to help clear the current battle. Spending and starting-resource assertions guard against phantom affordability.

| Level | Lives / lives-star threshold | Score / score-star target | Gold left | Simulated seconds |
| ---: | --- | --- | ---: | ---: |
| 1 | 20 / 12 | 3,195 / 1,950 | 110 | 103 |
| 2 | 20 / 12 | 3,861 / 2,400 | 183 | 86 |
| 3 | 20 / 12 | 3,859 / 2,850 | 169 | 89 |
| 4 | 20 / 12 | 4,237 / 3,300 | 110 | 225 |
| 5 | 15 / 12 | 4,314 / 3,750 | 131 | 269 |
| 6 | 20 / 12 | 4,720 / 4,200 | 255 | 255 |
| 7 | 20 / 12 | 5,379 / 4,650 | 222 | 241 |
| 8 | 15 / 12 | 5,275 / 5,100 | 151 | 338 |
| 9 | 20 / 12 | 6,333 / 5,550 | 155 | 283 |
| 10 | 20 / 10 | 7,675 / 6,000 | 558 | 287 |
| 11 | 20 / 11 | 6,882 / 5,700 | 265 | 271 |
| 12 | 16 / 11 | 7,735 / 6,400 | 145 | 205 |
| 13 | 20 / 11 | 8,703 / 7,100 | 348 | 269 |
| 14 | 20 / 11 | 8,707 / 7,800 | 204 | 384 |
| 15 | 20 / 11 | 9,399 / 8,500 | 422 | 238 |
| 16 | 20 / 11 | 12,679 / 9,200 | 270 | 257 |
| 17 | 20 / 11 | 11,236 / 9,900 | 421 | 410 |
| 18 | 20 / 11 | 12,597 / 10,600 | 266 | 347 |
| 19 | 20 / 11 | 12,613 / 11,300 | 188 | 502 |
| 20 | 20 / 9 | 14,280 / 12,000 | 710 | 404 |
| 21 | 11 / 10 | 13,321 / 12,950 | 230 | 335 |
| 22 | 20 / 10 | 13,926 / 13,900 | 282 | 369 |
| 23 | 13 / 10 | 16,401 / 14,850 | 288 | 520 |
| 24 | 20 / 10 | 17,527 / 15,800 | 306 | 477 |
| 25 | 20 / 10 | 19,372 / 16,750 | 306 | 476 |
| 26 | 10 / 10 | 18,546 / 17,700 | 488 | 760 |
| 27 | 20 / 10 | 20,832 / 18,650 | 273 | 396 |
| 28 | 20 / 10 | 19,858 / 19,600 | 389 | 537 |
| 29 | 20 / 10 | 21,789 / 20,550 | 337 | 709 |
| 30 | 20 / 8 | 24,054 / 21,500 | 634 | 530 |

## Remaining verification limits

Physical phone touch, audio-device quality, complete human playthroughs, all branch/rank and sidegrade strategy combinations, frame-by-frame transient animation review, all storage states in a real browser and long endless survival remain unverified. Existing automated tests and dated visual evidence cover many of those contracts; they are not substituted for fresh human evidence. No subjective balance tuning was performed. F3 is an explicit design gap, not a claim that the cosmetic rewards are fully implemented.

The suite passed 1,017 tests with zero failures and 11 skips before F8; its 90 affected asset/loading/QA/menu tests and typecheck also passed after F8. All skips belong to four older ignored opt-in artifact suites: bounded balance candidates, prior audit reports, computed branch comparisons and prior simulation recordings. Current balance acceptance and 60 Campaign scenarios ran. Final full-suite/build and release verification are recorded below.

## Published release

Final Worker version: `5cf1b895-ad9e-4c12-a7e4-ffbfe4024e65`. Live URL: [Aegis of the Borderkeep](https://aetherhold-defense.ljournllagas.workers.dev/). Current bundle: `index-Cl1ST4Zf.js`.

`npm run deploy` passed all 1,017 tests (11 older opt-in skips) and the TypeScript/Vite build before publishing. HTML, the current JavaScript bundle, CSS and all 65 runtime images returned 200 and matched local `dist` byte-for-byte. `/api/health` returned 200 with `ok: true`, `scoreVersion: 3`. The existing large-bundle build warning remains; no dependency/config/score-era change was made. Live browser checks cover cold Classic setup with working gold/lives icons and separated stat text, Continue to Classic gameplay with painted icons, and Campaign entry/return. No score submission or Campaign progress award was performed on production.

The first release check found F8, which was repaired and republished; desktop setup then exposed F9 spacing, also repaired and included in this final version. Python urllib requests received 403 in this environment, while the installed curl client and real browser returned 200. The successful final byte comparison used curl. These earlier attempts are not reported as successful final verification.

Remote synchronization includes the completed code, tests, this audit and approved spec. Unrelated `.scratch` contents are excluded from this task's commits.
