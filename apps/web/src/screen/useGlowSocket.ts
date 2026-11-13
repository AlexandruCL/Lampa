import { SocketMessage } from "@lampa/shared";
import { useEffect, useRef, useState, type RefObject } from "react";
import { io } from "socket.io-client";
import { applyGlow } from "./glow";

export function useGlowSocket(): { glowRef: RefObject<Record<string, number>>; connected: boolean } {
  const glowRef = useRef<Record<string, number>>({});
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io(`${import.meta.env.VITE_API_URL}/live`, { query: { room: "screen" } });
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on(SocketMessage.enum.glow, (message: unknown) => {
      glowRef.current = applyGlow(glowRef.current, message);
    });
    return () => {
      socket.close();
    };
  }, []);

  return { glowRef, connected };
}
