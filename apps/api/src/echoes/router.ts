import { randomUUID } from "node:crypto";
import express, { Router, type RequestHandler } from "express";
import { rateLimit } from "express-rate-limit";
import { EchoAccepted, sites } from "@lampa/shared";
import type { Db, Emit, Tx } from "../seam.js";
import { requireVisitor } from "../auth/session.js";
import { userSub } from "../events/router.js";
import { transcribe } from "./scribe.js";

export const ECHO_MAX_BYTES = 2 * 1024 * 1024;
export const ECHO_LIMIT = 5;
export const ECHO_WINDOW_MS = 600_000;

export const INSERT_BLOB = "INSERT INTO blobs (key, content_type, data) VALUES ($1, $2, $3)";
export const INSERT_ECHO = `INSERT INTO echoes (site_id, author_sub, anon_id, audio_url)
VALUES ($1, $2, $3, $4) RETURNING id`;

export type EchoesDeps = { db?: Db; tx?: Tx; onStored?: () => void; emit?: Emit; fetch?: typeof fetch };

const AUDIO_TYPES = ["audio/webm", "audio/mp4"];

const rawBody = express.raw({ type: "multipart/form-data", limit: ECHO_MAX_BYTES });
const readBody: RequestHandler = (req, res, next) =>
  rawBody(req, res, (err?: unknown) => {
    if (!err) return next();
    const tooLarge = (err as { type?: string }).type === "entity.too.large";
    res.status(tooLarge ? 413 : 400).json({ error: tooLarge ? "too_large" : "invalid_echo" });
  });

export function createEchoesRouter(deps: EchoesDeps): Router {
  const router = Router();
  // shortcut: memory store, counts reset on restart and are per instance; move to a shared store if the API runs on more than one instance
  const echoLimiter = rateLimit({
    windowMs: ECHO_WINDOW_MS,
    limit: ECHO_LIMIT,
    keyGenerator: (req) => req.visitor!.sub,
    message: { error: "rate_limited" },
  });

  router.post("/echoes", requireVisitor, echoLimiter, readBody, async (req, res) => {
    const invalid = () => void res.status(400).json({ error: "invalid_echo" });
    if (!Buffer.isBuffer(req.body)) return invalid();
    let form: FormData;
    try {
      // express.raw never hands back a SharedArrayBuffer, so the narrower type is safe.
      form = await new Response(req.body as Buffer<ArrayBuffer>, { headers: { "content-type": req.get("content-type")! } }).formData();
    } catch {
      return invalid();
    }

    const site = sites.find((s) => s.id === form.get("siteId"));
    if (!site) return void res.status(404).json({ error: "unknown_site" });
    if (site.is_memorial) return void res.status(404).json({ error: "no_echo" });
    if (form.get("consent") !== "true") return invalid();
    const audio = form.get("audio");
    if (!(audio instanceof File) || audio.size === 0 || !AUDIO_TYPES.some((t) => audio.type.startsWith(t))) return invalid();
    if (!deps.tx) return void res.status(503).json({ error: "unavailable" });

    const visitor = req.visitor!;
    const key = `echo-${randomUUID()}`;
    try {
      const data = Buffer.from(await audio.arrayBuffer());
      const id = await deps.tx(async (db) => {
        await db.query(INSERT_BLOB, [key, audio.type, data]);
        const result = await db.query(INSERT_ECHO, [
          site.id,
          userSub(visitor),
          visitor.kind === "anon" ? visitor.sub : null,
          `/blob/${key}`,
        ]);
        return result.rows[0].id as string;
      });
      res.status(201).json(EchoAccepted.parse({ id, status: "pending" }));
      if (deps.db) void transcribe({ db: deps.db, fetch: deps.fetch ?? fetch }, id, audio);
    } catch (err) {
      console.error("echo insert failed: " + (err instanceof Error ? err.message : "unknown"));
      res.status(503).json({ error: "unavailable" });
    }
  });
  return router;
}
