import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createGuestAccountFixture } from './helpers/guestAccountFixture.ts';
import { saveSettings, loadSettings } from '../src/game/systems/Settings.ts';
import { emptyCloudProgress } from '../src/shared/cloudProgress.ts';
import type { ApiResult } from '../src/shared/account.ts';

type Prepared = ApiResult<{ url: string }>;

const fixtures: ReturnType<typeof createGuestAccountFixture>[] = [];
const make = () => { const f = createGuestAccountFixture(); fixtures.push(f); return f; };

beforeEach(() => {
  const m = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => m.set(k, v),
    removeItem: (k: string) => m.delete(k), key: (n: number) => [...m.keys()][n], get length() { return m.size; }
  });
  saveSettings({ ...loadSettings(), playerName: '', guestSelected: false, googleSignInPending: false });
});
afterEach(async () => { await Promise.all(fixtures.splice(0).map(f => f.close())); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

const googleUrl = 'https://accounts.google.com/o/oauth2/v2/auth?client_id=test';

it('keeps guest entry available after a failed auth attempt', async () => {
  const f = make();
  f.client.prepareGoogleSignIn = vi.fn<() => Promise<Prepared>>()
    .mockResolvedValueOnce({ ok: false, code: 'API_UNAVAILABLE', status: 503, message: 'Try again.' })
    .mockResolvedValueOnce({ ok: true, value: { url: googleUrl } });
  try {
    expect((await f.system.prepareGoogleSignIn(false)).ok).toBe(false);
    expect(loadSettings().googleSignInPending).toBe(false);
    expect((await f.system.enterGuest('Aria')).ok).toBe(true);
    expect((await f.system.prepareGoogleSignIn(false)).ok).toBe(true);
    expect(f.client.prepareGoogleSignIn).toHaveBeenCalledTimes(2);
  } finally { await f.close(); }
});

it('prevents preparation during a battle or deletion', async () => {
  const f = make();
  await f.system.enterGuest('Aria');
  f.system.captureRun();
  const attempt = vi.fn<() => Promise<Prepared>>(async () => ({ ok: true, value: { url: googleUrl } }));
  f.client.prepareGoogleSignIn = attempt;
  expect((await f.system.prepareGoogleSignIn(false)).ok).toBe(false);
  expect(attempt).not.toHaveBeenCalled();
  await f.system.discardBattle();
});

it('prevents preparation while account deletion is pending', async () => {
  const f = make();
  await f.system.initialize();
  expect(f.system.view().session).not.toBeNull();
  await f.system.beginDelete();
  f.client.prepareGoogleSignIn = vi.fn<() => Promise<Prepared>>(async () => ({ ok: true, value: { url: googleUrl } }));
  expect((await f.system.prepareGoogleSignIn(false)).ok).toBe(false);
  expect(f.client.prepareGoogleSignIn).not.toHaveBeenCalled();
});

it('cancels preparation without an auth request when loss acknowledgment is missing', async () => {
  const f = make();
  await f.system.enterGuest('Aria');
  vi.spyOn(f.guests, 'view').mockResolvedValue({
    persisted: false, warning: 'session only',
    journal: {
      version: 1, initialized: true, batches: [], seenRunIds: [],
      open: { nickname: 'Aria', warnings: [], result: null, progress: { ...emptyCloudProgress(), earned: { volley: new Date(0).toISOString() } } }
    }
  });
  const attempt = vi.fn<() => Promise<Prepared>>(async () => ({ ok: true, value: { url: googleUrl } }));
  f.client.prepareGoogleSignIn = attempt;
  const denied = await f.system.prepareGoogleSignIn(false);
  expect(denied.ok).toBe(false);
  expect(attempt).not.toHaveBeenCalled();
  expect(loadSettings().googleSignInPending).toBe(false);
  expect((await f.system.prepareGoogleSignIn(true)).ok).toBe(true);
  expect(attempt).toHaveBeenCalledTimes(1);
});

it.each([
  ['username embedded', 'https://user:pass@accounts.google.com/o/oauth2/v2/auth?client_id=test'],
  ['different origin', 'https://evil.example/o/oauth2/v2/auth?client_id=test'],
  ['plain http', 'http://accounts.google.com/o/oauth2/v2/auth?client_id=test'],
  ['not a url', '::not-a-url::']
])('rejects an invalid auth destination (%s) without navigating state', async (_name, url) => {
  const f = make();
  f.client.prepareGoogleSignIn = async () => ({ ok: true, value: { url } });
  const result = await f.system.prepareGoogleSignIn(false);
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.code).toBe('INVALID_AUTH_URL');
  expect(loadSettings().googleSignInPending).toBe(false);
});

it('clears a stale sign-in flag when preparation fails after an earlier success', async () => {
  const f = make();
  saveSettings({ ...loadSettings(), googleSignInPending: true });
  f.client.prepareGoogleSignIn = async () => ({ ok: true, value: { url: 'https://evil.example/auth' } });
  expect((await f.system.prepareGoogleSignIn(false)).ok).toBe(false);
  expect(loadSettings().googleSignInPending).toBe(false);
});
