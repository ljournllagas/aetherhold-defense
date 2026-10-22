export type MotionPreference = 'auto' | 'reduced' | 'full';
const KEY = 'aetherhold-motion-v1';

export function motionPreference(): MotionPreference {
  try {
    const value = (globalThis as { localStorage?: Storage }).localStorage?.getItem(KEY);
    return value === 'reduced' || value === 'full' ? value : 'auto';
  } catch { return 'auto'; }
}

export function cycleMotionPreference(): MotionPreference {
  const next: MotionPreference = ({ auto: 'reduced', reduced: 'full', full: 'auto' } as const)[motionPreference()];
  try { (globalThis as { localStorage?: Storage }).localStorage?.setItem(KEY, next); } catch { /* storage blocked: keeps following the OS setting */ }
  return next;
}

export const MOTION_LABEL: Readonly<Record<MotionPreference, string>> = { auto: 'Auto', reduced: 'Reduced', full: 'Full' };

/**
 * True when motion should be reduced: the player's Settings override, else the
 * platform preference. Decorative, non-essential motion (ambient loops, pulses,
 * drifting particles) is skipped when this is true; gameplay-critical motion is unaffected.
 */
export function prefersReducedMotion(): boolean {
  const pick = motionPreference();
  if (pick !== 'auto') return pick === 'reduced';
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
