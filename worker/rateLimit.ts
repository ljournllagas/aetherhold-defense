/** Native per-location rate-limit binding (`[[ratelimits]]` in wrangler.toml). */
export interface RateLimitEnv {
  SCORE_RATE_LIMITER?: RateLimit;
}

export type RateLimitVerdict = 'allowed' | 'limited' | 'unavailable';

/**
 * Consults the native rate-limit binding for `key`. A missing or failing binding
 * is reported as `unavailable`, distinct from a healthy denial, so callers can
 * fail closed without a second lookup. Counters are per-location and eventually
 * consistent; the key is built from a trusted platform value (the session's
 * player id) or CF-Connecting-IP, never from a client-supplied header such as
 * X-Forwarded-For.
 */
export async function consumeRateLimit(env: RateLimitEnv, key: string): Promise<RateLimitVerdict> {
  try {
    const quota = await env.SCORE_RATE_LIMITER?.limit({ key });
    if (!quota) return 'unavailable';
    return quota.success ? 'allowed' : 'limited';
  } catch {
    return 'unavailable';
  }
}
