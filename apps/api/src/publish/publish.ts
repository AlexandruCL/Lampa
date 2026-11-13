import { createHash } from "node:crypto";
import { MemorialContent, PersonaContent } from "../content.js";
import type { SiteFile } from "../db/seed.js";

export const API = "https://api.elevenlabs.io/v1";
export const TTS_MODEL = "eleven_v3";
export const SFX_MODEL = "eleven_text_to_sound_v2";
export const MUSIC_MODEL = "music_v2_5";
export const SPEECH_FORMAT = "mp3_44100_128";
export const BED_FORMAT = "wav_24000";
export const BED_SECONDS = 15;
export const BED_TAKES = 2;
export const TTS_TIMEOUT_MS = 60000;
export const SFX_TIMEOUT_MS = 60000;
export const MUSIC_TIMEOUT_MS = 180000;
export const CREDITS_PER_CHAR = 1;
export const CREDITS_PER_SFX_SECOND = 40;
export const CREDITS_PER_MUSIC_MINUTE = 2727;
export const MAX_CREDITS_DEFAULT = 6000;

type ProjectName = "glass" | "crackle" | "chime" | "waltz";
export const PROJECT_SOUNDS: { name: ProjectName; kind: "sfx" | "music"; seconds: number; takes: number; prompt: string }[] = [
  { name: "glass", kind: "sfx", seconds: 3, takes: 1, prompt: "single soft glass bell note, clear, long gentle decay" },
  {
    name: "crackle",
    kind: "sfx",
    seconds: 4,
    takes: 1,
    prompt:
      "a 19th-century gas street lamp being lit: match strike, soft gas whoosh, gentle crackle settling into a low warm hum",
  },
  { name: "chime", kind: "sfx", seconds: 2, takes: 1, prompt: "soft warm two-note glass chime, gentle, short decay, no reverb tail" },
  { name: "waltz", kind: "music", seconds: 45, takes: 2, prompt: "1880s Viennese waltz, small salon orchestra, warm, wonder, slow crescendo" },
];

export type PublishOpts = {
  fetch: typeof fetch;
  apiKey: string;
  exists: (file: string) => boolean;
  put: (file: string, bytes: Uint8Array) => void;
  run: boolean;
  maxCredits: number;
};
export type PlanItem = { file: string; credits: number; state: "exists" | "new" | "skipped"; reason?: string };
export type PublishResult = {
  items: PlanItem[];
  newCredits: number;
  outcome: "dry" | "done" | "over_cap" | "failed";
  failed?: { file: string; status: number | "error" };
};

/** File paths under `apps/web/public/audio/`. Keep in step with `SiteClips` in `apps/web/src/audio/clips.ts`. */
export type SiteClips = {
  beds: string[]; // take 1 first
  greeting: Record<string, string>; // lang -> file
  answers: Record<string, Record<string, string>>; // tap_to_ask id -> lang -> file
  narrations: Record<string, Record<string, string>>; // narration id -> lang -> file
  tapToAsk: { id: string; q: Record<string, string>; a: Record<string, string> }[]; // persona.tap_to_ask text, file order
};
type ProjectClips = { glass?: string; crackle?: string; chime?: string; waltz: string[] };

type Job = {
  file: string;
  credits: number;
  reason?: string;
  path: string;
  query: string;
  body: Record<string, unknown>;
  timeoutMs: number;
  // where toClips puts the file
  slot: { kind: "bed" | "greeting" | "answer" | "narration" | ProjectName; id?: string; lang?: string };
};

function hash(path: string, query: string, body: unknown, take: number): string {
  return createHash("sha256").update(JSON.stringify([path, query, body, take])).digest("hex").slice(0, 12);
}

function job(
  stem: string,
  ext: string,
  take: number,
  path: string,
  format: string,
  body: Record<string, unknown>,
  credits: number,
  timeoutMs: number,
  slot: Job["slot"],
  reason?: string,
): Job {
  const query = `output_format=${format}`;
  return { file: `${stem}-${hash(path, query, body, take)}.${ext}`, credits, reason, path, query, body, timeoutMs, slot };
}

function speech(siteId: string, stem: string, voice: string | undefined, text: string, slot: Job["slot"]): Job {
  const reason = !voice ? "no voice" : !text ? "no text" : undefined;
  const body = { text, model_id: TTS_MODEL };
  const credits = [...text].length * CREDITS_PER_CHAR;
  return job(`${siteId}/${stem}`, "mp3", 1, `/text-to-speech/${voice ?? ""}`, SPEECH_FORMAT, body, credits, TTS_TIMEOUT_MS, slot, reason);
}

function sfx(stem: string, take: number, text: string, seconds: number, loop: boolean, format: string, slot: Job["slot"], reason?: string): Job {
  const body = { text, model_id: SFX_MODEL, duration_seconds: seconds, loop };
  const ext = format.startsWith("wav") ? "wav" : "mp3";
  return job(`${stem}-${take}`, ext, take, "/sound-generation", format, body, seconds * CREDITS_PER_SFX_SECOND, SFX_TIMEOUT_MS, slot, reason);
}

