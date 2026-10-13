# Task ID V9 — World 4 post-promotion verification

**Outcome: PASS** for the local post-promotion asset, loader, stage, and focused interaction scope.

The 11 promoted files match their accepted candidates byte-for-byte on disk and in fresh browser responses to the normal v2 URLs. All 120 recorded v1 images still match their baseline hashes and dimensions: 43 original finals and 77 expansion starters. The live manifest enumerated all 100 campaign levels and selected registered map/enemy/boss keys from the expected final or provisional sets.

| Asset | Public URL | SHA-256 | Dimensions |
| --- | --- | --- | --- |
| map:whisperfen:a | `/assets/campaign/maps/whisperfen_a-v2.png` | `4f1fef06db7ec2ee7caa18ddd48b20f34e85d0051ba3000e852d268c69017797` | 1672×940 |
| map:whisperfen:b | `/assets/campaign/maps/whisperfen_b-v2.png` | `ee69916e9344e97ce8f9b7bc9d1aed0b451cd3f87f7195665f602f57329258d2` | 1672×940 |
| map:whisperfen:c | `/assets/campaign/maps/whisperfen_c-v2.png` | `2a9bcdbf759048c2026295878e6c264ba0ba749642890a7a3cd239bf3b912d5a` | 1672×940 |
| map:whisperfen:d | `/assets/campaign/maps/whisperfen_d-v2.png` | `0617810e89ca06ef608fad09882ddce04265b4507d3c5cf30a0ac7b8e00299da` | 1672×940 |
| world-panel:whisperfen | `/assets/campaign/world-map/whisperfen-v2.png` | `c585a31df7245d4b99f00a916c8226ffbb877ed95178fbe883db66443f77a2c9` | 768×432 |
| enemy:bogling | `/assets/campaign/enemies/whisperfen/bogling-atlas-v2.png` | `1ebb5f24fe3e6e09192d2508679c6e7a4f949c7520b50ba27b87404af0105873` | 768×512 |
| enemy:fen_skitter | `/assets/campaign/enemies/whisperfen/fen_skitter-atlas-v2.png` | `d67e435f9f9263e6cce676974b3aa15cc558976951cb9012aa55bc1c755fa79e` | 768×512 |
| enemy:mossguard | `/assets/campaign/enemies/whisperfen/mossguard-atlas-v2.png` | `c19d9b8ce50736c225d9e4b6c6ea56eec246bbda75923162190cfba26bb4ea10` | 768×512 |
| enemy:rotback | `/assets/campaign/enemies/whisperfen/rotback-atlas-v2.png` | `93ce8dab3a75d253e0c989c26c58ffc720444b2ca7e03b4bb648c7ae7e9c5ec7` | 768×512 |
| enemy:rootwretch | `/assets/campaign/enemies/whisperfen/rootwretch-atlas-v2.png` | `09eaaccab4034bf36e79920c6e697c444ff95ef0da4f583b7634c697f1a72b74` | 768×640 |
| boss:mireheart_hydra | `/assets/campaign/bosses/mireheart_hydra-atlas-v2.png` | `cbed46bbc139e37cbda59775203e850d8a320161c586cc91a033f70ba5da7500` | 2048×1536 |

The broad actual-GameScene cohort completed 17 contexts: A–D at 1440×900, 1280×720, 1024×768, and 844×390, plus D at 320×390. All map-fit, stage, panel, Hydra-mask, and public-response assertions passed. The one preserved first-run harness failure expected portrait vertical pan to remain fixed when boss removal restored a field that spans the full map height. The focused rerun verified the correct y=348 camera clamp while horizontal pan, zoom, Build sheet, purchase, tower registration, and sheet scroll remained intact.

The compact controls changed speed to 2× and back, paused/resumed, zoomed to 1.25×, and purchased a 100-gold Longbow (1200→1100 gold; 5→6 towers). The Build sheet survived resize to 390×844 and remained open through synthetic QA Hydra removal.

The authored level-36 schedule produced three real registered Rootwretches. With a QA-spawned, half-health Bogling from the production spawn factory 12 units away, the resumed real clock applied a 5.48 HP heal and played the registered Rootwretch buff at 6316.7 ms. This verifies the presentation hook but does not claim natural survival of the seeded target.

Fresh captures visually retain the panel, roads, plots, towers, boss HUD and gold feedback. Map D and fine sprite details are naturally small at 320×390. Local headless Chromium is the tested environment; physical touch gestures and a full uninterrupted match remain unverified. No production or account writes were made.

Evidence: [combined JSON report](final-review.json), [file and rollback checks](file-verification.json), [broad runtime report](attempt2-pan-clamp-expectation/v9-s2-golden-cohort-report.json), and [focused runtime report](runtime-final/v9-s2-golden-cohort-report.json). The initial no-target fixture failure is preserved in [attempt 1](attempt1-rootwretch-fixture-fail/v9-s2-golden-cohort-report.json).
