import type { Site } from "@lampa/shared";
import { bearingDeg, haversineM, type LatLng } from "../geo/geo";
import { ambientBus } from "./bus";
import { playClip } from "./clip";
import { clips } from "./clips";
import { getAudioContext } from "./context";
import { bedUrl, FADE_IN_S, healStep, loadBuffer, RAMP_S } from "./engine";
import {
  BEACON_GAIN,
  COMPASS_GAIN,
  compassSites,
  cutoffFor,
  distanceFactor,
  MEMORIAL_FADE_S,
  NEAR_M,
  pannerPosition,
  SMOOTH_S,
} from "./navMaths";

export type NavInput = {
  position: LatLng | null;
  heading: number | null;
  targetId: string | null;
  sites: readonly Site[];
  demo?: boolean;
};
export type Mix = { level: number; cutoff: number; x: number; z: number };

type Nodes = { source: AudioBufferSourceNode; filter: BiquadFilterNode; panner: PannerNode; gain: GainNode };
type Voice = { siteId: string; mix: Mix; fadeEnd: number; nodes?: Nodes };

const voices = new Map<string, Voice>(); // active voices only; a leaving voice fades out on its own
let arrived = false;

function mixFor(gain: number, m: number | null, bearing: number | null, heading: number | null): Mix {
  return { level: gain * distanceFactor(m), cutoff: cutoffFor(m), ...pannerPosition(bearing, heading) };
}

/** Site id → mix: the target as the beacon plus the compass sites. No position: the target only, centred, at 400 Hz. */
export function navMix({ position, heading, targetId, sites, demo = false }: NavInput): Map<string, Mix> {
  const out = new Map<string, Mix>();
  const target = targetId ? sites.find((s) => s.id === targetId) : undefined;
  if (target) {
    // Demo step 1:40 (Patrick, hour 24): the beacon counts as near so only its pan moves.
    const m = demo ? NEAR_M : position ? haversineM(position, target) : null;
    out.set(target.id, mixFor(BEACON_GAIN, m, position ? bearingDeg(position, target) : null, heading));
  }
  if (position) {
    for (const s of compassSites(sites, position, targetId)) {
      out.set(s.id, mixFor(COMPASS_GAIN, haversineM(position, s), bearingDeg(position, s), heading));
    }
  }
  return out;
}

/** Ramps from the current level, so a change during a fade does not jump. */
function rampGain(gain: GainNode, value: number, endTime: number): void {
  const t = getAudioContext().currentTime;
  gain.gain.cancelScheduledValues(t);
  gain.gain.setValueAtTime(gain.gain.value, t);
  gain.gain.linearRampToValueAtTime(value, endTime);
}

/** source (looping bed) → lowpass → HRTF panner → gain → ambient bus, fading in to the voice's mix. */
function build(voice: Voice, buffer: AudioBuffer): void {
  const ctx = getAudioContext();
  const t = ctx.currentTime;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(voice.mix.cutoff, t);
  const panner = ctx.createPanner();
  panner.panningModel = "HRTF";
  panner.positionX.setValueAtTime(voice.mix.x, t);
  panner.positionY.setValueAtTime(0, t);
  panner.positionZ.setValueAtTime(voice.mix.z, t);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, t);
  voice.fadeEnd = t + FADE_IN_S;
  gain.gain.linearRampToValueAtTime(voice.mix.level, voice.fadeEnd);
  source.connect(filter).connect(panner).connect(gain).connect(ambientBus());
  source.start();
  voice.nodes = { source, filter, panner, gain };
}

function teardown({ source, filter, panner, gain }: Nodes): void {
  source.disconnect();
  filter.disconnect();
  panner.disconnect();
  gain.disconnect();
}

function fadeOut(voice: Voice, seconds: number): void {
  const nodes = voice.nodes;
  if (!nodes) return;
  const end = getAudioContext().currentTime + seconds;
  rampGain(nodes.gain, 0, end);
  nodes.source.onended = () => teardown(nodes);
  nodes.source.stop(end);
}

function apply(voice: Voice, mix: Mix): void {
  const before = voice.mix;
  voice.mix = mix;
  const n = voice.nodes;
  if (!n) return; // still loading: build() picks up the latest mix
  const t = getAudioContext().currentTime;
  // Heading moves every frame: write a param only when its value changed.
  if (mix.level !== before.level) {
    if (t < voice.fadeEnd) rampGain(n.gain, mix.level, voice.fadeEnd);
    else n.gain.gain.setTargetAtTime(mix.level, t, SMOOTH_S);
  }
  if (mix.cutoff !== before.cutoff) n.filter.frequency.setTargetAtTime(mix.cutoff, t, SMOOTH_S);
  if (mix.x !== before.x) n.panner.positionX.setTargetAtTime(mix.x, t, SMOOTH_S);
  if (mix.z !== before.z) n.panner.positionZ.setTargetAtTime(mix.z, t, SMOOTH_S);
}

function add(siteId: string, mix: Mix): void {
  const voice: Voice = { siteId, mix, fadeEnd: 0 };
  voices.set(siteId, voice);
  const url = bedUrl(siteId);
  if (!url) return; // no bed: a silent placeholder, so it is not fetched again each frame
  loadBuffer(url).then(
    (buffer) => {
      if (voices.get(siteId) !== voice) return; // removed while loading
      build(voice, buffer);
      listenForHeal();
    },
    // shortcut: a failed load stays silent until the voice leaves the set; add the bed's one retry if the beacon drops out on the street.
    () => console.info(`LAMPA: the nav voice of ${siteId} did not load`),
  );
}

/** Adds and removes voices to match the compass sites plus the target, and moves each one. */
export function setNav(input: NavInput): void {
  if (arrived) return; // Between can render again between arrive() and its unmount
  const wanted = navMix(input);
  for (const [id, voice] of voices) {
    if (wanted.has(id)) continue;
    voices.delete(id);
    fadeOut(voice, RAMP_S);
  }
  for (const [id, mix] of wanted) {
    const voice = voices.get(id);
    if (voice) apply(voice, mix);
    else add(id, mix);
  }
}

/** Fades out every active voice. Voices already left by arrive() keep their chime and fade. */
export function stopNav(): void {
  arrived = false;
  for (const voice of voices.values()) fadeOut(voice, RAMP_S);
  voices.clear();
}

/** Arrival: the chime, or at the memorial no chime and the beacon fades over 3 s; every nav voice then leaves. */
export function arrive(siteId: string, memorial: boolean): void {
  arrived = true;
  if (!memorial && clips.project.chime) void playClip(clips.project.chime);
  for (const voice of voices.values()) fadeOut(voice, memorial && voice.siteId === siteId ? MEMORIAL_FADE_S : RAMP_S);
  voices.clear();
}

let lapsed = false;
let listening = false;

// Same rule as the bed (engine.ts): after a lapse, the first visible "running" rebuilds every active voice once.
function onAudioState(): void {
  const step = healStep(lapsed, getAudioContext().state, document.visibilityState === "hidden");
  lapsed = step.lapsed;
  if (!step.rebuild) return;
  for (const voice of voices.values()) {
    const nodes = voice.nodes;
    if (!nodes?.source.buffer) continue;
    nodes.source.stop();
    teardown(nodes);
    build(voice, nodes.source.buffer);
  }
}

function listenForHeal(): void {
  if (listening) return;
  listening = true;
  getAudioContext().addEventListener("statechange", onAudioState);
  document.addEventListener("visibilitychange", onAudioState);
}
