import { useEffect } from "react";
import { playBed, setBedGlow, stopBed } from "./engine";

/** Plays the site's bed while mounted and `on`; its gain follows glow. */
export function useBed(siteId: string, glow: number | null, on = true): void {
  // Keyed on siteId and on only: a new glow must ramp the bed, not restart it.
  useEffect(() => {
    if (!on) return;
    void playBed(siteId, glow);
    return stopBed;
  }, [siteId, on]);

  useEffect(() => {
    setBedGlow(glow);
  }, [glow]);
}
