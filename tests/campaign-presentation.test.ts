import { describe, expect, it } from 'vitest';
import {
  campaignClearStatus, campaignCompactDetailMeta, campaignEnemyPreviewText,
  campaignHeaderBadgeLines, campaignLevelDetail, campaignWarningCompactMessage, CAMPAIGN_PHASE_CUE_GUIDANCE
} from '../src/game/campaign/presentation.ts';
import { CAMPAIGN_BOSS_PHASE_LABELS } from '../src/game/campaign/bosses.ts';
import { CAMPAIGN_UNAVAILABLE_WARNING, CampaignRepository, parseCampaignProfile } from '../src/game/campaign/progress.ts';
import { getCampaignEnemy } from '../src/game/campaign/enemies.ts';
import { campaignDetailContentLayout, campaignScreenLayout } from '../src/game/campaign/mapLayout.ts';
import type { CampaignClearResult } from '../src/game/campaign/types.ts';
import { campaignScoreMetadata } from '../src/shared/campaignScoring.ts';
import { formatCount } from '../src/shared/displayNumbers.ts';
import legacyLocalCompleted30 from './fixtures/campaign-v5/legacy_local_completed_30.json';

describe('campaign presentation detail', () => {
  it('keeps the narrow mastery header complete in two short semantic lines', () => {
    expect(campaignHeaderBadgeLines(27, 2, 'III · RUNIC')).toEqual([
      'MASTERY 27/300 · SIGILS 2/10',
      'TOWER TIER III · RUNIC'
    ]);
  });

  it('separates every roster name, including the boss, for wrapped previews', () => {
    const repository = new CampaignRepository(null);
    for (let level = 1; level < 10; level++) repository.recordClear(level, campaignScoreMetadata(level).perfectScore, 20);
    const detail = campaignLevelDetail(10, repository.view())!;
    const names = detail.enemyIds.map(id => getCampaignEnemy(id).name);
    const preview = campaignEnemyPreviewText(names);

    expect(preview.split('   ·   ')).toEqual(names);
    expect(names).toContain(detail.boss!.name);
    expect(preview).toContain('   ·   ');
  });

  it('uses compact mobile metadata while retaining best score and lives', () => {
    const repository = new CampaignRepository(null);
    repository.recordClear(1, campaignScoreMetadata(1).perfectScore, 12);
    const detail = campaignLevelDetail(1, repository.view())!;
    const meta = campaignCompactDetailMeta(detail);

    expect(meta).toContain('Borderkeep · A · D1/5 · 3/3 stars');
    expect(meta).toContain(`Best score ${formatCount(campaignScoreMetadata(1).perfectScore)} · Best lives 12`);
  });

  it('keeps completed-level best lives above the mastery row at 360x640', () => {
    const repository = new CampaignRepository(null);
    for (let level = 1; level < 6; level++) repository.recordClear(level, campaignScoreMetadata(level).perfectScore, 20);
    repository.recordClear(6, campaignScoreMetadata(6).perfectScore, 20);
    const detail = campaignLevelDetail(6, repository.view())!;
    const meta = campaignCompactDetailMeta(detail);
    const screen = campaignScreenLayout(360, 640);
    const metadataHeight = 28; // The 12px metadata wraps to two lines in the reported viewport.
    const rows = campaignDetailContentLayout(screen.detailHeight, false, false, metadataHeight, 14);

    expect(meta).toBe(`Borderkeep · B3 · D3/5 · 3/3 stars · Best score ${formatCount(campaignScoreMetadata(6).perfectScore)} · Best lives 20`);
    expect(32 + metadataHeight + 4).toBeLessThanOrEqual(rows.goalsY);
    expect(rows.goalsY + 14).toBeLessThanOrEqual(rows.enemyCenterY - 12);
    expect(rows.enemyNamesY + 14).toBeLessThanOrEqual(rows.buttonY);
  });

  it('shows an unlocked normal level with its best result and mastery objectives', () => {
    const repository = new CampaignRepository(null);
    repository.recordClear(1, campaignScoreMetadata(1).perfectScore, 20);
    const detail = campaignLevelDetail(1, repository.view());

    expect(detail).not.toBeNull();
    expect(detail).toMatchObject({
      level: 1, locked: false, canStart: true, completed: true, stars: 3,
      bestScore: campaignScoreMetadata(1).perfectScore, legacyBestScore: null,
      scoreTarget: campaignScoreMetadata(1).scoreTarget, bestLives: 20, boss: null
    });
    expect(detail!.enemies.length).toBeGreaterThan(0);
    expect(detail!.objectives.every(objective => objective.earned)).toBe(true);
  });

  it('marks a future level as locked and withholds its best-result values', () => {
    const detail = campaignLevelDetail(2, new CampaignRepository(null).view());

    expect(detail).toMatchObject({ locked: true, canStart: false, completed: false, stars: 0, bestScore: null, legacyBestScore: null, bestLives: null, scoreTarget: campaignScoreMetadata(2).scoreTarget });
    expect(detail!.objectives.every(objective => !objective.earned)).toBe(true);
  });

  it('exposes legacy and current mission bests separately', () => {
    const repository = new CampaignRepository(null), definition = campaignScoreMetadata(1);
    repository.applyCloud({1:{completed:true,completionStar:true,livesStar:false,scoreStar:true,bestScore:3_000,bestRemainingLives:12,campaignScore:{version:1,bestScore:definition.scoreTarget}}});
    expect(campaignLevelDetail(1, repository.view())).toMatchObject({bestScore:definition.scoreTarget,legacyBestScore:3_000,scoreTarget:definition.scoreTarget});
  });

  it('keeps a legacy-only score star while exposing the current target and no current best', () => {
    const profile = parseCampaignProfile(legacyLocalCompleted30)!;
    let raw = JSON.stringify(profile);
    const repository = new CampaignRepository({ getItem: () => raw, setItem: (_key, value) => { raw = value; } });
    const detail = campaignLevelDetail(1, repository.view())!;

    expect(detail.bestScore).toBeNull();
    expect(detail.legacyBestScore).toBe(profile.levels[1]!.bestScore);
    expect(detail.scoreTarget).toBe(campaignScoreMetadata(1).scoreTarget);
    expect(detail.progress.scoreStar).toBe(true);
    expect(detail.objectives[2]).toEqual({ label: `Reach ${formatCount(campaignScoreMetadata(1).scoreTarget)} points`, earned: true });
  });

  it('includes a named boss and phase guidance on its campaign node', () => {
    const repository = new CampaignRepository(null);
    for (let level = 1; level < 10; level++) repository.recordClear(level, campaignScoreMetadata(level).perfectScore, 20);

    const detail = campaignLevelDetail(10, repository.view());
    expect(detail).toMatchObject({ level: 10, canStart: true, boss: { id: 'hollow_warden', name: expect.any(String), guidance: expect.stringContaining('ward') } });
    expect(detail!.enemyIds).toContain('hollow_warden');
  });

  it('provides boss guidance for the World 4 golden slice and every registered boss', () => {
    const detail = campaignLevelDetail(40, new CampaignRepository(null).view());
    expect(detail?.boss).toMatchObject({ id: 'mireheart_hydra', guidance: expect.stringContaining('Bogling brood') });

    const guidance = Array.from({ length: 10 }, (_, index) => campaignLevelDetail((index + 1) * 10, new CampaignRepository(null).view())?.boss?.guidance);
    expect(guidance).toHaveLength(10);
    expect(guidance.every(text => typeof text === 'string' && text.length > 20)).toBe(true);
    expect(guidance[9]).toContain('Normal, Resistance, Rift, and Exposed Core');
  });

  it('documents the visible cue for every canonical boss and support phase label', () => {
    expect(Object.keys(CAMPAIGN_PHASE_CUE_GUIDANCE).sort()).toEqual([...CAMPAIGN_BOSS_PHASE_LABELS].sort());
    for (const description of Object.values(CAMPAIGN_PHASE_CUE_GUIDANCE)) expect(description.length).toBeGreaterThan(20);
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
