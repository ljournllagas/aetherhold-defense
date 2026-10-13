# W8-V1 Independent World 8 Raw Art and Provenance Review

**Task ID:** W8-V1
**Decision:** **FAIL overall: 10 candidates pass; Umbral Regent boss atlas fails the idle-row action brief.** The other ten candidates pass this raw-art gate. No public/app artifact was changed.

## Scope and method

Reviewed `world8/SELF_CHECK.md`, the full World 8 self-check manifest, the World 8 authored art direction and per-asset briefs, final prompts, candidate/source provenance, self-checks, raw PNG sources, candidates, white/black matte contacts, the key-art contacts, and map route-clearance overlays. I visually inspected all 11 candidates and the relevant generated PNG source boards, including all six Umbral Regent action boards. No GIF playback or workaround was used.

Ran `rtk python artifacts/campaign-final-art-20261012/verification/world8-raw/audit_world8.py`. The independent Pillow/hash audit recomputed all 11 candidate SHA-256 values, dimensions/modes, cell alpha bounds, occupied and empty cells, duplicate-frame hashes, and per-frame bounding boxes. It checked 18 selected source records against their raw PNG hashes, output IDs, exact prompt hashes, pre-call reference sidecars and referenced-file hashes. It also checked all 32 retained generation attempts. The detailed machine evidence is in [`audit.json`](audit.json); the audit script is [`audit_world8.py`](audit_world8.py).

The manifest's SHA-256 is `a7e446082ad0c0d08d7d6431db252194a4d236031d70c113430735b2cf0c35fa`, matching the requested pin. Review completed 2026-10-13 14:12 UTC; the manifest states 2026-10-13 13:13:41 UTC. The report uses no consolidated document mtime as generation evidence.

## Candidate decisions and pins

| Candidate | Result | SHA-256 |
|---|---|---|
| World panel | PASS | `5265dc72db5643fcc1aeb053de8c0f106257aa7aa383d2bb1f9e412631ff8f57` |
| Map A | PASS | `1e9948f299017acf0a1831d911496f859666205d9245d8797a3422feb59dc9a8` |
| Map B | PASS | `b48f3e80abb216782fbc24fc28ce215f126947a7878eeaf3758dec148c07d5e1` |
| Map C | PASS, reference-path caveat | `b052f72f6a0e9ef861728d52b0fc39c7e6ef995b618c8378a50519fb5af11095` |
| Map D | PASS | `75e57c7913b871523513130b1cbb5d1575e613e6e0a901b38600ff8b02d1a100` |
| Shadeborn atlas | PASS | `afe8203fd49130e5fc44da7205e941b66f8f552a5ff4753c389e03b048d7ff56` |
| Dusk Runner atlas | PASS | `7b0cc66af71cc0f62e1fe0e02dbfc93f3f55b34aa096a990c1821e13791e4a33` |
| Moonstalker atlas | PASS | `d3584094b09d7700617fecc591f9b07435ed727b56567290d38a8517ef1776ff` |
| Grave Hulk atlas | PASS | `4cf391664b3403e12fc10c8d70dae25e5346232f9e5f39637baa092092e11294` |
| Echo Shade atlas | PASS | `d51cb8c255ef3abab0ae3d52d2fe281b66408b4d4c96d5a5c3d3e28da16e1b97` |
| Umbral Regent boss atlas | **FAIL - idle row** | `48d1313ef42e1d11c877ab3fe1f8dd3deae3be5eb5ec9338e8ca290eadbc6f82` |

For every row above, the candidate file hash matches both its manifest entry and candidate-provenance record; all atlas candidates also match their per-atlas self-check hash. Complete dimensions, modes, source hashes, source provenance hashes, output IDs, prompt hashes and reference-sidecar hashes are in `audit.json`.

## Visual/frame findings

