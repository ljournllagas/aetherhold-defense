# Task ID W8-V2: Umbral Regent idle repair raw recheck

**Decision: PASS for the idle-row raw gate.** The repaired atlas has six visually distinct, complete solo-Regent poses in idle cells 1–6, cells 7–8 empty, and all action rows 1–5 byte-identical to the pinned accepted source atlas. This passes only the focused raw repair gate; the full World8 staging review remains separate.

## Pinned bytes and provenance

The reviewed repair candidate is `world8/repair-v1/candidates/dreadmoon-umbral-regent-boss-atlas.png`, SHA-256 `84be00d661c6257be484845715d45308b61fb1028fa5e937db2b4b8aec79fba4` (2048×1536 RGBA). Its pinned base is `world8/candidates/dreadmoon-umbral-regent-boss-atlas.png`, SHA-256 `48d1313ef42e1d11c877ab3fe1f8dd3deae3be5eb5ec9338e8ca290eadbc6f82`.

I independently recomputed the candidate, base, raw generation output, prompt, and pre-call reference-sidecar hashes. The attempt-2 raw source is `9c67d0b202e2d28837fcaaaf6f5627ac7c26ed10a116d9573c7c455428d340dd`; the original generated-image path recorded in provenance exists and has the same hash. The sidecar's pre-call timestamp is 2026-10-13 14:29:38 UTC, output ID `exec-1f4e7cae-222a-4a0b-86e8-dc2ac21bdfd5`, prompt SHA `af61a97e046c5c94cbf9029ef98eca305dfff5d58f1918b10ef7c5d81e088321`, and sidecar SHA `f693104ffda4934b48f4787c1e0f9d5fd85c7d5517da5acf88c39cd6814b35d7`. All four declared reference-file hashes match their current bytes. Candidate provenance claims match these observed bytes and identify whole-pose connected-component extraction, a 4-pixel alpha halo, uniform fit/anchor placement, and idle-only composition.

## Independent pixel and visual checks

The independent audit found six main raw-source components at alpha threshold 32 and area ≥2400. Each of the first six output cells has one dominant connected silhouette at alpha threshold 8; two one-pixel antialias specks in separate cells are not separate figures. All six extracted frame hashes are distinct. Output alpha bounds are consistent at y=30..230 (200 px high); widths range 174–200 px. Idle columns 7 and 8 have no nontransparent pixels.

Rows 1–5 (walk, attack, special, phase two, death) compare byte-for-byte equal as full RGBA row crops to the pinned base; every row comparison passes. I visually inspected independently composited black-matte views of the source board and repaired six-cell row. The six repaired cells show one complete crowned, masked Regent each, with intact cloak hems, stable facing/scale, subtle hand and cloak variations, no echo/companion figures, no clipped body parts, and no foreign strip fragments. The raw source board itself does not honor the requested transparent source-cell gutters: its silhouettes touch or cross cell boundaries. The extraction therefore relies on the six separated whole-body components; this limitation is retained rather than representing the generation board as cleanly gridded.

The lineage addendum is preserved as a separate clarification. It confirms the selected Map C attempt-3 sidecar records SHA `a33a8124455f36c7022fd5c301c5fbed04c99ca9aa27be74b7a6d42a70a411ea` at a stale candidate path; those exact bytes remain at `raw/maps/map-c-attempt2-candidate.png` and hash correctly. The old path now contains the selected Map C candidate (`b052f72f6a0e9ef861728d52b0fc39c7e6ef995b618c8378a50519fb5af11095`). The addendum also identifies rejected A/C prompt-path history as rejected attempts, not selected source records. These disclosures do not invalidate the selected Regent repair's own matching prompt, raw, and reference chain.

## Evidence

- Independent audit script: `verification/world8-raw/recheck_regent_idle.py`
- Machine-readable results: `verification/world8-raw/regent-idle-recheck/independent-raw-audit.json`
- Visually inspected six-cell view: `verification/world8-raw/regent-idle-recheck/regent-idle-six-cells-black.png` (white-matte counterpart also saved)
- Visually inspected generated source board: `verification/world8-raw/regent-idle-recheck/regent-idle-source-board-black.png` (white-matte counterpart also saved)
- Prior accepted/rejected context: `verification/world8-raw/REPORT.md`
- Lineage clarification: `world8/repair-v1/provenance/world8-lineage-clarification-20261013.json`

Method: `rtk run "python artifacts/campaign-final-art-20261012/verification/world8-raw/recheck_regent_idle.py"`; image evidence was manually inspected from the saved PNGs. No production, public asset, or Git state was changed.
