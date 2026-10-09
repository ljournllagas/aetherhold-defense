import { describe, expect, it } from 'vitest';
import {
  campaignClearStatus, campaignCompactDetailMeta, campaignEnemyPreviewText,
  campaignHeaderBadgeLines, campaignLevelDetail, campaignWarningCompactMessage
} from '../src/game/campaign/presentation.ts';
import { CAMPAIGN_UNAVAILABLE_WARNING, CampaignRepository } from '../src/game/campaign/progress.ts';
import { getCampaignEnemy } from '../src/game/campaign/enemies.ts';
import { campaignDetailContentLayout, campaignScreenLayout } from '../src/game/campaign/mapLayout.ts';
import type { CampaignClearResult } from '../src/game/campaign/types.ts';

describe('campaign presentation detail', () => {
  it('keeps the narrow mastery header complete in two short semantic lines', () => {
    expect(campaignHeaderBadgeLines(27, 2, 'III · RUNIC')).toEqual([
      'MASTERY 27/90 · SIGILS 2/3',
      'TOWER TIER III · RUNIC'
    ]);
  });

  it('separates every roster name, including the boss, for wrapped previews', () => {
    const repository = new CampaignRepository(null);
    for (let level = 1; level < 10; level++) repository.recordClear(level, 100_000, 20);
    const detail = campaignLevelDetail(10, repository.view())!;
    const names = detail.enemyIds.map(id => getCampaignEnemy(id).name);
    const preview = campaignEnemyPreviewText(names);

    expect(preview.split('   ·   ')).toEqual(names);
    expect(names).toContain(detail.boss!.name);
    expect(preview).toContain('   ·   ');
  });

  it('uses compact mobile metadata while retaining best score and lives', () => {
    const repository = new CampaignRepository(null);
    repository.recordClear(1, 49_150, 12);
    const detail = campaignLevelDetail(1, repository.view())!;
    const meta = campaignCompactDetailMeta(detail);

    expect(meta).toContain('Borderkeep · A · D1/5 · 3/3 stars');
    expect(meta).toContain('Best 49,150 · 12 lives');
  });

  it('keeps completed-level best lives above the mastery row at 360x640', () => {
    const repository = new CampaignRepository(null);
    for (let level = 1; level < 6; level++) repository.recordClear(level, 100_000, 20);
    repository.recordClear(6, 48_000, 20);
    const detail = campaignLevelDetail(6, repository.view())!;
    const meta = campaignCompactDetailMeta(detail);
    const screen = campaignScreenLayout(360, 640);
    const metadataHeight = 28; // The 12px metadata wraps to two lines in the reported viewport.
    const rows = campaignDetailContentLayout(screen.detailHeight, false, false, metadataHeight, 14);

    expect(meta).toBe('Borderkeep · B3 · D3/5 · 3/3 stars · Best 48,000 · 20 lives');
    expect(32 + metadataHeight + 4).toBeLessThanOrEqual(rows.goalsY);
    expect(rows.goalsY + 14).toBeLessThanOrEqual(rows.enemyCenterY - 12);
    expect(rows.enemyNamesY + 14).toBeLessThanOrEqual(rows.buttonY);
  });

  it('shows an unlocked normal level with its best result and mastery objectives', () => {
    const repository = new CampaignRepository(null);
    repository.recordClear(1, 100_000, 20);
    const detail = campaignLevelDetail(1, repository.view());

    expect(detail).not.toBeNull();
    expect(detail).toMatchObject({
      level: 1, locked: false, canStart: true, completed: true, stars: 3,
      bestScore: 100_000, bestLives: 20, boss: null
    });
    expect(detail!.enemies.length).toBeGreaterThan(0);
    expect(detail!.objectives.every(objective => objective.earned)).toBe(true);
  });

  it('marks a future level as locked and withholds its best-result values', () => {
    const detail = campaignLevelDetail(2, new CampaignRepository(null).view());

    expect(detail).toMatchObject({ locked: true, canStart: false, completed: false, stars: 0, bestScore: null, bestLives: null });
    expect(detail!.objectives.every(objective => !objective.earned)).toBe(true);
  });

  it('includes a named boss and phase guidance on its campaign node', () => {
    const repository = new CampaignRepository(null);
    for (let level = 1; level < 10; level++) repository.recordClear(level, 100_000, 20);

    const detail = campaignLevelDetail(10, repository.view());
    expect(detail).toMatchObject({ level: 10, canStart: true, boss: { id: 'hollow_warden', name: expect.any(String), guidance: expect.stringContaining('ward') } });
    expect(detail!.enemyIds).toContain('hollow_warden');
  });

  it('distinguishes a persisted clear from an earned session-only clear in result copy', () => {
    const result: CampaignClearResult = {
      level: 1,
      progress: { completed: true, completionStar: true, livesStar: false, scoreStar: false, bestScore: 20_000, bestRemainingLives: 12 },
      newlyEarnedStars: ['completion'], newlyEarnedSigils: [], newlyUnlockedFeatures: [],
      totalMasteryStars: 1, saved: false, warning: CAMPAIGN_UNAVAILABLE_WARNING
    };
    const sessionOnly = campaignClearStatus(result);
    const saved = campaignClearStatus({ ...result, saved: true, warning: null });

    expect(sessionOnly).toMatchObject({
      saved: false, message: 'Clear earned · session only',
      compactMessage: expect.stringContaining('storage unavailable'),
      warning: CAMPAIGN_UNAVAILABLE_WARNING, tone: 'warning'
    });
    expect(sessionOnly.compactMessage).not.toContain('Clear saved');
    expect(saved).toMatchObject({ saved: true, message: expect.stringContaining('Clear saved'), tone: 'success', warning: null });
    expect(campaignWarningCompactMessage(CAMPAIGN_UNAVAILABLE_WARNING)).toContain('session-only');
  });
});
