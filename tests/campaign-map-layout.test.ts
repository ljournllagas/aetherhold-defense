import { describe, expect, it } from 'vitest';
import {
  CAMPAIGN_NODE_GAP, CAMPAIGN_NODE_HIT_SIZE, CAMPAIGN_NODE_SPACING,
  CAMPAIGN_MAP_WIDTH, campaignDetailContentLayout, campaignMapRoute, campaignMapScrollForSelection, campaignMapScrollForWorld,
  campaignScreenLayout, campaignWorldCaptionLayout, campaignWorldTabsPerPage
} from '../src/game/campaign/mapLayout.ts';
import { CAMPAIGN_WORLDS } from '../src/game/campaign/config.ts';

describe('campaign route layout', () => {
  it('builds every registered level and all nine connected world crossings before roads are rendered', () => {
    const route = campaignMapRoute(200);

    expect(route.nodes.map(node => node.level)).toEqual(Array.from({ length: 100 }, (_, index) => index + 1));
    expect(CAMPAIGN_MAP_WIDTH).toBe(600 * CAMPAIGN_WORLDS.length);
    expect(route.links).toHaveLength(99);
    expect(route.links.filter(link => link.crossesWorld).map(link => [link.from.level, link.to.level])).toEqual(
      Array.from({ length: 9 }, (_, index) => [10 * (index + 1), 10 * (index + 1) + 1])
    );
    expect(route.links.every(link => route.nodes.includes(link.from) && route.nodes.includes(link.to))).toBe(true);
  });

  it('keeps 44px touch targets separate along each world route', () => {
    const route = campaignMapRoute(200);

    expect(CAMPAIGN_NODE_HIT_SIZE).toBe(44);
    expect(CAMPAIGN_NODE_SPACING - CAMPAIGN_NODE_HIT_SIZE).toBe(CAMPAIGN_NODE_GAP);
    for (const first of route.nodes) {
      const next = route.nodes.find(node => node.level === first.level + 1);
      if (next && first.worldId === next.worldId) expect(next.x - first.x).toBe(52);
    }
  });

  it('fits world captions inside the selected realm intersection on portrait screens', () => {
    const route = campaignMapRoute(328), viewportWidth = 358;
    const visibleStart = (level: number) => Math.max(0, route.nodes[level - 1].x - viewportWidth / 2);
    const emberfall = campaignWorldCaptionLayout(1, visibleStart(11), viewportWidth)!;
    const borderkeepAtCrossing = campaignWorldCaptionLayout(0, visibleStart(10), viewportWidth)!;
    const emberfallAtCrossing = campaignWorldCaptionLayout(1, visibleStart(10), viewportWidth)!;
    const frostveil = campaignWorldCaptionLayout(2, visibleStart(21), viewportWidth)!;

    expect(emberfall).toMatchObject({ x: 602, width: 235, textX: 608, textWidth: 223 });
    expect(borderkeepAtCrossing.width).toBe(247);
    expect(emberfallAtCrossing.width).toBe(103);
    expect(frostveil.width).toBe(235);
    for (const [layout, level] of [[emberfall, 11], [borderkeepAtCrossing, 10], [emberfallAtCrossing, 10], [frostveil, 21]] as const) {
      const start = visibleStart(level), screenTextX = 16 + layout.textX - start;
      expect(screenTextX).toBeGreaterThanOrEqual(24);
      expect(screenTextX + layout.textWidth).toBeLessThanOrEqual(374);
    }
    expect(campaignWorldCaptionLayout(2, 0, viewportWidth)).toBeNull();
    expect(campaignWorldCaptionLayout(1, 345, viewportWidth)).toBeNull();

    for (const selected of route.nodes) {
      const scroll = Math.max(0, Math.min(route.width - viewportWidth, selected.x - viewportWidth / 2));
    for (let worldIndex = 0; worldIndex < CAMPAIGN_WORLDS.length; worldIndex++) {
        const caption = campaignWorldCaptionLayout(worldIndex, scroll, viewportWidth);
        if (!caption) continue;
        const screenTextX = 16 + caption.textX - scroll;
        expect(screenTextX).toBeGreaterThanOrEqual(24);
        expect(screenTextX + caption.textWidth, `level ${selected.level}, world ${worldIndex}`).toBeLessThanOrEqual(374);
        expect(caption.textX + caption.textWidth).toBeLessThanOrEqual(caption.x + caption.width - 6);
      }
    }
  });

  it('pages ten world tabs to keep labels and arrow hit targets readable', () => {
    expect(campaignWorldTabsPerPage(390)).toBe(3);
    expect(campaignWorldTabsPerPage(700)).toBe(4);
    expect(campaignWorldTabsPerPage(1024)).toBe(5);
    expect(Math.ceil(CAMPAIGN_WORLDS.length / campaignWorldTabsPerPage(390))).toBe(4);
    expect(Math.ceil(CAMPAIGN_WORLDS.length / campaignWorldTabsPerPage(700))).toBe(3);
    expect(Math.ceil(CAMPAIGN_WORLDS.length / campaignWorldTabsPerPage(1024))).toBe(2);
  });

  it('retains a useful map window across resize while keeping selection inside the viewport', () => {
    const route = campaignMapRoute(220), selected = route.nodes[68].x;
    const narrowScroll = campaignMapScrollForSelection(null, selected, route.width, 358);
    const widerScroll = campaignMapScrollForSelection(narrowScroll, selected, route.width, 780);

    expect(widerScroll).toBe(narrowScroll);
    expect(selected).toBeGreaterThanOrEqual(widerScroll + CAMPAIGN_NODE_HIT_SIZE / 2 + 8);
    expect(selected).toBeLessThanOrEqual(widerScroll + 780 - CAMPAIGN_NODE_HIT_SIZE / 2 - 8);
    const nearbySelection = campaignMapScrollForSelection(widerScroll, route.nodes[70].x, route.width, 780);
    expect(nearbySelection).toBe(widerScroll);
    const distantSelection = campaignMapScrollForSelection(nearbySelection, route.nodes[99].x, route.width, 780);
    expect(route.nodes[99].x).toBeGreaterThanOrEqual(distantSelection);
    expect(route.nodes[99].x).toBeLessThanOrEqual(distantSelection + 780);
  });

  it('frames a complete world when it fits and clamps selection focus when it does not', () => {
    const route = campaignMapRoute(220), worldOne = route.nodes.filter(node => node.worldId === CAMPAIGN_WORLDS[0].id);
    const wideViewport = 1408;
    const firstWorldScroll = campaignMapScrollForWorld(
      route.width - wideViewport, worldOne[9].x, worldOne[0].x, worldOne[9].x, route.width, wideViewport
    );
    expect(firstWorldScroll).toBe(0);
    expect(worldOne[0].x - firstWorldScroll).toBeGreaterThanOrEqual(CAMPAIGN_NODE_HIT_SIZE / 2);
    expect(worldOne[9].x - firstWorldScroll).toBeLessThanOrEqual(wideViewport - CAMPAIGN_NODE_HIT_SIZE / 2);

    const narrowViewport = 358;
    const narrowScroll = campaignMapScrollForWorld(
      route.width - narrowViewport, worldOne[9].x, worldOne[0].x, worldOne[9].x, route.width, narrowViewport
    );
    expect(narrowScroll).toBeGreaterThanOrEqual(0);
    expect(narrowScroll).toBeLessThanOrEqual(route.width - narrowViewport);
    expect(worldOne[9].x - narrowScroll).toBeGreaterThanOrEqual(CAMPAIGN_NODE_HIT_SIZE / 2);
    expect(worldOne[9].x - narrowScroll).toBeLessThanOrEqual(narrowViewport - CAMPAIGN_NODE_HIT_SIZE / 2);

    const resizedWorldScroll = campaignMapScrollForWorld(
      narrowScroll, worldOne[9].x, worldOne[0].x, worldOne[9].x, route.width, 780
    );
    expect(worldOne[0].x - resizedWorldScroll).toBeGreaterThanOrEqual(CAMPAIGN_NODE_HIT_SIZE / 2);
    expect(worldOne[9].x - resizedWorldScroll).toBeLessThanOrEqual(780 - CAMPAIGN_NODE_HIT_SIZE / 2);
  });

  it.each([[844, 390], [640, 360], [390, 844]])('keeps selected-level details and battle controls in a %ix%i viewport', (width, height) => {
    const layout = campaignScreenLayout(width, height);

    expect(layout.detailHeight).toBeGreaterThanOrEqual(156);
    expect(layout.mapHeight).toBeGreaterThanOrEqual(80);
    expect(layout.detailY + layout.detailHeight).toBeLessThanOrEqual(height - 8);
    expect(layout.tabsY + 44).toBeLessThanOrEqual(layout.mapY);
  });

  it.each([[390, 844], [360, 640]])('reserves a two-line header and untruncated detail rows at %ix%i', (width, height) => {
    const layout = campaignScreenLayout(width, height);

    expect(layout.narrowHeader).toBe(true);
    expect(layout.tabsY).toBe(108);
    expect(layout.mapY).toBe(160);
    expect(layout.tabsY + 44).toBeLessThanOrEqual(layout.mapY);
    expect(layout.detailY + layout.detailHeight).toBeLessThanOrEqual(height - 8);
    expect(layout.detailY + layout.detailHeight - 60 + 44).toBeLessThanOrEqual(height - 8);
  });

  it.each([[192, false], [156, false], [192, true], [156, true]])('keeps mastery, roster, notice and CTA rows in a %ipx detail panel (notice: %s)', (height, hasNotice) => {
    const content = campaignDetailContentLayout(height, hasNotice);

    expect(content.goalsY + 14).toBeLessThanOrEqual(content.enemyCenterY - (hasNotice ? 0 : 12));
    if (hasNotice && content.veryCompact) {
      expect(content.statusY + 14).toBeLessThanOrEqual(content.enemyNamesY);
    } else if (hasNotice) {
      expect(content.enemyNamesY + 28).toBeLessThanOrEqual(content.statusY);
      expect(content.statusY + 14).toBeLessThanOrEqual(content.buttonY);
    }
    expect(content.enemyNamesY + (content.veryCompact ? 14 : 28)).toBeLessThanOrEqual(content.buttonY);
  });
});
