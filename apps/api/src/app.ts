import cors from "cors";
import express, { type Express } from "express";
import { createAgentRouter } from "./agent/session.js";
import { sessionRouter } from "./auth/session.js";
import { createEventsRouter } from "./events/router.js";
import { createPanesRouter } from "./panes/router.js";
import { createScreenStateRouter } from "./panes/state.js";
import { createSitesRouter } from "./sites/router.js";
import { createGetSiteStats } from "./stats/stats.js";
import { createToolsRouter } from "./tools/router.js";
import type { AppDeps } from "./seam.js";

export function createApp(deps: AppDeps = {}): Express {
  if (!process.env.SESSION_SECRET) throw new Error("SESSION_SECRET is not set");

  const app = express();
  app.set("trust proxy", 1);
  app.use(cors({ origin: process.env.WEB_ORIGIN }));
  // Before express.json(): POST /session/anon reads no body, so a malformed one must not 400 it.
  app.use(sessionRouter);
  app.use(express.json());
  const getSiteStats = deps.db ? createGetSiteStats({ db: deps.db, latestGlow: deps.latestGlow ?? (() => null) }) : undefined;
  app.use(createAgentRouter({ getSiteStats }));
  app.use(createEventsRouter({ db: deps.db, onStored: deps.onEventsStored }));
  app.use(createSitesRouter({ db: deps.db, latestGlow: deps.latestGlow ?? (() => null) }));
  app.use(createPanesRouter({ tx: deps.tx, onPane: deps.onPane }));
  app.use(createScreenStateRouter({ db: deps.db }));
  app.use(createToolsRouter({ db: deps.db, getSiteStats }));
  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });
  return app;
}