- Panel is an opaque 768x432 RGB scene with Dreadmoon identity and open lower/central staging space. Maps A-D are opaque 1672x940 RGB, have no baked road/UI/text, and keep quiet route centers. Their compositions and route geometries are distinguishable; D leaves a broad arena.
- The four ordinary atlases contain 22 occupied 128px cells each; Echo Shade has 28 occupied cells; the 2048x1536 Umbral Regent atlas has 46 occupied 256px cells. Empty idle cells are correct, all occupied frames have distinct pixel hashes, all six atlas candidates have true RGBA alpha (0..255), and transparent corners are empty. Every occupied cell stays inside its boundary; minimum computed edge margin is 13px on ordinary sheets and 26px on the boss sheet. Maximum body/effect extent reaches 0.7812 of its cell. The smaller frames are expected crouch/death poses, not globally undersized packing. Feet/projected anchors remain stable at about 0.8984 cell height.
- White/black contacts show clean subject edges, no neighboring-frame strips and no clipped bodies. Shadeborn sword strikes, Dusk Runner and Moonstalker low quadruped gaits, Grave Hulk's heavy steps/slams, and Echo Shade's staff casts and six-frame summoned decoys read as distinct sequences. Death rows progressively settle without revival. Boss walk, attack, special, phase-two and death boards preserve one identity and camera, with readable hand/energy poses and a descending, settled death. The action-source poses retain detail at their native dimensions before fitting.
- **Umbral Regent idle failure:** each of the six idle source poses and the assembled idle row shows the crowned Regent plus two recognizable hooded/cloaked shadow figures on either side. They are low-opacity violet and connected to the Regent's flowing haze; key art and the authored character identity identify them as the Regent's own detachable echo-shadows. They are **not foreign units**. However, the final idle prompt explicitly requires “the Regent alone” and forbids unrequested characters. These repeated secondary figures are distinct enough to read as companions rather than just a cloak trail, so I cannot pass this row against its action-specific prompt. Focused repair: regenerate/replace only the six idle poses as the single Regent; retain echo-shadows in the action rows that call for them. No crop/mask shortcut is recommended because it would damage the connected haze and cloak.

## Provenance pins

Each listed source has a matching raw PNG SHA, source-provenance output ID, actual prompt SHA, and sidecar whose `createdBeforeGenerationUtc` equals the recorded pre-call time. All accepted prompt hashes match the exact prompt files. Sidecar SHA-256 values below pin the exact pre-call reference metadata; full raw-source SHA-256 values and reference-file hash results are in `audit.json`.

