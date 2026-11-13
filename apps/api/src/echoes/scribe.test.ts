import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SCRIBE_MODEL, SCRIBE_URL, UPDATE_TRANSCRIPT, transcribe } from "./scribe.js";

const KEY = "sk-test-scribe-key-0123456789";
const ECHO_ID = "6f1c2a3b-0000-4000-8000-000000000001";
const AUDIO = new Blob([new Uint8Array([1, 2, 3])], { type: "audio/webm" });

let errors: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  process.env.ELEVENLABS_API_KEY = KEY;
  errors = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  delete process.env.ELEVENLABS_API_KEY;
  vi.restoreAllMocks();
});

function fakeDb(fail?: Error) {
  const calls: { text: string; params: any[] }[] = [];
  return {
    calls,
    db: {
      query: async (text: string, params?: unknown[]) => {
        calls.push({ text, params: params as any[] });
        if (fail) throw fail;
        return { rows: [], rowCount: 1 };
      },
    },
  };
}

const answer = (status: number, body: unknown) => vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;

describe("transcribe", () => {
  it("no key makes no call", async () => {
    delete process.env.ELEVENLABS_API_KEY;
    const fetch = answer(200, { text: "hi", language_code: "ro" });
    const f = fakeDb();
    await transcribe({ db: f.db, fetch }, ECHO_ID, AUDIO);
    expect(fetch).not.toHaveBeenCalled();
    expect(f.calls).toHaveLength(0);
  });

  it("a 200 stores the text and the language code", async () => {
    const f = fakeDb();
    await transcribe({ db: f.db, fetch: answer(200, { text: "Aici am stat.", language_code: "ron" }) }, ECHO_ID, AUDIO);
    expect(f.calls).toEqual([{ text: UPDATE_TRANSCRIPT, params: [ECHO_ID, "Aici am stat.", "ron"] }]);
  });

  it("the request sends scribe_v3 and the key header", async () => {
    const fetch = answer(200, { text: "hi", language_code: "en" });
    await transcribe({ db: fakeDb().db, fetch }, ECHO_ID, AUDIO);
    const [url, init] = vi.mocked(fetch).mock.calls[0]!;
    expect(url).toBe(SCRIBE_URL);
    expect(init!.method).toBe("POST");
    expect(init!.headers).toEqual({ "xi-api-key": KEY });
    expect(init!.signal).toBeInstanceOf(AbortSignal);
    const form = init!.body as FormData;
    expect(form.get("model_id")).toBe(SCRIBE_MODEL);
    expect(SCRIBE_MODEL).toBe("scribe_v3");
    expect(form.get("file")).toBeInstanceOf(Blob);
  });

  it("a 401 stores nothing and does not throw", async () => {
    const f = fakeDb();
    await expect(transcribe({ db: f.db, fetch: answer(401, { detail: "invalid key" }) }, ECHO_ID, AUDIO)).resolves.toBeUndefined();
    expect(f.calls).toHaveLength(0);
    expect(errors).toHaveBeenCalledWith(`scribe failed for echo ${ECHO_ID}: 401`);
  });

  it("a network error stores nothing and does not throw", async () => {
    const f = fakeDb();
    const failing = vi.fn(async () => { throw new TypeError("fetch failed"); }) as unknown as typeof fetch;
    await expect(transcribe({ db: f.db, fetch: failing }, ECHO_ID, AUDIO)).resolves.toBeUndefined();
    expect(f.calls).toHaveLength(0);
    expect(errors).toHaveBeenCalledWith(`scribe failed for echo ${ECHO_ID}: network`);
  });

  it("a body without text stores nothing", async () => {
    const f = fakeDb();
    await transcribe({ db: f.db, fetch: answer(200, { language_code: "en" }) }, ECHO_ID, AUDIO);
    expect(f.calls).toHaveLength(0);
    expect(errors).toHaveBeenCalledWith(`scribe failed for echo ${ECHO_ID}: no_text`);
  });

  it("the key never appears in a log line", async () => {
    const lines: string[] = [];
    const record = (...args: unknown[]) => void lines.push(args.map(String).join(" "));
    for (const method of ["log", "warn", "info", "error"] as const) vi.spyOn(console, method).mockImplementation(record);
    const leaky = vi.fn(async () => { throw new Error(`rejected key ${KEY}`); }) as unknown as typeof fetch;
    await transcribe({ db: fakeDb().db, fetch: leaky }, ECHO_ID, AUDIO);
    await transcribe({ db: fakeDb().db, fetch: answer(401, { detail: `bad key ${KEY}` }) }, ECHO_ID, AUDIO);
    await transcribe({ db: fakeDb(new Error(`db saw ${KEY}`)).db, fetch: answer(200, { text: "hi" }) }, ECHO_ID, AUDIO);
    expect(lines).toHaveLength(3);
    for (const line of lines) expect(line).not.toContain(KEY);
  });
});
