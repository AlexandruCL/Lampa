import { Router } from "express";
import type { Db } from "../seam.js";

export function createScreenStateRouter(_deps: { db?: Db }): Router {
  return Router();
}
