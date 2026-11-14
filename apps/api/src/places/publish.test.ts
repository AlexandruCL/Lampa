import { afterEach, describe, expect, it, vi } from "vitest";
import type { PlaceIn } from "@lampa/shared";
import { NEW_PLACE_VOICE, placeSiteFile } from "./content.js";
import { INSERT_SITE_BLOB, SELECT_SITE_KEYS, runStep } from "./publish.js";

const KEY = "sk_test_never_logged";
const PLACE: PlaceIn = {
  name: { ro: "Bastionul Theresia", en: "Theresia Bastion" },
  lat: 45.7537,
  lng: 21.2317,
  facts: [
    { text: "The bastion is the largest remaining piece of the city walls.", source: "https://example.org/a" },
    { text: "It was built in the eighteenth century by the Habsburgs.", source: "https://example.org/b" },
  ],
  persona: "An old brick wall that remembers the soldiers and the markets.",
  interactions: ["talk", "colours"],
};
const SITE = placeSiteFile("theresia-bastion", PLACE);

afterEach(() => vi.restoreAllMocks());

/** A blobs table in memory; failInsert makes every insert reject. */
function fakeDb(keys: string[] = [], { failInsert = false } = {}) {
  const stored = new Map<string, string>(keys.map((k) => [k, "audio/mpeg"]));
  const queries: { text: string; params: any[] }[] = [];
  let settled = 0;
  const db = {
    query: async (text: string, params: any[] = []) => {
      queries.push({ text, params });
      if (text === SELECT_SITE_KEYS) {
        const rows = [...stored.keys()].filter((k) => k.startsWith(params[0])).map((key) => ({ key }));
        return { rows, rowCount: rows.length };
      }
      if (text === INSERT_SITE_BLOB) {
        await new Promise((resolve) => setTimeout(resolve, 5));
        settled++;
        if (failInsert) throw new Error("insert failed");
        stored.set(params[0], params[1]);
        return { rows: [], rowCount: 1 };
      }
      throw new Error("unexpected query");
    },
  };
  return { db, stored, queries, settled: () => settled };
}

/** 200 with a few bytes, or the statuses given in order. */
function fakeFetch(statuses: number[] = []) {
  return vi.fn(async (_url: string | URL | Request, _init?: RequestInit) =>
    new Response(new Uint8Array([1, 2, 3]), { status: statuses.shift() ?? 200 }));
}

const urls = (f: ReturnType<typeof fakeFetch>) => f.mock.calls.map(([url]) => String(url));

