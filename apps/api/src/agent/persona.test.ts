import { describe, expect, it } from "vitest";
import type { Db } from "../seam.js";
import { APPENDIX_A, makeGetPersona, renderPersonaPrompt } from "./persona.js";

// Made-up test text only.
const persona = () => ({
  name: { en: "Old Pump", ro: "Pompa Veche" },
  voice: "voice_test_1",
  traits: "dry, kind, a little deaf",
  first_message: { en: "Who knocks?", ro: "Cine bate?" },
  cathedral_line: { en: "Test line in English.", ro: "Linie de test in romana." },
});
const site = () => ({
  name: { en: "Test Square", ro: "Piata de Test" },
  persona: persona(),
  facts: [
    { text: "The pump was painted green twice.", source: "Test Archive, p. 1" },
    { text: "Pigeons prefer the north side.", source: "Test Survey" },
  ],
});

function fakeDb(rows: unknown[]) {
  const calls: { text: string; params?: unknown[] }[] = [];
  const db: Db = {
    query: async (text, params) => {
      calls.push({ text, params });
      return { rows, rowCount: rows.length };
    },
  };
  return { db, calls };
}
const row = (over: Record<string, unknown> = {}) => ({ ...site(), is_memorial: false, ...over });

describe("renderPersonaPrompt", () => {
  it("fills the four slots", () => {
    const out = renderPersonaPrompt(site(), "ro");
    expect(out).toContain("You are Pompa Veche, the voice of Piata de Test in Timișoara.");
    expect(out).toContain("Speak Romanian.");
    expect(out).toContain("Personality: dry, kind, a little deaf.");
    expect(out).not.toMatch(/\{\{(persona_name|site_name|visitor_language|persona_traits)\}\}/);
    // Every other Appendix A line comes through unchanged.
    const expected = APPENDIX_A.replace("{{persona_name}}", "Pompa Veche")
      .replace("{{site_name}}", "Piata de Test")
      .replace("{{visitor_language}}", "Romanian")
      .replace("{{persona_traits}}", "dry, kind, a little deaf");
    expect(out.startsWith(`${expected}\n\nYour knowledge base:\n`)).toBe(true);
  });

  it("keeps the seven dynamic variables literal", () => {
    const out = renderPersonaPrompt(site(), "en");
    for (const v of ["visitor_name", "local_time", "site_glow", "colours_today", "lamps_lit_today", "sites_visited", "returning_visitor"]) {
      expect(out).toContain(`{{${v}}}`);
    }
  });

  it("lists facts with their sources", () => {
    const out = renderPersonaPrompt(site(), "en");
    expect(out).toContain(
      `${APPENDIX_A.split("\n").at(-1)}\n\nYour knowledge base:\n- The pump was painted green twice. (source: Test Archive, p. 1)\n- Pigeons prefer the north side. (source: Test Survey)\n\n`,
    );
    expect(renderPersonaPrompt({ ...site(), facts: [] }, "en")).toContain("Your knowledge base:\n- (none yet)\n\n");
  });

  it("lists archive images after the facts, in order, falling back to en", () => {
    const archive = [
      { id: "pump_1900", file: "pump_1900.jpg", alt: { en: "The pump in snow.", ro: "Pompa in zapada." }, credit: "Test Archive", year: "1900" },
      { id: "pump_1950", file: "pump_1950.jpg", alt: { en: "The pump, green.", ro: "" }, credit: "Test Archive", year: "1950" },
    ];
    const out = renderPersonaPrompt({ ...site(), persona: { ...persona(), archive } }, "ro");
    expect(out).toContain(
      "- Pigeons prefer the north side. (source: Test Survey)\nArchive image pump_1900: Pompa in zapada.\nArchive image pump_1950: The pump, green.\n\nIf the visitor asks",
    );
  });

  it("gives the same prompt with no archive images", () => {
    const today = renderPersonaPrompt(site(), "en");
    expect(renderPersonaPrompt({ ...site(), persona: { ...persona(), archive: [] } }, "en")).toBe(today);
    expect(today).not.toContain("Archive image");
  });

  it("adds the Cathedral line in the visitor's language", () => {
    const out = renderPersonaPrompt(site(), "ro");
    expect(out.endsWith("\n\nIf the visitor asks about the Metropolitan Cathedral or December 1989, say only this: Linie de test in romana.")).toBe(true);
  });
});

