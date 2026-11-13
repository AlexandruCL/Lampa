import { PaneAccepted, type PaneIn } from "@lampa/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../api/client";
import { createPaneSender, toPaneIn, type PaneStatus } from "./panes";
import type { Reading } from "./reading";

const AT = new Date("2026-11-13T12:00:00.000Z");
const READING: Reading = { r: 200, g: 40, b: 40, hex: "#c82828", hue: 0, saturation: 0.67, lightness: 0.47, bin: 0 };
const PANE: PaneIn = toPaneIn(READING, "unirii", AT);
const ACCEPTED: PaneAccepted = { windowId: "w1", slot: 3, count: 4, completed: false };

function setup(send: (pane: PaneIn) => Promise<PaneAccepted>) {
  const sendMock = vi.fn(send);
  const statuses: PaneStatus[] = [];
  const sender = createPaneSender({ send: sendMock, onStatus: (s) => statuses.push(s) });
  return { sender, sendMock, statuses };
}

function failing(...errors: unknown[]) {
  let i = 0;
  return async () => {
    if (i < errors.length) throw errors[i++];
    return ACCEPTED;
  };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("toPaneIn", () => {
  it("toPaneIn carries the reading's fields and an ISO time", () => {
    expect(toPaneIn(READING, "unirii", AT)).toEqual({
      siteId: "unirii",
      hue: 0,
      saturation: 0.67,
      lightness: 0.47,
      hex: "#c82828",
      bin: 0,
      at: "2026-11-13T12:00:00.000Z",
    });
  });

  it("toPaneIn keeps bin null for night glass", () => {
    const night: Reading = { r: 10, g: 10, b: 12, hex: "#0a0a0c", hue: 240, saturation: 0.09, lightness: 0.04, bin: null };
    expect(toPaneIn(night, "gallery", AT).bin).toBeNull();
  });
});

describe("pane sender", () => {
  it("a 201 reports sending then sent", async () => {
    const { sender, sendMock, statuses } = setup(async () => ACCEPTED);
    sender.submit(PANE);
    await vi.advanceTimersByTimeAsync(0);
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock).toHaveBeenCalledWith(PANE);
    expect(statuses).toEqual([{ state: "sending" }, { state: "sent", accepted: ACCEPTED }]);
  });

  it("a 429 reports rate_limited and never retries", async () => {
    const { sender, sendMock, statuses } = setup(failing(new ApiError(429)));
    sender.submit(PANE);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(statuses).toEqual([{ state: "sending" }, { state: "rate_limited" }]);
  });

  it("a 503 reports waiting, not offline, and is sent on the next tick", async () => {
    const { sender, sendMock, statuses } = setup(failing(new ApiError(503)));
    sender.submit(PANE);
    await vi.advanceTimersByTimeAsync(0);
    expect(statuses).toEqual([{ state: "sending" }, { state: "waiting", offline: false }]);
    await vi.advanceTimersByTimeAsync(1999);
    expect(sendMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(sendMock).toHaveBeenCalledTimes(2);
    expect(sendMock).toHaveBeenLastCalledWith(PANE);
    expect(statuses.at(-1)).toEqual({ state: "sent", accepted: ACCEPTED });
  });

  it("a 401 is retried", async () => {
    const { sender, sendMock, statuses } = setup(failing(new ApiError(401)));
    sender.submit(PANE);
    await vi.advanceTimersByTimeAsync(0);
    expect(statuses.at(-1)).toEqual({ state: "waiting", offline: false });
    await vi.advanceTimersByTimeAsync(2000);
    expect(sendMock).toHaveBeenCalledTimes(2);
    expect(statuses.at(-1)).toEqual({ state: "sent", accepted: ACCEPTED });
  });

  it("a network error reports waiting offline and is retried", async () => {
    const { sender, sendMock, statuses } = setup(failing(new TypeError("Failed to fetch"), new TypeError("Failed to fetch")));
    sender.submit(PANE);
    await vi.advanceTimersByTimeAsync(0);
    expect(statuses.at(-1)).toEqual({ state: "waiting", offline: true });
    await vi.advanceTimersByTimeAsync(2000);
    expect(sendMock).toHaveBeenCalledTimes(2);
    expect(statuses.at(-1)).toEqual({ state: "waiting", offline: true });
    await vi.advanceTimersByTimeAsync(2000);
    expect(sendMock).toHaveBeenCalledTimes(3);
    expect(statuses.at(-1)).toEqual({ state: "sent", accepted: ACCEPTED });
  });

  it("a 404 reports dropped and never retries", async () => {
    const { sender, sendMock, statuses } = setup(failing(new ApiError(404)));
    sender.submit(PANE);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(statuses).toEqual([{ state: "sending" }, { state: "dropped" }]);
  });

  it("an answer that fails the schema reports dropped", async () => {
    // The real send parses with PaneAccepted; a bad answer throws its ZodError.
    const { sender, sendMock, statuses } = setup(async () => PaneAccepted.parse({ windowId: "w1", slot: 99 }));
    sender.submit(PANE);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(statuses).toEqual([{ state: "sending" }, { state: "dropped" }]);
  });

  it("a second submit while one waits is ignored", async () => {
    const { sender, sendMock, statuses } = setup(failing(new ApiError(503)));
    sender.submit(PANE);
    await vi.advanceTimersByTimeAsync(0);
    sender.submit({ ...PANE, hex: "#00ff00" });
    expect(statuses.filter((s) => s.state === "sending")).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(2000);
    expect(sendMock).toHaveBeenCalledTimes(2);
    expect(sendMock.mock.calls.every(([pane]) => pane.hex === PANE.hex)).toBe(true);
  });

  it("stop ends the retries", async () => {
    const { sender, sendMock } = setup(async () => {
      throw new ApiError(503);
    });
    sender.submit(PANE);
    await vi.advanceTimersByTimeAsync(2000);
    expect(sendMock).toHaveBeenCalledTimes(2);
    sender.stop();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(sendMock).toHaveBeenCalledTimes(2);
  });
});
