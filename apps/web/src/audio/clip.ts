import { AUDIO_BASE } from "./clips";
import { getAudioContext, unlockAudio } from "./context";

export type ClipEnd = "ended" | "stopped" | "failed";
type Clip = { resolve: (end: ClipEnd) => void; source?: AudioBufferSourceNode };

let current: Clip | null = null;
const buffers = new Map<string, AudioBuffer>();

async function load(file: string): Promise<AudioBuffer> {
  const cached = buffers.get(file);
  if (cached) return cached;
  const res = await fetch(AUDIO_BASE + file);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  // Vercel answers a missing file with index.html and a 200: the decode rejects it
  const buffer = await getAudioContext().decodeAudioData(await res.arrayBuffer());
  buffers.set(file, buffer);
  return buffer;
}

/**
 * Plays one clip through the unlocked context, stopping the one before. No retry.
 * `inTap`: the caller is inside a tap, so a context iOS suspended or interrupted since the unlock is resumed here.
 * A context still not running resolves "failed": a source started on it would never end.
 */
export function playClip(file: string, inTap = false): Promise<ClipEnd> {
  stopClip();
  // resume() is called synchronously, before any await, so iOS counts it as part of the tap
  const unlocked = inTap ? unlockAudio() : null;
  return new Promise((resolve) => {
    const clip: Clip = { resolve };
    current = clip;
    Promise.all([load(file), unlocked]).then(
      ([buffer]) => {
        if (current !== clip) return; // stopped while loading, already resolved
        const ctx = getAudioContext();
        if (ctx.state !== "running") {
          current = null;
          return resolve("failed");
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.onended = () => {
          source.disconnect();
          if (current === clip) current = null;
          resolve("ended"); // a no-op after "stopped"
        };
        clip.source = source;
        source.start();
      },
      () => {
        if (current !== clip) return;
        current = null;
        resolve("failed");
      },
    );
  });
}

export function stopClip(): void {
  const clip = current;
  current = null;
  if (!clip) return;
  clip.resolve("stopped");
  clip.source?.stop();
}
