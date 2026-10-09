import { EVOLUTION_RULES } from '../config/evolutions.ts';
import { applyArmor } from './CombatSystem.ts';
import { effectiveStats } from './EvolutionSystem.ts';
import type { CombatTower, CombatVictim, EffectiveTowerStats, ShotSnapshot } from '../../shared/progression.ts';
import type { DamageType, TargetingMode } from '../../shared/types.ts';

export interface StatusView { slowFactor: number; frozen: boolean; stunned: boolean; vulnerability: number; }
export interface FieldTick { ownerId: number; x: number; y: number; radius: number; rawDamage: number; atMs: number; }

interface EnemyStatus {
  slows: { factor: number; untilMs: number }[];
  vulnerabilities: { multiplier: number; untilMs: number }[];
  controls: { kind: 'freeze' | 'stun'; untilMs: number }[];
  immuneUntil: number;
}

interface BurningField { ownerId: number; x: number; y: number; radius: number; rawDamage: number; nextTickMs: number; expiresMs: number; }

const CHAIN_FALLOFF = 0.85;
const CHAIN_RANGE = 130;

export class EvolutionCombat {
  private readonly enemies = new Map<number, EnemyStatus>();
  private readonly fields = new Map<number, BurningField>();
  private flushed: FieldTick[] = [];

  makeShot(owner: CombatTower, towers: readonly CombatTower[], damageMultiplier: number, primary = true): ShotSnapshot {
    const stats = effectiveStats(owner.towerId, owner.progression);
    let aura = 1;
    for (const t of towers) {
      if (t.id === owner.id || t.progression.branchId !== 'arcane-beacon' || t.progression.rank === null) continue;
      const beacon = effectiveStats(t.towerId, t.progression);
      if (Math.hypot(t.x - owner.x, t.y - owner.y) <= beacon.auraRange) aura = Math.max(aura, beacon.auraDamageMultiplier);
    }
    return {
      ownerId: owner.id, towerId: owner.towerId, branchId: owner.progression.branchId, stats,
      rawDamage: Math.round(stats.damage * aura * damageMultiplier), primary, counter: owner.counter
    };
  }

  damage(raw: number, type: DamageType, target: CombatVictim, nowMs: number, shot?: ShotSnapshot): number {
    if (!target.alive) return 0;
    const bossMul = shot && target.isBoss ? shot.stats.bossDamageMultiplier : 1;
    const armored = applyArmor(
      raw * bossMul, type,
      target.physicalArmor * (shot?.stats.physicalArmorScale ?? 1),
      target.wardArmor * (shot?.stats.wardArmorScale ?? 1)
    );
    return Math.round(armored * this.statuses(target.id, nowMs).vulnerability);
  }

  primaryHit(shot: ShotSnapshot, target: CombatVictim, nowMs: number, killed = false): void {
    if (!shot.primary) return;
    if (!target.alive && !killed) return;
    shot.counter.successes++;
    if (killed || !target.alive) return;
    const stats = shot.stats;
    const status = this.enemyStatus(target.id);
    if (stats.slowFactor) status.slows.push({ factor: stats.slowFactor, untilMs: nowMs + (stats.slowDuration ?? 0) * 1000 });
    if (stats.vulnerabilityMultiplier > 1) status.vulnerabilities.push({ multiplier: stats.vulnerabilityMultiplier, untilMs: nowMs + stats.vulnerabilityMs });
    if (stats.control && shot.counter.successes % EVOLUTION_RULES.controlCadence === 0) {
      if (status.immuneUntil > nowMs) return;
      status.controls.push({ kind: stats.control, untilMs: nowMs + (target.isBoss ? stats.bossControlMs : stats.controlMs) });
      status.immuneUntil = nowMs + EVOLUTION_RULES.controlImmunityMs;
    }
  }

  statuses(enemyId: number, nowMs: number): StatusView {
    const status = this.enemies.get(enemyId);
    if (!status) return { slowFactor: 0, frozen: false, stunned: false, vulnerability: 1 };
    status.slows = status.slows.filter((s) => s.untilMs > nowMs);
    status.vulnerabilities = status.vulnerabilities.filter((v) => v.untilMs > nowMs);
    status.controls = status.controls.filter((c) => c.untilMs > nowMs);
    let slowFactor = 0, vulnerability = 1, frozen = false, stunned = false;
    for (const s of status.slows) slowFactor = Math.max(slowFactor, s.factor);
    for (const v of status.vulnerabilities) vulnerability = Math.max(vulnerability, v.multiplier);
    for (const c of status.controls) {
      if (c.kind === 'freeze') frozen = true;
      else stunned = true;
    }
    return { slowFactor, frozen, stunned, vulnerability };
  }

