import { useEffect, useState } from "react";
import type { Fix } from "../geo/geofence";

export type GeoStatus = "idle" | "watching" | "denied" | "unavailable";

/** Mount after the primer tap, or the location prompt appears outside it. */
export function useGeolocation(): { position: Fix | null; status: GeoStatus } {
  const [position, setPosition] = useState<Fix | null>(null);
  const [status, setStatus] = useState<GeoStatus>("idle");

  useEffect(() => {
    const geo = navigator.geolocation;
    if (!geo) {
      setStatus("unavailable");
      return;
    }
    setStatus("watching");
    const id = geo.watchPosition(
      (p) => setPosition({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
      (e) => {
        if (e.code === 1 /* PERMISSION_DENIED */) setStatus("denied"); // other errors: the watch goes on
      },
      { enableHighAccuracy: true },
    );
    return () => geo.clearWatch(id);
  }, []);

  return { position, status };
}
