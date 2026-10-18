import { describe, expect, it } from 'vitest';
import worker from '../worker/index.ts';
import type { Env } from '../worker/index.ts';
import { handleAuth, type AuthEnv } from '../worker/auth.ts';
import { emptyCloudProgress } from '../src/shared/cloudProgress.ts';
import { accountDb } from './helpers/accountDb.ts';

type Limiter = { limit(options: { key: string }): Promise<{ success: boolean }> };

function spyLimiter(success: boolean): { calls: Array<{ key: string }>; limiter: Limiter } {
  const calls: Array<{ key: string }> = [];
  return { calls, limiter: { limit: async (options) => { calls.push(options); return { success }; } } };
}

/** Minimal auth environment: the limiter check runs before Google discovery. */
function authEnv(limiter: Limiter | undefined): AuthEnv {
  return {
    DB: {} as D1Database,
    APP_ORIGIN: 'https://game.example',
    GOOGLE_CLIENT_ID: 'client',
    GOOGLE_CLIENT_SECRET: 'secret',
    ACCOUNT_LOGIN_REQUIRED: '1',
    SCORE_RATE_LIMITER: limiter as RateLimit | undefined
  };
}

describe('auth and account rate limiting', () => {
  it('limits unauthenticated sign-in starts on the trusted address', async () => {
    const { calls, limiter } = spyLimiter(false);
    const response = await handleAuth(new Request('https://game.example/api/auth/start', { headers: { 'CF-Connecting-IP': '198.51.100.7' } }), authEnv(limiter));

    expect(response?.status).toBe(429);
    expect(response?.headers.get('Retry-After')).toBe('60');
    expect(((await response?.json()) as { code: string }).code).toBe('RATE_LIMITED');
    expect(calls).toEqual([{ key: 'auth-start:198.51.100.7' }]);
  });

  it('ignores a spoofed forwarding header when keying sign-in starts', async () => {
    const { calls, limiter } = spyLimiter(false);
    await handleAuth(new Request('https://game.example/api/auth/start', { headers: { 'X-Forwarded-For': '203.0.113.9' } }), authEnv(limiter));

    expect(calls).toEqual([{ key: 'auth-start:anon' }]);
  });

  it('fails closed without a usable limiter binding on sign-in starts', async () => {
    expect((await handleAuth(new Request('https://game.example/api/auth/start'), authEnv(undefined)))?.status).toBe(503);
    const throwing: Limiter = { limit: async () => { throw new Error('binding failed'); } };
    expect((await handleAuth(new Request('https://game.example/api/auth/start'), authEnv(throwing)))?.status).toBe(503);
  });

  it('limits account writes per player', async () => {
    const f = await accountDb();
    try {
      const { calls, limiter } = spyLimiter(false);
      const env = { ...f.env, SCORE_RATE_LIMITER: limiter } as unknown as Env;
      const response = await worker.fetch(f.request('/api/account/sync', 'a', { progress: emptyCloudProgress() }), env);

      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe('60');
      expect(calls).toEqual([{ key: 'account:a' }]);
    } finally { await f.dispose(); }
  });

  it('never consults the limiter for account reads', async () => {
    const f = await accountDb();
    try {
      const { calls, limiter } = spyLimiter(false);
      const env = { ...f.env, SCORE_RATE_LIMITER: limiter } as unknown as Env;

      expect((await worker.fetch(f.request('/api/account', 'a'), env)).status).toBe(200);
      expect(calls).toEqual([]);
    } finally { await f.dispose(); }
  });

  it('fails closed without a usable limiter binding on account writes', async () => {
    const f = await accountDb();
    try {
      const missing = { ...f.env, SCORE_RATE_LIMITER: undefined } as unknown as Env;
      expect((await worker.fetch(f.request('/api/account/sync', 'a', { progress: emptyCloudProgress() }), missing)).status).toBe(503);

      const throwing = { ...f.env, SCORE_RATE_LIMITER: { limit: async () => { throw new Error('binding failed'); } } } as unknown as Env;
      expect((await worker.fetch(f.request('/api/account/sync', 'a', { progress: emptyCloudProgress() }), throwing)).status).toBe(503);
    } finally { await f.dispose(); }
  });
});