describe("makeGetPersona", () => {
  it("falls back to en for name, first message and Cathedral line", async () => {
    const { db } = fakeDb([row()]);
    const p = await makeGetPersona(db)("mx", "hu");
    expect(p).not.toBeNull();
    expect(p!.prompt).toContain("You are Old Pump, the voice of Test Square in Timișoara.");
    expect(p!.prompt).toContain("Speak Hungarian.");
    expect(p!.prompt.endsWith("say only this: Test line in English.")).toBe(true);
    expect(p!.firstMessage).toBe("Who knocks?");
    expect(p!.voiceId).toBe("voice_test_1");
    // An empty string in the visitor's language counts as missing too.
    const blank = fakeDb([row({ persona: { ...persona(), first_message: { en: "Who knocks?", ro: "" } } })]);
    expect((await makeGetPersona(blank.db)("mx", "ro"))!.firstMessage).toBe("Who knocks?");
  });

  it("returns null without a Cathedral line", async () => {
    const { cathedral_line: _, ...rest } = persona();
    expect(await makeGetPersona(fakeDb([row({ persona: rest })]).db)("mx", "en")).toBeNull();
  });

  it("returns null for each missing required field", async () => {
    const cases: [string, (p: ReturnType<typeof persona>) => unknown][] = [
      ["name.en", (p) => ({ ...p, name: { ro: "Pompa Veche" } })],
      ["name.en empty", (p) => ({ ...p, name: { en: "", ro: "Pompa Veche" } })],
      ["voice", (p) => ({ ...p, voice: undefined })],
      ["voice empty", (p) => ({ ...p, voice: "" })],
      ["traits", (p) => ({ ...p, traits: undefined })],
      ["traits empty", (p) => ({ ...p, traits: "" })],
      ["first_message.en", (p) => ({ ...p, first_message: { ro: "Cine bate?" } })],
      ["first_message.en empty", (p) => ({ ...p, first_message: { en: "" } })],
      ["cathedral_line.en", (p) => ({ ...p, cathedral_line: { ro: "Linie." } })],
      ["cathedral_line.en empty", (p) => ({ ...p, cathedral_line: { en: "" } })],
      ["persona fails the schema", (p) => ({ ...p, voice: 42 })],
    ];
    for (const [label, change] of cases) {
      const { db } = fakeDb([row({ persona: change(persona()) })]);
      expect(await makeGetPersona(db)("mx", "en"), label).toBeNull();
    }
  });

  it("returns null for the memorial", async () => {
    expect(await makeGetPersona(fakeDb([row({ is_memorial: true })]).db)("cathedral", "en")).toBeNull();
  });

  it("returns null for an unknown or draft site", async () => {
    const { db, calls } = fakeDb([]);
    expect(await makeGetPersona(db)("nowhere", "en")).toBeNull();
    expect(calls).toEqual([
      { text: "SELECT name, persona, facts, is_memorial FROM sites WHERE id = $1 AND status = 'published'", params: ["nowhere"] },
    ]);
  });

  it("leaves out facts that fail the schema", async () => {
    const facts = [{ text: "Kept fact.", source: "Test" }, { text: "No source." }, "loose string"];
    const p = await makeGetPersona(fakeDb([row({ facts })]).db)("mx", "en");
    expect(p!.prompt).toContain("Your knowledge base:\n- Kept fact. (source: Test)\n\n");
  });
});
