# Integrate evolution:arcane-beacon

Selected image: masters/evolution-arcane-beacon.png
Existing tower ID: starfire

Read README.md, manifest.json, file-validation.json and the actual selected image first. Inspect current source and preserve unrelated work. This is a cosmetic/art task unless a new-content design is explicitly approved. Keep runtime labels and accessible controls separate from raster art. Measure actual dimensions, alpha bounds and readability; never assume a prompt proves compatibility. Implement only this use case. Run proportional tests and visual checks; follow AGENTS.md deployment and commit/push requirements for application changes. Report unresolved risks.

Inspect src/game/config/evolutions.ts, src/game/art/towerArt.ts, src/game/art/assetManifest.ts and src/game/art/campaignArt.ts. Add a separate static evolution image contract; do not replace or reinterpret the four-frame foundation sheet. Map exact branch ID to its existing tower. Preserve evolution stats/ranks, contactShadow, aim/muzzle positions, campaign tier precedence, portraits, selection and ground contact. Derive delivery WebP from the lossless master during integration. Verify branch switching, all ranks, campaign tiers, phone scale and loader failure.

Generation prompt: prompts/evolution-arcane-beacon.txt

Do not treat a generated file, a passing decode check, or an attractive preview as evidence that runtime integration is complete.
