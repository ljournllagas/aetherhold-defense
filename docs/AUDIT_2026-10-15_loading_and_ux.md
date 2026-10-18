# Loading speed, layout and UX audit — 2026-10-15

Base: `origin/main` at 41c3513. Method: code review, asset/bundle measurement, and Chromium screenshots at 1280x720, 390x844 and 844x390 against the dev server.

## 1. Loading speed

| Finding | Before | After |
|---|---|---|
| Campaign level art (maps, boss and enemy atlases, world-map panels, tower tiers) shipped as lossless PNG | 234 MB total, 3–4 MB per battle map | 46 MB total, ~0.5 MB per battle map (lossy WebP, identical pixel size) |
| Classic/menu art (WebP but effectively lossless) | menu stage 9.2 MB, classic battle stage 20.4 MB | 2.2 MB and 5.7 MB |
| One 2.2 MB JS file, so every game-code deploy re-downloaded Phaser | 1 file | `phaser` chunk (1.68 MB, immutable) + 543 kB game chunk |
| Boot waited for the account/config round-trips before fetching any art or fonts | art and fonts only after the network check | fonts and menu art start in parallel with it; the two hero images are also `<link rel=preload>`ed from `index.html` |
| UI fonts were never requested explicitly, so first-frame canvas text could use the fallback face | — | `ensureUiFonts()` requests all five faces and Preload waits for it |
| Blank page until the 2 MB script parsed | blank | inline HTML splash, removed after Phaser's first frame |
| Hashed bundles/fonts had no cache policy; the service worker precached `.woff` twins and Cyrillic/Greek/Vietnamese subsets | 63 entries, 2.95 MB | immutable cache headers; 23 entries, 2.42 MB precache |

Source PNGs were left in the repository, unused, because deleting them was not authorised in this session. Removing `public/assets/campaign/**/*.png` and the classic `*.png` twins would shrink every deploy by ~250 MB. `tools/optimize-art.py` regenerates the WebP files from PNG sources (additive only). Resolved 2026-10-18: `public/.assetsignore` excludes `/assets/**/*.png` from the deployed asset set, so the sources stay in the repository for regeneration but no longer ship. Verified with `wrangler deploy --dry-run` at debug level: 225 PNGs ignored, 0 WebP; the PWA icons, screenshots and favicon still upload.

The frozen SHA-256 baselines in `tests/fixtures/campaign-v5/registry-art-contract.json` now describe the optimised WebP files. Budgets are enforced by `tests/loading-performance.test.ts`.

Version-bumped classic assets: menu vistas, emblem, difficulty helms, HUD/relic/beacon atlases, tower sheets, enemy walk atlases, classic map and defeat map. Texture keys are unchanged.

## 2. Layout

- Desktop battle: the 240 px inspector column was empty black until a tower was selected. It now shows a "Command Post" panel with the next action and the keyboard shortcuts.
- Main menu: the title block was an opaque slab over the vista; it is now 70% opaque so the painting shows through. The duplicate "DEFENDER name" chip (the account chip already shows the name) was removed.
- Phone Settings: volume labels were lower-case internal keys ("master volume"); they now match the desktop labels.

## 3. User experience

- First-play "How to play" hints were four-sentence paragraphs covering 35–65% of the board on phones and landscape. They now use one-sentence `hint` text (full text remains in Help).

## Still open (not changed here)

- Canvas menu and sheet actions are not keyboard-operable (needs its own spec; see the 2026-10-14 audit).
- Roomy portrait phones still refit the layout for boss waves.
- Portrait phones show ~140 px of empty band above the board; a larger default zoom or relocating hints there is a follow-up.
- Sentinel/Cinder now ship their own sheets (`tower_sentinel_stages-v1.webp`, `tower_cinder_stages-v1.webp`), so the double decode is gone. Superseded by the 2026-10-15 Sentinel and Cinder artwork release.
- `npm ci` failed on main because `package-lock.json` lacked the `sharp` override entries; `npm install` regenerated them (included in this change).
