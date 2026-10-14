# Aegis of the Borderkeep — promotional trailer

The complete feature trailer is **2:42, 1920×1080, 24 fps**, with H.264 video,
AAC stereo audio, animated title cards, actual game captures, animated art
showcases, and an original synthesized soundtrack. Open `index.html` through
a local HTTP server, or play `aegis-of-the-borderkeep-promo.mp4` directly.
`trailer.srt` and `trailer.vtt` provide optional English captions.

## Source and capture provenance

The workspace was switched to the fetched remote `main` at
`b33ea38e01754f2e6469eadf1660cd84b7520ee5` before production work.
That branch contains the older 30-level Campaign. The complete 100-level
release is on `origin/codex/campaign-v5-20261012`, at
`9aed4cbb5d8a460e3b773b94495780e91e6ec1d0`.
The trailer therefore uses an isolated archive of that release, without
merging it into main or changing the application. The existing production
Worker was not redeployed from the older main branch.

Footage is recorded from the actual Phaser application, using its existing
development fixtures to reach late-game battles and boss encounters. Campaign
completion screens and unlocked progression are demonstration states, not
claims of a player's earned results. Captures run in an isolated browser
context. API writes are blocked; public ranking data is read from production.
The QA overlay and fixture captions are hidden for clean footage. A temporary
browser-only reference to the Phaser game permits scene selection; no such
hook is added to the application source.

The evolution collection is rendered with the game's actual
`buildTowerVisual` and `decorateEvolution` functions. Other art showcases use
the exact final paths and frame geometry registered by the release's
`CAMPAIGN_ART_MANIFEST`, `STAGE_ASSETS`, `enemyAtlasFrames.json`, and relic
frame definitions. Existing project art provenance remains authoritative.
There is no stock footage, synthetic replacement gameplay, or third-party
music recording in this video.

## Coverage

| Time | Featured content |
| --- | --- |
| 0:00–0:14 | Brand, painted keep vista, placement, combat, actual upgrades, and the build/battle/upgrade loop |
| 0:14–0:25 | Classic Siege, 30 waves, all three difficulty artworks, Siege bosses, elites, and all nine Classic enemy artworks |
| 0:25–0:43 | All five tower families, all four Classic foundation stages, Campaign tiers II/III, all ten evolution names and crests, Endless and Mastery |
| 0:43–0:53 | All ten Relic artworks, four rarities, reward screen, storage, Meteor and Time Lock |
| 0:53–1:37 | 100-level Campaign map; all ten worlds; all 40 battlefield plates; ten world illustrations; all 50 regular Campaign enemy artworks |
| 1:37–2:01 | All ten Campaign boss artworks and encounters, their mechanics, and the Level 100 Aether Devourer finale |
| 2:01–2:20 | Battle preparation, targeting, presets, all ten specializations, scoring, mastery stars, Sigils, Codex, unlocks, rerolls, banners, crests and progression |
| 2:20–2:36 | Public rankings, Auto waves and Relics, speed/pause, sound settings, help, selling, keyboard/touch/camera controls, phone UI, guest saves and Google sync |
| 2:36–2:42 | “Just one more wave” and the live game URL |

`timeline.json` contains exact scene boundaries. `art-coverage.json` maps all
120 registered Campaign art assets to their appearance times.

## Verification

The deliverable must pass `tools/promo/verify.py`: complete video/audio decode,
1920×1080 at 24 fps, expected frame count, stereo AAC, visible motion in the
Classic and all ten world captures, complete Campaign art coverage, and an
unclipped original soundtrack. `verification.json` records the final results.
Every scene was also inspected in a generated contact sheet for content and
layout. The player is checked for successful loading, playback and seeking.

This is a media-only change. Application tests, builds and deployment are not
required to publish these repository artifacts; no runtime application file
is changed.

## Reproduce on the capture workstation

Requirements: Node, the bundled Playwright installation used by the capture
scripts, a Chromium browser, Python with Pillow, NumPy and imageio-ffmpeg, and
the Windows Georgia/Bahnschrift fonts. No product dependencies were added.
Run from the repository root. The source archive and raw captures are kept
under the ignored `artifacts/promo` directory.

For a fresh source directory, archive the exact release commit with
`rtk git archive 9aed4cbb5d8a460e3b773b94495780e91e6ec1d0 --output=artifacts/promo/source.tar`,
extract it into `artifacts/promo/source`, and provide its `node_modules`
through a junction to the repository's installed dependencies. Start the
isolated app with:

```powershell
rtk proxy node node_modules/vite/bin/vite.js artifacts/promo/source --host 127.0.0.1 --port 5179
```

In another terminal:

```powershell
rtk proxy node tools/promo/capture.cjs
rtk proxy node tools/promo/supplement.cjs
rtk proxy python tools/promo/render.py --preview
rtk proxy python tools/promo/render.py
rtk proxy python tools/promo/verify.py
```

The verified exports are produced in `artifacts/promo/output`. Copy the MP4,
captions, timeline and verification/coverage JSON to this directory, and
convert SRT timestamps from commas to periods with a `WEBVTT` header for the
browser track. To view this saved package:

```powershell
rtk proxy node tools/promo/serve.cjs
```

Then open `http://127.0.0.1:5181/`. The local preview server supports byte
ranges for browser seeking and serves only this package's files.