  addField(shot: ShotSnapshot, x: number, y: number, nowMs: number): void {
    if (!shot.stats.burningField) return;
    const old = this.fields.get(shot.ownerId);
    if (old) this.emitDue(old, Math.min(nowMs, old.expiresMs), this.flushed);
    this.fields.set(shot.ownerId, {
      ownerId: shot.ownerId, x, y, radius: shot.stats.splashRadius ?? 0,
      rawDamage: shot.rawDamage * EVOLUTION_RULES.fieldFraction,
      nextTickMs: nowMs + EVOLUTION_RULES.tickMs, expiresMs: nowMs + EVOLUTION_RULES.fieldMs
    });
  }

  tickFields(nowMs: number): FieldTick[] {
    const out = this.flushed;
    this.flushed = [];
    for (const [ownerId, field] of this.fields) {
      this.emitDue(field, Math.min(nowMs, field.expiresMs), out);
      if (field.nextTickMs > field.expiresMs) this.fields.delete(ownerId);
    }
    return out;
  }

  get activeFieldCount(): number {
    return this.fields.size + (this.flushed.length > 0 ? 1 : 0);
  }

  get activeFields(): ReadonlyArray<{ ownerId: number; x: number; y: number; radius: number }> {
    return Array.from(this.fields.values(), (f) => ({ ownerId: f.ownerId, x: f.x, y: f.y, radius: f.radius }));
  }

  removeOwner(ownerId: number): void {
    this.fields.delete(ownerId);
    this.flushed = this.flushed.filter((t) => t.ownerId !== ownerId);
  }

  removeEnemy(enemyId: number): void {
    this.enemies.delete(enemyId);
  }

  clear(): void {
    this.enemies.clear();
    this.fields.clear();
    this.flushed = [];
  }

  private enemyStatus(enemyId: number): EnemyStatus {
    let status = this.enemies.get(enemyId);
    if (!status) {
      status = { slows: [], vulnerabilities: [], controls: [], immuneUntil: -Infinity };
      this.enemies.set(enemyId, status);
    }
    return status;
  }

  private emitDue(field: BurningField, untilMs: number, out: FieldTick[]): void {
    while (field.nextTickMs <= untilMs) {
      out.push({ ownerId: field.ownerId, x: field.x, y: field.y, radius: field.radius, rawDamage: field.rawDamage, atMs: field.nextTickMs });
      field.nextTickMs += EVOLUTION_RULES.tickMs;
    }
  }
}

function sortValue(target: CombatVictim, tower: CombatTower, mode: TargetingMode): number {
  switch (mode) {
    case 'first': return -target.distanceTraveled;
    case 'last': return target.distanceTraveled;
    case 'strongest': return -target.hp;
    case 'weakest': return target.hp;
    case 'closest': return Math.hypot(target.x - tower.x, target.y - tower.y);
  }
}

export function volleyTargets(candidates: readonly CombatVictim[], tower: CombatTower, stats: EffectiveTowerStats, mode: TargetingMode): CombatVictim[] {
  return candidates
    .filter((t) => t.alive && Math.hypot(t.x - tower.x, t.y - tower.y) <= stats.range)
    .map((t) => ({ t, key: sortValue(t, tower, mode) }))
    .sort((a, b) => a.key - b.key || a.t.id - b.t.id)
    .slice(0, stats.volleyTargets)
    .map((entry) => entry.t);
}

export function nextChainTarget(candidates: readonly CombatVictim[], point: { x: number; y: number }, visited: ReadonlySet<number>): CombatVictim | null {
  let best: CombatVictim | null = null, bestDistance = Infinity;
  for (const t of candidates) {
    if (!t.alive || visited.has(t.id)) continue;
    const d = Math.hypot(t.x - point.x, t.y - point.y);
    if (d >= CHAIN_RANGE) continue;
    if (d < bestDistance || (d === bestDistance && best !== null && t.id < best.id)) { best = t; bestDistance = d; }
  }
  return best;
}

export function chainShot(previous: ShotSnapshot): ShotSnapshot {
  return { ...previous, rawDamage: previous.rawDamage * CHAIN_FALLOFF, primary: false };
}
