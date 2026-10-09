import { SCORE_VERSION } from '../../shared/version.ts';
import { editPlayerName } from '../../shared/playerName.ts';

export interface Settings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  musicOn: boolean;
  sfxOn: boolean;
  gameSpeed: number;
  difficulty: 'easy' | 'medium' | 'hard';
  playerName: string;
}

const KEY = 'aetherhold-settings-v1';
const BEST_KEY = 'aetherhold-best-score-v3';
/** Retained legacy bests, newest era first. Only these keys may infer their era when the field is absent. */
const LEGACY_BEST_KEYS: ReadonlyArray<readonly [key: string, era: number]> = [
  ['aetherhold-best-score-v2', 2],
  ['aetherhold-best-v1', 1]
];

const DEFAULTS: Settings = {
  masterVolume: 1,
  musicVolume: 0.5,
  sfxVolume: 0.7,
  musicOn: true,
  sfxOn: true,
  gameSpeed: 1,
  difficulty: 'medium',
  playerName: ''
};

function clampVolume(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.min(1, value))
    : fallback;
}

export function normalizeSettings(value: unknown): Settings {
  const saved = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  return {
    masterVolume: clampVolume(saved.masterVolume, DEFAULTS.masterVolume),
    musicVolume: clampVolume(saved.musicVolume, DEFAULTS.musicVolume),
    sfxVolume: clampVolume(saved.sfxVolume, DEFAULTS.sfxVolume),
    musicOn: typeof saved.musicOn === 'boolean' ? saved.musicOn : DEFAULTS.musicOn,
    sfxOn: typeof saved.sfxOn === 'boolean' ? saved.sfxOn : DEFAULTS.sfxOn,
    gameSpeed: saved.gameSpeed === 1 || saved.gameSpeed === 2 || saved.gameSpeed === 3 ? saved.gameSpeed : DEFAULTS.gameSpeed,
    difficulty: saved.difficulty === 'easy' || saved.difficulty === 'medium' || saved.difficulty === 'hard' ? saved.difficulty : DEFAULTS.difficulty,
    playerName: editPlayerName(saved.playerName)
  };
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    return normalizeSettings(JSON.parse(raw));
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(s: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(normalizeSettings(s)));
  } catch { /* ignore */ }
}

export interface LocalBest {
  score: number;
  wave: number;
  difficulty: string;
  date: string;
  scoreVersion: number;
}

/**
 * Reads one stored best. `expectedEra` must match the record's era; only a retained
 * legacy record whose `scoreVersion` field is absent may fall back to `implicitEra`.
 * Malformed records are treated as absent and never rewritten.
 */
function parseBest(key: string, expectedEra: number, implicitEra?: number): LocalBest | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<LocalBest> | null;
    if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
    const scoreVersion = typeof v.scoreVersion === 'number' ? v.scoreVersion : implicitEra;
    if (scoreVersion !== expectedEra) return null;
    if (typeof v.score !== 'number' || !Number.isSafeInteger(v.score) || v.score < 0) return null;
    if (typeof v.wave !== 'number' || !Number.isSafeInteger(v.wave) || v.wave < 0) return null;
    if (v.difficulty !== 'easy' && v.difficulty !== 'medium' && v.difficulty !== 'hard') return null;
    if (typeof v.date !== 'string' || !Number.isFinite(Date.parse(v.date))) return null;
    return { score: v.score, wave: v.wave, difficulty: v.difficulty, date: v.date, scoreVersion };
  } catch {
    return null;
  }
}

export function loadBest(): LocalBest | null {
  return parseBest(BEST_KEY, SCORE_VERSION);
}

/** Both retained legacy bests, newest era first; malformed or other-era records are omitted. */
export function loadLegacyBests(): LocalBest[] {
  const records: LocalBest[] = [];
  for (const [key, era] of LEGACY_BEST_KEYS) {
    const record = parseBest(key, era, era);
    if (record) records.push(record);
  }
  return records;
}

export function loadLegacyBest(): LocalBest | null {
  return loadLegacyBests()[0] ?? null;
}

export function saveBest(b: Omit<LocalBest, 'scoreVersion'>): void {
  try {
    const prev = loadBest();
    if (!prev || b.score > prev.score) {
      localStorage.setItem(BEST_KEY, JSON.stringify({ ...b, scoreVersion: SCORE_VERSION }));
    }
  } catch { /* ignore */ }
}
