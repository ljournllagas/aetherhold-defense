import { getCampaignEnemy } from './enemies.ts';
import { CAMPAIGN_MILESTONES, getCampaignLevel, getCampaignWorld } from './config.ts';
import { isLevelUnlocked } from './progress.ts';
import type { CampaignClearResult, CampaignLevelProgress, CampaignView, CampaignWorldId } from './types.ts';

export const CAMPAIGN_MILESTONE_LABELS: Readonly<Record<number, string>> = {
  10: 'Aether Codex tactics', 20: 'Preparation presets', 30: 'Tower specializations',
  45: 'Power-up reroll', 60: 'Runic Masterwork towers', 75: 'Veteran banner and advanced stats', 90: 'Frostveil Conqueror crest'
};

/** Two short, complete lines for the narrow campaign header. */
export function campaignHeaderBadgeLines(totalMasteryStars: number, sigilCount: number, tier: string): readonly [string, string] {
  return [
    `MASTERY ${totalMasteryStars}/90 · SIGILS ${sigilCount}/3`,
    `TOWER TIER ${tier}`
  ];
}

/** Explicit separators keep a wrapped roster readable at every viewport width. */
export function campaignEnemyPreviewText(names: readonly string[]): string {
  return names.join('   ·   ');
}

const BOSS_GUIDANCE: Readonly<Record<string, string>> = {
  hollow_warden: 'Break through its temporary ward. Watch for Marchling summons and a late speed surge.',
  cinder_colossus: 'Its basalt armor breaks in stages. The exposed core is more vulnerable and moves faster.',
  frostbound_matriarch: 'Resists slows. Freeze casts are telegraphed and can briefly lock one or two towers.'
};

export interface CampaignLevelDetail {
  level: number;
  worldId: CampaignWorldId;
  worldName: string;
  layoutId: string;
  difficulty: number;
  locked: boolean;
  canStart: boolean;
  completed: boolean;
  stars: number;
  progress: CampaignLevelProgress;
  bestScore: number | null;
  bestLives: number | null;
  enemyIds: readonly string[];
  enemies: readonly { id: string; name: string; role: string }[];
  boss: { id: string; name: string; guidance: string } | null;
  objectives: readonly { label: string; earned: boolean }[];
}

/** Compact metadata preserves the level facts without forcing a long line into a short panel. */
export function campaignCompactDetailMeta(detail: CampaignLevelDetail): string {
  const worldName = detail.worldName.replace(/^The\s+/i, '');
  const layoutLabel = detail.layoutId.split('_').pop()?.toUpperCase() ?? detail.layoutId;
  const best = detail.bestScore === null
    ? 'Best —'
    : `Best ${detail.bestScore.toLocaleString('en-US')} · ${detail.bestLives ?? 0} lives`;
  return `${worldName} · ${layoutLabel} · D${detail.difficulty}/5 · ${detail.stars}/3 stars · ${best}`;
}

/** Pure view model shared by the campaign node and its selected-level detail. */
export function campaignLevelDetail(level: number, view: CampaignView): CampaignLevelDetail | null {
  const definition = getCampaignLevel(level);
  if (!definition) return null;
  const progress = view.profile.levels[level] ?? {
    completed: false, completionStar: false, livesStar: false, scoreStar: false, bestScore: 0, bestRemainingLives: 0
  };
  const boss = definition.bossEnemyId ? getCampaignEnemy(definition.bossEnemyId) : null;
  return {
    level,
    worldId: definition.worldId,
    worldName: getCampaignWorld(definition.worldId).name,
    layoutId: definition.mapLayoutId,
    difficulty: definition.difficultyRating,
    locked: !isLevelUnlocked(level, view),
    canStart: isLevelUnlocked(level, view),
    completed: progress.completed,
    stars: Number(progress.completionStar) + Number(progress.livesStar) + Number(progress.scoreStar),
    progress,
    bestScore: progress.bestScore > 0 ? progress.bestScore : null,
    bestLives: progress.bestRemainingLives > 0 ? progress.bestRemainingLives : null,
    enemyIds: [...definition.enemyIds, ...(definition.bossEnemyId ? [definition.bossEnemyId] : [])],
    enemies: definition.enemyIds.map(id => {
      const enemy = getCampaignEnemy(id);
      return { id, name: enemy.name, role: enemy.isElite ? 'Support' : enemy.baseSpeed >= 120 ? 'Runner' : enemy.physicalArmor > 0 ? 'Armored' : enemy.baseHp >= 250 ? 'Brute' : 'Basic' };
    }),
    boss: boss ? { id: boss.id, name: boss.name, guidance: BOSS_GUIDANCE[boss.id] ?? 'Study its phases and protect the stronghold.' } : null,
    objectives: [
      { label: 'Complete the level', earned: progress.completionStar },
      { label: `Finish with ${definition.mastery.minimumLivesForStar} or more lives`, earned: progress.livesStar },
      { label: `Reach ${definition.mastery.scoreTarget.toLocaleString('en-US')} points`, earned: progress.scoreStar }
    ]
  };
}

export function campaignMilestones(view: CampaignView): readonly { stars: number; label: string; earned: boolean }[] {
  return CAMPAIGN_MILESTONES.map(milestone => ({
    stars: milestone.stars,
    label: CAMPAIGN_MILESTONE_LABELS[milestone.stars],
    earned: view.totalMasteryStars >= milestone.stars
  }));
}

export interface CampaignClearStatus {
  saved: boolean;
  message: string;
  compactMessage: string;
  warning: string | null;
  tone: 'success' | 'warning';
}

/** Copy for the result banner; unsaved clears must never be described as saved. */
export function campaignClearStatus(result: CampaignClearResult): CampaignClearStatus {
  const earned = result.newlyEarnedStars.length;
  if (result.saved) {
    const message = earned
      ? `Clear saved · ${earned} new mastery ${earned === 1 ? 'star' : 'stars'}`
      : 'Clear saved · best progress retained';
    return { saved: true, message, compactMessage: message, warning: null, tone: 'success' };
  }

  const warning = result.warning ?? 'Campaign progress could not be saved. Progress earned now is kept for this session only.';
  const warningHint = /unavailable/i.test(warning) ? 'storage unavailable'
    : /newer/i.test(warning) ? 'newer save protected'
    : /could not be read|unreadable/i.test(warning) ? 'saved data unreadable'
    : 'progress not saved';
  const message = 'Clear earned · session only';
  return { saved: false, message, compactMessage: `${message} · ${warningHint}`, warning, tone: 'warning' };
}

/** Short-screen warning copy preserves the persistence state without crowding the battle button. */
export function campaignWarningCompactMessage(warning: string): string {
  if (/unavailable/i.test(warning)) return 'Storage unavailable · session-only progress';
  if (/newer/i.test(warning)) return 'Newer save protected · session-only progress';
  if (/could not be read|unreadable/i.test(warning)) return 'Saved data unreadable · session-only progress';
  return 'Campaign progress not saved · session only';
}
