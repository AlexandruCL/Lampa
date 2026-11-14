import type { Db } from "../seam.js";
import type { SiteFile } from "../db/seed.js";
import { publishSite, type PublishResult } from "../publish/publish.js";
import { PLACE_MAX_CREDITS } from "./content.js";

export const SELECT_SITE_KEYS = "SELECT key FROM blobs WHERE starts_with(key, $1)";
export const DELETE_STALE_BLOBS = "DELETE FROM blobs WHERE starts_with(key, $1) AND key <> ALL($2::text[])";
export const INSERT_SITE_BLOB = "INSERT INTO blobs (key, content_type, data) VALUES ($1, $2, $3) ON CONFLICT (key) DO NOTHING";

export const siteBlobKey = (file: string) => "site-" + file.replaceAll("/", "_");

export type StepDeps = { db: Db; fetch: typeof fetch; apiKey: string };

export async function runStep(deps: StepDeps, site: SiteFile, step: "greeting" | "bed"): Promise<PublishResult> {
  const { voice: _voice, ...noVoice } = site.persona;
  const narrowed: SiteFile = step === "greeting" ? { ...site, sound_bed: "" } : { ...site, persona: noVoice };
  const { rows } = await deps.db.query(SELECT_SITE_KEYS, ["site-" + site.id + "_"]);
  const keys = new Set<string>(rows.map((r) => r.key));
  // Each insert resolves to its file name when it fails, so no rejection waits unhandled during the next fetch.
  const inserts: Promise<string | null>[] = [];
  const planned: string[] = [];
  const result = await publishSite(narrowed, {
    fetch: deps.fetch,
    apiKey: deps.apiKey,
    exists: (file) => {
      planned.push(siteBlobKey(file));
      return keys.has(siteBlobKey(file));
    },
    put: (file, bytes) => {
      const type = file.endsWith(".wav") ? "audio/wav" : "audio/mpeg";
      inserts.push(deps.db.query(INSERT_SITE_BLOB, [siteBlobKey(file), type, Buffer.from(bytes)]).then(() => null, () => file));
    },
    run: true,
    maxCredits: PLACE_MAX_CREDITS,
  });
  const lost = (await Promise.all(inserts)).find((file) => file !== null);
  if (lost) return { ...result, outcome: "failed", failed: { file: lost, status: "error" } };
  // A re-saved draft with a new name gets a new hash, and GET /sites/:id could still serve the old clip.
  if (result.outcome === "done")
    await deps.db
      .query(DELETE_STALE_BLOBS, ["site-" + site.id + "_" + step + "-", planned])
      .catch((err) => console.error("stale place blobs kept: " + (err instanceof Error ? err.message : "unknown")));
  return result;
}
