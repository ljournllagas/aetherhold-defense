/** Generated from integration-v5 canonical baseline JSON. DO NOT overwrite current Worlds 1–3.
 * This module compiles after CampaignWorldId, CampaignSigilId, CampaignWorldDefinition.worldNumber
 * are widened using docs/REPOSITORY_CHANGE_MAP.md. */
import type { CampaignLevelDefinition, CampaignWorldDefinition, CampaignSigilDefinition } from './types.ts';

export const EXPANSION_WORLDS: readonly CampaignWorldDefinition[] = [
  {
    "id": "whisperfen",
    "worldNumber": 4,
    "name": "Whisperfen",
    "levelStart": 31,
    "levelEnd": 40,
    "bossLevel": 40,
    "bossEnemyId": "mireheart_hydra",
    "sigilId": "mire_sigil",
    "visualThemeId": "whisperfen"
  },
  {
    "id": "sunken_aether",
    "worldNumber": 5,
    "name": "Sunken Aether Ruins",
    "levelStart": 41,
    "levelEnd": 50,
    "bossLevel": 50,
    "bossEnemyId": "drowned_oracle",
    "sigilId": "tide_sigil",
    "visualThemeId": "sunken_aether"
  },
  {
    "id": "ironroot",
    "worldNumber": 6,
    "name": "Ironroot Foundry",
    "levelStart": 51,
    "levelEnd": 60,
    "bossLevel": 60,
    "bossEnemyId": "iron_tyrant",
    "sigilId": "iron_sigil",
    "visualThemeId": "ironroot"
  },
  {
    "id": "sky_isles",
    "worldNumber": 7,
    "name": "Shattered Sky Isles",
    "levelStart": 61,
    "levelEnd": 70,
    "bossLevel": 70,
    "bossEnemyId": "stormmaw_prime",
    "sigilId": "sky_sigil",
    "visualThemeId": "sky_isles"
  },
  {
    "id": "dreadmoon",
    "worldNumber": 8,
    "name": "Dreadmoon Wastes",
    "levelStart": 71,
    "levelEnd": 80,
    "bossLevel": 80,
    "bossEnemyId": "umbral_regent",
    "sigilId": "moon_sigil",
    "visualThemeId": "dreadmoon"
  },
  {
    "id": "astral_rift",
    "worldNumber": 9,
    "name": "The Astral Rift",
    "levelStart": 81,
    "levelEnd": 90,
    "bossLevel": 90,
    "bossEnemyId": "rift_sovereign",
    "sigilId": "rift_sigil",
    "visualThemeId": "astral_rift"
  },
  {
    "id": "aether_crown",
    "worldNumber": 10,
    "name": "Crown of Aetherhold",
    "levelStart": 91,
    "levelEnd": 100,
    "bossLevel": 100,
    "bossEnemyId": "aether_devourer",
    "sigilId": "crown_sigil",
    "visualThemeId": "aether_crown"
  }
];

