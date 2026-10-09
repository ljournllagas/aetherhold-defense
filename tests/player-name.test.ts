import { expect, it } from 'vitest';
import { editPlayerName, runPlayerName, validatePlayerName } from '../src/shared/playerName.ts';
it('retains NFC letters and punctuation without splitting supplementary letters', () => {
  expect(editPlayerName('Jose\u0301 A.')).toBe('Jos\u00e9 A.');
  expect(editPlayerName('a'.repeat(19) + '\u{10400}' + 'b')).toBe('a'.repeat(19));
  expect(runPlayerName('  Jose\u0301   A.  ')).toBe('Jos\u00e9 A.');
  expect(runPlayerName(42)).toBe('Warden');
});
it.each(['<script>', 'a'.repeat(21), '\u{1F600}', '', null])('rejects invalid submitted name %s', value => {
  expect(validatePlayerName(value).ok).toBe(false);
});
it('normalizes valid submitted spelling', () => {
  expect(validatePlayerName('Jose\u0301 A.')).toMatchObject({ ok: true, name: 'Jos\u00e9 A.' });
});
