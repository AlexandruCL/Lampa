import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { TimeNow } from "@lampa/shared";

// shortcut: memory store, counts reset on restart and are per instance; move to a shared store if the API runs on more than one instance
const timeLimiter = rateLimit({ windowMs: 60_000, limit: 120 });

export function createTimeRouter(deps: { now?: () => number } = {}): Router {
  const router = Router();
  router.get("/time", timeLimiter, (_req, res) => {
    res.set("Cache-Control", "no-store").json(TimeNow.parse({ now: (deps.now ?? Date.now)() }));
  });
  return router;
}
