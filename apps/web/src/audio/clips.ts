import clipsJson from "./clips.json";
import picksJson from "./picks.json";

export type ArchiveImage = { id: string; file: string; alt: Record<string, string>; credit: string; year: string };
/** File paths under `apps/web/public/audio/`, served at `AUDIO_BASE`. Keep in step with `SiteClips` in `apps/api/src/publish/`. */
export type SiteClips = {
  beds: string[]; // take 1 first
  greeting: Record<string, string>; // lang -> file
  answers: Record<string, Record<string, string>>; // tap_to_ask id -> lang -> file
  narrations: Record<string, Record<string, string>>; // narration id -> lang -> file
  tapToAsk: { id: string; q: Record<string, string>; a: Record<string, string> }[]; // persona.tap_to_ask text, file order
  archive: ArchiveImage[]; // persona.archive, file order; `file` is relative to /archive/
};
export type ProjectClips = { glass?: string; crackle?: string; chime?: string; waltz: string[] };
export type Clips = { sites: Record<string, SiteClips>; project: ProjectClips };

export const AUDIO_BASE = "/audio/";
export const clips = clipsJson as Clips;
/** Hand-edited by Patrick after listening (Checkpoint 2 line 5): site id -> take 1 or 2. Without a pick, take 1 plays. */
export const picks = picksJson as Record<string, 1 | 2>;
