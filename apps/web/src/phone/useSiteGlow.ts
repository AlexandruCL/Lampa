import { SocketMessage } from "@lampa/shared";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { API_URL } from "../api/client";
import { siteGlow } from "./glow";

/** Live glow of one site; keeps the last value on disconnect. `null` until the first message. */
export function useSiteGlow(siteId: string): { glow: number | null; connected: boolean } {
  const [glow, setGlow] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    const socket = io(`${API_URL}/live`, { query: { room: `site:${siteId}` } });
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on(SocketMessage.enum.glow, (m: unknown) => {
      const g = siteGlow(m, siteId);
      if (g !== undefined) setGlow(g);
    });
    return () => {
      socket.close();
    };
  }, [siteId]);
  return { glow, connected };
}
