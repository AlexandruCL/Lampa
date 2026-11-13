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
