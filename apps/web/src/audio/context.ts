let ctx: AudioContext | undefined;

/** The one AudioContext of the page; Patrick's engine plays through this same context. */
export function getAudioContext(): AudioContext {
  return (ctx ??= new AudioContext());
}

/** Calls `resume()` synchronously, so iOS counts it as part of the tap that called this. */
export async function unlockAudio(): Promise<"running" | "blocked"> {
  try {
    const c = getAudioContext();
    await c.resume();
    return c.state === "running" ? "running" : "blocked";
  } catch {
    return "blocked";
  }
}
