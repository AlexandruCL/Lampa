/** One colour read by the lens. hue 0 to under 360, saturation and lightness 0 to 1 (HSL), bin null is night glass. */
export type Reading = {
  r: number;
  g: number;
  b: number;
  hex: string;
  hue: number;
  saturation: number;
  lightness: number;
  bin: number | null;
};
