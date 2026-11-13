import { Router } from "express";
import type { OnPane, Tx } from "../seam.js";

export type PanesDeps = { tx?: Tx; onPane?: OnPane; now?: () => Date };

export function createPanesRouter(_deps: PanesDeps): Router {
  return Router();
}
