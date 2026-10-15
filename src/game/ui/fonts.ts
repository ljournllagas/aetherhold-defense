/** Faces the canvas UI draws with. Phaser text never triggers @font-face downloads by itself. */
const UI_FACES = ['600 16px Cinzel', '700 16px Cinzel', '500 16px Inter', '600 16px Inter', '700 16px Inter'];
let pending: Promise<void> | null = null;

/** Starts the UI fonts downloading (idempotent) and resolves once they are usable or have failed. */
export function ensureUiFonts(): Promise<void> {
  const fonts = typeof document !== 'undefined' ? document.fonts : undefined;
  if (!fonts) return Promise.resolve();
  if (!pending) {
    const loads = typeof fonts.load === 'function' ? UI_FACES.map(face => fonts.load(face).catch(() => [])) : [];
    pending = Promise.all(loads).then(() => fonts.ready).then(() => undefined, () => undefined);
  }
  return pending;
}

/** Fire-and-forget image fetches so the HTTP cache is warm before Phaser's loader asks for them. */
export function warmImages(paths: readonly string[]): void {
  if (typeof Image === 'undefined') return;
  for (const path of paths) { const img = new Image(); img.decoding = 'async'; img.src = path; }
}
