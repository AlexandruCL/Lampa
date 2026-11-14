import { sites } from "@lampa/shared";
import { useEffect, type RefObject } from "react";
import { getAudioContext, unlockAudio } from "./context";
import { bedUrl, FADE_IN_S, loadBuffer, RAMP_S } from "./engine";

// Patrick's decisions, hour 24 (B3-5.a.1).
export const ROOM_MASTER = 0.8;
export const ROOM_PAN_MAX = 0.8;
const READ_MS = 1000;

export const roomGain = (glow: number): number => ROOM_MASTER * Math.min(1, Math.max(0, glow));

/** Stereo pan from the site's x on the map: −0.8 at the left edge, 0.8 at the right. */
export const roomPan = (x: number, width: number): number => ROOM_PAN_MAX * ((2 * x) / width - 1);

/** The colour sites placed on the map: never the memorial, never the Gallery (not a site). */
export function roomSites(placed: readonly { id: string; x: number }[]): string[] {
  return sites.filter((s) => !s.is_memorial && placed.some((p) => p.id === s.id)).map((s) => s.id);
}

function rampTo(gain: GainNode, value: number, seconds: number): void {
  const t = getAudioContext().currentTime;
  gain.gain.cancelScheduledValues(t);
  gain.gain.setValueAtTime(gain.gain.value, t);
  gain.gain.linearRampToValueAtTime(value, t + seconds);
}

/**
 * The Living Map's room sound: each colour site's bed panned to its place, at its glow.
 * Mounted right after the "Start the Living Map" click; plays to the destination, not the duck bus.
 */
export function useRoomSound(glowRef: RefObject<Record<string, number>>, placed: readonly { id: string; x: number }[], width: number): void {
  useEffect(() => {
    void unlockAudio(); // the effect of the click's render, still inside its user activation
    const ctx = getAudioContext();
    const voices = new Map<string, { source: AudioBufferSourceNode; gain: GainNode; level: number }>();
    let gone = false;
    const glowOf = (id: string) => roomGain(glowRef.current?.[id] ?? 0);

    for (const id of roomSites(placed)) {
      const url = bedUrl(id);
      if (!url) continue;
      loadBuffer(url).then(
        (buffer) => {
          if (gone) return;
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.loop = true;
          const panner = ctx.createStereoPanner();
          panner.pan.setValueAtTime(roomPan(placed.find((p) => p.id === id)!.x, width), ctx.currentTime);
          const gain = ctx.createGain();
          const level = glowOf(id);
          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(level, ctx.currentTime + FADE_IN_S);
          source.connect(panner).connect(gain).connect(ctx.destination);
          source.onended = () => {
            source.disconnect();
            panner.disconnect();
            gain.disconnect();
          };
          source.start();
          voices.set(id, { source, gain, level });
        },
        () => console.info(`LAMPA: the room sound of ${id} did not load`),
      );
    }

    // Patrick, hour 24: the glow is read once a second, and a changed level ramps over RAMP_S.
    const timer = setInterval(() => {
      for (const [id, v] of voices) {
        const level = glowOf(id);
        if (level === v.level) continue;
        v.level = level;
        rampTo(v.gain, level, RAMP_S);
      }
    }, READ_MS);

    return () => {
      gone = true;
      clearInterval(timer);
      for (const { source, gain } of voices.values()) {
        rampTo(gain, 0, RAMP_S);
        source.stop(ctx.currentTime + RAMP_S);
      }
    };
  }, [glowRef, placed, width]);
}
