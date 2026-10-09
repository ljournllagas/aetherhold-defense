import { afterEach, expect, it, vi } from 'vitest';
import { loadSettings, normalizeSettings, saveSettings } from '../src/game/systems/Settings.ts';
afterEach(() => vi.unstubAllGlobals());
it.each([null, [], 42, 'bad'])('defaults non-object settings: %j', value => {
  expect(normalizeSettings(value)).toMatchObject({ gameSpeed: 1, difficulty: 'medium', playerName: '' });
});
it('defaults malformed fields independently without losing legal volume', () => {
  vi.stubGlobal('localStorage', { getItem: () => JSON.stringify({ playerName: 42, difficulty: 'unknown', musicOn: 'false', gameSpeed: 9, sfxVolume: .4 }) });
  expect(loadSettings()).toMatchObject({ playerName: '', difficulty: 'medium', musicOn: true, gameSpeed: 1, sfxVolume: .4 });
});
it.each(['musicOn', 'sfxOn'] as const)('accepts only booleans for %s', key => {
  for (const value of [false, true]) expect(normalizeSettings({ [key]: value })[key]).toBe(value);
  for (const value of [0, 1, null, 'false', [], {}]) expect(normalizeSettings({ [key]: value })[key]).toBe(true);
});
it.each([1, 2, 3])('retains legal speed %i', gameSpeed => expect(normalizeSettings({ gameSpeed }).gameSpeed).toBe(gameSpeed));
it.each([0, -1, 4, NaN, Infinity, '2'])('defaults illegal speed %s', gameSpeed => expect(normalizeSettings({ gameSpeed }).gameSpeed).toBe(1));
it.each(['easy', 'medium', 'hard'] as const)('retains difficulty %s', difficulty => expect(normalizeSettings({ difficulty }).difficulty).toBe(difficulty));
it.each(['', 'unknown', 42, null])('defaults illegal difficulty %s', difficulty => expect(normalizeSettings({ difficulty }).difficulty).toBe('medium'));
it.each(['masterVolume', 'musicVolume', 'sfxVolume'] as const)('bounds finite volumes %s', key => {
  expect(normalizeSettings({ [key]: -1 })[key]).toBe(0);
  expect(normalizeSettings({ [key]: 2 })[key]).toBe(1);
  expect(normalizeSettings({ [key]: .4 })[key]).toBe(.4);
  for (const value of [NaN, Infinity, '0.4', null]) expect(normalizeSettings({ [key]: value })[key]).toBe(normalizeSettings({})[key]);
});
it.each([null, '', '{broken', 'null', '[]'])('defaults missing/malformed JSON %s', raw => {
  vi.stubGlobal('localStorage', { getItem: () => raw });
  expect(loadSettings()).toEqual(normalizeSettings({}));
});
it('survives refused storage and sanitizes writes', () => {
  vi.stubGlobal('localStorage', { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); } });
  expect(loadSettings()).toEqual(normalizeSettings({}));
  expect(() => saveSettings(normalizeSettings({}))).not.toThrow();
  const setItem = vi.fn(); vi.stubGlobal('localStorage', { setItem });
  saveSettings({ ...normalizeSettings({}), playerName: 'Jose\u0301 A.' });
  expect(JSON.parse(setItem.mock.calls[0][1]).playerName).toBe('Jos\u00e9 A.');
});
