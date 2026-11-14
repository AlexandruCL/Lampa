import { useEffect } from "react";
import type { LatLng } from "../geo/geo";
import { SITES } from "../sites/sites";
import { setNav, stopNav } from "./nav";

/** The beacon and compass voices while mounted (Between sites). */
export function useNavAudio({ position, heading, targetId, demo }: {
  position: LatLng | null;
  heading: number | null;
  targetId: string | null;
  demo: boolean;
}): void {
  useEffect(() => {
    setNav({ position, heading, targetId, sites: SITES, demo });
  }, [position, heading, targetId, demo]);

  useEffect(() => stopNav, []);
}
