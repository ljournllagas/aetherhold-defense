# Amber Hourglass — preproduction art kit (no runtime integration)

Status: **preproduction design masters**. The seven files below are concept
sources for a possible future expansion. They are NOT production atlases,
and no world, enemy, tower, boss, save, route, or balance change is
authorized by this record.

Per `artifacts/image-reserve-20261015/README.md` and `SCOPE.md`, runtime
integration requires, in order: (1) an agreed bounded content design,
(2) authored animation/state assets verifying the 128px enemy and 256px
boss atlas contracts, (3) authored terrain with exact route/plot geometry,
(4) balance and save-migration review. None of those exist yet.

## Kit (all verified present and decoding; see tests/amber-hourglass-preproduction.test.ts)

| # | Use case | Master | Size | Mode | Design role |
|---|----------|--------|------|------|-------------|
| 1 | expansion-vista:amber-hourglass | artifacts/image-reserve-20261015/masters/amber-hourglass-vista.png | 1672x941 | RGB | Mood/vista reference: bronze hourglasses, sandstone ruins, amber storms, teal shadows. Not a battlefield. |
| 2 | expansion-map:amber-hourglass | artifacts/image-reserve-20261015/masters/amber-hourglass-terrain.png | 1672x941 | RGB | Terrain concept: broad open center, perimeter landmarks, no painted routes or plot circles. Not a playable map. |
| 3 | expansion-tower:chronolens | artifacts/image-reserve-20261015/masters/amber-hourglass-chronolens.png | 1254x1254 | RGBA | Tower concept: single static pose. Not a foundation sheet or evolution entry. |
| 4 | expansion-enemy:clockmite | artifacts/image-reserve-20261015/masters/amber-hourglass-clockmite.png | 1254x1254 | RGBA | Enemy concept: single static pose. Not a 128px atlas (idle/walk/attack/death + buff). |
| 5 | expansion-enemy:pendulum-knight | artifacts/image-reserve-20261015/masters/amber-hourglass-pendulum-knight.png | 1254x1254 | RGBA | Enemy concept: single static pose. Not a 128px atlas. |
| 6 | expansion-enemy:hourkeeper | artifacts/image-reserve-20261015/masters/amber-hourglass-hourkeeper.png | 1254x1254 | RGBA | Enemy concept: single static pose. Not a 128px atlas. |
| 7 | expansion-boss:unwound-king | artifacts/image-reserve-20261015/masters/amber-hourglass-unwound-king.png | 1254x1254 | RGBA | Boss concept: single static pose. Not a 256px atlas with manifest states. |

SHA-256 (from `artifacts/image-reserve-20261015/file-validation.json`):
vista `f3c58952…`, terrain `e29a40b3…`, chronolens `98da3214…`,
clockmite `05b464bd…`, pendulum-knight `a266a339…`, hourkeeper `fd5794bd…`,
unwound-king `57851717…`.

## Explicit non-goals

- No `amber-hourglass` (or chronolens/clockmite/pendulum-knight/hourkeeper/
  unwound-king) world, level, enemy, tower, boss, sigil, portrait, save,
  or loader entry exists in runtime code. The accompanying test locks this.
- Creature masters must not be mislabeled as existing game requirements or
  production atlases.
