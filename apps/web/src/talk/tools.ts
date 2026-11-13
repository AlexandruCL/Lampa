import { colourName } from "@lampa/shared";

export const LIGHT_OK = "ok";
export const LIGHT_UNKNOWN = "unknown colour";
export const LENS_CLOSED = "the visitor closed the lens";

/** The agent's `set_light` call as a tint (DESIGN 5.2: at most 25 % alpha), or null if the parameters are not valid. */
export function parseLight(params: unknown): { hex: string; alpha: number } | null {
  if (typeof params !== "object" || params === null) return null;
  const { color, intensity } = params as Record<string, unknown>;
  if (typeof color !== "string" || !/^#[0-9a-fA-F]{6}$/.test(color)) return null;
  if (typeof intensity !== "number" || !Number.isFinite(intensity)) return null;
  return { hex: color, alpha: Math.min(Math.max(intensity, 0), 1) * 0.25 };
}

/** The line sent to the agent when the visitor catches a colour (concept Sketch 2). */
export const caughtLine = (hex: string): string => `caught ${colourName(hex).en} (${hex})`;
