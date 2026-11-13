import { Router } from "express";
import type { Db, LatestGlow } from "../seam.js";

// Stub: B1-4.a.1 replaces this file.
export function parseNear(_text: unknown): { lat: number; lng: number } | null {
  return null;
}

export function createSitesRouter(_deps: { db?: Db; latestGlow: LatestGlow }): Router {
  return Router();
}
