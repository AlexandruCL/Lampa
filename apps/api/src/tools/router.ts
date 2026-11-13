import { Router } from "express";
import type { SiteStats } from "../agent/session.js";
import type { Db } from "../seam.js";

export function createToolsRouter(_deps: { db?: Db; getSiteStats?: (siteId: string) => Promise<SiteStats> }): Router {
  return Router();
}
