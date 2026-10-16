import { describe, expect, it } from 'vitest';
import { CAMPAIGN_LEVELS, CAMPAIGN_MILESTONES, CAMPAIGN_SIGILS, CAMPAIGN_WORLDS } from '../src/game/campaign/config.ts';
import { CampaignBattle } from '../src/game/campaign/battle.ts';
import { CAMPAIGN_ROUTES, resolveCampaignMap } from '../src/game/campaign/maps.ts';
import { CAMPAIGN_ENEMIES } from '../src/game/campaign/enemies.ts';
import { CampaignRepository } from '../src/game/campaign/progress.ts';
import {
  AVAILABLE_CAMPAIGN_ART_PATHS, CAMPAIGN_ART_MANIFEST, CAMPAIGN_PROVISIONAL_STARTER_PATHS,
  campaignAnimationDefinitions, campaignGameplayAssetsForLevel
} from '../src/game/campaign/artManifest.ts';
import { requiredAssets, requiredAssetsForRequest } from '../src/game/art/assetManifest.ts';
import { TOWER_LIST } from '../src/game/config/towers.ts';
import { BUILD_PLOT_POLICY, longestRoadCoverage, plotRoadClearance } from '../src/game/maps/buildPlotPolicy.ts';
import registryArtContract from './fixtures/campaign-v5/registry-art-contract.json';
import { campaignScoreMetadata } from '../src/shared/campaignScoring.ts';

const LEGACY_WORLD_IDS = ['borderkeep', 'emberfall', 'frostveil'] as const;
const LEGACY_ROUTE_KEYS = LEGACY_WORLD_IDS.flatMap(id => ['a', 'b', 'c', 'd'].map(family => `${id}_${family}`));
const LEGACY_NORMAL_ENEMIES: Record<(typeof LEGACY_WORLD_IDS)[number], readonly string[]> = {
  borderkeep: ['marchling', 'skitter', 'stoneback', 'ironhide', 'veilborn'],
  emberfall: ['cinderling', 'ashrunner', 'magmahide', 'ember_brute', 'ashcaller'],
  frostveil: ['snowstalker', 'icebound', 'frostback', 'glacier_knight', 'frost_shaman']
};
const LEGACY_BOSSES = ['hollow_warden', 'cinder_colossus', 'frostbound_matriarch'] as const;
const TOWER_IDS = ['longbow', 'ember', 'glacier', 'starfire', 'tempest'] as const;
interface RegistryAssetContract {
  id: string;
  category: string;
  path: string;
  width: number;
  height: number;
  baselineSha256: string;
  candidateStatus: string;
  candidateSha256: string | null;
  approved: boolean;
  registration: {
    id: string;
    key: string;
    path: string;
    kind: string;
    width: number;
    height: number;
    frameWidth?: number;
    frameHeight?: number;
    states: Record<string, { row: number; frames: number } | undefined>;
    state: string;
    temporary: string | null;
  };
}

interface LegacyFinalAssetContract {
  path: string;
  baselineSha256: string;
}

interface LivePromotionContract {
  id: string;
  baselineV1Path: string;
  baselineSha256: string;
  candidatePath: string;
  candidateSha256: string;
  promotedPath: string;
  approved: boolean;
  registration: RegistryAssetContract['registration'] & {
    stage: string;
    qualityFlags: string[];
    animations: unknown[];
  };
}

interface RegistryArtContract {
  baselineCommit: string;
  assets: RegistryAssetContract[];
  legacyFinalAssets: LegacyFinalAssetContract[];
  livePromotions: {
    reviewPath: string;
    acceptedForIntegration: boolean;
    assets: LivePromotionContract[];
  };
}

const registryContract = registryArtContract as unknown as RegistryArtContract;
const promotedBaselinePaths = new Set(registryContract.livePromotions.assets.map(asset => asset.baselineV1Path));
const PROVISIONAL_EXPANSION_PATHS = registryContract.assets
  .map(asset => asset.path).filter(path => !promotedBaselinePaths.has(path));

async function sha256(value: string | Uint8Array): Promise<string> {
  const source = typeof value === 'string' ? new TextEncoder().encode(value) : value;
  const bytes = new Uint8Array(source.byteLength);
  bytes.set(source);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes.buffer);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

