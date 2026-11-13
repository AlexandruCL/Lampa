import { Router } from "express";
import type { Db } from "../seam.js";

export function createElevenLabsWebhookRouter(_deps: { db?: Db; now?: () => Date }): Router {
  return Router();
}
