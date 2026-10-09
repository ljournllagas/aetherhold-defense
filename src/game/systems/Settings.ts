import { SCORE_VERSION } from '../../shared/version.ts';

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
const BEST_KEY = 'aetherhold-best-score-v2';
const LEGACY_BEST_KEY = 'aetherhold-best-v1';

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

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const saved = JSON.parse(raw) as Partial<Settings>;
    return {
      ...DEFAULTS,
      ...saved,
      masterVolume: clampVolume(saved.masterVolume, DEFAULTS.masterVolume),
      musicVolume: clampVolume(saved.musicVolume, DEFAULTS.musicVolume),
      sfxVolume: clampVolume(saved.sfxVolume, DEFAULTS.sfxVolume)
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(s: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      ...s,
      masterVolume: clampVolume(s.masterVolume, DEFAULTS.masterVolume),
      musicVolume: clampVolume(s.musicVolume, DEFAULTS.musicVolume),
      sfxVolume: clampVolume(s.sfxVolume, DEFAULTS.sfxVolume)
    }));
  } catch { /* ignore */ }
}

export interface LocalBest {
  score: number;
  wave: number;
  difficulty: string;
  date: string;
  scoreVersion: number;
}

function parseBest(key: string, legacy: boolean): LocalBest | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<LocalBest> | null;
    if (!v || typeof v !== 'object' || typeof v.score !== 'number' || !Number.isFinite(v.score)) return null;
    const scoreVersion = typeof v.scoreVersion === 'number' ? v.scoreVersion : (legacy ? 1 : NaN);
    if (!legacy && scoreVersion !== SCORE_VERSION) return null;
    return {
      score: v.score,
      wave: typeof v.wave === 'number' ? v.wave : 0,
      difficulty: typeof v.difficulty === 'string' ? v.difficulty : '',
      date: typeof v.date === 'string' ? v.date : '',
      scoreVersion
    };
  } catch {
    return null;
  }
}

export function loadBest(): LocalBest | null {
  return parseBest(BEST_KEY, false);
}

export function loadLegacyBest(): LocalBest | null {
  return parseBest(LEGACY_BEST_KEY, true);
}

export function saveBest(b: Omit<LocalBest, 'scoreVersion'>): void {
  try {
    const prev = loadBest();
    if (!prev || b.score > prev.score) {
      localStorage.setItem(BEST_KEY, JSON.stringify({ ...b, scoreVersion: SCORE_VERSION }));
    }
  } catch { /* ignore */ }
}
