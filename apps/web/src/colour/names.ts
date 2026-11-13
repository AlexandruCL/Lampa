import { COLOUR_NAMES, NIGHT_GLASS } from "@lampa/shared";

/** Colour names of DESIGN.md 2.4, indexed by hue bin; one copy, in `@lampa/shared`. */
export { COLOUR_NAMES, NIGHT_GLASS };

/** The name of a reading by its bin; null is night glass. */
export function colourName(bin: number | null, lang: "en" | "ro" = "en"): string {
  return (bin === null ? NIGHT_GLASS : COLOUR_NAMES[bin]!)[lang];
}
