import { GlowMessage } from "@lampa/shared";

const WAKING = 0.15;
const AWAKE = 0.6;

export function applyGlow(state: Record<string, number>, message: unknown): Record<string, number> {
  const parsed = GlowMessage.safeParse(message);
  if (!parsed.success) return state;
  return { ...state, ...Object.fromEntries(parsed.data.sites.map((s) => [s.siteId, s.glow])) };
}

export function glowWord(glow: number): string {
  if (glow < WAKING) return "Asleep";
  if (glow < AWAKE) return "Waking";
  if (glow < 1) return "Awake";
  return "Fully lit";
}

export const glowLine = (glow: number) => `${glowWord(glow)}, ${Math.round(glow * 100)}%`;

export const glowAlpha = (glow: number) => (glow < WAKING ? 0.25 : 0.25 + 0.75 * glow);

export const haloAlpha = (glow: number) => (glow < WAKING ? 0 : 0.35 * glow);
