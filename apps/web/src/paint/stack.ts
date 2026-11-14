export const PAINT_MS = 8000;

/** Canvas size for a video frame, scaled down so the long edge is at most `maxEdge`; never scaled up. */
export function stackSize(videoW: number, videoH: number, maxEdge = 1280): { w: number; h: number } {
  const k = Math.min(1, maxEdge / Math.max(videoW, videoH, 1));
  return { w: Math.max(1, Math.round(videoW * k)), h: Math.max(1, Math.round(videoH * k)) };
}

/** Share of the painting done, from 0 to 1. */
export function stackProgress(elapsedMs: number, durationMs: number): number {
  return durationMs > 0 ? Math.min(Math.max(elapsedMs / durationMs, 0), 1) : 1;
}

/**
 * Keeps the brightest value each pixel has seen ("lighten" works per colour channel).
 * `stop` ends early; `done` gives the painted image as a JPEG either way.
 */
export function startStack(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  durationMs: number,
  onProgress?: (progress: number) => void,
): { stop: () => void; done: Promise<Blob> } {
  const { w, h } = stackSize(video.videoWidth, video.videoHeight);
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { stop: () => {}, done: Promise.reject(new Error("no 2d context")) };
  ctx.globalCompositeOperation = "source-over";
  ctx.drawImage(video, 0, 0, w, h);
  ctx.globalCompositeOperation = "lighten";

  const byFrame = typeof video.requestVideoFrameCallback === "function";
  const start = performance.now();
  let handle = 0;
  let ended = false;
  let finish = () => {};
  const done = new Promise<Blob>((resolve, reject) => {
    finish = () => {
      if (ended) return;
      ended = true;
      if (byFrame) video.cancelVideoFrameCallback(handle);
      else cancelAnimationFrame(handle);
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/jpeg", 0.9);
    };
  });
  const frame = () => {
    if (ended) return;
    ctx.drawImage(video, 0, 0, w, h);
    const p = stackProgress(performance.now() - start, durationMs);
    onProgress?.(p);
    if (p >= 1) finish();
    else schedule();
  };
  const schedule = () => {
    handle = byFrame ? video.requestVideoFrameCallback(frame) : requestAnimationFrame(frame);
  };
  schedule();
  return { stop: () => finish(), done };
}
