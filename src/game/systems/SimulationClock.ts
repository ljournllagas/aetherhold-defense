export const SIMULATION_STEP_MS = 1000 / 60;
export const MAX_SIMULATION_STEPS = 60;

/** Retains playable game time when one rendered frame exceeds the tick budget. */
export class SimulationClock {
  private debt = 0;
  get pendingMs(): number { return this.debt; }
  reset(): void { this.debt = 0; }
  advance(gameDeltaMs: number, step: (stepMs: number) => boolean): number {
    if (Number.isFinite(gameDeltaMs) && gameDeltaMs > 0) this.debt += gameDeltaMs;
    let consumed = 0;
    while (this.debt + 1e-7 >= SIMULATION_STEP_MS && consumed < MAX_SIMULATION_STEPS) {
      this.debt = Math.max(0, this.debt - SIMULATION_STEP_MS);
      consumed++;
      if (!step(SIMULATION_STEP_MS)) break;
    }
    return consumed;
  }
}
