import { colourName } from "@lampa/shared";
import { expect, it } from "vitest";
import { tickerText, timeAgo } from "./tickerCopy";

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
