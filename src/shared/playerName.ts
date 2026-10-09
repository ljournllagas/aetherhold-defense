export const PLAYER_NAME_MAX = 20;
const NAME_ALLOWED = /^[\p{L}\p{N} _\-'.]+$/u;

export function editPlayerName(value: unknown): string {
  const clean = typeof value === 'string' ? value.normalize('NFC').replace(/[^\p{L}\p{N} _\-'.]/gu, '') : '';
  let out = '';
  for (const char of clean) {
    if (out.length + char.length > PLAYER_NAME_MAX) break;
    out += char;
  }
  return out;
}

export function runPlayerName(value: unknown): string {
  return editPlayerName(value).trim().replace(/ +/g, ' ') || 'Warden';
}

export function validatePlayerName(value: unknown): { ok: boolean; name: string; error?: string } {
  const name = typeof value === 'string' ? value.normalize('NFC').trim().replace(/ +/g, ' ') : '';
  if (!name) return { ok: false, name, error: 'playerName is required' };
  if (name.length > PLAYER_NAME_MAX) return { ok: false, name, error: 'playerName too long' };
  if (!NAME_ALLOWED.test(name)) return { ok: false, name, error: 'playerName contains invalid characters' };
  return { ok: true, name };
}
