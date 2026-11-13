import { PaneMessage, SocketMessage } from "@lampa/shared";
import { useCallback, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { API_URL } from "../api/client";
import { siteGlow } from "./glow";
import { applyPane, emptyWindow, type WindowPanes } from "./panes";

type AddPane = (pane: { windowId: string; slot: number; hex: string }) => void;

/** Live glow and window panes of one site; keeps the last values on disconnect. `glow` is `null` until the first message. */
export function useSiteGlow(siteId: string): { glow: number | null; connected: boolean; panes: WindowPanes; addPane: AddPane } {
  const [glow, setGlow] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);
  const [panes, setPanes] = useState(emptyWindow);
  const addPane = useCallback<AddPane>((p) => setPanes((s) => applyPane(s, p)), []);
  useEffect(() => {
    const socket = io(`${API_URL}/live`, { query: { room: `site:${siteId}` } });
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on(SocketMessage.enum.glow, (m: unknown) => {
      const g = siteGlow(m, siteId);
      if (g !== undefined) setGlow(g);
    });
    socket.on(SocketMessage.enum.pane, (m: unknown) => {
      const p = PaneMessage.safeParse(m);
      if (p.success && p.data.siteId === siteId) addPane(p.data);
    });
    return () => {
      socket.close();
    };
  }, [siteId, addPane]);
  return { glow, connected, panes, addPane };
}
