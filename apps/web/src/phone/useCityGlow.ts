import { GlowMessage, SocketMessage } from "@lampa/shared";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { API_URL } from "../api/client";

/** Live glow of every site (room "city"); keeps the last map on disconnect. `glow` is `null` until the first message. */
export function useCityGlow(): { glow: Record<string, number> | null; connected: boolean } {
  const [glow, setGlow] = useState<Record<string, number> | null>(null);
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    const socket = io(`${API_URL}/live`, { query: { room: "city" } });
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on(SocketMessage.enum.glow, (m: unknown) => {
      const p = GlowMessage.safeParse(m);
      if (p.success) setGlow(Object.fromEntries(p.data.sites.map((s) => [s.siteId, s.glow])));
    });
    return () => {
      socket.close();
    };
  }, []);
  return { glow, connected };
}
