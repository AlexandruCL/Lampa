import { sites, type PendingEcho } from "@lampa/shared";
import { describe, expect, it, vi } from "vitest";
import { SIGN_IN_RETURN_KEY } from "../auth/claimFlow";
import { clearVisitorReturn, formatDuration, keepSelection, metaLine, removeEcho, sessionEnded, siteName } from "./queue";

const NOW = Date.parse("2026-11-14T12:00:00.000Z");

const echo = (id: string, lang: string | null = "ro"): PendingEcho => ({
  id,
  siteId: "piata-unirii",
  createdAt: "2026-11-14T11:56:00.000Z",
  lang,
  transcript: null,
  audioUrl: `/blob/${id}`,
});

const list = [echo("a"), echo("b"), echo("c")];

describe("queue", () => {
  it("the first echo is selected on load", () => {
    expect(keepSelection(list, null)).toBe("a");
    expect(keepSelection([], null)).toBeNull();
  });

  it("removing the selected echo selects the next one", () => {
    expect(removeEcho(list, "b", "b")).toEqual({ echoes: [list[0], list[2]], selected: "c" });
  });

  it("removing the last echo selects the one before", () => {
    expect(removeEcho(list, "c", "c").selected).toBe("b");
    expect(removeEcho([echo("a")], "a", "a").selected).toBeNull();
  });

  it("a refresh keeps the selection when it is still pending", () => {
    expect(keepSelection([echo("d"), echo("b")], "b")).toBe("b");
  });

  it("a refresh selects the first echo when the selection is gone", () => {
    expect(keepSelection([echo("d"), echo("c")], "b")).toBe("d");
  });

  it("the meta line names Romanian for ro", () => {
    expect(metaLine(echo("a", "ro"), NOW)).toBe("Romanian, 4 min ago");
  });

  it("the meta line leaves out a null language", () => {
    expect(metaLine(echo("a", null), NOW)).toBe("4 min ago");
    expect(metaLine({ ...echo("a", null), createdAt: "2026-11-14T11:59:30.000Z" }, NOW)).toBe("now");
  });

  it("missing_refresh_token counts as a session that ended", () => {
    expect(sessionEnded({ error: "missing_refresh_token" })).toBe(true);
    expect(sessionEnded({ error: "timeout" })).toBe(false);
    expect(sessionEnded(new Error("offline"))).toBe(false);
  });

  it("the duration 19.4 s reads 0:19", () => {
    expect(formatDuration(19.4)).toBe("0:19");
    expect(formatDuration(75)).toBe("1:15");
  });

  it("siteName prefers the API's name", () => {
    expect(siteName({ ...echo("a"), siteName: "Decebal Bridge" })).toBe("Decebal Bridge");
  });

  it("siteName falls back to the bundled name", () => {
    const bundled = sites[0]!;
    expect(siteName({ ...echo("a"), siteId: bundled.id })).toBe(bundled.name);
    expect(siteName({ ...echo("a"), siteId: "decebal-bridge" })).toBe("decebal-bridge");
  });

  it("curate sign-in clears the visitor return key", () => {
    const store = new Map<string, string>([[SIGN_IN_RETURN_KEY, "/s/piata-unirii"], ["other", "kept"]]);
    vi.stubGlobal("sessionStorage", {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
      removeItem: (k: string) => store.delete(k),
    });
    try {
      clearVisitorReturn();
      expect(store.has(SIGN_IN_RETURN_KEY)).toBe(false);
      expect(store.get("other")).toBe("kept");
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
