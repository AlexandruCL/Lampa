import { Router } from "express";
import type { Db, LatestGlow } from "../seam.js";

export function createPulseRouter(_deps: { db?: Db; latestGlow: LatestGlow; now?: () => Date }): Router {
  return Router();
}
