import { GlowMessage } from "@lampa/shared";

// shortcut: written here with the DESIGN.md 2.3 thresholds because Cristea's screen/glow.ts is not on main; re-export her glowWord and glowLine when it lands.
export function glowWord(glow: number): "Asleep" | "Waking" | "Awake" | "Fully lit" {
  return glow < 0.15 ? "Asleep" : glow < 0.6 ? "Waking" : glow < 1 ? "Awake" : "Fully lit";
}

/** "Awake, 72%" (DESIGN.md 6.5) */
export function glowLine(glow: number): string {
  return `${glowWord(glow)}, ${Math.round(glow * 100)}%`;
}

/** The glow of one site in a socket `glow` message, or undefined when the message is invalid or leaves the site out. */
export function siteGlow(message: unknown, siteId: string): number | undefined {
  const parsed = GlowMessage.safeParse(message);
  return parsed.success ? parsed.data.sites.find((s) => s.siteId === siteId)?.glow : undefined;
}
