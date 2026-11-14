import type { BellTower } from "@lampa/shared";
import { getAudioContext } from "../audio/context";

/** One pitch per tower, a fifth apart. */
export const TOWER_HZ: Record<BellTower, number> = { catholic: 220, serbian: 330 };
/** A major: both tower pitches and the third between them. */
export const HARMONY_HZ = [220, 277.18, 330];

// Bell partials (hum, prime, minor third, fifth, octave): [ratio to the pitch, level, seconds to fade].
const PARTIALS = [
  [0.5, 0.25, 3],
  [1, 0.5, 2.2],
  [1.2, 0.2, 1.4],
  [1.5, 0.15, 1],
  [2, 0.25, 0.8],
] as const;

function strike(hz: number, gain: number): void {
  const ctx = getAudioContext();
  const t = ctx.currentTime;
  for (const [ratio, level, seconds] of PARTIALS) {
    const osc = ctx.createOscillator();
    osc.frequency.value = hz * ratio;
    const env = ctx.createGain();
    env.gain.setValueAtTime(gain * level, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
    osc.connect(env).connect(ctx.destination);
    osc.onended = () => {
      osc.disconnect();
      env.disconnect();
    };
    osc.start(t);
    osc.stop(t + seconds);
  }
}

export function ringBell(tower: BellTower): void {
  strike(TOWER_HZ[tower], 0.5);
}

/** The towers rang together. */
export function harmonyChord(): void {
  for (const hz of HARMONY_HZ) strike(hz, 0.25);
}
