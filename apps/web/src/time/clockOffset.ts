import { TimeNow } from "@lampa/shared";
import { API_URL } from "../api/client";

export const CLOCK_PINGS = 5;

/** Server clock minus this device's clock, in ms, from 5 pings to GET /time; null when every ping failed. */
export async function getClockOffset({
  fetch: fetchFn = fetch,
  now = Date.now,
}: { fetch?: typeof fetch; now?: () => number } = {}): Promise<number | null> {
  let best: { rtt: number; offset: number } | null = null;
  for (let i = 0; i < CLOCK_PINGS; i++) {
    try {
      const t0 = now();
      const res = await fetchFn(`${API_URL}/time`, { cache: "no-store" });
      const t1 = now();
      if (!res.ok) continue;
      const server = TimeNow.parse(await res.json());
      const rtt = t1 - t0;
      // Strict < keeps the first ping on a tie.
      if (!best || rtt < best.rtt) best = { rtt, offset: server.now + rtt / 2 - t1 };
    } catch {
      // A ping that throws or fails the schema is skipped.
    }
  }
  return best && Math.round(best.offset);
}
