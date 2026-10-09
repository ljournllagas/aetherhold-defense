import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadSettings, saveSettings } from '../src/game/systems/Settings.ts';
import { SoundManager } from '../src/game/systems/SoundManager.ts';

const SETTINGS_KEY = 'aetherhold-settings-v1';

function mockStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); }
  };
}

function fakeAudioContext() {
  const gains: Array<{ gain: { value: number }; connect: ReturnType<typeof vi.fn> }> = [];
  const frequencies: number[] = [];
  class FakeAudioContext {
    state = 'running';
    currentTime = 0;
    destination = {};
    createGain() {
      const gain = {
        gain: {
          value: 0,
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn()
        },
        connect: vi.fn()
      };
      gains.push(gain);
      return gain;
    }
    createOscillator() {
      const frequency = {
        value: 0,
        setValueAtTime(value: number) { frequencies.push(value); },
        exponentialRampToValueAtTime: vi.fn()
      };
      return { type: 'sine', frequency, connect: vi.fn(), start: vi.fn(), stop: vi.fn() };
    }
    resume() { return Promise.resolve(); }
  }
  return { FakeAudioContext, gains, frequencies };
}

function resetSoundManager() {
  (SoundManager as unknown as { instance: SoundManager | null }).instance = null;
}

describe('audio settings and synthesized impacts', () => {
  it('keeps delayed effects silent until explicit background resume', () => {
    vi.stubGlobal('localStorage', mockStorage());
    const { FakeAudioContext, frequencies } = fakeAudioContext();
    vi.stubGlobal('window', { AudioContext: FakeAudioContext }); resetSoundManager();
    const sound = SoundManager.get(); sound.musicOn = false; sound.unlock();
    sound.suspend(); sound.click(); expect(frequencies).toEqual([]);
    sound.unlock(); sound.click(); expect(frequencies).toEqual([]);
    sound.resume(); sound.click(); expect(frequencies).toEqual([800]);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    resetSoundManager();
  });

  it('loads saved settings safely, clamps all volume controls, and routes impact through master gain', () => {
    vi.stubGlobal('localStorage', mockStorage());
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ masterVolume: 2, musicVolume: -1, sfxVolume: 0.4 }));
    const { FakeAudioContext, gains, frequencies } = fakeAudioContext();
    vi.stubGlobal('window', { AudioContext: FakeAudioContext });
    resetSoundManager();

    const sound = SoundManager.get();
    expect(loadSettings()).toMatchObject({ masterVolume: 1, musicVolume: 0, sfxVolume: 0.4 });
    sound.unlock();
    expect(gains).toHaveLength(3);
    expect(gains[0].gain.value).toBe(1);
    expect(gains[1].gain.value).toBe(0);
    expect(gains[2].gain.value).toBeCloseTo(0.4);

    sound.impact('ember');
    sound.impact('starfire');
    expect(frequencies).toEqual([220, 880]);

    sound.masterVolume = 4;
    sound.musicVolume = -2;
    sound.sfxVolume = 3;
    sound.applyVolumes();
    expect([sound.masterVolume, sound.musicVolume, sound.sfxVolume]).toEqual([1, 0, 1]);
    saveSettings({ ...loadSettings(), masterVolume: -1 });
    expect(loadSettings().masterVolume).toBe(0);
  });

  it('falls back to defaults when storage is unavailable', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('storage denied'); },
      setItem: () => { throw new Error('storage denied'); }
    });
    expect(loadSettings()).toMatchObject({ masterVolume: 1, musicVolume: 0.5, sfxVolume: 0.7, gameSpeed: 1 });
    expect(() => saveSettings(loadSettings())).not.toThrow();
  });
});
