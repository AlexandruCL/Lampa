import { useEffect } from "react";

/** Keeps the screen on while `on`. A refusal or a missing API is ignored: the lamp works anyway (DESIGN 6.14). */
export function useWakeLock(on: boolean) {
  useEffect(() => {
    if (!on || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let ended = false;

    const request = () => {
      navigator.wakeLock.request("screen").then(
        (sentinel) => {
          if (ended) sentinel.release().catch(() => {});
          else lock = sentinel;
        },
        () => {},
      );
    };
    // The browser releases the lock when the page is hidden, so take it again on return.
    const onVisible = () => {
      if (document.visibilityState === "visible" && (lock === null || lock.released)) request();
    };

    request();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      ended = true;
      document.removeEventListener("visibilitychange", onVisible);
      lock?.release().catch(() => {});
    };
  }, [on]);
}
