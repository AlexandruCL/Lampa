import { CandleMessage, PaneMessage, ScreenState, SiteDetail, SocketMessage, WindowCompleteMessage } from "@lampa/shared";
import { useEffect, useRef, useState, type RefObject } from "react";
import { io } from "socket.io-client";
import { API_URL } from "../api/client";
import { applyCandle, applyCandleState, candleDecay, CANDLE_MIN_DECAY, type Candle } from "./candles";
import { DEMO_CANDLE_MS, DEMO_GLOW, DEMO_PANE_MS, nextDemoCandle, nextDemoMessage } from "./demoFeed";
import { applyGlow } from "./glow";
import { unknownIds } from "./newSites";
import { addTickerEvent, parseEcho } from "./tickerCopy";
import { applyPane, applyState, applyWindowComplete, emptyWindows, type WindowsState } from "./windows";

export type ScreenEffect =
  | { kind: "pane"; siteId: string; slot: number; hex: string; at: number }
  | { kind: "complete"; siteId: string; panes: (string | null)[]; at: number }
  | { kind: "echo"; siteId: string; at: number };

export type ScreenEvent =
  | { kind: "pane"; siteId: string; hex: string; at: number }
  | { kind: "complete"; siteId: string; at: number }
  | { kind: "echo"; siteId: string; at: number }
  | { kind: "place"; siteId: string; at: number }
  | { kind: "candle"; at: number };

export type ScreenSubtitle = { siteId: string; text: string; lang: string | null; at: number };

const SUBTITLE_CHARS = 90;

/**
 * `siteIds` are the colour sites and `knownIds` every site on the map; both may grow without a reconnect.
 * A glow naming a site outside `knownIds` fetches its detail and hands it to `onSite`, which must keep its identity.
 */
