import { FinaleMessage, SocketMessage } from "@lampa/shared";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { API_URL } from "../api/client";
import { finaleClock, finalePhase } from "../audio/finale";
import { useClockOffset } from "../lamp/pulse";

/** Device time (`Date.now()`) at which each message came off the socket, for `finaleClock`. */
export const receivedAt = new WeakMap<FinaleMessage, number>();

/** The latest `finale` message on /live that was not already over when it came in. Its own socket, as useWhispers (Patrick, hour 37). */
export function useFinale(): FinaleMessage | null {
  const [message, setMessage] = useState<FinaleMessage | null>(null);
  const offset = useClockOffset();
  const offsetRef = useRef(offset);
  offsetRef.current = offset;

  useEffect(() => {
    const socket = io(`${API_URL}/live`);
    socket.on(SocketMessage.enum.finale, (m: unknown) => {
      const parsed = FinaleMessage.safeParse(m);
      if (!parsed.success) return;
      const now = Date.now();
      const at = parsed.data.startAt;
      if (finalePhase(finaleClock(offsetRef.current, at, now, now), at).phase === "done") return;
      receivedAt.set(parsed.data, now);
      setMessage(parsed.data);
    });
    return () => {
      socket.close();
    };
  }, []);

  return message;
}
