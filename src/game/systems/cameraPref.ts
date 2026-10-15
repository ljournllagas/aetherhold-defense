const KEY = 'aetherhold-portrait-zoom';

/** Portrait phones start zoomed on the lane unless the player chose "Whole map". Per-device, best-effort. */
export function portraitZoomEnabled(): boolean {
  try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; }
}

export function setPortraitZoomEnabled(on: boolean): void {
  try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* preference stays session-only */ }
}
