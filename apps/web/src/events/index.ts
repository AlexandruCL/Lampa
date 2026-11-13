import { EventsAccepted, type EventKind } from "@lampa/shared";
import { api } from "../api/client";
import { createEventQueue } from "./queue";

const queue = createEventQueue({
  send: (batch) => api("/events", { method: "POST", body: batch, schema: EventsAccepted }),
});

export function track(kind: EventKind, siteId: string) {
  queue.push(kind, siteId);
  queue.start();
}
