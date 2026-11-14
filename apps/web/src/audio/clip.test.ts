import { afterAll, describe, expect, it, vi } from "vitest";
import { playClip } from "./clip";

// one context per page: the fake is created on the first `getAudioContext()` and kept
const ctx = {
  state: "suspended",
  resume: vi.fn(() => Promise.resolve()),
  decodeAudioData: vi.fn(() => Promise.resolve({})),
  createBufferSource: vi.fn(() => source),
  destination: {},
};
const source: { start: ReturnType<typeof vi.fn>; onended?: () => void; [k: string]: unknown } = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  stop: vi.fn(),
  start: vi.fn(() => source.onended?.()),
};
vi.stubGlobal("AudioContext", function () {
  return ctx;
});
vi.stubGlobal("fetch", () => Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)) }));
afterAll(() => vi.unstubAllGlobals());

describe("playClip", () => {
  it("in a tap resumes before any await; a context still not running fails and starts nothing", async () => {
    const played = playClip("a.mp3", true);
    expect(ctx.resume).toHaveBeenCalledOnce();
    expect(await played).toBe("failed");
    expect(source.start).not.toHaveBeenCalled();
  });

  it("outside a tap it never resumes", async () => {
    ctx.resume.mockClear();
    expect(await playClip("a.mp3")).toBe("failed");
    expect(ctx.resume).not.toHaveBeenCalled();
  });

  it("plays once the resume brings the context back", async () => {
    ctx.resume.mockImplementationOnce(() => {
      ctx.state = "running";
      return Promise.resolve();
    });
    expect(await playClip("a.mp3", true)).toBe("ended");
    expect(source.start).toHaveBeenCalledOnce();
  });
});
