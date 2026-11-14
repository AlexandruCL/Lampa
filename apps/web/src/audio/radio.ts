import { DUCK_ATTACK_S, DUCK_GAIN, DUCK_RELEASE_S } from "./bus";
import { AUDIO_BASE, clips } from "./clips";
import { getAudioContext } from "./context";
import { loadBuffer } from "./engine";
import { setRoomLevel } from "./room";

export type RadioResult = "ended" | "stopped" | "failed" | "none";

let current: { end(result: RadioResult): void; promise: Promise<RadioResult> } | null = null;

/** The Radio Lampa episode on /screen, its own source to the destination (never playClip). One at a time: a second call while it plays starts nothing. */
export function playRadio(): Promise<RadioResult> {
  if (current) return current.promise;
  const file = clips.project.radio;
  if (!file) return Promise.resolve("none");
  let source: AudioBufferSourceNode | undefined;
  let resolve!: (result: RadioResult) => void;
  const run = {
    promise: new Promise<RadioResult>((r) => (resolve = r)),
    end(result: RadioResult) {
      if (current !== run) return;
      current = null;
      if (source) {
        source.onended = null;
        source.stop();
        source.disconnect();
        setRoomLevel(1, DUCK_RELEASE_S);
      }
      resolve(result);
    },
  };
  current = run; // playing from the call, so the load counts too
  loadBuffer(AUDIO_BASE + file).then(
    (buffer) => {
      if (current !== run) return; // stopped while loading
      const ctx = getAudioContext();
      // Never resume() here: on a suspended clock the source would never end and the room would stay ducked.
      if (ctx.state !== "running") return run.end("failed");
      source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => run.end("ended");
      setRoomLevel(DUCK_GAIN, DUCK_ATTACK_S);
      source.start();
    },
    () => run.end("failed"),
  );
  return run.promise;
}

export function stopRadio(): void {
  current?.end("stopped");
}

export const isRadioPlaying = (): boolean => current !== null;
