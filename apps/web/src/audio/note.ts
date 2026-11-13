import type { Reading } from "../colour/reading";

export const PENTATONIC = [0, 2, 4, 7, 9] as const;
/** playbackRate for the glass sample. hue null is night glass. */
export function noteRate(hue: number | null, lightness: number): number {
  throw new Error("not implemented");
}
/** Lens reading: plays only when the note changes, at most once per TONE_GAP_MS. */
export function readingTone(reading: Reading): void {
  throw new Error("not implemented");
}
/** Colour caught: the clink. */
export function caughtClink(reading: Reading): void {
  throw new Error("not implemented");
}
/** Window completed by this visitor: the chord of its colours. */
export function windowChord(hexes: (string | null)[]): void {
  throw new Error("not implemented");
}
