import { useEffect } from "react";
import { track } from "../events";
import { LAMP_EVENT_MS, lampEventDue } from "./lampMaths";

/** One `lamp` event on lighting, then one per `LAMP_EVENT_MS` held. `track` queues offline. */
export function useLampEvents(siteId: string, lit: boolean) {
  useEffect(() => {
    if (!lit) return;
    const litAt = Date.now();
    let sent = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const now = Date.now();
      if (lampEventDue(litAt, sent, now)) {
        track("lamp", siteId);
        // Minutes lost to a throttled background timer are skipped, not sent in a burst.
        sent = Math.floor((now - litAt) / LAMP_EVENT_MS) + 1;
      }
      timer = setTimeout(tick, litAt + sent * LAMP_EVENT_MS - Date.now());
    };
    tick();
    return () => clearTimeout(timer);
  }, [siteId, lit]);
}
