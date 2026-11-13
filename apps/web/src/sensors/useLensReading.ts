import { useEffect, useRef, useState } from "react";
import { pickColour, SAMPLE_SIZE } from "../colour/picker";
import type { Reading } from "../colour/reading";
import { lensSquare } from "./camera";

export const SAMPLE_INTERVAL_MS = 100;

/** The colour under the lens, sampled every SAMPLE_INTERVAL_MS while `active` and the page is visible. No frame is kept or sent. */
export function useLensReading(video: HTMLVideoElement | null, active: boolean): Reading | null {
  const [reading, setReading] = useState<Reading | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!video || !active) return;
    if (!canvasRef.current) {
      // never attached to the page
      canvasRef.current = document.createElement("canvas");
      canvasRef.current.width = canvasRef.current.height = SAMPLE_SIZE;
    }
    const ctx = canvasRef.current.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const sample = () => {
      // a zero-size view would give an infinite cover scale
      if (video.readyState < 2 || !video.clientWidth || !video.clientHeight) return;
      const { sx, sy, side } = lensSquare(video.videoWidth, video.videoHeight, video.clientWidth, video.clientHeight, SAMPLE_SIZE);
      ctx.drawImage(video, sx, sy, side, side, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
      setReading(pickColour(ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data));
    };

    let timer: ReturnType<typeof setInterval> | undefined;
    const sync = () => {
      clearInterval(timer);
      timer = document.hidden ? undefined : setInterval(sample, SAMPLE_INTERVAL_MS);
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [video, active]);

  return reading;
}
