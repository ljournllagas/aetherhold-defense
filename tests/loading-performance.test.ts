import html from '../index.html?raw';
import headers from '../public/_headers?raw';
import mainSource from '../src/main.ts?raw';
import { describe, expect, it } from 'vitest';
import { STAGE_ASSETS } from '../src/game/art/assetManifest.ts';
import { CAMPAIGN_ART_MANIFEST } from '../src/game/campaign/artManifest.ts';

// The tsconfig has no Node types; load fs by variable name, as the other asset tests do.
const moduleName = 'node:fs';
const { existsSync, statSync } = await import(moduleName) as { existsSync(path: string | URL): boolean; statSync(path: string | URL): { size: number } };
const urlModuleName = 'node:url';
const { fileURLToPath } = await import(urlModuleName) as { fileURLToPath(url: URL | string): string };
const onDisk = (path: string): string => fileURLToPath(new URL(`../public${path}`, import.meta.url));
const normalizedHeaders = headers.replace(/\r\n/g, '\n');

describe('asset weight budgets', () => {
  const finalCampaign = CAMPAIGN_ART_MANIFEST.filter(asset => asset.state === 'final');
  const everyPath = [...Object.values(STAGE_ASSETS).flat().map(asset => asset.path), ...finalCampaign.map(asset => asset.path)];

  it('ships every runtime image as WebP', () => {
    expect(everyPath.filter(path => !path.endsWith('.webp'))).toEqual([]);
  });

  it('keeps each runtime image under 1.5MB so a level never waits on one giant file', () => {
    const oversized = everyPath.filter(path => existsSync(onDisk(path)) && statSync(onDisk(path)).size > 1.5 * 1024 * 1024);
    expect(oversized).toEqual([]);
  });

  it('keeps the blocking menu stage under 3MB', () => {
    const total = STAGE_ASSETS.menu.reduce((sum, asset) => sum + statSync(onDisk(asset.path)).size, 0);
    expect(total).toBeLessThan(3 * 1024 * 1024);
  });

  it('keeps the classic gameplay stage under 8MB', () => {
    const total = STAGE_ASSETS.gameplay.reduce((sum, asset) => sum + statSync(onDisk(asset.path)).size, 0);
    expect(total).toBeLessThan(8 * 1024 * 1024);
  });
});

describe('first paint', () => {
  it('preloads only art the menu stage really requests', () => {
    const menuPaths = new Set(STAGE_ASSETS.menu.map(asset => asset.path));
    const preloads = [...html.matchAll(/<link rel="preload" as="image"[^>]*href="([^"]+)"/g)].map(match => match[1]);
    expect(preloads.length).toBeGreaterThan(0);
    for (const href of preloads) expect(menuPaths.has(href), `${href} is a menu asset`).toBe(true);
  });

  it('shows an HTML splash that main.ts hands over from', () => {
    expect(html).toContain('id="boot-splash"');
    expect(mainSource).toContain("getElementById('boot-splash')");
  });
});

describe('cache headers', () => {
  it('caches content-hashed bundles and fonts as immutable and art for 30 days', () => {
    for (const pattern of ['/assets/index-*', '/assets/phaser-*', '/assets/*.woff2']) {
      expect(normalizedHeaders).toMatch(new RegExp(`${pattern.replace(/\*/g, '\\*')}\\n  Cache-Control: public, max-age=31536000, immutable`));
    }
    expect(normalizedHeaders).toMatch(/\/assets\/\*\.webp\n  Cache-Control: public, max-age=2592000/);
  });
});
