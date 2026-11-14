import type { BellTower } from "@lampa/shared";
import { AUDIO_BASE, clips } from "../audio/clips";
import { getAudioContext } from "../audio/context";
import { loadBuffer } from "../audio/engine";

const TOWERS = ["catholic", "serbian"] as const;
/** The Catholic recording came out louder than the Serbian one, so it plays at 70%. */
const LEVEL: Record<BellTower, number> = { catholic: 0.7, serbian: 1 };
/** Pitches of the synthesised bell, a fifth apart; it rings until the recordings load, and if they never do. */
export const TOWER_HZ: Record<BellTower, number> = { catholic: 220, serbian: 330 };

const PEAL_START_S = 0.4; // after the attack of the ring that completed the harmony
const PEAL_STEP_S = 0.25;
const PEAL_STRIKES = 6;
const TOGETHER_AT_S = [2.1, 3.1];

// Bell partials (hum, prime, minor third, fifth, octave): [ratio to the pitch, level, seconds to fade].
const PARTIALS = [
  [0.5, 0.25, 3],
  [1, 0.5, 2.2],
  [1.2, 0.2, 1.4],
  [1.5, 0.15, 1],
  [2, 0.25, 0.8],
] as const;

const buffers: Partial<Record<BellTower, AudioBuffer>> = {};

/** Fetches the two recordings, so the first ring is not late. A failed load keeps the synthesised bell. */
export function preloadBells(): void {
  for (const tower of TOWERS) {
    const file = clips.project[`bell_${tower}`];
    if (file && !buffers[tower]) loadBuffer(AUDIO_BASE + file).then((b) => (buffers[tower] = b), () => {});
  }
}

function strike(hz: number, gain: number, delayS: number, out: AudioNode): void {
  const ctx = getAudioContext();
  const t = ctx.currentTime + delayS;
  for (const [ratio, level, seconds] of PARTIALS) {
    const osc = ctx.createOscillator();
    osc.frequency.value = hz * ratio;
    const env = ctx.createGain();
    env.gain.setValueAtTime(gain * level, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
    osc.connect(env).connect(out);
    osc.onended = () => {
      osc.disconnect();
      env.disconnect();
    };
    osc.start(t);
    osc.stop(t + seconds);
  }
}

function ring(tower: BellTower, delayS = 0, out?: AudioNode): void {
  const ctx = getAudioContext();
  const to = out ?? ctx.destination;
  const buffer = buffers[tower];
  if (!buffer) return strike(TOWER_HZ[tower], 0.5, delayS, to);
  const source = new AudioBufferSourceNode(ctx, { buffer });
  const gain = new GainNode(ctx, { gain: LEVEL[tower] });
  source.connect(gain).connect(to);
  source.onended = () => {
    source.disconnect();
    gain.disconnect();
  };
  source.start(ctx.currentTime + delayS);
}

export function ringBell(tower: BellTower): void {
  ring(tower);
}

/** The towers rang together: the two bells answer each other, then strike together twice, with an echo. */
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
  for (let i = 0; i < PEAL_STRIKES; i++) ring(TOWERS[i % 2]!, PEAL_START_S + i * PEAL_STEP_S, bus);
  for (const at of TOGETHER_AT_S) for (const tower of TOWERS) ring(tower, at, bus);
  // Past the last 5 s recording and its echo.
  setTimeout(() => [bus, echo, feedback, limiter].forEach((n) => n.disconnect()), 12_000);
}
