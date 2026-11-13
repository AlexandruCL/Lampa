import { EchoAccepted, EchoFields } from "@lampa/shared";
import { ApiError } from "../api/client";
import { authFetch } from "../session";
import type { Recording } from "./recording";

export function echoFileName(mimeType: "audio/webm" | "audio/mp4"): string {
  return mimeType === "audio/mp4" ? "echo.mp4" : "echo.webm";
}

/** Builds the POST /echoes form; throws a ZodError (before any send) when the text fields break the contract. */
export function toEchoForm(recording: Recording, siteId: string, prompt?: string): FormData {
  const durationMs = String(recording.durationMs);
  EchoFields.parse({ siteId, consent: "true", durationMs, prompt });

  const form = new FormData();
  form.append("audio", recording.blob, echoFileName(recording.mimeType));
  form.append("siteId", siteId);
  form.append("consent", "true");
  form.append("durationMs", durationMs);
  if (prompt !== undefined) form.append("prompt", prompt);
  return form;
}

/** One request per call, never retried (Ionut, hour 7). No Content-Type: the browser writes the multipart boundary. */
export async function sendEcho(form: FormData): Promise<EchoAccepted> {
  const res = await authFetch("/echoes", { method: "POST", body: form });
  if (!res.ok) throw new ApiError(res.status);
  return EchoAccepted.parse(await res.json());
}
