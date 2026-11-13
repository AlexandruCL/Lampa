import { PaneMessage, SocketMessage, WindowCompleteMessage } from "@lampa/shared";
import { useEffect, useRef, useState, type RefObject } from "react";
import { io } from "socket.io-client";
import { DEMO_GLOW, DEMO_PANE_MS, nextDemoMessage } from "./demoFeed";
import { applyGlow } from "./glow";
import { applyPane, applyState, applyWindowComplete, emptyWindows, type WindowsState } from "./windows";

export type ScreenEffect =
  | { kind: "pane"; siteId: string; slot: number; hex: string; at: number }
  | { kind: "complete"; siteId: string; panes: (string | null)[]; at: number };

export type ScreenEvent = { kind: "pane"; siteId: string; hex: string; at: number } | { kind: "complete"; siteId: string; at: number };

const MAX_EVENTS = 6;

/** `siteIds` must keep its identity across renders: a new array reconnects the socket. */
export function useScreenSocket(
  siteIds: string[],
  demo: boolean,
): {
  glowRef: RefObject<Record<string, number>>;
  windowsRef: RefObject<WindowsState>;
  effectsRef: RefObject<ScreenEffect[]>;
  connected: boolean;
  coloursToday: number | null;
  events: ScreenEvent[];
} {
  const glowRef = useRef<Record<string, number>>({});
  const windowsRef = useRef<WindowsState>(emptyWindows(siteIds));
  const effectsRef = useRef<ScreenEffect[]>([]);
  const [connected, setConnected] = useState(false);
  const [coloursToday, setColoursToday] = useState<number | null>(null);
  const [events, setEvents] = useState<ScreenEvent[]>([]);

  useEffect(() => {
    windowsRef.current = emptyWindows(siteIds);
    effectsRef.current = [];
    const addEvent = (event: ScreenEvent) => setEvents((list) => [event, ...list].slice(0, MAX_EVENTS));

    const onPane = (message: unknown) => {
      const before = windowsRef.current;
      const after = applyPane(before, message);
      if (after === before) return;
      windowsRef.current = after;
      const { siteId, slot, hex } = PaneMessage.parse(message);
      effectsRef.current.push({ kind: "pane", siteId, slot, hex, at: performance.now() });
      addEvent({ kind: "pane", siteId, hex, at: Date.now() });
      setColoursToday(after.coloursToday);
    };
    const onComplete = (message: unknown) => {
      const before = windowsRef.current;
      const after = applyWindowComplete(before, message);
      if (after === before) return;
      windowsRef.current = after;
      const { siteId } = WindowCompleteMessage.parse(message);
      effectsRef.current.push({ kind: "complete", siteId, panes: before.windows[siteId].panes, at: performance.now() });
      addEvent({ kind: "complete", siteId, at: Date.now() });
    };

    if (demo) {
      glowRef.current = { ...DEMO_GLOW };
      setConnected(true);
      const timer = setInterval(() => {
        const { pane, complete } = nextDemoMessage(windowsRef.current, Math.random);
        onPane(pane);
        if (complete) onComplete(complete);
      }, DEMO_PANE_MS);
      return () => clearInterval(timer);
    }

    let live = true;
    const fetchState = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/screen/state`);
        if (res.status !== 200) return;
        const body: unknown = await res.json();
        if (!live) return;
        const after = applyState(windowsRef.current, body);
        if (after === windowsRef.current) return;
        windowsRef.current = after;
        setColoursToday(after.coloursToday);
      } catch {
        // GET /screen/state is Fabi's and may not exist yet: a failed fetch leaves the windows as they are.
      }
    };

    const socket = io(`${import.meta.env.VITE_API_URL}/live`, { query: { room: "screen" } });
    socket.on("connect", () => {
      setConnected(true);
      void fetchState();
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on(SocketMessage.enum.glow, (message: unknown) => {
      glowRef.current = applyGlow(glowRef.current, message);
    });
    socket.on(SocketMessage.enum.pane, onPane);
    socket.on(SocketMessage.enum.window_complete, onComplete);
    return () => {
      live = false;
      socket.close();
    };
  }, [siteIds, demo]);

  return { glowRef, windowsRef, effectsRef, connected, coloursToday, events };
}
