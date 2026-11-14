import { colourName } from "@lampa/shared";
import type { ArchiveImage } from "../audio/clips";
import { suggestNext } from "../nav/score";
import { visitedSites } from "../nav/visited";
import { SITES, type PhoneSite } from "../sites/sites";

export const LIGHT_OK = "ok";
export const LIGHT_UNKNOWN = "unknown colour";
export const LENS_CLOSED = "the visitor closed the lens";

/** The agent's `set_light` call as a tint (DESIGN 5.2: at most 25 % alpha), or null if the parameters are not valid. */
export function parseLight(params: unknown): { hex: string; alpha: number } | null {
  if (typeof params !== "object" || params === null) return null;
  const { color, intensity } = params as Record<string, unknown>;
  if (typeof color !== "string" || !/^#[0-9a-fA-F]{6}$/.test(color)) return null;
  if (typeof intensity !== "number" || !Number.isFinite(intensity)) return null;
  return { hex: color, alpha: Math.min(Math.max(intensity, 0), 1) * 0.25 };
}

/** The line sent to the agent when the visitor catches a colour (concept Sketch 2). */
export const caughtLine = (hex: string): string => `caught ${colourName(hex).en} (${hex})`;

export const IMAGE_SHOWN = "shown";
export const NO_SUCH_IMAGE = "no such image";
export const ECHO_OPENED = "opened";
export const NO_NEXT_SITE = "no other site";
/** Ends a hand-off tool's session this long after the call when no agent turn starts (Patrick, hour 24). */
export const TOOL_END_CAP_MS = 8000;
/** The wait for the next site's directions hint (Patrick, hour 24). */
export const HINT_MS = 3000;

/** `show_archive_image({ image_id })`: the site's archive image with that id, or null. */
export function findImage(archive: readonly ArchiveImage[], params: unknown): ArchiveImage | null {
  const id = typeof params === "object" && params !== null ? (params as Record<string, unknown>).image_id : undefined;
  return (typeof id === "string" && archive.find((a) => a.id === id)) || null;
}

/** `start_echo_recording({ prompt })`: the persona's prompt, or undefined for the recorder's own line. */
export function parsePrompt(params: unknown): string | undefined {
  const p = typeof params === "object" && params !== null ? (params as Record<string, unknown>).prompt : undefined;
  return typeof p === "string" && p.trim() ? p.trim() : undefined;
}

/** `suggest_next_site()`: ranked from where the visitor stands, this site, with no glow (Patrick, hour 24). */
export function nextSiteFrom(site: PhoneSite): PhoneSite | null {
  return (
    suggestNext({
      sites: SITES.filter((s) => s.id !== site.id),
      position: { lat: site.lat, lng: site.lng },
      glow: null,
      visited: visitedSites(),
    }).suggestion?.site ?? null
  );
}

/** The line the agent reads for the next site; the name alone when there is no hint. */
export const nextSiteLine = (name: string, hint: string | null): string => (hint ? `${name}: ${hint}` : name);

/**
 * A hand-off tool ends the session when the agent's next speaking turn finishes,
 * or TOOL_END_CAP_MS after the call if no turn has started.
 */
export function shouldEnd({ calledAt, sawSpeaking, speaking, now }: { calledAt: number; sawSpeaking: boolean; speaking: boolean; now: number }): boolean {
  return sawSpeaking ? !speaking : now - calledAt >= TOOL_END_CAP_MS;
}