export function useScreenSocket(
  siteIds: string[],
  demo: boolean,
  knownIds: string[],
  onSite: (detail: SiteDetail) => void,
): {
  glowRef: RefObject<Record<string, number>>;
  windowsRef: RefObject<WindowsState>;
  effectsRef: RefObject<ScreenEffect[]>;
  candlesRef: RefObject<Candle[]>;
  connected: boolean;
  coloursToday: number | null;
  events: ScreenEvent[];
  subtitles: ScreenSubtitle[];
} {
  const glowRef = useRef<Record<string, number>>({});
  const windowsRef = useRef<WindowsState>(emptyWindows(siteIds));
  const effectsRef = useRef<ScreenEffect[]>([]);
  const candlesRef = useRef<Candle[]>([]);
  const [connected, setConnected] = useState(false);
  const [coloursToday, setColoursToday] = useState<number | null>(null);
  const [events, setEvents] = useState<ScreenEvent[]>([]);
  const [subtitles, setSubtitles] = useState<ScreenSubtitle[]>([]);
  const siteIdsRef = useRef(siteIds);
  const knownIdsRef = useRef(knownIds);

  useEffect(() => {
    siteIdsRef.current = siteIds;
    knownIdsRef.current = knownIds;
    const missing = siteIds.filter((id) => !Object.hasOwn(windowsRef.current.windows, id));
    if (missing.length === 0) return;
    const { windows, coloursToday } = windowsRef.current;
    windowsRef.current = { windows: { ...windows, ...emptyWindows(missing).windows }, coloursToday };
  }, [siteIds, knownIds]);

  useEffect(() => {
    windowsRef.current = emptyWindows(siteIdsRef.current);
    effectsRef.current = [];
    candlesRef.current = [];
    const addEvent = (event: ScreenEvent) => setEvents((list) => addTickerEvent(list, event));

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
    const onCandle = (message: unknown) => {
      const before = candlesRef.current;
      const after = applyCandle(before, message, Date.now());
      if (after === before) return;
      candlesRef.current = after;
      // A candle already past the minimum decay only prunes the list: it gets no ticker line.
      if (after.some((c) => c.id === CandleMessage.parse(message).id)) addEvent({ kind: "candle", at: Date.now() });
    };
    const onEcho = (message: unknown) => {
      const echo = parseEcho(message, siteIdsRef.current);
      if (!echo) return;
      const { siteId, transcript, lang } = echo;
      const at = Date.now();
      effectsRef.current.push({ kind: "echo", siteId, at: performance.now() });
      addEvent({ kind: "echo", siteId, at });
      if (transcript === null) return;
      const text = [...transcript].slice(0, SUBTITLE_CHARS).join("");
      setSubtitles((list) => [...list.filter((s) => s.siteId !== siteId), { siteId, text, lang, at }]);
    };

    if (demo) {
      glowRef.current = { ...DEMO_GLOW };
      setConnected(true);
      const timer = setInterval(() => {
        const { pane, complete } = nextDemoMessage(windowsRef.current, Math.random);
        onPane(pane);
        if (complete) onComplete(complete);
      }, DEMO_PANE_MS);
      let candles = 0;
      const candleTimer = setInterval(() => onCandle(nextDemoCandle(++candles, Date.now())), DEMO_CANDLE_MS);
      return () => {
        clearInterval(timer);
        clearInterval(candleTimer);
      };
    }

    let live = true;
    const fetchState = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/screen/state`);
        if (res.status !== 200) return;
        const body: unknown = await res.json();
        if (!live) return;
        const state = ScreenState.safeParse(body);
        if (state.success) candlesRef.current = applyCandleState(candlesRef.current, state.data.candles, Date.now());
        const after = applyState(windowsRef.current, body);
        if (after === windowsRef.current) return;
        windowsRef.current = after;
        setColoursToday(after.coloursToday);
      } catch {
        // GET /screen/state is Fabi's and may not exist yet: a failed fetch leaves the windows as they are.
      }
    };

    // Ids being fetched or already handed to onSite, until knownIds catches up.
    const asked = new Set<string>();
    // Ids in the first glow after a connect were published before it: a reload is not a publish (DESIGN.md 7.13).
    let atConnect: Set<string> | null = null;
    const fetchSite = async (id: string, isNew: boolean) => {
      asked.add(id);
      try {
        const res = await fetch(`${API_URL}/sites/${encodeURIComponent(id)}`);
        const detail = SiteDetail.safeParse(res.ok ? await res.json() : null);
        if (!detail.success || detail.data.id !== id) throw new Error("no site");
        if (!live) return;
        onSite(detail.data);
        if (isNew) addEvent({ kind: "place", siteId: id, at: Date.now() });
      } catch {
        // A failed fetch is forgotten, so the next glow tries again.
        asked.delete(id);
      }
    };

    const socket = io(`${import.meta.env.VITE_API_URL}/live`, { query: { room: "screen" } });
    socket.on("connect", () => {
      setConnected(true);
      atConnect = null;
      void fetchState();
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on(SocketMessage.enum.glow, (message: unknown) => {
      glowRef.current = applyGlow(glowRef.current, message);
      const unknown = unknownIds(message, new Set([...knownIdsRef.current, ...asked]));
      atConnect ??= new Set(unknown);
      for (const id of unknown) void fetchSite(id, !atConnect.has(id));
      const now = Date.now();
      candlesRef.current = candlesRef.current.filter((c) => candleDecay(c.litAt, now) >= CANDLE_MIN_DECAY);
    });
    socket.on(SocketMessage.enum.pane, onPane);
    socket.on(SocketMessage.enum.window_complete, onComplete);
    socket.on(SocketMessage.enum.candle, onCandle);
    socket.on(SocketMessage.enum.echo_approved, onEcho);
    return () => {
      live = false;
      socket.close();
    };
  }, [demo, onSite]);

  return { glowRef, windowsRef, effectsRef, candlesRef, connected, coloursToday, events, subtitles };
}
