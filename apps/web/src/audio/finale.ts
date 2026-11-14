import { FINALE_LEAD_MS } from "@lampa/shared";
import { duck } from "./bus";
import { AUDIO_BASE, clips } from "./clips";
import { getAudioContext } from "./context";
import { loadBuffer } from "./engine";
import { setRoomLevel } from "./room";

// Patrick's decisions, hour 37 (Package B). All times from `at`, the server ms of the crackle.
export const CRACKLE_MS = 1500;
export const CRACKLE_FADE_S = 0.2;
export const SILENCE_MS = 2000;
export const BURST_AT_MS = CRACKLE_MS + SILENCE_MS; // 3500
export const WALTZ_MS = 45000;
export const FINALE_END_MS = BURST_AT_MS + WALTZ_MS; // 48500
/** Level of the crackle and the waltz; at full level the finale was too loud (Cristea, after Build 4). */
export const FINALE_GAIN = 0.15;
const ROOM_DOWN_S = 0.5;
const ROOM_BACK_S = 4;

export type FinalePhase = "wait" | "crackle" | "silence" | "burst" | "done";
export type FinaleHandle = {
  stop(): void;
  /** True while the context is not running and the finale is not over: show "Tap to hear the waltz". */
  readonly suspended: boolean;
  /** Called by the tap handler after `unlockAudio()`: plays the finale from where it now is. */
  resumeWaltz(serverNow: number): void;
};

export function finalePhase(serverNow: number, at: number): { phase: FinalePhase; waltzOffsetMs: number } {
  const t = serverNow - at;
  if (t < 0) return { phase: "wait", waltzOffsetMs: 0 };
  if (t < CRACKLE_MS) return { phase: "crackle", waltzOffsetMs: 0 };
  if (t < BURST_AT_MS) return { phase: "silence", waltzOffsetMs: 0 };
  if (t < FINALE_END_MS) return { phase: "burst", waltzOffsetMs: t - BURST_AT_MS };
  return { phase: "done", waltzOffsetMs: 0 };
}

/** Server time now. Without a clock offset the receipt is taken as `at - FINALE_LEAD_MS` (Patrick, hour 37). */
export const finaleClock = (offset: number | null, at: number, deviceNow: number, receivedAt: number): number =>
  offset === null ? deviceNow - receivedAt + at - FINALE_LEAD_MS : deviceNow + offset;

const fileUrl = (file?: string): string | null => (file ? AUDIO_BASE + file : null);
const CRACKLE_URL = fileUrl(clips.project.crackle);
const WALTZ_URL = fileUrl(clips.project.waltz[0]); // take 1 (Patrick, hour 37)
const load = (url: string | null): Promise<AudioBuffer | null> => (url ? loadBuffer(url).catch(() => null) : Promise.resolve(null));

let preload: Promise<void> | null = null;

/** Fetches and decodes the crackle and the waltz once per page; a failed load is tried again on the next call. */
export function preloadFinale(): Promise<void> {
  return (preload ??= Promise.all([CRACKLE_URL, WALTZ_URL].map((url) => url && loadBuffer(url))).then(
    () => undefined,
    () => {
      preload = null;
    },
  ));
}

const started = new Map<number, FinaleHandle>();

/** Plays the finale for `at` on the audio clock, from the phase `serverNow` is in. Each `at` plays once per page. */
export function startFinale(at: number, serverNow: number, opts: { surface: "phone" | "screen" }): FinaleHandle {
  const first = started.get(at);
  if (first) return first;
  const ctx = getAudioContext();
  let sources: AudioBufferSourceNode[] = [];
  let timers: ReturnType<typeof setTimeout>[] = [];
  let held = false;
  let over = finalePhase(serverNow, at).phase === "done";

  const hold = (on: boolean) =>
    opts.surface === "phone" ? duck("finale", on) : setRoomLevel(on ? 0 : 1, on ? ROOM_DOWN_S : ROOM_BACK_S);
  const end = () => {
    if (over) return;
    over = true;
    timers.forEach(clearTimeout);
    if (held) hold(false);
  };
  const silence = () => {
    for (const s of sources) {
      s.onended = null;
      s.stop();
      s.disconnect();
    }
    sources = [];
  };

  // `now` is the server time at ctx.currentTime of this call; the load can take a while, so it is carried forward.
  const schedule = (now: number) => {
    const t0 = ctx.currentTime;
    void Promise.all([load(CRACKLE_URL), load(WALTZ_URL)]).then(([crackle, waltz]) => {
      if (over || ctx.state !== "running") return;
      const serverNow = now + (ctx.currentTime - t0) * 1000;
      const when = (ms: number) => ctx.currentTime + Math.max(0, at + ms - serverNow) / 1000;
      const from = (ms: number) => Math.max(0, serverNow - at - ms) / 1000;
      if (crackle && serverNow < at + CRACKLE_MS) {
        const source = ctx.createBufferSource();
        const gain = ctx.createGain();
        const fade = when(CRACKLE_MS);
        source.buffer = crackle;
        gain.gain.value = FINALE_GAIN;
        gain.gain.setValueAtTime(FINALE_GAIN, fade);
        gain.gain.linearRampToValueAtTime(0, fade + CRACKLE_FADE_S);
        source.connect(gain).connect(ctx.destination);
        source.onended = () => {
          source.disconnect();
          gain.disconnect();
        };
        source.start(when(0), from(0));
        source.stop(fade + CRACKLE_FADE_S);
        sources.push(source);
      }
      if (waltz && serverNow < at + FINALE_END_MS) {
        const source = ctx.createBufferSource();
        const gain = ctx.createGain();
        source.buffer = waltz;
        gain.gain.value = FINALE_GAIN;
        source.connect(gain).connect(ctx.destination);
        source.onended = () => {
          source.disconnect();
          gain.disconnect();
          end();
        };
        source.start(when(BURST_AT_MS), from(BURST_AT_MS));
        source.stop(when(FINALE_END_MS));
        sources.push(source);
      }
    });
  };

  const handle: FinaleHandle = {
    stop() {
      silence();
      end();
    },
    get suspended() {
      return !over && ctx.state !== "running";
    },
    resumeWaltz(now: number) {
      if (over || ctx.state !== "running") return;
      silence(); // a source scheduled on a frozen clock would play late
      schedule(now);
    },
  };
  started.set(at, handle);
  if (over) return handle;

  // Wall-clock timers: the hold starts at the crackle (or now, if later) and ends at the waltz's end even if no source plays.
  timers = [
    setTimeout(() => {
      held = true;
      hold(true);
    }, Math.max(0, at - serverNow)),
    setTimeout(end, at + FINALE_END_MS - serverNow),
  ];
  if (ctx.state === "running") schedule(serverNow);
  return handle;
}
