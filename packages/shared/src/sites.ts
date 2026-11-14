import sitesJson from "../sites.json" with { type: "json" };
import type { Site } from "./contract.js";
const all: Site[] = sitesJson;
/** The five sites. Bridges are kept apart so that nothing built for the sites picks them up by accident. */
export const sites: Site[] = all.filter((s) => !s.is_bridge);
/** The bridges on the Bega (Message in a Bottle), from upstream to downstream. */
export const bridges: Site[] = all.filter((s) => s.is_bridge);
