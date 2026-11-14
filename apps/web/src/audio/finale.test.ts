import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { clips } from "./clips";
import { BURST_AT_MS, FINALE_GAIN, finaleClock, finalePhase, startFinale, type FinaleHandle } from "./finale";

type FakeSource = { buffer?: { url: string }; start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn>; onended: (() => void) | null };
const param = () => ({ value: 1, cancelScheduledValues: vi.fn(), setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() });
let sources: FakeSource[] = [];
let gains: ReturnType<typeof param>[] = [];

// one context per page: created on the first `getAudioContext()` and kept
const ctx = {
  state: "running",
  currentTime: 10,
  destination: {},
  decodeAudioData: (url: unknown) => Promise.resolve({ url }),
  createBufferSource: vi.fn(() => {
    const s: FakeSource = { start: vi.fn(), stop: vi.fn(), onended: null, ...node() };
    sources.push(s);
    return s;
  }),
  createGain: () => {
    const gain = param();
    gains.push(gain);
    return { gain, ...node() };
  },
};
function node() {
  const n = { connect: vi.fn(() => n), disconnect: vi.fn() };
  return n;
}
vi.stubGlobal("AudioContext", function () {
  return ctx;
});
vi.stubGlobal("fetch", (url: string) => Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(url) }));
afterAll(() => vi.unstubAllGlobals());

const CRACKLE = "/audio/" + clips.project.crackle;
const WALTZ = "/audio/" + clips.project.waltz[0];
const flush = () => new Promise((r) => setTimeout(r, 0));
const handles: FinaleHandle[] = [];
// the once-per-`at` rule lasts the page: every test takes its own `at`
let nextAt = 1_000_000;
const play = (offset: number, surface: "phone" | "screen" = "phone") => {
  const at = (nextAt += 100_000);
  const h = startFinale(at, at + offset, { surface });
  handles.push(h);
  return { at, h };
};
const byUrl = (url: string) => sources.filter((s) => s.buffer?.url === url);

beforeEach(() => {
  handles.splice(0).forEach((h) => h.stop());
  sources = [];
  gains = [];
  ctx.state = "running";
  ctx.createBufferSource.mockClear();
});

describe("finalePhase", () => {
  const at = 50_000;
  it.each([
    [-1, "wait"],
    [0, "crackle"],
    [1499, "crackle"],
    [1500, "silence"],
    [3499, "silence"],
    [3500, "burst"],
    [48499, "burst"],
    [48500, "done"],
  ])("at + %i is %s", (dt, phase) => expect(finalePhase(at + dt, at).phase).toBe(phase));

  it("waltzOffsetMs is the time since the burst inside it, 0 outside", () => {
    expect(finalePhase(at + 10_000, at).waltzOffsetMs).toBe(6500);
    expect(finalePhase(at + 3500, at).waltzOffsetMs).toBe(0);
    for (const dt of [-1, 0, 1499, 3499, 48500]) expect(finalePhase(at + dt, at).waltzOffsetMs).toBe(0);
  });
});

describe("finaleClock", () => {
  it("with an offset it is device time plus the offset", () => expect(finaleClock(250, 50_000, 1000, 900)).toBe(1250));

  it("without an offset the receipt is at − FINALE_LEAD_MS, so the crackle starts 3 s after it", () => {
    expect(finaleClock(null, 50_000, 1000, 1000)).toBe(47_000);
    expect(finaleClock(null, 50_000, 4000, 1000)).toBe(50_000);
  });
});

describe("startFinale", () => {
  it("before the crackle: the crackle at `at` fading out at +1.5 s, the waltz at +3.5 s to +48.5 s", async () => {
    play(-1000);
    await flush();
    const [crackle] = byUrl(CRACKLE);
    const [waltz] = byUrl(WALTZ);
    expect(crackle.start).toHaveBeenCalledWith(11, 0);
    expect(gains[0].setValueAtTime).toHaveBeenCalledWith(FINALE_GAIN, 12.5);
    expect(gains.map((g) => g.value)).toEqual([FINALE_GAIN, FINALE_GAIN]); // crackle, waltz
    expect(gains[0].linearRampToValueAtTime).toHaveBeenCalledWith(0, 12.7);
    expect(waltz.start).toHaveBeenCalledWith(14.5, 0);
    expect(waltz.stop).toHaveBeenCalledWith(59.5);
  });

  it("during the crackle: the crackle from its matching point", async () => {
    play(500);
    await flush();
    expect(byUrl(CRACKLE)[0].start).toHaveBeenCalledWith(10, 0.5);
  });

  it("received at at + 2000: no crackle, the waltz at at + 3500", async () => {
    play(2000);
    await flush();
    expect(byUrl(CRACKLE)).toHaveLength(0);
    expect(sources).toHaveLength(1);
    expect(byUrl(WALTZ)[0].start).toHaveBeenCalledWith(11.5, 0);
  });

  it("inside the burst: the waltz now, from its offset", async () => {
    play(10_000);
    await flush();
    expect(sources).toHaveLength(1);
    expect(byUrl(WALTZ)[0].start).toHaveBeenCalledWith(10, 6.5);
  });

  it("after the end: nothing", async () => {
    const { h } = play(48_500);
    await flush();
    expect(sources).toHaveLength(0);
    expect(h.suspended).toBe(false);
  });

  it("the same `at` twice returns the first handle and schedules once", async () => {
    const { at, h } = play(-1000);
    const again = startFinale(at, at - 500, { surface: "phone" });
    await flush();
    expect(again).toBe(h);
    expect(ctx.createBufferSource).toHaveBeenCalledTimes(2); // one crackle, one waltz
  });

  it("a suspended context schedules nothing; resumeWaltz plays from the current offset", async () => {
    ctx.state = "suspended";
    const { at, h } = play(BURST_AT_MS + 1000);
    await flush();
    expect(sources).toHaveLength(0);
    expect(h.suspended).toBe(true);
    ctx.state = "running";
    h.resumeWaltz(at + 10_000);
    await flush();
    expect(h.suspended).toBe(false);
    expect(byUrl(WALTZ)[0].start).toHaveBeenCalledWith(10, 6.5);
  });
});
