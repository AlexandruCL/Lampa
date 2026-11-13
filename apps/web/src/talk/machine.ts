/** DESIGN 7.3: no live session within 8 s switches to the clip fallback. */
export const TALK_CONNECT_MS = 8000;

export type TalkMode = "connecting" | "live" | "fallback" | "timeup";
export type TalkEvent =
  | { type: "timeout" }
  | { type: "session_failed" } // any non-200 from GET /agent/session, or a network failure
  | { type: "mic_denied" }
  | { type: "connected" }
  | { type: "error" }
  | { type: "disconnected"; reason: "error" | "agent" | "user" };
export type TalkStep = { mode: TalkMode; notice: "resting" | "mic_off" | null; endSession: boolean; caption: "timeup" | null };

const stay = (mode: TalkMode): TalkStep => ({ mode, notice: null, endSession: false, caption: null });
const resting: TalkStep = { mode: "fallback", notice: "resting", endSession: false, caption: null };

/** The Talk screen's switch rules (Patrick's decision, hour 10). */
export function step(mode: TalkMode, event: TalkEvent): TalkStep {
  const failed = event.type === "error" || (event.type === "disconnected" && event.reason === "error");
  switch (mode) {
    case "connecting":
      if (failed || event.type === "timeout" || event.type === "session_failed") return resting;
      if (event.type === "mic_denied") return { ...resting, notice: "mic_off" };
      if (event.type === "connected") return stay("live");
      return stay(mode);
    case "live":
      // an error may leave the socket open, so end it; a disconnect is already closed
      if (event.type === "error") return { ...resting, endSession: true };
      if (failed) return resting;
      // SDK: reason "agent" is a close with code 1000 or end_call, which this agent lacks, so it is the 120 s cap.
      if (event.type === "disconnected" && event.reason === "agent") return { ...stay("timeup"), caption: "timeup" };
      return stay(mode);
    case "fallback":
    case "timeup":
      // A session that connects after the switch would bill: end it.
      return event.type === "connected" ? { ...stay(mode), endSession: true } : stay(mode);
  }
}
