import { useEffect, useMemo, useState } from "react";
import type { Fix } from "../geo/geofence";
import type { Demo } from "./demo";

/** Browsers give null, or NaN while standing still, when they have no course or speed. */
const orNull = (v: number | null): number | null => (v === null || Number.isNaN(v) ? null : v);

export type GeoStatus = "idle" | "watching" | "denied" | "unavailable";

/** Mount after the primer tap, or the location prompt appears outside it. With `demo` it reads no sensor. */
export function useGeolocation(demo?: Demo | null): { position: Fix | null; status: GeoStatus } {
  const [position, setPosition] = useState<Fix | null>(null);
  const [status, setStatus] = useState<GeoStatus>("idle");
  const on = !!demo;
  // One object per demo spot, so useGeofence steps once per spot, not once per render.
  const demoFix = useMemo(
    () => (demo ? { lat: demo.lat, lng: demo.lng, accuracy: demo.accuracy } : null),
    [demo?.lat, demo?.lng, demo?.accuracy],
  );

  useEffect(() => {
    if (on) return;
    const geo = navigator.geolocation;
    if (!geo) {
      setStatus("unavailable");
      return;
    }
    setStatus("watching");
    const id = geo.watchPosition(
      (p) =>
        setPosition({
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          accuracy: p.coords.accuracy,
          course: orNull(p.coords.heading),
          speed: orNull(p.coords.speed),
        }),
      (e) => {
        if (e.code === 1 /* PERMISSION_DENIED */) setStatus("denied"); // other errors: the watch goes on
      },
      { enableHighAccuracy: true },
    );
    return () => geo.clearWatch(id);
  }, [on]);

  return demoFix ? { position: demoFix, status: "watching" } : { position, status };
}
