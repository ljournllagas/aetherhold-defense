/**
 * True when the platform reports a reduced-motion preference. Decorative,
 * non-essential motion (ambient loops, pulses, drifting particles) is skipped
 * when this is true; gameplay-critical motion is unaffected.
 */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
