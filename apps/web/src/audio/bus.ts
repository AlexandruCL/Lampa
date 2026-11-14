// apps/web/src/audio/bus.ts (owner: this session; used by engine.ts, nav.ts, whisper.ts; driven by Talk)
import { getAudioContext } from "./context";

export const DUCK_GAIN = 0.25; // −12 dB
export const DUCK_ATTACK_S = 0.2;
export const DUCK_RELEASE_S = 0.8;

let bus: GainNode | undefined;
const holds = new Set<string>();

/** The ambient bus: beds, compass, beacon and whispers connect here, never to destination. */
export function ambientBus(): GainNode {
  if (!bus) {
    const ctx = getAudioContext();
    bus = ctx.createGain();
    bus.connect(ctx.destination);
  }
  return bus;
}

/** Duck the ambient bus while any holder ("live", "clip") is on. */
export function duck(holder: string, on: boolean): void {
  const before = holds.size > 0;
  if (on) holds.add(holder);
  else holds.delete(holder);
  const after = holds.size > 0;
  if (before === after) return;
  const g = ambientBus().gain;
  const t = getAudioContext().currentTime;
  g.cancelScheduledValues(t);
  g.setValueAtTime(g.value, t);
  g.linearRampToValueAtTime(after ? DUCK_GAIN : 1, t + (after ? DUCK_ATTACK_S : DUCK_RELEASE_S));
}
