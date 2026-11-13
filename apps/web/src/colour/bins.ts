export const BIN_COUNT = 12;

/** Hue bin of DESIGN.md 2.4: bin 0 spans 345 to under 15 degrees, each bin 30 degrees wide. */
export function hueBin(hue: number): number {
  const h = ((hue % 360) + 360) % 360;
  return Math.floor(((h + 15) % 360) / 30);
}
