# W7-V1 Independent Raw Art and Provenance Review

**Task ID:** W7-V1
**Decision:** **PASS - 11/11 candidates pass the independent raw-art/provenance gate.** Runtime pathing/build-plot integration remains a separate gate; see map caveat.

## Scope and methods

Reviewed the World 7 package self-check and per-atlas self-checks, candidate/source provenance, manifests, all World 7 authored briefs and final prompts, raw PNG sources, candidates, white/dark matte contacts, and four diagnostic route-clearance overlays.

Independently recomputed candidate SHA-256, PNG dimensions/modes, alpha extrema/bounds, per-cell occupied/empty counts, and exact per-cell duplicate hashes using Python/Pillow through an RTK-prefixed command. Read package JSON and prompt files with `rtk json` and `rtk read`; enumerated package inputs with `rtk rg --files`. Reviewed contact PNGs statically; no GIF playback or workaround was used.

All 11 current candidate hashes equal their candidate-provenance records and are pinned below. All stored raw-source PNG hashes equal their source-provenance records. Across all **23** reference sidecars, the actual prompt file hash matches the sidecar prompt hash and every sidecar has a `createdBeforeGenerationUtc`; all **63** referenced artifact hashes match their referenced files. Maps A-D additionally have explicit output-observed timestamps (09:20:02, 09:22:28, 09:25:40, 09:28:18 UTC), each after its 09:18 pre-call sidecar. For records without an observed-output field, the source output ID is present and the raw-source PNG file timestamp follows its source-specific sidecar; candidate assembly follows those source outputs. No consolidated document mtime was used as chronology evidence.

## Candidate decisions

| Candidate | Result | Independently recomputed SHA-256 |
|---|---|---|
| `sky-isles-world-panel.png` | PASS | `dc83257253d0f9906f916153aa236ee5b693cb988e2b760503df7de5d83b9494` |
| `sky-isles-map-a.png` | PASS | `98f5adff17d7b9b8e469238b12ef09bc39ab95ec3c8eb9b7fcad1c665e023a26` |
| `sky-isles-map-b.png` | PASS | `79c4bb5d3831c648b35c192f0c35aeeec1fa14db73830c75f915cce3eef9a660` |
| `sky-isles-map-c.png` | PASS | `e8967fcf6b32700efcf0105183313fc3fd6015bb43eaed681147d06d3b556fb0` |
| `sky-isles-map-d.png` | PASS | `b1e1caddce8899a663f8bb6312584fc102e6bba3df111c91c24ed0643d02818c` |
| `sky-isles-aether-drake-atlas.png` | PASS | `6127080ff7abdbe60dbf514836e59ac1fce1a398fe7c74b5e958701b89dc8d3a` |
| `sky-isles-cloud-skitter-atlas.png` | PASS | `f2581cf68be8769764dc2b347be104a0f9b8fbb5b4ea88bbfb345920f879de96` |
| `sky-isles-galeclaw-atlas.png` | PASS | `b2b8cde192c826776fabb8356490928c4c80611d0b203f6d70da8d27f0cfb2ec` |
| `sky-isles-stormguard-atlas.png` | PASS | `ee13c36d209f3a750bce70b5fe16b408b225434ebe5007556944eca4fa37c5f3` |
| `sky-isles-stormmaw-prime-boss-atlas.png` | PASS | `43eb4be1cda70caa1aa89830ecce8964952370312ffeb08110845864e6cb165b` |
| `sky-isles-tempest-herald-atlas.png` | PASS | `8aac34b5a6783fc943b1333c8e035c19689840f26d03d2ada6a20bef86e20d49` |

Candidates and records are under `artifacts/campaign-final-art-20261012/world7/`; candidate records are in `provenance/*-candidate.json`, source records in `provenance/*-source.json` (Cloud Skitter also has `provenance/cloud-skitter-identity.json` and `provenance/cloud-skitter-idle-rejected.json`). Machine frame/bounds records are in `selfchecks/*-selfcheck.json`.

## Visual and frame findings

