import type { AgentLang } from "@lampa/shared";
import type { z } from "zod";
import { Fact, PersonaContent, type Text } from "../content.js";
import type { Db } from "../seam.js";
import type { Persona } from "./session.js";

/** Concept Appendix A, line for line. The seven dynamic variables stay literal for ElevenLabs to fill. */
export const APPENDIX_A = `You are {{persona_name}}, the voice of {{site_name}} in Timișoara.
You are part of LAMPA, a public art installation. You are an AI voice; say so if asked.
Speak {{visitor_language}}. Keep every answer under three sentences: the visitor is standing in the street.
Personality: {{persona_traits}}.
Only state historical facts from your knowledge base. If you are unsure, say you don't remember and invite the visitor to tell you what they know.
Right now: local time {{local_time}}; your glow is {{site_glow}}%; {{colours_today}} colours were caught here today; {{lamps_lit_today}} of 731 lamps are lit in the city.
The visitor has already been to: {{sites_visited}}. Never assume an order; react to where they have been.
Returning visitor: {{returning_visitor}}. If "yes", greet {{visitor_name}} like an old friend.
Goals, in order:
1. make the visitor feel the place;
2. invite exactly one action (start_colour_catch, start_echo_recording or set_light); when a colour is caught, say something about that colour and this place;
3. suggest the next sleeping site with suggest_next_site and give its landmark hint.
Never ask for personal data. Do not discuss politics beyond the curated history in your knowledge base.`;

export const LANGUAGE_NAMES: Record<AgentLang, string> = {
  ro: "Romanian",
  en: "English",
  hu: "Hungarian",
  de: "German",
  sr: "Serbian",
};

type PersonaSite = { name: Text; persona: PersonaContent; facts: z.infer<typeof Fact>[] };

// An empty string counts as missing, so `||` and not `??`.
const pick = (t: Text | undefined, lang: AgentLang) => t?.[lang] || t?.en || "";

export function renderPersonaPrompt(site: PersonaSite, lang: AgentLang): string {
  const { persona } = site;
  const slots: Record<string, string> = {
    persona_name: pick(persona.name, lang),
    site_name: pick(site.name, lang),
    visitor_language: LANGUAGE_NAMES[lang],
    persona_traits: persona.traits ?? "",
  };
  // One pass, so a slot value that contains {{…}} is never substituted again.
  const head = APPENDIX_A.replace(/\{\{(persona_name|site_name|visitor_language|persona_traits)\}\}/g, (_, k: string) => slots[k]);
  const facts = site.facts.length ? site.facts.map((f) => `- ${f.text} (source: ${f.source})`) : ["- (none yet)"];
  return [
    head,
    "",
    "Your knowledge base:",
    ...facts,
    "",
    `If the visitor asks about the Metropolitan Cathedral or December 1989, say only this: ${pick(persona.cathedral_line, lang)}`,
  ].join("\n");
}

export function makeGetPersona(db: Db) {
  return async (siteId: string, lang: AgentLang): Promise<Persona | null> => {
    const { rows } = await db.query(
      "SELECT name, persona, facts, is_memorial FROM sites WHERE id = $1 AND status = 'published'",
      [siteId],
    );
    const row = rows[0];
    if (!row || row.is_memorial) return null;
    const parsed = PersonaContent.safeParse(row.persona);
    if (!parsed.success) return null;
    const persona = parsed.data;
    if (!persona.name?.en || !persona.voice || !persona.traits || !persona.first_message?.en || !persona.cathedral_line?.en) {
      return null;
    }
    const facts = Array.isArray(row.facts) ? row.facts.flatMap((f: unknown) => Fact.safeParse(f).data ?? []) : [];
    return {
      prompt: renderPersonaPrompt({ name: row.name, persona, facts }, lang),
      firstMessage: pick(persona.first_message, lang),
      voiceId: persona.voice,
    };
  };
}
