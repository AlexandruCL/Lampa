import { useEffect, useRef } from "react";
import { maxRotation } from "./camera";

/** Largest absolute rotation rate in degrees per second, as a ref so a motion event causes no render. Requests no permission. */
export function useRotationRate(): { current: number | null } {
  const rate = useRef<number | null>(null);

  useEffect(() => {
    const onMotion = (e: DeviceMotionEvent) => {
      rate.current = maxRotation(e.rotationRate);
    };
    window.addEventListener("devicemotion", onMotion);
    return () => window.removeEventListener("devicemotion", onMotion);
  }, []);

  return rate;
}
