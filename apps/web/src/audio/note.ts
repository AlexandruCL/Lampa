import { hexHue } from "@lampa/shared";
import type { Reading } from "../colour/reading";
import { AUDIO_BASE, clips } from "./clips";
import { getAudioContext } from "./context";

export const PENTATONIC = [0, 2, 4, 7, 9] as const;
export const TONE_GAP_MS = 250;
export const TONE_GAIN = 0.4;
export const CLINK_GAIN = 0.6;
export const CLINK_S = 0.6;
export const CHORD_GAIN = 0.25;
export const CHORD_MAX = 5;

/** playbackRate for the glass sample. hue null is night glass. */
export function noteRate(hue: number | null, lightness: number): number {
  if (hue === null) return 0.5;
  const step = PENTATONIC[Math.min(4, Math.floor(hue / 72))];
  const octave = lightness < 0.35 ? -1 : lightness <= 0.65 ? 0 : 1;
  return 2 ** ((step + 12 * octave) / 12);
}

type Tone = { rate: number; at: number };

/** A tone plays when there was none, or when the note changed and TONE_GAP_MS passed since the last. */
export function shouldPlay(rate: number, now: number, last: Tone | null): boolean {
  return !last || (rate !== last.rate && now - last.at >= TONE_GAP_MS);
}

/** Distinct rates of the window's colours, lowest CHORD_MAX. null hexes are skipped; a grey is night glass. */
export function chordRates(hexes: (string | null)[]): number[] {
  const rates = new Set<number>();
  for (const hex of hexes) {
    if (hex === null) continue;
    const n = parseInt(hex.slice(1), 16);
    const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255];
    rates.add(noteRate(hexHue(hex), (Math.max(r, g, b) + Math.min(r, g, b)) / 510));
  }
  return [...rates].sort((a, b) => a - b).slice(0, CHORD_MAX);
}

let glass: Promise<AudioBuffer | null> | undefined;

/** Loads the glass sample once; a failure is logged once and never retried within the page. */
function loadGlass(): Promise<AudioBuffer | null> {
  return (glass ??= (async () => {
    if (!clips.project.glass) throw new Error("no glass sample");
    const res = await fetch(AUDIO_BASE + clips.project.glass);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return getAudioContext().decodeAudioData(await res.arrayBuffer());
  })().catch(() => {
    console.info("LAMPA: the glass sample did not load");
    return null;
  }));
}

function play(rates: number[], gain: number, seconds?: number): void {
  void loadGlass().then((buffer) => {
    if (!buffer) return;
    const ctx = getAudioContext();
    const t = ctx.currentTime;
    for (const rate of rates) {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = rate;
      const level = ctx.createGain();
      level.gain.value = gain;
      source.connect(level).connect(ctx.destination);
      source.onended = () => {
        source.disconnect();
        level.disconnect();
      };
      source.start(t);
      if (seconds !== undefined) source.stop(t + seconds);
    }
  });
}

let lastTone: Tone | null = null;

/** Lens reading: plays only when the note changes, at most once per TONE_GAP_MS. */
export function readingTone(reading: Reading): void {
  const rate = noteRate(reading.bin === null ? null : reading.hue, reading.lightness);
  // performance.now, not ctx.currentTime: the context clock stands still while suspended.
  const now = performance.now();
  if (!shouldPlay(rate, now, lastTone)) return;
  lastTone = { rate, at: now };
  play([rate], TONE_GAIN);
}

/** Colour caught: the clink. */
export function caughtClink(reading: Reading): void {
  play([2 * noteRate(reading.bin === null ? null : reading.hue, reading.lightness)], CLINK_GAIN, CLINK_S);
}

/** Window completed by this visitor: the chord of its colours. */
export function windowChord(hexes: (string | null)[]): void {
  play(chordRates(hexes), CHORD_GAIN);
}
