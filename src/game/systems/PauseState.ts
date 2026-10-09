export type PauseReason = 'user' | 'modal' | 'background';
export class PauseState {
  private reasons = new Set<PauseReason>();
  set(reason: PauseReason, enabled: boolean): void { if (enabled) this.reasons.add(reason); else this.reasons.delete(reason); }
  has(reason: PauseReason): boolean { return this.reasons.has(reason); }
  get blocked(): boolean { return this.reasons.size > 0; }
}
