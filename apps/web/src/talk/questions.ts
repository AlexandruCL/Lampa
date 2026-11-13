import type { AgentLang } from "@lampa/shared";
import { type Clips, clips } from "../audio/clips";

export type Question = { id: string; q: string; a: string; file: string | null };

/** The site's tap-to-ask questions in file order, each string in `lang` else English; entries with no text are left out. */
export function questionsFor(siteId: string, lang: AgentLang, c: Clips = clips): Question[] {
  const site = c.sites[siteId];
  if (!site) return [];
  return site.tapToAsk.flatMap(({ id, q, a }) => {
    const qText = q[lang] || q.en;
    const aText = a[lang] || a.en;
    if (!qText || !aText) return [];
    const files = site.answers[id];
    return [{ id, q: qText, a: aText, file: files?.[lang] || files?.en || null }];
  });
}

/** The greeting clip in `lang` only: it must match the session's language, so no English fallback. */
export const greetingFor = (siteId: string, lang: AgentLang, c: Clips = clips): string | null =>
  c.sites[siteId]?.greeting[lang] || null;
