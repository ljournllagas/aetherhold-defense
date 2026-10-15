# Integration entry points (inspect current code before changing)

| Use case | Existing source |
|---|---|
| Exact Classic branch IDs, owners and effects | src/game/config/evolutions.ts |
| Static tower art geometry, contact, foundation stages and decorateEvolution | src/game/art/towerArt.ts |
| Shared stage-specific loading | src/game/art/assetManifest.ts |
| Campaign art keys, image/sheet dimensions and authored animation states | src/game/campaign/artManifest.ts |
| Campaign cosmetics and terrain rendering | src/game/art/campaignArt.ts |
| Campaign worlds, levels, sigils and milestone definitions | src/game/campaign/config.ts and expansionContent.ts |
| World map sigil labels, mastery sheet and Aether Codex | src/game/scenes/CampaignScene.ts: openCodex and mastery/map presentation |
| Classic native road, plot candidates, keep and beacon geometry | src/game/maps/map1.ts |
| Campaign route and build-plot resolution | src/game/campaign/maps.ts and expansionRoutes.ts |
| Existing campaign enemies and boss mechanics | src/game/campaign/enemies.ts and bosses.ts |
| Campaign completion and result illustration | src/game/scenes/GameScene.ts: finishCampaign and renderCampaignResult; src/game/ui/campaignResultActions.ts |
| Classic terminal results | src/game/scenes/GameOverScene.ts |

There is no standalone CodexScene.ts or CampaignResultScene.ts in the inspected current tree. Do not invent those modules just to integrate a portrait or illustration. The UI art policy currently intentionally uses text/vector sigil presentation; adding painted trophies is a deliberate cosmetic change, not repairing a missing required file.

These pointers describe the inspected working tree, which already contained unrelated uncommitted Sentinel/Cinder work. Preserve that work and re-read consumers before integration. The source map is guidance, not a frozen API guarantee.
