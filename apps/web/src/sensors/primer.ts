import { unlockAudio } from "../audio/context";

export type LocationStatus = "granted" | "denied" | "unavailable";
export type CompassStatus = "granted" | "denied" | "unavailable";
export type PrimerResult = { location: LocationStatus; compass: CompassStatus; audio: "running" | "blocked" };

export const FIRST_FIX_WAIT_MS = 8000;

type CompassEnv = { DeviceOrientationEvent?: { requestPermission?: () => Promise<string> } };

/** iOS asks through `requestPermission`; elsewhere the compass is there when an orientation event exists. */
export async function requestCompass(w: object = window): Promise<CompassStatus> {
  const DOE = (w as CompassEnv).DeviceOrientationEvent;
  if (typeof DOE?.requestPermission === "function") {
    try {
      return (await DOE.requestPermission()) === "granted" ? "granted" : "denied";
    } catch {
      return "denied"; // iOS rejects when the call is not inside a tap
    }
  }
  return "ondeviceorientationabsolute" in w || "ondeviceorientation" in w ? "granted" : "unavailable";
}

/** Only a permission denial is "denied"; a timeout or a failed fix is "granted", since useGeolocation keeps watching. */
export function requestLocation(
  geo: Geolocation | undefined = navigator.geolocation,
  waitMs = FIRST_FIX_WAIT_MS,
): Promise<LocationStatus> {
  if (!geo) return Promise.resolve("unavailable");
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve("granted"), waitMs);
    const done = (status: LocationStatus) => {
      clearTimeout(timer);
      resolve(status);
    };
    geo.getCurrentPosition(
      () => done("granted"),
      (e) => done(e.code === 1 /* PERMISSION_DENIED */ ? "denied" : "granted"),
      { enableHighAccuracy: true },
    );
  });
}

/** Call inside the tap handler. Never asks for camera or microphone; in demo it asks for nothing (DESIGN.md 7.16). */
export async function primeDevice({ demo = false }: { demo?: boolean } = {}): Promise<PrimerResult> {
  if (demo) return { location: "granted", compass: "granted", audio: await unlockAudio() };
  // iOS honours these only inside the tap, so all three start before the first await.
  const location = requestLocation();
  const compass = requestCompass();
  const audio = unlockAudio();
  return { location: await location, compass: await compass, audio: await audio };
}
