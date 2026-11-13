import { useEffect } from "react";
import { playBed, setBedGlow, stopBed } from "./engine";

/** Plays the site's bed while mounted; its gain follows glow. */
export function useBed(siteId: string, glow: number | null): void {
  // Keyed on siteId only: a new glow must ramp the bed, not restart it.
  useEffect(() => {
    void playBed(siteId, glow);
    return stopBed;
  }, [siteId]);

  useEffect(() => {
    setBedGlow(glow);
  }, [glow]);
}
