import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchCampaignLeaderboard } from '../src/api/leaderboardClient.ts';

const row = (overrides = {}) => ({
  playerId: 'a', nickname: 'Aria', missionsCompleted: 1, totalStars: 3, totalScore: 1000, ...overrides
});
const board = (scores: unknown, extra = {}) => ({
  campaignScoreVersion: 1, missionCount: 100, starCount: 300, scores, ...extra
});
const respond = (body: unknown, status = 200) =>
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
    typeof body === 'string' ? body : JSON.stringify(body), { status })));

afterEach(() => vi.unstubAllGlobals());

describe('campaign leaderboard client', () => {
  it('fetches the campaign board over GET without mutations', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(board([row()])), { status: 200 }));
    vi.stubGlobal('fetch', fetch);
    await expect(fetchCampaignLeaderboard()).resolves.toEqual({ ok: true, scores: [row()] });
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0] as [string, RequestInit?];
    expect(url).toBe('/api/campaign-leaderboard?limit=20');
    expect(init?.method ?? 'GET').toBe('GET');
    expect(init?.body).toBeUndefined();
  });

  it('rejects a board whose primary ordering is wrong', async () => {
    respond(board([
      row({ playerId: 'a', missionsCompleted: 1, totalStars: 3, totalScore: 1000 }),
      row({ playerId: 'b', nickname: 'B', missionsCompleted: 2, totalStars: 2, totalScore: 1 })
    ]));
    expect((await fetchCampaignLeaderboard()).ok).toBe(false);
  });

  it.each([
    ['wrong era', board([row()], { campaignScoreVersion: 2 })],
    ['wrong mission count', board([row()], { missionCount: 99 })],
    ['wrong star count', board([row()], { starCount: 299 })],
    ['duplicate player', board([row(), row({ nickname: 'B' })])],
    ['negative missions', board([row({ missionsCompleted: -1 })])],
    ['fractional stars', board([row({ totalStars: 1.5 })])],
    ['too many stars', board([row({ missionsCompleted: 1, totalStars: 4 })])],
    ['too many missions', board([row({ missionsCompleted: 101, totalStars: 300, totalScore: 0 })])],
    ['oversized nickname', board([row({ nickname: 'x'.repeat(21) })])],
    ['limit overflow', { ...board(Array.from({ length: 21 }, (_, i) => row({ playerId: `p${i}`, nickname: `N${i}` }))) }],
    ['missing scores', { campaignScoreVersion: 1, missionCount: 100, starCount: 300 }],
    ['scores not an array', board('nope')]
  ])('rejects %s', async (_name, body) => {
    respond(body);
    await expect(fetchCampaignLeaderboard()).resolves.toEqual({
      ok: false, message: 'Leaderboard returned an invalid response.'
    });
  });

  it('rejects HTTP failures and HTML bodies', async () => {
    respond(board([row()]), 503);
    expect((await fetchCampaignLeaderboard()).ok).toBe(false);
    respond('<html>not json</html>');
    expect((await fetchCampaignLeaderboard()).ok).toBe(false);
  });

  it('reports an aborted timeout as unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('The operation was aborted.', 'AbortError')));
    const result = await fetchCampaignLeaderboard();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message.length).toBeGreaterThan(0);
  });
});
