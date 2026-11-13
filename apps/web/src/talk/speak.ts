import type { AgentLang } from "@lampa/shared";

/** The browser voice reads `text`. A cancel by `stopSpeaking` also resolves "failed": callers drop stale results. */
export function speak(text: string, lang: AgentLang): Promise<"ended" | "failed"> {
  if (typeof speechSynthesis === "undefined") return Promise.resolve("failed");
  stopSpeaking();
  return new Promise((resolve) => {
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      u.onend = () => resolve("ended");
      u.onerror = () => resolve("failed");
      speechSynthesis.speak(u);
    } catch {
      resolve("failed");
    }
  });
}

export function stopSpeaking(): void {
  if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
}
