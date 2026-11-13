import { EventBatch, type EventIn, type EventKind } from "@lampa/shared";
import { ZodError } from "zod";
import { ApiError } from "../api/client";

const BATCH_MAX = 50;

// Retry on a network error, 5xx, 401 or 429; drop on any other 4xx or a schema failure (it would never pass).
function shouldRetry(error: unknown): boolean {
  if (error instanceof ZodError) return false;
  if (error instanceof ApiError) {
    return error.status >= 500 || error.status === 401 || error.status === 429;
  }
  return true;
}

export function createEventQueue({
  send,
  intervalMs = 2000,
  cap = 200,
  now = () => new Date(),
}: {
  send: (batch: EventBatch) => Promise<unknown>;
  intervalMs?: number;
  cap?: number;
  now?: () => Date;
}) {
  let events: EventIn[] = [];
  let inFlight: Promise<void> | null = null;
  let timer: ReturnType<typeof setInterval> | null = null;

  function trim() {
    if (events.length > cap) events = events.slice(events.length - cap);
  }

  async function sendOne() {
    const batch = events.splice(0, BATCH_MAX);
    try {
      await send(EventBatch.parse({ events: batch }));
    } catch (error) {
      if (shouldRetry(error)) {
        events = batch.concat(events);
        trim();
      }
    }
  }

  function flush(): Promise<void> {
    if (inFlight) return inFlight;
    if (events.length === 0) return Promise.resolve();
    inFlight = sendOne().finally(() => {
      inFlight = null;
    });
    return inFlight;
  }

  return {
    push(kind: EventKind, siteId: string) {
      events.push({ kind, siteId, at: now().toISOString() });
      trim();
    },
    flush,
    start() {
      timer ??= setInterval(() => void flush(), intervalMs);
    },
    stop() {
      if (timer) clearInterval(timer);
      timer = null;
    },
    size: () => events.length,
  };
}
