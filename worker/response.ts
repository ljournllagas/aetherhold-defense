export const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'"
};

export function json(data: unknown, status = 200): Response {
  const response = new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) response.headers.set(key, value);
  return response;
}

export function apiError(code: string, message: string, status: number): Response {
  return json({ ok: false, error: { code, message } }, status);
}
