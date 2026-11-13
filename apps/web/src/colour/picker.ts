import { BIN_COUNT, hueBin } from "./bins";
import type { Reading } from "./reading";

/** The lens samples a SAMPLE_SIZE x SAMPLE_SIZE frame. */
export const SAMPLE_SIZE = 64;
export const VIVID_SATURATION_MIN = 0.25;
export const VIVID_VALUE_MIN = 0.2;
/** Under this share of vivid pixels the reading is night glass (Ionut's decision, hour 4). */
export const NIGHT_GLASS_SHARE = 0.05;

/** Hue in degrees, 0 to under 360, of 0 to 255 channels; 0 for a grey. Same for HSV and HSL. */
function hueOf(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  if (d === 0) return 0;
  const h = max === r ? (g - b) / d : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (((h * 60) % 360) + 360) % 360;
}

function toReading(r: number, g: number, b: number, bin: number | null): Reading {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 510;
  // integer arithmetic keeps a fully saturated colour at exactly 1, not 1 + an ulp
  const saturation = max === min ? 0 : (max - min) / (255 - Math.abs(max + min - 255));
  const hex = "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("");
  return { r, g, b, hex, hue: hueOf(r, g, b), saturation, lightness, bin };
}

/** Rounded average RGB of the pixels for which `keep(i)` is true. */
function averageOf(rgba: Uint8ClampedArray, keep: (i: number) => boolean, bin: number | null): Reading {
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let i = 0; i < rgba.length / 4; i++) {
    if (!keep(i)) continue;
    r += rgba[4 * i]!;
    g += rgba[4 * i + 1]!;
    b += rgba[4 * i + 2]!;
    n++;
  }
  return toReading(Math.round(r / n), Math.round(g / n), Math.round(b / n), bin);
}

/** The colour of a frame: the average of the strongest hue bin's vivid pixels, or night glass. `rgba` is 4 bytes per pixel, alpha ignored. */
export function pickColour(rgba: Uint8ClampedArray): Reading {
  const n = rgba.length / 4;
  const weights = new Array<number>(BIN_COUNT).fill(0);
  const binOf = new Int8Array(n).fill(-1);
  let counted = 0;
  for (let i = 0; i < n; i++) {
    const r = rgba[4 * i]!;
    const g = rgba[4 * i + 1]!;
    const b = rgba[4 * i + 2]!;
    const max = Math.max(r, g, b);
    const value = max / 255;
    const saturation = max === 0 ? 0 : (max - Math.min(r, g, b)) / max;
    if (saturation < VIVID_SATURATION_MIN || value < VIVID_VALUE_MIN) continue;
    const bin = hueBin(hueOf(r, g, b));
    weights[bin]! += saturation * value;
    binOf[i] = bin;
    counted++;
  }
  if (counted < NIGHT_GLASS_SHARE * n) return averageOf(rgba, () => true, null);
  let best = 0;
  for (let k = 1; k < BIN_COUNT; k++) if (weights[k]! > weights[best]!) best = k;
  // averaging in RGB keeps bin 0, which wraps across 0 degrees, correct
  return averageOf(rgba, (i) => binOf[i] === best, best);
}

/** Euclidean distance in RGB, 0 to about 441.67. */
export function rgbDistance(a: Reading, b: Reading): number {
  return Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);
}
