import { describe, expect, it } from "vitest";
import { type TalkEvent, type TalkMode, step } from "./machine";

const to = (mode: TalkMode, notice: "resting" | "mic_off" | null = null, caption: "timeup" | null = null, endSession = false) => ({
  mode,
  notice,
  caption,
  endSession,
});
const ALL: TalkEvent[] = [
  { type: "timeout" },
  { type: "session_failed" },
  { type: "mic_denied" },
  { type: "connected" },
  { type: "error" },
  { type: "disconnected", reason: "error" },
  { type: "disconnected", reason: "agent" },
  { type: "disconnected", reason: "user" },
];

describe("from connecting", () => {
  it("timeout goes to fallback, resting", () => expect(step("connecting", { type: "timeout" })).toEqual(to("fallback", "resting")));
  it("session_failed goes to fallback, resting", () =>
    expect(step("connecting", { type: "session_failed" })).toEqual(to("fallback", "resting")));
  it("error goes to fallback, resting", () => expect(step("connecting", { type: "error" })).toEqual(to("fallback", "resting")));
  it("disconnected with reason error goes to fallback, resting", () =>
    expect(step("connecting", { type: "disconnected", reason: "error" })).toEqual(to("fallback", "resting")));
  it("mic_denied goes to fallback, mic_off", () => expect(step("connecting", { type: "mic_denied" })).toEqual(to("fallback", "mic_off")));
  it("connected goes to live", () => expect(step("connecting", { type: "connected" })).toEqual(to("live")));
  it("disconnected with reason agent or user changes nothing", () => {
    expect(step("connecting", { type: "disconnected", reason: "agent" })).toEqual(to("connecting"));
    expect(step("connecting", { type: "disconnected", reason: "user" })).toEqual(to("connecting"));
  });
});

describe("from live", () => {
  it("error goes to fallback, resting, and ends the session", () =>
    expect(step("live", { type: "error" })).toEqual(to("fallback", "resting", null, true)));
  it("disconnected with reason error goes to fallback, resting, without ending the session", () =>
    expect(step("live", { type: "disconnected", reason: "error" })).toEqual(to("fallback", "resting")));
  it("disconnected with reason agent goes to timeup with the caption and no notice", () =>
    expect(step("live", { type: "disconnected", reason: "agent" })).toEqual(to("timeup", null, "timeup")));
  it("disconnected with reason user stays live", () => expect(step("live", { type: "disconnected", reason: "user" })).toEqual(to("live")));
  it("a timeout after connected changes nothing", () => expect(step("live", { type: "timeout" })).toEqual(to("live")));
  it("session_failed, mic_denied and connected change nothing", () => {
    for (const type of ["session_failed", "mic_denied", "connected"] as const) expect(step("live", { type })).toEqual(to("live"));
  });
});

describe("from fallback or timeup", () => {
  it("a late connect after the 8 s switch ends the session", () =>
    expect(step("fallback", { type: "connected" })).toEqual(to("fallback", null, null, true)));
  it("connected in timeup ends the session and stays timeup", () =>
    expect(step("timeup", { type: "connected" })).toEqual(to("timeup", null, null, true)));
  it("every other event changes nothing", () => {
    for (const mode of ["fallback", "timeup"] as const)
      for (const e of ALL.filter((e) => e.type !== "connected")) expect(step(mode, e)).toEqual(to(mode));
  });
});
