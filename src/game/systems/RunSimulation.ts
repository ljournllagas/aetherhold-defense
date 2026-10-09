import type { PowerUpId } from '../../shared/types.ts';
import { POWERUPS } from '../config/powerUps.ts';
import { rewardDisposition } from './RewardSystem.ts';
import { stepProjectile, type TimedProjectile } from './ProjectileSystem.ts';

export interface PendingRelic { id: PowerUpId; reason: string; reveal: boolean; }
export interface RelicSelection { source: 'stored' | 'pending'; index: number; id: PowerUpId; revision: number; }
type UseResult = { kind: 'apply' | 'target' | 'unusable'; id: PowerUpId } | { kind: 'empty' };

/** Targeting never frees a slot until the cast commits. Queued rewards never expire. */
export class RelicVault {
  revision = 0;
  stored: PowerUpId[] = [];
  pending: PendingRelic[] = [];
  target: { id: PowerUpId; source: 'stored' | 'pending'; index: number } | null = null;

  offer(id: PowerUpId, reason: string, reveal: boolean): boolean {
    if (!reveal && !this.target && rewardDisposition(this.stored.length, this.pending.length).kind === 'store') {
      this.stored.push(id);
      this.revision++;
      return true;
    }
    this.pending.push({ id, reason, reveal });
    this.revision++;
    return false;
  }

  beginUse(index: number, hasTower: boolean): UseResult { return this.use('stored', index, hasTower); }
  beginPendingUse(hasTower: boolean): UseResult { return this.use('pending', 0, hasTower); }

  beginSelectedUse(selection: RelicSelection, hasTower: boolean): UseResult {
    const { source, index, id, revision } = selection;
    if (this.target || revision !== this.revision || !Number.isSafeInteger(index) || index < 0) return { kind: 'empty' };
    const current = source === 'stored' ? this.stored[index] : source === 'pending' ? this.pending[index]?.id : undefined;
    if (current !== id) return { kind: 'empty' };
    return this.use(source, index, hasTower);
  }

  private use(source: 'stored' | 'pending', index: number, hasTower: boolean): UseResult {
    if (this.target) return { kind: 'empty' };
    const id = source === 'stored' ? this.stored[index] : this.pending[index]?.id;
    if (!id) return { kind: 'empty' };
    if (id === 'tower_overcharge' && !hasTower) return { kind: 'unusable', id };
    if (POWERUPS[id].requiresTarget) {
      this.target = { id, source, index };
      this.revision++;
      return { kind: 'target', id };
    }
    if (source === 'stored') this.stored.splice(index, 1); else this.pending.splice(index, 1);
    this.revision++;
    return { kind: 'apply', id };
  }

  commitTarget(): PowerUpId | null {
    const target = this.target;
    if (!target) return null;
    if (target.source === 'stored') this.stored.splice(target.index, 1); else this.pending.splice(target.index, 1);
    this.target = null;
    this.revision++;
    return target.id;
  }

  cancelTarget(): void { if (this.target) { this.target = null; this.revision++; } }

  resolve(choice: 'store' | 'replace-oldest' | 'discard-new'): boolean {
    if (this.target || !this.pending.length) return false;
    if (choice === 'store' && rewardDisposition(this.stored.length, 0).kind !== 'store') return false;
    const reward = this.pending.shift()!;
    if (choice === 'replace-oldest') this.stored.shift();
    if (choice !== 'discard-new') this.stored.push(reward.id);
    this.revision++;
    return true;
  }
}

/** A scene supplies game time (zero while paused, scaled while sped up). */
export function advanceFlights<T extends TimedProjectile>(flights: T[], gameDeltaMs: number, ended: boolean): T[] {
  if (ended) { flights.length = 0; return []; }
  const impacts: T[] = [];
  for (let i = flights.length - 1; i >= 0; i--) {
    if (stepProjectile(flights[i], gameDeltaMs)) impacts.unshift(...flights.splice(i, 1));
  }
  return impacts;
}
