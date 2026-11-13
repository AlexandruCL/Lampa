import { useConversation } from "@elevenlabs/react";
import { AgentSession, type AgentLang } from "@lampa/shared";
import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import type { PhoneSite } from "../sites/sites";
import type { Line } from "./Captions";
import { TALK_CONNECT_MS, step, type TalkEvent, type TalkMode, type TalkStep } from "./machine";
import { LENS_CLOSED, LIGHT_OK, LIGHT_UNKNOWN, parseLight } from "./tools";

/** The live session of the Talk screen. Must be called inside a `ConversationProvider`. */
export function useLiveTalk(site: PhoneSite, lang: AgentLang, mic: Promise<"granted" | "denied">) {
  const conversation = useConversation();
  const conv = useRef(conversation);
  conv.current = conversation;
  const modeRef = useRef<TalkMode>("connecting");
  const [mode, setMode] = useState<TalkMode>("connecting");
  const [notice, setNotice] = useState<TalkStep["notice"]>(null);
  const [timeUp, setTimeUp] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [light, setLight] = useState<{ hex: string; alpha: number } | null>(null);
  // the waiting `start_colour_catch` call, at most one
  const catchResolve = useRef<((answer: string) => void) | null>(null);
  const [catchWaiting, setCatchWaiting] = useState(false);

  const settleCatch = (answer: string) => {
    catchResolve.current?.(answer);
    catchResolve.current = null;
    setCatchWaiting(false);
  };

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const dispatch = (e: TalkEvent) => {
      if (cancelled) return;
      const s = step(modeRef.current, e);
      modeRef.current = s.mode;
      setMode(s.mode);
      // a "stay" step carries nulls: keep the last notice and caption
      if (s.notice) setNotice(s.notice);
      if (s.caption === "timeup") setTimeUp(true);
      if (s.endSession) conv.current.endSession();
    };

    (async () => {
      // TODO(B2-2.b.1): play greetingFor(site.id, lang) at once through playClip; stopClip() on "connected".
      if ((await mic) === "denied") return dispatch({ type: "mic_denied" });
      if (cancelled) return;
      // the iOS microphone prompt does not count against the 8 s
      timer = setTimeout(() => dispatch({ type: "timeout" }), TALK_CONNECT_MS);
      let session: AgentSession;
      try {
        session = await api(`/agent/session?site=${site.id}&lang=${lang}`, { schema: AgentSession });
      } catch {
        return dispatch({ type: "session_failed" });
      }
      // gone or already resting: a late session would only bill
      if (cancelled || modeRef.current !== "connecting") return;
      conv.current.startSession({
        signedUrl: session.signedUrl,
        connectionType: "websocket",
        ...(session.overrides && { overrides: session.overrides }),
        dynamicVariables: session.dynamicVariables,
        clientTools: {
          set_light: (params: unknown) => {
            const l = parseLight(params);
            if (!l) return LIGHT_UNKNOWN;
            setLight(l);
            return LIGHT_OK;
          },
          start_colour_catch: () =>
            new Promise<string>((resolve) => {
              catchResolve.current?.(LENS_CLOSED);
              catchResolve.current = resolve;
              setCatchWaiting(true);
            }),
        },
        onConnect: () => dispatch({ type: "connected" }),
        onError: () => dispatch({ type: "error" }),
        onDisconnect: (d) => dispatch({ type: "disconnected", reason: d.reason }),
        // final lines only: the SDK fires once per agent response and once per visitor transcript
        onMessage: (m) => setLines((ls) => [...ls, { key: `${m.role}-${m.event_id}`, role: m.role, text: m.message }]),
      });
    })();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      catchResolve.current?.(LENS_CLOSED);
      catchResolve.current = null;
      conv.current.endSession();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- once on mount

  return { conversation, mode, notice, timeUp, lines, light, catchWaiting, settleCatch };
}
