import type { EventKind } from "@lampa/shared";

export const WEIGHTS: Record<EventKind, number> = {
  wake: 1,
  talk_turn: 0.5,
  colour: 3,
  lamp: 2,
  candle: 0,
  echo_approved: 5,
  echo_heard: 0.2,
  arrived: 0,
};

/** colour is stored by POST /panes and echo_approved by the curator endpoint, so a phone may not send them. */
export const CLIENT_KINDS: EventKind[] = ["wake", "talk_turn", "lamp", "candle", "echo_heard", "arrived"];
