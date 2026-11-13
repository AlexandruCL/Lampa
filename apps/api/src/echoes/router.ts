import { randomUUID } from "node:crypto";
import express, { Router, type RequestHandler } from "express";
import { rateLimit } from "express-rate-limit";
import { EchoAccepted, PendingEchoes, sites } from "@lampa/shared";
import type { Db, Emit, Tx } from "../seam.js";
import { requireVisitor, visitorLimiter, type Visitor } from "../auth/session.js";
import { userSub } from "../events/router.js";
import { transcribe } from "./scribe.js";

export const ECHO_MAX_BYTES = 2 * 1024 * 1024;
export const ECHO_LIMIT = 5;
export const ECHO_WINDOW_MS = 600_000;

export const INSERT_BLOB = "INSERT INTO blobs (key, content_type, data) VALUES ($1, $2, $3)";
export const INSERT_ECHO = `INSERT INTO echoes (site_id, author_sub, anon_id, audio_url)
VALUES ($1, $2, $3, $4) RETURNING id`;
export const SELECT_BLOB = `SELECT b.content_type, b.data, e.status FROM blobs b
LEFT JOIN echoes e ON e.audio_url = '/blob/' || b.key
WHERE b.key = $1`;
export const SELECT_PENDING = `SELECT id, site_id, created_at, lang, transcript, audio_url FROM echoes
WHERE status = 'pending' ORDER BY created_at ASC, id ASC`;

export const canModerate = (visitor: Visitor): boolean =>
  visitor.kind === "auth0" && visitor.permissions.includes("moderate:echo");

const curatorOnly: RequestHandler = (req, res, next) =>
  canModerate(req.visitor!) ? next() : void res.status(403).json({ error: "forbidden" });

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
  // shortcut: memory store, counts reset on restart and are per instance; move to a shared store if the API runs on more than one instance
  const blobLimiter = rateLimit({ windowMs: 60_000, limit: 120 });

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

  router.get("/blob/:key", blobLimiter, async (req, res) => {
    if (!deps.db) return void res.status(503).json({ error: "unavailable" });
    let row: { content_type: string; data: Buffer; status: string | null } | undefined;
    try {
      row = (await deps.db.query(SELECT_BLOB, [req.params.key])).rows[0];
    } catch (err) {
      console.error("blob read failed: " + (err instanceof Error ? err.message : "unknown"));
      return void res.status(503).json({ error: "unavailable" });
    }
    // shortcut: a blob with no echo row is 404 until add-a-place audio arrives in Build 4
    if (!row?.status) return void res.status(404).json({ error: "unknown_blob" });
    const { content_type, data, status } = row;
    const send = (cache: string) => void res.set({ "Content-Type": content_type, "Cache-Control": cache }).send(data);
    if (status === "approved") return send("public, max-age=3600");
    // Pending and rejected audio are for curators only.
    await requireVisitor(req, res, () => curatorOnly(req, res, () => send("no-store")));
  });

  router.get("/echoes", requireVisitor, visitorLimiter, curatorOnly, async (req, res) => {
    if (req.query.status !== "pending") return void res.status(400).json({ error: "invalid_status" });
    if (!deps.db) return void res.status(503).json({ error: "unavailable" });
    try {
      const { rows } = await deps.db.query(SELECT_PENDING);
      const echoes = rows.map((r) => ({
        id: r.id,
        siteId: r.site_id,
        createdAt: new Date(r.created_at).toISOString(),
        lang: r.lang,
        transcript: r.transcript,
        audioUrl: r.audio_url,
      }));
      res.set("Cache-Control", "no-store").json(PendingEchoes.parse({ echoes }));
    } catch (err) {
      console.error("pending echoes read failed: " + (err instanceof Error ? err.message : "unknown"));
      res.status(503).json({ error: "unavailable" });
    }
  });
  return router;
}
