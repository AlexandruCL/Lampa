import type { Db } from "../seam.js";

export const SCRIBE_URL = "https://api.elevenlabs.io/v1/speech-to-text";
export const SCRIBE_MODEL = "scribe_v3";
export const SCRIBE_TIMEOUT_MS = 30_000;

export const UPDATE_TRANSCRIPT = "UPDATE echoes SET transcript = $2, lang = $3 WHERE id = $1";

/** Stores Scribe's transcript and language on the echo; on any failure leaves both null. Never throws. */
export async function transcribe(deps: { db: Db; fetch: typeof fetch }, echoId: string, audio: Blob): Promise<void> {
  // Only the echo id and a status are logged: never the key, the audio or the transcript.
  const fail = (status: string | number) => console.error(`scribe failed for echo ${echoId}: ${status}`);
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return fail("no_key");

  let body: { text?: unknown; language_code?: unknown } | null;
  try {
    const form = new FormData();
    form.set("model_id", SCRIBE_MODEL);
    form.set("file", audio);
    const res = await deps.fetch(SCRIBE_URL, {
      method: "POST",
      headers: { "xi-api-key": key },
      body: form,
      signal: AbortSignal.timeout(SCRIBE_TIMEOUT_MS),
    });
    if (res.status !== 200) return fail(res.status);
    body = await res.json().catch(() => null);
  } catch (err) {
    return fail(err instanceof Error && err.name === "TimeoutError" ? "timeout" : "network");
  }
  if (!body || typeof body.text !== "string") return fail("no_text");
  const lang = typeof body.language_code === "string" ? body.language_code : null;
  try {
    await deps.db.query(UPDATE_TRANSCRIPT, [echoId, body.text, lang]);
  } catch {
    fail("db");
  }
}
