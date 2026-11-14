import { BellMessage, HarmonyMessage, LampsMessage, PaneMessage, ScreenState, SocketMessage } from "@lampa/shared";
import { useCallback, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { API_URL } from "../api/client";
import { siteGlow } from "./glow";
import { applyPane, applySnapshot, emptyWindow, type WindowPanes } from "./panes";

/** One site's stored window; `undefined` when it has none yet or the fetch fails. */
export const fetchStoredWindow = async (siteId: string) => (await fetchStoredWindows())?.find((w) => w.siteId === siteId);

/** Every site's window as stored, from the snapshot /screen uses; `undefined` when the fetch fails. */
export async function fetchStoredWindows(): Promise<{ siteId: string; windowId: string; panes: (string | null)[] }[] | undefined> {
  try {
    const res = await fetch(`${API_URL}/screen/state`);
    if (res.status !== 200) return undefined;
    const state = ScreenState.safeParse(await res.json());
    return state.success ? state.data.windows : undefined;
  } catch {
    return undefined;
  }
}

type AddPane = (pane: { windowId: string; slot: number; hex: string }) => void;

/** Live glow and window panes of one site; keeps the last values on disconnect. `glow` is `null` until the first message. */
export function useSiteGlow(siteId: string): { glow: number | null; connected: boolean; panes: WindowPanes; addPane: AddPane; lamps: LampsMessage | null; bell: BellMessage | null; harmony: HarmonyMessage | null } {
  const [glow, setGlow] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);
  const [panes, setPanes] = useState(emptyWindow);
  const [lamps, setLamps] = useState<LampsMessage | null>(null);
  // The last message of each kind; a new object each time, so an effect on it runs once per message.
  const [bell, setBell] = useState<BellMessage | null>(null);
  const [harmony, setHarmony] = useState<HarmonyMessage | null>(null);
  const addPane = useCallback<AddPane>((p) => setPanes((s) => applyPane(s, p)), []);
  useEffect(() => {
    const socket = io(`${API_URL}/live`, { query: { room: `site:${siteId}` } });
    let live = true;
    socket.on("connect", () => {
      setConnected(true);
      // The socket only carries panes caught from now on; a failed fetch leaves the window as it is.
      void fetchStoredWindow(siteId).then((stored) => live && stored && setPanes((s) => applySnapshot(s, stored)));
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on(SocketMessage.enum.glow, (m: unknown) => {
      const g = siteGlow(m, siteId);
      if (g !== undefined) setGlow(g);
    });
    socket.on(SocketMessage.enum.pane, (m: unknown) => {
      const p = PaneMessage.safeParse(m);
      if (p.success && p.data.siteId === siteId) addPane(p.data);
    });
    socket.on(SocketMessage.enum.lamps, (m: unknown) => {
      const l = LampsMessage.safeParse(m);
      if (l.success) setLamps(l.data);
    });
    socket.on(SocketMessage.enum.bell, (m: unknown) => {
      const b = BellMessage.safeParse(m);
      if (b.success && b.data.siteId === siteId) setBell(b.data);
    });
    socket.on(SocketMessage.enum.harmony, (m: unknown) => {
      const h = HarmonyMessage.safeParse(m);
      if (h.success && h.data.siteId === siteId) setHarmony(h.data);
    });
    return () => {
      live = false;
      socket.close();
    };
  }, [siteId, addPane]);
  return { glow, connected, panes, addPane, lamps, bell, harmony };
}
