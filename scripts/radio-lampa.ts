// Builds the Radio Lampa script from today's /pulse numbers; with --run, makes the one episode.
// Prints statuses, site ids, the script text, file names and credit numbers only, never the key, a voice id or a response body.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import process from "node:process";
import { parseArgs } from "node:util";
import { PulseLanguages, PulseSummary } from "@lampa/shared";
import type { z } from "zod";
import { PersonaContent } from "../apps/api/src/content.js";
import { parseSiteFile } from "../apps/api/src/db/seed.js";
import { makeRadio, radioCredits, radioScript, RADIO_MAX_CREDITS_DEFAULT } from "../apps/api/src/publish/radio.js";

const USAGE = "usage: npm run radio:lampa -- [--api <url>] [--run] [--max-credits <n>]";
const ROOT = join(__dirname, "..");
const SITES_DIR = join(ROOT, "content/sites");
const AUDIO_DIR = join(ROOT, "apps/web/public/audio");
const CLIPS_JSON = join(ROOT, "apps/web/src/audio/clips.json");
const PULSE_TIMEOUT_MS = 90000; // the free Render instance can take a minute to wake

function args() {
  try {
    const { values } = parseArgs({
      options: {
        api: { type: "string", default: "https://lampa-api-b45i.onrender.com" },
        run: { type: "boolean", default: false },
        "max-credits": { type: "string", default: String(RADIO_MAX_CREDITS_DEFAULT) },
      },
    });
    const maxCredits = Number(values["max-credits"]);
    if (!Number.isFinite(maxCredits) || maxCredits < 0) return null;
    return { api: values.api.replace(/\/+$/, ""), run: values.run, maxCredits };
  } catch {
    return null; // unknown option or missing value
  }
}

async function get<T>(api: string, path: string, schema: z.ZodType<T>): Promise<T | null> {
  let status: number | "error" = "error";
  try {
    const res = await fetch(`${api}${path}`, { signal: AbortSignal.timeout(PULSE_TIMEOUT_MS) });
    status = res.status;
    if (res.ok) {
      const parsed = schema.safeParse(await res.json());
      if (parsed.success) return parsed.data;
      console.log(`${path} ${status} unparsed`);
      return null;
    }
  } catch {
    // no message: it may echo the response
  }
  console.log(`${path} ${status}`);
  return null;
}

function readVoices(): Record<string, string> {
  const voices: Record<string, string> = {};
  for (const f of readdirSync(SITES_DIR).filter((f) => f.endsWith(".yaml"))) {
    const site = parseSiteFile(readFileSync(join(SITES_DIR, f), "utf8"));
    if (site.is_memorial) continue;
    const voice = PersonaContent.parse(site.persona).voice;
    if (voice) voices[site.id] = voice;
  }
  return voices;
}

// No top-level await: the root package is not "type": "module", so tsx emits CJS.
async function main(): Promise<number> {
  const a = args();
  if (!a) {
    console.log(USAGE);
    return 1;
  }
  const key = process.env.ELEVENLABS_API_KEY ?? "";
  if (a.run && !key) {
    console.log("missing ELEVENLABS_API_KEY");
    return 1;
  }

  const summary = await get(a.api, "/pulse/summary", PulseSummary);
  if (!summary) return 1;
  const languages = await get(a.api, "/pulse/languages", PulseLanguages);
  if (!languages) return 1;

  const voices = readVoices();
  let script;
  try {
    script = radioScript(summary, languages, voices);
  } catch (e) {
    // only our own "missing voice <id>" is safe to print
    console.log(e instanceof Error && e.message.startsWith("missing voice ") ? e.message : "script failed");
    return 1;
  }
  const ids = Object.fromEntries(Object.entries(voices).map(([id, v]) => [v, id]));
  for (const i of script.inputs) console.log(`${ids[i.voice_id]}: ${i.text}`);
  console.log(`chars ${script.chars}`);
  console.log(`estimate ${radioCredits(script)} credits`);
  if (!a.run) return 0;

  const r = await makeRadio(script, {
    fetch,
    apiKey: key,
    put: (file, bytes) => {
      const path = join(AUDIO_DIR, file);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, bytes);
    },
    maxCredits: a.maxCredits,
  });
  if (r.outcome === "too_long") console.log(`too long ${script.chars} > 2000 chars`);
  else if (r.outcome === "over_cap") console.log(`over cap ${r.credits} > ${a.maxCredits}`);
  else if (r.outcome === "failed") console.log(`failed ${r.file} ${r.status}`);
  if (r.outcome !== "done") return 1;

  const clips = JSON.parse(readFileSync(CLIPS_JSON, "utf8"));
  clips.project.radio = r.file; // every other key stays as it is
  writeFileSync(CLIPS_JSON, `${JSON.stringify(clips, null, 2)}\n`);
  console.log(`made ${r.file} ${r.credits}`);
  return 0;
}

main().then((code) => {
  process.exitCode = code;
});
