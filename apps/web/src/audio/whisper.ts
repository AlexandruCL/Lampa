import { ambientBus, BED_LEVEL } from "./bus";
import { getAudioContext } from "./context";
import { ASLEEP_GAIN, RAMP_S } from "./engine";

// Patrick's decisions, hour 24 (B3-6.b.1).
const BED_RMS = 0.063; // the bed files are mastered to −24 dBFS RMS
/** An echo plays 8 dB under the quietest (asleep) bed, whatever level it was recorded at. Not yet tuned by ear. */
export const WHISPER_RMS = BED_RMS * BED_LEVEL * ASLEEP_GAIN * 0.4;
export const WHISPER_GAP_MS = 20000;
export const WHISPER_COUNT = 5;

export type Whisper = { echoId: string; audioUrl: string };

/** Round-robin: the echo after the last one played; the first (newest) when there is none or it left the list. */
export function nextWhisper<W extends Whisper>(list: readonly W[], lastPlayedId: string | null): W | null {
  if (list.length === 0) return null;
  return list[(list.findIndex((w) => w.echoId === lastPlayedId) + 1) % list.length];
}

/** Newest first, no duplicates, at most WHISPER_COUNT. */
export function addWhisper<W extends Whisper>(list: readonly W[], w: W): W[] {
  if (list.some((x) => x.echoId === w.echoId)) return [...list];
  return [w, ...list].slice(0, WHISPER_COUNT);
}

/** The gain that brings a recording to WHISPER_RMS; never a boost, and 0 for an empty or silent one. */
export function whisperGain(samples: Float32Array): number {
  let sum = 0;
  for (const x of samples) sum += x * x;
  const rms = Math.sqrt(sum / samples.length);
  return rms > 0 ? Math.min(1, WHISPER_RMS / rms) : 0;
}

/** One echo: source → HRTF panner → gain from whisperGain → ambient bus. `onEnded` runs only when it plays out. */
export function playWhisper(buffer: AudioBuffer, at: { x: number; z: number }, onEnded: () => void) {
  const ctx = getAudioContext();
  const t = ctx.currentTime;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const panner = ctx.createPanner();
  panner.panningModel = "HRTF";
  panner.positionX.setValueAtTime(at.x, t);
  panner.positionY.setValueAtTime(0, t);
  panner.positionZ.setValueAtTime(at.z, t);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(whisperGain(buffer.getChannelData(0)), t);
  source.connect(panner).connect(gain).connect(ambientBus());
  let stopped = false;
  source.onended = () => {
    source.disconnect();
    panner.disconnect();
    gain.disconnect();
    if (!stopped) onEnded();
  };
  source.start();
  return {
    panner,
    /** Fades out over RAMP_S; `onEnded` does not run. */
    stop() {
      stopped = true;
      const now = ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + RAMP_S);
      source.stop(now + RAMP_S);
    },
  };
}