export const EXPANSION_LEVELS: readonly CampaignLevelDefinition[] = [
  {
    "level": 31,
    "worldId": "whisperfen",
    "mapLayoutId": "whisperfen_a",
    "difficultyRating": 1,
    "waveProfileId": "campaign_level_31",
    "enemyIds": [
      "bogling"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 11,
      "scoreTarget": 10000
    },
    "warnings": []
  },
  {
    "level": 32,
    "worldId": "whisperfen",
    "mapLayoutId": "whisperfen_a2",
    "difficultyRating": 1,
    "waveProfileId": "campaign_level_32",
    "enemyIds": [
      "bogling",
      "fen_skitter"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 11,
      "scoreTarget": 10300
    },
    "warnings": []
  },
  {
    "level": 33,
    "worldId": "whisperfen",
    "mapLayoutId": "whisperfen_a3",
    "difficultyRating": 2,
    "waveProfileId": "campaign_level_33",
    "enemyIds": [
      "fen_skitter",
      "bogling",
      "mossguard"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 11,
      "scoreTarget": 13500
    },
    "warnings": []
  },
  {
    "level": 34,
    "worldId": "whisperfen",
    "mapLayoutId": "whisperfen_b",
    "difficultyRating": 2,
    "waveProfileId": "campaign_level_34",
    "enemyIds": [
      "rotback",
      "bogling"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 11,
      "scoreTarget": 13000
    },
    "warnings": [
      "resistance"
    ]
  },
  {
    "level": 35,
    "worldId": "whisperfen",
    "mapLayoutId": "whisperfen_b2",
    "difficultyRating": 3,
    "waveProfileId": "campaign_level_35",
    "enemyIds": [
      "mossguard",
      "fen_skitter"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 11,
      "scoreTarget": 12000
    },
    "warnings": [
      "resistance"
    ]
  },
  {
    "level": 36,
    "worldId": "whisperfen",
    "mapLayoutId": "whisperfen_b3",
    "difficultyRating": 3,
    "waveProfileId": "campaign_level_36",
    "enemyIds": [
      "rootwretch",
      "bogling",
      "fen_skitter"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 11,
      "scoreTarget": 18000
    },
    "warnings": [
      "resistance",
      "support"
    ]
  },
  {
    "level": 37,
    "worldId": "whisperfen",
    "mapLayoutId": "whisperfen_c",
    "difficultyRating": 4,
    "waveProfileId": "campaign_level_37",
    "enemyIds": [
      "rotback",
      "rootwretch",
      "mossguard"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 11,
      "scoreTarget": 14000
    },
    "warnings": [
      "resistance",
      "support"
    ]
  },
  {
    "level": 38,
    "worldId": "whisperfen",
    "mapLayoutId": "whisperfen_c2",
    "difficultyRating": 4,
    "waveProfileId": "campaign_level_38",
    "enemyIds": [
      "bogling",
      "fen_skitter",
      "rotback",
      "mossguard",
      "rootwretch"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 11,
      "scoreTarget": 14500
    },
    "warnings": [
      "resistance",
      "support"
    ]
  },
  {
    "level": 39,
    "worldId": "whisperfen",
    "mapLayoutId": "whisperfen_c3",
    "difficultyRating": 5,
    "waveProfileId": "campaign_level_39",
    "enemyIds": [
      "fen_skitter",
      "rotback",
      "mossguard",
      "rootwretch"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 11,
      "scoreTarget": 15500
    },
    "warnings": [
      "resistance",
      "support",
      "elite_mix"
    ]
  },
  {
    "level": 40,
    "worldId": "whisperfen",
    "mapLayoutId": "whisperfen_d_boss",
    "difficultyRating": 5,
    "waveProfileId": "campaign_level_40",
    "enemyIds": [
      "bogling",
      "fen_skitter",
      "rootwretch"
    ],
    "bossEnemyId": "mireheart_hydra",
    "mastery": {
      "minimumLivesForStar": 9,
      "scoreTarget": 17000
    },
    "warnings": [
      "resistance",
      "support",
      "boss"
    ]
  },
  {
    "level": 41,
    "worldId": "sunken_aether",
    "mapLayoutId": "sunken_aether_a",
    "difficultyRating": 1,
    "waveProfileId": "campaign_level_41",
    "enemyIds": [
      "tideborn"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 11,
      "scoreTarget": 32560
    },
    "warnings": []
  },
  {
    "level": 42,
    "worldId": "sunken_aether",
    "mapLayoutId": "sunken_aether_a2",
    "difficultyRating": 1,
    "waveProfileId": "campaign_level_42",
    "enemyIds": [
      "tideborn",
      "crystal_wisp"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 11,
      "scoreTarget": 33520
    },
    "warnings": []
  },
  {
    "level": 43,
    "worldId": "sunken_aether",
    "mapLayoutId": "sunken_aether_a3",
    "difficultyRating": 2,
    "waveProfileId": "campaign_level_43",
    "enemyIds": [
      "crystal_wisp",
      "tideborn",
      "deepcrawler"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 11,
      "scoreTarget": 34480
    },
    "warnings": []
  },
  {
    "level": 44,
    "worldId": "sunken_aether",
    "mapLayoutId": "sunken_aether_b",
    "difficultyRating": 2,
    "waveProfileId": "campaign_level_44",
    "enemyIds": [
      "relic_guardian",
      "tideborn"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 11,
      "scoreTarget": 35440
    },
    "warnings": [
      "resistance"
    ]
  },
  {
    "level": 45,
    "worldId": "sunken_aether",
    "mapLayoutId": "sunken_aether_b2",
    "difficultyRating": 3,
    "waveProfileId": "campaign_level_45",
    "enemyIds": [
      "deepcrawler",
      "crystal_wisp"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 11,
      "scoreTarget": 36400
    },
    "warnings": [
      "resistance"
    ]
  },
  {
    "level": 46,
    "worldId": "sunken_aether",
    "mapLayoutId": "sunken_aether_b3",
    "difficultyRating": 3,
    "waveProfileId": "campaign_level_46",
    "enemyIds": [
      "aetherbound",
      "tideborn",
      "crystal_wisp"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 11,
      "scoreTarget": 37360
    },
    "warnings": [
      "resistance",
      "support"
    ]
  },
  {
    "level": 47,
    "worldId": "sunken_aether",
    "mapLayoutId": "sunken_aether_c",
    "difficultyRating": 4,
    "waveProfileId": "campaign_level_47",
    "enemyIds": [
      "relic_guardian",
      "aetherbound",
      "deepcrawler"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 11,
      "scoreTarget": 38320
    },
    "warnings": [
      "resistance",
      "support"
    ]
  },
  {
    "level": 48,
    "worldId": "sunken_aether",
    "mapLayoutId": "sunken_aether_c2",
    "difficultyRating": 4,
    "waveProfileId": "campaign_level_48",
    "enemyIds": [
      "tideborn",
      "crystal_wisp",
      "relic_guardian",
      "deepcrawler",
      "aetherbound"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 11,
      "scoreTarget": 39280
    },
    "warnings": [
      "resistance",
      "support"
    ]
  },
  {
    "level": 49,
    "worldId": "sunken_aether",
    "mapLayoutId": "sunken_aether_c3",
    "difficultyRating": 5,
    "waveProfileId": "campaign_level_49",
    "enemyIds": [
      "crystal_wisp",
      "relic_guardian",
      "deepcrawler",
      "aetherbound"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 11,
      "scoreTarget": 40240
    },
    "warnings": [
      "resistance",
      "support",
      "elite_mix"
    ]
  },
  {
    "level": 50,
    "worldId": "sunken_aether",
    "mapLayoutId": "sunken_aether_d_boss",
    "difficultyRating": 5,
    "waveProfileId": "campaign_level_50",
    "enemyIds": [
      "tideborn",
      "crystal_wisp",
      "aetherbound"
    ],
    "bossEnemyId": "drowned_oracle",
    "mastery": {
      "minimumLivesForStar": 9,
      "scoreTarget": 43000
    },
    "warnings": [
      "resistance",
      "support",
      "boss"
    ]
  },
  {
    "level": 51,
    "worldId": "ironroot",
    "mapLayoutId": "ironroot_a",
    "difficultyRating": 1,
    "waveProfileId": "campaign_level_51",
    "enemyIds": [
      "scrapling"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 10,
      "scoreTarget": 42160
    },
    "warnings": []
  },
  {
    "level": 52,
    "worldId": "ironroot",
    "mapLayoutId": "ironroot_a2",
    "difficultyRating": 1,
    "waveProfileId": "campaign_level_52",
    "enemyIds": [
      "scrapling",
      "furnace_hound"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 10,
      "scoreTarget": 43120
    },
    "warnings": []
  },
  {
    "level": 53,
    "worldId": "ironroot",
    "mapLayoutId": "ironroot_a3",
    "difficultyRating": 2,
    "waveProfileId": "campaign_level_53",
    "enemyIds": [
      "furnace_hound",
      "scrapling",
      "siege_golem"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 10,
      "scoreTarget": 44080
    },
    "warnings": []
  },
  {
    "level": 54,
    "worldId": "ironroot",
    "mapLayoutId": "ironroot_b",
    "difficultyRating": 2,
    "waveProfileId": "campaign_level_54",
    "enemyIds": [
      "ironbound",
      "scrapling"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 10,
      "scoreTarget": 45040
    },
    "warnings": [
      "resistance"
    ]
  },
  {
    "level": 55,
    "worldId": "ironroot",
    "mapLayoutId": "ironroot_b2",
    "difficultyRating": 3,
    "waveProfileId": "campaign_level_55",
    "enemyIds": [
      "siege_golem",
      "furnace_hound"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 10,
      "scoreTarget": 46000
    },
    "warnings": [
      "resistance"
    ]
  },
  {
    "level": 56,
    "worldId": "ironroot",
    "mapLayoutId": "ironroot_b3",
    "difficultyRating": 3,
    "waveProfileId": "campaign_level_56",
    "enemyIds": [
      "foundry_core",
      "scrapling",
      "furnace_hound"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 10,
      "scoreTarget": 46960
    },
    "warnings": [
      "resistance",
      "support"
    ]
  },
  {
    "level": 57,
    "worldId": "ironroot",
    "mapLayoutId": "ironroot_c",
    "difficultyRating": 4,
    "waveProfileId": "campaign_level_57",
    "enemyIds": [
      "ironbound",
      "foundry_core",
      "siege_golem"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 10,
      "scoreTarget": 47920
    },
    "warnings": [
      "resistance",
      "support"
    ]
  },
  {
    "level": 58,
    "worldId": "ironroot",
    "mapLayoutId": "ironroot_c2",
    "difficultyRating": 4,
    "waveProfileId": "campaign_level_58",
    "enemyIds": [
      "scrapling",
      "furnace_hound",
      "ironbound",
      "siege_golem",
      "foundry_core"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 10,
      "scoreTarget": 48880
    },
    "warnings": [
      "resistance",
      "support"
    ]
  },
  {
    "level": 59,
    "worldId": "ironroot",
    "mapLayoutId": "ironroot_c3",
    "difficultyRating": 5,
    "waveProfileId": "campaign_level_59",
    "enemyIds": [
      "furnace_hound",
      "ironbound",
      "siege_golem",
      "foundry_core"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 10,
      "scoreTarget": 49840
    },
    "warnings": [
      "resistance",
      "support",
      "elite_mix"
    ]
  },
  {
    "level": 60,
    "worldId": "ironroot",
    "mapLayoutId": "ironroot_d_boss",
    "difficultyRating": 5,
    "waveProfileId": "campaign_level_60",
    "enemyIds": [
      "scrapling",
      "furnace_hound",
      "foundry_core"
    ],
    "bossEnemyId": "iron_tyrant",
    "mastery": {
      "minimumLivesForStar": 8,
      "scoreTarget": 52600
    },
    "warnings": [
      "resistance",
      "support",
      "boss"
    ]
  },
  {
    "level": 61,
    "worldId": "sky_isles",
    "mapLayoutId": "sky_isles_a",
    "difficultyRating": 1,
    "waveProfileId": "campaign_level_61",
    "enemyIds": [
      "cloud_skitter"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 10,
      "scoreTarget": 51760
    },
    "warnings": []
  },
  {
    "level": 62,
    "worldId": "sky_isles",
    "mapLayoutId": "sky_isles_a2",
    "difficultyRating": 1,
    "waveProfileId": "campaign_level_62",
    "enemyIds": [
      "cloud_skitter",
      "galeclaw"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 10,
      "scoreTarget": 52720
    },
    "warnings": []
  },
  {
    "level": 63,
    "worldId": "sky_isles",
    "mapLayoutId": "sky_isles_a3",
    "difficultyRating": 2,
    "waveProfileId": "campaign_level_63",
    "enemyIds": [
      "galeclaw",
      "cloud_skitter",
      "aether_drake"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 10,
      "scoreTarget": 53680
    },
    "warnings": []
  },
  {
    "level": 64,
    "worldId": "sky_isles",
    "mapLayoutId": "sky_isles_b",
    "difficultyRating": 2,
    "waveProfileId": "campaign_level_64",
    "enemyIds": [
      "stormguard",
      "cloud_skitter"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 10,
      "scoreTarget": 54640
    },
    "warnings": [
      "resistance"
    ]
  },
  {
    "level": 65,
    "worldId": "sky_isles",
    "mapLayoutId": "sky_isles_b2",
    "difficultyRating": 3,
    "waveProfileId": "campaign_level_65",
    "enemyIds": [
      "aether_drake",
      "galeclaw"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 10,
      "scoreTarget": 55600
    },
    "warnings": [
      "resistance"
    ]
  },
  {
    "level": 66,
    "worldId": "sky_isles",
    "mapLayoutId": "sky_isles_b3",
    "difficultyRating": 3,
    "waveProfileId": "campaign_level_66",
    "enemyIds": [
      "tempest_herald",
      "cloud_skitter",
      "galeclaw"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 10,
      "scoreTarget": 56560
    },
    "warnings": [
      "resistance",
      "support"
    ]
  },
  {
    "level": 67,
    "worldId": "sky_isles",
    "mapLayoutId": "sky_isles_c",
    "difficultyRating": 4,
    "waveProfileId": "campaign_level_67",
    "enemyIds": [
      "stormguard",
      "tempest_herald",
      "aether_drake"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 10,
      "scoreTarget": 57520
    },
    "warnings": [
      "resistance",
      "support"
    ]
  },
  {
    "level": 68,
    "worldId": "sky_isles",
    "mapLayoutId": "sky_isles_c2",
    "difficultyRating": 4,
    "waveProfileId": "campaign_level_68",
    "enemyIds": [
      "cloud_skitter",
      "galeclaw",
      "stormguard",
      "aether_drake",
      "tempest_herald"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 10,
      "scoreTarget": 58480
    },
    "warnings": [
      "resistance",
      "support"
    ]
  },
  {
    "level": 69,
    "worldId": "sky_isles",
    "mapLayoutId": "sky_isles_c3",
    "difficultyRating": 5,
    "waveProfileId": "campaign_level_69",
    "enemyIds": [
      "galeclaw",
      "stormguard",
      "aether_drake",
      "tempest_herald"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 10,
      "scoreTarget": 59440
    },
    "warnings": [
      "resistance",
      "support",
      "elite_mix"
    ]
  },
  {
    "level": 70,
    "worldId": "sky_isles",
    "mapLayoutId": "sky_isles_d_boss",
    "difficultyRating": 5,
    "waveProfileId": "campaign_level_70",
    "enemyIds": [
      "cloud_skitter",
      "galeclaw",
      "tempest_herald"
    ],
    "bossEnemyId": "stormmaw_prime",
    "mastery": {
      "minimumLivesForStar": 8,
      "scoreTarget": 62200
    },
    "warnings": [
      "resistance",
      "support",
      "boss"
    ]
  },
  {
    "level": 71,
    "worldId": "dreadmoon",
    "mapLayoutId": "dreadmoon_a",
    "difficultyRating": 1,
    "waveProfileId": "campaign_level_71",
    "enemyIds": [
      "shadeborn"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 9,
      "scoreTarget": 61360
    },
    "warnings": []
  },
  {
    "level": 72,
    "worldId": "dreadmoon",
    "mapLayoutId": "dreadmoon_a2",
    "difficultyRating": 1,
    "waveProfileId": "campaign_level_72",
    "enemyIds": [
      "shadeborn",
      "dusk_runner"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 9,
      "scoreTarget": 62320
    },
    "warnings": []
  },
  {
    "level": 73,
    "worldId": "dreadmoon",
    "mapLayoutId": "dreadmoon_a3",
    "difficultyRating": 2,
    "waveProfileId": "campaign_level_73",
    "enemyIds": [
      "dusk_runner",
      "shadeborn",
      "moonstalker"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 9,
      "scoreTarget": 63280
    },
    "warnings": []
  },
  {
    "level": 74,
    "worldId": "dreadmoon",
    "mapLayoutId": "dreadmoon_b",
    "difficultyRating": 2,
    "waveProfileId": "campaign_level_74",
    "enemyIds": [
      "grave_hulk",
      "shadeborn"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 9,
      "scoreTarget": 64240
    },
    "warnings": [
      "resistance"
    ]
  },
  {
    "level": 75,
    "worldId": "dreadmoon",
    "mapLayoutId": "dreadmoon_b2",
    "difficultyRating": 3,
    "waveProfileId": "campaign_level_75",
    "enemyIds": [
      "moonstalker",
      "dusk_runner"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 9,
      "scoreTarget": 65200
    },
    "warnings": [
      "resistance"
    ]
  },
  {
    "level": 76,
    "worldId": "dreadmoon",
    "mapLayoutId": "dreadmoon_b3",
    "difficultyRating": 3,
    "waveProfileId": "campaign_level_76",
    "enemyIds": [
      "echo_shade",
      "shadeborn",
      "dusk_runner"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 9,
      "scoreTarget": 66160
    },
    "warnings": [
      "resistance",
      "support"
    ]
  },
  {
    "level": 77,
    "worldId": "dreadmoon",
    "mapLayoutId": "dreadmoon_c",
    "difficultyRating": 4,
    "waveProfileId": "campaign_level_77",
    "enemyIds": [
      "grave_hulk",
      "echo_shade",
      "moonstalker"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 9,
      "scoreTarget": 67120
    },
    "warnings": [
      "resistance",
      "support"
    ]
  },
  {
    "level": 78,
    "worldId": "dreadmoon",
    "mapLayoutId": "dreadmoon_c2",
    "difficultyRating": 4,
    "waveProfileId": "campaign_level_78",
    "enemyIds": [
      "shadeborn",
      "dusk_runner",
      "grave_hulk",
      "moonstalker",
      "echo_shade"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 9,
      "scoreTarget": 68080
    },
    "warnings": [
      "resistance",
      "support"
    ]
  },
  {
    "level": 79,
    "worldId": "dreadmoon",
    "mapLayoutId": "dreadmoon_c3",
    "difficultyRating": 5,
    "waveProfileId": "campaign_level_79",
    "enemyIds": [
      "dusk_runner",
      "grave_hulk",
      "moonstalker",
      "echo_shade"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 9,
      "scoreTarget": 69040
    },
    "warnings": [
      "resistance",
      "support",
      "elite_mix"
    ]
  },
  {
    "level": 80,
    "worldId": "dreadmoon",
    "mapLayoutId": "dreadmoon_d_boss",
    "difficultyRating": 5,
    "waveProfileId": "campaign_level_80",
    "enemyIds": [
      "shadeborn",
      "dusk_runner",
      "echo_shade"
    ],
    "bossEnemyId": "umbral_regent",
    "mastery": {
      "minimumLivesForStar": 7,
      "scoreTarget": 71800
    },
    "warnings": [
      "resistance",
      "support",
      "boss"
    ]
  },
  {
    "level": 81,
    "worldId": "astral_rift",
    "mapLayoutId": "astral_rift_a",
    "difficultyRating": 1,
    "waveProfileId": "campaign_level_81",
    "enemyIds": [
      "riftling"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 9,
      "scoreTarget": 70960
    },
    "warnings": []
  },
  {
    "level": 82,
    "worldId": "astral_rift",
    "mapLayoutId": "astral_rift_a2",
    "difficultyRating": 1,
    "waveProfileId": "campaign_level_82",
    "enemyIds": [
      "riftling",
      "phase_hound"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 9,
      "scoreTarget": 71920
    },
    "warnings": []
  },
  {
    "level": 83,
    "worldId": "astral_rift",
    "mapLayoutId": "astral_rift_a3",
    "difficultyRating": 2,
    "waveProfileId": "campaign_level_83",
    "enemyIds": [
      "phase_hound",
      "riftling",
      "astral_horror"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 9,
      "scoreTarget": 72880
    },
    "warnings": []
  },
  {
    "level": 84,
    "worldId": "astral_rift",
    "mapLayoutId": "astral_rift_b",
    "difficultyRating": 2,
    "waveProfileId": "campaign_level_84",
    "enemyIds": [
      "voidplate",
      "riftling"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 9,
      "scoreTarget": 73840
    },
    "warnings": [
      "resistance"
    ]
  },
  {
    "level": 85,
    "worldId": "astral_rift",
    "mapLayoutId": "astral_rift_b2",
    "difficultyRating": 3,
    "waveProfileId": "campaign_level_85",
    "enemyIds": [
      "astral_horror",
      "phase_hound"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 9,
      "scoreTarget": 74800
    },
    "warnings": [
      "resistance"
    ]
  },
  {
    "level": 86,
    "worldId": "astral_rift",
    "mapLayoutId": "astral_rift_b3",
    "difficultyRating": 3,
    "waveProfileId": "campaign_level_86",
    "enemyIds": [
      "rift_weaver",
      "riftling",
      "phase_hound"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 9,
      "scoreTarget": 75760
    },
    "warnings": [
      "resistance",
      "support"
    ]
  },
  {
    "level": 87,
    "worldId": "astral_rift",
    "mapLayoutId": "astral_rift_c",
    "difficultyRating": 4,
    "waveProfileId": "campaign_level_87",
    "enemyIds": [
      "voidplate",
      "rift_weaver",
      "astral_horror"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 9,
      "scoreTarget": 76720
    },
    "warnings": [
      "resistance",
      "support"
    ]
  },
  {
    "level": 88,
    "worldId": "astral_rift",
    "mapLayoutId": "astral_rift_c2",
    "difficultyRating": 4,
    "waveProfileId": "campaign_level_88",
    "enemyIds": [
      "riftling",
      "phase_hound",
      "voidplate",
      "astral_horror",
      "rift_weaver"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 9,
      "scoreTarget": 77680
    },
    "warnings": [
      "resistance",
      "support"
    ]
  },
  {
    "level": 89,
    "worldId": "astral_rift",
    "mapLayoutId": "astral_rift_c3",
    "difficultyRating": 5,
    "waveProfileId": "campaign_level_89",
    "enemyIds": [
      "phase_hound",
      "voidplate",
      "astral_horror",
      "rift_weaver"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 9,
      "scoreTarget": 78640
    },
    "warnings": [
      "resistance",
      "support",
      "elite_mix"
    ]
  },
  {
    "level": 90,
    "worldId": "astral_rift",
    "mapLayoutId": "astral_rift_d_boss",
    "difficultyRating": 5,
    "waveProfileId": "campaign_level_90",
    "enemyIds": [
      "riftling",
      "phase_hound",
      "rift_weaver"
    ],
    "bossEnemyId": "rift_sovereign",
    "mastery": {
      "minimumLivesForStar": 7,
      "scoreTarget": 81400
    },
    "warnings": [
      "resistance",
      "support",
      "boss"
    ]
  },
  {
    "level": 91,
    "worldId": "aether_crown",
    "mapLayoutId": "aether_crown_a",
    "difficultyRating": 1,
    "waveProfileId": "campaign_level_91",
    "enemyIds": [
      "aetherborn"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 8,
      "scoreTarget": 80560
    },
    "warnings": []
  },
  {
    "level": 92,
    "worldId": "aether_crown",
    "mapLayoutId": "aether_crown_a2",
    "difficultyRating": 1,
    "waveProfileId": "campaign_level_92",
    "enemyIds": [
      "aetherborn",
      "crown_runner"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 8,
      "scoreTarget": 81520
    },
    "warnings": []
  },
  {
    "level": 93,
    "worldId": "aether_crown",
    "mapLayoutId": "aether_crown_a3",
    "difficultyRating": 2,
    "waveProfileId": "campaign_level_93",
    "enemyIds": [
      "crown_runner",
      "aetherborn",
      "aether_seer"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 8,
      "scoreTarget": 82480
    },
    "warnings": []
  },
  {
    "level": 94,
    "worldId": "aether_crown",
    "mapLayoutId": "aether_crown_b",
    "difficultyRating": 2,
    "waveProfileId": "campaign_level_94",
    "enemyIds": [
      "sentry_colossus",
      "aetherborn"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 8,
      "scoreTarget": 83440
    },
    "warnings": [
      "resistance"
    ]
  },
  {
    "level": 95,
    "worldId": "aether_crown",
    "mapLayoutId": "aether_crown_b2",
    "difficultyRating": 3,
    "waveProfileId": "campaign_level_95",
    "enemyIds": [
      "aether_seer",
      "crown_runner"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 8,
      "scoreTarget": 84400
    },
    "warnings": [
      "resistance"
    ]
  },
  {
    "level": 96,
    "worldId": "aether_crown",
    "mapLayoutId": "aether_crown_b3",
    "difficultyRating": 3,
    "waveProfileId": "campaign_level_96",
    "enemyIds": [
      "crown_archon",
      "aetherborn",
      "crown_runner"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 8,
      "scoreTarget": 85360
    },
    "warnings": [
      "resistance",
      "support"
    ]
  },
  {
    "level": 97,
    "worldId": "aether_crown",
    "mapLayoutId": "aether_crown_c",
    "difficultyRating": 4,
    "waveProfileId": "campaign_level_97",
    "enemyIds": [
      "sentry_colossus",
      "crown_archon",
      "aether_seer"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 8,
      "scoreTarget": 86320
    },
    "warnings": [
      "resistance",
      "support"
    ]
  },
  {
    "level": 98,
    "worldId": "aether_crown",
    "mapLayoutId": "aether_crown_c2",
    "difficultyRating": 4,
    "waveProfileId": "campaign_level_98",
    "enemyIds": [
      "aetherborn",
      "crown_runner",
      "sentry_colossus",
      "aether_seer",
      "crown_archon"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 8,
      "scoreTarget": 87280
    },
    "warnings": [
      "resistance",
      "support"
    ]
  },
  {
    "level": 99,
    "worldId": "aether_crown",
    "mapLayoutId": "aether_crown_c3",
    "difficultyRating": 5,
    "waveProfileId": "campaign_level_99",
    "enemyIds": [
      "crown_runner",
      "sentry_colossus",
      "aether_seer",
      "crown_archon"
    ],
    "bossEnemyId": null,
    "mastery": {
      "minimumLivesForStar": 8,
      "scoreTarget": 88240
    },
    "warnings": [
      "resistance",
      "support",
      "elite_mix"
    ]
  },
  {
    "level": 100,
    "worldId": "aether_crown",
    "mapLayoutId": "aether_crown_d_boss",
    "difficultyRating": 5,
    "waveProfileId": "campaign_level_100",
    "enemyIds": [
      "aetherborn",
      "crown_runner",
      "crown_archon"
    ],
    "bossEnemyId": "aether_devourer",
    "mastery": {
      "minimumLivesForStar": 6,
      "scoreTarget": 91000
    },
    "warnings": [
      "resistance",
      "support",
      "boss"
    ]
  }
];

export const EXPANSION_SIGILS: readonly CampaignSigilDefinition[] = [
  {
    "id": "mire_sigil",
    "level": 40,
    "unlocks": [
      "world_5"
    ]
  },
  {
    "id": "tide_sigil",
    "level": 50,
    "unlocks": [
      "world_6"
    ]
  },
  {
    "id": "iron_sigil",
    "level": 60,
    "unlocks": [
      "world_7"
    ]
  },
  {
    "id": "sky_sigil",
    "level": 70,
    "unlocks": [
      "world_8"
    ]
  },
  {
    "id": "moon_sigil",
    "level": 80,
    "unlocks": [
      "world_9"
    ]
  },
  {
    "id": "rift_sigil",
    "level": 90,
    "unlocks": [
      "world_10"
    ]
  },
  {
    "id": "crown_sigil",
    "level": 100,
    "unlocks": [
      "campaign_100_clear"
    ]
  }
];

export const EXPANSION_MAX_LEVEL = 100;
export const EXPANSION_MAX_STARS = 300;
export const EXPANSION_MAX_SIGILS = 10;
