import { CAMPAIGN_WORLDS } from './config.ts';
import type { CampaignWorldId } from './types.ts';

export const CAMPAIGN_MAP_WORLD_WIDTH = 600;
export const CAMPAIGN_MAP_WIDTH = CAMPAIGN_MAP_WORLD_WIDTH * 3;
export const CAMPAIGN_NODE_HIT_SIZE = 44;
export const CAMPAIGN_NODE_GAP = 8;
export const CAMPAIGN_NODE_SPACING = CAMPAIGN_NODE_HIT_SIZE + CAMPAIGN_NODE_GAP;

export interface CampaignMapNode {
  level: number;
  x: number;
  y: number;
  worldId: CampaignWorldId;
}

export interface CampaignMapLink {
  from: CampaignMapNode;
  to: CampaignMapNode;
  crossesWorld: boolean;
}

export interface CampaignMapRoute {
  width: number;
  height: number;
  nodes: readonly CampaignMapNode[];
  links: readonly CampaignMapLink[];
}

export interface CampaignWorldCaptionLayout {
  x: number;
  width: number;
  textX: number;
  textWidth: number;
}
const CAMPAIGN_WORLD_CAPTION_MIN_WIDTH = 104;

export interface CampaignScreenLayout {
  compact: boolean;
  narrowHeader: boolean;
  tabsY: number;
  mapY: number;
  mapHeight: number;
  detailY: number;
  detailHeight: number;
}

export interface CampaignDetailContentLayout {
  compact: boolean;
  veryCompact: boolean;
  goalsY: number;
  enemyCenterY: number;
  enemyNamesY: number;
  statusY: number;
  buttonY: number;
}

/** Relative rows keep mastery goals, the complete roster and the fixed battle CTA apart. */
export function campaignDetailContentLayout(
  height: number,
  hasCompactNotice = false,
  boss = false,
  metadataHeight = 14,
  objectivesHeight = 14
): CampaignDetailContentLayout {
  const compact = height < 220;
  const veryCompact = height < 180;
  const buttonY = height - 52;
  const metadataY = compact ? 32 : 36;
  const goalsY = compact
    ? Math.max(veryCompact ? 46 : 52, metadataY + metadataHeight + 4)
    : height - 86;
  const previewSize = compact ? veryCompact ? boss ? 24 : 20 : boss ? 28 : 24 : boss ? 42 : 34;
  const previewHalf = previewSize / 2;
  const enemyCenterY = compact
    ? Math.max(veryCompact ? 72 : 84, goalsY + objectivesHeight + 2 + previewHalf)
    : boss ? 100 : 72;
  const enemyNamesY = compact
    ? hasCompactNotice
      ? Math.max(veryCompact ? 82 : 84, goalsY + objectivesHeight + 4)
      : enemyCenterY + previewHalf + 4
    : enemyCenterY + 22;
  const statusY = veryCompact ? Math.max(64, goalsY + objectivesHeight + 4) : height - 72;
  return { compact, veryCompact, goalsY, enemyCenterY, enemyNamesY, statusY, buttonY };
}

/** Build all nodes before links so each world crossing has two real endpoints. */
export function campaignMapRoute(height: number): CampaignMapRoute {
  const contentHeight = Math.max(80, height);
  const nodes = CAMPAIGN_WORLDS.flatMap((world, worldIndex) => Array.from({ length: 10 }, (_, index) => {
    const safeRadius = 28;
    const low = Math.min(safeRadius + 8, contentHeight / 2);
    const high = Math.max(low, contentHeight - safeRadius - 8);
    const rawY = contentHeight * 0.61 + Math.sin(index * 0.84 + worldIndex * 1.5) * contentHeight * 0.2 + (worldIndex === 1 ? 8 : 0);
    return {
      level: world.levelStart + index,
      x: 60 + worldIndex * CAMPAIGN_MAP_WORLD_WIDTH + index * CAMPAIGN_NODE_SPACING,
      y: Math.max(low, Math.min(high, rawY)),
      worldId: world.id
    };
  }));
  const links = nodes.slice(1).map((to, index) => ({
    from: nodes[index], to,
    crossesWorld: nodes[index].worldId !== to.worldId
  }));
  return { width: CAMPAIGN_MAP_WIDTH, height: contentHeight, nodes, links };
}

export function campaignWorldCaptionLayout(
  worldIndex: number, visibleMapStart: number, viewportWidth: number
): CampaignWorldCaptionLayout | null {
  const worldStart = worldIndex * CAMPAIGN_MAP_WORLD_WIDTH;
  const left = Math.max(worldStart, visibleMapStart);
  const width = Math.min(worldStart + CAMPAIGN_MAP_WORLD_WIDTH, visibleMapStart + viewportWidth) - left;
  // Keep the title and sigil legible; a narrow realm sliver has no usable caption area.
  if (width < CAMPAIGN_WORLD_CAPTION_MIN_WIDTH) return null;
  return { x: left + 2, width: Math.max(1, width - 4), textX: left + 8, textWidth: Math.max(1, width - 16) };
}

/** Reserve the campaign controls and selected-level CTA even in short landscape viewports. */
export function campaignScreenLayout(width: number, height: number): CampaignScreenLayout {
  const compact = height < 520;
  const narrowHeader = !compact && width < 520;
  const mapY = compact ? 104 : narrowHeader ? 160 : 152;
  const tabsY = compact ? 52 : narrowHeader ? 108 : 100;
  const detailReserve = compact
    ? Math.min(196, Math.max(height < 380 ? 156 : 180, Math.floor(height * 0.48)))
    : height < 700 ? 192 : 170;
  const minimumMapHeight = compact ? 80 : 120;
  const maximumMapHeight = compact ? 200 : 328;
  const mapHeight = Math.max(minimumMapHeight, Math.min(
    maximumMapHeight, height * 0.42, height - mapY - 20 - detailReserve
  ));
  const detailY = mapY + mapHeight + 12;
  return {
    compact, narrowHeader, tabsY, mapY, mapHeight, detailY,
    detailHeight: Math.max(0, height - detailY - 8)
  };
}
