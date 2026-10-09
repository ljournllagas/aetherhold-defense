import { POWERUP_INVENTORY_LIMIT } from '../config/powerUps.ts';
import { SIEGE_BOSS_BIT, type ResultProgress, type RunOutcome } from '../../shared/progression.ts';
import type { RelicVault } from './RunSimulation.ts';

export interface ClearInput { wave: number; lives: number; spawns: number; enemies: number; flights: number; fields: number; }
export type ClearEvent = 'none' | 'wave-cleared' | 'victory';
export type SiegePhase = 'siege' | 'victory' | 'endless' | 'terminal';

const SIEGE_FINAL_WAVE = 30;

function bossBit(wave: number): number {
  return wave === 10 || wave === 20 || wave === 30 ? SIEGE_BOSS_BIT[wave] : 0;
}

/** One phase at a time: siege → victory decision → endless or terminal. */
export class SiegeSystem {
  phase: SiegePhase = 'siege';
  highestWave = 0;
  wavesCompleted = 0;
  siegeBossesDefeated = 0;
  private activeWave: number | null = null;
  private terminalOutcome: RunOutcome | null = null;

  get evolutionOpen(): boolean { return (this.siegeBossesDefeated & SIEGE_BOSS_BIT[10]) !== 0; }

  startWave(wave: number): boolean {
    if (this.phase !== 'siege' && this.phase !== 'endless') return false;
    if (this.activeWave !== null || wave !== this.wavesCompleted + 1) return false;
    if (wave > SIEGE_FINAL_WAVE && this.phase !== 'endless') return false;
    this.activeWave = wave;
    this.highestWave = Math.max(this.highestWave, wave);
    return true;
  }

  bossKilled(wave: number): void {
    if (this.phase === 'terminal') return;
    this.siegeBossesDefeated |= bossBit(wave);
  }

  bossEscaped(wave: number, lives: number): RunOutcome | null {
    if (lives <= 0) return 'defeat';
    if (this.phase === 'siege' && (wave === 10 || wave === 30)) return 'siege-failed';
    return null;
  }

  completeWave(input: ClearInput): ClearEvent {
    if (this.phase === 'terminal' || input.wave !== this.activeWave || input.lives <= 0) return 'none';
    if (input.spawns + input.enemies + input.flights + input.fields !== 0) return 'none';
    this.wavesCompleted = input.wave; this.activeWave = null;
    const required = SIEGE_BOSS_BIT[10] | SIEGE_BOSS_BIT[30];
    if (this.phase === 'siege' && input.wave === SIEGE_FINAL_WAVE && (this.siegeBossesDefeated & required) === required) {
      this.phase = 'victory';
      return 'victory';
    }
    return 'wave-cleared';
  }

  choose(action: 'finish' | 'continue', rewardsResolved: boolean): boolean {
    if (this.phase !== 'victory' || !rewardsResolved) return false;
    if (action === 'finish') { this.phase = 'terminal'; this.terminalOutcome = 'victory'; }
    else this.phase = 'endless';
    return true;
  }

  fail(outcome: 'defeat' | 'siege-failed'): boolean {
    if (this.phase === 'terminal' || this.highestWave === 0) return false;
    this.phase = 'terminal';
    this.terminalOutcome = outcome;
    this.activeWave = null;
    return true;
  }

  progress(): ResultProgress {
    if (this.phase !== 'terminal' || !this.terminalOutcome) throw new Error('Siege has no terminal result yet');
    return {
      highestWave: this.highestWave,
      wavesCompleted: this.wavesCompleted,
      outcome: this.terminalOutcome,
      siegeBossesDefeated: this.siegeBossesDefeated,
    };
  }

  /** Debug fixtures only. */
  seedForQA(wavesCompleted: number, mask: number, phase?: 'siege' | 'victory' | 'endless'): void {
    this.wavesCompleted = wavesCompleted;
    this.highestWave = wavesCompleted;
    this.siegeBossesDefeated = mask;
    this.phase = phase ?? (wavesCompleted >= SIEGE_FINAL_WAVE ? 'endless' : 'siege');
    this.activeWave = null;
    this.terminalOutcome = null;
  }
}

export function victoryRewardChoices(inventoryCount: number): readonly ('store' | 'replace-oldest' | 'discard-new')[] {
  return inventoryCount >= POWERUP_INVENTORY_LIMIT ? ['replace-oldest', 'discard-new'] : ['store', 'discard-new'];
}

export function victoryRewardsResolved(vault: RelicVault, rewardModalOpen: boolean, retainPending = false): boolean {
  return (retainPending || vault.pending.length === 0) && vault.target === null && !rewardModalOpen;
}