function planSite(site: SiteFile): Job[] {
  const id = site.id;
  const jobs: Job[] = [];
  if (site.is_memorial) {
    const memorial = MemorialContent.parse(site);
    for (const n of memorial.narrations ?? [])
      for (const [lang, text] of Object.entries(n.text))
        jobs.push(speech(id, `narration-${n.id}-${lang}`, memorial.narrator_voice, text, { kind: "narration", id: n.id, lang }));
  } else {
    const persona = PersonaContent.parse(site.persona);
    for (const [lang, text] of Object.entries(persona.first_message ?? {}))
      jobs.push(speech(id, `greeting-${lang}`, persona.voice, text, { kind: "greeting", lang }));
    for (const t of persona.tap_to_ask ?? [])
      for (const [lang, text] of Object.entries(t.a))
        jobs.push(speech(id, `answer-${t.id}-${lang}`, persona.voice, text, { kind: "answer", id: t.id, lang }));
  }
  for (let take = 1; take <= BED_TAKES; take++)
    jobs.push(
      sfx(`${id}/bed`, take, site.sound_bed, BED_SECONDS, true, BED_FORMAT, { kind: "bed" }, site.sound_bed ? undefined : "no sound_bed"),
    );
  return jobs;
}

function planProject(): Job[] {
  const jobs: Job[] = [];
  for (const s of PROJECT_SOUNDS)
    for (let take = 1; take <= s.takes; take++) {
      if (s.kind === "sfx") {
        jobs.push(sfx(`project/${s.name}`, take, s.prompt, s.seconds, false, SPEECH_FORMAT, { kind: s.name }));
        continue;
      }
      const body = { prompt: s.prompt, music_length_ms: s.seconds * 1000, model_id: MUSIC_MODEL };
      const credits = Math.ceil((s.seconds / 60) * CREDITS_PER_MUSIC_MINUTE);
      jobs.push(job(`project/${s.name}-${take}`, "mp3", take, "/music", SPEECH_FORMAT, body, credits, MUSIC_TIMEOUT_MS, { kind: s.name }));
    }
  return jobs;
}

async function publish(jobs: Job[], opts: PublishOpts): Promise<PublishResult> {
  const items: PlanItem[] = jobs.map((j) => ({
    file: j.file,
    credits: j.credits,
    state: j.reason ? "skipped" : opts.exists(j.file) ? "exists" : "new",
    ...(j.reason ? { reason: j.reason } : {}),
  }));
  const todo = jobs.filter((_, i) => items[i]!.state === "new");
  const newCredits = todo.reduce((sum, j) => sum + j.credits, 0);
  if (!opts.run) return { items, newCredits, outcome: "dry" };
  if (newCredits > opts.maxCredits) return { items, newCredits, outcome: "over_cap" };
  for (const j of todo) {
    let status: number | "error";
    try {
      const res = await opts.fetch(`${API}${j.path}?${j.query}`, {
        method: "POST",
        headers: { "xi-api-key": opts.apiKey, "content-type": "application/json" },
        body: JSON.stringify(j.body),
        signal: AbortSignal.timeout(j.timeoutMs),
      });
      status = res.status;
      if (status === 200) {
        opts.put(j.file, new Uint8Array(await res.arrayBuffer()));
        continue;
      }
    } catch {
      status = "error"; // no upstream message: it may echo the request
    }
    return { items, newCredits, outcome: "failed", failed: { file: j.file, status } };
  }
  return { items, newCredits, outcome: "done" };
}

// async so a malformed site file rejects instead of throwing synchronously
export async function publishSite(site: SiteFile, opts: PublishOpts): Promise<PublishResult> {
  return publish(planSite(site), opts);
}

export async function publishProject(opts: PublishOpts): Promise<PublishResult> {
  return publish(planProject(), opts);
}

export function toClips(
  sites: SiteFile[],
  exists: (file: string) => boolean,
): { sites: Record<string, SiteClips>; project: ProjectClips } {
  const out: { sites: Record<string, SiteClips>; project: ProjectClips } = { sites: {}, project: { waltz: [] } };
  for (const site of sites) {
    // the text goes in whether or not a clip exists: Talk speaks it with the browser voice
    const persona = site.is_memorial ? undefined : PersonaContent.safeParse(site.persona).data;
    const c: SiteClips = { beds: [], greeting: {}, answers: {}, narrations: {}, tapToAsk: persona?.tap_to_ask ?? [] };
    for (const { file, reason, slot } of planSite(site)) {
      if (reason || !exists(file)) continue;
      if (slot.kind === "bed") c.beds.push(file);
      else if (slot.kind === "greeting") c.greeting[slot.lang!] = file;
      else if (slot.kind === "answer") (c.answers[slot.id!] ??= {})[slot.lang!] = file;
      else if (slot.kind === "narration") (c.narrations[slot.id!] ??= {})[slot.lang!] = file;
    }
    out.sites[site.id] = c;
  }
  for (const { file, slot } of planProject()) {
    if (!exists(file)) continue;
    if (slot.kind === "waltz") out.project.waltz.push(file);
    else if (slot.kind === "glass" || slot.kind === "crackle" || slot.kind === "chime") out.project[slot.kind] = file;
  }
  return out;
}
