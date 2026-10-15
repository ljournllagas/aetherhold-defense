import { loadSettings } from './Settings.ts';

/** Short vibration on touch devices only; follows the sound-effects setting and never throws. */
export function haptic(pattern: number | number[]): void {
  try {
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
    if (!window.matchMedia?.('(pointer: coarse)').matches || !loadSettings().sfxOn) return;
    navigator.vibrate(pattern);
  } catch { /* haptics are best-effort */ }
}
