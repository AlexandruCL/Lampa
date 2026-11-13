import { sites } from "@lampa/shared";
import { AUDIO_BASE, clips, picks, type Clips } from "./clips";
import { getAudioContext } from "./context";

export const ASLEEP_GAIN = 0.3;
export const MEMORIAL_GAIN = 0.5;
export const FADE_IN_S = 2;
export const RAMP_S = 1;
export const RETRY_MS = 2000;

type BedState = "playing" | "failed";
type Bed = {
  siteId: string;
  memorial: boolean;
  glow: number | null;
  /** The level the gain is ramping to; compared instead of gain.gain.value, which lags a ramp. */
  target?: number;
  promise: Promise<BedState>;
  source?: AudioBufferSourceNode;
  gain?: GainNode;
};

let current: Bed | null = null;
const buffers = new Map<string, AudioBuffer>();

/** Bed level: 0.3 asleep to 1 at full glow; the memorial always at 0.5 (DESIGN.md 7.11). */
export function bedGain(glow: number | null, memorial: boolean): number {
  if (memorial) return MEMORIAL_GAIN;
  const g = Math.min(1, Math.max(0, glow ?? 0));
  return ASLEEP_GAIN + (1 - ASLEEP_GAIN) * g;
}

export function bedUrl(siteId: string, c: Clips = clips, p: Record<string, 1 | 2> = picks): string | null {
  const file = c.sites[siteId]?.beds[(p[siteId] ?? 1) - 1];
  return file ? AUDIO_BASE + file : null;
}

async function load(url: string): Promise<AudioBuffer> {
  const cached = buffers.get(url);
  if (cached) return cached;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buffer = await getAudioContext().decodeAudioData(await res.arrayBuffer());
  buffers.set(url, buffer);
  return buffer;
}

function rampTo(gain: GainNode, value: number, seconds: number): void {
  const t = getAudioContext().currentTime;
  // Anchor at the current level so a ramp during the fade-in does not jump.
  gain.gain.cancelScheduledValues(t);
  gain.gain.setValueAtTime(gain.gain.value, t);
  gain.gain.linearRampToValueAtTime(value, t + seconds);
}

async function start(bed: Bed, url: string): Promise<BedState> {
  let buffer: AudioBuffer;
  try {
    buffer = await load(url);
  } catch {
    await new Promise((r) => setTimeout(r, RETRY_MS));
    if (current !== bed) return "failed";
    try {
      buffer = await load(url);
    } catch {
      console.info(`LAMPA: the sound bed of ${bed.siteId} did not load`);
      return "failed";
    }
  }
  if (current !== bed) return "failed";
  const ctx = getAudioContext();
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const gain = ctx.createGain();
  bed.target = bedGain(bed.glow, bed.memorial);
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(bed.target, ctx.currentTime + FADE_IN_S);
  source.connect(gain).connect(ctx.destination);
  source.start();
  bed.source = source;
  bed.gain = gain;
  return "playing";
}

/** Starts the site's bed, or for the current site returns the same promise and only applies the glow. */
export function playBed(siteId: string, glow: number | null): Promise<BedState> {
  if (current?.siteId === siteId) {
    setBedGlow(glow);
    return current.promise;
  }
  stopBed();
  const bed = { siteId, glow, memorial: sites.find((s) => s.id === siteId)?.is_memorial ?? false } as Bed;
  current = bed;
  const url = bedUrl(siteId);
  bed.promise = (url ? start(bed, url) : Promise.resolve<BedState>("failed")).then((state) => {
    // A failed bed is dropped so the next playBed for the site loads afresh.
    if (state === "failed" && current === bed) current = null;
    return state;
  });
  return bed.promise;
}

export function setBedGlow(glow: number | null): void {
  if (!current) return;
  current.glow = glow;
  const level = bedGain(glow, current.memorial);
  if (!current.gain || level === current.target) return;
  current.target = level;
  rampTo(current.gain, level, RAMP_S);
}

export function stopBed(): void {
  const bed = current;
  current = null;
  if (!bed?.source || !bed.gain) return;
  const { source, gain } = bed;
  rampTo(gain, 0, RAMP_S);
  source.onended = () => {
    source.disconnect();
    gain.disconnect();
  };
  source.stop(getAudioContext().currentTime + RAMP_S);
}
