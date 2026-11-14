import type { BellTower } from "@lampa/shared";
import { getAudioContext } from "../audio/context";

/** One pitch per tower, a fifth apart. */
export const TOWER_HZ: Record<BellTower, number> = { catholic: 220, serbian: 330 };
// A major over two octaves, from the Catholic bell's pitch up.
const PEAL_HZ = [220, 277.18, 330, 440, 554.37, 660];
const CHORD_HZ = [220, 330, 440, 554.37];
const PEAL_START_S = 0.4; // after the attack of the ring that completed the harmony
const PEAL_STEP_S = 0.16;
const CHORD_AT_S = 1.5;

// Bell partials (hum, prime, minor third, fifth, octave): [ratio to the pitch, level, seconds to fade].
const PARTIALS = [
  [0.5, 0.25, 3],
  [1, 0.5, 2.2],
  [1.2, 0.2, 1.4],
  [1.5, 0.15, 1],
  [2, 0.25, 0.8],
] as const;

function strike(hz: number, gain: number, delayS = 0, stretch = 1, out?: AudioNode): void {
  const ctx = getAudioContext();
  const t = ctx.currentTime + delayS;
  for (const [ratio, level, seconds] of PARTIALS) {
    const osc = ctx.createOscillator();
    osc.frequency.value = hz * ratio;
    const env = ctx.createGain();
    env.gain.setValueAtTime(gain * level, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + seconds * stretch);
    osc.connect(env).connect(out ?? ctx.destination);
    osc.onended = () => {
      osc.disconnect();
      env.disconnect();
    };
    osc.start(t);
    osc.stop(t + seconds * stretch);
  }
}

export function ringBell(tower: BellTower): void {
  strike(TOWER_HZ[tower], 0.5);
}

/** The towers rang together: a peal climbs two octaves, then the full chord rings out with an echo. */
export function harmonyChord(): void {
  const ctx = getAudioContext();
  // Ten strikes overlap, so they pass a limiter; the fed-back delay is the echo off the far side of the square.
  const limiter = new DynamicsCompressorNode(ctx, { threshold: -10, ratio: 12 });
  const echo = new DelayNode(ctx, { delayTime: 0.33 });
  const feedback = new GainNode(ctx, { gain: 0.35 });
  const bus = new GainNode(ctx);
  bus.connect(limiter).connect(ctx.destination);
  bus.connect(echo).connect(limiter);
  echo.connect(feedback).connect(echo);
  PEAL_HZ.forEach((hz, i) => strike(hz, 0.3, PEAL_START_S + i * PEAL_STEP_S, 1, bus));
  for (const hz of CHORD_HZ) strike(hz, 0.3, CHORD_AT_S, 2, bus);
  // The API declares no second harmony for 10 s, so the graph is silent by now.
  setTimeout(() => [bus, echo, feedback, limiter].forEach((n) => n.disconnect()), 10_000);
}
