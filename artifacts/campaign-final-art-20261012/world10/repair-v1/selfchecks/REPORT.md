# World10 Repair V1 Self-check

Task W10-P1 focusedrepair. The four repair candidates are complete as provenance-bearing outputs, but every candidate fails visual route/plot clearance. No candidate is accepted, and independent review remains required.

Geometry validation independently reproduced all active route variants and runtime plot centers, then matched them to the W10-V1 audit. The authored gates are 46 world-unit road art clearance and 84x84 world-unit plot/tower clearance. All map files are opaque RGB at 1672x940. Exact-source, one-row trim, or uniform no-upscale operations are recorded per provenance.

| Family | Variants / plot centers | Candidate SHA-256 | Generation output | Geometry | Visual clearance |
|---|---:|---|---|---|---|
| map-a | 3 / 45 | `575270d9681f085f09278d599a7277b2152c034f067d56b409dbaa1b7fbdf3a3` | `exec-d687fc76-d7a8-47cd-88a6-15b5043b9b60` | PASS | FAIL |
| map-b | 3 / 42 | `36819b766e7a89d4e20243ac9b9e55ab8159db7ac6e2aca252e01c864744fb73` | `exec-1cf080e6-8542-4953-b9cc-547e7d86581e` | PASS | FAIL |
| map-c | 3 / 40 | `b08d460c81c373a9bc5332c52553b864bae4e053059c8760ce836a781845d9ba` | `exec-68e1e47b-8e3c-4178-a92b-a857bf5168a6` | PASS | FAIL |
| map-d | 1 / 15 | `4f4ee3acc6d9369df61a1f71da2a66be3a3a20b2f586c35c4b69070e53cc7615` | `exec-543dc9dd-60c8-4251-9660-97a7b6c22287` | PASS | FAIL |

## Visual findings

- **map-a** — FAIL: all-variant preview shows upper-left, upper-middle, left-middle and lower-edge reserved squares intersecting arches, columns, crystals, dense rubble, or medallion paving. See [map-a-repair-v1-all-variants-review.png](../previews/map-a-repair-v1-all-variants-review.png). Lineage: attempt 1 `exec-1f4fafa7-0706-4dd4-8cc8-9475886d6099` raw `b388cc66e24fb4b43c3ae5b679f185d2b43df2df6eab57ae08883a2e99b66327`; attempt 2 `exec-c904eab5-f472-407a-b79e-50370be7f2a0` raw `dd0e98f92333786d23b41e7e78ba02e40941328a518b580f8cd2bd9444ee7624`; attempt 3 `exec-c4271b18-9288-46b9-a39e-bfc03ab2bc67` raw `5894eae8749b7763b286690a030375a30de573e4e2da4e5bb4d3fc2976c5c21a`; attempt 4 `exec-f4b350e5-60e6-47d8-a43f-9618aa91dcfc` raw `6f7abc81c285f1321d4a2afc53b8ac55f21840afc167252478a9d73fe0e93ffe`; attempt 5 `exec-63203c28-6941-41bb-9739-217047f7f73d` raw `7d509b27f9da95800f1158cb1e65d64c8cce3081ece9a26c56a7eab922faed63`; attempt 6 `exec-ba71ca8d-5b45-4300-905d-32b5d8077db0` raw `933b21c21f9d43888e1b6326b7cda54547277d9c022dccda320ae58b7789fb56`; attempt 7 `exec-d687fc76-d7a8-47cd-88a6-15b5043b9b60` raw `fe4ddc8a76b7bf270c6e1c887b45f7a8a4db860d77ad459747386589d19616b6`.
- **map-b** — FAIL: all-variant preview shows upper-row route/plot geometry through pillars, arches and walls; several lower and center plot squares contain raised masonry, crystals, or medallion paving. See [map-b-repair-v1-all-variants-review.png](../previews/map-b-repair-v1-all-variants-review.png). Lineage: attempt 1 `exec-db6b4bf3-2a8c-4e52-bc4f-d442ec0a30dc` raw `330ff5996a2c9d9b9150e66348cebb7dc6aacde13d92c3eaa1d63e370007d231`; attempt 2 `exec-1cf080e6-8542-4953-b9cc-547e7d86581e` raw `36819b766e7a89d4e20243ac9b9e55ab8159db7ac6e2aca252e01c864744fb73`.
- **map-c** — FAIL: all-variant preview shows top-row route/plot geometry through wall/column structures; left and lower edge plot squares overlap arches, crystal clusters, rubble, or raised paving. See [map-c-repair-v1-all-variants-review.png](../previews/map-c-repair-v1-all-variants-review.png). Lineage: attempt 1 `exec-caca24ee-0a67-4086-93cb-618563befd2f` raw `e3d9f81ccf1221dccb0a0fd3fef687b3d7706b46941b814051db35fc80958185`; attempt 2 `exec-68e1e47b-8e3c-4178-a92b-a857bf5168a6` raw `b08d460c81c373a9bc5332c52553b864bae4e053059c8760ce836a781845d9ba`.
- **map-d** — FAIL: the boss-map upper-row plot squares intersect perimeter walls, columns and rubble; several central/lower plot squares contain large decorative medallion paving. See [map-d-repair-v1-all-variants-review.png](../previews/map-d-repair-v1-all-variants-review.png). Lineage: attempt 1 `exec-0eee9431-7c35-4d74-974a-85fe30b44553` raw `4a9e445ef710862868df3ba924e79b14f1c4ce626b80f259dfdb8d05a967d6cd`; attempt 2 `exec-543dc9dd-60c8-4251-9660-97a7b6c22287` raw `4f4ee3acc6d9369df61a1f71da2a66be3a3a20b2f586c35c4b69070e53cc7615`.

## Lineage and exact references

Latest candidate prompt, pre-call reference sidecar, raw generated source, generation output ID, raw/candidate SHA-256 values, and mechanical dimension preparation are recorded in each per-map provenance JSON. All attempts, including rejected generations, remain under `raw/`, `prompts/`, and `provenance/`; earlier World10 V1 candidates and reports were not modified.

All-variant route/plot geometry and source contract hashes are retained in [geometry.json](../geometry.json). Visual review overlays are previews only and are never candidate art.

**Decision needed:** built-in image generation repeatedly reintroduced structures/decorative paving inside exact reserved masks. Because procedural paint-over is prohibited, the remaining clearance defects cannot be repaired within this production method. Keep these as failed repair candidates pending independent review and a main-owned decision on further production or route/plot geometry changes.
