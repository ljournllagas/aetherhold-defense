import { ENEMIES } from '../config/enemies.ts';
import { ALTERNATIVE_BRANCH, EVOLUTIONS, STARTER_BRANCH } from '../config/evolutions.ts';
import { TOWERS, TOWER_IDS } from '../config/towers.ts';
import { PURCHASE_REASON_TEXT, effectiveStats, nextPurchaseCost, previewPurchaseStats, purchaseEvolution } from '../systems/EvolutionSystem.ts';
import type { PurchaseContext, PurchaseIntent } from '../systems/EvolutionSystem.ts';
import type { UnlockView } from '../systems/UnlockSystem.ts';
import type { BranchId, CombatTower, EffectiveTowerStats, TowerId } from '../../shared/progression.ts';

export interface ProgressionAction { label: string; reason: string | null; intent: PurchaseIntent; revision: number; nextStats: EffectiveTowerStats | null; }
export interface BranchOption { id: BranchId; name: string; description: string; stats: EffectiveTowerStats; starter: boolean; locked: boolean; requirement: string | null; qualifiesNow: boolean; }
export interface TowerProgressionView { title: string; role: string; stats: EffectiveTowerStats; commitment: string | null; actions: ProgressionAction[]; branches: BranchOption[]; }
export interface AchievementView { towerId: TowerId; branchId: BranchId; starterName: string; alternativeName: string; requirement: string; earned: boolean; unsaved: boolean; qualifiesNow: boolean; }

export function achievementRequirement(towerId: TowerId): string {
  return `Keep a ${EVOLUTIONS[STARTER_BRANCH[towerId]].name} tower at evolution rank 2 or higher when wave 20 is completed.`;
}

function qualifies(towerId: TowerId, towers: readonly CombatTower[], waveCompleted: number): boolean {
  return waveCompleted < 20 && towers.some((t) => t.towerId === towerId && t.progression.branchId === STARTER_BRANCH[towerId] && (t.progression.rank ?? 0) >= 2);
}

export function towerProgressionView(tower: CombatTower, context: PurchaseContext, waveCompleted = 0, towers: readonly CombatTower[] = [tower]): TowerProgressionView {
  const p = tower.progression, id = tower.towerId;
  const evolved = p.branchId !== null && p.rank !== null;
  const intents: PurchaseIntent[] = [];
  if (!evolved) {
    if (p.foundationLevel < 4) intents.push({ kind: 'foundation-upgrade' });
    intents.push({ kind: 'evolve', branchId: STARTER_BRANCH[id] }, { kind: 'evolve', branchId: ALTERNATIVE_BRANCH[id] });
  } else if ((p.rank ?? 0) < 3) intents.push({ kind: 'evolution-rank' });
  else intents.push({ kind: 'mastery' });

  const actions: ProgressionAction[] = intents.map((intent) => {
    const cost = nextPurchaseCost(id, p, intent);
    let label: string;
    switch (intent.kind) {
      case 'foundation-upgrade': label = `Upgrade to level ${p.foundationLevel + 1} · ${cost} gold`; break;
      case 'evolve': label = `Evolve: ${EVOLUTIONS[intent.branchId].name} · ${cost} gold`; break;
      case 'evolution-rank': label = `${EVOLUTIONS[p.branchId as BranchId].name} rank ${(p.rank ?? 0) + 1} · ${cost} gold`; break;
      default: label = `Mastery ${p.masteryRank + 1} · ${cost === null ? 'limit' : `${cost} gold`}`;
    }
    const result = purchaseEvolution(id, p, intent, context, p.revision);
    return { label, reason: result.ok ? null : PURCHASE_REASON_TEXT[result.reason], intent, revision: p.revision, nextStats: previewPurchaseStats(id, p, intent) };
  });

  let title: string, role: string;
  if (evolved) {
    const def = EVOLUTIONS[p.branchId as BranchId];
    title = `${def.name} · Rank ${p.rank}${p.masteryRank > 0 ? ` · Mastery ${p.masteryRank}` : ''}`;
    role = def.description;
  } else {
    const readiness = context.evolutionOpen ? 'Ready to evolve' : 'Defeat the wave-10 boss to evolve';
    title = `${TOWERS[id].name} · Level ${p.foundationLevel}${p.foundationLevel === 4 ? ` · ${readiness}` : ''}`;
    role = TOWERS[id].description;
  }

  const branches: BranchOption[] = (evolved ? [] : [STARTER_BRANCH[id], ALTERNATIVE_BRANCH[id]]).map((bid) => {
    const def = EVOLUTIONS[bid];
    const locked = !def.starter && !context.unlocked.has(bid);
    return {
      id: bid, name: def.name, description: def.description, stats: def.stats[0], starter: def.starter, locked,
      requirement: def.starter ? null : achievementRequirement(id), qualifiesNow: !def.starter && qualifies(id, towers, waveCompleted)
    };
  });

  return {
    title, role, stats: effectiveStats(id, p), actions, branches,
    commitment: intents.some((i) => i.kind === 'evolve') ? 'Branch choice is permanent for this tower.' : null
  };
}

export function achievementViews(view: UnlockView, towers: readonly CombatTower[], waveCompleted: number): AchievementView[] {
  return TOWER_IDS.map((towerId) => {
    const branchId = ALTERNATIVE_BRANCH[towerId];
    return {
      towerId, branchId, starterName: EVOLUTIONS[STARTER_BRANCH[towerId]].name, alternativeName: EVOLUTIONS[branchId].name,
      requirement: achievementRequirement(towerId), earned: view.profile.earned[branchId] !== undefined,
      unsaved: view.unsaved.has(branchId), qualifiesNow: qualifies(towerId, towers, waveCompleted)
    };
  });
}

export function wavePresentation(wave: number, endless: boolean): { label: string; warning: string } {
  const label = endless ? `Wave ${wave} · Endless` : wave === 30 ? 'Siege finale · Wave 30' : `Wave ${wave} of 30`;
  return { label, warning: wave % 10 === 0 ? `${ENEMIES.warlord.name} approaches · ${label}` : label };
}

export type StatKind = 'damage' | 'range' | 'attackInterval' | 'splashRadius';

export function formatStat(kind: StatKind, value: number): string {
  return kind === 'attackInterval' ? value.toFixed(2) : String(Math.round(value));
}
