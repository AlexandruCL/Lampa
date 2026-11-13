import type { PaneMessage, WindowCompleteMessage } from "@lampa/shared";
import { SLOTS } from "./rose";
import type { WindowsState } from "./windows";

export const DEMO_PANE_MS = 500;
export const DEMO_GLOW: Record<string, number> = { mx: 0.2, unirii: 0.45, victoriei: 0.7, bastion: 1 };

const SATURATION = 0.7;
const LIGHTNESS = 0.55;

// A completed window resets to windowId null, so the per-site serial behind demo-<n> lives here.
const completedWindows = new Map<string, number>();

function hslHex(hue: number, s: number, l: number): string {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + hue / 30) % 12;
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return `#${((f(0) << 16) | (f(8) << 8) | f(4)).toString(16).padStart(6, "0")}`;
}

/** The next simulated pane for one of the state's windows; the 48th pane also carries the completion. */
export function nextDemoMessage(
  state: WindowsState,
  random: () => number,
): { pane: PaneMessage; complete?: WindowCompleteMessage } {
  const siteIds = Object.keys(state.windows);
  const siteId = siteIds[Math.floor(random() * siteIds.length)];
  const window = state.windows[siteId];
  const windowId = window.windowId ?? `demo-${(completedWindows.get(siteId) ?? 0) + 1}`;
  const panes = window.windowId === null ? [] : window.panes;
  const free = SLOTS - panes.filter(Boolean).length;
  const slot = window.windowId === null ? 0 : panes.indexOf(null);
  const pane = { siteId, windowId, slot, hex: hslHex(Math.floor(random() * 360), SATURATION, LIGHTNESS) };
  if (free > 1) return { pane };
  completedWindows.set(siteId, Number(windowId.slice("demo-".length)));
  return { pane, complete: { siteId, windowId } };
}
