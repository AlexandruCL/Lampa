import type { BellIn } from "@lampa/shared";
import { authFetch } from "../session";

/** POST /bells/ring. A ring that fails to send is dropped: the bell already sounded on this phone. */
export function postRing(ring: BellIn): void {
  authFetch("/bells/ring", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(ring) }).catch(() => {});
}
