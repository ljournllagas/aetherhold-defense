import { describe, expect, it } from 'vitest';
import worker from '../worker/index.ts';
import type { Env } from '../worker/index.ts';
import { parseClientErrorReport } from '../worker/clientErrors.ts';
import { describeClientError, installClientErrorReporting } from '../src/api/clientErrors.ts';
import type { ClientErrorReport } from '../src/api/clientErrors.ts';

type Limiter = { limit(options: { key: string }): Promise<{ success: boolean }> };

function spyLimiter(success: boolean): { calls: Array<{ key: string }>; limiter: Limiter } {
  const calls: Array<{ key: string }> = [];
  return { calls, limiter: { limit: async (options) => { calls.push(options); return { success }; } } };
}

function env(limiter?: Limiter): Env {
  return {
    DB: {} as D1Database,
    APP_ORIGIN: 'https://game.example',
    GOOGLE_CLIENT_ID: 'client',
    GOOGLE_CLIENT_SECRET: 'secret',
    ACCOUNT_LOGIN_REQUIRED: '1',
    SCORE_RATE_LIMITER: limiter as unknown as RateLimit
  };
}

function post(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request('https://game.example/api/client-error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '198.51.100.7', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  });
}

describe('client error endpoint', () => {
  it('accepts a bounded report and keys the limiter on the trusted address', async () => {
    const { calls, limiter } = spyLimiter(true);

    const response = await worker.fetch(post({ message: 'boom', stack: 'at x', url: '/game' }), env(limiter));

    expect(response.status).toBe(204);
    expect(calls).toEqual([{ key: 'clienterr:198.51.100.7' }]);
  });

  it('rejects anything but POST', async () => {
    const response = await worker.fetch(new Request('https://game.example/api/client-error'), env(spyLimiter(true).limiter));

    expect(response.status).toBe(405);
  });

  it('limits repeated reports without touching the score bucket', async () => {
    const { calls, limiter } = spyLimiter(false);
    const response = await worker.fetch(post({ message: 'boom' }), env(limiter));

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('60');
    expect(calls[0].key.startsWith('clienterr:')).toBe(true);
  });

  it('fails closed without a usable limiter', async () => {
    expect((await worker.fetch(post({ message: 'boom' }), env(undefined))).status).toBe(503);
  });

  it('rejects a report over the body cap', async () => {
    const response = await worker.fetch(post({ message: 'x'.repeat(5000) }), env(spyLimiter(true).limiter));

    expect(response.status).toBe(413);
  });

  it('rejects malformed JSON and a report without a message', async () => {
    expect((await worker.fetch(post('{nope'), env(spyLimiter(true).limiter))).status).toBe(400);
    expect((await worker.fetch(post({ stack: 'no message' }), env(spyLimiter(true).limiter))).status).toBe(400);
  });

  it('keeps only the fields the client is allowed to send', () => {
    expect(parseClientErrorReport({ message: 'boom', playerName: 'Warden', accountId: 'a', url: '/game' }))
      .toEqual({ message: 'boom', url: '/game' });
  });
});

describe('client error reporter', () => {
  it('describes an Error without leaking a query string', () => {
    const report = describeClientError(new Error('boom'), '/game');

    expect(report.message).toBe('boom');
    expect(report.url).toBe('/game');
    expect(report.stack).toContain('boom');
  });

  it('caps reports per session and swallows send failures', async () => {
    const sent: ClientErrorReport[] = [];
    const listeners = new Map<string, (event: unknown) => void>();
    const target = {
      location: { pathname: '/game' },
      addEventListener: (type: string, handler: (event: unknown) => void) => listeners.set(type, handler),
      removeEventListener: (type: string) => listeners.delete(type)
    } as unknown as Window;
    const stop = installClientErrorReporting({
      target,
      limit: 2,
      send: (async (_url: string, init?: RequestInit) => {
        sent.push(JSON.parse(String(init?.body)) as ClientErrorReport);
        throw new Error('offline');
      }) as unknown as typeof fetch
    });

    listeners.get('error')?.({ error: new Error('one') });
    listeners.get('error')?.({ error: new Error('two') });
    listeners.get('error')?.({ error: new Error('three') });
    await Promise.resolve();

    expect(sent.map((report) => report.message)).toEqual(['one', 'two']);
    stop();
    expect(listeners.size).toBe(0);
  });
});
