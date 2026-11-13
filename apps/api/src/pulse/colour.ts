/** Saturation of the colour clock's hours (Fabi's decision, hour 10). */
export const CLOCK_SATURATION = 0.8;

/** Standard HSL to RGB: hue in degrees, saturation and lightness 0 to 1, as lowercase #rrggbb. */
export function hslToHex(h: number, s: number, l: number): string {
  const a = s * Math.min(l, 1 - l);
  const k = (n: number) => (n + h / 30) % 12;
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return "#" + [f(0), f(8), f(4)].map((c) => Math.round(c * 255).toString(16).padStart(2, "0")).join("");
}
