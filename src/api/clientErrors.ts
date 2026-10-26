/**
 * Reports uncaught client failures to the worker so a browser crash shows up in Workers
 * Logs. Deliberately small: bounded payload, no player identity, capped per session, and
 * every failure to report is swallowed so a broken reporter can never break the game.
 */
export const CLIENT_ERROR_ENDPOINT = '/api/client-error';
export const MAX_REPORTS_PER_SESSION = 5;
const MAX_FIELD_LENGTH = 600;

export interface ClientErrorReport {
  message: string;
  stack?: string;
  source?: string;
  url: string;
}

function clip(value: unknown): string {
  const text = typeof value === 'string' ? value : String(value ?? '');
  return text.slice(0, MAX_FIELD_LENGTH);
}

/** Turns an error, a rejection reason or an event into the bounded wire shape. */
export function describeClientError(reason: unknown, pathname: string): ClientErrorReport {
  const url = clip(pathname);
  if (reason instanceof Error) {
    const report: ClientErrorReport = { message: clip(reason.message), url };
    if (reason.stack) report.stack = clip(reason.stack);
    if (reason.name && reason.name !== 'Error') report.source = clip(reason.name);
    return report;
  }
  const event = reason as { message?: unknown; filename?: unknown } | null;
  if (event && typeof event === 'object' && typeof event.message === 'string') {
    const report: ClientErrorReport = { message: clip(event.message), url };
    if (typeof event.filename === 'string') report.source = clip(event.filename);
    return report;
  }
  return { message: clip(reason ?? 'Unknown client error'), url };
}

export interface ClientErrorOptions {
  target?: Window;
  endpoint?: string;
  send?: typeof fetch;
  limit?: number;
}

/**
 * Installs `error` and `unhandledrejection` listeners and returns a disposer.
 * `pathname` is sent instead of the full URL so query strings and hashes never leave the browser.
 */
export function installClientErrorReporting(options: ClientErrorOptions = {}): () => void {
  const target = options.target ?? window;
  const endpoint = options.endpoint ?? CLIENT_ERROR_ENDPOINT;
  const send = options.send ?? fetch;
  const limit = options.limit ?? MAX_REPORTS_PER_SESSION;
  let sent = 0;

  const report = (reason: unknown): void => {
    if (sent >= limit) return;
    sent += 1;
    try {
      const body = JSON.stringify(describeClientError(reason, target.location?.pathname ?? '/'));
      void Promise.resolve(send(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
        keepalive: true
      })).catch(() => {});
    } catch { /* never let reporting throw into the error path */ }
  };

  const onError = (event: Event): void => {
    const detail = event as { error?: unknown; message?: string };
    report(detail.error ?? detail.message ?? 'Uncaught error');
  };
  const onRejection = (event: Event): void => {
    report((event as { reason?: unknown }).reason ?? 'Unhandled rejection');
  };

  target.addEventListener('error', onError);
  target.addEventListener('unhandledrejection', onRejection);
  return () => {
    target.removeEventListener('error', onError);
    target.removeEventListener('unhandledrejection', onRejection);
  };
}
