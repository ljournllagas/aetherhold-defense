// Shared UI tokens for Phaser canvas UI. Mirrors DESIGN_SYSTEM.md §6 + :root in style.css.
// Phaser cannot read CSS variables, so this module is the single source of truth
// for canvas code; keep the two in sync when the design system changes.

export const C = {
  bgDeep: 0x0a0e12,
  bgPanel: 0x121920,
  bgRaised: 0x19232d,
  bgHover: 0x22303c,
  borderSubtle: '#2C3945',
  borderStrong: '#445564',
  textPrimary: '#F3EBDD',
  textSecondary: '#B7C0C7',
  textMuted: '#7F8C97',
  gold: '#D7AA4E',
  goldBright: '#F0CD72',
  health: '#63C77C',
  danger: '#D85F59',
  dangerBright: '#EE7B71',
  mana: '#5F9FE8',
  frost: '#72C8E8',
  arcane: '#9E7AE6',
  storm: '#67D0C4',
  fire: '#DE8742',
  common: '#B7C0C7',
  uncommon: '#63C77C',
  rare: '#5F9FE8',
  legendary: '#D7AA4E'
} as const;

export const FONT_DISPLAY = '"Cinzel", Georgia, serif';
export const FONT_UI = '"Inter", system-ui, sans-serif';

export const RARITY_COLOR: Record<string, string> = {
  common: C.common,
  uncommon: C.uncommon,
  rare: C.rare,
  legendary: C.legendary
};

// Range indicator (DESIGN_SYSTEM.md §33).
export const RANGE_STROKE = 0xd7aa4e;
export const RANGE_STROKE_ALPHA = 0.8;
export const RANGE_FILL_ALPHA = 0.08;

export function style(fontSize: number | string, color: string, bold = false, font = FONT_UI): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontSize: typeof fontSize === 'number' ? `${fontSize}px` : fontSize,
    color,
    fontFamily: font,
    fontStyle: bold ? 'bold' : undefined
  };
}
