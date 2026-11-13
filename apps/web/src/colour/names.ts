/** Colour names of DESIGN.md 2.4, indexed by hue bin. Content only; never decides a UI colour. */
export const COLOUR_NAMES: readonly { en: string; ro: string }[] = [
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

/** The name of a reading with no vivid pixels (bin null). */
export const NIGHT_GLASS = { en: "Night glass", ro: "Sticlă de noapte" } as const;

export function colourName(bin: number | null, lang: "en" | "ro" = "en"): string {
  return (bin === null ? NIGHT_GLASS : COLOUR_NAMES[bin])[lang];
}
