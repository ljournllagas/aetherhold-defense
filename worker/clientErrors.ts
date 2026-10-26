import { apiError } from './response.ts';
import { consumeRateLimit, type RateLimitEnv } from './rateLimit.ts';
import { readBoundedBody } from './body.ts';

const MAX_FIELD_LENGTH = 600;
const MAX_STACK_LENGTH = 2000;

export interface ClientErrorReport {
  message: string;
  stack?: string;
  source?: string;
  url?: string;
}

function field(value: unknown, limit: number): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value.slice(0, limit) : undefined;
}

/**
 * Keeps only the bounded shape the client is allowed to send. Anything else — player
 * names, account ids, free-form extra fields — is dropped rather than logged.
 */
export function parseClientErrorReport(body: unknown): ClientErrorReport | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const value = body as Record<string, unknown>;
  const message = field(value.message, MAX_FIELD_LENGTH);
  if (!message) return null;
  const report: ClientErrorReport = { message };
  const stack = field(value.stack, MAX_STACK_LENGTH);
  if (stack) report.stack = stack;
  const source = field(value.source, MAX_FIELD_LENGTH);
  if (source) report.source = source;
  const url = field(value.url, MAX_FIELD_LENGTH);
  if (url) report.url = url;
  return report;
}

/**
 * `POST /api/client-error` — logs an uncaught browser failure so it reaches Workers Logs.
 * Logs only: nothing is written to D1 and no player identity is accepted or stored.
 */
export async function handleClientError(request: Request, env: RateLimitEnv): Promise<Response | null> {
  if (new URL(request.url).pathname !== '/api/client-error') return null;
  if (request.method !== 'POST') return apiError('METHOD_NOT_ALLOWED', 'Use POST to report a client error.', 405);

  const verdict = await consumeRateLimit(env, `clienterr:${request.headers.get('CF-Connecting-IP') ?? 'anon'}`);
  if (verdict === 'unavailable') return apiError('CLIENT_ERROR_API_UNAVAILABLE', 'Error reporting is temporarily unavailable.', 503);
  if (verdict === 'limited') {
    const response = apiError('RATE_LIMITED', 'Too many error reports.', 429);
    response.headers.set('Retry-After', '60');
    return response;
  }

  const contentType = request.headers.get('Content-Type') ?? '';
  if (!contentType.includes('application/json')) return apiError('BAD_CONTENT_TYPE', 'Expected application/json.', 400);

  const bounded = await readBoundedBody(request);
  if (!bounded.ok && bounded.tooLarge) return apiError('PAYLOAD_TOO_LARGE', 'Error report is too large.', 413);
  if (!bounded.ok) return apiError('INVALID_JSON', 'Request body is not valid JSON.', 400);

  let body: unknown;
  try { body = JSON.parse(bounded.text); }
  catch { return apiError('INVALID_JSON', 'Request body is not valid JSON.', 400); }

  const report = parseClientErrorReport(body);
  if (!report) return apiError('INVALID_REPORT', 'The error report is invalid.', 400);

  console.error('client error', JSON.stringify(report));
  return new Response(null, { status: 204 });
}
