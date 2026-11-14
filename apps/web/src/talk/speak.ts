import type { AgentLang } from "@lampa/shared";

type Synth = Pick<SpeechSynthesis, "speaking" | "pending">;

/** Cancel only what is queued: Safari drops an utterance spoken in the same tick as a `cancel()`. */
const mustCancel = (s: Synth): boolean => s.speaking || s.pending;

// held until it ends: an utterance only the speech queue references can be collected before `onend` fires
let utterance: SpeechSynthesisUtterance | null = null;
// a start put off by a cancel in this tick; `stopSpeaking` drops it
let deferred: { timer: ReturnType<typeof setTimeout>; resolve: (end: "failed") => void } | null = null;
let cancelledThisTick = false;

/** The browser voice reads `text`. A cancel by `stopSpeaking` also resolves "failed": callers drop stale results. */
export function speak(text: string, lang: AgentLang): Promise<"ended" | "failed"> {
  if (typeof speechSynthesis === "undefined") return Promise.resolve("failed");
  stopSpeaking();
  return new Promise((resolve) => {
    const say = () => {
      deferred = null;
      try {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = lang;
        const end = (e: "ended" | "failed") => {
          if (utterance === u) utterance = null;
          resolve(e);
        };
        u.onend = () => end("ended");
        u.onerror = () => end("failed");
        utterance = u;
        speechSynthesis.speak(u);
      } catch {
        resolve("failed");
      }
    };
    // with no cancel the start stays inside the tap, which iOS wants for the first utterance
    if (cancelledThisTick) deferred = { timer: setTimeout(say), resolve };
    else say();
  });
}

export function stopSpeaking(): void {
  if (deferred) {
    clearTimeout(deferred.timer);
    deferred.resolve("failed");
    deferred = null;
  }
  if (typeof speechSynthesis === "undefined" || !mustCancel(speechSynthesis)) return;
  speechSynthesis.cancel();
  cancelledThisTick = true;
  setTimeout(() => (cancelledThisTick = false));
}