describe("runStep", () => {
  it("the greeting step makes one clip per language and no bed", async () => {
    const d = fakeDb();
    const fetch = fakeFetch();
    const result = await runStep({ db: d.db, fetch, apiKey: KEY }, SITE, "greeting");
    expect(result.outcome).toBe("done");
    expect(urls(fetch)).toEqual([
      expect.stringContaining(`/text-to-speech/${NEW_PLACE_VOICE}?`),
      expect.stringContaining(`/text-to-speech/${NEW_PLACE_VOICE}?`),
    ]);
    expect([...d.stored.keys()].sort()).toEqual([
      expect.stringMatching(/^site-theresia-bastion_greeting-en-[0-9a-f]{12}\.mp3$/),
      expect.stringMatching(/^site-theresia-bastion_greeting-ro-[0-9a-f]{12}\.mp3$/),
    ]);
    expect([...d.stored.values()]).toEqual(["audio/mpeg", "audio/mpeg"]);
    expect(result.items.filter((i) => i.file.includes("/bed-")).map((i) => i.state)).toEqual(["skipped", "skipped"]);
  });

  it("the bed step makes two takes and no greeting", async () => {
    const d = fakeDb();
    const fetch = fakeFetch();
    const result = await runStep({ db: d.db, fetch, apiKey: KEY }, SITE, "bed");
    expect(result.outcome).toBe("done");
    expect(result.newCredits).toBe(1200);
    expect(urls(fetch)).toEqual([expect.stringContaining("/sound-generation?"), expect.stringContaining("/sound-generation?")]);
    expect([...d.stored.keys()].sort()).toEqual([
      expect.stringMatching(/^site-theresia-bastion_bed-1-[0-9a-f]{12}\.wav$/),
      expect.stringMatching(/^site-theresia-bastion_bed-2-[0-9a-f]{12}\.wav$/),
    ]);
    expect([...d.stored.values()]).toEqual(["audio/wav", "audio/wav"]);
    expect(result.items.filter((i) => i.file.includes("/greeting-")).map((i) => i.state)).toEqual(["skipped", "skipped"]);
  });

  it("files already in blobs are not fetched again", async () => {
    const first = fakeDb();
    await runStep({ db: first.db, fetch: fakeFetch(), apiKey: KEY }, SITE, "greeting");
    const d = fakeDb([...first.stored.keys()]);
    const fetch = fakeFetch();
    const result = await runStep({ db: d.db, fetch, apiKey: KEY }, SITE, "greeting");
    expect(result).toMatchObject({ outcome: "done", newCredits: 0 });
    expect(fetch).not.toHaveBeenCalled();
    expect(d.queries.filter((q) => q.text === SELECT_SITE_KEYS)).toEqual([
      { text: SELECT_SITE_KEYS, params: ["site-theresia-bastion_"] },
    ]);
  });

  it("a failed fetch keeps the files made before it", async () => {
    const d = fakeDb();
    const result = await runStep({ db: d.db, fetch: fakeFetch([200, 500]), apiKey: KEY }, SITE, "greeting");
    expect(result.outcome).toBe("failed");
    expect(result.failed?.status).toBe(500);
    expect(d.settled()).toBe(1);
    expect(d.stored.size).toBe(1);
  });

  it("an insert that fails makes the step failed", async () => {
    const d = fakeDb([], { failInsert: true });
    const result = await runStep({ db: d.db, fetch: fakeFetch(), apiKey: KEY }, SITE, "greeting");
    expect(result.outcome).toBe("failed");
    expect(result.failed).toEqual({ file: expect.stringMatching(/^theresia-bastion\/greeting-/), status: "error" });
  });

  it("the keys start with site- and hold no slash", async () => {
    const d = fakeDb();
    await runStep({ db: d.db, fetch: fakeFetch(), apiKey: KEY }, SITE, "greeting");
    await runStep({ db: d.db, fetch: fakeFetch(), apiKey: KEY }, SITE, "bed");
    expect(d.stored.size).toBe(4);
    for (const key of d.stored.keys()) {
      expect(key.startsWith("site-")).toBe(true);
      expect(key).not.toContain("/");
    }
  });

  it("over 2000 credits fetches nothing", async () => {
    const long = placeSiteFile("long", { ...PLACE, name: { ro: "x".repeat(2000), en: "y".repeat(2000) } });
    const d = fakeDb();
    const fetch = fakeFetch();
    const result = await runStep({ db: d.db, fetch, apiKey: KEY }, long, "greeting");
    expect(result.outcome).toBe("over_cap");
    expect(fetch).not.toHaveBeenCalled();
    expect(d.stored.size).toBe(0);
  });

  it("the key never appears in a log line", async () => {
    const lines: unknown[][] = [];
    for (const m of ["log", "info", "warn", "error", "debug"] as const)
      vi.spyOn(console, m).mockImplementation((...args: unknown[]) => void lines.push(args));
    const throwing = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      throw new Error("upstream said " + JSON.stringify(init?.headers));
    });
    await runStep({ db: fakeDb().db, fetch: throwing, apiKey: KEY }, SITE, "greeting");
    await runStep({ db: fakeDb([], { failInsert: true }).db, fetch: fakeFetch(), apiKey: KEY }, SITE, "bed");
    expect(throwing.mock.calls[0]![1]?.headers).toMatchObject({ "xi-api-key": KEY });
    expect(JSON.stringify(lines)).not.toContain(KEY);
  });
});
