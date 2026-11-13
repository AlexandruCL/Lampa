import { useEffect, useState } from "react";
import type { Demo } from "./demo";

export type CompassSource = "ios" | "absolute" | "none";
export type OrientationReading = { alpha: number | null; webkitCompassHeading?: number };

export const HEADING_SMOOTHING = 0.2;

/** Degrees clockwise from north. On iOS plain `deviceorientation` alpha is relative, so only webkitCompassHeading counts. */
export function headingFromEvent(e: OrientationReading, source: "ios" | "absolute"): number | null {
  if (source === "ios") return typeof e.webkitCompassHeading === "number" ? e.webkitCompassHeading : null;
  return e.alpha === null ? null : (360 - e.alpha) % 360;
}

/** Angular low-pass that takes the short way round, so 350 toward 10 passes through 0. */
export function smoothHeading(prev: number | null, next: number, k: number): number {
  if (prev === null) return next;
  const diff = ((next - prev + 540) % 360) - 180;
  return (prev + k * diff + 360) % 360;
}

/** With `demo` it reads no sensor and returns the injected heading. */
export function useCompass(demo?: Demo | null): { heading: number | null; source: CompassSource } {
  const [compass, setCompass] = useState<{ heading: number | null; source: CompassSource }>({
    heading: null,
    source: "none",
  });

  const on = !!demo;

  useEffect(() => {
    if (on) return;
    const source = "ondeviceorientationabsolute" in window ? "absolute" : "ios";
    const type = source === "absolute" ? "deviceorientationabsolute" : "deviceorientation";
    const onReading = (e: Event) => {
      const next = headingFromEvent(e as DeviceOrientationEvent & OrientationReading, source);
      if (next !== null) setCompass((prev) => ({ heading: smoothHeading(prev.heading, next, HEADING_SMOOTHING), source }));
    };
    window.addEventListener(type, onReading);
    return () => window.removeEventListener(type, onReading);
  }, [on]);

  return demo ? { heading: demo.heading, source: "none" } : compass;
}
