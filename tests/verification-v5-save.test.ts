import { expect, it } from 'vitest';
import legacyLocalCompleted30Raw from './fixtures/campaign-v5/legacy_local_completed_30.json?raw';
import legacyLocalPartial7 from './fixtures/campaign-v5/legacy_local_partial_7.json';
import futureVersionRaw from './fixtures/campaign-v5/future_version_must_not_overwrite.json?raw';
import worker from '../worker/index.ts';
import { emptyCloudProgress } from '../src/shared/cloudProgress.ts';
import { campaignScoreMetadata } from '../src/shared/campaignScoring.ts';
import { getCampaignLevel } from '../src/game/campaign/config.ts';
import {
  CAMPAIGN_NEWER_WARNING,
  CAMPAIGN_STORAGE_KEY,
  CampaignRepository,
  isLevelUnlocked,
  isWorldUnlocked,
  parseCampaignProfile,
  type CampaignStorage
} from '../src/game/campaign/progress.ts';
import { accountDb } from './helpers/accountDb.ts';

class VerificationStore implements CampaignStorage {
  writes = 0;
  constructor(public value: string | null) {}
  getItem = (key: string) => key === CAMPAIGN_STORAGE_KEY ? this.value : null;
  setItem = (key: string, value: string) => {
    expect(key).toBe(CAMPAIGN_STORAGE_KEY);
    this.writes++;
    this.value = value;
  };
}

it('opens the legacy Level 30 save at Level 31 without inventing a clear or rewriting v1 data', () => {
  const store = new VerificationStore(legacyLocalCompleted30Raw);
  const view = new CampaignRepository(store).view();

  expect(view.profile.campaignVersion).toBe(1);
  expect(view.profile.progressionVersion).toBe(1);
  expect(view.profile.levels[30]?.completed).toBe(true);
  expect(view.profile.levels[31]).toBeUndefined();
  expect(view.profile.worldSigils).toEqual(['border_sigil', 'ember_sigil', 'frost_sigil']);
  expect(view.highestUnlockedLevel).toBe(31);
  expect(isLevelUnlocked(31, view)).toBe(true);
  expect(isLevelUnlocked(32, view)).toBe(false);
  expect(isLevelUnlocked(101, view)).toBe(false);
  expect(store.value).toBe(legacyLocalCompleted30Raw);
  expect(store.writes).toBe(0);

  const partial = parseCampaignProfile(legacyLocalPartial7)!;
  expect(partial.levels[31]).toBeUndefined();
  expect(isLevelUnlocked(31, partial)).toBe(false);
  expect(isWorldUnlocked('whisperfen', partial)).toBe(false);
});

it('keeps the exact future-version fixture bytes when a clear is earned in-session', () => {
  const store = new VerificationStore(futureVersionRaw);
  const repository = new CampaignRepository(store);
  const clear = repository.recordClear(1, campaignScoreMetadata(1).perfectScore, 12)!;

  expect(clear.saved).toBe(false);
  expect(clear.progress.completed).toBe(true);
  expect(repository.view().warning).toBe(CAMPAIGN_NEWER_WARNING);
  repository.reconcile();
  expect(store.value).toBe(futureVersionRaw);
  expect(store.writes).toBe(0);
});

it('opens Level 41 only after a valid Level 40 progression clear and awards the Whisperfen Sigil', () => {
  const repository = new CampaignRepository(new VerificationStore(null));
  for (let level = 1; level < 40; level++) {
    const definition = getCampaignLevel(level)!;
    expect(repository.recordClear(level, campaignScoreMetadata(level).perfectScore, definition.mastery.minimumLivesForStar)).not.toBeNull();
  }
  expect(isLevelUnlocked(40, repository.view())).toBe(true);
  expect(isLevelUnlocked(41, repository.view())).toBe(false);

  const finalClear = repository.recordClear(40, campaignScoreMetadata(40).perfectScore, getCampaignLevel(40)!.mastery.minimumLivesForStar);
  expect(finalClear).not.toBeNull();
  expect(isLevelUnlocked(41, repository.view())).toBe(true);
  expect(repository.view().profile.levels[41]).toBeUndefined();
  expect(repository.view().profile.worldSigils).toContain('mire_sigil');
});

it('rejects noncanonical or out-of-range level keys at the Worker boundary without changing D1', async () => {
  const f = await accountDb();
  try {
    const completion = { completed: true, completionStar: true, livesStar: false, scoreStar: false, bestScore: 0, bestRemainingLives: 0 };
    const before = await f.db.prepare('SELECT progress_json,revision FROM players WHERE id=?').bind('a').first();
    for (const key of ['0', '-1', '01', '1.0', '1e0', '101', '__proto__', 'constructor']) {
      const progress = { ...emptyCloudProgress(), levels: Object.fromEntries([[key, completion]]) };
      const response = await worker.fetch(f.request('/api/account/sync', 'a', { progress }), f.env);
      expect(response.status, key).toBe(409);
      expect(await response.json(), key).toMatchObject({ code: 'INCOMPATIBLE_SAVE' });
      expect(await f.db.prepare('SELECT progress_json,revision FROM players WHERE id=?').bind('a').first(), key).toEqual(before);
    }
  } finally {
    await f.dispose();
  }
}, 15000);
