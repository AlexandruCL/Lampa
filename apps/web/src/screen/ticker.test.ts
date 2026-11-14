import { colourName } from "@lampa/shared";
import { expect, it } from "vitest";
import { addTickerEvent, parseEcho, tickerText, timeAgo } from "./tickerCopy";

const COLOUR_SITE_IDS = ["mx", "unirii", "victoriei", "bastion"];
const echo = (siteId: string) => ({ echoId: "e1", siteId, audioUrl: "https://example.test/e1.mp3", transcript: "Aici", lang: "ro" });

it("an echo line names the site", () => {
  expect(parseEcho(echo("unirii"), COLOUR_SITE_IDS)?.siteId).toBe("unirii");
  expect(tickerText({ kind: "echo", siteId: "unirii", at: 0 }, "Piața Unirii", "")).toBe("New echo at Piața Unirii");
});

it("an echo for the cathedral adds no line", () => {
  expect(parseEcho(echo("cathedral"), COLOUR_SITE_IDS)).toBeNull();
  expect(parseEcho({ siteId: "unirii" }, COLOUR_SITE_IDS)).toBeNull();
});

it("a candle line reads A candle was lit at the Cathedral.", () => {
  expect(tickerText({ kind: "candle", at: 0 }, "", "")).toBe("A candle was lit at the Cathedral.");
});

it("a second candle replaces the memorial line in place", () => {
  let list = addTickerEvent([], { kind: "candle", at: 1 });
  list = addTickerEvent(list, { kind: "pane", siteId: "mx", hex: "#808080", at: 2 });
  list = addTickerEvent(list, { kind: "candle", at: 3 });
  expect(list).toEqual([
    { kind: "pane", siteId: "mx", hex: "#808080", at: 2 },
    { kind: "candle", at: 3 },
  ]);
});

it("the memorial line stays when six newer lines arrive", () => {
  let list = addTickerEvent([], { kind: "candle", at: 0 });
  for (let at = 1; at <= 6; at++) list = addTickerEvent(list, { kind: "complete", siteId: "mx", at });
  expect(list).toHaveLength(6);
  expect(list.map((e) => e.at)).toEqual([6, 5, 4, 3, 2, 0]);
  expect(list.at(-1)).toEqual({ kind: "candle", at: 0 });
});

it("a pane line names the site and the colour", () => {
  expect(tickerText({ kind: "pane", siteId: "unirii", hex: "#FF8800", at: 0 }, "Piața Unirii", colourName("#FF8800").en)).toBe(
    "New colour at Piața Unirii: Orange",
  );
});

it("a grey pane is named Night glass", () => {
  expect(tickerText({ kind: "pane", siteId: "mx", hex: "#808080", at: 0 }, "Muzeul MX Corneliu Miklosi", colourName("#808080").en)).toBe(
    "New colour at Muzeul MX Corneliu Miklosi: Night glass",
  );
});

it("a complete line names the site", () => {
  expect(tickerText({ kind: "complete", siteId: "bastion", at: 0 }, "Theresia Bastion", "")).toBe("The Theresia Bastion window is complete.");
});

it("timeAgo is now at 59 s", () => {
  expect(timeAgo(1_000, 1_000 + 59_000)).toBe("now");
});

it("timeAgo is 1 min at 60 s and 2 min at 179 s", () => {
  expect(timeAgo(0, 60_000)).toBe("1 min");
  expect(timeAgo(0, 179_000)).toBe("2 min");
});

it("new place line reads New place: {Site}", () => {
  expect(tickerText({ kind: "place", siteId: "opera", at: 0 }, "Opera", "")).toBe("New place: Opera");
});
