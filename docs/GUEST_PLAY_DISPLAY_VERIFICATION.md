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
Tasks 3–8: pending.
