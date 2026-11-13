import { cameraStatus } from "../sensors/camera";
import type { Recording } from "./recording";

export const ECHO_MAX_MS = 20000;
export const ECHO_MIN_MS = 1000;
export const ECHO_BITS_PER_SECOND = 64000;
/** Chrome records webm with opus, Safari records mp4 (Ionut's decision, hour 7). */
export const ECHO_MIME_TYPES = ["audio/webm;codecs=opus", "audio/mp4"] as const;

export type MicResult = { status: "ready"; stream: MediaStream } | { status: "denied" } | { status: "unavailable" };

export function pickMimeType(isSupported: (type: string) => boolean): string | null {
  return ECHO_MIME_TYPES.find((t) => isSupported(t)) ?? null;
}

export function baseMimeType(type: string): "audio/webm" | "audio/mp4" {
  return type.startsWith("audio/webm") ? "audio/webm" : "audio/mp4";
}

/** Same rule as the camera: only a refusal is "denied". */
export const micStatus: (error: unknown) => "denied" | "unavailable" = cameraStatus;

export function secondsLeft(elapsedMs: number): number {
  return Math.min(ECHO_MAX_MS / 1000, Math.max(0, Math.ceil((ECHO_MAX_MS - elapsedMs) / 1000)));
}

export function tooShort(durationMs: number): boolean {
  return durationMs < ECHO_MIN_MS;
}

export function clampDuration(ms: number): number {
  return Math.min(Math.round(ms), ECHO_MAX_MS);
}

export function canRecord(): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== "undefined" &&
    pickMimeType((t) => MediaRecorder.isTypeSupported(t)) !== null
  );
}

/** Call inside the tap on the record control: iOS honours getUserMedia only before the first await. */
export async function openMicrophone(): Promise<MicResult> {
  if (!canRecord()) return { status: "unavailable" };
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    return { status: "ready", stream };
  } catch (e) {
    return { status: micStatus(e) };
  }
}

/** Chunks stay in memory; the stream's tracks are stopped when the recorder stops. */
export function startRecording(
  stream: MediaStream,
  onDone: (recording: Recording | null) => void,
): { stop(): void; startedAt: number } {
  const recorder = new MediaRecorder(stream, {
    mimeType: pickMimeType((t) => MediaRecorder.isTypeSupported(t)) ?? undefined,
    audioBitsPerSecond: ECHO_BITS_PER_SECOND,
  });
  const chunks: Blob[] = [];
  const startedAt = performance.now();
  const stop = () => {
    if (recorder.state !== "inactive") recorder.stop();
  };
  const timer = setTimeout(stop, ECHO_MAX_MS);
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };
  recorder.onstop = () => {
    clearTimeout(timer);
    stream.getTracks().forEach((t) => t.stop());
    const durationMs = clampDuration(performance.now() - startedAt);
    const mimeType = baseMimeType(recorder.mimeType);
    onDone(tooShort(durationMs) ? null : { blob: new Blob(chunks, { type: mimeType }), mimeType, durationMs });
  };
  recorder.start();
  return { stop, startedAt };
}
