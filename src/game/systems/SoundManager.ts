// Procedural audio — original synthesized SFX + ambient music. No copyrighted assets.
import { loadSettings } from './Settings.ts';

function clampVolume(value: number, fallback: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : fallback;
}

export class SoundManager {
  private static instance: SoundManager | null = null;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicTimer: number | null = null;
  private backgroundSuspended = false;
  masterVolume = 1;
  musicOn = true;
  sfxOn = true;
  musicVolume = 0.5;
  sfxVolume = 0.7;

  private constructor() {
    const settings = loadSettings();
    this.masterVolume = clampVolume(settings.masterVolume, 1);
    this.musicOn = settings.musicOn;
    this.sfxOn = settings.sfxOn;
    this.musicVolume = clampVolume(settings.musicVolume, 0.5);
    this.sfxVolume = clampVolume(settings.sfxVolume, 0.7);
  }

  static get(): SoundManager {
    if (!SoundManager.instance) SoundManager.instance = new SoundManager();
    return SoundManager.instance;
  }

  private ensure(): AudioContext | null {
    if (this.backgroundSuspended) return null;
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AC();
        this.masterGain = this.ctx.createGain();
        this.musicGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();
        this.musicGain.connect(this.masterGain);
        this.sfxGain.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);
        this.applyVolumes();
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return this.ctx;
    } catch {
      return null;
    }
  }

  applyVolumes(): void {
    this.masterVolume = clampVolume(this.masterVolume, 1);
    this.musicVolume = clampVolume(this.musicVolume, 0.5);
    this.sfxVolume = clampVolume(this.sfxVolume, 0.7);
    if (this.masterGain && this.ctx) this.masterGain.gain.value = this.masterVolume;
    if (this.musicGain && this.ctx) this.musicGain.gain.value = this.musicOn ? this.musicVolume * 0.35 : 0;
    if (this.sfxGain && this.ctx) this.sfxGain.gain.value = this.sfxOn ? this.sfxVolume : 0;
  }

  unlock(): void {
    this.ensure();
  }

  suspend(): void {
    this.backgroundSuspended = true; this.stopMusic();
    if (this.ctx?.suspend) void this.ctx.suspend().catch(() => {});
  }

  resume(): void {
    this.backgroundSuspended = false; this.unlock();
    if (this.musicOn) this.startMusic();
  }

  private blip(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.5, slide = 0): void {
    if (!this.sfxOn) return;
    const ctx = this.ensure();
    if (!ctx || !this.sfxGain) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slide !== 0) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), ctx.currentTime + dur);
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.connect(g);
    g.connect(this.sfxGain);
    o.start();
    o.stop(ctx.currentTime + dur);
  }

  shoot(): void { this.blip(720 + Math.random() * 200, 0.08, 'square', 0.12, -300); }
  cannon(): void { this.blip(140, 0.25, 'sawtooth', 0.3, -60); }
  impact(towerIdOrDamageType: string): void {
    switch (towerIdOrDamageType) {
      case 'ember':
      case 'physical': this.blip(220, 0.12, 'triangle', 0.2, -110); break;
      case 'glacier':
      case 'elemental': this.blip(740, 0.13, 'sine', 0.14, -440); break;
      case 'starfire':
      case 'arcane': this.blip(880, 0.16, 'triangle', 0.18, -500); break;
      case 'tempest': this.blip(1460, 0.09, 'sawtooth', 0.12, -1000); break;
      default: this.blip(300, 0.1, 'triangle', 0.16, -120);
    }
  }
  frost(): void { this.blip(1200, 0.15, 'sine', 0.15, 400); }
  zap(): void { this.blip(1800, 0.1, 'sawtooth', 0.12, -900); }
  die(): void { this.blip(300, 0.12, 'triangle', 0.2, -150); }
  build(): void { this.blip(220, 0.2, 'triangle', 0.3, 220); }
  upgrade(): void { this.blip(440, 0.25, 'triangle', 0.3, 440); }
  sell(): void { this.blip(600, 0.15, 'triangle', 0.25, -300); }
  leak(): void { this.blip(180, 0.4, 'sawtooth', 0.35, -100); }
  powerup(): void {
    this.blip(523, 0.15, 'sine', 0.3);
    setTimeout(() => this.blip(659, 0.15, 'sine', 0.3), 120);
    setTimeout(() => this.blip(784, 0.3, 'sine', 0.3), 240);
  }
  boss(): void { this.blip(90, 0.8, 'sawtooth', 0.4, 40); }
  gameover(): void {
    this.blip(392, 0.3, 'triangle', 0.3, -50);
    setTimeout(() => this.blip(330, 0.3, 'triangle', 0.3, -50), 280);
    setTimeout(() => this.blip(262, 0.6, 'triangle', 0.3, -50), 560);
  }
  click(): void { this.blip(800, 0.05, 'sine', 0.15); }

  startMusic(): void {
    if (this.musicTimer !== null || !this.musicOn) return;
    const ctx = this.ensure();
    if (!ctx || !this.musicGain) return;
    // Gentle modal arpeggio loop (A minor-ish fantasy pad)
    const notes = [220, 261.6, 329.6, 392, 329.6, 261.6];
    let i = 0;
    const step = () => {
      if (!this.musicOn) return;
      const c = this.ctx;
      if (!c || !this.musicGain) return;
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'triangle';
      o.frequency.value = notes[i % notes.length];
      g.gain.setValueAtTime(0.0, c.currentTime);
      g.gain.linearRampToValueAtTime(0.25, c.currentTime + 0.15);
      g.gain.linearRampToValueAtTime(0.0, c.currentTime + 0.9);
      o.connect(g);
      g.connect(this.musicGain);
      o.start();
      o.stop(c.currentTime + 1.0);
      i++;
    };
    step();
    this.musicTimer = window.setInterval(step, 950);
  }

  stopMusic(): void {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}
