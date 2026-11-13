import { PaneMessage, ScreenState, WindowCompleteMessage } from "@lampa/shared";
import { SLOTS } from "./rose";

export type WindowState = { windowId: string | null; panes: (string | null)[] };
export type WindowsState = { windows: Record<string, WindowState>; coloursToday: number | null };

const emptyWindow = (windowId: string | null): WindowState => ({ windowId, panes: Array<string | null>(SLOTS).fill(null) });

export function emptyWindows(siteIds: string[]): WindowsState {
  return { windows: Object.fromEntries(siteIds.map((id) => [id, emptyWindow(null)])), coloursToday: null };
}

// Each apply returns the same object when the message changes nothing, so callers can skip a redraw by identity.
export function applyState(state: WindowsState, message: unknown): WindowsState {
  const parsed = ScreenState.safeParse(message);
  if (!parsed.success) return state;
  const windows = { ...state.windows };
  for (const w of parsed.data.windows) {
    if (Object.hasOwn(windows, w.siteId)) windows[w.siteId] = { windowId: w.windowId, panes: [...w.panes] };
  }
  return { windows, coloursToday: parsed.data.coloursToday };
}

export function applyPane(state: WindowsState, message: unknown): WindowsState {
  const parsed = PaneMessage.safeParse(message);
  if (!parsed.success || !Object.hasOwn(state.windows, parsed.data.siteId)) return state;
  const { siteId, windowId, slot, hex } = parsed.data;
  const current = state.windows[siteId];
  const window = current.windowId === windowId ? { windowId, panes: [...current.panes] } : emptyWindow(windowId);
  window.panes[slot] = hex;
  return { windows: { ...state.windows, [siteId]: window }, coloursToday: (state.coloursToday ?? 0) + 1 };
}

export function applyWindowComplete(state: WindowsState, message: unknown): WindowsState {
  const parsed = WindowCompleteMessage.safeParse(message);
  if (!parsed.success) return state;
  if (!Object.hasOwn(state.windows, parsed.data.siteId)) return state;
  if (state.windows[parsed.data.siteId].windowId !== parsed.data.windowId) return state;
  return { ...state, windows: { ...state.windows, [parsed.data.siteId]: emptyWindow(null) } };
}
