export type WindowPanes = { windowId: string | null; filled: (string | null)[] };

export const emptyWindow: WindowPanes = { windowId: null, filled: Array(48).fill(null) };

/** A pane of a new window clears the old panes (Ionut's decision, hour 4); a full window stays until then. */
export function applyPane(state: WindowPanes, pane: { windowId: string; slot: number; hex: string }): WindowPanes {
  const base = pane.windowId === state.windowId ? state.filled : emptyWindow.filled;
  return { windowId: pane.windowId, filled: base.map((h, i) => (i === pane.slot ? pane.hex : h)) };
}

/** The stored window, fetched on connect. Panes that arrived live meanwhile win; a live pane of another window means the stored one is stale. */
export function applySnapshot(state: WindowPanes, snapshot: { windowId: string; panes: (string | null)[] }): WindowPanes {
  if (state.windowId === null) return { windowId: snapshot.windowId, filled: [...snapshot.panes] };
  if (state.windowId !== snapshot.windowId) return state;
  return { windowId: state.windowId, filled: state.filled.map((h, i) => h ?? snapshot.panes[i] ?? null) };
}

/** The city window on `/` (Cristea): one window of colours from every site. `next` is the slot a new colour replaces once it is full. */
export type CityPanes = { filled: (string | null)[]; next: number };
export const emptyCity: CityPanes = { filled: emptyWindow.filled, next: 0 };

/** Takes colours from the sites in turn, so a full site cannot crowd the others out of the 48 slots. */
export function cityFromWindows(windows: readonly { panes: (string | null)[] }[]): CityPanes {
  const caught = windows.map((w) => w.panes.filter((h): h is string => h !== null));
  const colours: string[] = [];
  for (let i = 0; colours.length < 48 && caught.some((c) => i < c.length); i++) {
    for (const c of caught) if (i < c.length && colours.length < 48) colours.push(c[i]);
  }
  return { filled: emptyWindow.filled.map((_, i) => colours[i] ?? null), next: 0 };
}

/** A newly caught colour takes the first empty slot; in a full window it replaces the slots in turn, oldest first. */
export function addCityColour(state: CityPanes, hex: string): CityPanes {
  const empty = state.filled.indexOf(null);
  const slot = empty < 0 ? state.next : empty;
  return { filled: state.filled.map((h, i) => (i === slot ? hex : h)), next: empty < 0 ? (state.next + 1) % 48 : state.next };
}

/** The city's glow: the mean of every site's glow, `null` for no sites. */
export function averageGlow(glows: readonly number[]): number | null {
  return glows.length === 0 ? null : glows.reduce((a, b) => a + b, 0) / glows.length;
}

export function nextEmptySlot(state: WindowPanes): number | null {
  const i = state.filled.indexOf(null);
  return i < 0 ? null : i;
}
