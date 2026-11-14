import { z } from "zod";

/** Language code -> text. `en` is the fallback. An empty string counts as missing. */
export const Text = z.record(z.string(), z.string());
export type Text = z.infer<typeof Text>;

export const Fact = z.object({ text: z.string(), source: z.string() });
export const TapToAsk = z.object({ id: z.string().min(1), q: Text, a: Text });
/** `file` is relative to /archive/ on the web. */
export const ArchiveImage = z.object({ id: z.string().min(1), file: z.string().min(1), alt: Text, credit: z.string(), year: z.string() });

/** `persona:` of a persona site. Reaches the `sites` table through `toSiteRow`. */
export const PersonaContent = z.looseObject({
  name: Text.optional(),
  voice: z.string().optional(),
  traits: z.string().optional(),
  first_message: Text.optional(),
  cathedral_line: Text.optional(),
  tap_to_ask: z.array(TapToAsk).optional(),
  archive: z.array(ArchiveImage).optional(),
});
export type PersonaContent = z.infer<typeof PersonaContent>;

export const Narration = z.object({ id: z.string().min(1), title: Text, text: Text, source: z.string() });

/** Top-level keys of the memorial site file. Read by the publish script only. */
export const MemorialContent = z.looseObject({
  narrator_voice: z.string().optional(),
  narrations: z.array(Narration).optional(),
});
export type MemorialContent = z.infer<typeof MemorialContent>;
