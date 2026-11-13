// DESIGN.md 6.6, the same geometry as phone/RoseWindow.tsx: slots per ring and the radius band of each, as fractions of R.
const RINGS = [
  { count: 8, from: 0, to: 0.3 },
  { count: 16, from: 0.34, to: 0.62 },
  { count: 24, from: 0.66, to: 1 },
];

export const SLOTS = 48;

/** Radii as fractions of R; angles in radians, 0 at 12 o'clock, clockwise. */
export type SlotShape = { r0: number; r1: number; a0: number; a1: number };

export function slotShape(slot: number): SlotShape {
  let first = 0;
  for (const { count, from, to } of RINGS) {
    if (slot < first + count) {
      const i = slot - first;
      return { r0: from, r1: to, a0: (i / count) * 2 * Math.PI, a1: ((i + 1) / count) * 2 * Math.PI };
    }
    first += count;
  }
  throw new RangeError(`slot ${slot} is outside 0 to ${SLOTS - 1}`);
}

/** Share of the pane colour over --bg for a filled slot (DESIGN.md 2.3). */
export const paneShare = (glow: number): number => 0.45 + 0.55 * glow;

export function mixHex(pane: string, bg: string, share: number): string {
  const [p, b] = [parseInt(pane.slice(1), 16), parseInt(bg.slice(1), 16)];
  const channel = (shift: number) => {
    const [pc, bc] = [(p >> shift) & 255, (b >> shift) & 255];
    return Math.round(bc + (pc - bc) * share);
  };
  return `#${((channel(16) << 16) | (channel(8) << 8) | channel(0)).toString(16).padStart(6, "0")}`;
}
