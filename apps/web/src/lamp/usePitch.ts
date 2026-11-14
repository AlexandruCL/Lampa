import { useEffect, useState } from "react";
import { pitchFromBeta } from "./lampMaths";

export const PITCH_WAIT_MS = 1000;

/** `available` starts true so the Ring does not flash the tap fallback; it turns false if no beta arrives in 1 s. */
export function usePitch(): { pitch: number | null; available: boolean } {
  const [pitch, setPitch] = useState<number | null>(null);
  const [waited, setWaited] = useState(false);

  useEffect(() => {
    const onReading = (e: Event) => {
      const next = pitchFromBeta((e as DeviceOrientationEvent).beta);
      if (next !== null) setPitch(next);
    };
    window.addEventListener("deviceorientation", onReading);
    const timer = setTimeout(() => setWaited(true), PITCH_WAIT_MS);
    return () => {
      window.removeEventListener("deviceorientation", onReading);
      clearTimeout(timer);
    };
  }, []);

  return { pitch, available: pitch !== null || !waited };
}
