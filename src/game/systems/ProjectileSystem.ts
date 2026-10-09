export interface TimedProjectile {
  elapsedMs: number;
  durationMs: number;
}

/** Advance by game time, clamp to arrival, and report when impact is due. */
export function stepProjectile(projectile: TimedProjectile, gameDeltaMs: number): boolean {
  if (projectile.durationMs <= 0) {
    projectile.elapsedMs = Math.max(0, projectile.durationMs);
    return true;
  }
  const delta = Number.isFinite(gameDeltaMs) ? Math.max(0, gameDeltaMs) : 0;
  projectile.elapsedMs = Math.min(projectile.durationMs, Math.max(0, projectile.elapsedMs) + delta);
  return projectile.elapsedMs >= projectile.durationMs;
}
