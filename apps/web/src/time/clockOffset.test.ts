import { expect, it } from "vitest";
import { API_URL } from "../api/client";
import { CLOCK_PINGS, getClockOffset } from "./clockOffset";

/** What a ping answers: a body, a server clock this far ahead of the device, a status, or a throw. */
type Answer = { now: unknown } | { ahead: number } | { status: number } | Error;

/** A fake fetch whose k-th ping takes rtts[k] ms on a fake local clock, starting at 1000. */
function fakes(answers: Answer[], rtts: number[]) {
  const calls: { url: string; init?: RequestInit }[] = [];
  let clock = 1000;
  let inFlight = 0;
  let maxInFlight = 0;
  const fetch = (async (url: string, init?: RequestInit) => {
    const k = calls.push({ url, init }) - 1;
    inFlight++;
    maxInFlight = Math.max(maxInFlight, inFlight);
    await Promise.resolve();
    inFlight--;
    clock += rtts[k];
    const a = answers[k];
    if (a instanceof Error) throw a;
    if ("status" in a) return new Response("{}", { status: a.status });
    // A server whose clock is `ahead` ms ahead answers at the middle of the round trip.
    const body = "ahead" in a ? { now: clock - rtts[k] / 2 + a.ahead } : a;
    return new Response(JSON.stringify(body));
  }) as typeof globalThis.fetch;
  return { fetch, now: () => clock, calls, maxInFlight: () => maxInFlight };
}

const down = new Error("down");

it("five pings are sent one after the other", async () => {
  const f = fakes(Array(5).fill({ ahead: 0 }), [10, 10, 10, 10, 10]);
  await getClockOffset(f);
  expect(CLOCK_PINGS).toBe(5);
  expect(f.calls).toHaveLength(5);
  expect(f.maxInFlight()).toBe(1);
  for (const c of f.calls) {
    expect(c.url).toBe(`${API_URL}/time`);
    expect(c.init).toEqual({ cache: "no-store" });
  }
});

it("the lowest round trip wins", async () => {
  const answers = [{ ahead: 100 }, { ahead: 200 }, { ahead: 500 }, { ahead: 300 }, { ahead: 400 }];
  expect(await getClockOffset(fakes(answers, [40, 30, 10, 20, 50]))).toBe(500);
});

it("a tie keeps the first", async () => {
  const answers = [{ ahead: 100 }, { ahead: 200 }, { ahead: 300 }, { ahead: 400 }, { ahead: 500 }];
  expect(await getClockOffset(fakes(answers, [30, 10, 20, 10, 40]))).toBe(200);
});

it("offset is server time plus half the round trip minus the local end", async () => {
  // t0 = 1000, t1 = 1021, server.now = 5000: 5000 + 10.5 - 1021 = 3989.5, rounded to 3990.
  const f = fakes([{ now: 5000 }, down, down, down, down], [21, 1, 1, 1, 1]);
  expect(await getClockOffset(f)).toBe(3990);
});

it("a failed ping is skipped", async () => {
  // The skipped ping has the lowest round trip; it would win if it counted.
  const answers = [{ ahead: 100 }, down, { ahead: 700 }, { ahead: 300 }, { ahead: 400 }];
  expect(await getClockOffset(fakes(answers, [30, 4, 20, 40, 50]))).toBe(700);
});

it("a non-2xx ping is skipped", async () => {
  const answers = [{ ahead: 100 }, { status: 503 }, { ahead: 700 }, { ahead: 300 }, { ahead: 400 }];
  expect(await getClockOffset(fakes(answers, [30, 4, 20, 40, 50]))).toBe(700);
});

it("a body that fails TimeNow is skipped", async () => {
  const answers = [{ ahead: 100 }, { now: "soon" }, { ahead: 700 }, { ahead: 300 }, { ahead: 400 }];
  expect(await getClockOffset(fakes(answers, [30, 4, 20, 40, 50]))).toBe(700);
});

it("all pings failing gives null", async () => {
  const answers = [down, { status: 500 }, { now: 1.5 }, { status: 404 }, down];
  expect(await getClockOffset(fakes(answers, [10, 10, 10, 10, 10]))).toBeNull();
});