function unlockedCampaignView() {
  const repository = new CampaignRepository(null);
  for (let level = 1; level <= 100; level++) repository.recordClear(level, campaignScoreMetadata(level).perfectScore, 20);
  return repository.view();
}

function pngDimensions(bytes: Uint8Array): [number, number] {
  expect(Array.from(bytes.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return [view.getUint32(16, false), view.getUint32(20, false)];
}

function webpDimensions(bytes: Uint8Array): [number, number] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  expect(String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3])).toBe('RIFF');
  expect(String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11])).toBe('WEBP');
  const fourcc = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);
  if (fourcc === 'VP8X') {
    const width = (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16)) + 1;
    const height = (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16)) + 1;
    return [width, height];
  }
  if (fourcc === 'VP8 ') {
    return [view.getUint16(26, true) & 0x3fff, view.getUint16(28, true) & 0x3fff];
  }
  // VP8L lossless: packed 14-bit width-1 / height-1 at bytes 21-24.
  const packed = view.getUint32(21, true);
  return [(packed & 0x3fff) + 1, ((packed >> 14) & 0x3fff) + 1];
}

function imageDimensions(bytes: Uint8Array): [number, number] {
  if (bytes[0] === 0x52 && bytes[1] === 0x49) return webpDimensions(bytes);
  return pngDimensions(bytes);
}

