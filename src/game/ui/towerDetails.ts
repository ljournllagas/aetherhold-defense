import { TOWERS, towerTotalInvested } from '../config/towers.ts';
import { formatCount, formatQuantity } from '../../shared/displayNumbers.ts';
import type { TowerId } from '../../shared/progression.ts';

export interface TowerBuildDetail {
  id: TowerId;
  name: string;
  role: string;
  description: string;
  damage: string;
  range: string;
  attack: string;
  damageType: string;
  splash: string | null;
  chain: string | null;
  slow: string | null;
  cost: number;
  totalToMax: number;
}

function formatDamage(value: number): string {
  return formatQuantity(value, 1);
}

function formatRange(value: number): string {
  return formatQuantity(value, 1);
}

function formatAttack(seconds: number): string {
  return `${formatQuantity(seconds, 2)}s`;
}

/** Slow renders with its duration so Glacier reads as `35% for 1.6s`, not `35%` alone. */
export function formatSlowDetail(slowFactor: number, slowDuration?: number): string {
  const percent = `${Math.round(slowFactor * 100)}%`;
  return slowDuration !== undefined ? `${percent} for ${formatQuantity(slowDuration, 1)}s` : percent;
}

/**
 * Shared build-preview model: Level 1 stats plus a one-line upgrade hint.
 * Single renderer for the tray strip, the Build-sheet detail area and the
 * placed-tower inspector (placed mode adds Upgrade/Sell/Next on top).
 */
export function towerBuildDetail(towerId: string): TowerBuildDetail | null {
  const cfg = TOWERS[towerId];
  if (!cfg) return null;
  const l1 = cfg.levels[0];
  return {
    id: towerId as TowerId,
    name: cfg.name,
    role: cfg.role,
    description: cfg.description,
    damage: formatDamage(l1.damage),
    range: formatRange(l1.range),
    attack: formatAttack(l1.attackInterval),
    damageType: l1.damageType,
    splash: l1.splashRadius !== undefined ? formatRange(l1.splashRadius) : null,
    chain: l1.chainCount !== undefined ? `${l1.chainCount}` : null,
    slow: l1.slowFactor !== undefined ? formatSlowDetail(l1.slowFactor, l1.slowDuration) : null,
    cost: l1.cost,
    totalToMax: towerTotalInvested(towerId, cfg.levels.length),
  };
}

export function towerDetailStatsLine(detail: TowerBuildDetail): string {
  return `Damage ${detail.damage} · Range ${detail.range} · Attack ${detail.attack}`;
}

export function towerDetailSpecialLine(detail: TowerBuildDetail): string | null {
  const parts: string[] = [];
  if (detail.splash !== null) parts.push(`Splash ${detail.splash}`);
  if (detail.chain !== null) parts.push(`Chain ${detail.chain}`);
  if (detail.slow !== null) parts.push(`Slow ${detail.slow}`);
  parts.push(detail.damageType);
  return parts.length ? parts.join(' · ') : null;
}

export function towerDetailCostLine(detail: TowerBuildDetail, gold: number): { text: string; affordable: boolean } {
  const affordable = gold >= detail.cost;
  const base = `${formatCount(detail.cost)} gold · Total to max ${formatCount(detail.totalToMax)} gold`;
  if (affordable) return { text: base, affordable: true };
  return { text: `${base} · Need ${formatCount(detail.cost - gold)} more`, affordable: false };
}
