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

// candle on /live (Fabi's Build 3 row), and the candles in GET /screen/state
export const CandleMessage = z.object({ id: z.string(), siteId: z.string(), litAt: z.string() });
export type CandleMessage = z.infer<typeof CandleMessage>;

// GET /screen/state, public, fetched by /screen on every socket connect
export const ScreenState = z.object({
  windows: z.array(
    z.object({ siteId: z.string(), windowId: z.string(), panes: z.array(Hex.nullable()).length(48) }),
  ),
  coloursToday: z.number().int().min(0),
  candles: z.array(CandleMessage).default([]),
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

// POST /echoes, multipart fields: siteId, consent ("true"), audio (audio/webm or audio/mp4, at most 2 MB). 201:
export const EchoAccepted = z.object({ id: z.string(), status: z.literal("pending") });
export type EchoAccepted = z.infer<typeof EchoAccepted>;

// GET /echoes?status=pending (needs moderate:echo), oldest first
export const PendingEcho = z.object({
  id: z.string(),
  siteId: z.string(),
  createdAt: z.string(),
  lang: z.string().nullable(),
  transcript: z.string().nullable(),
  audioUrl: z.string(), // "/blob/<key>", relative to the API
  siteName: z.string().optional(), // the site's English name from the sites table (Build 4)
});
export type PendingEcho = z.infer<typeof PendingEcho>;
export const PendingEchoes = z.object({ echoes: z.array(PendingEcho) });
export type PendingEchoes = z.infer<typeof PendingEchoes>;

// echo_approved on /live, rooms "screen" and "site:<id>"
export const EchoApprovedMessage = z.object({
  echoId: z.string(),
  siteId: z.string(),
  audioUrl: z.string(),
  transcript: z.string().nullable(),
  lang: z.string().nullable(),
});
export type EchoApprovedMessage = z.infer<typeof EchoApprovedMessage>;

// GET /echoes/approved?site=<id>: the 5 newest approved echoes of the site, newest first (whispers)
export const ApprovedEchoes = z.object({
  echoes: z.array(z.object({ echoId: z.string(), audioUrl: z.string(), lang: z.string().nullable() })),
});
export type ApprovedEchoes = z.infer<typeof ApprovedEchoes>;

// POST /me/claim with an Auth0 token; anonToken is the visitor's anonymous token
export const ClaimIn = z.object({ anonToken: z.string().min(1) });
export type ClaimIn = z.infer<typeof ClaimIn>;
export const ClaimResult = z.object({
  panes: z.number().int().min(0),
  echoes: z.number().int().min(0),
  events: z.number().int().min(0),
});
export type ClaimResult = z.infer<typeof ClaimResult>;

/** The lamps goal of the night of 12 November 1884. */
export const LAMP_TARGET = 731;

/** `lamps` on /live, to every socket: `lamp` events since local midnight city-wide, and for each lamp site the distinct sessions with a `lamp` there in the last 90 s. */
export const LampsMessage = z.object({
  litToday: z.number().int().min(0),
  target: z.literal(LAMP_TARGET),
  sites: z.array(z.object({ siteId: z.string(), lightingNow: z.number().int().min(0) })),
});
export type LampsMessage = z.infer<typeof LampsMessage>;

/** GET /time, public: the server clock in epoch milliseconds. */
export const TimeNow = z.object({ now: z.number().int() });
export type TimeNow = z.infer<typeof TimeNow>;

const SiteGlow = z.object({ siteId: z.string(), glow: z.number().min(0).max(1) });

/** GET /pulse/summary. Glow and colours leave the Cathedral out; visitors are city-wide. */
export const PulseSummary = z.object({
  cityGlow: z.number().min(0).max(1),
  glow: z.array(SiteGlow),
  lampsToday: z.number().int().min(0),
  coloursToday: z.number().int().min(0),
  visitorsToday: z.number().int().min(0),
});
export type PulseSummary = z.infer<typeof PulseSummary>;

/** GET /pulse/colour-clock: the 24 hours of the day (local time) over the last 30 days. */
export const PulseColourClock = z.object({
  hours: z
    .array(z.object({ hour: z.number().int().min(0).max(23), hex: Hex.nullable(), panes: z.number().int().min(0) }))
    .length(24),
  currentHour: z.number().int().min(0).max(23),
});
export type PulseColourClock = z.infer<typeof PulseColourClock>;

/** GET /pulse/interactions: per colour site, interactions per 5 minutes over the last 3 hours, gap-filled. */
export const PulseInteractions = z.object({
  sites: z.array(
    z.object({ siteId: z.string(), points: z.array(z.object({ t: z.string().datetime(), n: z.number().int().min(0) })) }),
  ),
});
export type PulseInteractions = z.infer<typeof PulseInteractions>;

/** GET /pulse/languages: conversations since local midnight, by language. */
export const PulseLanguages = z.object({
  languages: z.array(z.object({ lang: z.string(), conversations: z.number().int().min(1) })),
});
export type PulseLanguages = z.infer<typeof PulseLanguages>;

/** GET /pulse/candles: candles at the memorial in the last 24 hours. No count is ever shown. */
export const PulseCandles = z.object({ candles: z.array(z.object({ id: z.string().min(1), at: z.string().datetime() })) });
export type PulseCandles = z.infer<typeof PulseCandles>;

// Add a place (Cristea, Build 4): POST /sites and POST /sites/:id/publish, behind write:site.
export const PLACE_ID = /^[a-z0-9-]{2,40}$/;
export const PlaceInteraction = z.enum(["talk", "colours", "echo", "lamp"]);
export type PlaceInteraction = z.infer<typeof PlaceInteraction>;
export const PlaceFact = z.object({
  text: z.string().trim().min(10).max(280),
  source: z.string().trim().max(500).regex(/^https:\/\/\S+$/),
});
export const PlaceIn = z.object({
  name: z.object({ ro: z.string().trim().min(2).max(60), en: z.string().trim().min(2).max(60) }),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  facts: z.array(PlaceFact).min(2).max(5),
  persona: z.string().trim().min(10).max(400),
  interactions: z.array(PlaceInteraction).min(1),
});
export type PlaceIn = z.infer<typeof PlaceIn>;
export const PlaceDraft = z.object({ id: z.string().regex(PLACE_ID), status: z.literal("draft") });
export type PlaceDraft = z.infer<typeof PlaceDraft>;
export const PublishStep = z.enum(["greeting", "bed", "live"]);
export type PublishStep = z.infer<typeof PublishStep>;
export const PublishIn = z.object({ step: PublishStep });
export const PublishOut = z.object({ step: PublishStep, credits: z.number().int().min(0) });
export type PublishOut = z.infer<typeof PublishOut>;
