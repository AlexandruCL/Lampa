import { PaneAccepted, PaneIn } from "@lampa/shared";
import { ZodError } from "zod";
import { ApiError, api } from "../api/client";
import type { Reading } from "./reading";

export const GALLERY_ID = "gallery";

export function toPaneIn(reading: Reading, siteId: string, at: Date): PaneIn {
  const { hue, saturation, lightness, hex, bin } = reading;
  return PaneIn.parse({ siteId, hue, saturation, lightness, hex, bin, at: at.toISOString() });
}

export function sendPane(pane: PaneIn): Promise<PaneAccepted> {
  return api("/panes", { method: "POST", body: pane, schema: PaneAccepted });
}

export type PaneStatus =
  | { state: "sending" }
  | { state: "sent"; accepted: PaneAccepted }
  | { state: "waiting"; offline: boolean }
  | { state: "rate_limited" }
  | { state: "dropped" };

// 429 drops; 5xx and 401 wait; a network error waits offline; any other 4xx or a schema failure drops.
function statusFor(error: unknown): PaneStatus {
  if (error instanceof ZodError) return { state: "dropped" };
  if (!(error instanceof ApiError)) return { state: "waiting", offline: true };
  if (error.status === 429) return { state: "rate_limited" };
  if (error.status >= 500 || error.status === 401) return { state: "waiting", offline: false };
  return { state: "dropped" };
}

export function createPaneSender({
  send,
  onStatus,
  intervalMs = 2000,
}: {
  send: (pane: PaneIn) => Promise<PaneAccepted>;
  onStatus: (status: PaneStatus) => void;
  intervalMs?: number;
}): { submit(pane: PaneIn): void; stop(): void } {
  // The one pane in flight or waiting, held in memory only.
  let current: PaneIn | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  async function attempt(pane: PaneIn) {
    timer = null;
    let status: PaneStatus;
    try {
      status = { state: "sent", accepted: await send(pane) };
    } catch (error) {
      status = statusFor(error);
    }
    if (current !== pane) return; // stopped while in flight
    if (status.state === "waiting") timer = setTimeout(() => void attempt(pane), intervalMs);
    else current = null;
    onStatus(status);
  }

  return {
    submit(pane) {
      if (current) return;
      current = pane;
      onStatus({ state: "sending" });
      void attempt(pane);
    },
    stop() {
      if (timer) clearTimeout(timer);
      timer = null;
      current = null;
    },
  };
}
