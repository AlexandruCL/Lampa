import { describe, expect, it } from "vitest";
import { SiteFile } from "../db/seed.js";
import { type PublishOpts, publishProject, publishSite, toClips } from "./publish.js";

// Made-up test text only.
const base = {
  city: "testville",
  location: { lat: 45.5, lng: 21.5 },
  radius_m: 40,
  interactions: ["talk"],
  glow_k: 10,
};

const persona = SiteFile.parse({
  ...base,
  id: "kiosk",
  name: { ro: "Chioșc", en: "Kiosk" },
  sound_bed: "light rain on a tin roof, distant tram bell",
  persona: {
    voice: "voiceKiosk01",
    first_message: { ro: "Bună, sunt chioșcul.", en: "Hello, I am the kiosk." },
    tap_to_ask: [{ id: "paint", q: { en: "Why green?" }, a: { ro: "Vopsea veche.", en: "Old paint." } }],
  },
});

const memorial = SiteFile.parse({
  ...base,
  id: "garden",
  name: { ro: "Grădina", en: "Garden" },
  is_memorial: true,
  sound_bed: "quiet wind through tall grass",
  narrator_voice: "voiceNarrator1",
  narrations: [{ id: "n1", title: { en: "Seeds" }, text: { ro: "Semințe.", en: "Seeds fall." }, source: "test" }],
});

function fakes(statuses: (number | "throw")[] = []) {
  const files = new Map<string, Uint8Array>();
  const calls: { url: string; init: RequestInit; body: Record<string, unknown> }[] = [];
  const fetch = (async (url: string, init: RequestInit) => {
    calls.push({ url, init, body: JSON.parse(init.body as string) });
    const s = statuses[calls.length - 1] ?? 200;
    if (s === "throw") throw new Error("socket closed");
    return new Response(new Uint8Array([1, 2, 3]), { status: s });
  }) as unknown as typeof globalThis.fetch;
  const opts = (o: Partial<PublishOpts> = {}): PublishOpts => ({
    fetch,
    apiKey: "test-key",
    exists: (f) => files.has(f),
    put: (f, b) => void files.set(f, b),
    run: true,
    maxCredits: 100000,
    ...o,
  });
  return { files, calls, opts };
}

const hashOf = (file: string) => file.match(/-([0-9a-f]{12})\.\w+$/)![1];

