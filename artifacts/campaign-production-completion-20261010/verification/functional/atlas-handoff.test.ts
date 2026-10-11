import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';
import { CAMPAIGN_ART_MANIFEST } from '../../../../src/game/campaign/artManifest.ts';

const root = process.cwd();
const atlasFolder = resolve(root, 'artifacts/campaign-production-completion-20261010/atlases');
const handoff = readFileSync(resolve(atlasFolder, 'production-handoff.md'), 'utf8');

it('retains the historical missing-atlas inventory and verifies its completed production replacements', () => {
  const listed = handoff.split(/\r?\n/)
    .filter(line => line.startsWith('- `/assets/campaign/'))
    .map(line => {
      const match = line.match(/^- `([^`]+)`\s+—\s+(attempted|not attempted)/);
      expect(match, line).not.toBeNull();
      return { path: match![1], status: match![2] };
    });
  const expected = CAMPAIGN_ART_MANIFEST
    .filter(asset => asset.kind === 'sheet'
      && (asset.id.startsWith('enemy:') || asset.id.startsWith('boss:')))
    .map(asset => asset.path);
  const attempted = listed.filter(item => item.status === 'attempted');
  const missingTargets = listed.filter(item => !existsSync(resolve(root, 'public', ...item.path.slice(1).split('/'))));

  expect(listed).toHaveLength(18);
  expect(new Set(listed.map(item => item.path)).size).toBe(18);
  expect(listed.map(item => item.path).sort()).toEqual(expected.sort());
  expect(attempted).toEqual([{ path: '/assets/campaign/enemies/borderkeep/marchling-atlas-v1.png', status: 'attempted' }]);
  expect(missingTargets).toEqual([]);

  const marchling = CAMPAIGN_ART_MANIFEST.find(asset => asset.id === 'enemy:marchling')!;
  expect(marchling).toMatchObject({ state: 'final', temporary: null, width: 768, height: 512, frameWidth: 128, frameHeight: 128 });
  expect(CAMPAIGN_ART_MANIFEST.filter(asset => asset.kind === 'sheet').every(asset => asset.state === 'final' && asset.temporary === null)).toBe(true);
  expect(readdirSync(resolve(atlasFolder, 'marchling')).filter(file => file.endsWith('-generated.png')).sort()).toEqual([
    'marchling-atlas-v1-fit-correction-generated.png',
    'marchling-atlas-v1-initial-generated.png',
    'marchling-walk-row-3x2-diagnostic-generated.png',
    'marchling-walk-row-retry-generated.png'
  ]);
});
