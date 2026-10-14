# Guest play and display execution ledger

Plan: docs/superpowers/plans/2026-10-14-guest-play-display.md
Spec: docs/superpowers/specs/2026-10-14-guest-play-display-design.md
Base: 18adad6e707d8dac6c0d6b54886826586122fd8f
Execution: inline. Independent review: Luna MAX.

Ruling: use the current feature branch/checkout named in the approved plan, preserving unrelated untracked work. Use this durable ledger instead of Bash-only skill scripts on Windows.
Pre-flight: Task 2 GuestStorage -> Task 3 AccountSystem -> Task 4 screens agree on snapshots/claims and captured RunOwner; Task 1 formatters -> Task 5 tray; Task 6 projection -> Task 7 visual measurements. No contract conflict found.

Task 1: complete — missing formatter RED, then 133 formatting/presentation tests GREEN; TypeScript/Vite build passed. Quantity surfaces include HUD, costs, Campaign targets/results, tower comparisons, leaderboard/personal bests. Existing clock/level/version identifiers retained.
Task 2: complete — missing guest modules RED; 11 projection/real IndexedDB storage tests GREEN, including frozen claims, concurrent ownership, migration, duplicate runs, abandonment, unavailable storage, and protected incompatible bytes.
Ruling: the prerequisite file named by the plan is actually src/game/ui/prerequisites.ts; updated the real consumer. GuestRunProgress includes an optional runId so Campaign settlements without a public result can also be deduplicated.
Task 3: complete — five missing guest APIs RED, then 56 formatting/settings/guest-lifecycle/storage tests GREEN; account HTTP integration (25 tests) passed. Added failed logout suppression, capture ownership, preflight warning, uncertain deletion, failed imports, and confirmed deletion abandonment.
Ruling: unavailable legacy claim storage permits session-only play but suspends import, preventing unknown ownership from being reseeded into another account. Nullable upgrade costs render the existing nonfinite placeholder rather than weakening their types.
Task 4: complete — guest UI status/settlement assertions RED then 32 scene/status/result tests GREEN; TypeScript/Vite build passed. Guest result mode follows captured identity and has no anonymous Submit path. New guest names, edits, warning/confirmation, and both mode settlements are integrated.
Task 5: in progress.
Ruling: compact Campaign keeps its five header actions in one row with explicit Account/Back bounds. The proposed second row reduced required detail space below 156px at 640x360 and 844x390; preserve the existing tested detail/map minima instead of weakening those assertions.
Tasks 6–8: pending.
