import { EventsAccepted, type EventKind } from "@lampa/shared";
import { api } from "../api/client";
import { createEventQueue } from "./queue";

const queue = createEventQueue({
  send: (batch) => api("/events", { method: "POST", body: batch, schema: EventsAccepted }),
});

// A locked phone or a switched tab pauses the 2 s timer, so send what is waiting first.
if (typeof document !== "undefined") document.addEventListener("visibilitychange", () => document.hidden && void queue.flush());

export function track(kind: EventKind, siteId: string) {
  queue.push(kind, siteId);
  queue.start();
}
