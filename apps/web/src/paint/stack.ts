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

// shortcut: one guessed lens (long-edge field of view) for every phone, so the trail slips where the real one differs; measure per device if the feature stays
export const FOV_LONG_DEG = 65;
const RAD = Math.PI / 180;
/** With no rotation reading this long after the start, the phone has no gyroscope or motion access was refused. */
const NO_GYRO_MS = 500;
const FINGER_EVENTS = ["pointerdown", "pointermove", "pointerup", "pointercancel"] as const;

/** How far from the centre, in canvas pixels, a point sits once the camera has turned `deltaDeg` away from it. */
export function trailOffset(deltaDeg: number, longEdgePx: number): number {
  const focal = longEdgePx / 2 / Math.tan((FOV_LONG_DEG / 2) * RAD);
  return focal * Math.tan(Math.max(-80, Math.min(80, deltaDeg)) * RAD); // clamped: tan flips past 90
}

/**
 * Draws the live video with a dot of light fixed in the centre. The gyroscope tells how far the phone
 * has turned, so the dots already painted shift the other way and stay on the scene as a trail.
 * A finger on the canvas takes the light to where it touches; with no gyroscope that is the only light,
 * and `onNoGyro` says so after NO_GYRO_MS.
 * `stop` ends early; `done` gives the last frame with its trail as a JPEG either way.
 */
export function startTrail(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  durationMs: number,
  onProgress?: (progress: number) => void,
  onNoGyro?: () => void,
): { stop: () => void; done: Promise<Blob> } {
  const { w, h } = stackSize(video.videoWidth, video.videoHeight);
  const long = Math.max(w, h);
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { stop: () => {}, done: Promise.reject(new Error("no 2d context")) };

  let yaw = 0;
  let pitch = 0;
  let last: number | null = null;
  let gyro = false;
  const onMotion = (e: DeviceMotionEvent) => {
    if (typeof e.rotationRate?.alpha === "number") gyro = true; // some browsers send the event with empty rates
    const dt = last === null ? 0 : (e.timeStamp - last) / 1000;
    last = e.timeStamp;
    // shortcut: portrait only and roll ignored, so a rolled or landscape phone bends the trail; use the full rotation if the feature stays
    yaw += (e.rotationRate?.beta ?? 0) * dt; // about the screen's up axis: positive turns the camera left
    pitch += (e.rotationRate?.alpha ?? 0) * dt; // about the screen's right axis: positive tilts the camera up
  };
  window.addEventListener("devicemotion", onMotion);
  const noGyro = setTimeout(() => {
    if (!gyro) onNoGyro?.();
  }, NO_GYRO_MS);

  // where the finger is, in canvas pixels from the centre; null while it is up
  let finger: { x: number; y: number } | null = null;
  const onFinger = (e: PointerEvent) => {
    if (e.type === "pointerup" || e.type === "pointercancel") {
      finger = null;
      return;
    }
    if (e.type === "pointerdown") canvas.setPointerCapture(e.pointerId); // the lift still arrives when it ends off the canvas
    else if (!finger) return; // a mouse moving with no button down
    const r = canvas.getBoundingClientRect();
    const k = Math.max(r.width / w, r.height / h); // the canvas is shown with object-fit: cover
    finger = { x: (e.clientX - r.left - r.width / 2) / k, y: (e.clientY - r.top - r.height / 2) / k };
  };
  for (const type of FINGER_EVENTS) canvas.addEventListener(type, onFinger);

  // null lifts the pen, so the trail does not jump between the centre and a finger
  const trail: ({ yaw: number; pitch: number; x: number; y: number } | null)[] = [];
  let wasFinger = false;
  const draw = () => {
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(video, 0, 0, w, h);
    const at = finger ?? (gyro ? { x: 0, y: 0 } : null);
    if ((!at || (finger !== null) !== wasFinger) && trail[trail.length - 1]) trail.push(null);
    wasFinger = finger !== null;
    if (at) trail.push({ yaw, pitch, ...at });
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = ctx.lineJoin = "round";
    ctx.beginPath();
    let down = false;
    for (const p of trail) {
      down = down && p !== null;
      if (!p) continue;
      const x = w / 2 + p.x + trailOffset(yaw - p.yaw, long);
      const y = h / 2 + p.y + trailOffset(pitch - p.pitch, long);
      if (!down) ctx.moveTo(x, y);
      ctx.lineTo(x, y); // right after moveTo this is a zero-length line, which round caps draw as a dot
      down = true;
    }
    // wide and faint first, narrow and bright last: a glow around a core
    for (const [width, alpha] of [[0.03, 0.25], [0.015, 0.5], [0.006, 1]] as const) {
      ctx.lineWidth = width * long;
      ctx.strokeStyle = `rgba(255, 214, 140, ${alpha})`;
      ctx.stroke();
    }
  };
  draw();

  const byFrame = typeof video.requestVideoFrameCallback === "function";
  const start = performance.now();
  let handle = 0;
  let ended = false;
  let finish = () => {};
  const done = new Promise<Blob>((resolve, reject) => {
    finish = () => {
      if (ended) return;
      ended = true;
      window.removeEventListener("devicemotion", onMotion);
      clearTimeout(noGyro);
      for (const type of FINGER_EVENTS) canvas.removeEventListener(type, onFinger);
      if (byFrame) video.cancelVideoFrameCallback(handle);
      else cancelAnimationFrame(handle);
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/jpeg", 0.9);
    };
  });
  const frame = () => {
    if (ended) return;
    draw();
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
