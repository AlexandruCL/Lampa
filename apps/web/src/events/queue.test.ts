import { EventsAccepted, type EventBatch } from "@lampa/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../api/client";
import { createEventQueue } from "./queue";

const AT = new Date("2026-11-13T12:00:00.000Z");

function setup(send: (batch: EventBatch) => Promise<unknown>) {
  const sendMock = vi.fn(send);
  const queue = createEventQueue({ send: sendMock, now: () => AT });
  queue.start();
  return { queue, sendMock };
}

function sent(sendMock: ReturnType<typeof vi.fn>, call = 0): EventBatch {
  return sendMock.mock.calls[call]![0] as EventBatch;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("event queue", () => {
  it("push then a 2 s tick sends one batch", async () => {
    const { queue, sendMock } = setup(async () => ({ accepted: 1 }));
    queue.push("wake", "unirii");
    await vi.advanceTimersByTimeAsync(1999);
    expect(sendMock).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sent(sendMock).events).toEqual([{ kind: "wake", siteId: "unirii", at: AT.toISOString() }]);
    expect(queue.size()).toBe(0);
  });

  it("a batch holds at most 50 events", async () => {
    const { queue, sendMock } = setup(async () => ({ accepted: 50 }));
    for (let i = 0; i < 60; i++) queue.push("wake", `s${i}`);
    await vi.advanceTimersByTimeAsync(2000);
    expect(sent(sendMock).events).toHaveLength(50);
    expect(queue.size()).toBe(10);
    await vi.advanceTimersByTimeAsync(2000);
    expect(sent(sendMock, 1).events.map((e) => e.siteId)).toEqual(
      Array.from({ length: 10 }, (_, i) => `s${50 + i}`),
    );
  });

  it("a 503 keeps the batch for the next tick", async () => {
    const { queue, sendMock } = setup(async () => ({ accepted: 2 }));
    sendMock.mockRejectedValueOnce(new ApiError(503));
    queue.push("wake", "a");
    queue.push("colour", "b");
    await vi.advanceTimersByTimeAsync(2000);
    expect(queue.size()).toBe(2);
    await vi.advanceTimersByTimeAsync(2000);
    expect(sendMock).toHaveBeenCalledTimes(2);
    expect(sent(sendMock, 1)).toEqual(sent(sendMock, 0));
    expect(queue.size()).toBe(0);
  });

  it("a network error keeps the batch for the next tick", async () => {
    const { queue, sendMock } = setup(async () => ({ accepted: 1 }));
    sendMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    queue.push("wake", "a");
    await vi.advanceTimersByTimeAsync(2000);
    expect(queue.size()).toBe(1);
    await vi.advanceTimersByTimeAsync(2000);
    expect(sendMock).toHaveBeenCalledTimes(2);
    expect(sent(sendMock, 1)).toEqual(sent(sendMock, 0));
    expect(queue.size()).toBe(0);
  });

  it("a 400 drops the batch", async () => {
    const { queue, sendMock } = setup(async () => {
      throw new ApiError(400);
    });
    queue.push("wake", "a");
    await vi.advanceTimersByTimeAsync(2000);
    expect(queue.size()).toBe(0);
    await vi.advanceTimersByTimeAsync(2000);
    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it("the queue drops the oldest past 200", async () => {
    const { queue, sendMock } = setup(async () => ({ accepted: 50 }));
    for (let i = 0; i < 205; i++) queue.push("wake", `s${i}`);
    expect(queue.size()).toBe(200);
    await vi.advanceTimersByTimeAsync(2000);
    expect(sent(sendMock).events[0]!.siteId).toBe("s5");
  });

  it("events carry kind, siteId and at and no weight", async () => {
    const { queue, sendMock } = setup(async () => ({ accepted: 1 }));
    queue.push("talk_turn", "victoriei");
    await vi.advanceTimersByTimeAsync(2000);
    const [event] = sent(sendMock).events;
    expect(Object.keys(event!).sort()).toEqual(["at", "kind", "siteId"]);
    expect(event).toEqual({ kind: "talk_turn", siteId: "victoriei", at: "2026-11-13T12:00:00.000Z" });
  });

  it("two ticks during a slow send make one request", async () => {
    let release!: () => void;
    const { queue, sendMock } = setup(
      () => new Promise((resolve) => (release = () => resolve({ accepted: 1 }))),
    );
    queue.push("wake", "a");
    await vi.advanceTimersByTimeAsync(2000);
    queue.push("wake", "b");
    await vi.advanceTimersByTimeAsync(4000);
    expect(sendMock).toHaveBeenCalledTimes(1);
    release();
    await vi.advanceTimersByTimeAsync(2000);
    expect(sendMock).toHaveBeenCalledTimes(2);
    expect(sent(sendMock, 1).events.map((e) => e.siteId)).toEqual(["b"]);
  });

  it("a 202 with a body that fails the schema drops the batch", async () => {
    // What api() throws when a 202 body fails EventsAccepted.
    const { queue, sendMock } = setup(async () => EventsAccepted.parse({ ok: true }));
    queue.push("wake", "a");
    await vi.advanceTimersByTimeAsync(2000);
    expect(queue.size()).toBe(0);
    await vi.advanceTimersByTimeAsync(2000);
    expect(sendMock).toHaveBeenCalledTimes(1);
  });
});