describe('v5 campaign registry and route verification', () => {
  it('keeps the original 30-level data, routes, counts and sigils identical to baseline b33ea38', async () => {
    const view = unlockedCampaignView();
    const baselineProjection = {
      worlds: CAMPAIGN_WORLDS.slice(0, 3),
      levels: CAMPAIGN_LEVELS.slice(0, 30),
      milestones: CAMPAIGN_MILESTONES,
      sigils: CAMPAIGN_SIGILS.slice(0, 3),
      routes: Object.fromEntries(LEGACY_ROUTE_KEYS.map(key => [key, CAMPAIGN_ROUTES[key]])),
      waveCounts: CAMPAIGN_LEVELS.slice(0, 30).map(level => new CampaignBattle(level.level, view).waveCount)
    };

    // Snapshot digest generated from the checked-in b33ea38 baseline's public campaign contracts.
    expect(await sha256(JSON.stringify(baselineProjection))).toBe('d9278455ad3d5c9c997362d9278049e7bd7ae993efac3b6018247ccec57dda7a');
  });

  it('registers ten contiguous worlds, all 100 levels, exact boss boundaries and valid wave spawns', () => {
    expect(CAMPAIGN_WORLDS.map(({ id, worldNumber, levelStart, levelEnd, bossLevel }) => [id, worldNumber, levelStart, levelEnd, bossLevel])).toEqual([
      ['borderkeep', 1, 1, 10, 10], ['emberfall', 2, 11, 20, 20], ['frostveil', 3, 21, 30, 30],
      ['whisperfen', 4, 31, 40, 40], ['sunken_aether', 5, 41, 50, 50], ['ironroot', 6, 51, 60, 60],
      ['sky_isles', 7, 61, 70, 70], ['dreadmoon', 8, 71, 80, 80], ['astral_rift', 9, 81, 90, 90],
      ['aether_crown', 10, 91, 100, 100]
    ]);
    expect(CAMPAIGN_LEVELS.map(level => level.level)).toEqual(Array.from({ length: 100 }, (_, index) => index + 1));
    expect(CAMPAIGN_LEVELS.map(level => level.waveProfileId)).toEqual(Array.from({ length: 100 }, (_, index) => `campaign_level_${index + 1}`));
    expect(CAMPAIGN_WORLDS.map(world => world.bossEnemyId)).toEqual([
      'hollow_warden', 'cinder_colossus', 'frostbound_matriarch', 'mireheart_hydra', 'drowned_oracle',
      'iron_tyrant', 'stormmaw_prime', 'umbral_regent', 'rift_sovereign', 'aether_devourer'
    ]);
    const view = unlockedCampaignView();
    expect(CAMPAIGN_LEVELS.slice(40).map(level => new CampaignBattle(level.level, view).waveCount)).toEqual([
      32, 32, 33, 33, 33, 34, 34, 34, 35, 35, 35, 36, 36, 36, 37, 37, 37, 38, 38, 38,
      39, 39, 39, 40, 40, 40, 41, 41, 41, 42, 42, 43, 43, 43, 44, 44, 44, 45, 45, 45,
      46, 46, 46, 47, 47, 47, 48, 48, 48, 49, 49, 49, 50, 50, 50, 51, 51, 51, 52, 52
    ]);

    for (const level of CAMPAIGN_LEVELS) {
      const world = CAMPAIGN_WORLDS.find(candidate => candidate.id === level.worldId)!;
      expect(level.level).toBeGreaterThanOrEqual(world.levelStart);
      expect(level.level).toBeLessThanOrEqual(world.levelEnd);
      expect(level.difficultyRating).toBeGreaterThanOrEqual(1);
      expect(level.difficultyRating).toBeLessThanOrEqual(5);
      expect(level.enemyIds.length).toBeGreaterThan(0);
      for (const id of level.enemyIds) expect(CAMPAIGN_ENEMIES[id]).toBeDefined();
      expect(level.bossEnemyId).toBe(level.level === world.bossLevel ? world.bossEnemyId : null);
      if (level.bossEnemyId) expect(CAMPAIGN_ENEMIES[level.bossEnemyId]).toBeDefined();

      const battle = new CampaignBattle(level.level, view);
      expect(Number.isSafeInteger(battle.waveCount)).toBe(true);
      expect(battle.waveCount).toBeGreaterThan(0);
      for (let waveNumber = 1; waveNumber <= battle.waveCount; waveNumber++) {
        const wave = battle.wave(waveNumber);
        const isBossBoundary = waveNumber === battle.waveCount && level.bossEnemyId !== null;
        expect(wave.isBossWave).toBe(isBossBoundary);
        expect(wave.spawns.length).toBeGreaterThan(0);
        for (const spawn of wave.spawns) {
          expect(Number.isFinite(spawn.atMs)).toBe(true);
          expect(spawn.atMs).toBeGreaterThanOrEqual(0);
          expect(Number.isFinite(spawn.hpBonus)).toBe(true);
          expect(spawn.hpBonus).toBeGreaterThan(0);
          expect(CAMPAIGN_ENEMIES[spawn.enemyId]).toBeDefined();
          expect(level.enemyIds.includes(spawn.enemyId) || (isBossBoundary && spawn.enemyId === level.bossEnemyId)).toBe(true);
        }
        expect(wave.spawns.filter(spawn => spawn.enemyId === level.bossEnemyId)).toHaveLength(isBossBoundary ? 1 : 0);
      }
    }
  }, 30_000);

  it('resolves all 40 route families and validates every level’s road clearance and minimum tower coverage', () => {
    const expectedRouteKeys = CAMPAIGN_WORLDS.flatMap(world => ['a', 'b', 'c', 'd'].map(family => `${world.id}_${family}`));
    expect(Object.keys(CAMPAIGN_ROUTES).sort()).toEqual(expectedRouteKeys.sort());
    expect(new Set(Object.values(CAMPAIGN_ROUTES).map(route => JSON.stringify(route))).size).toBe(40);

    const minimumTowerRange = Math.min(...TOWER_LIST.map(tower => tower.levels[0].range));
    for (const level of CAMPAIGN_LEVELS) {
      const world = CAMPAIGN_WORLDS.find(candidate => candidate.id === level.worldId)!;
      const family = `${world.id}_${level.mapLayoutId.slice(world.id.length + 1, world.id.length + 2)}`;
      expect(CAMPAIGN_ROUTES[family]).toBeDefined();
      const map = resolveCampaignMap(level);
      expect(map.id).toBe(level.mapLayoutId);
      expect(map.waypoints.length).toBeGreaterThanOrEqual(2);
      expect(map.spawn).toEqual(map.waypoints[0]);
      expect(map.gate).toEqual(map.waypoints[map.waypoints.length - 1]);
      expect(map.waypoints.every(point => Number.isFinite(point.x) && Number.isFinite(point.y))).toBe(true);
      expect(map.buildable.length).toBeGreaterThanOrEqual(8);

      const road = { route: map.waypoints, radii: map.waypoints.slice(1).map(() => BUILD_PLOT_POLICY.campaignRoadRadius) };
      for (const [index, plot] of map.buildable.entries()) {
        const clearance = plotRoadClearance(plot, road);
        expect(clearance, `${level.mapLayoutId} plot ${index} road clearance`).toBeGreaterThanOrEqual(BUILD_PLOT_POLICY.minClearance - 1e-6);
        expect(clearance, `${level.mapLayoutId} plot ${index} road clearance`).toBeLessThanOrEqual(BUILD_PLOT_POLICY.maxClearance + 1e-6);
        expect(longestRoadCoverage(plot, map.waypoints, minimumTowerRange), `${level.mapLayoutId} plot ${index} minimum-range coverage`)
          .toBeGreaterThanOrEqual(BUILD_PLOT_POLICY.minimumCoverage);
        expect(plot.x - BUILD_PLOT_POLICY.radius).toBeGreaterThanOrEqual(map.field.x);
        expect(plot.x + BUILD_PLOT_POLICY.radius).toBeLessThanOrEqual(map.field.x + map.field.width);
        expect(plot.y - BUILD_PLOT_POLICY.radius).toBeGreaterThanOrEqual(map.field.y);
        expect(plot.y + BUILD_PLOT_POLICY.radius).toBeLessThanOrEqual(map.field.y + map.field.height);
        for (const other of map.buildable.slice(index + 1)) {
          expect(Math.hypot(plot.x - other.x, plot.y - other.y)).toBeGreaterThanOrEqual(BUILD_PLOT_POLICY.spacing - 1e-6);
        }
      }
    }
  });

  it('preserves all v1 baselines and verifies every promoted v2 candidate with no provisional registration', async (ctx) => {
    const contract = registryContract;
    const moduleName = 'node:fs';
    const { existsSync, readFileSync } = await import(moduleName);
    // artifacts/ is gitignored local evidence; skip (don't fail) in clones that lack it.
    if (!existsSync(new URL('../artifacts/campaign-final-art-20261012', import.meta.url))) ctx.skip();
    const registered = CAMPAIGN_ART_MANIFEST.filter(asset => asset.state === 'final_required');
    expect(contract.baselineCommit).toBe('b33ea38e01754f2e6469eadf1660cd84b7520ee5');
    expect(contract.assets).toHaveLength(77);
    expect(contract.livePromotions.acceptedForIntegration).toBe(true);
    expect(contract.livePromotions.assets).toHaveLength(77);
    expect(registered).toHaveLength(0);
    expect(new Set(contract.assets.map(item => item.path)).size).toBe(77);
    expect(new Set(registered.map(item => item.path)).size).toBe(0);

    const registeredByPath = new Map(registered.map(item => [item.path, item]));
    const promotionsByBaselinePath = new Map(contract.livePromotions.assets.map(item => [item.baselineV1Path, item]));
    for (const item of contract.assets) {
      const baselineTarget = new URL(`../public${item.path}`, import.meta.url);
      expect(existsSync(baselineTarget), `${item.path} v1 rollback file remains`).toBe(true);
      const baselineBytes: Uint8Array = readFileSync(baselineTarget);
      expect(await sha256(baselineBytes), `${item.path} v1 baseline hash remains unchanged`).toBe(item.baselineSha256);
      expect(imageDimensions(baselineBytes), `${item.path} v1 baseline dimensions`).toEqual([item.width, item.height]);

      const promotion = promotionsByBaselinePath.get(item.path);
      if (promotion) {
        expect(promotion.approved).toBe(true);
        expect(promotion.baselineSha256).toBe(item.baselineSha256);
        expect(promotion.registration).toMatchObject({
          id: item.registration.id, key: item.registration.key, kind: item.registration.kind,
          width: item.width, height: item.height, state: 'final', stage: item.category === 'world-panel' ? 'campaign' : 'gameplay', temporary: null
        });
        const live = CAMPAIGN_ART_MANIFEST.find(asset => asset.id === promotion.id);
        const { animations, ...liveRegistration } = promotion.registration;
        expect(live, `${promotion.id} promoted runtime registration`).toMatchObject(liveRegistration);
        expect(campaignAnimationDefinitions(live!.key), `${promotion.id} stable animation contract`).toEqual(animations);
        expect(live!.path).toBe(promotion.promotedPath);
        expect(live!.key).toBe(item.registration.key);
        expect(AVAILABLE_CAMPAIGN_ART_PATHS).toContain(promotion.promotedPath);
        expect(CAMPAIGN_PROVISIONAL_STARTER_PATHS).not.toContain(item.path);

        const candidateBytes: Uint8Array = readFileSync(new URL(`../${promotion.candidatePath}`, import.meta.url));
        const promotedTarget = new URL(`../public${promotion.promotedPath}`, import.meta.url);
        expect(existsSync(promotedTarget), `${promotion.promotedPath} promoted target exists`).toBe(true);
        const promotedBytes: Uint8Array = readFileSync(promotedTarget);
        expect(await sha256(candidateBytes), `${promotion.id} accepted candidate hash`).toBe(promotion.candidateSha256);
        // Promoted WebP is a lossy re-encode of the PNG candidate: identical
        // pixel size, different bytes — compare dimensions, not hashes.
        expect(imageDimensions(candidateBytes), `${promotion.id} candidate dimensions`).toEqual([item.width, item.height]);
        expect(imageDimensions(promotedBytes), `${promotion.promotedPath} WebP dimensions`).toEqual([item.width, item.height]);
      } else {
        const source = registeredByPath.get(item.path);
        expect(source, `${item.id} remaining provisional registration`).toBeDefined();
        expect(item.approved).toBe(false);
        expect(item.candidateStatus).toBe(item.category === 'boss' ? 'NONE' : 'UNAPPROVED_PREVIEW');
        if (item.category === 'boss') expect(item.candidateSha256).toBeNull();
        else expect(item.candidateSha256).toMatch(/^[a-f0-9]{64}$/);
        expect(item.registration).toMatchObject({ state: 'final_required', temporary: 'procedural', path: item.path, width: item.width, height: item.height });
        expect(source!.id).toBe(item.registration.id);
        expect(source!.key).toBe(item.registration.key);
        expect(source!.path).toBe(item.registration.path);
        expect(source!.kind).toBe(item.registration.kind);
        expect(source!.width).toBe(item.registration.width);
        expect(source!.height).toBe(item.registration.height);
        expect(source!.frameWidth).toBe(item.registration.frameWidth);
        expect(source!.frameHeight).toBe(item.registration.frameHeight);
        expect(source!.states).toEqual(item.registration.states);
        expect(source!.state).toBe(item.registration.state);
        expect(CAMPAIGN_PROVISIONAL_STARTER_PATHS).toContain(item.path);
        expect(AVAILABLE_CAMPAIGN_ART_PATHS).not.toContain(item.path);
      }
    }
  });

  it('keeps the 43 original final paths and promotes every v2 path without active provisional paths', async () => {
    const expectedFinalPaths = [
      ...LEGACY_WORLD_IDS.flatMap(world => ['a', 'b', 'c', 'd'].map(family => `/assets/campaign/maps/${world}_${family}-v1.webp`)),
      ...LEGACY_WORLD_IDS.flatMap((world, index) => [
        `/assets/campaign/world-map/${world}-v1.webp`,
        ...LEGACY_NORMAL_ENEMIES[world].map(id => `/assets/campaign/enemies/${world}/${id}-atlas-v1.webp`),
        `/assets/campaign/bosses/${LEGACY_BOSSES[index]}-atlas-v1.webp`
      ]),
      ...TOWER_IDS.flatMap(id => [2, 3].map(tier => `/assets/campaign/towers/${id}-tier${tier}-v1.webp`))
    ];
    const contract = registryContract;
    expect(expectedFinalPaths).toHaveLength(43);
    const promotedPaths = contract.livePromotions.assets.map(asset => asset.promotedPath);
    const additionalTowerPaths = ['sentinel', 'cinder'].flatMap(id => [2, 3].map(tier => `/assets/campaign/towers/${id}-tier${tier}-v1.webp`));
    const additionalSigilPaths = ['/assets/campaign/sigils/borderkeep-sigil-v1.webp', '/assets/campaign/sigils/emberfall-sigil-v1.webp', '/assets/campaign/sigils/frostveil-sigil-v1.webp', '/assets/campaign/sigils/whisperfen-sigil-v1.webp', '/assets/campaign/sigils/sunken_aether-sigil-v1.webp', '/assets/campaign/sigils/ironroot-sigil-v1.webp', '/assets/campaign/sigils/sky_isles-sigil-v1.webp', '/assets/campaign/sigils/dreadmoon-sigil-v1.webp', '/assets/campaign/sigils/astral_rift-sigil-v1.webp', '/assets/campaign/sigils/aether_crown-sigil-v1.webp'];
    const additionalPortraitPaths = ['/assets/campaign/portraits/hollow_warden-portrait-v1.webp', '/assets/campaign/portraits/cinder_colossus-portrait-v1.webp', '/assets/campaign/portraits/frostbound_matriarch-portrait-v1.webp', '/assets/campaign/portraits/mireheart_hydra-portrait-v1.webp', '/assets/campaign/portraits/drowned_oracle-portrait-v1.webp', '/assets/campaign/portraits/iron_tyrant-portrait-v1.webp', '/assets/campaign/portraits/stormmaw_prime-portrait-v1.webp', '/assets/campaign/portraits/umbral_regent-portrait-v1.webp', '/assets/campaign/portraits/rift_sovereign-portrait-v1.webp', '/assets/campaign/portraits/aether_devourer-portrait-v1.webp'];
    const additionalFinalePaths = ['/assets/campaign/finale/campaign-finale-v1.webp'];
    const additionalVictoryPaths = ['/assets/campaign/victory/borderkeep-victory-v1.webp', '/assets/campaign/victory/emberfall-victory-v1.webp', '/assets/campaign/victory/frostveil-victory-v1.webp', '/assets/campaign/victory/whisperfen-victory-v1.webp', '/assets/campaign/victory/sunken_aether-victory-v1.webp', '/assets/campaign/victory/ironroot-victory-v1.webp', '/assets/campaign/victory/sky_isles-victory-v1.webp', '/assets/campaign/victory/dreadmoon-victory-v1.webp', '/assets/campaign/victory/astral_rift-victory-v1.webp', '/assets/campaign/victory/aether_crown-victory-v1.webp'];
    const additionalLandmarkPaths = ['/assets/world/landmarks/landmark-borderkeep-v1.webp', '/assets/world/landmarks/landmark-emberfall-v1.webp', '/assets/world/landmarks/landmark-frostveil-v1.webp', '/assets/world/landmarks/landmark-whisperfen-v1.webp', '/assets/world/landmarks/landmark-sunken_aether-v1.webp', '/assets/world/landmarks/landmark-ironroot-v1.webp', '/assets/world/landmarks/landmark-sky_isles-v1.webp', '/assets/world/landmarks/landmark-dreadmoon-v1.webp', '/assets/world/landmarks/landmark-astral_rift-v1.webp', '/assets/world/landmarks/landmark-aether_crown-v1.webp'];
    const additionalElitePortraitPaths = ['/assets/campaign/portraits/elite-borderkeep-v1.webp', '/assets/campaign/portraits/elite-emberfall-v1.webp', '/assets/campaign/portraits/elite-frostveil-v1.webp', '/assets/campaign/portraits/elite-whisperfen-v1.webp', '/assets/campaign/portraits/elite-sunken_aether-v1.webp', '/assets/campaign/portraits/elite-ironroot-v1.webp', '/assets/campaign/portraits/elite-sky_isles-v1.webp', '/assets/campaign/portraits/elite-dreadmoon-v1.webp', '/assets/campaign/portraits/elite-astral_rift-v1.webp', '/assets/campaign/portraits/elite-aether_crown-v1.webp'];
    expect(promotedPaths).toHaveLength(77);
    expect(AVAILABLE_CAMPAIGN_ART_PATHS.slice(0, expectedFinalPaths.length)).toEqual(expectedFinalPaths);
    expect(new Set(AVAILABLE_CAMPAIGN_ART_PATHS.slice(expectedFinalPaths.length))).toEqual(new Set([...additionalTowerPaths, ...promotedPaths, ...additionalSigilPaths, ...additionalPortraitPaths, ...additionalFinalePaths, ...additionalVictoryPaths, ...additionalLandmarkPaths, ...additionalElitePortraitPaths]));
    expect(AVAILABLE_CAMPAIGN_ART_PATHS).toHaveLength(175);
    const currentFinalPaths = CAMPAIGN_ART_MANIFEST.filter(asset => asset.state === 'final').map(asset => asset.path);
    expect(currentFinalPaths).toHaveLength(175);
    expect(currentFinalPaths.slice(0, expectedFinalPaths.length)).toEqual(expectedFinalPaths);
    expect(new Set(currentFinalPaths.slice(expectedFinalPaths.length))).toEqual(new Set([...additionalTowerPaths, ...promotedPaths, ...additionalSigilPaths, ...additionalPortraitPaths, ...additionalFinalePaths, ...additionalVictoryPaths, ...additionalLandmarkPaths, ...additionalElitePortraitPaths]));
    expect(contract.legacyFinalAssets).toHaveLength(43);
    expect(contract.legacyFinalAssets.map(asset => asset.path)).toEqual(expectedFinalPaths);
    expect(CAMPAIGN_ART_MANIFEST.filter(asset => asset.state === 'final').map(asset => asset.path)).toEqual(AVAILABLE_CAMPAIGN_ART_PATHS);
    expect(CAMPAIGN_PROVISIONAL_STARTER_PATHS).toHaveLength(0);
    expect([...CAMPAIGN_PROVISIONAL_STARTER_PATHS].sort()).toEqual([...PROVISIONAL_EXPANSION_PATHS].sort());
    expect(new Set([...expectedFinalPaths, ...promotedPaths, ...additionalTowerPaths, ...additionalSigilPaths, ...additionalPortraitPaths, ...additionalFinalePaths, ...additionalVictoryPaths, ...additionalLandmarkPaths, ...additionalElitePortraitPaths, ...PROVISIONAL_EXPANSION_PATHS]).size).toBe(175);
    const moduleName = 'node:fs';
    const { existsSync, readFileSync } = await import(moduleName);
    for (const asset of contract.legacyFinalAssets) {
      const bytes: Uint8Array = readFileSync(new URL(`../public${asset.path}`, import.meta.url));
      expect(await sha256(bytes), `${asset.path} unchanged from baseline b33ea38`).toBe(asset.baselineSha256);
    }
    for (const path of [...expectedFinalPaths, ...promotedPaths, ...additionalTowerPaths, ...PROVISIONAL_EXPANSION_PATHS]) {
      expect(existsSync(new URL(`../public${path}`, import.meta.url)), `${path} active file exists`).toBe(true);
    }
  });

  it('selects only stage-ready art for each current level and resolves every requested file', async () => {
    const activePaths = new Set([...AVAILABLE_CAMPAIGN_ART_PATHS, ...PROVISIONAL_EXPANSION_PATHS]);
    const promotedPathByV1 = new Map(registryContract.livePromotions.assets.map(asset => [asset.baselineV1Path, asset.promotedPath]));
    const currentPath = (v1Path: string) => promotedPathByV1.get(v1Path) ?? v1Path;
    const baselineGameplay = requiredAssets('gameplay');
    const stageAssets = [...requiredAssets('menu'), ...requiredAssets('campaign'), ...baselineGameplay];
    const moduleName = 'node:fs';
    const { existsSync } = await import(moduleName);
    for (const asset of stageAssets) expect(existsSync(new URL(`../public${asset.path}`, import.meta.url)), `${asset.path} stage file exists`).toBe(true);
    expect(requiredAssets('menu').every(asset => !PROVISIONAL_EXPANSION_PATHS.includes(asset.path))).toBe(true);
    const provisionalPathsRequestedByStage = new Set([
      ...requiredAssets('campaign'),
      ...CAMPAIGN_LEVELS.slice(30).flatMap(level => campaignGameplayAssetsForLevel(level, 1))
    ].map(asset => asset.path).filter(path => PROVISIONAL_EXPANSION_PATHS.includes(path)));
    expect([...provisionalPathsRequestedByStage].sort()).toEqual([...PROVISIONAL_EXPANSION_PATHS].sort());

    for (const level of CAMPAIGN_LEVELS) {
      const world = CAMPAIGN_WORLDS.find(candidate => candidate.id === level.worldId)!;
      const family = level.mapLayoutId.slice(world.id.length + 1, world.id.length + 2);
      const expectedPaths = new Set<string>();
      const mapPath = currentPath(`/assets/campaign/maps/${world.id}_${family}-v1.webp`);
      if (activePaths.has(mapPath)) expectedPaths.add(mapPath);
      for (const enemyId of level.enemyIds) {
        const path = currentPath(`/assets/campaign/enemies/${world.id}/${enemyId}-atlas-v1.webp`);
        if (activePaths.has(path)) expectedPaths.add(path);
      }
      if (level.bossEnemyId) {
        const bossPath = currentPath(`/assets/campaign/bosses/${level.bossEnemyId}-atlas-v1.webp`);
        if (activePaths.has(bossPath)) expectedPaths.add(bossPath);
        const summonPath = currentPath('/assets/campaign/enemies/whisperfen/bogling-atlas-v1.webp');
        if (level.bossEnemyId === 'mireheart_hydra' && activePaths.has(summonPath)) {
          expectedPaths.add(summonPath);
        }
      }
      if (level.level === CAMPAIGN_LEVELS.length) {
        expectedPaths.add('/assets/campaign/finale/campaign-finale-v1.webp');
      }
      if (level.level === CAMPAIGN_WORLDS.find(world => world.id === 'borderkeep')!.bossLevel) {
        expectedPaths.add('/assets/campaign/victory/borderkeep-victory-v1.webp');
      }
      if (level.level === CAMPAIGN_WORLDS.find(world => world.id === 'emberfall')!.bossLevel) {
        expectedPaths.add('/assets/campaign/victory/emberfall-victory-v1.webp');
      }
      if (level.level === CAMPAIGN_WORLDS.find(world => world.id === 'frostveil')!.bossLevel) {
        expectedPaths.add('/assets/campaign/victory/frostveil-victory-v1.webp');
      }
      if (level.level === CAMPAIGN_WORLDS.find(world => world.id === 'whisperfen')!.bossLevel) {
        expectedPaths.add('/assets/campaign/victory/whisperfen-victory-v1.webp');
      }
      if (level.level === CAMPAIGN_WORLDS.find(world => world.id === 'sunken_aether')!.bossLevel) {
        expectedPaths.add('/assets/campaign/victory/sunken_aether-victory-v1.webp');
      }
      if (level.level === CAMPAIGN_WORLDS.find(world => world.id === 'ironroot')!.bossLevel) {
        expectedPaths.add('/assets/campaign/victory/ironroot-victory-v1.webp');
      }
      if (level.level === CAMPAIGN_WORLDS.find(world => world.id === 'sky_isles')!.bossLevel) {
        expectedPaths.add('/assets/campaign/victory/sky_isles-victory-v1.webp');
      }
      if (level.level === CAMPAIGN_WORLDS.find(world => world.id === 'dreadmoon')!.bossLevel) {
        expectedPaths.add('/assets/campaign/victory/dreadmoon-victory-v1.webp');
      }
      if (level.level === CAMPAIGN_WORLDS.find(world => world.id === 'astral_rift')!.bossLevel) {
        expectedPaths.add('/assets/campaign/victory/astral_rift-victory-v1.webp');
      }
      if (level.level === CAMPAIGN_WORLDS.find(world => world.id === 'aether_crown')!.bossLevel) {
        expectedPaths.add('/assets/campaign/victory/aether_crown-victory-v1.webp');
      }

      const selected = campaignGameplayAssetsForLevel(level, 1);
      expect(new Set(selected.map(asset => asset.path)), `level ${level.level} selected art`).toEqual(expectedPaths);
      for (const asset of selected) {
        expect(activePaths.has(asset.path), `level ${level.level} selected active path ${asset.path}`).toBe(true);
        expect(existsSync(new URL(`../public${asset.path}`, import.meta.url)), `level ${level.level} selected file ${asset.path}`).toBe(true);
      }
      expect(requiredAssetsForRequest('gameplay', { mode: 'campaign', campaignLevel: level.level }))
        .toEqual([...baselineGameplay, ...selected]);
    }

    expect(requiredAssetsForRequest('gameplay', { mode: 'campaign', campaignLevel: 0 })).toEqual(baselineGameplay);
    expect(requiredAssetsForRequest('gameplay', { mode: 'campaign', campaignLevel: 101 })).toEqual(baselineGameplay);
  });
});
