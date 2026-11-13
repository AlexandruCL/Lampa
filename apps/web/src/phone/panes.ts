export type WindowPanes = { windowId: string | null; filled: (string | null)[] };

export const emptyWindow: WindowPanes = { windowId: null, filled: Array(48).fill(null) };

/** A pane of a new window clears the old panes (Ionut's decision, hour 4); a full window stays until then. */
export function applyPane(state: WindowPanes, pane: { windowId: string; slot: number; hex: string }): WindowPanes {
  const base = pane.windowId === state.windowId ? state.filled : emptyWindow.filled;
  return { windowId: pane.windowId, filled: base.map((h, i) => (i === pane.slot ? pane.hex : h)) };
}

export function nextEmptySlot(state: WindowPanes): number | null {
  const i = state.filled.indexOf(null);
  return i < 0 ? null : i;
}
