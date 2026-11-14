import { useConversation } from "@elevenlabs/react";
import { AgentSession, SiteDetail, type AgentLang } from "@lampa/shared";
import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { duck } from "../audio/bus";
import { playClip, stopClip, type ClipEnd } from "../audio/clip";
import { clips } from "../audio/clips";
import type { PhoneSite } from "../sites/sites";
import { shownImage } from "./Archive";
import type { Line } from "./Captions";
import { TALK_CONNECT_MS, step, type TalkEvent, type TalkMode, type TalkStep } from "./machine";
import { greetingFor } from "./questions";
import {
  ECHO_OPENED,
  findImage,
  HINT_MS,
  IMAGE_SHOWN,
  LENS_CLOSED,
  LIGHT_OK,
  LIGHT_UNKNOWN,
  nextSiteFrom,
  nextSiteLine,
  NO_NEXT_SITE,
  NO_SUCH_IMAGE,
  parseLight,
  parsePrompt,
  shouldEnd,
  TOOL_END_CAP_MS,
} from "./tools";

/** Where Talk hands the visitor on after a tool: the Echo recorder or Between sites (DESIGN 7.3). */
export type HandOffs = { onEcho?: (prompt?: string) => void; onNextSite?: (siteId: string) => void };

let clipTurn = 0;

/**
 * Talk's clips (greeting, tap-to-ask answers) duck the ambient bus until they end, stop or fail.
 * Only the latest one releases: a clip stopped by the next resolves after the next has taken the duck.
 */
export function playDuckedClip(file: string, inTap = false): Promise<ClipEnd> {
  const t = ++clipTurn;
  duck("clip", true);
  return playClip(file, inTap).then((end) => {
    if (t === clipTurn) duck("clip", false);
    return end;
  });
}

/** The live session of the Talk screen. Must be called inside a `ConversationProvider`. */
export function useLiveTalk(site: PhoneSite, lang: AgentLang, mic: Promise<"granted" | "denied">, handOffs: HandOffs = {}) {
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

  const hand = useRef(handOffs);
  hand.current = handOffs;
  // a hand-off tool waiting for the agent's next turn to finish
  const handOff = useRef<{ calledAt: number; sawSpeaking: boolean; then: () => void } | null>(null);
  const handOffTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // `atLeast`: a timer may fire a millisecond early against Date.now()
  const endIfDone = (atLeast = 0) => {
    const h = handOff.current;
    if (!h || !shouldEnd({ ...h, speaking: conv.current.isSpeaking, now: Math.max(Date.now(), atLeast) })) return;
    handOff.current = null;
    conv.current.endSession();
    h.then();
  };
  const startHandOff = (then: () => void) => {
    clearTimeout(handOffTimer.current);
    const calledAt = Date.now();
    handOff.current = { calledAt, sawSpeaking: false, then };
    handOffTimer.current = setTimeout(() => endIfDone(calledAt + TOOL_END_CAP_MS), TOOL_END_CAP_MS);
  };

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
      // only connecting -> live: a late connect in fallback must not stop a tapped answer
      if (e.type === "connected" && s.mode === "live") stopClip();
      if (s.notice) setNotice(s.notice);
      if (s.caption === "timeup") setTimeUp(true);
      if (s.endSession) conv.current.endSession();
    };

    (async () => {
      const greeting = greetingFor(site.id, lang);
      if (greeting) void playDuckedClip(greeting);
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
          show_archive_image: (params: unknown) => {
            const image = findImage(clips.sites[site.id]?.archive ?? [], params);
            if (!image) return NO_SUCH_IMAGE;
            setLines((ls) => [...ls, { key: `image-${ls.length}`, role: "image", image: shownImage(image, lang) }]);
            return IMAGE_SHOWN;
          },
          start_echo_recording: (params: unknown) => {
            const prompt = parsePrompt(params);
            startHandOff(() => hand.current.onEcho?.(prompt));
            return ECHO_OPENED;
          },
          suggest_next_site: async () => {
            const next = nextSiteFrom(site);
            if (!next) return NO_NEXT_SITE;
            startHandOff(() => hand.current.onNextSite?.(next.id));
            const hint = await Promise.race([
              api(`/sites/${next.id}?lang=en`, { schema: SiteDetail }).then((d) => d.directions_hint, () => null),
              new Promise<null>((r) => setTimeout(() => r(null), HINT_MS)),
            ]);
            return nextSiteLine(next.name, hint);
          },
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
      clearTimeout(handOffTimer.current);
      handOff.current = null;
      catchResolve.current?.(LENS_CLOSED);
      catchResolve.current = null;
      conv.current.endSession();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- once on mount

  // the persona speaks through the SDK's own audio, so its duck follows isSpeaking
  useEffect(() => {
    duck("live", conversation.isSpeaking);
    // the hand-off waits for a turn that starts after the call, then ends with it
    if (handOff.current && conversation.isSpeaking) handOff.current.sawSpeaking = true;
    endIfDone();
  }, [conversation.isSpeaking]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => duck("live", false), []);

  /** A tapped question's answer, shown as a persona line. */
  const addAnswer = (text: string) => setLines((ls) => [...ls, { key: `tap-${ls.length}`, role: "agent", text }]);

  return { conversation, mode, notice, timeUp, lines, light, catchWaiting, settleCatch, addAnswer };
}
