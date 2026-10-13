# Campaign final-art promotion checklist

## Live status and ownership

Use [asset-status.json](asset-status.json) as the single source for per-asset status, candidate and evidence paths, stable runtime keys, planned v2 paths, production ownership, scoped acceptance, pending gates, and the parent release gate. Do not copy live counts, statuses, or owners into this checklist. A runtime-review-pass can record a scoped pilot or action/native review; check each row stageAcceptance and pendingGates before treating the full stage as accepted. A whole-cohort readability hold in the ledger also blocks publication even when individual asset reviews pass.

## Promotion gates

1. Wait for the parent’s verified-candidate capsule and explicit release. Generation or self-review alone never authorizes promotion.
2. For every released asset, verify the exact candidate hash, dimensions, image mode, authored frame/state coverage, source chain, and independent raw and placed-runtime review evidence. A failed or held visual gate keeps the asset out of promotion.
3. Copy only the individually accepted files to their planned v2 public paths. Preserve all existing v1 public starters and their baseline hashes for older bundles and rollback.
4. Update only released manifest records. Preserve IDs, stable runtime keys, kind, stage, dimensions, frame/state definitions, and animation names/playback. Set accepted entries to final, clear temporary status, remove only quality flags that the evidence disproves, and keep supported flags.
5. Add only released v2 paths to `AVAILABLE_CAMPAIGN_ART_PATHS`. Remove only their corresponding v1 paths from `CAMPAIGN_PROVISIONAL_STARTER_PATHS`; keep all other provisional entries and gates intact.
6. Keep stage-scoped loading, per-level requests, and existing consumer keys. Change loaders or animation bindings only when a concrete verified failure requires it. Validate with a fresh page so cached textures cannot mask a changed asset URL.
7. Preserve the immutable v1 registry snapshot and save/geometry coverage. Add separate live-promotion expectations and candidate hashes; do not replace baseline fields or weaken assertions.
8. Treat local promotion and deployment as separate gates. Before deployment, require the independent post-promotion runtime review recorded in `asset-status.json`, including fresh-page texture loading and the relevant accepted viewport and gameplay contexts.

## Maintained verification surfaces

- `tests/campaign-art-manifest.test.ts`: verify exact live final/provisional registration and path allowlists, unchanged stable keys, stage scoping, and no campaign-art request from menu loading.
- `tests/world-map-art-independent.test.ts`: verify accepted panel paths separately from still-provisional panels.
- `tests/monster-production-art.test.ts`: verify promoted atlas grids and authored actions while withholding every unaccepted atlas.
- `tests/campaign-v5-compatibility.test.ts`: allow only explicitly accepted expansion paths and retain exact v1 save round-trips and legacy settings assertions.
- `tests/verification-v5-registry-geometry.test.ts` and `tests/fixtures/campaign-v5/registry-art-contract.json`: preserve the full v1 path/hash snapshot and all level, route geometry, build-plot, and save-digest checks; layer current accepted registrations and hashes beside that baseline.

## Rollback and contract risks

Previous deployed bundles continue to resolve the preserved v1 paths. Reverting the live manifest path/status and exact path allowlists restores the v1 runtime contract without rewriting the snapshot. Existing campaign consumers address assets through stable keys, so the default integration is manifest-only. Preload texture-key caching requires a fresh-page runtime check after path changes.

Per-asset evidence, the current integration/deployment gate, and live counts belong in `asset-status.json`; this checklist describes the repeatable promotion procedure and does not certify any asset or package as ready.

## Release evidence

Production and post-promotion evidence, current ownership, and release status are recorded in [asset-status.json](asset-status.json), with the relevant evidence paths linked there. This checklist does not duplicate rollout counts or certify the current release. Consult the ledger before any publication decision; authenticated gameplay status is also recorded there.
