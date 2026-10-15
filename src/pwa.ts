import { registerSW } from 'virtual:pwa-register';

/** Deferred install prompt captured for the custom in-game Install button (Q12). */
let deferredPrompt: (Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }) | null = null;

export function isStandalone(): boolean {
  try {
    return window.matchMedia?.('(display-mode: standalone)').matches
      || (navigator as unknown as { standalone?: boolean }).standalone === true;
  } catch { return false; }
}

export function isIOS(): boolean {
  try {
    const ua = navigator.userAgent || '';
    return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document);
  } catch { return false; }
}

/** Q10 helper: true when the browser reports no network. */
export function isOffline(): boolean {
  try { return navigator.onLine === false; } catch { return false; }
}

function show(el: HTMLElement | null, on: boolean): void {
  if (!el) return;
  if (on) el.removeAttribute('hidden');
  else el.setAttribute('hidden', '');
}

export function initPWA(): void {
  if (typeof window === 'undefined') return;

  // Q11: protect IndexedDB/localStorage saves from eviction on installed launch.
  try {
    if ('storage' in navigator && typeof navigator.storage?.persist === 'function') {
      void navigator.storage.persist().catch(() => undefined);
    }
  } catch { /* persistence is best-effort */ }

  const installBar = document.getElementById('pwa-install-bar');
  const installBtn = document.getElementById('pwa-install-btn');
  const installDismiss = document.getElementById('pwa-install-dismiss');
  const iosSheet = document.getElementById('pwa-ios-sheet');
  const iosClose = document.getElementById('pwa-ios-close');
  const updateBar = document.getElementById('pwa-update-bar');
  const updateBtn = document.getElementById('pwa-update-btn');
  const updateDismiss = document.getElementById('pwa-update-dismiss');

  const maybeShowInstall = (): void => {
    if (isStandalone()) { show(installBar, false); return; }
    if (deferredPrompt) {
      const t = document.getElementById('pwa-install-text');
      if (t) t.textContent = 'Install Aegis for fullscreen offline play';
      show(installBar, true);
      return;
    }
    // iOS has no beforeinstallprompt: show manual guidance once per session.
    if (isIOS()) {
      const t = document.getElementById('pwa-install-text');
      if (t) t.textContent = 'Install Aegis: Share → Add to Home Screen';
      show(installBar, true);
    }
  };

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as typeof deferredPrompt;
    maybeShowInstall();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    show(installBar, false);
  });

  installBtn?.addEventListener('click', () => {
    if (deferredPrompt) {
      void deferredPrompt.prompt();
      void deferredPrompt.userChoice.finally(() => {
        deferredPrompt = null;
        show(installBar, false);
      });
      return;
    }
    if (isIOS()) show(iosSheet, true);
  });
  installDismiss?.addEventListener('click', () => show(installBar, false));
  iosClose?.addEventListener('click', () => show(iosSheet, false));

  // Show the bar on load for iOS; Chromium shows it once beforeinstallprompt fires.
  if (document.readyState === 'complete') maybeShowInstall();
  else window.addEventListener('load', maybeShowInstall, { once: true });

  // Q7: prompt “Update available — restart”, never force-reload mid-run.
  try {
    const updateSW = registerSW({
      immediate: false,
      onNeedRefresh() { show(updateBar, true); },
      onOfflineReady() { /* shell precached; silent */ }
    });
    updateBtn?.addEventListener('click', () => { void updateSW(true); });
    updateDismiss?.addEventListener('click', () => show(updateBar, false));
  } catch { /* SW unsupported: game still runs online */ }
}
