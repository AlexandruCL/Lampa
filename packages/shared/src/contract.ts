import { z } from "zod";

export const EventKind = z.enum([
  "wake",
  "talk_turn",
  "colour",
  "lamp",
  "candle",
  "echo_approved",
  "echo_heard",
  "arrived",
]);
export type EventKind = z.infer<typeof EventKind>;

export const SocketMessage = z.enum([
  "glow",
  "pane",
  "window_complete",
  "echo_approved",
  "lamps",
  "candle",
  "finale",
]);
export type SocketMessage = z.infer<typeof SocketMessage>;

export const GlowMessage = z.object({
  sites: z.array(z.object({ siteId: z.string(), glow: z.number().min(0).max(1) })),
});
export type GlowMessage = z.infer<typeof GlowMessage>;

export const Site = z.object({
  id: z.string(),
  name: z.string(),
  lat: z.number(),
  lng: z.number(),
  is_memorial: z.boolean(),
});
export type Site = z.infer<typeof Site>;

export const EventIn = z.object({
  kind: EventKind,
  siteId: z.string(),
  at: z.string().datetime(),
});
export type EventIn = z.infer<typeof EventIn>;

export const EventBatch = z.object({
  events: z.array(EventIn).min(1).max(50),
});
export type EventBatch = z.infer<typeof EventBatch>;

export const EventsAccepted = z.object({ accepted: z.number().int().min(0) });
export type EventsAccepted = z.infer<typeof EventsAccepted>;

const Hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const PaneMessage = z.object({
  siteId: z.string(),
  windowId: z.string(),
  slot: z.number().int().min(0).max(47),
  hex: Hex,
  // The hue bin of the catch (null for a night-glass catch); optional so older senders still parse.
  bin: z.number().int().min(0).max(11).nullable().optional(),
});
export type PaneMessage = z.infer<typeof PaneMessage>;

export const WindowCompleteMessage = z.object({ siteId: z.string(), windowId: z.string() });
export type WindowCompleteMessage = z.infer<typeof WindowCompleteMessage>;

// GET /screen/state, public, fetched by /screen on every socket connect
export const ScreenState = z.object({
  windows: z.array(
    z.object({ siteId: z.string(), windowId: z.string(), panes: z.array(Hex.nullable()).length(48) }),
  ),
  coloursToday: z.number().int().min(0),
});
export type ScreenState = z.infer<typeof ScreenState>;

export const AgentLang = z.enum(["ro", "en", "hu", "de", "sr"]);
export type AgentLang = z.infer<typeof AgentLang>;

// GET /agent/session?site=<id>&lang=<AgentLang>
export const AgentSession = z.object({
  signedUrl: z.string().min(1),
  overrides: z
    .object({
      agent: z.object({
        prompt: z.object({ prompt: z.string() }),
        firstMessage: z.string(),
        language: AgentLang,
      }),
      tts: z.object({ voiceId: z.string() }),
    })
    .optional(),
  dynamicVariables: z.object({
    /** Fills the `site_id` body field of the agent's webhook tools (`get_site_stats`, `get_recent_echo`). */
    site_id: z.string(),
    visitor_name: z.string(),
    local_time: z.string(),
    site_glow: z.number(),
    colours_today: z.number(),
    lamps_lit_today: z.number(),
    sites_visited: z.string(),
    returning_visitor: z.enum(["yes", "no"]),
  }),
});
export type AgentSession = z.infer<typeof AgentSession>;

/** POST /panes body. siteId is "gallery" in remote mode. bin null is night glass. */
export const PaneIn = z.object({
  siteId: z.string(),
  hue: z.number().min(0).max(360),
  saturation: z.number().min(0).max(1),
  lightness: z.number().min(0).max(1),
  hex: z.string().regex(/^#[0-9a-f]{6}$/),
  bin: z.number().int().min(0).max(11).nullable(),
  at: z.string().datetime(),
});
export type PaneIn = z.infer<typeof PaneIn>;

/** POST /panes answers 201 with this. A rate limit answers 429 with Retry-After. */
export const PaneAccepted = z.object({
  windowId: z.string(),
  slot: z.number().int().min(0).max(47),
  count: z.number().int().min(1).max(48),
  completed: z.boolean(),
});
export type PaneAccepted = z.infer<typeof PaneAccepted>;

/** GET /sites?near=<lat>,<lng>, public. Published, active sites within 2000 m, nearest first, at most 5. name is the English name. */
export const NearbySites = z.object({
  sites: z.array(Site.extend({ distance_m: z.number().min(0), glow: z.number().min(0).max(1) })),
});
export type NearbySites = z.infer<typeof NearbySites>;

/** GET /sites/:id?lang=ro|en, public. Any other lang is en. persona is never sent. */
export const SiteDetail = Site.extend({
  radius_m: z.number(),
  interactions: z.array(z.string()),
  facts: z.array(z.unknown()),
  directions_hint: z.string(),
  glow: z.number().min(0).max(1),
});
export type SiteDetail = z.infer<typeof SiteDetail>;

/**
 * POST /echoes is multipart/form-data. The file field is "audio" (audio/webm or audio/mp4).
 * These are its text fields. The phone sends only with consent, so consent is always "true".
 */
export const EchoFields = z.object({
  siteId: z.string(),
  consent: z.literal("true"),
  durationMs: z.coerce.number().int().min(1000).max(20000),
  prompt: z.string().optional(),
});
export type EchoFields = z.infer<typeof EchoFields>;

/** POST /echoes answers 201 with this. Errors: 400 (bad form), 413 (file too large), 429 with Retry-After. */
export const EchoAccepted = z.object({ id: z.string(), status: z.literal("pending") });
export type EchoAccepted = z.infer<typeof EchoAccepted>;