| Candidate/source | Generation output ID | Reference-sidecar SHA-256 |
|---|---|---|
| Panel | `exec-8c9078d5-6d1e-4970-aa02-72d7b4ebbd3d` | `57cb704c99fcba96385fc0c1b251b1d000949e97d9312ccd2708063f3042bee1` |
| Map A | `exec-81f11fa0-16c6-4eed-9040-36f52c48c9a9` | `db38b61c9cc38dc98d02351ed5aefcd40e50245a3d699d245cff3dee2d1e5ad5` |
| Map B | `exec-14f1daf9-e5be-4dc2-b8df-381eb61c58f0` | `0d4f6c59da51502171f682c9b4b31907bdaffcf85e6f13ff1f4acc5c7338c59c` |
| Map C (attempt 3) | `exec-953db11c-7197-405d-af87-4c09913de6df` | `df6e67e6204b12a73b3b123bc95cf7a8821ca8a7327049bb9059ffe4a5bc699c` |
| Map D | `exec-818da427-fd41-440e-bd30-b19b9257739c` | `8217b88045c05e9b7b220307a734af53c111f23599320346e4c3573f3db5a500` |
| Shadeborn identity atlas | `exec-a9d2119e-7cc1-4bbd-a6eb-e7e4c048a232` | `7303e2f98589506e3c9d634aa3b39359d72e25af6907d5d09fddb6dbbf1c37ed` |
| Shadeborn attack | `exec-9d939b83-0365-403b-8e4f-d6ec66a5c186` | `12f6f6d5d42e5a1836bc5ff81ecc4ff7543111917eb476daf2a45834a32e60c2` |
| Dusk Runner | `exec-f1d1c0a9-5bb4-4736-8618-f27b0b0a43ba` | `9140ef031b8dd24c9a82a3699607565a662bb0b145ffb6500e8e9111ca06ab73` |
| Moonstalker | `exec-a9879f4a-663a-49ef-b73e-def68d8e272b` | `ffb306cd5b69b0a9e62720dedbc7af6854c157cb5014ee8c08e7ee9c0c083b1d` |
| Grave Hulk | `exec-c687d311-129d-4768-b1f4-f24f1243eb18` | `2df558ea945598414e327fe8348d72a97b1ff6b7af20b9b974e66ca763f22043` |
| Echo Shade identity atlas | `exec-56633a5d-2f4a-45f8-a5f4-62385e3bae1d` | `c86392ba42fd5e98d725ef306918b73f0510dc8b6b18012ef1be3501319d74a3` |
| Echo Shade attack (attempt 4) | `exec-13209dda-74f3-41f8-9c62-2bb1cbfa58e2` | `bf2d009db076e8b65119316899f540ec5c0c0bac7635d24a9909a80415a7f7e9` |
| Regent attack | `exec-5f971d5e-0cbc-4dcd-998b-ab46f4fb32c8` | `6618cd4efdbc06f31e42b01368ddc607c77ca46889176074f67dd3f78a428888` |
| Regent death | `exec-2c243ad0-bfce-448e-9e11-05b58b3dc6c4` | `6802e56200a6e6640376c09bcd2e93690891be322b214a428147ec2189812575` |
| Regent idle | `exec-2d9c5ec9-ea14-4b3b-bf05-4bbb2c37f704` | `b550c6ae002f904a2e3d3c5b99ea3a6810c73bd0402b9abb78e79d6a5a4c9a60` |
| Regent phase two | `exec-709372ac-80c6-4672-9f16-0d3b1307bd86` | `9d21c9d61ee4e33eabb6105defe8f24313845e9b94d1f2c93f79b769f3d89ae1` |
| Regent special (attempt 2) | `exec-9e3e34c8-0703-463f-a0e5-446d030eb4dd` | `5bfca3ff2d8d381bb7828178c5860724ac01b56d376fea8b6349b8a120362c9f` |
| Regent walk | `exec-97fcd5fb-7027-4957-b153-34bd8d89ac2a` | `9b50ab1f7dbf7c5e491459daa39b2312646b12a3bd209051f285caf3b92c1734` |

Three **rejected** history sidecars have a declared base-prompt path while their prompt hash matches the attempt-specific prompt: Map A attempt 1 (`d269ed82e62aac18d50b06d44613e51579fd438b778f385482419bdcee568411`), Map A attempt 2 (`56151520f56f2f363f712936e6a65d59f31efbccb77d1cedc90bfb7db93152b9`), and Map C attempt 1 (`29103cd8cced8b116e881413aa1858faf2a04f3861bb6f13a382bb9f76e328e2`). Their raw hashes, output IDs, prompt hashes, pre-call chronology and reference hashes all check out; they are not consumed by the selected candidates. No sidecar was changed or backdated.

**Map C selected-lineage caveat:** its attempt-3 sidecar records reference path `candidates/dreadmoon-map-c.png` at SHA-256 `a33a8124455f36c7022fd5c301c5fbed04c99ca9aa27be74b7a6d42a70a411ea`. That path now contains the final candidate (`b052f72f...`), but the exact prior referenced bytes remain preserved at `raw/maps/map-c-attempt2-candidate.png` with the sidecar's expected hash. Thus the generation input is hash-verifiable, but the sidecar's original path is stale; preserve this caveat if moving/reusing package inputs.

## Map clearance and remaining scope

The diagnostic overlays show decor near the outer 46-world-unit clearance band on A-C: branches and rubble approach/intersect parts of that outer band. I found no large prop filling or crossing the open route center. D is clear. This passes the raw background-art gate; runtime road/build-plot collision still needs its own check, especially on A-C. This review does not establish GameScene behavior, movement replay, pause/restart, deployment, or public integration.

Only this assigned `verification/world8-raw/` folder was written. No source/candidate/public asset, app, Git state, or deployment was changed.
