import { createHmac, timingSafeEqual } from "node:crypto";
import express, { Router } from "express";
import { z } from "zod";
import type { Db } from "../seam.js";

export const SIGNATURE_TOLERANCE_S = 1800;

/** ElevenLabs-Signature is `t=<unix secs>,v0=<hmac sha256 hex of "t.body">`; any v0 may match. A future t is accepted, as in the official SDK. */
export function verifySignature(header: string | undefined, rawBody: Buffer, secret: string, nowMs: number): boolean {
  if (!header) return false;
  const parts = header.split(",");
  const tText = parts.find((p) => p.startsWith("t="))?.slice(2);
  if (!tText) return false;
  const t = Number(tText);
  if (!Number.isFinite(t) || nowMs / 1000 - t > SIGNATURE_TOLERANCE_S) return false;
  const expected = Buffer.from("v0=" + createHmac("sha256", secret).update(`${tText}.`).update(rawBody).digest("hex"));
  return parts
    .filter((p) => p.startsWith("v0="))
    .some((p) => {
      const given = Buffer.from(p);
      return given.length === expected.length && timingSafeEqual(given, expected);
    });
}

const Post = z.object({
  data: z.object({
    conversation_id: z.string(),
    metadata: z.object({ start_time_unix_secs: z.number(), call_duration_secs: z.number().optional() }),
    analysis: z
      .object({ transcript_summary: z.string().optional(), data_collection_results: z.record(z.string(), z.unknown()).optional() })
      .optional(),
    conversation_initiation_client_data: z
      .object({
        dynamic_variables: z.object({ site_id: z.string().optional() }).optional(),
        conversation_config_override: z.object({ agent: z.object({ language: z.string().optional() }).optional() }).optional(),
      })
      .optional(),
  }),
});

export const INSERT_CONVERSATION = `INSERT INTO conversations (ts, conversation_id, site_id, duration_s, lang, summary, data)
VALUES (to_timestamp($1), $2, $3, $4, $5, $6, $7) ON CONFLICT (conversation_id, ts) DO NOTHING`;

export function createElevenLabsWebhookRouter(deps: { db?: Db; now?: () => Date }): Router {
  const router = Router();
  const now = deps.now ?? (() => new Date());
  router.post("/webhooks/elevenlabs", express.raw({ type: "application/json", limit: "1mb" }), async (req, res) => {
    const secret = process.env.ELEVENLABS_WEBHOOK_SECRET; // read per request so tests can set it
    if (!secret) return void res.status(503).json({ error: "unavailable" });
    const raw: Buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
    if (!verifySignature(req.get("ElevenLabs-Signature"), raw, secret, now().getTime())) {
      return void res.status(401).json({ error: "unauthorized" });
    }
    let json: any;
    try {
      json = JSON.parse(raw.toString("utf8"));
    } catch {
      return void res.status(400).json({ error: "invalid_body" });
    }
    if (json?.type !== "post_call_transcription") return void res.json({ ok: true });
    const parsed = Post.safeParse(json);
    if (!parsed.success) return void res.status(400).json({ error: "invalid_body" });
    if (!deps.db) return void res.status(503).json({ error: "unavailable" });
    const { data } = parsed.data;
    const init = data.conversation_initiation_client_data;
    try {
      await deps.db.query(INSERT_CONVERSATION, [
        data.metadata.start_time_unix_secs,
        data.conversation_id,
        init?.dynamic_variables?.site_id ?? null,
        data.metadata.call_duration_secs === undefined ? null : Math.round(data.metadata.call_duration_secs),
        init?.conversation_config_override?.agent?.language ?? "en",
        data.analysis?.transcript_summary ?? null,
        data.analysis?.data_collection_results ?? {},
      ]);
      res.json({ ok: true });
    } catch (err) {
      console.error("webhook failed: " + (err instanceof Error ? err.message : String(err)));
      res.status(503).json({ error: "unavailable" });
    }
  });
  return router;
}
