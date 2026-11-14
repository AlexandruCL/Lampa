import { AUDIO_BASE, clips, type Clips } from "../audio/clips";
import type { Lang } from "../i18n/t";

export type Testimony = { id: string; title: string; text: string; source: string; audio: string | null };

/** The site's testimonies in file order, in `lang` else English; an item with no English title, or no text at all, is left out. */
export function testimoniesFor(siteId: string, lang: Lang, c: Clips = clips): Testimony[] {
  const site = c.sites[siteId];
  return (site?.testimonies ?? []).flatMap((t) => {
    const text = t.text[lang] || t.text.en;
    if (!t.title.en || !text) return [];
    const file = site?.narrations[t.id]?.[lang] || site?.narrations[t.id]?.en;
    return [{ id: t.id, title: t.title[lang] || t.title.en, text, source: t.source, audio: file ? AUDIO_BASE + file : null }];
  });
}

/** Whole seconds as m:ss; 160 → "2:40". */
export function formatClock(seconds: number): string {
  const s = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
