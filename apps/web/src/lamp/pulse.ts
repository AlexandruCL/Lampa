import { useEffect, useState } from "react";
import { getClockOffset } from "../time/clockOffset";

/** One breath of the lamp pulse; brightest at every whole multiple of server time (DESIGN 6.14). */
export const PULSE_MS = 4000;

/** `animation-delay` in ms that puts the pulse in phase with server time; 0 at every whole multiple. */
export function pulseDelayMs(deviceNow: number, offset: number): number {
  return 0 - ((((deviceNow + offset) % PULSE_MS) + PULSE_MS) % PULSE_MS); // 0 - x, not -x: no -0
}

// One measurement per page load, kept for the page.
let offset: number | null = null;
let started: Promise<number | null> | null = null;

/** Starts the clock offset measurement once; later calls get the same promise. */
export function startClockOffset(): Promise<number | null> {
  return (started ??= getClockOffset().then((o) => (offset = o)));
}

/** The page's clock offset: null until it arrives, and for the page if every ping failed. */
export function useClockOffset(): number | null {
  const [value, setValue] = useState(offset);
  useEffect(() => {
    let live = true;
    void startClockOffset().then((o) => {
      if (live) setValue(o);
    });
    return () => {
      live = false;
    };
  }, []);
  return value;
}