describe("publish", () => {
  it("a dry run makes no request", async () => {
    const { calls, files, opts } = fakes();
    const r = await publishSite(persona, opts({ run: false }));
    const p = await publishProject(opts({ run: false }));
    expect(calls).toHaveLength(0);
    expect(files.size).toBe(0);
    expect([r.outcome, p.outcome]).toEqual(["dry", "dry"]);
    expect(p.newCredits).toBe(4452); // 120 + 160 + 80 + 2 x ceil(0.75 x 2727)
  });

  it("plans greetings, answers and two bed takes per language", async () => {
    const { opts } = fakes();
    const r = await publishSite(persona, opts({ run: false }));
    expect(r.items.map((i) => i.file.replace(/-[0-9a-f]{12}\./, "."))).toEqual([
      "kiosk/greeting-ro.mp3",
      "kiosk/greeting-en.mp3",
      "kiosk/answer-paint-ro.mp3",
      "kiosk/answer-paint-en.mp3",
      "kiosk/bed-1.wav",
      "kiosk/bed-2.wav",
    ]);
    expect(r.items.every((i) => i.state === "new")).toBe(true);
    expect(r.items.map((i) => i.credits)).toEqual([20, 22, 13, 10, 600, 600]);
    expect(r.newCredits).toBe(1265);
  });

  it("plans narrations and no greeting for the memorial", async () => {
    const { opts } = fakes();
    const withPersona = SiteFile.parse({ ...memorial, persona: persona.persona });
    const r = await publishSite(withPersona, opts({ run: false }));
    expect(r.items.map((i) => i.file.replace(/-[0-9a-f]{12}\./, "."))).toEqual([
      "garden/narration-n1-ro.mp3",
      "garden/narration-n1-en.mp3",
      "garden/bed-1.wav",
      "garden/bed-2.wav",
    ]);
  });

  it("skips items without a voice or text and says why", async () => {
    const { calls, opts } = fakes();
    const site = SiteFile.parse({
      ...base,
      id: "bare",
      name: { ro: "Gol", en: "Bare" },
      persona: { voice: "", first_message: { en: "Hi." } },
    });
    const noText = SiteFile.parse({
      ...persona,
      persona: { voice: "voiceKiosk01", first_message: { en: "", ro: "Bună." } },
    });
    const noNarrator = SiteFile.parse({ ...memorial, narrator_voice: "" });
    const a = await publishSite(site, opts());
    const b = await publishSite(noText, opts({ run: false }));
    const c = await publishSite(noNarrator, opts({ run: false }));
    expect(a.items.map((i) => [i.state, i.reason])).toEqual([
      ["skipped", "no voice"],
      ["skipped", "no sound_bed"],
      ["skipped", "no sound_bed"],
    ]);
    expect(a.outcome).toBe("done");
    expect(calls).toHaveLength(0);
    expect(b.items.slice(0, 2).map((i) => [i.state, i.reason])).toEqual([
      ["skipped", "no text"],
      ["new", undefined],
    ]);
    expect(c.items.slice(0, 2).map((i) => i.reason)).toEqual(["no voice", "no voice"]);
  });

  it("a second run makes no request", async () => {
    const { calls, opts } = fakes();
    const first = await publishSite(persona, opts());
    expect(first.outcome).toBe("done");
    const made = calls.length;
    expect(made).toBe(6);
    const second = await publishSite(persona, opts());
    expect(calls).toHaveLength(made);
    expect(second.items.every((i) => i.state === "exists")).toBe(true);
    expect(second.newCredits).toBe(0);
  });

  it("take 1 and take 2 get different names and the same input the same name", async () => {
    const { opts } = fakes();
    const files = async (s: SiteFile) => (await publishSite(s, opts({ run: false }))).items.map((i) => i.file);
    const [bed1, bed2] = (await files(persona)).slice(4);
    expect(hashOf(bed1!)).not.toBe(hashOf(bed2!));
    expect(await files(persona)).toEqual(await files(SiteFile.parse(structuredClone(persona))));
    const changed = await files(SiteFile.parse({ ...persona, sound_bed: "dry leaves on stone" }));
    expect(hashOf(changed[4]!)).not.toBe(hashOf(bed1!));
    expect(changed.slice(0, 4)).toEqual((await files(persona)).slice(0, 4));
    const project = (await publishProject(opts({ run: false }))).items.map((i) => i.file);
    const waltz = project.filter((f) => f.startsWith("project/waltz-"));
    expect(waltz).toHaveLength(2);
    expect(hashOf(waltz[0]!)).not.toBe(hashOf(waltz[1]!));
  });

  it("over the cap makes no request", async () => {
    const { calls, files, opts } = fakes();
    const r = await publishSite(persona, opts({ maxCredits: 1264 }));
    expect(r.outcome).toBe("over_cap");
    expect(calls).toHaveLength(0);
    expect(files.size).toBe(0);
    const atCap = await publishSite(persona, opts({ maxCredits: 1265 }));
    expect(atCap.outcome).toBe("done");
  });

  it("stops at the first failed request and keeps what was made", async () => {
    const f = fakes([200, 500]);
    const r = await publishSite(persona, f.opts());
    expect(f.calls).toHaveLength(2);
    expect([...f.files.keys()]).toEqual([r.items[0]!.file]);
    expect(r).toMatchObject({ outcome: "failed", failed: { file: r.items[1]!.file, status: 500 } });

    const g = fakes([200, "throw"]);
    const s = await publishSite(persona, g.opts());
    expect(g.calls).toHaveLength(2);
    expect(g.files.size).toBe(1);
    expect(s.failed).toEqual({ file: s.items[1]!.file, status: "error" });

    // a body that breaks after a 200 is a failure, not a file
    const h = fakes();
    const broken = (async () => ({ status: 200, arrayBuffer: () => Promise.reject(new Error("reset")) })) as unknown as typeof fetch;
    const t = await publishSite(persona, h.opts({ fetch: broken }));
    expect(h.files.size).toBe(0);
    expect(t.failed).toEqual({ file: t.items[0]!.file, status: "error" });
    expect(JSON.stringify([r, s, t])).not.toContain("test-key");
  });

  it("sends the models, loop and duration the plan settles", async () => {
    const { calls, opts } = fakes();
    await publishSite(persona, opts());
    await publishSite(memorial, opts());
    await publishProject(opts());
    const sent = calls.map((c) => ({
      url: c.url,
      body: c.body,
      key: (c.init.headers as Record<string, string>)["xi-api-key"],
      signal: c.init.signal instanceof AbortSignal,
      method: c.init.method,
    }));
    expect(sent.every((s) => s.key === "test-key" && s.signal && s.method === "POST")).toBe(true);
    expect(sent[0]).toMatchObject({
      url: "https://api.elevenlabs.io/v1/text-to-speech/voiceKiosk01?output_format=mp3_44100_128",
      body: { text: "Bună, sunt chioșcul.", model_id: "eleven_v3" },
    });
    expect(sent[4]).toMatchObject({
      url: "https://api.elevenlabs.io/v1/sound-generation?output_format=wav_24000",
      body: { text: persona.sound_bed, model_id: "eleven_text_to_sound_v2", duration_seconds: 15, loop: true },
    });
    expect(sent[6]!.url).toBe("https://api.elevenlabs.io/v1/text-to-speech/voiceNarrator1?output_format=mp3_44100_128");
    const project = sent.slice(10);
    expect(project.map((s) => [s.url.replace("https://api.elevenlabs.io/v1", ""), s.body.model_id, s.body.loop, s.body.duration_seconds ?? s.body.music_length_ms])).toEqual([
      ["/sound-generation?output_format=mp3_44100_128", "eleven_text_to_sound_v2", false, 3],
      ["/sound-generation?output_format=mp3_44100_128", "eleven_text_to_sound_v2", false, 4],
      ["/sound-generation?output_format=mp3_44100_128", "eleven_text_to_sound_v2", false, 2],
      ["/music?output_format=mp3_44100_128", "music_v2_5", undefined, 45000],
      ["/music?output_format=mp3_44100_128", "music_v2_5", undefined, 45000],
    ]);
    expect(project[3]!.body).toEqual({
      prompt: "1880s Viennese waltz, small salon orchestra, warm, wonder, slow crescendo",
      music_length_ms: 45000,
      model_id: "music_v2_5",
    });
    expect(project.slice(0, 3).every((s) => (s.body.duration_seconds as number) <= 22)).toBe(true);
  });

  it("toClips lists only files that exist", async () => {
    const { files, opts } = fakes([200, 200, 200, 200, 200, 500]);
    const r = await publishSite(persona, opts());
    await publishSite(memorial, opts({ run: false }));
    const p = await publishProject(opts({ maxCredits: 100000 }));
    expect(p.outcome).toBe("done");
    const f = r.items.map((i) => i.file);
    const clips = toClips([persona, memorial], (file) => files.has(file));
    expect(clips.sites.kiosk).toEqual({
      beds: [f[4]],
      greeting: { ro: f[0], en: f[1] },
      answers: { paint: { ro: f[2], en: f[3] } },
      narrations: {},
      tapToAsk: persona.persona!.tap_to_ask,
      archive: [],
    });
    expect(clips.sites.garden).toEqual({ beds: [], greeting: {}, answers: {}, narrations: {}, tapToAsk: [], archive: [] });
    const pf = p.items.map((i) => i.file);
    expect(clips.project).toEqual({ glass: pf[0], crackle: pf[1], chime: pf[2], waltz: [pf[3], pf[4]] });
    expect(toClips([], () => false)).toEqual({ sites: {}, project: { waltz: [] } });
  });

  const twoQuestions = SiteFile.parse({
    ...persona,
    persona: {
      ...persona.persona,
      tap_to_ask: [
        { id: "roof", q: { ro: "De ce acoperiș?", en: "Why a roof?" }, a: { ro: "Pentru ploaie.", en: "For the rain." } },
        { id: "bell", q: { en: "Whose bell?" }, a: { en: "The tram's." } },
      ],
    },
  });

  it("toClips copies tap_to_ask text in file order", () => {
    expect(toClips([twoQuestions], () => true).sites.kiosk!.tapToAsk).toEqual([
      { id: "roof", q: { ro: "De ce acoperiș?", en: "Why a roof?" }, a: { ro: "Pentru ploaie.", en: "For the rain." } },
      { id: "bell", q: { en: "Whose bell?" }, a: { en: "The tram's." } },
    ]);
  });

  it("toClips gives [] without tap_to_ask", () => {
    const none = SiteFile.parse({ ...persona, persona: { voice: "voiceKiosk01", first_message: { en: "Hi." } } });
    const withPersona = SiteFile.parse({ ...memorial, persona: persona.persona });
    const clips = toClips([none, withPersona], () => true);
    expect(clips.sites.kiosk!.tapToAsk).toEqual([]);
    expect(clips.sites.garden!.tapToAsk).toEqual([]);
  });

  it("toClips keeps the text when the answer clip is missing", () => {
    const c = toClips([twoQuestions], (file) => !file.includes("/answer-")).sites.kiosk!;
    expect(c.answers).toEqual({});
    expect(c.tapToAsk.map((t) => t.id)).toEqual(["roof", "bell"]);
    expect(c.tapToAsk[0]!.a).toEqual({ ro: "Pentru ploaie.", en: "For the rain." });
  });

  it("toClips copies archive images in file order", () => {
    const archive = [
      { id: "stall", file: "kiosk/stall.jpg", alt: { en: "A green stall." }, credit: "Test archive", year: "1901" },
      { id: "awning", file: "kiosk/awning.jpg", alt: { ro: "O copertină.", en: "An awning." }, credit: "Test archive", year: "1910" },
    ];
    const site = SiteFile.parse({ ...persona, persona: { ...persona.persona, archive } });
    expect(toClips([site], () => true).sites.kiosk!.archive).toEqual(archive);
  });

  it("toClips gives [] without archive", () => {
    const withArchive = SiteFile.parse({
      ...memorial,
      persona: { ...persona.persona, archive: [{ id: "x", file: "x.jpg", alt: { en: "X." }, credit: "", year: "1900" }] },
    });
    const clips = toClips([persona, withArchive], () => true);
    expect(clips.sites.kiosk!.archive).toEqual([]);
    expect(clips.sites.garden!.archive).toEqual([]);
  });
});