- Panel is opaque 768x432 RGB, shows the centered broken observatory and floating-island identity, with quieter center space for campaign overlays. No embedded UI/text.
- Maps are opaque 1672x940 RGB. Their final PNGs contain no route strokes, markers, UI or text. Family layouts are distinct in route geometry and open-space/landmark composition; D is the broad boss-view arena. Map A's source is copied byte-for-byte; B/C crop one excess bottom row and D one excess right edge column, with no stretch. The panel source has a one-pixel bottom crop and uniform Lanczos fit to 768x432.
- All five ordinary/support atlases have true RGBA alpha (0..255), expected 128px cells, 22 occupied cells (4 idle + 6 walk + 6 attack + 6 death; Tempest Herald has 28 occupied cells with its 6-frame buff row), and exactly the two empty idle cells in columns 5-6. Stormmaw Prime has 46 occupied 256px cells (6 idle + 8 each walk/attack/special/phase-two/death) and exactly two empty idle cells. Independent cell-byte hashing found **zero exact duplicate occupied frames** in all six atlases.
- White and black views show clean transparency, no outer-cell clipping, and no foreign-neighbor fragments. Used frame bounds stay inside their cells: standard atlas content is width-normalized to about 100/128 (78%) with margins; Stormguard's upright armor retains its natural body proportion. Full-body proportions are consistent across rows; vertical changes in crouched/flying poses are anatomical pose changes, not camera or scale drift.
- Walk rows show genuine limb/body gait cycles; attack rows have distinct readable strikes (Aether Drake impact, Cloud Skitter gust/swipe, Galeclaw lunge, Stormguard ground strike, Tempest Herald staff gust). Tempest's buff row uses a localized wind/aura around its staff and body. Death rows collapse to fully grounded still poses without a body rising/reviving. Cloud Skitter's death frame 2 has a two-pixel higher *tail* alpha extremum, while the head/torso visibly drop; later poses continue down to the final prone state.
- Stormmaw Prime's 8x6 atlas matches the authored order and identity. The 200px-wide content in 256px cells is about 78%; its squat quadruped's height is lower by natural proportion (largest observed cell height about 73%). Per-action source boards retain detailed scales at native source size; the recorded minimum longest source dimension is 406px before uniform fitting to 200px, so this is not an upscaled or undersized-body failure. The special row clearly telegraphs forked-horn lightning then a short contained surge, phase two reads as a stronger wing/core state, and death is monotonic through the final flat pose.
- Cloud Skitter uses the accepted idle-attempt2, walk, attack and death boards plus its identity guide. The rejected repetitive idle board and initial full-atlas generation are not consumed by the final candidate. Accepted idle poses are visibly varied; the low idle height is its broad crouched anatomy (100px width, 36px first-frame height), not excessive packing whitespace.

## Lineage pins

The following are the generated output IDs and SHA-256 hashes of their exact pre-call reference sidecars. Source PNG SHA-256 values, dimensions, prompt hashes and raw paths are in the corresponding source-provenance records linked above.

