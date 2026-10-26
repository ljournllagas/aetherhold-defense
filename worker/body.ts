/** Shared request-body guard: every API endpoint accepts at most this many bytes. */
export const MAX_BODY_BYTES = 4096;

export type BoundedBody = { ok: true; text: string } | { ok: false; tooLarge: boolean };

export async function readBoundedBody(request: Request): Promise<BoundedBody> {
  const reader = request.body?.getReader();
  if (!reader) return { ok: true, text: '' };
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let bytes = 0;
  let text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BODY_BYTES) {
        try { await reader.cancel(); } catch { /* response is already bounded */ }
        return { ok: false, tooLarge: true };
      }
      text += decoder.decode(value, { stream: true });
    }
    return { ok: true, text: text + decoder.decode() };
  } catch {
    return { ok: false, tooLarge: false };
  }
}
