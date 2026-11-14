import { createHash } from "node:crypto";
import { LAMP_TARGET, sites, type PulseLanguages, type PulseSummary } from "@lampa/shared";
import { LANGUAGE_NAMES } from "../agent/persona.js";
import { API, CREDITS_PER_CHAR, SPEECH_FORMAT, TTS_MODEL } from "./publish.js";

export const DIALOGUE_PATH = "/text-to-dialogue";
export const DIALOGUE_TIMEOUT_MS = 180000;
export const MAX_DIALOGUE_CHARS = 2000; // docs: total of inputs[].text at or below 2,000 per request
export const RADIO_MAX_CREDITS_DEFAULT = 2000;

export type RadioScript = { inputs: { text: string; voice_id: string }[]; chars: number };

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** English only (Template C without the echo line). The memorial is never a speaker and never named. */
export function radioScript(summary: PulseSummary, languages: PulseLanguages, voices: Record<string, string>): RadioScript {
  const lines: [string, string][] = [
    [
      "mx",
      `Good evening, this is Radio Lampa, from the museum. Today ${count(summary.visitorsToday, "person", "people")} came by and caught ${count(summary.coloursToday, "colour", "colours")}.`,
    ],
  ];

  // strict > from 0: the first in file order wins a tie, and all-zero glow names no one
  let busiest: (typeof sites)[number] | undefined;
  let top = 0;
  for (const s of sites) {
    if (s.is_memorial) continue;
    const g = summary.glow.find((x) => x.siteId === s.id)?.glow ?? 0;
    if (g > top) [busiest, top] = [s, g];
  }
  if (busiest)
    lines.push([busiest.id === "unirii" ? "victoriei" : "unirii", `${busiest.name} was the brightest of us tonight. Show-off.`]);

  const lamps = summary.lampsToday;
  lines.push([
    "victoriei",
    lamps >= LAMP_TARGET
      ? `${lamps} lamps lit today. In 1884 it took ${LAMP_TARGET}. Tonight, again.`
      : `${lamps} lamps lit today. ${LAMP_TARGET - lamps} short of 1884. Tomorrow.`,
  ]);

  const code = languages.languages[0]?.lang;
  if (code && Object.hasOwn(LANGUAGE_NAMES, code))
    lines.push(["bastion", `Most of you spoke ${LANGUAGE_NAMES[code as keyof typeof LANGUAGE_NAMES]} to us.`]);

  lines.push(["mx", "Good night, Timișoara. Keep us lit."]);

  const inputs = lines.map(([id, text]) => {
    const voice_id = voices[id];
    if (!voice_id) throw new Error(`missing voice ${id}`);
    return { text, voice_id };
  });
  return { inputs, chars: inputs.reduce((n, i) => n + [...i.text].length, 0) };
}

export const radioCredits = (script: RadioScript) => script.chars * CREDITS_PER_CHAR;

function request(script: RadioScript) {
  const query = `output_format=${SPEECH_FORMAT}`;
  const body = { inputs: script.inputs, model_id: TTS_MODEL };
  // same name scheme as publish.ts: first 12 hex of sha256 of [path, query, body, take]
  const hash = createHash("sha256").update(JSON.stringify([DIALOGUE_PATH, query, body, 1])).digest("hex").slice(0, 12);
  return { query, body, file: `project/radio-1-${hash}.mp3` };
}

export type RadioOpts = {
  fetch: typeof fetch;
  apiKey: string;
  put: (file: string, bytes: Uint8Array) => void;
  maxCredits: number;
};
export type RadioResult = { file: string; credits: number; outcome: "done" | "over_cap" | "too_long" | "failed"; status?: number | "error" };

export async function makeRadio(script: RadioScript, opts: RadioOpts): Promise<RadioResult> {
  const { query, body, file } = request(script);
  const credits = radioCredits(script);
  if (script.chars > MAX_DIALOGUE_CHARS) return { file, credits, outcome: "too_long" };
  if (credits > opts.maxCredits) return { file, credits, outcome: "over_cap" };
  let status: number | "error";
  try {
    const res = await opts.fetch(`${API}${DIALOGUE_PATH}?${query}`, {
      method: "POST",
      headers: { "xi-api-key": opts.apiKey, "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(DIALOGUE_TIMEOUT_MS),
    });
    status = res.status;
    if (status === 200) {
      opts.put(file, new Uint8Array(await res.arrayBuffer()));
      return { file, credits, outcome: "done" };
    }
  } catch {
    status = "error"; // no upstream message: it may echo the request
  }
  return { file, credits, outcome: "failed", status };
}
