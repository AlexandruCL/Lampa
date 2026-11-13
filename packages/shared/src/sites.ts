import sitesJson from "../sites.json" with { type: "json" };
import type { Site } from "./contract.js";
export const sites: Site[] = sitesJson;
