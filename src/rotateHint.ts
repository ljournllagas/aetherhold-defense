const SEEN_KEY = 'aetherhold-rotate-hint-seen';

/** One short, non-blocking nudge per session for phones held in portrait; the battlefield plays best in landscape. */
export function initRotateHint(): void {
  const portraitPhone = (): boolean => window.matchMedia('(orientation: portrait) and (max-width: 600px)').matches;
  const seen = (): boolean => { try { return sessionStorage.getItem(SEEN_KEY) === '1'; } catch { return false; } };
  let hint: HTMLDivElement | null = null;
  const hide = (): void => { hint?.remove(); hint = null; try { sessionStorage.setItem(SEEN_KEY, '1'); } catch { /* storage blocked: hint may show again */ } };
  const check = (): void => {
    if (!portraitPhone()) { hint?.remove(); hint = null; return; }
    if (hint || seen()) return;
    const el = document.createElement('div');
    el.setAttribute('role', 'status');
    el.style.cssText = 'position:fixed;left:50%;bottom:12px;transform:translateX(-50%);z-index:50;display:flex;gap:8px;align-items:center;max-width:calc(100vw - 32px);padding:8px 12px;border:1px solid #c9a24a;border-radius:6px;background:#121920;color:#e8e2d0;font:600 13px Inter,sans-serif';
    const text = document.createElement('span');
    text.textContent = 'Rotate your phone to landscape for a wider battlefield.';
    const close = document.createElement('button');
    close.type = 'button'; close.textContent = 'Got it'; close.setAttribute('aria-label', 'Dismiss rotate hint');
    close.style.cssText = 'min-height:44px;padding:0 12px;border:1px solid #c9a24a;border-radius:4px;background:#1b2630;color:#e8c879;font:inherit;cursor:pointer';
    close.addEventListener('click', hide);
    el.appendChild(text); el.appendChild(close); // not append(): workers-types shadows its signature
    document.body.appendChild(el);
    hint = el;
    setTimeout(hide, 10_000);
  };
  window.addEventListener('resize', check);
  check();
}
