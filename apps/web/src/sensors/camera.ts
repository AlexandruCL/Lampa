export type CameraResult = { status: "ready"; stream: MediaStream } | { status: "denied" } | { status: "unavailable" };

/** The lens centre sits at this share of the view height. */
export const LENS_CENTRE_Y = 0.42;

/** Only a refusal is "denied"; a missing, busy or unfit camera is "unavailable". */
export function cameraStatus(error: unknown): "denied" | "unavailable" {
  const name = (error as { name?: unknown } | null)?.name;
  return name === "NotAllowedError" || name === "SecurityError" ? "denied" : "unavailable";
}

/** Call inside the tap that opens the lens: iOS honours getUserMedia only before the first await. */
export async function openRearCamera(): Promise<CameraResult> {
  const media = navigator.mediaDevices;
  if (!media?.getUserMedia) return { status: "unavailable" };
  try {
    const stream = await media.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
    return { status: "ready", stream };
  } catch (e) {
    return { status: cameraStatus(e) };
  }
}

export function stopCamera(stream: MediaStream): void {
  stream.getTracks().forEach((t) => t.stop());
}

/** The source square of `size` video pixels under the lens centre, for a video shown with `object-fit: cover`. */
export function lensSquare(
  videoW: number,
  videoH: number,
  viewW: number,
  viewH: number,
  size: number,
): { sx: number; sy: number; side: number } {
  const scale = Math.max(viewW / videoW, viewH / videoH);
  const side = Math.min(size, videoW, videoH);
  const x = videoW / 2;
  const y = videoH / 2 + ((LENS_CENTRE_Y - 0.5) * viewH) / scale;
  const clamp = (v: number, max: number) => Math.min(Math.max(Math.floor(v - side / 2), 0), max - side);
  return { sx: clamp(x, videoW), sy: clamp(y, videoH), side };
}

/** Largest absolute rotation rate in degrees per second; null when no axis has a value. */
export function maxRotation(rate: { alpha: number | null; beta: number | null; gamma: number | null } | null): number | null {
  if (!rate) return null;
  const axes = [rate.alpha, rate.beta, rate.gamma].filter((v): v is number => v !== null);
  return axes.length ? Math.max(...axes.map(Math.abs)) : null;
}