| Asset | Generation output ID(s) | Reference-sidecar SHA-256 |
|---|---|---|
| Panel | `exec-c325db88-dfaa-4a1f-bb07-212c8e7a6098` | `afe3f2f6fe174a7408852dd2f6ddfcf2dffdfd5ace99947644cdb92ffb75777a` |
| Map A | `exec-faf876fa-1b7e-4922-b399-5040bf4b9de5` | `f914935f4d219dbb44f7207a27bf94814ecf285b7a83cebc1212fdc2b03e0fbb` |
| Map B | `exec-e6f4afab-55d2-413a-8008-5eefb40a1a6d` | `d76eda6dc8721f23657aa02542fd662d13e2bfaccd5adf97cfaffdc803cccaea` |
| Map C | `exec-d28b57f7-3c79-4afc-84e9-cb32547880ff` | `6b791ab5719a2e6b0c34d10efb8edc69017134897accb0aa1302f213d83e6dc7` |
| Map D | `exec-3d99b668-578c-4b28-8ee7-5f21616c8ad0` | `f2b8efca24a9f0c4b3aadd0825df945267c024726c09630ef94f74eabbd61d87` |
| Aether Drake | `exec-edcf54c3-2625-428e-a21d-3910977fd08d` | `d9313eafff272bbd858a06240e4e0df7e84d914ea8b8a25cce9c7213bd35a64c` |
| Galeclaw | `exec-bd59e9b3-ba66-4281-9408-80cca005251b` | `94fb4e8684fa79fff414e30083753587616283b32ed7f051185588e76fd58118` |
| Stormguard | `exec-7681c282-33da-44bd-ba81-5bd4358f9d58` | `dc4448fd4d05726332e4e6865a128f755c9b3c8391f4d81718310528f78474ff` |
| Tempest Herald | `exec-1cc16ed8-d243-4e18-a322-225032425fc3` | `9ec4e463727546502814d38d4f64929681540406fc4a78aab598000d6ac9af40` |
| Cloud Skitter (identity; used idle2, walk, attack, death) | `exec-04604547-5afc-4344-b2aa-822fcf6a63f1`; `exec-6ee0f712-2db4-4f60-836e-85bf3f076a9f`; `exec-58da1d12-4fd1-4388-bb04-c8314e597a20`; `exec-ee70e53a-849c-403d-b74f-acb1c285f210`; `exec-12f1446f-6c24-45a8-aed4-e96c57fde87d` | `516889525f78b38b1f54866472626e45395bc7d1946a79eddceb04b98b35ebc6`; `28d9f3f5ba3842ae95758f24db26998636913d4694d1fa28c3352bcf2dd5d8b1`; `69f099c1e207ded48d50df7e1bb52dc14ca1a9ee3c34fccffca6fcdee67816b2`; `ca4b92018290c63e0f9f856b385bf96a478ab88a4c76b7349de1d0041cfb453d`; `55a21df7dcb82d7ca943a482671818284a430b479b2f6ad4c64e96150a4df720` |
| Stormmaw Prime (identity; idle, walk, attack, special, phase-two, death) | `exec-369ebf45-9751-4b46-b8f3-743dca91a605`; `exec-31328a49-df44-459d-8688-b79bf88ee80d`; `exec-c44c256d-86fd-4fd2-9ea6-91e0689e2a80`; `exec-97f2e07d-f0fb-4ec4-abf3-5957723e273b`; `exec-c16c811d-af15-4e0d-9114-e278376f1c31`; `exec-c46a473e-517d-4a5e-a182-408d0b247263`; `exec-bf5cea28-7e82-49b4-8a3e-e0dadfc0fc28` | `d84657af2c02d296231aaf72c98ac90c6170783af0b62286533807173cc53c9a`; `f7503ad76f892fcb7c9758232ea095c788ad81646ccab6a2451250fef1b964c5`; `11fa7b33841f579f0abe99004d783bb4060422f36e8712c874f7a9b293e30f1c`; `751d4b8c240ab41a6c0c7ab09ed53dcd141bb5d79d08783cca318bddc4271fb5`; `efd82f5c6e64e99a30282e04b012635fd98e59c4c20ed37cc3b445c9e10953b7`; `b10530bdb42a5f9314b2b45dd68d45a3f40ee381c9dfc1463a3d521872c40760`; `0fbd210c036153f60619f2642f7d3155022e9677a1e2fe12672e63d6a63d5208` |

Cloud Skitter's initial atlas output `exec-9d558b27-0b2f-460c-9009-69175849211c` (sidecar SHA `f4371e1d4df5ba9d0d1491fd671ed7ecbf409600e5d805097a909565bd39a51a`) and rejected idle output `exec-0942174b-e24d-4857-af8d-e7da32d5b7b2` (sidecar SHA `2e6d0663be667afed2f7cc2a5dd82bfd59d76d26c25677b615eaef16ff262d0c`) are retained as evidence but are not consumed by the accepted atlas.

## Map-clearance caveat and residual risk

I viewed the actual A-D candidates with their diagnostic overlays. A-C have a few decorative rock/grass edges approaching the 46-unit clearance band, but I found no substantial prop crossing the red route centerline or filling the open running lane; D is visibly clear. I therefore pass the raw background-art gate for all four maps. This is not GameScene/path/build-plot certification: runtime validation must still check the exact road envelope and live build locations, especially around A-C.

No source, candidate, public asset, manifest, test, Git state, or deployment file was changed. The only new artifact is this report.
