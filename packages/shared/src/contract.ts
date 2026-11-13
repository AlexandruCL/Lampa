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
