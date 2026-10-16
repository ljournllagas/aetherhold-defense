# Living Archive — preproduction art kit (no runtime integration)

Status: **preproduction design masters**. The seven files below are concept
sources for a possible future expansion. They are NOT production atlases,
and no world, enemy, tower, boss, save, route, or balance change is
authorized by this record.

Per `artifacts/image-reserve-20261016/README.md`, `manifest.json`,
`file-validation.json`, `visual-review.md`, and
`integration-prompts/archive-*.md`, runtime integration requires, in order:
(1) an agreed bounded content design, (2) authored animation/state assets
verifying the 128px enemy and 256px boss atlas contracts, (3) authored
terrain with exact route/plot geometry, (4) balance and save-migration
review. None of those exist yet.

## Kit (all verified present and decoding; see tests/living-archive-preproduction.test.ts)

| # | Use case | Master | Size | Mode | Design role |
|---|----------|--------|------|------|-------------|
| 1 | expansion-vista:living-archive | artifacts/image-reserve-20261016/masters/living-archive-vista.png | 1672x941 | RGB | Mood/vista reference: book-shaped stone arches, rooted libraries, lanterns, reflective ink-like waterways, dramatic distant page forms. Not a battlefield. |
| 2 | expansion-map:living-archive | artifacts/image-reserve-20261016/masters/living-archive-terrain.png | 1672x941 | RGB | Terrain concept: broad quiet stone center, perimeter shelves, book arches, quills and ink pools; no painted road or plot markers. Not a playable map. |
| 3 | expansion-tower:runebinder | artifacts/image-reserve-20261016/masters/living-archive-runebinder.png | 1254x1254 | RGBA | Tower concept: complete stone/brass bastion, emerald ring and floating book; single static pose. Not a foundation sheet or evolution entry. |
| 4 | expansion-enemy:inkling | artifacts/image-reserve-20261016/masters/living-archive-inkling.png | 1254x1254 | RGBA | Enemy concept: full-body ink creature, parchment collar, oversized quill crest (needs silhouette checks at combat size); single static pose. Not a 128px atlas (idle/walk/attack/death + buff). |
| 5 | expansion-enemy:folded-beast | artifacts/image-reserve-20261016/masters/living-archive-folded-beast.png | 1254x1254 | RGBA | Enemy concept: paper-armored quadruped with full ears, paws and tail (tail approaches right boundary, preserve padding); single static pose. Not a 128px atlas. |
| 6 | expansion-enemy:quillbound-curator | artifacts/image-reserve-20261016/masters/living-archive-quillbound-curator.png | 1254x1254 | RGBA | Enemy concept: masked green-robed construct with book, staff and feet; single static pose. Not a 128px atlas. |
| 7 | expansion-boss:unwritten-leviathan | artifacts/image-reserve-20261016/masters/living-archive-unwritten-leviathan.png | 1254x1254 | RGBA | Boss concept: compact serpentine silhouette, layered ivory armor, emerald cores and ink body (crown/tail close to frame, need export padding); single static pose. Not a 256px atlas with manifest states. |

SHA-256 (from `artifacts/image-reserve-20261016/file-validation.json`):
vista `150d1466…`, terrain `6ef76cc0…`, runebinder `775f386a…`,
inkling `a3ac36b8…`, folded-beast `6b2d257e…`,
quillbound-curator `58af3157…`, unwritten-leviathan `c6a7526f…`.

All five cutouts carry faint raw-alpha edge residue
(`raw alpha touches canvas edge; inspect clipping or residue`);
no alpha >= 16 touches an edge. Light/dark-background inspection and
suitable padding apply at production export; originals are preserved.

## Explicit non-goals

- No `living-archive` (or runebinder/inkling/folded-beast/
  quillbound-curator/unwritten-leviathan) world, level, enemy, tower, boss,
  sigil, portrait, save, or loader entry exists in runtime code. The
  accompanying test locks this.
- Creature masters must not be mislabeled as existing game requirements or
  production atlases.
