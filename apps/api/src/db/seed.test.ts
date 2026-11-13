import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { INSERT_SITE, UPSERT_SITE, parseSiteFile, siteParams, toSiteRow, toSitesJson } from "./seed.js";

const minimal = `
id: demo
city: timisoara
name:
  ro: Demo
  en: Demo EN
location:
  lat: 45.5
  lng: 21.5
radius_m: 40
interactions: [talk]
glow_k: 10
`;

const root = join(import.meta.dirname, "..", "..", "..", "..");

describe("seed", () => {
  it("parses a minimal site file", () => {
    const f = parseSiteFile(minimal);
    expect(f.is_memorial).toBe(false);
    expect(f.persona).toEqual({});
    expect(f.facts).toEqual([]);
    expect(f.sound_bed).toBe("");
    expect(f.directions_hint).toEqual({});
    expect(f.active).toEqual({ from: null, until: null });
  });

  it("rejects a file with no location", () => {
    const text = minimal.replace(/location:\n {2}lat: 45.5\n {2}lng: 21.5\n/, "");
    expect(() => parseSiteFile(text)).toThrow();
  });

  it("keeps keys the schema does not name", () => {
    const f = parseSiteFile(`${minimal}publish_note: hello\n`);
    expect((f as Record<string, unknown>).publish_note).toBe("hello");
  });

  it("maps a site to its row with slug equal to id and lng before lat in the parameters", () => {
    const row = toSiteRow(parseSiteFile(minimal));
    expect(row.slug).toBe(row.id);
    const p = siteParams(row);
    expect(p).toHaveLength(15);
    expect(p[4]).toBe(21.5);
    expect(p[5]).toBe(45.5);
    expect(p[3]).toBe(JSON.stringify({ ro: "Demo", en: "Demo EN" }));
    expect(p[7]).toEqual(["talk"]);
    expect(INSERT_SITE).toContain("$15");
  });

  it("writes sites.json entries with the five Site fields only", () => {
    const f = parseSiteFile(minimal);
    expect(Object.keys(toSitesJson([f])[0]!)).toEqual(["id", "name", "lat", "lng", "is_memorial"]);
    expect(toSitesJson([f])[0]!.name).toBe("Demo EN");
  });

  it("the five files in content/sites give mx, unirii, victoriei, bastion, cathedral in order and match packages/shared/sites.json", () => {
    const dir = join(root, "content", "sites");
    const names = readdirSync(dir).filter((n) => n.endsWith(".yaml")).sort();
    const files = names.map((n) => parseSiteFile(readFileSync(join(dir, n), "utf8")));
    expect(files.map((f) => f.id)).toEqual(["mx", "unirii", "victoriei", "bastion", "cathedral"]);
    const onDisk = readFileSync(join(root, "packages", "shared", "sites.json"), "utf8").replace(/\r\n/g, "\n");
    expect(onDisk).toBe(JSON.stringify(toSitesJson(files), null, 2) + "\n");
  });

  it("UPSERT_SITE updates every inserted column but id", () => {
    const cols = /INSERT INTO sites \(([^)]*)\)/.exec(INSERT_SITE)![1]!.split(",").map((c) => c.trim());
    const set = UPSERT_SITE.split("DO UPDATE SET")[1]!;
    expect(UPSERT_SITE).toContain("ON CONFLICT (id) DO UPDATE SET");
    for (const c of cols.filter((c) => c !== "id")) expect(set).toContain(`${c} = EXCLUDED.${c}`);
    expect(set).not.toContain("id = EXCLUDED.id");
  });

  it("UPSERT_SITE takes the same parameters as INSERT_SITE", () => {
    const max = (q: string) => Math.max(...[...q.matchAll(/\$(\d+)/g)].map((m) => Number(m[1])));
    expect(max(UPSERT_SITE)).toBe(max(INSERT_SITE));
  });
});
