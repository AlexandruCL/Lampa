import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DUCK_GAIN } from "./bus";
import { clips } from "./clips";
import { isRadioPlaying, playRadio, stopRadio } from "./radio";
import { setRoomLevel } from "./room";

vi.mock("./room", () => ({ setRoomLevel: vi.fn() }));

type FakeSource = { buffer?: unknown; connect: ReturnType<typeof vi.fn>; start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn>; onended: (() => void) | null };
let sources: FakeSource[] = [];
const ctx = {
  state: "running",
  currentTime: 0,
  destination: {},
  decodeAudioData: (b: unknown) => Promise.resolve(b),
  createBufferSource: () => {
    const s = { start: vi.fn(), stop: vi.fn(), onended: null, connect: vi.fn(), disconnect: vi.fn() };
    sources.push(s);
    return s;
  },
};
let fetchOk = true;
const fetchMock = vi.fn((url: string) => Promise.resolve({ ok: fetchOk, status: 404, arrayBuffer: () => Promise.resolve(url) }));
vi.stubGlobal("AudioContext", function () {
  return ctx;
});
vi.stubGlobal("fetch", fetchMock);
afterAll(() => vi.unstubAllGlobals());

const flush = () => new Promise((r) => setTimeout(r, 0));
let n = 0;

beforeEach(() => {
  clips.project.radio = `project/radio-test-${++n}.mp3`; // a new file each test: loadBuffer caches by URL
  sources = [];
  ctx.state = "running";
  fetchOk = true;
  fetchMock.mockClear();
  vi.mocked(setRoomLevel).mockClear();
});
afterEach(() => {
  stopRadio();
  delete clips.project.radio;
});

describe("playRadio", () => {
  it('resolves "none" with no file and plays nothing', async () => {
    delete clips.project.radio;
    await expect(playRadio()).resolves.toBe("none");
    expect(isRadioPlaying()).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("plays its own source to the destination, ducks the room to DUCK_GAIN over 0.2 s, back to 1 over 0.8 s at the end", async () => {
    const done = playRadio();
    expect(isRadioPlaying()).toBe(true);
    await flush();
    const [s] = sources;
    expect(fetchMock).toHaveBeenCalledWith(`/audio/${clips.project.radio}`);
    expect(s.connect).toHaveBeenCalledWith(ctx.destination);
    expect(s.start).toHaveBeenCalled();
    expect(setRoomLevel).toHaveBeenLastCalledWith(DUCK_GAIN, 0.2);
    s.onended!();
    await expect(done).resolves.toBe("ended");
    expect(setRoomLevel).toHaveBeenLastCalledWith(1, 0.8);
    expect(isRadioPlaying()).toBe(false);
  });

  it("a second call while it plays starts nothing", async () => {
    const first = playRadio();
    const second = playRadio();
    await flush();
    expect(second).toBe(first);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(sources).toHaveLength(1);
  });

  it('stopRadio stops the source, resolves "stopped" and brings the room back', async () => {
    const done = playRadio();
    await flush();
    stopRadio();
    await expect(done).resolves.toBe("stopped");
    expect(sources[0].stop).toHaveBeenCalled();
    expect(sources[0].onended).toBeNull();
    expect(setRoomLevel).toHaveBeenLastCalledWith(1, 0.8);
    expect(isRadioPlaying()).toBe(false);
  });

  it("stopped while loading: no source starts and the room is untouched", async () => {
    const done = playRadio();
    stopRadio();
    await expect(done).resolves.toBe("stopped");
    await flush();
    expect(sources).toHaveLength(0);
    expect(setRoomLevel).not.toHaveBeenCalled();
  });

  it('resolves "failed" on a failed load or a suspended context, the room untouched', async () => {
    fetchOk = false;
    await expect(playRadio()).resolves.toBe("failed");
    fetchOk = true;
    clips.project.radio = "project/radio-test-suspended.mp3";
    ctx.state = "suspended";
    await expect(playRadio()).resolves.toBe("failed");
    expect(sources).toHaveLength(0);
    expect(setRoomLevel).not.toHaveBeenCalled();
    expect(isRadioPlaying()).toBe(false);
  });
});
