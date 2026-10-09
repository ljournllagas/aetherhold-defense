// ART_BIBLE.md §39 + §9 palette anchors for canvas art.
// UI semantic colors stay in ui/tokens.ts; these are world-art colors.
export const PAL = {
  grassBase: 0x3d4c38,
  grassLight: 0x4a5a42,
  grassPale: 0x55634a,
  dirt: 0x5c4c3c,
  dirtDark: 0x4a3e32,
  pathBase: 0x6b655a,
  pathCenter: 0x7f7768,
  pathEdge: 0x57534c,
  pathStone: 0x8a8172,
  ruinStone: 0x596069,
  ruinLight: 0x72777c,
  trunk: 0x4a3a2c,
  canopy: 0x3d5233,
  canopyLight: 0x4c633c,
  pine: 0x35482f,
  water: 0x2d5557,
  stone: 0x596069,
  stoneDark: 0x424750,
  stoneLight: 0x7b8288,
  timber: 0x5c4c3c,
  timberDark: 0x463a2d,
  bronze: 0x6b5a3e,
  bronzeLight: 0x8a744e,
  iron: 0x4a4f55,
  ironLight: 0x6b7178,
  gold: 0xd7aa4e,
  goldBright: 0xf0cd72,
  ember: 0xe8a33d,
  crystalFrost: 0x9fd4e8,
  crystalFrostCore: 0xe1f5fe,
  crystalArcane: 0x9e7ae6,
  crystalArcaneCore: 0xd1b3ff,
  stormCore: 0x67d0c4,
  hide: 0x6b5a44,
  hideDark: 0x524636,
  mossGreen: 0x5c6b45,
  bruteChar: 0x3a3632,
  fissure: 0xc46a3d,
  ward: 0x5c6bc0,
  swarm: 0x4a3560,
  bone: 0xcfc4ae,
  cloth: 0x3a4a6b,
  clothRed: 0x6b2a2a,
  flame: 0xe8a33d,
  flameCore: 0xffd54f
} as const;

// Upper-left light helper: returns highlight color mixed toward white.
export function hi(color: number, amt = 0.25): number {
  const r = (color >> 16) & 255;
  const g = (color >> 8) & 255;
  const b = color & 255;
  const m = (v: number) => Math.min(255, Math.round(v + (255 - v) * amt));
  return (m(r) << 16) | (m(g) << 8) | m(b);
}

// ...and shadow color mixed toward black (falls lower-right).
export function sh(color: number, amt = 0.3): number {
  const r = (color >> 16) & 255;
  const g = (color >> 8) & 255;
  const b = color & 255;
  const m = (v: number) => Math.round(v * (1 - amt));
  return (m(r) << 16) | (m(g) << 8) | m(b);
}
