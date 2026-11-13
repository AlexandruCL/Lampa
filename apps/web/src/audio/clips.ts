import clipsJson from "./clips.json";
import picksJson from "./picks.json";

/** File paths under `apps/web/public/audio/`, served at `AUDIO_BASE`. Keep in step with `SiteClips` in `apps/api/src/publish/`. */
export type SiteClips = {
  beds: string[]; // take 1 first
  greeting: Record<string, string>; // lang -> file
  answers: Record<string, Record<string, string>>; // tap_to_ask id -> lang -> file
  narrations: Record<string, Record<string, string>>; // narration id -> lang -> file
};
export type ProjectClips = { glass?: string; crackle?: string; chime?: string; waltz: string[] };
export type Clips = { sites: Record<string, SiteClips>; project: ProjectClips };

export const AUDIO_BASE = "/audio/";
export const clips = clipsJson as Clips;
/** Hand-edited by Patrick after listening (Checkpoint 2 line 5): site id -> take 1 or 2. Without a pick, take 1 plays. */
export const picks = picksJson as Record<string, 1 | 2>;
