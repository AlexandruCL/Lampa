export type ColourName = { en: string; ro: string };

export const COLOUR_NAMES: ColourName[] = [
  { en: "Red", ro: "Roșu" },
  { en: "Orange", ro: "Portocaliu" },
  { en: "Yellow", ro: "Galben" },
  { en: "Yellow-green", ro: "Verde-gălbui" },
  { en: "Green", ro: "Verde" },
  { en: "Mint", ro: "Verde-mentă" },
  { en: "Turquoise", ro: "Turcoaz" },
  { en: "Sky blue", ro: "Albastru deschis" },
  { en: "Blue", ro: "Albastru" },
  { en: "Violet", ro: "Violet" },
  { en: "Magenta", ro: "Magenta" },
  { en: "Pink", ro: "Roz" },
];
export const NIGHT_GLASS: ColourName = { en: "Night glass", ro: "Sticlă de noapte" };

/** Bin 0 to 11 for a hue in degrees (red at 0). */
export const hueBin = (hue: number): number => Math.floor(((((hue % 360) + 360) % 360) + 15) % 360 / 30);

/** HSL hue in degrees of "#rrggbb", or null for a grey (no hue). */
export function hexHue(hex: string): number | null {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255];
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  if (d === 0) return null;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

export function colourName(hex: string): ColourName {
  const hue = hexHue(hex);
  return hue === null ? NIGHT_GLASS : COLOUR_NAMES[hueBin(hue)];
}
