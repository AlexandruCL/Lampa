import { GlowMessage } from "@lampa/shared";
import { LANG, t, type Key, type Lang } from "../i18n/t";
import { glowWord } from "../screen/glow";

const WORD_KEY: Record<ReturnType<typeof glowWord>, Key> = {
  Asleep: "glow.asleep",
  Waking: "glow.waking",
  Awake: "glow.awake",
  "Fully lit": "glow.fully_lit",
};

/** The word of `glow` as shown, in `lang`. */
export const glowLabel = (glow: number, lang: Lang = LANG): string => t(WORD_KEY[glowWord(glow)], {}, lang);

/** "Awake, 72%" (DESIGN.md 6.5) */
export function glowLine(glow: number, lang: Lang = LANG): string {
  return `${glowLabel(glow, lang)}, ${Math.round(glow * 100)}%`;
}

/** The glow of one site in a socket `glow` message, or undefined when the message is invalid or leaves the site out. */
export function siteGlow(message: unknown, siteId: string): number | undefined {
  const parsed = GlowMessage.safeParse(message);
  return parsed.success ? parsed.data.sites.find((s) => s.siteId === siteId)?.glow : undefined;
}
